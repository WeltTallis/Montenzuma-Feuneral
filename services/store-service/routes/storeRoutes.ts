import { Router } from 'express';
import {
  getItems,
  getCategories,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  pickItem,
  restockItem,
  adjustItem,
  getTransactions,
  getStats,
} from '../controllers/storeController.ts';

const router = Router();

// ============================================
// ROUTES  (order matters — /categories & /stats before /:id)
// ============================================

/** GET /api/store/stats - dashboard aggregate numbers */
router.get('/stats', getStats);

/** GET /api/store/items/categories - distinct category list */
router.get('/items/categories', getCategories);

/** GET /api/store/transactions?{action,itemId,itemName,staff,from,to,page,perPage} */
router.get('/transactions', getTransactions);

/** GET /api/store/items?{search,category} */
router.get('/items', getItems);

/** POST /api/store/items */
router.post('/items', createItem);

/** GET /api/store/items/:id */
router.get('/items/:id', getItemById);

/** PUT /api/store/items/:id */
router.put('/items/:id', updateItem);

/** DELETE /api/store/items/:id */
router.delete('/items/:id', deleteItem);

/** POST /api/store/items/:id/pick  { quantity, staff, reason, notes? } */
router.post('/items/:id/pick', pickItem);

/** POST /api/store/items/:id/restock  { quantity, supplier?, staff? } */
router.post('/items/:id/restock', restockItem);

/** POST /api/store/items/:id/adjust  { newStock, reason?, staff? } */
router.post('/items/:id/adjust', adjustItem);

export default router;
