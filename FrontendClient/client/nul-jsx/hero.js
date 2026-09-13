// src/modules/landing/hero.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap');
`;
var ink = "#15171A";
var line = "#E3DDD0";
var gray = "#6B6862";
var accent = "#C77B5E";
var portalCyan = "#00d9ff";
var portalMagenta = "#ff006e";
var slideUpFade = keyframes`from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); }`;
var slideRightFade = keyframes`from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); }`;
var wordIn = keyframes`from { opacity: 0; transform: translateY(14px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); }`;
var floatTablet = keyframes`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); }`;
var pulseAccent = keyframes`0% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(199, 123, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0); }`;
var portalPulse = keyframes`0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,255,0.5); } 50% { opacity: .5; box-shadow: 0 0 0 4px rgba(0,217,255,0); }`;
var flpFadeUp = keyframes`from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); }`;
var flpFloat = keyframes`0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); }`;
var flpPulse = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); }`;
var HeroSection = styled.section`
  padding-top: 160px; padding-bottom: 80px; position: relative; overflow: hidden; background: #FFFFFF;
  @media (max-width: 900px) { padding-top: 120px; }
`;
var Glow1 = styled.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 500px; height: 500px; background: rgba(199, 123, 94, 0.12); top: -100px; left: -100px;`;
var Glow2 = styled.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 450px; height: 450px; background: rgba(139, 115, 85, 0.1); bottom: -100px; right: -100px;`;
var Wrap = styled.div`max-width: 1280px; margin: 0 auto; width: 100%; padding-left: clamp(1.5rem, 5vw, 5rem); padding-right: clamp(1.5rem, 5vw, 5rem);`;
var HeroGrid = styled.div`
  position: relative; z-index: 2; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 4rem; align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 3.5rem; }
`;
var HeroText = styled.div`animation: ${slideUpFade} 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;`;
var HeroTitle = styled.h1`
  font-family: 'Fraunces', serif; font-size: clamp(2.3rem, 4vw, 3.4rem);
  line-height: 1.12; letter-spacing: -0.025em; font-weight: 300; color: ${gray}; margin: 0 0 1.5rem; max-width: 560px;
`;
var TitleBold = styled.span`display: block; color: ${ink}; font-weight: 600;`;
var RotWord = styled.span`
  display: inline-block; font-style: italic; font-weight: 500; color: ${accent};
  animation: ${wordIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;
var HeroDesc = styled.p`
  font-size: 1.02rem; max-width: 470px; margin: 0 0 2.5rem; color: ${gray};
  line-height: 1.75; font-family: 'Space Grotesk', sans-serif; font-weight: 400;
