
import { Request, Response } from 'express';
import { clearAuthCookies } from './shared';

/**
 * POST /auth/logout
 */
export const logout = (req: Request, res: Response): void => {
    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.clearCookie('restpoint.sid');
        clearAuthCookies(res);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
};