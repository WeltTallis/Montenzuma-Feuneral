import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bwipjs from '@bwip-js/browser';
import {
  Check, Loader2, CheckCircle, X, FileText, User, RotateCcw, ShieldCheck, AlertCircle,
  ArrowRight, Calendar, Clock, Phone, IdCard, Search, MapPin
} from '../../utils/icons/icons';
import styled, { keyframes } from 'styled-components';
import { useTenantStore } from '../../modules/seo/useTenantStore';
import OfficialStamp, { StampWrapper } from '../stamp/stamp';
import { resolveTenantBranding } from '../../utils/tenantResolver/tenantBranding';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';

// Dynamically import signature pad to avoid SSR issues
const ReusableSignaturePad = React.lazy(() => import('../../utils/signature/signaturepad'));

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
  inkBlue: '#1131db',       // True blue ink for signatures
  stampBlue: '#1e3a8a',     // Deep blue for the official stamp
  stampRed: '#dc2626',      // Red for the stamp date
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

// ─── Official Watermark ────────────────────────────────────────────
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

// ─── Letterhead (Branding) ─────────────────────────────────────────
const Letterhead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2.5rem 3.5rem 2rem;
  border-bottom: 1px solid ${COLORS.line};
  gap: 2rem;
  flex-wrap: wrap;
  background: ${COLORS.white};
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      ${COLORS.verdigris} 0%, 
      ${COLORS.brass} 25%, 
      ${COLORS.verdigris} 50%, 
      ${COLORS.brass} 75%, 
      ${COLORS.verdigris} 100%
    );
    background-size: 200% 100%;
    animation: gradientShift 8s ease infinite;
    box-shadow: 0 2px 12px rgba(61, 79, 71, 0.25);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(139, 115, 85, 0.04) 0%, transparent 60%);
    border-radius: 50%;
    pointer-events: none;
  }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const BrandLeft = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

const LogoBox = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${COLORS.verdigris} 0%, ${COLORS.verdigrisDark} 100%);
  color: ${COLORS.bone};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 2.5rem;
  font-weight: 700;
  border-radius: 20px;
  flex-shrink: 0;
  box-shadow: 0 10px 30px rgba(61, 79, 71, 0.25), 0 2px 8px rgba(61, 79, 71, 0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 15px 40px rgba(61, 79, 71, 0.3), 0 4px 12px rgba(61, 79, 71, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
    border-radius: 18px;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%) rotate(45deg); }
    50% { transform: translateX(100%) rotate(45deg); }
  }
`;

const BrandDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const BrandName = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
  color: ${COLORS.ink};
  line-height: 1.1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, ${COLORS.ink} 0%, ${COLORS.verdigris} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, ${COLORS.brass} 0%, ${COLORS.verdigris} 100%);
    border-radius: 2px;
  }
`;

const BrandMeta = styled.div`
  font-size: 0.9rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  
  svg { 
    opacity: 0.85;
    flex-shrink: 0;
    color: ${COLORS.brass};
    filter: drop-shadow(0 1px 2px rgba(139, 115, 85, 0.2));
  }
`;

const BrandRight = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    text-align: left;
    width: 100%;
    align-items: flex-start;
  }
`;

const DocTitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: ${COLORS.verdigris};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;

  &::before {
    content: '';
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, ${COLORS.brass} 0%, ${COLORS.verdigris} 100%);
    display: inline-block;
    border-radius: 2px;
    box-shadow: 0 1px 4px rgba(139, 115, 85, 0.3);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, ${COLORS.line} 0%, transparent 100%);
    max-width: 100px;
  }
`;

const ReleaseIdBlock = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.4rem;
  background: ${COLORS.white};
  padding: 1.125rem 1.75rem;
  border: 1px solid ${COLORS.line};
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${COLORS.verdigris} 0%, ${COLORS.brass} 50%, ${COLORS.verdigris} 100%);
    background-size: 200% 100%;
    animation: gradientShift 6s ease infinite;
    opacity: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(61, 79, 71, 0.03) 0%, transparent 50%);
    pointer-events: none;
  }

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06);
    transform: translateY(-3px);
    border-color: ${COLORS.brassLight};
  }
