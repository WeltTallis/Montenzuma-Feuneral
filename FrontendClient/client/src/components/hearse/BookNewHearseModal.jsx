import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';
import { X, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

// Hearse statuses that are never bookable, whatever the date.
// Module-level ON PURPOSE: this array is a dependency of the memoised
// availability loader below. As a component-local `const` it was a brand new
// array on every render, so the useCallback identity changed on every render and
// the loader effect re-ran continuously — each pass firing another burst of
// availability requests (the "too many requests" symptom).
const EXCLUDED = ['maintenance', 'out_of_service', 'disabled'];

/* ─── the reference design's palette, verbatim ─── */
const C = {
  primary: '#1a5f7a', primarySoft: '#e6f1f5', primaryHover: '#155067',
  bg: '#f8fafc', text: '#111827', muted: '#94a3b8', muted2: '#64748b',
  line: '#e5e7eb', ok: '#059669', bad: '#dc2626',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateStr = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const pad = (n) => String(n).padStart(2, '0');
const fmtDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

const getTenantSlug = () => {
  const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
  if (direct && direct !== 'default' && direct !== 'dashboard' && direct !== 'undefined' && direct !== 'null') return direct;
  const parent = localStorage.getItem('parentTenantSlug');
  if (parent && parent !== 'default' && parent !== 'dashboard' && parent !== 'undefined' && parent !== 'null') return parent;
  try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.parentTenantSlug || u.tenantSlug || u.tenant?.slug || ''; } catch { return ''; }
};

// Resolve the TENANT-level id (never branch-scoped) — hearses & bookings are
// stored in one shared operations DB and must be scoped by tenant id so all
// branches of a multi-branch tenant share one fleet & one booking list.
const resolveTenantId = () => {
  const direct = localStorage.getItem('tenantId');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const fromUser = u.tenantId || u.tenant_id || u.tenant?.id || u.tenant?.tenantId;
    if (fromUser) return String(fromUser);
  } catch { /* ignore */ }
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload?.tenantId) return String(payload.tenantId);
  } catch { /* ignore */ }
  return null;
};

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
  const h = { 'x-tenant-slug': getTenantSlug() };
  const tenantId = resolveTenantId();
  if (tenantId) h['x-tenant-id'] = tenantId;
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const getLocalUserName = () => {
  try { const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); return u?.full_name || u?.username || u?.name || u?.email || ''; } catch { return ''; }
};
const safeUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

/* ══════════════════════════ STYLES — mirrors the reference HTML 1:1 ══════════════════════════ */
const pulse = keyframes`0%,100%{opacity:.4}50%{opacity:1}`;
const rot = keyframes`to{transform:rotate(360deg)}`;

const Scrim = styled.div`
  position:fixed;inset:0;z-index:6000;background:rgba(15,23,42,.45);
  opacity:${p => (p.$open ? 1 : 0)};pointer-events:${p => (p.$open ? 'auto' : 'none')};
  transition:opacity .3s ease;
`;
const Panel = styled.aside`
  position:fixed;top:0;right:0;bottom:0;z-index:6100;width:min(440px,100vw);background:#fff;
  display:flex;flex-direction:column;box-shadow:-30px 0 80px rgba(2,12,27,.35);
  transform:translateX(${p => (p.$open ? '0' : '103%')});
  visibility:${p => (p.$open ? 'visible' : 'hidden')};
  transition:transform .38s cubic-bezier(.32,.72,0,1),visibility 0s linear ${p => (p.$open ? '0s' : '.38s')};
  font-family:'Inter',system-ui,sans-serif;color:${C.text};
`;
const PHead = styled.header`
  flex-shrink:0;display:flex;align-items:center;gap:.8rem;padding:1rem 1.2rem;background:${C.primary};color:#fff;
`;
const HeadTxt = styled.div`flex:1;min-width:0;
  h1{font-size:.98rem;font-weight:800;margin:0;letter-spacing:-.01em}
  p{font-size:.7rem;opacity:.75;margin:.15rem 0 0;font-weight:500}
`;
const XBtn = styled.button`
  width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.15);color:#fff;
  cursor:pointer;transition:.15s;display:grid;place-items:center;flex-shrink:0;
  &:hover{background:rgba(255,255,255,.3)}
`;
const PBody = styled.div`
  flex:1;overflow-y:auto;padding:1rem 1.2rem 1.2rem;
  &::-webkit-scrollbar{width:8px}
  &::-webkit-scrollbar-thumb{background:#dbe3ec;border-radius:8px;border:2px solid #fff}
`;
const Sec = styled.section`
  padding:1rem 0;
  & + &{border-top:1px solid ${C.line}}
  &:first-child{padding-top:.2rem}
`;
const SecT = styled.div`
  display:flex;align-items:baseline;justify-content:space-between;margin-bottom:.6rem;
  h2{font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${C.muted2};margin:0}
  h2 i{font-style:normal;color:${C.primary};margin-right:.35rem}
  small{font-size:.68rem;color:${C.muted};font-weight:600}
`;

