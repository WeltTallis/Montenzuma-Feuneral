/**
 * Florist Service - Flower booking management for funeral homes
 * Multi-tenant aware with tenant resolution middleware
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

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

// The route modules below transitively import app-global authMiddleware,
// which reads JWT_SECRET / NODE_ENV from process.env while the module is
// being evaluated. ES module static imports are hoisted and would execute
// BEFORE the dotenv.config() above, crashing the service with
// "FATAL: JWT_SECRET environment variable is required" even though the root
// .env contains a JWT_SECRET. Load them dynamically so they run after
// dotenv has populated the environment.
const { flowerBookingRouter } = await import('./routes/flowerBookingRoutes.ts');
const flowerSampleRoutes = (await import('./routes/flowerSampleRoutes.ts')).default;

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
let floristServer: ReturnType<typeof app.listen> | null = null;

const initDatabase = async () => {
    try {
        const DB_HOST = process.env.DB_HOST || 'localhost';
        const DB_USER = process.env.DB_USER || 'root';
        const DB_PASSWORD = process.env.DB_PASSWORD || '';
        const DB_NAME = process.env.OPERATIONS_DATABASE || 'restpoint_operations';


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
        const knexfilePath = path.resolve(__dirname, './knexfile.ts');
        console.log(`[FLORIST] Loading knexfile from: ${knexfilePath}`);

        // Dynamic import for knexfile
        const knexConfig = await import(pathToFileURL(knexfilePath).href);
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
                const hasFlowerType = await migrationKnex.schema.hasColumn('flower_bookings', 'flower_type');
                const flowerTypeInfo = hasFlowerType
                    ? await migrationKnex('flower_bookings').columnInfo('flower_type')
                    : null;
                const flowerType = String(flowerTypeInfo?.type || '').toLowerCase();
                const needsFlowerTypeExpansion = !flowerType.includes('mediumtext') && !flowerType.includes('longtext');
                if (!hasQuantity || needsFlowerTypeExpansion) {
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
// FLOWER DATABASE RESOLUTION
//   ALL flower data lives in the ONE central
//   `restpoint_operations` database shared by
//   every tenant. Isolated via tenant_slug
//   (and tenant_id) columns inside that database.
// ============================================
const FLOWER_MAIN_DB = (): string => process.env.OPERATIONS_DATABASE || 'restpoint_operations';

// Resolves the database that stores flower (florist) data for a tenant.
// In the new architecture ALL florist data lives in the ONE central
// `restpoint_operations` database shared by every tenant. Tenant isolation
// is handled via the tenant_slug column inside that database.
async function resolveFlowerDatabase(tenantSlug: string): Promise<{ dbName: string; deploymentType: string }> {
    const mainDb = FLOWER_MAIN_DB();
    // All florist data lives in the ONE central operations database now.
    return { dbName: mainDb, deploymentType: 'single' };
}

// ============================================
// TENANT RESOLUTION MIDDLEWARE
// ============================================
app.use(async (req: any, res: any, next: any) => {
    const tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
    const branchId = req.headers['x-branch-id'] || null;

    req.tenantSlug = tenantSlug;
    req.tenantId = req.headers['x-tenant-id'] || req.headers['x-tenant_id'] || null;
    req.branchId = branchId;

    console.log(`[FLORIST] Request: ${req.method} ${req.path}`);
    console.log(`[FLORIST] Tenant: ${tenantSlug}, Branch: ${branchId}`);

    if (tenantSlug === 'system_shared') {
        console.log('[FLORIST] Using system_shared tenant (bypassing validation)');
        req.tenant = {
            db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',

            tenant_id: 1,
            name: 'System Shared'
        };
        return next();
    }

    try {
        // Resolve the central operations database for flower data.
        // All florist data lives in the ONE central `restpoint_operations` DB.
        const { dbName, deploymentType } = await resolveFlowerDatabase(tenantSlug);

        req.tenant = {
            db_name: dbName,
            tenant_slug: tenantSlug,
            name: tenantSlug,
            deployment_type: deploymentType
        };
        console.log(`[FLORIST] Tenant resolved → db: ${dbName} [${deploymentType}]`);

        // Ensure florist tables exist in the flower database
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
            db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
            tenant_slug: tenantSlug,
            name: tenantSlug,
            deployment_type: 'single'
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
// Alias so the classic "flower-arrangements" path also works
app.use('/florist/flower-arrangements', flowerSampleRoutes);

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
            dbName: process.env.OPERATIONS_DATABASE || 'restpoint_operations'
        }
    });
});

// ============================================
// AUTO-MIGRATION: Ensure florist tables exist in tenant databases
// ============================================
// knex 3.x removed createTableIfNotExists — use hasTable + createTable with
// race-tolerant handling (concurrent init on this same DB is safe).
async function ensureFloristTable(tenantKnex: any, name: string, build: (t: any) => void) {
    const exists = await tenantKnex.schema.hasTable(name);
    if (exists) return;
    try {
        await tenantKnex.schema.createTable(name, build);
        console.log(`[FLORIST]  table created: ${name}`);
    } catch (e: any) {
        const msg = String(e.message || '');
        // Ignore if a concurrent initializer already created it
        if (!msg.includes('ER_TABLE_EXISTS_ERROR') && !msg.toLowerCase().includes('already exists')) {
            throw e;
        }
    }
}

async function ensureFloristTables(dbName: string) {
    let tenantKnex: any = null;
    try {
        tenantKnex = knex({
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

        // flower_bookings (simplified: arrangements + orders only, no delivery/e-commerce)
        await ensureFloristTable(tenantKnex, 'flower_bookings', (table) => {
            table.increments('id').primary();
            table.string('booking_id', 50).unique().notNullable();
            table.string('tenant_slug', 100).notNullable();
            table.text('flower_type', 'mediumtext').notNullable();
            table.text('flower_description');
            table.text('service_type');
            table.string('customer', 255).notNullable();
            table.string('customer_phone', 20);
            table.string('customer_email', 255);
            table.string('deceased_name', 255);
            table.string('branch', 100).notNullable();
            table.string('arrangement_id', 50);
            table.date('date').notNullable();
            table.time('time').notNullable();
            table.string('status', 50).defaultTo('pending');
            table.text('notes');
            table.string('created_by', 255);
            table.timestamp('created_at').defaultTo(tenantKnex.fn.now());
            table.timestamp('updated_at').defaultTo(tenantKnex.fn.now());

            table.index(['booking_id'], 'idx_booking_id');
            table.index(['tenant_slug'], 'idx_flower_tenant');
            table.index(['status'], 'idx_status');
            table.index(['date'], 'idx_date');
            table.index(['customer'], 'idx_customer');
            table.index(['branch'], 'idx_branch');
            table.index(['created_at'], 'idx_created_at');
            table.string('deceased_gender', 40); // Add the new column for deceased gender
        });

        await ensureFloristTable(tenantKnex, 'flower_announcements', (table) => {
            table.increments('id').primary();
            table.string('tenant_slug', 100).notNullable();
            table.string('tenant_id', 36).nullable();
            table.string('title', 120).notNullable();
            table.text('message').notNullable();
            table.string('created_by', 255).nullable();
            table.timestamp('created_at').defaultTo(tenantKnex.fn.now());
            table.index(['tenant_id', 'created_at'], 'idx_flower_announcements_tenant_id');
            table.index(['tenant_slug', 'created_at'], 'idx_flower_announcements_tenant_slug');
        });

        // flower_samples — must expose `arrangement_id` (used by controllers)
        await ensureFloristTable(tenantKnex, 'flower_samples', (table) => {
            table.increments('id').primary();
            table.string('arrangement_id', 50);
            table.string('title', 255).notNullable();
            table.text('description');
            table.json('types');
            table.json('colors');
            table.json('sizes');
            table.json('images');
            table.string('tenant_slug', 100).index();
            table.timestamp('created_at').defaultTo(tenantKnex.fn.now());
            table.timestamp('updated_at').defaultTo(tenantKnex.fn.now());
        });

        // If flower_samples pre-existed with an old schema (sample_id), migrate to arrangement_id
        if (await tenantKnex.schema.hasColumn('flower_samples', 'sample_id')) {
            if (!await tenantKnex.schema.hasColumn('flower_samples', 'arrangement_id')) {
                await tenantKnex.schema.alterTable('flower_samples', (table) => {
                    table.string('arrangement_id', 50).after('id');
                });
            }
            // Copy data from sample_id to arrangement_id if arrangement_id is null
            await tenantKnex('flower_samples')
                .whereNull('arrangement_id')
                .update({ arrangement_id: tenantKnex.raw('sample_id') });
            // Make arrangement_id unique and not nullable
            try {
                await tenantKnex.schema.alterTable('flower_samples', (table) => {
                    table.string('arrangement_id', 50).notNullable().unique().alter();
                });
            } catch (e) {
                // Index might already exist, continue
            }
        } else if (!await tenantKnex.schema.hasColumn('flower_samples', 'arrangement_id')) {
            await tenantKnex.schema.alterTable('flower_samples', (table) => {
                table.string('arrangement_id', 50).after('id');
            });
        }

        // Ensure tenant_id columns exist (tenant-id based scoping)
        if (!(await tenantKnex.schema.hasColumn('flower_bookings', 'tenant_id'))) {
            await tenantKnex.schema.alterTable('flower_bookings', (table) => {
                table.string('tenant_id', 36);
            });
        }
        if (!(await tenantKnex.schema.hasColumn('flower_samples', 'tenant_id'))) {
            await tenantKnex.schema.alterTable('flower_samples', (table) => {
                table.string('tenant_id', 36);
            });
        }

        // "Expected By" deadline is optional - allow bookings that do not have
        // a date/time chosen yet.
        try {
            await tenantKnex.raw('ALTER TABLE `flower_bookings` MODIFY COLUMN `date` DATE NULL');
            await tenantKnex.raw('ALTER TABLE `flower_bookings` MODIFY COLUMN `time` TIME NULL');
        } catch (e) {
            console.warn('[FLORIST] Could not relax date/time columns:', (e as any).message);
        }

        // Ensure booking extra columns exist on flower_bookings.
        // The createBooking controller INSERTs ribbon_color and size (sent by
        // the frontend via FlowerBookingsNew.jsx), and migration
        // 20240625000001_add_booking_extras.js adds ribbon_color/quantity/
        // arrangements/primary_color/accent_color. On tables created by
        // ensureFloristTable (simplified schema) or on existing installs where
        // that migration never ran, these columns are missing and the INSERT
        // fails with "Unknown column 'ribbon_color' in 'INSERT INTO'".
        // This guard is idempotent and mirrors the tenant_id column pattern above.
        const bookingExtraColumns = [
            { name: 'quantity', sqlType: 'INT DEFAULT 1' },
            { name: 'arrangements', sqlType: 'TEXT' },
            { name: 'primary_color', sqlType: 'VARCHAR(100)' },
            { name: 'accent_color', sqlType: 'VARCHAR(100)' },
            { name: 'ribbon_color', sqlType: 'VARCHAR(100)' },
            { name: 'size', sqlType: 'VARCHAR(50)' },
            { name: 'ribbon_message', sqlType: 'TEXT' },
            { name: 'special_instructions', sqlType: 'TEXT' },
            { name: 'funeral_date', sqlType: 'DATE' },
            { name: 'service_type', sqlType: 'TEXT' },
            { name: 'deceased_gender', sqlType: 'VARCHAR(40)' },
            { name: 'sample_images', sqlType: 'TEXT' },
        ];
        for (const col of bookingExtraColumns) {
            if (!(await tenantKnex.schema.hasColumn('flower_bookings', col.name))) {
                await tenantKnex.raw(
                    `ALTER TABLE \`flower_bookings\` ADD COLUMN \`${col.name}\` ${col.sqlType} NULL`
                );
                console.log(`[FLORIST] Added missing column '${col.name}' to flower_bookings`);
            }
        }
        // Existing installs may still have the original VARCHAR(50) limit.
        // Service type is free text, so widen it without restricting its value.
        await tenantKnex.raw('ALTER TABLE `flower_bookings` MODIFY COLUMN `service_type` TEXT NULL');

        console.log(`[FLORIST] ✓ Florist tables ready in: ${dbName}`);
        return true;
    } catch (error: any) {
        console.error(`[FLORIST] ⚠ Failed to ensure florist tables in ${dbName}:`, error.message);
        return false;
    } finally {
        if (tenantKnex) {
            try { await tenantKnex.destroy(); } catch (e) { /* ignore */ }
        }
    }
}

