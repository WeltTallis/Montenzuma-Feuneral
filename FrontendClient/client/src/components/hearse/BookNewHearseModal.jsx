import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';
import { X, Calendar, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

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

const C = {
  primary: '#1a5f7a',
  primaryLight: '#2c8ac9',
  primaryDark: '#134b5f',
  white: '#FFFFFF',
  bg: '#f8f9fb',
  border: '#e2e5ea',
  text: '#1a1a2e',
  textSec: '#6b7280',
  textMuted: '#9ca3af',
  success: '#10b981',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cardBg: '#03071E',
  // ─── HTML-template status badge colors
  stActiveColor: '#00296B',
  stPmReqColor: '#E36414',
  stPmDoneColor: '#5F0F40',
  stReleasedColor: '#03071E',
  stTransferredColor: '#03071E',
};

const formatDateStr = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const pad = (n) => String(n).padStart(2, '0');

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
  // Tenant id makes new bookings visible to EVERY branch in one list
  const tenantId = resolveTenantId();
  if (tenantId) h['x-tenant-id'] = tenantId;
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const getLocalUserName = () => {
  try { const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); return u?.full_name || u?.username || u?.name || u?.email || ''; } catch { return ''; }
};

const safeUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const spinKf = keyframes`to{transform:rotate(360deg)}`;
const popIn = keyframes`from{opacity:0;transform:scale(.96) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}`;

const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998;animation:${fadeIn}.1s;backdrop-filter:blur(2px)`;

const Panel = styled.div`
  position:fixed;top:0;right:0;bottom:0;width:${p => p.$w || '660px'};max-width:100%;
  background:${C.white};z-index:9999;
  transform:translateX(${p => p.$open ? '0' : '100%'});
  transition:transform .25s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;
  box-shadow:-2px 0 20px rgba(0,0,0,.06);
  @media(max-width:900px){width:100%}
`;

const PanelHead = styled.div`padding:.9rem 1.15rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${C.primaryDark},${C.primary});flex-shrink:0;`;
const PanelTitle = styled.h2`font-size:1.05rem;font-weight:700;margin:0;color:${C.white}`;
const PanelSub = styled.p`font-size:.7rem;color:rgba(255,255,255,.55);margin:.1rem 0 0`;

const PanelBody = styled.div`
  flex:1;overflow-y:auto;padding:1.1rem 1.15rem;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{width:3px}&::-webkit-scrollbar-thumb{background:${C.border};border-radius:9px}
`;

const CloseBtn = styled.button`background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;padding:.3rem;border-radius:5px;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(255,255,255,.2)}`;

const BtnPrimary = styled.button`background:${C.primary};color:#fff;border:none;border-radius:5px;padding:.5rem 1.1rem;font-size:.78rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:.35rem;white-space:nowrap;&:hover{background:${C.primaryDark}}&:disabled{background:${C.textMuted};cursor:not-allowed}`;

const BtnGhost = styled.button`background:#fff;color:${C.text};border:1px solid ${C.border};border-radius:5px;padding:.5rem 1.1rem;font-size:.78rem;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap;&:hover{background:${C.bg}}`;

const Input = styled.input`width:100%;padding:.45rem .65rem;border:1px solid ${C.border};border-radius:5px;font-size:.78rem;color:${C.text};background:#fff;outline:none;box-sizing:border-box;&::placeholder{color:${C.textMuted}}&:focus{border-color:${C.primaryLight};box-shadow:0 0 0 2px rgba(44,138,201,.1)}&:disabled{background:${C.bg};color:${C.textSec};cursor:not-allowed}`;

const Label = styled.label`display:block;font-weight:600;margin-bottom:.3rem;font-size:.76rem;color:${C.text}`;
const Hint = styled.span`font-weight:400;color:${C.textMuted};font-size:.66rem;margin-left:.15rem`;

const Chip = styled.span`display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .45rem;background:rgba(26,95,122,.07);color:${C.primary};border-radius:4px;font-size:.66rem;font-weight:600;border:1px solid rgba(26,95,122,.1)`;

const Divider = styled.div`height:1px;background:${C.border};margin:.85rem 0`;

/* ─── HTML-TEMPLATE CARD DESIGN ───────── */

const StepHeader = styled.div`
  display:flex;align-items:center;gap:.6rem;margin-bottom:1.25rem;
`;
const StepDot = styled.div`
  width:22px;height:22px;border-radius:50%;
  background:${C.primary};color:#fff;
  font-size:11px;font-weight:800;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 3px 8px rgba(26,95,122,.3);
`;
const StepTitle = styled.div`
  font-size:13px;font-weight:800;text-transform:uppercase;
  letter-spacing:.04em;color:#334155;
  span{color:#64748b;font-weight:600;text-transform:none;letter-spacing:0;margin-left:.4rem;font-size:11px}
`;

