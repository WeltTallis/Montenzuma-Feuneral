


import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
    findTenantByUserEmail,
    findUserInTenantDB,
    queryTenantDB,
} from './shared';

/**
 * POST /auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({ success: false, message: 'All fields are required' });
        return;
    }
    if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        return;
    }
    if (newPassword !== confirmPassword) {
        res.status(400).json({ success: false, message: 'New passwords do not match' });
        return;
    }
    if (currentPassword === newPassword) {
        res.status(400).json({ success: false, message: 'New password must be different from current password' });
        return;
    }

    try {
        const tenant = await findTenantByUserEmail(email);
        if (!tenant) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const user = await findUserInTenantDB(tenant.db_name, email);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ success: false, message: 'Current password is incorrect' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await queryTenantDB(tenant.db_name, 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [
            newPasswordHash,
            user.user_id,
        ]);

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while changing password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};