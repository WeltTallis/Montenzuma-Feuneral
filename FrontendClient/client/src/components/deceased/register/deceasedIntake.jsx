import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import { getTenantSlug as getStoredTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { useTenantStore } from '../../../modules/seo/useTenantStore';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ENDPOINTS } from '../../../api/endpoints';
import OfficialStamp from '../../../utils/stamp/stamp';
import env from '../../../utils/config/env';
import notify from '../../../utils/notify';
import bwipjs from '@bwip-js/browser';
import axios from 'axios';
import api from '../../../api/axios';
import InOurCare from '../../common/InOurCare';

import {
  Check, Loader2, CheckCircle, X, FileText, User, RotateCcw, ShieldCheck,
  AlertCircle, ArrowRight, Calendar, Clock, Phone, IdCard, MapPin, Pause, PlusCircle
} from '../../../utils/icons/icons';

// ─── IndexedDB Helper Utilities ─────────────────────────────
const DB_NAME = 'MortuaryIntakeDB';
const DB_VERSION = 2; // Upgraded to handle new queue store
const DRAFT_STORE = 'pendingRegistrations';
const QUEUE_STORE = 'offlineQueue';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'draftId' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'syncId' });
      }
    };
  });
};

const saveDraftToDB = async (draft) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, 'readwrite');
    const store = tx.objectStore(DRAFT_STORE);
    const request = store.put(draft);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

const getAllDraftsFromDB = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, 'readonly');
    const store = tx.objectStore(DRAFT_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const deleteDraftFromDB = async (draftId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, 'readwrite');
    const store = tx.objectStore(DRAFT_STORE);
    const request = store.delete(draftId);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

const saveToOfflineQueue = async (item) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.put(item);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

const getAllFromQueue = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const deleteFromQueue = async (syncId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    const request = store.delete(syncId);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};
// ─── End IndexedDB Helpers ─────────────────────────────────


// ─── Color Palette ──
const COLORS = {
  ink: '#1A1A1A',
  bone: '#FAF8F4',
  bone2: '#FFFFFF',
  brass: '#6B4045',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  line: '#E2DDD3',
  gray: '#6B6862',
  muted: '#999999',
  red: '#9B4A3F',
  white: '#FFFFFF',
  inkBlue: '#0f33e7',
  gold: '#C9A227',
  goldDark: '#A8851C',
  tickBlue: '#2564eb1b',
};

/* ─── Sheet gutters ────────────────────────────────────────────────────────
   Single source of truth for the horizontal padding of the sheet. The header
   (branding on the left, barcode on the right) and the form body MUST use the
   same values at the same breakpoints, otherwise the top content drifts out of
   line with the form's field labels — e.g. a 1280px laptop at 125% Windows
   scaling reports a 1024px viewport, which used to shrink the body padding to
   2.5rem while the header stayed at 3rem. */
const GUTTER = '3rem';          // > 1024px
const GUTTER_TABLET = '2.5rem'; // ≤ 1024px  (matches FormBody)
const GUTTER_MOBILE = '1.5rem'; // ≤ 600px   (matches FormBody)

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideText = keyframes`
  0%, 20%   { transform: translateY(0); }
  25%, 45%  { transform: translateY(-32px); }
  50%, 70%  { transform: translateY(-64px); }
  75%, 95%  { transform: translateY(-96px); }
  100%      { transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.white};
  font-family: 'Saira', sans-serif;
  color: ${COLORS.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const FormSheet = styled.div`
  width: 100%;
  max-width: 2200px;
  margin: 0 auto;
  background: ${COLORS.white};
  border-radius: 0;
  box-shadow: none;
  border: none;
  overflow: hidden;
  position: relative;
`;

const Watermark = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-35deg);
  font-size: 8rem;
  font-weight: 800;
  color: rgba(21, 23, 26, 0.015);
  font-family: 'Fraunces', serif;
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const HeaderWrapper = styled.header`
  /* Side padding = the sheet gutter, so the branding (left) and the barcode +
     verification block (right) sit on exactly the same vertical guides as the
     form's field labels (see FormBody). */
  padding: 2.5rem ${GUTTER};
  position: relative;
  z-index: 1;
  background: transparent;

  /* Breakpoints mirror FormBody exactly so the header can never drift out of
     line with the labels on tablet / small-laptop widths. */
  @media (max-width: 1024px) {
    padding: 2.25rem ${GUTTER_TABLET};
  }

  @media (max-width: 768px) {
    padding: 2rem ${GUTTER_TABLET};
  }

  @media (max-width: 600px) {
    padding: 1.5rem ${GUTTER_MOBILE};
  }
`;

const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2.5rem;
  }
`;

const ColLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1.2;
  min-width: 0;
`;

const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const GreetingWelcome = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${COLORS.muted};
`;

const TextSlider = styled.div`
  height: 32px;
  overflow: hidden;
  position: relative;
`;

const TextTrack = styled.div`
  animation: ${slideText} 16s infinite cubic-bezier(0.65, 0.05, 0.36, 1);
`;

const Phrase = styled.div`
  height: 32px;
  display: flex;
  align-items: center;
  font-family: 'Saira', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${COLORS.ink};
  line-height: 1.2;
  letter-spacing: -0.01em;
  white-space: nowrap;
`;

const GreetingTime = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${COLORS.brass};
  margin-top: 0.2rem;
`;

const FacilityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.25rem;
  display: block;
`;

const ContactItem = styled.div`
  font-size: 0.85rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  svg {
    width: 15px;
    height: 15px;
    color: ${COLORS.brass};
    flex-shrink: 0;
    stroke-width: 1.5;
  }
`;

const ColRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  text-align: right;
  gap: 2rem;
  flex: 1;

  @media (max-width: 768px) {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DateLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.muted};
`;

const DateValue = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${COLORS.ink};
  letter-spacing: 0.02em;
`;

const VerificationBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;

const AdmissionNumber = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${COLORS.inkBlue};
  letter-spacing: 0.02em;
`;

const DeceasedName = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${COLORS.ink};
  line-height: 1.2;
  max-width: 200px;
  margin-top: 0.2rem;
`;

const FormBody = styled.div`
  /* Field labels hang off this gutter — keep it in sync with HeaderWrapper
     and RecordInfoStrip via GUTTER / GUTTER_TABLET / GUTTER_MOBILE. */
  padding: 3rem ${GUTTER} 1.5rem ${GUTTER};

  @media (max-width: 1024px) {
    padding: 2.5rem ${GUTTER_TABLET};
  }
  @media (max-width: 600px) {
    padding: 1.5rem ${GUTTER_MOBILE};
  }
`;

const Section = styled.div`
  margin-bottom: 4rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.75rem 1.25rem;
  background: ${COLORS.ink}; 
  border-radius: 4px;
`;

const SectionNum = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250,248,244,0.4);
  font-family: 'JetBrains Mono', monospace;
