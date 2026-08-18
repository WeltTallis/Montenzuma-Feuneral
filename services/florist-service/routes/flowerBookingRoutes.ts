/**
 * Flower Booking Routes
 * Defines all REST endpoints for the florist service
 */

import { Router } from 'express';
import {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    getStats,
    getMonthlyTrend
} from '../controllers/flowerBooking.ts';
const router = Router();
export const flowerBookingRouter = Router();
// Import authentication middleware
// @ts-ignore - authMiddleware is JavaScript, not TypeScript
import authMiddleware from '../../../services/app-global/middlewares/authMiddleware.js';
const { protect, authorizeAny } = authMiddleware;

// All routes are protected with JWT authentication
router.use(protect);
router.use(authorizeAny as any);


// ============================================
// STATS & DASHBOARD
// ============================================
flowerBookingRouter.get('/stats', getStats);
flowerBookingRouter.get('/stats/monthly-trend', getMonthlyTrend);

// ============================================
// BOOKINGS
// ============================================
flowerBookingRouter.get('/bookings', getBookings);
flowerBookingRouter.get('/bookings/:id', getBookingById);
flowerBookingRouter.post('/bookings', createBooking);
flowerBookingRouter.put('/bookings/:id', updateBooking);
flowerBookingRouter.patch('/bookings/:id/status', updateBookingStatus);
flowerBookingRouter.delete('/bookings/:id', deleteBooking);