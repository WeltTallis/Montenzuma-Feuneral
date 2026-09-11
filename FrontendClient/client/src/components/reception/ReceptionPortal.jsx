"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import "bootstrap/dist/css/bootstrap.min.css";
import { useTenantStore } from "../../modules/seo/useTenantStore";

/* ──────────────────────────────────────────────────────────────
   Montezuma Funeral Home — Reception Portal
   Single-file component · Bootstrap grid + styled-components
   ────────────────────────────────────────────────────────────── */

const BODY = "'Space Grotesk', system-ui, sans-serif"
const HEAD = "'Space Grotesk', system-ui, serif"

/* ── Inline icon set ───────────────────────────────────────── */
function Icon({ size = 14, sw = 2.25, color = "currentColor", children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
        {children}
      </g>
    </svg>
  )
}
const ArrowLeftIcon = (p) => (
  <Icon {...p}>
    <path d="m12 19l-7-7l7-7m7 7H5" />
  </Icon>
)
const ArrowUpRightIcon = (p) => (
  <Icon {...p}>
    <path d="M7 7h10v10M7 17L17 7" />
  </Icon>
)
const Building2Icon = (p) => (
  <Icon {...p}>
    <path d="M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3" />
    <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
  </Icon>
)
const LogOutIcon = (p) => (
  <Icon {...p}>
    <path d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </Icon>
)
const Flower2Icon = (p) => (
  <Icon {...p}>
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" />
    <circle cx="12" cy="8" r="2" />
    <path d="M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5" />
  </Icon>
)
const FileTextIcon = (p) => (
  <Icon {...p}>
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8" />
  </Icon>
)
const SparklesIcon = (p) => (
  <Icon {...p}>
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4" />
    <circle cx="4" cy="20" r="2" />
  </Icon>
)

/* ── Card data ─────────────────────────────────────────────── */
const CARDS = [
  {
    num: "01",
    title: "Body Admission",
    sub: "Respectful reception & formal registration of the deceased",
    accent: "#00d9ff",
    bg: "linear-gradient(145deg, #0f1820 0%, #050709 100%)",
    border: "#00d9ff40",
    topRule: "linear-gradient(to right, transparent 5%, #00d9ff70 50%, transparent 95%)",
    ghost: "#00d9ff12",
    Icon: Building2Icon,
  },
  {
    num: "02",
    title: "Body Release",
    sub: "Dignified coordination of the final departure",
    accent: "#ff006e",
    bg: "linear-gradient(145deg, #1f0a15 0%, #0a0305 100%)",
    border: "#ff006e40",
    topRule: "linear-gradient(to right, transparent 5%, #ff006e70 50%, transparent 95%)",
    ghost: "#ff006e12",
    Icon: LogOutIcon,
  },
  {
    num: "03",
    title: "Flower Arrangements",
    sub: "Bespoke floral tributes, wreaths & memorial displays",
    accent: "#00d9ff",
    bg: "linear-gradient(145deg, #0a1520 0%, #050709 100%)",
    border: "#00d9ff40",
    topRule: "linear-gradient(to right, transparent 5%, #00d9ff70 50%, transparent 95%)",
    ghost: "#00d9ff12",
    Icon: Flower2Icon,
  },
  {
    num: "04",
    title: "Postmortem Records",
    sub: "Secure access to medical documentation & reports",
    accent: "#ff006e",
    bg: "linear-gradient(145deg, #180a14 0%, #070304 100%)",
    border: "#ff006e40",
    topRule: "linear-gradient(to right, transparent 5%, #ff006e70 50%, transparent 95%)",
    ghost: "#ff006e12",
    Icon: FileTextIcon,
  },
]

/* ── Animations ────────────────────────────────────────────── */
const spin = keyframes`to { transform: rotate(360deg); }`
const drift = keyframes`
  0%   { transform: scale(1.08) translate3d(0,0,0); }
  100% { transform: scale(1.16) translate3d(-1.5%,-1.5%,0); }
`
const rise = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`
const pulse = keyframes`
  0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,255,0.5); }
  50%     { opacity: .5; box-shadow: 0 0 0 5px rgba(0,217,255,0); }
`

/* ── Global font import ────────────────────────────────────── */
const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  body { background: #050507; }
`

/* ── Styled components ─────────────────────────────────────── */
const Shell = styled.div`
  background: #050507;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  font-family: ${BODY};
  color: #e8e8eb;
`

const Hero = styled.div`
  position: relative;
  overflow: hidden;
  height: 100vh;
  min-height: 900px;
  max-height: 1200px;
  @media (max-width: 1100px) { height: 60vh; min-height: 500px; max-height: 800px; }
  @media (max-width: 880px)  { height: 50vh; min-height: 400px; max-height: 700px; }
  @media (max-width: 720px)  { height: 40vh; min-height: 350px; max-height: 600px; }
  @media (max-width: 480px)  { height: 35vh; min-height: 300px; max-height: 500px; }
`

const HeroImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 50%;
  animation: ${drift} 28s ease-in-out infinite alternate;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) => p.$g};
`

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
`

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00d9ff;
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
`

const Wordmark = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  @media (max-width: 880px) { order: 3; flex-basis: 100%; margin-top: 6px; }
  @media (max-width: 480px) { order: 3; flex-basis: 100%; margin-top: 6px; }
`

const Name = styled.div`
  font-size: 18px;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: #e8e8eb;
  font-weight: 600;
  font-family: ${HEAD};
  @media (max-width: 1100px) { font-size: 15px; letter-spacing: 3px; }
  @media (max-width: 880px)  { font-size: 13px; letter-spacing: 2px; }
  @media (max-width: 720px)  { font-size: 14px; letter-spacing: 3px; text-align: center; }
  @media (max-width: 480px)  { font-size: 12px; letter-spacing: 2px; }
`

const Tag = styled.div`
  font-size: 9px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #8a8a95;
  font-weight: 500;
  @media (max-width: 480px) { font-size: 8px; letter-spacing: 2px; }
`

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00d9ff;
  animation: ${pulse} 2.6s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`

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
`

const Title = styled.h1`
  font-family: ${HEAD};
  font-size: 52px;
  color: #e8e8eb;
  line-height: 1.05;
  letter-spacing: -0.5px;
  font-style: italic;
  font-weight: 600;
  margin: 0;
  @media (max-width: 1100px) { font-size: 44px; }
  @media (max-width: 880px)  { font-size: 38px; }
  @media (max-width: 720px)  { font-size: 34px; }
  @media (max-width: 480px)  { font-size: 28px; }
`

const Body = styled.div`
  padding: 0 48px 64px;
  background: #050507;
  @media (max-width: 1100px) { padding: 0 32px 56px; }
  @media (max-width: 880px)  { padding: 0 24px 48px; }
  @media (max-width: 720px)  { padding: 0 20px 48px; }
  @media (max-width: 480px)  { padding: 0 16px 32px; }
`

const SvcHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40px;
  margin-bottom: 32px;
  @media (max-width: 720px) { flex-direction: column; align-items: flex-start; gap: 16px; }
`

const CardBtn = styled.button`
  text-align: left;
  padding: 0;
  background: transparent;
  border: 0;
  width: 100%;
  font-family: inherit;
  cursor: pointer;
  display: block;
  animation: ${rise} 0.7s ease both;
  &:nth-of-type(1) { animation-delay: 0.05s; }
  &:nth-of-type(2) { animation-delay: 0.15s; }
  &:nth-of-type(3) { animation-delay: 0.25s; }
  &:nth-of-type(4) { animation-delay: 0.35s; }
`

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
  ${CardBtn}:hover & {
    transform: translateY(-8px);
    border-color: ${(p) => p.$accent};
    box-shadow: 0 34px 80px rgba(0, 0, 0, 0.8), 0 0 40px ${(p) => p.$accent}30, inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  @media (max-width: 880px) { min-height: 250px; padding: 28px 24px 24px; }
  @media (max-width: 720px) { min-height: 240px; }
  @media (max-width: 480px) { min-height: 200px; padding: 24px 20px 20px; }
`

const Corner = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  ${(p) => p.$pos === "tl" && `top:0; left:0; border-top:2px solid ${p.$accent}; border-left:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "tr" && `top:0; right:0; border-top:2px solid ${p.$accent}; border-right:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "bl" && `bottom:0; left:0; border-bottom:2px solid ${p.$accent}; border-left:2px solid ${p.$accent};`}
  ${(p) => p.$pos === "br" && `bottom:0; right:0; border-bottom:2px solid ${p.$accent}; border-right:2px solid ${p.$accent};`}
`

const Continue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(p) => p.$accent};
  transition: gap 0.3s ease;
  ${CardBtn}:hover & { gap: 14px; }
`

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
`

const Spinner = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-top-color: #00d9ff;
  margin-bottom: 32px;
  animation: ${spin} 1.1s linear infinite;
`

