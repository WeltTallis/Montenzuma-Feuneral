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

const router = Router();

// Public endpoint for postmortem portal - no authentication required
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

        // Search by deceased_id, admission number, phone, or ID
        let query = 'SELECT deceased_id, full_name, date_of_death, admission_number, date_of_birth, age, gender, place_of_death, national_id, phone_number, signature FROM deceased WHERE 1=1';
        const params: any[] = [];

        if (deceased_id) {
            query += ' AND deceased_id = ?';
            params.push(deceased_id);
        } else if (admission_number) {
            query += ' AND admission_number = ?';
            params.push(admission_number);
        } else if (phone) {
            // Search in deceased table first
            query += ' AND (phone_number LIKE ? OR alternative_phone LIKE ?)';
            params.push(`%${phone}%`, `%${phone}%`);
        } else if (id_number) {
            query += ' AND national_id = ?';
            params.push(id_number);
        }

        query += ' LIMIT 1';
        let records = await safeTenantQuery(dbName, query, params);

        // If phone search didn't find in deceased table, try next_of_kin table
        if ((!records || (records as any[]).length === 0) && phone) {
            try {
                const nokQuery = `SELECT d.deceased_id, d.full_name, d.date_of_death, d.admission_number, 
                    d.date_of_birth, d.age, d.gender, d.place_of_death, d.national_id, 
                    d.phone_number, d.signature,
                    nok.full_name as next_of_kin_name, nok.relationship as next_of_kin_relationship,
                    nok.contact as next_of_kin_phone, nok.email as next_of_kin_email,
                    nok.signature as next_of_kin_signature
                    FROM deceased d 
                    INNER JOIN next_of_kin nok ON d.deceased_id = nok.deceased_id 
                    WHERE nok.contact LIKE ? AND nok.is_deleted = FALSE 
                    LIMIT 1`;
                const nokRecords = await safeTenantQuery(dbName, nokQuery, [`%${phone}%`]);
                if (nokRecords && (nokRecords as any[]).length > 0) {
                    records = nokRecords;
                }
            } catch (e) {
                console.error('[PUBLIC] Next of kin search error:', e);
            }
        }

        if (!records || (records as any[]).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No record found'
            });
        }

        const deceased = (records as any[])[0];

        // Get next of kin data if not already joined
        if (!deceased.next_of_kin_name) {
            try {
                const nokQuery = `SELECT * FROM next_of_kin WHERE deceased_id = ? AND is_deleted = FALSE ORDER BY is_primary DESC, created_at ASC LIMIT 1`;
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

// POST - Update status (for cross-service calls)
router.post('/update-status', updateDeceasedStatus);

export default router;