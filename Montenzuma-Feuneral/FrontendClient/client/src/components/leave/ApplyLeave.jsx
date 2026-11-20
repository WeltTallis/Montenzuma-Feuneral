
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
// Clears the red dot on the "Apply Leave" nav item: being on this page IS the
// "I have seen it" signal.
import { markDecisionsSeen } from '../../utils/leaveDecisionBadge';
import notify from '../../utils/notify';

/*  DESIGN TOKENS  */
const C = {
  ink: '#111827', mid: '#374151', gray: '#6b7280', lgray: '#9ca3af',
  line: '#e5e7eb', line2: '#f3f4f6',
  field: '#f9fafb', card: '#ffffff', app: '#f7f8fa',
  navy: '#111827', navyDeep: '#0b1220',
  orange: '#111827', plum: '#111827', pink: '#dc2626', deep: '#111827',
  success: '#047857', successBg: '#ecfdf5',
  warning: '#b45309', warningBg: '#fffbeb',
  danger: '#dc2626', dangerBg: '#fef2f2',
  sel: 'rgba(17,24,39,.08)',
  accent: '#dc2626',
};

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual', icon: 'cal', color: '#111827' },
  { value: 'sick', label: 'Sick', icon: 'med', color: '#111827' },
  { value: 'maternity', label: 'Maternity', icon: 'users', color: '#111827' },
  { value: 'paternity', label: 'Paternity', icon: 'users', color: '#111827' },
  { value: 'compassionate', label: 'Compassionate', icon: 'heart', color: '#111827' },
  { value: 'study', label: 'Study', icon: 'book', color: '#111827' },
  { value: 'unpaid', label: 'Unpaid', icon: 'wallet', color: '#111827' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#111827' },
  { value: 'medium', label: 'Medium', color: '#111827' },
  { value: 'high', label: 'High', color: '#111827' },
  { value: 'emergency', label: 'Emergency', color: '#111827' },
];

