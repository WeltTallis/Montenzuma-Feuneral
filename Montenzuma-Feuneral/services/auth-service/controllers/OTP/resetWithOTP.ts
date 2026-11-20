
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import type { PoolConnection } from 'mysql2/promise';
import { ensurePasswordResetOtpTable, getPasswordResetCodeHash, pool } from '../auth/shared';

export const resetPasswordWithOtp = async (req: Request, res: Response): Promise<void> => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    const account = String(req.body?.account || '').trim();
    const password = String(req.body?.password || '');
    const [tenantId, userId, ...extra] = account.split(':');
    if (
        !validator.isEmail(email) ||
        !/^\d{6}$/.test(code) ||
        !tenantId ||
        !userId ||
        extra.length ||
        password.length < 8
    ) {
        res.status(400).json({ success: false, message: 'The reset code is invalid or expired.' });
        return;
    }

    let conn: PoolConnection | undefined;
    try {
        await ensurePasswordResetOtpTable();
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const codeHash = getPasswordResetCodeHash(email, code);
        const [rows]: any = await conn.query(
            `SELECT id, tenant_id, tenant_db, user_id FROM tenant_tracking.password_reset_otp_codes
       WHERE email = ? AND code_hash = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY id FOR UPDATE`,
            [email, codeHash]
        );
        const matchingAccount = rows.find(
            (row: any) => String(row.tenant_id) === tenantId && String(row.user_id) === userId
        );
        const dbName = String(matchingAccount?.tenant_db || '');
        if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) throw new Error('INVALID_RESET_CODE');

        const [userResult]: any = await conn.query(
            `UPDATE \`${dbName}\`.users SET password_hash = ?, updated_at = NOW()
       WHERE user_id = ? AND LOWER(email) = ? AND is_active = 1`,
            [await bcrypt.hash(password, 12), userId, email]
        );
        if (!userResult?.affectedRows) throw new Error('INVALID_RESET_CODE');

        await conn.query(
            `UPDATE tenant_tracking.password_reset_otp_codes SET used_at = NOW()
       WHERE email = ? AND code_hash = ? AND used_at IS NULL`,
            [email, codeHash]
        );
        await conn.commit();
        res.status(200).json({ success: true, message: 'Password reset successfully.' });
    } catch (error: any) {
        if (conn) await conn.rollback();
        const invalid = error?.message === 'INVALID_RESET_CODE';
        if (!invalid) console.error('[AUTH] Password reset with code failed:', error?.message || error);
        res.status(invalid ? 400 : 500).json({
            success: false,
            message: invalid ? 'The reset code is invalid or expired.' : 'Could not reset your password. Please try again.',
        });
    } finally {
        conn?.release();
    }
};