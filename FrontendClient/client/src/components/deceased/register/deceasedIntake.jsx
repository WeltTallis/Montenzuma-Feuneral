import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import { getTenantSlug as getStoredTenantSlug, getAuthToken, getBranchScopeHeaders } from '../../../utils/globalAuth';
import { useTenantStore } from '../../../modules/seo/useTenantStore';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { ENDPOINTS } from '../../../api/endpoints';
import OfficialStamp from '../../../utils/stamp/stamp';
import env from '../../../utils/config/env';
import notify from '../../../utils/notify';
import bwipjs from '@bwip-js/browser';
import InOurCare from '../../common/InOurCare';
import { todayKey } from '../../../utils/dates/parseDates';
import { notifyDeceasedChanged } from '../../../api/dashboardDataApi';

// ─── IndexedDB Helpers (unchanged) ──────────────────────────
const DB_NAME = 'MortuaryIntakeDB';
const DB_VERSION = 2;
const DRAFT_STORE = 'pendingRegistrations';
const QUEUE_STORE = 'offlineQueue';

const openDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = () => reject(request.error);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(DRAFT_STORE)) db.createObjectStore(DRAFT_STORE, { keyPath: 'draftId' });
    if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'syncId' });
  };
  request.onsuccess = () => resolve(request.result);
});
const saveDraftToDB = async (draft) => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DRAFT_STORE, 'readwrite'); tx.objectStore(DRAFT_STORE).put(draft).onsuccess = () => res(true); tx.onerror = () => rej(tx.error); }); };
const getAllDraftsFromDB = async () => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DRAFT_STORE, 'readonly'); const rq = tx.objectStore(DRAFT_STORE).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); }); };
const deleteDraftFromDB = async (id) => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(DRAFT_STORE, 'readwrite'); tx.objectStore(DRAFT_STORE).delete(id).onsuccess = () => res(true); tx.onerror = () => rej(tx.error); }); };
const saveToOfflineQueue = async (item) => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(QUEUE_STORE, 'readwrite'); tx.objectStore(QUEUE_STORE).put(item).onsuccess = () => res(true); tx.onerror = () => rej(tx.error); }); };
const getAllFromQueue = async () => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(QUEUE_STORE, 'readonly'); const rq = tx.objectStore(QUEUE_STORE).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); }); };
const deleteFromQueue = async (id) => { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(QUEUE_STORE, 'readwrite'); tx.objectStore(QUEUE_STORE).delete(id).onsuccess = () => res(true); tx.onerror = () => rej(tx.error); }); };

// ─── Palette + gutters (unchanged) ──────────────────────────
const COLORS = {
  ink: '#1A1A1A', bone: '#FAF8F4', bone2: '#FFFFFF',
  brass: '#6B4045', brassLight: '#A98F6E',
  verdigris: '#3D4F47', verdigrisDark: '#2E3F37',
  line: '#E2DDD3', gray: '#6B6862', muted: '#999999',
  red: '#9B4A3F', white: '#FFFFFF', gold: '#C9A227', goldDark: '#A8851C',
  tick: '#3D4F47',
  /* Header + dashed-field accents (from the approved mock) */
  ox: '#7c2b23', oxDeep: '#6a241e',
  dashLine: '#c9c3b8',
};

const GUTTER = '3rem';
const GUTTER_TABLET = '2.5rem';
const GUTTER_MOBILE = '1.5rem';
const EASE = 'cubic-bezier(.32,.72,.24,1)';

const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;

const Container = styled.div`
  min-height: 100vh; background: ${COLORS.white};
  font-family: 'Saira', sans-serif; color: ${COLORS.ink};
  font-size: 15px; line-height: 1.5;
  display: flex; justify-content: center; align-items: flex-start;
`;
const FormSheet = styled.div` width:100%; max-width:2200px; margin:0 auto; background:${COLORS.white}; position:relative; overflow:hidden; `;
const ContentWrapper = styled.div` position:relative; z-index:1; `;

/* ══════════════════════════════════════════════════════════════
   CHANGE 1 — REDESIGNED TOP HEADER
   Condolence slider (wraps, never clips) · Facility block with
   small icons · admission number + barcode on the right.
   ══════════════════════════════════════════════════════════════ */

const CONDOLENCE_PHRASES = [
  <>We are <em>deeply sorry</em> for your loss</>,
  <>Please accept our <em>heartfelt condolences</em></>,
  <>We are here for you, <em>every step</em> of the way</>,
  <>Register New Case</>,
];

const HeaderWrapper = styled.header`
  padding: 2.5rem ${GUTTER};
  @media (max-width:1024px){ padding:2.25rem ${GUTTER_TABLET}; }
  @media (max-width:768px){ padding:2rem ${GUTTER_TABLET}; }
  @media (max-width:600px){ padding:1.5rem ${GUTTER_MOBILE}; }
`;
const HeaderMain = styled.div`
  display:flex; justify-content:space-between; align-items:flex-start; gap:3rem;
  @media (max-width:768px){ flex-direction:column; align-items:flex-start; gap:2.25rem; }
`;
const HeaderLeft = styled.div` display:flex; flex-direction:column; gap:1.75rem; flex:1.2; min-width:0; `;
const HeaderRight = styled.div`
  display:flex; flex-direction:column; align-items:flex-end; gap:1.75rem; flex:1;
  @media (max-width:768px){ align-items:flex-start; width:100%; }
`;
const Eyebrow = styled.span`
  font-family:'JetBrains Mono',monospace; font-size:.6rem; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:${COLORS.muted}; display:block;
`;

