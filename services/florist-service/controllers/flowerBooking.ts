/**
 * Flower Booking Controller
 * Handles CRUD operations for flower bookings only (no customer management)
 */

// @ts-ignore
import { safeQuery, safeExecute } from '../database.ts';
import axios from 'axios';
import crypto from 'crypto';

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
// TENANT HELPERS
//   Bookings are scoped by TENANT ID ONLY - never by branch.
//   The tenant id is sent by the UI as the `x-tenant-id` header (the UI reads
//   `tenantId` from localStorage after login, see AuthContext/authApi.js).
//   `tenant_slug` is kept as a legacy fallback for rows that have not been
//   back-filled with a tenant_id yet.
// ============================================

const tenantIdOf = (req: any): string | null =>
    req.tenantId || req.headers?.['x-tenant-id'] || req.headers?.['x-tenant_id'] || null;

const tenantSlugOf = (req: any): string | null =>
    req.tenant?.tenant_slug || req.tenantSlug || null;

/**
 * Build a tenant WHERE fragment used by every booking query.
 * Uses ONLY the tenant id when available; falls back to tenant_slug.
 */
const buildTenantScope = (req: any): { clause: string; params: any[] } => {
    const tenantId = tenantIdOf(req);
    const tenantSlug = tenantSlugOf(req);

    if (tenantId) {
        return { clause: 'tenant_id = ?', params: [tenantId] };
    }
    if (tenantSlug && tenantSlug !== 'system_shared') {
        return { clause: 'tenant_slug = ?', params: [tenantSlug] };
    }
    return { clause: '1=1', params: [] };
};

/**
 * Parse a JSON column value that was selected with CAST(... AS CHAR).
 * Tolerates legacy non-JSON text (e.g. "WREATHS,SPRAYS").
 */
const parseJsonArray = (value: any): any[] => {
    if (value == null || value === '') return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch (e) {
            return value.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    }
    return [value];
};

/**
 * Globally-unique booking id. The old count-based scheme
 * (FLW-{24000 + tenantCount + 1}) collided across tenants and after deletions.
 */
const generateBookingId = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `FLW-${timestamp}-${random}`;
};

// ============================================
// BOOKINGS
// ============================================

/**
 * GET /florist/bookings
 * List all flower bookings with optional filters
 */