const STATUS_META = {
  pending: { label: 'Pending', fg: C.warning, bg: C.warningBg },
  approved: { label: 'Approved', fg: C.success, bg: C.successBg },
  rejected: { label: 'Rejected', fg: C.danger, bg: C.dangerBg },
  cancelled: { label: 'Cancelled', fg: '#9b9b96', bg: '#f4f4f2' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* HELPERS */
const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY_STR = toStr(new Date());

function parseLocal(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseLocal(dateStr);
  if (!d) return String(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function countDaysInclusive(start, end) {
  if (!start || !end) return 0;
  const d = parseLocal(start), endD = parseLocal(end);
  if (!d || !endD) return 0;
  let n = 0;
  while (d <= endD) { n += 1; d.setDate(d.getDate() + 1); }
  return n;
}

function countBusinessDays(start, end) {
  if (!start || !end) return 0;
  let count = 0;
  const d = parseLocal(start);
  const endD = parseLocal(end);
  if (!d || !endD) return 0;
  while (d <= endD) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function dateInRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

/** "3 hrs ago" / "2 days ago" — tolerant of ISO or "YYYY-MM-DD HH:MM:SS". */
function timeAgo(v) {
  if (!v) return '';
  const t = new Date(String(v).replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min${m !== 1 ? 's' : ''} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h !== 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d !== 1 ? 's' : ''} ago`;
  const w = Math.floor(d / 7);
  return `${w} wk${w !== 1 ? 's' : ''} ago`;
}

/** Best-effort "applied X ago" label for a leave row. */
function appliedAgoLabel(l) {
  if (l.created_at || l.createdAt || l.submitted_at) {
    const a = timeAgo(l.created_at || l.createdAt || l.submitted_at);
    if (a) return `Applied ${a}`;
  }
  const d = parseLocal(l.start_date);
  if (d && d < new Date()) {
    const a = timeAgo(`${l.start_date}T09:00:00`);
    if (a) return `Started ${a}`;
  }
  return '';
}

/** Animated integer for the gauge centre. */
function useCountUp(target, dur = 700) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = Number(target) || 0;
    if (from === to) { setV(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else prev.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

/*  ICONS (self-contained — swap for your lib if you like) */
const ICONS = {
  cal: 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Z',
  med: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  book: 'M6 2h5v18H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 0h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5V2Z',
  wallet: 'M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5v1H2v-1Zm15.5-4.4c2.6.5 4.5 2.1 4.5 4.4v1h-4v-1c0-1.8-.9-3.3-2.3-4.3.6-.1 1.2-.1 1.8-.1Z',
  file: 'M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5ZM8 11h8v1.6H8V11Zm0 4h8v1.6H8V15Z',
  upload: 'M12 3l5 5-1.4 1.4L13 6.8V15h-2V6.8L8.4 9.4 7 8l5-5Zm-7 14h14v2H5v-2Z',
  x: 'm18.3 5.7-1.4-1.4-4.9 4.9-4.9-4.9-1.4 1.4 4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9 4.9-4.9Z',
  check: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z',
  alert: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v7h-2V7Zm0 9h2v2h-2v-2Z',
  chevL: 'M9.5 18.4 10.9 17l-5-5 5-5L9.5 5.6 3.1 12l6.4 6.4Z',
  chevR: 'M14.5 5.6 13.1 7l5 5-5 5 1.4 1.4L20.9 12l-6.4-6.4Z',
};
const Ic = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
    <path d={ICONS[n] || ''} />
  </svg>
);

/*  GLOBAL / SHELL */
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { background: ${C.app}; margin: 0; }

  /* Safety net for the sideways scroll on narrow phones. The individual
     grids/flex rows above are fixed individually (minmax(0,1fr), min-width:0),
     but this guarantees that if ANY future child refuses to shrink the page
     clips rather than letting the whole document pan sideways. overflow-x
     clips only; overflow-y stays visible so normal scrolling is untouched. */
  html, body { overflow-x: hidden; max-width: 100vw; }
  #root { overflow-x: hidden; max-width: 100vw; }
`;

const Container = styled.div`
  max-width: 1280px; margin: 0 auto; padding: 34px 20px 80px;
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: ${C.ink}; box-sizing: border-box;
  @media (max-width: 640px) { padding: 18px 10px 64px; }
`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 14px; margin-bottom: 22px; flex-wrap: wrap;
`;
const Crumb = styled.div`
  font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${C.lgray};
`;
const Title = styled.h1`
  font-size: 28px; font-weight: 800; letter-spacing: -.02em; margin: 4px 0 0;
  @media (max-width: 640px) { font-size: 22px; }
`;
const Subtitle = styled.p`
  font-size: 14px; color: ${C.gray}; margin: 3px 0 0;
  b { color: ${C.mid}; font-weight: 700; }
  @media (max-width: 640px) { font-size: 13px; }
`;
const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid ${C.line}; background: #fff; border-radius: 9px;
  padding: 9px 14px; font-size: 13px; font-weight: 700; color: ${C.mid};
  cursor: pointer; transition: .15s;
  &:hover { border-color: ${C.gray}; color: ${C.ink}; }
`;

const Layout = styled.div`
  display: grid; grid-template-columns: 1fr 368px; gap: 20px; align-items: start;
  @media (max-width: 980px) { grid-template-columns: 1fr; }

  /* min-width: 0 on BOTH tracks. Grid items default to min-width:auto, which
     resolves to their min-content width — so a single wide child (the calendar
     grid, a long nowrap chip) could not shrink and forced its whole track
     wider than the viewport, producing the sideways scroll on a phone. */
  > * { min-width: 0; }
`;

const SideInner = styled.div`
  @media (min-width: 981px) { position: sticky; top: 18px; }
`;

const Card = styled.div`
  background: ${C.card}; border: 1px solid ${C.line}; border-radius: 14px;
  padding: 20px; margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(10,10,10,.04), 0 12px 32px -20px rgba(10,10,10,.28);
  @media (max-width: 640px) { padding: 15px; border-radius: 12px; }
`;

const CardHead = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
  h3 { font-size: 15.5px; font-weight: 800; letter-spacing: -.01em; margin: 0;
       display: flex; align-items: center; gap: 9px; }
`;
const StepNo = styled.span`
  flex: none; width: 22px; height: 22px; border-radius: 7px;
  background: ${C.navy}; color: #fff; display: grid; place-items: center;
  font-size: 11.5px; font-weight: 800;
`;
const HeadChip = styled.span`
  margin-left: auto; font-size: 10.5px; font-weight: 800; letter-spacing: .06em;
  text-transform: uppercase; color: ${C.mid}; background: #fff;
  border: 1px solid ${C.line}; padding: 4px 10px; border-radius: 6px; white-space: nowrap;
  &.warn { color: ${C.warning}; background: ${C.warningBg}; border-color: rgba(180,83,9,.3); }
`;

/*  BANNER  */
const Banner = styled.div`
  display: flex; align-items: center; gap: 11px; padding: 13px 16px;
  border-radius: 11px; font-size: 14px; font-weight: 600; margin-bottom: 18px;
  animation: drop .25s cubic-bezier(.2,.9,.3,1.2);
  @keyframes drop { from { opacity: 0; transform: translateY(-8px); } }
  &.success { background: ${C.successBg}; color: ${C.success}; border: 1px solid rgba(4,120,87,.25); }
  &.error   { background: ${C.dangerBg};  color: ${C.danger};  border: 1px solid rgba(220,38,38,.25); }
  button { margin-left: auto; color: inherit; opacity: .6; padding: 4px; background: none; border: 0; cursor: pointer;
           &:hover { opacity: 1; } }
`;

/* CALENDAR  */
const RangeStrip = styled.div`
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: ${C.field}; border: 1px dashed ${C.line}; border-radius: 10px;
  padding: 9px 13px; margin-bottom: 14px; font-size: 13.5px;
  .rs-ico { color: ${C.navy}; display: flex; }
  b { font-weight: 800; color: ${C.navy}; }
  .arrow { color: ${C.lgray}; }
  &.on { background: #fff; border: 1px solid ${C.line}; border-style: solid; }
`;
const RsDays = styled.span`
  margin-left: auto; font-size: 11.5px; font-weight: 800; color: #fff;
  background: ${C.navy}; padding: 4px 10px; border-radius: 6px; white-space: nowrap;
`;
const RsClear = styled.button`
  font-size: 12px; font-weight: 700; color: ${C.gray}; border: 1px solid ${C.line};
  background: #fff; border-radius: 8px; padding: 5px 10px; cursor: pointer; transition: .14s;
  &:hover { color: ${C.danger}; border-color: ${C.danger}; background: ${C.dangerBg}; }
`;

const CalNav = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
`;
const CalMonthLabel = styled.span`
  font-size: 15.5px; font-weight: 800; letter-spacing: -.01em; flex: 1; text-align: center;
`;
const NavBtn = styled.button`
  width: 34px; height: 34px; display: grid; place-items: center;
  border: 1px solid ${C.line}; background: #fff; border-radius: 9px;
  color: ${C.gray}; cursor: pointer; transition: .15s;
  &:hover { border-color: ${C.navy}; color: ${C.navy}; background: #f3f4f6; }
  &.today { width: auto; padding: 0 12px; font-size: 12px; font-weight: 700; }
  @media (max-width: 420px) { width: 30px; height: 30px; }
`;

const CalGrid = styled.div`
  /* minmax(0, 1fr) so the tracks can shrink below the 30px DayNum's min-content
     width. A bare 1fr is minmax(auto, 1fr), whose auto minimum refuses to
     shrink — seven such columns plus gaps overflowed a phone and pushed the
     whole page sideways. */
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px;
  user-select: none; -webkit-user-select: none; touch-action: pan-y;
  @media (max-width: 640px) { gap: 2px; }
`;
const Dow = styled.div`
  text-align: center; font-size: 10.5px; font-weight: 800; color: ${C.lgray};
  text-transform: uppercase; letter-spacing: .06em; padding: 6px 0;
  @media (max-width: 640px) { font-size: 9.5px; }
`;

const Cell = styled.div`
  position: relative; min-height: 52px; border-radius: 10px;
  background: ${C.field}; border: 1px solid transparent; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: background .12s;
  ${(p) => p.$weekend && `background: #f3f4f6;`}
  ${(p) => p.$past && `.dnum { color: #b6b3ac; }`}
  ${(p) => p.$inRange && `background: ${C.sel}; border-radius: 0;`}
  ${(p) => p.$isStart && `border-radius: 10px 0 0 10px;`}
  ${(p) => p.$isEnd && `border-radius: 0 10px 10px 0;`}
  ${(p) => p.$isStart && p.$isEnd && `border-radius: 10px;`}
  ${(p) => (!p.$isStart && !p.$isEnd) && `&:hover { background: ${C.sel}; }`}
  .dnum {
    font-size: 14px; font-weight: 600; width: 30px; height: 30px;
    display: grid; place-items: center; border-radius: 50%; transition: .12s;
    font-variant-numeric: tabular-nums;
  }
  ${(p) => p.$today && `.dnum { box-shadow: inset 0 0 0 2px ${C.navy}; color: ${C.navy}; font-weight: 800; }`}
  ${(p) => p.$anchor && `.dnum { background: ${C.navy}; color: #fff; font-weight: 700;
       box-shadow: 0 3px 8px -2px rgba(17,24,39,.4); }`}
  @media (max-width: 640px) {
    min-height: 42px; border-radius: 8px;
    .dnum { width: 26px; height: 26px; font-size: 12.5px; }
  }
  @media (max-width: 380px) { min-height: 38px; .dnum { width: 24px; height: 24px; font-size: 11.5px; } }
`;

const Dots = styled.div`
  position: absolute; bottom: 5px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 3px;
  i { width: 5px; height: 5px; border-radius: 50%; }
  @media (max-width: 640px) { bottom: 3px; i { width: 4px; height: 4px; } }
`;

const CalLegend = styled.div`
  display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
  margin-top: 10px; font-size: 12px; color: ${C.gray}; font-weight: 600;
  span { display: inline-flex; align-items: center; gap: 6px; }
  i { width: 8px; height: 8px; border-radius: 50%; }
  @media (max-width: 640px) { gap: 10px; font-size: 11px; }
`;
const CalHint = styled.p`
  margin: 12px 0 0; font-size: 12.5px; color: ${C.gray}; text-align: center;
  background: ${C.field}; border: 1px dashed ${C.line}; border-radius: 9px; padding: 8px 10px;
  @media (max-width: 640px) { font-size: 11.5px; }
`;

/*  FORM  */
const FormGrid = styled.div`
  display: grid;
  /* minmax(0, 1fr) on both tracks: the default min-width:auto lets a long
     nowrap <select> or input value widen its column past the viewport. */
  grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px;
  @media (max-width: 640px) { grid-template-columns: minmax(0, 1fr); gap: 15px; }
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 7px;
  &.full { grid-column: 1 / -1; }
`;
const Label = styled.label`
  font-size: 11.5px; font-weight: 800; color: ${C.mid};
  text-transform: uppercase; letter-spacing: .05em;
`;
const Required = styled.span` color: ${C.accent}; margin-left: 2px; `;

const Chips = styled.div` display: flex; flex-wrap: wrap; gap: 7px; `;
const TypeChip = styled.button`
  border: 1px solid ${(p) => (p.$on ? p.$color : C.line)};
  background: ${(p) => (p.$on ? p.$color : '#fff')};
  color: ${(p) => (p.$on ? '#fff' : C.mid)};
  border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: .14s; display: inline-flex; align-items: center; gap: 7px;
  &:hover { border-color: ${(p) => p.$color}; }
  ${(p) => p.$on && `box-shadow: 0 4px 10px -4px ${p.$color}88;`}
  @media (max-width: 640px) { padding: 6px 12px; font-size: 12.5px; }
`;

const Seg = styled.div`
  display: flex; background: ${C.field}; border: 1px solid ${C.line};
  border-radius: 10px; padding: 3px; gap: 2px;
  button {
    flex: 1; min-width: 0; padding: 8px 4px; border-radius: 8px; border: 0;
    font-size: 12.5px; font-weight: 700; color: ${C.gray}; cursor: pointer;
    transition: .14s; white-space: nowrap;
    &:hover { color: ${C.ink}; }
    &.on { color: #fff; }
  }
  @media (max-width: 420px) { button { font-size: 11px; padding: 7px 2px; } }
`;

const RangeBox = styled.div`
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 11px 13px; background: #fff;
  border: 1px solid ${C.line}; border-radius: 10px;
  .rt { font-size: 14px; font-weight: 800; color: ${C.navy}; }
  .wd { font-size: 11.5px; color: ${C.gray}; font-weight: 600; }
  .days-badge { margin-left: auto; font-size: 11.5px; font-weight: 800; color: #fff;
    background: ${C.navy}; padding: 4px 10px; border-radius: 6px; white-space: nowrap; }
  @media (max-width: 420px) { .rt { font-size: 12.5px; } }
`;
const SelEmpty = styled.div`
  padding: 11px 13px; border: 1px dashed ${C.line}; border-radius: 10px;
  font-size: 13px; color: ${C.lgray}; font-weight: 600;
`;

const ReasonArea = styled.textarea`
  width: 100%; padding: 12px 14px; border: 1px solid ${C.line}; border-radius: 10px;
  background: ${C.field}; font: inherit; font-size: 14px; color: ${C.ink};
  resize: vertical; min-height: 104px; transition: .15s;
  &:focus { outline: none; border-color: ${C.navy}; background: #fff;
            box-shadow: 0 0 0 3px rgba(17,24,39,.1); }
`;
const CharCount = styled.span`
  font-size: 11px; color: ${C.lgray}; text-align: right; font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const Drop = styled.div`
  border: 2px dashed ${(p) => (p.$drag ? C.navy : C.line)}; border-radius: 12px;
  padding: ${(p) => (p.$compact ? '14px' : '22px')}; text-align: center; cursor: pointer;
  background: ${(p) => (p.$drag ? '#ffffff' : C.field)}; transition: .15s;
  &:hover { border-color: ${C.gray}; }
  .up { color: ${C.gray}; margin: 0 auto 6px; }
  p { font-size: 13.5px; color: ${C.gray}; font-weight: 600; margin: 0; }
  .browse { color: ${C.navy}; font-weight: 800; text-decoration: underline; }
  .fmt { font-size: 11.5px; color: ${C.lgray}; margin-top: 4px; }
  @media (max-width: 640px) { padding: 16px 12px; }
`;
const FileChip = styled.div`
  display: flex; align-items: center; gap: 10px; background: #fff;
  border: 1px solid ${C.line}; border-radius: 10px; padding: 10px 12px;
  .f-ico { color: ${C.navy}; display: flex; }
  b { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  small { color: ${C.lgray}; font-size: 11.5px; display: block; }
  .rm { margin-left: auto; width: 28px; height: 28px; border-radius: 8px;
        border: 1px solid ${C.line}; display: grid; place-items: center;
        color: ${C.danger}; background: #fff; cursor: pointer; transition: .14s;
    &:hover { background: ${C.dangerBg}; border-color: ${C.danger}; } }
`;

const Actions = styled.div`
  display: flex; gap: 12px; margin-top: 20px;
  @media (max-width: 420px) { flex-direction: column-reverse; }
`;
const Btn = styled.button`
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  padding: 13px; border-radius: 10px; font-size: 14.5px; font-weight: 800;
  cursor: pointer; transition: .15s; border: 1px solid transparent;
  &.secondary { background: #fff; border-color: ${C.line}; color: ${C.mid};
    &:hover { background: ${C.field}; color: ${C.ink}; } }
  &.primary { background: ${C.deep}; color: #fff;
    box-shadow: 0 6px 14px -6px rgba(17,24,39,.45);
    &:hover { background: #000; } }
  &:disabled { opacity: .65; cursor: not-allowed; }
`;
const Spin = styled.span`
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff; border-radius: 50%; animation: rot .7s linear infinite;
  @keyframes rot { to { transform: rotate(360deg); } }
`;

/*  BALANCE (segmented gauge) */
const GaugeWrap = styled.div`
  display: flex; flex-direction: column; align-items: center; padding: 4px 0 2px;
`;
const GaugeBox = styled.div`
  position: relative; width: 190px; height: 190px;
  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .g-arc { fill: none; stroke-width: 13; stroke-linecap: round;
    transition: stroke-dasharray .9s cubic-bezier(.22,.8,.24,1),
                stroke-dashoffset .9s cubic-bezier(.22,.8,.24,1); }
  .g-track { fill: none; stroke: #e5e7eb; stroke-width: 13; }
  @media (max-width: 640px) { width: 158px; height: 158px;
    .g-arc, .g-track { stroke-width: 11; } }
`;
const GaugeCenter = styled.div`
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 0 18px;
`;
const GaugeNum = styled.span`
  font-size: 44px; font-weight: 800; letter-spacing: -.03em; color: ${C.navy};
  line-height: 1; font-variant-numeric: tabular-nums;
  ${(p) => p.$low && `color: ${C.pink};`}
  @media (max-width: 640px) { font-size: 36px; }
`;
const GaugeLbl = styled.span`
  font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  color: ${C.gray}; margin-top: 5px;
`;
const GaugeOf = styled.span`
  font-size: 12px; color: ${C.lgray}; font-weight: 600; margin-top: 1px;
`;

const Stack = styled.div`
  display: flex; height: 11px; border-radius: 4px; overflow: hidden;
  background: #e5e7eb; margin-top: 18px; width: 100%;
  span { display: block; transition: flex .6s; }
  .s-taken { background: ${C.navy}; }
  .s-pend  { background: ${C.warning}; }
`;

const Break = styled.div`
  margin-top: 14px; width: 100%; display: flex; flex-direction: column;
  border-top: 1px solid ${C.line2};
`;
const Brow = styled.div`
  display: flex; align-items: center; gap: 9px; padding: 9px 2px;
  border-bottom: 1px solid ${C.line2}; font-size: 13.5px;
  &:last-child { border-bottom: 0; }
  .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
  .k { color: ${C.gray}; font-weight: 600; }
  .v { margin-left: auto; font-weight: 800; font-variant-numeric: tabular-nums; font-size: 14px; }
  .pct { font-size: 11px; color: ${C.lgray}; font-weight: 700; width: 38px;
         text-align: right; font-variant-numeric: tabular-nums; }
  &.strong .v { color: ${C.navy}; font-size: 15px; }
  &.strong .k { color: ${C.ink}; font-weight: 800; }
`;
const LowNote = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 12px; width: 100%;
  background: ${C.warningBg}; border: 1px solid rgba(180,83,9,.28); color: ${C.warning};
  border-radius: 9px; padding: 9px 11px; font-size: 12.5px; font-weight: 700;
`;

/*  REQUESTS */
const Req = styled.div`
  display: flex; gap: 11px;
  border: 1px solid ${C.line};
  border-left: 3px solid ${(p) => STATUS_META[p.$status]?.fg || C.warning};
  background: #fff;
  border-radius: 10px; padding: 12px 13px; margin-bottom: 10px; transition: .14s;
  &:hover { box-shadow: 0 1px 2px rgba(10,10,10,.05), 0 10px 24px -18px rgba(10,10,10,.3); }
  &:last-child { margin-bottom: 0; }
`;
const ReqIco = styled.span`
  flex: none; width: 34px; height: 34px; border-radius: 9px; background: #fff;
  border: 1px solid ${C.line}; display: grid; place-items: center;
  @media (max-width: 420px) { display: none; }
`;
const ReqMain = styled.div` min-width: 0; flex: 1; `;
const ReqTop = styled.div`
  display: flex; align-items: center; gap: 8px;
  b { font-size: 14px; font-weight: 800; text-transform: capitalize; letter-spacing: -.01em; }
`;
const StatusBadge = styled.span`
  margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  padding: 3.5px 9px; border-radius: 6px; white-space: nowrap;
  color: ${(p) => STATUS_META[p.$status]?.fg || C.warning};
  background: ${(p) => STATUS_META[p.$status]?.bg || C.warningBg};
  border: 1px solid ${(p) => `${STATUS_META[p.$status]?.fg || C.warning}40`};
  i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
`;
const ReqMeta = styled.div`
  font-size: 12.5px; color: ${C.mid}; font-weight: 600; margin-top: 3px;
`;
const ReqAgo = styled.span`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; color: ${C.lgray}; margin-top: 3px;
  i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
`;
const ReqReason = styled.div`
  font-size: 12px; color: ${C.gray}; margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const ReqCancel = styled.button`
  margin-top: 7px; background: none; border: 0; padding: 0;
  color: ${C.danger}; font-size: 12px; font-weight: 800; cursor: pointer;
  &:hover { text-decoration: underline; }
`;
const Mfoot = styled.div`
  text-align: center; font-size: 12px; font-weight: 700; color: ${C.lgray}; padding: 8px 0 2px;
`;
const Empty = styled.div`
  text-align: center; padding: 22px 8px; font-size: 13.5px; color: ${C.gray}; font-weight: 600;
`;
const LoadingRow = styled.div`
  display: flex; align-items: center; gap: .5rem; font-size: .85rem; color: ${C.gray}; padding: .5rem 0;
  svg, .spin { animation: rot 1s linear infinite; }
`;

/* CALENDAR COMPONENT  */

function LeaveCalendar({ myLeaves, rangeStart, rangeEnd, onRangeChange }) {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const anchor = useRef(null);   // drag start date-string
  const lastDown = useRef(null); // for tap detection
  const gridRef = useRef(null);

  const dayStr = (d) => `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const leavesForDay = useCallback((ds) => (myLeaves || []).filter((l) => {
    const s = String(l.start_date || '').slice(0, 10);
    const e = String(l.end_date || '').slice(0, 10);
    return s && e && dateInRange(ds, s, e) && l.status !== 'cancelled';
  }), [myLeaves]);

  /* — selection: click-pair + press-drag (mouse) + touch drag — */
  const downAt = useCallback((ds) => {
    lastDown.current = ds;
    anchor.current = ds;
    const singleAnchor = rangeStart && rangeEnd && rangeStart === rangeEnd;
    if (!singleAnchor) onRangeChange(ds, ds);
  }, [rangeStart, rangeEnd, onRangeChange]);

  const enterAt = useCallback((ds) => {
    if (!anchor.current) return;
    const a = anchor.current < ds ? anchor.current : ds;
    const b = anchor.current < ds ? ds : anchor.current;
    onRangeChange(a, b);
  }, [onRangeChange]);

  const upAt = useCallback((ds) => {
    if (ds && lastDown.current === ds) {
      const singleAnchor = rangeStart && rangeEnd && rangeStart === rangeEnd;
      if (singleAnchor && ds !== rangeStart) {
        const a = rangeStart < ds ? rangeStart : ds;
        const b = rangeStart < ds ? ds : rangeStart;
        onRangeChange(a, b);
      } else {
        onRangeChange(ds, ds);
      }
    }
    anchor.current = null;
    lastDown.current = null;
  }, [rangeStart, rangeEnd, onRangeChange]);

  const cancelDrag = () => { anchor.current = null; lastDown.current = null; };

  // Touch: native (non-passive) listeners so dragging across days works and
  // doesn't scroll the page mid-drag. Tapping = down+up on the same cell.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return undefined;
    const cellAt = (t) => {
      const n = document.elementFromPoint(t.clientX, t.clientY);
      return n && n.closest ? n.closest('[data-date]') : null;
    };
    const ts = (e) => { const c = cellAt(e.touches[0]); if (c) downAt(c.dataset.date); };
    const tm = (e) => {
      if (!anchor.current) return;
      e.preventDefault();
      const c = cellAt(e.touches[0]);
      if (c) enterAt(c.dataset.date);
    };
    const te = (e) => {
      const c = e.changedTouches ? cellAt(e.changedTouches[0]) : null;
      upAt(c ? c.dataset.date : lastDown.current);
    };
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te);
    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
    };
  }, [downAt, enterAt, upAt]);

  const firstDay = new Date(ym.y, ym.m, 1).getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const pad = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const inRange = (ds) => {
    if (!rangeStart || !rangeEnd) return false;
    const a = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const b = rangeStart < rangeEnd ? rangeEnd : rangeStart;
    return ds >= a && ds <= b;
  };

  const prevMonth = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextMonth = () => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  const goToday = () => setYm({ y: today.getFullYear(), m: today.getMonth() });

  return (
    <div onMouseLeave={cancelDrag}>
      <CalNav>
        <NavBtn onClick={prevMonth} type="button" aria-label="Previous month"><Ic n="chevL" s={15} /></NavBtn>
        <CalMonthLabel>{MONTH_NAMES[ym.m]} {ym.y}</CalMonthLabel>
        <NavBtn className="today" onClick={goToday} type="button" title="Today">Today</NavBtn>
        <NavBtn onClick={nextMonth} type="button" aria-label="Next month"><Ic n="chevR" s={15} /></NavBtn>
      </CalNav>

      <CalGrid ref={gridRef}>
        {DAY_NAMES.map((d) => <Dow key={d}>{d}</Dow>)}
        {pad.map((_, i) => <div key={`p${i}`} />)}
        {days.map((d) => {
          const ds = dayStr(d);
          const dow = new Date(ym.y, ym.m, d).getDay();
          const dayLeaves = leavesForDay(ds);
          const uniqueStatuses = [...new Set(dayLeaves.map((l) => l.status))];
          const isStart = rangeStart === ds;
          const isEnd = rangeEnd === ds;
          return (
            <Cell
              key={ds}
              data-date={ds}
              $weekend={dow === 0 || dow === 6}
              $past={ds < TODAY_STR}
              $today={ds === TODAY_STR}
              $inRange={inRange(ds)}
              $isStart={isStart}
              $isEnd={isEnd}
              $anchor={isStart || isEnd}
              onMouseDown={() => downAt(ds)}
              onMouseEnter={() => enterAt(ds)}
              onMouseUp={() => upAt(ds)}
              title={dayLeaves.map((l) => `${l.leave_type} (${l.status})`).join(', ') || `Select ${formatDate(ds)}`}
            >
              <span className="dnum">{d}</span>
              {!(isStart || isEnd) && uniqueStatuses.length > 0 && (
                <Dots>
                  {uniqueStatuses.slice(0, 3).map((s) => (
                    <i key={s} style={{ background: (STATUS_META[s] || STATUS_META.pending).fg }} />
                  ))}
                </Dots>
              )}
            </Cell>
          );
        })}
      </CalGrid>

      <CalLegend>
        <span><i style={{ background: C.navy }} />Range ends</span>
        <span><i style={{ background: C.warning }} />Pending leave</span>
        <span><i style={{ background: C.success }} />Approved</span>
        <span><i style={{ background: C.danger }} />Rejected</span>
      </CalLegend>
      <CalHint>💡 Tap your start date, then your end date — or press &amp; drag across the days.</CalHint>
    </div>
  );
}

/* RANGE STRIP (inside calendar card)  */

function RangeStripBar({ range, onClear }) {
  const { start, end } = range;
  const on = start && end;
  const lo = on ? (start < end ? start : end) : null;
  const hi = on ? (start < end ? end : start) : null;
  const days = on ? countDaysInclusive(lo, hi) : 0;
  const wd = on ? countBusinessDays(lo, hi) : 0;
  return (
    <RangeStrip className={on ? 'on' : ''}>
      <span className="rs-ico"><Ic n="cal" s={15} /></span>
      {on ? (
        <>
          <span><b>{formatDate(lo)}</b> <span className="arrow">→</span> <b>{formatDate(hi)}</b></span>
          <RsDays>{days} day{days !== 1 ? 's' : ''} · {wd} working</RsDays>
          <RsClear type="button" onClick={onClear}>Clear</RsClear>
        </>
      ) : (
        <span>No dates selected yet — pick them on the calendar below</span>
      )}
    </RangeStrip>
  );
}

/*  MAIN */

const ApplyLeave = ({ onClose, onSubmitted }) => {
  const navigate = useNavigate();
  const close = () => (onClose ? onClose() : navigate(-1));

  const userId = getUserId();
  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.full_name || u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email || 'You';
    } catch { return 'You'; }
  })();

  const parentSlug = getParentTenantSlug() || getTenantSlug();
  const tenantHeaders = useMemo(() => {
    const h = { 'x-tenant-slug': parentSlug };
    if (userId) h['x-user-id'] = String(userId);
    return { headers: h };
  }, [parentSlug, userId]);

  const [myLeaves, setMyLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [range, setRange] = useState({ start: null, end: null });
  const [form, setForm] = useState({ type: '', priority: 'medium', reason: '' });
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get(ENDPOINTS.LEAVE.MY_LEAVES, tenantHeaders).catch(() => null),
        api.get(ENDPOINTS.LEAVE.BALANCE(userId), tenantHeaders).catch(() => null),
      ]);
      const leavesData = leavesRes?.data?.data || leavesRes?.data || [];
      setMyLeaves(Array.isArray(leavesData) ? leavesData : []);
      setBalance(balanceRes?.data?.data || balanceRes?.data || null);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!loading && myLeaves.length) markDecisionsSeen(myLeaves, userId);
  }, [loading, myLeaves, userId]);

  useEffect(() => {
    if (!banner) return undefined;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  const days = useMemo(() => {
    if (!range.start || !range.end) return 0;
    const a = range.start < range.end ? range.start : range.end;
    const b = range.start < range.end ? range.end : range.start;
    return countDaysInclusive(a, b);
  }, [range]);

  /* Balance: prefer the API payload; if it is missing, derive a sane one from
     the leave rows so the gauge is never blank. */
  const derivedBalance = useMemo(() => {
    let used = 0; let pend = 0;
    (myLeaves || []).forEach((l) => {
      if (l.status === 'cancelled' || l.status === 'rejected') return;
      const d = Number(l.days) || countBusinessDays(l.start_date, l.end_date);
      if (l.status === 'approved') used += d;
      if (l.status === 'pending') pend += d;
    });
    return { initial: 26, leaveTaken: used, pendingDays: pend, currentBalance: Math.max(0, 26 - used - pend) };
  }, [myLeaves]);
  const bal = balance || derivedBalance;

  const initial = Number(bal.initial) || 26;
  const used = Math.max(0, Number(bal.leaveTaken) || 0);
  const pending = Math.max(0, Number(bal.pendingDays) || 0);
  const available = Math.max(0, Number(bal.currentBalance) || 0);

  /* Gauge math — pathLength=100 so dash values are percentages. */
  const tPct = initial > 0 ? Math.min(100, (used / initial) * 100) : 0;
  const pPct = initial > 0 ? Math.min(100, (pending / initial) * 100) : 0;
  const segGap = tPct + pPct > 90 ? 1.5 : 4;
  const tLen = Math.max(0, tPct - (tPct > 0 ? segGap : 0));
  const pLen = Math.max(0, pPct - (pPct > 0 ? segGap : 0));
  const remainPct = Math.max(0, 100 - tPct - pPct);
  const animatedAvail = useCountUp(available);

  const pendingRequests = useMemo(() => myLeaves.filter((l) => l.status === 'pending'), [myLeaves]);
  const sortedLeaves = useMemo(() => myLeaves.slice().sort((a, b) => {
    const ka = a.created_at || a.createdAt || a.start_date || '';
    const kb = b.created_at || b.createdAt || b.start_date || '';
    return String(kb).localeCompare(String(ka));
  }), [myLeaves]);
  const recentRequests = useMemo(() => sortedLeaves.slice(0, 6), [sortedLeaves]);

  const handleRangeChange = useCallback((start, end) => {
    setRange({ start, end });
    setBanner(null);
  }, []);

  const clearRange = () => {
    setRange({ start: null, end: null });
    notify.info('Dates cleared', 'Your selected range was cleared.');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    // Guard the required fields with a toast that says WHICH one is missing.
    if (!form.type.trim()) {
      notify.warning('Leave type required', 'Pick Annual, Sick or another type first.');
      return;
    }
    if (!range.start || !range.end) {
      notify.warning('No dates selected', 'Click your start date, then your end date on the calendar.');
      return;
    }
    if (!form.reason.trim()) {
      notify.warning('Reason required', 'Tell us why you are taking this leave.');
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const payload = {
        user_id: userId,
        leave_type: form.type.trim(),
        priority: form.priority,
        start_date: range.start,
        end_date: range.end,
        days,
        reason: form.reason.trim(),
        tenant_slug: parentSlug,
        parent_slug: parentSlug,
      };
      const res = await api.post(ENDPOINTS.LEAVE.APPLY, payload, tenantHeaders);
      const created = res?.data?.data || res?.data;

      if (file && created?.id) {
        try {
          const fd = new FormData();
          fd.append('document', file);
          await api.post(ENDPOINTS.LEAVE.UPLOAD_DOCUMENT(created.id), fd, {
            ...tenantHeaders,
            headers: { ...tenantHeaders.headers, 'Content-Type': null },
          });
        } catch (upErr) {
          console.warn('Document upload failed:', upErr);
        }
      }

      setBanner({ type: 'success', msg: `Leave request submitted for ${formatDate(range.start)} → ${formatDate(range.end)}` });
      notify.success(
        'Leave request submitted',
        `${formatDate(range.start)} → ${formatDate(range.end)} · ${days} day${days === 1 ? '' : 's'}`
      );
      setForm({ type: '', priority: 'medium', reason: '' });
      setFile(null);
      setRange({ start: null, end: null });
      if (created && created.id) {
        setMyLeaves((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return [created, ...list.filter((l) => l.id !== created.id)];
        });
      }
      await loadData();
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit leave request';
      setBanner({ type: 'error', msg });
      notify.error('Could not submit request', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leaveId) => {
    try {
      await api.patch(ENDPOINTS.LEAVE.CANCEL(leaveId), {}, tenantHeaders);
      setBanner({ type: 'success', msg: 'Leave request cancelled — your pending days were returned to your balance.' });
      notify.success('Request cancelled', 'Your leave request was withdrawn.');
      await loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel request';
      setBanner({ type: 'error', msg });
      notify.error('Could not cancel request', msg);
    }
  };

  /*  file handling  */
  const fileInputRef = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    // The backend only stores one document; anything else is rejected later
    // with a confusing error, so catch it here with a clear message instead.
    const ok = /\.(pdf|jpe?g|png)$/i.test(f.name);
    if (!ok) {
      notify.error('Unsupported file', 'Attach a PDF, JPG or PNG.');
      return;
    }
    setFile(f);
    notify.info('Document attached', f.name);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    notify.info('Document removed', 'The supporting document was detached.');
  };

  if (!userId) {
    return (
      <>
        <GlobalStyle />
        <Container>
          <Banner className="error"><Ic n="alert" s={16} /> You must be logged in to apply for leave.</Banner>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Crumb>Leave · Self-service</Crumb>
            <Title>Apply for Leave</Title>
            <Subtitle>Hi <b>{userName}</b> — pick your dates on the calendar, add the details, submit.</Subtitle>
          </div>
          <BackBtn onClick={close}><Ic n="chevL" s={14} /> Back</BackBtn>
        </Header>

        {banner && (
          <Banner className={banner.type}>
            <Ic n={banner.type === 'success' ? 'check' : 'alert'} s={17} />
            <span>{banner.msg}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setBanner(null)}><Ic n="x" s={13} /></button>
          </Banner>
        )}

        <Layout>
          {/*  LEFT COLUMN  */}
          <div>
            <Card>
              <CardHead>
                <StepNo>1</StepNo>
                <h3><Ic n="cal" s={17} /> Select your dates</h3>
              </CardHead>
              <RangeStripBar range={range} onClear={clearRange} />
              <LeaveCalendar
                myLeaves={myLeaves}
                rangeStart={range.start}
                rangeEnd={range.end}
                onRangeChange={handleRangeChange}
              />
            </Card>

            <Card>
              <CardHead>
                <StepNo>2</StepNo>
                <h3><Ic n="file" s={17} /> Leave details</h3>
              </CardHead>

              <FormGrid>
                <FormGroup className="full">
                  <Label>Leave type <Required>*</Required></Label>
                  <Chips>
                    {LEAVE_TYPES.map((t) => (
                      <TypeChip
                        key={t.value}
                        type="button"
                        $on={form.type === t.value}
                        $color={t.color}
                        onClick={() => setForm({ ...form, type: form.type === t.value ? '' : t.value })}
                      >
                        <Ic n={t.icon} s={13} />{t.label}
                      </TypeChip>
                    ))}
                  </Chips>
                </FormGroup>

                <FormGroup>
                  <Label>Priority</Label>
                  <Seg>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={form.priority === p.value ? 'on' : ''}
                        style={form.priority === p.value ? { background: p.color } : undefined}
                        onClick={() => setForm({ ...form, priority: p.value })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </Seg>
                </FormGroup>

                <FormGroup>
                  <Label>Selected range</Label>
                  {range.start && range.end ? (
                    <RangeBox>
                      <span className="rt">{formatDate(range.start)} → {formatDate(range.end)}</span>
                      <span className="wd">{countBusinessDays(range.start, range.end)} working days</span>
                      <span className="days-badge">{days} day{days === 1 ? '' : 's'}</span>
                    </RangeBox>
                  ) : (
                    <SelEmpty>Nothing selected yet — tap a start date on the calendar.</SelEmpty>
                  )}
                </FormGroup>

                <FormGroup className="full">
                  <Label htmlFor="reason">Reason <Required>*</Required></Label>
                  <ReasonArea
                    id="reason"
                    maxLength={500}
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave request…"
                  />
                  <CharCount>{form.reason.length} / 500</CharCount>
                </FormGroup>

                <FormGroup className="full">
                  <Label>Supporting document (optional)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <FileChip>
                      <span className="f-ico"><Ic n="file" s={18} /></span>
                      <span style={{ minWidth: 0 }}>
                        <b>{file.name}</b>
                        <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                      </span>
                      <button type="button" className="rm" aria-label="Remove file" onClick={clearFile}>
                        <Ic n="x" s={13} />
                      </button>
                    </FileChip>
                  ) : (
                    <Drop
                      $drag={drag}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        pickFile(e.dataTransfer?.files?.[0] || null);
                      }}
                    >
                      <span className="up"><Ic n="upload" s={26} /></span>
                      <p>Drag &amp; drop a file here, or <span className="browse">browse</span></p>
                      <p className="fmt">PDF, JPG or PNG — one supporting document</p>
                    </Drop>
                  )}
                </FormGroup>
              </FormGrid>

              <Actions>
                <Btn className="secondary" type="button" onClick={() => { notify.info('Cancelled', 'Nothing was submitted.'); close(); }}>
                  Cancel
                </Btn>
                {/* Only disabled while submitting: a permanently-disabled button
                    gives the user no idea WHY it will not work. handleSubmit
                    validates and toasts the specific missing field instead. */}
                <Btn className="primary" type="button" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Spin /> : <Ic n="check" s={17} />}
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </Btn>
              </Actions>
            </Card>
          </div>

          {/*  RIGHT COLUMN  */}
          <aside>
            <SideInner>
              <Card>
                <CardHead>
                  <h3>Leave balance</h3>
                  <HeadChip>{new Date().getFullYear()} cycle</HeadChip>
                </CardHead>
                {loading ? (
                  <LoadingRow><Spin style={{ borderTopColor: C.gray, borderColor: 'rgba(0,0,0,.12)' }} /> Loading your balance…</LoadingRow>
                ) : (
                  <GaugeWrap>
                    <GaugeBox>
                      <svg viewBox="0 0 190 190">
                        <circle className="g-track" cx="95" cy="95" r="72" pathLength="100" />
                        <circle
                          className="g-arc" cx="95" cy="95" r="72" pathLength="100"
                          stroke={C.navy}
                          strokeDasharray={`${tLen} ${100 - tLen}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          className="g-arc" cx="95" cy="95" r="72" pathLength="100"
                          stroke={C.warning}
                          strokeDasharray={`${pLen} ${100 - pLen}`}
                          strokeDashoffset={-tPct}
                        />
                      </svg>
                      <GaugeCenter>
                        <GaugeNum $low={available <= 5}>{available === 0 && loading ? '—' : animatedAvail}</GaugeNum>
                        <GaugeLbl>Days available</GaugeLbl>
                        <GaugeOf>of {initial} days</GaugeOf>
                      </GaugeCenter>
                    </GaugeBox>

                    <Stack>
                      <span className="s-taken" style={{ flex: Math.max(used, 0.0001) }} title={`Taken: ${used} days`} />
                      <span className="s-pend" style={{ flex: Math.max(pending, 0.0001) }} title={`Pending: ${pending} days`} />
                      <span style={{ flex: Math.max(remainPct, 0.0001) }} title={`Remaining: ${available} days`} />
                    </Stack>

                    <Break>
                      <Brow>
                        <span className="dot" style={{ background: '#e5e7eb' }} />
                        <span className="k">Total entitlement</span>
                        <span className="v">{initial}</span>
                        <span className="pct">100%</span>
                      </Brow>
                      <Brow>
                        <span className="dot" style={{ background: C.navy }} />
                        <span className="k">Days taken</span>
                        <span className="v">{used}</span>
                        <span className="pct">{Math.round((used / (initial || 1)) * 100)}%</span>
                      </Brow>
                      <Brow>
                        <span className="dot" style={{ background: C.warning }} />
                        <span className="k">Pending approval</span>
                        <span className="v">{pending}</span>
                        <span className="pct">{Math.round((pending / (initial || 1)) * 100)}%</span>
                      </Brow>
                      <Brow className="strong">
                        <span className="dot" style={{ background: C.navy, boxShadow: '0 0 0 3px rgba(17,24,39,.15)' }} />
                        <span className="k">Remaining</span>
                        <span className="v">{available}</span>
                        <span className="pct">{Math.round(remainPct)}%</span>
                      </Brow>
                    </Break>

                    {available <= 5 && (
                      <LowNote>
                        <Ic n="alert" s={14} />
                        Balance is running low — plan the rest of your year carefully.
                      </LowNote>
                    )}
                  </GaugeWrap>
                )}
              </Card>

              <Card>
                <CardHead>
                  <h3>Recent requests</h3>
                  <HeadChip>{myLeaves.length} total</HeadChip>
                  {pendingRequests.length > 0 && <HeadChip className="warn">{pendingRequests.length} pending</HeadChip>}
                </CardHead>
                {loading ? (
                  <LoadingRow><Spin style={{ borderTopColor: C.gray, borderColor: 'rgba(0,0,0,.12)' }} /> Loading your requests…</LoadingRow>
                ) : recentRequests.length === 0 ? (
                  <Empty>No leave requests yet — apply for your first one here.</Empty>
                ) : (
                  <>
                    {recentRequests.map((l) => {
                      const tm = LEAVE_TYPES.find((t) => t.value === l.leave_type) || LEAVE_TYPES[0];
                      const d = l.days ?? countDaysInclusive(l.start_date, l.end_date);
                      const docName = l.document || l.document_name || l.attachment;
                      const ago = appliedAgoLabel(l);
                      return (
                        <Req key={l.id || `${l.start_date}-${l.end_date}`} $status={l.status}>
                          <ReqIco style={{ color: tm.color }}><Ic n={tm.icon} s={16} /></ReqIco>
                          <ReqMain>
                            <ReqTop>
                              <b>{String(l.leave_type || 'leave').replace('_', ' ')}</b>
                              <StatusBadge $status={l.status}>
                                <i />
                                {(STATUS_META[l.status] || STATUS_META.pending).label}
                              </StatusBadge>
                            </ReqTop>
                            <ReqMeta>
                              {formatDate(l.start_date)} → {formatDate(l.end_date)}
                              {' · '}{d} day{d !== 1 ? 's' : ''}{docName ? ` · 📎 ${docName}` : ''}
                            </ReqMeta>
                            {ago && <ReqAgo><i />{ago}</ReqAgo>}
                            {l.reason && <ReqReason>{l.reason}</ReqReason>}
                            {l.status === 'pending' && (
                              <ReqCancel onClick={() => handleCancel(l.id)}>Cancel request</ReqCancel>
                            )}
                          </ReqMain>
                        </Req>
                      );
                    })}
                    {sortedLeaves.length > 6 && <Mfoot>+{sortedLeaves.length - 6} older requests…</Mfoot>}
                  </>
                )}
              </Card>
            </SideInner>
          </aside>
        </Layout>
      </Container>
    </>
  );
};

export default ApplyLeave;