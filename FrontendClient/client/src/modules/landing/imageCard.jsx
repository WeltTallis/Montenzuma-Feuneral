import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

/* ───────────────────────────────────────────────────────────
   SECTION + WRAP (True Black Showcase)
─────────────────────────────────────────────────────────── */
const Section = styled.section`
  padding: clamp(4rem, 8vw, 7rem) 24px;
  background: #000000;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', -apple-system, sans-serif;
`;

const HeaderWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 0 3rem;
  text-align: left;

  /* Match the grid's widths so the header starts exactly above the first card */
  @media (max-width: 1024px) { max-width: 720px; }
  @media (max-width: 600px) { max-width: 360px; }
`;

const SectionLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8A8F98;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  
  &::before, &::after {
    content: '';
    width: 24px;
    height: 1px;
    background: #2A2A2A;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Fraunces', 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
`;

const SectionDesc = styled.p`
  font-size: 1.05rem;
  color: #8A8F98;
  line-height: 1.6;
  max-width: 720px;
`;

/* ───────────────────────────────────────────────────────────
   GRID - 4 columns in a straight line on large screens
─────────────────────────────────────────────────────────── */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Straight line on big screens */
  gap: 16px; /* Tighter gap for a sleeker look */
  width: 100%;
  max-width: 1200px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr); /* 2x2 on tablets */
    max-width: 720px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr; /* Stack on mobile */
    max-width: 360px;
  }
`;

/* ───────────────────────────────────────────────────────────
   SLEEK IMAGE CARD DESIGN
─────────────────────────────────────────────────────────── */
const Card = styled.div`
  height: 340px; /* Smaller, sleeker height */
  border-radius: 16px; /* Slightly smaller radius */
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background-image: url(${p => p.$img});
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255,255,255,0.05); /* Subtle edge */
  
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  transition: 
    opacity 0.6s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    transform 0.6s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  &:hover {
    transform: translateY(0) scale(1.03);
    border-color: ${p => p.$accent}55;
    box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 15px ${p => p.$accent}22;
  }
`;

const Overlay = styled.div`
  position: absolute; 
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.92) 100%);
`;

const AccentDot = styled.div`
  position: absolute; 
  top: 16px; 
  left: 16px;
  width: 6px; 
  height: 6px; 
  border-radius: 50%;
  background: ${p => p.$accent};
  box-shadow: 0 0 10px ${p => p.$accent};
  z-index: 2;
`;

const ArrowBtn = styled.div`
  position: absolute; 
  top: 14px; 
  right: 14px;
  width: 28px; 
  height: 28px; 
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: background 0.3s ease;
  z-index: 2;

  ${Card}:hover & {
    background: rgba(255,255,255,0.25);
  }
`;

const CardContent = styled.div`
  position: absolute; 
  bottom: 20px; 
  left: 20px; 
  right: 20px;
  z-index: 2;
`;

const SubLabel = styled.p`
  font-size: 10px; /* Sleeker text size */
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${p => p.$accent};
  margin-bottom: 6px;
`;

const Title = styled.h2`
  font-family: 'Fraunces', 'Playfair Display', serif;
  font-size: 22px; /* Sleeker text size */
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  margin: 0;
`;

/* ───────────────────────────────────────────────────────────
   DATA - Platform Colors & Floral Image Included
─────────────────────────────────────────────────────────── */
const CARDS = [
  {
    id: 'body-intake',
    sub: 'Admission & Registration',
    title: 'Body Intake',
    img: 'https://i.pinimg.com/736x/4d/97/3d/4d973d1e3be9a1fb3a504d0218854797.jpg', 
    accent: '#C9A227', // Gold
    preview: '/preview/body-intake',
  },
  {
    id: 'release-form',
    sub: 'Authorization & Transfer',
    title: 'Body Release',
    img: 'https://coleman-milne.co.uk/wp-content/uploads/2022/12/Etive-Video-Cover.png', 
    accent: '#7db8a0', // Soft Verdigris Green
    preview: '/preview/release-form',
  },
  {
    id: 'reception',
    sub: 'Front Desk & Walk-ins',
    title: 'Reception Portal',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=900&fit=crop&auto=format', 
    accent: '#A98F6E', // Brass Light
    preview: '/preview/reception-portal',
  },
  {
    id: 'floral',
    sub: 'Service Florals & Orders',
    title: 'Floral Arrangement',
    img: 'https://i.pinimg.com/1200x/6f/59/16/6f5916baed8c05713704a10a015ac372.jpg', // New Floral Image
    accent: '#722F37', // Wine Burgundy
    preview: '/preview/florals',
  },
];

/* ───────────────────────────────────────────────────────────
   MAIN EXPORT
─────────────────────────────────────────────────────────── */
export default function ModuleGridSection() {
  const gridRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('[id^="card-"]');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.1 }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  const handleCardClick = (card) => {
    if (card.preview) navigate(card.preview);
  };

  return (
    <Section>
      <HeaderWrap>
        <SectionLabel>Tablet previews</SectionLabel>
        <SectionTitle>See the work before you commit.</SectionTitle>
        <SectionDesc>
          Open a live preview of the tools your team and families use at the front desk — from body admission to body release.
        </SectionDesc>
      </HeaderWrap>

      <Grid ref={gridRef}>
        {CARDS.map((card, index) => (
          <Card
            key={card.id}
            id={`card-${card.id}`}
            $img={card.img}
            $accent={card.accent}
            style={{ '--delay': `${index * 100}ms` }}
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={card.preview ? 0 : -1}
            aria-label={card.preview ? `Open ${card.title} tablet preview` : undefined}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && card.preview) {
                e.preventDefault();
                handleCardClick(card);
              }
            }}
          >
            <Overlay />
            
            <AccentDot $accent={card.accent} />
            
            <ArrowBtn>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ArrowBtn>

            <CardContent>
              <SubLabel $accent={card.accent}>{card.sub}</SubLabel>
              <Title>{card.title}</Title>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

