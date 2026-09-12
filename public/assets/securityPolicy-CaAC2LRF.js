import{r as d}from"./chunk-CXHxssQy.js";import{y as m}from"./chunk-CXAmgOhv.js";import{l as p}from"./chunk-DWc5g_hH.js";import{o as h}from"./chunk-BY9AVXEY.js";var c=d(m(),1),e=h(),i={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",grayDark:"#4A4844",accent:"#C77B5E"};function g(){const t=(0,c.useRef)(null),[n,o]=(0,c.useState)(!1);return(0,c.useEffect)(()=>{const r=t.current;if(!r)return;const s=new IntersectionObserver(([l])=>{l.isIntersecting&&(o(!0),s.disconnect())},{threshold:.1});return s.observe(r),()=>s.disconnect()},[]),[t,n]}var a=({children:t,delay:n=0,style:o={},className:r=""})=>{const[s,l]=g();return(0,e.jsx)("div",{ref:s,className:r,style:{opacity:l?1:0,transform:l?"translateY(0)":"translateY(24px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${n}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${n}ms`,...o},children:t})},x=({size:t=28,color:n=i.verdigris})=>(0,e.jsxs)("svg",{width:t,height:t,viewBox:"0 0 32 32",fill:"none",style:{flexShrink:0},children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:n,strokeWidth:"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:n,strokeWidth:"1.5",strokeLinecap:"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:n})]});function y(){const t=p(),n=()=>{window.scrollTo({top:0,behavior:"smooth"}),t("/")},o=[{icon:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),(0,e.jsx)("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),title:"Data Encryption at Rest",desc:"Full storage volumes leverage industry-standard cryptographic encryption at rest, keeping records unreadable to unauthorized hardware targets."},{icon:(0,e.jsx)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})}),title:"Multi-Tenant Isolation",desc:"Database level boundaries ensure each tenant operates their own isolated database instance. Cross-tenant parameters cannot intersect."},{icon:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),(0,e.jsx)("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}),title:"Family Data Masking",desc:"Sensitive family records and kinship details undergo strict field-level data masking to protect privacy across generalized dashboards."},{icon:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,e.jsx)("polyline",{points:"12 6 12 12 16 14"})]}),title:"Rate Limiting",desc:"Aggressive application and network layer rate limiting prevents API brute forcing and localized traffic amplification vectors."}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                body { font-family: 'Inter', sans-serif; color: ${i.gray}; background: ${i.bone}; -webkit-font-smoothing: antialiased; }

                h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -0.01em; color: ${i.ink}; }
                h1 { font-size: clamp(2.2rem, 5vw, 3rem); line-height: 1.08; }
                h2 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); line-height: 1.25; margin-bottom: 0.8rem; }
                h3 { font-size: 1.05rem; line-height: 1.35; margin-bottom: 0.5rem; }
                p { line-height: 1.75; font-size: 0.95rem; margin-bottom: 1rem; }
                a { color: inherit; }
                strong { color: ${i.ink}; font-weight: 600; }
                code { font-family: 'JetBrains Mono', monospace; font-size: 0.85em; background: ${i.bone2}; padding: 0.15em 0.4em; border-radius: 4px; }

                .label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${i.brass}; font-weight: 500; }
                .wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 2.5rem); }

                /* ── Nav ── */
                nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
                    background: rgba(250,248,244,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                    border-bottom: 1px solid ${i.line};
                    padding: 1.2rem 0; transition: all 0.4s ease;
                }
                nav.scrolled { background: rgba(250,248,244,0.96); box-shadow: 0 1px 12px rgba(21,23,26,0.06); }
                .nav-wrap { display: flex; justify-content: space-between; align-items: center; }
                .logo { display: flex; align-items: center; gap: 0.7rem; font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 500; color: ${i.ink}; cursor: pointer; transition: opacity 0.3s; text-decoration: none; }
                .logo:hover { opacity: 0.8; }
                .nav-links { display: flex; gap: 2.5rem; align-items: center; list-style: none; }
                .nav-links a { font-size: 0.85rem; color: ${i.gray}; text-decoration: none; transition: color 0.2s; position: relative; padding: 0.5rem 0; }
                .nav-links a::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1.5px; background: ${i.verdigris}; transition: width 0.3s ease; }
                .nav-links a:hover { color: ${i.verdigris}; }
                .nav-links a:hover::after { width: 100%; }

                /* ── Hero Banner ── */
                .hero-banner {
                    background: ${i.verdigrisDark};
                    padding: clamp(6rem, 12vw, 9rem) 0 clamp(3rem, 6vw, 4.5rem);
                    position: relative; overflow: hidden;
                    margin-top: 60px;
                }
                .hero-banner-grid {
                    position: absolute; inset: 0;
                    background-image: radial-gradient(rgba(250,248,244,0.05) 1px, transparent 1px);
                    background-size: 28px 28px; pointer-events: none;
                }
                .hero-banner-glow {
                    position: absolute; width: 500px; height: 500px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(61,79,71,0.2) 0%, transparent 60%);
                    top: -200px; right: -100px; pointer-events: none;
                }
                .hero-banner-glow2 {
                    position: absolute; width: 350px; height: 350px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(139,115,85,0.1) 0%, transparent 60%);
                    bottom: -100px; left: -80px; pointer-events: none;
                }
                .hero-banner .wrap { position: relative; z-index: 1; }
                .hero-banner h1 { color: ${i.bone}; margin: 0 0 1rem 0; }
                .hero-banner .subtitle { color: rgba(250,248,244,0.55); font-size: 1.1rem; max-width: 620px; margin: 0; line-height: 1.8; }
                .hero-banner .meta { color: rgba(250,248,244,0.35); }
                .back-link {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    font-size: 0.82rem; color: rgba(250,248,244,0.4);
                    text-decoration: none; margin-bottom: 2rem;
                    transition: color 0.2s; cursor: pointer;
                    font-family: 'Inter', sans-serif; background: none; border: none; padding: 0;
                }
                .back-link:hover { color: rgba(250,248,244,0.8); }
                .back-link svg { transition: transform 0.2s; }
                .back-link:hover svg { transform: translateX(-3px); }

                /* ── Content ── */
                main { background: ${i.bone}; }
                .content-area { padding: clamp(3rem, 6vw, 5rem) 0; }

                .section { margin-top: 3.5rem; }
                .section:first-child { margin-top: 0; }
                .section-divider {
                    height: 1px; background: ${i.line}; margin: 3rem 0;
                }

                .section-label {
                    display: inline-flex; align-items: center; gap: 0.6rem;
                    margin-bottom: 1.5rem;
                }
                .section-label-line {
                    width: 24px; height: 1px; background: ${i.line};
                }

                /* ── Pillar Cards ── */
                .pillar-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin: 2rem 0;
                }
                .pillar-card {
                    background: ${i.white};
                    border: 1px solid ${i.line};
                    border-radius: 14px;
                    padding: 1.6rem;
                    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
                    position: relative; overflow: hidden;
                }
                .pillar-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
                    background: linear-gradient(90deg, transparent, ${i.brass}, transparent);
                    opacity: 0; transition: opacity 0.4s ease;
                }
                .pillar-card:hover {
                    border-color: rgba(139,115,85,0.3);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px -8px rgba(139,115,85,0.12), 0 0 0 1px rgba(139,115,85,0.08);
                }
                .pillar-card:hover::before { opacity: 1; }
                .pillar-icon {
                    width: 44px; height: 44px; border-radius: 11px;
                    background: ${i.bone2}; color: ${i.brass};
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 1.1rem; transition: all 0.4s ease;
                }
                .pillar-card:hover .pillar-icon {
                    background: ${i.brass}; color: ${i.bone};
                    box-shadow: 0 4px 16px rgba(139,115,85,0.25);
                }
                .pillar-title {
                    font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
                    color: ${i.ink}; margin-bottom: 0.45rem; letter-spacing: -0.01em;
                }
                .pillar-desc { font-size: 0.88rem; color: ${i.gray}; line-height: 1.65; margin: 0; }

                /* ── Sub-sections ── */
                .sub-section { margin-top: 2rem; }
                .sub-section h3 {
                    font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
                    color: ${i.ink}; margin-bottom: 0.6rem; letter-spacing: -0.01em;
                    display: flex; align-items: center; gap: 0.6rem;
                }
                .sub-section h3::before {
                    content: ''; width: 6px; height: 6px; border-radius: 50%;
                    background: ${i.verdigris}; flex-shrink: 0;
                }

                /* ── Lists ── */
                .styled-list { padding-left: 0; list-style: none; margin: 1rem 0; }
                .styled-list li {
                    padding: 1rem 1rem 1rem 1.5rem;
                    position: relative; font-size: 0.93rem; line-height: 1.7;
                    border-left: 2px solid ${i.line};
                    margin-bottom: 0;
                }
                .styled-list li + li { margin-top: 0.5rem; }
                .styled-list li::before {
                    content: ''; position: absolute; left: -5px; top: 1.15rem;
                    width: 8px; height: 8px; border-radius: 50%;
                    background: ${i.bone}; border: 2px solid ${i.verdigris};
                }

                /* ── Commitment Box ── */
                .commitment-box {
                    background: ${i.verdigrisDark};
                    border-radius: 16px; padding: clamp(2rem, 3vw, 2.5rem);
                    margin: 3rem 0; position: relative; overflow: hidden;
                }
                .commitment-box::before {
                    content: ''; position: absolute; inset: 0;
                    background-image: radial-gradient(rgba(250,248,244,0.04) 1px, transparent 1px);
                    background-size: 24px 24px; pointer-events: none;
                }
                .commitment-box::after {
                    content: ''; position: absolute; top: -80px; right: -80px;
                    width: 250px; height: 250px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(61,79,71,0.25) 0%, transparent 60%);
                    pointer-events: none;
                }
                .commitment-box > * { position: relative; z-index: 1; }
                .commitment-box h3 { color: ${i.bone}; font-size: 1.15rem; margin-bottom: 0.8rem; }
                .commitment-box h3::before { background: rgba(250,248,244,0.4) !important; }
                .commitment-box p { color: rgba(250,248,244,0.65); font-size: 0.93rem; margin-bottom: 0; }
                .commitment-box strong { color: rgba(250,248,244,0.85); }
                .commitment-accent {
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, ${i.verdigrisLight}, ${i.brass}, ${i.verdigrisLight});
                    background-size: 200% 100%; animation: grad-shift 4s ease infinite;
                }

                /* ── Contact Box ── */
                .contact-box {
                    background: ${i.white}; border: 1px solid ${i.line};
                    border-radius: 14px; padding: clamp(1.8rem, 3vw, 2.2rem);
                    margin: 2rem 0; position: relative; overflow: hidden;
                }
                .contact-box::before {
                    content: ''; position: absolute; top: 0; left: 0; bottom: 0;
                    width: 4px; background: linear-gradient(180deg, ${i.verdigris}, ${i.brass});
                    border-radius: 4px 0 0 4px;
                }
                .contact-box p { margin-bottom: 0.5rem; }
                .contact-email {
                    color: ${i.brass}; text-decoration: none; font-weight: 500;
                    transition: color 0.2s; position: relative;
                }
                .contact-email::after {
                    content: ''; position: absolute; bottom: -2px; left: 0;
                    width: 0; height: 1px; background: ${i.brassLight};
                    transition: width 0.3s ease;
                }
                .contact-email:hover { color: ${i.brassLight}; }
                .contact-email:hover::after { width: 100%; }
                .contact-note { font-size: 0.82rem; color: ${i.grayDark}; opacity: 0.7; margin-top: 0.6rem !important; }

                /* ── Footer ── */
                .policy-footer {
                    margin-top: 4rem; padding: 2rem 0;
                    border-top: 1px solid ${i.line};
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 1rem;
                }
                .policy-footer span { font-size: 0.82rem; color: ${i.grayDark}; opacity: 0.6; }
                .footer-links { display: flex; gap: 0.6rem; flex-wrap: wrap; }
                .footer-link {
                    font-size: 0.82rem; color: ${i.gray}; text-decoration: none;
                    padding: 0.55rem 1.1rem; border: 1px solid ${i.line};
                    border-radius: 8px; transition: all 0.25s ease;
                    font-family: 'Inter', sans-serif; background: none; cursor: pointer;
                }
                .footer-link:hover {
                    background: ${i.ink}; color: ${i.bone}; border-color: ${i.ink};
                }

                @keyframes grad-shift { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }

                @media (max-width: 768px) {
                    .nav-links { display: none; }
                    .pillar-grid { grid-template-columns: 1fr; }
                    .policy-footer { flex-direction: column; align-items: flex-start; }
                    .footer-links { width: 100%; }
                    .footer-link { flex: 1; text-align: center; justify-content: center; }
                }
            `}),(0,e.jsx)("nav",{id:"policy-nav",children:(0,e.jsxs)("div",{className:"wrap nav-wrap",children:[(0,e.jsxs)("a",{href:"/",className:"logo",onClick:r=>{r.preventDefault(),n()},children:[(0,e.jsx)(x,{size:28}),"Rest Point"]}),(0,e.jsxs)("ul",{className:"nav-links",children:[(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/",onClick:r=>{r.preventDefault(),n()},children:"Home"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/privacy",onClick:r=>{r.preventDefault(),t("/privacy")},children:"Privacy"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/terms",onClick:r=>{r.preventDefault(),t("/terms")},children:"Terms"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/sla",onClick:r=>{r.preventDefault(),t("/sla")},children:"SLA"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/security",onClick:r=>{r.preventDefault(),t("/security")},children:"Security"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/blog",onClick:r=>{r.preventDefault(),t("/blog")},children:"Blog"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/contact",onClick:r=>{r.preventDefault(),t("/contact")},children:"Contact"})})]})]})}),(0,e.jsxs)("main",{children:[(0,e.jsxs)("div",{className:"hero-banner",children:[(0,e.jsx)("div",{className:"hero-banner-grid"}),(0,e.jsx)("div",{className:"hero-banner-glow"}),(0,e.jsx)("div",{className:"hero-banner-glow2"}),(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("button",{className:"back-link",onClick:n,children:[(0,e.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M19 12H5M12 19l-7-7 7-7"})}),"Back to Home"]}),(0,e.jsxs)(a,{children:[(0,e.jsx)("span",{className:"label meta",style:{display:"block",marginBottom:"1.5rem"},children:"Policy · Infrastructure Security"}),(0,e.jsx)("h1",{children:"Security Policy"}),(0,e.jsx)("p",{className:"subtitle",children:"How we protect sensitive operations, safeguard deceased records, and maintain rigorous baseline architectures."})]})]})]}),(0,e.jsx)("div",{className:"content-area",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)(a,{children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Philosophy"})]}),(0,e.jsx)("h2",{children:"Data Sovereignty & Dignity"}),(0,e.jsx)("p",{children:"Managing mortuary operations, digital identity tags, chain-of-custody ledgers, and billing information requires strict data defense paradigms. RestPoint treats system security not merely as compliance, but as an operational necessity."}),(0,e.jsx)("p",{children:"Our structural protocols ensure data remains heavily isolated, audit trails are strictly immutable, and access tiers are aggressively structured."})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(a,{delay:100,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Core Pillars"})]}),(0,e.jsx)("h2",{children:"Security Foundations"}),(0,e.jsx)("div",{className:"pillar-grid",children:o.map((r,s)=>(0,e.jsxs)("div",{className:"pillar-card",children:[(0,e.jsx)("div",{className:"pillar-icon",children:r.icon}),(0,e.jsx)("div",{className:"pillar-title",children:r.title}),(0,e.jsx)("p",{className:"pillar-desc",children:r.desc})]},s))})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(a,{delay:150,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Perimeter"})]}),(0,e.jsx)("h2",{children:"Network & Perimeter Defense"}),(0,e.jsxs)("div",{className:"sub-section",children:[(0,e.jsx)("h3",{children:"Cloudflare Tunnel & Firewalls"}),(0,e.jsxs)("p",{children:["All public routes route through enterprise network filters and native firewalls. Using ",(0,e.jsx)("strong",{children:"cloudflared"})," tunnels, internal application ports remain completely invisible to the open internet, restricting inbound traffic strictly to verified edge requests."]})]}),(0,e.jsxs)("div",{className:"sub-section",children:[(0,e.jsx)("h3",{children:"Brute-Force Prevention via Fail2ban"}),(0,e.jsxs)("p",{children:["Automated connection logs are monitored seamlessly by ",(0,e.jsx)("strong",{children:"fail2ban"})," protection systems. Infrastructure endpoints instantly block hosts displaying anomalous automated patterns or systemic login failures."]})]}),(0,e.jsxs)("div",{className:"sub-section",children:[(0,e.jsx)("h3",{children:"Application Vulnerability Mitigation (XSS & Injection)"}),(0,e.jsx)("p",{children:"The application core enforces strict data validation schemas to safeguard input routes. Contextual encoding patterns protect operational portals against Cross-Site Scripting (XSS) and database level manipulation vulnerabilities."})]})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(a,{delay:200,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Authentication"})]}),(0,e.jsx)("h2",{children:"Secrets & Authentication Management"}),(0,e.jsx)("p",{children:"We approach access paths and internal configurations through an explicit minimal footprint strategy:"}),(0,e.jsxs)("ul",{className:"styled-list",children:[(0,e.jsxs)("li",{children:[(0,e.jsx)("strong",{children:"Cryptographically Salted Passwords:"})," Access credentials are processed via rigorous one-way hashing models alongside unique, randomized salts. Passwords are never stored or logged in plain text."]}),(0,e.jsxs)("li",{children:[(0,e.jsx)("strong",{children:"Isolated .env Secret Keys:"})," Environment level configurations, encryption strings, and webhook secrets live inside strictly locked ",(0,e.jsx)("code",{children:".env"})," key arrays, decoupled completely from the application build source."]})]})]})}),(0,e.jsx)(a,{delay:250,children:(0,e.jsxs)("div",{className:"commitment-box",children:[(0,e.jsx)("div",{className:"commitment-accent"}),(0,e.jsx)("h3",{children:"Incident Response Commitment"}),(0,e.jsx)("p",{children:"If a potential vulnerability layer or unsanctioned system data shift is flagged, our infrastructure response protocol mobilizes instantly. Operational engineering teams isolate anomalous traffic signatures immediately, establishing containment controls and detailing mitigation parameters."})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(a,{delay:300,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Contact"})]}),(0,e.jsx)("h2",{children:"Disclosures & Inquiries"}),(0,e.jsxs)("div",{className:"contact-box",children:[(0,e.jsx)("p",{children:"Have you identified a potential risk profile or require clarification regarding enterprise infrastructure configurations?"}),(0,e.jsxs)("p",{children:["Reach our response desk directly at"," ",(0,e.jsx)("a",{href:"mailto:security@restpoint.co.ke",className:"contact-email",children:"security@restpoint.co.ke"})]}),(0,e.jsx)("p",{className:"contact-note",children:"Vulnerability reports receive high-priority engineer reviews within 24 hours."})]})]})}),(0,e.jsxs)("footer",{className:"policy-footer",children:[(0,e.jsx)("span",{children:"© 2026 Rest Point. All rights reserved."}),(0,e.jsxs)("div",{className:"footer-links",children:[(0,e.jsx)("button",{className:"footer-link",onClick:()=>t("/privacy"),children:"Privacy Policy"}),(0,e.jsx)("button",{className:"footer-link",onClick:()=>t("/terms"),children:"Terms of Service"}),(0,e.jsx)("button",{className:"footer-link",onClick:()=>t("/contact"),children:"Contact"})]})]})]})})]}),(0,e.jsx)("script",{children:`
                const nav = document.getElementById('policy-nav');
                window.addEventListener('scroll', () => {
                    nav.classList.toggle('scrolled', window.scrollY > 50);
                }, { passive: true });
            `})]})}export{y as default};
