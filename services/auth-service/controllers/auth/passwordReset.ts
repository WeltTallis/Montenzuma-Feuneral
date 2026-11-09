import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from './shared';
import { resetPasswordWithOtp } from '../OTP/resetWithOTP';

const resetPasswordWithLegacyToken = async (req: Request, res: Response): Promise<void> => {
  const account = String(req.body?.account || '').trim();
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  const [tenantId, userId, ...extra] = account.split(':');
  if (!tenantId || !userId || extra.length || !/^[a-f0-9]{64}$/i.test(token) || password.length < 8) {
    res.status(400).json({ success: false, message: 'The reset link is invalid or expired.' });
    return;
  }

  let conn: PoolConnection | undefined;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows]: any = await conn.query(
      `SELECT tenant_db FROM tenant_tracking.password_reset_tokens
       WHERE token_hash = ? AND tenant_id = ? AND user_id = ? AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash, tenantId, userId]
    );
    const dbName = String(rows?.[0]?.tenant_db || '');
    if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) throw new Error('INVALID_RESET_TOKEN');
    const passwordHash = await bcrypt.hash(password, 12);
    await conn.query(
      `UPDATE \`${dbName}\`.users SET password_hash = ?, updated_at = NOW()
       WHERE user_id = ? AND is_active = 1`,
      [passwordHash, userId]
    );
    const [result]: any = await conn.query(
      `UPDATE tenant_tracking.password_reset_tokens SET used_at = NOW()
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!result?.affectedRows) throw new Error('INVALID_RESET_TOKEN');
    await conn.commit();
    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    if (conn) await conn.rollback();
    const invalid = error?.message === 'INVALID_RESET_TOKEN';
    if (!invalid) console.error('[AUTH] Legacy password reset failed:', error?.message || error);
    res.status(invalid ? 400 : 500).json({
      success: false,
      message: invalid ? 'The reset link is invalid or expired.' : 'Could not reset your password. Please try again.',
    });
  } finally {
    conn?.release();
  }
};

export const resetPasswordWithToken = async (req: Request, res: Response): Promise<void> => {
  if (req.body?.token) {
    await resetPasswordWithLegacyToken(req, res);
    return;
  }
  await resetPasswordWithOtp(req, res);
};
