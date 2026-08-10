/**
 * @file parseDates.js
 *
 * CENTRALIZED date/time parsing + formatting for the whole client.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS
 * ============================================================================
 * The backend stores dates as `YYYY-MM-DD` and datetimes as `YYYY-MM-DD HH:mm:ss`
 * in KENYA time (Africa/Nairobi, 24-hour) — see
 * `packages/shared-utils/src/timestamps.ts` (getKenyaTimeISO / getKenyaDate).
 *
 * In the browser, the naive patterns that used to be scattered across the UI
 * introduce real bugs:
 *
 *   1. `new Date('2025-06-02')`            -> parsed as UTC midnight, so in any
 *      timezone with a negative offset the rendered day is WRONG (off-by-one).
 *   2. `new Date('2025-06-02 14:30:00')`   -> not reliably parseable on all
 *      engines / browser versions.
 *   3. `new Date().toISOString().split('T')[0]` -> converts to UTC before
 *      slicing, so "today" can be yesterday/tomorrow outside UTC.
 *   4. Each component used its own locale ('en-US', 'en-GB', 'en-KE') and its
 *      own shape, so dates looked different everywhere.
 *
 * Every helper here parses using LOCAL date components (never UTC) and formats
 * with a single consistent style so the whole app renders identically.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
   Constants / small helpers
--------------------------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, '0');

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/**
 * Build a Date from LOCAL components. This is the ONLY safe way to turn the
 * backend's date-only / naive datetime strings into a JS Date without the
 * UTC-shift bug. Returns null for invalid input.
 */
function makeLocalDate(y, m, d, hh = 0, mm = 0, ss = 0) {
  const dt = new Date(y, m - 1, d, hh, mm, ss);
  // Guard against rollover (e.g. month 13) producing a "valid" shifted date.
  if (
    dt.getFullYear() !== Number(y) ||
    dt.getMonth() !== Number(m) - 1 ||
    dt.getDate() !== Number(d)
  ) {
    return null;
  }
  return dt;
}

/**
 * Parse ANY of the value shapes the app deals with into a local Date (or null):
 *   - Date instance
 *   - epoch number / numeric string
 *   - 'YYYY-MM-DD'                 -> Kenya local date (no UTC shift)
 *   - 'YYYY-MM-DD HH:mm[:ss]'      -> Kenya local datetime (24h)
 *   - 'YYYY-MM-DDTHH:mm[:ss]'      -> naive ISO datetime -> Kenya local
 *   - full ISO-8601 with `Z`/offset -> instant, kept as-is
 */
function parseDate(input) {
  if (input == null || input === '') return null;

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : new Date(input.getTime());
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return null;

    // Full ISO-8601 WITH an explicit UTC/offset marker — treat as an instant.
    if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const dt = new Date(s);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    // Date-only OR naive datetime (space or T separator) -> Kenya local components.
    const m = s.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (m) {
      return makeLocalDate(m[1], m[2], m[3], m[4] || 0, m[5] || 0, m[6] || 0);
    }

    // Last resort — let the engine try.
    const dt = new Date(s);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

/** Alias kept for readability at call sites. */
const toDate = parseDate;

/** True when the value can be parsed to a valid date. */
const isValidDate = (input) => parseDate(input) != null;

/* ---------------------------------------------------------------------------
   Key builders
--------------------------------------------------------------------------- */

/**
 * Local 'YYYY-MM-DD' key (the backend's date_format). Never UTC-shifted.
 * Returns '' when input is not a valid date.
 */
function toDateKey(input) {
  const d = parseDate(input);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local 'YYYY-MM-DD' key for today, in the browser's local time. */
function todayKey() {
  return toDateKey(new Date());
}

/** Local 'YYYY-MM-DD HH:mm' datetime key (backend's 24h format, no seconds). */
function toDateTimeKey(input, withSeconds = false) {
  const d = parseDate(input);
  if (!d) return '';
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

/** Local 'YYYY-MM-DD HH:mm:ss' (default seconds on) — mirrors getKenyaTimeISO. */
function toDateTimeKeyFull(input) {
  return toDateTimeKey(input, true);
}

/* ---------------------------------------------------------------------------
   Display formatting (24-hour Kenya / en-GB style, consistent everywhere)
--------------------------------------------------------------------------- */

/**
 * '2025-06-02'  -> '2 Jun 2025'
 * With time     -> '2 Jun 2025, 02:00'   (24h, matches backend time_format)
 * Returns '' when invalid (caller can fall back to its own placeholder).
 *
 * @param {boolean} [withTime] when the input carries a time and you want it shown
 */
function formatDate(input, { withTime = false } = {}) {
  const d = parseDate(input);
  if (!d) return '—';
  const date = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return date;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '2 June 2025' — long month form. */
function formatDateLong(input, { withTime = false } = {}) {
  const d = parseDate(input);
  if (!d) return '—';
  const date = `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return date;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 'Mon, 2 Jun 2025' — weekday + short date. */
function formatDateWithWeekday(input, { withTime = false } = {}) {
  const d = parseDate(input);
  if (!d) return '—';
  const date = `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return date;
  return `${date}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '2 Jun 2025, 14:30' — the standard combined date+time helper. */
function formatDateTime(input) {
  return formatDate(input, { withTime: true });
}

/** '14:30' — 24h time only (backend time_format is '24h'). */
function formatTime(input) {
  const d = parseDate(input);
  if (!d) return '—';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '14:30:45' — 24h time with seconds. */
function formatTimeWithSeconds(input) {
  const d = parseDate(input);
  if (!d) return '—';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** '2:30 PM' — 12-hour clock variant. */
function formatTimeAmPm(input) {
  const d = parseDate(input);
  if (!d) return '—';
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${suffix}`;
}

/* ---------------------------------------------------------------------------
   Relative / elapsed helpers
--------------------------------------------------------------------------- */

/**
 * Human-friendly relative time used by notification / feed lists:
 *   just now, 5m ago, 2h ago, 3d ago, otherwise '2 Jun 2025'.
 */
function formatRelativeTime(input) {
  const d = parseDate(input);
  if (!d) return '';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(d);
}

/**
 * Days between an input date and now. Positive when the input is in the past,
 * negative when in the future. Returns null for invalid input.
 */
function daysFromNow(input) {
  const d = parseDate(input);
  if (!d) return null;
  const nowStart = new Date();
  nowStart.setHours(0, 0, 0, 0);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((nowStart - dStart) / 86400000);
}

/** True when `input` is the same calendar day as today (local). */
function isToday(input) {
  return Boolean(input) && toDateKey(input) === todayKey();
}

/* ---------------------------------------------------------------------------
   Exports
--------------------------------------------------------------------------- */
export {
  pad,
  parseDate,
  toDate,
  isValidDate,
  toDateKey,
  toDateTimeKey,
  toDateTimeKeyFull,
  todayKey,
  formatDate,
  formatDateLong,
  formatDateWithWeekday,
  formatDateTime,
  formatTime,
  formatTimeWithSeconds,
  formatTimeAmPm,
  formatRelativeTime,
  daysFromNow,
  isToday,
};

export default {
  parseDate,
  toDate,
  isValidDate,
  toDateKey,
  toDateTimeKey,
  toDateTimeKeyFull,
  todayKey,
  formatDate,
  formatDateLong,
  formatDateWithWeekday,
  formatDateTime,
  formatTime,
  formatTimeWithSeconds,
  formatTimeAmPm,
  formatRelativeTime,
  daysFromNow,
  isToday,
};

