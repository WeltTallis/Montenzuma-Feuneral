import { safeQuery, getHearseConnection } from '../database';
import { getKenyaTimeISO, getKenyaDate } from '@montezuma/shared-utils';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { Request, Response } from 'express';

// Types
interface HearseBooking {
    id?: number;
    booking_code?: string;
    hearse_id?: number;
    tenant_db_name?: string;
    client_name: string;
    client_phone: string;
    client_email?: string;
    destination: string;
    booking_date?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    branch_id?: number;
    branch_code?: string;
    booked_by?: string;
    from_timestamp?: string;
    to_timestamp?: string;
    special_requests?: string;
}

interface Hearse {
    id?: number;
    hearse_code?: string;
    hearse_name?: string;
    plate_number?: string;
    model?: string;
    capacity?: number;
    branch_id?: number;
    branch_code?: string;
}

/**
 * Create a new hearse booking
 */
export const makeHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const {
            hearse_id,
            deceased_id,
            client_name,
            client_phone,
            client_email,
            destination,
            special_remarks,
            from_timestamp,
            to_timestamp,
            from_location,
            to_location,
            booked_by
        } = req.body;

        if (!destination) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required field: destination.'
            });
            return;
        }

        if (!client_name) {
            res.status(400).json({
                status: 'error',
                message: 'Client name is required.'
            });
            return;
        }

        if (hearse_id) {
            const bookingDate = from_timestamp ? new Date(from_timestamp) : new Date();
            const bookingDateStr = bookingDate.toISOString().split('T')[0];

            const connection = await getHearseConnection();
            try {
                await connection.beginTransaction();
                const [hearseRows] = await connection.query(
                    'SELECT id, status FROM hearses WHERE id = ? FOR UPDATE',
                    [hearse_id]
                );
                const hearse = hearseRows[0] as Hearse;

                if (!hearse) {
                    await connection.rollback();
                    connection.release();
                    res.status(404).json({
                        status: 'error',
                        message: 'The selected hearse does not exist.'
                    });
                    return;
                }

                // CRITICAL: Check if this hearse is already booked for the SAME DAY
                // A hearse can only be booked ONCE per day
                const [sameDayBookingRows] = await connection.query(
                    `SELECT id, booking_code, booking_date FROM hearse_bookings 
                     WHERE hearse_id = ? 
                     AND DATE(booking_date) = DATE(?)
                     AND status NOT IN ('completed', 'cancelled') 
                     LIMIT 1`,
                    [hearse_id, from_timestamp || bookingDateStr]
                );
                const sameDayBooking = sameDayBookingRows[0];

                if (sameDayBooking) {
                    await connection.rollback();
                    connection.release();
                    res.status(409).json({
                        status: 'error',
                        message: 'This hearse is already booked for this date. A hearse can only be booked once per day. Please choose another date or vehicle.',
                        existing_booking_id: sameDayBooking.id,
                        existing_booking_code: sameDayBooking.booking_code,
                        conflict_date: from_timestamp || bookingDateStr
                    });
                    return;
                }

                // CRITICAL: Check if this hearse has ANY active bookings (across all dates)
                // A hearse can only have ONE active booking at a time
                const [activeBookingRows] = await connection.query(
                    `SELECT id, booking_code, booking_date FROM hearse_bookings 
                     WHERE hearse_id = ? 
                     AND status NOT IN ('completed', 'cancelled') 
                     LIMIT 1`,
                    [hearse_id]
                );
                const activeBooking = activeBookingRows[0];

                if (activeBooking) {
                    await connection.rollback();
                    connection.release();
                    res.status(409).json({
                        status: 'error',
                        message: 'This hearse already has an active booking. A hearse can only have one booking at a time. Please complete or cancel the existing booking first.',
                        existing_booking_id: activeBooking.id,
                        existing_booking_code: activeBooking.booking_code,
                        existing_booking_date: activeBooking.booking_date
                    });
                    return;
                }

                await connection.commit();
                connection.release();
            } catch (txError) {
                await connection.rollback();
                connection.release();
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to verify hearse availability. Please try again.'
                });
                return;
            }
        }

        let deceasedNote = '';
        if (deceased_id && deceased_id.trim() !== '') {
            try {
                const [deceased] = await safeQuery(
                    'SELECT deceased_id FROM deceased WHERE deceased_id = ? LIMIT 1',
                    [deceased_id.trim()]
                );
                if (!deceased) {
                    deceasedNote = `Provided deceased ID (${deceased_id}) not found — booking saved anyway.`;
                }
            } catch (err) {
                deceasedNote = 'Deceased validation skipped - table may not exist.';
            }
        } else {
            deceasedNote = 'No deceased ID provided — booking saved without deceased record.';
        }

        const remarks = special_remarks
            ? `${special_remarks.trim()} ${deceasedNote ? `(${deceasedNote})` : ''}`
            : deceasedNote || null;

        const now = getKenyaTimeISO();

        try {
            const [idResult] = await safeQuery(
                'SELECT COUNT(*) as count FROM hearse_bookings',
                []
            );
            const bookingNumber = String((idResult.count || 0) + 1).padStart(3, '0');
            var booking_code = `BK-${bookingNumber}`;
        } catch (err) {
            var booking_code = `BK-${Date.now().toString().slice(-6)}`;
        }

        // Use simple text input for created_by - no user table references
        const createdByName = req.body.booked_by || req.body.created_by || 'System';
        const tenantDbName = (req as any).tenantSlug || 'system';
        const bookingStatus = 'booked';

        const insertQuery = `
            INSERT INTO hearse_bookings
            (booking_code, hearse_id, tenant_db_name, client_name, client_phone, client_email, destination,
             booking_date, status, created_at, updated_at,
             booked_by, from_location, to_location, booking_dates)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
            booking_code,
            hearse_id || null,
            tenantDbName,
            client_name.trim(),
            client_phone.trim(),
            client_email || null,
            destination.trim(),
            from_timestamp || now,
            bookingStatus,
            now,
            now,
            createdByName,
            req.body.from_location || null,
            req.body.to_location || null,
            req.body.booking_dates ? JSON.stringify(req.body.booking_dates) : null
        ];

        const result = await safeQuery(insertQuery, insertParams);
        const bookingDbId = result.insertId;

        if (hearse_id) {
            await safeQuery(
                'UPDATE hearses SET status = ?, updated_at = ? WHERE id = ?',
                ['booked', now, hearse_id]
            );
        }

        const [booking] = await safeQuery(
            `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.client_email, hb.destination, hb.from_timestamp, hb.to_timestamp, hb.status, hb.booking_date, hb.created_at, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`,
            [bookingDbId]
        );

        if (io && booking) {
            io.emit('new_booking', {
                type: 'NEW_BOOKING',
                booking_id: booking.booking_id,
                booking: booking,
                timestamp: now,
                message: `New booking created for ${booking.client_name}`
            });
        }

        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/hearse-booking-created`, {
                tenantSlug: tenantDbName || 'system',
                data: {
                    id: `hearse-booking-${booking_code}-${Date.now()}`,
                    bookingId: booking_code,
                    clientName: client_name,
                    destination: destination,
                    hearseId: hearse_id || '',
                    title: 'New Hearse Booking',
                    message: `New hearse booking: ${client_name} to ${destination}`,
                    type: 'new_booking',
                    priority: 'high',
                    fullContent: `Booking Code: ${booking_code}\nClient: ${client_name}\nPhone: ${client_phone}\nDestination: ${destination}\nHearse: ${hearse_id || 'Not assigned'}`,
                }
            }, { timeout: 5000 });
        } catch (emitError) {
            // Notification emit failure is non-critical
        }

        res.status(201).json({
            status: 'success',
            message: 'Hearse booking created successfully and hearse status updated.',
            booking: { ...booking, booking_code: booking_code, status: bookingStatus }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Server error while creating booking.',
            error: process.env.NODE_ENV === 'development' ? (error as any).sqlMessage : undefined
        });
    }
});

