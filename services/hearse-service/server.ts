import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { safeTenantQuery, safeTenantExecute, resolveDatabase, getTenantDB, getRootPool } from '../../shared/dbConfig';
import { validateTenantActive } from '../../shared/tenancy';
import asyncHandler from 'express-async-handler';

// Load .env files
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import restpointRoutes from './routes/hearseRoutes';

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});

app.set('io', io);

// Initialize hearse database on startup using knex migrations
const { runMigrations } = require('./database');
runMigrations().catch((err: Error) => {
    console.error('Failed to run hearse database migrations:', err);
});

// Middleware
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id', 'x-branch-id', 'x-branch-code']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_branch', (branchId: string) => {
        socket.join(`branch_${branchId}`);
        console.log(`Socket ${socket.id} joined branch ${branchId}`);
    });
    socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined admin room`);
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Tenant Middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
        let tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
        const branchId = req.headers['x-branch-id'] || null;

        (req as any).tenantSlug = tenantSlug;
        (req as any).branchId = branchId;

        if (tenantSlug === 'system_shared') {
            (req as any).tenant = {
                db_name: process.env.DB_NAME || 'restpoint_main',
                tenant_id: 1,
                name: 'System Shared'
            };
            return next();
        }

        if (req.path.startsWith('/tenants') || req.path.startsWith('/tenant')) {
            let dbName = await resolveDatabase(tenantSlug);

            if (!dbName) {
                dbName = tenantSlug.replace(/-/g, '_');
            }

            let resolvedTenantSlug = tenantSlug;
            let allBranchDbs: string[] | null = null;

            if (dbName && tenantSlug !== 'system_shared') {
                try {
                    const rootPool = await getRootPool();
                    const [tenantRows] = await rootPool.query(
                        'SELECT tenant_slug, id FROM tenant_tracking.tenants WHERE db_name = ? AND status = "active" LIMIT 1',
                        [dbName]
                    );
                    if ((tenantRows as any[]).length > 0) {
                        resolvedTenantSlug = (tenantRows as any[])[0].tenant_slug;
                        const tenantId = (tenantRows as any[])[0].id;
                        const [branchRows] = await rootPool.query(
                            'SELECT branch_slug, branch_db_name FROM tenant_tracking.branch_tracking WHERE tenant_id = ?',
                            [tenantId]
                        );
                        allBranchDbs = (branchRows as any[]).map((r: any) => r.branch_db_name).filter(Boolean);
                    } else {
                        const [branchRows] = await rootPool.query(
                            `SELECT bt.branch_db_name, bt.tenant_id, t.tenant_slug 
                             FROM tenant_tracking.branch_tracking bt
                             JOIN tenant_tracking.tenants t ON bt.tenant_id = t.id
                             WHERE bt.branch_slug = ?`,
                            [tenantSlug]
                        );
                        if ((branchRows as any[]).length > 0) {
                            const row = (branchRows as any[])[0];
                            resolvedTenantSlug = row.tenant_slug;
                            const [siblingRows] = await rootPool.query(
                                'SELECT branch_slug, branch_db_name FROM tenant_tracking.branch_tracking WHERE tenant_id = ?',
                                [row.tenant_id]
                            );
                            allBranchDbs = (siblingRows as any[]).map((r: any) => r.branch_db_name).filter(Boolean);
                            const [tenantRow] = await rootPool.query(
                                'SELECT db_name FROM tenant_tracking.tenants WHERE id = ?',
                                [row.tenant_id]
                            );
                            if ((tenantRow as any[])[0]?.db_name) {
                                allBranchDbs.unshift((tenantRow as any[])[0].db_name);
                            }
                        }
                    }
                } catch (e) {
                    // Non-critical
                }
            }

            (req as any).tenantSlug = resolvedTenantSlug;
            (req as any).currentDbName = dbName;
            (req as any).allBranchDbs = allBranchDbs;
            (req as any).tenant = {
                db_name: dbName,
                tenant_slug: resolvedTenantSlug,
                name: resolvedTenantSlug,
                all_branch_dbs: allBranchDbs
            };

            if (!(req as any).branchId && dbName) {
                try {
                    const branches = await safeTenantQuery(
                        dbName,
                        'SELECT branch_id FROM branches LIMIT 1'
                    );
                    if (branches.length > 0) {
                        (req as any).branchId = branches[0].branch_id.toString();
                    }
                } catch (e) {
                    // Non-critical
                }
            }
        } else {
            (req as any).tenant = {
                db_name: tenantSlug,
                tenant_slug: tenantSlug,
                name: tenantSlug
            };
        }

        next();
    } catch (error) {
        const tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
        (req as any).tenant = {
            db_name: process.env.DB_NAME || 'restpoint_main',
            tenant_slug: tenantSlug,
            name: tenantSlug
        };
        next();
    }
});

// Tenant config endpoint
app.get('/tenants/:tenantSlug/config', asyncHandler(async (req: Request, res: Response) => {
    const { tenantSlug } = req.params;

    try {
        const rootPool = await getRootPool();
        const [tenantRows] = await rootPool.query(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status = "active" LIMIT 1',
            [tenantSlug]
        );

        if (!(tenantRows as any[]).length) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }

        const tenant = (tenantRows as any[])[0];
        let branchCount = 0;
        try {
            const pool = await getTenantDB(tenant.db_name);
            const [branches] = await pool.query('SELECT COUNT(*) as count FROM branches WHERE is_active = TRUE');
            branchCount = (branches as any[])[0]?.count || 0;
        } catch (e) {
            // Branch table may not exist
        }

        const deploymentType = branchCount > 1 ? 'multi' : 'single';

        res.json({
            success: true,
            data: {
                deploymentType,
                branchCount,
                tenantName: tenant.tenant_name,
                tenantSlug: tenant.tenant_slug,
                country: tenant.country,
                location: tenant.location,
                email: tenant.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}));

// Tenant settings endpoint
app.get('/tenant/:tenantSlug/settings', asyncHandler(async (req: Request, res: Response) => {
    const { tenantSlug } = req.params;

    try {
        if ((req as any).tenant && (req as any).tenant.tenant_slug === tenantSlug) {
            let branchCount = 0;
            try {
                const branches = await safeTenantQuery(
                    (req as any).tenant.db_name,
                    'SELECT COUNT(*) as count FROM branches WHERE is_active = TRUE'
                );
                branchCount = branches[0]?.count || 0;
            } catch (e) { }

            res.json({
                success: true,
                data: {
                    deploymentType: branchCount > 1 ? 'multi' : 'single',
                    branchCount,
                    tenantName: (req as any).tenant.tenant_name || (req as any).tenant.name,
                    tenantSlug: (req as any).tenant.tenant_slug || tenantSlug,
                    country: (req as any).tenant.country || 'Kenya',
                    location: (req as any).tenant.location || '',
                    email: (req as any).tenant.email || ''
                }
            });
            return;
        }

        const rootPool = await getRootPool();
        const [tenantRows] = await rootPool.query(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status = "active" LIMIT 1',
            [tenantSlug]
        );

        if (!(tenantRows as any[]).length) {
            res.status(404).json({ success: false, message: 'Tenant not found' });
            return;
        }

        const tenant = (tenantRows as any[])[0];
        let branchCount = 0;
        try {
            const pool = await getTenantDB(tenant.db_name);
            const [branches] = await pool.query('SELECT COUNT(*) as count FROM branches WHERE is_active = TRUE');
            branchCount = (branches as any[])[0]?.count || 0;
        } catch (e) { }

        res.json({
            success: true,
            data: {
                deploymentType: branchCount > 1 ? 'multi' : 'single',
                branchCount,
                tenantName: tenant.tenant_name,
                tenantSlug: tenant.tenant_slug,
                country: tenant.country,
                location: tenant.location,
                email: tenant.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}));

// Tenant branches endpoint
app.get('/tenant/:tenantSlug/branches', asyncHandler(async (req: Request, res: Response) => {
    const { tenantSlug } = req.params;

    try {
        let dbName = (req as any).tenant?.db_name;

        if (!dbName) {
            const rootPool = await getRootPool();
            const [tenantRows] = await rootPool.query(
                'SELECT db_name FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status = "active" LIMIT 1',
                [tenantSlug]
            );
            if (!(tenantRows as any[]).length) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }
            dbName = (tenantRows as any[])[0].db_name;
        }

        const branches = await safeTenantQuery(
            dbName,
            'SELECT branch_id, branch_name, branch_location, branch_slug, branch_phone, branch_email, is_active FROM branches ORDER BY branch_name ASC'
        );

        res.json({ success: true, data: branches || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}));

// Routes
app.use('/', restpointRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        message: 'Hearse Service is running',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        message: 'Hearse Service',
        endpoints: {
            hearses: 'POST/GET /hearses',
            hearse_detail: 'PUT/DELETE /hearses/:id',
            available: 'GET /hearses/available',
            bookings: 'POST/GET /hearse-bookings',
            drivers: 'GET /all-drivers',
            health: 'GET /health'
        }
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found.`,
        available_endpoints: {
            hearses: 'POST/GET /hearses',
            hearse_detail: 'PUT/DELETE /hearses/:id',
            available: 'GET /hearses/available',
            bookings: 'POST/GET /hearse-bookings',
            drivers: 'GET /all-drivers',
            health: 'GET /health'
        }
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
        status: 'error',
        message: 'Internal server error.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = Number(process.env.PORT) || 5002;
server.listen(PORT, () => {
    console.log(`Hearse Service running on port ${PORT}`);
});

export { app, server, io };