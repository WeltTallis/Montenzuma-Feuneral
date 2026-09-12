import{r as h}from"./chunk-CXHxssQy.js";import{y as f}from"./chunk-CXAmgOhv.js";import{l as m}from"./chunk-DWc5g_hH.js";import{o as x}from"./chunk-BY9AVXEY.js";import{B as b,Dt as u,Mt as v,Rt as k,gt as j,jn as y,rt as w,v as N}from"./index-yov0GYHY.js";var c=h(f(),1),e=x(),o={ink:"#000000",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(255,255,255,0.08)",lineDarkHover:"rgba(255,255,255,0.15)",gray:"#8A8780",grayLight:"rgba(255,255,255,0.6)",accent:"#C77B5E"},l={major:3,minor:4,patch:1,get full(){return`v${this.major}.${this.minor}.${this.patch}`},codename:"Aether",buildDate:"2025-06-19",get buildLabel(){return new Date(this.buildDate).toLocaleDateString("en-US",{month:"short",year:"numeric"})}},C=({size:n=24,color:t=o.bone})=>(0,e.jsxs)("svg",{width:n,height:n,viewBox:"0 0 32 32",fill:"none",style:{flexShrink:0},children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:t,strokeWidth:"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:t,strokeWidth:"1.5",strokeLinecap:"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:t})]}),p=(n,t)=>{(0,c.useEffect)(()=>{const s=r=>{n.current&&!n.current.contains(r.target)&&t()};return document.addEventListener("mousedown",s),()=>document.removeEventListener("mousedown",s)},[n,t])},$=({goTerms:n})=>{const t=m(),[s,r]=(0,c.useState)(!1),a=(0,c.useRef)(null);return p(a,()=>r(!1)),(0,e.jsxs)("div",{ref:a,style:{position:"relative",marginBottom:"0.8rem"},children:[(0,e.jsxs)("button",{onClick:()=>r(!s),className:"footer-link",style:{display:"flex",alignItems:"center",gap:"0.4rem"},children:["Policies",(0,e.jsx)(b,{size:14,style:{transform:s?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.3s ease"}})]}),s&&(0,e.jsx)("div",{className:"footer-dropdown-menu",children:[{label:"Terms of Service",action:n},{label:"Privacy Policy",action:()=>t("/privacy")},{label:"Data Migration Policy",action:()=>t("/data-migration")},{label:"SLA Policy",action:()=>t("/sla")},{label:"Release Notes",action:()=>t("/releases")},{label:"Account Deletion",action:()=>t("/account-deletion")}].map((d,g)=>(0,e.jsx)("button",{onClick:()=>{d.action(),r(!1)},className:"footer-dropdown-item",children:d.label},g))})]})},i=({onClick:n,children:t,isPrimary:s=!1})=>(0,e.jsx)("button",{onClick:n,className:`footer-link ${s?"primary":""}`,children:t}),D=({navigate:n})=>{const[t,s]=(0,c.useState)(!1),r=(0,c.useRef)(null);return p(r,()=>s(!1)),(0,e.jsxs)("div",{ref:r,style:{position:"relative",display:"inline-flex"},children:[(0,e.jsxs)("button",{className:"version-badge",onClick:()=>s(!t),onMouseEnter:()=>s(!0),onMouseLeave:()=>{setTimeout(()=>{r.current&&!r.current.matches(":hover")&&s(!1)},300)},children:[(0,e.jsx)("span",{className:"version-dot"}),l.full]}),t&&(0,e.jsxs)("div",{className:"version-tooltip",children:[(0,e.jsxs)("div",{className:"version-tooltip-header",children:[(0,e.jsx)("div",{className:"version-tooltip-icon",children:(0,e.jsx)(u,{size:14})}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("div",{className:"version-tooltip-title",children:["RestPoint ",l.full]}),(0,e.jsxs)("div",{className:"version-tooltip-codename",children:["Codename: ",l.codename]})]})]}),(0,e.jsxs)("div",{className:"version-tooltip-grid",children:[(0,e.jsxs)("div",{className:"version-tooltip-row",children:[(0,e.jsx)("span",{className:"version-tooltip-label",children:"Version"}),(0,e.jsx)("span",{className:"version-tooltip-value",children:l.full})]}),(0,e.jsxs)("div",{className:"version-tooltip-row",children:[(0,e.jsx)("span",{className:"version-tooltip-label",children:"Built"}),(0,e.jsx)("span",{className:"version-tooltip-value",children:l.buildLabel})]}),(0,e.jsxs)("div",{className:"version-tooltip-row",children:[(0,e.jsx)("span",{className:"version-tooltip-label",children:"Runtime"}),(0,e.jsx)("span",{className:"version-tooltip-value",children:"Production"})]}),(0,e.jsxs)("div",{className:"version-tooltip-row",children:[(0,e.jsx)("span",{className:"version-tooltip-label",children:"Region"}),(0,e.jsx)("span",{className:"version-tooltip-value",children:"EU-Central"})]})]}),(0,e.jsxs)("button",{className:"version-tooltip-link",onClick:()=>{n("/releases"),s(!1)},children:["View release notes ",(0,e.jsx)(w,{size:12})]})]})]})},B=({goTerms:n})=>{const t=m(),s=new Date().getFullYear(),r=a=>{n&&a==="/terms"?n():t(a)};return(0,e.jsxs)("footer",{className:"footer-container",children:[(0,e.jsx)("div",{className:"footer-glow"}),(0,e.jsx)("div",{className:"footer-grid-bg"}),(0,e.jsxs)("div",{className:"wrap footer-wrap",children:[(0,e.jsx)("style",{children:`
                    .footer-container {
                        background: #000000;
                        color: ${o.grayLight};
                        /* Breathing room above the footer content — without it the
                           first row sits flush against the top border ("raised" look). */
                        padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;
                        width: 100%;
                        margin: 0;
                        border-top: 1px solid ${o.lineDark};
                        position: relative;
                        overflow: visible;
                        font-family: 'Inter', sans-serif;
                    }
                    .footer-glow {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: radial-gradient(circle at 30% 0%, rgba(61,79,71,0.3) 0%, transparent 60%);
                        pointer-events: none;
                    }
                    .footer-grid-bg {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                        background-size: 40px 40px;
                        pointer-events: none;
                        mask-image: linear-gradient(to bottom, black, transparent 80%);
                        -webkit-mask-image: linear-gradient(to bottom, black, transparent 80%);
                    }
                    .footer-wrap {
                        position: relative;
                        z-index: 2;
                        max-width: 1180px;
                        margin: 0 auto;
                        padding: 0 clamp(1.25rem, 5vw, 2.5rem);
                    }

                    /* Top Section */
                    .footer-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 4rem;
                        padding-bottom: 4rem;
                        border-bottom: 1px solid ${o.lineDark};
                        margin-bottom: 4rem;
                        flex-wrap: wrap;
                    }
                    .footer-brand-block { flex: 1.5; min-width: 300px; }
                    .footer-brand-mark {
                        display: flex; align-items: center; gap: 0.7rem;
                        font-family: 'Fraunces', serif; font-size: 1.4rem;
                        color: ${o.bone}; font-weight: 500; margin-bottom: 1rem;
                        letter-spacing: -0.02em;
                    }
                    .footer-desc {
                        font-size: 0.9rem; color: ${o.grayLight};
                        line-height: 1.7; max-width: 380px;
                        opacity: 0.8; margin-bottom: 1.5rem;
                    }
                    .footer-status {
                        display: inline-flex; align-items: center; gap: 0.6rem;
                        font-size: 0.75rem; color: ${o.grayLight};
                        background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem;
                        border-radius: 20px; border: 1px solid ${o.lineDark};
                    }
                    .status-dot {
                        width: 8px; height: 8px; border-radius: 50%;
                        background: #4CAF50; display: inline-block;
                        box-shadow: 0 0 10px #4CAF50; animation: pulse 2s infinite;
                    }
                    .social-row { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
                    .social-icon {
                        width: 36px; height: 36px; border-radius: 8px;
                        background: rgba(255,255,255,0.05); border: 1px solid ${o.lineDark};
                        display: flex; align-items: center; justify-content: center;
                        color: ${o.grayLight}; transition: all 0.2s ease; cursor: pointer;
                    }
                    .social-icon:hover {
                        background: ${o.verdigris}; border-color: ${o.verdigrisLight};
                        color: ${o.bone}; transform: translateY(-2px);
                    }

                    .footer-newsletter { flex: 1; min-width: 300px; }
                    .newsletter-title {
                        font-family: 'Fraunces', serif; font-size: 1.6rem;
                        color: ${o.bone}; margin-bottom: 0.5rem; font-weight: 500;
                    }
                    .newsletter-sub {
                        font-size: 0.9rem; color: ${o.grayLight};
                        margin-bottom: 1.5rem; opacity: 0.8; line-height: 1.6;
                    }
                    .newsletter-form {
                        display: flex; gap: 0.5rem; background: rgba(255,255,255,0.04);
                        border: 1px solid ${o.lineDark}; border-radius: 8px;
                        padding: 4px; transition: all 0.2s;
                    }
                    .newsletter-form:focus-within {
                        border-color: ${o.brass};
                        box-shadow: 0 0 0 3px rgba(139,115,85,0.2);
                    }
                    .newsletter-input {
                        flex: 1; background: transparent; border: none; outline: none;
                        color: ${o.bone}; padding: 0.75rem 1rem; font-size: 0.9rem;
                        font-family: 'Inter', sans-serif;
                    }
                    .newsletter-input::placeholder { color: rgba(255,255,255,0.4); }
                    .newsletter-btn {
                        background: ${o.brass}; color: ${o.bone}; border: none;
                        padding: 0.75rem 1.5rem; border-radius: 6px; font-size: 0.85rem;
                        font-weight: 600; cursor: pointer; transition: all 0.2s ease;
                        display: flex; align-items: center; gap: 0.4rem;
                        white-space: nowrap;
                    }
                    .newsletter-btn:hover {
                        background: ${o.brassLight}; transform: translateY(-1px);
                    }

                    /* Middle Section */
                    .footer-content {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 2rem;
                        margin-bottom: 4rem;
                    }
                    .footer-col h4 {
                        font-family: 'JetBrains Mono', monospace; font-size: 0.95rem;
                        letter-spacing: 0.14em; text-transform: uppercase;
                        color: ${o.brassLight}; margin-bottom: 1.5rem; font-weight: 600;
                    }
                    .footer-link {
                        display: block; width: 100%; text-align: left;
                        background: none; border: none; cursor: pointer;
                        font-size: 1rem; color: ${o.grayLight}; padding: 0;
                        margin-bottom: 0.8rem; font-family: 'Inter', sans-serif;
                        transition: all 0.2s ease; transform: translateX(0);
                    }
                    .footer-link:hover {
                        color: ${o.bone}; transform: translateX(4px);
                    }
                    .footer-link.primary {
                        color: ${o.bone}; font-weight: 500; margin-bottom: 1rem;
                    }

                    .footer-dropdown-menu {
                        position: absolute; bottom: 100%; left: 0; background: #050505;
                        border: 1px solid ${o.lineDark}; border-radius: 8px; min-width: 240px;
                        margin-bottom: 0.75rem; z-index: 1000;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.8); overflow: hidden;
                    }
                    .footer-dropdown-item {
                        width: 100%; padding: 0.8rem 1.2rem; background: none; border: none;
                        text-align: left; cursor: pointer; font-size: 0.95rem; color: ${o.grayLight};
                        border-bottom: 1px solid ${o.lineDark}; transition: all 0.2s;
                        font-family: 'Inter', sans-serif;
                    }
                    .footer-dropdown-item:last-child { border-bottom: none; }
                    .footer-dropdown-item:hover { background: rgba(255,255,255,0.05); color: ${o.bone}; }

                    /* Bottom Bar — original layout */
                    .footer-bottom {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.95rem;
                        color: ${o.grayLight};
                        opacity: 0.7;
                        padding: 2rem 0;
                        border-top: 1px solid ${o.lineDark};
                    }
                    .footer-legal-links { display: flex; gap: 1.5rem; align-items: center; }
                    .legal-link {
                        background: none; border: none; cursor: pointer; color: inherit;
                        font-size: inherit; font-family: inherit; transition: color 0.2s;
                    }
                    .legal-link:hover { color: ${o.bone}; }

                    /* Version Badge */
                    .version-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.45rem;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.8rem;
                        letter-spacing: 0.04em;
                        color: ${o.grayLight};
                        background: rgba(255,255,255,0.04);
                        border: 1px solid ${o.lineDark};
                        border-radius: 6px;
                        padding: 0.35rem 0.7rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                        opacity: 1;
                    }
                    .version-badge:hover {
                        background: rgba(255,255,255,0.07);
                        border-color: ${o.lineDarkHover};
                    }
                    .version-dot {
                        width: 6px; height: 6px; border-radius: 50%;
                        background: ${o.verdigrisLight};
                        box-shadow: 0 0 6px rgba(77,99,89,0.6);
                        flex-shrink: 0;
                    }

                    /* Version Tooltip */
                    .version-tooltip {
                        position: absolute;
                        bottom: calc(100% + 10px);
                        right: 0;
                        width: 256px;
                        background: #0c0c0c;
                        border: 1px solid ${o.lineDarkHover};
                        border-radius: 10px;
                        padding: 1rem;
                        z-index: 2000;
                        box-shadow: 0 24px 48px rgba(0,0,0,0.9);
                        animation: tooltipIn 0.2s ease;
                    }
                    .version-tooltip::after {
                        content: '';
                        position: absolute;
                        bottom: -5px;
                        right: 16px;
                        width: 10px; height: 10px;
                        background: #0c0c0c;
                        border-right: 1px solid ${o.lineDarkHover};
                        border-bottom: 1px solid ${o.lineDarkHover};
                        transform: rotate(45deg);
                    }
                    .version-tooltip-header {
                        display: flex;
                        gap: 0.7rem;
                        align-items: flex-start;
                        margin-bottom: 0.85rem;
                        padding-bottom: 0.85rem;
                        border-bottom: 1px solid ${o.lineDark};
                    }
                    .version-tooltip-icon {
                        width: 30px; height: 30px;
                        border-radius: 7px;
                        background: rgba(77,99,89,0.2);
                        border: 1px solid rgba(77,99,89,0.3);
                        display: flex; align-items: center; justify-content: center;
                        color: ${o.verdigrisLight};
                        flex-shrink: 0;
                    }
                    .version-tooltip-title {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.8rem;
                        color: ${o.bone};
                        font-weight: 600;
                        line-height: 1.3;
                    }
                    .version-tooltip-codename {
                        font-size: 0.7rem;
                        color: ${o.brassLight};
                        margin-top: 2px;
                        font-style: italic;
                    }
                    .version-tooltip-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 0.4rem;
                        margin-bottom: 0.85rem;
                    }
                    .version-tooltip-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .version-tooltip-label {
                        font-size: 0.72rem;
                        color: ${o.grayLight};
                        opacity: 0.7;
                    }
                    .version-tooltip-value {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 0.72rem;
                        color: ${o.bone};
                        opacity: 0.9;
                    }
                    .version-tooltip-link {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.4rem;
                        width: 100%;
                        padding: 0.5rem;
                        background: rgba(255,255,255,0.04);
                        border: 1px solid ${o.lineDark};
                        border-radius: 6px;
                        color: ${o.grayLight};
                        font-size: 0.72rem;
                        font-family: 'Inter', sans-serif;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .version-tooltip-link:hover {
                        background: rgba(255,255,255,0.08);
                        color: ${o.bone};
                        border-color: ${o.lineDarkHover};
                    }

                    @keyframes tooltipIn {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(0.9); }
                        100% { opacity: 1; transform: scale(1); }
                    }

                    @media (max-width: 900px) {
                        .footer-content { grid-template-columns: repeat(2, 1fr) !important; gap: 2.5rem !important; }
                        .footer-top { flex-direction: column; gap: 3rem; }
                    }
                    @media (max-width: 600px) {
                        .footer-content { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
                        .footer-bottom {
                            flex-direction: column !important;
                            gap: 1rem !important;
                            text-align: center !important;
                        }
                        .footer-legal-links { flex-wrap: wrap; justify-content: center; }
                        .version-tooltip { right: 50%; transform: translateX(50%); }
                        .version-tooltip::after { right: calc(50% - 5px); }
                    }
                `}),(0,e.jsxs)("div",{className:"footer-top",children:[(0,e.jsxs)("div",{className:"footer-brand-block",children:[(0,e.jsxs)("div",{className:"footer-brand-mark",children:[(0,e.jsx)(C,{size:28,color:o.bone}),"Rest Point"]}),(0,e.jsx)("p",{className:"footer-desc",children:"The operating system for funeral homes that take their reputation seriously. Built by Welt Tallis Technologies."}),(0,e.jsxs)("div",{className:"footer-status",children:[(0,e.jsx)("span",{className:"status-dot"}),"All systems operational"]}),(0,e.jsxs)("div",{className:"social-row",children:[(0,e.jsx)("div",{className:"social-icon",children:(0,e.jsx)(y,{size:16})}),(0,e.jsx)("div",{className:"social-icon",children:(0,e.jsx)(v,{size:16})}),(0,e.jsx)("div",{className:"social-icon",children:(0,e.jsx)(j,{size:16})}),(0,e.jsx)("div",{className:"social-icon",children:(0,e.jsx)(k,{size:16})})]})]}),(0,e.jsxs)("div",{className:"footer-newsletter",children:[(0,e.jsx)("div",{className:"newsletter-title",children:"Stay updated"}),(0,e.jsx)("p",{className:"newsletter-sub",children:"Get product updates, industry insights, and resources delivered directly to your inbox."}),(0,e.jsxs)("form",{className:"newsletter-form",onSubmit:a=>a.preventDefault(),children:[(0,e.jsx)("input",{type:"email",className:"newsletter-input",placeholder:"you@funeralhome.com"}),(0,e.jsxs)("button",{type:"submit",className:"newsletter-btn",children:["Subscribe ",(0,e.jsx)(N,{size:14})]})]})]})]}),(0,e.jsxs)("div",{className:"footer-content",children:[(0,e.jsxs)("div",{className:"footer-col",children:[(0,e.jsx)("h4",{children:"Software Solutions"}),(0,e.jsx)(i,{onClick:()=>r("/"),isPrimary:!0,children:"RestPoint Complete"}),(0,e.jsx)(i,{onClick:()=>r("/solutions/churches"),children:"Church Welfare"}),(0,e.jsx)(i,{onClick:()=>r("/solutions/saccos"),children:"SACCO Funeral"}),(0,e.jsx)(i,{onClick:()=>r("/solutions/chamas"),children:"Chama Management"}),(0,e.jsx)(i,{onClick:()=>r("/solutions/funeral-homes"),children:"Funeral Home OS"}),(0,e.jsx)(i,{onClick:()=>r("/mortuary-management-software"),children:"Mortuary Management"}),(0,e.jsx)(i,{onClick:()=>r("/hospital-mortuary-software"),children:"Hospital Mortuary"}),(0,e.jsx)(i,{onClick:()=>r("/funeral-home-management-software"),children:"Funeral Home ERP"}),(0,e.jsx)(i,{onClick:()=>r("/hearse-management"),children:"Hearse Management"}),(0,e.jsx)(i,{onClick:()=>r("/mortuary-billing"),children:"Mortuary Billing"}),(0,e.jsx)(i,{onClick:()=>r("/memorial"),isPrimary:!0,children:"Online Memorial"}),(0,e.jsx)(i,{onClick:()=>r("/pricing"),children:"Pricing"})]}),(0,e.jsxs)("div",{className:"footer-col",children:[(0,e.jsx)("h4",{children:"Resources"}),(0,e.jsx)(i,{onClick:()=>r("/blog/funeral-welfare-management"),children:"Welfare Guide"}),(0,e.jsx)(i,{onClick:()=>r("/blog/bereavement-management"),children:"Bereavement Ops"}),(0,e.jsx)(i,{onClick:()=>r("/blog/member-contributions"),children:"Contributions"}),(0,e.jsx)(i,{onClick:()=>r("/templates"),children:"Free Templates"}),(0,e.jsx)(i,{onClick:()=>r("/calculators"),children:"Calculators"})]}),(0,e.jsxs)("div",{className:"footer-col",children:[(0,e.jsx)("h4",{children:"Company"}),(0,e.jsx)(i,{onClick:()=>r("/about-welt-tallis"),children:"About Welt Tallis"}),(0,e.jsx)(i,{onClick:()=>r("/contact"),children:"Contact Sales"}),(0,e.jsx)(i,{onClick:()=>r("/partners"),children:"Partners"})]}),(0,e.jsxs)("div",{className:"footer-col",children:[(0,e.jsx)("h4",{children:"Legal & Policies"}),(0,e.jsx)($,{goTerms:n}),(0,e.jsx)(i,{onClick:()=>r("/security"),children:"Security Overview"}),(0,e.jsx)(i,{onClick:()=>{const a=typeof window<"u"&&window.rpOpenCookieSettings;if(a){a();return}r("/cookies")},children:"Cookie Settings"}),(0,e.jsx)(i,{onClick:()=>r("/gdpr"),children:"GDPR Compliance"})]})]}),(0,e.jsxs)("div",{className:"footer-bottom",children:[(0,e.jsxs)("span",{children:["© ",s," Welt Tallis Technologies. All rights reserved."]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1.25rem"},children:[(0,e.jsxs)("div",{className:"footer-legal-links",children:[(0,e.jsx)("button",{className:"legal-link",onClick:n,children:"Terms"}),(0,e.jsx)("button",{className:"legal-link",onClick:()=>t("/privacy"),children:"Privacy"}),(0,e.jsx)("button",{className:"legal-link",onClick:()=>t("/security"),children:"Security"}),(0,e.jsx)("button",{className:"legal-link",onClick:()=>t("/status"),children:"Status"})]}),(0,e.jsx)(D,{navigate:t})]})]})]})]})};export{B as t};
