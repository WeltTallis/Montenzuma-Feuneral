// Shared theme for deceased management components
export const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#c8c8c8',
  borderLight: '#e0e0e0',
  bgField: '#f7f7f5',
  bgSection: '#fafaf9',
  bgApp: '#ececec',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  brown: '#795548',
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
