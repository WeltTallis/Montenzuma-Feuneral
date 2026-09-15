import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import C from '../../utils/colors/index';
import { ArrowRight, Bolt, Feather, Infinity, ShieldCheck } from '../../utils/icons/icons';

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

const Reveal = ({ children, delay = 0, style = {}, className = '' }) => {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
};

export default function PremiumReporting() {
  const navigate = useNavigate();
  const sceneRef = useRef(null);
  const docRef = useRef(null);

  const goStart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/register');
  };

  // 3D tilt on mouse move
  useEffect(() => {
    const scene = sceneRef.current;
    const doc = docRef.current;
    if (!scene || !doc) return;

    const handleMove = (e) => {
      const rect = scene.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;
      doc.style.transform = `rotateY(${-12 + percentX * 8}deg) rotateX(${4 - percentY * 8}deg)`;
      doc.style.animation = 'none';
    };

    const handleLeave = () => {
      doc.style.transform = '';
      doc.style.animation = '';
    };

    scene.addEventListener('mousemove', handleMove);
    scene.addEventListener('mouseleave', handleLeave);
    return () => {
      scene.removeEventListener('mousemove', handleMove);
      scene.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <section style={{ position: 'relative', padding: 'clamp(4rem, 8vw, 7rem) 0', overflow: 'hidden', background: '#000000' }}>
      {/* Atmospheric Glows */}
      <div style={{
        position: 'absolute', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none',
        top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'rgba(61, 79, 71, 0.3)',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none',
        bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'rgba(169, 143, 110, 0.15)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>

        {/* Top Attention Grabber */}
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1.25rem', borderRadius: '9999px', marginBottom: '2rem',
            }}>
              <span style={{
                width: '8px', height: '8px', background: '#ffffff', borderRadius: '50%', display: 'inline-block',
                animation: 'prPulse 2s infinite',
              }} />
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', color: '#f5f5f5', textTransform: 'uppercase',
              }}>Premium document workspace</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 300, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em', color: '#ffffff',
            }}>
              Every document, beautifully handled.<br />
              <span style={{
                fontStyle: 'italic', fontWeight: 500,
                color: '#ffffff',
              }}>From scan to export.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p style={{
              fontSize: '1.1rem', color: '#bdbdbd', maxWidth: '720px', margin: '0 auto', fontWeight: 300, lineHeight: 1.7,
            }}>
              Scan or upload documents, keep every record in the right case, view files in a polished document workspace, and export structured data to Excel when your team needs it.
            </p>
          </Reveal>
        </div>

        {/* Main Split Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '5rem', alignItems: 'center',
        }}>

          {/* Left: 3D Visual Mockup */}
          <Reveal delay={200}>
            <div ref={sceneRef} style={{
              perspective: '1500px', perspectiveOrigin: '50% 50%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '600px',
            }}>
              {/* Main PDF Mockup */}
              <div ref={docRef} style={{
                transform: 'rotateY(-12deg) rotateX(4deg) translateZ(0)',
                transition: 'transform 0.1s ease-out',
                animation: 'prFloat 6s ease-in-out infinite',
                boxShadow: '0 50px 100px rgba(0,0,0,0.5), 0 30px 60px rgba(61,79,71,0.2), 0 0 0 1px rgba(169,143,110,0.2)',
                background: 'white', width: '320px', height: '420px', borderRadius: '8px', padding: '24px', position: 'relative',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  paddingBottom: '12px', borderBottom: '2px solid #1A1A1A', marginBottom: '16px',
                }}>
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>Sterling & Hayes</h3>
                    <p style={{ fontSize: '6px', color: '#6B6862', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>Official Postmortem Record</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      width: '48px', height: '16px', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
                    }}>
                      <div style={{
                        width: '32px', height: '8px', background: 'white',
                        clipPath: 'polygon(0% 0%, 20% 0%, 30% 50%, 20% 100%, 0% 100%, 10% 50%)',
                      }} />
                    </div>
                    <p style={{ fontSize: '6px', color: '#0f33e7', fontWeight: 700 }}>BLS-2024-0843</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '6px', color: '#6B4045', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Decedent</p>
                    <div style={{ height: '6px', width: '75%', background: '#E2DDD3', borderRadius: '4px', marginTop: '4px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '6px', color: '#6B4045', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>D.O.B</p>
                      <div style={{ height: '6px', width: '50%', background: '#E2DDD3', borderRadius: '4px', marginTop: '4px' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '6px', color: '#6B4045', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Examiner</p>
                      <div style={{ height: '6px', width: '66%', background: '#E2DDD3', borderRadius: '4px', marginTop: '4px' }} />
                    </div>
                  </div>
                  <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '4px', width: '100%', background: '#E2DDD3', borderRadius: '4px' }} />
                    <div style={{ height: '4px', width: '83%', background: '#E2DDD3', borderRadius: '4px' }} />
                    <div style={{ height: '4px', width: '66%', background: '#E2DDD3', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Mock Section Header */}
                <div style={{
                  position: 'absolute', top: '128px', left: '24px', right: '24px',
                  background: '#1A1A1A', padding: '4px 8px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ color: '#A98F6E', fontSize: '6px', fontWeight: 700 }}>02</span>
                  <div style={{ height: '4px', width: '80px', background: '#FAF8F4', opacity: 0.5, borderRadius: '4px' }} />
                </div>

                {/* Footer Bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: '#3D4F47', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
                }}>
                  <div style={{ height: '4px', width: '40px', background: '#FAF8F4', opacity: 0.6, borderRadius: '4px' }} />
                  <div style={{ height: '4px', width: '40px', background: '#FAF8F4', opacity: 0.6, borderRadius: '4px' }} />
                </div>
              </div>

              {/* Floating Excel Export Badge */}
              <div style={{
                animation: 'prFloatReverse 5s ease-in-out infinite',
                boxShadow: '0 20px 40px rgba(16, 124, 65, 0.3)',
                position: 'absolute', bottom: '40px', left: 0,
                background: '#141414', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16,124,65,0.5)',
                display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  width: '48px', height: '48px', background: '#107C41', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M21.17 3H7.83A1.83 1.83 0 006 4.83v14.34A1.83 1.83 0 007.83 21h13.34A1.83 1.83 0 0023 19.17V4.83A1.83 1.83 0 0021.17 3zM12 17h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#107C41', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exported</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#107C41"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>Audit_Export.xlsx</p>
                  <div style={{
                    marginTop: '8px', width: '128px', height: '4px', background: '#333', borderRadius: '9999px', overflow: 'hidden',
                  }}>
                    <div style={{ width: '100%', height: '100%', background: '#107C41' }} />
                  </div>
                </div>
              </div>

              {/* Floating Automation Spark */}
              <div style={{
                position: 'absolute', top: '40px', right: '20px',
                background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(169,143,110,0.3)',
                padding: '8px 16px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Bolt size={12} color="#A98F6E" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>1-Click Gen</span>
              </div>
            </div>
          </Reveal>

          {/* Right: Selling Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Point 1 */}
            <Reveal delay={300}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{
                  flexShrink: 0, width: '56px', height: '56px', border: '1px solid rgba(169,143,110,0.3)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A98F6E',
                }}>
                  <Feather size={20} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: 'white', marginBottom: '8px', fontWeight: 500,
                  }}>Scan and upload with confidence</h3>
                  <p style={{ color: '#8A8A8A', lineHeight: 1.8, fontSize: '1rem' }}>
                    Capture documents from a scanner or upload them directly. Rest Point keeps admissions, releases, signatures, and supporting records together with the right case, so nothing gets misplaced.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Point 2 */}
            <Reveal delay={400}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{
                  flexShrink: 0, width: '56px', height: '56px', border: '1px solid rgba(16,124,65,0.3)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#107C41',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V7h4v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: 'white', marginBottom: '8px', fontWeight: 500,
                  }}>A high-end document view</h3>
                  <p style={{ color: '#8A8A8A', lineHeight: 1.8, fontSize: '1rem' }}>
                    Review important records in a clear, refined workspace built for professional funeral homes. Open, organise, share, and revisit documents without digging through folders or paper files.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Point 3 */}
            <Reveal delay={500}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{
                  flexShrink: 0, width: '56px', height: '56px', border: '1px solid rgba(61,79,71,0.5)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D4F47',
                }}>
                  <Infinity size={20} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'Fraunces', serif", fontSize: '1.5rem', color: 'white', marginBottom: '8px', fontWeight: 500,
                  }}>Export the data you need</h3>
                  <p style={{ color: '#8A8A8A', lineHeight: 1.8, fontSize: '1rem' }}>
                    Turn your operational records into structured Excel exports for reporting, audits, reconciliation, and day-to-day planning. The information stays organised and ready when your team needs it.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal delay={600}>
              <div style={{ paddingTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
                <button onClick={goStart} className="btn-premium" style={{
                  background: 'linear-gradient(135deg, #A98F6E 0%, #C8B292 100%)',
                  color: '#1A1A1A', padding: '16px 32px', borderRadius: '6px', fontWeight: 700,
                  letterSpacing: '0.1em', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px',
                  textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(169,143,110,0.3)', transition: 'all 0.3s ease',
                }}>
                  Request Private Demo <ArrowRight size={12} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A8A8A' }}>
                  <ShieldCheck size={16} color="#A98F6E" />
                  <span style={{ fontSize: '0.75rem' }}>Secure, organised records for your team</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes prFloat {
          0%, 100% { transform: rotateY(-12deg) rotateX(4deg) translateY(0); }
          50% { transform: rotateY(-12deg) rotateX(4deg) translateY(-15px); }
        }
        @keyframes prFloatReverse {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(10px) rotate(3deg); }
        }
        @keyframes prPulse {
          0% { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(169, 143, 110, 0); }
          100% { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0); }
        }
        .btn-premium:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 0 30px rgba(169, 143, 110, 0.5) !important;
        }
      `}</style>
    </section>
  );
}