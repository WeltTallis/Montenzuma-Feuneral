import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const C = {
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  brassLight: '#A98F6E',
  verdigris: '#3D4F47',
  verdigrisDark: '#2E3F37',
  line: '#E3DDD0',
  lineDark: 'rgba(250,248,244,0.14)',
  gray: '#6B6862',
  grayLight: 'rgba(250,248,244,0.62)',
};

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.15 }
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
      transform: shown ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
};

export default function AccountDeletion() {
  const navigate = useNavigate();
  const goHome = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); };
  const goPrivacy = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/privacy'); };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; color: ${C.gray}; background: ${C.bone}; }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; color: ${C.ink}; }
        h1 { font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1.12; }
        h2 { font-size: 1.15rem; line-height: 1.3; margin-top: 2.2rem; margin-bottom: 0.75rem; color: ${C.ink}; }
        p { line-height: 1.7; font-size: 0.95rem; margin-bottom: 1rem; }
        a { color: inherit; }
        .label { font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.brass}; }
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.7rem; font-size: 0.85rem; font-weight: 500; font-family: 'Inter', sans-serif; border: 1px solid transparent; border-radius: 2px; cursor: pointer; transition: all 0.25s ease; white-space: nowrap; letter-spacing: 0.01em; }
        .btn-dark { background: ${C.ink}; color: ${C.bone}; }
        .btn-dark:hover { background: #000; }
        .btn-line { background: transparent; color: ${C.ink}; border-color: ${C.ink}; }
        .btn-line:hover { background: ${C.ink}; color: ${C.bone}; }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 2rem); }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,248,244,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid ${C.line}; padding: 1.15rem 0; }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.65rem; font-family: 'Fraunces', serif; font-size: 1.15rem; font-weight: 500; color: ${C.ink}; cursor: pointer; }
        .content-block { padding-top: 92px; }
        .summary-box { border: 1px solid ${C.line}; padding: 1.5rem 1.7rem; margin-bottom: 2rem; background: ${C.bone2}; border-left: 3px solid ${C.brass}; }
        .contact-box { background: linear-gradient(135deg, ${C.verdigrisDark}, ${C.verdigris}); color: ${C.bone}; padding: 1.5rem 1.7rem; margin-top: 1rem; border-radius: 2px; }
        ol { padding-left: 1.5rem; line-height: 1.8; font-size: 0.95rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.4rem; }
        footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid ${C.line}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.8rem; color: ${C.gray}; }
        footer a { color: ${C.gray}; text-decoration: none; }
        footer a:hover { color: ${C.ink}; }
        .highlight-box { background: ${C.bone2}; border: 1px solid ${C.line}; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 3px solid ${C.verdigris}; }
      `}</style>

      <nav>
        <div className="wrap nav-wrap">
          <div className="logo" onClick={goHome}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14.5" stroke={C.ink} strokeWidth="1" />
              <path d="M16 8.5V23.5M9.5 16H22.5" stroke={C.ink} strokeWidth="1" />
              <circle cx="16" cy="16" r="2.5" fill={C.ink} />
            </svg>
            <span>Rest Point</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-line" onClick={goHome} style={{ padding: '0.65rem 1.3rem', fontSize: '0.8rem' }}>← Back</button>
            <button className="btn btn-dark" onClick={goPrivacy} style={{ padding: '0.65rem 1.3rem', fontSize: '0.8rem' }}>Privacy</button>
          </div>
        </div>
      </nav>

      <main className="content-block">
        <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <Reveal>
            <div className="label" style={{ marginBottom: '0.8rem' }}>Account</div>
            <h1>Account Deletion Policy</h1>
            <p style={{ color: C.gray, fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '2rem' }}>Last updated: June 2026</p>
          </Reveal>

          <Reveal delay={100}>
            <div className="summary-box">
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Your Data, Your Control</h2>
              <p style={{ color: C.ink, fontSize: '0.95rem', margin: 0 }}>You can ask us to delete your account or specified personal information. We review each request and explain any information we are required or otherwise permitted to retain.</p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h2>Request Account Deletion</h2>
            <p>Email <a href="mailto:privacy@restpoint.co.ke?subject=Account%20deletion%20request" style={{ color: C.brass }}>privacy@restpoint.co.ke</a> with “Account deletion request” in the subject. Use the email address linked to the account where possible and include the account or workspace name and the account holder's name. You may also ask us to delete specific personal information without closing an entire account.</p>
            <ol>
              <li>Tell us whether you want the account closed, specified information deleted, or both.</li>
              <li>Include enough detail to identify the account or records. Do not send identity documents or sensitive details unless we request them through an appropriate channel.</li>
              <li>We may ask for information reasonably needed to verify your identity and authority to request account-level deletion.</li>
            </ol>
          </Reveal>

          <Reveal delay={200}>
            <h2>Review, Retention &amp; Response</h2>
            <p>We will review the request, confirm its scope, and explain what can be deleted and any information that must or may be retained for legal obligations, security, resolving disputes, or completing transactions. Deletion may affect access to account records and services. We will acknowledge and respond within the time required by applicable law; we do not promise an automatic or immediate deletion.</p>
          </Reveal>

          <Reveal delay={250}>
            <div className="highlight-box">
              <p style={{ color: C.ink, margin: 0 }}><strong>Need access, correction, or objection instead?</strong> You can use the same email address to request access to your information, ask us to correct it, object to a use, or request that we restrict or stop a particular use where applicable.</p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <h2>Request a Copy or Export</h2>
            <p>If you need a copy before requesting deletion, email <a href="mailto:privacy@restpoint.co.ke?subject=Personal%20information%20access%20or%20export%20request" style={{ color: C.brass }}>privacy@restpoint.co.ke</a> with “Access or export request” in the subject. Identify the account and describe the information or date range you need. We will verify the request, confirm the scope and available format, and respond within the time required by applicable law.</p>
          </Reveal>

          <Reveal delay={325}>
            <h2>Response or Complaint Route</h2>
            <p>We will explain the outcome and any limitation on the request. If you are dissatisfied with our response or believe your rights have not been addressed, you may lodge a complaint with Kenya's <a href="https://www.odpc.go.ke/" target="_blank" rel="noreferrer">Office of the Data Protection Commissioner (ODPC)</a>.</p>
          </Reveal>

          <Reveal delay={350}>
            <h2>Contact</h2>
            <div className="contact-box">
              <p style={{ margin: 0, fontSize: '0.95rem' }}>For privacy or account deletion requests:</p>
              <p style={{ margin: '0.5rem 0 0 0' }}><a href="mailto:privacy@restpoint.co.ke" style={{ color: C.brassLight, textDecoration: 'none', fontWeight: 500 }}>privacy@restpoint.co.ke</a></p>
            </div>
          </Reveal>

          <footer>
            <span>© {new Date().getFullYear()} Rest Point. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}