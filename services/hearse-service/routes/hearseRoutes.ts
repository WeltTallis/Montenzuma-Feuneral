import express from 'express';
import { registerHearse, updateHearse, deleteHearse, getAllHearses, getAvailableHearses, upload } from '../controllers/registerHearse';
import { makeHearseBooking, getAllHearseBookings, assignDriverToBooking, updateBookingStatus, postponeHearseBooking, getAllDrivers, getBookingsByDriver, getDriverDashboard, getAvailabilityAcrossBranches, checkAvailabilityByDate } from '../controllers/bookHerse';
import { getHearseFleetAnalytics, getHearsePeriodAnalytics } from '../controllers/hearseAnalytics';

const router = express.Router();

// Hearse CRUD
router.post('/hearses', upload.single('image'), registerHearse);
router.put('/hearses/:id', upload.single('image'), updateHearse);
router.delete('/hearses/:id', deleteHearse);
router.get('/hearses', getAllHearses);
router.get('/hearses/available', getAvailableHearses);

// Hearse Bookings
router.post('/hearse-bookings', makeHearseBooking);
router.get('/hearse-bookings', getAllHearseBookings);
router.put('/hearse-bookings/:booking_id/status', updateBookingStatus);
router.put('/hearse-bookings/:booking_id/assign-driver', assignDriverToBooking);
router.patch('/hearse-bookings/:booking_id/postpone', postponeHearseBooking);

// Drivers
router.get('/all-drivers', getAllDrivers);
router.get('/drivers/:driver_id/bookings', getBookingsByDriver);
router.get('/drivers/:driver_id/dashboard', getDriverDashboard);

// Availability
router.get('/availability', getAvailabilityAcrossBranches);
router.get('/availability/check-by-date', checkAvailabilityByDate);

// Analytics
router.get('/analytics/fleet', getHearseFleetAnalytics);
router.get('/analytics/period', getHearsePeriodAnalytics);

export default router;