// ============================================
// START SERVER
// ============================================
async function startServer() {
    console.log(`[FLORIST] Starting Florist Service...`);
    console.log(`[FLORIST] Working directory: ${__dirname}`);
    console.log(`[FLORIST] Project root: ${path.resolve(__dirname, '../..')}`);

    const mainDb = process.env.OPERATIONS_DATABASE || 'restpoint_operations';
    console.log(`[FLORIST] Running auto-migration for florist tables in: ${mainDb}`);
    await ensureFloristTables(mainDb);

    console.log('[FLORIST] All florist tables are created directly in the shared operations database — no per-tenant databases are created or migrated anymore.');

    const PORT = Number(process.env.FLORIST_PORT) || Number(process.env.PORT) || 7070;
    const HOST = process.env.HOST || '0.0.0.0';

    floristServer = app.listen(PORT, HOST, () => {
        console.log(`   DB: ${process.env.OPERATIONS_DATABASE || 'restpoint_operations'}`);
        console.log(`   Storage: ${process.env.STORAGE_PATH || '/opt/storage/uploads'}`);

    });
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[FLORIST] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[FLORIST] Uncaught Exception:', error);
    process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[FLORIST] ${signal} received, shutting down gracefully...`);

    const forceExit = setTimeout(() => {
        console.error('[FLORIST] Forced shutdown after 10 seconds');
        process.exit(1);
    }, 10000);

    try {
        const server = floristServer;
        if (server?.listening) {
            await new Promise<void>((resolve, reject) => {
                server.close((error?: Error) => error ? reject(error) : resolve());
            });
            floristServer = null;
        }

        if (floristKnex) {
            await floristKnex.destroy();
            floristKnex = null;
        }

        clearTimeout(forceExit);
        process.exit(0);
    } catch (error: any) {
        clearTimeout(forceExit);
        console.error('[FLORIST] Graceful shutdown failed:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

// Initialize and start
startServer();

export default app;