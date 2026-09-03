import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowRight, FileText, Users, ClipboardList, Flower2, ScrollText, Heart,
  CheckCircle, TrendingUp, ShieldCheck
} from '../../utils/icons/icons';
import C from '../../utils/colors/index';

/* ───────────────────────────────────────────────────────────
   ANIMATED NUMBER (no wrapper div)
─────────────────────────────────────────────────────────── */
const AnimatedNumber = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let v = 0;
    const step = end / (1500 / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [active, end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ───────────────────────────────────────────────────────────
   SECTION + WRAP
─────────────────────────────────────────────────────────── */
const Section = styled.section`
  padding: clamp(4rem, 8vw, 7rem) 0;
  background: ${C.bone};
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
`;

const Wrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
  box-sizing: border-box;
`;

/* ───────────────────────────────────────────────────────────
   SECTION HEADER
─────────────────────────────────────────────────────────── */
const SectionLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${C.brass};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before {
    content: '';
    width: 12px;
    height: 2px;
    background: ${C.brass};
    display: inline-block;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 600;
  color: ${C.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;
  max-width: 560px;
  margin-bottom: 0.75rem;
`;

const SectionDesc = styled.p`
  font-size: 0.95rem;
  color: ${C.gray};
  line-height: 1.7;
  max-width: 500px;
  margin-bottom: 2.5rem;
`;

/* ───────────────────────────────────────────────────────────
   BENTO GRID
─────────────────────────────────────────────────────────── */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  box-sizing: border-box;

  & > .hero  { grid-column: span 2; grid-row: span 2; min-height: 420px; }
  & > .wide  { grid-column: span 2; min-height: 200px; }
  & > .tall  { min-height: 200px; }

  & > * {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    & > .hero { grid-column: span 2; grid-row: span 2; min-height: 340px; }
    & > .wide { grid-column: span 2; min-height: 180px; }
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 8px;
    & > .hero,
    & > .wide { grid-column: span 1; grid-row: span 1; min-height: 220px; }
    & > .tall  { min-height: 180px; }
  }
`;

/* ───────────────────────────────────────────────────────────
   IMAGE CARD
─────────────────────────────────────────────────────────── */
const ImgCard = styled.div`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(21, 23, 26, 0.07);
  box-sizing: border-box;

  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    transform 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    box-shadow 0.4s ease,
    border-color 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-4px);
    border-color: transparent;
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }

  &:hover img {
    transform: scale(1.05);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(21,23,26,0) 0%,
      rgba(21,23,26,0.08) 35%,
      rgba(21,23,26,0.65) 70%,
      rgba(21,23,26,0.92) 100%
    );
    transition: background 0.4s ease;
    z-index: 1;
  }
`;

const ImgContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 1.4rem 1.5rem;
  color: #fff;

  .hero & {
    padding: 1.8rem 2rem;
  }
`;

const CardLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${p => p.$color || C.brassLight};
  margin-bottom: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  &::before {
    content: '';
    width: 8px;
    height: 1.5px;
    background: currentColor;
    display: inline-block;
    flex-shrink: 0;
  }
`;

const CardHeading = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 0.3rem;
  .hero & { font-size: 1.55rem; margin-bottom: 0.5rem; }
`;

const CardSub = styled.div`
  font-size: 0.72rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
  max-width: 340px;
  .hero & { font-size: 0.8rem; max-width: 400px; margin-bottom: 0.8rem; }
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.7rem;
`;

const Tags = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.44rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.18rem 0.45rem;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
`;

const GoBtn = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255,255,255,0.5);
  svg { width: 12px; height: 12px; }
`;

/* ───────────────────────────────────────────────────────────
   STAT CARD
─────────────────────────────────────────────────────────── */
const StatCard = styled.div`
  position: relative;
  border-radius: 14px;
  background: ${C.ink};
  border: 1px solid rgba(250,248,244,0.07);
  padding: 1.4rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;

  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    transform 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    box-shadow 0.4s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px -10px rgba(21,23,26,0.4);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--gx, 50%) var(--gy, 40%),
      ${p => p.$glow || 'rgba(61,79,71,0.1)'} 0%,
      transparent 55%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover::before { opacity: 1; }
`;

const StatTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.6rem;
`;

const StatLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.52rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(250,248,244,0.35);
  white-space: pre-line;
  line-height: 1.5;
`;

const StatIconBox = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${p => p.$bg || 'rgba(61,79,71,0.12)'};
  border: 1px solid ${p => p.$border || 'rgba(61,79,71,0.15)'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 16px; height: 16px; }
