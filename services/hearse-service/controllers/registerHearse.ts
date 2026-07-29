import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { getHearsePool } from '../database';
import { getKenyaTimeISO, getKenyaDate } from '@montezuma/shared-utils';

const hearsesDir = path.join(__dirname, '../../uploads/hearses');
if (!fs.existsSync(hearsesDir)) {
    fs.mkdirSync(hearsesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, hearsesDir),
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `hearse-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage });

/**
 * Register a new hearse
 */
export const registerHearse = asyncHandler(async (req: Request, res: Response) => {
    try {
        const dbName = (req as any).tenant?.db_name;
        if (!dbName) {
            res.status(400).json({ success: false, message: 'Tenant database not found' });
            return;
        }

        const { plate_number, hearse_name, model, capacity, status, branch_id, branch_code, driver_id, insurance_expiry, service_due_date } = req.body;
        const image = req.file ? `uploads/hearses/${req.file.filename}` : null;

        if (!plate_number) {
            res.status(400).json({ success: false, message: 'Missing required field: plate_number.' });
            return;
        }

        if (!branch_id) {
            res.status(400).json({ success: false, message: 'Branch selection is required. Please select a branch.' });
            return;
        }

        const now = getKenyaTimeISO();
        const pool = await getHearsePool();

        let resolvedBranchCode = branch_code || null;
        try {
            const [branchRows] = await pool.query('SELECT branch_code, branch_name FROM branches WHERE branch_id = ? AND is_active = TRUE', [branch_id]);
            const branchRow = branchRows[0];
            if (branchRow) {
                resolvedBranchCode = branchRow.branch_code || `BRANCH-${branch_id}`;
            } else {
                resolvedBranchCode = `BRANCH-${branch_id}`;
            }
        } catch (e) {
            resolvedBranchCode = branch_code || `BRANCH-${branch_id}`;
        }

        const assignedBranchId = parseInt(branch_id) || 1;
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM hearses');
        const hearseNumber = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
        const hearse_code = `HRS-${hearseNumber}`;

        const insertFields = ['hearse_code', 'hearse_name', 'plate_number', 'model', 'capacity', 'status', 'branch_id', 'branch_name', 'branch_code', 'min_charge_ksh', 'max_charge_ksh', 'is_own_branch', 'active_bookings', 'created_at', 'updated_at'];
        const insertValues = [
            hearse_code, hearse_name || null, plate_number.trim(), model || null, capacity || 8, status || 'available',
            assignedBranchId, resolvedBranchCode ? `Branch ${assignedBranchId}` : `Branch ${assignedBranchId}`,
            resolvedBranchCode || `BRANCH-${assignedBranchId}`, 0.00, 0.00, 1, 0, now, now
        ];

        const placeholders = insertValues.map(() => '?').join(', ');
        const escapedFields = insertFields.map(f => `\`${f}\``).join(', ');
        const query = `INSERT INTO hearses (${escapedFields}) VALUES (${placeholders})`;

        const [result] = await pool.query(query, insertValues);

        // Emit real-time update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            const newHearse = {
                id: result.insertId, hearse_code, hearse_name: hearse_name || null, plate_number: plate_number.trim(),
                model: model || null, capacity: capacity || 8, status: status || 'available',
                branch_id: assignedBranchId, branch_name: resolvedBranchCode ? `Branch ${assignedBranchId}` : `Branch ${assignedBranchId}`,
                branch_code: resolvedBranchCode || `BRANCH-${assignedBranchId}`, image, created_at: now, updated_at: now
            };
            io.emit('hearse_registered', { type: 'HEARSE_REGISTERED', hearse: newHearse, timestamp: now, message: `New hearse registered: ${hearse_name || plate_number}` });
        }

        res.status(201).json({
            success: true, message: 'Hearse registered successfully.',
            data: { id: result.insertId, hearse_code, hearse_name: hearse_name || null, plate_number, image_path: image, branch_id, status: status || 'available' }
        });
        return;
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while registering hearse.', error: (error as Error).message });
        return;
    }
});

/**
 * Update a hearse
 */
