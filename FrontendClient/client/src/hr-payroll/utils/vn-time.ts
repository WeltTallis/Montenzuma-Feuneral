/**
 * Kenya-timezone helpers for the employee attendance UI.
 *
 * Why this exists: the server returns shift/check-in windows as absolute
 * instants (RFC 3339 with a +07:00 offset, e.g. "2026-07-12T19:00:00+07:00").
 * Comparing them against the device clock must NOT depend on the browser's
 * local timezone — a worker whose phone is set to UTC would otherwise see their
 * helpers read clock/offset-absolute values (Date.now(), Date.getTime()) and
 * format instants as Africa/Nairobi HH:mm for display via
 * Intl.DateTimeFormat, which is immune to the device timezone setting.
 *
 * Legacy helper names are retained while the payroll backend is being
 * localised; all displayed attendance times use Kenya's business timezone.
 */

export const VN_TIMEZONE = "Africa/Nairobi";

const vnTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const vnDayFormatter = new Intl.DateTimeFormat("en-CA", {
  // en-CA yields ISO-like YYYY-MM-DD, stable across engines
  timeZone: VN_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Parse an ISO timestamp to epoch milliseconds. Returns null for invalid
 * input so callers can treat a missing window the same as "no shift configured".
 */
export function parseEpochMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Format an ISO instant as HH:mm in Kenya time (e.g. "20:00"). Returns ""
 * for falsy/invalid input.
 */
export function formatVnTime(iso: string | null | undefined): string {
  const ms = parseEpochMs(iso);
  if (ms === null) return "";
  // Intl "2-digit" hour can render "24:xx" in some engines near midnight; normalize.
  const formatted = vnTimeFormatter.format(new Date(ms));
  return formatted.startsWith("24") ? `00${formatted.slice(2)}` : formatted;
}

const vnDayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
});

/**
 * Format an ISO instant as DD/MM in Kenya time (e.g. "01/09"). Returns ""
 * for falsy/invalid input.
 */
export function formatVnDayMonth(iso: string | null | undefined): string {
  const ms = parseEpochMs(iso);
  if (ms === null) return "";
  return vnDayMonthFormatter.format(new Date(ms));
}

/**
 * The Kenya calendar-day (YYYY-MM-DD) of an ISO instant. Used to detect
 * cross-midnight shifts by comparing the start and end calendar days.
 */
function vnCalendarDay(iso: string | null | undefined): string {
  const ms = parseEpochMs(iso);
  if (ms === null) return "";
  return vnDayFormatter.format(new Date(ms));
}

/** Whether `endIso` falls on a later Kenya calendar day than `startIso`. */
export function isVnNextDay(startIso: string | null | undefined, endIso: string | null | undefined): boolean {
  const start = vnCalendarDay(startIso);
  const end = vnCalendarDay(endIso);
  if (!start || !end) return false;
  return end !== start;
}
