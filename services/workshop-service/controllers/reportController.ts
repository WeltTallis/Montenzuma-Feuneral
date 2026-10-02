import { Request, Response } from "express"
import { safeTenantQuery } from '../database/db'

// Simple logger - replace with shared logger when available
const logger = {
    info: (msg: string, data?: any) => console.log(`[WORKSHOP] ${msg}`, data || ''),
    error: (msg: string, data?: any) => console.error(`[WORKSHOP] ${msg}`, data || ''),
    warn: (msg: string, data?: any) => console.warn(`[WORKSHOP] ${msg}`, data || '')
};

/* 
    @route  GET /api/workshop/reports/worker-production
    @desc   How many coffins each worker has PRODUCED, per month.

    Why this exists instead of reusing getOrders() in the browser:

    1. "Produced" is only knowable from orders that are ALREADY finished, but the
       live workshop board deliberately stops downloading finished orders (see
       coffinOrderController.getOrders `exclude_status`). Any screen that derived
       production from that live payload therefore reported 0 for everyone.

    2. A coffin may be assigned to several workers across stages. COUNT(DISTINCT
       coffin_order_id) is what stops one coffin being counted once per worker who
       ever touched it.

    3. The month a coffin is credited to must be the month it was FINISHED, not
       the month it was ordered — a job ordered 28 Feb and finished 3 Mar belongs
       to March. completed_at on the assignment is that moment; order_date is the
       fallback for rows written before the column was populated.

    Query params:
      ?year=2026     calendar year (defaults to the current year)
      ?months=6      how many trailing months to return (default 12, max 24)
*/
const FINISHED_STATUSES = ['completed', 'delivered', 'dispatched', 'collected'];

const getWorkerProduction = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const now = new Date();
        const year = parseInt(String(req.query.year || now.getFullYear()), 10) || now.getFullYear();
        const months = Math.min(24, Math.max(1, parseInt(String(req.query.months || 12), 10) || 12));

        const finishedPlaceholders = FINISHED_STATUSES.map(() => '?').join(',');

        /* One row per (worker, month): how many finished coffins they produced. */
        const perMonth: any = await safeTenantQuery(tenantDb,
            `SELECT
                w.id                                   AS worker_id,
                w.full_name                            AS full_name,
                w.role                                 AS role,
                YEAR(COALESCE(wa.completed_at, co.order_date, co.created_at))  AS y,
                MONTH(COALESCE(wa.completed_at, co.order_date, co.created_at)) AS m,
                COUNT(DISTINCT wa.coffin_order_id)      AS produced
             FROM worker_assignments wa
             JOIN workshop_workers w  ON w.id = wa.user_id
             JOIN coffin_orders co    ON co.id = wa.coffin_order_id
             WHERE co.status IN (${finishedPlaceholders})
               AND YEAR(COALESCE(wa.completed_at, co.order_date, co.created_at)) = ?
             GROUP BY w.id, w.full_name, w.role, y, m
             ORDER BY w.full_name ASC, m ASC`,
            [...FINISHED_STATUSES, year]
        );

        /* Workers with nothing finished this year still deserve a row, otherwise
           they silently vanish from the report and look like they were deleted. */
        const roster: any = await safeTenantQuery(tenantDb,
            'SELECT id AS worker_id, full_name, role FROM workshop_workers ORDER BY full_name ASC',
            []
        );

        /* Labour hours are logged per assignment regardless of order status. */
        const hours: any = await safeTenantQuery(tenantDb,
            `SELECT wa.user_id AS worker_id, COALESCE(SUM(wa.hours_worked), 0) AS hours
             FROM worker_assignments wa
             GROUP BY wa.user_id`,
            []
        );

        const byWorker = new Map<string, Record<string, number>>();
        perMonth.forEach((r: any) => {
            const key = String(r.worker_id);
            if (!byWorker.has(key)) byWorker.set(key, {});
            // SQL returns months as strings; normalise so the client can index
            // by the same "YYYY-MM" key it renders in the table header.
            byWorker.get(key)![`${r.y}-${String(r.m).padStart(2, '0')}`] = Number(r.produced) || 0;
        });

        const hoursByWorker = new Map<string, number>(
            hours.map((h: any) => [String(h.worker_id), Number(h.hours) || 0])
        );

        const workers = roster.map((w: any) => {
            const id = String(w.worker_id);
            const monthly = byWorker.get(id) || {};
            const allTime = Object.values(monthly).reduce((s: number, v) => s + (v as number), 0);
            return {
                worker_id: w.worker_id,
                name: w.full_name,
                role: w.role || 'Worker',
                monthly,
                total: allTime,
                hours: hoursByWorker.get(id) || 0,
            };
        });

        // Month columns: the trailing `months` window, oldest first.
        const monthKeys: string[] = [];
        for (let i = months - 1; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        const currentKey = monthKeys[monthKeys.length - 1];

        res.json({
            year,
            months: monthKeys,
            current_month: currentKey,
            workers,
            totals: {
                workers: workers.length,
                produced: workers.reduce((s: number, w: any) => s + w.total, 0),
                thisMonth: workers.reduce((s: number, w: any) => s + (w.monthly[currentKey] || 0), 0),
            },
        });
    } catch (error: any) {
        logger.error('getWorkerProduction failed', { error: error.message, stack: error.stack, tenant: (req as any).tenant?.db_name });
        res.status(500).json({ error: error.message || 'Failed to load worker production' });
    }
};

