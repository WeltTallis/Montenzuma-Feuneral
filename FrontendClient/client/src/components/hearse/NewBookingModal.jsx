import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';


const API_BASE_URL = import.meta.env.PROD
    ? 'https://restpoint.co.ke/api/v1/restpoint'
    : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const C = {
    primary: '#1a5f7a', primaryDark: '#155067', primaryLight: '#2c8ac9', primarySoft: '#e6f1f5', primaryHair: '#dbeafe',
    bgSoft: '#f8fafc', bgElev: '#ffffff',
    text: '#111827', textSoft: '#334155', textMuted: '#94a3b8', textMuted2: '#64748b',
    ok: '#059669', okSoft: '#d1fae5', okHair: '#bbf7d0',
    bad: '#dc2626', badSoft: '#fee2e2', badHair: '#fecaca',
    warn: '#b45309', warnSoft: '#fef3c7',
    card: '#ffffff', line: '#e2e8f0', lineStrong: '#cbd5e1',
    shadow: '0 20px 50px -12px rgba(15,23,42,.22)',
    radius: '12px',
};

const getTenantSlug = () => {
    const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
    if (direct && direct !== 'default' && direct !== 'undefined' && direct !== 'null') return direct;
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.parentTenantSlug || u.tenantSlug || u.tenant?.slug || '';
    } catch { return ''; }
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
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
};
const authUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };
const getLocalUserName = () => { const u = authUser(); return u.full_name || u.username || u.name || ''; };
const cs = (s) => (s ? String(s).replace(/\s+/g, ' ').trim() : '');
const fmtDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');
const fmtMoney = (n) => 'KES ' + Number(n || 0).toLocaleString('en-US');

/* Location suggestions — clickable chips (not a dropdown). Manual typing still works. */
const LOC_SUGG = ['Montenzuma Thika', 'Montenzuma Nairobi', 'Montenzuma Machakos', 'Home'];

/* ════════════════════════ STYLES ════════════════════════ */
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const popIn = keyframes`from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); }`;
const pulse = keyframes`0%,100% { opacity: .35; } 50% { opacity: 1; }`;
const rot = keyframes`to { transform: rotate(360deg); }`;
const hatch = keyframes`0% { background-position: 0 0; } 100% { background-position: 40px 40px; }`;
const chirp = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(26,95,122,.45); } 50% { box-shadow: 0 0 0 6px rgba(26,95,122,0); }`;

const Scrim = styled.div`
  position: fixed; inset: 0; z-index: 6000; background: rgba(15,23,42,.45);
  opacity: ${(p) => (p.$open ? 1 : 0)}; pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
  transition: opacity .3s ease;
`;
const Drawer = styled.aside`
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 6100;
  width: min(440px, 100vw); background: #fff; display: flex; flex-direction: column;
  box-shadow: -30px 0 80px rgba(2,12,27,.35);
  transform: translateX(${(p) => (p.$open ? '0' : '103%')});
  transition: transform .38s cubic-bezier(.32,.72,0,1);
  visibility: ${(p) => (p.$open ? 'visible' : 'hidden')};
  transition: transform .38s cubic-bezier(.32,.72,0,1), visibility 0s linear ${(p) => (p.$open ? '0s' : '.38s')};
`;
const PHead = styled.header`
  flex-shrink: 0; display: flex; align-items: center; gap: .85rem;
  padding: .95rem 1.25rem; background: linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%); color: #fff; position: relative; overflow: hidden;
  &::after{ content:''; position:absolute; inset:0; pointer-events:none; background:radial-gradient(120% 80% at left , rgba(255,255,255,.16), transparent 55%); }
`;
const HeadText = styled.div`flex: 1; min-width: 0;`;
const Title = styled.h1`font-size: .98rem; font-weight: 800; letter-spacing: -.01em;`;
const Sub = styled.p`font-size: .7rem; opacity: .75; margin-top: .15rem; font-weight: 500;`;
const XBtn = styled.button`
  width: 30px; height: 30px; flex-shrink: 0; border: none; border-radius: 8px;
  background: rgba(255,255,255,.15); color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background .15s;
  &:hover { background: rgba(255,255,255,.3); }
