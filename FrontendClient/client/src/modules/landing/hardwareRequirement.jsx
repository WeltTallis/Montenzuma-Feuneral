import React from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// ─── Color Variables (Matching your exact palette) ─────────────────
const C = {
  ink: '#000000',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  verdigrisLight: '#4D6359',
  verdigrisTint: '#EBEFEF',
  line: '#E3DDD0',
  lineDark: 'rgba(0,0,0,0.08)',
  gray: '#8A8780',
  grayLight: 'rgba(0,0,0,0.6)',
  accent: '#C77B5E',
};

// ─── Global Fonts ──────────────────────────────────────────────────
const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

// ─── Animations ────────────────────────────────────────────────────
const scrollText = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// ─── Styled Components ─────────────────────────────────────────────

const HardwareSection = styled.section`
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 35% 65%;
  overflow: hidden;
  background: ${C.ink};
  color: ${C.bone};
  font-family: 'Inter', sans-serif;

  /* Ambient glow using Accent */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(199, 123, 94, 0.15) 0%, transparent 70%);
    filter: blur(50px);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

const LeftPanel = styled.div`
  position: relative;
  z-index: 2;
  padding: 3rem clamp(2rem, 4vw, 4rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(250, 248, 244, 0.1);
  background: ${C.ink};

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid rgba(250, 248, 244, 0.1);
    padding: 2rem 1.5rem;
  }
`;

const MetaBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${C.gray};

  & > span:first-child {
    color: ${C.accent};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${C.accent};
      display: block;
    }
  }
`;

const TitleBlock = styled.div`
  margin: 4rem 0 3rem;

  @media (max-width: 900px) {
    margin: 2rem 0;
  }
`;

const Tag = styled.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${C.accent};
  margin-bottom: 1.5rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(250, 248, 244, 0.2);
  border-radius: 20px;
  background: rgba(199, 123, 94, 0.05);
`;

const Heading = styled.h1`
  font-family: 'Fraunces', serif;
  font-size: clamp(3rem, 5vw, 4.5rem);
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: ${C.bone};
  margin: 0;

  em {
    font-style: italic;
    font-weight: 300;
    color: ${C.brassLight};
    display: block;
  }
`;

const SubText = styled.p`
  font-size: 0.95rem;
  color: ${C.gray};
  line-height: 1.7;
  margin-top: 2rem;
  max-width: 90%;
`;

const FeaturesList = styled.div`
  border-top: 1px solid rgba(250, 248, 244, 0.1);
  margin-top: auto;

  @media (max-width: 500px) {
    margin-top: 2rem;
  }
`;

const FeatureRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid rgba(250, 248, 244, 0.1);
  transition: padding 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s ease;
  cursor: default;
  position: relative;

  &:hover {
    padding-left: 1rem;
    background: linear-gradient(90deg, rgba(199, 123, 94, 0.08) 0%, transparent 100%);
    
    svg {
      color: ${C.accent};
    }
  }
`;

const FeatureNum = styled.span`
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 1rem;
  color: ${C.accent};
  opacity: 0.7;
  width: 20px;
`;

const FeatureIconBox = styled.div`
  color: ${C.gray};
  width: 24px;
  display: flex;
  justify-content: center;
  transition: color 0.3s ease;
`;

const FeatureInfo = styled.div`
  h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${C.bone};
    margin-bottom: 0.15rem;
    font-family: 'Inter', sans-serif;
  }
  p {
    font-size: 0.75rem;
    color: ${C.gray};
    line-height: 1.4;
    margin: 0;
  }
`;

const RightPanel = styled.div`
  position: relative;
  background: #050505; /* Slight contrast from pure black */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  padding-left: 4rem;

  /* Grid Overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(250, 248, 244, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(250, 248, 244, 0.015) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 900px) {
    padding: 3rem 1.5rem;
    justify-content: center;
    min-height: 400px;
  }
`;

const SpecCard = styled.div`
  position: absolute;
  top: 15%;
  right: 5%;
  z-index: 3;
  background: rgba(46, 63, 55, 0.6); /* Verdigris Dark with opacity */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(250, 248, 244, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  max-width: 240px;

  h5 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${C.verdigrisTint};
    margin-bottom: 0.75rem;
  }
  p {
    font-family: 'Fraunces', serif;
    font-size: 0.95rem;
    line-height: 1.4;
    color: ${C.bone};
    font-weight: 400;
    strong {
      font-weight: 600;
      color: ${C.accent};
    }
  }

  @media (max-width: 900px) {
    top: 1rem;
    right: 1rem;
    padding: 1rem;
    max-width: 180px;
    p { font-size: 0.85rem; }
  }
`;

const ImageContainer = styled.div`
  position: relative;
  z-index: 2;
  transform: perspective(1000px) rotateY(-5deg) translateY(-20px);
  transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);

  &:hover {
    transform: perspective(1000px) rotateY(0deg) translateY(0);
  }

  @media (max-width: 900px) {
    transform: none;
  }
`;

const ImageFrame = styled.div`
  background: #000;
  padding: 8px;
  border-radius: 20px;
  border: 1px solid rgba(250, 248, 244, 0.2);
  box-shadow: 
    0 50px 100px -20px rgba(0,0,0,0.8),
    0 30px 60px -30px rgba(199, 123, 94, 0.3); /* Accent glow shadow */
`;

