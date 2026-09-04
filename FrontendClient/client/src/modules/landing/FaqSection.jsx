import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, ArrowRight } from '../../utils/icons/icons';
import C from '../../utils/colors/index';

/* ═══════════════════════════════════════
   FAQ — FREQUENTLY ASKED QUESTIONS
   Self-contained accordion section for the
   premium tablet portal experience.
   ═══════════════════════════════════════ */

const useReveal = () => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
};

const Reveal = ({ children, className = '', style = {}, delay = 0 }) => {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const FAQ_CATEGORIES = [
  {
    tag: 'The Premium Tablet Portal Experience',
    accent: '#A98F6E',
    glow: 'rgba(169,143,110,0.35)',
    items: [
      {
        q: 'How does the tablet portal elevate the front desk experience?',
        a: `Instead of tethering your reception staff to a desktop computer, our portal runs seamlessly on sleek iPads or high-end tablets. Your front desk becomes mobile and graceful. Staff can greet families at the door, walk them to a comfortable seating area, and manage check-ins, floral bookings, and coordination directly from the tablet. It feels less like a transaction and more like a high-end concierge service.`,
      },
    ],
  },
  {
    tag: 'Digital Intake & Release',
    accent: '#4D9B7F',
    glow: 'rgba(77,155,127,0.35)',
    items: [
      {
        q: 'How does the digital intake process work for families?',
        a: `We've replaced stressful clipboards and intrusive kiosks with a dignified, guided tablet experience. When a family arrives, they are handed an iPad or directed to a private tablet station. The portal walks them through the deceased intake process with a respectful, calming user interface. The data automatically and securely routes to the director's dashboard, eliminating manual data entry.`,
      },
      {
        q: 'What about the release process? Can that be handled digitally too?',
        a: `Absolutely. The digital release module allows authorized individuals (family members, crematories, or cemeteries) to securely sign digital release forms directly on the tablet. The system captures their digital signature, timestamps the release, and instantly updates the deceased's file, ensuring a fully compliant, paperless chain of custody without needing a physical front-desk terminal.`,
      },
    ],
  },
  {
    tag: 'Cloud Infrastructure & 24/7 Uptime',
    accent: '#6FA8C9',
    glow: 'rgba(111,168,201,0.35)',
    items: [
      {
        q: 'Is the portal cloud-based, and what happens if our funeral home loses internet connection?',
        a: `Yes, our software is 100% cloud-based, meaning your data is stored securely off-site and can be accessed from any authorized iPad or tablet, anywhere. We utilize advanced local caching, meaning if your internet briefly drops, your tablets can still view critical data and continue intake; it will simply sync to the cloud the moment the connection is restored.`,
      },
      {
        q: 'Can we really guarantee 24/7 uptime with zero downtime?',
        a: `Yes. We pride ourselves on a 24/7/365 Uptime Guarantee. Our infrastructure utilizes multi-server redundancy and automatic failover protocols. If one server experiences an issue, another instantly takes over. This means zero downtime for your funeral home, ensuring your portals are always ready to serve families, day or night.`,
      },
    ],
  },
  {
    tag: 'Security & Compliance',
    accent: '#C77B5E',
    glow: 'rgba(199,123,94,0.35)',
    items: [
      {
        q: 'How do you ensure the highest standards of security for sensitive data on a tablet?',
        a: `We employ enterprise-grade security protocols. All data is encrypted both in transit (using 256-bit SSL) and at rest. We are fully compliant with industry privacy standards. Furthermore, our system uses role-based access control, meaning staff only see the data necessary for their specific role.`,
      },
      {
        q: `Could a family using a tablet accidentally see another family's data?`,
        a: `Never. The Family Portal operates in a highly secure, locked "Guided Access" mode. A family member can only see their own intake or release forms. Once a transaction is complete or the screen times out, it automatically wipes the session and returns to the elegant welcoming screen (like the candle-lighting screen), protecting all previous data.`,
      },
    ],
  },
];

const FaqSection = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState('0-0');

  const toggle = (id) => setOpen((cur) => (cur === id ? null : id));

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }

        .faq-section {
          position: relative;
          padding: clamp(5rem,10vw,7rem) 0;
          background: ${C.ink};
          color: ${C.bone};
          overflow: hidden;
          border-top: 1px solid ${C.lineDark};
        }
        .faq-section::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(900px 480px at 8% 0%, rgba(139,115,85,0.12) 0%, transparent 60%),
            radial-gradient(900px 520px at 92% 100%, rgba(77,155,127,0.10) 0%, transparent 60%),
            radial-gradient(600px 360px at 80% 12%, rgba(199,123,94,0.07) 0%, transparent 55%);
        }
        .faq-grid {
          display: grid;
          grid-template-columns: minmax(280px, 380px) 1fr;
          gap: clamp(2.5rem,6vw,5.5rem);
          position: relative;
          z-index: 1;
        }
        .faq-intro { position: sticky; top: 2rem; align-self: start; }
        .faq-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${C.brassLight};
          margin-bottom: 1.4rem;
        }
        .faq-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${C.accent};
          box-shadow: 0 0 0 4px rgba(199,123,94,0.18), 0 0 14px rgba(199,123,94,0.5);
        }
        .faq-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: clamp(2.4rem,5vw,3.9rem);
          line-height: 1.06;
          letter-spacing: -0.02em;
          margin: 0 0 1.2rem;
        }
        .faq-title-accent {
          font-style: italic;
          background: linear-gradient(135deg, ${C.bone} 0%, ${C.brassLight} 55%, ${C.verdigris} 110%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .faq-lead {
          font-size: 1.02rem;
          line-height: 1.8;
          color: rgba(250,248,244,0.55);
          margin: 0 0 2rem;
          max-width: 360px;
        }

        .faq-nav { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 2.4rem; }
        .faq-nav-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.6rem 0.7rem;
          border-radius: 10px;
          color: rgba(250,248,244,0.5);
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          line-height: 1.4;
          border: 1px solid transparent;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .faq-nav-item:hover { color: ${C.bone}; background: rgba(250,248,244,0.045); border-color: rgba(250,248,244,0.08); }
        .faq-nav-num { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--faq-accent); opacity: 0.9; flex-shrink: 0; }

        .faq-support {
          margin-top: 0.4rem;
          padding: 1.5rem;
          border: 1px solid rgba(250,248,244,0.1);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(250,248,244,0.05) 0%, rgba(250,248,244,0.02) 100%);
          position: relative;
          overflow: hidden;
        }
        .faq-support::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, ${C.brassLight} 50%, transparent 100%);
          opacity: 0.7;
        }
        .faq-support-title { font-family: 'Fraunces', serif; font-size: 1.1rem; font-weight: 500; margin: 0.7rem 0 0.4rem; color: ${C.bone}; }
        .faq-support-desc { font-size: 0.86rem; line-height: 1.7; color: rgba(250,248,244,0.45); margin: 0 0 1.2rem; }
        .faq-support-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: ${C.bone};
          border: 1.5px solid rgba(250,248,244,0.22);
          padding: 0.7rem 1.5rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .faq-support-btn:hover { background: ${C.bone}; color: ${C.ink}; border-color: ${C.bone}; transform: translateY(-1px); }

        .faq-list { display: flex; flex-direction: column; gap: 2.6rem; }
        .faq-cat { scroll-margin-top: 5rem; }
        .faq-cat-head { display: flex; align-items: baseline; gap: 1rem; margin: 0 0 1.1rem 0.3rem; }
        .faq-cat-num { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--faq-accent); letter-spacing: 0.08em; line-height: 1; }
        .faq-cat-title {
          margin: 0;
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(250,248,244,0.85);
        }

        .faq-items { display: flex; flex-direction: column; gap: 0.6rem; }
        .faq-item {
          border: 1px solid rgba(250,248,244,0.08);
          border-radius: 14px;
          background: rgba(250,248,244,0.028);
          overflow: hidden;
          transition: border-color 0.4s ease, background 0.4s ease, box-shadow 0.4s ease;
        }
        .faq-item:hover { border-color: rgba(250,248,244,0.16); }
        .faq-item.open {
          border-color: var(--faq-accent);
          background: rgba(250,248,244,0.045);
          box-shadow: 0 18px 44px -18px var(--faq-glow), 0 0 0 1px var(--faq-glow);
        }
        .faq-q {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          text-align: left;
          background: none;
          border: none;
          padding: 1.1rem 1.2rem;
          cursor: pointer;
          color: ${C.bone};
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5;
        }
        .faq-q-text { flex: 1; }
        .faq-q-icon {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(250,248,244,0.18);
          color: rgba(250,248,244,0.60);
          transition: all 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .faq-q-icon svg { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1); }
        .faq-item.open .faq-q-icon { background: var(--faq-accent); border-color: var(--faq-accent); color: ${C.ink}; }
        .faq-item.open .faq-q-icon svg { transform: rotate(135deg); }
        .faq-answer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s cubic-bezier(0.16,1,0.3,1); }
        .faq-item.open .faq-answer { grid-template-rows: 1fr; }
        .faq-answer-inner { overflow: hidden; }
        .faq-a-text {
          margin: 0;
          padding: 1rem 1.2rem 1.3rem;
          font-size: 0.94rem;
          line-height: 1.85;
          color: rgba(250,248,244,0.62);
          border-top: 1px solid rgba(250,248,244,0.07);
        }

        @media(max-width:768px) {
          .faq-grid { grid-template-columns: 1fr; }
          .faq-intro { position: static; }
          .faq-nav { flex-direction: row; flex-wrap: wrap; gap: 0.5rem; }
          .faq-nav-item { border: 1px solid rgba(250,248,244,0.1); padding: 0.5rem 0.9rem; }
          .faq-support { max-width: 420px; }
        }
      `}</style>
      <section id="faq" className="faq-section">
        <div className="wrap">
          <div className="faq-grid">
            <Reveal className="faq-intro" style={{ position: 'relative', zIndex: 2 }}>
              <div className="faq-eyebrow">
                <span className="faq-eyebrow-dot" /> Questions &amp; Answers
              </div>
              <h2 className="faq-title">
                Frequently Asked <span className="faq-title-accent">Questions</span>
              </h2>
              <p className="faq-lead">
                Everything front-desk teams and funeral directors ask before bringing the premium
                tablet portal experience to their funeral home.
              </p>

              <nav className="faq-nav" aria-label="FAQ categories">
                {FAQ_CATEGORIES.map((g, i) => (
                  <a key={i} href={`#faq-cat-${i}`} className="faq-nav-item" style={{ '--faq-accent': g.accent }}>
                    <span className="faq-nav-num">0{i + 1}</span>
                    <span className="faq-nav-label">{g.tag}</span>
                  </a>
                ))}
              </nav>

              <div className="faq-support">
                <LifeBuoy size={18} color="#C77B5E" />
                <h4 className="faq-support-title">Still have a question?</h4>
                <p className="faq-support-desc">
                  Our team is one message away and happy to walk you through a live demo on your own tablets.
                </p>
                <button className="faq-support-btn" type="button" onClick={() => navigate('/contact')}>
                  Talk to our team <ArrowRight size={14} />
                </button>
              </div>
            </Reveal>

            <div className="faq-list">
              {FAQ_CATEGORIES.map((g, ci) => {
                const catId = `faq-cat-${ci}`;
                return (
                  <div
                    key={ci}
                    id={catId}
                    className="faq-cat"
                    style={{ '--faq-accent': g.accent, '--faq-glow': g.glow }}
                  >
                    <div className="faq-cat-head">
                      <span className="faq-cat-num">0{ci + 1}</span>
                      <h3 className="faq-cat-title">{g.tag}</h3>
                    </div>
                    <div className="faq-items">
                      {g.items.map((it, ii) => {
                        const id = `${ci}-${ii}`;
                        const isOpen = open === id;
                        return (
                          <div key={id} className={`faq-item${isOpen ? ' open' : ''}`} style={{ '--faq-accent': g.accent, '--faq-glow': g.glow }}>
                            <button
                              type="button"
                              className="faq-q"
                              onClick={() => toggle(id)}
                              aria-expanded={isOpen}
                              aria-controls={`faq-a-${id}`}
                            >
                              <span className="faq-q-text">{it.q}</span>
                              <span className="faq-q-icon">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </span>
                            </button>
                            <div id={`faq-a-${id}`} className="faq-answer" role="region">
                              <div className="faq-answer-inner">
                                <p className="faq-a-text">{it.a}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FaqSection;