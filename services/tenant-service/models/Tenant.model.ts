import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { getMainTenantMigrations, getBranchMigrations, getSingleTenantMigrations, getAllTenantMigrations } from '../../../shared/services/all-service-migrations';
import { MigrationService } from '../../../shared/services/migration-service';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export interface RegisterTenantData {
    tenant_name: string;
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    location?: string;
    country?: string;
    deployment_type?: 'single' | 'multi';
    logo_url?: string | null;
    branches?: Array<{
        branch_name: string;
        branch_location: string;
        branch_phone: string;
        branch_email: string;
    }>;
}

export interface Tenant {
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    tenant_code?: string;
    db_name: string;
    email: string;
    phone: string | null;
    location: string | null;
    country: string | null;
    logo_url: string | null;
    status: 'active' | 'suspended' | 'deleted';
    subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
    subscription_expires_at: Date | null;
    deployment_type: 'single' | 'multi';
    created_at: Date;
    updated_at: Date;
}

export interface BranchInfo {
    branch_id: string;
    branch_name: string;
    branch_slug: string;
    branch_db_name: string;
    parent_branch_id: string | null;
    branch_location: string | null;
    branch_phone: string | null;
    branch_email: string | null;
    is_active: boolean;
    created_at: Date;
}

// ============================================
// CONFIGURATION HELPERS
// ============================================

function getDbConfig() {
    return {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'restpoint_user',
        password: process.env.DB_PASSWORD,
    };
}

const AUTH_PLUGINS: any = {
    auth_gssapi_client: () => {
        return (pluginData: Buffer) => {
            return Buffer.from([]);
        };
    }
};

let serverPool: mysql.Pool | null = null;

async function getServerPool(): Promise<mysql.Pool> {
    if (!serverPool) {
        serverPool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'restpoint_user',
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            authPlugins: AUTH_PLUGINS,
        } as any);

        try {
            const conn = await serverPool.getConnection();
            conn.release();
        } catch (error: any) {
            console.error('Database connection failed:', error.message);
        }
    }
    return serverPool;
}

export function generateSlug(tenantName: string): string {
    const slugifyFn = typeof slugify === 'function' ? slugify : (slugify as any).default;
    const cleanedName = tenantName.replace(/^tenant\s+/i, '').trim();
    return slugifyFn(cleanedName, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
        trim: true
    });
}

export function generateTenantCode(tenantName: string, length = 4): string {
    const year = new Date().getFullYear();
    const cleaned = (tenantName || '').replace(/[^A-Za-z0-9]+/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    // Use the first letter of each word as the prefix (e.g. "Nairobi Regional Bureau" -> "NRB",
    // "Montezuma Monalisa Feuneral" -> "MMF"). For single-word names fall back to the
    // first 3 letters of the name so "Nairobi" still yields a 3-char prefix.
    let prefix = words.map(w => w.charAt(0).toUpperCase()).join('');
    if (prefix.length < 3) {
        prefix = (cleaned.replace(/\s+/g, '').substring(0, 3) || 'TNT');
    }
    prefix = prefix.substring(0, 3).toUpperCase();

    // Unambiguous charset — no 0/O/1/I, so codes survive copy/paste & voice readback.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for (let i = 0; i < length; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${random}-${year}`;
}

// Resolves the platform-wide shared uploads directory. Accepts every env-var
// spelling used across the repo (GLOBAL_UPLOAD_PATH / GLOBAL_UPLOADS_DIR /
// UPLOADS_BASE_DIR) so local dev, docker-compose and production all resolve to
// the SAME folder the API gateway serves at /uploads/...
export function getUploadsBaseDir(): string {
    return process.env.GLOBAL_UPLOAD_PATH || process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
}

function generateBranchCode(tenantCode: string, branchName: string, length = 2): string {
    const t = String(tenantCode || 'tenant').replace(/^-+|-+$/g, '');
    const b = generateSlug(branchName) || 'branch';
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < length; i++) {
        random += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return `${t}-${b}-${random}`;
}

async function getTenantConnection(dbName: string) {
    return mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'restpoint_user',
        password: process.env.DB_PASSWORD,
        database: dbName,
        multipleStatements: true,
        authPlugins: AUTH_PLUGINS,
    } as any);
}

async function getBranchConnection(dbName: string) {
    return mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'restpoint_user',
        password: process.env.DB_PASSWORD,
        database: dbName,
        authPlugins: AUTH_PLUGINS,
    } as any);
}

const SOCKET_SERVICE_URL = process.env.SOCKET_SERVICE_URL || 'http://localhost:8010';

function emitOnboardingProgress(tenantSlug: string, step: string, progress: number, details?: string) {
    try {
        axios.post(
            `${SOCKET_SERVICE_URL}/emit/onboarding-progress`,
            {
                tenantSlug,
                data: {
                    step,
                    progress,
                    details,
                    timestamp: new Date().toISOString()
                }
            },
            { timeout: 2000 }
        ).catch((err: any) => {
            console.warn(`⚠️ Socket emit failed (${err.code || err.message || String(err)})`);
        });
    } catch (error) {
        console.warn(`⚠️ Socket emit exception: ${error && (error as any).message ? (error as any).message : String(error)}`);
    }

    try {
        (async () => {
            try {
                const pool = await getServerPool();
                await pool.query(
                    `INSERT INTO tenant_tracking.provisioning_status (tenant_slug, status, progress, details) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE 
                     status = VALUES(status), progress = VALUES(progress), details = VALUES(details), updated_at = CURRENT_TIMESTAMP`,
                    [tenantSlug, progress >= 100 ? 'completed' : 'running', progress, details || null]
                );
            } catch (err: any) {
                console.warn('⚠️ Could not persist provisioning status:', err && err.message ? err.message : String(err));
            }
        })();
    } catch (e) {
        // ignore
    }
}

const UPLOAD_SUBDIRS = [
    'logos', 'employees', 'chemicals', 'documents', 'images',
    'deceased', 'receipts', 'reports', 'contracts', 'signatures'
];

async function createTenantUploadDirectories(tenantSlug: string): Promise<void> {
        const baseDir = path.join(getUploadsBaseDir(), 'tenants', tenantSlug);
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`📂 Created base upload directory: ${baseDir}`);

    for (const subdir of UPLOAD_SUBDIRS) {
        const dirPath = path.join(baseDir, subdir);
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`   📁 Created: ${subdir}/`);
    }

    for (const subdir of UPLOAD_SUBDIRS) {
        const gitkeepPath = path.join(baseDir, subdir, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '');
        }
    }

    console.log(`✅ All upload directories created for tenant: ${tenantSlug}`);
}

// ============================================
// CREATE TENANT DATABASE
// ============================================

