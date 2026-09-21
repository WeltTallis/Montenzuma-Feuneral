import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import { renderStampOnPDFKit } from '../../../packages/shared-stamps/dist/index';
import Logger from '../../../packages/shared-logger/src/index';
// Same tracking helper the /postmortem-requests endpoints use, so a request
// submitted from the public portal lands in the SAME table the deceased
// profile reads its "Postmortem Requests" list from.
import { ensurePostmortemRequestsTable } from './postmortemRequestControl';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => {
    return DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd HH:mm:ss');
};

const formatFacilityName = (tenantSlug: string): string => {
    if (!tenantSlug || tenantSlug === 'system_shared') return 'RestPoint Mortuary';
    return tenantSlug
        .replace(/[-_]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
        .join(' ');
};

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

        const now = nowNairobi();
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

        // ── Mirror the request into the tracked postmortem_requests table ─────
        // The public portal (family / reception form) posts here, but this
        // controller historically only wrote the official `postmortem` row. The
        // deceased profile renders its "Postmortem Requests" list from
        // `postmortem_requests`, so without this mirror a request submitted from
        // the portal never appeared on the deceased profile. Kept identical to
        // createPostmortemRequest so both entry points behave the same way.
        let trackingRequestId: number | null = null;
        try {
            await ensurePostmortemRequestsTable(dbName);
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
            // Never fail a public request just because the tracking row failed.
            Logger.warn({ message: 'Failed to mirror postmortem request into postmortem_requests', error: trackErr?.message });
        }

        // Sync the deceased record: the body is now awaiting postmortem examination
        // (same behaviour as createPostmortemRequest / the "Initiate Request" flow).
        try {
            await safeTenantExecute(dbName, `UPDATE deceased SET body_status = 'Postmortem Requested', updated_at = ? WHERE deceased_id = ?`, [now, deceased_id]);
        } catch (statusErr: any) {
            Logger.warn({ message: 'Failed to set deceased body_status to Postmortem Requested', error: statusErr?.message });
        }

        try {
            const axios = require('axios');
            const configuredUrl = process.env.SOCKETIO_SERVICE_URL || '';
            const candidateUrls = [
                configuredUrl,
                'http://localhost:5018',
                'http://127.0.0.1:5018',
            ].filter(Boolean);

            const emitPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-request-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id,
                    requestId: requestId,
                    requestedBy: requested_by,
                    reason: reason,
                    title: 'Postmortem Requested',
                    message: `Postmortem examination requested for deceased ${deceased_id}`,
                    type: 'postmortem_requested',
                    priority: 'high',
                    fullContent: `Request ID: ${requestId}\nDeceased ID: ${deceased_id}\nRequested By: ${requested_by}\nReason: ${reason}\nDate: ${now}`,
                }
            };

            let emitted = false;
            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-requested`, emitPayload, { timeout: 3000 });
                    emitted = true;
                    Logger.info({ message: `Emitted postmortem-requested for ${deceased_id} via ${socketioServiceUrl}` });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed: ${socketioServiceUrl}`, error: urlError.message });
                }
            }

            // The notification bell listens for 'notification:postmortem-request-created'
            // (same event createPostmortemRequest emits) — without it a request sent
            // from the public portal never appeared in the mortuary team's bell.
            const trackingPayload = {
                tenantSlug,
                data: {
                    id: trackingRequestId ? `pmr-${trackingRequestId}` : `postmortem-request-${deceased_id}-${Date.now()}`,
                    requestId: trackingRequestId ? String(trackingRequestId) : '',
                    deceasedId: deceased_id,
                    requestedBy: requested_by,
                    requestingAuthority: requesting_authority || '',
                    reason,
                    title: 'Postmortem Request Received',
                    message: `Postmortem request submitted by ${requested_by}`,
                    type: 'postmortem_request',
                    priority: 'high',
                    fullContent: [
                        `Deceased ID: ${deceased_id}`,
                        `Requested By: ${requested_by}`,
                        requesting_authority ? `Requesting Authority: ${requesting_authority}` : null,
                        `Reason: ${reason}`,
                        typeof source === 'string' && source ? `Source: ${source}` : null,
                        `Date: ${now}`,
                    ].filter(Boolean).join('\n'),
                },
            };

            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-request-created`, trackingPayload, { timeout: 3000 });
                    Logger.info({ message: `Emitted postmortem-request-created for ${deceased_id} via ${socketioServiceUrl}` });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed for postmortem-request-created: ${socketioServiceUrl}`, error: urlError.message });
                }
            }
        } catch (emitError: any) {
            Logger.warn({ message: `Failed to emit postmortem-requested notification`, error: emitError.message });
        }

        return res.status(201).json({
            success: true,
            message: "Postmortem request submitted successfully",
            data: { requestId, deceased_id, status: 'pending' }
        });

    } catch (error: any) {
        Logger.error({ message: "Error requesting postmortem", error: error.message || error });
        return res.status(500).json({ success: false, message: error.sqlMessage || error.message || "Internal server error" });
    }
};

