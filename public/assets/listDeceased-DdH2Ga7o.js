import{r as tt}from"./chunk-CXHxssQy.js";import{y as rt}from"./chunk-CXAmgOhv.js";import{i as at,l as ot}from"./chunk-DWc5g_hH.js";import{_ as a,h as nt,m as K}from"./chunk-DJYPtS2Y.js";import{o as st}from"./chunk-CwzAxjA3.js";import{o as it}from"./chunk-BY9AVXEY.js";import{t as ae}from"./chunk-eZ3__Fgx.js";import{c as O,n as F}from"./chunk-C935kdjU.js";import{tn as lt}from"./index-yov0GYHY.js";import{a as ue,n as fe,t as dt}from"./chunk-N6-xod2j.js";import{t as De}from"./chunk-D61LeRbQ.js";import{n as ct,r as pt}from"./chunk-B-oXcbbw.js";var s=tt(rt(),1),e=it(),Me="restpoint.scannerBridgeDismissed",xt="restpoint.scannerBridgeDownloadUrl",gt=()=>{try{const o=localStorage.getItem(xt);return o||`${typeof window<"u"&&window.location?window.location.origin:"https://restpoint.co.ke"}/downloads/Restpoint-Scanner-Bridge-Installer.exe`}catch{return"https://restpoint.co.ke/downloads/Restpoint-Scanner-Bridge-Installer.exe"}},ut=K`
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`,ft=K`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`,ht=K`
  0% { top: 12px; opacity: 1; }
  50% { top: calc(100% - 18px); opacity: 1; }
  51% { opacity: 0; }
  100% { top: 12px; opacity: 0; }
`,mt=a.div`
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(2, 6, 23, 0.76);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
`,bt=a.div`
  width: min(440px, 100%);
  overflow: hidden;
  color: #e2e8f0;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(2, 6, 23, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: ${ut} 0.35s cubic-bezier(0.16, 1, 0.3, 1);
`,yt=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`,vt=a.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f8fafc;
  font: 600 14px 'Source Sans 3', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`,wt=a.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
  animation: ${ft} 2s infinite;
`,jt=a.span`
  color: #64748b;
  font: 11px 'JetBrains Mono', monospace;
  letter-spacing: 1px;