async function createCompleteTenantDatabase(
    tenantName: string,
    dbName: string,
    email: string,
    password_hash: string,
    full_name: string,
    phone: string | null,
    country: string | null,
    location: string | null,
    branches: Array<{ branch_name: string; branch_location: string; branch_phone: string; branch_email: string }> | undefined,
    deploymentType: 'single' | 'multi',
    tenantId: string
): Promise<{ dbName: string; branches: Array<{ branch_name: string; branch_slug: string; branch_db_name: string; parent_branch_id: string | null }> }> {
    const serverConn = await getServerPool();
    const migrationService = new MigrationService();

    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'restpoint_user',
        password: process.env.DB_PASSWORD,
        authPlugins: AUTH_PLUGINS
    };

    const dbUser = process.env.DB_USER || 'restpoint_user';

    const branchList = (branches && branches.length > 0) ? branches : [
        { branch_name: tenantName, branch_location: location || 'Main Location', branch_phone: phone || '', branch_email: email }
    ];

    const subdomain = dbName;
    const firstBranch = branchList[0];
    const branchData: Array<{ branch_name: string; branch_slug: string; branch_db_name: string; parent_branch_id: string | null }> = [];

    console.log(`📦 Creating primary database: ${dbName}`);
    await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await serverConn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`);
    emitOnboardingProgress(subdomain, 'Database created', 10, `Primary database ${dbName} created`);

    const primaryMigrations = getMainTenantMigrations();
    console.log(`📋 Running main DB migrations for: ${dbName} (${primaryMigrations.length} migrations)`);

    const migrationResult = await migrationService.runTenantMigrations(dbName, primaryMigrations, dbConfig);
    if (!migrationResult.success) {
        console.error(`❌ Migration errors for ${dbName}:`, migrationResult.errors);
        throw new Error(`Failed to create tenant database: ${migrationResult.errors.join(', ')}`);
    }
    console.log(`✅ Primary database ready: ${migrationResult.migrationsRun.length} migrations executed`);

    emitOnboardingProgress(subdomain, 'Setting up', 70, 'Creating branches and admin user');

    const tenantConn = await getTenantConnection(dbName);

    try {
        // Ensure branch_code column exists
        try {
            const [branchCodeCols] = await tenantConn.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'branch_code'`
            );
            if (Array.isArray(branchCodeCols) && branchCodeCols.length > 0) {
                await tenantConn.query(`ALTER TABLE branches MODIFY COLUMN branch_code VARCHAR(255) NULL`);
            } else {
                await tenantConn.query(`ALTER TABLE branches ADD COLUMN branch_code VARCHAR(255) NULL AFTER branch_slug`);
            }
        } catch (e) { /* ignore */ }

        await tenantConn.query(`
            INSERT IGNORE INTO mortuary_settings (setting_key, setting_value) VALUES 
            ('mortuary_name', ?),
            ('subdomain', ?),
            ('country', ?),
            ('timezone', 'Africa/Nairobi'),
            ('currency', 'KES'),
            ('date_format', 'YYYY-MM-DD'),
            ('time_format', '24h')
        `, [tenantName, subdomain, country || 'Kenya']);

        // ─── FIRST BRANCH: points to primary DB ────────────────────────
        const firstBranchSlugFull = dbName;
        const firstBranchUuid = uuidv4();
        await tenantConn.query(
            `INSERT IGNORE INTO branches (branch_id, branch_name, branch_slug, branch_code, branch_db_name, parent_branch_id, branch_location, branch_phone, branch_email, is_active) 
             VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 1)
            `,
            [firstBranchUuid, firstBranch.branch_name, firstBranchSlugFull, generateBranchCode(dbName, firstBranch.branch_name), dbName, firstBranch.branch_location || '', firstBranch.branch_phone || '', firstBranch.branch_email || '']
        );

        let firstBranchId: string | null = null;
        const [existingBranch] = await tenantConn.query(
            'SELECT branch_id, branch_name, branch_slug, branch_db_name FROM branches WHERE branch_slug = ? LIMIT 1',
            [firstBranchSlugFull]
        );

        if (existingBranch && Array.isArray(existingBranch) && existingBranch.length > 0) {
            const branch = existingBranch[0] as any;
            firstBranchId = branch.branch_id;
            branchData.push({
                branch_name: branch.branch_name,
                branch_slug: branch.branch_slug,
                branch_db_name: branch.branch_db_name,
                parent_branch_id: null,
            });
            console.log(`✅ Primary branch "${branch.branch_name}" → DB: ${dbName} (slug: ${firstBranchSlugFull})`);
        } else {
            const uniqueSlug = `${firstBranchSlugFull}-${Date.now()}`;
            await tenantConn.query(
                `INSERT INTO branches (branch_id, branch_name, branch_slug, branch_code, branch_db_name, parent_branch_id, branch_location, branch_phone, branch_email, is_active) 
                 VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 1)`,
                [uuidv4(), firstBranch.branch_name, uniqueSlug, generateBranchCode(dbName, firstBranch.branch_name), dbName, firstBranch.branch_location || '', firstBranch.branch_phone || '', firstBranch.branch_email || '']
            );
            const [fallbackResult] = await tenantConn.query(
                'SELECT branch_id FROM branches WHERE branch_slug = ? LIMIT 1',
                [uniqueSlug]
            );
            if (fallbackResult && Array.isArray(fallbackResult) && fallbackResult.length > 0) {
                firstBranchId = (fallbackResult[0] as any).branch_id;
            }
            branchData.push({
                branch_name: firstBranch.branch_name,
                branch_slug: uniqueSlug,
                branch_db_name: dbName,
                parent_branch_id: null,
            });
            console.log(`✅ Primary branch "${firstBranch.branch_name}" → DB: ${dbName} (slug: ${uniqueSlug})`);
        }

        // ─── ADDITIONAL BRANCHES: create separate DBs ─────────────────
        for (let i = 1; i < branchList.length; i++) {
            const branch = branchList[i];
            const branchDbName = `${generateSlug(tenantName)}-${generateSlug(branch.branch_name)}`;
            const branchSlug = branchDbName;

            const [existingBranchForSlug] = await tenantConn.query(
                'SELECT branch_id FROM branches WHERE branch_slug = ? LIMIT 1',
                [branchSlug]
            );

            if (existingBranchForSlug && Array.isArray(existingBranchForSlug) && existingBranchForSlug.length > 0) {
                console.log(`⚠️ Branch "${branch.branch_name}" already exists (slug: ${branchSlug}), skipping...`);
                continue;
            }

            await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${branchDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await serverConn.query(`GRANT ALL PRIVILEGES ON \`${branchDbName}\`.* TO '${dbUser}'@'%'`);

            const branchMigrations = getBranchMigrations();
            console.log(`📋 Running branch migrations (${branchMigrations.length} total) for branch DB: ${branchDbName}`);

            const branchResult = await migrationService.runTenantMigrations(branchDbName, branchMigrations, dbConfig);

            if (!branchResult.success) {
                const errorMsg = `Failed to run migrations for branch database ${branchDbName}: ${branchResult.errors.join(', ')}`;
                console.error(`❌ ${errorMsg}`);
                try {
                    await serverConn.query(`DROP DATABASE IF EXISTS \`${branchDbName}\``);
                    console.log(`   🗑️ Rolled back: dropped database ${branchDbName}`);
                } catch (rollbackErr) {
                    console.error(`   ⚠️ Failed to rollback database ${branchDbName}:`, rollbackErr.message);
                }
                throw new Error(errorMsg);
            }
            console.log(`✅ Branch migrations completed: ${branchResult.migrationsRun.length} migrations executed for ${branchDbName}`);

            const branchUuid = uuidv4();
            await tenantConn.query(
                `INSERT INTO branches (branch_id, branch_name, branch_slug, branch_code, branch_db_name, parent_branch_id, branch_location, branch_phone, branch_email, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [branchUuid, branch.branch_name, branchSlug, generateBranchCode(dbName, branch.branch_name), branchDbName, firstBranchId, branch.branch_location || '', branch.branch_phone || '', branch.branch_email || '']
            );

            branchData.push({
                branch_name: branch.branch_name,
                branch_slug: branchSlug,
                branch_db_name: branchDbName,
                parent_branch_id: firstBranchId,
            });

            console.log(`✅ Branch "${branch.branch_name}" created (db: ${branchDbName}, slug: ${branchSlug}, parent: ${firstBranchId})`);
        }

        await tenantConn.query(`
            INSERT INTO activity_logs (log_id, user_id, action, details)
            VALUES (?, ?, 'TENANT_CREATED', ?)
        `, [uuidv4(), uuidv4(), `Tenant ${subdomain} created with ${branchData.length} branch(es)`]);

        console.log(`✅ Tenant setup complete: ${subdomain}`);
        console.log(`   📁 Primary DB: ${dbName}`);
        branchData.forEach(b => console.log(`      - ${b.branch_name} (slug: ${b.branch_slug}, db: ${b.branch_db_name})`));

        emitOnboardingProgress(subdomain, 'Finalizing', 95, 'Setup complete');
    } finally {
        await tenantConn.end();
    }

    emitOnboardingProgress(subdomain, 'Complete', 100, 'Tenant setup successful');
    return { dbName, branches: branchData };
}

// ============================================
// TENANT MODEL
// ============================================

export class TenantModel {
    static async registerTenant(data: RegisterTenantData): Promise<{ tenant: Tenant; token: string }> {
        const { tenant_name, email, password, full_name, phone, location, country, deployment_type, branches, logo_url } = data;

        const branchList = (branches && branches.length > 0) ? branches : [
            { branch_name: tenant_name, branch_location: location || 'Main Location', branch_phone: phone || '', branch_email: email }
        ];
        const firstBranch = branchList[0];
        const firstBranchSlug = generateSlug(firstBranch.branch_name);

        const dbName = branchList.length > 1
            ? `${generateSlug(tenant_name)}-${firstBranchSlug}`
            : generateSlug(tenant_name);

        const subdomain = dbName;
        const password_hash = await bcrypt.hash(password, 10);
        const serverConn = await getServerPool();

        // Start transaction
        await serverConn.query('START TRANSACTION');

        // Declared at function scope so the catch block can clean up after failures
        // (DDL implicit commits may have persisted the tenant row / databases).
        let tenantUuid = '';
        let tenantInserted = false;

        try {
            // 1. Create tracking database
            await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`tenant_tracking\``);
            await serverConn.query('USE tenant_tracking');

            // 2. Ensure schema exists with UUID primary keys
            await this.ensureTrackingSchema(serverConn);

            // 3. Check if tenant already exists. A previous (failed) attempt may have left a
            // partial tenant row + databases behind because DDL statements run implicit
            // COMMITs, so a plain ROLLBACK cannot undo them. If the last attempt failed,
            // clean those leftovers and re-provision from scratch; truly-registered
            // (completed) tenants are rejected.
            const [existing] = await serverConn.query(
                'SELECT id, db_name FROM tenant_tracking.tenants WHERE tenant_slug = ?',
                [subdomain]
            );
            if (Array.isArray(existing) && existing.length > 0) {
                const staleTenant = (existing as any[])[0];
                let provisionStatus = '';
                try {
                    const [psRows] = await serverConn.query(
                        'SELECT status FROM tenant_tracking.provisioning_status WHERE tenant_slug = ?',
                        [subdomain]
                    );
                    provisionStatus = String(((psRows as any[]) || [])[0]?.status || '');
                } catch (psErr: any) { /* best-effort */ }

                if (provisionStatus === '' || provisionStatus === 'completed') {
                    // No provisioning tracking OR a fully registered tenant → never touch it.
                    throw new Error('Tenant slug already exists');
                }

                console.warn(`♻️ Re-provisioning tenant ${subdomain} (previous attempt failed)`);
                try {
                    const [bRows] = await serverConn.query(
                        `SELECT branch_db_name FROM tenant_tracking.branches WHERE tenant_id = ? AND branch_db_name IS NOT NULL`,
                        [staleTenant.id]
                    );
                    const toDrop = new Set<string>();
                    for (const nm of [staleTenant.db_name].concat((bRows as any[] || []).map(r => r.branch_db_name))) {
                        if (nm) toDrop.add(String(nm));
                    }
                    for (const nm of toDrop) {
                        try {
                            await serverConn.query(`DROP DATABASE IF EXISTS \`${nm}\``);
                            console.log(`🧹 Dropped partial tenant database: ${nm}`);
                        } catch (d2: any) {
                            console.warn('⚠️ Could not drop tenant database', nm, d2.message);
                        }
                    }
                    await serverConn.query('DELETE FROM tenant_tracking.users WHERE tenant_id = ?', [staleTenant.id]);
                    await serverConn.query('DELETE FROM tenant_tracking.branches WHERE tenant_id = ?', [staleTenant.id]);
                    await serverConn.query('DELETE FROM tenant_tracking.branch_connections WHERE tenant_slug = ?', [subdomain]);
                    await serverConn.query('DELETE FROM tenant_tracking.tenants WHERE id = ?', [staleTenant.id]);
                } catch (cleanupErr: any) {
                    console.warn('⚠️ Failed to clean partial tenant, aborting re-provision:', (cleanupErr && cleanupErr.message) || String(cleanupErr));
                    throw new Error('Tenant slug already exists (partial cleanup failed): ' + ((cleanupErr && cleanupErr.message) || String(cleanupErr)));
                }
            }

            const finalDeploymentType = deployment_type || ((branches && branches.length > 1) ? 'multi' : 'single');
            const tenantCode = generateTenantCode(tenant_name);
            tenantUuid = uuidv4();

            // 4. INSERT TENANT FIRST
            await serverConn.query(
                `INSERT INTO tenant_tracking.tenants 
                 (id, tenant_name, tenant_slug, db_name, tenant_code, email, phone, location, country, logo_url, status, subscription_status, deployment_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'trial', ?)`,
                [tenantUuid, tenant_name, subdomain, dbName, tenantCode, email, phone || null, location || null, country || null, logo_url || null, finalDeploymentType]
            );

            tenantInserted = true;
            console.log(`✅ Tenant record inserted with ID: ${tenantUuid}`);

            // 5. Create tenant database and branches
            const { branches: branchData } = await createCompleteTenantDatabase(
                tenant_name, dbName, email, password_hash, full_name,
                phone || null, country || null, location || null, branches,
                finalDeploymentType, tenantUuid
            );

            // 6. Create branch tracking records
            await this.createBranchTrackingRecords(serverConn, tenantUuid, subdomain, dbName, branchData);

            // 7. Create admin user in tenant_tracking
            const trackingUserId = uuidv4();
            await this.createTrackingUser(serverConn, trackingUserId, email, password_hash, full_name, phone, tenantUuid);

            // 8. Create admin user in tenant database
            await this.createTenantAdminUser(dbName, email, password_hash, full_name, phone);

            // 9. Create upload directories
            await createTenantUploadDirectories(subdomain);

            // 10. Auto-connect all branches
                        await this.autoConnectBranches(dbName, subdomain, tenantUuid);

            // 11. COMMIT transaction
            await serverConn.query('COMMIT');

            console.log(`✅ Tenant registered successfully: ${tenant_name} (${subdomain})`);

            // 12. Generate JWT token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { userId: trackingUserId, tenantId: tenantUuid, tenantSlug: subdomain, email: email, role: 'admin' },
                process.env.JWT_SECRET || 'RestPointJWTSecret2024ChangeMe',
                { expiresIn: '7d' }
            );

            // 13. Fetch complete tenant record
            const tenant = await this.findById(tenantUuid);
            if (!tenant) {
                throw new Error('Tenant created but not found after commit');
            }

            await emitOnboardingProgress(subdomain, 'Setup complete', 100, 'Redirecting to dashboard');

            return { tenant, token };

        } catch (error: any) {
            // Rollback (best-effort) — DDL statements ran implicit COMMITs so the
            // transaction cannot undo the tenant row or the created databases.
            try { await serverConn.query('ROLLBACK'); } catch (rbErr: any) { /* ignore */ }

            // Remove ONLY the artifacts THIS attempt created so a retry starts from a
            // clean slate. Never touches pre-existing tenants: guarded by tenantInserted
            // (set only after THIS call's INSERT committed) + tenantUuid (fresh id).
            if (tenantInserted && tenantUuid) {
                try {
                    const [trackedBranches] = await serverConn.query(
                        `SELECT branch_db_name FROM tenant_tracking.branches WHERE tenant_id = ? AND branch_db_name IS NOT NULL`,
                        [tenantUuid]
                    );
                    const dbNames = new Set<string>();
                    if (dbName) dbNames.add(dbName);
                    for (const row of (trackedBranches as any[]) || []) {
                        const name = String(row.branch_db_name || '').trim();
                        if (name) dbNames.add(name);
                    }
                    for (const name of dbNames) {
                        try {
                            await serverConn.query(`DROP DATABASE IF EXISTS \`${name}\``);
                            console.log(`🧹 Dropped partial tenant database: ${name}`);
                        } catch (dErr: any) {
                            console.warn('⚠️ Could not drop tenant database', name, dErr.message);
                        }
                    }
                    await serverConn.query('DELETE FROM tenant_tracking.branches WHERE tenant_id = ?', [tenantUuid]);
                    await serverConn.query('DELETE FROM tenant_tracking.tenants WHERE id = ?', [tenantUuid]);
                    console.log('🧹 Cleaned partial tenant artifacts for failed provisioning');
                } catch (cleanupErr: any) {
                    console.warn('⚠️ Partial cleanup failed (manual cleanup may be needed):', (cleanupErr && cleanupErr.message) || String(cleanupErr));
                }
            }

            console.error('❌ Tenant registration failed:', error.message);
            throw error;
        }
    }

    // ─── Schema Management ──────────────────────────────────────────────

    private static async ensureTrackingSchema(serverConn: mysql.Pool): Promise<void> {
        // Create tenants table with UUID primary key
        await serverConn.query(`
            CREATE TABLE IF NOT EXISTS tenant_tracking.tenants (
                id VARCHAR(36) PRIMARY KEY,
                tenant_name VARCHAR(255) NOT NULL,
                tenant_slug VARCHAR(255) UNIQUE NOT NULL,
                db_name VARCHAR(255) UNIQUE NOT NULL,
                tenant_code VARCHAR(255) UNIQUE NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                location TEXT,
                country VARCHAR(100),
                logo_url VARCHAR(500),
                status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
                subscription_status ENUM('active', 'trial', 'suspended', 'cancelled') DEFAULT 'trial',
                subscription_expires_at VARCHAR(255) NULL,
                deployment_type ENUM('single', 'multi') DEFAULT 'single',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_deployment_type (deployment_type),
                INDEX idx_tenant_slug (tenant_slug),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // ======================================================================
        // Legacy tenant_tracking bootstrap:
        //  * Tracking DBs created before the UUID switch may still store ids as INT
        //  * Existing tables may use a different collation than the new
        //    utf8mb4_unicode_ci tables, which makes MySQL/MariaDB reject the
        //    FOREIGN KEY on CREATE TABLE with "errno: 150 Foreign key constraint
        //    is incorrectly formed".
        // We normalize tenants.id first and create child tables WITH a FOREIGN KEY
        // when possible, falling back to creating them WITHOUT the FK when the
        // legacy parent key cannot be referenced. Indexes are kept either way.
        // ======================================================================

        // Normalize a legacy tenants.id (INT AUTO_INCREMENT) to VARCHAR(36).
        try {
            const [legacyIdCols] = await serverConn.query(
                `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'id'`
            );
            const tenantIdCol = (legacyIdCols as any[] || [])[0];
            if (tenantIdCol && tenantIdCol.COLUMN_TYPE !== 'varchar(36)') {
                await serverConn.query(`ALTER TABLE tenant_tracking.tenants MODIFY COLUMN id VARCHAR(36) NOT NULL`);
                console.log('✅ Converted tenant_tracking.tenants.id to VARCHAR(36)');
            }
        } catch (e: any) {
            console.warn('⚠️ Could not normalize tenant_tracking.tenants.id:', e.message);
        }

        const isFkFormationError = (err: any): boolean => {
            const msg = String((err && err.message) || err);
            return /errno[: ]*150|foreign key constraint is incorrectly formed|cannot add foreign key/i.test(msg);
        };

        // Create a child tracking table with an optional FK to tenants(id).
        const createTrackingTable = async (tableName: string, columns: string, fkColumn: string): Promise<void> => {
            for (const withFk of [true, false]) {
                const fkClause = withFk
                    ? `,\n                FOREIGN KEY (${fkColumn}) REFERENCES tenant_tracking.tenants(id) ON DELETE CASCADE`
                    : '';
                try {
                    await serverConn.query(`
                        CREATE TABLE IF NOT EXISTS tenant_tracking.${tableName} (
                            ${columns}
                            ${fkClause}
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    `);
                    if (!withFk) {
                        console.warn(`⚠️ Created tenant_tracking.${tableName} WITHOUT FK constraint (legacy tenants column mismatch)`);
                    }
                    return;
                } catch (err: any) {
                    if (withFk && isFkFormationError(err)) {
                        continue;
                    }
                    throw err;
                }
            }
        };

        const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
            const [rows] = await serverConn.query(
                `SELECT COLUMN_NAME FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [tableName, columnName]
            );
            return Array.isArray(rows) && rows.length > 0;
        };

        // Add a column to an older tracking table when it's missing.
        const addColumnIfMissing = async (tableName: string, columnName: string, columnDdl: string, afterColumn: string): Promise<void> => {
            try {
                if (!(await hasColumn(tableName, columnName))) {
                    await serverConn.query(
                        `ALTER TABLE tenant_tracking.\`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDdl} AFTER \`${afterColumn}\``
                    );
                    console.log(`✅ Added tenant_tracking.${tableName}.${columnName}`);
                }
            } catch (e: any) {
                console.warn(`⚠️ Could not add tenant_tracking.${tableName}.${columnName}:`, e.message);
            }
        };

        // Reconcile legacy tenant_tracking.tenants (created by the old onboarding
        // bootstrap) with the canonical schema registerTenant()'s INSERT expects. The
        // legacy table is missing tenant_code/location/country/logo_url/deployment_type
        // and since CREATE TABLE IF NOT EXISTS is a no-op on it, add them here (idempotent).
        await addColumnIfMissing('tenants', 'tenant_code', 'VARCHAR(255) NULL', 'db_name');
        await addColumnIfMissing('tenants', 'location', 'TEXT NULL', 'phone');
        await addColumnIfMissing('tenants', 'country', 'VARCHAR(100) NULL', 'location');
        await addColumnIfMissing('tenants', 'logo_url', 'VARCHAR(500) NULL', 'country');
        await addColumnIfMissing('tenants', 'deployment_type', `ENUM('single','multi') DEFAULT 'single'`, 'subscription_status');

        // The legacy ENUMs don't accept canonical values ('trial', 'deleted') and the
        // servers run with STRICT_TRANS_TABLES, so INSERTs fail with "Data truncated".
        // Broaden them using supersets that keep every existing (legacy) value valid.
        const ensureEnum = async (tableName: string, columnName: string, columnDdl: string): Promise<void> => {
            try {
                const [colMeta] = await serverConn.query(
                    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                    [tableName, columnName]
                );
                const current = String(((colMeta as any[]) || [])[0]?.COLUMN_TYPE || '');
                const required = columnDdl
                    .replace(/^ENUM\(/i, '')
                    .replace(/\s+\).*$/i, '')
                    .split(',')
                    .map(v => v.trim().replace(/^'|'$/g, ''));
                const missing = current.length === 0 || required.some(v => !current.includes(v));
                if (missing) {
                    await serverConn.query(
                        `ALTER TABLE tenant_tracking.\`${tableName}\` MODIFY COLUMN \`${columnName}\` ${columnDdl}`
                    );
                    console.log(`✅ Normalized tenant_tracking.${tableName}.${columnName} -> ${columnDdl}`);
                }
            } catch (e: any) {
                console.warn(`⚠️ Could not normalize tenant_tracking.${tableName}.${columnName}:`, e.message);
            }
        };

        await ensureEnum('tenants', 'status', `ENUM('active','inactive','suspended','deleted') DEFAULT 'active'`);
        await ensureEnum('tenants', 'subscription_status', `ENUM('active','inactive','trial','suspended','cancelled') DEFAULT 'trial'`);

        // Create branches tracking table
        await createTrackingTable('branches', `
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                tenant_slug VARCHAR(255) NOT NULL,
                branch_slug VARCHAR(255) NOT NULL,
                branch_code VARCHAR(255) NULL,
                branch_name VARCHAR(255) NOT NULL,
                branch_db_name VARCHAR(255) NOT NULL,
                parent_branch_id VARCHAR(36) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_branch (tenant_slug, branch_slug),
                INDEX idx_tenant_id (tenant_id),
                INDEX idx_tenant_slug (tenant_slug),
                INDEX idx_branch_slug (branch_slug)`, 'tenant_id');

        // Older tracking DBs created the branches registry without a tenant_id column —
        // backfill it so the INSERTs below can store the owning tenant.
        await addColumnIfMissing('branches', 'tenant_id', 'VARCHAR(36) NULL', 'id');

        // Legacy tracking DBs created the branch registry with INT `id` / INT
        // `parent_branch_id` (plus FKs back into those INT columns) while the canonical
        // INSERTs store UUID strings — under STRICT_TRANS_TABLES that fails with
        // "Data truncated". Convert the columns (and their FKs) to VARCHAR(36), idempotent.
        try {
            const [branchIdCol] = await serverConn.query(
                `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'branches' AND COLUMN_NAME = 'id'`
            );
            const branchIdType = String(((branchIdCol as any[]) || [])[0]?.COLUMN_TYPE || '');
            if (branchIdType && branchIdType !== 'varchar(36)') {
                const [branchFks] = await serverConn.query(
                    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                     WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'branches'
                       AND REFERENCED_TABLE_NAME IS NOT NULL`
                );
                for (const fk of ((branchFks as any[]) || [])) {
                    try {
                        await serverConn.query(`ALTER TABLE tenant_tracking.branches DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                    } catch (fkErr: any) {
                        console.warn('⚠️ Could not drop legacy branches FK:', fk.CONSTRAINT_NAME, fkErr.message);
                    }
                }
                await serverConn.query(
                    `ALTER TABLE tenant_tracking.branches
                     MODIFY COLUMN id VARCHAR(36) NOT NULL,
                     MODIFY COLUMN parent_branch_id VARCHAR(36) NULL`
                );
                console.log('✅ Converted tenant_tracking.branches.id / parent_branch_id to VARCHAR(36)');
                try {
                    // Re-add ONLY the FK on tenant_id (canonical fresh-table schema). There
                    // must be NO FK on parent_branch_id: tracking rows are populated with
                    // parent ids taken from the TENANT database's branches (different rows),
                    // so a self-referencing FK here would reject those inserts.
                    await serverConn.query(
                        `ALTER TABLE tenant_tracking.branches
                         ADD CONSTRAINT fk_tracking_branches_tenant FOREIGN KEY (tenant_id)
                             REFERENCES tenant_tracking.tenants(id) ON DELETE CASCADE`
                    );
                } catch (fkErr: any) {
                    console.warn('⚠️ Could not re-add branches tracking FK (indexes retained):', fkErr.message);
                }
            }
        } catch (e: any) {
            console.warn('⚠️ Could not normalize legacy tenant_tracking.branches:', e.message);
        }

        // Create users tracking table
        await createTrackingTable('users', `
                user_id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                role VARCHAR(50) DEFAULT 'admin',
                tenant_id VARCHAR(36) NOT NULL,
                branch_id VARCHAR(36) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT TRUE,
                last_login_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_tenant_id (tenant_id),
                INDEX idx_role (role)`, 'tenant_id');

        // Create provisioning_status table
        await serverConn.query(`
            CREATE TABLE IF NOT EXISTS tenant_tracking.provisioning_status (
                tenant_slug VARCHAR(255) PRIMARY KEY,
                status VARCHAR(50) DEFAULT 'pending',
                progress INT DEFAULT 0,
                details TEXT,
                error_message TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_started_at (started_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create branch_connections tracking table
        await createTrackingTable('branch_connections', `
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                tenant_slug VARCHAR(255) NOT NULL,
                branch_id VARCHAR(36) NOT NULL,
                connected_branch_id VARCHAR(36) NOT NULL,
                connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'partnership',
                status ENUM('active','inactive','pending') DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_slug (tenant_slug),
                INDEX idx_branch_id (branch_id),
                INDEX idx_connected_branch_id (connected_branch_id),
                UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)`, 'tenant_id');

        console.log('✅ Tenant tracking schema verified');
    }

    private static async createBranchTrackingRecords(
        serverConn: mysql.Pool,
        tenantId: string,
        tenantSlug: string,
        tenantDbName: string,
        branchData: Array<{ branch_name: string; branch_slug: string; branch_db_name: string; parent_branch_id: string | null }>
    ): Promise<void> {
        for (const branch of branchData) {
            const branchUuid = uuidv4();
            await serverConn.query(`
                INSERT INTO tenant_tracking.branches 
                (id, tenant_id, tenant_slug, branch_slug, branch_code, branch_name, branch_db_name, parent_branch_id, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                branchUuid,
                tenantId,
                tenantSlug,
                branch.branch_slug,
                generateBranchCode(tenantDbName, branch.branch_name),
                branch.branch_name,
                branch.branch_db_name,
                branch.parent_branch_id
            ]);
        }

        console.log(`✅ ${branchData.length} branch tracking records created`);
    }

    private static async createTrackingUser(
        serverConn: mysql.Pool,
        userId: string,
        email: string,
        password_hash: string,
        full_name: string,
        phone: string | null,
        tenantId: string
    ): Promise<void> {
        await serverConn.query(`
            INSERT INTO tenant_tracking.users 
            (user_id, email, password_hash, full_name, phone, role, tenant_id, is_verified, is_active)
            VALUES (?, ?, ?, ?, ?, 'admin', ?, 1, 1)
        `, [userId, email, password_hash, full_name, phone || '', tenantId]);

        console.log(`✅ Tracking user created: ${email}`);
    }

    private static async createTenantAdminUser(
        dbName: string,
        email: string,
        password_hash: string,
        full_name: string,
        phone: string | null
    ): Promise<void> {
        const conn = await getTenantConnection(dbName);
        try {
            // Get the first branch ID
            const [branchRows] = await conn.query(
                'SELECT branch_id FROM branches WHERE is_active = TRUE ORDER BY branch_id ASC LIMIT 1'
            );
            const branches = branchRows as any[];
            const primaryBranchId = branches.length > 0 ? branches[0].branch_id : null;

            const adminUsername = full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const mainUserUuid = uuidv4();

            await conn.query(`
                INSERT INTO users (user_id, email, password_hash, full_name, username, phone, role, branch_id, is_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, 1, 1)
            `, [mainUserUuid, email, password_hash, full_name, adminUsername, phone || '', primaryBranchId]);

            console.log(`✅ Admin user created in tenant database (branch_id: ${primaryBranchId})`);
        } finally {
            await conn.end();
        }
    }

    // ─── Branch Connection Operations ──────────────────────────────────

    static async ensureBranchConnectionsTable(tenantDbName: string): Promise<void> {
        const conn = await getTenantConnection(tenantDbName);
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS branch_connections (
                    id VARCHAR(36) PRIMARY KEY,
                    tenant_slug VARCHAR(255) NOT NULL,
                    branch_id VARCHAR(36) NOT NULL,
                    connected_branch_id VARCHAR(36) NOT NULL,
                    connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'partnership',
                    status ENUM('active','inactive','pending') DEFAULT 'active',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
                    FOREIGN KEY (connected_branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
                    INDEX idx_tenant_slug (tenant_slug),
                    INDEX idx_branch_id (branch_id),
                    INDEX idx_connected_branch_id (connected_branch_id),
                    UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        } finally {
            await conn.end();
        }
    }

        static async autoConnectBranches(tenantDbName: string, tenantSlug: string, tenantId?: string): Promise<void> {
        await this.ensureBranchConnectionsTable(tenantDbName);

        const conn = await getTenantConnection(tenantDbName);
        try {
            // Get all active branches
            const [branches] = await conn.query(
                'SELECT branch_id, parent_branch_id FROM branches WHERE is_active = TRUE ORDER BY branch_id'
            );
            const branchList = branches as any[];

            if (branchList.length < 2) {
                console.log(`ℹ️ Only ${branchList.length} branch(es), no connections needed`);
                return;
            }

            // Identify parent branch
            let parentBranchId: string | null = null;
            const childBranchIds: string[] = [];
            for (const b of branchList) {
                if (b.parent_branch_id === null || b.parent_branch_id === undefined) {
                    if (parentBranchId === null) {
                        parentBranchId = b.branch_id;
                    }
                } else {
                    childBranchIds.push(b.branch_id);
                }
            }

            // Create parent-child connections
            if (parentBranchId !== null && childBranchIds.length > 0) {
                for (const childId of childBranchIds) {
                    const [existing] = await conn.query(
                        'SELECT id FROM branch_connections WHERE branch_id = ? AND connected_branch_id = ? LIMIT 1',
                        [parentBranchId, childId]
                    );
                    if ((existing as any[]).length === 0) {
                        await conn.query(
                            `INSERT INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                             VALUES (?, ?, ?, ?, 'parent_child', 'active', 'Parent-child hierarchy')`,
                            [uuidv4(), tenantSlug, parentBranchId, childId]
                        );
                        await conn.query(
                            `INSERT INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                             VALUES (?, ?, ?, ?, 'parent_child', 'active', 'Parent-child hierarchy')`,
                            [uuidv4(), tenantSlug, childId, parentBranchId]
                        );
                    }
                }
            }

            // Create partnership connections between ALL pairs
            for (let i = 0; i < branchList.length; i++) {
                for (let j = i + 1; j < branchList.length; j++) {
                    const branchA = branchList[i].branch_id;
                    const branchB = branchList[j].branch_id;

                    const [existing] = await conn.query(
                        'SELECT id FROM branch_connections WHERE branch_id = ? AND connected_branch_id = ? LIMIT 1',
                        [branchA, branchB]
                    );
                    if ((existing as any[]).length === 0) {
                        await conn.query(
                            `INSERT INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                             VALUES (?, ?, ?, ?, 'partnership', 'active', 'Auto-connected on tenant setup')`,
                            [uuidv4(), tenantSlug, branchA, branchB]
                        );
                        await conn.query(
                            `INSERT INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                             VALUES (?, ?, ?, ?, 'partnership', 'active', 'Auto-connected on tenant setup')`,
                            [uuidv4(), tenantSlug, branchB, branchA]
                        );
                    }
                }
            }

                        // Mirror branch connections into the central tenant_tracking database so the
            // branch_connections table is populated there too — the admin dashboard and
            // branch-connection lookups read from tenant_tracking, not the per-tenant DB.
            if (tenantId) {
                await this.mirrorBranchConnectionsToTracking(tenantId, tenantSlug, branchList, parentBranchId, childBranchIds).catch((e: any) => {
                    console.warn('⚠️ Could not mirror branch connections to tenant_tracking:', e && e.message ? e.message : String(e));
                });
            }

            console.log(`✅ Auto-connected ${branchList.length} branches for tenant: ${tenantSlug}`);
        } finally {
            await conn.end();
        }
    }

        private static async insertTrackingConnection(
        tConn: mysql.Pool,
        tenantId: string,
        tenantSlug: string,
        branchId: string,
        connectedBranchId: string,
        connectionType: 'referral' | 'transfer' | 'partnership' | 'parent_child',
        notes: string
    ): Promise<void> {
        await tConn.query(
            `INSERT IGNORE INTO tenant_tracking.branch_connections
             (id, tenant_id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
            [uuidv4(), tenantId, tenantSlug, branchId, connectedBranchId, connectionType, notes]
        );
    }

    // Writes the same parent/child + partnership links that exist on a tenant's
    // own database into tenant_tracking.branch_connections so the central
    // tracking DB also reflects the branch graph (idempotent via INSERT IGNORE).
    private static async mirrorBranchConnectionsToTracking(
        tenantId: string,
        tenantSlug: string,
        branchList: Array<{ branch_id: string; parent_branch_id: string | null }>,
        parentBranchId: string | null,
        childBranchIds: string[]
    ): Promise<void> {
        const tConn = await getServerPool();
        // Parent <-> child (both directions)
        if (parentBranchId !== null && childBranchIds.length > 0) {
            for (const childId of childBranchIds) {
                await this.insertTrackingConnection(tConn, tenantId, tenantSlug, parentBranchId, childId, 'parent_child', 'Parent-child hierarchy');
                await this.insertTrackingConnection(tConn, tenantId, tenantSlug, childId, parentBranchId, 'parent_child', 'Parent-child hierarchy');
            }
        }
        // Partnership between every pair (both directions)
        for (let i = 0; i < branchList.length; i++) {
            for (let j = i + 1; j < branchList.length; j++) {
                const branchA = branchList[i].branch_id;
                const branchB = branchList[j].branch_id;
                await this.insertTrackingConnection(tConn, tenantId, tenantSlug, branchA, branchB, 'partnership', 'Auto-connected on tenant setup');
                await this.insertTrackingConnection(tConn, tenantId, tenantSlug, branchB, branchA, 'partnership', 'Auto-connected on tenant setup');
            }
        }
        console.log(`✅ Mirrored branch connections to tenant_tracking for tenant: ${tenantSlug}`);
    }

    static async getBranches(tenantDbName: string): Promise<BranchInfo[]> {
        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                'SELECT branch_id, branch_name, branch_slug, branch_db_name, parent_branch_id, branch_location, branch_phone, branch_email, is_active, created_at FROM branches WHERE is_active = TRUE ORDER BY branch_name'
            );
            return (rows as any[]).map((r: any) => ({
                branch_id: r.branch_id,
                branch_name: r.branch_name,
                branch_slug: r.branch_slug,
                branch_db_name: r.branch_db_name,
                parent_branch_id: r.parent_branch_id ?? null,
                branch_location: r.branch_location || null,
                branch_phone: r.branch_phone || null,
                branch_email: r.branch_email || null,
                is_active: !!r.is_active,
                created_at: r.created_at
            }));
        } finally {
            await conn.end();
        }
    }

    static async addBranch(tenantDbName: string, branch: {
        branch_name: string;
        branch_location: string;
        branch_phone: string;
        branch_email: string;
        parent_branch_id?: string | null;
    }): Promise<{ branch_id: string; branch_db_name: string }> {
        const serverConn = await getServerPool();
        const migrationService = new MigrationService();

        const branchDbName = `${tenantDbName}-${generateSlug(branch.branch_name)}`;
        const branchSlug = branchDbName;

        await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${branchDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        const branchMigrations = getBranchMigrations();
        const dbConfig = {
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'restpoint_user',
            password: process.env.DB_PASSWORD,
            authPlugins: AUTH_PLUGINS
        };

        console.log(`📋 Running branch migrations for ${branchDbName} (${branchMigrations.length} migrations)`);
        const branchResult = await migrationService.runTenantMigrations(branchDbName, branchMigrations, dbConfig);

        if (!branchResult.success) {
            const errorMsg = `Failed to run migrations for branch database ${branchDbName}: ${branchResult.errors.join(', ')}`;
            console.error(`❌ ${errorMsg}`);
            try {
                await serverConn.query(`DROP DATABASE IF EXISTS \`${branchDbName}\``);
                console.log(`   🗑️ Rolled back: dropped database ${branchDbName}`);
            } catch (rollbackErr) {
                console.error(`   ⚠️ Failed to rollback database ${branchDbName}:`, rollbackErr.message);
            }
            throw new Error(errorMsg);
        }

        const conn = await getTenantConnection(tenantDbName);
        try {
            let resolvedParentId: string | null = branch.parent_branch_id ?? null;
            if (resolvedParentId === null) {
                const [mainBranch] = await conn.query(
                    'SELECT branch_id FROM branches WHERE parent_branch_id IS NULL ORDER BY branch_id ASC LIMIT 1'
                );
                if (Array.isArray(mainBranch) && mainBranch.length > 0) {
                    resolvedParentId = (mainBranch[0] as any).branch_id;
                }
            }
            const newBranchUuid = uuidv4();
            await conn.query(
                `INSERT INTO branches (branch_id, branch_name, branch_slug, branch_code, branch_db_name, parent_branch_id, branch_location, branch_phone, branch_email, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [newBranchUuid, branch.branch_name, branchSlug, generateBranchCode(tenantDbName, branch.branch_name), branchDbName, resolvedParentId, branch.branch_location || '', branch.branch_phone || '', branch.branch_email || '']
            );
            return { branch_id: newBranchUuid, branch_db_name: branchDbName };
        } finally {
            await conn.end();
        }
    }

    static async getBranchConnections(tenantDbName: string, branchId: string): Promise<any[]> {
        await this.ensureBranchConnectionsTable(tenantDbName);

        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                `SELECT bc.*, 
                        b.branch_name as connected_branch_name,
                        b.branch_slug as connected_branch_slug,
                        b.branch_db_name as connected_branch_db_name
                 FROM branch_connections bc
                 INNER JOIN branches b ON bc.connected_branch_id = b.branch_id
                 WHERE bc.branch_id = ? AND bc.status = 'active'
                 ORDER BY bc.created_at DESC`,
                [branchId]
            );
            return rows as any[];
        } finally {
            await conn.end();
        }
    }

    static async getAllBranchConnections(tenantDbName: string): Promise<any[]> {
        await this.ensureBranchConnectionsTable(tenantDbName);

        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                `SELECT bc.*, 
                        b1.branch_name as branch_name,
                        b2.branch_name as connected_branch_name,
                        b2.branch_db_name as connected_branch_db_name
                 FROM branch_connections bc
                 INNER JOIN branches b1 ON bc.branch_id = b1.branch_id
                 INNER JOIN branches b2 ON bc.connected_branch_id = b2.branch_id
                 WHERE bc.status = 'active'
                 ORDER BY bc.created_at DESC`
            );
            return rows as any[];
        } finally {
            await conn.end();
        }
    }

    static async canBranchesCommunicate(
        tenantDbName: string,
        branchId: string,
        connectedBranchId: string
    ): Promise<boolean> {
        await this.ensureBranchConnectionsTable(tenantDbName);

        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                `SELECT id FROM branch_connections 
                 WHERE branch_id = ? AND connected_branch_id = ? AND status = 'active'
                 LIMIT 1`,
                [branchId, connectedBranchId]
            );
            return (rows as any[]).length > 0;
        } finally {
            await conn.end();
        }
    }

    static async createBranchConnection(
        tenantDbName: string,
        tenantSlug: string,
        branchId: string,
        connectedBranchId: string,
        connectionType: 'referral' | 'transfer' | 'partnership' | 'parent_child' = 'partnership',
        notes?: string
    ): Promise<string> {
        await this.ensureBranchConnectionsTable(tenantDbName);

        if (branchId === connectedBranchId) {
            throw new Error('Cannot connect a branch to itself');
        }

        const conn = await getTenantConnection(tenantDbName);
        try {
            const [branchCheck] = await conn.query(
                'SELECT branch_id FROM branches WHERE branch_id IN (?, ?) AND is_active = TRUE',
                [branchId, connectedBranchId]
            );
            if ((branchCheck as any[]).length < 2) {
                throw new Error('One or both branches not found or inactive');
            }

            const connUuid1 = uuidv4();
            const connUuid2 = uuidv4();
            await conn.query(
                `INSERT IGNORE INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                 VALUES (?, ?, ?, ?, ?, 'active', ?)`,
                [connUuid1, tenantSlug, branchId, connectedBranchId, connectionType, notes || null]
            );
            await conn.query(
                `INSERT IGNORE INTO branch_connections (id, tenant_slug, branch_id, connected_branch_id, connection_type, status, notes)
                 VALUES (?, ?, ?, ?, ?, 'active', ?)`,
                [connUuid2, tenantSlug, connectedBranchId, branchId, connectionType, notes || null]
            );

            return connUuid1;
        } finally {
            await conn.end();
        }
    }

    static async updateBranchConnection(
        tenantDbName: string,
        connectionId: string,
        status: 'active' | 'inactive' | 'pending'
    ): Promise<void> {
        const conn = await getTenantConnection(tenantDbName);
        try {
            await conn.query(
                'UPDATE branch_connections SET status = ? WHERE id = ?',
                [status, connectionId]
            );
        } finally {
            await conn.end();
        }
    }

    static async deleteBranchConnection(tenantDbName: string, connectionId: string): Promise<void> {
        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                'SELECT branch_id, connected_branch_id FROM branch_connections WHERE id = ?',
                [connectionId]
            );
            const list = rows as any[];
            if (list.length > 0) {
                const { branch_id, connected_branch_id } = list[0];
                await conn.query(
                    'DELETE FROM branch_connections WHERE (branch_id = ? AND connected_branch_id = ?) OR (branch_id = ? AND connected_branch_id = ?)',
                    [branch_id, connected_branch_id, connected_branch_id, branch_id]
                );
            }
        } finally {
            await conn.end();
        }
    }

    // ─── Tenant Lookup Methods ──────────────────────────────────────────

    static async findBySubdomain(slug: string): Promise<Tenant | null> {
        const serverConn = await getServerPool();
        const [tenants] = await serverConn.query<mysql.RowDataPacket[]>(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status = "active"',
            [slug]
        );
        const tenantRow = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        if (!tenantRow) return null;
        return {
            tenant_id: tenantRow.id,
            tenant_name: tenantRow.tenant_name,
            tenant_slug: tenantRow.tenant_slug,
            tenant_code: tenantRow.tenant_code || null,
            db_name: tenantRow.db_name,
            email: tenantRow.email,
            phone: tenantRow.phone || null,
            location: tenantRow.location || null,
            country: tenantRow.country || null,
            logo_url: tenantRow.logo_url || null,
            status: tenantRow.status || 'active',
            subscription_status: tenantRow.subscription_status || 'trial',
            subscription_expires_at: tenantRow.subscription_expires_at || null,
            deployment_type: tenantRow.deployment_type || 'single',
            created_at: tenantRow.created_at,
            updated_at: tenantRow.updated_at
        };
    }

    static async findById(tenantId: string): Promise<Tenant | null> {
        const serverConn = await getServerPool();
        const [tenants] = await serverConn.query<mysql.RowDataPacket[]>(
            'SELECT * FROM tenant_tracking.tenants WHERE id = ?',
            [tenantId]
        );
        const tenantRow = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        if (!tenantRow) return null;
        return {
            tenant_id: tenantRow.id,
            tenant_name: tenantRow.tenant_name,
            tenant_slug: tenantRow.tenant_slug,
            tenant_code: tenantRow.tenant_code || null,
            db_name: tenantRow.db_name,
            email: tenantRow.email,
            phone: tenantRow.phone || null,
            location: tenantRow.location || null,
            country: tenantRow.country || null,
            logo_url: tenantRow.logo_url || null,
            status: tenantRow.status || 'active',
            subscription_status: tenantRow.subscription_status || 'trial',
            subscription_expires_at: tenantRow.subscription_expires_at || null,
            deployment_type: tenantRow.deployment_type || 'single',
            created_at: tenantRow.created_at,
            updated_at: tenantRow.updated_at
        };
    }

    static async findByEmail(email: string): Promise<Tenant | null> {
        const serverConn = await getServerPool();
        const [tenants] = await serverConn.query<mysql.RowDataPacket[]>(
            'SELECT * FROM tenant_tracking.tenants WHERE email = ? AND status = "active"',
            [email]
        );
        const tenantRow = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        if (!tenantRow) return null;
        return {
            tenant_id: tenantRow.id,
            tenant_name: tenantRow.tenant_name,
            tenant_slug: tenantRow.tenant_slug,
            tenant_code: tenantRow.tenant_code || null,
            db_name: tenantRow.db_name,
            email: tenantRow.email,
            phone: tenantRow.phone || null,
            location: tenantRow.location || null,
            country: tenantRow.country || null,
            logo_url: tenantRow.logo_url || null,
            status: tenantRow.status || 'active',
            subscription_status: tenantRow.subscription_status || 'trial',
            subscription_expires_at: tenantRow.subscription_expires_at || null,
            deployment_type: tenantRow.deployment_type || 'single',
            created_at: tenantRow.created_at,
            updated_at: tenantRow.updated_at
        };
    }

    static async getAllTenants(): Promise<Tenant[]> {
        const serverConn = await getServerPool();
        const [tenants] = await serverConn.query<mysql.RowDataPacket[]>(
            'SELECT * FROM tenant_tracking.tenants ORDER BY created_at DESC'
        );
        return (tenants || []).map((tenantRow: any) => ({
            tenant_id: tenantRow.id,
            tenant_name: tenantRow.tenant_name,
            tenant_slug: tenantRow.tenant_slug,
            tenant_code: tenantRow.tenant_code || null,
            db_name: tenantRow.db_name,
            email: tenantRow.email,
            phone: tenantRow.phone || null,
            location: tenantRow.location || null,
            country: tenantRow.country || null,
            logo_url: tenantRow.logo_url || null,
            status: tenantRow.status || 'active',
            subscription_status: tenantRow.subscription_status || 'trial',
            subscription_expires_at: tenantRow.subscription_expires_at || null,
            deployment_type: tenantRow.deployment_type || 'single',
            created_at: tenantRow.created_at,
            updated_at: tenantRow.updated_at
        }));
    }

    static async getTenantDatabase(tenantId: string): Promise<mysql.Connection | null> {
        const tenant = await this.findById(tenantId);
        if (!tenant) return null;
        return getTenantConnection(tenant.db_name);
    }

    static async getBranchDbName(tenantDbName: string, branchSlug: string): Promise<string | null> {
        const conn = await getTenantConnection(tenantDbName);
        try {
            const [rows] = await conn.query(
                'SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1',
                [branchSlug]
            );
            const list = rows as any[];
            return list.length > 0 ? list[0].branch_db_name : null;
        } finally {
            await conn.end();
        }
    }

    static async updateStatus(tenantId: string, status: 'active' | 'suspended' | 'deleted'): Promise<void> {
        const serverConn = await getServerPool();
        await serverConn.query(
            'UPDATE tenant_tracking.tenants SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, tenantId]
        );
    }
}