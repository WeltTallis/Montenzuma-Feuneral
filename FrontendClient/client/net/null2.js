import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { resolveTenantBranding } from "../../../utils/tenantResolver/tenantBranding";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getTenantSlug, getAuthToken } from "../../../utils/globalAuth";
import ReusableSignaturePad from "../../../utils/signature/signaturepad";
import { ToastContainer, toast } from "react-toastify";
import styled, { keyframes } from "styled-components";
import { ENDPOINTS } from "../../../api/endpoints";
import OfficialStamp from "../../stamp/stamp";
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
  ink: "#15171A",
  bone: "#FAF8F4",
  bone2: "#F3EFE6",
  brass: "#8B7355",
  brassLight: "#A98F6E",
  verdigris: "#3D4F47",
  verdigrisDark: "#2E3F37",
  verdigrisLight: "#4D6359",
  verdigrisTint: "#EBEFEF",
  line: "#E3DDD0",
  lineDark: "rgba(250,248,244,0.14)",
  gray: "#6B6862",
  grayLight: "rgba(250,248,244,0.62)",
  red: "#9B4A3F",
  redBg: "#F7ECE9",
  redLine: "#E8D2CC",
  success: "#475A43",
  successBg: "#EEF3EC",
  white: "#FFFFFF",
  inkBlue: "#0f33e7",
  stampBlue: "#0f33e7",
  stampRed: "#dc2626",
  gold: "#C9A227",
  goldDark: "#A8851C",
  tickBlue: "#2564eb1b",
  green: "#22c55e"
};
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bone2};
  font-family: 'Saira', sans-serif;
  color: ${COLORS.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;

  .Toastify__toast-container { width: 380px !important; max-width: 90vw !important; padding: 0 !important; }
  .Toastify__toast { border-radius: 8px !important; font-family: 'Saira', sans-serif !important; font-size: 0.85rem !important; padding: 10px 14px !important; min-height: 44px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; margin-bottom: 0.5rem !important; }
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
const HeaderBand = styled.div`
  background: ${COLORS.bone2};
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;
const LetterheadContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background: ${COLORS.white};
  box-shadow: 0 10px 30px rgba(3, 7, 30, 0.06);
  position: relative;
  border-radius: 6px;
  border: 1px solid ${COLORS.line};
`;
const CornerBase = styled.div`
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: ${COLORS.brass};
  border-style: solid;
  z-index: 3;
  opacity: 0.5;
`;
const CornerTL = styled(CornerBase)` top: 6px; left: 6px; border-width: 1px 0 0 1px; `;
const CornerTR = styled(CornerBase)` top: 6px; right: 6px; border-width: 1px 1px 0 0; `;
const CornerBL = styled(CornerBase)` bottom: 6px; left: 6px; border-width: 0 0 1px 1px; `;
const CornerBR = styled(CornerBase)` bottom: 6px; right: 6px; border-width: 0 1px 1px 0; `;
const Letterhead = styled.header`
  padding: 2.5rem 3rem;
  position: relative;
  z-index: 1;
  background: ${COLORS.white};
`;
const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${COLORS.line};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;
const BrandLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const LogoBox = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.ink};
  color: ${COLORS.bone};
  font-family: 'Fraunces', serif;
  font-weight: 700;
  font-size: 1.4rem;
  border-radius: 4px;
  flex-shrink: 0;
  overflow: hidden;

  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
const BrandText = styled.div`
  min-width: 0;
`;
const BrandName = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: ${COLORS.ink};
  margin: 0;
`;
const BrandSubtitle = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${COLORS.brass};
  margin-top: 0.2rem;
`;
const BrandRightTop = styled.div`
  text-align: right;

  @media (max-width: 768px) {
    text-align: left;
  }
`;
const DocTitle = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${COLORS.ink};
`;
const DocConfidential = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.inkBlue};
  margin-top: 0.3rem;
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border: 1px solid ${COLORS.inkBlue};
  border-radius: 2px;
`;
const RowBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;
const ColSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    width: 100%;
    align-items: flex-start;
    text-align: left;
    border: none !important;
    padding: 0;
  }
