import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ENDPOINTS } from '../../../api/endpoints';
import env from '../../../utils/config/env';
import { ToastContainer, toast } from 'react-toastify';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import ReusableSignaturePad from '../../../utils/signature/signaturepad';
import { IDScannerComponent } from '../../../utils/idScanner.jsx?t=20250620';
import bwipjs from '@bwip-js/browser';
import {
  Check, Loader2, CheckCircle, X, FileText, User,
  RotateCcw, ShieldCheck, AlertCircle, ArrowRight, Calendar, Clock, Phone, IdCard, ScanBarcode, MapPin
} from '../../../utils/icons/icons';
import styled, { keyframes } from 'styled-components';
import OfficialStamp from '../../stamp/stamp';
import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';

// ─── Restored Login Color Palette ──────────────────────────────────
const COLORS = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  lineDark: 'rgba(250,248,244,0.14)',
  gray: '#6B6862',
  grayLight: 'rgba(250,248,244,0.62)',
  red: '#9B4A3F',
  redBg: '#F7ECE9',
  redLine: '#E8D2CC',
  success: '#475A43',
  successBg: '#EEF3EC',
  white: '#FFFFFF',
  inkBlue: '#1131db',
  stampBlue: '#1e3a8a',
  stampRed: '#dc2626',
  gold: '#C9A227',
  goldDark: '#A8851C',
};

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bone2};
  font-family: 'Inter', sans-serif;
  color: ${COLORS.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;

  .Toastify__toast-container { width: 380px !important; max-width: 90vw !important; padding: 0 !important; }
  .Toastify__toast { border-radius: 8px !important; font-family: 'Inter', sans-serif !important; font-size: 0.85rem !important; padding: 10px 14px !important; min-height: 44px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; margin-bottom: 0.5rem !important; }
  .Toastify__toast-body { padding: 0 !important; margin: 0 !important; font-size: 0.85rem !important; }
`;

const FormSheet = styled.div`
  width: 100%;
  max-width: 100%;
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
  color: rgba(21, 23, 26, 0.025);
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

// ─── Compact Letterhead Layout ─────────────────────────────────────
const Letterhead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  border-bottom: 1px solid ${COLORS.line};
  background: ${COLORS.white};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${COLORS.verdigris} 0%, ${COLORS.brass} 50%, ${COLORS.verdigris} 100%);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
  }
`;

const BrandLeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const LogoBox = styled.div`
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const BrandDetails = styled.div`
  min-width: 0;

  @media (max-width: 480px) {
    text-align: center;
  }
`;

const BrandName = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const BrandMeta = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-weight: 500;
  
  svg { 
    opacity: 0.8;
    flex-shrink: 0;
    color: ${COLORS.brass};
  }

  @media (max-width: 480px) {
    justify-content: center;
  }
`;

const BrandRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    align-items: center;
  }
`;

const DocTitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${COLORS.verdigris};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 8px;
    height: 4px;
    background: ${COLORS.brass};
    display: inline-block;
  }

  @media (max-width: 480px) {
    &::before { display: none; }
  }
`;

const BarcodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const FileIdText = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: ${COLORS.gray};
  text-align: center;
  
  span {
    font-weight: 700;
    color: ${COLORS.ink};
    letter-spacing: 0.05em;
    margin-left: 0.25rem;
  }
`;

// ─── Form Body ─────────────────────────────────────────────────────
const FormBody = styled.div`
  padding: 3rem 4rem;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
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
const Col06 = styled(Col)` flex: 0.6; @media (max-width: 1024px) { flex: 1 1 30%; min-width: 140px; } `;
const Col15 = styled(Col)` flex: 1.5; @media (max-width: 1024px) { flex: 1 1 60%; } `;

const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.5rem;
  font-family: 'Inter', sans-serif;
`;

