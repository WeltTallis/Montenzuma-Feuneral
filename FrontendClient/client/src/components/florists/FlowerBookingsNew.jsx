
// Package was only used by the removed icon-box tiles.
import { Flower2, User, Calendar, X, Check, Home, Phone } from '../../utils/icons/icons';
import { toDateKey, todayKey, parseDate as parseUtilDate } from '../../utils/dates/parseDates';
import { getBranchSlug, getBranchId, getBranches, getTenantId } from '../../utils/globalAuth';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReusableCalendar from '../../utils/calender/calender';
import { useSocket } from '../../utils/context/socketContext'
import api from '../../api/axios'


const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];





// Flower orders have exactly TWO statuses — nothing else.
const STATUS_FLOW = ['booked', 'completed'];

const STATUS_LABELS = {

  booked: 'Booked',
  completed: 'Completed',
  pending: 'Booked',
  sourced: 'Booked',
  preparing: 'Booked',
  confirmed: 'Booked',
  transit: 'Booked'

};


// Normalise ANY historical status onto the two-value flow


const normStatus = s => {
  const v = String(s || '').toLowerCase();
  if (v === 'completed') return 'completed';
  if (v === 'cancelled') return 'cancelled';
  return 'booked';
};

const STATUS_DESC = {
  pending: 'We have received your order details.',
  sourced: 'Florist has prepared the arrangement.',
  transit: 'The delivery is en route to the funeral home.',
  completed: 'Successfully delivered to the specified location.'
};

// Distinct card tint per order status — exactly TWO statuses for flowers
const STATUS_CARD_STYLES = {
  booked: { bg: 'linear-gradient(135deg, #FDE9F1 0%, #FDF1F6 60%, #FEFAFC 100%)', border: '#F6C6DA' },
  completed: { bg: 'linear-gradient(135deg, #E2F6EA 0%, #EDFAF1 60%, #FBFEFC 100%)', border: '#BFEBD0' },
  cancelled: { bg: '#FFF1F2', border: '#FECDD3' },
};

const pad = n => String(n).padStart(2, '0');
// Delegate to the central date utility — no UTC shift, one format app-wide
const fmtDateStr = d => toDateKey(d) || '';
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const fmtDateOnly = s => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
// Normalise a JSON/array field (types, colors, sizes…) into a plain array —
// older rows may store them as JSON strings.
const asList = v => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.filter(Boolean) : [p];
    } catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
};
const splitCommaList = value => String(value || '').split(/[,\n]+/).map(item => item.trim()).filter(Boolean);
// Normalise ANY date-ish value (DATE, DATETIME, ISO, Date obj) → 'YYYY-MM-DD'
// via the central util — handles naive datetimes & instants without shifting.
const toDateOnly = v => toDateKey(v);
// Parse an order's flower-type line items. Priority:
//   1) `arrangements` JSON column (new backend)
//   2) [TYPES:a|b|c] token embedded in notes (works on ANY backend version)
//   3) legacy single flower_type
const parseLineItems = (b) => {
  let arr = null;
  try {
    arr = typeof b?.arrangements === 'string' ? JSON.parse(b.arrangements) : b?.arrangements;
  } catch { arr = null; }
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.filter(Boolean).map(x => typeof x === 'string'
      ? { name: x, arrangement_id: null, types: [], colors: [], quantity: 1 }
      : {
        name: x.name || x.title || 'Flower',
        arrangement_id: x.arrangement_id ?? null,
        types: asList(x.types),
        colors: asList(x.colors),
        quantity: Math.max(1, Number(x.quantity) || 1),
      });
  }
  const tok = /\[TYPES:([^\]]+)\]/i.exec(String(b?.notes || ''));
  if (tok) {
    return tok[1].split('|').map(s => s.trim()).filter(Boolean).map(name => ({ name, quantity: 1 }));
  }
  return [{ name: b?.flower_type || 'Custom Arrangement', arrangement_id: b?.arrangement_id || null, quantity: Math.max(1, Number(b?.quantity) || 1) }];
};
// [WHEN:…] preserves the order-entry date/time for older records. Service
// scheduling is stored separately in funeral_date and [SERVICE-TIME:…].
const parseWhen = (b) => {
  const m = /\[WHEN\s*:\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?\s*\]/i.exec(String(b?.notes || ''));
  if (m) return { date: m[1], time: m[2] ? toTimeOnly(m[2]) : '' };
  return { date: null, time: '' };
};
const getBookingNoteTag = (booking, tag) =>
  new RegExp(`\\[${tag}:([^\\]]*)\\]`, 'i').exec(String(booking?.notes || ''))?.[1]?.trim() || '';
const wasBookingEdited = booking => Boolean(getBookingNoteTag(booking, 'EDITED'));
const toTimeOnly = v => {
  const d = parseUtilDate(v);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
};

// Resolve a branch name from a branch reference (id, slug, or name).
// Used to convert the raw branch_id stored on bookings back to a
// human-readable branch name. If no argument is given it returns the
// name of the branch the logged-in user belongs to.
const resolveBranchName = (branchRef) => {
  const branches = getBranches();

  // No argument → resolve the current user's own branch.
  if (!branchRef) {
    const slug = getBranchSlug();
    const bid = getBranchId();
    const match = branches.find(b =>
      (b.branchSlug || b.branch_slug) === slug ||
      String(b.branchId || b.branch_id) === String(bid || '')
    );
    return (match && (match.branchName || match.branch_name)) || slug || '';
  }

  // Caller passed an explicit branch reference — resolve it to a name.
  const ref = String(branchRef);

  // 1) It's already a plain name (not a UUID/slug).
  if (branches.find(b => (b.branchName || b.branch_name || b.name) === branchRef)) {
    return branchRef;
  }

  // 2) Match against branch id or slug.
  const match = branches.find(b =>
    String(b.branchId || b.branch_id || b.id) === ref ||
    String(b.branchSlug || b.branch_slug) === ref
  );
  if (match) {
    return match.branchName || match.branch_name || match.name || branchRef;
  }

  // 3) Fallback — return the original value (it may already be a name).
  return branchRef;
};

// Convert a raw DB booking_id (usually a UUID) into a short, readable code
// like:  BK-M-Kariuki-20250815-A3F9K
// so users can recognise it in toasts, detail crumbs, etc.
const shortBookingCode = (b) => {
  if (!b || !b.booking_id) return '—';
  if (b.booking_code) return b.booking_code; // already provided by backend

  const parts = [];
  if (b.branch && typeof b.branch === 'string' && b.branch.length >= 1) {
    parts.push(b.branch.charAt(0).toUpperCase());
  } else if (b.deceased_name) {
    parts.push(b.deceased_name.charAt(0).toUpperCase());
  }
  if (b.deceased_name) {
    parts.push(b.deceased_name.replace(/\s+/g, '').slice(0, 12));
  }
  const d = parseDate(b.date || b.delivery_date);
  if (d) {
    parts.push(fmtDateStr(d)); // YYYYMMDD
  }
  // 5-char random suffix
  parts.push(Math.random().toString(36).slice(2, 7).toUpperCase());
  return `BK-${parts.join('-')}`;
};

// Real logged-in username straight from localStorage (`user` is written at
// login with { username, fullName, email, ... }). Used to auto-fill the
// "Booked By" field instead of asking the user to type their own name.
const getLocalUserName = () => {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    const u = raw ? JSON.parse(raw) : {};
    return u?.fullName || u?.full_name || u?.username || u?.name || u?.email || '';
  } catch { return ''; }
};

const FLX_RESPONSIVE = `
.flower-calendar {
  --fc-primary: #2563eb;
  --fc-primary-soft: rgba(37, 99, 235, .1);
  --fc-text: #212529;
  --fc-muted: #6c757d;
  --fc-line: #dee2e6;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 680px;
  overflow: hidden;
  border: 1px solid var(--fc-line);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(33, 37, 41, .06);
  color: var(--fc-text);
}
.flower-calendar-page {
  width: 100% !important;
  max-width: none !important;
  padding: 18px 24px 28px !important;
}
.flower-toolbar-calendar .flx-nav { display: none !important; }
.flower-calendar-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  width: 100%;
}
.flower-calendar-heading {
  display: flex;
  min-height: 68px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 !important;
  padding: 13px 20px;
  border-bottom: 1px solid var(--fc-line);
}
.flower-calendar-title {
  color: var(--fc-text);
  font-family: inherit !important;
  font-size: 20px !important;
  font-weight: 600 !important;
}
.flower-calendar-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flower-calendar-nav button {
  display: inline-flex;
  min-width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid var(--fc-line);
  border-radius: 6px;
  background: #fff;
  color: #495057;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}
.flower-calendar-nav button:hover {
  border-color: #b6c8f8;
  background: #f8faff;
  color: var(--fc-primary);
}
.flower-calendar .flx-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  background: var(--fc-line);
}
.flower-calendar .flx-cal-weekday {
  padding: 10px 5px;
  background: #f8f9fa;
  color: #495057 !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
}
.flower-calendar .flx-cal-days {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(6, minmax(150px, 1fr));
  gap: 1px;
  align-content: stretch;
  background: var(--fc-line);
}
.flower-calendar .flx-cal-day {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 150px;
  flex-direction: column;
  overflow: hidden;
  padding: 7px;
  border: 0 !important;
  border-radius: 0;
  background: #fff !important;
  cursor: pointer;
  opacity: 1 !important;
  transition: background .15s ease;
}
.flower-calendar .flx-cal-day:hover { background: #f8f9fa !important; }
.flower-calendar .flx-cal-day:focus-visible {
  z-index: 2;
  outline: 2px solid var(--fc-primary);
  outline-offset: -2px;
}
.flower-calendar .flx-cal-day.is-outside { background: #fafbfc !important; }
.flower-calendar .flower-calendar-date {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #495057;
  font-size: 12px;
  font-weight: 500;
}
.flower-calendar .flx-cal-day.is-outside .flower-calendar-date { color: #adb5bd; }
.flower-calendar .flx-cal-day.is-today .flower-calendar-date {
  background: var(--fc-primary) !important;
  color: #fff !important;
  font-weight: 700;
}
.flower-calendar .flx-cal-day.is-selected {
  box-shadow: inset 0 0 0 2px var(--fc-primary);
}
.flower-calendar .flx-cal-event {
  display: flex;
  min-height: 36px;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  margin: 3px 0 0;
  padding: 4px 6px;
  border-left: 3px solid currentColor;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flower-calendar-event-name,
.flower-calendar-event-info {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flower-calendar-event-name { font-size: 10px; font-weight: 800; }
.flower-calendar-event-info { margin-top: 2px; font-size: 9px; font-weight: 600; opacity: .95; }
.flower-calendar .flower-calendar-more {
  padding: 3px 5px !important;
  color: var(--fc-muted) !important;
  font-size: 10px !important;
  text-align: left;
}
.flower-calendar-selected-day {
  margin: 0 !important;
  padding: 18px 20px;
  border-top: 1px solid var(--fc-line);
}
.flower-calendar-selected-day h2 {
  margin: 0;
  color: var(--fc-text);
  font-family: inherit !important;
  font-size: 16px !important;
}
.flower-calendar-selected-day > div > button {
  border-radius: 6px !important;
  background: var(--fc-primary) !important;
}
@media (max-width: 700px) {
  .flower-calendar-page { padding: 10px !important; }
  .flower-calendar { min-height: 0; flex-direction: column; }
  .flower-calendar-heading { min-height: 58px; padding: 10px 12px; }
  .flower-calendar-title { font-size: 17px !important; }
  .flower-calendar-nav button { min-width: 30px; height: 32px; padding: 0 7px; }
  .flower-calendar .flx-cal-weekday { padding: 8px 1px; font-size: 9px; }
  .flower-calendar .flx-cal-day { min-height: 120px; padding: 3px; }
  .flower-calendar .flx-cal-days { grid-template-rows: repeat(6, minmax(120px, auto)); }
  .flower-calendar .flower-calendar-date { width: 22px; height: 22px; font-size: 10px; }
  .flower-calendar .flx-cal-event { min-height: 27px; padding: 3px 3px; border-left-width: 2px; }
  .flower-calendar-event-name { font-size: 8px; }
  .flower-calendar-event-info { margin-top: 1px; font-size: 7px; }
  .flower-calendar-selected-day { padding: 14px 10px; }
}
.flower-urgency-strip {
  --flower-urgency-ink: #14201b;
  --flower-urgency-muted: #6a7570;
  --flower-urgency-line: #e8ebea;
  position: relative;
  display: flex;
  height: 64px;
  margin: 0 14px 12px;
  overflow: hidden;
  border: 1px solid #efe3e8;
  border-radius: 16px;
  background: linear-gradient(90deg, rgba(255, 250, 252, .92), rgba(252, 244, 247, .92));
  box-shadow: 0 10px 32px rgba(120, 30, 60, .1), inset 0 1px 0 rgba(255, 255, 255, .8);
  color: var(--flower-urgency-ink);
}
.flower-urgency-strip::after {
  position: absolute;
  z-index: 3;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(229, 23, 63, .25);
  content: '';
  inset: 0;
  pointer-events: none;
  animation: flower-urgency-alarm 2.4s ease-in-out infinite;
}
.flower-urgency-label {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 11px;
  padding: 0 18px 0 14px;
  background: linear-gradient(135deg, #ee1c46, #c4103a);
  color: #fff;
}
.flower-urgency-icon {
  position: relative;
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, .22);
}
.flower-urgency-icon::after {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, .85);
  border-radius: 50%;
  content: '';
  inset: 0;
  animation: flower-urgency-sonar 1.6s ease-out infinite;
}
.flower-urgency-label strong,
.flower-urgency-label small {
  display: block;
  white-space: nowrap;
}
.flower-urgency-label strong {
  font-size: 13px;
  font-weight: 700;
}
.flower-urgency-label small {
  color: rgba(255, 255, 255, .88);
  font-size: 11px;
}
.flower-urgency-marquee {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
}
.flower-urgency-track {
  display: flex;
  width: max-content;
  height: 100%;
  animation: flower-urgency-run 120s linear infinite;
}
.flower-urgency-marquee:hover .flower-urgency-track,
.flower-urgency-marquee:focus-within .flower-urgency-track {
  animation-play-state: paused;
}
.flower-urgency-set {
  display: flex;
  flex: none;
  min-width: 100%;
}
.flower-urgency-item {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  padding: 0 22px;
  white-space: nowrap;
}
.flower-urgency-item::after {
  position: absolute;
  top: 17px;
  right: 0;
  bottom: 17px;
  width: 1px;
  background: var(--flower-urgency-line);
  content: '';
}
.flower-urgency-glyph {
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
}
.flower-urgency-when {
  color: #c4103a;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.flower-urgency-what {
  display: grid;
  max-width: 210px;
  line-height: 1.25;
}
.flower-urgency-what strong,
.flower-urgency-what span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.flower-urgency-what strong {
  font-size: 12px;
  font-weight: 600;
}
.flower-urgency-what span {
  color: var(--flower-urgency-muted);
  font-size: 10px;
}
.flower-urgency-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 999px;
  background: #d6246e;
  color: #fff;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.flower-urgency-pill i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.flower-urgency-item.is-soon .flower-urgency-when,
.flower-urgency-item.is-soon .flower-urgency-glyph {
  color: #b26a00;
}
.flower-urgency-item.is-soon .flower-urgency-pill {
  background: #fff1d6;
  color: #8a5a00;
}
.flower-urgency-item.is-later .flower-urgency-when,
.flower-urgency-item.is-later .flower-urgency-glyph {
  color: #2f7a58;
}
.flower-urgency-item.is-later .flower-urgency-pill {
  background: #e6f3ec;
  color: #2f7a58;
}
.flower-urgency-overflow {
  display: flex;
  flex: none;
  align-items: center;
  gap: 9px;
  padding: 0 22px;
  color: #c4103a;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
@keyframes flower-urgency-alarm {
  50% { box-shadow: inset 0 0 0 1px rgba(229, 23, 63, .7), inset 0 0 22px rgba(229, 23, 63, .12); }
}
@keyframes flower-urgency-sonar {
  to { transform: scale(1.8); opacity: 0; }
}
@keyframes flower-urgency-run {
  to { transform: translateX(-50%); }
}

@media (max-width: 640px) {
  /* Toolbar: stack nav/buttons, no scattered gaps */
  .flx-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
  .flx-nav { margin-right: 0 !important; flex-wrap: wrap !important; gap: 6px !important; align-items: center !important; }
  .flx-nav > button { flex: 1 1 100% !important; }
  .flx-toggle { width: 100% !important; }
  .flx-toggle > button { flex: 1 1 48% !important; white-space: nowrap !important; }
  .flx-actions { width: 100% !important; }
  .flx-actions > button { flex: 1 1 100% !important; white-space: normal !important; }


     
  .flx-strip {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    scrollbar-width: none !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }
  .flx-strip::-webkit-scrollbar { display: none !important; }
  .flx-strip > button { flex: 0 0 42px !important; min-width: 42px !important; padding-left: 2px !important; padding-right: 2px !important; }

  .flower-urgency-strip { height: 58px; margin: 0 8px 10px; }
  .flower-urgency-label { gap: 8px; padding: 0 11px; }
  .flower-urgency-icon { width: 32px; height: 32px; flex-basis: 32px; }
  .flower-urgency-label strong { font-size: 11px; }
  .flower-urgency-label small { font-size: 9px; }
  .flower-urgency-item { gap: 7px; padding: 0 14px; }
  .flower-urgency-what { max-width: 140px; }
  .flower-urgency-when { font-size: 10px; }
  .flower-urgency-pill { padding: 4px 7px; font-size: 9px; }

  /* Samples gallery — one card per row. The grid used a fixed 200px minimum,
     which still fitted TWO columns on a 375px phone once padding was added,
     leaving a ~110px thumbnail too small to judge the arrangement's quality. */
  .fb-samples-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
  .fb-sample-media { height: 240px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .flower-urgency-strip::after,
  .flower-urgency-icon::after,
  .flower-urgency-track { animation: none; }
  .flower-urgency-marquee { overflow-x: auto; }
}


.fb-samples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

.fb-sample-card {
  background: #fff;
  border: 1px solid #EAE7E2;
  border-radius: 20px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  /* A long arrangement title must not stretch the track and break the grid. */
  min-width: 0;
}

.fb-sample-media {
  position: relative;
  width: 100%;
  /* 4:3 reads well for a floral arrangement and gives real estate to the
     image rather than to the card chrome. */
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #1C1A17;
}

.fb-sample-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* Slight lift on hover so a client browsing options can tell the tiles
     apart; transitions only on capable pointers. */
  transition: transform .25s ease;
}

@media (hover: hover) and (pointer: fine) {
  .fb-sample-card:hover .fb-sample-media img { transform: scale(1.03); }
}

/* Multi-photo badge, bottom-right of the thumbnail. */
.fb-sample-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, .62);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .02em;
  padding: 3px 8px;
  border-radius: 999px;
  backdrop-filter: blur(3px);
  pointer-events: none;
}

.fb-sample-title {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Playfair Display', serif;
  margin-bottom: 4px;
  /* Wrap instead of overflowing the card. */
  overflow-wrap: anywhere;
}

.fb-sample-sub {
  font-size: 13px;
  color: #9C9389;
  margin-bottom: 12px;
  overflow-wrap: anywhere;
}
`;

