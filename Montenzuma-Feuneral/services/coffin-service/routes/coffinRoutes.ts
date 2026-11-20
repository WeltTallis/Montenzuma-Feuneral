
import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import * as coffinController from '../controllers/coffinController.js';
import { Router, Request, Response } from 'express';
import logger from '@montezuma/shared-logger';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  }
});


router.use(protect);
router.use(authorizeAny as any);


// Apply tenant middleware (server.ts handles tenant resolution)
router.use((req: Request, res: Response, next: any) => {
  (req as any).upload = upload;
  next();
});

// COFFIN CRUD - name, color, size, quantity, price, image


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

// ORDERS (BOOKINGS) - coffin_name, color, size, quantity, booked_by, booked_for


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

router.post('/stock-requests/:id/:action', coffinController.updateStockRequestAction);

// ============================================================
// HEALTH
// ============================================================

router.get('/health', coffinController.healthCheck);
router.get('/health/redis', coffinController.redisHealthCheck);
router.get('/:id', coffinController.getCoffinById);


//   404
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