/**
 * Get all hearse bookings
 */
export const getAllHearseBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { branch_id, status } = req.query;
        const whereClauses: string[] = [];
        const params: any[] = [];

        if (branch_id && branch_id !== 'all') {
            whereClauses.push('h.branch_id = ?');
            params.push(branch_id);
        }
        if (status && status !== 'all') {
            whereClauses.push('hb.status = ?');
            params.push(status);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const query = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.client_email, hb.destination, hb.from_timestamp, hb.to_timestamp, hb.status, hb.booking_date, hb.created_at, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity, h.branch_id, h.branch_code AS branch_code, h.branch_name AS branch_name FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id ${whereSQL} ORDER BY hb.created_at DESC`;

        const bookings = await safeQuery(query, params);
        const allBranches = await safeQuery(`SELECT DISTINCT branch_id, branch_code, branch_name FROM hearses WHERE branch_id IS NOT NULL ORDER BY branch_name ASC`);

        res.status(200).json({ status: 'success', total: bookings.length, bookings, branches: allBranches });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch hearse bookings.' });
    }
});

/**
 * Assign or change a driver for a booking
 */
export const assignDriverToBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { booking_id } = req.params;
        const { driver_id } = req.body;

        if (!driver_id) {
            res.status(400).json({ status: 'error', message: 'Driver ID is required.' });
            return;
        }

        const [booking] = await safeQuery('SELECT hearse_id FROM hearse_bookings WHERE id = ?', [booking_id]) as [HearseBooking];
        if (!booking) {
            res.status(404).json({ status: 'error', message: `Booking with ID ${booking_id} not found.` });
            return;
        }

        let driverName = 'Unknown';
        try {
            const [driver] = await safeQuery('SELECT id, driver_name FROM drivers WHERE id = ?', [driver_id]);
            if (!driver) {
                res.status(404).json({ status: 'error', message: `Driver with ID ${driver_id} not found.` });
                return;
            }
            driverName = (driver as any).driver_name;
        } catch (err) {
            // Drivers table may not exist
        }

        await safeQuery('UPDATE hearses SET driver_id = ?, updated_at = ? WHERE id = ?', [driver_id, getKenyaTimeISO(), booking.hearse_id]);

        res.status(200).json({ status: 'success', message: `Driver ${driverName} assigned successfully to the hearse.`, booking_id, driver_id, driver_name: driverName });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Failed to assign driver.' });
    }
});

/**
 * Update booking status
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const { booking_id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'booked', 'in_transit', 'postponed'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ status: 'error', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        const [booking] = await safeQuery('SELECT * FROM hearse_bookings WHERE id = ?', [booking_id]) as [HearseBooking];
        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found.' });
            return;
        }

        const now = getKenyaTimeISO();
        await safeQuery('UPDATE hearse_bookings SET status = ?, updated_at = ? WHERE id = ?', [status, now, booking_id]);

        if (['completed', 'cancelled'].includes(status) && booking.hearse_id) {
            await safeQuery('UPDATE hearses SET status = ?, updated_at = ? WHERE id = ?', ['available', now, booking.hearse_id]);
        }

        const [updatedBooking] = await safeQuery(`SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.client_email, hb.destination, hb.status, hb.booking_date, hb.created_at, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`, [booking_id]);

        if (io && updatedBooking) {
            io.emit('booking_status_updated', { type: 'STATUS_UPDATE', booking_id: parseInt(booking_id as string), status, booking: updatedBooking, timestamp: now, message: `Booking status updated to ${status}` });
        }

        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/hearse-booking-updated`, {
                tenantSlug: (req as any).tenantSlug || 'system',
                data: {
                    id: `hearse-booking-updated-${booking_id}-${Date.now()}`,
                    bookingId: (updatedBooking as any)?.booking_code || booking_id,
                    clientName: (updatedBooking as any)?.client_name || '',
                    status: status,
                    title: 'Hearse Booking Updated',
                    message: `Hearse booking ${(updatedBooking as any)?.booking_code || booking_id} status changed to ${status}`,
                    type: 'booking_update',
                    priority: 'medium',
                    fullContent: `Booking Code: ${(updatedBooking as any)?.booking_code || booking_id}\nClient: ${(updatedBooking as any)?.client_name || ''}\nNew Status: ${status}`,
                }
            }, { timeout: 5000 });
        } catch (emitError) {
            // Non-critical
        }

        res.status(200).json({ status: 'success', message: `Booking status updated to '${status}'.`, booking_id, booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update booking status.' });
    }
});

