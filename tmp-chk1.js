import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { resolveTenantBranding } from "../../../utils/tenantResolver/tenantBranding";
import { useTenantStore } from "../../../modules/seo/useTenantStore";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getTenantSlug as getStoredTenantSlug, getAuthToken } from "../../../utils/globalAuth";
import ReusableSignaturePad from "../../../utils/signature/signaturepad";
import { ToastContainer, toast } from "react-toastify";
import InOurCare from "../../common/InOurCare";
import { todayKey } from "../../../utils/dates/parseDates";
import styled, { keyframes } from "styled-components";
import { ENDPOINTS } from "../../../api/endpoints";
import OfficialStamp from "../../../utils/stamp/stamp";
import env from "../../../utils/config/env";
import bwipjs from "@bwip-js/browser";
import notify from "@/utils/notify";
import axios from "axios";
import {
  Check,
  Loader2,
  CheckCircle,
  X,
  FileText,
  User,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Phone,
  IdCard,
  MapPin
} from "../../../utils/icons/icons";
const COLORS = {
  ink: "#1A1A1A",
  bone: "#FAF8F4",
  bone2: "#FFFFFF",
  // Set to white for natural feel
  brass: "#6B4045",
  brassLight: "#A98F6E",
  verdigris: "#3D4F47",
  verdigrisDark: "#2E3F37",
  line: "#E2DDD3",
  gray: "#6B6862",
  muted: "#999999",
  red: "#9B4A3F",
  white: "#FFFFFF",
  inkBlue: "#0f33e7",
  gold: "#C9A227",
  goldDark: "#A8851C",
  tickBlue: "#2564eb1b",
  green: "#22c55e"
};
const GUTTER = "3rem";
const GUTTER_TABLET = "2.5rem";
const GUTTER_MOBILE = "1.5rem";
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

  .Toastify__toast-container { width: 380px !important; max-width: 100% !important; padding: 0 !important; }
  .Toastify__toast { border-radius: 8px !important; font-family: 'Saira', sans-serif !important; font-size: 0.85rem !important; padding: 10px 14px !important; min-height: 44px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; margin-bottom: 0.5rem !important; }
  .Toastify__toast-body { padding: 0 !important; margin: 0 !important; font-size: 0.85rem !important; }
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
  autoComplete: off;
  autoCorrect: off;
  spellCheck: false;
  autoCapitalize:  off;
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

  &::placeholder { color: #a8a29e; font-weight: 400; }
`;
const InputLg = styled(Input)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;

  /* Green "record found in the database" state — mirrors the search tick so it
     is obvious at a glance that the admission number matched a record. */
  ${(p) => p.$found && `
    border-bottom: 2px solid ${COLORS.green};
    background: rgba(34, 197, 94, 0.07);
    border-radius: 4px 4px 0 0;
    padding-left: 0.5rem;
    color: ${COLORS.ink};
  `}
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
const SpinIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.green};

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;
const SearchStatus = styled.span`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${COLORS.green};
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
`;
const ErrorMessage = styled.span`
  color: ${COLORS.red};
  font-size: 0.75rem;
  margin-top: 0.3rem;
  display: block;
  font-family: 'Saira', sans-serif;
`;
const InCareBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  /* Underline only spans the text — hugs the content, no full-width strip. */
  width: fit-content;
  padding: 0 0 0.25rem;
  margin-bottom: 0.85rem;
  border-bottom: 2px solid ${COLORS.green};
  color: ${COLORS.green};
  font-family: 'Saira', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  max-width: 100%;

  svg { flex-shrink: 0; }

  @media (max-width: 768px) {
    white-space: normal;
    text-align: left;
  }
`;
const FieldHint = styled.span`
  display: block;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: ${COLORS.muted};
  font-family: 'Saira', sans-serif;
  line-height: 1.4;
`;
const DeclarationRule = styled.div`
  height: 7px;
  max-width: 120px;
  margin: -0.35rem auto 0.35rem;
  border-top: 2.5px solid ${COLORS.ink};
  border-bottom: 1px solid ${COLORS.ink};
`;
const LeadIn = styled.p`
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${COLORS.brass};
`;
const ClauseList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
`;
const Clause = styled.li`
  display: flex;
  gap: 1rem;
  align-items: baseline;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 0.98rem;
  font-weight: 450;
  line-height: 1.65;
  color: ${COLORS.ink};

  @media (max-width: 600px) {
    font-size: 0.92rem;
  }
`;
const ClauseNo = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${COLORS.brass};
  flex: none;
  width: 1.4rem;
  text-align: right;
`;
const ClauseFacility = styled.span`
  font-weight: 600;
  color: ${COLORS.brass};
`;
const ConsentDivider = styled.div`
  height: 1px;
  background: ${COLORS.line};
  margin: 1.4rem 0 1.2rem;
`;
const AcceptLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  cursor: pointer;
  user-select: none;
`;
const AcceptText = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.5;
  color: ${COLORS.ink};
  padding-top: 0.1rem;
`;
const AcceptSmall = styled.small`
  display: block;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: ${COLORS.gray};
`;
const AcceptBox = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 21px;
  height: 21px;
  flex: none;
  margin-top: 0.05rem;
  position: relative;
  border: 1.5px solid ${COLORS.ink};
  border-radius: 3px;
  background: ${COLORS.white};
  cursor: pointer;
  transition: all .15s ease;

  &:hover { border-color: ${COLORS.verdigris}; }
  &:checked { background: ${COLORS.verdigris}; border-color: ${COLORS.verdigris}; }
  &:checked::after {
    content: '';
    position: absolute;
    left: 7px;
    top: 3px;
    width: 5px;
    height: 10px;
    border: solid ${COLORS.bone};
    border-width: 0 2.5px 2.5px 0;
    transform: rotate(45deg);
  }
  &:focus-visible { outline: 2px solid ${COLORS.brassLight}; outline-offset: 2px; }
`;
const ConsentError = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: ${COLORS.red};
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

  @media (max-width: 768px) {
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

  @media (max-width: 768px) {
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

  @media (max-width: 768px) {
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
const PinIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 32 32", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("path", { d: "M25.497 6.503l.001-.003-.004.005L3.5 15.901l11.112 1.489 1.487 11.11 9.396-21.992.005-.006z" }) });
const PhoneIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 20 20", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("g", { transform: "translate(-140.000000, -7319.000000)", children: /* @__PURE__ */ jsx("g", { transform: "translate(56.000000, 160.000000)", children: /* @__PURE__ */ jsx("path", { d: "M94,7167 L94,7169 L96,7169 C96,7167.895 95.105,7167 94,7167 M94,7163 L94,7165 C96.206,7165 98,7166.794 98,7169 L100,7169 C100,7165.686 97.314,7163 94,7163 M94,7159 L94,7161 C98.411,7161 102,7164.589 102,7169 L104,7169 C104,7163.477 99.523,7159 94,7159 M98.652,7177.234 C98.641,7177.265 98.64,7177.27 98.652,7177.234 M98.117,7174.578 C97.422,7174.204 96.719,7173.778 95.992,7173.481 C94.587,7172.908 94.682,7174.602 93.679,7175.151 C93.027,7175.508 92.107,7174.861 91.538,7174.503 C90.544,7173.877 89.663,7173.053 88.931,7172.1 C88.556,7171.613 87.728,7170.697 87.83,7170.014 C87.992,7168.93 89.274,7168.876 88.907,7167.55 C88.711,7166.84 88.36,7166.141 88.097,7165.457 C87.745,7164.54 87.6,7163.953 86.573,7164.003 C85.831,7164.039 85.339,7164.356 84.883,7164.951 C83.649,7166.558 83.835,7168.725 84.664,7170.488 C85.838,7172.983 87.85,7175.335 89.999,7176.855 C91.461,7177.889 93.387,7178.828 95.157,7178.987 C96.453,7179.104 98.266,7178.403 98.73,7176.996 C98.698,7177.094 98.667,7177.189 98.652,7177.234 C98.663,7177.199 98.687,7177.128 98.73,7176.996 C98.777,7176.854 98.8,7176.783 98.811,7176.751 C98.797,7176.793 98.765,7176.891 98.731,7176.993 C99.139,7175.753 99.189,7175.155 98.117,7174.578 M98.811,7176.751 C98.819,7176.727 98.819,7176.725 98.811,7176.751" }) }) }) });
const MailIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 -3.5 32 32", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("g", { transform: "translate(-414.000000, -261.000000)", children: /* @__PURE__ */ jsx("path", { d: "M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z" }) }) });
const formatHeaderDate = (value) => {
  if (!value) return "\u2014";
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
const getDaysInCare = (admittedFrom, until) => {
  if (!admittedFrom) return null;
  const raw = String(admittedFrom);
  const start = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(start.getTime())) return null;
  let end = /* @__PURE__ */ new Date();
  if (until) {
    const rawUntil = String(until);
    const parsedUntil = new Date(rawUntil.length <= 10 ? `${rawUntil}T00:00:00` : rawUntil);
    if (!Number.isNaN(parsedUntil.getTime())) end = parsedUntil;
  }
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor((startOfDay(end) - startOfDay(start)) / (1e3 * 60 * 60 * 24));
  return Math.max(0, days);
};
const Barcode = ({ value }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) {
      try {
        const text = value || "AWAITING-ID";
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128",
          text,
          scale: 2,
          height: 8,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value]);
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      style: { display: "block", width: "auto", maxWidth: "100%", height: "40px", marginLeft: "auto" }
    }
  );
};
const DeceasedReleaseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, slug: urlTenantSlug } = useParams();
  const { tenantData } = useTenantStore();
  const getTenantSlug = () => {
    const exact = urlTenantSlug && urlTenantSlug !== "default" && urlTenantSlug !== "dashboard" && urlTenantSlug !== "undefined" && urlTenantSlug !== "null" ? urlTenantSlug : "";
    return exact || getStoredTenantSlug() || "";
  };
  const sigPadRef1 = useRef(null);
  const searchTimer = useRef(null);
  const lastSearchedRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingDeceasedList, setIsLoadingDeceasedList] = useState(false);
  const [isLoadingDeceased, setIsLoadingDeceased] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deceasedList, setDeceasedList] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releaseId, setReleaseId] = useState("");
  const [releasedRecord, setReleasedRecord] = useState(null);
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.email || user.userEmail || "";
    } catch {
      return "";
    }
  };
  const getLoggedInUserName = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.full_name || user.name || user.userName || user.email || "";
    } catch {
      return "";
    }
  };
  const getCurrentTime = () => {
    const now = /* @__PURE__ */ new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };
  const getGreetingTime = () => {
    const hours = (/* @__PURE__ */ new Date()).getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };
  const initialFormData = {
    admission_number: location.state?.permitNumber || "",
    // Date admitted is not captured on the release form — it is read-only data
    // that arrives with the searched record (used for the "days in our care"
    // badge), never typed here.
    date_admitted: "",
    time_received: getCurrentTime(),
    full_name: "",
    gender: "",
    age: "",
    date_of_death: "",
    cause_of_death: "",
    place_of_death: "",
    body_status: "Released",
    contact_person: "",
    next_kin: "",
    relationship: "",
    // ID type is internal — the release record always files it as 'National ID';
    // users are never asked to choose a type on this form.
    id_type: "National ID",
    id_number: "",
    tel_number: "",
    // Kenya-local today (never UTC-shifted) — see the import note above.
    release_date: todayKey(),
    release_time: getCurrentTime(),
    released_by: getLoggedInUserName(),
    permit_number: "",
    mode_of_transport: "hearse",
    // Where the body is being taken after handover (home, cemetery, another
    // mortuary…) — part of the transportation record for the release.
    final_destination: "",
    // Plate number of the vehicle removing the body (hearse, van or the
    // family's own car) — recorded with the release for the official record.
    plate_number: "",
    terms_accepted: false,
    // Kept for API compatibility — the body-release schema still expects this
    // boolean, but the "all charges paid" checkbox was removed from the form.
    everything_paid: false,
    signature: "",
    verified_by: getLoggedInUserEmail()
  };
  const [formData, setFormData] = useState(initialFormData);
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      time_received: getCurrentTime(),
      release_time: getCurrentTime()
    }));
  }, []);
  const daysInCare = useMemo(
    () => getDaysInCare(formData.date_admitted, formData.release_date),
    [formData.date_admitted, formData.release_date]
  );
  useEffect(() => {
    const fetchDeceasedList = async () => {
      const tenantSlug = getTenantSlug();
      setIsLoadingDeceasedList(true);
      try {
        const response = await axios.get(`${env.FULL_API_URL}${ENDPOINTS.BODYCHECKOUT.DECEASED_LIST}`, {
          headers: {
            "x-tenant-slug": tenantSlug,
            "Authorization": `Bearer ${getAuthToken()}`
          }
        });
        const result = response.data?.data || response.data || [];
        if (Array.isArray(result) && result.length > 0) {
          const unreleased = result.filter(
            (d) => d.body_status !== "Released" && d.body_status !== "Transferred"
          );
          setDeceasedList(unreleased);
        }
      } catch (error) {
        console.error("Error fetching deceased list:", error);
      } finally {
        setIsLoadingDeceasedList(false);
      }
    };
    fetchDeceasedList();
  }, []);
  useEffect(() => {
    const fetchDeceasedData = async () => {
      const deceasedId = id || location.state?.deceasedId || location.state?.deceasedData?.deceased_id || location.state?.deceasedData?.id;
      if (!deceasedId) return;
      setIsLoadingDeceased(true);
      try {
        const tenantSlug = getTenantSlug();
        const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.BODYCHECKOUT.DECEASED_DETAIL(deceasedId)}`, {
          headers: {
            "x-tenant-slug": tenantSlug,
            "Authorization": `Bearer ${getAuthToken()}`
          }
        });
        const result = await response.json();
        if (response.ok && result.data) {
          fillDeceasedIntoForm(result.data);
          setFormData((prev) => ({
            ...prev,
            release_date: todayKey(),
            release_time: getCurrentTime()
          }));
        }
      } catch (error) {
        console.error("Error fetching deceased data:", error);
      } finally {
        setIsLoadingDeceased(false);
      }
    };
    fetchDeceasedData();
  }, [id, location.state]);
  const clearDeceasedInfo = () => {
    setFormData((prev) => ({
      ...prev,
      full_name: "",
      gender: "",
      age: "",
      date_of_death: "",
      cause_of_death: "",
      place_of_death: "",
      next_kin: "",
      contact_person: "",
      relationship: "",
      id_number: "",
      tel_number: "",
      permit_number: ""
    }));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    if (name === "admission_number" || name === "plate_number") {
      processedValue = value.toUpperCase();
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue
    }));
    if (name === "admission_number") {
      setIsFound(false);
      clearDeceasedInfo();
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (message.text) setMessage({ type: "", text: "" });
  };
  useEffect(() => {
    const admissionNumber = String(formData.admission_number || "").trim().toUpperCase();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!admissionNumber) {
      setIsSearching(false);
      setIsFound(false);
      lastSearchedRef.current = "";
      setErrors((prev) => ({ ...prev, admission_number: "" }));
      return;
    }
    if (isFound && admissionNumber === lastSearchedRef.current) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setIsFound(false);
    setErrors((prev) => ({ ...prev, admission_number: "" }));
    searchTimer.current = setTimeout(() => {
      if (String(formData.admission_number || "").trim().toUpperCase() === admissionNumber) {
        lastSearchedRef.current = admissionNumber;
        handleAdmissionSearch(admissionNumber);
      }
    }, 800);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [formData.admission_number, isFound]);
  const fillDeceasedIntoForm = (deceased) => {
    setErrors((prev) => ({ ...prev, admission_number: "", full_name: "", gender: "" }));
    setIsFound(true);
    setIsSearching(false);
    const foundAdmissionNumber = String(deceased.admission_number || "").trim().toUpperCase();
    lastSearchedRef.current = foundAdmissionNumber;
    const kinName = deceased.contact_person || deceased.next_kin || deceased.next_of_kin || "";
    setFormData((prev) => ({
      ...prev,
      admission_number: prev.admission_number || foundAdmissionNumber,
      full_name: deceased.full_name || deceased.name_of_deceased || "",
      gender: deceased.gender || "",
      age: deceased.age || "",
      date_of_death: deceased.date_of_death || "",
      cause_of_death: deceased.cause_of_death || "",
      place_of_death: deceased.place_of_death || deceased.death_location || "",
      next_kin: kinName,
      contact_person: deceased.contact_person || deceased.next_kin || "",
      relationship: deceased.relationship || deceased.kin_relationship || "",
      // NOTE: the ID number and the primary telephone belong to the person
      // collecting the body — they are never auto-filled from the searched
      // record and must always be keyed in manually.
      date_admitted: deceased.date_admitted || prev.date_admitted,
      permit_number: deceased.permit_number || deceased.permit_no || ""
    }));
  };
  const handleAdmissionSearch = async (admissionNumberStr) => {
    const admissionNumber = String(admissionNumberStr || "").trim().toUpperCase();
    if (!admissionNumber) {
      setErrors((prev) => ({ ...prev, admission_number: "Enter an admission number to search" }));
      return;
    }
    if (lastSearchedRef.current === admissionNumber && isFound) {
      return;
    }
    setIsSearching(true);
    setIsFound(false);
    setErrors((prev) => ({ ...prev, admission_number: "" }));
    setMessage({ type: "", text: "" });
    try {
      const tenantSlug = getTenantSlug();
      const response = await axios.get(
        `${env.FULL_API_URL}${ENDPOINTS.BODYCHECKOUT.DECEASED_BY_ADMISSION(encodeURIComponent(admissionNumber))}`,
        {
          headers: {
            "x-tenant-slug": tenantSlug,
            "Authorization": `Bearer ${getAuthToken()}`
          }
        }
      );
      const result = response.data;
      if (!result.success) throw new Error(result.message || "Failed to fetch");
      const deceased = result.data;
      if (!deceased) {
        throw new Error("not-found");
      }
      fillDeceasedIntoForm(deceased);
    } catch (error) {
      const apiError = error?.response?.data?.message || error?.message || "Search failed";
      setIsFound(false);
      setErrors((prev) => ({
        ...prev,
        admission_number: apiError === "No-checkout" || /not found/i.test(String(apiError)) ? `No deceased record found for admission number "${admissionNumber}".` : apiError
      }));
      clearDeceasedInfo();
    } finally {
      setIsSearching(false);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.admission_number) newErrors.admission_number = "Admission number is required";
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.release_date) newErrors.release_date = "Release date is required";
    if (!formData.released_by.trim()) newErrors.released_by = "Released by is required";
    if (!formData.next_kin.trim()) newErrors.next_kin = "Next of kin is required";
    if (!formData.id_number.trim()) newErrors.id_number = "ID number is required";
    if (!formData.tel_number.trim()) newErrors.tel_number = "Telephone number is required";
    if (!formData.plate_number.trim()) newErrors.plate_number = "Vehicle plate number is required";
    if (!formData.final_destination.trim()) newErrors.final_destination = "Final destination is required";
    if (!formData.terms_accepted) newErrors.terms_accepted = "You must accept the terms";
    if (formData.tel_number && !/^(\+254|0)[17]\d{8}$/.test(formData.tel_number.replace(/\s/g, ""))) {
      newErrors.tel_number = "Please enter a valid Kenyan phone number";
    }
    if (sigPadRef1.current?.isEmpty()) {
      newErrors.signature = "Signature is required to proceed";
    }
    setErrors(newErrors);
    return newErrors;
  };
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const missingFields = Object.values(validationErrors);
      notify.info("Missing required details", `Please complete the following: ${missingFields.join(", ")}`);
      setMessage({
        type: "error",
        text: `Please complete all required fields: ${missingFields.join(", ")}`
      });
      return;
    }
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken();
      const signatureData = sigPadRef1.current?.toDataURL();
      const freshTime = getCurrentTime();
      const payload = {
        ...formData,
        admission_number: String(formData.admission_number || "").toUpperCase(),
        time_received: freshTime,
        release_time: freshTime,
        age: formData.age ? parseInt(formData.age, 10) : null,
        // Body status is a database value only — it is never surfaced in the
        // release form UI.
        body_status: "Released",
        verified_by: formData.verified_by || getLoggedInUserEmail() || null,
        signature: signatureData,
        name_of_deceased: formData.full_name,
        tell_number: formData.tel_number,
        // Where the body is going after handover — always sent as a string so
        // the API contract (final_destination?: string) is never violated.
        final_destination: String(formData.final_destination || "").trim()
      };
      const response = await fetch(`${env.FULL_API_URL}${ENDPOINTS.BODYCHECKOUT.CHECKOUT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Release failed");
      }
      notify.success(
        "Release Successful",
        `${formData.full_name || "The record"} has been released successfully.`
      );
      if (result.data && result.data.release_id) {
        setReleaseId(result.data.release_id);
      }
      setReleasedRecord({
        full_name: formData.full_name,
        date_of_death: formData.date_of_death,
        admission_number: String(formData.admission_number || "").toUpperCase(),
        release_id: result.data?.release_id || "",
        release_date: formData.release_date,
        signature: result.data?.signature || signatureData || "",
        staff_signature: result.data?.staff_signature || ""
      });
      setShowSuccess(true);
      setFormData({
        ...initialFormData,
        verified_by: getLoggedInUserEmail(),
        time_received: getCurrentTime(),
        release_time: getCurrentTime(),
        date_admitted: "",
        release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      });
      sigPadRef1.current?.clear();
      setErrors({});
    } catch (error) {
      notify.error("Release failed", error.message || "Please check the details and try again.");
      setMessage({
        type: "error",
        text: error.message || "Something went wrong. Please try again."
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
      release_time: getCurrentTime(),
      date_admitted: "",
      release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setErrors({});
    setMessage({ type: "", text: "" });
    setReleaseId("");
    setShowSuccess(false);
    setReleasedRecord(null);
    setIsFound(false);
    setIsSearching(false);
    lastSearchedRef.current = "";
    sigPadRef1.current?.clear();
  };
  const hasValue = (val) => val !== void 0 && val !== null && String(val).trim().length > 0;
  if (isLoadingDeceased && !showSuccess) {
    return /* @__PURE__ */ jsx(Container, { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }, children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsx(Loader2, { size: 48, color: COLORS.ink, className: "animate-spin" }),
      /* @__PURE__ */ jsx("p", { style: { marginTop: "1rem", fontSize: "0.85rem", color: COLORS.gray, fontFamily: "Saira", textTransform: "uppercase", letterSpacing: "0.1em" }, children: "Loading Record..." })
    ] }) });
  }
  if (isSubmitting) {
    return /* @__PURE__ */ jsx(Container, { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }, children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsx(Loader2, { size: 48, color: COLORS.ink, className: "animate-spin" }),
      /* @__PURE__ */ jsx("p", { style: { marginTop: "1rem", fontSize: "0.85rem", color: COLORS.gray, fontFamily: "Saira", textTransform: "uppercase", letterSpacing: "0.1em" }, children: "Processing Release..." })
    ] }) });
  }
  if (showSuccess) {
    const rec = releasedRecord || {};
    return /* @__PURE__ */ jsx(
      InOurCare,
      {
        mode: "release",
        name: rec.full_name || "The deceased",
        passed: rec.date_of_death,
        reference: rec.release_id || rec.admission_number || "",
        onDone: () => {
          const slug = typeof getTenantSlug === "function" && getTenantSlug() || localStorage.getItem("tenantSlug") || "";
          navigate(slug ? `/tenant/${slug}/receptionist` : "/reception");
        }
      }
    );
  }
  return /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsx(
      ToastContainer,
      {
        position: "top-right",
        autoClose: 5e3,
        hideProgressBar: false,
        newestOnTop: true,
        closeOnClick: true,
        rtl: false,
        pauseOnFocusLoss: true,
        draggable: true,
        pauseOnHover: true,
        theme: "light",
        limit: 3
      }
    ),
    /* @__PURE__ */ jsxs(FormSheet, { children: [
      /* @__PURE__ */ jsx(Watermark, { children: "OFFICIAL RECORD" }),
      /* @__PURE__ */ jsxs(ContentWrapper, { children: [
        /* @__PURE__ */ jsx(HeaderWrapper, { children: /* @__PURE__ */ jsxs(HeaderMain, { children: [
          /* @__PURE__ */ jsxs(ColLeft, { children: [
            /* @__PURE__ */ jsxs(GreetingBlock, { children: [
              /* @__PURE__ */ jsx(GreetingWelcome, { children: "Welcome to" }),
              /* @__PURE__ */ jsx(TextSlider, { children: /* @__PURE__ */ jsxs(TextTrack, { children: [
                /* @__PURE__ */ jsx(Phrase, { children: tenantName }),
                /* @__PURE__ */ jsx(Phrase, { children: "Sorry for your loss" }),
                /* @__PURE__ */ jsx(Phrase, { children: "With deepest sympathy" }),
                /* @__PURE__ */ jsx(Phrase, { children: "May they rest in peace" })
              ] }) }),
              /* @__PURE__ */ jsx(GreetingTime, { children: getGreetingTime() })
            ] }),
            /* @__PURE__ */ jsxs(FacilityInfo, { children: [
              /* @__PURE__ */ jsx(SectionLabel, { children: "Facility Information" }),
              /* @__PURE__ */ jsxs(ContactItem, { children: [
                /* @__PURE__ */ jsx(PinIcon, {}),
                displayAddress || fallback.address || fallback.location
              ] }),
              /* @__PURE__ */ jsxs(ContactItem, { children: [
                /* @__PURE__ */ jsx(MailIcon, {}),
                displayEmail || fallback.email
              ] }),
              /* @__PURE__ */ jsxs(ContactItem, { children: [
                /* @__PURE__ */ jsx(PhoneIcon, {}),
                displayPhone || fallback.phone
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(ColRight, { children: [
            /* @__PURE__ */ jsxs(DateDisplay, { children: [
              /* @__PURE__ */ jsx(DateLabel, { children: "Record Date" }),
              /* @__PURE__ */ jsx(DateValue, { children: formatHeaderDate(formData.release_date) })
            ] }),
            /* @__PURE__ */ jsxs(VerificationBlock, { children: [
              /* @__PURE__ */ jsx(AdmissionNumber, { children: formData.admission_number || "AWAITING-ID" }),
              /* @__PURE__ */ jsx(Barcode, { value: formData.admission_number }),
              /* @__PURE__ */ jsx(DeceasedName, { children: formData.full_name || "\u2014" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(FormBody, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "01" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Release & Facility Information" })
            ] }),
            /* @__PURE__ */ jsx(Row, { children: /* @__PURE__ */ jsxs(Col2, { children: [
              /* @__PURE__ */ jsxs(Label, { children: [
                "Admission Number ",
                /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                /* @__PURE__ */ jsx(
                  InputLg,
                  {
                    type: "text",
                    name: "admission_number",
                    value: formData.admission_number,
                    onChange: handleChange,
                    onKeyDown: (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchTimer.current) clearTimeout(searchTimer.current);
                        handleAdmissionSearch(formData.admission_number);
                      }
                    },
                    $found: hasValue(formData.admission_number) && isFound,
                    placeholder: "Start typing to search the database...",
                    autoComplete: "off",
                    autoCorrect: "off",
                    autoCapitalize: "off",
                    spellCheck: "false",
                    style: { textTransform: "uppercase" }
                  }
                ),
                isSearching ? /* @__PURE__ */ jsxs(SearchStatus, { children: [
                  /* @__PURE__ */ jsx(SpinIcon, { children: /* @__PURE__ */ jsx(Loader2, { size: 14 }) }),
                  "Searching..."
                ] }) : hasValue(formData.admission_number) && isFound ? /* @__PURE__ */ jsxs(TickIconWrapper, { style: { color: COLORS.green }, children: [
                  /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }),
                  /* @__PURE__ */ jsx("span", { style: { fontSize: "0.65rem", color: COLORS.green, fontWeight: 700, marginLeft: "0.3rem" }, children: "Found" })
                ] }) : !isSearching && hasValue(formData.admission_number) && !isFound && errors.admission_number ? /* @__PURE__ */ jsxs(SearchStatus, { style: { color: COLORS.red }, children: [
                  /* @__PURE__ */ jsx(X, { size: 14 }),
                  " Not Found"
                ] }) : null
              ] }),
              errors.admission_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.admission_number })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "02" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Deceased Information" })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col2, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Full Legal Name of Deceased ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    InputLg,
                    {
                      type: "text",
                      name: "full_name",
                      value: formData.full_name,
                      onChange: handleChange,
                      placeholder: "Enter full legal name"
                    }
                  ),
                  hasValue(formData.full_name) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.full_name && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.full_name })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Gender" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "gender",
                      value: formData.gender || "\u2014",
                      readOnly: true,
                      title: "Auto-filled from the deceased record"
                    }
                  ),
                  hasValue(formData.gender) && /* @__PURE__ */ jsx(TickIconWrapper, { style: { color: COLORS.green }, children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                /* @__PURE__ */ jsx(FieldHint, { children: "Auto-filled from the deceased record." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Age" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "number",
                      name: "age",
                      value: formData.age,
                      onChange: handleChange,
                      placeholder: "Years"
                    }
                  ),
                  hasValue(formData.age) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Date of Death" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "date",
                      name: "date_of_death",
                      value: formData.date_of_death,
                      readOnly: true,
                      title: "Auto-filled from the deceased record"
                    }
                  ),
                  hasValue(formData.date_of_death) && /* @__PURE__ */ jsx(TickIconWrapper, { style: { color: COLORS.green }, children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                /* @__PURE__ */ jsx(FieldHint, { children: "Auto-filled from the deceased record." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Cause of Death" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "cause_of_death",
                      value: formData.cause_of_death,
                      onChange: handleChange,
                      placeholder: "As certified on medical document"
                    }
                  ),
                  hasValue(formData.cause_of_death) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Place of Death" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "place_of_death",
                      value: formData.place_of_death,
                      onChange: handleChange,
                      placeholder: "Location/Hospital"
                    }
                  ),
                  hasValue(formData.place_of_death) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Row, { children: /* @__PURE__ */ jsxs(Col, { children: [
              /* @__PURE__ */ jsx(Label, { children: "Permit Number" }),
              /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "text",
                    name: "permit_number",
                    value: formData.permit_number,
                    onChange: handleChange,
                    placeholder: "Permit/Reference Number"
                  }
                ),
                hasValue(formData.permit_number) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "03" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Next of Kin / Authorizing Party" })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col2, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Next of Kin Full Name ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "next_kin",
                      value: formData.next_kin,
                      onChange: handleChange,
                      placeholder: "Full name of authorizing party"
                    }
                  ),
                  hasValue(formData.next_kin) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.next_kin && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.next_kin })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Relationship" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "relationship",
                      value: formData.relationship,
                      onChange: handleChange,
                      placeholder: "e.g. Spouse, Child, Sibling"
                    }
                  ),
                  hasValue(formData.relationship) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Row, { children: /* @__PURE__ */ jsxs(Col2, { children: [
              /* @__PURE__ */ jsxs(Label, { children: [
                "ID Number ",
                /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "text",
                    name: "id_number",
                    value: formData.id_number,
                    onChange: handleChange,
                    placeholder: "National ID number"
                  }
                ),
                hasValue(formData.id_number) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
              ] }),
              errors.id_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.id_number })
            ] }) }),
            /* @__PURE__ */ jsx(Row, { children: /* @__PURE__ */ jsxs(Col2, { children: [
              /* @__PURE__ */ jsxs(Label, { children: [
                "Primary Telephone ",
                /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
              ] }),
              /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "tel",
                    name: "tel_number",
                    value: formData.tel_number,
                    onChange: handleChange,
                    placeholder: "e.g., 0712345678"
                  }
                ),
                hasValue(formData.tel_number) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
              ] }),
              errors.tel_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.tel_number })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "04" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Removal, Transportation & Release Details" })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Release Date ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    InputLg,
                    {
                      type: "date",
                      name: "release_date",
                      value: formData.release_date,
                      onChange: handleChange
                    }
                  ),
                  hasValue(formData.release_date) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.release_date && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.release_date })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Release Time" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    InputLg,
                    {
                      type: "time",
                      name: "release_time",
                      value: formData.release_time,
                      onChange: handleChange
                    }
                  ),
                  hasValue(formData.release_time) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Mode of Transport" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsxs(
                    Select,
                    {
                      name: "mode_of_transport",
                      value: formData.mode_of_transport,
                      onChange: handleChange,
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "hearse", children: "Hearse / Van" }),
                        /* @__PURE__ */ jsx("option", { value: "air", children: "Air Transport" }),
                        /* @__PURE__ */ jsx("option", { value: "rail", children: "Rail" }),
                        /* @__PURE__ */ jsx("option", { value: "private", children: "Private Vehicle" }),
                        /* @__PURE__ */ jsx("option", { value: "courier", children: "Courier Service" }),
                        /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
                      ]
                    }
                  ),
                  hasValue(formData.mode_of_transport) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Vehicle Plate Number ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "plate_number",
                      value: formData.plate_number,
                      onChange: handleChange,
                      placeholder: "e.g., KCA 123A"
                    }
                  ),
                  hasValue(formData.plate_number) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.plate_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.plate_number })
              ] }),
              /* @__PURE__ */ jsxs(Col2, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Final Destination / Location ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "final_destination",
                      value: formData.final_destination,
                      onChange: handleChange,
                      placeholder: "e.g., Lang'ata Cemetery, Nairobi"
                    }
                  ),
                  hasValue(formData.final_destination) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.final_destination && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.final_destination })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "05" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Consent and Declaration" })
            ] }),
            /* @__PURE__ */ jsx(DeclarationRule, { "aria-hidden": "true" }),
            /* @__PURE__ */ jsx(LeadIn, { children: "By signing below, I declare and confirm that:" }),
            /* @__PURE__ */ jsxs(ClauseList, { children: [
              /* @__PURE__ */ jsxs(Clause, { children: [
                /* @__PURE__ */ jsx(ClauseNo, { children: "1." }),
                /* @__PURE__ */ jsx("span", { children: "The information I have provided in this form is true and correct." })
              ] }),
              /* @__PURE__ */ jsxs(Clause, { children: [
                /* @__PURE__ */ jsx(ClauseNo, { children: "2." }),
                /* @__PURE__ */ jsx("span", { children: "I am the legally authorized next of kin, or a duly appointed representative of the deceased." })
              ] }),
              /* @__PURE__ */ jsxs(Clause, { children: [
                /* @__PURE__ */ jsx(ClauseNo, { children: "3." }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "I authorize ",
                  /* @__PURE__ */ jsx(ClauseFacility, { children: tenantName || "the facility" }),
                  " to release the deceased into my custody and permit their transportation."
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Clause, { children: [
                /* @__PURE__ */ jsx(ClauseNo, { children: "4." }),
                /* @__PURE__ */ jsx("span", { children: "After the release, I take full responsibility for the deceased and all arrangements that follow." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ConsentDivider, {}),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }, children: [
              /* @__PURE__ */ jsxs(AcceptLabel, { children: [
                /* @__PURE__ */ jsx(
                  AcceptBox,
                  {
                    type: "checkbox",
                    name: "terms_accepted",
                    checked: formData.terms_accepted,
                    onChange: handleChange
                  }
                ),
                /* @__PURE__ */ jsxs(AcceptText, { children: [
                  "I have read and accept this Consent and Declaration.",
                  /* @__PURE__ */ jsx(AcceptSmall, { children: "Signing this form makes it part of the official record of the deceased." })
                ] })
              ] }),
              errors.terms_accepted && /* @__PURE__ */ jsx(ConsentError, { children: "\u26A0 Please tick the box above to confirm before submitting." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "06" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Verification & Digital Sign-off" })
            ] }),
            /* @__PURE__ */ jsx(SignOffContainer, { children: /* @__PURE__ */ jsxs(SignOffGrid, { children: [
              /* @__PURE__ */ jsxs(GridSig, { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxs(Label, { children: [
                    "Authorizing Signature",
                    hasValue(formData.full_name) ? ` of ${formData.full_name}` : " of the deceased",
                    /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: " *" })
                  ] }),
                  /* @__PURE__ */ jsx(ClearSigButton, { type: "button", onClick: () => sigPadRef1.current?.clear(), children: "Clear Pad" })
                ] }),
                /* @__PURE__ */ jsxs(SigCanvasWrap, { children: [
                  /* @__PURE__ */ jsx(ReusableSignaturePad, { ref: sigPadRef1, penColor: COLORS.inkBlue }),
                  /* @__PURE__ */ jsx(SigGuideText, { children: "Sign within boundaries" })
                ] }),
                errors.signature && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.signature })
              ] }),
              /* @__PURE__ */ jsxs(GridRight, { children: [
                /* @__PURE__ */ jsxs(GridName, { children: [
                  daysInCare !== null && /* @__PURE__ */ jsxs(
                    InCareBadge,
                    {
                      title: `${formData.full_name || "The deceased"} \u2014 ${daysInCare} day${daysInCare === 1 ? "" : "s"} in our care`,
                      children: [
                        /* @__PURE__ */ jsx(Check, { size: 13, strokeWidth: 3 }),
                        daysInCare === 0 ? "In our care today" : `${daysInCare} day${daysInCare === 1 ? "" : "s"} in our care`
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(Label, { children: [
                    "Released By ",
                    /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                  ] }),
                  /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        type: "text",
                        name: "released_by",
                        value: formData.released_by,
                        onChange: handleChange,
                        placeholder: "Officer full name"
                      }
                    ),
                    hasValue(formData.released_by) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                  ] }),
                  errors.released_by && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.released_by }),
                  /* @__PURE__ */ jsx(FieldHint, { children: "Officer releasing the body." })
                ] }),
                /* @__PURE__ */ jsx(StampWrapper, { children: /* @__PURE__ */ jsx(
                  OfficialStamp,
                  {
                    tenantName,
                    tenantPhone: displayPhone || fallback.phone,
                    tenantLocation: displayLocation || fallback.location,
                    recordLabel: "OFFICIAL RELEASE RECORD"
                  }
                ) })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(ActionsContainer, { children: [
            /* @__PURE__ */ jsx(GoldButton, { type: "button", onClick: handleClear, disabled: isSubmitting, children: "Reset Inputs" }),
            /* @__PURE__ */ jsx(BlackButton, { type: "button", onClick: () => navigate(-1), disabled: isSubmitting, children: "Cancel / Back" }),
            /* @__PURE__ */ jsx(PrimaryButton, { type: "submit", disabled: isSubmitting, children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
              " Submitting Release..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "Submit Release ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(RecordInfoStrip, { children: [
          tenantName || "This Funeral Home",
          " \u2014 Generated ",
          (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          " at ",
          (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
          /* @__PURE__ */ jsx("br", {}),
          "- Official Release Record -"
        ] }),
        /* @__PURE__ */ jsxs(ElegantFooter, { children: [
          /* @__PURE__ */ jsx(LeafMark, { children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "#EDE9DB", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", width: "21", height: "21", children: [
            /* @__PURE__ */ jsx("path", { d: "M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" }),
            /* @__PURE__ */ jsx("path", { d: "M4 20c4-6.5 8.5-10 13-12.5" })
          ] }) }),
          /* @__PURE__ */ jsx(FooterTagline, { children: "Received with dignity. Cared for with respect. Remembered with love." }),
          /* @__PURE__ */ jsxs(FooterValues, { children: [
            /* @__PURE__ */ jsx(FooterValueLabel, { children: "Dignity" }),
            /* @__PURE__ */ jsx(FooterValueDot, { children: "\xB7" }),
            /* @__PURE__ */ jsx(FooterValueLabel, { children: "Care" }),
            /* @__PURE__ */ jsx(FooterValueDot, { children: "\xB7" }),
            /* @__PURE__ */ jsx(FooterValueLabel, { children: "Respect" })
          ] }),
          /* @__PURE__ */ jsxs(FooterBar, { children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "\xA9 ",
              (/* @__PURE__ */ new Date()).getFullYear(),
              " ",
              tenantName || "This Funeral Home"
            ] }),
            /* @__PURE__ */ jsx("span", { children: "Official Release Record" })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export default DeceasedReleaseForm;
