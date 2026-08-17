/**
 * Coffin Service - Central (shared) Coffin Database helper
 * -------------------------------------------------
 * All coffin-domain data (inventory, bookings/orders, stock requests, images,
 * coffin usage, deceased-coffin assignments) lives in ONE central database that
 * serves every tenant. Tenant isolation is enforced through the tenant_slug
 * (and tenant_id) columns inside that single database.
 *
 * This module lazily creates the central database, provides a mysql2 pool for
 * queries and a knex instance for migrations, and exposes the migration runner
 * that the coffin service executes independently on startup (and via the
 * standalone `node migrate-coffin-db.js` script).
 */
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const knex = require('knex');

// @montezuma/shared-logger is a TypeScript package compiled with a `default`
// export (plus a named `logger` export). When loaded through plain CommonJS
// `require()` it resolves to the module namespace object `{ __esModule:true,
// logger, default }`, so call `.default` when `require()` did not hand back the
// pino instance directly.
const loggerModule = require('@montezuma/shared-logger');
const logger = (loggerModule && typeof loggerModule.info === 'function')
  ? loggerModule
  : (loggerModule.default || loggerModule);

// Load .env from the service folder first, then from the repository root.
// Works for BOTH source (`services/coffin-service`) and compiled
// (`dist/services/coffin-service`) layouts.
for (const envPath of [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
]) {
  dotenv.config({ path: envPath });
}

// The coffin domain lives in the ONE shared operations database (`restpoint_operations`)
// so every tenant's coffin data is scoped via tenant_slug/tenant_id columns.
// Note: the legacy COFFIN_DATABASE env is intentionally ignored here because the
// service .env sets it to the UNEXPANDED literal `${OPERATIONS_DATABASE}`,
// which would break database resolution.
const COFFIN_DATABASE = process.env.OPERATIONS_DATABASE
  || process.env.DB_NAME
  || 'restpoint_operations';

const DB_CONFIG = () => ({
  host: process.env.COFFIN_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.COFFIN_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.COFFIN_DB_USER || process.env.DB_USER,
  password: process.env.COFFIN_DB_PASSWORD || process.env.DB_PASSWORD || '',
});

let coffinPool = null;
let coffinKnex = null;
let dbEnsured = false;

/**
 * Create the central coffin database if it does not already exist.
 */
async function ensureCoffinDatabase() {
  if (dbEnsured) return;
  const admin = mysql.createPool({
    ...DB_CONFIG(),
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${COFFIN_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    dbEnsured = true;
    logger.info({ msg: 'Coffin central database ensured', database: COFFIN_DATABASE });
  } finally {
    await admin.end();
  }
}

/**
 * Lazy mysql2 pool bound to the central coffin database.
 */
function getCoffinPool() {
  if (!coffinPool) {
    coffinPool = mysql.createPool({
      ...DB_CONFIG(),
      database: COFFIN_DATABASE,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return coffinPool;
}

/**
 * Resolve the knex migrations directory. When running from the compiled
 * `dist/services/coffin-service/` the `migrations` folder is copied there by
 * `tsc`; as a safety net this also falls back to the source tree path.
 */
function resolveMigrationsDir() {
  const candidates = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '../../../services/coffin-service/migrations'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    } catch (e) {
      // ignore and try the next candidate
    }
  }
  return candidates[0];
}

/**
 * Lazy knex instance bound to the central coffin database (used for migrations).
 */
function getCoffinKnex() {
  if (!coffinKnex) {
    coffinKnex = knex({
      client: 'mysql2',
      connection: { ...DB_CONFIG(), database: COFFIN_DATABASE, charset: 'utf8mb4' },
      pool: { min: 2, max: 10 },
      migrations: {
        directory: resolveMigrationsDir(),
        tableName: 'knex_migrations',
        loadExtensions: ['.js'],
      },
    });
  }
  return coffinKnex;
}

/**
 * Run a parameterised query against the central coffin database.
 * Mirrors the legacy `safeTenantQuery(dbName, sql, params)` contract used by the
 * coffin model/controller: resolves to the rows (SELECT) or result/handshake
 * (INSERT/UPDATE), filtered by tenant_slug inside the SQL.
 */
async function coffinQuery(sql, params = []) {
  await ensureCoffinDatabase();
  const [rows] = await getCoffinPool().query(sql, params);
  return rows;
}

/**
 * Run all pending knex migrations against the central coffin database.
 * This is the coffin service's OWN, independent migration (knex).
 */
async function runCoffinMigrations() {
  await ensureCoffinDatabase();
  const k = getCoffinKnex();
  await k.migrate.latest();
  logger.info({ msg: 'Coffin central database migrations completed', database: COFFIN_DATABASE });
}

async function closeCoffinDb() {
  if (coffinPool) {
    await coffinPool.end().catch(() => {});
    coffinPool = null;
  }
  if (coffinKnex) {
    await coffinKnex.destroy().catch(() => {});
    coffinKnex = null;
  }
}

module.exports = {
  COFFIN_DATABASE,
  DB_CONFIG,
  ensureCoffinDatabase,
  getCoffinPool,
  getCoffinKnex,
  coffinQuery,
  runCoffinMigrations,
  closeCoffinDb,
};
