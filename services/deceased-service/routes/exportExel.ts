import express from 'express';
const router = express.Router();

// Import controllers
import { exportExcelWithCharts, checkExportStatus, getExportHistory } from '../controllers/exportExcelController';

// ============================================
// EXPORT ROUTES
// ============================================

// POST /api/deceased/export-excel - Queue an Excel export job
router.post('/export-excel', exportExcelWithCharts);

// GET /api/deceased/export-status/:jobId - Check export job status and download when ready
router.get('/export-status/:jobId', checkExportStatus);

// GET /api/deceased/export-history - Get export history
router.get('/export-history', getExportHistory);

export default router;