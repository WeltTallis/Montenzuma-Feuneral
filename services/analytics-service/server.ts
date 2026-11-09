import path from 'path';
import { randomUUID } from 'crypto';
// Must load .env FIRST before any other module that reads process.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import helmet from 'helmet';
import { validateTenantActive } from '../../shared/tenancy';
import analyticsRoutes from './routes/analyticsRoutes';
import enhancedAnalyticsRoutes from './routes/enhancedAnalyticsRoutes';
import { closeQueue, scheduleDailyOperationsSms } from './services/backgroundJob';

declare global {
  namespace Express {
    interface Request {
      branchId?: string | null;
      tenantSlug?: string;
      tenant?: {
        id?: string;
        db_name?: string;
        tenant_slug?: string;
        [key: string]: unknown;
      };
    }
  }
}

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 5012);
const SHUTDOWN_TIMEOUT_MS = 10_000;

if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error(`Invalid analytics service port: ${process.env.PORT}`);
}

const allowedOrigins = new Set([
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ...(process.env.NODE_ENV === 'production' ? [] : [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ]),
]);

function corsOriginGuard(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void {
  callback(null, !origin || allowedOrigins.has(origin));
}

function getHeaderOrQueryString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.find((entry): entry is string => typeof entry === 'string') || null;
  }
  return null;
}

// Security headers cover health probes as well as application routes.
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  strictTransportSecurity: process.env.NODE_ENV === 'production'
    ? { maxAge: 31_536_000, includeSubDomains: true }
    : false,
  xFrameOptions: { action: 'deny' },
}));

app.use(cors({
  origin: corsOriginGuard,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-slug',
    'x-tenant-slug',
    'x-tenant-id',
    'x-user-id',
    'x-branch-id',
    'x-branch-slug',
    'x-branch-db',
    'x-internal-secret',
    'Origin',
    'X-Requested-With',
    'Accept'
  ],
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = randomUUID();
  next();
});

