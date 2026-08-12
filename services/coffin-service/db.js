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
const mysql = require('mysql2/promise');
const knex = require('knex');
const logger = require('@montezuma/shared-logger');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const COFFIN_DATABASE = process.env.COFFIN_DATABASE || process.env.DB_NAME || 'restpoint_coffin';

const DB_CONFIG = () => ({
  host: process.env.COFFIN_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.COFFIN_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.COFFIN_DB_USER || process.env.DB_USER || 'restpoint_user',
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
 * Lazy knex instance bound to the central coffin database (used for migrations).
 */
function getCoffinKnex() {
  if (!coffinKnex) {
    coffinKnex = knex({
      client: 'mysql2',
      connection: { ...DB_CONFIG(), database: COFFIN_DATABASE, charset: 'utf8mb4' },
      pool: { min: 2, max: 10 },
      migrations: {
        directory: path.resolve(__dirname, 'migrations'),
        tableName: 'knex_migrations',
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