/* ── calendar: always open ── */
const CalTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;
  b{font-size:.85rem;font-weight:800}`;
const CalNav = styled.div`display:flex;gap:.35rem`;
const NavBtn = styled.button`
  width:28px;height:28px;border:1px solid ${C.line};border-radius:8px;background:#fff;cursor:pointer;
  color:${C.muted2};display:grid;place-items:center;transition:.15s;
  &:hover{border-color:${C.primary};color:${C.primary}}
`;
const CalGrid = styled.div`display:grid;grid-template-columns:repeat(7,1fr);gap:3px`;
const Wd = styled.span`text-align:center;font-size:.58rem;font-weight:700;color:${C.muted};text-transform:uppercase;padding:.25rem 0`;
const Day = styled.button`
  aspect-ratio:1;display:grid;place-items:center;font-size:.78rem;font-weight:600;border:none;border-radius:8px;
  background:transparent;color:${C.text};cursor:pointer;transition:.12s;padding:0;font-family:inherit;
  ${p => p.$sel
    ? `background:${C.primary};color:#fff;font-weight:800;`
    : p.$past
      ? `color:#cbd5e1;cursor:not-allowed;text-decoration:line-through;`
      : p.$today
        ? `box-shadow:inset 0 0 0 1.5px ${C.ok};color:${C.ok};`
        : `&:hover{background:#eaf4fa;}`}
`;
const SelLine = styled.div`display:flex;align-items:center;justify-content:space-between;margin-top:.65rem;min-height:1rem;gap:.5rem`;
const SelTxt = styled.span`font-size:.72rem;font-weight:600;color:${C.muted2};${p => (p.$has ? `color:${C.primary};` : '')}`;
const ClearBtn = styled.button`background:none;border:none;font-size:.7rem;font-weight:700;color:${C.bad};cursor:pointer;padding:2px 4px;flex-shrink:0`;

/* ── fleet: clean rows, dot status, no pills ── */
const HRow = styled.button`
  display:flex;align-items:center;gap:.6rem;width:100%;text-align:left;padding:.55rem .65rem;
  border:1.5px solid ${C.line};border-radius:11px;background:#fff;cursor:pointer;transition:.15s;font-family:inherit;
  & + &{margin-top:.45rem}
  ${p => (p.$sel ? `border-color:${C.primary};background:#f0f9ff;` : '')}
  ${p => (p.$off ? 'opacity:.55;cursor:not-allowed;' : '')}
  ${p => (p.$dim ? 'pointer-events:none;' : '')}
  ${p => (!p.$off && !p.$sel ? `&:hover{border-color:${C.primary};}` : '')}
`;
const Ava = styled.span`
  width:34px;height:34px;border-radius:9px;background:${C.primarySoft};color:${C.primary};
  font-weight:800;font-size:.9rem;display:grid;place-items:center;flex-shrink:0;
