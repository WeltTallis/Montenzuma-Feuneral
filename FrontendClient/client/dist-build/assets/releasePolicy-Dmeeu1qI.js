import{r as d}from"./chunk-CXHxssQy.js";import{y as p}from"./chunk-CXAmgOhv.js";import{l as m}from"./chunk-DWc5g_hH.js";import{o as h}from"./chunk-BY9AVXEY.js";import"./chunk-CRj2PfMo.js";var c=d(p(),1),e=h(),r={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",grayDark:"#4A4844",accent:"#C77B5E"};function g(){const n=(0,c.useRef)(null),[s,t]=(0,c.useState)(!1);return(0,c.useEffect)(()=>{const i=n.current;if(!i)return;const a=new IntersectionObserver(([l])=>{l.isIntersecting&&(t(!0),a.disconnect())},{threshold:.1});return a.observe(i),()=>a.disconnect()},[]),[n,s]}var o=({children:n,delay:s=0,style:t={},className:i=""})=>{const[a,l]=g();return(0,e.jsx)("div",{ref:a,className:i,style:{opacity:l?1:0,transform:l?"translateY(0)":"translateY(24px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${s}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${s}ms`,...t},children:n})},x=({size:n=28,color:s=r.verdigris})=>(0,e.jsxs)("svg",{width:n,height:n,viewBox:"0 0 32 32",fill:"none",style:{flexShrink:0},children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:s,strokeWidth:"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:s,strokeWidth:"1.5",strokeLinecap:"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:s})]});function j(){const n=m(),s=()=>{window.scrollTo({top:0,behavior:"smooth"}),n("/")},t=[{label:"Morning Block",value:"Before 9:00 AM",icon:(0,e.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"5"}),(0,e.jsx)("line",{x1:"12",y1:"1",x2:"12",y2:"3"}),(0,e.jsx)("line",{x1:"12",y1:"21",x2:"12",y2:"23"}),(0,e.jsx)("line",{x1:"4.22",y1:"4.22",x2:"5.64",y2:"5.64"}),(0,e.jsx)("line",{x1:"18.36",y1:"18.36",x2:"19.78",y2:"19.78"}),(0,e.jsx)("line",{x1:"1",y1:"12",x2:"3",y2:"12"}),(0,e.jsx)("line",{x1:"21",y1:"12",x2:"23",y2:"12"}),(0,e.jsx)("line",{x1:"4.22",y1:"19.78",x2:"5.64",y2:"18.36"}),(0,e.jsx)("line",{x1:"18.36",y1:"5.64",x2:"19.78",y2:"4.22"})]})},{label:"Evening Block",value:"After 4:00 PM",icon:(0,e.jsx)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"})})},{label:"Weekend Block",value:"Saturdays & Sundays",icon:(0,e.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),(0,e.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,e.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,e.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; color: ${r.gray}; background: ${r.bone}; -webkit-font-smoothing: antialiased; }

        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -0.01em; color: ${r.ink}; }
        h1 { font-size: clamp(2.2rem, 5vw, 3rem); line-height: 1.08; }
        h2 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); line-height: 1.25; margin-bottom: 0.8rem; }
        h3 { font-size: 1.05rem; line-height: 1.35; margin-bottom: 0.5rem; }
        p { line-height: 1.75; font-size: 0.95rem; margin-bottom: 1rem; }
        a { color: inherit; }
        strong { color: ${r.ink}; font-weight: 600; }

        .label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${r.brass}; font-weight: 500; }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 2.5rem); }

        /* ── Nav ── */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(250,248,244,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid ${r.line};
          padding: 1.2rem 0; transition: all 0.4s ease;
        }
        nav.scrolled { background: rgba(250,248,244,0.96); box-shadow: 0 1px 12px rgba(21,23,26,0.06); }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.7rem; font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 500; color: ${r.ink}; cursor: pointer; transition: opacity 0.3s; text-decoration: none; }
        .logo:hover { opacity: 0.8; }
        .nav-links { display: flex; gap: 2.5rem; align-items: center; list-style: none; }
        .nav-links a { font-size: 0.85rem; color: ${r.gray}; text-decoration: none; transition: color 0.2s; position: relative; padding: 0.5rem 0; }
        .nav-links a::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1.5px; background: ${r.verdigris}; transition: width 0.3s ease; }
        .nav-links a:hover { color: ${r.verdigris}; }
        .nav-links a:hover::after { width: 100%; }
        .nav-cta { display: flex; gap: 0.75rem; }

        /* ── Hero Banner ── */
        .hero-banner {
          background: ${r.verdigrisDark};
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
        .hero-banner h1 { color: ${r.bone}; margin: 0 0 1rem 0; }
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
        main { background: ${r.bone}; }
        .content-area { padding: clamp(3rem, 6vw, 5rem) 0; }

        .section { margin-top: 3.5rem; }
        .section:first-child { margin-top: 0; }
        .section-divider { height: 1px; background: ${r.line}; margin: 3rem 0; }

        .section-label {
          display: inline-flex; align-items: center; gap: 0.6rem;
          margin-bottom: 1.5rem;
        }
        .section-label-line { width: 24px; height: 1px; background: ${r.line}; }

        /* ── Philosophy Box ── */
        .philosophy-box {
          background: ${r.white}; border: 1px solid ${r.line};
          border-radius: 16px; padding: clamp(1.8rem, 3vw, 2.2rem);
          position: relative; overflow: hidden;
        }
        .philosophy-box::before {
          content: ''; position: absolute; top: 0; left: 0; bottom: 0;
          width: 4px; background: linear-gradient(180deg, ${r.verdigris}, ${r.brass});
          border-radius: 4px 0 0 4px;
        }
        .philosophy-box h2 { margin-top: 0; }

        /* ── Release Type Cards ── */
        .type-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1rem; margin: 2rem 0;
        }
        .type-card {
          background: ${r.white}; border: 1px solid ${r.line};
          border-radius: 14px; padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .type-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${r.verdigris}, transparent);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .type-card:hover {
          border-color: rgba(61,79,71,0.25);
          transform: translateY(-3px);
          box-shadow: 0 10px 28px -6px rgba(61,79,71,0.1), 0 0 0 1px rgba(61,79,71,0.06);
        }
        .type-card:hover::before { opacity: 1; }
        .type-number {
          font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
          color: ${r.verdigris}; letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 0.6rem; opacity: 0.7;
        }
        .type-title {
          font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
          color: ${r.ink}; margin-bottom: 0.45rem; letter-spacing: -0.01em;
        }
        .type-desc { font-size: 0.88rem; color: ${r.gray}; line-height: 1.65; margin: 0; }

        /* ── Schedule Cards ── */
        .schedule-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1rem; margin: 2rem 0;
        }
        .schedule-card {
          background: ${r.white}; border: 1px solid ${r.line};
          border-radius: 14px; padding: 1.6rem;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .schedule-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${r.brass}, transparent);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .schedule-card:hover {
          border-color: rgba(139,115,85,0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px -8px rgba(139,115,85,0.12), 0 0 0 1px rgba(139,115,85,0.08);
        }
        .schedule-card:hover::before { opacity: 1; }
        .schedule-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: ${r.bone2}; color: ${r.brass};
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.1rem; transition: all 0.4s ease;
        }
        .schedule-card:hover .schedule-icon {
          background: ${r.brass}; color: ${r.bone};
          box-shadow: 0 4px 16px rgba(139,115,85,0.25);
        }
        .schedule-value {
          font-family: 'Inter', sans-serif; font-size: 1.05rem; font-weight: 600;
          color: ${r.ink}; margin-top: 0.3rem; letter-spacing: -0.01em;
        }

        /* ── Quote Box ── */
        .quote-box {
          background: ${r.verdigrisDark}; border-radius: 16px;
          padding: clamp(2rem, 3vw, 2.5rem);
          margin: 3rem 0; position: relative; overflow: hidden;
        }
        .quote-box::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(250,248,244,0.04) 1px, transparent 1px);
          background-size: 24px 24px; pointer-events: none;
        }
        .quote-box::after {
          content: ''; position: absolute; bottom: -80px; right: -80px;
          width: 250px; height: 250px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,115,85,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .quote-box > * { position: relative; z-index: 1; }
        .quote-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, ${r.verdigrisLight}, ${r.brass}, ${r.verdigrisLight});
          background-size: 200% 100%; animation: grad-shift 4s ease infinite;
        }
        .quote-mark {
          font-family: 'Fraunces', serif; font-size: 3rem; line-height: 1;
          color: rgba(250,248,244,0.1); margin-bottom: 0.5rem;
        }
        .quote-text {
          color: rgba(250,248,244,0.75); font-size: 1.1rem; line-height: 1.7;
          font-family: 'Fraunces', serif; font-style: italic; margin: 0;
        }

        /* ── Note Box ── */
        .note-box {
          background: ${r.bone2}; border: 1px solid ${r.line};
          border-radius: 10px; padding: 1rem 1.2rem;
          margin-top: 1.5rem; font-size: 0.88rem;
          color: ${r.grayDark}; line-height: 1.65;
          display: flex; align-items: flex-start; gap: 0.7rem;
        }
        .note-icon {
          flex-shrink: 0; width: 18px; height: 18px;
          color: ${r.brass}; margin-top: 2px;
        }

        /* ── Sign-off ── */
        .signoff-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1rem; margin-top: 2rem;
        }
        .signoff-card {
          background: ${r.white}; border: 1px solid ${r.line};
          border-radius: 14px; padding: 1.6rem;
          transition: all 0.3s ease;
        }
        .signoff-card:hover {
          border-color: rgba(61,79,71,0.2);
          box-shadow: 0 6px 20px -4px rgba(21,23,26,0.06);
        }
        .signoff-name {
          font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 600;
          color: ${r.ink}; margin-top: 0.4rem; letter-spacing: -0.01em;
        }
        .signoff-role { font-size: 0.85rem; color: ${r.gray}; margin: 0; }

        /* ── Footer ── */
        .policy-footer {
          margin-top: 4rem; padding: 2rem 0;
          border-top: 1px solid ${r.line};
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 1rem;
        }
        .policy-footer span { font-size: 0.82rem; color: ${r.grayDark}; opacity: 0.6; }
        .footer-links { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .footer-link {
          font-size: 0.82rem; color: ${r.gray}; text-decoration: none;
          padding: 0.55rem 1.1rem; border: 1px solid ${r.line};
          border-radius: 8px; transition: all 0.25s ease;
          font-family: 'Inter', sans-serif; background: none; cursor: pointer;
        }
        .footer-link:hover {
          background: ${r.ink}; color: ${r.bone}; border-color: ${r.ink};
        }

        @keyframes grad-shift { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }

        @media (max-width: 768px) {
          .nav-links, .nav-cta { display: none; }
          .type-grid { grid-template-columns: 1fr; }
          .schedule-grid { grid-template-columns: 1fr; }
          .signoff-grid { grid-template-columns: 1fr; }
          .policy-footer { flex-direction: column; align-items: flex-start; }
          .footer-links { width: 100%; }
          .footer-link { flex: 1; text-align: center; justify-content: center; }
        }
      `}),(0,e.jsx)("nav",{id:"release-nav",children:(0,e.jsxs)("div",{className:"wrap nav-wrap",children:[(0,e.jsxs)("a",{href:"/",className:"logo",onClick:i=>{i.preventDefault(),s()},children:[(0,e.jsx)(x,{size:28}),"Rest Point"]}),(0,e.jsxs)("ul",{className:"nav-links",children:[(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/",onClick:i=>{i.preventDefault(),s()},children:"Home"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/privacy",onClick:i=>{i.preventDefault(),n("/privacy")},children:"Privacy"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/terms",onClick:i=>{i.preventDefault(),n("/terms")},children:"Terms"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/sla",onClick:i=>{i.preventDefault(),n("/sla")},children:"SLA"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/security",onClick:i=>{i.preventDefault(),n("/security")},children:"Security"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/blog",onClick:i=>{i.preventDefault(),n("/blog")},children:"Blog"})}),(0,e.jsx)("li",{children:(0,e.jsx)("a",{href:"/contact",onClick:i=>{i.preventDefault(),n("/contact")},children:"Contact"})})]}),(0,e.jsx)("div",{className:"nav-cta",children:(0,e.jsx)("button",{className:"footer-link",onClick:s,style:{padding:"0.5rem 1rem",fontSize:"0.8rem"},children:"← Back"})})]})}),(0,e.jsxs)("main",{children:[(0,e.jsxs)("div",{className:"hero-banner",children:[(0,e.jsx)("div",{className:"hero-banner-grid"}),(0,e.jsx)("div",{className:"hero-banner-glow"}),(0,e.jsx)("div",{className:"hero-banner-glow2"}),(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("button",{className:"back-link",onClick:s,children:[(0,e.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M19 12H5M12 19l-7-7 7-7"})}),"Back to Home"]}),(0,e.jsxs)(o,{children:[(0,e.jsx)("span",{className:"label meta",style:{display:"block",marginBottom:"1.5rem"},children:"Engineering · Release Management"}),(0,e.jsx)("h1",{children:"Release Management Policy"}),(0,e.jsx)("p",{className:"subtitle",children:"How we ship updates to production  planned, tested, and zero-disruption."})]})]})]}),(0,e.jsx)("div",{className:"content-area",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)(o,{children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Philosophy"})]}),(0,e.jsxs)("div",{className:"philosophy-box",children:[(0,e.jsx)("h2",{children:"Our Approach"}),(0,e.jsxs)("p",{style:{margin:0},children:["At RestPoint, every release is designed with one objective: ",(0,e.jsx)("strong",{children:"Improve the platform without disrupting your operations."})," Every update is planned, thoroughly tested, and reviewed before deployment. We prioritize stability, security, and absolute reliability over frequent, volatile releases."]})]})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(o,{delay:100,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Classifications"})]}),(0,e.jsx)("h2",{children:"What We Release"}),(0,e.jsx)("p",{children:"To keep RestPoint operating at peak performance, engineering artifacts are structured across four core classifications:"}),(0,e.jsx)("div",{className:"type-grid",children:[{title:"Security Updates",desc:"Protocols and hotfixes deployed to continuously safeguard your platform and sensitive records."},{title:"Bug Fixes",desc:"Targeted structural resolutions designed to eliminate technical friction and enhance platform reliability."},{title:"Feature Releases",desc:"New functional pipelines, workflows, and tools developed directly from partner funeral home feedback."},{title:"Maintenance Updates",desc:"Code optimizations, underlying infrastructure scalability tweaks, and engine tuning."}].map((i,a)=>(0,e.jsxs)("div",{className:"type-card",children:[(0,e.jsxs)("div",{className:"type-number",children:["Type ",String(a+1).padStart(2,"0")]}),(0,e.jsx)("div",{className:"type-title",children:i.title}),(0,e.jsx)("p",{className:"type-desc",children:i.desc})]},a))})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(o,{delay:150,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Schedule"})]}),(0,e.jsx)("h2",{children:"Release Windows"}),(0,e.jsx)("p",{children:"To shield your day-to-day work from interruptions, deployments are restricted to off-peak periods whenever possible:"}),(0,e.jsx)("div",{className:"schedule-grid",children:t.map((i,a)=>(0,e.jsxs)("div",{className:"schedule-card",children:[(0,e.jsx)("div",{className:"schedule-icon",children:i.icon}),(0,e.jsx)("div",{className:"label",style:{fontSize:"0.65rem"},children:i.label}),(0,e.jsx)("div",{className:"schedule-value",children:i.value})]},a))}),(0,e.jsxs)("div",{className:"note-box",children:[(0,e.jsxs)("svg",{className:"note-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,e.jsx)("line",{x1:"12",y1:"16",x2:"12",y2:"12"}),(0,e.jsx)("line",{x1:"12",y1:"8",x2:"12.01",y2:"8"})]}),(0,e.jsx)("span",{children:"Critical threat mitigation or severe infrastructure security anomalies may bypass standard windows and be deployed immediately to secure platform integrity."})]})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(o,{delay:200,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Quality"})]}),(0,e.jsx)("h2",{children:"Quality Assurance & Rollback Strategy"}),(0,e.jsx)("p",{children:"Every artifact undergoes multi-stage continuous integration (CI) pipelines, isolated staging validation, and meticulous automated testing suites before hitting production."}),(0,e.jsx)("p",{children:"In the rare event that an unforeseen regression surfaces post-deployment, our infrastructure utilizes a zero-downtime rollback strategy. We can instantly revert the environment to its last-known-stable state to guarantee operational continuity."})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(o,{delay:250,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Transparency"})]}),(0,e.jsx)("h2",{children:"Communications & Transparency"}),(0,e.jsx)("p",{children:"We believe in transparent engineering. Major architectural milestones, new module additions, or planned infrastructure expansions are broadcast to user administrators well in advance, accompanied by comprehensive release manifests. Minor patches, hotfixes, or performance optimizations are seamlessly introduced in the background without requiring user intervention."})]})}),(0,e.jsx)(o,{delay:300,children:(0,e.jsxs)("div",{className:"quote-box",children:[(0,e.jsx)("div",{className:"quote-accent"}),(0,e.jsx)("div",{className:"quote-mark",children:'"'}),(0,e.jsx)("p",{className:"quote-text",children:"Software should make your work easier — not interrupt it. That principle guides every single release we ship to production."})]})}),(0,e.jsx)("div",{className:"section-divider"}),(0,e.jsx)(o,{delay:350,children:(0,e.jsxs)("div",{className:"section",children:[(0,e.jsxs)("div",{className:"section-label",children:[(0,e.jsx)("div",{className:"section-label-line"}),(0,e.jsx)("span",{className:"label",children:"Governance"})]}),(0,e.jsx)("h2",{children:"Engineering Sign-off"}),(0,e.jsxs)("div",{className:"signoff-grid",children:[(0,e.jsxs)("div",{className:"signoff-card",children:[(0,e.jsx)("div",{className:"label",style:{fontSize:"0.65rem"},children:"Prepared By"}),(0,e.jsx)("div",{className:"signoff-name",children:"Mumo Lead"}),(0,e.jsx)("p",{className:"signoff-role",children:"Lead Software Engineer"})]}),(0,e.jsxs)("div",{className:"signoff-card",children:[(0,e.jsx)("div",{className:"label",style:{fontSize:"0.65rem"},children:"Reviewed & Approved By"}),(0,e.jsx)("div",{className:"signoff-name",children:"Welt Tallis"}),(0,e.jsx)("p",{className:"signoff-role",children:"Chief Technology Officer (CTO)"})]})]})]})}),(0,e.jsxs)("footer",{className:"policy-footer",children:[(0,e.jsx)("span",{children:"© 2026 Rest Point. All rights reserved."}),(0,e.jsxs)("div",{className:"footer-links",children:[(0,e.jsx)("button",{className:"footer-link",onClick:()=>n("/privacy"),children:"Privacy Policy"}),(0,e.jsx)("button",{className:"footer-link",onClick:()=>n("/terms"),children:"Terms of Service"}),(0,e.jsx)("button",{className:"footer-link",onClick:()=>n("/contact"),children:"Contact"})]})]})]})})]}),(0,e.jsx)("script",{children:`
        const nav = document.getElementById('release-nav');
        window.addEventListener('scroll', () => {
          nav.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
      `})]})}export{j as default};
