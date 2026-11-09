
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { findUserInTenantDB, pool } from './shared';

/**
 * POST /auth/register
 */
export const register = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({
        success: false,
        message: 'Please use /api/onboarding/organization endpoint for registration',
    });
};

/**
 * POST /auth/users
 * Create a new user with username, role, and branch assignment.
 * Phone has been removed per user request.
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, full_name, username, role, branch_id } = req.body;
    const tenantDbName: string | undefined = req.user?.dbName;

    if (!tenantDbName) {
        res.status(400).json({ success: false, message: 'Tenant database not found in token' });
        return;
    }
    if (!email || !password || !full_name) {
        res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        return;
    }

    try {
        const existingUser = await findUserInTenantDB(tenantDbName, email);
        if (existingUser) {
            res.status(409).json({ success: false, message: 'User with this email or username already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Check if username/branch_id columns exist in users table
        let hasUsernameCol = false;
        let hasBranchIdCol = false;
        try {
            const [columns]: any = await pool.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
                [tenantDbName]
            );
            hasUsernameCol = columns.some((c: any) => c.COLUMN_NAME === 'username');
            hasBranchIdCol = columns.some((c: any) => c.COLUMN_NAME === 'branch_id');
        } catch { /* non-critical */ }

        let newUserId: number;
        const effectiveUsername = username || email.toLowerCase();

        if (hasUsernameCol && hasBranchIdCol) {
            const [result]: any = await pool.query(
                `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, username, role, branch_id, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
                [email.toLowerCase(), password_hash, full_name, effectiveUsername, role || 'staff', branch_id ? parseInt(branch_id) : null]
            );

            newUserId = result.insertId;
        } else if (hasUsernameCol) {
            const [result]: any = await pool.query(
                `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, username, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
                [email.toLowerCase(), password_hash, full_name, effectiveUsername, role || 'staff']
            );
            newUserId = result.insertId;
        } else if (hasBranchIdCol) {
            const [result]: any = await pool.query(
                `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, role, branch_id, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
                [email.toLowerCase(), password_hash, full_name, role || 'staff', branch_id ? parseInt(branch_id) : null]
            );
            newUserId = result.insertId;
        } else {
            const [result]: any = await pool.query(
                `INSERT INTO \`${tenantDbName}\`.users 
         (email, password_hash, full_name, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, 1, 1)`,
                [email.toLowerCase(), password_hash, full_name, role || 'staff']
            );
            newUserId = result.insertId;
        }

        // Fetch created user with branch info
        let newUser: any = null;
        try {
            const [rows]: any = await pool.query(
                `SELECT u.*, b.branch_name, b.branch_db_name 
         FROM \`${tenantDbName}\`.users u
         LEFT JOIN \`${tenantDbName}\`.branches b ON u.branch_id = b.branch_id
         WHERE u.user_id = ?`,
                [newUserId]
            );
            newUser = rows.length > 0 ? rows[0] : null;
        } catch {
            newUser = await findUserInTenantDB(tenantDbName, email);
        }

        if (!newUser) {
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: { userId: newUserId, email: email.toLowerCase(), fullName: full_name, username: effectiveUsername, role: role || 'staff' },
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                userId: newUser.user_id,
                email: newUser.email,
                fullName: newUser.full_name,
                username: newUser.username || newUser.email,
                role: newUser.role,
                branchId: newUser.branch_id || null,
                branchName: newUser.branch_name || null,
                isActive: newUser.is_active === 1 || newUser.is_active === true,
                isVerified: newUser.is_verified === 1 || newUser.is_verified === true,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
