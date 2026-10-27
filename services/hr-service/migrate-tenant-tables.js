const dotenv = require('dotenv');
const path = require('path');

// Load .env from leave-service directory — NEVER override variables that were
// explicitly set in the environment. override:true used to clobber compose's
// PORT / DB_HOST / DB_PASSWORD with local dev values (e.g. binding the
// container to the wrong port), and explicit environment must always win.
dotenv.config({ path: path.join(__dirname, '.env'), override: false });
// Also load global .env as fallback
dotenv.config({ path: path.join(__dirname, '../../.env'), override: false });

const { safeTenantQuery, safeTenantExecute } = require('../../shared/dbConfig');

const LEAVE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tenant_slug VARCHAR(100) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(5,2) NOT NULL,
  reason TEXT,
  supporting_document VARCHAR(500),
  is_half_day BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  reference_code VARCHAR(40) NULL,
  rejection_reason TEXT,
  approved_by VARCHAR(36) NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leave_user (user_id),
  INDEX idx_leave_tenant (tenant_slug),
  INDEX idx_leave_status (status),
  INDEX idx_leave_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_day_additions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tenant_slug VARCHAR(100) NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  added_by VARCHAR(36) NOT NULL,
  created_at DATE DEFAULT NULL,
  INDEX idx_addition_user (user_id),
  INDEX idx_addition_tenant (tenant_slug),
  INDEX idx_addition_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS holiday_compensations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tenant_slug VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(255) NOT NULL,
  note TEXT,
  recorded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_holiday_user (user_id),
  INDEX idx_holiday_tenant (tenant_slug),
  INDEX idx_holiday_date (holiday_date),
  UNIQUE KEY unique_user_holiday (user_id, holiday_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_devices (
    device_id VARCHAR(64) PRIMARY KEY,
    tenant_slug VARCHAR(100) NOT NULL,
    device_name VARCHAR(120) NOT NULL,
    credential_hash CHAR(64) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(36) NULL,
    last_seen_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attendance_device_tenant (tenant_slug, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_device_users (
    device_id VARCHAR(64) NOT NULL,
    device_user_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, device_user_id),
    INDEX idx_attendance_device_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    event_uid VARCHAR(128) NOT NULL,
    device_user_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(36) NULL,
    event_type ENUM('check_in', 'check_out') NOT NULL,
    occurred_at DATETIME(3) NOT NULL,
    work_date DATE NOT NULL,
    source ENUM('device', 'manual') NOT NULL DEFAULT 'device',
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_device_event (device_id, event_uid),
    INDEX idx_attendance_user_date (user_id, work_date),
    INDEX idx_attendance_tenant_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function migrateTenantTables(dbName) {
    try {
        console.log(`[LEAVE] Migrating tables for: ${dbName}`);

        // Create tables
        const statements = LEAVE_TABLES_SQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.toUpperCase().startsWith('CREATE'));

        for (const statement of statements) {
            try {
                await safeTenantQuery(dbName, statement + ';');
                console.log(`[LEAVE] Created table: ${statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown'}`);
            } catch (err) {
                console.warn(`[LEAVE] Migration warning: ${err.message}`);
            }
        }

        // Add tenant_slug column to existing tables if it doesn't exist
        const tablesToAddTenantSlug = ['leave_requests', 'leave_day_additions', 'holiday_compensations'];
        for (const table of tablesToAddTenantSlug) {
            try {
                await safeTenantQuery(dbName,
                    `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tenant_slug VARCHAR(100) DEFAULT 'system_shared'`
                );
                await safeTenantQuery(dbName,
                    `ALTER TABLE ${table} ADD INDEX IF NOT EXISTS idx_${table}_tenant (tenant_slug)`
                );
                console.log(`[LEAVE] Added tenant_slug to ${table}`);
            } catch (err) {
                console.log(`[LEAVE] ${table} tenant_slug column check: ${err.message}`);
            }
        }

                // Migrate existing leave tables from INT user_id to VARCHAR(36) to match
        // the users table (users.user_id is VARCHAR(36) UUID, NOT auto-increment INT).
        // CREATE TABLE IF NOT EXISTS above will create fresh tables with the correct
        // VARCHAR(36) type, but pre-existing tables created with the old INT schema
        // need their columns widened via MODIFY COLUMN. This is idempotent: if the
        // column is already VARCHAR(36) the statement is a no-op.
        const alterColumnSql = [
            'ALTER TABLE leave_requests MODIFY COLUMN user_id VARCHAR(36) NOT NULL',
            'ALTER TABLE leave_requests MODIFY COLUMN approved_by VARCHAR(36) NULL',
            'ALTER TABLE leave_day_additions MODIFY COLUMN user_id VARCHAR(36) NOT NULL',
            'ALTER TABLE leave_day_additions MODIFY COLUMN added_by VARCHAR(36) NOT NULL',
            'ALTER TABLE holiday_compensations MODIFY COLUMN user_id VARCHAR(36) NOT NULL',
            'ALTER TABLE holiday_compensations MODIFY COLUMN recorded_by VARCHAR(36) NOT NULL'
        ];
        for (const sql of alterColumnSql) {
            try {
                await safeTenantQuery(dbName, sql);
                console.log(`[LEAVE] ${sql}`);
            } catch (err) {
                console.log(`[LEAVE] Column type check: ${err.message}`);
            }
        }

        // Human-friendly reference code (LRQ-NAME-XXXXX) for tracking requests
        try {
            await safeTenantQuery(dbName,
                "ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reference_code VARCHAR(40) NULL"
            );
            await safeTenantQuery(dbName,
                "ALTER TABLE leave_requests ADD INDEX IF NOT EXISTS idx_leave_reference (reference_code)"
            );
            console.log('[LEAVE] Ensured reference_code column on leave_requests');
        } catch (err) {
            console.log(`[LEAVE] reference_code column check: ${err.message}`);
        }

        // Add required columns to users table
        try {
            // Add annual_leave_balance column with default 26 days
            await safeTenantQuery(dbName,
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_leave_balance DECIMAL(5,2) DEFAULT 26.00'
            );
            console.log(`[LEAVE] Added annual_leave_balance column to users table`);

            // Update existing users to have the default balance of 26 days
            await safeTenantExecute(dbName,
                'UPDATE users SET annual_leave_balance = 26.00 WHERE annual_leave_balance IS NULL OR annual_leave_balance = 0'
            );
            console.log(`[LEAVE] Updated existing users with default leave balance (26 days)`);
        } catch (err) {
            console.log(`[LEAVE] Users table columns check: ${err.message}`);
        }

        console.log(`[LEAVE] Migration completed for: ${dbName}`);
        return true;
    } catch (error) {
        console.error(`[LEAVE] Migration failed for ${dbName}:`, error.message);
        return false;
    }
}

async function runMigration() {
    const dbName = process.env.DB_NAME || 'restpoint_main';
    console.log(`[LEAVE] Running migration for: ${dbName}`);
    await migrateTenantTables(dbName);
    console.log('[LEAVE] Migration complete');
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    runMigration();
}

module.exports = { migrateTenantTables, LEAVE_TABLES_SQL };