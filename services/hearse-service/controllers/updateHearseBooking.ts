import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { getHearseConnection } from '../database';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { attemptHearseReservation, validateRequestedDates } from '../utilities/hearseAvailability';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';
import { invalidateHearseCache } from '../utilities/hearseCache';

const headerValue = (req: Request, name: string): string | null => {
    const value = (req.headers as any)[name];
    return Array.isArray(value) ? String(value[0]) : value == null ? null : String(value);
};

const bookingScope = (req: Request): { clause: string; params: any[] } | null => {
    const tenantId = headerValue(req, 'x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id;
    const tenantSlug = headerValue(req, 'x-tenant-slug') || (req as any).tenantSlug || (req as any).tenant?.tenant_slug;
    if (tenantId) return { clause: '(tenant_id = ? OR (tenant_id IS NULL AND tenant_db_name = ?))', params: [tenantId, tenantSlug || ''] };
    if (tenantSlug) return { clause: 'tenant_db_name = ?', params: [tenantSlug] };
    return null;
};

export const updateHearseBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = Number(req.params.booking_id);
    const scope = bookingScope(req);
    if (!Number.isInteger(bookingId) || bookingId < 1 || !scope) {
        res.status(400).json({ status: 'error', message: 'A valid booking and tenant are required.' });
        return;
    }

    const body = req.body || {};
    const clientName = String(body.client_name || '').trim();
    const clientPhone = String(body.client_phone || '').trim();
    const fromLocation = String(body.from_location || '').trim();
    const toLocation = String(body.to_location || body.destination || '').trim();
    const hearseId = body.hearse_id == null || body.hearse_id === '' ? null : Number(body.hearse_id);
    const rawDates = Array.isArray(body.booking_dates) ? body.booking_dates : [body.booking_date];
    const dateValidation = validateRequestedDates(rawDates);
    const bookingTime = String(body.booking_time || '').trim();
    const serviceCharge = body.service_charge == null || body.service_charge === '' ? 0 : Number(body.service_charge);

    if (!clientName || !clientPhone || !fromLocation || !toLocation
        || (hearseId !== null && (!Number.isInteger(hearseId) || hearseId < 1))
        || !dateValidation.dates.length || dateValidation.conflicts.length
        || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(bookingTime)
        || !Number.isFinite(serviceCharge) || serviceCharge < 0) {
        res.status(400).json({ status: 'error', message: 'Enter valid booking details, dates, time and service charge.' });
        return;
    }

    const connection = await getHearseConnection();
    try {
        await connection.beginTransaction();
        const [rows]: any = await connection.query(
            `SELECT * FROM hearse_bookings WHERE id = ? AND ${scope.clause} FOR UPDATE`,
            [bookingId, ...scope.params]
        );
        const existing = rows[0];
        if (!existing) {
            await connection.rollback();
            res.status(404).json({ status: 'error', message: 'Booking not found.' });
            return;
        }

        if (hearseId !== null) {
            const reservation = await attemptHearseReservation(connection, hearseId, dateValidation.dates, bookingId);
            if (!reservation.ok) {
                await connection.rollback();
                if (reservation.notFound) {
                    res.status(404).json({ status: 'error', message: 'The selected hearse does not exist.' });
                    return;
                }
                res.status(409).json({
                    status: 'error',
                    message: `This hearse is already booked on ${reservation.conflictDate}. Please choose another hearse or date.`,
                    conflicts: reservation.conflicts,
                });
                return;
            }
        }

        const now = getKenyaTimeISO();
        const startTimestamp = `${dateValidation.dates[0]}T${bookingTime}:00`;
        const branchId = headerValue(req, 'x-branch-id') || body.branch_id || existing.branch_id || null;
        const branchSlug = headerValue(req, 'x-branch-slug') || body.branch_slug || existing.branch_slug || null;
        const branchCode = headerValue(req, 'x-branch-code') || body.branch_code || existing.branch_code || null;
        const branchName = String(body.branch_name || existing.branch_name || '').trim() || null;
        const destination = `${fromLocation} → ${toLocation}`;

        await connection.query(
            `UPDATE hearse_bookings
             SET hearse_id = ?, client_name = ?, client_phone = ?, destination = ?,
                 from_location = ?, to_location = ?, from_timestamp = ?, booking_date = ?,
                 booking_dates = ?, branch_id = ?, branch_code = ?, branch_slug = ?,
                 branch_name = ?, service_charge = ?, updated_at = ?
             WHERE id = ? AND ${scope.clause}`,
            [hearseId, clientName, clientPhone, destination, fromLocation, toLocation,
                startTimestamp, dateValidation.dates[0], JSON.stringify(dateValidation.dates),
                branchId, branchCode, branchSlug, branchName, Math.round(serviceCharge * 100) / 100,
                now, bookingId, ...scope.params]
        );

        const [updatedRows]: any = await connection.query(
            `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone,
                    hb.destination, hb.from_location, hb.to_location, hb.from_timestamp,
                    hb.booking_date, hb.booking_dates, hb.branch_id, hb.branch_code,
                    hb.branch_slug, hb.branch_name, hb.status, hb.created_at, hb.updated_at,
                    hb.booked_by, hb.service_charge, hb.driver_id, hb.manual_driver_name,
                    hb.assistant_name, hb.assistant_phone, h.id AS hearse_id,
                    h.plate_number, h.hearse_name, h.model, h.status AS hearse_status
             FROM hearse_bookings hb LEFT JOIN hearses h ON hb.hearse_id = h.id
             WHERE hb.id = ?`, [bookingId]
        );

        for (const id of [existing.hearse_id, hearseId]) {
            if (id == null) continue;
            const [countRows]: any = await connection.query(
                `SELECT COUNT(*) AS cnt FROM hearse_bookings
                 WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')`, [id]
            );
            await connection.query(
                'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = ? WHERE id = ?',
                [Number(countRows[0]?.cnt) > 0 ? 'booked' : 'available', Number(countRows[0]?.cnt) || 0, now, id]
            );
        }

        await connection.commit();
        await invalidateHearseCache(req);
        await emitHearseDataChanged(req, 'booking_updated', { bookingId, hearseId });
        res.json({ status: 'success', message: 'Hearse booking updated successfully.', booking: updatedRows[0] });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: 'Failed to update hearse booking.' });
    } finally {
        connection.release();
    }
});
