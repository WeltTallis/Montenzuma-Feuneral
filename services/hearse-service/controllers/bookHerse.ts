import { safeQuery, getHearseConnection } from '../database';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { logger } from '@montezuma/shared-logger';
import {
    validateRequestedDates, attemptHearseReservation
} from '../utilities/hearseAvailability';
import { hearseCacheScopes, invalidateHearseCache } from '../utilities/hearseCache';
import { enqueueSideEffect } from '../../app-global/utils/asyncSideEffectQueue';
import { generateHearseBookingCode } from '../utilities/hearseBookingCode';

function enqueueBookingSideEffects(
    req: Request,
    tenantSlug: string,
    booking: any,
    bookingCode: string,
    clientName: string,
    phone: string,
    destination: string,
    fromLocation: string | null,
    toLocation: string,
    hearseId: number | undefined

): void {

    const bookingId = booking?.booking_id || booking?.id;
    const actualHearseId = booking?.hearse_id || hearseId || '';
    const data = {
        id: `hearse-booking-${bookingCode}`,
        bookingId: bookingCode,
        clientName,
        destination,
        fromLocation,
        toLocation,
        hearseId: actualHearseId,
        hearseName: booking?.hearse_name || '',
        plateNumber: booking?.plate_number || '',
        clientPhone: phone || '',
        title: 'New Hearse Booking',
        message: `New hearse booking: ${clientName} — ${destination}`,
        type: 'new_booking',
        priority: 'high',
    };

    const jobs = [

        enqueueSideEffect({ kind: 'hearse-booking-created', payload: { tenantSlug, data } }),
        enqueueSideEffect({
            kind: 'hearse-data-changed',
            payload: { tenantSlug, data: { changeType: 'booking_created', bookingId: bookingId || bookingCode, hearseId: actualHearseId } },

        }),

        enqueueSideEffect({
            kind: 'cache-clear',
            payload: { serviceName: 'hearse-service', scopes: hearseCacheScopes(req) },
        }),
    ];

    void Promise.allSettled(jobs).then((results) => {
        results.filter((result) => result.status === 'rejected').forEach((result) => {
            logger.warn({
                err: (result as PromiseRejectedResult).reason,
                bookingCode,
            }, 'Failed to enqueue hearse booking side effect');
        });
    });
}


/**
 * Create a new hearse booking
 */
