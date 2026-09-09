import{r as Ze}from"./chunk-CXHxssQy.js";import{y as et}from"./chunk-CXAmgOhv.js";import{i as tt,l as rt}from"./chunk-DWc5g_hH.js";import{_ as i,h as at,m as ot}from"./chunk-DJYPtS2Y.js";import{o as it}from"./chunk-CwzAxjA3.js";import{o as nt}from"./chunk-BY9AVXEY.js";import{t as N}from"./chunk-eZ3__Fgx.js";import{c as A,n as f}from"./chunk-C935kdjU.js";import{a as ue,n as K,t as st}from"./chunk-N6-xod2j.js";import{t as v}from"./chunk-D61LeRbQ.js";var d=Ze(et(),1),e=nt(),T="https://restpoint.co.ke/api/v1/restpoint/deceased",dt=at`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`,_e=ot`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`,r={black:"#0a0a0a",dark:"#1a1a1a",mid:"#444444",gray:"#777777",lightGray:"#aaaaaa",border:"#c8c8c8",borderLight:"#e0e0e0",bgField:"#f7f7f5",bgAccent:"#f0eeea",bgSection:"#fafaf9",bgApp:"#ececec",exportBtn:"#0F3040",success:"#059669",successBg:"#ecfdf5",warning:"#d97706",warningBg:"#fef3c7",danger:"#dc2626",dangerBg:"#fef2f2",info:"#2563eb",infoBg:"#eff6ff",brown:"#795548"},be={active:{label:"Active",color:"#1e3a8a",bg:"#e0e7ff"},"in morgue":{label:"In Morgue",color:"#1e3a8a",bg:"#e0e7ff"},"postmortem requested":{label:"Postmortem Requested",color:"#6d28d9",bg:"#f3e8ff"},"pending autopsy":{label:"Postmortem Done",color:"#b45309",bg:"#fffbeb"},"postmortem done":{label:"Postmortem Done",color:"#b45309",bg:"#fffbeb"},pending:{label:"Pending",color:"#b45309",bg:"#fffbeb"},released:{label:"Released",color:"#047857",bg:"#ecfdf5"},completed:{label:"Released",color:"#047857",bg:"#ecfdf5"},complete:{label:"Released",color:"#047857",bg:"#ecfdf5"},buried:{label:"Buried",color:"#047857",bg:"#ecfdf5"},transferred:{label:"Transferred",color:"#6b7280",bg:"#f3f4f6"},"in care":{label:"In Care",color:"#1e3a8a",bg:"#e0e7ff"},embalmed:{label:"In Care",color:"#1e3a8a",bg:"#e0e7ff"},default:{label:"Unknown",color:"#6b7280",bg:"#f3f4f6"}},X=a=>{const u=(a||"active").toLowerCase();return be[u]||be.default},Z=a=>{if(!a||isNaN(new Date(a).getTime()))return null;const u=new Date(a);return`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`},lt=i.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: ${r.dark};
  font-size: 14px;
  line-height: 1.5;
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  animation: ${_e} 0.25s ease-out;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  @media (min-width: 901px) {
    margin: 0 auto;
    max-width: 1400px;
    padding: 32px;
    overflow-x: hidden;
    overflow-x: clip;
  }


  @media (max-width: 900px) {
    padding: 16px;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }
`,ct=i.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
  box-sizing: border-box;
  
  h1 {
    font-family: 'Merriweather', serif;
    font-size: 24px;
    color: ${r.black};
    margin: 0;
  }
  p {
    color: ${r.gray};
    font-size: 14px;
    margin: 4px 0 0;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    h1 { font-size: 22px; }
    p { font-size: 13px; }
  }
`,pt=i.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  box-sizing: border-box;

  @media (max-width: 900px) {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
`,j=i.button`
  height: 38px;
  padding: 0 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${r.border}; 
  background: white; 
  color: ${r.dark};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  white-space: nowrap;
  box-sizing: border-box;
  
  &:hover { background: ${r.bgField}; border-color: ${r.gray}; }
  
  ${a=>a.$primary&&`background: ${r.black}; color: white; border-color: ${r.black};
    &:hover { background: ${r.dark}; }`}
    
  ${a=>a.$danger&&`background: ${r.danger}; color: white; border-color: ${r.danger};
    &:hover { background: #b91c1c; }`}
    
  ${a=>a.$export&&`background: ${r.exportBtn}; color: white; border-color: ${r.exportBtn};
    &:hover { background: #0c2530; }`}
    
  ${a=>a.$sm&&"height: 30px; padding: 0 12px; font-size: 12px;"}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 900px) {
    width: 100%;
  }
