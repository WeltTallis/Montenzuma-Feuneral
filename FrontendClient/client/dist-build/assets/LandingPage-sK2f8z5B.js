import{r as We}from"./chunk-CXHxssQy.js";import{y as Ye}from"./chunk-CXAmgOhv.js";import{c as He,l as Y,r as Ee}from"./chunk-DWc5g_hH.js";import{_ as n,h as K,m as $}from"./chunk-DJYPtS2Y.js";import{o as Ge}from"./chunk-BY9AVXEY.js";import{Dn as Je,Dt as _e,I as Be,In as Ue,Lt as be,On as Pe,Ot as Ke,R as Xe,Un as Ve,Vt as Qe,cn as Ze,hn as er,lt as U,rt as qe,tt as rr,vn as tr,y as de}from"./index-D6gguvjv.js";import{t as r}from"./chunk-CtrK9VBE.js";import{t as ar}from"./chunk-CRj2PfMo.js";var p=We(Ye(),1),e=Ge(),ir="#C8102E",nr="https://www.kra.go.ke/templates/kra/images/kra/logoKRA.webp";function Re(){const t=(0,p.useRef)(null),[a,l]=(0,p.useState)(!1);return(0,p.useEffect)(()=>{const o=t.current;if(!o)return;const i=new IntersectionObserver(([d])=>{d.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(o),()=>i.disconnect()},[]),[t,a]}var or=({children:t,delay:a=0,style:l={}})=>{const[o,i]=Re();return(0,e.jsx)("div",{ref:o,style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...l},children:t})},H=({children:t,delay:a=0,from:l="up",style:o={},className:i=""})=>{const[d,h]=Re(),c={up:"translateY(40px)",left:"translateX(50px)",right:"translateX(-50px)"};return(0,e.jsx)("div",{ref:d,className:i,style:{height:"100%",display:"flex",opacity:h?1:0,transform:h?"none":c[l]||c.up,transition:`opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...o},children:t})},sr=`
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
    border-bottom: 1px solid ${r.line};
    margin-bottom: 3rem;
  }
  .ns-arch-label {
    font-family: 'Fraunces', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 500;
    color: ${r.ink};
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .ns-arch-label em { font-style: italic; font-weight: 300; color: ${r.brass}; }
  .ns-arch-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${r.gray};
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
    border: 1px solid ${r.line};
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
    border-color: ${r.brass};
  }

  /* FEATURED (Dark Cinematic) */
  .ns-featured {
    background: #0a0b0c;
    border-color: rgba(255,255,255,0.05);
    color: ${r.bone};
    padding: 0;
  }
  .ns-featured:hover { border-color: ${r.brass}; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.4); }
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
    color: ${r.bone}; margin-bottom: 1rem;
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
  .ns-date-muted { color: ${r.gray}; }
  .ns-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: ${r.brass}; color: ${r.bone}; border: none;
    padding: 0.7rem 1.4rem; border-radius: 4px;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.8rem;
    font-weight: 600; text-transform: uppercase; cursor: pointer;
    transition: all 0.3s ease;
  }
  .ns-btn:hover { background: ${r.accent}; transform: translateX(4px); }

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
    font-size: 1.4rem; color: ${r.ink}; line-height: 1.2;
    margin: 1rem 0 0.8rem; letter-spacing: -0.01em;
  }
  .ns-card-excerpt {
    font-size: 0.85rem; color: ${r.gray};
    line-height: 1.6; margin-bottom: 1.5rem;
  }
  .ns-checklist { display: flex; flex-direction: column; gap: 0.8rem; margin-top: auto; }
  .ns-check-item {
    display: flex; align-items: center; gap: 0.7rem;
    font-size: 0.85rem; color: ${r.ink}; font-weight: 500;
  }
  .ns-check-icon {
    width: 20px; height: 20px; border-radius: 4px;
    background: ${r.ink}; color: ${r.bone};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* MINIMAL DARK CARD */
  .ns-card-dark {
    background: #15171A;
    border-color: rgba(255,255,255,0.05);
    padding: 2rem;
    color: ${r.bone};
    justify-content: space-between;
  }
  .ns-card-dark:hover { background: #1C1F23; border-color: ${r.brass}; }
  .ns-card-dark .ns-card-title { color: ${r.bone}; }
  .ns-card-dark .ns-card-excerpt { color: rgba(250,248,244,0.6); }
  .ns-ext-icon {
    width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.3s ease;
  }
  .ns-card-dark:hover .ns-ext-icon { background: ${r.brass}; border-color: ${r.brass}; transform: rotate(45deg); }

  /* EDITORIAL CARD (Light) */
  .ns-card-edit {
    background: #FFFFFF;
    padding: 2rem;
    justify-content: space-between;
  }
  .ns-card-edit:hover { border-color: ${r.accent}; }
  .ns-author-block {
    display: flex; align-items: center; gap: 0.8rem;
    margin-top: 1.5rem; padding-top: 1.5rem;
    border-top: 1px solid ${r.line};
  }
  .ns-author-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: ${r.bone2}; color: ${r.ink};
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 0.9rem;
  }
  .ns-author-info { display: flex; flex-direction: column; }
  .ns-author-name { font-size: 0.85rem; font-weight: 600; color: ${r.ink}; }
  .ns-author-role { font-size: 0.75rem; color: ${r.gray}; }

  /* COMING SOON BADGE */
  .ns-badge-soon {
    display: inline-block; padding: 0.3rem 0.7rem;
    background: rgba(199,123,94,0.1); color: ${r.accent};
    border-radius: 4px; font-size: 0.65rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: 'JetBrains Mono', monospace;
  }

  /* FOOTER */
  .ns-foot-sig {
    display: flex; align-items: center; gap: 1.5rem;
    margin-top: 4rem; padding-top: 2rem;
    border-top: 1px solid ${r.line};
    font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${r.gray};
  }
  .ns-foot-sig-line { flex: 1; height: 1px; background: ${r.line}; }
  .ns-foot-sig-mark { font-family: 'Fraunces', serif; font-style: italic; font-size: 1rem; color: ${r.brass}; text-transform: none; letter-spacing: 0; }

  /* RESPONSIVE */
  @media (max-width: 920px) {
    .ns-main-grid, .ns-secondary-grid { grid-template-columns: 1fr; }
    .ns-side-stack { grid-template-rows: auto auto; }
    .ns-featured-media { height: 300px; }
  }
`,lr=()=>{const t=Y(),a=[{featured:!0,category:"COMING SOON",catColor:r.brass,logo:"/restpay.jpg",title:"RestPay: <em>Unified</em> Payment Processing",excerpt:"We're introducing RestPay, our upcoming payment module that will integrate card payments alongside M-Pesa. Accept all major payment methods through a single, seamless platform.",date:"May 2026",cta:"Learn more",ctaTo:"/integrations"},{layout:"list",category:"INTEGRATION",catColor:ir,logo:nr,title:"KRA eTIMS Integration",excerpt:"Native integration to eliminate external accounting software.",list:["KRA Compliant Invoices","Direct Sync to eTIMS","No Manual Exports","Automated Tax Reporting"],date:"August 2026"},{layout:"dark",category:"PRODUCT",catColor:r.verdigris,title:"Multi Tenant Architecture Now Available",excerpt:"Serve multiple funeral homes from a single instance with complete data isolation.",date:"May 2026",author:"Shipped"},{layout:"edit",category:"BLOG",catColor:r.verdigris,title:"The Future of Death Care: Fully Automated Funeral Homes",excerpt:"From QR scanned intake and digital release to hearse self booking, coffin marketplaces, and 24/7 family portals — how modern funeral homes are going fully automated.",date:"September 2026",link:"/blog/future-of-death-care-software-restpoint",authorName:"Peter Mumo",authorRole:"Developer at Restpoint"},{layout:"soon",category:"COMING SOON",catColor:r.brass,title:"M-Pesa Payments — Coming Soon",excerpt:"Families will soon be able to pay directly through the portal via M-Pesa.",date:"May 2026"}],l=i=>{window.scrollTo({top:0,behavior:"smooth"}),t(i||"/")},o=i=>{i.currentTarget.style.display="none"};return(0,e.jsxs)("section",{className:"newsroom-section",children:[(0,e.jsx)("style",{children:sr}),(0,e.jsxs)("div",{className:"ns-wrap",children:[(0,e.jsx)(or,{style:{marginBottom:"0"},children:(0,e.jsxs)("header",{className:"ns-header",children:[(0,e.jsxs)("h1",{className:"ns-arch-label",children:["Dispatches",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"from the field."})]}),(0,e.jsxs)("div",{className:"ns-arch-meta",children:[(0,e.jsx)("span",{className:"ns-live-dot"})," Vol. 03 / Issue 09 / 2026"]})]})}),(0,e.jsxs)("div",{className:"ns-main-grid",children:[a[0]&&(0,e.jsx)(H,{from:"left",delay:0,children:(0,e.jsxs)("article",{className:"ns-card ns-featured",children:[(0,e.jsxs)("div",{className:"ns-featured-media",children:[(0,e.jsx)("div",{className:"ns-featured-badge",children:(0,e.jsxs)("svg",{width:"100",height:"28",viewBox:"0 0 220 56",xmlns:"http://www.w3.org/2000/svg","aria-label":"RestPay",children:[(0,e.jsx)("defs",{children:(0,e.jsxs)("linearGradient",{id:"rpg",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[(0,e.jsx)("stop",{offset:"0%","stop-color":"#8B7355"}),(0,e.jsx)("stop",{offset:"100%","stop-color":"#A89478"})]})}),(0,e.jsx)("rect",{x:"2",y:"10",width:"36",height:"36",rx:"9",fill:"url(#rpg)"}),(0,e.jsx)("path",{d:"M12 22 L20 30 L32 18",stroke:"#FAF8F4","stroke-width":"3","stroke-linecap":"round","stroke-linejoin":"round",fill:"none"}),(0,e.jsx)("text",{x:"48",y:"28","font-family":"Fraunces, serif","font-size":"22","font-weight":"500",fill:"#15171A","letter-spacing":"-0.5",children:"RestPay"}),(0,e.jsx)("text",{x:"48",y:"44","font-family":"JetBrains Mono, monospace","font-size":"7",fill:"#8B7355","letter-spacing":"2",children:"UNIFIED PAYMENTS"})]})}),(0,e.jsx)("img",{src:a[0].logo,alt:"RestPay Preview",onError:o})]}),(0,e.jsxs)("div",{className:"ns-featured-content",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:"#C9B58E"},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[0].catColor}}),a[0].category," · Cover Story"]}),(0,e.jsx)("h2",{className:"ns-featured-title",dangerouslySetInnerHTML:{__html:a[0].title}}),(0,e.jsx)("p",{className:"ns-featured-excerpt",children:a[0].excerpt}),(0,e.jsxs)("div",{className:"ns-featured-foot",children:[(0,e.jsxs)("span",{className:"ns-date ns-date-light",children:[a[0].date," · Featured Release"]}),a[0].cta&&(0,e.jsxs)("button",{className:"ns-btn",onClick:()=>l(a[0].ctaTo),children:[a[0].cta," ",(0,e.jsx)(de,{size:14})]})]})]})]})},"featured"),(0,e.jsxs)("div",{className:"ns-side-stack",children:[a[1]&&(0,e.jsx)(H,{from:"right",delay:150,children:(0,e.jsxs)("article",{className:"ns-card ns-card-list",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[1].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[1].catColor}}),a[1].category]}),a[1].logo&&(0,e.jsx)("img",{src:a[1].logo,alt:"KRA Logo",style:{height:"30px"},onError:o})]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[1].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[1].excerpt}),(0,e.jsx)("div",{className:"ns-checklist",children:a[1].list?.map((i,d)=>(0,e.jsxs)("div",{className:"ns-check-item",children:[(0,e.jsx)("span",{className:"ns-check-icon",children:(0,e.jsx)(Be,{size:12})}),i]},d))})]})},"list"),a[2]&&(0,e.jsx)(H,{from:"right",delay:250,children:(0,e.jsxs)("article",{className:"ns-card ns-card-dark",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[2].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[2].catColor}}),a[2].category]}),(0,e.jsx)("div",{className:"ns-ext-icon",children:(0,e.jsx)(qe,{size:14,color:r.bone})})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h3",{className:"ns-card-title",children:a[2].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[2].excerpt})]}),(0,e.jsx)("span",{className:"ns-date ns-date-light",children:a[2].date})]})},"dark")]})]}),(0,e.jsxs)("div",{className:"ns-secondary-grid",children:[a[3]&&(0,e.jsx)(H,{from:"left",delay:300,children:(0,e.jsxs)("article",{className:"ns-card ns-card-edit",onClick:()=>a[3].link&&l(a[3].link),children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[3].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[3].catColor}}),a[3].category]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[3].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[3].excerpt})]}),(0,e.jsxs)("div",{className:"ns-author-block",children:[(0,e.jsx)("div",{className:"ns-author-avatar",children:"PM"}),(0,e.jsxs)("div",{className:"ns-author-info",children:[(0,e.jsx)("span",{className:"ns-author-name",children:a[3].authorName}),(0,e.jsx)("span",{className:"ns-author-role",children:a[3].authorRole})]})]})]})},"edit"),a[4]&&(0,e.jsx)(H,{from:"right",delay:350,children:(0,e.jsxs)("article",{className:"ns-card ns-card-edit",children:[(0,e.jsxs)("div",{className:"ns-list-header",children:[(0,e.jsxs)("div",{className:"ns-cat",style:{color:a[4].catColor},children:[(0,e.jsx)("span",{className:"ns-cat-dot",style:{background:a[4].catColor}}),a[4].category]}),(0,e.jsx)("span",{className:"ns-badge-soon",children:"In Development"})]}),(0,e.jsx)("h3",{className:"ns-card-title",children:a[4].title}),(0,e.jsx)("p",{className:"ns-card-excerpt",children:a[4].excerpt}),(0,e.jsx)("span",{className:"ns-date ns-date-muted",style:{marginTop:"auto"},children:a[4].date})]})},"soon")]})]})]})},y={ink:"#000000",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(0,0,0,0.08)",gray:"#8A8780",grayLight:"rgba(0,0,0,0.6)",accent:"#C77B5E"},dr=K`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`,cr=$`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`,mr=n.section`
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 35% 65%;
  overflow: hidden;
  background: ${y.ink};
  color: ${y.bone};
  font-family: 'Inter', sans-serif;

  /* Ambient glow using Accent */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(199, 123, 94, 0.15) 0%, transparent 70%);
    filter: blur(50px);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`,pr=n.div`
  position: relative;
  z-index: 2;
  padding: 3rem clamp(2rem, 4vw, 4rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(250, 248, 244, 0.1);
  background: ${y.ink};

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid rgba(250, 248, 244, 0.1);
    padding: 2rem 1.5rem;
  }
`,gr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${y.gray};

  & > span:first-child {
    color: ${y.accent};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${y.accent};
      display: block;
    }
  }
`,hr=n.div`
  margin: 4rem 0 3rem;

  @media (max-width: 900px) {
    margin: 2rem 0;
  }
`;n.span`
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${y.accent};
  margin-bottom: 1.5rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(250, 248, 244, 0.2);
  border-radius: 20px;
  background: rgba(199, 123, 94, 0.05);
`;var fr=n.h1`
  font-family: 'Fraunces', serif;
  font-size: clamp(3rem, 5vw, 4.5rem);
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: ${y.bone};
  margin: 0;

  em {
    font-style: italic;
    font-weight: 300;
    color: ${y.brassLight};
    display: block;
  }
`,xr=n.p`
  font-size: 0.95rem;
  color: ${y.gray};
  line-height: 1.7;
  margin-top: 2rem;
  max-width: 90%;
`,ur=n.div`
  border-top: 1px solid rgba(250, 248, 244, 0.1);
  margin-top: auto;

  @media (max-width: 500px) {
    margin-top: 2rem;
  }
`,Q=n.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid rgba(250, 248, 244, 0.1);
  transition: padding 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s ease;
  cursor: default;
  position: relative;

  &:hover {
    padding-left: 1rem;
    background: linear-gradient(90deg, rgba(199, 123, 94, 0.08) 0%, transparent 100%);
    
    svg {
      color: ${y.accent};
    }
  }
`,Z=n.span`
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 1rem;
  color: ${y.accent};
  opacity: 0.7;
  width: 20px;
`,ee=n.div`
  color: ${y.gray};
  width: 24px;
  display: flex;
  justify-content: center;
  transition: color 0.3s ease;
`,re=n.div`
  h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${y.bone};
    margin-bottom: 0.15rem;
    font-family: 'Inter', sans-serif;
  }
  p {
    font-size: 0.75rem;
    color: ${y.gray};
    line-height: 1.4;
    margin: 0;
  }
`,br=n.div`
  position: relative;
  background: #050505; /* Slight contrast from pure black */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  padding-left: 4rem;

  /* Grid Overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(250, 248, 244, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(250, 248, 244, 0.015) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 900px) {
    padding: 3rem 1.5rem;
    justify-content: center;
    min-height: 400px;
  }
`,vr=n.div`
  position: absolute;
  top: 15%;
  right: 5%;
  z-index: 3;
  background: rgba(46, 63, 55, 0.6); /* Verdigris Dark with opacity */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(250, 248, 244, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  max-width: 240px;

  h5 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${y.verdigrisTint};
    margin-bottom: 0.75rem;
  }
  p {
    font-family: 'Fraunces', serif;
    font-size: 0.95rem;
    line-height: 1.4;
    color: ${y.bone};
    font-weight: 400;
    strong {
      font-weight: 600;
      color: ${y.accent};
    }
  }

  @media (max-width: 900px) {
    top: 1rem;
    right: 1rem;
    padding: 1rem;
    max-width: 180px;
    p { font-size: 0.85rem; }
  }
`,yr=n.div`
  position: relative;
  z-index: 2;
  transform: perspective(1000px) rotateY(-5deg) translateY(-20px);
  transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);

  &:hover {
    transform: perspective(1000px) rotateY(0deg) translateY(0);
  }

  @media (max-width: 900px) {
    transform: none;
  }
`,wr=n.div`
  background: #000;
  padding: 8px;
  border-radius: 20px;
  border: 1px solid rgba(250, 248, 244, 0.2);
  box-shadow: 
    0 50px 100px -20px rgba(0,0,0,0.8),
    0 30px 60px -30px rgba(199, 123, 94, 0.3); /* Accent glow shadow */