`;
const PBody = styled.div`
  flex: 1; overflow-y: auto; padding: 1rem 1.25rem 1.2rem;
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: #dbe3ec; border-radius: 8px; border: 2px solid #fff; }
  &::-webkit-scrollbar-track { background: transparent; }
`;
const Sec = styled.section`
  padding: 1rem 0;
  & + & { border-top: 1px solid ${C.line}; }
  &:first-child { padding-top: .2rem; }
`;
const SecTop = styled.div`
  display: flex; align-items: baseline; justify-content: space-between; margin-bottom: .8rem;
  @media (max-width: 560px) { margin-bottom: .6rem; }
  h2 { font-size: .7rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: ${C.textMuted2}; }
`;
const Num = styled.i`font-style: normal; color: ${C.primary}; margin-right: .4rem;`;
const Hint = styled.small`font-size: .66rem; color: ${C.textMuted2}; font-weight: 700;`;

/* calendar — always open, tap = select */
const CalTop = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem;
  b { font-size: .85rem; font-weight: 800; }
`;
const Nav = styled.div`display: flex; gap: .35rem;`;
const NavBtn = styled.button`
  width: 28px; height: 28px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
  cursor: pointer; font-weight: 700; color: ${C.textMuted2}; font-size: 13px; transition: .15s;
  display: grid; place-items: center;
  &:hover { border-color: ${C.primary}; color: ${C.primary}; }
`;
const CalGrid = styled.div`display: grid; grid-template-columns: repeat(7,1fr); gap: 3px;`;
const Wd = styled.span`
  text-align: center; font-size: .58rem; font-weight: 700; color: ${C.textMuted};
  text-transform: uppercase; padding: .25rem 0;
`;
const DayCell = styled.button`
  aspect-ratio: 1; display: grid; place-items: center; font-size: .78rem; font-weight: 600;
  border: none; border-radius: 8px; background: transparent; color: ${C.text};
  cursor: ${(p) => (p.$past ? 'not-allowed' : 'pointer')}; transition: .12s;
  ${(p) => (!p.$past && !p.$sel ? '&:hover { background: #eaf4fa; }' : '')}
  background: ${(p) => (p.$sel ? C.primary : p.$today ? '#d1fae5' : 'transparent')};
  color: ${(p) => (p.$sel ? '#fff' : p.$past ? '#cbd5e1' : C.text)};
  font-weight: ${(p) => (p.$sel ? 800 : 600)};
  box-shadow: ${(p) => (p.$today && !p.$sel ? 'inset 0 0 0 2px ' + C.ok : 'none')};
  text-decoration: ${(p) => (p.$past ? 'line-through' : 'none')};
  ${(p) => (p.$today && !p.$sel ? '&:focus-visible{ box-shadow: 0 0 0 3px rgba(5,150,105,.3); }' : '')}
`;
const SelLine = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: .7rem;
  margin-top: .8rem; padding: .55rem .6rem; border-radius: 10px;
  background: ${C.primarySoft}; border: 1px solid #dbeafe;
`;
const SelTxt = styled.span`
  font-size: .72rem; font-weight: 700; line-height: 1.5; color: ${C.primary};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const ClearBtn = styled.button`
  background: none; border: none; font-size: .66rem; font-weight: 800; color: ${C.bad};
  cursor: pointer; padding: 2px 5px; flex-shrink: 0; border-radius: 6px;
  transition: color .15s, background .15s;
  &:hover{ color: #b91c1c; background: ${C.badSoft}; }
`;

