import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getTenantSlug, getAuthToken, getBranchScopeHeaders } from '../../../utils/globalAuth';
import { DECEASED_CHANGED_EVENT } from '../../../api/dashboardDataApi';
import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import DeceasedStkPushModal from '../DeceasedStkPushModal';
import {
  formatDate, todayKey,
} from '../../../utils/dates/parseDates';
import { getDaysInMorgue } from '../deceasedProfile/theme';
import { normalizeYM, ymFromDate } from '../../../utils/dates/ym';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const API_GATEWAY_URL = import.meta.env.VITE_API_URL || '/api/v1/restpoint';
const BASE_URL = `${API_GATEWAY_URL}/deceased`;

// ─── Global Font Styles & Body Reset ────────────────────────────────
const GlobalFonts = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; overflow-x: hidden; background-color: #ececec; }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const C = {
  black: '#0a0a0a', dark: '#1a1a1a', mid: '#444444', gray: '#777777',
  lightGray: '#aaaaaa', border: '#e0e0e0', borderLight: '#efefef',
  bgField: '#f7f7f5', bgSection: '#fafaf9', bgApp: '#ececec',
  exportBtn: '#0F3040', success: '#047857', successBg: '#ecfdf5',
  warning: '#b45309', warningBg: '#fffbeb', danger: '#dc2626',
  dangerBg: '#fef2f2', info: '#1e3a8a', infoBg: '#e0e7ff', brown: '#795548',
  cBlue: '#00296B', cOrange: '#E36414', cPurple: '#5F0F40',
  cPink: '#DD2D4A', cNavy: '#03071E',
  stPending: '#d97706', stBooked: '#00296B', stScheduled: '#E36414',
  stInProgress: '#0c0b0f', stCompleted: '#5F0F40', stDelivered: '#132A13',
  stCancelled: '#DD2D4A', stMaintenance: '#03071E',
  accent: '#DD2D4A',
};

/* Status wording + colours now match the Operations dashboard exactly
   (dashboard/opsData.js CARE and the --blue/--orange/--plum/--green/--gray
   custom properties in dashboard.css). The `filter` values are untouched so
   the existing status filtering keeps working. */
const STATUS_CONFIG = {
  'under care': { label: 'In Care', c: C.cBlue, filter: 'under care' },
  admitted: { label: 'In Care', c: C.cBlue, filter: 'admitted' },
  postmortem: { label: 'PM Requested', c: C.cOrange, filter: 'under care' },
  pending: { label: 'Scheduled', c: C.gray, filter: 'under care' },
  released: { label: 'Released', c: C.success, filter: 'released' },
  completed: { label: 'PM Done', c: C.cPurple, filter: 'completed' },
  cancelled: { label: 'Cancelled', c: C.gray, filter: 'other' },
  maintenance: { label: 'Maintenance', c: C.gray, filter: 'other' },
  default: { label: 'In Care', c: C.cBlue, filter: 'under care' },
};



const getStatusInfo = (statusStr) => {
  const raw = String(statusStr ?? '').trim();
  if (!raw) return STATUS_CONFIG['under care'];
  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const aliases = {
    active: STATUS_CONFIG['under care'],
    received: STATUS_CONFIG['under care'],
    'under care': STATUS_CONFIG['under care'],
    'in care': STATUS_CONFIG['under care'],
    'in morgue': STATUS_CONFIG['under care'],
    morgue: STATUS_CONFIG['under care'],
    embalmed: STATUS_CONFIG['under care'],
    pending: STATUS_CONFIG.pending,
    'pending release': STATUS_CONFIG.pending,
    'awaiting release': STATUS_CONFIG.pending,
    admitted: STATUS_CONFIG.admitted,
    booked: STATUS_CONFIG.admitted,
    postmortem: STATUS_CONFIG.postmortem,
    'postmortem requested': STATUS_CONFIG.postmortem,
    'post mortem requested': STATUS_CONFIG.postmortem,
    'pending autopsy': STATUS_CONFIG.postmortem,
    'postmortem done': STATUS_CONFIG.postmortem,
    'post mortem done': STATUS_CONFIG.postmortem,
    released: STATUS_CONFIG.released,
    'released to family': STATUS_CONFIG.released,
    transferred: STATUS_CONFIG.released,
    transfer: STATUS_CONFIG.released,
    dispatched: STATUS_CONFIG.released,
    buried: STATUS_CONFIG.released,
    'ready for collection': STATUS_CONFIG.released,
    ready: STATUS_CONFIG.released,
    completed: STATUS_CONFIG.completed,
    complete: STATUS_CONFIG.completed,
    cancelled: STATUS_CONFIG.cancelled,
    canceled: STATUS_CONFIG.cancelled,
    maintenance: STATUS_CONFIG.maintenance,
    'out of service': STATUS_CONFIG.maintenance,
    'in maintenance': STATUS_CONFIG.maintenance,
    default: STATUS_CONFIG.default,
  };
  if (aliases[normalized]) return aliases[normalized];
  const fallback = normalized.length >= 3
    ? Object.entries(STATUS_CONFIG).find(([key]) => {
      if (key === 'default') return false;
      return normalized.includes(key) || key.includes(normalized);
    })
    : null;
  return fallback?.[1] || STATUS_CONFIG['under care'];
};

