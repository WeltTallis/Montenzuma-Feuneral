// ============================================
// FLORIST SERVICE - Local Database Configuration
// ============================================
// Self-contained within the florist service - no external DB helper imports.
// Connects DIRECTLY to the shared `restpoint_operations` database, exactly
// like the hearse-service's `database.ts`. Tenant isolation is handled by
// the `tenant_slug` column inside that database.
//
// Loads the service .env first, then the repo-root .env. These paths resolve
// for BOTH source (`services/florist-service`) and compiled
// (`services/florist-service/dist`) layouts, so the DB credentials from the
// repo root .env are always available.

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

// ============================================
// Type Definitions
// ============================================

export interface FloristDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
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
 * Execute a safe SELECT query with parameters and return the rows
 */
export const safeQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  const pool = await getFloristPool();
  const [rows] = await pool.query(sql, params);
  return rows as any[];
};

/**
 * Execute a safe SELECT query and return rows typed as RowDataPacket
 */
export const safeQueryRows = async <T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const pool = await getFloristPool();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
};

/**
 * Execute an INSERT / UPDATE / DELETE / ALTER query and return the result header
 */
export const safeExecute = async (
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> => {
  const pool = await getFloristPool();
  const [result] = await pool.query(sql, params);
  return result as ResultSetHeader;
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
    await conn.rollback().catch(() => {});
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