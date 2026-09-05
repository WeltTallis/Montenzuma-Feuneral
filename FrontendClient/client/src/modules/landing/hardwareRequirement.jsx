import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
`;

// ─── Styled Components ─────────────────────────────────────────────
const HardwareSection = styled.section`
  max-width: 1200px;
  margin: 60px auto;
  padding: 0 10px;
  font-family: 'Inter', sans-serif;
`;

const SectionContainer = styled.div`

  border: 1px solid ${C.line};
  border-radius: 16px;
  overflow: hidden;
 
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  position: relative;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ImageSide = styled.div`
  background: ${C.bone2};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  border-right: 1px solid ${C.line};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border: 1px solid ${C.line};
    border-radius: 50%;
    z-index: 1;
  }

  @media (max-width: 900px) {
    padding: 40px 20px;
    border-right: none;
    border-bottom: 1px solid ${C.line};
  }
`;

const ImageFrame = styled.div`
  background: ${C.ink};
  padding: 12px;
  border-radius: 16px;
  border: 1px solid ${C.brass};
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
  position: relative;
  z-index: 2;

  &:hover {
    transform: translateY(-5px);
  }
`;

const TabletImage = styled.img`
  display: block;
  max-width: 100%;
  width: 280px;
  height: auto;
  border-radius: 8px;
`;

const ContentSide = styled.div`
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;

  @media (max-width: 900px) {
    padding: 40px 24px;
  }
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${C.brass};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;

  &::before {
    content: '';
    width: 24px;
    height: 1px;
    background: ${C.brass};
  }
`;

const Heading = styled.h2`
  font-family: 'Cormorant Garamond', serif;
  font-size: 42px;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${C.ink};
  line-height: 1.1;

  em {
    color: ${C.accent};
    font-style: italic;
  }

  @media (max-width: 900px) {
    font-size: 32px;
  }
`;

const SubText = styled.p`
  color: ${C.gray};
  font-size: 15px;
  margin-bottom: 24px;
  max-width: 90%;

  @media (max-width: 900px) {
    max-width: 100%;
  }
`;

const RequirementNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${C.verdigrisTint};
  border: 1px solid ${C.verdigrisLight};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 32px;
`;

const NoticeIcon = styled.div`
  color: ${C.verdigrisDark};
  font-size: 18px;
  margin-top: 2px;
`;

const NoticeText = styled.div`
  font-size: 13px;
  color: ${C.verdigrisDark};
  font-weight: 500;
  line-height: 1.5;

  strong {
    font-weight: 700;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 40px;
  border-top: 1px solid ${C.line};
  padding-top: 32px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const FeatureIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(199, 123, 94, 0.1); /* Accent tint */
  border: 1px solid rgba(199, 123, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.accent};
  font-size: 14px;
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: ${C.ink};
  }

  p {
    font-size: 13px;
    color: ${C.gray};
    margin: 0;
    line-height: 1.4;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${C.ink};
  color: ${C.bone};
  padding: 14px 28px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  width: fit-content;
  letter-spacing: 0.5px;
  cursor: default; /* Changed to default as it's a statement, not an action */

  &:hover {
    background: ${C.verdigrisDark};
  }
`;

// ─── Main Component ────────────────────────────────────────────────
const HardwareRequirementSection = () => {
    return (
        <>
            <GlobalFonts />
            <HardwareSection>
                <SectionContainer>

                    {/* Image Display */}
                    <ImageSide>
                        <ImageFrame>
                            <TabletImage
                                src="/tab.jpg"
                                alt="Family using the tablet interface"
                            />
                        </ImageFrame>
                    </ImageSide>

                    {/* Information Content */}
                    <ContentSide>
                        <Tag>Mandatory Hardware</Tag>

                        <Heading>
                            The <em>Restpoint</em> Tablet Experience
                        </Heading>

                        <SubText>
                            We provide a dedicated touchscreen tablet FrontDesk Portal to give families a modern, respectful, and seamless digital  tech experience. From  browsing floral arrangements, the entire process is elevated through intuitive technology.
                        </SubText>

                        <RequirementNotice>
                            <NoticeIcon>
                                <i className="fas fa-exclamation-circle"></i>
                            </NoticeIcon>
                            <NoticeText>
                                Please note: To operate the Restpoint system and provide this family experience, <strong>all funeral homes are required to purchase this specific tablet.</strong> It serves as your primary digital registry.
                            </NoticeText>
                        </RequirementNotice>

                        <FeaturesGrid>
                            <FeatureItem>
                                <FeatureIcon><i className="fas fa-signature"></i></FeatureIcon>
                                <FeatureText>
                                    <h4>Touch Signatures</h4>
                                    <p>Families easily sign intake and release forms directly on screen.</p>
                                </FeatureText>
                            </FeatureItem>
                            <FeatureItem>
                                <FeatureIcon><i className="fas fa-clipboard-check"></i></FeatureIcon>
                                <FeatureText>
                                    <h4>Digital Intake</h4>
                                    <p>A guided, paperless process for completing necessary arrangements.</p>
                                </FeatureText>
                            </FeatureItem>
                            <FeatureItem>
                                <FeatureIcon><i className="fas fa-door-open"></i></FeatureIcon>
                                <FeatureText>
                                    <h4>Secure Releases</h4>
                                    <p>Simple, verified digital authorizations for final release processes.</p>
                                </FeatureText>
                            </FeatureItem>
                            <FeatureItem>
                                <FeatureIcon><i className="fas fa-spa"></i></FeatureIcon>
                                <FeatureText>
                                    <h4>Curated Florals</h4>
                                    <p>Families browse a visual catalog to select and order flower samples.</p>
                                </FeatureText>
                            </FeatureItem>
                        </FeaturesGrid>

                        <Button>
                            <i className="fas fa-check-circle"></i> Mandatory for All Facilities
                        </Button>
                    </ContentSide>

                </SectionContainer>
            </HardwareSection>
        </>
    );
};

export default HardwareRequirementSection;