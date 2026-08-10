// src/components/analysis/fleetUtil.js
// Shared date helpers for the comprehensive dashboard fleet panels.
// booking_dates in the DB is stored as a JSON array string, e.g. '["2026-08-09","2026-08-10"]'

/** Local YYYY-MM-DD key for “today”. */
export const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

/** Coerce any date-ish value to a YYYY-MM-DD key (safe for plain date strings — no TZ shift). */
export const toDateKey = (d) => {
  if (d == null) return null;
  if (typeof d === "string") {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
};

/** Parse booking_dates into an array of date strings. */
export const parseBookingDates = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [String(parsed)];
    } catch (e) {
      /* fall through to comma parsing */
    }
  }
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
};