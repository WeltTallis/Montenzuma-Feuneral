import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, ArrowRight, Check, Clock } from '../../utils/icons/icons';
import Footer from '../../components/layout/Footer';

const C = {
  ink: '#15171A', bone: '#FAF8F4', bone2: '#F3EFE6',
  brass: '#8B7355', brassLight: '#A98F6E',
  verdigris: '#3D4F47', verdigrisDark: '#2E3F37',
  line: '#E3DDD0', gray: '#6B6862',
};
const KRA_RED = '#C8102E';
const KRA_LOGO_URL = 'https://www.kra.go.ke/templates/kra/images/kra/logoKRA.webp';

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

const Reveal = ({ children, delay = 0 }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  );
};

export default function UpcomingIntegrations() {
  const navigate = useNavigate();
  const go = (to) => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(to); };
  const hideBrokenLogo = (e) => { e.currentTarget.style.display = 'none'; };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${C.gray};background:${C.bone}}
        h1,h2,h3{font-family:'Fraunces',serif;font-weight:500;color:${C.ink}}
        button{font-family:'Inter',sans-serif}
        .int-wrap{max-width:1080px;margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem)}
        .int-top{position:sticky;top:0;z-index:50;background:rgba(250,248,244,0.88);backdrop-filter:blur(12px);border-bottom:1px solid ${C.line}}
        .int-top-inner{display:flex;justify-content:space-between;align-items:center;height:68px}
        .int-brand{font-family:'Fraunces',serif;font-weight:600;font-size:1.15rem;color:${C.ink};letter-spacing:-0.01em}
        .int-back{display:inline-flex;align-items:center;gap:0.5rem;background:none;border:1px solid ${C.line};border-radius:50px;padding:0.55rem 1.2rem;font-size:0.85rem;font-weight:500;color:${C.ink};cursor:pointer;transition:all 0.3s ease}
        .int-back:hover{background:${C.ink};color:${C.bone};border-color:${C.ink}}
        .int-hero{padding:clamp(4rem,8vw,6.5rem) 0 clamp(2rem,4vw,3rem)}
        .int-chip{display:inline-flex;align-items:center;gap:0.5rem;font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:${C.brass};border:1px solid ${C.line};background:${C.bone2};border-radius:50px;padding:0.45rem 1rem;margin-bottom:1.6rem;font-weight:500}
        .int-hero h1{font-size:clamp(2.2rem,5.5vw,3.6rem);line-height:1.08;letter-spacing:-0.02em;max-width:780px}
        .int-hero-sub{margin-top:1.5rem;font-size:1.05rem;line-height:1.85;color:${C.gray};max-width:680px}
        .int-list{display:flex;flex-direction:column;gap:1.75rem;padding:1.5rem 0 clamp(3rem,6vw,4.5rem)}
        .int-card{position:relative;background:#FFFFFF;border:1px solid ${C.line};border-radius:18px;padding:clamp(1.8rem,4vw,3rem);overflow:hidden;transition:all 0.4s cubic-bezier(0.16,1,0.3,1)}
        .int-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ac)}
        .int-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px -12px rgba(21,23,26,0.14)}
        .int-card.dark{background:#000000;border-color:rgba(250,248,244,0.14)}
        .int-card.dark:hover{box-shadow:0 24px 56px -16px rgba(21,23,26,0.45)}
        .int-card.dark h2{color:${C.bone}}
        .int-card.dark .int-lead{color:rgba(250,248,244,0.76);opacity:1}
        .int-card.dark .int-feat{color:rgba(250,248,244,0.62)}
        .int-card.dark .int-meta{color:rgba(250,248,244,0.45)}
        .int-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;margin-bottom:1.3rem}
        .int-status{display:inline-flex;align-items:center;gap:0.5rem;font-family:'JetBrains Mono',monospace;font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;font-weight:500;color:var(--ac)}
        .int-dot{width:7px;height:7px;border-radius:50%;background:var(--ac);animation:int-pulse 2s ease-in-out infinite}
        @keyframes int-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
        .int-meta{display:inline-flex;align-items:center;gap:0.45rem;font-family:'JetBrains Mono',monospace;font-size:0.74rem;letter-spacing:0.05em;color:${C.gray}}
        .int-logo{height:42px;width:auto;object-fit:contain;padding:0.4rem 0.85rem;border:1px solid ${C.line};border-radius:10px;background:${C.bone}}
        .int-card.dark .int-logo{border-color:transparent;box-shadow:0 4px 14px rgba(0,0,0,0.5)}
        .int-card h2{font-size:clamp(1.5rem,3vw,2.1rem);line-height:1.2;margin-bottom:1rem}
        .int-lead{font-size:1rem;line-height:1.85;color:${C.ink};opacity:0.82;max-width:730px;margin-bottom:1.5rem}
        .int-feats{list-style:none;display:flex;flex-direction:column;gap:0.85rem}
        .int-feat{display:flex;gap:0.75rem;font-size:0.93rem;line-height:1.65;color:${C.gray};align-items:flex-start}
        .int-feat svg{flex-shrink:0;margin-top:3px}
        .int-note{margin-top:1.6rem;display:inline-flex;align-items:center;gap:0.55rem;font-family:'JetBrains Mono',monospace;font-size:0.72rem;letter-spacing:0.05em;color:var(--ac);background:color-mix(in srgb,var(--ac) 8%,transparent);border:1px solid color-mix(in srgb,var(--ac) 25%,transparent);border-radius:8px;padding:0.6rem 1rem}
        .int-card.dark .int-note{background:color-mix(in srgb,var(--ac) 15%,transparent);border-color:color-mix(in srgb,var(--ac) 38%,transparent)}
        .int-cta{background:linear-gradient(135deg,${C.ink} 0%,${C.verdigrisDark} 100%);border-radius:22px;padding:clamp(2.5rem,5vw,4rem) 2rem;text-align:center;border:1px solid rgba(250,248,244,0.08);margin-bottom:clamp(4rem,8vw,6rem)}
        .int-cta h2{color:${C.bone};font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin-bottom:1rem}
        .int-cta p{color:rgba(250,248,244,0.65);max-width:540px;margin:0 auto 2rem;line-height:1.8;font-size:1rem}
        .int-cta-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
        .int-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.95rem 2.2rem;border-radius:50px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);text-decoration:none}
        .int-btn-primary{background:${C.brassLight};color:${C.bone};border:1px solid ${C.brassLight}}
        .int-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(169,143,110,0.35)}
        .int-btn-ghost{background:transparent;color:${C.bone};border:1px solid rgba(250,248,244,0.3)}
        .int-btn-ghost:hover{background:rgba(250,248,244,0.1);border-color:${C.bone}}
        @media(max-width:640px){
          .int-cta-btns{flex-direction:column;width:100%}
          .int-btn{width:100%}
          .int-back span{display:none}
        }
      `}</style>
      <header className="int-top">
        <div className="int-wrap int-top-inner">
          <span className="int-brand">Rest Point</span>
          <button className="int-back" onClick={() => go('/')}><ArrowLeft size={16} /><span>Back to home</span></button>
        </div>
      </header>
      <main>
        <section className="int-hero">
          <div className="int-wrap">
            <Reveal>
              <span className="int-chip">Upcoming Integrations</span>
              <h1>Built into Rest Point.<br />Not bolted on afterwards.</h1>
              <p className="int-hero-sub">
                One platform for cases, payments and compliance  so you can retire the patchwork of
                external tools, including standalone accounting software. Here is everything currently
                on our integration roadmap, in detail.
              </p>
            </Reveal>
          </div>
        </section>

        <div className="int-wrap">
          <div className="int-list">

            <Reveal>
              <article className="int-card" style={{ '--ac': C.brass }}>
                <div className="int-card-head">
                  <span className="int-status"><span className="int-dot" />Coming Soon</span>
                  <span className="int-meta"><Clock size={14} />May 2026</span>
                </div>
                <h2>RestPay: Unified Payment Processing</h2>
                <p className="int-lead">
                  We're introducing RestPay, our upcoming payment module that will integrate card
                  payments alongside M-Pesa. Accept all major payment methods through a single,
                  seamless platform. More payment options, less friction for families.
                </p>
                <ul className="int-feats">
                  <li className="int-feat"><Check size={16} color={C.brass} />Accept Visa, Mastercard and Verve cards right next to M-Pesa in one checkout flow.</li>
                  <li className="int-feat"><Check size={16} color={C.brass} />One unified settlement dashboard — track every shilling across every payment method.</li>
                  <li className="int-feat"><Check size={16} color={C.brass} />Automatic receipting: each payment attaches instantly to the correct case and invoice.</li>
                  <li className="int-feat"><Check size={16} color={C.brass} />Built-in reconciliation with exportable reports for your finance team.</li>
                  <li className="int-feat"><Check size={16} color={C.brass} />Embedded family-portal checkout — no redirects, no third-party gateway setup.</li>
                </ul>
                <span className="int-note">Ships as part of Rest Point — zero additional subscriptions.</span>
              </article>
            </Reveal>

            <Reveal>
              <article className="int-card dark" style={{ '--ac': KRA_RED }}>
                <div className="int-card-head">
                  <span className="int-status"><span className="int-dot" />Integration</span>
                  <img src={KRA_LOGO_URL} alt="Kenya Revenue Authority (KRA) logo" className="int-logo" onError={hideBrokenLogo} />
                </div>
                <h2>KRA eTIMS Integration</h2>
                <p className="int-lead">
                  We're adding eTIMS to eliminate the need for external accounting software.
                  Tax compliance stops being a separate chore and becomes a silent by-product of
                  running your day to day operations inside Rest Point.
                </p>
                <ul className="int-feats">
                  <li className="int-feat"><Check size={16} color={KRA_RED} />Generate KRA compliant electronic tax invoices automatically at the point of payment.</li>
                  <li className="int-feat"><Check size={16} color={KRA_RED} />Sync directly with the Kenya Revenue Authority eTIMS  no exports, no re keying, no separate portal.</li>
                  <li className="int-feat"><Check size={16} color={KRA_RED} />Every invoice and receipt is stored audit-ready against its case, forever retrievable.</li>
                  <li className="int-feat"><Check size={16} color={KRA_RED} />Works hand in hand with RestPay: a family pays once and the compliance paperwork is done.</li>
                  <li className="int-feat"><Check size={16} color={KRA_RED} />Retire the cost and complexity of maintaining standalone accounting packages entirely.</li>
                </ul>
                <span className="int-note">One less external tool on your bill  compliance built in.</span>
              </article>
            </Reveal>

            <Reveal>
              <article className="int-card" style={{ '--ac': C.verdigris }}>
                <div className="int-card-head">
                  <span className="int-status"><span className="int-dot" />Coming Soon</span>
                  <span className="int-meta"><Clock size={14} />May 2026</span>
                </div>
                <h2>M-Pesa Payments</h2>
                <p className="int-lead">
                  Families will soon be able to pay directly through the portal via M Pesa,
                  bringing contributions and case payments into the same flow as everything else.
                </p>
                <ul className="int-feats">
                  <li className="int-feat"><Check size={16} color={C.verdigris} />Secure STK push payments straight from the family portal.</li>
                  <li className="int-feat"><Check size={16} color={C.verdigris} />Instant confirmation updates the case ledger in real time.</li>
                  <li className="int-feat"><Check size={16} color={C.verdigris} />Frees reception teams from manually tracking and matching payments.</li>
                </ul>
              </article>
            </Reveal>

          </div>
        </div>

        <div className="int-wrap">
          <Reveal>
            <div className="int-cta">
              <h2>Be first in line when they ship.</h2>
              <p>Join 500+ organizations already using Rest Point, and get notified the moment each integration goes live.</p>
              <div className="int-cta-btns">
                <button className="int-btn int-btn-primary" onClick={() => go('/register')}>Request access <ArrowRight size={16} /></button>
                <button className="int-btn int-btn-ghost" onClick={() => go('/')}>Back to Newsroom</button>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  );
}