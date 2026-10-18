import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";

/* ── Colors ── */
const ink = "#15171A", bone = "#FAF8F4", brass = "#8B7355", line = "#E3DDD0", gray = "#6B6862", accent = "#C77B5E", portalCyan = "#00d9ff", portalMagenta = "#ff006e";

/* ── Keyframes ── */
const slideUpFade = keyframes`from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); }`;
const slideRightFade = keyframes`from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); }`;
const wordIn = keyframes`from { opacity: 0; transform: translateY(14px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); }`;
const floatTablet = keyframes`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); }`;
const pulseAccent = keyframes`0% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(199, 123, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0); }`;
const portalPulse = keyframes`0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,255,0.5); } 50% { opacity: .5; box-shadow: 0 0 0 4px rgba(0,217,255,0); }`;
const flpFadeUp = keyframes`from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); }`;
const flpFloat = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); }`;
const flpPulse = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); }`;

/* ── Layout ── */
const HeroSection = styled.section`
  padding-top: 160px; padding-bottom: 80px; position: relative; overflow: hidden; background: #FFFFFF;
  @media (max-width: 900px) { padding-top: 120px; }
`;

const Glow1 = styled.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 500px; height: 500px; background: rgba(199, 123, 94, 0.12); top: -100px; left: -100px;`;
const Glow2 = styled.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 450px; height: 450px; background: rgba(139, 115, 85, 0.1); bottom: -100px; right: -100px;`;

const Wrap = styled.div`max-width: 2280px; margin: 0 auto; width: 100%; padding-left: clamp(1.5rem, 5vw, 5rem); padding-right: clamp(1.5rem, 5vw, 5rem);`;

const HeroGrid = styled.div`
  position: relative; z-index: 2; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 4rem; align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 3.5rem; }
`;

/* ══════════ TEXT SIDE ══════════ */
const HeroText = styled.div`
  animation: ${slideUpFade} 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;
  transition: opacity 0.5s ease, transform 0.5s ease;
  ${props => props.hidden && css`
    opacity: 0;
    transform: translateY(-40px);
    pointer-events: none;
  `}
`;

const HeroTitle = styled.h1`
  font-family: 'Fraunces', serif; font-size: clamp(2.3rem, 4vw, 3.4rem);
  line-height: 1.12; letter-spacing: -0.025em; font-weight: 300; color: ${gray}; margin: 0 0 1.5rem; max-width: 560px;
`;
const TitleBold = styled.span`display: block; color: ${ink}; font-weight: 600;`;

const HeroDesc = styled.p`
  font-size: 1.02rem; max-width: 470px; margin: 0 0 2.5rem; color: ${gray};
  line-height: 1.75; font-family: 'Space Grotesk', sans-serif; font-weight: 400;
`;

const HeroActions = styled.div`display: flex; gap: 0.9rem; margin-bottom: 3rem; flex-wrap: wrap;`;

const Btn = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
  padding: 1.05rem 2rem; font-size: 0.78rem; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
  letter-spacing: 0.06em; text-transform: uppercase;
  @media (max-width: 480px) { flex: 1 1 100%; }