const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: 1px solid ${COLORS.line};
  border-radius: 4px;
  padding: 0 0.85rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${COLORS.ink};
  background: ${COLORS.bone};
  transition: all 0.2s ease;
  box-sizing: border-box;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  &:focus {
    outline: none;
    border-color: ${COLORS.ink};
    background: ${COLORS.white};
    box-shadow: 0 0 0 3px rgba(21, 23, 26, 0.08), inset 0 1px 2px rgba(21, 23, 26, 0.03);
  }

  &:not(:placeholder-shown) {
    border-color: ${COLORS.brassLight};
    background: ${COLORS.white};
    font-weight: 500;
    color: ${COLORS.ink};
  }

  &:disabled {
    background: ${COLORS.bone2};
    color: ${COLORS.gray};
    cursor: not-allowed;
    opacity: 0.8;
    box-shadow: none;
  }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`;

const InputLg = styled(Input)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  height: 2.75rem;
  border: 1px solid ${COLORS.line};
  border-radius: 4px;
  padding: 0 0.85rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: ${COLORS.ink};
  background: ${COLORS.bone};
  transition: all 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  &:focus {
    outline: none;
    border-color: ${COLORS.ink};
    background: ${COLORS.white};
    box-shadow: 0 0 0 3px rgba(21, 23, 26, 0.08);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 4.5rem;
  border: 1px solid ${COLORS.line};
  border-radius: 4px;
  padding: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${COLORS.ink};
  background: ${COLORS.bone};
  resize: vertical;
  box-sizing: border-box;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  &:focus {
    outline: none;
    border-color: ${COLORS.ink};
    background: ${COLORS.white};
    box-shadow: 0 0 0 3px rgba(21, 23, 26, 0.08);
  }
`;

const CheckGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 2rem;
  padding: 1rem 1.25rem;
  background: ${COLORS.bone};
  border: 1px solid ${COLORS.line};
  border-radius: 4px;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);
  
  @media (max-width: 768px) {
    gap: 0.75rem 1.5rem;
  }
`;

const CheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${COLORS.ink};
  cursor: pointer;
  font-weight: 400;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid ${COLORS.brass};
  background: ${COLORS.white};
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  border-radius: 2px;
  transition: all 0.2s;

  &:checked {
    background: ${COLORS.verdigris};
    border-color: ${COLORS.verdigris};
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 0.1rem;
    left: 0.3rem;
    width: 0.3rem;
    height: 0.6rem;
    border: solid ${COLORS.bone};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const ErrorMessage = styled.span`
  color: ${COLORS.red};
  font-size: 0.75rem;
  margin-top: 0.3rem;
  display: block;
  font-family: 'Inter', sans-serif;
`;

// ─── Redesigned Signature Area Specifics ───
const SigCanvasWrap = styled.div`
s
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
  font-family: 'Alex Brush', cursive; /* ← This is the key */
  font-size: 1.2rem;
  color: ${COLORS.gray};
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`;


/* In your component's CSS or a global CSS file */

const SignOffContainer = styled.div`
  position: relative;
  margin-top: 2.5rem;
`;

// ─── NEW Grid Layout: Signature on LEFT, Name/Date/Stamp on RIGHT ───
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

// ─── Stamp Wrapper Overlapping Name & Date ───
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

  @media (max-width: 768px) {
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
  font-family: 'Inter', sans-serif;
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

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// ─── Gold Button (Back to Reception) ───
const GoldButton = styled.button`
  background: linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%);
  color: ${COLORS.ink};
  border: 1px solid ${COLORS.goldDark};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
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

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// ─── Black Button (Clear Form) ───
const BlackButton = styled.button`
  background: ${COLORS.ink};
  color: ${COLORS.bone};
  border: 1px solid ${COLORS.ink};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
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

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: ${COLORS.ink};
  border: 1px solid ${COLORS.lineDark};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  &:hover {
    background: ${COLORS.ink};
    color: ${COLORS.bone};
    border-color: ${COLORS.ink};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const LegalBlock = styled.div`
  padding: 0;
  margin-bottom: 2rem;
