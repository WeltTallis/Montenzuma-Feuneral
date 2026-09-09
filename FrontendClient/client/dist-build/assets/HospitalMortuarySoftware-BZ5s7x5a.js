import{r as x}from"./chunk-CXHxssQy.js";import{y}from"./chunk-CXAmgOhv.js";import{r as o}from"./chunk-DWc5g_hH.js";import{j as v}from"./chunk-CwzAxjA3.js";import{o as j}from"./chunk-BY9AVXEY.js";import{$ as w,A as p,Pt as k,S as $,Un as u,W as h,lt as N,m as z,mn as H,rt as D,ut as L,wn as M,xt as S,y as b}from"./index-D6gguvjv.js";var g=x(y(),1),e=j(),a={ink:"#000000",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(255,255,255,0.08)",lineDarkHover:"rgba(255,255,255,0.15)",gray:"#8A8780",grayLight:"rgba(255,255,255,0.6)",accent:"#C77B5E"},F=(n=.15)=>{const i=(0,g.useRef)(null),[l,r]=(0,g.useState)(!1);return(0,g.useEffect)(()=>{const s=i.current;if(!s)return;const d=new IntersectionObserver(([f])=>{f.isIntersecting&&(r(!0),d.unobserve(s))},{threshold:n});return d.observe(s),()=>d.disconnect()},[n]),[i,l]},t=({children:n,delay:i=0,className:l=""})=>{const[r,s]=F();return(0,e.jsx)("div",{ref:r,className:l,style:{opacity:s?1:0,transform:s?"translateY(0)":"translateY(40px)",transition:`opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i}ms`},children:n})},m=({children:n})=>(0,e.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",gap:"0.6rem",fontFamily:"'JetBrains Mono', monospace",fontSize:"0.72rem",letterSpacing:"0.14em",textTransform:"uppercase",color:a.brassLight,marginBottom:"1.25rem"},children:[(0,e.jsx)("span",{style:{width:24,height:1,background:a.brass,display:"inline-block"}}),n]}),c=({children:n,sub:i})=>(0,e.jsxs)("div",{style:{marginBottom:"3.5rem"},children:[(0,e.jsx)("h2",{style:{fontFamily:"'Fraunces', serif",fontSize:"clamp(1.8rem, 4vw, 2.8rem)",color:a.bone,fontWeight:500,lineHeight:1.2,letterSpacing:"-0.02em",marginBottom:i?"1rem":0},children:n}),i&&(0,e.jsx)("p",{style:{fontSize:"1.05rem",color:a.grayLight,lineHeight:1.7,maxWidth:620,opacity:.8},children:i})]}),A=()=>{const n=[{icon:(0,e.jsx)(z,{size:22}),title:"HIS Integration",desc:"Seamlessly integrate with hospital information systems for automatic patient data transfer, reducing manual entry and ensuring data accuracy across departments."},{icon:(0,e.jsx)(M,{size:22}),title:"Multi-Cold Room Management",desc:"Monitor and manage multiple cold rooms with different temperature zones. Track body locations, storage duration, and capacity in real-time."},{icon:(0,e.jsx)(N,{size:22}),title:"Autopsy & Pathology Tracking",desc:"Manage autopsy requests, track pathology samples, and coordinate with laboratory systems for comprehensive case documentation."},{icon:(0,e.jsx)(u,{size:22}),title:"High-Volume Case Handling",desc:"Handle peak loads during emergencies, epidemics, or disasters with batch processing, queue management, and priority case handling."},{icon:(0,e.jsx)(L,{size:22}),title:"Identity Verification",desc:"Implement robust identification protocols with biometric verification, photo documentation, and next-of-kin confirmation workflows."},{icon:(0,e.jsx)($,{size:22}),title:"Compliance & Reporting",desc:"Generate mandatory reports for health authorities, track notifiable diseases, and maintain compliance with Kenyan healthcare regulations."}],i=[{icon:(0,e.jsx)(p,{size:24}),title:"Healthcare-Focused",desc:"Purpose-built for hospital environments with integration capabilities for HIS, EHR, and laboratory information management systems.",stat:"12+",statLabel:"HIS integrations"},{icon:(0,e.jsx)(u,{size:24}),title:"High Performance",desc:"Handle thousands of cases annually with our robust, scalable platform designed for high-volume hospital mortuary operations.",stat:"50K+",statLabel:"Cases managed"},{icon:(0,e.jsx)(k,{size:24}),title:"HIPAA & Data Protection",desc:"Meet healthcare data protection requirements with end-to-end encryption, audit trails, and role-based access controls.",stat:"256-bit",statLabel:"Encryption"},{icon:(0,e.jsx)(Monitor,{size:24}),title:"Real-Time Dashboards",desc:"Give hospital administrators real-time visibility into mortuary operations, capacity, and performance metrics.",stat:"<2s",statLabel:"Data refresh"}],l=[{icon:(0,e.jsx)(p,{size:20}),title:"National Hospitals",desc:"Kenyatta National Hospital, Moi Teaching and Referral Hospital, and other major hospitals use Rest Point to manage complex mortuary operations.",tag:"Level 6"},{icon:(0,e.jsx)(S,{size:20}),title:"County Hospitals",desc:"County referral hospitals across Kenya rely on our software to standardize mortuary operations and improve service delivery.",tag:"Level 5"},{icon:(0,e.jsx)(H,{size:20}),title:"Private Hospitals",desc:"Private healthcare facilities use Rest Point to provide premium mortuary services while maintaining operational efficiency.",tag:"Private"},{icon:(0,e.jsx)(w,{size:20}),title:"Mission Hospitals",desc:"Faith-based and mission hospitals trust Rest Point for affordable, reliable mortuary management that aligns with their service mission.",tag:"Faith-Based"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(v,{children:[(0,e.jsx)("title",{children:"Hospital Mortuary Software Kenya | Modern Morgue Management System"}),(0,e.jsx)("meta",{name:"description",content:"Rest Point is Kenya's leading hospital mortuary software and morgue management system. Purpose-built for hospital morgues with mortuary technology, case tracking, and compliance management. Trusted by major hospitals in Nairobi, Mombasa, Kisumu."}),(0,e.jsx)("meta",{name:"keywords",content:"hospital mortuary software, hospital morgue software, mortuary technology, morgue management system, mortuary software, mortuary case management, hospital mortuary system, best mortuary software kenya, mortuary information system"}),(0,e.jsx)("link",{rel:"canonical",href:"https://restpoint.co.ke/hospital-mortuary-software"})]}),(0,e.jsxs)("div",{className:"hms-page",children:[(0,e.jsx)("style",{children:`
                    /* ── Base ── */
                    .hms-page {
                        background: #000;
                        color: ${a.grayLight};
                        font-family: 'Inter', sans-serif;
                        overflow-x: hidden;
                    }
                    .hms-page .hms-container {
                        max-width: 1180px;
                        margin: 0 auto;
                        padding: 0 clamp(1.25rem, 5vw, 2.5rem);
                    }
                    .hms-page a { text-decoration: none; }

                    /* ── Hero ── */
                    .hms-hero {
                        position: relative;
                        padding: clamp(6rem, 12vw, 10rem) 0 clamp(5rem, 10vw, 8rem);
                        overflow: hidden;
                    }
                    .hms-hero-glow {
                        position: absolute; inset: 0;
                        background:
                            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(61,79,71,0.35) 0%, transparent 70%),
                            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(139,115,85,0.12) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-hero-grid {
                        position: absolute; inset: 0;
                        background-image:
                            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
                        background-size: 48px 48px;
                        mask-image: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 70%);
                        -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-hero-line {
                        position: absolute;
                        bottom: 0; left: 0; right: 0;
                        height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-hero-content {
                        position: relative; z-index: 2;
                        max-width: 800px;
                    }
                    .hms-hero-breadcrumb {
                        display: inline-flex; align-items: center; gap: 0.5rem;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.72rem; color: ${a.grayLight}; opacity: 0.6;
                        margin-bottom: 2rem; letter-spacing: 0.02em;
                    }
                    .hms-hero-breadcrumb a { color: ${a.brassLight}; transition: color 0.2s; }
                    .hms-hero-breadcrumb a:hover { color: ${a.bone}; }
                    .hms-hero h1 {
                        font-family: 'Fraunces', serif;
                        font-size: clamp(2.2rem, 5.5vw, 3.6rem);
                        color: ${a.bone};
                        font-weight: 500;
                        line-height: 1.1;
                        letter-spacing: -0.03em;
                        margin-bottom: 1.25rem;
                    }
                    .hms-hero h1 span {
                        background: linear-gradient(135deg, ${a.brassLight}, ${a.accent});
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .hms-hero-subtitle {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.85rem;
                        color: ${a.verdigrisLight};
                        margin-bottom: 1.5rem;
                        letter-spacing: 0.04em;
                    }
                    .hms-hero-desc {
                        font-size: 1.05rem;
                        color: ${a.grayLight};
                        line-height: 1.8;
                        opacity: 0.8;
                        margin-bottom: 2.5rem;
                        max-width: 640px;
                    }
                    .hms-hero-desc strong { color: ${a.bone}; font-weight: 500; }
                    .hms-hero-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }

                    .hms-btn-primary {
                        display: inline-flex; align-items: center; gap: 0.5rem;
                        background: ${a.brass}; color: ${a.bone}; border: none;
                        padding: 0.85rem 2rem; border-radius: 8px;
                        font-size: 0.9rem; font-weight: 600; cursor: pointer;
                        font-family: 'Inter', sans-serif;
                        transition: all 0.25s ease;
                    }
                    .hms-btn-primary:hover { background: ${a.brassLight}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,115,85,0.3); }

                    .hms-btn-outline {
                        display: inline-flex; align-items: center; gap: 0.5rem;
                        background: transparent; color: ${a.grayLight};
                        border: 1px solid ${a.lineDark}; padding: 0.85rem 2rem;
                        border-radius: 8px; font-size: 0.9rem; font-weight: 500;
                        cursor: pointer; font-family: 'Inter', sans-serif;
                        transition: all 0.25s ease;
                    }
                    .hms-btn-outline:hover { border-color: ${a.grayLight}; color: ${a.bone}; transform: translateY(-2px); }

                    /* ── Floating stats in hero ── */
                    .hms-hero-stats {
                        position: absolute;
                        right: clamp(1.25rem, 5vw, 2.5rem);
                        top: 50%; transform: translateY(-50%);
                        display: flex; flex-direction: column; gap: 1.25rem;
                        z-index: 2;
                    }
                    .hms-hero-stat {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid ${a.lineDark};
                        border-radius: 10px;
                        padding: 1rem 1.25rem;
                        text-align: right;
                        min-width: 160px;
                        backdrop-filter: blur(8px);
                        transition: all 0.3s ease;
                    }
                    .hms-hero-stat:hover { border-color: ${a.lineDarkHover}; background: rgba(255,255,255,0.05); }
                    .hms-hero-stat-value {
                        font-family: 'Fraunces', serif;
                        font-size: 1.6rem; color: ${a.bone};
                        font-weight: 500; line-height: 1;
                    }
                    .hms-hero-stat-label {
                        font-size: 0.72rem; color: ${a.grayLight};
                        opacity: 0.6; margin-top: 0.3rem;
                    }

                    /* ── What Is Section ── */
                    .hms-what {
                        padding: clamp(4rem, 8vw, 7rem) 0;
                        position: relative;
                    }
                    .hms-what-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 4rem;
                        align-items: start;
                    }
                    .hms-what-text p {
                        font-size: 1rem; line-height: 1.8;
                        color: ${a.grayLight}; opacity: 0.8;
                        margin-bottom: 1.25rem;
                    }
                    .hms-what-text p strong { color: ${a.bone}; font-weight: 500; }
                    .hms-what-visual {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid ${a.lineDark};
                        border-radius: 14px;
                        padding: 2rem;
                        position: relative;
                        overflow: hidden;
                    }
                    .hms-what-visual::before {
                        content: '';
                        position: absolute; top: -50%; right: -50%;
                        width: 200%; height: 200%;
                        background: radial-gradient(circle at 70% 30%, rgba(61,79,71,0.12) 0%, transparent 50%);
                        pointer-events: none;
                    }
                    .hms-what-visual-item {
                        display: flex; align-items: flex-start; gap: 1rem;
                        padding: 1rem 0;
                        border-bottom: 1px solid ${a.lineDark};
                        position: relative;
                    }
                    .hms-what-visual-item:last-child { border-bottom: none; }
                    .hms-what-visual-num {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.7rem; color: ${a.brassLight};
                        background: rgba(139,115,85,0.12);
                        border: 1px solid rgba(139,115,85,0.2);
                        width: 28px; height: 28px; border-radius: 6px;
                        display: flex; align-items: center; justify-content: center;
                        flex-shrink: 0; margin-top: 2px;
                    }
                    .hms-what-visual-title {
                        font-size: 0.9rem; color: ${a.bone};
                        font-weight: 500; margin-bottom: 0.25rem;
                    }
                    .hms-what-visual-desc {
                        font-size: 0.82rem; color: ${a.grayLight};
                        opacity: 0.7; line-height: 1.6;
                    }

                    /* ── Features ── */
                    .hms-features {
                        padding: clamp(4rem, 8vw, 7rem) 0;
                        position: relative;
                    }
                    .hms-features::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-features-glow {
                        position: absolute;
                        top: 20%; left: 50%; transform: translateX(-50%);
                        width: 600px; height: 400px;
                        background: radial-gradient(ellipse, rgba(61,79,71,0.15) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-features-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                        position: relative; z-index: 2;
                    }
                    .hms-feature-card {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid ${a.lineDark};
                        border-radius: 12px;
                        padding: 2rem;
                        transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
                        position: relative;
                        overflow: hidden;
                    }
                    .hms-feature-card::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 2px;
                        background: linear-gradient(90deg, transparent, ${a.verdigrisLight}, transparent);
                        opacity: 0; transition: opacity 0.35s ease;
                    }
                    .hms-feature-card:hover {
                        background: rgba(255,255,255,0.04);
                        border-color: ${a.lineDarkHover};
                        transform: translateY(-4px);
                    }
                    .hms-feature-card:hover::before { opacity: 1; }
                    .hms-feature-icon {
                        width: 44px; height: 44px; border-radius: 10px;
                        background: rgba(77,99,89,0.15);
                        border: 1px solid rgba(77,99,89,0.25);
                        display: flex; align-items: center; justify-content: center;
                        color: ${a.verdigrisLight};
                        margin-bottom: 1.25rem;
                        transition: all 0.35s ease;
                    }
                    .hms-feature-card:hover .hms-feature-icon {
                        background: rgba(77,99,89,0.25);
                        box-shadow: 0 0 20px rgba(77,99,89,0.2);
                    }
                    .hms-feature-card h3 {
                        font-family: 'Inter', sans-serif;
                        font-size: 1rem; color: ${a.bone};
                        font-weight: 600; margin-bottom: 0.75rem;
                    }
                    .hms-feature-card p {
                        font-size: 0.88rem; color: ${a.grayLight};
                        line-height: 1.7; opacity: 0.75;
                    }

                    /* ── Benefits ── */
                    .hms-benefits {
                        padding: clamp(4rem, 8vw, 7rem) 0;
                        position: relative;
                    }
                    .hms-benefits::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-benefits-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.5rem;
                    }
                    .hms-benefit-card {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid ${a.lineDark};
                        border-radius: 12px;
                        padding: 2rem;
                        display: flex; gap: 1.5rem;
                        align-items: flex-start;
                        transition: all 0.35s ease;
                    }
                    .hms-benefit-card:hover {
                        border-color: ${a.lineDarkHover};
                        background: rgba(255,255,255,0.035);
                    }
                    .hms-benefit-left { flex-shrink: 0; }
                    .hms-benefit-icon {
                        width: 48px; height: 48px; border-radius: 12px;
                        background: rgba(139,115,85,0.1);
                        border: 1px solid rgba(139,115,85,0.2);
                        display: flex; align-items: center; justify-content: center;
                        color: ${a.brassLight}; margin-bottom: 0.75rem;
                    }
                    .hms-benefit-stat {
                        font-family: 'Fraunces', serif;
                        font-size: 1.4rem; color: ${a.bone};
                        font-weight: 500; line-height: 1;
                    }
                    .hms-benefit-stat-label {
                        font-size: 0.7rem; color: ${a.grayLight};
                        opacity: 0.6; margin-top: 0.2rem;
                        font-family: 'JetBrains Mono', monospace;
                        letter-spacing: 0.04em;
                    }
                    .hms-benefit-right { flex: 1; }
                    .hms-benefit-card h3 {
                        font-size: 1.05rem; color: ${a.bone};
                        font-weight: 600; margin-bottom: 0.6rem;
                    }
                    .hms-benefit-card p {
                        font-size: 0.88rem; color: ${a.grayLight};
                        line-height: 1.7; opacity: 0.75;
                    }

                    /* ── Use Cases ── */
                    .hms-usecases {
                        padding: clamp(4rem, 8vw, 7rem) 0;
                        position: relative;
                    }
                    .hms-usecases::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-usecases-glow {
                        position: absolute;
                        bottom: 10%; right: 10%;
                        width: 400px; height: 400px;
                        background: radial-gradient(circle, rgba(139,115,85,0.1) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-usecases-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1.25rem;
                        position: relative; z-index: 2;
                    }
                    .hms-usecase-card {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid ${a.lineDark};
                        border-radius: 12px;
                        padding: 1.75rem 1.5rem;
                        transition: all 0.35s ease;
                        position: relative;
                        overflow: hidden;
                        display: flex; flex-direction: column;
                    }
                    .hms-usecase-card:hover {
                        border-color: ${a.lineDarkHover};
                        background: rgba(255,255,255,0.04);
                        transform: translateY(-3px);
                    }
                    .hms-usecase-tag {
                        display: inline-flex; align-self: flex-start;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.65rem; letter-spacing: 0.1em;
                        text-transform: uppercase;
                        color: ${a.verdigrisLight};
                        background: rgba(77,99,89,0.12);
                        border: 1px solid rgba(77,99,89,0.2);
                        padding: 0.25rem 0.6rem;
                        border-radius: 4px;
                        margin-bottom: 1.25rem;
                    }
                    .hms-usecase-icon {
                        width: 40px; height: 40px; border-radius: 8px;
                        background: rgba(255,255,255,0.04);
                        border: 1px solid ${a.lineDark};
                        display: flex; align-items: center; justify-content: center;
                        color: ${a.bone}; margin-bottom: 1rem;
                    }
                    .hms-usecase-card h3 {
                        font-size: 1rem; color: ${a.bone};
                        font-weight: 600; margin-bottom: 0.6rem;
                    }
                    .hms-usecase-card p {
                        font-size: 0.82rem; color: ${a.grayLight};
                        line-height: 1.65; opacity: 0.7;
                        flex: 1;
                    }

                    /* ── CTA ── */
                    .hms-cta {
                        padding: clamp(4rem, 8vw, 7rem) 0;
                        position: relative;
                    }
                    .hms-cta::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-cta-box {
                        position: relative;
                        background: linear-gradient(135deg, rgba(61,79,71,0.2) 0%, rgba(139,115,85,0.1) 100%);
                        border: 1px solid ${a.lineDark};
                        border-radius: 20px;
                        padding: clamp(3rem, 6vw, 5rem);
                        text-align: center;
                        overflow: hidden;
                    }
                    .hms-cta-box::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(ellipse 60% 50% at 30% 20%, rgba(77,99,89,0.2) 0%, transparent 70%),
                            radial-gradient(ellipse 40% 40% at 70% 80%, rgba(139,115,85,0.12) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-cta-box::after {
                        content: ''; position: absolute; inset: 0;
                        background-image:
                            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                        background-size: 32px 32px;
                        pointer-events: none;
                        mask-image: radial-gradient(ellipse 70% 70% at center, black, transparent);
                        -webkit-mask-image: radial-gradient(ellipse 70% 70% at center, black, transparent);
                    }
                    .hms-cta-content { position: relative; z-index: 2; }
                    .hms-cta-box h2 {
                        font-family: 'Fraunces', serif;
                        font-size: clamp(1.8rem, 4vw, 2.5rem);
                        color: ${a.bone}; font-weight: 500;
                        margin-bottom: 1rem; letter-spacing: -0.02em;
                    }
                    .hms-cta-box p {
                        font-size: 1.05rem; color: ${a.grayLight};
                        line-height: 1.7; opacity: 0.8;
                        max-width: 560px; margin: 0 auto 2.5rem;
                    }
                    .hms-cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

                    /* ── Related ── */
                    .hms-related {
                        padding: clamp(3rem, 6vw, 5rem) 0;
                        position: relative;
                    }
                    .hms-related::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, ${a.lineDark} 20%, ${a.lineDark} 80%, transparent);
                    }
                    .hms-related-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                    }
                    .hms-related-link {
                        display: flex; align-items: center; gap: 0.6rem;
                        padding: 1rem 1.25rem;
                        background: rgba(255,255,255,0.02);
                        border: 1px solid ${a.lineDark};
                        border-radius: 10px;
                        font-size: 0.85rem; color: ${a.grayLight};
                        transition: all 0.25s ease;
                        cursor: pointer;
                    }
                    .hms-related-link:hover {
                        background: rgba(255,255,255,0.05);
                        border-color: ${a.lineDarkHover};
                        color: ${a.bone};
                        transform: translateX(4px);
                    }
                    .hms-related-link svg { flex-shrink: 0; opacity: 0.5; transition: opacity 0.2s; }
                    .hms-related-link:hover svg { opacity: 1; }

                    /* ── Responsive ── */
                    @media (max-width: 1024px) {
                        .hms-features-grid { grid-template-columns: repeat(2, 1fr); }
                        .hms-usecases-grid { grid-template-columns: repeat(2, 1fr); }
                        .hms-hero-stats { display: none; }
                    }
                    @media (max-width: 768px) {
                        .hms-what-grid { grid-template-columns: 1fr; gap: 2.5rem; }
                        .hms-benefits-grid { grid-template-columns: 1fr; }
                        .hms-features-grid { grid-template-columns: 1fr; }
                        .hms-usecases-grid { grid-template-columns: 1fr; }
                        .hms-related-grid { grid-template-columns: 1fr; }
                        .hms-benefit-card { flex-direction: column; gap: 1rem; }
                        .hms-benefit-left { display: flex; align-items: center; gap: 1rem; }
                        .hms-benefit-icon { margin-bottom: 0; }
                    }
                `}),(0,e.jsxs)("section",{className:"hms-hero",children:[(0,e.jsx)("div",{className:"hms-hero-glow"}),(0,e.jsx)("div",{className:"hms-hero-grid"}),(0,e.jsx)("div",{className:"hms-hero-line"}),(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)("div",{className:"hms-hero-content",children:[(0,e.jsx)(t,{children:(0,e.jsxs)("div",{className:"hms-hero-breadcrumb",children:[(0,e.jsx)(o,{to:"/",children:"Home"}),(0,e.jsx)(h,{size:12}),(0,e.jsx)(o,{to:"/mortuary-management-software",children:"Mortuary Software"}),(0,e.jsx)(h,{size:12}),(0,e.jsx)("span",{children:"Hospital"})]})}),(0,e.jsx)(t,{delay:80,children:(0,e.jsxs)("h1",{children:[(0,e.jsx)("span",{children:"Hospital Mortuary"}),(0,e.jsx)("br",{}),"Software Kenya"]})}),(0,e.jsx)(t,{delay:160,children:(0,e.jsx)("div",{className:"hms-hero-subtitle",children:"Modern Morgue Management System for Healthcare Facilities"})}),(0,e.jsx)(t,{delay:240,children:(0,e.jsxs)("p",{className:"hms-hero-desc",children:["Rest Point is Kenya's premier ",(0,e.jsx)("strong",{children:"hospital mortuary software"}),", designed specifically for hospital morgues and healthcare facilities. Our comprehensive ",(0,e.jsx)("strong",{children:"morgue management system"}),"combines mortuary technology with healthcare compliance to deliver a complete",(0,e.jsx)("strong",{children:" mortuary information system"})," that meets the unique demands of hospital operations."]})}),(0,e.jsx)(t,{delay:320,children:(0,e.jsxs)("div",{className:"hms-hero-buttons",children:[(0,e.jsxs)(o,{to:"/register",className:"hms-btn-primary",children:["Request Demo ",(0,e.jsx)(b,{size:16})]}),(0,e.jsx)(o,{to:"/contact",className:"hms-btn-outline",children:"Contact Sales"})]})})]}),(0,e.jsxs)("div",{className:"hms-hero-stats",children:[(0,e.jsx)(t,{delay:400,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"98.7%"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"Uptime SLA"})]})}),(0,e.jsx)(t,{delay:500,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"4.2s"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"Avg. Admission"})]})}),(0,e.jsx)(t,{delay:600,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"0"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"Identity Errors"})]})})]})]})]}),(0,e.jsx)("section",{className:"hms-what",children:(0,e.jsx)("div",{className:"hms-container",children:(0,e.jsxs)("div",{className:"hms-what-grid",children:[(0,e.jsxs)("div",{className:"hms-what-text",children:[(0,e.jsxs)(t,{children:[(0,e.jsx)(m,{children:"Overview"}),(0,e.jsx)(c,{sub:"Purpose-built for the complexity of hospital-based mortuary operations across Kenya.",children:"What is Hospital Mortuary Software?"})]}),(0,e.jsx)(t,{delay:100,children:(0,e.jsxs)("p",{children:[(0,e.jsx)("strong",{children:"Hospital mortuary software"})," is a specialized digital solution designed to manage the unique requirements of hospital-based morgues. Unlike generic mortuary software,",(0,e.jsx)("strong",{children:" hospital morgue software"})," must integrate with hospital systems, handle high-volume cases, manage multiple cold rooms, and comply with healthcare regulations."]})}),(0,e.jsx)(t,{delay:200,children:(0,e.jsxs)("p",{children:["Modern ",(0,e.jsx)("strong",{children:"mortuary technology"})," for hospitals includes features like integration with hospital information systems (HIS), electronic health records (EHR), pathology lab systems, and billing departments. Rest Point's ",(0,e.jsx)("strong",{children:"mortuary case management"})," capabilities ensure seamless coordination between the mortuary and other hospital departments."]})})]}),(0,e.jsx)("div",{className:"hms-what-visual",children:(0,e.jsx)(t,{delay:200,children:[{num:"01",title:"HIS / EHR Integration",desc:"Bidirectional data sync with hospital systems"},{num:"02",title:"Cold Room IoT Monitoring",desc:"Real-time temperature & capacity tracking"},{num:"03",title:"Pathology Lab Coordination",desc:"Sample tracking & autopsy workflow"},{num:"04",title:"Regulatory Compliance",desc:"Automated reports for health authorities"},{num:"05",title:"Multi-Department Billing",desc:"Unified invoicing across hospital units"}].map((r,s)=>(0,e.jsxs)("div",{className:"hms-what-visual-item",children:[(0,e.jsx)("div",{className:"hms-what-visual-num",children:r.num}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"hms-what-visual-title",children:r.title}),(0,e.jsx)("div",{className:"hms-what-visual-desc",children:r.desc})]})]},s))})})]})})}),(0,e.jsxs)("section",{className:"hms-features",children:[(0,e.jsx)("div",{className:"hms-features-glow"}),(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(t,{children:[(0,e.jsx)(m,{children:"Capabilities"}),(0,e.jsx)(c,{sub:"Every feature designed around the realities of hospital mortuary operations.",children:"Key Features of Our Hospital Mortuary Management System"})]}),(0,e.jsx)("div",{className:"hms-features-grid",children:n.map((r,s)=>(0,e.jsx)(t,{delay:s*80,children:(0,e.jsxs)("div",{className:"hms-feature-card",children:[(0,e.jsx)("div",{className:"hms-feature-icon",children:r.icon}),(0,e.jsx)("h3",{children:r.title}),(0,e.jsx)("p",{children:r.desc})]})},s))})]})]}),(0,e.jsx)("section",{className:"hms-benefits",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(t,{children:[(0,e.jsx)(m,{children:"Advantages"}),(0,e.jsx)(c,{sub:"Four pillars that set Rest Point apart for healthcare facilities.",children:"Why Choose Rest Point for Hospital Morgues?"})]}),(0,e.jsx)("div",{className:"hms-benefits-grid",children:i.map((r,s)=>(0,e.jsx)(t,{delay:s*100,children:(0,e.jsxs)("div",{className:"hms-benefit-card",children:[(0,e.jsxs)("div",{className:"hms-benefit-left",children:[(0,e.jsx)("div",{className:"hms-benefit-icon",children:r.icon}),(0,e.jsx)("div",{className:"hms-benefit-stat",children:r.stat}),(0,e.jsx)("div",{className:"hms-benefit-stat-label",children:r.statLabel})]}),(0,e.jsxs)("div",{className:"hms-benefit-right",children:[(0,e.jsx)("h3",{children:r.title}),(0,e.jsx)("p",{children:r.desc})]})]})},s))})]})}),(0,e.jsxs)("section",{className:"hms-usecases",children:[(0,e.jsx)("div",{className:"hms-usecases-glow"}),(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(t,{children:[(0,e.jsx)(m,{children:"Deployments"}),(0,e.jsx)(c,{sub:"Trusted across every tier of Kenya's healthcare system.",children:"Trusted by Leading Healthcare Facilities"})]}),(0,e.jsx)("div",{className:"hms-usecases-grid",children:l.map((r,s)=>(0,e.jsx)(t,{delay:s*100,children:(0,e.jsxs)("div",{className:"hms-usecase-card",children:[(0,e.jsx)("span",{className:"hms-usecase-tag",children:r.tag}),(0,e.jsx)("div",{className:"hms-usecase-icon",children:r.icon}),(0,e.jsx)("h3",{children:r.title}),(0,e.jsx)("p",{children:r.desc})]})},s))})]})]}),(0,e.jsx)("section",{className:"hms-cta",children:(0,e.jsx)("div",{className:"hms-container",children:(0,e.jsx)(t,{children:(0,e.jsx)("div",{className:"hms-cta-box",children:(0,e.jsxs)("div",{className:"hms-cta-content",children:[(0,e.jsx)("h2",{children:"Upgrade Your Hospital Mortuary Operations"}),(0,e.jsx)("p",{children:"Join leading hospitals across Kenya that trust Rest Point for their mortuary management needs. Schedule a demo to see our hospital mortuary software in action."}),(0,e.jsxs)("div",{className:"hms-cta-buttons",children:[(0,e.jsxs)(o,{to:"/register",className:"hms-btn-primary",children:["Schedule Demo ",(0,e.jsx)(b,{size:16})]}),(0,e.jsxs)(o,{to:"/mortuary-management-software",className:"hms-btn-outline",children:["Learn More ",(0,e.jsx)(D,{size:14})]})]})]})})})})}),(0,e.jsx)("section",{className:"hms-related",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(t,{children:[(0,e.jsx)(m,{children:"Explore"}),(0,e.jsx)(c,{sub:"",children:"Related Resources"})]}),(0,e.jsx)("div",{className:"hms-related-grid",children:[{to:"/mortuary-management-software",label:"Mortuary Management Software"},{to:"/blog/functions-of-mortuary-department",label:"Functions of Mortuary Department"},{to:"/hearse-management",label:"Hearse Management Software"},{to:"/blog/what-is-mortuary-management-system",label:"What is a Mortuary Management System?"}].map((r,s)=>(0,e.jsx)(t,{delay:s*80,children:(0,e.jsxs)(o,{to:r.to,className:"hms-related-link",children:[(0,e.jsx)(h,{size:14}),r.label]})},s))})]})})]})]})};export{A as default};
