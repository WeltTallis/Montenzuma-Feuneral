import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { TenantModel } from '../models/Tenant.model';
import { Request, Response } from 'express';
import logger from '@montezuma/shared-logger';

export class UserController {
    /**
     * POST /tenant/users/register - Register a new user for a specific branch
     * Only accessible by admin/manager
     */
    async registerUser(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, full_name, phone, role, branch_id } = req.body;
            const user = (req as any).user;

            // `username` is optional â€” auto-derived from the email when the admin
            // does not supply one (the settings-page "Add User" form doesn't).
            const username: string = String(req.body.username || email || '').trim().toLowerCase();

            if (!email || !password || !full_name || !role) {
                res.status(400).json({ success: false, message: 'Missing required fields: email, password, full_name, role' });
                return;
            }


            if (password.length < 6) {
                res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
                return;
            }

            const validRoles = [
                'system_administrator',
                'admin',
                'manager',
                'receptionist',
                'mortician',
                'driver',
                'hearse_driver',
                'workshop_manager',
                'workshop_technician',
                'inventory_manager',
                'procurement_officer',
                'funeral_director',
                'hr',
                'payroll',
                'security',
                'cleaner',
                'staff',
                'user'
            ];
            if (!validRoles.includes(role)) {
                res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
                return;
            }