/**
 * Force a signature image buffer into pure INK-BLUE ink (#0f33e7) on a
 * transparent background. The client canvas draws with penColor #0f33e7, but
 * anti-aliased edge pixels and PNG encoding can shift the colour after
 * processing. Rebuilding the pixels guarantees every stored/rendered signature
 * is always pure ink blue — identical to the other signature pipelines
 * (bodyRelease, deceased-service).
 */
async function toInkBlueBuffer(buffer: Buffer): Promise<Buffer> {
    const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const INK_BLUE = { r: 15, g: 51, b: 231 }; // #0f33e7 — matches the signature pad penColor
    const normalized = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        const ink = alpha * Math.min(1, Math.pow(1 - luminance, 0.45) * 1.13);
        normalized[i] = INK_BLUE.r;
        normalized[i + 1] = INK_BLUE.g;
        normalized[i + 2] = INK_BLUE.b;
        normalized[i + 3] = Math.round(Math.min(1, Math.max(0, ink)) * 255);
    }

    return sharp(normalized, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ compressionLevel: 9, palette: false })
        .toBuffer();
}

/**
 * Normalize a base64 data-URL signature to pure ink blue and return a fresh
 * base64 data URL. Used before persisting the signature so the stored value
 * is always ink blue.
 */
async function normalizeSignatureToInkBlue(signatureDataUrl: string): Promise<string> {
    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:image')) {
        return signatureDataUrl;
    }
    try {
        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const inkBuffer = await toInkBlueBuffer(buffer);
        return `data:image/png;base64,${inkBuffer.toString('base64')}`;
    } catch (error: any) {
        Logger.warn(`[POSTMORTEM] Failed to normalize signature to ink blue: ${error.message}`);
        return signatureDataUrl;
    }
}

