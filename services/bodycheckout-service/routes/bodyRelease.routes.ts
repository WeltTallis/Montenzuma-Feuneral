import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import { Router } from 'express';
import { releaseBodyController } from '../controllers/bodyRelease.controller';
import { getReleaseController, listReleasesController, getReleaseByAdmissionController } from '../controllers/release.controller';
import {
  getDeceasedByAdmissionController,
  getDeceasedByIdController,
  listDeceasedForReleaseController,
} from '../controllers/deceasedLookup.controller';

const router = Router();

// POST /body-release/checkout - Create new release with ID generation
router.post('/checkout', releaseBodyController);

// GET /body-release/checkout/:id - Get specific release by ID
router.get('/checkout/:id', getReleaseController);

// GET /body-release/checkout - List all releases
router.get('/checkout', listReleasesController);

// GET /body-release/by-admission/:admissionNumber - Get release by admission number
router.get('/by-admission/:admissionNumber', getReleaseByAdmissionController);

// ── Deceased lookup (release auto-fill) — served by the body-checkout service ──
// GET /body-release/deceased - List admitted deceased records for release dropdown
router.get('/deceased', listDeceasedForReleaseController);

// GET /body-release/deceased/by-admission/:admissionNumber - Search + auto-fill details
router.get('/deceased/by-admission/:admissionNumber', getDeceasedByAdmissionController);

// GET /body-release/deceased/:id - Pre-fill by deceased id
router.get('/deceased/:id', getDeceasedByIdController);

export default router;
