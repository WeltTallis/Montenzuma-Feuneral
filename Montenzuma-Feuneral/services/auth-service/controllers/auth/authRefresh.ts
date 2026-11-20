
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
    GLOBAL_REFRESH_SECRET,
    pool,
    queryTenantDB,
    setAuthCookies,
} from './shared';
import { getTenantJwtSecret } from './getTenantJwt';
import { generateTokens } from './generateTokens';

/**
 * POST /auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    const cookieAuth = req.headers['x-auth-cookie'] === '1' || !!req.cookies?.refresh_token;
    if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token is required' });
        return;
    }

    try {
        let verified: any;
        let refreshSecret: string;

        try {
            verified = jwt.verify(refreshToken, GLOBAL_REFRESH_SECRET);
            const tenantSecret = await getTenantJwtSecret(verified.tenantId);
            refreshSecret = tenantSecret.refreshSecret;
        } catch {
            const payload: any = jwt.decode(refreshToken);
            if (!payload || !payload.tenantId) throw new Error('Invalid refresh token payload');
            const tenantSecret = await getTenantJwtSecret(payload.tenantId);
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
        let branchSlug: string | null = null;
        if (rows[0].branch_id) {
            try {
                const [branches]: any = await pool.query(
                    `SELECT branch_slug, branch_db_name FROM \`${tenants[0].db_name}\`.branches WHERE branch_id = ? AND is_active = 1`,
                    [rows[0].branch_id]
                );
                if (branches.length > 0) {
                    branchDbName = branches[0].branch_db_name;
                    branchSlug = branches[0].branch_slug || null;
                }
            } catch { /* non-critical */ }
        }

        const sessionId = verified.sessionId || req.sessionID;
        const result = await generateTokens(rows[0], tenants[0], branchDbName, branchSlug, sessionId);
        if (cookieAuth) setAuthCookies(res, result.accessToken, result.refreshToken);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            ...(cookieAuth ? {} : { accessToken: result.accessToken, refreshToken: result.refreshToken }),
        });
    } catch (error: any) {
        console.error('[Auth] Token refresh failed:', error.message);
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};
