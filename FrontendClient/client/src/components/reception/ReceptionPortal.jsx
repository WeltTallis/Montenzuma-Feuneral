"use client";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { useTenantStore } from "../../modules/seo/useTenantStore";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";


/* Font family stack — Saira is now strictly enforced everywhere in the UI
   to prevent browser fallback fonts from making the text look bad. */
const BODY = "'Saira', sans-serif";
const HEAD = "'Saira', sans-serif"; // Kept as Saira to ensure uniformity across all titles
const MONO = "'JetBrains Mono', monospace";

/* ── Inline icon set ───────────────────────────────────────── */
function Icon({ size = 14, sw = 2.25, color = "currentColor", children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
        {children}

      </g>
    </svg>
  );
}



const ArrowLeftIcon = (p) => (
  <Icon {...p}>
    <path d="m12 19l-7-7l7-7m7 7H5" />
  </Icon>
);



const ArrowUpRightIcon = (p) => (
  <Icon {...p}>
    <path d="M7 7h10v10M7 17L17 7" />
  </Icon>
);




const Building2Icon = (p) => (
  <Icon {...p}>
    <path d="M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3" />
    <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
  </Icon>
);



const LogOutIcon = (p) => (
  <Icon {...p}>
    <path d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </Icon>
);


const Flower2Icon = (p) => (
  <Icon {...p}>
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" />
    <circle cx="12" cy="8" r="2" />
    <path d="M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5" />
  </Icon>
);


const FileTextIcon = (p) => (
  <Icon {...p}>
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" />
  </Icon>
);


/* Shield-check (Amani Insurance) — shield outline with a check mark. It is the
   one tile whose mock uses a finer stroke (1.6), so sw is baked in here and the
   mock stays pixel-identical. */
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24">
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  </svg>
);

const BLUE = {
  bright: "#4A8FD4",
  cardBorder: "#00296B88",
  rule: "#4A8FD470",
  glow: "rgba(74,143,212,.30)",
  glowStrong: "rgba(74,143,212,.55)",
  ghost: "#4A8FD412",
  bg: "linear-gradient(145deg, #081426 0%, #04070d 100%)",
};
const RED = {
  bright: "#ff006e",
  cardBorder: "#ff006e40",
  rule: "#ff006e70",
  glow: "rgba(255,0,110,.30)",
  glowStrong: "rgba(255,0,110,.55)",
  ghost: "#ff006e12",
  bg: "linear-gradient(145deg, #1f0a15 0%, #0a0305 100%)",
};
const GREEN = {
  bright: "#34D399",
  cardBorder: "#34d3994c",
  rule: "#34D39970",
  glow: "rgba(52,211,153,.30)",
  glowStrong: "rgba(52,211,153,.55)",
  ghost: "#34d39912",
  bg: "linear-gradient(145deg, #0a1410 0%, #050a07 100%)",
};

/* ── Card data ─────────────────────────────────────────────── */
const CARDS = [
  {
    num: "01",
    title: "Body Admission",
    sub: "Respectful reception & formal registration of the deceased",
    ...BLUE,
    Icon: Building2Icon,
  },
  {
    num: "02",
    title: "Body Release",
    sub: "Dignified coordination of the final departure",
    ...RED,
    Icon: LogOutIcon,
  },
  {
    num: "03",
    title: "Flower Arrangements",
    sub: "Bespoke floral tributes, wreaths & memorial displays",
    ...BLUE,
    Icon: Flower2Icon,
  },
  {
    num: "04",
    title: "Postmortem Records",
    sub: "Secure access to medical documentation & reports",
    ...RED,
    Icon: FileTextIcon,
  },
  {
    num: "05",
    title: "Amani Insurance",
    sub: "Funeral cover with peace of mind for your family",
    ...GREEN,
    Icon: ShieldCheckIcon,
  },
];

