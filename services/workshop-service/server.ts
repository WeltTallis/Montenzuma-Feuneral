/**
 * Workshop Service - Coffin building, materials, and production tracking
 * Multi-tenant aware with tenant resolution middleware
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import http from 'http';
import knex from 'knex';
import { initSocket } from './socket';
import { workshopRouter } from './routes/workshopRouter';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // The API Gateway handles public CORS validation.
    // Internal microservices should allow all origins passed by the gateway.
    return callback(null, true);
};

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// ============================================
// TENANT RESOLUTION MIDDLEWARE
// ============================================
app.use(async (req: any, res: any, next: any) => {
    // Get tenant from headers or use default
    const tenantSlug = (req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared') as string;
    const branchId = req.headers['x-branch-id'] || null;

    req.tenantSlug = tenantSlug;
    req.branchId = branchId;

    console.log(`[WORKSHOP] Request: ${req.method} ${req.path}`);
    console.log(`[WORKSHOP] Tenant: ${tenantSlug}, Branch: ${branchId}`);

    // For system_shared, skip tenant validation and use the central operations DB
    if (tenantSlug === 'system_shared') {
        console.log('[WORKSHOP] Using system_shared tenant (bypassing validation)');
        req.tenant = {
            db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
            main_db_name: process.env.DB_NAME || 'restpoint_main',
            tenant_id: 1,
            name: 'System Shared'
        };
        return next();
    }

    // For non-system tenants — resolve the tenant main DB for branch lookups,
    // but workshop DATA lives in the ONE central operations database shared by
    // all tenants (tenant isolation via tenant_slug column).
    try {
        // @ts-ignore
        const { resolveDatabase, safeTenantQuery } = await import('../../shared/dbConfig.js');

        let mainDbName = await resolveDatabase(tenantSlug);

        // Fallback: convert slug to db name pattern
        if (!mainDbName) {
            mainDbName = tenantSlug.replace(/-/g, '_');
        }

        req.tenant = {
            db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
            main_db_name: mainDbName,
            tenant_slug: tenantSlug,
            name: tenantSlug
        };
        console.log(`[WORKSHOP] Tenant resolved — operations DB: ${req.tenant.db_name}, main DB: ${mainDbName}`);

        // Resolve branch if not provided
        if (!req.branchId && mainDbName) {
            const lastDash = tenantSlug.lastIndexOf('-');
            if (lastDash > 0) {
                const branchPart = tenantSlug.substring(lastDash + 1);
                try {
                    const branches = await safeTenantQuery(
                        mainDbName,
                        'SELECT branch_id FROM branches WHERE branch_slug LIKE ? OR branch_name LIKE ? LIMIT 1',
                        [`%${branchPart}%`, `%${branchPart}%`]
                    );
                    if (branches.length > 0) {
                        req.branchId = branches[0].branch_id.toString();
                        console.log(`[WORKSHOP] Branch resolved: ${req.branchId}`);
                    } else {
                        console.log(`[WORKSHOP] No branch found for "${branchPart}", using single-tenant mode`);
                    }
                } catch (e) {
                    console.log('[WORKSHOP] Branch resolution skipped:', (e as Error).message);
                }
            } else {
                console.log(`[WORKSHOP] Single-tenant mode detected`);
            }
        }

        // Workshop tables are ensured once at startup against the central
        // operations database — no per-tenant auto-migration is needed.
    } catch (err: any) {
        console.error('[WORKSHOP] Tenant resolution error:', err.message);
        // Always fall back to the central operations DB rather than blocking
        req.tenant = {
            db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
            main_db_name: process.env.DB_NAME || 'restpoint_main',
            tenant_slug: tenantSlug,
            name: tenantSlug
        };
    }

    next();
});

// ============================================
// ROUTES - Mount workshop routes (CLEAN ROUTES - NO PREFIX)
// ============================================
console.log('[WORKSHOP] Registering routes...');
app.use('/workshop', workshopRouter);

// Log all registered routes for debugging
const logRoutes = (router: any, prefix = '') => {
    if (!router || !router.stack) {
        console.log('[WORKSHOP] No routes to log');
        return;
    }

    router.stack.forEach((layer: any) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
            console.log(`[WORKSHOP] Route registered: ${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            const path = layer.regexp.toString().replace(/\(/g, '').replace(/\)/g, '');
            logRoutes(layer.handle, prefix + path);
        }
    });
};

setTimeout(() => {
    console.log('[WORKSHOP] Registered routes:');
    logRoutes(workshopRouter, '/workshop');
}, 100);

// Health check
app.get('/api/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// AUTO-MIGRATION: Ensure workshop tables exist in tenant databases
// ============================================
async function ensureWorkshopTables(dbName: string) {
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

        console.log(`[WORKSHOP] Ensuring workshop tables in: ${dbName}`);

        // Check if tables already exist
        const hasUsers = await tenantKnex.schema.hasTable('users');
        const hasOrders = await tenantKnex.schema.hasTable('coffin_orders');
        const hasMaterials = await tenantKnex.schema.hasTable('materials');

        if (!hasUsers || !hasOrders || !hasMaterials) {
            // Run the migration for this tenant
            // @ts-ignore - migration file is JavaScript
            const { up } = await import('./migrations/20240622000001_create_workshop_tables.js');
            await up(tenantKnex);
            console.log(`[WORKSHOP] ✅ Workshop tables created in: ${dbName}`);
        } else {
            console.log(`[WORKSHOP] ✓ Workshop tables already exist in: ${dbName}`);
        }

        // ── Incremental, knex-run migrations for existing tables ──────────
        // Runs each pending schema change (via knex schema builder) so new
        // columns/tables are applied without dropping or touching existing data.
        if (await tenantKnex.schema.hasColumn('coffin_orders', 'size') === false) {
            const sizeMigration = await import('./migrations/20240701000001_add_size_to_coffin_orders.js');
            await sizeMigration.up(tenantKnex);
            console.log(`[WORKSHOP] ✅ Added 'size' column to coffin_orders in: ${dbName}`);
        }

        // -- Simplify coffin_orders: add coffin_name, drop customer/deceased & costs
        const hasCoffinNameCol = await tenantKnex.schema.hasColumn('coffin_orders', 'coffin_name');
        if (!hasCoffinNameCol) {
            const simplifyMig = await import('./migrations/20240703000001_simplify_coffin_orders.js');
            await simplifyMig.up(tenantKnex);
            console.log(`[WORKSHOP] Added coffin_name, removed obsolete columns in: ${dbName}`);
        }

        if (await tenantKnex.schema.hasTable('workshop_workers') === false) {
            const workersMigration = await import('./migrations/20240702000001_create_workshop_workers.js');
            await workersMigration.up(tenantKnex);
            console.log(`[WORKSHOP] ✅ Created workshop_workers table in: ${dbName}`);
        }

        // ── Ensure workshop-only tables (safe: CREATE TABLE IF NOT EXISTS) ──
        // The full workshop migration above only runs when coffin_orders does NOT
        // already exist. When it *does* exist (e.g. it was created first by another
        // module such as the coffin/front-desk flow), production_stages,
        // worker_assignments, material_usage, costing, etc. are never created. That
        // makes order creation fail (INSERT INTO production_stages) and order
        // listing fail (subqueries on worker_assignments), showing an empty [].
        const workshopOnlyTables: string[] = [
            `CREATE TABLE IF NOT EXISTS materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
                quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
                unit_price DECIMAL(10,2) DEFAULT 0,
                min_stock_level DECIMAL(10,2) DEFAULT 0,
                description TEXT,
                created_at VARCHAR(255),
                updated_at VARCHAR(255),
                INDEX idx_materials_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS material_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffin_order_id INT UNSIGNED NOT NULL,
                material_id INT UNSIGNED NOT NULL,
                quantity_used DECIMAL(10,2) NOT NULL,
                unit_cost DECIMAL(10,2) DEFAULT 0,
                notes TEXT,
                used_at VARCHAR(255),
                FOREIGN KEY (coffin_order_id) REFERENCES coffin_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
                INDEX idx_usage_order (coffin_order_id),
                INDEX idx_usage_material (material_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS production_stages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffin_order_id INT UNSIGNED NOT NULL,
                stage VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                started_at VARCHAR(255) NULL,
                completed_at VARCHAR(255) NULL,
                notes TEXT,
                FOREIGN KEY (coffin_order_id) REFERENCES coffin_orders(id) ON DELETE CASCADE,
                UNIQUE KEY uk_order_stage (coffin_order_id, stage),
                INDEX idx_stages_order (coffin_order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS worker_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffin_order_id INT UNSIGNED NOT NULL,
                user_id INT NOT NULL,
                stage VARCHAR(50) NOT NULL,
                hours_worked DECIMAL(5,2) DEFAULT 0,
                notes TEXT,
                assigned_at VARCHAR(255),
                completed_at VARCHAR(255) NULL,
                FOREIGN KEY (coffin_order_id) REFERENCES coffin_orders(id) ON DELETE CASCADE,
                INDEX idx_assignments_order (coffin_order_id),
                INDEX idx_assignments_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS costing (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffin_order_id INT UNSIGNED NOT NULL UNIQUE,
                overhead_cost DECIMAL(10,2) DEFAULT 0,
                total_cost DECIMAL(10,2) DEFAULT 0,
                selling_price DECIMAL(10,2) DEFAULT 0,
                created_at VARCHAR(255),
                updated_at VARCHAR(255),
                FOREIGN KEY (coffin_order_id) REFERENCES coffin_orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS design_specifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coffin_order_id INT UNSIGNED NOT NULL UNIQUE,
                design_name VARCHAR(255),
                description TEXT,
                specifications JSON,
                status VARCHAR(50) DEFAULT 'draft',
                created_at VARCHAR(255),
                updated_at VARCHAR(255),
                FOREIGN KEY (coffin_order_id) REFERENCES coffin_orders(id) ON DELETE CASCADE,
                INDEX idx_design_order (coffin_order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
            `CREATE TABLE IF NOT EXISTS material_intake (
                id INT AUTO_INCREMENT PRIMARY KEY,
                material_id INT UNSIGNED NOT NULL,
                quantity DECIMAL(10,2) NOT NULL,
                unit_cost DECIMAL(10,2) DEFAULT 0,
                notes TEXT,
                received_by VARCHAR(255),
                received_at VARCHAR(255),
                FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
                INDEX idx_intake_material (material_id),
                INDEX idx_intake_date (received_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        ];
        for (const sql of workshopOnlyTables) {
            try {
                await tenantKnex.raw(sql);
            } catch (e: any) {
                console.warn(`[WORKSHOP] Could not ensure a workshop table in ${dbName}: ${e?.message}`);
            }
        }

                        // ── Ensure the workshop columns coffin_orders needs ──────────────────────
        // If coffin_orders was created by another module it may be missing the
        // columns the workshop INSERT relies on. Add them idempotently.
        const neededOrderColumns: [string, string][] = [
            ['order_number', "VARCHAR(50) NULL"],
            ['coffin_name', "VARCHAR(255) NULL"],
            ['coffin_type', "VARCHAR(50) DEFAULT 'Standard'"],
            ['size', "VARCHAR(100) NULL"],
            ['color', "VARCHAR(100) NULL"],
            ['notes', "TEXT NULL"],
            ['priority', "VARCHAR(20) DEFAULT 'normal'"],
            ['due_date', "DATE NULL"],
            ['branch_id', "INT DEFAULT 1"],
            ['hold_reason', "TEXT NULL"],
            ['created_by', "INT NULL"]
        ];
        for (const [col, def] of neededOrderColumns) {
            const hasCol = await tenantKnex.schema.hasColumn('coffin_orders', col);
            if (!hasCol) {
                try {
                    await tenantKnex.raw(`ALTER TABLE coffin_orders ADD COLUMN ${col} ${def}`);
                    console.log(`[WORKSHOP] ✅ Added '${col}' to coffin_orders in: ${dbName}`);
                } catch (e: any) {
                    const msg = e?.message || '';
                    if (!/Duplicate column/i.test(msg) && !/ER_DUP_FIELDNAME/i.test(msg)) {
                        console.warn(`[WORKSHOP] Could not add column ${col} to coffin_orders in ${dbName}: ${msg}`);
                    }
                }
            }
        }

        // ── Drop obsolete columns ─────────────────────────────────────────
        // The workshop no longer tracks deceased/dimensions (coffin_orders),
        // design files (design_specifications), material/labour cost & profit
        // fields (costing), or supplier/invoice metadata (material_intake).
        // Drop them idempotently so existing databases match the new schema.
        const obsoleteColumns: [string, string][] = [
            ['coffin_orders', 'deceased_name'],
            ['coffin_orders', 'dimensions'],
            ['costing', 'materials_cost'],
            ['costing', 'labor_cost'],
            ['costing', 'profit'],
            ['costing', 'profit_margin'],
            ['design_specifications', 'design_files'],
            ['material_intake', 'supplier'],
            ['material_intake', 'invoice_number']
        ];
        for (const [table, col] of obsoleteColumns) {
            try {
                const hasObsoleteCol = await tenantKnex.schema.hasColumn(table, col);
                if (hasObsoleteCol) {
                    await tenantKnex.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
                    console.log(`[WORKSHOP] ✅ Dropped '${col}' from ${table} in: ${dbName}`);
                }
            } catch (e: any) {
                const msg = e?.message || '';
                if (!/ER_CANT_DROP_FIELD_OR_KEY|ER_DUP_FIELDNAME/i.test(msg)) {
                    console.warn(`[WORKSHOP] Could not drop column ${table}.${col} in ${dbName}: ${msg}`);
                }
            }
        }

        await tenantKnex.destroy();
        return true;
    } catch (error: any) {
        console.error(`[WORKSHOP] ❌ Failed to ensure workshop tables in ${dbName}:`, error.message);
        return false;
    }
}

// ============================================
// START SERVER
// ============================================
async function startServer() {
    // Run auto-migration on the ONE central operations database (all tenants share it)
    const workshopDb = process.env.OPERATIONS_DATABASE || 'restpoint_operations';
    console.log(`[WORKSHOP] Running auto-migration for workshop tables in: ${workshopDb}`);
    await ensureWorkshopTables(workshopDb);
    console.log('[WORKSHOP] Operations database ready (workshop tables shared by all tenants, scoped via tenant_slug)');

    const PORT = Number(process.env.PORT) || 6060;

    server.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log(`🔧 Workshop Service`);
        console.log(`   Port: ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   DB: ${workshopDb}`);
        console.log('========================================');
    });
}

startServer();

export default app;