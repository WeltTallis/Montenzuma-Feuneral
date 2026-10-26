import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PoolConnection } from 'mysql2/promise';
import { getHearseConnection, getHearsePool } from '../database';
import { extractRowDates, isValidDateKey } from '../utilities/hearseAvailability';
import { invalidateHearseCache } from '../utilities/hearseCache';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';

class LineupError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type TenantScope = { key: string; value: string; fallbackValue: string };

function getTenantScope(req: Request): TenantScope | null {
    const headerOf = (name: string): string | null => {
        const value = req.headers[name];
        return Array.isArray(value) ? value[0] : value ? String(value) : null;
    };
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).user?.tenant_id
        || headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id;
    const tenantSlug = (req as any).tenantSlug || (req as any).user?.tenantSlug || (req as any).user?.tenant_slug
        || headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug;
    if (tenantId && String(tenantId).trim()) {
        const value = String(tenantId).trim();
        return { key: `id:${value}`, value, fallbackValue: String(tenantSlug || value).trim() };
    }
    if (tenantSlug && String(tenantSlug).trim()) {
        const value = String(tenantSlug).trim();
        return { key: `slug:${value}`, value, fallbackValue: value };
    }
    return null;
}

async function getBookingTenantFilter(connection: PoolConnection, tenantScope: TenantScope) {
    if (tenantScope.key.startsWith('id:')) {
        const [columns]: any = await connection.query("SHOW COLUMNS FROM hearse_bookings LIKE 'tenant_id'");
        if (columns.length) {
            return {
                clause: '(hb.tenant_id = ? OR (hb.tenant_id IS NULL AND hb.tenant_db_name = ?))',
                params: [tenantScope.value, tenantScope.fallbackValue],
            };
        }
    }
    return {
        clause: 'hb.tenant_db_name = ?',
        params: [tenantScope.fallbackValue],
    };
}

function requireTenant(req: Request, res: Response) {
    const scope = getTenantScope(req);
    if (!scope || scope.key.length > 191) {
        res.status(400).json({ success: false, message: 'A valid tenant context is required for driver lineups.' });
        return null;
    }
    return scope;
}

function sendError(res: Response, error: unknown, fallback: string): void {
    if (error instanceof LineupError) {
        res.status(error.status).json({ success: false, message: error.message });
        return;
    }
    console.error(`[hearse-lineup] ${fallback}`, error);
    res.status(500).json({ success: false, message: fallback });
}

function dateParam(value: unknown): string | null {
    const date = String(value ?? '');
    return isValidDateKey(date) ? date : null;
}

const ACTIVE_BOOKING_STATUSES = ['pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress'];

async function lockDriver(connection: PoolConnection, driverId: number): Promise<void> {
    const [rows]: any = await connection.query('SELECT id FROM drivers WHERE id = ? FOR UPDATE', [driverId]);
    if (!rows.length) throw new LineupError(404, 'Selected driver was not found.');
}

async function getTenantBookings(connection: PoolConnection, tenantScope: TenantScope, driverId: number) {
    const tenantFilter = await getBookingTenantFilter(connection, tenantScope);
    const params = [...tenantFilter.params, driverId, ...ACTIVE_BOOKING_STATUSES];
    const [rows]: any = await connection.query(
        `SELECT hb.id, hb.booking_dates, hb.booking_date, hb.from_timestamp, hb.to_timestamp,
                COALESCE(hb.driver_id, h.driver_id) AS assigned_driver_id, hb.status
         FROM hearse_bookings hb
         LEFT JOIN hearses h ON h.id = hb.hearse_id
         WHERE ${tenantFilter.clause}
           AND COALESCE(hb.driver_id, h.driver_id) = ?
           AND hb.status IN (${ACTIVE_BOOKING_STATUSES.map(() => '?').join(', ')})
         FOR UPDATE`,
        params
    );
    return rows as any[];
}

async function assertDriverAvailable(
    connection: PoolConnection,
    tenantScope: NonNullable<ReturnType<typeof getTenantScope>>,
    driverId: number,
    dates: string[],
    excludedBookingId?: number,
    ignoredStandbyDate?: string
): Promise<void> {
    const [standbyRows]: any = await connection.query(
        'SELECT lineup_date FROM hearse_daily_lineups WHERE tenant_key = ? AND standby_driver_id = ? FOR UPDATE',
        [tenantScope.key, driverId]
    );
    if (standbyRows.some((row: any) => {
        const standbyDate = row.lineup_date instanceof Date
            ? row.lineup_date.toISOString().slice(0, 10)
            : String(row.lineup_date).slice(0, 10);
        return standbyDate !== ignoredStandbyDate && dates.includes(standbyDate);
    })) {
        throw new LineupError(409, 'This driver is on standby for one of the selected booking dates.');
    }

    const assignedBookings = await getTenantBookings(connection, tenantScope, driverId);
    const conflict = assignedBookings.find((booking) => {
        if (Number(booking.id) === excludedBookingId) return false;
        return extractRowDates(booking).some((date) => dates.includes(date));
    });
    if (conflict) throw new LineupError(409, 'This driver is already assigned to another booking on one of these dates.');
}