`;
const HInfo = styled.span`flex:1;min-width:0;
  b{display:block;font-size:.8rem;font-weight:700;color:${C.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  small{display:block;font-size:.67rem;color:${C.muted2};margin-top:.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
const St = styled.span`display:flex;align-items:center;gap:.35rem;flex-shrink:0;
  em{font-style:normal;font-size:.66rem;font-weight:700;color:${C.muted2}}
  em.free{color:${C.ok}}
`;
/* FIX (styled-components error #12): a keyframes object may only be interpolated
   STATICALLY in the styled template. Interpolating ${pulse} inside a function
   that returns a plain string throws "error 12" at render time. So the
   animation is declared statically here, and the dynamic part only overrides
   it with the plain-text `animation:none` when the dot is not waiting. */
const Dot = styled.span`
  width:8px;height:8px;border-radius:50%;flex-shrink:0;
  background:${p => (p.$kind === 'free' ? C.ok : p.$kind === 'busy' ? C.bad : '#cbd5e1')};
  animation:${pulse} 1s infinite;
  ${p => (p.$kind === 'wait' ? '' : 'animation:none;')}
`;
const Radio = styled.span`
  width:16px;height:16px;border-radius:50%;border:2px solid #cbd5e1;flex-shrink:0;
  display:grid;place-items:center;transition:.15s;
  &::after{content:'';width:7px;height:7px;border-radius:50%;background:${C.primary};transform:scale(0);transition:.15s}
  ${p => (p.$on ? `border-color:${C.primary};` : '')}
  ${p => (p.$on ? `&::after{transform:scale(1);}` : '')}
`;
const EmptyNote = styled.p`font-size:.73rem;color:${C.muted};background:${C.bg};border-radius:10px;padding:.7rem .8rem;margin:0`;

/* ── details ── */
const Row2 = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:.55rem;
  @media(max-width:520px){grid-template-columns:1fr}`;
const Fld = styled.div`margin-bottom:.6rem;min-width:0`;
const Lbl = styled.label`display:block;font-size:.7rem;font-weight:700;color:${C.muted2};margin-bottom:.25rem;
  em{color:${C.bad};font-style:normal}`;
const Inp = styled.input`
  width:100%;padding:.5rem .65rem;font:inherit;font-size:.8rem;color:${C.text};
  border:1px solid #d1d5db;border-radius:9px;outline:none;transition:.15s;background:#fff;
  &::placeholder{color:#b6c2d1}
  &:focus{border-color:${C.primary};box-shadow:0 0 0 3px rgba(26,95,122,.12)}
`;
const ChargeWrap = styled.div`
  display:flex;align-items:stretch;border:1px solid #d1d5db;border-radius:9px;overflow:hidden;transition:.15s;background:#fff;
  &:focus-within{border-color:${C.primary};box-shadow:0 0 0 3px rgba(26,95,122,.12)}
  > span{display:flex;align-items:center;padding:0 .55rem;background:${C.bg};font-size:.68rem;font-weight:800;
    color:${C.muted2};border-right:1px solid ${C.line}}
  input{border:none;box-shadow:none;flex:1;min-width:0;&:focus{box-shadow:none}}
`;
const ErrBox = styled.div`
  display:${p => (p.$show ? 'block' : 'none')};margin-top:.5rem;padding:.5rem .65rem;border-radius:9px;
  background:#fee2e2;color:${C.bad};font-size:.72rem;font-weight:600;
`;
const Warn = styled.div`
  margin-bottom:.55rem;padding:.55rem .7rem;border-radius:9px;background:#fffbeb;border:1px solid #fde68a;
  color:#b45309;font-size:.72rem;font-weight:600;
`;

/* ── footer ── */
const PFoot = styled.footer`flex-shrink:0;border-top:1px solid ${C.line};padding:.75rem 1.2rem;background:${C.bg}`;
const Sum = styled.div`font-size:.72rem;font-weight:600;color:${C.muted2};margin-bottom:.6rem;min-height:1rem;
  ${p => (p.$ok ? `color:${C.ok};` : '')}${p => (p.$bad ? `color:${C.bad};` : '')}`;
const Acts = styled.div`display:flex;gap:.55rem`;
const GhostBtn = styled.button`
  border:1px solid #d1d5db;background:#fff;color:${C.muted2};border-radius:9px;
  font-size:.78rem;font-weight:700;padding:.6rem 1rem;cursor:pointer;transition:.15s;font-family:inherit;
  &:hover{background:#eef2f6}
`;
const GoBtn = styled.button`
  flex:1;border:none;border-radius:9px;background:${C.primary};color:#fff;
  font-size:.78rem;font-weight:700;padding:.6rem 1rem;cursor:pointer;transition:.15s;font-family:inherit;
  &:hover:not(:disabled){background:${C.primaryHover}}
  &:disabled{opacity:.5;cursor:not-allowed}
`;
const Spin = styled.span`
  display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;
  border-radius:50%;vertical-align:-2px;margin-right:6px;animation:${rot} .7s linear infinite;
`;

// ═══════════════════════════════════════════════════════
export default function BookNewHearseModal({
  open = false, initialDates = [], hearses = [], branches = [], // branches: kept for API compat — detected internally, never displayed
  onClose, onCreated, showToast,
}) {
  const [form, setForm] = useState({
    hearse_id: '', client_name: '', client_phone: '', deceased_name: '',
    from_location: '', to_location: '', branch_id: '', branch_code: '', service_charge: 0,
  });
  const [dates, setDates] = useState([]);          // confirmed selection — LIVE, no popover needed
  const [anchor, setAnchor] = useState(null);      // in-progress range start (START → END picking)
  const [pkM, setPkM] = useState(() => new Date().getMonth());
  const [pkY, setPkY] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [fleet, setFleet] = useState({});
  const [checkError, setCheckError] = useState(null);
  const [err, setErr] = useState('');

  /* initialDates is frequently a NEW array on every parent render — depending on
     it directly re-ran the reset effect while the officer was typing, wiping the
     form. Read it through a ref so the reset only happens when `open` flips. */
  const initialDatesRef = useRef(initialDates);
  useEffect(() => { initialDatesRef.current = initialDates; }, [initialDates]);

  /* fresh slate every time the panel opens */
  useEffect(() => {
    if (!open) return;
    const d = Array.isArray(initialDatesRef.current) ? initialDatesRef.current.filter(Boolean) : [];
    setDates(d);
    const u = safeUser();
    const db = u?.dbName || u?.branchDbName || '';
    setForm({
      hearse_id: '', client_name: '', client_phone: '', deceased_name: '',
      from_location: '', to_location: '', branch_id: u?.branch_id || '',
      branch_code: db.split('-').pop() || '', service_charge: 0,
    });
    setAnchor(null); setFleet({}); setCheckError(null); setErr('');
    setPkM(d[0] ? new Date(d[0] + 'T00:00:00').getMonth() : new Date().getMonth());
    setPkY(d[0] ? new Date(d[0] + 'T00:00:00').getFullYear() : new Date().getFullYear());
  }, [open]);

  /* Escape closes the panel, like the reference */
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Guard so an older, slower response can never overwrite a newer one.
  const fleetReqRef = useRef(0);

  // ── Availability loader ──────────────────────────────────────────────────
  // ONE request answers EVERY selected date (batch endpoint). The fallback is
  // SEQUENTIAL per date so a backend without the batch route degrades
  // gracefully instead of recreating the request burst.
  const checkFleet = useCallback(async (d) => {
    const days = Array.isArray(d) ? d.filter(Boolean) : [];
    if (!days.length) { setFleet({}); setCheckError(null); return; }

    const reqId = ++fleetReqRef.current;
    setChecking(true);
    setCheckError(null);

    try {
      const hdr = getAuthHeaders();
      let dayResults = [];
      let serverError = '';

      // 1) Preferred: ONE batch request covering every selected date.
      try {
        const r = await fetch(`${API_BASE_URL}/availability/check-by-dates`, {
          method: 'POST',
          headers: { ...hdr, 'Content-Type': 'application/json' },
          body: JSON.stringify({ dates: days }),
        });
        const j = await r.json().catch(() => null);
        if (r.ok && j) {
          if (Array.isArray(j.days) && j.days.length) {
            dayResults = j.days.map(x => ({ date: x.date, avail: x.available_hearses || [], booked: x.booked_hearses || [] }));
          } else if (j?.date) {
            dayResults = [{ date: j.date, avail: j.available_hearses || [], booked: j.booked_hearses || [] }];
          }
          const past = Array.isArray(j.past_dates) ? j.past_dates : [];
          const invalid = Array.isArray(j.invalid_dates) ? j.invalid_dates : [];
          const ignored = [...past, ...invalid];
          if (ignored.length) setCheckError(`Ignored date(s): ${ignored.join(', ')}.`);
        } else if (j?.message) {
          serverError = j.error ? `${j.message} (${j.error})` : String(j.message);
        } else {
          serverError = `HTTP ${r.status}`;
        }
      } catch { /* fall back to the per-date endpoint below */ }

      // 2) Fallback: one SEQUENTIAL request per date.
      if (!dayResults.length) {
        for (const date of days) {
          try {
            const r = await fetch(`${API_BASE_URL}/availability/check-by-date?date=${encodeURIComponent(date)}`, { headers: hdr });
            const j = await r.json().catch(() => null);
            if (!r.ok || !j) {
              if (!serverError) serverError = j?.error ? `${j.message} (${j.error})` : `HTTP ${r.status}`;
              continue;
            }
            dayResults.push({ date, avail: j.available_hearses || [], booked: j.booked_hearses || [] });
          } catch { /* skip this day */ }
        }
      }

      if (reqId !== fleetReqRef.current) return; // superseded by a newer check

      // Build fleet map from the full hearse list (prop carries model + status)
      const m = {};
      (hearses || []).forEach(h => {
        m[String(h.id)] = {
          status: 'available',
          bookedFor: [],
          hearse: {
            id: h.id,
            hearse_code: h.hearse_code,
            hearse_name: h.hearse_name || h.plate_number || '',
            plate_number: h.plate_number || '',
            model: h.model || '',
            capacity: h.capacity,
            status: h.status || 'available',
            service_charge_ksh: Number(h.service_charge_ksh ?? h.service_charge) || 0,
          }
        };
      });

      if (dayResults.length === 0) {
        const msg = serverError
          ? `Availability check failed: ${serverError}`
          : 'Availability service unreachable. Verify selection before booking.';
        if (showToast) showToast(msg, 'error');
        setCheckError(msg);
      }

      dayResults.forEach(day => {
        if (!day) return;
        (day.avail || []).forEach(a => {
          const key = String(a.id);
          if (!m[key]) m[key] = { status: 'available', bookedFor: [], hearse: {} };
          m[key].hearse = { ...m[key].hearse, ...a };
          if (m[key].status !== 'maintenance') m[key].status = 'available';
        });
        (day.booked || []).forEach(bh => {
          const id = String(bh.hearse_id || bh.id);
          if (!m[id]) m[id] = { status: 'booked', bookedFor: [], hearse: { ...bh } };
          m[id].status = 'booked';
          if (!m[id].bookedFor.some(x => x.date === day.date)) {
            m[id].bookedFor.push({ date: day.date, client: bh.client_name || bh.booking_code || 'Booked' });
          }
          m[id].hearse = { ...m[id].hearse, ...bh };
        });
      });

      // Maintenance / out-of-service hearses are never bookable
      (hearses || []).forEach(h => {
        const key = String(h.id);
        if (m[key] && EXCLUDED.includes(h.status)) m[key].status = 'maintenance';
      });

      setFleet(m);
    } catch (e) {
      if (reqId !== fleetReqRef.current) return;
      if (showToast) showToast('Failed to check hearse availability', 'error');
      const m = {};
      (hearses || []).forEach(h => {
        m[String(h.id)] = {
          status: EXCLUDED.includes(h.status) ? 'maintenance' : 'available',
          bookedFor: [],
          hearse: { ...h, service_charge_ksh: Number(h.service_charge_ksh ?? h.service_charge) || 0 },
        };
      });
      setFleet(m);
      setCheckError('Availability check failed. Please try selecting dates again.');
    } finally {
      if (reqId === fleetReqRef.current) setChecking(false);
    }
  }, [hearses, showToast]);

  const checkFleetRef = useRef(checkFleet);
  useEffect(() => { checkFleetRef.current = checkFleet; }, [checkFleet]);

  // ── LIVE availability — the calendar is always open and selection is
  // instant, so `dates` itself is the live selection. Debounced: ticking
  // several days quickly issues ONE request, not one each.
  const datesKey = dates.join('|');
  useEffect(() => {
    if (!open) return;
    const days = datesKey ? datesKey.split('|') : [];
    const t = setTimeout(() => { checkFleetRef.current(days); }, 200);
    return () => clearTimeout(t);
  }, [open, datesKey]);

  /* ── Range date selection: 1st click = start, 2nd click = end (every day
     between is selected), same day twice = one day. Runs on the always-open
     calendar. */
  const expandRange = (startKey, endKey) => {
    const out = [];
    const cur = new Date(startKey + 'T00:00:00');
    const last = new Date(endKey + 'T00:00:00');
    if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime())) return [startKey];
    for (let i = 0; i < 3660; i++) {
      if (cur > last) break;
      out.push(formatDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const clearHearse = () => setForm(p => ({ ...p, hearse_id: '' }));

  const togDate = (ds) => {
    if (anchor == null) { setAnchor(ds); setDates([ds]); clearHearse(); return; }
    if (ds === anchor) { setAnchor(null); setDates([ds]); clearHearse(); return; }
    const [s, e] = anchor <= ds ? [anchor, ds] : [ds, anchor];
    setAnchor(null);
    setDates(expandRange(s, e));
    clearHearse(); // dates changed → hearse pick resets
  };

  const clearDates = () => { setAnchor(null); setDates([]); clearHearse(); setErr(''); };

  const prevMonth = () => { if (pkM === 0) { setPkM(11); setPkY(p => p - 1); } else setPkM(p => p - 1); };
  const nextMonth = () => { if (pkM === 11) { setPkM(0); setPkY(p => p + 1); } else setPkM(p => p + 1); };

  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < new Date(pkY, pkM, 1).getDay(); i++) out.push(null);
    const last = new Date(pkY, pkM + 1, 0).getDate();
    for (let d = 1; d <= last; d++) out.push(d);
    return out;
  }, [pkY, pkM]);
  const todayK = formatDateStr(new Date());

  const pick = (h) => {
    if (dates.length > 0) {
      const s = fleet[String(h.id)];
      if (s && s.status !== 'available') {
        if (showToast) showToast(`${h.hearse_name || 'This hearse'} is not available on the selected date(s).`, 'error');
        return;
      }
    }
    // Service charge is OPTIONAL: pre-fill the TOTAL when the hearse has one
    // configured, otherwise leave it at 0 (it can be typed in by the user).
    const total = Number(fleet[String(h.id)]?.hearse?.service_charge_ksh ?? h.service_charge_ksh ?? h.service_charge) || 0;
    setErr('');
    setForm(p => ({ ...p, hearse_id: h.id, service_charge: total }));
  };

  const pickBlocked = (h) => {
    const s = fleet[String(h.id)] || {};
    const when = (s.bookedFor || []).map(b => `${b.date}${b.client ? ` (${b.client})` : ''}`).join(', ');
    if (showToast) showToast(`${h.hearse_name || 'This hearse'} is not available on the selected date(s)${when ? ` — booked: ${when}` : ''}.`, 'error');
  };

  const hasD = dates.length > 0;
  const hasHearses = (hearses || []).length > 0;
  const fleetVals = Object.values(fleet);
  const avCount = fleetVals.filter(s => s.status === 'available').length;
  const sortByName = (a, b) => String(a.hearse_name || a.plate_number || '').localeCompare(String(b.hearse_name || b.plate_number || ''));
  const fleetRows = useMemo(() => {
    const list = hasD
      ? [...(hearses || [])].sort(sortByName)
      : [];
    return list;
  }, [hearses, hasD]);

  const selHearse = (hearses || []).find(x => String(x.id) === String(form.hearse_id)) || {};
  const selBlocked = (() => {
    const s = fleet[String(form.hearse_id)];
    return !!(hasD && s && s.status !== 'available');
  })();
  const selTotal = Math.round((Number(form.service_charge) || 0) * 100) / 100;

  /* footer summary line — one quiet sentence, exactly like the reference */
  const summary = (() => {
    if (selBlocked) return { t: 'That hearse is booked — pick another.', bad: true };
    if (checking) return { t: 'Checking availability…' };
    const dPart = hasD
      ? fmtDay(dates[0]) + (dates.length > 1 ? ` +${dates.length - 1}` : '')
      : '';
    if (dPart && form.hearse_id) {
      let t = `${dPart} · ${selHearse.hearse_name || 'Hearse'}`;
      if (selTotal > 0) t += ` · KSH ${selTotal.toLocaleString()}`;
      return { t, ok: true };
    }
    if (dPart) return { t: `${dPart} — pick a hearse` };
    return { t: 'Select a date to start' };
  })();

  const canSubmit = !loading && hasD && !!form.hearse_id && !selBlocked
    && !!form.client_name.trim() && !!form.deceased_name.trim()
    && !!form.from_location.trim() && !!form.to_location.trim();

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!dates.length) missing.push('a date');
    if (!form.hearse_id) missing.push('a hearse');
    if (!form.client_name.trim()) missing.push('client name');
    if (!form.deceased_name.trim()) missing.push('deceased name');
    if (!form.from_location.trim()) missing.push('"from"');
    if (!form.to_location.trim()) missing.push('"to"');
    if (missing.length) { setErr('Please add ' + missing.join(', ') + '.'); return; }
    if (checking) { setErr('Still checking availability — try again in a moment.'); return; }
    if (selBlocked) { setErr('That hearse is booked on the selected date(s) — pick another.'); return; }

    setLoading(true); setErr('');
    try {
      const hdr = getAuthHeaders(); hdr['Content-Type'] = 'application/json';
      const u = safeUser();
      if (u?.branch_id) hdr['x-branch-id'] = u.branch_id;
      if (u?.email) hdr['x-user-email'] = u.email;
      hdr['x-user-name'] = u?.full_name || u?.username || u?.name || 'System';
      const fd = dates[0] + 'T00:00:00';
      const svcCharge = Math.round((Number(form.service_charge) || 0) * 100) / 100;
      const body = {
        hearse_id: form.hearse_id,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone || '',
        deceased_name: (form.deceased_name || '').trim(),
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        destination: form.to_location.trim(),
        from_timestamp: fd,
        booking_date: fd,
        booking_dates: dates,
        booked_by: getLocalUserName() || u?.email || 'System',
        branch_id: form.branch_id || u?.branch_id || '',
        branch_code: form.branch_code || u?.branch_code || '',
        service_charge: svcCharge,
      };
      const r = await fetch(`${API_BASE_URL}/hearse-bookings`, { method: 'POST', headers: hdr, body: JSON.stringify(body) });
      const ed = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 409) throw new Error(ed.message || 'Just booked by another user.');
        throw new Error(ed.message || `HTTP ${r.status}`);
      }
      if (showToast) showToast(svcCharge > 0 ? `Booking created — Total Service Charge KSH ${svcCharge.toLocaleString()}!` : 'Booking created!', 'success');
      setFleet({});
      if (onClose) onClose();
      if (onCreated) await onCreated();
    } catch (ex) {
      setErr(ex.message || 'Failed to create booking');
      if (showToast) showToast('Failed: ' + (ex.message || 'booking error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  /* selline text — dates picked so far (or the in-progress range hint) */
  const selText = anchor
    ? `Start ${fmtDay(anchor)} — now pick the end`
    : dates.length
      ? '✓ ' + dates.slice(0, 3).map(fmtDay).join(', ') + (dates.length > 3 ? ` +${dates.length - 3} more` : '')
      : 'No dates selected';

  const fleetHint = !hasD ? 'pick a date first'
    : checking ? 'checking…'
      : `${avCount} of ${(hearses || []).length} free`;

  return (
    <>
      <Scrim $open={open} onClick={onClose} />
      <Panel $open={open} role="dialog" aria-modal="true" aria-label="New hearse booking">

        <PHead>
          <HeadTxt>
            <h1>New Hearse Booking</h1>
            <p>Date → hearse → details</p>
          </HeadTxt>
          <XBtn onClick={onClose} aria-label="Close"><X size={12} /></XBtn>
        </PHead>

        <PBody>

          {/* ── 1 · Dates — calendar always open, tap = select ── */}
          <Sec>
            <SecT>
              <h2><i>1</i>Dates</h2>
              <small>
                {dates.length
                  ? `${dates.length} date${dates.length > 1 ? 's' : ''} selected`
                  : anchor ? 'pick the end date' : 'tap a day to add'}
              </small>
            </SecT>
            <CalTop>
              <b>{MONTHS[pkM]} {pkY}</b>
              <CalNav>
                <NavBtn type="button" aria-label="Previous month" onClick={prevMonth}><ChevronLeft size={13} /></NavBtn>
                <NavBtn type="button" aria-label="Next month" onClick={nextMonth}><ChevronRight size={13} /></NavBtn>
              </CalNav>
            </CalTop>
            <CalGrid>
              {WD.map(w => <Wd key={w}>{w}</Wd>)}
              {cells.map((day, i) => {
                if (day === null) return <span key={'e' + i} />;
                const ds = pkY + '-' + pad(pkM + 1) + '-' + pad(day);
                const past = ds < todayK;
                return (
                  <Day key={ds} type="button"
                    $sel={dates.includes(ds)} $past={past} $today={ds === todayK}
                    disabled={past}
                    onClick={() => { if (!past) togDate(ds); }}>
                    {day}
                  </Day>
                );
              })}
            </CalGrid>
            <SelLine>
              <SelTxt $has={dates.length > 0}>{selText}</SelTxt>
              {(dates.length > 0 || anchor != null) && (
                <ClearBtn type="button" onClick={clearDates}>Clear</ClearBtn>
              )}
            </SelLine>
          </Sec>

          {/* ── 2 · Hearse — dot status rows, live availability ── */}
          <Sec>
            <SecT>
              <h2><i>2</i>Hearse</h2>
              <small>{fleetHint}</small>
            </SecT>

            {checkError && <Warn>⚠ {checkError}</Warn>}

            {!hasD ? (
              <EmptyNote>Pick a date above — every hearse is checked instantly.</EmptyNote>
            ) : !hasHearses ? (
              <EmptyNote>No hearses registered yet.</EmptyNote>
            ) : (
              fleetRows.map(h => {
                const s = fleet[String(h.id)];
                const known = !checking && !!s;
                const free = known && s.status === 'available';
                const off = known && !free;
                const sel = String(h.id) === String(form.hearse_id);
                const kind = !known ? 'wait' : free ? 'free' : 'busy';
                const meta = [
                  h.plate_number || h.number_plate || '',
                  h.model || '',
                  h.capacity ? h.capacity + ' seats' : '',
                ].filter(Boolean).join(' · ');
                return (
                  <HRow key={h.id} type="button"
                    $sel={sel} $off={off} $dim={checking}
                    title={off ? 'Not available on your dates' : undefined}
                    onClick={() => { if (off) pickBlocked(h); else pick(h); }}>
                    <Ava>{(String(h.hearse_name || h.plate_number || 'H').trim().charAt(0) || 'H').toUpperCase()}</Ava>
                    <HInfo>
                      <b>{h.hearse_name || 'Unnamed Hearse'}</b>
                      <small>{meta || '—'}</small>
                    </HInfo>
                    <St>
                      <Dot $kind={kind} />
                      {off && <em>{s.status === 'maintenance' ? 'Unavailable' : 'Booked'}</em>}
                      {free && <em className="free">Free</em>}
                    </St>
                    {!off && <Radio $on={sel} />}
                  </HRow>
                );
              })
            )}
          </Sec>

          {/* ── 3 · Details ── */}
          <Sec>
            <SecT><h2><i>3</i>Details</h2></SecT>
            <Row2>
              <Fld>
                <Lbl>Client <em>*</em></Lbl>
                <Inp placeholder="Full name" value={form.client_name}
                  onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
              </Fld>
              <Fld>
                <Lbl>Phone</Lbl>
                <Inp placeholder="0712 345 678" value={form.client_phone}
                  onChange={e => setForm(p => ({ ...p, client_phone: e.target.value }))} />
              </Fld>
            </Row2>
            <Row2>
              <Fld>
                <Lbl>Deceased <em>*</em></Lbl>
                <Inp placeholder="Name of the deceased" value={form.deceased_name}
                  onChange={e => setForm(p => ({ ...p, deceased_name: e.target.value }))} />
              </Fld>
              <Fld>
                <Lbl>Service charge</Lbl>
                <ChargeWrap>
                  <span>KSH</span>
                  <Inp type="number" min="0" step="0.01" placeholder="0" value={form.service_charge || ''}
                    onChange={e => setForm(p => ({ ...p, service_charge: e.target.value }))} />
                </ChargeWrap>
              </Fld>
            </Row2>
            <Fld>
              <Lbl>From <em>*</em></Lbl>
              <Inp placeholder="e.g., Nairobi CBD" value={form.from_location}
                onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} />
            </Fld>
            <Fld>
              <Lbl>To <em>*</em></Lbl>
              <Inp placeholder="e.g., Karen Memorial Park" value={form.to_location}
                onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} />
            </Fld>
            {/* Branch is detected internally from auth headers / user profile —
                form.branch_id & branch_code are auto-filled and sent, nothing to ask. */}
            <ErrBox $show={!!err}>{err}</ErrBox>
          </Sec>

        </PBody>

        <PFoot>
          <Sum $ok={summary.ok} $bad={summary.bad}>{summary.t}</Sum>
          <Acts>
            <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
            <GoBtn type="button" disabled={!canSubmit} onClick={submit}>
              {loading ? <><Spin />Creating…</> : 'Create Booking'}
            </GoBtn>
          </Acts>
        </PFoot>

      </Panel>
    </>
  );
}