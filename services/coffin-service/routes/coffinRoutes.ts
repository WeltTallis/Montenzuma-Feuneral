import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as coffinController from '../controllers/coffinController.js';
import logger from '@montezuma/shared-logger';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  }
});

// Apply tenant middleware (server.ts handles tenant resolution)
router.use((req: Request, res: Response, next: any) => {
  (req as any).upload = upload;
  next();
});

// ============================================================
// COFFIN CRUD - name, color, size, quantity, price, image
// ============================================================

router.post('/', upload.array('images', 10), coffinController.createCoffin);
router.post('/create', upload.array('images', 10), coffinController.createCoffin);
router.post('/register', upload.array('images', 10), coffinController.createCoffin);

router.get('/', coffinController.getAllCoffins);
router.get('/list', coffinController.getAllCoffins);
router.get('/all-coffins', coffinController.getAllCoffins);
router.get('/coffins-list', coffinController.getAllCoffins);

// Cross-branch inventory search
router.get('/all-branches', coffinController.getAllCoffinsAllBranches);

// Update coffin
router.put('/:id', upload.array('images', 10), coffinController.updateCoffin);
router.put('/update/:id', upload.array('images', 10), coffinController.updateCoffin);

// Delete coffin
router.delete('/:id', coffinController.deleteCoffin);
router.delete('/delete/:id', coffinController.deleteCoffin);

// ============================================================
// ORDERS (BOOKINGS) - coffin_name, color, size, quantity, booked_by, booked_for
// ============================================================

router.post('/orders', coffinController.createOrder);
router.post('/bookings', coffinController.createOrder);
router.post('/orders/create', coffinController.createOrder);

router.get('/orders', coffinController.getAllOrders);
router.get('/orders/list', coffinController.getAllOrders);

router.get('/orders/:id', coffinController.getOrderById);
router.get('/orders/detail/:id', coffinController.getOrderById);

router.patch('/orders/:id/status', coffinController.updateOrderStatus);

// Alias used by the frontend inventory page (/coffins/bookings/:id/status)
router.patch('/bookings/:id/status', coffinController.updateOrderStatus);

// PUT alias so the reservation dashboard "Mark as Paid" flow persists to the DB
// (it calls PUT /coffins/orders/:id with { paid: true }).
router.put('/orders/:id', coffinController.updateOrderStatus);
router.put('/bookings/:id', coffinController.updateOrderStatus);

// ============================================================
// STOCK REQUESTS
// ============================================================

router.post('/stock-requests', upload.single('image'), coffinController.createStockRequest);
router.post('/stock-requests/create', upload.single('image'), coffinController.createStockRequest);

router.get('/stock-requests', coffinController.getAllStockRequests);
router.get('/stock-requests/list', coffinController.getAllStockRequests);

router.get('/stock-requests/:id', coffinController.getStockRequestById);
router.get('/stock-requests/detail/:id', coffinController.getStockRequestById);

router.patch('/stock-requests/:id/status', coffinController.updateStockRequestStatus);

// Action-based status updates the frontend uses: approve / reject / delivered.
// 2-status workflow (approved → delivered); legacy "transferring" maps to approved.
router.post('/stock-requests/:id/:action', coffinController.updateStockRequestAction);

// ============================================================
// HEALTH
// ============================================================

router.get('/health', coffinController.healthCheck);

// ============================================================
// GET coffin by ID - registered LAST among the GET routes so the
// catch-all :id does not hijack single-segment endpoints such as
// /orders, /stock-requests, and /health (Express first-match-wins).
// ============================================================
router.get('/detail/:id', coffinController.getCoffinById);
router.get('/:id', coffinController.getCoffinById);

// ============================================================
// 404 handler for unmatched routes within /coffins
// ============================================================

router.use((req: Request, res: Response) => {
  logger.warn({
    msg: 'Coffin route not found',
    method: req.method,
    url: req.originalUrl,
    tenant: (req as any).tenantSlug
  });

  
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found in coffin service`
  });
});

export default router;
