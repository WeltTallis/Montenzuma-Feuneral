const { safeTenantQuery, safeTenantExecute } = require('../../shared/dbConfig');
const { validateTenantActive } = require('../../shared/tenancy');
const { io } = require('./server');

// ============================================
// LEAVE TYPES
// ============================================
const LEAVE_TYPES = {
    ANNUAL: 'annual',
    SICK: 'sick',
    MATERNITY: 'maternity',
    PATERNITY: 'paternity',
    COMPASSIONATE: 'compassionate',
    STUDY: 'study',
    UNPAID: 'unpaid'
};

const LEAVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
};

const DEFAULT_LEAVE_DAYS = 26;

// ============================================
// HELPER: Emit real-time updates
// ============================================
const emitUpdate = (tenantSlug, event, data) => {
    if (io) {
        io.to(`tenant_${tenantSlug}`).emit(event, data);
        io.to('admin').emit(event, data);
    }
};

// ============================================
// HELPER: Calculate leave balance
// ============================================
const calculateLeaveBalance = async (dbName, userId) => {
    try {
        // Get initial balance
        const [userRows] = await safeTenantQuery(
            dbName,
            'SELECT annual_leave_balance FROM users WHERE user_id = ?',
            [userId]
        );
        const initialBalance = parseFloat(userRows[0]?.annual_leave_balance) || DEFAULT_LEAVE_DAYS;

        // Get manual additions
        const [additionRows] = await safeTenantQuery(
            dbName,
            'SELECT COALESCE(SUM(days), 0) as total FROM leave_day_additions WHERE user_id = ?',
            [userId]
        );
        const manualAdditions = parseFloat(additionRows[0]?.total) || 0;

        // Get holiday compensations
        const [holidayRows] = await safeTenantQuery(
            dbName,
            'SELECT COUNT(*) as count FROM holiday_compensations WHERE user_id = ?',
            [userId]
        );
        const holidayCompensations = parseInt(holidayRows[0]?.count) || 0;

        // Get leave taken (only approved annual leave)
        const [takenRows] = await safeTenantQuery(
            dbName,
            'SELECT COALESCE(SUM(days), 0) as total FROM leave_requests WHERE user_id = ? AND leave_type = ? AND status = ?',
            [userId, LEAVE_TYPES.ANNUAL, LEAVE_STATUS.APPROVED]
        );
        const leaveTaken = parseFloat(takenRows[0]?.total) || 0;

        // Calculate current balance
        const currentBalance = initialBalance + manualAdditions + holidayCompensations - leaveTaken;

        return {
            initial: initialBalance,
            manualAdditions,
            holidayCompensations,
            leaveTaken,
            currentBalance
        };
    } catch (error) {
        console.error('Error calculating leave balance:', error);
        return {
            initial: DEFAULT_LEAVE_DAYS,
            manualAdditions: 0,
            holidayCompensations: 0,
            leaveTaken: 0,
            currentBalance: DEFAULT_LEAVE_DAYS
        };
    }
};

