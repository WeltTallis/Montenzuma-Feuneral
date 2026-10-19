/**
 * CoffinBook — Reservation Dashboard
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameWeek, isSameMonth,
  addWeeks, subWeeks, addDays, isToday,
} from 'date-fns';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios';
import { getParentTenantSlug, getTenantId } from '../../utils/globalAuth';
import CoffinInventory from './coffininventory';
import CoffinTransfers from './coffinTransfers';
import CoffinCalendarGrid from './CoffinCalendarGrid';
import ReservationMonthGrid from './reservations/components/ReservationMonthGrid';
import './reservations/reservations.css';

var TX   = '#111827';
var TX2  = '#374151';
var TX3  = '#6b7280';
var TX4  = '#9ca3af';
var BG   = '#f9fafb';
var CARD = '#ffffff';
var BRD  = '#e5e7eb';
var BRDL = '#f3f4f6';
var ACC  = '#0f766e';
var ACCL = '#14b8a6';
var ACCLT= '#f0fdfa';
var SUC  = '#16a34a';
var SUCL = '#f0fdf4';
var DNG  = '#dc2626';
var DNGL = '#fef2f2';
var FONT = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";
var SHS  = '0 1px 2px rgba(0,0,0,.04)';
var SHL  = '0 10px 15px rgba(0,0,0,.08)';
var SHXL = '0 20px 25px rgba(0,0,0,.1)';

var ST = {
  pending:     { label: 'Pending',     color: '#d97706', bar: '#d97706' },
  booked:      { label: 'Booked',      color: '#00296B', bar: '#00296B' },
  confirmed:   { label: 'Confirmed',   color: '#00296B', bar: '#00296B' },
  scheduled:   { label: 'Scheduled',   color: '#E36414', bar: '#E36414' },
  in_progress: { label: 'In Progress', color: '#0c0b0f', bar: '#0c0b0f' },
  in_transit:  { label: 'In Transit',  color: '#E36414', bar: '#E36414' },
  postponed:   { label: 'Postponed',   color: '#d97706', bar: '#d97706' },
  completed:   { label: 'Completed',   color: '#5F0F40', bar: '#5F0F40' },
  delivered:   { label: 'Delivered',   color: '#132A13', bar: '#132A13' },
  cancelled:   { label: 'Cancelled',   color: '#DD2D4A', bar: '#DD2D4A' },
  maintenance: { label: 'Maintenance', color: '#03071E', bar: '#03071E' },
};
var STORD = ['confirmed', 'booked', 'pending', 'scheduled', 'in_progress', 'in_transit', 'postponed', 'completed', 'delivered', 'cancelled', 'maintenance'];

function Ico(p) {
  return (
    <svg viewBox="0 0 24 24" width={p.size || 14} height={p.size || 14} fill="none" stroke="currentColor" strokeWidth={p.sw || 1.8} strokeLinecap="round" strokeLinejoin="round">
      {p.children}
    </svg>
  );
}
var IC = {
  cal:    <Ico size={15}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Ico>,
  ph:     <Ico size={10}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Ico>,
  us:     <Ico size={10}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>,
  al:     <Ico size={12}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Ico>,
  dl:     <Ico size={12}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Ico>,
  tr:     <Ico size={12}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Ico>,
  cl:     <Ico size={11} sw={2.2}><polyline points="15 18 9 12 15 6" /></Ico>,
  cr:     <Ico size={11} sw={2.2}><polyline points="9 18 15 12 9 6" /></Ico>,
  pl:     <Ico size={11} sw={2.4}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Ico>,
  rf:     <Ico size={11}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Ico>,
  x:      <Ico size={12}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>,
  ar:     <Ico size={9} sw={2.2}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Ico>,
  ck:     <Ico size={12}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Ico>,
  search: <Ico size={12}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Ico>,
  clock:  <Ico size={10}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ico>,
  grid:   <Ico size={11}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Ico>,
};

function pad2(n) { return String(n).padStart(2, '0'); }
function mapStatus(s) { var v = String(s || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'); if (ST[v]) return v; if (v === 'active' || v === 'approved' || v === 'reserved') return 'confirmed'; if (v === 'done') return 'completed'; if (v === 'canceled' || v === 'rejected') return 'cancelled'; if (v === 'transit' || v === 'transferring') return 'in_transit'; if (v === 'progress') return 'in_progress'; if (v === 'paid') return 'confirmed'; return 'pending'; }
function parseServiceDate(raw) { if (!raw) return null; var m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); var d = new Date(raw); return isNaN(d.getTime()) ? null : d; }
function extractTime(raw) { if (!raw) return ''; var m = String(raw).match(/T(\d{2}):(\d{2})/); if (m) return m[1] + ':' + m[2]; if (/^\d{1,2}:\d{2}/.test(String(raw))) return String(raw).slice(0, 5); return ''; }
function usd(n) { return 'KES ' + Number(n || 0).toLocaleString(); }
var REFRESH_MS = 15000;
function toArr(v) { if (Array.isArray(v)) return v; if (v && typeof v === 'object') { if (Array.isArray(v.data)) return v.data; if (Array.isArray(v.orders)) return v.orders; if (Array.isArray(v.bookings)) return v.bookings; if (Array.isArray(v.hearses)) return v.hearses; if (Array.isArray(v.results)) return v.results; } return []; }

function ChartTip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  return (
    <div style={{ background: CARD, border: '1px solid ' + BRD, borderRadius: 10, padding: '10px 14px', boxShadow: SHL, fontSize: 11, color: TX }}>
      {props.label && <div style={{ fontWeight: 700, marginBottom: 4, color: TX3, fontSize: 10 }}>{props.label}</div>}
      {props.payload.map(function (p, i) {
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} /><span style={{ color: TX3 }}>{p.name || ''}</span><span style={{ fontWeight: 700, marginLeft: 'auto' }}>{p.value}</span></div>;
      })}
    </div>
  );
}

export default function ReservationDashboard(props) {
  var bookings = props.bookings || [], coffins = props.coffins || [];
  var reservationsOnly = props.reservationsOnly === true;
  var formatPrice = props.formatPrice, onNewReservation = props.onNewReservation;
  var navTabs = props.navTabs, activeNav = props.activeNav, onNavChange = props.onNavChange;
  var onInventory = props.onInventory, onTransfer = props.onTransfer;
  var branchSelector = props.branchSelector, headerActions = props.headerActions;
  var childrenProp = props.children;
  // Self-managed alt views: when the parent doesn't supply navTabs, the
  // Inventory / Transfer toolbar buttons switch views internally instead of
  // requiring external wiring.
  var _av = useState(null), altView = _av[0], setAltView = _av[1];
  var selfNav = !(navTabs && navTabs.length > 0);
  var effTabs = reservationsOnly
    ? [{ key: 'bookings', label: 'Bookings', icon: 'fa-calendar-check' }]
    : selfNav
    ? [
        { key: 'bookings',  label: 'Bookings',  icon: 'fa-calendar-check' },
        { key: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked' },
        { key: 'transfers', label: 'Transfers', icon: 'fa-right-left' },
      ]
    : navTabs;
  var effActive = activeNav || (selfNav ? (altView || 'bookings') : null);
  var showAltSection = !!(effActive && effActive !== 'bookings');
  // Alt content: parent-supplied children win; otherwise render the built-in
  // Coffin Inventory / Coffin Transfers modules for the active view.
  var altContent = childrenProp;
  if (!altContent && showAltSection) {
    if (effActive === 'inventory') altContent = <CoffinInventory />;
    else if (effActive === 'transfers') altContent = <CoffinTransfers />;
  }

  var _v = useState('full'), view = _v[0], setView = _v[1];
  var _s = useState(new Date()), sel = _s[0], setSel = _s[1];
  var _cm = useState(new Date()), calMonth = _cm[0], setCalMonth = _cm[1];
  var _l = useState(true), live = _l[0], setLive = _l[1];
  var _lb = useState(bookings), liveBookings = _lb[0], setLiveBookings = _lb[1];
  var _lc = useState(coffins), liveCoffins = _lc[0], setLiveCoffins = _lc[1];
  var _le = useState(null), liveError = _le[0], setLiveError = _le[1];
  var _rr = useState(false), refreshing = _rr[0], setRefreshing = _rr[1];
  var _pb = useState(null), panelBk = _pb[0], setPanelBk = _pb[1];
  var _tm = useState(null), toastMsg = _tm[0], setToastMsg = _tm[1];
  var _to = useState(false), toastOut = _to[0], setToastOut = _to[1];
  var _ck = useState(new Date()), clock = _ck[0], setClock = _ck[1];
  var _cd = useState(null), clickedDay = _cd[0], setClickedDay = _cd[1];
  var _mp = useState(false), markingPaid = _mp[0], setMarkingPaid = _mp[1];
  var _sq = useState(''), searchQuery = _sq[0], setSearchQuery = _sq[1];
  var _af = useState([]), activeFilters = _af[0], setActiveFilters = _af[1];
  var inFlight = useRef(false), toastTimer = useRef(null), panelRef = useRef(null);

  /* ── URL-driven month state ────────────────────────────────────────────
     Mirrors the hearse calendar: only the visible month is fetched, and the
     URL (?month=9&year=2026) is the source of truth so a link can be shared
     and Back/Forward land on the right month. */
  var _sp = useSearchParams(), searchParams = _sp[0], setSearchParams = _sp[1];

  // STRICT integer parse: parseInt("9abc", 10) would return 9 and silently show
  // the wrong month, so the whole string must be digits.
  function toInt(v) { var s = String(v == null ? '' : v).trim(); if (!/^\d{1,6}$/.test(s)) return NaN; var n = parseInt(s, 10); return isFinite(n) ? n : NaN; }

  var rawMonth = toInt(searchParams.get('month'));
  var rawYear = toInt(searchParams.get('year'));
  // Reject impossible values instead of letting Date roll over into a
  // different month than the one the URL names.
  var urlMonth = rawMonth >= 1 && rawMonth <= 12 ? rawMonth - 1 : NaN; // 0-based
  var urlYear = rawYear >= 1970 && rawYear <= 2200 ? rawYear : NaN;

  // `now` is pinned once so it stays a STABLE dependency — a fresh new Date()
  // each render would defeat the memo and refetch on every paint.
  var nowPinned = useMemo(function () { return new Date(); }, []);
  var initialMonth = isNaN(urlMonth) ? nowPinned.getMonth() : urlMonth;
  var initialYear = isNaN(urlYear) ? nowPinned.getFullYear() : urlYear;

  var _vm = useState(initialMonth), viewMonth = _vm[0], setViewMonth = _vm[1];
  var _vy = useState(initialYear), viewYear = _vy[0], setViewYear = _vy[1];

  // The visible month as a real Date, and its inclusive ISO bounds for the API.
  var visibleMonthDate = useMemo(function () { return new Date(viewYear, viewMonth, 1); }, [viewYear, viewMonth]);
  var monthRange = useMemo(function () {
    return { from: format(startOfMonth(visibleMonthDate), 'yyyy-MM-dd'), to: format(endOfMonth(visibleMonthDate), 'yyyy-MM-dd') };
  }, [visibleMonthDate]);

  // Follow the URL when it changes underneath us (Back/Forward, pasted link).
  useEffect(function () {
    if (!isNaN(urlMonth) && urlMonth !== viewMonth) setViewMonth(urlMonth);
    if (!isNaN(urlYear) && urlYear !== viewYear) setViewYear(urlYear);
  }, [urlMonth, urlYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rewrite the URL to the canonical form on month change. `replace: true` stops
  // a history entry per month paged through.
  var goToMonth = useCallback(function (month, year) {
    // Carry the overflow instead of clamping it. Callers hand us raw arithmetic
    // (`viewMonth + dir`, `calMonth.getMonth() + dir`), so December + 1 must
    // roll into January of the NEXT year. Clamping used to snap month 12 back
    // to 11, turning one "next" click into an 11-month jump (Dec-2026 -> Dec-2027)
    // and making the year the caller pre-adjusted land a year too far.
    // getMonth() is 0-based, so 12 wraps to 0.
    var m = Math.trunc(Number(month));
    var y = Math.trunc(Number(year));
    if (!isFinite(m) || !isFinite(y)) return;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    y = Math.min(2200, Math.max(1970, y));
    setViewMonth(m); setViewYear(y);
    var next = new URLSearchParams(searchParams);
    next.set('month', String(m + 1)); // 1-12 in the URL, 0-11 in JS
    next.set('year', String(y));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // `scopedFetched` becomes true once the month-scoped fetch below succeeds.
  // The parent's `bookings` prop is fetched WITHOUT from/to (coffininventory
  // line ~1137 `api.get('/coffins/orders')`), and the backend deliberately
  // returns EVERYTHING when those params are absent. Seeding from that prop
  // unconditionally meant every parent refresh (socket transfer event, manual
  // refresh) dumped the whole booking history — months back — back into the
  // dashboard, so the calendar dots, status counts and analytics all reported
  // old months instead of the month on screen. Seed from the prop ONLY until
   // the authoritative month-scoped fetch has landed.
  var scopedFetched = useRef(false);
  useEffect(function () {
    if (!scopedFetched.current) setLiveBookings(bookings);
  }, [bookings]);
  useEffect(function () { setLiveCoffins(coffins); }, [coffins]);
  useEffect(function () { var t = setInterval(function () { setClock(new Date()); }, 1000); return function () { clearInterval(t); }; }, []);

  var showToast = useCallback(function (msg) {
    window.clearTimeout(toastTimer.current);
    setToastOut(false);
    setToastMsg(msg);
    toastTimer.current = window.setTimeout(function () {
      setToastOut(true);
      toastTimer.current = window.setTimeout(function () { setToastMsg(null); }, 250);
    }, 2600);
  }, []);

  // Month-scoped: only the visible month is requested. The endpoint defaults to
  // "everything" when from/to are absent, so the params MUST be passed on every
  // endpoint in the fallback chain.
  function doFetchOrders() {
    var eps = ['/coffins/orders', '/coffins/orders/list']; var idx = 0;
    function next() { if (idx >= eps.length) return Promise.resolve([]); return api.get(eps[idx], { params: { from: monthRange.from, to: monthRange.to } }).then(function (r) { var l = toArr(r && r.data); if (l.length > 0 || (r && r.data && r.data.success)) return l; idx++; return next(); }).catch(function () { idx++; return next(); }); }
    return next();
  }
  function doFetchCoffins() {
    var ps = getParentTenantSlug(), ti = getTenantId(); var params = { parent_slug: ps || undefined, tenant_id: ti || undefined };
    var eps = ['/coffins/all-branches', '/coffins/list']; var idx = 0;
    function next() { if (idx >= eps.length) return Promise.resolve([]); return api.get(eps[idx], { params: params }).then(function (r) { var l = toArr(r && r.data); if (l.length > 0 || (r && r.data && r.data.success)) return l; idx++; return next(); }).catch(function () { idx++; return next(); }); }
    return next();
  }

  // monthRange.from/to are dependencies, so changing the visible month refetches
  // that month. Coffins (inventory) are not date-scoped, so they are left alone.
  var fetchLive = useCallback(function () {
    if (inFlight.current) return Promise.resolve(); inFlight.current = true; setRefreshing(true);
    // Always adopt the month-scoped result, INCLUDING an empty one. The previous
    // `if (res[0].length)` guard meant a month with no bookings silently kept
    // whatever was already in state — so paging into an empty month still
    // rendered the previous month's rows instead of an empty calendar.
    return Promise.all([doFetchOrders(), doFetchCoffins()]).then(function (res) { scopedFetched.current = true; setLiveBookings(res[0]); if (res[1].length) setLiveCoffins(res[1]); setLiveError(null); }).catch(function (err) { setLiveError((err && err.response && err.response.data && err.response.data.message) || (err && err.message) || 'Live refresh failed'); }).finally(function () { inFlight.current = false; setRefreshing(false); });
  }, [monthRange.from, monthRange.to]);

  useEffect(function () { fetchLive(); var t = setInterval(function () { if (live) fetchLive(); }, REFRESH_MS); var onVis = function () { if (document.visibilityState === 'visible') fetchLive(); }; document.addEventListener('visibilitychange', onVis); return function () { clearInterval(t); document.removeEventListener('visibilitychange', onVis); }; }, [fetchLive, live]);
  var money = typeof formatPrice === 'function' ? formatPrice : usd;
  useEffect(function () { var h = function (e) { if (e.key === 'Escape') setPanelBk(null); }; document.addEventListener('keydown', h); return function () { document.removeEventListener('keydown', h); }; }, []);
  useEffect(function () { var h = function (e) { if (panelBk && panelRef.current && !panelRef.current.contains(e.target)) setPanelBk(null); }; document.addEventListener('mousedown', h); return function () { document.removeEventListener('mousedown', h); }; }, [panelBk]);

  var mapped = useMemo(function () {
    return (liveBookings || []).map(function (b) {
      var date = parseServiceDate(b.service_date); var cn = String(b.coffin_name || '').toLowerCase(); var c = null; var cA = liveCoffins || [];
      for (var i = 0; i < cA.length; i++) { if (String(cA[i].coffin_id || cA[i].id) == b.coffin_id) { c = cA[i]; break; } }
      if (!c && cn) { for (var j = 0; j < cA.length; j++) { if (cA[j].name && String(cA[j].name).toLowerCase() === cn) { c = cA[j]; break; } } }
      return { id: b.id, clientName: b.client_name || '\u2014', deceasedName: b.deceased_name || '', phone: b.client_phone || b.phone || '', coffinType: (c && c.name) || b.coffin_name || '\u2014', date: date || new Date(), time: b.service_time || extractTime(b.service_date), status: mapStatus(b.status), price: Number(b.coffin_price || b.price || (c ? c.exact_price || c.price : 0) || 0), paid: !!b.paid, notes: b.notes || '', pendingTransfer: !!b.pending_transfer, transferReservation: !!b.pending_transfer || !!b.source_request_id, transferStatus: b.transfer_status || (b.source_request_id ? 'delivered' : ''), sourceRequestId: b.source_request_id || '' };
    }).sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
  }, [liveBookings, liveCoffins]);

  /* Calendar dots — keep a dedicated transfer marker so a requested coffin is
     impossible to miss even while the synthetic reservation is pending. */
  var perDayDots = useMemo(function () {
    var m = {};
    mapped.forEach(function (b) {
      var k = format(b.date, 'yyyy-MM-dd');
      if (!m[k]) m[k] = [];
      var c = (ST[b.status] || ST.pending).bar;
      var existing = m[k].find(function (dot) { return dot.color === c; });
      if (existing) existing.transfer = existing.transfer || b.transferReservation;
      else m[k].push({ color: c, transfer: !!b.transferReservation });
    });
    return m;
  }, [mapped]);

  var visible = useMemo(function () {
    var result = mapped;
    // Month view follows the URL-driven visible month, NOT `sel` — `sel` is a
    // day/week cursor and drifts independently, which used to blank the grid.
    if (clickedDay && view !== 'full') { result = result.filter(function (b) { return isSameDay(b.date, clickedDay); }); }
    else { result = result.filter(function (b) { if (view === 'day') return isSameDay(b.date, sel); if (view === 'week') return isSameWeek(b.date, sel, { weekStartsOn: 1 }); return isSameMonth(b.date, visibleMonthDate); }); }
    if (activeFilters.length > 0) { result = result.filter(function (b) { return activeFilters.indexOf(b.status) !== -1; }); }
    if (searchQuery) { var q = searchQuery.toLowerCase(); result = result.filter(function (b) { return (b.clientName || '').toLowerCase().indexOf(q) !== -1 || (b.deceasedName || '').toLowerCase().indexOf(q) !== -1 || (b.coffinType || '').toLowerCase().indexOf(q) !== -1 || (b.phone || '').indexOf(q) !== -1; }); }
    return result;
  }, [view, sel, mapped, clickedDay, activeFilters, searchQuery, visibleMonthDate]);

  // Stats describe the month on screen. They previously counted the CURRENT
  // month while the grid showed the selected one, so paging away made every
  // card read 0 even with bookings on screen.
  var stats = useMemo(function () {
    var month = mapped.filter(function (b) { return isSameMonth(b.date, visibleMonthDate); });
    return { total: month.length, pending: month.filter(function (b) { return b.status === 'pending'; }).length, revenue: month.filter(function (b) { return b.status === 'completed'; }).reduce(function (s, b) { return s + b.price; }, 0), today: mapped.filter(function (b) { return isToday(b.date); }).length };
  }, [mapped, visibleMonthDate]);

  var byType = useMemo(function () {
    var counts = {}; mapped.forEach(function (b) { var k = b.coffinType || 'Other'; counts[k] = (counts[k] || 0) + 1; });
    return Object.keys(counts).map(function (k) { var short = k.length > 14 ? k.slice(0, 14) + '\u2026' : k; return { name: short, full: k, value: counts[k] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
  }, [mapped]);

  var zeroCounts = function () { var o = {}; STORD.forEach(function (s) { o[s] = 0; }); return o; };
  var statusData = useMemo(function () { var counts = zeroCounts(); mapped.forEach(function (b) { counts[b.status] = (counts[b.status] || 0) + 1; }); return STORD.map(function (s) { return { key: s, label: ST[s].label, value: counts[s], color: ST[s].bar }; }); }, [mapped]);
  var filterCounts = useMemo(function () { var counts = zeroCounts(); mapped.forEach(function (b) { counts[b.status] = (counts[b.status] || 0) + 1; }); return counts; }, [mapped]);

  useEffect(function () { setCalMonth(visibleMonthDate); }, [visibleMonthDate]);
  var miniCalDays = useMemo(function () {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(calMonth), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(calMonth), { weekStartsOn: 1 }),
    });
  }, [calMonth]);

  // Paging the calendar drives `viewMonth`/`viewYear`, which drives monthRange
  // and therefore the fetch. `sel` still tracks the day/week cursor.
  // Paging keeps the FETCHED month in step with the cursor: day/week move the
  // cursor first and then the URL — and therefore monthRange — follows it.
  // Month view just pages the month itself; goToMonth normalises the wrap.
  function navigate(dir) {
    setClickedDay(null);
    if (view === 'day') { var nd = addDays(sel, dir); setSel(nd); goToMonth(nd.getMonth(), nd.getFullYear()); return; }
    if (view === 'week') { var nw = dir === 1 ? addWeeks(sel, 1) : subWeeks(sel, 1); setSel(nw); goToMonth(nw.getMonth(), nw.getFullYear()); return; }
    goToMonth(viewMonth + dir, viewYear);
  }
  function doRefresh() { setRefreshing(true); fetchLive().finally(function () { setRefreshing(false); showToast('Refreshed'); }); }

  function markAsPaid() {
    if (!panelBk || panelBk.paid) return; setMarkingPaid(true); var id = panelBk.id;
    api.patch('/coffins/bookings/' + id + '/status', { paid: true }).catch(function () { return api.put('/coffins/orders/' + id, { paid: true }); }).catch(function () { return api.patch('/coffins/orders/' + id + '/status', { paid: true }); }).finally(function () {
      setLiveBookings(function (prev) { return prev.map(function (b) { if (String(b.id) === String(id)) return Object.assign({}, b, { paid: true }); return b; }); });
      setPanelBk(function (prev) { if (!prev) return null; return Object.assign({}, prev, { paid: true }); }); setMarkingPaid(false); showToast('Marked as paid');
    });
  }

  function onFullCalendarDayClick(day) {
    if (clickedDay && isSameDay(day, clickedDay)) { setClickedDay(null); return; }
    if (!isSameMonth(day, visibleMonthDate)) goToMonth(day.getMonth(), day.getFullYear());
    setClickedDay(day); setSel(day);
  }
  function miniCalNav(dir) { goToMonth(calMonth.getMonth() + dir, calMonth.getFullYear()); }
  function onMiniCalDayClick(day) {
    if (clickedDay && isSameDay(day, clickedDay)) { setClickedDay(null); return; }
    if (!isSameMonth(day, visibleMonthDate)) goToMonth(day.getMonth(), day.getFullYear());
    setClickedDay(day); setSel(day);
  }
  function toggleFilter(status) { setActiveFilters(function (prev) { if (prev.indexOf(status) !== -1) return prev.filter(function (s) { return s !== status; }); return prev.concat([status]); }); if (view !== 'full') setClickedDay(null); }
  function goToday() { var now = new Date(); setSel(now); setClickedDay(null); goToMonth(now.getMonth(), now.getFullYear()); }

  if (liveError && (!liveBookings || liveBookings.length === 0)) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, color: TX2, fontFamily: FONT, flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 13 }}>{liveError}</span>
        <button onClick={fetchLive} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid ' + BRD, background: CARD, color: TX, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  /* The nav arrows step by whatever the CURRENT view pages by, so their labels
     must follow the view too. They used to say "Previous month" in every mode,
     which misdescribed the day and week grids. */
  var navUnit = view === 'day' ? 'day' : view === 'week' ? 'week' : 'month';

  /* Stat cards — colored backgrounds */
  var statItems = [
    { l: 'This Month', v: stats.total,       ic: IC.cal, bg: '#0284c7' },
    { l: 'Pending',    v: stats.pending,     ic: IC.al,  bg: '#dc2626' },
    { l: 'Revenue',    v: money(stats.revenue), ic: IC.dl, bg: '#16a34a' },
    { l: 'Today',      v: stats.today,       ic: IC.tr,  bg: '#0f766e' },
  ];
  var barColors = ['#0f766e', '#0891b2', '#16a34a', '#475569', '#dc2626'];

  var css = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    '::-webkit-scrollbar{width:5px;height:4px}',
    '::-webkit-scrollbar-track{background:transparent}',
    '::-webkit-scrollbar-thumb{background:' + BRD + ';border-radius:4px}',
    '@keyframes cbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}',
    '@keyframes cbTransferPulse{0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 0 1px rgba(220,38,38,.15)}50%{opacity:.45;transform:scale(.68);box-shadow:0 0 0 4px rgba(220,38,38,.18)}}',
    '@keyframes cbTIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes cbTOut{to{opacity:0;transform:translateY(8px)}}',
    '@keyframes cbPanelIn{from{transform:translateX(100%)}to{transform:translateX(0)}}',
    '@keyframes cbOvIn{from{opacity:0}to{opacity:1}}',
    '@keyframes cellIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}',

    '.cb-side{width:300px;background:' + CARD + ';border-right:1px solid ' + BRD + ';display:flex;flex-direction:column;flex-shrink:0;z-index:20;min-height:0;overflow-y:hidden}',
    '.cb-side-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column}',

    '.cb-mc{padding:14px 20px 12px;border-bottom:1px solid ' + BRDL + '}',
    '.cb-mc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
    '.cb-mc-title{font-size:13px;font-weight:700;color:' + TX + '}',
    '.cb-mc-nav{display:flex;gap:2px}',
    '.cb-mc-nav button{width:26px;height:26px;border:1px solid ' + BRD + ';background:' + CARD + ';color:' + TX3 + ';border-radius:6px;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;transition:all .12s}',
    '.cb-mc-nav button:hover{border-color:' + ACC + ';color:' + ACC + '}',
    '.cb-mc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;text-align:center}',
    '.cb-mc-dow{font-size:9px;font-weight:700;color:' + TX4 + ';text-transform:uppercase;letter-spacing:.8px;padding:5px 0}',
    '.cb-mc-day{font-size:11px;font-weight:500;color:' + TX2 + ';width:32px;height:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto;border-radius:50%;cursor:pointer;transition:all .12s;position:relative}',
    '.cb-mc-day:hover{background:' + BG + '}',
    '.cb-mc-day.other{opacity:.15;pointer-events:none}',
    '.cb-mc-day.today{font-weight:800;color:' + ACC + ';background:' + ACCLT + '}',
    '.cb-mc-day.selected{background:' + ACC + ';color:#fff;font-weight:700}',
    '.cb-cal-dots{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);display:flex;gap:1.5px}',
    '.cb-cal-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0}',
    '.cb-cal-dot.transfer{width:9px;height:9px;margin-top:-3px;z-index:2;animation:cbTransferPulse 1.35s ease-in-out infinite}',

    '.cb-filters{padding:10px 20px;border-bottom:1px solid ' + BRDL + ';display:flex;flex-wrap:wrap;gap:5px}',
    '.cb-fc{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;transition:all .12s;border:1.5px solid ' + BRD + ';background:' + CARD + ';color:' + TX3 + ';user-select:none}',
    '.cb-fc:hover{border-color:' + TX4 + ';color:' + TX2 + '}',
    '.cb-fc.on{border-color:' + ACC + ';background:' + CARD + ';color:' + ACC + '}',
    '.cb-fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}',
    '.cb-fc-ct{font-weight:700;font-size:9px;opacity:.6}',

    '.cb-analytics{flex:1;padding:12px 20px;display:flex;flex-direction:column;gap:12px;min-height:0}',
    '.cb-an-title{font-size:9px;font-weight:700;color:' + TX4 + ';text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;display:flex;align-items:center;gap:6px}',
    '.cb-an-card{background:' + CARD + ';border:1px solid ' + BRD + ';border-radius:12px;padding:14px}',
    '.cb-an-legend{display:flex;flex-direction:column;gap:6px}',
    '.cb-an-leg{display:flex;align-items:center;gap:7px}',
    '.cb-an-leg-dot{width:8px;height:8px;border-radius:3px;flex-shrink:0}',
    '.cb-an-leg-label{font-size:11px;color:' + TX2 + ';flex:1}',
    '.cb-an-leg-val{font-size:11px;font-weight:700;color:' + TX + '}',
    '.cb-an-leg-pct{font-size:9px;color:' + TX4 + ';width:32px;text-align:right}',

    '.cb-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0;background:' + CARD + ';position:relative;overflow:hidden}',

    '.cb-tb{display:flex;align-items:center;justify-content:space-between;padding:10px 24px;border-bottom:1px solid ' + BRD + ';background:' + CARD + ';flex-shrink:0;gap:12px;min-height:52px}',
    '.cb-tb-left{display:flex;align-items:center;gap:8px}',
    '.cb-tb-nav{display:flex;gap:2px}',
    '.cb-tb-nb{width:30px;height:30px;border:1px solid ' + BRD + ';background:' + CARD + ';color:' + TX3 + ';border-radius:7px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;transition:all .12s}',
    '.cb-tb-nb:hover{border-color:' + ACC + ';color:' + ACC + '}',
    '.cb-tb-right{display:flex;align-items:center;gap:5px}',
    '.cb-divider{width:1px;height:24px;background:' + BRD + ';margin:0 4px}',
    '.cb-nav-select{height:30px;padding:0 10px;border:1px solid ' + BRD + ';border-radius:7px;background:' + CARD + ';color:' + TX + ';font-size:11px;font-weight:700;font-family:' + FONT + ';cursor:pointer;min-width:140px;outline:none}',
    '.cb-nav-select:hover{border-color:' + ACC + '}',
    '.cb-tb-btn{height:30px;padding:0 12px;border:1px solid ' + BRD + ';background:' + CARD + ';color:' + TX2 + ';border-radius:7px;cursor:pointer;font-size:11px;font-weight:600;font-family:' + FONT + ';transition:all .12s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}',
    '.cb-tb-nav{height:30px;width:30px;padding:0;border:1px solid ' + BRD + ';background:' + CARD + ';color:' + TX2 + ';border-radius:7px;cursor:pointer;font-size:11px;font-weight:600;font-family:' + FONT + ';transition:all .12s;display:inline-flex;align-items:center;justify-content:center}.cb-tb-nav:hover{background:' + ACCLT + ';border-color:' + ACCL + ';color:' + ACC + '}',
    '.cb-tb-btn:hover{border-color:' + ACC + ';color:' + ACC + '}',
    '.cb-tb-btn.sq{width:30px;padding:0;justify-content:center}',
    '.cb-tb-views{display:flex;background:' + BG + ';border:1px solid ' + BRD + ';border-radius:7px;padding:2px;gap:1px}',
    '.cb-tb-v{padding:4px 12px;border:none;background:transparent;color:' + TX3 + ';cursor:pointer;font-size:11px;font-weight:600;font-family:' + FONT + ';border-radius:5px;transition:all .15s}',
    '.cb-tb-v:hover{color:' + TX + '}',
    '.cb-tb-v.on{background:' + CARD + ';color:' + TX + ';box-shadow:' + SHS + ';font-weight:700}',
    '.cb-tb-new{height:30px;padding:0 14px;border:none;background:' + ACC + ';color:#fff;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700;font-family:' + FONT + ';transition:all .15s;box-shadow:0 2px 8px rgba(15,118,110,.25);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}',
    '.cb-tb-new:hover{background:' + ACCL + '}',

    '.cb-nav-pills{display:inline-flex;gap:2px;padding:2px;border:1px solid ' + BRD + ';border-radius:8px;background:' + BG + ';flex-shrink:0}',
    '.cb-nav-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border:none;background:transparent;color:' + TX3 + ';font-size:11px;font-weight:600;font-family:' + FONT + ';border-radius:6px;cursor:pointer;transition:all .15s;white-space:nowrap}',
    '.cb-nav-pill:hover{color:' + TX + '}',
    '.cb-nav-pill.on{background:' + CARD + ';color:' + ACC + ';box-shadow:' + SHS + ';font-weight:700}',
    '.cb-nav-badge{min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:' + DNG + ';color:#fff;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}',
    '.cb-nav-pill.on .cb-nav-badge{background:' + ACC + '}',
    '.cb-nav-select{height:30px;padding:0 10px;border:1px solid ' + BRD + ';border-radius:7px;background:' + CARD + ';color:' + TX + ';font-size:11px;font-weight:700;font-family:' + FONT + ';cursor:pointer;min-width:140px;outline:none}',
    '.cb-nav-select:hover{border-color:' + ACC + '}',
    '.cb-alt-host{flex:1;min-height:0;overflow-y:auto;background:transparent}',

    /* Colored stat cards */
    '.cb-sr{display:flex;align-items:stretch;flex-shrink:0;overflow-x:auto}',
    '.cb-sr::-webkit-scrollbar{display:none}',
    '.cb-sr-item{display:flex;align-items:center;gap:10px;padding:14px 20px;white-space:nowrap;flex-shrink:0;flex:1;min-width:0}',
    '.cb-sr-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}',
    '.cb-sr-info{display:flex;flex-direction:column;min-width:0}',
    '.cb-sr-num{font-size:20px;font-weight:800;line-height:1;color:#fff}',
    '.cb-sr-label{font-size:10px;font-weight:600;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.3px}',

    '.cb-df{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:7px 24px;background:' + ACCLT + ';border-bottom:1px solid ' + BRD + '}',
    '.cb-df span{font-size:11px;color:' + ACC + ';font-weight:600;display:flex;align-items:center;gap:6px}',
    '.cb-df button{background:none;border:none;color:' + TX3 + ';cursor:pointer;font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;transition:all .12s;font-family:' + FONT + '}',
    '.cb-df button:hover{color:' + DNG + '}',

    '.cb-lh{flex-shrink:0;display:grid;grid-template-columns:3px 1.2fr .9fr .85fr .75fr .8fr;align-items:center;padding:9px 20px 9px 0;border-bottom:1px solid ' + BRD + ';background:' + BG + '}',
    '.cb-lh>div{padding-left:10px;font-size:9px;font-weight:700;color:' + TX4 + ';text-transform:uppercase;letter-spacing:.6px}',
    '.cb-lh>div:last-child{text-align:right}',

    '.cb-r{display:grid;grid-template-columns:3px 1.2fr .9fr .85fr .75fr .8fr;align-items:center;gap:0;padding:13px 20px 13px 0;cursor:pointer;transition:all .1s;border-bottom:1px solid ' + BRDL + ';min-height:56px;animation:cellIn .15s ease both}',
    '.cb-r:hover{background:transparent}',
    '.cb-r.active{box-shadow:inset 3px 0 0 ' + ACC + '}',
    '.cb-bar{width:3px;min-height:22px;border-radius:2px;align-self:stretch}',
    '.cb-cell{padding:0 10px;overflow:hidden;min-width:0}',
    '.cb-nm{font-size:13px;font-weight:600;color:' + TX + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cb-sub{font-size:10px;color:' + TX4 + ';display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}',
    '.cb-cn{font-size:12px;color:' + TX2 + ';font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cb-mt{font-size:12px;color:' + TX2 + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cb-pr{font-size:13px;font-weight:700;color:' + TX + ';text-align:right;white-space:nowrap}',
    '.cb-paid{font-size:9px;font-weight:600;margin-top:2px;text-align:right;white-space:nowrap;display:flex;align-items:center;justify-content:flex-end;gap:4px}',
    '.cb-paid-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}',

    '.cb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:' + TX4 + ';gap:8px;padding:40px 0}',
    '.cb-empty-ico{width:44px;height:44px;border-radius:12px;background:' + BG + ';display:flex;align-items:center;justify-content:center;color:' + TX4 + '}',

    '.cb-ov{position:fixed;inset:0;background:rgba(17,24,39,.4);z-index:100;backdrop-filter:blur(4px);animation:cbOvIn .15s ease}',
    '.cb-panel{position:fixed;top:0;right:0;bottom:0;z-index:101;width:480px;max-width:92vw;background:' + CARD + ';border-left:1px solid ' + BRD + ';box-shadow:' + SHXL + ';display:flex;flex-direction:column;animation:cbPanelIn .25s cubic-bezier(.32,.72,0,1);overflow:hidden}',
    '.cb-ph{padding:20px 24px;border-bottom:1px solid ' + BRD + ';display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '.cb-ph-status{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}',
    '.cb-ph-pulse{width:6px;height:6px;border-radius:50%;animation:cbPulse 2s ease-in-out infinite}',
    '.cb-ph-close{width:32px;height:32px;border:1px solid ' + BRD + ';background:' + CARD + ';color:' + TX3 + ';border-radius:8px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .12s}',
    '.cb-ph-close:hover{border-color:' + DNG + ';color:' + DNG + ';background:' + DNGL + '}',
    '.cb-pb{flex:1;overflow-y:auto;padding:20px 24px}',
    '.cb-pb::-webkit-scrollbar{width:3px}',
    '.cb-pb::-webkit-scrollbar-thumb{background:' + BRD + ';border-radius:3px}',
    '.cb-pb-client{font-size:20px;font-weight:800;color:' + TX + ';line-height:1.2;margin-bottom:2px}',
    '.cb-pb-code{font-size:11px;font-weight:600;color:' + TX3 + ';letter-spacing:.5px;margin-bottom:24px}',
    '.cb-pb-sec{margin-bottom:24px}',
    '.cb-pb-sec-t{font-size:9px;font-weight:700;color:' + TX4 + ';text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid ' + BRDL + '}',
    '.cb-pb-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.cb-pb-card{padding:12px;background:' + BG + ';border:1px solid ' + BRDL + ';border-radius:10px}',
    '.cb-pb-card.wide{grid-column:1/-1}',
    '.cb-pb-card-l{font-size:9px;font-weight:700;color:' + TX4 + ';text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}',
    '.cb-pb-card-v{font-size:13px;font-weight:600;color:' + TX + '}',
    '.cb-pb-card-v.hl{font-size:18px;font-weight:800;color:' + TX + '}',

    '.cb-pf{padding:14px 24px;border-top:1px solid ' + BRD + ';background:' + BG + ';display:flex;gap:8px;flex-shrink:0}',
    '.cb-pbtn{flex:1;padding:10px 0;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s;text-align:center;border:none;display:flex;align-items:center;justify-content:center;gap:6px;font-family:' + FONT + '}',
    '.cb-pbtn.primary{background:' + ACC + ';color:#fff}',
    '.cb-pbtn.primary:hover{background:' + ACCL + '}',
    '.cb-pbtn.paid{background:' + SUC + ';color:#fff}',
    '.cb-pbtn.paid:disabled{background:' + TX4 + ';cursor:not-allowed;opacity:.5}',
    '.cb-pbtn.ghost{background:' + CARD + ';color:' + TX3 + ';border:1px solid ' + BRD + '}',
    '.cb-pbtn.ghost:hover{color:' + TX + ';border-color:' + TX4 + '}',

    '.cb-te{position:fixed;bottom:24px;right:24px;padding:11px 18px;background:' + TX + ';color:#fff;border-radius:10px;box-shadow:' + SHXL + ';font-size:12px;font-weight:600;display:flex;align-items:center;gap:9px;z-index:2000;animation:cbTIn .2s ease}',
    '.cb-te.out{animation:cbTOut .15s ease forwards}',

    '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}',
    '@media(max-width:1100px){.cb-side{width:260px}.cb-sr-item{padding:10px 14px}}',
    '@media(max-width:860px){.cb-side{display:none}.cb-tb{padding:8px 16px}.cb-panel{width:100%;max-width:100%}.cb-sr-item{padding:10px 14px}.cb-sr-ico{width:30px;height:30px}.cb-sr-num{font-size:16px}}',
    '@media(max-width:640px){.cb-tb{flex-wrap:wrap;gap:6px}.cb-tb-left{flex-wrap:wrap}.cb-tb-right{flex-wrap:wrap;justify-content:flex-end}.cb-tb-btn,.cb-tb-new,.cb-nav-pill{flex:1 1 100%;white-space:normal;text-align:center}.cb-nav-select{width:100%;min-width:120px}.cb-divider{display:none}.cb-r{grid-template-columns:3px 1fr 1fr}.cb-r .cb-cell:nth-child(n+5){display:none}.cb-lh{display:none}}',
  ].join('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: BG, color: TX, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header className="cb-topbar">
        <div className="cb-topbar-brand">
          <div className="cb-topbar-mark">C</div>
          <div className="cb-topbar-title">CoffinBook<span className="sub">Reservations</span></div>
        </div>
        {onNewReservation && (
          <button className="cb-btn-primary" onClick={onNewReservation}>
            {IC.pl} New Reservation
          </button>
        )}
      </header>

      {/* Toolbar */}
      <div className="cb-tb">
        <div className="cb-tb-left">
          {effTabs && effTabs.length > 0 && (
            <div className="cb-nav-pills">
              {effTabs.map(function (t) {
                return (
                  <button key={t.key} className={'cb-nav-pill' + (effActive === t.key ? ' on' : '')} onClick={function () { if (onNavChange) onNavChange(t.key); else if (selfNav) setAltView(t.key === 'bookings' ? null : t.key); }}>
                    <i className={'fa-solid ' + t.icon} />
                    {t.label}
                    {!!t.badge && t.badge > 0 && <span className="cb-nav-badge">{t.badge}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="cb-tb-right">
          {branchSelector && (
            <select className="cb-nav-select" value={branchSelector.value} onChange={branchSelector.onChange} title="Branch">
              {branchSelector.options.map(function (o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
            </select>
          )}
          {branchSelector && <div className="cb-divider" />}
          {headerActions}
          {!showAltSection && (
            <React.Fragment>
              <button className="cb-tb-nav" onClick={function () { navigate(-1); }} title={'Previous ' + navUnit} aria-label={'Previous ' + navUnit}>{IC.cl}</button>
              <button className="cb-tb-nav" onClick={function () { navigate(1); }} title={'Next ' + navUnit} aria-label={'Next ' + navUnit}>{IC.cr}</button>
              <button className="cb-tb-btn" onClick={goToday}>Today</button>
              <div className="cb-tb-views">
                {['full', 'day', 'week', 'month'].map(function (v) { return <button key={v} className={'cb-tb-v' + (view === v ? ' on' : '')} onClick={function () { setView(v); setClickedDay(null); }}>{v === 'full' ? 'Full' : v}</button>; })}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {showAltSection ? (
        <div className="cb-alt-host">{altContent}</div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
          {/* Sidebar */}
          {view !== 'full' && <aside className="cb-side">
            <div className="cb-side-scroll">
              {/* Calendar with colored dots */}
              <div className="cb-mc">
                <div className="cb-mc-head">
                  <span className="cb-mc-title">{format(calMonth, 'MMMM yyyy')}</span>
                  <div className="cb-mc-nav">
                    <button onClick={function () { miniCalNav(-1); }}>{IC.cl}</button>
                    <button onClick={function () { miniCalNav(1); }}>{IC.cr}</button>
                  </div>
                </div>
                <div className="cb-mc-grid">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (d) { return <div key={d} className="cb-mc-dow">{d}</div>; })}
                  {miniCalDays.map(function (day) {
                    var k = format(day, 'yyyy-MM-dd');
                    var dayDots = perDayDots[k];
                    var hasEv = dayDots && dayDots.length > 0;
                    var isSel = clickedDay && isSameDay(day, clickedDay);
                    var isTd = isToday(day);
                    var isCur = isSameMonth(day, calMonth);
                    var cls = 'cb-mc-day' + (isSel ? ' selected' : '') + (!isSel && isTd ? ' today' : '') + (!isCur ? ' other' : '');
                    return (
                      <div key={k} className={cls} onClick={function () { onMiniCalDayClick(day); }}>
                        {format(day, 'd')}
                        {hasEv && (
                          <span className="cb-cal-dots">
                            {dayDots.slice(0, 3).map(function (dot, i) {
                              return <span key={i} className={'cb-cal-dot' + (dot.transfer ? ' transfer' : '')} style={{ background: isSel ? 'rgba(255,255,255,.9)' : dot.color }} title={dot.transfer ? 'Coffin transfer requested' : undefined} />;
                            })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cb-filters">
                {STORD.map(function (s) {
                  var isActive = activeFilters.indexOf(s) !== -1;
                  return (
                    <div key={s} className={'cb-fc' + (isActive ? ' on' : '')} onClick={function () { toggleFilter(s); }}>
                      <span className="cb-fc-dot" style={{ background: ST[s].color }} />
                      {ST[s].label}
                      <span className="cb-fc-ct">{filterCounts[s]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="cb-analytics">
                <div className="cb-an-title">{IC.grid} Analytics</div>
                <div className="cb-an-card">
                  <div className="cb-an-title" style={{ marginBottom: 8 }}>Status Breakdown</div>
                  {statusData.some(function (d) { return d.value > 0; }) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusData.filter(function (d) { return d.value > 0; })} cx="50%" cy="50%" innerRadius={30} outerRadius={44} paddingAngle={2} dataKey="value" stroke="none">
                              {statusData.filter(function (d) { return d.value > 0; }).map(function (d, i) { return <Cell key={i} fill={d.color} />; })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="cb-an-legend" style={{ flex: 1 }}>
                        {statusData.map(function (d) {
                          var pct = mapped.length > 0 ? Math.round((d.value / mapped.length) * 100) : 0;
                          return (
                            <div key={d.key} className="cb-an-leg">
                              <span className="cb-an-leg-dot" style={{ background: d.color }} />
                              <span className="cb-an-leg-label">{d.label}</span>
                              <span className="cb-an-leg-val">{d.value}</span>
                              <span className="cb-an-leg-pct">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : <div style={{ padding: '16px 0', textAlign: 'center', color: TX4, fontSize: 11 }}>No data yet</div>}
                </div>

                <div className="cb-an-card">
                  <div className="cb-an-title" style={{ marginBottom: 8 }}>Top Coffin Types</div>
                  {byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(byType.length * 28, 80)}>
                      <BarChart data={byType} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fill: TX2, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,.03)' }} />
                        <Bar dataKey="value" name="Bookings" radius={[0, 4, 4, 0]} maxBarSize={16}>
                          {byType.map(function (_, i) { return <Cell key={i} fill={barColors[i % barColors.length]} />; })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ padding: '16px 0', textAlign: 'center', color: TX4, fontSize: 11 }}>No data yet</div>}
                </div>

                <div className="cb-an-card">
                  <div className="cb-an-title" style={{ marginBottom: 6 }}>Monthly Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: TX, letterSpacing: '-.5px' }}>{money(stats.revenue)}</div>
                  <div style={{ fontSize: 10, color: TX4, fontWeight: 500, marginTop: 2 }}>From {stats.total} completed bookings</div>
                </div>
              </div>
            </div>
          </aside>}

          {/* Main list */}
          <main className="cb-main">
            {/* Colored stat cards */}
            <div className="cb-sr">
              {statItems.map(function (si, i) {
                return (
                  <div key={i} className="cb-sr-item" style={{ background: si.bg }}>
                    <div className="cb-sr-ico" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>{si.ic}</div>
                    <div className="cb-sr-info">
                      <div className="cb-sr-num">{si.v}</div>
                      <div className="cb-sr-label">{si.l}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {view === 'full' && (
              <div className="cb-full-controls">
                <div className="cb-full-heading">
                  <div>
                    <h1>{format(visibleMonthDate, 'MMMM yyyy')}</h1>
                    <span>{stats.total} reservation{stats.total !== 1 ? 's' : ''} this month</span>
                  </div>
                  <label className="cb-search">
                    {IC.search}
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={function (event) { setSearchQuery(event.target.value); }}
                      placeholder="Search bookings..."
                      aria-label="Search bookings"
                    />
                  </label>
                </div>
                <div className="cb-filter-chips" aria-label="Filter reservations by status">
                  {STORD.map(function (s) {
                    var isActive = activeFilters.indexOf(s) !== -1;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={'cb-fc' + (isActive ? ' on' : '')}
                        onClick={function () { toggleFilter(s); }}
                        aria-pressed={isActive}
                      >
                        <span className="cb-fc-dot" style={{ background: ST[s].color }} />
                        {ST[s].label}
                        <span className="cb-fc-ct">{filterCounts[s]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {clickedDay && view !== 'full' && (
              <div className="cb-df">
                <span>{IC.cal} Showing: {format(clickedDay, 'MMM d, yyyy')} &mdash; {visible.length} booking{visible.length !== 1 ? 's' : ''}</span>
                <button onClick={function () { setClickedDay(null); }}>Clear {IC.x}</button>
              </div>
            )}

            {/* DAY / WEEK render a real calendar grid; MONTH keeps the table.
                Previously all three rendered this same table and only the
                filter changed, so clicking "week" gave a list rather than the
                week laid out day by day. */}
            {view === 'full' ? (
              <ReservationMonthGrid
                visibleMonthDate={visibleMonthDate}
                visible={visible}
                clickedDay={clickedDay}
                onDayClick={onFullCalendarDayClick}
                onPick={function (booking) { setPanelBk(booking); }}
              />
            ) : (view === 'day' || view === 'week') ? (
              <CoffinCalendarGrid
                view={view}
                date={sel}
                bookings={visible}
                onPick={function (b) { setPanelBk(b); }}
                onPickDay={function (d) {
                  setSel(d);
                  setClickedDay(null);
                  goToMonth(d.getMonth(), d.getFullYear());
                }}
              />
            ) : (
              <React.Fragment>
            <div className="cb-lh">
              <div />
              {['Client', 'Coffin', 'Schedule', 'Status', 'Amount'].map(function (h, i) {
                return <div key={h} style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>;
              })}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {visible.length === 0 ? (
                <div className="cb-empty">
                  <div className="cb-empty-ico">{IC.cal}</div>
                  <span style={{ fontSize: 12 }}>{clickedDay ? 'No bookings for ' + format(clickedDay, 'MMM d, yyyy') : 'No bookings for this period'}</span>
                </div>
              ) : visible.map(function (b) {
                var cf = ST[b.status] || ST.pending;
                var isActive = panelBk && panelBk.id === b.id;
                return (
                  <div key={b.id} className={'cb-r' + (isActive ? ' active' : '')} onClick={function () { setPanelBk(b); }}>
                    <div className="cb-bar" style={{ background: cf.bar }} />
                    <div className="cb-cell">
                      <div className="cb-nm">{b.clientName}</div>
                      {b.deceasedName && <div className="cb-sub"><span>{IC.us}</span>{b.deceasedName}</div>}
                    </div>
                    <div className="cb-cell">
                      <div className="cb-cn">{b.coffinType}</div>
                      <div className="cb-sub"><span>{IC.ph}</span>{b.phone || '\u2014'}</div>
                    </div>
                    <div className="cb-cell">
                      <div className="cb-mt">{format(b.date, 'MMM d, yyyy')}</div>
                      <div className="cb-sub"><span>{IC.clock}</span>{b.time || '\u2014'}</div>
                    </div>
                    <div className="cb-cell" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cf.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: cf.color, whiteSpace: 'nowrap' }}>{cf.label}</span>
                    </div>
                    <div className="cb-cell" style={{ textAlign: 'right' }}>
                      <div className="cb-pr">{money(b.price)}</div>
                      <div className="cb-paid" style={{ color: b.paid ? SUC : TX4 }}>
                        <span className="cb-paid-dot" style={{ background: b.paid ? SUC : '#d1d5db' }} />
                        {b.paid ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
              </React.Fragment>
            )}
          </main>
        </div>
      )}

      {/* Detail panel */}
      {panelBk && (
        <React.Fragment>
          <div className="cb-ov" onClick={function () { setPanelBk(null); }} />
          <div className="cb-panel" ref={panelRef}>
            <div className="cb-ph">
              <div className="cb-ph-status" style={{ color: (ST[panelBk.status] || ST.pending).color }}>
                <span className="cb-ph-pulse" style={{ background: (ST[panelBk.status] || ST.pending).color }} />
                {(ST[panelBk.status] || ST.pending).label}
              </div>
              <button className="cb-ph-close" onClick={function () { setPanelBk(null); }}>{IC.x}</button>
            </div>
            <div className="cb-pb">
              <div className="cb-pb-client">{panelBk.clientName}</div>
              <div className="cb-pb-code">{IC.dl} Booking #{panelBk.id}
                {panelBk.pendingTransfer && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10, padding: '2px 9px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', verticalAlign: 'middle' }}>
                    {panelBk.transferStatus === 'approved' ? 'Transfer Approved \u2014 In Transit' : 'Transfer Awaiting Approval'}
                  </span>
                )}
              </div>
              <div className="cb-pb-sec">
                <div className="cb-pb-sec-t">Details</div>
                <div className="cb-pb-grid">
                  <div className="cb-pb-card"><div className="cb-pb-card-l">Phone</div><div className="cb-pb-card-v">{panelBk.phone || '\u2014'}</div></div>
                  <div className="cb-pb-card"><div className="cb-pb-card-l">Payment</div><div className="cb-pb-card-v" style={{ color: panelBk.paid ? SUC : DNG, fontWeight: 700 }}>{panelBk.paid ? 'Paid' : 'Unpaid'}</div></div>
                  <div className="cb-pb-card"><div className="cb-pb-card-l">Coffin</div><div className="cb-pb-card-v" style={{ fontSize: 12 }}>{panelBk.coffinType}</div></div>
                  <div className="cb-pb-card"><div className="cb-pb-card-l">Schedule</div><div className="cb-pb-card-v" style={{ fontSize: 12 }}>{format(panelBk.date, 'MMM d, yyyy')} {panelBk.time || ''}</div></div>
                  <div className="cb-pb-card wide"><div className="cb-pb-card-l">Amount</div><div className="cb-pb-card-v hl">{money(panelBk.price)}</div></div>
                  {panelBk.deceasedName && <div className="cb-pb-card wide"><div className="cb-pb-card-l">Deceased</div><div className="cb-pb-card-v">{panelBk.deceasedName}</div></div>}
                  {panelBk.notes && <div className="cb-pb-card wide"><div className="cb-pb-card-l">Notes</div><div className="cb-pb-card-v" style={{ fontSize: 12, color: TX2 }}>{panelBk.notes}</div></div>}
                </div>
              </div>
            </div>
            <div className="cb-pf">
              {!panelBk.paid ? (
                <button className="cb-pbtn primary" onClick={markAsPaid} disabled={markingPaid || panelBk.pendingTransfer} title={panelBk.pendingTransfer ? 'Complete the transfer delivery first' : undefined} style={{ opacity: markingPaid || panelBk.pendingTransfer ? 0.5 : 1 }}>{markingPaid ? 'Processing...' : IC.ck} Mark as Paid</button>
              ) : (
                <button className="cb-pbtn paid" disabled>{IC.ck} Payment Received</button>
              )}
              <button className="cb-pbtn ghost" onClick={function () { setPanelBk(null); }}>Close</button>
            </div>
          </div>
        </React.Fragment>
      )}

      {toastMsg && <div className={'cb-te' + (toastOut ? ' out' : '')}>{IC.ck}{toastMsg}</div>}
    </div>
  );
}
