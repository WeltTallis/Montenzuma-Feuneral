const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const {
    protect,
    optionalAuth,
    authorize,
} = require('../../app-global/middlewares/authMiddleware');

// Create a support ticket (public - anyone can submit)
router.post('/tickets', optionalAuth, supportController.createTicket);

// All ticket and reply reads and mutations require an authenticated principal.
router.use(protect);

// Get tickets for a specific tenant
router.get('/tickets', supportController.getTickets);

// Only platform administrators may list tickets across tenants.
router.get('/tickets/all', authorize('systemadmin', 'superadmin'), supportController.getAllTickets);

// Reply to a ticket
router.post('/tickets/:id/reply', supportController.replyToTicket);

// Update ticket status
router.patch('/tickets/:id', supportController.updateTicketStatus);

// Get replies for a ticket
router.get('/tickets/:id/replies', supportController.getTicketReplies);

module.exports = router;