`,xt=i.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 10px;
  padding: 8px 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }
`,gt=i.div`
  display: flex;
  gap: 6px;
  align-items: center;
  border-right: 1px solid ${r.borderLight};
  padding-right: 16px;

  @media (max-width: 900px) {
    border-right: none;
    padding-right: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid ${r.borderLight};
  }
`,fe=i.select`
  border: 1px solid transparent;
  background: ${r.bgField};
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: ${r.black};
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 8px;
  transition: 0.2s;
  &:hover { background: ${r.borderLight}; }
  &:focus { outline: none; border-color: ${r.gray}; }
`,ht=i.div`
  display: flex;
  /* Big screens: wrap the days into tidy rows so EVERY date fits — no
     horizontal overflow, nothing clipped by the card. Small screens keep
     the classic single-line scroll strip. */
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  padding: 4px 2px 6px;
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  align-items: center;

  @media (max-width: 900px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: ${r.border} transparent;

    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-track { background: ${r.bgField}; border-radius: 10px; }
    &::-webkit-scrollbar-thumb { background: ${r.border}; border-radius: 10px; }
    &::-webkit-scrollbar-thumb:hover { background: ${r.gray}; }
  }
`,we=i.div`
  flex: 0 0 auto;
  min-width: 42px;
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &:hover { background: ${r.bgField}; }

  ${a=>a.$active&&`
    background: ${r.black};
    color: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `}

  @media (max-width: 600px) {
    min-width: 34px;
    padding: 4px 2px;
  }
`,ye=i.div`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.6;
  line-height: 1;
`,ve=i.div`
  font-size: 15px;
  font-weight: 700;
  font-family: 'Merriweather', serif;
  line-height: 1;
`,mt=i.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${a=>a.$active?"#fca5a5":r.danger};
  box-shadow: 0 0 5px rgba(220, 38, 38, 0.55);
  position: absolute;
  bottom: 3px;
  opacity: 1;
`,ut=i.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
`,bt=i.div`
  background: ${r.bgSection};
  padding: 16px 24px;
  border-bottom: 1px solid ${r.borderLight};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-sizing: border-box;
  h2 { 
    font-family: 'Merriweather', serif;
    font-size: 16px; 
    font-weight: 700; 
    color: ${r.black}; 
    margin: 0; 
  }

  @media (max-width: 900px) {
    padding: 16px;
  }
`,ft=i.div`
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid ${r.borderLight};
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    
    > * {
      width: 100% !important;
      flex: 1 1 100% !important;
      min-width: 100% !important;
    }
  }
`,wt=i.input`
  height: 38px; 
  border: 1px solid ${r.border};
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${r.dark};
  background: ${a=>a.$search?`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23777' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E") no-repeat 10px center, ${r.bgField}`:r.bgField};
  background-size: ${a=>a.$search?"16px, auto":"auto"};
  padding-left: ${a=>a.$search?"34px":"12px"};
  transition: border-color 0.15s;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${r.black}; background-color: white; }
`,je=i.select`
  height: 38px; 
  border: 1px solid ${r.border};
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px; 
  color: ${r.dark};
  background: ${r.bgField};
  transition: border-color 0.15s;
  cursor: pointer;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${r.black}; background-color: white; }
