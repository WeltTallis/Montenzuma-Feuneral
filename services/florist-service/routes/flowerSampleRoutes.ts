// flowerSample.routes.ts
import { Router } from 'express';
import multer from 'multer';
import {
  createFlowerSample,
  getFlowerSampleById,
  updateFlowerSample,
  deleteFlowerSample,
  getAllFlowerSamples
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
const uploadMiddleware = upload.array('images', 10);

// ============================================
// ROUTES
// ============================================

/**
 * GET ALL - List all flower samples with optional filtering
 * GET /api/flower-samples
 * Query params: color, type, size
 */
router.get(
  '/',
  getAllFlowerSamples
);

/**
 * CREATE - Create a new flower sample
 * POST /api/flower-samples
 * Body: { title, description, types, colors, sizes, images? }
 * Files: images (optional, multiple)
 */
router.post(
  '/',
  uploadMiddleware,
  createFlowerSample
);

/**
 * GET BY ID - Get a flower sample by ID
 * GET /api/flower-samples/:id
 * Params: id (sample_id)
 */
router.get(
  '/:id',
  getFlowerSampleById
);

/**
 * UPDATE - Update a flower sample
 * PUT /api/flower-samples/:id
 * Params: id (sample_id)
 * Body: { title?, description?, types?, colors?, sizes?, images? }
 * Files: images (optional, multiple)
 */
router.put(
  '/:id',
  uploadMiddleware,
  updateFlowerSample
);

/**
 * DELETE - Delete a flower sample
 * DELETE /api/flower-samples/:id
 * Params: id (sample_id)
 */
router.delete(
  '/:id',
  deleteFlowerSample
);

export default router;