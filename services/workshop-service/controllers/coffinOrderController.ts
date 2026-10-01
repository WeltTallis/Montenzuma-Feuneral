import { Request, Response } from "express"
import { safeTenantQuery, safeTenantExecute } from '../database/db'
// @ts-ignore - socket module types not fully declared
import { getIO } from '../socket'

/*                  
    @route  GET /api/workshop/orders
    @desc   Get all coffin orders with optional filters
*/
const getOrders = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        let query = `
            SELECT co.*,
                COALESCE((SELECT SUM(wa.hours_worked) FROM worker_assignments wa WHERE wa.coffin_order_id = co.id), 0) as total_labor_hours,
                (SELECT w.id FROM worker_assignments wa
                 JOIN workshop_workers w ON wa.user_id = w.id
                 WHERE wa.coffin_order_id = co.id
                 ORDER BY wa.assigned_at DESC LIMIT 1) as assigned_to,
                (SELECT w.full_name FROM worker_assignments wa
                 JOIN workshop_workers w ON wa.user_id = w.id
                 WHERE wa.coffin_order_id = co.id
                 ORDER BY wa.assigned_at DESC LIMIT 1) as assigned_to_name
            FROM coffin_orders co
            WHERE 1=1
        `;
        const params: any[] = [];

        if (req.query.status) {
            query += ' AND co.status = ?';
            params.push(req.query.status);
        }
        if (req.query.from_date) {
            query += ' AND co.order_date >= ?';
            params.push(req.query.from_date);
        }
        if (req.query.to_date) {
            query += ' AND co.order_date <= ?';
            params.push(req.query.to_date);
        }

        query += ' ORDER BY co.created_at DESC';

        const rows = await safeTenantQuery(tenantDb, query, params);

        // Attach each order's worker assignments so the front-end analytics
        // (hours worked, stage breakdown, per-worker production) has real data.
        // A single bulk query avoids N+1 round-trips; orders without any
        // assignment simply keep an empty assignments array.
        if (rows.length) {
            const ids = rows.map((r: any) => r.id);
            const placeholders = ids.map(() => '?').join(',');
            const assignments: any = await safeTenantQuery(
                tenantDb,
                `SELECT wa.*, w.id AS user_id, w.full_name
                 FROM worker_assignments wa
                 JOIN workshop_workers w ON wa.user_id = w.id
                 WHERE wa.coffin_order_id IN (${placeholders})
                 ORDER BY wa.assigned_at`,
                ids
            );
            const byOrder: Record<number, any[]> = {};
            assignments.forEach((a: any) => {
                (byOrder[a.coffin_order_id] = byOrder[a.coffin_order_id] || []).push(a);
            });
            rows.forEach((r: any) => { r.assignments = byOrder[r.id] || []; });
        }

        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  GET /api/workshop/orders/:id
    @desc   Get a single coffin order with full details
