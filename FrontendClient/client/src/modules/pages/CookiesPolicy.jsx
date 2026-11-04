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

export default function CookiesPolicy() {
    const navigate = useNavigate();
    const goHome = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); };
    const goPrivacy = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/privacy'); };
    const [analyticsChoice, setAnalyticsChoice] = useState(null);

    useEffect(() => {
        setAnalyticsChoice(window.rpGetAnalyticsConsent?.() ?? null);
        const handleConsentChange = (event) => {
            setAnalyticsChoice(event.detail?.analytics ?? null);
        };
        window.addEventListener('restpoint:cookie-consent-changed', handleConsentChange);
        return () => window.removeEventListener('restpoint:cookie-consent-changed', handleConsentChange);
    }, []);

    const chooseAnalytics = (allowed) => {
        if (typeof window.rpSetAnalyticsConsent !== 'function') return;
        window.rpSetAnalyticsConsent(allowed);
        setAnalyticsChoice(allowed);
    };

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
        ul { padding-left: 1.5rem; line-height: 1.8; font-size: 0.95rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.4rem; }
        footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid ${C.line}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.8rem; color: ${C.gray}; }
        footer a { color: ${C.gray}; text-decoration: none; }
        footer a:hover { color: ${C.ink}; }
        .highlight-box { background: ${C.bone2}; border: 1px solid ${C.line}; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 3px solid ${C.verdigris}; }
        .cookie-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
        .cookie-table th { text-align: left; padding: 0.75rem; background: ${C.bone2}; border: 1px solid ${C.line}; font-weight: 600; color: ${C.ink}; }
        .cookie-table td { padding: 0.75rem; border: 1px solid ${C.line}; }
        .badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; letter-spacing: 0.04em; text-transform: uppercase; padding: 0.2rem 0.5rem; color: ${C.brass}; background: ${C.bone2}; border: 1px solid ${C.line}; border-radius: 2px; vertical-align: middle; }
        .badge-security { color: ${C.verdigrisDark}; background: #EDF2F0; border-color: #C9D8D3; }
        .cookie-group { margin-bottom: 1.2rem; }
        .cookie-group + .cookie-group { margin-top: 0.75rem; }
        .preference-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin: 1rem 0 1.5rem; }
        .preference-status { flex-basis: 100%; color: ${C.gray}; font-size: 0.9rem; }
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
                        <div className="label" style={{ marginBottom: '0.8rem' }}>Legal</div>
                        <h1>Cookie Policy</h1>
                        <p style={{ color: C.gray, fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '2rem' }}>Last updated: June 2026</p>
                    </Reveal>

                    <Reveal delay={100}>
                        <div className="summary-box">
                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>What Are Cookies</h2>
                            <p style={{ color: C.ink, fontSize: '0.95rem', margin: 0 }}>Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.</p>
                        </div>
                    </Reveal>

                    <Reveal delay={150}>
                        <h2>How We Use Cookies</h2>
                        <p>Rest Point uses required first-party browser storage for core application functions and to remember your analytics choice. Optional Google Analytics is not loaded until you allow it. This site does not use analytics cookies to personalize content.</p>
                    </Reveal>

                    <Reveal delay={200}>
                        <h2>Cookie Declaration</h2>
                        <p>Below is an overview of the technologies currently used by RestPoint. Some items are cookies while others are stored locally in your browser for application functionality.</p>

                        <div className="cookie-group">
                            <h3 style={{ fontSize: '1rem', marginTop: '1.4rem', marginBottom: '0.4rem' }}>
                                Strictly necessary &amp; security
                                <span className="badge badge-security" style={{ marginLeft: '0.6rem' }}>Always active</span>
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: C.gray, marginBottom: '0.75rem' }}>
                                First-party storage supports login, application functionality, and saving this preference. These items are not optional analytics.
                            </p>
                            <table className="cookie-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Provider / Domain</th>
                                        <th>Expiration</th>
                                        <th>Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>restpoint_cookie_consent</strong></td>
                                        <td>RestPoint</td>
                                        <td>Until changed or cleared</td>
                                        <td>Stores whether optional analytics is allowed so the choice is remembered.</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Authentication / application storage</strong></td>
                                        <td>RestPoint<br /><span style={{ color: C.gray }}>restpoint.co.ke</span></td>
                                        <td>Application-dependent</td>
                                        <td>Supports secure login, account sessions, tenant information and essential application functionality.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="cookie-group">
                            <h3 style={{ fontSize: '1rem', marginTop: '1.4rem', marginBottom: '0.4rem' }}>
                                Analytics
                                <span className="badge" style={{ marginLeft: '0.6rem' }}>Optional</span>
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: C.gray, marginBottom: '0.75rem' }}>
                                The website uses Google Analytics (measurement ID G-MTXE9PKZDC) only after you allow analytics. If enabled, Google Analytics may set the first-party cookies listed below. Cookie names and lifetime can vary by browser and configuration. This website does not load its separate Google Tag Manager container.
                            </p>
                            <table className="cookie-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Provider / Domain</th>
                                        <th>Expiration</th>
                                        <th>Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>_ga</strong></td>
                                        <td>Google Analytics<br /><span style={{ color: C.gray }}>RestPoint website domain</span></td>
                                        <td>Varies</td>
                                        <td>Used to distinguish visitors for analytics measurement.</td>
                                    </tr>
                                    <tr>
                                        <td><strong>_ga_*</strong></td>
                                        <td>Google Analytics<br /><span style={{ color: C.gray }}>RestPoint website domain</span></td>
                                        <td>Varies</td>
                                        <td>Used by Google Analytics to maintain session and measurement information.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="cookie-group">
                            <h3 style={{ fontSize: '1rem', marginTop: '1.4rem', marginBottom: '0.4rem' }}>
                                Application storage
                                <span className="badge" style={{ marginLeft: '0.6rem' }}>Functional</span>
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: C.gray, marginBottom: '0.75rem' }}>
                                RestPoint uses browser local storage for application functionality such as inventory
                                information, onboarding preferences and interface state.
                            </p>
                            <table className="cookie-table">
                                <thead>
                                    <tr>
                                        <th>Storage key</th>
                                        <th>Provider</th>
                                        <th>Type</th>
                                        <th>Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>miniStore_*</strong></td>
                                        <td>RestPoint</td>
                                        <td>Local storage</td>
                                        <td>Supports mini-store inventory and transaction functionality.</td>
                                    </tr>
                                    <tr>
                                        <td><strong>onboarding*</strong></td>
                                        <td>RestPoint</td>
                                        <td>Local storage</td>
                                        <td>Stores onboarding and setup preferences.</td>
                                    </tr>
                                    <tr>
                                        <td><strong>tenant* / user*</strong></td>
                                        <td>RestPoint</td>
                                        <td>Local storage</td>
                                        <td>Supports application identity, tenant context and interface functionality.</td>
                                    </tr>
                                    <tr>
                                        <td><strong>sidebarOpen</strong></td>
                                        <td>RestPoint</td>
                                        <td>Local storage</td>
                                        <td>Remembers the user's interface preference.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Reveal>

                    <Reveal delay={250}>
                        <h2>Managing Cookies</h2>
                        <p>Choose whether to allow optional Google Analytics below. Analytics stays disabled until you allow it. You can change or withdraw this choice at any time using these controls or Cookie Settings in the site footer. Withdrawing the choice disables further analytics collection and clears accessible Google Analytics cookies; browser controls can also remove stored site data.</p>
                        <div className="preference-controls" aria-label="Optional analytics preferences">
                            <span className="preference-status" role="status">
                                {analyticsChoice === true
                                    ? 'Optional analytics is currently allowed.'
                                    : analyticsChoice === false
                                        ? 'Optional analytics is currently disabled.'
                                        : 'No analytics choice has been saved. Analytics remains disabled.'}
                            </span>
                            <button className="btn btn-line" type="button" onClick={() => chooseAnalytics(false)}>Decline / withdraw analytics</button>
                            <button className="btn btn-dark" type="button" onClick={() => chooseAnalytics(true)}>Allow analytics</button>
                        </div>
                        <p>To manage cookies in your browser:</p>
                        <ul>
                            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                        </ul>
                    </Reveal>

                    <Reveal delay={300}>
                        <div className="highlight-box">
                            <p style={{ color: C.ink, margin: 0 }}><strong>Your choice matters:</strong> You can reopen the site-wide banner using <button type="button" onClick={() => window.rpOpenCookieSettings?.()} style={{ border: 0, padding: 0, background: 'none', color: C.brass, font: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Cookie Settings</button> in the footer. Clearing browser storage may reset your saved preference.</p>
                        </div>
                    </Reveal>

                    <Reveal delay={350}>
                        <h2>Third Party Cookies</h2>
                        <p>The verified optional analytics integration on this website is Google Analytics. If you allow it, the browser loads Google's analytics script and sends website usage measurements to Google. For details about Google's handling of data, see <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google's Privacy Policy</a>. We do not list other third-party cookies unless their use is verified.</p>
                    </Reveal>

                    <Reveal delay={400}>
                        <h2>Updates to This Policy</h2>
                        <p>We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. We encourage you to review this policy periodically.</p>
                    </Reveal>

                    <Reveal delay={450}>
                        <h2>Contact Us</h2>
                        <div className="contact-box">
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>If you have questions about our use of cookies:</p>
                            <p style={{ margin: '0.5rem 0 0 0' }}><a href="mailto:privacy@restpoint.co.ke" style={{ color: C.brassLight, textDecoration: 'none', fontWeight: 500 }}>privacy@restpoint.co.ke</a></p>
                        </div>
                    </Reveal>

                    <footer>
                        <span>© {new Date().getFullYear()} Rest Point. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms of Service</a>
                        </div>
                    </footer>
                </div>
            </main>
        </>
    );
}