`;

const SectionTitle = styled.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.bone};
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
  }
`;

const Col = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 1 1 45%;
    min-width: 200px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const Col2 = styled(Col)` flex: 2; @media (max-width: 1024px) { flex: 1 1 100%; } `;
const Col05 = styled(Col)` flex: 0.5; @media (max-width: 1024px) { flex: 1 1 30%; min-width: 120px; } `;

const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.5rem;
  font-family: 'Saira', sans-serif;
`;

const InputFieldWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${COLORS.ink};
  }

  &:disabled {
    background: transparent;
    color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.8;
  }

  &::placeholder { color: #a8a29e;  font-weight: 400; }
`;

const InputLg = styled(Input)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${COLORS.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    border: none;
    border-bottom: 1px solid ${COLORS.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${COLORS.ink};
  }
`;

const TickIconWrapper = styled.div`
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.tickBlue};
  pointer-events: none;
`;

const ErrorMessage = styled.span`
  color: ${COLORS.red};
  font-size: 0.75rem;
  margin-top: 0.3rem;
  display: block;
  font-family: 'Saira', sans-serif;
`;

const SigCanvasWrap = styled.div`
  border-bottom: 2px solid ${COLORS.ink};
  border-radius: 4px 4px 0 0;
  height: 14rem; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.bone};
  cursor: crosshair;
  position: relative;
  margin-bottom: 0.5rem;
  overflow: hidden;
  width: 100%;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  & > canvas {
    width: 100% !important;
    height: 100% !important;
    touch-action: none;
  }

  @media (max-width: 1024px) {
    height: 14rem; 
  }
  @media (max-width: 768px) {
    height: 18rem; 
  }
`;

const SigGuideText = styled.div`
  position: absolute;
  bottom: 10px;
  left: 15px;
  font-family: 'Alex Brush', cursive;
  font-size: 1.2rem;
  color: ${COLORS.gray};
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`;

const SignOffContainer = styled.div`
  position: relative;
  margin-top: 2.5rem;
`;

const SignOffGrid = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1.5fr;
  gap: 3rem;
  align-items: end;
  grid-template-areas: "sig right";

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "sig"
      "right";
    gap: 2.5rem;
  }
`;

const GridSig = styled.div` grid-area: sig; min-width: 0; `;

const GridRight = styled.div`
  grid-area: right;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative; 
  padding-bottom: 1.5rem;
`;

const GridName = styled.div` min-width: 0; position: relative; z-index: 1; `;
const GridDate = styled.div` min-width: 0; position: relative; z-index: 1; `;

const StampWrapper = styled.div`
  position: absolute;
  bottom: 25px;
  right: -15px;
  width: 240px;
  pointer-events: none;
  transform: rotate(-12deg);
  opacity: 0.92;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  z-index: 10;

  @media (max-width: 1024px) {
    position: relative;
    bottom: auto;
    right: auto;
    margin: 1rem auto 0;
    transform: rotate(-6deg) scale(0.9);
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid ${COLORS.line};
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  /* ── Tablet (601px – 1024px): two buttons per row ────────────────────
     Each action button occupies 50% of the row (minus half the gap), so
     TWO buttons fill 100% of the width instead of all four being squeezed
     onto a single line. Combined with flex-wrap this gives a tidy 2 × 2
     grid; the small slack in the basis keeps rounding from ever pushing a
     button onto a row of its own. Smaller horizontal padding gives every
     half-width label (e.g. "Paused Sessions (2)") room to breathe. */
  @media (min-width: 601px) and (max-width: 1024px) {
    justify-content: flex-start;
    gap: 0.75rem;

    > * {
      flex: 1 1 calc(50% - 0.5rem);
      min-width: 0;
    }

    /* The Pause control is wrapped in a plain <div> (position: relative so
       its dropdown anchors correctly) — stretch it to fill its 50% slot. */
    > div > button,
    > button {
      width: 100%;
      padding: 1rem 1.25rem;
    }
  }
`;