`;

const ReleaseIdLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  font-family: 'JetBrains Mono', monospace;
`;

const ReleaseIdValue = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${COLORS.verdigris};
  letter-spacing: 0.08em;
`;

const TopMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: flex-end;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const TopMetaItem = styled.div`
  text-align: right;
  
  @media (max-width: 768px) {
    text-align: left;
  }
`;

const TopMetaLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-bottom: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
`;

const TopMetaValue = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${COLORS.ink};
`;

// ─── Form Body ─────────────────────────────────────────────────────
const FormBody = styled.div`
  padding: 4rem;

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
const Col04 = styled(Col)` flex: 0.4; @media (max-width: 1024px) { flex: 1 1 30%; min-width: 120px; } `;

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

const Radio = styled.input.attrs({ type: 'radio' })`
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid ${COLORS.brass};
  background: ${COLORS.white};
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  border-radius: 50%;

  &:checked {
    border-color: ${COLORS.verdigris};
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 0.1875rem;
    left: 0.1875rem;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: ${COLORS.verdigris};
  }
`;

const HighlightRow = styled.div`
  background: ${COLORS.bone2};
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid ${COLORS.line};
  margin-bottom: 1.5rem;
`;

const LegalBlock = styled.div`
  padding: 1.25rem 1.5rem;
  background: ${COLORS.bone2};
  border: 1px solid ${COLORS.line};
  border-left: 4px solid ${COLORS.verdigris};
  border-radius: 0 4px 4px 0;
  margin-bottom: 2rem;
`;

const LegalText = styled.p`
  font-size: 0.875rem;
  line-height: 1.7;
  color: ${COLORS.gray};
  margin-bottom: 1rem;

  &:last-child { margin-bottom: 0; }
  strong { color: ${COLORS.ink}; font-weight: 600; }
`;

const SigCanvasWrap = styled.div`
  border: 1px solid ${COLORS.line};
  border-bottom: 2px solid ${COLORS.ink};
  border-radius: 4px 4px 0 0;
  height: 10rem;
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

  @media (max-width: 768px) {
    height: 12rem;
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

// ─── ID Scan Row (Seamless Input Group) ────────────────────────────
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

// ─── Official Footer & Barcode Panel ───────────────────────────────
const FooterPanel = styled.div`
  background: ${COLORS.bone2};
  border-top: 1px solid ${COLORS.line};
  padding: 5rem 4rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 5rem 1.5rem 2rem;
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