`;

const StatNum = styled.div`
  font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  color: ${C.bone};
  line-height: 1;
  letter-spacing: -0.03em;
  margin: 0.4rem 0;
  span { font-size: 0.9rem; font-weight: 500; color: rgba(250,248,244,0.4); margin-left: 0.1rem; }
`;

const StatBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  padding: 0.14rem 0.4rem;
  border-radius: 3px;
  color: ${p => p.$up ? '#7db8a0' : C.brassLight};
  background: ${p => p.$up ? 'rgba(125,184,160,0.1)' : 'rgba(169,143,110,0.1)'};
  margin-bottom: 0.5rem;
`;

const StatBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${C.bone};
`;

const StatTag = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.46rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.16rem 0.45rem;
  border-radius: 3px;
  border: 1px solid rgba(250,248,244,0.08);
  color: rgba(250,248,244,0.4);
`;

/* ───────────────────────────────────────────────────────────
   LIVE MODULE PREVIEW
─────────────────────────────────────────────────────────── */
const PREVIEW_W = 1280;
const PREVIEW_H = 800;

const LiveViewport = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LiveFrameBox = styled.div`
  width: ${PREVIEW_W}px;
  height: ${PREVIEW_H}px;
  flex-shrink: 0;
  transform: scale(${p => p.$scale});
  transform-origin: center center;
  box-shadow: 0 18px 60px rgba(21, 23, 26, 0.35);
`;

const LiveScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(21,23,26,0.25) 0%,
    rgba(21,23,26,0.45) 55%,
    rgba(21,23,26,0.82) 100%
  );
`;

function CardLivePreview({ url, scrim = false }) {
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setScale(r.width / PREVIEW_W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <LiveViewport ref={wrapRef} aria-hidden="true">
      {inView && (
        <LiveFrameBox $scale={scale}>
          <iframe
            src={url}
            title="Module live preview"
            loading="lazy"
            tabIndex={-1}
            onLoad={() => setLoaded(true)}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.6s ease',
              background: 'transparent',
            }}
          />
        </LiveFrameBox>
      )}
      {scrim && <LiveScrim />}
    </LiveViewport>
  );
}

const StatContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-height: 0;
`;

/* ───────────────────────────────────────────────────────────
   DATA
─────────────────────────────────────────────────────────── */
const IMAGE_CARDS = [
  {
    id: 'intake',
    cls: 'hero',
    label: 'Case Management',
    labelColor: '#7db8a0',
    heading: 'Body Intake Form',
    sub: 'Digital registration with next-of-kin details, verification, and signature capture in one structured flow.',
    image: 'https://picsum.photos/seed/morgue-clinical-intake/900/800',
    preview: '/preview/body-intake',
    tags: ['Digital Forms', 'Sign-off', 'Auto ID'],
    accentBg: C.verdigris,
    shadow: 'rgba(61,79,71,0.3)',
    delay: 0,
  },
  {
    id: 'flower',
    cls: 'wide',
    label: 'Commerce',
    labelColor: C.accent,
    heading: 'Flower Bookings',
    sub: 'Families browse, order, and track floral arrangements linked directly to service schedules.',
    image: 'https://picsum.photos/seed/floral-wreath-white/900/400',
    preview: '/preview/flower-bookings',
    tags: ['Catalogue', 'Orders', 'Delivery'],
    accentBg: C.accent,
    shadow: 'rgba(199,123,94,0.3)',
    delay: 240,
  },
  {
    id: 'release',
    cls: 'wide',
    label: 'Self-Service',
    labelColor: C.brassLight,
    heading: 'Release Form Portal',
    sub: 'Families complete release documentation independently — digital forms and e-signature, no staff needed.',
    image: 'https://picsum.photos/seed/document-official-release/900/400',
    preview: '/preview/release-form',
    tags: ['E-Sign', 'ID Verify', 'Auto-Process'],
    accentBg: C.brass,
    shadow: 'rgba(139,115,85,0.3)',
    delay: 320,
  },
  {
    id: 'memorial',
    cls: 'wide',
    label: 'Tributes',
    labelColor: '#7db8a0',
    heading: 'Memorial Portal',
    sub: 'Share memorial pages with obituaries, photo galleries, and tribute messages for families and communities.',
    image: 'https://picsum.photos/seed/memorial-candle-tribute/900/400',
    preview: '/preview/memorial-portal',
    tags: ['Obituaries', 'Gallery', 'Livestream'],
    accentBg: '#4D9B7F',
    shadow: 'rgba(77,99,89,0.3)',
    delay: 400,
  },
];

