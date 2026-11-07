
import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import { Router } from 'express';
import {
    savePostmortem,
} from '../controllers/autopsy/autopsyControl';
import { getPostmortemByDeceasedId } from '../controllers/autopsy/autopsyControl';
import { requestPostmortem } from '../controllers/autopsy/requestPostmortem';
import { updatePostmortem } from '../controllers/autopsy/updatePostmortem';
import { generatePostmortemPDF } from '../controllers/autopsy/generatePostmortmePDF';

const router = Router();

// Import authentication middleware
// @ts-ignore - authMiddleware is JavaScript, not TypeScript

// All routes are protected with JWT authentication
router.use(protect);
router.use(authorizeAny as any);

// Postmortem/Autopsy routes - Full paths
router.post('/api/v1/restpoint/deceased/postmortem/request', requestPostmortem);
router.post('/api/v1/restpoint/deceased/postmortem/save', savePostmortem);
router.get('/api/v1/restpoint/deceased/postmortem/:deceased_id', getPostmortemByDeceasedId);
router.put('/api/v1/restpoint/deceased/postmortem/:id', updatePostmortem);
// router.delete('/api/v1/restpoint/deceased/postmortem/:id', deletePostmortem); // Not implemented
router.get('/api/v1/restpoint/deceased/postmortem/:deceased_id/pdf', generatePostmortemPDF);

// Short paths
router.post('/postmortem/request', requestPostmortem);
router.post('/postmortem/save', savePostmortem);
router.get('/postmortem/:deceased_id', getPostmortemByDeceasedId);
router.put('/postmortem/:id', updatePostmortem);
// router.delete('/postmortem/:id', deletePostmortem); // Not implemented
router.get('/postmortem/:deceased_id/pdf', generatePostmortemPDF);

export default router;
