
import { Request, Response } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import validator from 'validator';
import {
    ensurePasswordResetOtpTable,
    findTenantCandidatesByUserEmail,
    findUserInTenantDB,
    getPasswordResetCodeHash,
    pool,
} from './shared';
import { buildPasswordResetEmail } from './buildPasswordResetEmail';

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

const getSmtpSenderAddress = (): string => {
    const senderEmail = process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim();
    if (!senderEmail || !validator.isEmail(senderEmail)) {
        throw new Error('SMTP_FROM or EMAIL_FROM must be a valid sender email address');
    }
    return senderEmail;
};

const getSmtpTransporter = (): ReturnType<typeof nodemailer.createTransport> => {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const username = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASSWORD;

    if (!host) throw new Error('SMTP_HOST is required to send password reset codes');
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be a valid TCP port');
    }
    if (Boolean(username) !== Boolean(password)) {
        throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together');
    }
    getSmtpSenderAddress();

    if (!smtpTransporter) {
        const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
        const secure = secureSetting
            ? ['true', '1', 'yes'].includes(secureSetting)
            : port === 465;
        smtpTransporter = nodemailer.createTransport({
            host,
            port,
            secure,
            requireTLS: Boolean(username && password && !secure),
            ...(username && password ? { auth: { user: username, pass: password } } : {}),
        });
    }

    return smtpTransporter;
};

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
            await getSmtpTransporter().sendMail({
                from: {
                    name: process.env.SMTP_FROM_NAME?.trim() || process.env.EMAIL_FROM_NAME?.trim() || 'RestPoint',
                    address: getSmtpSenderAddress(),
                },
                to: email,
                subject: 'Your RestPoint password reset code',
                text: emailContent.text,
                html: emailContent.html,
            });
        }
        res.status(200).json({ success: true, message: genericMessage });
    } catch (error: any) {
        console.error('[AUTH] Forgot password request failed:', error?.message || error);
        // Keep the public response identical for unknown accounts and delivery errors.
        res.status(200).json({ success: true, message: genericMessage });
    }
};