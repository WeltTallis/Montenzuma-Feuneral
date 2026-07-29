const express = require('express');
const {
  applyForLeave,
  getAllLeaves,
  getMyLeaves,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  uploadDocument,
  getLeaveStats,
  getUsersOnLeave,
  addLeaveDays,
  removeLeaveDays,
  recordHolidayCompensation,
  getLeaveBalance,
  getAllLeaveBalances
} = require('./leaveController');

const { protect, authorizeAny } = require('../../../services/app-global/middlewares/authMiddleware');
const router = express.Router();

// ============================================
// LEAVE REQUESTS
// ============================================

// Apply for leave
router.post('/apply', applyForLeave);

// Get all leaves (Admin)
router.get('/all', getAllLeaves);

// Get my leaves (Employee)
router.get('/my-leaves', getMyLeaves);

// Get leave by ID
router.get('/:id', getLeaveById);

// Update leave status (Approve/Reject)
router.patch('/:id/status', updateLeaveStatus);

// Cancel leave
router.patch('/:id/cancel', cancelLeave);

// Upload supporting document
router.post('/:id/upload-document', uploadDocument);

// ============================================
// LEAVE DAY MANAGEMENT (Admin)
// ============================================

// Add leave days to employee
router.post('/admin/add-days', addLeaveDays);

// Remove leave days addition
router.delete('/admin/add-days/:id', removeLeaveDays);

// Record holiday compensation
router.post('/admin/holiday-compensation', recordHolidayCompensation);

// ============================================
// LEAVE BALANCES
// ============================================

// Get leave balance for a user
router.get('/balance/:user_id', getLeaveBalance);

// Get all leave balances (Admin)
router.get('/balances', getAllLeaveBalances);

// ============================================
// DASHBOARD & STATS
// ============================================

// Get leave statistics
router.get('/stats/overview', getLeaveStats);

// Get users currently on leave
router.get('/users/on-leave', getUsersOnLeave);

module.exports = router;
