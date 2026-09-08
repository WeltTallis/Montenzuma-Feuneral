import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ENDPOINTS } from '../../../api/endpoints';
import OfficialStamp from '../../stamp/stamp';
import env from '../../../utils/config/env';
import notify from '../../../utils/notify';
import bwipjs from '@bwip-js/browser';
import axios from 'axios';
import api from '../../../api/axios';
import InOurCare from '../../common/InOurCare';

import {
  Check, Loader2, CheckCircle, X, FileText, User, RotateCcw, ShieldCheck,
  AlertCircle, ArrowRight, Calendar, Clock, Phone, IdCard, MapPin
} from '../../../utils/icons/icons';

// ─── Color Palette ──
const COLORS = {
  ink: '#1A1A1A',
  bone: '#FAF8F4',
  bone2: '#FFFFFF', // Fixed syntax error: added quotes
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

/* ─── Natural Borderless Header ── */
const HeaderWrapper = styled.header`
  padding: 2.5rem 3rem;
  position: relative;
  z-index: 1;
  background: transparent;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
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
  font-family: 'Fraunces', serif;
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
  padding: 3rem 3rem 1.5rem 3rem;

  @media (max-width: 1024px) {
    padding: 2.5rem;
  }
  @media (max-width: 600px) {
    padding: 1.5rem;
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
`;

const PrimaryButton = styled.button`
  background: ${COLORS.verdigris};
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
    background: ${COLORS.verdigrisDark};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.2);
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
  background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%);
  color: ${COLORS.ink};
  border: 1px solid ${COLORS.goldDark};
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
  box-shadow: 0 2px 6px rgba(201, 162, 39, 0.25);

  &:hover {
    background: linear-gradient(135deg, ${COLORS.goldDark} 0%, ${COLORS.gold} 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201, 162, 39, 0.4);
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
  background: ${COLORS.ink};
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
  box-shadow: 0 2px 6px rgba(21, 23, 26, 0.2);

  &:hover {
    background: #2a2d31;
    border-color: #2a2d31;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(21, 23, 26, 0.35);
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
  background: #2F3A32;
  color: #E9EBDD;
  text-align: center;
  padding: 56px 20px 0;
  border-top: none;
  box-sizing: border-box;

  /* soft ring watermark */
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

/* Timestamp strip — sits ABOVE the elegant footer, keeping the
   official generation record visible without cluttering it. */
const RecordInfoStrip = styled.div`
  font-size: 0.65rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  line-height: 1.7;
  margin: 2rem 3rem 0;
  padding: 0.9rem 1rem 0.4rem;
  border-top: 1px solid ${COLORS.line};

  @media (max-width: 600px) {
    margin: 1.5rem 1.25rem 0;
  }
`;

// Contact glyphs
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const formatHeaderDate = (value) => {
  if (!value) return '—';
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Barcode component strictly configured for absolute visibility
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

  return <canvas ref={canvasRef} style={{ display: 'block', width: 'auto', height: '40px' }} />;
};

const DeceasedRegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTenantSlug = () => {
    return localStorage.getItem('tenantSlug') ||
      localStorage.getItem('tenant_slug') ||
      (() => {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          return user.tenantSlug || user.tenant?.slug || 'default';
        } catch {
          return 'default';
        }
      })();
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

  const branding = useMemo(() => resolveTenantBranding(), []);

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

  // Get dynamic greeting based on current hour
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
    email: '',
    received_from: '',
    receiving_officer: '',
    signature: '',
    verified_by: getLoggedInUserEmail(),
    permit_number: '',
    relationship: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(prev => ({ ...prev, time_received: getCurrentTime() }));
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
    const digits = String(p || '').replace(/[^\d]/g, '');
    return digits.length >= 9 && digits.length <= 13;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_admitted) newErrors.date_admitted = 'Date admitted is required';
    if (!formData.received_from.trim()) newErrors.received_from = 'Received from is required';
    if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person name is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'National ID number is required';
    if (!formData.tel_number.trim()) {
      newErrors.tel_number = 'Telephone number is required';
    } else if (!isValidPhone(formData.tel_number)) {
      newErrors.tel_number = 'Please enter a valid telephone number';
    }
    if (formData.alternative_phone && !isValidPhone(formData.alternative_phone)) {
      newErrors.alternative_phone = 'Please enter a valid alternative phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      const signatureData = sigPadRef1.current?.toDataURL();
      const freshTime = getCurrentTime();

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
        id_type: formData.id_type || 'National ID',
        alternative_phone: formData.alternative_phone || null,
        email: formData.email || null,
        receiving_officer: formData.receiving_officer || null,
        verified_by: formData.verified_by || getLoggedInUserEmail() || null,
        relationship: formData.relationship || null,
        permit_no: formData.permit_number || null,
        date_admitted: formData.date_admitted,
        signature: signatureData,
      };

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

      setRegisteredName(formData.full_name);
      setLastSignedName(formData.full_name);
      setVigilData({
        name: formData.full_name,
        passed: formData.date_of_death,
        reference: admissionId || (result?.data?.admission_number ?? ''),
      });
      setShowSuccess(true);

      notify.success(
        'Registration Successful',
        `${formData.full_name} has been registered successfully.${admissionId ? ` File ID: ${admissionId}` : ''}`
      );

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

  // ── Vigil success view ──
  // After a successful admission a candle is lit in the deceased's memory.
  // "Done" returns the user to the portal dashboard.
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
          {/* ──── NATURAL BORDERLESS HEADER ──── */}
          <HeaderWrapper>
            <HeaderMain>
              
              {/* Left Column: Greeting & Info */}
              <ColLeft>
                <GreetingBlock>
                  <GreetingWelcome>Welcome to</GreetingWelcome>
                  <TextSlider>
                    <TextTrack>
                      <Phrase>{tenantName || 'Lee Funeral Home'}</Phrase>
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
                    {displayAddress || fallback.address || fallback.location}
                  </ContactItem>
                  <ContactItem>
                    <MailIcon />
                    {displayEmail || fallback.email}
                  </ContactItem>
                  <ContactItem>
                    <PhoneIcon />
                    {displayPhone || fallback.phone}
                  </ContactItem>
                </FacilityInfo>
              </ColLeft>

              {/* Right Column: Date & Verification */}
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
                    <Label>Received From</Label>
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
                    <Label>ID Type</Label>
                    <InputFieldWrapper>
                      <Input
                        type="text"
                        name="id_type"
                        value="National ID"
                        readOnly
                        disabled
                      />
                      {hasValue(formData.id_type) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                  </Col>
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
                  <Col>
                    <Label>Email Address</Label>
                    <InputFieldWrapper>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contact@example.com"
                      />
                      {hasValue(formData.email) && (
                        <TickIconWrapper>
                          <Check size={16} strokeWidth={2.5} />
                        </TickIconWrapper>
                      )}
                    </InputFieldWrapper>
                    {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
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
                      {/* The Signature Pad now ALWAYS renders and stays open */}
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
                        <Label>Receiving Officer</Label>
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
                      </GridName>

                      <GridDate>
                        <Label>Verified By System User</Label>
                        <InputFieldWrapper>
                          <Input
                            type="text"
                            name="verified_by"
                            value={formData.verified_by}
                            onChange={handleChange}
                            readOnly
                            disabled
                          />
                          {hasValue(formData.verified_by) && (
                            <TickIconWrapper>
                              <Check size={16} strokeWidth={2.5} />
                            </TickIconWrapper>
                          )}
                        </InputFieldWrapper>
                      </GridDate>

                      <StampWrapper>
                        <OfficialStamp />
                      </StampWrapper>
                    </GridRight>
                  </SignOffGrid>
                </SignOffContainer>
              </Section>

              {/* Three Action Buttons */}
              <ActionsContainer>
                <ClearSigButton type="button" onClick={handleClear} style={{ marginRight: 'auto' }}>
                  <RotateCcw size={14} style={{ marginRight: '4px' }} /> Clear Form
                </ClearSigButton>

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

          {/* Timestamp strip — the official generation record, kept ABOVE the new footer */}
          <RecordInfoStrip>
            {tenantName || 'This Funeral Home'} — Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            <br />- Official Intake Record -
          </RecordInfoStrip>

          {/* Footer — Woodland Elegance */}
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
              <span>© {new Date().getFullYear()} {tenantName || 'This Funeral Home'}</span>
              <span>Official Intake Record</span>
            </FooterBar>
          </ElegantFooter>
        </ContentWrapper>
      </FormSheet>
    </Container>
  );
};

export default DeceasedRegistrationForm;