*/
const getOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const orders: any = await safeTenantQuery(tenantDb,
            'SELECT * FROM coffin_orders WHERE id = ?',
            [req.params.id]
        );

        if (!orders.length) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Get production stages
        const stages: any = await safeTenantQuery(tenantDb,
            'SELECT * FROM production_stages WHERE coffin_order_id = ? ORDER BY FIELD(stage, "design","cutting","assembly","polishing","finishing")',
            [req.params.id]
        );

        // Get worker assignments
        const assignments: any = await safeTenantQuery(tenantDb,
            `SELECT wa.*, w.id AS user_id, w.full_name
             FROM worker_assignments wa 
             JOIN workshop_workers w ON wa.user_id = w.id 
             WHERE wa.coffin_order_id = ?`,
            [req.params.id]
        );

        // Get material usage
        const materials: any = await safeTenantQuery(tenantDb,
            `SELECT mu.*, m.name as material_name, m.category 
             FROM material_usage mu 
             JOIN materials m ON mu.material_id = m.id 
             WHERE mu.coffin_order_id = ?`,
            [req.params.id]
        );

        // Get costing
        const costing: any = await safeTenantQuery(tenantDb,
            'SELECT * FROM costing WHERE coffin_order_id = ?',
            [req.params.id]
        );

        res.json({
            ...order,
            stages,
            assignments,
            materials_used: materials,
            costing: costing[0] || null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  POST /api/workshop/orders
    @desc   Create a new coffin order
*/
const createOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        // All coffin_orders rows live in the ONE shared operations DB, isolated via
        // the tenant_slug column (NOT NULL, no default) — so it MUST be provided here.
        const tenantSlug = (req as any).tenant?.tenant_slug || (req as any).tenantSlug || 'system_shared';

                        const {
            coffin_name, coffin_type, size,
            color, notes,
            due_date, priority, branch_id,
            assigned_worker_id
        } = req.body;

        // Generate readable order number (shorter, memorable)
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const seq = Math.floor(Math.random() * 90) + 10;
        const order_number = `CFN-${day}${month}-${seq}`;

        const insertResult: any = await safeTenantExecute(tenantDb,
            `INSERT INTO coffin_orders
            (order_number, coffin_name, coffin_type, size, color,
             notes, due_date, priority, branch_id, tenant_slug)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [order_number, coffin_name, coffin_type || 'standard', size || null,
                color, notes, due_date || null, priority || 'normal', branch_id || 1, tenantSlug]
        );

        const orderId = insertResult.insertId;

        // Create initial production stages
        // Best-effort: a stage-table issue must NOT prevent the order from being
        // created and shown to production. The ensure-workshop-tables migration
        // creates the table when missing; if it still fails, log and continue so
        // the order stays visible.
        const stages = ['design', 'cutting', 'assembly', 'polishing', 'finishing'];
        for (const stage of stages) {
            try {
                await safeTenantExecute(tenantDb,
                    'INSERT INTO production_stages (coffin_order_id, stage) VALUES (?, ?)',
                    [orderId, stage]
                );
            } catch (stageError: any) {
                console.error(`[WORKSHOP] Could not create stage ${stage} for order ${orderId}:`, stageError.message);
            }
        }

        // If a worker was selected on order creation, create the assignment
        // (best-effort — assignment failure must not roll back the order).
        if (assigned_worker_id) {
            try {
                await safeTenantExecute(tenantDb,
                    `INSERT INTO worker_assignments (coffin_order_id, user_id, stage, hours_worked, notes, assigned_at)
                     VALUES (?, ?, 'design', 0, 'Assigned on order creation', NOW())`,
                    [orderId, assigned_worker_id]
                );
            } catch (assignError: any) {
                console.error(`[WORKSHOP] Could not assign worker ${assigned_worker_id} to order ${orderId}:`, assignError.message);
            }
        }

        const newOrders: any = await safeTenantQuery(tenantDb, 'SELECT * FROM coffin_orders WHERE id = ?', [orderId]);

        const io = getIO();
        io.emit('order:created', { id: orderId, order_number });

        res.status(201).json(newOrders[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  PATCH /api/workshop/orders/:id
    @desc   Update a coffin order
*/
const updateOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

                const allowedFields = [
            'coffin_name', 'coffin_type', 'size', 'color', 'interior_fabric',
            'notes', 'instructions', 'status', 'delivery_date', 'due_date',
            'priority', 'branch_id', 'hold_reason', 'created_by'
        ];

        const updates: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                // Convert empty delivery_date to null to avoid MySQL date error
                if ((field === 'delivery_date' || field === 'due_date') && req.body[field] === '') {
                    updates.push(`${field} = ?`);
                    values.push(null);
                } else {
                    updates.push(`${field} = ?`);
                    values.push(req.body[field]);
                }
            }
        }

        if (!updates.length) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(req.params.id);
        const updateResult: any = await safeTenantExecute(tenantDb,
            `UPDATE coffin_orders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (!updateResult.affectedRows) {
            return res.status(404).json({ error: 'Order not found' });
        }

                const updatedOrders: any = await safeTenantQuery(tenantDb, 'SELECT * FROM coffin_orders WHERE id = ?', [req.params.id]);

        const io = getIO();
        io.emit('order:updated', updatedOrders[0]);

        res.json(updatedOrders[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  DELETE /api/workshop/orders/:id
    @desc   Delete a coffin order
*/
const deleteOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const deleteResult: any = await safeTenantExecute(tenantDb, 'DELETE FROM coffin_orders WHERE id = ?', [req.params.id]);
        if (!deleteResult.affectedRows) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const io = getIO();
        io.emit('order:deleted', { id: Number(req.params.id) });

        res.json({ message: 'Order deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* ============================================================================
 * HOLD / RELEASE  — pause a coffin order (e.g. the assigned worker is on
 * leave) and later put it back exactly where it was.
 *
 * Why this needs its own endpoints rather than a generic status PATCH:
 *   - a hold REQUIRES a reason, so the caller must supply one
 *   - releasing must restore the PREVIOUS status, not guess a default. An
 *     order held while "assembly" has to come back to "assembly", not to
 *     "pending" — otherwise releasing silently rewinds production.
 * ========================================================================== */

// Idempotent column bootstrap. The workshop tenant tables are created at
// runtime (same pattern as storeController's ensureStoreTables), so existing
// tenants gain the columns on first use without a manual migration.
const ensureHoldColumns = async (tenantDb: string) => {
    const hasColumn = async (col: string) => {
        const rows: any = await safeTenantQuery(
            tenantDb,
            `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coffin_orders' AND COLUMN_NAME = ?`,
            [col]
        );
        return Number(rows?.[0]?.n || 0) > 0;
    };
    const add = async (sql: string) => {
        try { await safeTenantExecute(tenantDb, sql); }
        catch (e: any) { console.error('[WORKSHOP] hold column bootstrap failed:', e.message); }
    };
    if (!(await hasColumn('hold_reason')))
        await add('ALTER TABLE `coffin_orders` ADD COLUMN `hold_reason` TEXT NULL');
    if (!(await hasColumn('on_hold_at')))
        await add('ALTER TABLE `coffin_orders` ADD COLUMN `on_hold_at` VARCHAR(255) NULL');
    if (!(await hasColumn('on_hold_by')))
        await add('ALTER TABLE `coffin_orders` ADD COLUMN `on_hold_by` VARCHAR(255) NULL');
    if (!(await hasColumn('status_before_hold')))
        await add('ALTER TABLE `coffin_orders` ADD COLUMN `status_before_hold` VARCHAR(50) NULL');
};

/*
    @route  POST /api/workshop/orders/:id/hold
    @desc   Pause a coffin order. Requires a reason.
*/
const holdOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const { reason } = req.body || {};
        const clean = String(reason || '').trim();
        // A hold without a reason is not auditable â€” the whole point of holding
        // is to record WHY the job stopped, so it is enforced, not optional.
        if (!clean) return res.status(400).json({ error: 'A hold reason is required' });
        if (clean.length > 500) return res.status(400).json({ error: 'Reason is too long (max 500 characters)' });

        await ensureHoldColumns(tenantDb);

        const rows: any = await safeTenantQuery(
            tenantDb,
            'SELECT id, status FROM coffin_orders WHERE id = ?',
            [req.params.id]
        );
        if (!rows?.length) return res.status(404).json({ error: 'Order not found' });
        if (rows[0].status === 'on_hold') {
            return res.status(409).json({ error: 'Order is already on hold' });
        }

        const heldBy =
            (req as any).user?.full_name || (req as any).user?.name ||
            (req as any).user?.email || 'admin';

        // status_before_hold preserves the exact prior state so release() can
        // put the job back where it was.
        await safeTenantExecute(
            tenantDb,
            `UPDATE coffin_orders
             SET status = 'on_hold', hold_reason = ?, on_hold_at = ?, on_hold_by = ?,
                 status_before_hold = status
             WHERE id = ?`,
            [clean, new Date().toISOString(), heldBy, req.params.id]
        );

        try { getIO()?.emit('workshop:order-held', { id: req.params.id, reason: clean, by: heldBy }); }
        catch { /* sockets are best-effort */ }

        res.json({ success: true, id: req.params.id, status: 'on_hold', reason: clean, heldBy });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/*
    @route  POST /api/workshop/orders/:id/release
    @desc   Release a held coffin order back to the status it had before.
*/
const releaseOrder = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        await ensureHoldColumns(tenantDb);

        const rows: any = await safeTenantQuery(
            tenantDb,
            'SELECT id, status, status_before_hold FROM coffin_orders WHERE id = ?',
            [req.params.id]
        );
        if (!rows?.length) return res.status(404).json({ error: 'Order not found' });
        if (rows[0].status !== 'on_hold') {
            return res.status(409).json({ error: 'Order is not on hold' });
        }

        // Fall back to 'pending' only if there is nothing recorded to restore.
        const restored = rows[0].status_before_hold || 'pending';

        await safeTenantExecute(
            tenantDb,
            `UPDATE coffin_orders
             SET status = ?, hold_reason = NULL, on_hold_at = NULL, on_hold_by = NULL,
                 status_before_hold = NULL
             WHERE id = ?`,
            [restored, req.params.id]
        );

        try { getIO()?.emit('workshop:order-released', { id: req.params.id, status: restored }); }
        catch { /* sockets are best-effort */ }

        res.json({ success: true, id: req.params.id, status: restored });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    holdOrder,
    releaseOrder
};