const SectionHeader = styled.div`
  display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;
  &::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0 0%,transparent 100%);border-radius:1px}
`;
const SectionDot = styled.div`
  width:8px;height:8px;border-radius:50%;
  background:${p => p.$green ? '#10b981' : '#ef4444'};
  box-shadow:0 0 0 2px ${p => p.$green ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'};
`;
const SectionLabel = styled.span`
  font-size:.7rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;
`;
const SectionCount = styled.span`
  font-size:.6rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:2px 6px;border-radius:10px;border:1px solid #e2e8f0;
`;

const HearseGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
  gap:.6rem;
`;

const HearseCard = styled.button`
  display:flex;flex-direction:column;gap:.5rem;
  padding:.6rem .7rem;border-radius:10px;cursor:pointer;
  transition:all .2s ease;text-align:left;width:100%;
  border:1px solid transparent;position:relative;overflow:hidden;
  ${p => p.$booked
    ? `background:#fff5f5;border-color:#fee2e2;cursor:not-allowed;opacity:.6`
    : p.$selected
      ? `background:#eff6ff;border-color:${C.primary};box-shadow:0 6px 14px -4px rgba(26,95,122,.2);opacity:1;transform:translateY(-2px)`
      : p.$neutral
        ? `background:#fff;border-color:${C.border};
           &:hover{border-color:#cbd5e1;background:#f8fafc;transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,0,0,.05)}`
        : `background:#f0fdfa;border-color:#d1fae5;box-shadow:0 1px 4px rgba(16,185,129,.05);
           &:hover{border-color:#6ee7b7;background:#ecfdf5;transform:translateY(-2px);box-shadow:0 8px 16px -6px rgba(16,185,129,.2)}`}
`;

const CardTop = styled.div`
  display:flex;align-items:center;gap:.5rem;
`;
const Avatar = styled.div`
  width:30px;height:30px;border-radius:8px;
  color:#fff;font-size:12px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  text-transform:uppercase;flex-shrink:0;
  box-shadow:0 2px 4px rgba(0,0,0,.1);
`;
const InfoBlock = styled.div`
  flex:1;min-width:0;display:flex;flex-direction:column;gap:.1rem;
`;
const HearseName = styled.span`
  font-size:.75rem;font-weight:700;color:#0f172a;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;
`;
const PlateBox = styled.span`
  font-size:.55rem;font-weight:700;color:#475569;
  background:#fff;border:1px solid #e2e8f0;
  padding:1px 4px;border-radius:3px;align-self:flex-start;
  letter-spacing:.03em;
`;

const CardBottom = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:.3rem;
  margin-top:auto;padding-top:.35rem;
  border-top:1px dashed rgba(0,0,0,.06);
`;
const RightControls = styled.div`
  display:flex;align-items:center;gap:.35rem;flex-shrink:0;
`;
const AvailPill = styled.span`
  font-size:.5rem;font-weight:800;padding:.15rem .4rem;
  border-radius:999px;text-transform:uppercase;letter-spacing:.03em;
  ${p => p.$free
    ? 'background:#d1fae5;color:#047857;border:1px solid #a7f3d0'
    : p.$unknown
      ? 'background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0'
      : 'background:#fee2e2;color:#b91c1c;border:1px solid #fecaca'}
`;
const StatusBadge = styled.span`
  font-size:.52rem;font-weight:700;padding:.12rem .35rem;
  border-radius:4px;text-transform:uppercase;letter-spacing:.03em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  display:inline-flex;align-items:center;gap:3px;
  ${p => p.$cls === 'st-active'
    ? `color:${C.stActiveColor};background:rgba(0,41,107,.08);border:1px solid rgba(0,41,107,.1)`
    : p.$cls === 'st-pmReq'
      ? `color:${C.stPmReqColor};background:rgba(227,100,20,.08);border:1px solid rgba(227,100,20,.1)`
      : p.$cls === 'st-pmDone'
        ? `color:${C.stPmDoneColor};background:rgba(95,15,64,.08);border:1px solid rgba(95,15,64,.1)`
        : p.$cls === 'st-released'
          ? `color:${C.stReleasedColor};background:rgba(3,7,30,.08);border:1px solid rgba(3,7,30,.1)`
          : `color:${C.stTransferredColor};background:rgba(3,7,30,.08);border:1px solid rgba(3,7,30,.1)`}
`;
const RadioBtn = styled.span`
  width:14px;height:14px;border-radius:50%;
  border:2px solid #cbd5e1;display:inline-flex;
  align-items:center;justify-content:center;transition:all .2s;background:#fff;flex-shrink:0;
  &::after{content:'';width:7px;height:7px;border-radius:50%;
    background:${C.primary};transform:scale(0);transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
`;
const CardSelectedRadio = styled(RadioBtn)`
  border-color:${C.primary};
  &::after{background:${C.primary};transform:scale(1)}
`;
const CardBookedRadio = styled(RadioBtn)`
  border-color:#fecdd3;background:#fff1f2;
`;

