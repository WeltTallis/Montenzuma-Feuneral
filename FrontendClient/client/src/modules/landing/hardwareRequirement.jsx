import React, { useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

/* Tokens */

const C = {
  black: '#000000',
  paper: '#F7F3EA',
  verd: '#2E3F37',
  brass2: '#C9B08C',
  terra: '#BC5A38',
  terra2: '#D8916C',
  line: 'rgba(23,20,15,0.16)',
  bline: 'rgba(247,243,234,0.14)',
  bline2: 'rgba(247,243,234,0.4)',
  verdLine: 'rgba(247,243,234,0.15)',
  verdSub: '#A8B5AD',
};

const TABLET_IMG = 'https://kantronics.co.ke/cdn/shop/files/ipad_pro_m5_silver.webp?v=1763717320';

/* Global styles */

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: ${C.black};
    color: ${C.paper};
    font-family: 'Instrument Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::selection { background: ${C.terra}; color: ${C.paper}; }

  .rp-reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s ease var(--d, 0s), transform 0.8s cubic-bezier(0.22,1,0.36,1) var(--d, 0s);
  }
  .rp-reveal.rp-revealed { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .rp-reveal { opacity: 1; transform: none; transition: none; }
  }
`;

/* Reveal wrapper */

const Reveal = ({ delay = 0, children, ...rest }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('rp-revealed');
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="rp-reveal" style={{ '--d': `${delay}s` }} {...rest}>
      {children}
    </div>
  );
};

/* Top bar */

const TopBar = styled.header`
  background: ${C.black};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.05rem clamp(1.25rem, 4vw, 3.5rem);
  border-bottom: 1px solid ${C.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.65);

  .brand { display: flex; align-items: center; gap: 0.6rem; color: ${C.paper}; font-weight: 600; }
  .mark { width: 7px; height: 7px; background: ${C.terra}; display: inline-block; }
  .mid { color: ${C.brass2}; }

  @media (max-width: 680px) { .mid { display: none; } }
`;

/* Hero */

const Hero = styled.section`
  background: ${C.black};
  color: ${C.paper};
`;

const HeroInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(2.5rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 3.5rem) clamp(3.5rem, 6vw, 6rem);
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(2.5rem, 5vw, 5rem);
  align-items: start;

  @media (max-width: 1020px) { grid-template-columns: 1fr; }
`;

const Eyebrow = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${C.brass2};
  display: block;
  margin-bottom: 1.4rem;
`;

const H1 = styled.h1`
  font-family: 'Fraunces', serif;
  font-weight: 340;
  font-size: clamp(2.9rem, 4.8vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.02em;
  color: ${C.paper};

  em {
    display: block;
    font-style: italic;
    font-weight: 320;
    color: ${C.brass2};
    letter-spacing: -0.01em;
  }
`;

const HeroP = styled.p`
  margin-top: 1.6rem;
  max-width: 52ch;
  font-size: 0.95rem;
  line-height: 1.75;
  color: rgba(247, 243, 234, 0.68);

  strong { font-weight: 600; color: ${C.paper}; }
`;

/* Kit manifest */

const Manifest = styled.div`
  margin-top: 2.4rem;
  border: 1px solid ${C.bline2};
  outline: 1px solid ${C.bline};
  outline-offset: 4px;
  background: rgba(247, 243, 234, 0.03);
`;

const ManifestHead = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid ${C.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.55);

  b { color: ${C.paper}; font-weight: 600; }
`;

const MRow = styled.div`
  display: grid;
  grid-template-columns: 26px 1fr auto auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1.1rem;
  border-bottom: 1px solid ${C.bline};

  @media (max-width: 520px) {
    grid-template-columns: 20px 1fr auto;
    gap: 0.6rem;
  }
`;

const MNo = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: ${C.brass2};
`;

const MItem = styled.div`
  strong {
    display: block;
    font-weight: 600;
    font-size: 0.92rem;
    letter-spacing: -0.01em;
    color: ${C.paper};
  }
  .sub {
    display: block;
    margin-top: 0.3rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${C.brass2};
  }
`;

const Chip = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.34em 0.65em;
  border: 1px solid ${C.bline2};
  color: rgba(247, 243, 234, 0.85);
  white-space: nowrap;

  &.req { border-color: rgba(247, 243, 234, 0.85); color: ${C.paper}; }
`;

const MQty = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(247, 243, 234, 0.75);
  min-width: 2ch;
  text-align: right;

  &.on { color: ${C.terra2}; font-weight: 600; }

  @media (max-width: 520px) { display: none; }
`;

const SwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  input { position: absolute; opacity: 0; width: 1px; height: 1px; }

  .track {
    width: 42px;
    height: 22px;
    border: 1px solid rgba(247, 243, 234, 0.55);
    border-radius: 999px;
    position: relative;
    transition: background 0.25s, border-color 0.25s;
    flex-shrink: 0;
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${C.paper};
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), background 0.25s;
  }
  input:checked + .track { background: ${C.terra}; border-color: ${C.terra}; }
  input:checked + .track .knob { transform: translateX(20px); background: ${C.black}; }
  input:focus-visible + .track { outline: 2px solid ${C.terra2}; outline-offset: 3px; }

  .text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(247, 243, 234, 0.7);
  }

  @media (max-width: 520px) { .text { display: none; } }
`;

const MTotal = styled.div`
  padding: 0.85rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.7);
`;

const MNote = styled.p`
  margin: 0 1.1rem;
  max-height: ${({ show }) => (show ? '6em' : '0')};
  opacity: ${({ show }) => (show ? 1 : 0)};
  overflow: hidden;
  border-left: 2px solid ${C.terra2};
  padding: ${({ show }) => (show ? '0.8rem 0.9rem' : '0 0.9rem')};
  margin-bottom: ${({ show }) => (show ? '1rem' : '0')};
  font-size: 0.8rem;
  line-height: 1.6;
  color: rgba(247, 243, 234, 0.72);
  transition: max-height 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.4s, padding 0.45s, margin 0.45s;
`;

/* Features */

const Features = styled.div`
  margin-top: 2.6rem;
  border-bottom: 1px solid ${C.bline};
`;

const FeaturesHead = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.55);
  padding-bottom: 0.7rem;
  border-bottom: 1px solid ${C.bline2};
