/**
 * Standalone migration runner for the leave service.
 * ALWAYS migrates the MAIN database first (process.env.DB_NAME || 'restpoint_main'),
 * then every active tenant database from tenant_tracking.
 *
 * Usage:  node run-migrations.js   (or: npm run migrate)
 */
const mysql = require('mysql2/promise');
const { migrateTenantTables } = require('./migrate-tenant-tables');

const MAIN_DB = process.env.DB_NAME || 'restpoint_main';

async function ensureLeaveTables(dbName) {
  try {
    await migrateTenantTables(dbName);
    console.log(`✅ Leave tables ensured in database: ${dbName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to ensure leave tables in ${dbName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Leave service migration runner');
  console.log('==================================');

  // 1. MAIN database first — leaves for multi-tenant orgs always live here.
  console.log(`🔧 Migrating MAIN database: ${MAIN_DB}`);
  await ensureLeaveTables(MAIN_DB);

  // 2. Every active tenant database.
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'tenant_tracking',
      authPlugins: {
        auth_gssapi_client: function () {
          return function () {
            throw new Error('GSSAPI not supported - use mysql_native_password');
          };
        },
      },
    });

    const [tenants] = await connection.query(
      'SELECT db_name, tenant_name FROM tenants WHERE status = "active"'
    );
    console.log(`🔧 Found ${tenants.length} active tenant database(s)`);

    for (const tenant of tenants) {
      if (tenant.db_name) {
        console.log(`🔧 Migrating tenant: ${tenant.tenant_name} (${tenant.db_name})`);
        await ensureLeaveTables(tenant.db_name);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('⚠️  Could not enumerate tenant databases:', error.message);
    console.error('    MAIN database migration was still applied.');
    process.exitCode = 1;
  }

  console.log('==================================');
  console.log('🏁 Migration run complete');
}

main();