export const savePostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ success: false, message: 'Valid tenant required. Please provide x-tenant-slug header' });
    }

    try {
        const {
            deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
            examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
            manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
            toxicology_findings, custom_findings, staff_username, mortuary_name
        } = req.body;

        if (!deceased_id) return res.status(400).json({ success: false, message: 'deceased_id is required' });

        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        // ─── INK-BLUE NORMALIZATION ──────────────────────────────────────
        // Normalize the signature to pure ink blue (#0f33e7) before storing,
        // so it always renders as ink blue in the generated PDF — matching the
        // canvas stroke colour and the other signature pipelines.
        const rawSignature = (req.body as any).signature_base64;
        const signature_base64 = rawSignature
            ? await normalizeSignatureToInkBlue(rawSignature)
            : null;

        const existingQuery = 'SELECT id FROM postmortem WHERE deceased_id = ?';
        const existing = await safeTenantQuery(dbName, existingQuery, [deceased_id]);
        const now = nowNairobi();

        if (existing && (existing as any[]).length > 0) {
            const updateQuery = `
                UPDATE postmortem SET
                    pathologist_name = ?, external_pathologist_name = ?, external_pathologist_mobile = ?, external_pathologist_id = ?,
                    examination_summary = ?, cause_of_death = ?, immediate_cause_of_death = ?, underlying_cause_of_death = ?,
                    contributing_conditions = ?, manner_of_death = ?, requesting_authority = ?, findings = ?, head_findings = ?,
                    chest_findings = ?, abdomen_findings = ?, extremities_findings = ?, toxicology_findings = ?, custom_findings = ?,
                    signature = ?, staff_username = ?, mortuary_name = ?, updated_at = ?
                WHERE deceased_id = ?
            `;

            await safeTenantExecute(dbName, updateQuery, [
                pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority,
                typeof findings === 'string' ? findings : JSON.stringify(findings),
                head_findings || null, chest_findings || null, abdomen_findings || null, extremities_findings || null,
                toxicology_findings || null, custom_findings || null, signature_base64,
                staff_username || null, mortuary_name || null, now, deceased_id
            ]);

            emitPostmortemUpdate(tenantSlug, deceased_id, { status: 'completed', pathologist_name, cause_of_death, manner_of_death, completed_at: now });

            try {
                let deceasedName = '';
                try {
                    const nRows: any[] = (await safeTenantQuery(dbName, 'SELECT full_name FROM deceased WHERE deceased_id = ?', [deceased_id])) || [];
                    deceasedName = nRows[0]?.full_name || '';
                } catch { /* name optional */ }

                const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                const axios = require('axios');
                const who = deceasedName || deceased_id;
                await axios.post(`${socketioServiceUrl}/emit/postmortem-results-ready`, {
                    tenantSlug,
                    data: {
                        id: `postmortem-results-${deceased_id}-${Date.now()}`, deceasedId: deceased_id, deceasedName,
                        pathologistName: pathologist_name || 'N/A', causeOfDeath: cause_of_death || 'Pending',
                        mannerOfDeath: manner_of_death || 'Undetermined', title: 'Postmortem Results Available',
                        message: `Postmortem results for ${who} are now available`, type: 'postmortem_results', priority: 'high',
                        fullContent: `Deceased: ${who}\nDeceased ID: ${deceased_id}\nPathologist: ${pathologist_name || 'N/A'}\nCause of Death: ${cause_of_death || 'Pending'}\nManner of Death: ${manner_of_death || 'Undetermined'}\nCompleted: ${now}`
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                console.warn('[POSTMORTEM] Failed to emit postmortem-results-ready notification:', emitError.message);
            }

            return res.status(200).json({ success: true, message: 'Postmortem data saved successfully', data: { deceased_id } });
        } else {
            const insertQuery = `
                INSERT INTO postmortem (
                    deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                    examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                    manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
                    toxicology_findings, custom_findings, staff_username, mortuary_name, signature, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await safeTenantExecute(dbName, insertQuery, [
                deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority,
                typeof findings === 'string' ? findings : JSON.stringify(findings),
                head_findings || null, chest_findings || null, abdomen_findings || null, extremities_findings || null,
                toxicology_findings || null, custom_findings || null, staff_username || null, mortuary_name || null,
                signature_base64, now, now
            ]);

            emitPostmortemUpdate(tenantSlug, deceased_id, { status: 'completed', pathologist_name, cause_of_death, manner_of_death, completed_at: now });

            try {
                let deceasedName = '';
                try {
                    const nRows: any[] = (await safeTenantQuery(dbName, 'SELECT full_name FROM deceased WHERE deceased_id = ?', [deceased_id])) || [];
                    deceasedName = nRows[0]?.full_name || '';
                } catch { /* name optional */ }

                const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                const axios = require('axios');
                const who = deceasedName || deceased_id;
                await axios.post(`${socketioServiceUrl}/emit/postmortem-results-ready`, {
                    tenantSlug,
                    data: {
                        id: `postmortem-results-${deceased_id}-${Date.now()}`, deceasedId: deceased_id, deceasedName,
                        pathologistName: pathologist_name || 'N/A', causeOfDeath: cause_of_death || 'Pending',
                        mannerOfDeath: manner_of_death || 'Undetermined', title: 'Postmortem Results Available',
                        message: `Postmortem results for ${who} are now available`, type: 'postmortem_results', priority: 'high',
                        fullContent: `Deceased: ${who}\nDeceased ID: ${deceased_id}\nPathologist: ${pathologist_name || 'N/A'}\nCause of Death: ${cause_of_death || 'Pending'}\nManner of Death: ${manner_of_death || 'Undetermined'}\nCompleted: ${now}`
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                console.warn('[POSTMORTEM] Failed to emit postmortem-results-ready notification:', emitError.message);
            }

            return res.status(201).json({ success: true, message: 'Postmortem data saved successfully', data: { id: (result as any).insertId, deceased_id } });
        }
    } catch (error: any) {
        console.error('Error in savePostmortem:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};

const emitPostmortemUpdate = async (tenantSlug: string, deceasedId: string, data: any) => {
    const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
    try {
        const axios = require('axios');
        if (!tenantSlug || tenantSlug === 'system_shared') return;

        try {
            await axios.post(`${socketioServiceUrl}/emit/postmortem-updated`, {
                tenantSlug, data: { deceasedId, data, timestamp: new Date().toISOString() }
            }, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('[POSTMORTEM] Failed to emit postmortem-updated:', error.message);
        }

        if (data.status === 'completed') {
            const notificationPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-${Date.now()}`, type: 'postmortem_completed', title: 'Postmortem Completed',
                    message: `Postmortem examination has been completed for deceased ID: ${deceasedId}`,
                    fullContent: `Postmortem Status: Completed\nDeceased ID: ${deceasedId}\nPathologist: ${data.pathologist_name || 'N/A'}\nCause of Death: ${data.cause_of_death || 'N/A'}\nManner of Death: ${data.manner_of_death || 'N/A'}\nCompleted At: ${data.completed_at || 'N/A'}`,
                    priority: 'high',
                    data: { deceased_id: deceasedId, status: 'completed', pathologist_name: data.pathologist_name, cause_of_death: data.cause_of_death, manner_of_death: data.manner_of_death, completed_at: data.completed_at },
                    timestamp: new Date().toISOString(),
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000)
                }
            };

            try {
                await axios.post(`${socketioServiceUrl}/emit/postmortem-completed`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
            } catch (error) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    try {
                        await axios.post(`http://localhost:5018/emit/postmortem-completed`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
                    } catch (fallbackError) { /* Ignore fallback error */ }
                }
            }
        }
    } catch (error) {
        console.error('[POSTMORTEM] Socket emit error:', error);
    }
};

