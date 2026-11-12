import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import env from '../../utils/config/env';
import { X, ChevronLeft, ChevronRight, Clock } from '../../utils/icons/icons';
import { mergeFleetAvailability } from './hearseFleetAvailability';
import {
  getBranchId,
  getBranchSlug,
  getBranches as getCachedBranches,
} from '../../utils/globalAuth';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

// Hearse statuses that are never bookable, whatever the date.
// Module-level ON PURPOSE: this array is a dependency of the memoised
// availability loader below. As a component-local `const` it was a brand new
// array on every render, so the useCallback identity changed on every render and
// the loader effect re-ran continuously — each pass firing another burst of
// availability requests (the "too many requests" symptom).
const EXCLUDED = ['maintenance', 'out_of_service', 'disabled', 'pending_inspection'];

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

/* Location suggestions — clickable chips (not a dropdown). Manual typing still works. */
const LOC_SUGG = ['Montenzuma Thika', 'Montenzuma Nairobi', 'Montenzuma Machakos', 'Home'];
const formatTimeLabel = (value) => {
  if (!value) return '';
  const [rawHour, minute] = value.split(':').map(Number);
  const period = rawHour >= 12 ? 'PM' : 'AM';
  return `${rawHour % 12 || 12}:${pad(minute)} ${period}`;
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
  const tenantId = resolveTenantId();
  if (tenantId) h['x-tenant-id'] = tenantId;
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const getLocalUserName = () => {
  try { const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); return u?.full_name || u?.username || u?.name || u?.email || ''; } catch { return ''; }
};
const safeUser = () => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } };
const GENERIC_BRANCH_NAMES = new Set(['main branch', 'main', 'default', 'branch', 'unknown', 'n/a', 'na', '—', '-']);

function getBranchOptions(branches, user) {
  const cachedBranches = getCachedBranches();
  const candidates = [...(Array.isArray(branches) ? branches : []), ...cachedBranches];
  const optionsByKey = new Map();

  candidates.forEach((branch) => {
    if (!branch) return;
    const id = branch.branchId || branch.branch_id || branch.id || '';
    const slug = branch.branchSlug || branch.branch_slug || branch.slug || branch.branchDbName || branch.branch_db_name || '';
    const key = String(id || slug);
    if (!key) return;

    const cachedBranch = cachedBranches.find((cached) => {
      const cachedId = cached.branchId || cached.branch_id || cached.id || '';
      const cachedSlug = cached.branchSlug || cached.branch_slug || cached.slug || cached.branchDbName || cached.branch_db_name || '';
      return (id && String(cachedId) === String(id))
        || (slug && String(cachedSlug).toLowerCase() === String(slug).toLowerCase());
    });
    const apiName = String(branch.branchName || branch.branch_name || branch.name || '').trim();
    const cachedName = String(cachedBranch?.branchName || cachedBranch?.branch_name || cachedBranch?.name || '').trim();
    const apiNameIsGeneric = GENERIC_BRANCH_NAMES.has(apiName.toLowerCase());
    const name = apiNameIsGeneric ? cachedName : (apiName || cachedName);
    if (!name || GENERIC_BRANCH_NAMES.has(name.toLowerCase())) return;

    const option = {
      key: String(id || cachedBranch?.branchId || cachedBranch?.branch_id || cachedBranch?.id || slug || cachedBranch?.branchSlug || cachedBranch?.branch_slug || ''),
      id: String(id || cachedBranch?.branchId || cachedBranch?.branch_id || cachedBranch?.id || ''),
      slug: String(slug || cachedBranch?.branchSlug || cachedBranch?.branch_slug || cachedBranch?.slug || cachedBranch?.branchDbName || cachedBranch?.branch_db_name || ''),
      code: String(branch.branchCode || branch.branch_code || cachedBranch?.branchCode || cachedBranch?.branch_code || ''),
      name,
    };
    const existing = optionsByKey.get(key);
    if (!existing || GENERIC_BRANCH_NAMES.has(existing.name.toLowerCase())) optionsByKey.set(key, option);
  });

  const userBranchId = user.branchId || user.branch_id || user.branch?.branchId
    || user.branch?.branch_id || localStorage.getItem('branchId') || '';
  const userBranchSlug = user.branchSlug || user.branch_slug || user.branchDbName
    || user.branch?.branchSlug || user.branch?.branch_slug
    || localStorage.getItem('branchSlug') || localStorage.getItem('branchDbName') || '';
  const options = Array.from(optionsByKey.values());
  const hasCurrentBranch = options.some((branch) =>
    (userBranchId && branch.id === String(userBranchId))
    || (userBranchSlug && branch.slug.toLowerCase() === String(userBranchSlug).toLowerCase())
  );
  const userBranchName = String(user.branchName || user.branch_name || user.branch?.branchName || user.branch?.branch_name || '').trim();
  if (!hasCurrentBranch && (userBranchId || userBranchSlug) && userBranchName) {
    if (!GENERIC_BRANCH_NAMES.has(userBranchName.toLowerCase())) {
      options.push({
        key: String(userBranchId || userBranchSlug),
        id: String(userBranchId || ''),
        slug: String(userBranchSlug || ''),
        code: String(user.branchCode || user.branch_code || user.branch?.branchCode || user.branch?.branch_code || ''),
        name: userBranchName,
      });
    }
  }
  return options;
}

