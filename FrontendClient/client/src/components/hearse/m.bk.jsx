import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';


const API_BASE_URL = import.meta.env.PROD
    ? 'https://restpoint.co.ke/api/v1/restpoint'
    : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const C = {
    primary: '#1a5f7a', primaryLight: '#2c8ac9',
    bgSoft: '#f8fafc',
    text: '#111827', textMuted: '#94a3b8',
    successDark: '#059669', successLight: '#d1fae5',
    dangerLight: '#fee2e2', dangerDark: '#dc2626',
};

const getTenantSlug = () => {
    const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
    if (direct && direct !== 'default' && direct !== 'undefined' && direct !== 'null') return direct;
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return u.parentTenantSlug || u.tenantSlug || u.tenant?.slug || '';
    } catch { return ''; }
};
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    const h = { 'x-tenant-slug': getTenantSlug() };
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

const popIn = keyframes`from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); }`;
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const blink = keyframes`0%,100% { opacity: .35; } 50% { opacity: 1; }`;

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 6000; background: rgba(15,23,42,.55);
  backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: ${fadeIn} .18s ease;
`;
const Panel = styled.div`
  width: min(600px, 96vw); max-height: 90vh; background: #fff; border-radius: 18px;
  overflow: hidden; box-shadow: 0 30px 70px rgba(2,12,27,.35);
  display: flex; flex-direction: column; animation: ${popIn} .22s cubic-bezier(.32,.72,0,1);
