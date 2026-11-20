import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { getHearseConnection, safeQuery } from '../database';
import { HearseBooking } from '../models/hearseBooking';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { attemptHearseReservation, extractRowDates, normalizeBookingDates, toDateKey, validateRequestedDates } from '../utilities/hearseAvailability';
import { invalidateHearseCache } from '../utilities/hearseCache';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';

function datesForReschedule(booking: HearseBooking): string[] {
    const current = normalizeBookingDates(booking.booking_dates);
    // booking_dates is the canonical expanded schedule. Legacy date fields may
    // be stale on rows postponed by older code, so only use them as a fallback.
    return current.length ? current : extractRowDates(booking);
}

/**
 * Postpone a booking
 */
export const postponeHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    try {
        const io = req.app.get('io');
        const { booking_id } = req.params;
        const { new_departure_time, reason } = req.body;

        const requestedDate = toDateKey(new_departure_time);
        const validation = validateRequestedDates(requestedDate ? [requestedDate] : [new_departure_time]);
        if (validation.conflicts.length || validation.dates.length !== 1) {
            res.status(400).json({
                status: 'error',
                message: 'A valid future postponement date is required.',
                conflicts: validation.conflicts,
            });
            return;
        }

        const headerOf = (name: string): string | null => {
            const value = req.headers[name];
            return Array.isArray(value) ? value[0] : value ? String(value) : null;
        };
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).user?.tenant_id
            || headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id;
        const tenantSlug = (req as any).tenantSlug || (req as any).user?.tenantSlug || (req as any).user?.tenant_slug
            || headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug;
        if (!tenantId && !tenantSlug) {
            res.status(400).json({ status: 'error', message: 'A valid tenant context is required.' });
            return;
        }
        const tenantClause = tenantId
            ? '(tenant_id = ? OR (tenant_id IS NULL AND tenant_db_name = ?))'
            : '(tenant_slug = ? OR tenant_db_name = ?)';
        const tenantParams = tenantId ? [tenantId, tenantSlug || String(tenantId)] : [tenantSlug, tenantSlug];
        const [booking] = await safeQuery(
            `SELECT * FROM hearse_bookings WHERE id = ? AND ${tenantClause}`,
            [booking_id, ...tenantParams]
        ) as [HearseBooking];
        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found.' });
            return;
        }
        if (['completed', 'cancelled'].includes(String(booking.status))) {
            res.status(409).json({ status: 'error', message: 'Completed or cancelled bookings cannot be postponed.' });
            return;
        }

        const oldDates = datesForReschedule(booking);
        const oldStart = oldDates[0] || validation.dates[0];
        const requestedStart = validation.dates[0];
        const dateDelta = Math.round(
            (Date.parse(`${requestedStart}T00:00:00Z`) - Date.parse(`${oldStart}T00:00:00Z`)) / 86_400_000
        );
        const proposedDates = (oldDates.length ? oldDates : [oldStart]).map((date) => {
            const shifted = new Date(`${date}T00:00:00Z`);
            shifted.setUTCDate(shifted.getUTCDate() + dateDelta);
            return shifted.toISOString().slice(0, 10);
        });
        const proposedValidation = validateRequestedDates(proposedDates);
        if (proposedValidation.conflicts.length) {
            res.status(400).json({
                status: 'error',
                message: 'The postponed booking would include an invalid or past date.',
                conflicts: proposedValidation.conflicts,
            });
            return;
        }

        const now = getKenyaTimeISO();
        const connection = await getHearseConnection();
        let storedDates: string[] = [];
        try {
            await connection.beginTransaction();

            // Lock the hearse first, matching the creation path's lock order. This
            // makes postpone-vs-book requests serialize instead of racing.
            if (booking.hearse_id) {
                const reservation = await attemptHearseReservation(
                    connection,
                    booking.hearse_id,
                    proposedDates,
                    String(booking_id)
                );
                if (reservation.ok === false) {
                    await connection.rollback();
                    if (reservation.notFound) {
                        res.status(409).json({ status: 'error', message: 'The assigned hearse no longer exists.' });
                    } else {
                        const conflictDates = reservation.conflicts.map((conflict) => conflict.date);
                        res.status(409).json({
                            status: 'error',
                            available: false,
                            message: `The assigned hearse is already booked on ${conflictDates.join(', ')}. Choose another date.`,
                            conflicts: reservation.conflicts,
                            conflict_dates: conflictDates,
                        });
                    }
                    return;
                }
            }

            const [lockedRows] = await connection.query(
                `SELECT * FROM hearse_bookings WHERE id = ? AND ${tenantClause} FOR UPDATE`,
                [booking_id, ...tenantParams]
            );
            const lockedBooking = (lockedRows as HearseBooking[])[0];
            if (!lockedBooking || ['completed', 'cancelled'].includes(String(lockedBooking.status))) {
                await connection.rollback();
                res.status(409).json({ status: 'error', message: 'This booking can no longer be postponed.' });
                return;
            }

            // Re-check using the row read under lock, in case another postpone
            // completed while this request waited for the hearse lock.
            const lockedDates = datesForReschedule(lockedBooking);
            const lockedStart = lockedDates[0] || requestedStart;
            const lockedDelta = Math.round(
                (Date.parse(`${requestedStart}T00:00:00Z`) - Date.parse(`${lockedStart}T00:00:00Z`)) / 86_400_000
            );
            storedDates = (lockedDates.length ? lockedDates : [lockedStart]).map((date) => {
                const shifted = new Date(`${date}T00:00:00Z`);
                shifted.setUTCDate(shifted.getUTCDate() + lockedDelta);
                return shifted.toISOString().slice(0, 10);
            });
            if (lockedBooking.hearse_id) {
                const reservation = await attemptHearseReservation(
                    connection,
                    lockedBooking.hearse_id,
                    storedDates,
                    String(booking_id)
                );
                if (reservation.ok === false) {
                    await connection.rollback();
                    const conflictDates = reservation.conflicts.map((conflict) => conflict.date);
                    res.status(409).json({
                        status: 'error',
                        available: false,
                        message: `The assigned hearse is already booked on ${conflictDates.join(', ')}. Choose another date.`,
                        conflicts: reservation.conflicts,
                        conflict_dates: conflictDates,
                    });
                    return;
                }
            }
            const timestampOnDate = (value: unknown, targetDate: string): string => {
                const time = String(value || '').match(/[T\s](\d{2}:\d{2}(?::\d{2})?)/)?.[1] || '00:00:00';
                return `${targetDate}T${time}`;
            };
            const fromTimestamp = timestampOnDate(lockedBooking.from_timestamp, storedDates[0]);
            const toTimestamp = lockedBooking.to_timestamp
                ? timestampOnDate(lockedBooking.to_timestamp, storedDates[storedDates.length - 1])
                : null;

            await connection.query(
                `UPDATE hearse_bookings
                 SET booking_dates = ?, booking_date = ?, from_timestamp = ?, to_timestamp = ?,
                     postpone_reason = ?, status = 'pending', updated_at = ?
                 WHERE id = ? AND ${tenantClause}`,
                [JSON.stringify(storedDates), storedDates[0], fromTimestamp, toTimestamp, String(reason || '').trim().slice(0, 500) || null, now, booking_id, ...tenantParams]
            );

            if (lockedBooking.hearse_id) {
                const [activeRows] = await connection.query(
                    `SELECT COUNT(*) AS cnt FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')`,
                    [lockedBooking.hearse_id]
                );
                const activeCount = Number((activeRows as any[])[0]?.cnt) || 0;
                await connection.query(
                    'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = ? WHERE id = ?',
                    [activeCount > 0 ? 'booked' : 'available', activeCount, now, lockedBooking.hearse_id]
                );
            }

            await connection.commit();
        } catch (error) {
            try { await connection.rollback(); } catch { /* preserve original failure */ }
            throw error;
        } finally {
            connection.release();
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
        await emitHearseDataChanged(req, 'booking_postponed', { bookingId: booking_id });

        res.status(200).json({ status: 'success', message: 'Booking postponed successfully.', data: { booking_id, new_departure_time: storedDates[0], booking_dates: storedDates, reason, status: 'pending' } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error while postponing booking.' });
    }
});
