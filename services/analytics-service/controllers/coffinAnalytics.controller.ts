
import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';

/**
 * Get coffin inventory summary - total stock, sold, by type
 */
export const getCoffinInventorySummary = async (req: any, res: any): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    const tenantSlug = (req as any).headers['x-tenant-slug'] || (req as any).headers['x-tenant-id'] || 'system_shared';
    const dbName = await resolveDatabase(tenantSlug) || await lookupTenantDatabase(tenantSlug);

    if (!dbName) {
        return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    try {
        const [summary] = await safeTenantQuery(dbName, `
      SELECT 
        COUNT(*) as total_types,
        COALESCE(SUM(COALESCE(quantity, 0)), 0) as total_stock,
        COALESCE(SUM(COALESCE(exact_price, 0) * COALESCE(quantity, 0)), 0) as total_value
      FROM coffins
    `);

        const byStatus = await safeTenantQuery(dbName, `
            SELECT 
        CASE WHEN is_deleted THEN 'deleted' WHEN is_active THEN 'active' ELSE 'inactive' END as status,
        COUNT(*) as count,
        COALESCE(SUM(COALESCE(quantity, 0)), 0) as total_quantity
      FROM coffins
      GROUP BY (CASE WHEN is_deleted THEN 'deleted' WHEN is_active THEN 'active' ELSE 'inactive' END)
    `);

        const byType = await safeTenantQuery(dbName, `
      SELECT 
        COALESCE(type, 'Unknown') as type,
        COUNT(*) as count,
        COALESCE(SUM(COALESCE(quantity, 0)), 0) as stock,
        COALESCE(AVG(COALESCE(exact_price, 0)), 0) as avg_price
      FROM coffins
      GROUP BY type
      ORDER BY stock DESC
    `);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTypes: summary?.total_types || 0,
                    totalStock: summary?.total_stock || 0,
                    totalValue: parseFloat(summary?.total_value || 0).toFixed(2)
                },
                byStatus: (byStatus || []).map(s => ({ status: s.status, count: s.count, quantity: s.total_quantity })),
                byType: (byType || []).map(t => ({ type: t.type, count: t.count, stock: t.stock, avgPrice: parseFloat(t.avg_price || 0).toFixed(2) }))
            },
            metadata: { requestId, timestamp: new Date().toISOString() }
}
    } catch (error) {
        (logger as any).error(`[${requestId}] Coffin inventory error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Get coffin sales data
 */
export const getCoffinSales = async (req: any, res: any): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    const tenantSlug = (req as any).headers['x-tenant-slug'] || (req as any).headers['x-tenant-id'] || 'system_shared';
    const dbName = await resolveDatabase(tenantSlug) || await lookupTenantDatabase(tenantSlug);

    if (!dbName) {
        return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    try {
        const results = await safeTenantQuery(dbName, `
            SELECT 
        c.type,
        COUNT(dc.coffin_id) as sold,
        COALESCE(SUM(c.exact_price), 0) as revenue,
        COALESCE(c.quantity, 0) as stock,
        (COALESCE(c.quantity, 0) - COUNT(dc.coffin_id)) as available
      FROM coffins c
      LEFT JOIN deceased_coffin dc ON c.coffin_id = dc.coffin_id
      GROUP BY c.coffin_id, c.type, c.exact_price, c.quantity
      ORDER BY sold DESC
    `);

        res.status(200).json({
            success: true,
                        data: (results || []).map(r => ({
                type: r.type || 'Unknown',
                sold: r.sold || 0,
                revenue: parseFloat(r.revenue || 0).toFixed(2),
                stock: r.stock || 0,
                available: Math.max(0, r.available || 0)
            })),
            metadata: { requestId, timestamp: new Date().toISOString() }
}
    } catch (error) {
        (logger as any).error(`[${requestId}] Coffin sales error:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export { getCoffinInventorySummary, getCoffinSales };