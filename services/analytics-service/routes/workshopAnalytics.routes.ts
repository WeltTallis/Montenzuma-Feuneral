import { Router } from 'express';
import { optionalAuth } from '../../../services/app-global/middlewares/authMiddleware';
import { getWorkshopAnalytics } from '../controllers/workshopAnalytics.controller';

const router = Router();

// Use optional auth - dashboard is read-only data
router.use(optionalAuth);

/**
 * Get comprehensive workshop analytics data
 * Matches frontend WorkshopDashboard component
 * 
 * Query Parameters:
 * - startDate: YYYY-MM-DD (optional, defaults to last 30 days)
 * - endDate: YYYY-MM-DD (optional)
 * - status: string (optional) - order status
 * - stage: string (optional) - current production stage
 * - priority: string (optional) - low, normal, high, urgent
 * - workerId: number (optional) - filter by assigned worker
 * - lowStock: boolean (optional) - show only low stock materials
 * - searchQuery: string (optional) - search in customer_name, deceased_name, order_number
 * 
 * Example Requests:
 * GET /analytics/workshop/overview
 * GET /analytics/workshop/orders?stage=assembly
 * GET /analytics/workshop/workers
 * GET /analytics/workshop/materials?lowStock=true
 * GET /analytics/workshop/search?searchQuery=John
 */
router.get('/analytics/workshop/overview', getWorkshopAnalytics);
router.get('/analytics/workshop/orders', getWorkshopAnalytics);
router.get('/analytics/workshop/workers', getWorkshopAnalytics);
router.get('/analytics/workshop/materials', getWorkshopAnalytics);
router.get('/analytics/workshop/search', getWorkshopAnalytics);

/**
 * Get workshop analytics with specific filters
 * Convenience endpoints
 */
router.get('/analytics/workshop/stage/:stage', getWorkshopAnalytics);
router.get('/analytics/workshop/priority/:priority', getWorkshopAnalytics);
router.get('/analytics/workshop/worker/:workerId', getWorkshopAnalytics);

export default router;