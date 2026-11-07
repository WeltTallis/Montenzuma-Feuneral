
// ═══════════════════════════════════════════════════════════════
// EXPORT: requestPostmortem (unchanged)
// ═══════════════════════════════════════════════════════════════
import { Request, Response } from 'express';
import { resolveDatabase, safeTenantExecute, safeTenantQuery } from '../../../../shared/dbConfig';
import { getKenyaTimeISO } from '../../../../packages/shared-utils/dist/timestamps';
import Logger from '../../../../packages/shared-logger/src/index';

interface TenantRequest extends Request { tenantSlug?: string }
const SOCKET_URI = [process.env.SOCKETIO_SERVICE_URL, 'http://localhost:5018', 'http://127.0.0.1:5018'].filter(Boolean) as string[];

export const requestPostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ success: false, message: 'Valid tenant required. Please provide x-tenant-slug header' });
    }
    try {
        const { deceased_id, reason, requested_by, requesting_authority, notes, source, priority } = req.body;
        if (!deceased_id || !reason || !requested_by) {
            return res.status(400).json({ success: false, message: 'deceased_id, reason, and requested_by are required' });
        }
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
        }

        const now = getKenyaTimeISO();
        const requestId = `PMREQ-${Date.now()}-${deceased_id}`;
        const existingQuery = 'SELECT id FROM postmortem WHERE deceased_id = ?';
        const existing = await safeTenantQuery(dbName, existingQuery, [deceased_id]);

        if (existing && (existing as any[]).length > 0) {
            const updateQuery = `UPDATE postmortem SET status = 'pending', requested_by = ?, requested_at = ?, requesting_authority = ?, updated_at = ? WHERE deceased_id = ?`;
            await safeTenantExecute(dbName, updateQuery, [requested_by, now, reason, now, deceased_id]);
        } else {
            const insertQuery = `INSERT INTO postmortem (deceased_id, status, requested_by, requested_at, requesting_authority, examination_summary, created_at, updated_at) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`;
            await safeTenantExecute(dbName, insertQuery, [deceased_id, requested_by, now, reason, reason, now, now]);
        }

        let trackingRequestId: number | null = null;
        try {
            const requestRef = `PMR-${Date.now()}`;
            const sourceTag = typeof source === 'string' && source.trim() ? source.trim() : 'postmortem_request_form';
            const trackingNotes = [
                typeof notes === 'string' && notes.trim() ? notes.trim() : null,
                `Source: ${sourceTag}`,
                typeof priority === 'string' && priority.trim() ? `Priority: ${priority.trim()}` : null,
            ].filter(Boolean).join(' · ') || null;

            const tracked: any = await safeTenantExecute(dbName, `
                INSERT INTO postmortem_requests
                    (deceased_id, request_ref, requested_by, requesting_authority, reason, notes, status, initiated_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'initiated', ?, ?, ?)
            `, [deceased_id, requestRef, requested_by, requesting_authority || null, reason, trackingNotes, requested_by, now, now]);
            trackingRequestId = tracked?.insertId ?? null;
        } catch (trackErr: any) {
            Logger.warn({ message: 'Failed to mirror postmortem request into postmortem_requests', error: trackErr?.message });
        }

        // Sync the deceased record: the body is now awaiting postmortem examination.
        // `postmortem_requested` is the flag analytics-service counts on.
        try {
            await safeTenantExecute(dbName,
                `UPDATE deceased SET body_status = 'Postmortem Requested', postmortem_requested = 1, postmortem_completed = 0, updated_at = ? WHERE deceased_id = ?`,
                [now, deceased_id]);
        } catch (statusErr: any) {
            Logger.warn({ message: 'Failed to set deceased body_status to Postmortem Requested', error: statusErr?.message });
        }

        try {
            const axios = require('axios');

            const candidateUrls = SOCKET_URI

            const emitPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-request-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id, requestId, requestedBy: requested_by, reason,
                    title: 'Postmortem Requested', message: `Postmortem examination requested for deceased ${deceased_id}`,
                    type: 'postmortem_requested', priority: 'high',
                    fullContent: `Request ID: ${requestId}\nDeceased ID: ${deceased_id}\nRequested By: ${requested_by}\nReason: ${reason}\nDate: ${now}`,
                }
            };

            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-requested`, emitPayload, { timeout: 3000 });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed: ${socketioServiceUrl}`, error: urlError.message });
                }
            }

            const trackingPayload = {
                tenantSlug,
                data: {
                    id: trackingRequestId ? `pmr-${trackingRequestId}` : `postmortem-request-${deceased_id}-${Date.now()}`,
                    requestId: trackingRequestId ? String(trackingRequestId) : '', deceasedId: deceased_id,
                    requestedBy: requested_by, requestingAuthority: requesting_authority || '', reason,
                    title: 'Postmortem Request Received', message: `Postmortem request submitted by ${requested_by}`,
                    type: 'postmortem_request', priority: 'high',
                    fullContent: [`Deceased ID: ${deceased_id}`, `Requested By: ${requested_by}`, requesting_authority ? `Requesting Authority: ${requesting_authority}` : null, `Reason: ${reason}`, typeof source === 'string' && source ? `Source: ${source}` : null, `Date: ${now}`].filter(Boolean).join('\n'),
                },
            };

            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-request-created`, trackingPayload, { timeout: 3000 });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed for postmortem-request-created: ${socketioServiceUrl}`, error: urlError.message });
                }
            }
        } catch (emitError: any) {
            Logger.warn({ message: `Failed to emit postmortem-requested notification`, error: emitError.message });
        }

        return res.status(201).json({
            success: true, message: "Postmortem request submitted successfully",
            data: { requestId, deceased_id, status: 'pending' }
        });

    } catch (error: any) {
        Logger.error({ message: "Error requesting postmortem", error: error.message || error });
        return res.status(500).json({ success: false, message: error.sqlMessage || error.message || "Internal server error" });
    }
};