const ServiceChargeBox = styled.div`
  margin-top:.75rem;padding:.85rem;border-radius:10px;
  background:#f0fdf4;border:1.5px solid #dcfce7;
`;
const ChargeRow = styled.div`
  display:flex;justify-content:space-between;font-size:.72rem;
  color:#374151;padding:.12rem 0;
  &:first-child{font-weight:600;color:#111827}
  &:not(:first-child){border-top:1px solid #dcfce7}
`;

/* ─── Vehicle status → badge metadata (colors from the design system) ─── */
const statusMeta = (h) => {
  const s = String(h?.status || '').toLowerCase();
  if (['active', 'available', 'in_morgue'].includes(s)) return { cls: 'st-active', label: 'Active / In Morgue', color: '#00296B' };
  if (['pm_requested', 'pm_request', 'maintenance_requested', 'pending_pm', 'maintenance', 'out_of_service', 'disabled'].includes(s)) return { cls: 'st-pmReq', label: 'PM Requested', color: '#E36414' };
  if (['pm_done', 'serviced', 'maintenance_done'].includes(s)) return { cls: 'st-pmDone', label: 'PM Done', color: '#5F0F40' };
  if (s === 'released') return { cls: 'st-released', label: 'Released', color: '#6b7280' };
  if (s === 'transferred') return { cls: 'st-transferred', label: 'Transferred', color: '#03071E' };
  return { cls: 'st-active', label: (h?.status || 'Active').replace(/_/g, ' '), color: '#00296B' };
};