/* Slider — JS-measured heights so wrapped lines are ALWAYS fully visible */
const SliderWindow = styled.div` overflow:hidden; position:relative; transition:height .5s ${EASE}; `;
const SliderTrack = styled.div` transition:transform .9s cubic-bezier(.65,.05,.36,1); `;
const SliderPhrase = styled.div`
  padding:2px 0; font-size:1.5rem; font-weight:600; line-height:1.3;
  letter-spacing:-.01em; color:${COLORS.ink}; white-space:normal;
  em { font-style:italic; color:${COLORS.ox}; }
  @media (max-width:600px){ font-size:1.15rem; }
`;

function CondolenceSlider() {
  const [idx, setIdx] = useState(0);
  const [dims, setDims] = useState({ h: 0, offset: 0 });
  const itemRefs = useRef([]);

  useLayoutEffect(() => {
    const hs = itemRefs.current.map(el => (el ? el.offsetHeight : 0));
    setDims({ h: hs[idx] || 0, offset: hs.slice(0, idx).reduce((a, b) => a + b, 0) });
  }, [idx]);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CONDOLENCE_PHRASES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const remeasure = () => setIdx(i => i); // re-run layout effect on resize
    window.addEventListener('resize', remeasure);
    return () => window.removeEventListener('resize', remeasure);
  }, []);

  return (
    <SliderWindow style={{ height: dims.h ? `${dims.h}px` : 'auto' }}>
      <SliderTrack style={{ transform: `translateY(-${dims.offset}px)` }}>
        {CONDOLENCE_PHRASES.map((p, i) => (
          <SliderPhrase key={i} ref={el => (itemRefs.current[i] = el)}>{p}</SliderPhrase>
        ))}
      </SliderTrack>
    </SliderWindow>
  );
}

/* Facility block */
const FacilityBlock = styled.div` display:flex; flex-direction:column; gap:5px; `;
const FacilityName = styled.span` font-size:.9rem; font-weight:600; margin-bottom:2px; `;
const FacilityLine = styled.span`
  font-family:'JetBrains Mono',monospace; font-size:.68rem; letter-spacing:.06em;
  color:${COLORS.gray}; display:flex; align-items:center; gap:8px;
  svg { width:12px; height:12px; color:${COLORS.ox}; flex:none; }
`;
const IcoPhone = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>);
const IcoMail = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>);
const IcoPin = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);

/* Right column */
const DateBlock = styled.div` display:flex; flex-direction:column; gap:3px; text-align:right;
  @media (max-width:768px){ text-align:left; } `;
const DateValue = styled.span` font-size:1.05rem; font-weight:600; letter-spacing:.02em; margin-top:3px; `;
const VerifBlock = styled.div` display:flex; flex-direction:column; align-items:flex-end; gap:5px;
  @media (max-width:768px){ align-items:flex-start; } `;
const AdmissionNumber = styled.div`
  font-family:'JetBrains Mono',monospace; font-size:.95rem; font-weight:700;
  letter-spacing:.05em; color:${COLORS.ox};
`;

const Barcode = ({ value }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128', text: value || 'AWAITING-ID',
          scale: 2, height: 8, includetext: false, paddingwidth: 0, paddingheight: 0,
        });
      } catch (e) { console.error('Barcode generation error:', e); }
    }
  }, [value]);
  return <canvas ref={canvasRef} style={{ display: 'block', width: 'auto', maxWidth: '100%', height: '40px', marginLeft: 'auto' }} />;
};

/* ══════════════════════════════════════════════════════════════
   CHANGE 2 — DASHED UNDERLINE FIELDS
   dashed at rest → solid ink on hover → solid ox on focus
   ══════════════════════════════════════════════════════════════ */
const dashedField = css`
  border-bottom: 1px dashed ${COLORS.dashLine};
  &:hover { border-bottom: 1px solid ${COLORS.ink}; }
  &:focus { border-bottom: 1px solid ${COLORS.ox}; outline: none; box-shadow: none; background: transparent; }
`;

/* ─── Everything below is UNCHANGED from your file ─────────── */

