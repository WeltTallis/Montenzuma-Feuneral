import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { safeQuery } from '../database';
import { HearseBooking } from '../models/hearseBooking';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { invalidateHearseCache } from '../utilities/hearseCache';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';

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
        await emitHearseDataChanged(req, 'booking_status_updated', { bookingId: booking_id, hearseId: booking.hearse_id, status });

        res.status(200).json({ status: 'success', message: `Booking status updated to '${status}'.`, booking_id, booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update booking status.' });
    }
});