`,$t=a.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 24px 24px;

  @media (max-width: 420px) {
    align-items: flex-start;
    gap: 16px;
  }
`,kt=a.div`
  position: relative;
  display: flex;
  flex: 0 0 100px;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 120px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;

  &::before {
    content: '';
    position: absolute;
    inset: 15px;
    background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0 2px, transparent 2px 8px);
    border-radius: 2px;
  }

  @media (max-width: 360px) {
    flex-basis: 76px;
    width: 76px;
    height: 100px;
  }
`,St=a.span`
  position: absolute;
  right: 0;
  left: 0;
  z-index: 2;
  height: 6px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.2), #2dd4bf);
  box-shadow: 0 0 10px #2dd4bf;
  animation: ${ht} 2s infinite ease-in-out;
`,Ct=a.svg`
  z-index: 3;
  width: 32px;
  height: 32px;
  fill: none;
  stroke: #2dd4bf;
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(45, 212, 191, 0.5));
`,Nt=a.div`
  flex: 1;
  min-width: 0;

  h3 { margin: 0 0 6px; color: #fff; font: 600 18px 'Source Sans 3', sans-serif; }
  p { margin: 0 0 16px; color: #94a3b8; font: 13px/1.5 'Source Sans 3', sans-serif; }
`,zt=a.div`
  display: grid;
  gap: 4px;
  color: #64748b;
  font: 11px 'JetBrains Mono', monospace;

  div { display: flex; justify-content: space-between; gap: 8px; padding-bottom: 2px; border-bottom: 1px dashed rgba(255, 255, 255, 0.05); }
  span { color: #e2e8f0; text-align: right; }
  .warning { color: #f59e0b; }
`,Dt=a.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
`,Be=a.button`
  padding: 14px 20px;
  color: #64748b;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font: 600 14px 'Source Sans 3', sans-serif;
  cursor: pointer;
  &:hover { color: #e2e8f0; background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.2); }
`,Mt=a.a`
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  color: #0a0c10;
  background: #2dd4bf;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(45, 212, 191, 0.3);
  font: 600 14px 'Source Sans 3', sans-serif;
  text-decoration: none;
  cursor: pointer;
  &:hover { background: #5eead4; box-shadow: 0 0 20px rgba(45, 212, 191, 0.5); }
`,Bt=({onReady:o})=>{const[d,h]=(0,s.useState)("checking"),[w,M]=(0,s.useState)(!1),[P,_]=(0,s.useState)(""),I=(0,s.useRef)(0),N=()=>{try{return localStorage.getItem(Me)==="1"}catch{return!1}},C=(0,s.useCallback)(async()=>{const A=++I.current;h("checking");const j=await pt(4e3);A===I.current&&(j.ok?(_(j.url),h("ok"),o&&o(j)):N()?h("dismissed"):h("missing"))},[o]);(0,s.useEffect)(()=>{C()},[C]);const $=()=>{try{localStorage.setItem(Me,"1")}catch{}h("dismissed")};return d==="ok"||d==="checking"||d==="dismissed"?null:(0,e.jsx)(mt,{onClick:$,role:"presentation",children:(0,e.jsxs)(bt,{onClick:A=>A.stopPropagation(),role:"dialog","aria-modal":"true","aria-labelledby":"scanner-bridge-title",children:[(0,e.jsxs)(yt,{children:[(0,e.jsxs)(vt,{children:[(0,e.jsx)(wt,{})," Bridge Awaiting"]}),(0,e.jsx)(jt,{children:"SYS-SCAN-404"})]}),(0,e.jsxs)($t,{children:[(0,e.jsxs)(kt,{"aria-hidden":"true",children:[(0,e.jsx)(St,{}),(0,e.jsx)(Ct,{viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"})})]}),(0,e.jsxs)(Nt,{children:[(0,e.jsx)("h3",{id:"scanner-bridge-title",children:"Install Scanner Bridge"}),(0,e.jsx)("p",{children:"Enable the hardware link to scan physical documents and route them securely to Restpoint."}),(0,e.jsxs)(zt,{children:[(0,e.jsxs)("div",{children:["Target: ",(0,e.jsx)("span",{children:"Restpoint cloud"})]}),(0,e.jsxs)("div",{children:["Protocol: ",(0,e.jsx)("span",{children:"LocalSync v2"})]}),(0,e.jsxs)("div",{children:["Status: ",(0,e.jsx)("span",{className:"warning",children:"Driver missing"})]})]}),w&&(0,e.jsxs)("p",{style:{marginTop:14,marginBottom:0},children:["Download and run the installer once. It starts hidden and runs automatically when you sign in. Bridge: ",P||String(ct()[0]),"."]})]})]}),(0,e.jsxs)(Dt,{children:[(0,e.jsx)(Be,{onClick:$,children:"Dismiss"}),!w&&(0,e.jsx)(Be,{onClick:()=>M(!0),children:"Details"}),(0,e.jsxs)(Mt,{href:gt(),download:!0,children:[(0,e.jsx)(lt,{size:16})," Install & Connect"]})]})]})})},oe="https://restpoint.co.ke/api/v1/restpoint/deceased",Rt=nt`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background-color: #ececec;
  }
`,ie=K`from { opacity: 0; } to { opacity: 1; }`,Ft=K`
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
`,r={black:"#0a0a0a",dark:"#1a1a1a",mid:"#444444",gray:"#777777",lightGray:"#aaaaaa",border:"#e0e0e0",borderLight:"#efefef",bgField:"#f7f7f5",bgSection:"#fafaf9",bgApp:"#ececec",exportBtn:"#0F3040",success:"#047857",successBg:"#ecfdf5",warning:"#b45309",warningBg:"#fffbeb",danger:"#dc2626",dangerBg:"#fef2f2",info:"#1e3a8a",infoBg:"#e0e7ff",brown:"#795548",cBlue:"#00296B",cOrange:"#E36414",cPurple:"#5F0F40",cPink:"#DD2D4A",cNavy:"#03071E",accent:"#DD2D4A"},Re={active:{label:"Active",color:r.cBlue,bg:"rgba(0, 41, 107, 0.1)"},"in morgue":{label:"In Morgue",color:r.cBlue,bg:"rgba(0, 41, 107, 0.1)"},"postmortem requested":{label:"Postmortem Requested",color:r.cOrange,bg:"rgba(227, 100, 20, 0.1)"},"pending autopsy":{label:"Postmortem Done",color:r.cPurple,bg:"rgba(95, 15, 64, 0.1)"},"postmortem done":{label:"Postmortem Done",color:r.cPurple,bg:"rgba(95, 15, 64, 0.1)"},pending:{label:"Pending",color:r.cPink,bg:"rgba(221, 45, 74, 0.1)"},released:{label:"Released",color:r.cNavy,bg:"rgba(3, 7, 30, 0.1)"},completed:{label:"Released",color:r.cNavy,bg:"rgba(3, 7, 30, 0.1)"},complete:{label:"Released",color:r.cNavy,bg:"rgba(3, 7, 30, 0.1)"},buried:{label:"Buried",color:r.cNavy,bg:"rgba(3, 7, 30, 0.1)"},transferred:{label:"Transferred",color:r.cNavy,bg:"rgba(3, 7, 30, 0.1)"},"in care":{label:"In Care",color:r.cBlue,bg:"rgba(0, 41, 107, 0.1)"},embalmed:{label:"In Care",color:r.cBlue,bg:"rgba(0, 41, 107, 0.1)"},default:{label:"Unknown",color:"#6b7280",bg:"#f3f4f6"}},he=o=>{const d=(o||"active").toLowerCase();return Re[d]||Re.default},ne=o=>{if(!o||isNaN(new Date(o).getTime()))return null;const d=new Date(o);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`},Et=a.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: ${r.dark};
  font-size: 14px;
  line-height: 1.5;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 10px;
  width: 100%;
  max-width: 2200px;
  animation: ${ie} 0.25s ease-out;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 6px;
  }
`,Pt=a.div`
  margin-bottom: 24px;
  
  h1 {
    font-family: 'Merriweather', serif;
    font-size: 28px;
    color: ${r.black};
    font-weight: 900;
    margin: 0;
  }
  p {
    color: ${r.gray};
    font-size: 15px;
    margin-top: 4px;
  }
`,_t=a.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
`,It=a.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1 1 100%;
  
  @media (min-width: 992px) {
    flex: 1;
  }
`,At=a.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 100%;
  
  @media (min-width: 992px) {
    flex: 0 0 auto;
    margin-left: auto;
    justify-content: flex-end;
  }
`,Lt=a.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 200px;
  min-width: 150px;
  
  @media (min-width: 992px) {
    flex: 0 1 280px;
    max-width: 280px;
  }
`,He=a.i`
  position: absolute;
  left: 16px;
  color: ${r.gray};
  font-size: 14px;
  pointer-events: none;
  transition: color 0.2s;
`,Tt=a.input`
  height: 42px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${r.border};
  background: ${r.bgField};
  padding: 0 16px 0 42px;
  font-size: 14px;
  font-family: 'Source Sans 3', sans-serif;
  color: ${r.dark};
  transition: all 0.25s ease;
  outline: none;
  box-sizing: border-box;

  &::placeholder { color: #aaa; }

  &:focus {
    background: white;
    border-color: ${r.accent};
    box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1);

    & + ${He} {
      color: ${r.accent};
    }
  }
