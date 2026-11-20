/* ==========================================================================
   Unified year/month processing — THE single source of truth for calendar
   scoping on list fetches (deceased list, coffins reservations, anything
   that passes ?year=&month= to the API).

   Contract (never throws, never returns garbage):
     • normalizeYM({ year, month })  → { year: 1900..2200, month: 1..12|null }
         - year  missing/invalid/NaN/out-of-range → current Nairobi year
         - month missing/invalid/NaN/out-of-range → null  ("all months")
         - month accepts 1..12 ONLY (URL contract); 0/13/""/garbage → null
     • ymQueryParams(ym)            → { year: "2026", month?: "10" }
         - month is only included when it is a real 1..12 value, so the
           backend ALWAYS receives a valid pair or nothing at all.
     • monthBounds(ym)              → { from: "2026-10-01", to: "2026-10-31" }
         - inclusive YYYY-MM-DD bounds for from/to-style APIs, or null when
           there is no month.
     • ymFromDate(date)             → { year, month } from a Date (1-based).
     • monthLabel(year, month)      → "October 2026" / "2026" when month null.

   Nairobi (Africa/Nairobi, UTC+3, no DST) is the default clock so a browser
   in another timezone still asks for the Kenyan month.
   ========================================================================== */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* Current { year, month(1-12) } in Africa/Nairobi. Intl first (correct even
   for a viewer abroad), fixed +3h fallback if Intl is unavailable. */
export function nairobiNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    const year = get('year');
    const month = get('month');
    if (year >= 1970 && month >= 1 && month <= 12) return { year, month };
  } catch (_) { /* fall through to fixed offset */ }
  const d = new Date(Date.now() + 3 * 3600000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/* Integer in [min,max] or null. Handles "", null, undefined, " 10 ", 3.7, NaN. */
function intInRange(value, min, max) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/* Normalize any year/month pair into a guaranteed-valid shape.
   month === null means "all months" (the historical, safe default). */
export function normalizeYM({ year, month } = {}) {
  const now = nairobiNow();
  return {
    year: intInRange(year, 1900, 2200) ?? now.year,
    month: intInRange(month, 1, 12),
  };
}

/* Query params for axios/URLSearchParams — always a valid year, and a month
   ONLY when one is actually selected (never month="" or month="0"). */
export function ymQueryParams({ year, month } = {}) {
  const ym = normalizeYM({ year, month });
  const params = { year: String(ym.year) };
  if (ym.month !== null) params.month = String(ym.month);
  return params;
}

/* Inclusive first/last day of the month, or null when month is "all". */
export function monthBounds({ year, month } = {}) {
  const ym = normalizeYM({ year, month });
  if (ym.month === null) return null;
  const lastDay = new Date(Date.UTC(ym.year, ym.month, 0)).getUTCDate();
  const p2 = (n) => String(n).padStart(2, '0');
  return { from: `${ym.year}-${p2(ym.month)}-01`, to: `${ym.year}-${p2(ym.month)}-${p2(lastDay)}` };
}

/* { year, month(1-12) } for a Date (or date-like value). Invalid → now. */
export function ymFromDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return nairobiNow();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/* "October 2026", or just "2026" when month is null. */
export function monthLabel(year, month) {
  const ym = normalizeYM({ year, month });
  return ym.month === null
    ? String(ym.year)
    : `${MONTH_NAMES[ym.month - 1]} ${ym.year}`;
}
