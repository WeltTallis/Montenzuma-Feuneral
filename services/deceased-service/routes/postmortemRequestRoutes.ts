import { Router } from 'express';
import {
    createPostmortemRequest,
    getPostmortemRequests,
    sendPostmortemRequest,
    updatePostmortemRequestStatus
} from '../controllers/postmortemRequestControl';

const router = Router();

// Pre-examination postmortem request tracking
router.get('/postmortem-requests', getPostmortemRequests);
router.post('/postmortem-requests', createPostmortemRequest);
router.post('/postmortem-requests/:id/send', sendPostmortemRequest);
router.put('/postmortem-requests/:id/status', updatePostmortemRequestStatus);

export default router;