export const makeHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const {
            hearse_id,
            client_name,
            client_phone,
            destination,
            from_timestamp
        } = req.body;

        if (hearse_id != null && hearse_id !== '' &&
            (!Number.isSafeInteger(Number(hearse_id)) || Number(hearse_id) <= 0)) {
            res.status(400).json({
                status: 'error',
                message: 'A valid hearse ID is required.'
            });
            return;
        }

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

        if (typeof client_name !== 'string' || !client_name.trim()) {
            res.status(400).json({
                status: 'error',
                message: 'Client name is required.'
            });
            return;
        }
        if (typeof client_phone !== 'string' || !client_phone.trim()) {
            res.status(400).json({
                status: 'error',
                message: 'Client phone is required.'
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
        const requestedTime = String(req.body.booking_time || '').trim();
        const legacyTimeMatch = String(from_timestamp || '').match(/(?:T|\s)(\d{2}:\d{2})(?::\d{2})?/);
        const bookingTime = requestedTime || legacyTimeMatch?.[1] || '';
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(bookingTime)) {
            res.status(400).json({
                status: 'error',
                message: 'A valid booking time is required in 24-hour HH:mm format.'
            });
            return;
        }
        const bookingStartTimestamp = `${finalBookingDates[0]}T${bookingTime}:00`;
        const bookingDatesJson = JSON.stringify(finalBookingDates);
        const rawServiceCharge = req.body.service_charge == null || req.body.service_charge === ''
            ? 0
            : Number(req.body.service_charge);
        if (!Number.isFinite(rawServiceCharge) || rawServiceCharge < 0) {
            res.status(400).json({
                status: 'error',
                message: 'Service charge must be a non-negative number.'
            });
            return;
        }
        const serviceCharge = Math.round(rawServiceCharge * 100) / 100;

        const now = getKenyaTimeISO();

        let hearseName: string | null = null;
        let plateNumber: string | null = null;
        if (hearse_id) {
            try {
                const [hRow] = await safeQuery(
                    'SELECT hearse_name, plate_number FROM hearses WHERE id = ?',
                    [hearse_id]
                );
                hearseName = hRow?.hearse_name || null;
                plateNumber = hRow?.plate_number || null;
            } catch (err) {
                logger.warn({ err, hearseId: hearse_id }, 'Could not load hearse details for booking code');
            }
        }
        const booking_code = generateHearseBookingCode({
            hearseName,
            plateNumber,
            clientName: client_name,
            bookingDate: finalBookingDates[0],
        });

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
        const branchCodeVal = headerOf('x-branch-code') || req.body?.branch_code || null;
        const branchNameVal = String(req.body?.branch_name || '').trim().slice(0, 255) || null;
        // Allow the frontend to request a specific booking status (e.g. a faded
        // "pencil_hold" for a hearse held but not yet paid). Fall back to 'booked'
        // for any missing/unrecognised value so existing callers are unaffected.
        const ALLOWED_BOOKING_STATUSES = ['booked', 'pencil_hold', 'pending', 'confirmed', 'scheduled', 'postponed', 'cancelled'];
        const rawStatus = String(req.body?.status || '').toLowerCase().replace(/[-\s]+/g, '_');
        const bookingStatus = ALLOWED_BOOKING_STATUSES.includes(rawStatus) ? rawStatus : 'booked';

        const insertQuery = `
            INSERT INTO hearse_bookings
            (booking_code, hearse_id, tenant_db_name, tenant_id, tenant_slug,
             client_name, client_phone, destination,
             from_location, to_location,
             from_timestamp, booking_date, booking_dates, status, created_at, updated_at,
             branch_id, branch_code, branch_slug, branch_name, booked_by, service_charge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            bookingStartTimestamp,
            finalBookingDates[0],
            bookingDatesJson,
            bookingStatus,
            now,
            now,
            branchIdVal,
            branchCodeVal,
            branchSlugVal,
            branchNameVal,
            createdByName,
            serviceCharge
        ];

        const selectBookingQuery = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.from_timestamp, hb.branch_name, hb.status, hb.booking_dates, hb.created_at, hb.service_charge, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`;

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

                await invalidateHearseCache(req);

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

                enqueueBookingSideEffects(req, tenantDbName || 'system', bookedRow, booking_code, client_name, client_phone, derivedDestination, finalFrom, finalTo, hearse_id);
                logger.info({ bookingCode: booking_code, bookingId: bookedRow?.booking_id, hearseId: hearse_id || null }, 'Hearse booking created');

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
                        logger.error({ err: rollbackError, bookingCode: booking_code }, 'Hearse booking transaction rollback failed');
                    }
                    try {
                        connection.release();
                    } catch (releaseError) {
                        logger.error({ err: releaseError, bookingCode: booking_code }, 'Hearse booking connection release failed');
                    }
                }

                // LOG THE ACTUAL ERROR FOR DEBUGGING
                logger.error({ err: txError, bookingCode: booking_code, hearseId: hearse_id }, 'Hearse booking transaction failed');

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
                `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.from_timestamp, hb.branch_name, hb.status, hb.booking_dates, hb.created_at, hb.service_charge, h.id AS hearse_id, h.plate_number, h.hearse_name, h.model, h.status AS hearse_status, h.capacity FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE hb.id = ?`,
                [bookingDbId]
            );
            booking = (bookingRows as any[])[0];

            await invalidateHearseCache(req);

            if (io && booking) {
                io.emit('new_booking', {
                    type: 'NEW_BOOKING',
                    booking_id: booking.booking_id,
                    booking: booking,
                    timestamp: now,
                    message: `New booking created for ${booking.client_name}`
                });
            }

            enqueueBookingSideEffects(req, tenantDbName || 'system', booking, booking_code, client_name, client_phone, derivedDestination, finalFrom, finalTo, hearse_id);
            logger.info({ bookingCode: booking_code, bookingId: booking?.booking_id, hearseId: hearse_id || null }, 'Hearse booking created');

            res.status(201).json({
                status: 'success',
                message: 'Hearse booking created successfully.',
                booking: { ...booking, booking_code: booking_code, status: bookingStatus, service_charge: serviceCharge, total_service_charge: serviceCharge }
            });
        }

    } catch (error) {
        // Catch any other unexpected errors
        logger.error({ err: error }, 'Unexpected error creating hearse booking');
        res.status(500).json({
            status: 'error',
            message: 'Server error while creating booking.',
            error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        });
    }
});