function resolveCurrentBranch(branchOptions, user) {
  const branchId = String(
    getBranchId()
      || user.branchId
      || user.branch_id
      || user.branch?.branchId
      || user.branch?.branch_id
      || localStorage.getItem('branchId')
      || ''
  );
  const branchSlug = String(
    getBranchSlug()
      || user.branchSlug
      || user.branch_slug
      || user.branchDbName
      || user.branch?.branchSlug
      || user.branch?.branch_slug
      || localStorage.getItem('branchSlug')
      || localStorage.getItem('branchDbName')
      || ''
  );
  const tenantSlug = getTenantSlug();
  const parentTenantSlug = localStorage.getItem('parentTenantSlug') || user.parentTenantSlug || '';
  const effectiveBranchSlug = branchSlug || (tenantSlug && tenantSlug !== parentTenantSlug ? tenantSlug : '');
  const current = branchOptions.find((branch) =>
    (branchId && branch.id === branchId)
    || (effectiveBranchSlug && branch.slug.toLowerCase() === effectiveBranchSlug.toLowerCase())
  );
  if (current) return current;

  const profileName = String(
    user.branchName
      || user.branch_name
      || user.branch?.branchName
      || user.branch?.branch_name
      || ''
  ).trim();
  if (!GENERIC_BRANCH_NAMES.has(profileName.toLowerCase()) && (branchId || effectiveBranchSlug)) {
    return {
      key: branchId || effectiveBranchSlug,
      id: branchId,
      slug: effectiveBranchSlug,
      code: String(user.branchCode || user.branch_code || user.branch?.branchCode || user.branch?.branch_code || ''),
      name: profileName,
    };
  }
  return null;
}

function resolveHearseBranch(hearse, branchOptions) {
  const branchId = String(hearse?.branch_id || hearse?.branchId || '');
  const branchSlug = String(hearse?.branch_slug || hearse?.branchSlug || hearse?.branch_db_name || '');
  const branchCode = String(hearse?.branch_code || hearse?.branchCode || '');
  const match = branchOptions.find((branch) =>
    (branchId && branch.id === branchId)
    || (branchSlug && branch.slug.toLowerCase() === branchSlug.toLowerCase())
    || (branchCode && branch.code.toLowerCase() === branchCode.toLowerCase())
  );
  if (match) return match;

  const name = String(hearse?.branch_name || hearse?.branchName || '').trim();
  if (!name || GENERIC_BRANCH_NAMES.has(name.toLowerCase())) return null;
  return {
    key: branchId || branchSlug || branchCode,
    id: branchId,
    slug: branchSlug,
    code: branchCode,
    name,
  };
}

/* ══════════════════════════ STYLES — mirrors the reference HTML 1:1 ══════════════════════════ */
const pulse = keyframes`0%,100%{opacity:.4}50%{opacity:1}`;
const rot = keyframes`to{transform:rotate(360deg)}`;

