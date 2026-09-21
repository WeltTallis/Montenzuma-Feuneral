
import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import { getKenyaTimeISO } from "../../../packages/shared-utils/dist/timestamps";
import Logger from '../../../packages/shared-logger/src/index';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import axios from 'axios';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi: string | undefined = getKenyaTimeISO();

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

// ─── Real-time Notification Helper ──────────────────────────────────────────
// The frontend connects ONLY to the central socketio-service (port 5018 in
// dev) — never to this service's own socket server — so notifications MUST be
// forwarded through its REST emit endpoint (same pattern as autopsyControl).
const SOCKETIO_CANDIDATE_URLS = [
    process.env.SOCKETIO_SERVICE_URL,
    'http://localhost:5018',
    'http://127.0.0.1:5018',
].filter(Boolean) as string[];

const emitPostmortemEvent = async (event: string, tenantSlug: string, data: Record<string, any>): Promise<void> => {
    // socketio-service validates slugs against /^[a-z0-9-]+$/ ('system_shared' etc.)
    const slug = (tenantSlug || 'system').toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'system';
    for (const baseUrl of SOCKETIO_CANDIDATE_URLS) {
        try {
            await axios.post(`${baseUrl}/emit/${event}`, { tenantSlug: slug, data }, { timeout: 3000 });
            Logger.info({ message: `Emitted ${event} via ${baseUrl}`, tenantSlug: slug });
            return;
        } catch (err: any) {
            Logger.warn({ message: `SocketIO emit failed via ${baseUrl} for ${event}`, error: err?.message });
        }
    }
};


export const ensurePostmortemRequestsTable = async (dbName: string): Promise<void> => {
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
        const now = nowNairobi;
        const requestRef = `PMR-${Date.now()}`;
        const result: any = await safeTenantExecute(dbName, `
            INSERT INTO postmortem_requests
                (deceased_id, request_ref, requested_by, requesting_authority, reason, notes, status, initiated_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'initiated', ?, ?, ?)
        `, [deceased_id, requestRef, requested_by, requesting_authority || null, reason, notes || null, requested_by, now, now]);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [result?.insertId])) || [];

        // Real-time notification via central socketio-service (frontend listens there)
        emitPostmortemEvent('postmortem-request-created', getTenantSlugFromReq(req), {
            id: rows[0]?.request_ref || `pmr-${rows[0]?.id}`,
            requestRef,
            requestId: String(result?.insertId ?? ''),
            deceasedId: deceased_id,
            requestedBy: requested_by,
            requestingAuthority: requesting_authority || '',
            title: 'Postmortem Request Initiated',
            message: `Postmortem request ${requestRef} initiated by ${requested_by}`,
            type: 'postmortem_request',
            priority: 'high',
            fullContent: `Request Ref: ${requestRef}\nDeceased ID: ${deceased_id}\nRequested By: ${requested_by}\nAuthority: ${requesting_authority || 'N/A'}\nReason: ${reason}\nTime: ${now}`,
        }).catch(() => { /* socket optional */ });

        Logger.info({ message: 'Postmortem request initiated', requestRef, deceased_id });

        // Sync the deceased record: the body is now awaiting postmortem examination
        try {
            await safeTenantExecute(dbName, `UPDATE deceased SET body_status = 'Postmortem Requested', updated_at = ? WHERE deceased_id = ?`, [now, deceased_id]);
        } catch (statusErr: any) {
            console.warn('Failed to set deceased body_status to Postmortem Requested:', statusErr?.message);
        }

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

        let sql = `
            SELECT
                pr.*,
                p.status           AS exam_status,
                p.completed_at     AS exam_completed_at,
                p.pathologist_name AS exam_pathologist
            FROM postmortem_requests pr
            LEFT JOIN postmortem p ON p.deceased_id = pr.deceased_id`;
        const where: string[] = [];
        const params: any[] = [];
        if (deceased_id) { where.push('pr.deceased_id = ?'); params.push(deceased_id); }
        if (status) { where.push('pr.status = ?'); params.push(status); }
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
        const now = nowNairobi;

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

        // Keep the deceased body_status in sync with the request lifecycle:
        // cancelled → back to 'In Morgue'; re-initiated/sent → 'Postmortem Requested'
        try {
            const newBodyStatus = status === 'cancelled' ? 'In Morgue' : 'Postmortem Requested';
            await safeTenantExecute(dbName, `UPDATE deceased SET body_status = ?, updated_at = ? WHERE deceased_id = ?`, [newBodyStatus, now, rows[0].deceased_id]);
        } catch (syncErr: any) {
            console.warn('Failed to sync deceased body_status:', syncErr?.message);
        }

        // Real-time notification via central socketio-service
        emitPostmortemEvent('postmortem-request-status', getTenantSlugFromReq(req), {
            id: rows[0].request_ref || `pmr-${rows[0].id}`,
            requestRef: rows[0].request_ref,
            requestId: String(id),
            deceasedId: rows[0].deceased_id,
            status,
            title: `Postmortem Request ${status === 'cancelled' ? 'Cancelled' : 'Updated'}`,
            message: `Postmortem request ${rows[0].request_ref || ''} marked as ${status}`,
            type: 'postmortem_request',
            priority: status === 'cancelled' ? 'high' : 'low',
            fullContent: `Request Ref: ${rows[0].request_ref || 'N/A'}\nDeceased ID: ${rows[0].deceased_id}\nNew Status: ${status}\nTime: ${now}`,
        }).catch(() => { /* socket optional */ });

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

        const now = nowNairobi;
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

        // Real-time notification via the central socketio-service
        emitPostmortemEvent('postmortem-request-sent', getTenantSlugFromReq(req), {
            id: requestRow.request_ref || `pmr-${id}`,
            requestRef: requestRow.request_ref,
            requestId: String(id),
            deceasedId: requestRow.deceased_id,
            requestedBy: requestRow.requested_by || '',
            requestingAuthority: requestRow.requesting_authority || '',
            title: 'Postmortem Request Sent',
            message: `Postmortem request ${requestRow.request_ref || ''} sent to ${requestRow.requesting_authority || 'the requesting authority'}`.trim(),
            type: 'postmortem_request',
            priority: 'medium',
            fullContent: `Request Ref: ${requestRow.request_ref || 'N/A'}\nDeceased ID: ${requestRow.deceased_id}\nAuthority: ${requestRow.requesting_authority || 'N/A'}\nSent At: ${now}`,
        }).catch(() => { /* socket optional */ });

        const updated: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM postmortem_requests WHERE id = ?', [id])) || [];
        return res.json({ success: true, data: updated[0], message: 'Postmortem request sent to requesting authority' });
    } catch (error: any) {
        console.error('Error sending postmortem request:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to send postmortem request' });
    }
};

