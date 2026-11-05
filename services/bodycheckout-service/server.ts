

import { startAsyncSideEffectWorker } from '../app-global/utils/asyncSideEffectQueue';
import { runBodyCheckoutMigrations } from './utilities/migrate';
import Logger from '../../packages/shared-logger/dist/index';
import bodyReleaseRoutes from './routes/routes';


import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.PORT || '8115', 10);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'X-tenant-slug']
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

    res.status(500).json({
        success: false,
        message: 'Internal server error'
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