// Socket.IO setup for real-time analytics updates
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Initialize Socket.IO for background analytics service
try {
  const { setSocketInstance } = require('./services/backgroundAnalytics.service');
  setSocketInstance(io);
  console.log('Background analytics Socket.IO initialized');
} catch (err) {
  console.warn('Background analytics Socket.IO could not be initialized:', err.message);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Tenant Resolution Middleware - handles both single-tenant and multi-branch
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const tenantSlug = getHeaderOrQueryString(
    req.headers['x-tenant-slug'] || req.headers['x-tenant-id'],
  ) || 'system_shared';
  const branchId =
    getHeaderOrQueryString(req.headers['x-branch-id']) ||
    getHeaderOrQueryString(req.query.branchId);

  req.tenantSlug = tenantSlug;
  req.branchId = branchId;

  if (tenantSlug !== 'system_shared') {
    let tenantStatus;
    try {
      tenantStatus = await validateTenantActive(tenantSlug);
    } catch (error) {
      next(error);
      return;
    }

    if (!tenantStatus.active) {
      // If tenant is not found (404) - block the request
      if (tenantStatus.reason && tenantStatus.reason.includes('not found')) {
        return res.status(404).json({ success: false, message: tenantStatus.reason });
      }
      // If DB connection error (Docker not running / network) - allow for development
      if (tenantStatus.reason && tenantStatus.reason.includes('Error validating')) {
        console.warn(`[Tenant] DB unavailable, allowing request for "${tenantSlug}" (dev mode)`);
        req.tenant = { id: tenantSlug, db_name: tenantSlug, tenant_slug: tenantSlug };
        return next();
      }
      // If inactive tenant - block
      return res.status(403).json({ success: false, message: tenantStatus.reason });
    }
    req.tenant = tenantStatus.tenant;
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'analytics-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// Analytics routes - mounted at root, gateway will proxy /analytics/... to these routes
// Frontend calls /api/v1/restpoint/analytics/deceased/count
// Gateway strips /api/v1/restpoint and proxies /analytics/deceased/count here
app.use('/', analyticsRoutes);

// Enhanced analytics routes
app.use('/enhanced', enhancedAnalyticsRoutes);

// Deceased analytics routes (TypeScript)
try {
  const deceasedAnalyticsRoutes = require('./routes/deceasedAnalytics.routes').default;
  app.use('/', deceasedAnalyticsRoutes);
  console.log('Deceased analytics routes loaded');
} catch (err) {
  console.warn('Deceased analytics routes could not be loaded:', err.message);
}

// Hearse analytics routes (TypeScript)
try {
  const hearseAnalyticsRoutes = require('./routes/hearseAnalytics.routes').default;
  app.use('/', hearseAnalyticsRoutes);
  console.log('Hearse analytics routes loaded');
} catch (err) {
  console.warn('Hearse analytics routes could not be loaded:', err.message);
}

// Flower booking analytics routes (TypeScript)
try {
  const flowerBookingAnalyticsRoutes = require('./routes/flowerBookingAnalytics.routes').default;
  app.use('/', flowerBookingAnalyticsRoutes);
  console.log('Flower booking analytics routes loaded');
} catch (err) {
  console.warn('Flower booking analytics routes could not be loaded:', err.message);
}

// Workshop analytics routes (TypeScript)
try {
  const workshopAnalyticsRoutes = require('./routes/workshopAnalytics.routes').default;
  app.use('/', workshopAnalyticsRoutes);
  console.log('Workshop analytics routes loaded');
} catch (err) {
  console.warn('Workshop analytics routes could not be loaded:', err.message);
}

let analyticsWorker: { close: () => Promise<void> } | undefined;

// Start analytics worker (BullMQ) so background jobs are processed
try {
  analyticsWorker = require('./workers-analyticsWorker').worker;
  console.log('Analytics worker started');
} catch (err) {
  console.warn('Analytics worker could not be started:', err.message);
}

scheduleDailyOperationsSms().catch((err) => {
  console.error('Daily operations SMS schedule could not be registered:', err.message || err);
});

// Metrics endpoint (Prometheus)
try {
  const metrics = require('./services/metrics');
  app.get('/metrics', metrics.metricsEndpoint);
  console.log('Metrics endpoint exposed at /metrics');
} catch (err) {
  console.warn('Metrics module could not be initialized:', err.message || err);
}

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${res.locals.requestId || 'unknown'}] Analytics request failed: ${message}`);
  res.status(500).json({
    success: false,
    message: 'An unexpected analytics error occurred.',
    requestId: res.locals.requestId,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Join tenant-specific room for targeted updates
  socket.on('join_tenant', (tenantSlug) => {
    if (tenantSlug) {
      socket.join(`tenant_${tenantSlug}`);
      console.log(`[Socket.IO] ${socket.id} joined tenant: ${tenantSlug}`);
    }
  });

  // Join dashboard room for real-time dashboard updates
  socket.on('join_dashboard', () => {
    socket.join('dashboard');
    console.log(`[Socket.IO] ${socket.id} joined dashboard room`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Periodic dashboard data push (every 30 seconds)
let shuttingDown = false;
const heartbeatTimer = setInterval(() => {
  try {
    // This will be called by the comprehensive dashboard controller
    // when clients request it. For now, just keep the connection alive.
    io.to('dashboard').emit('heartbeat', {
      timestamp: new Date().toISOString(),
      message: 'Analytics service alive'
    });
  } catch (error) {
    console.error(
      '[Socket.IO] Heartbeat error:',
      error instanceof Error ? error.message : String(error),
    );
  }
}, 30000);

async function shutdown(signal: string, exitCode: number): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  console.error(`[analytics-service] ${signal}; shutting down`);

  clearInterval(heartbeatTimer);

  const forceExitTimer = setTimeout(() => {
    console.error('[analytics-service] Shutdown timed out; forcing exit');
    process.exit(exitCode || 1);
  }, SHUTDOWN_TIMEOUT_MS);

  const cleanupTasks: Promise<unknown>[] = [
    Promise.resolve().then(() => closeQueue()),
    ...(analyticsWorker
      ? [Promise.resolve().then(() => analyticsWorker?.close())]
      : []),
    new Promise<void>((resolve, reject) => {
      if (!server.listening) {
        resolve();
        return;
      }
      io.close((error?: Error) => error ? reject(error) : resolve());
    }),
  ];
  const results = await Promise.allSettled(cleanupTasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      const error = result.reason;
      console.error(
        '[analytics-service] Shutdown cleanup failed:',
        error instanceof Error ? error.stack || error.message : String(error),
      );
      process.exitCode = process.exitCode || 1;
    }
  }

  clearTimeout(forceExitTimer);
  process.exit(process.exitCode || 0);
}

process.once('SIGTERM', () => void shutdown('SIGTERM', 0));
process.once('SIGINT', () => void shutdown('SIGINT', 0));
process.once('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error('[analytics-service] Unhandled promise rejection:', error.stack || error.message);
  void shutdown('unhandledRejection', 1);
});
process.once('uncaughtException', (error: Error) => {
  console.error('[analytics-service] Uncaught exception:', error.stack || error.message);
  void shutdown('uncaughtException', 1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`analytics-service is running on port ${PORT} with Socket.IO`);
});