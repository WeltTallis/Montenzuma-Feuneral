import{r as Ye}from"./chunk-CXHxssQy.js";import{y as He}from"./chunk-CXAmgOhv.js";import{c as Ge,l as R,r as Re}from"./chunk-DWc5g_hH.js";import{_ as n,h as U,m as $}from"./chunk-DJYPtS2Y.js";import{o as Je}from"./chunk-BY9AVXEY.js";import{An as Be,At as Xe,Et as _e,Gn as Ke,I as Ue,R as Ve,Rn as Qe,Ut as Ze,_n as Pe,bn as er,kn as rr,kt as tr,ot as ar,rt as qe,tt as ir,un as nr,ut as pe,v as K,w as or,zt as fe}from"./index-yov0GYHY.js";import{t}from"./chunk-CtrK9VBE.js";import{t as sr}from"./chunk-BNAMOA04.js";var m=Ye(He(),1),e=Je(),lr="#C8102E",dr="https://www.kra.go.ke/templates/kra/images/kra/logoKRA.webp";function Ie(){const r=(0,m.useRef)(null),[a,l]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{const s=r.current;if(!s)return;const i=new IntersectionObserver(([o])=>{o.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(s),()=>i.disconnect()},[]),[r,a]}var cr=({children:r,delay:a=0,style:l={}})=>{const[s,i]=Ie();return(0,e.jsx)("div",{ref:s,style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...l},children:r})},G=({children:r,delay:a=0,from:l="up",style:s={},className:i=""})=>{const[o,f]=Ie(),c={up:"translateY(40px)",left:"translateX(50px)",right:"translateX(-50px)"};return(0,e.jsx)("div",{ref:o,className:i,style:{height:"100%",display:"flex",opacity:f?1:0,transform:f?"none":c[l]||c.up,transition:`opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...s},children:r})},mr=`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  .newsroom-section {
    position: relative;
    padding: clamp(5rem, 9vw, 8rem) 0 4rem;
    background: #FFFFFF;
    overflow: hidden;
  }
  
  .ns-wrap {
    position: relative;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 clamp(1.5rem, 4vw, 2.5rem);
    z-index: 1;
  }
  
  /* HEADER */
  .ns-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid ${t.line};
    margin-bottom: 3rem;
  }
  .ns-arch-label {
    font-family: 'Fraunces', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 500;
    color: ${t.ink};
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .ns-arch-label em { font-style: italic; font-weight: 300; color: ${t.brass}; }
  .ns-arch-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${t.gray};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .ns-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4D9B7F; box-shadow: 0 0 8px #4D9B7F;
    animation: ns-pulse 2s infinite;
  }
  @keyframes ns-pulse { 0% { box-shadow: 0 0 0 0 rgba(77,155,127, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(77,155,127, 0); } 100% { box-shadow: 0 0 0 0 rgba(77,155,127, 0); } }
  
  /* MAIN GRID LAYOUT */
  .ns-main-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    align-items: stretch;
  }
  .ns-side-stack {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 1.5rem;
  }
  .ns-secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
    align-items: stretch;
  }
  
  /* SHARED CARD STYLES */
  .ns-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid ${t.line};
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease, border-color 0.4s ease;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #FFFFFF;
  }
  .ns-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -15px rgba(21,23,26,0.1);
    border-color: ${t.brass};
  }

  /* FEATURED (Dark Cinematic) */
  .ns-featured {
    background: #0a0b0c;
    border-color: rgba(255,255,255,0.05);
    color: ${t.bone};
    padding: 0;
  }
  .ns-featured:hover { border-color: ${t.brass}; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.4); }
  .ns-featured-media {
    position: relative;
    width: 100%;
    height: 55%;
    overflow: hidden;
  }
  .ns-featured-media img {
    width: 100%; height: 100%; object-fit: cover;
    filter: saturate(0.8) contrast(1.1);
    transition: transform 1s cubic-bezier(0.16,1,0.3,1);
  }
  .ns-featured:hover .ns-featured-media img { transform: scale(1.05); }
  .ns-featured-media::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(10,11,12,0.2) 0%, rgba(10,11,12,0) 40%, #0a0b0c 100%);
  }
  .ns-featured-badge {
    position: absolute; top: 1.5rem; left: 1.5rem;
    background: rgba(255,255,255,0.1); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem;
    border-radius: 8px; z-index: 2;
  }
  .ns-featured-content {
    padding: 0 2.5rem 2.5rem;
    margin-top: -3rem;
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .ns-cat {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500;
    margin-bottom: 1.2rem;
  }
  .ns-cat-dot { width: 6px; height: 6px; border-radius: 50%; }
  .ns-featured-title {
    font-family: 'Fraunces', serif; font-weight: 500;
    font-size: clamp(1.8rem, 3vw, 2.4rem); line-height: 1.1;
    color: ${t.bone}; margin-bottom: 1rem;
  }
  .ns-featured-title em { font-style: italic; font-weight: 300; color: #C9B58E; }
  .ns-featured-excerpt {
    font-size: 0.95rem; color: rgba(250,248,244,0.7);
    line-height: 1.6; margin-bottom: 1.5rem; flex: 1;
  }
  .ns-featured-foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);
  }
  .ns-date {
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ns-date-light { color: rgba(250,248,244,0.5); }
  .ns-date-muted { color: ${t.gray}; }
  .ns-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: ${t.brass}; color: ${t.bone}; border: none;
    padding: 0.7rem 1.4rem; border-radius: 4px;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.8rem;
    font-weight: 600; text-transform: uppercase; cursor: pointer;
    transition: all 0.3s ease;
  }
  .ns-btn:hover { background: ${t.accent}; transform: translateX(4px); }

  /* LIST CARD (Light Architectural) */
  .ns-card-list {
    background: #F3EFE6;
    border-color: #E3DDD0;
    padding: 2rem;
  }
  .ns-card-list:hover { background: #EFEAE0; }
  .ns-list-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
  .ns-card-title {
    font-family: 'Fraunces', serif; font-weight: 600;
    font-size: 1.4rem; color: ${t.ink}; line-height: 1.2;
    margin: 1rem 0 0.8rem; letter-spacing: -0.01em;
  }
  .ns-card-excerpt {
    font-size: 0.85rem; color: ${t.gray};
    line-height: 1.6; margin-bottom: 1.5rem;
  }
  .ns-checklist { display: flex; flex-direction: column; gap: 0.8rem; margin-top: auto; }
  .ns-check-item {
    display: flex; align-items: center; gap: 0.7rem;
    font-size: 0.85rem; color: ${t.ink}; font-weight: 500;
  }
  .ns-check-icon {
    width: 20px; height: 20px; border-radius: 4px;
    background: ${t.ink}; color: ${t.bone};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* MINIMAL DARK CARD */
  .ns-card-dark {
    background: #15171A;
    border-color: rgba(255,255,255,0.05);
    padding: 2rem;
    color: ${t.bone};
    justify-content: space-between;
  }
  .ns-card-dark:hover { background: #1C1F23; border-color: ${t.brass}; }
  .ns-card-dark .ns-card-title { color: ${t.bone}; }
  .ns-card-dark .ns-card-excerpt { color: rgba(250,248,244,0.6); }
  .ns-ext-icon {
    width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.3s ease;
  }
  .ns-card-dark:hover .ns-ext-icon { background: ${t.brass}; border-color: ${t.brass}; transform: rotate(45deg); }

  /* EDITORIAL CARD (Light) */
  .ns-card-edit {
    background: #FFFFFF;
    padding: 2rem;
    justify-content: space-between;
  }
  .ns-card-edit:hover { border-color: ${t.accent}; }
  .ns-author-block {
    display: flex; align-items: center; gap: 0.8rem;
    margin-top: 1.5rem; padding-top: 1.5rem;
    border-top: 1px solid ${t.line};
  }
  .ns-author-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: ${t.bone2}; color: ${t.ink};
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 0.9rem;
  }
  .ns-author-info { display: flex; flex-direction: column; }
  .ns-author-name { font-size: 0.85rem; font-weight: 600; color: ${t.ink}; }
  .ns-author-role { font-size: 0.75rem; color: ${t.gray}; }

  /* COMING SOON BADGE */
  .ns-badge-soon {
    display: inline-block; padding: 0.3rem 0.7rem;
    background: rgba(199,123,94,0.1); color: ${t.accent};
    border-radius: 4px; font-size: 0.65rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: 'JetBrains Mono', monospace;
  }

  /* FOOTER */
  .ns-foot-sig {
    display: flex; align-items: center; gap: 1.5rem;
    margin-top: 4rem; padding-top: 2rem;
    border-top: 1px solid ${t.line};
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${t.gray};
  }
  .ns-foot-sig-line { flex: 1; height: 1px; background: ${t.line}; }
  .ns-foot-sig-mark { font-family: 'Fraunces', serif; font-style: italic; font-size: 1rem; color: ${t.brass}; text-transform: none; letter-spacing: 0; }

  /* RESPONSIVE */
  @media (max-width: 920px) {
    .ns-main-grid, .ns-secondary-grid { grid-template-columns: 1fr; }
    .ns-side-stack { grid-template-rows: auto auto; }
    .ns-featured-media { height: 300px; }
  }
`,pr=()=>{const r=R(),a=[{featured:!0,category:"COMING SOON",catColor:t.brass,logo:"/restpay.jpg",title:"RestPay: <em>Unified</em> Payment Processing",excerpt:"We're introducing RestPay, our upcoming payment module that will integrate card payments alongside M-Pesa. Accept all major payment methods through a single, seamless platform.",date:"May 2026",cta:"Learn more",ctaTo:"/integrations"},{layout:"list",category:"INTEGRATION",catColor:lr,logo:dr,title:"KRA eTIMS Integration",excerpt:"Native integration to eliminate external accounting software.",list:["KRA Compliant Invoices","Direct Sync to eTIMS","No Manual Exports","Automated Tax Reporting"],date:"August 2026"},{layout:"dark",category:"PRODUCT",catColor:t.verdigris,title:"Multi Tenant Architecture Now Available",excerpt:"Serve multiple funeral homes from a single instance with complete data isolation.",date:"May 2026",author:"Shipped"},{layout:"edit",category:"BLOG",catColor:t.verdigris,title:"The Future of Death Care: Fully Automated Funeral Homes",excerpt:"From QR scanned intake and digital release to hearse self booking, coffin marketplaces, and 24/7 family portals — how modern funeral homes are going fully automated.",date:"September 2026",link:"/blog/future-of-death-care-software-restpoint",authorName:"Peter Mumo",authorRole:"Developer at Restpoint"},{layout:"soon",category:"COMING SOON",catColor:t.brass,title:"M-Pesa Payments — Coming Soon",excerpt:"Families will soon be able to pay directly through the portal via M-Pesa.",date:"May 2026"}],l=i=>{window.scrollTo({top:0,behavior:"smooth"}),r(i||"/")},s=i=>{i.currentTarget.style.display="none"};return(0,e.jsxs)("section",{className:"newsroom-section",children:[(0,e.jsx)("style",{children:mr}),(0,e.jsxs)("div",{className:"ns-wrap",children:[(0,e.jsx)(cr,{style:{marginBottom:"0"},children:(0,e.jsxs)("header",{className:"ns-header",children:[(0,e.jsxs)("h1",{className:"ns-arch-label",children:["Dispatches",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"from the field."})]}),(0,e.jsxs)("div",{className:"ns-arch-meta",children:[(0,e.jsx)("span",{className:"ns-live-dot"})," Vol. 03 / Issue 09 / 2026"]})]})}),(0,e.jsxs)("div",{className:"ns-main-grid",children:[a[0]&&(0,e.jsx)(G,{from:"left",delay:0,children:(0,e.jsxs)("article",{className:"ns-card ns-featured",children:[(0,e.jsxs)("div",{className:"ns-featured-media",children:[(0,e.jsx)("div",{className:"ns-featured-badge",children:(0,e.jsxs)("svg",{width:"100",height:"28",viewBox:"0 0 220 56",xmlns:"http://www.w3.org/2000/svg","aria-label":"RestPay",children:[(0,e.jsx)("defs",{children:(0,e.jsxs)("linearGradient",{id:"rpg",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[(0,e.jsx)("stop",{offset:"0%","stop-color":"#8B7355"}),(0,e.jsx)("stop",{offset:"100%","stop-color":"#A89478"})]})}),(0,e.jsx)("rect",{x:"2",y:"10",width:"36",height:"36",rx:"9",fill:"url(#rpg)"}),(0,e.jsx)("path",{d:"M12 22 L20 30 L32 18",stroke:"#FAF8F4","stroke-width":"3","stroke-linecap":"round","stroke-linejoin":"round",fill:"none"}),(0,e.jsx)("text",{x:"48",y:"28","font-family":"Fraunces, serif","font-size":"22","font-weight":"500",fill:"#15171A","letter-spacing":"-0.5",children:"RestPay"}),(0,e.jsx)("text",{x:"48",y:"44","font-family":"JetBrains Mono, monospace","font-size":"7",fill:"#8B7355","letter-spacing":"2",children:"UNIFIED PAYMENTS"})]})}),(0,e.jsx)("img",{src:a[0].logo,alt:"RestPay Preview",onError:s})]}),(0,e.jsxs)("div",{className:"ns-featured-content",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:"#C9B58E"},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[0].catColor}}),a[0].category," · Cover Story"]}),(0,e.jsx)("h2",{className:"ns-featured-title",dangerouslySetInnerHTML:{__html:a[0].title}}),(0,e.jsx)("p",{className:"ns-featured-excerpt",children:a[0].excerpt}),(0,e.jsxs)("div",{className:"ns-featured-foot",children:[(0,e.jsxs)("span",{className:"ns-date ns-date-light",children:[a[0].date," · Featured Release"]}),a[0].cta&&(0,e.jsxs)("button",{className:"ns-btn",onClick:()=>l(a[0].ctaTo),children:[a[0].cta," ",(0,e.jsx)(K,{size:14})]})]})]})]})},"featured"),(0,e.jsxs)("div",{className:"ns-side-stack",children:[a[1]&&(0,e.jsx)(G,{from:"right",delay:150,children:(0,e.jsxs)("article",{className:"ns-card ns-card-list",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[1].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[1].catColor}}),a[1].category]}),a[1].logo&&(0,e.jsx)("img",{src:a[1].logo,alt:"KRA Logo",style:{height:"30px"},onError:s})]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[1].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[1].excerpt}),(0,e.jsx)("div",{className:"ns-checklist",children:a[1].list?.map((i,o)=>(0,e.jsxs)("div",{className:"ns-check-item",children:[(0,e.jsx)("span",{className:"ns-check-icon",children:(0,e.jsx)(Ue,{size:12})}),i]},o))})]})},"list"),a[2]&&(0,e.jsx)(G,{from:"right",delay:250,children:(0,e.jsxs)("article",{className:"ns-card ns-card-dark",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[2].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[2].catColor}}),a[2].category]}),(0,e.jsx)("div",{className:"ns-ext-icon",children:(0,e.jsx)(qe,{size:14,color:t.bone})})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{className:"ns-card-title",children:a[2].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[2].excerpt})]}),(0,e.jsx)("span",{className:"ns-date ns-date-light",children:a[2].date})]})},"dark")]})]}),(0,e.jsxs)("div",{className:"ns-secondary-grid",children:[a[3]&&(0,e.jsx)(G,{from:"left",delay:300,children:(0,e.jsxs)("article",{className:"ns-card ns-card-edit",onClick:()=>a[3].link&&l(a[3].link),children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[3].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[3].catColor}}),a[3].category]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[3].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[3].excerpt})]}),(0,e.jsxs)("div",{className:"ns-author-block",children:[(0,e.jsx)("div",{className:"ns-author-avatar",children:"PM"}),(0,e.jsxs)("div",{className:"ns-author-info",children:[(0,e.jsx)("span",{className:"ns-author-name",children:a[3].authorName}),(0,e.jsx)("span",{className:"ns-author-role",children:a[3].authorRole})]})]})]})},"edit"),a[4]&&(0,e.jsx)(G,{from:"right",delay:350,children:(0,e.jsxs)("article",{className:"ns-card ns-card-edit",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[4].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[4].catColor}}),a[4].category]}),(0,e.jsx)("span",{className:"ns-badge-soon",children:"In Development"})]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[4].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[4].excerpt}),(0,e.jsx)("span",{className:"ns-date ns-date-muted",style:{marginTop:"auto"},children:a[4].date})]})},"soon")]})]})]})},h={black:"#000000",paper:"#F7F3EA",verd:"#2E3F37",brass2:"#C9B08C",terra:"#BC5A38",terra2:"#D8916C",line:"rgba(23,20,15,0.16)",bline:"rgba(247,243,234,0.14)",bline2:"rgba(247,243,234,0.4)",verdLine:"rgba(247,243,234,0.15)",verdSub:"#A8B5AD"},gr="https://kantronics.co.ke/cdn/shop/files/ipad_pro_m5_silver.webp?v=1763717320",hr=U`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background: ${h.black};
    color: ${h.paper};
    font-family: 'Instrument Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::selection { background: ${h.terra}; color: ${h.paper}; }

  .rp-reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s ease var(--d, 0s), transform 0.8s cubic-bezier(0.22,1,0.36,1) var(--d, 0s);
  }
  .rp-reveal.rp-revealed { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .rp-reveal { opacity: 1; transform: none; transition: none; }
  }
`,F=({delay:r=0,children:a,...l})=>{const s=(0,m.useRef)(null);return(0,m.useEffect)(()=>{const i=s.current;if(!i)return;const o=new IntersectionObserver(([f])=>{f.isIntersecting&&(i.classList.add("rp-revealed"),o.disconnect())},{threshold:.15});return o.observe(i),()=>o.disconnect()},[]),(0,e.jsx)("div",{ref:s,className:"rp-reveal",style:{"--d":`${r}s`},...l,children:a})},fr=n.header`
  background: ${h.black};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.05rem clamp(1.25rem, 4vw, 3.5rem);
  border-bottom: 1px solid ${h.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.65);

  .brand { display: flex; align-items: center; gap: 0.6rem; color: ${h.paper}; font-weight: 600; }
  .mark { width: 7px; height: 7px; background: ${h.terra}; display: inline-block; }
  .mid { color: ${h.brass2}; }

  @media (max-width: 680px) { .mid { display: none; } }
`,xr=n.section`
  background: ${h.black};
  color: ${h.paper};
`,ur=n.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(2.5rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 3.5rem) clamp(3.5rem, 6vw, 6rem);
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(2.5rem, 5vw, 5rem);
  align-items: start;

  @media (max-width: 1020px) { grid-template-columns: 1fr; }
`,br=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${h.brass2};
  display: block;
  margin-bottom: 1.4rem;
`,vr=n.h1`
  font-family: 'Fraunces', serif;
  font-weight: 340;
  font-size: clamp(2.9rem, 4.8vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.02em;
  color: ${h.paper};

  em {
    display: block;
    font-style: italic;
    font-weight: 320;
    color: ${h.brass2};
    letter-spacing: -0.01em;
  }
`,yr=n.p`
  margin-top: 1.6rem;
  max-width: 52ch;
  font-size: 0.95rem;
  line-height: 1.75;
  color: rgba(247, 243, 234, 0.68);

  strong { font-weight: 600; color: ${h.paper}; }
`,wr=n.div`
  margin-top: 2.4rem;
  border: 1px solid ${h.bline2};
  outline: 1px solid ${h.bline};
  outline-offset: 4px;
  background: rgba(247, 243, 234, 0.03);
`,jr=n.div`
  display: flex;
  justify-content: space-between;
  padding: 0.7rem 1.1rem;
  border-bottom: 1px solid ${h.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.55);

  b { color: ${h.paper}; font-weight: 600; }
`,xe=n.div`
  display: grid;
  grid-template-columns: 26px 1fr auto auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1.1rem;
  border-bottom: 1px solid ${h.bline};

  @media (max-width: 520px) {
    grid-template-columns: 20px 1fr auto;
    gap: 0.6rem;
  }
`,ue=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: ${h.brass2};
`,be=n.div`
  strong {
    display: block;
    font-weight: 600;
    font-size: 0.92rem;
    letter-spacing: -0.01em;
    color: ${h.paper};
  }
  .sub {
    display: block;
    margin-top: 0.3rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${h.brass2};
  }
`,kr=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.34em 0.65em;
  border: 1px solid ${h.bline2};
  color: rgba(247, 243, 234, 0.85);
  white-space: nowrap;

  &.req { border-color: rgba(247, 243, 234, 0.85); color: ${h.paper}; }
`,ve=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(247, 243, 234, 0.75);
  min-width: 2ch;
  text-align: right;

  &.on { color: ${h.terra2}; font-weight: 600; }

  @media (max-width: 520px) { display: none; }
`,Fr=n.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  input { position: absolute; opacity: 0; width: 1px; height: 1px; }

  .track {
    width: 42px;
    height: 22px;
    border: 1px solid rgba(247, 243, 234, 0.55);
    border-radius: 999px;
    position: relative;
    transition: background 0.25s, border-color 0.25s;
    flex-shrink: 0;
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${h.paper};
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), background 0.25s;
  }
  input:checked + .track { background: ${h.terra}; border-color: ${h.terra}; }
  input:checked + .track .knob { transform: translateX(20px); background: ${h.black}; }
  input:focus-visible + .track { outline: 2px solid ${h.terra2}; outline-offset: 3px; }

  .text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(247, 243, 234, 0.7);
  }

  @media (max-width: 520px) { .text { display: none; } }
`,zr=n.div`
  padding: 0.85rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.7);
`,Nr=n.p`
  margin: 0 1.1rem;
  max-height: ${({show:r})=>r?"6em":"0"};
  opacity: ${({show:r})=>r?1:0};
  overflow: hidden;
  border-left: 2px solid ${h.terra2};
  padding: ${({show:r})=>r?"0.8rem 0.9rem":"0 0.9rem"};
  margin-bottom: ${({show:r})=>r?"1rem":"0"};
  font-size: 0.8rem;
  line-height: 1.6;
  color: rgba(247, 243, 234, 0.72);
  transition: max-height 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.4s, padding 0.45s, margin 0.45s;
`,Sr=n.div`
  margin-top: 2.6rem;
  border-bottom: 1px solid ${h.bline};
`,$r=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.55);
  padding-bottom: 0.7rem;
  border-bottom: 1px solid ${h.bline2};
`,Cr=n.div`
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 0.25rem;
  border-bottom: 1px solid ${h.bline};
  transition: padding-left 0.35s cubic-bezier(0.22,1,0.36,1), background 0.3s;
  cursor: default;

  &:hover { padding-left: 0.85rem; background: rgba(247, 243, 234, 0.05); }
  &:hover .no { color: ${h.terra2}; }
  &:hover .arrow { opacity: 0.75; transform: none; }

  .no {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1rem;
    color: ${h.brass2};
    transition: color 0.3s;
  }

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${h.paper};
  }
  p {
    font-size: 0.78rem;
    color: rgba(247, 243, 234, 0.58);
    margin-top: 0.15rem;
    line-height: 1.45;
  }

  .arrow {
    width: 18px;
    height: 18px;
    stroke: ${h.paper};
    stroke-width: 1.6;
    fill: none;
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.3s, transform 0.35s cubic-bezier(0.22,1,0.36,1);
  }
`,Ar=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.18em;
  color: ${h.terra2};
  border: 1px solid ${h.terra2};
  padding: 0.2em 0.45em;
  font-weight: 600;
`,Mr=n.div`
  position: relative;

  @media (max-width: 1020px) { max-width: 660px; }
`,Er=n.div`
  border: 1px solid rgba(247, 243, 234, 0.28);
  outline: 1px solid rgba(247, 243, 234, 0.1);
  outline-offset: 4px;
  background: ${h.paper};
  color: #17140F;
  padding: 0 0 0.6rem;
  transition: transform 0.35s ease-out;
  will-change: transform;
`,Tr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid ${h.line};

  .title { font-family: 'Fraunces', serif; font-style: italic; font-size: 1.05rem; }
  .meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(23, 20, 15, 0.55);
    text-align: right;
  }
`,Rr=n.div`
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2.5vw, 2rem) 0;
`,Br=n.figure`
  width: min(440px, 82%);
  margin: 0 auto;

  img {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: multiply;
    filter: sepia(0.06) contrast(1.02) saturate(0.96);
  }

  .img-note {
    display: none;
    padding: 2rem 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${h.terra};
    text-align: center;
  }

  &.img-fail img { display: none; }
  &.img-fail .img-note { display: block; }
`,Pr=n.p`
  margin: 1.1rem 1.15rem 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(23, 20, 15, 0.6);
  line-height: 1.7;

  b { color: ${h.terra}; font-weight: 600; }
`,qr=n.section`
  background: ${h.verd};
  color: ${h.paper};
`,Ir=n.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(4rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 3.5rem);
`,Dr=n.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  align-items: end;
  margin-bottom: 3.5rem;

  @media (max-width: 1020px) { grid-template-columns: 1fr; gap: 1.5rem; }

  h2 {
    font-family: 'Fraunces', serif;
    font-weight: 340;
    font-size: clamp(2.2rem, 4.2vw, 3.6rem);
    line-height: 1.04;
    letter-spacing: -0.02em;
  }
  h2 em { font-style: italic; color: ${h.brass2}; }

  aside {
    font-size: 0.92rem;
    line-height: 1.75;
    color: rgba(247, 243, 234, 0.65);
    max-width: 42ch;
  }
`,Lr=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${h.brass2};
  display: block;
  margin-bottom: 1.2rem;
