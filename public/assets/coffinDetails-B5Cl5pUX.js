import{r as H}from"./chunk-CXHxssQy.js";import{y as U}from"./chunk-CXAmgOhv.js";import{l as O,r as S,u as Y}from"./chunk-DWc5g_hH.js";import{_ as a,m as p}from"./chunk-DJYPtS2Y.js";import{o as X}from"./chunk-BY9AVXEY.js";import{t as q}from"./chunk-BUeZRQuQ.js";import{Bn as V,Bt as K,Cn as Z,Dt as J,Ft as Q,R as ee,U as re,Un as ie,W as ae,Wn as te,Zt as v,_ as y,d as ne,et as A,h as se,i as oe,it as B,j as de,kt as le,wt as ce,x as me}from"./index-CivMjfxx.js";var h=H(U(),1),e=X(),r={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassHover:"#A98F6E",brassLight:"#C4B89A",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",line:"#E3DDD0",lineDark:"#2C2F33",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",red:"#9B4A3F",redBg:"#F7ECE9",redLine:"#E8D2CC",white:"#FFFFFF",success:"#475A43",successBg:"#EEF3EC",successLine:"#DCE6D9",shadow:"rgba(21,23,26,0.12)",overlay:"rgba(21,23,26,0.88)",textMuted:"#8B8882",darkGray:"#2C2F33",primaryDark:"#15171A",accentTeal:"#3D4F47",infoBlue:"#5B7B8A",dangerRed:"#9B4A3F",mediumGray:"#E3DDD0",lightGray:"#F3EFE6",successGreen:"#475A43",warningAmber:"#A68B5B",warningBg:"#F8F3E8",warningLine:"#EDE4D0"},w=p`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;p`
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;p`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;var ge=p`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;p`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;var j=a.div`
  background: ${r.bone};
  min-height: 100vh;
  padding: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`,he=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: ${r.gray};
  flex-wrap: wrap;

  a {
    color: ${r.brass};
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: color 0.2s;

    &:hover { color: ${r.brassHover}; }
  }

  span { color: ${r.textMuted}; }
  svg { width: 14px; height: 14px; }
  .separator { color: ${r.mediumGray}; }
`,D=a.div`
  background: ${r.white};
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid ${r.mediumGray};
  overflow: hidden;
  animation: ${w} 0.6s ease-out;
  margin-bottom: 1.5rem;
`,pe=a.div`
  background: linear-gradient(135deg, ${r.ink} 0%, ${r.verdigrisDark} 100%);
  color: ${r.bone};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid ${r.lineDark};

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
`,F=a.div`
  padding: 1.5rem;

  @media (max-width: 768px) { padding: 1rem; }
  @media (max-width: 576px) { padding: 0.75rem; }
`,xe=a.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  color: ${r.bone};
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    background: rgba(255,255,255,0.25);
    transform: translateX(-3px);
  }

  svg { width: 16px; height: 16px; }
`,fe=a.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h4 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.5px;
  }

  svg { color: ${r.brassLight}; width: 24px; height: 24px; }
`,ue=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,G=a.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${r.mediumGray};
  background: ${r.white};
  color: ${r.darkGray};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 38px;
  white-space: nowrap;
  font-family: inherit;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: ${r.brass};
  }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
  svg { width: 16px; height: 16px; }

  &.ghost {
    background: transparent;
    border-color: transparent;
    color: ${r.bone};
    &:hover { background: rgba(255,255,255,0.1); border-color: transparent; transform: none; box-shadow: none; }
  }

  &.primary {
    background: linear-gradient(135deg, ${r.brass} 0%, ${r.brassHover} 100%);
    color: ${r.white};
    border-color: transparent;
    box-shadow: 0 4px 6px -1px rgba(139, 115, 85, 0.3);
    &:hover { box-shadow: 0 10px 20px -5px rgba(139, 115, 85, 0.4); border-color: transparent; }
  }

  &.danger {
    background: linear-gradient(135deg, ${r.red} 0%, #7A3A30 100%);
    color: white;
    border-color: transparent;
    &:hover { box-shadow: 0 10px 20px -5px rgba(155, 74, 63, 0.3); border-color: transparent; }
  }

  &.sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; min-height: 32px; svg { width: 14px; height: 14px; } }
`,be=a.div`
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 1.5rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`,ve=a.div`
  padding: 0;
