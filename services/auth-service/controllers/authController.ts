/**
 * Auth Controller - TypeScript
 * Handles user authentication with enterprise-grade security
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import mysql from 'mysql2/promise';


// ============================================
// TYPE DECLARATIONS - Fix for TypeScript errors
// ============================================
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
// ============================================
// ============================================
// GLOBAL SECRETS (validated at startup)
// ============================================
const GLOBAL_JWT_SECRET: string = process.env.JWT_SECRET || '';
const GLOBAL_REFRESH_SECRET: string = process.env.REFRESH_TOKEN_SECRET || '';

if (!GLOBAL_JWT_SECRET || !GLOBAL_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables');
}

// ============================================
// CONNECTION POOL
// ============================================
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

// ============================================
// TYPES
// ============================================

interface Tenant {
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

interface User {
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

interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// DATABASE HELPERS
// ============================================

const queryServer = async (sql: string, params: any[] = []): Promise<any[]> => {
  const [rows] = await pool.query(sql, params);
  return rows as any[];
};

const queryTenantDB = async (dbName: string, sql: string, params: any[] = []): Promise<any[]> => {
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
// JWT SECRET HELPERS
// ============================================

const getTenantJwtSecret = async (tenantId: number): Promise<{ jwtSecret: string; refreshSecret: string }> => {
  try {
    const [columns]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'jwt_secret'`
    );
    if (!columns || columns.length === 0) {
      return { jwtSecret: GLOBAL_JWT_SECRET, refreshSecret: GLOBAL_REFRESH_SECRET };
    }
    const [tenants]: any = await pool.query(
      'SELECT jwt_secret, refresh_secret FROM tenant_tracking.tenants WHERE id = ?',
      [tenantId]
    );
    if (tenants.length > 0 && tenants[0].jwt_secret) {
      return {
        jwtSecret: tenants[0].jwt_secret,
        refreshSecret: tenants[0].refresh_secret || tenants[0].jwt_secret,
      };
    }
  } catch (error: any) {
    console.error('Error fetching tenant JWT secret:', error.message);
  }
  return { jwtSecret: GLOBAL_JWT_SECRET, refreshSecret: GLOBAL_REFRESH_SECRET };
};

// ============================================
// FIND HELPERS
// ============================================

const findTenantByEmail = async (email: string): Promise<Tenant | null> => {
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
const findTenantCandidatesByUserEmail = async (email: string): Promise<Tenant[]> => {
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
const findTenantCandidatesByUsername = async (username: string): Promise<Tenant[]> => {
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

const findTenantByUserEmail = async (email: string): Promise<Tenant | null> => {
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

const findUserInTenantDB = async (dbName: string, email: string): Promise<User | null> => {
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

// ============================================
// TOKEN GENERATION
// ============================================

const generateTokens = async (
  user: User,
  tenant: Tenant,
  branchDbName: string | null = null
): Promise<TokenResult> => {
  const effectiveSlug = branchDbName || tenant.tenant_slug;
  // New tenant_tracking.tenants uses `id VARCHAR(36)` as the primary key (there is no
  // `tenant_id` column anymore), so resolve whichever identifier exists to keep the
  // JWT stable across legacy and UUID schemas.
  const tenantId = tenant.tenant_id ?? tenant.id;
  const payload = {
    userId: user.user_id,
    email: user.email,
    tenantId,
    tenantName: tenant.tenant_name,
    tenantSlug: effectiveSlug,
    dbName: tenant.db_name,
    role: user.role || 'admin',
    branchDbName,
    ...(user.branch_id ? { branchId: user.branch_id } : {}),
  } as any;
  const { jwtSecret, refreshSecret } = await getTenantJwtSecret(tenantId);
  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// ============================================
// CSRF HELPER
// ============================================

const validateCsrf = (req: Request): boolean => {
  // In development, CSRF can be bypassed
  if (process.env.NODE_ENV !== 'production') return true;
  const headerToken = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;
  return !!(headerToken && sessionToken && headerToken === sessionToken);
};

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * POST /auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const identifierInput: string = (req.body.email || req.body.identifier || req.body.username || '').trim();
  const { password } = req.body;

  if (!identifierInput) {
    res.status(400).json({ success: false, message: 'Email or username is required' });
    return;
  }
  if (!password) {
    res.status(400).json({ success: false, message: 'Password is required' });
    return;
  }
  // Only enforce email format when the identifier actually looks like an email;
  // plain usernames are allowed and resolved through findTenantCandidatesByUsername.
  if (identifierInput.includes('@') && !validator.isEmail(identifierInput)) {
    res.status(400).json({ success: false, message: 'Valid email is required' });
    return;
  }

  try {
    // Gather EVERY tenant that contains a matching account, then verify the
    // password against each candidate. Picking the first tenant that merely
    // CONTAINS the email previously logged users into the WRONG tenant when
    // the same email was registered by more than one organization.
    let candidates: Tenant[] = [];
    if (identifierInput.includes('@')) {
      const ownerTenant = await findTenantByEmail(identifierInput);
      if (ownerTenant) candidates.push(ownerTenant);
      candidates.push(...(await findTenantCandidatesByUserEmail(identifierInput)));
    } else {
      candidates.push(...(await findTenantCandidatesByUsername(identifierInput.toLowerCase())));
    }
    // De-duplicate by tenant id while preserving order.
    const seenIds = new Set<string>();
    candidates = candidates.filter((t) => {
      const idKey = String(t.tenant_id ?? t.id);
      if (seenIds.has(idKey)) return false;
      seenIds.add(idKey);
      return true;
    });

    let tenant: Tenant | null = null;
    let user: User | null = null;
    for (const candidate of candidates) {
      try {
        const found: User | null = await findUserInTenantDB(candidate.db_name, identifierInput);
        if (!found || Number(found.is_active) === 0) continue;
        const ok = await bcrypt.compare(password, found.password_hash);
        if (ok) {
          tenant = candidate;
          user = found;
          break;
        }
      } catch { continue; }
    }

    if (!tenant || !user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Update last login
    try {
      await queryTenantDB(tenant.db_name, 'UPDATE users SET last_login_at = NOW() WHERE user_id = ?', [user.user_id]);
    } catch { /* non-critical */ }

    // Branch resolution
    let branchId = user.branch_id || null;
    let branchDbName: string | null = null;
    let dbName = tenant.db_name;

    if (branchId) {
      try {
        const [branches]: any = await pool.query(
          `SELECT branch_slug, branch_db_name FROM \`${tenant.db_name}\`.branches WHERE branch_id = ? AND is_active = 1`,
          [branchId]
        );
        if (branches.length > 0) {
          branchDbName = branches[0].branch_db_name;
          dbName = branchDbName || tenant.db_name;
        } else {
          // The resolved tenant does NOT own this branch.
          // This usually means findTenantByUserEmail returned a branch tenant
          // instead of the parent tenant. Find the real parent tenant.
          const [allTenants]: any = await pool.query(
            "SELECT * FROM tenant_tracking.tenants WHERE status = 'active'"
          );
          let parentTenant: Tenant | null = null;
          for (const t of allTenants) {
            if (t.tenant_id === tenant.tenant_id || t.id === tenant.id) continue;
            try {
              const [parentBranches]: any = await pool.query(
                `SELECT branch_slug, branch_db_name FROM \`${t.db_name}\`.branches WHERE branch_id = ? AND is_active = 1 LIMIT 1`,
                [branchId]
              );
              if (parentBranches.length > 0) {
                parentTenant = t;
                branchDbName = parentBranches[0].branch_db_name || parentBranches[0].branch_slug || null;
                dbName = branchDbName || t.db_name;
                break;
              }
            } catch { continue; }
          }
          if (parentTenant) {
            tenant = parentTenant;
          } else {
            branchId = null;
          }
        }
      } catch { /* non-critical */ }
    }

    // Deployment type
    let deploymentType = tenant.deployment_type || 'single';
    try {
      const [tenantRows]: any = await pool.query(
        'SELECT deployment_type FROM tenant_tracking.tenants WHERE id = ?',
        [tenant.tenant_id ?? tenant.id]
      );
      if (tenantRows.length > 0 && tenantRows[0].deployment_type) {
        deploymentType = tenantRows[0].deployment_type;
      }
    } catch { /* non-critical */ }

    const { accessToken, refreshToken } = await generateTokens(user, tenant, branchDbName);
    const effectiveSlug = branchDbName || tenant.tenant_slug;
    // Resolve the tenant id across schemas: legacy rows carried `tenant_id`, the
    // current tenant_tracking.tenants primary key is `id` (VARCHAR(36) UUID).
    const tenantId = tenant.tenant_id ?? tenant.id;

    // Set session
    const session = req.session as any;
    session.userId = user.user_id;
    session.tenantId = tenantId;
    session.tenantSlug = effectiveSlug;
    session.dbName = dbName;

    // Full branch list with parent/child relationships so the frontend can persist
    // the branch hierarchy (branch_id -> parent_branch_id) after login.
    let branchList: any[] = [];
    try {
      const [brows]: any = await pool.query(
        `SELECT branch_id, branch_name, branch_slug, branch_db_name, parent_branch_id, is_active
         FROM \`${tenant.db_name}\`.branches
         ORDER BY parent_branch_id IS NOT NULL, branch_name`
      );
      branchList = (brows || []).map((b: any) => ({
        branchId: b.branch_id,
        branchName: b.branch_name,
        branchSlug: b.branch_slug,
        branchDbName: b.branch_db_name,
        parentBranchId: b.parent_branch_id || null,
        isActive: b.is_active === 1 || b.is_active === true,
      }));
    } catch (err: any) {
      console.warn('Could not load tenant branches for login response:', (err && err.message) || err);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      deploymentType,
      user: {
        userId: user.user_id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone || '',
        role: user.role,
        tenantId,
        // Always advertise the PARENT tenant slug here. The effective scope
        // (branch db) is exposed separately via branchId/branchDbName/branchSlug
        // so the frontend never builds /tenant/<branch-db-name>/... URLs.
        tenantSlug: tenant.tenant_slug,
        branchId,
        branchSlug: branchList.find((b: any) => String(b.branchId) === String(branchId))?.branchSlug || null,
        branchDbName,
        dbName,
        parentTenantSlug: tenant.tenant_slug, // parent tenant slug for branch users
        isActive: user.is_active === 1,
        isVerified: user.is_verified === 1,
      },
      tenant: {
        tenantId,
        tenantName: tenant.tenant_name,
        tenantSlug: tenant.tenant_slug,
        slug: tenant.tenant_slug,
        parentTenantSlug: tenant.tenant_slug,
        dbName: tenant.db_name,
      },
      branches: branchList,
    });
  } catch (error: any) {
    if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      res.status(503).json({
        success: false,
        message: 'Database access denied',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /auth/register
 */
export const register = async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Please use /api/onboarding/organization endpoint for registration',
  });
};

