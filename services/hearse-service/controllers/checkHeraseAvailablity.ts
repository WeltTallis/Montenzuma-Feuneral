
import { computeDateConflicts, extractRowDates, normalizeBookingDates, toDateKey, validateRequestedDates, } from '../utilities/hearseAvailability';
import { hearseStatusBadge, HearseAvailabilityItemDto, HearseDayAvailabilityDto, HearseMultiDateAvailabilityResponseDto, } from '../models/hearseBookingDto';
import { getKenyaDate } from '@montezuma/shared-utils';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { safeQuery } from '../database';

const AVAILABILITY_EXCLUDED_STATUSES = ['maintenance', 'out_of_service', 'disabled', 'pending_inspection'];
const MAX_AVAILABILITY_DATES = 62;
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
            `SELECT booking_dates, booking_date, from_timestamp, to_timestamp FROM hearse_bookings
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