`,ye=a.div`
  background: ${r.bone2};
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid ${r.mediumGray};
`,je=a.h6`
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${r.ink};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg { width: 16px; height: 16px; color: ${r.brass}; }
`,we=a.div`
  width: 100%;
  height: 350px;
  border-radius: 0.875rem;
  overflow: hidden;
  border: 2px solid ${r.mediumGray};
  background: ${r.white};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img { transform: scale(1.05); }

  svg { color: ${r.textMuted}; width: 64px; height: 64px; }

  @media (max-width: 768px) { height: 250px; }
  @media (max-width: 576px) { height: 200px; }
`,$e=a.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
`,ke=a.div`
  width: 100%;
  height: 80px;
  border-radius: 0.625rem;
  overflow: hidden;
  border: 2px solid ${o=>o.$active?r.brass:r.mediumGray};
  background: ${r.white};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { border-color: ${r.brass}; }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg { color: ${r.textMuted}; width: 24px; height: 24px; }

  @media (max-width: 576px) { height: 60px; }
`,ze=a.div`
  padding: 0;
`,Ce=a.h3`
  font-size: 1.375rem;
  font-weight: 800;
  color: ${r.ink};
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
`,Ie=a.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid ${r.mediumGray};
  border-radius: 0.875rem;
  overflow: hidden;
  margin-bottom: 1rem;
`,l=a.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  border-bottom: 1px solid ${r.mediumGray};
  transition: background 0.2s ease;

  &:last-child { border-bottom: none; }
  &:hover { background: ${r.bone}; }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`,c=a.div`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${r.ink};
  background: ${r.bone2};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-right: 1px solid ${r.mediumGray};

  svg { width: 16px; height: 16px; color: ${r.brass}; flex-shrink: 0; }

  @media (max-width: 576px) {
    border-right: none;
    border-bottom: 1px solid ${r.mediumGray};
  }
`,m=a.div`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${r.darkGray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`,Se=a.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`,L=a.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background: ${r.bone2};
  border: 1px solid ${r.mediumGray};
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${r.darkGray};
  letter-spacing: 0.3px;
  text-transform: uppercase;
`,Ae=a.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${r.red};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg { width: 24px; height: 24px; color: ${r.red}; }
`,Be=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;

  background: ${o=>o.$variant==="danger"?r.redBg:o.$variant==="warning"?r.warningBg:r.successBg};
  color: ${o=>o.$variant==="danger"?r.red:o.$variant==="warning"?r.warningAmber:r.success};
  border: 1px solid ${o=>o.$variant==="danger"?r.redLine:o.$variant==="warning"?r.warningLine:r.successLine};

  svg { width: 16px; height: 16px; }
`,De=a.div`
  background: ${r.white};
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid ${r.mediumGray};
  margin-top: 1.5rem;

  h6 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: ${r.ink};
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg { width: 16px; height: 16px; color: ${r.brass}; }
  }

  p {
    font-size: 0.875rem;
    color: ${r.darkGray};
    line-height: 1.7;
    margin: 0;
  }

  hr {
    border: none;
    border-top: 1px solid ${r.mediumGray};
    margin: 1.5rem 0;
  }
`,Fe=a.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  color: ${r.brass};

  svg { animation: ${ge} 1s linear infinite; width: 40px; height: 40px; }
  p { margin-top: 1rem; font-size: 1rem; color: ${r.textMuted}; }
