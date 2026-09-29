import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ExternalLink, ArrowRight, Check } from '../../utils/icons/icons';
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

// Updated RevealDir to enforce flex stretch so grid items match heights perfectly
const RevealDir = ({ children, delay = 0, from = 'up', style = {}, className = '' }) => {
  const [ref, shown] = useReveal();
  const tf = { up: 'translateY(40px)', left: 'translateX(50px)', right: 'translateX(-50px)' };
  return (
    <div ref={ref} className={className} style={{ height: '100%', display: 'flex', opacity: shown ? 1 : 0, transform: shown ? 'none' : tf[from] || tf.up, transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, ...style }}>{children}</div>
  );
};

const NS_STYLES = `
  
  .newsroom-section {
    position: relative;
    padding: clamp(5rem, 9vw, 8rem) 0 4rem;
    background: #FFFFFF;
    overflow: hidden;
  }
  
  .ns-wrap {
    position: relative;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 clamp(1.5rem, 4vw, 2.5rem);
    z-index: 1;
  }
  
  /* HEADER */
  .ns-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid ${C.line};
    margin-bottom: 3rem;
  }
  .ns-arch-label {
    font-family: 'Fraunces', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 500;
    color: ${C.ink};
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .ns-arch-label em { font-style: italic; font-weight: 300; color: ${C.brass}; }
  .ns-arch-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${C.gray};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .ns-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4D9B7F; box-shadow: 0 0 8px #4D9B7F;
    animation: ns-pulse 2s infinite;
  }
  @keyframes ns-pulse { 0% { box-shadow: 0 0 0 0 rgba(77,155,127, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(77,155,127, 0); } 100% { box-shadow: 0 0 0 0 rgba(77,155,127, 0); } }
  
  /* MAIN GRID LAYOUT */
  .ns-main-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    align-items: stretch;
  }
  .ns-side-stack {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 1.5rem;
  }
  .ns-secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
    align-items: stretch;
  }
  
  /* SHARED CARD STYLES */
  .ns-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid ${C.line};
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease, border-color 0.4s ease;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #FFFFFF;
  }
  .ns-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -15px rgba(21,23,26,0.1);
    border-color: ${C.brass};
  }

  /* FEATURED (Dark Cinematic) */
  .ns-featured {
    background: #0a0b0c;
    border-color: rgba(255,255,255,0.05);
    color: ${C.bone};
    padding: 0;
  }
  .ns-featured:hover { border-color: ${C.brass}; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.4); }
  .ns-featured-media {
    position: relative;
    width: 100%;
    height: 55%;
    overflow: hidden;
  }
  .ns-featured-media img {
    width: 100%; height: 100%; object-fit: cover;
    filter: saturate(0.8) contrast(1.1);
    transition: transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .ns-featured:hover .ns-featured-media img { transform: scale(1.05); }
  .ns-featured-media::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(10,11,12,0.2) 0%, rgba(10,11,12,0) 40%, #0a0b0c 100%);
  }
  .ns-featured-badge {
    position: absolute; top: 1.5rem; left: 1.5rem;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem;
    border-radius: 8px; z-index: 2;
  }
  .ns-featured-content {
    padding: 0 2.5rem 2.5rem;
    margin-top: -3rem;
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .ns-cat {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500;
    margin-bottom: 1.2rem;
  }
  .ns-cat-dot { width: 6px; height: 6px; border-radius: 50%; }
  .ns-featured-title {
    font-family: 'Fraunces', serif; font-weight: 500;
    font-size: clamp(1.8rem, 3vw, 2.4rem); line-height: 1.1;
    color: ${C.bone}; margin-bottom: 1rem;
  }
  .ns-featured-title em { font-style: italic; font-weight: 300; color: #C9B58E; }
  .ns-featured-excerpt {
    font-size: 0.95rem; color: rgba(250,248,244,0.7);
    line-height: 1.6; margin-bottom: 1.5rem; flex: 1;
  }
  .ns-featured-foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
  }
  .ns-date {
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ns-date-light { color: rgba(250,248,244,0.5); }
  .ns-date-muted { color: ${C.gray}; }
  .ns-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: ${C.brass}; color: ${C.bone}; border: none;
    padding: 0.7rem 1.4rem; border-radius: 4px;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.8rem;
    font-weight: 600; text-transform: uppercase; cursor: pointer;
    transition: all 0.3s ease;
  }
  .ns-btn:hover { background: ${C.accent}; transform: translateX(4px); }

  /* LIST CARD (Light Architectural) */
  .ns-card-list {
    background: #F3EFE6;
    border-color: #E3DDD0;
    padding: 2rem;
  }
  .ns-card-list:hover { background: #EFEAE0; }
  .ns-list-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
  .ns-card-title {
    font-family: 'Fraunces', serif; font-weight: 600;
    font-size: 1.4rem; color: ${C.ink}; line-height: 1.2;
    margin: 1rem 0 0.8rem; letter-spacing: -0.01em;
  }
  .ns-card-excerpt {
    font-size: 0.85rem; color: ${C.gray};
    line-height: 1.6; margin-bottom: 1.5rem;
  }
  .ns-checklist { display: flex; flex-direction: column; gap: 0.8rem; margin-top: auto; }
  .ns-check-item {
    display: flex; align-items: center; gap: 0.7rem;
    font-size: 0.85rem; color: ${C.ink}; font-weight: 500;
  }
  .ns-check-icon {
    width: 20px; height: 20px; border-radius: 4px;
    background: ${C.ink}; color: ${C.bone};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* MINIMAL DARK CARD */
  .ns-card-dark {
    background: #15171A;
    border-color: rgba(255,255,255,0.05);
    padding: 2rem;
    color: ${C.bone};
    justify-content: space-between;
  }
  .ns-card-dark:hover { background: #1C1F23; border-color: ${C.brass}; }
  .ns-card-dark .ns-card-title { color: ${C.bone}; }
  .ns-card-dark .ns-card-excerpt { color: rgba(250,248,244,0.6); }
  .ns-ext-icon {
    width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.3s ease;
  }
  .ns-card-dark:hover .ns-ext-icon { background: ${C.brass}; border-color: ${C.brass}; transform: rotate(45deg); }

  /* EDITORIAL CARD (Light) */
  .ns-card-edit {
    background: #FFFFFF;
    padding: 2rem;
    justify-content: space-between;
  }
  .ns-card-edit:hover { border-color: ${C.accent}; }
  .ns-author-block {
    display: flex; align-items: center; gap: 0.8rem;
    margin-top: 1.5rem; padding-top: 1.5rem;
    border-top: 1px solid ${C.line};
  }
  .ns-author-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: ${C.bone2}; color: ${C.ink};
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 0.9rem;
  }
  .ns-author-info { display: flex; flex-direction: column; }
  .ns-author-name { font-size: 0.85rem; font-weight: 600; color: ${C.ink}; }
  .ns-author-role { font-size: 0.75rem; color: ${C.gray}; }

  /* COMING SOON BADGE */
  .ns-badge-soon {
    display: inline-block; padding: 0.3rem 0.7rem;
    background: rgba(199,123,94,0.1); color: ${C.accent};
    border-radius: 4px; font-size: 0.65rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: 'JetBrains Mono', monospace;
  }

  /* FOOTER */
  .ns-foot-sig {
    display: flex; align-items: center; gap: 1.5rem;
    margin-top: 4rem; padding-top: 2rem;
    border-top: 1px solid ${C.line};
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${C.gray};
  }
  .ns-foot-sig-line { flex: 1; height: 1px; background: ${C.line}; }
  .ns-foot-sig-mark { font-family: 'Fraunces', serif; font-style: italic; font-size: 1rem; color: ${C.brass}; text-transform: none; letter-spacing: 0; }

  /* RESPONSIVE */
  @media (max-width: 920px) {
    .ns-main-grid, .ns-secondary-grid { grid-template-columns: 1fr; }
    .ns-side-stack { grid-template-rows: auto auto; }
    .ns-featured-media { height: 300px; }
  }
`;

