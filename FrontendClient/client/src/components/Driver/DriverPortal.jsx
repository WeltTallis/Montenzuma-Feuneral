import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, LogOut, Calendar, Clock, AlertCircle, CheckCircle, MapPin, Route as RouteIcon, Loader2, Info, Plus, CreditCard, Fuel,
} from '../../utils/icons/icons';
import { useSocket } from '../../utils/context/socketContext';
import env from '../../utils/config/env';
import { fetchWithCredentials } from '../../api/axios';
import ApplyLeave from '../leave/ApplyLeave';

const API_BASE_URL = env.FULL_API_URL;

const getTenantSlug = () =>
    localStorage.getItem('tenantSlug') || sessionStorage.getItem('tenantSlug') || '';


const getUser = () => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : {}; }
    catch { return {}; }
};

// Resolve the TENANT-level id (never branch-scoped) — hearses & hearse
// bookings live in ONE shared operations DB and must be scoped by tenant id
// so all branches of a multi-branch tenant share one fleet & one booking list.
const resolveTenantId = () => {
    const direct = localStorage.getItem('tenantId');
    if (direct && direct !== 'undefined' && direct !== 'null') return direct;
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const fromUser = u.tenantId || u.tenant_id || u.tenant?.id || u.tenant?.tenantId;
        if (fromUser) return String(fromUser);
    } catch { /* ignore */ }
    // Last resort: read the tenant id straight from the auth token payload.
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
        const part = token.split('.')[1];
        if (part) {
            const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
            if (payload?.tenantId) return String(payload.tenantId);
        }
    } catch { /* ignore */ }
    return null;
};

const getAuthHeaders = () => {
    const slug = getTenantSlug();
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = { 'x-tenant-slug': slug };
    // ALWAYS send the tenant id — this is what scopes bookings to this tenant
    // across every branch in the shared operations database.
    const tenantId = resolveTenantId();
    if (tenantId) headers['x-tenant-id'] = tenantId;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;

};

function getNairobiNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
}

/* ─── date helpers ──────────────────────────────────────────────────────── */
const pad2 = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (n, from) => {
    const d = from ? new Date(from) : getNairobiNow();
    d.setDate(d.getDate() + n);
    return dayKey(d);
};

// 'YYYY-MM-DD' → { mo: 'Oct', dy: 5 } for the date cube
const fmtDay = (ds) => {
    const [y, m, d] = String(ds).split('-').map(Number);
    if (!y || !m || !d) return { mo: '--', dy: '--' };
    return {
        mo: new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short' }),
        dy: d,
    };
};

// 'YYYY-MM-DD' → 'Mon, Oct 5'
const fmtFull = (ds) =>
    new Date(`${ds}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const fmtDateShort = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

const genId = (id) => `BK-${String(id ?? '').padStart(4, '0')}`;

// Extract every scheduled day (YYYY-MM-DD) for a booking. booking_dates is a
// JSON array of day strings — normalize every legacy shape we may encounter.
function bookingDateKeys(b) {
    if (!b) return [];
    const raw = b.booking_dates || b.dates || b.booking_date || b.event_date || b.scheduled_date || b.pickup_date || b.date;
    if (Array.isArray(raw)) {
        return raw
            .map(x => (x && typeof x === 'object') ? (x.date || x.start_date || x.booking_date) : x)
            .filter(Boolean)
            .map(x => String(x).slice(0, 10));
    }
    if (typeof raw === 'string' && raw.trim()) {
        const t = raw.trim();
        if (t.startsWith('[')) {
            try {
                return JSON.parse(t)
                    .map(x => (x && typeof x === 'object') ? (x.date || x.start_date || x.booking_date) : x)
                    .filter(Boolean)
                    .map(x => String(x).slice(0, 10));
            } catch { return [t.slice(0, 10)]; }
        }
        return [t.slice(0, 10)];
    }
    return [];
}

const CLOSED_STATUSES = ['completed', 'cancelled', 'postponed'];

// Classify a booking for the driver trip feed:
//   'upcoming' → any scheduled day is inside the next-24h window (today/tomorrow)
//   'overdue'  → every scheduled day has passed but the trip is still open
//   null       → not relevant (too far out, or done / cancelled / postponed)
function tripKind(b, now) {
    const st = String(b.status || '').toLowerCase();
    if (CLOSED_STATUSES.includes(st)) return null;

    const keys = bookingDateKeys(b);
    if (!keys.length) return null;

    const today = dayKey(now);
    const tomorrow = addDays(1, now);

    let upcoming = false;
    let allPast = true;
    for (const k of keys) {
        if (k === today || k === tomorrow) upcoming = true;
        if (k >= today) allPast = false;
    }
    if (upcoming) return 'upcoming';
    return allPast ? 'overdue' : null;
}

// Sort handle: earliest scheduled day of the booking as a time ms.
function tripTimeMs(b) {
    const keys = bookingDateKeys(b).sort();
    return keys.length ? new Date(`${keys[0]}T00:00:00`).getTime() : Infinity;
}

// Earliest scheduled day of a booking ('YYYY-MM-DD').
const tripDay = (b) => {
    const keys = bookingDateKeys(b).sort();
    return keys[0] || null;
};

const normalizeDriverName = (name) => String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();

const isAssignedToDriver = (booking, driverId, driverName) => {
    const bookingDriverId = booking?.driver_id ?? booking?.assigned_driver_id ?? booking?.driverId;
    if (driverId && bookingDriverId != null && String(bookingDriverId) === String(driverId)) return true;
    const assignedName = normalizeDriverName(booking?.assigned_driver_name || booking?.driver_name);
    return !!assignedName && !!normalizeDriverName(driverName) && assignedName === normalizeDriverName(driverName);
};

// Departure time for the trip card — the first time-bearing column the row has.
function tripTimeLabel(b) {
    const raw = b.estimated_departure_time || b.start_time || b.from_timestamp || b.event_time;
    if (!raw) return '';
    // A date-only column would render as a misleading "12:00 AM".
    if (!/[T ]\d{1,2}:\d{2}/.test(String(raw))) return '';
    return fmtTime(raw);
}

/* ─── PICKUPS (workshop store dispatches) 
   A "pickup" is a coffin that left the workshop Store shelf and was assigned
   to this driver — see workshop-service storeController (getDriverPickups).
   Rows arrive as raw `store_transactions`; these helpers turn one into the
   shape the card renders. */
const PICK_STATUS = {
    pending: 'pending',
    accepted: 'accepted',
    declined: 'declined',
};

// Which accent the card wears, by what was pulled off the shelf.
const pickAccent = (p) => {
    if (String(p.item_type || '').toLowerCase() === 'material') return 'blue';
    return 'teal';
};

const pickKindTxt = (p) =>
    String(p.item_type || '').toLowerCase() === 'material' ? 'Material Pickup' : 'Coffin Pickup';

// The dispatch log packs the route and purpose into one free-text string.
// It is written by the workshop and never structured, so every field is
// optional and falls back to something readable.
function parseDispatchLog(notes) {
    const out = {};
    const src = String(notes || '');
    const m = src.match(/DISPATCH LOG:\s*(.*)/);
    const body = m ? m[1] : src;
    for (const part of body.split('|')) {
        const idx = part.indexOf(':');
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1).trim();
        if (key && val) out[key] = val;
    }
    return out;
}

// Store transactions → pickup card model.
function toPickup(row) {
    const log = parseDispatchLog(row.notes);
    const qty = Number(row.qty) || 0;
    const unit = row.unit || 'pcs';
    const item = row.item_name || row.item_key || 'Item';

    const day = row.txn_date ? String(row.txn_date).slice(0, 10) : null;
    const time = (log.time || '').trim();
    const when = day
        ? `${day === dayKey(getNairobiNow()) ? 'Today' : day === addDays(1) ? 'Tomorrow' : fmtFull(day)}${time ? ` · ${time}` : ''}`
        : (time || 'Date to be confirmed');

    return {
        id: `PR-${String(row.id)}`,
        rowId: row.id,
        kind: pickKindTxt(row),
        accent: pickAccent(row),
        task: `Collect ${qty} ${unit} of ${item} from the store${row.item_sub ? ` (${row.item_sub})` : ''}`,
        from: log.from && log.from !== 'N/A' ? log.from : 'Workshop Store',
        to: row.destination || log.destination || 'To be confirmed',
        by: row.txn_by || log['dispatched by'] || 'Workshop',
        when,
        contact: log['received by'] && log['received by'] !== 'None' ? log['received by'] : (row.driver_name || ''),
        note: [log.purpose, log.remarks].filter(Boolean).join(' — ') || '',
        status: PICK_STATUS[String(row.pickup_status || '').toLowerCase()] || 'pending',
    };
}

/*  DESIGN TOKENS */
const T = {
    bg: '#000000',
    card: '#000000',
    card2: '#101215',
    line: 'rgba(255,255,255,.08)',
    line2: 'rgba(255,255,255,.16)',
    text: '#ffffff',
    dim: '#e6e8ea',
    faint: '#e7e7e7',
    teal: '#134B5F',
    plum: '#5F0F40',
    blue: '#00296B',
    orange: '#E36414',
    tealB: '#4FA8C4',
    blueB: '#7FA6FF',
    orangeB: '#FF8A3D',
    plumB: '#D4699F',
    red: '#FF5C47',
    disp: "'Space Grotesk',sans-serif",
    mono: "'JetBrains Mono',monospace",
    ease: 'cubic-bezier(.22,1,.36,1)',
};

const STATUS = {
    booked: { label: 'Booked', pill: 'pill-blue' },
    in_transit: { label: 'In Transit', pill: 'pill-orange' },
    pending: { label: 'Pending', pill: 'pill-gray' },
    confirmed: { label: 'Confirmed', pill: 'pill-teal' },
    in_progress: { label: 'In Progress', pill: 'pill-orange' },
    dispatched: { label: 'Dispatched', pill: 'pill-teal' },
    on_hold: { label: 'On Hold', pill: 'pill-plum' },
    completed: { label: 'Completed', pill: 'pill-teal' },
    cancelled: { label: 'Cancelled', pill: 'pill-gray' },
    postponed: { label: 'Postponed', pill: 'pill-plum' },
};

const LEAVE = {
    approved: { cls: 'pill-teal', c: T.tealB },
    rejected: { cls: 'pill-orange', c: T.red },
    pending: { cls: 'pill-gray', c: T.orangeB },
};

/* Every rule is namespaced under #rp-driver. The portal renders outside the
   app Layout, but its <style> tag still lands in the document head  an
   unscoped `.card` or `.btn` would restyle every other route in the app. */
const css = `
#rp-driver{
  --bg:#000000; --card:#000000; --card2:#101215;
  --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.16);
  --text:#F5F7F8; --dim:#A0A8AF; --faint:#6E757C;
  --teal:#134B5F; --plum:#5F0F40; --blue:#00296B; --orange:#E36414;
  --teal-b:#4FA8C4; --blue-b:#7FA6FF; --orange-b:#FF8A3D; --plum-b:#D4699F; --red:#FF5C47;
  --disp:'Space Grotesk',sans-serif; --mono:'JetBrains Mono',monospace;
  --ease:cubic-bezier(.22,1,.36,1);
  min-height:100vh; background:var(--bg); color:var(--text);
  font:400 15px/1.5 'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
}
#rp-driver *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
#rp-driver button{ font:inherit; cursor:pointer; color:inherit; background:none; border:0; }
#rp-driver svg{ display:block; }
#rp-driver :focus-visible{ outline:2px solid var(--teal-b); outline-offset:2px; }

