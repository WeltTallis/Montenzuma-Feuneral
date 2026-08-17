/**
 * Flower Booking Controller
 * Handles CRUD operations for flower bookings only (no customer management)
 */

// @ts-ignore
import { getTenantDB, safeTenantQuery, safeTenantExecute } from '../../../shared/dbConfig.js';

interface Booking {
    id?: number;
    booking_id: string;
    flower_type: string;
    flower_description?: string;
    customer: string;
    customer_phone?: string;
    customer_email?: string;
    deceased_name?: string;
    branch: string;
    arrangement_id?: string;
    date: string;
    time: string;
    status: string;
    notes?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// BOOKINGS
// ============================================

/**
 * GET /florist/bookings
 * List all flower bookings with optional filters
 */
export const getBookings = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const { status, branch, flower_type, date_from, date_to, search, page = '1', limit = '20' } = req.query;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // Add tenant isolation if not system_shared
        if (tenantSlug && tenantSlug !== 'system_shared') {
            whereClause += ' AND tenant_slug = ?';
            params.push(tenantSlug);
        }

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        if (branch) {
            whereClause += ' AND branch = ?';
            params.push(branch);
        }
        if (flower_type) {
            whereClause += ' AND flower_type = ?';
            params.push(flower_type);
        }
        if (date_from) {
            whereClause += ' AND date >= ?';
            params.push(date_from);
        }
        if (date_to) {
            whereClause += ' AND date <= ?';
            params.push(date_to);
        }
        if (search) {
            whereClause += ' AND (customer LIKE ? OR booking_id LIKE ? OR deceased_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Count total
        const countResult = await safeTenantQuery(
            dbName,
            `SELECT COUNT(*) as total FROM flower_bookings ${whereClause}`,
            params
        );
        const total = countResult[0]?.total || 0;

        // Paginate
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const bookings = await safeTenantQuery(
            dbName,
            `SELECT * FROM flower_bookings ${whereClause} ORDER BY date DESC, time ASC LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        // Enrich bookings with arrangement details from flower_samples
        const enrichedBookings = await Promise.all(
            bookings.map(async (booking: any) => {
                try {
                    const arrangementQuery = `SELECT title, types, images FROM flower_samples WHERE arrangement_id = ? AND tenant_slug = ? LIMIT 1`;
                    const arrangements = await safeTenantQuery(dbName, arrangementQuery, [booking.arrangement_id, tenantSlug]);
                    
                    if (arrangements && arrangements.length > 0) {
                        return {
                            ...booking,
                            arrangement: arrangements[0]
                        };
                    }
                    return booking;
                } catch (e) {
                    return booking;
                }
            })
        );

        res.json({
            success: true,
            data: enrichedBookings,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('[FLORIST] Error fetching bookings:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings', message: error.message });
    }
};

/**
 * GET /florist/bookings/:id
 * Get a single booking by ID
 */
export const getBookingById = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const { id } = req.params;

        const bookings = await safeTenantQuery(
            dbName,
            'SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND tenant_slug = ? LIMIT 1',
            [id, id, tenantSlug]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.json({ success: true, data: bookings[0] });
    } catch (error: any) {
        console.error('[FLORIST] Error fetching booking:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch booking', message: error.message });
    }
};

/**
 * POST /florist/bookings
 * Create a new flower booking
 */
export const createBooking = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const {
            arrangement_name, arrangement_id, deceased_name, booked_by,
            funeral_home, date, time, notes, phone, email
        } = req.body;

        // Map frontend fields to backend schema
        const flower_type = arrangement_name || 'Custom Arrangement';
        const flower_description = notes || '';
        const customer = booked_by || 'Guest';
        const customer_phone = phone || '';
        const customer_email = email || '';
        const branch = funeral_home || 'Not specified';

        // Validation
        if (!date || !time || !customer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: date, time, and customer name are required'
            });
        }

        // Generate booking ID
        const countResult = await safeTenantQuery(
            dbName,
            'SELECT COUNT(*) as total FROM flower_bookings WHERE tenant_slug = ?',
            [tenantSlug]
        );
        const count = countResult[0]?.total || 0;
        const booking_id = `FLW-${24000 + count + 1}`;

        const result = await safeTenantQuery(
            dbName,
            `INSERT INTO flower_bookings 
            (booking_id, tenant_slug, flower_type, flower_description, customer, 
             customer_phone, customer_email, deceased_name, branch, 
             arrangement_id, date, time, status, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [
                booking_id, tenantSlug, flower_type, flower_description, customer,
                customer_phone || '', customer_email || '', deceased_name || '', branch,
                arrangement_id || null, date, time || '10:00', notes || '', req.tenantSlug || 'system'
            ]
        );

        const newBooking = await safeTenantQuery(
            dbName,
            'SELECT * FROM flower_bookings WHERE booking_id = ? AND tenant_slug = ? LIMIT 1',
            [booking_id, tenantSlug]
        );

        res.status(201).json({ success: true, data: newBooking[0], message: 'Booking created successfully' });
    } catch (error: any) {
        console.error('[FLORIST] Error creating booking:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create booking', message: error.message });
    }
};

/**
 * PUT /florist/bookings/:id
 * Update an existing booking
 */
