import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ExternalLink, ArrowRight } from '../../utils/icons/icons';
import C from '../../utils/colors/index';

const KRA_RED = '#C8102E';
const KRA_LOGO_URL = 'https://www.kra.go.ke/templates/kra/images/kra/logoKRA.webp';

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el);

    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

const Reveal = ({ children, delay = 0, style = {} }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, ...style }}>{children}</div>
  );
};

const RevealDir = ({ children, delay = 0, from = 'up' }) => {
  const [ref, shown] = useReveal();
  const tf = { up: 'translateY(40px)', left: 'translateX(50px)', right: 'translateX(-50px)' };
  return (
    <div ref={ref} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : tf[from] || tf.up, transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>{children}</div>
  );
};

const NS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  .newsroom-section {
    position: relative;
    padding: clamp(5rem, 9vw, 8rem) 0 4rem;
    background: ${C.bone};
    overflow: hidden;
  }
  .newsroom-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(ellipse 800px 600px at 12% 8%, rgba(139,115,85,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 700px 500px at 90% 85%, rgba(45,122,111,0.05) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }
  .newsroom-section::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    opacity: 0.035;
    pointer-events: none;
    mix-blend-mode: multiply;
    z-index: 0;
  }
  .ns-wrap {
    position: relative;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 clamp(1.5rem, 4vw, 2.5rem);
    z-index: 1;
  }
  
  /* MASTHEAD */
  .ns-masthead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1.25rem;
    border-bottom: 1.5px solid ${C.ink};
    margin-bottom: 0.5rem;
    position: relative;
  }
  .ns-masthead::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 1px;
    background: ${C.ink};
    opacity: 0.3;
  }
  .ns-mast-left {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${C.ink};
    font-weight: 500;
  }
  .ns-live-dot {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${C.verdigris};
  }
  .ns-live-dot::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: ${C.verdigris};
    opacity: 0.4;
    animation: live-pulse 2.2s ease-out infinite;
  }
  @keyframes live-pulse {
    0% { transform: scale(0.7); opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  .ns-mast-right {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${C.gray};
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .ns-mast-right span.sep { opacity: 0.4; }
  
  /* HEADLINE */
  .ns-headline {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 2rem;
    padding: clamp(2rem, 5vw, 3.5rem) 0 2.5rem;
    border-bottom: 1px solid ${C.line};
    margin-bottom: clamp(2rem, 4vw, 3rem);
  }
  .ns-title {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    font-size: clamp(2.8rem, 7vw, 5.5rem);
    line-height: 0.92;
    letter-spacing: -0.025em;
    color: ${C.ink};
  }
  .ns-title em {
    font-style: italic;
    font-weight: 300;
    color: ${C.brass};
  }
  .ns-subtitle {
    font-size: 0.92rem;
    color: ${C.gray};
    max-width: 300px;
    line-height: 1.6;
    text-align: right;
    font-weight: 400;
  }
  .ns-subtitle strong { color: ${C.ink}; font-weight: 600; }
  
  /* MAIN GRID */
  .ns-main-grid {
    display: grid;
    grid-template-columns: 1.45fr 1fr;
    gap: 1.5rem;
    align-items: stretch;
    margin-bottom: 1.5rem;
  }
  
  /* FEATURED (CINEMATIC BANNER) */
  .ns-featured {
    position: relative;
    background: ${C.ink};
    border-radius: 22px;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 540px;
    border: 1px solid ${C.lineDark};
    transition: transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s ease;
    isolation: isolate;
  }
  .ns-featured:hover {
    transform: translateY(-5px);
    box-shadow: 0 40px 80px -20px rgba(21,23,26,0.35);
  }
  .ns-featured-glow {
    position: absolute;
    top: -150px;
    right: -150px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--glow-color, rgba(139,115,85,0.3)) 0%, transparent 60%);
    opacity: 0.7;
    transition: opacity 0.8s ease, transform 1.2s ease;
    pointer-events: none;
    z-index: 0;
  }
  .ns-featured:hover .ns-featured-glow {
    opacity: 1;
    transform: scale(1.15);
  }
  .ns-chapter {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: clamp(3.5rem, 6vw, 5rem);
    font-weight: 200;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1;
    z-index: 3;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  .ns-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(250,248,244,0.04), transparent);
    animation: ns-shine 8s ease-in-out infinite 3s;
    pointer-events: none;
    z-index: 2;
  }
  @keyframes ns-shine {
    0% { left: -100%; }
    50%, 100% { left: 200%; }
  }
  .ns-featured-media {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    flex-shrink: 0;
    z-index: 1;
    overflow: hidden;
  }
  .ns-featured-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.85) contrast(1.05);
    transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .ns-featured:hover .ns-featured-media img {
    transform: scale(1.04);
  }
  .ns-featured-media::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(21,23,26,0.3) 0%, rgba(21,23,26,0) 30%, rgba(21,23,26,0) 50%, ${C.ink} 100%);
    pointer-events: none;
  }
  .ns-featured-badge {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 4;
    padding: 0.6rem 1rem;
    background: rgba(250,248,244,0.95);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .ns-featured-text {
    position: relative;
    z-index: 2;
    padding: 0 clamp(2rem, 4vw, 3.25rem) clamp(2rem, 4vw, 3.25rem);
    margin-top: -4rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .ns-cat {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }
  .ns-cat-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    animation: pulse-dot 2.4s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.65); }
  }
  .ns-featured-title {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    color: ${C.bone};
    font-size: clamp(1.85rem, 3.2vw, 2.5rem);
    line-height: 1.05;
    letter-spacing: -0.015em;
    margin-bottom: 1.1rem;
  }
  .ns-featured-title em {
    font-style: italic;
    font-weight: 300;
    color: #C9B58E;
  }
  .ns-featured-excerpt {
    color: rgba(250,248,244,0.72);
    font-size: 1rem;
    line-height: 1.75;
    flex: 1;
    margin-bottom: 1.5rem;
  }
  .ns-featured-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(250,248,244,0.18);
  }
  .ns-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .ns-date-muted { color: #9A968F; }
  .ns-date-light { color: rgba(250,248,244,0.5); }
  .ns-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: ${C.brass};
    color: ${C.bone};
    border: none;
    border-radius: 100px;
    cursor: pointer;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    font-size: 0.86rem;
    padding: 0.85rem 1.6rem;
    transition: background 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease;
    position: relative;
    overflow: hidden;
  }
  .ns-btn:hover {
    background: ${C.brassLight};
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(139,115,85,0.4);
  }
  
  /* SIDE STACK */
  .ns-side-stack {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 1.5rem;
    height: 100%;
  }
  
  /* CARDS */
  .ns-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.75rem;
    border-radius: 16px;
    background: ${C.bone};
    border: 1px solid ${C.line};
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease, border-color 0.4s ease;
    cursor: pointer;
    text-decoration: none;
    overflow: hidden;
    isolation: isolate;
    min-height: 0;
  }
  .ns-card:hover {
    border-color: var(--card-accent, ${C.brass});
    transform: translateY(-3px);
    box-shadow: 0 16px 36px -10px color-mix(in srgb, var(--card-accent, ${C.brass}) 22%, transparent);
  }
  .ns-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--card-accent, ${C.brass});
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
  }
  .ns-card:hover::after { transform: scaleX(1); }
  .ns-card.dark {
    background: #1C1F23;
    border-color: ${C.lineDark};
  }
  .ns-card.dark .ns-card-title { color: ${C.bone}; }
  .ns-card.dark .ns-card-excerpt { color: rgba(250,248,244,0.65); }
  .ns-card.dark .ns-date { color: rgba(250,248,244,0.45); }
  .ns-card.dark .ns-chapter-mini { color: rgba(250,248,244,0.12); }
  
  .ns-chapter-mini {
    position: absolute;
    top: 1rem;
    right: 1.25rem;
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 2.2rem;
    font-weight: 300;
    color: rgba(21,23,26,0.08);
    line-height: 1;
    pointer-events: none;
    z-index: 0;
  }
  .ns-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.1rem;
    gap: 1rem;
    position: relative;
    z-index: 1;
  }
  .ns-card-ext {
    color: #9A968F;
    opacity: 0;
    transform: translate(-4px, 4px) rotate(-10deg);
    transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), color 0.3s ease;
    flex-shrink: 0;
  }
  .ns-card:hover .ns-card-ext {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg);
    color: var(--card-accent, ${C.brass});
  }
  .ns-card-logo {
    height: 30px;
    width: auto;
    object-fit: contain;
    margin-bottom: 0.9rem;
    position: relative;
    z-index: 1;
  }
  .ns-card-title {
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: 1.2rem;
    color: ${C.ink};
    margin-bottom: 0.6rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
    position: relative;
    z-index: 1;
  }
  .ns-card-excerpt {
    font-size: 0.84rem;
    color: ${C.gray};
    line-height: 1.65;
    flex: 1;
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
  }
  .ns-card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    position: relative;
    z-index: 1;
  }
  .ns-author {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9A968F;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .ns-card.dark .ns-author { color: rgba(250,248,244,0.4); }
  .ns-author::before {
    content: '';
    width: 14px;
    height: 1px;
    background: currentColor;
    opacity: 0.5;
  }
  
  /* SECONDARY GRID */
  .ns-secondary-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  /* FOOTER SIGNATURE */
  .ns-foot-sig {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-top: 2rem;
    border-top: 1px solid ${C.line};
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${C.gray};
  }
  .ns-foot-sig-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, ${C.line}, transparent, ${C.line});
  }
  .ns-foot-sig-mark {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1rem;
    text-transform: none;
    letter-spacing: 0;
    color: ${C.brass};
  }
  
  /* RESPONSIVE */
  @media (max-width: 920px) {
    .ns-main-grid, .ns-secondary-grid { grid-template-columns: 1fr; }
    .ns-headline { grid-template-columns: 1fr; align-items: start; }
    .ns-subtitle { text-align: left; max-width: none; }
    .ns-side-stack { grid-template-rows: auto auto; }
  }
  @media (max-width: 560px) {
    .ns-featured-text { margin-top: -2rem; }
    .ns-featured-foot { flex-direction: column; align-items: stretch; }
    .ns-btn { justify-content: center; }
    .ns-mast-right span:not(.sep):not(:first-child) { display: none; }
  }
