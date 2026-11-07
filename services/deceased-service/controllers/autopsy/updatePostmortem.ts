

import { Request, Response } from 'express';
import { resolveDatabase, safeTenantExecute, safeTenantQuery } from '../../../../shared/dbConfig';
import { getKenyaTimeISO } from '../../../../packages/shared-utils/dist/timestamps';
import Logger from '../../../../packages/shared-logger/src/index';
import { emitPostmortemUpdate, normalizeSignatureToInkBlue, syncPostmortemCompletion } from './autopsyControl';

interface TenantRequest extends Request { tenantSlug?: string }

export const updatePostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) return res.status(400).json({ success: false, message: 'id and tenant are required' });

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });


        const updates = req.body;
        // `status` and completed_at
        const allowedFields = [
            'pathologist_name', 'external_pathologist_name', 'external_pathologist_mobile', 'external_pathologist_id',
            'examination_summary', 'cause_of_death', 'immediate_cause_of_death', 'underlying_cause_of_death',
            'contributing_conditions', 'manner_of_death', 'requesting_authority', 'findings', 'report_pdf_url',
            'signature', 'status', 'completed_at'];

        const VALID_STATUSES = ['pending', 'in_progress', 'completed'];
        const requestedStatus = updates.status !== undefined ? String(updates.status).trim().toLowerCase() : null;
        if (requestedStatus !== null && !VALID_STATUSES.includes(requestedStatus)) {
            return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const now = getKenyaTimeISO();
        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] === undefined) continue;
            // completed_at is stamped below so the transition itself dates the row.
            if (field === 'completed_at' && requestedStatus === 'completed') continue;
            fields.push(`${field} = ?`);
            const value = field === 'findings' && typeof updates[field] === 'object'
                ? JSON.stringify(updates[field])
                : field === 'signature' && typeof updates[field] === 'string' && updates[field].startsWith('data:image')
                    ? await normalizeSignatureToInkBlue(updates[field])
                    : updates[field];
            values.push(value);
        }

        if (requestedStatus === 'completed') {
            fields.push('completed_at = COALESCE(completed_at, ?)');
            values.push(now);
        }

        if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        const updateQuery = `UPDATE postmortem SET ${fields.join(', ')} WHERE id = ?`;
        await safeTenantExecute(dbName, updateQuery, values);

        // Keep the surrounding records in step with the new state, otherwise the
        // timeline / dashboard / analytics keep reporting the old one.
        if (requestedStatus) {
            const owner: any[] = (await safeTenantQuery(dbName, 'SELECT deceased_id FROM postmortem WHERE id = ?', [id])) || [];
            const deceasedId = owner[0]?.deceased_id;
            if (deceasedId) {
                await syncPostmortemCompletion(dbName, deceasedId, now, requestedStatus === 'completed');
                emitPostmortemUpdate(tenantSlug, deceasedId, { status: requestedStatus, completed_at: requestedStatus === 'completed' ? now : null });
            }
        }

        return res.status(200).json({ success: true, message: 'Postmortem record updated successfully' });
    } catch (error: any) {

        Logger.error({
            messsage: "   AN   eroor   Occured   while  updating  postmortem",
            error: error.message
        })

        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
