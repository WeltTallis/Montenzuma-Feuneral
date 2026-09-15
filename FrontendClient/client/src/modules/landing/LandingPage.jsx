import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsroomSection from '../newsroom/NewsroomSection';
import HardwareRequirementSection from './hardwareRequirement';
import LandingPageSEO from '../seo/LandingPageSEO';
import Footer from '../../components/layout/Footer';
import DirectorsMoment from './DirectorsMoment';
import ModuleGridSection from './imageCard';
import C from '../../utils/colors/index'
import FloatingCTA from './FloatingCTA';
import DemoRequestPanel from './DemoRequestPanel';
import FaqSection from './FaqSection';
import MissionSection from './Mission';
import SiteNav from './nav';
import Hero from './hero';
import { ChevronDown, Menu, Check, ShieldCheck, Server, Zap, ArrowRight, X, FileText, Download, MapPin, Truck, Activity, Users, Newspaper, ExternalLink, LayoutDashboard, Lock, Globe, Layers, MessageSquare, LifeBuoy } from '../../utils/icons/icons';
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

/* ═══════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════ */

const AppWindow = ({ title, children, dark = false }) => (
  <div className={`app-window ${dark ? 'dark' : 'light'}`}>
    <div className="window-header">
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <span className="window-dot" style={{ background: '#FF5F57' }} />
        <span className="window-dot" style={{ background: '#FEBC2E' }} />
        <span className="window-dot" style={{ background: '#28C840' }} />
      </div>
      <span className="window-title">{title}</span>
      <div style={{ width: '40px' }} />
    </div>
    <div className="window-body">{children}</div>
  </div>
);

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

/* ═══════════════════════════════════════
   MOCK COMPONENTS
   ═══════════════════════════════════════ */
