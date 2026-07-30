import { Router, Request, Response } from 'express';
import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import {
    getAllDeceased,
    getDeceasedById,
    getDeceasedByAdmissionNumber,
    updateDeceased,
    deleteDeceased,
} from '../controllers/deceasedControl';

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
import { exportExcelWithCharts, checkExportStatus, getExportHistory } from '../controllers/exportExcelController';
import { resolveDatabase, safeTenantQuery, safeTenantExecute } from '../../../shared/dbConfig';

const router = Router();

// Public endpoint for postmortem portal - no authentication required
router.get('/public/postmortem/search', async (req: Request, res: Response) => {
    try {
        const { phone, id_number, admission_number } = req.query;
        const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['x-slug'] as string || 'system_shared';
        
        if (!phone && !id_number && !admission_number) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone, id_number, or admission_number'
            });
        }

        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        // Search by admission number, phone, or ID
        let query = 'SELECT * FROM deceased WHERE 1=1';
        const params: any[] = [];

        if (admission_number) {
            query += ' AND admission_number = ?';
            params.push(admission_number);
        } else if (phone) {
            query += ' AND next_of_kin_phone LIKE ?';
            params.push(`%${phone}%`);
        } else if (id_number) {
            query += ' AND next_of_kin_id_number = ?';
            params.push(id_number);
        }

        query += ' LIMIT 1';
        const records = await safeTenantQuery(dbName, query, params);

        if (!records || (records as any[]).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No record found'
            });
        }

        const deceased = (records as any[])[0];
        
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

        return res.status(200).json({
            success: true,
            data: {
                deceased,
                postmortem
            }
        });
    } catch (error: any) {
        console.error('[PUBLIC] Postmortem search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

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

// POST - Export Excel (must be BEFORE catch-all /:id route)
router.post('/export-excel', exportExcelWithCharts);
router.get('/export-status/:jobId', checkExportStatus);
router.get('/export-history', getExportHistory);

// GET - By ID - SUPPORT ALL PATTERN TYPES
router.get('/deceased-id/:id', getDeceasedById);  // /deceased/deceased-id/:id
router.get('/deceased/:id', getDeceasedById);     // /deceased/deceased/:id
router.get('/:id', getDeceasedById);              // /deceased/:id (fallback)
router.get('/id/:id', getDeceasedById);           // /deceased/id/:id

// GET - By admission number
router.get('/admission-number/:admissionNumber', getDeceasedByAdmissionNumber);
router.get('/deceased/admission-number/:admissionNumber', getDeceasedByAdmissionNumber);

// PUT - Update
router.put('/:id', updateDeceased);
router.put('/update-deceased/:id', updateDeceased);

// DELETE - Delete
router.delete('/:id', deleteDeceased);
router.delete('/delete-deceased/:id', deleteDeceased);

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

// GET - Generate PDF report (authenticated)
router.get('/postmortem/:deceased_id/pdf', generatePostmortemPDF);
router.get('/autopsy/:deceased_id/pdf', generatePostmortemPDF);

// POST - Update status (for cross-service calls)
router.post('/update-status', updateDeceasedStatus);

// GET - Stats
// router.get('/stats', getDeceasedStats);

// GET - Export
// router.get('/export', exportDeceasedToExcel);

export default router;