export const updateBooking = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const { id } = req.params;
        const updates = req.body;

        // Check booking exists
        const existing = await safeTenantQuery(
            dbName,
            'SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND tenant_slug = ? LIMIT 1',
            [id, id, tenantSlug]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Build SET clause dynamically
        const allowedFields = [
            'flower_type', 'flower_description', 'customer',
            'customer_phone', 'customer_email', 'deceased_name', 'branch',
            'arrangement_id', 'date', 'time', 'status', 'notes'
        ];

        const setClauses: string[] = [];
        const params: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                params.push(updates[field]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        params.push(existing[0].id);
        params.push(tenantSlug);

        await safeTenantQuery(
            dbName,
            `UPDATE flower_bookings SET ${setClauses.join(', ')} WHERE id = ? AND tenant_slug = ?`,
            params
        );

        const updated = await safeTenantQuery(
            dbName,
            'SELECT * FROM flower_bookings WHERE id = ? AND tenant_slug = ? LIMIT 1',
            [existing[0].id, tenantSlug]
        );

        res.json({ success: true, data: updated[0], message: 'Booking updated successfully' });
    } catch (error: any) {
        console.error('[FLORIST] Error updating booking:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update booking', message: error.message });
    }
};

/**
 * PATCH /florist/bookings/:id/status
 * Update booking status only
 */
export const updateBookingStatus = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const result = await safeTenantExecute(
            dbName,
            'UPDATE flower_bookings SET status = ? WHERE (id = ? OR booking_id = ?) AND tenant_slug = ?',
            [status, id, id, tenantSlug]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const updated = await safeTenantQuery(
            dbName,
            'SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND tenant_slug = ? LIMIT 1',
            [id, id, tenantSlug]
        );

        // Emit notification for booking status update
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/flower-booking-updated`, {
                tenantSlug: req.tenantSlug || 'system',
                data: {
                    id: `flower-booking-updated-${id}-${Date.now()}`,
                    bookingId: updated[0]?.booking_id || id,
                    customer: updated[0]?.customer || '',
                    status: status,
                    title: 'Booking Status Updated',
                    message: `Flower booking ${updated[0]?.booking_id || id} status changed to ${status}`,
                    type: 'booking_update',
                    priority: 'medium',
                    fullContent: `Booking ID: ${updated[0]?.booking_id || id}\nCustomer: ${updated[0]?.customer || ''}\nNew Status: ${status}`,
                }
            }, { timeout: 5000 });
            console.log(`[FLORIST] Emitted flower-booking-updated for ${id}`);
        } catch (emitError: any) {
            console.warn('[FLORIST] Failed to emit flower-booking-updated notification:', emitError.message);
        }

        res.json({ success: true, data: updated[0], message: `Status updated to ${status}` });
    } catch (error: any) {
        console.error('[FLORIST] Error updating booking status:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update status', message: error.message });
    }
};

/**
 * DELETE /florist/bookings/:id
 * Delete a booking
 */
export const deleteBooking = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';
        const { id } = req.params;

        const result = await safeTenantExecute(
            dbName,
            'DELETE FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND tenant_slug = ?',
            [id, id, tenantSlug]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Emit notification for booking deletion
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/flower-booking-deleted`, {
                tenantSlug: req.tenantSlug || 'system',
                data: {
                    id: `flower-booking-deleted-${id}-${Date.now()}`,
                    bookingId: id,
                    title: 'Booking Cancelled',
                    message: `Flower booking ${id} has been cancelled/deleted`,
                    type: 'removal',
                    priority: 'low',
                    fullContent: `Booking ID: ${id}\nStatus: Cancelled/Deleted`,
                }
            }, { timeout: 5000 });
            console.log(`[FLORIST] Emitted flower-booking-deleted for ${id}`);
        } catch (emitError: any) {
            console.warn('[FLORIST] Failed to emit flower-booking-deleted notification:', emitError.message);
        }

        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error: any) {
        console.error('[FLORIST] Error deleting booking:', error.message);
        res.status(500).json({ success: false, error: 'Failed to delete booking', message: error.message });
    }
};

// ============================================
// DASHBOARD / STATS
// ============================================

/**
 * GET /florist/stats
 * Get dashboard statistics
 */
export const getStats = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';

        const totalResult = await safeTenantQuery(dbName, 'SELECT COUNT(*) as total FROM flower_bookings WHERE tenant_slug = ?', [tenantSlug]);
        const total = totalResult[0]?.total || 0;

        const statusCounts = await safeTenantQuery(
            dbName,
            'SELECT status, COUNT(*) as count FROM flower_bookings WHERE tenant_slug = ? GROUP BY status',
            [tenantSlug]
        );

        const statusMap: Record<string, number> = {};
        statusCounts.forEach((row: any) => { statusMap[row.status] = row.count; });

        res.json({
            success: true,
            data: {
                total,
                pending: statusMap['pending'] || 0,
                confirmed: statusMap['confirmed'] || 0,
                preparing: statusMap['preparing'] || 0,
                completed: statusMap['completed'] || 0,
                cancelled: statusMap['cancelled'] || 0,
                inProgress: (statusMap['confirmed'] || 0) + (statusMap['preparing'] || 0)
            }
        });
    } catch (error: any) {
        console.error('[FLORIST] Error fetching stats:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch stats', message: error.message });
    }
};

/**
 * GET /florist/stats/monthly-trend
 * Get monthly booking trend for last 6 months
 */
export const getMonthlyTrend = async (req: any, res: any) => {
    try {
        const dbName = req.tenant?.db_name || process.env.OPERATIONS_DATABASE || 'restpoint_operations';
        const tenantSlug = req.tenant?.tenant_slug || req.tenantSlug || 'system_shared';

        const trend = await safeTenantQuery(
            dbName,
            `SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                COUNT(*) as count
             FROM flower_bookings
             WHERE tenant_slug = ?
               AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(date, '%Y-%m')
             ORDER BY month ASC`,
            [tenantSlug]
        );

        res.json({ success: true, data: trend });
    } catch (error: any) {
        console.error('[FLORIST] Error fetching monthly trend:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch trend', message: error.message });
    }
};

// ============================================
// EXPORTED ROUTES (for Express router)
// ============================================

export default {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    getStats,
    getMonthlyTrend
};