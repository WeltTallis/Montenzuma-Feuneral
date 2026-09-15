import React from 'react';

const ScannerSetupGuide = () => {
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap');
        :root {
          --verdigris: #3D4F47;
          --verdigris-dark: #2E3F37;
          --verdigris-light: #4D9B7F;
          --brass: #A98F6E;
          --brass-light: #C8B292;
          --bone: #FAF8F4;
          --ink: #1A1A1A;
          --gray: #6B6862;
          --line: #E2DDD3;
          --bg-dark: #0A0A0A;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { 
          font-family: 'Space Grotesk', 'Inter', sans-serif; 
          background-color: var(--bone); 
          color: var(--ink); 
          line-height: 1.7;
        }
        .serif { font-family: 'Fraunces', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* --- Sections --- */
        section { padding: 6rem 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-header .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--brass);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.75rem;
          display: block;
        }
        .section-header h2 {
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          color: var(--ink);
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .section-header p { color: var(--gray); max-width: 650px; margin: 0 auto; font-size: 1.1rem; }

        /* --- Portable Scanner Section --- */
        .portable-section { background: white; border-bottom: 1px solid var(--line); }
        .portable-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .portable-text h3 { font-family: 'Fraunces', serif; font-size: 2rem; margin-bottom: 1.5rem; color: var(--ink); }
        .portable-text p { color: var(--gray); margin-bottom: 1.5rem; font-size: 1.05rem; }
        .portable-features { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem; }
        .feature-box {
          background: var(--bone);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .feature-box i { color: var(--verdigris); font-size: 1.5rem; margin-bottom: 0.75rem; }
        .feature-box h4 { font-family: 'Fraunces', serif; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .feature-box p { font-size: 0.85rem; color: var(--gray); margin: 0; }

        .portable-visual {
          background: var(--bone);
          border-radius: 20px;
          padding: 0;
          text-align: center;
          border: 1px solid var(--line);
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          aspect-ratio: 4/3;
        }
        .portable-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .portable-visual::after {
          content: 'Portable. Wireless. Effortless.';
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(4px);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 1rem;
          color: var(--brass-light);
        }

        @media (max-width: 900px) {
          .portable-grid { grid-template-columns: 1fr; }
          .portable-features { grid-template-columns: 1fr; }
        }

        /* --- Split Section (Bridge App & NAPS2) --- */
        .split-section { background: var(--bg-dark); color: var(--bone); position: relative; overflow: hidden; }
        .split-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(250,248,244,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }
        .split-section .section-header h2 { color: var(--bone); }
        .split-section .section-header p { color: rgba(250,248,244,0.6); }
        
        .tech-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 1;
          margin-bottom: 8rem;
        }
        .tech-grid:last-child { margin-bottom: 0; }
        
        .tech-text h3 { font-family: 'Fraunces', serif; font-size: 1.8rem; margin-bottom: 1.5rem; color: var(--brass-light); font-weight: 500; }
        .tech-text p { color: rgba(250,248,244,0.7); margin-bottom: 2rem; font-size: 1.05rem; }
        .tech-list { list-style: none; }
        .tech-list li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(250,248,244,0.1);
        }
        .tech-list i { color: var(--verdigris-light); margin-top: 0.3rem; font-size: 1.2rem; }
        .tech-list strong { display: block; color: var(--bone); margin-bottom: 0.25rem; font-size: 1.1rem; }
        .tech-list span { color: rgba(250,248,244,0.5); font-size: 0.95rem; }

        .code-block {
          background: #111;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 2rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: #a3e635;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          height: 100%;
        }
        .code-block::before {
          content: 'System Process';
          position: absolute;
          top: -12px;
          left: 24px;
          background: #111;
          color: var(--brass);
          font-size: 0.7rem;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #333;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .code-line { margin-bottom: 0.5rem; display: flex; gap: 1rem; }
        .code-prefix { color: #555; }

        @media (max-width: 900px) {
          .tech-grid { grid-template-columns: 1fr; gap: 3rem; }
          .tech-grid.reverse .tech-text { order: 2; }
          .tech-grid.reverse .code-block { order: 1; }
        }

        /* --- Network & Protocols Section --- */
        .network-section { background: var(--bone); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .protocol-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }
        .protocol-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }
        .protocol-card:hover {
          border-color: var(--verdigris);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transform: translateY(-4px);
        }
        .protocol-icon {
          width: 48px;
          height: 48px;
          background: var(--verdigris);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
        }
        .protocol-tag {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--brass);
          background: rgba(169, 143, 110, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 0.75rem;
          letter-spacing: 0.05em;
        }
        .protocol-card h4 { font-family: 'Fraunces', serif; font-size: 1.3rem; margin-bottom: 0.75rem; }
        .protocol-card p { font-size: 0.9rem; color: var(--gray); }
        
        @media (max-width: 900px) {
          .protocol-grid { grid-template-columns: 1fr; }
        }

        /* --- Prerequisites / Downloads --- */
        .download-section { background: var(--bone); }
        .prereq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }
        .prereq-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 2.5rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .prereq-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.06);
          border-color: var(--verdigris);
        }
        .prereq-card.primary {
          background: var(--ink);
          color: var(--bone);
          border-color: var(--ink);
        }
        .prereq-card.primary h3, .prereq-card.primary p { color: var(--bone); }
        .prereq-card.primary .prereq-icon { background: rgba(255,255,255,0.1); color: var(--brass-light); border-color: rgba(255,255,255,0.2); }

        .prereq-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: var(--verdigris);
          color: white;
          font-size: 0.65rem;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }
        .prereq-card.primary .prereq-badge { background: var(--brass); color: var(--ink); }

        .prereq-icon {
          width: 72px;
          height: 72px;
          background: var(--bone);
          border: 1px solid var(--line);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: var(--verdigris);
          font-size: 1.8rem;
        }
        .prereq-card h3 { font-family: 'Fraunces', serif; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .prereq-card p { color: var(--gray); margin-bottom: 2rem; font-size: 0.95rem; }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.9rem 1.8rem;
          background: var(--verdigris);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          border: 1px solid var(--verdigris);
          width: 100%;
        }
        .btn-primary:hover { background: var(--verdigris-dark); border-color: var(--verdigris-dark); }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.9rem 1.8rem;
          background: var(--brass);
          color: var(--ink);
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          border: 1px solid var(--brass);
          width: 100%;
        }
        .btn-secondary:hover { background: var(--brass-light); border-color: var(--brass-light); }

        /* --- Setup Steps --- */
        .steps-section { background: white; border-top: 1px solid var(--line); }
        .steps-timeline {
          margin-top: 3rem;
          position: relative;
        }
        .steps-timeline::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 24px;
          width: 2px;
          background: var(--line);
        }
        .step-item {
          position: relative;
          padding-left: 70px;
          margin-bottom: 2.5rem;
        }
        .step-item:last-child { margin-bottom: 0; }
        .step-num {
          position: absolute;
          left: 0;
          top: 0;
          width: 50px;
          height: 50px;
          background: white;
          border: 2px solid var(--verdigris);
          color: var(--verdigris);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-family: 'Fraunces', serif;
          font-size: 1.2rem;
          z-index: 1;
        }
        .step-content {
          background: var(--bone);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.5rem 2rem;
        }
        .step-content h4 { font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--ink); }
        .step-content p { font-size: 0.9rem; color: var(--gray); margin: 0; }
      `}</style>

            {/* Standard app header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: '#0A0A0A',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0.8rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem'
                }}>
                    <a href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: '#FAF8F4',
                        textDecoration: 'none',
                        fontFamily: "'Fraunces', serif",
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        letterSpacing: '-0.02em'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            width: '10px',
                            height: '10px',
                            background: '#A98F6E',
                            borderRadius: '50%'
                        }} />
                        <span>Restpoint</span>
                    </a>

                    <nav style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.68rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                    }}>
                        <a href="/" style={{ color: 'rgba(250,248,244,0.7)', textDecoration: 'none' }}>Home</a>
                        <a href="#mobility" style={{ color: 'rgba(250,248,244,0.7)', textDecoration: 'none' }}>Portable</a>
                        <a href="#setup" style={{ color: 'rgba(250,248,244,0.7)', textDecoration: 'none' }}>Setup</a>
                        <a href="#scanner" style={{ color: '#FAF8F4', textDecoration: 'none', opacity: 1 }}>Scanner</a>
                    </nav>
                </div>
            </header>

            {/* Spacer for fixed nav */}
            <div style={{ height: '72px' }}></div>

            {/* Portable Scanner Section */}
            <section id="mobility" className="portable-section">
                <div className="container">
                    <div className="portable-grid">
                        <div className="portable-text">
                            <span className="eyebrow" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--brass)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>For your front desk</span>
                            <h3 className="serif">Scan documents without the hassle.</h3>
                            <p>Keep the scanner close to your team. Scan admission forms, release papers, and other documents straight into the right case in Rest Point.</p>

                            <div className="portable-features">
                                <div className="feature-box">
                                    <i className="fas fa-arrows-up-down-left-right"></i>
                                    <h4>Move it easily</h4>
                                    <p>Place it wherever your team does the work. No fixed installation is needed.</p>
                                </div>
                                <div className="feature-box">
                                    <i className="fas fa-bolt"></i>
                                    <h4>Scan in seconds</h4>
                                    <p>Place the paper in the tray. Rest Point saves the document to the case for you.</p>
                                </div>
                            </div>
                        </div>

                        <div className="portable-visual">
                            <img src="https://kingspaperworks.com/wp-content/uploads/2024/08/2600f1.jpg" alt="Portable Desk Scanner" loading="lazy" decoding="async" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Installation & Downloads */}
            <section id="setup" className="download-section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                        <span className="eyebrow">Set up your scanner</span>
                        <h2 className="serif">Ready in a few simple steps.</h2>
                        <p>Choose your computer, install the two small helper apps, and start scanning into Rest Point.</p>
                    </div>

                    <div className="prereq-grid">
                        {/* Restpoint Bridge */}
                        <div className="prereq-card primary">
                            <span className="prereq-badge">Required</span>
                            <div className="prereq-icon">
                                <i className="fas fa-microchip"></i>
                            </div>
                            <h3 className="serif">Rest Point connection app</h3>
                            <p>This small app connects Rest Point to the scanner and runs quietly in the background.</p>
                            <a href="/downloads/windows/Restpoint-Scanner-Bridge-Installer.exe" className="btn-secondary" download>
                                <i className="fas fa-download"></i> Windows download
                            </a>
                            <a href="/downloads/macbook/Restpoint-Scanner-Bridge.pkg" className="btn-secondary" download style={{ marginTop: '0.6rem' }}>
                                <i className="fab fa-apple"></i> Mac download
                            </a>
                        </div>

                        {/* NAPS2 */}
                        <div className="prereq-card">
                            <span className="prereq-badge">Free & Open Source</span>
                            <div className="prereq-icon">
                                <i className="fas fa-print"></i>
                            </div>
                            <h3 className="serif">Scanner helper</h3>
                            <p>This free app helps your computer talk to the scanner.</p>
                            <a href="https://www.naps2.com/download" target="_blank" rel="noopener noreferrer" className="btn-primary">
                                <i className="fas fa-external-link-alt"></i> Get the scanner helper
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Bridge App Section (Engine) */}
            <section id="bridge-app" className="split-section">
                <div className="container">
                    <div className="section-header">
                        <span className="eyebrow" style={{ color: 'var(--brass)' }}>How it works</span>
                        <h2 className="serif">You click Scan. We handle the rest.</h2>
                        <p>The Rest Point connection app links your scanner to your case files. Your team does not need to manage settings or move files around.</p>
                    </div>

                    <div className="tech-grid">
                        <div className="tech-text">
                            <h3>Simple for your team</h3>
                            <p>Click "Scan Docs" in a case, place the paper in the tray, and let Rest Point do the filing. The connection app runs quietly on the desk computer.</p>
                            <p>Your documents go to the right case as a clear PDF, ready for your team to review and share.</p>

                            <ul className="tech-list">
                                <li>
                                    <i className="fas fa-shield-halved"></i>
                                   <div>
                                        <strong>Private connection</strong>
                                        <span>Your scanner connects to Rest Point through a private link on the desk computer.</span>
</div>

                                </li>
                                <li>
                                    <i className="fas fa-eye-slash"></i>
                                    <div>
                                        <strong>Runs quietly</strong>
                                        <span>It starts with the computer, so staff do not need to open another window.</span>
                                    </div>
                                </li>
                                <li>
                                    <i className="fas fa-network-wired"></i>
                                    <div>
                                        <strong>Filed for you</strong>
                                        <span>The finished PDF is attached to the case without extra uploads or filing.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="code-block">
                            <div className="code-line"><span className="code-prefix">1.</span> <span style={{ color: '#94a3b8' }}>// Browser opens secure tunnel to agent</span></div>
                            <div className="code-line"><span className="code-prefix">2.</span> ws://localhost:8081 [CONNECTED]</div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">3.</span> <span style={{ color: '#94a3b8' }}>// Cloud sends scan command</span></div>
                            <div className="code-line"><span className="code-prefix">4.</span> {'{ "action": "START_SCAN", "deceasedId": "123" }'}</div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">5.</span> <span style={{ color: '#94a3b8' }}>// Agent acknowledges and begins</span></div>
                            <div className="code-line"><span className="code-prefix">6.</span> <span style={{ color: '#60a5fa' }}>[STATUS] -&gt; SCANNING</span></div>
                            <div className="code-line"><span className="code-prefix">7.</span> <span style={{ color: '#60a5fa' }}>[STATUS] -&gt; UPLOADING</span></div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">8.</span> <span style={{ color: '#94a3b8' }}>// Cloud confirms receipt</span></div>
                            <div className="code-line"><span className="code-prefix">9.</span> <span style={{ color: '#a3e635' }}>[STATUS] -&gt; COMPLETE</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Network & Protocols Section */}
            <section id="network" className="network-section">
                <div className="container">
                    <div className="section-header">
                        <span className="eyebrow">Behind the scan</span>
                        <h2 className="serif">What happens after you click Scan</h2>
                        <p>Three quiet steps move the document from the tray to the right case.</p>
                    </div>

                    <div className="protocol-grid">
                        {/* Protocol 1 */}
                        <div className="protocol-card">
                            <div className="protocol-icon"><i className="fas fa-plug"></i></div>
                            <span className="protocol-tag">Step 1</span>
                            <h4>Start the scan</h4>
                            <p>You choose Scan Docs from the case. Rest Point sends the request to the scanner beside you.</p>
                        </div>

                        {/* Protocol 2 */}
                        <div className="protocol-card">
                            <div className="protocol-icon"><i className="fas fa-microchip"></i></div>
                            <span className="protocol-tag">Step 2</span>
                            <h4>Capture the pages</h4>
                            <p>The scanner reads the pages and joins them into one clear PDF, even when a document has several pages.</p>
                        </div>

                        {/* Protocol 3 */}
                        <div className="protocol-card">
                            <div className="protocol-icon"><i className="fas fa-cloud-arrow-up"></i></div>
                            <span className="protocol-tag">Step 3</span>
                            <h4>Save to the case</h4>
                            <p>The PDF is sent securely to Rest Point and attached to the correct deceased record.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why NAPS2? */}
            <section id="why-naps2" className="split-section">
                <div className="container">
                    <div className="section-header">
                        <span className="eyebrow" style={{ color: 'var(--brass)' }}>One small helper</span>
                        <h2 className="serif">Why is the scanner helper needed?</h2>
                        <p>It helps your computer recognise the scanner. Once it is installed, your team can forget about it.</p>
                    </div>

                    <div className="tech-grid reverse">
                        <div className="code-block">
                            <div className="code-line"><span className="code-prefix">1.</span> <span style={{ color: '#94a3b8' }}>// Agent receives scan command</span></div>
                            <div className="code-line"><span className="code-prefix">2.</span> {'{ "action": "START_SCAN", "duplex": true }'}</div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">3.</span> <span style={{ color: '#94a3b8' }}>// Agent triggers NAPS2 in background</span></div>
                            <div className="code-line"><span className="code-prefix">4.</span> naps2.exe scan --output "scan.pdf"</div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">5.</span> <span style={{ color: '#94a3b8' }}>// NAPS2 tells scanner to feed paper</span></div>
                            <div className="code-line"><span className="code-prefix">6.</span> <span style={{ color: '#60a5fa' }}>[TWAIN] -&gt; Portable Desk Scanner</span></div>
                            <div className="code-line"><span className="code-prefix">7.</span> <span style={{ color: '#60a5fa' }}>[SCANNING] -&gt; Page 1 / 2...</span></div>
                            <div className="code-line" style={{ height: '1rem' }}></div>
                            <div className="code-line"><span className="code-prefix">8.</span> <span style={{ color: '#94a3b8' }}>// NAPS2 compiles final PDF</span></div>
                            <div className="code-line"><span className="code-prefix">9.</span> <span style={{ color: '#a3e635' }}>[FILE SAVED] -&gt; scan.pdf</span></div>
                        </div>

                        <div className="tech-text">
                            <h3>Installed once, used quietly</h3>
                            <p>The helper gives your computer the simple instructions it needs to work with the scanner.</p>
                            <p>Your director does not need to open it. Rest Point uses it in the background whenever a document is scanned.</p>

                            <ul className="tech-list">
                                <li>
                                    <i className="fas fa-check-circle"></i>
                                    <div>
                                        <strong>Recognises your scanner</strong>
                                        <span>It helps the computer find and use the connected scanner.</span>
                                    </div>
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>
                                    <div>
                                        <strong>Works in the background</strong>
                                        <span>It starts when needed without opening extra windows.</span>
                                    </div>
                                </li>
                                <li>
                                    <i className="fas fa-check-circle"></i>
                                    <div>
                                        <strong>No extra work</strong>
                                        <span>Your team clicks Scan Docs in Rest Point and carries on.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Installation & Downloads */}
            <section id="setup" className="download-section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                        <span className="eyebrow">Quick setup</span>
                        <h2 className="serif">Start scanning in four steps.</h2>
                        <p>Set it up once on the computer your team uses at the front desk.</p>
                    </div>

                    <div className="prereq-grid">
                        <div className="prereq-card primary">
                            <span className="prereq-badge">Required</span>
                            <div className="prereq-icon">
                                <i className="fas fa-microchip"></i>
                            </div>
                            <h3 className="serif">Restpoint Scanner Bridge</h3>
                            <p>The meticulously engineered agent that connects your browser to the physical scanner. Runs silently on startup.</p>
                            <a href="/downloads/windows/Restpoint-Scanner-Bridge-Installer.exe" className="btn-secondary" download>
                                <i className="fas fa-download"></i> Download Windows Installer (.exe)
                            </a>
                            <a href="/downloads/macbook/Restpoint-Scanner-Bridge.pkg" className="btn-secondary" download style={{ marginTop: '0.6rem' }}>
                                <i className="fab fa-apple"></i> Download macOS Installer (.pkg)
                            </a>
                        </div>

                        <div className="prereq-card">
                            <span className="prereq-badge">Free & Open Source</span>
                            <div className="prereq-icon">
                                <i className="fas fa-print"></i>
                            </div>
                            <h3 className="serif">NAPS2 Scanner Driver</h3>
                            <p>The free, open-source translator required to talk to your hardware via TWAIN/WIA.</p>
                            <a href="https://www.naps2.com/download" target="_blank" rel="noopener noreferrer" className="btn-primary">
                                <i className="fas fa-external-link-alt"></i> Download NAPS2
                            </a>
                        </div>
                    </div>

                    <div className="steps-timeline">
                        <div className="step-item">
                            <div className="step-num">1</div>
                            <div className="step-content">
                                <h4>Connect the scanner</h4>
                                <p>Place the scanner on the desk, connect the USB cable, and switch it on.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">2</div>
                            <div className="step-content">
                                <h4>Install the scanner helper</h4>
                                <p>Download the helper above and open it once so the computer can find your scanner.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">3</div>
                            <div className="step-content">
                                <h4>Install the Rest Point app</h4>
                                <p>Choose the Windows or Mac download above. Open it once; it will start quietly when the computer starts.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">4</div>
                            <div className="step-content">
                                <h4>Scan in Rest Point</h4>
                                <p>Open a deceased profile, click "Scan Docs", place the paper in the tray, and the PDF will appear in the case.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ScannerSetupGuide;