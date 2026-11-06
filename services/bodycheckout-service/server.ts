

import { startAsyncSideEffectWorker } from '../app-global/utils/asyncSideEffectQueue';
import { runBodyCheckoutMigrations } from './utilities/migrate';
import Logger from '../../packages/shared-logger/dist/index';
import bodyReleaseRoutes from './routes/routes';


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

// Bootstrap: ensure body-checkout migrations have run on every active tenant
// database before accepting traffic (matches how coffin/florist/hearse work).
async function bootstrap(): Promise<void> {
    startAsyncSideEffectWorker();
    try {
        await runBodyCheckoutMigrations();
    } catch (error: any) {
        Logger.error({
            message: 'Body checkout migration bootstrap failed',
            error: error.message,
            stack: error.stack
        });
    }

    server = app.listen(PORT, '0.0.0.0', () => {
        Logger.info(`Bodycheckout service running on port ${PORT}`);
    });
}

bootstrap();



process.on('uncaughtException', (error) => {

    Logger.error({
        message: 'Uncaught Exception    bodycheckout  service',
        error: error.message,
        stack: error.stack
    });

    // Stop accepting new requests
    server?.close(() => {
        process.exit(1);
    });

    // Force exit if shutdown hangs
    setTimeout(() => process.exit(1), 5000);

});

process.on('unhandledRejection', (reason: any) => {
    Logger.error({
        message: 'Unhandled Promise Rejection    bodycheckout   service',
        error: reason?.message || String(reason),
        stack: reason?.stack
    });

    server?.close(() => {
        Logger.error({

            message: "  Process   Closed  and  exited Bodycheckout  service",

        })
        process.exit(1);
    });

    setTimeout(() => process.exit(1), 5000);
});
