
import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';

/**
 * Get simple deceased count - total, this month, this week, today
 */
export const getDeceasedCount = async (req: any, res: any): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    const tenantSlug = (req as any).headers['x-tenant-slug'] || (req as any).headers['x-tenant-id'] || 'system_shared';
    const branchId = (req as any).headers['x-branch-id'] || (req as any).query.branchId || null;

    // For multi-branch: use tenantSlug-branchId pattern which resolveDatabase handles
    const resolveSlug = branchId ? `${tenantSlug}-${branchId}` : tenantSlug;
    const dbName = await resolveDatabase(resolveSlug) || await lookupTenantDatabase(tenantSlug);

    if (!dbName) {
        return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    try {
        const [result] = await safeTenantQuery(dbName, `
      SELECT 
        COUNT(*) as total_deceased,
        COUNT(CASE WHEN MONTH(date_admitted) = MONTH(CURDATE()) AND YEAR(date_admitted) = YEAR(CURDATE()) THEN 1 END) as this_month,
        COUNT(CASE WHEN WEEK(date_admitted) = WEEK(CURDATE()) AND YEAR(date_admitted) = YEAR(CURDATE()) THEN 1 END) as this_week,
        COUNT(CASE WHEN DATE(date_admitted) = CURDATE() THEN 1 END) as today,
        COUNT(CASE WHEN status IN ('Under Care', 'Admitted', 'Received') THEN 1 END) as active_cases,
        COUNT(CASE WHEN status IN ('Released', 'Dispatched', 'Completed') THEN 1 END) as released
      FROM deceased
    `);

        res.status(200).json({
            success: true,
            data: {
                total: result?.total_deceased || 0,
                thisMonth: result?.this_month || 0,
                thisWeek: result?.this_week || 0,
                today: result?.today || 0,
                active: result?.active_cases || 0,
                released: result?.released || 0
            },
            metadata: { requestId, timestamp: new Date().toISOString() }
}
    } catch (error) {
        (logger as any).error(`[${requestId}] Deceased count error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get case status distribution - simple counts by status
 */
export const getCaseStatusDistribution = async (req: any, res: any): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    const tenantSlug = (req as any).headers['x-tenant-slug'] || (req as any).headers['x-tenant-id'] || 'system_shared';
    const dbName = await resolveDatabase(tenantSlug) || await lookupTenantDatabase(tenantSlug);

    if (!dbName) {
        return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    try {
        const results = await safeTenantQuery(dbName, `
      SELECT 
        COALESCE(status, 'Unknown') as status,
        COUNT(*) as count
      FROM deceased
      GROUP BY status
      ORDER BY count DESC
    `);

        res.status(200).json({
            success: true,
            data: (results || []).map(r => ({ status: r.status, count: r.count })),
            metadata: { requestId, timestamp: new Date().toISOString() }
}
    } catch (error) {
        (logger as any).error(`[${requestId}] Case status error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get deceased trends - monthly counts for last 12 months
 */
export const getDeceasedTrends = async (req: any, res: any): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    const tenantSlug = (req as any).headers['x-tenant-slug'] || (req as any).headers['x-tenant-id'] || 'system_shared';
    const dbName = await resolveDatabase(tenantSlug) || await lookupTenantDatabase(tenantSlug);

    if (!dbName) {
        return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    try {
        const results = await safeTenantQuery(dbName, `
      SELECT 
        DATE_FORMAT(date_admitted, '%Y-%m') as month_key,
        DATE_FORMAT(date_admitted, '%b %Y') as month_label,
        COUNT(*) as count
      FROM deceased 
      WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(date_admitted, '%Y-%m'), DATE_FORMAT(date_admitted, '%b %Y')
      ORDER BY DATE_FORMAT(date_admitted, '%Y-%m') ASC
    `);

        res.status(200).json({
            success: true,
            data: (results || []).map(r => ({
                month: r.month_label,
                count: r.count
            })),
            metadata: { requestId, timestamp: new Date().toISOString() }
}
    } catch (error) {
        (logger as any).error(`[${requestId}] Deceased trends error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export { getDeceasedCount, getCaseStatusDistribution, getDeceasedTrends };