const toDateString = (dateObj) => {
  if (!dateObj || isNaN(new Date(dateObj).getTime())) return null;
  const d = new Date(dateObj);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── Styled Components ──────────────────────────────────────────────
const AppContainer = styled.div`
  font-family: 'Inter', -apple-system, sans-serif;
  color: ${C.dark}; font-size: 14px; line-height: 1.5;
  min-height: 100dvh; margin: 0 auto; padding: 10px;
  width: 100%; max-width: 2200px;
  animation: ${fadeIn} 0.25s ease-out; box-sizing: border-box;
  @media (max-width: 768px) { padding: 6px; }
`;

// ─── TOOLBAR: desktop = one line, mobile = wraps cleanly ───
// The white card behind the controls is gone: it boxed in a strip of inputs that
// already have their own borders, which made the bar read as a second panel
// stacked on the page. `flex-wrap: wrap` (rather than nowrap + overflow-x) is
// what keeps the row from collapsing into a horizontal scroller on mid-width
// screens, where the old version squeezed the search box to nothing.
const Toolbar = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: transparent; border: 1px solid ${C.borderLight};
  border-radius: 14px; padding: 10px 12px;
  margin-bottom: 20px; box-sizing: border-box; width: 100%;
  min-width: 0;
  @media (max-width: 768px) { padding: 10px; border-radius: 12px; }
`;

// Wraps internally instead of being forced to 100% + a manual `order` on each
// child. The old fixed-basis rows were what overlapped and re-flowed oddly once
// the viewport crossed 768px.
const ToolbarLeft = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex: 1 1 380px; min-width: 0;
`;

const ToolbarRight = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex: 0 0 auto; margin-left: auto; min-width: 0;
  /* Below 768px the button row drops to its own line and stretches. */
  @media (max-width: 768px) { margin-left: 0; flex: 1 1 100%; }
`;

const ToolbarDivider = styled.div`
  width: 1px; height: 24px; background: ${C.border}; flex-shrink: 0;
  @media (max-width: 768px) { display: none; }
`;

const SearchWrapper = styled.div`
  position: relative; display: flex; align-items: center;
  flex: 1 1 220px; min-width: 170px; max-width: 320px;
  /* Mobile: full width, own row */
  @media (max-width: 768px) {
    flex: 1 1 100%; max-width: 100%;
  }
`;

const SearchIcon = styled.i`
  position: absolute; left: 13px; color: ${C.gray};
  font-size: 13px; pointer-events: none; z-index: 1; transition: color 0.2s;
`;

// A real search field, not a bare underline. The borderless variant looked like
// an unfinished line next to the boxed filter dropdowns, and on a busy list page
// it gave no visual cue that the control was interactive at all. It now shares
// the filters' exact height/radius/fill so the whole control row reads as one
// set of peers.
const SearchInput = styled.input`
  height: 38px; width: 100%;
  border-radius: 10px;
  border: 1px solid ${C.border}; background: ${C.bgField};
  padding: 0 12px 0 34px; font-size: 14px;
  font-family: 'Inter', sans-serif; color: ${C.dark};
  transition: all 0.2s ease; outline: none; box-sizing: border-box;
  min-width: 0;
  &::placeholder { color: #aaa; }
  &:focus { background: white; border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(221,45,74,0.1); }
  &:focus ~ ${SearchIcon} { color: ${C.accent}; }
`;

/* Filters share the search field's metrics exactly (38px / 10px radius / same
   fill) so the control row reads as one uniform set. min-width stops a
   three-across layout from crushing the labels into "All S…". */
const FilterWrapper = styled.div`
  position: relative; display: flex; align-items: center; flex-shrink: 0;
  flex: 1 1 130px; min-width: 118px; max-width: 190px;
  @media (max-width: 768px) {
    flex: 1 1 0; min-width: 0; max-width: none;
  }
  /* The year picker only ever shows four digits, so it gets a fixed narrow
     track. This is a prop rather than an inline max-width because an inline
     style would win over the media query above and the control could not
     rebalance when the three filters share a row on a phone. */
  ${p => p.$year && 'flex: 0 0 96px; max-width: 96px;'}
`;

const FilterSelect = styled.select`
  height: 38px; border-radius: 10px;
  border: 1px solid ${C.border}; background: ${C.bgField};
  padding: 0 32px 0 12px; font-size: 13.5px; font-weight: 500;
  font-family: 'Inter', sans-serif; color: ${C.dark};
  cursor: pointer; outline: none; appearance: none; -webkit-appearance: none;
  transition: all 0.2s ease; box-sizing: border-box;
  width: 100%; min-width: 0; text-overflow: ellipsis;
  &:focus { background: white; border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(221,45,74,0.1); }
`;

const SelectArrow = styled.i`
  position: absolute; right: 12px; color: ${C.gray};
  pointer-events: none; font-size: 11px; transition: color 0.2s;
  ${FilterWrapper}:hover & { color: ${C.dark}; }
`;

// ─── Buttons ──
// Slimmer to match the 38px controls: the old 42px height + 20px side padding
// made the three action buttons the heaviest, most attention-grabbing thing in
// the bar, which is wrong — they are secondary to the search and filters. The
// per-variant drop shadows are removed for the same reason: three raised
// buttons next to flat inputs read as a different, louder interface.
const Btn = styled.button`
  height: 38px; padding: 0 15px; border-radius: 10px;
  font-weight: 600; font-size: 13px; cursor: pointer;
  border: 1px solid transparent; transition: all 0.2s ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  font-family: 'Inter', sans-serif; white-space: nowrap; box-sizing: border-box;
  flex-shrink: 0; min-width: 0;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  i { font-size: 12px; }

  @media (max-width: 768px) {
    flex: 1 1 0; min-width: 0; padding: 6px 8px; font-size: 12px; gap: 5px;
    height: auto; min-height: 44px; line-height: 1.25;
    white-space: normal; overflow: visible; text-align: center;
    i { font-size: 13px; }
  }

  ${p => p.$ghost && `background: ${C.bgField}; border: 1px solid ${C.border}; color: ${C.mid};
    &:hover { background: #eef2f6; border-color: ${C.gray}; color: ${C.black}; }`}

  ${p => p.$danger && `background: #dc2626; color: white;
    &:hover:not(:disabled) { background: #b91c1c; }`}

  ${p => p.$admission && `background: ${C.stBooked}; color: white;
    &:hover:not(:disabled) { background: #001f50; }`}

  ${p => p.$export && `background: ${C.exportBtn}; color: white;
    &:hover:not(:disabled) { background: #0c2530; }`}

  ${p => p.$primary && `background: ${C.black}; color: white;
    &:hover:not(:disabled) { background: ${C.dark}; }`}

  ${p => p.$sm && `height: 32px; padding: 0 14px; font-size: 12.5px; border-radius: 8px;`}
`;

// ─── List Components ───
const ListCard = styled.div`

  border-radius: 10px; overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03); width: 100%; box-sizing: border-box;
`;
const ListHeader = styled.div`
  background: ${C.bgSection}; padding: 20px 24px;
  border-bottom: 1px solid ${C.borderLight};
  h2 { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700; color: ${C.black}; margin: 0; }
  @media (max-width: 768px) { padding: 16px; }
`;
const TableWrap = styled.div`
  width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
  @media (max-width: 768px) { display: none; }
`;
const StyledTable = styled.table`
  width: 100%; border-collapse: collapse; min-width: 900px;
  thead th { text-align: left; padding: 14px 24px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em; color: ${C.gray};
    border-bottom: 1px solid ${C.borderLight}; background: ${C.bgSection}; white-space: nowrap;
    &:last-child { text-align: right; } }
  tbody tr { border-bottom: 1px solid ${C.borderLight}; cursor: pointer; transition: background 0.15s;
    &:last-child { border-bottom: none; } &:hover { background: ${C.bgField}; } }
  td { padding: 16px 24px; font-size: 14px; color: ${C.dark}; vertical-align: middle;
    &:last-child { text-align: right; } }
`;
const NameCell = styled.div`
  display: flex; align-items: center; gap: 12px;
  .meta { font-size: 12px; color: ${C.gray}; margin-top: 2px; }
`;
const AvatarSm = styled.div`
  width: 38px; height: 38px; border-radius: 50%; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  background: ${p => p.$female ? C.cPurple : C.black};
`;
/* Status display — mirrors the Operations dashboard's status chip
   (dashboard/opsBits.jsx `StatusChip` + the `.rpd .st` rules in dashboard.css):
   a small solid dot followed by the label in the state colour. Replaces the
   old filled StatusBadge block so both screens read identically. */
const StatusBadge = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  color: ${p => p.$c};
  &::before {
    content: ''; width: 7px; height: 7px; border-radius: 50%;
    flex: 0 0 auto; background: ${p => p.$c};
  }
`;
const EmptyRow = styled.td`text-align: center; padding: 40px; color: ${C.gray};`;
const LoadingState = styled.div`
  text-align: center; padding: 60px; color: ${C.gray};
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  .spinner { width: 24px; height: 24px; border: 2px solid ${C.borderLight}; border-top-color: ${C.accent}; border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const MobileCardContainer = styled.div`
  display: none;
  @media (max-width: 768px) { display: flex; flex-direction: column; gap: 16px; padding: 16px; width: 100%; }
`;
const MobileCard = styled.div`
  background: white; border: 1px solid ${C.borderLight}; border-radius: 12px;
  padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); cursor: pointer;
  transition: 0.2s; width: 100%; box-sizing: border-box;
  &:active { transform: scale(0.98); background: ${C.bgField}; }
