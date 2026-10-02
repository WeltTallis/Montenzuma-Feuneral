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

/**
 * Elapsed hours in care — the billing unit when a charge record is configured
 * as "per hour" instead of "per day".
 *
 * It is deliberately kept consistent with getDaysInMorgue: a full day is only
 * charged once the calendar day has rolled over, so the first partial day is
 * billed from the admission TIMESTAMP rather than from midnight. A body
 * admitted at 09:00 and viewed at 14:00 is therefore 5 hours (not 14, and not
 * 0 as it would be if we rounded straight to whole days). Every later day
 * contributes its full 24 hours. That way switching a record between the two
 * bases never silently changes the money owed for the elapsed period.
 */
export const getHoursInMorgue = (admittedDate) => {
  if (!admittedDate) return 0;
  const parsed = parseDate(admittedDate);
  if (!parsed) return 0;
  const HOUR_MS = 1000 * 60 * 60;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const elapsed = Date.now() - parsed.getTime();
  if (elapsed <= 0) return 0;
  const wholeDays = Math.floor((startOfDay(new Date()) - startOfDay(parsed)) / (24 * HOUR_MS));
  const hoursToday = (Date.now() - startOfDay(new Date())) / HOUR_MS;
  return Math.max(0, Math.round((wholeDays * 24 + hoursToday) * 100) / 100);
};
