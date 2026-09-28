import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import {
    getAllDeceased, getDeceasedById, updateDeceased, deleteDeceased,
} from '../controllers/deceasedControl';

import { Router, Request, Response } from 'express';


import { registerNewDeceased } from '../controllers/registerDeceased'
import { getAdmissionNumber } from '../utils/admissionNumberRoute'
import {
    requestPostmortem,
    savePostmortem,
    getPostmortemByDeceasedId,
    updatePostmortem,
    generatePostmortemPDF
} from '../controllers/autopsyControl';

import { updateDeceasedStatus } from '../controllers/deceasedControl';
import { getPostmortemRequests, getPostmortemStats } from '../controllers/postmortemRequestControl';
import { exportExcelWithCharts, checkExportStatus, getExportHistory } from '../controllers/exportExcelController';
import { resolveDatabase, safeTenantQuery, safeTenantExecute } from '../../../shared/dbConfig';
import { tableColumns, pickAs } from '../utils/tenantSchema';

const router = Router();

// ─── Tenant schema introspection ────────────────────────────────────────────
// `tableColumns` / `pickAs` live in utils/tenantSchema so the public search and
// the postmortem PDF generator share one implementation — see that file for why
// tenant schemas diverge.

// Public postmortem portal - no authentication required
const handlePublicPostmortemSearch = async (req: Request, res: Response) => {
    try {
        const { phone, id_number, admission_number, deceased_id } = req.query;
        const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['x-slug'] as string || 'system_shared';

        if (!phone && !id_number && !admission_number && !deceased_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone, id_number, admission_number, or deceased_id'
            });
        }

        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        // ── Schema-adaptive projection ──────────────────────────────────────
        // See tableColumns() above: a tenant provisioned before a column existed
        // must still answer the lookup instead of raising ER_BAD_FIELD_ERROR.
        const dCols = await tableColumns(dbName, 'deceased');
        const notFound = () => res.status(404).json({ success: false, message: 'No record found' });

        if (dCols.size === 0) {
            return notFound();
        }

        // Columns the public portal contract promises. The frontend
        // (PostmortemRequestForm / PostmortemResultsPage) reads these by name,
        // so a tenant missing one still gets the key — just null.
        const DECEASED_COLS = [
            'deceased_id', 'full_name', 'date_of_death', 'admission_number',
            'date_of_birth', 'age', 'gender', 'place_of_death', 'national_id',
            'phone_number', 'signature',
        ];

        // Search by deceased_id, admission number, phone, or ID
        let query = `SELECT ${DECEASED_COLS.map((c) => pickAs(dCols, c, c)).join(', ')} FROM deceased WHERE 1=1`;
        const params: any[] = [];

        if (deceased_id) {
            if (!dCols.has('deceased_id')) return notFound();
            query += ' AND deceased_id = ?';
            params.push(deceased_id);
        } else if (admission_number) {
            if (!dCols.has('admission_number')) return notFound();
            query += ' AND admission_number = ?';
            params.push(admission_number);
        } else if (phone) {
            // Search in deceased table first. Only match on the phone columns
            // this tenant actually has.
            const phoneCols = ['phone_number', 'alternative_phone'].filter((c) => dCols.has(c));
            if (phoneCols.length === 0) {
                // This tenant keeps no phone on `deceased` at all. The only place
                // the number can still match is next_of_kin.contact, so return no
                // rows here and let the next-of-kin fallback below run. (Dropping
                // the filter instead would return an arbitrary record.)
                query += ' AND 1=0';
            } else {
                query += ` AND (${phoneCols.map((c) => `${c} LIKE ?`).join(' OR ')})`;
                phoneCols.forEach(() => params.push(`%${phone}%`));
            }
        } else if (id_number) {
            if (!dCols.has('national_id')) return notFound();
            query += ' AND national_id = ?';
            params.push(id_number);
        }

        query += ' LIMIT 1';
        let records = await safeTenantQuery(dbName, query, params);

        // If phone search didn't find in deceased table, try next_of_kin table
        if ((!records || (records as any[]).length === 0) && phone) {
            try {
                const nCols = await tableColumns(dbName, 'next_of_kin');
                // The join needs the join keys plus a column to match the phone on.
                if (nCols.size > 0 && nCols.has('deceased_id') && nCols.has('contact') && dCols.has('deceased_id')) {
                    // Same schema-adaptive projection as the primary query: `d.*`
                    // and `nok.*` are each selected only where they exist.
                    const nokSelect = [
                        ...DECEASED_COLS.map((c) => pickAs(dCols, c, c, 'd.')),
                        pickAs(nCols, 'full_name', 'next_of_kin_name', 'nok.'),
                        pickAs(nCols, 'relationship', 'next_of_kin_relationship', 'nok.'),
                        pickAs(nCols, 'contact', 'next_of_kin_phone', 'nok.'),
                        pickAs(nCols, 'email', 'next_of_kin_email', 'nok.'),
                        pickAs(nCols, 'signature', 'next_of_kin_signature', 'nok.'),
                    ].join(', ');

                    // `is_deleted` is absent on some older tenants — only filter
                    // on it when the column is really there.
                    const notDeleted = nCols.has('is_deleted') ? ' AND nok.is_deleted = FALSE' : '';
                    const nokQuery = `SELECT ${nokSelect}
                        FROM deceased d
                        INNER JOIN next_of_kin nok ON d.deceased_id = nok.deceased_id
                        WHERE nok.contact LIKE ?${notDeleted}
                        LIMIT 1`;
                    const nokRecords = await safeTenantQuery(dbName, nokQuery, [`%${phone}%`]);
                    if (nokRecords && (nokRecords as any[]).length > 0) {
                        records = nokRecords;
                    }
                }
            } catch (e) {
                console.error('[PUBLIC] Next of kin search error:', e);
            }
        }

        if (!records || (records as any[]).length === 0) {
            return notFound();
        }

        const deceased = (records as any[])[0];

        // Get next of kin data if not already joined
        if (!deceased.next_of_kin_name) {
            try {
                const nCols = await tableColumns(dbName, 'next_of_kin');
                if (nCols.size > 0 && nCols.has('deceased_id')) {
                    // `is_primary` / `is_deleted` are absent on older tenants, so
                    // both the filter and the ordering are built conditionally —
                    // otherwise this throws on those schemas and the kin details
                    // are silently dropped from the response.
                    const where = ['deceased_id = ?'];
                    if (nCols.has('is_deleted')) where.push('is_deleted = FALSE');

                    const order = [
                        ...(nCols.has('is_primary') ? ['is_primary DESC'] : []),
                        ...(nCols.has('created_at') ? ['created_at ASC'] : []),
                    ];

                    const nokQuery = `SELECT * FROM next_of_kin WHERE ${where.join(' AND ')}`
                        + (order.length ? ` ORDER BY ${order.join(', ')}` : '')
                        + ' LIMIT 1';
                    const nokRecords = await safeTenantQuery(dbName, nokQuery, [deceased.deceased_id]);
                    if (nokRecords && (nokRecords as any[]).length > 0) {
                        const nok = (nokRecords as any[])[0];
                        deceased.next_of_kin_name = nok.full_name;
                        deceased.next_of_kin_relationship = nok.relationship;
                        deceased.next_of_kin_phone = nok.contact;
                        deceased.next_of_kin_email = nok.email;
                        deceased.next_of_kin_id_number = nok.id_number || null;
                        // Use next of kin signature if deceased doesn't have one
                        if (!deceased.signature && nok.signature) {
                            deceased.signature = nok.signature;
                        }
                    }
                }
            } catch (e) {
                // next_of_kin table might not exist
                console.error('[PUBLIC] Next of kin fetch error:', e);
            }
        }

        // Get postmortem data if exists
        let postmortem = null;
        try {
            const pmQuery = 'SELECT * FROM postmortem WHERE deceased_id = ? LIMIT 1';
            const pmRecords = await safeTenantQuery(dbName, pmQuery, [deceased.deceased_id]);
            if (pmRecords && (pmRecords as any[]).length > 0) {
                postmortem = (pmRecords as any[])[0];
            }
        } catch (e) {
            // Postmortem table might not exist yet
        }

        // Get tenant info
        let tenantInfo = null;
        try {
            const tenantQuery = `SELECT name, address, phone, email FROM tenant_tracking WHERE slug = ? LIMIT 1`;
            const tenantRecords = await safeTenantQuery('tenant_tracking', tenantQuery, [tenantSlug]);
            if (tenantRecords && (tenantRecords as any[]).length > 0) {
                tenantInfo = (tenantRecords as any[])[0];
            }
        } catch (e) {
            // tenant_tracking table might not exist
        }

        return res.status(200).json({
            success: true,
            data: {
                deceased,
                postmortem,
                tenant: tenantInfo
            }
        });
    } catch (error: any) {
        console.error('[PUBLIC] Postmortem search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
};

// Register both route patterns (with and without /deceased prefix for gateway compatibility)
router.get('/public/postmortem/search', handlePublicPostmortemSearch);
router.get('/deceased/public/postmortem/search', handlePublicPostmortemSearch);

// Public postmortem REQUEST — no auth required (family / reception portal)
// Same controller as the authenticated version. The controller itself does not
// check req.user; it only needs x-tenant-slug + body fields.
router.post('/public/postmortem/request', requestPostmortem);
router.post('/deceased/public/postmortem/request', requestPostmortem);

// POST - Update status (for cross-service calls, no auth required)
router.post('/update-status', updateDeceasedStatus);
router.post('/deceased/update-status', updateDeceasedStatus);

// Apply authentication to all other routes
router.use(protect);
router.use(authorizeAny);

// GET - Pre-generate admission number based on gender
router.get('/admission-number/:gender', getAdmissionNumber);
router.get('/admission-number/', getAdmissionNumber);
router.get('/deceased/admission-number/:gender', getAdmissionNumber);   // Support nested path via gateway
router.get('/deceased/admission-number/', getAdmissionNumber);           // Support nested path via gateway

// POST - Register a new deceased
router.post('/register-deceased', registerNewDeceased);
router.post('/deceased/register-deceased', registerNewDeceased);
router.post('/register', registerNewDeceased);
router.post('/', registerNewDeceased);

// GET - All deceased
router.get('/', getAllDeceased);
router.get('/all', getAllDeceased);
router.get('/deceased-all', getAllDeceased);
router.get('/deceased/deceased-all', getAllDeceased);  // Support nested path
router.get('/deceased/all', getAllDeceased);           // Support nested path

// GET - Search deceased (deceasedApi.search uses ?q=). Must be registered BEFORE
// the catch-all /:id and /deceased/:id routes below so it is not swallowed.
router.get('/deceased/search', getAllDeceased);        // gateway: /deceased/search
router.get('/search', getAllDeceased);

// GET - Postmortem request feeds. The gateway forwards the full path INCLUDING the
// '/deceased' service prefix (e.g. /deceased/postmortem-requests), and deceasedRoutes
// catch-alls like /deceased/:id would otherwise swallow them. Register here (still
// behind protect/authorizeAny), before the GET catch-alls.
router.get('/deceased/postmortem-requests/stats', getPostmortemStats);
router.get('/deceased/postmortem-requests', getPostmortemRequests);
router.get('/postmortem-requests/stats', getPostmortemStats);
router.get('/postmortem-requests', getPostmortemRequests);

// POST - Export Excel (must be BEFORE catch-all /:id route)
// The gateway forwards the full path INCLUDING the '/deceased' service prefix
// (e.g. POST /deceased/export-excel, GET /deceased/export-history), so the
// prefixed aliases MUST be registered here — otherwise POST /deceased/export-excel
// falls through to the global 404 handler and GET /deceased/export-history is
// swallowed by the /deceased/:id catch-all below (treated as "get deceased by id").
router.post('/export-excel', exportExcelWithCharts);
router.get('/export-status/:jobId', checkExportStatus);
router.get('/export-history', getExportHistory);
router.post('/deceased/export-excel', exportExcelWithCharts);
router.get('/deceased/export-status/:jobId', checkExportStatus);
router.get('/deceased/export-history', getExportHistory);

// GET - By ID - SUPPORT ALL PATTERN TYPES
router.get('/deceased-id/:id', getDeceasedById);  // /deceased/deceased-id/:id
router.get('/deceased/:id', getDeceasedById);     // /deceased/deceased/:id
router.get('/:id', getDeceasedById);              // /deceased/:id (fallback)
router.get('/id/:id', getDeceasedById);           // /deceased/id/:id


// PUT - Update
router.put('/:id', updateDeceased);
router.put('/update-deceased/:id', updateDeceased);
// Nested aliases - gateway forwards the full '/deceased' prefixed path verbatim.
router.put('/deceased/:id', updateDeceased);
router.put('/deceased/update-deceased/:id', updateDeceased);

// DELETE - Delete
router.delete('/:id', deleteDeceased);
router.delete('/delete-deceased/:id', deleteDeceased);
router.delete('/deceased/:id', deleteDeceased);
router.delete('/deceased/delete-deceased/:id', deleteDeceased);

// POST - Postmortem/Autopsy routes
router.post('/postmortem/request', requestPostmortem);
router.post('/autopsy/request', requestPostmortem);
router.post('/deceased/postmortem/request', requestPostmortem);

router.post('/postmortem/save', savePostmortem);
router.post('/autopsy/save', savePostmortem);
router.post('/deceased/postmortem/save', savePostmortem);

// GET - Postmortem/Autopsy routes
router.get('/postmortem/:deceased_id', getPostmortemByDeceasedId);
router.get('/autopsy/:deceased_id', getPostmortemByDeceasedId);
router.get('/deceased/postmortem/:deceased_id', getPostmortemByDeceasedId);
router.get('/deceased/autopsy/:deceased_id', getPostmortemByDeceasedId);

// PUT - Update postmortem
router.put('/postmortem/:id', updatePostmortem);
router.put('/autopsy/:id', updatePostmortem);

// Public PDF generation - no auth required
router.get('/public/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/deceased/public/postmortem/:deceased_id/pdf', generatePostmortemPDF);

// GET - Generate PDF report (authenticated)
router.get('/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/autopsy/:deceased_id/pdf', generatePostmortemPDF);

export default router;