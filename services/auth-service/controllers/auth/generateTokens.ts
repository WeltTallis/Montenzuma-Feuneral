
import jwt from 'jsonwebtoken';
import type { Tenant, TokenResult, User } from './shared';
import { getTenantJwtSecret } from './getTenantJwt';

export const generateTokens = async (
    user: User,
    tenant: Tenant,
    branchDbName: string | null = null,
    branchSlug: string | null = null,
    sessionId?: string
): Promise<TokenResult> => {
    // Support both legacy tenant_id values and current UUID id values.
    const tenantId = tenant.tenant_id ?? tenant.id;
    const payload = {
        userId: user.user_id,
        email: user.email,
        tenantId,
        tenantName: tenant.tenant_name,
        // ALWAYS the PARENT tenant slug — never the branch db/slug. The branch
        // scope travels separately via branchId/branchSlug/branchDbName so every
        // consumer stays anchored to the parent organization.
        tenantSlug: tenant.tenant_slug,
        dbName: tenant.db_name,
        role: user.role || 'admin',
        branchDbName,
        branchSlug: branchSlug || null,
        parentTenantSlug: tenant.tenant_slug,
        ...(sessionId ? { sessionId } : {}),
        ...(user.branch_id ? { branchId: user.branch_id } : {}),
    } as any;
    const { jwtSecret, refreshSecret } = await getTenantJwtSecret(tenantId);
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '30d' });
    return { accessToken, refreshToken };
};