`,yt=i.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 900px) {
    display: none;
  }
`,vt=i.table`
  width: 100%; 
  border-collapse: collapse; 
  min-width: 800px;
  
  thead th {
    text-align: left; 
    padding: 12px 24px; 
    font-size: 11px; 
    font-weight: 700;
    text-transform: uppercase; 
    letter-spacing: 0.08em; 
    color: ${r.gray};
    border-bottom: 1px solid ${r.borderLight}; 
    background: ${r.bgSection}; 
    white-space: nowrap;
  }
  
  tbody tr {
    border-bottom: 1px solid ${r.borderLight}; 
    cursor: pointer; 
    transition: background 0.1s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${r.bgField}; }
  }
  
  td { 
    padding: 16px 24px; 
    font-size: 14px; 
    color: ${r.dark}; 
    vertical-align: middle; 
  }
`,jt=i.div`
  display: none;
  
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`,ee=i.div`
  background: white;
  border: 1px solid ${r.borderLight};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: 0.2s;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

  &:active {
    transform: scale(0.98);
    background: ${r.bgField};
  }

  @media (max-width: 600px) {
    padding: 12px;
  }
`,$t=i.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`,kt=i.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`,St=i.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${r.borderLight};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-top: 12px;
  }

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
`,Ct=i.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`,$e=i.div`
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  color: white;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 700; 
  font-size: 14px; 
  flex-shrink: 0;
  background: ${a=>a.$female?r.brown:r.black};
`,zt=i.div`
  display: flex; 
  align-items: center; 
  gap: 12px;
  .meta { font-size: 12px; color: ${r.gray}; margin-top: 2px; }
`,ke=i.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
  background: ${a=>a.$bg};
  color: ${a=>a.$color};
  border: 1px solid ${a=>a.$border};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${a=>a.$color};
  }
`,Se=i.td`
  text-align: center; 
  padding: 40px; 
  color: ${r.gray};
`,Ce=i.div`
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
    border-top-color: ${r.black}; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`,Et=i.div`
  display: ${a=>a.$open?"flex":"none"};
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.5); 
  z-index: 1000;
  justify-content: center; 
  align-items: center; 
  padding: 20px;

  @media (max-width: 900px) {
    padding: 0;
    align-items: flex-end;
  }
`,Dt=i.div`
  background: white; 
  border-radius: 8px; 
  width: 100%; 
  max-width: 700px;
  max-height: 90dvh;
  overflow-y: auto; 
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);

  @media (max-width: 900px) {
    max-width: 100%;
    max-height: 90dvh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
    margin-bottom: 0;
  }
`,Rt=i.div`
  padding: 20px 24px; 
  border-bottom: 1px solid ${r.borderLight};
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  box-sizing: border-box;
  h2 { 
    font-family: 'Merriweather', serif; 
    font-size: 18px; 
    color: ${r.black}; 
    margin: 0; 
  }

  @media (max-width: 900px) {
    padding: 16px;
    h2 { font-size: 16px; }
  }
`,_t=i.div`
  padding: 24px;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
  }
`,At=i.div`
  padding: 16px 24px; 
  border-top: 1px solid ${r.borderLight}; 
  text-align: right; 
  display: flex; 
  gap: 8px; 
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`,Ft=i.button`
  background: none; 
  border: none; 
  font-size: 24px; 
  color: ${r.gray}; 
  cursor: pointer; 
  line-height: 1;
  &:hover { color: ${r.black}; }
`,ze=i.div`
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
  ${a=>a.$mt0&&"margin-top: 0;"}
  ${a=>a.$mt4&&"margin-top: 32px;"}

  @media (max-width: 900px) {
    padding: 8px 12px;
    font-size: 11px;
    margin-bottom: 16px;
    ${a=>a.$mt4&&"margin-top: 24px;"}
  }
`,Lt=i.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }
`,Ee=i.div`flex: 1; min-width: 150px; box-sizing: border-box;`,De=i.label`
  display: block; 
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
  margin-bottom: 6px;
`,Re=i.input`
  height: 38px; 
  width: 100%; 
  border: 1px solid ${r.border}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${r.dark}; 
  background: ${r.bgField}; 
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${r.black}; background: white; }
`,Mt=i.table`
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
`,Pt=i.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 6px 12px;
  border-radius: 4px; 
  font-size: 12px; 
  font-weight: 700;
  background: ${a=>a.$success?r.successBg:a.$warning?r.warningBg:a.$info?r.infoBg:r.bgField};
  color: ${a=>a.$success?r.success:a.$warning?r.warning:a.$info?r.info:r.gray};
  border: 1px solid ${a=>a.$success?"#a7f3d0":a.$warning?"#fde68a":a.$info?"#bfdbfe":r.borderLight};
