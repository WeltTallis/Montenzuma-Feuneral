import { Router } from 'express';
import { optionalAuth } from '../../../services/app-global/middlewares/authMiddleware';
import { getFlowerBookingAnalytics } from '../controllers/flowerBookingAnalytics.controller';

const router = Router();

// Use optional auth - dashboard is read-only data
router.use(optionalAuth);

/**
 * Get comprehensive flower booking analytics
 * Matches frontend FlowerBookingsNew component
 * 
 * Query Parameters:
 * - month: number (1-12, optional, defaults to current month)
 * - year: number (optional, defaults to current year)
 * - startDate: YYYY-MM-DD (optional, overrides month/year)
 * - endDate: YYYY-MM-DD (optional, overrides month/year)
 * - status: 'pending' | 'sourced' | 'transit' | 'completed' (optional)
 * - priority: 'High' | 'Normal' | 'Low' (optional)
 * - searchQuery: string (optional) - searches in deceased_name, funeral_home, arrangement_name
 * 
 * Example Requests:
 * GET /analytics/flower/bookings
 * GET /analytics/flower/bookings?month=12&year=2024
 * GET /analytics/flower/bookings?status=transit
 * GET /analytics/flower/bookings?priority=High
 * GET /analytics/flower/bookings?searchQuery=John
 * GET /analytics/flower/bookings?startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/analytics/flower/bookings', getFlowerBookingAnalytics);

/**
 * Get flower booking analytics for current month
 * Convenience endpoint
 */
router.get('/analytics/flower/this-month', getFlowerBookingAnalytics);

/**
 * Get flower booking analytics for specific month
 * Convenience endpoint
 */
router.get('/analytics/flower/month/:month/:year', getFlowerBookingAnalytics);

export default router;