import { Request, Response } from 'express';
import { safeTenantQuery } from '../database/db';

type AnalyticsScope = {
    tenantDb: string;
    tenantSlug: string;
    tenantId: string | null;
    sql: string;
    params: string[];
};

function getAnalyticsScope(req: Request): AnalyticsScope | null {
    const request = req as any;
    const tenantDb = request.tenant?.db_name;
    const tenantSlug = String(request.tenantSlug || request.user?.tenantSlug || request.user?.tenant_slug || '').trim();
    const tenantIdValue = request.user?.tenantId || request.user?.tenant_id || request.tenantId;
    const tenantId = tenantIdValue != null && String(tenantIdValue).trim()
        ? String(tenantIdValue).trim()
        : null;

    if (!tenantDb || !tenantSlug) return null;

    return {
        tenantDb,
        tenantSlug,
        tenantId,
        sql: tenantId ? '(tenant_slug = ? OR tenant_id = ?)' : 'tenant_slug = ?',
        params: tenantId ? [tenantSlug, tenantId] : [tenantSlug],
    };
}

export const getCoffinInventoryAnalytics = async (req: Request, res: Response): Promise<void> => {
    const scope = getAnalyticsScope(req);
    if (!scope) {
        res.status(400).json({ success: false, message: 'Tenant database or tenant context not resolved' });
        return;
    }

    try {
        const [summary] = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                COUNT(DISTINCT type) AS total_types,
                COALESCE(SUM(quantity_on_hand), SUM(quantity), 0) AS total_stock,
                COALESCE(SUM(quantity_reserved), 0) AS total_reserved,
                COALESCE(SUM(quantity), 0) AS total_available,
                COALESCE(SUM(exact_price * COALESCE(quantity_on_hand, quantity)), 0) AS total_value
             FROM coffins
             WHERE ${scope.sql} AND is_deleted = FALSE`,
            scope.params
        );
        const byStatus = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                CASE WHEN is_deleted THEN 'deleted' WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
                COUNT(*) AS count,
                COALESCE(SUM(quantity), 0) AS total_available
             FROM coffins
             WHERE ${scope.sql}
             GROUP BY CASE WHEN is_deleted THEN 'deleted' WHEN is_active THEN 'active' ELSE 'inactive' END`,
            scope.params
        );
        const byType = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                COALESCE(type, 'Unknown') AS type,
                COUNT(*) AS variants,
                COALESCE(SUM(quantity_on_hand), SUM(quantity), 0) AS stock_on_hand,
                COALESCE(SUM(quantity_reserved), 0) AS reserved,
                COALESCE(SUM(quantity), 0) AS available,
                COALESCE(AVG(exact_price), 0) AS avg_price
             FROM coffins
             WHERE ${scope.sql} AND is_deleted = FALSE
             GROUP BY type
             ORDER BY available DESC`,
            scope.params
        );
        const variants = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                coffin_id AS id,
                COALESCE(type, 'Unknown') AS type,
                COALESCE(NULLIF(TRIM(color), ''), 'Color not set') AS color,
                COALESCE(NULLIF(TRIM(size), ''), 'No size') AS size,
                COALESCE(quantity_on_hand, quantity, 0) AS stock_on_hand,
                COALESCE(quantity_reserved, 0) AS reserved,
                COALESCE(quantity, 0) AS available,
                COALESCE(exact_price, 0) AS price
             FROM coffins
             WHERE ${scope.sql} AND is_deleted = FALSE AND is_active = TRUE
             ORDER BY available ASC, type ASC, color ASC
             LIMIT 100`,
            scope.params
        );

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTypes: Number(summary?.total_types || 0),
                    totalStock: Number(summary?.total_stock || 0),
                    totalReserved: Number(summary?.total_reserved || 0),
                    totalAvailable: Number(summary?.total_available || 0),
                    totalValue: Number(summary?.total_value || 0).toFixed(2),
                },
                byStatus: byStatus.map((row: any) => ({
                    status: row.status,
                    count: Number(row.count || 0),
                    quantity: Number(row.total_available || 0),
                })),
                byType: byType.map((row: any) => ({
                    type: row.type,
                    variants: Number(row.variants || 0),
                    stockOnHand: Number(row.stock_on_hand || 0),
                    reserved: Number(row.reserved || 0),
                    available: Number(row.available || 0),
                    avgPrice: Number(row.avg_price || 0).toFixed(2),
                })),
                variants: variants.map((row: any) => ({
                    id: row.id,
                    type: row.type,
                    color: row.color,
                    size: row.size,
                    stockOnHand: Number(row.stock_on_hand || 0),
                    reserved: Number(row.reserved || 0),
                    available: Number(row.available || 0),
                    price: Number(row.price || 0),
                })),
            },
        });
    } catch (error: any) {
        console.error('[Workshop] Coffin inventory analytics failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load coffin inventory analytics' });
    }
};