`;
const BtnArrow = styled.span`display: inline-flex; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);`;
const BtnBlack = styled(Btn)`
  background: ${ink}; color: #FFFFFF;
  &:hover { background: #000000; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(21,23,26,0.25); & ${BtnArrow} { transform: translateX(4px); } }
`;
const BtnGhost = styled(Btn)`
  background: transparent; color: ${ink}; border-color: ${line};
  &:hover { background: ${ink}; color: #FFFFFF; border-color: ${ink}; transform: translateY(-2px); }
`;

const HeroStats = styled.div`display: flex; border-top: 1px solid ${line}; padding-top: 1.6rem; max-width: 470px;`;
const StatItem = styled.div`
  flex: 1; padding-right: 1rem;
  &:nth-child(2) { border-left: 1px solid ${line}; padding-left: 1.1rem; }
  &:last-child { border-left: 1px solid ${line}; padding-left: 1.1rem; padding-right: 0; }
  @media (max-width: 380px) { &:nth-child(2), &:last-child { padding-left: 0.7rem; } }
`;
const StatNum = styled.span`display: block; font-family: 'Fraunces', serif; font-size: 1.55rem; font-weight: 600; color: ${ink}; line-height: 1; margin-bottom: 0.45rem;`;
const StatLabel = styled.span`font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: ${gray}; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.5; display: block;`;

/* ══════════ VISUAL SIDE ══════════ */
const HeroVisual = styled.div`position: relative; display: flex; justify-content: center; align-items: center; height: 100%; perspective: 1600px;`;

const TabletScale = styled.div`
  --s: 1; width: calc(380px * var(--s)); height: calc(540px * var(--s)); flex-shrink: 0;
  @media (max-width: 900px) { --s: 0.9; } @media (max-width: 430px) { --s: 0.75; } @media (max-width: 350px) { --s: 0.65; }
`;

/* Crucial: Must drop scale transform when expanded so fixed positioning works relative to viewport */
const TabletScaleInner = styled.div`
  width: 380px; height: 540px; transform: scale(var(--s)); transform-origin: top left; transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.7, 0, 0.3, 1);
  ${props => props.$isExpanded && css`transform: scale(1);`}
`;

const TabletFloatWrapper = styled.div`
  animation: ${slideRightFade} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards, ${floatTablet} 8s ease-in-out infinite 1.5s; 
  opacity: 0; width: 380px; height: 540px; transform-style: preserve-3d;
  transition: width 0.8s cubic-bezier(0.7, 0, 0.3, 1), height 0.8s cubic-bezier(0.7, 0, 0.3, 1);
  z-index: 10;

  ${props => props.$isExpanded && css`
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; max-width: 100vw;
    transform: none !important; animation: none !important; opacity: 1 !important; z-index: 1000;
  `}
`;

const Tablet3DFlipper = styled.div`
  width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
  /* Prevent 3D flip when expanded so the form layer faces forward perfectly */
  transform: ${props => props.$isExpanded ? "rotateY(0deg)" : (props.$isFlipped ? "rotateY(180deg)" : "rotateY(0deg)")};
`;

const TabletFace = styled.div`
  position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 32px;
  &.back { transform: rotateY(180deg); }
`;

const TabletFrame = styled.div`
  width: 100%; height: 100%; background: #050507; border-radius: 32px; padding: 12px; position: relative; 
  box-shadow: 0 50px 100px -20px rgba(21,23,26,0.5), 0 30px 60px -30px rgba(199,123,94,0.15), inset 0 0 0 2px rgba(255,255,255,0.05); 
  transition: border-radius 0.8s ease, padding 0.8s ease, box-shadow 0.8s ease;
  &::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 100; transition: opacity 0.3s; }
  ${props => props.$isExpanded && css`
    border-radius: 0; padding: 0; box-shadow: none;
    &::before { opacity: 0; }
  `}
`;

const TabletScreen = styled.div`
  width: 100%; height: 100%; background: #050507; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Space Grotesk', sans-serif; color: #e8e8eb;
  transition: border-radius 0.8s ease, overflow-y 0.3s ease;
  ${props => props.$isExpanded && css`border-radius: 0; overflow-y: auto;`}
`;

/* ── Form Layer ── */
const FormLayer = styled.div`
  position: absolute; inset: 0; background: ${bone}; color: ${ink};
  opacity: 0; pointer-events: none; transition: opacity 0.4s ease 0.3s; z-index: 20; overflow-y: auto;
  font-family: 'Saira', sans-serif;
  &.active { opacity: 1; pointer-events: all; }
`;

const FormHeader = styled.div`padding: 2.5rem 3rem 1.5rem; border-bottom: 1px solid ${line}; display: flex; justify-content: space-between; align-items: center;`;
const FormGreeting = styled.div`color: #999999; font-size: 0.75rem; font-weight: 500;`;
const FormTitle = styled.div`font-family: 'Fraunces', serif; font-size: 1.5rem; font-weight: 600; margin-top: 2px;`;
const FormDate = styled.div`text-align: right; font-size: 0.8rem; color: ${brass}; font-weight: 500;`;

const FormBody = styled.div`padding: 2rem 3rem; max-width: 1000px; margin: 0 auto;`;
const FormSection = styled.div`margin-bottom: 3rem;`;
const SectionHead = styled.div`background: ${ink}; color: ${bone}; padding: 0.75rem 1.25rem; border-radius: 4px; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;`;
const SectionNum = styled.div`font-size: 0.75rem; color: rgba(250,248,244,0.4); font-family: 'JetBrains Mono', monospace;`;
const SectionTitle = styled.div`font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;`;