/*
    @route  GET /api/workshop/reports/daily
    @desc   Get daily production report
*/
const getDailyReport = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const date = req.query.date || new Date().toISOString().slice(0, 10);

        const [orders]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status NOT IN ('completed','delivered') THEN 1 ELSE 0 END) as pending_orders,
                COALESCE(SUM(selling_price), 0) as total_revenue,
                COALESCE(SUM(total_cost), 0) as total_cost,
                COALESCE(SUM(profit), 0) as total_profit
             FROM coffin_orders 
             WHERE DATE(order_date) = ?`,
            [date]
        );

        const [materialsUsed]: any = await safeTenantQuery(tenantDb,
            `SELECT m.name, m.category, SUM(mu.quantity_used) as total_used, m.unit
             FROM material_usage mu
             JOIN materials m ON mu.material_id = m.id
             WHERE DATE(mu.used_at) = ?
             GROUP BY m.id, m.name, m.category, m.unit`,
            [date]
        );

        const [inProgress]: any = await safeTenantQuery(tenantDb,
            `SELECT id, order_number, customer_name, status 
             FROM coffin_orders 
             WHERE DATE(order_date) = ? OR DATE(updated_at) = ?
             ORDER BY updated_at DESC`,
            [date, date]
        );

        res.json({
            report_date: date,
            summary: orders[0] || {
                total_orders: 0, completed_orders: 0, pending_orders: 0,
                total_revenue: 0, total_cost: 0, total_profit: 0
            },
            materials_used: materialsUsed,
            orders: inProgress
        });
    } catch (error: any) {
        logger.error('getDailyReport failed', { error: error.message, tenant: (req as any).tenant?.db_name });
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/reports/weekly
    @desc   Get weekly production report
*/
const getWeeklyReport = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const endDate = req.query.end_date || new Date().toISOString().slice(0, 10);
        const startDate = req.query.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const [dailyStats]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                DATE(order_date) as date,
                COUNT(*) as orders_count,
                COALESCE(SUM(selling_price), 0) as revenue,
                COALESCE(SUM(profit), 0) as profit
             FROM coffin_orders
             WHERE DATE(order_date) BETWEEN ? AND ?
             GROUP BY DATE(order_date)
             ORDER BY date ASC`,
            [startDate, endDate]
        );

        const [summary]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(selling_price), 0) as total_revenue,
                COALESCE(SUM(total_cost), 0) as total_cost,
                COALESCE(SUM(profit), 0) as total_profit
             FROM coffin_orders
             WHERE DATE(order_date) BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        res.json({
            start_date: startDate, end_date: endDate,
            summary: summary[0] || { total_orders: 0, total_revenue: 0, total_cost: 0, total_profit: 0 },
            daily_breakdown: dailyStats
        });
    } catch (error: any) {
        logger.error('getWeeklyReport failed', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/reports/inventory
    @desc   Get inventory status report
*/
const getInventoryReport = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const [materials]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                category, COUNT(*) as total_items,
                SUM(quantity * unit_price) as total_value,
                SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_items
             FROM materials GROUP BY category ORDER BY category`
        );

        const [lowStock]: any = await safeTenantQuery(tenantDb,
            `SELECT * FROM materials WHERE quantity <= min_stock_level ORDER BY (quantity - min_stock_level) ASC`
        );

        const [recentUsage]: any = await safeTenantQuery(tenantDb,
            `SELECT m.name, m.category, SUM(mu.quantity_used) as total_used, m.unit
             FROM material_usage mu JOIN materials m ON mu.material_id = m.id
             WHERE mu.used_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY m.id, m.name, m.category, m.unit ORDER BY total_used DESC`
        );

        res.json({ summary_by_category: materials, low_stock_alerts: lowStock, recent_usage_7days: recentUsage });
    } catch (error: any) {
        logger.error('getInventoryReport failed', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/reports/production
    @desc   Get production performance report
*/
const getProductionReport = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const [stageStats]: any = await safeTenantQuery(tenantDb,
            `SELECT stage, COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
             FROM production_stages GROUP BY stage
             ORDER BY FIELD(stage, "design","cutting","assembly","polishing","finishing")`
        );

        const [workerPerformance]: any = await safeTenantQuery(tenantDb,
            `SELECT u.id AS user_id, u.full_name,
                COUNT(wa.id) as total_assignments,
                COALESCE(SUM(wa.hours_worked), 0) as total_hours,
                COALESCE(AVG(wa.hours_worked), 0) as avg_hours_per_task
             FROM workshop_workers u LEFT JOIN worker_assignments wa ON u.id = wa.user_id
             WHERE u.role IN ('worker', 'manager')
             GROUP BY u.id, u.full_name ORDER BY total_hours DESC`
        );

        const [orderStatus]: any = await safeTenantQuery(tenantDb,
            `SELECT status, COUNT(*) as count FROM coffin_orders
             GROUP BY status ORDER BY FIELD(status, "pending","design","cutting","assembly","polishing","finishing","completed","delivered")`
        );

        res.json({ stage_distribution: stageStats, worker_performance: workerPerformance, order_status_summary: orderStatus });
    } catch (error: any) {
        logger.error('getProductionReport failed', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/reports/costing
    @desc   Get costing analysis report
*/
const getCostingReport = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const [costingData]: any = await safeTenantQuery(tenantDb,
            `SELECT co.id, co.order_number, co.coffin_name, co.coffin_type, co.status,
                c.overhead_cost, c.total_cost, c.selling_price
             FROM costing c JOIN coffin_orders co ON c.coffin_order_id = co.id
             ORDER BY c.created_at DESC LIMIT 50`
        );

        const [averages]: any = await safeTenantQuery(tenantDb,
            `SELECT coffin_type, COUNT(*) as order_count,
                COALESCE(AVG(total_cost), 0) as avg_cost,
                COALESCE(AVG(selling_price), 0) as avg_price
             FROM costing c JOIN coffin_orders co ON c.coffin_order_id = co.id
             WHERE co.status IN ('completed', 'delivered') GROUP BY coffin_type`
        );

        res.json({ recent_orders: costingData, averages_by_type: averages });
    } catch (error: any) {
        logger.error('getCostingReport failed', { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/reports/monthly
    @desc   Get monthly analytics - orders, revenue, materials breakdown by month
           Returns complete data for the dashboard including weekly breakdown
*/
const getMonthlyAnalytics = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const year = req.query.year || new Date().getFullYear();

        // Monthly order breakdown
        const [monthlyOrders]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                MONTH(order_date) as month, YEAR(order_date) as year,
                COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) as completed,
                COALESCE(SUM(selling_price), 0) as revenue,
                COALESCE(SUM(profit), 0) as profit
             FROM coffin_orders
             WHERE YEAR(order_date) = ?
             GROUP BY MONTH(order_date), YEAR(order_date)
             ORDER BY month ASC`,
            [year]
        );

        // Weekly orders for current month
        const [weeklyOrders]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                WEEK(order_date) as week, MONTH(order_date) as month,
                COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) as completed
             FROM coffin_orders
             WHERE YEAR(order_date) = ? AND MONTH(order_date) = MONTH(CURDATE())
             GROUP BY WEEK(order_date), MONTH(order_date)
             ORDER BY week ASC`,
            [year]
        );

        // Coffin type breakdown - ALL coffin types from orders
        const [coffinTypes]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                coffin_type, COUNT(*) as count,
                COALESCE(AVG(selling_price), 0) as avg_price,
                COALESCE(SUM(selling_price), 0) as total_revenue
             FROM coffin_orders
             WHERE coffin_type IS NOT NULL AND coffin_type != ''
             GROUP BY coffin_type
             ORDER BY count DESC`
        );

        // Materials usage by month
        const [monthlyMaterials]: any = await safeTenantQuery(tenantDb,
            `SELECT 
                MONTH(mu.used_at) as month, m.category,
                COUNT(DISTINCT mu.coffin_order_id) as order_count,
                COALESCE(SUM(mu.quantity_used), 0) as total_used
             FROM material_usage mu JOIN materials m ON mu.material_id = m.id
             WHERE YEAR(mu.used_at) = ?
             GROUP BY MONTH(mu.used_at), m.category
             ORDER BY month ASC, total_used DESC`,
            [year]
        );

        // Stage completion stats
        const [stageStats]: any = await safeTenantQuery(tenantDb,
            `SELECT stage, COUNT(*) as total,
                AVG(TIMESTAMPDIFF(HOUR, started_at, completed_at)) as avg_hours
             FROM production_stages
             WHERE completed_at IS NOT NULL GROUP BY stage`
        );

        // Top materials used
        const [topMaterials]: any = await safeTenantQuery(tenantDb,
            `SELECT m.name, m.category, SUM(mu.quantity_used) as total_used, m.unit,
                COUNT(DISTINCT mu.coffin_order_id) as used_in_orders
             FROM material_usage mu JOIN materials m ON mu.material_id = m.id
             GROUP BY m.id, m.name, m.category, m.unit
             ORDER BY total_used DESC LIMIT 10`
        );

        // Dashboard KPIs
        const [totalStats]: any = await safeTenantQuery(tenantDb,
            `SELECT COUNT(*) as total_orders,
                SUM(CASE WHEN status IN ('completed','delivered') THEN 1 ELSE 0 END) as completed_orders,
                COALESCE(SUM(total_cost), 0) as total_cost,
                COALESCE(SUM(selling_price), 0) as total_revenue
             FROM coffin_orders`
        );

        const [workerCount]: any = await safeTenantQuery(tenantDb,
            `SELECT COUNT(*) as count FROM users WHERE role IN ('worker', 'manager')`
        );

        const [materialsTotal]: any = await safeTenantQuery(tenantDb,
            `SELECT COALESCE(SUM(quantity * unit_price), 0) as total_value FROM materials`
        );

        logger.info('Monthly analytics fetched', {
            tenant: tenantDb, year,
            totalOrders: totalStats[0]?.total_orders || 0,
            coffinTypes: coffinTypes?.length || 0
        });

        res.json({
            year: Number(year),
            monthly_orders: Array.isArray(monthlyOrders) ? monthlyOrders : [],
            weekly_orders: Array.isArray(weeklyOrders) ? weeklyOrders : [],
            coffin_types: Array.isArray(coffinTypes) ? coffinTypes : [],
            monthly_materials: Array.isArray(monthlyMaterials) ? monthlyMaterials : [],
            stage_completion: Array.isArray(stageStats) ? stageStats : [],
            top_materials: Array.isArray(topMaterials) ? topMaterials : [],
            total_stats: totalStats[0] || { total_orders: 0, completed_orders: 0, total_cost: 0, total_revenue: 0 },
            worker_count: workerCount[0]?.count || 0,
            materials_total_value: materialsTotal[0]?.total_value || 0
        });
    } catch (error: any) {
        logger.error('getMonthlyAnalytics failed', { error: error.message, stack: error.stack, tenant: (req as any).tenant?.db_name });
        res.json({
            year: Number(req.query.year || new Date().getFullYear()),
            monthly_orders: [], weekly_orders: [], coffin_types: [],
            monthly_materials: [], stage_completion: [], top_materials: [],
            total_stats: { total_orders: 0, completed_orders: 0, total_cost: 0, total_revenue: 0 },
            worker_count: 0, materials_total_value: 0
        });
    }
};

export {
    getWorkerProduction,
    getDailyReport,
    getWeeklyReport,
    getInventoryReport,
    getProductionReport,
    getCostingReport,
    getMonthlyAnalytics
};