/* ─── One hearse card (matches the horizontal template design) ─── */
function HearseCardTpl({ h, state, hasD, selected, onPick }) {
  const st = state || {};
  const booked = hasD && st.status === 'booked';
  const maint = hasD && st.status === 'maintenance';
  const blocked = booked || maint;
  const meta = statusMeta(h);
  const letter = (String(h.hearse_name || h.plate_number || 'H').trim().charAt(0) || 'H').toUpperCase();
  // OPTIONAL: one TOTAL service charge for the booking (0 = not configured).
  const totalCharge = Number(st.hearse?.service_charge_ksh ?? h.service_charge_ksh) || 0;

  let pill;
  if (hasD && booked) pill = { label: '✕ Booked', mode: 'booked' };
  else if (hasD && maint) pill = { label: '✕ Unavailable', mode: 'booked' };
  else if (hasD) pill = { label: '✓ Free', mode: 'free' };
  else pill = { label: '· Pick dates', mode: 'unknown' };

  const Radio = blocked ? CardBookedRadio : (selected ? CardSelectedRadio : RadioBtn);

  return (
    <HearseCard type="button" $booked={blocked} $selected={selected} $neutral={!hasD && !blocked}
      onClick={e => { e.preventDefault(); onPick(); }}>
      <CardTop>
        <Avatar style={{ background: meta.color }}>{letter}</Avatar>
        <InfoBlock>
          <HearseName title={h.hearse_name || 'Unnamed'}>{h.hearse_name || 'Unnamed Hearse'}</HearseName>
          <PlateBox>{h.plate_number || h.number_plate || '—'}</PlateBox>
        </InfoBlock>
        <RightControls><Radio /></RightControls>
      </CardTop>
      <CardBottom>
        <StatusBadge $cls={meta.cls} title={meta.label}>{meta.label}</StatusBadge>
        <AvailPill $free={pill.mode === 'free'} $unknown={pill.mode === 'unknown'}>{pill.label}</AvailPill>
      </CardBottom>
      {booked && st.bookedFor && st.bookedFor.length > 0 && (
        <span title={st.bookedFor.map(b => b.date).join(', ')} style={{ fontSize: '.52rem', fontWeight: 600, color: '#b91c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {st.bookedFor.map(b => b.date).join(', ')}
        </span>
      )}
      {totalCharge > 0 && (
        <span title={`Total service charge: KSH ${totalCharge.toLocaleString()}`} style={{ fontSize: '.55rem', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          Total: KSH {totalCharge.toLocaleString()}
        </span>
      )}
    </HearseCard>
  );
}

const Warn = styled.div`padding:.55rem .7rem;border-radius:5px;background:#fffbeb;border:1px solid #fde68a;color:#b45309;font-size:.72rem;font-weight:600;display:flex;align-items:center;gap:.35rem;animation:${fadeIn}.15s;`;

const Sp = styled.div`width:18px;height:18px;border:2.5px solid ${C.border};border-top-color:${C.primary};border-radius:50%;animation:${spinKf}.6s linear infinite;margin:0 auto .35rem;`;
const SS = styled.span`width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:${spinKf}.6s linear infinite;display:inline-block;`;

const PkOv = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);padding:1rem`;
const PkBox = styled.div`background:#fff;border-radius:10px;width:400px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 16px 32px rgba(0,0,0,.12);animation:${popIn}.12s`;
const PkHead = styled.div`padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${C.primaryDark},${C.primary});border-radius:10px 10px 0 0`;
const PkClose = styled.button`width:26px;height:26px;border-radius:5px;background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(255,255,255,.2)}`;
const PkBody = styled.div`padding:.9rem 1rem`;
const PkNav = styled.button`width:26px;height:26px;border-radius:5px;border:1px solid ${C.border};background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${C.textSec};font-size:14px;&:hover{background:${C.bg}}`;
const PkFoot = styled.div`display:flex;gap:.5rem;justify-content:flex-end;align-items:center;margin-top:.85rem;border-top:1px solid ${C.border};padding-top:.85rem`;

const PkDay = styled.button`
  aspect-ratio:1;padding:0;border:1px solid transparent;border-radius:5px;background:transparent;
  font-size:.76rem;font-weight:600;color:${C.text};
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  transition:background .12s,color .12s;
  ${p => p.$sel
    ? `background:${C.primary};color:#fff;font-weight:700;`
    : p.$past
      ? `color:${C.textMuted};cursor:not-allowed;text-decoration:line-through;text-decoration-color:${C.border};`
      : p.$today
        ? `border-color:${C.success};color:${C.success};&:hover{background:rgba(16,185,129,.08);}`
        : `&:hover{background:rgba(26,95,122,.08);}`}
`;

// ═══════════════════════════════════════════════════════
export default function BookNewHearseModal({
  open = false, initialDates = [], hearses = [], branches = [], // branches: kept for API compat, never displayed — detected internally
  onClose, onCreated, showToast,
}) {
  const [form, setForm] = useState({ hearse_id: '', client_name: '', client_phone: '', deceased_name: '', from_location: '', to_location: '', destination: '', booking_dates: [], branch_id: '', booking_date: '', service_charge: 0 });
  const [dates, setDates] = useState([]);
  const [pkOpen, setPkOpen] = useState(false);
  const [tmpDates, setTmpDates] = useState([]);
  const [pkM, setPkM] = useState(() => new Date().getMonth());
  const [pkY, setPkY] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [fleet, setFleet] = useState({});
  const [checkError, setCheckError] = useState(null);

  /* initialDates is frequently a NEW array on every parent render — depending on
     it directly re-ran the reset effect while the officer was typing, wiping the
     form. Read it through a ref so the reset only happens when `open` flips. */
  const initialDatesRef = useRef(initialDates);
  useEffect(() => { initialDatesRef.current = initialDates; }, [initialDates]);

  useEffect(() => {
    if (!open) return;
    const d = Array.isArray(initialDatesRef.current) ? initialDatesRef.current.filter(Boolean) : [];
    setDates(d);
    const u = safeUser();
    const db = u?.dbName || u?.branchDbName || '';
    setForm({ hearse_id: '', client_name: '', client_phone: '', deceased_name: '', from_location: '', to_location: '', destination: '', booking_dates: d, branch_id: u?.branch_id || '', branch_code: db.split('-').pop() || '', booking_date: d[0] || '', service_charge: 0 });
    setTmpDates([]); setAnchor(null); setFleet({}); setCheckError(null);
    setPkM(d[0] ? new Date(d[0] + 'T00:00:00').getMonth() : new Date().getMonth());
    setPkY(d[0] ? new Date(d[0] + 'T00:00:00').getFullYear() : new Date().getFullYear());
    // Calendar opens on its own so booking starts immediately —
    // unless the panel was opened with pre-filled dates.
    if (!d.length) setPkOpen(true); else setPkOpen(false);
  }, [open]);

  // Guard so an older, slower response can never overwrite a newer one.
  const fleetReqRef = useRef(0);

  // ── Availability loader ──────────────────────────────────────────────────
  // ONE request now answers EVERY selected date (batch endpoint). The previous
  // implementation issued a parallel fetch per date via Promise.all, so a
  // multi-day selection produced a burst of requests; combined with an unstable
  // callback that re-ran this effect on every render it reached hundreds of
  // calls — the "too many requests" symptom.
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
            // Older deploy answering with the single-date shape
            dayResults = [{ date: j.date, avail: j.available_hearses || [], booked: j.booked_hearses || [] }];
          }
          // Dates the backend refused to evaluate (past / malformed) — say so.
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

      // 2) Fallback: one SEQUENTIAL request per date. Sequential (not parallel)
      //    so a backend without the batch route degrades gracefully instead of
      //    recreating the request burst.
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
            // OPTIONAL single total service charge — never required
            service_charge_ksh: Number(h.service_charge_ksh ?? h.service_charge) || 0,
          }
        };
      });

      // Surface an error when NOTHING could be checked (no silent fallback)
      if (dayResults.length === 0) {
        const msg = serverError
          ? `Availability check failed: ${serverError}`
          : 'Availability service unreachable. Verify selection before booking.';
        if (showToast) showToast(msg, 'error');
        setCheckError(msg);
      }

      dayResults.forEach(day => {
        if (!day) return;
        // Enrich with the full DTO (status_badge, service_charge_ksh, model…)
        (day.avail || []).forEach(a => {
          const key = String(a.id);
          if (!m[key]) m[key] = { status: 'available', bookedFor: [], hearse: {} };
          m[key].hearse = { ...m[key].hearse, ...a };
          if (m[key].status !== 'maintenance') m[key].status = 'available';
        });
        // Booked hearses for this date
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
        if (m[key] && EXCLUDED.includes(h.status)) {
          m[key].status = 'maintenance';
        }
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

  // Keep the latest loader in a ref, so the effect below always calls fresh
  // props WITHOUT depending on the callback identity (which was the loop).
  const checkFleetRef = useRef(checkFleet);
  useEffect(() => { checkFleetRef.current = checkFleet; }, [checkFleet]);

  // ── LIVE availability ────────────────────────────────────────────────────
  // The list must reflect the dates selected RIGHT NOW: while the calendar is
  // open that is the in-progress selection (tmpDates), otherwise the confirmed
  // dates. Ticking a day therefore re-checks availability immediately — the
  // moment the picker is confirmed the cards already show that day's result.
  const activeDates = pkOpen ? tmpDates : dates;
  const activeDatesKey = Array.isArray(activeDates) ? activeDates.join('|') : '';
  useEffect(() => {
    if (!open) return;
    const days = activeDatesKey ? activeDatesKey.split('|') : [];
    // Debounce: ticking several days quickly issues ONE request, not one each.
    const t = setTimeout(() => { checkFleetRef.current(days); }, 200);
    return () => clearTimeout(t);
  }, [open, activeDatesKey]);

  const pick = (h) => {
    if (dates.length > 0) {
      const s = fleet[String(h.id)];
      if (s && s.status !== 'available') {
        showToast(`${h.hearse_name || 'This hearse'} is not available on the selected date(s).`, 'error');
        return;
      }
    }
    // Service charge is OPTIONAL: pre-fill the TOTAL when the hearse has one
    // configured, otherwise leave it at 0 (it can be typed in by the user).
    const total = Number(fleet[String(h.id)]?.hearse?.service_charge_ksh ?? h.service_charge_ksh ?? h.service_charge) || 0;
    setForm(p => ({ ...p, hearse_id: h.id, service_charge: total }));
  };

  /* ── Range date selection ──────────────────────────────────────────────────
     The picker works as START -> END, like any booking calendar:
       1st click  = start of the range (a single day stays selected)
       2nd click  = end of the range -> every day in between is selected
       3rd click  = starts a brand new range

     Previously each click was a plain toggle, so booking a span meant tapping
     every single day and one mis-tap deleted the start date. `anchor` holds the
     in-progress start; while it is set the calendar is in "picking the end"
     mode, which the header copy reflects. */
  const [anchor, setAnchor] = useState(null);

  // Expand a start/end pair into the inclusive list of YYYY-MM-DD keys between
  // them. Iterates day-by-day rather than trusting millisecond maths, so a
  // range that spans a DST boundary or a month/year rollover is still exact.
  const expandRange = (startKey, endKey) => {
    const out = [];
    const cur = new Date(startKey + 'T00:00:00');
    const last = new Date(endKey + 'T00:00:00');
    if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime())) return [startKey];
    // Guard against a runaway loop if the keys are somehow equal-but-invalid.
    for (let i = 0; i < 3660; i++) {
      if (cur > last) break;
      out.push(formatDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const togDate = (ds) => {
    setTmpDates((prev) => {
      // No start picked yet, or the range is already complete -> begin a new one.
      if (anchor === null || anchor === undefined) {
        setAnchor(ds);
        return [ds];
      }
      // Second click closes the range. Clicking the same day twice = a single
      // day (no accidental one-day ranges), and a backwards click is swapped so
      // the earlier day becomes the start instead of silently doing nothing.
      if (ds === anchor) { setAnchor(null); return [ds]; }
      const [s, e] = anchor <= ds ? [anchor, ds] : [ds, anchor];
      setAnchor(null);
      return expandRange(s, e);
    });
  };

  // Abort the in-progress range and clear the picker's working selection.
  const cancelRange = () => { setAnchor(null); setTmpDates([]); };

  const confirmDates = () => {
    setAnchor(null);
    setDates(tmpDates);
    // The total service charge is a whole-booking amount, so a date change keeps
    // whatever was entered — it is never recalculated from a daily rate.
    setForm(p => ({ ...p, booking_dates: tmpDates, booking_date: tmpDates[0] || '' }));
    setPkOpen(false);
    if (form.hearse_id) { const s = fleet[String(form.hearse_id)]; if (s && s.status !== 'available') setForm(p => ({ ...p, hearse_id: '' })); }
  };

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.hearse_id || !form.client_name || !form.deceased_name || !form.from_location || !form.to_location || !dates.length) { showToast('Please fill all required fields and select at least one date', 'error'); return; }
    if (checking) { showToast('Still checking availability for the selected dates — try again in a moment.', 'error'); return; }
    const s = fleet[String(form.hearse_id)];
    if (s && s.status !== 'available') { showToast(`This hearse is already booked for: ${s.bookedFor.map(b => `${b.date} (${b.client})`).join(', ') || 'the selected date(s)'}.`, 'error'); return; }
    setLoading(true);
    try {
      const hdr = getAuthHeaders(); hdr['Content-Type'] = 'application/json';
      const u = safeUser();
      if (u?.branch_id) hdr['x-branch-id'] = u.branch_id;
      if (u?.email) hdr['x-user-email'] = u.email;
      hdr['x-user-name'] = u?.full_name || u?.username || u?.name || 'System';
      const fd = dates.length > 0 ? dates[0] + 'T00:00:00' : new Date().toISOString();
      // OPTIONAL total service charge (KSH) for the whole booking — sent as
      // entered; 0 is perfectly valid and the booking still completes.
      const svcCharge = Math.round((Number(form.service_charge) || 0) * 100) / 100;
      const body = { hearse_id: form.hearse_id, client_name: form.client_name, client_phone: form.client_phone || '', deceased_name: (form.deceased_name || '').trim(), from_location: form.from_location, to_location: form.to_location, destination: form.to_location, from_timestamp: fd, booking_date: fd, booking_dates: dates, booked_by: getLocalUserName() || u?.email || 'System', branch_id: form.branch_id || u?.branch_id || '', branch_code: form.branch_code || u?.branch_code || '', service_charge: svcCharge };
      const r = await fetch(`${API_BASE_URL}/hearse-bookings`, { method: 'POST', headers: hdr, body: JSON.stringify(body) });
      if (!r.ok) { const ed = await r.json().catch(() => ({})); if (r.status === 409) throw new Error(ed.message || 'Just booked by another user.'); throw new Error(ed.message || `HTTP ${r.status}`); }
      showToast(svcCharge > 0 ? `Booking created — Total Service Charge KSH ${svcCharge.toLocaleString()}!` : 'Booking created!', 'success'); setFleet({}); if (onClose) onClose(); if (onCreated) await onCreated();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    setLoading(false);
  }, [form, dates, fleet, hearses, checking, showToast, onClose, onCreated]);

  const hasD = dates.length > 0;
  const hasHearses = hearses.length > 0;

  // Day-availability counts across the fleet map
  const fleetVals = Object.values(fleet);
  const avCount = fleetVals.filter(s => s.status === 'available').length;

  // Split the fleet for the two-section (Available / Booked) layout.
  // ALL hearses are shown — booked ones are visible but not selectable,
  // so the user always sees why a hearse can't be chosen.
  const sortByName = (a, b) => String(a.hearse_name || a.plate_number || '').localeCompare(String(b.hearse_name || b.plate_number || ''));
  let availList = [];
  let bookedList = [];
  let allList = [];
  if (hasD) {
    availList = (hearses || []).filter(h => { const s = fleet[String(h.id)]; return !s || s.status === 'available'; }).sort(sortByName);
    bookedList = (hearses || []).filter(h => { const s = fleet[String(h.id)]; return s && (s.status === 'booked' || s.status === 'maintenance'); }).sort(sortByName);
  } else {
    allList = (hearses || []).slice().sort(sortByName);
  }

  // The selected hearse + the OPTIONAL total service charge for this booking.
  // There is no daily rate: the charge is a single whole-booking amount that
  // the user may leave at 0 (it is not required to create the booking).
  const selHearse = (hearses || []).find(x => String(x.id) === String(form.hearse_id)) || {};
  const selTotal = Math.round((Number(form.service_charge) || 0) * 100) / 100;

  const pickBlocked = (h) => {
    const s = fleet[String(h.id)] || {};
    const when = (s.bookedFor || []).map(b => `${b.date}${b.client ? ` (${b.client})` : ''}`).join(', ');
    showToast(`${h.hearse_name || 'This hearse'} is not available on the selected date(s)${when ? ` — booked: ${when}` : ''}.`, 'error');
  };

  const calDays = () => {
    const ts = formatDateStr(new Date()); const f = new Date(pkY, pkM, 1); const so = f.getDay(); const d = [];
    for (let i = 0; i < so; i++) d.push(null);
    const ld = new Date(pkY, pkM + 1, 0).getDate();
    for (let i = 1; i <= ld; i++) d.push(i);
    return { d, ts };
  };

  return (
    <>
      {open && <Overlay onClick={onClose} />}
      <Panel $open={open} $w="660px">
        <PanelHead>
          <div><PanelTitle>New Hearse Booking</PanelTitle><PanelSub>Pick dates, then choose an available hearse</PanelSub></div>
          <CloseBtn onClick={onClose}><X size={15} /></CloseBtn>
        </PanelHead>
        <PanelBody>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '.85rem' }}>
              <div><Label>Client Name *</Label><Input placeholder="Full name" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} required /></div>
              <div><Label>Phone</Label><Input placeholder="0712 345 678" value={form.client_phone} onChange={e => setForm(p => ({ ...p, client_phone: e.target.value }))} /></div>
            </div>

            <div style={{ marginBottom: '.85rem' }}>
              <Label>Deceased Name *<Hint>(name of the deceased)</Hint></Label>
              <Input placeholder="e.g., John Kamau" value={form.deceased_name} onChange={e => setForm(p => ({ ...p, deceased_name: e.target.value }))} required />
            </div>

            <div style={{ marginBottom: '.85rem' }}>
              <Label>Booking Dates *<Hint>(click to select)</Hint></Label>
              <div style={{ width: '100%', padding: '.45rem .65rem', border: `1.5px solid ${hasD ? C.primary : C.border}`, borderRadius: '5px', fontSize: '.78rem', color: C.text, background: C.white, cursor: 'pointer', minHeight: '34px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.25rem', transition: 'border-color .15s' }} onClick={() => { setTmpDates([...dates]); setPkM(dates[0] ? new Date(dates[0] + 'T00:00:00').getMonth() : new Date().getMonth()); setPkY(dates[0] ? new Date(dates[0] + 'T00:00:00').getFullYear() : new Date().getFullYear()); setAnchor(null); setPkOpen(true); }}>
                {hasD ? dates.map(d => { const dt = new Date(d + 'T00:00:00'); return <Chip key={d}><Calendar size={9} />{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Chip>; }) : <span style={{ color: C.textMuted, display: 'flex', alignItems: 'center', gap: '.2rem', fontSize: '.76rem' }}><Calendar size={11} />Click to select dates...</span>}
              </div>
              {hasD && <div style={{ fontSize: '.65rem', color: C.textMuted, marginTop: '.15rem', fontWeight: 500 }}>{dates.length} date{dates.length !== 1 ? 's' : ''} selected{checking ? ' · Checking…' : ` · ${avCount} of ${hearses.length} available`}</div>}
            </div>

            <Divider />

            {/* ─── Hearse selection — date-driven, two-section template design ─── */}
            <div style={{ marginBottom: '.85rem' }}>
              <StepHeader>
                <StepDot>2</StepDot>
                <StepTitle>Available hearses <span>{hasD ? `${(hearses || []).length} vehicles found` : 'select dates first'}</span></StepTitle>
              </StepHeader>

              {checkError && <Warn><span>⚠</span>{checkError}</Warn>}

              {checking && <div style={{ padding: '.8rem', textAlign: 'center', color: C.textMuted, fontSize: '.76rem' }}><Sp />Checking availability…</div>}

              {!checking && !hasHearses && <div style={{ padding: '1rem', textAlign: 'center', color: C.textMuted, fontSize: '.76rem' }}>No hearses registered yet.</div>}

              {!checking && hasHearses && hasD && availList.length === 0 && bookedList.length === 0 && (
                <Warn><span>ⓘ</span>No hearses to show for the selected date(s).</Warn>
              )}

              {!checking && hasHearses && hasD && availList.length > 0 && (
                <div style={{ marginBottom: '1.1rem' }}>
                  <SectionHeader>
                    <SectionDot $green />
                    <SectionLabel>Available Hearses</SectionLabel>
                    <SectionCount>{availList.length}</SectionCount>
                  </SectionHeader>
                  <HearseGrid>
                    {availList.map(h => (
                      <HearseCardTpl key={h.id} h={h} state={fleet[String(h.id)]} hasD={hasD} selected={String(h.id) === String(form.hearse_id)} onPick={() => pick(h)} />
                    ))}
                  </HearseGrid>
                </div>
              )}

              {!checking && hasHearses && hasD && bookedList.length > 0 && (
                <div style={{ marginBottom: '1.1rem' }}>
                  <SectionHeader>
                    <SectionDot />
                    <SectionLabel>Booked Hearses</SectionLabel>
                    <SectionCount>{bookedList.length}</SectionCount>
                  </SectionHeader>
                  <HearseGrid>
                    {bookedList.map(h => (
                      <HearseCardTpl key={h.id} h={h} state={fleet[String(h.id)]} hasD={hasD} selected={false} onPick={() => pickBlocked(h)} />
                    ))}
                  </HearseGrid>
                </div>
              )}

              {!checking && hasHearses && !hasD && allList.length > 0 && (
                <div style={{ marginBottom: '1.1rem' }}>
                  <SectionHeader>
                    <SectionDot $green />
                    <SectionLabel>All Hearses</SectionLabel>
                    <SectionCount>{allList.length}</SectionCount>
                  </SectionHeader>
                  <HearseGrid>
                    {allList.map(h => (
                      <HearseCardTpl key={h.id} h={h} state={fleet[String(h.id)]} hasD={false} selected={String(h.id) === String(form.hearse_id)} onPick={() => pick(h)} />
                    ))}
                  </HearseGrid>
                </div>
              )}

              {/* ─── Selection summary + OPTIONAL total service charge ─── */}
              {hasD && !!form.hearse_id && (
                <ServiceChargeBox>
                  <ChargeRow><span>Hearse</span><span>{selHearse.hearse_name || '—'} ({selHearse.plate_number || '—'})</span></ChargeRow>
                  <ChargeRow><span>Deceased</span><span>{form.deceased_name || '—'}</span></ChargeRow>
                  <ChargeRow><span>Days booked</span><span>{dates.length} — {dates.join(', ')}</span></ChargeRow>
                  <ChargeRow>
                    <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>Total Service Charge</span>
                    <span style={{ fontWeight: 800, color: selTotal > 0 ? '#059669' : C.textMuted }}>{selTotal > 0 ? `KSH ${selTotal.toLocaleString()}` : 'Not set (optional)'}</span>
                  </ChargeRow>
                </ServiceChargeBox>
              )}
            </div>

            <Divider />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '.85rem' }}>
              <div><Label>From Location *</Label><Input placeholder="e.g., Nairobi CBD" value={form.from_location} onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} required /></div>
              <div><Label>To Location *</Label><Input placeholder="e.g., Karen Memorial Park" value={form.to_location} onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} required /></div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <Label>Total Service Charge (KSH)<Hint>(optional — one amount for the whole booking)</Hint></Label>
              <Input type="number" min="0" step="0.01" placeholder="e.g., 15000 (leave blank if not set)" value={form.service_charge || ''} onChange={e => setForm(p => ({ ...p, service_charge: e.target.value }))} />
            </div>

            {/* Branch is detected internally from your auth headers / user profile —
                form.branch_id & form.branch_code are auto-filled and sent with the
                booking, so there is nothing to ask or display here. */}

            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <BtnGhost type="button" onClick={onClose}>Cancel</BtnGhost>
              <BtnPrimary type="submit" disabled={loading}>{loading ? <><SS />Booking...</> : 'Make Booking'}</BtnPrimary>
            </div>
          </form>
        </PanelBody>
      </Panel>

      {/* ─── date picker popover (START → END range selection) ─── */}
      {pkOpen && (
        <PkOv onClick={() => { setAnchor(null); setPkOpen(false); }}>
          <PkBox onClick={e => e.stopPropagation()}>
            <PkHead>
              <div><div style={{ fontSize: '.9rem', fontWeight: 700, color: '#fff' }}>Select Booking Dates</div><div style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.55)' }}>{anchor ? 'Now pick the END date' : 'Click a START date, then an END date'}</div></div>
              <PkClose onClick={() => { setAnchor(null); setPkOpen(false); }}><X size={13} /></PkClose>
            </PkHead>
            <PkBody>
              {/* Days picked so far, and how that compares with the fleet size —
                  these are the two numbers the officer needs before confirming. */}
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: C.primary, marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap' }}>
                <span>{tmpDates.length} day{tmpDates.length !== 1 ? 's' : ''} selected</span>
                <span style={{ color: C.textMuted, fontWeight: 500 }}>· {avCount || 0} of {(hearses || []).length} hearse{(hearses || []).length === 1 ? '' : 's'} available</span>
                {anchor
                  ? <span style={{ color: C.textMuted, fontWeight: 500 }}>· start {new Date(anchor + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — now pick the end</span>
                  : tmpDates.length > 0 && <span style={{ color: C.textMuted, fontWeight: 500 }}>· click another day to start a new range</span>}
              </div>
              {tmpDates.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.2rem', marginBottom: '.6rem' }}>{tmpDates.map(d => { const dt = new Date(d + 'T00:00:00'); return <Chip key={d}>{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Chip>; })}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.55rem' }}>
                <PkNav type="button" aria-label="Previous month" onClick={() => { if (pkM === 0) { setPkM(11); setPkY(p => p - 1); } else setPkM(p => p - 1); }}><ChevronLeft size={13} /></PkNav>
                <div style={{ fontSize: '.9rem', fontWeight: 700, color: C.text }}>
                  {new Date(pkY, pkM, 1).toLocaleString('en-US', { month: 'long' })} {pkY}
                </div>
                <PkNav type="button" aria-label="Next month" onClick={() => { if (pkM === 11) { setPkM(0); setPkY(p => p + 1); } else setPkM(p => p + 1); }}><ChevronRight size={13} /></PkNav>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '.35rem' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '.58rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', padding: '.2rem 0' }}>{w}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
                {(() => {
                  const { d: dayList, ts } = calDays();
                  return dayList.map((day, i) => {
                    if (!day) return <div key={'e' + i} />;
                    const ds = pkY + '-' + pad(pkM + 1) + '-' + pad(day);
                    const past = ds < ts;
                    return (
                      <PkDay key={ds} type="button" $past={past} $sel={tmpDates.includes(ds)} $today={ds === ts}
                        disabled={past}
                        onClick={() => { if (!past) togDate(ds); }}>
                        {day}
                      </PkDay>
                    );
                  });
                })()}
              </div>
            </PkBody>
            <PkFoot>
              <div style={{ marginRight: 'auto' }}>
                <BtnGhost type="button" onClick={cancelRange}>Clear</BtnGhost>
              </div>
              <BtnGhost type="button" onClick={() => { setAnchor(null); setPkOpen(false); }}>Close</BtnGhost>
              <BtnPrimary type="button" onClick={confirmDates} disabled={tmpDates.length === 0}>Confirm ({tmpDates.length})</BtnPrimary>
            </PkFoot>
          </PkBox>
        </PkOv>
      )}
    </>
  );
}