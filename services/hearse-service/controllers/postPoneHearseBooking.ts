import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { safeQuery } from '../database';
import { HearseBooking } from '../models/hearseBooking';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { normalizeBookingDates, toDateKey } from '../utilities/hearseAvailability';
import { invalidateHearseCache } from '../utilities/hearseCache';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';

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
        await emitHearseDataChanged(req, 'booking_postponed', { bookingId: booking_id });

        res.status(200).json({ status: 'success', message: 'Booking postponed successfully.', data: { booking_id, new_departure_time, reason, status: 'pending' } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error while postponing booking.' });
    }
});
