// ============================================
// HEARSE MULTI-DAY AVAILABILITY UTILITIES
// ============================================
// Pure, testable helpers for the multi-day hearse booking rule:
//
//   A hearse is UNAVAILABLE on EVERY date covered by an active booking.
//   A NEW booking is valid ONLY IF NONE of its requested dates overlap
//   any existing ACTIVE booking date (same hearse), checked ATOMICALLY
//   inside a transaction that locks the hearse row (SELECT ... FOR UPDATE).
//
// Booking dates are always normalized to local calendar keys: "YYYY-MM-DD".

import { PoolConnection } from 'mysql2/promise';
import { getKenyaDate } from '@montezuma/shared-utils';

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Validate that a string is a real calendar date key (YYYY-MM-DD).
 * Rejects impossible dates such as 2026-02-30 or 2026-13-01.
 */
export function isValidDateKey(key: string): boolean {
    const m = DATE_KEY_RE.exec(key);
    if (!m) return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (y < 1900 || y > 2400) return false;
    if (mo < 1 || mo > 12) return false;
    const daysInMonth = new Date(y, mo, 0).getDate();
    if (d < 1 || d > daysInMonth) return false;
    return true;
}

/**
 * Convert virtually any date-ish value into a local "YYYY-MM-DD" key.
 * Handles:
 *   "2026-08-10", "2026-08-10T00:00:00", "2026-08-10 07:00:00",
 *   "2026/08/10", Date objects, SQL DATE/DATETIME values.
 * Returns null when the value cannot be parsed as a calendar date.
 */
export function toDateKey(value: any): string | null {
    if (value == null) return null;
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return isValidDateKey(`${y}-${m}-${d}`) ? `${y}-${m}-${d}` : null;
    }
    const str = String(value).trim();
    if (!str) return null;

    // Take only the calendar-date portion before time separators.
    const dateOnly = str.split('T')[0].split(' ')[0].trim();
    const parts = dateOnly.split(/[-/]/);
    if (parts.length !== 3) return null;
    let [y, m, d] = parts;
    if (y.length !== 4) {
        // Reject ambiguous two-digit years; only accept 4-digit years.
        return null;
    }
    m = String(m).padStart(2, '0');
    d = String(d).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    return isValidDateKey(key) ? key : null;
}

/**
 * Expand a start/end date range (inclusive) into an array of date keys.
 * e.g. ("2026-08-10", "2026-08-12") => ["2026-08-10","2026-08-11","2026-08-12"]
 */
export function expandDateRange(startKey: string, endKey: string): string[] {
    if (!isValidDateKey(startKey) || !isValidDateKey(endKey)) return [];
    const yS = Number(startKey.slice(0, 4));
    const mS = Number(startKey.slice(5, 7)) - 1;
    const dS = Number(startKey.slice(8, 10));
    const yE = Number(endKey.slice(0, 4));
    const mE = Number(endKey.slice(5, 7)) - 1;
    const dE = Number(endKey.slice(8, 10));
    const start = new Date(yS, mS, dS);
    const end = new Date(yE, mE, dE);
    if (start.getTime() > end.getTime()) return [];

    const out: string[] = [];
    const cur = new Date(start);
    while (cur.getTime() <= end.getTime()) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        out.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

/**
 * Normalize ANY stored booking-date representation into a sorted, de-duplicated
 * array of "YYYY-MM-DD" keys. This is the single normalization function the
 * conflict algorithm operates on.
 *
 * Supported inputs:
 *   - JSON array string            '["2026-08-10","2026-08-11"]'
 *   - Array of date strings        ["2026-08-10", "2026-08-11"]
 *   - Array of objects             [{ date: "2026-08-10" }, { date: "2026-08-11" }]
 *   - Start/end columns            { start_date, end_date } | { start, end } | { from_timestamp, to_timestamp }
 *   - Single date column(s)        { date } | { booking_date } | { event_date } | { from_timestamp }
 *   - A single date/datetime       "2026-08-10", "2026-08-10 07:00:00", "2026-08-10T00:00:00"
 */
export function normalizeBookingDates(raw: any): string[] {
    if (raw == null || raw === '') return [];

    // ---- array shapes (CHECK THIS FIRST) ----
    if (Array.isArray(raw)) {
        const out: string[] = [];
        for (const entry of raw) {
            if (entry == null) continue;
            
            // If entry is an object with start/end, treat it as a range
            if (typeof entry === 'object' && !Array.isArray(entry)) {
                const start = entry.start_date || entry.startDate || entry.start || entry.from || entry.from_timestamp;
                const end = entry.end_date || entry.endDate || entry.end || entry.to || entry.to_timestamp;
                if (start && end) {
                    const startKey = toDateKey(start);
                    const endKey = toDateKey(end);
                    if (startKey && endKey) {
                        out.push(...expandDateRange(startKey, endKey));
                    }
                } else {
                    // Otherwise extract single date
                    const k = toDateKey(
                        entry.date || entry.booking_date || entry.start_date || entry.from_timestamp || entry
                    );
                    if (k) out.push(k);
                }
            } else if (typeof entry === 'string') {
                const k = toDateKey(entry);
                if (k) out.push(k);
            }
        }
        return [...new Set(out)].sort();
    }

    // ---- object shapes ----
    if (typeof raw === 'object') {
        const start =
            raw.start_date || raw.startDate || raw.start || raw.from || raw.from_timestamp;
        const end = raw.end_date || raw.endDate || raw.end || raw.to || raw.to_timestamp;
        if (start && end) {
            const startKey = toDateKey(start);
            const endKey = toDateKey(end);
            if (startKey && endKey) return expandDateRange(startKey, endKey);
        }
        const single = raw.date || raw.booking_date || raw.event_date;
        if (single) {
            const k = toDateKey(single);
            return k ? [k] : [];
        }
        // If it's an object with no recognized date fields, try to extract any date-like values
        const values = Object.values(raw).filter(v => typeof v === 'string' || v instanceof Date);
        const extracted: string[] = [];
        for (const val of values) {
            const k = toDateKey(val);
            if (k) extracted.push(k);
        }
        return [...new Set(extracted)].sort();
    }

    // ---- string shapes ----
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        const asSingle = toDateKey(trimmed);
        if (asSingle) return [asSingle];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return normalizeBookingDates(parsed);
            }
            if (parsed && typeof parsed === 'object') {
                return normalizeBookingDates(parsed);
            }
        } catch {
            return [];
        }
        return [];
    }

    return [];
}