`,se=a.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 150px;
  min-width: 120px;
  
  @media (min-width: 992px) {
    flex: 0 1 170px;
    max-width: 170px;
  }
`,me=a.select`
  height: 42px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${r.border};
  background: ${r.bgField};
  padding: 0 36px 0 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Source Sans 3', sans-serif;
  color: ${r.dark};
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  transition: all 0.25s ease;
  box-sizing: border-box;

  &:focus {
    background: white;
    border-color: ${r.accent};
    box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1);
  }
`,be=a.i`
  position: absolute;
  right: 14px;
  color: ${r.gray};
  pointer-events: none;
  font-size: 12px;
  transition: color 0.2s;
  
  ${se}:hover & {
    color: ${r.dark};
  }
`,E=a.button`
  height: 42px;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Source Sans 3', sans-serif;
  white-space: nowrap;
  box-sizing: border-box;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${o=>o.$ghost&&`
    background: ${r.bgField};
    border: 1px solid ${r.border};
    color: ${r.mid};
    &:hover { background: #eef2f6; border-color: ${r.gray}; color: ${r.black}; }
  `}

  ${o=>o.$danger&&`
    background: #dc2626;
    color: white;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    &:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3); }
  `}

  ${o=>o.$export&&`
    background: ${r.exportBtn};
    color: white;
    box-shadow: 0 4px 12px rgba(15, 48, 64, 0.2);
    &:hover:not(:disabled) { background: #0c2530; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15, 48, 64, 0.3); }
  `}

  ${o=>o.$primary&&`
    background: ${r.black};
    color: white;
    &:hover:not(:disabled) { background: ${r.dark}; }
  `}

  ${o=>o.$sm&&`
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
    border-radius: 8px;
  `}
`,Ut=a.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`,Ht=a.div`
  background: ${r.bgSection};
  padding: 20px 24px;
  border-bottom: 1px solid ${r.borderLight};
  
  h2 { 
    font-family: 'Merriweather', serif;
    font-size: 18px; 
    font-weight: 700; 
    color: ${r.black}; 
    margin: 0; 
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`,Yt=a.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    display: none;
  }
`,Wt=a.table`
  width: 100%; 
  border-collapse: collapse; 
  min-width: 900px;
  
  thead th {
    text-align: left; 
    padding: 14px 24px; 
    font-size: 11px; 
    font-weight: 700;
    text-transform: uppercase; 
    letter-spacing: 0.08em; 
    color: ${r.gray};
    border-bottom: 1px solid ${r.borderLight}; 
    background: ${r.bgSection}; 
    white-space: nowrap;
    
    &:last-child { text-align: right; }
  }
  
  tbody tr {
    border-bottom: 1px solid ${r.borderLight}; 
    cursor: pointer; 
    transition: background 0.15s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${r.bgField}; }
  }
  
  td { 
    padding: 16px 24px; 
    font-size: 14px; 
    color: ${r.dark}; 
    vertical-align: middle; 
    
    &:last-child { text-align: right; }
  }
`,Ot=a.div`
  display: flex; 
  align-items: center; 
  gap: 12px;
  
  .meta { font-size: 12px; color: ${r.gray}; margin-top: 2px; }
`,Fe=a.div`
  width: 38px; 
  height: 38px; 
  border-radius: 50%; 
  color: white;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 700; 
  font-size: 14px; 
  flex-shrink: 0;
  background: ${o=>o.$female?r.cPurple:r.black};
`,Ee=a.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
  background: ${o=>o.$bg};
  color: ${o=>o.$color};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: ${o=>o.$color};
  }
`,Pe=a.td`
  text-align: center; 
  padding: 40px; 
  color: ${r.gray};
`,_e=a.div`
  text-align: center; 
  padding: 60px; 
  color: ${r.gray};
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 12px;
  .spinner {
    width: 24px; 
    height: 24px; 
    border: 2px solid ${r.borderLight};
    border-top-color: ${r.accent}; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`,Gt=a.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    width: 100%;
  }
`,ye=a.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  box-sizing: border-box;

  &:active {
    transform: scale(0.98);
    background: ${r.bgField};
  }
`,qt=a.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`,Jt=a.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  
  div div:first-child {
    font-size: 16px;
    font-weight: 700;
    color: ${r.black};
  }
  div div:last-child {
    font-size: 13px;
    color: ${r.gray};
  }
`,Kt=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${r.borderLight};

  div {
    display: flex;
    flex-direction: column;
  }

  span {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${r.gray};
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }

  strong {
    font-size: 14px;
    color: ${r.dark};
    font-weight: 600;
  }
`,Vt=a.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`,Xt=a.div`
  display: ${o=>o.$open?"flex":"none"};
  position: fixed; 
  inset: 0; 
  background: rgba(15, 23, 42, 0.55); 
  z-index: 1000;
  justify-content: flex-end; 
  align-items: stretch;
  animation: ${ie} 0.2s ease-out;

  @media (max-width: 768px) {
    padding: 0;
    align-items: stretch;
  }
`,Qt=a.div`
  background: white; 
  width: 100%;
  max-width: 560px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
  animation: ${Ft} 0.25s ease-out;

  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
    border-radius: 0;
  }
`,Zt=a.div`
  padding: 18px 24px; 
  border-bottom: 1px solid ${r.borderLight};
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start;
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, ${r.exportBtn} 0%, ${r.cNavy} 100%);
  z-index: 10;
  
  h2 { 
    font-family: 'Merriweather', serif; 
    font-size: 17px; 
    color: white;
    margin: 0; 
    display: flex;
    align-items: center;
    gap: 10px;
  }

  p {
    margin: 4px 0 0 0;
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.04em;
  }
`,er=a.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 24px;
`,tr=a.div`
  padding: 14px 24px; 
  border-top: 1px solid ${r.borderLight}; 
  display: flex; 
  gap: 10px; 
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`,rr=a.button`
  background: none; 
  border: none; 
  font-size: 24px; 
  color: ${r.gray}; 
  cursor: pointer; 
  line-height: 1;
  &:hover { color: ${r.black}; }
`,ar=a.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${ie} 0.2s ease-out;
`,or=a.div`
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 430px;
  padding: 28px 24px 20px;
  text-align: center;
  box-sizing: border-box;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  animation: ${ie} 0.25s ease-out;

  @media (max-width: 768px) {
    max-width: 100%;
    padding: 22px 16px 16px;
  }