// ============================================
// APPLY FOR LEAVE
// ============================================
const applyForLeave = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const userId = req.headers['x-user-id'] || req.body.user_id;

    const {
        leave_type,
        start_date,
        end_date,
        reason,
        supporting_document,
        is_half_day = false
    } = req.body;

    try {
        // Validate input
        if (!leave_type || !start_date || !end_date) {
            return res.status(400).json({
                status: 'error',
                message: 'Leave type, start date, and end date are required'
            });
        }

        if (!Object.values(LEAVE_TYPES).includes(leave_type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid leave type'
            });
        }

        // Calculate days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (days < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'End date must be after start date'
            });
        }

        // Check if user has enough leave balance (for annual leave)
        if (leave_type === LEAVE_TYPES.ANNUAL) {
            const [balanceRows] = await safeTenantQuery(
                dbName,
                'SELECT annual_leave_balance FROM users WHERE user_id = ? LIMIT 1',
                [userId]
            );

            const currentBalance = balanceRows[0]?.annual_leave_balance ?? 21.00;
            if (currentBalance < days) {
                return res.status(400).json({
                    status: 'error',
                    message: `Insufficient leave balance. Available: ${currentBalance} days, Requested: ${days} days`
                });
            }
        }

        // Create leave request
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO leave_requests 
       (user_id, leave_type, start_date, end_date, days, reason, supporting_document, is_half_day, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, leave_type, start_date, end_date, days, reason || null, supporting_document || null, is_half_day, LEAVE_STATUS.PENDING]
        );

        const leaveId = result.insertId;

        // Get the created leave request
        const [leaveRows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.id = ?`,
            [leaveId]
        );

        const leaveRequest = leaveRows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:created', leaveRequest);

        return res.status(201).json({
            status: 'success',
            message: 'Leave request submitted successfully',
            data: leaveRequest
        });

    } catch (error) {
        console.error('Error applying for leave:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to apply for leave',
            error: error.message
        });
    }
};

// ============================================
// GET ALL LEAVES (Admin view)
// ============================================
const getAllLeaves = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const { status, leave_type, start_date, end_date, user_id } = req.query;

    try {
        let query = `SELECT lr.*, u.name, u.email 
                 FROM leave_requests lr 
                 JOIN users u ON lr.user_id = u.user_id 
                 WHERE 1=1`;
        const params = [];

        if (status) {
            query += ' AND lr.status = ?';
            params.push(status);
        }

        if (leave_type) {
            query += ' AND lr.leave_type = ?';
            params.push(leave_type);
        }

        if (user_id) {
            query += ' AND lr.user_id = ?';
            params.push(user_id);
        }

        if (start_date) {
            query += ' AND lr.start_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND lr.end_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY lr.created_at DESC';

        const [rows] = await safeTenantQuery(dbName, query, params);

        // Ensure rows is always an array
        const leavesArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        return res.status(200).json({
            status: 'success',
            count: leavesArray.length,
            data: leavesArray
        });

    } catch (error) {
        console.error('Error fetching leaves:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leaves',
            error: error.message
        });
    }
};

// ============================================
// GET MY LEAVES (Employee view)
// ============================================
const getMyLeaves = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const userId = req.headers['x-user-id'] || req.params.user_id;

    try {
        const [rows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.user_id = ? 
       ORDER BY lr.created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching my leaves:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leaves',
            error: error.message
        });
    }
};

// ============================================
// GET LEAVE BY ID
// ============================================
const getLeaveById = async (req, res) => {
    const dbName = req.tenant.db_name;
    const leaveId = req.params.id;

    try {
        const [rows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.id = ?`,
            [leaveId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave request not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching leave:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leave',
            error: error.message
        });
    }
};

// ============================================
// APPROVE/REJECT LEAVE
// ============================================
const updateLeaveStatus = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const leaveId = req.params.id;
    const { status, rejection_reason, approved_by } = req.body;

    try {
        // Validate status
        if (!Object.values(LEAVE_STATUS).includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status'
            });
        }

        // Get leave request
        const [leaveRows] = await safeTenantQuery(
            dbName,
            'SELECT * FROM leave_requests WHERE id = ? AND status = ?',
            [leaveId, LEAVE_STATUS.PENDING]
        );

        if (!leaveRows || leaveRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave request not found or already processed'
            });
        }

        const leave = leaveRows[0];

        // Update leave status
        await safeTenantExecute(
            dbName,
            `UPDATE leave_requests 
       SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
            [status, rejection_reason || null, approved_by || null, leaveId]
        );

        // If approved, update user's leave balance
        if (status === LEAVE_STATUS.APPROVED) {
            if (leave.leave_type === LEAVE_TYPES.ANNUAL) {
                await safeTenantExecute(
                    dbName,
                    `UPDATE users 
           SET annual_leave_balance = annual_leave_balance - ? 
           WHERE user_id = ?`,
                    [leave.days, leave.user_id]
                );
            }
        }

        // Get updated leave request
        const [updatedRows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.id = ?`,
            [leaveId]
        );

        const updatedLeave = updatedRows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:updated', updatedLeave);

        return res.status(200).json({
            status: 'success',
            message: `Leave request ${status}`,
            data: updatedLeave
        });

    } catch (error) {
        console.error('Error updating leave status:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update leave status',
            error: error.message
        });
    }
};

