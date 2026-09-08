// flowerSample.routes.ts
import { Router } from 'express';
import multer from 'multer';
import {
    createFlowerArrangement,
    getFlowerArrangementById,
    updateFlowerArrangement,
    deleteFlowerArrangement,
    getAllFlowerArrangements
} from '../controllers/flowerSamples.ts';

// Import authentication middleware
import authMiddleware from '../../../services/app-global/middlewares/authMiddleware.js';
const { protect, authorizeAny } = authMiddleware;

const router = Router();

// All routes are protected with JWT authentication
router.use(protect);
router.use(authorizeAny as any);

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB — phone photos routinely exceed 5MB
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

// Map multer failures (file too large / non-image / unexpected field) to a
// clean 400 with a human-readable message instead of Express's default 500.
router.use((err: any, req: any, res: any, next: any) => {
  if (!err) return next();
  console.warn('[FLOWERS] Upload rejected:', err?.code || err?.message);
  const MESSAGES: Record<string, string> = {
    LIMIT_FILE_SIZE: 'Image is too large — maximum size is 15MB',
    LIMIT_UNEXPECTED_FILE: `Unexpected file field "${err.field || ''}" — please upload images using the Images field`,
    LIMIT_FILE_COUNT: 'Too many images — maximum is 10 per arrangement'
  };
  const code = err?.code || '';
  if (code && MESSAGES[code]) {
    return res.status(400).json({ success: false, message: MESSAGES[code] });
  }
  if (/only image files are allowed/i.test(err?.message || '')) {
    return res.status(400).json({ success: false, message: 'Only image files are allowed' });
  }
  return res.status(400).json({ success: false, message: err?.message || 'Upload failed' });
});

export default router;