import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { ensureCoffinDatabase, runCoffinMigrations, closeCoffinDb } from './db.js';
import logger from '@montezuma/shared-logger';
// Load service-specific .env first, then root .env for shared config (with override)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Load routes AFTER .env is loaded so dbConfig can read DB credentials
import coffinRoutes from './routes/coffinRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8108', 10);

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10                   // Max 10 files
  }
});

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant-slug',
    'x-tenant-id',
    'x-user-id',
    'x-branch-id',
    'x-branch-slug',
    'x-branch-code',
    'x-branch-db'
  ]
};

logger.info({ msg: 'Starting coffin service...' });

process.on('uncaughtException', (error: any) => {
  logger.error({ msg: 'Uncaught Exception', error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error({ msg: 'Unhandled Rejection', reason: reason?.message || reason });
  process.exit(1);
});

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make upload available to routes
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).upload = upload;
  next();
});

// Tenant middleware - resolves the tenant slug/id from headers. Coffin data
// (inventory, orders, stock requests, images, usage) lives in ONE central coffin
// database shared by ALL tenants, scoped via the tenant_slug (and tenant_id)
// columns. No per-tenant database resolution is performed here.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
    const tenantIdHeader = req.headers['x-tenant-id'];
    const branchIdHeader = req.headers['x-branch-id'];
    const branchSlugHeader = req.headers['x-branch-slug'];

    (req as any).tenantSlug = tenantSlug;
    (req as any).tenantId = tenantIdHeader ? (Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader) : null;
    (req as any).branchId = branchIdHeader ? (Array.isArray(branchIdHeader) ? branchIdHeader[0] : branchIdHeader) : null;
    (req as any).branchSlug = branchSlugHeader ? (Array.isArray(branchSlugHeader) ? branchSlugHeader[0] : branchSlugHeader) : null;

    // The central coffin database serves every tenant - the tenant is identified
    // by slug and/or id, not by a dedicated database.
    (req as any).tenant = {
      db_name: process.env.OPERATIONS_DATABASE || process.env.DB_NAME || 'restpoint_operations',
      tenant_slug: tenantSlug,
      tenant_id: (req as any).tenantId,
      tenant_name: tenantSlug,
      branch_id: (req as any).branchId || null
    };

    next();
  } catch (error: any) {
    logger.error({ msg: 'Middleware error', error: error.message });
    res.status(500).json({
      success: false,
      message: 'Middleware error',
      error: error.message
    });
  }
});

// ─── ROUTES ──────────────────────────────────────────────────────────────

// Mount routes - all paths match the controller exports
app.use('/coffins', coffinRoutes);

// ─── HEALTH CHECK ──────────────────────────────────────────────────────

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    tenant: (req as any).tenantSlug || 'system_shared',
    timestamp: new Date().toISOString()
  });
});

app.get('/coffins/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    tenant: (req as any).tenantSlug || 'system_shared',
    timestamp: new Date().toISOString()
  });
});

// ─── ROOT ENDPOINT ─────────────────────────────────────────────────────

app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Coffin Service',
    tenant: (req as any).tenantSlug || 'system_shared',
    endpoints: {
      'Coffin CRUD': {
        create: 'POST /coffins',
        list: 'GET /coffins',
        detail: 'GET /coffins/:id',
        update: 'PUT /coffins/:id',
        delete: 'DELETE /coffins/:id',
        allBranches: 'GET /coffins/all-branches'
      },
      'Orders (Bookings)': {
        create: 'POST /coffins/orders',
        list: 'GET /coffins/orders',
        detail: 'GET /coffins/orders/:id',
        updateStatus: 'PATCH /coffins/orders/:id/status'
      },
      'Stock Requests': {
        create: 'POST /coffins/stock-requests',
        list: 'GET /coffins/stock-requests',
        detail: 'GET /coffins/stock-requests/:id',
        updateStatus: 'PATCH /coffins/stock-requests/:id/status'
      },
      health: 'GET /health'
    }
  });
});

// ─── 404 HANDLER ────────────────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  logger.info({ msg: 'Route not found', method: req.method, url: req.originalUrl });
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if ((err as any).code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  logger.error({
    msg: 'Unhandled Error',
    error: err?.message,
    stack: err?.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err?.message : undefined
  });
});

// ─── START SERVER ──────────────────────────────────────────────────────

async function startServer() {
  try {
    // The coffin service owns ONE central database that serves all tenants.
    // Run its own knex migrations independently before accepting traffic.
    await ensureCoffinDatabase();
    await runCoffinMigrations();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info({
        msg: 'Coffin Service running',
        port: PORT,
        health: `http://localhost:${PORT}/health`,
        endpoints: `http://localhost:${PORT}/`,
        centralDb: process.env.OPERATIONS_DATABASE || 'restpoint_operations'
      });
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ msg: `Port ${PORT} is already in use. Please use a different port.` });
        process.exit(1);
      } else {
        logger.error({ msg: 'Server error', error: error.message });
      }
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info({ msg: `Received ${signal}, shutting down gracefully...` });
      server.close(() => {
        closeCoffinDb()
          .then(() => {
            logger.info({ msg: 'Server closed successfully' });
            process.exit(0);
          })
          .catch((error: any) => {
            logger.error({ msg: 'Failed to close coffin database', error: error.message, stack: error.stack });
            process.exit(1);
          });
      });
      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.warn({ msg: 'Forceful shutdown after timeout' });
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error: any) {
    logger.error({ msg: 'Failed to start server', error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