/* fleet — dot status, no pills */
const FleetList = styled.div`display: flex; flex-direction: column; gap: .45rem;`;
const HearseRow = styled.button`
  width: 100%; display: flex; align-items: center; gap: .6rem; text-align: left;
  padding: .6rem .7rem; border: 1.5px solid ${C.lineStrong}; border-radius: ${C.radius}; background: #fff;
  cursor: ${(p) => (p.$off || p.$dim ? 'not-allowed' : 'pointer')};
  transition: border-color .15s, background .15s, box-shadow .15s;
  ${(p) => (p.$sel ? `border-color: ${C.primary}; background: #f0f9ff; box-shadow: 0 0 0 3px rgba(26,95,122,.08);` : '')}
  ${(p) => (p.$off ? 'opacity: .55;' : '')}
  ${(p) => (!p.$off && !p.$dim ? `&:hover { border-color: ${C.primary}; }` : '')}
  &:focus-visible{ outline: none; box-shadow: 0 0 0 3px rgba(26,95,122,.16); }
`;
const Ava = styled.span`
  width: 34px; height: 34px; border-radius: 10px; background: ${C.primarySoft}; color: ${C.primary};
  font-weight: 900; font-size: .95rem; display: grid; place-items: center; flex-shrink: 0;
`;
const HInfo = styled.span`flex: 1; min-width: 0;`;
const HName = styled.b`
  display: block; font-size: .8rem; font-weight: 800; color: ${C.text};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const HMeta = styled.small`
  display: block; font-size: .66rem; color: ${C.textMuted2}; margin-top: .1rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const St = styled.span`display: flex; align-items: center; gap: .35rem; flex-shrink: 0;`;
const StLabel = styled.em`
  font-style: normal; font-size: .66rem; font-weight: 800;
  ${(p) => (p.$free ? `color: ${C.ok}` : p.$busy ? `color: ${C.bad}` : `color: ${C.textMuted2}`)};
`;
const Dot = styled.span`
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: ${(p) => (p.$kind === 'free' ? C.ok : p.$kind === 'busy' ? C.bad : C.textMuted2)};
  ${(p) => (p.$kind === 'wait' ? `animation: ${pulse} 1.1s infinite;` : '')}
`;
const Radio = styled.span`
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid ${C.lineStrong}; background: #fff;
  display: grid; place-items: center; transition: .15s;
  &::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: ${C.primary};
    transform: ${(p) => (p.$on ? 'scale(1)' : 'scale(0)')}; transition: transform .15s; }
`;
const EmptyNote = styled.p`
  font-size: .73rem; color: ${C.textMuted}; background: ${C.bgSoft};
  border: 1px dashed ${C.lineStrong}; border-radius: ${C.radius}; padding: .75rem .85rem;
  cursor: default; transition: border-color .15s;
`;

/* details */
const Row2 = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: .55rem;
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;
const Fld = styled.div`margin-bottom: .6rem;`;
const Label = styled.label`
  display: block; font-size: .68rem; font-weight: 800; color: ${C.textMuted2}; margin-bottom: .25rem;
  em { color: ${C.bad}; font-style: normal; }
