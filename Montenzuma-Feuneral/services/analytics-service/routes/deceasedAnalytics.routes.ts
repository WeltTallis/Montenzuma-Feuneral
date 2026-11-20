import { Router } from 'express';
import { optionalAuth } from '../../../services/app-global/middlewares/authMiddleware';
import { getDeceasedAnalytics, refreshAnalyticsCache } from '../controllers/deceasedAnalytics.controller';

const router = Router();

// Use optional auth - dashboard is read-only data
router.use(optionalAuth);

/**
 * Get comprehensive deceased analytics
 * Matches frontend DeceasedAnalytics component
 * 
 * Query params:
 * - timeRange: '3m' | '6m' | '12m' (default: '3m')
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 * - status: filter by admission_status (optional)
 * - pmFilter: 'all' | 'pending' | 'done' | 'not_requested' (optional)
 * - searchQuery: search in name/admission_number (optional)
 * - selectedDate: YYYY-MM-DD (optional)
 */
router.get('/analytics/deceased/comprehensive', getDeceasedAnalytics);

/**
 * Background endpoint to refresh analytics cache
 * Can be called by cron jobs or background workers
 */
router.post('/analytics/deceased/refresh-cache', async (req, res) => {
  const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['x-tenant-id'] as string || 'system_shared';
  const branchId = req.headers['x-branch-id'] as string || null;
  
  // Don't await - fire and forget
  refreshAnalyticsCache(tenantSlug, branchId || undefined).catch(err => {
    console.error('Background cache refresh failed:', err);
  });
  
  res.status(200).json({
    success: true,
    message: 'Cache refresh triggered',
    timestamp: new Date().toISOString()
  });
});

export default router;