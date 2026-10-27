const { safeTenantQuery, safeTenantExecute } = require('../../../shared/dbConfig');
const { validateTenantActive } = require('../../../shared/tenancy');
// NOTE: do NOT require('./server') at module load — server.js loads this
// module (via leaveRoutes), so a top-level require is circular and yields an
// empty export. emitUpdate() below requires it lazily instead.

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

const DEFAULT_LEAVE_DAYS = 26; // Each user has 26 days of leave per year by default

// ============================================
// HELPER: Get tenant slug from request
// ============================================
const getTenantSlug = (req) => {
    return req.tenantSlug || req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared';
};

// ============================================
// HELPER: Emit real-time updates
// ============================================
// NOTE: './server' requires THIS module (server.js → leaveRoutes →
// leaveController → './server'), so requiring it at module load time returns
// an empty partial export — `io` was always undefined here and every
// real-time leave update was silently dropped. Requiring lazily (after
// server.js has finished loading and set module.exports) gets the live io
// instance.
//
// THAT STILL WAS NOT ENOUGH, and this is why the frontend had to poll.
// The browser never connects to THIS service's Socket.IO server — it connects
// to the platform socketio-service (utils/context/socketContext.jsx), a
// completely separate instance. Emitting on `io` alone reached a server nobody
// was subscribed to, so `leave:updated` never arrived and the sidebar had to
// re-GET /leaves/my-leaves every 60s, which is what kept tripping the API
// gateway's rate limiter.
//
// Every other service (coffin, bodycheckout, deceased, florist…) publishes to
// the shared bus by POSTing to SOCKETIO_SERVICE_URL/emit/:event. Leave now does
// the same, so the browser's single socket carries leave events too.
const SOCKETIO_SERVICE_URL =
    process.env.SOCKETIO_SERVICE_URL ||
    'http://restpoint_socketio_service:5000';

