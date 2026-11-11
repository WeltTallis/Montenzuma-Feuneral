import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsroomSection from '../newsroom/NewsroomSection';
import HardwareRequirementSection from './hardwareRequirement';
import LandingPageSEO from '../seo/LandingPageSEO';
import Footer from '../../components/layout/Footer';
import C from '../../utils/colors/index'
import FloatingCTA from './FloatingCTA';
import MissionSection from './Mission';
import SiteNav from './nav';
import Hero from './hero';
import { ChevronDown, Menu, Check, ShieldCheck, Server, Zap, ArrowRight, X, Activity, Users, Newspaper, ExternalLink, LayoutDashboard, Lock, Globe, Layers, LifeBuoy, MessageCircle } from '../../utils/icons/icons';
import PremiumReporting from './PremiumReporting';

/* 
   HOOKS
 */
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

const useOutsideClick = (ref, callback) => {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cbRef.current();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref]);
};

/* 
   ANIMATION COMPONENTS
 */
const Reveal = ({ children, delay = 0, style = {}, className = '' }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
};

const StaggerReveal = ({ children, stagger = 80, className = '', style = {} }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} className={className} style={style}>
      {(Array.isArray(children) ? children : [children]).map((child, i) => (
        <div key={i} style={{
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(25px)',
          transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms`,
        }}>{child}</div>
      ))}
    </div>
  );
};

const AnimatedNumber = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [ref, shown] = useReveal();
  useEffect(() => {
    if (!shown) return;
    let v = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [shown, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ---------------------------------------
   SHARED COMPONENTS
   --------------------------------------- */

const Marquee = ({ items, speed = 35 }) => (
  <div className="marquee-strip">
    <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
      {[...items, ...items, ...items, ...items].map((item, i) => (
        <span key={i} className="marquee-item">
          <span className="marquee-dot" />{item}
        </span>
      ))}
    </div>
  </div>
);

/* ---------------------------------------
   MOCK COMPONENTS
   --------------------------------------- */
/* -- Floral Preview -- */
const FLP_FLOWERS = [
  {
    img: 'https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240',
    label: 'Heart', alt: 'Mixed Rose and Baby Breath Heart',
    title: (<>Mixed Rose &amp;<br /><em>Baby Breath Heart</em></>),
  },
  {
    img: 'https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000',
    label: 'Cross', alt: 'Wreaths and Cross on Stand',
    title: (<>Wreaths &amp; Cross<br /><em>on Stand</em></>),
  },
  {
    img: 'https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw',
    label: 'Spray', alt: 'Elegant Floral Spray',
    title: (<>Elegant<br /><em>Floral Spray</em></>),
  },
  {
    img: 'https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240',
    label: 'Embrace', alt: 'The Eternal Embrace',
    title: (<>The Eternal<br /><em>Embrace</em></>),
  },
];

const FloralPreview = () => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Cormorant Garamond is loaded app-wide from src/index.css.
    FLP_FLOWERS.forEach((f) => { const im = document.createElement('img'); im.src = f.img; });
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); };
  }, []);

  const setFlower = (next) => {
    let i = next;
    if (i < 0) i = FLP_FLOWERS.length - 1;
    if (i >= FLP_FLOWERS.length) i = 0;
    if (i === indexRef.current) return;
    indexRef.current = i;
    setFading(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setIndex(i);
      setFading(false);
    }, 400);
  };

  /* Auto-rotate the tribute every 4 seconds */
  useEffect(() => {
    const t = setInterval(() => setFlower(indexRef.current + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const current = FLP_FLOWERS[index];

  return (
    <div className="flp-tablet-wrapper">
      <div className="flp-tablet-scale">
        <div className="flp-tablet-scale-inner">
          <div className="flp-tablet-frame">
            <div className="flp-tablet-screen">
              <img className="flp-hero" src={current.img} alt={current.alt} loading="lazy" decoding="async" style={{ opacity: fading ? 0 : 1 }} />
              <div className="flp-overlay" />
              <div className="flp-strip">
                {FLP_FLOWERS.map((f, i) => (
                  <button key={f.label} className="flp-story" onClick={() => setFlower(i)}>
                    <div className={`flp-ring ${i === index ? 'flp-unseen' : 'flp-seen'}`}>
                      <div className="flp-ring-inner">
                        <img src={f.img} alt={f.alt} loading="lazy" decoding="async" />
                      </div>
                    </div>
                    <span className="flp-story-label">{f.label}</span>
                  </button>
                ))}
              </div>
              <div className="flp-title-block">
                <div className="flp-name-tag">Premium Funeral Flowers</div>
                <h2 className="flp-headline" style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(15px)' : 'translateY(0)' }}>{current.title}</h2>
              </div>
              <div className="flp-wordmark">
                <div className="flp-wordmark-name">RestPoint Floral Concierge</div>
                <div className="flp-wordmark-sub">Curated for funeral homes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Showcase = ({ no, title, desc, reverse, points, cta, floral, children }) => {
  const navigate = useNavigate();
  const goExplore = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/register');
  };
  return (
    <Reveal className={`showcase-mobile${floral ? ' floral-showcase' : ''}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center', marginBottom: '7rem' }}>
      <div className="showcase-text" style={{ order: reverse ? 2 : 1, paddingRight: reverse ? '0' : '2rem', paddingLeft: reverse ? '2rem' : '0' }}>
        <div className="showcase-module">
          <span className="showcase-no">Module {no}</span>
          <span className="showcase-rule" />
        </div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1.2rem', lineHeight: 1.25 }}>{title}</h2>
        <p style={{ fontSize: '1.05rem', maxWidth: '480px', color: C.gray, lineHeight: 1.8 }}>{desc}</p>
        {points && points.length > 0 && (
          <ul className="showcase-points">
            {points.map((p, i) => (
              <li key={i}><span className="showcase-check"><Check size={12} /></span>{p}</li>
            ))}
          </ul>
        )}
        {cta && (
          <button className="showcase-cta" onClick={goExplore}>
            {cta}<ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="showcase-visual" style={{ order: reverse ? 1 : 2, display: 'flex', justifyContent: 'center', width: '100%' }}>{children}</div>
    </Reveal>
  );
};

/* ---------------------------------------
   MAIN APP
   --------------------------------------- */
export default function App() {
  const navigate = useNavigate();

  const goStart = () => {
    window.scrollTo({
      top: 0, behavior:
        'smooth'
    }); navigate(
      '/register'
    );
  };

  const landingModules = [

    {
      dark: true, to: true, category: 'NEW  INTEGRATED', accent: C.brass, title: 'Leave Management', excerpt: 'Staff leave is now fully handled inside Rest Point. Request, approve, and track time off in real time no spreadsheets or external HR tools.', status: 'NOW LIVE'
    },

    {
      static: true, category: 'PREMIUM FLORAL BOOKING', accent: C.verdigris, title: 'High-End Funeral Flowers', excerpt: 'We built a premium floral booking flow for funeral homes: families browse refined tribute arrangements, the system recommends elegant options based on the service style and season, and each order is sent directly to the florist with no confusion. This is crafted for funeral homes that take pride in dignified, high-end floral presentation.', status: 'RECEPTIONIST PORTAL'
    },

    {
      dark: true, to: true, category: 'NEW  SUPPORT CENTER', accent: C.brass, title: 'Real-time Customer Support', excerpt: 'Submit issues directly through the platform and our support agents receive, respond to, and resolve them in real time with full status tracking and communication history.', status: 'NOW LIVE'
    },

  ];

  const marqueeItems = ['Case Management', 'Family Portal', 'Smart Dispatch', 'Fleet Tracking', 'Funeral Insurance', 'Real-time Support', 'Billing & Invoicing', 'Analytics & Reports', 'Welfare Schemes'];

  return (
    <>
      <LandingPageSEO />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { font-family: 'Fraunces', serif; color: ${C.gray}; background: ${C.bone}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        .landing-page, .landing-page * { font-family: 'Fraunces', serif !important; letter-spacing: 0 !important; }
        .landing-page p, .landing-page p * { font-family: 'Saira', sans-serif !important; }
        .landing-page header, .landing-page header *,
        .landing-page .footer-container, .landing-page .footer-container * { font-family: 'Saira', sans-serif !important; }
        .landing-page h1, .landing-page h2, .landing-page h3, .landing-page h4, .landing-page h5, .landing-page h6 { font-family: 'Cormorant Garamond', serif !important; font-weight: 600; color: ${C.ink}; }
        .landing-page .lockin-title,
        .landing-page .portal-title,
        .landing-page .hardware-requirement h1,
        .landing-page .hardware-requirement h2 { color: #FFFFFF !important; }
        h1 { font-size: clamp(2rem, 6.5vw, 4.6rem); line-height: 1.05; margin-bottom: 1.4rem; }
        h2 { font-size: clamp(1.9rem, 4vw, 2.5rem); line-height: 1.2; }
        p { line-height: 1.7; font-size: 1rem; }
        a { color: inherit; text-decoration: none; }
        .mono-label { font-family: 'Fraunces', serif; font-size: 0.85rem; text-transform: uppercase; color: ${C.brass}; font-weight: 600; }
        .label { font-family: 'Fraunces', serif; font-size: 0.9rem; text-transform: uppercase; color: ${C.brass}; font-weight: 600; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.95rem 1.9rem; font-size: 1rem; font-weight: 600; font-family: 'Fraunces', serif; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; }
        .btn-dark { background: ${C.ink}; color: ${C.bone}; }
        .btn-dark:hover { background: ${C.verdigris}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(21,23,26,0.15); }
        .btn-line { background: transparent; color: ${C.ink}; border-color: ${C.line}; }
        .btn-line:hover { background: ${C.ink}; color: ${C.bone}; border-color: ${C.ink}; }
        .btn-brass { background: ${C.brass}; color: ${C.bone}; border: none; }
        .btn-brass:hover { background: ${C.brassLight}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139,115,85,0.25); }
        
        /* FIX: Massively increased outer padding for balance */
        .wrap { max-width: 1200px; margin: 0 auto; width: 100%; padding-left: clamp(2rem, 7vw, 5rem) !important; padding-right: clamp(2rem, 7vw, 5rem) !important; }

        .marquee-strip { overflow: hidden; border-top: 1px solid ${C.line}; border-bottom: 1px solid ${C.line}; padding: 0.9rem 0; background: #000000; }
        .marquee-track { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .marquee-item { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0 1.8rem; font-size: 0.9rem; color: #FFFFFF; font-family: 'Fraunces', serif; white-space: nowrap; text-transform: uppercase; }
        .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: #FFFFFF; display: inline-block; flex-shrink: 0; }

        .quickfind-section { padding: clamp(4rem,8vw,6rem) 0; background: ${C.bone}; }
        .search-bar { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.4rem; border: 1.5px solid ${C.line}; border-radius: 12px; background: ${C.bone}; transition: all 0.35s ease; box-shadow: 0 2px 8px rgba(21,23,26,0.03); }
        .search-bar.focused { border-color: ${C.verdigris}; box-shadow: 0 4px 20px rgba(61,79,71,0.1),0 0 0 3px rgba(61,79,71,0.06); }
        .search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 1rem; color: ${C.ink}; font-family: 'Fraunces', serif; }
        .search-input::placeholder { color: ${C.gray}; }
        .quickfind-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 0.75rem; }
        .quickfind-card { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 1.4rem; border: 1px solid ${C.line}; border-radius: 12px; background: ${C.bone}; cursor: pointer; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); text-decoration: none; }
        .quickfind-card:hover { border-color: var(--card-color); background: color-mix(in srgb,var(--card-color) 4%,${C.bone}); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--card-color) 12%,transparent); }
        .quickfind-icon-wrap { width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb,var(--card-color) 10%,${C.bone}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.4s ease; }
        .quickfind-card:hover .quickfind-icon-wrap { background: var(--card-color); }
        .quickfind-card:hover .quickfind-icon-wrap svg { color: ${C.bone} !important; }
        .quickfind-label { font-size: 0.92rem; font-weight: 600; color: ${C.ink}; margin-bottom: 0.15rem; }
        .quickfind-desc { font-size: 0.78rem; color: ${C.gray}; line-height: 1.4; }
        .quickfind-arrow { margin-left: auto; flex-shrink: 0; color: ${C.gray}; opacity: 0; transform: translateX(-6px); transition: all 0.3s ease; }
        .quickfind-card:hover .quickfind-arrow { opacity: 1; transform: translateX(0); color: var(--card-color); }

        .unified-section { padding: clamp(5rem,10vw,8rem) 0; background: #0C0C0C; position: relative; overflow: hidden; }
        .unified-bg-grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(250,248,244,0.06) 1px,transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .unified-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-family: 'Cormorant Garamond',serif; font-size: clamp(6rem,18vw,16rem); font-weight: 700; color: rgba(250,248,244,0.02); pointer-events: none; white-space: nowrap; user-select: none; }
        .unified-glow-1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle,rgba(61,79,71,0.12) 0%,transparent 70%); top: -150px; right: -100px; pointer-events: none; animation: float-orb 15s ease-in-out infinite; }
        .unified-glow-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle,rgba(139,115,85,0.08) 0%,transparent 70%); bottom: -100px; left: -80px; pointer-events: none; animation: float-orb 15s ease-in-out infinite -5s; }
        .unified-heading { color: ${C.bone}; font-size: clamp(2.4rem,6vw,4.2rem); line-height: 1.05; max-width: 800px; margin: 0 auto; font-weight: 600; }
        .unified-highlight { background: linear-gradient(135deg,#FAF8F4 0%,#A98F6E 40%,#4D9B7F 70%,#FAF8F4 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-text 5s ease infinite; }
        .unified-desc { color: rgba(250,248,244,0.5); font-size: 1.1rem; max-width: 520px; margin: 1.5rem auto 0; line-height: 1.8; }

        .unified-bento-card { position: relative; background: rgba(250,248,244,0.03); border: 1px solid rgba(250,248,244,0.07); border-radius: 16px; padding: clamp(1.5rem,2.5vw,2.2rem); overflow: hidden; cursor: default; transition: all 0.5s cubic-bezier(0.16,1,0.3,1); }
        .unified-bento-card:hover { border-color: var(--card-glow); transform: translateY(-6px); box-shadow: 0 16px 40px -8px var(--card-glow),0 0 0 1px var(--card-glow); background: rgba(250,248,244,0.05); }
        .unified-bento-glow-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent 0%,var(--card-glow) 50%,transparent 100%); opacity: 0; transition: opacity 0.5s ease; }
        .unified-bento-card:hover .unified-bento-glow-line { opacity: 1; }
        .unified-bento-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--card-icon-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; transition: all 0.4s ease; }
        .unified-bento-card:hover .unified-bento-icon { transform: scale(1.08); box-shadow: 0 0 20px var(--card-glow); }
        .unified-bento-title { font-family: 'Cormorant Garamond',serif; font-size: 1.1rem; font-weight: 600; color: ${C.bone}; margin-bottom: 0.5rem; }
        .unified-bento-desc { font-size: 0.85rem; color: rgba(250,248,244,0.45); line-height: 1.65; }
        .unified-bento-card:hover .unified-bento-desc { color: rgba(250,248,244,0.65); }

        .unified-cta-btn { background: transparent; color: ${C.bone}; border: 1.5px solid rgba(250,248,244,0.2); padding: 1rem 2.8rem; font-size: 1rem; border-radius: 50px; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .unified-cta-btn:hover { background: ${C.bone}; color: ${C.ink}; border-color: ${C.bone}; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(250,248,244,0.15); }
        .unified-micro { margin-top: 1.2rem; font-size: 0.9rem; color: rgba(250,248,244,0.3); font-family: 'Cormorant Garamond',serif; }

        .insurance-section { padding: clamp(5rem,10vw,7rem) 0; position: relative; overflow: hidden; background-image: url('/Funeral_Plan_hero.webp'); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed; border-top: 1px solid ${C.line}; }
        .insurance-scrim { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg,rgba(250,248,244,0.95) 0%,rgba(250,248,244,0.88) 100%); }
        .insurance-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; z-index: 2; background: linear-gradient(90deg,${C.brass},${C.brassLight},${C.accent},${C.brass}); background-size: 200% 100%; animation: gradient-text 4s ease infinite; }
        .insurance-content { position: relative; z-index: 1; text-align: left; max-width: 720px; }
        .insurance-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 1.25rem; margin-top: 3rem; text-align: left; }
        .insurance-card { background: rgba(250,248,244,0.92); border: 1px solid ${C.line}; border-radius: 14px; padding: 1.8rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); position: relative; overflow: hidden; }
        .insurance-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent,${C.brass},transparent); opacity: 0; transition: opacity 0.5s ease; }
        .insurance-card:hover { border-color: ${C.brass}; transform: translateY(-4px); box-shadow: 0 16px 36px -10px rgba(21,23,26,0.16); }
        .insurance-card:hover::before { opacity: 1; }
        .insurance-icon { width: 48px; height: 48px; border-radius: 12px; background: ${C.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1.1rem; color: ${C.verdigris}; transition: all 0.4s ease; }
        .insurance-card:hover .insurance-icon { background: ${C.verdigris}; color: ${C.bone}; }
        .insurance-card h3 { font-family: 'Cormorant Garamond',serif; font-size: 1.1rem; font-weight: 600; color: ${C.ink}; margin-bottom: 0.5rem; }
        .insurance-card p { font-size: 0.86rem; color: ${C.gray}; line-height: 1.7; }
        .insurance-card:hover p { color: ${C.ink}; }

        .app-window { border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(21,23,26,0.2); border: 1px solid ${C.line}; width: 100%; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .app-window:hover { transform: translateY(-8px); }
        .window-header { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.2rem; border-bottom: 1px solid ${C.line}; background: ${C.bone2}; }
        .window-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .window-title { font-size: 0.85rem; font-family: 'Cormorant Garamond',serif; color: ${C.gray}; }
        .window-body { padding: 2rem; background: ${C.bone}; }
        .app-window.dark .window-header { border-bottom: 1px solid ${C.lineDark}; background: rgba(0,0,0,0.2); }
        .app-window.dark .window-body { background: ${C.ink}; }
        .app-window.dark .window-title { color: ${C.grayLight}; }
        .mock-inner { padding: 0.5rem; }

        /* -- Floral Tablet Preview -- */
        .flp-tablet-wrapper { display: flex; justify-content: center; width: 100%; animation: flpTabletFloat 6s ease-in-out infinite; }
        .flp-tablet-scale { --s: 1; width: calc(400px * var(--s)); height: calc(560px * var(--s)); flex-shrink: 0; }
        .flp-tablet-scale-inner { width: 400px; height: 560px; transform: scale(var(--s)); transform-origin: top left; }
        .flp-tablet-frame { width: 400px; height: 560px; background: #0a0b0c; border-radius: 32px; padding: 12px; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.4),0 30px 60px -30px rgba(0,0,0,0.3),inset 0 0 0 2px rgba(255,255,255,0.05); position: relative; }
        .flp-tablet-frame::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 10; }
        .flp-tablet-screen { width: 100%; height: 100%; background: #0a0b0c; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Cormorant Garamond',serif; user-select: none; }
        .flp-hero { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity .6s ease-in-out; }
        .flp-overlay { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5; }
        .flp-strip { position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 25px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .flp-strip::-webkit-scrollbar { display: none; }
        .flp-story { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25; }
        .flp-ring { border-radius: 50%; padding: 2.5px; transition: transform .3s cubic-bezier(0.16,1,0.3,1); position: relative; }
        .flp-ring.flp-unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: flpPulse 2.8s ease-in-out infinite,flpFloat 3.2s ease-in-out infinite; }
        .flp-ring.flp-seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
        .flp-story:hover .flp-ring { transform: scale(1.06); }
        .flp-ring-inner { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; }
        .flp-ring-inner img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter .3s, transform .4s; }
        .flp-story:hover .flp-ring-inner img { filter: brightness(1.05); transform: scale(1.1); }
        .flp-story-label { font-size: 8px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; transition: color .2s; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .flp-story:hover .flp-story-label { color: rgba(255,255,255,0.95); }
        .flp-title-block { position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: flpFadeUp 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .flp-name-tag { font-size: 9px; font-weight: 600; letter-spacing: .35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
        .flp-headline { font-family: 'Cormorant Garamond',serif; font-weight: 500; font-size: 32px; line-height: 1.05; color: #fff; margin: 0; transition: opacity .4s ease, transform .4s ease; }
        .flp-headline em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }
        .flp-wordmark { position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: flpFadeUp 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .flp-wordmark-name { font-family: 'Cormorant Garamond',serif; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.4); }
        .flp-wordmark-sub { font-size: 8px; font-weight: 500; letter-spacing: .28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px; }
        @keyframes flpFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes flpPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); } }
        @keyframes flpTabletFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        /* Responsive: keep the 400ï¿½560 design intact and scale it down proportionally */
        @media (max-width:500px) { .flp-tablet-scale { --s: 0.85; } }
        @media (max-width:380px) { .flp-tablet-scale { --s: 0.72; } }
        @media (max-width:330px) { .flp-tablet-scale { --s: 0.62; } }

        .mock-list-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-family: 'Cormorant Garamond',serif; color: ${C.gray}; padding-bottom: 0.5rem; border-bottom: 1px solid ${C.line}; margin-bottom: 0.5rem; }
        .mock-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${C.line}; font-size: 0.9rem; }
        .file-icon { width: 32px; height: 32px; background: ${C.bone2}; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .status-badge { font-size: 0.85rem; font-family: 'Cormorant Garamond',serif; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 600; }
        .status-badge.verified { color: ${C.verdigris}; background: ${C.verdigrisTint}; }
        .status-badge.pending { color: ${C.brass}; background: rgba(139,115,85,0.1); }
        .status-badge.missing { color: ${C.accent}; background: rgba(199,123,94,0.1); }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.bone}; font-family: 'Cormorant Garamond',serif; font-weight: 600; font-size: 1rem; }
        .slider-group { margin-bottom: 1.5rem; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.8rem; color: ${C.grayLight}; }
        .slider-value { font-family: 'Cormorant Garamond',serif; color: ${C.bone}; font-weight: 600; }
        .custom-range { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(250,248,244,0.2); outline: none; cursor: pointer; border-radius: 2px; }
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: ${C.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${C.ink}; }
        .custom-range::-moz-range-thumb { width: 16px; height: 16px; background: ${C.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${C.ink}; }
        .dispatch-footer { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid ${C.lineDark}; padding-top: 1.2rem; margin-top: 0.5rem; }
        .cost-value { font-size: 1.8rem; font-family: 'Cormorant Garamond',serif; color: ${C.bone}; font-weight: 600; }
        .map-visual { position: relative; height: 120px; background: rgba(250,248,244,0.04); border: 1px solid ${C.lineDark}; border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; overflow: hidden; }
        .map-visual::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px); background-size: 20px 20px; }
        .map-pin { width: 32px; height: 32px; border-radius: 50%; background: ${C.verdigris}; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .map-line { position: absolute; left: 32px; right: 32px; height: 2px; background: linear-gradient(90deg,${C.verdigris},${C.accent}); z-index: 1; }
        .map-truck { position: absolute; left: 40%; background: ${C.ink}; padding: 0.5rem; border-radius: 6px; border: 1px solid ${C.lineDark}; z-index: 3; animation: truckMove 3s infinite alternate ease-in-out; }

        /* -- Features section (professional) -- */
        .features-head { text-align: center; margin-bottom: 3rem; }
        .features-pill { display: inline-flex; align-items: center; gap: 0.55rem; padding: 0.5rem 1.15rem; border: 1px solid ${C.line}; border-radius: 999px; background: ${C.bone2}; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: ${C.brass}; margin-bottom: 1.6rem; }
        .features-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: ${C.verdigris}; animation: subtle-pulse 2.4s infinite; }
        .features-heading { font-size: clamp(2.1rem, 4.5vw, 3.1rem); line-height: 1.12; max-width: 760px; margin: 0 auto 1.1rem; }
        .features-heading em { font-style: italic; font-weight: 500; color: ${C.brass}; font-family: 'Cormorant Garamond', serif !important; }
        .features-sub { max-width: 640px; margin: 0 auto; color: ${C.gray}; }
        .features-trust { display: flex; align-items: center; justify-content: center; gap: 1.1rem; flex-wrap: wrap; margin-top: 2.2rem; font-size: 0.78rem; text-transform: uppercase; color: ${C.grayDark}; font-weight: 500; }
        .features-trust-sep { width: 1px; height: 14px; background: ${C.line}; }

        .showcase-module { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.3rem; }
        .showcase-no { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: ${C.verdigris}; white-space: nowrap; }
        .showcase-rule { width: 110px; height: 1px; background: linear-gradient(90deg, ${C.verdigris}66, transparent); }
        .showcase-points { list-style: none; margin: 1.6rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .showcase-points li { display: flex; align-items: flex-start; gap: 0.7rem; font-size: 0.95rem; color: ${C.grayDark}; line-height: 1.55; }
        .showcase-check { width: 20px; height: 20px; border-radius: 50%; background: ${C.verdigrisTint}; color: ${C.verdigris}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .showcase-cta { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.9rem; background: none; border: none; border-bottom: 1.5px solid ${C.brass}; padding: 0 0 0.4rem; color: ${C.ink}; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: color 0.3s ease, gap 0.3s ease; }
        .showcase-cta:hover { color: ${C.brass}; gap: 0.75rem; }
        /* -- Professional app mockups -- */
        .case-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.4rem; }
        .case-name { font-size: 1.45rem; font-family: 'Cormorant Garamond', serif; color: ${C.ink}; margin-top: 0.25rem; line-height: 1.2; }
        .case-meta { font-size: 0.74rem; color: ${C.gray}; margin-top: 0.4rem; line-height: 1.5; }
        .live-chip { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: #7FD1A8; background: rgba(77,155,127,0.14); border: 1px solid rgba(77,155,127,0.35); padding: 0.45rem 0.85rem; border-radius: 999px; white-space: nowrap; }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #6FCFA5; animation: subtle-pulse 2s infinite; }
        .compliance { background: ${C.bone2}; border: 1px solid ${C.line}; border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1.4rem; }
        .compliance-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.78rem; color: ${C.gray}; margin-bottom: 0.65rem; }
        .compliance-count { color: ${C.verdigris}; font-weight: 600; }
        .compliance-track { display: flex; gap: 4px; }
        .compliance-seg { flex: 1; height: 5px; border-radius: 3px; background: ${C.line}; }
        .compliance-seg.verified { background: ${C.verdigris}; }
        .compliance-seg.pending { background: ${C.brass}; opacity: 0.5; }
        .compliance-seg.missing { background: ${C.accent}; opacity: 0.3; }
        .doc-name { color: ${C.ink}; font-weight: 600; font-size: 0.92rem; }
        .doc-meta { font-size: 0.72rem; color: ${C.gray}; margin-top: 0.15rem; }
        .doc-actions { display: flex; gap: 0.6rem; margin-top: 1.3rem; }
        .doc-action { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; font-weight: 600; padding: 0.55rem 0.95rem; border-radius: 8px; border: 1px solid ${C.line}; color: ${C.grayDark}; background: ${C.bone}; }
        .doc-action.primary { background: ${C.ink}; color: ${C.bone}; border-color: ${C.ink}; }
        .cost-lines { margin: 0.4rem 0; }
        .cost-line { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.82rem; color: ${C.grayLight}; padding: 0.5rem 0; border-bottom: 1px dashed rgba(250,248,244,0.09); }
        .cost-line span:last-child { color: ${C.bone}; font-weight: 600; font-family: 'Cormorant Garamond', serif !important; font-size: 0.98rem; }
        .billed-label { font-size: 0.78rem; color: ${C.grayLight}; }
        .billed-sub { font-size: 0.72rem; color: rgba(250,248,244,0.38); margin-top: 0.2rem; }

        /* Sans-serif metadata & utility text (overrides global serif for data-dense UI) */
        .case-meta, .compliance-row, .compliance-row *, .doc-meta, .doc-name, .live-chip, .live-chip *, .cost-line, .cost-line span:first-child, .billed-label, .billed-sub, .doc-action, .doc-action *, .showcase-points li, .showcase-points li * { font-family: 'Saira', sans-serif !important; }

        /* -- Sections -- */
        .section { padding: clamp(4rem,8vw,6rem) 0; }
        .showcase-mobile { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; margin-bottom: 7rem; }
        .floral-showcase { padding-top: 3rem; }
        .about-section { background: ${C.bone}; padding: clamp(3rem,6vw,4rem) 0; border-top: 1px solid ${C.line}; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .lockin-section { position: relative; padding: clamp(5rem,10vw,7rem) 0; overflow: hidden; border-top: 1px solid ${C.line}; }
        .lockin-bg { position: absolute; inset: 0; background-image: url('/lockin.webp'); background-size: cover; background-position: center; background-attachment: fixed; }
        .lockin-section::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(12,12,12,0.78) 0%,rgba(21,23,26,0.86) 100%); }
        .lockin-content { position: relative; z-index: 1; }
        .lockin-title { font-size: clamp(2rem,5vw,2.8rem); font-weight: 700; color: #FFFFFF !important; margin-bottom: 1.25rem; line-height: 1.2; }
        .lockin-desc { font-size: 1.05rem; color: rgba(250,248,244,0.82); line-height: 1.8; margin-bottom: 1.25rem; }
        .lockin-sub { font-size: 1.15rem; font-family: 'Cormorant Garamond',serif; font-weight: 600; color: ${C.brassLight}; line-height: 1.7; margin-bottom: 2.5rem; }
        .lockin-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1.5rem; margin-top: 2.5rem; text-align: left; }
        .lockin-card { background: rgba(250,248,244,0.05); border: 1px solid rgba(250,248,244,0.08); border-radius: 12px; padding: 1.5rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .lockin-card:hover { border-color: rgba(139,115,85,0.35); background: rgba(250,248,244,0.08); transform: translateY(-4px); }
        .lockin-card-icon { width: 44px; height: 44px; border-radius: 10px; background: ${C.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .lockin-card h3 { font-size: 1.05rem; font-weight: 600; color: ${C.bone}; margin-bottom: 0.5rem; }
        .lockin-card p { font-size: 0.85rem; color: rgba(250,248,244,0.68); line-height: 1.6; }
        @media(max-width:768px) { .lockin-section { padding: clamp(4rem,10vw,5rem) 0; } .lockin-bg { background-attachment: scroll; } }
        .modules-section { padding: clamp(4rem,8vw,6rem) 0; background: ${C.bone}; border-top: 1px solid ${C.line}; }
        .modules-header { text-align: center; margin-bottom: 3rem; padding: 0 1rem; }
        .modules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 900px; margin: 0 auto; align-items: stretch; }
        .modules-grid > div { display: flex; }
        .module-sms { display: grid; grid-template-columns: 1fr 0.9fr; gap: clamp(2rem,5vw,4rem); align-items: center; max-width: 1000px; margin: 0 auto 2rem; padding: clamp(1.5rem,4vw,3rem); overflow: hidden; border: 1px solid rgba(250,248,244,0.12); border-radius: 20px; background: linear-gradient(135deg,${C.verdigrisDark} 0%,${C.ink} 100%); box-shadow: 0 18px 48px rgba(21,23,26,0.16); }
        .module-sms-copy { min-width: 0; }
        .module-sms-status { display: inline-flex; align-items: center; gap: 0.55rem; margin-bottom: 1.15rem; padding: 0.48rem 0.8rem; border: 1px solid rgba(61,79,71,0.18); border-radius: 999px; background: ${C.verdigrisTint}; color: ${C.verdigris}; font-family: 'Saira',sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; }
        .module-sms-status span { width: 7px; height: 7px; border-radius: 50%; background: ${C.verdigris}; box-shadow: 0 0 0 4px rgba(61,79,71,0.1); }
        .module-sms .module-sms-title { margin: 0 0 0.8rem; color: ${C.bone}; font-size: clamp(1.8rem,3.5vw,2.5rem); line-height: 1.12; }
        .module-sms-desc { max-width: 530px; margin: 0; color: rgba(250,248,244,0.76); font-family: 'Saira',sans-serif; font-size: 0.98rem; line-height: 1.75; }
        .module-sms-cta { display: inline-flex; align-items: center; gap: 0.55rem; margin-top: 1.5rem; padding: 0.82rem 1.15rem; border: 0; border-radius: 8px; background: ${C.brassLight}; color: #FFFFFF; font-family: 'Saira',sans-serif; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: background 0.2s ease, transform 0.2s ease; }
        .module-sms-cta:hover { background: ${C.brass}; transform: translateY(-2px); }
        .module-sms-visual { display: flex; justify-content: center; padding: clamp(1rem,3vw,2rem); border: 1px solid rgba(250,248,244,0.1); border-radius: 16px; background: radial-gradient(ellipse at top right,rgba(169,143,110,0.2),transparent 55%),${C.verdigrisDark}; }
        .module-sms-phone { width: 100%; max-width: 320px; padding: 1.15rem; border: 1px solid rgba(21,23,26,0.08); border-radius: 16px; background: #FFFFFF; box-shadow: 0 16px 38px rgba(0,0,0,0.2); }
        .module-sms-phone-head { display: flex; align-items: center; gap: 0.65rem; padding-bottom: 0.85rem; border-bottom: 1px solid ${C.line}; }
        .module-sms-phone-icon { display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 10px; background: ${C.verdigrisTint}; color: ${C.verdigris}; }
        .module-sms-phone-head strong { display: block; color: ${C.ink}; font-family: 'Saira',sans-serif; font-size: 0.8rem; }
        .module-sms-phone-head small { display: block; margin-top: 0.12rem; color: ${C.gray}; font-family: 'Saira',sans-serif; font-size: 0.68rem; }
        .module-sms-phone-head em { display: block; margin-top: 0.1rem; color: ${C.gray}; font-family: 'Saira',sans-serif; font-size: 0.61rem; font-style: normal; }
        .module-sms-update { position: relative; margin: 0.9rem 0 0 0.45rem; padding: 0 0 0.9rem 1.25rem; border-left: 1px solid ${C.line}; }
        .module-sms-update:last-child { padding-bottom: 0; border-left-color: transparent; }
        .module-sms-update::before { position: absolute; top: 0.15rem; left: -5px; width: 9px; height: 9px; border: 2px solid #FFFFFF; border-radius: 50%; background: ${C.verdigris}; box-shadow: 0 0 0 1px ${C.verdigris}; content: ''; }
        .module-sms-update-label { display: block; margin-bottom: 0.35rem; color: ${C.verdigris}; font-family: 'Saira',sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; }
        .module-sms-update p { margin: 0; padding: 0.7rem 0.8rem; border: 1px solid rgba(21,23,26,0.06); border-radius: 4px 12px 12px; background: #FFFFFF; color: ${C.ink}; font-family: 'Saira',sans-serif; font-size: 0.75rem; line-height: 1.55; }
        .module-card { flex: 1; width: 100%; display: flex; flex-direction: column; padding: 1.5rem; border: 1px solid ${C.line}; border-radius: 12px; background: ${C.bone}; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none; }
        .module-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--accent) 10%,transparent); }
        .module-card.dark { background: ${C.ink}; border-color: rgba(250,248,244,0.12); }
        .module-card.dark:hover { box-shadow: 0 8px 24px rgba(21,23,26,0.35); }
        .module-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .module-cat { display: flex; align-items: center; gap: 0.5rem; font-family: 'Cormorant Garamond',serif; font-size: 0.85rem; text-transform: uppercase; font-weight: 600; }
        .module-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: module-pulse 2s ease-in-out infinite; }
        .module-ext { color: ${C.gray}; opacity: 0; transform: translate(-4px,4px); transition: all 0.3s ease; }
        .module-card:hover .module-ext { opacity: 1; transform: translate(0,0); color: var(--accent); }
        .module-title { font-size: 1.15rem; font-weight: 600; color: ${C.ink}; margin: 0 0 0.5rem; line-height: 1.35; font-family: 'Cormorant Garamond',serif; }
        .module-excerpt { font-size: 0.85rem; color: ${C.gray}; line-height: 1.65; flex: 1; margin: 0; }
        .module-status { font-size: 0.85rem; color: ${C.gray}; font-family: 'Cormorant Garamond',serif; margin-top: 1rem; }
        .module-card.dark .module-title { color: ${C.bone}; }
        .module-card.dark .module-excerpt { color: rgba(250,248,244,0.62); }
        .module-card.dark .module-status { color: rgba(250,248,244,0.45); }
        .module-card.dark .module-ext { color: rgba(250,248,244,0.5); }
        .module-card.static { cursor: default; }
        @keyframes module-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
        @keyframes subtle-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(61,79,71,0.4); } 70% { box-shadow: 0 0 0 6px rgba(61,79,71,0); } }

        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-25%); } }
        @keyframes shine { 0% { left: -100%; } 50%,100% { left: 200%; } }
        @keyframes subtle-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-orb { 0%,100% { transform: translate(0,0) scale(1); } 25% { transform: translate(30px,-20px) scale(1.1); } 50% { transform: translate(-20px,20px) scale(0.95); } 75% { transform: translate(10px,10px) scale(1.05); } }
        @keyframes gradient-text { 0% { background-position: 0% center; } 50% { background-position: 100% center; } 100% { background-position: 0% center; } }
        @keyframes truckMove { from { left: 30%; } to { left: 60%; } }

        @media(max-width:768px) {
          html { font-size: 17px; }
          .showcase-mobile { grid-template-columns: 1fr !important; gap: 2rem !important; margin-bottom: 4rem !important; }
          .floral-showcase { padding-top: 1.5rem; }
          .showcase-mobile .showcase-text { order: 2 !important; padding: 0 !important; }
          .showcase-mobile .showcase-visual { order: 1 !important; justify-content: center !important; }
          .insurance-content { max-width: 100%; }
          .modules-grid { grid-template-columns: 1fr; }
          .module-sms { grid-template-columns: 1fr; gap: 1.5rem; }
          .module-sms-visual { padding: 1rem; }
          .about-grid { grid-template-columns: 1fr; gap: 2rem; }
          .window-body { padding: 1.5rem; }
          .features-head { margin-bottom: 3.5rem; }
          .features-trust { gap: 0.6rem 0.9rem; font-size: 0.7rem; }
          .features-trust-sep { display: none; }
          .doc-actions { flex-wrap: wrap; }
          .showcase-cta { margin-top: 1.5rem; }
          .quickfind-grid { grid-template-columns: 1fr; }
          .unified-bento { grid-template-columns: 1fr !important; }
          .unified-bento-card { grid-column: span 1 !important; }
          .unified-heading { font-size: clamp(1.8rem,6vw,3rem); }
          .unified-watermark { font-size: clamp(4rem,14vw,8rem); }
          .insurance-overlay { background: linear-gradient(180deg,rgba(12,12,12,0.88) 0%,rgba(12,12,12,0.72) 100%); }
          .insurance-section { background-attachment: scroll; }
        }
        @media(max-width:480px) {
          html { font-size: 17.5px; }
          .wrap { padding-left: 1.2rem !important; padding-right: 1.2rem !important; }
          .btn { padding: 0.85rem 1.3rem !important; font-size: 0.92rem !important; }
          .mono-label { font-size: 0.8rem; }
          .features-pill { font-size: 0.65rem; padding: 0.45rem 0.9rem; }
          .cost-value { font-size: 1.5rem; }
          .module-title { font-size: 1.25rem; }
          .module-excerpt { font-size: 1rem; }
        }
      `}</style>

      <main className="landing-page">
        {/* -- Navigation (new global header) -- */}
        <SiteNav />

        {/* -- Hero (new) -- */}
        <Hero />

        <Marquee items={marqueeItems} />

        {/* -- Features -- */}
        <section id="features" className="section">
          <div className="wrap">
            <PremiumReporting />
            <Showcase no="03" floral title="The Right Flowers. Right in Front of Them." reverse={false} cta="Discover the floral concierge" desc={
              <>
                <strong style={{ display: 'block', fontSize: '1.18rem', color: C.ink, lineHeight: 1.45, marginBottom: '1.2rem' }}>
                  Make the right tribute easier to choose.
                </strong>
                <span style={{ display: 'block', marginBottom: '1rem' }}>
                  Families should not have to search the internet for hours to find flowers that fit the moment.
                </span>
                <span style={{ display: 'block', marginBottom: '1rem' }}>
                  Put a curated collection at the front desk. They browse, compare, and choose with confidence.
                </span>
                <span style={{ display: 'block', marginBottom: '1rem' }}>
                  The booking appears instantly in Rest Point, and your florist is notified right away.
                </span>
                <span style={{ display: 'block' }}>
                  Add ribbon colors, flower preferences, and personal messages while the family is still there.
                </span>
              </>
            }>
              <FloralPreview />
            </Showcase>
          </div>
        </section>

        {/* -- Insurance -- */}
        <section id="insurance" className="insurance-section">
          <div className="insurance-accent-bar" />
          <div className="wrap">
            <div className="insurance-content">
              <Reveal>
                <div className="label" style={{ color: '#E8D5B5', marginBottom: '1.1rem' }}>Funeral Insurance & Welfare Management</div>
                <h2 style={{ color: '#FFFFFF', marginBottom: '1.2rem', fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.2 }}>We understand the pain and financial burden families face</h2>
                <p style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1.9, marginBottom: '1.4rem', fontSize: '1.05rem', maxWidth: '640px' }}>
                  Families go through immense pain when they lose a loved one, only to be burdened with huge hospital bills and funeral expenses. We break down these barriers by bringing comprehensive funeral insurance solutions directly to your organization.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.9, marginBottom: '2.5rem', fontSize: '1.05rem', maxWidth: '640px' }}>
                  Rest Point now includes funeral insurance management and welfare scheme administration tools  claims, contributions, member tracking, and automated payouts all in one place.
                </p>
                <button className="btn btn-brass" onClick={() => navigate('/insurance')} style={{ padding: '1rem 2.4rem' }}>
                  Explore insurance operations <ArrowRight size={16} />
                </button>
              </Reveal>
            </div>
          </div>
        </section>

        {/* -- Hardware Requirement (replaces the old uptime/audit-trail infrastructure block) -- */}
        <HardwareRequirementSection />

        {/* -- Our Mission -- */}
        <MissionSection />

        {/* -- Modules -- */}
        <section id="modules" className="modules-section">
          <div className="wrap">
            <div className="modules-header">
              <Reveal>
                <div className="label" style={{ marginBottom: '1rem' }}>Modules</div>
                <h2>Powerful modules, built right in</h2>
              </Reveal>
            </div>
            <Reveal>
              <article className="module-sms">
                <div className="module-sms-copy">
                  <span className="module-sms-status"><span />Available now</span>
                  <h3 className="module-sms-title">Keep families informed, automatically.</h3>
                  <p className="module-sms-desc">
                    Rest Point automatically texts the next of kin when a loved one is received into the
                    mortuary and again when they are released. Families get timely updates, while your
                    team can focus on caring for them.
                  </p>
                  <button className="module-sms-cta" onClick={goStart}>
                    See Rest Point in action <ArrowRight size={16} />
                  </button>
                </div>
                <div className="module-sms-visual" role="img" aria-label="Example next-of-kin text updates at intake and release">
                  <div className="module-sms-phone">
                    <div className="module-sms-phone-head">
                      <div className="module-sms-phone-icon"><MessageCircle size={17} /></div>
                      <div>
                        <strong>MM FUNERAL HOME</strong>
                        <small>Family updates</small>
                        <em>Sent automatically by Rest Point</em>
                      </div>
                    </div>
                    <div className="module-sms-update">
                      <span className="module-sms-update-label">BODY INTAKE</span>
                      <p>We wish to inform you that the body of Mary Wanjiku has been received into our care. Admission number: RP-2026-0142. Please be assured that we will care for your loved one with dignity and respect. If there is anything you need, we are just a call away. Call +254740045355.</p>
                    </div>
                    <div className="module-sms-update">
                      <span className="module-sms-update-label">BODY RELEASED</span>
                      <p>Dear Wanjiku, we wish to let you know that the body of Mary Wanjiku has been successfully released to you. The final destination is Eldoret. Thank you for trusting us to care for your loved one. We wish you and your family strength during this difficult time. Our hearts are with you.</p>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
            <div className="modules-grid">
              {landingModules.map((m, i) => (
                <Reveal key={i} delay={i * 120}>
                  <a
                    className={`module-card${m.dark ? ' dark' : ''}${m.static ? ' static' : ''}`}
                    style={{ '--accent': m.accent }}
                    onClick={m.to ? goStart : undefined}
                  >
                    <div className="module-card-top">
                      <div className="module-cat" style={{ color: m.accent }}><span className="module-dot" style={{ background: m.accent }} />{m.category}</div>
                      <ExternalLink size={14} className="module-ext" />
                    </div>
                    <h4 className="module-title">{m.title}</h4>
                    <p className="module-excerpt">{m.excerpt}</p>
                    <span className="module-status">{m.status}</span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>




        <Footer />
        <FloatingCTA />
      </main>
    </>
  );
}
