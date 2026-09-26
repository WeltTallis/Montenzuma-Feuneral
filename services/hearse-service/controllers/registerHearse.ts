import path from 'path';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { getHearsePool } from '../database';
import { hearseCacheGet, hearseCacheSet, invalidateHearseCache, FLEET_CACHE_TTL } from '../utilities/hearseCache';
import { getKenyaTimeISO, getKenyaDate } from '@montezuma/shared-utils';

// Hearse images live in the ONE shared uploads folder (/opt/storage/uploads in
// production, bind-mounted from the host) and are served to browsers at
// /uploads/hearses/<file> — the DB stores the relative "uploads/hearses/<file>".
const UPLOADS_BASE_DIR = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
const hearsesDir = path.join(UPLOADS_BASE_DIR, 'hearses');
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

        const { plate_number, hearse_name, model, capacity, status, branch_id, branch_code, driver_id } = req.body;
        const image = req.file ? `uploads/hearses/${req.file.filename}` : null;

        if (!plate_number) {
            res.status(400).json({ success: false, message: 'Missing required field: plate_number.' });
            return;
        }

        // Tenant/branch context — prefer the auth headers the frontend now sends
        // (x-tenant-id / x-tenant-slug / x-branch-id), then req.tenant, then body.


        const headerOf = (name: string): string | null => {
            const v = (req.headers as any)[name];
            return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
        };


        const tenantId = headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id || (req.body as any)?.tenant_id || (req.body as any)?.tenantId || null;
        const tenantSlug = headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug || (req as any).tenantSlug || (req.body as any)?.tenant_slug || null;
        const headerBranchId = headerOf('x-branch-id') || (req.body as any)?.branch_id || (req.body as any)?.branchId || null;
        const headerBranchSlug = headerOf('x-branch-slug') || null;

        const now = getKenyaTimeISO();
        const pool = await getHearsePool();

        let resolvedBranchCode = branch_code || headerBranchSlug || null;
        let assignedBranchId: string | null = headerBranchId || branch_id || null;

        // Resolve branch_code from a UUID/int branch_id (or branch_id from
        // branch_code) against the shared branches registry. Single-branch tenants
        // may omit both — the hearse is then simply owned by the tenant.
        if (!assignedBranchId && branch_code) {
            try {
                const [branchRows] = await pool.query('SELECT branch_id, branch_name FROM branches WHERE branch_code = ? AND is_active = TRUE', [branch_code]);
                const branchRow = branchRows[0];
                if (branchRow) {
                    assignedBranchId = branchRow.branch_id;
                    resolvedBranchCode = branch_code;
                }
            } catch (e) { /* lookup failed - keep provided values */ }

        } else if (assignedBranchId) {

            try {

                const [branchRows] = await pool.query('SELECT branch_code, branch_name FROM branches WHERE branch_id = ? AND is_active = TRUE', [assignedBranchId]);

                const branchRow = branchRows[0];

                if (branchRow) {

                    resolvedBranchCode = branchRow.branch_code || `BRANCH-${assignedBranchId}`;

                } else {

                    resolvedBranchCode = resolvedBranchCode || `BRANCH-${assignedBranchId}`;

                }
            } catch (e) {

                resolvedBranchCode = resolvedBranchCode || (assignedBranchId ? `BRANCH-${assignedBranchId}` : 'MAIN');

            }

        }

        const branchNameValue = assignedBranchId ? `Branch ${assignedBranchId}` : 'Main Branch';
        const branchCodeValue = resolvedBranchCode || (assignedBranchId ? `BRANCH-${assignedBranchId}` : 'MAIN');
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM hearses');
        const hearseNumber = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
        const hearse_code = `HRS-${hearseNumber}`;

        const insertFields = ['hearse_code', 'hearse_name', 'plate_number', 'model', 'capacity', 'status', 'branch_id', 'branch_name', 'branch_code', 'active_bookings', 'tenant_id', 'tenant_slug', 'created_at', 'updated_at'];
        const insertValues = [
            hearse_code, hearse_name || null, plate_number.trim(), model || null, capacity || 8, status || 'available',
            assignedBranchId, branchNameValue, branchCodeValue, 0, tenantId, tenantSlug, now, now
        ];

        const placeholders = insertValues.map(() => '?').join(', ');
        const escapedFields = insertFields.map(f => `\`${f}\``).join(', ');
        const query = `INSERT INTO hearses (${escapedFields}) VALUES (${placeholders})`;
        
        const [result] = await pool.query(query, insertValues) as any;
        
        // Emit real-time update via Socket.IO
        const io = req.app.get('io');

        if (io) {

            const newHearse = {
                id: result.insertId, hearse_code, hearse_name: hearse_name || null, plate_number: plate_number.trim(),
                model: model || null, capacity: capacity || 8, status: status || 'available',
                branch_id: assignedBranchId, branch_name: branchNameValue,
                branch_code: branchCodeValue, tenant_id: tenantId, tenant_slug: tenantSlug,
                image, created_at: now, updated_at: now
            };

            io.emit('hearse_registered', { type: 'HEARSE_REGISTERED', hearse: newHearse, timestamp: now, message: `New hearse registered: ${hearse_name || plate_number}` });
        }

        await invalidateHearseCache(req);

        res.status(201).json({
            success: true, message: 'Hearse registered successfully.',
            data: { id: result.insertId, hearse_code, hearse_name: hearse_name || null, plate_number, image_path: image, branch_id: assignedBranchId, tenant_id: tenantId, tenant_slug: tenantSlug, status: status || 'available' }
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
        const { plate_number, hearse_name, model, capacity, status, branch_id, branch_code, driver_id, description } = req.body;
        const image = req.file ? `uploads/hearses/${req.file.filename}` : null;
        const now = getKenyaTimeISO();

        const fields: string[] = [];
        const values: any[] = [];

        if (image) { fields.push('image = ?'); values.push(image); }
        if (plate_number) { fields.push('plate_number = ?'); values.push(plate_number); }
        if (hearse_name) { fields.push('hearse_name = ?'); values.push(hearse_name); }
        if (model) { fields.push('model = ?'); values.push(model); }
        if (capacity !== undefined && capacity !== null) { fields.push('capacity = ?'); values.push(capacity); }
        if (status) { fields.push('status = ?'); values.push(status); }
        
        // Handle branch update - support both branch_id and branch_code
        if (branch_code && !branch_id) {
            // Look up branch_id from branch_code
            try {
                const [branchRows] = await pool.query('SELECT branch_id, branch_name FROM branches WHERE branch_code = ? AND is_active = TRUE', [branch_code]);
                const branchRow = branchRows[0];
                if (branchRow) {
                    fields.push('branch_id = ?');
                    values.push(branchRow.branch_id);
                    fields.push('branch_code = ?');
                    values.push(branch_code);
                    fields.push('branch_name = ?');
                    values.push(branchRow.branch_name || `Branch ${branchRow.branch_id}`);
                } else {
                    // Branch code not found, use provided code with default id
                    fields.push('branch_id = ?');
                    values.push(1);
                    fields.push('branch_code = ?');
                    values.push(branch_code);
                    fields.push('branch_name = ?');
                    values.push(`Branch 1`);
                }
            } catch (e) {
                // If lookup fails, use provided values
                fields.push('branch_id = ?');
                values.push(1);
                fields.push('branch_code = ?');
                values.push(branch_code);
            }
        } else if (branch_id) {
            // If branch_id is provided, look up branch_code
            try {
                const [branchRows] = await pool.query('SELECT branch_code, branch_name FROM branches WHERE branch_id = ? AND is_active = TRUE', [branch_id]);
                const branchRow = branchRows[0];
                if (branchRow) {
                    fields.push('branch_id = ?');
                    values.push(branch_id);
                    fields.push('branch_code = ?');
                    values.push(branchRow.branch_code || `BRANCH-${branch_id}`);
                    fields.push('branch_name = ?');
                    values.push(branchRow.branch_name || `Branch ${branch_id}`);
                } else {
                    fields.push('branch_id = ?');
                    values.push(branch_id);
                    fields.push('branch_code = ?');
                    values.push(`BRANCH-${branch_id}`);
                }
            } catch (e) {
                fields.push('branch_id = ?');
                values.push(branch_id);
            }
        }
        
        if (driver_id !== undefined && driver_id !== null) { fields.push('driver_id = ?'); values.push(driver_id); }
        if (description) { fields.push('description = ?'); values.push(description); }

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

        await invalidateHearseCache(req);

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
        await invalidateHearseCache(req);
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

        // ACCURACY — this table lives in the SHARED operations database and MANY
        // tenants write hearses into it. Every read MUST be scoped by the calling
        // tenant's id (the frontend sends x-tenant-id). A hearse fleet is
        // TENANT-wide, so we never filter by branch here — but we ALWAYS filter by
        // tenant so one tenant can never see another tenant's hearses.
        const headerOf = (name: string): string | null => {
            const v = (req.headers as any)[name];
            return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
        };
        const tenantId = headerOf('x-tenant-id') || (req.query as any)?.tenant_id || (req as any).tenant?.id || (req as any).tenant?.tenant_id || null;

        // ─── REDIS CACHE ─────────────────────────────────────────────────────
        // The fleet page is a pure tenant-scoped read, so it is the safest thing
        // in this service to cache (nothing to join, no date math). Only cache
        // when x-tenant-id is actually present: without it the SQL below runs
        // UNSCOPED against the shared operations DB and must not be memoised.
        const cacheKey = 'fleet:list';
        if (tenantId != null) {
            const cached = await hearseCacheGet<any>(req, cacheKey);
            if (cached) {
                res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.set('Pragma', 'no-cache');
                res.set('Expires', '0');
                res.json({ success: true, count: cached.hearses?.length ?? 0, hearses: cached.hearses, source: 'cache' });
                return;
            }
        }

        let sql = `SELECT h.*, h.branch_name, h.branch_code, h.image FROM hearses h`;
        const params: any[] = [];
        if (tenantId) {
            sql += ` WHERE h.tenant_id = ?`;
            params.push(tenantId);
        }
        sql += ` ORDER BY h.created_at DESC`;

        const [hearses] = await pool.query(sql, params) as any;

        if (tenantId != null) {
            await hearseCacheSet(req, cacheKey, { hearses }, FLEET_CACHE_TTL);
        }

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json({ success: true, count: hearses.length, hearses, source: 'database' });
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
        const { date } = req.query;

        // Availability is DATE-BASED, not a global status flag. A hearse that is
        // 'booked' for one date is still free on other dates, so we must NOT filter
        // on h.status = 'available'. Only hearses out of service are excluded outright.
        const notServicing = "h.status NOT IN ('maintenance', 'out_of_service', 'disabled', 'pending_inspection')";

        let hearses: any;
        if (date) {
            const key = String(date).slice(0, 10);
            const [rows] = await pool.query(
                `SELECT h.*, h.branch_name, h.branch_code
                 FROM hearses h
                 WHERE ${notServicing}
                   AND NOT EXISTS (
                       SELECT 1 FROM hearse_bookings hb
                       WHERE hb.hearse_id = h.id
                         AND hb.status NOT IN ('completed', 'cancelled')
                         AND (hb.booking_dates LIKE ? OR hb.booking_dates LIKE ?)
                   )
                 ORDER BY h.created_at DESC`,
                [`%"${key} %"`, `%"${key}"%`]
            );
            hearses = rows;
        } else {
            const [rows] = await pool.query(
                `SELECT h.*, h.branch_name, h.branch_code
                 FROM hearses h
                 WHERE ${notServicing}
                 ORDER BY h.created_at DESC`
            );
            hearses = rows;
        }

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json({ success: true, count: hearses.length, hearses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching available hearses.', error: (error as Error).message });
    }
});

export { upload };