`;

const Feat = styled.div`
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 0.25rem;
  border-bottom: 1px solid ${C.bline};
  transition: padding-left 0.35s cubic-bezier(0.22,1,0.36,1), background 0.3s;
  cursor: default;

  &:hover { padding-left: 0.85rem; background: rgba(247, 243, 234, 0.05); }
  &:hover .no { color: ${C.terra2}; }
  &:hover .arrow { opacity: 0.75; transform: none; }

  .no {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1rem;
    color: ${C.brass2};
    transition: color 0.3s;
  }

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${C.paper};
  }
  p {
    font-size: 0.78rem;
    color: rgba(247, 243, 234, 0.58);
    margin-top: 0.15rem;
    line-height: 1.45;
  }

  .arrow {
    width: 18px;
    height: 18px;
    stroke: ${C.paper};
    stroke-width: 1.6;
    fill: none;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.3s, transform 0.35s cubic-bezier(0.22,1,0.36,1);
  }
`;

const TagNew = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  color: ${C.terra2};
  border: 1px solid ${C.terra2};
  padding: 0.2em 0.45em;
  font-weight: 600;
`;

/* Plate */

const HeroPlate = styled.div`
  position: relative;

  @media (max-width: 1020px) { max-width: 660px; }
`;

const PlateFrame = styled.div`
  border: 1px solid rgba(247, 243, 234, 0.28);
  outline: 1px solid rgba(247, 243, 234, 0.1);
  outline-offset: 4px;
  background: ${C.paper};
  color: #17140F;
  padding: 0 0 0.6rem;
  transition: transform 0.35s ease-out;
  will-change: transform;
`;

const PlateHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid ${C.line};

  .title { font-family: 'Fraunces', serif; font-style: italic; font-size: 1.05rem; }
  .meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(23, 20, 15, 0.55);
    text-align: right;
  }
`;

const PhotoStage = styled.div`
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2.5vw, 2rem) 0;
`;

const PhotoWrap = styled.figure`
  width: min(440px, 82%);
  margin: 0 auto;

  img {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: multiply;
    filter: sepia(0.06) contrast(1.02) saturate(0.96);
  }

  .img-note {
    display: none;
    padding: 2rem 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${C.terra};
    text-align: center;
  }

  &.img-fail img { display: none; }
  &.img-fail .img-note { display: block; }
`;

const PlateCaption = styled.p`
  margin: 1.1rem 1.15rem 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(23, 20, 15, 0.6);
  line-height: 1.7;

  b { color: ${C.terra}; font-weight: 600; }