`,It=i.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid ${r.borderLight};
  z-index: 2000;
  min-width: 320px;
  animation: ${_e} 0.3s ease-out;
  box-sizing: border-box;

  @media (max-width: 900px) {
    left: 16px;
    right: 16px;
    bottom: 16px;
    min-width: auto;
    width: calc(100% - 32px);
    padding: 16px;
  }
`,Vt=()=>{const a=rt(),[u,Ae]=tt(),U=new Date,[W,te]=(0,d.useState)([]),[H,re]=(0,d.useState)(!0),[z,ae]=(0,d.useState)(!1),[$,Fe]=(0,d.useState)(()=>{const t=u.get("search");return t?String(t):""}),[k,Le]=(0,d.useState)(""),[Y,Me]=(0,d.useState)(""),[F,Pe]=(0,d.useState)(U.getMonth()),[h,Ie]=(0,d.useState)(()=>{const t=Number(u.get("year"));return Number.isInteger(t)&&t>=1900&&t<=2200?t:U.getFullYear()}),G=(0,d.useRef)(null);G.current=Ae;const[w,L]=(0,d.useState)(null),q=(0,d.useRef)(null),[J,E]=(0,d.useState)(!1),[oe,Be]=(0,d.useState)(""),[ie,Ne]=(0,d.useState)(""),[Bt,ne]=(0,d.useState)(null),[D,O]=(0,d.useState)(0),[se,R]=(0,d.useState)(""),[b,de]=(0,d.useState)(!1),[le,Te]=(0,d.useState)([]),[V,ce]=(0,d.useState)(!1),[Ue,pe]=(0,d.useState)(""),S=(0,d.useRef)(null),M=(0,d.useCallback)(async()=>{re(!0),ce(!1),pe("");try{const t=A(),o={Authorization:`Bearer ${f?f():localStorage.getItem("token")||""}`,"x-tenant-slug":t},s=[];let n=1;const l=200;let c=2;for(;n<=c&&n<=12;){const p={year:h,page:n,limit:l};$&&(p.search=$),G.current&&G.current({year:h,page:n,limit:l},{replace:!0});const g=await N.get(`${T}/deceased-all`,{params:p,headers:o}),x=g.data?.data||g.data||[],m=Array.isArray(x)?x:[];s.push(...m);const C=g.data?.pagination;if(C?.totalPages&&(c=Math.min(Number(C.totalPages)||1,12)),m.length<l)break;n+=1}te(s)}catch(t){console.error("Error fetching deceased:",t),te([]),t.friendlyMessage&&(ce(!0),pe(t.friendlyMessage))}finally{re(!1)}},[$,h]);(0,d.useEffect)(()=>{M()},[M]);const We=(0,d.useCallback)(async()=>{if(!z){ae(!0);try{await M(),v("Deceased records refreshed","success")}catch{v("Failed to refresh records. Please try again.","error")}finally{ae(!1)}}},[M,z]);(0,d.useEffect)(()=>()=>{S.current&&S.current()},[]),(0,d.useEffect)(()=>{q.current&&q.current.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"})},[w,F,h]);const Q=(0,d.useMemo)(()=>h?W.filter(t=>{const o=t.created_at||t.date_admitted||t.admission_date,s=new Date(o);return!isNaN(s.getTime())&&s.getFullYear()===Number(h)}):W,[W,h]),_=Q.filter(t=>{const o=(t.full_name||t.name||"").toLowerCase(),s=(t.deceased_id||t.id||"").toLowerCase(),n=(t.admission_number||t.admission_no||"").toLowerCase(),l=$.toLowerCase();if($&&!o.includes(l)&&!s.includes(l)&&!n.includes(l))return!1;if(k){const c=X(t.body_status||t.status);if(k==="active"&&c.label!=="active"&&c.label!=="pending"||k==="Postmortem Requested"&&c.label!=="Postmortem Requested"||k==="Postmortem Done"&&c.label!=="Postmortem Done"&&c.label!=="Pending Autopsy"||k==="Released"&&c.label!=="Released"&&c.label!=="Transferred"&&c.label!=="Buried")return!1}if(Y){const c=(t.sex||t.gender||"").toLowerCase();if(Y.toLowerCase()!==c)return!1}if(w){const c=t.created_at||t.date_admitted||t.admission_date;if(Z(c)!==w)return!1}return!0}),xe=t=>t?t.split(" ").map(o=>o[0]).join("").substring(0,2).toUpperCase():"NA",ge=t=>{if(!t)return 0;const o=st(t);return o!=null?Math.abs(o):0},P=t=>{const o=A();a(`/tenant/${o}/deceased?id=${encodeURIComponent(t)}`)},he=(t,o)=>{const s=window.URL.createObjectURL(t),n=document.createElement("a");n.href=s,n.download=o,document.body.appendChild(n),n.click(),document.body.removeChild(n),window.URL.revokeObjectURL(s)},I=()=>{de(!1),E(!1),R(""),O(0),ne(null)},me=(t="")=>t.includes("spreadsheetml")||t.includes("zip")||t.includes("octet-stream"),B=async t=>{const o=await t.text();return JSON.parse(o)},He=async()=>{S.current&&(S.current(),S.current=null),de(!0),O(0),R("Queuing export job...");try{const t=A(),o=f?f():localStorage.getItem("token")||"",s=await N.post(`${T}/export-excel`,{startDate:oe||void 0,endDate:ie||void 0},{headers:{Authorization:`Bearer ${o}`,"x-tenant-slug":t},responseType:"blob",timeout:3e4}),n=(s.headers?.["content-type"]||"").toLowerCase();if(me(n)){R("Download started..."),he(s.data,`Deceased_Records_${ue()}.xlsx`),v("Export completed successfully!","success"),setTimeout(I,1500);return}const l=await B(s.data);if(l?.success&&l?.jobId)ne(l.jobId),R("Processing export..."),Ye(l.jobId);else throw new Error(l?.message||"No job ID returned")}catch(t){console.error("Export error:",t);let o="Failed to start export. Please try again.";if(t?.response?.data&&typeof t.response.data.text=="function")try{o=(await B(t.response.data))?.message||o}catch{}v(o,"error"),setTimeout(I,1500)}},Ye=async t=>{let n=0,l;const c=()=>{l&&(clearTimeout(l),l=null)},p=x=>{v(x,"error"),setTimeout(()=>{I()},2e3)},g=async()=>{try{const x=A(),m=f?f():localStorage.getItem("token")||"",C=await N.get(`${T}/export-status/${t}`,{headers:{Authorization:`Bearer ${m}`,"x-tenant-slug":x},responseType:"blob",timeout:15e3}),Xe=(C.headers?.["content-type"]||"").toLowerCase();if(me(Xe)){c(),he(C.data,`Deceased_Records_${ue()}.zip`),v("Export completed successfully!","success"),setTimeout(I,1500);return}let y;try{y=await B(C.data)}catch{throw new Error("Unexpected status response")}if(y?.success&&y?.status){O(y.progress||0),R(y.message||`Processing export... (${y.status})`),n++,n<90?l=setTimeout(g,2e3):(c(),p("Export is taking longer than expected. Please try again later."));return}throw c(),new Error(y?.message||"Unknown status")}catch(x){c(),console.error("Poll error:",x);let m="";if(x?.response?.data&&typeof x.response.data.text=="function")try{m=(await B(x.response.data))?.message||""}catch{}if(x.code==="ECONNABORTED"||x.message?.includes("timeout")){n++,n<90?(v("Connection hiccup - retrying...","warning"),l=setTimeout(g,2e3)):p("Export timed out. Please try again.");return}if(x.response?.status===404){p("Export job expired or was not found. Please start a new export.");return}p(m||"Export failed. Please try again.")}};return g(),S.current=c,c};(0,d.useEffect)(()=>{J&&(async()=>{try{const o=A(),s=f?f():localStorage.getItem("token")||"",n=await N.get(`${T}/export-history`,{headers:{Authorization:`Bearer ${s}`,"x-tenant-slug":o}});n.data?.success&&n.data?.data&&Te(n.data.data)}catch(o){console.error("Failed to fetch export history:",o)}})()},[J]);const Ge=["January","February","March","April","May","June","July","August","September","October","November","December"],qe=Array.from({length:7},(t,o)=>U.getFullYear()-5+o),Je=new Date(h,F+1,0).getDate(),Oe=(0,d.useMemo)(()=>{const t={};return Q.forEach(o=>{const s=o.created_at||o.date_admitted||o.admission_date,n=Z(s);n&&(t[n]=(t[n]||0)+1)}),t},[Q]),Ve=t=>{Pe(parseInt(t.target.value)),L(null)},Qe=t=>{Ie(parseInt(t.target.value)),L(null)},Ke=t=>{L(o=>o===t?null:t)};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(dt,{}),(0,e.jsxs)(lt,{children:[(0,e.jsx)(it,{position:"top-right",autoClose:3e3}),(0,e.jsxs)(ct,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h1",{children:"Deceased Records"}),(0,e.jsx)("p",{children:"Manage and track all deceased records across your facility"})]}),(0,e.jsxs)(pt,{children:[(0,e.jsxs)(j,{$danger:!0,onClick:We,disabled:z||H,title:"Reload deceased records",children:[(0,e.jsx)("i",{className:`fas fa-sync-alt${z?" fa-spin":""}`,style:{fontSize:12}}),z?"Refreshing...":"Refresh Records"]}),(0,e.jsxs)(j,{$export:!0,onClick:()=>E(!0),children:[(0,e.jsx)("i",{className:"fas fa-file-export",style:{fontSize:12}})," Export Data to Excel"]})]})]}),(0,e.jsxs)(xt,{children:[(0,e.jsxs)(gt,{children:[(0,e.jsx)(fe,{value:F,onChange:Ve,children:Ge.map((t,o)=>(0,e.jsx)("option",{value:o,children:t},o))}),(0,e.jsx)(fe,{value:h,onChange:Qe,children:qe.map(t=>(0,e.jsx)("option",{value:t,children:t},t))})]}),(0,e.jsxs)(ht,{children:[(0,e.jsxs)(we,{$active:!w,onClick:()=>L(null),style:{minWidth:"38px"},children:[(0,e.jsx)(ye,{children:"View"}),(0,e.jsx)(ve,{style:{fontSize:"11px",marginTop:"1px"},children:"All"})]}),Array.from({length:Je},(t,o)=>o+1).map(t=>{const o=new Date(h,F,t),s=Z(o),n=o.toLocaleDateString("en-US",{weekday:"short"}),l=Oe[s]||0,c=l>0,p=w===s;return(0,e.jsxs)(we,{$active:p,onClick:()=>Ke(s),ref:p?q:null,title:c?`${l} record${l>1?"s":""} admitted on this day`:void 0,children:[(0,e.jsx)(ye,{children:n}),(0,e.jsx)(ve,{children:t}),c&&(0,e.jsx)(mt,{$active:p})]},t)})]})]}),(0,e.jsxs)(ut,{children:[(0,e.jsx)(bt,{children:(0,e.jsxs)("h2",{children:[w?`Deceased for ${K(w)}`:`All Deceased · ${h}`," (",_.length,")"]})}),(0,e.jsxs)(ft,{children:[(0,e.jsx)(wt,{$search:!0,type:"text",placeholder:"Search name or ID...",style:{flex:1,minWidth:200},value:$,onChange:t=>Fe(t.target.value)}),(0,e.jsxs)(je,{value:k,onChange:t=>Le(t.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Statuses"}),(0,e.jsx)("option",{value:"Active",children:"Active / In Morgue"}),(0,e.jsx)("option",{value:"Postmortem Requested",children:"Postmortem Requested"}),(0,e.jsx)("option",{value:"Postmortem Done",children:"Postmortem Done"}),(0,e.jsx)("option",{value:"Released",children:"Released / Transferred"})]}),(0,e.jsxs)(je,{value:Y,onChange:t=>Me(t.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Genders"}),(0,e.jsx)("option",{value:"Male",children:"Male"}),(0,e.jsx)("option",{value:"Female",children:"Female"})]})]}),V&&(0,e.jsx)("div",{style:{padding:"24px",textAlign:"center",background:r.warningBg,borderBottom:"1px solid #fde68a"},children:(0,e.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",gap:"12px",padding:"16px 24px",background:"white",borderRadius:"8px",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",maxWidth:"100%",boxSizing:"border-box"},children:[(0,e.jsx)("div",{style:{width:"40px",height:"40px",borderRadius:"50%",background:r.warningBg,color:r.warning,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",flexShrink:0},children:(0,e.jsx)("i",{className:"fas fa-exclamation"})}),(0,e.jsxs)("div",{style:{textAlign:"left"},children:[(0,e.jsx)("div",{style:{fontWeight:600,color:r.dark,marginBottom:"4px"},children:"Service Temporarily Unavailable"}),(0,e.jsx)("div",{style:{fontSize:"13px",color:r.gray},children:Ue})]})]})}),(0,e.jsx)(yt,{children:(0,e.jsxs)(vt,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Deceased Name"}),(0,e.jsx)("th",{children:"Admission No."}),(0,e.jsx)("th",{children:"Date Admitted"}),(0,e.jsx)("th",{children:"Days in Morgue"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{style:{textAlign:"right"},children:"Action"})]})}),(0,e.jsx)("tbody",{children:H?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsxs)(Ce,{children:[(0,e.jsx)("div",{className:"spinner"})," Loading records..."]})})}):V?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsx)(Se,{children:"Unable to load records at this time. Please try again later."})})}):_.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,children:(0,e.jsx)(Se,{children:"No records found matching your filters."})})}):_.map(t=>{const o=t.full_name||t.name||"Unknown",s=t.deceased_id||t.id,n=t.admission_number||t.admission_no||"—",l=t.created_at||t.date_admitted||t.admission_date,c=ge(l),p=X(t.body_status||t.status),g=t.sex||t.gender||"",x=g.toLowerCase()==="female";return(0,e.jsxs)("tr",{onClick:()=>P(s),children:[(0,e.jsx)("td",{children:(0,e.jsxs)(zt,{children:[(0,e.jsx)($e,{$female:x,children:xe(o)}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontWeight:600},children:o}),(0,e.jsxs)("div",{className:"meta",children:[g?`${g}, `:"",t.age||"—"," yrs"]})]})]})}),(0,e.jsx)("td",{children:n}),(0,e.jsx)("td",{children:K(l)}),(0,e.jsxs)("td",{children:[c," days"]}),(0,e.jsx)("td",{children:(0,e.jsx)(ke,{$bg:p.bg,$color:p.color,$border:p.color+"40",children:p.label})}),(0,e.jsx)("td",{style:{textAlign:"right"},children:(0,e.jsx)(j,{$sm:!0,onClick:m=>{m.stopPropagation(),P(s)},children:"View Profile"})})]},s)})})]})}),(0,e.jsx)(jt,{children:H?(0,e.jsxs)(Ce,{children:[(0,e.jsx)("div",{className:"spinner"})," Loading records..."]}):V?(0,e.jsx)(ee,{style:{cursor:"default",textAlign:"center"},children:"Unable to load records at this time. Please try again later."}):_.length===0?(0,e.jsx)(ee,{style:{cursor:"default",textAlign:"center"},children:"No records found matching your filters."}):_.map(t=>{const o=t.full_name||t.name||"Unknown",s=t.deceased_id||t.id,n=t.admission_number||t.admission_no||"—",l=t.created_at||t.date_admitted||t.admission_date,c=ge(l),p=X(t.body_status||t.status),g=t.sex||t.gender||"",x=g.toLowerCase()==="female";return(0,e.jsxs)(ee,{onClick:()=>P(s),children:[(0,e.jsxs)($t,{children:[(0,e.jsxs)(kt,{children:[(0,e.jsx)($e,{$female:x,children:xe(o)}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontWeight:700,fontSize:16,color:r.black},children:o}),(0,e.jsxs)("div",{style:{fontSize:13,color:r.gray},children:[g?`${g}, `:"",t.age||"—"," yrs"]})]})]}),(0,e.jsx)(ke,{$bg:p.bg,$color:p.color,$border:p.color+"40",children:p.label})]}),(0,e.jsxs)(St,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"Admission No."}),(0,e.jsx)("strong",{children:n})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("span",{children:"Days in Morgue"}),(0,e.jsxs)("strong",{children:[c," days"]})]}),(0,e.jsxs)("div",{style:{gridColumn:"span 2"},children:[(0,e.jsx)("span",{children:"Date Admitted"}),(0,e.jsx)("strong",{children:K(l)})]})]}),(0,e.jsx)(Ct,{children:(0,e.jsx)(j,{$sm:!0,onClick:m=>{m.stopPropagation(),P(s)},children:"View Profile"})})]},s)})})]}),(0,e.jsx)(Et,{$open:J,onClick:()=>!b&&E(!1),children:(0,e.jsxs)(Dt,{onClick:t=>t.stopPropagation(),children:[(0,e.jsxs)(Rt,{children:[(0,e.jsx)("h2",{children:"Export Data to Excel"}),(0,e.jsx)(Ft,{onClick:()=>!b&&E(!1),children:"×"})]}),(0,e.jsxs)(_t,{children:[(0,e.jsxs)(ze,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," Select Time Range"]}),(0,e.jsxs)(Lt,{children:[(0,e.jsxs)(Ee,{children:[(0,e.jsx)(De,{children:"Start Date"}),(0,e.jsx)(Re,{type:"date",value:oe,onChange:t=>Be(t.target.value),disabled:b})]}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(De,{children:"End Date"}),(0,e.jsx)(Re,{type:"date",value:ie,onChange:t=>Ne(t.target.value),disabled:b})]})]}),(0,e.jsxs)(ze,{$mt4:!0,children:[(0,e.jsx)("span",{children:"02"})," Export History"]}),(0,e.jsx)("div",{style:{border:`1px solid ${r.borderLight}`,borderRadius:6,overflowX:"auto",WebkitOverflowScrolling:"touch"},children:(0,e.jsxs)(Mt,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Date Generated"}),(0,e.jsx)("th",{children:"Time Range"}),(0,e.jsx)("th",{children:"Format"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{children:"Action"})]})}),(0,e.jsx)("tbody",{children:le.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:5,style:{textAlign:"center",color:r.gray,padding:"24px"},children:"No export history available."})}):le.map((t,o)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:t.date}),(0,e.jsx)("td",{children:t.range}),(0,e.jsx)("td",{children:t.format}),(0,e.jsx)("td",{children:(0,e.jsx)(Pt,{$success:!0,children:t.status})}),(0,e.jsx)("td",{children:(0,e.jsx)(j,{$sm:!0,children:"Download"})})]},o))})]})})]}),(0,e.jsxs)(At,{children:[(0,e.jsx)(j,{onClick:()=>E(!1),disabled:b,children:"Cancel"}),(0,e.jsx)(j,{$export:!0,onClick:He,disabled:b,children:b?"Exporting...":"Generate Export"})]})]})}),b&&(0,e.jsxs)(It,{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"},children:[(0,e.jsx)("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:r.bgField,color:r.exportBtn,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:(0,e.jsx)("i",{className:"fas fa-file-export",style:{fontSize:14}})}),(0,e.jsx)("div",{style:{fontWeight:700,fontSize:14,color:r.dark,fontFamily:"Merriweather"},children:"Export Progress"})]}),(0,e.jsx)("div",{style:{width:"100%",height:"6px",background:r.bgField,borderRadius:"4px",overflow:"hidden",marginBottom:"8px"},children:(0,e.jsx)("div",{style:{width:`${D}%`,height:"100%",background:se==="Completed"?r.success:r.exportBtn,transition:"width 0.3s ease"}})}),(0,e.jsx)("div",{style:{fontSize:12,color:r.gray,marginBottom:"4px"},children:se}),(0,e.jsx)("div",{style:{fontSize:11,color:r.lightGray},children:D<100?`Attempt ${Math.ceil(D/10)} of 10`:"Complete"}),D>=80&&D<100&&(0,e.jsxs)("div",{style:{fontSize:11,color:r.warning,marginTop:"8px",fontStyle:"italic",display:"flex",alignItems:"center",gap:"4px"},children:[(0,e.jsx)("i",{className:"fas fa-exclamation-triangle"})," Taking longer than expected..."]})]})]})]})};export{Vt as default};
