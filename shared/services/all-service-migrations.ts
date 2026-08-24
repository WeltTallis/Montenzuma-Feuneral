/**
 * @file shared/services/all-service-migrations.ts
 * PRODUCTION-READY: All Service Migrations
 *
 * Centralized registry of DB migrations, split into two groups:
 *
 * 1. MAIN TENANT MIGRATIONS (ALL_TENANT_MIGRATIONS)
 *    - Run into EACH tenant's single MAIN database (one DB per tenant).
 *    - Contains: organizations, tenants, branches, users, deceased records,
 *      invoices, payments, body_checkout, billing/daily charges, settings, etc.
 *
 * 2. OPERATIONS MIGRATIONS (OPERATIONS_MIGRATIONS)
 *    - Run into ONE shared `restpoint_operations` database for ALL tenants.
 *    - Contains: coffins, hearses, florists, workshops, chemicals, extra-charges.
 *      Tenant isolation is via tenant_slug column in each table.
 *    - Each service runs its own knex migrations independently against this DB.
 *
 * 3. LEAVE MIGRATIONS (LEAVE_SERVICE_MIGRATIONS) are PER-TENANT:
 *    - Part of ALL_TENANT_MIGRATIONS, so they run into every tenant MAIN DB and
 *      every branch DB. The leave service stores leave data per tenant (in the
 *      tenant's main DB, scoped by tenant_slug) and extends the users table.
 *
 * Usage:
 *   import { ALL_TENANT_MIGRATIONS } from './all-service-migrations';
 *   // Main tenant DB:
 *   await migrationService.runTenantMigrations(dbName, ALL_TENANT_MIGRATIONS, config);
 *   // Central operations DB (each service runs its own subset):
 *   await migrationService.runTenantMigrations('restpoint_operations', OPERATIONS_MIGRATIONS, config);
 *
 * NOTE: JWT secrets managed in tenant_tracking DB by Tenant.model.ts.
 * NOTE: No per-tenant shared database is created anymore — only ONE central
 *       operations database + ONE main database per tenant.
 */

import type { Migration } from './migration-service';

// ─── Tenant Service Migrations ───────────────────────────────────────────────

