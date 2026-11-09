
import { Request, Response } from 'express';
import crypto from 'crypto';
import validator from 'validator';
import {
    ensurePasswordResetOtpTable,
    findTenantCandidatesByUserEmail,
    findUserInTenantDB,
    getBrevoSenderEmail,
    getPasswordResetCodeHash,
    pool,
} from './shared';
import { buildPasswordResetEmail } from './buildPasswordResetEmail';

// Password recovery stores only an HMAC of the short-lived code in tenant_tracking.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const genericMessage = 'If an account exists for that email, a password reset code has been sent.';
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!validator.isEmail(email)) {
            res.status(400).json({ success: false, message: 'Enter a valid email address.' });
            return;
        }

        await ensurePasswordResetOtpTable();

        const tenants = await findTenantCandidatesByUserEmail(email);
        const accounts: Array<{ tenantId: string; userId: string; dbName: string }> = [];
        for (const tenant of tenants) {
            const user = await findUserInTenantDB(tenant.db_name, email);
            if (!user?.user_id || user.email?.trim().toLowerCase() !== email || Number(user.is_active) !== 1) continue;
            const tenantId = String(tenant.id ?? tenant.tenant_id ?? '').trim();
            if (!tenantId) continue;
            accounts.push({ tenantId, userId: String(user.user_id), dbName: tenant.db_name });
        }

        if (accounts.length) {
            const code = crypto.randomInt(100000, 1000000).toString();
            const codeHash = getPasswordResetCodeHash(email, code);
            const apiKey = process.env.BREVO_API_KEY?.trim();
            const senderEmail = getBrevoSenderEmail();
            if (!apiKey || !senderEmail) {
                throw new Error('BREVO_API_KEY and a sender email are required to send password reset codes');
            }
            await pool.query(
                'DELETE FROM tenant_tracking.password_reset_otp_codes WHERE email = ? AND used_at IS NULL',
                [email]
            );
            for (const account of accounts) {
                await pool.query(
                    `INSERT INTO tenant_tracking.password_reset_otp_codes
            (code_hash, email, tenant_id, tenant_db, user_id, expires_at)
           VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
                    [codeHash, email, account.tenantId, account.dbName, account.userId]
                );
            }

            const emailContent = buildPasswordResetEmail(email, code);
            const mailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
                body: JSON.stringify({
                    sender: { name: process.env.BREVO_SENDER_NAME || 'RestPoint', email: senderEmail },
                    to: [{ email }],
                    subject: 'Your RestPoint password reset code',
                    textContent: emailContent.text,
                    htmlContent: emailContent.html,
                }),
            });
            if (!mailResponse.ok) throw new Error(`Brevo email request failed (HTTP ${mailResponse.status})`);
        }
        res.status(200).json({ success: true, message: genericMessage });
    } catch (error: any) {
        console.error('[AUTH] Forgot password request failed:', error?.message || error);
        // Keep the public response identical for unknown accounts and delivery errors.
        res.status(200).json({ success: true, message: genericMessage });
    }
};