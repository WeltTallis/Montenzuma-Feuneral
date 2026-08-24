import { Request, Response } from 'express';
import { DateTime } from 'luxon';

import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd HH:mm:ss');

const getTenantSlugFromReq = (req: TenantRequest): string =>
    ((req.headers['x-slug'] as string) || (req.headers['x-tenant-slug'] as string) || req.tenantSlug || 'system_shared');

const resolveTenant = async (req: TenantRequest, res: Response): Promise<string | null> => {
    const tenantSlug = getTenantSlugFromReq(req);
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
        res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
        return null;
    }
    return dbName;
};

const ensurePostmortemRequestsTable = async (dbName: string): Promise<void> => {
    const sql = `
        CREATE TABLE IF NOT EXISTS postmortem_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id VARCHAR(100) NOT NULL,
            request_ref VARCHAR(60) NULL,
            requested_by VARCHAR(150) NULL,
            requesting_authority VARCHAR(200) NULL,
            reason TEXT,
            notes TEXT,
            status ENUM('initiated', 'sent', 'cancelled') DEFAULT 'initiated',
            initiated_by VARCHAR(150) NULL,
            sent_at VARCHAR(255) NULL,
            cancelled_at VARCHAR(255) NULL,
            created_at VARCHAR(255) NULL,
            updated_at VARCHAR(255) NULL,
            INDEX idx_pmr_deceased_id (deceased_id),
            INDEX idx_pmr_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await safeTenantExecute(dbName, sql, []);
};

const ensurePostmortemTable = async (dbName: string): Promise<void> => {
    const sql = `
        CREATE TABLE IF NOT EXISTS postmortem (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            requested_by VARCHAR(150),
            requested_at VARCHAR(255),
            requesting_authority TEXT,
            examination_summary TEXT,
            created_at VARCHAR(255),
            updated_at VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await safeTenantExecute(dbName, sql, []);
};

/**
 * POST /postmortem-requests
 * Initiate a tracked pre-examination postmortem request.
 */
export const createPostmortemRequest = async (req: TenantRequest, res: Response): Promise<Response> => {
    const dbName = await resolveTenant(req, res);
    if (!dbName) return res as unknown as Response;
    try {
        const { deceased_id, reason, requested_by, requesting_authority, notes } = req.body || {};
        if (!deceased_id || !reason || !requested_by) {
            return res.status(400).json({ success: false, message: 'deceased_id, reason and requested_by are required' });
        }
        await ensurePostmortemRequestsTable(dbName);
        const now = nowNairobi();
        const requestRef = `PMR-${Date.now()}`;
        const result: any = await safeTenantExecute(dbName, `
            INSERT INTO postmortem_requests
                (deceased_id, request_ref, requested_by, requesting_authority, reason, notes, status, initiated_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'initiated', ?, ?, ?)
        `, [deceased_id, requestRef, requested_by, requesting_authority || null, reason, notes || null, requested_by, now, now]);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [result?.insertId])) || [];
        try { (global as any).io?.to(`tenant:${getTenantSlugFromReq(req)}`).emit('postmortem-request-created', rows[0]); } catch { /* socket optional */ }

        Logger.info({ message: 'Postmortem request initiated', requestRef, deceased_id });
        return res.status(201).json({ success: true, data: rows[0], message: 'Postmortem request initiated' });
    } catch (error: any) {
        console.error('Error creating postmortem request:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to initiate postmortem request' });
    }
};

/**
 * GET /postmortem-requests?deceased_id=...&status=...
 */
export const getPostmortemRequests = async (req: TenantRequest, res: Response): Promise<Response> => {
    const dbName = await resolveTenant(req, res);
    if (!dbName) return res as unknown as Response;
    try {
        await ensurePostmortemRequestsTable(dbName);
        const { deceased_id, status } = req.query as any;

        let sql = 'SELECT * FROM postmortem_requests';
        const where: string[] = [];
        const params: any[] = [];
        if (deceased_id) { where.push('deceased_id = ?'); params.push(deceased_id); }
        if (status) { where.push('status = ?'); params.push(status); }
        if (where.length) sql += ' WHERE ' + where.join(' AND ');
        sql += ' ORDER BY id DESC LIMIT 100';

        const rows: any[] = (await safeTenantQuery(dbName, sql, params)) || [];
        return res.json({ success: true, data: rows, count: rows.length });
    } catch (error: any) {
        console.error('Error listing postmortem requests:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve postmortem requests' });
    }
};