export const getPostmortemByDeceasedId = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) return res.status(400).json({ success: false, message: 'deceased_id and tenant are required' });

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        const selectQuery = `
            SELECT 
                id, deceased_id, status, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
                toxicology_findings, custom_findings, signature, report_pdf_url, created_at, updated_at,
                requested_by, requested_at
            FROM postmortem WHERE deceased_id = ?
        `;

        const records = await safeTenantQuery(dbName, selectQuery, [deceased_id]);
        if (!records || (records as any[]).length === 0) return res.status(404).json({ success: false, message: 'Postmortem record not found' });

        const postmortem = (records as any[])[0];
        if (postmortem.findings && typeof postmortem.findings === 'string') {
            try { postmortem.findings = JSON.parse(postmortem.findings); } catch (e) { /* Keep as is */ }
        }

        return res.status(200).json({ success: true, message: 'Postmortem record fetched successfully', data: postmortem });
    } catch (error: any) {
        console.error(' Error in getPostmortemByDeceasedId:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updatePostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) return res.status(400).json({ success: false, message: 'id and tenant are required' });

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        const updates = req.body;
        const allowedFields = [
            'pathologist_name', 'external_pathologist_name', 'external_pathologist_mobile', 'external_pathologist_id',
            'examination_summary', 'cause_of_death', 'immediate_cause_of_death', 'underlying_cause_of_death',
            'contributing_conditions', 'manner_of_death', 'requesting_authority', 'findings', 'report_pdf_url',
            'signature'
        ];

        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                // Signatures are normalised to pure ink-blue (#0f33e7) so the stored value
                // always renders consistently in UI + PDF — same as the other pipelines.

                const value = field === 'findings' && typeof updates[field] === 'object'
                    ? JSON.stringify(updates[field])
                    : field === 'signature' && typeof updates[field] === 'string' && updates[field].startsWith('data:image')
                        ? await normalizeSignatureToInkBlue(updates[field])
                        : updates[field];
                values.push(value);
            }
        }

        if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

        fields.push('updated_at = ?');
        values.push(nowNairobi());
        values.push(id);

        const updateQuery = `UPDATE postmortem SET ${fields.join(', ')} WHERE id = ?`;
        await safeTenantExecute(dbName, updateQuery, values);

        return res.status(200).json({ success: true, message: 'Postmortem record updated successfully' });
    } catch (error: any) {
        console.error('Error in updatePostmortem:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Generate postmortem PDF - Sleek 3-Column Design with Dynamic One-Page Fit
 */
export const generatePostmortemPDF = async (req: TenantRequest, res: Response): Promise<void> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) {
        res.status(400).json({ success: false, message: 'deceased_id and tenant are required' });
        return;
    }

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
            return;
        }

        const postmortemQuery = `
            SELECT immediate_cause_of_death, underlying_cause_of_death, contributing_conditions, manner_of_death, 
                   examination_summary, external_pathologist_name, pathologist_name, external_pathologist_id, cause_of_death,
                   head_findings, chest_findings, abdomen_findings, extremities_findings, toxicology_findings
            FROM postmortem WHERE deceased_id = ?
        `;
        const postmortemResults = await safeTenantQuery(dbName, postmortemQuery, [deceased_id]);
        if (!postmortemResults || (postmortemResults as any[]).length === 0) {
            res.status(404).json({ success: false, message: 'Postmortem record not found' });
            return;
        }

        const postmortem = (postmortemResults as any[])[0];

        const deceasedQuery = `
            SELECT full_name, date_of_death, signature, admission_number, date_of_birth, age, gender, place_of_death, national_id
            FROM deceased WHERE deceased_id = ?
        `;
        const deceasedResults = await safeTenantQuery(dbName, deceasedQuery, [deceased_id]);
        const deceased = deceasedResults && (deceasedResults as any[]).length > 0 ? (deceasedResults as any[])[0] : null;

        const nextOfKinQuery = `SELECT full_name, relationship, contact FROM next_of_kin WHERE deceased_id = ? AND is_primary = 1 AND is_deleted = 0 LIMIT 1`;
        const nextOfKinResults = await safeTenantQuery(dbName, nextOfKinQuery, [deceased_id]);
        const nextOfKin = nextOfKinResults && (nextOfKinResults as any[]).length > 0 ? (nextOfKinResults as any[])[0] : null;

        const facilityName = formatFacilityName(tenantSlug);
        const reportDate = DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd');
        const reportRef = `ME-${deceased_id}-${DateTime.now().toFormat('yyyyMMdd')}`;
        const fullTimestamp = DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd hh:mm:ss a');

        const examinerName = postmortem.external_pathologist_name || postmortem.pathologist_name || 'Not specified';
        const examinerTitle = postmortem.external_pathologist_id ? 'M.D., Forensic Pathologist' : 'Medical Examiner';

        const fullName = deceased?.full_name || 'Unknown';
        const admissionNumber = deceased?.admission_number || 'N/A';
        const dateOfBirth = deceased?.date_of_birth ? new Date(deceased.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const age = deceased?.age || 'N/A';
        const gender = deceased?.gender || 'N/A';
        const dateOfDeath = deceased?.date_of_death ? new Date(deceased.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const placeOfDeath = deceased?.place_of_death || 'N/A';
        const nationalId = deceased?.national_id || 'N/A';
        const kinName = nextOfKin?.full_name || 'N/A';
        const kinRelationship = nextOfKin?.relationship || 'N/A';

        // Combine all available findings/narratives into one text block
        let narrativeText = '';
        if (postmortem.examination_summary) narrativeText += `${postmortem.examination_summary}\n\n`;
        if (postmortem.head_findings) narrativeText += `Head Findings:\n${postmortem.head_findings}\n\n`;
        if (postmortem.chest_findings) narrativeText += `Chest Findings:\n${postmortem.chest_findings}\n\n`;
        if (postmortem.abdomen_findings) narrativeText += `Abdomen Findings:\n${postmortem.abdomen_findings}\n\n`;
        if (postmortem.extremities_findings) narrativeText += `Extremities Findings:\n${postmortem.extremities_findings}\n\n`;
        if (postmortem.toxicology_findings) narrativeText += `Toxicology Findings:\n${postmortem.toxicology_findings}\n\n`;
        narrativeText = narrativeText.trim();

        let signatureBuffer: Buffer | null = null;
        // Embed the EXAMINER's signature captured on the postmortem form
        // (postmortem.signature, saved from signature_base64). The deceased's
        // own signature is the next-of-kin ADMISSION signature — only a fallback.
        const signaturePath =
            postmortem?.signature ||
            postmortem?.pathologist_signature ||
            deceased?.pathologist_signature ||
            deceased?.signature;
        if (signaturePath && typeof signaturePath === 'string') {
            try {
                if (signaturePath.startsWith('data:image')) {
                    const base64Data = signaturePath.split(',')[1];
                    signatureBuffer = Buffer.from(base64Data, 'base64');
                } else if (signaturePath.startsWith('/uploads/')) {
                    // Read directly from the ONE shared uploads folder
                    // (/opt/storage/uploads) — there is no separate uploads-service.
                    const uploadsBase = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
                    const relativePath = signaturePath.replace(/^\/uploads\//, '');
                    const fsPath = path.join(uploadsBase, relativePath);
                    if (fs.existsSync(fsPath)) signatureBuffer = fs.readFileSync(fsPath);
                } else if (signaturePath.startsWith('http')) {
                    const axios = require('axios');
                    const response = await axios.get(signaturePath, { responseType: 'arraybuffer', timeout: 10000 });
                    signatureBuffer = Buffer.from(response.data);
                } else {
                    const relativePath = signaturePath.replace(/^\/uploads\//, '');
                    const uploadsBase = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
                    const fsPath = path.join(uploadsBase, relativePath);
                    if (fs.existsSync(fsPath)) signatureBuffer = fs.readFileSync(fsPath);
                }
            } catch (sigError) {
                console.warn(`[PDF] Failed to load signature:`, sigError);
            }
        }

        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 0,
            info: { Title: 'Official Autopsy Report', Author: facilityName, Subject: 'Autopsy Report' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="autopsy-${deceased_id}.pdf"`);
        doc.pipe(res);

        // ─── LAYOUT CONSTANTS ──
        const PAGE_WIDTH = doc.page.width;   // 612
        const PAGE_HEIGHT = doc.page.height; // 792
        const MARGIN = 40;
        const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 532

        // ─── HELPER FUNCTIONS ───
        // Unified palette: ink text, slate muted labels, brand-teal accents.
        const INK = '#111827';
        const MUTED = '#6B7280';
        const BRAND = '#0F3040';
        const HAIRLINE = '#E5E7EB';

        const drawDataField = (label: string, value: string, x: number, y: number, width: number, isLarge: boolean = false) => {
            doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5).text(String(label).toUpperCase(), x, y, { width: width, characterSpacing: 0.5 });
            doc.fillColor(INK).font(isLarge ? 'Times-Bold' : 'Helvetica-Bold').fontSize(isLarge ? 11.5 : 9).text(value || 'N/A', x, y + 10, { width: width });
        };

        const drawSectionHead = (num: string, title: string, yPos: number) => {
            // Sleek section label: brand accent tick + spaced caps + hairline rule.
            doc.rect(MARGIN, yPos + 2, 3, 11).fillColor(BRAND).fill();
            doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(8.5)
                .text(`${num}   ${String(title).toUpperCase()}`, MARGIN + 10, yPos, { characterSpacing: 1.2 });
            doc.moveTo(MARGIN, yPos + 17).lineTo(PAGE_WIDTH - MARGIN, yPos + 17)
                .strokeColor(HAIRLINE).lineWidth(0.75).stroke();
            return yPos + 27;
        };

        // ─── 1. SUBTLE WATERMARK ───
        doc.save();
        doc.translate(PAGE_WIDTH / 2, PAGE_HEIGHT / 2);
        doc.rotate(-32);
        doc.fillOpacity(0.03).fillColor(BRAND).font('Helvetica-Bold').fontSize(64)
            .text('OFFICIAL RECORD', -240, -30, { align: 'center', width: 480 });
        doc.restore();

        // ─── 2. CLEAN CENTERED LETTERHEAD (no top bar, no barcode) ───
        let y = 36;
        doc.fillColor(INK).font('Times-Bold').fontSize(16).text(facilityName, MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });
        doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
            .text('Forensic & Mortuary Services  ·  Nairobi, Kenya', MARGIN, y + 21, { width: CONTENT_WIDTH, align: 'center' });

        y += 40;
        doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(12).text('AUTOPSY REPORT', MARGIN, y, { width: CONTENT_WIDTH, align: 'center', characterSpacing: 3 });
        y += 18;
        doc.fillColor(MUTED).font('Courier').fontSize(7)
            .text(`File ID ${reportRef}   ·   Issued ${reportDate}`, MARGIN, y, { width: CONTENT_WIDTH, align: 'center' });

        y += 14;
        doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(HAIRLINE).lineWidth(1).stroke();
        y += 16;

        // ─── 3. SECTION 01: DECEDENT INFORMATION ───
        y = drawSectionHead('01', 'DECEDENT INFORMATION', y);

        const colW = CONTENT_WIDTH / 3;
        drawDataField('Full Name', fullName, MARGIN, y, colW, true);
        drawDataField('Admission Number', admissionNumber, MARGIN + colW, y, colW);
        drawDataField('Age', `${age} Years`, MARGIN + colW * 2, y, colW);
        y += 28;
        drawDataField('Gender', gender, MARGIN, y, colW);
        drawDataField('Date of Birth', dateOfBirth, MARGIN + colW, y, colW);
        drawDataField('Date of Death', dateOfDeath, MARGIN + colW * 2, y, colW);
        y += 28;
        drawDataField('Place of Death', placeOfDeath, MARGIN, y, colW);
        drawDataField('National ID', nationalId, MARGIN + colW, y, colW);
        drawDataField('Next of Kin', kinName, MARGIN + colW * 2, y, colW);
        y += 28;
        drawDataField('Relationship', kinRelationship, MARGIN, y, colW);
        y += 30;

        // ─── 4. SECTION 02: OFFICIAL DETERMINATION OF DEATH (conditional) ───
        const hasDeterminationData = postmortem.immediate_cause_of_death || postmortem.underlying_cause_of_death || postmortem.contributing_conditions;

        if (hasDeterminationData) {
            y = drawSectionHead('02', 'OFFICIAL DETERMINATION OF DEATH', y);

            const causeBlockHeight = 96;
            doc.rect(MARGIN, y + 2, 3, causeBlockHeight - 12).fillColor(BRAND).fill();
            const textX = MARGIN + 15;

            drawDataField('Immediate Cause of Death', postmortem.immediate_cause_of_death || 'N/A', textX, y, CONTENT_WIDTH - 30, true);
            doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(7).text('Due to (or as a consequence of):', textX, y + 33);
            drawDataField('Underlying Cause of Death', postmortem.underlying_cause_of_death || 'N/A', textX, y + 46, CONTENT_WIDTH - 30, true);
            drawDataField('Contributing Conditions', postmortem.contributing_conditions || 'None identified', textX, y + 78, CONTENT_WIDTH - 30);

            // Manner of Death badge
            y += causeBlockHeight + 6;
            drawDataField('Manner of Death', '', MARGIN, y, 120);
            const mannerOfDeath = postmortem.manner_of_death || 'Natural';
            doc.roundedRect(MARGIN, y + 12, 110, 18, 4).fillColor('#E8EEF0').fill();
            doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(9).text(mannerOfDeath.toUpperCase(), MARGIN, y + 18, { width: 110, align: 'center', characterSpacing: 1 });
            y += 40;
        }

        // ─── 5. SECTION 03: PATHOLOGIST STATEMENT (conditional, auto-fit) ───
        if (narrativeText) {
            y = drawSectionHead('03', 'PATHOLOGIST STATEMENT & EXAMINATION FINDINGS', y);

            const SIG_SECTION_Y = 560; // Y reserved for the certification block
            let availableHeight = SIG_SECTION_Y - y - 8;
            if (availableHeight < 50) availableHeight = 50;

            let nFont = 9.5;
            doc.font('Times-Roman').fontSize(nFont);
            let nHeight = doc.heightOfString(narrativeText, { width: CONTENT_WIDTH, lineGap: 2.5 });

            while (nHeight > availableHeight && nFont > 6) {
                nFont -= 0.5;
                doc.font('Times-Roman').fontSize(nFont);
                nHeight = doc.heightOfString(narrativeText, { width: CONTENT_WIDTH, lineGap: 2.5 });
            }

            doc.fillColor(INK).font('Times-Roman').fontSize(nFont)
                .text(narrativeText, MARGIN, y, { width: CONTENT_WIDTH, lineGap: 2.5, height: availableHeight, ellipsis: true });
            y += nHeight + 8;
        }

        // ─── 6. SECTION 04: VERIFICATION & CERTIFICATION ───
        // Anchor the certification block so it never collides with the footer.
        y = Math.max(y, 560);
        y = drawSectionHead('04', 'VERIFICATION & CERTIFICATION', y);

        const sigBoxY = y + 8;
        const sigBoxHeight = 44;
        const sigWidth = 250;

        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5).text('CERTIFIED BY - FORENSIC PATHOLOGIST', MARGIN, sigBoxY, { characterSpacing: 0.5 });

        const sigImgY = sigBoxY + 12;
        if (signatureBuffer) {
            try {
                // Force ink-blue so the signature always renders as pure #0f33e7.
                const inkSigBuffer = await toInkBlueBuffer(signatureBuffer);
                doc.image(inkSigBuffer, MARGIN, sigImgY, { fit: [210, 34] });
            } catch (err) {
                doc.fillColor('#0f33e7').font('Times-Italic').fontSize(17).text(examinerName, MARGIN, sigImgY, { width: sigWidth });
            }
        } else {
            doc.fillColor('#0f33e7').font('Times-Italic').fontSize(17).text(examinerName, MARGIN, sigImgY, { width: sigWidth });
        }

        const sigLineY = sigBoxY + sigBoxHeight;
        doc.moveTo(MARGIN, sigLineY).lineTo(MARGIN + sigWidth, sigLineY).strokeColor(INK).lineWidth(0.9).stroke();
        doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5).text('NAME & CREDENTIALS', MARGIN, sigLineY + 5, { characterSpacing: 0.5 });
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(`${examinerName}, ${examinerTitle}`, MARGIN, sigLineY + 16);

        // Official stamp (right side, aligned with the signature block)
        const stampRadius = 38;
        const stampX = PAGE_WIDTH - MARGIN - 70;
        const stampY = sigLineY - 15;

        try {
            renderStampOnPDFKit(doc, {
                stampName: 'Medical Examiner',
                funeralHomeName: facilityName,
                bottomText: 'OFFICIAL RECORD',
                centerLabel: 'CERTIFIED',
                subtitle: 'Medical Examiner',
                date: new Date(),
                style: 'medical-examiner',
                ring: { outerColor: '#0f33e7', innerColor: '#0f33e7', innerOffset: 8 },
                outerText: { color: '#0f33e7', fontSize: 8, letterSpacing: 1 },
                bottomTextStyle: { color: '#0f33e7', fontSize: 5, letterSpacing: 1 },
                centerLabelStyle: { color: '#0f33e7', fontSize: 9, letterSpacing: 1 },
            }, {
                x: stampX,
                y: stampY,
                radius: stampRadius,
                rotation: -12,
                drawName: true,
                name: examinerName,
                color: '#0f33e7',
            });
        } catch (stampErr) {
            console.error('[PDF] Stamp rendering failed', stampErr);
        }

        // ─── 7. SLIM FOOTER (no barcode, no heavy bars) ───
        const footerLineY = 742;
        doc.moveTo(MARGIN, footerLineY).lineTo(PAGE_WIDTH - MARGIN, footerLineY).strokeColor(HAIRLINE).lineWidth(0.75).stroke();
        doc.fillColor(MUTED).font('Helvetica').fontSize(7)
            .text(`Generated ${reportDate} at ${fullTimestamp}  ·  RestPoint Mortuary Management System`, MARGIN, footerLineY + 8);
        doc.fillColor(MUTED).font('Courier').fontSize(7).text(`File ID: ${reportRef}`, MARGIN, footerLineY + 19);

        // Thin brand accent at the very bottom edge
        doc.rect(0, PAGE_HEIGHT - 3, PAGE_WIDTH, 3).fillColor(BRAND).fill();

        doc.end();

        // ─── SOCKET EMIT LOGIC ──
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            const axios = require('axios');
            const notificationPayload = {
                tenantSlug,
                data: {
                    id: `autopsy-pdf-${deceased_id}-${Date.now()}`, deceasedId: deceased_id, deceasedName: fullName, reportRef: reportRef,
                    title: 'Autopsy PDF Generated', message: `Autopsy report PDF has been generated for ${fullName} (${deceased_id})`,
                    type: 'autopsy_pdf_generated', priority: 'high',
                    fullContent: `Autopsy Report PDF Generated\nDeceased ID: ${deceased_id}\nName: ${fullName}\nReport Reference: ${reportRef}\nPathologist: ${examinerName}\nCause of Death: ${postmortem.cause_of_death || 'Pending'}\nGenerated: ${fullTimestamp}`,
                    data: {
                        deceased_id: deceased_id, deceased_name: fullName, report_ref: reportRef, pathologist: examinerName,
                        cause_of_death: postmortem.cause_of_death, manner_of_death: postmortem.manner_of_death, generated_at: fullTimestamp
                    },
                    timestamp: new Date().toISOString(),
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000)
                }
            };

            await axios.post(`${socketioServiceUrl}/emit/autopsy-pdf-generated`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
        } catch (emitError: any) {
            console.warn("[PDF] Failed to emit pdf generated event", emitError.message);
        }

    } catch (error: any) {
        console.error('Error in generatePostmortemPDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
};