/**
 * Postpone a booking
 */
export const postponeHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const { booking_id } = req.params;
        const { new_departure_time, reason } = req.body;

        if (!new_departure_time) {
            res.status(400).json({ status: 'error', message: 'New departure time is required.' });
            return;
        }

        const [booking] = await safeQuery('SELECT * FROM hearse_bookings WHERE id = ?', [booking_id]) as [HearseBooking];
        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found.' });
            return;
        }

        const now = getKenyaTimeISO();
        await safeQuery(`UPDATE hearse_bookings SET booking_date = ?, from_timestamp = ?, special_requests = CONCAT(IFNULL(special_requests, ''), ' Postponed: ', ?), status = ?, updated_at = ? WHERE id = ?`, [new_departure_time, new_departure_time, reason || 'Postponed by client', 'pending', now, booking_id]);

        if (booking.hearse_id) {
            await safeQuery('UPDATE hearses SET status = ?, updated_at = ? WHERE id = ?', ['available', now, booking.hearse_id]);
        }

        if (io) {
            io.emit('booking_postponed', { booking_id, new_departure_time, reason, performed_by: req.headers['x-user-name'] || 'System' });
        }

        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/hearse-booking-postponed`, {
                tenantSlug: (req as any).tenantSlug || 'system',
                data: {
                    id: `hearse-booking-postponed-${booking_id}-${Date.now()}`,
                    bookingId: booking_id,
                    newDepartureTime: new_departure_time,
                    reason: reason || 'No reason provided',
                    title: 'Hearse Booking Postponed',
                    message: `Hearse booking ${booking_id} postponed to ${new_departure_time}`,
                    type: 'postponement',
                    priority: 'medium',
                    fullContent: `Booking ID: ${booking_id}\nNew Departure: ${new_departure_time}\nReason: ${reason || 'Not provided'}`,
                }
            }, { timeout: 5000 });
        } catch (emitError) {
            // Non-critical
        }

        res.status(200).json({ status: 'success', message: 'Booking postponed successfully.', data: { booking_id, new_departure_time, reason, status: 'pending' } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error while postponing booking.' });
    }
});

/**
 * Get all drivers
 */
export const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
    try {
        let drivers: any[] = [];
        try {
            drivers = await safeQuery(`SELECT id AS driver_id, driver_name, driver_phone, license_number, status, created_at FROM drivers ORDER BY driver_name ASC`, []);
        } catch (driverErr) {
            drivers = [];
        }
        res.status(200).json({ status: 'success', total: drivers.length, drivers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch drivers.' });
    }
});

/**
 * Get all bookings assigned to a specific driver
 */
export const getBookingsByDriver = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { driver_id } = req.params;
        if (!driver_id) {
            res.status(400).json({ status: 'error', message: 'Driver ID is required.' });
            return;
        }

        const query = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.client_email, hb.destination, hb.status AS booking_status, hb.from_timestamp, hb.to_timestamp, hb.special_requests, hb.created_at, h.id AS hearse_id, h.plate_number, h.model, h.status AS hearse_status FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE h.driver_id = ? ORDER BY hb.created_at DESC`;
        const bookings = await safeQuery(query, [driver_id]);
        res.status(200).json({ status: 'success', total: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch bookings for this driver.' });
    }
});