@keyframes rpUp{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
@keyframes rpSpin{ to{ transform:rotate(360deg); } }
#rp-driver .anim-up{ animation:rpUp .4s var(--ease) both; }
#rp-driver .anim-spin{ animation:rpSpin .8s linear infinite; }
#rp-driver .press{ transition:transform .12s ease; }
#rp-driver .press:active{ transform:scale(.98); }
@media (prefers-reduced-motion:reduce){
  #rp-driver .anim-up{ animation:none; }
  #rp-driver .anim-spin{ animation:none; }
  #rp-driver .press:active{ transform:none; }
}

/* ═══ nav — name + date ═══ */
#rp-driver .hdr{ position:sticky; top:0; z-index:50; background:rgba(0,0,0,.92);
  backdrop-filter:blur(10px); border-bottom:1px solid rgba(255,255,255,.06); }
#rp-driver .hdr-in{ max-width:640px; margin:0 auto; padding:12px 18px;
  display:flex; align-items:center; justify-content:space-between; }
#rp-driver .who b{ font:700 1.05rem var(--disp); letter-spacing:-.01em; display:block; line-height:1.15; }
#rp-driver .who small{ font:500 .72rem 'Inter'; color:var(--faint); letter-spacing:.02em; }
#rp-driver .hnav{ display:flex; gap:8px; align-items:center; }
#rp-driver .gbtn{ width:34px; height:34px; border-radius:8px; display:grid; place-items:center;
  color:var(--faint); transition:.15s; }
#rp-driver .gbtn:hover{ background:rgba(255,255,255,.07); color:var(--text); }
#rp-driver .exit-btn{ height:34px; padding:0 13px; border-radius:8px; display:flex; align-items:center; gap:6px;
  background:rgba(255,92,71,.1); border:1px solid rgba(255,92,71,.4); color:var(--red);
  font:600 .74rem 'Inter'; letter-spacing:.03em; transition:.15s; }
#rp-driver .exit-btn:hover{ background:rgba(255,92,71,.2); }

/* ═══ page ═══ */
#rp-driver main{ max-width:640px; margin:0 auto; padding:22px 18px 90px; }

/* notice */
#rp-driver .notice{ display:flex; align-items:center; gap:9px; margin-bottom:18px; padding:11px 13px;
  border:1px solid var(--line); border-radius:10px; font:500 .82rem 'Inter'; color:var(--dim); background:var(--card); }
#rp-driver .notice.hot{ border-color:rgba(255,138,61,.3); background:rgba(227,100,20,.06); color:var(--text); }
#rp-driver .notice .nd{ width:8px; height:8px; border-radius:50%; background:var(--orange-b); flex-shrink:0; }
#rp-driver .notice.hot .nd{ background:var(--red); }

/* ═══ stats — pure black cards ═══ */
#rp-driver .stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:22px; }
#rp-driver .stat{ background:var(--card); border:1px solid var(--line); border-radius:13px;
  padding:15px 8px; text-align:center; }
#rp-driver .stat .num{ font:700 1.7rem/1 var(--disp); font-variant-numeric:tabular-nums;
  letter-spacing:-.02em; display:flex; align-items:center; justify-content:center; gap:7px; }
#rp-driver .stat .num i{ width:7px; height:7px; border-radius:50%; flex:none; }
#rp-driver .stat .lbl{ font:600 .56rem 'Inter'; letter-spacing:.14em; text-transform:uppercase;
  color:var(--dim); margin-top:7px; }
#rp-driver .stat.c-orange .num{ color:var(--orange-b); }
#rp-driver .stat.c-orange .num i{ background:var(--orange-b); }
#rp-driver .stat.c-blue .num{ color:var(--blue-b); }
#rp-driver .stat.c-blue .num i{ background:var(--blue-b); }
#rp-driver .stat.c-red .num{ color:var(--red); }
#rp-driver .stat.c-red .num i{ background:var(--red); }