const PrimaryButton = styled.button`
  background: #722F37;
  color: ${COLORS.bone};
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  &:hover {
    background: #5C242B;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(114, 47, 55, 0.25);
  }

  &:disabled {
    background: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const GoldButton = styled.button`
  background: #1A2A27;
  color: ${COLORS.bone};
  border: 1px solid #1A2A27;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(26, 42, 39, 0.25);

  &:hover {
    background: #24352F;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(26, 42, 39, 0.35);
    color: ${COLORS.white};
  }

  &:disabled {
    background: ${COLORS.gray};
    color: ${COLORS.bone};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const BlackButton = styled.button`
  background: #1A2A27;
  color: ${COLORS.bone};
  border: 1px solid #1A2A27;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(26, 42, 39, 0.2);

  &:hover {
    background: #24352F;
    border-color: #24352F;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(26, 42, 39, 0.35);
  }

  &:disabled {
    background: ${COLORS.gray};
    border-color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const PauseButton = styled.button`
  background: ${COLORS.ink}; /* Black background */
  color: ${COLORS.bone};
  border: 1px solid ${COLORS.ink};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  position: relative;

  &:hover {
    background: #333;
    border-color: #333;
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${COLORS.gray};
    border-color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const DropdownPanel = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: ${COLORS.white};
  border: 1px solid ${COLORS.line};
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  z-index: 100;
  overflow: hidden;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  background: #f8f6f1;
  border: none;
  border-bottom: 1px solid ${COLORS.line};
  padding: 1rem;
  text-align: left;
  font-family: 'Saira', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.brass};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #efeade;
  }
`;

const DropdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${COLORS.line};

  &:last-child {
    border-bottom: none;
  }
`;

const DraftInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DraftName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${COLORS.ink};
`;

const DraftMeta = styled.span`
  font-size: 0.7rem;
  color: ${COLORS.muted};
  font-family: 'JetBrains Mono', monospace;
`;

const DraftActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DraftBtn = styled.button`
  background: transparent;
  border: 1px solid ${COLORS.brass};
  color: ${COLORS.brass};
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  transition: all 0.2s;

  &:hover {
    background: ${COLORS.brass};
    color: ${COLORS.bone};
  }

  &.delete {
    border-color: ${COLORS.red};
    color: ${COLORS.red};
    &:hover {
      background: ${COLORS.red};
      color: ${COLORS.bone};
    }
  }
`;

const ClearSigButton = styled.button`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  background: none;
  border: none;
  padding: 0.25rem 0;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Saira', sans-serif;

  &:hover {
    color: ${COLORS.red};
  }
`;

/* ─── Woodland Elegance Footer ─────────────────────────────── */
const ElegantFooter = styled.footer`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Karla:wght@400;500;700&display=swap');

  position: relative;
  width: 100%;
  overflow: hidden;
  background: #1A2A27;
  color: #E9EBDD;
  text-align: center;
  padding: 56px 20px 0;
  border-top: none;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -260px;
    transform: translateX(-50%);
    width: 520px;
    height: 520px;
    border-radius: 50%;
    border: 1.5px solid rgba(233, 235, 221, 0.1);
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -320px;
    transform: translateX(-50%);
    width: 680px;
    height: 680px;
    border-radius: 50%;
    border: 1px solid rgba(233, 235, 221, 0.06);
    pointer-events: none;
  }

  @media (max-width: 560px) {
    padding: 44px 20px 0;
  }
`;

const LeafMark = styled.div`
  width: 44px;
  height: 44px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(237, 233, 219, 0.12);
  border: 1px solid rgba(237, 233, 219, 0.25);
  display: grid;
  place-items: center;
`;

const FooterTagline = styled.p`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.5;
  color: rgba(237, 233, 219, 0.82);
  max-width: 44ch;
  margin: 0 auto;
`;

const FooterValues = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 30px auto 0;
  max-width: 420px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(237, 233, 219, 0.16);
  }
`;

const FooterValueLabel = styled.span`
  font-family: 'Karla', 'Segoe UI', sans-serif;
  font-weight: 700;
  font-size: 0.64rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(205, 209, 191, 0.55);
`;

const FooterValueDot = styled.b`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 1rem;
  color: rgba(205, 209, 191, 0.85);
`;