const STAT_CARDS = [
  {
    id: 'reception',
    label: 'Receptionist\nPortal',
    number: 54,
    suffix: '/day',
    change: '+40% this month',
    up: true,
    name: 'Walk-in Clients',
    tag: 'Live',
    preview: '/preview/reception-portal',
    iconBg: 'rgba(61,79,71,0.12)',
    iconBorder: 'rgba(61,79,71,0.15)',
    iconColor: '#7db8a0',
    glow: 'rgba(61,79,71,0.12)',
    icon: Users,
    delay: 80,
  },
  {
    id: 'postmortem',
    label: 'Postmortem\nPortal',
    number: 12,
    suffix: '',
    change: 'Pending review',
    up: false,
    name: 'PM Reports',
    tag: 'Medical',
    preview: '/preview/postmortem-portal',
    iconBg: 'rgba(155,74,63,0.12)',
    iconBorder: 'rgba(155,74,63,0.15)',
    iconColor: '#d49a93',
    glow: 'rgba(155,74,63,0.1)',
    icon: ClipboardList,
    delay: 160,
  },
];

/* ───────────────────────────────────────────────────────────
   COMPONENTS
─────────────────────────────────────────────────────────── */
function ImageCardEl({ m }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (m.preview) {
      navigate(m.preview);
    }
  };

  return (
    <ImgCard
      id={`bento-${m.id}`}
      className={m.cls}
      style={{ '--delay': `${m.delay}ms` }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 48px -12px ${m.shadow}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      onClick={handleClick}
      role={m.preview ? 'link' : undefined}
    >
      <img src={m.image} alt={m.heading} loading="lazy" />
      {m.preview && <CardLivePreview url={m.preview} />}
      <ImgContent className={m.cls}>
        <CardLabel $color={m.labelColor}>{m.label}</CardLabel>
        <CardHeading className={m.cls}>{m.heading}</CardHeading>
        <CardSub className={m.cls}>{m.sub}</CardSub>
        <CardRow>
          <Tags>{m.tags.map(t => <Tag key={t}>{t}</Tag>)}</Tags>
          <GoBtn><ArrowRight /></GoBtn>
        </CardRow>
      </ImgContent>
    </ImgCard>
  );
}

function StatCardEl({ m }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  const onMove = useCallback(e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    el.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, []);

  const Icon = m.icon;
  
  const handleClick = () => {
    if (m.preview) {
      navigate(m.preview);
    }
  };

  return (
    <StatCard
      ref={ref}
      id={`bento-${m.id}`}
      className="tall"
      style={{ '--delay': `${m.delay}ms` }}
      $glow={m.glow}
      onMouseMove={onMove}
      onClick={handleClick}
      role={m.preview ? 'link' : undefined}
    >
      {m.preview && <CardLivePreview url={m.preview} scrim />}
      <StatContent>
        <StatTop>
          <StatLabel>{m.label}</StatLabel>
          <StatIconBox $bg={m.iconBg} $border={m.iconBorder}>
            <Icon size={16} color={m.iconColor} />
          </StatIconBox>
        </StatTop>
        <div>
          <StatNum>
            <AnimatedNumber end={m.number} />{m.suffix && <span>{m.suffix}</span>}
          </StatNum>
          <StatBadge $up={m.up}>{m.change}</StatBadge>
        </div>
        <StatBottom>
          <StatName>{m.name}</StatName>
          <StatTag>{m.tag}</StatTag>
        </StatBottom>
      </StatContent>
    </StatCard>
  );
}

/* ───────────────────────────────────────────────────────────
   MAIN EXPORT
─────────────────────────────────────────────────────────── */
export default function ModuleGridSection() {
  const gridRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('[id^="bento-"]');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return (
    <Section>
      <Wrap>
        <SectionLabel>Unified Platform</SectionLabel>
        <SectionTitle>Everything your funeral home needs, in one place</SectionTitle>
        <SectionDesc>
          Six integrated modules designed to handle every aspect of your operations —
          from intake to memorial, all managed through a single dashboard.
        </SectionDesc>

        <Grid ref={gridRef}>
          {/* Row 1–2 hero (cols 1-2, 2 rows) */}
          <ImageCardEl m={IMAGE_CARDS[0]} />

          {/* Row 1 stats (cols 3, 4) */}
          {STAT_CARDS.map(m => <StatCardEl key={m.id} m={m} />)}

          {/* Row 2 wide (cols 3-4) */}
          <ImageCardEl m={IMAGE_CARDS[1]} />

          {/* Row 3 wide cards (cols 1-2 and 3-4) */}
          <ImageCardEl m={IMAGE_CARDS[2]} />
          <ImageCardEl m={IMAGE_CARDS[3]} />
        </Grid>
      </Wrap>
    </Section>
  );
}