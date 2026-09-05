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
  .newsroom-section{padding:clamp(4rem,8vw,6rem) 0;background:${C.bone};border-top:1px solid ${C.line}}
  .ns-wrap{max-width:1180px;margin:0 auto;padding:0 clamp(1.25rem,4vw,2rem)}
  .newsroom-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:1.5rem;align-items:stretch}
  .newsroom-featured{position:relative;background:${C.ink};border-radius:16px;padding:clamp(2rem,4vw,3rem);display:flex;flex-direction:column;overflow:hidden;border:1px solid ${C.lineDark};transition:all 0.4s ease;min-height:380px}
  .newsroom-featured:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(21,23,26,0.2)}
  .newsroom-featured-shine{position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(250,248,244,0.03),transparent);animation:ns-shine 6s ease-in-out infinite 2s;pointer-events:none}
  .newsroom-cat{display:flex;align-items:center;gap:0.5rem;font-family:'JetBrains Mono',monospace;font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:1rem;font-weight:500}
  .newsroom-cat-dot{width:6px;height:6px;border-radius:50%;display:inline-block;animation:pulse-dot 2s ease-in-out infinite}
  .newsroom-featured-title{color:${C.bone};font-size:clamp(1.5rem,3vw,2rem);line-height:1.25;margin-bottom:1rem}
  .newsroom-featured-excerpt{color:rgba(250,248,244,0.7);font-size:0.95rem;line-height:1.8;flex:1}
  .newsroom-date{font-size:0.75rem;color:${C.gray};font-family:'JetBrains Mono',monospace;letter-spacing:0.05em}
  .newsroom-side{display:flex;flex-direction:column;gap:1rem;height:100%}
  .newsroom-side>div{flex:1;display:flex;min-height:0}
  .newsroom-card{flex:1;width:100%;display:flex;flex-direction:column;padding:1.5rem;border:1px solid ${C.line};border-radius:12px;background:${C.bone};transition:all 0.4s cubic-bezier(0.16,1,0.3,1);cursor:pointer;text-decoration:none}
  .newsroom-card:hover{border-color:var(--card-accent);transform:translateY(-3px);box-shadow:0 8px 24px color-mix(in srgb,var(--card-accent) 10%,transparent)}
  .newsroom-card.dark{background:${C.ink};border-color:rgba(250,248,244,0.12)}
  .newsroom-card.dark:hover{box-shadow:0 8px 24px rgba(21,23,26,0.35)}
  .newsroom-card.dark .newsroom-card-title{color:${C.bone}}
  .newsroom-card.dark .newsroom-card-excerpt{color:rgba(250,248,244,0.62)}
  .newsroom-card.dark .newsroom-date{color:rgba(250,248,244,0.45)}
  .newsroom-card.dark .newsroom-card-ext{color:rgba(250,248,244,0.5)}
  .newsroom-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem}
  .newsroom-card-ext{color:${C.gray};opacity:0;transform:translate(-4px,4px);transition:all 0.3s ease}
  .newsroom-card:hover .newsroom-card-ext{opacity:1;transform:translate(0,0);color:var(--card-accent)}
  .newsroom-card-title{font-size:1rem;font-weight:600;color:${C.ink};margin-bottom:0.5rem;line-height:1.35;font-family:'Inter',sans-serif}
  .newsroom-card-excerpt{font-size:0.82rem;color:${C.gray};line-height:1.6;flex:1}
  .newsroom-card-logo{height:34px;width:auto;object-fit:contain;margin-bottom:0.75rem}
  .newsroom-featured-logo{align-self:flex-start;height:42px;width:auto;object-fit:contain;margin-bottom:1.1rem;padding:0.4rem 0.85rem;background:${C.bone};border-radius:8px}
  .ns-btn{display:inline-flex;align-items:center;gap:0.5rem;background:${C.brass};color:${C.bone};border:none;border-radius:50px;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;font-size:0.9rem;padding:0.8rem 2rem;transition:all 0.35s cubic-bezier(0.16,1,0.3,1)}
  .ns-btn:hover{background:${C.brassLight};transform:translateY(-2px);box-shadow:0 10px 24px rgba(139,115,85,0.35)}
  @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
  @keyframes ns-shine{0%{left:-100%}50%,100%{left:200%}}
  @media(max-width:768px){.newsroom-grid{grid-template-columns:1fr}.newsroom-featured{min-height:auto}}