/**
 * Extract the normalized booked dates from a single DB booking row.
 * Prefers booking_dates (the JSON array column) and falls back to any
 * date columns present on the row (booking_date / from_timestamp / to_timestamp / event_date).
 */
export function extractRowDates(row: any): string[] {
    if (row == null) return [];
    const fromBookingDates = normalizeBookingDates(row.booking_dates);
    if (fromBookingDates.length > 0) return fromBookingDates;
    return normalizeBookingDates(row);
}

/**
 * Given the raw requested dates from a request body, validate them against the
 * business rules:
 *   - all requested dates must be valid calendar dates
 *   - no requested date may be in the past (Kenya timezone)
 * Returns the valid unique date keys plus any conflicts that must reject the booking.
 */
export function validateRequestedDates(
    dates: any,
    todayKey: string = getKenyaDate()
): { dates: string[]; conflicts: { date: string; reason: string; message: string }[] } {
    const valid: string[] = [];
    const conflicts: { date: string; reason: string; message: string }[] = [];
    const seen = new Set<string>();
    const list = Array.isArray(dates) ? dates : dates == null ? [] : [dates];

    for (const entry of list) {
        const key = toDateKey(entry);
        if (!key) {
            conflicts.push({
                date: String(entry),
                reason: 'invalid_date',
                message: `"${entry}" is not a valid calendar date.`
            });
            continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        if (key < todayKey) {
            conflicts.push({
                date: key,
                reason: 'past_date',
                message: `Cannot book a past date (${key}).`
            });
            continue;
        }
        valid.push(key);
    }

    return { dates: [...new Set(valid)].sort(), conflicts };
}

/**
 * Compute the sorted list of requested dates that also exist in the existing
 * booked dates set (with every existing date normalized via normalizeBookingDates).
 */
export function computeDateConflicts(requestedDates: string[], existingDates: string[]): string[] {
    const booked = new Set(existingDates.filter((d) => isValidDateKey(d)));
    const requested = new Set(requestedDates.filter((d) => isValidDateKey(d)));
    return [...requested].filter((d) => booked.has(d)).sort();
}

/**
 * Deduplicate + sort a raw date list into normalized keys (non-destructive).
 */
export function dedupeDateKeys(dates: string[]): string[] {
    return [...new Set(dates.filter((d) => isValidDateKey(d)))].sort();
}

/**
 * ATOMIC check-and-reserve helper.
 *
 * MUST be called inside an already-started transaction on `conn`.
 *  1. Locks the hearse row (SELECT ... FOR UPDATE) so concurrent requests for the
 *     same hearse serialize on the row lock.
 *  2. Reads active bookings for the hearse with a CURRENT READ (FOR UPDATE) so a
 *     transaction that waits behind another commit always sees its insert.
 *  3. Normalizes every stored booking date set.
 *  4. Returns the overlap; the caller inserts + commits only when ok===true.
 */
export async function attemptHearseReservation(
    conn: PoolConnection,
    hearseId: number | string,
    bookingDates: string[]
): Promise<
    | { ok: true }
    | { ok: false; notFound?: boolean; conflictDate: string; conflicts: { date: string }[]; debug?: any }
> {
    const [hearseRows] = await conn.query('SELECT id, status FROM hearses WHERE id = ? FOR UPDATE', [
        hearseId
    ]);
    const hearse = (hearseRows as any[])[0];
    if (!hearse) {
        return { ok: false, notFound: true, conflictDate: '', conflicts: [] };
    }

    const [bookingRows] = await conn.query(
        `SELECT * FROM hearse_bookings
         WHERE hearse_id = ?
           AND status NOT IN ('completed', 'cancelled')
         FOR UPDATE`,
        [hearseId]
    );

    const bookedSet = new Set<string>();
    const allBookedDates: string[] = [];
    for (const row of bookingRows as any[]) {
        const dates = extractRowDates(row);
        for (const d of dates) {
            if (isValidDateKey(d)) {
                bookedSet.add(d);
                allBookedDates.push(d);
            }
        }
    }

    const normalizedRequested = dedupeDateKeys(bookingDates);
    const bookedArray = [...bookedSet].sort();
    const conflicts = computeDateConflicts(normalizedRequested, bookedArray).map((date) => ({
        date
    }));

    if (conflicts.length > 0) {
        // Return debug info to help diagnose the issue
        return { 
            ok: false, 
            conflictDate: conflicts[0].date, 
            conflicts,
            debug: {
                requested: normalizedRequested,
                booked: bookedArray,
                rawInput: bookingDates,
                totalBookings: (bookingRows as any[]).length
            }
        };
    }

    return { ok: true };
}