// ============================================
// CANCEL LEAVE
// ============================================
const cancelLeave = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const leaveId = req.params.id;

    try {
        // Get leave request
        const [leaveRows] = await safeTenantQuery(
            dbName,
            'SELECT * FROM leave_requests WHERE id = ? AND status = ?',
            [leaveId, LEAVE_STATUS.PENDING]
        );

        if (!leaveRows || leaveRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave request not found or cannot be cancelled'
            });
        }

        const leave = leaveRows[0];

        // Update status to cancelled
        await safeTenantExecute(
            dbName,
            `UPDATE leave_requests 
       SET status = ?, updated_at = NOW() 
       WHERE id = ?`,
            [LEAVE_STATUS.CANCELLED, leaveId]
        );

        // Get updated leave request
        const [updatedRows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.id = ?`,
            [leaveId]
        );

        const updatedLeave = updatedRows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:updated', updatedLeave);

        return res.status(200).json({
            status: 'success',
            message: 'Leave request cancelled',
            data: updatedLeave
        });

    } catch (error) {
        console.error('Error cancelling leave:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to cancel leave',
            error: error.message
        });
    }
};

// ============================================
// UPLOAD SUPPORTING DOCUMENT
// ============================================
const uploadDocument = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const leaveId = req.params.id;

    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        const documentPath = `/uploads/leave-documents/${req.file.filename}`;

        // Update leave request with document path
        await safeTenantExecute(
            dbName,
            `UPDATE leave_requests 
       SET supporting_document = ?, updated_at = NOW() 
       WHERE id = ?`,
            [documentPath, leaveId]
        );

        // Get updated leave request
        const [rows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.id = ?`,
            [leaveId]
        );

        const updatedLeave = rows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:updated', updatedLeave);

        return res.status(200).json({
            status: 'success',
            message: 'Document uploaded successfully',
            data: updatedLeave
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to upload document',
            error: error.message
        });
    }
};

// ============================================
// GET LEAVE STATS (Dashboard)
// ============================================
const getLeaveStats = async (req, res) => {
    const dbName = req.tenant.db_name;
    const { start_date, end_date } = req.query;

    try {
        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE lr.start_date >= ? AND lr.end_date <= ?';
            params.push(start_date, end_date);
        }

        // Total leaves
        const [totalRows] = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as total FROM leave_requests lr ${dateFilter}`,
            params
        );

        // Leaves by status
        const [statusRows] = await safeTenantQuery(
            dbName,
            `SELECT status, COUNT(*) as count 
       FROM leave_requests lr 
       ${dateFilter} 
       GROUP BY status`,
            params
        );

        // Leaves by type
        const [typeRows] = await safeTenantQuery(
            dbName,
            `SELECT leave_type, COUNT(*) as count, SUM(days) as total_days 
       FROM leave_requests lr 
       ${dateFilter} 
       GROUP BY leave_type`,
            params
        );

        // Ensure by_status and by_type are always arrays
        const byStatus = Array.isArray(statusRows) ? statusRows : [];
        const byType = Array.isArray(typeRows) ? typeRows : [];

        // Pending approvals
        const [pendingRows] = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as pending FROM leave_requests lr WHERE status = 'pending' ${dateFilter.replace('WHERE', 'AND')}`,
            params
        );

        // Currently on leave
        const [onLeaveRows] = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as on_leave 
       FROM leave_requests lr 
       WHERE status = 'approved' 
       AND CURDATE() BETWEEN start_date AND end_date`,
            []
        );

        return res.status(200).json({
            status: 'success',
            data: {
                total: totalRows[0]?.total || 0,
                pending: pendingRows[0]?.pending || 0,
                on_leave: onLeaveRows[0]?.on_leave || 0,
                by_status: byStatus,
                by_type: byType
            }
        });

    } catch (error) {
        console.error('Error fetching leave stats:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leave statistics',
            error: error.message
        });
    }
};

// ============================================
// GET USERS ON LEAVE TODAY
// ============================================
const getUsersOnLeave = async (req, res) => {
    const dbName = req.tenant.db_name;

    try {
        const [rows] = await safeTenantQuery(
            dbName,
            `SELECT lr.*, u.name, u.email 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.user_id 
       WHERE lr.status = 'approved' 
       AND CURDATE() BETWEEN lr.start_date AND lr.end_date
       ORDER BY lr.start_date ASC`
        );

        // Ensure rows is always an array
        const usersArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        return res.status(200).json({
            status: 'success',
            count: usersArray.length,
            data: usersArray
        });

    } catch (error) {
        console.error('Error fetching users on leave:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users on leave',
            error: error.message
        });
    }
};

// ============================================
// ADD LEAVE DAYS (Admin)
// ============================================
const addLeaveDays = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const { user_id, days, reason, added_by } = req.body;

    try {
        if (!user_id || !days || days < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID and valid days (>= 1) are required'
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Reason is required for adding leave days'
            });
        }

        // Record the addition
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO leave_day_additions (user_id, days, reason, added_by, created_at) 
       VALUES (?, ?, ?, ?, CURDATE())`,
            [user_id, days, reason, added_by || 1]
        );

        const additionId = result.insertId;

        // Get the created record
        const [additionRows] = await safeTenantQuery(
            dbName,
            `SELECT lda.*, u.name, u.email 
       FROM leave_day_additions lda 
       JOIN users u ON lda.user_id = u.user_id 
       WHERE lda.id = ?`,
            [additionId]
        );

        const addition = additionRows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:days_added', addition);

        return res.status(201).json({
            status: 'success',
            message: `Added ${days} leave days successfully`,
            data: addition
        });

    } catch (error) {
        console.error('Error adding leave days:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to add leave days',
            error: error.message
        });
    }
};

