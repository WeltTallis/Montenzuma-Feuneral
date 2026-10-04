/**
 * Insurance Service - routes.
 *
 * Two groups, and the split is load-bearing:
 *
 *   PUBLIC  - the two Amani forms. No auth. A bereaved family filling in a
 *             claim form at 2am has no account and never will; putting these
 *             behind auth would make the forms unusable. Everything public is
 *             a WRITE of data the visitor supplied about themselves, validated
 *             in models/validation.ts, and scoped to the public tenant.
 *
 *   STAFF   - reads of other people's policies. The gateway is expected to put
 *             these behind authentication; see the note in server.ts on what
 *             happens if it is not.
 *
 * Mounted at /insurance - the gateway strips /api/v1/restpoint and proxies
 * /insurance/... here.
 */
import { Router } from 'express';
import {
  createApplication,
  createClaim,
  checkCover,
  listPolicies,
  getPolicy,
  listClaims,
  updateClaimStatus,
  getStats,
} from '../controllers/insuranceController';

const router = Router();

/* ---- public writes (no auth) ---- */
router.post('/applications', createApplication);
router.post('/claims', createClaim);
/* Public cover lookup for the payments page. Returns only whether cover
   exists and its type/status - never the holder's details. See the handler. */
router.post('/cover-check', checkCover);

/* ---- staff reads ---- */
router.get('/policies', listPolicies);
router.get('/policies/:policyNumber', getPolicy);
router.get('/claims', listClaims);
router.patch('/claims/:claimId/status', updateClaimStatus);
router.get('/stats', getStats);

export default router;