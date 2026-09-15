import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowRight, FileText, Users, ClipboardList, ScrollText, Heart,
  CheckCircle, TrendingUp, ShieldCheck, Sparkles
} from '../../utils/icons/icons';
import C from '../../utils/colors/index';

/* ───────────────────────────────────────────────────────────
   ANIMATED NUMBER
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  box-sizing: border-box;

  & > .hero  { grid-column: span 1; grid-row: span 2; min-height: 400px; }
  & > .wide  { grid-column: span 1; min-height: 180px; }
  & > .tall  { min-height: 180px; }

  & > * {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    & > .hero { grid-column: span 2; grid-row: span 2; min-height: 340px; }
    & > .wide { grid-column: span 1; min-height: 180px; }
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 12px;
    & > .hero,
    & > .wide { grid-column: span 1; grid-row: span 1; min-height: 220px; }
    & > .tall  { min-height: 180px; }
  }
`;

/* ───────────────────────────────────────────────────────────
   PREVIEW CARD - No images, only preview
─────────────────────────────────────────────────────────── */
const PreviewCard = styled.div`
  position: relative;
  border-radius: 14px;
  background: ${C.ink};
  border: 1px solid rgba(250,248,244,0.07);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: ${p => p.$hero ? '400px' : '180px'};

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
      rgba(61,79,71,0.12) 0%,
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover::before { opacity: 1; }
`;

const PreviewIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(61,79,71,0.2);
  border: 1px solid rgba(61,79,71,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  svg { color: ${C.brassLight}; }
`;

const PreviewLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${C.brassLight};
  margin-bottom: 0.3rem;
`;

const PreviewTitle = styled.h3`
  font-family: 'Fraunces', serif;
  font-size: ${p => p.$hero ? '1.5rem' : '1.2rem'};
  font-weight: 600;
  color: ${C.bone};
  margin-bottom: 0.4rem;
`;

const PreviewDesc = styled.p`
  font-size: ${p => p.$hero ? '0.9rem' : '0.8rem'};
  color: rgba(250,248,244,0.5);
  line-height: 1.6;
  max-width: ${p => p.$hero ? '400px' : '100%'};
  flex: 1;
`;

const PreviewTag = styled.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.44rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.04);
  color: rgba(250,248,244,0.3);
  margin-top: 0.5rem;
`;

const PreviewBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(250,248,244,0.2);
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
  min-height: 180px;

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
   DATA - Only preview cards
─────────────────────────────────────────────────────────── */
const PREVIEW_CARDS = [
  {
    id: 'body-intake',
    label: 'Case Management',
    title: 'Body Intake Form',
    desc: 'A tablet-ready admission flow for next of kin details, verification, and signatures.',
    icon: FileText,
    tags: ['Digital Forms', 'Sign-off', 'Auto ID'],
    preview: '/preview/body-intake',
    delay: 0,
    hero: true,
  },
  {
    id: 'release-form',
    label: 'Self-Service',
    title: 'Release Form Portal',
    desc: 'Families complete release documents on a tablet with guided forms and e-signature.',
    icon: ScrollText,
    tags: ['E-Sign', 'ID Verify', 'Auto-Process'],
    preview: '/preview/release-form',
    delay: 200,
    hero: false,
  },
  {
    id: 'reception',
    label: 'Receptionist Portal',
    title: 'Reception Portal',
    desc: 'A tablet-friendly front desk for walk-ins, visits, and daily reception work.',
    icon: Users,
    tags: ['Walk-ins', 'Tracking', 'Workflow'],
    preview: '/preview/reception-portal',
    delay: 300,
    hero: false,
  },
];

const STAT_CARDS = [
  {
    id: 'active',
    label: 'Active\nSessions',
    number: 54,
    suffix: '',
    change: '+12% this week',
    up: true,
    name: 'Current Users',
    tag: 'Live',
    iconBg: 'rgba(61,79,71,0.12)',
    iconBorder: 'rgba(61,79,71,0.15)',
    iconColor: '#7db8a0',
    glow: 'rgba(61,79,71,0.12)',
    icon: TrendingUp,
    delay: 80,
  },
  {
    id: 'completed',
    label: 'Completed\nForms',
    number: 128,
    suffix: '',
    change: '+28% this month',
    up: true,
    name: 'Total Submissions',
    tag: 'Done',
    iconBg: 'rgba(125,184,160,0.12)',
    iconBorder: 'rgba(125,184,160,0.15)',
    iconColor: '#7db8a0',
    glow: 'rgba(125,184,160,0.1)',
    icon: CheckCircle,
    delay: 160,
  },
];

/* ───────────────────────────────────────────────────────────
   COMPONENTS
─────────────────────────────────────────────────────────── */
function PreviewCardEl({ m }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const Icon = m.icon;

  const onMove = useCallback(e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    el.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, []);

  const handleClick = () => {
    if (m.preview) {
      navigate(m.preview);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <PreviewCard
      ref={ref}
      id={`bento-${m.id}`}
      className={m.hero ? 'hero' : 'wide'}
      style={{ '--delay': `${m.delay}ms` }}
      $hero={m.hero}
      onMouseMove={onMove}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open ${m.title} tablet preview`}
    >
      <PreviewIcon><Icon size={24} /></PreviewIcon>
      <PreviewLabel>{m.label}</PreviewLabel>
      <PreviewTitle $hero={m.hero}>{m.title}</PreviewTitle>
      <PreviewDesc $hero={m.hero}>{m.desc}</PreviewDesc>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
        {m.tags.map(t => <PreviewTag key={t}>{t}</PreviewTag>)}
      </div>
      <PreviewBadge>
        <Sparkles size={12} />
        Open tablet preview
      </PreviewBadge>
    </PreviewCard>
  );
}

function StatCardEl({ m }) {
  const ref = useRef(null);
  const Icon = m.icon;

  const onMove = useCallback(e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    el.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, []);

  return (
    <StatCard
      ref={ref}
      id={`bento-${m.id}`}
      className="tall"
      style={{ '--delay': `${m.delay}ms` }}
      $glow={m.glow}
      onMouseMove={onMove}
    >
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
        <SectionLabel>Tablet previews</SectionLabel>
        <SectionTitle>See the work before you commit.</SectionTitle>
        <SectionDesc>
          Open a live preview of the tools your team and families use at the front desk - from body admission to body release.
        </SectionDesc>

        <Grid ref={gridRef}>
          {/* Preview Cards */}
          {PREVIEW_CARDS.map(m => <PreviewCardEl key={m.id} m={m} />)}

          {/* Stats */}
          {STAT_CARDS.map(m => <StatCardEl key={m.id} m={m} />)}
        </Grid>
      </Wrap>
    </Section>
  );
}