const FormRow = styled.div`display: flex; gap: 1.5rem; margin-bottom: 1.5rem; @media (max-width: 768px) { flex-direction: column; }`;
const FormCol = styled.div`flex: 1; ${props => props.flex && css`flex: ${props.flex};`}`;
const FormLabel = styled.label`display: block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${brass}; margin-bottom: 0.5rem;`;
const FormInput = styled.input`
  width: 100%; height: 2.75rem; border: none; border-bottom: 1px solid #ccc; outline: none; background: transparent; font-size: 0.95rem; color: ${ink}; font-family: 'Saira', sans-serif;
  &:focus { border-bottom: 1px solid ${ink}; }
`;
const SigBox = styled.div`height: 12rem; border: 1px dashed ${gray}; border-radius: 4px; background: #FAF8F4; display: flex; align-items: center; justify-content: center; color: #999999; font-size: 0.8rem;`;

/* ── Portal UI ── */
const PortalUI = styled.div`padding: 28px 24px; height: 100%; display: flex; flex-direction: column; background: radial-gradient(circle at top right, rgba(0,217,255,0.05), transparent 40%), #050507;`;
const PTop = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;`;
const PWordmark = styled.div`text-align: center; flex: 1;`;
const PName = styled.div`font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #fff; font-weight: 600; margin-bottom: 6px;`;
const PLine = styled.div`width: 80px; height: 1px; margin: 0 auto; background: linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent);`;
const PTag = styled.div`font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-top: 6px;`;
const PStatus = styled.div`display: flex; align-items: center; gap: 5px;`;
const PStatusDot = styled.div`width: 5px; height: 5px; background: ${portalCyan}; border-radius: 50%; animation: ${portalPulse} 2s infinite;`;
const PStatusTxt = styled.div`font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a8a95; font-weight: 500;`;

const PWelcome = styled.div`margin-bottom: 24px;`;
const PGreet = styled.div`font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-bottom: 6px;`;
const PH1 = styled.div`font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-style: italic; color: #fff; font-weight: 600; letter-spacing: -0.5px;`;

const PSvcHead = styled.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);`;
const PSvcTitle = styled.div`font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: ${portalCyan}; font-style: italic; font-weight: 600;`;
const PSvcSub = styled.div`font-size: 7px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 600; margin-bottom: 2px;`;

const PGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1;`;
const PCard = styled.div`
  position: relative; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; cursor: pointer; overflow: hidden;
  background: linear-gradient(145deg, #0f1820 0%, #050709 100%); border: 1px solid rgba(0,217,255,0.25); transition: all 0.3s ease;
  &:hover { border-color: ${portalCyan}; box-shadow: 0 0 15px rgba(0,217,255,0.2); transform: translateY(-2px); }
  &.magenta { background: linear-gradient(145deg, #1f0a15 0%, #0a0305 100%); border-color: rgba(255,0,110,0.25); }
  &.magenta:hover { border-color: ${portalMagenta}; box-shadow: 0 0 15px rgba(255,0,110,0.2); }
`;
const PCorner = styled.div`position: absolute; width: 8px; height: 8px; border: 1.5px solid ${portalCyan}; &.magenta { border-color: ${portalMagenta}; } &.tl { top: 3px; left: 3px; border-right: 0; border-bottom: 0; } &.tr { top: 3px; right: 3px; border-left: 0; border-bottom: 0; } &.bl { bottom: 3px; left: 3px; border-right: 0; border-top: 0; } &.br { bottom: 3px; right: 3px; border-left: 0; border-top: 0; }`;
const PIconBox = styled.div`width: 28px; height: 28px; border-radius: 5px; background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: ${portalCyan}; &.magenta { background: rgba(255,0,110,0.1); border-color: rgba(255,0,110,0.3); color: ${portalMagenta}; }`;
const PNum = styled.div`position: absolute; bottom: -5px; right: 2px; font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-style: italic; font-weight: 700; color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none;`;
const PCardTitle = styled.div`font-size: 11px; font-weight: 600; color: #f0ebe3; line-height: 1.2; margin-bottom: 4px;`;
const PCardDesc = styled.div`font-size: 8px; color: #8a8a95; line-height: 1.4; font-weight: 300; margin-bottom: 8px; flex: 1;`;
const PCont = styled.div`display: flex; align-items: center; gap: 3px; font-size: 7px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; color: ${portalCyan}; margin-top: auto; &.magenta { color: ${portalMagenta}; }`;