`;

const NewsroomSection = () => {
  const navigate = useNavigate();
  const articles = [
    { featured: true, category: 'COMING SOON', catColor: C.brass, logo: '/restpay.jpg', title: 'RestPay: Unified Payment Processing', excerpt: 'We\'re introducing RestPay, our upcoming payment module that will integrate card payments alongside M-Pesa. Accept all major payment methods through a single, seamless platform. More payment options, less friction for families.', date: 'May 2026', cta: 'Learn more', ctaTo: '/integrations' },
    { category: 'INTEGRATION', catColor: KRA_RED, logo: KRA_LOGO_URL, title: 'KRA eTIMS Integration', excerpt: 'We\'re adding eTIMS to eliminate the need for external accounting software. Generate KRA-compliant electronic tax invoices and sync fiscal records with the Kenya Revenue Authority directly from Rest Point — no extra tools, no manual exports.', date: 'August 2026' },
    { category: 'PRODUCT', catColor: C.verdigris, dark: true, title: 'Multi-Tenant Architecture Now Available', excerpt: 'Serve multiple funeral homes from a single instance with complete data isolation.', date: 'May 2026' },
    { category: 'BLOG', catColor: C.verdigris, dark: true, title: 'The Future of Death Care: Fully Automated Funeral Homes', excerpt: 'From QR-scanned intake and digital release to hearse self-booking, coffin marketplaces, and 24/7 family portals — how modern funeral homes are going fully automated. Written by Peter Mumo, Developer at Restpoint.', date: 'September 2026', link: '/blog/future-of-death-care-software-restpoint' },
    { category: 'COMING SOON', catColor: C.brass, title: 'M-Pesa Payments - Coming Soon', excerpt: 'Families will soon be able to pay directly through the portal via M-Pesa.', date: 'May 2026' },
  ];
  const hideBrokenLogo = (e) => { e.currentTarget.style.display = 'none'; };
  return (
    <section className="newsroom-section">
      <style>{NS_STYLES}</style>
      <div className="ns-wrap">
        <Reveal style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '3rem' }}>
          <Newspaper size={20} color={C.verdigris} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', margin: 0 }}>Newsroom</h2>
        </Reveal>
        <div className="newsroom-grid">
          {articles.filter(a => a.featured).map((a, i) => (
            <RevealDir key={i} from="left" delay={0}>
              <div className="newsroom-featured" style={{ '--glow-color': a.catColor }}>
                <div className="newsroom-featured-shine" />
                {a.logo && <img src={a.logo} alt={`${a.title} logo`} className="newsroom-featured-logo" onError={hideBrokenLogo} />}
                <div className="newsroom-cat" style={{ color: a.catColor }}><span className="newsroom-cat-dot" style={{ background: a.catColor }} />{a.category}</div>
                <h3 className="newsroom-featured-title">{a.title}</h3>
                <p className="newsroom-featured-excerpt">{a.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
                  <span className="newsroom-date">{a.date}</span>
                  {a.cta && (
                    <button className="ns-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(a.ctaTo || '/'); }}>{a.cta} <ArrowRight size={16} /></button>
                  )}
                </div>
              </div>
            </RevealDir>
          ))}
          <div className="newsroom-side">
            {articles.filter(a => !a.featured).map((a, i) => (
              <RevealDir key={i} from="right" delay={(i + 1) * 150}>
                <a href={a.link || '#'} onClick={a.link ? () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(a.link); } : undefined} className={`newsroom-card${a.dark ? ' dark' : ''}`} style={{ '--card-accent': a.catColor }}>
                  <div className="newsroom-card-top">
                    <div className="newsroom-cat" style={{ color: a.catColor }}><span className="newsroom-cat-dot" style={{ background: a.catColor }} />{a.category}</div>
                    <ExternalLink size={14} className="newsroom-card-ext" />
                  </div>
                  {a.logo && <img src={a.logo} alt={`${a.title} logo`} className="newsroom-card-logo" onError={hideBrokenLogo} />}
                  <h4 className="newsroom-card-title">{a.title}</h4>
                  <p className="newsroom-card-excerpt">{a.excerpt}</p>
                  <span className="newsroom-date">{a.date}</span>
                </a>
              </RevealDir>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsroomSection;