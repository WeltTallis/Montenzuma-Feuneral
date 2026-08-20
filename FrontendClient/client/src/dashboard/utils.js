import { TEXT3 } from "./theme.js";

/* ------------------------------------------------------------------ *
 *  Date helpers — Kenya-local naive string handling.
 *  Backend dates arrive as 'YYYY-MM-DD' / 'YYYY-MM-DD HH:mm:ss'. We
 *  slice the string prefix and use LOCAL Date components (never UTC).
 * ------------------------------------------------------------------ */
export const normDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof val === "string") return val.slice(0, 10);
  return null;
};

export const datesOf = (booking, mod) => {
  if (!booking) return [];
  const f = mod.dateField;
  const raw = typeof f === "function" ? f(booking) : booking?.[f];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normDate).filter(Boolean);
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normDate).filter(Boolean);
      const single = normDate(parsed);
      return single ? [single] : [];
    } catch { /* fall through */ }
  }
  const single = normDate(raw);
  return single ? [single] : [];
};

export const matchesDay = (booking, mod, dayStr) =>
  datesOf(booking, mod).some((d) => d === dayStr);

/* Normalise an API response into a flat array. */
export const extractArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.bookings)) return d.bookings;
  if (Array.isArray(d?.orders)) return d.orders;
  if (Array.isArray(d?.hearses)) return d.hearses;
  return [];
};

export const safeName = (booking, mod) =>
  booking[mod.clientField] || booking.client_name || booking.name || booking.id || "—";

/* ---------- Presentational helpers ---------- */

export const hourOf = (bk) => {
  const h = bk.start_hour ?? bk.pickup_hour;
  if (typeof h === "string") {
    const n = parseInt(h, 10);
    if (!Number.isNaN(n)) return n;
  } else if (typeof h === "number") {
    return h;
  }
  return 8;
};

/* A small colored status pill used across day/detail surfaces. */
export function StatusPill({ status, mod }) {
  const cfg = mod.statusMap[status] || { label: status, color: TEXT3 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      backgroundColor: `${cfg.color}1a`, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}