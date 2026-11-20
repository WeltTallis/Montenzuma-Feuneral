#!/usr/bin/env node
/**
 * One-off fix: ensures the default system admin exists inside the TENANT's
 * own database (<tenants.db_name>.users) — which is where the login flow
 * actually looks (findUserInTenantDB). Fixes "Invalid email or password"
 * for the default admin credentials without requiring a service restart.
 *
 * Run:  node scripts/ensure-tenant-admin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SYSTEM_ADMIN = {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'infowelttallis@gmail.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@RestPoint2024',
    fullName: 'System Administrator',
    phone: '+254700000000',
    role: 'systemadmin',
    tenantName: 'Welt Tallis Technologies',
    tenantSlug: 'welt-tallis',
    dbName: 'welt_tallis_main',
};

const USERS_TABLE_SQL = `
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
`;

async function connect() {
    const base = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    };
    const attempts = [
        { ...base, user: process.env.DB_USER || 'restpoint_user', password: process.env.DB_PASSWORD || 'RestPointUser2024' },
        { ...base, user: process.env.DB_ADMIN_USER || 'root', password: process.env.DB_ADMIN_PASSWORD || 'root' },
    ];
    let lastErr;
    for (const cfg of attempts) {
        try {
            const conn = await mysql.createConnection(cfg);
            console.log(`✅ Connected to MySQL as ${cfg.user}@${cfg.host}:${cfg.port}`);
            return conn;
        } catch (e) {
            lastErr = e;
            console.warn(`⚠️  Could not connect as ${cfg.user}: ${e.message}`);
        }
    }
    throw lastErr;
}

async function main() {
    const connection = await connect();

    // 1. Ensure tenant_tracking + tenants row for the system admin
    await connection.query('CREATE DATABASE IF NOT EXISTS tenant_tracking');
    await connection.query('USE tenant_tracking');
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
            INDEX idx_tenant_slug (tenant_slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Detect whether the EXISTING tenants table requires an explicit `id`
    // (newer schemas use id VARCHAR(36) UUID instead of AUTO_INCREMENT)
    let needsExplicitId = false;
    try {
        const [idCol] = await connection.query(
            `SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'id'`
        );
        needsExplicitId = idCol.length > 0 && !/auto_increment/i.test(idCol[0].EXTRA || '');
    } catch { /* default false */ }

    const [existing] = await connection.query(
        'SELECT id, db_name FROM tenants WHERE tenant_slug = ? OR email = ? LIMIT 1',
        [SYSTEM_ADMIN.tenantSlug, SYSTEM_ADMIN.email]
    );

    if (existing.length === 0) {
        if (needsExplicitId) {
            await connection.query(`
                INSERT INTO tenants (id, tenant_name, tenant_slug, db_name, email, phone, location, country, status, subscription_status, deployment_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'active', 'single')
            `, [require('crypto').randomUUID(), SYSTEM_ADMIN.tenantName, SYSTEM_ADMIN.tenantSlug, SYSTEM_ADMIN.dbName, SYSTEM_ADMIN.email, SYSTEM_ADMIN.phone, 'Nairobi', 'Kenya']);
        } else {
            await connection.query(`
                INSERT INTO tenants (tenant_name, tenant_slug, db_name, email, phone, location, country, status, subscription_status, deployment_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'active', 'single')
            `, [SYSTEM_ADMIN.tenantName, SYSTEM_ADMIN.tenantSlug, SYSTEM_ADMIN.dbName, SYSTEM_ADMIN.email, SYSTEM_ADMIN.phone, 'Nairobi', 'Kenya']);
        }
    }

    const [tenants] = await connection.query(
        'SELECT id, db_name FROM tenants WHERE tenant_slug = ? OR email = ? LIMIT 1',
        [SYSTEM_ADMIN.tenantSlug, SYSTEM_ADMIN.email]
    );
    if (!tenants.length) throw new Error('Failed to resolve system tenant row');
    const tenantId = String(tenants[0].id);
    const dbName = tenants[0].db_name || SYSTEM_ADMIN.dbName;

    // 2. Ensure the TENANT database has a users table with the admin inside
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    await connection.query(USERS_TABLE_SQL);

    const hash = bcrypt.hashSync(SYSTEM_ADMIN.password, 10);
    await connection.query(`
        INSERT INTO users (email, password_hash, full_name, phone, role, tenant_id, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE
            password_hash = VALUES(password_hash),
            role = VALUES(role),
            tenant_id = VALUES(tenant_id),
            is_active = 1,
            is_verified = 1
    `, [SYSTEM_ADMIN.email, hash, SYSTEM_ADMIN.fullName, SYSTEM_ADMIN.phone, SYSTEM_ADMIN.role, tenantId]);

    // 3. Mirror into tenant_tracking.users too (used by other flows).
    // Schema-adaptive: some installs use user_id VARCHAR(36) UUID instead of
    // INT AUTO_INCREMENT — detect and handle both.
    await connection.query('USE tenant_tracking');
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

    async function userIdNeedsExplicitValue() {
        try {
            const [col] = await connection.query(
                `SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'`
            );
            return col.length > 0 && !/auto_increment/i.test(col[0].EXTRA || '');
        } catch { return false; }
    }

    const [ttExisting] = await connection.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [SYSTEM_ADMIN.email]);
    if (ttExisting.length === 0) {
        const needsId = await userIdNeedsExplicitValue();
        if (needsId) {
            await connection.query(`
                INSERT INTO users (user_id, email, password_hash, full_name, phone, role, tenant_id, is_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            `, [require('crypto').randomUUID(), SYSTEM_ADMIN.email, hash, SYSTEM_ADMIN.fullName, SYSTEM_ADMIN.phone, SYSTEM_ADMIN.role, tenantId]);
        } else {
            await connection.query(`
                INSERT INTO users (email, password_hash, full_name, phone, role, tenant_id, is_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1)
            `, [SYSTEM_ADMIN.email, hash, SYSTEM_ADMIN.fullName, SYSTEM_ADMIN.phone, SYSTEM_ADMIN.role, tenantId]);
        }
    } else {
        await connection.query(`
            UPDATE users SET password_hash = ?, role = ?, tenant_id = ?, is_active = 1, is_verified = 1
            WHERE email = ?
        `, [hash, SYSTEM_ADMIN.role, tenantId, SYSTEM_ADMIN.email]);
    }


    // 4. Verify
    await connection.query(`USE \`${dbName}\``);
    const [check] = await connection.query(
        'SELECT user_id, email, role, is_active FROM users WHERE email = ?',
        [SYSTEM_ADMIN.email]
    );

    await connection.end();

    console.log('');
    console.log(`✅ Admin ensured in tenant DB '${dbName}':`);
    console.log(check[0]);
    console.log('');
    console.log(`   Login with: ${SYSTEM_ADMIN.email}`);
    console.log(`   Password:   ${SYSTEM_ADMIN.password}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    });


