/**
 * Florist Service - Flower booking management for funeral homes
 * Multi-tenant aware with tenant resolution middleware
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the correct location (project root)
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[FLORIST] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import knex from 'knex';
import { flowerBookingRouter } from './routes/flowerBookingRoutes.ts';
import flowerSampleRoutes from './routes/flowerSampleRoutes.ts';

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// ============================================
// DATABASE CONNECTION
// ============================================
let floristKnex: knex.Knex | null = null;

const initDatabase = async () => {
    try {
        const DB_HOST = process.env.DB_HOST || 'localhost';
        const DB_USER = process.env.DB_USER || 'root';
        const DB_PASSWORD = process.env.DB_PASSWORD || '';
        const DB_NAME = process.env.DB_NAME || 'restpoint_main';

        floristKnex = knex({
            client: 'mysql2',
            connection: {
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME,
            },
            pool: { min: 2, max: 10 },
        });

        console.log('[FLORIST] Database connection initialized');
        
        // Run migrations using Knex
        await runMigrations();
    } catch (error: any) {
        console.error('[FLORIST] Database initialization failed:', error.message);
        process.exit(1);
    }
};

const runMigrations = async () => {
    if (!floristKnex) return;
    try {
        // Get the directory path for knexfile
        const knexfilePath = path.resolve(__dirname, './knexfile.js');
        console.log(`[FLORIST] Loading knexfile from: ${knexfilePath}`);
        
        // Dynamic import for knexfile
        const knexConfig = await import(knexfilePath);
        const migrationKnex = knex(knexConfig.default?.development || knexConfig.development);
        
        // Check if migrations table exists
        const hasMigrationsTable = await migrationKnex.schema.hasTable('knex_migrations');
        if (!hasMigrationsTable) {
            await migrationKnex.migrate.latest();
            console.log('[FLORIST] Knex migrations completed successfully');
        } else {
            // Check if florist migrations have been run
            const hasFlowerBookings = await migrationKnex.schema.hasTable('flower_bookings');
            if (!hasFlowerBookings) {
                await migrationKnex.migrate.latest();
                console.log('[FLORIST] Knex migrations completed successfully');
            } else {
                // Check if new columns exist (for existing installations)
                const hasQuantity = await migrationKnex.schema.hasColumn('flower_bookings', 'quantity');
                if (!hasQuantity) {
                    await migrationKnex.migrate.latest();
                    console.log('[FLORIST] Additional migrations completed');
                } else {
                    console.log('[FLORIST] Migrations already up to date');
                }
            }
        }
        
        await migrationKnex.destroy();
    } catch (error: any) {
        console.error('[FLORIST] Migration failed:', error.message);
    }
};

// ============================================
// TENANT RESOLUTION MIDDLEWARE
// ============================================
app.use(async (req: any, res: any, next: any) => {
    const tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
    const branchId = req.headers['x-branch-id'] || null;

    req.tenantSlug = tenantSlug;
    req.branchId = branchId;

    console.log(`[FLORIST] Request: ${req.method} ${req.path}`);
    console.log(`[FLORIST] Tenant: ${tenantSlug}, Branch: ${branchId}`);

    if (tenantSlug === 'system_shared') {
        console.log('[FLORIST] Using system_shared tenant (bypassing validation)');
        req.tenant = {
            db_name: process.env.DB_NAME || 'restpoint_main',
            tenant_id: 1,
            name: 'System Shared'
        };
        return next();
    }

    try {
        // @ts-ignore - Dynamic import for shared dbConfig
        const dbConfigPath = path.resolve(__dirname, '../../shared/dbConfig.js');
        console.log(`[FLORIST] Loading dbConfig from: ${dbConfigPath}`);
        
        const dbConfig = await import(dbConfigPath);
        const { resolveDatabase, safeTenantQuery } = dbConfig;

        let dbName = await resolveDatabase(tenantSlug);

        if (!dbName) {
            dbName = tenantSlug.replace(/-/g, '_');
        }

        req.tenant = {
            db_name: dbName,
            tenant_slug: tenantSlug,
            name: tenantSlug
        };
        console.log(`[FLORIST] Tenant resolved: ${dbName}`);

        if (!req.branchId && dbName) {
            const lastDash = tenantSlug.lastIndexOf('-');
            if (lastDash > 0) {
                const branchPart = tenantSlug.substring(lastDash + 1);
                try {
                    const branches = await safeTenantQuery(
                        dbName,
                        'SELECT branch_id FROM branches WHERE branch_slug LIKE ? OR branch_name LIKE ? LIMIT 1',
                        [`%${branchPart}%`, `%${branchPart}%`]
                    );
                    if (branches.length > 0) {
                        req.branchId = branches[0].branch_id.toString();
                        console.log(`[FLORIST] Branch resolved: ${req.branchId}`);
                    }
                } catch (e) {
                    console.log('[FLORIST] Branch resolution skipped:', (e as Error).message);
                }
            }
        }

        // Ensure florist tables exist in tenant database
        if (dbName) {
            try {
                await ensureFloristTables(dbName);
            } catch (tableError: any) {
                console.error(`[FLORIST] Warning: Could not ensure tables in ${dbName}:`, tableError.message);
            }
        }
    } catch (err: any) {
        console.error('[FLORIST] Tenant resolution error:', err.message);
        req.tenant = {
            db_name: process.env.DB_NAME || 'restpoint_main',
            tenant_slug: tenantSlug,
            name: tenantSlug
        };
    }

    next();
});

// ============================================
// ROUTES
// ============================================
console.log('[FLORIST] Registering routes...');
app.use('/florist', flowerBookingRouter);
app.use('/florist/flower-samples', flowerSampleRoutes);

// Health check
app.get('/health', (_req: any, res: any) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'florist-service',
        version: '1.0.0',
        __dirname: __dirname // For debugging
    });
});

// Test endpoint to verify configuration
app.get('/florist/test-config', (_req: any, res: any) => {
    res.json({
        success: true,
        message: 'Florist service is running',
        config: {
            __dirname: __dirname,
            envFile: path.resolve(__dirname, '../../.env'),
            storagePath: process.env.STORAGE_PATH || '/opt/storage/uploads',
            dbName: process.env.DB_NAME || 'restpoint_main'
        }
    });
});

// ============================================
// AUTO-MIGRATION: Ensure florist tables exist in tenant databases
// ============================================
async function ensureFloristTables(dbName: string) {
    try {
        // Create a knex instance for the tenant database
        const tenantKnex = knex({
            client: 'mysql2',
            connection: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: dbName,
            },
            pool: { min: 1, max: 5 },
        });

        console.log(`[FLORIST] Ensuring florist tables in: ${dbName}`);

        // Check if tables already exist
        const hasFlowerBookings = await tenantKnex.schema.hasTable('flower_bookings');
        const hasFlowerCustomers = await tenantKnex.schema.hasTable('flower_customers');
        const hasFlowerPackages = await tenantKnex.schema.hasTable('flower_packages');
        const hasDeliveryZones = await tenantKnex.schema.hasTable('delivery_zones');
        const hasFlowerSamples = await tenantKnex.schema.hasTable('flower_samples');

        if (!hasFlowerBookings || !hasFlowerCustomers || !hasFlowerPackages || !hasDeliveryZones || !hasFlowerSamples) {
            // Ensure flower_samples table exists
            if (!hasFlowerSamples) {
                try {
                    const migrationsPath = path.resolve(__dirname, './migrations/20240625000001_add_flower_samples.js');
                    const migration = await import(migrationsPath);
                    await migration.up(tenantKnex);
                    console.log(`[FLORIST] ✅ flower_samples table created in: ${dbName}`);
                } catch (e) {
                    console.log(`[FLORIST] Creating flower_samples table directly...`);
                    const exists = await tenantKnex.schema.hasTable('flower_samples');
                    if (!exists) {
                        await tenantKnex.schema.createTable('flower_samples', (table) => {
                            table.increments('id').primary();
                            table.string('sample_id', 50).unique();
                            table.string('title', 255).notNullable();
                            table.text('description');
                            table.json('types');
                            table.json('colors');
                            table.json('sizes');
                            table.json('images');
                            table.string('tenant_slug', 100);
                            table.timestamps(true, true);
                        });
                        console.log(`[FLORIST] ✅ flower_samples table created in: ${dbName}`);
                    }
                }
            }
            
            // Run the main migration for other tables
            if (!hasFlowerBookings || !hasFlowerCustomers || !hasFlowerPackages || !hasDeliveryZones) {
                try {
                    const migrationsPath = path.resolve(__dirname, './migrations/20240622000001_create_flower_bookings_tables.js');
                    const migration = await import(migrationsPath);
                    await migration.up(tenantKnex);
                    console.log(`[FLORIST] ✅ Florist tables created in: ${dbName}`);
                } catch (e) {
                    console.error(`[FLORIST] Failed to run main migration:`, e);
                }
            }
        } else {
            console.log(`[FLORIST] ✓ Florist tables already exist in: ${dbName}`);
        }

        await tenantKnex.destroy();
        return true;
    } catch (error: any) {
        console.error(`[FLORIST] ❌ Failed to ensure florist tables in ${dbName}:`, error.message);
        return false;
    }
}

// ============================================
// START SERVER
// ============================================
async function startServer() {
    console.log(`[FLORIST] Starting Florist Service...`);
    console.log(`[FLORIST] Working directory: ${__dirname}`);
    console.log(`[FLORIST] Project root: ${path.resolve(__dirname, '../..')}`);
    
    const mainDb = process.env.DB_NAME || 'restpoint_main';
    console.log(`[FLORIST] Running auto-migration for florist tables in: ${mainDb}`);
    await ensureFloristTables(mainDb);

    console.log('[FLORIST] Checking for tenant databases to migrate...');
    try {
        // Create temporary knex instance to query tenants
        const tempKnex = knex({
            client: 'mysql2',
            connection: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: 'tenant_tracking',
            },
            pool: { min: 1, max: 5 },
        });

        // Check if tenants table exists
        const hasTenants = await tempKnex.schema.hasTable('tenants');
        if (hasTenants) {
            const tenants = await tempKnex('tenants')
                .where({ status: 'active' })
                .select('db_name', 'name');

            console.log(`[FLORIST] Found ${tenants.length} active tenant(s)`);

            for (const tenant of tenants) {
                console.log(`[FLORIST] Migrating tenant: ${tenant.name} (${tenant.db_name})`);
                const success = await ensureFloristTables(tenant.db_name);
                if (success) {
                    console.log(`[FLORIST] ✅ Successfully migrated: ${tenant.name}`);
                } else {
                    console.error(`[FLORIST] ❌ Failed to migrate: ${tenant.name}`);
                }
            }
        } else {
            console.log('[FLORIST] No tenants table found, skipping tenant migration');
        }

        await tempKnex.destroy();
    } catch (error) {
        console.error('[FLORIST] Tenant migration error:', error);
    }

    const PORT = Number(process.env.FLORIST_PORT) || Number(process.env.PORT) || 7070;
    const HOST = process.env.HOST || '0.0.0.0';

    app.listen(PORT, HOST, () => {
        console.log('========================================');
        console.log(`🌺 Florist Service`);
        console.log(`   Port: ${PORT}`);
        console.log(`   Host: ${HOST}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Working Directory: ${__dirname}`);
        console.log(`   DB: ${process.env.DB_NAME || 'not configured'}`);
        console.log(`   Storage: ${process.env.STORAGE_PATH || '/opt/storage/uploads'}`);
        console.log('========================================');
    });
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FLORIST] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[FLORIST] Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[FLORIST] SIGTERM received, shutting down gracefully...');
    if (floristKnex) {
        floristKnex.destroy();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[FLORIST] SIGINT received, shutting down gracefully...');
    if (floristKnex) {
        floristKnex.destroy();
    }
    process.exit(0);
});

// Initialize and start
startServer();

export default app;