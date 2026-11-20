import { Router } from 'express';
const router = Router();;
import { optionalAuth } from '../../../services/app-global/middlewares/authMiddleware';

// Import all small analytics controllers
import deceasedAnalytics from '../controllers/deceasedAnalyticsLegacy.controller';
import bookingAnalytics from '../controllers/bookingAnalytics.controller';
import revenueAnalytics from '../controllers/revenueAnalytics.controller';
import chemicalAnalytics from '../controllers/chemicalAnalytics.controller';
import workshopAnalytics from '../controllers/workshopAnalyticsLegacy.controller';
import comprehensiveDashboard from '../controllers/comprehensiveDashboard.controller';
import { getComprehensiveVehicleAnalytics } from '../controllers/analytics.controller';

// Analytics routes use optional auth - dashboard is read-only data
router.use(optionalAuth);

// ============================================================
// INDIVIDUAL ANALYTICS ENDPOINTS - each fetches one thing
// ============================================================

// Deceased analytics
router.get('/analytics/deceased/count', deceasedAnalytics.getDeceasedCount);
router.get('/analytics/deceased/status', deceasedAnalytics.getCaseStatusDistribution);
router.get('/analytics/deceased/trends', deceasedAnalytics.getDeceasedTrends);

// Booking & Hearse analytics
router.get('/analytics/bookings/counts', bookingAnalytics.getBookingCounts);
router.get('/analytics/hearse/fleet', bookingAnalytics.getHearseFleetStatus);

// Revenue analytics
router.get('/analytics/revenue/summary', revenueAnalytics.getRevenueSummary);
router.get('/analytics/revenue/trends', revenueAnalytics.getMonthlyRevenueTrends);

// Chemical analytics
router.get('/analytics/chemicals/stock', chemicalAnalytics.getChemicalStockSummary);
router.get('/analytics/chemicals/trends', chemicalAnalytics.getChemicalUsageTrends);

// Workshop analytics
router.get('/analytics/workshop/summary', workshopAnalytics.getWorkshopSummary);
router.get('/analytics/workshop/production', workshopAnalytics.getWorkshopProductionStatus);

// Vehicle analytics
router.get('/analytics/vehicle/analytics', getComprehensiveVehicleAnalytics);

// ============================================================
// COMPREHENSIVE DASHBOARD - aggregates all into one response
// ============================================================
router.get('/analytics/dashboard/comprehensive', comprehensiveDashboard.getComprehensiveDashboard);
router.get('/analytics/dashboard/compare', comprehensiveDashboard.getComparisonDashboard);

// Legacy route - backward compatibility
router.get('/analytics/mortuary-analytics', comprehensiveDashboard.getComprehensiveDashboard);

export default router;