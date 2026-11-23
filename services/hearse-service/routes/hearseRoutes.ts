import express from 'express';
import { addFuelDeposit, allocateFuelFunds, getDriverFuelCards, getFuelWallet, recordDriverFuelPurchase, recordFuelPurchase, updateFuelThreshold } from '../controllers/hearseFuel';
import { checkHearseAvailability, getAvailabilityAcrossBranches, checkAvailabilityByDate, checkAvailabilityByDates } from '../controllers/checkHeraseAvailablity';
import { registerHearse, updateHearse, deleteHearse, getAllHearses, getAvailableHearses, upload } from '../controllers/registerHearse';

import { assignBookingLineup, getDailyLineup, saveStandbyDriver, sendSmsLineup } from '../controllers/hearseLineups';
import { getHearseFleetAnalytics, getHearsePeriodAnalytics } from '../controllers/hearseAnalytics';
import { getAllDrivers, getBookingsByDriver, getDriverDashboard } from '../controllers/drivers';
import { getAllHearseBookings } from '../controllers/getAllHearseBookings';
import { assignDriverToBooking } from '../controllers/asignDriverABooking';

import { postponeHearseBooking } from '../controllers/postPoneHearseBooking';
import { updateBookingStatus } from '../controllers/updateBookingStatus';
import { protect } from '../../app-global/middlewares/authMiddleware';
import { makeHearseBooking } from '../controllers/bookHerse';
import { updateHearseBooking } from '../controllers/updateHearseBooking';

const router = express.Router();

// Hearse CRUD
router.post('/hearses', protect, upload.single('image'), registerHearse);
router.put('/hearses/:id', protect, upload.single('image'), updateHearse);
router.delete('/hearses/:id', protect, deleteHearse);
router.get('/hearses', getAllHearses);
router.get('/hearses/available', getAvailableHearses);

// Fuel-card funds are tracked as an internal ledger; these routes do not reload TotalEnergies cards.
router.get('/hearse-fuel', protect, getFuelWallet);
router.post('/hearse-fuel/deposits', protect, addFuelDeposit);
router.post('/hearse-fuel/allocations', protect, allocateFuelFunds);
router.post('/hearse-fuel/purchases', protect, recordFuelPurchase);
router.put('/hearse-fuel/threshold', protect, updateFuelThreshold);
router.get('/hearse-fuel/driver-cards', protect, getDriverFuelCards);
router.post('/hearse-fuel/driver-purchases', protect, recordDriverFuelPurchase);

// Hearse Bookings
router.post('/hearse-bookings', protect, makeHearseBooking);
router.put('/hearse-bookings/:booking_id', protect, updateHearseBooking);
router.post('/hearse-bookings/check-availability', protect, checkHearseAvailability);
router.get('/hearse-bookings', protect, getAllHearseBookings);
router.put('/hearse-bookings/:booking_id/status', protect, updateBookingStatus);
router.put('/hearse-bookings/:booking_id/assign-driver', protect, assignDriverToBooking);
router.put('/hearse-bookings/:booking_id/lineup', protect, assignBookingLineup);
router.get('/hearse-lineups/day', protect, getDailyLineup);
router.put('/hearse-lineups/standby', protect, saveStandbyDriver);
router.post('/hearse-lineups/send-sms', protect, sendSmsLineup);
router.patch('/hearse-bookings/:booking_id/postpone', protect, postponeHearseBooking);

// Drivers
router.get('/all-drivers', protect, getAllDrivers);
router.get('/drivers/:driver_id/bookings', protect, getBookingsByDriver);
router.get('/drivers/:driver_id/dashboard', protect, getDriverDashboard);

// Availability
router.get('/availability', protect, getAvailabilityAcrossBranches);
router.get('/availability/check-by-date', protect, checkAvailabilityByDate);
// Multi-date availability: ONE request for every selected day (replaces the
// per-day fan-out). Exposed on POST for long date ranges (no URL length limit)
// and on GET for convenience/bookmarking.
router.post('/availability/check-by-dates', protect, checkAvailabilityByDates);
router.get('/availability/check-by-dates', protect, checkAvailabilityByDates);

// Analytics
router.get('/analytics/fleet', protect, getHearseFleetAnalytics);
router.get('/analytics/period', protect, getHearsePeriodAnalytics);

export default router;