/* compact trip calendar */
#rp-driver .trip-calendar{ margin:0 0 18px; padding:13px; border:1px solid var(--line);
  border-radius:12px; background:var(--card); }
#rp-driver .trip-calendar-head{ display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; }
#rp-driver .trip-calendar-head strong{ font:600 .82rem var(--disp); }
#rp-driver .trip-calendar-head small{ color:var(--faint); font-size:.65rem; }
#rp-driver .trip-days{ display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; }
#rp-driver .trip-day{ min-width:0; min-height:66px; display:flex; flex-direction:column; align-items:center;
  flex:1 0 58px; justify-content:center; gap:3px; padding:7px 3px; border:1px solid var(--line); border-radius:9px;
  background:var(--card2); color:var(--dim); transition:background .15s,border-color .15s,color .15s; }
#rp-driver .trip-day:hover{ border-color:var(--line2); color:var(--text); }
#rp-driver .trip-day.on{ border-color:var(--teal-b); background:rgba(19,75,95,.38); color:var(--text); }
#rp-driver .trip-day.today .td-dow{ color:var(--orange-b); }
#rp-driver .trip-day .td-dow{ font:600 .55rem 'Inter'; color:var(--faint); text-transform:uppercase; }
#rp-driver .trip-day .td-date{ font:700 1rem var(--disp); }
#rp-driver .trip-day .td-count{ min-height:12px; color:var(--teal-b); font:600 .52rem 'Inter'; white-space:nowrap; }

/* ═══ tabs ═══ */
#rp-driver .tabs{ display:flex; gap:22px; overflow-x:auto; border-bottom:1px solid var(--line); margin-bottom:18px; }
#rp-driver .tabs button{ padding:9px 1px 11px; color:var(--faint); font:600 .88rem var(--disp);
  display:flex; align-items:center; gap:7px; border-bottom:2px solid transparent;
  margin-bottom:-1px; transition:.15s; flex:0 0 auto; white-space:nowrap; }
#rp-driver .tabs button:hover{ color:var(--dim); }
#rp-driver .tabs button.on{ color:var(--text); border-bottom-color:var(--teal-b); }
#rp-driver .tabs button.on.k-orange{ border-bottom-color:var(--orange-b); }
#rp-driver .tabs .n{ font:700 .62rem var(--mono); padding:2px 8px; border-radius:6px;
  background:rgba(255,255,255,.09); color:var(--dim); }
#rp-driver .tabs button.on .n{ background:rgba(79,168,196,.18); color:var(--teal-b); }
#rp-driver .tabs button.on.k-orange .n{ background:rgba(255,138,61,.16); color:var(--orange-b); }

/* fuel-card records */
#rp-driver .fuel-panel{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:17px; margin-bottom:12px; }
#rp-driver .fuel-panel h2{ font:700 1rem var(--disp); margin:0 0 5px; }
#rp-driver .fuel-muted{ color:var(--faint); font-size:.76rem; margin:0 0 15px; }
#rp-driver .fuel-cards{ display:grid; gap:10px; margin-bottom:16px; }
#rp-driver .fuel-vehicle{ display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px;
  border:1px solid var(--line); border-radius:10px; background:var(--card2); }
#rp-driver .fuel-vehicle strong{ display:block; font:600 .9rem var(--disp); }
#rp-driver .fuel-vehicle small{ display:block; color:var(--faint); margin-top:3px; }
#rp-driver .fuel-amount{ font:700 .95rem var(--mono); white-space:nowrap; }
#rp-driver .fuel-amount.low{ color:var(--orange-b); }
#rp-driver .fuel-form{ display:grid; gap:10px; }
#rp-driver .fuel-form label{ display:grid; gap:5px; color:var(--dim); font-size:.7rem; font-weight:600; }
#rp-driver .fuel-form input,#rp-driver .fuel-form select{ width:100%; min-height:42px; padding:0 11px;
  color:var(--text); background:var(--card2); border:1px solid var(--line2); border-radius:8px; font:inherit; }
#rp-driver .fuel-form button{ min-height:42px; display:flex; justify-content:center; align-items:center; gap:8px;
  border-radius:8px; background:var(--teal); color:#fff; font:600 .82rem 'Inter'; }
#rp-driver .fuel-form button:disabled{ opacity:.55; cursor:wait; }
#rp-driver .fuel-history{ border-top:1px solid var(--line); margin-top:16px; padding-top:13px; }
#rp-driver .fuel-history h3{ color:var(--dim); font:600 .7rem 'Inter'; text-transform:uppercase; letter-spacing:.1em; margin:0 0 6px; }
#rp-driver .fuel-transaction{ display:flex; justify-content:space-between; gap:10px; padding:8px 0;
  border-bottom:1px solid var(--line); color:var(--dim); font-size:.72rem; }
#rp-driver .fuel-transaction:last-child{ border-bottom:0; }
#rp-driver .fuel-transaction strong{ color:var(--text); white-space:nowrap; }

/* ═══ card ═══ */
#rp-driver .card{ background:var(--card); border:1px solid var(--line); border-radius:14px; margin-bottom:12px; }
#rp-driver .card.pickup-pending{ border-color:rgba(255,138,61,.55);
  box-shadow:0 0 0 1px rgba(255,138,61,.14), 0 0 20px rgba(255,138,61,.18); }
#rp-driver .card-bd{ padding:16px 17px; }
#rp-driver .c-top{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
#rp-driver .c-code{ font:700 .9rem var(--mono); letter-spacing:.02em; }
#rp-driver .c-chip{ display:inline-flex; align-items:center; gap:5px; margin-top:7px; padding:3px 9px;
  border-radius:6px; background:rgba(255,255,255,.07); border:1px solid var(--line);
  font:500 .62rem var(--mono); letter-spacing:.02em; color:var(--dim); }
#rp-driver .c-chip svg{ opacity:.7; }

#rp-driver .pill{ display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:7px;
  font:700 .62rem 'Inter'; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
#rp-driver .pill i{ width:6px; height:6px; border-radius:50%; flex:none; background:#fff; }
#rp-driver .pill-blue{ background:var(--blue); color:#D7E3FF; }
#rp-driver .pill-blue i{ background:var(--blue-b); }
#rp-driver .pill-orange{ background:var(--orange); color:#fff; }
#rp-driver .pill-orange i{ background:#fff; }
#rp-driver .pill-plum{ background:var(--plum); color:#F3D7E6; }
#rp-driver .pill-plum i{ background:var(--plum-b); }
#rp-driver .pill-teal{ background:var(--teal); color:#D9EEF5; }
#rp-driver .pill-teal i{ background:var(--teal-b); }
#rp-driver .pill-gray{ background:rgba(255,255,255,.12); color:var(--dim); }
#rp-driver .pill-gray i{ background:var(--faint); }
#rp-driver .tag-over{ display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:5px;
  background:rgba(255,92,71,.14); border:1px solid rgba(255,92,71,.35); color:var(--red);
  font:700 .56rem 'Inter'; letter-spacing:.06em; text-transform:uppercase; margin-top:6px; }

/* date strip */
#rp-driver .dstrip{ display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:10px;
  background:var(--card2); border:1px solid var(--line); margin-bottom:12px; }
#rp-driver .dstrip.hot{ background:rgba(227,100,20,.08); border-color:rgba(227,100,20,.3); }
#rp-driver .dstrip.cool{ background:rgba(0,41,107,.32); border-color:rgba(127,166,255,.28); }
#rp-driver .dcube{ width:38px; height:38px; border-radius:8px; background:rgba(255,255,255,.05);
  border:1px solid var(--line); display:flex; flex-direction:column; align-items:center;
  justify-content:center; flex-shrink:0; }
