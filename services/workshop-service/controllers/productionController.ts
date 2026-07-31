import { Request, Response } from "express"
import axios from 'axios';
import { safeTenantQuery, safeTenantExecute } from '../database/db'
// @ts-ignore - socket module types not fully declared
import { getIO } from '../socket'

const SOCKETIO_SERVICE_URL = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';

const emitNotification = async (event: string, data: any, tenantSlug: string) => {
  try {
    await axios.post(`${SOCKETIO_SERVICE_URL}/emit/${event}`, {
      tenantSlug,
      data
    }, { timeout: 3000 });
  } catch (error) {
    console.warn(`[WORKSHOP] Failed to emit ${event}: ${(error as any).message}`);
  }
};

const getAssignments = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const rows = await safeTenantQuery(tenantDb,
            `SELECT wa.*, u.full_name 
             FROM worker_assignments wa 
             JOIN users u ON wa.user_id = u.user_id 
             ORDER BY wa.assigned_at DESC`
        );
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const getStages = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const rows = await safeTenantQuery(tenantDb,
            'SELECT * FROM production_stages WHERE coffin_order_id = ? ORDER BY FIELD(stage, "design","cutting","assembly","polishing","finishing")',
            [req.params.orderId]
        );
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const updateStage = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const allowedFields = ['status', 'started_at', 'completed_at', 'notes'];
        const updateFields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (!updateFields.length) return res.status(400).json({ error: 'No valid fields to update' });

        values.push(req.params.stageId);
        const updateResult: any = await safeTenantExecute(tenantDb,
            `UPDATE production_stages SET ${updateFields.join(', ')} WHERE id = ?`, values
        );

        if (!updateResult.affectedRows) return res.status(404).json({ error: 'Stage not found' });

        const rows: any = await safeTenantQuery(tenantDb, 'SELECT * FROM production_stages WHERE id = ?', [req.params.stageId]);

        const io = getIO();
        io.emit('production:stage:updated', rows[0]);

        // Emit notification
        await emitNotification('production-stage-updated', {
          id: `stage-${req.params.stageId}-${Date.now()}`,
          stageId: req.params.stageId,
          orderId: req.params.orderId,
          stage: rows[0].stage,
          status: rows[0].status,
          title: 'Production Stage Updated',
          message: `Stage "${rows[0].stage}" status updated to "${rows[0].status}"`,
          type: 'production-update',
          priority: 'medium',
          fullContent: `Order ID: ${req.params.orderId}\nStage: ${rows[0].stage}\nStatus: ${rows[0].status}\nNotes: ${rows[0].notes || 'None'}`
        }, (req as any).tenantSlug || 'system');

        res.json(rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const assignWorker = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const { user_id, stage, notes } = req.body;
        const { orderId } = req.params;

        const insertResult: any = await safeTenantExecute(tenantDb,
            `INSERT INTO worker_assignments (coffin_order_id, user_id, stage, notes)
             VALUES (?, ?, ?, ?)`,
            [orderId, user_id, stage, notes]
        );

        const rows: any = await safeTenantQuery(tenantDb,
            `SELECT wa.*, u.full_name FROM worker_assignments wa 
             JOIN users u ON wa.user_id = u.user_id WHERE wa.id = ?`,
            [insertResult.insertId]
        );

        const io = getIO();
        io.emit('worker:assigned', rows[0]);

        // Emit notification
        await emitNotification('worker-assigned', {
          id: `worker-assign-${insertResult.insertId}-${Date.now()}`,
          assignmentId: insertResult.insertId,
          orderId: orderId,
          userId: user_id,
          stage: stage,
          workerName: rows[0].full_name,
          title: 'Worker Assigned to Production',
          message: `${rows[0].full_name} assigned to ${stage} stage`,
          type: 'worker-assignment',
          priority: 'medium',
          fullContent: `Worker: ${rows[0].full_name}\nOrder ID: ${orderId}\nStage: ${stage}\nNotes: ${notes || 'None'}`
        }, (req as any).tenantSlug || 'system');

        res.status(201).json(rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const updateAssignment = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });

        const allowedFields = ['hours_worked', 'notes', 'completed_at'];
        const updates: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

        values.push(req.params.id);
        const updateResult: any = await safeTenantExecute(tenantDb,
            `UPDATE worker_assignments SET ${updates.join(', ')} WHERE id = ?`, values
        );

        if (!updateResult.affectedRows) return res.status(404).json({ error: 'Assignment not found' });

        const rows: any = await safeTenantQuery(tenantDb,
            `SELECT wa.*, u.full_name FROM worker_assignments wa 
             JOIN users u ON wa.user_id = u.user_id WHERE wa.id = ?`,
            [req.params.id]
        );

        const io = getIO();
        io.emit('worker:assignment:updated', rows[0]);

        // Emit notification
        await emitNotification('worker-assignment-updated', {
          id: `worker-update-${req.params.id}-${Date.now()}`,
          assignmentId: req.params.id,
          orderId: req.params.orderId,
          updates: updates.join(', '),
          title: 'Worker Assignment Updated',
          message: `Assignment #${req.params.id} has been updated`,
          type: 'worker-update',
          priority: 'low',
          fullContent: `Assignment ID: ${req.params.id}\nUpdated fields: ${updates.join(', ')}`
        }, (req as any).tenantSlug || 'system');

        res.json(rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getStages,
    updateStage,
    assignWorker,
    updateAssignment,
    getAssignments
};