`;

const NewsroomSection = () => {
  const navigate = useNavigate();
  const articles = [
    { featured: true, category: 'COMING SOON', catColor: C.brass, logo: '/restpay.jpg', title: 'RestPay: Unified Payment Processing', excerpt: 'We\'re introducing RestPay, our upcoming payment module that will integrate card payments alongside M-Pesa. Accept all major payment methods through a single, seamless platform. More payment options, less friction for families.', date: 'May 2026', cta: 'Learn more', ctaTo: '/integrations' },
    { category: 'INTEGRATION', catColor: KRA_RED, logo: KRA_LOGO_URL, title: 'KRA eTIMS Integration', excerpt: 'We\'re adding eTIMS to eliminate the need for external accounting software. Generate KRA compliant electronic tax invoices and sync fiscal records with the Kenya Revenue Authority directly from Rest Point  no extra tools, no manual exports.', date: 'August 2026', author: 'Native Integration' },
    { category: 'PRODUCT', catColor: C.verdigris, dark: true, title: 'Multi Tenant Architecture Now Available', excerpt: 'Serve multiple funeral homes from a single instance with complete data isolation.', date: 'May 2026', author: 'Shipped' },
    { category: 'BLOG', catColor: C.verdigris, dark: true, title: 'The Future of Death Care: Fully Automated Funeral Homes', excerpt: 'From QR scanned intake and digital release to hearse self booking, coffin marketplaces, and 24/7 family portals  how modern funeral homes are going fully automated. Written by Peter Mumo, Developer at Restpoint.', date: 'September 2026', author: 'By Peter Mumo', link: '/blog/future-of-death-care-software-restpoint' },
    { category: 'COMING SOON', catColor: C.brass, title: 'M-Pesa Payments  Coming Soon', excerpt: 'Families will soon be able to pay directly through the portal via M-Pesa.', date: 'May 2026', author: 'In Development' },
  ];

  // Split articles into layout sections
  const featuredArticle = articles.find(a => a.featured);
  const sideArticles = articles.filter(a => !a.featured).slice(0, 2);
  const secondaryArticles = articles.filter(a => !a.featured).slice(2, 4);

  const handleNav = (to) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(to || '/');
  };

  const hideBrokenLogo = (e) => { e.currentTarget.style.display = 'none'; };

  return (
    <section className="newsroom-section">
      <style>{NS_STYLES}</style>
      <div className="ns-wrap">

        {/* MASTHEAD */}
        <Reveal style={{ marginBottom: '0' }}>
          <header className="ns-masthead">
            <div className="ns-mast-left">
              <Newspaper size={16} color={C.verdigris} />
              <span>Restpoint · Newsroom</span>
              <span className="ns-live-dot"></span>
            </div>
            <div className="ns-mast-right">
              <span>Vol. 03</span>
              <span className="sep">/</span>
              <span>Issue 09</span>
              <span className="sep">/</span>
              <span>2026</span>
            </div>
          </header>
        </Reveal>

        {/* HEADLINE */}
        <Reveal delay={100}>
          <div className="ns-headline">
            <h1 className="ns-title">Dispatches<br /><em>from the field.</em></h1>
            <p className="ns-subtitle">Product updates, integrations, and field notes from the team building <strong>modern software for death care</strong>.</p>
          </div>
        </Reveal>

        {/* MAIN GRID */}
        <div className="ns-main-grid">
          {/* FEATURED ARTICLE */}
          {featuredArticle && (
            <RevealDir key="featured" from="left" delay={0}>
              <article className="ns-featured" style={{ '--glow-color': `rgba(139,115,85,0.35)` }}>
                <div className="ns-featured-glow"></div>
                <div className="ns-shine"></div>
                <span className="ns-chapter">01</span>

                <div className="ns-featured-media">
                  <div className="ns-featured-badge">
                    <svg width="100" height="28" viewBox="0 0 220 56" xmlns="http://www.w3.org/2000/svg" aria-label="RestPay">
                      <defs>
                        <linearGradient id="rpg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#8B7355" />
                          <stop offset="100%" stop-color="#A89478" />
                        </linearGradient>
                      </defs>
                      <rect x="2" y="10" width="36" height="36" rx="9" fill="url(#rpg)" />
                      <path d="M12 22 L20 30 L32 18" stroke="#FAF8F4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                      <text x="48" y="28" font-family="Fraunces, serif" font-size="22" font-weight="500" fill="#15171A" letter-spacing="-0.5">RestPay</text>
                      <text x="48" y="44" font-family="JetBrains Mono, monospace" font-size="7" fill="#8B7355" letter-spacing="2">UNIFIED PAYMENTS</text>
                    </svg>
                  </div>

                  <img src={featuredArticle.logo} alt="RestPay Preview" onError={hideBrokenLogo} />
                </div>

                <div className="ns-featured-text">
                  <div className="ns-cat" style={{ color: '#C9B58E' }}>
                    <span className="ns-cat-dot" style={{ background: featuredArticle.catColor }}></span>
                    {featuredArticle.category} · Cover Story
                  </div>

                  <h2 className="ns-featured-title" dangerouslySetInnerHTML={{ __html: featuredArticle.title.replace('RestPay:', 'RestPay:<br/><em>').replace('Processing', 'Processing</em>') }} />

                  <p className="ns-featured-excerpt">{featuredArticle.excerpt}</p>

                  <div className="ns-featured-foot">
                    <span className="ns-date ns-date-light">{featuredArticle.date} · Featured Release</span>
                    {featuredArticle.cta && (
                      <button className="ns-btn" onClick={() => handleNav(featuredArticle.ctaTo)}>
                        {featuredArticle.cta} <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </RevealDir>
          )}

          {/* SIDE STACK */}
          <div className="ns-side-stack">
            {sideArticles.map((a, i) => (
              <RevealDir key={i} from="right" delay={(i + 1) * 150}>
                <a
                  href={a.link || '#'}
                  onClick={(e) => { if (a.link) { e.preventDefault(); handleNav(a.link); } }}
                  className={`ns-card${a.dark ? ' dark' : ''}`}
                  style={{ '--card-accent': a.catColor }}
                >
                  <span className="ns-chapter-mini">0{i + 2}</span>
                  <div className="ns-card-top">
                    <div className="ns-cat" style={{ color: a.catColor }}>
                      <span className="ns-cat-dot" style={{ background: a.catColor }}></span>
                      {a.category}
                    </div>
                    <ExternalLink size={14} className="ns-card-ext" />
                  </div>
                  {a.logo && <img src={a.logo} alt={`${a.title} logo`} className="ns-card-logo" onError={hideBrokenLogo} />}
                  <h3 className="ns-card-title">{a.title}</h3>
                  <p className="ns-card-excerpt">{a.excerpt}</p>
                  <div className="ns-card-foot">
                    <span className="ns-date ns-date-muted">{a.date}</span>
                    {a.author && <span className="ns-author">{a.author}</span>}
                  </div>
                </a>
              </RevealDir>
            ))}
          </div>
        </div>

        {/* SECONDARY GRID */}
        <div className="ns-secondary-grid">
          {secondaryArticles.map((a, i) => (
            <RevealDir key={i} from={i === 0 ? 'left' : 'right'} delay={(i + 1) * 150}>
              <a
                href={a.link || '#'}
                onClick={(e) => { if (a.link) { e.preventDefault(); handleNav(a.link); } }}
                className={`ns-card${a.dark ? ' dark' : ''}`}
                style={{ '--card-accent': a.catColor }}
              >
                <span className="ns-chapter-mini">0{i + 4}</span>
                <div className="ns-card-top">
                  <div className="ns-cat" style={{ color: a.catColor }}>
                    <span className="ns-cat-dot" style={{ background: a.catColor }}></span>
                    {a.category}
                  </div>
                  <ExternalLink size={14} className="ns-card-ext" />
                </div>
                {a.logo && <img src={a.logo} alt={`${a.title} logo`} className="ns-card-logo" onError={hideBrokenLogo} />}
                <h3 className="ns-card-title">{a.title}</h3>
                <p className="ns-card-excerpt">{a.excerpt}</p>
                <div className="ns-card-foot">
                  <span className={`ns-date ${a.dark ? '' : 'ns-date-muted'}`}>{a.date}</span>
                  {a.author && <span className="ns-author">{a.author}</span>}
                </div>
              </a>
            </RevealDir>
          ))}
        </div>

        {/* FOOTER SIGNATURE */}
        <Reveal delay={200}>
          <footer className="ns-foot-sig">
            <span>— The Restpoint Team</span>
            <span className="ns-foot-sig-line"></span>
            <span className="ns-foot-sig-mark">Est. Nairobi</span>
            <span className="ns-foot-sig-line"></span>
            <span>Kenya · East Africa</span>
          </footer>
        </Reveal>

      </div>
    </section>
  );
};

export default NewsroomSection;