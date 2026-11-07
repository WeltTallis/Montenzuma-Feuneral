import { protect, authorize, authorizeAny, enforceTenant } from '../../../services/app-global/middlewares/authMiddleware';
import {
    getAllDeceased, getDeceasedById, updateDeceased, deleteDeceased,
} from '../controllers/deceasedControl';

import { Router, Request, Response } from 'express';


import { registerNewDeceased } from '../controllers/deceased/registerDeceased'
import { getAdmissionNumber } from '../utils/admissionNumberRoute'
import {
    savePostmortem,
    getPostmortemByDeceasedId,
} from '../controllers/autopsy/autopsyControl';
import { requestPostmortem } from '../controllers/autopsy/requestPostmortem';
import { updatePostmortem } from '../controllers/autopsy/updatePostmortem';
import { generatePostmortemPDF } from '../controllers/autopsy/generatePostmortmePDF';

import { updateDeceasedStatus } from '../controllers/deceasedControl';
import { getPostmortemRequests, getPostmortemStats } from '../controllers/autopsy/postmortemRequestControl';
import { exportExcelWithCharts, checkExportStatus, getExportHistory } from '../controllers/exel/exportExcelController';
import { resolveDatabase, safeTenantQuery } from '../../../shared/dbConfig';
import { tableColumns, pickAs } from '../utils/tenantSchema';

const router = Router();

const requireTenantContext = (req: any, res: any, next: any) => {
    if (req.isPlatformAdmin || req.tenantSlug) return next();
    return res.status(403).json({ success: false, message: 'Authenticated tenant context required' });
};

// ─── Tenant schema introspection ────────────────────────────────────────────
// `tableColumns` / `pickAs` live in utils/tenantSchema so the public search and
// the postmortem PDF generator share one implementation — see that file for why
// tenant schemas diverge.

// Public postmortem portal - no authentication required
const handlePublicPostmortemSearch = async (req: Request, res: Response) => {
    try {
        const { phone, id_number, admission_number, deceased_id } = req.query;
        const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['x-slug'] as string;
        if (!tenantSlug || tenantSlug === 'system_shared') {
            return res.status(400).json({ success: false, message: 'Valid tenant required' });
        }

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

        // Keep the unauthenticated result limited to the fields needed to
        // identify the case and submit a request.
        const DECEASED_COLS = [
            'deceased_id', 'full_name', 'date_of_death', 'admission_number',
        ];

        // Search by deceased_id, admission number, phone, or ID
        let query = `SELECT ${DECEASED_COLS.map((c) => pickAs(dCols, c, c)).join(', ')} FROM deceased WHERE 1=1`;
        if (dCols.has('is_deleted')) {
            query += ' AND (is_deleted = FALSE OR is_deleted IS NULL)';
        }
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
                query += ` AND (${phoneCols.map((c) => `${c} = ?`).join(' OR ')})`;
                phoneCols.forEach(() => params.push(phone));
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
                    const nokSelect = DECEASED_COLS.map((c) => pickAs(dCols, c, c, 'd.')).join(', ');
                    const nokDeleted = nCols.has('is_deleted') ? ' AND (nok.is_deleted = FALSE OR nok.is_deleted IS NULL)' : '';
                    const deceasedDeleted = dCols.has('is_deleted') ? ' AND (d.is_deleted = FALSE OR d.is_deleted IS NULL)' : '';
                    const nokQuery = `SELECT ${nokSelect}
                        FROM deceased d
                        INNER JOIN next_of_kin nok ON d.deceased_id = nok.deceased_id
                        WHERE nok.contact = ?${nokDeleted}${deceasedDeleted}
                        LIMIT 1`;
                    const nokRecords = await safeTenantQuery(dbName, nokQuery, [phone]);
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

        return res.status(200).json({
            success: true,
            data: {
                deceased: {
                    deceased_id: deceased.deceased_id,
                    full_name: deceased.full_name,
                    admission_number: deceased.admission_number,
                    date_of_death: deceased.date_of_death,
                }
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

// Apply authentication to all other routes
router.use(protect);
router.use(enforceTenant);
router.use(requireTenantContext);
router.use(authorizeAny);

// Status updates are for authenticated tenant users and trusted services acting
// with that user's token; public aliases are intentionally not available.
router.post('/update-status', updateDeceasedStatus);
router.post('/deceased/update-status', updateDeceasedStatus);

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

// DELETE - Restrict record removal to tenant administrators.
router.delete('/:id', authorize('admin', 'superadmin', 'systemadmin'), deleteDeceased);
router.delete('/delete-deceased/:id', authorize('admin', 'superadmin', 'systemadmin'), deleteDeceased);
router.delete('/deceased/:id', authorize('admin', 'superadmin', 'systemadmin'), deleteDeceased);
router.delete('/deceased/delete-deceased/:id', authorize('admin', 'superadmin', 'systemadmin'), deleteDeceased);

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

// GET - Generate PDF report (authenticated)
router.get('/public/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/deceased/public/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/autopsy/:deceased_id/pdf', generatePostmortemPDF);

export default router;
