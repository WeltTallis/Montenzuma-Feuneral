const dotenv = require('dotenv');
const path = require('path');

// Load .env from chemical-service directory
dotenv.config({ path: path.join(__dirname, '.env'), override: false });
// Also load global .env as fallback
dotenv.config({ path: path.join(__dirname, '../../.env'), override: false });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { getTenantDB, safeTenantQuery, safeTenantExecute } = require('../../shared/dbConfig');
const { validateTenantActive } = require('../../shared/tenancy');
const chemicalRoutes = require('./routes/chemicalRoutes');

const app = express();
const PORT = process.env.PORT || 5019;

async function migrateLegacyBranchInventory(operationsDb, mainBranchSlug, branches) {
  const pool = await getTenantDB(operationsDb);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'INSERT IGNORE INTO chemical_inventory_migrations (tenant_slug) VALUES (?)',
      [mainBranchSlug]
    );
    const [migrationRows] = await connection.query(
      'SELECT migrated_at FROM chemical_inventory_migrations WHERE tenant_slug=? FOR UPDATE',
      [mainBranchSlug]
    );
    if (migrationRows[0]?.migrated_at) {
      await connection.commit();
      return;
    }

    for (const branch of branches) {
      if (!branch.branch_slug || branch.branch_slug === mainBranchSlug) continue;
      const [legacyChemicals] = await connection.query(
        'SELECT id, current_stock FROM chemicals WHERE tenant_slug=? AND is_active=1',
        [branch.branch_slug]
      );
      for (const chemical of legacyChemicals) {
        const stock = Number(chemical.current_stock || 0);
        if (stock > 0) {
          await connection.query(
            `INSERT INTO chemical_branch_stock (tenant_slug, chemical_id, branch_slug, current_stock)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
            [mainBranchSlug, chemical.id, branch.branch_slug, stock]
          );
        }
      }
      await connection.query(
        'UPDATE chemicals SET current_stock=0, tenant_slug=? WHERE tenant_slug=? AND is_active=1',
        [mainBranchSlug, branch.branch_slug]
      );
      await connection.query(
        'UPDATE chemicals SET tenant_slug=? WHERE tenant_slug=?',
        [mainBranchSlug, branch.branch_slug]
      );
      for (const table of ['chemical_transactions', 'chemical_usage']) {
        await connection.query(
          `UPDATE \`${table}\` SET tenant_slug=?, branch_slug=COALESCE(branch_slug, ?) WHERE tenant_slug=?`,
          [mainBranchSlug, branch.branch_slug, branch.branch_slug]
        );
      }
      for (const table of ['chemical_alerts', 'ppe_requests', 'chemical_transfers']) {
        await connection.query(
          `UPDATE \`${table}\` SET tenant_slug=? WHERE tenant_slug=?`,
          [mainBranchSlug, branch.branch_slug]
        );
      }
    }

    await connection.query(
      'UPDATE chemical_inventory_migrations SET migrated_at=NOW() WHERE tenant_slug=?',
      [mainBranchSlug]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Enable CORS for gateway
app.use(cors({
  origin: true, // In production, restrict this
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-slug', 'x-tenant-slug', 'x-branch-slug', 'x-branch-id', 'x-tenant-id', 'x-user-id', 'Origin', 'X-Requested-With', 'Accept'],
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());

// ============================================
// TENANT + BRANCH RESOLUTION MIDDLEWARE (FIXED)
// ============================================
app.use(async (req, res, next) => {
  // Get tenant from headers or use default
  const tenantSlug = req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared';
  const branchId = req.headers['x-branch-id'] || null;
  const requestedBranchSlug = req.headers['x-branch-slug'] || null;

  req.tenantSlug = tenantSlug;
  req.branchId = branchId;
  req.branchSlug = requestedBranchSlug;

  console.log(`[CHEMICAL] Request: ${req.method} ${req.path}`);
  console.log(`[CHEMICAL] Tenant: ${tenantSlug}, Branch: ${branchId}`);

  // For system_shared, skip tenant validation and use the central operations DB
  if (tenantSlug === 'system_shared') {
    console.log('[CHEMICAL] Using system_shared tenant (bypassing validation)');
    req.tenant = {
      db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
      main_db_name: process.env.DB_NAME || 'restpoint_main',
      tenant_id: 1,
      name: 'System Shared',
      tenant_slug: tenantSlug
    };
    req.mainBranchSlug = 'system_shared';
    req.branchSlug = requestedBranchSlug || 'system_shared';
    return next();
  }

  // For non-system tenants — resolve tenant main DB for branch lookups, but
  // chemical DATA lives in the ONE central operations database shared by ALL
  // tenants (tenant isolation via tenant_slug column).
  try {
    console.log(`[CHEMICAL] Validating tenant: ${tenantSlug}`);
    const { resolveDatabase } = require('../../shared/dbConfig');

    let mainDbName = await resolveDatabase(tenantSlug);

    // Fallback: try the slug itself as a db name
    if (!mainDbName) {
      mainDbName = tenantSlug.replace(/-/g, '_');
    }

    req.tenant = {
      db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
      main_db_name: mainDbName,
      tenant_slug: tenantSlug,
      name: tenantSlug
    };
    console.log(`[CHEMICAL] Tenant resolved — operations DB: ${req.tenant.db_name}, main DB: ${mainDbName}`);

    const branchRows = await safeTenantQuery(
      mainDbName,
      'SELECT branch_id, branch_slug, branch_name, parent_branch_id FROM branches WHERE is_active = TRUE ORDER BY branch_name'
    );
    const mainBranch = branchRows.find((branch) => !branch.parent_branch_id) || branchRows[0];
    req.mainBranchSlug = mainBranch?.branch_slug || tenantSlug;
    if (mainBranch?.branch_slug) {
      await migrateLegacyBranchInventory(req.tenant.db_name, mainBranch.branch_slug, branchRows);
    }
    const effectiveBranchSlug = requestedBranchSlug || tenantSlug;
    const resolvedBranch = branchRows.find((branch) =>
      branch.branch_slug === effectiveBranchSlug || branch.branch_id === effectiveBranchSlug
    );
    if (effectiveBranchSlug !== tenantSlug && !resolvedBranch) {
      return res.status(400).json({ success: false, message: 'Branch is not registered for this tenant' });
    }
    req.branchSlug = resolvedBranch?.branch_slug || effectiveBranchSlug;
    req.branchUuid = resolvedBranch?.branch_id || null;

        // Resolve branch if not provided.
    // NOTE: The tenant branches table stores branch_id as VARCHAR(36) (UUID),
    // but the chemical tables' branch_id columns are INT. We resolve the UUID
    // for informational/tenant purposes, but set req.numericBranchId to the
    // integer id from the branches table (or fall back to 1) for use in INT
    // columns. This prevents "Out of range value for column 'branch_id'".
    if (!req.branchId && mainDbName) {
      const lastDash = tenantSlug.lastIndexOf('-');
      if (lastDash > 0) {
        const branchPart = tenantSlug.substring(lastDash + 1);
        try {
          const branches = await safeTenantQuery(
            mainDbName,
            'SELECT branch_id, branch_code FROM branches WHERE branch_slug LIKE ? OR branch_name LIKE ? LIMIT 1',
            [`%${branchPart}%`, `%${branchPart}%`]
          );
          if (branches.length > 0) {
            const resolvedUuid = branches[0].branch_id.toString();
            req.branchId = resolvedUuid;
            // branch_code holds the integer branch id in the chemical schema,
            // falling back to 1 (the default INT branch for shared data).
            const numericBranchId = parseInt(branches[0].branch_code) || 1;
            req.numericBranchId = numericBranchId;
            console.log(`[CHEMICAL] Branch resolved: UUID=${resolvedUuid}, numeric=${numericBranchId}`);
          }
        } catch (e) {
          console.log('[CHEMICAL] Branch resolution skipped:', e.message);
        }
      }
        }
  } catch (err) {
    console.error('[CHEMICAL] Tenant resolution error:', err.message);
    // Always fall back to the central operations DB rather than blocking
    req.tenant = {
      db_name: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
      main_db_name: process.env.DB_NAME || 'restpoint_main',
      tenant_slug: tenantSlug,
      name: tenantSlug
    };
  }

  // Ensure numericBranchId always has a sane default for INT columns.
  // If the header carried a UUID (not an integer), discard it to avoid
  // "Out of range value for column 'branch_id'" on INT columns.
  if (!req.numericBranchId) {
    if (req.branchId && /^-?\d+$/.test(String(req.branchId))) {
      req.numericBranchId = parseInt(req.branchId);
    } else {
      req.numericBranchId = 1;
    }
  }

  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'chemical-service',
    version: '1.0.0',
    tenant: req.tenantSlug,
    branchId: req.branchId,
    db_name: req.tenant?.db_name || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TEST ENDPOINT (for debugging)
// ============================================
app.get(['/api/v1/restpoint/chemicals/test', '/chemicals/test'], (req, res) => {
  res.json({
    success: true,
    message: 'Chemical service is running!',
    tenant: req.tenant,
    tenantSlug: req.tenantSlug,
    branchId: req.branchId,
    headers: {
      'x-tenant-slug': req.headers['x-tenant-slug'],
      'x-branch-id': req.headers['x-branch-id'],
      'authorization': req.headers.authorization ? 'Present' : 'Not present'
    }
  });
});

// ============================================
// ROUTES - Support both direct service URLs and gateway-rewritten URLs
// ============================================
// Some deployments hit /api/v1/restpoint/chemicals directly, while the gateway
// strips that prefix and forwards clean paths such as /chemicals.
app.use('/api/v1/restpoint/chemicals', chemicalRoutes);
app.use('/chemicals', chemicalRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  console.log(`[CHEMICAL] 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      '/health',
      '/api/v1/restpoint/chemicals',
      '/api/v1/restpoint/chemicals/test',
      '/api/v1/restpoint/chemicals/:id',
      '/api/v1/restpoint/chemicals/analytics',
      '/api/v1/restpoint/chemicals/ppe-requests',
      '/api/v1/restpoint/chemicals/transfers'
    ]
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error(`[CHEMICAL ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// AUTO-MIGRATION: Ensure chemical tables exist
// ============================================
const CHEMICAL_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS chemicals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  branch_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'embalming',
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  hazard_level ENUM('low', 'medium', 'high') DEFAULT 'low',
  supplier VARCHAR(255) DEFAULT NULL,
  batch_number VARCHAR(100) DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT DEFAULT NULL,
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  INDEX idx_chemicals_tenant (tenant_slug),
  INDEX idx_chemicals_branch (branch_id),
  INDEX idx_chemicals_category (category),
  INDEX idx_chemicals_active (is_active),
  INDEX idx_chemicals_hazard (hazard_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  chemical_id INT NOT NULL,
  branch_id INT NOT NULL DEFAULT 1,
  branch_slug VARCHAR(255) DEFAULT NULL,
  transaction_type ENUM('received', 'consumed', 'adjusted', 'wasted', 'transferred') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  previous_stock DECIMAL(10,2) NOT NULL,
  new_stock DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  performed_by VARCHAR(64) DEFAULT NULL,
  performed_by_name VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at VARCHAR(255),
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  INDEX idx_transactions_tenant (tenant_slug),
  INDEX idx_transactions_chemical (chemical_id),
  INDEX idx_transactions_branch (branch_id),
  INDEX idx_transactions_type (transaction_type),
  INDEX idx_transactions_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  branch_id INT NOT NULL DEFAULT 1,
  branch_slug VARCHAR(255) DEFAULT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  chemical_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  transaction_id INT DEFAULT NULL,
  used_by VARCHAR(64) DEFAULT NULL,
  used_by_name VARCHAR(255) DEFAULT NULL,
  usage_notes TEXT DEFAULT NULL,
  created_at VARCHAR(255),
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES chemical_transactions(id) ON DELETE SET NULL,
  INDEX idx_usage_tenant (tenant_slug),
  INDEX idx_usage_reference (reference_type, reference_id),
  INDEX idx_usage_chemical (chemical_id),
  INDEX idx_usage_branch (branch_id),
  INDEX idx_usage_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  branch_id INT NOT NULL DEFAULT 1,
  chemical_id INT NOT NULL,
  alert_threshold DECIMAL(10,2) DEFAULT NULL,
  is_triggered TINYINT(1) DEFAULT 0,
  resolved_at VARCHAR(255) NULL DEFAULT NULL,
  resolved_by INT DEFAULT NULL,
  created_at VARCHAR(255),
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  UNIQUE KEY uk_chemical_alert (chemical_id, branch_id, tenant_slug),
  INDEX idx_alerts_tenant (tenant_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ppe_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  branch_id INT NOT NULL DEFAULT 1,
  item_name VARCHAR(255) NOT NULL,
  quantity_requested INT NOT NULL DEFAULT 1,
  quantity_approved INT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'fulfilled') DEFAULT 'pending',
  requested_by VARCHAR(255) NOT NULL,
  approved_by INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  INDEX idx_ppe_tenant (tenant_slug),
  INDEX idx_ppe_branch (branch_id),
  INDEX idx_ppe_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL DEFAULT 'system_shared',
  chemical_id INT NOT NULL,
  from_branch_id INT NOT NULL,
  to_branch_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
  requested_by INT DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  INDEX idx_transfer_tenant (tenant_slug),
  INDEX idx_transfer_from (from_branch_id),
  INDEX idx_transfer_to (to_branch_id),
  INDEX idx_transfer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_branch_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL,
  chemical_id INT NOT NULL,
  branch_slug VARCHAR(255) NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chemical_branch_stock (tenant_slug, chemical_id, branch_slug),
  INDEX idx_branch_stock_branch (tenant_slug, branch_slug),
  CONSTRAINT fk_branch_stock_chemical FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_stock_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_slug VARCHAR(100) NOT NULL,
  chemical_id INT NOT NULL,
  from_branch_slug VARCHAR(255) NOT NULL,
  to_branch_slug VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  notes TEXT DEFAULT NULL,
  requested_by VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stock_transfers_tenant (tenant_slug, created_at),
  CONSTRAINT fk_stock_transfer_chemical FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemical_inventory_migrations (
  tenant_slug VARCHAR(100) PRIMARY KEY,
  migrated_at DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// GSSAPI auth plugin fix for MariaDB 10.11+
const auth_gssapi_client = function () {
  return function () {
    throw new Error('GSSAPI not supported - use mysql_native_password');
  };
};

async function normalizePPERequestsSchema(connection, dbName) {
  try {
    const [tableRows] = await connection.query("SHOW TABLES LIKE 'ppe_requests'");
    if (!tableRows.length) return;

    const [columnRows] = await connection.query("SHOW COLUMNS FROM ppe_requests LIKE 'requester_id'");
    if (!columnRows.length) return;

    await connection.query('ALTER TABLE ppe_requests DROP COLUMN requester_id');
    console.log(`   Removed legacy requester_id column from ppe_requests in ${dbName}`);
  } catch (error) {
    console.warn(`  PPE schema normalization warning for ${dbName}: ${error.message}`);
  }
}

// Employee-id columns must be able to hold a real `users.user_id`.
//
// The users table keys on `user_id VARCHAR(36)` (a UUID), but these columns
// were created as INT. Writing a UUID into an INT either errors under strict
// mode or is silently truncated to 0 — which is why per-employee tracking was
// always empty and the name had to be typed in by hand. Widen them to VARCHAR
// and resolve the real full_name at write time.
async function ensureEmployeeIdColumns(connection, dbName) {
  const fixes = [
    { table: 'chemical_usage', column: 'used_by' },
    { table: 'chemical_transactions', column: 'performed_by' },
  ];
  for (const fix of fixes) {
    try {
      const [cols] = await connection.query(
        `SHOW COLUMNS FROM \`${fix.table}\` LIKE '${fix.column}'`
      );
      if (!cols.length) continue;               // table/column not created yet
      if (String(cols[0].Type).toLowerCase().startsWith('varchar')) continue; // already fine
      await connection.query(
        `ALTER TABLE \`${fix.table}\` MODIFY COLUMN \`${fix.column}\` VARCHAR(64) DEFAULT NULL`
      );
      console.log(`   Widened ${fix.table}.${fix.column} to VARCHAR(64) in ${dbName}`);
    } catch (error) {
      console.warn(`  Employee id column warning for ${dbName}: ${error.message}`);
    }
  }
}

// Ensure pickup performer name columns exist on pre-existing databases so the
// Staff Pickup Analysis can show who picked up each chemical.
async function ensurePickupNameColumns(connection, dbName) {
  const columnFixes = [
    { table: 'chemical_transactions', column: 'performed_by_name', ddl: "ALTER TABLE chemical_transactions ADD COLUMN performed_by_name VARCHAR(255) DEFAULT NULL AFTER performed_by" },
    { table: 'chemical_usage', column: 'used_by_name', ddl: "ALTER TABLE chemical_usage ADD COLUMN used_by_name VARCHAR(255) DEFAULT NULL AFTER used_by" },
  ];
  for (const fix of columnFixes) {
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM \`${fix.table}\` LIKE '${fix.column}'`);
      if (!cols.length) {
        await connection.query(fix.ddl);
        console.log(`   Added ${fix.column} to ${fix.table} in ${dbName}`);
      }
    } catch (error) {
      console.warn(`  Pickup name column warning for ${dbName}: ${error.message}`);
    }
  }
}

// Backfill missing created_at values on legacy rows. Rows inserted before
// created_at was populated explicitly have NULL dates, which makes every
// date-based calculation in the analytics UI resolve to 1970 (epoch).
async function backfillTransactionDates(connection, dbName) {
  const tables = ['chemical_transactions', 'chemical_usage'];
  for (const table of tables) {
    try {
      const [result] = await connection.query(
        `UPDATE \`${table}\` SET created_at = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') WHERE created_at IS NULL OR created_at = ''`
      );
      if (result.affectedRows > 0) {
        console.log(`   Backfilled created_at on ${result.affectedRows} legacy row(s) in ${table} (${dbName})`);
      }
    } catch (error) {
      console.warn(`  created_at backfill warning for ${dbName}: ${error.message}`);
    }
  }
}

async function ensureChemicalTables(dbName) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      authPlugins: {
        auth_gssapi_client,
      },
      connectTimeout: 10000,
    });

    // Extract individual CREATE TABLE statements using regex (skips comments)
    const createRegex = /CREATE TABLE IF NOT EXISTS \w+[\s\S]*?\)\s*ENGINE=InnoDB[^;]*;/gi;
    let match;
    let count = 0;
    while ((match = createRegex.exec(CHEMICAL_TABLES_SQL)) !== null) {
      try {
        await connection.query(match[0]);
        const tableName = match[0].match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
        console.log(`  Table '${tableName}' ensured in ${dbName}`);
        count++;
      } catch (err) {
        console.warn(` Table creation warning: ${err.message}`);
      }
    }

    await normalizePPERequestsSchema(connection, dbName);
    for (const tableName of ['chemical_transactions', 'chemical_usage']) {
      const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'branch_slug'`);
      if (!columns.length) {
        await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN branch_slug VARCHAR(255) DEFAULT NULL AFTER branch_id`);
      }
    }
    await ensureEmployeeIdColumns(connection, dbName);
    await ensurePickupNameColumns(connection, dbName);
    await backfillTransactionDates(connection, dbName);

    console.log(`Chemical tables ensured in database: ${dbName} (${count} tables)`);
    return true;
  } catch (error) {
    console.error(`Failed to ensure chemical tables in ${dbName}:`, error.message);
    return false;
  } finally {
    if (connection) await connection.end().catch(() => { });
  }
}

// ============================================
// START SERVER
// ============================================
async function startServer() {
  // Run auto-migration on the main database
    const mainDb = process.env.OPERATIONS_DATABASE || 'restpoint_operations';
  console.log(`Running auto-migration for chemical tables in: ${mainDb}`);
  await ensureChemicalTables(mainDb);

  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`Chemical Service`);
    console.log(`DB: ${process.env.OPERATIONS_DATABASE || 'restpoint_operations'}`);
    console.log('========================================');
  });
}

startServer();

module.exports = app;