/**
 * Get availability across branches
 */
export const getAvailabilityAcrossBranches = asyncHandler(async (req: Request, res: Response) => {
    try {
        const bookings = await safeQuery(`SELECT hb.id AS booking_id, hb.status, hb.destination, hb.booking_date, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.status NOT IN ('completed', 'cancelled') ORDER BY hb.created_at DESC`, []);
        res.status(200).json({ status: 'success', total: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch availability across branches.', error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined });
    }
});

/**
 * Check availability by date
 */
export const checkAvailabilityByDate = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ status: 'error', message: 'Date parameter is required' });
            return;
        }

        const allHearses = await safeQuery('SELECT id, hearse_code, hearse_name, plate_number, status FROM hearses', []);
        const bookings = await safeQuery(`SELECT hb.id, hb.booking_code, hb.status, hb.booking_date, h.id AS hearse_id, h.plate_number, h.hearse_name FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE DATE(hb.booking_date) = ? AND hb.status NOT IN ('cancelled', 'completed')`, [date]);

        const bookedHearseIds = [...new Set(bookings.map((b: any) => b.hearse_id).filter(Boolean))];
        const availableHearses = allHearses.filter((h: any) => !bookedHearseIds.includes(h.id) && h.status === 'available');

        res.status(200).json({ status: 'success', date: date, available_hearses: availableHearses, booked_hearses: bookings, total_available: availableHearses.length, total_booked: bookings.length });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to check availability.' });
    }
});

/**
 * Get upcoming bookings (reminders)
 */