export const getDailyLineup = asyncHandler(async (req: Request, res: Response) => {
    const tenantScope = requireTenant(req, res);
    if (!tenantScope) return;
    const date = dateParam(req.query.date);
    if (!date) {
        res.status(400).json({ success: false, message: 'Provide a valid lineup date in YYYY-MM-DD format.' });
        return;
    }
    try {
        const pool = await getHearsePool();
        const [rows]: any = await pool.query(
            'SELECT standby_driver_id FROM hearse_daily_lineups WHERE tenant_key = ? AND lineup_date = ?',
            [tenantScope.key, date]
        );
        res.json({ success: true, date, standby_driver_id: rows[0]?.standby_driver_id ?? null });
    } catch (error) {
        sendError(res, error, 'Unable to load the daily driver lineup.');
    }
});

export const saveStandbyDriver = asyncHandler(async (req: Request, res: Response) => {
    const tenantScope = requireTenant(req, res);
    if (!tenantScope) return;
    const date = dateParam(req.body.date);
    const driverId = req.body.driver_id == null || req.body.driver_id === '' ? null : Number(req.body.driver_id);
    if (!date || (driverId !== null && (!Number.isInteger(driverId) || driverId < 1))) {
        res.status(400).json({ success: false, message: 'Provide a valid date and standby driver.' });
        return;
    }
    const connection = await getHearseConnection();
    try {
        await connection.beginTransaction();
        if (driverId !== null) {
            await lockDriver(connection, driverId);
            await assertDriverAvailable(connection, tenantScope, driverId, [date], undefined, date);
            await connection.query(
                `INSERT INTO hearse_daily_lineups (tenant_key, lineup_date, standby_driver_id)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE standby_driver_id = VALUES(standby_driver_id)`,
                [tenantScope.key, date, driverId]
            );
        } else {
            await connection.query(
                'DELETE FROM hearse_daily_lineups WHERE tenant_key = ? AND lineup_date = ?',
                [tenantScope.key, date]
            );
        }
        await connection.commit();
        await invalidateHearseCache(req);
        await emitHearseDataChanged(req, 'standby_driver_updated', { date, driverId });
        res.json({ success: true, date, standby_driver_id: driverId });
    } catch (error) {
        await connection.rollback();
        sendError(res, error, 'Unable to save the standby driver.');
    } finally {
        connection.release();
    }
});

export const assignBookingLineup = asyncHandler(async (req: Request, res: Response) => {
    const tenantScope = requireTenant(req, res);
    if (!tenantScope) return;
    const bookingId = Number(req.params.booking_id);
    const driverId = req.body.driver_id == null || req.body.driver_id === '' ? null : Number(req.body.driver_id);
    const manualDriverName = String(req.body.driver_name || '').trim();
    const assistantName = String(req.body.assistant_name || '').trim();
    const assistantPhone = String(req.body.assistant_phone || '').trim();
    if (!Number.isInteger(bookingId) || bookingId < 1
        || (driverId !== null && (!Number.isInteger(driverId) || driverId < 1))
        || manualDriverName.length > 200 || assistantName.length > 200 || assistantPhone.length > 50) {
        res.status(400).json({ success: false, message: 'Enter valid booking, driver and assistant details.' });
        return;
    }
    if (driverId !== null && manualDriverName) {
        res.status(400).json({ success: false, message: 'Choose a driver or enter a driver name, not both.' });
        return;
    }

    const connection = await getHearseConnection();
    try {
        await connection.beginTransaction();
        const tenantFilter = await getBookingTenantFilter(connection, tenantScope);
        const [bookingRows]: any = await connection.query(
            `SELECT id, booking_dates, booking_date, from_timestamp, to_timestamp, status
             FROM hearse_bookings hb
             WHERE hb.id = ? AND ${tenantFilter.clause} FOR UPDATE`,
            [bookingId, ...tenantFilter.params]
        );
        const booking = bookingRows[0];
        if (!booking) throw new LineupError(404, 'Booking not found for this tenant.');
        const dates = extractRowDates(booking);
        if (!dates.length) throw new LineupError(400, 'This booking has no valid scheduled dates.');
        if (driverId !== null) {
            await lockDriver(connection, driverId);
            await assertDriverAvailable(connection, tenantScope, driverId, dates, bookingId);
        }
        await connection.query(
            `UPDATE hearse_bookings hb
             SET driver_id = ?, manual_driver_name = ?, assistant_name = ?, assistant_phone = ?, updated_at = ?
             WHERE hb.id = ? AND ${tenantFilter.clause}`,
            [driverId, driverId === null ? manualDriverName || null : null, assistantName || null, assistantPhone || null, new Date(), bookingId, ...tenantFilter.params]
        );
        await connection.commit();
        await invalidateHearseCache(req);
        await emitHearseDataChanged(req, 'booking_lineup_updated', { bookingId, driverId, driverName: manualDriverName || null });
        res.json({
            success: true,
            booking_id: bookingId,
            driver_id: driverId,
            driver_name: driverId === null ? manualDriverName || null : null,
            assistant_name: assistantName || null,
            assistant_phone: assistantPhone || null,
        });
    } catch (error) {
        await connection.rollback();
        sendError(res, error, 'Unable to save the booking lineup.');
    } finally {
        connection.release();
    }
});