`;
const ColContact = styled(ColSection)`
  flex: 3;
  min-width: 250px;
  align-items: flex-start;
  text-align: left;
`;
const ContactItem = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.gray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;

  svg {
    width: 12px;
    height: 12px;
    color: ${COLORS.verdigris};
    opacity: 0.7;
    flex-shrink: 0;
  }
`;
const ColMeta = styled(ColSection)`
  flex: 1.5;
  min-width: 130px;
  align-items: flex-start;
  text-align: left;
  border-left: 1px solid ${COLORS.line};
  border-right: 1px solid ${COLORS.line};
  padding: 0 1.5rem;
`;
const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;
const MetaLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.brass};
`;
const MetaValue = styled.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.ink};
`;
const ColBarcode = styled(ColSection)`
  flex: 1.5;
  min-width: 140px;
  align-items: flex-end;
  text-align: right;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;
const BarcodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  line-height: 1;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;
const AdmissionNumber = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.inkBlue};
  letter-spacing: 0.05em;
  margin-bottom: 0.1rem;

  @media (max-width: 768px) {
    text-align: left;
  }
`;
const DeceasedName = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.ink};
  text-align: right;
  line-height: 1.2;
  max-width: 140px;
  margin-top: 0.1rem;

  @media (max-width: 768px) {
    text-align: left;
  }
`;
const BarcodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  
  @media (max-width: 480px) {
    align-items: center;
  }
`;
const FileIdText = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: ${COLORS.gray};
  text-align: right;
  
  span {
    font-weight: 700;
    color: ${COLORS.ink};
    letter-spacing: 0.05em;
    margin-left: 0.25rem;
  }
  
  @media (max-width: 480px) {
    text-align: center;
  }