// ============================================
// REMOVE LEAVE DAYS (Admin)
// ============================================
const removeLeaveDays = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const additionId = req.params.id;

    try {
        // Get the addition record
        const [additionRows] = await safeTenantQuery(
            dbName,
            'SELECT * FROM leave_day_additions WHERE id = ?',
            [additionId]
        );

        if (!additionRows || additionRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Leave day addition not found'
            });
        }

        const addition = additionRows[0];

        // Delete the addition
        await safeTenantExecute(
            dbName,
            'DELETE FROM leave_day_additions WHERE id = ?',
            [additionId]
        );

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:days_removed', { addition_id: additionId, user_id: addition.user_id, days: addition.days });

        return res.status(200).json({
            status: 'success',
            message: `Removed ${addition.days} leave days successfully`
        });

    } catch (error) {
        console.error('Error removing leave days:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to remove leave days',
            error: error.message
        });
    }
};

// ============================================
// RECORD HOLIDAY COMPENSATION (Admin)
// ============================================
const recordHolidayCompensation = async (req, res) => {
    const tenantSlug = req.tenantSlug;
    const dbName = req.tenant.db_name;
    const { user_id, holiday_date, holiday_name, note, recorded_by } = req.body;

    try {
        if (!user_id || !holiday_date || !holiday_name) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID, holiday date, and holiday name are required'
            });
        }

        // Record the holiday compensation
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO holiday_compensations (user_id, holiday_date, holiday_name, note, recorded_by, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE note = VALUES(note), created_at = NOW()`,
            [user_id, holiday_date, holiday_name, note || null, recorded_by || 1]
        );

        const compensationId = result.insertId;

        // Get the created record
        const [compensationRows] = await safeTenantQuery(
            dbName,
            `SELECT hc.*, u.name, u.email 
       FROM holiday_compensations hc 
       JOIN users u ON hc.user_id = u.user_id 
       WHERE hc.id = ?`,
            [compensationId]
        );

        const compensation = compensationRows[0];

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:holiday_recorded', compensation);

        return res.status(201).json({
            status: 'success',
            message: 'Holiday compensation recorded successfully',
            data: compensation
        });

    } catch (error) {
        console.error('Error recording holiday compensation:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to record holiday compensation',
            error: error.message
        });
    }
};

// ============================================
// GET LEAVE BALANCE (User/Admin)
// ============================================
const getLeaveBalance = async (req, res) => {
    const dbName = req.tenant.db_name;
    const userId = req.params.user_id || req.headers['x-user-id'];

    try {
        const balance = await calculateLeaveBalance(dbName, userId);

        return res.status(200).json({
            status: 'success',
            data: balance
        });

    } catch (error) {
        console.error('Error fetching leave balance:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leave balance',
            error: error.message
        });
    }
};

// ============================================
// GET ALL LEAVE BALANCES (Admin)
// ============================================
const getAllLeaveBalances = async (req, res) => {
    const dbName = req.tenant.db_name;

    try {
        // Get all users
        const [users] = await safeTenantQuery(
            dbName,
            'SELECT user_id, name, email, annual_leave_balance FROM users ORDER BY name ASC'
        );

        // Calculate balance for each user
        const balances = await Promise.all(
            users.map(async (user) => {
                const balance = await calculateLeaveBalance(dbName, user.user_id);
                return {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    ...balance
                };
            })
        );

        return res.status(200).json({
            status: 'success',
            count: balances.length,
            data: balances
        });

    } catch (error) {
        console.error('Error fetching all leave balances:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leave balances',
            error: error.message
        });
    }
};

module.exports = {
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
    getAllLeaveBalances,
    calculateLeaveBalance,
    LEAVE_TYPES,
    LEAVE_STATUS,
    DEFAULT_LEAVE_DAYS
};
