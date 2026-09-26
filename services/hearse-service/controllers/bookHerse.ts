import { safeQuery, getHearseConnection } from '../database';
import { getKenyaTimeISO, getKenyaDate } from '@montezuma/shared-utils';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { Request, Response } from 'express';
import {
    validateRequestedDates,
    normalizeBookingDates,
    extractRowDates,
    computeDateConflicts,
    toDateKey,
    attemptHearseReservation
} from '../utilities/hearseAvailability';
import {
    hearseStatusBadge,
    HearseAvailabilityItemDto,
    HearseBookingRequestDto,
    HearseDayAvailabilityDto,
    HearseMultiDateAvailabilityResponseDto
} from '../models/hearseBookingDto';
import { hearseCacheGet, hearseCacheSet, invalidateHearseCache, BOOKING_CACHE_TTL } from '../utilities/hearseCache';

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
 * Check hearse availability for specific dates (pre-check during form filling)
 */
export const checkHearseAvailability = asyncHandler(async (req: Request, res: Response) => {
    try {
        
        const { hearse_id, booking_dates } = req.body;

        if (!hearse_id) {
            res.status(400).json({
                status: 'error',
                message: 'hearse_id is required',
                available: false,
                conflicts: []
            });
            return;
        }

        const [hearse] = await safeQuery(
            'SELECT id, status, hearse_name, plate_number FROM hearses WHERE id = ?',
            [hearse_id]
        ) as [any];

        if (!hearse) {
            res.status(404).json({
                status: 'error',
                message: 'Hearse not found',
                available: false,
                conflicts: []
            });
            return;
        }

        // Hearses under maintenance are never bookable regardless of the date.
        if (['maintenance', 'out_of_service', 'disabled',].includes(hearse.status)) {
            res.status(200).json({
                status: 'success',
                available: false,
                hearse_id: hearse.id,
                hearse_name: hearse.hearse_name || hearse.plate_number,
                message: `Hearse is currently ${hearse.status}`,
                conflicts: [{ date: null, reason: hearse.status, message: `Hearse is currently ${hearse.status}` }]
            });
            return;
        }

        // Validate every requested date is a real calendar date AND not in the past.
        const { dates: requestedDates, conflicts: dateConflicts } = validateRequestedDates(booking_dates);

        if (dateConflicts.length > 0) {
            res.status(200).json({
                status: 'success',
                available: false,
                hearse_id: hearse.id,
                hearse_name: hearse.hearse_name || hearse.plate_number,
                conflicts: dateConflicts,
                message: 'One or more selected dates are invalid or in the past.'
            });
            return;
        }

        if (requestedDates.length === 0) {
            res.status(200).json({
                status: 'success',
                available: true,
                message: 'No dates to check',
                conflicts: []
            });
            return;
        }

        // Fetch ALL active bookings for this hearse in ONE query, then compare
        // the normalized DATE SETS (every date inside an existing booking counts).
        // NOTE: SELECT * keeps this schema-agnostic — the live table stores dates in
        // booking_dates (JSON) while older/fresh schemas use booking_date/from_timestamp.
        const existingBookings = await safeQuery(
            `SELECT * FROM hearse_bookings
             WHERE hearse_id = ?
               AND status NOT IN ('completed', 'cancelled')`,
            [hearse_id]
        );

        const bookedSet = new Set<string>();
        for (const booking of (existingBookings as any[])) {
            for (const d of extractRowDates(booking)) bookedSet.add(d);
        }

        const conflictDates = computeDateConflicts(requestedDates, [...bookedSet]);
        const conflicts = conflictDates.map((date) => ({
            date,
            reason: 'already_booked',
            message: `Hearse is already booked on ${date}`
        }));

        const available = conflicts.length === 0;

        res.status(200).json({
            status: 'success',
            available,
            hearse_id: hearse.id,
            hearse_name: hearse.hearse_name || hearse.plate_number,
            conflicts,
            message: available
                ? 'Hearse is available for all selected dates'
                : `Found ${conflicts.length} date conflict(s)`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to check availability',
            available: false,
            conflicts: []
        });
    }
});

