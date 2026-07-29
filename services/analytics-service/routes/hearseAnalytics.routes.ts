import { Router } from 'express';
import { optionalAuth } from '../../../services/app-global/middlewares/authMiddleware';
import { getHearseAnalytics } from '../controllers/hearseAnalytics.controller';

const router = Router();

// Use optional auth - dashboard is read-only data
router.use(optionalAuth);

/**
 * Get comprehensive hearse analytics
 * Matches frontend HearseBookings component
 * 
 * Query Parameters:
 * - timeRange: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'all' (default: 'all')
 * - startDate: YYYY-MM-DD (optional, overrides timeRange)
 * - endDate: YYYY-MM-DD (optional, overrides timeRange)
 * - branchId: number (optional)
 * - status: 'pending' | 'booked' | 'in_transit' | 'completed' | 'cancelled' | 'postponed' | 'maintenance' (optional)
 * - searchQuery: string (optional) - searches in client_name, booking_code, destination
 * 
 * Example Requests:
 * GET /analytics/hearse/comprehensive
 * GET /analytics/hearse/comprehensive?timeRange=thisWeek
 * GET /analytics/hearse/comprehensive?timeRange=today&status=booked
 * GET /analytics/hearse/comprehensive?startDate=2024-01-01&endDate=2024-12-31
 * GET /analytics/hearse/comprehensive?branchId=1&status=in_transit
 */
router.get('/analytics/hearse/comprehensive', getHearseAnalytics);

/**
 * Get hearse analytics for today only
 * Convenience endpoint
 */
router.get('/analytics/hearse/today', getHearseAnalytics);

/**
 * Get hearse analytics for this week
 * Convenience endpoint
 */
router.get('/analytics/hearse/this-week', getHearseAnalytics);

/**
 * Get hearse analytics for this month
 * Convenience endpoint
 */
router.get('/analytics/hearse/this-month', getHearseAnalytics);

export default router;