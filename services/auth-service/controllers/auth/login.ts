

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import {
    findTenantByEmail,
    findTenantCandidatesByUserEmail,
    findTenantCandidatesByUsername,
    findUserInTenantDB,
    pool,
    queryTenantDB,
    setAuthCookies,
    type Tenant,
    type User,
} from './shared';
import { generateTokens } from './generateTokens';
import { recordActiveLogin } from './activeSessions';

export const login = async (req: Request, res: Response): Promise<void> => {
    const identifierInput: string = (req.body.email || req.body.identifier || req.body.username || '').trim();
    const { password } = req.body;

    if (!identifierInput) {
        res.status(400).json({ success: false, message: 'Email or username is required' });
        return;
    }
    if (!password) {
        res.status(400).json({ success: false, message: 'Password is required' });
        return;
    }
    // Only enforce email format when the identifier actually looks like an email;
    // plain usernames are allowed and resolved through findTenantCandidatesByUsername.
    if (identifierInput.includes('@') && !validator.isEmail(identifierInput)) {
        res.status(400).json({ success: false, message: 'Valid email is required' });
        return;
    }

    try {
        // Gather EVERY tenant that contains a matching account, then verify the
        // password against each candidate. Picking the first tenant that merely
        // CONTAINS the email previously logged users into the WRONG tenant when
        // the same email was registered by more than one organization.
        let candidates: Tenant[] = [];
        if (identifierInput.includes('@')) {
            const ownerTenant = await findTenantByEmail(identifierInput);
            if (ownerTenant) candidates.push(ownerTenant);
            candidates.push(...(await findTenantCandidatesByUserEmail(identifierInput)));
        } else {
            candidates.push(...(await findTenantCandidatesByUsername(identifierInput.toLowerCase())));
        }
        // De-duplicate by tenant id while preserving order.
        const seenIds = new Set<string>();
        candidates = candidates.filter((t) => {
            const idKey = String(t.tenant_id ?? t.id);
            if (seenIds.has(idKey)) return false;
            seenIds.add(idKey);
            return true;
        });

        let tenant: Tenant | null = null;
        let user: User | null = null;
        for (const candidate of candidates) {
            try {
                const found: User | null = await findUserInTenantDB(candidate.db_name, identifierInput);
                if (!found || Number(found.is_active) === 0) continue;
                const ok = await bcrypt.compare(password, found.password_hash);
                if (ok) {
                    tenant = candidate;
                    user = found;
                    break;
                }
            } catch { continue; }
        }

        if (!tenant || !user) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }

        // Update last login
        try {
            await queryTenantDB(tenant.db_name, 'UPDATE users SET last_login_at = NOW() WHERE user_id = ?', [user.user_id]);
        } catch { /* non-critical */ }

        // Branch resolution
        let branchId = user.branch_id || null;
        let branchDbName: string | null = null;
        let branchSlug: string | null = null;
        let dbName = tenant.db_name;

        if (branchId) {
            try {
                const [branches]: any = await pool.query(
                    `SELECT branch_slug, branch_db_name FROM \`${tenant.db_name}\`.branches WHERE branch_id = ? AND is_active = 1`,
                    [branchId]
                );
                if (branches.length > 0) {
                    branchSlug = branches[0].branch_slug || null;
                    branchDbName = branches[0].branch_db_name;
                    dbName = branchDbName || tenant.db_name;
                } else {
                    // The resolved tenant does NOT own this branch.
                    // This usually means findTenantByUserEmail returned a branch tenant
                    // instead of the parent tenant. Find the real parent tenant.
                    const [allTenants]: any = await pool.query(
                        "SELECT * FROM tenant_tracking.tenants WHERE status = 'active'"
                    );
                    let parentTenant: Tenant | null = null;
                    for (const t of allTenants) {
                        if (t.tenant_id === tenant.tenant_id || t.id === tenant.id) continue;
                        try {
                            const [parentBranches]: any = await pool.query(
                                `SELECT branch_slug, branch_db_name FROM \`${t.db_name}\`.branches WHERE branch_id = ? AND is_active = 1 LIMIT 1`,
                                [branchId]
                            );
                            if (parentBranches.length > 0) {
                                parentTenant = t;
                                branchSlug = parentBranches[0].branch_slug || null;
                                branchDbName = parentBranches[0].branch_db_name || parentBranches[0].branch_slug || null;
                                dbName = branchDbName || t.db_name;
                                break;
                            }
                        } catch { continue; }
                    }
                    if (parentTenant) {
                        tenant = parentTenant;
                    } else {
                        branchId = null;
                    }
                }
            } catch { /* non-critical */ }
        }

        // Deployment type
        let deploymentType = tenant.deployment_type || 'single';
        try {
            const [tenantRows]: any = await pool.query(
                'SELECT deployment_type FROM tenant_tracking.tenants WHERE id = ?',
                [tenant.tenant_id ?? tenant.id]
            );
            if (tenantRows.length > 0 && tenantRows[0].deployment_type) {
                deploymentType = tenantRows[0].deployment_type;
            }
        } catch { /* non-critical */ }

        // Session + JWT always anchor to the PARENT tenant slug; the branch scope
        // travels separately via branchId/branchSlug/branchDbName.
        const effectiveSlug = tenant.tenant_slug;
        // Resolve the tenant id across schemas: legacy rows carried `tenant_id`, the
        // current tenant_tracking.tenants primary key is `id` (VARCHAR(36) UUID).
        const tenantId = tenant.tenant_id ?? tenant.id;
        const sessionId = req.sessionID;
        if (!sessionId) {
            throw new Error('Unable to create an authenticated session');
        }
        const { accessToken, refreshToken } = await generateTokens(user, tenant, branchDbName, branchSlug, sessionId);
        const cookieAuth = req.headers['x-auth-cookie'] === '1';
        try {
            await recordActiveLogin({
                sessionId,
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                role: user.role || 'admin',
                tenantId,
                tenantName: tenant.tenant_name,
                tenantSlug: effectiveSlug,
                tenantDb: tenant.db_name,
                branchId,
                branchSlug,
                branchDb: branchDbName,
            });
        } catch (error) {
            console.error('[Auth] Failed to record active login session:', error);
            res.status(503).json({ success: false, message: 'Unable to record the login session' });
            return;
        }

        // Set session
        const session = req.session as any;
        session.userId = user.user_id;
        session.tenantId = tenantId;
        session.tenantSlug = effectiveSlug;
        session.dbName = dbName;
        if (cookieAuth) setAuthCookies(res, accessToken, refreshToken);

        // Full branch list with parent/child relationships so the frontend can persist
        // the branch hierarchy (branch_id -> parent_branch_id) after login.
        let branchList: any[] = [];
        try {
            const [brows]: any = await pool.query(
                `SELECT branch_id, branch_name, branch_slug, branch_db_name, parent_branch_id, is_active
         FROM \`${tenant.db_name}\`.branches
         ORDER BY parent_branch_id IS NOT NULL, branch_name`
            );
            branchList = (brows || []).map((b: any) => ({
                branchId: b.branch_id,
                branchName: b.branch_name,
                branchSlug: b.branch_slug,
                branchDbName: b.branch_db_name,
                parentBranchId: b.parent_branch_id || null,
                isActive: b.is_active === 1 || b.is_active === true,
            }));
        } catch (err: any) {
            console.warn('Could not load tenant branches for login response:', (err && err.message) || err);
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            ...(cookieAuth ? {} : { accessToken, refreshToken }),
            deploymentType,
            user: {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone || '',
                role: user.role,
                tenantId,
                // Always advertise the PARENT tenant slug here. The effective scope
                // (branch db) is exposed separately via branchId/branchDbName/branchSlug
                // so the frontend never builds /tenant/<branch-db-name>/... URLs.
                tenantSlug: tenant.tenant_slug,
                branchId,
                branchSlug: branchList.find((b: any) => String(b.branchId) === String(branchId))?.branchSlug || null,
                branchDbName,
                dbName,
                parentTenantSlug: tenant.tenant_slug, // parent tenant slug for branch users
                isActive: user.is_active === 1,
                isVerified: user.is_verified === 1,
            },
            tenant: {
                tenantId,
                tenantName: tenant.tenant_name,
                tenantSlug: tenant.tenant_slug,
                slug: tenant.tenant_slug,
                parentTenantSlug: tenant.tenant_slug,
                dbName: tenant.db_name,
            },
            branches: branchList,
        });
    } catch (error: any) {
        if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
            res.status(503).json({
                success: false,
                message: 'Database access denied',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
