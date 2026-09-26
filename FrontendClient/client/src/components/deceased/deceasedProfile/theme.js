// Shared theme for deceased management components
import { parseDate } from '../../../utils/dates/parseDates';

export const C = {
  // ── Core neutrals ─────────────────────────────
  black: '#111827',      // Darker, solid black
  dark: '#1a1a1a',
  mid: '#4b5563',
  gray: '#6b7280',
  lightGray: '#9ca3af',
  border: '#c8c8c8',
  borderLight: '#e5e7eb',
  bgField: '#f7f7f5',
  bgSection: '#fafaf9',
  bgApp: '#ececec',

  // ── Status colors ─────────────────────────────
  success: '#10b981',
  successBg: '#ecfdf5',
  successBgTranslucent: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningBgTranslucent: 'rgba(251, 191, 36, 0.08)',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  info: '#00296B',
  infoBg: '#dbeafe',
  brown: '#8b5e3c',
  activeBg: 'rgba(251, 191, 36, 0.08)',
  pendingBg: '#f9fafb',
};

/**
 * Every timestamp the backend hands us is KENYA wall time (Africa/Nairobi,
 * UTC+3, no DST) — see the header of utils/dates/parseDates.js and
 * bodyRelease.controller.ts, which writes `created_at` via kenyaNow().
 *
 * parseDate() rebuilds those naive "YYYY-MM-DD HH:mm:ss" strings as local
 * components, so the renderer MUST pin the same zone. Without `timeZone`,
 * toLocale*String falls back to the BROWSER's zone: a device set to UTC rendered
 * a 13:24 EAT handover as "10:24 AM" — three hours early. This is why the
 * release timeline looked wrong while the intake form (which only ever shows a
 * calendar date) looked right: a date is stable across zones, a time is not.
 */
const TZ = 'Africa/Nairobi';

export const formatDate = (dt) => {
  if (!dt) return '—';
  const parsed = parseDate(dt);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' });
};

// Exact date AND time, e.g. "Sep 15, 2026, 2:45 PM"
export const formatDateTime = (dt) => {
  if (!dt) return '—';
  const parsed = parseDate(dt);
  if (!parsed) return '—';
  const date = parsed.toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' });
  const time = parsed.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

// 24h "HH:MM" / "HH:MM:SS" / datetime string → "h:mm AM/PM"
export const formatTime12 = (t) => {
  if (!t) return '—';
  const s = String(t).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${min} ${ampm}`;
  }
  const parsed = parseDate(s);
  if (parsed) {
    return parsed.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return s;
};

export const getInitials = (name) => {
  if (!name) return 'NA';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const getDaysInMorgue = (admittedDate) => {
  if (!admittedDate) return 0;
  const parsed = parseDate(admittedDate);
  if (!parsed) return 0;
  // Compare calendar dates (ignoring clock time) so a body admitted today
  // counts as day 0 — never -1 from timezone/hour offsets.
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor((startOfDay(new Date()) - startOfDay(parsed)) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};
