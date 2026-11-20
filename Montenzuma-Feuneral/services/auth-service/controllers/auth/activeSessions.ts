import { Request, Response } from 'express';
import { pool } from './shared';

export interface ActiveLogin {
  sessionId: string;
  userId: string | number;
  email: string;
  fullName: string;
  role: string;
  tenantId: string | number;
  tenantName: string;
  tenantSlug: string;
  tenantDb: string;
  branchId?: string | number | null;
  branchSlug?: string | null;
  branchDb?: string | null;
}

let activeSessionsTableReady: Promise<void> | null = null;

const ensureActiveSessionsTable = async (): Promise<void> => {
  if (!activeSessionsTableReady) {
    activeSessionsTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_tracking.active_user_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(128) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        tenant_id VARCHAR(64) NOT NULL,
        tenant_name VARCHAR(255) NOT NULL,
        tenant_slug VARCHAR(255) NOT NULL,
        tenant_db VARCHAR(64) NOT NULL,
        branch_id VARCHAR(64) NULL,
        branch_slug VARCHAR(255) NULL,
        branch_db VARCHAR(64) NULL,
        logged_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logged_out_at DATETIME NULL,
        INDEX idx_active_sessions_tenant (tenant_id, logged_out_at),
        INDEX idx_active_sessions_user (user_id, logged_out_at),
        INDEX idx_active_sessions_session (session_id, logged_out_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).then(() => undefined).catch((error) => {
      activeSessionsTableReady = null;
      throw error;
    });
  }

  await activeSessionsTableReady;
};

export const recordActiveLogin = async (login: ActiveLogin): Promise<void> => {
  await ensureActiveSessionsTable();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE tenant_tracking.active_user_sessions
       SET logged_out_at = NOW()
       WHERE session_id = ? AND logged_out_at IS NULL`,
      [login.sessionId]
    );
    await connection.execute(
      `INSERT INTO tenant_tracking.active_user_sessions (
         session_id, user_id, email, full_name, role, tenant_id, tenant_name,
         tenant_slug, tenant_db, branch_id, branch_slug, branch_db
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        login.sessionId,
        String(login.userId),
        login.email,
        login.fullName,
        login.role,
        String(login.tenantId),
        login.tenantName,
        login.tenantSlug,
        login.tenantDb,
        login.branchId == null ? null : String(login.branchId),
        login.branchSlug || null,
        login.branchDb || null,
      ]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const recordActiveLogout = async (sessionId: string): Promise<void> => {
  await ensureActiveSessionsTable();
  await pool.execute(
    `UPDATE tenant_tracking.active_user_sessions
     SET logged_out_at = NOW()
     WHERE session_id = ? AND logged_out_at IS NULL`,
    [sessionId]
  );
};

export const getActiveSessions = async (req: Request, res: Response): Promise<void> => {
  const role = String(req.user?.role || '').toLowerCase().replace(/[-_\s]/g, '');
  const isSystemAdmin = ['systemadmin', 'systemadministrator', 'platformadmin'].includes(role);
  const canViewSessions = isSystemAdmin || ['admin', 'tenantadmin', 'owner'].includes(role);
  if (!canViewSessions) {
    res.status(403).json({ success: false, message: 'Administrator access is required' });
    return;
  }

  const tenantId = req.user?.tenantId;
  if (!isSystemAdmin && !tenantId) {
    res.status(400).json({ success: false, message: 'Tenant scope is missing from the authenticated user' });
    return;
  }

  try {
    await ensureActiveSessionsTable();
    const [rows] = isSystemAdmin
      ? await pool.query(
        `SELECT user_id, email, full_name, role, tenant_id, tenant_name, tenant_slug,
                branch_id, branch_slug, branch_db, logged_in_at
         FROM tenant_tracking.active_user_sessions
         WHERE logged_out_at IS NULL
         ORDER BY logged_in_at DESC`
      )
      : await pool.query(
        `SELECT user_id, email, full_name, role, tenant_id, tenant_name, tenant_slug,
                branch_id, branch_slug, branch_db, logged_in_at
         FROM tenant_tracking.active_user_sessions
         WHERE tenant_id = ? AND logged_out_at IS NULL
         ORDER BY logged_in_at DESC`,
        [String(tenantId)]
      );

    res.json({
      success: true,
      activeSessions: (rows as any[]).map((row) => ({
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        tenantSlug: row.tenant_slug,
        branchId: row.branch_id,
        branchSlug: row.branch_slug,
        branchDb: row.branch_db,
        loggedInAt: row.logged_in_at,
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