#rp-driver .dcube .mo{ font:700 .48rem 'Inter'; text-transform:uppercase; letter-spacing:.06em; color:var(--faint); }
#rp-driver .dcube .dy{ font:700 1rem/1.15 var(--disp); }
#rp-driver .dstrip.hot .dcube{ color:var(--orange-b); border-color:rgba(255,138,61,.32); }
#rp-driver .dstrip.cool .dcube{ color:var(--blue-b); border-color:rgba(127,166,255,.32); }
#rp-driver .d-main{ font:600 .92rem var(--disp); }
#rp-driver .d-main .tm{ color:var(--dim); font-weight:500; }
#rp-driver .d-sub{ font:500 .7rem 'Inter'; color:var(--faint); margin-top:1px; }
#rp-driver .d-tag{ margin-left:auto; padding:4px 9px; border-radius:5px; font:700 .54rem 'Inter';
  letter-spacing:.08em; text-transform:uppercase; flex-shrink:0; }
#rp-driver .d-tag.due{ background:var(--orange); color:#fff; }
#rp-driver .d-tag.soon{ background:var(--blue); color:#D7E3FF; }
#rp-driver .d-tag.past{ background:rgba(255,255,255,.1); color:var(--faint); }

/* labeled rows */
#rp-driver .kv{ border:1px solid var(--line); border-radius:10px; overflow:hidden; margin-bottom:12px; background:var(--card2); }
#rp-driver .kv-row{ display:flex; gap:12px; padding:10px 13px; border-bottom:1px solid var(--line); align-items:baseline; }
#rp-driver .kv-row:last-child{ border-bottom:0; }
#rp-driver .kv-row .k{ font:600 .55rem 'Inter'; letter-spacing:.12em; text-transform:uppercase;
  color:var(--faint); width:84px; flex-shrink:0; }
#rp-driver .kv-row .v{ font:500 .92rem 'Inter'; color:var(--text); min-width:0; overflow-wrap:anywhere; }
#rp-driver .kv-row .v.big{ font:600 1rem var(--disp); }
#rp-driver .kv-row .v.mono{ font:600 .8rem var(--mono); letter-spacing:.02em; }
#rp-driver .kv-row .v.o{ color:var(--orange-b); }
#rp-driver .kv-row .v.t{ color:var(--teal-b); }
#rp-driver .kv-row .v.it{ font-style:italic; color:var(--dim); }

/* route */
#rp-driver .route{ border:1px solid var(--line); border-radius:10px; padding:12px 14px;
  margin-bottom:12px; background:var(--card2); }
#rp-driver .rt-line{ display:flex; gap:12px; }
#rp-driver .rt-rail{ display:flex; flex-direction:column; align-items:center; padding-top:4px; }
#rp-driver .rt-dot{ width:11px; height:11px; border-radius:50%; border:2.5px solid; flex-shrink:0; background:#000; }
#rp-driver .rt-dot.a{ border-color:var(--orange-b); }
#rp-driver .rt-dot.b{ border-color:var(--teal-b); }
#rp-driver .rt-rail .bar{ width:0; flex:1; min-height:30px; margin:4px 0; border-left:1.5px dashed var(--line2); }
#rp-driver .rt-pts{ flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:11px; }
#rp-driver .rp .k{ font:600 .54rem 'Inter'; letter-spacing:.12em; text-transform:uppercase; color:var(--faint); margin-bottom:2px; }
#rp-driver .rp .v{ font:600 .93rem 'Inter'; line-height:1.35; }

/* task strip */
#rp-driver .task{ display:flex; align-items:flex-start; gap:9px; padding:10px 12px; border-radius:9px;
  margin-bottom:12px; background:rgba(227,100,20,.09); border:1px solid rgba(227,100,20,.28); }
#rp-driver .task .tk{ font:700 .52rem 'Inter'; letter-spacing:.12em; text-transform:uppercase;
  color:var(--faint); padding-top:3px; flex-shrink:0; }
#rp-driver .task .tv{ font:600 .86rem var(--disp); color:var(--orange-b); line-height:1.4; }
#rp-driver .task.blue{ background:rgba(0,41,107,.3); border-color:rgba(127,166,255,.26); }
#rp-driver .task.blue .tv{ color:var(--blue-b); }
#rp-driver .task.teal{ background:rgba(19,75,95,.4); border-color:rgba(79,168,196,.3); }
#rp-driver .task.teal .tv{ color:var(--teal-b); }
#rp-driver .task.done{ background:rgba(255,255,255,.04); border-color:var(--line); }
#rp-driver .task.done .tv{ color:var(--dim); }

/* actions */
#rp-driver .acts{ display:flex; gap:10px; margin-top:14px; }
#rp-driver .btn{ flex:1; padding:13px; border-radius:9px; font:600 .88rem var(--disp);
  color:#fff; text-align:center; transition:.15s; }
#rp-driver .btn:hover{ filter:brightness(1.25); }
#rp-driver .btn.teal{ background:var(--teal); }
#rp-driver .btn.plum{ background:var(--plum); }
#rp-driver .btn.ghost{ flex:0 0 36%; background:transparent; border:1px solid var(--line2); color:var(--dim); }
#rp-driver .btn.ghost:hover{ border-color:var(--red); color:var(--red); filter:none; }
#rp-driver .btn:disabled{ opacity:.5; cursor:not-allowed; filter:none; }
#rp-driver .done-strip{ display:flex; align-items:center; justify-content:center; gap:8px; padding:12px;
  border-radius:9px; background:rgba(95,15,64,.3); border:1px solid rgba(212,105,159,.3);
  color:var(--plum-b); font:600 .85rem var(--disp); margin-top:14px; }
#rp-driver .done-strip.teal{ background:rgba(19,75,95,.5); border-color:rgba(79,168,196,.35); color:var(--teal-b); }

/* leave */
#rp-driver .leave{ background:var(--card); border:1px solid var(--line); border-radius:12px;
  padding:13px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
#rp-driver .leave .lt{ font:600 .92rem var(--disp); margin-bottom:3px; }
#rp-driver .leave .ld{ font:500 .75rem 'Inter'; color:var(--dim); display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
#rp-driver .leave .ld b{ padding:1px 7px; border-radius:5px; font:700 .6rem 'Inter'; }

/* empty */
#rp-driver .empty{ text-align:center; padding:52px 26px; border:1px dashed var(--line2); border-radius:14px; }
#rp-driver .empty .ei{ font-size:1.7rem; margin-bottom:12px; }
#rp-driver .empty h3{ font:700 1rem var(--disp); margin-bottom:5px; }
#rp-driver .empty p{ font:400 .82rem/1.6 'Inter'; color:var(--faint); max-width:300px; margin:0 auto; }
#rp-driver .empty .ea{ margin-top:16px; display:flex; justify-content:center; }


#rp-driver .toast{ position:fixed; top:16px; left:16px; right:16px; z-index:9999; max-width:420px; margin:0 auto;
  padding:12px 16px; border-radius:11px; background:#101215; border:1px solid var(--line2);
  display:flex; align-items:center; gap:11px; font:500 .87rem 'Inter';
  box-shadow:0 12px 34px rgba(0,0,0,.7); animation:rpUp .3s var(--ease) both; }
#rp-driver .toast .ti{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; flex-shrink:0; }
#rp-driver .toast.ok .ti{ background:rgba(79,168,196,.15); color:var(--teal-b); }
#rp-driver .toast.err .ti{ background:rgba(255,92,71,.12); color:var(--red); }
#rp-driver .toast.info .ti{ background:rgba(127,166,255,.12); color:var(--blue-b); }