const MockDocuments = () => (
  <div className="mock-inner">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div><div className="mono-label" style={{ color: C.verdigris }}>CASE FILE</div><div style={{ fontSize: '1.4rem', fontFamily: "'Fraunces', serif", color: C.ink, marginTop: '0.3rem' }}>Otieno, J.</div></div>
      <div className="avatar" style={{ background: C.verdigris }}>JO</div>
    </div>
    <div className="mock-list-header"><span>Document Name</span><span>Status</span></div>
    {[{ n: 'Death certificate.pdf', c: C.verdigris, s: 'verified' }, { n: 'Burial permit.pdf', c: C.brass, s: 'pending' }, { n: 'Police abstract.pdf', c: C.accent, s: 'missing' }].map((d, i) => (
      <div key={i} className="mock-row" style={{ borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div className="file-icon"><FileText size={16} color={d.c} /></div><span style={{ color: C.ink }}>{d.n}</span></div>
        <span className={`status-badge ${d.s}`}>{d.s.charAt(0).toUpperCase() + d.s.slice(1)}</span>
      </div>
    ))}
  </div>
);

const MockPortal = () => (
  <div className="mock-inner">
    <div style={{ marginBottom: '1.5rem' }}><div className="mono-label" style={{ color: C.verdigris }}>MWANGI FAMILY</div><div style={{ fontSize: '1.4rem', fontFamily: "'Fraunces', serif", color: C.ink, marginTop: '0.3rem' }}>Arrangements confirmed</div></div>
    <div className="mock-row"><div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div className="file-icon"><FileText size={16} color={C.brass} /></div><span style={{ color: C.ink }}>Burial permit.pdf</span></div><button className="action-btn"><Download size={14} /></button></div>
    <div className="mock-row"><span style={{ color: C.ink, fontSize: '0.9rem' }}>Service invoice</span><span className="status-badge neutral">KES 84,000</span></div>
    <div className="mock-row" style={{ borderBottom: 'none' }}><span style={{ color: C.ink, fontSize: '0.9rem', fontWeight: 600 }}>Outstanding balance</span><button className="pay-btn">Pay KES 12,500</button></div>
  </div>
);

const MockDispatch = () => {
  const [distance, setDistance] = useState(38);
  const [rate, setRate] = useState(195);
  return (
    <div className="mock-inner">
      <div style={{ marginBottom: '1.5rem' }}><div className="mono-label" style={{ color: C.brassLight }}>SMART DISPATCH</div><div style={{ fontSize: '1.4rem', fontFamily: "'Fraunces', serif", color: C.bone, marginTop: '0.3rem' }}>Route Optimization</div></div>
      <div className="map-visual"><div className="map-pin"><MapPin size={16} color={C.bone} /></div><div className="map-line" /><div className="map-pin" style={{ background: C.accent }}><MapPin size={16} color={C.bone} /></div><div className="map-truck"><Truck size={20} color={C.brass} /></div></div>
      <div className="slider-group"><div className="slider-row"><span>Distance (km)</span><span className="slider-value">{distance}</span></div><input type="range" min="2" max="120" value={distance} onChange={(e) => setDistance(+e.target.value)} className="custom-range" /></div>
      <div className="slider-group"><div className="slider-row"><span>Fuel rate (KES/L)</span><span className="slider-value">{rate}</span></div><input type="range" min="150" max="250" value={rate} onChange={(e) => setRate(+e.target.value)} className="custom-range" /></div>
      <div className="dispatch-footer"><span>Auto billed Trip Cost</span><span className="cost-value">KES {Math.round(distance * 0.12 * rate).toLocaleString()}</span></div>
    </div>
  );
};

const MockHearse = () => (
  <div className="mock-inner">
    <div style={{ marginBottom: '1.5rem' }}><div className="mono-label" style={{ color: C.brassLight }}>FLEET STATUS</div><div style={{ fontSize: '1.4rem', fontFamily: "'Fraunces', serif", color: C.bone, marginTop: '0.3rem' }}>Live Fleet Tracking</div></div>
    {[{ n: 'Hearse 01 - Benz', p: 'KDA 123A', bg: 'rgba(61,79,71,0.3)', ic: C.bone, s: 'available' }, { n: 'Hearse 02 - Toyota', p: 'KDB 456B', bg: 'rgba(199,123,94,0.2)', ic: C.accent, s: 'dispatched' }, { n: 'Hearse 03 - Nissan', p: 'KDC 789C', bg: 'rgba(139,115,85,0.2)', ic: C.brass, s: 'maintenance' }].map((h, i) => (
      <div key={i} className="fleet-card" style={{ borderBottom: i < 2 ? `1px solid ${C.lineDark}` : 'none' }}>
        <div className="fleet-info"><div className="fleet-icon" style={{ background: h.bg }}><Truck size={18} color={h.ic} /></div><div><div style={{ color: C.bone, fontSize: '0.9rem', fontWeight: 500 }}>{h.n}</div><div style={{ color: C.grayLight, fontSize: '0.75rem' }}>{h.p}</div></div></div>
        <span className={`fleet-status ${h.s}`}>{h.s.charAt(0).toUpperCase() + h.s.slice(1)}</span>
      </div>
    ))}
  </div>
);
const MockSupport = () => (
  <div className="mock-inner">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
      <div>
        <div className="mono-label" style={{ color: C.verdigris }}>SUPPORT TICKET #1042</div>
        <div style={{ fontSize: '1.15rem', fontFamily: "'Fraunces', serif", color: C.ink, marginTop: '0.3rem' }}>Hearse booking issue</div>
      </div>
      <span style={{
        fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace",
        padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 600,
        color: C.brass, background: 'rgba(139,115,85,0.1)',
      }}>IN PROGRESS</span>
    </div>

    {/* Client message */}
    <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1rem' }}>
      <div className="avatar" style={{ background: C.accent, width: 30, height: 30, fontSize: '0.7rem', flexShrink: 0 }}>SM</div>
      <div style={{ background: C.bone2, borderRadius: '10px 10px 10px 2px', padding: '0.75rem 1rem', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: C.gray, marginBottom: '0.3rem' }}>Sarah M. · 10:32 AM</div>
        <div style={{ fontSize: '0.84rem', color: C.ink, lineHeight: 1.6 }}>Booking freezes when I click confirm on the hearse page.</div>
      </div>
    </div>

    {/* Staff reply */}
    <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1rem', flexDirection: 'row-reverse' }}>
      <div className="avatar" style={{ background: C.verdigris, width: 30, height: 30, fontSize: '0.62rem', flexShrink: 0 }}>RP</div>
      <div style={{ background: C.verdigrisTint || 'rgba(61,79,71,0.08)', border: `1px solid ${C.line}`, borderRadius: '10px 10px 2px 10px', padding: '0.75rem 1rem', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: C.verdigris, marginBottom: '0.3rem', fontWeight: 600 }}>RESTPOINT SUPPORT · 10:35 AM</div>
        <div style={{ fontSize: '0.84rem', color: C.ink, lineHeight: 1.6 }}>Thanks for flagging this. Our team is on it; we will update you here the moment it is resolved.</div>
      </div>
    </div>

    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      borderTop: `1px solid ${C.line}`, paddingTop: '0.9rem',
      fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: C.gray,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.verdigris, display: 'inline-block', animation: 'subtle-pulse 2s ease infinite' }} />
      Support agent online · replies arrive in real time
      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: C.verdigris, fontWeight: 500 }}>
        <MessageSquare size={12} /> Reply
      </span>
    </div>
  </div>
);