`,Ge=a.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: ${r.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${w} 0.2s ease-out;
  backdrop-filter: blur(4px);
`,Le=a.div`
  position: relative;
  max-width: 800px;
  width: 100%;
  animation: ${w} 0.3s ease-out;

  img {
    width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 0.75rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
`,Ee=a.button`
  position: absolute;
  top: -2.5rem;
  right: 0;
  background: rgba(0,0,0,0.6);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover { background: ${r.red}; transform: scale(1.1); }
  svg { width: 20px; height: 20px; }
`,_e=a.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: white;
`,E=a.button`
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover:not(:disabled) { background: rgba(255,255,255,0.4); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  svg { width: 20px; height: 20px; }
`,Ue=()=>{const{coffinId:o,slug:$}=Y(),k=O(),[t,_]=(0,h.useState)(null),[M,z]=(0,h.useState)(!0),[g,x]=(0,h.useState)(0),[T,f]=(0,h.useState)(!1);(0,h.useEffect)(()=>{N()},[o]);const N=async()=>{z(!0);try{const i=await oe.get(ne.COFFINS.DETAIL(o));i.data.success&&_(i.data.data)}catch(i){console.error("Failed to load coffin details:",i)}finally{z(!1)}},P=()=>{if(!t)return[];let i=[];return Array.isArray(t.image_urls)?i=t.image_urls:typeof t.image_urls=="string"&&(i=t.image_urls.split(",").map(s=>s.trim())),t.images&&Array.isArray(t.images)&&(i=[...i,...t.images]),i=[...new Set(i)].filter(s=>s&&s.trim()!==""),i},u=i=>i?i.startsWith("http")?i:`${q.FULL_API_URL||"http://localhost:5000"}${i.startsWith("/")?i:`/${i}`}`:null,W=i=>i===0?"danger":i<=5?"warning":"success",C=()=>{const i=$||localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||"default";k(`/tenant/${i}/coffins`)};if(M)return(0,e.jsx)(j,{children:(0,e.jsxs)(Fe,{children:[(0,e.jsx)(Q,{size:40}),(0,e.jsx)("p",{children:"Loading coffin details..."})]})});if(!t)return(0,e.jsx)(j,{children:(0,e.jsx)(D,{children:(0,e.jsxs)(F,{style:{textAlign:"center",padding:"3rem"},children:[(0,e.jsx)(v,{size:64,color:r.mediumGray}),(0,e.jsx)("h5",{style:{marginTop:"1rem",color:r.ink},children:"Coffin not found"}),(0,e.jsxs)(G,{onClick:C,style:{marginTop:"1rem"},children:[(0,e.jsx)(y,{size:14})," Back to Inventory"]})]})})});const d=P(),n=t.quantity||0,b=W(n),I=$||localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||"default";return(0,e.jsxs)(j,{children:[(0,e.jsxs)(he,{children:[(0,e.jsxs)(S,{to:"/dashboard",children:[(0,e.jsx)(ce,{size:14})," Dashboard"]}),(0,e.jsx)("span",{className:"separator",children:"/"}),(0,e.jsxs)(S,{to:`/tenant/${I}/coffins`,style:{color:r.brass,textDecoration:"none",display:"flex",alignItems:"center",gap:"0.25rem"},children:[(0,e.jsx)(v,{size:14})," Coffin Inventory"]}),(0,e.jsx)("span",{className:"separator",children:"/"}),(0,e.jsx)("span",{children:t.type})]}),(0,e.jsxs)(D,{children:[(0,e.jsxs)(pe,{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[(0,e.jsxs)(xe,{onClick:C,children:[(0,e.jsx)(y,{size:16})," Back"]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(B,{}),(0,e.jsx)("h4",{children:"Coffin Details"})]})]}),(0,e.jsx)(ue,{children:(0,e.jsxs)(G,{className:"ghost sm",onClick:()=>k(`/tenant/${I}/coffins`),children:[(0,e.jsx)(y,{size:14})," Back to Inventory"]})})]}),(0,e.jsxs)(F,{children:[(0,e.jsxs)(be,{children:[(0,e.jsx)(ve,{children:(0,e.jsxs)(ye,{children:[(0,e.jsxs)(je,{children:[(0,e.jsx)(ImageIcon,{size:16}),"Product Gallery"]}),(0,e.jsx)(we,{onClick:()=>d.length>0&&f(!0),children:d.length>0?(0,e.jsx)("img",{src:u(d[g]),alt:t.type,onError:i=>{i.target.style.display="none"}}):(0,e.jsx)(v,{size:64})}),d.length>1&&(0,e.jsx)($e,{children:d.map((i,s)=>(0,e.jsx)(ke,{$active:s===g,onClick:()=>x(s),children:(0,e.jsx)("img",{src:u(i),alt:`${t.type} ${s+1}`,onError:R=>{R.target.style.display="none"}})},s))})]})}),(0,e.jsxs)(ze,{children:[(0,e.jsx)(Ce,{children:t.type}),(0,e.jsxs)(Ie,{children:[(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(Diamond,{size:16})," Brand"]}),(0,e.jsx)(m,{children:t.supplier||"N/A"})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(le,{size:16})," Category"]}),(0,e.jsx)(m,{children:t.material||"N/A"})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(Z,{size:16})," Tags"]}),(0,e.jsx)(m,{children:(0,e.jsxs)(Se,{children:[[t.material,t.color,t.size].filter(Boolean).map((i,s)=>(0,e.jsx)(L,{children:i.toUpperCase()},s)),(0,e.jsx)(L,{children:"COFFIN"})]})})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(K,{size:16})," Size"]}),(0,e.jsx)(m,{children:t.size||"Standard"})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(A,{size:16})," Price"]}),(0,e.jsx)(m,{children:(0,e.jsxs)(Ae,{children:[(0,e.jsx)(A,{size:24}),"Ksh ",parseInt(t.exact_price||0).toLocaleString()]})})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(V,{size:16})," Stock"]}),(0,e.jsx)(m,{children:(0,e.jsxs)(Be,{$variant:b,children:[b==="danger"?(0,e.jsx)(te,{size:16}):b==="warning"?(0,e.jsx)(se,{size:16}):(0,e.jsx)(ee,{size:16}),"(",n,") ",n===0?"Out of Stock":n<=5?"Low Stock":"In Stock"]})})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(B,{size:16})," Reviews"]}),(0,e.jsx)(m,{children:"(0) Reviews"})]}),(0,e.jsxs)(l,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(de,{size:16})," Published"]}),(0,e.jsx)(m,{children:t.created_at?new Date(t.created_at).toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"}):"N/A"})]})]})]})]}),(0,e.jsxs)(De,{children:[(0,e.jsxs)("h6",{children:[(0,e.jsx)(J,{size:16})," Product Description"]}),(0,e.jsxs)("p",{children:["This ",t.material?.toLowerCase()||"quality"," coffin features a ",t.color?.toLowerCase()||"classic"," finish and measures ",t.size||"standard"," size. Crafted with premium ",t.material?.toLowerCase()||"materials",", it offers durability and elegance. Supplied by ",t.supplier||"our trusted partners",".",t.description||""]}),(0,e.jsx)("hr",{}),(0,e.jsxs)("h6",{style:{marginBottom:"1rem"},children:[(0,e.jsx)(me,{size:16})," Stock Analytics"]}),(0,e.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem",maxWidth:"400px"},children:[{label:"In Stock",percentage:n>5?100:n>0?n/20*100:0,count:n},{label:"Low Stock",percentage:n>0&&n<=5?100:0,count:n>0&&n<=5?n:0},{label:"Out of Stock",percentage:n===0?100:0,count:n===0?1:0}].map((i,s)=>(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[(0,e.jsx)("span",{style:{minWidth:"100px",fontSize:"0.8125rem",fontWeight:600,color:r.darkGray},children:i.label}),(0,e.jsx)("div",{style:{flex:1,height:"8px",background:r.mediumGray,borderRadius:"4px",overflow:"hidden"},children:(0,e.jsx)("div",{style:{width:`${i.percentage}%`,height:"100%",background:s===0?`linear-gradient(90deg, ${r.success}, #5A6E55)`:s===1?`linear-gradient(90deg, ${r.warningAmber}, #C4A86A)`:`linear-gradient(90deg, ${r.red}, #B85A4F)`,borderRadius:"4px",transition:"width 0.5s ease"}})}),(0,e.jsxs)("span",{style:{minWidth:"40px",fontSize:"0.8125rem",fontWeight:600,color:r.textMuted,textAlign:"right"},children:["(",i.count,")"]})]},s))})]})]})]}),T&&d.length>0&&(0,e.jsx)(Ge,{onClick:()=>f(!1),children:(0,e.jsxs)(Le,{onClick:i=>i.stopPropagation(),children:[(0,e.jsx)(Ee,{onClick:()=>f(!1),children:(0,e.jsx)(ie,{size:20})}),(0,e.jsx)("img",{src:u(d[g]),alt:t.type,onError:i=>{i.target.src="https://via.placeholder.com/800x600?text=Image+Not+Available"}}),d.length>1&&(0,e.jsxs)(_e,{children:[(0,e.jsx)(E,{onClick:()=>x(i=>Math.max(0,i-1)),disabled:g===0,children:(0,e.jsx)(re,{size:20})}),(0,e.jsxs)("span",{style:{fontSize:"0.875rem",fontWeight:600},children:[g+1," / ",d.length]}),(0,e.jsx)(E,{onClick:()=>x(i=>Math.min(d.length-1,i+1)),disabled:g===d.length-1,children:(0,e.jsx)(ae,{size:20})})]})]})})]})};export{Ue as default};