@media(max-width:430px){
  #rp-driver .stat .num{ font-size:1.45rem; }
  #rp-driver .kv-row .k{ width:72px; }
  #rp-driver .tabs{ gap:16px; }
  #rp-driver .exit-btn span{ display:none; }
  #rp-driver .exit-btn{ width:34px; padding:0; justify-content:center; }
}
`;

/*  UI COMPONENTS */

const Toast = ({ type, message, onClose }) => {
    useEffect(() => {
        if (!message) return undefined;

        const t = setTimeout(() => onClose?.(), 3200);
        return () => clearTimeout(t);

    }, [message, onClose]);

    if (!message) return null;
    const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle;
    return (
        <div className={`toast ${type === 'error' ? 'err' : type === 'info' ? 'info' : 'ok'}`} role="status">
            <span className="ti"><Icon size={15} strokeWidth={2.5} /></span>
            <span>{message}</span>
        </div>
    );
};

const StatCard = ({ value, label, tone }) => (
    <div className={`stat c-${tone}`}>
        <div className="num">
            {/* The dot dims to 25% at zero so a quiet stat reads as quiet. */}
            <i style={{ opacity: value > 0 ? 1 : .25 }} />
            <span>{value}</span>
        </div>
        <div className="lbl">{label}</div>
    </div>
);

const Pill = ({ status }) => {
    const s = STATUS[String(status || '').toLowerCase()]
        || { label: status || 'Unknown', pill: 'pill-gray' };
    return <span className={`pill ${s.pill}`}><i />{s.label}</span>;
};

const RouteBlock = ({ from, to, fromLabel = 'Pickup', toLabel = 'Destination' }) => (
    <div className="route">
        <div className="rt-line">
            <div className="rt-rail">
                <span className="rt-dot a" />
                <span className="bar" />
                <span className="rt-dot b" />
            </div>
            <div className="rt-pts">
                <div className="rp">
                    <div className="k">{fromLabel}</div>
                    <div className="v">{from || 'N/A'}</div>
                </div>
                <div className="rp">
                    <div className="k">{toLabel}</div>
                    <div className="v">{to || 'N/A'}</div>
                </div>
            </div>
        </div>
    </div>
);

const Empty = ({ emoji, title, sub, action }) => (
    <div className="empty">
        <div className="ei">{emoji}</div>
        <h3>{title}</h3>
        <p>{sub}</p>
        {action && <div className="ea">{action}</div>}
    </div>
);

const Loading = ({ text }) => (
    <div className="empty" style={{ borderStyle: 'solid' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Loader2 size={26} className="anim-spin" style={{ color: T.tealB }} />
        </div>
        <p style={{ margin: 0 }}>{text}</p>
    </div>
);

/* CARDS */

const clockIcon = <Clock size={10} strokeWidth={2.4} />;

const TripCard = ({ booking: b, onStatusChange, i, overdue, busy }) => {
    const now = getNairobiNow();
    const ds = tripDay(b);
    const today = dayKey(now);
    const tomorrow = addDays(1, now);

    const urgent = ds === today;
    const soon = ds === tomorrow;
    const f = ds ? fmtDay(ds) : { mo: '--', dy: '--' };
    const stripCls = urgent ? 'hot' : soon ? 'cool' : '';
    const time = tripTimeLabel(b);

    const vehicle = b.vehicle_name || b.hearse_name || b.model || 'Assigned';
    const plate = b.plate_number || b.number_plate || '';

    const done = ['completed', 'cancelled', 'declined'].includes(String(b.status || '').toLowerCase());
    const action = done
        ? null
        : b.status === 'in_transit'
            ? <button className="btn plum press" disabled={busy} onClick={() => onStatusChange(b.booking_id, 'completed')}>✓&nbsp; Complete Trip</button>
            : <button className="btn teal press" disabled={busy} onClick={() => onStatusChange(b.booking_id, 'in_transit')}>Accept Trip →</button>;

    return (
        <article className={`card anim-up ${done ? '' : 'pickup-pending'}`} style={{ animationDelay: `${i * .05}s` }}>
            <div className="card-bd">
                <div className="c-top">
                    <div>
                        <div className="c-code">{genId(b.booking_id)}</div>
                        <span className="c-chip">{clockIcon} Created {fmtDateShort(b.created_at)}{b.created_at ? ` · ${fmtTime(b.created_at)}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Pill status={b.status} />
                        {overdue && <span className="tag-over">⚠ Overdue</span>}
                    </div>
                </div>

                {ds && (
                    <div className={`dstrip ${stripCls}`}>
                        <div className="dcube">
                            <span className="mo">{f.mo}</span>
                            <span className="dy">{f.dy}</span>
                        </div>
                        <div>
                            <div className="d-main">
                                {urgent ? 'Today' : soon ? 'Tomorrow' : fmtFull(ds)}
                                {time && <span className="tm"> · {time}</span>}
                            </div>
                            <div className="d-sub">{fmtFull(ds)}</div>
                        </div>
                        <span className={`d-tag ${urgent ? 'due' : soon ? 'soon' : 'past'}`}>
                            {urgent ? 'Due' : soon ? 'Soon' : 'Date'}
                        </span>
                    </div>
                )}

                <div className="kv">
                    <div className="kv-row">
                        <span className="k">Client</span>
                        <span className="v big">{b.client_name || 'N/A'}</span>
                    </div>
                    {b.client_phone && (
                        <div className="kv-row">
                            <span className="k">Phone</span>
                            <span className="v mono">{b.client_phone}</span>
                        </div>
                    )}
                    {(b.assistant_name || b.assistant_phone) && (
                        <div className="kv-row">
                            <span className="k">Assistant</span>
                            <span className="v">{b.assistant_name || 'Not assigned'}{b.assistant_phone ? ` · ${b.assistant_phone}` : ''}</span>
                        </div>
                    )}
                </div>

                <RouteBlock
                    from={b.from_location || b.origin || b.departure_point}
                    to={b.destination || b.to_location}
                />

                <div className="kv" style={{ marginBottom: 0 }}>
                    <div className="kv-row">
                        <span className="k">Vehicle</span>
                        <span className="v">{vehicle}</span>
                    </div>
                    {plate && (
                        <div className="kv-row">
                            <span className="k">Plate</span>
                            <span className="v mono t">{plate}</span>
                        </div>
                    )}
                    {(b.branch_name || b.hearse_branch_name) && (
                        <div className="kv-row">
                            <span className="k">Branch</span>
                            <span className="v">{b.branch_name || b.hearse_branch_name}</span>
                        </div>
                    )}
                </div>

                <div className="acts">{action}</div>
            </div>
        </article>
    );
};

const PickupCard = ({ pickup: p, onRespond, i, busy }) => {
    const done = p.status !== 'pending';

    const pillCls = done
        ? (p.status === 'accepted' ? 'pill-teal' : 'pill-gray')
        : (p.accent === 'blue' ? 'pill-blue' : 'pill-teal');

    const body = done ? (
        <div className={`done-strip ${p.status === 'accepted' ? 'teal' : ''}`}>
            ✓&nbsp; {p.status === 'accepted' ? 'Accepted — dispatch notified' : 'Declined — dispatch notified'}
        </div>
    ) : (
        <div className="acts">
            <button className="btn ghost press" disabled={busy} onClick={() => onRespond(p.rowId, 'declined')}>Decline</button>
            <button className="btn teal press" disabled={busy} onClick={() => onRespond(p.rowId, 'accepted')}>✓&nbsp; Confirm</button>
        </div>
    );

    return (
        <article className="card anim-up" style={{ animationDelay: `${i * .05}s` }}>
            <div className="card-bd">
                <div className="c-top">
                    <div>
                        <div className="c-code">{p.id}</div>
                        <span className="c-chip">{clockIcon} Dispatched by {p.by}</span>
                    </div>
                    <span className={`pill ${pillCls}`}><i />{done ? p.status : p.kind}</span>
                </div>

                <div className={`task ${done ? 'done' : p.accent}`}>
                    <span className="tk">Task</span>
                    <span className="tv">{p.task}</span>
                </div>

                <div className="kv">
                    <div className="kv-row">
                        <span className="k">When</span>
                        <span className="v big o">{p.when}</span>
                    </div>
                    {p.contact && (
                        <div className="kv-row">
                            <span className="k">Contact</span>
                            <span className="v mono">{p.contact}</span>
                        </div>
                    )}
                </div>

                <RouteBlock from={p.from} to={p.to} fromLabel="From" toLabel="To" />

                {p.note && (
                    <div className="kv" style={{ marginBottom: 0 }}>
                        <div className="kv-row">
                            <span className="k">Note</span>
                            <span className="v it">{p.note}</span>
                        </div>
                    </div>
                )}

                {body}
            </div>
        </article>
    );
};

