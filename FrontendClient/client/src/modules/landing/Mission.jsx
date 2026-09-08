import { createGlobalStyle } from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * Our Mission section.
 * Renders the full "Restpoint · Our Mission" design exactly as specified.
 * Self-contained: ships its own :root palette + styles so it is portable
 * to any page (landing page, dedicated /our-mission route, etc.).
 * 
 * Background: White (#FFFFFF)
 */

const MissionGlobalStyle = createGlobalStyle`
:root {
  --ink: #000000;
  --ink-soft: #0A0B0D;
  --ink-mid: #14161A;
  --bone: #FAF8F4;
  --bone2: #F3EFE6;
  --brass: #8B7355;
  --brassLight: #A98F6E;
  --verdigris: #3D4F47;
  --verdigrisDark: #2E3F37;
  --line: #E3DDD0;
  --line-dark: rgba(250, 248, 244, 0.1);
  --line-dark-strong: rgba(250, 248, 244, 0.18);
  --gray: #8A8780;
  --gray-light: rgba(0,0,0,0.6);
  --accent: #C77B5E;            /* Terracotta restored */
  --accent-soft: rgba(199, 123, 94, 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

/* ============ SECTION ============ */
.mission-section {
  position: relative;
  padding: clamp(4rem, 8vw, 8rem) 0;
  background: #FFFFFF;
  overflow: hidden;
}

/* Subtle paper grain texture */
.mission-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: multiply;
  z-index: 1;
}

.mission-container {
  position: relative;
  z-index: 2;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 4vw, 3rem);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 4rem;
  align-items: center;
}

/* ============ TEXT COLUMN ============ */
.mission-text {
  position: relative;
}

.mission-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 2rem;
  font-weight: 600;
}

.mission-tag::before {
  content: '';
  width: 24px; height: 1px;
  background: var(--accent);
}

.mission-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 300;
  line-height: 0.98;
  letter-spacing: -0.035em;
  color: var(--ink);
  margin-bottom: 2.5rem;
}

.mission-title em {
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
}

.mission-desc {
  font-family: 'Inter', sans-serif;
  font-size: 1.15rem;
  line-height: 1.8;
  color: var(--gray-light);
  margin-bottom: 3rem;
  max-width: 95%;
}

.mission-highlight {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line);
}

.highlight-text {
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 400;
  color: var(--verdigrisDark);
}

.highlight-text strong {
  color: var(--ink);
  font-weight: 600;
}

/* ============ VISUAL WRAPPER (Fixes clipping) ============ */
.mission-visual-wrap {
  position: relative;
  height: 620px;
}

/* Image Container */
.mission-image-box {
  position: absolute;
  top: 0;
  right: 0;
  width: 95%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 40px 80px -20px rgba(0,0,0,0.18);
}

.mission-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(1.05) saturate(0.9);
  transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
}

.mission-visual-wrap:hover .mission-image {
  transform: scale(1.03);
}

/* Dark gradient overlay on image */
.mission-image-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}

/* Floating Pure Black Overlay Card */
.portal-card {
  position: absolute;
  bottom: 2.5rem;
  left: -2.5rem;
  width: 90%;
  max-width: 380px;
  background: #000000; /* Pure black background */
  border: 1px solid var(--line-dark-strong);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 30px 60px rgba(0,0,0,0.35);
  z-index: 5;
}

.portal-tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--bone);
  background: var(--accent); /* Terracotta tag */
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 600;
}

.portal-title {
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--bone);
  line-height: 1.2;
  margin-bottom: 1rem;
}

.portal-title em {
  font-style: italic;
  color: var(--brassLight);
}

.portal-desc {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.portal-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--bone);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 0.2rem;
  transition: gap 0.3s ease;
}

.portal-cta:hover { gap: 0.8rem; }

/* ============ RESPONSIVE ============ */
@media (max-width: 980px) {
  .mission-container {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .mission-visual-wrap {
    height: 480px;
    margin-top: 2rem;
  }

  .portal-card {
    left: 1rem;
    right: 1rem;
    max-width: none;
    width: auto;
    bottom: 1rem;
    padding: 1.5rem;
  }
}

@media (max-width: 560px) {
  .mission-title { font-size: 2.5rem; }
  .mission-desc { font-size: 1rem; }
  .highlight-text { font-size: 1.2rem; }
}
`;

export default function MissionSection() {
  return (
    <>
      <MissionGlobalStyle />
      <section className="mission-section">
        <div className="mission-container">

          {/* TEXT COLUMN */}
          <div className="mission-text">
            <div className="mission-tag">Our Mission</div>

            <h1 className="mission-title">To make it easier to care for people when it <em>matters most.</em></h1>

            <p className="mission-desc">We give funeral homes and funeral insurers the technology to simplify operations, protect every detail, and deliver a better experience for the families they serve.</p>

            <div className="mission-highlight">
              <p className="highlight-text"><strong>Less complexity.</strong> More care.</p>
            </div>
          </div>

          {/* VISUAL COLUMN */}
          <div className="mission-visual-wrap">

            {/* Image Box */}
            <div className="mission-image-box">
              <img src="/familyportal.png" alt="A person thoughtfully using a digital tablet in a warm, modern space" className="mission-image" />
            </div>

            {/* Floating Pure Black Card */}
            <div className="portal-card">
              <span className="portal-tag">Rest Point Family Portal</span>

              <h3 className="portal-title">Give Families a Digital Experience They'll <em>Remember.</em></h3>

              <p className="portal-desc">Take pride in offering an experience no one else provides. From transparent records to seamless communication, the Restpoint portal brings closure and clarity directly to the families you serve.</p>

              <Link to="preview/reception-portal" className="portal-cta">
                Explore the Portal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}