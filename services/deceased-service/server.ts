import {
    closeAsyncSideEffectResources,
    startAsyncSideEffectWorker,
} from '../app-global/utils/asyncSideEffectQueue';
import express, { Request, Response, NextFunction } from 'express';
import Logger from '../../packages/shared-logger/src/index';
import { Server as SocketIOServer } from 'socket.io';
import type { Worker } from 'bullmq';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { randomUUID, timingSafeEqual } from 'crypto';
import { closeAllConnections } from '../../shared/dbConfig';
import { closeExcelExportQueue } from './queues/excelExportQueue';
import { closePDFQueueResources, startPDFWorker } from './queues/pdfQueue';

// Mount routes
import postmortemRequestRoutes from './routes/postmortemRequestRoutes';
import chargeSettingsRoutes from './routes/chargeSettingsRoutes';
import documentsRoutes from './routes/documentsRoutes';
import nextOfKinRoutes from './routes/nextOfKinRoutes';
import deceasedRoutes from './routes/deceasedRoutes';
import autopsyRoutes from './routes/autopsyRoutes';
import chargesRoutes from './routes/chargesRoutes';
import hearseRoutes from './routes/hearseRoutes';
import exportExelRoutes from './routes/exportExel';

const app = express();
dotenv.config();
const { verifyTokenWithFallback } = require('../app-global/middlewares/authMiddleware');
const TENANT_DB_NAME_RE = /^(?!information_schema$|mysql$|performance_schema$|sys$|tenant_tracking$)[a-z0-9][a-z0-9_-]{0,62}$/;
const PORT = parseInt(process.env.PORT || '5003', 10);
const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

// CORS Configuration — explicit allowlist, never `origin: true` (audit 2.7).

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

const corsOriginGuard = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin rejected: ${origin}`));
};

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

// Health check - BEFORE tenant middleware to avoid log spam
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'deceased-service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Root health check for API gateway
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'deceased-service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Redis diagnostics — is the cache actually reachable from THIS container?
app.get('/health/redis', async (req: Request, res: Response) => {
    try {
        const configuredSecret = process.env.INTERNAL_SERVICE_SECRET || '';
        const suppliedSecret = firstHeader(req.headers['x-internal-secret']) || '';
        if (!configuredSecret || suppliedSecret.length !== configuredSecret.length ||
            !timingSafeEqual(Buffer.from(suppliedSecret), Buffer.from(configuredSecret))) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const { redisHealth } = require('../../packages/shared-services/dist/redisService');
        const redis = await redisHealth();
        return res.status(redis.status === 'UP' ? 200 : 503).json({
            service: 'deceased-service',
            redis
        });
    } catch {
        return res.status(500).json({
            service: 'deceased-service',
            redis: { status: 'ERROR' }
        });
    }
});

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 1000 }));

// Duplicate headers arrive from Node as an array — always take the first
// element rather than letting "[ 'a', 'b' ]" flow through as a string.
const firstHeader = (value: unknown): string | undefined => {
    if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : undefined;
    return value === undefined || value === null ? undefined : String(value);
};

// Tenant Middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const parentSlug = firstHeader(req.headers['x-tenant-slug']) || firstHeader(req.headers['x-slug']);
        const branchId = firstHeader(req.headers['x-branch-id']);
        const branchHeader = firstHeader(req.headers['x-branch-db']) || firstHeader(req.headers['x-branch-slug']);
        const tenantSlug = (branchHeader && TENANT_SLUG_RE.test(branchHeader))
            ? branchHeader
            : parentSlug;

        (req as any).tenantSlug = tenantSlug;
        (req as any).parentTenantSlug = parentSlug;
        (req as any).branchId = branchId;

        // Only log non-health-check requests
        if (req.path !== '/health') {
            console.log(`[DECEASED] ${req.method} ${req.path} - Tenant: ${tenantSlug || 'undefined'}`);
        }

        if (tenantSlug === 'system_shared') {
            const configuredSecret = process.env.INTERNAL_SERVICE_SECRET || '';
            const suppliedSecret = firstHeader(req.headers['x-internal-secret']) || '';
            if (!configuredSecret || suppliedSecret.length !== configuredSecret.length ||
                !timingSafeEqual(Buffer.from(suppliedSecret), Buffer.from(configuredSecret))) {
                return res.status(403).json({ success: false, message: 'System tenant access is restricted' });
            }
            (req as any).tenant = {
                db_name: process.env.DB_NAME || 'restpoint_db',
                tenant_id: 1,
                id: 1,
                name: 'System Shared'
            };
            return next();
        }

        if (!tenantSlug) {
            return res.status(403).json({ success: false, message: 'Tenant context is required' });
        }

        let resolvedDbName: string | null = null;

        try {
            if (!TENANT_SLUG_RE.test(tenantSlug)) {
                throw new Error(`Malformed tenant slug rejected: ${JSON.stringify(tenantSlug)}`);
            }
            const { lookupTenantDatabase } = require('../../shared/dbConfig');

            resolvedDbName = await lookupTenantDatabase(tenantSlug)
                || await lookupTenantDatabase(tenantSlug, { requireActive: false });

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
            // Actionable 403: the resolver has already logged WHICH columns were
            // searched and which slugs exist nearby, so add the request context.
            console.warn(
                `[DECEASED] 403 ${req.method} ${req.path} — no tenant database resolved for slug ` +
                `"${tenantSlug || '(missing x-tenant-slug header)'}"`
            );
            return res.status(403).json({
                success: false,
                message: 'Tenant not found or not active'
            });
        }

        (req as any).tenant = {
            db_name: resolvedDbName,
            // A hardcoded 0 here made EVERY branch share the cache namespace
            id: resolvedDbName,
            tenant_id: resolvedDbName,
            name: tenantSlug,
            tenant_slug: tenantSlug
        };

        next();
    } catch (error) {
        const requestId = res.locals.requestId;
        const detail = error instanceof Error ? error.stack || error.message : String(error);
        Logger.error(`[DECEASED] Tenant middleware failed (${requestId}): ${detail}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to initialize tenant database',
            requestId
        });
    }
});



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
    const requestId = res.locals.requestId;
    const detail = err instanceof Error ? err.stack || err.message : String(err);
    Logger.error(`[DECEASED] Request failed (${requestId}) ${req.method} ${req.path}: ${detail}`);
    if (res.headersSent) {
        next(err);
        return;
    }
    const status = err?.type === 'entity.too.large' ? 413 : err?.message?.startsWith('CORS origin rejected:') ? 403 : 500;
    res.status(status).json({
        success: false,
        message: status === 413
            ? 'Request body is too large'
            : status === 403
                ? 'Request origin is not allowed'
                : 'Internal server error',
          requestId
    });
});

