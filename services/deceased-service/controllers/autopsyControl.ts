import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import { renderStampOnPDFKit } from '../../../packages/shared-stamps/dist/index';
import Logger from '../../../packages/shared-logger/src/index';
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
        const { deceased_id, reason, requested_by } = req.body;
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
                id, deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
                toxicology_findings, custom_findings, report_pdf_url, created_at, updated_at
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
            'contributing_conditions', 'manner_of_death', 'requesting_authority', 'findings', 'report_pdf_url'
        ];

        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(field === 'findings' && typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
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

        // ─── HELPER FUNCTIONS ──
        const drawBarcode = (x: number, y: number, text: string, maxWidth: number = 150) => {
            let currentX = x;
            const barHeight = 25;
            doc.save();
            for (let i = 0; i < text.length; i++) {
                const code = text.charCodeAt(i);
                const barWidth = (code % 3) + 1;
                const spaceWidth = ((code >> 2) % 2) + 1;
                doc.rect(currentX, y, barWidth, barHeight).fillColor('#03071E').fill();
                currentX += barWidth + spaceWidth;
                if (currentX > x + maxWidth) break;
            }
            doc.restore();
        };

        const drawDataField = (label: string, value: string, x: number, y: number, width: number, isLarge: boolean = false) => {
            doc.fillColor('#8B7355').font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), x, y, { width: width });
            doc.fillColor('#03071E').font(isLarge ? 'Times-Bold' : 'Helvetica-Bold').fontSize(isLarge ? 11 : 9).text(value || 'N/A', x, y + 10, { width: width });
        };

        const drawSectionHead = (num: string, title: string, yPos: number) => {
            doc.fillColor('#03071E').rect(MARGIN, yPos, CONTENT_WIDTH, 20).fill();
            doc.fillColor('#A9A9A9').font('Courier').fontSize(8).text(num, MARGIN + 10, yPos + 5);
            doc.fillColor('#FAF8F4').font('Helvetica-Bold').fontSize(8).text(title, MARGIN + 25, yPos + 5);
            return yPos + 30; // Return next Y position
        };

        // ─── 1. WATERMARK ──
        doc.save();
        doc.translate(PAGE_WIDTH / 2, PAGE_HEIGHT / 2);
        doc.rotate(-35);
        doc.fillOpacity(0.025).fillColor('#03071E').font('Helvetica-Bold').fontSize(80).text('OFFICIAL RECORD', -250, -40, { align: 'center', width: 500 });
        doc.restore();

        let y = 35;

        // ─── 2. LETTERHEAD ──
        doc.rect(0, 0, PAGE_WIDTH, 4).fillColor('#3D4F47').fill(); // Top Border

        // Facility Info
        doc.fillColor('#03071E').font('Times-Bold').fontSize(15).text(facilityName, MARGIN, y);
        doc.fillColor('#6B6862').font('Helvetica').fontSize(8).text('1234 Memorial Drive, Suite 500, Metro City, ST 12345, Kenya', MARGIN, y + 18);
        doc.text('Phone: (555) 123-4567', MARGIN, y + 30);

        // Right Header
        const rightX = PAGE_WIDTH - MARGIN - 150;
        doc.fillColor('#3D4F47').font('Courier-Bold').fontSize(8).text('AUTOPSY REPORT', rightX, y, { width: 150, align: 'right' });
        drawBarcode(rightX, y + 15, reportRef, 150);
        doc.fillColor('#6B6862').font('Courier').fontSize(7).text('File ID: ' + reportRef, rightX, y + 45, { width: 150, align: 'right' });

        // Bottom Border for Letterhead (Pushed down to avoid overlap)
        y += 75;
        doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#E3DDD0').lineWidth(1).stroke();
        y += 20;

        // ─── 3. SECTION 01: DECEDENT INFORMATION ──
        y = drawSectionHead('01', 'DECEDENT INFORMATION', y);

        const colW = CONTENT_WIDTH / 3;
        // Row 1
        drawDataField('Full Name', fullName, MARGIN, y, colW, true);
        drawDataField('Admission Number', admissionNumber, MARGIN + colW, y, colW);
        drawDataField('Age', `${age} Years`, MARGIN + colW * 2, y, colW);
        y += 30;
        // Row 2
        drawDataField('Gender', gender, MARGIN, y, colW);
        drawDataField('Date of Death', dateOfDeath, MARGIN + colW, y, colW);
        drawDataField('Place of Death', placeOfDeath, MARGIN + colW * 2, y, colW);
        y += 30;
        // Row 3
        drawDataField('National ID', nationalId, MARGIN, y, colW);
        drawDataField('Next of Kin', kinName, MARGIN + colW, y, colW);
        drawDataField('Relationship', kinRelationship, MARGIN + colW * 2, y, colW);
        y += 40;

        // ─── 4. SECTION 02: OFFICIAL DETERMINATION OF DEATH (Conditional) ──
        const hasDeterminationData = postmortem.immediate_cause_of_death || postmortem.underlying_cause_of_death || postmortem.contributing_conditions;

        if (hasDeterminationData) {
            y = drawSectionHead('02', 'OFFICIAL DETERMINATION OF DEATH', y);

            // Left Verdigris Border
            const causeBlockHeight = 100;
            doc.rect(MARGIN, y, 3, causeBlockHeight).fillColor('#3D4F47').fill();
            const textX = MARGIN + 15;

            drawDataField('Immediate Cause of Death', postmortem.immediate_cause_of_death || 'N/A', textX, y, CONTENT_WIDTH - 30, true);
            doc.fillColor('#6B6862').font('Courier').fontSize(7).text('↓ Due to (or as a consequence of)', textX, y + 35);
            drawDataField('Underlying Cause of Death', postmortem.underlying_cause_of_death || 'N/A', textX, y + 50, CONTENT_WIDTH - 30, true);
            drawDataField('Contributing Conditions', postmortem.contributing_conditions || 'None identified', textX, y + 85, CONTENT_WIDTH - 30);

            // Manner of Death Badge
            y += causeBlockHeight + 10;
            drawDataField('Manner of Death', '', MARGIN, y, 100);
            const mannerOfDeath = postmortem.manner_of_death || 'Natural';
            doc.fillColor('#EBEFEF').rect(MARGIN, y + 12, 80, 16).fill();
            doc.fillColor('#2E3F37').font('Helvetica-Bold').fontSize(9).text(mannerOfDeath.toUpperCase(), MARGIN, y + 16, { width: 80, align: 'center' });
            y += 35;
        }

        // ─── 5. SECTION 03: PATHOLOGIST STATEMENT (Conditional & Dynamic Sizing) ──
        if (narrativeText) {
            y = drawSectionHead('03', 'PATHOLOGIST STATEMENT & EXAMINATION SUMMARY', y);
            doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#E3DDD0').lineWidth(1).stroke();
            y += 10;

            // Dynamic Font Sizing to force exactly 1 page fit
            const SIG_SECTION_Y = 560; // Reserved Y position for signature block
            let availableHeight = SIG_SECTION_Y - y - 10;
            if (availableHeight < 50) availableHeight = 50; // Min height fallback

            let nFont = 10;
            // Set font and size on doc BEFORE measuring height to fix TS2353 error
            doc.font('Times-Roman').fontSize(nFont);
            let nHeight = doc.heightOfString(narrativeText, { width: CONTENT_WIDTH, lineGap: 3 });

            // Shrink font size if text is too long for the available space on the page
            while (nHeight > availableHeight && nFont > 6) {
                nFont -= 0.5;
                doc.font('Times-Roman').fontSize(nFont);
                nHeight = doc.heightOfString(narrativeText, { width: CONTENT_WIDTH, lineGap: 3 });
            }

            doc.fillColor('#03071E').font('Times-Roman').fontSize(nFont).text(narrativeText, MARGIN, y, { width: CONTENT_WIDTH, lineGap: 3, height: availableHeight, ellipsis: true });
            y += nHeight + 10;

            doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#E3DDD0').lineWidth(1).stroke();
            y += 20;
        }

        // ─── 6. SECTION 04: VERIFICATION & CERTIFICATION ──
        // Enforce minimum Y so signatures stay anchored cleanly near the bottom without overlapping footer
        y = Math.max(y, 560);
        y = drawSectionHead('04', 'VERIFICATION & CERTIFICATION', y);

        // Layout Configuration
        const sigBoxY = y + 10;
        const sigBoxHeight = 40;
        const sigWidth = 250;

        // Left Side: Signature & Line
        doc.fillColor('#8B7355').font('Helvetica-Bold').fontSize(7).text('CERTIFIED BY — FORENSIC PATHOLOGIST', MARGIN, sigBoxY);

        // Draw Signature (or placeholder text)
        const sigImgY = sigBoxY + 12;
        if (signatureBuffer) {
            try {
                // Force ink-blue normalization so the signature always renders
                // as pure #0f33e7 on the PDF, even for signatures saved before
                // normalization was introduced.
                const inkSigBuffer = await toInkBlueBuffer(signatureBuffer);
                // Constrained to 200x40 to prevent overlapping the stamp
                doc.image(inkSigBuffer, MARGIN, sigImgY, { fit: [200, 35] });
            } catch (err) {
                doc.fillColor('#0f33e7').font('Times-Italic').fontSize(18).text(examinerName, MARGIN, sigImgY, { width: sigWidth });
            }
        } else {
            doc.fillColor('#0f33e7').font('Times-Italic').fontSize(18).text(examinerName, MARGIN, sigImgY, { width: sigWidth });
        }

        // Signature Line
        const sigLineY = sigBoxY + sigBoxHeight;
        doc.moveTo(MARGIN, sigLineY).lineTo(MARGIN + sigWidth, sigLineY).strokeColor('#03071E').lineWidth(1).stroke();

        // Credentials below line
        doc.fillColor('#8B7355').font('Helvetica-Bold').fontSize(7).text('NAME & CREDENTIALS', MARGIN, sigLineY + 5);
        doc.fillColor('#03071E').font('Helvetica-Bold').fontSize(9).text(`${examinerName}, ${examinerTitle}`, MARGIN, sigLineY + 17);

        // Right Side: Official Stamp
        const stampRadius = 38; // Slightly smaller to ensure it clears footer perfectly
        const stampX = PAGE_WIDTH - MARGIN - 70;
        // Vertically align stamp to sit nicely next to the signature block
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
                rotation: -12, // Sleek tilt
                drawName: true,
                name: examinerName,
                color: '#0f33e7',
            });
        } catch (stampErr) {
            console.error("[PDF] Stamp rendering failed", stampErr);
        }

        // ─── 7. FOOTER ──
        // Pushed down further to ensure no overlap with the signature credentials above
        const footerLineY = 725;
        doc.moveTo(MARGIN, footerLineY).lineTo(PAGE_WIDTH - MARGIN, footerLineY).strokeColor('#E3DDD0').lineWidth(1).stroke();

        doc.fillColor('#6B6862').font('Courier').fontSize(7).text(`RestPoint Mortuary Generated ${reportDate} at ${fullTimestamp}`, MARGIN, footerLineY + 10);
        doc.text('— Official Autopsy Report —', MARGIN, footerLineY + 20);

        drawBarcode(PAGE_WIDTH - MARGIN - 150, footerLineY + 10, reportRef, 150);
        doc.fillColor('#6B6862').font('Courier').fontSize(7).text('File ID: ' + reportRef, PAGE_WIDTH - MARGIN - 150, footerLineY + 40, { width: 150, align: 'right' });

        // Thick Bottom Border
        doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 15).fillColor('#03071E').fill();

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