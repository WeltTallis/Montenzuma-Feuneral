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
import { getRootPool } from '../../shared/dbConfig.js';

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
// FLOWER DATABASE RESOLUTION
//   ALL flower data lives in the ONE central
//   `restpoint_operations` database shared by
//   every tenant. Isolated via tenant_slug.
// ============================================
const FLOWER_MAIN_DB = (): string => process.env.OPERATIONS_DATABASE || 'restpoint_operations';

async function getTenantRecord(tenantSlug: string): Promise<any> {
    try {
        const pool = await getRootPool(); // connects to tenant_tracking
        const [rows]: any = await pool.query(
            'SELECT tenant_slug, db_name, tenant_name, deployment_type, status FROM tenants WHERE tenant_slug = ? LIMIT 1',
            [tenantSlug]
        );
        return rows && rows[0] ? rows[0] : null;
    } catch (e: any) {
        // deployment_type column may not exist in every tenants schema — retry without it
        try {
            const pool = await getRootPool();
            const [rows]: any = await pool.query(
                'SELECT tenant_slug, db_name, tenant_name, status FROM tenants WHERE tenant_slug = ? LIMIT 1',
                [tenantSlug]
            );
            const rec = rows && rows[0] ? rows[0] : null;
            if (rec) rec.deployment_type = null;
            return rec;
        } catch (e2: any) {
            console.error('[FLORIST] getTenantRecord error:', e2.message);
            return null;
        }
    }
}

async function countTenantBranches(tenantSlug: string): Promise<number> {
    try {
        const pool = await getRootPool();
        const [rows]: any = await pool.query('SELECT COUNT(*) AS c FROM branches WHERE tenant_slug = ?', [tenantSlug]);
        return rows && rows[0] ? Number(rows[0].c) : 0;
    } catch (e) { return 0; }
}

// A tenant is multi-branch when deployment_type = 'multi', or (fallback)
// when more than one branch row exists in the registry (handles schemas
// without the deployment_type column).
async function isMultiBranchTenant(tenantSlug: string, tenant: any): Promise<boolean> {
    if (tenant?.deployment_type === 'multi') return true;
    const branchCount = await countTenantBranches(tenantSlug);
    return branchCount > 1;
}

async function createFlowerDatabaseIfMissing(dbName: string) {
    const pool = await getRootPool();
    try {
        await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`[FLORIST]  Dedicated flower database ready: ${dbName}`);
    } catch (e: any) {
        console.error(`[FLORIST] Failed to create flower database ${dbName}:`, e.message);
    }
    try {
        const dbUser = process.env.DB_USER || 'restpoint_user';
        await pool.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`);
        await pool.query('FLUSH PRIVILEGES').catch(() => { });
    } catch (e) { /* optional privileges, ignore */ }
}

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
            table.string('flower_type', 100).notNullable();
            table.text('flower_description');
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

    app.listen(PORT, HOST, () => {
                console.log(`   DB: ${process.env.OPERATIONS_DATABASE || 'restpoint_operations'}`);
        console.log(`   Storage: ${process.env.STORAGE_PATH || '/opt/storage/uploads'}`);
     
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