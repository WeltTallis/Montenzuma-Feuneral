// flowerSample.routes.ts
import { Router } from 'express';
import multer from 'multer';
import {
    createFlowerArrangement,
    getFlowerArrangementById,
    updateFlowerArrangement,
    deleteFlowerArrangement,
    getAllFlowerArrangements,
    getRecommendedFlowerArrangements,
    getMySampleLikes,
    likeFlowerSample,
    unlikeFlowerSample
} from '../controllers/flowerSamples.ts';

// Import authentication middleware
import authMiddleware from '../../../services/app-global/middlewares/authMiddleware.js';
const { protect, authorizeAny } = authMiddleware;

const router = Router();

// All routes are protected with JWT authentication
// NOTE: public like routes (likes/mine, :id/like, :id/unlike) were moved
// ABOVE this guard so browsing clients can tap ♥ with no staff login.

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB — phone photos routinely exceed 5MB
    // A per-file limit is meaningless without a CAP ON THE TOTAL: multer buffers
    // every file in RAM before the controller runs, so 10 × 15MB is a 150MB spike
    // PER REQUEST. On a small container with concurrent uploads that OOM-kills
    // the process — which is exactly the "arrangements sometimes fail, randomly"
    // symptom. 10 files / 60 parts keeps a full photo set working while bounding
    // the worst case to something survivable.
    files: 10,
    fields: 30,
    parts: 60,
    fieldSize: 1024 * 1024,
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
//
// WHY THIS EXISTS — "arrangements sometimes fail":
// `upload.array()` ABORTS the whole request the moment ONE file breaches a limit,
// discarding everything it had already buffered. Uploading an 11th photo, or one
// photo over 15MB, used to return a bare 400 with no usable message; the
// controller never ran, so the user's title and description were lost too and
// they had to retype everything. Because it only triggered on larger batches it
// looked random — the same florist, same form, working one day and not the next.
//
// Handling the error here turns each cause into a SPECIFIC, actionable message
// so the client can say exactly what to change.
const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.array('images', 10)(req, res, (err: any) => {
    if (!err) return next();

    const code = err?.code;
    if (code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'One of the photos is larger than 15MB. Please compress it or upload fewer images.',
      });
    }
    if (code === 'LIMIT_FILE_COUNT' || code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Too many photos in one arrangement (maximum 10).',
      });
    }
    if (code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many form fields sent with the upload.',
      });
    }
    console.warn('[FLOWERS] Upload middleware rejected:', code || err?.message);
    return res.status(400).json({ success: false, message: err?.message || 'Upload failed' });
  });
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

router.get(
  '/recommendations',
  getRecommendedFlowerArrangements as any
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
 * LIKES (public-friendly: clients tap ♥ with no login)
 * GET  /likes/mine          → which samples this device liked + live counts
 * POST /:id/like            → like a sample (idempotent)
 * POST /:id/unlike          → unlike a sample (idempotent)
 * NOTE: these MUST sit BEFORE `/:id` so "likes/mine" isn't read as an id.
 * NOTE: protect/authorizeAny run AFTER these, so browsing clients can love
 * samples without a staff login. CREATE/UPDATE/DELETE stay locked down.
 */
router.get(
  '/likes/mine',
  getMySampleLikes as any
);

router.post(
  '/:id/like',
  likeFlowerSample as any
);

router.post(
  '/:id/unlike',
  unlikeFlowerSample as any
);

// All management routes below are protected with JWT authentication
router.use(protect);
router.use(authorizeAny as any);

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