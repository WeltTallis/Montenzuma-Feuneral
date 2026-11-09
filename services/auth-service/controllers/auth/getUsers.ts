
import { Request, Response } from 'express';
import { pool } from './shared';

/**
 * GET /auth/users
 * List all users in the tenant database
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
    const tenantDbName: string | undefined = req.user?.dbName;

    if (!tenantDbName) {
        res.status(400).json({ success: false, message: 'Tenant database not found in token' });
        return;
    }

    try {
        let rows: any[] = [];
        try {
            const [result]: any = await pool.query(
                `SELECT u.user_id, u.email, u.full_name, u.username, u.role, 
                u.branch_id, u.is_active, u.is_verified, u.last_login_at, u.created_at,
                b.branch_name, b.branch_db_name
         FROM \`${tenantDbName}\`.users u
         LEFT JOIN \`${tenantDbName}\`.branches b ON u.branch_id = b.branch_id
         ORDER BY u.created_at DESC`
            );
            rows = result;
        } catch {
            // Fallback: query without branch join
            const [result]: any = await pool.query(
                `SELECT user_id, email, full_name, username, role, branch_id, is_active, is_verified, last_login_at, created_at
         FROM \`${tenantDbName}\`.users
         ORDER BY created_at DESC`
            );
            rows = result;
        }

        res.json({
            success: true,
            users: rows.map((u: any) => ({
                userId: u.user_id,
                email: u.email,
                fullName: u.full_name,
                username: u.username || u.email,
                role: u.role,
                branchId: u.branch_id || null,
                branchName: u.branch_name || null,
                isActive: u.is_active === 1 || u.is_active === true,
                isVerified: u.is_verified === 1 || u.is_verified === true,
                lastLoginAt: u.last_login_at || null,
                createdAt: u.created_at || null,
            })),
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};