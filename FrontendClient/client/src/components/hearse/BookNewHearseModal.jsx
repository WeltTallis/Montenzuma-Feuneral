import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';
import { X, Calendar, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

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
};

const formatDateStr = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

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

const ScrollWrap = styled.div`position:relative;margin:0 -1.15rem;padding:0 2rem`;

const ScrollTrack = styled.div`
  display:flex;gap:.5rem;overflow-x:auto;scroll-behavior:smooth;
  scroll-snap-type:x mandatory;padding:.3rem .1rem .4rem;
  -webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{display:none}-ms-overflow-style:none;scrollbar-width:none;
`;

const Arrow = styled.button`
  position:absolute;top:50%;transform:translateY(-50%);z-index:5;
  width:28px;height:28px;border-radius:50%;border:1px solid ${C.border};
  background:#fff;color:${C.textSec};cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 6px rgba(0,0,0,.1);transition:all .15s;
  &:hover{background:${C.primary};color:#fff;border-color:${C.primary}}
  &:disabled{opacity:0;pointer-events:none}
  ${p => p.$dir === 'left' ? 'left:5px' : 'right:5px'}
`;

/* ─── Card ─── */
const Card = styled.button`
  flex-shrink:0;
  width:148px;
  scroll-snap-align:start;
  padding:0;
  border-radius:8px;
  border:1.5px solid ${p => p.$sel ? 'rgba(44,138,201,.5)' : p.$bk ? '#dc2626' : 'rgba(3,7,30,.6)'};
  background:${p => p.$bk ? C.danger : C.cardBg};
  cursor:${p => p.$off ? 'not-allowed' : 'pointer'};
  transition:border-color .15s,opacity .15s,background .15s;
  opacity:${p => p.$bk ? '0.85' : p.$off ? '0.35' : '1'};
  text-align:left;
  display:flex;
  flex-direction:column;
  position:relative;
`;

const CardIn = styled.div`padding:.45rem .5rem;display:flex;flex-direction:column;flex:1`;

const CN = styled.div`font-size:.66rem;font-weight:700;color:rgba(255,255,255,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.08rem;`;

const CP = styled.div`font-size:.58rem;font-weight:600;color:rgba(255,255,255,.38);display:flex;align-items:center;gap:.15rem;letter-spacing:.03em;margin-bottom:.12rem;`;

const CM = styled.div`display:flex;gap:.12rem;flex-wrap:wrap`;

const CT = styled.span`padding:.02rem .22rem;border-radius:3px;font-size:.48rem;font-weight:600;background:rgba(255,255,255,.08);color:rgba(255,255,255,.42);`;

const CR = styled.div`margin-top:auto;padding-top:.18rem;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;`;

const CD = styled.span`
  display:flex;align-items:center;gap:.12rem;
  font-size:.48rem;font-weight:700;text-transform:uppercase;letter-spacing:.02em;
  color:${p => p.$c};
  &::before{content:'';width:4px;height:4px;border-radius:50%;background:${p => p.$d};flex-shrink:0}
`;

const CS = styled.span`font-size:.48rem;font-weight:700;color:rgba(44,138,201,.9)`;

const CC = styled.div`position:absolute;top:.22rem;right:.22rem;width:14px;height:14px;border-radius:50%;background:${C.primary};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.45rem;font-weight:800;`;

const CB = styled.div`margin-top:.12rem;font-size:.42rem;font-weight:500;color:rgba(255,255,255,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;

const Warn = styled.div`padding:.55rem .7rem;border-radius:5px;background:#fffbeb;border:1px solid #fde68a;color:#b45309;font-size:.72rem;font-weight:600;display:flex;align-items:center;gap:.35rem;animation:${fadeIn}.15s;`;