`;
var HeroActions = styled.div`display: flex; gap: 0.9rem; margin-bottom: 3rem; flex-wrap: wrap;`;
var Btn = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
  padding: 1.05rem 2rem; font-size: 0.78rem; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
  letter-spacing: 0.06em; text-transform: uppercase;
  @media (max-width: 480px) { flex: 1 1 100%; }
`;
var BtnArrow = styled.span`display: inline-flex; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);`;
var BtnBlack = styled(Btn)`
  background: ${ink}; color: #FFFFFF;
  &:hover { background: #000000; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(21,23,26,0.25); & ${BtnArrow} { transform: translateX(4px); } }
`;
var BtnGhost = styled(Btn)`
  background: transparent; color: ${ink}; border-color: ${line};
  &:hover { background: ${ink}; color: #FFFFFF; border-color: ${ink}; transform: translateY(-2px); }
`;
var HeroStats = styled.div`
  display: flex; border-top: 1px solid ${line}; padding-top: 1.6rem; max-width: 470px;
`;
var StatItem = styled.div`
  flex: 1; padding-right: 1rem;
  &:nth-child(2) { border-left: 1px solid ${line}; padding-left: 1.1rem; }
  &:last-child { border-left: 1px solid ${line}; padding-left: 1.1rem; padding-right: 0; }
  @media (max-width: 380px) { &:nth-child(2), &:last-child { padding-left: 0.7rem; } }
`;
var StatNum = styled.span`
  display: block; font-family: 'Fraunces', serif; font-size: 1.55rem; font-weight: 600;
  color: ${ink}; line-height: 1; margin-bottom: 0.45rem;
`;
var StatLabel = styled.span`
  font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: ${gray};
  text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.5; display: block;
`;
var HeroVisual = styled.div`
  position: relative; display: flex; justify-content: center; align-items: center; height: 100%; perspective: 1600px;
`;
var TabletScale = styled.div`
  --s: 1;
  width: calc(380px * var(--s));
  height: calc(540px * var(--s));
  flex-shrink: 0;
  @media (max-width: 900px) { --s: 0.9; }
  @media (max-width: 430px) { --s: 0.75; }
  @media (max-width: 350px) { --s: 0.65; }
`;
var TabletScaleInner = styled.div`
  width: 380px;
  height: 540px;
  transform: scale(var(--s));
  transform-origin: top left;
  transform-style: preserve-3d;
`;
var TabletFloatWrapper = styled.div`
  animation: ${slideRightFade} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards, ${floatTablet} 8s ease-in-out infinite 1.5s; 
  opacity: 0; width: 380px; height: 540px; transform-style: preserve-3d;
`;
var Tablet3DFlipper = styled.div`
  width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
  transform: ${(props) => props.isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"};
`;
var TabletFace = styled.div`
  position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 32px;
  &.back { transform: rotateY(180deg); }
`;
var TabletFrame = styled.div`width: 100%; height: 100%; background: #050507; border-radius: 32px; padding: 12px; position: relative; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.5), 0 30px 60px -30px rgba(199,123,94,0.15), inset 0 0 0 2px rgba(255,255,255,0.05); &::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 100; }`;
var TabletScreen = styled.div`width: 100%; height: 100%; background: #050507; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Space Grotesk', sans-serif; color: #e8e8eb;`;
var PortalUI = styled.div`padding: 28px 24px; height: 100%; display: flex; flex-direction: column; background: radial-gradient(circle at top right, rgba(0,217,255,0.05), transparent 40%), #050507;`;
var PTop = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;`;
var PWordmark = styled.div`text-align: center; flex: 1;`;
var PName = styled.div`font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #fff; font-weight: 600; margin-bottom: 6px;`;
var PLine = styled.div`width: 80px; height: 1px; margin: 0 auto; background: linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent);`;
var PTag = styled.div`font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-top: 6px;`;
var PStatus = styled.div`display: flex; align-items: center; gap: 5px;`;
var PStatusDot = styled.div`width: 5px; height: 5px; background: ${portalCyan}; border-radius: 50%; animation: ${portalPulse} 2s infinite;`;
var PStatusTxt = styled.div`font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a8a95; font-weight: 500;`;
var PWelcome = styled.div`margin-bottom: 24px;`;
var PGreet = styled.div`font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-bottom: 6px;`;
var PH1 = styled.div`font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-style: italic; color: #fff; font-weight: 600; letter-spacing: -0.5px;`;
var PSvcHead = styled.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);`;
var PSvcTitle = styled.div`font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: ${portalCyan}; font-style: italic; font-weight: 600;`;
var PSvcSub = styled.div`font-size: 7px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 600; margin-bottom: 2px;`;
var PGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1;`;
var PCard = styled.div`
  position: relative; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; cursor: pointer; overflow: hidden;
  background: linear-gradient(145deg, #0f1820 0%, #050709 100%); border: 1px solid rgba(0,217,255,0.25); transition: all 0.3s ease;
  &:hover { border-color: ${portalCyan}; box-shadow: 0 0 15px rgba(0,217,255,0.2); transform: translateY(-2px); }
  &.magenta { background: linear-gradient(145deg, #1f0a15 0%, #0a0305 100%); border-color: rgba(255,0,110,0.25); }
  &.magenta:hover { border-color: ${portalMagenta}; box-shadow: 0 0 15px rgba(255,0,110,0.2); }
`;
var PCorner = styled.div`position: absolute; width: 8px; height: 8px; border: 1.5px solid ${portalCyan}; &.magenta { border-color: ${portalMagenta}; } &.tl { top: 3px; left: 3px; border-right: 0; border-bottom: 0; } &.tr { top: 3px; right: 3px; border-left: 0; border-bottom: 0; } &.bl { bottom: 3px; left: 3px; border-right: 0; border-top: 0; } &.br { bottom: 3px; right: 3px; border-left: 0; border-top: 0; }`;
var PIconBox = styled.div`width: 28px; height: 28px; border-radius: 5px; background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: ${portalCyan}; &.magenta { background: rgba(255,0,110,0.1); border-color: rgba(255,0,110,0.3); color: ${portalMagenta}; }`;
var PNum = styled.div`position: absolute; bottom: -5px; right: 2px; font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-style: italic; font-weight: 700; color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none;`;
var PCardTitle = styled.div`font-size: 11px; font-weight: 600; color: #f0ebe3; line-height: 1.2; margin-bottom: 4px;`;
var PCardDesc = styled.div`font-size: 8px; color: #8a8a95; line-height: 1.4; font-weight: 300; margin-bottom: 8px; flex: 1;`;
var PCont = styled.div`display: flex; align-items: center; gap: 3px; font-size: 7px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; color: ${portalCyan}; margin-top: auto; &.magenta { color: ${portalMagenta}; }`;
var FloralUI = styled.div`position: relative; height: 100%; background: #0a0b0c; overflow: hidden;`;
var FlpHero = styled.img`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity 0.4s ease-in-out; opacity: ${(props) => props.fading ? 0 : 1};`;
var FlpOverlay = styled.div`position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5;`;
var FlpStrip = styled.div`position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 20px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; }`;
var FlpStory = styled.button`display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25;`;
var FlpRing = styled.div`border-radius: 50%; padding: 2.5px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; &.unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: ${flpPulse} 2.8s ease-in-out infinite, ${flpFloat} 3.2s ease-in-out infinite; } &.seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); } &:hover { transform: scale(1.06); }`;
var FlpRingInner = styled.div`width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; & img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter 0.3s, transform 0.4s; } &:hover img { filter: brightness(1.05); transform: scale(1.1); }`;
var FlpStoryLabel = styled.span`font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
var FlpTitleBlock = styled.div`position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: ${flpFadeUp} 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`;
var FlpNameTag = styled.div`font-size: 9px; font-weight: 600; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px;`;
var FlpHeadline = styled.h2`font-family: 'Fraunces',serif; font-weight: 300; font-size: 30px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity 0.4s ease, transform 0.4s ease; opacity: ${(props) => props.fading ? 0 : 1}; transform: ${(props) => props.fading ? "translateY(15px)" : "translateY(0)"}; & em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }`;
var FlpWordmark = styled.div`position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: ${flpFadeUp} 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`;
var FlpWordmarkName = styled.div`font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: 0.04em;`;
var FlpWordmarkSub = styled.div`font-size: 8px; font-weight: 500; letter-spacing: 0.28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px;`;
var PortalCardsData = [
  {
    num: "01",
    title: "Body Admission",
    desc: "Respectful reception & formal registration of the deceased",
    magenta: false,
    icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
      /* @__PURE__ */ jsx("path", { d: "M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3" }),
      /* @__PURE__ */ jsx("path", { d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" }),
      /* @__PURE__ */ jsx("path", { d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" })
    ] })
  },
  {
    num: "02",
    title: "Body Release",
    desc: "Dignified coordination of the final departure",
    magenta: true,
    icon: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("path", { d: "m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }) })
  },
  {
    num: "03",
    title: "Flower Arrangements",
    desc: "Bespoke floral tributes, wreaths & memorial displays",
    magenta: false,
    icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
      /* @__PURE__ */ jsx("path", { d: "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" }),
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "8", r: "2" }),
      /* @__PURE__ */ jsx("path", { d: "M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5" })
    ] })
  },
  {
    num: "04",
    title: "Postmortem Records",
    desc: "Secure access to medical documentation & reports",
    magenta: true,
    icon: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
      /* @__PURE__ */ jsx("path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }),
      /* @__PURE__ */ jsx("path", { d: "M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" })
    ] })
  }
];
var FloralData = [
  { img: "https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240", title: /* @__PURE__ */ jsxs(Fragment, { children: [
    "Mixed Rose &",
    /* @__PURE__ */ jsx("br", {}),
    /* @__PURE__ */ jsx("em", { children: "Baby Breath Heart" })
  ] }), label: "Heart" },
  { img: "https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000", title: /* @__PURE__ */ jsxs(Fragment, { children: [
    "Wreaths & Cross",
    /* @__PURE__ */ jsx("br", {}),
    /* @__PURE__ */ jsx("em", { children: "on Stand" })
  ] }), label: "Cross" },
  { img: "https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw", title: /* @__PURE__ */ jsxs(Fragment, { children: [
    "Elegant",
    /* @__PURE__ */ jsx("br", {}),
    /* @__PURE__ */ jsx("em", { children: "Floral Spray" })
  ] }), label: "Spray" },
  { img: "https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240", title: /* @__PURE__ */ jsxs(Fragment, { children: [
    "The Eternal",
    /* @__PURE__ */ jsx("br", {}),
    /* @__PURE__ */ jsx("em", { children: "Embrace" })
  ] }), label: "Embrace" }
];
var statsData = [
  { value: "100%", label: "Paperless workflow" },
  { value: "24/7", label: "Uptime & support" },
  { value: "100%", label: "Encrypted & secure" }
];
function Hero() {
  const [textIndex, setTextIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentFlower, setCurrentFlower] = useState(0);
  const [fading, setFading] = useState(false);
  const navigate = useNavigate();
  const rotatingTexts = ["families", "memories", "legacies", "communities"];
  const selectFlower = (i) => {
    if (i === currentFlower) return;
    setFading(true);
    setTimeout(() => {
      setCurrentFlower(i);
      setFading(false);
    }, 380);
  };
  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 6e3);
    return () => {
      clearInterval(textInterval);
      clearInterval(flipInterval);
    };
  }, []);
  useEffect(() => {
    let fadeTimer;
    const flowerInterval = setInterval(() => {
      setFading(true);
      fadeTimer = setTimeout(() => {
        setCurrentFlower((prev) => (prev + 1) % FloralData.length);
        setFading(false);
      }, 380);
    }, 4e3);
    return () => {
      clearInterval(flowerInterval);
      clearTimeout(fadeTimer);
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(GlobalFonts, {}),
    /* @__PURE__ */ jsxs(HeroSection, { children: [
      /* @__PURE__ */ jsx(Glow1, {}),
      /* @__PURE__ */ jsx(Glow2, {}),
      /* @__PURE__ */ jsx(Wrap, { children: /* @__PURE__ */ jsxs(HeroGrid, { children: [
        /* @__PURE__ */ jsxs(HeroText, { children: [
          /* @__PURE__ */ jsxs(HeroTitle, { children: [
            "The modern standard",
            /* @__PURE__ */ jsxs(TitleBold, { children: [
              "for the ",
              /* @__PURE__ */ jsx(RotWord, { children: rotatingTexts[textIndex] }, textIndex)
            ] }),
            "you serve."
          ] }),
          /* @__PURE__ */ jsx(HeroDesc, { children: "Rest Point brings high end technology to the death care industry. Hand families a tablet at the front desk to manage admissions, releases, and florals  everything syncing instantly to your dashboard." }),
          /* @__PURE__ */ jsxs(HeroActions, { children: [
            /* @__PURE__ */ jsxs(BtnBlack, { onClick: () => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              navigate("/register");
            }, children: [
              "Request Access",
              /* @__PURE__ */ jsx(BtnArrow, { children: /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M12 5l7 7-7 7" }) }) })
            ] }),
            /* @__PURE__ */ jsx(BtnGhost, { onClick: () => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              navigate("/login");
            }, children: "View Portal" })
          ] }),
          /* @__PURE__ */ jsx(HeroStats, { children: statsData.map((s, i) => /* @__PURE__ */ jsxs(StatItem, { children: [
            /* @__PURE__ */ jsx(StatNum, { children: s.value }),
            /* @__PURE__ */ jsx(StatLabel, { children: s.label })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsx(HeroVisual, { children: /* @__PURE__ */ jsx(TabletScale, { children: /* @__PURE__ */ jsx(TabletScaleInner, { children: /* @__PURE__ */ jsx(TabletFloatWrapper, { children: /* @__PURE__ */ jsxs(Tablet3DFlipper, { isFlipped, children: [
          /* @__PURE__ */ jsx(TabletFace, { className: "front", children: /* @__PURE__ */ jsx(TabletFrame, { children: /* @__PURE__ */ jsx(TabletScreen, { children: /* @__PURE__ */ jsxs(PortalUI, { children: [
            /* @__PURE__ */ jsxs(PTop, { children: [
              /* @__PURE__ */ jsx("div", { style: { width: "40px" } }),
              /* @__PURE__ */ jsxs(PWordmark, { children: [
                /* @__PURE__ */ jsx(PName, { children: "Rest Point" }),
                /* @__PURE__ */ jsx(PLine, {}),
                /* @__PURE__ */ jsx(PTag, { children: "Reception Portal" })
              ] }),
              /* @__PURE__ */ jsxs(PStatus, { children: [
                /* @__PURE__ */ jsx(PStatusDot, {}),
                /* @__PURE__ */ jsx(PStatusTxt, { children: "Online" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(PWelcome, { children: [
              /* @__PURE__ */ jsx(PGreet, { children: "Good morning" }),
              /* @__PURE__ */ jsx(PH1, { children: "Welcome back." })
            ] }),
            /* @__PURE__ */ jsxs(PSvcHead, { children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(PSvcSub, { children: "Services" }),
                /* @__PURE__ */ jsx(PSvcTitle, { children: "Select to Begin" })
              ] }),
              /* @__PURE__ */ jsxs(PSvcSub, { style: { display: "flex", alignItems: "center", gap: "4px", color: portalCyan }, children: [
                /* @__PURE__ */ jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx("path", { d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" }) }),
                "4 Available"
              ] })
            ] }),
            /* @__PURE__ */ jsx(PGrid, { children: PortalCardsData.map((c, i) => /* @__PURE__ */ jsxs(PCard, { className: c.magenta ? "magenta" : "", children: [
              /* @__PURE__ */ jsx(PCorner, { className: `${c.magenta ? "magenta" : ""} tl` }),
              /* @__PURE__ */ jsx(PCorner, { className: `${c.magenta ? "magenta" : ""} tr` }),
              /* @__PURE__ */ jsx(PCorner, { className: `${c.magenta ? "magenta" : ""} bl` }),
              /* @__PURE__ */ jsx(PCorner, { className: `${c.magenta ? "magenta" : ""} br` }),
              /* @__PURE__ */ jsx(PNum, { children: c.num }),
              /* @__PURE__ */ jsx(PIconBox, { className: c.magenta ? "magenta" : "", children: c.icon }),
              /* @__PURE__ */ jsx(PCardTitle, { children: c.title }),
              /* @__PURE__ */ jsx(PCardDesc, { children: c.desc }),
              /* @__PURE__ */ jsxs(PCont, { className: c.magenta ? "magenta" : "", children: [
                "Continue",
                /* @__PURE__ */ jsx("svg", { width: "8", height: "8", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx("path", { d: "M7 7h10v10M7 17L17 7" }) })
              ] })
            ] }, i)) })
          ] }) }) }) }),
          /* @__PURE__ */ jsx(TabletFace, { className: "back", children: /* @__PURE__ */ jsx(TabletFrame, { children: /* @__PURE__ */ jsx(TabletScreen, { children: /* @__PURE__ */ jsxs(FloralUI, { children: [
            /* @__PURE__ */ jsx(FlpHero, { src: FloralData[currentFlower].img, alt: "Floral Tribute", fading: fading ? 1 : 0, loading: "lazy", decoding: "async" }),
            /* @__PURE__ */ jsx(FlpOverlay, {}),
            /* @__PURE__ */ jsx(FlpStrip, { children: FloralData.map((f, i) => /* @__PURE__ */ jsxs(FlpStory, { onClick: () => selectFlower(i), children: [
              /* @__PURE__ */ jsx(FlpRing, { className: i === currentFlower ? "unseen" : "seen", children: /* @__PURE__ */ jsx(FlpRingInner, { children: /* @__PURE__ */ jsx("img", { src: f.img, alt: f.label, loading: "lazy", decoding: "async" }) }) }),
              /* @__PURE__ */ jsx(FlpStoryLabel, { children: f.label })
            ] }, i)) }),
            /* @__PURE__ */ jsxs(FlpTitleBlock, { children: [
              /* @__PURE__ */ jsx(FlpNameTag, { children: "Floral Tributes" }),
              /* @__PURE__ */ jsx(FlpHeadline, { fading: fading ? 1 : 0, children: FloralData[currentFlower].title })
            ] }),
            /* @__PURE__ */ jsxs(FlpWordmark, { children: [
              /* @__PURE__ */ jsx(FlpWordmarkName, { children: "Memorial Florals" }),
              /* @__PURE__ */ jsx(FlpWordmarkSub, { children: "Est. since care began" })
            ] })
          ] }) }) }) })
        ] }) }) }) }) })
      ] }) })
    ] })
  ] });
}
export {
  Hero as default
};