            const tenant = await TenantModel.findBySubdomain(user.tenantSlug);
            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }

            const conn = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: tenant.db_name
            });

            try {
                // Check if email already exists
                const [existing] = await conn.query(
                    'SELECT user_id FROM users WHERE email = ? AND is_active = TRUE',
                    [email]
                );
                if ((existing as any[]).length > 0) {
                    res.status(409).json({ success: false, message: 'User with this email already exists' });
                    return;
                }

                // Check if username already exists
                const [existingUsername] = await conn.query(
                    'SELECT user_id FROM users WHERE username = ? AND is_active = TRUE',
                    [username]
                );
                if ((existingUsername as any[]).length > 0) {
                    res.status(409).json({ success: false, message: 'User with this username already exists' });
                    return;
                }

                // Validate branch_id if provided (branch IDs are UUID strings).
                // If no branch is supplied, ALWAYS assign the MAIN/PARENT branch so
                // every new user has an explicit, deterministic branch: default users
                // land on the parent and branch-assigned users land on their branch.
                let finalBranchId = null;
                if (branch_id) {
                    const branchIdStr = String(branch_id);

                    const [branches] = await conn.query(
                        'SELECT branch_id FROM branches WHERE branch_id = ? AND is_active = TRUE',
                        [branchIdStr]
                    );
                    if ((branches as any[]).length === 0) {
                        res.status(400).json({ success: false, message: 'Invalid branch_id' });
                        return;
                    }
                    finalBranchId = branchIdStr;
                } else {
                    try {
                        const [parentBranches] = await conn.query(
                            'SELECT branch_id FROM branches WHERE is_active = TRUE AND parent_branch_id IS NULL ORDER BY branch_id ASC LIMIT 1'
                        );
                        const parentList = parentBranches as any[];
                        if (parentList.length > 0) {
                            finalBranchId = parentList[0].branch_id;
                        }
                    } catch (err: any) {
                        console.warn('[registerUser] Could not resolve parent branch:', (err && err.message) || err);
                    }
                }

                // Hash password
                const password_hash = await bcrypt.hash(password, 10);

                // Generate a UUID for the user (users.user_id is VARCHAR(36), no AUTO_INCREMENT)
                const newUserUuid = uuidv4();

                // Create user — attached to the tenant's DB and the selected branch
                // Ensure users.tenant_id column exists (idempotent — MariaDB/MySQL both
                // support `ADD COLUMN IF NOT EXISTS`). New user rows always carry the
                // owning tenant UUID plus the selected branch UUID.
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) NULL AFTER branch_id');
                } catch (e: any) {
                    console.warn('[registerUser] Could not ensure tenant_id column:', (e && e.message) || e);
                }

                // Create user — attached to the tenant's DB, the owning tenant_id and
                // the selected branch. Both are REQUIRED so a user always logs into
                // the correct tenant + branch (never null/main).
                const [result] = await conn.query(
                    `INSERT INTO users (user_id, email, password_hash, full_name, username, phone, role, branch_id, tenant_id, is_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
                    [newUserUuid, email, password_hash, full_name, username, phone || null, role, finalBranchId, tenant.tenant_id]
                );

                const userId = newUserUuid;

                // Log activity (optional - don't fail if it errors)
                try {
                    await conn.query(
                        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
                        [userId, 'USER_CREATED', `User ${username} (${email}) created with role ${role}${finalBranchId ? ` for branch ${finalBranchId}` : ''}`]
                    );
                } catch (logError) {
                    // Ignore activity log errors
                    console.warn('Failed to log activity:', logError);
                }

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: {
                        user_id: userId,
                        email,
                        full_name,
                        username,
                        role,
                        branch_id: finalBranchId,
                        tenant_id: tenant.tenant_id,
                        tenant_slug: tenant.tenant_slug,
                        db_name: tenant.db_name
                    }
                });
            } finally {
                await conn.end();
            }
        } catch (error: any) {
            logger.error({
                service: "tenant-service",
                controller: "UserController",
                function: "registerUser",
                message: "User registration failed",
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ success: false, message: 'User registration failed', error: error.message });
        }
    }

    /**
     * PUT /tenant/users/:userId/branch - Assign/reassign a user to a branch.
     * Users ALWAYS carry a tenant_id + branch_id so they log in to the correct
     * tenant and branch. Passing no branch_id assigns the MAIN/PARENT branch.
     */
    async updateUserBranch(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { branch_id } = req.body || {};
            const tenantSlug = (req.headers['x-tenant-slug'] as string)
                || (req.query.slug as string)
                || (req.params.tenantSlug as string)
                || ((req as any).user?.tenantSlug);
            const tenant = await TenantModel.findBySubdomain(tenantSlug);

            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }
            if (!userId) {
                res.status(400).json({ success: false, message: 'Missing userId' });
                return;
            }

            const conn = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: tenant.db_name
            });

            try {
                // Ensure the users table has the tenant ownership column
                // (idempotent — mirrors registerUser).
                try {
                    await conn.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) NULL AFTER branch_id');
                } catch (e: any) {
                    console.warn('[updateUserBranch] Could not ensure tenant_id column:', (e && e.message) || e);
                }

                // Resolve the target branch: explicit branch_id (validated) or,
                // when omitted, the tenant's MAIN/PARENT branch.
                let finalBranchId: string | null = null;
                if (branch_id) {
                    const branchIdStr = String(branch_id);
                    const [branches] = await conn.query(
                        'SELECT branch_id FROM branches WHERE branch_id = ? AND is_active = TRUE',
                        [branchIdStr]
                    );
                    if ((branches as any[]).length === 0) {
                        res.status(400).json({ success: false, message: 'Invalid branch_id' });
                        return;
                    }
                    finalBranchId = branchIdStr;
                } else {
                    try {
                        const [parentBranches] = await conn.query(
                            'SELECT branch_id FROM branches WHERE is_active = TRUE AND parent_branch_id IS NULL ORDER BY branch_id ASC LIMIT 1'
                        );
                        const parentList = parentBranches as any[];
                        if (parentList.length > 0) {
                            finalBranchId = parentList[0].branch_id;
                        }
                    } catch (err: any) {
                        console.warn('[updateUserBranch] Could not resolve parent branch:', (err && err.message) || err);
                    }
                }

                // Assign the branch + backfill the owning tenant_id.
                const [result]: any = await conn.query(
                    'UPDATE users SET branch_id = ?, tenant_id = ? WHERE user_id = ?',
                    [finalBranchId, tenant.tenant_id, userId]
                );
                if (!result || result.affectedRows === 0) {
                    res.status(404).json({ success: false, message: 'User not found' });
                    return;
                }

                // Return the refreshed row (with branch name) so the UI updates
                // without a refetch.
                const [rows] = await conn.query(
                    `SELECT u.user_id, u.email, u.full_name, u.username, u.phone, u.role,
                            u.branch_id, u.tenant_id, u.is_active, b.branch_name, b.branch_slug
                     FROM users u
                     LEFT JOIN branches b ON u.branch_id = b.branch_id
                     WHERE u.user_id = ?`,
                    [userId]
                );

                res.json({
                    success: true,
                    message: 'User branch updated successfully',
                    data: (rows as any[])[0] || null
                });
            } finally {
                await conn.end();
            }
        } catch (error: any) {
            logger.error({
                service: "tenant-service",
                controller: "UserController",
                function: "updateUserBranch",
                message: "Failed to update user branch",
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ success: false, message: 'Failed to update user branch', error: error.message });
        }
    }

    /**
     * GET /tenant/users - Get all users in the tenant
     */
    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            // Get tenantSlug from headers or query params (no auth required for this endpoint)
            const tenantSlug = (req.headers['x-tenant-slug'] as string) || (req.query.slug as string);
            const tenant = await TenantModel.findBySubdomain(tenantSlug);

            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }

            const conn = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: tenant.db_name
            });

            try {
                // Ensure the tenant branches table exists so the LEFT JOIN below
                // (and Add-User branch assignment) always works — tenants without
                // one get a default "Main" branch seeded automatically.
                await TenantModel.ensureMainBranch({
                    db_name: tenant.db_name,
                    tenant_slug: tenant.tenant_slug,
                    tenant_name: tenant.tenant_name,
                });

                // Try the branch-aware query first; if the branches table / join
                // is still unavailable, fall back to a users-only query so the
                // user list always loads on the Settings page.

                let users: any[] = [];

        try {
                    const [rows] = await conn.query(`
              SELECT
                u.user_id,
                u.email,
                u.full_name,
                u.username,
                u.phone,
                u.role,
                u.branch_id,
                u.is_active,
                u.last_login_at,
                u.created_at,
                b.branch_name,
                b.branch_slug
              FROM users u
              LEFT JOIN branches b ON u.branch_id = b.branch_id
              WHERE u.is_active = TRUE
              ORDER BY u.created_at DESC
            `);
                    users = rows as any[];
                } catch (joinErr: any) {
                    console.warn('[getUsers] branch join failed, falling back to users-only:', (joinErr && joinErr.message) || joinErr);
                    const [rows] = await conn.query(`
              SELECT
                user_id, email, full_name, username, phone, role, branch_id,
                is_active, last_login_at, created_at, NULL AS branch_name, NULL AS branch_slug
              FROM users
              WHERE is_active = TRUE
              ORDER BY created_at DESC
            `);
                    users = rows as any[];
                }

                res.json({
                    success: true,
                    data: users
                });
            } finally {
                await conn.end();
            }
        } catch (error: any) {
            logger.error({
                service: "tenant-service",
                controller: "UserController",
                function: "getUsers",
                message: "Failed to fetch users",
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
        }
    }

    /**
     * GET /tenant/branches - Get all branches for user assignment
     */
    async getBranches(req: Request, res: Response): Promise<void> {
        try {
            // Get tenantSlug from headers, query params, URL params, or req.user (no auth required)
            const tenantSlug = (req.headers['x-tenant-slug'] as string)
                || (req.query.slug as string)
                || (req.params.tenantSlug as string)
                || ((req as any).user?.tenantSlug);
            const tenant = await TenantModel.findBySubdomain(tenantSlug);

            if (!tenant) {
                res.status(404).json({ success: false, message: 'Tenant not found' });
                return;
            }

            // Ensure a branches table + default "Main" branch exist so branch
            // assignment always has at least the primary branch to pick.
            await TenantModel.ensureMainBranch({
                db_name: tenant.db_name,
                tenant_slug: tenant.tenant_slug,
                tenant_name: tenant.tenant_name,
            });

            // Return the branch list, degrading to an empty array instead of
            // throwing, so the Settings page never blanks on branch errors.
            let branches: any[] = [];
            try {
                branches = await TenantModel.getBranches(tenant.db_name);
            } catch (branchErr: any) {
                console.warn('[getBranches] could not load branches, returning []:', (branchErr && branchErr.message) || branchErr);
            }

            res.json({
                success: true,
                data: branches
            });
        } catch (error: any) {
            logger.error({
                service: "tenant-service",
                controller: "UserController",
                function: "getBranches",
                message: "Failed to fetch branches",
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ success: false, message: 'Failed to fetch branches', error: error.message });
        }
    }
}