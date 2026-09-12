import{r}from"./chunk-CXHxssQy.js";import{y as s}from"./chunk-CXAmgOhv.js";import{o as a}from"./chunk-BY9AVXEY.js";var n=r(s(),1),e=a(),l=()=>(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
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
          font-family: 'Saira', sans-serif; 
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
      `}),(0,e.jsxs)("nav",{style:{position:"fixed",top:0,left:0,right:0,zIndex:1e3,background:"var(--ink)",padding:"0.75rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 10px rgba(0,0,0,0.3)"},children:[(0,e.jsxs)("a",{href:"/",style:{display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--bone)",textDecoration:"none",fontFamily:"'Fraunces', serif",fontSize:"1.25rem",fontWeight:600},children:[(0,e.jsx)("div",{style:{width:"32px",height:"32px",background:"var(--verdigris)",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center"},children:(0,e.jsx)("i",{className:"fas fa-plus",style:{color:"white",fontSize:"0.9rem"}})}),(0,e.jsx)("span",{children:"Restpoint"})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1.5rem"},children:[(0,e.jsx)("a",{href:"#mobility",style:{color:"var(--bone)",textDecoration:"none",fontSize:"0.9rem",opacity:.8},children:"Portable"}),(0,e.jsx)("a",{href:"#how-it-works",style:{color:"var(--bone)",textDecoration:"none",fontSize:"0.9rem",opacity:.8},children:"How It Works"}),(0,e.jsx)("a",{href:"#prerequisites",style:{color:"var(--bone)",textDecoration:"none",fontSize:"0.9rem",opacity:.8},children:"Setup"}),(0,e.jsxs)("a",{href:"#scanner",style:{color:"white",textDecoration:"none",fontSize:"0.9rem",fontWeight:600,background:"var(--verdigris)",padding:"0.5rem 1.25rem",borderRadius:"6px",display:"flex",alignItems:"center",gap:"0.5rem"},children:[(0,e.jsx)("i",{className:"fas fa-scanner",style:{fontSize:"0.85rem"}}),"Scanner"]})]})]}),(0,e.jsx)("div",{style:{height:"60px"}}),(0,e.jsx)("section",{id:"mobility",className:"portable-section",children:(0,e.jsx)("div",{className:"container",children:(0,e.jsxs)("div",{className:"portable-grid",children:[(0,e.jsxs)("div",{className:"portable-text",children:[(0,e.jsx)("span",{className:"eyebrow",style:{fontFamily:"'JetBrains Mono', monospace",fontSize:"0.75rem",color:"var(--brass)",textTransform:"uppercase",letterSpacing:"0.15em"},children:"Designed for the Modern Funeral Home"}),(0,e.jsx)("h3",{className:"serif",children:"Unrestricted by hardware. Built for the desk."}),(0,e.jsx)("p",{children:"We allow your directors to use sleek, portable scanners that can be placed directly on a desk or table and moved easily. Whether it’s a compact desk scanner in the director’s office or a portable document scanner at the front desk, our infrastructure adapts to you."}),(0,e.jsxs)("div",{className:"portable-features",children:[(0,e.jsxs)("div",{className:"feature-box",children:[(0,e.jsx)("i",{className:"fas fa-arrows-up-down-left-right"}),(0,e.jsx)("h4",{children:"Total Mobility"}),(0,e.jsx)("p",{children:"Move the scanner anywhere there’s a computer. No fixed installations required."})]}),(0,e.jsxs)("div",{className:"feature-box",children:[(0,e.jsx)("i",{className:"fas fa-bolt"}),(0,e.jsx)("h4",{children:"Instant Capture"}),(0,e.jsx)("p",{children:"Just place the paper in the tray. The bridge handles the rest in milliseconds."})]})]})]}),(0,e.jsx)("div",{className:"portable-visual",children:(0,e.jsx)("img",{src:"https://kingspaperworks.com/wp-content/uploads/2024/08/2600f1.jpg",alt:"Portable Desk Scanner"})})]})})}),(0,e.jsx)("section",{id:"bridge-app",className:"split-section",children:(0,e.jsxs)("div",{className:"container",children:[(0,e.jsxs)("div",{className:"section-header",children:[(0,e.jsx)("span",{className:"eyebrow",style:{color:"var(--brass)"},children:"The Engine"}),(0,e.jsx)("h2",{className:"serif",children:"Why do I need the Restpoint Bridge?"}),(0,e.jsx)("p",{children:"The Restpoint Bridge is a small app/micro agent that connects your desktop/laptop  hardware to our cloud. It helps your devices and our system communicate smoothly and securely, so everything works together without complicated setup."})]}),(0,e.jsxs)("div",{className:"tech-grid",children:[(0,e.jsxs)("div",{className:"tech-text",children:[(0,e.jsx)("h3",{children:"The Cloud to Local Barrier"}),(0,e.jsx)("p",{children:'Your Restpoint software lives securely in the cloud. Web browsers, by design, are strictly sandboxed—they cannot see or control the physical hardware plugged into your computer. If you click "Scan" in a web browser, it has no way to tell the scanner to pull the paper.'}),(0,e.jsxs)("p",{children:["To solve this, we built the ",(0,e.jsx)("strong",{children:"Restpoint Scanner Bridge  Micro  agent"}),". It is a lightweight, invisible micro agent that installs on the local computer. It acts as a secure relay, receiving commands from the cloud and executing them on your local and  external  hardware."]}),(0,e.jsxs)("ul",{className:"tech-list",children:[(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-shield-halved"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Secure Local Tunnel"}),(0,e.jsx)("span",{children:"Creates a private connection on your computer using  a port(8081). A port is like a small doorway that computers use to communicate. Restpoint uses this private doorway so your cloud  restpoint  can safely talk to the Miro agent  Bridge without exposing it to the internet."})]})]}),(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-eye-slash"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Silent Automation"}),(0,e.jsx)("span",{children:"Runs invisibly in the system tray on startup. No windows to open, no buttons to click."})]})]}),(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-network-wired"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Direct Cloud Upload"}),(0,e.jsx)("span",{children:"Bypasses the browser entirely for heavy file uploads, pushing the PDF directly to the Restpoint API."})]})]})]})]}),(0,e.jsxs)("div",{className:"code-block",children:[(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"1."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Browser opens secure tunnel to agent"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"2."})," ws://localhost:8081 [CONNECTED]"]}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"3."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Cloud sends scan command"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"4."})," ",'{ "action": "START_SCAN", "deceasedId": "123" }']}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"5."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Agent acknowledges and begins"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"6."})," ",(0,e.jsx)("span",{style:{color:"#60a5fa"},children:"[STATUS] -> SCANNING"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"7."})," ",(0,e.jsx)("span",{style:{color:"#60a5fa"},children:"[STATUS] -> UPLOADING"})]}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"8."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Cloud confirms receipt"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"9."})," ",(0,e.jsx)("span",{style:{color:"#a3e635"},children:"[STATUS] -> COMPLETE"})]})]})]})]})}),(0,e.jsx)("section",{id:"network",className:"network-section",children:(0,e.jsxs)("div",{className:"container",children:[(0,e.jsxs)("div",{className:"section-header",children:[(0,e.jsx)("span",{className:"eyebrow",children:"The Bridge Network"}),(0,e.jsx)("h2",{className:"serif",children:"Communication Protocols"}),(0,e.jsx)("p",{children:"How our agent creates a secure, real-time tunnel between the browser, the physical hardware, and the Restpoint Cloud."})]}),(0,e.jsxs)("div",{className:"protocol-grid",children:[(0,e.jsxs)("div",{className:"protocol-card",children:[(0,e.jsx)("div",{className:"protocol-icon",children:(0,e.jsx)("i",{className:"fas fa-plug"})}),(0,e.jsx)("span",{className:"protocol-tag",children:"ws://localhost:8081"}),(0,e.jsx)("h4",{children:"WebSocket Layer"}),(0,e.jsx)("p",{children:'When a director clicks "Scan", the web app opens a local WebSocket connection to the Bridge Agent. This allows real-time, two-way communication to trigger the hardware and stream live progress states back to the browser UI.'})]}),(0,e.jsxs)("div",{className:"protocol-card",children:[(0,e.jsx)("div",{className:"protocol-icon",children:(0,e.jsx)("i",{className:"fas fa-microchip"})}),(0,e.jsx)("span",{className:"protocol-tag",children:"TWAIN / WIA"}),(0,e.jsx)("h4",{children:"Hardware Layer"}),(0,e.jsx)("p",{children:"The Agent translates the web command into TWAIN or WIA protocols—the native language of scanners. It commands the portable scanner to pull the paper, adjust DPI, and compile a high-quality multi-page PDF file locally."})]}),(0,e.jsxs)("div",{className:"protocol-card",children:[(0,e.jsx)("div",{className:"protocol-icon",children:(0,e.jsx)("i",{className:"fas fa-cloud-arrow-up"})}),(0,e.jsx)("span",{className:"protocol-tag",children:"HTTPS / REST API"}),(0,e.jsx)("h4",{children:"Cloud Layer"}),(0,e.jsx)("p",{children:"Once the PDF is compiled, the Agent makes a secure, encrypted HTTPS POST request directly to the Restpoint Cloud API, uploading the document and attaching it to the specific deceased profile instantly."})]})]})]})}),(0,e.jsx)("section",{id:"why-naps2",className:"split-section",children:(0,e.jsxs)("div",{className:"container",children:[(0,e.jsxs)("div",{className:"section-header",children:[(0,e.jsx)("span",{className:"eyebrow",style:{color:"var(--brass)"},children:"The Translator"}),(0,e.jsx)("h2",{className:"serif",children:"Why do I need to install NAPS2?"}),(0,e.jsx)("p",{children:"The critical open-source tool required to talk to your physical hardware."})]}),(0,e.jsxs)("div",{className:"tech-grid reverse",children:[(0,e.jsxs)("div",{className:"code-block",children:[(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"1."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Agent receives scan command"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"2."})," ",'{ "action": "START_SCAN", "duplex": true }']}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"3."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// Agent triggers NAPS2 in background"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"4."}),' naps2.exe scan --output "scan.pdf"']}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"5."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// NAPS2 tells scanner to feed paper"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"6."})," ",(0,e.jsx)("span",{style:{color:"#60a5fa"},children:"[TWAIN] -> Portable Desk Scanner"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"7."})," ",(0,e.jsx)("span",{style:{color:"#60a5fa"},children:"[SCANNING] -> Page 1 / 2..."})]}),(0,e.jsx)("div",{className:"code-line",style:{height:"1rem"}}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"8."})," ",(0,e.jsx)("span",{style:{color:"#94a3b8"},children:"// NAPS2 compiles final PDF"})]}),(0,e.jsxs)("div",{className:"code-line",children:[(0,e.jsx)("span",{className:"code-prefix",children:"9."})," ",(0,e.jsx)("span",{style:{color:"#a3e635"},children:"[FILE SAVED] -> scan.pdf"})]})]}),(0,e.jsxs)("div",{className:"tech-text",children:[(0,e.jsx)("h3",{children:"The Language Barrier"}),(0,e.jsx)("p",{children:"While the Restpoint Bridge handles the cloud communication, it still needs a way to speak to the actual scanner hardware. Scanners use low-level hardware protocols (TWAIN/WIA) that require specialized drivers to operate."}),(0,e.jsxs)("p",{children:["To bridge this gap flawlessly, we leverage ",(0,e.jsx)("strong",{children:"NAPS2"}),". It is a free, open-source, lightweight tool that acts as a universal translator for your scanner."]}),(0,e.jsxs)("ul",{className:"tech-list",children:[(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-check-circle"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Hardware Communication"}),(0,e.jsx)("span",{children:"NAPS2 already knows how to talk to TWAIN, WIA, and SANE devices seamlessly."})]})]}),(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-check-circle"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Command Line Interface (CLI)"}),(0,e.jsx)("span",{children:"It is triggered invisibly in the background by our Restpoint Agent without opening any windows."})]})]}),(0,e.jsxs)("li",{children:[(0,e.jsx)("i",{className:"fas fa-check-circle"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Invisible to Staff"}),(0,e.jsx)("span",{children:"The director never opens NAPS2. It runs silently as an engine that powers our automation."})]})]})]})]})]})]})}),(0,e.jsx)("section",{id:"setup",className:"download-section",children:(0,e.jsxs)("div",{className:"container",children:[(0,e.jsxs)("div",{className:"section-header",children:[(0,e.jsx)("span",{className:"eyebrow",children:"Installation Guide"}),(0,e.jsx)("h2",{className:"serif",children:"Required Downloads"}),(0,e.jsx)("p",{children:"Get the desk computer ready in 5 minutes. Install both components below."})]}),(0,e.jsxs)("div",{className:"prereq-grid",children:[(0,e.jsxs)("div",{className:"prereq-card primary",children:[(0,e.jsx)("span",{className:"prereq-badge",children:"Required"}),(0,e.jsx)("div",{className:"prereq-icon",children:(0,e.jsx)("i",{className:"fas fa-microchip"})}),(0,e.jsx)("h3",{className:"serif",children:"Restpoint Scanner Bridge"}),(0,e.jsx)("p",{children:"The meticulously engineered agent that connects your browser to the physical scanner. Runs silently on startup."}),(0,e.jsxs)("a",{href:"/downloads/Restpoint-Scanner-Bridge-Installer.exe",className:"btn-secondary",download:!0,children:[(0,e.jsx)("i",{className:"fas fa-download"})," Download Windows Installer (.exe)"]})]}),(0,e.jsxs)("div",{className:"prereq-card",children:[(0,e.jsx)("span",{className:"prereq-badge",children:"Free & Open Source"}),(0,e.jsx)("div",{className:"prereq-icon",children:(0,e.jsx)("i",{className:"fas fa-print"})}),(0,e.jsx)("h3",{className:"serif",children:"NAPS2 Scanner Driver"}),(0,e.jsx)("p",{children:"The free, open-source translator required to talk to your hardware via TWAIN/WIA."}),(0,e.jsxs)("a",{href:"https://www.naps2.com/download",target:"_blank",rel:"noopener noreferrer",className:"btn-primary",children:[(0,e.jsx)("i",{className:"fas fa-external-link-alt"})," Download NAPS2"]})]})]}),(0,e.jsxs)("div",{className:"steps-timeline",children:[(0,e.jsxs)("div",{className:"step-item",children:[(0,e.jsx)("div",{className:"step-num",children:"1"}),(0,e.jsxs)("div",{className:"step-content",children:[(0,e.jsx)("h4",{children:"Connect the Scanner"}),(0,e.jsx)("p",{children:"Place your portable scanner on the desk and connect it to the computer via USB. Ensure it is powered on."})]})]}),(0,e.jsxs)("div",{className:"step-item",children:[(0,e.jsx)("div",{className:"step-num",children:"2"}),(0,e.jsxs)("div",{className:"step-content",children:[(0,e.jsx)("h4",{children:"Install NAPS2 Driver"}),(0,e.jsx)("p",{children:"Download and install NAPS2 from their official website. Open it once to ensure your scanner is detected, then close it."})]})]}),(0,e.jsxs)("div",{className:"step-item",children:[(0,e.jsx)("div",{className:"step-num",children:"3"}),(0,e.jsxs)("div",{className:"step-content",children:[(0,e.jsx)("h4",{children:"Install Restpoint Bridge"}),(0,e.jsxs)("p",{children:["Download the Restpoint Scanner Bridge ZIP file. Extract it and double-click ",(0,e.jsx)("code",{children:"Install.bat"}),". It will start silently and run on every boot."]})]})]}),(0,e.jsxs)("div",{className:"step-item",children:[(0,e.jsx)("div",{className:"step-num",children:"4"}),(0,e.jsxs)("div",{className:"step-content",children:[(0,e.jsx)("h4",{children:"Scan in Restpoint"}),(0,e.jsx)("p",{children:'Open a deceased profile in your web browser, click "Scan Docs", place paper in the tray, and watch the PDF appear instantly.'})]})]})]})]})})]});export{l as default};
