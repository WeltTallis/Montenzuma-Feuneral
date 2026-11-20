

import { emitHearseDataChanged } from '../utilities/hearseRealtime';
import { invalidateHearseCache } from '../utilities/hearseCache';
import { HearseBooking } from '../models/hearseBooking';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { safeQuery } from '../database';


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
        await emitHearseDataChanged(req, 'hearse_driver_updated', { bookingId: booking_id, hearseId: booking.hearse_id });

        res.status(200).json({ status: 'success', message: `Driver ${driverName} assigned successfully to the hearse.`, booking_id, driver_id, driver_name: driverName });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Failed to assign driver.' });
    }
});