`,jr=n.img`
  display: block;
  width: 100%;
  max-width: 550px;
  height: auto;
  border-radius: 12px;
  filter: saturate(1.1) contrast(1.1);
`,kr=n.div`
  background: ${y.accent}; /* Terracotta background */
  color: ${y.ink}; /* Black text */
  padding: 2.5rem 0;
  overflow: hidden;
  position: relative;
`,Fr=n.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  animation: ${cr} 30s linear infinite;
`,ve=n.div`
  font-family: 'Fraunces', serif;
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 400;
  font-style: italic;
  padding: 0 3rem;
  display: flex;
  align-items: center;
  gap: 3rem;

  span {
    font-style: normal;
    font-weight: 300;
  }

  @media (max-width: 500px) {
    font-size: 2.5rem;
    padding: 0 1.5rem;
    gap: 1.5rem;
  }
`,T=n.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${y.ink};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,zr=()=>(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(dr,{}),(0,e.jsxs)(mr,{children:[(0,e.jsxs)(pr,{children:[(0,e.jsxs)(gr,{children:[(0,e.jsx)("span",{children:"Restpoint Hardware"}),(0,e.jsx)("span",{children:"Spec No. 06"})]}),(0,e.jsxs)(hr,{children:[(0,e.jsxs)(fr,{children:["FrontDesk",(0,e.jsx)("em",{children:"Tablet / Ipad"})]}),(0,e.jsx)(xr,{children:"We provide a dedicated touchscreen tablet to give families a modern, respectful, and seamless digital experience. From browsing floral arrangements to signing final documents, the entire process is elevated."})]}),(0,e.jsxs)(ur,{children:[(0,e.jsxs)(Q,{children:[(0,e.jsx)(Z,{children:"01"}),(0,e.jsx)(ee,{children:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M3 17.5C5 18.5 7.5 19 10 19C14 19 17 17.5 19 15C21 12.5 21 9 19 7C17 4.5 14 4 10 4C7.5 4 5 4.5 3 5.5"}),(0,e.jsx)("path",{d:"M12 19V21"}),(0,e.jsx)("path",{d:"M9 21H15"})]})}),(0,e.jsxs)(re,{children:[(0,e.jsx)("h4",{children:"Touch Signatures"}),(0,e.jsx)("p",{children:"Families easily sign intake and release forms directly on screen."})]})]}),(0,e.jsxs)(Q,{children:[(0,e.jsx)(Z,{children:"02"}),(0,e.jsx)(ee,{children:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"8",y:"2",width:"8",height:"4",rx:"1"}),(0,e.jsx)("path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}),(0,e.jsx)("path",{d:"m9 14 2 2 4-4"})]})}),(0,e.jsxs)(re,{children:[(0,e.jsx)("h4",{children:"Digital Intake"}),(0,e.jsx)("p",{children:"A guided, paperless process for completing necessary arrangements."})]})]}),(0,e.jsxs)(Q,{children:[(0,e.jsx)(Z,{children:"03"}),(0,e.jsx)(ee,{children:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),(0,e.jsx)("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]})}),(0,e.jsxs)(re,{children:[(0,e.jsx)("h4",{children:"Secure Releases"}),(0,e.jsx)("p",{children:"Simple, verified digital authorizations for final release processes."})]})]}),(0,e.jsxs)(Q,{children:[(0,e.jsx)(Z,{children:"04"}),(0,e.jsx)(ee,{children:(0,e.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M12 22c5-3 9-7 9-12V5l-9-3-9 3v5c0 5 4 9 9 12z"}),(0,e.jsx)("path",{d:"M8 12c1.5-1.5 3-1.5 4 0s2.5 1.5 4 0"})]})}),(0,e.jsxs)(re,{children:[(0,e.jsx)("h4",{children:"Curated Florals"}),(0,e.jsx)("p",{children:"Families browse a visual catalog to select and order flower samples."})]})]})]})]}),(0,e.jsxs)(br,{children:[(0,e.jsxs)(vr,{children:[(0,e.jsx)("h5",{children:"System Requirement"}),(0,e.jsxs)("p",{children:["To operate the Restpoint system, ",(0,e.jsx)("strong",{children:"all funeral homes are required to purchase this specific tablet."})," It serves as your primary digital registry."]})]}),(0,e.jsx)(yr,{children:(0,e.jsx)(wr,{children:(0,e.jsx)(jr,{src:"/tab.jpg",alt:"Family using the tablet interface"})})})]})]}),(0,e.jsx)(kr,{children:(0,e.jsxs)(Fr,{children:[(0,e.jsxs)(ve,{children:[(0,e.jsx)("span",{children:"Mandatory for All Facilities"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("em",{children:"FrontDesk Portal"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("span",{children:"Mandatory for All Facilities"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("em",{children:"FrontDesk Portal"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})})]}),(0,e.jsxs)(ve,{"aria-hidden":"true",children:[(0,e.jsx)("span",{children:"Mandatory for All Facilities"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("em",{children:"FrontDesk Portal"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("span",{children:"Mandatory for All Facilities"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,e.jsx)("em",{children:"FrontDesk Portal"}),(0,e.jsx)(T,{children:(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),(0,e.jsx)("polyline",{points:"22 4 12 14.01 9 11.01"})]})})]})]})})]}),Nr=({title:t,description:a,keywords:l,image:o="/og-image.jpg",url:i,type:d="website",schema:h,localBusiness:c=!1})=>{const g=He(),f="https://restpoint.co.ke",v=i?`${f}${i}`:`${f}${g.pathname}`;return(0,p.useEffect)(()=>{document.title=t;const s=(m,x,b=!1)=>{const w=b?"property":"name";let j=document.querySelector(`meta[${w}="${m}"]`);j||(j=document.createElement("meta"),j.setAttribute(w,m),document.head.appendChild(j)),j.setAttribute("content",x)};s("description",a),s("keywords",l),s("author","Rest Point Technologies"),s("robots","index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"),s("googlebot","index, follow"),s("og:title",t,!0),s("og:description",a,!0),s("og:image",o,!0),s("og:url",v,!0),s("og:type",d,!0),s("og:site_name","Rest Point",!0),s("og:locale","en_KE"),s("twitter:card","summary_large_image"),s("twitter:title",t),s("twitter:description",a),s("twitter:image",o);let u=document.querySelector('link[rel="canonical"]');if(u||(u=document.createElement("link"),u.setAttribute("rel","canonical"),document.head.appendChild(u)),u.setAttribute("href",v),h){let m=document.querySelector('script[type="application/ld+json"]');m||(m=document.createElement("script"),m.setAttribute("type","application/ld+json"),document.head.appendChild(m)),m.textContent=JSON.stringify(h)}return()=>{}},[t,a,l,o,v,d,h]),null},$r={"@context":"https://schema.org","@type":"Organization",name:"Rest Point",description:"Kenya's #1 Funeral Home Management System & Welfare Management Platform",url:"https://restpoint.co.ke",logo:"https://restpoint.co.ke/logo.png",foundingDate:"2020",founders:[{"@type":"Person",name:"Rest Point Team"}],address:{"@type":"PostalAddress",streetAddress:"Nairobi, Kenya",addressLocality:"Nairobi",addressCountry:"KE"},contactPoint:{"@type":"ContactPoint",telephone:"+254-700-000-000",contactType:"sales",availableLanguage:["English","Swahili"]},sameAs:["https://twitter.com/restpointke","https://linkedin.com/company/restpointke","https://facebook.com/restpointke"],areaServed:{"@type":"Country",name:"Kenya"},knowsAbout:["Funeral Management Software","Welfare Management System","Funeral Insurance Administration","SACCO Management Software","Church Management Software"]},Sr={"@context":"https://schema.org","@type":"SoftwareApplication",name:"Rest Point",applicationCategory:"BusinessApplication",operatingSystem:"Web",description:"Complete funeral home management and welfare administration platform for churches, SACCOs, and organizations in Kenya",url:"https://restpoint.co.ke",screenshot:"https://restpoint.co.ke/dashboard-preview.png",aggregateRating:{"@type":"AggregateRating",ratingValue:"4.8",ratingCount:"150",bestRating:"5",worstRating:"1"},offers:[{"@type":"Offer",name:"Single Tenant Plan",price:"9200",priceCurrency:"KES",billingIncrement:"P1M"},{"@type":"Offer",name:"Multi-Tenant Plan",price:"18900",priceCurrency:"KES",billingIncrement:"P1M"}],featureList:["Funeral Case Management","Funeral Insurance Administration","Member Contribution Tracking","M-Pesa Integration","Claims Management","Family Portal","SMS Notifications","Financial Reporting"]},Cr={"@context":"https://schema.org","@type":"LocalBusiness",name:"Rest Point Technologies",description:"Funeral Home Management Software & Welfare Management System Provider in Kenya",image:"https://restpoint.co.ke/logo.png",url:"https://restpoint.co.ke",telephone:"+254-740-045-355",email:"info@restpoint.co.ke",address:{"@type":"PostalAddress",addressLocality:"Nairobi",addressCountry:"KE"},geo:{"@type":"GeoCoordinates",latitude:"-1.2921",longitude:"36.8219"},openingHoursSpecification:{"@type":"OpeningHoursSpecification",dayOfWeek:["Monday","Tuesday","Wednesday","Thursday","Friday"],opens:"08:00",closes:"18:00"},priceRange:"KES 9,200 - 189,000/month",areaServed:[{"@type":"City",name:"Nairobi"},{"@type":"City",name:"Mombasa"},{"@type":"City",name:"Kisumu"},{"@type":"Country",name:"Kenya"}]},Mr=t=>({"@context":"https://schema.org","@type":"FAQPage",mainEntity:t.map(a=>({"@type":"Question",name:a.question,acceptedAnswer:{"@type":"Answer",text:a.answer}}))}),Tr=()=>(0,e.jsx)(Nr,{title:"Rest Point | Kenya's #1 Funeral Home Management System & Welfare Management Platform",description:"Complete funeral home management and welfare administration platform for churches, SACCOs, chamas, and organizations in Kenya. Manage cases, process funeral insurance claims, track member contributions, and serve families with dignity. Trusted by 500+ organizations. M-Pesa integrated.",keywords:"funeral management software Kenya, funeral home management system, welfare management software, funeral insurance administration, SACCO funeral software, church welfare management, chama management software, member contribution tracking, M-Pesa integration, funeral claims management, bereavement management, funeral cover administration, group funeral insurance, Kenya funeral software",url:"/",schema:[$r,Sr,Cr,Mr([{question:"What is the best funeral management software in Kenya?",answer:"Rest Point is Kenya's #1 funeral home management and welfare management platform. Trusted by 500+ organizations including funeral homes, churches, SACCOs, and companies across Kenya for case management, funeral insurance administration, and member contribution tracking."},{question:"How much does funeral management software cost in Kenya?",answer:"Rest Point offers affordable plans starting from KES 9,200/month for small organizations (Single Tenant) and KES 18,900/month for multi-branch organizations (Multi-Tenant). All plans include core features with no hidden fees."},{question:"Can funeral management software integrate with M-Pesa?",answer:"Yes! Rest Point seamlessly integrates with M-Pesa for automated premium collection, contribution tracking, and payment processing. This makes it perfect for Kenyan organizations looking to digitize their funeral welfare programs."},{question:"What features does funeral welfare management software need?",answer:"Essential features include: member registration and management, beneficiary designation, contribution tracking with M-Pesa integration, claims management, automated approvals workflow, financial reporting, SMS notifications, and family portal access. Rest Point includes all these features and more."},{question:"Is Rest Point suitable for churches and SACCOs?",answer:"Absolutely! Rest Point is specifically designed for churches, SACCOs, chamas, companies, and NGOs in Kenya. It offers tailored features like church welfare committee management, SACCO multi-branch support, SASRA compliance reporting, and member contribution tracking."},{question:"How does funeral insurance management software work?",answer:"Rest Point streamlines funeral insurance from member enrollment to claims processing. It automates premium collection via M-Pesa, manages beneficiary information, processes claims with digital workflows, calculates benefits automatically, and provides comprehensive reporting for stakeholders."}])]}),Ar=({end:t,suffix:a=""})=>{const[l,o]=(0,p.useState)(0),[i,d]=(0,p.useState)(!1),h=(0,p.useRef)(null);return(0,p.useEffect)(()=>{const c=h.current;if(!c)return;const g=new IntersectionObserver(([f])=>{f.isIntersecting&&(d(!0),g.disconnect())},{threshold:.1});return g.observe(c),()=>g.disconnect()},[]),(0,p.useEffect)(()=>{if(!i)return;let c=0;const g=t/(1500/16),f=setInterval(()=>{c+=g,c>=t?(o(t),clearInterval(f)):o(Math.floor(c))},16);return()=>clearInterval(f)},[i,t]),(0,e.jsxs)("span",{ref:h,children:[l.toLocaleString(),a]})},Er=n.section`
  padding: clamp(4rem, 8vw, 7rem) 0;
  background: ${r.bone};
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
`,Br=n.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
  box-sizing: border-box;
`,Pr=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${r.brass};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before {
    content: '';
    width: 12px;
    height: 2px;
    background: ${r.brass};
    display: inline-block;
  }
`,qr=n.h2`
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 600;
  color: ${r.ink};
  line-height: 1.1;
  letter-spacing: -0.02em;
  max-width: 560px;
  margin-bottom: 0.75rem;
`,Rr=n.p`
  font-size: 0.95rem;
  color: ${r.gray};
  line-height: 1.7;
  max-width: 500px;
  margin-bottom: 2.5rem;
`,Ir=n.div`
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
`,Lr=n.div`
  position: relative;
  border-radius: 14px;
  background: ${r.ink};
  border: 1px solid rgba(250,248,244,0.07);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-height: ${t=>t.$hero?"400px":"180px"};

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
`,Dr=n.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(61,79,71,0.2);
  border: 1px solid rgba(61,79,71,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  svg { color: ${r.brassLight}; }
`,Or=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${r.brassLight};
  margin-bottom: 0.3rem;
`,Wr=n.h3`
  font-family: 'Fraunces', serif;
  font-size: ${t=>t.$hero?"1.5rem":"1.2rem"};
  font-weight: 600;
  color: ${r.bone};
  margin-bottom: 0.4rem;
`,Yr=n.p`
  font-size: ${t=>t.$hero?"0.9rem":"0.8rem"};
  color: rgba(250,248,244,0.5);
  line-height: 1.6;
  max-width: ${t=>t.$hero?"400px":"100%"};
  flex: 1;
`,Hr=n.span`
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
`,Gr=n.div`
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
`,Jr=n.div`
  position: relative;
  border-radius: 14px;
  background: ${r.ink};
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
      ${t=>t.$glow||"rgba(61,79,71,0.1)"} 0%,
      transparent 55%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover::before { opacity: 1; }
`,_r=n.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.6rem;
`,Ur=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.52rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(250,248,244,0.35);
  white-space: pre-line;
  line-height: 1.5;
`,Kr=n.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${t=>t.$bg||"rgba(61,79,71,0.12)"};
  border: 1px solid ${t=>t.$border||"rgba(61,79,71,0.15)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 16px; height: 16px; }
`,Xr=n.div`
  font-family: 'DM Sans', 'Inter', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  color: ${r.bone};
  line-height: 1;
  letter-spacing: -0.03em;
  margin: 0.4rem 0;
  span { font-size: 0.9rem; font-weight: 500; color: rgba(250,248,244,0.4); margin-left: 0.1rem; }
`,Vr=n.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 500;
  padding: 0.14rem 0.4rem;
  border-radius: 3px;
  color: ${t=>t.$up?"#7db8a0":r.brassLight};
  background: ${t=>t.$up?"rgba(125,184,160,0.1)":"rgba(169,143,110,0.1)"};
  margin-bottom: 0.5rem;
`,Qr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`,Zr=n.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${r.bone};
`,et=n.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.46rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.16rem 0.45rem;
  border-radius: 3px;
  border: 1px solid rgba(250,248,244,0.08);
  color: rgba(250,248,244,0.4);
`,rt=[{id:"body-intake",label:"Case Management",title:"Body Intake Form",desc:"Digital registration with next-of-kin details, verification, and signature capture in one structured flow.",icon:U,tags:["Digital Forms","Sign-off","Auto ID"],preview:"/preview/body-intake",delay:0,hero:!0},{id:"release-form",label:"Self-Service",title:"Release Form Portal",desc:"Families complete release documentation independently — digital forms and e-signature, no staff needed.",icon:Ze,tags:["E-Sign","ID Verify","Auto-Process"],preview:"/preview/release-form",delay:200,hero:!1},{id:"reception",label:"Receptionist Portal",title:"Reception Portal",desc:"Manage walk-in clients, track visits, and streamline reception workflows.",icon:Ue,tags:["Walk-ins","Tracking","Workflow"],preview:"/preview/reception-portal",delay:300,hero:!1}],tt=[{id:"active",label:`Active
Sessions`,number:54,suffix:"",change:"+12% this week",up:!0,name:"Current Users",tag:"Live",iconBg:"rgba(61,79,71,0.12)",iconBorder:"rgba(61,79,71,0.15)",iconColor:"#7db8a0",glow:"rgba(61,79,71,0.12)",icon:Je,delay:80},{id:"completed",label:`Completed
Forms`,number:128,suffix:"",change:"+28% this month",up:!0,name:"Total Submissions",tag:"Done",iconBg:"rgba(125,184,160,0.12)",iconBorder:"rgba(125,184,160,0.15)",iconColor:"#7db8a0",glow:"rgba(125,184,160,0.1)",icon:Xe,delay:160}];function at({m:t}){const a=(0,p.useRef)(null),l=Y(),o=t.icon,i=(0,p.useCallback)(h=>{const c=a.current;if(!c)return;const g=c.getBoundingClientRect();c.style.setProperty("--gx",((h.clientX-g.left)/g.width*100).toFixed(1)+"%"),c.style.setProperty("--gy",((h.clientY-g.top)/g.height*100).toFixed(1)+"%")},[]),d=()=>{t.preview&&l(t.preview)};return(0,e.jsxs)(Lr,{ref:a,id:`bento-${t.id}`,className:t.hero?"hero":"wide",style:{"--delay":`${t.delay}ms`},$hero:t.hero,onMouseMove:i,onClick:d,children:[(0,e.jsx)(Dr,{children:(0,e.jsx)(o,{size:24})}),(0,e.jsx)(Or,{children:t.label}),(0,e.jsx)(Wr,{$hero:t.hero,children:t.title}),(0,e.jsx)(Yr,{$hero:t.hero,children:t.desc}),(0,e.jsx)("div",{style:{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginTop:"0.8rem"},children:t.tags.map(h=>(0,e.jsx)(Hr,{children:h},h))}),(0,e.jsxs)(Gr,{children:[(0,e.jsx)(tr,{size:12}),"Preview Available"]})]})}function it({m:t}){const a=(0,p.useRef)(null),l=t.icon,o=(0,p.useCallback)(i=>{const d=a.current;if(!d)return;const h=d.getBoundingClientRect();d.style.setProperty("--gx",((i.clientX-h.left)/h.width*100).toFixed(1)+"%"),d.style.setProperty("--gy",((i.clientY-h.top)/h.height*100).toFixed(1)+"%")},[]);return(0,e.jsxs)(Jr,{ref:a,id:`bento-${t.id}`,className:"tall",style:{"--delay":`${t.delay}ms`},$glow:t.glow,onMouseMove:o,children:[(0,e.jsxs)(_r,{children:[(0,e.jsx)(Ur,{children:t.label}),(0,e.jsx)(Kr,{$bg:t.iconBg,$border:t.iconBorder,children:(0,e.jsx)(l,{size:16,color:t.iconColor})})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Xr,{children:[(0,e.jsx)(Ar,{end:t.number}),t.suffix&&(0,e.jsx)("span",{children:t.suffix})]}),(0,e.jsx)(Vr,{$up:t.up,children:t.change})]}),(0,e.jsxs)(Qr,{children:[(0,e.jsx)(Zr,{children:t.name}),(0,e.jsx)(et,{children:t.tag})]})]})}function nt(){const t=(0,p.useRef)(null);return(0,p.useEffect)(()=>{const a=t.current;if(!a)return;const l=a.querySelectorAll('[id^="bento-"]'),o=new IntersectionObserver(i=>i.forEach(d=>{d.isIntersecting&&(d.target.classList.add("visible"),o.unobserve(d.target))}),{threshold:.08});return l.forEach(i=>o.observe(i)),()=>o.disconnect()},[]),(0,e.jsx)(Er,{children:(0,e.jsxs)(Br,{children:[(0,e.jsx)(Pr,{children:"Preview Modules"}),(0,e.jsx)(qr,{children:"Explore our self-service modules"}),(0,e.jsx)(Rr,{children:"Click on any card to preview the module in action. These self-service tools are designed for tablet use."}),(0,e.jsxs)(Ir,{ref:t,children:[rt.map(a=>(0,e.jsx)(at,{m:a},a.id)),tt.map(a=>(0,e.jsx)(it,{m:a},a.id))]})]})})}var ot=()=>{const[t,a]=(0,p.useState)(!0),[l,o]=(0,p.useState)(!1);(0,p.useEffect)(()=>{let d=null;const h=()=>{a(!1),o(!1),clearTimeout(d),d=setTimeout(()=>a(!0),400)};return window.addEventListener("scroll",h,{passive:!0}),()=>{clearTimeout(d),window.removeEventListener("scroll",h)}},[]);const i="https://wa.me/254740045355?text=Hello%2C%20I%20have%20a%20question";return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
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
          left: 65px; /* sits just outside the right of the button */
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
        /* Small arrow pointing left towards the button */
        .tooltip-text::after {
          content: "";
          position: absolute;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 6px 6px 6px 0;
          border-style: solid;
          border-color: transparent #333 transparent transparent;
        }

        .call-btn:hover .tooltip-text {
          opacity: 1;
          visibility: visible;
        }

        /* --- CHAT POPUP FOR WHATSAPP BUTTON --- */
        .popup-box {
          position: absolute;
          bottom: 60px;
          left: 0;
          width: 300px;
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
          left: -8px;
          top: 10px;
          border-width: 6px 8px 6px 0;
          border-style: solid;
          border-color: transparent white transparent transparent;
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
      `}),(0,e.jsxs)("div",{className:`floating-container ${t?"":"hidden"}`,children:[(0,e.jsxs)("div",{className:"floating-block",onMouseEnter:()=>o(!0),onMouseLeave:()=>o(!1),children:[(0,e.jsxs)("div",{className:`popup-box ${l?"open":""}`,children:[(0,e.jsxs)("div",{className:"popup-header whatsapp-header",children:[(0,e.jsx)("div",{className:"avatar",children:(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",width:"25",height:"25",children:(0,e.jsx)("path",{fill:"#075E54",d:"M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C82.7 304 0 382.8 0 481.3C0 497.7 13.3 512 29.7 512H418.3c16.4 0 29.7-14.3 29.7-30.7C448 382.8 365.3 304 269.7 304H178.3z"})})}),(0,e.jsxs)("div",{className:"header-info",children:[(0,e.jsx)("h3",{children:"WhatsApp Support"}),(0,e.jsx)("span",{children:"Online"})]})]}),(0,e.jsx)("div",{className:"popup-body",children:(0,e.jsxs)("div",{className:"popup-message",children:["Hi there 👋 ",(0,e.jsx)("br",{})," Chat with us on WhatsApp!"]})}),(0,e.jsx)("div",{className:"popup-footer",children:(0,e.jsx)("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"action-btn action-whatsapp",children:"Start Chat"})})]}),(0,e.jsx)("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"floating-btn whatsapp-btn",children:(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",width:"28",height:"28",children:(0,e.jsx)("path",{fill:"#ffffff",d:"M380.9 97.1C339 55.1 283.2 32 223.9 32c-119.3 0-216 96.7-216 216 0 38.1 9.9 75.3 28.9 108.7L32 480l118.9-31.2c32.4 17.7 68.8 27 106.1 27h.1c119.3 0 216-96.7 216-216 0-59.3-25.2-115.1-67.2-157.1zM223.9 438.6c-31.7 0-62.9-8.5-90.1-24.6l-6.5-3.9-68.1 17.9 18.2-66.5-4.2-6.8c-17.5-27.9-26.7-60.2-26.7-93.6 0-97.8 79.6-177.4 177.4-177.4 47.4 0 91.9 18.5 125.4 52 33.5 33.6 52 78.1 52 125.5 0 97.8-79.6 177.4-177.4 177.4z"})})})]}),(0,e.jsxs)("div",{className:"floating-block",children:[(0,e.jsx)("span",{className:"tooltip-text",children:"Call: 0740045355"}),(0,e.jsx)("a",{href:"tel:0740045355",className:"floating-btn call-btn",children:(0,e.jsxs)("div",{className:"call-content",children:[(0,e.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",width:"24",height:"24",children:(0,e.jsx)("path",{fill:"#ffffff",d:"M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"})}),(0,e.jsxs)("div",{className:"ringing-dots",children:[(0,e.jsx)("span",{}),(0,e.jsx)("span",{}),(0,e.jsx)("span",{})]})]})})]})]})]})},st=K`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`,k="#15171A",lt="#FAF8F4",dt="#F3EFE6",Ie="#8B7355",X="#E3DDD0",me="#6B6862",N="#C77B5E",ct=n.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: top 0.4s ease;
`,mt=n.div`
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
`,pt=n.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`,ye=n.div`display: flex; align-items: center; gap: 1.5rem;`,ge=n.div`display: flex; align-items: center; gap: 0.4rem;`,gt=n.div`width: 6px; height: 6px; background: #4D9B7F; border-radius: 50%; box-shadow: 0 0 8px #4D9B7F;`,he=n.a`color: rgba(250, 248, 244, 0.7); text-decoration: none; transition: color 0.2s; &:hover { color: ${lt}; }`,ht=n.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${X};
  transition: box-shadow 0.4s ease, background 0.4s ease;

  &.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 30px -10px rgba(21, 23, 26, 0.08);
  }
`,ft=n.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.2rem 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr auto;
    padding: 1rem 1.5rem;
  }
`,oe=n.a`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  text-decoration: none;
`,xt=n.div`
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

  ${oe}:hover & {
    transform: rotate(180deg);
    border-color: ${N};
  }
  ${oe}:hover &::before, ${oe}:hover &::after {
    background: ${N};
  }
`,ut=n.div`
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${k};
  letter-spacing: -0.02em;
`,bt=n.nav`
  display: flex;
  gap: 2.5rem;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    display: none;
  }
`,E=n.div`
  position: relative;
`,G=n.button`
  position: relative;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${me};
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
    background: ${N};
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
`,we=n.span`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${me};
  transition: transform 0.3s ease, border-top-color 0.3s ease;
  margin-left: 2px;

  ${E}:hover & {
    transform: rotate(180deg);
    border-top-color: ${N};
  }
`,je=n.div`
  position: absolute;
  top: calc(100% + 15px);
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid ${X};
  border-radius: 4px;
  min-width: 220px;
  padding: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(21, 23, 26, 0.08);
  z-index: 100;

  ${E}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
`,ke=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${Ie};
  padding: 0.5rem 1rem 0.8rem;
  border-bottom: 1px solid ${X};
  margin-bottom: 0.3rem;
`,Fe=n.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  color: ${me};
  text-decoration: none;
  font-size: 0.8rem;
  text-transform: none;
  letter-spacing: 0.02em;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;

  &:hover {
    background: ${dt};
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
    color: ${N};
  }
`,vt=n.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
`,yt=n.a`
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
    background: ${N};
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
  }

  &:hover {
    color: #FFFFFF;
    border-color: ${N};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(199, 123, 94, 0.2);
  }
  
  &:hover::before {
    transform: translateY(0);
  }
`,wt=n.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;

  @media (max-width: 900px) {
    display: block;
  }
`,jt=n.div`
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
`,kt=n.div`
  display: none;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${X};
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 900px) {
    display: block;
  }

  &.open {
    max-height: calc(100vh - 76px);
    overflow-y: auto;
    box-shadow: 0 30px 40px rgba(21, 23, 26, 0.15);
  }
`,Ft=n.div`
  padding: 0.5rem 1.5rem 1.75rem;
`,se=n.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid ${X};
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
    color: ${N};
    padding-left: 0.6rem;
  }
`,ze=n.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${Ie};
  padding: 1.4rem 0.25rem 0.4rem;
`,Ne=n(se)`
  font-weight: 400;
  font-size: 0.82rem;
  text-transform: none;
  letter-spacing: 0.02em;
  color: ${me};
  padding: 0.75rem 0.25rem;
`,zt=n.div`
  padding-top: 1.5rem;
  display: flex;
`,Nt=n.button`
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
    background: ${N};
    border-color: ${N};
  }
`;function $t(){const[t,a]=(0,p.useState)(!1),[l,o]=(0,p.useState)(!1),[i,d]=(0,p.useState)(!1),h=Y();(0,p.useEffect)(()=>{const s=()=>{const u=window.scrollY;u>20?a(!0):a(!1),u>100?o(!0):o(!1)};return window.addEventListener("scroll",s),()=>window.removeEventListener("scroll",s)},[]),(0,p.useEffect)(()=>{const s=u=>{i&&u.target.closest&&!u.target.closest("[data-mobile-menu]")&&d(!1)};return document.addEventListener("mousedown",s),()=>document.removeEventListener("mousedown",s)},[i]),(0,p.useEffect)(()=>(document.body.style.overflow=i?"hidden":"",()=>{document.body.style.overflow=""}),[i]);const c=s=>{d(!1),window.scrollTo({top:0,behavior:"smooth"}),h(s)},g=s=>{d(!1);const u=document.getElementById(s);u?u.scrollIntoView({behavior:"smooth",block:"start"}):(h("/"),setTimeout(()=>{const m=document.getElementById(s);m&&m.scrollIntoView({behavior:"smooth",block:"start"})},150))},f=[{label:"All Stories",path:"/blog/stories"},{label:"The Architecture of Blooms",path:"/blog/architecture-of-blooms"},{label:"Funeral Welfare, A Modern Guide",path:"/blog/funeral-welfare-management"},{label:"Member Contributions",path:"/blog/member-contributions"},{label:"Bereavement Management",path:"/blog/bereavement-management"},{label:"The Future of Death Care",path:"/blog/future-of-death-care-software-restpoint"}],v=[{label:"Terms of Service",path:"/terms"},{label:"Privacy Policy",path:"/privacy"},{label:"Data Migration",path:"/data-migration"},{label:"SLA Policy",path:"/sla"},{label:"Release Notes",path:"/releases"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(st,{}),(0,e.jsxs)(ct,{children:[(0,e.jsx)(mt,{className:l?"hidden":"",children:(0,e.jsxs)(pt,{children:[(0,e.jsxs)(ye,{children:[(0,e.jsxs)(ge,{children:[(0,e.jsx)(gt,{})," System Online"]}),(0,e.jsx)(ge,{style:{opacity:.5},children:"|"}),(0,e.jsx)(ge,{children:"Death Care OS — v2.0"})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(he,{href:"#",children:"Support"}),(0,e.jsx)(he,{href:"#",children:"Docs"}),(0,e.jsx)(he,{href:"#",children:"Status"})]})]})}),(0,e.jsx)(ht,{className:t?"scrolled":"",children:(0,e.jsxs)(ft,{children:[(0,e.jsxs)(oe,{href:"#",onClick:s=>{s.preventDefault(),c("/")},children:[(0,e.jsx)(xt,{}),(0,e.jsx)(ut,{children:"Rest Point"})]}),(0,e.jsxs)(bt,{children:[(0,e.jsx)(E,{children:(0,e.jsx)(G,{onClick:()=>g("features"),children:"Features"})}),(0,e.jsx)(E,{children:(0,e.jsx)(G,{onClick:()=>g("modules"),children:"Modules"})}),(0,e.jsx)(E,{children:(0,e.jsx)(G,{onClick:()=>c("/about"),children:"About"})}),(0,e.jsxs)(E,{children:[(0,e.jsxs)(G,{children:["Blogs ",(0,e.jsx)(we,{})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ke,{children:"The Journal"}),f.map(s=>(0,e.jsx)(Fe,{href:"#",onClick:u=>{u.preventDefault(),c(s.path)},children:s.label},s.label))]})]}),(0,e.jsxs)(E,{children:[(0,e.jsxs)(G,{children:["Policies ",(0,e.jsx)(we,{})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ke,{children:"Legal & Security"}),v.map(s=>(0,e.jsx)(Fe,{href:"#",onClick:u=>{u.preventDefault(),c(s.path)},children:s.label},s.label))]})]})]}),(0,e.jsx)(vt,{children:(0,e.jsx)(yt,{href:"#",onClick:s=>{s.preventDefault(),c("/login")},children:"Client Login"})}),(0,e.jsx)(wt,{"data-mobile-menu":!0,onClick:()=>d(s=>!s),"aria-label":"Toggle menu",children:(0,e.jsxs)(jt,{className:i?"open":"",children:[(0,e.jsx)("span",{}),(0,e.jsx)("span",{}),(0,e.jsx)("span",{})]})})]})}),(0,e.jsx)(kt,{className:i?"open":"","data-mobile-menu":!0,children:(0,e.jsxs)(Ft,{children:[(0,e.jsx)(se,{onClick:()=>g("features"),children:"Features"}),(0,e.jsx)(se,{onClick:()=>g("modules"),children:"Modules"}),(0,e.jsx)(se,{onClick:()=>c("/about"),children:"About"}),(0,e.jsx)(ze,{children:"The Journal"}),f.map(s=>(0,e.jsx)(Ne,{onClick:()=>c(s.path),children:s.label},s.label)),(0,e.jsx)(ze,{children:"Legal & Security"}),v.map(s=>(0,e.jsx)(Ne,{onClick:()=>c(s.path),children:s.label},s.label)),(0,e.jsx)(zt,{children:(0,e.jsx)(Nt,{onClick:()=>c("/login"),children:"Client Login"})})]})})]})]})}var St=K`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
`,O="#15171A",ce="#E3DDD0",xe="#6B6862",Ct="#C77B5E",B="#00d9ff",pe="#ff006e",Mt=$`from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); }`,Tt=$`from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); }`,At=$`from { opacity: 0; transform: translateY(14px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); }`,Et=$`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); }`;$`0% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(199, 123, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(199, 123, 94, 0); }`;var Bt=$`0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,255,0.5); } 50% { opacity: .5; box-shadow: 0 0 0 4px rgba(0,217,255,0); }`,Le=$`from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); }`,Pt=$`0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); }`,qt=$`0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0),0 8px 32px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12),0 8px 32px rgba(0,0,0,0.5); }`,Rt=n.section`
  padding-top: 160px; padding-bottom: 80px; position: relative; overflow: hidden; background: #FFFFFF;
  @media (max-width: 900px) { padding-top: 120px; }
`,It=n.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 500px; height: 500px; background: rgba(199, 123, 94, 0.12); top: -100px; left: -100px;`,Lt=n.div`position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; opacity: 0.4; width: 450px; height: 450px; background: rgba(139, 115, 85, 0.1); bottom: -100px; right: -100px;`,Dt=n.div`max-width: 1280px; margin: 0 auto; width: 100%; padding-left: clamp(1.5rem, 5vw, 5rem); padding-right: clamp(1.5rem, 5vw, 5rem);`,Ot=n.div`
  position: relative; z-index: 2; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 4rem; align-items: center;
  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 3.5rem; }
`,Wt=n.div`animation: ${Mt} 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;`,Yt=n.h1`
  font-family: 'Fraunces', serif; font-size: clamp(2.3rem, 4vw, 3.4rem);
  line-height: 1.12; letter-spacing: -0.025em; font-weight: 300; color: ${xe}; margin: 0 0 1.5rem; max-width: 560px;
`,Ht=n.span`display: block; color: ${O}; font-weight: 600;`,Gt=n.span`
  display: inline-block; font-style: italic; font-weight: 500; color: ${Ct};
  animation: ${At} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`,Jt=n.p`
  font-size: 1.02rem; max-width: 470px; margin: 0 0 2.5rem; color: ${xe};
  line-height: 1.75; font-family: 'Space Grotesk', sans-serif; font-weight: 400;
`,_t=n.div`display: flex; gap: 0.9rem; margin-bottom: 3rem; flex-wrap: wrap;`,De=n.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
  padding: 1.05rem 2rem; font-size: 0.78rem; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
  letter-spacing: 0.06em; text-transform: uppercase;
  @media (max-width: 480px) { flex: 1 1 100%; }
`,Oe=n.span`display: inline-flex; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);`,Ut=n(De)`
  background: ${O}; color: #FFFFFF;
  &:hover { background: #000000; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(21,23,26,0.25); & ${Oe} { transform: translateX(4px); } }
`,Kt=n(De)`
  background: transparent; color: ${O}; border-color: ${ce};
  &:hover { background: ${O}; color: #FFFFFF; border-color: ${O}; transform: translateY(-2px); }
`,Xt=n.div`
  display: flex; border-top: 1px solid ${ce}; padding-top: 1.6rem; max-width: 470px;
`,Vt=n.div`
  flex: 1; padding-right: 1rem;
  &:nth-child(2) { border-left: 1px solid ${ce}; padding-left: 1.1rem; }
  &:last-child { border-left: 1px solid ${ce}; padding-left: 1.1rem; padding-right: 0; }
  @media (max-width: 380px) { &:nth-child(2), &:last-child { padding-left: 0.7rem; } }
`,Qt=n.span`
  display: block; font-family: 'Fraunces', serif; font-size: 1.55rem; font-weight: 600;
  color: ${O}; line-height: 1; margin-bottom: 0.45rem;
`,Zt=n.span`
  font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: ${xe};
  text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.5; display: block;
`,ea=n.div`
  position: relative; display: flex; justify-content: center; align-items: center; height: 100%; perspective: 1600px;
`,ra=n.div`
  --s: 1;
  width: calc(380px * var(--s));
  height: calc(540px * var(--s));
  flex-shrink: 0;
  @media (max-width: 900px) { --s: 0.9; }
  @media (max-width: 430px) { --s: 0.75; }
  @media (max-width: 350px) { --s: 0.65; }
`,ta=n.div`
  width: 380px;
  height: 540px;
  transform: scale(var(--s));
  transform-origin: top left;
  transform-style: preserve-3d;
`,aa=n.div`
  animation: ${Tt} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards, ${Et} 8s ease-in-out infinite 1.5s; 
  opacity: 0; width: 380px; height: 540px; transform-style: preserve-3d;
`,ia=n.div`
  width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
  transform: ${t=>t.isFlipped?"rotateY(180deg)":"rotateY(0deg)"};
`,$e=n.div`
  position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 32px;
  &.back { transform: rotateY(180deg); }
`,Se=n.div`width: 100%; height: 100%; background: #050507; border-radius: 32px; padding: 12px; position: relative; box-shadow: 0 50px 100px -20px rgba(21,23,26,0.5), 0 30px 60px -30px rgba(199,123,94,0.15), inset 0 0 0 2px rgba(255,255,255,0.05); &::before { content: ''; position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #1a1b1c; border-radius: 50%; z-index: 100; }`,Ce=n.div`width: 100%; height: 100%; background: #050507; border-radius: 22px; overflow: hidden; position: relative; font-family: 'Space Grotesk', sans-serif; color: #e8e8eb;`,na=n.div`padding: 28px 24px; height: 100%; display: flex; flex-direction: column; background: radial-gradient(circle at top right, rgba(0,217,255,0.05), transparent 40%), #050507;`,oa=n.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;`,sa=n.div`text-align: center; flex: 1;`,la=n.div`font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #fff; font-weight: 600; margin-bottom: 6px;`,da=n.div`width: 80px; height: 1px; margin: 0 auto; background: linear-gradient(to right, transparent, rgba(0,217,255,0.5), transparent);`,ca=n.div`font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-top: 6px;`,ma=n.div`display: flex; align-items: center; gap: 5px;`,pa=n.div`width: 5px; height: 5px; background: ${B}; border-radius: 50%; animation: ${Bt} 2s infinite;`,ga=n.div`font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; color: #6a8a95; font-weight: 500;`,ha=n.div`margin-bottom: 24px;`,fa=n.div`font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #5a5a65; font-weight: 500; margin-bottom: 6px;`,xa=n.div`font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-style: italic; color: #fff; font-weight: 600; letter-spacing: -0.5px;`,ua=n.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);`,ba=n.div`font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: ${B}; font-style: italic; font-weight: 600;`,Me=n.div`font-size: 7px; letter-spacing: 2px; text-transform: uppercase; color: #5a5a65; font-weight: 600; margin-bottom: 2px;`,va=n.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1;`,ya=n.div`
  position: relative; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; cursor: pointer; overflow: hidden;
  background: linear-gradient(145deg, #0f1820 0%, #050709 100%); border: 1px solid rgba(0,217,255,0.25); transition: all 0.3s ease;
  &:hover { border-color: ${B}; box-shadow: 0 0 15px rgba(0,217,255,0.2); transform: translateY(-2px); }
  &.magenta { background: linear-gradient(145deg, #1f0a15 0%, #0a0305 100%); border-color: rgba(255,0,110,0.25); }
  &.magenta:hover { border-color: ${pe}; box-shadow: 0 0 15px rgba(255,0,110,0.2); }
`,te=n.div`position: absolute; width: 8px; height: 8px; border: 1.5px solid ${B}; &.magenta { border-color: ${pe}; } &.tl { top: 3px; left: 3px; border-right: 0; border-bottom: 0; } &.tr { top: 3px; right: 3px; border-left: 0; border-bottom: 0; } &.bl { bottom: 3px; left: 3px; border-right: 0; border-top: 0; } &.br { bottom: 3px; right: 3px; border-left: 0; border-top: 0; }`,wa=n.div`width: 28px; height: 28px; border-radius: 5px; background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: ${B}; &.magenta { background: rgba(255,0,110,0.1); border-color: rgba(255,0,110,0.3); color: ${pe}; }`,ja=n.div`position: absolute; bottom: -5px; right: 2px; font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-style: italic; font-weight: 700; color: rgba(255,255,255,0.03); line-height: 1; pointer-events: none;`,ka=n.div`font-size: 11px; font-weight: 600; color: #f0ebe3; line-height: 1.2; margin-bottom: 4px;`,Fa=n.div`font-size: 8px; color: #8a8a95; line-height: 1.4; font-weight: 300; margin-bottom: 8px; flex: 1;`,za=n.div`display: flex; align-items: center; gap: 3px; font-size: 7px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; color: ${B}; margin-top: auto; &.magenta { color: ${pe}; }`,Na=n.div`position: relative; height: 100%; background: #0a0b0c; overflow: hidden;`,$a=n.img`position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.75) saturate(0.95); transition: opacity 0.4s ease-in-out; opacity: ${t=>t.fading?0:1};`,Sa=n.div`position: absolute; inset: 0; background: linear-gradient(180deg,rgba(10,11,12,0.4) 0%,rgba(10,11,12,0.02) 30%,rgba(10,11,12,0.02) 55%,rgba(10,11,12,0.85) 100%); pointer-events: none; z-index: 5;`,Ca=n.div`position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 25px 20px 0; display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; }`,Ma=n.button`display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; position: relative; z-index: 25;`,Ta=n.div`border-radius: 50%; padding: 2.5px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; &.unseen { background: conic-gradient(rgba(255,255,255,0.85) 0deg,rgba(200,200,200,0.5) 90deg,rgba(255,255,255,0.85) 180deg,rgba(200,200,200,0.5) 270deg,rgba(255,255,255,0.85) 360deg); box-shadow: 0 0 14px rgba(255,255,255,0.15),0 8px 24px rgba(0,0,0,0.6); animation: ${qt} 2.8s ease-in-out infinite, ${Pt} 3.2s ease-in-out infinite; } &.seen { background: rgba(255,255,255,0.18); box-shadow: 0 6px 20px rgba(0,0,0,0.5); } &:hover { transform: scale(1.06); }`,Aa=n.div`width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid #0a0b0c; background: #1a1b1c; & img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.88); transition: filter 0.3s, transform 0.4s; } &:hover img { filter: brightness(1.05); transform: scale(1.1); }`,Ea=n.span`font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); text-align: center; max-width: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`,Ba=n.div`position: absolute; bottom: 40px; left: 25px; z-index: 10; animation: ${Le} 1.2s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`,Pa=n.div`font-size: 9px; font-weight: 600; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 10px;`,qa=n.h2`font-family: 'Fraunces',serif; font-weight: 300; font-size: 30px; line-height: 1.05; color: #fff; letter-spacing: -0.02em; margin: 0; transition: opacity 0.4s ease, transform 0.4s ease; opacity: ${t=>t.fading?0:1}; transform: ${t=>t.fading?"translateY(15px)":"translateY(0)"}; & em { font-style: italic; font-weight: 300; color: rgba(255,255,255,0.65); }`,Ra=n.div`position: absolute; bottom: 40px; right: 25px; z-index: 10; text-align: right; animation: ${Le} 1.4s cubic-bezier(0.16,1,0.3,1); pointer-events: none;`,Ia=n.div`font-family: 'Fraunces',serif; font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.4); letter-spacing: 0.04em;`,La=n.div`font-size: 8px; font-weight: 500; letter-spacing: 0.28em; color: rgba(255,255,255,0.2); text-transform: uppercase; margin-top: 4px;`,Da=[{num:"01",title:"Body Admission",desc:"Respectful reception & formal registration of the deceased",magenta:!1,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3"}),(0,e.jsx)("path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}),(0,e.jsx)("path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"})]})},{num:"02",title:"Body Release",desc:"Dignified coordination of the final departure",magenta:!0,icon:(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,e.jsx)("path",{d:"m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"})})},{num:"03",title:"Flower Arrangements",desc:"Bespoke floral tributes, wreaths & memorial displays",magenta:!1,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"}),(0,e.jsx)("circle",{cx:"12",cy:"8",r:"2"}),(0,e.jsx)("path",{d:"M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5"})]})},{num:"04",title:"Postmortem Records",desc:"Secure access to medical documentation & reports",magenta:!0,icon:(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"}),(0,e.jsx)("path",{d:"M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8"})]})}],ae=[{img:"https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240",title:(0,e.jsxs)(e.Fragment,{children:["Mixed Rose &",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Baby Breath Heart"})]}),label:"Heart"},{img:"https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000",title:(0,e.jsxs)(e.Fragment,{children:["Wreaths & Cross",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"on Stand"})]}),label:"Cross"},{img:"https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw",title:(0,e.jsxs)(e.Fragment,{children:["Elegant",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Floral Spray"})]}),label:"Spray"},{img:"https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240",title:(0,e.jsxs)(e.Fragment,{children:["The Eternal",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Embrace"})]}),label:"Embrace"}],Oa=[{value:"100%",label:"Paperless workflow"},{value:"24/7",label:"Uptime & support"},{value:"100%",label:"Encrypted & secure"}];function Wa(){const[t,a]=(0,p.useState)(0),[l,o]=(0,p.useState)(!1),[i,d]=(0,p.useState)(0),[h,c]=(0,p.useState)(!1),g=Y(),f=["families","memories","legacies","communities"],v=s=>{s!==i&&(c(!0),setTimeout(()=>{d(s),c(!1)},380))};return(0,p.useEffect)(()=>{const s=setInterval(()=>{a(m=>(m+1)%f.length)},2500),u=setInterval(()=>{o(m=>!m)},6e3);return()=>{clearInterval(s),clearInterval(u)}},[]),(0,p.useEffect)(()=>{let s;const u=setInterval(()=>{c(!0),s=setTimeout(()=>{d(m=>(m+1)%ae.length),c(!1)},380)},4e3);return()=>{clearInterval(u),clearTimeout(s)}},[]),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(St,{}),(0,e.jsxs)(Rt,{children:[(0,e.jsx)(It,{}),(0,e.jsx)(Lt,{}),(0,e.jsx)(Dt,{children:(0,e.jsxs)(Ot,{children:[(0,e.jsxs)(Wt,{children:[(0,e.jsxs)(Yt,{children:["The modern standard",(0,e.jsxs)(Ht,{children:["for the ",(0,e.jsx)(Gt,{children:f[t]},t)]}),"you serve."]}),(0,e.jsx)(Jt,{children:"Rest Point brings high end technology to the death care industry. Hand families a tablet at the front desk to manage admissions, releases, and florals  everything syncing instantly to your dashboard."}),(0,e.jsxs)(_t,{children:[(0,e.jsxs)(Ut,{onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),g("/register")},children:["Request Access",(0,e.jsx)(Oe,{children:(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:(0,e.jsx)("path",{d:"M5 12h14M12 5l7 7-7 7"})})})]}),(0,e.jsx)(Kt,{onClick:()=>{window.scrollTo({top:0,behavior:"smooth"}),g("/login")},children:"View Portal"})]}),(0,e.jsx)(Xt,{children:Oa.map((s,u)=>(0,e.jsxs)(Vt,{children:[(0,e.jsx)(Qt,{children:s.value}),(0,e.jsx)(Zt,{children:s.label})]},u))})]}),(0,e.jsx)(ea,{children:(0,e.jsx)(ra,{children:(0,e.jsx)(ta,{children:(0,e.jsx)(aa,{children:(0,e.jsxs)(ia,{isFlipped:l,children:[(0,e.jsx)($e,{className:"front",children:(0,e.jsx)(Se,{children:(0,e.jsx)(Ce,{children:(0,e.jsxs)(na,{children:[(0,e.jsxs)(oa,{children:[(0,e.jsx)("div",{style:{width:"40px"}}),(0,e.jsxs)(sa,{children:[(0,e.jsx)(la,{children:"Rest Point"}),(0,e.jsx)(da,{}),(0,e.jsx)(ca,{children:"Reception Portal"})]}),(0,e.jsxs)(ma,{children:[(0,e.jsx)(pa,{}),(0,e.jsx)(ga,{children:"Online"})]})]}),(0,e.jsxs)(ha,{children:[(0,e.jsx)(fa,{children:"Good morning"}),(0,e.jsx)(xa,{children:"Welcome back."})]}),(0,e.jsxs)(ua,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(Me,{children:"Services"}),(0,e.jsx)(ba,{children:"Select to Begin"})]}),(0,e.jsxs)(Me,{style:{display:"flex",alignItems:"center",gap:"4px",color:B},children:[(0,e.jsx)("svg",{width:"10",height:"10",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:(0,e.jsx)("path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"})}),"4 Available"]})]}),(0,e.jsx)(va,{children:Da.map((s,u)=>(0,e.jsxs)(ya,{className:s.magenta?"magenta":"",children:[(0,e.jsx)(te,{className:`${s.magenta?"magenta":""} tl`}),(0,e.jsx)(te,{className:`${s.magenta?"magenta":""} tr`}),(0,e.jsx)(te,{className:`${s.magenta?"magenta":""} bl`}),(0,e.jsx)(te,{className:`${s.magenta?"magenta":""} br`}),(0,e.jsx)(ja,{children:s.num}),(0,e.jsx)(wa,{className:s.magenta?"magenta":"",children:s.icon}),(0,e.jsx)(ka,{children:s.title}),(0,e.jsx)(Fa,{children:s.desc}),(0,e.jsxs)(za,{className:s.magenta?"magenta":"",children:["Continue",(0,e.jsx)("svg",{width:"8",height:"8",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:(0,e.jsx)("path",{d:"M7 7h10v10M7 17L17 7"})})]})]},u))})]})})})}),(0,e.jsx)($e,{className:"back",children:(0,e.jsx)(Se,{children:(0,e.jsx)(Ce,{children:(0,e.jsxs)(Na,{children:[(0,e.jsx)($a,{src:ae[i].img,alt:"Floral Tribute",fading:h?1:0}),(0,e.jsx)(Sa,{}),(0,e.jsx)(Ca,{children:ae.map((s,u)=>(0,e.jsxs)(Ma,{onClick:()=>v(u),children:[(0,e.jsx)(Ta,{className:u===i?"unseen":"seen",children:(0,e.jsx)(Aa,{children:(0,e.jsx)("img",{src:s.img,alt:s.label})})}),(0,e.jsx)(Ea,{children:s.label})]},u))}),(0,e.jsxs)(Ba,{children:[(0,e.jsx)(Pa,{children:"Floral Tributes"}),(0,e.jsx)(qa,{fading:h?1:0,children:ae[i].title})]}),(0,e.jsxs)(Ra,{children:[(0,e.jsx)(Ia,{children:"Memorial Florals"}),(0,e.jsx)(La,{children:"Est. since care began"})]})]})})})})]})})})})})]})})]})]})}var Ya=()=>{const t=(0,p.useRef)(null),[a,l]=(0,p.useState)(!1);return(0,p.useEffect)(()=>{const o=t.current;if(!o)return;const i=new IntersectionObserver(([d])=>{d.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(o),()=>i.disconnect()},[]),[t,a]},Ha=({children:t,className:a="",style:l={},delay:o=0})=>{const[i,d]=Ya();return(0,e.jsx)("div",{ref:i,className:a,style:{opacity:d?1:0,transform:d?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${o}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${o}ms`,...l},children:t})},ie=[{tag:"The Premium Tablet Portal Experience",accent:"#C26B5A",items:[{q:"How does the tablet portal elevate the front desk experience?",a:"Instead of tethering your reception staff to a desktop computer, our portal runs seamlessly on sleek iPads or high-end tablets. Your front desk becomes mobile and graceful. Staff can greet families at the door, walk them to a comfortable seating area, and manage check-ins, floral bookings, and coordination directly from the tablet. It feels less like a transaction and more like a high-end concierge service."}]},{tag:"Digital Intake & Release",accent:"#5A7A6B",items:[{q:"How does the digital intake process work for families?",a:"We've replaced stressful clipboards and intrusive kiosks with a dignified, guided tablet experience. When a family arrives, they are handed an iPad or directed to a private tablet station. The portal walks them through the deceased intake process with a respectful, calming user interface. The data automatically and securely routes to the director's dashboard, eliminating manual data entry."},{q:"What about the release process? Can that be handled digitally too?",a:"Absolutely. The digital release module allows authorized individuals (family members, crematories, or cemeteries) to securely sign digital release forms directly on the tablet. The system captures their digital signature, timestamps the release, and instantly updates the deceased's file, ensuring a fully compliant, paperless chain of custody without needing a physical front-desk terminal."}]},{tag:"Cloud Infrastructure & 24/7 Uptime",accent:"#5E7C9A",items:[{q:"Is the portal cloud-based, and what happens if our funeral home loses internet connection?",a:"Yes, our software is 100% cloud-based, meaning your data is stored securely off-site and can be accessed from any authorized iPad or tablet, anywhere. We utilize advanced local caching, meaning if your internet briefly drops, your tablets can still view critical data and continue intake; it will simply sync to the cloud the moment the connection is restored."},{q:"Can we really guarantee 24/7 uptime with zero downtime?",a:"Yes. We pride ourselves on a 24/7/365 Uptime Guarantee. Our infrastructure utilizes multi-server redundancy and automatic failover protocols. If one server experiences an issue, another instantly takes over. This means zero downtime for your funeral home, ensuring your portals are always ready to serve families, day or night."}]},{tag:"Security & Compliance",accent:"#A3875A",items:[{q:"How do you ensure the highest standards of security for sensitive data on a tablet?",a:"We employ enterprise-grade security protocols. All data is encrypted both in transit (using 256-bit SSL) and at rest. We are fully compliant with industry privacy standards. Furthermore, our system uses role-based access control, meaning staff only see the data necessary for their specific role."},{q:"Could a family using a tablet accidentally see another family's data?",a:'Never. The Family Portal operates in a highly secure, locked "Guided Access" mode. A family member can only see their own intake or release forms. Once a transaction is complete or the screen times out, it automatically wipes the session and returns to the elegant welcoming screen (like the candle-lighting screen), protecting all previous data.'}]}],Ga=()=>{const t=Y(),[a,l]=(0,p.useState)("0-0"),o=i=>l(d=>d===i?null:i);return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{children:`
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
      `}),(0,e.jsx)("section",{id:"faq",className:"faq-section",children:(0,e.jsxs)("div",{className:"faq-container",children:[(0,e.jsxs)(Ha,{className:"faq-sidebar",children:[(0,e.jsx)("div",{className:"faq-eyebrow",children:"Support Center"}),(0,e.jsxs)("h2",{className:"faq-title",children:["Frequently Asked ",(0,e.jsx)("span",{children:"Questions"})]}),(0,e.jsx)("p",{className:"faq-lead",children:"Everything front-desk teams and funeral directors ask before bringing the premium tablet portal experience to their funeral home."}),(0,e.jsx)("div",{className:"faq-mobile-hero",children:ie[0]?.items[0]&&(()=>{const i=ie[0].items[0];return(0,e.jsxs)("div",{className:"faq-item open",children:[(0,e.jsxs)("button",{type:"button",className:"faq-q faq-q-hero",onClick:()=>o("0-0"),"aria-expanded":a==="0-0",children:[(0,e.jsx)("span",{className:"faq-q-text",children:i.q}),(0,e.jsx)("span",{className:"faq-q-icon"})]}),(0,e.jsx)("div",{className:"faq-answer",role:"region",children:(0,e.jsx)("div",{className:"faq-answer-inner",children:(0,e.jsx)("p",{className:"faq-a-text",children:i.a})})})]})})()}),(0,e.jsx)("nav",{className:"faq-nav","aria-label":"FAQ categories",children:ie.map((i,d)=>(0,e.jsxs)("a",{href:`#faq-cat-${d}`,className:"faq-nav-item",style:{"--faq-accent":i.accent},children:[(0,e.jsx)("span",{className:"faq-nav-dot",style:{background:i.accent}}),(0,e.jsx)("span",{children:i.tag})]},d))}),(0,e.jsxs)("div",{className:"faq-support",children:[(0,e.jsx)("div",{className:"faq-support-icon",children:(0,e.jsx)(Ke,{size:24,color:"#FFFFFF"})}),(0,e.jsx)("h4",{className:"faq-support-title",children:"Still have a question?"}),(0,e.jsx)("p",{className:"faq-support-desc",children:"Our team is one message away and happy to walk you through a live demo on your own tablets."}),(0,e.jsxs)("button",{className:"faq-support-btn",type:"button",onClick:()=>t("/contact"),children:["Talk to our team ",(0,e.jsx)(de,{size:14})]})]})]}),(0,e.jsx)("div",{className:"faq-list",children:ie.map((i,d)=>{const h=`faq-cat-${d}`;return(0,e.jsxs)("div",{id:h,className:"faq-cat",style:{"--faq-accent":i.accent},children:[(0,e.jsxs)("div",{className:"faq-cat-head",children:[(0,e.jsx)("span",{className:"faq-cat-line"}),(0,e.jsx)("h3",{className:"faq-cat-title",children:i.tag})]}),(0,e.jsx)("div",{className:"faq-items",children:i.items.map((c,g)=>{const f=`${d}-${g}`,v=a===f;return(0,e.jsxs)("div",{className:`faq-item${v?" open":""}`,children:[(0,e.jsxs)("button",{type:"button",className:"faq-q",onClick:()=>o(f),"aria-expanded":v,"aria-controls":`faq-a-${f}`,children:[(0,e.jsx)("span",{className:"faq-q-text",children:c.q}),(0,e.jsx)("span",{className:"faq-q-icon"})]}),(0,e.jsx)("div",{id:`faq-a-${f}`,className:"faq-answer",role:"region",children:(0,e.jsx)("div",{className:"faq-answer-inner",children:(0,e.jsx)("p",{className:"faq-a-text",children:c.a})})})]},f)})})]},d)})})]})})]})},Ja=K`
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
`;function _a(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Ja,{}),(0,e.jsx)("section",{className:"mission-section",children:(0,e.jsxs)("div",{className:"mission-container",children:[(0,e.jsxs)("div",{className:"mission-text",children:[(0,e.jsx)("div",{className:"mission-tag",children:"Our Mission"}),(0,e.jsxs)("h1",{className:"mission-title",children:["To make it easier to care for people when it ",(0,e.jsx)("em",{children:"matters most."})]}),(0,e.jsx)("p",{className:"mission-desc",children:"We give funeral homes and funeral insurers the technology to simplify operations, protect every detail, and deliver a better experience for the families they serve."}),(0,e.jsx)("div",{className:"mission-highlight",children:(0,e.jsxs)("p",{className:"highlight-text",children:[(0,e.jsx)("strong",{children:"Less complexity."})," More care."]})})]}),(0,e.jsxs)("div",{className:"mission-visual-wrap",children:[(0,e.jsx)("div",{className:"mission-image-box",children:(0,e.jsx)("img",{src:"/familyportal.png",alt:"A person thoughtfully using a digital tablet in a warm, modern space",className:"mission-image"})}),(0,e.jsxs)("div",{className:"portal-card",children:[(0,e.jsx)("span",{className:"portal-tag",children:"Rest Point Family Portal"}),(0,e.jsxs)("h3",{className:"portal-title",children:["Give Families a Digital Experience They'll ",(0,e.jsx)("em",{children:"Remember."})]}),(0,e.jsx)("p",{className:"portal-desc",children:"Take pride in offering an experience no one else provides. From transparent records to seamless communication, the Restpoint portal brings closure and clarity directly to the families you serve."}),(0,e.jsxs)(Ee,{to:"preview/reception-portal",className:"portal-cta",children:["Explore the Portal",(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M5 12h14"}),(0,e.jsx)("path",{d:"m12 5 7 7-7 7"})]})]})]})]})]})})]})}var q={name:"Margaret Anne Whitlock",born:1938,passed:2025,age:"eighty-seven"},Te=t=>t.trim().split(/\s+/)[0],Ua=t=>(t=t.trim(),/s$/i.test(t)?t+"’":t+"’s");function Ka(){const t=(0,p.useRef)(null),[a,l]=(0,p.useState)(!1);return(0,p.useEffect)(()=>{const o=t.current;if(!o)return;const i=new IntersectionObserver(([d])=>{d.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(o),()=>i.disconnect()},[]),[t,a]}var z=({children:t,delay:a=0,style:l={}})=>{const[o,i]=Ka();return(0,e.jsx)("div",{ref:o,style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(26px)",transition:`opacity 0.9s cubic-bezier(0.22,0.7,0.25,1) ${a}ms, transform 0.9s cubic-bezier(0.22,0.7,0.25,1) ${a}ms`,...l},children:t})},Xa=K`
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
`,D=Math.PI*2,W=300,_=430,F=150,ne=372,le=226,R=(t,a,l,o,i)=>{t.beginPath(),t.ellipse(a,l,o,i,0,0,D)};function fe(t,a,l,o,i){t.beginPath(),t.moveTo(a-i/2,l),t.quadraticCurveTo(a-i/2,l+o*.72,a,l+o),t.quadraticCurveTo(a+i/2,l+o*.72,a+i/2,l),t.quadraticCurveTo(a,l+2.5,a-i/2,l),t.fill()}function Va(t,a,l){const o=document.createElement("canvas");o.width=t,o.height=a;const i=o.getContext("2d");i.setTransform(l,0,0,l,0,0),i.fillStyle="#221a10",R(i,F,375,80,14),i.fill(),i.strokeStyle="rgba(190,146,80,.55)",i.lineWidth=1.6,R(i,F,375,80,14),i.stroke(),i.fillStyle="#120d07",R(i,F,373,70,10.5),i.fill(),i.fillStyle="rgba(0,0,0,.6)",R(i,F,371,46,7),i.fill();const d=i.createLinearGradient(107,0,193,0);return d.addColorStop(0,"#c9b48d"),d.addColorStop(.16,"#ecdcb9"),d.addColorStop(.5,"#f6ebd1"),d.addColorStop(.84,"#e3d0a9"),d.addColorStop(1,"#bda87f"),i.fillStyle=d,i.beginPath(),i.moveTo(107,246),i.lineTo(107,366),i.quadraticCurveTo(107,ne,113,ne),i.lineTo(187,ne),i.quadraticCurveTo(193,ne,193,366),i.lineTo(193,245),i.bezierCurveTo(183,240,174,249,156,241),i.bezierCurveTo(144,235,128,248,109,241),i.closePath(),i.fill(),fe(i,117,241,20,7),fe(i,180,240,12,6),fe(i,140,243,8,5),i.fillStyle="#dcc79d",R(i,F,242,37,4.5),i.fill(),i.fillStyle="#c8b184",R(i,F,242.5,30,3),i.fill(),o}function Qa(t,a){const l=F+a*4,o=le;t.strokeStyle="#33261a",t.lineWidth=3,t.lineCap="round",t.beginPath(),t.moveTo(F,242),t.quadraticCurveTo(F+a*2,234,l,o),t.stroke(),t.fillStyle="#171008",t.beginPath(),t.arc(l,o,2.4,0,D),t.fill()}var Za=t=>(Math.sin(t*6.3)+.6*Math.sin(t*11.1+1.7)+.35*Math.sin(t*19.3+.6)+.5*Math.sin(t*1.7+3))/2.45;function ei(t,a,l,o){const i=a.scl;t.setTransform(i,0,0,i,0,0),t.clearRect(0,0,W,_);const d=Za(l)*o,h=(a.wind+Math.sin(l*.7)*.12+Math.sin(l*1.9+2)*.07)*o,c=F+h*4,g=(64+a.pulse*26)*(.2+.8*a.ig)*(1+.055*d-.16*Math.min(1,Math.abs(a.wind))),f=h*15+d*2.4,v=228,s=c+f*.55,u=228-g;if(a.lastTip={x:s,y:u},t.globalAlpha=.1+.9*a.ig,t.drawImage(a.staticLayer,0,0,W,_),t.globalAlpha=1,Qa(t,h),t.globalCompositeOperation="lighter",a.ig>.02){let m=t.createRadialGradient(c,v-g*.45,0,c,v-g*.45,300);m.addColorStop(0,`rgba(255,166,70,${.075*a.ig})`),m.addColorStop(1,"rgba(255,166,70,0)"),t.fillStyle=m,t.fillRect(0,0,W,_);const x=c+f*.4,b=v-g*.4,w=95+d*9+a.pulse*30;m=t.createRadialGradient(x,b,0,x,b,w),m.addColorStop(0,`rgba(255,176,84,${.3*a.ig})`),m.addColorStop(.5,`rgba(255,140,50,${.1*a.ig})`),m.addColorStop(1,"rgba(255,120,40,0)"),t.fillStyle=m,t.beginPath(),t.arc(x,b,w,0,D),t.fill(),t.beginPath(),t.moveTo(c-7.5,v),t.bezierCurveTo(c-9.5+f*.25,v-g*.42,s-5,v-g*.68,s,u),t.bezierCurveTo(s+5,v-g*.66,c+9.5+f*.25,v-g*.4,c+7.5,v),t.quadraticCurveTo(c,234,c-7.5,v);let j=t.createLinearGradient(0,232,0,u);j.addColorStop(0,`rgba(255,200,120,${.9*a.ig})`),j.addColorStop(.35,`rgba(255,158,54,${.85*a.ig})`),j.addColorStop(.75,`rgba(255,105,25,${.45*a.ig})`),j.addColorStop(1,"rgba(255,70,10,0)"),t.fillStyle=j,t.fill();const S=g*.55,C=c+f*.75,P=v-S;t.beginPath(),t.moveTo(c-4.6,v),t.bezierCurveTo(c-5.8+f*.2,v-S*.5,C-2.6,v-S*.75,C,P),t.bezierCurveTo(C+2.6,v-S*.73,c+5.8+f*.2,v-S*.48,c+4.6,v),t.quadraticCurveTo(c,232,c-4.6,v);let M=t.createLinearGradient(0,230,0,P);if(M.addColorStop(0,`rgba(255,248,225,${.95*a.ig})`),M.addColorStop(.55,`rgba(255,220,150,${.55*a.ig})`),M.addColorStop(1,"rgba(255,190,90,0)"),t.fillStyle=M,t.fill(),a.ig<.35){const ue=(2.5+a.ig*14)*3,V=t.createRadialGradient(c,le,0,c,le,ue);V.addColorStop(0,"rgba(255,190,90,.95)"),V.addColorStop(.4,"rgba(255,110,25,.5)"),V.addColorStop(1,"rgba(255,60,0,0)"),t.fillStyle=V,t.beginPath(),t.arc(c,le,ue,0,D),t.fill()}!a.RM&&a.ig>.85&&Math.random()<.012+Math.abs(a.wind)*.1+a.pulse*.2&&a.embers.length<26&&a.embers.push({x:s+(Math.random()-.5)*6,y:u+8,vx:(Math.random()-.5)*.3,vy:-(.45+Math.random()*.6),life:1,dk:.006+Math.random()*.008,seed:Math.random()*10})}for(let m=a.embers.length-1;m>=0;m--){const x=a.embers[m];if(x.x+=x.vx+Math.sin(x.life*9+x.seed)*.35+a.wind*.5,x.y+=x.vy,x.vy*=.995,x.life-=x.dk,x.life<=0){a.embers.splice(m,1);continue}const b=x.life*x.life;t.fillStyle=`rgba(255,140,50,${.2*b})`,t.beginPath(),t.arc(x.x,x.y,3.2*x.life+1,0,D),t.fill(),t.fillStyle=`rgba(255,214,140,${.9*b})`,t.beginPath(),t.arc(x.x,x.y,1.5*x.life+.4,0,D),t.fill()}t.globalCompositeOperation="source-over"}function ri(){const[t,a]=(0,p.useState)("typical"),[l,o]=(0,p.useState)(0),[i,d]=(0,p.useState)(0),h=(0,p.useRef)(null),c=(0,p.useRef)({ig:0,igT:0,wind:0,windT:0,pulse:0,embers:[],lastTip:{x:F,y:166},lastPX:null,scl:1,staticLayer:null,t0:0,raf:null,RM:typeof window<"u"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}),g=(0,p.useCallback)(()=>{const m=h.current,x=c.current;if(!m)return;const b=Math.min(window.devicePixelRatio||1,2),w=m.getBoundingClientRect();w.width&&(m.width=Math.round(w.width*b),m.height=Math.round(w.width*b*_/W),x.scl=m.width/W,x.staticLayer=Va(m.width,m.height,x.scl))},[]);(0,p.useEffect)(()=>{if(t!=="ours")return;const m=h.current;if(!m)return;const x=m.getContext("2d"),b=c.current,w=b.RM?.25:1;b.ig=0,b.igT=0,b.embers=[],d(0),g(),b.t0||(b.t0=performance.now());const j=P=>{const M=(P-b.t0)/1e3;b.ig+=(b.igT-b.ig)*(b.RM?.15:.028),b.windT=Math.max(-2.4,Math.min(2.4,b.windT))*.9,b.wind+=(b.windT-b.wind)*.1,b.pulse*=.94,ei(x,b,M,w),b.raf=requestAnimationFrame(j)};b.raf=requestAnimationFrame(j);const S=[setTimeout(()=>{b.igT=1},450),...[650,1e3,1350,1800].map((P,M)=>setTimeout(()=>d(M+1),P))],C=()=>g();return window.addEventListener("resize",C),()=>{cancelAnimationFrame(b.raf),S.forEach(clearTimeout),window.removeEventListener("resize",C)}},[t,l,g]);const f=m=>{a(m),m==="ours"&&o(x=>x+1)},v=m=>{const x=c.current,b=h.current;if(!b||x.ig<.3)return;const w=b.getBoundingClientRect(),j=(m.clientX-w.left)/w.width*W,S=(m.clientY-w.top)/w.height*_;if(x.lastPX!==null){const C=Math.hypot(j-F,S-196);C<190&&(x.windT+=(m.clientX-x.lastPX)*.012*(1-C/190))}x.lastPX=m.clientX},s=()=>{c.current.lastPX=null},u=()=>{const m=c.current;if(!(m.ig<.4)){m.pulse=Math.min(1.3,m.pulse+.9);for(let x=0;x<7&&m.embers.length<30;x++)m.embers.push({x:m.lastTip.x+(Math.random()-.5)*8,y:m.lastTip.y+10,vx:(Math.random()-.5)*.8,vy:-(.7+Math.random()*.9),life:1,dk:.008+Math.random()*.01,seed:Math.random()*10})}};return(0,e.jsxs)("section",{className:"dm-section",id:"directors",children:[(0,e.jsx)(Xa,{}),(0,e.jsxs)("div",{className:"dm-wrap",children:[(0,e.jsx)(z,{children:(0,e.jsx)("p",{className:"dm-kicker",children:"For Funeral Directors"})}),(0,e.jsx)(z,{delay:90,children:(0,e.jsxs)("h2",{className:"dm-title",children:["The last screen a family sees shouldn't feel like ",(0,e.jsx)("em",{children:"a receipt."})]})}),(0,e.jsx)(z,{delay:150,children:(0,e.jsx)("p",{className:"dm-sub",children:"When a registration is complete, grief is at its loudest. Every other system answers that moment with a green tick. Yours answers it with a candle. Flip the switch below and watch what a family feels when it's your firm on the other side of the screen."})}),(0,e.jsx)(z,{delay:220,children:(0,e.jsxs)("div",{className:"dm-stage",children:[(0,e.jsxs)("div",{className:"dm-seg",role:"group","aria-label":"Compare the two experiences",children:[(0,e.jsx)("button",{type:"button",className:`dm-segbtn${t==="typical"?" on":""}`,"aria-pressed":t==="typical",onClick:()=>f("typical"),children:"Typical software"}),(0,e.jsx)("button",{type:"button",className:`dm-segbtn${t==="ours"?" on":""}`,"aria-pressed":t==="ours",onClick:()=>f("ours"),children:"With  RestPoint software"})]}),(0,e.jsxs)("div",{className:"dm-browser",children:[(0,e.jsxs)("div",{className:"dm-chrome",children:[(0,e.jsxs)("span",{className:"dm-dots","aria-hidden":"true",children:[(0,e.jsx)("i",{}),(0,e.jsx)("i",{}),(0,e.jsx)("i",{})]}),(0,e.jsx)("span",{className:"dm-url",children:t==="typical"?"funeralhome.com/registration — submitted":`funeralhome.com/in-memory-of-${Te(q.name).toLowerCase()}`})]}),(0,e.jsx)("div",{className:"dm-screen",children:t==="typical"?(0,e.jsx)("div",{className:"dm-pane dm-typical",children:(0,e.jsxs)("div",{className:"dm-tcard",children:[(0,e.jsx)("div",{className:"dm-tcheck","aria-hidden":"true",children:(0,e.jsx)("svg",{viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M5 12.5 10 17.5 19 7"})})}),(0,e.jsx)("h4",{children:"Registration successful"}),(0,e.jsx)("p",{children:"Your form has been submitted. Please do not reply to this message. A representative may contact you in 3–5 business days."}),(0,e.jsx)("p",{className:"dm-tref",children:"Reference: #SB-2026-01147 · 12:22 PM"}),(0,e.jsx)("span",{className:"dm-tbtn",children:"Print this page"}),(0,e.jsx)("p",{className:"dm-tpowered",children:"Powered by GenericForms v2.3"})]})}):(0,e.jsxs)("div",{className:"dm-pane dm-ours",onPointerMove:v,onPointerLeave:s,children:[(0,e.jsx)("canvas",{ref:h,className:"dm-candle",width:300,height:430,role:"img","aria-label":"A candle lit in memory",onPointerDown:u}),(0,e.jsx)("p",{className:`dm-oeyebrow dm-orv${i>=1?" in":""}`,children:"The register is signed"}),(0,e.jsx)("h4",{className:`dm-oname dm-orv${i>=2?" in":""}`,children:q.name}),(0,e.jsxs)("p",{className:`dm-odates dm-orv${i>=3?" in":""}`,children:[q.born," — ",q.passed,"  ·  ",q.age," years"]}),(0,e.jsxs)("p",{className:`domsg dm-orv${i>=4?" in":""}`,children:[Ua(Te(q.name))," story is now in our care."]})]})})]}),(0,e.jsxs)("div",{className:"dm-under",children:[(0,e.jsx)("p",{className:"dm-note",children:"This is the real thing live code, running in your browser right now. Try moving your cursor near the flame."}),t==="ours"&&(0,e.jsxs)("button",{type:"button",className:"dm-replay",onClick:()=>o(m=>m+1),children:[(0,e.jsx)("svg",{viewBox:"0 0 16 16",children:(0,e.jsx)("path",{d:"M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"})}),"Light it again"]})]})]})}),(0,e.jsxs)("div",{className:"dm-points",children:[(0,e.jsx)(z,{children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsxs)("svg",{viewBox:"0 0 20 20",children:[(0,e.jsx)("circle",{cx:"10",cy:"10",r:"7.5"}),(0,e.jsx)("path",{d:"M7 10.2 9.2 12.4 13.2 7.6"})]}),(0,e.jsx)("h5",{children:"Fully white label"}),(0,e.jsx)("p",{children:"Your firm's name, your colours, your words. The family only ever sees you  never us, never a vendor logo."})]})}),(0,e.jsx)(z,{delay:110,children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M8 12 12 8M7.5 9.5 5.4 11.6a3.2 3.2 0 0 0 4.5 4.5l2.1-2.1M12.5 10.5l2.1-2.1a3.2 3.2 0 0 0-4.5-4.5L8 6"})}),(0,e.jsx)("h5",{children:"Plugs into what you already use"}),(0,e.jsx)("p",{children:"Your existing form passes the name and dates through a simple link. No migration, no retraining, live the same day."})]})}),(0,e.jsx)(z,{delay:220,children:(0,e.jsxs)("div",{className:"dm-pt",children:[(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M10 17S3.5 12.8 3.5 8.2C3.5 5.9 5.3 4 7.6 4c1 0 1.9.4 2.4 1.1C10.5 4.4 11.4 4 12.4 4c2.3 0 4.1 1.9 4.1 4.2C16.5 12.8 10 17 10 17z"})}),(0,e.jsx)("h5",{children:"Nothing for families to do"}),(0,e.jsx)("p",{children:"No buttons to find, no text to read, no next steps. The page simply keeps the light on   and that's the point."})]})})]}),(0,e.jsxs)("div",{className:"dm-cta",children:[(0,e.jsx)(z,{children:(0,e.jsxs)("a",{className:"dm-btn dm-solid",href:"mailto:hello@restpoint.co.ke?subject=Walkthrough%20—%20the%20confirmation%20moment",children:["Book a 15-minute walkthrough",(0,e.jsx)("svg",{viewBox:"0 0 16 16",children:(0,e.jsx)("path",{d:"M2.5 8h10.5M9 3.8 13.2 8 9 12.2"})})]})}),(0,e.jsx)(z,{delay:110,children:(0,e.jsx)(Ee,{className:"dm-btn dm-ghost",to:"/memorial",children:"Open the live memorial experience"})})]}),(0,e.jsx)(z,{delay:150,children:(0,e.jsxs)("p",{className:"dm-closer",children:["Families don't compare feature lists. They remember ",(0,e.jsx)("b",{children:"how they were treated"})," — and they tell that story at every gathering for the next year."]})})]})]})}function ti(){const t=(0,p.useRef)(null),[a,l]=(0,p.useState)(!1);return(0,p.useEffect)(()=>{const o=t.current;if(!o)return;const i=new IntersectionObserver(([d])=>{d.isIntersecting&&(l(!0),i.disconnect())},{threshold:.08});return i.observe(o),()=>i.disconnect()},[]),[t,a]}var L=({children:t,delay:a=0,style:l={},className:o=""})=>{const[i,d]=ti();return(0,e.jsx)("div",{ref:i,className:o,style:{opacity:d?1:0,transform:d?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${a}ms`,...l},children:t})},I=({title:t,children:a,dark:l=!1})=>(0,e.jsxs)("div",{className:`app-window ${l?"dark":"light"}`,children:[(0,e.jsxs)("div",{className:"window-header",children:[(0,e.jsxs)("div",{style:{display:"flex",gap:"0.4rem"},children:[(0,e.jsx)("span",{className:"window-dot",style:{background:"#FF5F57"}}),(0,e.jsx)("span",{className:"window-dot",style:{background:"#FEBC2E"}}),(0,e.jsx)("span",{className:"window-dot",style:{background:"#28C840"}})]}),(0,e.jsx)("span",{className:"window-title",children:t}),(0,e.jsx)("div",{style:{width:"40px"}})]}),(0,e.jsx)("div",{className:"window-body",children:a})]}),ai=({items:t,speed:a=35})=>(0,e.jsx)("div",{className:"marquee-strip",children:(0,e.jsx)("div",{className:"marquee-track",style:{animationDuration:`${a}s`},children:[...t,...t,...t,...t].map((l,o)=>(0,e.jsxs)("span",{className:"marquee-item",children:[(0,e.jsx)("span",{className:"marquee-dot"}),l]},o))})}),ii=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.verdigris},children:"CASE FILE"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:r.ink,marginTop:"0.3rem"},children:"Otieno, J."})]}),(0,e.jsx)("div",{className:"avatar",style:{background:r.verdigris},children:"JO"})]}),(0,e.jsxs)("div",{className:"mock-list-header",children:[(0,e.jsx)("span",{children:"Document Name"}),(0,e.jsx)("span",{children:"Status"})]}),[{n:"Death certificate.pdf",c:r.verdigris,s:"verified"},{n:"Burial permit.pdf",c:r.brass,s:"pending"},{n:"Police abstract.pdf",c:r.accent,s:"missing"}].map((t,a)=>(0,e.jsxs)("div",{className:"mock-row",style:{borderBottom:a<2?`1px solid ${r.line}`:"none"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.8rem"},children:[(0,e.jsx)("div",{className:"file-icon",children:(0,e.jsx)(U,{size:16,color:t.c})}),(0,e.jsx)("span",{style:{color:r.ink},children:t.n})]}),(0,e.jsx)("span",{className:`status-badge ${t.s}`,children:t.s.charAt(0).toUpperCase()+t.s.slice(1)})]},a))]}),ni=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.verdigris},children:"MWANGI FAMILY"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:r.ink,marginTop:"0.3rem"},children:"Arrangements confirmed"})]}),(0,e.jsxs)("div",{className:"mock-row",children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.8rem"},children:[(0,e.jsx)("div",{className:"file-icon",children:(0,e.jsx)(U,{size:16,color:r.brass})}),(0,e.jsx)("span",{style:{color:r.ink},children:"Burial permit.pdf"})]}),(0,e.jsx)("button",{className:"action-btn",children:(0,e.jsx)(rr,{size:14})})]}),(0,e.jsxs)("div",{className:"mock-row",children:[(0,e.jsx)("span",{style:{color:r.ink,fontSize:"0.9rem"},children:"Service invoice"}),(0,e.jsx)("span",{className:"status-badge neutral",children:"KES 84,000"})]}),(0,e.jsxs)("div",{className:"mock-row",style:{borderBottom:"none"},children:[(0,e.jsx)("span",{style:{color:r.ink,fontSize:"0.9rem",fontWeight:600},children:"Outstanding balance"}),(0,e.jsx)("button",{className:"pay-btn",children:"Pay KES 12,500"})]})]}),oi=()=>{const[t,a]=(0,p.useState)(38),[l,o]=(0,p.useState)(195);return(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.brassLight},children:"SMART DISPATCH"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:r.bone,marginTop:"0.3rem"},children:"Route Optimization"})]}),(0,e.jsxs)("div",{className:"map-visual",children:[(0,e.jsx)("div",{className:"map-pin",children:(0,e.jsx)(be,{size:16,color:r.bone})}),(0,e.jsx)("div",{className:"map-line"}),(0,e.jsx)("div",{className:"map-pin",style:{background:r.accent},children:(0,e.jsx)(be,{size:16,color:r.bone})}),(0,e.jsx)("div",{className:"map-truck",children:(0,e.jsx)(Pe,{size:20,color:r.brass})})]}),(0,e.jsxs)("div",{className:"slider-group",children:[(0,e.jsxs)("div",{className:"slider-row",children:[(0,e.jsx)("span",{children:"Distance (km)"}),(0,e.jsx)("span",{className:"slider-value",children:t})]}),(0,e.jsx)("input",{type:"range",min:"2",max:"120",value:t,onChange:i=>a(+i.target.value),className:"custom-range"})]}),(0,e.jsxs)("div",{className:"slider-group",children:[(0,e.jsxs)("div",{className:"slider-row",children:[(0,e.jsx)("span",{children:"Fuel rate (KES/L)"}),(0,e.jsx)("span",{className:"slider-value",children:l})]}),(0,e.jsx)("input",{type:"range",min:"150",max:"250",value:l,onChange:i=>o(+i.target.value),className:"custom-range"})]}),(0,e.jsxs)("div",{className:"dispatch-footer",children:[(0,e.jsx)("span",{children:"Auto billed Trip Cost"}),(0,e.jsxs)("span",{className:"cost-value",children:["KES ",Math.round(t*.12*l).toLocaleString()]})]})]})},si=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{marginBottom:"1.5rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.brassLight},children:"FLEET STATUS"}),(0,e.jsx)("div",{style:{fontSize:"1.4rem",fontFamily:"'Fraunces', serif",color:r.bone,marginTop:"0.3rem"},children:"Live Fleet Tracking"})]}),[{n:"Hearse 01 - Benz",p:"KDA 123A",bg:"rgba(61,79,71,0.3)",ic:r.bone,s:"available"},{n:"Hearse 02 - Toyota",p:"KDB 456B",bg:"rgba(199,123,94,0.2)",ic:r.accent,s:"dispatched"},{n:"Hearse 03 - Nissan",p:"KDC 789C",bg:"rgba(139,115,85,0.2)",ic:r.brass,s:"maintenance"}].map((t,a)=>(0,e.jsxs)("div",{className:"fleet-card",style:{borderBottom:a<2?`1px solid ${r.lineDark}`:"none"},children:[(0,e.jsxs)("div",{className:"fleet-info",children:[(0,e.jsx)("div",{className:"fleet-icon",style:{background:t.bg},children:(0,e.jsx)(Pe,{size:18,color:t.ic})}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{color:r.bone,fontSize:"0.9rem",fontWeight:500},children:t.n}),(0,e.jsx)("div",{style:{color:r.grayLight,fontSize:"0.75rem"},children:t.p})]})]}),(0,e.jsx)("span",{className:`fleet-status ${t.s}`,children:t.s.charAt(0).toUpperCase()+t.s.slice(1)})]},a))]}),li=()=>{const[t,a]=(0,p.useState)(0),[l,o]=(0,p.useState)(!1),[i,d]=(0,p.useState)(!1),h=[{name:"Release Form",version:"v3.2",color:r.verdigris},{name:"Receipts",version:"v2.1",color:r.brass}],c=()=>{o(!0),d(!1),setTimeout(()=>{o(!1),d(!0)},1800)};return(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.verdigris},children:"DOCUMENT ENGINE"}),(0,e.jsx)("div",{style:{fontSize:"1.3rem",fontFamily:"'Fraunces', serif",color:r.bone,marginTop:"0.3rem"},children:"Auto-Generate"})]}),(0,e.jsxs)("div",{style:{textAlign:"right"},children:[(0,e.jsx)("div",{style:{fontSize:"1.3rem",fontFamily:"'Fraunces', serif",color:r.bone,fontWeight:600},children:"1,247"}),(0,e.jsx)("div",{style:{fontSize:"0.68rem",fontFamily:"'JetBrains Mono', monospace",color:r.grayLight},children:"docs this month"})]})]}),(0,e.jsx)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"1.2rem"},children:h.map((g,f)=>(0,e.jsxs)("button",{onClick:()=>{a(f),d(!1)},className:`doc-template-btn ${t===f?"active":""}`,style:{"--tpl-color":g.color},children:[(0,e.jsx)(U,{size:14}),(0,e.jsx)("span",{children:g.name})]},f))}),(0,e.jsx)("div",{className:"doc-preview",style:{marginBottom:"1.2rem"},children:l?(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1.8rem 1rem",gap:"0.8rem"},children:[(0,e.jsx)("div",{className:"doc-gen-spinner"}),(0,e.jsx)("span",{style:{fontSize:"0.78rem",fontFamily:"'JetBrains Mono', monospace",color:r.grayLight},children:"Generating..."})]}):i?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{borderBottom:`1px solid ${r.lineDark}`,paddingBottom:"0.8rem",marginBottom:"0.8rem"},children:[(0,e.jsx)("div",{style:{fontSize:"0.95rem",fontWeight:600,color:r.bone},children:h[t].name}),(0,e.jsxs)("div",{style:{fontSize:"0.7rem",fontFamily:"'JetBrains Mono', monospace",color:r.grayLight,marginTop:"0.2rem"},children:["Template ",h[t].version," · Auto-filled from case data"]})]}),(0,e.jsxs)("div",{style:{fontSize:"0.82rem",color:r.grayLight,lineHeight:1.8},children:[(0,e.jsxs)("div",{className:"doc-field",children:[(0,e.jsx)("span",{children:"Deceased:"})," ",(0,e.jsx)("strong",{style:{color:r.bone},children:"Otieno, James M."})]}),(0,e.jsxs)("div",{className:"doc-field",children:[(0,e.jsx)("span",{children:"Date:"})," ",(0,e.jsx)("strong",{style:{color:r.bone},children:"15 Jun 2025"})]}),(0,e.jsxs)("div",{className:"doc-field",children:[(0,e.jsx)("span",{children:"Ref:"})," ",(0,e.jsx)("strong",{style:{color:r.bone},children:"RP-2025-0847"})]})]}),(0,e.jsxs)("div",{className:"doc-signature-area",children:[(0,e.jsx)("div",{className:"doc-sig-line"}),(0,e.jsxs)("svg",{width:"110",height:"32",viewBox:"0 0 110 32",fill:"none",style:{position:"absolute",bottom:"8px",right:"14px"},children:[(0,e.jsx)("path",{d:"M6 24 C10 10, 18 6, 26 18 S36 24, 44 14 S54 4, 64 16 S74 28, 84 12 S94 6, 104 20",stroke:r.verdigris,strokeWidth:"1.6",strokeLinecap:"round",fill:"none",opacity:"0.75"}),(0,e.jsx)("path",{d:"M104 20 L107 16.5 M104 20 L101 16.5",stroke:r.verdigris,strokeWidth:"1.1",strokeLinecap:"round",opacity:"0.5"})]}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"auto"},children:[(0,e.jsxs)("span",{className:"doc-sig-verified",children:[(0,e.jsx)(Be,{size:10,style:{marginRight:"0.3rem",verticalAlign:"middle"}}),"Digitally Signed"]}),(0,e.jsx)("span",{style:{fontSize:"0.65rem",fontFamily:"'JetBrains Mono', monospace",color:r.grayLight},children:"15 Jun 2025, 09:42"})]})]})]}):(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem 1rem",gap:"0.6rem"},children:[(0,e.jsx)(U,{size:28,color:r.lineDark}),(0,e.jsx)("span",{style:{fontSize:"0.82rem",color:r.grayLight},children:"Select template & generate"})]})}),(0,e.jsx)("button",{onClick:c,disabled:l,className:"doc-generate-btn",children:l?"Generating...":"Generate Document"})]})},di=()=>(0,e.jsxs)("div",{className:"mock-inner",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.verdigris},children:"SUPPORT TICKET #1042"}),(0,e.jsx)("div",{style:{fontSize:"1.15rem",fontFamily:"'Fraunces', serif",color:r.ink,marginTop:"0.3rem"},children:"Hearse booking issue"})]}),(0,e.jsx)("span",{style:{fontSize:"0.62rem",fontFamily:"'JetBrains Mono', monospace",padding:"0.3rem 0.6rem",borderRadius:"4px",fontWeight:600,color:r.brass,background:"rgba(139,115,85,0.1)"},children:"IN PROGRESS"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.7rem",marginBottom:"1rem"},children:[(0,e.jsx)("div",{className:"avatar",style:{background:r.accent,width:30,height:30,fontSize:"0.7rem",flexShrink:0},children:"SM"}),(0,e.jsxs)("div",{style:{background:r.bone2,borderRadius:"10px 10px 10px 2px",padding:"0.75rem 1rem",flex:1},children:[(0,e.jsx)("div",{style:{fontSize:"0.68rem",fontFamily:"'JetBrains Mono', monospace",color:r.gray,marginBottom:"0.3rem"},children:"Sarah M. · 10:32 AM"}),(0,e.jsx)("div",{style:{fontSize:"0.84rem",color:r.ink,lineHeight:1.6},children:"Booking freezes when I click confirm on the hearse page."})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.7rem",marginBottom:"1rem",flexDirection:"row-reverse"},children:[(0,e.jsx)("div",{className:"avatar",style:{background:r.verdigris,width:30,height:30,fontSize:"0.62rem",flexShrink:0},children:"RP"}),(0,e.jsxs)("div",{style:{background:r.verdigrisTint||"rgba(61,79,71,0.08)",border:`1px solid ${r.line}`,borderRadius:"10px 10px 2px 10px",padding:"0.75rem 1rem",flex:1},children:[(0,e.jsx)("div",{style:{fontSize:"0.68rem",fontFamily:"'JetBrains Mono', monospace",color:r.verdigris,marginBottom:"0.3rem",fontWeight:600},children:"RESTPOINT SUPPORT · 10:35 AM"}),(0,e.jsx)("div",{style:{fontSize:"0.84rem",color:r.ink,lineHeight:1.6},children:"Thanks mumo  our team is on it. A fix is being deployed now; we'll update you here the moment it's live."})]})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.6rem",borderTop:`1px solid ${r.line}`,paddingTop:"0.9rem",fontSize:"0.72rem",fontFamily:"'JetBrains Mono', monospace",color:r.gray},children:[(0,e.jsx)("span",{style:{width:7,height:7,borderRadius:"50%",background:r.verdigris,display:"inline-block",animation:"subtle-pulse 2s ease infinite"}}),"Support agent online · replies arrive in real time",(0,e.jsxs)("span",{style:{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:"0.4rem",color:r.verdigris,fontWeight:500},children:[(0,e.jsx)(Qe,{size:12})," Reply"]})]})]}),Ae="flp-fraunces-font",J=[{img:"https://www.purpink.co.ke/cdn/shop/products/mixed-rose-and-baby-breath-funeral-heart-flowers-15918094876735.jpg?v=1611511543&width=1240",label:"Heart",alt:"Mixed Rose and Baby Breath Heart",title:(0,e.jsxs)(e.Fragment,{children:["Mixed Rose &",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Baby Breath Heart"})]})},{img:"https://spearwoodflorist.com.au/cdn/shop/articles/wreaths_and_cross_on_stand_at_church_2d6f4e25-0eea-40d7-8288-7eaeff6403ca.jpg?v=1768882058&width=2000",label:"Cross",alt:"Wreaths and Cross on Stand",title:(0,e.jsxs)(e.Fragment,{children:["Wreaths & Cross",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"on Stand"})]})},{img:"https://lh3.googleusercontent.com/grass-cs/ACvplmNcnjmG_DCkbiEq13xxkcDXWJ1z3V-j1e6EAEsPQPvmIyRP3OAqntGk_Y6UGfOPwWIIM73WQABVhLWZzm1QPBUeogNK8nkJxTIzd2TWXKXMCxrL759AgbZCVLwzjqblHsVds02pL-moRo-O=s1360-w1360-h1020-rw",label:"Spray",alt:"Elegant Floral Spray",title:(0,e.jsxs)(e.Fragment,{children:["Elegant",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Floral Spray"})]})},{img:"https://www.purpink.co.ke/cdn/shop/files/Eternal_Embrace.png?v=1773229345&width=1240",label:"Embrace",alt:"The Eternal Embrace",title:(0,e.jsxs)(e.Fragment,{children:["The Eternal",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"Embrace"})]})}],ci=()=>{const[t,a]=(0,p.useState)(0),[l,o]=(0,p.useState)(!1),i=(0,p.useRef)(null),d=(0,p.useRef)(0);(0,p.useEffect)(()=>{if(!document.getElementById(Ae)){const g=document.createElement("link");g.id=Ae,g.rel="stylesheet",g.href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap",document.head.appendChild(g)}return J.forEach(g=>{const f=document.createElement("img");f.src=g.img}),()=>{i.current&&clearTimeout(i.current)}},[]);const h=g=>{let f=g;f<0&&(f=J.length-1),f>=J.length&&(f=0),f!==d.current&&(d.current=f,o(!0),i.current&&clearTimeout(i.current),i.current=setTimeout(()=>{a(f),o(!1)},400))};(0,p.useEffect)(()=>{const g=setInterval(()=>h(d.current+1),4e3);return()=>clearInterval(g)},[]);const c=J[t];return(0,e.jsx)("div",{className:"flp-tablet-wrapper",children:(0,e.jsx)("div",{className:"flp-tablet-scale",children:(0,e.jsx)("div",{className:"flp-tablet-scale-inner",children:(0,e.jsx)("div",{className:"flp-tablet-frame",children:(0,e.jsxs)("div",{className:"flp-tablet-screen",children:[(0,e.jsx)("img",{className:"flp-hero",src:c.img,alt:c.alt,style:{opacity:l?0:1}}),(0,e.jsx)("div",{className:"flp-overlay"}),(0,e.jsx)("div",{className:"flp-strip",children:J.map((g,f)=>(0,e.jsxs)("button",{className:"flp-story",onClick:()=>h(f),children:[(0,e.jsx)("div",{className:`flp-ring ${f===t?"flp-unseen":"flp-seen"}`,children:(0,e.jsx)("div",{className:"flp-ring-inner",children:(0,e.jsx)("img",{src:g.img,alt:g.alt})})}),(0,e.jsx)("span",{className:"flp-story-label",children:g.label})]},g.label))}),(0,e.jsxs)("div",{className:"flp-title-block",children:[(0,e.jsx)("div",{className:"flp-name-tag",children:"Floral Tributes"}),(0,e.jsx)("h2",{className:"flp-headline",style:{opacity:l?0:1,transform:l?"translateY(15px)":"translateY(0)"},children:c.title})]}),(0,e.jsxs)("div",{className:"flp-wordmark",children:[(0,e.jsx)("div",{className:"flp-wordmark-name",children:"Memorial Florals"}),(0,e.jsx)("div",{className:"flp-wordmark-sub",children:"Est. since care began"})]})]})})})})})},A=({no:t,title:a,desc:l,reverse:o,children:i})=>(0,e.jsxs)(L,{className:"showcase-mobile",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5rem",alignItems:"center",marginBottom:"7rem"},children:[(0,e.jsxs)("div",{className:"showcase-text",style:{order:o?2:1,paddingRight:o?"0":"2rem",paddingLeft:o?"2rem":"0"},children:[(0,e.jsxs)("div",{className:"mono-label",style:{color:r.verdigris,fontSize:"0.78rem",marginBottom:"1.2rem"},children:["Module ",t]}),(0,e.jsx)("h2",{style:{fontSize:"clamp(1.8rem, 3vw, 2.4rem)",marginBottom:"1.2rem",lineHeight:1.25},children:a}),(0,e.jsx)("p",{style:{fontSize:"1.05rem",maxWidth:"480px",color:r.gray,lineHeight:1.8},children:l})]}),(0,e.jsx)("div",{className:"showcase-visual",style:{order:o?1:2,display:"flex",justifyContent:"center",width:"100%"},children:i})]});function vi(){const t=Y(),a=()=>{window.scrollTo({top:0,behavior:"smooth"}),t("/register")},l=[{dark:!0,to:!0,category:"NEW · INTEGRATED",accent:r.brass,title:"Leave Management",excerpt:"Staff leave is now fully handled inside Rest Point. Request, approve and track time off in real time — no spreadsheets, no external HR tools.",status:"NOW LIVE"},{static:!0,category:"SELF SERVICE",accent:r.verdigris,title:"Floral Booking",excerpt:"The right flowers, right in front of them. Families browse a curated selection on a tablet at the front desk and choose with confidence — the booking lands instantly on your computer and in your florist's view. Less searching. Less thinking. A better experience.",status:"RECEPTIONIST PORTAL"},{dark:!0,to:!0,category:"NEW · SUPPORT CENTER",accent:r.brass,title:"Real-Time Customer Support",excerpt:"Submit issues directly through the platform and our support agents receive, respond, and resolve them in real time — with full status tracking and communication history.",status:"NOW LIVE"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Tr,{}),(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body { font-family: 'Inter', sans-serif; color: ${r.gray}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -0.01em; color: ${r.ink}; }
        h1 { font-size: clamp(2rem, 6.5vw, 4.6rem); line-height: 1.05; margin-bottom: 1.4rem; }
        h2 { font-size: clamp(1.9rem, 4vw, 2.5rem); line-height: 1.2; }
        p { line-height: 1.7; font-size: 1rem; }
        a { color: inherit; text-decoration: none; }
        .mono-label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${r.brass}; font-weight: 500; }
        .label { font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${r.brass}; font-weight: 500; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.95rem 1.9rem; font-size: 0.9rem; font-weight: 500; font-family: 'Inter', sans-serif; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; white-space: nowrap; letter-spacing: 0.01em; }
        .btn-dark { background: ${r.ink}; color: ${r.bone}; }
        .btn-dark:hover { background: ${r.verdigris}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(21,23,26,0.15); }
        .btn-line { background: transparent; color: ${r.ink}; border-color: ${r.line}; }
        .btn-line:hover { background: ${r.ink}; color: ${r.bone}; border-color: ${r.ink}; }
        .btn-brass { background: ${r.brass}; color: ${r.bone}; border: none; }
        .btn-brass:hover { background: ${r.brassLight}; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139,115,85,0.25); }
        
        /* FIX: Massively increased outer padding for balance */
        .wrap { max-width: 1200px; margin: 0 auto; width: 100%; padding-left: clamp(2rem, 7vw, 5rem) !important; padding-right: clamp(2rem, 7vw, 5rem) !important; }

        .marquee-strip { overflow: hidden; border-top: 1px solid ${r.line}; border-bottom: 1px solid ${r.line}; padding: 0.9rem 0; background: #000000; }
        .marquee-track { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .marquee-item { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0 1.8rem; font-size: 0.78rem; color: #FFFFFF; font-family: 'JetBrains Mono', monospace; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.1em; }
        .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: #FFFFFF; display: inline-block; flex-shrink: 0; }

        .quickfind-section { padding: clamp(4rem,8vw,6rem) 0; background: ${r.bone}; }
        .search-bar { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.4rem; border: 1.5px solid ${r.line}; border-radius: 12px; background: ${r.bone}; transition: all 0.35s ease; box-shadow: 0 2px 8px rgba(21,23,26,0.03); }
        .search-bar.focused { border-color: ${r.verdigris}; box-shadow: 0 4px 20px rgba(61,79,71,0.1),0 0 0 3px rgba(61,79,71,0.06); }
        .search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem; color: ${r.ink}; font-family: 'Inter', sans-serif; }
        .search-input::placeholder { color: ${r.gray}; }
        .quickfind-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 0.75rem; }
        .quickfind-card { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 1.4rem; border: 1px solid ${r.line}; border-radius: 12px; background: ${r.bone}; cursor: pointer; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); text-decoration: none; }
        .quickfind-card:hover { border-color: var(--card-color); background: color-mix(in srgb,var(--card-color) 4%,${r.bone}); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--card-color) 12%,transparent); }
        .quickfind-icon-wrap { width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb,var(--card-color) 10%,${r.bone}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.4s ease; }
        .quickfind-card:hover .quickfind-icon-wrap { background: var(--card-color); }
        .quickfind-card:hover .quickfind-icon-wrap svg { color: ${r.bone} !important; }
        .quickfind-label { font-size: 0.92rem; font-weight: 600; color: ${r.ink}; margin-bottom: 0.15rem; }
        .quickfind-desc { font-size: 0.78rem; color: ${r.gray}; line-height: 1.4; }
        .quickfind-arrow { margin-left: auto; flex-shrink: 0; color: ${r.gray}; opacity: 0; transform: translateX(-6px); transition: all 0.3s ease; }
        .quickfind-card:hover .quickfind-arrow { opacity: 1; transform: translateX(0); color: var(--card-color); }

        .unified-section { padding: clamp(5rem,10vw,8rem) 0; background: #0C0C0C; position: relative; overflow: hidden; }
        .unified-bg-grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(250,248,244,0.06) 1px,transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .unified-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-family: 'Fraunces',serif; font-size: clamp(6rem,18vw,16rem); font-weight: 700; color: rgba(250,248,244,0.02); pointer-events: none; white-space: nowrap; letter-spacing: -0.03em; user-select: none; }
        .unified-glow-1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle,rgba(61,79,71,0.12) 0%,transparent 70%); top: -150px; right: -100px; pointer-events: none; animation: float-orb 15s ease-in-out infinite; }
        .unified-glow-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle,rgba(139,115,85,0.08) 0%,transparent 70%); bottom: -100px; left: -80px; pointer-events: none; animation: float-orb 15s ease-in-out infinite -5s; }
        .unified-heading { color: ${r.bone}; font-size: clamp(2.4rem,6vw,4.2rem); line-height: 1.05; max-width: 800px; margin: 0 auto; font-weight: 600; }
        .unified-highlight { background: linear-gradient(135deg,#FAF8F4 0%,#A98F6E 40%,#4D9B7F 70%,#FAF8F4 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-text 5s ease infinite; }
        .unified-desc { color: rgba(250,248,244,0.5); font-size: 1.1rem; max-width: 520px; margin: 1.5rem auto 0; line-height: 1.8; }

        .unified-bento-card { position: relative; background: rgba(250,248,244,0.03); border: 1px solid rgba(250,248,244,0.07); border-radius: 16px; padding: clamp(1.5rem,2.5vw,2.2rem); overflow: hidden; cursor: default; transition: all 0.5s cubic-bezier(0.16,1,0.3,1); }
        .unified-bento-card:hover { border-color: var(--card-glow); transform: translateY(-6px); box-shadow: 0 16px 40px -8px var(--card-glow),0 0 0 1px var(--card-glow); background: rgba(250,248,244,0.05); }
        .unified-bento-glow-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent 0%,var(--card-glow) 50%,transparent 100%); opacity: 0; transition: opacity 0.5s ease; }
        .unified-bento-card:hover .unified-bento-glow-line { opacity: 1; }
        .unified-bento-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--card-icon-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; transition: all 0.4s ease; }
        .unified-bento-card:hover .unified-bento-icon { transform: scale(1.08); box-shadow: 0 0 20px var(--card-glow); }
        .unified-bento-title { font-family: 'Inter',sans-serif; font-size: 1rem; font-weight: 600; color: ${r.bone}; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
        .unified-bento-desc { font-size: 0.85rem; color: rgba(250,248,244,0.45); line-height: 1.65; }
        .unified-bento-card:hover .unified-bento-desc { color: rgba(250,248,244,0.65); }

        .unified-cta-btn { background: transparent; color: ${r.bone}; border: 1.5px solid rgba(250,248,244,0.2); padding: 1rem 2.8rem; font-size: 1rem; border-radius: 50px; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .unified-cta-btn:hover { background: ${r.bone}; color: ${r.ink}; border-color: ${r.bone}; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(250,248,244,0.15); }
        .unified-micro { margin-top: 1.2rem; font-size: 0.78rem; color: rgba(250,248,244,0.3); font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; }

        .insurance-section { padding: clamp(5rem,10vw,7rem) 0; position: relative; overflow: hidden; background-image: url('/Funeral_Plan_hero.webp'); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed; border-top: 1px solid ${r.line}; }
        .insurance-scrim { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg,rgba(250,248,244,0.95) 0%,rgba(250,248,244,0.88) 100%); }
        .insurance-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; z-index: 2; background: linear-gradient(90deg,${r.brass},${r.brassLight},${r.accent},${r.brass}); background-size: 200% 100%; animation: gradient-text 4s ease infinite; }
        .insurance-content { position: relative; z-index: 1; text-align: left; max-width: 720px; }
        .insurance-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 1.25rem; margin-top: 3rem; text-align: left; }
        .insurance-card { background: rgba(250,248,244,0.92); border: 1px solid ${r.line}; border-radius: 14px; padding: 1.8rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); position: relative; overflow: hidden; }
        .insurance-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,transparent,${r.brass},transparent); opacity: 0; transition: opacity 0.5s ease; }
        .insurance-card:hover { border-color: ${r.brass}; transform: translateY(-4px); box-shadow: 0 16px 36px -10px rgba(21,23,26,0.16); }
        .insurance-card:hover::before { opacity: 1; }
        .insurance-icon { width: 48px; height: 48px; border-radius: 12px; background: ${r.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1.1rem; color: ${r.verdigris}; transition: all 0.4s ease; }
        .insurance-card:hover .insurance-icon { background: ${r.verdigris}; color: ${r.bone}; }
        .insurance-card h3 { font-family: 'Inter',sans-serif; font-size: 1.05rem; font-weight: 600; color: ${r.ink}; margin-bottom: 0.5rem; }
        .insurance-card p { font-size: 0.86rem; color: ${r.gray}; line-height: 1.7; }
        .insurance-card:hover p { color: ${r.ink}; }

        .app-window { border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(21,23,26,0.2); border: 1px solid ${r.line}; width: 100%; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .app-window:hover { transform: translateY(-8px); }
        .window-header { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.2rem; border-bottom: 1px solid ${r.line}; background: ${r.bone2}; }
        .window-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .window-title { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; color: ${r.gray}; letter-spacing: 0.05em; }
        .window-body { padding: 2rem; background: ${r.bone}; }
        .app-window.dark .window-header { border-bottom: 1px solid ${r.lineDark}; background: rgba(0,0,0,0.2); }
        .app-window.dark .window-body { background: ${r.ink}; }
        .app-window.dark .window-title { color: ${r.grayLight}; }
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

        .mock-list-header { display: flex; justify-content: space-between; font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; color: ${r.gray}; padding-bottom: 0.5rem; border-bottom: 1px solid ${r.line}; margin-bottom: 0.5rem; }
        .mock-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${r.line}; font-size: 0.9rem; }
        .file-icon { width: 32px; height: 32px; background: ${r.bone2}; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .status-badge { font-size: 0.7rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .status-badge.verified { color: ${r.verdigris}; background: ${r.verdigrisTint}; }
        .status-badge.pending { color: ${r.brass}; background: rgba(139,115,85,0.1); }
        .status-badge.missing { color: ${r.accent}; background: rgba(199,123,94,0.1); }
        .status-badge.neutral { color: ${r.ink}; background: ${r.bone2}; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${r.bone}; font-family: 'Fraunces',serif; font-weight: 600; font-size: 0.9rem; }
        .action-btn { background: ${r.bone2}; border: 1px solid ${r.line}; border-radius: 6px; padding: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${r.ink}; transition: all 0.2s; }
        .action-btn:hover { background: ${r.ink}; color: ${r.bone}; }
        .pay-btn { background: ${r.verdigris}; color: ${r.bone}; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'Inter',sans-serif; }
        .slider-group { margin-bottom: 1.5rem; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.8rem; color: ${r.grayLight}; }
        .slider-value { font-family: 'JetBrains Mono',monospace; color: ${r.bone}; font-weight: 500; }
        .custom-range { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(250,248,244,0.2); outline: none; cursor: pointer; border-radius: 2px; }
        .custom-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: ${r.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${r.ink}; }
        .custom-range::-moz-range-thumb { width: 16px; height: 16px; background: ${r.brass}; border-radius: 50%; cursor: pointer; border: 3px solid ${r.ink}; }
        .dispatch-footer { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid ${r.lineDark}; padding-top: 1.2rem; margin-top: 0.5rem; }
        .cost-value { font-size: 1.6rem; font-family: 'Fraunces',serif; color: ${r.bone}; font-weight: 600; }
        .map-visual { position: relative; height: 120px; background: rgba(250,248,244,0.04); border: 1px solid ${r.lineDark}; border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; overflow: hidden; }
        .map-visual::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px); background-size: 20px 20px; }
        .map-pin { width: 32px; height: 32px; border-radius: 50%; background: ${r.verdigris}; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .map-line { position: absolute; left: 32px; right: 32px; height: 2px; background: linear-gradient(90deg,${r.verdigris},${r.accent}); z-index: 1; }
        .map-truck { position: absolute; left: 40%; background: ${r.ink}; padding: 0.5rem; border-radius: 6px; border: 1px solid ${r.lineDark}; z-index: 3; animation: truckMove 3s infinite alternate ease-in-out; }
        .fleet-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${r.lineDark}; }
        .fleet-info { display: flex; align-items: center; gap: 0.8rem; }
        .fleet-icon { width: 36px; height: 36px; background: rgba(61,79,71,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .fleet-status { font-size: 0.72rem; font-family: 'JetBrains Mono',monospace; padding: 0.3rem 0.6rem; border-radius: 4px; font-weight: 500; }
        .fleet-status.available { color: ${r.bone}; background: rgba(40,200,64,0.15); border: 1px solid rgba(40,200,64,0.3); }
        .fleet-status.dispatched { color: ${r.bone}; background: rgba(199,123,94,0.15); border: 1px solid rgba(199,123,94,0.3); }
        .fleet-status.maintenance { color: ${r.bone}; background: rgba(139,115,85,0.15); border: 1px solid rgba(139,115,85,0.3); }

        /* ── Sections ── */
        .section { padding: clamp(4rem,8vw,6rem) 0; }
        .showcase-mobile { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; margin-bottom: 7rem; }
        .about-section { background: ${r.bone}; padding: clamp(3rem,6vw,4rem) 0; border-top: 1px solid ${r.line}; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .lockin-section { position: relative; padding: clamp(5rem,10vw,7rem) 0; overflow: hidden; border-top: 1px solid ${r.line}; }
        .lockin-bg { position: absolute; inset: 0; background-image: url('/lockin.webp'); background-size: cover; background-position: center; background-attachment: fixed; }
        .lockin-section::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(12,12,12,0.78) 0%,rgba(21,23,26,0.86) 100%); }
        .lockin-content { position: relative; z-index: 1; max-width: 720px; }
        .lockin-title { font-size: clamp(2rem,5vw,2.8rem); font-weight: 700; color: ${r.bone}; margin-bottom: 1.25rem; line-height: 1.2; }
        .lockin-desc { font-size: 1.05rem; color: rgba(250,248,244,0.82); line-height: 1.8; margin-bottom: 1.25rem; }
        .lockin-sub { font-size: 1.08rem; font-family: 'Fraunces',serif; font-weight: 500; color: ${r.brassLight}; line-height: 1.7; margin-bottom: 2.5rem; }
        .lockin-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1.5rem; margin-top: 2.5rem; text-align: left; }
        .lockin-card { background: rgba(250,248,244,0.05); border: 1px solid rgba(250,248,244,0.08); border-radius: 12px; padding: 1.5rem; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
        .lockin-card:hover { border-color: rgba(139,115,85,0.35); background: rgba(250,248,244,0.08); transform: translateY(-4px); }
        .lockin-card-icon { width: 44px; height: 44px; border-radius: 10px; background: ${r.verdigrisTint}; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .lockin-card h3 { font-size: 1.05rem; font-weight: 600; color: ${r.bone}; margin-bottom: 0.5rem; }
        .lockin-card p { font-size: 0.85rem; color: rgba(250,248,244,0.68); line-height: 1.6; }
        @media(max-width:768px) { .lockin-section { padding: clamp(4rem,10vw,5rem) 0; } .lockin-bg { background-attachment: scroll; } }
        .modules-section { padding: clamp(4rem,8vw,6rem) 0; background: ${r.bone}; border-top: 1px solid ${r.line}; }
        .modules-header { text-align: center; margin-bottom: 3rem; padding: 0 1rem; }
        .modules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 900px; margin: 0 auto; align-items: stretch; }
        .modules-grid > div { display: flex; }
        .module-card { flex: 1; width: 100%; display: flex; flex-direction: column; padding: 1.5rem; border: 1px solid ${r.line}; border-radius: 12px; background: ${r.bone}; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none; }
        .module-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb,var(--accent) 10%,transparent); }
        .module-card.dark { background: ${r.ink}; border-color: rgba(250,248,244,0.12); }
        .module-card.dark:hover { box-shadow: 0 8px 24px rgba(21,23,26,0.35); }
        .module-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .module-cat { display: flex; align-items: center; gap: 0.5rem; font-family: 'JetBrains Mono',monospace; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; }
        .module-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: module-pulse 2s ease-in-out infinite; }
        .module-ext { color: ${r.gray}; opacity: 0; transform: translate(-4px,4px); transition: all 0.3s ease; }
        .module-card:hover .module-ext { opacity: 1; transform: translate(0,0); color: var(--accent); }
        .module-title { font-size: 1.05rem; font-weight: 600; color: ${r.ink}; margin: 0 0 0.5rem; line-height: 1.35; font-family: 'Inter',sans-serif; }
        .module-excerpt { font-size: 0.85rem; color: ${r.gray}; line-height: 1.65; flex: 1; margin: 0; }
        .module-status { font-size: 0.75rem; color: ${r.gray}; font-family: 'JetBrains Mono',monospace; letter-spacing: 0.05em; margin-top: 1rem; }
        .module-card.dark .module-title { color: ${r.bone}; }
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
      `}),(0,e.jsxs)("main",{children:[(0,e.jsx)($t,{}),(0,e.jsx)(Wa,{}),(0,e.jsx)(ai,{items:["Case Management","Family Portal","Smart Dispatch","Fleet Tracking","Funeral Insurance","Real-Time Support","Billing & Invoicing","Analytics & Reports","Welfare Schemes"]}),(0,e.jsx)(nt,{}),(0,e.jsx)("section",{id:"features",className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)(L,{children:(0,e.jsxs)("div",{style:{textAlign:"center",marginBottom:"5rem"},children:[(0,e.jsx)("div",{className:"label",style:{marginBottom:"1rem"},children:"Features"}),(0,e.jsx)("h2",{style:{fontSize:"clamp(2rem, 4.5vw, 3rem)",marginBottom:"1rem"},children:"Everything you need to operate with dignity"}),(0,e.jsx)("p",{style:{maxWidth:"600px",margin:"0 auto",color:r.gray},children:"From case management to funeral insurance integration, Rest Point provides the tools funeral homes and welfare organizations need to serve families efficiently."})]})}),(0,e.jsx)(A,{no:"01",title:"Case management that respects your workflow",desc:"Track every detail from first call to final settlement. Rest Point keeps case files organized, documents verified, and families informed.",reverse:!1,children:(0,e.jsx)(I,{title:"restpoint.app/cases",children:(0,e.jsx)(ii,{})})}),(0,e.jsx)(A,{no:"02",title:"Family portal & online memorials",desc:"Give families secure access to arrangements, documents, and billing. Light a candle, leave a condolence, and stay connected.",reverse:!0,children:(0,e.jsx)(I,{title:"restpoint.app/portal",children:(0,e.jsx)(ni,{})})}),(0,e.jsx)(A,{no:"03",title:"Smart dispatch & billing",desc:"Optimize hearse routes, calculate costs automatically, and bill with precision. Rest Point turns logistics into a competitive advantage.",reverse:!1,children:(0,e.jsx)(I,{title:"restpoint.app/dispatch",dark:!0,children:(0,e.jsx)(oi,{})})}),(0,e.jsx)(A,{no:"04",title:"Hearse management module",desc:"Effective hearse management helps a funeral home provide reliable, professional, and respectful transportation services.",reverse:!0,children:(0,e.jsx)(I,{title:"restpoint.app/fleet",dark:!0,children:(0,e.jsx)(si,{})})}),(0,e.jsx)(A,{no:"05",title:"Document automation engine",desc:"Generate release forms, autopsy records, death certificates, and burial permits automatically. Digital signatures included.",reverse:!1,children:(0,e.jsx)(I,{title:"restpoint.app/documents",dark:!0,children:(0,e.jsx)(li,{})})}),(0,e.jsx)(A,{no:"06",title:"Real Time Customer Support",desc:"Clients can submit issues directly through the platform, while support agents receive, respond to, and resolve requests in real time. The system provides status tracking, communication history no question ever goes unanswered.",reverse:!0,children:(0,e.jsx)(I,{title:"restpoint.app/support",children:(0,e.jsx)(di,{})})}),(0,e.jsx)(A,{no:"07",title:"The Right Flowers. Right in Front of Them.",reverse:!1,desc:(0,e.jsxs)(e.Fragment,{children:["Families shouldn't have to search the internet for hours trying to figure out what flowers are right for the moment.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"Give them a tablet at the front desk. Show them a curated selection of arrangements .",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"Once they choose, the booking appears instantly in the software. Your florist gets notified right away.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{}),"They can even add custom details on the spot  like ribbon colors, specific flower preferences, or personalized messages.",(0,e.jsx)("br",{}),(0,e.jsx)("br",{})]}),children:(0,e.jsx)(ci,{})})]})}),(0,e.jsxs)("section",{id:"insurance",className:"insurance-section",children:[(0,e.jsx)("div",{className:"insurance-accent-bar"}),(0,e.jsx)("div",{className:"wrap",children:(0,e.jsx)("div",{className:"insurance-content",children:(0,e.jsxs)(L,{children:[(0,e.jsx)("div",{className:"label",style:{color:"#E8D5B5",marginBottom:"1.1rem"},children:"Funeral Insurance & Welfare Management"}),(0,e.jsx)("h2",{style:{color:"#FFFFFF",marginBottom:"1.2rem",fontSize:"clamp(2rem, 4.5vw, 3rem)",lineHeight:1.2},children:"We understand the pain and financial burden families face"}),(0,e.jsx)("p",{style:{color:"rgba(255,255,255,0.92)",lineHeight:1.9,marginBottom:"1.4rem",fontSize:"1.05rem",maxWidth:"640px"},children:"Families go through immense pain when they lose a loved one, only to be burdened with huge hospital bills and funeral expenses. We break down these barriers by bringing comprehensive funeral insurance solutions directly to your organization."}),(0,e.jsx)("p",{style:{color:"rgba(255,255,255,0.78)",lineHeight:1.9,marginBottom:"2.5rem",fontSize:"1.05rem",maxWidth:"640px"},children:"Rest Point now includes funeral insurance management and welfare scheme administration tools  claims, contributions, member tracking, and automated payouts all in one place."}),(0,e.jsxs)("button",{className:"btn btn-brass",onClick:()=>t("/insurance"),style:{padding:"1rem 2.4rem"},children:["View More ",(0,e.jsx)(de,{size:16})]})]})})})]}),(0,e.jsx)(zr,{}),(0,e.jsx)(_a,{}),(0,e.jsx)(ri,{}),(0,e.jsx)("section",{id:"modules",className:"modules-section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsx)("div",{className:"modules-header",children:(0,e.jsxs)(L,{children:[(0,e.jsx)("div",{className:"label",style:{marginBottom:"1rem"},children:"Modules"}),(0,e.jsx)("h2",{children:"Powerful modules, built right in"})]})}),(0,e.jsx)("div",{className:"modules-grid",children:l.map((o,i)=>(0,e.jsx)(L,{delay:i*120,children:(0,e.jsxs)("a",{className:`module-card${o.dark?" dark":""}${o.static?" static":""}`,style:{"--accent":o.accent},onClick:o.to?a:void 0,children:[(0,e.jsxs)("div",{className:"module-card-top",children:[(0,e.jsxs)("div",{className:"module-cat",style:{color:o.accent},children:[(0,e.jsx)("span",{className:"module-dot",style:{background:o.accent}}),o.category]}),(0,e.jsx)(qe,{size:14,className:"module-ext"})]}),(0,e.jsx)("h4",{className:"module-title",children:o.title}),(0,e.jsx)("p",{className:"module-excerpt",children:o.excerpt}),(0,e.jsx)("span",{className:"module-status",children:o.status})]})},i))})]})}),(0,e.jsx)(lr,{}),(0,e.jsx)(Ga,{}),(0,e.jsxs)("section",{className:"lockin-section",children:[(0,e.jsx)("div",{className:"lockin-bg",style:{backgroundImage:"url('/lockin.webp')"}}),(0,e.jsx)("div",{className:"wrap lockin-content",children:(0,e.jsxs)(L,{children:[(0,e.jsx)("h2",{className:"lockin-title",children:"Start using Rest Point."}),(0,e.jsx)("p",{className:"lockin-sub",children:"Grief is heavy enough. Running the operations behind it shouldn't be."}),(0,e.jsx)("p",{className:"lockin-desc",children:"Imagine the modern flow of your home: A family walks in, and instead of drowning in carbon copy paper, they sign admission forms directly on an iPad. At the front desk, they browse real, high resolution images of floral arrangements on a tablet, select the perfect tribute, and book it instantly no physical catalogs or messy ledgers required. Down the hall, body releases are processed seamlessly on the same screen."}),(0,e.jsx)("p",{className:"lockin-desc",children:"You step in to provide families with dignity and a seamless send off. Rest Point steps in to power how you do it."}),(0,e.jsx)("p",{className:"lockin-desc",children:"This is high-end technology engineered specifically for the death care industry. We give you the infrastructure to digitize operations, eliminate the paperwork bottleneck, and deliver a flawless, premium experience from the front door to the final farewell."}),(0,e.jsx)("p",{className:"lockin-sub",children:"Upgrade your workflow. Centralize your data. Secure your operations today."}),(0,e.jsxs)("div",{className:"lockin-grid",children:[(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(_e,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"One Platform."}),(0,e.jsx)("p",{children:"Case management, smart dispatch, family portals, and front-desk tablet booking—unified in one secure command center."})]}),(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(er,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"Protected Details."}),(0,e.jsx)("p",{children:"Every record, document, and digital signature. Paperless, accurate, encrypted, and fully auditable."})]}),(0,e.jsxs)("div",{className:"lockin-card",children:[(0,e.jsx)("div",{className:"lockin-card-icon",children:(0,e.jsx)(Ve,{size:22,color:"#4D9B7F"})}),(0,e.jsx)("h3",{children:"Move Faster."}),(0,e.jsx)("p",{children:"From intake to release, eliminate the manual admin and give your team their time back to focus on what actually matters: care."})]})]}),(0,e.jsxs)("button",{className:"btn btn-brass",onClick:a,style:{marginTop:"2.5rem",padding:"0.9rem 2rem",fontSize:"0.9rem",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"},children:["Request Access to Rest Point ",(0,e.jsx)(de,{size:16})]}),(0,e.jsx)("p",{style:{fontSize:"0.9rem",color:"rgba(250,248,244,0.5)",marginTop:"1.5rem"},children:"Join the homes upgrading the future of death care."})]})})]}),(0,e.jsx)(ar,{}),(0,e.jsx)(ot,{})]})]})}export{vi as default};