/* ── Floral UI ── */
const FloralUI = styled.div`position: relative; height: 100%; background: #0a0b0c; overflow: hidden;`;
const FlpHero = styled.img`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity 0.4s ease-in-out; opacity: ${props => props.$fading ? 0 : 1};`;
const FlpOverlay = styled.div`position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5;`;
const FlpStrip = styled.div`position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 20px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; }`;
const FlpStory = styled.button`display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25;`;
const FlpRing = styled.div`border-radius: 50%; padding: 2.5px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; &.unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: ${flpPulse} 2.8s ease-in-out infinite, ${flpFloat} 3.2s ease-in-out infinite; } &.seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); } &:hover { transform: scale(1.06); }`;
const FlpRingInner = styled.div`width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; & img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter 0.3s, transform 0.4s; } &:hover img { filter: brightness(1.05); transform: scale(1.1); }`;
const FlpStoryLabel = styled.span`font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const FlpTitleBlock = styled.div`position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: ${flpFadeUp} 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`;
const FlpNameTag = styled.div`font-size: 9px; font-weight: 600; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px;`;
const FlpHeadline = styled.h2`font-family: 'Fraunces',serif; font-weight: 300; font-size: 30px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity 0.4s ease, transform 0.4s ease; opacity: ${props => props.$fading ? 0 : 1}; transform: ${props => props.$fading ? "translateY(15px)" : "translateY(0)"}; & em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }`;
const FlpWordmark = styled.div`position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: ${flpFadeUp} 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`;
const FlpWordmarkName = styled.div`font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: 0.04em;`;
const FlpWordmarkSub = styled.div`font-size: 8px; font-weight: 500; letter-spacing: 0.28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px;`;

const PortalCardsData = [
  { num: "01", title: "Body Admission", desc: "Open the real deceased registration preview", path: "/preview/body-intake", magenta: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3" /><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /></svg> },
  { num: "02", title: "Body Release", desc: "Open the real body release preview", path: "/preview/release-form", magenta: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg> },
  { num: "03", title: "Flower Arrangements", desc: "Bespoke floral tributes, wreaths & memorial displays", magenta: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" /><circle cx="12" cy="8" r="2" /><path d="M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5" /></svg> },
  { num: "04", title: "Postmortem Records", desc: "Secure access to medical documentation & reports", magenta: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" /></svg> }
];

const FloralData = [
  { img: "https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240", title: (<>Mixed Rose &<br /><em>Baby Breath Heart</em></>), label: "Heart" },
  { img: "https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000", title: (<>Wreaths & Cross<br /><em>on Stand</em></>), label: "Cross" },
  { img: "https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw", title: (<>Elegant<br /><em>Floral Spray</em></>), label: "Spray" },
  { img: "https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240", title: (<>The Eternal<br /><em>Embrace</em></>), label: "Embrace" }
];

const statsData = [
  { value: "100%", label: "Paperless workflow" },
  { value: "24/7", label: "Uptime & support" },
  { value: "100%", label: "Encrypted & secure" }
];

export default function Hero() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [hideText, setHideText] = useState(false);

  const [admForm, setAdmForm] = useState({ name: '', gender: '', age: '', dod: '', from: '', officer: '' });
  const [relForm, setRelForm] = useState({ to: '', rel: '', date: '', trans: '', officer: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const flipInterval = setInterval(() => setIsFlipped(prev => !prev), 6000);
    return () => clearInterval(flipInterval);
  }, []);

  return (
    <>
      <HeroSection>
        <Glow1 />
        <Glow2 />

        <Wrap>
          <HeroGrid>

            {/* ── TEXT ── */}
            <HeroText hidden={hideText}>
              <HeroTitle>
                For funeral homes where every detail matters.
                <TitleBold>
                  One exceptional experience.
                </TitleBold>
              </HeroTitle>

              <HeroDesc>
                Manage admissions, releases, documents, hearse bookings, flowers, coffins, billing, and family updates in one secure workspace. Replace scattered paperwork with a clear digital operation your team can run with confidence.
              </HeroDesc>

              <HeroActions>
                <BtnBlack onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/register'); }}>
                  Get started today
                  <BtnArrow>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </BtnArrow>
                </BtnBlack>
                <BtnGhost onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/login'); }}>See Rest Point in action</BtnGhost>
              </HeroActions>

              <div style={{ marginTop: '-1.8rem', marginBottom: '2.2rem', color: gray, fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.78rem' }}>
                One connected workflow for every case, every branch, and every family.
              </div>

              <HeroStats>
                {statsData.map((s, i) => (
                  <StatItem key={i}>
                    <StatNum>{s.value}</StatNum>
                    <StatLabel>{s.label}</StatLabel>
                  </StatItem>
                ))}
              </HeroStats>
            </HeroText>

            {/* ── TABLET ── */}
            <HeroVisual>
              <TabletScale>
                <TabletScaleInner $isExpanded={isExpanded}>
                  <TabletFloatWrapper $isExpanded={isExpanded}>
                    <Tablet3DFlipper $isFlipped={isFlipped} $isExpanded={isExpanded}>

                      {/* FRONT FACE: PORTAL */}
                      <TabletFace className="front">
                        <TabletFrame $isExpanded={isExpanded}>
                          <TabletScreen $isExpanded={isExpanded}>
                            
                            {/* Portal UI */}
                            <PortalUI>
                              <PTop>
                                <div style={{ width: "40px" }}></div>
                                <PWordmark>
                                  <PName>Rest Point</PName>
                                  <PLine />
                                  <PTag>Reception Portal</PTag>
                                </PWordmark>
                                <PStatus>
                                  <PStatusDot />
                                  <PStatusTxt>Online</PStatusTxt>
                                </PStatus>
                              </PTop>

                              <PWelcome>
                                <PGreet>Good morning</PGreet>
                                <PH1>Welcome back.</PH1>
                              </PWelcome>

                              <PSvcHead>
                                <div>
                                  <PSvcSub>Services</PSvcSub>
                                  <PSvcTitle>Select to Begin</PSvcTitle>
                                </div>
                                <PSvcSub style={{ display: "flex", alignItems: "center", gap: "4px", color: portalCyan }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /></svg>
                                  4 Available
                                </PSvcSub>
                              </PSvcHead>

                              <PGrid>
                                {PortalCardsData.map((c, i) => (
                                  <PCard key={i} className={c.magenta ? "magenta" : ""} onClick={() => c.path && navigate(c.path)} role={c.path ? "button" : undefined} tabIndex={c.path ? 0 : undefined}>
                                    <PCorner className={`${c.magenta ? "magenta" : ""} tl`} />
                                    <PCorner className={`${c.magenta ? "magenta" : ""} tr`} />
                                    <PCorner className={`${c.magenta ? "magenta" : ""} bl`} />
                                    <PCorner className={`${c.magenta ? "magenta" : ""} br`} />
                                    <PNum>{c.num}</PNum>
                                    <PIconBox className={c.magenta ? "magenta" : ""}>{c.icon}</PIconBox>
                                    <PCardTitle>{c.title}</PCardTitle>
                                    <PCardDesc>{c.desc}</PCardDesc>
                                    <PCont className={c.magenta ? "magenta" : ""}>
                                      {c.path ? 'Open real preview' : 'Continue'}
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 7h10v10M7 17L17 7" /></svg>
                                    </PCont>
                                  </PCard>
                                ))}
                              </PGrid>
                            </PortalUI>

                            {/* ADMISSION FORM LAYER */}
                            <FormLayer className={activeForm === 'admission' ? 'active' : ''}>
                              <FormHeader>
                                <div>
                                  <FormGreeting>Welcome to Rest Point</FormGreeting>
                                  <FormTitle>Deceased Registration</FormTitle>
                                </div>
                                <FormDate>Record Date: Oct 24, 2023</FormDate>
                              </FormHeader>
                              <FormBody>
                                <FormSection>
                                  <SectionHead><SectionNum>01</SectionNum><SectionTitle>Receiving & Facility</SectionTitle></SectionHead>
                                  <FormRow>
                                    <FormCol flex={2}><FormLabel>Full Name *</FormLabel><FormInput type="text" value={admForm.name} readOnly /></FormCol>
                                    <FormCol><FormLabel>Gender *</FormLabel><FormInput type="text" value={admForm.gender} readOnly /></FormCol>
                                  </FormRow>
                                  <FormRow>
                                    <FormCol flex={0.5}><FormLabel>Age</FormLabel><FormInput type="text" value={admForm.age} readOnly /></FormCol>
                                    <FormCol><FormLabel>Date of Death</FormLabel><FormInput type="text" value={admForm.dod} readOnly /></FormCol>
                                    <FormCol><FormLabel>Received From</FormLabel><FormInput type="text" value={admForm.from} readOnly /></FormCol>
                                  </FormRow>
                                </FormSection>
                                <FormSection>
                                  <SectionHead><SectionNum>04</SectionNum><SectionTitle>Verification & Sign-off</SectionTitle></SectionHead>
                                  <FormRow>
                                    <FormCol flex={2}><FormLabel>Officer Signature *</FormLabel><SigBox>Sign within boundaries</SigBox></FormCol>
                                    <FormCol><FormLabel>Receiving Officer *</FormLabel><FormInput type="text" value={admForm.officer} readOnly /></FormCol>
                                  </FormRow>
                                </FormSection>
                              </FormBody>
                            </FormLayer>

                            {/* RELEASE FORM LAYER */}
                            <FormLayer className={activeForm === 'release' ? 'active' : ''}>
                              <FormHeader>
                                <div>
                                  <FormGreeting>Rest Point Portal</FormGreeting>
                                  <FormTitle>Body Release Form</FormTitle>
                                </div>
                                <FormDate>Record Date: Oct 24, 2023</FormDate>
                              </FormHeader>
                              <FormBody>
                                <FormSection>
                                  <SectionHead><SectionNum>01</SectionNum><SectionTitle>Release Details</SectionTitle></SectionHead>
                                  <FormRow>
                                    <FormCol flex={2}><FormLabel>Released To *</FormLabel><FormInput type="text" value={relForm.to} readOnly /></FormCol>
                                    <FormCol><FormLabel>Relationship</FormLabel><FormInput type="text" value={relForm.rel} readOnly /></FormCol>
                                  </FormRow>
                                  <FormRow>
                                    <FormCol><FormLabel>Collection Date</FormLabel><FormInput type="text" value={relForm.date} readOnly /></FormCol>
                                    <FormCol><FormLabel>Transport</FormLabel><FormInput type="text" value={relForm.trans} readOnly /></FormCol>
                                  </FormRow>
                                </FormSection>
                                <FormSection>
                                  <SectionHead><SectionNum>04</SectionNum><SectionTitle>Authorization</SectionTitle></SectionHead>
                                  <FormRow>
                                    <FormCol flex={2}><FormLabel>Authorizer Signature *</FormLabel><SigBox>Sign within boundaries</SigBox></FormCol>
                                    <FormCol><FormLabel>Authorizing Officer *</FormLabel><FormInput type="text" value={relForm.officer} readOnly /></FormCol>
                                  </FormRow>
                                </FormSection>
                              </FormBody>
                            </FormLayer>

                          </TabletScreen>
                        </TabletFrame>
                      </TabletFace>

                      {/* BACK FACE: FLORAL (Static floral image to avoid clutter, matching original) */}
                      <TabletFace className="back">
                        <TabletFrame $isExpanded={isExpanded}>
                          <TabletScreen $isExpanded={isExpanded}>
                            <FloralUI>
                              <FlpHero src={FloralData[0].img} alt="Floral Tribute" $fading={0} loading="lazy" decoding="async" />
                              <FlpOverlay />
                              <FlpStrip>
                                {FloralData.map((f, i) => (
                                  <FlpStory key={i}>
                                    <FlpRing className={i === 0 ? "unseen" : "seen"}>
                                      <FlpRingInner>
                                        <img src={f.img} alt={f.label} loading="lazy" decoding="async" />
                                      </FlpRingInner>
                                    </FlpRing>
                                    <FlpStoryLabel>{f.label}</FlpStoryLabel>
                                  </FlpStory>
                                ))}
                              </FlpStrip>
                              <FlpTitleBlock>
                                <FlpNameTag>Floral Tributes</FlpNameTag>
                                <FlpHeadline $fading={0}>{FloralData[0].title}</FlpHeadline>
                              </FlpTitleBlock>
                              <FlpWordmark>
                                <FlpWordmarkName>Memorial Florals</FlpWordmarkName>
                                <FlpWordmarkSub>Est. since care began</FlpWordmarkSub>
                              </FlpWordmark>
                            </FloralUI>
                          </TabletScreen>
                        </TabletFrame>
                      </TabletFace>

                    </Tablet3DFlipper>
                  </TabletFloatWrapper>
                </TabletScaleInner>
              </TabletScale>
            </HeroVisual>

          </HeroGrid>
        </Wrap>
      </HeroSection>
    </>
  );
}