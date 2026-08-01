import { Router } from 'express';
import multer from 'multer';
import * as coffinController from '../services/coffinService';
import { authenticateToken } from '../../global/middlewares/AuthMiddleware';
import { tenantMiddleware } from '../../global/middlewares/tenantMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply tenant and auth middleware
router.use(tenantMiddleware);
router.use(authenticateToken);

// Coffin CRUD
router.post('/', upload.array('images', 10), coffinController.createCoffin);
router.get('/', coffinController.getAllCoffins);
router.get('/:id', coffinController.getCoffinById);
router.put('/:id', upload.array('images', 10), coffinController.updateCoffin);
router.delete('/:id', coffinController.deleteCoffin);

// Assignments
router.post('/assign', coffinController.assignCoffin);

// Analytics
router.get('/analytics/dashboard', coffinController.getCoffinAnalytics);

// ─── Inter-Branch Coffin Inventory & Transfers ──────────────────────
// These routes allow branches to communicate with each other to request
// coffin inventory from connected partner branches.

// Get coffin inventory from all connected branches
router.get('/branch/:branchId/connected-inventory', coffinController.getConnectedBranchInventory);

// Request a coffin transfer from one branch to another
router.post('/branch/request-transfer', coffinController.requestCoffinTransfer);

// Get all coffin transfer requests (optionally filtered by branch)
router.get('/branch/transfer-requests', coffinController.getTransferRequests);

// Update a transfer request status (approve, reject, complete, cancel)
router.put('/branch/transfer-requests/:id', coffinController.updateTransferRequest);

// Health
router.get('/health', coffinController.healthCheck);

export default router;
