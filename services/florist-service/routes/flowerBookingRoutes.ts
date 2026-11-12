/**
 * Flower Booking Routes
 * Defines all REST endpoints for the florist service
 */

import { Router } from 'express';
import multer from 'multer';
import {
    getBookings,
    getBookingById,
    updateBookingSamples,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    getStats,
    getMonthlyTrend
} from '../controllers/flowerBooking.ts';
import {
    createFlowerAnnouncement,
    getFlowerAnnouncements,
} from '../controllers/flowerAnnouncements.ts';
const router = Router();
export const flowerBookingRouter = Router();
// Import authentication middleware
// @ts-ignore - authMiddleware is JavaScript, not TypeScript
import authMiddleware from '../../../services/app-global/middlewares/authMiddleware.js';
const { protect, authorizeAny } = authMiddleware;
const sampleUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 10, fields: 5, parts: 15 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith('image/')) callback(null, true);
        else callback(new Error('Only image files are allowed'));
    },
});
const uploadBookingSamples = (req: any, res: any, next: any) => {
    sampleUpload.array('images', 10)(req, res, (error: any) => {
        if (!error) return next();
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ success: false, error: 'Each photo must be 15MB or smaller' });
        }
        if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ success: false, error: 'Upload no more than 10 photos at a time' });
        }
        return res.status(400).json({ success: false, error: error.message || 'Invalid photo upload' });
    });
};

// All routes are protected with JWT authentication
router.use(protect);
router.use(authorizeAny as any);


// ============================================
// STATS & DASHBOARD
// ============================================
flowerBookingRouter.get('/stats', getStats);
flowerBookingRouter.get('/stats/monthly-trend', getMonthlyTrend);
flowerBookingRouter.get('/announcements', protect, authorizeAny as any, getFlowerAnnouncements);
flowerBookingRouter.post('/announcements', protect, authorizeAny as any, createFlowerAnnouncement);

// ============================================
// BOOKINGS
// ============================================
flowerBookingRouter.get('/bookings', getBookings);
flowerBookingRouter.get('/bookings/:id', getBookingById);
flowerBookingRouter.post('/bookings/:id/samples', uploadBookingSamples, updateBookingSamples);
flowerBookingRouter.post('/bookings', createBooking);
flowerBookingRouter.put('/bookings/:id', updateBooking);
flowerBookingRouter.patch('/bookings/:id/status', updateBookingStatus);
flowerBookingRouter.delete('/bookings/:id', deleteBooking);