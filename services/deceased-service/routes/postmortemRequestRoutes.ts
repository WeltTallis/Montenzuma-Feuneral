import { protect, authorizeAny } from '../../../services/app-global/middlewares/authMiddleware';
import { Router } from 'express';
import {
    createPostmortemRequest, getPostmortemRequests, getPostmortemStats, sendPostmortemRequest, updatePostmortemRequestStatus
} from '../controllers/postmortemRequestControl';

const router = Router();
router.use(protect);
router.use(authorizeAny);

// Pre-examination postmortem request tracking
router.get('/postmortem-requests/stats', getPostmortemStats);
router.get('/postmortem-requests', getPostmortemRequests);
router.post('/postmortem-requests', createPostmortemRequest);
router.post('/postmortem-requests/:id/send', sendPostmortemRequest);
router.put('/postmortem-requests/:id/status', updatePostmortemRequestStatus);

router.post('/deceased/postmortem-requests', createPostmortemRequest);
router.post('/deceased/postmortem-requests/:id/send', sendPostmortemRequest);
router.put('/deceased/postmortem-requests/:id/status', updatePostmortemRequestStatus);

export default router;