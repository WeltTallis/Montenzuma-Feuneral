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
  addEmployee,
  getLeaveBalance,
  getAllLeaveBalances
} = require('./leaveController');

const { protect, authorizeAny } = require('../../services/app-global/middlewares/authMiddleware');
const router = express.Router();

// Multer for supporting-document uploads. Files land in uploads/leave-documents,
// which matches the /uploads static mount in server.js and the
// /uploads/leave-documents/<file> path written by uploadDocument.
const multer = require('multer');
const path = require('path');
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'leave-documents');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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
router.post('/:id/upload-document', documentUpload.single('document'), uploadDocument);

// ============================================
// LEAVE DAY MANAGEMENT (Admin)
// ============================================

// Add leave days to employee
router.post('/admin/add-days', addLeaveDays);

// Remove leave days addition
router.delete('/admin/add-days/:id', removeLeaveDays);

// Record holiday compensation
router.post('/admin/holiday-compensation', recordHolidayCompensation);

// Register a new employee (grants default 26 annual leave days)
router.post('/admin/employees', addEmployee);

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