const FooterBar = styled.div`
  margin-top: 44px;
  border-top: 1px solid rgba(237, 233, 219, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 18px 32px;
  font-family: 'Karla', 'Segoe UI', sans-serif;
  font-weight: 500;
  font-size: 0.76rem;
  color: rgba(237, 233, 219, 0.42);

  @media (max-width: 560px) {
    flex-direction: column;
    gap: 6px;
    padding: 16px 20px;
    text-align: center;
  }
`;

const RecordInfoStrip = styled.div`
  font-size: 0.65rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  line-height: 1.7;
  margin: 2rem ${GUTTER} 0;
  padding: 0.9rem 1rem 0.4rem;
  border-top: 1px solid ${COLORS.line};

  @media (max-width: 1024px) {
    margin: 1.75rem ${GUTTER_TABLET} 0;
  }
  @media (max-width: 600px) {
    margin: 1.5rem ${GUTTER_MOBILE} 0;
  }
`;

const PinIcon = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.497 6.503l.001-.003-.004.005L3.5 15.901l11.112 1.489 1.487 11.11 9.396-21.992.005-.006z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-140.000000, -7319.000000)">
      <g transform="translate(56.000000, 160.000000)">
        <path d="M94,7167 L94,7169 L96,7169 C96,7167.895 95.105,7167 94,7167 M94,7163 L94,7165 C96.206,7165 98,7166.794 98,7169 L100,7169 C100,7165.686 97.314,7163 94,7163 M94,7159 L94,7161 C98.411,7161 102,7164.589 102,7169 L104,7169 C104,7163.477 99.523,7159 94,7159 M98.652,7177.234 C98.641,7177.265 98.64,7177.27 98.652,7177.234 M98.117,7174.578 C97.422,7174.204 96.719,7173.778 95.992,7173.481 C94.587,7172.908 94.682,7174.602 93.679,7175.151 C93.027,7175.508 92.107,7174.861 91.538,7174.503 C90.544,7173.877 89.663,7173.053 88.931,7172.1 C88.556,7171.613 87.728,7170.697 87.83,7170.014 C87.992,7168.93 89.274,7168.876 88.907,7167.55 C88.711,7166.84 88.36,7166.141 88.097,7165.457 C87.745,7164.54 87.6,7163.953 86.573,7164.003 C85.831,7164.039 85.339,7164.356 84.883,7164.951 C83.649,7166.558 83.835,7168.725 84.664,7170.488 C85.838,7172.983 87.85,7175.335 89.999,7176.855 C91.461,7177.889 93.387,7178.828 95.157,7178.987 C96.453,7179.104 98.266,7178.403 98.73,7176.996 C98.698,7177.094 98.667,7177.189 98.652,7177.234 C98.663,7177.199 98.687,7177.128 98.73,7176.996 C98.777,7176.854 98.8,7176.783 98.811,7176.751 C98.797,7176.793 98.765,7176.891 98.731,7176.993 C99.139,7175.753 99.189,7175.155 98.117,7174.578 M98.811,7176.751 C98.819,7176.727 98.819,7176.725 98.811,7176.751" />
      </g>
    </g>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 -3.5 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-414.000000, -261.000000)">
      <path d="M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z" />
    </g>
  </svg>
);

const formatHeaderDate = (value) => {
  if (!value) return '—';
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const Barcode = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const text = value || 'AWAITING-ID';
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: text,
          scale: 2,
          height: 8,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value]);

  // Flush against the right sheet gutter so the barcode ends on exactly the
  // same vertical guide as the right edge of the form's last field column.
  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: 'auto', maxWidth: '100%', height: '40px', marginLeft: 'auto' }}
    />
  );
};

const DeceasedRegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { slug: urlTenantSlug } = useParams();
  const { tenantData } = useTenantStore();

  const getTenantSlug = () => {
    const exact = urlTenantSlug && urlTenantSlug !== 'default' && urlTenantSlug !== 'dashboard'
      && urlTenantSlug !== 'undefined' && urlTenantSlug !== 'null'
      ? urlTenantSlug : '';
    return exact || getStoredTenantSlug() || '';
  };

  const sigPadRef1 = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingAdmission, setLoadingAdmission] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [vigilData, setVigilData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admissionId, setAdmissionId] = useState('');
  const [signedSignature, setSignedSignature] = useState('');
  const [lastSignedName, setLastSignedName] = useState('');

  // State for Pause Dropdown & Offline Drafts
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [pausedDrafts, setPausedDrafts] = useState([]);
  const [isPauseDropdownOpen, setIsPauseDropdownOpen] = useState(false);

  const branding = useMemo(() => resolveTenantBranding(tenantData), [tenantData]);

  const {
    name: tenantName,
    displayPhone,
    displayEmail,
    displayLocation,
    tenantCountry,
    displayBranch,
    displayAddress,
    tenantLogoUrl,
    fallback
  } = branding;

  const getLoggedInUserEmail = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.email || user.userEmail || '';
    } catch {
      return '';
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getGreetingTime = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const initialFormData = {
    admission_number: location.state?.permitNumber || '',
    date_admitted: new Date().toISOString().split('T')[0],
    time_received: getCurrentTime(),
    full_name: '',
    gender: '',
    age: '',
    date_of_death: '',
    cause_of_death: '',
    body_status: '',
    place_of_death: '',
    contact_person: '',
    id_number: '',
    id_type: 'National ID',
    tel_number: '',
    alternative_phone: '',
    received_from: '',
    receiving_officer: '',
    signature: '',
    verified_by: getLoggedInUserEmail(),
    permit_number: '',
    relationship: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchPausedDrafts = async () => {
    try {
      const drafts = await getAllDraftsFromDB();
      setPausedDrafts(drafts);
    } catch (error) {
      console.error('Failed to fetch paused drafts:', error);
    }
  };

  // Offline sync logic
  const syncOfflineData = async () => {
    try {
      const queue = await getAllFromQueue();
      if (queue.length === 0) return;
      
      notify.info('Syncing Data', `Uploading ${queue.length} offline records...`);
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();

      for (const item of queue) {
        try {
          const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.CREATE}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug,
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(item.payload),
          });
          
          if (response.ok) {
            await deleteFromQueue(item.syncId);
          }
        } catch (e) { 
          // Silently fail, will retry next time
        }
      }
      notify.success('Sync Complete', 'Offline records uploaded successfully.');
    } catch(e) { console.error(e) }
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, time_received: getCurrentTime() }));
    fetchPausedDrafts();
    syncOfflineData(); // Attempt sync on mount

    const handleOnline = () => syncOfflineData();
    window.addEventListener('online', handleOnline);
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!formData.gender) return;

    const fetchAdmissionNumber = async () => {
      setLoadingAdmission(true);
      try {
        const response = await api.get(
          `${env.FULL_API_URL}${ENDPOINTS.DECEASED.ADMISSION_NUMBER(formData.gender)}`
        );

        const result = response.data;
        if (result?.success && result?.data?.admission_number) {
          setAdmissionId(result.data.admission_number);
        }
      } catch (error) {
        console.error('Failed to fetch admission number:', error);
      } finally {
        setLoadingAdmission(false);
      }
    };

    fetchAdmissionNumber();
  }, [formData.gender]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message.text) setMessage({ type: '', text: '' });

    if (name === 'full_name' && lastSignedName && value !== lastSignedName) {
      setLastSignedName('');
      setSignedSignature('');
      try { sigPadRef1.current?.clear(); } catch { /* ignore */ }
    }
  };

  const isValidPhone = (p) => {
    return /^(?:0[17]\d{8}|\+254[17]\d{8})$/.test(String(p || '').replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_admitted) newErrors.date_admitted = 'Date admitted is required';
    if (!formData.received_from.trim()) newErrors.received_from = 'Received from is required';
    if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person name is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
    if (!/^\d{7,9}$/.test(formData.id_number.trim())) newErrors.id_number = 'Enter a valid National ID number (7-9 digits)';
    if (!formData.tel_number.trim()) {
      newErrors.tel_number = 'Telephone number is required';
    } else if (!isValidPhone(formData.tel_number)) {
      newErrors.tel_number = 'Please enter a valid telephone number';
    }
    if (formData.alternative_phone && !isValidPhone(formData.alternative_phone)) {
      newErrors.alternative_phone = 'Please enter a valid alternative phone number';
    }

    if (!formData.receiving_officer.trim()) newErrors.receiving_officer = 'Receiving officer name is required';

    if (sigPadRef1.current?.isEmpty()) {
      newErrors.signature = 'Signature is required to proceed';
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const missingFields = Object.values(validationErrors);
      notify.info('Missing required details', `Please complete the following: ${missingFields.join(', ')}`);
      setMessage({
        type: 'error',
        text: `Please complete all required fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const freshTime = getCurrentTime();
    const signatureData = sigPadRef1.current?.toDataURL();

    const payload = {
      full_name: formData.full_name,
      cause_of_death: formData.cause_of_death,
      national_id: formData.id_number,
      received_from: formData.received_from,
      age: formData.age ? parseInt(formData.age, 10) : 0,
      time_received: freshTime,
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

    // --- OFFLINE DETECTION ---
    if (!navigator.onLine) {
      try {
        const syncId = `sync-${Date.now()}`;
        await saveToOfflineQueue({ syncId, payload, savedAt: new Date().toISOString() });
        
        notify.success('Saved Offline', 'No internet. Record saved locally. Will sync automatically when back online.');
        
        setRegisteredName(formData.full_name);
        setVigilData({
          name: formData.full_name,
          passed: formData.date_of_death,
          reference: 'PENDING SYNC',
        });
        setShowSuccess(true);

        // If this was a resumed draft, delete it from paused drafts
        if (currentDraftId) {
          await deleteDraftFromDB(currentDraftId);
          setCurrentDraftId(null);
          fetchPausedDrafts();
        }

        setFormData({
          ...initialFormData,
          verified_by: getLoggedInUserEmail(),
          time_received: getCurrentTime(),
          date_admitted: new Date().toISOString().split('T')[0],
        });
        setAdmissionId('');
        sigPadRef1.current?.clear();
        setErrors({});
      } catch (error) {
        notify.error('Offline Save Failed', 'Could not save the record locally.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // --- ONLINE SUBMISSION ---
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();

      const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.DECEASED.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // Delete draft if it was resumed
      if (currentDraftId) {
        await deleteDraftFromDB(currentDraftId);
        setCurrentDraftId(null);
        fetchPausedDrafts();
      }

      setRegisteredName(formData.full_name);
      setLastSignedName(formData.full_name);
      setVigilData({
        name: formData.full_name,
        passed: formData.date_of_death,
        reference: admissionId || (result?.data?.admission_number ?? ''),
      });
      setShowSuccess(true);

      setFormData({
        ...initialFormData,
        verified_by: getLoggedInUserEmail(),
        time_received: getCurrentTime(),
        date_admitted: new Date().toISOString().split('T')[0],
      });
      setAdmissionId('');
      sigPadRef1.current?.clear();
      setErrors({});

    } catch (error) {
      notify.error('Registration failed', error.message || 'Please check the details and try again.');
      setMessage({
        type: 'error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PAUSE SESSION LOGIC ---
  const handlePauseSession = async () => {
    try {
      const draftId = currentDraftId || `draft-${Date.now()}`;
      const signatureData = sigPadRef1.current?.toDataURL() || '';
      
      const draft = {
        draftId,
        formData,
        admissionId,
        signatureData,
        pausedAt: new Date().toISOString()
      };

      await saveDraftToDB(draft);
      notify.success('Session Paused', 'You can resume this registration later.');
      
      handleClear();
      setCurrentDraftId(null);
      setIsPauseDropdownOpen(false);
      fetchPausedDrafts();
    } catch (error) {
      console.error('Failed to pause session:', error);
      notify.error('Failed to pause', 'Could not save the session to the browser.');
    }
  };

  const handleResumeDraft = (draft) => {
    setFormData(draft.formData);
    setAdmissionId(draft.admissionId);
    setCurrentDraftId(draft.draftId);
    setIsPauseDropdownOpen(false);
    
    // Wait for component to re-render with new data, then load signature
    setTimeout(() => {
      try {
        if (draft.signatureData && sigPadRef1.current) {
          sigPadRef1.current.clear();
          if (typeof sigPadRef1.current.fromDataURL === 'function') {
            sigPadRef1.current.fromDataURL(draft.signatureData);
          }
        }
      } catch (e) { 
        console.error("Failed to load signature", e); 
      }
    }, 100);
    
    notify.info('Resuming Session', `Loaded paused registration for ${draft.formData.full_name || 'Unknown'}.`);
  };

  const handleDeleteDraft = async (draftId) => {
    try {
      await deleteDraftFromDB(draftId);
      if (currentDraftId === draftId) {
        handleClear();
        setCurrentDraftId(null);
      }
      fetchPausedDrafts();
      notify.success('Draft Deleted', 'The paused session has been removed.');
    } catch (error) {
      notify.error('Delete Failed', 'Could not delete the draft.');
    }
  };

  const handleClear = () => {
    setFormData({
      ...initialFormData,
      verified_by: getLoggedInUserEmail(),
      time_received: getCurrentTime(),
      date_admitted: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setMessage({ type: '', text: '' });
    setAdmissionId('');
    setSignedSignature('');
    setLastSignedName('');
    sigPadRef1.current?.clear();
  };

  const hasValue = (val) => val !== undefined && val !== null && String(val).trim().length > 0;

  if (loading && !showSuccess) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={COLORS.ink} className="animate-spin" />
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: COLORS.gray, fontFamily: 'Saira', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Processing Document...</p>
        </div>
      </Container>
    );
  }

  if (showSuccess) {
    return (
      <InOurCare
        mode="intake"
        name={vigilData?.name || registeredName}
        passed={vigilData?.passed}
        reference={vigilData?.reference}
        onDone={() => {
          const slug = (typeof getTenantSlug === 'function' && getTenantSlug()) || localStorage.getItem('tenantSlug') || '';
          navigate(slug ? `/tenant/${slug}/receptionist` : '/reception');
        }}
      />
    );
  }

  return (
    <Container>
      <FormSheet>
        <Watermark>OFFICIAL RECORD</Watermark>

        <ContentWrapper>
          <HeaderWrapper>
            <HeaderMain>
              <ColLeft>
                <GreetingBlock>
                  <GreetingWelcome>Welcome to</GreetingWelcome>
                  <TextSlider>
                    <TextTrack>
                      <Phrase>{tenantName}</Phrase>
                      <Phrase>Sorry for your loss</Phrase>
                      <Phrase>With deepest sympathy</Phrase>
                      <Phrase>May they rest in peace</Phrase>
                    </TextTrack>
                  </TextSlider>
                  <GreetingTime>{getGreetingTime()}</GreetingTime>
                </GreetingBlock>

                <FacilityInfo>
                  <SectionLabel>Facility Information</SectionLabel>
                  <ContactItem>
                    <PinIcon />
                    {displayAddress}
                  </ContactItem>
                  <ContactItem>
                    <MailIcon />
                    {displayEmail}
                  </ContactItem>
                  <ContactItem>
                    <PhoneIcon />
                    {displayPhone}
                  </ContactItem>
                </FacilityInfo>
              </ColLeft>

              <ColRight>
                <DateDisplay>
                  <DateLabel>Record Date</DateLabel>
                  <DateValue>{formatHeaderDate(formData.date_admitted)}</DateValue>
                </DateDisplay>

                <VerificationBlock>
                  <AdmissionNumber>
                    {loadingAdmission ? 'Generating...' : (admissionId || 'AWAITING-ID')}
                  </AdmissionNumber>
                  <Barcode value={admissionId} />
                  <DeceasedName>{formData.full_name || '—'}</DeceasedName>
                </VerificationBlock>
              </ColRight>
            </HeaderMain>
          </HeaderWrapper>

          <FormBody>
            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1 */}
              <Section>
                <SectionHead>
                  <SectionNum>01</SectionNum>
                  <SectionTitle>Receiving & Facility Information</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Admission Number</Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="text"
                        name="admission_number"
                        value={admissionId || formData.admission_number}
                        placeholder="Auto-generated from gender"
                        readOnly
                        disabled
                      />
                      {hasValue(admissionId || formData.admission_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col2>
                  <Col>
                    <Label>Date Admitted <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <InputLg
                        type="date"
                        name="date_admitted"
                        value={formData.date_admitted}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_admitted) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.date_admitted && <ErrorMessage>{errors.date_admitted}</ErrorMessage>}
                  </Col>
                </Row>
              </Section>

              {/* Section 2 */}
              <Section>
                <SectionHead>
                  <SectionNum>02</SectionNum>
                  <SectionTitle>Deceased Information</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Full Name <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter full legal name"
                      />
                      {hasValue(formData.full_name) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.full_name && <ErrorMessage>{errors.full_name}</ErrorMessage>}
                  </Col2>
                  <Col>
                    <Label>Gender <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </Select>
                      {hasValue(formData.gender) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.gender && <ErrorMessage>{errors.gender}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col05>
                    <Label>Age</Label>
                    <InputFieldWrapper>
                      <Input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Years"
                      />
                      {hasValue(formData.age) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col05>
                  <Col>
                    <Label>Date of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="date"
                        name="date_of_death"
                        value={formData.date_of_death}
                        onChange={handleChange}
                      />
                      {hasValue(formData.date_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>Cause of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="cause_of_death"
                        value={formData.cause_of_death}
                        onChange={handleChange}
                        placeholder="As certified on medical document"
                      />
                      {hasValue(formData.cause_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Place of Death</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="place_of_death"
                        value={formData.place_of_death}
                        onChange={handleChange}
                        placeholder="Location/Hospital"
                      />
                      {hasValue(formData.place_of_death) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Body Status</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="body_status"
                        value={formData.body_status}
                        onChange={handleChange}
                        placeholder="e.g. Normal Condition, Decomposed, Autopsied"
                      />
                      {hasValue(formData.body_status) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                </Row>

                {/* MOVED: Permit Number & Received From */}
                <Row>
                  <Col>
                    <Label>Permit Number</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="permit_number"
                        value={formData.permit_number}
                        onChange={handleChange}
                        placeholder="Permit/Reference Number"
                      />
                      {hasValue(formData.permit_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
                  <Col>
                    <Label>Received From <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="received_from"
                        value={formData.received_from}
                        onChange={handleChange}
                        placeholder="Hospital, Home, Police, Other"
                      />
                      {hasValue(formData.received_from) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.received_from && <ErrorMessage>{errors.received_from}</ErrorMessage>}
                  </Col>
                </Row>
              </Section>

              {/* Section 3 */}
              <Section>
                <SectionHead>
                  <SectionNum>03</SectionNum>
                  <SectionTitle>Next of Kin / Contact Details</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Contact Person Name</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        placeholder="Full name of primary contact"
                      />
                      {hasValue(formData.contact_person) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.contact_person && <ErrorMessage>{errors.contact_person}</ErrorMessage>}
                  </Col2>
                  <Col>
                    <Label>Relationship</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        placeholder="e.g. Spouse, Child, Sibling"
                      />
                      {hasValue(formData.relationship) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.relationship && <ErrorMessage>{errors.relationship}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>National ID Number</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="National ID number"
                      />
                      {hasValue(formData.id_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.id_number && <ErrorMessage>{errors.id_number}</ErrorMessage>}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Label>Primary Telephone</Label>
                    <InputFieldWrapper>
                      <Input
                        type="tel"
                        name="tel_number"
                        value={formData.tel_number}
                        onChange={handleChange}
                        placeholder="e.g., 0712345678"
                      />
                      {hasValue(formData.tel_number) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.tel_number && <ErrorMessage>{errors.tel_number}</ErrorMessage>}
                  </Col>
                  <Col>
                    <Label>Alternative Phone</Label>
                    <InputFieldWrapper>
                      <Input
                        type="tel"
                        name="alternative_phone"
                        value={formData.alternative_phone}
                        onChange={handleChange}
                        placeholder="Secondary contact number"
                      />
                      {hasValue(formData.alternative_phone) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.alternative_phone && <ErrorMessage>{errors.alternative_phone}</ErrorMessage>}
                  </Col>
                </Row>
              </Section>

              {/* Section 4 */}
              <Section>
                <SectionHead>
                  <SectionNum>04</SectionNum>
                  <SectionTitle>Verification & Digital Sign-off</SectionTitle>
                </SectionHead>

                <SignOffContainer>
                  <SignOffGrid>
                    <GridSig>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Label>Officer Digital Signature <span style={{ color: COLORS.red }}>*</span></Label>
                        <ClearSigButton type="button" onClick={() => sigPadRef1.current?.clear()}>
                          Clear Pad
                        </ClearSigButton>
                      </div>
                      <SigCanvasWrap>
                        <ReusableSignaturePad
                          ref={sigPadRef1}
                          penColor={COLORS.inkBlue}
                          onChange={(data) => setSignedSignature(data || '')}
                        />
                        <SigGuideText>Sign within boundaries</SigGuideText>
                      </SigCanvasWrap>
                      {errors.signature && <ErrorMessage>{errors.signature}</ErrorMessage>}
                    </GridSig>

                    <GridRight>
                      <GridName>
                        <Label>Receiving Officer <span style={{ color: COLORS.red }}>*</span></Label>
                        <InputFieldWrapper>
                          <Input
                            type="text"
                            name="receiving_officer"
                            value={formData.receiving_officer}
                            onChange={handleChange}
                            placeholder="Officer full name"
                          />
                          {hasValue(formData.receiving_officer) && (
                            <TickIconWrapper>
                              <Check size={16} strokeWidth={2.5} />
                            </TickIconWrapper>
                          )}
                        </InputFieldWrapper>
                        {errors.receiving_officer && <ErrorMessage>{errors.receiving_officer}</ErrorMessage>}
                      </GridName>

                      <StampWrapper>
                        <OfficialStamp />
                      </StampWrapper>
                    </GridRight>
                  </SignOffGrid>
                </SignOffContainer>
              </Section>

              {/* Action Buttons */}
              <ActionsContainer>
                {/* Pause Dropdown Wrapper */}
                <div style={{ position: 'relative' }}>
                  <PauseButton 
                    type="button" 
                    onClick={() => {
                      if (pausedDrafts.length > 0) {
                        setIsPauseDropdownOpen(!isPauseDropdownOpen);
                      } else {
                        handlePauseSession();
                      }
                    }} 
                    disabled={isSubmitting}
                  >
                    <Pause size={16} />
                    {pausedDrafts.length > 0 ? `Paused Sessions (${pausedDrafts.length})` : 'Pause & Save'}
                  </PauseButton>
                  
                  {isPauseDropdownOpen && pausedDrafts.length > 0 && (
                    <DropdownPanel>
                      <DropdownItem onClick={handlePauseSession}>
                        <PlusCircle size={14} /> Save Current Session
                      </DropdownItem>
                      {pausedDrafts.map(draft => (
                        <DropdownRow key={draft.draftId}>
                          <DraftInfo>
                            <DraftName>{draft.formData.full_name || 'Unknown Name'}</DraftName>
                            <DraftMeta>Paused: {new Date(draft.pausedAt).toLocaleTimeString()}</DraftMeta>
                          </DraftInfo>
                          <DraftActions>
                            <DraftBtn onClick={() => handleResumeDraft(draft)}>
                              <User size={12} /> Resume
                            </DraftBtn>
                            <DraftBtn className="delete" onClick={() => handleDeleteDraft(draft.draftId)}>
                              <X size={12} /> 
                            </DraftBtn>
                          </DraftActions>
                        </DropdownRow>
                      ))}
                    </DropdownPanel>
                  )}
                </div>

                <GoldButton type="button" onClick={handleClear} disabled={isSubmitting}>
                  Reset Inputs
                </GoldButton>

                <BlackButton type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Cancel / Back
                </BlackButton>

                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting Record...
                    </>
                  ) : (
                    <>
                      Submit Record <ArrowRight size={16} />
                    </>
                  )}
                </PrimaryButton>
              </ActionsContainer>
            </form>
          </FormBody>

          <RecordInfoStrip>
            {tenantName} — Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            <br />- Official Intake Record -
          </RecordInfoStrip>

          <ElegantFooter>
            <LeafMark>
              <svg viewBox="0 0 24 24" fill="none" stroke="#EDE9DB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="21" height="21">
                <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" />
                <path d="M4 20c4-6.5 8.5-10 13-12.5" />
              </svg>
            </LeafMark>

            <FooterTagline>Received with dignity. Cared for with respect. Remembered with love.</FooterTagline>

            <FooterValues>
              <FooterValueLabel>Dignity</FooterValueLabel><FooterValueDot>·</FooterValueDot>
              <FooterValueLabel>Care</FooterValueLabel><FooterValueDot>·</FooterValueDot>
              <FooterValueLabel>Respect</FooterValueLabel>
            </FooterValues>

            <FooterBar>
              <span>© {new Date().getFullYear()} {tenantName}</span>
              <span>Official Intake Record</span>
            </FooterBar>
          </ElegantFooter>
        </ContentWrapper>
      </FormSheet>
    </Container>
  );
};

export default DeceasedRegistrationForm;