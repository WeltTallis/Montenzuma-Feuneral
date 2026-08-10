import { Request, Response } from "express"
import { safeTenantQuery, safeTenantExecute } from '../database/db'
import { getIO } from '../socket'

/* 
    @route  GET /api/workshop/workers
    @desc   Get all workers
*/
const getWorkers = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const rows = await safeTenantQuery(tenantDb,
            "SELECT id AS user_id, full_name, role, created_at FROM workshop_workers ORDER BY full_name ASC"
        );
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  POST /api/workshop/workers
    @desc   Create a new worker
*/
const createWorker = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        // Workshop workers are stored in their own table — name + free-text role only.
        // No email, no password, no phone (the shared auth 'users' table is untouched).
        const { full_name, name, role } = req.body;

        const workerName = String(full_name || name || '').trim();
        if (!workerName) {
            return res.status(400).json({ error: 'Worker name is required' });
        }

        const insertResult: any = await safeTenantExecute(tenantDb,
            'INSERT INTO workshop_workers (full_name, role) VALUES (?, ?)',
            [workerName, String(role || '').trim() || 'Worker']
        );

        const newWorker: any = await safeTenantQuery(tenantDb,
            "SELECT id AS user_id, full_name, role, created_at FROM workshop_workers WHERE id = ?",
            [insertResult.insertId]
        );

        const io = getIO();
        io.emit('worker:created', newWorker[0]);

        res.status(201).json(newWorker[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  PATCH /api/workshop/workers/:id
    @desc   Update a worker
*/
const updateWorker = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const allowedFields = ['full_name', 'role'];
        const updates: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (!updates.length) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(req.params.id);
        const updateResult: any = await safeTenantExecute(tenantDb,
            `UPDATE workshop_workers SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (!updateResult.affectedRows) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const updated = await safeTenantQuery(tenantDb,
            "SELECT id AS user_id, full_name, role, created_at FROM workshop_workers WHERE id = ?",
            [req.params.id]
        );

        const io = getIO();
        io.emit('worker:updated', updated[0]);

        res.json(updated[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/* 
    @route  DELETE /api/workshop/workers/:id
    @desc   Delete a worker
*/
const deleteWorker = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) {
            return res.status(400).json({ error: 'Tenant database not resolved' });
        }

        const deleteResult: any = await safeTenantExecute(tenantDb, 'DELETE FROM workshop_workers WHERE id = ?', [req.params.id]);
        if (!deleteResult.affectedRows) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const io = getIO();
        io.emit('worker:deleted', { id: Number(req.params.id) });

        res.json({ message: 'Worker deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getWorkers,
    createWorker,
    updateWorker,
    deleteWorker
};