/** Bridge a leave event onto the platform socket bus. Fire-and-forget. */
const emitToSharedBus = (tenantSlug, event, data) => {
    // /emit validates the slug against /^[a-z0-9-]+$/ and the event against
    // /^[a-zA-Z0-9-_]+$/. Checking here avoids firing a request whose only
    // possible outcome is a 400 we would then ignore.
    if (!tenantSlug || !/^[a-z0-9-]+$/.test(String(tenantSlug))) return;
    if (!/^[a-zA-Z0-9\-_]+$/.test(String(event))) return;

    // Deliberately NOT awaited: a slow or unreachable socketio-service must
    // never delay the HTTP response the leave request itself returned on.
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const abortTimer = controller ? setTimeout(() => controller.abort(), 3000) : null;

    Promise.resolve()
        .then(() => fetch(`${SOCKETIO_SERVICE_URL}/emit/${event}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantSlug, data: data || {} }),
            ...(controller ? { signal: controller.signal } : {}),
        }))
        .then((res) => {
            if (abortTimer) clearTimeout(abortTimer);
            if (!res.ok) console.warn(`[LEAVE] socket emit ${event} -> HTTP ${res.status}`);
        })
        .catch((e) => {
            if (abortTimer) clearTimeout(abortTimer);
            console.warn(`[LEAVE] socket emit ${event} failed: ${e?.message}`);
        });
};

const emitUpdate = (tenantSlug, event, data) => {
    const { io } = require('../server');
    if (io) {
        io.to(`tenant_${tenantSlug}`).emit(event, data);
        io.to('admin').emit(event, data);
    }

    // The delivery path the browser actually listens on.
    emitToSharedBus(tenantSlug, event, data);
};

// ============================================
// HELPER: Generate human-friendly leave reference code (LRQ-JOHN-7K4M2)
// Format: LRQ-<FIRSTNAME>-<5 unambiguous chars> (no 0/O/1/I/L for readability)
// ============================================
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generateLeaveRef = (fullName) => {
    const namePart = String(fullName || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 8) || 'EMP';
    const bytes = require('crypto').randomBytes(5);
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
    }
    return `LRQ-${namePart}-${code}`;
};

// ============================================
// HELPER: The employee details every leave query needs.
//
// This used to be an INNER JOIN on `u.full_name`, which caused two bugs that
// made the request panel show the wrong (or no) employee:
//   1. An inner join DROPPED the whole request when the user row was missing or
//      deleted, so a real leave request simply vanished from the list.
//   2. `full_name` alone was used, so anyone whose full_name is blank showed an
//      empty "Employee" field even though the account had a username/email.
// The branch is joined too, so the detail panel can show where the person works.
// ============================================
const LEAVE_SELECT = `SELECT lr.*,
        COALESCE(NULLIF(u.full_name, ''), NULLIF(u.username, ''), u.email) AS name,
        u.email,
        COALESCE(NULLIF(u.username, ''), NULLIF(u.full_name, '')) AS username,
        COALESCE(NULLIF(b.branch_name, ''), NULLIF(u.branch_id, '')) AS branch
FROM leave_requests lr
LEFT JOIN users u ON lr.user_id = u.user_id
LEFT JOIN branches b ON u.branch_id = b.branch_id`;

// ============================================
// HELPER: Calculate leave balance
// ============================================
const calculateLeaveBalance = async (dbName, userId, tenantSlug) => {
    try {
        // Get initial balance from users table
        const userRows = await safeTenantQuery(
            dbName,
            `SELECT annual_leave_balance,
                    COALESCE(NULLIF(full_name, ''), NULLIF(username, ''), email) AS full_name,
                    email
             FROM users WHERE user_id = ?`,
            [userId]
        );

        // Default to 26 days if not set
        const initialBalance = parseFloat(userRows[0]?.annual_leave_balance) || DEFAULT_LEAVE_DAYS;

        // If balance is 0 or null, update it to 26
        if (!userRows[0]?.annual_leave_balance || parseFloat(userRows[0]?.annual_leave_balance) === 0) {
            await safeTenantExecute(
                dbName,
                'UPDATE users SET annual_leave_balance = 26.00 WHERE user_id = ?',
                [userId]
            );
        }

        // Get manual additions (filtered by tenant_slug if provided)
        let additionQuery = 'SELECT COALESCE(SUM(days), 0) as total FROM leave_day_additions WHERE user_id = ?';
        let additionParams = [userId];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            additionQuery += ' AND tenant_slug = ?';
            additionParams.push(tenantSlug);
        }
        const additionRows = await safeTenantQuery(dbName, additionQuery, additionParams);
        const manualAdditions = parseFloat(additionRows[0]?.total) || 0;

        // Get holiday compensations (filtered by tenant_slug if provided)
        let holidayQuery = 'SELECT COUNT(*) as count FROM holiday_compensations WHERE user_id = ?';
        let holidayParams = [userId];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            holidayQuery += ' AND tenant_slug = ?';
            holidayParams.push(tenantSlug);
        }
        const holidayRows = await safeTenantQuery(dbName, holidayQuery, holidayParams);
        const holidayCompensations = parseInt(holidayRows[0]?.count) || 0;

        // Get leave taken (only approved annual leave, filtered by tenant_slug if provided)
        let takenQuery = 'SELECT COALESCE(SUM(days), 0) as total FROM leave_requests WHERE user_id = ? AND leave_type = ? AND status = ?';
        let takenParams = [userId, LEAVE_TYPES.ANNUAL, LEAVE_STATUS.APPROVED];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            takenQuery += ' AND tenant_slug = ?';
            takenParams.push(tenantSlug);
        }
        const takenRows = await safeTenantQuery(dbName, takenQuery, takenParams);
        const leaveTaken = parseFloat(takenRows[0]?.total) || 0;

        // Get pending leave days (pending annual leave, filtered by tenant_slug if provided)
        let pendingQuery = 'SELECT COALESCE(SUM(days), 0) as total FROM leave_requests WHERE user_id = ? AND leave_type = ? AND status = ?';
        let pendingParams = [userId, LEAVE_TYPES.ANNUAL, LEAVE_STATUS.PENDING];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            pendingQuery += ' AND tenant_slug = ?';
            pendingParams.push(tenantSlug);
        }
        const pendingRows = await safeTenantQuery(dbName, pendingQuery, pendingParams);
        const pendingDays = parseFloat(pendingRows[0]?.total) || 0;

        // Calculate current balance
        const currentBalance = initialBalance + manualAdditions + holidayCompensations - leaveTaken;

        return {
            initial: initialBalance,
            manualAdditions,
            holidayCompensations,
            leaveTaken,
            pendingDays,
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const userId = req.headers['x-user-id'] || req.body.user_id;

    const {
        leave_type,
        start_date,
        end_date,
        reason,
        supporting_document,
        is_half_day = false,
        priority = 'medium'
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
            const balance = await calculateLeaveBalance(dbName, userId, tenantSlug);
            if (balance.currentBalance < days) {
                return res.status(400).json({
                    status: 'error',
                    message: `Insufficient leave balance. Available: ${balance.currentBalance} days, Requested: ${days} days`
                });
            }
        }

        // Create leave request with tenant_slug
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO leave_requests 
       (user_id, tenant_slug, leave_type, priority, start_date, end_date, days, reason, supporting_document, is_half_day, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, tenantSlug, leave_type, priority, start_date, end_date, days, reason || null, supporting_document || null, is_half_day, LEAVE_STATUS.PENDING]
        );

        const leaveId = result.insertId;

        // Get the created leave request
        const leaveRows = await safeTenantQuery(
            dbName,
            `${LEAVE_SELECT} 
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const { status, leave_type, start_date, end_date, user_id } = req.query;

    try {
        let query = `${LEAVE_SELECT} 
                 WHERE 1=1`;
        const params = [];

        // Filter by tenant_slug for isolation
        if (tenantSlug && tenantSlug !== 'system_shared') {
            query += ' AND lr.tenant_slug = ?';
            params.push(tenantSlug);
        }

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

        const rows = await safeTenantQuery(dbName, query, params);

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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const userId = req.headers['x-user-id'] || req.params.user_id || req.query.user_id;

    if (!userId) {
        // Never run "WHERE lr.user_id = NULL" — that silently matches nothing
        // and looks exactly like "my applied leave disappeared". Say so instead.
        console.warn(`[LEAVE] getMyLeaves: no user id on request (x-user-id header / params / query all missing). tenant=${tenantSlug}. The frontend must send x-user-id (axios interceptor) or ?user_id=.`);
        return res.status(200).json({
            status: 'success',
            count: 0,
            data: [],
            warning: 'No user id on request — cannot look up leave requests'
        });
    }

    try {
        let query = `${LEAVE_SELECT} 
       WHERE lr.user_id = ?`;
        const params = [userId];

        if (tenantSlug && tenantSlug !== 'system_shared') {
            query += ' AND lr.tenant_slug = ?';
            params.push(tenantSlug);
        }

        query += ' ORDER BY lr.created_at DESC';

        const rows = await safeTenantQuery(dbName, query, params);

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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const leaveId = req.params.id;

    try {
        let query = `${LEAVE_SELECT} 
       WHERE lr.id = ?`;
        const params = [leaveId];

        if (tenantSlug && tenantSlug !== 'system_shared') {
            query += ' AND lr.tenant_slug = ?';
            params.push(tenantSlug);
        }

        const rows = await safeTenantQuery(dbName, query, params);

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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
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
        let leaveQuery = 'SELECT * FROM leave_requests WHERE id = ? AND status = ?';
        let leaveParams = [leaveId, LEAVE_STATUS.PENDING];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            leaveQuery += ' AND tenant_slug = ?';
            leaveParams.push(tenantSlug);
        }
        const leaveRows = await safeTenantQuery(dbName, leaveQuery, leaveParams);

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
        const updatedRows = await safeTenantQuery(
            dbName,
            `${LEAVE_SELECT} 
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const leaveId = req.params.id;

    try {
        // Get leave request
        let leaveQuery = 'SELECT * FROM leave_requests WHERE id = ? AND status = ?';
        let leaveParams = [leaveId, LEAVE_STATUS.PENDING];
        if (tenantSlug && tenantSlug !== 'system_shared') {
            leaveQuery += ' AND tenant_slug = ?';
            leaveParams.push(tenantSlug);
        }
        const leaveRows = await safeTenantQuery(dbName, leaveQuery, leaveParams);

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
        const updatedRows = await safeTenantQuery(
            dbName,
            `${LEAVE_SELECT} 
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
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
        const rows = await safeTenantQuery(
            dbName,
            `${LEAVE_SELECT} 
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const { start_date, end_date } = req.query;

    try {
        const params = [];
        const conditions = [];

        if (start_date && end_date) {
            conditions.push('lr.start_date >= ?');
            conditions.push('lr.end_date <= ?');
            params.push(start_date, end_date);
        }

        if (tenantSlug && tenantSlug !== 'system_shared') {
            conditions.push('lr.tenant_slug = ?');
            params.push(tenantSlug);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : 'WHERE 1=1';

        // Total leaves
        const totalRows = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as total FROM leave_requests lr ${whereClause}`,
            params
        );

        // Leaves by status
        const statusRows = await safeTenantQuery(
            dbName,
            `SELECT status, COUNT(*) as count 
       FROM leave_requests lr 
       ${whereClause}
       GROUP BY status`,
            params
        );

        // Leaves by type
        const typeRows = await safeTenantQuery(
            dbName,
            `SELECT leave_type, COUNT(*) as count, SUM(days) as total_days 
       FROM leave_requests lr 
       ${whereClause}
       GROUP BY leave_type`,
            params
        );

        // Ensure by_status and by_type are always arrays
        const byStatus = Array.isArray(statusRows) ? statusRows : [];
        const byType = Array.isArray(typeRows) ? typeRows : [];

        // Pending approvals
        const pendingRows = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as pending FROM leave_requests lr ${whereClause} AND lr.status = 'pending'`,
            [...params, 'pending']
        );

        // Currently on leave
        const onLeaveParams = [];
        const onLeaveConditions = ['status = ?', "CURDATE() BETWEEN start_date AND end_date"];
        onLeaveParams.push(LEAVE_STATUS.APPROVED);
        if (tenantSlug && tenantSlug !== 'system_shared') {
            onLeaveConditions.push('tenant_slug = ?');
            onLeaveParams.push(tenantSlug);
        }
        const onLeaveRows = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as on_leave FROM leave_requests lr WHERE ${onLeaveConditions.join(' AND ')}`,
            onLeaveParams
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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';

    try {
        let query = `${LEAVE_SELECT} 
       WHERE lr.status = 'approved' 
       AND CURDATE() BETWEEN lr.start_date AND lr.end_date`;
        const params = [];

        if (tenantSlug && tenantSlug !== 'system_shared') {
            query += ' AND lr.tenant_slug = ?';
            params.push(tenantSlug);
        }

        query += ' ORDER BY lr.start_date ASC';

        const rows = await safeTenantQuery(dbName, query, params);

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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const { user_id, days, reason, added_by } = req.body;

    try {
        // Number() so 'abc' can never sneak past validation (NaN comparisons are
        // always false, so the old `days < 1` check alone let garbage through and
        // MySQL silently coerced it to 0).
        const daysNum = Number(days);
        if (!user_id || !daysNum || daysNum < 1) {
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

        // Record the addition with tenant_slug
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO leave_day_additions (user_id, tenant_slug, days, reason, added_by, created_at) 
       VALUES (?, ?, ?, ?, ?, CURDATE())`,
            [user_id, tenantSlug, daysNum, reason, added_by || req.headers['x-user-id'] || 'system']
        );

        const additionId = result.insertId;

        // Get the created record
        const additionRows = await safeTenantQuery(
            dbName,
            `SELECT lda.*, u.full_name AS name, u.email 
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
        const additionRows = await safeTenantQuery(
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
// GET USER DAY ADDITIONS (Admin)
// Lists every manual leave-day addition recorded for ONE employee — used by
// the HR employee leave panel so HR can see (and undo) each adjustment and
// how it changed that person's balance.
// ============================================
const getUserDayAdditions = async (req, res) => {
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const userId = req.params.user_id;

    try {
        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        let query = `SELECT lda.*, u.full_name AS name, u.email
       FROM leave_day_additions lda
       LEFT JOIN users u ON lda.user_id = u.user_id
       WHERE lda.user_id = ?`;
        const params = [userId];

        if (tenantSlug && tenantSlug !== 'system_shared') {
            query += ' AND lda.tenant_slug = ?';
            params.push(tenantSlug);
        }

        query += ' ORDER BY lda.created_at DESC, lda.id DESC';

        const rows = await safeTenantQuery(dbName, query, params);
        const additionsArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);

        return res.status(200).json({
            status: 'success',
            count: additionsArray.length,
            data: additionsArray
        });

    } catch (error) {
        console.error('Error fetching leave day additions:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch leave day additions',
            error: error.message
        });
    }
};

// ============================================
// RECORD HOLIDAY COMPENSATION (Admin)
// ============================================
const recordHolidayCompensation = async (req, res) => {
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const { user_id, holiday_date, holiday_name, note, recorded_by } = req.body;

    try {
        if (!user_id || !holiday_date || !holiday_name) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID, holiday date, and holiday name are required'
            });
        }

        // Record the holiday compensation with tenant_slug
        const result = await safeTenantExecute(
            dbName,
            `INSERT INTO holiday_compensations (user_id, tenant_slug, holiday_date, holiday_name, note, recorded_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE note = VALUES(note), created_at = NOW()`,
            [user_id, tenantSlug, holiday_date, holiday_name, note || null, recorded_by || 1]
        );

        const compensationId = result.insertId;

        // Get the created record
        const compensationRows = await safeTenantQuery(
            dbName,
            `SELECT hc.*, u.full_name AS name, u.email 
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
// ADD EMPLOYEE (Admin) - creates a user with default 26 leave days
// ============================================
const addEmployee = async (req, res) => {
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const { full_name, email, phone, role, branch_id } = req.body;

    try {
        if (!full_name || !email) {
            return res.status(400).json({
                status: 'error',
                message: 'Full name and email are required'
            });
        }

        // Check if email already exists
        const existingRows = await safeTenantQuery(
            dbName,
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );
        if (existingRows && existingRows.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'An employee with this email already exists',
                data: existingRows[0]
            });
        }

        // Generate a default password hash (Password@123) using bcryptjs if available
        let passwordHash;
        try {
            const bcrypt = require('bcryptjs');
            passwordHash = bcrypt.hashSync('Password@123', 10);
        } catch (err) {
            // Fallback placeholder hash (valid bcrypt format for 'password')
            passwordHash = '$2a$10$EqKcp1XrGhYAX7jYtM1s8eV5V3nIjsxlZJqU1mOLHdBvNXpypXPLu';
        }

        // Inspect available columns so the insert works across tenant schema variants
        const colsRows = await safeTenantQuery(dbName, 'SHOW COLUMNS FROM users');
        const availableCols = (Array.isArray(colsRows) ? colsRows : []).map(c => c.Field);

        const insertCols = ['email', 'password_hash', 'full_name'];
        const placeholders = ['?', '?', '?'];
        const values = [email, passwordHash, full_name];

        if (availableCols.includes('username')) {
            insertCols.push('username');
            placeholders.push('?');
            values.push(email.split('@')[0] + '_' + Date.now().toString().slice(-4));
        }
        if (availableCols.includes('phone')) {
            insertCols.push('phone');
            placeholders.push('?');
            values.push(phone || null);
        }
        if (availableCols.includes('role')) {
            insertCols.push('role');
            placeholders.push('?');
            values.push(role || 'staff');
        }
        if (availableCols.includes('branch_id')) {
            insertCols.push('branch_id');
            placeholders.push('?');
            values.push(branch_id || null);
        }
        if (availableCols.includes('is_active')) {
            insertCols.push('is_active');
            placeholders.push('?');
            values.push(true);
        }
        if (availableCols.includes('is_verified')) {
            insertCols.push('is_verified');
            placeholders.push('?');
            values.push(true);
        }
        if (availableCols.includes('annual_leave_balance')) {
            insertCols.push('annual_leave_balance');
            placeholders.push('?');
            values.push(DEFAULT_LEAVE_DAYS);
        }

        const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const result = await safeTenantExecute(dbName, sql, values);
        const userId = result.insertId;

        // Get the created employee
        const userRows = await safeTenantQuery(
            dbName,
            'SELECT user_id, COALESCE(NULLIF(full_name, \'\'), NULLIF(username, \'\'), email) AS name, email, phone, role, annual_leave_balance FROM users WHERE user_id = ?',
            [userId]
        );

        const employee = userRows[0] || { user_id: userId, name: full_name, email };

        // Emit real-time update
        emitUpdate(tenantSlug, 'leave:employee_added', employee);

        return res.status(201).json({
            status: 'success',
            message: `Employee added successfully with ${DEFAULT_LEAVE_DAYS} days of leave per year`,
            data: employee
        });

    } catch (error) {
        console.error('Error adding employee:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to add employee',
            error: error.message
        });
    }
};
// ============================================
// GET LEAVE BALANCE (User/Admin)
// ============================================
const getLeaveBalance = async (req, res) => {
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';
    const userId = req.params.user_id || req.headers['x-user-id'];

    try {
        const balance = await calculateLeaveBalance(dbName, userId, tenantSlug);

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
    const tenantSlug = getTenantSlug(req);
    const dbName = req.tenant?.db_name || process.env.DB_NAME || 'restpoint_main';

    try {
        // Get all users
        const users = await safeTenantQuery(
            dbName,
            `SELECT user_id,
                    COALESCE(NULLIF(full_name, ''), NULLIF(username, ''), email) AS full_name,
                    email, annual_leave_balance
             FROM users ORDER BY full_name ASC`
        );

        // Calculate balance for each user
        const balances = await Promise.all(
            users.map(async (user) => {
                const balance = await calculateLeaveBalance(dbName, user.user_id, tenantSlug);
                return {
                    user_id: user.user_id,
                    name: user.full_name,
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
    getUserDayAdditions,
    recordHolidayCompensation,
    addEmployee,
    getLeaveBalance,
    getAllLeaveBalances,
    calculateLeaveBalance,
    LEAVE_TYPES,
    LEAVE_STATUS,
    DEFAULT_LEAVE_DAYS
};