`,Or=n.div`
  display: grid;
  grid-template-columns: 64px 1.05fr 1.5fr 190px;
  gap: 2rem;
  align-items: start;
  padding: 0 0 0.8rem;
  border-bottom: 1px solid rgba(247, 243, 234, 0.4);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.5);

  @media (max-width: 820px) { display: none; }
`,ye=n.div`
  display: grid;
  grid-template-columns: 64px 1.05fr 1.5fr 190px;
  gap: 2rem;
  align-items: start;
  padding: 2.1rem 0;
  border-bottom: 1px solid ${h.verdLine};
  transition: background 0.3s;

  &:hover { background: rgba(247, 243, 234, 0.035); }

  @media (max-width: 820px) {
    grid-template-columns: 44px 1fr;
    gap: 0.8rem 1rem;
    padding: 1.7rem 0;

    .spec, .status { grid-column: 2; }
    .status { flex-direction: row; align-items: center; gap: 1rem; }
  }

  .no {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1.15rem;
    color: ${h.brass2};
    opacity: 0.85;
  }

  h3 {
    font-family: 'Fraunces', serif;
    font-weight: 420;
    font-size: 1.55rem;
    letter-spacing: -0.015em;
  }
  .sub {
    display: block;
    margin-top: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${h.verdSub};
  }

  .spec {
    font-size: 0.9rem;
    line-height: 1.7;
    color: rgba(247, 243, 234, 0.7);
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: flex-start;
  }

  .lchip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 0.38em 0.7em;
    border: 1px solid rgba(247, 243, 234, 0.35);
    color: rgba(247, 243, 234, 0.75);
    white-space: nowrap;
  }
  .lchip.req { border-color: rgba(247, 243, 234, 0.85); color: ${h.paper}; }
  .lchip.add { border-style: dashed; color: ${h.brass2}; border-color: ${h.brass2}; }
  .lchip.add.on { border-style: solid; color: ${h.terra2}; border-color: ${h.terra2}; }

  .qty {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-size: 1.05rem;
    color: rgba(247, 243, 234, 0.6);
  }
  .qty.on { color: ${h.terra2}; }
`,Wr=n.div`
  margin-top: 5rem;
  text-align: center;

  blockquote {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 320;
    font-size: clamp(1.5rem, 3vw, 2.3rem);
    line-height: 1.35;
    max-width: 26em;
    margin: 0 auto;
  }
  cite {
    display: block;
    margin-top: 1.4rem;
    font-style: normal;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: ${h.verdSub};
  }
`,Yr=$`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`,Hr=n.div`
  background: ${h.terra};
  color: #1A130E;
  overflow: hidden;
  border-top: 1px solid rgba(23, 20, 15, 0.35);

  .track {
    display: flex;
    width: max-content;
    animation: ${Yr} 30s linear infinite;
  }
  &:hover .track { animation-play-state: paused; }

  .group { display: flex; align-items: center; padding: 1.5rem 0; }

  .item {
    font-family: 'Fraunces', serif;
    font-weight: 380;
    font-size: clamp(2rem, 4.4vw, 3.6rem);
    letter-spacing: -0.02em;
    white-space: nowrap;
    padding: 0 2.2rem;
  }
  .item.em { font-style: italic; font-weight: 340; }

  .ast {
    width: 0.55em;
    height: 0.55em;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .track { animation: none; }
  }
