#!/usr/bin/env node
/**
  * Central operations-database migration runner for coffin tables
 * ---------------------------------------------------------------
 * Creates the central `restpoint_operations` database (if needed) and
 * applies every coffin knex migration under ./migrations.  This DB is
 * SHARED by ALL tenants — coffin data is scoped via tenant_slug.
 *
 * Usage:
 *   node migrate-coffin-db.js
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const knex = require('knex');

// .env resolution: service folder first, then repo root (covers both source and
// compiled `dist` layouts).
for (const envPath of [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
]) {
  dotenv.config({ path: envPath });
}

const COFFIN_DATABASE = process.env.OPERATIONS_DATABASE
  || process.env.DB_NAME
  || 'restpoint_operations';

const BASE = {
  host: process.env.COFFIN_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.COFFIN_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.COFFIN_DB_USER || process.env.DB_USER,
  password: process.env.COFFIN_DB_PASSWORD || process.env.DB_PASSWORD || '',
};

// Locate the migrations folder (source tree, with a `dist` fallback too).
function resolveMigrationsDir() {
  const candidates = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '../../../services/coffin-service/migrations'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    } catch (e) {
      // try next candidate
    }
  }
  return candidates[0];
}

async function main() {
  console.log(`[COFFIN] Ensuring central database: ${COFFIN_DATABASE}`);

  const admin = mysql.createPool({ ...BASE, waitForConnections: true, connectionLimit: 5, queueLimit: 0 });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${COFFIN_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  console.log(`[COFFIN] Running knex migrations on: ${COFFIN_DATABASE}`);

  const db = knex({
    client: 'mysql2',
    connection: { ...BASE, database: COFFIN_DATABASE, charset: 'utf8mb4' },
    pool: { min: 0, max: 5 },
    migrations: {
      directory: resolveMigrationsDir(),
      tableName: 'knex_migrations',
      loadExtensions: ['.js'],
    },
  });

  const [batch, log] = await db.migrate.latest();
  console.log(`[COFFIN] Migration batch ${batch} applied. Files: ${(log && log.join(', ')) || '(none pending)'}`);

  await db.destroy();
  console.log('[COFFIN] Central coffin database migration complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[COFFIN] Migration failed:', (err && err.message) ? err.message : err);
    process.exit(1);
  });
