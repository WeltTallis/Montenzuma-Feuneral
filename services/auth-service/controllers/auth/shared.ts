/**
 * Shared auth database, token, and cookie utilities.
 */

import { Response } from 'express';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


// TYPE DECLARATIONS - Fix for TypeScript errors

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    userId?: number;
    tenantId?: number;
    tenantSlug?: string;
    dbName?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        tenantId: number;
        tenantName: string;
        tenantSlug: string;
        dbName: string;
        role: string;
        branchDbName?: string | null;
        [key: string]: any;
      };
      tenant?: {
        db_name: string;
        tenant_slug?: string;
        name?: string;
        [key: string]: any;
      };
      tenantSlug?: string;
      branchId?: string | null;
    }
  }
}

// GLOBAL SECRETS (validated at startup)

export const GLOBAL_JWT_SECRET: string = process.env.JWT_SECRET || '';
export const GLOBAL_REFRESH_SECRET: string = process.env.REFRESH_TOKEN_SECRET || '';

if (!GLOBAL_JWT_SECRET || !GLOBAL_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables');
}


// CONNECTION POOL

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'restpoint_user',
  password: process.env.DB_PASSWORD || 'RestPointUser2024',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export { pool };


// TYPES


export interface Tenant {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_slug: string;
  db_name: string;
  email: string;
  status: string;
  jwt_secret?: string;
  refresh_secret?: string;
  deployment_type?: string;
  [key: string]: any;
}

export interface User {
  user_id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: number;
  is_verified: number;
  branch_id?: number | null;
  [key: string]: any;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}


// DATABASE HELPERS


export const getBrevoSenderEmail = (): string => {
  const candidates = [
    process.env.BREVO_SENDER_EMAIL,
    process.env.BREVO_EMAIL_FROM,
    process.env.EMAIL_FROM,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }

  return '';
};

export const getPasswordResetCodeHash = (email: string, code: string): string =>
  crypto.createHmac('sha256', GLOBAL_JWT_SECRET).update(`${email}:${code}`).digest('hex');

export const ensurePasswordResetOtpTable = async (): Promise<void> => {
  await pool.query(`CREATE TABLE IF NOT EXISTS tenant_tracking.password_reset_otp_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_hash CHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    tenant_db VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_otp_lookup (email, code_hash, expires_at),
    INDEX idx_password_reset_otp_account (tenant_id, user_id, expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

export const queryTenantDB = async (dbName: string, sql: string, params: any[] = []): Promise<any[]> => {
  if (!dbName || typeof dbName !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    throw new Error('Invalid database name');
  }
  const escapedDbName = `\`${dbName}\``;
  const qualifiedSQL = sql
    .replace(/\bFROM\s+users\b/gi, `FROM ${escapedDbName}.users`)
    .replace(/\bINTO\s+users\b/gi, `INTO ${escapedDbName}.users`)
    .replace(/\bUPDATE\s+users\b/gi, `UPDATE ${escapedDbName}.users`);
  const [rows] = await pool.query(qualifiedSQL, params);
  return rows as any[];
};

// ============================================
// FIND HELPERS
// ============================================

export const findTenantByEmail = async (email: string): Promise<Tenant | null> => {
  try {
    const [databases]: any = await pool.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'tenant_tracking'"
    );
    if (databases.length === 0) return null;

    const [tenants]: any = await pool.query(
      `SELECT * FROM tenant_tracking.tenants WHERE email = ? AND status = 'active'`,
      [email.toLowerCase()]
    );
    return tenants.length > 0 ? tenants[0] : null;
  } catch (error: any) {
    if (error?.code === 'ER_ACCESS_DENIED_ERROR') throw error;
    console.error('Error finding tenant:', error.message);
    return null;
  }
};

/**
 * Return EVERY active tenant whose users table contains this email.
 * Different tenants can register the same email address — resolving only the
 * FIRST match logged people into the WRONG tenant, so login must verify the
 * password against all candidates and pick the one that actually matches.
 */
export const findTenantCandidatesByUserEmail = async (email: string): Promise<Tenant[]> => {
  try {
    const [dbs]: any = await pool.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'tenant_tracking'"
    );
    if (dbs.length === 0) return [];

    const [tenants]: any = await pool.query(
      "SELECT * FROM tenant_tracking.tenants WHERE status = 'active'"
    );
    const matches: Tenant[] = [];
    for (const t of tenants) {
      try {
        const [users]: any = await pool.query(
          'SELECT user_id FROM `' + t.db_name + '`.users WHERE email = ? AND is_active = 1 LIMIT 1',
          [email.toLowerCase()]
        );
        if (users.length > 0) matches.push(t);
      } catch { continue; }
    }
    return matches;
  } catch (e: any) {
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') throw e;
    return [];
  }
};

/** Tenants that contain a user with this username (non-email identifiers). */
export const findTenantCandidatesByUsername = async (username: string): Promise<Tenant[]> => {
  try {
    const [dbs]: any = await pool.query(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'tenant_tracking'"
    );
    if (dbs.length === 0) return [];

    const [tenants]: any = await pool.query(
      "SELECT * FROM tenant_tracking.tenants WHERE status = 'active'"
    );
    const matches: Tenant[] = [];
    for (const t of tenants) {
      try {
        const [users]: any = await pool.query(
          'SELECT user_id FROM `' + t.db_name + '`.users WHERE username = ? AND is_active = 1 LIMIT 1',
          [username.toLowerCase()]
        );
        if (users.length > 0) matches.push(t);
      } catch { continue; }
    }
    return matches;
  } catch (e: any) {
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') throw e;
    return [];
  }
};

export const findTenantByUserEmail = async (email: string): Promise<Tenant | null> => {
  try {
    // Tenant owner accounts first, then regular users across tenants.
    const ownerTenant = await findTenantByEmail(email);
    if (ownerTenant) return ownerTenant;

    const candidates = await findTenantCandidatesByUserEmail(email);
    return candidates.length > 0 ? candidates[0] : null;
  } catch (e: any) {
    if (e?.code === 'ER_ACCESS_DENIED_ERROR') throw e;
    console.error('Error finding tenant:', e.message);
    return null;
  }
};

export const findUserInTenantDB = async (dbName: string, email: string): Promise<User | null> => {
  try {
    const rows = await queryTenantDB(dbName, 'SELECT * FROM users WHERE email = ? OR username = ?', [email.toLowerCase(), email.toLowerCase()]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error: any) {
    // Fallback: try email-only search (for older schemas without username column)
    try {
      const rows2 = await queryTenantDB(dbName, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      return rows2.length > 0 ? rows2[0] : null;
    } catch {
      if (error?.code === 'ER_ACCESS_DENIED_ERROR') throw error;
      console.error('Error finding user:', error.message);
      return null;
    }
  }
};


// TOKEN GENERATION

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('access_token', accessToken, authCookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie('refresh_token', refreshToken, authCookieOptions(30 * 24 * 60 * 60 * 1000));
};

const authCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge,
});

export const clearAuthCookies = (res: Response) => {
  const options = { ...authCookieOptions(0), maxAge: undefined };
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
};
