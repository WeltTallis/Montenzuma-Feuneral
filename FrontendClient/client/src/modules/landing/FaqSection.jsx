import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, ArrowRight } from '../../utils/icons/icons';
import C from '../../utils/colors/index';

/* ═══════════════════════════════════════
   FAQ — FREQUENTLY ASKED QUESTIONS
   Editorial Light Theme Redesign
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
    accent: '#C26B5A', // Terracotta
    items: [
      {
        q: 'How does the tablet portal elevate the front desk experience?',
        a: `Instead of tethering your reception staff to a desktop computer, our portal runs seamlessly on sleek iPads or high-end tablets. Your front desk becomes mobile and graceful. Staff can greet families at the door, walk them to a comfortable seating area, and manage check-ins, floral bookings, and coordination directly from the tablet. It feels less like a transaction and more like a high-end concierge service.`,
      },
    ],
  },
  {
    tag: 'Digital Intake & Release',
    accent: '#5A7A6B', // Sage Green
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
    accent: '#5E7C9A', // Slate Blue
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
    accent: '#A3875A', // Antique Brass
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
        /* Import premium fonts */
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

        html { scroll-behavior: smooth; }

        .faq-section {
          background-color: #F9F7F4; /* Warm alabaster */
          color: #1A1A1A;
          padding: 5rem 1.5rem;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          border-top: 1px solid #E8E2D8;
        }

        .faq-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 5rem;
          position: relative;
        }

        /* Left Sidebar */
        .faq-sidebar { 
          position: sticky; 
          top: 3rem; 
          align-self: start; 
        }

        .faq-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #A3875A; /* Brass */
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .faq-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 2px;
          background: #A3875A;
        }

        .faq-title {
          font-family: 'Fraunces', serif;
          font-size: 3rem;
          font-weight: 600;
          line-height: 1.1;
          margin: 0 0 1.5rem;
          color: #1A1A1A;
        }

        .faq-title span {
          font-style: italic;
          font-weight: 400;
          color: #5A7A6B; /* Sage */
        }

        .faq-lead {
          font-size: 1rem;
          line-height: 1.7;
          color: #5C5C5C;
          margin: 0 0 2.5rem;
          max-width: 320px;
        }

        .faq-nav { 
          display: flex; 
          flex-direction: column; 
          gap: 0.5rem; 
          margin-bottom: 3rem; 
        }

        .faq-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          color: #5C5C5C;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .faq-nav-item:hover { 
          background: #FFFFFF; 
          border-color: #E8E2D8; 
          color: #1A1A1A; 
        }

        .faq-nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--faq-accent);
        }

        /* Dark Contact Card */
        .faq-support {
          background: #1A1A1A;
          color: #FFFFFF;
          padding: 2rem;
          border-radius: 12px;
        }

        .faq-support-icon {
          margin-bottom: 1rem;
          opacity: 0.8;
          display: inline-block;
        }

        .faq-support-title { 
          font-family: 'Fraunces', serif; 
          font-size: 1.25rem; 
          margin: 0 0 0.5rem; 
        }

        .faq-support-desc { 
          font-size: 0.875rem; 
          line-height: 1.6; 
          color: rgba(255,255,255,0.7); 
          margin: 0 0 1.5rem; 
        }

        .faq-support-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #FFFFFF;
          color: #1A1A1A;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .faq-support-btn:hover { 
          transform: translateY(-2px); 
        }

        /* Right Content - Accordions */
        .faq-list { 
          display: flex; 
          flex-direction: column; 
          gap: 3.5rem; 
        }

        .faq-cat { 
          scroll-margin-top: 2rem; 
        }

        .faq-cat-head { 
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          margin: 0 0 1.5rem; 
          border-bottom: 1px solid #E8E2D8; 
          padding-bottom: 1rem; 
        }

        .faq-cat-line {
          width: 16px;
          height: 3px;
          background: var(--faq-accent);
          border-radius: 2px;
        }

        .faq-cat-title {
          margin: 0;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #1A1A1A;
        }

        .faq-items { 
          display: flex; 
          flex-direction: column; 
        }

        .faq-item {
          border-bottom: 1px solid #E8E2D8;
          transition: border-color 0.3s ease;
        }

        .faq-item.open {
          border-bottom: 1px solid #1A1A1A;
        }

        .faq-q {
          width: 100%;
          background: none;
          border: none;
          padding: 1.5rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          text-align: left;
          cursor: pointer;
          font-family: 'Fraunces', serif;
          font-size: 1.35rem;
          font-weight: 400;
          color: #1A1A1A;
          transition: color 0.2s ease;
        }

        .faq-q:hover {
          color: var(--faq-accent);
        }

        .faq-q-text { flex: 1; }

        /* Minimalist plus/minus icon */
        .faq-q-icon {
          position: relative;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .faq-q-icon::before, .faq-q-icon::after {
          content: '';
          position: absolute;
          background: #1A1A1A;
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .faq-q-icon::before {
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
        }

        .faq-q-icon::after {
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          transform: translateX(-50%);
        }

        .faq-item.open .faq-q-icon::after {
          transform: translateX(-50%) scaleY(0);
        }

        .faq-item.open .faq-q-icon::before {
          background: var(--faq-accent);
        }

        .faq-answer { 
          display: grid; 
          grid-template-rows: 0fr; 
          transition: grid-template-rows 0.35s ease; 
        }

        .faq-item.open .faq-answer { 
          grid-template-rows: 1fr; 
        }

        .faq-answer-inner { 
          overflow: hidden; 
        }

        .faq-a-text {
          margin: 0;
          padding: 0 3rem 1.5rem 0;
          font-size: 1rem;
          line-height: 1.8;
          color: #5C5C5C;
                    max-width: 700px;
        }

        /* Mobile hero hidden on desktop */
        .faq-mobile-hero { display: none; }

        /* Responsive */
        @media(max-width: 900px) {
          .faq-section { padding: 3rem 1rem; }
          .faq-container { grid-template-columns: 1fr; gap: 3rem; }
          .faq-sidebar { position: static; }
          .faq-nav { flex-direction: row; flex-wrap: wrap; gap: 0.5rem; }
          .faq-nav-item { border: 1px solid #E8E2D8; background: #FFFFFF; }
          .faq-q { font-size: 1.1rem; gap: 1rem; }
          .faq-a-text { padding-right: 0; }
          .faq-mobile-hero { display: block; margin-bottom: 1.5rem; }
          .faq-q-hero { font-size: 1.15rem; font-weight: 600; }
          .faq-answer { margin-top: 0.5rem; }
        }
      `}</style>

      <section id="faq" className="faq-section">
        <div className="faq-container">

          {/* Left Sidebar */}
          <Reveal className="faq-sidebar">
            <div className="faq-eyebrow">Support Center</div>
            <h2 className="faq-title">
              Frequently Asked <span>Questions</span>
            </h2>
            <p className="faq-lead">
              Everything front-desk teams and funeral directors ask before bringing the premium
              tablet portal experience to their funeral home.
            </p>

            {/* Mobile: show first quiz prominently before the rest */}
            <div className="faq-mobile-hero">
              {FAQ_CATEGORIES[0]?.items[0] && (() => {
                const firstQ = FAQ_CATEGORIES[0].items[0];
                                return (
                  <div className="faq-item open">
                    <button
                      type="button"
                      className="faq-q faq-q-hero"
                      onClick={() => toggle('0-0')}
                      aria-expanded={open === '0-0'}
                    >
                      <span className="faq-q-text">{firstQ.q}</span>
                      <span className="faq-q-icon"></span>
                    </button>
                    <div className="faq-answer" role="region">
                      <div className="faq-answer-inner">
                        <p className="faq-a-text">{firstQ.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <nav className="faq-nav" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((g, i) => (
                <a
                  key={i}
                  href={`#faq-cat-${i}`}
                  className="faq-nav-item"
                  style={{ '--faq-accent': g.accent }}
                >
                  <span className="faq-nav-dot" style={{ background: g.accent }}></span>
                  <span>{g.tag}</span>
                </a>
              ))}
            </nav>

            <div className="faq-support">
              <div className="faq-support-icon">
                <LifeBuoy size={24} color="#FFFFFF" />
              </div>
              <h4 className="faq-support-title">Still have a question?</h4>
              <p className="faq-support-desc">
                Our team is one message away and happy to walk you through a live demo on your own tablets.
              </p>
              <button
                className="faq-support-btn"
                type="button"
                onClick={() => navigate('/contact')}
              >
                Talk to our team <ArrowRight size={14} />
              </button>
            </div>
          </Reveal>

          {/* Right Content */}
          <div className="faq-list">
            {FAQ_CATEGORIES.map((g, ci) => {
              const catId = `faq-cat-${ci}`;
              return (
                <div
                  key={ci}
                  id={catId}
                  className="faq-cat"
                  style={{ '--faq-accent': g.accent }}
                >
                  <div className="faq-cat-head">
                    <span className="faq-cat-line"></span>
                    <h3 className="faq-cat-title">{g.tag}</h3>
                  </div>
                  <div className="faq-items">
                    {g.items.map((it, ii) => {
                      const id = `${ci}-${ii}`;
                      const isOpen = open === id;
                      return (
                        <div key={id} className={`faq-item${isOpen ? ' open' : ''}`}>
                          <button
                            type="button"
                            className="faq-q"
                            onClick={() => toggle(id)}
                            aria-expanded={isOpen}
                            aria-controls={`faq-a-${id}`}
                          >
                            <span className="faq-q-text">{it.q}</span>
                            <span className="faq-q-icon"></span>
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
      </section>
    </>
  );
};

export default FaqSection;