export const getUpcomingBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { days = '7' } = req.query;
        const daysAhead = parseInt(days as string) || 7;
        
        const bookings = await safeQuery(`
            SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, 
                   hb.destination, hb.booking_date, hb.from_timestamp, hb.to_timestamp, 
                   hb.status, h.hearse_name, h.plate_number, h.model,
                   DATEDIFF(hb.booking_date, CURDATE()) as days_until
            FROM hearse_bookings hb
            LEFT JOIN hearses h ON hb.hearse_id = h.id
            WHERE hb.booking_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND hb.status NOT IN ('completed', 'cancelled')
            ORDER BY hb.booking_date ASC, hb.from_timestamp ASC
        `, [daysAhead]);

        // Emit reminder notification for bookings in the next 24-48 hours
        const urgentBookings = bookings.filter((b: any) => b.days_until <= 2);
        if (urgentBookings.length > 0) {
            try {
                const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                await axios.post(`${socketioServiceUrl}/emit/hearse-booking-reminder`, {
                    tenantSlug: (req as any).tenantSlug || 'system',
                    data: {
                        id: `hearse-reminder-${Date.now()}`,
                        upcomingCount: urgentBookings.length,
                        bookings: urgentBookings.map((b: any) => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            destination: b.destination,
                            bookingDate: b.booking_date,
                            daysUntil: b.days_until,
                            hearse: b.hearse_name || b.plate_number
                        })),
                        title: 'Upcoming Hearse Bookings',
                        message: `You have ${urgentBookings.length} hearse booking(s) in the next 48 hours`,
                        type: 'reminder',
                        priority: 'high',
                        fullContent: `Upcoming Bookings:\n${urgentBookings.map((b: any) => 
                            `• ${b.booking_code} - ${b.client_name} (${b.destination}) on ${b.booking_date} (${b.days_until} days)`
                        ).join('\n')}`
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                // Non-critical
            }
        }

        res.status(200).json({ 
            status: 'success', 
            total: bookings.length, 
            bookings,
            reminder_count: urgentBookings.length
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch upcoming bookings.' });
    }
});

/**
 * Get driver dashboard
 */
export const getDriverDashboard = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { driver_id } = req.params;
        const io = req.app.get('io');

        try {
            const [driver] = await safeQuery('SELECT * FROM drivers WHERE id = ?', [driver_id]);
            if (!driver) {
                res.status(404).json({ status: 'error', message: 'Driver not found.' });
                return;
            }

            const [overview] = await safeQuery(`SELECT COUNT(hb.id) AS total_bookings, SUM(CASE WHEN hb.status = 'pending' THEN 1 ELSE 0 END) AS total_pending, SUM(CASE WHEN hb.status = 'in_progress' THEN 1 ELSE 0 END) AS total_in_progress, SUM(CASE WHEN hb.status = 'confirmed' THEN 1 ELSE 0 END) AS total_confirmed, SUM(CASE WHEN hb.status = 'completed' THEN 1 ELSE 0 END) AS total_completed, SUM(CASE WHEN hb.status = 'cancelled' THEN 1 ELSE 0 END) AS total_cancelled, MAX(hb.updated_at) AS last_updated FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE h.driver_id = ?`, [driver_id]);

            const recentBookings = await safeQuery(`SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.destination, hb.status, hb.special_requests, DATE_FORMAT(hb.created_at, '%Y-%m-%d %H:%i') AS created_at, h.plate_number, h.model FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE h.driver_id = ? ORDER BY hb.created_at DESC LIMIT 5`, [driver_id]);

            const completionRate = overview.total_bookings > 0 ? ((overview.total_completed / overview.total_bookings) * 100).toFixed(1) : 0;

            const dashboardData = {
                driver: { id: (driver as any).id, name: (driver as any).driver_name, phone: (driver as any).driver_phone, license: (driver as any).license_number, status: (driver as any).status },
                stats: { total_bookings: overview.total_bookings || 0, total_pending: overview.total_pending || 0, total_in_progress: overview.total_in_progress || 0, total_confirmed: overview.total_confirmed || 0, total_completed: overview.total_completed || 0, total_cancelled: overview.total_cancelled || 0, completion_rate: completionRate, last_updated: overview.last_updated },
                recent_bookings: recentBookings || [],
            };

            if (io) {
                io.emit(`driver_dashboard_${driver_id}`, dashboardData);
            }

            res.status(200).json({ status: 'success', message: 'Driver dashboard fetched successfully.', data: dashboardData });
        } catch (err) {
            res.status(200).json({ status: 'success', message: 'Driver dashboard (simplified)', data: { driver: { id: driver_id, name: 'Driver', status: 'active' }, stats: { total_bookings: 0, completion_rate: 0 }, recent_bookings: [] } });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch driver dashboard data.' });
    }
});
