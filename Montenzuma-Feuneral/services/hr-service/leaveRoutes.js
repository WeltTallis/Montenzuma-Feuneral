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
  getUserDayAdditions,
  recordHolidayCompensation,
  addEmployee,
  getLeaveBalance,
  getAllLeaveBalances
} = require('./leave/leaveController');

const { protect, authorizeAny } = require('../../services/app-global/middlewares/authMiddleware');
const router = express.Router();
router.use(protect)
router.use(authorizeAny)

// Multer for supporting-document uploads. Files land in the ONE shared
// uploads folder (<UPLOADS_BASE_DIR>/leave-documents), which matches the
// /uploads static mount in server.js and the
// /uploads/leave-documents/<file> path written by uploadDocument.
const multer = require('multer');
const path = require('path');
const UPLOADS_BASE_DIR = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOADS_BASE_DIR, 'leave-documents');
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

// ============================================
// GET ROUTES — ORDER IS CRITICAL
// ============================================
// Express matches routes in REGISTRATION ORDER and the param route below
// ('/:id') matches ANY single path segment — including 'all', 'balances' and
// 'my-leaves'. While '/:id' was declared first every one of those requests was
// swallowed by getLeaveById, which looked for a leave request whose primary
// key was the literal string 'all' / 'balances' / 'my-leaves', found nothing
// and answered 404 "Leave request not found".
//
// Effect on the HR dashboard: /leaves/all and /leaves/balances always came
// back 404, so the page rendered real KPI numbers next to permanently empty
// tables ("No leave requests submitted yet", "No employees found yet") — the
// contradictory, unreadable dashboard that was reported. /leaves/my-leaves was
// 404 too, so employees saw an empty "My leaves" list.
//
// Keep every static GET route ABOVE '/:id' (two-segment routes such as
// '/stats/overview' were safe, but they stay here for one obvious rule).
router.get('/all', getAllLeaves);
router.get('/my-leaves', getMyLeaves);

// Leave balances
router.get('/balances', getAllLeaveBalances);
router.get('/balance/:user_id', getLeaveBalance);

// Dashboard & stats
router.get('/stats/overview', getLeaveStats);
router.get('/users/on-leave', getUsersOnLeave);

// Employee manual day additions (HR employee leave panel)
router.get('/admin/additions/:user_id', getUserDayAdditions);

// Get a single leave request by ID — MUST stay last among the GET routes.
router.get('/:id', getLeaveById);

// ============================================
// WRITE ROUTES
// ============================================

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

module.exports = router;