const SBar = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem;`;
const SD = styled.span`display:inline-flex;align-items:center;gap:.2rem;font-size:.65rem;font-weight:600;color:${C.textSec};&::before{content:'';width:5px;height:5px;border-radius:50%;background:${p => p.$c}}`;

const Sp = styled.div`width:18px;height:18px;border:2.5px solid ${C.border};border-top-color:${C.primary};border-radius:50%;animation:${spinKf}.6s linear infinite;margin:0 auto .35rem;`;
const SS = styled.span`width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:${spinKf}.6s linear infinite;display:inline-block;`;

const PkOv = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);padding:1rem`;
const PkBox = styled.div`background:#fff;border-radius:10px;width:400px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 16px 32px rgba(0,0,0,.12);animation:${popIn}.12s`;
const PkHead = styled.div`padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${C.primaryDark},${C.primary});border-radius:10px 10px 0 0`;
const PkClose = styled.button`width:26px;height:26px;border-radius:5px;background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(255,255,255,.2)}`;
const PkBody = styled.div`padding:.9rem 1rem`;
const PkNav = styled.button`width:26px;height:26px;border-radius:5px;border:1px solid ${C.border};background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${C.textSec};font-size:14px;&:hover{background:${C.bg}}`;
const PkFoot = styled.div`display:flex;gap:.5rem;justify-content:flex-end;margin-top:.85rem;border-top:1px solid ${C.border};padding-top:.85rem`;