const FormBody = styled.div`
  padding: 3rem ${GUTTER} 1.5rem ${GUTTER};
  @media (max-width:1024px){ padding:2.5rem ${GUTTER_TABLET}; }
  @media (max-width:600px){ padding:1.5rem ${GUTTER_MOBILE}; }
`;
const Section = styled.div` margin-bottom:4rem; &:last-child{margin-bottom:0;} `;
const SectionHead = styled.div`
  display:flex; align-items:center; gap:.75rem; margin-bottom:2rem;
  padding:.75rem 1.25rem; background:${COLORS.ink}; border-radius:4px;
`;
const SectionNum = styled.span` font-size:.75rem; font-weight:500; color:rgba(250,248,244,.4); font-family:'JetBrains Mono',monospace; `;
const SectionTitle = styled.h2` font-family:'JetBrains Mono',monospace; font-size:.85rem; font-weight:500; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.bone}; margin:0; `;
const Row = styled.div`
  display:flex; gap:1.5rem; margin-bottom:1.5rem; &:last-child{margin-bottom:0;}
  @media (max-width:1024px){ flex-wrap:wrap; }
  @media (max-width:768px){ flex-direction:column; gap:1.25rem; }
`;
const Col = styled.div`
  flex:1; min-width:0;
  @media (max-width:1024px){ flex:1 1 45%; min-width:200px; }
  @media (max-width:768px){ flex:1 1 100%; }
`;
const Col2 = styled(Col)` flex:2; @media (max-width:1024px){ flex:1 1 100%; } `;
const Col05 = styled(Col)` flex:.5; @media (max-width:1024px){ flex:1 1 30%; min-width:120px; } `;
const Label = styled.label`
  display:block; font-size:.7rem; font-weight:600; letter-spacing:.12em;
  text-transform:uppercase; color:${COLORS.brass}; margin-bottom:.5rem;
`;
const InputFieldWrapper = styled.div` position:relative; width:100%; display:flex; align-items:center; `;
const Input = styled.input`
  width:100%; height:2.75rem; border:none; border-radius:0; outline:none;
  box-shadow:none; background:transparent; padding:0 2rem 0 0;
  font-family:'Saira',sans-serif; font-size:.95rem; font-weight:400;
  color:${COLORS.ink}; transition:border-color .2s ease; box-sizing:border-box;
  ${dashedField}
  &:disabled { background:transparent; color:${COLORS.gray}; cursor:not-allowed; opacity:.8; }
  &::placeholder { color:#a8a29e; font-weight:400; }
`;
const InputLg = styled(Input)` height:3rem; font-size:1.05rem; font-weight:500; `;
const Select = styled.select`
  width:100%; height:2.75rem; border:none; border-radius:0; outline:none;
  box-shadow:none; background:transparent; padding:0 2rem 0 0;
  font-family:'Saira',sans-serif; font-size:.95rem; color:${COLORS.ink};
  transition:border-color .2s ease; box-sizing:border-box; cursor:pointer;
  ${dashedField}
`;
const TickIconWrapper = styled.div`
  position:absolute; right:.25rem; top:50%; transform:translateY(-50%);
  width:1.5rem; height:1.5rem; border-radius:50%;
  background:${COLORS.verdigris}; color:${COLORS.white};
  display:flex; align-items:center; justify-content:center; pointer-events:none;
`;
const ErrorMessage = styled.span` color:${COLORS.red}; font-size:.75rem; margin-top:.3rem; display:block; `;
const SigCanvasWrap = styled.div`
  border-bottom:2px solid ${COLORS.ink}; border-radius:4px 4px 0 0; height:14rem;
  display:flex; align-items:center; justify-content:center; background:${COLORS.bone};
  cursor:crosshair; position:relative; margin-bottom:.5rem; overflow:hidden; width:100%;
  box-shadow:inset 0 1px 2px rgba(21,23,26,.03);
  & > canvas { width:100% !important; height:100% !important; touch-action:none; }
  @media (max-width:768px){ height:18rem; }
`;
const SigGuideText = styled.div`
  position:absolute; bottom:10px; left:15px; font-family:'Alex Brush',cursive;
  font-size:1.2rem; color:${COLORS.gray}; opacity:.3; pointer-events:none; user-select:none;
`;
const SignOffContainer = styled.div` position:relative; margin-top:2.5rem; `;
const SignOffGrid = styled.div`
  display:grid; grid-template-columns:2.5fr 1.5fr; gap:3rem; align-items:end; grid-template-areas:"sig right";
  @media (max-width:1024px){ grid-template-columns:1fr; grid-template-areas:"sig" "right"; gap:2.5rem; }
`;
const GridSig = styled.div` grid-area:sig; min-width:0; `;
const GridRight = styled.div`
  grid-area:right; min-width:0; display:flex; flex-direction:column; gap:1.5rem;
  position:relative; padding-bottom:1.5rem;
`;
const GridName = styled.div` min-width:0; position:relative; z-index:1; `;
const GridDate = styled.div` min-width:0; position:relative; z-index:1; `;
const StampWrapper = styled.div`
  position:absolute; bottom:25px; right:-15px; width:240px; pointer-events:none;
  transform:rotate(-12deg); opacity:.92; filter:drop-shadow(0 2px 4px rgba(0,0,0,.15)); z-index:10;
  @media (max-width:1024px){ position:relative; bottom:auto; right:auto; margin:1rem auto 0; transform:rotate(-6deg) scale(.9); }
`;
const ConfirmBlock = styled.div`
  display:flex; flex-direction:column; gap:.55rem; width:100%; margin-top:2.5rem;
  padding:1.1rem 1.3rem 1.25rem; border:none; border-radius:4px; scroll-margin-top:2rem;
  &:focus-within { box-shadow:0 0 0 2px rgba(169,143,110,.16); }
  ${p => p.$checked && css` &:focus-within { box-shadow:none; } `}
`;
const ConfirmLabel = styled.label`
  display:flex; align-items:flex-start; gap:.8rem; cursor:pointer; user-select:none;
  -webkit-tap-highlight-color:transparent;
`;
const ConfirmBox = styled.input`
  appearance:none; -webkit-appearance:none; width:22px; height:22px; flex:none; margin-top:.05rem;
  position:relative; cursor:pointer; border:0; border-radius:4px; background:${COLORS.bone2};
  box-shadow:inset 0 0 0 1.5px ${COLORS.line}; transition:background .15s ease, box-shadow .15s ease;
  &:checked { background:${COLORS.verdigris}; box-shadow:none; }
  &:checked::after { content:''; position:absolute; left:7px; top:2px; width:6px; height:12px;
    border:solid ${COLORS.white}; border-width:0 3px 3px 0; transform:rotate(45deg); }
  &:focus-visible { outline:2px solid ${COLORS.brassLight}; outline-offset:2px; }
  @media (max-width:1024px){ width:28px; height:28px;
    &:checked::after { left:9px; top:4px; width:7px; height:13px; border-width:0 3px 3px 0; } }
`;
const ConfirmText = styled.span`
  font-family:'Fraunces',Georgia,serif; font-size:.95rem; font-weight:500; line-height:1.5;
  color:${COLORS.ink}; padding-top:.1rem;
  @media (max-width:600px){ font-size:.9rem; }
  @media (min-width:601px) and (max-width:1024px){ display:none; }
`;
const ConfirmTextShort = styled.span`
  display:none;
  @media (min-width:601px) and (max-width:1024px){
    display:block; font-family:'Fraunces',Georgia,serif; font-size:1rem; font-weight:500;
    line-height:1.4; color:${COLORS.ink}; padding-top:.05rem;
  }
`;
const ConfirmHint = styled.p` margin:0 0 0 1.55rem; font-size:.74rem; line-height:1.4; color:${COLORS.gray}; `;
const ConfirmError = styled.p` margin:0 0 0 1.55rem; display:flex; align-items:center; gap:.4rem; font-size:.78rem; font-weight:500; color:${COLORS.red}; `;
const ActionsContainer = styled.div`
  display:flex; gap:1rem; justify-content:flex-end; margin-top:4rem; padding-top:2rem;
  border-top:1px solid ${COLORS.line}; flex-wrap:wrap;
  @media (max-width:600px){ flex-direction:column-reverse; gap:.75rem; }
  @media (min-width:601px) and (max-width:1024px){
    justify-content:flex-start; gap:.75rem;
    > * { flex:1 1 calc(50% - .5rem); min-width:0; }
    > div > button, > button { width:100%; padding:1rem 1.25rem; }
  }
`;
const PrimaryButton = styled.button`
  background:${p => (p.$locked ? '#B4AFA5' : '#722F37')}; color:${COLORS.bone}; border:none;
  border-radius:4px; padding:1rem 2rem; font-size:.85rem; font-weight:600;
  font-family:'Saira',sans-serif; cursor:pointer; display:inline-flex; align-items:center;
  justify-content:center; gap:.5rem; transition:all .2s ease; letter-spacing:.05em; text-transform:uppercase;
  &:hover { background:${p => (p.$locked ? '#B4AFA5' : '#5C242B')}; transform:translateY(-1px);
    box-shadow:${p => (p.$locked ? 'none' : '0 4px 12px rgba(114,47,55,.25)')}; }
  ${p => p.$locked && css` &:hover { transform:none; box-shadow:none; } `}
  &:disabled { background:${COLORS.gray}; cursor:not-allowed; opacity:.6; transform:none; }
  @media (max-width:600px){ width:100%; }
`;
const PauseButton = styled.button`
  background:${COLORS.ink}; color:${COLORS.bone}; border:1px solid ${COLORS.ink}; border-radius:4px;
  padding:1rem 2rem; font-size:.85rem; font-weight:600; font-family:'Saira',sans-serif; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; gap:.5rem; transition:all .2s ease;
  letter-spacing:.05em; text-transform:uppercase; position:relative;
  &:hover { background:#333; border-color:#333; transform:translateY(-1px); }
  @media (max-width:600px){ width:100%; }
`;
const DropdownPanel = styled.div`
  position:absolute; bottom:calc(100% + 8px); right:0; width:320px; background:${COLORS.white};
  border:1px solid ${COLORS.line}; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,.15);
  z-index:100; overflow:hidden;
  @media (max-width:600px){ width:100%; }
`;
const DropdownRow = styled.div`
  display:flex; justify-content:space-between; align-items:center; padding:1rem;
  border-bottom:1px solid ${COLORS.line}; &:last-child{border-bottom:none;}
`;
const DraftInfo = styled.div` display:flex; flex-direction:column; gap:.2rem; `;
const DraftName = styled.span` font-weight:600; font-size:.9rem; color:${COLORS.ink}; `;
const DraftMeta = styled.span` font-size:.7rem; color:${COLORS.muted}; font-family:'JetBrains Mono',monospace; `;
const DraftActions = styled.div` display:flex; gap:.5rem; `;
const DraftBtn = styled.button`
  background:transparent; border:1px solid ${COLORS.brass}; color:${COLORS.brass};
  padding:.3rem .6rem; border-radius:4px; font-size:.7rem; font-weight:600; cursor:pointer;
  display:flex; align-items:center; gap:.2rem; transition:all .2s;
  &:hover { background:${COLORS.brass}; color:${COLORS.bone}; }
  &.delete { border-color:${COLORS.red}; color:${COLORS.red}; }
  &.delete:hover { background:${COLORS.red}; color:${COLORS.bone}; }
`;
const RecordInfoStrip = styled.div`
  font-size:.65rem; letter-spacing:.11em; text-transform:uppercase; color:${COLORS.gray};
  font-family:'JetBrains Mono',monospace; text-align:center; line-height:1.7;
  margin:2rem ${GUTTER} 0; padding:.9rem 1rem .4rem; border-top:1px solid ${COLORS.line};
  @media (max-width:1024px){ margin:1.75rem ${GUTTER_TABLET} 0; }
  @media (max-width:600px){ margin:1.5rem ${GUTTER_MOBILE} 0; }
`;
const ElegantFooter = styled.footer`
  position:relative; width:100%; overflow:hidden; background:#1A2A27; color:#E9EBDD;
  text-align:center; padding:56px 20px 0; box-sizing:border-box;
  &::before { content:''; position:absolute; left:50%; bottom:-260px; transform:translateX(-50%);
    width:520px; height:520px; border-radius:50%; border:1.5px solid rgba(233,235,221,.1); pointer-events:none; }
  &::after { content:''; position:absolute; left:50%; bottom:-320px; transform:translateX(-50%);
    width:680px; height:680px; border-radius:50%; border:1px solid rgba(233,235,221,.06); pointer-events:none; }
  @media (max-width:560px){ padding:44px 20px 0; }
`;
const FooterTagline = styled.p`
  font-family:'Cormorant Garamond',Georgia,serif; font-style:italic; font-weight:500;
  font-size:1.25rem; line-height:1.5; color:rgba(237,233,219,.82); max-width:44ch; margin:0 auto;
  position:relative; z-index:1;
`;
const FooterValues = styled.div`
  display:flex; align-items:center; justify-content:center; gap:16px; margin:30px auto 0;
  max-width:420px; position:relative; z-index:1;
  &::before, &::after { content:''; flex:1; height:1px; background:rgba(233,235,221,.16); }
`;
const FooterValueLabel = styled.span`
  font-family:'Karla','Segoe UI',sans-serif; font-weight:700; font-size:.64rem;
  letter-spacing:.26em; text-transform:uppercase; color:rgba(205,209,191,.55);
`;
const FooterBar = styled.div`
  margin-top:44px; border-top:1px solid rgba(237,233,219,.12); position:relative; z-index:1;
  display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;
  padding:18px 32px; font-family:'Karla','Segoe UI',sans-serif; font-weight:500; font-size:.76rem;
  color:rgba(237,233,219,.42);
  @media (max-width:560px){ flex-direction:column; gap:6px; padding:16px 20px; text-align:center; }
`;