// Start server with socket error handling and graceful shutdown
const server = http.createServer({ insecureHTTPParser: false }, app);

// Initialize Socket.IO with the HTTP server
const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Socket.IO must prove the same identity as the HTTP routes before
io.use(async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie || '';
        const accessCookie = cookieHeader.split(';').map((part) => part.trim())
            .find((part) => part.startsWith('access_token='));
        const token = accessCookie ? decodeURIComponent(accessCookie.slice('access_token='.length)) : '';
        if (!token) return next(new Error('Unauthorized'));

        const { decoded } = await verifyTokenWithFallback(token);
        if (!decoded) return next(new Error('Unauthorized'));
        socket.data.user = decoded;
        next();
    } catch {
        next(new Error('Unauthorized'));
    }
});

// Make io available globally for controllers
(global as any).io = io;

// Initialize BullMQ Worker for Excel Export (with graceful Redis fallback)
import { getExcelExportQueue } from './queues/excelExportQueue';

// Initialize queues asynchronously - don't block server startup
let excelWorkerStarted = false;
let shuttingDown = false;
let excelWorker: Worker | null = null;
let queueInitialization: Promise<void> | null = null;

async function initializeQueues() {
    if (shuttingDown) return;
    try {
        if (!excelWorkerStarted) {
            const excelQueue = await getExcelExportQueue();
            if (excelQueue) {
                if (shuttingDown) return;
                startAsyncSideEffectWorker();
                // Only import and start worker if queue is available
                const { createExcelExportWorker } = await import('./workers/richExcelExportWorker.js');
                const worker = await createExcelExportWorker();
                if (worker) {
                    if (shuttingDown) {
                        await worker.close();
                        return;
                    }
                    excelWorker = worker;
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
        await startPDFWorker();
    } catch (error: any) {
        console.warn(`[SERVER] Queue initialization failed: ${error.message}`);
    }
}

// Start queue initialization in background
queueInitialization = initializeQueues();
queueInitialization.catch(err => {
    console.warn('[SERVER] Background queue initialization error:', err.message);
});


let queueInitRetries = 0;
const queueInitTimer = setInterval(() => {
    if (shuttingDown) {
        clearInterval(queueInitTimer);
        return;
    }
    queueInitRetries += 1;
    if (excelWorkerStarted || queueInitRetries > 20) {
        clearInterval(queueInitTimer);
        if (!excelWorkerStarted) {
            console.warn('[SERVER] Excel export worker could not be started after retries');
        }
        return;
    }
    console.log(`[SERVER] Retrying queue/worker initialization (attempt ${queueInitRetries})...`);
    queueInitialization = initializeQueues();
    queueInitialization.catch(err => {
        console.warn('[SERVER] Queue init retry error:', err.message);
    });
}, 30_000);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on('join-tenant', (requested: string | { tenantSlug?: string }, callback?: (result: { success: boolean; message?: string }) => void) => {
        const claims = socket.data.user || {};
        const claimSlug = String(claims.tenantSlug || claims.tenant_slug || '').toLowerCase();
        const claimParentSlug = String(claims.parentTenantSlug || claims.parent_tenant_slug || '').toLowerCase();
        const tenantSlug = (typeof requested === 'string' ? requested : requested?.tenantSlug || '').toLowerCase();
        const isPlatformAdmin = ['systemadmin', 'superadmin'].includes(String(claims.role || '').toLowerCase());
        const authorized = TENANT_SLUG_RE.test(tenantSlug) && (
            isPlatformAdmin || tenantSlug === claimSlug || tenantSlug === claimParentSlug ||
            (!!claimSlug && tenantSlug.startsWith(`${claimSlug}-`))
        );
        if (!authorized) {
            callback?.({ success: false, message: 'Tenant room access denied' });
            return;
        }
        socket.join(`tenant:${tenantSlug}`);
        callback?.({ success: true });
        console.log(`[SOCKET] Authenticated client joined tenant room: ${tenantSlug}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
});

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    process.exitCode = exitCode;
    Logger.info(`[SHUTDOWN] ${signal} received. Starting graceful shutdown.`);
    clearInterval(queueInitTimer);

    const forceExitTimer = setTimeout(() => {
        Logger.error('[SHUTDOWN] Deceased service shutdown timed out; forcing exit.');
        process.exit(1);
    }, 10_000);

    const serverClosed = new Promise<void>((resolve) => {
        if (!server.listening) {
            resolve();
            return;
        }
        io.close(() => resolve());
    });

    const initializationStopped = queueInitialization
        ? queueInitialization.catch((error: unknown) => {
            Logger.error(
                `[SHUTDOWN] Queue initialization failed during shutdown: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        })
        : Promise.resolve();

    const drainResults = await Promise.allSettled([serverClosed, initializationStopped]);
    for (const result of drainResults) {
        if (result.status === 'rejected') {
            const error = result.reason;
            Logger.error(
                `[SHUTDOWN] Request drain failed: ${
                    error instanceof Error ? error.stack || error.message : String(error)
                }`,
            );
            process.exitCode = 1;
        }
    }

    const resourceResults = await Promise.allSettled([
        Promise.resolve().then(() => excelWorker?.close()),
        Promise.resolve().then(() => closeAsyncSideEffectResources()),
        Promise.resolve().then(() => closeExcelExportQueue()),
        Promise.resolve().then(() => closePDFQueueResources()),
        Promise.resolve().then(() => closeAllConnections()),
    ]);

    for (const result of resourceResults) {
        if (result.status === 'rejected') {
            const error = result.reason;
            Logger.error(
                `[SHUTDOWN] Cleanup failed: ${
                    error instanceof Error ? error.stack || error.message : String(error)
                }`,
            );
            process.exitCode = 1;
        }
    }

    clearTimeout(forceExitTimer);
    Logger.info('[SHUTDOWN] Deceased service shutdown complete.');
    if (process.exitCode) process.exit(process.exitCode);
}

process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => void gracefulShutdown('SIGINT'));

process.once('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    Logger.error(`[FATAL] Unhandled promise rejection: ${error.stack || error.message}`);
    void gracefulShutdown('unhandledRejection', 1);
});

process.once('uncaughtException', (error: Error) => {
    Logger.error(`[FATAL] Uncaught exception: ${error.stack || error.message}`);
    void gracefulShutdown('uncaughtException', 1);
});

server.on('connection', (socket) => {
    socket.setTimeout(120000);
    socket.on('error', (err) => {
        Logger.error(`[SECURITY]   Socket  error:   ${err.message}`);
        socket.destroy();
    });
});

server.on('error', (err: NodeJS.ErrnoException) => {
    Logger.error(`[SERVER]   Server  error:    ${err.message}`);
    void gracefulShutdown(
        err.code === 'EADDRINUSE' ? `EADDRINUSE on port ${PORT}` : 'server error',
        1,
    );
});

server.listen(PORT, '0.0.0.0', () => {

    Logger.info(`[SERVER] Deceased  Service   runing   on   port ${PORT}`)

});

export default app;
