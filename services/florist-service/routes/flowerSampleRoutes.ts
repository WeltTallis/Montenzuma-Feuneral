// flowerSample.routes.ts
import { Router } from 'express';
import multer from 'multer';
import {
  createFlowerArrangement,
  getFlowerArrangementById,
  updateFlowerArrangement,
  deleteFlowerArrangement,
  getAllFlowerArrangements
} from '../controllers/flowerSamples';

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = Router();

// Middleware to handle multiple file uploads (max 10 files)
const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.array('images', 10)(req, res, next);
};

// ============================================
// ROUTES
// ============================================

/**
 * GET ALL - List all flower arrangements with optional filtering
 * GET /api/flower-arrangements
 * Query params: color, type, size
 */
router.get(
  '/',
  getAllFlowerArrangements as any
);

/**
 * CREATE - Create a new flower arrangement
 * POST /api/flower-arrangements
 * Body: { title, description, types, colors, sizes, images? }
 * Files: images (optional, multiple)
 */
router.post(
  '/',
  uploadMiddleware,
  createFlowerArrangement as any
);

/**
 * GET BY ID - Get a flower arrangement by ID
 * GET /api/flower-arrangements/:id
 * Params: id (arrangement_id)
 */
router.get(
  '/:id',
  getFlowerArrangementById as any
);

/**
 * UPDATE - Update a flower arrangement
 * PUT /api/flower-arrangements/:id
 * Params: id (arrangement_id)
 * Body: { title?, description?, types?, colors?, sizes?, images? }
 * Files: images (optional, multiple)
 */
router.put(
  '/:id',
  uploadMiddleware,
  updateFlowerArrangement as any
);

/**
 * DELETE - Delete a flower arrangement
 * DELETE /api/flower-arrangements/:id
 * Params: id (arrangement_id)
 */
router.delete(
  '/:id',
  deleteFlowerArrangement as any
);

export default router;