`;
const MobileCardHeader = styled.div`display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;`;
const MobileCardNameWrap = styled.div`display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; div div:first-child { font-size: 16px; font-weight: 700; color: ${C.black}; } div div:last-child { font-size: 13px; color: ${C.gray}; }`;
const MobileCardDetails = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; border-top: 1px solid ${C.borderLight}; div { display: flex; flex-direction: column; } span { font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${C.gray}; letter-spacing: 0.08em; margin-bottom: 4px; } strong { font-size: 14px; color: ${C.dark}; font-weight: 600; }`;
const MobileCardFooter = styled.div`margin-top: 16px; display: flex; justify-content: flex-end;`;

// ─── Modal Components ───
const ModalOverlay = styled.div`display: ${p => p.$open ? 'flex' : 'none'}; position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 1000; justify-content: flex-end; align-items: stretch; animation: ${fadeIn} 0.2s ease-out;`;
const ModalContent = styled.div`background: white; width: 100%; max-width: 560px; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); animation: ${slideInRight} 0.25s ease-out; @media (max-width: 768px) { max-width: 100%; width: 100%; border-radius: 0; }`;
const ModalHeader = styled.div`padding: 18px 24px; border-bottom: 1px solid ${C.borderLight}; display: flex; justify-content: space-between; align-items: flex-start; position: sticky; top: 0; background: linear-gradient(135deg, ${C.exportBtn} 0%, ${C.cNavy} 100%); z-index: 10; h2 { font-family: 'Inter', sans-serif; font-size: 17px; color: white; margin: 0; display: flex; align-items: center; gap: 10px; } p { margin: 4px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.75); }`;
const ModalBody = styled.div`flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 20px 24px;`;
const ModalFooter = styled.div`padding: 14px 24px; border-top: 1px solid ${C.borderLight}; display: flex; gap: 10px; justify-content: flex-end; position: sticky; bottom: 0; background: white; @media (max-width: 768px) { flex-direction: column-reverse; button { width: 100%; } }`;
const CloseBtn = styled.button`background: none; border: none; font-size: 24px; color: ${C.gray}; cursor: pointer; line-height: 1; &:hover { color: ${C.black}; }`;
const NotifyOverlay = styled.div`position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; animation: ${fadeIn} 0.2s ease-out;`;
const NotifyCard = styled.div`background: white; border-radius: 14px; width: 100%; max-width: 430px; padding: 28px 24px 20px; text-align: center; box-sizing: border-box; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); animation: ${fadeIn} 0.25s ease-out; @media (max-width: 768px) { max-width: 100%; padding: 22px 16px 16px; }`;
const NotifyIcon = styled.div`width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 26px;`;
const NotifyTitle = styled.div`font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 6px;`;
const NotifyMessage = styled.div`font-size: 13.5px; color: ${C.gray}; line-height: 1.6; margin-bottom: 18px; overflow-wrap: anywhere;`;
const NotifyActions = styled.div`display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; & + & { margin-top: 10px; } @media (max-width: 480px) { flex-direction: column-reverse; button { width: 100%; } }`;
const NotifyHint = styled.div`margin-top: 16px; padding-top: 14px; border-top: 1px solid ${C.borderLight}; font-size: 11px; color: ${C.lightGray}; display: flex; align-items: center; justify-content: center; gap: 6px;`;
const HistorySection = styled.div`display: flex; flex-direction: column; gap: 10px; margin-top: 8px;`;
const HistoryItem = styled.div`display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid ${C.borderLight}; border-radius: 8px; background: white; transition: all 0.15s ease; &:hover { border-color: ${C.border}; background: ${C.bgSection}; } .h-file { flex: 1; min-width: 0; } .h-name { font-size: 12.5px; font-weight: 600; color: ${C.dark}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .h-meta { font-size: 11px; color: ${C.gray}; margin-top: 3px; } .h-link { font-size: 11px; color: ${C.exportBtn}; text-decoration: none; font-weight: 600; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; &:hover { text-decoration: underline; color: ${C.black}; } }`;
const EmptyHistory = styled.div`padding: 18px; border: 1px dashed ${C.border}; border-radius: 8px; text-align: center; color: ${C.gray}; font-size: 12px; line-height: 1.6;`;
const SectionHead = styled.div`background: ${C.black}; color: white; padding: 8px 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px; border-radius: 2px; display: flex; align-items: center; gap: 8px; span { opacity: 0.5; font-size: 10px; } ${p => p.$mt0 && 'margin-top: 0;'} ${p => p.$mt4 && 'margin-top: 32px;'}`;
const FormRow = styled.div`display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; @media (max-width: 768px) { flex-direction: column; gap: 12px; margin-bottom: 12px; } }`;
const FormGroup = styled.div`flex: 1; min-width: 150px; box-sizing: border-box;`;
const FormLabel = styled.label`display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.gray}; margin-bottom: 6px;`;
const ModalInput = styled.input`height: 42px; width: 100%; border: 1px solid ${C.border}; border-radius: 10px; padding: 0 12px; font-family: 'Inter', sans-serif; font-size: 14px; color: ${C.dark}; background: ${C.bgField}; box-sizing: border-box; &:focus { outline: none; border-color: ${C.accent}; background: white; box-shadow: 0 0 0 4px rgba(221,45,74,0.1); } }`;
const StatusTag = styled.span`display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; background: ${p => p.$success ? C.successBg : p.$warning ? C.warningBg : p.$info ? C.infoBg : C.bgField}; color: ${p => p.$success ? C.success : p.$warning ? C.warning : p.$info ? C.info : C.gray}; border: 1px solid ${p => p.$success ? '#a7f3d0' : p.$warning ? '#fde68a' : p.$info ? '#bfdbfe' : C.borderLight};`;