const TENANT_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '001_create_organizations_table',
    sql: `CREATE TABLE IF NOT EXISTS organizations (id CHAR(36) PRIMARY KEY, slug VARCHAR(255) NOT NULL UNIQUE, organization_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, location VARCHAR(255) NOT NULL, logo_url VARCHAR(500) NULL, logo_public_id VARCHAR(255) NULL, terms_accepted BOOLEAN DEFAULT TRUE, is_active BOOLEAN DEFAULT TRUE, subscription_plan ENUM('basic', 'free', 'premium') DEFAULT 'basic', subscription_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active', subscription_expires_at VARCHAR(255) NULL, created_at VARCHAR(255) NULL, updated_at VARCHAR(255) NULL, INDEX idx_slug (slug), INDEX idx_email (email), INDEX idx_organization_name (organization_name), INDEX idx_subscription_status (subscription_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '001a_create_tenants_table',
    sql: `CREATE TABLE IF NOT EXISTS tenants (tenant_id VARCHAR(36) PRIMARY KEY, tenant_name VARCHAR(255) NOT NULL, tenant_slug VARCHAR(255) UNIQUE NOT NULL, db_name VARCHAR(255) UNIQUE NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(50), location TEXT, country VARCHAR(100), logo_url VARCHAR(500), status ENUM('active', 'suspended', 'deleted') DEFAULT 'active', subscription_status ENUM('active', 'trial', 'suspended', 'cancelled') DEFAULT 'trial', subscription_expires_at VARCHAR(255) NULL, deployment_type ENUM('single', 'multi') DEFAULT 'single', created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_deployment_type (deployment_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '002_create_branches_table',
    sql: 'CREATE TABLE IF NOT EXISTS branches (branch_id VARCHAR(36) PRIMARY KEY, parent_branch_id VARCHAR(36) NULL, branch_name VARCHAR(255) NOT NULL, branch_slug VARCHAR(255) UNIQUE NOT NULL, branch_code VARCHAR(255), branch_db_name VARCHAR(255), branch_location TEXT, branch_phone VARCHAR(50), branch_email VARCHAR(255), is_active BOOLEAN DEFAULT TRUE, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_branch_slug (branch_slug), INDEX idx_branch_code (branch_code), INDEX idx_is_active (is_active), INDEX idx_parent_branch_id (parent_branch_id), FOREIGN KEY (parent_branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '002a_add_branch_code_column',
    sql: 'ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_code VARCHAR(255) NULL AFTER branch_slug, ADD INDEX IF NOT EXISTS idx_branch_code (branch_code)',
  },
  {
    name: '002b_add_parent_branch_id_to_branches',
    sql: 'ALTER TABLE branches ADD COLUMN IF NOT EXISTS parent_branch_id VARCHAR(36) NULL AFTER branch_id, ADD INDEX IF NOT EXISTS idx_parent_branch_id (parent_branch_id), ADD CONSTRAINT fk_branch_parent FOREIGN KEY (parent_branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL',
  },
  {
    name: '003_create_users_table',
    sql: `CREATE TABLE IF NOT EXISTS users (user_id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, username VARCHAR(255) NOT NULL UNIQUE, phone VARCHAR(20), role VARCHAR(100) DEFAULT 'staff' NOT NULL, slug VARCHAR(255) NULL UNIQUE, branch_id VARCHAR(36) NULL, is_active BOOLEAN DEFAULT TRUE, is_verified BOOLEAN DEFAULT FALSE, last_login_at VARCHAR(255) NULL, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_email (email), INDEX idx_username (username), INDEX idx_role (role), INDEX idx_slug (slug), INDEX idx_branch_id (branch_id), FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '003_create_refresh_tokens_table',
    sql: 'CREATE TABLE IF NOT EXISTS refresh_tokens (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, token VARCHAR(500) NOT NULL, expires_at VARCHAR(255) NOT NULL, is_active BOOLEAN DEFAULT TRUE, created_at VARCHAR(255), FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE, INDEX idx_token (token(255)), INDEX idx_user_id (user_id), INDEX idx_expires_at (expires_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '004_create_mortuary_settings_table',
    sql: 'CREATE TABLE IF NOT EXISTS mortuary_settings (id VARCHAR(36) PRIMARY KEY, setting_key VARCHAR(255) NOT NULL UNIQUE, setting_value TEXT, description TEXT, created_at VARCHAR(255), updated_at VARCHAR(255)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '005_create_activity_logs_table',
    sql: 'CREATE TABLE IF NOT EXISTS activity_logs (log_id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), action VARCHAR(255) NOT NULL, entity_type VARCHAR(100), entity_id VARCHAR(100), details TEXT, ip_address VARCHAR(45), created_at VARCHAR(255), INDEX idx_user_id (user_id), INDEX idx_action (action), INDEX idx_entity (entity_type, entity_id), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '017_fix_role_column',
    sql: `ALTER TABLE users MODIFY COLUMN role VARCHAR(100) DEFAULT 'user' COMMENT 'User role (admin, manager, staff, user, driver, workshop_manager, HR, accounts, mortician, supervisor, technician, system_administrator, receptionist, hearse_driver, etc.)'`,
  },
];

// ─── Deceased Service Migrations ─────────────────────────────────────────────

const DECEASED_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '010_create_deceased_table',
    sql: `CREATE TABLE IF NOT EXISTS deceased (id INT NOT NULL AUTO_INCREMENT, deceased_id VARCHAR(100) NOT NULL COMMENT 'Unique identifier', admission_number VARCHAR(100) NOT NULL UNIQUE, full_name VARCHAR(255) NOT NULL, gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Other', age INT DEFAULT 0, date_of_birth DATE NULL, date_of_death DATE NULL, date_registered VARCHAR(255) NULL, date_admitted VARCHAR(255) NULL, time_received TIME NULL, cause_of_death TEXT, place_of_death VARCHAR(255), physician VARCHAR(255), body_status VARCHAR(100) DEFAULT 'In Morgue', national_id VARCHAR(100), id_type ENUM('national-id', 'passport', 'voters-card', 'other') NULL, email VARCHAR(255), phone_number VARCHAR(20), alternative_phone VARCHAR(20), received_from VARCHAR(255), receiving_officer VARCHAR(255), signature TEXT, verified_by VARCHAR(255), relationship VARCHAR(100), permit_number VARCHAR(100) NULL, county VARCHAR(100) DEFAULT 'Unknown', location VARCHAR(255), portal_slug VARCHAR(255) UNIQUE NULL, admission_status ENUM('admitted', 'embalmed', 'released', 'buried') DEFAULT 'admitted', release_status ENUM('pending', 'approved', 'released') DEFAULT 'pending', chamber_assigned VARCHAR(100), total_mortuary_charge DECIMAL(10,2) DEFAULT 0.00, currency VARCHAR(3) DEFAULT 'KES', burial_type VARCHAR(50) NULL, coffin_status VARCHAR(50), dispatch_date DATE, extra_charges_amount DECIMAL(10,2) DEFAULT 0, next_of_kin_count INT DEFAULT 0, created_by VARCHAR(255), status VARCHAR(50) DEFAULT 'active', is_deleted BOOLEAN DEFAULT FALSE, branch_code VARCHAR(50) NULL, created_at VARCHAR(255), updated_at VARCHAR(255), PRIMARY KEY (id), UNIQUE KEY unique_deceased_id (deceased_id), UNIQUE KEY unique_admission_number (admission_number), INDEX idx_deceased_id (deceased_id), INDEX idx_date_of_death (date_of_death), INDEX idx_created_at (created_at), INDEX idx_full_name (full_name), INDEX idx_status (admission_status), INDEX idx_is_deleted (is_deleted)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Deceased persons'`,
  },
  {
    name: '010a_alter_deceased_table_add_missing_columns',
    sql: `ALTER TABLE deceased ADD COLUMN IF NOT EXISTS date_registered VARCHAR(255) NULL AFTER date_of_death, ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' AFTER created_by, ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES' AFTER total_mortuary_charge, ADD COLUMN IF NOT EXISTS burial_type VARCHAR(50) NULL AFTER currency, ADD COLUMN IF NOT EXISTS extra_charges_amount DECIMAL(10,2) DEFAULT 0 AFTER dispatch_date, ADD COLUMN IF NOT EXISTS next_of_kin_count INT DEFAULT 0 AFTER extra_charges_amount, ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50) NULL AFTER is_deleted`,
  },
  {
    name: '011_create_next_of_kin_table',
    sql: `CREATE TABLE IF NOT EXISTS next_of_kin (id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(50) NOT NULL, tenant_slug VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, relationship VARCHAR(100) NOT NULL, contact VARCHAR(30) NOT NULL, email VARCHAR(255), alternative_phone VARCHAR(20), id_number VARCHAR(100), id_type ENUM('national-id', 'passport', 'voters-card', 'other') NULL, address TEXT, is_primary BOOLEAN DEFAULT TRUE, is_notified BOOLEAN DEFAULT FALSE, notified_at VARCHAR(255) NULL, created_by VARCHAR(255), created_at VARCHAR(255), updated_at VARCHAR(255), is_deleted BOOLEAN DEFAULT FALSE, deleted_at VARCHAR(255) NULL, deleted_by VARCHAR(255), FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE, INDEX idx_deceased_id (deceased_id), INDEX idx_relationship (relationship), INDEX idx_tenant_slug (tenant_slug)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '011a_add_next_of_kin_missing_columns',
    sql: 'ALTER TABLE next_of_kin ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE AFTER email, ADD COLUMN IF NOT EXISTS is_notified BOOLEAN DEFAULT FALSE AFTER is_primary, ADD COLUMN IF NOT EXISTS notified_at VARCHAR(255) NULL AFTER is_notified, ADD COLUMN IF NOT EXISTS alternative_contact VARCHAR(50) NULL AFTER address, ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NULL AFTER alternative_contact, ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE AFTER created_at, ADD COLUMN IF NOT EXISTS deleted_at VARCHAR(255) NULL AFTER is_deleted, ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100) NULL AFTER deleted_at, ADD COLUMN IF NOT EXISTS updated_at VARCHAR(255) AFTER created_at',
  },
  {
    name: '013_create_postmortem_table',
    sql: `CREATE TABLE IF NOT EXISTS postmortem (id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(100) NOT NULL, pathologist_name VARCHAR(255), external_pathologist_name VARCHAR(255), external_pathologist_mobile VARCHAR(20), external_pathologist_id VARCHAR(50), examination_summary TEXT, cause_of_death TEXT, immediate_cause_of_death TEXT, underlying_cause_of_death TEXT, contributing_conditions TEXT, manner_of_death VARCHAR(50), requesting_authority VARCHAR(100), findings JSON, head_findings TEXT, chest_findings TEXT, abdomen_findings TEXT, extremities_findings TEXT, toxicology_findings TEXT, custom_findings JSON, report_pdf_url VARCHAR(500), staff_username VARCHAR(255), mortuary_name VARCHAR(255), status VARCHAR(50) DEFAULT 'pending', requested_by VARCHAR(255), requested_at VARCHAR(255), completed_at VARCHAR(255), created_at VARCHAR(255), updated_at VARCHAR(255), created_by INT, updated_by INT, FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE, INDEX idx_deceased_id (deceased_id), INDEX idx_status (status), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '014_create_charges_table',
    sql: `CREATE TABLE IF NOT EXISTS charges (id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(50) NOT NULL, charge_type VARCHAR(100) NOT NULL, description TEXT, amount DECIMAL(10, 2) NOT NULL, status ENUM('pending', 'paid', 'waived', 'cancelled') DEFAULT 'pending', created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_deceased_id (deceased_id), INDEX idx_charge_type (charge_type), INDEX idx_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    // Documents table is created per-tenant here so the documents-service can write
    // DB records (stored in each tenant's MAIN database) during upload. Previously
    // this table was missing from the migration set, so every INSERT INTO documents
    // failed with "Table '...documents' doesn't exist" and uploads silently fell back
    // to filesystem-only storage. (Fixes documents migration on tenant creation.)
    name: '015_create_documents_table',
    sql: `CREATE TABLE IF NOT EXISTS documents (document_id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(100) NOT NULL, document_type VARCHAR(100), file_name VARCHAR(255), original_name VARCHAR(255), stored_name VARCHAR(255), file_path VARCHAR(500), mime_type VARCHAR(100), file_size BIGINT DEFAULT 0, category VARCHAR(100) DEFAULT 'General', uploaded_by VARCHAR(255), status VARCHAR(50) DEFAULT 'pending', uploaded_at VARCHAR(255), created_at VARCHAR(255), updated_at VARCHAR(255), tenant_slug VARCHAR(255), FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE, INDEX idx_documents_deceased (deceased_id), INDEX idx_documents_tenant (tenant_slug), INDEX idx_documents_type (document_type), INDEX idx_documents_uploaded (uploaded_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

// ─── Billing Service Migrations ──────────────────────────────────────────────

const BILLING_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '190_create_daily_billing_table',
    sql: 'CREATE TABLE IF NOT EXISTS daily_billing (id INT PRIMARY KEY AUTO_INCREMENT, deceased_id INT NOT NULL, tenant_slug VARCHAR(100) NOT NULL, days_admitted INT NOT NULL, daily_rate DECIMAL(10,2) NOT NULL, base_charges DECIMAL(10,2) NOT NULL, additional_charges DECIMAL(10,2) DEFAULT 0, total_charge DECIMAL(10,2) NOT NULL, billing_date DATE NOT NULL, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_deceased (deceased_id), INDEX idx_tenant_date (tenant_slug, billing_date), UNIQUE KEY unique_deceased_date (deceased_id, billing_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '191_create_billing_job_logs_table',
    sql: 'CREATE TABLE IF NOT EXISTS billing_job_logs (id INT PRIMARY KEY AUTO_INCREMENT, job_type VARCHAR(50) NOT NULL, total_tenants INT NOT NULL, total_processed INT NOT NULL, total_succeeded INT NOT NULL, total_failed INT NOT NULL, results JSON, executed_at VARCHAR(255) NOT NULL, INDEX idx_executed (executed_at), INDEX idx_job_type (job_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '192_create_tenant_settings_table',
    sql: `CREATE TABLE IF NOT EXISTS tenant_settings (id VARCHAR(36) PRIMARY KEY, tenant_slug VARCHAR(100) UNIQUE NOT NULL, daily_rate DECIMAL(10,2) DEFAULT 1500.00, embalming_rate DECIMAL(10,2) DEFAULT 3000.00, storage_rate DECIMAL(10,2) DEFAULT 500.00, currency VARCHAR(10) DEFAULT 'KES', tax_rate DECIMAL(5,2) DEFAULT 0.00, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_tenant (tenant_slug)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET @mig_cols = (SELECT GROUP_CONCAT(COLUMN_NAME) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant_settings');
SET @mig_sql = IF(FIND_IN_SET('id', @mig_cols) > 0, 'ALTER TABLE tenant_settings MODIFY COLUMN id VARCHAR(36) NOT NULL', 'SELECT 1');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('tenant_slug', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN tenant_slug VARCHAR(100) NOT NULL');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('daily_rate', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN daily_rate DECIMAL(10,2) DEFAULT 1500.00');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('embalming_rate', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN embalming_rate DECIMAL(10,2) DEFAULT 3000.00');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('storage_rate', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN storage_rate DECIMAL(10,2) DEFAULT 500.00');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('currency', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN currency VARCHAR(10) DEFAULT ''KES''');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('tax_rate', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('created_at', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN created_at VARCHAR(255)');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;
SET @mig_sql = IF(FIND_IN_SET('updated_at', @mig_cols) > 0, 'SELECT 1', 'ALTER TABLE tenant_settings ADD COLUMN updated_at VARCHAR(255)');
PREPARE mig_st FROM @mig_sql; EXECUTE mig_st; DEALLOCATE PREPARE mig_st;`,
  },
];

// ─── Invoice & Payments Service Migrations ───────────────────────────────────

const INVOICE_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '030_create_invoices_table',
    sql: `CREATE TABLE IF NOT EXISTS invoices (invoice_id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(50) NOT NULL, order_id INT, invoice_number VARCHAR(50) UNIQUE, amount DECIMAL(10, 2) NOT NULL, status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending', issue_date VARCHAR(255), due_date VARCHAR(255) NULL, paid_date VARCHAR(255) NULL, notes TEXT, created_at VARCHAR(255), updated_at VARCHAR(255), FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE, INDEX idx_deceased_id (deceased_id), INDEX idx_invoice_number (invoice_number), INDEX idx_status (status), INDEX idx_issue_date (issue_date), INDEX idx_due_date (due_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '031_create_payments_table',
    sql: `CREATE TABLE IF NOT EXISTS payments (payment_id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(50) NOT NULL, invoice_id INT, transaction_id VARCHAR(255) UNIQUE, phone_number VARCHAR(20), amount DECIMAL(15, 2) NOT NULL, payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'check') DEFAULT 'cash', payment_date VARCHAR(255), reference_number VARCHAR(100), receipt_number VARCHAR(100), status ENUM('pending', 'confirmed', 'completed', 'failed', 'refunded') DEFAULT 'pending', message TEXT, notes TEXT, created_at VARCHAR(255), updated_at VARCHAR(255), FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE, FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id), INDEX idx_deceased_id (deceased_id), INDEX idx_invoice_id (invoice_id), INDEX idx_transaction_id (transaction_id), INDEX idx_payment_date (payment_date), INDEX idx_reference_number (reference_number), INDEX idx_status (status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

// ─── Body Checkout Service Migrations ────────────────────────────────────────

const BODY_CHECKOUT_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '070_create_body_checkout_table',
    sql: `CREATE TABLE IF NOT EXISTS body_checkout (id INT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(50) NOT NULL, checkout_type ENUM('release', 'transfer', 'burial', 'cremation') NOT NULL, destination VARCHAR(255), destination_contact VARCHAR(100), release_date VARCHAR(255), expected_return_date VARCHAR(255) NULL, actual_return_date VARCHAR(255) NULL, status ENUM('pending', 'approved', 'in_transit', 'completed', 'returned', 'rejected') DEFAULT 'pending', approved_by INT, released_by INT, notes TEXT, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_deceased_id (deceased_id), INDEX idx_checkout_type (checkout_type), INDEX idx_status (status), INDEX idx_release_date (release_date), FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '071_create_checkout_approvals_table',
    sql: `CREATE TABLE IF NOT EXISTS checkout_approvals (id INT AUTO_INCREMENT PRIMARY KEY, checkout_id INT NOT NULL, approver_id INT NOT NULL, approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', approval_date VARCHAR(255), comments TEXT, INDEX idx_checkout_id (checkout_id), INDEX idx_approver_id (approver_id), FOREIGN KEY (checkout_id) REFERENCES body_checkout(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

// ─── Coffin Service Migrations ───────────────────────────────────────────────

const COFFIN_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '080_create_coffins_table',
    sql: 'CREATE TABLE IF NOT EXISTS coffins (coffin_id VARCHAR(255) NOT NULL, tenant_slug VARCHAR(100) NOT NULL, type VARCHAR(255) NOT NULL, exact_price DECIMAL(15, 2) NOT NULL DEFAULT 0, quantity INT DEFAULT 1, color VARCHAR(100) DEFAULT NULL, size VARCHAR(100) DEFAULT NULL, is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE, created_at VARCHAR(255) NOT NULL, updated_at VARCHAR(255), PRIMARY KEY (coffin_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_type (type), INDEX idx_quantity (quantity), INDEX idx_is_active (is_active), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '081_create_coffin_images_table',
    sql: 'CREATE TABLE IF NOT EXISTS coffin_images (image_id INT NOT NULL AUTO_INCREMENT, coffin_id VARCHAR(255) NOT NULL, tenant_slug VARCHAR(100) NOT NULL, image_url VARCHAR(500) NOT NULL, image_name VARCHAR(255), display_order INT DEFAULT 0, created_at VARCHAR(255) NOT NULL, PRIMARY KEY (image_id), INDEX idx_coffin_id (coffin_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_created_at (created_at), FOREIGN KEY (coffin_id) REFERENCES coffins(coffin_id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '082_create_coffin_usage_table',
    sql: 'CREATE TABLE IF NOT EXISTS coffin_usage (usage_id INT NOT NULL AUTO_INCREMENT, coffin_id VARCHAR(255) NOT NULL, tenant_slug VARCHAR(100) NOT NULL, deceased_id VARCHAR(100), quantity_used INT NOT NULL DEFAULT 1, unit_price DECIMAL(15, 2) NOT NULL, total_price DECIMAL(15, 2) NOT NULL, invoice_id VARCHAR(100), used_at VARCHAR(255) NOT NULL, notes TEXT, created_by INT, created_at VARCHAR(255) NOT NULL, updated_at VARCHAR(255), PRIMARY KEY (usage_id), INDEX idx_coffin_id (coffin_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_deceased_id (deceased_id), INDEX idx_invoice_id (invoice_id), INDEX idx_used_at (used_at), FOREIGN KEY (coffin_id) REFERENCES coffins(coffin_id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '083_create_deceased_coffin_table',
    sql: 'CREATE TABLE IF NOT EXISTS deceased_coffin (id INT NOT NULL AUTO_INCREMENT, deceased_id VARCHAR(100) NOT NULL, coffin_id VARCHAR(255) NOT NULL, tenant_slug VARCHAR(100) NOT NULL, assigned_by_username VARCHAR(100) DEFAULT NULL, assigned_date DATE NOT NULL, rfid VARCHAR(100) UNIQUE, created_at VARCHAR(255), PRIMARY KEY (id), INDEX idx_deceased_id (deceased_id), INDEX idx_coffin_id (coffin_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_assigned_date (assigned_date), UNIQUE KEY unique_deceased_coffin (deceased_id, coffin_id), FOREIGN KEY (coffin_id) REFERENCES coffins(coffin_id) ON DELETE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '084_add_req_type_to_stock_requests',
    sql: `ALTER TABLE stock_requests ADD COLUMN IF NOT EXISTS req_type ENUM('client', 'replenishment') DEFAULT 'replenishment' AFTER notes, ADD INDEX IF NOT EXISTS idx_req_type (req_type)`,
  },
  {
    name: '085_make_stock_requests_deceased_name_nullable',
    sql: 'ALTER TABLE stock_requests MODIFY COLUMN deceased_name VARCHAR(255) NULL',
  },
];

// ─── Chemicals Service ────────────────────────────────────────────────────────
// NOTE: Chemical service migrations are NOT defined here anymore — the chemical
// service runs its own table creation directly via ensureChemicalTables() in
// services/chemical-service/server.js against the shared restpoint_operations DB.

const CHEMICALS_SERVICE_MIGRATIONS: Migration[] = [];

// ─── Hearse Service Migrations ────────────────────────────────────────────────
// NOTE: Hearse migrations are NOT defined in this registry anymore.
// The hearse service owns its migrations (services/hearse-service/migrations/)
// and applies them directly to the shared restpoint_operations DB at startup.

// ─── Leave Service Migrations ────────────────────────────────────────────────

const LEAVE_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '170_create_leave_requests_table',
    sql: `CREATE TABLE IF NOT EXISTS leave_requests (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, tenant_slug VARCHAR(100) NOT NULL, leave_type VARCHAR(50) NOT NULL, priority ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium', start_date DATE NOT NULL, end_date DATE NOT NULL, days DECIMAL(5,2) NOT NULL, reason TEXT, supporting_document VARCHAR(500), is_half_day BOOLEAN DEFAULT FALSE, status VARCHAR(50) DEFAULT 'pending', rejection_reason TEXT, approved_by INT NULL, approved_at VARCHAR(255) NULL, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_leave_user (user_id), INDEX idx_leave_tenant (tenant_slug), INDEX idx_leave_status (status), INDEX idx_leave_dates (start_date, end_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '171_create_leave_day_additions_table',
    sql: 'CREATE TABLE IF NOT EXISTS leave_day_additions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, tenant_slug VARCHAR(100) NOT NULL, days INT NOT NULL, reason TEXT, added_by INT NOT NULL, created_at DATE DEFAULT (CURRENT_DATE), INDEX idx_addition_user (user_id), INDEX idx_addition_tenant (tenant_slug), INDEX idx_addition_date (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '172_create_holiday_compensations_table',
    sql: 'CREATE TABLE IF NOT EXISTS holiday_compensations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, tenant_slug VARCHAR(100) NOT NULL, holiday_date DATE NOT NULL, holiday_name VARCHAR(255) NOT NULL, note TEXT, recorded_by INT NOT NULL, created_at VARCHAR(255), INDEX idx_holiday_user (user_id), INDEX idx_holiday_tenant (tenant_slug), INDEX idx_holiday_date (holiday_date), UNIQUE KEY unique_user_holiday (user_id, holiday_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '173_add_annual_leave_balance_to_users',
    sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_leave_balance DECIMAL(5,2) DEFAULT 26.00',
  },
  {
    name: '174_update_default_leave_balance',
    sql: 'UPDATE users SET annual_leave_balance = 26.00 WHERE annual_leave_balance IS NULL OR annual_leave_balance = 0',
  },
];

// ─── Florist Service Migrations ──────────────────────────────────────────────

const FLORIST_SERVICE_MIGRATIONS: Migration[] = [
  {
    name: '160_create_flower_bookings_table',
    sql: `CREATE TABLE IF NOT EXISTS flower_bookings (id INT AUTO_INCREMENT PRIMARY KEY, booking_id VARCHAR(100) UNIQUE NOT NULL, flower_type VARCHAR(255) NOT NULL, flower_description TEXT, service_type VARCHAR(100) DEFAULT 'funeral', customer VARCHAR(255) NOT NULL, customer_phone VARCHAR(50), customer_email VARCHAR(255), deceased_name VARCHAR(255), branch VARCHAR(255), delivery_date DATE NOT NULL, delivery_time TIME NOT NULL, delivery_address TEXT, invoice_number VARCHAR(100) UNIQUE, amount DECIMAL(10,2) DEFAULT 0, status ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending', notes TEXT, urgent BOOLEAN DEFAULT FALSE, branch_id INT, created_by VARCHAR(255), created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_booking_id (booking_id), INDEX idx_delivery_date (delivery_date), INDEX idx_status (status), INDEX idx_customer (customer), INDEX idx_branch (branch)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '161_create_flower_customers_table',
    sql: 'CREATE TABLE IF NOT EXISTS flower_customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(50), email VARCHAR(255), address TEXT, notes TEXT, total_orders INT DEFAULT 0, total_spent DECIMAL(10,2) DEFAULT 0, branch_id INT, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_phone (phone), INDEX idx_email (email), INDEX idx_name (name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '162_create_flower_samples_table',
    sql: 'CREATE TABLE IF NOT EXISTS flower_samples (id INT AUTO_INCREMENT PRIMARY KEY, arrangement_id VARCHAR(100) UNIQUE NOT NULL, title VARCHAR(255) NOT NULL, description TEXT, types JSON, colors JSON, sizes JSON, price DECIMAL(12,2) DEFAULT NULL, images JSON, tenant_slug VARCHAR(100) NOT NULL, created_at VARCHAR(255), updated_at VARCHAR(255), INDEX idx_arrangement_id (arrangement_id), INDEX idx_tenant_slug (tenant_slug)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '163_add_flower_booking_extras',
    sql: 'ALTER TABLE flower_bookings ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1 AFTER amount, ADD COLUMN IF NOT EXISTS arrangements TEXT AFTER quantity, ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT NULL AFTER arrangements, ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT NULL AFTER primary_color, ADD COLUMN IF NOT EXISTS ribbon_color VARCHAR(50) DEFAULT NULL AFTER accent_color',
  },
  {
    name: '164_add_price_to_flower_samples',
    sql: 'ALTER TABLE flower_samples ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT NULL AFTER sizes',
  },
];

// ─── Extra Services Migrations ───────────────────────────────────────────────

const EXTRA_SERVICES_MIGRATIONS: Migration[] = [
  {
    name: '200_create_extra_charges_table',
    sql: `CREATE TABLE IF NOT EXISTS extra_charges (charge_id INT NOT NULL AUTO_INCREMENT, tenant_slug VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation', deceased_id VARCHAR(100) NOT NULL COMMENT 'Reference to deceased', charge_type VARCHAR(100) NOT NULL COMMENT 'Type of charge (transport, extra-embalming, storage, etc)', amount DECIMAL(15,2) NOT NULL COMMENT 'Charge amount', currency ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'KES' COMMENT 'Currency', service_date VARCHAR(255) NULL COMMENT 'When service was provided', requested_by VARCHAR(100) COMMENT 'Staff who requested charge', status ENUM('pending', 'approved', 'invoiced', 'paid', 'rejected', 'cancelled') DEFAULT 'pending', approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required', approved_by INT COMMENT 'Manager who approved', approved_at VARCHAR(255) NULL COMMENT 'When charge was approved', invoice_id VARCHAR(100) COMMENT 'Associated invoice', notes TEXT, rejection_reason TEXT COMMENT 'Reason for rejection', created_by INT COMMENT 'User who created record', created_at VARCHAR(255) NULL, updated_at VARCHAR(255) NULL, is_deleted BOOLEAN DEFAULT FALSE, PRIMARY KEY (charge_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_deceased_id (deceased_id), INDEX idx_charge_type (charge_type), INDEX idx_status (status), INDEX idx_approval_status (approval_status), INDEX idx_service_date (service_date), INDEX idx_invoice_id (invoice_id), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: '201_create_charge_types_table',
    sql: 'CREATE TABLE IF NOT EXISTS charge_types (type_id INT NOT NULL AUTO_INCREMENT, tenant_slug VARCHAR(100) NOT NULL, charge_type VARCHAR(100) NOT NULL, description TEXT, default_amount DECIMAL(15,2) NOT NULL DEFAULT 0, requires_approval BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, created_at VARCHAR(255) NULL, updated_at VARCHAR(255) NULL, PRIMARY KEY (type_id), UNIQUE KEY unique_charge_type_per_tenant (tenant_slug, charge_type), INDEX idx_tenant_slug (tenant_slug), INDEX idx_is_active (is_active)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  },
  {
    name: '202_create_charge_approvals_table',
    sql: `CREATE TABLE IF NOT EXISTS charge_approvals (approval_id INT NOT NULL AUTO_INCREMENT, charge_id INT NOT NULL, tenant_slug VARCHAR(100) NOT NULL, approved_by INT NOT NULL COMMENT 'Manager user ID', approval_status ENUM('approved', 'rejected', 'pending_review') NOT NULL, comments TEXT, approval_date VARCHAR(255) NULL, PRIMARY KEY (approval_id), INDEX idx_charge_id (charge_id), INDEX idx_tenant_slug (tenant_slug), INDEX idx_approval_date (approval_date), FOREIGN KEY (charge_id) REFERENCES extra_charges(charge_id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

// ─── Combined Migration Lists ──────────────────────────────────────────────

// ─── MAIN TENANT MIGRATIONS (per-tenant database) ─────────────────────────────
// These tables live in EACH tenant's single MAIN database. They include core
// tenant lifecycle tables plus the per-tenant business tables: deceased records,
// invoices, payments, body checkout, billing/daily charges, leave, etc.
// Leave tables belong HERE (per-tenant): the leave service resolves each tenant's
// main database by slug, stores leave data there (tenant_slug column), and extends
// each tenant's `users` table (annual_leave_balance). Keeping them in this list
// makes EVERY tenant main DB AND every branch DB (getMainTenantMigrations() /
// getBranchMigrations() both return this list) receive the leave migrations at
// provisioning / branch-creation time and via migrate:all / run-tenant-migrations.
// Operational/shared tables (coffins, hearses, florists, workshop, chemicals,
// extra-charges) are NOT here — they live in the shared `restpoint_operations`
// database and are managed by their own services.
export const ALL_TENANT_MIGRATIONS: Migration[] = [
  ...TENANT_SERVICE_MIGRATIONS,
  ...DECEASED_SERVICE_MIGRATIONS,
  ...INVOICE_SERVICE_MIGRATIONS,
  ...BODY_CHECKOUT_SERVICE_MIGRATIONS,
  ...BILLING_SERVICE_MIGRATIONS,
  // Leave service migrations run inside EVERY tenant/branch database so every
  // tenant and every branch gets the leave tables + users leave columns.
  ...LEAVE_SERVICE_MIGRATIONS,
];

// ─── OPERATIONS MIGRATIONS (ONE central database for ALL tenants) ─────────────
// These tables live in the single shared `restpoint_operations` database. Every
// tenant shares these tables; isolation is via tenant_slug / tenant_id columns.
// Each service runs its own knex migrations independently against this DB.
// NOTE: Leave tables are NOT here — they are per-tenant (see ALL_TENANT_MIGRATIONS).
export const OPERATIONS_MIGRATIONS: Migration[] = [...EXTRA_SERVICES_MIGRATIONS];

// Alias for backward compatibility
export const ALL_SERVICE_MIGRATIONS = ALL_TENANT_MIGRATIONS;

// No longer creates separate branch databases — all branches share the single
// main tenant database. Kept for backward compatibility.
export const BRANCH_MIGRATIONS: Migration[] = [...ALL_TENANT_MIGRATIONS];

// Single-branch tenants get only main DB migrations (no branch DBs).
export const SINGLE_TENANT_MIGRATIONS: Migration[] = [...ALL_TENANT_MIGRATIONS];

// ─── Export by Service ────────────────────────────────────────────────────────

export {
  BILLING_SERVICE_MIGRATIONS,
  BODY_CHECKOUT_SERVICE_MIGRATIONS,
  DECEASED_SERVICE_MIGRATIONS,
  EXTRA_SERVICES_MIGRATIONS,
  INVOICE_SERVICE_MIGRATIONS,
  LEAVE_SERVICE_MIGRATIONS,
  TENANT_SERVICE_MIGRATIONS,
};

// ─── Helper Functions ────────────────────────────────────────────────────────

// ─── Core / Optional split ───────────────────────────────────────────────
// Define the minimal set of migrations that every tenant MUST have. These are
// essential tables required for tenant lifecycle and authentication. All other
// migrations are considered optional and can be applied later via a migration
// runner (see services/tenant-service/scripts/run-pending-migrations.js).
const CORE_MIGRATION_NAMES = [
  '001_create_organizations_table',
  '001a_create_tenants_table',
  '002_create_branches_table',
  '002a_add_branch_code_column',
  '002b_add_parent_branch_id_to_branches',
  '003_create_users_table',
  '003_create_refresh_tokens_table',
  '004_create_mortuary_settings_table',
  '005_create_activity_logs_table',
];

export function getCoreMigrations(): Migration[] {
  return ALL_TENANT_MIGRATIONS.filter((m) => CORE_MIGRATION_NAMES.includes(m.name));
}

export function getOptionalMigrations(): Migration[] {
  return ALL_TENANT_MIGRATIONS.filter((m) => !CORE_MIGRATION_NAMES.includes(m.name));
}

export function getMainTenantMigrations(): Migration[] {
  // Main tenant database — core + business tables only (no operational/shared tables).
  return ALL_TENANT_MIGRATIONS;
}

export function getBranchMigrations(): Migration[] {
  // Branch databases are no longer created — branches share the single main DB.
  return ALL_TENANT_MIGRATIONS;
}

export function getSingleTenantMigrations(): Migration[] {
  // Single-branch tenants get only main DB migrations (no branch DBs).
  return ALL_TENANT_MIGRATIONS;
}

export function getAllTenantMigrations(): Migration[] {
  // Return main-DB migrations when an operator explicitly requests all migrations.
  return ALL_TENANT_MIGRATIONS;
}

export function getOperationsMigrations(): Migration[] {
  // Return the full operational migration list for the shared operations DB.
  return OPERATIONS_MIGRATIONS;
}