// ═══════════════════════════════════════════════════════
export default function BookNewHearseModal({
  open = false, initialDates = [], hearses = [], branches = [],
  onClose, onCreated, showToast,
}) {
  const scrollRef = useRef(null);
  const [sL, setSL] = useState(false);
  const [sR, setSR] = useState(false);
  const [form, setForm] = useState({ hearse_id: '', client_name: '', client_phone: '', from_location: '', to_location: '', destination: '', booking_dates: [], branch_id: '', booking_date: '' });
  const [dates, setDates] = useState([]);
  const [pkOpen, setPkOpen] = useState(false);
  const [tmpDates, setTmpDates] = useState([]);
  const [pkM, setPkM] = useState(() => new Date().getMonth());
  const [pkY, setPkY] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [fleet, setFleet] = useState({});

  const updArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setSL(el.scrollLeft > 3);
    setSR(el.scrollLeft < el.scrollWidth - el.clientWidth - 3);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updArrows();
    el.addEventListener('scroll', updArrows, { passive: true });
    window.addEventListener('resize', updArrows);
    return () => { el.removeEventListener('scroll', updArrows); window.removeEventListener('resize', updArrows); };
  }, [updArrows, dates, fleet]);

  useEffect(() => { const t = setTimeout(updArrows, 50); return () => clearTimeout(t); }, [fleet, updArrows]);

  const doScroll = (dir) => { const el = scrollRef.current; if (el) el.scrollBy({ left: dir === 'l' ? -155 : 155, behavior: 'smooth' }); };

  useEffect(() => {
    if (!open) return;
    const d = Array.isArray(initialDates) ? initialDates.filter(Boolean) : [];
    setDates(d);
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const db = u?.dbName || u?.branchDbName || '';
    setForm({ hearse_id: '', client_name: '', client_phone: '', from_location: '', to_location: '', destination: '', booking_dates: d, branch_id: u?.branch_id || '', branch_code: db.split('-').pop() || '', booking_date: d[0] || '' });
    setTmpDates([]); setPkOpen(false); setFleet({}); setSL(false); setSR(false);
  }, [open, initialDates]);

  const checkFleet = useCallback(async (d) => {
    if (!d || !d.length) { setFleet({}); return; }
    setChecking(true);
    try {
      const hdr = getAuthHeaders();
      const res = await Promise.all(d.map(async (date) => {
        try { const r = await fetch(`${API_BASE_URL}/availability/check-by-date?date=${date}`, { headers: hdr }); if (!r.ok) return null; const j = await r.json(); return { date, avail: j.available_hearses || [], booked: j.booked_hearses || [] }; } catch { return null; }
      }));
      const m = {};
      (hearses || []).forEach(h => { m[String(h.id)] = { status: 'available', bookedFor: [] }; });
      res.forEach(day => {
        if (!day) return;
        (hearses || []).forEach(h => { if (['maintenance', 'out_of_service', 'disabled'].includes(h.status)) m[String(h.id)] = { status: 'maintenance', bookedFor: [] }; });
        (day.booked || []).forEach(bh => { const id = String(bh.hearse_id); if (!m[id]) return; if (!m[id].bookedFor.some(x => x.date === day.date)) m[id].bookedFor.push({ date: day.date, client: bh.client_name || bh.booking_code || 'Booked' }); m[id].status = 'booked'; });
        const ak = new Set((day.avail || []).map(a => String(a.id)));
        (hearses || []).forEach(h => { const k = String(h.id); if (m[k].status === 'maintenance') return; if (!ak.has(k)) m[k].status = 'booked'; });
      });
      setFleet(m);
    } catch { }
    setChecking(false);
  }, [hearses]);

  useEffect(() => { if (open) checkFleet(dates); }, [open, dates, checkFleet]);

  const pick = (h) => {
    if (dates.length > 0) { const s = fleet[String(h.id)]; if (s && s.status !== 'available') { showToast(`${h.hearse_name || 'This hearse'} is not available on the selected date(s).`, 'error'); return; } }
    setForm(p => ({ ...p, hearse_id: h.id }));
  };

  const togDate = (ds) => { setTmpDates(p => p.includes(ds) ? p.filter(d => d !== ds) : [...p, ds].sort()); };

  const confirmDates = () => {
    setDates(tmpDates);
    setForm(p => ({ ...p, booking_dates: tmpDates, booking_date: tmpDates[0] || '' }));
    setPkOpen(false);
    if (form.hearse_id) { const s = fleet[String(form.hearse_id)]; if (s && s.status !== 'available') setForm(p => ({ ...p, hearse_id: '' })); }
  };

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.hearse_id || !form.client_name || !form.from_location || !form.to_location || !dates.length) { showToast('Please fill all required fields and select at least one date', 'error'); return; }
    const s = fleet[String(form.hearse_id)];
    if (s && s.status !== 'available') { showToast(`This hearse is already booked for: ${s.bookedFor.map(b => `${b.date} (${b.client})`).join(', ') || 'the selected date(s)'}.`, 'error'); return; }
    setLoading(true);
    try {
      const hdr = getAuthHeaders(); hdr['Content-Type'] = 'application/json';
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u?.branch_id) hdr['x-branch-id'] = u.branch_id;
      if (u?.email) hdr['x-user-email'] = u.email;
      hdr['x-user-name'] = u?.full_name || u?.username || u?.name || 'System';
      const fd = dates.length > 0 ? dates[0] + 'T00:00:00' : new Date().toISOString();
      const body = { hearse_id: form.hearse_id, client_name: form.client_name, client_phone: form.client_phone || '', from_location: form.from_location, to_location: form.to_location, destination: form.to_location, from_timestamp: fd, booking_date: fd, booking_dates: dates, booked_by: getLocalUserName() || u?.email || 'System', branch_id: form.branch_id || u?.branch_id || '', branch_code: form.branch_code || u?.branch_code || '' };
      const r = await fetch(`${API_BASE_URL}/hearse-bookings`, { method: 'POST', headers: hdr, body: JSON.stringify(body) });
      if (!r.ok) { const ed = await r.json().catch(() => ({})); if (r.status === 409) throw new Error(ed.message || 'Just booked by another user.'); throw new Error(ed.message || `HTTP ${r.status}`); }
      showToast('Booking created successfully!', 'success'); setFleet({}); if (onClose) onClose(); if (onCreated) await onCreated();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    setLoading(false);
  }, [form, dates, fleet, showToast, onClose, onCreated]);

  const bOpts = branches.length > 0 ? branches : [];
  const avCount = Object.values(fleet).filter(s => s.status === 'available').length;
  const bkCount = Object.values(fleet).filter(s => s.status === 'booked').length;
  const mtCount = Object.values(fleet).filter(s => s.status === 'maintenance').length;
  const hasD = dates.length > 0;
  const hasHearses = hearses.length > 0;
  const showArr = hasHearses && !checking;
  // When dates are selected, ONLY available hearses render — booked,
  // maintenance or out-of-service hearses are hidden from the carousel.
  const visibleHearses = hasD
    ? (hearses || []).filter(h => { const s = fleet[String(h.id)]; return !s || s.status === 'available'; })
    : (hearses || []);

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
              <Label>Booking Dates *<Hint>(click to select)</Hint></Label>
              <div style={{ width: '100%', padding: '.45rem .65rem', border: `1.5px solid ${hasD ? C.primary : C.border}`, borderRadius: '5px', fontSize: '.78rem', color: C.text, background: C.white, cursor: 'pointer', minHeight: '34px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.25rem', transition: 'border-color .15s' }} onClick={() => { setTmpDates([...dates]); setPkM(new Date().getMonth()); setPkY(new Date().getFullYear()); setPkOpen(true) }}>
                {hasD ? dates.map(d => { const dt = new Date(d + 'T00:00:00'); return <Chip key={d}><Calendar size={9} />{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Chip> }) : <span style={{ color: C.textMuted, display: 'flex', alignItems: 'center', gap: '.2rem', fontSize: '.76rem' }}><Calendar size={11} />Click to select dates...</span>}
              </div>
              {hasD && <div style={{ fontSize: '.65rem', color: C.textMuted, marginTop: '.15rem', fontWeight: 500 }}>{dates.length} date{dates.length !== 1 ? 's' : ''} selected{checking ? ' · Checking…' : ` · ${avCount} of ${hearses.length} available`}</div>}
            </div>

            <Divider />

            {/* ─── Hearse carousel — ALWAYS visible with #03071E bg ─── */}
            <div style={{ marginBottom: '.85rem' }}>
              <Label style={{ marginBottom: '.35rem' }}>Select Hearse *</Label>

              {!hasD && <Warn><span>ⓘ</span>Select dates above to check availability.</Warn>}

              {checking && <div style={{ padding: '.8rem', textAlign: 'center', color: C.textMuted, fontSize: '.76rem' }}><Sp />Checking availability…</div>}

              {hasD && !checking && (
                <SBar>
                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    <SD $c="#10b981">{avCount} avail</SD>
                    <SD $c="#ef4444">{bkCount} booked</SD>
                    {mtCount > 0 && <SD $c="#8b5cf6">{mtCount} maint</SD>}
                  </div>
                  <div style={{ fontSize: '.58rem', color: C.textMuted }}>Scroll →</div>
                </SBar>
              )}

              {hasD && !checking && visibleHearses.length === 0 && (
                <Warn><span>ⓘ</span>All hearses are booked or under maintenance on the selected date(s). Try different dates.</Warn>
              )}

              {showArr && visibleHearses.length > 0 && (
                <ScrollWrap>
                  <Arrow type="button" $dir="left" disabled={!sL} onClick={e => { e.preventDefault(); e.stopPropagation(); doScroll('l'); }}><ChevronLeft size={13} /></Arrow>
                  <ScrollTrack ref={scrollRef}>
                    {visibleHearses.map(h => {
                      const sel = String(h.id) === String(form.hearse_id);
                      const st = fleet[String(h.id)];
                      const bk = hasD && st && st.status === 'booked';
                      const mt = hasD && st && st.status === 'maintenance';
                      const off = bk || mt;

                      let dc, lc, lb;
                      if (bk) { dc = '#dc2626'; lc = '#ffffff'; lb = 'Booked'; }
                      else if (mt) { dc = '#8b5cf6'; lc = '#c4b5fd'; lb = 'Maint.'; }
                      else if (hasD) { dc = '#10b981'; lc = '#6ee7b7'; lb = 'Available'; }

                      return (
                        <Card key={h.id} type="button" $sel={sel} $bk={bk} $off={off} onClick={e => { e.preventDefault(); pick(h); }}>
                          {sel && <CC>✓</CC>}
                          <CardIn>
                            <CN title={h.hearse_name || 'Unnamed'}>{h.hearse_name || 'Unnamed Hearse'}</CN>
                            <CP><span style={{ fontSize: '.65rem' }}>🚛</span>{h.plate_number || h.number_plate || '—'}</CP>
                            <CM>
                              {h.model && <CT>{h.model}</CT>}
                              {h.capacity && <CT>{h.capacity} seats</CT>}
                            </CM>
                            {hasD && (
                              <CR>
                                <CD $d={dc} $c={lc}>{lb}</CD>
                                {sel && <CS>Selected</CS>}
                              </CR>
                            )}
                            {bk && st.bookedFor.length > 0 && <CB>{st.bookedFor.map(b => b.date).join(', ')}</CB>}
                          </CardIn>
                        </Card>
                      );
                    })}
                  </ScrollTrack>
                  <Arrow type="button" $dir="right" disabled={!sR} onClick={e => { e.preventDefault(); e.stopPropagation(); doScroll('r'); }}><ChevronRight size={13} /></Arrow>
                </ScrollWrap>
              )}

              {!hasHearses && <div style={{ padding: '1rem', textAlign: 'center', color: C.textMuted, fontSize: '.76rem' }}>No hearses registered yet.</div>}
            </div>

            <Divider />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '.85rem' }}>
              <div><Label>From Location *</Label><Input placeholder="e.g., Nairobi CBD" value={form.from_location} onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} required /></div>
              <div><Label>To Location *</Label><Input placeholder="e.g., Karen Memorial Park" value={form.to_location} onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} required /></div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <Label>Branch<Hint>(auto-filled)</Hint></Label>
              <Input value={form.branch_id ? (bOpts.find(b => String(b.branch_id) === String(form.branch_id))?.branch_name || `Branch #${form.branch_id}`) : 'Auto-filled from your profile'} disabled readOnly />
            </div>

            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <BtnGhost type="button" onClick={onClose}>Cancel</BtnGhost>
              <BtnPrimary type="submit" disabled={loading}>{loading ? <><SS />Booking...</> : 'Make Booking'}</BtnPrimary>
            </div>
          </form>
        </PanelBody>
      </Panel>

      {pkOpen && (
        <PkOv onClick={() => setPkOpen(false)}>
          <PkBox onClick={e => e.stopPropagation()}>
            <PkHead>
              <div><div style={{ fontSize: '.9rem', fontWeight: 700, color: '#fff' }}>Select Booking Dates</div><div style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.55)' }}>Click to toggle</div></div>
              <PkClose onClick={() => setPkOpen(false)}><X size={13} /></PkClose>
            </PkHead>
            <PkBody>
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: C.primary, marginBottom: '.35rem' }}>{tmpDates.length} date{tmpDates.length !== 1 ? 's' : ''} selected</div>
              {tmpDates.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.2rem', marginBottom: '.6rem' }}>{tmpDates.map(d => { const dt = new Date(d + 'T00:00:00'); return <Chip key={d}>{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Chip> })}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.55rem' }}>
                <PkNav type="button" onClick={() => { if (pkM === 0) { setPkM(11); setPkY(p => p - 1) } else setPkM(p => p - 1) }}></PkNav>
                <div style={{ fontSize: '.85rem', fontWeight: 700, color: C.text }}>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pkM]} {pkY}</div>
                <PkNav type="button" onClick={() => { if (pkM === 11) { setPkM(0); setPkY(p => p + 1) } else setPkM(p => p + 1) }}></PkNav>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => <div key={w} style={{ textAlign: 'center', fontSize: '.6rem', fontWeight: 700, color: C.textMuted, padding: '.3rem 0' }}>{w}</div>)}
                {(() => { const { d: days, ts } = calDays(); return days.map((day, i) => { if (day === null) return <div key={`e${i}`} />; const ds = `${pkY}-${String(pkM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const isT = ds === ts; const isS = tmpDates.includes(ds); const isP = new Date(ds + 'T00:00:00') < new Date(ts + 'T00:00:00'); return <div key={ds} style={{ textAlign: 'center', padding: '.38rem 0', cursor: isP ? 'not-allowed' : 'pointer', borderRadius: '5px', fontSize: '.78rem', fontWeight: isS ? 700 : 500, background: isS ? C.primary : isT ? '#f0fdf4' : 'transparent', color: isS ? '#fff' : isP ? '#ccc' : isT ? '#059669' : C.text, border: isT && !isS ? '1px solid ' + '#10b981' : '1px solid transparent', transition: 'all .1s' }} onClick={() => !isP && togDate(ds)}>{day}</div> }) })()}
              </div>
              <PkFoot>
                <BtnGhost type="button" onClick={() => setPkOpen(false)}>Cancel</BtnGhost>
                <BtnPrimary type="button" onClick={confirmDates} disabled={!tmpDates.length}>Confirm ({tmpDates.length})</BtnPrimary>
              </PkFoot>
            </PkBody>
          </PkBox>
        </PkOv>
      )}
    </>
  );
}