/* ── Animations ────────────────────────────────────────────── */
const spin = keyframes`to { transform: rotate(360deg); }`;
const drift = keyframes`
  0%   { transform: scale(1.08) translate3d(0,0,0); }
  100% { transform: scale(1.16) translate3d(-1.5%,-1.5%,0); }
`;
const rise = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulse = keyframes`
  0%,100% { opacity: 1; box-shadow: 0 0 0 0 ${BLUE.glow}; }
  50%     { opacity: .5; box-shadow: 0 0 0 5px rgba(74,143,212,0); }
`;

/* ── Global font import ────────────────────────────────────── */
const GlobalFonts = createGlobalStyle`
  body {
    margin: 0;
    background: #050507;
    font-family: ${BODY};
    color: #e8e8eb;
  }
`;

/* ── Styled components ─────────────────────────────────────── */
const Shell = styled.div`
  background: #050507;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  font-family: ${BODY};
  color: #e8e8eb;
`;

const Hero = styled.div`
  position: relative;
  overflow: hidden;
  height: 100vh;
  min-height: 640px;
  max-height: 1100px;
  background:
    radial-gradient(80% 60% at 70% 20%, rgba(74, 143, 212, 0.14), transparent 60%),
    radial-gradient(70% 60% at 20% 80%, rgba(255, 0, 110, 0.1), transparent 60%),
    linear-gradient(160deg, #0b0d14 0%, #050507 60%, #030304 100%);
  @media (max-width: 1100px) { height: 60vh; min-height: 500px; max-height: 800px; }
  @media (max-width: 880px)  { height: 60vh; min-height: 480px; max-height: 800px; }
  @media (max-width: 600px)  { height: 48vh; min-height: 380px; max-height: 600px; }
`;

const HeroImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 50%;
  animation: ${drift} 28s ease-in-out infinite alternate;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) => p.$g};
`;

const TopBar = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 48px 0;
  animation: ${rise} 0.9s ease both;
  @media (max-width: 1100px) { padding: 28px 32px 0; }
  @media (max-width: 880px)  { flex-wrap: wrap; row-gap: 12px; padding: 22px 24px 0; }
  @media (max-width: 720px)  { padding: 20px 20px 0; }
  @media (max-width: 480px)  { flex-wrap: wrap; row-gap: 12px; padding: 16px 16px 0; }
`;

const BackBtn = styled.button`
  font-family: ${BODY};
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${BLUE.bright};
  background: transparent;
  border: none;
  padding: 4px 0;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s ease, opacity 0.25s ease;
  &:hover { transform: translateX(-4px); opacity: 0.85; }
  @media (max-width: 880px) { flex: 1; }
  @media (max-width: 480px) { flex: 1; }
`;

const Wordmark = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  @media (max-width: 880px) { order: 3; flex-basis: 100%; margin-top: 6px; }
  @media (max-width: 480px) { order: 3; flex-basis: 100%; margin-top: 6px; }
`;

const Name = styled.div`
  font-size: 18px;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: #e8e8eb;
  font-weight: 600;
  font-family: ${BODY};
  @media (max-width: 1100px) { font-size: 15px; letter-spacing: 3px; }
  @media (max-width: 880px)  { font-size: 13px; letter-spacing: 2px; }
  @media (max-width: 720px)  { font-size: 14px; letter-spacing: 3px; text-align: center; }
  @media (max-width: 480px)  { font-size: 12px; letter-spacing: 2px; }
`;

const Tag = styled.div`
  font-family: ${BODY};
  font-size: 9px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #8a8a95;
  font-weight: 500;
  @media (max-width: 480px) { font-size: 8px; letter-spacing: 2px; }
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${BLUE.bright};
  animation: ${pulse} 2.6s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const HeroBottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;
  padding: 0 48px 40px;
  animation: ${rise} 1.1s ease both;
  @media (max-width: 1100px) { padding: 0 32px 40px; }
  @media (max-width: 880px)  { padding: 0 24px 36px; }
  @media (max-width: 720px)  { padding: 0 20px 32px; }
  @media (max-width: 480px)  { padding: 0 16px 28px; }