`;

const LegalText = styled.p`
  font-size: 0.875rem;
  line-height: 1.7;
  color: ${COLORS.gray};
  margin-bottom: 1rem;
  text-align: justify;

  &:last-child { margin-bottom: 0; }
  strong { color: ${COLORS.ink}; font-weight: 600; }
`;

// ─── ID Scan Row ────────────────────────────────────────────────────
const ScanRow = styled.div`
  display: flex;
  width: 100%;
  border: 1px solid ${COLORS.line};
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
  background: ${COLORS.bone};
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);
  
  &:focus-within {
    border-color: ${COLORS.ink};
    background: ${COLORS.white};
    box-shadow: 0 0 0 3px rgba(21, 23, 26, 0.08), inset 0 1px 2px rgba(21, 23, 26, 0.03);
  }

  &:has(input:not(:placeholder-shown)) {
    border-color: ${COLORS.brassLight};
    background: ${COLORS.white};
  }

  input {
    border: none;
    border-radius: 0;
    box-shadow: none;
    flex: 1;
    background: transparent;
    
    &:focus {
      box-shadow: none;
      background: transparent;
    }
    &:not(:placeholder-shown) {
      border: none;
      background: transparent;
    }
  }
`;

const ScanButton = styled.button`
  height: auto;
  padding: 0 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.ink};
  background: ${COLORS.bone2};
  border: none;
  border-left: 1px solid ${COLORS.line};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:hover {
    background: ${COLORS.ink};
    color: ${COLORS.bone};
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
  font-family: 'Inter', sans-serif;

  &:hover {
    color: ${COLORS.red};
  }
`;

const IDScannerModalWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(21,23,26,0.8);
  backdrop-filter: blur(4px);
  padding: 1rem;

  & > * { max-width: 100%; max-height: 100%; }
`;

// ─── Official Footer & Barcode Panel ───────────────────────────────
const FooterPanel = styled.div`
  background: ${COLORS.bone2};
  border-top: 1px solid ${COLORS.line};
  padding: 3rem 4rem; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 2rem 1.5rem;
    text-align: center;
  }
`;

const FooterText = styled.div`
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.gray};
  font-family: 'JetBrains Mono', monospace;
  text-align: left;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

// ─── bwip-js Barcode Component ─────────────────────────────────────
const Barcode = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const text = value || 'AWAITING-ID';
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: text,
          scale: 4,
          height: 10,
          includetext: true,
          textxalign: 'center',
          textsize: 13,
          paddingwidth: 10,
          paddingheight: 5,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '250px', height: 'auto' }} />;
};

// ─── Success Modal Components ──────────────────────────────────────
const SuccessOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(21, 23, 26, 0.8);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${keyframes`from { opacity: 0; } to { opacity: 1; }`} 0.2s ease-out;
`;

const SuccessCard = styled.div`
  background: ${COLORS.white};
  border-radius: 12px;
  padding: 3rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  animation: ${keyframes`from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; }`} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const SuccessIconWrap = styled.div`
  width: 80px;
  height: 80px;
  background: ${COLORS.bone2};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: ${COLORS.verdigris};
`;

const SuccessTitle = styled.h2`
  font-family: 'Fraunces', serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${COLORS.ink};
  margin: 0 0 0.5rem;
`;

const SuccessText = styled.p`
  font-size: 0.95rem;
  color: ${COLORS.gray};
  margin: 0 0 2rem;
  line-height: 1.6;
`;

const SuccessActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;
`;