`;
const Input = styled.input`
  width: 100%; padding: .55rem .7rem; font: inherit; font-size: .82rem; color: ${C.text};
  border: 1.5px solid ${C.lineStrong}; border-radius: 10px; outline: none; transition: .16s; background: #fff;
  &::placeholder{ color: #cbd5e1; }
  &:focus{ border-color: ${C.primary}; box-shadow: 0 0 0 4px rgba(26,95,122,.12); }
`;
const ChargeWrap = styled.div`
  display: flex; align-items: stretch; border: 1.5px solid ${C.lineStrong}; border-radius: 10px; overflow: hidden; transition: .16s; background: #fff;
  &:focus-within { border-color: ${C.primary}; box-shadow: 0 0 0 4px rgba(26,95,122,.12); }
  span { display: flex; align-items: center; padding: .55rem .7rem; background: ${C.bgSoft};
    font-size: .7rem; font-weight: 800; color: ${C.textMuted2}; border-right: 1px solid #e5e7eb; }
  input { border: none; box-shadow: none; flex: 1; min-width: 0;
    &:focus { box-shadow: none; } &::placeholder{ color: #cbd5e1; } }
`;
const ErrBox = styled.div`
  display: ${(p) => (p.$show ? 'block' : 'none')}; margin-top: .6rem; padding: .55rem .7rem;
  border-radius: 10px; background: ${C.badSoft}; color: ${C.bad};
  font-size: .72rem; font-weight: 700; border: 1px solid ${C.badHair};
`;

/* location suggestions — chips, not a dropdown */
const SuggWrap = styled.div`
  display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .35rem;
`;
const SuggChip = styled.button`
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .32rem .6rem; border: 1px solid ${C.lineStrong}; border-radius: 999px;
  background: #fff; color: ${C.textMuted2}; font-size: .7rem; font-weight: 700;
  cursor: pointer; transition: .16s; white-space: nowrap;
  &:hover { border-color: ${C.primary}; color: ${C.primary}; background: ${C.primarySoft}; }
  &:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(26,95,122,.16); }
`;

/* footer */
const PFoot = styled.footer`
  flex-shrink: 0; border-top: 1px solid ${C.line}; padding: .8rem 1.2rem; background: ${C.bgSoft};
`;
const Sum = styled.div`
  font-size: .72rem; font-weight: 800; color: ${C.textMuted2}; margin-bottom: .7rem;
  min-height: 1rem; line-height: 1.5; padding: .5rem .7rem; border-radius: 9px;
  ${(p) => (p.$ok ? `color: ${C.ok}; background: ${C.okSoft}; border: 1px solid ${C.okHair};` : '')}
  ${(p) => (p.$bad ? `color: ${C.bad}; background: ${C.badSoft}; border: 1px solid ${C.badHair};` : '')}
`;
const Acts = styled.div`display: flex; gap: .55rem;`;
const GhostBtn = styled.button`
  border: none; border-radius: 10px; font-size: .8rem; font-weight: 800; cursor: pointer;
  padding: .65rem 1rem; background: #fff; border: 1.5px solid ${C.lineStrong}; color: ${C.textMuted2};
  transition: .16s;
  &:hover { background: #eef2f6; border-color: ${C.textMuted2}; }
  &:focus-visible{ outline: none; box-shadow: 0 0 0 4px rgba(26,95,122,.16); }
`;
const GoBtn = styled.button`
  flex: 1; border: none; border-radius: 10px; font-size: .8rem; font-weight: 800; cursor: pointer;
  padding: .65rem 1rem; background: ${C.primary}; color: #fff; transition: .16s;
  &:hover:not(:disabled) { background: ${C.primaryDark}; }
  &:disabled{ opacity: .45; cursor: not-allowed; filter: saturate(.8); }
  &:focus-visible{ outline: none; box-shadow: 0 0 0 4px rgba(26,95,122,.2); }
`;
const Spin = styled.span`
  display: inline-block; width: 13px; height: 13px;
  border: 2.5px solid rgba(255,255,255,.32); border-top-color: #fff; border-radius: 50%;
  vertical-align: -2px; animation: ${rot} .7s linear infinite;
`;

/* toast */
const Toast = styled.div`
  position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, ${(p) => (p.$show ? '0' : '14px')});
  z-index: 9000; background: #0f172a; color: #fff; padding: .75rem 1.2rem; border-radius: 12px;
  font-size: .78rem; font-weight: 700; opacity: ${(p) => (p.$show ? 1 : 0)};
  pointer-events: none; transition: .25s; max-width: 90vw;
  box-shadow: 0 14px 28px -8px rgba(15,23,42,.35);
`;

/* ════════════════════════ COMPONENT ════════════════════════ */
export default function NewBookingModal({ open, onClose, hearses = [], prefillDates = [], onCreated }) {
    const EMPTY_FORM = { client_name: '', client_phone: '', deceased_name: '', from_location: '', to_location: '' };
    const [form, setForm] = useState(EMPTY_FORM);
    const [charge, setCharge] = useState('');           // formatted display string
    const [dates, setDates] = useState([]);
    const [hearseId, setHearseId] = useState('');
    const [pm, setPm] = useState(new Date().getMonth());
    const [py, setPy] = useState(new Date().getFullYear());
    const [avail, setAvail] = useState({});
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState('');
    const [toast, setToast] = useState('');
    const [showFromSugg, setShowFromSugg] = useState(false);
    const [showToSugg, setShowToSugg] = useState(false);
    const toastT = useRef(null);
    const closeT = useRef(null);

    const showToast = (m) => {
        setToast(m);
        clearTimeout(toastT.current);
        toastT.current = setTimeout(() => setToast(''), 3000);
    };

    /* fresh slate every time the panel opens */
    useEffect(() => {
        if (!open) return;
        setForm(EMPTY_FORM);
        setCharge('');
        const seed = (Array.isArray(prefillDates) ? prefillDates : []).filter(Boolean);
        setDates(seed);
        const base = seed[0] ? new Date(seed[0] + 'T00:00:00') : new Date();
        setPm(base.getMonth()); setPy(base.getFullYear());
        setHearseId(''); setAvail({}); setChecking(false);
        setSubmitting(false); setDone(false); setErr(''); setToast('');
        clearTimeout(closeT.current);
    }, [open]); /* eslint-disable-line react-hooks/exhaustive-deps */

    useEffect(() => () => { clearTimeout(toastT.current); clearTimeout(closeT.current); }, []);

    /* DATE-FIRST availability: whenever the selected dates change, check EVERY
       hearse in parallel so step 2 shows live availability for the whole fleet. */
    useEffect(() => {
        if (!open || dates.length === 0 || !Array.isArray(hearses) || hearses.length === 0) { setAvail({}); return; }
        let dead = false;
        setChecking(true);
        const t = setTimeout(async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const user = authUser();
            if (user?.branch_id) headers['x-branch-id'] = user.branch_id;
            if (user?.email) headers['x-user-email'] = user.email;
            headers['x-user-name'] = user?.full_name || user?.username || user?.name || 'System';
            try {
                const results = await Promise.all(hearses.map(async (h) => {
                    try {
                        const r = await fetch(API_BASE_URL + '/hearse-bookings/check-availability', {
                            method: 'POST', headers,
                            body: JSON.stringify({ hearse_id: h.id, booking_dates: dates }),
                        });
                        const d = await r.json().catch(() => ({}));
                        return [h.id, r.ok ? { ok: !!d.available, conflicts: d.conflicts || [] } : null];
                    } catch { return [h.id, null]; }
                }));
                if (!dead) setAvail(Object.fromEntries(results));
            } catch { if (!dead) setAvail({}); }
            finally { if (!dead) setChecking(false); }
        }, 350);
        return () => { dead = true; clearTimeout(t); };
    }, [open, dates, hearses]);

    const todayStr = useMemo(() => {
        const n = new Date();
        return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
    }, []);

    const cells = useMemo(() => {
        const out = [];
        for (let i = 0; i < new Date(py, pm, 1).getDay(); i++) out.push(null);
        const last = new Date(py, pm + 1, 0).getDate();
        for (let d = 1; d <= last; d++) out.push(d);
        return out;
    }, [py, pm]);

    /* calendar is always open — tapping a day applies it immediately */
    const toggleDate = (ds) => {
        setDates((p) => (p.includes(ds) ? p.filter((x) => x !== ds) : [...p, ds].sort()));
        setHearseId(''); /* dates changed → reset hearse choice */
        setErr('');
    };
    const clearDates = () => { setDates([]); setHearseId(''); setErr(''); };

    /* location suggestion pickers — fill the field, manual typing still allowed */
    const pickFrom = (loc) => {
        setForm((p) => ({ ...p, from_location: loc }));
        setShowFromSugg(false);
    };
    const pickTo = (loc) => {
        setForm((p) => ({ ...p, to_location: loc }));
        setShowToSugg(false);
    };
    const shiftMonth = (delta) => {
        let m = pm + delta, y = py;
        if (m < 0) { m = 11; y -= 1; } if (m > 11) { m = 0; y += 1; }
        setPm(m); setPy(y);
    };

    const handleCharge = (e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        setCharge(raw ? Number(raw).toLocaleString('en-US') : '');
    };
    const chargeNum = useMemo(() => parseFloat((charge || '').replace(/,/g, '')) || 0, [charge]);

    const selInfo = hearseId ? avail[hearseId] : undefined;
    const selBlocked = !!(selInfo && selInfo.ok === false);
    const selHearse = useMemo(() => hearses.find((h) => String(h.id) === String(hearseId)), [hearses, hearseId]);

    const canSubmit = !submitting && !done && dates.length > 0 && !!hearseId
        && !!form.client_name.trim() && !!form.deceased_name.trim()
        && !!form.from_location.trim() && !!form.to_location.trim() && !selBlocked;

    /* footer summary line */
    const summary = (() => {
        if (selBlocked) return { t: 'That hearse is booked — pick another.', bad: true };
        if (checking) return { t: 'Checking availability…' };
        if (dates.length && selHearse) {
            let t = dates.map(fmtDay).join(', ') + ' · ' + cs(selHearse.hearse_name);
            if (chargeNum > 0) t += ' · ' + fmtMoney(chargeNum);
            return { t, ok: true };
        }
        if (dates.length) return { t: dates.map(fmtDay).join(', ') + ' — pick a hearse' };
        return { t: 'Select a date to start' };
    })();

    const submit = async () => {
        if (submitting || done) return;
        const missing = [];
        if (!dates.length) missing.push('a date');
        if (!hearseId) missing.push('a hearse');
        if (!form.client_name.trim()) missing.push('client name');
        if (!form.deceased_name.trim()) missing.push('deceased name');
        if (!form.from_location.trim()) missing.push('"from"');
        if (!form.to_location.trim()) missing.push('"to"');
        if (missing.length) { setErr('Please add ' + missing.join(', ') + '.'); return; }
        if (selBlocked) {
            setErr('That hearse is already booked on: ' + ((selInfo.conflicts || []).map((c) => c.date || 'date').join(', ') || 'the selected dates'));
            return;
        }
        setSubmitting(true); setErr('');
        try {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const user = authUser();
            if (user?.branch_id) headers['x-branch-id'] = user.branch_id;
            if (user?.email) headers['x-user-email'] = user.email;
            headers['x-user-name'] = user?.full_name || user?.username || user?.name || 'System';

            /* Stamp the EXACT moment this booking is made — this instant is what
               places it on the Day Timeline. Never asked from the user. */
            const madeAt = new Date();
            const hhmm = pad(madeAt.getHours()) + ':' + pad(madeAt.getMinutes());
            const firstTs = dates[0] + 'T' + hhmm;

            const body = {
                hearse_id: hearseId,
                client_name: form.client_name.trim(),
                client_phone: form.client_phone.trim(),
                deceased_name: form.deceased_name.trim(),
                service_charge: chargeNum,
                from_location: form.from_location.trim(),
                to_location: form.to_location.trim(),
                destination: form.to_location.trim(),
                from_timestamp: firstTs,
                booking_date: firstTs,
                booking_dates: dates,
                booked_by: getLocalUserName() || user?.email || 'System',
                branch_id: user?.branch_id || '',
                branch_code: user?.branch_code || '',
            };
            const r = await fetch(API_BASE_URL + '/hearse-bookings', { method: 'POST', headers, body: JSON.stringify(body) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || (r.status === 409 ? 'Just booked by someone else for those date(s) — pick another hearse.' : 'HTTP ' + r.status));
            setDone(true);
            showToast('Booking created — ' + cs(selHearse?.hearse_name) + ' · ' + dates.length + (dates.length > 1 ? ' dates' : ' date') + (chargeNum > 0 ? ' · ' + fmtMoney(chargeNum) : ''));
            if (typeof onCreated === 'function') onCreated(d.booking);
            closeT.current = setTimeout(onClose, 1200);
        } catch (ex) {
            setErr(ex.message || 'Failed to create booking');
            setChecking(true); /* nudge a fresh availability sweep after a conflict */
        } finally {
            setSubmitting(false);
        }
    };

    const freeCount = Object.values(avail).filter((a) => a && a.ok).length;
    const fleetHint = dates.length === 0 ? 'pick a date first' : checking ? 'checking…' : '';

    return (
        <>
            <Scrim $open={open} onClick={onClose} />
            <Drawer $open={open} role="dialog" aria-modal="true" aria-hidden={!open} aria-label="New hearse booking">

                <PHead>
                    <HeadText>
                        <Title>New Hearse Booking</Title>
                        <Sub>Date → hearse → details</Sub>
                    </HeadText>
                    <XBtn onClick={onClose} aria-label="Close">✕</XBtn>
                </PHead>

                <PBody>

                    {/* ── 1 · CALENDAR (always open, tap = select) ── */}
                    <Sec>
                        <SecTop>
                            <h2><Num>1</Num>Dates</h2>
                            <Hint>{dates.length === 0 ? 'Tap a day to add' : dates.length + (dates.length > 1 ? ' dates selected' : ' date selected')}</Hint>
                        </SecTop>
                        <CalTop>
                            <b>{MONTHS[pm]} {py}</b>
                            <Nav>
                                <NavBtn type="button" onClick={() => shiftMonth(-1)}>‹</NavBtn>
                                <NavBtn type="button" onClick={() => shiftMonth(1)}>›</NavBtn>
                            </Nav>
                        </CalTop>
                        <CalGrid>
                            {DAYS.map((w) => <Wd key={w}>{w}</Wd>)}
                            {cells.map((day, i) => {
                                if (day === null) return <span key={'e' + i} />;
                                const ds = py + '-' + pad(pm + 1) + '-' + pad(day);
                                const past = ds < todayStr;
                                return (
                                    <DayCell key={ds} type="button" $past={past}
                                        $sel={dates.includes(ds)} $today={ds === todayStr}
                                        disabled={past}
                                        onClick={() => { if (!past) toggleDate(ds); }}>
                                        {day}
                                    </DayCell>
                                );
                            })}
                        </CalGrid>
                        <SelLine>
                            <SelTxt $has={dates.length > 0}>
                                {dates.length === 0 ? 'No dates selected' : '✓ ' + dates.map(fmtDay).join(', ')}
                            </SelTxt>
                            {dates.length > 0 && <ClearBtn type="button" onClick={clearDates}>Clear</ClearBtn>}
                        </SelLine>
                    </Sec>

                    {/* ── 2 · HEARSE (dot status, live availability) ── */}
                    <Sec>
                        <SecTop>
                            <h2><Num>2</Num>Hearse</h2>
                            <Hint>{fleetHint}</Hint>
                        </SecTop>
                        {dates.length === 0 ? (
                            <EmptyNote>Pick a date above — every hearse is checked instantly.</EmptyNote>
                        ) : (
                            <FleetList>
                                {hearses.map((h) => {
                                    const a = avail[h.id];
                                    const known = !checking && !!a;
                                    const free = known && a.ok;
                                    const off = known && !a.ok;
                                    const sel = String(h.id) === String(hearseId);
                                    const kind = !known ? 'wait' : free ? 'free' : 'busy';
                                    return (
                                        <HearseRow key={h.id} type="button"
                                            $off={off} $sel={sel} $dim={checking}
                                            disabled={off || checking}
                                            title={off ? 'Already booked on your dates' : undefined}
                                            onClick={() => { if (!off && !checking) setHearseId(sel ? '' : h.id); }}>
                                            <Ava>{cs(h.hearse_name).charAt(0).toUpperCase() || '🚐'}</Ava>
                                            <HInfo>
                                                <HName>{cs(h.hearse_name) || 'Unnamed Hearse'} · {cs(h.plate_number || h.number_plate) || 'no plate'}</HName>
                                                <HMeta>{[h.capacity ? h.capacity + ' seats' : '', cs(h.model), cs(h.branch_name)].filter(Boolean).join('  ·  ') || '—'}</HMeta>
                                            </HInfo>
                                            <St>
                                                <Dot $kind={kind} />
                                                {off && <StLabel>Booked</StLabel>}
                                                {free && <StLabel $free>Free</StLabel>}
                                            </St>
                                            {!off && <Radio $on={sel} />}
                                        </HearseRow>
                                    );
                                })}
                                {hearses.length === 0 && <EmptyNote>No hearses registered yet.</EmptyNote>}
                                {!checking && hearses.length > 0 && freeCount > 0 && (
                                    <Hint style={{ alignSelf: 'flex-end', textAlign: 'right' }}>{freeCount} of {hearses.length} free</Hint>
                                )}
                            </FleetList>
                        )}
                        {selBlocked && (
                            <ErrBox $show>
                                Already booked: {(selInfo.conflicts || []).map((c) => (c.date || 'date') + ' (' + (c.reason || 'booked') + ')').join(', ') || 'selected dates'}
                            </ErrBox>
                        )}
                    </Sec>

                    {/* ── 3 · DETAILS ── */}
                    <Sec>
                        <SecTop><h2><Num>3</Num>Details</h2></SecTop>
                        <Row2>
                            <Fld>
                                <Label>Client <em>*</em></Label>
                                <Input placeholder="Full name" value={form.client_name}
                                    onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
                            </Fld>
                            <Fld>
                                <Label>Phone</Label>
                                <Input placeholder="0712 345 678" value={form.client_phone}
                                    onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} />
                            </Fld>
                        </Row2>
                        <Row2>
                            <Fld>
                                <Label>Deceased name <em>*</em></Label>
                                <Input placeholder="Name of the deceased" value={form.deceased_name}
                                    onChange={(e) => setForm((p) => ({ ...p, deceased_name: e.target.value }))} />
                            </Fld>
                            <Fld>
                                <Label>Total service charge</Label>
                                <ChargeWrap>
                                    <span>KES</span>
                                    <Input inputMode="numeric" placeholder="0" value={charge} onChange={handleCharge} />
                                </ChargeWrap>
                            </Fld>
                        </Row2>
                        <Fld>
                            <Label>From <em>*</em></Label>
                            <Input placeholder="e.g., Nairobi CBD" value={form.from_location}
                                onChange={(e) => setForm((p) => ({ ...p, from_location: e.target.value }))}
                                onFocus={() => setShowFromSugg(true)}
                                onBlur={() => setTimeout(() => setShowFromSugg(false), 120)} />
                            {showFromSugg && (
                                <SuggWrap>
                                    {LOC_SUGG.map((loc) => (
                                        <SuggChip key={loc} type="button" onClick={() => pickFrom(loc)}>
                                            {loc}
                                        </SuggChip>
                                    ))}
                                </SuggWrap>
                            )}
                        </Fld>
                        <Fld>
                            <Label>To <em>*</em></Label>
                            <Input placeholder="e.g., Karen Memorial Park" value={form.to_location}
                                onChange={(e) => setForm((p) => ({ ...p, to_location: e.target.value }))}
                                onFocus={() => setShowToSugg(true)}
                                onBlur={() => setTimeout(() => setShowToSugg(false), 120)} />
                            {showToSugg && (
                                <SuggWrap>
                                    {LOC_SUGG.map((loc) => (
                                        <SuggChip key={loc} type="button" onClick={() => pickTo(loc)}>
                                            {loc}
                                        </SuggChip>
                                    ))}
                                </SuggWrap>
                            )}
                        </Fld>
                        {/* Branch is detected internally from auth headers — never asked */}
                        <ErrBox $show={!!err}>{err}</ErrBox>
                    </Sec>

                </PBody>

                <PFoot>
                    <Sum $ok={summary.ok && !summary.bad} $bad={summary.bad}>{summary.t}</Sum>
                    <Acts>
                        <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
                        <GoBtn type="button" disabled={!canSubmit} onClick={submit}>
                            {submitting ? <><Spin />Creating…</> : done ? 'Created ✓' : 'Create Booking'}
                        </GoBtn>
                    </Acts>
                </PFoot>

            </Drawer>

            <Toast $show={!!toast}>{toast}</Toast>
        </>
    );
}