`;

/* Requirement ledger */

const Requirement = styled.section`
  background: ${C.verd};
  color: ${C.paper};
`;

const ReqInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(4rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 3.5rem);
`;

const ReqHead = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  align-items: end;
  margin-bottom: 3.5rem;

  @media (max-width: 1020px) { grid-template-columns: 1fr; gap: 1.5rem; }

  h2 {
    font-family: 'Fraunces', serif;
    font-weight: 340;
    font-size: clamp(2.2rem, 4.2vw, 3.6rem);
    line-height: 1.04;
    letter-spacing: -0.02em;
  }
  h2 em { font-style: italic; color: ${C.brass2}; }

  aside {
    font-size: 0.92rem;
    line-height: 1.75;
    color: rgba(247, 243, 234, 0.65);
    max-width: 42ch;
  }
`;

const ReqEyebrow = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${C.brass2};
  display: block;
  margin-bottom: 1.2rem;
`;

const LedgerHead = styled.div`
  display: grid;
  grid-template-columns: 64px 1.05fr 1.5fr 190px;
  gap: 2rem;
  align-items: start;
  padding: 0 0 0.8rem;
  border-bottom: 1px solid rgba(247, 243, 234, 0.4);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.5);

  @media (max-width: 820px) { display: none; }
`;

const LedgerRow = styled.div`
  display: grid;
  grid-template-columns: 64px 1.05fr 1.5fr 190px;
  gap: 2rem;
  align-items: start;
  padding: 2.1rem 0;
  border-bottom: 1px solid ${C.verdLine};
  transition: background 0.3s;

  &:hover { background: rgba(247, 243, 234, 0.035); }

  @media (max-width: 820px) {
    grid-template-columns: 44px 1fr;
    gap: 0.8rem 1rem;
    padding: 1.7rem 0;

    .spec, .status { grid-column: 2; }
    .status { flex-direction: row; align-items: center; gap: 1rem; }
  }

  .no {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1.15rem;
    color: ${C.brass2};
    opacity: 0.85;
  }

  h3 {
    font-family: 'Fraunces', serif;
    font-weight: 420;
    font-size: 1.55rem;
    letter-spacing: -0.015em;
  }
  .sub {
    display: block;
    margin-top: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.verdSub};
  }

  .spec {
    font-size: 0.9rem;
    line-height: 1.7;
    color: rgba(247, 243, 234, 0.7);
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: flex-start;
  }

  .lchip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 0.38em 0.7em;
    border: 1px solid rgba(247, 243, 234, 0.35);
    color: rgba(247, 243, 234, 0.75);
    white-space: nowrap;
  }
  .lchip.req { border-color: rgba(247, 243, 234, 0.85); color: ${C.paper}; }
  .lchip.add { border-style: dashed; color: ${C.brass2}; border-color: ${C.brass2}; }
  .lchip.add.on { border-style: solid; color: ${C.terra2}; border-color: ${C.terra2}; }

  .qty {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1.05rem;
    color: rgba(247, 243, 234, 0.6);
  }
  .qty.on { color: ${C.terra2}; }
`;

const ReqQuote = styled.div`
  margin-top: 5rem;
  text-align: center;

  blockquote {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 320;
    font-size: clamp(1.5rem, 3vw, 2.3rem);
    line-height: 1.35;
    max-width: 26em;
    margin: 0 auto;
  }
  cite {
    display: block;
    margin-top: 1.4rem;
    font-style: normal;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: ${C.verdSub};
  }
`;

/* Marquee */

const scrollX = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const Marquee = styled.div`
  background: ${C.terra};
  color: #1A130E;
  overflow: hidden;
  border-top: 1px solid rgba(23, 20, 15, 0.35);

  .track {
    display: flex;
    width: max-content;
    animation: ${scrollX} 30s linear infinite;
  }
  &:hover .track { animation-play-state: paused; }

  .group { display: flex; align-items: center; padding: 1.5rem 0; }

  .item {
    font-family: 'Fraunces', serif;
    font-weight: 380;
    font-size: clamp(2rem, 4.4vw, 3.6rem);
    letter-spacing: -0.02em;
    white-space: nowrap;
    padding: 0 2.2rem;
  }
  .item.em { font-style: italic; font-weight: 340; }

  .ast {
    width: 0.55em;
    height: 0.55em;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .track { animation: none; }
  }
`;

const Asterisk = () => (
  <svg className="ast" viewBox="0 0 24 24">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </svg>
);

/* Colophon */