/**
 * GET /postmortem-requests/stats
 * Tenant-wide analytics: how many postmortems have been requested vs carried out.
 * Optionally filter every counter by ?deceased_id=...
 */
export const getPostmortemStats = async (req: TenantRequest, res: Response): Promise<Response> => {
    const dbName = await resolveTenant(req, res);
    if (!dbName) return res as unknown as Response;
    try {
        await ensurePostmortemRequestsTable(dbName);
        await ensurePostmortemTable(dbName);
        const { deceased_id } = req.query as any;

        // Each counter is its own subquery with its own WHERE clause so the
        // optional deceased_id filter composes cleanly.
        const countReq = (statusExpr: string) =>
            deceased_id
                ? `(SELECT COUNT(*) FROM postmortem_requests WHERE deceased_id = ? AND status ${statusExpr})`
                : `(SELECT COUNT(*) FROM postmortem_requests WHERE status ${statusExpr})`;
        const countPm = (statusExpr: string) =>
            deceased_id
                ? `(SELECT COUNT(*) FROM postmortem WHERE deceased_id = ? AND status ${statusExpr})`
                : `(SELECT COUNT(*) FROM postmortem WHERE status ${statusExpr})`;

        const sql = `
            SELECT
                ${countReq('IS NOT NULL')}                    AS total_requests,
                ${countReq("= 'initiated'")}                  AS initiated,
                ${countReq("= 'sent'")}                       AS sent,
                ${countReq("= 'cancelled'")}                  AS cancelled,
                ${countPm('IS NOT NULL')}                     AS official_total,
                ${countPm("IN ('pending', 'in_progress')")}   AS official_pending,
                ${countPm("= 'completed'")}                   AS official_completed
        `;
        // deceased_id is referenced once per subquery (4 request counters + 3 postmortem counters)
        const params = deceased_id ? Array(7).fill(deceased_id) : [];

        const rows: any[] = (await safeTenantQuery(dbName, sql, params)) || [];
        return res.json({ success: true, data: rows[0] || {} });
    } catch (error: any) {
        console.error('Error building postmortem stats:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to build postmortem stats' });
    }
};