// ─── HorizontalCalendar ───
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toMonday(d) { const r = new Date(d); const day = r.getDay(); r.setDate(r.getDate() - ((day + 6) % 7)); return r; }
function dk(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Day-cell dots — same orange / blue / green palette the Operations dashboard
   mini-calendar uses (dashboard/opsData.js TYPE_C:
   intake → blue, release → green, postmortem → orange). Mapped from the
   STATUS_CONFIG labels defined above so the strip agrees with the status
   badges in the table. */
const EVENT_DOT_COLORS = {
  'In Care': '#2563EB',        // blue   — intake / still in care
  'Scheduled': '#2563EB',      // blue   — in care, appointment pending
  'Released': '#10B981',       // green  — release
  'PM Requested': '#F59E0B',   // orange — postmortem
  'PM Done': '#F59E0B',        // orange — postmortem
  'Cancelled': '#9CA3AF',      // gray
  'Maintenance': '#9CA3AF',    // gray
};
const EVENT_DOT_FALLBACK = '#2563EB';

function HorizontalCalendar({ eventsData = [], selectedDate, onDateSelect }) {
  const [viewStart, setViewStart] = useState(() => toMonday(new Date()));
  const stripRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(7);

  const eventCounts = useMemo(() => {
    const map = {};
    eventsData.forEach((ev) => {
      const date = new Date(ev.date);
      if (isNaN(date.getTime())) return;
      const key = dk(date.getFullYear(), date.getMonth(), date.getDate());
      if (!map[key]) map[key] = { count: 0, colors: [] };
      map[key].count += 1;
      const color = ev.color || EVENT_DOT_FALLBACK;
      if (!map[key].colors.includes(color)) map[key].colors.push(color);
    });
    return map;
  }, [eventsData]);

  const todayKey = dk(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(viewStart, i);
      const key = dk(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEvents = eventCounts[key];
      arr.push({ date: d, key, dayName: DOWS[(d.getDay() + 6) % 7], dayNum: d.getDate(), count: dayEvents ? dayEvents.count : 0, colors: dayEvents ? dayEvents.colors : [], isToday: key === todayKey, isSelected: selectedDate != null && key === dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) });
    }
    return arr;
  }, [viewStart, eventCounts, todayKey, selectedDate]);

  useEffect(() => {
    const targetKey = selectedDate ? dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : todayKey;
    const el = document.getElementById(`dc-${targetKey}`);
    if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50); }
  }, [selectedDate, viewStart, todayKey]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => { const available = Math.max(el.clientWidth - 28, 40); const count = Math.max(1, Math.floor(available / 44)); setVisibleCount(Math.min(count, 30)); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const title = useMemo(() => {
    const s = addDays(viewStart, 0); const e = addDays(viewStart, 29);
    const sm = s.getMonth(), sy = s.getFullYear(); const em = e.getMonth(), ey = e.getFullYear();
    if (sm === em && sy === ey) return `${MOS_SHORT[sm]} ${sy}`;
    if (sy === ey) return `${MOS_SHORT[sm]}–${MOS_SHORT[em]} ${sy}`;
    return `${MOS_SHORT[sm]} ${sy}–${MOS_SHORT[em]} ${ey}`;
  }, [viewStart]);

  const prevWeek = () => setViewStart((v) => addDays(v, -7));
  const nextWeek = () => setViewStart((v) => addDays(v, 7));
  const pickDate = (date) => { if (onDateSelect) onDateSelect(date); };

  return (
    <div style={{ background: 'transparent', borderRadius: 10, border: 'none', fontFamily: 'Inter, sans-serif', width: '100%', maxWidth: 2200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 6px 0' }}>
        <button onClick={prevWeek} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '12px', lineHeight: 1, transition: 'all 0.15s', outline: 'none' }} title="Previous week">←</button>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.3px' }}>{title}</span>
        <button onClick={nextWeek} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '12px', lineHeight: 1, transition: 'all 0.15s', outline: 'none' }} title="Next week">→</button>
      </div>
      <div ref={stripRef} style={{ display: 'flex', justifyContent: 'flex-start', overflowX: 'hidden', overflowY: 'hidden', padding: '2px 0', gap: 3, scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', minHeight: 70 }} className="ds-scroll-hide">
        {days.slice(0, visibleCount).map((day) => {
          const { isToday, isSelected } = day;
          let bg = 'transparent'; let border = '1.5px solid transparent'; let textColor = '#111827'; let dayNameColor = '#9ca3af'; let badgeBg = '#e5e7eb'; let badgeColor = '#6b7280';
          if (isToday && !isSelected) { border = '1.5px solid #d80505'; }
          if (isSelected) { bg = 'rgb(244, 0, 0)'; textColor = '#fff'; dayNameColor = 'rgba(255,255,255,0.8)'; badgeBg = 'rgba(255,255,255,0.2)'; badgeColor = '#fff'; }
          return (
            <button key={day.key} id={`dc-${day.key}`} onClick={() => pickDate(day.date)} style={{ flex: '1 0 36px', padding: '4px 2px 3px', borderRadius: 7, border, background: bg, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none', position: 'relative', minWidth: 30 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: dayNameColor, marginBottom: 1, opacity: isSelected ? 1 : 0.7 }}>{day.dayName}</div>
              <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600, color: textColor, lineHeight: 1.2 }}>{day.dayNum}</div>
              {day.count > 0 && (
                <div
                  title={`${day.count} event${day.count > 1 ? 's' : ''} · ${day.colors.join(' · ')}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 1, maxWidth: '100%' }}
                >
                  {day.colors.slice(0, 3).map((c) => (
                    <span key={c} style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  ))}
                  <span style={{ display: 'inline-block', fontSize: '7px', fontWeight: 700, padding: '0px 3px', borderRadius: 3, background: badgeBg, color: badgeColor, lineHeight: 1.5 }}>{day.count}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <style>{`.ds-scroll-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
const DeceasedList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(() => { const s = searchParams.get('search'); return s ? String(s) : ''; });
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  // Year-only scoping — NO month filter on this list. The page always fetches
  // ONE full calendar year (current Nairobi year by default); a bad ?year=
  // falls back to the current year via normalizeYM, and a stale ?month= in
  // the URL is ignored entirely.
  const initYM = normalizeYM({ year: searchParams.get('year') });
  const [calYear, setCalYear] = useState(initYM.year);
  const [selectedDate, setSelectedDate] = useState(null);
  const setSearchParamsRef = useRef(null);
  setSearchParamsRef.current = setSearchParams;
  const [showExport, setShowExport] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportPin, setExportPin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [exportNotify, setExportNotify] = useState(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [showStkPush, setShowStkPush] = useState(false);
  const exportCleanupRef = useRef(null);

  const fetchDeceased = useCallback(async () => {
    setLoading(true); setServiceUnavailable(false); setUnavailableMessage('');
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      // The deceased-service resolves its DATABASE from these headers, so a

      const headers = { 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) };
      const collected = []; let pageNum = 1; const pageSize = 200; let totalPages = 2;
      // `_t` + no-store: never let the browser (or an intermediary) answer this
      // read with a cached page — a just-registered body must appear here the
      // moment the list loads.
      const bust = Date.now();
      while (pageNum <= totalPages && pageNum <= 12) {
        // Year-only fetch — NO month param travels on this list.
        const ymParams = { year: String(calYear) };
        const params = { ...ymParams, page: pageNum, limit: pageSize, _t: bust };
        if (search) params.search = search;
        if (setSearchParamsRef.current) { setSearchParamsRef.current({ year: String(calYear), page: pageNum, limit: pageSize }, { replace: true }); }
        const res = await axios.get(`${BASE_URL}/deceased-all`, { params, headers, cache: 'no-store' });
        const data = res.data?.data || res.data || [];
        const rows = Array.isArray(data) ? data : [];
        collected.push(...rows);
        const pagination = res.data?.pagination;
        if (pagination?.totalPages) { totalPages = Math.min(Number(pagination.totalPages) || 1, 12); }
        if (rows.length < pageSize) break;
        pageNum += 1;
      }
      setRecords(collected); return true;
    } catch (err) {

      if (err.friendlyMessage) { setServiceUnavailable(true); setUnavailableMessage(err.friendlyMessage); }
      return false;
    } finally { setLoading(false); }
  }, [search, calYear]);

  useEffect(() => { fetchDeceased(); }, [fetchDeceased]);

  // ─── Live freshness ───
  // 1) A register/release anywhere in the app fires DECEASED_CHANGED_EVENT.
  // 2) Returning to a tab that has been in the background re-reads the list.
  // Both keep this page honest without hammering the API on every focus.
  useEffect(() => {
    const refreshedAtRef = { current: Date.now() };
    const refresh = () => { refreshedAtRef.current = Date.now(); fetchDeceased(); };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - refreshedAtRef.current < 30 * 1000) return;
      refresh();
    };
    window.addEventListener(DECEASED_CHANGED_EVENT, refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(DECEASED_CHANGED_EVENT, refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchDeceased]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const ok = await fetchDeceased();
      if (ok) { showToast.success('Deceased records refreshed'); }
      else { showToast.error('Failed to refresh records. Please try again.'); }
    } catch (err) { console.error('Error refreshing:', err); showToast.error('Failed to refresh records. Please try again.'); }
    finally { setRefreshing(false); }
  }, [fetchDeceased, refreshing]);

  useEffect(() => { return () => { if (exportCleanupRef.current) { exportCleanupRef.current(); } }; }, []);

  const yearRecords = useMemo(() => {
    if (!calYear) return records;
    return records.filter(r => { const admitted = r.created_at || r.date_admitted || r.admission_date; const d = new Date(admitted); return !isNaN(d.getTime()) && d.getFullYear() === Number(calYear); });
  }, [records, calYear]);

  const filteredRecords = yearRecords.filter(r => {
    const name = (r.full_name || r.name || '').toLowerCase();
    const id = (r.deceased_id || r.id || '').toLowerCase();
    const adm = (r.admission_number || r.admission_no || '').toLowerCase();
    const searchTerm = search.toLowerCase();
    if (search && !name.includes(searchTerm) && !id.includes(searchTerm) && !adm.includes(searchTerm)) return false;
    if (statusFilter) {
      const { filter } = getStatusInfo(r.body_status || r.status);
      if (statusFilter === 'under care') { if (filter !== 'under care' && filter !== 'admitted') return false; }
      else if (statusFilter === 'admitted') { if (filter !== 'admitted' && filter !== 'under care') return false; }
      else if (statusFilter === 'other') { if (filter !== 'other') return false; }
      else if (statusFilter !== filter) { return false; }
    }
    if (genderFilter) { const sex = (r.sex || r.gender || '').toLowerCase(); if (genderFilter.toLowerCase() !== sex) return false; }
    if (selectedDate) { const admitted = r.created_at || r.date_admitted || r.admission_date; const recordDateStr = toDateString(admitted); const selectedDateStr = toDateString(selectedDate); if (recordDateStr !== selectedDateStr) return false; }
    return true;
  });

  const getInitials = (name) => { if (!name) return 'NA'; return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); };
  const getDaysForRecord = (record, admittedDate) => {
    const released = [record.body_status, record.admission_status, record.release_status, record.status]
      .filter(Boolean)
      .some((status) => getStatusInfo(status).filter === 'released');
    const releaseDate = released
      ? record.dispatch_date || record.release_date || record.date_released
      : null;
    return getDaysInMorgue(admittedDate, releaseDate);
  };
  const openProfile = (id) => { const tenantSlug = getTenantSlug(); navigate(`/${tenantSlug}/deceased?id=${encodeURIComponent(id)}`); };

  // ─── Export Functions ───
  const filenameFromDisposition = (response, fallback) => { const disp = String(response?.headers?.['content-disposition'] || ''); const match = disp.match(/filename="?([^";]+)"?/i); return match ? match[1] : fallback; };
  const downloadExportBlob = (blob, filename) => { const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.target = '_blank'; link.rel = 'noopener'; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url); };
  const uploadsOrigin = () => { const api = import.meta.env.VITE_API_URL || ''; if (/^https?:\/\//i.test(api)) { try { return new URL(api).origin; } catch (e) { /* ignore */ } } return window.location.origin; };
  const downloadExportFile = async (fileUrl, fileName) => {
    if (!fileUrl) return false;
    const absFileUrl = /^https?:\/\//i.test(fileUrl) ? fileUrl : `${uploadsOrigin()}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    try {
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const res = await fetch(absFileUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      downloadExportBlob(await res.blob(), fileName || 'export.xlsx');
      return true;
    } catch (e) {
      const link = document.createElement('a');
      link.href = absFileUrl; link.download = fileName || 'export.xlsx'; link.target = '_blank'; link.rel = 'noopener';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      return true;
    }
  };


  const closeExportNotify = useCallback(() => { setExportNotify(null); }, []);
  const downloadExportCopy = useCallback(() => { if (exportNotify?.fileUrl) { downloadExportFile(exportNotify.fileUrl, exportNotify.fileName); return; } const blob = exportNotify?.blob; if (!blob) return; downloadExportBlob(blob, exportNotify?.fileName || `Deceased_Records_${todayKey()}.xlsx`); }, [exportNotify]);
  const showExportFailed = useCallback((message) => { setExporting(false); setShowExport(false); setExportNotify({ type: 'error', message: message || 'The export could not be completed. Please try again.', blob: null, fileUrl: null, fileName: '' }); }, []);
  const showExportSuccess = useCallback((blob, fileName, pinProtected = false, fileUrl = null) => { setExporting(false); setShowExport(false); setExportNotify({ type: 'success', message: `${fileName || 'Deceased records export'} was generated successfully .${pinProtected ? ' It is PIN-protected.' : ''}`, blob: blob || null, fileUrl: fileUrl || null, fileName: fileName || '' }); }, []);
  const isFileResponse = (contentType = '') => contentType.includes('spreadsheetml') || contentType.includes('zip') || contentType.includes('octet-stream');
  const parseBlobJson = async (blob) => { const text = await blob.text(); return JSON.parse(text); };

  const handleExport = async () => {
    if (exportCleanupRef.current) { exportCleanupRef.current(); exportCleanupRef.current = null; }
    setExporting(true); setExportNotify(null);
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const pin = exportPin.trim();
      if (pin && !/^\d{4}$/.test(pin)) { showExportFailed('The  PIN must be  4 digits.'); return; }
      const response = await axios.post(`${BASE_URL}/export-excel`, { startDate: exportStart || undefined, endDate: exportEnd || undefined, exportPin: pin || undefined }, { headers: { 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) }, responseType: 'blob', timeout: 30000 });
      const contentType = (response.headers?.['content-type'] || '').toLowerCase();
      if (isFileResponse(contentType)) { loadExportHistory(); const fileName = filenameFromDisposition(response, `Deceased_Records_${todayKey()}.xlsx`); showExportSuccess(response.data, fileName, pin.length > 0); downloadExportBlob(response.data, fileName); return; }
      const data = await parseBlobJson(response.data);
      if (data?.success && data?.fileUrl) { loadExportHistory(); showExportSuccess(null, data.fileName, !!data.pinProtected, data.fileUrl); downloadExportFile(data.fileUrl, data.fileName); return; }
      if (data?.success && data?.jobId) { pollExportStatus(data.jobId, pin.length > 0); }
      else { throw new Error(data?.message || 'No export file URL returned'); }
    } catch (err) {

      let message = 'Failed to start export. Please try again.';
      if (err?.response?.data && typeof err.response.data.text === 'function') { try { message = (await parseBlobJson(err.response.data))?.message || message; } catch (e) { /* ignore */ } }
      showExportFailed(message);
    }
  };

  const pollExportStatus = async (jobId, pinProtected = false) => {
    const maxAttempts = 90; const pollInterval = 2000; let attempts = 0; let timeoutId;
    const cleanup = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };
    const fail = (msg) => { cleanup(); showExportFailed(msg); };
    const poll = async () => {
      try {
        const tenantSlug = getTenantSlug();
        const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
        const response = await axios.get(`${BASE_URL}/export-status/${jobId}`, { headers: { 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) }, responseType: 'blob', timeout: 15000 });
        const contentType = (response.headers?.['content-type'] || '').toLowerCase();
        if (isFileResponse(contentType)) { cleanup(); loadExportHistory(); showExportSuccess(response.data, filenameFromDisposition(response, `Deceased_Records_${todayKey()}.xlsx`), pinProtected); return; }
        let data; try { data = await parseBlobJson(response.data); } catch (e) { throw new Error('Unexpected status response'); }
        if (data?.success && data?.status === 'completed' && data?.fileUrl) { cleanup(); loadExportHistory(); showExportSuccess(null, data.fileName, false, data.fileUrl); downloadExportFile(data.fileUrl, data.fileName); return; }
        if (data?.success && data?.status) { attempts++; if (attempts < maxAttempts) { timeoutId = setTimeout(poll, pollInterval); } else { cleanup(); fail('Export is taking longer than expected. Please try again later.'); } return; }
        cleanup(); throw new Error(data?.message || 'Unknown status');
      } catch (err) {
        cleanup(); console.error('Poll error:', err);
        let serverMessage = '';
        if (err?.response?.data && typeof err.response.data.text === 'function') { try { serverMessage = (await parseBlobJson(err.response.data))?.message || ''; } catch (e) { /* ignore */ } }
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) { attempts++; if (attempts < maxAttempts) { timeoutId = setTimeout(poll, pollInterval); } else { fail('Export timed out. Please try again.'); } return; }
        if (err.response?.status === 404) { fail('Export job expired .'); return; }
        fail(serverMessage || 'Export failed. Please try again.');
      }
    };
    poll(); exportCleanupRef.current = cleanup; return cleanup;
  };

  const loadExportHistory = useCallback(async () => {
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const response = await axios.get(`${BASE_URL}/export-history`, { headers: { 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) } });
      if (response.data?.success && Array.isArray(response.data?.data)) { setExportHistory(response.data.data.slice(0, 10)); } else { setExportHistory([]); }
    } catch (err) { console.error('Failed to fetch export history:', err); setExportHistory([]); }
  }, []);

  useEffect(() => { if (showExport) { loadExportHistory(); } }, [showExport, loadExportHistory]);

  const formatGeneratedAt = (v) => { if (!v) return '—'; const d = new Date(v); if (isNaN(d.getTime())) return String(v); return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  const formatFileSize = (bytes) => { if (!bytes && bytes !== 0) return '—'; const kb = Number(bytes) / 1024; if (kb < 1024) return `${kb.toFixed(1)} KB`; return `${(kb / 1024).toFixed(2)} MB`; };
  const historyCount = () => (Array.isArray(exportHistory) ? exportHistory.length : 0);

  const eventsData = useMemo(() => {
    return yearRecords.map(r => {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      if (!admitted) return null;
      const date = new Date(admitted);
      if (isNaN(date.getTime())) return null;
      // Colour the day-cell dot from the record's status — orange / blue /
      // green exactly like the Operations dashboard calendar.
      const statusInfo = getStatusInfo(r.body_status || r.admission_status || r.release_status || r.status || 'active');
      return {
        date: date,
        title: r.full_name || r.name || 'Deceased',
        status: statusInfo.label,
        color: EVENT_DOT_COLORS[statusInfo.label] || EVENT_DOT_FALLBACK,
      };
    }).filter(Boolean);
  }, [yearRecords]);

  // ─── Render 
  return (
    <>
      <GlobalFonts />
      <AppContainer>

        <ToastContainer position="top-right" autoClose={3000} />

        {/* ═══ TOOLBAR: one row when it fits, wraps cleanly when it does not ═══ */}
        <Toolbar>
          <ToolbarLeft>
            {/* Grows to fill; drops to its own full-width row on a phone. */}
            <SearchWrapper>
              <SearchInput type="text" placeholder="Search name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
              <SearchIcon className="fas fa-search" />
            </SearchWrapper>

            {/* Status + gender + year share whatever width the search leaves. */}
            <FilterWrapper>
              <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="under care">Under Care</option>
                <option value="admitted">Admitted</option>
                <option value="released">Released</option>
                <option value="completed">Completed</option>
                <option value="other">Cancelled / Maintenance</option>
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>

            <FilterWrapper>
              <FilterSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>

            {/* Year filter only — the month filter is removed: this list always
                shows the full selected year (current year by default). */}
            <FilterWrapper $year>
              <FilterSelect value={calYear} onChange={e => setCalYear(Number(e.target.value))}>
                {Array.from({ length: 7 }, (_, i) => today.getFullYear() - 3 + i).map(y => (<option key={y} value={y}>{y}</option>))}
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>
          </ToolbarLeft>

          {/* Action buttons — right-aligned on wide screens, own row on mobile. */}
          <ToolbarRight>
            <ToolbarDivider />
            <Btn $danger onClick={handleRefresh} disabled={refreshing || loading}>
              <i className={`fas fa-sync-alt${refreshing ? ' fa-spin' : ''}`}></i>
              Refresh
            </Btn>
            <Btn $primary onClick={() => setShowStkPush(true)} disabled={loading}>
              <i className="fas fa-mobile-alt"></i>
              STK Push
            </Btn>
            <Btn $export onClick={() => { setExportPin(''); setShowExport(true); }}>
              <i className="fas fa-file-export"></i>
              Export Data
            </Btn>
          </ToolbarRight>
        </Toolbar>

        {/* Calendar */}
        <div style={{ marginBottom: '24px' }}>
          <HorizontalCalendar eventsData={eventsData} selectedDate={selectedDate} onDateSelect={(date) => {
            if (selectedDate && toDateString(date) === toDateString(selectedDate)) { setSelectedDate(null); }
            else {
              setSelectedDate(date);
              // Year-only list: pin the fetch year to the picked day's year so
              // a day in another year still shows its year's records. The day
              // itself is only a client-side highlight — no month is ever sent.
              const ym = ymFromDate(date);
              setCalYear(ym.year);
            }
          }} />
        </div>

        {/* List Card */}
        <ListCard>
          {serviceUnavailable && (
            <div style={{ padding: '24px', textAlign: 'center', background: C.warningBg, borderBottom: `1px solid #fde68a` }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '16px 24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.warningBg, color: C.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', flexShrink: 0 }}><i className="fas fa-exclamation"></i></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: C.dark, marginBottom: '4px' }}>Service Temporarily Unavailable</div>
                  <div style={{ fontSize: '13px', color: C.gray }}>{unavailableMessage}</div>
                </div>
              </div>
            </div>
          )}

          <TableWrap>
            <StyledTable>
              <thead><tr><th>Deceased Name</th><th>Admission No.</th><th>Date Admitted</th><th>Days in Morgue</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {loading ? (<tr><td colSpan={6}><LoadingState><div className="spinner" /> Loading records...</LoadingState></td></tr>)
                  : serviceUnavailable ? (<tr><td colSpan={6}><EmptyRow>Unable to load records at this time. Please try again later.</EmptyRow></td></tr>)
                    : filteredRecords.length === 0 ? (<tr><td colSpan={6}><EmptyRow>No records found matching your filters.</EmptyRow></td></tr>)
                      : filteredRecords.map(r => {
                        const name = r.full_name || r.name || 'Unknown';
                        const id = r.deceased_id || r.id;
                        const adm = r.admission_number || r.admission_no || '—';
                        const admitted = r.date_admitted || r.created_at || r.admission_date;
                        const days = getDaysForRecord(r, admitted);
                        const statusInfo = getStatusInfo(r.body_status || r.admission_status || r.release_status || r.status || 'active');
                        const sex = r.sex || r.gender || '';
                        const isFemale = sex.toLowerCase() === 'female';
                        return (
                          <tr key={id} onClick={() => openProfile(id)}>
                            <td><NameCell><AvatarSm $female={isFemale}>{getInitials(name)}</AvatarSm><div><div style={{ fontWeight: 600 }}>{name}</div><div className="meta">{sex ? `${sex}, ` : ''}{r.age || '—'} yrs</div></div></NameCell></td>
                            <td>{adm}</td>
                            <td>{formatDate(admitted)}</td>
                            <td>{days} days</td>
                            <td><StatusBadge $c={statusInfo.c}>{statusInfo.label}</StatusBadge></td>
                            <td><Btn $sm $primary onClick={(e) => { e.stopPropagation(); openProfile(id); }}>View Profile</Btn></td>
                          </tr>
                        );
                      })}
              </tbody>
            </StyledTable>
          </TableWrap>

          <MobileCardContainer>
            {loading ? (<LoadingState><div className="spinner" /> Loading records...</LoadingState>)
              : serviceUnavailable ? (<MobileCard style={{ cursor: 'default', textAlign: 'center' }}>Unable to load records at this time. Please try again later.</MobileCard>)
                : filteredRecords.length === 0 ? (<MobileCard style={{ cursor: 'default', textAlign: 'center' }}>No records found matching your filters.</MobileCard>)
                  : filteredRecords.map(r => {
                    const name = r.full_name || r.name || 'Unknown';
                    const id = r.deceased_id || r.id;
                    const adm = r.admission_number || r.admission_no || '—';
                    const admitted = r.date_admitted || r.created_at || r.admission_date;
                    const days = getDaysForRecord(r, admitted);
                    const statusInfo = getStatusInfo(r.body_status || r.admission_status || r.release_status || r.status || 'active');
                    const sex = r.sex || r.gender || '';
                    const isFemale = sex.toLowerCase() === 'female';
                    return (
                      <MobileCard key={id} onClick={() => openProfile(id)}>
                        <MobileCardHeader>
                          <MobileCardNameWrap><AvatarSm $female={isFemale}>{getInitials(name)}</AvatarSm><div><div>{name}</div><div>{sex ? `${sex}, ` : ''}{r.age || '—'} yrs</div></div></MobileCardNameWrap>
                          <StatusBadge $c={statusInfo.c}>{statusInfo.label}</StatusBadge>
                        </MobileCardHeader>
                        <MobileCardDetails>
                          <div><span>Admission No.</span><strong>{adm}</strong></div>
                          <div><span>Days in Morgue</span><strong>{days} days</strong></div>
                          <div style={{ gridColumn: 'span 2' }}><span>Date Admitted</span><strong>{formatDate(admitted)}</strong></div>
                        </MobileCardDetails>
                        <MobileCardFooter><Btn $sm $primary onClick={(e) => { e.stopPropagation(); openProfile(id); }}>View Profile</Btn></MobileCardFooter>
                      </MobileCard>
                    );
                  })}
          </MobileCardContainer>
        </ListCard>

        {showStkPush && <DeceasedStkPushModal onClose={() => setShowStkPush(false)} />}

        {/* Export Side Panel */}
        <ModalOverlay $open={showExport} onClick={() => !exporting && setShowExport(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div><h2><i className="fas fa-file-export"></i> Export Data to Excel</h2><p>Generates the official deceased intake register (.xlsx)</p></div>
              <CloseBtn onClick={() => !exporting && setShowExport(false)}>&times;</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <SectionHead $mt0><span>01</span> Select Time Range</SectionHead>
              <FormRow>
                <FormGroup><FormLabel>Start Date</FormLabel><ModalInput type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} disabled={exporting} /></FormGroup>
                <FormGroup><FormLabel>End Date</FormLabel><ModalInput type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} disabled={exporting} /></FormGroup>
              </FormRow>
              <FormGroup>
                <FormLabel>Security PIN (optional)</FormLabel>
                <ModalInput type="password" inputMode="numeric" autoComplete="new-password" placeholder="Enter a 4-digit PIN to encrypt the file" maxLength={4} value={exportPin} onChange={e => setExportPin(e.target.value.replace(/\D/g, '').slice(0, 4))} disabled={exporting} />
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}><i className="fas fa-lock" style={{ marginRight: 5 }}></i>The file will be encrypted — Excel or Google Sheets will ask for this PIN to open it. Leave blank to export without protection.</div>
              </FormGroup>
              <SectionHead $mt4><span>02</span> Export History<em style={{ marginLeft: 8, opacity: 0.6 }}>limit: 10 most recent</em></SectionHead>
              {historyCount() === 0 ? (
                <EmptyHistory><div style={{ fontSize: 22, opacity: 0.5, marginBottom: 6 }}><i className="fas fa-folder-open"></i></div><div style={{ fontWeight: 600, marginBottom: 2 }}>No exports yet</div><div>Your last 10 exported files will appear here.</div></EmptyHistory>
              ) : (
                <HistorySection>
                  {exportHistory.slice(0, 10).map(h => (
                    <HistoryItem key={h.id || h.fileName}>
                      <StatusTag $success={h.status === 'success'} $warning={h.status !== 'success'} style={{ padding: '4px 8px', fontSize: 10 }}>{h.status === 'success' ? '✓' : '✕'}</StatusTag>
                      <div className="h-file">
                        <div className="h-name"><i className="fas fa-file-excel" style={{ fontSize: 11, marginRight: 5 }}></i>{h.fileName}</div>
                        <div className="h-meta">{formatGeneratedAt(h.generatedAt)} • {h.recordCount || 0} records • {formatFileSize(h.fileSize)}</div>
                        {h.trackingId && <div className="h-meta" style={{ color: C.exportBtn, fontFamily: 'monospace', fontWeight: 700 }}>Tracking ID: {h.trackingId}</div>}
                        {h.fileUrl ? (<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><a className="h-link" href="#download" onClick={(e) => { e.preventDefault(); downloadExportFile(h.fileUrl, h.fileName); }}><i className="fas fa-download"></i> Download to device</a></div>) : (<span className="h-meta" style={{ color: C.gray }}>Saved to global uploads</span>)}
                      </div>
                    </HistoryItem>
                  ))}
                </HistorySection>
              )}
            </ModalBody>
            <ModalFooter>
              <div style={{ fontSize: 11, color: C.gray, marginRight: 'auto' }}>{exporting ? (exportPin ? 'Encrypting & uploading via global uploader…' : 'Generating & uploading via global uploader…') : 'Exports download straight to your device — no browser preview'}</div>
              <Btn $ghost onClick={() => setShowExport(false)} disabled={exporting}>Cancel</Btn>
              <Btn $export onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting...' : (<><i className="fas fa-file-excel"></i> Generate Export</>)}</Btn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>

        {/* Export Result Notification Modal */}
        {exportNotify && (
          <NotifyOverlay onClick={closeExportNotify}>
            <NotifyCard onClick={e => e.stopPropagation()}>
              <NotifyIcon style={{ background: exportNotify.type === 'success' ? C.successBg : C.dangerBg, color: exportNotify.type === 'success' ? C.success : C.danger }}>
                <i className={exportNotify.type === 'success' ? 'fas fa-check' : 'fas fa-xmark'}></i>
              </NotifyIcon>
              <NotifyTitle style={{ color: exportNotify.type === 'success' ? C.success : C.danger }}>{exportNotify.type === 'success' ? 'Success' : 'Failed'}</NotifyTitle>
              <NotifyMessage>{exportNotify.type === 'success' ? (exportNotify.message || 'Your export was generated successfully.') : (exportNotify.message || 'The export could not be completed. Please try again.')}</NotifyMessage>
              {exportNotify.type === 'success' && (exportNotify.blob || exportNotify.fileUrl) && (
                <NotifyActions><Btn $export onClick={downloadExportCopy} style={{ whiteSpace: 'normal', height: 'auto', minHeight: 42, padding: '10px 18px' }}><i className="fas fa-download"></i> Download to device</Btn></NotifyActions>
              )}
              <NotifyActions><Btn $ghost onClick={closeExportNotify}>Close</Btn></NotifyActions>
              <NotifyHint><i className="fas fa-circle-info"></i>{exportNotify.type === 'success' ? 'A copy of this file is also saved in Documents.' : 'Nothing was downloaded. Please try again.'}</NotifyHint>
            </NotifyCard>
          </NotifyOverlay>
        )}
      </AppContainer>
    </>
  );
};

export default DeceasedList;