const Colophon = styled.footer`
  background: ${C.black};
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 2rem;
  padding: 1.2rem clamp(1.25rem, 4vw, 3.5rem);
  border-top: 1px solid ${C.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.5);
`;

/* Feature data */

const FEATURES = [
  { no: '01', title: 'Touch Signatures', text: 'Families sign intake and release forms directly on screen.' },
  { no: '02', title: 'Ink-Sign Stylus', isNew: true, text: 'Pressure-sensitive pen for natural, binding signatures.' },
  { no: '03', title: 'Digital Intake', text: 'A guided, paperless process for completing arrangements.' },
  { no: '04', title: 'Secure Releases', text: 'Simple, verified digital authorizations, end to end.' },
  { no: '05', title: 'Curated Florals', text: 'A visual catalog to select and annotate arrangements.' },
];

const MARQUEE_ITEMS = [
  { text: 'Required for all facilities' },
  { text: 'FrontDesk Portal', em: true },
  { text: 'iPad or Android, both work' },
  { text: 'Your facility, digitally elevated', em: true },
  { text: 'Signature-grade intake' },
];

/* Main component */

const HardwareRequirementSection = () => {
  const [stylus, setStylus] = useState(false);
  const [imgFail, setImgFail] = useState(false);
  const plateRef = useRef(null);

  /* Plate tilt, pointer devices only */
  useEffect(() => {
    const el = plateRef.current;
    if (!el) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1400px) rotateX(${(-y * 1.8).toFixed(2)}deg) rotateY(${(x * 1.8).toFixed(2)}deg)`;
    };
    const leave = () => { el.style.transform = 'perspective(1400px)'; };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <>
      <GlobalStyles />

      <TopBar>
        <span className="brand"><span className="mark" />Restpoint · Death care, digitally</span>
        <span className="mid">Hardware specification · Materials</span>
        <span>Spec No. 07 · Rev. C</span>
      </TopBar>

      <main>
        <Hero>
          <HeroInner>

            {/* Left column */}
            <div>
              <Reveal>
                <Eyebrow>§ 06 · Materials &amp; Hardware</Eyebrow>
              </Reveal>

              <Reveal delay={0.08}>
                <H1>FrontDesk<em>Tablet &amp; Stylus</em></H1>
              </Reveal>

              <Reveal delay={0.16}>
                <HeroP>
                  A dedicated touchscreen reception portal for funeral homes, one respectful,
                  seamless surface for browsing floral arrangements, completing intake, and
                  signing final documents. <strong>iPad or Android</strong>, any tablet works.
                  Plus a <strong>pressure-sensitive stylus</strong>, an add-on for facilities
                  that want every signature in ink.
                </HeroP>
              </Reveal>

              <Reveal delay={0.24}>
                <Manifest>
                  <ManifestHead><b>Kit manifest</b><span>Per facility</span></ManifestHead>

                  <MRow>
                    <MNo>01</MNo>
                    <MItem>
                      <strong>FrontDesk Tablet</strong>
                      <span className="sub">iPad or Android · facility's choice</span>
                    </MItem>
                    <Chip className="req">Required</Chip>
                    <MQty>×1</MQty>
                  </MRow>

                  <MRow>
                    <MNo>02</MNo>
                    <MItem>
                      <strong>Precision Stylus</strong>
                      <span className="sub">Pressure tip · Palm rejection</span>
                    </MItem>
                    <SwitchLabel aria-label="Add precision stylus to kit">
                      <input
                        type="checkbox"
                        checked={stylus}
                        onChange={(e) => setStylus(e.target.checked)}
                      />
                      <span className="track"><span className="knob" /></span>
                      <span className="text">{stylus ? 'Added' : 'Add stylus'}</span>
                    </SwitchLabel>
                    <MQty className={stylus ? 'on' : ''}>{stylus ? '×1' : '0'}</MQty>
                  </MRow>

                  <MTotal>
                    {stylus
                      ? 'Manifest total: 2 items · signature-grade'
                      : 'Manifest total: 1 item · stylus not included'}
                  </MTotal>

                  <MNote show={stylus}>
                    One stylus per tablet. Ships paired and pre-registered to your facility.
                  </MNote>
                </Manifest>
              </Reveal>

              <Reveal delay={0.32}>
                <Features>
                  <FeaturesHead>On the device</FeaturesHead>

                  {FEATURES.map((f) => (
                    <Feat key={f.no}>
                      <span className="no">{f.no}</span>
                      <div>
                        <h4>
                          {f.title}
                          {f.isNew && <TagNew>New</TagNew>}
                        </h4>
                        <p>{f.text}</p>
                      </div>
                      <svg className="arrow" viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Feat>
                  ))}
                </Features>
              </Reveal>
            </div>

            {/* Right column: the plate, just the image */}
            <HeroPlate>
              <Reveal delay={0.15}>
                <PlateFrame ref={plateRef}>
                  <PlateHead>
                    <span className="title">Plate I.</span>
                    <span className="meta">FrontDesk tablet</span>
                  </PlateHead>

                  <PhotoStage>
                    <PhotoWrap className={imgFail ? 'img-fail' : ''}>
                      <img
                        src={TABLET_IMG}
                        alt="FrontDesk tablet, iPad shown; Android tablets equally supported"
                        loading="eager"
                        onError={() => setImgFail(true)}
                      />
                      <figcaption className="img-note">Image unavailable, check connection</figcaption>
                    </PhotoWrap>
                  </PhotoStage>

                  <PlateCaption>
                    <b>Fig. 1</b> · FrontDesk tablet. iPad shown; Android equally supported.
                  </PlateCaption>
                </PlateFrame>
              </Reveal>
            </HeroPlate>

          </HeroInner>
        </Hero>

        {/* Requirement ledger */}
        <Requirement>
          <ReqInner>
            <ReqHead>
              <Reveal>
                <div>
                  <ReqEyebrow>§ 07 · The requirement</ReqEyebrow>
                  <h2>Required in <em>every</em> facility.<br />Recommended in every hand.</h2>
                </div>
              </Reveal>
              <Reveal delay={0.12}>
                <aside>
                  To operate the Restpoint system, all funeral homes purchase one tablet,
                  iPad or Android, whichever they prefer. It is the facility's primary digital
                  registry, from intake through release. The stylus is our recommended add on.
                </aside>
              </Reveal>
            </ReqHead>

            <Reveal>
              <LedgerHead>
                <span>No.</span><span>Item</span><span>Specification</span><span>Status / Qty</span>
              </LedgerHead>
            </Reveal>

            <Reveal delay={0.08}>
              <LedgerRow>
                <span className="no">01</span>
                <div>
                  <h3>FrontDesk Tablet</h3>
                  <span className="sub">iPad or Android, whichever the facility prefers</span>
                </div>
                <p className="spec">
                  The facility's primary digital registry. Every Restpoint feature, intake,
                  florals,  release,  postmortem Requests runs on this single device, from the first
                  admission to the final signature.
                </p>
                <div className="status">
                  <span className="lchip req">Required</span>
                  <span className="qty">×1</span>
                </div>
              </LedgerRow>
            </Reveal>

            <Reveal delay={0.16}>
              <LedgerRow>
                <span className="no">02</span>
                <div>
                  <h3>Precision Stylus</h3>
                  <span className="sub">Pressure-sensitive · Palm rejection</span>
                </div>
                <p className="spec">
                  Our recommended add on. A weighted pen for natural, binding signatures,
                  in intake &  Release Forms .
                  One per tablet.
                </p>
                <div className="status">
                  <span className={`lchip add ${stylus ? 'on' : ''}`}>
                    {stylus ? 'Specified' : 'Add-on'}
                  </span>
                  <span className={`qty ${stylus ? 'on' : ''}`}>{stylus ? '×1' : '×0'}</span>
                </div>
              </LedgerRow>
            </Reveal>

            <Reveal>
              <ReqQuote>
                <blockquote>
                  “Take pride in bringing high-end technology to the heart of death care.”
                </blockquote>
                <cite>Restpoint Field Manual · p. 12</cite>
              </ReqQuote>
            </Reveal>
          </ReqInner>
        </Requirement>
      </main>

      {/* Marquee */}
      <Marquee aria-hidden="true">
        <div className="track">
          {[0, 1].map((copy) => (
            <div className="group" key={copy} aria-hidden={copy === 1}>
              {MARQUEE_ITEMS.map((it) => (
                <React.Fragment key={`${copy}-${it.text}`}>
                  <span className={`item ${it.em ? 'em' : ''}`}>{it.text}</span>
                  <Asterisk />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </Marquee>

      <Colophon>
        <span>Restpoint · Death care, digitally</span>
        <span>Spec No. 07 · Rev. C</span>
      </Colophon>
    </>
  );
};

export default HardwareRequirementSection;