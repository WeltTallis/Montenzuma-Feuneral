// Shared theme for deceased management components
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
  info: '#3b82f6',
  infoBg: '#dbeafe',
  brown: '#8b5e3c',
  activeBg: 'rgba(251, 191, 36, 0.08)',
  pendingBg: '#f9fafb',
};

export const formatDate = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getInitials = (name) => {
  if (!name) return 'NA';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const getDaysInMorgue = (admittedDate) => {
  if (!admittedDate) return 0;
  const parsed = new Date(admittedDate);
  if (isNaN(parsed.getTime())) return 0;
  // Compare calendar dates (ignoring clock time) so a body admitted today
  // counts as day 0 — never -1 from timezone/hour offsets.
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor((startOfDay(new Date()) - startOfDay(parsed)) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};