const TabletImage = styled.img`
  display: block;
  width: 100%;
  max-width: 550px;
  height: auto;
  border-radius: 12px;
  filter: saturate(1.1) contrast(1.1);
`;

const Banner = styled.div`
  background: ${C.accent}; /* Terracotta background */
  color: ${C.ink}; /* Black text */
  padding: 2.5rem 0;
  overflow: hidden;
  position: relative;
`;

const BannerTrack = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  animation: ${scrollText} 30s linear infinite;
`;

const BannerItem = styled.div`
  font-family: 'Fraunces', serif;
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 400;
  font-style: italic;
  padding: 0 3rem;
  display: flex;
  align-items: center;
  gap: 3rem;

  span {
    font-style: normal;
    font-weight: 300;
  }

  @media (max-width: 500px) {
    font-size: 2.5rem;
    padding: 0 1.5rem;
    gap: 1.5rem;
  }
`;

const BannerIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${C.ink};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// ─── Main Component ────────────────────────────────────────────────
const HardwareRequirementSection = () => {
  return (
    <>
      <GlobalFonts />
      <HardwareSection>

        {/* LEFT PANEL */}
        <LeftPanel>
          <MetaBar>
            <span>Restpoint Hardware</span>
            <span>Spec No. 06</span>
          </MetaBar>

          <TitleBlock>

            <Heading>
              FrontDesk
              <em>Tablet / Ipad</em>
            </Heading>
            <SubText>
              We provide a dedicated touchscreen reception portal to give families a modern, respectful, and seamless digital experience. From browsing floral arrangements to signing final documents, the entire process is elevated.
            </SubText>
          </TitleBlock>

          <FeaturesList>
            <FeatureRow>
              <FeatureNum>01</FeatureNum>
              <FeatureIconBox>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17.5C5 18.5 7.5 19 10 19C14 19 17 17.5 19 15C21 12.5 21 9 19 7C17 4.5 14 4 10 4C7.5 4 5 4.5 3 5.5" />
                  <path d="M12 19V21" /><path d="M9 21H15" />
                </svg>
              </FeatureIconBox>
              <FeatureInfo>
                <h4>Touch Signatures</h4>
                <p>Families easily sign intake and release forms directly on screen.</p>
              </FeatureInfo>
            </FeatureRow>

            <FeatureRow>
              <FeatureNum>02</FeatureNum>
              <FeatureIconBox>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </FeatureIconBox>
              <FeatureInfo>
                <h4>Digital Intake</h4>
                <p>A guided, paperless process for completing necessary arrangements.</p>
              </FeatureInfo>
            </FeatureRow>

            <FeatureRow>
              <FeatureNum>03</FeatureNum>
              <FeatureIconBox>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </FeatureIconBox>
              <FeatureInfo>
                <h4>Secure Releases</h4>
                <p>Simple, verified digital authorizations for final release processes.</p>
              </FeatureInfo>
            </FeatureRow>

            <FeatureRow>
              <FeatureNum>04</FeatureNum>
              <FeatureIconBox>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5-3 9-7 9-12V5l-9-3-9 3v5c0 5 4 9 9 12z" />
                  <path d="M8 12c1.5-1.5 3-1.5 4 0s2.5 1.5 4 0" />
                </svg>
              </FeatureIconBox>
              <FeatureInfo>
                <h4>Curated Florals</h4>
                <p>Families browse a visual catalog to select and order flower samples.</p>
              </FeatureInfo>
            </FeatureRow>
          </FeaturesList>
        </LeftPanel>

        {/* RIGHT PANEL */}
        <RightPanel>
          <SpecCard>
            <h5>System Requirement</h5>
            <p>To operate the Restpoint system, <strong>all funeral homes are required to purchase tablet/ipad.</strong>  This device serves as the funeral home’s primary digital registry, supporting the entire process from intake through release.</p>
            <br />
            <p> “Take pride in bringing high end technology to the heart of death care.”</p>
          </SpecCard>




          <ImageContainer>
            <ImageFrame>
              <TabletImage
                src="/tab.jpg"
                alt="Family using the tablet interface"
              />
            </ImageFrame>
          </ImageContainer>
        </RightPanel>

      </HardwareSection>

      {/* MASSIVE SCROLLING BANNER */}
      <Banner>
        <BannerTrack>
          <BannerItem>
            <span>Required for All Facilities ✓ FrontDesk Portal ✓ Your Facility, Digitally Elevated ✓</span>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <em>FrontDesk Portal The New Standard in Funeral Care ✓ </em>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <span>RRequired for All Facilities ✓ FrontDesk Portal ✓ Your Facility, Digitally Elevated ✓</span>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <em>FrontDesk Portal</em>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
          </BannerItem>

          {/* Duplicate for infinite loop */}
          <BannerItem aria-hidden="true">
            <span>Required for All Facilities ✓ FrontDesk Portal ✓ Your Facility, Digitally Elevated ✓</span>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <em>FrontDesk Portal</em>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <span>Required for All Facilities ✓</span>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
            <em>FrontDesk Portal</em>
            <BannerIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </BannerIcon>
          </BannerItem>
        </BannerTrack>
      </Banner>
    </>
  );
};

export default HardwareRequirementSection;