const formatHeaderDate = (value) => {
  if (!value) return '—';
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ─── Component ──────────────────────────────────────────────
const DeceasedRegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: urlTenantSlug } = useParams();
  const { tenantData } = useTenantStore();

  const getTenantSlug = () => {
    const exact = urlTenantSlug && urlTenantSlug !== 'default' && urlTenantSlug !== 'dashboard'
      && urlTenantSlug !== 'undefined' && urlTenantSlug !== 'null' ? urlTenantSlug : '';
    return exact || getStoredTenantSlug() || '';
  };

  const sigPadRef1 = useRef(null);
  const confirmBlockRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [vigilData, setVigilData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admissionId, setAdmissionId] = useState('');
  const [lastSignedName, setLastSignedName] = useState('');

  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [pausedDrafts, setPausedDrafts] = useState([]);
  const [isPauseDropdownOpen, setIsPauseDropdownOpen] = useState(false);

  const branding = useMemo(() => resolveTenantBranding(tenantData), [tenantData]);
  const { name: tenantName, displayPhone, displayEmail, displayLocation, displayBranch, displayAddress } = branding;

  const getLoggedInUserEmail = () => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.email || u.userEmail || ''; }
    catch { return ''; }
  };
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const initialFormData = {
    admission_number: location.state?.permitNumber || '',
    date_admitted: todayKey(),
    time_received: getCurrentTime(),
    full_name: '', gender: '', age: '', date_of_death: '', cause_of_death: '',
    body_status: '', place_of_death: '', contact_person: '', id_number: '',
    id_type: 'National ID', tel_number: '', alternative_phone: '', received_from: '',
    receiving_officer: '', verified_by: getLoggedInUserEmail(), permit_number: '', relationship: '',
    confirm_accepted: false,
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchPausedDrafts = async () => {
    try { setPausedDrafts(await getAllDraftsFromDB()); }
    catch (error) { console.error('Failed to fetch paused drafts:', error); }
  };

  const syncOfflineData = async () => {
    try {
      const queue = await getAllFromQueue();
      if (queue.length === 0) return;
      notify.info('Syncing Data', `Uploading ${queue.length} offline records...`);
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      let uploaded = 0;
      for (const item of queue) {
        try {
          const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.CREATE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) },
            body: JSON.stringify(item.payload),
          });
          if (response.ok) { await deleteFromQueue(item.syncId); uploaded += 1; }
        } catch (e) { /* retry next time */ }
      }
      notify.success('Sync Complete', 'Offline records uploaded successfully.');
      if (uploaded > 0) notifyDeceasedChanged();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, time_received: getCurrentTime() }));
    fetchPausedDrafts();
    syncOfflineData();
    const handleOnline = () => syncOfflineData();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!formData.gender) return;
    const fetchAdmissionNumber = async () => {
      try {
        const response = await api.get(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.ADMISSION_NUMBER(formData.gender)}`);
        const result = response.data;
        if (result?.success && result?.data?.admission_number) setAdmissionId(result.data.admission_number);
      } catch (error) { console.error('Failed to fetch admission number:', error); }
    };
    fetchAdmissionNumber();
  }, [formData.gender]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (message.text) setMessage({ type: '', text: '' });
    if (name === 'full_name' && lastSignedName && value !== lastSignedName) {
      setLastSignedName('');
      try { sigPadRef1.current?.clear(); } catch { /* ignore */ }
    }
  };

  const isValidPhone = (p) => /^(?:0[17]\d{8}|\+254[17]\d{8})$/.test(String(p || '').replace(/\s/g, ''));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_admitted) newErrors.date_admitted = 'Date admitted is required';
    if (!formData.received_from.trim()) newErrors.received_from = 'Received from is required';
    if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person name is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
    if (!/^\d{7,9}$/.test(formData.id_number.trim())) newErrors.id_number = 'Enter a valid National ID number (7-9 digits)';
    if (!formData.tel_number.trim()) newErrors.tel_number = 'Telephone number is required';
    else if (!isValidPhone(formData.tel_number)) newErrors.tel_number = 'Please enter a valid telephone number';
    if (formData.alternative_phone && !isValidPhone(formData.alternative_phone))
      newErrors.alternative_phone = 'Please enter a valid alternative phone number';
    if (!formData.receiving_officer.trim()) newErrors.receiving_officer = 'Receiving officer name is required';
    if (sigPadRef1.current?.isEmpty()) newErrors.signature = 'Signature is required to proceed';
    if (!formData.confirm_accepted) newErrors.confirm_accepted = 'Confirmation that the details are correct is required';
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const missingFields = Object.values(validationErrors);
      if (validationErrors.confirm_accepted)
        confirmBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notify.info('Missing required details', `Please complete the following: ${missingFields.join(', ')}`);
      setMessage({ type: 'error', text: `Please complete all required fields: ${missingFields.join(', ')}` });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const signatureData = sigPadRef1.current?.toDataURL();
    const payload = {
      full_name: formData.full_name,
      cause_of_death: formData.cause_of_death,
      national_id: formData.id_number,
      received_from: formData.received_from,
      age: formData.age ? parseInt(formData.age, 10) : 0,
      time_received: getCurrentTime(),
      body_status: formData.body_status || 'Normal Condition',
      contact_person: formData.contact_person,
      tell_no: formData.tel_number,
      gender: formData.gender,
      date_of_death: formData.date_of_death || null,
      place_of_death: formData.place_of_death || null,
      id_type: 'National ID',
      alternative_phone: formData.alternative_phone || null,
      receiving_officer: formData.receiving_officer.trim(),
      verified_by: formData.verified_by || getLoggedInUserEmail() || null,
      relationship: formData.relationship || null,
      permit_no: formData.permit_number || null,
      date_admitted: formData.date_admitted,
      signature: signatureData,
    };

    if (!navigator.onLine) {
      try {
        const syncId = `sync-${Date.now()}`;
        await saveToOfflineQueue({ syncId, payload, savedAt: new Date().toISOString() });
        notify.success('Saved Offline', 'No internet. Record saved locally. Will sync automatically when back online.');
        setVigilData({ name: formData.full_name, passed: formData.date_of_death, reference: 'PENDING SYNC' });
        setShowSuccess(true);
        if (currentDraftId) { await deleteDraftFromDB(currentDraftId); setCurrentDraftId(null); fetchPausedDrafts(); }
        setFormData({ ...initialFormData, verified_by: getLoggedInUserEmail(), time_received: getCurrentTime(), date_admitted: todayKey() });
        setAdmissionId('');
        sigPadRef1.current?.clear();
        setErrors({});
      } catch (error) {
        notify.error('Offline Save Failed', 'Could not save the record locally.');
      } finally { setIsSubmitting(false); }
      return;
    }

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.CREATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...getBranchScopeHeaders(tenantSlug) },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registration failed');

      if (currentDraftId) { await deleteDraftFromDB(currentDraftId); setCurrentDraftId(null); fetchPausedDrafts(); }

      setVigilData({
        name: formData.full_name,
        passed: formData.date_of_death,
        reference: admissionId || result?.data?.admission_number || '—',
      });
      setShowSuccess(true);

      setFormData({ ...initialFormData, verified_by: getLoggedInUserEmail(), time_received: getCurrentTime(), date_admitted: todayKey() });
      setAdmissionId('');
      setLastSignedName('');
      sigPadRef1.current?.clear();
      setErrors({});
      notifyDeceasedChanged();
    } catch (error) {
      notify.error('Registration Failed', error.message || 'Something went wrong.');
      setMessage({ type: 'error', text: error.message || 'Registration failed. Please try again.' });
    } finally { setIsSubmitting(false); }
  };

  const handlePause = async () => {
    try {
      const draftId = currentDraftId || `draft-${Date.now()}`;
      await saveDraftToDB({ draftId, formData, savedAt: new Date().toISOString() });
      setCurrentDraftId(draftId);
      fetchPausedDrafts();
      notify.info('Draft Paused', 'You can resume this registration anytime from Pause.');
      setIsPauseDropdownOpen(false);
    } catch (e) { notify.error('Pause Failed', 'Could not save the draft locally.'); }
  };

  const resumeDraft = (draft) => {
    setFormData({ ...initialFormData, ...draft.formData });
    setCurrentDraftId(draft.draftId);
    setIsPauseDropdownOpen(false);
  };

  const deleteDraft = async (draftId) => {
    await deleteDraftFromDB(draftId);
    if (currentDraftId === draftId) setCurrentDraftId(null);
    fetchPausedDrafts();
  };

  return (
    <Container>
      <FormSheet>
        <ContentWrapper>

          {/* ════ REDESIGNED HEADER ════ */}
          <HeaderWrapper>
            <HeaderMain>
              <HeaderLeft>
                <div>
                  <Eyebrow>{tenantName}{displayBranch ? ` · ${displayBranch}` : ''}</Eyebrow>
                  <CondolenceSlider />
                </div>
                <FacilityBlock>
                  <FacilityName>Facility</FacilityName>
                  <FacilityLine><IcoPhone />{displayPhone || '—'}</FacilityLine>
                  <FacilityLine><IcoMail />{(displayEmail || '—').toUpperCase()}</FacilityLine>
                  <FacilityLine><IcoPin />{displayLocation || displayAddress || '—'}</FacilityLine>
                </FacilityBlock>
              </HeaderLeft>
              <HeaderRight>
                <DateBlock>
                  <Eyebrow>Date of Admission</Eyebrow>
                  <DateValue>{formatHeaderDate(formData.date_admitted)}</DateValue>
                </DateBlock>
                <VerifBlock>
                  <Eyebrow>Admission No.</Eyebrow>
                  <AdmissionNumber>{admissionId || 'AWAITING-ID'}</AdmissionNumber>
                  <Barcode value={admissionId} />
                </VerifBlock>
              </HeaderRight>
            </HeaderMain>
          </HeaderWrapper>

          <FormBody>
            {message.type === 'error' && message.text && (
              <ErrorMessage style={{ marginBottom: '1.5rem', fontSize: '.85rem' }}>{message.text}</ErrorMessage>
            )}

            {/* ── 01 Deceased ── */}
            <Section>
              <SectionHead><SectionNum>01</SectionNum><SectionTitle>Deceased Information</SectionTitle></SectionHead>
              <Row>
                <Col2>
                  <Label>Full Name of Deceased</Label>
                  <InputLg name="full_name" placeholder="e.g. Grace Wanjiku Mwangi" value={formData.full_name} onChange={handleChange} />
                  {errors.full_name && <ErrorMessage>{errors.full_name}</ErrorMessage>}
                </Col2>
                <Col05>
                  <Label>Gender</Label>
                  <Select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select…</option>
                    <option>Female</option>
                    <option>Male</option>
                  </Select>
                  {errors.gender && <ErrorMessage>{errors.gender}</ErrorMessage>}
                </Col05>
                <Col05>
                  <Label>Age</Label>
                  <Input name="age" placeholder="e.g. 74" value={formData.age} onChange={handleChange} />
                </Col05>
              </Row>
              <Row>
                <Col>
                  <Label>Date of Death</Label>
                  <Input name="date_of_death" type="date" value={formData.date_of_death} onChange={handleChange} />
                </Col>
                <Col>
                  <Label>Date Admitted</Label>
                  <Input name="date_admitted" type="date" value={formData.date_admitted} onChange={handleChange} />
                  {errors.date_admitted && <ErrorMessage>{errors.date_admitted}</ErrorMessage>}
                </Col>
                <Col>
                  <Label>Time Received</Label>
                  <Input name="time_received" type="time" value={formData.time_received} onChange={handleChange} />
                </Col>
                <Col>
                  <Label>Body Status</Label>
                  <Select name="body_status" value={formData.body_status} onChange={handleChange}>
                    <option value="">Select…</option>
                    <option>Normal Condition</option>
                    <option>Embalmed</option>
                    <option>Autopsy Performed</option>
                  </Select>
                </Col>
              </Row>
              <Row>
                <Col2>
                  <Label>Cause of Death</Label>
                  <Input name="cause_of_death" placeholder="As per death certificate / provisional diagnosis" value={formData.cause_of_death} onChange={handleChange} />
                </Col2>
                <Col>
                  <Label>Place of Death</Label>
                  <Input name="place_of_death" placeholder="e.g. Kenyatta National Hospital" value={formData.place_of_death} onChange={handleChange} />
                </Col>
              </Row>
            </Section>

            {/* ── 02 Next of Kin ── */}
            <Section>
              <SectionHead><SectionNum>02</SectionNum><SectionTitle>Next of Kin & Contact</SectionTitle></SectionHead>
              <Row>
                <Col>
                  <Label>Contact Person</Label>
                  <Input name="contact_person" placeholder="Full name" value={formData.contact_person} onChange={handleChange} />
                  {errors.contact_person && <ErrorMessage>{errors.contact_person}</ErrorMessage>}
                </Col>
                <Col05>
                  <Label>Relationship</Label>
                  <Input name="relationship" placeholder="e.g. Son" value={formData.relationship} onChange={handleChange} />
                  {errors.relationship && <ErrorMessage>{errors.relationship}</ErrorMessage>}
                </Col05>
                <Col05>
                  <Label>ID Type</Label>
                  <Select name="id_type" value={formData.id_type} onChange={handleChange}>
                    <option>National ID</option>
                    <option>Passport</option>
                  </Select>
                </Col05>
                <Col>
                  <InputFieldWrapper>
                    <div style={{ width: '100%' }}>
                      <Label>ID Number</Label>
                      <Input name="id_number" placeholder="7–9 digits" value={formData.id_number} onChange={handleChange} />
                      {errors.id_number && <ErrorMessage>{errors.id_number}</ErrorMessage>}
                    </div>
                    {/^\d{7,9}$/.test(formData.id_number.trim()) && (
                      <TickIconWrapper>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5 5L20 6.5" /></svg>
                      </TickIconWrapper>
                    )}
                  </InputFieldWrapper>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Label>Telephone (Primary)</Label>
                  <Input name="tel_number" placeholder="e.g. +254712345678" value={formData.tel_number} onChange={handleChange} />
                  {errors.tel_number && <ErrorMessage>{errors.tel_number}</ErrorMessage>}
                </Col>
                <Col>
                  <Label>Telephone (Alternative)</Label>
                  <Input name="alternative_phone" placeholder="Optional" value={formData.alternative_phone} onChange={handleChange} />
                  {errors.alternative_phone && <ErrorMessage>{errors.alternative_phone}</ErrorMessage>}
                </Col>
              </Row>
            </Section>

            {/* ── 03 Transfer ── */}
            <Section>
              <SectionHead><SectionNum>03</SectionNum><SectionTitle>Transfer & Receiving</SectionTitle></SectionHead>
              <Row>
                <Col>
                  <Label>Received From</Label>
                  <Input name="received_from" placeholder="Hospital / home / morgue name" value={formData.received_from} onChange={handleChange} />
                  {errors.received_from && <ErrorMessage>{errors.received_from}</ErrorMessage>}
                </Col>
                <Col>
                  <Label>Receiving Officer</Label>
                  <Input name="receiving_officer" placeholder="Officer on duty" value={formData.receiving_officer} onChange={handleChange} />
                  {errors.receiving_officer && <ErrorMessage>{errors.receiving_officer}</ErrorMessage>}
                </Col>
                <Col05>
                  <Label>Permit No.</Label>
                  <Input name="permit_number" placeholder="If applicable" value={formData.permit_number} onChange={handleChange} />
                </Col05>
              </Row>
            </Section>

            {/* ── 04 Signature ── */}
            <Section>
              <SectionHead><SectionNum>04</SectionNum><SectionTitle>Signature & Verification</SectionTitle></SectionHead>
              <SignOffContainer>
                <SignOffGrid>
                  <GridSig>
                    <Label>Next-of-Kin Signature</Label>
                    <SigCanvasWrap>
                      <ReusableSignaturePad ref={sigPadRef1} />
                      <SigGuideText>Sign here</SigGuideText>
                    </SigCanvasWrap>
                    {errors.signature && <ErrorMessage>{errors.signature}</ErrorMessage>}
                  </GridSig>
                  <GridRight>
                    <GridName>
                      <Label>Signed Name</Label>
                      <Input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Type full name" />
                    </GridName>
                    <GridDate>
                      <Label>Date Signed</Label>
                      <Input type="date" value={formData.date_admitted} readOnly />
                    </GridDate>
                    <StampWrapper>
                      <OfficialStamp />
                    </StampWrapper>
                  </GridRight>
                </SignOffGrid>
              </SignOffContainer>
            </Section>

            {/* ── Confirmation gate ── */}
            <ConfirmBlock ref={confirmBlockRef} $checked={formData.confirm_accepted}>
              <ConfirmLabel>
                <ConfirmBox type="checkbox" name="confirm_accepted" checked={formData.confirm_accepted} onChange={handleChange} />
                <ConfirmText>
                  I confirm that the details recorded on this intake sheet are accurate, and that the
                  deceased was received into our care in the condition described above.
                </ConfirmText>
                <ConfirmTextShort>I confirm the details above are accurate.</ConfirmTextShort>
              </ConfirmLabel>
              <ConfirmHint>
                This sheet is the official custody record. It is countersigned by the mortuary supervisor at handover.
              </ConfirmHint>
              {errors.confirm_accepted && <ConfirmError>{errors.confirm_accepted}</ConfirmError>}
            </ConfirmBlock>

            {/* ── Actions ── */}
            <ActionsContainer>
              <div style={{ position: 'relative' }}>
                <PauseButton type="button" onClick={() => setIsPauseDropdownOpen(o => !o)}>
                  Paused Sessions ({pausedDrafts.length})
                </PauseButton>
                {isPauseDropdownOpen && (
                  <DropdownPanel>
                    {pausedDrafts.length === 0 && (
                      <DropdownRow><DraftName>No paused drafts</DraftName></DropdownRow>
                    )}
                    {pausedDrafts.map(d => (
                      <DropdownRow key={d.draftId}>
                        <DraftInfo>
                          <DraftName>{d.formData?.full_name || 'Unnamed draft'}</DraftName>
                          <DraftMeta>{new Date(d.savedAt).toLocaleString()}</DraftMeta>
                        </DraftInfo>
                        <DraftActions>
                          <DraftBtn onClick={() => resumeDraft(d)}>Resume</DraftBtn>
                          <DraftBtn className="delete" onClick={() => deleteDraft(d.draftId)}>Delete</DraftBtn>
                        </DraftActions>
                      </DropdownRow>
                    ))}
                  </DropdownPanel>
                )}
              </div>
              <PrimaryButton
                type="button"
                $locked={!formData.confirm_accepted}
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Filing…' : (formData.confirm_accepted ? 'File Intake Record' : 'I Confirm & Continue')}
              </PrimaryButton>
            </ActionsContainer>
          </FormBody>

          <RecordInfoStrip>
            Register No. {admissionId || 'PENDING'} · Official Mortuary Intake Record · Retain in Facility Register for 7 Years
          </RecordInfoStrip>

          <ElegantFooter>
            <FooterTagline>Received with dignity. Cared for with respect. Remembered with love.</FooterTagline>
            <FooterValues>
              <FooterValueLabel>Dignity</FooterValueLabel>
              <FooterValueLabel>Care</FooterValueLabel>
              <FooterValueLabel>Respect</FooterValueLabel>
            </FooterValues>
            <FooterBar>
              <span>© {new Date().getFullYear()} RestPoint Funeral Management</span>
              <span>Official Mortuary Intake Record</span>
            </FooterBar>
          </ElegantFooter>

        </ContentWrapper>
      </FormSheet>

      {showSuccess && vigilData && (
        <InOurCare
          name={vigilData.name}
          passed={vigilData.passed}
          reference={vigilData.reference}
          onClose={() => { setShowSuccess(false); navigate('/receptionist'); }}
        />
      )}
    </Container>
  );
};

export default DeceasedRegistrationForm;