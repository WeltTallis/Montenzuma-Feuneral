
import { Request, Response } from 'express';
import { clearAuthCookies } from './shared';
import { recordActiveLogout } from './activeSessions';

/**
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    let trackingFailed = false;
    try {
        const sessionId = req.user?.sessionId || req.sessionID;
        if (sessionId) await recordActiveLogout(sessionId);
    } catch (error) {
        trackingFailed = true;
        console.error('Failed to record active-session logout:', error);
    }

    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.clearCookie('restpoint.sid');
        clearAuthCookies(res);
        if (err || trackingFailed) {
            res.status(500).json({
                success: false,
                message: 'Logout completed, but session closure could not be fully recorded',
            });
            return;
        }
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
};