/* ── Component ─────────────────────────────────────────────── */
export default function App() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [greet, setGreet] = useState("Good morning")
  const [selectedService, setSelectedService] = useState(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const { tenantData } = useTenantStore()
  const tenantName = tenantData?.name || ""
  const tenantSlug =
    slug || (typeof window !== "undefined" && localStorage.getItem("tenantSlug")) || ""

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours()
      let g = "Good morning"
      if (h >= 12 && h < 17) g = "Good afternoon"
      else if (h >= 17) g = "Good evening"
      setGreet(g)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName)
    setShowOverlay(true)
    setTimeout(() => {
      let redirectPath = "/"
      if (serviceName === "Body Admission") redirectPath = `/tenant/${tenantSlug}/deceased/register`
      else if (serviceName === "Body Release") redirectPath = `/tenant/${tenantSlug}/release-form/new`
      else if (serviceName === "Flower Arrangements") redirectPath = `/tenant/${tenantSlug}/flower-samples`
      else if (serviceName === "Postmortem Records") redirectPath = `/tenant/${tenantSlug}/postmortem-request`
      navigate(redirectPath)
      setShowOverlay(false)
      setSelectedService(null)
    }, 1400)
  }

  return (
    <>
      <GlobalFonts />
      <Shell>
        {/* ── Hero ── */}
        <Hero>
          <div style={{ position: "absolute", inset: 0 }}>
            <HeroImg src="/portal.webp" alt="Reception portal" />
          </div>
          <Scrim $g="linear-gradient(to right, rgba(14,14,25,0.95) 0%, rgba(5,5,7,0.85) 15%, rgba(5,5,7,0.4) 90%)" />
          <Scrim $g="linear-gradient(to top, rgba(5,5,7,1) 0%, rgba(5,5,7,0) 25%)" />
          <Scrim $g="linear-gradient(135deg, rgba(0,217,255,0.08) 0%, transparent 10%)" />

          <TopBar>
            <BackBtn
              onClick={() => navigate(`/tenant/${tenantSlug}/all-deceased`, { replace: true })}
              aria-label="Back to all deceased"
            >
              <span style={{ display: "inline-flex", width: 14, height: 14 }}>
                <ArrowLeftIcon size={14} color="currentColor" sw={3.4} />
              </span>
            </BackBtn>

            <Wordmark>
              <Name>{tenantName || "Reception Portal"}</Name>
              <div
                style={{
                  width: 128,
                  height: 1,
                  background: "linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent)",
                }}
              />
              <Tag>Reception Portal</Tag>
            </Wordmark>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Dot />
                <span
                  style={{
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
              <h3 style={{ fontFamily: HEAD, fontSize: 28, color: "#00d9ff", fontStyle: "italic", fontWeight: 600, margin: 0 }}>
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
            >
              <span style={{ display: "inline-flex", width: 14, height: 14 }}>
                <SparklesIcon size={14} color="currentColor" sw={3.4} />
              </span>
              <span>4 Available</span>
            </div>
          </SvcHead>

          {/* Bootstrap grid */}
          <div className="row g-4">
            {CARDS.map((c) => (
              <div className="col-12 col-md-6" key={c.num}>
                <CardBtn onClick={() => handleServiceClick(c.title)}>
                  <CardBox $bg={c.bg} $border={c.border} $accent={c.accent}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: c.topRule }} />
                    <Corner $accent={c.accent} $pos="tl" />
                    <Corner $accent={c.accent} $pos="tr" />
                    <Corner $accent={c.accent} $pos="bl" />
                    <Corner $accent={c.accent} $pos="br" />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 8,
                        fontFamily: HEAD,
                        fontSize: 100,
                        fontStyle: "italic",
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
                        marginBottom: 28,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          background: `${c.accent}22`,
                          border: `1.5px solid ${c.accent}50`,
                          boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <c.Icon size={26} sw={1.85} color={c.accent} />
                      </div>
                      <div style={{ fontFamily: HEAD, fontSize: 28, color: c.accent, fontStyle: "italic", opacity: 0.6 }}>
                        {c.num}
                      </div>
                    </div>

                    <div style={{ marginBottom: 24, height: 4, background: `linear-gradient(to right, ${c.accent}60, transparent)` }} />

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: HEAD,
                          fontSize: 22,
                          color: "#f0ebe3",
                          letterSpacing: "-0.3px",
                          lineHeight: 1.3,
                          fontWeight: 500,
                          marginBottom: 12,
                        }}
                      >
                        {c.title}
                      </div>
                      <div style={{ fontFamily: BODY, fontSize: 13.5, color: "#a89a88", fontWeight: 300, lineHeight: 1.7 }}>
                        {c.sub}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 8, position: "relative", zIndex: 1 }}>
                      <Continue $accent={c.accent}>
                        <span style={{ fontSize: 12, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 500, opacity: 0.9 }}>
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
          <div style={{ fontFamily: HEAD, fontSize: 24, fontStyle: "italic", color: "#e8e8eb", letterSpacing: "-0.2px", marginBottom: 12 }}>
            {selectedService}
          </div>
          <div style={{ fontSize: 10, color: "#5a5a65", letterSpacing: 4, textTransform: "uppercase", fontWeight: 300 }}>
            Preparing your session
          </div>
        </Overlay>
      )}
    </>
  )
}