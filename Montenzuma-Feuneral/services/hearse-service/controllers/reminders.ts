import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { safeQuery } from '../database';
import { extractRowDates, toDateKey } from '../utilities/hearseAvailability';
import { getKenyaDate } from '@montezuma/shared-utils';

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