/* ── Floral Preview ── */
const FLP_FONTS_ID = 'flp-fraunces-font';
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
    if (!document.getElementById(FLP_FONTS_ID)) {
      const link = document.createElement('link');
      link.id = FLP_FONTS_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
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

const Showcase = ({ no, title, desc, reverse, children }) => (
  <Reveal className="showcase-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center', marginBottom: '7rem' }}>
    <div className="showcase-text" style={{ order: reverse ? 2 : 1, paddingRight: reverse ? '0' : '2rem', paddingLeft: reverse ? '2rem' : '0' }}>
      <div className="mono-label" style={{ color: C.verdigris, fontSize: '0.78rem', marginBottom: '1.2rem' }}>Module {no}</div>
      <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: '1.2rem', lineHeight: 1.25 }}>{title}</h2>
      <p style={{ fontSize: '1.05rem', maxWidth: '480px', color: C.gray, lineHeight: 1.8 }}>{desc}</p>
    </div>
    <div className="showcase-visual" style={{ order: reverse ? 1 : 2, display: 'flex', justifyContent: 'center', width: '100%' }}>{children}</div>
  </Reveal>
);

/* ═══════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════ */
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
    { dark: true, to: true, category: 'NEW · INTEGRATED', accent: C.brass, title: 'Leave Management', excerpt: 'Staff leave is now fully handled inside Rest Point. Request, approve, and track time off in real time - no spreadsheets or external HR tools.', status: 'NOW LIVE' },
    { static: true, category: 'PREMIUM FLORAL BOOKING', accent: C.verdigris, title: 'High-End Funeral Flowers', excerpt: 'We built a premium floral booking flow for funeral homes: families browse refined tribute arrangements, the system recommends elegant options based on the service style and season, and each order is sent directly to the florist with no confusion. This is crafted for funeral homes that take pride in dignified, high-end floral presentation.', status: 'RECEPTIONIST PORTAL' },
    { dark: true, to: true, category: 'NEW · SUPPORT CENTER', accent: C.brass, title: 'Real-time Customer Support', excerpt: 'Submit issues directly through the platform and our support agents receive, respond to, and resolve them in real time with full status tracking and communication history.', status: 'NOW LIVE' },
  ];

  const marqueeItems = ['Case Management', 'Family Portal', 'Smart Dispatch', 'Fleet Tracking', 'Funeral Insurance', 'Real-time Support', 'Billing & Invoicing', 'Analytics & Reports', 'Welfare Schemes'];

  return (
    <>
      <LandingPageSEO />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { font-family: 'Inter', sans-serif; color: ${C.gray}; background: ${C.bone}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -0.01em; color: ${C.ink}; }
        h1 { font-size: clamp(2rem, 6.5vw, 4.6rem); line-height: 1.05; margin-bottom: 1.4rem; }
        h2 { font-size: clamp(1.9rem, 4vw, 2.5rem); line-height: 1.2; }
        p { line-height: 1.7; font-size: 1rem; }
        a { color: inherit; text-decoration: none; }
        .mono-label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.brass}; font-weight: 500; }
        .label { font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.brass}; font-weight: 500; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.95rem 1.9rem; font-size: 0.9rem; font-weight: 500; font-family: 'Inter', sans-serif; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; letter-spacing: 0.01em; }
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
        .marquee-item { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0 1.8rem; font-size: 0.78rem; color: #FFFFFF; font-family: 'JetBrains Mono', monospace; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.1em; }
        .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: #FFFFFF; display: inline-block; flex-shrink: 0; }

        .quickfind-section { padding: clamp(4rem,8vw,6rem) 0; background: ${C.bone}; }
        .search-bar { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.4rem; border: 1.5px solid ${C.line}; border-radius: 12px; background: ${C.bone}; transition: all 0.35s ease; box-shadow: 0 2px 8px rgba(21,23,26,0.03); }
        .search-bar.focused { border-color: ${C.verdigris}; box-shadow: 0 4px 20px rgba(61,79,71,0.1),0 0 0 3px rgba(61,79,71,0.06); }
        .search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: ${C.ink}; font-family: 'Inter', sans-serif; }
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
        .unified-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-family: 'Fraunces',serif; font-size: clamp(6rem,18vw,16rem); font-weight: 700; color: rgba(250,248,244,0.02); pointer-events: none; white-space: nowrap; letter-spacing: -0.03em; user-select: none; }
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
        .unified-bento-title { font-family: 'Inter',sans-serif; font-size: 1rem; font-weight: 600; color: ${C.bone}; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
        .unified-bento-desc { font-size: 0.85rem; color: rgba(250,248,244,0.45); line-height: 1.65; }
        .unified-bento-card:hover .unified-bento-desc { color: rgba(250,248,244,0.65); }

        .unified-cta-btn { background: transparent; color: ${C.bone}; border: 1.5px solid rgba(250,248,244,0.2); padding: 1rem 2.8rem; font-size: 1rem; border-radius: 50px; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .unified-cta-btn:hover { background: ${C.bone}; color: ${C.ink}; border-color: ${C.bone}; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(250,248,244,0.15); }
        .unified-micro { margin-top: 1.2rem; font-size: 0.78rem; color: rgba(250,248,244,0.3); font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; }

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
        .insurance-card h3 { font-family: 'Inter',sans-serif; font-size: 1.05rem; font-weight: 600; color: ${C.ink}; margin-bottom: 0.5rem; }
        .insurance-card p { font-size: 0.86rem; color: ${C.gray}; line-height: 1.7; }
        .insurance-card:hover p { color: ${C.ink}; }

        .app-window { border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(21,23,26,0.2); border: 1px solid ${C.line}; width: 100%; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .app-window:hover { transform: translateY(-8px); }
        .window-header { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.2rem; border-bottom: 1px solid ${C.line}; background: ${C.bone2}; }
        .window-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .window-title { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; color: ${C.gray}; letter-spacing: 0.05em; }
        .window-body { padding: 2rem; background: ${C.bone}; }
        .app-window.dark .window-header { border-bottom: 1px solid ${C.lineDark}; background: rgba(0,0,0,0.2); }
        .app-window.dark .window-body { background: ${C.ink}; }
        .app-window.dark .window-title { color: ${C.grayLight}; }
        .mock-inner { padding: 0.5rem; }

        /* ── Floral Tablet Preview ── */
        .flp-tablet-wrapper { display: flex; justify-content: center; width: 100%; animation: flpTabletFloat 6s ease-in-out infinite; }
        .flp-tablet-scale { --s: 1; width: calc(400px * var(--s)); height: calc(560px * var(--s)); flex-shrink: 0; }
        .flp-tablet-scale-inner { width: 400px; height: 560px; transform: scale(var(--s)); transform-origin: top left; }
        .flp-tablet-frame { width: 400px; height: 560px; background: #0a0b0c; border-radius: 32px; padding: 12px; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.4),0 30px 60px -30px rgba(0,0,0,0.3),inset 0 0 0 2px rgba(255,255,255,0.05); position: relative; }
        .flp-tablet-frame::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 10; }
        .flp-tablet-screen { width: 100%; height: 100%; background: #0a0b0c; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Inter',sans-serif; user-select: none; }
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
        .flp-headline { font-family: 'Fraunces',serif; font-weight: 300; font-size: 32px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity .4s ease, transform .4s ease; }
        .flp-headline em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }
        .flp-wordmark { position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: flpFadeUp 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .flp-wordmark-name { font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: .04em; }
        .flp-wordmark-sub { font-size: 8px; font-weight: 500; letter-spacing: .28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px; }
        @keyframes flpFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes flpPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); } }
        @keyframes flpTabletFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        /* Responsive: keep the 400×560 design intact and scale it down proportionally */
        @media (max-width:500px) { .flp-tablet-scale { --s: 0.85; } }
        @media (max-width:380px) { .flp-tablet-scale { --s: 0.72; } }
        @media (max-width:330px) { .flp-tablet-scale { --s: 0.62; } }

        .mock-list-header { display: flex; justify-content: space-between; font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; color: ${C.gray}; padding-bottom: 0.5rem; border-bottom: 1px solid ${C.line}; margin-bottom: 0.5rem; }
        .mock-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${C.line}; font-size: 0.9rem; }
        .file-icon { width: 32px; height: 32px; background: ${C.bone2}; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .status-badge { font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .status-badge.verified { color: ${C.verdigris}; background: ${C.verdigrisTint}; }
        .status-badge.pending { color: ${C.brass}; background: rgba(139,115,85,0.1); }
        .status-badge.missing { color: ${C.accent}; background: rgba(199,123,94,0.1); }
        .status-badge.neutral { color: ${C.ink}; background: ${C.bone2}; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.bone}; font-family: 'Fraunces',serif; font-weight: 600; font-size: 0.9rem; }
        .action-btn { background: ${C.bone2}; border: 1px solid ${C.line}; border-radius: 6px; padding: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${C.ink}; transition: all 0.2s; }
        .action-btn:hover { background: ${C.ink}; color: ${C.bone}; }
        .pay-btn { background: ${C.verdigris}; color: ${C.bone}; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; }
        .slider-group { margin-bottom: 1.5rem; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.8rem; color: ${C.grayLight}; }
        .slider-value { font-family: 'JetBrains Mono',monospace; color: ${C.bone}; font-weight: 500; }
        .custom-range { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(250,248,244,0.2); outline: none; cursor: pointer; border-radius: 2px; }
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: ${C.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${C.ink}; }
        .custom-range::-moz-range-thumb { width: 16px; height: 16px; background: ${C.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${C.ink}; }
        .dispatch-footer { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid ${C.lineDark}; padding-top: 1.2rem; margin-top: 0.5rem; }
        .cost-value { font-size: 1.6rem; font-family: 'Fraunces',serif; color: ${C.bone}; font-weight: 600; }
        .map-visual { position: relative; height: 120px; background: rgba(250,248,244,0.04); border: 1px solid ${C.lineDark}; border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; overflow: hidden; }
        .map-visual::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px); background-size: 20px 20px; }
        .map-pin { width: 32px; height: 32px; border-radius: 50%; background: ${C.verdigris}; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .map-line { position: absolute; left: 32px; right: 32px; height: 2px; background: linear-gradient(90deg,${C.verdigris},${C.accent}); z-index: 1; }
        .map-truck { position: absolute; left: 40%; background: ${C.ink}; padding: 0.5rem; border-radius: 6px; border: 1px solid ${C.lineDark}; z-index: 3; animation: truckMove 3s infinite alternate ease-in-out; }
        .fleet-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${C.lineDark}; }
        .fleet-info { display: flex; align-items: center; gap: 0.8rem; }
        .fleet-icon { width: 36px; height: 36px; background: rgba(61,79,71,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .fleet-status { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .fleet-status.available { color: ${C.bone}; background: rgba(40,200,64,0.15); border: 1px solid rgba(40,200,64,0.3); }
        .fleet-status.dispatched { color: ${C.bone}; background: rgba(199,123,94,0.15); border: 1px solid rgba(199,123,94,0.3); }
        .fleet-status.maintenance { color: ${C.bone}; background: rgba(139,115,85,0.15); border: 1px solid rgba(139,115,85,0.3); }

        /* ── Sections ── */
        .section { padding: clamp(4rem,8vw,6rem) 0; }
        .showcase-mobile { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; margin-bottom: 7rem; }
        .about-section { background: ${C.bone}; padding: clamp(3rem,6vw,4rem) 0; border-top: 1px solid ${C.line}; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .lockin-section { position: relative; padding: clamp(5rem,10vw,7rem) 0; overflow: hidden; border-top: 1px solid ${C.line}; }
        .lockin-bg { position: absolute; inset: 0; background-image: url('/lockin.webp'); background-size: cover; background-position: center; background-attachment: fixed; }
        .lockin-section::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(12,12,12,0.78) 0%,rgba(21,23,26,0.86) 100%); }
        .lockin-content { position: relative; z-index: 1; max-width: 720px; }
        .lockin-title { font-size: clamp(2rem,5vw,2.8rem); font-weight: 700; color: ${C.bone}; margin-bottom: 1.25rem; line-height: 1.2; }
        .lockin-desc { font-size: 1.05rem; color: rgba(250,248,244,0.82); line-height: 1.8; margin-bottom: 1.25rem; }
        .lockin-sub { font-size: 1.08rem; font-family: 'Fraunces',serif; font-weight: 500; color: ${C.brassLight}; line-height: 1.7; margin-bottom: 2.5rem; }
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
        .module-card { flex: 1; width: 100%; display: flex; flex-direction: column; padding: 1.5rem; border: 1px solid ${C.line}; border-radius: 12px; background: ${C.bone}; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none; }
        .module-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--accent) 10%,transparent); }
        .module-card.dark { background: ${C.ink}; border-color: rgba(250,248,244,0.12); }
        .module-card.dark:hover { box-shadow: 0 8px 24px rgba(21,23,26,0.35); }
        .module-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .module-cat { display: flex; align-items: center; gap: 0.5rem; font-family: 'JetBrains Mono',monospace; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; }
        .module-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: module-pulse 2s ease-in-out infinite; }
        .module-ext { color: ${C.gray}; opacity: 0; transform: translate(-4px,4px); transition: all 0.3s ease; }
        .module-card:hover .module-ext { opacity: 1; transform: translate(0,0); color: var(--accent); }
        .module-title { font-size: 1.05rem; font-weight: 600; color: ${C.ink}; margin: 0 0 0.5rem; line-height: 1.35; font-family: 'Inter',sans-serif; }
        .module-excerpt { font-size: 0.85rem; color: ${C.gray}; line-height: 1.65; flex: 1; margin: 0; }
        .module-status { font-size: 0.75rem; color: ${C.gray}; font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; margin-top: 1rem; }
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
          .showcase-mobile .showcase-text { order: 2 !important; padding: 0 !important; }
          .showcase-mobile .showcase-visual { order: 1 !important; justify-content: center !important; }
          .insurance-content { max-width: 100%; }
          .modules-grid { grid-template-columns: 1fr; }
          .about-grid { grid-template-columns: 1fr; gap: 2rem; }
          .window-body { padding: 1.5rem; }
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
          .module-title { font-size: 1.25rem; }
          .module-excerpt { font-size: 1rem; }
        }
      `}</style>

      <main>
        {/* ── Navigation (new global header) ── */}
        <SiteNav />

        {/* ── Hero (new) ── */}
        <Hero />

        <Marquee items={marqueeItems} />

        <ModuleGridSection />

        {/* ── Features ── */}
        <section id="features" className="section">
          <div className="wrap">
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <div className="label" style={{ marginBottom: '1rem' }}>Features</div>
                <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', marginBottom: '1rem' }}>Everything you need to operate with dignity</h2>
                <p style={{ maxWidth: '600px', margin: '0 auto', color: C.gray }}>From case management to funeral insurance integration, Rest Point provides the tools funeral homes and welfare organizations need to serve families efficiently.</p>
              </div>
            </Reveal>
            <Showcase no="01" title="Case management that respects your workflow" desc="Track every detail from first call to final settlement. Rest Point keeps case files organized, documents verified, and families informed." reverse={false}>
              <AppWindow title="restpoint.app/cases"><MockDocuments /></AppWindow>
            </Showcase>
            <Showcase no="02" title="Family portal & online memorials" desc="Give families secure access to arrangements, documents, and billing. Light a candle, leave a condolence, and stay connected." reverse={true}>
              <AppWindow title="restpoint.app/portal"><MockPortal /></AppWindow>
            </Showcase>
            <Showcase no="03" title="Smart dispatch & billing" desc="Optimize hearse routes, calculate costs automatically, and bill with precision. Rest Point turns logistics into a competitive advantage." reverse={false}>
              <AppWindow title="restpoint.app/dispatch" dark><MockDispatch /></AppWindow>
            </Showcase>
            <Showcase no="04" title="Hearse management module" desc="Effective hearse management helps a funeral home provide reliable, professional, and respectful transportation services." reverse={true}>
              <AppWindow title="restpoint.app/fleet" dark><MockHearse /></AppWindow>
            </Showcase>
            <PremiumReporting />
            <Showcase no="06" title="Real-time Customer Support" desc="Clients can submit issues directly through the platform, while support agents receive, respond to, and resolve requests in real time. The system provides status tracking and communication history, so no question ever goes unanswered." reverse={true}>
              <AppWindow title="restpoint.app/support"><MockSupport /></AppWindow>
            </Showcase>
            <Showcase no="07" title="The Right Flowers. Right in Front of Them." reverse={false} desc={
              <>
                Families shouldn't have to search the internet for hours trying to figure out what flowers are right for the moment.
                <br /><br />
                Give them a tablet at the front desk. Show them a curated selection of arrangements.
                <br /><br />
                Once they choose, the booking appears instantly in the software. Your florist gets notified right away.
                <br /><br />
                They can even add custom details on the spot, like ribbon colors, specific flower preferences, or personalized messages.
                <br /><br />

              </>
            }>
              <FloralPreview />
            </Showcase>
          </div>
        </section>

        {/* ── Insurance ── */}
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

        {/* ── Hardware Requirement (replaces the old uptime/audit-trail infrastructure block) ── */}
        <HardwareRequirementSection />

        {/* ── Our Mission ── */}
        <MissionSection />

        {/* ── For Funeral Directors — the confirmation moment (live candle demo) ── */}
        <DirectorsMoment />

        {/* ── Modules ── */}
        <section id="modules" className="modules-section">
          <div className="wrap">
            <div className="modules-header">
              <Reveal>
                <div className="label" style={{ marginBottom: '1rem' }}>Modules</div>
                <h2>Powerful modules, built right in</h2>
              </Reveal>
            </div>
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

        <NewsroomSection />

        {/* ── FAQ ── */}
        <FaqSection />

        {/* ── Lock-in CTA ── */}
        <section className="lockin-section">
          <div className="lockin-bg" style={{ backgroundImage: "url('/lockin.webp')" }} />
          <div className="wrap lockin-content">
            <Reveal>
              <h2 className="lockin-title">Start using Rest Point.</h2>
              <p className="lockin-sub">Grief is heavy enough. Running the operations behind it shouldn't be.</p>
              <p className="lockin-desc">
                Imagine the modern flow of your home: A family walks in, and instead of drowning in carbon copy paper,
                they sign admission forms directly on an iPad. At the front desk, they browse real, high-resolution images
                of floral arrangements on a tablet, select the perfect tribute, and book it instantly no physical
                catalogs or messy ledgers required. Down the hall, body releases are processed seamlessly on the same screen.
              </p>
              <p className="lockin-desc">
                You step in to provide families with dignity and a seamless send off. Rest Point steps in to power how
                you do it.
              </p>
              <p className="lockin-desc">
                This is high end technology engineered specifically for the death care industry. We give you the
                infrastructure to digitize operations, eliminate the paperwork bottleneck, and deliver a flawless,
                premium experience from the front door to the final farewell.
              </p>
              <p className="lockin-sub">Your next case can run on one clear workflow. Start setting up Rest Point today.</p>
              <div className="lockin-grid">
                <div className="lockin-card">
                  <div className="lockin-card-icon"><Layers size={22} color="#4D9B7F" /></div>
                  <h3>One Platform.</h3>
                  <p>Case management, smart dispatch, family portals, and front desk tablet booking unified in one secure command center.</p>
                </div>
                <div className="lockin-card">
                  <div className="lockin-card-icon"><ShieldCheck size={22} color="#4D9B7F" /></div>
                  <h3>Protected Details.</h3>
                  <p>Every record, document, and digital signature. Paperless, accurate, encrypted, and fully auditable.</p>
                </div>
                <div className="lockin-card">
                  <div className="lockin-card-icon"><Zap size={22} color="#4D9B7F" /></div>
                  <h3>Move Faster.</h3>
                  <p>From intake to release, eliminate the manual admin and give your team their time back to focus on what actually matters: care.</p>
                </div>
              </div>
              <button className="btn btn-brass" onClick={goStart} style={{ marginTop: '2.5rem', padding: '0.9rem 2rem', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                Start your Rest Point setup <ArrowRight size={16} />
              </button>
              <p style={{ fontSize: '0.9rem', color: 'rgba(250,248,244,0.5)', marginTop: '1.5rem' }}>
                Bring your team, your cases, and your families into one place.
              </p>
            </Reveal>
          </div>
        </section>

        <Footer />
        <FloatingCTA />
        <DemoRequestPanel />
      </main>
    </>
  );
}
