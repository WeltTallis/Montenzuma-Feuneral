import express, { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import path from 'path';


dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5003', 10);

// ─── Tenant identifier allowlists (audit 2.3) ───────────────────────────────
// Applied BEFORE a value is ever used as a database name or cache key, so a
// crafted header cannot reach INFORMATION_SCHEMA, `mysql`, or another tenant's
// schema. Every slug the platform issues is lowercase-kebab.
const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
// Registered tenant database names are the platform's own generated identifiers
// (e.g. `tenant_acme_home`, `restpoint_acme`). Anything else is refused.
const TENANT_DB_NAME_RE = /^(tenant|restpoint)_[a-z0-9][a-z0-9_]{0,55}$/;

// CORS Configuration — explicit allowlist, never `origin: true` (audit 2.7).
// `origin: true` echoes the caller's Origin and pairs it with
// `Access-Control-Allow-Credentials: true`, which turns every service into a
// credentialed cross-origin resource for any website a logged-in user visits —
// and because each service is also published on its own host port, that bypasses
// the gateway's (correct) CORS entirely.
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

const corsOriginGuard = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Same-origin, curl, server-to-server: no Origin header at all.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin rejected: ${origin}`));
};

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
        'x-internal-secret',
        'Origin',
        'X-Requested-With',
        'Accept'
    ],
}));

// Health check - BEFORE tenant middleware to avoid log spam
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'deceased-service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Root health check for API gateway
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'deceased-service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Tenant Middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantSlug = req.headers['x-tenant-slug'] as string | undefined;
        const branchId = req.headers['x-branch-id'] as string | undefined;

        (req as any).tenantSlug = tenantSlug;
        (req as any).branchId = branchId;

        // Only log non-health-check requests
        if (req.path !== '/health') {
            console.log(`[DECEASED] ${req.method} ${req.path} - Tenant: ${tenantSlug || 'undefined'}`);
        }

        if (!tenantSlug || tenantSlug === 'system_shared') {
            (req as any).tenant = {
                db_name: process.env.DB_NAME || 'restpoint_db',
                tenant_id: 1,
                id: 1,
                name: 'System Shared'
            };
            return next();
        }

        let resolvedDbName: string | null = null;

        // SECURITY + RESILIENCE (audit findings 2.3 and 1.1)
        // ------------------------------------------------------------------
        // This block used to create a BRAND NEW mysql2 pool for every single HTTP
        // request, using the raw `x-tenant-slug` header as the database name, run
        // `SELECT 1` against it, and then tear it down. That was wrong twice over:
        //
        //  (a) SECURITY — the slug was never checked against tenant_tracking.tenants,
        //      so any value naming an existing MariaDB schema was accepted as
        //      "the tenant": `information_schema`, `mysql`, `performance_schema`, or
        //      simply another tenant's db_name. With the wildcard grants in
        //      init-db.sql that is a direct path to reading any schema on the
        //      server, including tenant_tracking.tenants.jwt_secret.
        //
        //  (b) RESILIENCE — two full TCP + auth handshakes per request against a
        //      server capped at max_connections=500. The first burst of traffic
        //      exhausted the server and took every other service down with it.
        //
        // Resolution is now ONE parameterised, circuit-broken, cached lookup
        // against the tenant allowlist, and pools are created once and reused via
        // the shared pool cache. Zero new connections per request.
        try {
            if (!TENANT_SLUG_RE.test(tenantSlug)) {
                throw new Error(`Malformed tenant slug rejected: ${JSON.stringify(tenantSlug)}`);
            }
            const { lookupTenantDatabase } = require('../../shared/dbConfig');
            // Only ever returns a db_name that is registered against an ACTIVE
            // tenant row — never an arbitrary schema name.
            resolvedDbName = await lookupTenantDatabase(tenantSlug);

            // Defence in depth: even if a compromised/malformed row somehow
            // yielded a non-conforming database name, refuse to use it.
            if (resolvedDbName && !TENANT_DB_NAME_RE.test(resolvedDbName)) {
                console.error(`[DECEASED] Refusing non-conforming tenant db name: ${resolvedDbName}`);
                resolvedDbName = null;
            }
        } catch (dbErr: any) {
            // Log but do not 500 — a health check must still be able to report.
            if (req.path !== '/health') {
                console.error('[DECEASED] Tenant database resolution failed:', dbErr?.message || dbErr);
            }
        }

        if (!resolvedDbName) {
            return res.status(403).json({
                success: false,
                message: 'Tenant not found or not active'
            });
        }

        (req as any).tenant = {
            db_name: resolvedDbName,
            id: 0,
            tenant_id: 0,
            name: tenantSlug,
            tenant_slug: tenantSlug
        };

        next();
    } catch (error) {
        console.error('[DECEASED] Tenant middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize tenant database',
            error: error.message
        });
    }
});

// Request logging - only for non-health-check requests
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path !== '/health') {
        console.log(`[DECEASED] ${req.method} ${req.path}`);
    }
    next();
});

// Mount routes
import autopsyRoutes from './routes/autopsyRoutes';
import chargesRoutes from './routes/chargesRoutes';
import chargeSettingsRoutes from './routes/chargeSettingsRoutes';
import postmortemRequestRoutes from './routes/postmortemRequestRoutes';
import nextOfKinRoutes from './routes/nextOfKinRoutes';
import hearseRoutes from './routes/hearseRoutes';
import documentsRoutes from './routes/documentsRoutes';
import deceasedRoutes from './routes/deceasedRoutes';
import exportExelRoutes from './routes/exportExel';
app.use('/', deceasedRoutes);
app.use('/', exportExelRoutes);

app.use('/', nextOfKinRoutes);
app.use('/', hearseRoutes);
app.use('/', documentsRoutes);
app.use('/', autopsyRoutes);
app.use('/', chargesRoutes);
app.use('/', chargeSettingsRoutes);
app.use('/', postmortemRequestRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    console.log(`[404] ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path,
        method: req.method,
        availableRoutes: [
            'GET /health',
            'POST /register-deceased',
            'GET /deceased-id/:id',
            'GET /deceased/:id',
            'GET /:id',
            'GET /deceased',
            'PUT /:id',
            'DELETE /:id',
            'GET /stats'
        ]
    });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server with socket error handling and graceful shutdown
