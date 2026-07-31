import express from 'express';
import { registerHearse, updateHearse, deleteHearse, getAllHearses, getAvailableHearses, upload } from '../controllers/registerHearse';
import { makeHearseBooking, getAllHearseBookings, assignDriverToBooking, updateBookingStatus, postponeHearseBooking, getAllDrivers, getBookingsByDriver, getDriverDashboard, getAvailabilityAcrossBranches, checkAvailabilityByDate } from '../controllers/bookHerse';
import { getHearseFleetAnalytics, getHearsePeriodAnalytics } from '../controllers/hearseAnalytics';
import { protect } from '../../auth-service/middleware/authMiddleware';

const router = express.Router();

// Hearse CRUD
router.post('/hearses', protect, upload.single('image'), registerHearse);
router.put('/hearses/:id', protect, upload.single('image'), updateHearse);
router.delete('/hearses/:id', protect, deleteHearse);
router.get('/hearses', getAllHearses);
router.get('/hearses/available', getAvailableHearses);

// Hearse Bookings
router.post('/hearse-bookings', protect, makeHearseBooking);
router.get('/hearse-bookings', protect, getAllHearseBookings);
router.put('/hearse-bookings/:booking_id/status', protect, updateBookingStatus);
router.put('/hearse-bookings/:booking_id/assign-driver', protect, assignDriverToBooking);
router.patch('/hearse-bookings/:booking_id/postpone', protect, postponeHearseBooking);

// Drivers
router.get('/all-drivers', protect, getAllDrivers);
router.get('/drivers/:driver_id/bookings', protect, getBookingsByDriver);
router.get('/drivers/:driver_id/dashboard', protect, getDriverDashboard);

// Availability
router.get('/availability', protect, getAvailabilityAcrossBranches);
router.get('/availability/check-by-date', protect, checkAvailabilityByDate);

// Analytics
router.get('/analytics/fleet', protect, getHearseFleetAnalytics);
router.get('/analytics/period', protect, getHearsePeriodAnalytics);

export default router;