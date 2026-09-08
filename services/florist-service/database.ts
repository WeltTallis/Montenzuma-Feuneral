
// FLORIST SERVICE - Local Database Configuration


import mysql from 'mysql2/promise';
import type {
  Pool,
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
} from 'mysql2/promise';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  path.resolve(__dirname, '.env'),             // service folder (source layout)
  path.resolve(__dirname, '../.env'),          // service folder (dist layout)
  path.resolve(__dirname, '../../.env'),       // repo root (source layout)
  path.resolve(__dirname, '../../../.env'),    // repo root (dist layout)
]) {
  dotenv.config({ path: envPath });
}

// Type Definitions

export interface FloristDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  maxIdle: number;
  idleTimeout: number;
  enableKeepAlive: boolean;
  keepAliveInitialDelay: number;
}

// ============================================
// Configuration
// ============================================

const FLORIST_DB_CONFIG: FloristDbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'restpoint_user',
  password: process.env.DB_PASSWORD || '',
  database: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ── Connection-resilience (fixes "create fails twice then works") ──
  // Idle pooled sockets get killed by MySQL's wait_timeout / Docker NAT.
  // The next query then grabs a dead socket and fails with ECONNRESET or
  // PROTOCOL_CONNECTION_LOST. TCP keep-alive stops NAT/firewalls from
  // dropping idle sockets, and the short idleTimeout recycles sockets
  // BEFORE they rot. safeQuery/safeExecute additionally retry once on
  // those transient errors with a freshly opened connection.
  maxIdle: 5,                      // close surplus idle sockets quickly
  idleTimeout: 60000,              // recycle idle connections after 60s
  enableKeepAlive: true,           // TCP keep-alive on every socket
  keepAliveInitialDelay: 10000,
};

// ============================================
// Database Connection Pool
// ============================================

let floristPool: Pool | null = null;

/**
 * Get or create the florist database connection pool
 */
export const getFloristPool = async (): Promise<Pool> => {
  if (!floristPool) {
    floristPool = await mysql.createPool(FLORIST_DB_CONFIG);
  }
  return floristPool;
};

/**
 * Get a connection from the pool
 */
export const getFloristConnection = async (): Promise<PoolConnection> => {
  const pool = await getFloristPool();
  return pool.getConnection();
};

/**
 * Transient connection errors — the dead-pooled-socket class. When one of
 * these happens the connection is beyond saving, but the query itself is
 * perfectly retryable on a fresh socket.
 */
const TRANSIENT_DB_ERRORS = [
  'ECONNRESET', 'EPIPE', 'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_BAD_PACKET', 'ER_CONNECTION_KILLED', 'ER_SERVER_LOST',
  'ER_CLIENT_INTERACTION_TIMEOUT',
];

const isTransientDbError = (err: any): boolean =>
  !!err && TRANSIENT_DB_ERRORS.some(
    (code) => err.code === code || String(err?.message || '').includes(code)
  );

/**
 * Run a query on a pool connection, retrying ONCE on a transient (dead
 * socket) error. The broken connection is destroyed — which removes it from
 * the pool — before opening a fresh one for the retry. This is what turns
 * the "create fails, fails again, then works" pattern into
 * "create works every time": the retry is invisible to the caller.
 */
const runWithHealthyConnection = async <T>(
  query: (conn: PoolConnection) => Promise<T>
): Promise<T> => {
  const pool = await getFloristPool();
  let conn = await pool.getConnection();
  try {
    try {
      return await query(conn);
    } catch (err: any) {
      if (!isTransientDbError(err)) throw err;
      console.warn(`[FLORIST DB] Transient connection error (${err.code || err.message}) — retrying once on a fresh connection`);
      try { conn.destroy(); } catch { /* already dead */ }
      conn = await pool.getConnection();
      return await query(conn);
    }
  } finally {
    if (conn) {
      try { conn.release(); } catch { /* socket was destroyed above */ }
    }
  }
};

/**
 * Execute a safe SELECT query with parameters and return the rows
 */
export const safeQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  return runWithHealthyConnection(async (conn) => {
    const [rows] = await conn.query(sql, params);
    return rows as any[];
  });
};

/**
 * Execute a safe SELECT query and return rows typed as RowDataPacket
 */
export const safeQueryRows = async <T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  return runWithHealthyConnection(async (conn) => {
    const [rows] = await conn.query(sql, params);
    return rows as T[];
  });
};

/**
 * Execute an INSERT / UPDATE / DELETE / ALTER query and return the result header
 */
export const safeExecute = async (
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> => {
  return runWithHealthyConnection(async (conn) => {
    const [result] = await conn.query(sql, params);
    return result as ResultSetHeader;
  });
};

/**
 * Alias for safeExecute (same name as other services' safeQueryResult)
 */
export const safeQueryResult = async (
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> => {
  return safeExecute(sql, params);
};

/**
 * Run a set of statements inside a transaction
 */
export const transaction = async <T>(
  runner: (conn: PoolConnection) => Promise<T>
): Promise<T> => {
  const conn = await getFloristConnection();
  try {
    await conn.beginTransaction();
    const result = await runner(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => { });
    throw err;
  } finally {
    conn.release();
  }
};

// ============================================
// Health Check
// ============================================

/**
 * Check if the database is healthy
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const pool = await getFloristPool();
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[FLORIST] Database health check failed:', (error as any).message);
    return false;
  }
};

// ============================================
// Exports
// ============================================

export default {
  getFloristPool,
  getFloristConnection,
  safeQuery,
  safeQueryRows,
  safeExecute,
  safeQueryResult,
  transaction,
  healthCheck,
  FLORIST_DB_CONFIG,
};

export const FLORIST_DB = FLORIST_DB_CONFIG;