/**
 * Create a new hearse booking
 */export const makeHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const {
            hearse_id,
            deceased_id,
            client_name,
            client_phone,
            destination,
            special_remarks,
            from_timestamp
        } = req.body;

        // ===== From / To route: two separate fields =====
        const fromLocation = (req.body.from_location || '').toString().trim();
        const toLocation = (req.body.to_location || '').toString().trim();
        const destinationValue = (destination || '').toString().trim();

        const finalFrom = fromLocation || null;
        const finalTo = toLocation || destinationValue;
        const derivedDestination = fromLocation && finalTo
            ? `${fromLocation} → ${finalTo}`
            : (finalTo || destinationValue);

        if (!derivedDestination) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required field: destination (or to_location).'
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

        // ===== Multi-day date validation =====
        const { dates: finalBookingDates, conflicts: dateValidationConflicts } = validateRequestedDates(req.body.booking_dates);
        if (dateValidationConflicts.length > 0) {
            res.status(400).json({
                status: 'error',
                message: 'One or more selected dates are invalid or in the past.',
                available: false,
                conflicts: dateValidationConflicts
            });
            return;
        }
        if (finalBookingDates.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'At least one valid booking date is required (booking_dates is empty).'
            });
            return;
        }
        const bookingDatesJson = JSON.stringify(finalBookingDates);

        // ===== Service charge (OPTIONAL total for the whole booking) =====
        // A hearse has no min/max daily rate — the caller may pass one TOTAL
        // service charge (KSH) for the booking. It is never required: when it is
        // absent the booking is simply stored with 0 and can be invoiced later.
        const serviceCharge: number = Math.round((Number(req.body.service_charge) || 0) * 100) / 100;

        // ===== Deceased validation =====
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

        const now = getKenyaTimeISO();

        // Generate a human-readable booking code:
        //   BK-<hearseCode>-<clientCode>-<dateCode>-<random5>
        // e.g. BK-H1-Kariuki-20250815-A3F9K
        let booking_code: string;
        try {
            // Fetch hearse name/plate for the code (optional — degrades gracefully)
            let hearseCode = 'H';
            if (hearse_id) {
                try {
                    const [hRow] = await safeQuery(
                        'SELECT hearse_name, plate_number FROM hearses WHERE id = ?',
                        [hearse_id]
                    );
                    const hn = hRow?.hearse_name || hRow?.plate_number || '';
                    hearseCode = hn ? hn.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'H' : 'H';
                } catch (hearseErr) { hearseCode = 'H'; }
            }

            // Client name → first 8 chars without spaces
            const clientCode = (client_name || 'client').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'CLIENT';

            // Booking date → YYYYMMDD (use first selected date)
            const d = finalBookingDates[0];
            const dateCode = d ? toDateKey(d) : Date.now().toString().slice(-8);

            // 5-char random suffix
            const random = Math.random().toString(36).slice(2, 7).toUpperCase();

            booking_code = `BK-${hearseCode}-${clientCode}-${dateCode}-${random}`;
        } catch (err) {
            booking_code = `BK-${Date.now().toString().slice(-6)}`;
        }

        // Tenant and branch info
        const createdByName = req.body.booked_by || req.body.created_by || 'System';
        const headerOf = (name: string): string | null => {
            const v = (req.headers as any)[name];
            return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
        };
        const tenantDbName = (req as any).tenantSlug || headerOf('x-tenant-slug') || 'system';
        const tenantId = headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id || req.body?.tenant_id || null;
        const tenantSlugVal = headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug || (req as any).tenantSlug || null;
        const branchIdVal = headerOf('x-branch-id') || req.body?.branch_id || req.body?.branchId || null;
        const branchSlugVal = headerOf('x-branch-slug') || req.body?.branch_slug || null;
        const bookingStatus = 'booked';

        const insertQuery = `
            INSERT INTO hearse_bookings
            (booking_code, hearse_id, tenant_db_name, tenant_id, tenant_slug,
             client_name, client_phone, destination,
             from_location, to_location,
             booking_date, booking_dates, status, created_at, updated_at,
                          branch_id, branch_slug, booked_by, service_charge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
            booking_code,
            hearse_id || null,
            tenantDbName,
            tenantId,
            tenantSlugVal,
            client_name.trim(),
            client_phone.trim(),
            derivedDestination,
            finalFrom,
            finalTo,
            finalBookingDates[0],
            bookingDatesJson,
                        bookingStatus,
            now,
            now,
            branchIdVal,
            branchSlugVal,
            createdByName,
            serviceCharge
        ];

        const selectBookingQuery = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status, hb.booking_dates, hb.created_at, hb.service_charge, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`;

        let bookingDbId: number;
        let booking: any;

        if (hearse_id) {
            let connection = null;
            try {
                connection = await getHearseConnection();
                await connection.beginTransaction();

                // ===== ATOMIC multi-day check-and-reserve =====
                const reservation = await attemptHearseReservation(connection, hearse_id, finalBookingDates);

                if (reservation.ok === false && reservation.notFound) {
                    await connection.rollback();
                    connection.release();
                    res.status(404).json({
                        status: 'error',
                        message: 'The selected hearse does not exist.'
                    });
                    return;
                }

                if (reservation.ok === false) {
                    const conflictDates = reservation.conflicts.map((c) => c.date);
                    await connection.rollback();
                    connection.release();
                    res.status(409).json({
                        status: 'error',
                        available: false,
                        message: `This hearse is already booked on ${conflictDates.join(', ')}. A hearse can only be booked once per date. Please choose another date or vehicle.`,
                        conflicts: reservation.conflicts,
                        conflict_dates: conflictDates,
                        conflict_date: reservation.conflictDate
                    });
                    return;
                }

                // No conflict found — INSERT the booking
                const [insertTxResult] = await connection.query(insertQuery, insertParams);
                const newBookingId = (insertTxResult as any).insertId;

                // Update hearse status
                const [activeRows] = await connection.query(
                    `SELECT COUNT(*) AS cnt FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')`,
                    [hearse_id]
                );
                const activeCount = Number((activeRows as any[])[0]?.cnt) || 0;
                await connection.query(
                    'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = ? WHERE id = ?',
                    [activeCount > 0 ? 'booked' : 'available', activeCount, now, hearse_id]
                );

                // Fetch the created booking
                const [bookingTxRows] = await connection.query(
                    selectBookingQuery,
                    [newBookingId]
                );
                const bookedRow = (bookingTxRows as any[])[0];

                await connection.commit();
                connection.release();

                // Emit events
                if (io && bookedRow) {
                    io.emit('new_booking', {
                        type: 'NEW_BOOKING',
                        booking_id: bookedRow.booking_id,
                        booking: bookedRow,
                        timestamp: now,
                        message: `New booking created for ${bookedRow.client_name}`
                    });
                }

                // Emit to socket service (non-blocking)
                try {
                    const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                    await axios.post(`${socketioServiceUrl}/emit/hearse-booking-created`, {
                        tenantSlug: tenantDbName || 'system',
                        data: {
                            id: `hearse-booking-${booking_code}-${Date.now()}`,
                            bookingId: booking_code,
                            clientName: client_name,
                            destination: derivedDestination,
                            fromLocation: finalFrom,
                            toLocation: finalTo,
                            hearseId: hearse_id || '',
                            title: 'New Hearse Booking',
                            message: `New hearse booking: ${client_name} — ${derivedDestination}`,
                            type: 'new_booking',
                            priority: 'high',
                            fullContent: `Booking Code: ${booking_code}\nClient: ${client_name}\nPhone: ${client_phone}\nRoute: ${derivedDestination}\nHearse: ${hearse_id || 'Not assigned'}`,
                        }
                    }, { timeout: 5000 });
                } catch (emitError) {
                    // Notification emit failure is non-critical - log but don't fail
                    console.warn('Failed to emit booking notification:', emitError.message);
                }

                // The booking list, availability and fleet views are all derived from
                // hearse_bookings, so a new booking must drop the tenant's cache.
                await invalidateHearseCache(req);

                res.status(201).json({
                    status: 'success',
                    message: 'Hearse booking created successfully and hearse status updated.',
                    booking: { ...bookedRow, booking_code: booking_code, status: bookingStatus, service_charge: serviceCharge, total_service_charge: serviceCharge }
                });
                return;

            } catch (txError) {
                // ROLLBACK AND RELEASE CONNECTION PROPERLY
                if (connection) {
                    try {
                        await connection.rollback();
                    } catch (rollbackError) {
                        console.error('Rollback failed:', rollbackError);
                    }
                    try {
                        connection.release();
                    } catch (releaseError) {
                        console.error('Connection release failed:', releaseError);
                    }
                }
                
                // LOG THE ACTUAL ERROR FOR DEBUGGING
                console.error('Transaction error in makeHearseBooking:', txError);
                
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to verify hearse availability. Please try again.',
                    // Only include error details in development
                    ...(process.env.NODE_ENV === 'development' && {
                        error: txError.message,
                        stack: txError.stack
                    })
                });
                return;
            }
        } else {
            // ---- No hearse assigned: plain insert (no conflict possible) ----
            const result = await safeQuery(insertQuery, insertParams);
            bookingDbId = result.insertId;

            const bookingRows = await safeQuery(
                `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status, hb.booking_dates, hb.created_at, hb.service_charge, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`,
                [bookingDbId]
            );
            booking = (bookingRows as any[])[0];

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
                        destination: derivedDestination,
                        fromLocation: finalFrom,
                        toLocation: finalTo,
                        hearseId: hearse_id || '',
                        title: 'New Hearse Booking',
                        message: `New hearse booking: ${client_name} — ${derivedDestination}`,
                        type: 'new_booking',
                        priority: 'high',
                        fullContent: `Booking Code: ${booking_code}\nClient: ${client_name}\nPhone: ${client_phone}\nRoute: ${derivedDestination}\nHearse: ${hearse_id || 'Not assigned'}`,
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                console.warn('Failed to emit booking notification:', emitError.message);
            }

            // The booking list, availability and fleet views are all derived from
            // hearse_bookings, so a new booking must drop the tenant's cache.
            await invalidateHearseCache(req);

                                    res.status(201).json({
                status: 'success',
                message: 'Hearse booking created successfully.',
                booking: { ...booking, booking_code: booking_code, status: bookingStatus, service_charge: serviceCharge, total_service_charge: serviceCharge }
            });
        }

    } catch (error) {
        // Catch any other unexpected errors
        console.error('Unexpected error in makeHearseBooking:', error);
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
        const { status } = req.query;
        const whereClauses: string[] = [];
        const params: any[] = [];

        // NOTE: Do NOT filter by branch_id — hearses are in a SHARED operations
        // database across ALL branches. Hearse bookings are TENANT-wide: every branch
        // must see every booking so the whole fleet can coordinate.
        // ACCURACY: because the operations DB is shared by MANY tenants, always scope
        // by the calling tenant's id (x-tenant-id). Legacy rows may only have
        // tenant_db_name, so match those as well for the same tenant.
        const headerOf = (name: string): string | null => {
            const v = (req.headers as any)[name];
            return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
        };
        const tenantId = headerOf('x-tenant-id') || (req.query as any)?.tenant_id || (req as any).tenant?.id || (req as any).tenant?.tenant_id || null;
        const tenantSlugScope = headerOf('x-tenant-slug') || (req as any).tenantSlug || null;

        if (tenantId) {
            whereClauses.push('(hb.tenant_id = ? OR (hb.tenant_id IS NULL AND hb.tenant_db_name = ?))');
            params.push(tenantId, tenantSlugScope || '');
        } else if (tenantSlugScope) {
            whereClauses.push('hb.tenant_db_name = ?');
            params.push(tenantSlugScope);
        }

        if (status && status !== 'all') {
            whereClauses.push('hb.status = ?');
            params.push(status);
        }

        // ─── REDIS CACHE ─────────────────────────────────────────────────────
        // This endpoint had no cache at all, so the Hearse Bookings page hit
        // MySQL on every render. The cache key must include BOTH the status
        // filter and the tenant scope (the namespace already carries the scope,
        // so only the filter belongs in the key).
        const statusFilter = status && status !== 'all' ? String(status) : 'all';
        const cacheKey = `bookings:list:status:${statusFilter}`;

        // Same scope rule on read and write: an unscoped request queries the whole
        // shared operations DB, so it must neither read from nor write to cache.
        const cacheScopeSafe = tenantId != null || tenantSlugScope != null;

        if (cacheScopeSafe) {
            const cached = await hearseCacheGet<any>(req, cacheKey);
            if (cached) {
                res.status(200).json({
                    ...cached,
                    source: 'cache',
                    total: cached.bookings?.length ?? 0
                });
                return;
            }
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const query = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status, hb.booking_dates, hb.created_at, hb.updated_at, hb.booked_by, hb.cancel_reason, hb.service_charge, hb.branch_slug AS booking_branch_slug, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity, h.branch_id, h.branch_code AS branch_code, h.branch_name AS hearse_branch_name FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id ${whereSQL} ORDER BY hb.created_at DESC`;

        const bookings = await safeQuery(query, params);
        let allBranches: any[] = [];
        try {
            allBranches = await safeQuery(tenantId
                ? `SELECT DISTINCT branch_id, branch_code, branch_name FROM hearses WHERE branch_id IS NOT NULL AND tenant_id = ? ORDER BY branch_name ASC`
                : `SELECT DISTINCT branch_id, branch_code, branch_name FROM hearses WHERE branch_id IS NOT NULL ORDER BY branch_name ASC`,
                tenantId ? [tenantId] : []);
        } catch (e) { /* branches lookup optional */ }

        const payload = { status: 'success', total: bookings.length, bookings, branches: allBranches };

        // Same scope rule as the read above: an unscoped response must not be
        // written to cache either.
        if (cacheScopeSafe) {
            await hearseCacheSet(req, cacheKey, payload, BOOKING_CACHE_TTL);
        }

        res.status(200).json({ ...payload, source: 'database' });
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

        await invalidateHearseCache(req);

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
                const cancelReason = String(req.body.cancel_reason || '').trim();


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

        // Persist (or clear) the cancel reason alongside the status change so the
        // UI can show *why* a booking was cancelled.
        let statusSet = 'status = ?, updated_at = ?';
        const statusParams: any[] = [status, now];
        if (status === 'cancelled') {
            statusSet += ', cancel_reason = ?';
            statusParams.push(cancelReason || null);
        } else {
            statusSet += ', cancel_reason = NULL';
        }
        statusParams.push(booking_id);
        await safeQuery(`UPDATE hearse_bookings SET ${statusSet} WHERE id = ?`, statusParams);

        // Keep the hearse fleet `status` meaningful WITHOUT making it the source of
        // truth. When a booking completes/cancels, recompute from the bookings that
        // are still active instead of blindly setting the hearse to 'available'
        // (other date bookings may still be active for that hearse).
        if (booking.hearse_id) {
            const [activeRows] = await safeQuery(
                `SELECT COUNT(*) AS cnt FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')`,
                [booking.hearse_id]
            );
            const remaining = Number((activeRows as any[])[0]?.cnt) || 0;
            await safeQuery(
                'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = ? WHERE id = ?',
                [remaining > 0 ? 'booked' : 'available', remaining, now, booking.hearse_id]
            );
        }

        const [updatedBooking] = await safeQuery(`SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status, hb.booking_dates, hb.created_at, hb.updated_at, hb.booked_by, hb.cancel_reason, hb.service_charge, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`, [booking_id]);

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

        // The booking list (and the fleet rows joined into it) just changed.
        await invalidateHearseCache(req);

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
        // Persist the new date as a normalized calendar key (never a raw datetime).
        const postponedDates = normalizeBookingDates(new_departure_time);
        const postponedKey = toDateKey(new_departure_time);
        const storedDates = postponedKey
            ? [postponedKey]
            : (postponedDates.length > 0 ? postponedDates : []);
        await safeQuery(
            `UPDATE hearse_bookings SET booking_dates = ?, status = ?, updated_at = ? WHERE id = ?`,
            [JSON.stringify(storedDates), storedDates.length ? 'pending' : 'postponed', now, booking_id]
        );

        // Recompute the hearse fleet status from still-active bookings.
        if (booking.hearse_id) {
            const [activeRows] = await safeQuery(
                `SELECT COUNT(*) AS cnt FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')`,
                [booking.hearse_id]
            );
            const remaining = Number((activeRows as any[])[0]?.cnt) || 0;
            await safeQuery(
                'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = ? WHERE id = ?',
                [remaining > 0 ? 'booked' : 'available', remaining, now, booking.hearse_id]
            );
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

        await invalidateHearseCache(req);

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

        const query = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status AS booking_status, hb.booking_dates, hb.created_at, h.id AS hearse_id, h.plate_number, h.model, h.status AS hearse_status FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE h.driver_id = ? ORDER BY hb.created_at DESC`;
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
        const bookings = await safeQuery(`SELECT hb.id AS booking_id, hb.status, hb.destination, hb.from_location, hb.to_location, hb.booking_dates, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.status NOT IN ('completed', 'cancelled') ORDER BY hb.created_at DESC`, []);
        res.status(200).json({ status: 'success', total: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch availability across branches.', error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined });
    }
});

/**
 * Hearse statuses that can never be booked, on ANY date.
 * A hearse whose global status is 'booked' is deliberately NOT here: it may be
 * booked for one day and free on another (see checkAvailabilityByDate).
 */
const AVAILABILITY_EXCLUDED_STATUSES = ['maintenance', 'out_of_service', 'disabled', 'pending_inspection'];

/** Hard cap on how many days one availability request may ask about. */
const MAX_AVAILABILITY_DATES = 62;

/**
 * Today's calendar date (YYYY-MM-DD) in Kenya time.
 *
 * `getKenyaDate()` comes from the shared-utils package. Availability must never
 * answer 500 because of a clock helper, so when the resolved package version
 * does not export it (or the call throws) we fall back to a plain UTC+3
 * computation — Africa/Nairobi has no DST, so this is always correct.
 */
const kenyaTodayKey = (): string => {
    try {
        const value = typeof getKenyaDate === 'function' ? (getKenyaDate as any)() : '';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    } catch { /* fall through to the manual computation below */ }
    return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

/**
 * Map a hearse row to the availability DTO the frontend cards render.
 *
 * NOTE: a hearse has NO min/max charge columns — at most ONE optional TOTAL
 * service charge. `service_charge_ksh` is therefore 0 unless the row exposes a
 * total, and every caller must treat it as optional (booking never requires it).
 */
const toAvailabilityDto = (h: any, isBooked: boolean): HearseAvailabilityItemDto => {
    const badge = hearseStatusBadge(h.status || h.hearse_status || '');
    const totalCharge = Number(h.service_charge_ksh ?? h.service_charge ?? h.total_service_charge) || 0;
    return {
        id: h.id,
        hearse_code: h.hearse_code || '',
        hearse_name: h.hearse_name || h.plate_number || '',
        plate_number: h.plate_number || '',
        model: h.model || '',
        capacity: Number(h.capacity) || 0,
        status: h.status || h.hearse_status || '',
        branch_id: h.branch_id ?? null,
        branch_name: h.branch_name ?? null,
        image: h.image ?? null,
        service_charge_ksh: totalCharge,
        status_badge: badge,
        is_booked: isBooked,
    };
};

/**
 * Build the available / booked buckets for ONE calendar day.
 *
 * `allHearses` and `dayBookings` come from `SELECT *` reads, so the answer never
 * depends on a specific column list: a database that has not run every migration
 * (or one carrying extra columns) still gets a correct answer instead of a MySQL
 * "Unknown column" error that would 500 the whole request.
 */
const buildDayBucket = (day: string, allHearses: any[], dayBookings: any[]): HearseDayAvailabilityDto => {
    const hearseById = new Map<string, any>();
    for (const h of allHearses) hearseById.set(String(h.id), h);

    const bookedHearseIds = new Set(
        dayBookings.map((b: any) => String(b.hearse_id)).filter(Boolean)
    );

    // Date-based availability: DO NOT rely on the global hearse status flag.
    // A hearse may be 'booked' for one date but free on another; only
    // maintenance / out-of-service hearses are excluded outright.
    const availableHearses = allHearses
        .filter((h: any) =>
            !bookedHearseIds.has(String(h.id)) &&
            !AVAILABILITY_EXCLUDED_STATUSES.includes(h.status)
        )
        .map((h: any) => toAvailabilityDto(h, false));

    // booked_hearses: the booking row's hearse (from the fleet map) decorated
    // with the booking metadata the UI shows (client / booking code).
    const bookedHearses = dayBookings
        .filter((b: any) => b.hearse_id)
        .map((b: any) => {
            const hearse = hearseById.get(String(b.hearse_id)) || {};
            const hearseId = hearse.id ?? b.hearse_id;
            return {
                ...toAvailabilityDto({ ...hearse, id: hearseId }, true),
                hearse_id: hearseId,
                booking_id: b.id ?? null,
                booking_code: b.booking_code ?? null,
                client_name: b.client_name ?? null,
                booking_dates: normalizeBookingDates(b.booking_dates),
            };
        });

    return {
        date: day,
        available_hearses: availableHearses,
        booked_hearses: bookedHearses,
        total_available: availableHearses.length,
        total_booked: bookedHearses.length,
    };
};

/**
 * Pull every date-ish value out of the request, whichever way the caller sent
 * it. Accepts (in this precedence order, all merged):
 *   - POST body:  { dates: [...] } | { date: '...' } | { booking_dates: [...] }
 *   - query:      ?dates=a,b,c | ?date=a | ?dates[]=a&dates[]=b
 * Comma- and whitespace-separated strings are split, so a single request can
 * carry any number of days.
 */
const collectRequestedDateInputs = (req: Request): string[] => {
    const out: string[] = [];
    const push = (v: any): void => {
        if (v == null) return;
        if (Array.isArray(v)) { v.forEach(push); return; }
        if (typeof v === 'object') {
            // booking-date objects may carry start/end or a single date
            if (v.date) push(v.date);
            if (v.start_date) push(v.start_date);
            if (v.end_date) push(v.end_date);
            return;
        }
        const str = String(v).trim();
        if (!str) return;
        // A comma/space separated list is common for GET requests.
        if (/[,\s]/.test(str)) { str.split(/[,\s]+/).forEach((part) => push(part)); return; }
        out.push(str);
    };

    const body: any = (req as any).body || {};
    push(body.dates);
    push(body.date);
    push(body.booking_dates);

    const query: any = req.query || {};
    push(query.dates);
    push(query.date);

    return out;
};

/**
 * Check availability for a SINGLE date (original contract).
 *
 * Returns every hearse split into available / booked buckets for that day.
 */
export const checkAvailabilityByDate = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ status: 'error', message: 'Date parameter is required' });
            return;
        }

        const dateKey = toDateKey(date);
        if (!dateKey) {
            res.status(400).json({ status: 'error', message: `"${date}" is not a valid calendar date (expected YYYY-MM-DD).` });
            return;
        }

        // Schema-agnostic reads (`SELECT *`): availability must never depend on
        // an exact column list, otherwise a database that has not run every
        // migration fails with "Unknown column" and 500s the whole check.
        const allHearses = await safeQuery(`SELECT * FROM hearses`, []) as any[];
        const activeBookings = await safeQuery(
            `SELECT * FROM hearse_bookings WHERE status NOT IN ('cancelled', 'completed')`,
            []
        ) as any[];

        // A booking covers this day when ANY of its normalized dates matches.
        const dayBookings = activeBookings.filter((b: any) => extractRowDates(b).includes(dateKey));
        const bucket = buildDayBucket(dateKey, allHearses, dayBookings);

        res.status(200).json({
            status: 'success',
            date: dateKey,
            available_hearses: bucket.available_hearses,
            booked_hearses: bucket.booked_hearses,
            total_available: bucket.total_available,
            total_booked: bucket.total_booked,
        });
    } catch (error) {
        console.error('[hearse-service] /availability/check-by-date failed:', (error as Error)?.message, error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check availability.',
            error: (error as Error)?.message,
        });
    }
});

/**
 * MULTI-DATE availability — one request answers EVERY selected day.
 *
 * This is the endpoint the UI uses when a date is clicked. It replaces the old
 * "one /availability/check-by-date request per selected date" fan-out, which
 * fired a parallel burst of requests (one per day) and drove the request count
 * past 200 for long date ranges.
 *
 * Accepted inputs (all merged, so any caller style works):
 *   GET  /availability/check-by-dates?dates=2026-09-23,2026-09-24
 *   GET  /availability/check-by-dates?date=2026-09-23
 *   POST /availability/check-by-dates  { "dates": ["2026-09-23", "2026-09-24"] }
 *
 * Response:
 *   - days[]        per-day available/booked buckets (what the UI renders)
 *   - hearses[]     the whole fleet, so cards render without a second call
 *   - invalid_dates / past_dates  what was ignored, so the UI can say why
 *
 * Cost: exactly TWO queries (fleet + active bookings) regardless of how many
 * days are requested. Booked days are expanded in JS with the same
 * normalizeBookingDates()/extractRowDates() helpers the booking transaction
 * uses, so a booking spanning a date range blocks every day it covers.
 */
export const checkAvailabilityByDates = asyncHandler(async (req: Request, res: Response) => {
    try {
        const rawInputs = collectRequestedDateInputs(req);

        const todayKey = kenyaTodayKey();
        const invalidDates: string[] = [];
        const pastDates: string[] = [];
        const dateKeys: string[] = [];
        const seen = new Set<string>();

        for (const raw of rawInputs) {
            const key = toDateKey(raw);
            if (!key) {
                invalidDates.push(String(raw));
                continue;
            }
            if (seen.has(key)) continue;
            seen.add(key);
            if (key < todayKey) pastDates.push(key);
            dateKeys.push(key);
        }
        dateKeys.sort();

        if (dateKeys.length === 0) {
            res.status(400).json({
                status: 'error',
                message: rawInputs.length === 0
                    ? 'At least one date is required (pass `dates=YYYY-MM-DD,YYYY-MM-DD` or `date=YYYY-MM-DD`).'
                    : 'No valid calendar dates were supplied.',
                invalid_dates: invalidDates,
                past_dates: pastDates,
            });
            return;
        }

        if (dateKeys.length > MAX_AVAILABILITY_DATES) {
            res.status(400).json({
                status: 'error',
                message: `Too many dates requested (max ${MAX_AVAILABILITY_DATES}).`,
                requested: dateKeys.length,
            });
            return;
        }

        // ── the whole point: ONE fleet query + ONE bookings query total ──
        // Both reads are `SELECT *` so the check can never 500 on schema drift
        // (e.g. a `hearses` table created by migrations that never added the
        // charge columns) — every column is mapped defensively afterwards.
        const allHearses = await safeQuery(`SELECT * FROM hearses`, []) as any[];

        const bookings = await safeQuery(
            `SELECT * FROM hearse_bookings WHERE status NOT IN ('cancelled', 'completed')`,
            []
        ) as any[];

        // Bucket the active bookings by the requested day each one covers.
        const requestedSet = new Set(dateKeys);
        const bookingsByDate = new Map<string, any[]>();
        for (const booking of bookings) {
            for (const day of extractRowDates(booking)) {
                if (!requestedSet.has(day)) continue;
                const bucket = bookingsByDate.get(day);
                if (bucket) bucket.push(booking);
                else bookingsByDate.set(day, [booking]);
            }
        }

        const days: HearseDayAvailabilityDto[] = dateKeys.map((day) =>
            buildDayBucket(day, allHearses, bookingsByDate.get(day) || [])
        );

        const payload: HearseMultiDateAvailabilityResponseDto = {
            status: 'success',
            dates: dateKeys,
            days,
            hearses: allHearses.map((h: any) => toAvailabilityDto(h, false)),
            invalid_dates: invalidDates,
            past_dates: pastDates,
            matched_count: days.length,
        };

        res.status(200).json(payload);
    } catch (error) {
        console.error('[hearse-service] /availability/check-by-dates failed:', (error as Error)?.message, error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check availability.',
            error: (error as Error)?.message,
        });
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
                   hb.destination, hb.from_location, hb.to_location, hb.booking_dates, hb.status, h.hearse_name, h.plate_number, h.model,
                   hb.created_at
            FROM hearse_bookings hb
            LEFT JOIN hearses h ON hb.hearse_id = h.id
            WHERE hb.status NOT IN ('completed', 'cancelled')
            ORDER BY hb.created_at DESC
        `, []);

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
