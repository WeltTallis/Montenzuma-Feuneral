/**
 * Auto-Initialize System Admin
 * 
 * This script automatically creates the system admin user on system startup.
 * It runs as part of the auth-service initialization process.
 * 
 * To enable: Add this to your auth-service startup sequence
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// System Admin Configuration - Use environment variables for credentials
const SYSTEM_ADMIN = {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'infowelttallis@gmail.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@RestPoint2024',
    fullName: 'System Administrator',
    phone: '+254700000000',
    role: 'systemadmin',
    tenantName: 'Welt Tallis Technologies',
    tenantSlug: 'welt-tallis',
    dbName: 'welt_tallis_main',
    location: 'Nairobi',
    country: 'Kenya'
};

export async function autoInitSystemAdmin() {
    let connection;
    try {
        console.log(' Checking system admin initialization...');

        // Retry logic for DB connection (useful when DB is still starting)
        const maxAttempts = parseInt(process.env.DB_INIT_RETRY_ATTEMPTS || '5', 10);
        const baseDelayMs = parseInt(process.env.DB_INIT_RETRY_DELAY_MS || '5000', 10);
        let attempt = 0;
        let connected = false;

        while (attempt < maxAttempts && !connected) {
            attempt += 1;
            try {
                console.log(`Attempt ${attempt}/${maxAttempts} connecting to DB...`);
                connection = await mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306'),
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: 'tenant_tracking'
                });
                connected = true;

            } catch (connErr) {
                // If access denied, do not attempt auto-provisioning during startup in production.
                // Instead, instruct operator to run the bootstrap tool with admin credentials.
                const error: any = connErr;
                if (error && (error.code === 'ER_ACCESS_DENIED_ERROR' || (error.message && error.message.includes('Access denied')))) {
                    console.error(' Database access denied for configured DB user. Auto-provisioning is disabled at startup to avoid unexpected privilege escalations.');
                    console.error('To provision the database and user, run the provided bootstrap script with administrator credentials (DB_ADMIN_USER / DB_ADMIN_PASSWORD).');
                    console.error(`Configured DB_USER=${process.env.DB_USER}, DB_HOST=${process.env.DB_HOST}, DB_PORT=${process.env.DB_PORT}`);
                    throw error; // bubble to outer catch and return appropriate failure
                }

                console.warn(`DB connection attempt ${attempt} failed: ${error.message || connErr}. Retrying in ${baseDelayMs}ms...`);
                if (attempt < maxAttempts) {
                    await new Promise(res => setTimeout(res, baseDelayMs));
                }
            }
        }

        if (!connected) {
            throw new Error('Could not connect to database after multiple attempts');
        }

        // Create tenant_tracking database and tables FIRST
        console.log(' Creating system admin user...');
        await connection.query('CREATE DATABASE IF NOT EXISTS tenant_tracking');
        await connection.query('USE tenant_tracking');
        console.log('Using tenant_tracking database');

        // Create tenants table if it doesn't exist
        await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_name VARCHAR(255) NOT NULL,
        tenant_slug VARCHAR(255) UNIQUE NOT NULL,
        db_name VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        location TEXT,
        country VARCHAR(100),
        logo_url VARCHAR(500),
        status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
        subscription_status ENUM('active', 'trial', 'suspended', 'cancelled') DEFAULT 'trial',
        subscription_expires_at VARCHAR(255) NULL,
        deployment_type ENUM('single', 'multi') DEFAULT 'single',
        created_at VARCHAR(255),
        updated_at VARCHAR(255),
        INDEX idx_deployment_type (deployment_type),
        INDEX idx_tenant_slug (tenant_slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('Ensured tenants table');

        // Create users table if it doesn't exist.
        //
        // `tenant_id` MUST be created as VARCHAR, not INT. Installs provisioned
        // by the tenant-service migrations use UUID string keys
        // (`tenants.id VARCHAR(36)` — see
        // tenant-service/src/migrations/20260813000000_add_tenant_code_and_shared_db
        // and ensure-tenant-admin.js, which declares `tenant_id VARCHAR(64) NULL`).
        // This script previously created `tenant_id INT NOT NULL`, so on those
        // installs MySQL truncated the UUID to a number (or raised
        // "Incorrect integer value"), and the system admin failed to initialise
        // with the id arriving as a number where a string was required.
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'admin',
        tenant_id VARCHAR(64) NULL,
        branch_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT TRUE,
        last_login_at VARCHAR(255) NULL,
        created_at VARCHAR(255),
        updated_at VARCHAR(255),
        INDEX idx_email (email),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('Ensured users table');

        // NOTE: The old early-return for an existing admin was removed.
        // It skipped the tenant-database mirroring below, which broke logins
        // ("Invalid email or password") because login reads credentials from
        // the TENANT database, not from tenant_tracking.users.
        // The upserts below are idempotent and run on every startup.

        // Create or update tenant.
        //
        // `tenants.id` is a UUID string on installs provisioned by the
        // tenant-service (`id VARCHAR(36)`, see ensure-tenant-admin.js which
        // probes INFORMATION_SCHEMA for exactly this). This INSERT only lists
        // the non-key columns, so the column must be auto-populated. Where it
        // is a UUID with no default, supply one explicitly — the same
        // detection the sibling script performs.
        let tenantNeedsExplicitId = false;
        try {
            const [idCol] = await connection.query(
                `SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'id'`
            );
            tenantNeedsExplicitId = idCol.length > 0 && !/auto_increment/i.test(idCol[0].EXTRA || '');
        } catch { /* default false — plain auto-increment install */ }

        if (tenantNeedsExplicitId) {
            await connection.query(`
                INSERT INTO tenants (
                    id, tenant_name, tenant_slug, db_name, email, phone,
                    location, country, status, subscription_status, deployment_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'active', 'single')
                ON DUPLICATE KEY UPDATE tenant_name = VALUES(tenant_name)
            `, [
                require('crypto').randomUUID(),
                SYSTEM_ADMIN.tenantName,
                SYSTEM_ADMIN.tenantSlug,
                SYSTEM_ADMIN.dbName,
                SYSTEM_ADMIN.email,
                SYSTEM_ADMIN.phone,
                SYSTEM_ADMIN.location,
                SYSTEM_ADMIN.country
            ]);
        } else {
            await connection.query(`
                INSERT INTO tenants (
                    tenant_name, tenant_slug, db_name, email, phone,
                    location, country, status, subscription_status, deployment_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'active', 'single')
                ON DUPLICATE KEY UPDATE tenant_name = VALUES(tenant_name)
            `, [
                SYSTEM_ADMIN.tenantName,
                SYSTEM_ADMIN.tenantSlug,
                SYSTEM_ADMIN.dbName,
                SYSTEM_ADMIN.email,
                SYSTEM_ADMIN.phone,
                SYSTEM_ADMIN.location,
                SYSTEM_ADMIN.country
            ]);
        }

        // Get tenant id
        const [tenantsResult] = await connection.query(
            'SELECT id FROM tenants WHERE email = ?',
            [SYSTEM_ADMIN.email]
        );
        if (!tenantsResult.length) {
            throw new Error('Failed to resolve the system tenant row');
        }
        // Coerce the id to the type the users table actually expects. mysql2
        // returns an INT PK as a JS number and a UUID PK as a string; binding
        // the wrong one is what produced "id required as string but initiated
        // as number". Normalise to a string, which MySQL accepts for both a
        // VARCHAR key and an INT key.
        const tenantId = String(tenantsResult[0].id);

        // ================================================================
        // IMPORTANT: mirror the admin user into the TENANT'S OWN database.
        // The login flow resolves credentials from `<tenants.db_name>.users`
        // (see findUserInTenantDB in authController.ts), NOT from
        // tenant_tracking.users. Without this, logging in with the default
        // admin credentials fails with "Invalid email or password".
        // ================================================================
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${SYSTEM_ADMIN.dbName}\``);
            await connection.query(`USE \`${SYSTEM_ADMIN.dbName}\``);
            await connection.query(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    username VARCHAR(255) NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    role VARCHAR(50) DEFAULT 'admin',
                    tenant_id VARCHAR(64) NULL,
                    branch_id INT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT TRUE,
                    last_login_at VARCHAR(255) NULL,
                    created_at VARCHAR(255),
                    updated_at VARCHAR(255),
                    INDEX idx_email (email),
                    INDEX idx_role (role)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            const mirrorHash = bcrypt.hashSync(SYSTEM_ADMIN.password, 10);
            await connection.query(`
                INSERT INTO users (email, password_hash, full_name, phone, role, tenant_id, is_active, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1)
                ON DUPLICATE KEY UPDATE
                    password_hash = VALUES(password_hash),
                    role = VALUES(role),
                    tenant_id = VALUES(tenant_id),
                    is_active = 1,
                    is_verified = 1
            `, [
                SYSTEM_ADMIN.email,
                mirrorHash,
                SYSTEM_ADMIN.fullName,
                SYSTEM_ADMIN.phone,
                SYSTEM_ADMIN.role,
                tenantId
            ]);
            await connection.query('USE tenant_tracking');
            console.log(` System admin ensured inside tenant database '${SYSTEM_ADMIN.dbName}'`);
        } catch (mirrorErr: any) {
            try { await connection.query('USE tenant_tracking'); } catch { /* ignore */ }
            console.warn(` Could not mirror admin into tenant DB '${SYSTEM_ADMIN.dbName}': ${mirrorErr?.message || mirrorErr}`);
        }

        // Hash password
        const passwordHash = bcrypt.hashSync(SYSTEM_ADMIN.password, 10);

        // `users.user_id` has the SAME shape problem as `tenants.id` above, and
        // it is the one that actually breaks login.
        //
        // The CREATE TABLE at the top of this file declares
        //     user_id INT AUTO_INCREMENT PRIMARY KEY
        // but that statement is a NO-OP whenever the table already exists, and
        // on tenant-service-provisioned installs `users` was created by
        // migration 003_create_users_table (shared/services/all-service-migrations.ts)
        // as:
        //     user_id VARCHAR(36) PRIMARY KEY
        // — a UUID key with NO default and NO auto-increment. The INSERT below
        // lists only the non-key columns, so MySQL rejects it:
        //     Field 'user_id' doesn't have a default value  (ERROR 1364)
        // The system admin was therefore never created and every login failed
        // with "Invalid email or password".
        //
        // Detect the column the same way `tenants.id` is detected above and
        // supply a UUID explicitly when the key is not auto-populated.
        let userNeedsExplicitId = false;
        try {
            const [uCol] = await connection.query(
                `SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'`
            );
            userNeedsExplicitId = uCol.length > 0 && !/auto_increment/i.test(uCol[0].EXTRA || '');
        } catch { /* default false — plain auto-increment install */ }

        if (userNeedsExplicitId) {
            await connection.query(`
                INSERT INTO users (
                    user_id, email, password_hash, full_name, phone,
                    role, tenant_id, is_verified, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
                ON DUPLICATE KEY UPDATE
                    password_hash = VALUES(password_hash),
                    role = VALUES(role),
                    is_active = 1,
                    is_verified = 1
            `, [
                require('crypto').randomUUID(),
                SYSTEM_ADMIN.email,
                passwordHash,
                SYSTEM_ADMIN.fullName,
                SYSTEM_ADMIN.phone,
                SYSTEM_ADMIN.role,
                tenantId
            ]);
        } else {
            await connection.query(`
                INSERT INTO users (
                    email, password_hash, full_name, phone,
                    role, tenant_id, is_verified, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, 1, 1)
                ON DUPLICATE KEY UPDATE
                    password_hash = VALUES(password_hash),
                    role = VALUES(role),
                    is_active = 1,
                    is_verified = 1
            `, [
                SYSTEM_ADMIN.email,
                passwordHash,
                SYSTEM_ADMIN.fullName,
                SYSTEM_ADMIN.phone,
                SYSTEM_ADMIN.role,
                tenantId
            ]);
        }

        // Get the user_id
        const [usersResult] = await connection.query(
            'SELECT user_id FROM users WHERE email = ?',
            [SYSTEM_ADMIN.email]
        );
        const userId = usersResult[0]?.user_id;

        console.log(' System admin user created successfully!');
        console.log(`   Email: ${SYSTEM_ADMIN.email}`);


        return {
            success: true,
            message: 'System admin initialized successfully',
            userId,
            tenantId,
            email: SYSTEM_ADMIN.email,
            role: SYSTEM_ADMIN.role
        };

    } catch (error: any) {
        console.error(' Error initializing system admin:', error.message);
        return {
            success: false,
            message: error.message,
            error: error
        };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    autoInitSystemAdmin()
        .then(result => {
            console.log('\n Initialization Result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error && error.message ? error.message : error);
            process.exit(1);
        });
}

module.exports = { autoInitSystemAdmin, SYSTEM_ADMIN };