`;
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

  @media (max-width: 768px) {
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

  @media (max-width: 768px) {
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
const FooterPanel = styled.div`
background: ${COLORS.white};
padding: 1rem 2rem; 
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
const PinIcon = () => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
  /* @__PURE__ */ jsx("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }),
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "10", r: "3" })
] });
const PhoneIcon = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" }) });
const MailIcon = () => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
  /* @__PURE__ */ jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
  /* @__PURE__ */ jsx("polyline", { points: "22,6 12,13 2,6" })
] });
const formatHeaderDate = (value) => {
  if (!value) return "\u2014";
  const raw = String(value);
  const date = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
  return /* @__PURE__ */ jsx("canvas", { ref: canvasRef, style: { width: "120px", height: "30px", display: "block" } });
};
const DeceasedReleaseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const getTenantSlug2 = () => {
    return localStorage.getItem("tenantSlug") || localStorage.getItem("tenant_slug") || (() => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user.tenantSlug || user.tenant?.slug || "default";
      } catch {
        return "default";
      }
    })();
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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.email || user.userEmail || "";
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
  const initialFormData = {
    admission_number: location.state?.permitNumber || "",
    date_admitted: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
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
    id_type: "National ID",
    id_number: "",
    tel_number: "",
    release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    release_time: getCurrentTime(),
    released_by: "",
    permit_number: "",
    mode_of_transport: "hearse",
    terms_accepted: false,
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
  useEffect(() => {
    const fetchDeceasedList = async () => {
      const tenantSlug = getTenantSlug2();
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
        const tenantSlug = getTenantSlug2();
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
            release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
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
    if (name === "admission_number") {
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
    setFormData((prev) => ({
      ...prev,
      // Keep exactly what the user typed to prevent input hijacking
      admission_number: prev.admission_number || foundAdmissionNumber,
      full_name: deceased.full_name || deceased.name_of_deceased || "",
      gender: deceased.gender || "",
      age: deceased.age || "",
      date_of_death: deceased.date_of_death || "",
      cause_of_death: deceased.cause_of_death || "",
      place_of_death: deceased.place_of_death || deceased.death_location || "",
      next_kin: deceased.contact_person || deceased.next_kin || deceased.next_of_kin || "",
      contact_person: deceased.contact_person || deceased.next_kin || "",
      relationship: deceased.relationship || deceased.kin_relationship || "",
      id_number: deceased.national_id || deceased.id_number || deceased.nationalId || "",
      tel_number: deceased.tell_no || deceased.tel_number || deceased.phone_number || deceased.contact || "",
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
      const tenantSlug = getTenantSlug2();
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
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.date_admitted) newErrors.date_admitted = "Date admitted is required";
    if (!formData.release_date) newErrors.release_date = "Release date is required";
    if (!formData.released_by.trim()) newErrors.released_by = "Released by is required";
    if (!formData.next_kin.trim()) newErrors.next_kin = "Next of kin is required";
    if (!formData.id_number.trim()) newErrors.id_number = "ID number is required";
    if (!formData.tel_number.trim()) newErrors.tel_number = "Telephone number is required";
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
      const tenantSlug = getTenantSlug2();
      const token = getAuthToken();
      const signatureData = sigPadRef1.current?.toDataURL();
      const freshTime = getCurrentTime();
      const payload = {
        ...formData,
        admission_number: String(formData.admission_number || "").toUpperCase(),
        time_received: freshTime,
        release_time: freshTime,
        age: formData.age ? parseInt(formData.age, 10) : null,
        body_status: "Released",
        verified_by: formData.verified_by || getLoggedInUserEmail() || null,
        signature: signatureData,
        name_of_deceased: formData.full_name,
        tell_number: formData.tel_number
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
      setFormData({
        ...initialFormData,
        verified_by: getLoggedInUserEmail(),
        time_received: getCurrentTime(),
        release_time: getCurrentTime(),
        date_admitted: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      });
      sigPadRef1.current?.clear();
      setErrors({});
      setTimeout(() => {
        navigate(`/tenant/${tenantSlug}/all-deceased`);
      }, 3e3);
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
      date_admitted: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      release_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setErrors({});
    setMessage({ type: "", text: "" });
    setReleaseId("");
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
        /* @__PURE__ */ jsx(HeaderBand, { children: /* @__PURE__ */ jsxs(LetterheadContainer, { children: [
          /* @__PURE__ */ jsx(CornerTL, {}),
          /* @__PURE__ */ jsx(CornerTR, {}),
          /* @__PURE__ */ jsx(CornerBL, {}),
          /* @__PURE__ */ jsx(CornerBR, {}),
          /* @__PURE__ */ jsxs(Letterhead, { children: [
            /* @__PURE__ */ jsxs(RowTop, { children: [
              /* @__PURE__ */ jsxs(BrandLeft, { children: [
                /* @__PURE__ */ jsx(LogoBox, { children: tenantLogoUrl ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: tenantLogoUrl,
                    alt: tenantName,
                    onError: (e) => {
                      e.target.style.display = "none";
                    }
                  }
                ) : (tenantName || "M").charAt(0).toUpperCase() }),
                /* @__PURE__ */ jsxs(BrandText, { children: [
                  /* @__PURE__ */ jsx(BrandName, { children: tenantName }),
                  /* @__PURE__ */ jsx(BrandSubtitle, { children: [displayBranch, displayLocation].filter(Boolean).join(" \xB7 ") || "Department of Forensic Records" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(BrandRightTop, { children: [
                /* @__PURE__ */ jsx(DocTitle, { children: "Deceased Release Record" }),
                /* @__PURE__ */ jsx(DocConfidential, { children: "Confidential \xB7 Medical Record" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(RowBottom, { children: [
              /* @__PURE__ */ jsxs(ColContact, { children: [
                /* @__PURE__ */ jsxs(ContactItem, { children: [
                  /* @__PURE__ */ jsx(PinIcon, {}),
                  displayAddress || fallback.address || fallback.location
                ] }),
                /* @__PURE__ */ jsxs(ContactItem, { children: [
                  /* @__PURE__ */ jsx(PhoneIcon, {}),
                  displayPhone || fallback.phone
                ] }),
                /* @__PURE__ */ jsxs(ContactItem, { children: [
                  /* @__PURE__ */ jsx(MailIcon, {}),
                  displayEmail || fallback.email
                ] })
              ] }),
              /* @__PURE__ */ jsxs(ColMeta, { children: [
                /* @__PURE__ */ jsxs(MetaItem, { children: [
                  /* @__PURE__ */ jsx(MetaLabel, { children: "Date Admitted" }),
                  /* @__PURE__ */ jsx(MetaValue, { children: formatHeaderDate(formData.date_admitted) })
                ] }),
                /* @__PURE__ */ jsxs(MetaItem, { children: [
                  /* @__PURE__ */ jsx(MetaLabel, { children: "Time Recorded" }),
                  /* @__PURE__ */ jsx(MetaValue, { children: formData.release_time || "\u2014" })
                ] }),
                /* @__PURE__ */ jsxs(MetaItem, { children: [
                  /* @__PURE__ */ jsx(MetaLabel, { children: "Reference No." }),
                  /* @__PURE__ */ jsx(MetaValue, { children: formData.admission_number || "\u2014" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(ColBarcode, { children: /* @__PURE__ */ jsxs(BarcodeSection, { children: [
                /* @__PURE__ */ jsx(AdmissionNumber, { children: formData.admission_number || "AWAITING-ID" }),
                /* @__PURE__ */ jsx(Barcode, { value: formData.admission_number }),
                /* @__PURE__ */ jsx(DeceasedName, { children: formData.full_name || "\u2014" })
              ] }) })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(FormBody, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "01" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Receiving & Facility Information" })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col2, { children: [
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
                    /* @__PURE__ */ jsx("span", { style: { fontSize: "0.65rem", color: COLORS.success, fontWeight: 700, marginLeft: "0.3rem" }, children: "Found" })
                  ] }) : !isSearching && hasValue(formData.admission_number) && !isFound && errors.admission_number ? /* @__PURE__ */ jsxs(SearchStatus, { style: { color: COLORS.red }, children: [
                    /* @__PURE__ */ jsx(X, { size: 14 }),
                    " Not Found"
                  ] }) : null
                ] }),
                errors.admission_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.admission_number })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Date Admitted ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    InputLg,
                    {
                      type: "date",
                      name: "date_admitted",
                      value: formData.date_admitted,
                      onChange: handleChange
                    }
                  ),
                  hasValue(formData.date_admitted) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.date_admitted && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.date_admitted })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
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
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
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
                      placeholder: "Name of person releasing the body"
                    }
                  ),
                  hasValue(formData.released_by) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.released_by && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.released_by })
              ] })
            ] })
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
                /* @__PURE__ */ jsxs(Label, { children: [
                  "Gender ",
                  /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
                ] }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsxs(
                    Select,
                    {
                      name: "gender",
                      value: formData.gender,
                      onChange: handleChange,
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Select Gender" }),
                        /* @__PURE__ */ jsx("option", { value: "Male", children: "Male" }),
                        /* @__PURE__ */ jsx("option", { value: "Female", children: "Female" })
                      ]
                    }
                  ),
                  hasValue(formData.gender) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.gender && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.gender })
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
                      onChange: handleChange
                    }
                  ),
                  hasValue(formData.date_of_death) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
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
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "Body Status" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      name: "body_status",
                      value: formData.body_status || "Released",
                      readOnly: true,
                      disabled: true
                    }
                  ),
                  hasValue(formData.body_status) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] })
            ] })
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
            /* @__PURE__ */ jsxs(Row, { children: [
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsx(Label, { children: "ID Type" }),
                /* @__PURE__ */ jsxs(InputFieldWrapper, { children: [
                  /* @__PURE__ */ jsxs(
                    Select,
                    {
                      name: "id_type",
                      value: formData.id_type,
                      onChange: handleChange,
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Select Identification" }),
                        /* @__PURE__ */ jsx("option", { value: "National ID", children: "National ID" }),
                        /* @__PURE__ */ jsx("option", { value: "Passport", children: "Passport" }),
                        /* @__PURE__ */ jsx("option", { value: "Alien Card", children: "Alien Card" })
                      ]
                    }
                  ),
                  hasValue(formData.id_type) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Col, { children: [
                /* @__PURE__ */ jsxs(Label, { children: [
                  "ID / Passport Number ",
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
                      placeholder: "Identification number"
                    }
                  ),
                  hasValue(formData.id_number) && /* @__PURE__ */ jsx(TickIconWrapper, { children: /* @__PURE__ */ jsx(Check, { size: 16, strokeWidth: 2.5 }) })
                ] }),
                errors.id_number && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.id_number })
              ] })
            ] }),
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
            /* @__PURE__ */ jsx(Row, { children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }, children: [
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }, children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    name: "terms_accepted",
                    checked: formData.terms_accepted,
                    onChange: handleChange,
                    style: { marginTop: "0.2rem", width: "1rem", height: "1rem", accentColor: COLORS.verdigris }
                  }
                ),
                /* @__PURE__ */ jsx("span", { style: { fontSize: "0.8rem", color: COLORS.gray, lineHeight: "1.5" }, children: "I hereby authorize the release and transportation of the deceased. I certify that I am the legally authorized next of kin or representative and have the right to make this authorization." })
              ] }),
              errors.terms_accepted && /* @__PURE__ */ jsx(ErrorMessage, { children: errors.terms_accepted }),
              /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }, children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    name: "everything_paid",
                    checked: formData.everything_paid,
                    onChange: handleChange,
                    style: { marginTop: "0.2rem", width: "1rem", height: "1rem", accentColor: COLORS.verdigris }
                  }
                ),
                /* @__PURE__ */ jsx("span", { style: { fontSize: "0.8rem", color: COLORS.gray, lineHeight: "1.5" }, children: "I confirm that all outstanding charges and payments have been settled." })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Section, { children: [
            /* @__PURE__ */ jsxs(SectionHead, { children: [
              /* @__PURE__ */ jsx(SectionNum, { children: "05" }),
              /* @__PURE__ */ jsx(SectionTitle, { children: "Verification & Digital Sign-off" })
            ] }),
            /* @__PURE__ */ jsx(SignOffContainer, { children: /* @__PURE__ */ jsxs(SignOffGrid, { children: [
              /* @__PURE__ */ jsxs(GridSig, { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxs(Label, { children: [
                    "Authorizing Signature ",
                    /* @__PURE__ */ jsx("span", { style: { color: COLORS.red }, children: "*" })
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
                  /* @__PURE__ */ jsx(Label, { children: "Released By Officer" }),
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
                  ] })
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
            /* @__PURE__ */ jsxs(ClearSigButton, { type: "button", onClick: handleClear, style: { marginRight: "auto" }, children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 14, style: { marginRight: "4px" } }),
              " Clear Form"
            ] }),
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
        /* @__PURE__ */ jsxs(FooterPanel, { children: [
          /* @__PURE__ */ jsxs(FooterText, { children: [
            tenantName,
            " Generated ",
            (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            " at ",
            (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
            /* @__PURE__ */ jsx("br", {}),
            "- Official Release Record \u2014"
          ] }),
          /* @__PURE__ */ jsxs(BarcodeWrapper, { style: { alignItems: "center" }, children: [
            /* @__PURE__ */ jsx(Barcode, { value: formData.admission_number }),
            /* @__PURE__ */ jsxs(FileIdText, { style: { textAlign: "center" }, children: [
              "File ID:",
              /* @__PURE__ */ jsx("span", { children: isLoadingDeceasedList ? "Loading..." : formData.admission_number || "Enter admission number" })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export default DeceasedReleaseForm;