`,Gr=()=>(0,e.jsx)("svg",{className:"ast",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"})}),Jr=n.footer`
  background: ${h.black};
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 2rem;
  padding: 1.2rem clamp(1.25rem, 4vw, 3.5rem);
  border-top: 1px solid ${h.bline};
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(247, 243, 234, 0.5);
`,Xr=[{no:"01",title:"Touch Signatures",text:"Families sign intake and release forms directly on screen."},{no:"02",title:"Ink-Sign Stylus",isNew:!0,text:"Pressure-sensitive pen for natural, binding signatures."},{no:"03",title:"Digital Intake",text:"A guided, paperless process for completing arrangements."},{no:"04",title:"Secure Releases",text:"Simple, verified digital authorizations, end to end."},{no:"05",title:"Curated Florals",text:"A visual catalog to select and annotate arrangements."}],_r=[{text:"Required for all facilities"},{text:"FrontDesk Portal",em:!0},{text:"iPad or Android, both work"},{text:"Your facility, digitally elevated",em:!0},{text:"Signature-grade intake"}],Kr=()=>{const[r,a]=(0,m.useState)(!1),[l,s]=(0,m.useState)(!1),i=(0,m.useRef)(null);return(0,m.useEffect)(()=>{const o=i.current;if(!o)return;const f=window.matchMedia("(hover: hover) and (pointer: fine)").matches,c=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(!f||c)return;const g=v=>{const d=o.getBoundingClientRect(),b=(v.clientX-d.left)/d.width-.5,p=(v.clientY-d.top)/d.height-.5;o.style.transform=`perspective(1400px) rotateX(${(-p*1.8).toFixed(2)}deg) rotateY(${(b*1.8).toFixed(2)}deg)`},x=()=>{o.style.transform="perspective(1400px)"};return o.addEventListener("pointermove",g),o.addEventListener("pointerleave",x),()=>{o.removeEventListener("pointermove",g),o.removeEventListener("pointerleave",x)}},[]),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(hr,{}),(0,e.jsxs)(fr,{children:[(0,e.jsxs)("span",{className:"brand",children:[(0,e.jsx)("span",{className:"mark"}),"Restpoint · Death care, digitally"]}),(0,e.jsx)("span",{className:"mid",children:"Hardware specification · Materials"}),(0,e.jsx)("span",{children:"Spec No. 07 · Rev. C"})]}),(0,e.jsxs)("main",{children:[(0,e.jsx)(xr,{children:(0,e.jsxs)(ur,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(F,{children:(0,e.jsx)(br,{children:"§ 06 · Materials & Hardware"})}),(0,e.jsx)(F,{delay:.08,children:(0,e.jsxs)(vr,{children:["FrontDesk",(0,e.jsx)("em",{children:"Tablet & Stylus"})]})}),(0,e.jsx)(F,{delay:.16,children:(0,e.jsxs)(yr,{children:["A dedicated touchscreen reception portal for funeral homes, one respectful, seamless surface for browsing floral arrangements, completing intake, and signing final documents. ",(0,e.jsx)("strong",{children:"iPad or Android"}),", any tablet works. Plus a ",(0,e.jsx)("strong",{children:"pressure-sensitive stylus"}),", an add-on for facilities that want every signature in ink."]})}),(0,e.jsx)(F,{delay:.24,children:(0,e.jsxs)(wr,{children:[(0,e.jsxs)(jr,{children:[(0,e.jsx)("b",{children:"Kit manifest"}),(0,e.jsx)("span",{children:"Per facility"})]}),(0,e.jsxs)(xe,{children:[(0,e.jsx)(ue,{children:"01"}),(0,e.jsxs)(be,{children:[(0,e.jsx)("strong",{children:"FrontDesk Tablet"}),(0,e.jsx)("span",{className:"sub",children:"iPad or Android · facility's choice"})]}),(0,e.jsx)(kr,{className:"req",children:"Required"}),(0,e.jsx)(ve,{children:"×1"})]}),(0,e.jsxs)(xe,{children:[(0,e.jsx)(ue,{children:"02"}),(0,e.jsxs)(be,{children:[(0,e.jsx)("strong",{children:"Precision Stylus"}),(0,e.jsx)("span",{className:"sub",children:"Pressure tip · Palm rejection"})]}),(0,e.jsxs)(Fr,{"aria-label":"Add precision stylus to kit",children:[(0,e.jsx)("input",{type:"checkbox",checked:r,onChange:o=>a(o.target.checked)}),(0,e.jsx)("span",{className:"track",children:(0,e.jsx)("span",{className:"knob"})}),(0,e.jsx)("span",{className:"text",children:r?"Added":"Add stylus"})]}),(0,e.jsx)(ve,{className:r?"on":"",children:r?"×1":"0"})]}),(0,e.jsx)(zr,{children:r?"Manifest total: 2 items · signature-grade":"Manifest total: 1 item · stylus not included"}),(0,e.jsx)(Nr,{show:r,children:"One stylus per tablet. Ships paired and pre-registered to your facility."})]})}),(0,e.jsx)(F,{delay:.32,children:(0,e.jsxs)(Sr,{children:[(0,e.jsx)($r,{children:"On the device"}),Xr.map(o=>(0,e.jsxs)(Cr,{children:[(0,e.jsx)("span",{className:"no",children:o.no}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("h4",{children:[o.title,o.isNew&&(0,e.jsx)(Ar,{children:"New"})]}),(0,e.jsx)("p",{children:o.text})]}),(0,e.jsx)("svg",{className:"arrow",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M5 12h14M13 6l6 6-6 6"})})]},o.no))]})})]}),(0,e.jsx)(Mr,{children:(0,e.jsx)(F,{delay:.15,children:(0,e.jsxs)(Er,{ref:i,children:[(0,e.jsxs)(Tr,{children:[(0,e.jsx)("span",{className:"title",children:"Plate I."}),(0,e.jsx)("span",{className:"meta",children:"FrontDesk tablet"})]}),(0,e.jsx)(Rr,{children:(0,e.jsxs)(Br,{className:l?"img-fail":"",children:[(0,e.jsx)("img",{src:gr,alt:"FrontDesk tablet, iPad shown; Android tablets equally supported",loading:"eager",onError:()=>s(!0)}),(0,e.jsx)("figcaption",{className:"img-note",children:"Image unavailable, check connection"})]})}),(0,e.jsxs)(Pr,{children:[(0,e.jsx)("b",{children:"Fig. 1"})," · FrontDesk tablet. iPad shown; Android equally supported."]})]})})})]})}),(0,e.jsx)(qr,{children:(0,e.jsxs)(Ir,{children:[(0,e.jsxs)(Dr,{children:[(0,e.jsx)(F,{children:(0,e.jsxs)("div",{children:[(0,e.jsx)(Lr,{children:"§ 07 · The requirement"}),(0,e.jsxs)("h2",{children:["Required in ",(0,e.jsx)("em",{children:"every"})," facility.",(0,e.jsx)("br",{}),"Recommended in every hand."]})]})}),(0,e.jsx)(F,{delay:.12,children:(0,e.jsx)("aside",{children:"To operate the Restpoint system, all funeral homes purchase one tablet, iPad or Android, whichever they prefer. It is the facility's primary digital registry, from intake through release. The stylus is our recommended add on."})})]}),(0,e.jsx)(F,{children:(0,e.jsxs)(Or,{children:[(0,e.jsx)("span",{children:"No."}),(0,e.jsx)("span",{children:"Item"}),(0,e.jsx)("span",{children:"Specification"}),(0,e.jsx)("span",{children:"Status / Qty"})]})}),(0,e.jsx)(F,{delay:.08,children:(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{className:"no",children:"01"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{children:"FrontDesk Tablet"}),(0,e.jsx)("span",{className:"sub",children:"iPad or Android, whichever the facility prefers"})]}),(0,e.jsx)("p",{className:"spec",children:"The facility's primary digital registry. Every Restpoint feature, intake, florals,  release,  postmortem Requests runs on this single device, from the first admission to the final signature."}),(0,e.jsxs)("div",{className:"status",children:[(0,e.jsx)("span",{className:"lchip req",children:"Required"}),(0,e.jsx)("span",{className:"qty",children:"×1"})]})]})}),(0,e.jsx)(F,{delay:.16,children:(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{className:"no",children:"02"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{children:"Precision Stylus"}),(0,e.jsx)("span",{className:"sub",children:"Pressure-sensitive · Palm rejection"})]}),(0,e.jsx)("p",{className:"spec",children:"Our recommended add on. A weighted pen for natural, binding signatures, in intake &  Release Forms . One per tablet."}),(0,e.jsxs)("div",{className:"status",children:[(0,e.jsx)("span",{className:`lchip add ${r?"on":""}`,children:r?"Specified":"Add-on"}),(0,e.jsx)("span",{className:`qty ${r?"on":""}`,children:r?"×1":"×0"})]})]})}),(0,e.jsx)(F,{children:(0,e.jsxs)(Wr,{children:[(0,e.jsx)("blockquote",{children:"“Take pride in bringing high-end technology to the heart of death care.”"}),(0,e.jsx)("cite",{children:"Restpoint Field Manual · p. 12"})]})})]})})]}),(0,e.jsx)(Hr,{"aria-hidden":"true",children:(0,e.jsx)("div",{className:"track",children:[0,1].map(o=>(0,e.jsx)("div",{className:"group","aria-hidden":o===1,children:_r.map(f=>(0,e.jsxs)(m.Fragment,{children:[(0,e.jsx)("span",{className:`item ${f.em?"em":""}`,children:f.text}),(0,e.jsx)(Gr,{})]},`${o}-${f.text}`))},o))})}),(0,e.jsxs)(Jr,{children:[(0,e.jsx)("span",{children:"Restpoint · Death care, digitally"}),(0,e.jsx)("span",{children:"Spec No. 07 · Rev. C"})]})]})},Ur=({title:r,description:a,keywords:l,image:s="/og-image.jpg",url:i,type:o="website",schema:f,localBusiness:c=!1})=>{const g=Ge(),x="https://restpoint.co.ke",v=i?`${x}${i}`:`${x}${g.pathname}`;return(0,m.useEffect)(()=>{document.title=r;const d=(p,u,y=!1)=>{const w=y?"property":"name";let j=document.querySelector(`meta[${w}="${p}"]`);j||(j=document.createElement("meta"),j.setAttribute(w,p),document.head.appendChild(j)),j.setAttribute("content",u)};d("description",a),d("keywords",l),d("author","Rest Point Technologies"),d("robots","index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"),d("googlebot","index, follow"),d("og:title",r,!0),d("og:description",a,!0),d("og:image",s,!0),d("og:url",v,!0),d("og:type",o,!0),d("og:site_name","Rest Point",!0),d("og:locale","en_KE"),d("twitter:card","summary_large_image"),d("twitter:title",r),d("twitter:description",a),d("twitter:image",s);let b=document.querySelector('link[rel="canonical"]');if(b||(b=document.createElement("link"),b.setAttribute("rel","canonical"),document.head.appendChild(b)),b.setAttribute("href",v),f){let p=document.querySelector('script[type="application/ld+json"]');p||(p=document.createElement("script"),p.setAttribute("type","application/ld+json"),document.head.appendChild(p)),p.textContent=JSON.stringify(f)}return()=>{}},[r,a,l,s,v,o,f]),null},Vr={"@context":"https://schema.org","@type":"Organization",name:"Rest Point",description:"Kenya's #1 Funeral Home Management System & Welfare Management Platform",url:"https://restpoint.co.ke",logo:"https://restpoint.co.ke/logo.png",foundingDate:"2020",founders:[{"@type":"Person",name:"Rest Point Team"}],address:{"@type":"PostalAddress",streetAddress:"Nairobi, Kenya",addressLocality:"Nairobi",addressCountry:"KE"},contactPoint:{"@type":"ContactPoint",telephone:"+254-700-000-000",contactType:"sales",availableLanguage:["English","Swahili"]},sameAs:["https://twitter.com/restpointke","https://linkedin.com/company/restpointke","https://facebook.com/restpointke"],areaServed:{"@type":"Country",name:"Kenya"},knowsAbout:["Funeral Management Software","Welfare Management System","Funeral Insurance Administration","SACCO Management Software","Church Management Software"]},Qr={"@context":"https://schema.org","@type":"SoftwareApplication",name:"Rest Point",applicationCategory:"BusinessApplication",operatingSystem:"Web",description:"Complete funeral home management and welfare administration platform for churches, SACCOs, and organizations in Kenya",url:"https://restpoint.co.ke",screenshot:"https://restpoint.co.ke/dashboard-preview.png",aggregateRating:{"@type":"AggregateRating",ratingValue:"4.8",ratingCount:"150",bestRating:"5",worstRating:"1"},offers:[{"@type":"Offer",name:"Single Tenant Plan",price:"9200",priceCurrency:"KES",billingIncrement:"P1M"},{"@type":"Offer",name:"Multi-Tenant Plan",price:"18900",priceCurrency:"KES",billingIncrement:"P1M"}],featureList:["Funeral Case Management","Funeral Insurance Administration","Member Contribution Tracking","M-Pesa Integration","Claims Management","Family Portal","SMS Notifications","Financial Reporting"]},Zr={"@context":"https://schema.org","@type":"LocalBusiness",name:"Rest Point Technologies",description:"Funeral Home Management Software & Welfare Management System Provider in Kenya",image:"https://restpoint.co.ke/logo.png",url:"https://restpoint.co.ke",telephone:"+254-740-045-355",email:"info@restpoint.co.ke",address:{"@type":"PostalAddress",addressLocality:"Nairobi",addressCountry:"KE"},geo:{"@type":"GeoCoordinates",latitude:"-1.2921",longitude:"36.8219"},openingHoursSpecification:{"@type":"OpeningHoursSpecification",dayOfWeek:["Monday","Tuesday","Wednesday","Thursday","Friday"],opens:"08:00",closes:"18:00"},priceRange:"KES 9,200 - 189,000/month",areaServed:[{"@type":"City",name:"Nairobi"},{"@type":"City",name:"Mombasa"},{"@type":"City",name:"Kisumu"},{"@type":"Country",name:"Kenya"}]},et=r=>({"@context":"https://schema.org","@type":"FAQPage",mainEntity:r.map(a=>({"@type":"Question",name:a.question,acceptedAnswer:{"@type":"Answer",text:a.answer}}))}),rt=()=>(0,e.jsx)(Ur,{title:"Rest Point | Kenya's #1 Funeral Home Management System & Welfare Management Platform",description:"Complete funeral home management and welfare administration platform for churches, SACCOs, chamas, and organizations in Kenya. Manage cases, process funeral insurance claims, track member contributions, and serve families with dignity. Trusted by 500+ organizations. M-Pesa integrated.",keywords:"funeral management software Kenya, funeral home management system, welfare management software, funeral insurance administration, SACCO funeral software, church welfare management, chama management software, member contribution tracking, M-Pesa integration, funeral claims management, bereavement management, funeral cover administration, group funeral insurance, Kenya funeral software",url:"/",schema:[Vr,Qr,Zr,et([{question:"What is the best funeral management software in Kenya?",answer:"Rest Point is Kenya's #1 funeral home management and welfare management platform. Trusted by 500+ organizations including funeral homes, churches, SACCOs, and companies across Kenya for case management, funeral insurance administration, and member contribution tracking."},{question:"How much does funeral management software cost in Kenya?",answer:"Rest Point offers affordable plans starting from KES 9,200/month for small organizations (Single Tenant) and KES 18,900/month for multi-branch organizations (Multi-Tenant). All plans include core features with no hidden fees."},{question:"Can funeral management software integrate with M-Pesa?",answer:"Yes! Rest Point seamlessly integrates with M-Pesa for automated premium collection, contribution tracking, and payment processing. This makes it perfect for Kenyan organizations looking to digitize their funeral welfare programs."},{question:"What features does funeral welfare management software need?",answer:"Essential features include: member registration and management, beneficiary designation, contribution tracking with M-Pesa integration, claims management, automated approvals workflow, financial reporting, SMS notifications, and family portal access. Rest Point includes all these features and more."},{question:"Is Rest Point suitable for churches and SACCOs?",answer:"Absolutely! Rest Point is specifically designed for churches, SACCOs, chamas, companies, and NGOs in Kenya. It offers tailored features like church welfare committee management, SACCO multi-branch support, SASRA compliance reporting, and member contribution tracking."},{question:"How does funeral insurance management software work?",answer:"Rest Point streamlines funeral insurance from member enrollment to claims processing. It automates premium collection via M-Pesa, manages beneficiary information, processes claims with digital workflows, calculates benefits automatically, and provides comprehensive reporting for stakeholders."}])]}),q={name:"Margaret Anne Whitlock",born:1938,passed:2025,age:"eighty-seven"},we=r=>r.trim().split(/\s+/)[0],tt=r=>(r=r.trim(),/s$/i.test(r)?r+"’":r+"’s");function at(){const r=(0,m.useRef)(null),[a,l]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{const s=r.current;if(!s)return;const i=new IntersectionObserver(([o])=>{o.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(s),()=>i.disconnect()},[]),[r,a]}var N=({children:r,delay:a=0,style:l={}})=>{const[s,i]=at();return(0,e.jsx)("div",{ref:s,style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(26px)",transition:`opacity 0.9s cubic-bezier(0.22,0.7,0.25,1) ${a}ms, transform 0.9s cubic-bezier(0.22,0.7,0.25,1) ${a}ms`,...l},children:r})},it=U`
.dm-section{position:relative;background:var(--dm-bone,#FAF8F4);color:#1C1A17;overflow:hidden;
  padding:clamp(4rem,8vw,7.5rem) 0}
.dm-section::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.035;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.dm-section{--dm-ink:#0A0B0D;--dm-bone:#FAF8F4;--dm-bone2:#F3EFE6;--dm-brass:#8B7355;--dm-brassL:#A98F6E;
  --dm-verd:#3D4F47;--dm-verdD:#2E3F37;--dm-accent:#C77B5E;--dm-line:#E3DDD0;--dm-gray:#8A8780;
  --dm-night:#0C0F0D;--dm-hair:rgba(250,248,244,.14);
  --dm-serif:'Fraunces',Georgia,serif;--dm-sans:'Inter','Helvetica Neue',sans-serif;--dm-mono:'JetBrains Mono',monospace}
.dm-section ::selection{background:rgba(199,123,94,.25)}
.dm-wrap{position:relative;z-index:2;max-width:1060px;margin:0 auto;padding:0 clamp(1.5rem,4vw,2.5rem)}
.dm-kicker{display:inline-flex;align-items:center;gap:.6rem;font-family:var(--dm-mono);font-size:.7rem;
  letter-spacing:.2em;text-transform:uppercase;color:var(--dm-accent);font-weight:600}
.dm-kicker::before{content:'';width:24px;height:1px;background:var(--dm-accent)}
.dm-title{margin-top:1.4rem;font-family:var(--dm-serif);font-weight:300;
  font-size:clamp(2.4rem,5vw,4.2rem);line-height:1.04;letter-spacing:-.03em;color:var(--dm-ink);max-width:21ch}
.dm-title em{font-style:italic;color:var(--dm-accent)}
.dm-sub{margin-top:1.6rem;font-family:var(--dm-sans);font-size:1.08rem;line-height:1.85;
  color:rgba(0,0,0,.62);max-width:58ch}

/* ── the demo stage ── */
.dm-stage{margin-top:3.2rem}
.dm-seg{display:inline-flex;border:1px solid var(--dm-line);border-radius:4px;overflow:hidden;background:#fff}
.dm-segbtn{padding:.85rem 1.4rem;background:transparent;border:0;cursor:pointer;color:var(--dm-gray);
  font-family:var(--dm-mono);font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:.25s}
.dm-segbtn+.dm-segbtn{border-left:1px solid var(--dm-line)}
.dm-segbtn.on{background:var(--dm-verd);color:var(--dm-bone)}
.dm-segbtn:not(.on):hover{color:var(--dm-ink)}
.dm-browser{margin-top:1.4rem;border:1px solid var(--dm-line);border-radius:10px;overflow:hidden;
  background:#fff;box-shadow:0 24px 60px -30px rgba(28,26,23,.35)}
.dm-chrome{display:flex;align-items:center;gap:1rem;padding:.7rem 1rem;background:var(--dm-night);border-bottom:1px solid var(--dm-hair)}
.dm-dots{display:flex;gap:6px}
.dm-dots i{width:9px;height:9px;border-radius:50%;background:#39423A;display:block}
.dm-url{flex:1;max-width:420px;background:#080908;border:1px solid var(--dm-hair);border-radius:5px;
  padding:.45rem .9rem;font-family:var(--dm-mono);font-size:.68rem;color:rgba(250,248,244,.55);letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dm-screen{position:relative;min-height:540px}

/* the "typical software" pane — deliberately bland */
.dm-pane{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:2rem}
.dm-typical{background:#f4f4f4;color:#444;font-family:Arial,Helvetica,sans-serif}
.dm-tcard{text-align:center;max-width:340px}
.dm-tcheck{width:52px;height:52px;margin:0 auto;border-radius:50%;background:#4caf50;display:grid;place-items:center}
.dm-tcheck svg{width:24px;height:24px;stroke:#fff;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
.dm-tcard h4{margin-top:1.1rem;font:700 19px/1.3 Arial;color:#333}
.dm-tcard p{margin-top:.7rem;font:400 13px/1.65 Arial;color:#888}
.dm-tref{margin-top:.6rem;font:400 12px/1.6 Arial;color:#aaa}
.dm-tbtn{margin-top:1.2rem;display:inline-block;padding:.6rem 1.1rem;border:1px solid #ccc;border-radius:3px;
  background:#eee;color:#999;font:400 12px/1 Arial;cursor:default}
.dm-tpowered{margin-top:1.6rem;font:400 10px/1 Arial;color:#c2c2c2;letter-spacing:.04em}
/* the "with your software" pane — the candle */
.dm-ours{background:var(--dm-night);flex-direction:column;overflow:hidden}
.dm-ours::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.35;mix-blend-mode:soft-light;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")}
.dm-candle{width:190px;aspect-ratio:300/430;display:block;margin-bottom:-9px;cursor:pointer;touch-action:pan-y;user-select:none}
.dm-oeyebrow{font-family:var(--dm-mono);font-size:.6rem;font-weight:600;letter-spacing:.32em;color:var(--dm-brassL);text-transform:uppercase}
.dm-oname{margin-top:.7rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1.7rem,3.6vw,2.3rem);line-height:1.1;color:var(--dm-bone)}
.dm-odates{margin-top:.6rem;font-family:var(--dm-mono);font-size:.62rem;font-weight:600;letter-spacing:.26em;color:rgba(250,248,244,.55)}
.domsg{margin-top:1rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1rem,2.2vw,1.3rem);line-height:1.35;color:var(--dm-brassL);max-width:22ch;text-align:center}
.dm-orv{opacity:0;transform:translateY(14px);filter:blur(5px);
  transition:opacity .9s ease,transform .9s cubic-bezier(.22,.7,.25,1),filter .9s ease}
.dm-orv.in{opacity:1;transform:none;filter:none}

.dm-under{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.1rem;flex-wrap:wrap}
.dm-note{font-family:var(--dm-serif);font-style:italic;font-weight:500;font-size:.9rem;line-height:1.6;color:var(--dm-gray)}
.dm-replay{display:inline-flex;align-items:center;gap:.55rem;padding:.65rem 1.1rem;background:transparent;
  border:1px solid var(--dm-line);border-radius:4px;color:#1C1A17;cursor:pointer;
  font-family:var(--dm-mono);font-size:.64rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;transition:.25s}
.dm-replay:hover{border-color:var(--dm-brass);color:var(--dm-brass)}
.dm-replay svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round}

/* ── selling points ── */
.dm-points{margin-top:4.2rem;display:grid;grid-template-columns:repeat(3,1fr);gap:2.2rem}
.dm-pt{border-top:1px solid var(--dm-line);padding-top:1.5rem}
.dm-pt svg{width:20px;height:20px;stroke:var(--dm-brass);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.dm-pt h5{margin-top:1rem;font-family:var(--dm-mono);font-size:.7rem;font-weight:600;
  letter-spacing:.16em;text-transform:uppercase;color:var(--dm-ink)}
.dm-pt p{margin-top:.6rem;font-family:var(--dm-sans);font-size:.92rem;line-height:1.75;color:rgba(0,0,0,.6)}

/* ── CTA + closer ── */
.dm-cta{margin-top:4.4rem;display:flex;gap:.9rem;flex-wrap:wrap;align-items:center}
.dm-btn{display:inline-flex;align-items:center;gap:.6rem;padding:1.05rem 1.6rem;border-radius:4px;cursor:pointer;
  font-family:var(--dm-mono);font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  text-decoration:none;border:1px solid transparent;transition:.25s}
.dm-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s}
.dm-btn:hover svg{transform:translateX(3px)}
.dm-solid{background:var(--dm-verd);color:var(--dm-bone)}
.dm-solid:hover{background:var(--dm-verdD)}
.dm-ghost{color:var(--dm-ink);border-color:var(--dm-line);background:transparent}
.dm-ghost:hover{border-color:var(--dm-gray)}
.dm-closer{margin-top:3.4rem;font-family:var(--dm-serif);font-style:italic;font-weight:500;
  font-size:clamp(1.15rem,2.6vw,1.55rem);line-height:1.5;color:rgba(0,0,0,.62);max-width:44ch}
.dm-closer b{color:var(--dm-brass);font-weight:500}

@media(max-width:760px){
  .dm-points{grid-template-columns:1fr;gap:1.6rem}
  .dm-screen{min-height:600px}
  .dm-under{justify-content:center}
}
@media(prefers-reduced-motion:reduce){
  .dm-orv,.dm-orv.in{transition:none;transform:none;filter:none;opacity:1}
}
`,W=Math.PI*2,Y=300,_=430,z=150,Z=372,ae=226,I=(r,a,l,s,i)=>{r.beginPath(),r.ellipse(a,l,s,i,0,0,W)};function de(r,a,l,s,i){r.beginPath(),r.moveTo(a-i/2,l),r.quadraticCurveTo(a-i/2,l+s*.72,a,l+s),r.quadraticCurveTo(a+i/2,l+s*.72,a+i/2,l),r.quadraticCurveTo(a,l+2.5,a-i/2,l),r.fill()}function nt(r,a,l){const s=document.createElement("canvas");s.width=r,s.height=a;const i=s.getContext("2d");i.setTransform(l,0,0,l,0,0),i.fillStyle="#221a10",I(i,z,375,80,14),i.fill(),i.strokeStyle="rgba(190,146,80,.55)",i.lineWidth=1.6,I(i,z,375,80,14),i.stroke(),i.fillStyle="#120d07",I(i,z,373,70,10.5),i.fill(),i.fillStyle="rgba(0,0,0,.6)",I(i,z,371,46,7),i.fill();const o=i.createLinearGradient(107,0,193,0);return o.addColorStop(0,"#c9b48d"),o.addColorStop(.16,"#ecdcb9"),o.addColorStop(.5,"#f6ebd1"),o.addColorStop(.84,"#e3d0a9"),o.addColorStop(1,"#bda87f"),i.fillStyle=o,i.beginPath(),i.moveTo(107,246),i.lineTo(107,366),i.quadraticCurveTo(107,Z,113,Z),i.lineTo(187,Z),i.quadraticCurveTo(193,Z,193,366),i.lineTo(193,245),i.bezierCurveTo(183,240,174,249,156,241),i.bezierCurveTo(144,235,128,248,109,241),i.closePath(),i.fill(),de(i,117,241,20,7),de(i,180,240,12,6),de(i,140,243,8,5),i.fillStyle="#dcc79d",I(i,z,242,37,4.5),i.fill(),i.fillStyle="#c8b184",I(i,z,242.5,30,3),i.fill(),s}function ot(r,a){const l=z+a*4,s=ae;r.strokeStyle="#33261a",r.lineWidth=3,r.lineCap="round",r.beginPath(),r.moveTo(z,242),r.quadraticCurveTo(z+a*2,234,l,s),r.stroke(),r.fillStyle="#171008",r.beginPath(),r.arc(l,s,2.4,0,W),r.fill()}var st=r=>(Math.sin(r*6.3)+.6*Math.sin(r*11.1+1.7)+.35*Math.sin(r*19.3+.6)+.5*Math.sin(r*1.7+3))/2.45;function lt(r,a,l,s){const i=a.scl;r.setTransform(i,0,0,i,0,0),r.clearRect(0,0,Y,_);const o=st(l)*s,f=(a.wind+Math.sin(l*.7)*.12+Math.sin(l*1.9+2)*.07)*s,c=z+f*4,g=(64+a.pulse*26)*(.2+.8*a.ig)*(1+.055*o-.16*Math.min(1,Math.abs(a.wind))),x=f*15+o*2.4,v=228,d=c+x*.55,b=228-g;if(a.lastTip={x:d,y:b},r.globalAlpha=.1+.9*a.ig,r.drawImage(a.staticLayer,0,0,Y,_),r.globalAlpha=1,ot(r,f),r.globalCompositeOperation="lighter",a.ig>.02){let p=r.createRadialGradient(c,v-g*.45,0,c,v-g*.45,300);p.addColorStop(0,`rgba(255,166,70,${.075*a.ig})`),p.addColorStop(1,"rgba(255,166,70,0)"),r.fillStyle=p,r.fillRect(0,0,Y,_);const u=c+x*.4,y=v-g*.4,w=95+o*9+a.pulse*30;p=r.createRadialGradient(u,y,0,u,y,w),p.addColorStop(0,`rgba(255,176,84,${.3*a.ig})`),p.addColorStop(.5,`rgba(255,140,50,${.1*a.ig})`),p.addColorStop(1,"rgba(255,120,40,0)"),r.fillStyle=p,r.beginPath(),r.arc(u,y,w,0,W),r.fill(),r.beginPath(),r.moveTo(c-7.5,v),r.bezierCurveTo(c-9.5+x*.25,v-g*.42,d-5,v-g*.68,d,b),r.bezierCurveTo(d+5,v-g*.66,c+9.5+x*.25,v-g*.4,c+7.5,v),r.quadraticCurveTo(c,234,c-7.5,v);let j=r.createLinearGradient(0,232,0,b);j.addColorStop(0,`rgba(255,200,120,${.9*a.ig})`),j.addColorStop(.35,`rgba(255,158,54,${.85*a.ig})`),j.addColorStop(.75,`rgba(255,105,25,${.45*a.ig})`),j.addColorStop(1,"rgba(255,70,10,0)"),r.fillStyle=j,r.fill();const C=g*.55,A=c+x*.75,P=v-C;r.beginPath(),r.moveTo(c-4.6,v),r.bezierCurveTo(c-5.8+x*.2,v-C*.5,A-2.6,v-C*.75,A,P),r.bezierCurveTo(A+2.6,v-C*.73,c+5.8+x*.2,v-C*.48,c+4.6,v),r.quadraticCurveTo(c,232,c-4.6,v);let M=r.createLinearGradient(0,230,0,P);if(M.addColorStop(0,`rgba(255,248,225,${.95*a.ig})`),M.addColorStop(.55,`rgba(255,220,150,${.55*a.ig})`),M.addColorStop(1,"rgba(255,190,90,0)"),r.fillStyle=M,r.fill(),a.ig<.35){const he=(2.5+a.ig*14)*3,Q=r.createRadialGradient(c,ae,0,c,ae,he);Q.addColorStop(0,"rgba(255,190,90,.95)"),Q.addColorStop(.4,"rgba(255,110,25,.5)"),Q.addColorStop(1,"rgba(255,60,0,0)"),r.fillStyle=Q,r.beginPath(),r.arc(c,ae,he,0,W),r.fill()}!a.RM&&a.ig>.85&&Math.random()<.012+Math.abs(a.wind)*.1+a.pulse*.2&&a.embers.length<26&&a.embers.push({x:d+(Math.random()-.5)*6,y:b+8,vx:(Math.random()-.5)*.3,vy:-(.45+Math.random()*.6),life:1,dk:.006+Math.random()*.008,seed:Math.random()*10})}for(let p=a.embers.length-1;p>=0;p--){const u=a.embers[p];if(u.x+=u.vx+Math.sin(u.life*9+u.seed)*.35+a.wind*.5,u.y+=u.vy,u.vy*=.995,u.life-=u.dk,u.life<=0){a.embers.splice(p,1);continue}const y=u.life*u.life;r.fillStyle=`rgba(255,140,50,${.2*y})`,r.beginPath(),r.arc(u.x,u.y,3.2*u.life+1,0,W),r.fill(),r.fillStyle=`rgba(255,214,140,${.9*y})`,r.beginPath(),r.arc(u.x,u.y,1.5*u.life+.4,0,W),r.fill()}r.globalCompositeOperation="source-over"}function dt(){const[r,a]=(0,m.useState)("typical"),[l,s]=(0,m.useState)(0),[i,o]=(0,m.useState)(0),f=(0,m.useRef)(null),c=(0,m.useRef)({ig:0,igT:0,wind:0,windT:0,pulse:0,embers:[],lastTip:{x:z,y:166},lastPX:null,scl:1,staticLayer:null,t0:0,raf:null,RM:typeof window<"u"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}),g=(0,m.useCallback)(()=>{const p=f.current,u=c.current;if(!p)return;const y=Math.min(window.devicePixelRatio||1,2),w=p.getBoundingClientRect();w.width&&(p.width=Math.round(w.width*y),p.height=Math.round(w.width*y*_/Y),u.scl=p.width/Y,u.staticLayer=nt(p.width,p.height,u.scl))},[]);(0,m.useEffect)(()=>{if(r!=="ours")return;const p=f.current;if(!p)return;const u=p.getContext("2d"),y=c.current,w=y.RM?.25:1;y.ig=0,y.igT=0,y.embers=[],o(0),g(),y.t0||(y.t0=performance.now());const j=P=>{const M=(P-y.t0)/1e3;y.ig+=(y.igT-y.ig)*(y.RM?.15:.028),y.windT=Math.max(-2.4,Math.min(2.4,y.windT))*.9,y.wind+=(y.windT-y.wind)*.1,y.pulse*=.94,lt(u,y,M,w),y.raf=requestAnimationFrame(j)};y.raf=requestAnimationFrame(j);const C=[setTimeout(()=>{y.igT=1},450),...[650,1e3,1350,1800].map((P,M)=>setTimeout(()=>o(M+1),P))],A=()=>g();return window.addEventListener("resize",A),()=>{cancelAnimationFrame(y.raf),C.forEach(clearTimeout),window.removeEventListener("resize",A)}},[r,l,g]);const x=p=>{a(p),p==="ours"&&s(u=>u+1)},v=p=>{const u=c.current,y=f.current;if(!y||u.ig<.3)return;const w=y.getBoundingClientRect(),j=(p.clientX-w.left)/w.width*Y,C=(p.clientY-w.top)/w.height*_;if(u.lastPX!==null){const A=Math.hypot(j-z,C-196);A<190&&(u.windT+=(p.clientX-u.lastPX)*.012*(1-A/190))}u.lastPX=p.clientX},d=()=>{c.current.lastPX=null},b=()=>{const p=c.current;if(!(p.ig<.4)){p.pulse=Math.min(1.3,p.pulse+.9);for(let u=0;u<7&&p.embers.length<30;u++)p.embers.push({x:p.lastTip.x+(Math.random()-.5)*8,y:p.lastTip.y+10,vx:(Math.random()-.5)*.8,vy:-(.7+Math.random()*.9),life:1,dk:.008+Math.random()*.01,seed:Math.random()*10})}};return(0,e.jsxs)("section",{className:"dm-section",id:"directors",children:[(0,e.jsx)(it,{}),(0,e.jsxs)("div",{className:"dm-wrap",children:[(0,e.jsx)(N,{children:(0,e.jsx)("p",{className:"dm-kicker",children:"For Funeral Directors"})}),(0,e.jsx)(N,{delay:90,children:(0,e.jsxs)("h2",{className:"dm-title",children:["The last screen a family sees shouldn't feel like ",(0,e.jsx)("em",{children:"a receipt."})]})}),(0,e.jsx)(N,{delay:150,children:(0,e.jsx)("p",{className:"dm-sub",children:"When a registration is complete, grief is at its loudest. Every other system answers that moment with a green tick. Yours answers it with a candle. Flip the switch below and watch what a family feels when it's your firm on the other side of the screen."})}),(0,e.jsx)(N,{delay:220,children:(0,e.jsxs)("div",{className:"dm-stage",children:[(0,e.jsxs)("div",{className:"dm-seg",role:"group","aria-label":"Compare the two experiences",children:[(0,e.jsx)("button",{type:"button",className:`dm-segbtn${r==="typical"?" on":""}`,"aria-pressed":r==="typical",onClick:()=>x("typical"),children:"Typical software"}),(0,e.jsx)("button",{type:"button",className:`dm-segbtn${r==="ours"?" on":""}`,"aria-pressed":r==="ours",onClick:()=>x("ours"),children:"With  RestPoint software"})]}),(0,e.jsxs)("div",{className:"dm-browser",children:[(0,e.jsxs)("div",{className:"dm-chrome",children:[(0,e.jsxs)("span",{className:"dm-dots","aria-hidden":"true",children:[(0,e.jsx)("i",{}),(0,e.jsx)("i",{}),(0,e.jsx)("i",{})]}),(0,e.jsx)("span",{className:"dm-url",children:r==="typical"?"funeralhome.com/registration — submitted":`funeralhome.com/in-memory-of-${we(q.name).toLowerCase()}`})]}),(0,e.jsx)("div",{className:"dm-screen",children:r==="typical"?(0,e.jsx)("div",{className:"dm-pane dm-typical",children:(0,e.jsxs)("div",{className:"dm-tcard",children:[(0,e.jsx)("div",{className:"dm-tcheck","aria-hidden":"true",children:(0,e.jsx)("svg",{viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M5 12.5 10 17.5 19 7"})})}),(0,e.jsx)("h4",{children:"Registration successful"}),(0,e.jsx)("p",{children:"Your form has been submitted. Please do not reply to this message. A representative may contact you in 3–5 business days."}),(0,e.jsx)("p",{className:"dm-tref",children:"Reference: #SB-2026-01147 · 12:22 PM"}),(0,e.jsx)("span",{className:"dm-tbtn",children:"Print this page"}),(0,e.jsx)("p",{className:"dm-tpowered",children:"Powered by GenericForms v2.3"})]})}):(0,e.jsxs)("div",{className:"dm-pane dm-ours",onPointerMove:v,onPointerLeave:d,children:[(0,e.jsx)("canvas",{ref:f,className:"dm-candle",width:300,height:430,role:"img","aria-label":"A candle lit in memory",onPointerDown:b}),(0,e.jsx)("p",{className:`dm-oeyebrow dm-orv${i>=1?" in":""}`,children:"The register is signed"}),(0,e.jsx)("h4",{className:`dm-oname dm-orv${i>=2?" in":""}`,children:q.name}),(0,e.jsxs)("p",{className:`dm-odates dm-orv${i>=3?" in":""}`,children:[q.born," — ",q.passed,"  ·  ",q.age," years"]}),(0,e.jsxs)("p",{className:`domsg dm-orv${i>=4?" in":""}`,children:[tt(we(q.name))," story is now in our care."]})]})})]}),(0,e.jsxs)("div",{className:"dm-under",children:[(0,e.jsx)("p",{className:"dm-note",children:"This is the real thing live code, running in your browser right now. Try moving your cursor near the flame."}),r==="ours"&&(0,e.jsxs)("button",{type:"button",className:"dm-replay",onClick:()=>s(p=>p+1),children:[(0,e.jsx)("svg",{viewBox:"0 0 16 16",children:(0,e.jsx)("path",{d:"M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"})}),"Light it again"]})]})]})}),(0,e.jsxs)("div",{className:"dm-points",children:[(0,e.jsx)(N,{children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsxs)("svg",{viewBox:"0 0 20 20",children:[(0,e.jsx)("circle",{cx:"10",cy:"10",r:"7.5"}),(0,e.jsx)("path",{d:"M7 10.2 9.2 12.4 13.2 7.6"})]}),(0,e.jsx)("h5",{children:"Fully white label"}),(0,e.jsx)("p",{children:"Your firm's name, your colours, your words. The family only ever sees you  never us, never a vendor logo."})]})}),(0,e.jsx)(N,{delay:110,children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M8 12 12 8M7.5 9.5 5.4 11.6a3.2 3.2 0 0 0 4.5 4.5l2.1-2.1M12.5 10.5l2.1-2.1a3.2 3.2 0 0 0-4.5-4.5L8 6"})}),(0,e.jsx)("h5",{children:"Plugs into what you already use"}),(0,e.jsx)("p",{children:"Your existing form passes the name and dates through a simple link. No migration, no retraining, live the same day."})]})}),(0,e.jsx)(N,{delay:220,children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M10 17S3.5 12.8 3.5 8.2C3.5 5.9 5.3 4 7.6 4c1 0 1.9.4 2.4 1.1C10.5 4.4 11.4 4 12.4 4c2.3 0 4.1 1.9 4.1 4.2C16.5 12.8 10 17 10 17z"})}),(0,e.jsx)("h5",{children:"Nothing for families to do"}),(0,e.jsx)("p",{children:"No buttons to find, no text to read, no next steps. The page simply keeps the light on   and that's the point."})]})})]}),(0,e.jsxs)("div",{className:"dm-cta",children:[(0,e.jsx)(N,{children:(0,e.jsxs)("a",{className:"dm-btn dm-solid",href:"mailto:hello@restpoint.co.ke?subject=Walkthrough%20—%20the%20confirmation%20moment",children:["Book a 15-minute walkthrough",(0,e.jsx)("svg",{viewBox:"0 0 16 16",children:(0,e.jsx)("path",{d:"M2.5 8h10.5M9 3.8 13.2 8 9 12.2"})})]})}),(0,e.jsx)(N,{delay:110,children:(0,e.jsx)(Re,{className:"dm-btn dm-ghost",to:"/memorial",children:"Open the live memorial experience"})})]}),(0,e.jsx)(N,{delay:150,children:(0,e.jsxs)("p",{className:"dm-closer",children:["Families don't compare feature lists. They remember ",(0,e.jsx)("b",{children:"how they were treated"}),"  and they tell that story at every gathering for the next year."]})})]})]})}var ct=({end:r,suffix:a=""})=>{const[l,s]=(0,m.useState)(0),[i,o]=(0,m.useState)(!1),f=(0,m.useRef)(null);return(0,m.useEffect)(()=>{const c=f.current;if(!c)return;const g=new IntersectionObserver(([x])=>{x.isIntersecting&&(o(!0),g.disconnect())},{threshold:.1});return g.observe(c),()=>g.disconnect()},[]),(0,m.useEffect)(()=>{if(!i)return;let c=0;const g=r/(1500/16),x=setInterval(()=>{c+=g,c>=r?(s(r),clearInterval(x)):s(Math.floor(c))},16);return()=>clearInterval(x)},[i,r]),(0,e.jsxs)("span",{ref:f,children:[l.toLocaleString(),a]})},mt=n.section`
  padding: clamp(4rem, 8vw, 7rem) 0;
  background: ${t.bone};
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
`,pt=n.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
  box-sizing: border-box;
`,gt=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${t.brass};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before {
    content: '';
    width: 12px;
    height: 2px;
    background: ${t.brass};
    display: inline-block;
  }
`,ht=n.h2`
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 600;
  color: ${t.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;
  max-width: 560px;
  margin-bottom: 0.75rem;
`,ft=n.p`
  font-size: 0.95rem;
  color: ${t.gray};
  line-height: 1.7;
  max-width: 500px;
  margin-bottom: 2.5rem;
`,xt=n.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  box-sizing: border-box;

  & > .hero  { grid-column: span 1; grid-row: span 2; min-height: 400px; }
  & > .wide  { grid-column: span 1; min-height: 180px; }
  & > .tall  { min-height: 180px; }

  & > * {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    & > .hero { grid-column: span 2; grid-row: span 2; min-height: 340px; }
    & > .wide { grid-column: span 1; min-height: 180px; }
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 12px;
    & > .hero,
    & > .wide { grid-column: span 1; grid-row: span 1; min-height: 220px; }
    & > .tall  { min-height: 180px; }
  }
`,ut=n.div`
  position: relative;
  border-radius: 14px;
  background: ${t.ink};
  border: 1px solid rgba(250,248,244,0.07);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: ${r=>r.$hero?"400px":"180px"};

  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    transform 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    box-shadow 0.4s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px -10px rgba(21,23,26,0.4);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--gx, 50%) var(--gy, 40%),
      rgba(61,79,71,0.12) 0%,
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover::before { opacity: 1; }
`,bt=n.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(61,79,71,0.2);
  border: 1px solid rgba(61,79,71,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  svg { color: ${t.brassLight}; }
`,vt=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${t.brassLight};
  margin-bottom: 0.3rem;
`,yt=n.h3`
  font-family: 'Fraunces', serif;
  font-size: ${r=>r.$hero?"1.5rem":"1.2rem"};
  font-weight: 600;
  color: ${t.bone};
  margin-bottom: 0.4rem;
`,wt=n.p`
  font-size: ${r=>r.$hero?"0.9rem":"0.8rem"};
  color: rgba(250,248,244,0.5);
  line-height: 1.6;
  max-width: ${r=>r.$hero?"400px":"100%"};
  flex: 1;
`,jt=n.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.44rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.04);
  color: rgba(250,248,244,0.3);
  margin-top: 0.5rem;
`,kt=n.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(250,248,244,0.2);
  svg { width: 12px; height: 12px; }
`,Ft=n.div`
  position: relative;
  border-radius: 14px;
  background: ${t.ink};
  border: 1px solid rgba(250,248,244,0.07);
  padding: 1.4rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 180px;

  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    transform 0.7s cubic-bezier(0.16,1,0.3,1) var(--delay, 0ms),
    box-shadow 0.4s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px -10px rgba(21,23,26,0.4);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--gx, 50%) var(--gy, 40%),
      ${r=>r.$glow||"rgba(61,79,71,0.1)"} 0%,
      transparent 55%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover::before { opacity: 1; }
`,zt=n.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.6rem;
`,Nt=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.52rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(250,248,244,0.35);
  white-space: pre-line;
  line-height: 1.5;
`,St=n.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${r=>r.$bg||"rgba(61,79,71,0.12)"};
  border: 1px solid ${r=>r.$border||"rgba(61,79,71,0.15)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 16px; height: 16px; }
`,$t=n.div`
  font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  color: ${t.bone};
  line-height: 1;
  letter-spacing: -0.03em;
  margin: 0.4rem 0;
  span { font-size: 0.9rem; font-weight: 500; color: rgba(250,248,244,0.4); margin-left: 0.1rem; }
`,Ct=n.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  padding: 0.14rem 0.4rem;
  border-radius: 3px;
  color: ${r=>r.$up?"#7db8a0":t.brassLight};
  background: ${r=>r.$up?"rgba(125,184,160,0.1)":"rgba(169,143,110,0.1)"};
  margin-bottom: 0.5rem;
`,At=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`,Mt=n.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${t.bone};
`,Et=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.46rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.16rem 0.45rem;
  border-radius: 3px;
  border: 1px solid rgba(250,248,244,0.08);
  color: rgba(250,248,244,0.4);
`,Tt=[{id:"body-intake",label:"Case Management",title:"Body Intake Form",desc:"Digital registration with next of kin details, verification, and signature capture in one structured flow.",icon:pe,tags:["Digital Forms","Sign-off","Auto ID"],preview:"/preview/body-intake",delay:0,hero:!0},{id:"release-form",label:"Self-Service",title:"Release Form Portal",desc:"Families complete release documentation independently   digital forms and e-signature, no staff needed.",icon:nr,tags:["E-Sign","ID Verify","Auto-Process"],preview:"/preview/release-form",delay:200,hero:!1},{id:"reception",label:"Receptionist Portal",title:"Reception Portal",desc:"Manage walk-in clients, track visits, and streamline reception workflows.",icon:Qe,tags:["Walk-ins","Tracking","Workflow"],preview:"/preview/reception-portal",delay:300,hero:!1}],Rt=[{id:"active",label:`Active
Sessions`,number:54,suffix:"",change:"+12% this week",up:!0,name:"Current Users",tag:"Live",iconBg:"rgba(61,79,71,0.12)",iconBorder:"rgba(61,79,71,0.15)",iconColor:"#7db8a0",glow:"rgba(61,79,71,0.12)",icon:rr,delay:80},{id:"completed",label:`Completed
Forms`,number:128,suffix:"",change:"+28% this month",up:!0,name:"Total Submissions",tag:"Done",iconBg:"rgba(125,184,160,0.12)",iconBorder:"rgba(125,184,160,0.15)",iconColor:"#7db8a0",glow:"rgba(125,184,160,0.1)",icon:Ve,delay:160}];function Bt({m:r}){const a=(0,m.useRef)(null),l=R(),s=r.icon,i=(0,m.useCallback)(f=>{const c=a.current;if(!c)return;const g=c.getBoundingClientRect();c.style.setProperty("--gx",((f.clientX-g.left)/g.width*100).toFixed(1)+"%"),c.style.setProperty("--gy",((f.clientY-g.top)/g.height*100).toFixed(1)+"%")},[]),o=()=>{r.preview&&l(r.preview)};return(0,e.jsxs)(ut,{ref:a,id:`bento-${r.id}`,className:r.hero?"hero":"wide",style:{"--delay":`${r.delay}ms`},$hero:r.hero,onMouseMove:i,onClick:o,children:[(0,e.jsx)(bt,{children:(0,e.jsx)(s,{size:24})}),(0,e.jsx)(vt,{children:r.label}),(0,e.jsx)(yt,{$hero:r.hero,children:r.title}),(0,e.jsx)(wt,{$hero:r.hero,children:r.desc}),(0,e.jsx)("div",{style:{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginTop:"0.8rem"},children:r.tags.map(f=>(0,e.jsx)(jt,{children:f},f))}),(0,e.jsxs)(kt,{children:[(0,e.jsx)(er,{size:12}),"Preview Available"]})]})}function Pt({m:r}){const a=(0,m.useRef)(null),l=r.icon,s=(0,m.useCallback)(i=>{const o=a.current;if(!o)return;const f=o.getBoundingClientRect();o.style.setProperty("--gx",((i.clientX-f.left)/f.width*100).toFixed(1)+"%"),o.style.setProperty("--gy",((i.clientY-f.top)/f.height*100).toFixed(1)+"%")},[]);return(0,e.jsxs)(Ft,{ref:a,id:`bento-${r.id}`,className:"tall",style:{"--delay":`${r.delay}ms`},$glow:r.glow,onMouseMove:s,children:[(0,e.jsxs)(zt,{children:[(0,e.jsx)(Nt,{children:r.label}),(0,e.jsx)(St,{$bg:r.iconBg,$border:r.iconBorder,children:(0,e.jsx)(l,{size:16,color:r.iconColor})})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)($t,{children:[(0,e.jsx)(ct,{end:r.number}),r.suffix&&(0,e.jsx)("span",{children:r.suffix})]}),(0,e.jsx)(Ct,{$up:r.up,children:r.change})]}),(0,e.jsxs)(At,{children:[(0,e.jsx)(Mt,{children:r.name}),(0,e.jsx)(Et,{children:r.tag})]})]})}function qt(){const r=(0,m.useRef)(null);return(0,m.useEffect)(()=>{const a=r.current;if(!a)return;const l=a.querySelectorAll('[id^="bento-"]'),s=new IntersectionObserver(i=>i.forEach(o=>{o.isIntersecting&&(o.target.classList.add("visible"),s.unobserve(o.target))}),{threshold:.08});return l.forEach(i=>s.observe(i)),()=>s.disconnect()},[]),(0,e.jsx)(mt,{children:(0,e.jsxs)(pt,{children:[(0,e.jsx)(gt,{children:"Preview Modules"}),(0,e.jsx)(ht,{children:"Explore our self service modules"}),(0,e.jsx)(ft,{children:"Click on any card to preview the module in action. These self service tools are designed for tablet use."}),(0,e.jsxs)(xt,{ref:r,children:[Tt.map(a=>(0,e.jsx)(Bt,{m:a},a.id)),Rt.map(a=>(0,e.jsx)(Pt,{m:a},a.id))]})]})})}var It=()=>{const[r,a]=(0,m.useState)(!0),[l,s]=(0,m.useState)(!1);(0,m.useEffect)(()=>{let o=null;const f=()=>{a(!1),s(!1),clearTimeout(o),o=setTimeout(()=>a(!0),400)};return window.addEventListener("scroll",f,{passive:!0}),()=>{clearTimeout(o),window.removeEventListener("scroll",f)}},[]);const i="https://wa.me/254740045355?text=Hello%2C%20I%20have%20a%20question";return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
        /* Basic page styling context */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        /* --- FLOATING WIDGET STYLES --- */
                .floating-container {
          position: fixed;
          bottom: 30px;
          right: 30px; /* Pinned to bottom-right */
          z-index: 9999;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
                    align-items: flex-end; /* Align to right */
          gap: 15px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        /* Fade out animation when scrolling */
        .floating-container.hidden {
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none; /* Prevent clicks when hidden */
        }

        .floating-block {
          position: relative;
        }

        .floating-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          position: relative;
          transition: transform 0.3s ease, background-color 0.3s ease;
          text-decoration: none;
        }

        .floating-btn::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          z-index: -1;
          animation: pulse 2s infinite;
        }

        .whatsapp-btn { background-color: #25D366; }
        .whatsapp-btn::before { background-color: #25D366; }
        .whatsapp-btn:hover { background-color: #1ebe57; }

        .call-btn { background-color: #007bff; }
        .call-btn::before { background-color: #007bff; }
        .call-btn:hover { background-color: #0056b3; }

        /* --- RINGING ANIMATION FOR CALL ICON --- */
        .call-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          animation: shake 0.8s ease-in-out infinite; 
          transform-origin: 50% 50%;
        }

        .ringing-dots {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-left: 2px;
        }

        .ringing-dots span {
          display: block;
          background-color: white;
          border-radius: 50%;
          animation: blink 1s infinite both;
        }
        .ringing-dots span:nth-child(1) { width: 3px; height: 3px; animation-delay: 0.1s; }
        .ringing-dots span:nth-child(2) { width: 4px; height: 4px; animation-delay: 0.3s; }
        .ringing-dots span:nth-child(3) { width: 5px; height: 5px; animation-delay: 0.5s; }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }

        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        /* --- SMALL TOOLTIP FOR CALL BUTTON --- */
        .tooltip-text {
          position: absolute;
          right: 65px; /* sits just outside the LEFT of the button so it stays on screen */
          top: 50%;
          transform: translateY(-50%);
          background-color: #333;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        /* Small arrow pointing right towards the button */
        .tooltip-text::after {
          content: "";
          position: absolute;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 0 6px 6px;
          border-style: solid;
          border-color: transparent transparent transparent #333;
        }

        .call-btn:hover .tooltip-text {
          opacity: 1;
          visibility: visible;
        }

        /* --- CHAT POPUP FOR WHATSAPP BUTTON --- */
        .popup-box {
          position: absolute;
          bottom: 60px;
          right: 0; /* anchor to button's RIGHT edge so the popup opens LEFT (into the viewport) */
          width: min(300px, calc(100vw - 64px));
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .popup-box.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .popup-header {
          color: white;
          padding: 15px;
          display: flex;
          align-items: center;
        }
        .whatsapp-header { background-color: #075E54; }

        .avatar {
          width: 40px;
          height: 40px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 10px;
          overflow: hidden;
        }

        .header-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .header-info span { font-size: 12px; color: #d1d7db; }
        .header-info span::before { content: "● "; color: #25D366; }

        .popup-body { background-color: #ECE5DD; padding: 15px; min-height: 80px; }

        .popup-message {
          background-color: white;
          padding: 10px 15px;
          border-radius: 8px;
          max-width: 85%;
          font-size: 14px;
          color: #333;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          position: relative;
        }
        .popup-message::after {
          content: "";
          position: absolute;
          right: -8px; /* bubble sits to the LEFT of the button → arrow points right at it */
          top: 10px;
          border-width: 6px 0 6px 8px;
          border-style: solid;
          border-color: transparent transparent transparent white;
        }

        .popup-footer { padding: 15px; background-color: white; }

        .action-btn {
          display: block;
          width: 100%;
          padding: 12px;
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 15px;
          transition: background-color 0.3s;
        }
        .action-whatsapp { background-color: #25D366; }
        .action-whatsapp:hover { background-color: #1ebe57; }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}),(0,e.jsxs)("div",{className:`floating-container ${r?"":"hidden"}`,children:[(0,e.jsxs)("div",{className:"floating-block",onMouseEnter:()=>s(!0),onMouseLeave:()=>s(!1),children:[(0,e.jsxs)("div",{className:`popup-box ${l?"open":""}`,children:[(0,e.jsxs)("div",{className:"popup-header whatsapp-header",children:[(0,e.jsx)("div",{className:"avatar",children:(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",width:"25",height:"25",children:(0,e.jsx)("path",{fill:"#075E54",d:"M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C82.7 304 0 382.8 0 481.3C0 497.7 13.3 512 29.7 512H418.3c16.4 0 29.7-14.3 29.7-30.7C448 382.8 365.3 304 269.7 304H178.3z"})})}),(0,e.jsxs)("div",{className:"header-info",children:[(0,e.jsx)("h3",{children:"Restpoint WhatsApp Support"}),(0,e.jsx)("span",{children:"Online"})]})]}),(0,e.jsx)("div",{className:"popup-body",children:(0,e.jsxs)("div",{className:"popup-message",children:["Hi there  ",(0,e.jsx)("br",{})," Chat with us on WhatsApp!"]})}),(0,e.jsx)("div",{className:"popup-footer",children:(0,e.jsx)("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"action-btn action-whatsapp",children:"Start Chat"})})]}),(0,e.jsx)("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"floating-btn whatsapp-btn",children:(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",width:"28",height:"28",children:(0,e.jsx)("path",{fill:"#ffffff",d:"M380.9 97.1C339 55.1 283.2 32 223.9 32c-119.3 0-216 96.7-216 216 0 38.1 9.9 75.3 28.9 108.7L32 480l118.9-31.2c32.4 17.7 68.8 27 106.1 27h.1c119.3 0 216-96.7 216-216 0-59.3-25.2-115.1-67.2-157.1zM223.9 438.6c-31.7 0-62.9-8.5-90.1-24.6l-6.5-3.9-68.1 17.9 18.2-66.5-4.2-6.8c-17.5-27.9-26.7-60.2-26.7-93.6 0-97.8 79.6-177.4 177.4-177.4 47.4 0 91.9 18.5 125.4 52 33.5 33.6 52 78.1 52 125.5 0 97.8-79.6 177.4-177.4 177.4z"})})})]}),(0,e.jsxs)("div",{className:"floating-block",children:[(0,e.jsx)("span",{className:"tooltip-text",children:"Call: 0740045355"}),(0,e.jsx)("a",{href:"tel:0740045355",className:"floating-btn call-btn",children:(0,e.jsxs)("div",{className:"call-content",children:[(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",width:"24",height:"24",children:(0,e.jsx)("path",{fill:"#ffffff",d:"M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"})}),(0,e.jsxs)("div",{className:"ringing-dots",children:[(0,e.jsx)("span",{}),(0,e.jsx)("span",{}),(0,e.jsx)("span",{})]})]})})]})]})]})},Dt=()=>{const[r,a]=(0,m.useState)(!1),[l,s]=(0,m.useState)(""),[i,o]=(0,m.useState)(!1),[f,c]=(0,m.useState)(!1);(0,m.useEffect)(()=>(document.body.style.overflow=r?"hidden":"",()=>{document.body.style.overflow=""}),[r]);const g=()=>{r?(a(!1),setTimeout(()=>{c(!1),o(!1)},500)):a(!0)},x=v=>{v.preventDefault(),o(!0),setTimeout(()=>{o(!1),c(!0)},600)};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
        /* ============================================================
           REQUEST FREE DEMO — SLIDE-OUT PANEL
           (scoped with the "drp-" prefix to avoid collisions)
           ============================================================ */

        /* --- Vertical Trigger Tab (right edge) --- */
        .drp-trigger {
          position: fixed;
          top: 50%;
          right: 0;
          transform: translateY(-50%) rotate(90deg);
          transform-origin: right center;
          background: #0A0A0A;
          color: #C8B292;
          padding: 1.3rem 1.8rem; /* Increased padding for size */
          border-radius: 10px 0 0 10px;
          border: 1px solid rgba(169, 143, 110, 0.5);
          border-right: none;
          cursor: pointer;
          z-index: 60;
          box-shadow: -8px 0 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(169, 143, 110, 0.2); /* Added glow */
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 0.8rem;
          font-family: 'Inter', sans-serif;
          margin-right: 15px; /* Pushed left off the edge to be visible */
        }
        .drp-trigger:hover {
          background: #A98F6E;
          color: #0A0A0A;
          padding-right: 2.2rem;
          box-shadow: -8px 0 25px rgba(0, 0, 0, 0.5), 0 0 25px rgba(169, 143, 110, 0.4);
        }
        .drp-trigger i {
          transform: rotate(-90deg);
          font-size: 1.1rem;
        }

        /* Pulsing dot on the trigger */
        .drp-dot {
          width: 0.6rem;
          height: 0.6rem;
          background: #A98F6E;
          border-radius: 50%;
          animation: drp-pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes drp-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(169, 143, 110, 0); }
          100% { box-shadow: 0 0 0 0 rgba(169, 143, 110, 0); }
        }

        /* --- Backdrop Overlay --- */
        .drp-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 65;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .drp-backdrop.show {
          opacity: 1;
          pointer-events: auto;
        }

        /* --- Floating Close Button --- */
        .drp-close-fixed {
          position: fixed;
          top: 25px;
          right: 25px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0A0A0A;
          border: 1px solid rgba(169, 143, 110, 0.5);
          color: #A98F6E;
          font-size: 1.3rem;
          cursor: pointer;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .drp-close-fixed.show {
          opacity: 1;
          pointer-events: auto;
        }
        .drp-close-fixed:hover {
          background: #A98F6E;
          color: #0A0A0A;
          transform: rotate(90deg);
        }

        /* --- Slide-out Panel --- */
        .drp-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 100%;
          max-width: 900px;
          background-color: #0A0A0A;
          transform: translateX(100%);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 70; /* Sits above backdrop */
          display: flex;
          box-shadow: -20px 0 50px rgba(0, 0, 0, 0.3);
          font-family: 'Inter', sans-serif;
          color: #FAF8F4;
          overflow: hidden;
        }
        .drp-panel.active { transform: translateX(0); }

        /* --- Image Side --- */
        .drp-image-side {
          width: 40%;
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
        }
        .drp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.95) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
        }
        .drp-badge-wrap { margin-bottom: 1rem; }
        .drp-badge {
          display: inline-block;
          padding: 0.4rem 0.75rem;
          background: rgba(169, 143, 110, 0.2);
          border: 1px solid rgba(169, 143, 110, 0.5);
          color: #C8B292;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .drp-title {
          font-family: 'Fraunces', serif;
          font-size: 2.25rem;
          line-height: 1.25;
          color: #FAF8F4;
          margin-bottom: 0.75rem;
        }
        .drp-title em { font-style: italic; }
        .drp-check-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .drp-check {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #FAF8F4;
        }
        .drp-check i { color: #A98F6E; }
        .drp-check span { font-size: 0.875rem; }
        .drp-divider {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(250, 248, 244, 0.1);
        }
        .drp-quote {
          color: #8A8A8A;
          font-size: 0.75rem;
          font-style: italic;
          line-height: 1.6;
        }
        .drp-quote-author {
          color: #C8B292;
          font-size: 0.875rem;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        /* --- Form Side --- */
        .drp-form-side {
          width: 60%;
          display: flex;
          flex-direction: column;
          background-image: radial-gradient(circle at 90% 10%, rgba(61, 79, 71, 0.15) 0%, transparent 50%);
          position: relative;
        }
        .drp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #222;
          flex-shrink: 0;
        }
        .drp-header-label {
          font-size: 0.75rem;
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0;
        }
        .drp-header-title {
          font-family: 'Fraunces', serif;
          font-size: 1.25rem;
          color: #FAF8F4;
          margin: 0.25rem 0 0;
        }
        .drp-close { /* Keeping original close style hidden in header if needed, but floating is primary */
          background: none;
          border: none;
          color: #8A8A8A;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.3s;
          display: none; 
        }
        .drp-close:hover { color: #ffffff; }

        .drp-body {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }
        .drp-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Inputs */
        .drp-label {
          font-size: 10px;
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }
        .drp-input, .drp-select, .drp-textarea {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(138, 138, 138, 0.3);
          padding: 0.75rem 0;
          color: #FAF8F4;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.3s;
          resize: none;
          font-family: 'Inter', sans-serif;
          border-radius: 0;
        }
        .drp-input:focus, .drp-select:focus, .drp-textarea:focus {
          border-bottom-color: #A98F6E;
        }
        .drp-input::placeholder, .drp-textarea::placeholder { color: #555; }

        .drp-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A98F6E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right center;
          background-size: 10px;
          padding-right: 24px;
        }
        .drp-select option { background: #141414; color: #FAF8F4; }

        /* Dynamic branch field */
        .drp-branch {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, margin-top 0.4s ease, opacity 0.3s ease;
          opacity: 0;
        }
        .drp-branch.active {
          max-height: 200px;
          margin-top: 1.5rem;
          opacity: 1;
        }

        .drp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .drp-submit {
          background: linear-gradient(135deg, #A98F6E 0%, #C8B292 100%);
          color: #0A0A0A;
          width: 100%;
          padding: 1rem;
          border-radius: 6px;
          border: none;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        .drp-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(169, 143, 110, 0.2);
        }
        .drp-submit:disabled {
          opacity: 0.6;
          cursor: default;
          transform: none;
          box-shadow: none;
        }

        .drp-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #555;
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        /* --- Success Overlay --- */
        .drp-success {
          display: none;
          position: absolute;
          inset: 0;
          background: #0A0A0A;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          z-index: 10;
        }
        .drp-success.show { display: flex; }
        .drp-success-icon {
          width: 4rem;
          height: 4rem;
          background: #3D4F47;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          border: 1px solid #A98F6E;
        }
        .drp-success-icon i { color: #A98F6E; font-size: 1.5rem; }
        .drp-success-title {
          font-family: 'Fraunces', serif;
          font-size: 1.875rem;
          color: #FAF8F4;
          margin: 0 0 0.75rem;
        }
        .drp-success-text {
          color: #8A8A8A;
          max-width: 24rem;
          margin: 0 0 2rem;
          line-height: 1.7;
          font-size: 0.95rem;
        }
        .drp-success-close {
          color: #A98F6E;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 0.875rem;
          border: none;
          background: none;
          border-bottom: 1px solid #A98F6E;
          padding-bottom: 0.25rem;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .drp-image-side { display: none; }
          .drp-form-side { width: 100%; }
          .drp-panel { max-width: 100%; }
        }
        @media (max-width: 640px) {
          .drp-grid { grid-template-columns: 1fr; }
          .drp-overlay { padding: 2rem; }
          .drp-body { padding: 1.5rem; }
        }
      `}),(0,e.jsxs)("button",{className:"drp-trigger",onClick:g,"aria-label":"Request Free Demo","aria-expanded":r,children:[(0,e.jsx)("span",{className:"drp-dot"}),"Request Free Demo",(0,e.jsx)("i",{className:"fas fa-arrow-left","aria-hidden":"true"})]}),(0,e.jsx)("div",{className:`drp-backdrop ${r?"show":""}`,onClick:g,"aria-hidden":"true"}),(0,e.jsx)("button",{type:"button",className:`drp-close-fixed ${r?"show":""}`,onClick:g,"aria-label":"Close panel",children:(0,e.jsx)("i",{className:"fas fa-times","aria-hidden":"true"})}),(0,e.jsxs)("div",{className:`drp-panel ${r?"active":""}`,role:"dialog","aria-modal":"true","aria-label":"Request Free Demo",children:[(0,e.jsx)("div",{className:"drp-image-side",children:(0,e.jsxs)("div",{className:"drp-overlay",children:[(0,e.jsx)("div",{className:"drp-badge-wrap",children:(0,e.jsx)("span",{className:"drp-badge",children:"Concierge Onboarding"})}),(0,e.jsxs)("h2",{className:"drp-title",children:["Experience ",(0,e.jsx)("em",{children:"Restpoint"})," Risk-Free."]}),(0,e.jsxs)("div",{className:"drp-check-list",children:[(0,e.jsxs)("div",{className:"drp-check",children:[(0,e.jsx)("i",{className:"fas fa-check-circle","aria-hidden":"true"}),(0,e.jsx)("span",{children:"14-Day Free Trial"})]}),(0,e.jsxs)("div",{className:"drp-check",children:[(0,e.jsx)("i",{className:"fas fa-check-circle","aria-hidden":"true"}),(0,e.jsx)("span",{children:"Or 29 Days at just 5,000 KSH"})]}),(0,e.jsxs)("div",{className:"drp-check",children:[(0,e.jsx)("i",{className:"fas fa-check-circle","aria-hidden":"true"}),(0,e.jsx)("span",{children:"Guided setup by a specialist"})]})]}),(0,e.jsxs)("div",{className:"drp-divider",children:[(0,e.jsx)("p",{className:"drp-quote",children:'"Our team will personally handle your data migration and staff training. You focus on the families, we handle the software."'}),(0,e.jsx)("p",{className:"drp-quote-author",children:"— Amara, Client Success Lead"})]})]})}),(0,e.jsxs)("div",{className:"drp-form-side",children:[(0,e.jsxs)("div",{className:"drp-body",style:{paddingTop:"5rem"},children:[" ",(0,e.jsxs)("form",{className:"drp-form",onSubmit:x,children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-home-name",children:"Funeral Home Name"}),(0,e.jsx)("input",{id:"drp-home-name",type:"text",className:"drp-input",placeholder:"Sterling & Hayes Memorial",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-location",children:"Location (City, Country)"}),(0,e.jsx)("input",{id:"drp-location",type:"text",className:"drp-input",placeholder:"Nairobi, Kenya",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-branch-type",children:"Establishment Scale"}),(0,e.jsxs)("select",{id:"drp-branch-type",className:"drp-select",value:l,onChange:v=>s(v.target.value),required:!0,children:[(0,e.jsx)("option",{value:"",disabled:!0,children:"Select branch type"}),(0,e.jsx)("option",{value:"single",children:"Single Branch"}),(0,e.jsx)("option",{value:"multi",children:"Multi-Branch Network"})]})]}),(0,e.jsxs)("div",{className:`drp-branch ${l==="multi"?"active":""}`,children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-branches",children:"List All Branches"}),(0,e.jsx)("textarea",{id:"drp-branches",className:"drp-textarea",rows:"3",placeholder:"e.g., Nairobi HQ, Mombasa Branch, Kisumu Branch"})]}),(0,e.jsxs)("div",{className:"drp-grid",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-email",children:"Work Email"}),(0,e.jsx)("input",{id:"drp-email",type:"email",className:"drp-input",placeholder:"director@sterling.com",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("label",{className:"drp-label",htmlFor:"drp-phone",children:"Phone Number"}),(0,e.jsx)("input",{id:"drp-phone",type:"tel",className:"drp-input",placeholder:"+254 712 345 678",required:!0})]})]}),(0,e.jsx)("div",{children:(0,e.jsxs)("button",{type:"submit",className:"drp-submit",disabled:i,children:[i?"Processing...":"Activate My Trial",(0,e.jsx)("i",{className:"fas fa-arrow-right","aria-hidden":"true"})]})}),(0,e.jsxs)("div",{className:"drp-note",children:[(0,e.jsx)("i",{className:"fas fa-shield-halved","aria-hidden":"true"}),(0,e.jsx)("span",{children:"No credit card required for 14-day trial"})]})]})]}),(0,e.jsxs)("div",{className:`drp-success ${f?"show":""}`,children:[(0,e.jsx)("div",{className:"drp-success-icon",children:(0,e.jsx)("i",{className:"fas fa-check","aria-hidden":"true"})}),(0,e.jsx)("h3",{className:"drp-success-title",children:"Trial Activated."}),(0,e.jsx)("p",{className:"drp-success-text",children:"Thank you. Check your email for your secure login credentials. Our concierge team will call you shortly to begin onboarding."}),(0,e.jsx)("button",{type:"button",className:"drp-success-close",onClick:g,children:"Close Window"})]})]})]})]})},Lt=()=>{const r=(0,m.useRef)(null),[a,l]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{const s=r.current;if(!s)return;const i=new IntersectionObserver(([o])=>{o.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(s),()=>i.disconnect()},[]),[r,a]},Ot=({children:r,className:a="",style:l={},delay:s=0})=>{const[i,o]=Lt();return(0,e.jsx)("div",{ref:i,className:a,style:{opacity:o?1:0,transform:o?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${s}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${s}ms`,...l},children:r})},ee=[{tag:"Funeral Home Software",accent:"#C26B5A",items:[{q:"What kind of software do funeral homes use?",a:"Funeral homes use funeral home software, also known as funeral management software, mortuary management software, and deathcare operations software, to manage case files, funeral arrangements, family records, billing, scheduling, hearse dispatch, insurance claims, and document storage in one integrated system."},{q:"What is funeral management software?",a:"Funeral management software is a digital system built for funeral businesses to organize and automate operations. It helps funeral homes and mortuary service providers manage case management, invoicing, family communication, reporting, scheduling, and secure records in one modern platform."}]},{tag:"Funeral Business Operations",accent:"#5A7A6B",items:[{q:"What software do funeral businesses use for billing and claims?",a:"Many funeral businesses use funeral software with billing, invoicing, and insurance claim management features to track payments, manage contributions, process funeral policies, and handle payouts more efficiently and accurately."},{q:"Why do funeral homes need software?",a:"Funeral home software is essential because it reduces admin work, improves accuracy, speeds up processing, and creates a more organized and professional experience for families. It is especially valuable for funeral businesses handling large volumes of cases, claims, and documentation."}]},{tag:"Mortuary & Deathcare Software",accent:"#5E7C9A",items:[{q:"Do non-funeral organizations use the same software?",a:"Yes. Mortuary service providers, welfare organizations, deathcare networks, churches, and funeral insurance companies often use mortuary software and funeral business software to manage records, claims, member support, and family communication more effectively."},{q:"Can funeral software help welfare and insurance programs too?",a:"Absolutely. Funeral insurance software and welfare administration systems use the same core capabilities for member records, claims management, payouts, document tracking, and operational visibility across larger service networks."}]},{tag:"SEO & Business Growth",accent:"#A3875A",items:[{q:"Why is funeral software important for growth?",a:"Funeral software improves operational efficiency, reduces paperwork, and strengthens the client experience. It helps organizations scale their funeral business, improve family communication, and manage increasing case volumes without compromising service quality."},{q:"What is the best funeral software to look for?",a:"The best funeral software combines case management, family communication, billing, document automation, reporting, and secure access in one cloud-based platform. It should be designed for actual funeral operations and support both funeral homes and broader deathcare services."}]}],Wt=()=>{const r=R(),[a,l]=(0,m.useState)("0-0"),s=i=>l(o=>o===i?null:i);return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
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
      `}),(0,e.jsx)("section",{id:"faq",className:"faq-section",children:(0,e.jsxs)("div",{className:"faq-container",children:[(0,e.jsxs)(Ot,{className:"faq-sidebar",children:[(0,e.jsx)("div",{className:"faq-eyebrow",children:"Support Center"}),(0,e.jsxs)("h2",{className:"faq-title",children:["Frequently Asked ",(0,e.jsx)("span",{children:"Questions"})]}),(0,e.jsx)("p",{className:"faq-lead",children:"Answers to the questions people ask when searching for funeral home software, funeral management software, mortuary software, funeral business software, and modern deathcare systems for funeral service operations."}),(0,e.jsx)("div",{className:"faq-mobile-hero",children:ee[0]?.items[0]&&(()=>{const i=ee[0].items[0];return(0,e.jsxs)("div",{className:"faq-item open",children:[(0,e.jsxs)("button",{type:"button",className:"faq-q faq-q-hero",onClick:()=>s("0-0"),"aria-expanded":a==="0-0",children:[(0,e.jsx)("span",{className:"faq-q-text",children:i.q}),(0,e.jsx)("span",{className:"faq-q-icon"})]}),(0,e.jsx)("div",{className:"faq-answer",role:"region",children:(0,e.jsx)("div",{className:"faq-answer-inner",children:(0,e.jsx)("p",{className:"faq-a-text",children:i.a})})})]})})()}),(0,e.jsx)("nav",{className:"faq-nav","aria-label":"FAQ categories",children:ee.map((i,o)=>(0,e.jsxs)("a",{href:`#faq-cat-${o}`,className:"faq-nav-item",style:{"--faq-accent":i.accent},children:[(0,e.jsx)("span",{className:"faq-nav-dot",style:{background:i.accent}}),(0,e.jsx)("span",{children:i.tag})]},o))}),(0,e.jsxs)("div",{className:"faq-support",children:[(0,e.jsx)("div",{className:"faq-support-icon",children:(0,e.jsx)(Xe,{size:24,color:"#FFFFFF"})}),(0,e.jsx)("h4",{className:"faq-support-title",children:"Still have a question?"}),(0,e.jsx)("p",{className:"faq-support-desc",children:"Our team is one message away and happy to walk you through a live demo on your own tablets."}),(0,e.jsxs)("button",{className:"faq-support-btn",type:"button",onClick:()=>r("/contact"),children:["Talk to our team ",(0,e.jsx)(K,{size:14})]})]})]}),(0,e.jsx)("div",{className:"faq-list",children:ee.map((i,o)=>{const f=`faq-cat-${o}`;return(0,e.jsxs)("div",{id:f,className:"faq-cat",style:{"--faq-accent":i.accent},children:[(0,e.jsxs)("div",{className:"faq-cat-head",children:[(0,e.jsx)("span",{className:"faq-cat-line"}),(0,e.jsx)("h3",{className:"faq-cat-title",children:i.tag})]}),(0,e.jsx)("div",{className:"faq-items",children:i.items.map((c,g)=>{const x=`${o}-${g}`,v=a===x;return(0,e.jsxs)("div",{className:`faq-item${v?" open":""}`,children:[(0,e.jsxs)("button",{type:"button",className:"faq-q",onClick:()=>s(x),"aria-expanded":v,"aria-controls":`faq-a-${x}`,children:[(0,e.jsx)("span",{className:"faq-q-text",children:c.q}),(0,e.jsx)("span",{className:"faq-q-icon"})]}),(0,e.jsx)("div",{id:`faq-a-${x}`,className:"faq-answer",role:"region",children:(0,e.jsx)("div",{className:"faq-answer-inner",children:(0,e.jsx)("p",{className:"faq-a-text",children:c.a})})})]},x)})})]},o)})})]})})]})},Yt=U`
:root {
  --ink: #000000;
  --ink-soft: #0A0B0D;
  --ink-mid: #14161A;
  --bone: #FAF8F4;
  --bone2: #F3EFE6;
  --brass: #8B7355;
  --brassLight: #A98F6E;
  --verdigris: #3D4F47;
  --verdigrisDark: #2E3F37;
  --line: #E3DDD0;
  --line-dark: rgba(250, 248, 244, 0.1);
  --line-dark-strong: rgba(250, 248, 244, 0.18);
  --gray: #8A8780;
  --gray-light: rgba(0,0,0,0.6);
  --accent: #C77B5E;            /* Terracotta restored */
  --accent-soft: rgba(199, 123, 94, 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

/* ============ SECTION ============ */
.mission-section {
  position: relative;
  padding: clamp(4rem, 8vw, 8rem) 0;
  background: #FFFFFF;
  overflow: hidden;
}

/* Subtle paper grain texture */
.mission-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: multiply;
  z-index: 1;
}

.mission-container {
  position: relative;
  z-index: 2;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 4vw, 3rem);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 4rem;
  align-items: center;
}

/* ============ TEXT COLUMN ============ */
.mission-text {
  position: relative;
}

.mission-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 2rem;
  font-weight: 600;
}

.mission-tag::before {
  content: '';
  width: 24px; height: 1px;
  background: var(--accent);
}

.mission-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 300;
  line-height: 0.98;
  letter-spacing: -0.035em;
  color: var(--ink);
  margin-bottom: 2.5rem;
}

.mission-title em {
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
}

.mission-desc {
  font-family: 'Inter', sans-serif;
  font-size: 1.15rem;
  line-height: 1.8;
  color: var(--gray-light);
  margin-bottom: 3rem;
  max-width: 95%;
}

.mission-highlight {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line);
}

.highlight-text {
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 400;
  color: var(--verdigrisDark);
}

.highlight-text strong {
  color: var(--ink);
  font-weight: 600;
}

/* ============ VISUAL WRAPPER (Fixes clipping) ============ */
.mission-visual-wrap {
  position: relative;
  height: 620px;
}

/* Image Container */
.mission-image-box {
  position: absolute;
  top: 0;
  right: 0;
  width: 95%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 40px 80px -20px rgba(0,0,0,0.18);
}

.mission-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(1.05) saturate(0.9);
  transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
}

.mission-visual-wrap:hover .mission-image {
  transform: scale(1.03);
}

/* Dark gradient overlay on image */
.mission-image-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}

/* Floating Pure Black Overlay Card */
.portal-card {
  position: absolute;
  bottom: 2.5rem;
  left: -2.5rem;
  width: 90%;
  max-width: 380px;
  background: #000000; /* Pure black background */
  border: 1px solid var(--line-dark-strong);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 30px 60px rgba(0,0,0,0.35);
  z-index: 5;
}

.portal-tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--bone);
  background: var(--accent); /* Terracotta tag */
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 600;
}

.portal-title {
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--bone);
  line-height: 1.2;
  margin-bottom: 1rem;
}

.portal-title em {
  font-style: italic;
  color: var(--brassLight);
}

.portal-desc {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.portal-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--bone);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 0.2rem;
  transition: gap 0.3s ease;
}

.portal-cta:hover { gap: 0.8rem; }

/* ============ RESPONSIVE ============ */
@media (max-width: 980px) {
  .mission-container {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .mission-visual-wrap {
    height: 480px;
    margin-top: 2rem;
  }

  .portal-card {
    left: 1rem;
    right: 1rem;
    max-width: none;
    width: auto;
    bottom: 1rem;
    padding: 1.5rem;
  }
}

@media (max-width: 560px) {
  .mission-title { font-size: 2.5rem; }
  .mission-desc { font-size: 1rem; }
  .highlight-text { font-size: 1.2rem; }
}
`;function Ht(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Yt,{}),(0,e.jsx)("section",{className:"mission-section",children:(0,e.jsxs)("div",{className:"mission-container",children:[(0,e.jsxs)("div",{className:"mission-text",children:[(0,e.jsx)("div",{className:"mission-tag",children:"Our Mission"}),(0,e.jsxs)("h1",{className:"mission-title",children:["To make it easier to care for people when it ",(0,e.jsx)("em",{children:"matters most."})]}),(0,e.jsx)("p",{className:"mission-desc",children:"We give funeral homes and funeral insurers the technology to simplify operations, protect every detail, and deliver a better experience for the families they serve."}),(0,e.jsx)("div",{className:"mission-highlight",children:(0,e.jsxs)("p",{className:"highlight-text",children:[(0,e.jsx)("strong",{children:"Less complexity."})," More care."]})})]}),(0,e.jsxs)("div",{className:"mission-visual-wrap",children:[(0,e.jsx)("div",{className:"mission-image-box",children:(0,e.jsx)("img",{src:"/familyportal.png",alt:"A person thoughtfully using a digital tablet in a warm, modern space",className:"mission-image"})}),(0,e.jsxs)("div",{className:"portal-card",children:[(0,e.jsx)("span",{className:"portal-tag",children:"Rest Point Family Portal"}),(0,e.jsxs)("h3",{className:"portal-title",children:["Give Families a Digital Experience They'll ",(0,e.jsx)("em",{children:"Remember."})]}),(0,e.jsx)("p",{className:"portal-desc",children:"Take pride in offering an experience no one else provides. From transparent records to seamless communication, the Restpoint portal brings closure and clarity directly to the families you serve."}),(0,e.jsxs)(Re,{to:"preview/reception-portal",className:"portal-cta",children:["Explore the Portal",(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M5 12h14"}),(0,e.jsx)("path",{d:"m12 5 7 7-7 7"})]})]})]})]})]})})]})}var Gt=U`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`,k="#15171A",Jt="#FAF8F4",Xt="#F3EFE6",De="#8B7355",V="#E3DDD0",se="#6B6862",S="#C77B5E",_t=n.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: top 0.4s ease;
`,Kt=n.div`
  background: ${k};
  color: rgba(250, 248, 244, 0.7);
  padding: 0.5rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: max-height 0.4s ease, opacity 0.4s ease, padding 0.4s ease;
  max-height: 50px;
  overflow: hidden;

  &.hidden {
    max-height: 0;
    padding: 0;
    opacity: 0;
  }

  @media (max-width: 900px) {
    display: none;
  }
`,Ut=n.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`,je=n.div`display: flex; align-items: center; gap: 1.5rem;`,ce=n.div`display: flex; align-items: center; gap: 0.4rem;`,Vt=n.div`width: 6px; height: 6px; background: #4D9B7F; border-radius: 50%; box-shadow: 0 0 8px #4D9B7F;`,me=n.a`color: rgba(250, 248, 244, 0.7); text-decoration: none; transition: color 0.2s; &:hover { color: ${Jt}; }`,Qt=n.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${V};
  transition: box-shadow 0.4s ease, background 0.4s ease;

  &.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 30px -10px rgba(21, 23, 26, 0.08);
  }

  /* Mobile: fully opaque so animated hero text never bleeds
     through the fixed bar (backdrop blur on mobile makes the
     hero title appear to blink behind the nav). */
  @media (max-width: 900px) {
    background: #FFFFFF;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`,Zt=n.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.2rem 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr auto;
    padding: 0.65rem 1.25rem;
    gap: 1rem;
  }
`,ie=n.a`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  text-decoration: none;

  /* Mobile: logo removed — the slim bar shows only Client Login + hamburger */
  @media (max-width: 900px) {
    display: none;
  }
`,ea=n.div`
  width: 32px;
  height: 32px;
  position: relative;
  border: 1.5px solid ${k};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &::before, &::after {
    content: '';
    position: absolute;
    background: ${k};
    transition: background 0.3s;
  }
  &::before { width: 12px; height: 1.5px; }
  &::after { width: 1.5px; height: 12px; }

  ${ie}:hover & {
    transform: rotate(180deg);
    border-color: ${S};
  }
  ${ie}:hover &::before, ${ie}:hover &::after {
    background: ${S};
  }
`,ra=n.div`
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${k};
  letter-spacing: -0.02em;
`,ta=n.nav`
  display: flex;
  gap: 2.5rem;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    display: none;
  }
`,T=n.div`
  position: relative;
`,L=n.button`
  position: relative;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${se};
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 0;
  transition: color 0.3s ease, transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  background: none;
  border: none;
  font-family: 'Space Grotesk', sans-serif;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: ${S};
    transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    color: ${k};
    transform: translateY(-1px);
  }

  &:hover::after {
    width: 120%;
    left: -10%;
    transform: translateX(0);
  }

  &.active {
    color: ${k};
    font-weight: 600;
  }

  &.active::after {
    width: 120%;
    left: -10%;
    transform: translateX(0);
  }
`,aa=n(L)`
  background: #3D4F47 !important;
  color: white !important;
  padding: 0.6rem 1.25rem !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(61, 79, 71, 0.3) !important;
  
  &:hover {
    background: #2E3F37 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.4) !important;
  }
  
  &::after {
    display: none !important;
  }
  
  @media (max-width: 900px) {
    padding: 0.5rem 1rem !important;
    font-size: 0.8rem !important;
  }
`,ke=n.span`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${se};
  transition: transform 0.3s ease, border-top-color 0.3s ease;
  margin-left: 2px;

  ${T}:hover & {
    transform: rotate(180deg);
    border-top-color: ${S};
  }
`,Fe=n.div`
  position: absolute;
  top: calc(100% + 15px);
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid ${V};
  border-radius: 4px;
  min-width: 220px;
  padding: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(21, 23, 26, 0.08);
  z-index: 100;

  ${T}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
`,ze=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${De};
  padding: 0.5rem 1rem 0.8rem;
  border-bottom: 1px solid ${V};
  margin-bottom: 0.3rem;
`,Ne=n.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  color: ${se};
  text-decoration: none;
  font-size: 0.8rem;
  text-transform: none;
  letter-spacing: 0.02em;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;

  &:hover {
    background: ${Xt};
    color: ${k};
  }

  &::after {
    content: '→';
    opacity: 0;
    transform: translateX(-5px);
    transition: all 0.2s ease;
    font-size: 0.8rem;
  }

  &:hover::after {
    opacity: 1;
    transform: translateX(0);
    color: ${S};
  }
`,ia=n.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
`,na=n.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  border: 1px solid ${k};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: ${k};
  color: #FFFFFF;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${S};
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
  }

  &:hover {
    color: #FFFFFF;
    border-color: ${S};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(199, 123, 94, 0.2);
  }
  
  &:hover::before {
    transform: translateY(0);
  }

  /* Mobile: compact login button for the slim bar */
  @media (max-width: 900px) {
    padding: 0.5rem 0.9rem;
    font-size: 0.68rem;
  }
`,oa=n.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;

  @media (max-width: 900px) {
    display: block;
  }
`,sa=n.div`
  display: block;
  width: 24px;
  height: 16px;
  position: relative;

  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: ${k};
    border-radius: 2px;
    transition: all 0.3s ease;
    
    &:nth-child(1) { top: 0; }
    &:nth-child(2) { top: 7px; width: 80%; right: 0; }
    &:nth-child(3) { top: 14px; }
  }

  /* Hamburger → X when the mobile panel is open */
  &.open span:nth-child(1) { top: 7px; transform: rotate(45deg); }
  &.open span:nth-child(2) { opacity: 0; width: 0; right: auto; }
  &.open span:nth-child(3) { top: 7px; transform: rotate(-45deg); }
`,la=n.div`
  display: none;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${V};
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 900px) {
    display: block;
  }

  &.open {
    max-height: calc(100vh - 56px);
    overflow-y: auto;
    box-shadow: 0 30px 40px rgba(21, 23, 26, 0.15);
  }
`,da=n.div`
  padding: 0.5rem 1.5rem 1.75rem;
`,ne=n.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid ${V};
  padding: 1rem 0.25rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${k};
  cursor: pointer;
  transition: color 0.2s ease, padding-left 0.2s ease;

  &:hover {
    color: ${S};
    padding-left: 0.6rem;
  }
`,Se=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${De};
  padding: 1.4rem 0.25rem 0.4rem;
`,$e=n(ne)`
  font-weight: 400;
  font-size: 0.82rem;
  text-transform: none;
  letter-spacing: 0.02em;
  color: ${se};
  padding: 0.75rem 0.25rem;
`,ca=n.div`
  padding-top: 1.5rem;
  display: flex;
`,ma=n.button`
  width: 100%;
  padding: 0.95rem;
  background: ${k};
  color: #FFFFFF;
  border: 1px solid ${k};
  border-radius: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease;

  &:hover {
    background: ${S};
    border-color: ${S};
  }
`,pa=n.button`
  width: 100%;
  padding: 0.95rem;
  background: #3D4F47;
  color: #FFFFFF;
  border: 1px solid #3D4F47;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(61, 79, 71, 0.3);

  &:hover {
    background: #2E3F37;
    border-color: #2E3F37;
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.4);
  }
`;function ga(){const[r,a]=(0,m.useState)(!1),[l,s]=(0,m.useState)(!1),[i,o]=(0,m.useState)(!1),f=R();(0,m.useEffect)(()=>{const d=()=>{const b=window.scrollY;b>20?a(!0):a(!1),b>100?s(!0):s(!1)};return window.addEventListener("scroll",d),()=>window.removeEventListener("scroll",d)},[]),(0,m.useEffect)(()=>{const d=b=>{i&&b.target.closest&&!b.target.closest("[data-mobile-menu]")&&o(!1)};return document.addEventListener("mousedown",d),()=>document.removeEventListener("mousedown",d)},[i]),(0,m.useEffect)(()=>(document.body.style.overflow=i?"hidden":"",()=>{document.body.style.overflow=""}),[i]);const c=d=>{o(!1),window.scrollTo({top:0,behavior:"smooth"}),f(d)},g=d=>{o(!1);const b=document.getElementById(d);b?b.scrollIntoView({behavior:"smooth",block:"start"}):(f("/"),setTimeout(()=>{const p=document.getElementById(d);p&&p.scrollIntoView({behavior:"smooth",block:"start"})},150))},x=[{label:"All Stories",path:"/blog/stories"},{label:"The Architecture of Blooms",path:"/blog/architecture-of-blooms"},{label:"Funeral Welfare, A Modern Guide",path:"/blog/funeral-welfare-management"},{label:"Member Contributions",path:"/blog/member-contributions"},{label:"Bereavement Management",path:"/blog/bereavement-management"},{label:"The Future of Death Care",path:"/blog/future-of-death-care-software-restpoint"}],v=[{label:"Terms of Service",path:"/terms"},{label:"Privacy Policy",path:"/privacy"},{label:"Data Migration",path:"/data-migration"},{label:"SLA Policy",path:"/sla"},{label:"Release Notes",path:"/releases"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Gt,{}),(0,e.jsxs)(_t,{children:[(0,e.jsx)(Kt,{className:l?"hidden":"",children:(0,e.jsxs)(Ut,{children:[(0,e.jsxs)(je,{children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(Vt,{})," System Online"]}),(0,e.jsx)(ce,{style:{opacity:.5},children:"|"}),(0,e.jsx)(ce,{children:"Death Care OS — v2.0"})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(me,{href:"#",children:"Support"}),(0,e.jsx)(me,{href:"#",children:"Docs"}),(0,e.jsx)(me,{href:"#",children:"Status"})]})]})}),(0,e.jsx)(Qt,{className:r?"scrolled":"",children:(0,e.jsxs)(Zt,{children:[(0,e.jsxs)(ie,{href:"#",onClick:d=>{d.preventDefault(),c("/")},children:[(0,e.jsx)(ea,{}),(0,e.jsx)(ra,{children:"Rest Point"})]}),(0,e.jsxs)(ta,{children:[(0,e.jsx)(T,{children:(0,e.jsx)(L,{onClick:()=>g("features"),children:"Features"})}),(0,e.jsx)(T,{children:(0,e.jsx)(L,{onClick:()=>g("modules"),children:"Modules"})}),(0,e.jsx)(T,{children:(0,e.jsx)(L,{onClick:()=>c("/about"),children:"About"})}),(0,e.jsxs)(T,{children:[(0,e.jsxs)(L,{children:["Blogs ",(0,e.jsx)(ke,{})]}),(0,e.jsxs)(Fe,{children:[(0,e.jsx)(ze,{children:"The Journal"}),x.map(d=>(0,e.jsx)(Ne,{href:"#",onClick:b=>{b.preventDefault(),c(d.path)},children:d.label},d.label))]})]}),(0,e.jsx)(T,{children:(0,e.jsxs)(aa,{onClick:()=>c("/scanner"),children:[(0,e.jsx)("i",{className:"fas fa-scanner",style:{fontSize:"0.85rem"}}),"Scanner"]})}),(0,e.jsxs)(T,{children:[(0,e.jsxs)(L,{children:["Policies ",(0,e.jsx)(ke,{})]}),(0,e.jsxs)(Fe,{children:[(0,e.jsx)(ze,{children:"Legal & Security"}),v.map(d=>(0,e.jsx)(Ne,{href:"#",onClick:b=>{b.preventDefault(),c(d.path)},children:d.label},d.label))]})]})]}),(0,e.jsx)(ia,{children:(0,e.jsx)(na,{href:"#",onClick:d=>{d.preventDefault(),c("/login")},children:"Client Login"})}),(0,e.jsx)(oa,{"data-mobile-menu":!0,onClick:()=>o(d=>!d),"aria-label":"Toggle menu",children:(0,e.jsxs)(sa,{className:i?"open":"",children:[(0,e.jsx)("span",{}),(0,e.jsx)("span",{}),(0,e.jsx)("span",{})]})})]})}),(0,e.jsx)(la,{className:i?"open":"","data-mobile-menu":!0,children:(0,e.jsxs)(da,{children:[(0,e.jsx)(ne,{onClick:()=>g("features"),children:"Features"}),(0,e.jsx)(ne,{onClick:()=>g("modules"),children:"Modules"}),(0,e.jsx)(ne,{onClick:()=>c("/about"),children:"About"}),(0,e.jsx)(Se,{children:"The Journal"}),x.map(d=>(0,e.jsx)($e,{onClick:()=>c(d.path),children:d.label},d.label)),(0,e.jsx)(Se,{children:"Legal & Security"}),v.map(d=>(0,e.jsx)($e,{onClick:()=>c(d.path),children:d.label},d.label)),(0,e.jsxs)(ca,{children:[(0,e.jsxs)(pa,{onClick:()=>c("/scanner"),children:[(0,e.jsx)("i",{className:"fas fa-scanner",style:{fontSize:"0.85rem"}}),"Scanner"]}),(0,e.jsx)(ma,{onClick:()=>c("/login"),children:"Client Login"})]})]})})]})]})}var ha=U`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
`,H="#15171A",oe="#E3DDD0",ge="#6B6862",fa="#C77B5E",B="#00d9ff",le="#ff006e",xa=$`from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); }`,ua=$`from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); }`,ba=$`from { opacity: 0; transform: translateY(14px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); }`,va=$`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); }`;$`0% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(199, 123, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0); }`;var ya=$`0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,255,0.5); } 50% { opacity: .5; box-shadow: 0 0 0 4px rgba(0,217,255,0); }`,Le=$`from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); }`,wa=$`0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); }`,ja=$`0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); }`,ka=n.section`
  padding-top: 160px; padding-bottom: 80px; position: relative; overflow: hidden; background: #FFFFFF;
  @media (max-width: 900px) { padding-top: 120px; }
`,Fa=n.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 500px; height: 500px; background: rgba(199, 123, 94, 0.12); top: -100px; left: -100px;`,za=n.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 450px; height: 450px; background: rgba(139, 115, 85, 0.1); bottom: -100px; right: -100px;`,Na=n.div`max-width: 1280px; margin: 0 auto; width: 100%; padding-left: clamp(1.5rem, 5vw, 5rem); padding-right: clamp(1.5rem, 5vw, 5rem);`,Sa=n.div`
  position: relative; z-index: 2; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 4rem; align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 3.5rem; }
`,$a=n.div`animation: ${xa} 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;`,Ca=n.h1`
  font-family: 'Fraunces', serif; font-size: clamp(2.3rem, 4vw, 3.4rem);
  line-height: 1.12; letter-spacing: -0.025em; font-weight: 300; color: ${ge}; margin: 0 0 1.5rem; max-width: 560px;
`,Aa=n.span`display: block; color: ${H}; font-weight: 600;`,Ma=n.span`
  display: inline-block; font-style: italic; font-weight: 500; color: ${fa};
  animation: ${ba} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`,Ea=n.p`
  font-size: 1.02rem; max-width: 470px; margin: 0 0 2.5rem; color: ${ge};
  line-height: 1.75; font-family: 'Space Grotesk', sans-serif; font-weight: 400;
`,Ta=n.div`display: flex; gap: 0.9rem; margin-bottom: 3rem; flex-wrap: wrap;`,Oe=n.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
  padding: 1.05rem 2rem; font-size: 0.78rem; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
  letter-spacing: 0.06em; text-transform: uppercase;
  @media (max-width: 480px) { flex: 1 1 100%; }