`;
const Head = styled.div`
  padding: .95rem 1.25rem; color: #fff; display: flex; align-items: center;
  justify-content: space-between; gap: 1rem;
  background: linear-gradient(120deg,#0f3d4f 0%,#134b5f 55%,#1a5f7a 100%);
`;
const Title = styled.div`font-size: 1rem; font-weight: 800; letter-spacing: -.01em;`;
const SubTitle = styled.div`font-size: .72rem; opacity: .75; margin-top: .15rem;`;
const CloseBtn = styled.button`
  width: 30px; height: 30px; flex-shrink: 0; border: none; border-radius: 9px;
  background: rgba(255,255,255,.14); color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; &:hover { background: rgba(255,255,255,.28); }
`;
const Body = styled.div`padding: 1rem 1.25rem 1.05rem; overflow-y: auto; flex: 1;`;
const Foot = styled.div`
  padding: .75rem 1.25rem; border-top: 1px solid #e5e7eb; background: #f8fafc;
  display: flex; justify-content: space-between; align-items: center; gap: .75rem;
`;
const SectionHead = styled.div`display: flex; align-items: center; gap: .5rem; margin-bottom: .55rem;`;
const StepDot = styled.span`
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; color: #fff;
  background: ${(p) => (p.$done ? C.successDark : p.$active ? C.primary : '#cbd5e1')};
  font-size: .64rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center;
  transition: background .2s;
`;
const SectionLabel = styled.div`
  font-size: .73rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #475569;
  span { color: #94a3b8; font-weight: 500; text-transform: none; letter-spacing: 0; margin-left: .35rem; }
`;
const Divider = styled.div`height: 1px; background: #e5e7eb; margin: .95rem 0;`;
const DateBox = styled.button`
  width: 100%; min-height: 44px; padding: .45rem .6rem; text-align: left;
  border: 1.5px dashed ${(p) => (p.$has ? C.primary : '#cbd5e1')}; border-radius: 10px;
  background: ${(p) => (p.$has ? '#f0f9ff' : C.bgSoft)}; cursor: pointer;
  display: flex; align-items: center; flex-wrap: wrap; gap: .3rem;
  transition: border-color .15s, background .15s;
  &:hover { border-color: ${C.primary}; }
`;
const DateChip = styled.span`
  display: inline-flex; align-items: center; gap: .22rem; background: ${C.primary};
  color: #fff; border-radius: 999px; padding: .17rem .32rem .17rem .55rem;
  font-size: .67rem; font-weight: 700;
`;
const ChipX = styled.button`
  width: 14px; height: 14px; border-radius: 50%; border: none; cursor: pointer;
  background: rgba(255,255,255,.25); color: #fff; font-size: 9px; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(255,255,255,.45); }
`;
const AddHint = styled.span`font-size: .73rem; color: ${C.textMuted}; font-weight: 600;`;
const HearseList = styled.div`display: flex; flex-direction: column; gap: .45rem;`;
const HearseRow = styled.button`
  width: 100%; display: flex; align-items: center; gap: .65rem; text-align: left;
  padding: .5rem .65rem; border-radius: 11px;
  cursor: ${(p) => (p.$off ? 'not-allowed' : 'pointer')};
  border: 1.5px solid ${(p) => (p.$sel ? C.primary : '#e5e7eb')};
  background: ${(p) => (p.$sel ? '#eff6ff' : p.$off ? '#fafafa' : '#fff')};
  opacity: ${(p) => (p.$off ? .62 : 1)};
  transition: border-color .15s, box-shadow .15s, transform .12s;
  ${(p) => (!p.$off ? '&:hover { border-color: ' + C.primaryLight + '; box-shadow: 0 2px 10px rgba(26,95,122,.13); transform: translateY(-1px); }' : '')}
`;
const Avatar = styled.div`
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; color: #fff;
  background: linear-gradient(135deg,#1a5f7a,#2c8ac9); font-size: 15px;
  display: flex; align-items: center; justify-content: center;
`;
const HName = styled.div`font-size: .82rem; font-weight: 750; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const HMeta = styled.div`font-size: .67rem; color: #6b7280; margin-top: .1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const Pill = styled.span`
  flex-shrink: 0; font-size: .6rem; font-weight: 800; letter-spacing: .04em;
  padding: .16rem .5rem; border-radius: 999px; text-transform: uppercase;
  background: ${(p) => p.$bg}; color: ${(p) => p.$fg};
  animation: ${(p) => (p.$blink ? blink : 'none')} 1.1s infinite;
`;
const Radio = styled.span`
  width: 17px; height: 17px; flex-shrink: 0; border-radius: 50%;
  border: 2px solid ${(p) => (p.$on ? C.primary : '#cbd5e1')};
  display: inline-flex; align-items: center; justify-content: center;
  &::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: ${C.primary}; transform: ${(p) => (p.$on ? 'scale(1)' : 'scale(0)')}; transition: transform .15s; }
`;
const Banner = styled.div`
  margin-top: .55rem; padding: .5rem .65rem; border-radius: 9px; font-size: .73rem;
  font-weight: 650; line-height: 1.45; background: ${(p) => p.$bg}; color: ${(p) => p.$fg};
`;
const FieldGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; @media(max-width:520px){ grid-template-columns: 1fr; }`;
const Label = styled.label`display: block; font-size: .71rem; font-weight: 700; color: #475569; margin-bottom: .26rem;`;
const Input = styled.input`
  width: 100%; padding: .48rem .65rem; font-size: .8rem; color: #111827;
  border: 1px solid #d1d5db; border-radius: 9px; background: #fff; outline: none;
  transition: border-color .15s, box-shadow .15s;
  &:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(26,95,122,.12); }
`;
const GhostBtn = styled.button`
  padding: .52rem 1rem; border-radius: 10px; border: 1px solid #d1d5db;
  background: #fff; color: #64748b; font-size: .78rem; font-weight: 700; cursor: pointer;
  &:hover { background: #f8fafc; }
`;
const GoBtn = styled.button`
  padding: .52rem 1.15rem; border-radius: 10px; border: none; cursor: pointer; color: #fff;
  background: linear-gradient(120deg,#134b5f,#1a5f7a); font-size: .78rem; font-weight: 800;
  box-shadow: 0 4px 12px rgba(19,75,95,.28); transition: transform .12s, opacity .15s;
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: .55; cursor: not-allowed; }
`;
const PickerOverlay = styled.div`
  position: fixed; inset: 0; z-index: 7000; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  animation: ${fadeIn} .15s ease;
`;
const PickerCard = styled.div`
  width: 400px; max-width: 96vw; background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 25px 60px rgba(2,12,27,.35); animation: ${popIn} .18s ease;
`;
const NavBtn = styled.button`
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e5e7eb;
  background: #fff; cursor: pointer; color: #334155; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: #f8fafc; }
`;
const DayCell = styled.div`
  text-align: center; padding: .38rem 0; font-size: .76rem; border-radius: 7px;
  font-weight: ${(p) => (p.$sel ? 800 : 500)};
  cursor: ${(p) => (p.$past ? 'not-allowed' : 'pointer')};
  background: ${(p) => (p.$sel ? C.primary : 'transparent')};
  color: ${(p) => (p.$sel ? '#fff' : p.$past ? '#cbd5e1' : p.$today ? C.successDark : '#111827')};
  border: 1px solid ${(p) => (p.$today && !p.$sel ? C.success : 'transparent')};
`;

/* ════════════════════════ COMPONENT ════════════════════════ */
export default function NewBookingModal({ open, onClose, hearses = [], prefillDates = [], onCreated }) {
    const [form, setForm] = useState({ client_name: '', client_phone: '', from_location: '', to_location: '' });
    const [dates, setDates] = useState([]);
    const [hearseId, setHearseId] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pm, setPm] = useState(new Date().getMonth());
    const [py, setPy] = useState(new Date().getFullYear());
    const [temp, setTemp] = useState([]);
    const [avail, setAvail] = useState({});
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');

    /* fresh slate every time the modal opens */
    useEffect(() => {
        if (!open) return;
        setForm({ client_name: '', client_phone: '', from_location: '', to_location: '' });
        const seed = (Array.isArray(prefillDates) ? prefillDates : []).filter(Boolean);
        setDates(seed);
        const base = seed[0] ? new Date(seed[0] + 'T00:00:00') : new Date();
        setPm(base.getMonth()); setPy(base.getFullYear());
        setHearseId(''); setAvail({}); setChecking(false); setSubmitting(false); setErr(''); setPickerOpen(false); setTemp([]);
    }, [open]); /* eslint-disable-line react-hooks/exhaustive-deps */

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

    const toggleTemp = (ds) => setTemp((p) => (p.includes(ds) ? p.filter((x) => x !== ds) : [...p, ds].sort()));
    const removeDate = (ds) => setDates((p) => p.filter((d) => d !== ds));
    const openPicker = () => { setTemp([...dates]); setPickerOpen(true); };
    const confirmDates = () => { setDates([...temp].sort()); setPickerOpen(false); };
    const shiftMonth = (delta) => {
        let m = pm + delta, y = py;
        if (m < 0) { m = 11; y -= 1; } if (m > 11) { m = 0; y += 1; }
        setPm(m); setPy(y);
    };

    const selInfo = hearseId ? avail[hearseId] : undefined;
    const selBlocked = !!(selInfo && selInfo.ok === false);
    const canSubmit = !submitting && dates.length > 0 && !!hearseId
        && !!form.client_name.trim() && !!form.from_location.trim() && !!form.to_location.trim() && !selBlocked;

    const submit = async () => {
        if (submitting) return;
        if (!dates.length || !hearseId || !form.client_name.trim() || !form.from_location.trim() || !form.to_location.trim()) {
            setErr('Pick date(s), choose a hearse, and fill client + route.'); return;
        }
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
            if (typeof onCreated === 'function') onCreated(d.booking);
            onClose();
        } catch (ex) {
            setErr(ex.message || 'Failed to create booking');
            setChecking(true); /* nudge a fresh availability sweep after a conflict */
        } finally {
            setSubmitting(false);
        }
    };

    const todayStr = (() => { const n = new Date(); return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()); })();
    const userBranch = (() => { const u = authUser(); return cs(u.branch_name) || cs((u.dbName || u.branchDbName || '').split('-').pop()); })();
    const cells = useMemo(() => {
        const out = [];
        for (let i = 0; i < new Date(py, pm, 1).getDay(); i++) out.push(null);
        const last = new Date(py, pm + 1, 0).getDate();
        for (let d = 1; d <= last; d++) out.push(d);
        return out;
    }, [py, pm]);

    if (!open) return null;

    return (
        <Overlay onClick={onClose}>
            <Panel onClick={(e) => e.stopPropagation()}>
                <Head>
                    <div>
                        <Title>New Hearse Booking</Title>
                        <SubTitle>Pick dates → choose an available hearse → done</SubTitle>
                    </div>
                    <CloseBtn onClick={onClose}>✕</CloseBtn>
                </Head>

                <Body>
                    {/* ── STEP 1 · DATES ── */}
                    <SectionHead>
                        <StepDot $done={dates.length > 0} $active>1</StepDot>
                        <SectionLabel>Dates <span>when is this trip?</span></SectionLabel>
                    </SectionHead>
                    <DateBox $has={dates.length > 0} onClick={openPicker} type="button">
                        {dates.length > 0
                            ? dates.map((d) => (
                                <DateChip key={d} onClick={(ev) => { ev.stopPropagation(); removeDate(d); }} title="Remove">
                                    {fmtDay(d)} <ChipX>✕</ChipX>
                                </DateChip>
                            ))
                            : <AddHint>+ Choose date(s) to see available hearses</AddHint>}
                    </DateBox>

                    <Divider />

                    {/* ── STEP 2 · LIVE AVAILABILITY ── */}
                    <SectionHead>
                        <StepDot $done={!!hearseId} $active={dates.length > 0}>2</StepDot>
                        <SectionLabel>
                            Available hearses
                            <span>{dates.length === 0 ? 'pick dates first' : checking ? 'checking…' : hearses.length + ' vehicles'}</span>
                        </SectionLabel>
                    </SectionHead>
                    {dates.length === 0 ? (
                        <Banner $bg="#f8fafc" $fg="#94a3b8">Select at least one date above — availability shows instantly for the whole fleet.</Banner>
                    ) : (
                        <HearseList>
                            {hearses.map((h) => {
                                const a = avail[h.id];
                                const off = !!(a && a.ok === false);
                                const sel = String(h.id) === String(hearseId);
                                const pill = checking || !a
                                    ? { label: '···', bg: '#f1f5f9', fg: '#94a3b8', blink: checking }
                                    : a.ok
                                        ? { label: '✓ free', bg: C.successLight, fg: C.successDark }
                                        : { label: '✕ booked', bg: C.dangerLight, fg: C.dangerDark };
                                return (
                                    <HearseRow key={h.id} type="button" $off={off} $sel={sel}
                                        onClick={() => { if (!off) setHearseId(sel ? '' : h.id); }}>
                                        <Avatar>{cs(h.hearse_name).charAt(0).toUpperCase() || '🚐'}</Avatar>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <HName>{cs(h.hearse_name) || 'Unnamed Hearse'} · {cs(h.plate_number || h.number_plate) || 'no plate'}</HName>
                                            <HMeta>{[h.capacity ? h.capacity + ' seats' : '', cs(h.model), cs(h.branch_name)].filter(Boolean).join('  ·  ') || '—'}</HMeta>
                                        </div>
                                        <Pill $bg={pill.bg} $fg={pill.fg} $blink={pill.blink}>{pill.label}</Pill>
                                        <Radio $on={sel} />
                                    </HearseRow>
                                );
                            })}
                            {hearses.length === 0 && <Banner $bg="#fef3c7" $fg="#92400e">No hearses registered yet.</Banner>}
                        </HearseList>
                    )}
                    {selBlocked && (
                        <Banner $bg={C.dangerLight} $fg={C.dangerDark}>
                            Already booked: {(selInfo.conflicts || []).map((c) => (c.date || 'date') + ' (' + (c.reason || 'booked') + ')').join(', ') || 'selected dates'}
                        </Banner>
                    )}

                    <Divider />

                    {/* ── STEP 3 · TRIP DETAILS ── */}
                    <SectionHead>
                        <StepDot $done={!!(form.client_name.trim() && form.from_location.trim() && form.to_location.trim())} $active={!!hearseId}>3</StepDot>
                        <SectionLabel>Trip details</SectionLabel>
                    </SectionHead>
                    <FieldGrid style={{ marginBottom: '.6rem' }}>
                        <div>
                            <Label>Client Name *</Label>
                            <Input placeholder="Full name" value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input placeholder="0712 345 678" value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} />
                        </div>
                        <div>
                            <Label>From *</Label>
                            <Input placeholder="e.g., Nairobi CBD" value={form.from_location} onChange={(e) => setForm((p) => ({ ...p, from_location: e.target.value }))} />
                        </div>
                        <div>
                            <Label>To *</Label>
                            <Input placeholder="e.g., Karen Memorial Park" value={form.to_location} onChange={(e) => setForm((p) => ({ ...p, to_location: e.target.value }))} />
                        </div>
                    </FieldGrid>
                    <Label>Branch</Label>
                    <Input value={userBranch || 'Auto-filled from your profile'} readOnly disabled style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                    {err && <Banner $bg={C.dangerLight} $fg={C.dangerDark}>{err}</Banner>}
                </Body>

                <Foot>
                    <span style={{ fontSize: '.68rem', color: '#94a3b8' }}>Stamped at creation time · re-checked atomically on save</span>
                    <div style={{ display: 'flex', gap: '.55rem' }}>
                        <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
                        <GoBtn type="button" disabled={!canSubmit} onClick={submit}>{submitting ? 'Creating…' : 'Create Booking'}</GoBtn>
                    </div>
                </Foot>
            </Panel>

            {/* ── date picker popover ── */}
            {pickerOpen && (
                <PickerOverlay onClick={() => setPickerOpen(false)}>
                    <PickerCard onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '.8rem 1rem', background: 'linear-gradient(120deg,#0f3d4f,#1a5f7a)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '.92rem', fontWeight: 800 }}>Select Dates</div>
                                <div style={{ fontSize: '.7rem', opacity: .75 }}>{temp.length} selected · click to toggle</div>
                            </div>
                            <CloseBtn onClick={() => setPickerOpen(false)}>✕</CloseBtn>
                        </div>
                        <div style={{ padding: '.85rem 1rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
                                <NavBtn type="button" onClick={() => shiftMonth(-1)}>‹</NavBtn>
                                <div style={{ fontSize: '.88rem', fontWeight: 800, color: '#0f172a' }}>{MONTHS[pm]} {py}</div>
                                <NavBtn type="button" onClick={() => shiftMonth(1)}>›</NavBtn>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px', marginBottom: '.75rem' }}>
                                {DAYS.map((w) => (
                                    <div key={w} style={{ textAlign: 'center', fontSize: '.62rem', fontWeight: 700, color: '#94a3b8', padding: '.3rem 0' }}>{w}</div>
                                ))}
                                {cells.map((day, i) => {
                                    if (day === null) return <div key={'e' + i} />;
                                    const ds = py + '-' + pad(pm + 1) + '-' + pad(day);
                                    const past = ds < todayStr;
                                    return (
                                        <DayCell key={ds} $past={past} $sel={temp.includes(ds)} $today={ds === todayStr}
                                            onClick={() => { if (!past) toggleTemp(ds); }}>{day}</DayCell>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '.75rem' }}>
                                <GhostBtn type="button" onClick={() => setTemp([])}>Clear</GhostBtn>
                                <GoBtn type="button" onClick={confirmDates} disabled={temp.length === 0}>Confirm ({temp.length})</GoBtn>
                            </div>
                        </div>
                    </PickerCard>
                </PickerOverlay>
            )}
        </Overlay>
    );
}