const Scrim = styled.div`
  position:fixed;inset:0;z-index:6000;background:rgba(15,23,42,.45);
  opacity:${p => (p.$open ? 1 : 0)};pointer-events:${p => (p.$open ? 'auto' : 'none')};
  transition:opacity .3s ease;
`;
const Panel = styled.aside`
  position:fixed;top:0;right:0;bottom:0;z-index:6100;width:min(88vw,1180px);background:#fff;
  display:flex;flex-direction:column;box-shadow:-30px 0 80px rgba(2,12,27,.35);
  transform:translateX(${p => (p.$open ? '0' : '103%')});
  visibility:${p => (p.$open ? 'visible' : 'hidden')};
  transition:transform .38s cubic-bezier(.32,.72,0,1),visibility 0s linear ${p => (p.$open ? '0s' : '.38s')};
  font-family:'Inter',system-ui,sans-serif;color:${C.text};
  @media(max-width:900px){width:min(94vw,900px)}
  @media(max-width:560px){width:100vw}
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
  flex:1;min-height:0;overflow-y:auto;padding:1.25rem 1.5rem 1.5rem;
  @media(min-width:1100px){
    display:grid;grid-template-columns:minmax(250px,.85fr) minmax(300px,1fr) minmax(300px,1fr);column-gap:1.5rem;
    align-content:start;
    & > section:first-child{grid-column:1;grid-row:1}
    & > section:nth-child(2){grid-column:2;grid-row:1}
    & > section:nth-child(3){grid-column:3;grid-row:1}
  }
  @media(max-width:560px){padding:1rem}
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
const BranchSelect = styled.select`
  width:100%;padding:.5rem .65rem;font:inherit;font-size:.8rem;color:${C.text};
  border:1px solid #d1d5db;border-radius:9px;outline:none;transition:.15s;background:#fff;
  &:focus{border-color:${C.primary};box-shadow:0 0 0 3px rgba(26,95,122,.12)}
`;
/* location suggestions — chips, not a dropdown */
const SuggWrap = styled.div`
  display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem;
`;
const SuggChip = styled.button`
  display:inline-flex;align-items:center;gap:.35rem;
  padding:.32rem .6rem;border:1px solid #d1d5db;border-radius:999px;
  background:#fff;color:${C.muted2};font-size:.7rem;font-weight:700;
  cursor:pointer;transition:.16s;white-space:nowrap;
  &:hover{border-color:${C.primary};color:${C.primary};background:${C.primarySoft};}
  &:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(26,95,122,.16);}
`;
const ChargeWrap = styled.div`
  display:flex;align-items:stretch;border:1px solid #d1d5db;border-radius:9px;overflow:hidden;transition:.15s;background:#fff;
  &:focus-within{border-color:${C.primary};box-shadow:0 0 0 3px rgba(26,95,122,.12)}
  > span{display:flex;align-items:center;padding:0 .55rem;background:${C.bg};font-size:.68rem;font-weight:800;
    color:${C.muted2};border-right:1px solid ${C.line}}
  input{border:none;box-shadow:none;flex:1;min-width:0;&:focus{box-shadow:none}}
`;
const TimePickerWrap = styled.div`position:relative;`;
const TimeTrigger = styled.button`
  width:100%;height:44px;padding:0 .8rem;display:flex;align-items:center;gap:.65rem;
  border:1.5px solid ${p => p.$open ? C.text : C.line};border-radius:12px;background:#fff;
  color:${C.text};font:inherit;font-size:.86rem;font-weight:700;cursor:pointer;text-align:left;
  box-shadow:${p => p.$open ? '0 0 0 4px rgba(17,24,39,.07)' : 'none'};
  svg{color:${C.muted2};flex-shrink:0}
  span{flex:1}
`;
const TimePickerCard = styled.div`
  position:absolute;top:calc(100% + 8px);left:0;z-index:20;width:min(300px, calc(100vw - 40px));
  padding:14px 16px 16px;background:#fff;border:1px solid ${C.line};border-radius:16px;
  box-shadow:0 18px 48px rgba(15,23,42,.18);
`;
const TimePickerTitle = styled.div`
  margin-bottom:8px;color:${C.muted};font-size:.66rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