/**
 * POST /auth/users
 * Create a new user with username, role, and branch assignment.
 * Phone has been removed per user request.
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, username, role, branch_id } = req.body;
  const tenantDbName: string | undefined = req.user?.dbName;

  if (!tenantDbName) {
    res.status(400).json({ success: false, message: 'Tenant database not found in token' });
    return;
  }
  if (!email || !password || !full_name) {
    res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const existingUser = await findUserInTenantDB(tenantDbName, email);
    if (existingUser) {
      res.status(409).json({ success: false, message: 'User with this email or username already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Check if username/branch_id columns exist in users table
    let hasUsernameCol = false;
    let hasBranchIdCol = false;
    try {
      const [columns]: any = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
        [tenantDbName]
      );
      hasUsernameCol = columns.some((c: any) => c.COLUMN_NAME === 'username');
      hasBranchIdCol = columns.some((c: any) => c.COLUMN_NAME === 'branch_id');
    } catch { /* non-critical */ }

    let newUserId: number;
    const effectiveUsername = username || email.toLowerCase();

    if (hasUsernameCol && hasBranchIdCol) {
      const [result]: any = await pool.query(
        `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, username, role, branch_id, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
        [email.toLowerCase(), password_hash, full_name, effectiveUsername, role || 'staff', branch_id ? parseInt(branch_id) : null]
      );
      newUserId = result.insertId;
    } else if (hasUsernameCol) {
      const [result]: any = await pool.query(
        `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, username, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [email.toLowerCase(), password_hash, full_name, effectiveUsername, role || 'staff']
      );
      newUserId = result.insertId;
    } else if (hasBranchIdCol) {
      const [result]: any = await pool.query(
        `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, role, branch_id, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [email.toLowerCase(), password_hash, full_name, role || 'staff', branch_id ? parseInt(branch_id) : null]
      );
      newUserId = result.insertId;
    } else {
      const [result]: any = await pool.query(
        `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [email.toLowerCase(), password_hash, full_name, role || 'staff']
      );
      newUserId = result.insertId;
    }

    // Fetch created user with branch info
    let newUser: any = null;
    try {
      const [rows]: any = await pool.query(
        `SELECT u.*, b.branch_name, b.branch_db_name 
         FROM \`${tenantDbName}\`.users u
         LEFT JOIN \`${tenantDbName}\`.branches b ON u.branch_id = b.branch_id
         WHERE u.user_id = ?`,
        [newUserId]
      );
      newUser = rows.length > 0 ? rows[0] : null;
    } catch {
      newUser = await findUserInTenantDB(tenantDbName, email);
    }

    if (!newUser) {
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: { userId: newUserId, email: email.toLowerCase(), fullName: full_name, username: effectiveUsername, role: role || 'staff' },
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: newUser.user_id,
        email: newUser.email,
        fullName: newUser.full_name,
        username: newUser.username || newUser.email,
        role: newUser.role,
        branchId: newUser.branch_id || null,
        branchName: newUser.branch_name || null,
        isActive: newUser.is_active === 1 || newUser.is_active === true,
        isVerified: newUser.is_verified === 1 || newUser.is_verified === true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /auth/users
 * List all users in the tenant database
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const tenantDbName: string | undefined = req.user?.dbName;

  if (!tenantDbName) {
    res.status(400).json({ success: false, message: 'Tenant database not found in token' });
    return;
  }

  try {
    let rows: any[] = [];
    try {
      const [result]: any = await pool.query(
        `SELECT u.user_id, u.email, u.full_name, u.username, u.role, 
                u.branch_id, u.is_active, u.is_verified, u.last_login_at, u.created_at,
                b.branch_name, b.branch_db_name
         FROM \`${tenantDbName}\`.users u
         LEFT JOIN \`${tenantDbName}\`.branches b ON u.branch_id = b.branch_id
         ORDER BY u.created_at DESC`
      );
      rows = result;
    } catch {
      // Fallback: query without branch join
      const [result]: any = await pool.query(
        `SELECT user_id, email, full_name, username, role, branch_id, is_active, is_verified, last_login_at, created_at
         FROM \`${tenantDbName}\`.users
         ORDER BY created_at DESC`
      );
      rows = result;
    }

    res.json({
      success: true,
      users: rows.map((u: any) => ({
        userId: u.user_id,
        email: u.email,
        fullName: u.full_name,
        username: u.username || u.email,
        role: u.role,
        branchId: u.branch_id || null,
        branchName: u.branch_name || null,
        isActive: u.is_active === 1 || u.is_active === true,
        isVerified: u.is_verified === 1 || u.is_verified === true,
        lastLoginAt: u.last_login_at || null,
        createdAt: u.created_at || null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token is required' });
    return;
  }

  try {
    let verified: any;
    let jwtSecret: string, refreshSecret: string;

    try {
      verified = jwt.verify(refreshToken, GLOBAL_REFRESH_SECRET);
      const tenantSecret = await getTenantJwtSecret(verified.tenantId);
      jwtSecret = tenantSecret.jwtSecret;
      refreshSecret = tenantSecret.refreshSecret;
    } catch {
      const payload: any = jwt.decode(refreshToken);
      if (!payload || !payload.tenantId) throw new Error('Invalid refresh token payload');
      const tenantSecret = await getTenantJwtSecret(payload.tenantId);
      jwtSecret = tenantSecret.jwtSecret;
      refreshSecret = tenantSecret.refreshSecret;
      verified = jwt.verify(refreshToken, refreshSecret);
    }

    const [tenants]: any = await pool.query(
      "SELECT * FROM tenant_tracking.tenants WHERE id = ? AND status = 'active'",
      [verified.tenantId]
    );
    if (tenants.length === 0) {
      res.status(401).json({ success: false, message: 'Tenant not found or inactive' });
      return;
    }

    const rows = await queryTenantDB(tenants[0].db_name, 'SELECT * FROM users WHERE user_id = ? AND is_active = 1', [
      verified.userId,
    ]);
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    let branchDbName: string | null = null;
    if (rows[0].branch_id) {
      try {
        const [branches]: any = await pool.query(
          `SELECT branch_db_name FROM \`${tenants[0].db_name}\`.branches WHERE branch_id = ? AND is_active = 1`,
          [rows[0].branch_id]
        );
        if (branches.length > 0) branchDbName = branches[0].branch_db_name;
      } catch { /* non-critical */ }
    }

    const result = await generateTokens(rows[0], tenants[0], branchDbName);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    console.error('[Auth] Token refresh failed:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

/**
 * POST /auth/logout
 */
export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('restpoint.sid');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
};

/**
 * GET /auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.decode(token);
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    const { jwtSecret } = await getTenantJwtSecret(decoded.tenantId);
    const verified: any = jwt.verify(token, jwtSecret);
    res.status(200).json({
      success: true,
      user: {
        userId: verified.userId,
        email: verified.email,
        tenantId: verified.tenantId,
        tenantName: verified.tenantName,
        role: verified.role,
      },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * POST /auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;

  if (!email || !currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ success: false, message: 'All fields are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ success: false, message: 'New passwords do not match' });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ success: false, message: 'New password must be different from current password' });
    return;
  }

  try {
    const tenant = await findTenantByUserEmail(email);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const user = await findUserInTenantDB(tenant.db_name, email);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    await queryTenantDB(tenant.db_name, 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [
      newPasswordHash,
      user.user_id,
    ]);

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

