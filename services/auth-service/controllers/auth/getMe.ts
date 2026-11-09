
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getTenantJwtSecret } from './getTenantJwt';

/**
 * GET /auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.access_token;
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }

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