export const updateHearse = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = await getHearsePool();
        const { plate_number, hearse_name, model, capacity, min_charge_ksh, max_charge_ksh, status, branch_id, driver_id, make, year, description, features, chassis_number, engine_number, insurance_expiry, service_due_date } = req.body;
        const image = req.file ? `uploads/hearses/${req.file.filename}` : null;
        const now = getKenyaTimeISO();

        const fields: string[] = [];
        const values: any[] = [];

        if (image) { fields.push('image = ?'); values.push(image); }
        if (plate_number) { fields.push('plate_number = ?'); values.push(plate_number); }
        if (hearse_name) { fields.push('hearse_name = ?'); values.push(hearse_name); }
        if (model) { fields.push('model = ?'); values.push(model); }
        if (capacity !== undefined && capacity !== null) { fields.push('capacity = ?'); values.push(capacity); }
        if (min_charge_ksh !== undefined && min_charge_ksh !== null) { fields.push('min_charge_ksh = ?'); values.push(min_charge_ksh); }
        if (max_charge_ksh !== undefined && max_charge_ksh !== null) { fields.push('max_charge_ksh = ?'); values.push(max_charge_ksh); }
        if (status) { fields.push('status = ?'); values.push(status); }
        if (branch_id) { fields.push('branch_id = ?'); values.push(branch_id); }
        if (driver_id !== undefined && driver_id !== null) { fields.push('driver_id = ?'); values.push(driver_id); }
        if (make) { fields.push('make = ?'); values.push(make); }
        if (year) { fields.push('year = ?'); values.push(year); }
        if (description) { fields.push('description = ?'); values.push(description); }
        if (features) { fields.push('features = ?'); values.push(features); }
        if (chassis_number) { fields.push('chassis_number = ?'); values.push(chassis_number); }
        if (engine_number) { fields.push('engine_number = ?'); values.push(engine_number); }
        if (insurance_expiry) { fields.push('insurance_expiry = ?'); values.push(insurance_expiry); }
        if (service_due_date) { fields.push('service_due_date = ?'); values.push(service_due_date); }

        if (fields.length === 0) {
            res.status(400).json({ success: false, message: 'No fields to update' });
            return;
        }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        const query = `UPDATE hearses SET ${fields.join(', ')} WHERE id = ?`;
        await pool.query(query, values);

        const io = req.app.get('io');
        if (io) {
            const [updatedRows] = await pool.query('SELECT * FROM hearses WHERE id = ?', [id]);
            const updatedHearse = updatedRows[0];
            if (updatedHearse) {
                io.emit('hearse_updated', { type: 'HEARSE_UPDATED', hearse: updatedHearse, timestamp: now, message: `Hearse ${plate_number || id} updated` });
            }
        }

        res.json({ success: true, message: 'Hearse updated successfully.' });
        return;
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while updating hearse.', error: (error as Error).message });
        return;
    }
});

/**
 * Delete a hearse
 */
export const deleteHearse = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pool = await getHearsePool();
        const [hearseRows] = await pool.query('SELECT image FROM hearses WHERE id = ?', [id]);
        const hearse = hearseRows[0];

        if (hearse && hearse.image) {
            const imagePath = path.join(__dirname, '../../', hearse.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM hearses WHERE id = ?', [id]);
        res.json({ success: true, message: 'Hearse deleted successfully.' });
        return;
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while deleting hearse.', error: (error as Error).message });
        return;
    }
});

/**
 * Get all hearses
 */
export const getAllHearses = asyncHandler(async (req: Request, res: Response) => {
    try {
        const pool = await getHearsePool();
        const [hearses] = await pool.query(`SELECT h.*, h.branch_name, h.branch_code, h.image FROM hearses h ORDER BY h.created_at DESC`);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json({ success: true, count: hearses.length, hearses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching hearses.', error: (error as Error).message });
    }
});

/**
 * Get available hearses
 */
export const getAvailableHearses = asyncHandler(async (req: Request, res: Response) => {
    try {
        const pool = await getHearsePool();
        const [hearses] = await pool.query(`SELECT h.*, h.branch_name, h.branch_code FROM hearses h WHERE h.status = 'available' AND h.id NOT IN (SELECT hearse_id FROM hearse_bookings WHERE hearse_id IS NOT NULL AND status NOT IN ('completed', 'cancelled')) ORDER BY h.created_at DESC`);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json({ success: true, count: hearses.length, hearses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching available hearses.', error: (error as Error).message });
    }
});

export { upload };