const LeaveCard = ({ leave: l, i }) => {
    const s = String(l.status || 'pending').toLowerCase();
    const meta = LEAVE[s] || LEAVE.pending;

    const start = l.start_date ? new Date(l.start_date) : null;
    const end = l.end_date ? new Date(l.end_date) : null;
    const days = start && end && !Number.isNaN(start) && !Number.isNaN(end)
        ? Math.round((end - start) / 86400000) + 1
        : null;

    return (
        <div className="leave anim-up" style={{ animationDelay: `${i * .05}s` }}>
            <div>
                <div className="lt">{l.leave_type || l.type || 'Leave'}</div>
                <div className="ld">
                    🕐 {start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    {' — '}
                    {end ? end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    {days > 0 && (
                        <b style={{ background: `${meta.c}1f`, color: meta.c }}>{days}d</b>
                    )}
                </div>
            </div>
            <span className={`pill ${meta.cls}`}>
                <i style={{ background: meta.c }} />
                {meta === LEAVE.pending ? 'pending' : s}
            </span>
        </div>
    );
};

/*MAIN COMPONENT */
const DriverPortal = () => {
    const navigate = useNavigate();
    const { socket, connected } = useSocket();

    const [bookings, setBookings] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loadingB, setLoadingB] = useState(true);
    const [loadingP, setLoadingP] = useState(true);
    const [loadingL, setLoadingL] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [info, setInfo] = useState('');
    const [tab, setTab] = useState('trips');
    const [selectedTripDate, setSelectedTripDate] = useState(() => dayKey(getNairobiNow()));
    const [showLeaveApplication, setShowLeaveApplication] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [driverFuelCards, setDriverFuelCards] = useState([]);
    const [driverFuelTransactions, setDriverFuelTransactions] = useState([]);
    const [driverFuelLoading, setDriverFuelLoading] = useState(true);
    const [driverFuelBusy, setDriverFuelBusy] = useState(false);
    const [fuelForm, setFuelForm] = useState({ hearseId: '', amount: '', station: '', reference: '', transactionDate: dayKey(getNairobiNow()) });
    const [fuelError, setFuelError] = useState('');

    const slug = getTenantSlug();
    const user = getUser();
    const driverName = user?.name || user?.full_name || user?.driver_name || '';
    // Drivers are ordinary tenant users (Settings → Users, role "driver"), and
    // the workshop Store stores a dispatch's driver_id as that user's id. So the
    // pickup feed must match on the SAME id. Prefer an explicit driver_id, then
    // fall back to the user's own id — otherwise a normal login has no driver_id
    // and pickups only ever matched by (fragile) exact name.
    const driverId = user?.driver_id || user?.driverId || user?.driver?.driver_id
        || user?.user_id || user?.userId || user?.id || '';
    const first = driverName ? String(driverName).trim().split(' ')[0] : 'Driver';

    const say = useCallback((setter, msg) => {
        setter(msg);
        if (msg) setTimeout(() => setter(''), 3200);
    }, []);

    /* ─── data ─── */
    const loadB = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoadingB(true);
        try {
            const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings?t=${Date.now()}`, { headers: getAuthHeaders() });
            const d = JSON.parse(await r.text());
            if (d.status === 'success' || d.bookings) setBookings(d.bookings || []);
            else if (!silent) setError(d.message || 'Failed to load trips');
        } catch (e) {
            if (!silent) setError(e.message || 'Network error');
        } finally { setLoadingB(false); setRefreshing(false); }
    }, []);

    const loadP = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true); else setLoadingP(true);
        // The endpoint requires a specific driver identity; never request the
        // tenant-wide dispatch log for a profile without one.
        if (!driverId && !driverName) { setPickups([]); setLoadingP(false); return; }
        try {
            const identity = new URLSearchParams();
            if (driverId) identity.set('driver_id', String(driverId));
            if (driverName) identity.set('driver_name', String(driverName));
            const r = await fetchWithCredentials(
                `${API_BASE_URL}/workshop/store/pickups?${identity.toString()}&t=${Date.now()}`,
                { headers: getAuthHeaders() }
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const rows = await r.json();
            setPickups(Array.isArray(rows) ? rows.map(toPickup) : []);
        } catch (e) {
            // A missing pickup feed must not take down the whole portal.
            console.warn('[DriverPortal] Pickups unavailable:', e.message);
            setPickups([]);
        } finally { setLoadingP(false); setRefreshing(false); }
    }, [driverId, driverName]);

    const loadDriverFuel = useCallback(async (silent = false) => {
        if (!silent) setDriverFuelLoading(true);
        setFuelError('');
        try {
            const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-fuel/driver-cards?t=${Date.now()}`, { headers: getAuthHeaders() });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || 'Unable to load your fuel card.');
            const cards = Array.isArray(data.cards) ? data.cards : [];
            setDriverFuelCards(cards);
            setDriverFuelTransactions(Array.isArray(data.transactions) ? data.transactions : []);
            setFuelForm((current) => ({
                ...current,
                hearseId: cards.some((card) => String(card.hearse_id) === String(current.hearseId))
                    ? current.hearseId
                    : String(cards[0]?.hearse_id || ''),
            }));
        } catch (loadError) {
            setFuelError(loadError.message || 'Unable to load your assigned fuel card.');
        } finally {
            setDriverFuelLoading(false);
        }
    }, []);

    const loadL = useCallback(async () => {
        setLoadingL(true);
        try {
            const h = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const r = await fetchWithCredentials(`${API_BASE_URL}/leaves/my-leaves`, { headers: h });
            const d = await r.json();
            setLeaves(d?.leaves || d?.data || []);
        } catch { setLeaves([]); }
        finally { setLoadingL(false); }
    }, []);

    useEffect(() => {
        if (!slug || slug === 'default') { setError('No tenant configured.'); return; }
        loadB(); loadP(); loadL(); loadDriverFuel();
    }, [slug, loadB, loadP, loadL, loadDriverFuel]);

    useEffect(() => {
        if (!socket || !connected) return;
        loadB(true);
        loadP(true);
        loadDriverFuel(true);
        const handleNewBooking = (data) => {
            if (data.booking) setBookings(prev => [data.booking, ...prev]);
            else loadB(true);
            setRefreshing(false);
        };
        const handleStatusUpdate = (data) => {
            if (data.booking_id && data.status) {
                setBookings(prev => prev.map(b => b.booking_id === data.booking_id
                    ? { ...b, status: data.status, ...(data.booking || {}) }
                    : b));
            } else loadB(true);
            setRefreshing(false);
        };
        const handlePickup = () => loadP(true);
        const handleHearseChange = (data = {}) => {
            loadB(true);
            if (String(data.changeType || '').startsWith('fuel_') || data.changeType === 'driver_fuel_purchase') {
                loadDriverFuel(true);
            }
        };
        socket.on('new_booking', handleNewBooking);
        socket.on('booking_status_updated', handleStatusUpdate);
        socket.on('booking_postponed', handlePickup);
        socket.on('store:dispatch', handlePickup);
        socket.on('store:pickup_response', handlePickup);
        socket.on('hearse_data_changed', handleHearseChange);
        return () => {
            socket.off('new_booking', handleNewBooking);
            socket.off('booking_status_updated', handleStatusUpdate);
            socket.off('booking_postponed', handlePickup);
            socket.off('store:dispatch', handlePickup);
            socket.off('store:pickup_response', handlePickup);
            socket.off('hearse_data_changed', handleHearseChange);
        };
    }, [loadB, loadP, loadDriverFuel, socket, connected]);

    // Keep the feeds fresh without the driver having to pull-to-refresh.
    useEffect(() => {
        const t = setInterval(() => { loadB(true); loadP(true); loadDriverFuel(true); }, 60 * 1000);
        return () => clearInterval(t);
    }, [loadB, loadP, loadDriverFuel]);

    /* ─── actions ─── */
    const changeStatus = async (id, s) => {
        setBusy(true);
        try {
            const h = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings/${id}/status`, {
                method: 'PUT', headers: h, body: JSON.stringify({ status: s }),
            });
            if (!r.ok) throw new Error();
            say(setSuccess, s === 'in_transit'
                ? `Trip ${genId(id)} accepted — you're en route`
                : `Trip ${genId(id)} completed. Well done.`);
            loadB(true);
        } catch {
            say(setError, 'Failed to update the trip.');
        } finally { setBusy(false); }
    };

    const respondPickup = async (id, status) => {
        setBusy(true);
        // Optimistic: the card flips immediately, and a failure reloads the
        // truth so the driver is never left looking at a lie.
        setPickups(prev => prev.map(p => (p.rowId === id ? { ...p, status } : p)));
        try {
            const r = await fetchWithCredentials(`${API_BASE_URL}/workshop/store/pickups/${id}`, {
                method: 'PATCH',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            say(setSuccess, status === 'accepted'
                ? 'Pickup confirmed — dispatch notified'
                : 'Pickup declined — dispatch notified');
            loadP(true);
        } catch {
            say(setError, 'Could not update the pickup.');
            loadP(true);
        } finally { setBusy(false); }
    };

    const recordDriverFuelling = async (event) => {
        event.preventDefault();
        setDriverFuelBusy(true);
        setFuelError('');
        try {
            const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-fuel/driver-purchases`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hearse_id: fuelForm.hearseId,
                    amount: fuelForm.amount,
                    station: fuelForm.station,
                    reference: fuelForm.reference,
                    transaction_date: fuelForm.transactionDate,
                }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || 'Unable to record fuelling.');
            setDriverFuelCards(Array.isArray(data.cards) ? data.cards : []);
            setDriverFuelTransactions(Array.isArray(data.transactions) ? data.transactions : []);
            setFuelForm((current) => ({ ...current, amount: '', station: '', reference: '' }));
            say(setSuccess, 'Fuelling recorded. The amount has been deducted from your vehicle card.');
        } catch (fuelSaveError) {
            setFuelError(fuelSaveError.message || 'Unable to record fuelling.');
        } finally {
            setDriverFuelBusy(false);
        }
    };

    const refresh = () => {
        setRefreshing(true);
        setTimeout(() => { loadB(true); loadP(true); loadL(); loadDriverFuel(); }, 700);
    };

    const logout = () => {
        localStorage.removeItem('authToken'); localStorage.removeItem('user');
        localStorage.removeItem('tenantSlug'); localStorage.removeItem('refreshToken');
        sessionStorage.clear(); navigate('/login');
    };

    /* ─── derived ─── */
    const nowN = getNairobiNow();
    const assignedBookings = bookings.filter((booking) => isAssignedToDriver(booking, driverId, driverName));
    const rated = assignedBookings
        .map(b => ({ b, kind: tripKind(b, nowN) }))
        .filter(x => x.kind)
        .sort((a, z) => (a.kind === z.kind ? tripTimeMs(a.b) - tripTimeMs(z.b) : a.kind === 'upcoming' ? -1 : 1));

    const upcomingCount = rated.filter(x => x.kind === 'upcoming').length;
    const overdueCount = rated.filter(x => x.kind === 'overdue').length;
    const overdueIds = new Set(rated.filter(x => x.kind === 'overdue').map(x => String(x.b.booking_id)));
    const transit = assignedBookings.filter(b => b.status === 'in_transit').length;
    const pendingPicks = pickups.filter(p => p.status === 'pending').length;
    const todayKey = dayKey(nowN);
    const tripCalendarDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(nowN);
        date.setDate(date.getDate() + index);
        const key = dayKey(date);
        const count = assignedBookings.filter((booking) =>
            !CLOSED_STATUSES.includes(String(booking.status || '').toLowerCase())
            && bookingDateKeys(booking).includes(key)
        ).length;
        return { key, date, count };
    });
    const selectedDayBookings = assignedBookings
        .filter((booking) => !CLOSED_STATUSES.includes(String(booking.status || '').toLowerCase()))
        .filter((booking) => bookingDateKeys(booking).includes(selectedTripDate))
        .sort((a, b) => tripTimeMs(a) - tripTimeMs(b));
    const overdueForToday = selectedTripDate === todayKey
        ? rated.filter((trip) => trip.kind === 'overdue').map((trip) => trip.b)
        : [];
    const visibleTripBookings = [...new Map(
        [...overdueForToday, ...selectedDayBookings].map((booking) => [String(booking.booking_id), booking])
    ).values()];
    const overdueTripIds = new Set(overdueForToday.map((booking) => String(booking.booking_id)));
    const assignedTripCount = assignedBookings.filter(
        (booking) => !CLOSED_STATUSES.includes(String(booking.status || '').toLowerCase())
    ).length;

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const TABS = [
        { k: 'trips', l: 'Trips', Icon: RouteIcon, n: assignedTripCount, cls: '' },
        { k: 'pickups', l: 'Pickups', Icon: MapPin, n: pendingPicks, cls: 'k-orange' },
        { k: 'fuel', l: 'Fuelling', Icon: Fuel, n: driverFuelCards.length, cls: '' },
        { k: 'leaves', l: 'Leaves', Icon: Calendar, n: leaves.length, cls: '' },
    ];

    return (
        <div id="rp-driver">
            <style>{css}</style>

            <Toast type="error" message={error} onClose={() => setError('')} />
            <Toast type="success" message={success} onClose={() => setSuccess('')} />

            {/* ─── NAV : name + date ─── */}
            <header className="hdr">
                <div className="hdr-in">
                    <div className="who">
                        <b>{first}</b>
                        <small>{todayStr}</small>
                    </div>
                    <nav className="hnav">
                        <button className="gbtn press" onClick={refresh} title="Refresh" aria-label="Refresh">
                            <RefreshCw size={16} strokeWidth={2.2} className={refreshing ? 'anim-spin' : ''} />
                        </button>
                        <button className="exit-btn press" onClick={logout} title="Exit">
                            <LogOut size={13} strokeWidth={2.4} />
                            <span>Exit</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main>
                {(upcomingCount > 0 || overdueCount > 0) && (
                    <div className={`notice anim-up ${overdueCount > 0 ? 'hot' : ''}`}>
                        <span className="nd" />
                        <span>
                            <strong>{upcomingCount}</strong> trip{upcomingCount !== 1 ? 's' : ''} in the next 24h
                            {overdueCount > 0 && (
                                <> · <strong style={{ color: 'var(--red)' }}>{overdueCount}</strong> past &amp; still open</>
                            )}
                        </span>
                    </div>
                )}

                {/* ─── STATS ─── */}
                <div className="stats anim-up" style={{ animationDelay: '.05s' }}>
                    <StatCard value={upcomingCount} label="Next 24h" tone="orange" />
                    <StatCard value={transit} label="En Route" tone="blue" />
                    <StatCard value={overdueCount} label="Overdue" tone="red" />
                </div>

                {/* ─── TABS ─── */}
                <div className="tabs anim-up" style={{ animationDelay: '.1s' }} role="tablist">
                    {TABS.map(t => (
                        <button
                            key={t.k}
                            role="tab"
                            aria-selected={tab === t.k}
                            className={tab === t.k ? `on ${t.cls}`.trim() : ''}
                            onClick={() => setTab(t.k)}
                        >
                            <t.Icon size={14} strokeWidth={2.3} />
                            {t.l} <span className="n">{t.n}</span>
                        </button>
                    ))}
                </div>

                {/* ─── CONTENT ─── */}
                <div className="anim-up" style={{ animationDelay: '.15s' }}>

                    {tab === 'trips' && (
                        loadingB ? <Loading text="Loading trips…" /> :
                            <>
                                <section className="trip-calendar" aria-label="Assigned trips by day">
                                    <div className="trip-calendar-head">
                                        <strong>My trip schedule</strong>
                                        <small>{fmtFull(selectedTripDate)}</small>
                                    </div>
                                    <div className="trip-days">
                                        {tripCalendarDays.map(({ key, date, count }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`trip-day${selectedTripDate === key ? ' on' : ''}${key === todayKey ? ' today' : ''}`}
                                                aria-pressed={selectedTripDate === key}
                                                aria-label={`${fmtFull(key)}${count ? `, ${count} assigned trip${count === 1 ? '' : 's'}` : ', no assigned trips'}`}
                                                onClick={() => setSelectedTripDate(key)}
                                            >
                                                <span className="td-dow">{key === todayKey ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                <span className="td-date">{date.getDate()}</span>
                                                <span className="td-count">{count ? `${count} trip${count === 1 ? '' : 's'}` : '—'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                {visibleTripBookings.length === 0 ? (
                                    <Empty
                                        emoji="🚗"
                                        title="No trips scheduled"
                                        sub={`You have no assigned trips for ${fmtFull(selectedTripDate)}. Select another day to view your schedule.`}
                                    />
                                ) : visibleTripBookings.map((b, i) => (
                                    <TripCard
                                        key={b.booking_id}
                                        booking={b}
                                        onStatusChange={changeStatus}
                                        i={i}
                                        overdue={overdueTripIds.has(String(b.booking_id)) || overdueIds.has(String(b.booking_id))}
                                        busy={busy}
                                    />
                                ))}
                            </>
                    )}

                    {tab === 'pickups' && (
                        loadingP ? <Loading text="Loading pickups…" /> :
                            pickups.length === 0 ? (
                                <Empty
                                    emoji="📍"
                                    title="No Pickup Requests"
                                    sub="Coffin pickups assigned to you at the workshop store will appear here for confirmation."
                                />
                            ) : pickups.map((p, i) => (
                                <PickupCard key={p.rowId} pickup={p} onRespond={respondPickup} i={i} busy={busy} />
                            ))
                    )}

                    {tab === 'fuel' && (
                        driverFuelLoading ? <Loading text="Loading your assigned fuel card…" /> :
                            <section className="fuel-panel">
                                <h2><CreditCard size={17} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 7, color: T.tealB }} />Vehicle fuel card</h2>
                                <p className="fuel-muted">Record the amount paid at the station. It will be deducted from your assigned card’s RestPoint balance.</p>
                                {fuelError && <div className="notice hot" role="alert"><AlertCircle size={15} />{fuelError}</div>}
                                {driverFuelCards.length === 0 ? (
                                    <Empty emoji="💳" title="No fuel card assigned" sub="Ask your fleet manager to assign your vehicle and TotalEnergies card to your driver account." />
                                ) : (
                                    <>
                                        <div className="fuel-cards">
                                            {driverFuelCards.map((card) => (
                                                <div className="fuel-vehicle" key={card.hearse_id}>
                                                    <div>
                                                        <strong>{card.plate_number}</strong>
                                                        <small>{card.hearse_name || 'Assigned hearse'} · Card ending {card.card_last_four}</small>
                                                    </div>
                                                    <span className={`fuel-amount${card.is_low ? ' low' : ''}`}>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(card.balance) || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <form className="fuel-form" onSubmit={recordDriverFuelling}>
                                            {driverFuelCards.length > 1 && (
                                                <label>
                                                    Vehicle
                                                    <select required value={fuelForm.hearseId} onChange={(event) => setFuelForm((current) => ({ ...current, hearseId: event.target.value }))}>
                                                        {driverFuelCards.map((card) => <option key={card.hearse_id} value={card.hearse_id}>{card.plate_number} · Card ending {card.card_last_four}</option>)}
                                                    </select>
                                                </label>
                                            )}
                                            <label>
                                                Petrol station / location
                                                <input required maxLength={150} value={fuelForm.station} onChange={(event) => setFuelForm((current) => ({ ...current, station: event.target.value }))} placeholder="e.g. TotalEnergies Westlands" />
                                            </label>
                                            <label>
                                                Amount paid (KES)
                                                <input required type="number" min="0.01" step="0.01" value={fuelForm.amount} onChange={(event) => setFuelForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Enter amount" />
                                            </label>
                                            <label>
                                                Date
                                                <input required type="date" value={fuelForm.transactionDate} onChange={(event) => setFuelForm((current) => ({ ...current, transactionDate: event.target.value }))} />
                                            </label>
                                            <label>
                                                Receipt / transaction reference (optional)
                                                <input maxLength={120} value={fuelForm.reference} onChange={(event) => setFuelForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Receipt or transaction number" />
                                            </label>
                                            <button type="submit" disabled={driverFuelBusy || !fuelForm.hearseId}>
                                                {driverFuelBusy ? <Loader2 size={16} className="anim-spin" /> : <Fuel size={16} />}
                                                {driverFuelBusy ? 'Recording fuelling…' : 'Record fuelling'}
                                            </button>
                                        </form>
                                        {driverFuelTransactions.length > 0 && (
                                            <div className="fuel-history">
                                                <h3>Your recent fuelling records</h3>
                                                {driverFuelTransactions.map((transaction) => (
                                                    <div className="fuel-transaction" key={transaction.id}>
                                                        <span>{transaction.hearse_plate} · {transaction.station || 'Station'} · {String(transaction.transaction_date).slice(0, 10)}</span>
                                                        <strong>−{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(transaction.amount) || 0)}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                    )}

                    {tab === 'leaves' && (
                        showLeaveApplication ? (
                            <ApplyLeave
                                onClose={() => setShowLeaveApplication(false)}
                                onSubmitted={loadL}
                            />
                        ) : loadingL ? <Loading text="Loading leaves…" /> :
                            leaves.length === 0 ? (
                                <Empty
                                    emoji="🗓️"
                                    title="No Leaves"
                                    sub="Your leave requests will appear here once you submit one."
                                    action={(
                                        <button
                                            className="btn teal press"
                                            style={{ flex: '0 0 auto', padding: '11px 20px' }}
                                            onClick={() => setShowLeaveApplication(true)}
                                        >
                                            <Plus size={14} strokeWidth={2.5} />&nbsp; Apply for Leave
                                        </button>
                                    )}
                                />
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                                        <button
                                            className="btn teal press"
                                            style={{ flex: '0 0 auto', padding: '9px 16px', fontSize: '.8rem' }}
                                            onClick={() => setShowLeaveApplication(true)}
                                        >
                                            <Plus size={13} strokeWidth={2.5} />&nbsp; Apply for Leave
                                        </button>
                                    </div>
                                    {leaves.map((l, i) => <LeaveCard key={l.id || l.leave_id || i} leave={l} i={i} />)}
                                </>
                            )
                    )}
                </div>
            </main>
        </div>
    );
};

export default DriverPortal;