const FlowerBookingsNew = () => {
  const { socket, connected } = useSocket()
  const [bookings, setBookings] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  // Deep-link support: ?view=samples opens this page straight on the uploaded
  // arrangements grid. LEGACY — the ReceptionPortal's "Flower Arrangements" tile
  // now links to the standalone user-facing gallery at
  // /<slug>/flower-samples (florists/Samples.jsx). This param is kept
  // only so older bookmarks / cached builds still land somewhere sensible.
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return v === 'samples' ? 'samples' : 'list';
  });
  const [urgencyNow, setUrgencyNow] = useState(() => Date.now());
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editingLineItems, setEditingLineItems] = useState([]);
  const [editingInitialQuantity, setEditingInitialQuantity] = useState(null);
  const imageCarouselRef = useRef(null);
  const [newBooking, setNewBooking] = useState({
    arrangement_type: '',
    flower_designs: '',
    initials: '',
    coffin_type: '',
    flower_details: '',
    color_preference: '',
    any_color: true,
    ribbon_message: '',
    size: '',
    quantity: 1,
    service_type: 'Funeral service before final burial',
    funeral_date: '',
    service_time: '',
    route: '',
    vehicle_plate: '',
    contact_name: '',
    remarks: '',
    deceased_name: '',
    // Kin contact — stored as `customer_phone` and shown in the booking side panel.
    phone: '',
    branch: '',
    date: fmtDateStr(new Date()),   // the day the order was placed — calendar tracks it
    time: '10:00',
    priority: 'Normal',
    sample_uploads: []
  });
  const [toasts, setToasts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Upload-in-flight flag — multi-image phone photos can take a while; without
  // this the Create button looks idle, users click again, and the parallel
  // requests race (or the aborted first request still lands as a duplicate).
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [arrangements, setArrangements] = useState([]);
  // Which sample is being deleted right now (null = none) — keeps the button
  // disabled + "Deleting…" so a slow request can't be fired twice.
  const [deletingId, setDeletingId] = useState(null);
  // Guards against double-click / double-submit creating duplicate orders
  const [placingOrder, setPlacingOrder] = useState(false);
  const placingRef = useRef(false);
  // Auto-scrolls the mobile date strip so today's chip is in view
  const stripRef = useRef(null);

  const loadArrangements = useCallback(async () => {
    try {
      // Explicit tenant scoping — the florist service filters flower_samples by
      // the x-tenant-id header (also sent) and the tenant_id query param.

      const res = await api.get('/florist/flower-samples/', {
        params: { tenant_id: getTenantId() || undefined },
      });
      setArrangements(res.data.data || []);
    } catch (e) {
      console.error('Failed to load arrangements:', e);
    }
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {

      // TENANT-WIDE fetch: scoped by tenant id ONLY (never branch), so ALL
      // flower bookings from every branch appear together in this one space.

      const res = await api.get('/florist/bookings', {
        params: { tenant_id: getTenantId() || undefined },
      });
      setBookings(res.data.data || []);
    } catch (e) {
      console.error('[FlowerBookings] Failed to load bookings:', e?.response?.status, e?.response?.data || e.message);
      showToast(e.friendlyMessage || 'Failed to load bookings', 'error');
    }
    setLoading(false);
  }, [showToast]);

  // Real-time socket listeners for flower bookings
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('[FlowerBookings] Setting up real-time listeners');

    const handleNewBooking = (data) => {
      console.log('[FlowerBookings] New booking received:', data);
      showToast(`New booking: ${data.flowerType || 'Flower booking'} for ${data.deceasedName || 'customer'}`, 'success');
      loadBookings();
    };

    const handleBookingUpdated = (data) => {
      console.log('[FlowerBookings] Booking updated:', data);
      showToast(`Booking ${data.bookingId} status changed to ${data.status}`, 'info');
      loadBookings();
    };

    const handleBookingDeleted = (data) => {
      console.log('[FlowerBookings] Booking deleted:', data);
      showToast(`Booking ${data.bookingId} has been cancelled`, 'error');
      loadBookings();
    };

    socket.on('notification:flower-booking-created', handleNewBooking);
    socket.on('notification:flower-booking-updated', handleBookingUpdated);
    socket.on('notification:flower-booking-deleted', handleBookingDeleted);

    return () => {
      console.log('[FlowerBookings] Cleaning up socket listeners');
      socket.off('notification:flower-booking-created', handleNewBooking);
      socket.off('notification:flower-booking-updated', handleBookingUpdated);
      socket.off('notification:flower-booking-deleted', handleBookingDeleted);
    };
  }, [socket, connected, showToast, loadBookings]);

  useEffect(() => {
    loadArrangements();
    loadBookings();
  }, [loadBookings, loadArrangements]);

  useEffect(() => {
    const timer = setInterval(() => setUrgencyNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll the mobile date strip so today's chip is in view.
  // The rail starts at today; scroll it directly without moving the page.
  useEffect(() => {
    if (view !== 'list') return;
    const t = setTimeout(() => {
      const rail = stripRef.current;
      if (rail && rail.scrollLeft !== 0) rail.scrollTo({ left: 0, behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(t);
  }, [view, calDate]);

  // The calendar and date filters use the funeral/service date first, then
  // fall back to the original booking date for older or unscheduled records.
  const bookingDateKey = (b) =>
    toDateOnly(b?.funeral_date)
    || parseWhen(b).date
    || toDateOnly(b?.created_at)
    || toDateOnly(b?.delivery_date || b?.date);

  const getEventsForDate = useCallback((dateStr) => {
    // Put the booking on its funeral/service date; legacy unscheduled rows fall
    // back to their original booking date.
    return bookings.filter(b => bookingDateKey(b) === dateStr);
  }, [bookings]);

  const flowerUrgency = useMemo(() => {
    const today = todayKey();
    const now = urgencyNow;
    const dueLimit = now + 48 * 60 * 60 * 1000;
    const activeUpcoming = bookings.flatMap(booking => {
      if (['completed', 'cancelled'].includes(String(booking.status || '').toLowerCase())) return [];
      const dateKey = toDateOnly(booking.funeral_date);
      if (!dateKey || dateKey < today) return [];
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
      if (!match) return [];
      const dueDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
      const hoursUntil = (dueDate.getTime() - now) / (60 * 60 * 1000);
      const isDueToday = dateKey === today;
      return [{
        booking,
        dateKey,
        dueDate,
        hoursUntil: Math.max(0, hoursUntil),
        isDueToday,
      }];
    }).sort((a, b) => a.dueDate - b.dueDate);
    return {
      upcoming: activeUpcoming,
      dueSoon: activeUpcoming.filter(item => item.isDueToday || item.dueDate.getTime() <= dueLimit),
    };
  }, [bookings, urgencyNow]);

  const getBookingDotColor = (b) => {
    switch (normStatus(b.status)) {
      case 'completed': return '#059669';
      case 'cancelled': return '#dc2626';
      default: return '#2563eb';   // Blue matches the Metis calendar's primary event color.
    }
  };

  const calendarItems = useMemo(() => {
    return bookings.map(b => ({
      ...b,
      _calDate: bookingDateKey(b),
    }));
  }, [bookings]);

  // Order-count per date — powers the mini-calendar dots & mobile date strip
  const evCountByDate = useMemo(() => {
    const m = {};
    bookings.forEach(b => {
      const k = bookingDateKey(b);
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [bookings]);

  const calNav = useCallback((dir) => {
    const d = new Date(calDate.getTime());
    d.setMonth(d.getMonth() + dir);
    setCalDate(d);
  }, [calDate]);

  const calToday = useCallback(() => {
    setCalDate(new Date());
    setSelectedDate(todayKey());
  }, []);

  const openDayList = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setActiveBookingId(null);
    setView('list');
  }, []);

  const viewBooking = useCallback((id) => {
    setActiveBookingId(id);
    setView('list');
  }, []);

  const backToList = useCallback(() => {
    setActiveBookingId(null);
    setView('list');
  }, []);

  const openNewBookingForm = useCallback((dateStr) => {
    setEditingBookingId(null);
    setEditingLineItems([]);
    setEditingInitialQuantity(null);
    setNewBooking({
      arrangement_type: '',
      flower_designs: '',
      initials: '',
      coffin_type: '',
      flower_details: '',
      color_preference: '',
      any_color: true,
      ribbon_message: '',
      size: '',
      quantity: 1,
      service_type: 'Funeral service before final burial',
      funeral_date: '',
      service_time: '',
      route: '',
      vehicle_plate: '',
      contact_name: '',
      remarks: '',
      deceased_name: '',
      phone: '',
      branch: '',
      date: dateStr || fmtDateStr(new Date()),
      time: '10:00',
      priority: 'Normal',
      sample_uploads: [],
    });
    setView('new');
  }, []);

  const openEditBooking = useCallback((booking) => {
    const lineItems = parseLineItems(booking);
    const notes = String(booking?.notes || '');
    const humanNotes = notes
      .replace(/\[(?:TYPES|WHEN|DESIGN|INITIALS|COFFIN|ROUTE|VEHICLE|CONTACT|SERVICE-TIME|EDITED|PRIORITY):[^\]]*\]/gi, '')
      .trim();
    const storedColors = [...asList(booking?.primary_color), ...asList(booking?.accent_color)]
      .filter(color => !/^any color/i.test(color));
    const when = parseWhen(booking);
    setEditingLineItems(lineItems);
    setEditingInitialQuantity(lineItems[0]?.quantity || 1);
    setEditingBookingId(String(booking?.id || booking?.booking_id || ''));
    setNewBooking({
      arrangement_type: lineItems.map(item => item.name).join(', '),
      flower_designs: getBookingNoteTag(booking, 'DESIGN'),
      initials: getBookingNoteTag(booking, 'INITIALS'),
      coffin_type: getBookingNoteTag(booking, 'COFFIN'),
      flower_details: booking?.flower_description || [...new Set(lineItems.flatMap(item => item.types || []))].join(', '),
      color_preference: storedColors.join(', '),
      any_color: storedColors.length === 0,
      ribbon_message: booking?.ribbon_message || '',
      size: booking?.size || '',
      quantity: lineItems[0]?.quantity || 1,
      service_type: booking?.service_type || 'Funeral service before final burial',
      funeral_date: toDateOnly(booking?.funeral_date) || '',
      service_time: getBookingNoteTag(booking, 'SERVICE-TIME'),
      route: getBookingNoteTag(booking, 'ROUTE'),
      vehicle_plate: getBookingNoteTag(booking, 'VEHICLE'),
      contact_name: getBookingNoteTag(booking, 'CONTACT'),
      remarks: booking?.special_instructions || humanNotes,
      deceased_name: booking?.deceased_name || '',
      phone: booking?.customer_phone || '',
      branch: booking?.branch || '',
      date: when.date || bookingDateKey(booking) || fmtDateStr(new Date()),
      time: when.time || toTimeOnly(booking?.time) || '10:00',
      priority: getBookingNoteTag(booking, 'PRIORITY') || booking?.priority || 'Normal',
      sample_uploads: [],
    });
    setView('new');
  }, []);

  const submitBooking = useCallback(async (e) => {
    e.preventDefault();
    // A double-click must never create a duplicate or race a booking update.
    if (placingRef.current) return;
    if (!newBooking.deceased_name?.trim()) return showToast('Please enter the deceased name', 'error');

    const requestedArrangements = splitCommaList(newBooking.arrangement_type);
    const flowerDesigns = splitCommaList(newBooking.flower_designs);
    const typedTypes = splitCommaList(newBooking.flower_details);
    if (!requestedArrangements.length && !typedTypes.length && !editingBookingId) {
      return showToast('Enter the requested flower item or flower details', 'error');
    }
    const arrangementTypes = requestedArrangements.length ? requestedArrangements : ['Flower order'];
    const colors = splitCommaList(newBooking.color_preference);
    const quantityPerArrangement = Math.max(1, Number(newBooking.quantity) || 1);
    const preserveArrangementQuantities = editingBookingId
      && Number(newBooking.quantity) === editingInitialQuantity;
    const items = arrangementTypes.map(name => {
      const existing = preserveArrangementQuantities
        ? editingLineItems.find(item => item.name === name)
        : null;
      return {
        arrangement_id: existing?.arrangement_id ?? null,
        name,
        types: typedTypes,
        colors: newBooking.any_color ? [] : colors,
        quantity: existing?.quantity || quantityPerArrangement,
      };
    });
    const headline = arrangementTypes.join(', ');
    placingRef.current = true;
    setPlacingOrder(true);

    try {
      // ONE row = ONE order containing the exact client-requested items/details.
      const clean = s => String(s || '').replace(/\|/g, '/').replace(/[[\]]/g, '').trim();
      // Keep the order-entry date for legacy feeds; funeral_date is the service
      // date used by the operations calendar.
      const bookedOn = newBooking.date || fmtDateStr(new Date());
      const designTag = flowerDesigns.length ? `[DESIGN:${flowerDesigns.map(clean).join(', ')}]` : '';
      const initialsTag = newBooking.initials?.trim()
        ? `[INITIALS:${splitCommaList(newBooking.initials).map(clean).join(', ')}]`
        : '';
      const coffinType = newBooking.coffin_type.trim();
      const coffinTag = coffinType ? `[COFFIN:${clean(coffinType)}]` : '';
      const routeTag = newBooking.route?.trim() ? `[ROUTE:${clean(newBooking.route)}]` : '';
      const vehicleTag = newBooking.vehicle_plate?.trim() ? `[VEHICLE:${clean(newBooking.vehicle_plate)}]` : '';
      const contactTag = newBooking.contact_name?.trim() ? `[CONTACT:${clean(newBooking.contact_name)}]` : '';
      const serviceTimeTag = newBooking.service_time?.trim() ? `[SERVICE-TIME:${clean(newBooking.service_time)}]` : '';
      const editedTag = editingBookingId ? `[EDITED:${new Date().toISOString()}]` : '';
      const priorityTag = newBooking.priority?.trim() ? `[PRIORITY:${clean(newBooking.priority)}]` : '';
      const notesValue = [
        `[TYPES:${items.map(i => clean(i.name)).join('|')}]`,
        `[WHEN:${bookedOn} ${newBooking.time}]`,
        flowerDesigns.length ? designTag : '',
        initialsTag,
        coffinTag,
        routeTag,
        vehicleTag,
        contactTag,
        serviceTimeTag,
        priorityTag,
        editedTag,
      ].filter(Boolean).join(' ');
      const payload = {
        arrangement_name: headline.slice(0, 255),
        arrangement_type: arrangementTypes.join(', '),
        arrangement_id: null,
        flower_type: headline.slice(0, 100),
        flower_description: typedTypes.join(', '),
        arrangements: items,
        service_type: newBooking.service_type || 'Funeral service before final burial',
        ribbon_color: newBooking.any_color ? null : colors[0] || null,
        primary_color: newBooking.any_color ? 'Any color (florist choice)' : colors[0] || null,
        accent_color: newBooking.any_color ? null : colors.slice(1).join(', ') || null,
        ribbon_message: newBooking.ribbon_message?.trim() || null,
        special_instructions: newBooking.remarks?.trim() || null,
        funeral_date: newBooking.funeral_date || null,
        quantity: items.reduce((total, item) => total + item.quantity, 0),
        size: newBooking.size?.trim() || null,
        deceased_name: newBooking.deceased_name.trim(),
        booked_by: getLocalUserName() || 'System',
        // Kin contact — becomes `customer_phone` on the server, shown in the
        // booking side panel as "Phone Number".
        phone: newBooking.phone.trim() || null,
        customer_phone: newBooking.phone.trim() || null,
        branch: resolveBranchName(newBooking.branch) || newBooking.branch || undefined,
        funeral_home: resolveBranchName(newBooking.branch) || newBooking.branch || undefined,
        date: bookedOn,
        time: newBooking.time,
        priority: newBooking.priority,
        notes: notesValue.trim() || null,
        sample_uploads: newBooking.sample_uploads || [],
      };
      if (editingBookingId) {
        await api.put(`/florist/bookings/${encodeURIComponent(editingBookingId)}`, payload);
        showToast('Flower booking updated');
      } else {
        await api.post('/florist/bookings', payload);
        showToast(items.length > 1 ? `${items.length} flower orders placed!` : 'Booking placed successfully!');
      }

      await loadBookings();
      if (editingBookingId) setActiveBookingId(editingBookingId);
      setView('list');
      setEditingBookingId(null);
      setEditingLineItems([]);
      setEditingInitialQuantity(null);
      setNewBooking({
        arrangement_type: '',
        flower_designs: '',
        initials: '',
        coffin_type: '',
        flower_details: '',
        color_preference: '',
        any_color: true,
        ribbon_message: '',
        size: '',
        quantity: 1,
        service_type: 'Funeral service before final burial',
        funeral_date: '',
        service_time: '',
        route: '',
        vehicle_plate: '',
        contact_name: '',
        remarks: '',
        deceased_name: '',
        phone: '',
        branch: '',
        date: fmtDateStr(new Date()),
        time: '10:00',
        priority: 'Normal',
        sample_uploads: []
      });
    } catch (e) {
      console.error('[FlowerBookings] Place order FAILED:', e?.response?.status, e?.response?.data || e.message);
      showToast(e.response?.data?.message || e.friendlyMessage || `Failed to ${editingBookingId ? 'update' : 'create'} booking`, 'error');
    } finally {
      placingRef.current = false;
      setPlacingOrder(false);
    }
  }, [newBooking, editingBookingId, editingLineItems, editingInitialQuantity, showToast, loadBookings]);

  const updateStatus = useCallback(async (id, nextStatus) => {
    const url = `/florist/bookings/${id}/status`;
    console.info(`[FlowerBookings] PATCH ${url} →`, nextStatus);
    try {
      await api.patch(url, { status: nextStatus });
      showToast(`Status updated to ${STATUS_LABELS[nextStatus] || nextStatus}`);
      await loadBookings();
    } catch (e) {
      // Full diagnostics in the console so failures are never silent
      console.error('[FlowerBookings] Status update FAILED:', {
        url,
        nextStatus,
        httpStatus: e?.response?.status,
        serverSaid: e?.response?.data,
        message: e?.message
      });
      showToast(
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.friendlyMessage ||
        `Failed to update status${e?.response ? ` (HTTP ${e.response.status})` : ''}`,
        'error'
      );
    }
  }, [showToast, loadBookings]);

  // ─── Image preflight ────────────────────────────────────────────────────────
  //
  // WHY THIS EXISTS. The server accepts 15MB per photo but REJECTS the entire
  // request when one file breaches a limit, discarding every photo already
  // buffered along with the user's typed title and description. That is the
  // "arrangements sometimes fail" experience: it only triggers on bigger batches,
  // so it looks random.
  //
  // Catching it HERE costs the user nothing — they keep their form, get told
  // exactly which photo is the problem, and can fix it before anything is sent.
  //
  // DELIBERATELY NOT COMPRESSING. The gallery must show the florist's work at
  // full quality, so files are sent byte-for-byte. We only MEASURE here.
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  const MAX_IMAGE_COUNT = 10;

  const inspectImages = (files) => {
    const list = Array.from(files || []).filter((f) => f && f.size > 0);
    if (list.length > MAX_IMAGE_COUNT) {
      return `You selected ${list.length} photos. You can upload up to ${MAX_IMAGE_COUNT} per arrangement.`;
    }
    const oversized = list.find((f) => f.size > MAX_IMAGE_BYTES);
    if (oversized) {
      const mb = (oversized.size / (1024 * 1024)).toFixed(1);
      return `"${oversized.name}" is ${mb}MB, which is over the 15MB limit. Please compress it or upload it on its own.`;
    }
    const wrongType = list.find((f) => f.type && !f.type.startsWith('image/'));
    if (wrongType) {
      return `"${wrongType.name}" is not an image. Please choose photo files only.`;
    }
    return null;
  };

  const handleCreateArrangement = async (e) => {
    e.preventDefault();
    // Guard against double clicks while an upload is in flight
    if (creatingRef.current) return;
    const form = e.target;
    const fd = new FormData(form);

    // Build the payload explicitly with trimmed values so a spaces-only input
    // can't slip past HTML validation and trip the server's non-empty checks.
    const title = String(fd.get('title') || '').trim();
    const types = String(fd.get('types') || '').trim();

    // Client-side validation with SPECIFIC messages — the backend's 400s would
    // otherwise be swallowed by the generic catch toast below. Whitespace-only
    // or comma-only values pass HTML `required` but produce empty arrays
    // server-side, so trim and check here.
    //
    // Description / Colors / Sizes were removed from this form at the user's
    // request. The backend accepts them as optional (description defaults to '',
    // colors/sizes stringify to NULL), so omitting them entirely is safe.
    if (!title) return showToast('Please enter an arrangement title', 'error');
    if (!types) return showToast('Please enter at least one flower type (comma-separated)', 'error');

    // Preflight the photos BEFORE anything is sent, so an oversized file never
    // costs the user their typed details (see inspectImages for the why).
    const imageProblem = inspectImages(fd.getAll('images'));
    if (imageProblem) return showToast(imageProblem, 'error');

    const payload = new FormData();
    payload.append('title', title);
    payload.append('types', types);
    // description / colors / sizes are no longer collected — the backend treats
    // them as optional, so they are simply left off the payload.
    const files = fd.getAll('images').filter(f => f && f.size > 0);
    files.forEach(f => payload.append('images', f));

    creatingRef.current = true;
    setCreating(true);
    try {
      // NOTE: explicitly null the Content-Type so the BROWSER generates the
      // multipart boundary itself. Hand-setting 'multipart/form-data' (the
      // old code) sent the body WITHOUT a boundary= parameter → multer failed
      // with 400 "Multipart: Boundary not found" every single time. Passing
      // null also overrides the api instance's default 'application/json',
      // which would otherwise make axios JSON-serialize the FormData (files
      // lost, no multipart at all).
      //
      // The per-request timeout override matters just as much: the global
      // axios timeout is 30s, and a set of full-quality phone photos on a slow
      // uplink routinely takes longer. Without this, axios aborted the request
      // client-side (error toast) while the server still finished creating the
      // record — the classic "first try fails, retry works" + duplicates bug.
      // Images are uploaded at ORIGINAL quality — no client-side compression.
      const res = await api.post('/florist/flower-samples', payload, {
        headers: { 'Content-Type': null },
        timeout: 180000,
      });

      const data = res.data;
      if (data.success) {
        showToast('Arrangement created successfully!');
        setShowCreateModal(false);
        form.reset();
        // Refresh the list IN PLACE — no page reload. The new sample appears
        // immediately in whichever view (bookings/samples) is active.
        await loadArrangements();
      } else {
        showToast(data.message || 'Failed to create arrangement', 'error');
      }
    } catch (err) {
      console.error('[FlowerBookings] Create arrangement FAILED:', {
        status: err?.response?.status,
        serverSaid: err?.response?.data,
        message: err?.message
      });
      // Surface the server's actual validation message (e.g. "Types must be a
      // non-empty array") instead of hiding it behind a generic toast.
      showToast(
        err.response?.data?.message ||
        err.friendlyMessage ||
        'Failed to create arrangement',
        'error'
      );
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  const deleteArrangement = useCallback(async (arrangement) => {
    const id = arrangement?.arrangement_id || arrangement?.id;
    if (!id) return showToast('This sample has no id and cannot be deleted', 'error');
    if (!window.confirm(`Delete "${arrangement.title || 'this sample'}"? This cannot be undone.`)) return;

    setDeletingId(String(id));
    try {
      await api.delete(`/florist/flower-samples/${encodeURIComponent(id)}`);
      showToast('Sample deleted');
      await Promise.all([loadArrangements(), loadBookings()]);
    } catch (err) {
      console.error('[FlowerBookings] Delete sample FAILED:', err?.response?.status, err?.response?.data || err.message);
      showToast(
        err?.response?.data?.message || err?.friendlyMessage || 'Failed to delete sample',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  }, [showToast, loadArrangements, loadBookings]);

  const renderFlowerUrgency = () => {
    const isHighVolume = flowerUrgency.upcoming.length > 60;
    if (!isHighVolume && flowerUrgency.dueSoon.length === 0) return null;
    const orders = flowerUrgency.dueSoon.length
      ? flowerUrgency.dueSoon
      : flowerUrgency.upcoming.slice(0, 12);
    const renderOrder = ({ booking, dateKey, hoursUntil, isDueToday }, index) => {
      const urgencyClass = isDueToday || hoursUntil < 8 ? 'is-hot' : hoursUntil < 24 ? 'is-soon' : 'is-later';
      const timeLabel = isDueToday
        ? 'Due today'
        : hoursUntil < 1
          ? 'Due shortly'
          : hoursUntil < 24
            ? `in ${Math.ceil(hoursUntil)} h`
            : `in ${Math.ceil(hoursUntil / 24)} d`;
      const dateLabel = new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-KE', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const location = booking.funeral_home || booking.branch || booking.service_type || 'Funeral service';
      return (
        <div className={`flower-urgency-item ${urgencyClass}`} key={`${booking.booking_id || booking.id || dateKey}-${index}`}>
          <Flower2 className="flower-urgency-glyph" aria-hidden="true" />
          <span className="flower-urgency-when">{dateLabel}</span>
          <span className="flower-urgency-what">
            <strong>{booking.flower_type || booking.arrangement_name || 'Flower order'}</strong>
            <span>{booking.deceased_name || 'Deceased record'} · {location}</span>
          </span>
          <span className="flower-urgency-pill"><i />{timeLabel}</span>
        </div>
      );
    };
    const renderOrderSet = (suffix, hidden = false) => (
      <div className="flower-urgency-set" key={suffix} aria-hidden={hidden || undefined}>
        {orders.map(renderOrder)}
        {isHighVolume && (
          <div className="flower-urgency-overflow">
            <span>{flowerUrgency.upcoming.length} upcoming flower bookings</span>
            <span>·</span>
            <span>Review the production schedule</span>
          </div>
        )}
      </div>
    );

    return (
      <div className="flower-urgency-strip" role="region" aria-label="Upcoming flower booking deadlines">
        <div className="flower-urgency-label">
          <div className="flower-urgency-icon"><Flower2 size={21} aria-hidden="true" /></div>
          <div>
            <strong>{flowerUrgency.dueSoon.length ? 'Urgent orders' : 'Busy schedule'}</strong>
            <small>
              {flowerUrgency.dueSoon.length
                ? `Next 48 hrs · ${flowerUrgency.dueSoon.length} due`
                : `${flowerUrgency.upcoming.length} upcoming bookings`}
            </small>
          </div>
        </div>
        <div
          className="flower-urgency-marquee"
          aria-label={flowerUrgency.dueSoon.length
            ? `${flowerUrgency.dueSoon.length} orders due within 48 hours`
            : `${flowerUrgency.upcoming.length} upcoming flower bookings`}
        >
          <div className="flower-urgency-track">
            {renderOrderSet('primary')}
            {renderOrderSet('duplicate', true)}
          </div>
        </div>
      </div>
    );
  };

  const renderToolbar = () => {
    const d = calDate;
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FLX_RESPONSIVE }} />
        <div className={`flx-toolbar${view === 'calendar' ? ' flower-toolbar-calendar' : ''}`} style={styles.toolbar}>
          <div className="flx-nav" style={styles.nav}>
            <div style={styles.title}>
              <button style={styles.arrowBtn} onClick={() => calNav(-1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              {MONTHS[d.getMonth()]} {d.getFullYear()}
              <button style={styles.arrowBtn} onClick={() => calNav(1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
            <button style={styles.todayBtn} onClick={calToday}>Today</button>
          </div>
          <div className="flx-toggle" style={styles.viewToggle}>
            <button style={styles.viewBtn(view === 'list')} onClick={() => setView('list')}>List</button>
            <button style={styles.viewBtn(view === 'calendar')} onClick={() => setView('calendar')}>Calendar</button>
          </div>
          <div className="flx-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                ...styles.placeBookingBtn,
                background: '#475A43',
                boxShadow: 'none'
              }}
              onClick={() => setShowCreateModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Create Arrangement
            </button>
            <button className="flower-place-booking" style={styles.placeBookingBtn} onClick={() => openNewBookingForm('')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Place Booking
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderList = () => {
    const query = bookingSearch.trim().toLowerCase();
    const visibleBookings = bookings.filter(booking => {
      const status = normStatus(booking.status);
      if (bookingStatusFilter !== 'all' && status !== bookingStatusFilter) return false;
      if (!query) return true;
      return [
        booking.booking_id, booking.booking_code, booking.flower_type, booking.flower_description,
        booking.deceased_name, booking.booked_by, booking.customer, booking.branch,
        booking.ribbon_message, booking.ribbon_color, booking.primary_color, booking.accent_color,
        booking.funeral_date, booking.deceased_gender, booking.notes, booking.special_instructions
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    });

    // Group orders by their funeral/service date, newest dates first.
    const sorted = [...visibleBookings].sort((a, b) => {
      const da = bookingDateKey(a) ? new Date(`${bookingDateKey(a)}T00:00:00`).getTime() : Infinity;
      const db = bookingDateKey(b) ? new Date(`${bookingDateKey(b)}T00:00:00`).getTime() : Infinity;
      return db - da;
    });
    const groups = {};
    sorted.forEach(b => {
      const key = bookingDateKey(b) || 'unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    // A selected date narrows the feed to bookings due for service that day.
    let entries = Object.entries(groups);
    if (selectedDate) entries = entries.filter(([date]) => date === selectedDate);

    const listHeader = (
      <div className="flower-list-tools">
        <div className="flower-list-heading">
          <div>
            <h1>Flower Bookings <small>· {visibleBookings.length} orders</small></h1>
          </div>
          <div className="flower-status-tabs" role="tablist" aria-label="Filter bookings by status">
            {['all', 'booked', 'completed'].map(status => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={bookingStatusFilter === status}
                className={bookingStatusFilter === status ? 'active' : ''}
                onClick={() => setBookingStatusFilter(status)}
              >
                {status === 'all' ? 'All' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
        <label className="flower-booking-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="search"
            value={bookingSearch}
            onChange={event => setBookingSearch(event.target.value)}
            placeholder="Search name, arrangement, flowers, or ribbon message"
            aria-label="Search flower bookings"
          />
        </label>
      </div>
    );

    if (entries.length === 0) {
      return (
        <>
          {listHeader}
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9389' }}>
            <Flower2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#574F47', marginBottom: '6px' }}>
              {selectedDate ? `Nothing on ${fmtDateOnly(selectedDate)}` : query || bookingStatusFilter !== 'all' ? 'No bookings match' : 'No bookings yet'}
            </h3>
            <p style={{ fontSize: '14px' }}>
              {selectedDate ? 'Pick another date, or view every order.' : 'Use Place Booking to add your first order.'}
            </p>
            {selectedDate && (
              <button type="button" onClick={() => setSelectedDate(null)} style={{ marginTop: '14px', padding: '8px 16px', border: '1px solid #E3DFD8', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#574F47' }}>
                Show All Dates
              </button>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {listHeader}
        {selectedDate && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', background: '#f0f7f4', border: '1px solid #CBE0D4',
            padding: '10px 14px', borderRadius: 0, marginBottom: '18px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2F4F3E' }}>
              Filtered · {fmtDateOnly(selectedDate)}
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              style={{ background: 'none', border: 'none', color: '#2F4F3E', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              Clear ✕
            </button>
          </div>
        )}
        {entries.map(([date, dayBookings]) => {
          const dateObj = date === 'unscheduled' ? null : new Date(date + 'T00:00:00');
          return (
            <div key={date} style={{ marginBottom: '32px' }}>
              <div style={styles.feedDateHeader}>
                <Calendar size={14} />
                {dateObj
                  ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Undated'}
              </div>
              {dayBookings.map(bk => renderBookingCard(bk))}
            </div>
          );
        })}
      </>
    );
  };

  /* ── Mini calendar rail (desktop) ── compact month grid beside the list ── */
  const renderMiniCalendar = () => {
    const d = calDate;
    const y = d.getFullYear(), mo = d.getMonth();
    const first = new Date(y, mo, 1);
    const startOff = (first.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(first, -startOff + i));
    const todayStr = todayKey();

    return (
      <div>
        <div style={styles.mcHead}>
          <strong style={styles.mcTitle}>{MONTHS[mo].slice(0, 3)} {y}</strong>
          <div style={styles.mcNav}>
            <button style={styles.arrowBtn} onClick={() => calNav(-1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button style={styles.arrowBtn} onClick={() => calNav(1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        <div style={styles.mcWkRow}>
          {WEEKDAYS.map(w => <span key={w} style={styles.mcWk}>{w}</span>)}
        </div>
        <div style={styles.mcGrid}>
          {days.map(day => {
            const ds = fmtDateStr(day);
            const out = day.getMonth() !== mo;
            const cnt = evCountByDate[ds] || 0;
            const sel = selectedDate === ds;
            const isT = ds === todayStr;
            const cell = { ...styles.mcCell };
            if (out && !sel) cell.color = '#D8D2C8';
            if (cnt > 0 && !sel) cell.background = '#f0f7f4';
            if (isT && !sel) { cell.borderColor = '#2F4F3E'; cell.color = '#2F4F3E'; }
            if (sel) { cell.background = '#2F4F3E'; cell.color = '#fff'; cell.borderColor = '#2F4F3E'; }
            return (
              <button
                key={ds}
                type="button"
                title={`${ds}${cnt ? ` · ${cnt} order${cnt > 1 ? 's' : ''}` : ''}`}
                onClick={() => setSelectedDate(sel ? null : ds)}
                style={cell}
              >
                {day.getDate()}
                {cnt > 0 && !sel && <span style={styles.mcDot} />}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#9C9389', letterSpacing: '0.04em' }}>
          Tap a date to filter the list
        </div>
      </div>
    );
  };

  /* ── Horizontal date strip (phones) ── ALWAYS starts at the current date ── */
  const renderDateStrip = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const strip = [];
    for (let i = 0; i < 45; i++) strip.push(addDays(start, i));
    // Today's key comes from the central date utility (no UTC shift)
    const todayStr = todayKey();
    return (
      <div
        className="flx-strip"
        ref={stripRef}
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x',
        }}
      >
        {strip.map(day => {
          const ds = fmtDateStr(day);
          const cnt = evCountByDate[ds] || 0;
          const sel = selectedDate === ds;
          const isT = ds === todayStr;
          const chip = { ...styles.stripDay };
          if (isT) { chip.borderColor = '#2F4F3E'; }
          if (sel) { chip.background = '#2F4F3E'; chip.color = '#fff'; chip.borderColor = '#2F4F3E'; }
          return (
            <button
              key={ds}
              type="button"
              data-today={isT ? '1' : undefined}
              onClick={() => setSelectedDate(sel ? null : ds)}
              style={chip}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: sel ? 0.85 : 0.6 }}>
                {WEEKDAYS[(day.getDay() + 6) % 7]}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>{day.getDate()}</span>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: cnt > 0 ? (sel ? '#fff' : getBookingDotColor({ status: bookings.find(x => bookingDateKey(x) === ds)?.status })) : 'transparent'
              }} />
            </button>
          );
        })}
      </div>
    );
  };

  const renderBookingCard = (b) => {
    const lineItems = parseLineItems(b);
    const firstName = lineItems[0]?.name || b.flower_type || '';
    // Match the arrangement ONLY by exact title — never fall back to a random
    // sample. Custom-typed orders (e.g. "CASKET SPRAY") must show their own
    // typed name, not some unrelated arrangement's data.
    const matchedSample = arrangements.find(a =>
      String(a.arrangement_id || a.id) === String(lineItems[0]?.arrangement_id || b.arrangement_id || '')
      || a.title === firstName
    );
    const product = matchedSample || {
      title: firstName || 'Custom Arrangement',
      images: [],
      types: [],
      colors: [],
      sizes: []
    };
    const statusCfg = normStatus(b.status) === 'completed'
      ? { label: 'Completed', color: '#15803D', bg: '#DCF5E5' }
      : normStatus(b.status) === 'cancelled'
        ? { label: 'Cancelled', color: '#B91C1C', bg: '#FDE4E4' }
        : { label: 'Booked', color: '#BE185D', bg: '#FCE0EC' };
    const initials = getBookingNoteTag(b, 'INITIALS');
    const priority = String(getBookingNoteTag(b, 'PRIORITY') || b.priority || 'Normal');
    const wasEdited = wasBookingEdited(b);

    // ── Card background by status ──
    // Every order status gets its own distinct tint so the list can be read
    // at a glance without opening a single card.
    const cardStyle = STATUS_CARD_STYLES[normStatus(b.status)] || { bg: '#fff', border: '#EAE7E2' };
    let cardBg = cardStyle.bg;
    let cardBorder = cardStyle.border;

    return (
      <div
        className={`fb-card${String(activeBookingId) === String(b.id) ? ' is-active' : ''}${wasEdited ? ' is-edited' : ''}`}
        data-status={normStatus(b.status)}
        style={{
          ...styles.bookingCard,
          background: cardBg,
          borderColor: wasEdited ? '#c4b5fd' : cardBorder,
          boxShadow: wasEdited ? 'inset 3px 0 0 #7c3aed' : styles.bookingCard.boxShadow,
        }}
        onClick={() => viewBooking(b.id)}
      >
        {product.images?.length > 0 ? (
          <div className="fb-card-thumb" style={styles.mediaThumb}>
            <img
              src={product.images[0]?.url || product.images[0]}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className={`flower-booking-avatar ${normStatus(b.status)}`} aria-hidden="true">
            {(b.deceased_name || '?').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div style={styles.bookingInfo}>
          <div className="fb-booking-name" style={styles.bookingName}>
            {b.flower_type || b.arrangement_name || product.title}
            {lineItems.length > 1 && <span className="flower-quantity-chip">+{lineItems.length - 1} more</span>}
            {Number(b.quantity) > 1 && <span className="flower-quantity-chip">×{b.quantity}</span>}
            {wasEdited && <span className="flower-edited-chip">Updated</span>}
          </div>
          <div className="fb-card-meta" style={styles.bookingMeta}>
            {lineItems.length > 0 && (
              <div style={styles.metaRow}>Arrangements: {lineItems.map(item => `${item.name} ×${item.quantity}`).join(' · ')}</div>
            )}
            {(b.flower_description || lineItems.length > 0) && (
              <div style={styles.metaRow}>Flowers: {b.flower_description || lineItems.map(i => i.name).join(' · ')}</div>
            )}
            <div style={styles.metaRow}><User size={14} /> {b.deceased_name}</div>
            {initials && <div className="flower-card-initials">Dedication: {initials}</div>}
            <div style={styles.metaRow}>
              <User size={14} /> Booked by {b.booked_by || b.customer || '—'}
              {(b.customer_phone || b.phone) ? ` · ${b.customer_phone || b.phone}` : ''}
            </div>
            {(b.branch || b.funeral_home) && getBranches().length > 1 && (
              <div style={styles.metaRow}>
                <Home size={14} /> {resolveBranchName(b.branch || b.funeral_home)}
              </div>
            )}
            {b.funeral_date && <div className="flower-funeral-date">Funeral {fmtDateOnly(b.funeral_date)}</div>}
            {(getBookingNoteTag(b, 'SERVICE-TIME') || getBookingNoteTag(b, 'ROUTE')) && (
              <div className="flower-booking-service-meta">
                {[getBookingNoteTag(b, 'SERVICE-TIME'), getBookingNoteTag(b, 'ROUTE')].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
        <div className="flx-card-right" style={styles.bookingRight}>
          {/* No "Expected By" line — the value it showed was the day the order
              was BOOKED, which the feed header already groups under. */}
          <div style={styles.pillsRow}>
            <span style={{ ...styles.priorityPill, background: priority.toLowerCase() === 'high' ? '#FEE2E2' : priority.toLowerCase() === 'low' ? '#DCFCE7' : '#F1F5F9', color: priority.toLowerCase() === 'high' ? '#B91C1C' : priority.toLowerCase() === 'low' ? '#166534' : '#475569' }}>
              {priority}
            </span>
            <span style={{ ...styles.statusPill, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    const todayStr = todayKey();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <section className="flower-calendar">
        <div className="flower-calendar-main">
          <div className="flower-calendar-heading">
            <div className="flower-calendar-title">{MONTHS[month]} {year}</div>
            <div className="flower-calendar-nav">
              <button type="button" aria-label="Previous month" onClick={() => calNav(-1)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={calToday}>Today</button>
              <button type="button" aria-label="Next month" onClick={() => calNav(1)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
          <div className="flx-cal-weekdays">
            {weekdays.map(day => <div className="flx-cal-weekday" key={day}>{day}</div>)}
          </div>
          <div className="flx-cal-days">
            {days.map(day => {
              const dateStr = fmtDateStr(day);
              const outside = day.getMonth() !== month;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const events = getEventsForDate(dateStr);
              const visible = events.slice(0, 3);
              const more = events.length - visible.length;

              return (
                <div
                  key={dateStr}
                  className={`flx-cal-day${outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${events.length ? ' has-bookings' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${day.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}${events.length ? `, ${events.length} booking${events.length === 1 ? '' : 's'}` : ', no bookings'}`}
                  onClick={() => openDayList(dateStr)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openDayList(dateStr);
                    }
                  }}
                >
                  <div className="flower-calendar-date">{day.getDate()}</div>
                  {visible.map((b, index) => {
                    const matchedSample = arrangements.find(a => a.title === b.flower_type);
                    const evTitle = matchedSample?.title || b.flower_type || 'Order';
                    const statusColor = getBookingDotColor(b);
                    const eventLabel = b.deceased_name || evTitle;
                    const eventInfo = [
                      getBookingNoteTag(b, 'SERVICE-TIME'),
                      getBookingNoteTag(b, 'ROUTE'),
                      evTitle,
                      b.flower_description,
                      getBookingNoteTag(b, 'INITIALS') ? `Dedication: ${getBookingNoteTag(b, 'INITIALS')}` : '',
                    ].filter(Boolean).join(' · ');
                    const eventTitle = [
                      eventLabel,
                      eventInfo,
                      getBookingNoteTag(b, 'COFFIN') ? `Coffin: ${getBookingNoteTag(b, 'COFFIN')}` : '',
                      b.special_instructions,
                      getBookingNoteTag(b, 'CONTACT') ? `T-Cord: ${getBookingNoteTag(b, 'CONTACT')}` : '',
                      b.customer_phone,
                    ].filter(Boolean).join(' · ');
                    return (
                      <div
                        className="flx-cal-event"
                        key={`${b.booking_id || b.id || dateStr}-${index}`}
                        title={eventTitle}
                        style={{ background: statusColor, color: '#fff', borderLeftColor: statusColor }}
                      >
                        <span className="flower-calendar-event-name">{eventLabel}</span>
                        <span className="flower-calendar-event-info">{eventInfo || 'Flower booking'}</span>
                      </div>
                    );
                  })}
                  {more > 0 && <div className="flower-calendar-more">+{more} more</div>}
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div className="flower-calendar-selected-day">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <h2>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} Bookings</h2>
                <button style={styles.addBookingBtn} onClick={() => openNewBookingForm(selectedDate)}>
                  <Check size={14} /> Add Booking
                </button>
              </div>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '13px', textAlign: 'center', padding: '18px 0' }}>No bookings scheduled.</p>
              ) : (
                getEventsForDate(selectedDate).map(b => renderBookingCard(b))
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSamples = () => {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={styles.sectionTitle}>Available Flower Samples</h2>
        </div>
        {arrangements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9389' }}>
            <Flower2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#574F47', marginBottom: '6px' }}>No samples uploaded</h3>
            <p style={{ fontSize: '14px' }}>Click "Create Arrangement" to upload your first sample.</p>
          </div>
        ) : (
          <div className="fb-samples-grid">
            {arrangements.map(arrangement => (
              <div key={arrangement.arrangement_id} className="fb-sample-card">
                <div
                  className="fb-sample-media"
                  style={{ background: '#1C1A17' }}
                >
                  {arrangement.images?.length > 0 ? (
                    <img
                      src={arrangement.images[0]?.url || arrangement.images[0]}
                      alt={arrangement.title}
                      // NOT lazy: the samples grid IS the gallery clients browse
                      // to choose an arrangement, so a lazy thumbnail shows as a
                      // blank box exactly when someone is deciding. These are
                      // already-optimised originals served from /uploads.
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div style={styles.productMediaPlaceholder}>
                      {arrangement.title?.charAt(0) || 'F'}
                    </div>
                  )}
                  {/* Multi-photo indicator — staff need to know a sample has
                      more angles without opening it. */}
                  {(arrangement.images?.length || 0) > 1 && (
                    <span className="fb-sample-count">
                      +{(arrangement.images.length - 1)} more
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fb-sample-title">
                    {arrangement.title}
                  </div>
                  <div className="fb-sample-sub">
                    {asList(arrangement.types).join(', ') || 'Custom'}
                  </div>
                </div>
                {/* No "Book This" here — clients book the samples themselves
                    from the public gallery; staff only manage them. */}
                <button
                  onClick={() => deleteArrangement(arrangement)}
                  disabled={deletingId === String(arrangement.arrangement_id)}
                  title="Delete this sample"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    background: deletingId === String(arrangement.arrangement_id) ? '#9C9389' : '#B91C1C',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: deletingId === String(arrangement.arrangement_id) ? 'wait' : 'pointer'
                  }}
                >
                  {deletingId === String(arrangement.arrangement_id) ? 'Deleting…' : 'Delete Sample'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNewBooking = () => {
    // Shared styling tokens — mirror the Create Arrangement panel exactly
    const lbl = { display: 'block', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9C9389', marginBottom: '8px' };
    const inp = { width: '100%', padding: '12px 14px', border: '1px solid #EAE7E2', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#FAF9F7', color: '#1C1A17', outline: 'none' };
    const suggestionChip = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '999px',
      border: '1px solid #EAE7E2',
      background: '#F7F4EF',
      color: '#574F47',
      fontSize: '11px',
      fontWeight: 600,
      padding: '6px 10px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    };
    const addSuggestion = (field, value) => {
      const candidate = String(value || '').trim();
      if (!candidate) return;
      setNewBooking(prev => {
        const existing = splitCommaList(prev[field]);
        const merged = [...new Set([...existing, ...splitCommaList(candidate)])];
        return { ...prev, [field]: merged.join(', ') };
      });
    };
    const arrangementSuggestions = ['Full set', 'Stems', 'Round wreath', 'Heart spray', 'Casket spray', 'Coffin wrap', 'Herse', 'Car number plate'];
    const flowerSuggestions = ['Mums', 'Red roses', 'White lilies', 'Chrysanthemums', 'Gypsophila', 'Greenery'];

    return (
      <div style={styles.formContainer}>
        {/* Header — same pattern as Create Arrangement */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #EAE7E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: '#1C1A17', margin: 0 }}>
            {editingBookingId ? 'Edit Flower Booking' : 'Place Flower Order'}
          </h2>
          <button
            type="button"
            onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', color: '#9C9389', fontSize: '28px', cursor: 'pointer', padding: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <form onSubmit={submitBooking} style={{ padding: '24px 28px 40px' }}>
          <label style={lbl} htmlFor="flower-arrangement-types">Arrangement / Requested Flower Item(s)</label>
          <textarea
            id="flower-arrangement-types"
            rows={2}
            style={{ ...inp, resize: 'vertical', marginBottom: '8px' }}
            placeholder="Record the request as given: full set, casket flowers only, 4 extra rings, portrait flowers, 100 stems"
            value={newBooking.arrangement_type}
            onChange={e => setNewBooking(prev => ({ ...prev, arrangement_type: e.target.value }))}
          />
          <p style={{ margin: '0 0 10px', color: '#6E675E', fontSize: '12px', lineHeight: 1.5 }}>
            A “full set” can differ by booking. Record its exact flowers and extras below; short flower-only orders are fine too.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {arrangementSuggestions.map(item => (
              <button
                key={item}
                type="button"
                style={suggestionChip}
                onClick={() => addSuggestion('arrangement_type', item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label style={lbl} htmlFor="flower-designs">Flower Design(s)</label>
          <textarea
            id="flower-designs"
            rows={2}
            style={{ ...inp, resize: 'vertical', marginBottom: '8px' }}
            placeholder="Optional — e.g. Casket spray, portrait flowers"
            value={newBooking.flower_designs}
            onChange={e => setNewBooking(prev => ({ ...prev, flower_designs: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-initials">Initials / Dedication</label>
          <input
            id="flower-initials"
            type="text"
            style={{ ...inp, marginBottom: '8px' }}
            placeholder="e.g. Mum, Shosho, Mum & Dad"
            value={newBooking.initials}
            onChange={e => setNewBooking(prev => ({ ...prev, initials: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-coffin-type">Coffin Type</label>
          <input
            id="flower-coffin-type"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. Standard, half couch, full couch"
            value={newBooking.coffin_type}
            onChange={e => setNewBooking(prev => ({ ...prev, coffin_type: e.target.value }))}
          />

          {/* ── Flowers ── */}
          <label style={lbl} htmlFor="flower-details">Flower Types, Colors & Package Details</label>
          <textarea
            id="flower-details"
            rows={3}
            style={{ ...inp, resize: 'vertical', marginBottom: '8px' }}
            placeholder="e.g. Full set mums, white with a touch of purple; all white; casket spray white and purple mums"
            value={newBooking.flower_details}
            onChange={e => setNewBooking(prev => ({ ...prev, flower_details: e.target.value }))}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {flowerSuggestions.map(item => (
              <button
                key={item}
                type="button"
                style={suggestionChip}
                onClick={() => addSuggestion('flower_details', item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label style={lbl} htmlFor="flower-service-type">Service Type</label>
          <input
            id="flower-service-type"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. Funeral service before final burial"
            value={newBooking.service_type}
            onChange={e => setNewBooking(prev => ({ ...prev, service_type: e.target.value }))}
          />

          <label style={{ ...lbl, marginBottom: '12px' }}>Funeral / Service Date <span style={{ color: '#A39A8E', fontWeight: 400, textTransform: 'none' }}>optional</span></label>
          <input
            type="date"
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.funeral_date}
            onChange={e => setNewBooking(prev => ({ ...prev, funeral_date: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setNewBooking(prev => ({ ...prev, funeral_date: fmtDateStr(addDays(new Date(), 1)) }))}
            style={{ display: 'block', marginTop: '-14px', marginBottom: '18px', padding: '6px 10px', border: '1px solid #c4b5fd', borderRadius: '999px', background: '#f5f3ff', color: '#6d28d9', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            Set funeral date to tomorrow
          </button>
          <label style={lbl} htmlFor="flower-service-time">Service / Dispatch Time</label>
          <input
            id="flower-service-time"
            type="time"
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.service_time}
            onChange={e => setNewBooking(prev => ({ ...prev, service_time: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-route">Route / Service Location</label>
          <input
            id="flower-route"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. Montezuma to Mbumbuni"
            value={newBooking.route}
            onChange={e => setNewBooking(prev => ({ ...prev, route: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-vehicle-plate">Hearse / Vehicle Number Plate</label>
          <input
            id="flower-vehicle-plate"
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. KCV 095H"
            value={newBooking.vehicle_plate}
            onChange={e => setNewBooking(prev => ({ ...prev, vehicle_plate: e.target.value }))}
          />
          <label style={lbl}>Color Preference</label>
          <label className="flx-any-color">
            <input
              type="checkbox"
              checked={newBooking.any_color}
              onChange={e => setNewBooking(prev => ({ ...prev, any_color: e.target.checked }))}
            />
            Any color · florist's choice
          </label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="e.g. Deep Red, White"
            disabled={newBooking.any_color}
            value={newBooking.color_preference}
            onChange={e => setNewBooking(prev => ({ ...prev, color_preference: e.target.value }))}
          />

          <label style={lbl}>Ribbon / Banner Wording</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder='e.g. "Rest in Peace"'
            value={newBooking.ribbon_message}
            onChange={e => setNewBooking(prev => ({ ...prev, ribbon_message: e.target.value }))}
          />

          <label style={lbl}>Size</label>
          <select
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.size}
            onChange={e => setNewBooking(prev => ({ ...prev, size: e.target.value }))}
          >
            <option value="">Select size</option>
            {['Small', 'Medium', 'Large'].map(size => <option key={size} value={size}>{size}</option>)}
          </select>

          <label style={lbl}>Quantity</label>
          <input
            type="number"
            min="1"
            max="99"
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.quantity}
            onChange={e => setNewBooking(prev => ({ ...prev, quantity: e.target.value }))}
          />

          {/* ── Special instructions ── */}
          <label style={lbl}>Special Remarks</label>
          <textarea
            rows={3}
            style={{ ...inp, resize: 'vertical', marginBottom: '22px' }}
            placeholder="Extra stems, hearse details, car plate, or other instructions"
            value={newBooking.remarks}
            onChange={e => setNewBooking(prev => ({ ...prev, remarks: e.target.value }))}
          />

          <label style={lbl}>Sample Flower Upload</label>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ ...inp, marginBottom: '22px', padding: '10px 12px' }}
            onChange={e => {
              const files = Array.from(e.target.files || []);
              setNewBooking(prev => ({ ...prev, sample_uploads: files }));
            }}
          />
          {/* ── 4 · Booking Details ── */}
          <label style={lbl}>Deceased Name *</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '16px' }}
            placeholder="Name of the deceased"
            value={newBooking.deceased_name}
            onChange={e => setNewBooking(prev => ({ ...prev, deceased_name: e.target.value }))}
            required
          />

          {/* "Ready At Time" removed at the user's request — it was a required
              field that added nothing: the order is filed under the day it was
              booked, and the ready-at hour was never shown back on the card or
              the detail panel. `newBooking.time` keeps its existing default so the
              POST body and the [WHEN:…] stamp are unchanged. */}

          {/* Kin phone — saved as `customer_phone` and shown in the booking
              side panel so the florist can call the person who booked. */}
          <label style={lbl}>Phone Number</label>
          <input
            type="tel"
            inputMode="tel"
            placeholder="e.g. 0712 345 678"
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.phone}
            onChange={e => setNewBooking(prev => ({ ...prev, phone: e.target.value }))}
          />
          <label style={lbl} htmlFor="flower-contact-name">Family / T-Cord Contact Name</label>
          <input
            id="flower-contact-name"
            type="text"
            placeholder="e.g. Felistus"
            style={{ ...inp, marginBottom: '22px' }}
            value={newBooking.contact_name}
            onChange={e => setNewBooking(prev => ({ ...prev, contact_name: e.target.value }))}
          />

          {/* ── 5 · Priority Level ── */}
          <label style={lbl}>Priority Level</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="Type it — e.g. Normal, Urgent, needed by 10am"
            value={newBooking.priority}
            onChange={e => setNewBooking(prev => ({ ...prev, priority: e.target.value }))}
          />

          {/* Footer actions — mirrors Create Arrangement */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', marginTop: '24px', borderTop: '1px solid #EAE7E2' }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#574F47',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '1px solid #EAE7E2',
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={placingOrder}
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                background: '#475A43',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: placingOrder ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: placingOrder ? 0.65 : 1
              }}
            >
              <Check size={14} />
              {placingOrder
                ? (editingBookingId ? 'Saving Changes…' : 'Placing Order…')
                : (editingBookingId ? 'Save Changes' : 'Place Order')}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderDetail = () => {
    const b = bookings.find(x => String(x.id || x.booking_id) === String(activeBookingId));
    if (!b) {
      return (
        <aside className="flower-detail-panel flower-detail-empty" aria-label="Booking details">
          <div className="flower-detail-empty-mark"><Flower2 size={28} /></div>
          <h2>Select a booking</h2>
          <p>Booking details will appear here.</p>
        </aside>
      );
    }
    const lineItems = parseLineItems(b);
    // Exact match only — a custom-typed type must NEVER borrow another
    // arrangement's name/photos. The booking's own fields are the truth.
    const matchedSample = arrangements.find(a =>
      String(a.arrangement_id || a.id) === String(lineItems[0]?.arrangement_id || b.arrangement_id || '')
      || a.title === b.flower_type
    );
    const productName = b.flower_type || b.arrangement_name || matchedSample?.title || 'Custom Arrangement';
    const product = matchedSample || { title: productName, images: [], types: [], colors: [], sizes: [] };
    const bookingImages = lineItems.flatMap(item => {
      const sample = arrangements.find(a =>
        String(a.arrangement_id || a.id) === String(item.arrangement_id || '') || a.title === item.name
      );
      return (Array.isArray(sample?.images) ? sample.images : []).map(image => ({
        src: image?.url || image,
        alt: item.name,
      }));
    }).filter(image => typeof image.src === 'string' && image.src.trim());
    const uniqueBookingImages = [...new Map(bookingImages.map(image => [image.src, image])).values()];
    // Strip machine tokens before splitting human notes.
    const humanNotes = String(b.notes || '').replace(/\[(?:TYPES|WHEN|DESIGN|INITIALS|COFFIN|ROUTE|VEHICLE|CONTACT|SERVICE-TIME|EDITED|PRIORITY):[^\]]*\]/gi, '');
    const noteParts = humanNotes.split('|').map(s => s.trim()).filter(Boolean);
    let sizeNote = '';
    const remarksList = [];
    noteParts.forEach(p => {
      const sm = /^size\s*:\s*(.+)$/i.exec(p);
      if (sm) { sizeNote = sm[1].trim(); return; }
      if (/^ribbon\s*:/i.test(p)) return;   // legacy rows only
      if (/^priority\s*:/i.test(p)) return;
      remarksList.push(p);
    });
    const ribbonNote = (noteParts.find(p => /^ribbon\s*:/i.test(p)) || '').replace(/^ribbon\s*:\s*/i, '');
    const requestedColors = [...asList(b.primary_color), ...asList(b.accent_color), ...asList(b.ribbon_color)];
    const colorValues = [...new Set(requestedColors.length
      ? requestedColors
      : [...asList(product.colors), ...lineItems.flatMap(item => item.colors || [])])];
    const colourText = [...new Set(colorValues)].join(', ') || "Any color · florist's choice";
    const ribbonMessage = b.ribbon_message || ribbonNote || '—';
    const flowerText = b.flower_description || [...new Set(lineItems.flatMap(item => item.types || []))].join(', ') || asList(product.types).join(', ') || 'Florist’s choice';
    // Machine tags keep design and dedication details readable on every backend version.
    const designMatch = /\[DESIGN:([^\]]+)\]/i.exec(String(b.notes || ''));
    const designText = designMatch ? designMatch[1].trim() : '';
    const initialsMatch = /\[INITIALS:([^\]]+)\]/i.exec(String(b.notes || ''));
    const initialsText = initialsMatch ? initialsMatch[1].trim() : '';
    const coffinMatch = /\[COFFIN:([^\]]+)\]/i.exec(String(b.notes || ''));
    const coffinType = coffinMatch ? coffinMatch[1].trim() : '';
    const routeText = getBookingNoteTag(b, 'ROUTE');
    const vehiclePlate = getBookingNoteTag(b, 'VEHICLE');
    const contactName = getBookingNoteTag(b, 'CONTACT');
    const serviceTime = getBookingNoteTag(b, 'SERVICE-TIME');
    const priority = String(getBookingNoteTag(b, 'PRIORITY') || b.priority || 'Normal');
    const edited = wasBookingEdited(b);
    const instructionText = b.special_instructions || remarksList.join('\n');
    const currentStatusIdx = STATUS_FLOW.indexOf(normStatus(b.status));
    // WHO booked this — the kin's name + phone. `booked_by` is sent by the UIs,
    // the server stores it as `customer` (and the phone as `customer_phone`).
    const bookerName = String(b.booked_by || b.customer || b.customer_name || '').trim();
    const bookerPhone = String(b.customer_phone || b.phone || '').trim();
    const bookerInitial = (bookerName || '?').trim().charAt(0).toUpperCase();

    let actionBtnHtml = '';
    if (normStatus(b.status) === 'cancelled') {
      actionBtnHtml = (
        <button style={styles.actionBtnOutline} disabled>
          <X size={18} style={{ color: '#ef4444' }} />
          Order Cancelled
        </button>
      );
    } else if (currentStatusIdx < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentStatusIdx + 1];
      actionBtnHtml = (
        <button style={styles.actionBtn} onClick={() => updateStatus(b.id, nextStatus)}>
          {nextStatus === 'completed' ? <Home size={18} /> : <Check size={18} />}
          Mark as {STATUS_LABELS[nextStatus]}
        </button>
      );
    } else {
      actionBtnHtml = (
        <button style={styles.actionBtnOutline} disabled>
          <Check size={18} style={{ color: '#10B981' }} />
          Delivery Completed
        </button>
      );
    }

    return (
      <>
        <div className="flower-detail-backdrop" onClick={backToList} />
        <aside className="flower-detail-panel open" aria-label="Flower booking details">
          {/* Sticky header — Back + Close always visible */}
          <div className="flower-detail-panel-head">
            <button className="flower-detail-back" onClick={backToList}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back to bookings
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={styles.detailCrumb}>{shortBookingCode(b)}</span>
              <button onClick={backToList} aria-label="Close details" style={{ background: 'none', border: 'none', color: '#9C9389', fontSize: '26px', lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
            </div>
          </div>
          {uniqueBookingImages.length > 0 && (
            <div className="flower-detail-hero">
              <div className="flower-image-carousel" ref={imageCarouselRef} aria-label="Arrangement photos">
                {uniqueBookingImages.map((img, idx) => (
                  <div key={idx} className="flower-image-slide">
                    <img src={img.src} alt={img.alt} />
                  </div>
                ))}
              </div>
              {uniqueBookingImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="flower-carousel-arrow previous"
                    aria-label="Previous arrangement photo"
                    onClick={() => imageCarouselRef.current?.scrollBy({ left: -imageCarouselRef.current.clientWidth, behavior: 'smooth' })}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="flower-carousel-arrow next"
                    aria-label="Next arrangement photo"
                    onClick={() => imageCarouselRef.current?.scrollBy({ left: imageCarouselRef.current.clientWidth, behavior: 'smooth' })}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>
          )}
          <div style={styles.detailBody}>
            <div style={styles.chipRow}>
              <div style={styles.chipPrimary}>{shortBookingCode(b)}</div>
              <span style={{ ...styles.priorityPill, fontSize: '12px', padding: '6px 12px' }}>{priority} Priority</span>
              {edited && <span className="flower-edited-chip">Updated</span>}
            </div>

            <h2 className="flower-detail-title" style={styles.detailTitle}>{product.title}{lineItems.length > 1 ? ` +${lineItems.length - 1} more` : ''}</h2>
            <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#8A8178' }}>
              {asList(product.types).join(' · ') || 'Custom Arrangement'}
            </p>

            {/* ── Who booked this (kin) — name + phone, front and centre ── */}
            <div
              className="flower-booking-contact"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, #FDF1F6 0%, #FFFFFF 70%)',
                border: '1px solid #F6C6DA',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '20px'
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#FCE0EC',
                  color: '#BE185D',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {bookerInitial}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9389' }}>
                  Booked By
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1A17', wordBreak: 'break-word' }}>
                  {bookerName || '—'}
                </div>
              </div>
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9389', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <Phone size={11} /> Phone
                </div>
                {bookerPhone ? (
                  <a
                    href={`tel:${bookerPhone.replace(/\s+/g, '')}`}
                    style={{ fontSize: '14px', fontWeight: 700, color: '#475A43', textDecoration: 'none', wordBreak: 'break-word' }}
                  >
                    {bookerPhone}
                  </a>
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#9C9389' }}>—</div>
                )}
              </div>
            </div>

            {/* Compact horizontal status tracker — replaces the tall vertical card */}
            <div style={styles.trackRow}>
              {STATUS_FLOW.map((status, idx) => {
                const done = idx < currentStatusIdx;
                const active = idx === currentStatusIdx;
                return (
                  <React.Fragment key={status}>
                    {idx > 0 && <div style={styles.trackArrow}>›</div>}
                    <div style={{
                      ...styles.trackStep,
                      background: active ? (status === 'completed' ? '#DCF5E5' : '#FCE0EC') : done ? '#EAF7EF' : '#FAF9F7',
                      color: active ? (status === 'completed' ? '#15803D' : '#BE185D') : done ? '#15803D' : '#B9B2A8',
                      borderColor: active ? (status === 'completed' ? '#BFEBD0' : '#F6C6DA') : done ? '#BFEBD0' : '#EAE7E2',
                    }}>
                      {done ? <Check size={11} strokeWidth={3} /> : <span style={styles.trackNum}>{idx + 1}</span>}
                      {STATUS_LABELS[status]}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Selected arrangements ── */}
            <div style={{ background: '#fff', border: '1px solid #EAE7E2', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9C9389', marginBottom: '10px' }}>
                Arrangements in this Order · {Number(b.quantity) || lineItems.reduce((total, item) => total + item.quantity, 0)} total
              </div>
              {lineItems.map((li, i) => {
                const s = arrangements.find(a => String(a.arrangement_id || a.id) === String(li.arrangement_id) || a.title === li.name);
                const sampleFlowers = [...new Set([...(li.types || []), ...asList(s?.types)])].join(', ');
                const sampleColors = [...new Set([...(li.colors || []), ...asList(s?.colors)])].join(', ');
                return (
                  <div
                    key={`${li.name}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0',
                      borderBottom: i < lineItems.length - 1 ? '1px solid #F3F1EC' : 'none'
                    }}
                  >
                    {s?.images?.length > 0 && (
                      <div className="flower-detail-sample-thumb">
                        <img src={s.images[0]?.url || s.images[0]} alt={li.name} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1A17' }}>{li.name} <span className="flower-quantity-chip">×{li.quantity}</span></div>
                      <div style={{ fontSize: '11px', color: '#9C9389' }}>
                        {[sampleFlowers, sampleColors, asList(s?.sizes)[0] ? `${asList(s?.sizes)[0]} size` : ''].filter(Boolean).join(' · ') || 'Custom arrangement'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Order facts, one clean list ────────────────────────────────────
                Used to be a grid of ten boxed tiles (icon box + card each), far
                too much chrome for a handful of facts. Now a single bordered
                section with small muted labels over the values. */}
            <section className="flower-spec" style={styles.specSection} aria-label="Order details">
              <div style={styles.specTitle}>Order details</div>
              <dl style={styles.specList}>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Color Preference</dt>
                  <dd style={styles.specValue}>{colourText || '—'}</dd>
                </div>
                {ribbonMessage && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Ribbon / Banner Wording</dt>
                    <dd style={styles.specValue}>{ribbonMessage}</dd>
                  </div>
                )}
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Flowers</dt>
                  <dd style={styles.specValue}>{flowerText || '—'}</dd>
                </div>
                {designText && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Flower Design</dt>
                    <dd style={styles.specValue}>{designText}</dd>
                  </div>
                )}
                {initialsText && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Initials / Dedication</dt>
                    <dd style={styles.specValue}>{initialsText}</dd>
                  </div>
                )}
                {coffinType && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Coffin Type</dt>
                    <dd style={styles.specValue}>{coffinType}</dd>
                  </div>
                )}
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Flower Size</dt>
                  <dd style={styles.specValue}>{b.size || asList(product.sizes).join(', ') || sizeNote || '—'}</dd>
                </div>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Deceased Name</dt>
                  <dd style={styles.specValue}>{b.deceased_name || '—'}</dd>
                </div>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Funeral / Service Date</dt>
                  <dd style={styles.specValue}>{b.funeral_date ? fmtDateOnly(b.funeral_date) : 'Not specified'}</dd>
                </div>
                {b.service_type && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Service Type</dt>
                    <dd style={styles.specValue}>{b.service_type}</dd>
                  </div>
                )}
                {serviceTime && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Service / Dispatch Time</dt>
                    <dd style={styles.specValue}>{serviceTime}</dd>
                  </div>
                )}
                {routeText && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Route / Service Location</dt>
                    <dd style={styles.specValue}>{routeText}</dd>
                  </div>
                )}
                {vehiclePlate && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Hearse / Vehicle Plate</dt>
                    <dd style={styles.specValue}>{vehiclePlate}</dd>
                  </div>
                )}
                {contactName && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Family / T-Cord Contact</dt>
                    <dd style={styles.specValue}>{contactName}{bookerPhone ? ` · ${bookerPhone}` : ''}</dd>
                  </div>
                )}
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Total Quantity</dt>
                  <dd style={styles.specValue}>{Number(b.quantity) || lineItems.reduce((total, item) => total + item.quantity, 0)}</dd>
                </div>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Booked By</dt>
                  <dd style={styles.specValue}>{bookerName || '—'}</dd>
                </div>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Phone Number</dt>
                  <dd style={styles.specValue}>
                    {bookerPhone ? (
                      <a
                        href={`tel:${bookerPhone.replace(/\s+/g, '')}`}
                        style={{ color: '#475A43', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {bookerPhone}
                      </a>
                    ) : '—'}
                  </dd>
                </div>
                <div style={styles.specRow}>
                  <dt style={styles.specLabel}>Branch</dt>
                  <dd style={styles.specValue}>
                    {(b.branch || b.funeral_home)
                      ? resolveBranchName(b.branch || b.funeral_home)
                      : '—'}
                  </dd>
                </div>
                {instructionText && (
                  <div style={styles.specRow}>
                    <dt style={styles.specLabel}>Special Remarks</dt>
                    <dd style={{ ...styles.specValue, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                      {instructionText}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <div style={styles.detailActions}>
              <button
                type="button"
                className="flower-edit-booking-button"
                onClick={() => openEditBooking(b)}
              >
                Edit booking
              </button>
              {actionBtnHtml}
            </div>
          </div>
        </aside>
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#FFFFFF' }}>
        <div style={{ color: '#2F4F3E', fontSize: '14px', fontWeight: 500 }}>Loading flower bookings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {renderToolbar()}
      {(view === 'list' || view === 'calendar') && renderFlowerUrgency()}

      {view === 'list' && (
        <div className={`flower-bookings-layout${activeBookingId ? ' has-selection' : ''}`}>
          <main className="flower-bookings-main">
            {/* Phones: horizontal date strip · Desktop: mini calendar rail */}
            {renderDateStrip()}
            <div className="flx-split" style={styles.splitWrap}>
              <aside className="flx-rail flx-minical" style={styles.railInner}>
                {renderMiniCalendar()}
              </aside>
              <div style={{ minWidth: 0 }}>
                {renderList()}
              </div>
            </div>
          </main>
          {renderDetail()}
        </div>
      )}
      {view === 'calendar' && (
        <div className="flx-content flower-calendar-page" style={styles.content}>
          {renderCalendar()}
        </div>
      )}
      {view === 'samples' && (
        <div className="flx-content" style={styles.content}>
          {renderSamples()}
        </div>
      )}
      {view === 'new' && (
        <>
          <div style={styles.panelScrim} onClick={() => setView('list')} />
          {renderNewBooking()}
        </>
      )}

      <div style={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} style={styles.toast}>
            <Check size={18} style={{ color: '#10B981' }} />
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floristPanelIn { from { transform: translateX(48px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes floristFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes floristSpin { to { transform: rotate(360deg); } }

        .flower-list-tools { margin: 10px 0 20px; }
        .flower-place-booking { background: linear-gradient(135deg, #EC5E93, #D6336C) !important; box-shadow: 0 5px 14px rgba(214,51,108,.2); }
        .flower-place-booking:hover { background: linear-gradient(135deg, #E04B85, #C42A61) !important; }
        .flower-bookings-layout { display: grid; grid-template-columns: minmax(0, 1fr) 650px; min-height: 100vh; background: #fff; }
        .flower-bookings-main { min-width: 0; padding: 0 18px 18px; }
        .flower-bookings-layout .flx-split { grid-template-columns: minmax(0, 1fr) !important; }
        .flower-bookings-layout .flx-rail { display: none !important; }
        .flower-detail-panel { position: sticky; top: 0; height: 100vh; min-width: 0; overflow-y: auto; border-left: 1px solid #F0E4EA; background: #fff; padding: 0 14px 16px; }
        .flower-detail-panel-head { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 -24px 18px; padding: 10px 10px; border-bottom: 1px solid #C42A61; background: rgba(255,255,255,.96); backdrop-filter: blur(12px); }
        .flower-detail-back { display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid #C42A61; border-radius: 8px; background: #C42A61; color: #fff; font-size: 12px; font-weight: 700; }
        .flower-detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #A39A8E; }
        .flower-detail-empty-mark { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 14px; border-radius: 50%; background: #FCE0EC; color: #D6336C; }
        .flower-detail-empty h2 { margin: 0 0 5px; color: #1F1D1A; font: 600 19px 'Playfair Display', Georgia, serif; }
        .flower-detail-empty p { margin: 0; font-size: 13px; }
        .flower-detail-backdrop { display: none; }
        .flower-detail-hero { position: relative; height: 230px; margin: 0 -24px 22px; overflow: hidden; background: #fff; }
        .flower-image-carousel { display: flex; width: 100%; height: 100%; gap: 8px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; touch-action: pan-x pan-y; }
        .flower-image-carousel::-webkit-scrollbar { display: none; }
        .flower-image-slide { flex: 0 0 100%; width: 100%; height: 100%; scroll-snap-align: start; }
        .flower-image-slide img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .flower-carousel-arrow { position: absolute; top: 50%; z-index: 2; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; transform: translateY(-50%); border: 1px solid #D6336C; border-radius: 50%; background: rgba(31,29,26,.58); color: #fff; }
        .flower-carousel-arrow.previous { left: 10px; }
        .flower-carousel-arrow.next { right: 10px; }
        .flower-detail-sample-thumb { width: 44px; height: 44px; flex: 0 0 44px; overflow: hidden; border-radius: 8px; background: #FDF1F6; }
        .flower-detail-sample-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .flower-detail-title { font-size: 26px !important; line-height: 1.25; }
        .flower-detail-panel .trackRow { flex-wrap: wrap; }
        .flower-spec > dl > div:last-child { border-bottom: none !important; }
        @media (max-width: 640px) {
          .flower-spec { padding: 10px 10px !important; }
        }
        .flower-booking-avatar { display: grid; place-items: center; width: 52px; height: 52px; flex: 0 0 52px; border: 1px solid rgba(0,0,0,.05); border-radius: 12px; font: 600 22px 'Playfair Display', Georgia, serif; }
        .flower-booking-avatar.booked { background: linear-gradient(135deg, #F9CFE2, #FBE1EC); color: #C2255C; }
        .flower-booking-avatar.completed { background: linear-gradient(135deg, #C8EEDA, #DEF6E7); color: #2B9155; }
        .fb-card[data-status="booked"] { background: linear-gradient(135deg, #FDE9F1 0%, #FDF1F6 60%, #FEFAFC 100%) !important; border-color: #F6C6DA !important; }
        .fb-card[data-status="completed"] { background: linear-gradient(135deg, #E2F6EA 0%, #EDFAF1 60%, #FBFEFC 100%) !important; border-color: #BFEBD0 !important; }
        .fb-card.is-edited:not(.is-active) { border-color: #c4b5fd !important; box-shadow: inset 3px 0 0 #7c3aed, 0 3px 10px rgba(124,58,237,.08) !important; }
        .fb-card.is-edited.is-active { border-color: #7c3aed !important; box-shadow: 0 0 0 1px #7c3aed, 0 5px 14px rgba(124,58,237,.14) !important; }
        .fb-card.is-active { border-color: #D6336C !important; box-shadow: 0 0 0 1px #D6336C, 0 5px 14px rgba(214,51,108,.12); }
        @media (max-width: 1023px) {
          .flower-bookings-layout { display: block; min-height: 0; }
          .flower-bookings-main { padding: 0 12px 10px; }
          .flower-detail-empty { display: none; }
          .flower-detail-backdrop { position: fixed; inset: 0; z-index: 1000; display: block; background: rgba(20,18,15,.32); }
          .flower-detail-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 1001; width: min(420px, 92vw); height: 100dvh; border: 0; border-radius: 16px 0 0 16px; box-shadow: -12px 0 40px rgba(0,0,0,.12); transform: translateX(105%); transition: transform .3s cubic-bezier(.32,.72,.28,1); padding: 0 2px 24px; }
          .flower-detail-panel-head { margin: 0 -2px 12px; padding: 12px 8px; }
          .flower-detail-hero { margin: 0 -2px 16px; }
          .flower-detail-panel.open { transform: translateX(0); }
        }
        .flower-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid #F0E4EA; }
        .flower-list-heading h1 { margin: 0; color: #1F1D1A; font: 600 22px/1.3 'Playfair Display', Georgia, serif; }
        .flower-list-heading h1 small { color: #D6336C; font: 600 12px 'DM Sans', system-ui, sans-serif; }
        .flower-status-tabs { display: flex; align-items: center; gap: 4px; }
        .flower-status-tabs button { border: 0; border-bottom: 2px solid transparent; padding: 8px 12px; background: transparent; color: #6E675E; font-size: 13px; font-weight: 700; }
        .flower-status-tabs button.active { color: #D6336C; border-bottom-color: #D6336C; }
        .flower-booking-search { display: flex; align-items: center; gap: 9px; margin-top: 16px; padding: 10px 13px; border: 1px solid #F0E4EA; border-radius: 8px; background: #FDF7FA; color: #A39A8E; }
        .flower-booking-search:focus-within { border-color: #F0AECB; box-shadow: 0 0 0 3px rgba(214,51,108,.08); background: #fff; }
        .flower-booking-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #1F1D1A; font: 13px 'DM Sans', system-ui, sans-serif; }
        .fb-card[data-status="booked"]:hover { transform: translateY(-1px); border-color: #EFABCB !important; box-shadow: 0 5px 14px rgba(214,51,108,.1); }
        .fb-card[data-status="completed"]:hover { transform: translateY(-1px); border-color: #A3E1BB !important; box-shadow: 0 5px 14px rgba(16,185,129,.12); }
        .flower-quantity-chip { display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 999px; background: #FCE0EC; color: #BE185D; font: 700 11px 'DM Sans', system-ui, sans-serif; vertical-align: 2px; }
        .flower-edited-chip { display: inline-flex; margin-left: 8px; padding: 3px 8px; border: 1px solid #ddd6fe; border-radius: 999px; background: #f5f3ff; color: #6d28d9; font: 700 10px 'DM Sans', system-ui, sans-serif; vertical-align: 2px; }
        .flower-card-initials { width: fit-content; max-width: 100%; overflow: hidden; padding: 3px 8px; border: 1px solid #ddd6fe; border-radius: 6px; background: #f5f3ff; color: #6d28d9; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .flower-edit-booking-button { flex: 1; padding: 14px 12px; border: 1px solid #c4b5fd; border-radius: 10px; background: #f5f3ff; color: #6d28d9; font-size: 14px; font-weight: 700; cursor: pointer; }
        .flower-edit-booking-button:hover { border-color: #7c3aed; background: #ede9fe; }
        .fb-card[data-status="completed"] .flower-quantity-chip { background: #D8F4E4; color: #0E7A54; }
        .flower-funeral-date { display: inline-flex; margin-top: 4px; padding: 2px 8px; border: 1px solid #E7D9F6; border-radius: 999px; background: #F5EEFB; color: #7E3FA1; font-size: 10px; font-weight: 700; }
        .flower-booking-service-meta { overflow: hidden; color: #526071; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .flx-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        /* The sample-picker (flx-sample-*) styles were removed along with the
           picker section — the booking screen books DIRECT by Arrangement Type. */
        .flx-any-color { display: flex; align-items: center; gap: 8px; margin: -2px 0 10px; color: #6E675E; font-size: 12px; font-weight: 600; }
        .flx-any-color input { accent-color: #D6336C; }

        /* ── Small-phone guards: kill every horizontal overflow source ── */
        .flx-toolbar { row-gap: 8px; }
        @media (max-width: 720px) {
          .flx-toolbar { padding: 10px 12px !important; gap: 8px; }
          .flx-nav { width: 100%; justify-content: space-between; margin-right: 0 !important; }
          .flx-toggle { flex: 1 1 100%; }
          .flx-toggle button { flex: 1; padding-left: 4px !important; padding-right: 4px !important; }
          .flx-actions { width: 100%; }
          .flx-actions > button { flex: 1 1 auto; min-width: 0; padding-left: 6px !important; padding-right: 6px !important; font-size: 10px !important; }
          .flx-content { padding: 18px 12px !important; }
          .flx-card-right { align-items: flex-start !important; }
          .fb-booking-name { white-space: normal !important; }
          .fb-booking-meta { flex-direction: column !important; }

          /* Compact order cards on phones */
          .fb-card { padding: 10px !important; gap: 10px !important; border-radius: 14px !important; }
          .fb-card-thumb { width: 52px !important; height: 52px !important; border-radius: 12px !important; }
          .fb-card-name { font-size: 14px !important; }
          .fb-card-meta { font-size: 13px !important; gap: 1px !important; }
          .flx-card-right { gap: 5px !important; }
          .flower-list-heading { align-items: flex-start; }
          .flower-list-heading h1 { font-size: 20px; }
          .flower-status-tabs { width: 100%; }
          .flower-status-tabs button { flex: 1; padding-left: 6px; padding-right: 6px; }
          .flx-form-grid { grid-template-columns: 1fr; }
        }

        /* ── Split layout: sticky mini-calendar rail beside the list ── */
        .flx-split { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 22px; align-items: start; }
        .flx-rail { position: sticky; top: 74px; }
        .flx-strip { display: none; }
        @media (max-width: 1180px) {
          .flx-split { grid-template-columns: 250px minmax(0, 1fr); gap: 16px; }
        }
        @media (max-width: 1023px) {
          .flx-split { display: block; }
          .flx-rail { display: none !important; }
      
          .flx-strip {
            display: flex; gap: 4px;
            width: 100%; max-width: 100%; min-width: 0;
            box-sizing: border-box;
            overflow-x: auto; overflow-y: hidden;
            -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; touch-action: pan-x;
            padding: 2px 2px 14px; margin-bottom: 8px;
            scrollbar-width: none;
          }
          .flx-strip > button { flex: 0 0 42px; min-width: 42px; }
          .flx-strip::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Create Arrangement Side Panel */}
      {showCreateModal && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,26,23,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            animation: 'floristFadeIn .2s ease'
          }} onClick={() => { if (!creating) setShowCreateModal(false); }} />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(520px, 100vw)',
            background: '#fff',
            zIndex: 1001,
            overflowY: 'auto',
            boxShadow: '-24px 0 60px rgba(28,26,23,0.14)',
            animation: 'floristPanelIn .32s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #EAE7E2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#1C1A17',
                margin: 0
              }}>Create New Arrangement</h2>
              <button
                onClick={() => { if (!creating) setShowCreateModal(false); }}
                disabled={creating}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9C9389',
                  fontSize: '28px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  padding: 0,
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
            </div>

            <form onSubmit={handleCreateArrangement} style={{ padding: '28px' }}>
              {creating && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#F3F1EC',
                  border: '1px solid #EAE7E2',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#574F47',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', system-ui, sans-serif"
                }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #D8D2C8',
                    borderTopColor: '#475A43',
                    borderRadius: '50%',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: 'floristSpin 0.8s linear infinite'
                  }} />
                  Creating your arrangement at full quality — this can take a moment. Please keep this panel open…
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., White Rose Wreath"
                />
              </div>

              {/* Description / Colors / Sizes fields removed — not needed for the
                  direct arrangement flow (backend keeps them optional). */}

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Types (comma-separated)</label>
                <input
                  type="text"
                  name="types"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., Wreath, Spray, Bouquet"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Images (multiple)</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17'
                  }}
                />
                <p style={{ fontSize: '11px', color: '#B9B3AA', marginTop: '6px' }}>
                  You can select multiple images for this arrangement
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid #EAE7E2'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#574F47',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: '1px solid #EAE7E2',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.5 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '8px',
                    background: '#475A43',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.75 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {creating && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'floristSpin 0.8s linear infinite'
                      }}
                    />
                  )}
                  {creating ? 'Creating…' : 'Create Arrangement'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#1C1A17',
    position: 'relative',
    // Page-level guard: the date rail and the 7-col month grid are both wider
    // than a phone, so clip at the page instead of letting the document scroll
    // sideways. Mirrors listDeceased.jsx, which sets `body { overflow-x: hidden }`.
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  toolbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(16px)',
    padding: '10px 14px',
    borderBottom: '1px solid #EAE7E2',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    rowGap: '8px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginRight: 'auto',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#1C1A17',
    whiteSpace: 'nowrap',
  },
  arrowBtn: {
    width: '28px',
    height: '28px',
    borderRadius: 0,
    border: '1px solid #E3DFD8',
    background: '#fff',
    color: '#574F47',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .15s ease',
  },
  todayBtn: {
    padding: '7px 12px',
    borderRadius: 0,
    background: '#fff',
    border: '1px solid #E3DFD8',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#574F47',
    cursor: 'pointer',
  },
  viewToggle: {
    display: 'flex',
    background: '#fff',
    border: '1px solid #E3DFD8',
    borderRadius: 0,
    padding: 0,
    gap: 0,
  },
  viewBtn: (active) => ({
    padding: '8px 16px',
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: active ? '#fff' : '#9C9389',
    background: active ? '#2F4F3E' : 'transparent',
    border: 'none',
    cursor: 'pointer',
  }),
  placeBookingBtn: {
    background: '#2F4F3E',
    color: '#fff',
    padding: '9px 14px',
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  },
  content: {
    padding: '24px 16px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  feedDateHeader: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bookingCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    padding: '14px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '20px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all .3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  mediaThumb: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    flexShrink: 0,
    overflow: 'hidden',
    background: '#1C1A17',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumbPlaceholder: {
    color: '#B08D57',
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    fontWeight: 700,
  },
  bookingInfo: {
    flex: 1,
    minWidth: 0,
  },
  bookingName: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1C1A17',
    marginBottom: '6px',
    fontFamily: "'Playfair Display', serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bookingMeta: {
    fontSize: '15px',
    lineHeight: 1.45,
    color: '#8A8178',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  bookingRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  bookingPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 600,
    color: '#1C1A17',
  },
  pillsRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '99px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  priorityPill: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '99px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid transparent',
  },
  calHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  calTitle: {
    fontSize: '26px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
  },
  calNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  calArrow: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#574F47',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  calWeekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: '8px',
    marginBottom: '12px',
  },
  calWeekday: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  calDays: {
    display: 'grid',
    // minmax(0, 1fr) instead of 1fr: a bare `1fr` is really `minmax(auto, 1fr)`,
    // whose auto minimum refuses to shrink below the cell's min-content width —
    // that is what pushed the 7-column month grid past the viewport on tablets.
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: '8px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  calDay: {
    minHeight: '110px',
    minWidth: '0',
    borderRadius: '12px',
    padding: '8px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'all .2s ease',
  },
  calDayNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: '#1C1A17',
    marginBottom: '6px',
  },
  todayNum: {
    background: '#2F4F3E',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  calEvent: {
    fontSize: '10px',
    padding: '3px 6px',
    borderRadius: '6px',
    marginBottom: '3px',
    background: 'rgba(47,79,62,.1)',
    color: '#2F4F3E',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  selectedDayPanel: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #EAE7E2',
  },
  sectionTitle: {
    fontSize: '22px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addBookingBtn: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    background: '#2F4F3E',
    border: 'none',
    borderRadius: '99px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  formContainer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'min(560px, 100vw)',
    background: '#fff',
    zIndex: 1001,
    overflowY: 'auto',
    padding: '28px 28px 40px',
    boxShadow: '-24px 0 60px rgba(28,26,23,0.14)',
    animation: 'floristPanelIn .32s cubic-bezier(0.16,1,0.3,1)',
  },
  panelScrim: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,26,23,0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
    animation: 'floristFadeIn .2s ease',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '28px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    flex: 1,
    margin: 0,
  },
  formSection: {
    marginBottom: '28px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
  },
  productCard: {
    borderRadius: '20px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all .2s ease',
    position: 'relative',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  productCheck: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    background: '#2F4F3E',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMedia: {
    width: '100%',
    height: '140px',
    borderRadius: '14px',
    marginBottom: '8px',
    overflow: 'hidden',
    background: '#1C1A17',
  },
  productMediaPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#B08D57',
    fontFamily: "'Playfair Display', serif",
    fontSize: '32px',
  },
  productName: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Playfair Display', serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productPrice: {
    fontSize: '12px',
    color: '#9C9389',
    marginTop: '2px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    color: '#9C9389',
  },
  priorityGroup: {
    display: 'flex',
    gap: '8px',
  },
  priorityBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #EAE7E2',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all .2s ease',
  },
  summaryCard: {
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  summaryTotal: {
    fontSize: '15px',
    color: '#9C9389',
    fontWeight: 600,
  },
  summaryPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#1C1A17',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: '#2F4F3E',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(47,79,62,.15)',
  },
  detailContainer: {
    position: 'fixed',
    inset: 0,
    background: '#FFFFFF',
    zIndex: 1000,
    overflowY: 'auto',
  },
  detailHero: {
    position: 'relative',
    height: '360px',
    background: '#1C1A17',
    overflow: 'hidden',
  },
  carouselTrack: {
    width: '100%',
    height: '100%',
    display: 'flex',
    transition: 'transform 0.4s ease',
  },
  carouselSlide: {
    minWidth: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBack: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '44px',
    height: '44px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1C1A17',
    cursor: 'pointer',
    border: 'none',
    zIndex: 2,
  },
  detailBody: {
    padding: '32px 24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  chipRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#fff',
    color: '#574F47',
    border: '1px solid #EAE7E2',
  },
  chipPrimary: {
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#2F4F3E',
    color: '#fff',
    border: 'none',
  },
  detailTitle: {
    fontSize: '32px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    marginBottom: '8px',
    lineHeight: 1.2,
  },
  detailSubtitle: {
    fontSize: '16px',
    color: '#9C9389',
    marginBottom: '32px',
    fontStyle: 'italic',
  },
  trackingCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '20px',
    marginBottom: '24px',
    border: '1px solid #EAE7E2',
  },
  trackingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  trackingTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1C1A17',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  trackingStatus: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2F4F3E',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '28px',
  },
  timelineLine: {
    position: 'absolute',
    left: '7px',
    top: '8px',
    bottom: '8px',
    width: '2px',
    background: '#EAE7E2',
  },
  tlStep: {
    position: 'relative',
    paddingBottom: '28px',
  },
  tlDot: {
    position: 'absolute',
    left: '-28px',
    top: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tlStepContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  tlStepInfo: {
    flex: 1,
  },
  tlStepTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#574F47',
    marginBottom: '2px',
  },
  tlStepDesc: {
    fontSize: '13px',
    color: '#9C9389',
  },
  /* ── Order facts, one clean list (replaces the old detailGrid / detailItem
     tile grid). One bordered section; small muted labels sit over readable
     values with a hairline between rows. Last row has no divider. */
  specSection: {
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '16px',
    padding: '18px 20px',
    marginBottom: '24px',
  },
  specTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#9C9389',
    marginBottom: '6px',
  },
  specList: {
    margin: 0,
    padding: 0,
  },
  specRow: {
    padding: '12px 0',
    borderBottom: '1px solid #F1EFEB',
  },
  specLabel: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#9C9389',
    marginBottom: '3px',
  },
  specValue: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 600,
    color: '#1C1A17',
    lineHeight: 1.4,
  },
  detailActions: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '40px',
  },
  actionBtn: {
    flex: 1,
    background: '#2F4F3E',
    color: '#fff',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(47,79,62,.15)',
  },
  actionBtnOutline: {
    flex: 1,
    background: 'transparent',
    color: '#1C1A17',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    border: '1px solid #EAE7E2',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: 0.6,
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
    rowGap: '8px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    padding: '12px 14px',
    marginBottom: '24px',
  },
  trackStep: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 11px',
    borderRadius: '99px',
    border: '1px solid #EAE7E2',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  trackNum: {
    fontSize: '10px',
    fontWeight: 800,
  },
  trackArrow: {
    color: '#C9C2B8',
    fontWeight: 800,
    fontSize: '15px',
    lineHeight: 1,
  },
  detailTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  splitWrap: {
    width: '100%',
    boxSizing: 'border-box',
  },
  railInner: {
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    padding: '14px',
    position: 'sticky',
    top: '74px',
  },
  mcHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  mcTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#1C1A17',
  },
  mcNav: {
    display: 'flex',
    gap: '6px',
  },
  mcWkRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '4px',
  },
  mcWk: {
    textAlign: 'center',
    fontSize: '9px',
    fontWeight: 700,
    color: '#B9B2A8',
    textTransform: 'uppercase',
  },
  mcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  mcCell: {
    position: 'relative',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: '#574F47',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all .15s ease',
    padding: 0,
  },
  mcDot: {
    position: 'absolute',
    bottom: '5px',
    left: '50%',
    marginLeft: '-2px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#2F4F3E',
  },
  stripDay: {
    flex: '0 0 42px',
    minWidth: '42px',
    boxSizing: 'border-box',
    padding: '10px 4px 12px',
    borderRadius: 0,
    border: '1px solid #EAE7E2',
    background: '#fff',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: '#574F47',
    transition: 'all .15s ease',
    overflow: 'hidden',
  },
  backPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 16px',
    borderRadius: '99px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    color: '#574F47',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s ease',
  },
  detailCrumb: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: '#9C9389',
    letterSpacing: '0.05em',
  },
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
  },
  toast: {
    background: '#1C1A17',
    color: '#fff',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 500,
    fontSize: '14px',
    animation: 'slideUp .3s ease',
  },
};

export default FlowerBookingsNew;