
import { GLOBAL_JWT_SECRET, GLOBAL_REFRESH_SECRET, pool } from './shared';

export const getTenantJwtSecret = async (
    tenantId: number
): Promise<{ jwtSecret: string; refreshSecret: string }> => {
    try {
        const [columns]: any = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'jwt_secret'`
        );
        if (!columns || columns.length === 0) {
            return { jwtSecret: GLOBAL_JWT_SECRET, refreshSecret: GLOBAL_REFRESH_SECRET };
        }
        const [tenants]: any = await pool.query(
            'SELECT jwt_secret, refresh_secret FROM tenant_tracking.tenants WHERE id = ?',
            [tenantId]
        );
        if (tenants.length > 0 && tenants[0].jwt_secret) {
            return {
                jwtSecret: tenants[0].jwt_secret,
                refreshSecret: tenants[0].refresh_secret || tenants[0].jwt_secret,
            };
        }
    } catch (error: any) {
        console.error('Error fetching tenant JWT secret:', error.message);
    }
    return { jwtSecret: GLOBAL_JWT_SECRET, refreshSecret: GLOBAL_REFRESH_SECRET };
};