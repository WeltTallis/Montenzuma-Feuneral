import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { safeQuery } from '../database';
import { hearseCacheGet, hearseCacheSet, FLEET_CACHE_TTL } from '../utilities/hearseCache';

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




/**
 * Get all drivers
 */
export const getAllDrivers = asyncHandler(async (req: Request, res: Response) => {
    try {
        // ─── REDIS CACHE ─────────────────────────────────────────────────────
        // The dashboard calls /all-drivers on every load and the drivers table
        // changes rarely (no CRUD endpoints in this service). Same tenant-scoped
        // namespace as every other hearse read, so invalidateHearseCache() on
        // booking/hearse writes drops this key too; FLEET_CACHE_TTL bounds
        // staleness for the rows that only change via direct DB edits.
        const cacheKey = 'drivers:list';
        const cachedDrivers = await hearseCacheGet<any>(req, cacheKey);
        if (cachedDrivers) {
            res.status(200).json({ ...cachedDrivers, source: 'cache' });
            return;
        }

        const drivers = await safeQuery(
            `SELECT id AS driver_id, full_name AS driver_name, phone AS driver_phone, license_number, status, created_at
               FROM drivers
              ORDER BY full_name ASC`,
            []
        );
        const payload = { status: 'success', total: drivers.length, drivers };
        await hearseCacheSet(req, cacheKey, payload, FLEET_CACHE_TTL);
        res.status(200).json({ ...payload, source: 'database' });
    } catch (error) {
        console.error('Failed to fetch drivers:', error);
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

        const query = `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone, hb.destination, hb.from_location, hb.to_location, hb.status AS booking_status, hb.booking_dates, hb.created_at, hb.driver_id, hb.assistant_name, hb.assistant_phone, h.id AS hearse_id, h.plate_number, h.model, h.status AS hearse_status FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id WHERE COALESCE(hb.driver_id, h.driver_id) = ? ORDER BY hb.created_at DESC`;
        const bookings = await safeQuery(query, [driver_id]);
        res.status(200).json({ status: 'success', total: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch bookings for this driver.' });
    }
});