/**
 * PUT /postmortem-requests/:id/status
 * Transition a tracked request between initiated | sent | cancelled
 */
export const updatePostmortemRequestStatus = async (req: TenantRequest, res: Response): Promise<Response> => {
    const dbName = await resolveTenant(req, res);
    if (!dbName) return res as unknown as Response;
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        if (!['initiated', 'sent', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be one of 'initiated', 'sent', 'cancelled'" });
        }

        await ensurePostmortemRequestsTable(dbName);
        const now = nowNairobi();

        let sql = 'UPDATE postmortem_requests SET status = ?, updated_at = ?';
        const params: any[] = [status, now];
        if (status === 'sent') { sql += ', sent_at = ?'; params.push(now); }
        if (status === 'cancelled') { sql += ', cancelled_at = ?'; params.push(now); }
        sql += ' WHERE id = ?';
        params.push(id);

        await safeTenantExecute(dbName, sql, params);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [id])) || [];
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Postmortem request not found' });
        }
        return res.json({ success: true, data: rows[0], message: `Postmortem request marked as ${status}` });
    } catch (error: any) {
        console.error('Error updating postmortem request status:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update postmortem request' });
    }
};

/**
 * POST /postmortem-requests/:id/send
 * Marks the tracked request as sent to the requesting authority AND mirrors it
 * into the official postmortem table as pending so the existing examination /
 * PDF flows pick it up unchanged.
 */
export const sendPostmortemRequest = async (req: TenantRequest, res: Response): Promise<Response> => {
    const dbName = await resolveTenant(req, res);
    if (!dbName) return res as unknown as Response;
    try {
        const { id } = req.params;
        await ensurePostmortemRequestsTable(dbName);
        await ensurePostmortemTable(dbName);

        const requests: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [id])) || [];
        if (!requests.length) {
            return res.status(404).json({ success: false, message: 'Postmortem request not found' });
        }
        const requestRow = requests[0];
        if (requestRow.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Cancelled requests cannot be sent' });
        }

        const now = nowNairobi();
        await safeTenantExecute(dbName, `UPDATE postmortem_requests SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);

        // Mirror into official postmortem table (pending until exam completed)
        const pmExisting: any[] = (await safeTenantQuery(dbName, 'SELECT id FROM postmortem WHERE deceased_id = ?', [requestRow.deceased_id])) || [];
        if (pmExisting.length) {
            await safeTenantExecute(dbName,
                `UPDATE postmortem
                 SET status = 'pending', requested_by = ?, requested_at = ?,
                     requesting_authority = COALESCE(NULLIF(?, ''), requesting_authority), updated_at = ?
                 WHERE deceased_id = ?`,
                [requestRow.requested_by || null, now, requestRow.requesting_authority || '', now, requestRow.deceased_id]);
        } else {
            await safeTenantExecute(dbName,
                `INSERT INTO postmortem
                    (deceased_id, status, requested_by, requested_at, requesting_authority, examination_summary, created_at, updated_at)
                 VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`,
                [requestRow.deceased_id, requestRow.requested_by || null, now, requestRow.requesting_authority || null, requestRow.reason || null, now, now]);
        }

        Logger.info({ message: `Postmortem request sent`, requestRef: requestRow.request_ref, deceased_id: requestRow.deceased_id });

        const updated: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [id])) || [];
        return res.json({ success: true, data: updated[0], message: 'Postmortem request sent to requesting authority' });
    } catch (error: any) {
        console.error('Error sending postmortem request:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to send postmortem request' });
    }
};