export const getBookings = async (req: any, res: any) => {
    try {
        const tenantId = tenantIdOf(req);
        const tenantSlug = tenantSlugOf(req);
        const { status, branch, flower_type, date_from, date_to, search, page = '1', limit = '20' } = req.query;

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // Tenant isolation: use ONLY the tenant id (no branches). Falls back
        // to tenant_slug for legacy rows that have no tenant_id yet.
        const tenantScope = buildTenantScope(req);
        if (tenantScope.clause !== '1=1') {
            whereClause += ` AND ${tenantScope.clause}`;
            params.push(...tenantScope.params);
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
        const countResult = await safeQuery(
            `SELECT COUNT(*) as total FROM flower_bookings ${whereClause}`,
            params
        );
        const total = countResult[0]?.total || 0;

        // Paginate
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Newest FIRST. This was `ORDER BY date DESC, time ASC`, which sorted by
        // DELIVERY date and then put the EARLIEST time of that day on top — so the
        // booking the user had just created sat below older entries, and the top of
        // the list was never the most recent thing. created_at/id is the real
        // "when was this entered" clock; date/time still break ties for rows
        // created in the same instant so the order stays stable.
        const bookings = await safeQuery(
            `SELECT * FROM flower_bookings ${whereClause}
             ORDER BY created_at DESC, id DESC, date DESC, time DESC
             LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        // Enrich bookings with arrangement details from flower_samples
        const enrichedBookings = await Promise.all(
            bookings.map(async (booking: any) => {
                try {
                    const arrangementQuery = `SELECT title, CAST(types AS CHAR) AS types, CAST(images AS CHAR) AS images FROM flower_samples WHERE arrangement_id = ? AND (tenant_id = ? OR tenant_slug = ?) LIMIT 1`;
                    const arrangements = await safeQuery(arrangementQuery, [booking.arrangement_id, tenantId, tenantSlug]);

                    if (arrangements && arrangements.length > 0) {
                        const arr = arrangements[0];
                        return {
                            ...booking,
                            arrangement: {
                                ...arr,
                                types: parseJsonArray(arr.types),
                                images: parseJsonArray(arr.images)
                            }
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
        const tenantScope = buildTenantScope(req);
        const { id } = req.params;

        const bookings = await safeQuery(
            `SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND ${tenantScope.clause} LIMIT 1`,
            [id, id, ...tenantScope.params]
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
        const tenantId = tenantIdOf(req);
        const tenantSlug = tenantSlugOf(req);
        const {
            arrangement_name, arrangement_id, deceased_name, booked_by,
            funeral_home, date, time, notes, phone, email, branch: branchFromPayload,
            ribbon_color, size, arrangements, flower_type: flowerTypeFromBody,
            flower_description: flowerDescriptionFromBody, quantity, primary_color,
            accent_color, ribbon_message, special_instructions, funeral_date, deceased_gender,
            service_type: serviceTypeFromBody
        } = req.body;

        // Map frontend fields to backend schema
        // The sample the client picked is the headline flower type — fall back
        // through flower_type so a booking always names a real arrangement
        // instead of a bare "Custom Arrangement".
        const flower_type = arrangement_name || flowerTypeFromBody || 'Custom Arrangement';
        const flower_description = flowerDescriptionFromBody || '';
        const service_type = serviceTypeFromBody || 'Funeral service before final burial';
        const customer = booked_by || 'Guest';
        const customer_phone = phone || '';
        const customer_email = email || '';
        // Branch the flowers are coming from - resolved by the UI from the
        // logged-in user's branch context; optional.
        const branch = branchFromPayload || funeral_home || 'Not specified';

        // Every arrangement booked in this order (usually 1, but a client can
        // pick several samples) is stored as JSON so the dashboard can list
        // them as real line items instead of guessing from a single name.
        const normalisedArrangements = (Array.isArray(arrangements) ? arrangements : [])
            .map(item => {
                if (typeof item === 'string') return { arrangement_id: null, name: item, quantity: 1, types: [], colors: [] };
                return {
                    arrangement_id: item?.arrangement_id ?? null,
                    name: item?.name || item?.title || null,
                    types: Array.isArray(item?.types) ? item.types : [],
                    colors: Array.isArray(item?.colors) ? item.colors : [],
                    quantity: Math.max(1, Number(item?.quantity) || 1)
                };
            })
            .filter(item => item.name);
        const arrangementsJson = normalisedArrangements.length
            ? JSON.stringify(normalisedArrangements)
            : null;
        const totalQuantity = normalisedArrangements.length
            ? normalisedArrangements.reduce((total, item) => total + item.quantity, 0)
            : Math.max(1, Number(quantity) || 1);

        // Validation - "Expected By" (date/time) is NOT a must
        if (!customer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: booked by (customer name) is required'
            });
        }

        // Generate a globally-unique booking ID
        const booking_id = generateBookingId();

        const result = await safeExecute(
            `INSERT INTO flower_bookings
            (booking_id, tenant_slug, tenant_id, flower_type, flower_description, customer,
             customer_phone, customer_email, deceased_name, deceased_gender, branch,
             arrangement_id, date, time, status, notes, created_by, ribbon_color, size, arrangements,
             quantity, primary_color, accent_color, ribbon_message, special_instructions, funeral_date, service_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
            [
                booking_id, tenantSlug, tenantId, flower_type, flower_description, customer,
                customer_phone || '', customer_email || '', deceased_name || '', deceased_gender || null, branch,
                arrangement_id || null, date || null, time || null, notes || '', req.tenantSlug || 'system',
                ribbon_color || null, size || null, arrangementsJson, totalQuantity,
                primary_color || null, accent_color || null, ribbon_message || null,
                special_instructions || null, funeral_date || null, service_type
            ]
        );

        const newBooking = await safeQuery(
            `SELECT * FROM flower_bookings WHERE booking_id = ? AND ${tenantId ? 'tenant_id = ?' : 'tenant_slug = ?'} LIMIT 1`,
            tenantId ? [booking_id, tenantId] : [booking_id, tenantSlug || 'system_shared']
        );

        // Emit real-time notification for new booking
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/flower-booking-created`, {
                tenantSlug: tenantSlug || 'system',
                data: {
                    id: `flower-booking-created-${booking_id}-${Date.now()}`,
                    bookingId: booking_id,
                    customer: customer,
                    flowerType: flower_type,
                    deceasedName: deceased_name || '',
                    status: 'pending',
                    title: 'New Flower Booking',
                    message: `New flower booking ${booking_id} created for ${customer}`,
                    type: 'new_booking',
                    priority: 'medium',
                    fullContent: `Booking ID: ${booking_id}\nCustomer: ${customer}\nFlower Type: ${flower_type}\nDeceased: ${deceased_name || 'N/A'}\nStatus: pending`,
                }
            }, { timeout: 5000 });
            console.log(`[FLORIST] Emitted flower-booking-created for ${booking_id}`);
        } catch (emitError: any) {
            console.warn('[FLORIST] Failed to emit flower-booking-created notification:', emitError.message);
        }

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
        const tenantScope = buildTenantScope(req);
        const { id } = req.params;
        const updates = req.body;

        // Check booking exists
        const existing = await safeQuery(
            `SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND ${tenantScope.clause} LIMIT 1`,
            [id, id, ...tenantScope.params]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Build SET clause dynamically
        const allowedFields = [
            'flower_type', 'flower_description', 'customer',
            'customer_phone', 'customer_email', 'deceased_name', 'branch',
            'arrangement_id', 'arrangements', 'date', 'time', 'status', 'notes',
            'ribbon_color', 'primary_color', 'accent_color', 'ribbon_message',
            'size', 'quantity', 'special_instructions', 'funeral_date', 'service_type'
        ];

        const setClauses: string[] = [];
        const params: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                params.push(field === 'arrangements' && updates[field] !== null
                    ? JSON.stringify(updates[field])
                    : updates[field]);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        params.push(existing[0].id);
        params.push(...tenantScope.params);

        await safeExecute(
            `UPDATE flower_bookings SET ${setClauses.join(', ')} WHERE id = ? AND ${tenantScope.clause}`,
            params
        );

        const updated = await safeQuery(
            `SELECT * FROM flower_bookings WHERE id = ? AND ${tenantScope.clause} LIMIT 1`,
            [existing[0].id, ...tenantScope.params]
        );

        // Emit real-time notification for booking update
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/flower-booking-updated`, {
                tenantSlug: req.tenantSlug || 'system',
                data: {
                    id: `flower-booking-updated-${id}-${Date.now()}`,
                    bookingId: updated[0]?.booking_id || id,
                    customer: updated[0]?.customer || '',
                    status: updated[0]?.status || '',
                    title: 'Booking Updated',
                    message: `Flower booking ${updated[0]?.booking_id || id} has been updated`,
                    type: 'booking_update',
                    priority: 'medium',
                    fullContent: `Booking ID: ${updated[0]?.booking_id || id}\nCustomer: ${updated[0]?.customer || ''}\nStatus: ${updated[0]?.status || ''}`,
                }
            }, { timeout: 5000 });
            console.log(`[FLORIST] Emitted flower-booking-updated for ${id}`);
        } catch (emitError: any) {
            console.warn('[FLORIST] Failed to emit flower-booking-updated notification:', emitError.message);
        }

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
        const tenantScope = buildTenantScope(req);
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const result = await safeExecute(
            `UPDATE flower_bookings SET status = ? WHERE (id = ? OR booking_id = ?) AND ${tenantScope.clause}`,
            [status, id, id, ...tenantScope.params]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        const updated = await safeQuery(
            `SELECT * FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND ${tenantScope.clause} LIMIT 1`,
            [id, id, ...tenantScope.params]
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
        const tenantScope = buildTenantScope(req);
        const { id } = req.params;

        const result = await safeExecute(
            `DELETE FROM flower_bookings WHERE (id = ? OR booking_id = ?) AND ${tenantScope.clause}`,
            [id, id, ...tenantScope.params]
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
        const tenantScope = buildTenantScope(req);

        const totalResult = await safeQuery(`SELECT COUNT(*) as total FROM flower_bookings WHERE ${tenantScope.clause}`, tenantScope.params);
        const total = totalResult[0]?.total || 0;

        const statusCounts = await safeQuery(
            `SELECT status, COUNT(*) as count FROM flower_bookings WHERE ${tenantScope.clause} GROUP BY status`,
            tenantScope.params
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
        const tenantScope = buildTenantScope(req);

        const trend = await safeQuery(
            `SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                COUNT(*) as count
             FROM flower_bookings
             WHERE ${tenantScope.clause}
               AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(date, '%Y-%m')
             ORDER BY month ASC`,
            tenantScope.params
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