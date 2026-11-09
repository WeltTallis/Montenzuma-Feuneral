

import {
    closeAsyncSideEffectResources,
    startAsyncSideEffectWorker,
} from '../app-global/utils/asyncSideEffectQueue';
import { runBodyCheckoutMigrations } from './utilities/migrate';
import Logger from '../../packages/shared-logger/dist/index';
import bodyReleaseRoutes from './routes/routes';
import { closeAllConnections } from '../../shared/dbConfig';


import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.PORT || '8115', 10);
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set(
    [process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL]
        .filter(Boolean)
        .flatMap((value) => String(value).split(','))
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean)
);

// Security headers: this service only serves JSON APIs, so it does not need
// inline scripts, embedded frames, cross-origin resource access, or referrers.
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    xFrameOptions: { action: 'deny' },
}));

app.use(express.json({ limit: '5mb', strict: true }));
app.use(cors({
    origin: (origin, callback) => {
        // Non-browser clients (service-to-service calls, health probes) may
        // omit Origin. Browser callers must match the explicit allowlist.
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
            callback(null, true);
            return;
        }
        callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'Idempotency-Key'],
    maxAge: 600,
    optionsSuccessStatus: 204,
}));


// Tenant Resolution Middleware
app.use((req: any, res: any, next: any) => {
    const tenantSlug = req.headers['x-tenant-slug'] as string;

    if (tenantSlug) {
        req.tenantSlug = tenantSlug;
    }

    next();
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bodycheckout service is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/body-release', bodyReleaseRoutes);

// Express error handler
app.use((err: any, req: any, res: any, next: any) => {
    Logger.error({
        message: 'Unhandled Express error',
        stack: err.stack,
        error: err.message
    });

    if (res.headersSent) {
        next(err);
        return;
    }

    const status = err?.type === 'entity.too.large' ? 413 : err?.message === 'Origin is not allowed by CORS' ? 403 : 500;
    res.status(status).json({
        success: false,
        message: status === 413
            ? 'Request body is too large'
            : status === 403
                ? 'Request origin is not allowed'
                : 'Internal server error'
    });
});

let server: ReturnType<typeof app.listen> | undefined;
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;
let startupTask: Promise<void> | null = null;

// Bootstrap: ensure body-checkout migrations have run on every active tenant
// database before accepting traffic (matches how coffin/florist/hearse work).
async function bootstrap(): Promise<void> {
    try {
        await runBodyCheckoutMigrations();
    } catch (error: any) {
        Logger.error({
            message: 'Body checkout migration bootstrap failed',
            error: error.message,
            stack: error.stack
        });
        throw error;
    }

    if (shuttingDown) return;
    startAsyncSideEffectWorker();
    server = app.listen(PORT, '0.0.0.0', () => {
        Logger.info(`Bodycheckout service running on port ${PORT}`);
    });
    server.on('error', (error) => {
        Logger.error({
            message: 'Bodycheckout HTTP server error',
            error: error.message,
            stack: error.stack,
        });
        void gracefulShutdown('HTTP server error', 1);
    });
}

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    process.exitCode = exitCode;
    Logger.info(`[SHUTDOWN] Bodycheckout received ${signal}; starting shutdown.`);

    const forceExitTimer = setTimeout(() => {
        Logger.error('[SHUTDOWN] Bodycheckout shutdown timed out; forcing exit.');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    const serverClosed = new Promise<void>((resolve, reject) => {
        if (!server?.listening) {
            resolve();
            return;
        }
        server.close((error) => error ? reject(error) : resolve());
    });
    const startupStopped = startupTask
        ? startupTask.catch((error: unknown) => {
            Logger.error({
                message: 'Bodycheckout startup failed during shutdown',
                error: error instanceof Error ? error.message : String(error),
            });
        })
        : Promise.resolve();

    const drainResults = await Promise.allSettled([serverClosed, startupStopped]);
    for (const result of drainResults) {
        if (result.status === 'rejected') {
            const error = result.reason;
            Logger.error({
                message: 'Bodycheckout request drain failed',
                error: error instanceof Error ? error.message : String(error),
            });
            process.exitCode = 1;
        }
    }

    const cleanupResults = await Promise.allSettled([
        Promise.resolve().then(() => closeAsyncSideEffectResources()),
        Promise.resolve().then(() => closeAllConnections()),
    ]);
    for (const result of cleanupResults) {
        if (result.status === 'rejected') {
            const error = result.reason;
            Logger.error({
                message: 'Bodycheckout resource cleanup failed',
                error: error instanceof Error ? error.stack || error.message : String(error),
            });
            process.exitCode = 1;
        }
    }

    clearTimeout(forceExitTimer);
    Logger.info('[SHUTDOWN] Bodycheckout shutdown complete.');
    if (process.exitCode) process.exit(process.exitCode);
}

process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => void gracefulShutdown('SIGINT'));

process.once('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    Logger.error({
        message: 'Unhandled promise rejection in bodycheckout service',
        error: error.message,
        stack: error.stack
    });
    void gracefulShutdown('unhandledRejection', 1);
});

process.once('uncaughtException', (error: Error) => {
    Logger.error({
        message: 'Uncaught exception in bodycheckout service',
        error: error.message,
        stack: error.stack
    });
    void gracefulShutdown('uncaughtException', 1);
});

startupTask = bootstrap();
startupTask.catch((error: unknown) => {
    Logger.error({
        message: 'Bodycheckout service startup failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    void gracefulShutdown('startup failure', 1);
});
