const { Router } = require('express');
const multer = require('multer');
const coffinController = require('../controllers/coffinController.cjs');
const logger = require('../../../packages/shared-logger/dist/index').default;

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply tenant and auth middleware (passthrough - server.js handles tenant resolution)
router.use((req, res, next) => next());

// ============================================================
// COFFIN CRUD
// ============================================================
router.post('/', upload.array('images', 10), coffinController.createCoffin);
router.post('/register', upload.array('images', 10), coffinController.createCoffin);
router.post('/create', upload.array('images', 10), coffinController.createCoffin);

router.get('/', coffinController.getAllCoffins);
router.get('/all-coffins', coffinController.getAllCoffins);
router.get('/list', coffinController.getAllCoffins);
router.get('/coffins-list', coffinController.getAllCoffins);

// Bookings (must be before /:id to avoid route conflicts)
router.get('/bookings', coffinController.getAllBookings);
router.get('/bookings/list', coffinController.getAllBookings);
router.post('/bookings', coffinController.createBooking);
router.get('/bookings/:id', coffinController.getBookingById);
router.patch('/bookings/:id/status', coffinController.updateBookingStatus);
router.patch('/bookings/:id/payment', coffinController.markBookingPaid);

// Stock Requests (must be before /:id to avoid route conflicts)
router.get('/stock-requests', coffinController.getAllStockRequests);
router.post('/stock-requests', coffinController.createStockRequest);
router.get('/stock-requests/:id', coffinController.getStockRequestById);
router.post('/stock-requests/:id/approve', coffinController.approveStockRequest);
router.post('/stock-requests/:id/reject', coffinController.rejectStockRequest);
router.post('/stock-requests/:id/transferring', coffinController.markStockRequestTransferring);
router.post('/stock-requests/:id/delivered', coffinController.markStockRequestDelivered);

// Assignments
router.post('/assign', coffinController.assignCoffin);

// Analytics
router.get('/analytics/dashboard', coffinController.getCoffinAnalytics);

// CRUD operations (/:id must be after specific routes)
router.get('/detail/:id', coffinController.getCoffinById);
router.get('/:id', coffinController.getCoffinById);

router.put('/:id', upload.array('images', 10), coffinController.updateCoffin);
router.put('/update/:id', upload.array('images', 10), coffinController.updateCoffin);

router.delete('/:id', coffinController.deleteCoffin);
router.delete('/delete/:id', coffinController.deleteCoffin);

// Health
router.get('/health', coffinController.healthCheck);

module.exports = router;