const server = http.createServer({
    insecureHTTPParser: false,
}, app);

// Initialize Socket.IO with the HTTP server
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
    }
});

// Make io available globally for controllers
(global as any).io = io;

// Initialize BullMQ Worker for Excel Export (with graceful Redis fallback)
import { getExcelExportQueue } from './queues/excelExportQueue';
import { startPDFWorker } from './queues/pdfQueue';

// Initialize queues asynchronously - don't block server startup
let excelWorkerStarted = false;

async function initializeQueues() {
    try {
        if (!excelWorkerStarted) {
            const excelQueue = await getExcelExportQueue();
            if (excelQueue) {
                // Only import and start worker if queue is available
                const { createExcelExportWorker } = await import('./workers/excelExportWorker.js');
                const worker = await createExcelExportWorker();
                if (worker) {
                    excelWorkerStarted = true;
                    console.log('[SERVER] Excel export worker initialized');
                } else {
                    console.log('[SERVER] Excel export worker not initialized - Redis not available');
                }
            } else {
                console.log('[SERVER] Excel export worker not initialized - Redis not available');
            }
        }

        // Initialize PDF worker
        startPDFWorker();
    } catch (error: any) {
        console.warn(`[SERVER] Queue initialization failed: ${error.message}`);
    }
}

// Start queue initialization in background
initializeQueues().catch(err => {
    console.warn('[SERVER] Background queue initialization error:', err.message);
});

// RETRY LOOP — previously initializeQueues() ran exactly ONCE at boot. If Redis
// was briefly unavailable (or the worker import failed) the Excel worker never
// started, and every queued export job sat in `bull:excel-export:prioritized`
// FOREVER while the frontend polled "Export in progress..." until timeout.
// Retry every 30s (max 20 tries ≈ 10 min) until the worker is actually running.
let queueInitRetries = 0;
const queueInitTimer = setInterval(() => {
    queueInitRetries += 1;
    if (excelWorkerStarted || queueInitRetries > 20) {
        clearInterval(queueInitTimer);
        if (!excelWorkerStarted) {
            console.warn('[SERVER] Excel export worker could not be started after retries');
        }
        return;
    }
    console.log(`[SERVER] Retrying queue/worker initialization (attempt ${queueInitRetries})...`);
    initializeQueues().catch(err => {
        console.warn('[SERVER] Queue init retry error:', err.message);
    });
}, 30_000);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on('join-tenant', (tenantSlug: string) => {
        socket.join(`tenant:${tenantSlug}`);
        console.log(`[SOCKET] Client ${socket.id} joined tenant: ${tenantSlug}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
});

const gracefulShutdown = (signal: string) => {
    console.log(`[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('[SHUTDOWN] Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    console.error('[SECURITY] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[SECURITY] Uncaught Exception:', err.message);
});

server.on('connection', (socket) => {
    socket.setTimeout(120000);
    socket.on('error', (err) => {
        console.error('[SECURITY] Socket error handled:', err.message);
        socket.destroy();
    });
});

server.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[SECURITY] Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Deceased service running on ${PORT}`);
});

export default app;