const NewsroomSection = () => {
  const navigate = useNavigate();
  const articles = [
    { 
      featured: true, 
      category: 'COMING SOON', 
      catColor: C.brass, 
      logo: '/restpay.jpg', 
      title: 'RestPay: <em>Unified</em> Payment Processing', 
      excerpt: 'We\'re introducing RestPay, our upcoming payment module that will integrate card payments alongside M-Pesa. Accept all major payment methods through a single, seamless platform.', 
      date: 'May 2026', 
      cta: 'Learn more', 
      ctaTo: '/integrations' 
    },
    { 
      layout: 'list',
      category: 'INTEGRATION', 
      catColor: KRA_RED, 
      logo: KRA_LOGO_URL, 
      title: 'KRA eTIMS Integration', 
      excerpt: 'Native integration to eliminate external accounting software.',
      list: ['KRA Compliant Invoices', 'Direct Sync to eTIMS', 'No Manual Exports', 'Automated Tax Reporting'],
      date: 'August 2026'
    },
    { 
      layout: 'dark',
      category: 'PRODUCT', 
      catColor: C.verdigris, 
      title: 'Multi Tenant Architecture Now Available', 
      excerpt: 'Serve multiple funeral homes from a single instance with complete data isolation.', 
      date: 'May 2026', 
      author: 'Shipped' 
    },
    { 
      layout: 'edit',
      category: 'BLOG', 
      catColor: C.verdigris, 
      title: 'The Future of Death Care: Fully Automated Funeral Homes', 
      excerpt: 'From QR scanned intake and digital release to hearse self booking, coffin marketplaces, and 24/7 family portals — how modern funeral homes are going fully automated.', 
      date: 'September 2026', 
      link: '/blog/future-of-death-care-software-restpoint',
      authorName: 'Peter Mumo',
      authorRole: 'Developer at Restpoint'
    },
    { 
      layout: 'soon',
      category: 'COMING SOON', 
      catColor: C.brass, 
      title: 'M-Pesa Payments — Coming Soon', 
      excerpt: 'Families will soon be able to pay directly through the portal via M-Pesa.', 
      date: 'May 2026'
    },
  ];

  const handleNav = (to) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(to || '/');
  };

  const hideBrokenLogo = (e) => { e.currentTarget.style.display = 'none'; };

  return (
    <section className="newsroom-section">
      <style>{NS_STYLES}</style>
      <div className="ns-wrap">

        {/* HEADER */}
        <Reveal style={{ marginBottom: '0' }}>
          <header className="ns-header">
            <h1 className="ns-arch-label">Dispatches<br /><em>from the field.</em></h1>
            <div className="ns-arch-meta">
              <span className="ns-live-dot"></span> Vol. 03 / Issue 09 / 2026
            </div>
          </header>
        </Reveal>

        {/* MAIN GRID */}
        <div className="ns-main-grid">
          
          {/* 1. FEATURED (RestPay) */}
          {articles[0] && (
            <RevealDir key="featured" from="left" delay={0}>
              <article className="ns-card ns-featured">
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
                  <img src={articles[0].logo} alt="RestPay Preview" onError={hideBrokenLogo} />
                </div>
                <div className="ns-featured-content">
                  <div className="ns-cat" style={{ color: '#C9B58E' }}>
                    <span className="ns-cat-dot" style={{ background: articles[0].catColor }}></span>
                    {articles[0].category} · Cover Story
                  </div>
                  <h2 className="ns-featured-title" dangerouslySetInnerHTML={{ __html: articles[0].title }} />
                  <p className="ns-featured-excerpt">{articles[0].excerpt}</p>
                  <div className="ns-featured-foot">
                    <span className="ns-date ns-date-light">{articles[0].date} · Featured Release</span>
                    {articles[0].cta && (
                      <button className="ns-btn" onClick={() => handleNav(articles[0].ctaTo)}>
                        {articles[0].cta} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </RevealDir>
          )}

          {/* SIDE STACK (KRA & Multi-Tenant) */}
          <div className="ns-side-stack">
            
            {/* 2. LIST (KRA) */}
            {articles[1] && (
              <RevealDir key="list" from="right" delay={150}>
                <article className="ns-card ns-card-list">
                  <div className="ns-list-header">
                    <div className="ns-cat" style={{ color: articles[1].catColor }}>
                      <span className="ns-cat-dot" style={{ background: articles[1].catColor }}></span>
                      {articles[1].category}
                    </div>
                    {articles[1].logo && <img src={articles[1].logo} alt="KRA Logo" style={{ height: '30px' }} onError={hideBrokenLogo} />}
                  </div>
                  <h3 className="ns-card-title">{articles[1].title}</h3>
                  <p className="ns-card-excerpt">{articles[1].excerpt}</p>
                  <div className="ns-checklist">
                    {articles[1].list?.map((item, i) => (
                      <div key={i} className="ns-check-item">
                        <span className="ns-check-icon"><Check size={12} /></span>
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              </RevealDir>
            )}

            {/* 3. DARK MINIMAL (Multi Tenant) */}
            {articles[2] && (
              <RevealDir key="dark" from="right" delay={250}>
                <article className="ns-card ns-card-dark">
                  <div className="ns-list-header">
                    <div className="ns-cat" style={{ color: articles[2].catColor }}>
                      <span className="ns-cat-dot" style={{ background: articles[2].catColor }}></span>
                      {articles[2].category}
                    </div>
                    <div className="ns-ext-icon">
                      <ExternalLink size={14} color={C.bone} />
                    </div>
                  </div>
                  <div>
                    <h3 className="ns-card-title">{articles[2].title}</h3>
                    <p className="ns-card-excerpt">{articles[2].excerpt}</p>
                  </div>
                  <span className="ns-date ns-date-light">{articles[2].date}</span>
                </article>
              </RevealDir>
            )}
          </div>
        </div>

        {/* SECONDARY GRID (Blog & M-Pesa) */}
        <div className="ns-secondary-grid">
          
          {/* 4. EDITORIAL (Blog) */}
          {articles[3] && (
            <RevealDir key="edit" from="left" delay={300}>
              <article className="ns-card ns-card-edit" onClick={() => articles[3].link && handleNav(articles[3].link)}>
                <div>
                  <div className="ns-cat" style={{ color: articles[3].catColor }}>
                    <span className="ns-cat-dot" style={{ background: articles[3].catColor }}></span>
                    {articles[3].category}
                  </div>
                  <h3 className="ns-card-title">{articles[3].title}</h3>
                  <p className="ns-card-excerpt">{articles[3].excerpt}</p>
                </div>
                <div className="ns-author-block">
                  <div className="ns-author-avatar">PM</div>
                  <div className="ns-author-info">
                    <span className="ns-author-name">{articles[3].authorName}</span>
                    <span className="ns-author-role">{articles[3].authorRole}</span>
                  </div>
                </div>
              </article>
            </RevealDir>
          )}

          {/* 5. COMING SOON (M-Pesa) */}
          {articles[4] && (
            <RevealDir key="soon" from="right" delay={350}>
              <article className="ns-card ns-card-edit">
                <div className="ns-list-header">
                  <div className="ns-cat" style={{ color: articles[4].catColor }}>
                    <span className="ns-cat-dot" style={{ background: articles[4].catColor }}></span>
                    {articles[4].category}
                  </div>
                  <span className="ns-badge-soon">In Development</span>
                </div>
                <h3 className="ns-card-title">{articles[4].title}</h3>
                <p className="ns-card-excerpt">{articles[4].excerpt}</p>
                <span className="ns-date ns-date-muted" style={{ marginTop: 'auto' }}>{articles[4].date}</span>
              </article>
            </RevealDir>
          )}
        </div>

      

      </div>
    </section>
  );
};

export default NewsroomSection;