const TextBold = styled.div`
  font-size: 1rem;
  color: ${COLORS.gray};
  text-decoration:   underline;
  font-weight:     800;
  text-underline-offset: 6px;
`

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [admissionId, setAdmissionId] = useState('');

  /* ---------- USE LOCALSTORAGE ONLY FOR TENANT BRANDING ---------- */
  const branding = useMemo(() => resolveTenantBranding(), []);

  const {
    name: tenantName,
    displayPhone,
    displayEmail,
    displayLocation,
    tenantCountry,
    displayBranch,
    tenantLogoUrl,
    fallback
  } = branding;

  /* ---------- Helpers ---------- */
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

  const initialFormData = {
    admission_number: location.state?.permitNumber || '',
    date_admitted: new Date().toISOString().split('T')[0],
    time_received: getCurrentTime(),
    full_name: '',
    gender: '',
    age: '',
    date_of_birth: '',
    date_of_death: '',
    cause_of_death: '',
    body_status: '',
    place_of_death: '',
    contact_person: '',
    id_number: '',
    id_type: '',
    tel_number: '',
    alternative_phone: '',
    email: '',
    received_from: '',
    receiving_officer: '',
    signature: '',
    verified_by: getLoggedInUserEmail(),
    permit_number: '',
    belongings_description: '',
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
        const tenantSlug = getTenantSlug();
        const token = getAuthToken();
        const response = await fetch(
          `${env.FULL_API_URL}${ENDPOINTS.DECEASED.ADMISSION_NUMBER(formData.gender)}`,
          {
            headers: {
              'x-tenant-slug': tenantSlug,
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.admission_number) {
            setAdmissionId(result.data.admission_number);
          }
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
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.date_admitted) newErrors.date_admitted = 'Date admitted is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.tel_number && !/^(\+254|0)[17]\d{8}$/.test(formData.tel_number.replace(/\s/g, ''))) {
      newErrors.tel_number = 'Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)';
    }

    if (formData.alternative_phone && !/^(\+254|0)[17]\d{8}$/.test(formData.alternative_phone.replace(/\s/g, ''))) {
      newErrors.alternative_phone = 'Please enter a valid Kenyan phone number';
    }

    if (sigPadRef1.current?.isEmpty()) {
      newErrors.signature = 'Signature is required to proceed';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        date_of_birth: formData.date_of_birth || null,
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
        id_type: formData.id_type || null,
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
      toast.error(error.message || 'Registration failed. Please try again.');
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
    sigPadRef1.current?.clear();
  };

  const handleIdScanComplete = (scanResult) => {
    if (scanResult.success && scanResult.parsedFields) {
      const { idNumber, fullName, dateOfBirth, gender } = scanResult.parsedFields;

      setFormData(prev => ({
        ...prev,
        id_number: idNumber || prev.id_number,
        full_name: fullName || prev.full_name,
        date_of_birth: dateOfBirth || prev.date_of_birth,
        gender: gender || prev.gender,
      }));

      toast.success('ID card scanned successfully!');
    } else {
      toast.error('Failed to scan ID card. Please try again.');
    }
    setShowIdScanner(false);
  };

  if (loading && !showSuccess) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={COLORS.ink} className="animate-spin" />
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: COLORS.gray, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Processing Document...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />

      <FormSheet>
        <Watermark>OFFICIAL RECORD</Watermark>

        <ContentWrapper>
          <Letterhead>
            <BrandLeftWrapper>
              <LogoBox>
                {tenantLogoUrl && (
                  <img
                    src={tenantLogoUrl}
                    alt={tenantName}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </LogoBox>
              <BrandDetails>
                <BrandName>{tenantName}</BrandName>
                {displayLocation && (
                  <BrandMeta><MapPin size={12} /> {displayBranch ? `${displayBranch} · ` : ''}{displayLocation}{tenantCountry ? `, ${tenantCountry}` : ''}</BrandMeta>
                )}
                <BrandMeta><Phone size={12} /> {displayPhone || fallback.phone}{displayEmail ? ` · ${displayEmail}` : fallback.email ? ` · ${fallback.email}` : ''}</BrandMeta>
              </BrandDetails>
            </BrandLeftWrapper>

            <BrandRightWrapper>
              <DocTitle>Intake Record</DocTitle>
              <BarcodeWrapper>
                <Barcode value={admissionId} />
                <FileIdText>
                  File ID:
                  <span>
                    {loadingAdmission ? 'Generating...' : (admissionId || 'Select gender ')}
                  </span>
                </FileIdText>
              </BarcodeWrapper>
            </BrandRightWrapper>
          </Letterhead>

          <FormBody>
            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1 */}
              <Section>
                <SectionHead>
                  <SectionNum>01</SectionNum>
                  <SectionTitle>  Receiving & Facility Information  </SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Admission Number</Label>
                    <InputLg
                      type="text"
                      name="admission_number"
                      value={admissionId || formData.admission_number}
                      placeholder="Auto-generated from gender"
                      readOnly
                      disabled
                    />
                  </Col2>
                  <Col>
                    <Label>Date Admitted <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputLg
                      type="date"
                      name="date_admitted"
                      value={formData.date_admitted}
                      onChange={handleChange}
                    />
                    {errors.date_admitted && <ErrorMessage>{errors.date_admitted}</ErrorMessage>}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Label>Permit Number</Label>
                    <Input
                      type="text"
                      name="permit_number"
                      value={formData.permit_number}
                      onChange={handleChange}
                      placeholder="Permit/Reference Number"
                    />
                  </Col>
                  <Col>
                    <Label>Received From</Label>
                    <Input
                      type="text"
                      name="received_from"
                      value={formData.received_from}
                      onChange={handleChange}
                      placeholder="Hospital, Home, Police, Other"
                    />
                  </Col>
                  <Col>
                    <Label>Admitting Officer</Label>
                    <Input
                      type="text"
                      name="receiving_officer"
                      value={formData.receiving_officer}
                      onChange={handleChange}
                      placeholder="Officer / Staff Name"
                    />
                  </Col>
                </Row>
              </Section>

              {/* Section 2 */}
              <Section>
                <SectionHead>
                  <SectionNum>02</SectionNum>
                  <SectionTitle> Information About Your Loved One  </SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Full Legal Name of Deceased <span style={{ color: COLORS.red }}>*</span></Label>
                    <InputLg
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Last, First, Middle Name"
                    />
                    {errors.full_name && <ErrorMessage>{errors.full_name}</ErrorMessage>}
                  </Col2>
                  <Col05>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Yrs"
                      min="0"
                      max="150"
                    />
                  </Col05>
                  <Col05>
                    <Label>Sex <span style={{ color: COLORS.red }}>*</span></Label>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Select>
                    {errors.gender && <ErrorMessage>{errors.gender}</ErrorMessage>}
                  </Col05>
                </Row>
                <Row>
                  <Col2>
                    <Label>Date of Death</Label>
                    <Input
                      type="date"
                      name="date_of_death"
                      value={formData.date_of_death}
                      onChange={handleChange}
                    />
                  </Col2>
                </Row>
                <Row>
                  <Col2>
                    <Label>Place of Death</Label>
                    <Input
                      type="text"
                      name="place_of_death"
                      value={formData.place_of_death}
                      onChange={handleChange}
                      placeholder="Facility Name, Address, or Residence"
                    />
                  </Col2>
                </Row>
                <Row>
                  <Col2>
                    <Label>Cause of Death</Label>
                    <TextArea
                      name="cause_of_death"
                      value={formData.cause_of_death}
                      onChange={handleChange}
                      placeholder="Preliminary cause if known — clinical notes, pending autopsy, etc."
                      rows="2"
                    />
                  </Col2>
                </Row>
                <Row>
                  <Col>
                    <Label>Body Status (Optional)</Label>
                    <Input
                      type="text"
                      name="body_status"
                      value={formData.body_status}
                      onChange={handleChange}
                      placeholder="e.g. In Morgue, Pending Autopsy, etc."
                    />
                  </Col>
                </Row>
              </Section>

              {/* Section 3 */}
              <Section>
                <SectionHead>
                  <SectionNum>03</SectionNum>
                  <SectionTitle>Next of Kin — Contact & Identification</SectionTitle>
                </SectionHead>

                <Row>
                  <Col2>
                    <Label>Next of Kin Full Name</Label>
                    <Input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      placeholder="Last, First, Middle"
                    />
                  </Col2>
                  <Col>
                    <Label>Relationship to Deceased</Label>
                    <Input
                      type="text"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleChange}
                      placeholder="Spouse, Child, Parent, Sibling, etc."
                    />
                  </Col>
                </Row>
                <Row>
                  <Col15>
                    <Label>ID Number (Government-Issued)</Label>
                    <ScanRow>
                      <Input
                        type="text"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="National ID / Passport / Driver's License No."
                      />
                      <ScanButton
                        type="button"
                        onClick={() => setShowIdScanner(true)}
                        disabled={loading}
                      >
                        <ScanBarcode size={14} />
                        Scan
                      </ScanButton>
                    </ScanRow>
                  </Col15>
                  <Col06>
                    <Label>ID Type</Label>
                    <Select
                      name="id_type"
                      value={formData.id_type}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select</option>
                      <option value="national-id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="voters-card">Voter's Card</option>
                      <option value="other">Other</option>
                    </Select>
                  </Col06>
                </Row>
                <Row>
                  <Col>
                    <Label>Telephone Number</Label>
                    <Input
                      type="tel"
                      name="tel_number"
                      value={formData.tel_number}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                    />
                    {errors.tel_number && <ErrorMessage>{errors.tel_number}</ErrorMessage>}
                  </Col>
                  <Col>
                    <Label>Alternative Phone</Label>
                    <Input
                      type="tel"
                      name="alternative_phone"
                      value={formData.alternative_phone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                    />
                    {errors.alternative_phone && <ErrorMessage>{errors.alternative_phone}</ErrorMessage>}
                  </Col>
                  <Col06>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                    {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
                  </Col06>
                </Row>
              </Section>

              {/* Section 4 */}
              <Section>
                <SectionHead>
                  <SectionNum>04</SectionNum>
                  <SectionTitle>Personal Effects Inventory</SectionTitle>
                </SectionHead>

                <CheckGrid>
                  <CheckItem><Checkbox type="checkbox" /> Wallet / Purse</CheckItem>
                  <CheckItem><Checkbox type="checkbox" /> Mobile Phone</CheckItem>
                  <CheckItem><Checkbox type="checkbox" /> Jewelry</CheckItem>
                  <CheckItem><Checkbox type="checkbox" /> Watch</CheckItem>

                  <CheckItem><Checkbox type="checkbox" /> Clothing</CheckItem>
                  <CheckItem><Checkbox type="checkbox" /> Eyewear</CheckItem>



                  <CheckItem><Checkbox type="checkbox" /> Cash / Currency</CheckItem>

                  <CheckItem><Checkbox type="checkbox" /> None</CheckItem>
                  <CheckItem><Checkbox type="checkbox" /> Other (specify below)</CheckItem>
                </CheckGrid>

                <Row style={{ marginTop: '1.5rem' }}>
                  <Col2>
                    <Label>Detailed Description / Additional Items</Label>
                    <TextArea
                      name="belongings_description"
                      value={formData.belongings_description}
                      onChange={handleChange}
                      placeholder="List all items with description, quantity, and estimated value if applicable..."
                      rows="2"
                    />
                  </Col2>
                </Row>
              </Section>

              {/* Section 5: Declaration & Sign-off */}
              <Section>
                <SectionHead>
                  <SectionNum>05</SectionNum>
                  <SectionTitle>Declaration & Sign-off</SectionTitle>
                </SectionHead>

                <LegalBlock>
                  <LegalText>
                    <TextBold>   By signing below, I confirm that:   </TextBold>
                    <br />
                    The information provided is true and accurate to the best of my knowledge.
                    <br />
                    I authorize this facility to take temporary custody of and prepare the remains.
                  </LegalText>
                </LegalBlock>

                <SignOffContainer>
                  <SignOffGrid>
                    {/* ─── SIGNATURE ALONE ON THE LEFT ─── */}
                    <GridSig>
                      <Label>Authorized Signature <span style={{ color: COLORS.red }}>*</span></Label>
                      <SigCanvasWrap>
                        <SigGuideText>✕ Authorized Signature</SigGuideText>
                        <ReusableSignaturePad
                          ref={sigPadRef1}
                          penColor={COLORS.inkBlue}
                          minWidth={1.5}
                          maxWidth={3.5}
                          velocityFilterWeight={0.6}
                          placeholder="Sign here"
                          showSave={false}
                        />
                      </SigCanvasWrap>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ClearSigButton
                          type="button"
                          onClick={() => sigPadRef1.current?.clear()}
                        >
                          Clear Signature
                        </ClearSigButton>
                      </div>
                    </GridSig>

                    {/* ─── NAME, DATE, AND STAMP ON THE RIGHT ─── */}
                    <GridRight>
                      <GridName>
                        <Label>Printed Name</Label>
                        <InputLg
                          type="text"
                          value={formData.contact_person}
                          readOnly
                          placeholder="Auto-filled from Next of Kin"
                        />
                      </GridName>

                      <GridDate>
                        <Label>Date</Label>
                        <InputLg
                          type="text"
                          value={new Date().toLocaleDateString()}
                          readOnly
                        />
                      </GridDate>

                      {/* Stamp overlapping the Name and Date inputs */}
                      <StampWrapper>
                        <OfficialStamp
                          tenantName={tenantName}
                          tenantPhone={displayPhone || fallback.phone}
                          tenantLocation={displayLocation || fallback.location}
                        />
                      </StampWrapper>
                    </GridRight>
                  </SignOffGrid>
                </SignOffContainer>
                {errors.signature && <ErrorMessage style={{ marginTop: '0.5rem' }}>{errors.signature}</ErrorMessage>}
              </Section>

              {/* Actions */}
              <ActionsContainer>
                <GoldButton type="button" onClick={() => navigate(`/tenant/${getTenantSlug()}/receptionist`)}>
                  ← Back to Reception
                </GoldButton>
                <BlackButton type="button" onClick={handleClear} disabled={isSubmitting}>
                  <RotateCcw size={15} /> Clear Form
                </BlackButton>
                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Submit Registration
                    </>
                  )}
                </PrimaryButton>
              </ActionsContainer>
            </form>
          </FormBody>

          <FooterPanel>
            <FooterText>
              {tenantName} Intake Record — Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
              Page 1 of 1 — Original Document
            </FooterText>
          </FooterPanel>
        </ContentWrapper>
      </FormSheet>

      {showIdScanner && (
        <IDScannerModalWrap>
          <IDScannerComponent
            onScanComplete={handleIdScanComplete}
            onClose={() => setShowIdScanner(false)}
            autoCapture={true}
            captureDelay={3000}
          />
        </IDScannerModalWrap>
      )}

      {showSuccess && (
        <SuccessOverlay>
          <SuccessCard>
            <SuccessIconWrap>
              <CheckCircle size={48} strokeWidth={1.5} />
            </SuccessIconWrap>
            <SuccessTitle>Record Registered Successfully</SuccessTitle>
            <SuccessText>
              The intake record for <strong style={{ color: COLORS.ink }}>{registeredName}</strong> has been successfully registered and securely saved in the system.
            </SuccessText>
            <SuccessActions>
              <PrimaryButton onClick={() => setShowSuccess(false)}>
                <Check size={16} /> Register Another Record
              </PrimaryButton>
              <GoldButton onClick={() => navigate(`/tenant/${getTenantSlug()}/receptionist`)}>
                ← Back to Reception
              </GoldButton>
            </SuccessActions>
          </SuccessCard>
        </SuccessOverlay>
      )}
    </Container>
  );
};

export default DeceasedRegistrationForm;