`,We=n.span`display: inline-flex; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);`,Ra=n(Oe)`
  background: ${H}; color: #FFFFFF;
  &:hover { background: #000000; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(21,23,26,0.25); & ${We} { transform: translateX(4px); } }
`,Ba=n(Oe)`
  background: transparent; color: ${H}; border-color: ${oe};
  &:hover { background: ${H}; color: #FFFFFF; border-color: ${H}; transform: translateY(-2px); }
`,Pa=n.div`
  display: flex; border-top: 1px solid ${oe}; padding-top: 1.6rem; max-width: 470px;
`,qa=n.div`
  flex: 1; padding-right: 1rem;
  &:nth-child(2) { border-left: 1px solid ${oe}; padding-left: 1.1rem; }
  &:last-child { border-left: 1px solid ${oe}; padding-left: 1.1rem; padding-right: 0; }
  @media (max-width: 380px) { &:nth-child(2), &:last-child { padding-left: 0.7rem; } }
`,Ia=n.span`
  display: block; font-family: 'Fraunces', serif; font-size: 1.55rem; font-weight: 600;
  color: ${H}; line-height: 1; margin-bottom: 0.45rem;
`,Da=n.span`
  font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: ${ge};
  text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.5; display: block;
`,La=n.div`
  position: relative; display: flex; justify-content: center; align-items: center; height: 100%; perspective: 1600px;
`,Oa=n.div`
  --s: 1;
  width: calc(380px * var(--s));
  height: calc(540px * var(--s));
  flex-shrink: 0;
  @media (max-width: 900px) { --s: 0.9; }
  @media (max-width: 430px) { --s: 0.75; }
  @media (max-width: 350px) { --s: 0.65; }
`,Wa=n.div`
  width: 380px;
  height: 540px;
  transform: scale(var(--s));
  transform-origin: top left;
  transform-style: preserve-3d;
`,Ya=n.div`
  animation: ${ua} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards, ${va} 8s ease-in-out infinite 1.5s; 
  opacity: 0; width: 380px; height: 540px; transform-style: preserve-3d;
`,Ha=n.div`
  width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
  transform: ${r=>r.isFlipped?"rotateY(180deg)":"rotateY(0deg)"};
`,Ce=n.div`
  position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 32px;
  &.back { transform: rotateY(180deg); }
`,Ae=n.div`width: 100%; height: 100%; background: #050507; border-radius: 32px; padding: 12px; position: relative; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.5), 0 30px 60px -30px rgba(199,123,94,0.15), inset 0 0 0 2px rgba(255,255,255,0.05); &::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 100; }`,Me=n.div`width: 100%; height: 100%; background: #050507; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Space Grotesk', sans-serif; color: #e8e8eb;`,Ga=n.div`padding: 28px 24px; height: 100%; display: flex; flex-direction: column; background: radial-gradient(circle at top right, rgba(0,217,255,0.05), transparent 40%), #050507;`,Ja=n.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;`,Xa=n.div`text-align: center; flex: 1;`,_a=n.div`font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #fff; font-weight: 600; margin-bottom: 6px;`,Ka=n.div`width: 80px; height: 1px; margin: 0 auto; background: linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent);`,Ua=n.div`font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-top: 6px;`,Va=n.div`display: flex; align-items: center; gap: 5px;`,Qa=n.div`width: 5px; height: 5px; background: ${B}; border-radius: 50%; animation: ${ya} 2s infinite;`,Za=n.div`font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a8a95; font-weight: 500;`,ei=n.div`margin-bottom: 24px;`,ri=n.div`font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-bottom: 6px;`,ti=n.div`font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-style: italic; color: #fff; font-weight: 600; letter-spacing: -0.5px;`,ai=n.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);`,ii=n.div`font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: ${B}; font-style: italic; font-weight: 600;`,Ee=n.div`font-size: 7px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 600; margin-bottom: 2px;`,ni=n.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1;`,oi=n.div`
  position: relative; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; cursor: pointer; overflow: hidden;
  background: linear-gradient(145deg, #0f1820 0%, #050709 100%); border: 1px solid rgba(0,217,255,0.25); transition: all 0.3s ease;
  &:hover { border-color: ${B}; box-shadow: 0 0 15px rgba(0,217,255,0.2); transform: translateY(-2px); }
  &.magenta { background: linear-gradient(145deg, #1f0a15 0%, #0a0305 100%); border-color: rgba(255,0,110,0.25); }
  &.magenta:hover { border-color: ${le}; box-shadow: 0 0 15px rgba(255,0,110,0.2); }
`,re=n.div`position: absolute; width: 8px; height: 8px; border: 1.5px solid ${B}; &.magenta { border-color: ${le}; } &.tl { top: 3px; left: 3px; border-right: 0; border-bottom: 0; } &.tr { top: 3px; right: 3px; border-left: 0; border-bottom: 0; } &.bl { bottom: 3px; left: 3px; border-right: 0; border-top: 0; } &.br { bottom: 3px; right: 3px; border-left: 0; border-top: 0; }`,si=n.div`width: 28px; height: 28px; border-radius: 5px; background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: ${B}; &.magenta { background: rgba(255,0,110,0.1); border-color: rgba(255,0,110,0.3); color: ${le}; }`,li=n.div`position: absolute; bottom: -5px; right: 2px; font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-style: italic; font-weight: 700; color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none;`,di=n.div`font-size: 11px; font-weight: 600; color: #f0ebe3; line-height: 1.2; margin-bottom: 4px;`,ci=n.div`font-size: 8px; color: #8a8a95; line-height: 1.4; font-weight: 300; margin-bottom: 8px; flex: 1;`,mi=n.div`display: flex; align-items: center; gap: 3px; font-size: 7px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; color: ${B}; margin-top: auto; &.magenta { color: ${le}; }`,pi=n.div`position: relative; height: 100%; background: #0a0b0c; overflow: hidden;`,gi=n.img`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity 0.4s ease-in-out; opacity: ${r=>r.fading?0:1};`,hi=n.div`position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5;`,fi=n.div`position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 20px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; }`,xi=n.button`display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25;`,ui=n.div`border-radius: 50%; padding: 2.5px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; &.unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: ${ja} 2.8s ease-in-out infinite, ${wa} 3.2s ease-in-out infinite; } &.seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); } &:hover { transform: scale(1.06); }`,bi=n.div`width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; & img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter 0.3s, transform 0.4s; } &:hover img { filter: brightness(1.05); transform: scale(1.1); }`,vi=n.span`font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`,yi=n.div`position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: ${Le} 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`,wi=n.div`font-size: 9px; font-weight: 600; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px;`,ji=n.h2`font-family: 'Fraunces',serif; font-weight: 300; font-size: 30px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity 0.4s ease, transform 0.4s ease; opacity: ${r=>r.fading?0:1}; transform: ${r=>r.fading?"translateY(15px)":"translateY(0)"}; & em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }`,ki=n.div`position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: ${Le} 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`,Fi=n.div`font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: 0.04em;`,zi=n.div`font-size: 8px; font-weight: 500; letter-spacing: 0.28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px;`,Ni=[{num:"01",title:"Body Admission",desc:"Respectful reception & formal registration of the deceased",magenta:!1,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3"}),(0,e.jsx)("path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}),(0,e.jsx)("path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"})]})},{num:"02",title:"Body Release",desc:"Dignified coordination of the final departure",magenta:!0,icon:(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,e.jsx)("path",{d:"m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"})})},{num:"03",title:"Flower Arrangements",desc:"Bespoke floral tributes, wreaths & memorial displays",magenta:!1,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"}),(0,e.jsx)("circle",{cx:"12",cy:"8",r:"2"}),(0,e.jsx)("path",{d:"M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5"})]})},{num:"04",title:"Postmortem Records",desc:"Secure access to medical documentation & reports",magenta:!0,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"}),(0,e.jsx)("path",{d:"M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8"})]})}],te=[{img:"https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240",title:(0,e.jsxs)(e.Fragment,{children:["Mixed Rose &",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Baby Breath Heart"})]}),label:"Heart"},{img:"https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000",title:(0,e.jsxs)(e.Fragment,{children:["Wreaths & Cross",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"on Stand"})]}),label:"Cross"},{img:"https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw",title:(0,e.jsxs)(e.Fragment,{children:["Elegant",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Floral Spray"})]}),label:"Spray"},{img:"https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240",title:(0,e.jsxs)(e.Fragment,{children:["The Eternal",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Embrace"})]}),label:"Embrace"}],Si=[{value:"100%",label:"Paperless workflow"},{value:"24/7",label:"Uptime & support"},{value:"100%",label:"Encrypted & secure"}];function $i(){const[r,a]=(0,m.useState)(0),[l,s]=(0,m.useState)(!1),[i,o]=(0,m.useState)(0),[f,c]=(0,m.useState)(!1),g=R(),x=["families","memories","legacies","communities"],v=d=>{d!==i&&(c(!0),setTimeout(()=>{o(d),c(!1)},380))};return(0,m.useEffect)(()=>{const d=setInterval(()=>{a(p=>(p+1)%x.length)},3500),b=setInterval(()=>{s(p=>!p)},6e3);return()=>{clearInterval(d),clearInterval(b)}},[]),(0,m.useEffect)(()=>{let d;const b=setInterval(()=>{c(!0),d=setTimeout(()=>{o(p=>(p+1)%te.length),c(!1)},380)},4e3);return()=>{clearInterval(b),clearTimeout(d)}},[]),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ha,{}),(0,e.jsxs)(ka,{children:[(0,e.jsx)(Fa,{}),(0,e.jsx)(za,{}),(0,e.jsx)(Na,{children:(0,e.jsxs)(Sa,{children:[(0,e.jsxs)($a,{children:[(0,e.jsxs)(Ca,{children:["The modern standard",(0,e.jsxs)(Aa,{children:["for the ",(0,e.jsx)(Ma,{children:x[r]},r)]}),"you serve."]}),(0,e.jsx)(Ea,{children:"Rest Point brings high end technology to the death care industry. Hand families a tablet at the front desk to manage admissions, releases, and florals  everything syncing instantly to your dashboard."}),(0,e.jsxs)(Ta,{children:[(0,e.jsxs)(Ra,{onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),g("/register")},children:["Request Access",(0,e.jsx)(We,{children:(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:(0,e.jsx)("path",{d:"M5 12h14M12 5l7 7-7 7"})})})]}),(0,e.jsx)(Ba,{onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),g("/login")},children:"View Portal"})]}),(0,e.jsx)(Pa,{children:Si.map((d,b)=>(0,e.jsxs)(qa,{children:[(0,e.jsx)(Ia,{children:d.value}),(0,e.jsx)(Da,{children:d.label})]},b))})]}),(0,e.jsx)(La,{children:(0,e.jsx)(Oa,{children:(0,e.jsx)(Wa,{children:(0,e.jsx)(Ya,{children:(0,e.jsxs)(Ha,{isFlipped:l,children:[(0,e.jsx)(Ce,{className:"front",children:(0,e.jsx)(Ae,{children:(0,e.jsx)(Me,{children:(0,e.jsxs)(Ga,{children:[(0,e.jsxs)(Ja,{children:[(0,e.jsx)("div",{style:{width:"40px"}}),(0,e.jsxs)(Xa,{children:[(0,e.jsx)(_a,{children:"Rest Point"}),(0,e.jsx)(Ka,{}),(0,e.jsx)(Ua,{children:"Reception Portal"})]}),(0,e.jsxs)(Va,{children:[(0,e.jsx)(Qa,{}),(0,e.jsx)(Za,{children:"Online"})]})]}),(0,e.jsxs)(ei,{children:[(0,e.jsx)(ri,{children:"Good morning"}),(0,e.jsx)(ti,{children:"Welcome back."})]}),(0,e.jsxs)(ai,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(Ee,{children:"Services"}),(0,e.jsx)(ii,{children:"Select to Begin"})]}),(0,e.jsxs)(Ee,{style:{display:"flex",alignItems:"center",gap:"4px",color:B},children:[(0,e.jsx)("svg",{width:"10",height:"10",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:(0,e.jsx)("path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"})}),"4 Available"]})]}),(0,e.jsx)(ni,{children:Ni.map((d,b)=>(0,e.jsxs)(oi,{className:d.magenta?"magenta":"",children:[(0,e.jsx)(re,{className:`${d.magenta?"magenta":""} tl`}),(0,e.jsx)(re,{className:`${d.magenta?"magenta":""} tr`}),(0,e.jsx)(re,{className:`${d.magenta?"magenta":""} bl`}),(0,e.jsx)(re,{className:`${d.magenta?"magenta":""} br`}),(0,e.jsx)(li,{children:d.num}),(0,e.jsx)(si,{className:d.magenta?"magenta":"",children:d.icon}),(0,e.jsx)(di,{children:d.title}),(0,e.jsx)(ci,{children:d.desc}),(0,e.jsxs)(mi,{className:d.magenta?"magenta":"",children:["Continue",(0,e.jsx)("svg",{width:"8",height:"8",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:(0,e.jsx)("path",{d:"M7 7h10v10M7 17L17 7"})})]})]},b))})]})})})}),(0,e.jsx)(Ce,{className:"back",children:(0,e.jsx)(Ae,{children:(0,e.jsx)(Me,{children:(0,e.jsxs)(pi,{children:[(0,e.jsx)(gi,{src:te[i].img,alt:"Floral Tribute",fading:f?1:0}),(0,e.jsx)(hi,{}),(0,e.jsx)(fi,{children:te.map((d,b)=>(0,e.jsxs)(xi,{onClick:()=>v(b),children:[(0,e.jsx)(ui,{className:b===i?"unseen":"seen",children:(0,e.jsx)(bi,{children:(0,e.jsx)("img",{src:d.img,alt:d.label})})}),(0,e.jsx)(vi,{children:d.label})]},b))}),(0,e.jsxs)(yi,{children:[(0,e.jsx)(wi,{children:"Floral Tributes"}),(0,e.jsx)(ji,{fading:f?1:0,children:te[i].title})]}),(0,e.jsxs)(ki,{children:[(0,e.jsx)(Fi,{children:"Memorial Florals"}),(0,e.jsx)(zi,{children:"Est. since care began"})]})]})})})})]})})})})})]})})]})]})}function Ci(){const r=(0,m.useRef)(null),[a,l]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{const s=r.current;if(!s)return;const i=new IntersectionObserver(([o])=>{o.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(s),()=>i.disconnect()},[]),[r,a]}var E=({children:r,delay:a=0,style:l={},className:s=""})=>{const[i,o]=Ci();return(0,e.jsx)("div",{ref:i,className:s,style:{opacity:o?1:0,transform:o?"translateY(0)":"translateY(40px)",transition:`opacity 1s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 1s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...l},children:r})};function Ai(){const r=R(),a=(0,m.useRef)(null),l=(0,m.useRef)(null),s=()=>{window.scrollTo({top:0,behavior:"smooth"}),r("/register")};return(0,m.useEffect)(()=>{const i=a.current,o=l.current;if(!i||!o)return;const f=g=>{const x=i.getBoundingClientRect(),v=g.clientX-x.left,d=g.clientY-x.top,b=x.width/2,p=x.height/2,u=(v-b)/b,y=(d-p)/p;o.style.transform=`rotateY(${-12+u*8}deg) rotateX(${4-y*8}deg)`,o.style.animation="none"},c=()=>{o.style.transform="",o.style.animation=""};return i.addEventListener("mousemove",f),i.addEventListener("mouseleave",c),()=>{i.removeEventListener("mousemove",f),i.removeEventListener("mouseleave",c)}},[]),(0,e.jsxs)("section",{style:{position:"relative",padding:"clamp(4rem, 8vw, 7rem) 0",overflow:"hidden"},children:[(0,e.jsx)("div",{style:{position:"absolute",borderRadius:"50%",filter:"blur(120px)",zIndex:0,pointerEvents:"none",top:"-10%",left:"-10%",width:"500px",height:"500px",background:"rgba(61, 79, 71, 0.3)"}}),(0,e.jsx)("div",{style:{position:"absolute",borderRadius:"50%",filter:"blur(120px)",zIndex:0,pointerEvents:"none",bottom:"-10%",right:"-10%",width:"600px",height:"600px",background:"rgba(169, 143, 110, 0.15)"}}),(0,e.jsxs)("div",{style:{maxWidth:"1280px",margin:"0 auto",padding:"0 1.5rem",position:"relative",zIndex:10},children:[(0,e.jsxs)("div",{style:{textAlign:"center",marginBottom:"6rem"},children:[(0,e.jsx)(E,{children:(0,e.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",gap:"0.75rem",background:"#141414",border:"1px solid #333",padding:"0.5rem 1.25rem",borderRadius:"9999px",marginBottom:"2rem"},children:[(0,e.jsx)("span",{style:{width:"8px",height:"8px",background:"#A98F6E",borderRadius:"50%",display:"inline-block",animation:"prPulse 2s infinite"}}),(0,e.jsx)("span",{style:{fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.2em",color:"#A98F6E",textTransform:"uppercase"},children:"Bespoke Automation Engine"})]})}),(0,e.jsx)(E,{delay:100,children:(0,e.jsxs)("h2",{style:{fontFamily:"'Fraunces', serif",fontSize:"clamp(2.2rem, 5vw, 4rem)",fontWeight:300,lineHeight:1.1,marginBottom:"1.5rem",letterSpacing:"-0.02em",color:t.bone},children:["Flawless Documentation.",(0,e.jsx)("br",{}),(0,e.jsx)("span",{style:{fontStyle:"italic",fontWeight:500,background:"linear-gradient(135deg, #A98F6E 0%, #C8B292 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:"Zero Effort."})]})}),(0,e.jsx)(E,{delay:200,children:(0,e.jsx)("p",{style:{fontSize:"1.1rem",color:"#8A8A8A",maxWidth:"720px",margin:"0 auto",fontWeight:300,lineHeight:1.7},children:"Transform hours of meticulous clinical paperwork into a single click. Our engine orchestrates your intake data into breathtaking, high-end postmortem PDFs and audit-ready Excel exports—instantly."})})]}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:"5rem",alignItems:"center"},children:[(0,e.jsx)(E,{delay:200,children:(0,e.jsxs)("div",{ref:a,style:{perspective:"1500px",perspectiveOrigin:"50% 50%",display:"flex",justifyContent:"center",alignItems:"center",position:"relative",height:"600px"},children:[(0,e.jsxs)("div",{ref:l,style:{transform:"rotateY(-12deg) rotateX(4deg) translateZ(0)",transition:"transform 0.1s ease-out",animation:"prFloat 6s ease-in-out infinite",boxShadow:"0 50px 100px rgba(0,0,0,0.5), 0 30px 60px rgba(61,79,71,0.2), 0 0 0 1px rgba(169,143,110,0.2)",background:"white",width:"320px",height:"420px",borderRadius:"8px",padding:"24px",position:"relative"},children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:"12px",borderBottom:"2px solid #1A1A1A",marginBottom:"16px"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{style:{fontFamily:"'Fraunces', serif",fontSize:"14px",fontWeight:700,color:"#1A1A1A"},children:"Sterling & Hayes"}),(0,e.jsx)("p",{style:{fontSize:"6px",color:"#6B6862",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:"2px"},children:"Official Postmortem Record"})]}),(0,e.jsxs)("div",{style:{textAlign:"right"},children:[(0,e.jsx)("div",{style:{width:"48px",height:"16px",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"4px"},children:(0,e.jsx)("div",{style:{width:"32px",height:"8px",background:"white",clipPath:"polygon(0% 0%, 20% 0%, 30% 50%, 20% 100%, 0% 100%, 10% 50%)"}})}),(0,e.jsx)("p",{style:{fontSize:"6px",color:"#0f33e7",fontWeight:700},children:"BLS-2024-0843"})]})]}),(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("p",{style:{fontSize:"6px",color:"#6B4045",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"},children:"Decedent"}),(0,e.jsx)("div",{style:{height:"6px",width:"75%",background:"#E2DDD3",borderRadius:"4px",marginTop:"4px"}})]}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("p",{style:{fontSize:"6px",color:"#6B4045",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"},children:"D.O.B"}),(0,e.jsx)("div",{style:{height:"6px",width:"50%",background:"#E2DDD3",borderRadius:"4px",marginTop:"4px"}})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("p",{style:{fontSize:"6px",color:"#6B4045",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"},children:"Examiner"}),(0,e.jsx)("div",{style:{height:"6px",width:"66%",background:"#E2DDD3",borderRadius:"4px",marginTop:"4px"}})]})]}),(0,e.jsxs)("div",{style:{paddingTop:"8px",display:"flex",flexDirection:"column",gap:"6px"},children:[(0,e.jsx)("div",{style:{height:"4px",width:"100%",background:"#E2DDD3",borderRadius:"4px"}}),(0,e.jsx)("div",{style:{height:"4px",width:"83%",background:"#E2DDD3",borderRadius:"4px"}}),(0,e.jsx)("div",{style:{height:"4px",width:"66%",background:"#E2DDD3",borderRadius:"4px"}})]})]}),(0,e.jsxs)("div",{style:{position:"absolute",top:"128px",left:"24px",right:"24px",background:"#1A1A1A",padding:"4px 8px",borderRadius:"2px",display:"flex",alignItems:"center",gap:"8px"},children:[(0,e.jsx)("span",{style:{color:"#A98F6E",fontSize:"6px",fontWeight:700},children:"02"}),(0,e.jsx)("div",{style:{height:"4px",width:"80px",background:"#FAF8F4",opacity:.5,borderRadius:"4px"}})]}),(0,e.jsxs)("div",{style:{position:"absolute",bottom:0,left:0,right:0,background:"#3D4F47",padding:"8px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottomLeftRadius:"8px",borderBottomRightRadius:"8px"},children:[(0,e.jsx)("div",{style:{height:"4px",width:"40px",background:"#FAF8F4",opacity:.6,borderRadius:"4px"}}),(0,e.jsx)("div",{style:{height:"4px",width:"40px",background:"#FAF8F4",opacity:.6,borderRadius:"4px"}})]})]}),(0,e.jsxs)("div",{style:{animation:"prFloatReverse 5s ease-in-out infinite",boxShadow:"0 20px 40px rgba(16, 124, 65, 0.3)",position:"absolute",bottom:"40px",left:0,background:"#141414",padding:"20px",borderRadius:"12px",border:"1px solid rgba(16,124,65,0.5)",display:"flex",alignItems:"center",gap:"16px",backdropFilter:"blur(10px)"},children:[(0,e.jsx)("div",{style:{width:"48px",height:"48px",background:"#107C41",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 10px rgba(0,0,0,0.3)"},children:(0,e.jsx)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"white",children:(0,e.jsx)("path",{d:"M21.17 3H7.83A1.83 1.83 0 006 4.83v14.34A1.83 1.83 0 007.83 21h13.34A1.83 1.83 0 0023 19.17V4.83A1.83 1.83 0 0021.17 3zM12 17h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"})})}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[(0,e.jsx)("span",{style:{color:"#107C41",fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"},children:"Exported"}),(0,e.jsx)("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"#107C41",children:(0,e.jsx)("path",{d:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"})})]}),(0,e.jsx)("p",{style:{color:"white",fontSize:"14px",fontWeight:500,marginTop:"4px"},children:"Audit_Export.xlsx"}),(0,e.jsx)("div",{style:{marginTop:"8px",width:"128px",height:"4px",background:"#333",borderRadius:"9999px",overflow:"hidden"},children:(0,e.jsx)("div",{style:{width:"100%",height:"100%",background:"#107C41"}})})]})]}),(0,e.jsxs)("div",{style:{position:"absolute",top:"40px",right:"20px",background:"rgba(20,20,20,0.8)",backdropFilter:"blur(10px)",border:"1px solid rgba(169,143,110,0.3)",padding:"8px 16px",borderRadius:"9999px",display:"flex",alignItems:"center",gap:"8px"},children:[(0,e.jsx)(or,{size:12,color:"#A98F6E"}),(0,e.jsx)("span",{style:{fontSize:"10px",fontWeight:700,color:"white",letterSpacing:"0.1em",textTransform:"uppercase"},children:"1-Click Gen"})]})]})}),(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"40px"},children:[(0,e.jsx)(E,{delay:300,children:(0,e.jsxs)("div",{style:{display:"flex",gap:"24px"},children:[(0,e.jsx)("div",{style:{flexShrink:0,width:"56px",height:"56px",border:"1px solid rgba(169,143,110,0.3)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"#A98F6E"},children:(0,e.jsx)(ar,{size:20})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{style:{fontFamily:"'Fraunces', serif",fontSize:"1.5rem",color:"white",marginBottom:"8px",fontWeight:500},children:"Bespoke PDF Architecture"}),(0,e.jsx)("p",{style:{color:"#8A8A8A",lineHeight:1.8,fontSize:"1rem"},children:'Stop sending families Word documents. Our engine compiles clinical data into the "Woodland Elegance" layout—featuring tracked typography, verdigris accents, and integrated barcodes that reflect the prestige of your establishment.'})]})]})}),(0,e.jsx)(E,{delay:400,children:(0,e.jsxs)("div",{style:{display:"flex",gap:"24px"},children:[(0,e.jsx)("div",{style:{flexShrink:0,width:"56px",height:"56px",border:"1px solid rgba(16,124,65,0.3)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"#107C41"},children:(0,e.jsx)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"currentColor",children:(0,e.jsx)("path",{d:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V7h4v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"})})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{style:{fontFamily:"'Fraunces', serif",fontSize:"1.5rem",color:"white",marginBottom:"8px",fontWeight:500},children:"Forensic Data Exports"}),(0,e.jsx)("p",{style:{color:"#8A8A8A",lineHeight:1.8,fontSize:"1rem"},children:"Instantly orchestrate facility-wide intake records, inventory logs, and family contact matrices into structured Excel schemas. Engineered for immediate compliance audits and seamless accounting integration."})]})]})}),(0,e.jsx)(E,{delay:500,children:(0,e.jsxs)("div",{style:{display:"flex",gap:"24px"},children:[(0,e.jsx)("div",{style:{flexShrink:0,width:"56px",height:"56px",border:"1px solid rgba(61,79,71,0.5)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"#3D4F47"},children:(0,e.jsx)(_e,{size:20})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{style:{fontFamily:"'Fraunces', serif",fontSize:"1.5rem",color:"white",marginBottom:"8px",fontWeight:500},children:"Reclaim Your Time"}),(0,e.jsx)("p",{style:{color:"#8A8A8A",lineHeight:1.8,fontSize:"1rem"},children:"Eradicate duplicate data entry. Enter the decedent's details once, and watch the system autonomously populate every required legal document, label, and digital record with flawless precision."})]})]})}),(0,e.jsx)(E,{delay:600,children:(0,e.jsxs)("div",{style:{paddingTop:"24px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:"24px"},children:[(0,e.jsxs)("button",{onClick:s,className:"btn-premium",style:{background:"linear-gradient(135deg, #A98F6E 0%, #C8B292 100%)",color:"#1A1A1A",padding:"16px 32px",borderRadius:"6px",fontWeight:700,letterSpacing:"0.1em",fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"12px",textTransform:"uppercase",border:"none",cursor:"pointer",boxShadow:"0 0 20px rgba(169,143,110,0.3)",transition:"all 0.3s ease"},children:["Request Private Demo ",(0,e.jsx)(K,{size:12})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",color:"#8A8A8A"},children:[(0,e.jsx)(Pe,{size:16,color:"#A98F6E"}),(0,e.jsx)("span",{style:{fontSize:"0.75rem"},children:"HIPAA Compliant Architecture"})]})]})})]})]})]}),(0,e.jsx)("style",{children:`
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
      `})]})}function Mi(){const r=(0,m.useRef)(null),[a,l]=(0,m.useState)(!1);return(0,m.useEffect)(()=>{const s=r.current;if(!s)return;const i=new IntersectionObserver(([o])=>{o.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(s),()=>i.disconnect()},[]),[r,a]}var O=({children:r,delay:a=0,style:l={},className:s=""})=>{const[i,o]=Mi();return(0,e.jsx)("div",{ref:i,className:s,style:{opacity:o?1:0,transform:o?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...l},children:r})},J=({title:r,children:a,dark:l=!1})=>(0,e.jsxs)("div",{className:`app-window ${l?"dark":"light"}`,children:[(0,e.jsxs)("div",{className:"window-header",children:[(0,e.jsxs)("div",{style:{display:"flex",gap:"0.4rem"},children:[(0,e.jsx)("span",{className:"window-dot",style:{background:"#FF5F57"}}),(0,e.jsx)("span",{className:"window-dot",style:{background:"#FEBC2E"}}),(0,e.jsx)("span",{className:"window-dot",style:{background:"#28C840"}})]}),(0,e.jsx)("span",{className:"window-title",children:r}),(0,e.jsx)("div",{style:{width:"40px"}})]}),(0,e.jsx)("div",{className:"window-body",children:a})]}),Ei=({items:r,speed:a=35})=>(0,e.jsx)("div",{className:"marquee-strip",children:(0,e.jsx)("div",{className:"marquee-track",style:{animationDuration:`${a}s`},children:[...r,...r,...r,...r].map((l,s)=>(0,e.jsxs)("span",{className:"marquee-item",children:[(0,e.jsx)("span",{className:"marquee-dot"}),l]},s))})}),Ti=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"mono-label",style:{color:t.verdigris},children:"CASE FILE"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:t.ink,marginTop:"0.3rem"},children:"Otieno, J."})]}),(0,e.jsx)("div",{className:"avatar",style:{background:t.verdigris},children:"JO"})]}),(0,e.jsxs)("div",{className:"mock-list-header",children:[(0,e.jsx)("span",{children:"Document Name"}),(0,e.jsx)("span",{children:"Status"})]}),[{n:"Death certificate.pdf",c:t.verdigris,s:"verified"},{n:"Burial permit.pdf",c:t.brass,s:"pending"},{n:"Police abstract.pdf",c:t.accent,s:"missing"}].map((r,a)=>(0,e.jsxs)("div",{className:"mock-row",style:{borderBottom:a<2?`1px solid ${t.line}`:"none"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.8rem"},children:[(0,e.jsx)("div",{className:"file-icon",children:(0,e.jsx)(pe,{size:16,color:r.c})}),(0,e.jsx)("span",{style:{color:t.ink},children:r.n})]}),(0,e.jsx)("span",{className:`status-badge ${r.s}`,children:r.s.charAt(0).toUpperCase()+r.s.slice(1)})]},a))]}),Ri=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:t.verdigris},children:"MWANGI FAMILY"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:t.ink,marginTop:"0.3rem"},children:"Arrangements confirmed"})]}),(0,e.jsxs)("div",{className:"mock-row",children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.8rem"},children:[(0,e.jsx)("div",{className:"file-icon",children:(0,e.jsx)(pe,{size:16,color:t.brass})}),(0,e.jsx)("span",{style:{color:t.ink},children:"Burial permit.pdf"})]}),(0,e.jsx)("button",{className:"action-btn",children:(0,e.jsx)(ir,{size:14})})]}),(0,e.jsxs)("div",{className:"mock-row",children:[(0,e.jsx)("span",{style:{color:t.ink,fontSize:"0.9rem"},children:"Service invoice"}),(0,e.jsx)("span",{className:"status-badge neutral",children:"KES 84,000"})]}),(0,e.jsxs)("div",{className:"mock-row",style:{borderBottom:"none"},children:[(0,e.jsx)("span",{style:{color:t.ink,fontSize:"0.9rem",fontWeight:600},children:"Outstanding balance"}),(0,e.jsx)("button",{className:"pay-btn",children:"Pay KES 12,500"})]})]}),Bi=()=>{const[r,a]=(0,m.useState)(38),[l,s]=(0,m.useState)(195);return(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:t.brassLight},children:"SMART DISPATCH"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:t.bone,marginTop:"0.3rem"},children:"Route Optimization"})]}),(0,e.jsxs)("div",{className:"map-visual",children:[(0,e.jsx)("div",{className:"map-pin",children:(0,e.jsx)(fe,{size:16,color:t.bone})}),(0,e.jsx)("div",{className:"map-line"}),(0,e.jsx)("div",{className:"map-pin",style:{background:t.accent},children:(0,e.jsx)(fe,{size:16,color:t.bone})}),(0,e.jsx)("div",{className:"map-truck",children:(0,e.jsx)(Be,{size:20,color:t.brass})})]}),(0,e.jsxs)("div",{className:"slider-group",children:[(0,e.jsxs)("div",{className:"slider-row",children:[(0,e.jsx)("span",{children:"Distance (km)"}),(0,e.jsx)("span",{className:"slider-value",children:r})]}),(0,e.jsx)("input",{type:"range",min:"2",max:"120",value:r,onChange:i=>a(+i.target.value),className:"custom-range"})]}),(0,e.jsxs)("div",{className:"slider-group",children:[(0,e.jsxs)("div",{className:"slider-row",children:[(0,e.jsx)("span",{children:"Fuel rate (KES/L)"}),(0,e.jsx)("span",{className:"slider-value",children:l})]}),(0,e.jsx)("input",{type:"range",min:"150",max:"250",value:l,onChange:i=>s(+i.target.value),className:"custom-range"})]}),(0,e.jsxs)("div",{className:"dispatch-footer",children:[(0,e.jsx)("span",{children:"Auto billed Trip Cost"}),(0,e.jsxs)("span",{className:"cost-value",children:["KES ",Math.round(r*.12*l).toLocaleString()]})]})]})},Pi=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:t.brassLight},children:"FLEET STATUS"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:t.bone,marginTop:"0.3rem"},children:"Live Fleet Tracking"})]}),[{n:"Hearse 01 - Benz",p:"KDA 123A",bg:"rgba(61,79,71,0.3)",ic:t.bone,s:"available"},{n:"Hearse 02 - Toyota",p:"KDB 456B",bg:"rgba(199,123,94,0.2)",ic:t.accent,s:"dispatched"},{n:"Hearse 03 - Nissan",p:"KDC 789C",bg:"rgba(139,115,85,0.2)",ic:t.brass,s:"maintenance"}].map((r,a)=>(0,e.jsxs)("div",{className:"fleet-card",style:{borderBottom:a<2?`1px solid ${t.lineDark}`:"none"},children:[(0,e.jsxs)("div",{className:"fleet-info",children:[(0,e.jsx)("div",{className:"fleet-icon",style:{background:r.bg},children:(0,e.jsx)(Be,{size:18,color:r.ic})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{color:t.bone,fontSize:"0.9rem",fontWeight:500},children:r.n}),(0,e.jsx)("div",{style:{color:t.grayLight,fontSize:"0.75rem"},children:r.p})]})]}),(0,e.jsx)("span",{className:`fleet-status ${r.s}`,children:r.s.charAt(0).toUpperCase()+r.s.slice(1)})]},a))]}),qi=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"mono-label",style:{color:t.verdigris},children:"SUPPORT TICKET #1042"}),(0,e.jsx)("div",{style:{fontSize:"1.15rem",fontFamily:"'Fraunces', serif",color:t.ink,marginTop:"0.3rem"},children:"Hearse booking issue"})]}),(0,e.jsx)("span",{style:{fontSize:"0.62rem",fontFamily:"'JetBrains Mono', monospace",padding:"0.3rem 0.6rem",borderRadius:"4px",fontWeight:600,color:t.brass,background:"rgba(139,115,85,0.1)"},children:"IN PROGRESS"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.7rem",marginBottom:"1rem"},children:[(0,e.jsx)("div",{className:"avatar",style:{background:t.accent,width:30,height:30,fontSize:"0.7rem",flexShrink:0},children:"SM"}),(0,e.jsxs)("div",{style:{background:t.bone2,borderRadius:"10px 10px 10px 2px",padding:"0.75rem 1rem",flex:1},children:[(0,e.jsx)("div",{style:{fontSize:"0.68rem",fontFamily:"'JetBrains Mono', monospace",color:t.gray,marginBottom:"0.3rem"},children:"Sarah M. · 10:32 AM"}),(0,e.jsx)("div",{style:{fontSize:"0.84rem",color:t.ink,lineHeight:1.6},children:"Booking freezes when I click confirm on the hearse page."})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.7rem",marginBottom:"1rem",flexDirection:"row-reverse"},children:[(0,e.jsx)("div",{className:"avatar",style:{background:t.verdigris,width:30,height:30,fontSize:"0.62rem",flexShrink:0},children:"RP"}),(0,e.jsxs)("div",{style:{background:t.verdigrisTint||"rgba(61,79,71,0.08)",border:`1px solid ${t.line}`,borderRadius:"10px 10px 2px 10px",padding:"0.75rem 1rem",flex:1},children:[(0,e.jsx)("div",{style:{fontSize:"0.68rem",fontFamily:"'JetBrains Mono', monospace",color:t.verdigris,marginBottom:"0.3rem",fontWeight:600},children:"RESTPOINT SUPPORT · 10:35 AM"}),(0,e.jsx)("div",{style:{fontSize:"0.84rem",color:t.ink,lineHeight:1.6},children:"Thanks mumo  our team is on it. A fix is being deployed now; we'll update you here the moment it's live."})]})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.6rem",borderTop:`1px solid ${t.line}`,paddingTop:"0.9rem",fontSize:"0.72rem",fontFamily:"'JetBrains Mono', monospace",color:t.gray},children:[(0,e.jsx)("span",{style:{width:7,height:7,borderRadius:"50%",background:t.verdigris,display:"inline-block",animation:"subtle-pulse 2s ease infinite"}}),"Support agent online · replies arrive in real time",(0,e.jsxs)("span",{style:{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:"0.4rem",color:t.verdigris,fontWeight:500},children:[(0,e.jsx)(Ze,{size:12})," Reply"]})]})]}),Te="flp-fraunces-font",X=[{img:"https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240",label:"Heart",alt:"Mixed Rose and Baby Breath Heart",title:(0,e.jsxs)(e.Fragment,{children:["Mixed Rose &",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Baby Breath Heart"})]})},{img:"https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000",label:"Cross",alt:"Wreaths and Cross on Stand",title:(0,e.jsxs)(e.Fragment,{children:["Wreaths & Cross",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"on Stand"})]})},{img:"https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw",label:"Spray",alt:"Elegant Floral Spray",title:(0,e.jsxs)(e.Fragment,{children:["Elegant",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Floral Spray"})]})},{img:"https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240",label:"Embrace",alt:"The Eternal Embrace",title:(0,e.jsxs)(e.Fragment,{children:["The Eternal",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Embrace"})]})}],Ii=()=>{const[r,a]=(0,m.useState)(0),[l,s]=(0,m.useState)(!1),i=(0,m.useRef)(null),o=(0,m.useRef)(0);(0,m.useEffect)(()=>{if(!document.getElementById(Te)){const g=document.createElement("link");g.id=Te,g.rel="stylesheet",g.href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap",document.head.appendChild(g)}return X.forEach(g=>{const x=document.createElement("img");x.src=g.img}),()=>{i.current&&clearTimeout(i.current)}},[]);const f=g=>{let x=g;x<0&&(x=X.length-1),x>=X.length&&(x=0),x!==o.current&&(o.current=x,s(!0),i.current&&clearTimeout(i.current),i.current=setTimeout(()=>{a(x),s(!1)},400))};(0,m.useEffect)(()=>{const g=setInterval(()=>f(o.current+1),4e3);return()=>clearInterval(g)},[]);const c=X[r];return(0,e.jsx)("div",{className:"flp-tablet-wrapper",children:(0,e.jsx)("div",{className:"flp-tablet-scale",children:(0,e.jsx)("div",{className:"flp-tablet-scale-inner",children:(0,e.jsx)("div",{className:"flp-tablet-frame",children:(0,e.jsxs)("div",{className:"flp-tablet-screen",children:[(0,e.jsx)("img",{className:"flp-hero",src:c.img,alt:c.alt,style:{opacity:l?0:1}}),(0,e.jsx)("div",{className:"flp-overlay"}),(0,e.jsx)("div",{className:"flp-strip",children:X.map((g,x)=>(0,e.jsxs)("button",{className:"flp-story",onClick:()=>f(x),children:[(0,e.jsx)("div",{className:`flp-ring ${x===r?"flp-unseen":"flp-seen"}`,children:(0,e.jsx)("div",{className:"flp-ring-inner",children:(0,e.jsx)("img",{src:g.img,alt:g.alt})})}),(0,e.jsx)("span",{className:"flp-story-label",children:g.label})]},g.label))}),(0,e.jsxs)("div",{className:"flp-title-block",children:[(0,e.jsx)("div",{className:"flp-name-tag",children:"Floral Tributes"}),(0,e.jsx)("h2",{className:"flp-headline",style:{opacity:l?0:1,transform:l?"translateY(15px)":"translateY(0)"},children:c.title})]}),(0,e.jsxs)("div",{className:"flp-wordmark",children:[(0,e.jsx)("div",{className:"flp-wordmark-name",children:"Memorial Florals"}),(0,e.jsx)("div",{className:"flp-wordmark-sub",children:"Est. since care began"})]})]})})})})})},D=({no:r,title:a,desc:l,reverse:s,children:i})=>(0,e.jsxs)(O,{className:"showcase-mobile",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5rem",alignItems:"center",marginBottom:"7rem"},children:[(0,e.jsxs)("div",{className:"showcase-text",style:{order:s?2:1,paddingRight:s?"0":"2rem",paddingLeft:s?"2rem":"0"},children:[(0,e.jsxs)("div",{className:"mono-label",style:{color:t.verdigris,fontSize:"0.78rem",marginBottom:"1.2rem"},children:["Module ",r]}),(0,e.jsx)("h2",{style:{fontSize:"clamp(1.8rem, 3vw, 2.4rem)",marginBottom:"1.2rem",lineHeight:1.25},children:a}),(0,e.jsx)("p",{style:{fontSize:"1.05rem",maxWidth:"480px",color:t.gray,lineHeight:1.8},children:l})]}),(0,e.jsx)("div",{className:"showcase-visual",style:{order:s?1:2,display:"flex",justifyContent:"center",width:"100%"},children:i})]});function Xi(){const r=R(),a=()=>{window.scrollTo({top:0,behavior:"smooth"}),r("/register")},l=[{dark:!0,to:!0,category:"NEW · INTEGRATED",accent:t.brass,title:"Leave Management",excerpt:"Staff leave is now fully handled inside Rest Point. Request, approve and track time off in real time  no spreadsheets, no external HR tools.",status:"NOW LIVE"},{static:!0,category:"SELF SERVICE",accent:t.verdigris,title:"Floral Booking",excerpt:"The right flowers, right in front of them. Families browse a curated selection on a tablet at the front desk and choose with confidence  the booking lands instantly on your computer and in your florist's view. Less searching. Less thinking. A better experience.",status:"RECEPTIONIST PORTAL"},{dark:!0,to:!0,category:"NEW · SUPPORT CENTER",accent:t.brass,title:"Real Time Customer Support",excerpt:"Submit issues directly through the platform and our support agents receive, respond, and resolve them in real time  with full status tracking and communication history.",status:"NOW LIVE"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(rt,{}),(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { font-family: 'Inter', sans-serif; color: ${t.gray}; background: ${t.bone}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -0.01em; color: ${t.ink}; }
        h1 { font-size: clamp(2rem, 6.5vw, 4.6rem); line-height: 1.05; margin-bottom: 1.4rem; }
        h2 { font-size: clamp(1.9rem, 4vw, 2.5rem); line-height: 1.2; }
        p { line-height: 1.7; font-size: 1rem; }
        a { color: inherit; text-decoration: none; }
        .mono-label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${t.brass}; font-weight: 500; }
        .label { font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${t.brass}; font-weight: 500; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.95rem 1.9rem; font-size: 0.9rem; font-weight: 500; font-family: 'Inter', sans-serif; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; letter-spacing: 0.01em; }
        .btn-dark { background: ${t.ink}; color: ${t.bone}; }
        .btn-dark:hover { background: ${t.verdigris}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(21,23,26,0.15); }
        .btn-line { background: transparent; color: ${t.ink}; border-color: ${t.line}; }
        .btn-line:hover { background: ${t.ink}; color: ${t.bone}; border-color: ${t.ink}; }
        .btn-brass { background: ${t.brass}; color: ${t.bone}; border: none; }
        .btn-brass:hover { background: ${t.brassLight}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139,115,85,0.25); }
        
        /* FIX: Massively increased outer padding for balance */
        .wrap { max-width: 1200px; margin: 0 auto; width: 100%; padding-left: clamp(2rem, 7vw, 5rem) !important; padding-right: clamp(2rem, 7vw, 5rem) !important; }

        .marquee-strip { overflow: hidden; border-top: 1px solid ${t.line}; border-bottom: 1px solid ${t.line}; padding: 0.9rem 0; background: #000000; }
        .marquee-track { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .marquee-item { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0 1.8rem; font-size: 0.78rem; color: #FFFFFF; font-family: 'JetBrains Mono', monospace; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.1em; }
        .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: #FFFFFF; display: inline-block; flex-shrink: 0; }

        .quickfind-section { padding: clamp(4rem,8vw,6rem) 0; background: ${t.bone}; }
        .search-bar { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.4rem; border: 1.5px solid ${t.line}; border-radius: 12px; background: ${t.bone}; transition: all 0.35s ease; box-shadow: 0 2px 8px rgba(21,23,26,0.03); }
        .search-bar.focused { border-color: ${t.verdigris}; box-shadow: 0 4px 20px rgba(61,79,71,0.1),0 0 0 3px rgba(61,79,71,0.06); }
        .search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: ${t.ink}; font-family: 'Inter', sans-serif; }
        .search-input::placeholder { color: ${t.gray}; }
        .quickfind-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 0.75rem; }
        .quickfind-card { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 1.4rem; border: 1px solid ${t.line}; border-radius: 12px; background: ${t.bone}; cursor: pointer; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); text-decoration: none; }
        .quickfind-card:hover { border-color: var(--card-color); background: color-mix(in srgb,var(--card-color) 4%,${t.bone}); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--card-color) 12%,transparent); }
        .quickfind-icon-wrap { width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb,var(--card-color) 10%,${t.bone}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.4s ease; }
        .quickfind-card:hover .quickfind-icon-wrap { background: var(--card-color); }
        .quickfind-card:hover .quickfind-icon-wrap svg { color: ${t.bone} !important; }
        .quickfind-label { font-size: 0.92rem; font-weight: 600; color: ${t.ink}; margin-bottom: 0.15rem; }
        .quickfind-desc { font-size: 0.78rem; color: ${t.gray}; line-height: 1.4; }
        .quickfind-arrow { margin-left: auto; flex-shrink: 0; color: ${t.gray}; opacity: 0; transform: translateX(-6px); transition: all 0.3s ease; }
        .quickfind-card:hover .quickfind-arrow { opacity: 1; transform: translateX(0); color: var(--card-color); }

        .unified-section { padding: clamp(5rem,10vw,8rem) 0; background: #0C0C0C; position: relative; overflow: hidden; }
        .unified-bg-grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(250,248,244,0.06) 1px,transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .unified-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-family: 'Fraunces',serif; font-size: clamp(6rem,18vw,16rem); font-weight: 700; color: rgba(250,248,244,0.02); pointer-events: none; white-space: nowrap; letter-spacing: -0.03em; user-select: none; }
        .unified-glow-1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle,rgba(61,79,71,0.12) 0%,transparent 70%); top: -150px; right: -100px; pointer-events: none; animation: float-orb 15s ease-in-out infinite; }
        .unified-glow-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle,rgba(139,115,85,0.08) 0%,transparent 70%); bottom: -100px; left: -80px; pointer-events: none; animation: float-orb 15s ease-in-out infinite -5s; }
        .unified-heading { color: ${t.bone}; font-size: clamp(2.4rem,6vw,4.2rem); line-height: 1.05; max-width: 800px; margin: 0 auto; font-weight: 600; }
        .unified-highlight { background: linear-gradient(135deg,#FAF8F4 0%,#A98F6E 40%,#4D9B7F 70%,#FAF8F4 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-text 5s ease infinite; }
        .unified-desc { color: rgba(250,248,244,0.5); font-size: 1.1rem; max-width: 520px; margin: 1.5rem auto 0; line-height: 1.8; }

        .unified-bento-card { position: relative; background: rgba(250,248,244,0.03); border: 1px solid rgba(250,248,244,0.07); border-radius: 16px; padding: clamp(1.5rem,2.5vw,2.2rem); overflow: hidden; cursor: default; transition: all 0.5s cubic-bezier(0.16,1,0.3,1); }
        .unified-bento-card:hover { border-color: var(--card-glow); transform: translateY(-6px); box-shadow: 0 16px 40px -8px var(--card-glow),0 0 0 1px var(--card-glow); background: rgba(250,248,244,0.05); }
        .unified-bento-glow-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent 0%,var(--card-glow) 50%,transparent 100%); opacity: 0; transition: opacity 0.5s ease; }
        .unified-bento-card:hover .unified-bento-glow-line { opacity: 1; }
        .unified-bento-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--card-icon-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; transition: all 0.4s ease; }
        .unified-bento-card:hover .unified-bento-icon { transform: scale(1.08); box-shadow: 0 0 20px var(--card-glow); }
        .unified-bento-title { font-family: 'Inter',sans-serif; font-size: 1rem; font-weight: 600; color: ${t.bone}; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
        .unified-bento-desc { font-size: 0.85rem; color: rgba(250,248,244,0.45); line-height: 1.65; }
        .unified-bento-card:hover .unified-bento-desc { color: rgba(250,248,244,0.65); }

        .unified-cta-btn { background: transparent; color: ${t.bone}; border: 1.5px solid rgba(250,248,244,0.2); padding: 1rem 2.8rem; font-size: 1rem; border-radius: 50px; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .unified-cta-btn:hover { background: ${t.bone}; color: ${t.ink}; border-color: ${t.bone}; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(250,248,244,0.15); }
        .unified-micro { margin-top: 1.2rem; font-size: 0.78rem; color: rgba(250,248,244,0.3); font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; }

        .insurance-section { padding: clamp(5rem,10vw,7rem) 0; position: relative; overflow: hidden; background-image: url('/Funeral_Plan_hero.webp'); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed; border-top: 1px solid ${t.line}; }
        .insurance-scrim { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg,rgba(250,248,244,0.95) 0%,rgba(250,248,244,0.88) 100%); }
        .insurance-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; z-index: 2; background: linear-gradient(90deg,${t.brass},${t.brassLight},${t.accent},${t.brass}); background-size: 200% 100%; animation: gradient-text 4s ease infinite; }
        .insurance-content { position: relative; z-index: 1; text-align: left; max-width: 720px; }
        .insurance-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 1.25rem; margin-top: 3rem; text-align: left; }
        .insurance-card { background: rgba(250,248,244,0.92); border: 1px solid ${t.line}; border-radius: 14px; padding: 1.8rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); position: relative; overflow: hidden; }
        .insurance-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent,${t.brass},transparent); opacity: 0; transition: opacity 0.5s ease; }
        .insurance-card:hover { border-color: ${t.brass}; transform: translateY(-4px); box-shadow: 0 16px 36px -10px rgba(21,23,26,0.16); }
        .insurance-card:hover::before { opacity: 1; }
        .insurance-icon { width: 48px; height: 48px; border-radius: 12px; background: ${t.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1.1rem; color: ${t.verdigris}; transition: all 0.4s ease; }
        .insurance-card:hover .insurance-icon { background: ${t.verdigris}; color: ${t.bone}; }
        .insurance-card h3 { font-family: 'Inter',sans-serif; font-size: 1.05rem; font-weight: 600; color: ${t.ink}; margin-bottom: 0.5rem; }
        .insurance-card p { font-size: 0.86rem; color: ${t.gray}; line-height: 1.7; }
        .insurance-card:hover p { color: ${t.ink}; }

        .app-window { border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(21,23,26,0.2); border: 1px solid ${t.line}; width: 100%; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .app-window:hover { transform: translateY(-8px); }
        .window-header { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.2rem; border-bottom: 1px solid ${t.line}; background: ${t.bone2}; }
        .window-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .window-title { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; color: ${t.gray}; letter-spacing: 0.05em; }
        .window-body { padding: 2rem; background: ${t.bone}; }
        .app-window.dark .window-header { border-bottom: 1px solid ${t.lineDark}; background: rgba(0,0,0,0.2); }
        .app-window.dark .window-body { background: ${t.ink}; }
        .app-window.dark .window-title { color: ${t.grayLight}; }
        .mock-inner { padding: 0.5rem; }

        /* ── Floral Tablet Preview ── */
        .flp-tablet-wrapper { display: flex; justify-content: center; width: 100%; animation: flpTabletFloat 6s ease-in-out infinite; }
        .flp-tablet-scale { --s: 1; width: calc(400px * var(--s)); height: calc(560px * var(--s)); flex-shrink: 0; }
        .flp-tablet-scale-inner { width: 400px; height: 560px; transform: scale(var(--s)); transform-origin: top left; }
        .flp-tablet-frame { width: 400px; height: 560px; background: #0a0b0c; border-radius: 32px; padding: 12px; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.4),0 30px 60px -30px rgba(0,0,0,0.3),inset 0 0 0 2px rgba(255,255,255,0.05); position: relative; }
        .flp-tablet-frame::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 10; }
        .flp-tablet-screen { width: 100%; height: 100%; background: #0a0b0c; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Inter',sans-serif; user-select: none; }
        .flp-hero { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity .6s ease-in-out; }
        .flp-overlay { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5; }
        .flp-strip { position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 25px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .flp-strip::-webkit-scrollbar { display: none; }
        .flp-story { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25; }
        .flp-ring { border-radius: 50%; padding: 2.5px; transition: transform .3s cubic-bezier(0.16,1,0.3,1); position: relative; }
        .flp-ring.flp-unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: flpPulse 2.8s ease-in-out infinite,flpFloat 3.2s ease-in-out infinite; }
        .flp-ring.flp-seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
        .flp-story:hover .flp-ring { transform: scale(1.06); }
        .flp-ring-inner { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; }
        .flp-ring-inner img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter .3s, transform .4s; }
        .flp-story:hover .flp-ring-inner img { filter: brightness(1.05); transform: scale(1.1); }
        .flp-story-label { font-size: 8px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; transition: color .2s; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .flp-story:hover .flp-story-label { color: rgba(255,255,255,0.95); }
        .flp-title-block { position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: flpFadeUp 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .flp-name-tag { font-size: 9px; font-weight: 600; letter-spacing: .35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
        .flp-headline { font-family: 'Fraunces',serif; font-weight: 300; font-size: 32px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity .4s ease, transform .4s ease; }
        .flp-headline em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }
        .flp-wordmark { position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: flpFadeUp 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none; }
        .flp-wordmark-name { font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: .04em; }
        .flp-wordmark-sub { font-size: 8px; font-weight: 500; letter-spacing: .28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px; }
        @keyframes flpFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes flpPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); } }
        @keyframes flpTabletFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        /* Responsive: keep the 400×560 design intact and scale it down proportionally */
        @media (max-width:500px) { .flp-tablet-scale { --s: 0.85; } }
        @media (max-width:380px) { .flp-tablet-scale { --s: 0.72; } }
        @media (max-width:330px) { .flp-tablet-scale { --s: 0.62; } }

        .mock-list-header { display: flex; justify-content: space-between; font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; color: ${t.gray}; padding-bottom: 0.5rem; border-bottom: 1px solid ${t.line}; margin-bottom: 0.5rem; }
        .mock-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${t.line}; font-size: 0.9rem; }
        .file-icon { width: 32px; height: 32px; background: ${t.bone2}; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .status-badge { font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .status-badge.verified { color: ${t.verdigris}; background: ${t.verdigrisTint}; }
        .status-badge.pending { color: ${t.brass}; background: rgba(139,115,85,0.1); }
        .status-badge.missing { color: ${t.accent}; background: rgba(199,123,94,0.1); }
        .status-badge.neutral { color: ${t.ink}; background: ${t.bone2}; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${t.bone}; font-family: 'Fraunces',serif; font-weight: 600; font-size: 0.9rem; }
        .action-btn { background: ${t.bone2}; border: 1px solid ${t.line}; border-radius: 6px; padding: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${t.ink}; transition: all 0.2s; }
        .action-btn:hover { background: ${t.ink}; color: ${t.bone}; }
        .pay-btn { background: ${t.verdigris}; color: ${t.bone}; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; }
        .slider-group { margin-bottom: 1.5rem; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.8rem; color: ${t.grayLight}; }
        .slider-value { font-family: 'JetBrains Mono',monospace; color: ${t.bone}; font-weight: 500; }
        .custom-range { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(250,248,244,0.2); outline: none; cursor: pointer; border-radius: 2px; }
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: ${t.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${t.ink}; }
        .custom-range::-moz-range-thumb { width: 16px; height: 16px; background: ${t.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${t.ink}; }
        .dispatch-footer { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid ${t.lineDark}; padding-top: 1.2rem; margin-top: 0.5rem; }
        .cost-value { font-size: 1.6rem; font-family: 'Fraunces',serif; color: ${t.bone}; font-weight: 600; }
        .map-visual { position: relative; height: 120px; background: rgba(250,248,244,0.04); border: 1px solid ${t.lineDark}; border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; overflow: hidden; }
        .map-visual::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px); background-size: 20px 20px; }
        .map-pin { width: 32px; height: 32px; border-radius: 50%; background: ${t.verdigris}; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .map-line { position: absolute; left: 32px; right: 32px; height: 2px; background: linear-gradient(90deg,${t.verdigris},${t.accent}); z-index: 1; }
        .map-truck { position: absolute; left: 40%; background: ${t.ink}; padding: 0.5rem; border-radius: 6px; border: 1px solid ${t.lineDark}; z-index: 3; animation: truckMove 3s infinite alternate ease-in-out; }
        .fleet-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${t.lineDark}; }
        .fleet-info { display: flex; align-items: center; gap: 0.8rem; }
        .fleet-icon { width: 36px; height: 36px; background: rgba(61,79,71,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .fleet-status { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .fleet-status.available { color: ${t.bone}; background: rgba(40,200,64,0.15); border: 1px solid rgba(40,200,64,0.3); }
        .fleet-status.dispatched { color: ${t.bone}; background: rgba(199,123,94,0.15); border: 1px solid rgba(199,123,94,0.3); }
        .fleet-status.maintenance { color: ${t.bone}; background: rgba(139,115,85,0.15); border: 1px solid rgba(139,115,85,0.3); }

        /* ── Sections ── */
        .section { padding: clamp(4rem,8vw,6rem) 0; }
        .showcase-mobile { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; margin-bottom: 7rem; }
        .about-section { background: ${t.bone}; padding: clamp(3rem,6vw,4rem) 0; border-top: 1px solid ${t.line}; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .lockin-section { position: relative; padding: clamp(5rem,10vw,7rem) 0; overflow: hidden; border-top: 1px solid ${t.line}; }
        .lockin-bg { position: absolute; inset: 0; background-image: url('/lockin.webp'); background-size: cover; background-position: center; background-attachment: fixed; }
        .lockin-section::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(12,12,12,0.78) 0%,rgba(21,23,26,0.86) 100%); }
        .lockin-content { position: relative; z-index: 1; max-width: 720px; }
        .lockin-title { font-size: clamp(2rem,5vw,2.8rem); font-weight: 700; color: ${t.bone}; margin-bottom: 1.25rem; line-height: 1.2; }
        .lockin-desc { font-size: 1.05rem; color: rgba(250,248,244,0.82); line-height: 1.8; margin-bottom: 1.25rem; }
        .lockin-sub { font-size: 1.08rem; font-family: 'Fraunces',serif; font-weight: 500; color: ${t.brassLight}; line-height: 1.7; margin-bottom: 2.5rem; }
        .lockin-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1.5rem; margin-top: 2.5rem; text-align: left; }
        .lockin-card { background: rgba(250,248,244,0.05); border: 1px solid rgba(250,248,244,0.08); border-radius: 12px; padding: 1.5rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .lockin-card:hover { border-color: rgba(139,115,85,0.35); background: rgba(250,248,244,0.08); transform: translateY(-4px); }
        .lockin-card-icon { width: 44px; height: 44px; border-radius: 10px; background: ${t.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .lockin-card h3 { font-size: 1.05rem; font-weight: 600; color: ${t.bone}; margin-bottom: 0.5rem; }
        .lockin-card p { font-size: 0.85rem; color: rgba(250,248,244,0.68); line-height: 1.6; }
        @media(max-width:768px) { .lockin-section { padding: clamp(4rem,10vw,5rem) 0; } .lockin-bg { background-attachment: scroll; } }
        .modules-section { padding: clamp(4rem,8vw,6rem) 0; background: ${t.bone}; border-top: 1px solid ${t.line}; }
        .modules-header { text-align: center; margin-bottom: 3rem; padding: 0 1rem; }
        .modules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 900px; margin: 0 auto; align-items: stretch; }
        .modules-grid > div { display: flex; }
        .module-card { flex: 1; width: 100%; display: flex; flex-direction: column; padding: 1.5rem; border: 1px solid ${t.line}; border-radius: 12px; background: ${t.bone}; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none; }
        .module-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--accent) 10%,transparent); }
        .module-card.dark { background: ${t.ink}; border-color: rgba(250,248,244,0.12); }
        .module-card.dark:hover { box-shadow: 0 8px 24px rgba(21,23,26,0.35); }
        .module-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .module-cat { display: flex; align-items: center; gap: 0.5rem; font-family: 'JetBrains Mono',monospace; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; }
        .module-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: module-pulse 2s ease-in-out infinite; }
        .module-ext { color: ${t.gray}; opacity: 0; transform: translate(-4px,4px); transition: all 0.3s ease; }
        .module-card:hover .module-ext { opacity: 1; transform: translate(0,0); color: var(--accent); }
        .module-title { font-size: 1.05rem; font-weight: 600; color: ${t.ink}; margin: 0 0 0.5rem; line-height: 1.35; font-family: 'Inter',sans-serif; }
        .module-excerpt { font-size: 0.85rem; color: ${t.gray}; line-height: 1.65; flex: 1; margin: 0; }
        .module-status { font-size: 0.75rem; color: ${t.gray}; font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; margin-top: 1rem; }
        .module-card.dark .module-title { color: ${t.bone}; }
        .module-card.dark .module-excerpt { color: rgba(250,248,244,0.62); }
        .module-card.dark .module-status { color: rgba(250,248,244,0.45); }
        .module-card.dark .module-ext { color: rgba(250,248,244,0.5); }
        .module-card.static { cursor: default; }
        @keyframes module-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
        @keyframes subtle-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(61,79,71,0.4); } 70% { box-shadow: 0 0 0 6px rgba(61,79,71,0); } }

        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-25%); } }
        @keyframes shine { 0% { left: -100%; } 50%,100% { left: 200%; } }
        @keyframes subtle-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-orb { 0%,100% { transform: translate(0,0) scale(1); } 25% { transform: translate(30px,-20px) scale(1.1); } 50% { transform: translate(-20px,20px) scale(0.95); } 75% { transform: translate(10px,10px) scale(1.05); } }
        @keyframes gradient-text { 0% { background-position: 0% center; } 50% { background-position: 100% center; } 100% { background-position: 0% center; } }
        @keyframes truckMove { from { left: 30%; } to { left: 60%; } }

        @media(max-width:768px) {
          html { font-size: 17px; }
          .showcase-mobile { grid-template-columns: 1fr !important; gap: 2rem !important; margin-bottom: 4rem !important; }
          .showcase-mobile .showcase-text { order: 2 !important; padding: 0 !important; }
          .showcase-mobile .showcase-visual { order: 1 !important; justify-content: center !important; }
          .insurance-content { max-width: 100%; }
          .modules-grid { grid-template-columns: 1fr; }
          .about-grid { grid-template-columns: 1fr; gap: 2rem; }
          .window-body { padding: 1.5rem; }
          .quickfind-grid { grid-template-columns: 1fr; }
          .unified-bento { grid-template-columns: 1fr !important; }
          .unified-bento-card { grid-column: span 1 !important; }
          .unified-heading { font-size: clamp(1.8rem,6vw,3rem); }
          .unified-watermark { font-size: clamp(4rem,14vw,8rem); }
          .insurance-overlay { background: linear-gradient(180deg,rgba(12,12,12,0.88) 0%,rgba(12,12,12,0.72) 100%); }
          .insurance-section { background-attachment: scroll; }
        }
        @media(max-width:480px) {
          html { font-size: 17.5px; }
          .wrap { padding-left: 1.2rem !important; padding-right: 1.2rem !important; }
          .btn { padding: 0.85rem 1.3rem !important; font-size: 0.92rem !important; }
          .mono-label { font-size: 0.8rem; }
          .module-title { font-size: 1.25rem; }
          .module-excerpt { font-size: 1rem; }
        }
      `}),(0,e.jsxs)("main",{children:[(0,e.jsx)(ga,{}),(0,e.jsx)($i,{}),(0,e.jsx)(Ei,{items:["Case Management","Family Portal","Smart Dispatch","Fleet Tracking","Funeral Insurance","Real Time Support","Billing & Invoicing","Analytics & Reports","Welfare Schemes"]}),(0,e.jsx)(qt,{}),(0,e.jsx)("section",{id:"features",className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)(O,{children:(0,e.jsxs)("div",{style:{textAlign:"center",marginBottom:"5rem"},children:[(0,e.jsx)("div",{className:"label",style:{marginBottom:"1rem"},children:"Features"}),(0,e.jsx)("h2",{style:{fontSize:"clamp(2rem, 4.5vw, 3rem)",marginBottom:"1rem"},children:"Everything you need to operate with dignity"}),(0,e.jsx)("p",{style:{maxWidth:"600px",margin:"0 auto",color:t.gray},children:"From case management to funeral insurance integration, Rest Point provides the tools funeral homes and welfare organizations need to serve families efficiently."})]})}),(0,e.jsx)(D,{no:"01",title:"Case management that respects your workflow",desc:"Track every detail from first call to final settlement. Rest Point keeps case files organized, documents verified, and families informed.",reverse:!1,children:(0,e.jsx)(J,{title:"restpoint.app/cases",children:(0,e.jsx)(Ti,{})})}),(0,e.jsx)(D,{no:"02",title:"Family portal & online memorials",desc:"Give families secure access to arrangements, documents, and billing. Light a candle, leave a condolence, and stay connected.",reverse:!0,children:(0,e.jsx)(J,{title:"restpoint.app/portal",children:(0,e.jsx)(Ri,{})})}),(0,e.jsx)(D,{no:"03",title:"Smart dispatch & billing",desc:"Optimize hearse routes, calculate costs automatically, and bill with precision. Rest Point turns logistics into a competitive advantage.",reverse:!1,children:(0,e.jsx)(J,{title:"restpoint.app/dispatch",dark:!0,children:(0,e.jsx)(Bi,{})})}),(0,e.jsx)(D,{no:"04",title:"Hearse management module",desc:"Effective hearse management helps a funeral home provide reliable, professional, and respectful transportation services.",reverse:!0,children:(0,e.jsx)(J,{title:"restpoint.app/fleet",dark:!0,children:(0,e.jsx)(Pi,{})})}),(0,e.jsx)(Ai,{}),(0,e.jsx)(D,{no:"06",title:"Real Time Customer Support",desc:"Clients can submit issues directly through the platform, while support agents receive, respond to, and resolve requests in real time. The system provides status tracking, communication history no question ever goes unanswered.",reverse:!0,children:(0,e.jsx)(J,{title:"restpoint.app/support",children:(0,e.jsx)(qi,{})})}),(0,e.jsx)(D,{no:"07",title:"The Right Flowers. Right in Front of Them.",reverse:!1,desc:(0,e.jsxs)(e.Fragment,{children:["Families shouldn't have to search the internet for hours trying to figure out what flowers are right for the moment.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"Give them a tablet at the front desk. Show them a curated selection of arrangements .",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"Once they choose, the booking appears instantly in the software. Your florist gets notified right away.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"They can even add custom details on the spot  like ribbon colors, specific flower preferences, or personalized messages.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{})]}),children:(0,e.jsx)(Ii,{})})]})}),(0,e.jsxs)("section",{id:"insurance",className:"insurance-section",children:[(0,e.jsx)("div",{className:"insurance-accent-bar"}),(0,e.jsx)("div",{className:"wrap",children:(0,e.jsx)("div",{className:"insurance-content",children:(0,e.jsxs)(O,{children:[(0,e.jsx)("div",{className:"label",style:{color:"#E8D5B5",marginBottom:"1.1rem"},children:"Funeral Insurance & Welfare Management"}),(0,e.jsx)("h2",{style:{color:"#FFFFFF",marginBottom:"1.2rem",fontSize:"clamp(2rem, 4.5vw, 3rem)",lineHeight:1.2},children:"We understand the pain and financial burden families face"}),(0,e.jsx)("p",{style:{color:"rgba(255,255,255,0.92)",lineHeight:1.9,marginBottom:"1.4rem",fontSize:"1.05rem",maxWidth:"640px"},children:"Families go through immense pain when they lose a loved one, only to be burdened with huge hospital bills and funeral expenses. We break down these barriers by bringing comprehensive funeral insurance solutions directly to your organization."}),(0,e.jsx)("p",{style:{color:"rgba(255,255,255,0.78)",lineHeight:1.9,marginBottom:"2.5rem",fontSize:"1.05rem",maxWidth:"640px"},children:"Rest Point now includes funeral insurance management and welfare scheme administration tools  claims, contributions, member tracking, and automated payouts all in one place."}),(0,e.jsxs)("button",{className:"btn btn-brass",onClick:()=>r("/insurance"),style:{padding:"1rem 2.4rem"},children:["View More ",(0,e.jsx)(K,{size:16})]})]})})})]}),(0,e.jsx)(Kr,{}),(0,e.jsx)(Ht,{}),(0,e.jsx)(dt,{}),(0,e.jsx)("section",{id:"modules",className:"modules-section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)("div",{className:"modules-header",children:(0,e.jsxs)(O,{children:[(0,e.jsx)("div",{className:"label",style:{marginBottom:"1rem"},children:"Modules"}),(0,e.jsx)("h2",{children:"Powerful modules, built right in"})]})}),(0,e.jsx)("div",{className:"modules-grid",children:l.map((s,i)=>(0,e.jsx)(O,{delay:i*120,children:(0,e.jsxs)("a",{className:`module-card${s.dark?" dark":""}${s.static?" static":""}`,style:{"--accent":s.accent},onClick:s.to?a:void 0,children:[(0,e.jsxs)("div",{className:"module-card-top",children:[(0,e.jsxs)("div",{className:"module-cat",style:{color:s.accent},children:[(0,e.jsx)("span",{className:"module-dot",style:{background:s.accent}}),s.category]}),(0,e.jsx)(qe,{size:14,className:"module-ext"})]}),(0,e.jsx)("h4",{className:"module-title",children:s.title}),(0,e.jsx)("p",{className:"module-excerpt",children:s.excerpt}),(0,e.jsx)("span",{className:"module-status",children:s.status})]})},i))})]})}),(0,e.jsx)(pr,{}),(0,e.jsx)(Wt,{}),(0,e.jsxs)("section",{className:"lockin-section",children:[(0,e.jsx)("div",{className:"lockin-bg",style:{backgroundImage:"url('/lockin.webp')"}}),(0,e.jsx)("div",{className:"wrap lockin-content",children:(0,e.jsxs)(O,{children:[(0,e.jsx)("h2",{className:"lockin-title",children:"Start using Rest Point."}),(0,e.jsx)("p",{className:"lockin-sub",children:"Grief is heavy enough. Running the operations behind it shouldn't be."}),(0,e.jsx)("p",{className:"lockin-desc",children:"Imagine the modern flow of your home: A family walks in, and instead of drowning in carbon copy paper, they sign admission forms directly on an iPad. At the front desk, they browse real, high resolution images of floral arrangements on a tablet, select the perfect tribute, and book it instantly no physical catalogs or messy ledgers required. Down the hall, body releases are processed seamlessly on the same screen."}),(0,e.jsx)("p",{className:"lockin-desc",children:"You step in to provide families with dignity and a seamless send off. Rest Point steps in to power how you do it."}),(0,e.jsx)("p",{className:"lockin-desc",children:"This is high end technology engineered specifically for the death care industry. We give you the infrastructure to digitize operations, eliminate the paperwork bottleneck, and deliver a flawless, premium experience from the front door to the final farewell."}),(0,e.jsx)("p",{className:"lockin-sub",children:"Upgrade your workflow. Centralize your data. Secure your operations today."}),(0,e.jsxs)("div",{className:"lockin-grid",children:[(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(tr,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"One Platform."}),(0,e.jsx)("p",{children:"Case management, smart dispatch, family portals, and front desk tablet booking unified in one secure command center."})]}),(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(Pe,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"Protected Details."}),(0,e.jsx)("p",{children:"Every record, document, and digital signature. Paperless, accurate, encrypted, and fully auditable."})]}),(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(Ke,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"Move Faster."}),(0,e.jsx)("p",{children:"From intake to release, eliminate the manual admin and give your team their time back to focus on what actually matters: care."})]})]}),(0,e.jsxs)("button",{className:"btn btn-brass",onClick:a,style:{marginTop:"2.5rem",padding:"0.9rem 2rem",fontSize:"0.9rem",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"},children:["Request Access to Rest Point ",(0,e.jsx)(K,{size:16})]}),(0,e.jsx)("p",{style:{fontSize:"0.9rem",color:"rgba(250,248,244,0.5)",marginTop:"1.5rem"},children:"Join the homes upgrading the future of death care."})]})})]}),(0,e.jsx)(sr,{}),(0,e.jsx)(It,{}),(0,e.jsx)(Dt,{})]})]})}export{Xi as default};