const BarcodeWrapper = styled.div`
  padding: 1.5rem 1.5rem 1rem;
  background: ${COLORS.white};
  border: 2px solid ${COLORS.ink};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
          height: 20,           
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

  return <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '300px', height: 'auto' }} />;
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

// ─── Main Component Logic ──────────────────────────────────────────
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

const getLoggedInUserEmail = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.email || user.userEmail || '';
  } catch {
    return '';
  }
};

const ReleaseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantData } = useTenantStore();
  const {
    name: tenantName,
    displayBranch,
    displayLocation,
    displayPhone,
    displayEmail,
    tenantLogoUrl,
    tenantCountry,
  } = resolveTenantBranding(tenantData);
  const [deceasedData, setDeceasedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releaseId, setReleaseId] = useState('');
  const sigPadRef = useRef(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [releasedName, setReleasedName] = useState('');

  const [formData, setFormData] = useState({
    releasedTo: '',
    relationship: '',
    idNumber: '',
    phoneNumber: '',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: '',
    permitNumber: '',
    itemsReturned: '',
    notes: '',
    receivedBy: getLoggedInUserEmail(),
    staffName: getLoggedInUserEmail(),
    docsConfirmed: false,
    allDocsComplete: false,
  });
  
  const [recipientSignature, setRecipientSignature] = useState(null);
  const [admissionNumberInput, setAdmissionNumberInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (location.state?.deceasedData) {
      setDeceasedData(location.state.deceasedData);
      setIsLoading(false);
    } else if (id && id !== 'new') {
      fetchDeceasedData();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const userEmail = getLoggedInUserEmail();
    setFormData(prev => ({ 
      ...prev, 
      releaseTime: currentTime,
      receivedBy: userEmail
    }));
  }, []);

  const fetchDeceasedData = async () => {
    try {
      const tenantSlug = getTenantSlug();
      if (!tenantSlug) {
        toast.error('Tenant information not found');
        setIsLoading(false);
        return;
      }

      const deceasedEndpoint = `${ENDPOINTS.DECEASED.DETAIL(id)}`;
      const response = await api.get(deceasedEndpoint, {
        headers: { 'x-tenant-slug': tenantSlug },
      });
      const data = response.data?.data || response.data || {};
      setDeceasedData(data);

      fetchPostmortemData(id, tenantSlug);
    } catch (error) {
      console.error('Error fetching deceased data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load deceased information';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const [postmortemData, setPostmortemData] = useState(null);

  const fetchPostmortemData = async (deceasedId, tenantSlug) => {
    try {
      const response = await api.get(`/postmortem/${deceasedId}`, {
        headers: { 'x-tenant-slug': tenantSlug },
      });

      if (response.data?.success && response.data?.data) {
        setPostmortemData(response.data.data);
      }
    } catch (error) {
      console.log('No postmortem data found');
    }
  };

  const lookupDeceasedByAdmissionNumber = async (admissionNumber) => {
    if (!admissionNumber || admissionNumber.trim() === '') {
      toast.error('Please enter an admission number');
      return;
    }

    setIsLookingUp(true);
    try {
      const tenantSlug = getTenantSlug();
      if (!tenantSlug) {
        toast.error('Tenant information not found');
        return;
      }

      const response = await api.get(`/deceased/admission-number/${encodeURIComponent(admissionNumber)}`, {
        headers: { 'x-tenant-slug': tenantSlug },
      });

      if (response.data?.success && response.data?.data) {
        const deceased = response.data.data;
        setDeceasedData(deceased);
        toast.success(`Found: ${deceased.full_name}`);
        
        navigate(`/release-form/${deceased.id}`, { 
          state: { deceasedData: deceased },
          replace: true 
        });
      } else {
        toast.error('Deceased not found with this admission number');
        setDeceasedData(null);
      }
    } catch (error) {
      console.error('Error looking up deceased:', error);
      const errorMessage = error.response?.data?.message || 'Failed to look up deceased';
      toast.error(errorMessage);
      setDeceasedData(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAdmissionNumberKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupDeceasedByAdmissionNumber(admissionNumberInput);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.releasedTo.trim()) errors.push('Released To name is required');
    if (!formData.relationship) errors.push('Relationship to Deceased is required');
    if (!formData.releaseDate) errors.push('Release Date is required');
    if (!formData.releaseTime) errors.push('Release Time is required');
    if (!formData.docsConfirmed) errors.push('Please confirm all documentation is complete');
    if (!recipientSignature) errors.push('Recipient signature is required');

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantSlug = getTenantSlug();
      if (!tenantSlug) {
        toast.error('Tenant information not found');
        setIsSubmitting(false);
        return;
      }

      const releaseData = {
        ...formData,
        transport_carrier: formData.transportCarrier || '',
        vehicle_id: formData.vehicleId || '',
        final_destination: formData.finalDestination || '',
        deceasedId: id,
        admission_number: deceasedData?.admission_number,
        name_of_deceased: deceasedData?.full_name,
        id_number: formData.idNumber,
        next_kin: formData.releasedTo,
        tell_number: formData.phoneNumber,
        relationship: formData.relationship,
        date_of_removal: formData.releaseDate,
        time_of_removal: formData.releaseTime,
        signature: recipientSignature,
        staff_name: formData.staffName,
        terms_accepted: formData.docsConfirmed,
        everything_paid: formData.allDocsComplete,
      };

      const response = await api.post(
        '/body-release/checkout',
        releaseData,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data?.success) {
        const generatedReleaseId = response.data?.data?.release_id;
        setReleaseId(generatedReleaseId);
        setReleasedName(formData.releasedTo);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error releasing deceased:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to release deceased. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={COLORS.ink} className="animate-spin" />
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: COLORS.gray, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Document...</p>
        </div>
      </Container>
    );
  }

  const now = new Date();
  const dateIssued = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeIssued = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <Container>
      <ToastContainer position="top-right" autoClose={3000} limit={3} />

      <FormSheet>
        <Watermark>OFFICIAL RECORD</Watermark>

        <ContentWrapper>
          <Letterhead>
            <BrandLeft>
              {tenantLogoUrl ? (
                <img src={tenantLogoUrl} alt={tenantName} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 4, flexShrink: 0, background: COLORS.bone2, border: `1px solid ${COLORS.line}` }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <LogoBox>{tenantName.charAt(0).toUpperCase()}</LogoBox>
              )}
              <BrandDetails>
                <BrandName>{tenantName}</BrandName>
                {displayLocation && (
                  <BrandMeta><MapPin size={12} /> {displayBranch ? `${displayBranch} · ` : ''}{displayLocation}{tenantCountry ? `, ${tenantCountry}` : ''}</BrandMeta>
                )}
                <BrandMeta><Phone size={12} /> {displayPhone || '—'}{displayEmail ? ` · ${displayEmail}` : ''}</BrandMeta>
              </BrandDetails>
            </BrandLeft>
            <BrandRight>
              <DocTitle>Official Release Record</DocTitle>
              <ReleaseIdBlock>
                <ReleaseIdLabel>Release ID</ReleaseIdLabel>
                <ReleaseIdValue>{releaseId || 'Generating...'}</ReleaseIdValue>
              </ReleaseIdBlock>
              <TopMeta>
                <TopMetaItem>
                  <TopMetaLabel>Date</TopMetaLabel>
                  <TopMetaValue>{dateIssued}</TopMetaValue>
                </TopMetaItem>
                <TopMetaItem>
                  <TopMetaLabel>Time</TopMetaLabel>
                  <TopMetaValue>{timeIssued}</TopMetaValue>
                </TopMetaItem>
              </TopMeta>
            </BrandRight>
          </Letterhead>

          <FormBody>
            <form onSubmit={handleSubmit} noValidate>
              {/* Lookup Section */}
              <Section>
                <SectionHead>
                  <SectionNum>🔍</SectionNum>
                  <SectionTitle>Quick Lookup by Admission Number</SectionTitle>
                </SectionHead>
                
                <ScanRow>
                  <InputLg 
                    type="text" 
                    placeholder="Enter admission number and press Enter"
                    value={admissionNumberInput}
                    onChange={(e) => setAdmissionNumberInput(e.target.value)}
                    onKeyPress={handleAdmissionNumberKeyPress}
                  />
                  <ScanButton 
                    type="button" 
                    onClick={() => lookupDeceasedByAdmissionNumber(admissionNumberInput)}
                    disabled={isLookingUp}
                  >
                    {isLookingUp ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {isLookingUp ? 'Searching...' : 'Search'}
                  </ScanButton>
                </ScanRow>
              </Section>

              {deceasedData ? (
                <>
                  {/* Section 1: Deceased Information */}
                  <Section>
                    <SectionHead>
                      <SectionNum>01</SectionNum>
                      <SectionTitle>Deceased Information</SectionTitle>
                    </SectionHead>
                    
                    <Row>
                      <Col2>
                        <Label>Full Legal Name of Deceased</Label>
                        <InputLg type="text" value={deceasedData?.full_name || ''} readOnly disabled />
                      </Col2>
                      <Col04>
                        <Label>Admission No.</Label>
                        <InputLg type="text" value={deceasedData?.admission_number || id} readOnly disabled />
                      </Col04>
                    </Row>
                    <Row>
                      <Col>
                        <Label>Date of Birth</Label>
                        <Input type="text" value={deceasedData?.date_of_birth ? new Date(deceasedData.date_of_birth).toLocaleDateString() : ''} readOnly disabled />
                      </Col>
                      <Col>
                        <Label>Date of Death</Label>
                        <Input type="text" value={deceasedData?.date_of_death ? new Date(deceasedData.date_of_death).toLocaleDateString() : ''} readOnly disabled />
                      </Col>
                      <Col05>
                        <Label>Age</Label>
                        <Input type="text" value={deceasedData?.age || ''} readOnly disabled />
                      </Col05>
                      <Col05>
                        <Label>Sex</Label>
                        <Input type="text" value={deceasedData?.gender || ''} readOnly disabled />
                      </Col05>
                    </Row>
                  </Section>

                  {/* Section 1.5: Death Specifics */}
                  {postmortemData && (
                    <Section>
                      <SectionHead>
                        <SectionNum>01.5</SectionNum>
                        <SectionTitle>Death Specifics</SectionTitle>
                      </SectionHead>
                      
                      <Row>
                        <Col>
                          <Label>Date of Death</Label>
                          <Input type="text" value={deceasedData?.date_of_death ? new Date(deceasedData.date_of_death).toLocaleDateString() : ''} readOnly disabled />
                        </Col>
                        <Col>
                          <Label>Place of Death</Label>
                          <Input type="text" value={postmortemData?.place_of_death || deceasedData?.place_of_death || ''} readOnly disabled />
                        </Col>
                      </Row>
                      <Row>
                        <Col2>
                          <Label>Cause of Death</Label>
                          <Input type="text" value={postmortemData?.cause_of_death || deceasedData?.cause_of_death || 'Not specified'} readOnly disabled />
                        </Col2>
                      </Row>
                      <Row>
                        <Col2>
                          <Label>Physician</Label>
                          <Input type="text" value={postmortemData?.physician || deceasedData?.physician || ''} readOnly disabled />
                        </Col2>
                      </Row>
                    </Section>
                  )}

                  {/* Section 2: Next of Kin */}
                  <Section>
                    <SectionHead>
                      <SectionNum>02</SectionNum>
                      <SectionTitle>Next of Kin / Authorizing Party</SectionTitle>
                    </SectionHead>
                    
                    <Row>
                      <Col2>
                        <Label>Next of Kin Full Name <span style={{ color: COLORS.red }}>*</span></Label>
                        <Input type="text" name="releasedTo" value={formData.releasedTo} onChange={handleInputChange} placeholder="Last, First, Middle" required />
                      </Col2>
                      <Col>
                        <Label>Relationship <span style={{ color: COLORS.red }}>*</span></Label>
                        <Select name="relationship" value={formData.relationship} onChange={handleInputChange} required>
                          <option value="">Select relationship</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="child">Child</option>
                          <option value="sibling">Sibling</option>
                          <option value="other">Other</option>
                        </Select>
                      </Col>
                    </Row>
                    <Row>
                      <Col2>
                        <Label>Telephone No. <span style={{ color: COLORS.red }}>*</span></Label>
                        <Input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="(XXX) XXX-XXXX" required />
                      </Col2>
                    </Row>
                    <Row>
                      <Col>
                        <Label>ID Number (Govt. Issued) <span style={{ color: COLORS.red }}>*</span></Label>
                        <Input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="Driver's License / State ID No." required />
                      </Col>
                    </Row>
                  </Section>

                  {/* Section 3: Removal Details */}
                  <Section>
                    <SectionHead>
                      <SectionNum>03</SectionNum>
                      <SectionTitle>Removal & Transportation Details</SectionTitle>
                    </SectionHead>
                    
                    <HighlightRow>
                      <Row>
                        <Col>
                          <Label>Date of Removal <span style={{ color: COLORS.red }}>*</span></Label>
                          <Input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} required />
                        </Col>
                        <Col06>
                          <Label>Time of Removal <span style={{ color: COLORS.red }}>*</span></Label>
                          <Input type="time" name="releaseTime" value={formData.releaseTime} onChange={handleInputChange} required />
                        </Col06>
                        <Col>
                          <Label>Permit Number</Label>
                          <Input type="text" name="permitNumber" value={formData.permitNumber || ''} onChange={handleInputChange} placeholder="Permit No." />
                        </Col>
                      </Row>
                    </HighlightRow>

                    <Row>
                      <Col2>
                        <Label>Mode of Transport</Label>
                        <CheckGrid>
                          <CheckItem><Radio name="transport" value="hearse" checked readOnly /> Hearse / Van</CheckItem>
                          <CheckItem><Radio name="transport" value="air" readOnly /> Air Transport</CheckItem>
                          <CheckItem><Radio name="transport" value="rail" readOnly /> Rail</CheckItem>
                          <CheckItem><Radio name="transport" value="private" readOnly /> Private Vehicle</CheckItem>
                          <CheckItem><Radio name="transport" value="courier" readOnly /> Courier Service</CheckItem>
                          <CheckItem><Radio name="transport" value="other" readOnly /> Other</CheckItem>
                        </CheckGrid>
                      </Col2>
                    </Row>

                    <Row>
                      <Col2>
                        <Label>Transport Carrier / Driver Name</Label>
                        <Input type="text" name="transportCarrier" placeholder="Company Name or Driver Full Name" />
                      </Col2>
                      <Col>
                        <Label>Vehicle / Carrier ID</Label>
                        <Input type="text" name="vehicleId" placeholder="Vehicle Plate / Carrier Ref. No." />
                      </Col>
                    </Row>

                    <Row>
                      <Col>
                        <Label>Final Destination</Label>
                        <Input type="text" name="finalDestination" placeholder="Cemetery, Mausoleum, Scattering Location, or Other Final Disposition Site" />
                      </Col>
                    </Row>
                  </Section>

                  {/* Section 4: Authorizations */}
                  <Section>
                    <SectionHead>
                      <SectionNum>04</SectionNum>
                      <SectionTitle>Authorizations</SectionTitle>
                    </SectionHead>
                    
                    <CheckGrid>
                      <CheckItem><Checkbox checked readOnly /> Release remains from place of death</CheckItem>
                      <CheckItem><Checkbox checked readOnly /> Authorize transportation as specified above</CheckItem>
                      <CheckItem><Checkbox readOnly /> Embalming authorized</CheckItem>
                      <CheckItem><Checkbox readOnly /> Cremation authorized</CheckItem>
                      <CheckItem><Checkbox readOnly /> Pacemaker / implant removal</CheckItem>
                      <CheckItem><Checkbox readOnly /> Out-of-state transport</CheckItem>
                      <CheckItem><Checkbox readOnly /> Release medical records</CheckItem>
                      <CheckItem><Checkbox readOnly /> Hold remains for pickup</CheckItem>
                    </CheckGrid>
                  </Section>

                  {/* Section 5: Signatures */}
                  <Section>
                    <SectionHead>
                      <SectionNum>05</SectionNum>
                      <SectionTitle>Signatures & Acknowledgments</SectionTitle>
                    </SectionHead>
                    
                    <Row style={{ alignItems: 'flex-end', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                      <Col style={{ flex: 2, minWidth: '300px' }}>
                        <Label>Authorized Signature <span style={{ color: COLORS.red }}>*</span></Label>
                        <SigCanvasWrap>
                          <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>Loading signature pad...</div>}>
                            <ReusableSignaturePad
                              penColor={COLORS.inkBlue}
                              penWidth={2.5}
                              placeholder="Sign here"
                              onChange={setRecipientSignature}
                            />
                          </Suspense>
                        </SigCanvasWrap>
                      </Col>
                      <Col style={{ minWidth: '200px' }}>
                        <Label>Printed Name</Label>
                        <InputLg
                          type="text"
                          value={formData.releasedTo}
                          readOnly
                          placeholder="Auto-filled from Next of Kin"
                        />
                      </Col>
                      <Col05 style={{ minWidth: '120px' }}>
                        <Label>Date</Label>
                        <InputLg
                          type="text"
                          value={new Date().toLocaleDateString()}
                          readOnly
                        />
                      </Col05>
                    </Row>
                  </Section>

                  {/* Section 6: Documentation Checklist */}
                  <Section>
                    <SectionHead>
                      <SectionNum>06</SectionNum>
                      <SectionTitle>Documentation Checklist</SectionTitle>
                    </SectionHead>
                    
                    <CheckGrid>
                      <CheckItem><Checkbox name="docsConfirmed" checked={formData.docsConfirmed} onChange={handleInputChange} required /> All required documents verified and complete</CheckItem>
                      <CheckItem><Checkbox name="allDocsComplete" checked={formData.allDocsComplete} onChange={handleInputChange} /> Medical records released</CheckItem>
                      <CheckItem><Checkbox readOnly checked /> Death certificate issued</CheckItem>
                      <CheckItem><Checkbox readOnly checked /> ID verified</CheckItem>
                      <CheckItem><Checkbox readOnly /> Postmortem report attached (if applicable)</CheckItem>
                    </CheckGrid>
                  </Section>

                  <LegalBlock>
                    <LegalText><strong>DECLARATION:</strong> I, the undersigned, being the legally authorized next of kin or duly appointed representative of the above-named deceased, do hereby authorize the release, removal, and transportation of the remains from the stated place of death to the specified destination and final destination as indicated in this document.</LegalText>
                    <LegalText><strong>CERTIFICATION OF AUTHORITY:</strong> I certify that I possess the legal right and authority to make this authorization under applicable state and local laws. I affirm that no other person holds a superior legal claim to the disposition of these remains.</LegalText>
                    <LegalText><strong>INDEMNIFICATION:</strong> I hereby release, indemnify, and hold harmless the funeral home, its officers, directors, employees, agents, assignees, and any contracted transport provider from and against any and all claims, liabilities, damages, costs, and expenses arising out of or related to this authorization.</LegalText>
                  </LegalBlock>

                  <ActionsContainer>
                    <SecondaryButton type="button" onClick={() => navigate(`/tenant/${getTenantSlug()}/receptionist`)}>
                      ← Back to Reception
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} /> Confirm Release
                        </>
                      )}
                    </PrimaryButton>
                  </ActionsContainer>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: COLORS.bone2, border: `1px solid ${COLORS.line}`, borderRadius: '4px', marginTop: '2rem' }}>
                  <AlertCircle size={48} color={COLORS.brass} style={{ marginBottom: '1rem' }} />
                  <h2 style={{ color: COLORS.ink, marginBottom: '0.5rem', fontFamily: 'Fraunces, serif' }}>Search for Deceased Record</h2>
                  <p style={{ color: COLORS.gray, marginBottom: '1.5rem' }}>Please use the search box above to look up a deceased record by admission number</p>
                </div>
              )}
            </form>
          </FormBody>

          <FooterPanel>
            <FooterText>
              {tenantName} Release Record — Generated {dateIssued}<br/>
              Page 1 of 1 — Original Document
            </FooterText>
            
            <StampWrapper>
              <BarcodeWrapper>
                <Barcode value={releaseId} />
              </BarcodeWrapper>
              <OfficialStamp tenantName={tenantName} tenantPhone={displayPhone} tenantLocation={displayLocation} recordLabel="OFFICIAL RELEASE RECORD" />
            </StampWrapper>
          </FooterPanel>
        </ContentWrapper>
      </FormSheet>

      {/* Premium Success Modal */}
      {showSuccess && (
        <SuccessOverlay>
          <SuccessCard>
            <SuccessIconWrap>
              <CheckCircle size={48} strokeWidth={1.5} />
            </SuccessIconWrap>
            <SuccessTitle>Release Authorized Successfully</SuccessTitle>
            <SuccessText>
              The release record for <strong style={{ color: COLORS.ink }}>{releasedName}</strong> has been successfully processed and securely saved in the system.
            </SuccessText>
            <SuccessActions>
              <PrimaryButton onClick={() => navigate(`/tenant/${getTenantSlug()}/receptionist`)}>
                <Check size={16} /> Back to Reception
              </PrimaryButton>
            </SuccessActions>
          </SuccessCard>
        </SuccessOverlay>
      )}
    </Container>
  );
};

export default ReleaseFormPage;