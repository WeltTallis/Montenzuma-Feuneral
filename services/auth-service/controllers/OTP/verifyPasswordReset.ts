

import { Request, Response } from 'express';
import validator from 'validator';
import {
    ensurePasswordResetOtpTable,
    findTenantCandidatesByUserEmail,
    findUserInTenantDB,
    getPasswordResetCodeHash,
    pool,
} from '../auth/shared';

export const verifyPasswordResetCode = async (req: Request, res: Response): Promise<void> => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    if (!validator.isEmail(email) || !/^\d{6}$/.test(code)) {
        res.status(400).json({ success: false, message: 'The code is invalid or expired.' });
        return;
    }

    try {
        await ensurePasswordResetOtpTable();
        const codeHash = getPasswordResetCodeHash(email, code);
        const [rows]: any = await pool.query(
            `SELECT tenant_id, tenant_db, user_id FROM tenant_tracking.password_reset_otp_codes
       WHERE email = ? AND code_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
            [email, codeHash]
        );
        if (!rows.length) {
            res.status(400).json({ success: false, message: 'The code is invalid or expired.' });
            return;
        }

        const tenants = await findTenantCandidatesByUserEmail(email);
        const accounts = [];
        for (const tenant of tenants) {
            const tenantId = String(tenant.id ?? tenant.tenant_id ?? '').trim();
            const matchingCode = rows.some(
                (row: any) => String(row.tenant_id) === tenantId && String(row.tenant_db) === tenant.db_name
            );
            if (!matchingCode) continue;
            const user = await findUserInTenantDB(tenant.db_name, email);
            if (!user?.user_id || user.email?.trim().toLowerCase() !== email || Number(user.is_active) !== 1) continue;
            if (!rows.some((row: any) => String(row.tenant_id) === tenantId && String(row.user_id) === String(user.user_id))) continue;
            accounts.push({
                account: `${tenantId}:${user.user_id}`,
                tenantName: tenant.tenant_name || 'RestPoint account',
            });
        }
        if (!accounts.length) {
            res.status(400).json({ success: false, message: 'The code is invalid or expired.' });
            return;
        }

        res.status(200).json({ success: true, accounts });
    } catch (error: any) {
        console.error('[AUTH] Password reset code verification failed:', error?.message || error);
        res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
    }
};