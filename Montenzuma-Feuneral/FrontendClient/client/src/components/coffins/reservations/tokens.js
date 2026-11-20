/**
 * CoffinBook Reservations — Design Tokens (JS)
 * Status maps, payment logic, money formatting, inventory helpers.
 * Mirrors the CSS variables in design-tokens.css.
 */

export const C = {
  ink: '#111827', ink2: '#374151', ink3: '#6b7280', ink4: '#9ca3af',
  bg: '#f9fafb', card: '#ffffff', brd: '#e5e7eb', brdl: '#f3f4f6',
  acc: '#0f766e', accl: '#14b8a6', acclt: '#f0fdfa',
  suc: '#16a34a', sucl: '#f0fdf4', dng: '#dc2626', dngl: '#fef2f2',
};

export const ST = {
  pending:     { label: 'Pending',     color: '#d97706', bg: '#FFFBEB', bar: '#d97706' },
  booked:      { label: 'Booked',      color: '#00296B', bg: '#EFF6FF', bar: '#2563EB' },
  confirmed:   { label: 'Confirmed',   color: '#00296B', bg: '#EFF6FF', bar: '#0f766e' },
  scheduled:   { label: 'Scheduled',   color: '#E36414', bg: '#FFEDD5', bar: '#E36414' },
  in_transit:  { label: 'In Transit',  color: '#E36414', bg: '#FFEDD5', bar: '#E36414' },
  in_progress: { label: 'In Progress', color: '#0c0b0f', bg: '#F3F4F6', bar: '#0c0b0f' },
  postponed:   { label: 'Postponed',   color: '#d97706', bg: '#FFFBEB', bar: '#d97706' },
  completed:   { label: 'Completed',   color: '#5F0F40', bg: '#FCE7F3', bar: '#16a34a' },
  delivered:   { label: 'Delivered',   color: '#132A13', bg: '#E8F5E9', bar: '#132A13' },
  cancelled:   { label: 'Cancelled',   color: '#DD2D4A', bg: '#FEE2E2', bar: '#dc2626' },
  maintenance: { label: 'Maintenance', color: '#03071E', bg: '#E0E7FF', bar: '#03071E' },
};

export const STORD = [
  'confirmed', 'booked', 'pending', 'scheduled', 'in_progress',
  'in_transit', 'postponed', 'completed', 'delivered', 'cancelled', 'maintenance',
];

export const PAY_ST = {
  paid:      { label: 'Fully Paid',       color: '#16a34a', bg: '#16a34a14' },
  deposited: { label: 'Deposited',        color: '#d97706', bg: '#d9770614' },
  reserved:  { label: 'Reserved · Unpaid', color: '#dc2626', bg: '#dc262614' },
};

/** Map a backend status string onto the palette (fallback: pending). */
export function getStatusStyle(booking) {
  return ST[booking?.status] || ST.pending;
}

/** Fully paid / deposited / unpaid resolver. */
export function getPaymentStatus(booking) {
  const amt = booking?.paidAmount || 0;
  if (amt >= (booking?.price || 0)) return PAY_ST.paid;
  if (amt > 0) return PAY_ST.deposited;
  return PAY_ST.reserved;
}

/** Format KES amount. */
export function money(n) {
  return 'KES ' + Number(n || 0).toLocaleString();
}

/** "14:30" ? "2:30 PM". Returns '' for missing/unparsable. */
export function fmtTime12(t) {
  if (!t) return '';
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const h = parseInt(m[1], 10);
  const min = m[2];
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${ap}`;
}

/** "14:30" ? 14.5 ; unparsable ? null (untimed lane). */
export function parseHour(t) {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h + min / 60;
}

export function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}

export function fmtISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtMDY(d) {
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function fmtMD(d) {
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** Canonical booking-status key from any backend variant. */
export function mapStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (['confirmed', 'booked'].includes(s)) return s;
  if (['pending', 'scheduled', 'in_transit', 'in-transit', 'in progress', 'in_progress'].includes(s)) {
    return s.replace(/[-\s]/g, '_');
  }
  if (['completed', 'delivered', 'cancelled', 'maintenance', 'postponed'].includes(s)) return s;
  return 'pending';
}

/** ISO/service date string ? Date or null. */
export function parseServiceDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** "14:30[:ss]" ? "HH:MM" for edit defaults. */
export function extractTime(s) {
  const m = String(s || '').match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}