`,nr=a.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
`,sr=a.div`
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
`,ir=a.div`
  font-size: 13.5px;
  color: ${r.gray};
  line-height: 1.6;
  margin-bottom: 18px;
  overflow-wrap: anywhere;
`,Ie=a.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;

  & + & { margin-top: 10px; }

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    button { width: 100%; }
  }
`,lr=a.div`
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid ${r.borderLight};
  font-size: 11px;
  color: ${r.lightGray};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`,dr=a.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
`,cr=a.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid ${r.borderLight};
  border-radius: 8px;
  background: white;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${r.border};
    background: ${r.bgSection};
  }

  .h-file { flex: 1; min-width: 0; }
  .h-name { font-size: 12.5px; font-weight: 600; color: ${r.dark}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .h-meta { font-size: 11px; color: ${r.gray}; margin-top: 3px; }
  .h-link { font-size: 11px; color: ${r.exportBtn}; text-decoration: none; font-weight: 600; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
  .h-link:hover { text-decoration: underline; color: ${r.black}; }
`,pr=a.div`
  padding: 18px;
  border: 1px dashed ${r.border};
  border-radius: 8px;
  text-align: center;
  color: ${r.gray};
  font-size: 12px;
  line-height: 1.6;
`,Ae=a.div`
  background: ${r.black}; 
  color: white; 
  padding: 8px 16px;
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 24px; 
  border-radius: 2px;
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  span { opacity: 0.5; font-size: 10px; }
  ${o=>o.$mt0&&"margin-top: 0;"}
  ${o=>o.$mt4&&"margin-top: 32px;"}
`,xr=a.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }
`,Le=a.div`flex: 1; min-width: 150px; box-sizing: border-box;`,Te=a.label`
  display: block; 
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
  margin-bottom: 6px;
`,Ue=a.input`
  height: 42px; 
  width: 100%; 
  border: 1px solid ${r.border}; 
  border-radius: 10px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${r.dark}; 
  background: ${r.bgField}; 
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${r.accent}; background: white; box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1); }
`;a.table`
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 0;
  border: 1px solid ${r.borderLight};
  border-radius: 6px;
  overflow: hidden;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${r.gray}; 
    padding: 8px 12px; 
    border-bottom: 2px solid ${r.borderLight}; 
    background: ${r.bgSection}; 
    white-space: nowrap; 
  }
  td { 
    padding: 12px; 
    font-size: 13px; 
    border-bottom: 1px solid ${r.borderLight}; 
    vertical-align: middle; 
  }
  tr:last-child td { border-bottom: none; }
`;var gr=a.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 6px 12px;
  border-radius: 4px; 
  font-size: 12px; 
  font-weight: 700;
  background: ${o=>o.$success?r.successBg:o.$warning?r.warningBg:o.$info?r.infoBg:r.bgField};
  color: ${o=>o.$success?r.success:o.$warning?r.warning:o.$info?r.info:r.gray};
  border: 1px solid ${o=>o.$success?"#a7f3d0":o.$warning?"#fde68a":o.$info?"#bfdbfe":r.borderLight};
`;function G(o,d){const h=new Date(o);return h.setDate(h.getDate()+d),h}function ur(o){const d=new Date(o),h=d.getDay();return d.setDate(d.getDate()-(h+6)%7),d}function q(o,d,h){return`${o}-${String(d+1).padStart(2,"0")}-${String(h).padStart(2,"0")}`}var fr=["M","T","W","T","F","S","S"],J=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function hr({eventsData:o=[],selectedDate:d,onDateSelect:h}){const[w,M]=(0,s.useState)(()=>ur(new Date)),P=(0,s.useRef)(null),[_,I]=(0,s.useState)(7),N=(0,s.useMemo)(()=>{const i={};return o.forEach(c=>{const p=new Date(c.date),x=q(p.getFullYear(),p.getMonth(),p.getDate());i[x]=(i[x]||0)+1}),i},[o]),C=q(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()),$=(0,s.useMemo)(()=>{const i=[];for(let c=0;c<30;c++){const p=G(w,c),x=q(p.getFullYear(),p.getMonth(),p.getDate());i.push({date:p,key:x,dayName:fr[(p.getDay()+6)%7],dayNum:p.getDate(),count:N[x]||0,isToday:x===C,isSelected:d!=null&&x===q(d.getFullYear(),d.getMonth(),d.getDate())})}return i},[w,N,C,d]);(0,s.useEffect)(()=>{const i=d?q(d.getFullYear(),d.getMonth(),d.getDate()):C,c=document.getElementById(`dc-${i}`);c&&setTimeout(()=>c.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"}),50)},[d,w,C]),(0,s.useEffect)(()=>{const i=P.current;if(!i)return;const c=()=>{const x=Math.max(i.clientWidth-28,40),k=Math.max(1,Math.floor(x/44));I(Math.min(k,30))};c();const p=new ResizeObserver(c);return p.observe(i),()=>p.disconnect()},[]);const A=(0,s.useMemo)(()=>{const i=G(w,0),c=G(w,29),p=i.getMonth(),x=i.getFullYear(),k=c.getMonth(),z=c.getFullYear();return p===k&&x===z?`${J[p]} ${x}`:x===z?`${J[p]}–${J[k]} ${x}`:`${J[p]} ${x}–${J[k]} ${z}`},[w]),j=()=>M(i=>G(i,-7)),le=()=>M(i=>G(i,7)),H=i=>{h&&h(i)};return(0,e.jsxs)("div",{style:{background:"transparent",borderRadius:10,border:"none",fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',width:"100%",maxWidth:2200,margin:"0 auto"},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 0 6px 0"},children:[(0,e.jsx)("button",{onClick:j,style:{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #e5e7eb",borderRadius:7,background:"#fff",color:"#374151",cursor:"pointer",fontSize:"12px",lineHeight:1,transition:"all 0.15s",outline:"none"},onMouseEnter:i=>{i.currentTarget.style.background="#f3f4f6"},onMouseLeave:i=>{i.currentTarget.style.background="#fff"},title:"Previous week",children:"←"}),(0,e.jsx)("span",{style:{fontSize:"11px",fontWeight:600,color:"#6b7280",letterSpacing:"0.3px"},children:A}),(0,e.jsx)("button",{onClick:le,style:{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #e5e7eb",borderRadius:7,background:"#fff",color:"#374151",cursor:"pointer",fontSize:"12px",lineHeight:1,transition:"all 0.15s",outline:"none"},onMouseEnter:i=>{i.currentTarget.style.background="#f3f4f6"},onMouseLeave:i=>{i.currentTarget.style.background="#fff"},title:"Next week",children:"→"})]}),(0,e.jsx)("div",{ref:P,style:{display:"flex",justifyContent:"flex-start",overflowX:"hidden",overflowY:"hidden",padding:"2px 0",gap:3,scrollBehavior:"smooth",scrollbarWidth:"none",msOverflowStyle:"none",minHeight:70},className:"ds-scroll-hide",children:$.slice(0,_).map(i=>{const{isToday:c,isSelected:p}=i;let x="transparent",k="1.5px solid transparent",z="none",T="#111827",D="#9ca3af",Y="#e5e7eb",V="#6b7280";return c&&!p&&(k="1.5px solid #d80505",x="transparent"),p&&(x="rgb(244, 0, 0)",T="#fff",D="rgba(255,255,255,0.8)",Y="rgba(255,255,255,0.2)",V="#fff"),(0,e.jsxs)("button",{id:`dc-${i.key}`,onClick:()=>H(i.date),style:{flex:"1 0 36px",padding:"4px 2px 3px",borderRadius:7,border:k,background:x,textAlign:"center",cursor:"pointer",transition:"all 0.15s ease",boxShadow:z,outline:"none",position:"relative",minWidth:30},onMouseEnter:B=>{!p&&!c&&(B.currentTarget.style.background="#f3f4f6",B.currentTarget.style.transform="translateY(-1px)")},onMouseLeave:B=>{p||(B.currentTarget.style.background="transparent",B.currentTarget.style.transform="none")},children:[(0,e.jsx)("div",{style:{fontSize:"9px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",color:D,marginBottom:1,opacity:p?1:.7},children:i.dayName}),(0,e.jsx)("div",{style:{fontSize:"14px",fontWeight:p?700:600,color:T,lineHeight:1.2},children:i.dayNum}),i.count>0&&(0,e.jsx)("div",{style:{display:"inline-block",marginTop:1,fontSize:"7px",fontWeight:700,padding:"0px 4px",borderRadius:3,background:Y,color:V,lineHeight:1.5,letterSpacing:"0.02em"},children:i.count})]},i.key)})}),(0,e.jsx)("style",{children:".ds-scroll-hide::-webkit-scrollbar{display:none}"})]})}var Dr=()=>{const o=ot(),[d,h]=at(),w=new Date,[M,P]=(0,s.useState)([]),[_,I]=(0,s.useState)(!0),[N,C]=(0,s.useState)(!1),[$,A]=(0,s.useState)(()=>{const t=d.get("search");return t?String(t):""}),[j,le]=(0,s.useState)(""),[H,i]=(0,s.useState)(""),[c,p]=(0,s.useState)(()=>{const t=Number(d.get("year"));return Number.isInteger(t)&&t>=1900&&t<=2200?t:w.getFullYear()}),[x,k]=(0,s.useState)(null),z=(0,s.useRef)(null);z.current=h;const[T,D]=(0,s.useState)(!1),[Y,V]=(0,s.useState)(""),[B,Ye]=(0,s.useState)(""),[R,de]=(0,s.useState)(!1),[ce,pe]=(0,s.useState)([]),[b,X]=(0,s.useState)(null),[xe,ve]=(0,s.useState)(!1),[We,we]=(0,s.useState)(""),U=(0,s.useRef)(null),Q=(0,s.useCallback)(async()=>{I(!0),ve(!1),we("");try{const t=O(),n={Authorization:`Bearer ${F?F():localStorage.getItem("token")||""}`,"x-tenant-slug":t},l=[];let u=1;const f=200;let g=2;for(;u<=g&&u<=12;){const y={year:c,page:u,limit:f};$&&(y.search=$),z.current&&z.current({year:c,page:u,limit:f},{replace:!0});const v=await ae.get(`${oe}/deceased-all`,{params:y,headers:n}),m=v.data?.data||v.data||[],S=Array.isArray(m)?m:[];l.push(...S);const L=v.data?.pagination;if(L?.totalPages&&(g=Math.min(Number(L.totalPages)||1,12)),S.length<f)break;u+=1}P(l)}catch(t){console.error("Error fetching deceased:",t),P([]),t.friendlyMessage&&(ve(!0),we(t.friendlyMessage))}finally{I(!1)}},[$,c]);(0,s.useEffect)(()=>{Q()},[Q]);const Oe=(0,s.useCallback)(async()=>{if(!N){C(!0);try{await Q(),De("Deceased records refreshed","success")}catch{De("Failed to refresh records. Please try again.","error")}finally{C(!1)}}},[Q,N]);(0,s.useEffect)(()=>()=>{U.current&&U.current()},[]);const ge=(0,s.useMemo)(()=>c?M.filter(t=>{const n=t.created_at||t.date_admitted||t.admission_date,l=new Date(n);return!isNaN(l.getTime())&&l.getFullYear()===Number(c)}):M,[M,c]),W=ge.filter(t=>{const n=(t.full_name||t.name||"").toLowerCase(),l=(t.deceased_id||t.id||"").toLowerCase(),u=(t.admission_number||t.admission_no||"").toLowerCase(),f=$.toLowerCase();if($&&!n.includes(f)&&!l.includes(f)&&!u.includes(f))return!1;if(j){const g=he(t.body_status||t.status);if(j==="Active"&&g.label!=="Active"&&g.label!=="Pending"||j==="Postmortem Requested"&&g.label!=="Postmortem Requested"||j==="Postmortem Done"&&g.label!=="Postmortem Done"&&g.label!=="Pending Autopsy"||j==="Released"&&g.label!=="Released"&&g.label!=="Transferred"&&g.label!=="Buried")return!1}if(H){const g=(t.sex||t.gender||"").toLowerCase();if(H.toLowerCase()!==g)return!1}if(x){const g=t.created_at||t.date_admitted||t.admission_date;if(ne(g)!==ne(x))return!1}return!0}),je=t=>t?t.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase():"NA",$e=t=>{if(!t)return 0;const n=dt(t);return n!=null?Math.abs(n):0},Z=t=>{const n=O();o(`/tenant/${n}/deceased?id=${encodeURIComponent(t)}`)},ke=(t,n)=>{const l=String(t?.headers?.["content-disposition"]||"").match(/filename="?([^";]+)"?/i);return l?l[1]:n},Ge=(t,n)=>{const l=window.URL.createObjectURL(t),u=document.createElement("a");u.href=l,u.download=n,u.target="_blank",u.rel="noopener",document.body.appendChild(u),u.click(),document.body.removeChild(u),window.URL.revokeObjectURL(l)},Se=(0,s.useCallback)(()=>{X(null)},[]),qe=(0,s.useCallback)(()=>{const t=b?.blob;t&&Ge(t,b?.fileName||`Deceased_Records_${ue()}.xlsx`)},[b]),Ce=(0,s.useCallback)(t=>{de(!1),D(!1),X({type:"error",message:t||"The export could not be completed. Please try again.",blob:null,fileName:""})},[]),Ne=(0,s.useCallback)((t,n)=>{de(!1),D(!1),X({type:"success",message:`${n||"Deceased records export"} was generated successfully.`,blob:t||null,fileName:n||""})},[]),ze=(t="")=>t.includes("spreadsheetml")||t.includes("zip")||t.includes("octet-stream"),ee=async t=>{const n=await t.text();return JSON.parse(n)},Je=async()=>{U.current&&(U.current(),U.current=null),de(!0),X(null);try{const t=O(),n=F?F():localStorage.getItem("token")||"",l=await ae.post(`${oe}/export-excel`,{startDate:Y||void 0,endDate:B||void 0},{headers:{Authorization:`Bearer ${n}`,"x-tenant-slug":t},responseType:"blob",timeout:3e4}),u=(l.headers?.["content-type"]||"").toLowerCase();if(ze(u)){te(),Ne(l.data,ke(l,`Deceased_Records_${ue()}.xlsx`));return}const f=await ee(l.data);if(f?.success&&f?.jobId)Ke(f.jobId);else throw new Error(f?.message||"No job ID returned")}catch(t){console.error("Export error:",t);let n="Failed to start export. Please try again.";if(t?.response?.data&&typeof t.response.data.text=="function")try{n=(await ee(t.response.data))?.message||n}catch{}Ce(n)}},Ke=async t=>{let u=0,f;const g=()=>{f&&(clearTimeout(f),f=null)},y=m=>{g(),Ce(m)},v=async()=>{try{const m=O(),S=F?F():localStorage.getItem("token")||"",L=await ae.get(`${oe}/export-status/${t}`,{headers:{Authorization:`Bearer ${S}`,"x-tenant-slug":m},responseType:"blob",timeout:15e3}),et=(L.headers?.["content-type"]||"").toLowerCase();if(ze(et)){g(),te(),Ne(L.data,ke(L,`Deceased_Records_${ue()}.xlsx`));return}let re;try{re=await ee(L.data)}catch{throw new Error("Unexpected status response")}if(re?.success&&re?.status){u++,u<90?f=setTimeout(v,2e3):(g(),y("Export is taking longer than expected. Please try again later."));return}throw g(),new Error(re?.message||"Unknown status")}catch(m){g(),console.error("Poll error:",m);let S="";if(m?.response?.data&&typeof m.response.data.text=="function")try{S=(await ee(m.response.data))?.message||""}catch{}if(m.code==="ECONNABORTED"||m.message?.includes("timeout")){u++,u<90?f=setTimeout(v,2e3):y("Export timed out. Please try again.");return}if(m.response?.status===404){y("Export job expired or was not found. Please start a new export.");return}y(S||"Export failed. Please try again.")}};return v(),U.current=g,g},te=(0,s.useCallback)(async()=>{try{const t=O(),n=F?F():localStorage.getItem("token")||"",l=await ae.get(`${oe}/export-history`,{headers:{Authorization:`Bearer ${n}`,"x-tenant-slug":t}});l.data?.success&&Array.isArray(l.data?.data)?pe(l.data.data.slice(0,10)):pe([])}catch(t){console.error("Failed to fetch export history:",t),pe([])}},[]);(0,s.useEffect)(()=>{T&&te()},[T,te]);const Ve=t=>{if(!t)return"—";const n=new Date(t);return isNaN(n.getTime())?String(t):n.toLocaleString("en-US",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"})},Xe=t=>{if(!t&&t!==0)return"—";const n=Number(t)/1024;return n<1024?`${n.toFixed(1)} KB`:`${(n/1024).toFixed(2)} MB`},Qe=()=>Array.isArray(ce)?ce.length:0,Ze=(0,s.useMemo)(()=>ge.map(t=>{const n=t.created_at||t.date_admitted||t.admission_date;if(!n)return null;const l=new Date(n);return isNaN(l.getTime())?null:{date:l,title:t.full_name||t.name||"Deceased"}}).filter(Boolean),[ge]);return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Rt,{}),(0,e.jsx)(Bt,{}),(0,e.jsxs)(Et,{children:[(0,e.jsx)(st,{position:"top-right",autoClose:3e3}),(0,e.jsxs)(Pt,{children:[(0,e.jsx)("h1",{children:"Deceased Records"}),(0,e.jsx)("p",{children:"Manage and track all deceased records across your facility"})]}),(0,e.jsxs)(_t,{children:[(0,e.jsxs)(It,{children:[(0,e.jsxs)(E,{$danger:!0,onClick:Oe,disabled:N||_,children:[(0,e.jsx)("i",{className:`fas fa-sync-alt${N?" fa-spin":""}`})," Refresh"]}),(0,e.jsxs)(Lt,{children:[(0,e.jsx)(Tt,{type:"text",placeholder:"Search name or ID...",value:$,onChange:t=>A(t.target.value)}),(0,e.jsx)(He,{className:"fas fa-search"})]}),(0,e.jsxs)(se,{children:[(0,e.jsxs)(me,{value:j,onChange:t=>le(t.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Statuses"}),(0,e.jsx)("option",{value:"Active",children:"Active / In Morgue"}),(0,e.jsx)("option",{value:"Postmortem Requested",children:"Postmortem Requested"}),(0,e.jsx)("option",{value:"Postmortem Done",children:"Postmortem Done"}),(0,e.jsx)("option",{value:"Released",children:"Released / Transferred"})]}),(0,e.jsx)(be,{className:"fas fa-chevron-down"})]}),(0,e.jsxs)(se,{children:[(0,e.jsxs)(me,{value:H,onChange:t=>i(t.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Genders"}),(0,e.jsx)("option",{value:"Male",children:"Male"}),(0,e.jsx)("option",{value:"Female",children:"Female"})]}),(0,e.jsx)(be,{className:"fas fa-chevron-down"})]}),(0,e.jsxs)(se,{style:{maxWidth:"120px"},children:[(0,e.jsx)(me,{value:c,onChange:t=>p(Number(t.target.value)),children:Array.from({length:7},(t,n)=>w.getFullYear()-3+n).map(t=>(0,e.jsx)("option",{value:t,children:t},t))}),(0,e.jsx)(be,{className:"fas fa-chevron-down"})]})]}),(0,e.jsx)(At,{children:(0,e.jsxs)(E,{$export:!0,onClick:()=>D(!0),children:[(0,e.jsx)("i",{className:"fas fa-file-export"})," Export Data"]})})]}),(0,e.jsx)("div",{style:{marginBottom:"24px"},children:(0,e.jsx)(hr,{eventsData:Ze,selectedDate:x,onDateSelect:t=>{x&&ne(t)===ne(x)?k(null):k(t)}})}),(0,e.jsxs)(Ut,{children:[(0,e.jsx)(Ht,{children:(0,e.jsxs)("h2",{children:[x?`Deceased for ${fe(x)}`:`All Deceased · ${c}`," (",W.length,")"]})}),xe&&(0,e.jsx)("div",{style:{padding:"24px",textAlign:"center",background:r.warningBg,borderBottom:"1px solid #fde68a"},children:(0,e.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",gap:"12px",padding:"16px 24px",background:"white",borderRadius:"8px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",maxWidth:"100%",boxSizing:"border-box"},children:[(0,e.jsx)("div",{style:{width:"40px",height:"40px",borderRadius:"50%",background:r.warningBg,color:r.warning,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",flexShrink:0},children:(0,e.jsx)("i",{className:"fas fa-exclamation"})}),(0,e.jsxs)("div",{style:{textAlign:"left"},children:[(0,e.jsx)("div",{style:{fontWeight:600,color:r.dark,marginBottom:"4px"},children:"Service Temporarily Unavailable"}),(0,e.jsx)("div",{style:{fontSize:"13px",color:r.gray},children:We})]})]})}),(0,e.jsx)(Yt,{children:(0,e.jsxs)(Wt,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Deceased Name"}),(0,e.jsx)("th",{children:"Admission No."}),(0,e.jsx)("th",{children:"Date Admitted"}),(0,e.jsx)("th",{children:"Days in Morgue"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{children:"Action"})]})}),(0,e.jsx)("tbody",{children:_?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsxs)(_e,{children:[(0,e.jsx)("div",{className:"spinner"})," Loading records..."]})})}):xe?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsx)(Pe,{children:"Unable to load records at this time. Please try again later."})})}):W.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsx)(Pe,{children:"No records found matching your filters."})})}):W.map(t=>{const n=t.full_name||t.name||"Unknown",l=t.deceased_id||t.id,u=t.admission_number||t.admission_no||"—",f=t.created_at||t.date_admitted||t.admission_date,g=$e(f),y=he(t.body_status||t.status),v=t.sex||t.gender||"",m=v.toLowerCase()==="female";return(0,e.jsxs)("tr",{onClick:()=>Z(l),children:[(0,e.jsx)("td",{children:(0,e.jsxs)(Ot,{children:[(0,e.jsx)(Fe,{$female:m,children:je(n)}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontWeight:600},children:n}),(0,e.jsxs)("div",{className:"meta",children:[v?`${v}, `:"",t.age||"—"," yrs"]})]})]})}),(0,e.jsx)("td",{children:u}),(0,e.jsx)("td",{children:fe(f)}),(0,e.jsxs)("td",{children:[g," days"]}),(0,e.jsx)("td",{children:(0,e.jsx)(Ee,{$bg:y.bg,$color:y.color,children:y.label})}),(0,e.jsx)("td",{children:(0,e.jsx)(E,{$sm:!0,$primary:!0,onClick:S=>{S.stopPropagation(),Z(l)},children:"View Profile"})})]},l)})})]})}),(0,e.jsx)(Gt,{children:_?(0,e.jsxs)(_e,{children:[(0,e.jsx)("div",{className:"spinner"})," Loading records..."]}):xe?(0,e.jsx)(ye,{style:{cursor:"default",textAlign:"center"},children:"Unable to load records at this time. Please try again later."}):W.length===0?(0,e.jsx)(ye,{style:{cursor:"default",textAlign:"center"},children:"No records found matching your filters."}):W.map(t=>{const n=t.full_name||t.name||"Unknown",l=t.deceased_id||t.id,u=t.admission_number||t.admission_no||"—",f=t.created_at||t.date_admitted||t.admission_date,g=$e(f),y=he(t.body_status||t.status),v=t.sex||t.gender||"",m=v.toLowerCase()==="female";return(0,e.jsxs)(ye,{onClick:()=>Z(l),children:[(0,e.jsxs)(qt,{children:[(0,e.jsxs)(Jt,{children:[(0,e.jsx)(Fe,{$female:m,children:je(n)}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{children:n}),(0,e.jsxs)("div",{children:[v?`${v}, `:"",t.age||"—"," yrs"]})]})]}),(0,e.jsx)(Ee,{$bg:y.bg,$color:y.color,children:y.label})]}),(0,e.jsxs)(Kt,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"Admission No."}),(0,e.jsx)("strong",{children:u})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"Days in Morgue"}),(0,e.jsxs)("strong",{children:[g," days"]})]}),(0,e.jsxs)("div",{style:{gridColumn:"span 2"},children:[(0,e.jsx)("span",{children:"Date Admitted"}),(0,e.jsx)("strong",{children:fe(f)})]})]}),(0,e.jsx)(Vt,{children:(0,e.jsx)(E,{$sm:!0,$primary:!0,onClick:S=>{S.stopPropagation(),Z(l)},children:"View Profile"})})]},l)})})]}),(0,e.jsx)(Xt,{$open:T,onClick:()=>!R&&D(!1),children:(0,e.jsxs)(Qt,{onClick:t=>t.stopPropagation(),children:[(0,e.jsxs)(Zt,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)("h2",{children:[(0,e.jsx)("i",{className:"fas fa-file-export"})," Export Data to Excel"]}),(0,e.jsx)("p",{children:"Generates the official deceased intake register (.xlsx)"})]}),(0,e.jsx)(rr,{onClick:()=>!R&&D(!1),children:"×"})]}),(0,e.jsxs)(er,{children:[(0,e.jsxs)(Ae,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," Select Time Range"]}),(0,e.jsxs)(xr,{children:[(0,e.jsxs)(Le,{children:[(0,e.jsx)(Te,{children:"Start Date"}),(0,e.jsx)(Ue,{type:"date",value:Y,onChange:t=>V(t.target.value),disabled:R})]}),(0,e.jsxs)(Le,{children:[(0,e.jsx)(Te,{children:"End Date"}),(0,e.jsx)(Ue,{type:"date",value:B,onChange:t=>Ye(t.target.value),disabled:R})]})]}),(0,e.jsxs)(Ae,{$mt4:!0,children:[(0,e.jsx)("span",{children:"02"})," Export History",(0,e.jsx)("em",{style:{marginLeft:8,opacity:.6},children:"limit: 10 most recent"})]}),Qe()===0?(0,e.jsxs)(pr,{children:[(0,e.jsx)("div",{style:{fontSize:22,opacity:.5,marginBottom:6},children:(0,e.jsx)("i",{className:"fas fa-folder-open"})}),(0,e.jsx)("div",{style:{fontWeight:600,marginBottom:2},children:"No exports yet"}),(0,e.jsx)("div",{children:"Your last 10 exported files will appear here."})]}):(0,e.jsx)(dr,{children:ce.slice(0,10).map(t=>(0,e.jsxs)(cr,{children:[(0,e.jsx)(gr,{$success:t.status==="success",$warning:t.status!=="success",style:{padding:"4px 8px",fontSize:10},children:t.status==="success"?"✓":"✕"}),(0,e.jsxs)("div",{className:"h-file",children:[(0,e.jsxs)("div",{className:"h-name",children:[(0,e.jsx)("i",{className:"fas fa-file-excel",style:{fontSize:11,marginRight:5}}),t.fileName]}),(0,e.jsxs)("div",{className:"h-meta",children:[Ve(t.generatedAt)," • ",t.recordCount||0," records • ",Xe(t.fileSize)]}),t.fileUrl?(0,e.jsxs)("a",{className:"h-link",href:t.fileUrl,target:"_blank",rel:"noreferrer",children:[(0,e.jsx)("i",{className:"fas fa-download"})," Download file"]}):(0,e.jsx)("span",{className:"h-meta",style:{color:r.gray},children:"Saved to Documents via global uploader"})]})]},t.id||t.fileName))})]}),(0,e.jsxs)(tr,{children:[(0,e.jsx)("div",{style:{fontSize:11,color:r.gray,marginRight:"auto"},children:R?"Generating & uploading to Documents…":"Uploaded files are stored in Documents"}),(0,e.jsx)(E,{$ghost:!0,onClick:()=>D(!1),disabled:R,children:"Cancel"}),(0,e.jsx)(E,{$export:!0,onClick:Je,disabled:R,children:R?"Exporting...":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("i",{className:"fas fa-file-excel"})," Generate Export"]})})]})]})}),b&&(0,e.jsx)(ar,{onClick:Se,children:(0,e.jsxs)(or,{onClick:t=>t.stopPropagation(),children:[(0,e.jsx)(nr,{style:{background:b.type==="success"?r.successBg:r.dangerBg,color:b.type==="success"?r.success:r.danger},children:(0,e.jsx)("i",{className:b.type==="success"?"fas fa-check":"fas fa-xmark"})}),(0,e.jsx)(sr,{style:{color:b.type==="success"?r.success:r.danger},children:b.type==="success"?"Success":"Failed"}),(0,e.jsx)(ir,{children:b.type==="success"?b.message||"Your export was generated successfully.":b.message||"The export could not be completed. Please try again."}),b.type==="success"&&b.blob&&(0,e.jsx)(Ie,{children:(0,e.jsxs)(E,{$export:!0,onClick:qe,style:{whiteSpace:"normal",height:"auto",minHeight:42,padding:"10px 18px"},children:[(0,e.jsx)("i",{className:"fas fa-arrow-up-right-from-square"}),"Open the actual .xlsx file in the browser"]})}),(0,e.jsx)(Ie,{children:(0,e.jsx)(E,{$ghost:!0,onClick:Se,children:"Close"})}),(0,e.jsxs)(lr,{children:[(0,e.jsx)("i",{className:"fas fa-circle-info"}),b.type==="success"?"A copy of this file is also saved in Documents.":"Nothing was downloaded. Please try again."]})]})})]})]})};export{Dr as default};