`;

const Title = styled.h1`
  font-family: ${BODY};
  font-size: 52px;
  color: #e8e8eb;
  line-height: 1.05;
  letter-spacing: -1px;
  font-weight: 700;
  margin: 0;
  @media (max-width: 1100px) { font-size: 44px; }
  @media (max-width: 880px)  { font-size: 38px; }
  @media (max-width: 720px)  { font-size: 34px; }
  @media (max-width: 480px)  { font-size: 28px; }
`;

const Body = styled.div`
  padding: 0 48px 64px;
  background: #050507;
  @media (max-width: 1100px) { padding: 0 32px 56px; }
  @media (max-width: 880px)  { padding: 0 24px 48px; }
  @media (max-width: 720px)  { padding: 0 20px 48px; }
  @media (max-width: 480px)  { padding: 0 16px 32px; }
`;

const SvcHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40px;
  margin-bottom: 32px;
  @media (max-width: 720px) { flex-direction: column; align-items: flex-start; gap: 16px; }
`;

const CardBtn = styled.button`
  text-align: left;
  padding: 0;
  background: transparent;
  border: 0;
  width: 100%;
  font-family: ${BODY};
  cursor: pointer;
  display: block;
  animation: ${rise} 0.7s ease both;
  /* Visible keyboard focus. Without this the card was completely unidentifiable
     when tabbed to, because the hover treatment only fires on :hover. */
  &:focus-visible {
    outline: 2px solid ${BLUE.bright};
    outline-offset: 4px;
    border-radius: 14px;
  }
  &:nth-of-type(1) { animation-delay: 0.05s; }
  &:nth-of-type(2) { animation-delay: 0.15s; }
  &:nth-of-type(3) { animation-delay: 0.25s; }
  &:nth-of-type(4) { animation-delay: 0.35s; }
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const CardBox = styled.div`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${(p) => p.$bg};
  border: 1.5px solid ${(p) => p.$border};
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 36px 32px 30px;
  min-height: 280px;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease;
  ${CardBtn}:hover &, ${CardBtn}:focus-visible & {
    transform: translateY(-8px);
    border-color: ${(p) => p.$accent};
    box-shadow: 0 34px 80px rgba(0, 0, 0, 0.8), 0 0 40px ${(p) => p.$glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  ${CardBtn}:active & {
    transform: translateY(-5px) scale(0.995);
  }
  @media (max-width: 880px) { min-height: 250px; padding: 28px 24px 24px; }
  @media (max-width: 720px) { min-height: 240px; }
  @media (max-width: 600px) { min-height: 210px; padding: 24px 20px 20px; }
`;

/* The card's service icon, drawn bare on the card surface. drop-shadow follows the
   stroke itself (SVG filters respect alpha), so the glow hugs the glyph instead
   of showing as a blurred rectangle behind a bounding box. */
const IconBare = styled.span`
  display: inline-flex;
  color: ${(p) => p.$accent};
  filter: drop-shadow(0 0 8px ${(p) => p.$glow});
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease;
  ${CardBtn}:hover & {
    transform: scale(1.1);
    filter: drop-shadow(0 0 14px ${(p) => p.$glow});
  }
  @media (max-width: 600px) {
    svg { width: 30px; height: 30px; }
  }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

const Corner = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  ${(p) => p.$pos === "tl" && `top:0; left:0; border-top:2px solid ${p.$accent}; border-left:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "tr" && `top:0; right:0; border-top:2px solid ${p.$accent}; border-right:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "bl" && `bottom:0; left:0; border-bottom:2px solid ${p.$accent}; border-left:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "br" && `bottom:0; right:0; border-bottom:2px solid ${p.$accent}; border-right:2px solid ${p.$accent};`}
`;

const Continue = styled.div`
  font-family: ${BODY};
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(p) => p.$accent};
  transition: gap 0.3s ease;
  ${CardBtn}:hover & { gap: 14px; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.97);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  display: flex;
  flex-direction: column;
  align-items: center;

  justify-content: center;
`;

const Spinner = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(74, 143, 212, 0.1);
  border-top-color: ${BLUE.bright};
  margin-bottom: 32px;
  animation: ${spin} 1.1s linear infinite;
  @media (prefers-reduced-motion: reduce) { animation-duration: 2.4s; }
`;

/* ── Component ─────────────────────────────────────────────── */
export default function App() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [greet, setGreet] = useState("Good morning");
  const [selectedService, setSelectedService] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const { tenantData } = useTenantStore();
  const tenantName = tenantData?.name || "";
  const tenantSlug =
    slug || (typeof window !== "undefined" && localStorage.getItem("tenantSlug")) || "";

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      let g = "Good morning";
      if (h >= 12 && h < 17) g = "Good afternoon";
      else if (h >= 17) g = "Good evening";
      setGreet(g);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setShowOverlay(true);
    setTimeout(() => {
      let redirectPath = "/";
      if (serviceName === "Body Admission") redirectPath = `/${tenantSlug}/deceased/register`;
      else if (serviceName === "Body Release") redirectPath = `/${tenantSlug}/release-form/new`;
      else if (serviceName === "Flower Arrangements") redirectPath = `/${tenantSlug}/flower-samples`;
      else if (serviceName === "Postmortem Records") redirectPath = `/${tenantSlug}/postmortem-request`;
      // Amani Insurance opens the public Amani Cover landing page (/amani/cover),
      // NOT /insurance — that route is the Rest Point B2B insurance page and is
      // still used by the main website. Deliberately NOT prefixed with
      // tenantSlug: the reception portal is public, and this page is public.
      else if (serviceName === "Amani Insurance") redirectPath = "/amani/cover";
      navigate(redirectPath);
      setShowOverlay(false);
      setSelectedService(null);
    }, 1400);
  };

  return (
    <>
      <GlobalFonts />
      <Shell>
        {/* ── Hero ── */}
        <Hero>
          <div style={{ position: "absolute", inset: 0 }}>
            {/* onError hides the <img> so the Hero's gradient backdrop shows
                through instead of a broken-image glyph on the landing screen. */}
            <HeroImg
              src="/portal.webp"
              alt="Reception portal"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <Scrim $g="linear-gradient(to right, rgba(14,14,25,0.95) 0%, rgba(5,5,7,0.85) 1%, rgba(5,5,7,0.4) 10%)" />
          <Scrim $g="linear-gradient(to top, rgba(5,5,7,1) 0%, rgba(5,5,7,0) 15%)" />
          <Scrim $g="linear-gradient(135deg, rgba(74,143,212,0.10) 0%, transparent 12%)" />

          <TopBar>
            <BackBtn
              onClick={() => navigate(`/${tenantSlug}/all-deceased`, { replace: true })}
              aria-label="Back to all deceased"
            >
              <span style={{ display: "inline-flex", width: 14, height: 14 }}>
                <ArrowLeftIcon size={14} color="currentColor" sw={3.4} />
              </span>
            </BackBtn>

            <Wordmark>
              <Name>{tenantName}</Name>
              <div
                style={{
                  width: 128,
                  height: 1,
                  background: "linear-gradient(to right, transparent, rgba(74,143,212,0.6), transparent)",
                }}
              />
              <Tag>Reception Portal</Tag>
            </Wordmark>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Dot />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#6a8a95",
                    fontWeight: 500,
                  }}
                >
                  Available
                </span>
              </div>
            </div>
          </TopBar>

          <HeroBottom>
            <div
              style={{
                fontFamily: BODY, // Applied Saira
                fontSize: 11,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#5a5a65",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              {greet}
            </div>
            <Title>Welcome back.</Title>
          </HeroBottom>
        </Hero>

        {/* ── Body ── */}
        <Body>
          <SvcHead>
            <div>
              <div
                style={{
                  fontFamily: BODY, // Applied Saira
                  fontSize: 11,
                  letterSpacing: 7,
                  textTransform: "uppercase",
                  color: "#5a5a65",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Services
              </div>
              <h3 style={{
                fontFamily: BODY, // Applied Saira
                fontSize: 28,
                color: "#ecfdf5",
                fontWeight: 600,
                margin: 0
              }}>
                Select a Service to Begin
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#8a8a95",
                letterSpacing: 3,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            ></div>
          </SvcHead>

          {/* Bootstrap grid */}
          <div className="row g-4">
            {CARDS.map((c) => (
              <div className="col-12 col-md-6" key={c.num}>
                <CardBtn
                  onClick={() => handleServiceClick(c.title)}
                  aria-label={`Begin ${c.title}`}
                >
                  <CardBox $bg={c.bg} $border={c.cardBorder} $accent={c.bright} $glow={c.glow}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent 5%, ${c.rule} 50%, transparent 95%)` }} />
                    <Corner $accent={c.bright} $pos="tl" />
                    <Corner $accent={c.bright} $pos="tr" />
                    <Corner $accent={c.bright} $pos="bl" />
                    <Corner $accent={c.bright} $pos="br" />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 8,
                        fontFamily: BODY, // Applied Saira
                        fontSize: 100,
                        fontWeight: 700,
                        color: c.ghost,
                        lineHeight: 1,
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      {c.num}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 24,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {/* Bare icon — no tile. The old 60x60 tinted box made every
                          card read as a generic icon-button row and buried the
                          corner brackets that give the card its identity. The
                          accent glow now carries that role instead. */}
                      <IconBare $accent={c.bright} $glow={c.glow}>
                        <c.Icon size={34} sw={1.6} color={c.bright} />
                      </IconBare>
                      <div style={{
                        fontFamily: BODY, // Applied Saira
                        fontSize: 28,
                        color: c.bright,
                        fontWeight: 700,
                        opacity: 0.65
                      }}>
                        {c.num}
                      </div>
                    </div>

                    <div style={{ marginBottom: 22, height: 4, background: `linear-gradient(to right, ${c.rule}, transparent)` }} />

                    <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          fontFamily: BODY, // Applied Saira
                          fontSize: 22,
                          color: "#f0ebe3",
                          letterSpacing: "-0.3px",
                          lineHeight: 1.3,
                          fontWeight: 600,
                          marginBottom: 10,
                        }}
                      >
                        {c.title}
                      </div>
                      <div style={{
                        fontFamily: BODY, // Applied Saira
                        fontSize: 13.5,
                        /* Cool grey-blue per the approved palette. This was a warm
                           tan (#a89a88) left over from a different theme, which
                           muddied the description against the navy cards. */
                        color: "#9aa3b8",
                        fontWeight: 300,
                        lineHeight: 1.7
                      }}>
                        {c.sub}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22, paddingTop: 8, position: "relative", zIndex: 1 }}>
                      <Continue $accent={c.bright}>
                        <span style={{
                          fontFamily: BODY, // Applied Saira
                          fontSize: 12,
                          letterSpacing: 2.5,
                          textTransform: "uppercase",
                          fontWeight: 500,
                          opacity: 0.9
                        }}>
                          Continue
                        </span>
                        <span style={{ display: "inline-flex", width: 16, height: 16 }}>
                          <ArrowUpRightIcon size={16} color="currentColor" sw={2.25} />
                        </span>
                      </Continue>
                    </div>
                  </CardBox>
                </CardBtn>
              </div>
            ))}
          </div>
        </Body>
      </Shell>

      {/* veil overlay */}
      {showOverlay && (
        <Overlay>
          <Spinner />
          <div style={{
            fontFamily: BODY, // Applied Saira
            fontSize: 24,
            fontWeight: 600,
            color: "#e8e8eb",
            letterSpacing: "-0.2px",
            marginBottom: 12
          }}>
            {selectedService}
          </div>
          <div style={{
            fontFamily: BODY, // Applied Saira
            fontSize: 10,
            color: "#5a5a65",
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 300
          }}>
            Preparing your session
          </div>
        </Overlay>
      )}
    </>
  );
}