export const getCoffinBookingsAnalytics = async (req: Request, res: Response): Promise<void> => {
    const scope = getAnalyticsScope(req);
    if (!scope) {
        res.status(400).json({ success: false, message: 'Tenant database or tenant context not resolved' });
        return;
    }

    try {
        const [summary] = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                COUNT(*) AS total_bookings,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COALESCE(SUM(CASE WHEN status IN ('active', 'booked', 'pending') AND stock_reserved = TRUE THEN quantity ELSE 0 END), 0) AS reserved_quantity,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END), 0) AS completed_quantity,
                COALESCE(SUM(CASE WHEN status = 'cancelled' THEN quantity ELSE 0 END), 0) AS cancelled_quantity,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completed_revenue,
                COALESCE(SUM(CASE WHEN is_made_to_order THEN 1 ELSE 0 END), 0) AS made_to_order
             FROM coffin_bookings
             WHERE ${scope.sql}`,
            scope.params
        );
        const byType = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                COALESCE(coffin_name, 'Unspecified') AS coffin_name,
                COALESCE(color, 'Unspecified') AS color,
                COALESCE(NULLIF(size, ''), 'Workshop to decide') AS size,
                COUNT(*) AS bookings,
                COALESCE(SUM(quantity), 0) AS quantity,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completed_revenue
             FROM coffin_bookings
             WHERE ${scope.sql}
             GROUP BY coffin_name, color, COALESCE(NULLIF(size, ''), 'Workshop to decide')
             ORDER BY bookings DESC, coffin_name ASC`,
            scope.params
        );

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalBookings: Number(summary?.total_bookings || 0),
                    totalQuantity: Number(summary?.total_quantity || 0),
                    reservedQuantity: Number(summary?.reserved_quantity || 0),
                    completedQuantity: Number(summary?.completed_quantity || 0),
                    cancelledQuantity: Number(summary?.cancelled_quantity || 0),
                    completedRevenue: Number(summary?.completed_revenue || 0).toFixed(2),
                    madeToOrder: Number(summary?.made_to_order || 0),
                },
                byVariant: byType.map((row: any) => ({
                    coffinName: row.coffin_name,
                    color: row.color,
                    size: row.size,
                    bookings: Number(row.bookings || 0),
                    quantity: Number(row.quantity || 0),
                    completedRevenue: Number(row.completed_revenue || 0).toFixed(2),
                })),
            },
        });
    } catch (error: any) {
        console.error('[Workshop] Coffin booking analytics failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load coffin booking analytics' });
    }
};

export const getCoffinSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
    const scope = getAnalyticsScope(req);
    if (!scope) {
        res.status(400).json({ success: false, message: 'Tenant database or tenant context not resolved' });
        return;
    }

    try {
        const rows = await safeTenantQuery(
            scope.tenantDb,
            `SELECT
                COALESCE(coffin_name, 'Unspecified') AS type,
                COALESCE(color, 'Unspecified') AS color,
                COALESCE(NULLIF(size, ''), 'Workshop to decide') AS size,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END), 0) AS sold,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue
             FROM coffin_bookings
             WHERE ${scope.sql}
             GROUP BY coffin_name, color, COALESCE(NULLIF(size, ''), 'Workshop to decide')
             ORDER BY sold DESC, type ASC`,
            scope.params
        );

        res.status(200).json({
            success: true,
            data: rows.map((row: any) => ({
                type: row.type,
                color: row.color,
                size: row.size,
                sold: Number(row.sold || 0),
                revenue: Number(row.revenue || 0).toFixed(2),
            })),
        });
    } catch (error: any) {
        console.error('[Workshop] Coffin sales analytics failed:', error);
        res.status(500).json({ success: false, message: 'Unable to load coffin sales analytics' });
    }
};
