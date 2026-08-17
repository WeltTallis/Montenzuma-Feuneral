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
             notes, due_date, priority, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [order_number, coffin_name, coffin_type || 'standard', size || null,
                color, notes, due_date || null, priority || 'normal', branch_id || 1]
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

export {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder
};