`;
const TimePickerValue = styled.div`
  margin-bottom:12px;color:${C.text};font-size:1.75rem;font-weight:800;font-variant-numeric:tabular-nums;
  span{margin-left:6px;color:${C.muted};font-size:.78rem;letter-spacing:.04em}
`;
const TimeControls = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;`;
const TimeControl = styled.label`
  display:grid;gap:5px;color:${C.muted2};font-size:.62rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
`;
const TimeSelect = styled.select`
  width:100%;height:44px;padding:0 10px;border:1px solid ${C.line};border-radius:10px;
  color:${C.text};background:#fff;font:inherit;font-size:1rem;font-weight:700;
`;
const PeriodButtons = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;`;
const PeriodButton = styled.button`
  height:36px;border:1px solid ${p => p.$active ? C.text : C.line};border-radius:9px;
  color:${p => p.$active ? '#fff' : C.muted2};background:${p => p.$active ? C.text : '#fff'};
  font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;
`;
const TimeActions = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;`;
const TimeAction = styled.button`
  height:38px;border:0;border-radius:10px;background:${p => p.$primary ? C.text : '#f3f4f6'};
  color:${p => p.$primary ? '#fff' : C.muted2};font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;
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
  open = false, initialDates = [], hearses = [], branches = [],
  onClose, onCreated, showToast,
}) {
  const [form, setForm] = useState({
    hearse_id: '', client_name: '', client_phone: '', deceased_name: '',
    from_location: '', to_location: '', branch_id: '', branch_slug: '',
    branch_code: '', branch_name: '', service_charge: 0,
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
  const [bookingTime, setBookingTime] = useState('');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [draftHour, setDraftHour] = useState('9');
  const [draftMinute, setDraftMinute] = useState('00');
  const [draftPeriod, setDraftPeriod] = useState('AM');
  const [selectedBranchKey, setSelectedBranchKey] = useState('');
  const [showFromSugg, setShowFromSugg] = useState(false);
  const [showToSugg, setShowToSugg] = useState(false);
  const userProfile = safeUser();
  const branchOptions = useMemo(() => getBranchOptions(branches, userProfile), [branches]);

  const selectBranch = (branch) => {
    setSelectedBranchKey(branch?.key || '');
    setForm((current) => ({
      ...current,
      branch_id: branch?.id || '',
      branch_slug: branch?.slug || '',
      branch_code: branch?.code || '',
      branch_name: branch?.name || '',
    }));
  };

  /* location suggestion pickers — fill the field, manual typing still allowed */
  const pickFrom = (loc) => {
    setForm((p) => ({ ...p, from_location: loc }));
    setShowFromSugg(false);
  };
  const pickTo = (loc) => {
    setForm((p) => ({ ...p, to_location: loc }));
    setShowToSugg(false);
  };

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
    const branchId = u.branchId || u.branch_id || u.branch?.branchId || u.branch?.branch_id || localStorage.getItem('branchId') || '';
    const branchSlug = u.branchSlug || u.branch_slug || u.branchDbName
      || u.branch?.branchSlug || u.branch?.branch_slug
      || localStorage.getItem('branchSlug') || localStorage.getItem('branchDbName') || '';
    const defaultBranch = branchOptions.find((branch) =>
      (branchId && branch.id === String(branchId))
      || (branchSlug && branch.slug.toLowerCase() === String(branchSlug).toLowerCase())
    ) || (branchOptions.length === 1 ? branchOptions[0] : null);
    setSelectedBranchKey(defaultBranch?.key || '');
    setForm({
      hearse_id: '', client_name: '', client_phone: '', deceased_name: '',
      from_location: '', to_location: '',
      branch_id: defaultBranch?.id || String(branchId),
      branch_slug: defaultBranch?.slug || String(branchSlug),
      branch_code: defaultBranch?.code || u.branchCode || u.branch_code || u.branch?.branchCode || u.branch?.branch_code || '',
      branch_name: defaultBranch?.name || u.branchName || u.branch_name || u.branch?.branchName || u.branch?.branch_name || '',
      service_charge: 0,
    });
    setBookingTime('');
    setTimePickerOpen(false);
    setDraftHour('9'); setDraftMinute('00'); setDraftPeriod('AM');
    setAnchor(null); setFleet({}); setCheckError(null); setErr('');
    setPkM(d[0] ? new Date(d[0] + 'T00:00:00').getMonth() : new Date().getMonth());
    setPkY(d[0] ? new Date(d[0] + 'T00:00:00').getFullYear() : new Date().getFullYear());
  }, [open]);

  useEffect(() => {
    if (!open || selectedBranchKey || !branchOptions.length) return;
    const u = safeUser();
    const branchId = u.branchId || u.branch_id || u.branch?.branchId || u.branch?.branch_id || localStorage.getItem('branchId') || '';
    const branchSlug = u.branchSlug || u.branch_slug || u.branchDbName
      || u.branch?.branchSlug || u.branch?.branch_slug
      || localStorage.getItem('branchSlug') || localStorage.getItem('branchDbName') || '';
    const defaultBranch = branchOptions.find((branch) =>
      (branchId && branch.id === String(branchId))
      || (branchSlug && branch.slug.toLowerCase() === String(branchSlug).toLowerCase())
    ) || (branchOptions.length === 1 ? branchOptions[0] : null);
    if (defaultBranch) selectBranch(defaultBranch);
  }, [open, branchOptions, selectedBranchKey]);

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

      // Build the fleet map: seed from the full hearse list (prop carries model
      // + status), then merge every day's buckets. The pure helper applies the
      // multi-date rule: a booking on ANY selected date makes the hearse
      // unavailable for the WHOLE selection.
      // It runs in TWO passes because one interleaved day-by-day loop let a
      // later day's `avail` list overwrite an earlier day's booking: with
      // "3 dates selected, 1 already booked" the row used to show "Free" when
      // the conflict fell on the first or middle date.
      const m = mergeFleetAvailability(hearses, dayResults, EXCLUDED);

      if (dayResults.length === 0) {
        const msg = serverError
          ? `Availability check failed: ${serverError}`
          : 'Availability service unreachable. Verify selection before booking.';
        if (showToast) showToast(msg, 'error');
        setCheckError(msg);
      }

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
      if (bookingTime) t += ` · ${formatTimeLabel(bookingTime)}`;
      if (form.branch_name) t += ` · ${form.branch_name}`;
      if (selTotal > 0) t += ` · KSH ${selTotal.toLocaleString()}`;
      return { t, ok: true };
    }
    if (dPart) {
      const timePart = bookingTime ? ` · ${formatTimeLabel(bookingTime)}` : '';
      return { t: `${dPart}${timePart} — pick a hearse` };
    }
    if (bookingTime) return { t: `Pickup time · ${formatTimeLabel(bookingTime)}` };
    return { t: 'Select a date to start' };
  })();

  const canSubmit = !loading && hasD && !!form.hearse_id && !selBlocked
    && !!form.client_name.trim() && !!form.deceased_name.trim()
    && !!form.from_location.trim() && !!form.to_location.trim()
    && !!bookingTime && (!branchOptions.length || !!selectedBranchKey);

  const submit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!dates.length) missing.push('a date');
    if (!form.hearse_id) missing.push('a hearse');
    if (!form.client_name.trim()) missing.push('client name');
    if (!form.deceased_name.trim()) missing.push('deceased name');
    if (!form.from_location.trim()) missing.push('"from"');
    if (!form.to_location.trim()) missing.push('"to"');
    if (!bookingTime) missing.push('pickup time');
    if (branchOptions.length && !selectedBranchKey) missing.push('branch');
    if (missing.length) { setErr('Please add ' + missing.join(', ') + '.'); return; }
    if (checking) { setErr('Still checking availability — try again in a moment.'); return; }
    if (selBlocked) { setErr('That hearse is booked on the selected date(s) — pick another.'); return; }

    setLoading(true); setErr('');
    try {
      const hdr = getAuthHeaders(); hdr['Content-Type'] = 'application/json';
      const u = safeUser();
      if (form.branch_id) hdr['x-branch-id'] = form.branch_id;
      if (form.branch_slug) hdr['x-branch-slug'] = form.branch_slug;
      if (u?.email) hdr['x-user-email'] = u.email;
      hdr['x-user-name'] = u?.full_name || u?.username || u?.name || 'System';
      const fd = `${dates[0]}T${bookingTime}:00`;
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
        booking_time: bookingTime,
        booking_date: dates[0],
        booking_dates: dates,
        booked_by: getLocalUserName() || u?.email || 'System',
        branch_id: form.branch_id || '',
        branch_slug: form.branch_slug || '',
        branch_name: form.branch_name || '',
        branch_code: form.branch_code || '',
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
  const confirmBookingTime = () => {
    const hour12 = Number(draftHour);
    const hour24 = (hour12 % 12) + (draftPeriod === 'PM' ? 12 : 0);
    setBookingTime(`${pad(hour24)}:${draftMinute}`);
    setTimePickerOpen(false);
  };

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
            <Fld>
              <Lbl>Branch {branchOptions.length > 0 && <em>*</em>}</Lbl>
              {branchOptions.length > 0 ? (
                <BranchSelect
                  value={selectedBranchKey}
                  onChange={(event) => {
                    const branch = branchOptions.find((option) => option.key === event.target.value);
                    selectBranch(branch);
                  }}
                  required
                >
                  <option value="">Select the booking branch</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.key} value={branch.key}>{branch.name}</option>
                  ))}
                </BranchSelect>
              ) : (
                <Inp value={form.branch_name || 'Branch name unavailable'} readOnly aria-readonly="true" />
              )}
            </Fld>
            <Fld>
              <Lbl>Pickup time <em>*</em></Lbl>
              <TimePickerWrap>
                <TimeTrigger
                  type="button"
                  $open={timePickerOpen}
                  aria-haspopup="dialog"
                  aria-expanded={timePickerOpen}
                  onClick={() => {
                    if (!timePickerOpen) {
                      const [hour, minute] = bookingTime ? bookingTime.split(':').map(Number) : [9, 0];
                      setDraftHour(String(hour % 12 || 12));
                      setDraftMinute(pad(minute));
                      setDraftPeriod(hour >= 12 ? 'PM' : 'AM');
                    }
                    setTimePickerOpen((value) => !value);
                  }}
                >
                  <Clock size={18} />
                  <span>{bookingTime ? formatTimeLabel(bookingTime) : 'Select pickup time'}</span>
                  <ChevronRight size={15} />
                </TimeTrigger>
                {timePickerOpen && (
                  <TimePickerCard role="dialog" aria-label="Select pickup time">
                    <TimePickerTitle>Pickup time</TimePickerTitle>
                    <TimePickerValue>
                      {draftHour}:{draftMinute}<span>{draftPeriod}</span>
                    </TimePickerValue>
                    <TimeControls>
                      <TimeControl>
                        Hour
                        <TimeSelect value={draftHour} onChange={(event) => setDraftHour(event.target.value)}>
                          {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => (
                            <option key={hour} value={hour}>{hour}</option>
                          ))}
                        </TimeSelect>
                      </TimeControl>
                      <TimeControl>
                        Minute
                        <TimeSelect value={draftMinute} onChange={(event) => setDraftMinute(event.target.value)}>
                          {Array.from({ length: 12 }, (_, index) => pad(index * 5)).map((minute) => (
                            <option key={minute} value={minute}>{minute}</option>
                          ))}
                        </TimeSelect>
                      </TimeControl>
                    </TimeControls>
                    <PeriodButtons>
                      {['AM', 'PM'].map((period) => (
                        <PeriodButton key={period} type="button" $active={draftPeriod === period} onClick={() => setDraftPeriod(period)}>
                          {period}
                        </PeriodButton>
                      ))}
                    </PeriodButtons>
                    <TimeActions>
                      <TimeAction type="button" onClick={() => setTimePickerOpen(false)}>Cancel</TimeAction>
                      <TimeAction type="button" $primary onClick={confirmBookingTime}>Done</TimeAction>
                    </TimeActions>
                  </TimePickerCard>
                )}
              </TimePickerWrap>
            </Fld>
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
                onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))}
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
              <Lbl>To <em>*</em></Lbl>
              <Inp placeholder="e.g., Karen Memorial Park" value={form.to_location}
                onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))}
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