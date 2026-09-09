import{r as Ce}from"./chunk-CXHxssQy.js";import{y as _e}from"./chunk-CXAmgOhv.js";import{u as Le}from"./chunk-DWc5g_hH.js";import{_ as a,h as Re,m as R}from"./chunk-DJYPtS2Y.js";import{o as Ie}from"./chunk-BY9AVXEY.js";import{K as te,Mn as ae,Ot as Me,Qt as ie,Vn as Fe,Vt as A,bt as De,i as w,ln as Ne,nn as ge,t as Ee,un as Ae,z as se,zn as Pe}from"./index-D6gguvjv.js";import"./chunk-DaNwstzZ.js";var o=Ce(_e(),1),e=Ie(),r={white:"#ffffff",offWhite:"#fafafa",gray50:"#f5f5f5",gray100:"#f0f0f0",gray200:"#e4e4e4",gray300:"#d1d1d1",gray400:"#a3a3a3",gray500:"#737373",gray600:"#525252",gray700:"#404040",gray800:"#262626",gray900:"#171717",accent:"#0d9488",accentLight:"#ccfbf1",accentDark:"#0f766e",red:"#ef4444",redLight:"#fef2f2",amber:"#f59e0b",amberLight:"#fffbeb",green:"#22c55e",greenLight:"#f0fdf4",blue:"#3b82f6",blueLight:"#eff6ff"},k={open:{label:"Open",color:r.green,bg:r.greenLight},in_progress:{label:"In Progress",color:r.amber,bg:r.amberLight},resolved:{label:"Resolved",color:r.accent,bg:r.accentLight},closed:{label:"Closed",color:r.gray400,bg:r.gray100}},u={help:{label:"Question",color:r.blue,bg:r.blueLight},bug:{label:"Bug Report",color:r.red,bg:r.redLight},feature:{label:"Suggestion",color:"#16a34a",bg:r.greenLight},other:{label:"General",color:r.gray600,bg:r.gray100}},Ue=[{id:"all",label:"All"},{id:"open",label:"Open"},{id:"in_progress",label:"In Progress"},{id:"resolved",label:"Resolved"},{id:"closed",label:"Closed"}];function P(i){if(!i)return"";const d=new Date(i);if(isNaN(d.getTime()))return"";const c=Date.now()-d.getTime(),g=Math.floor(c/6e4);if(g<1)return"Just now";if(g<60)return`${g}m ago`;const y=Math.floor(c/36e5);return y<24?`${y}h ago`:d.toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}function Be(i){if(!i)return"";const d=new Date(i);return isNaN(d.getTime())?"":d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}function U(i,d){const c=(i&&i.trim()||d||"?").replace(/[^\w\s@]/g,"").split(/[\s@._]+/).filter(Boolean);return c.length===0?"?":c.length===1?c[0].substring(0,2).toUpperCase():(c[0][0]+c[1][0]).toUpperCase()}function ne(){try{return JSON.parse(localStorage.getItem("user")||"{}")}catch{return{}}}var Ge=Re`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`,He=R`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Oe=R`
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`,qe=R`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`,Ye=R`
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.7); opacity: 0; }
`,Ke=a.div`
  display: flex;
  height: calc(100vh - 150px);
  min-height: 600px;
  background: ${r.white};
  border: 1px solid ${r.gray200};
  border-radius: 16px;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  color: ${r.gray800};

  @media (max-width: 860px) {
    height: calc(100vh - 110px);
    min-height: 480px;
    border-radius: 12px;
  }
`,Ve=a.aside`
  width: 250px;
  background: ${r.white};
  border-right: 1px solid ${r.gray200};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 860px) { display: none; }
`,We=a.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${r.gray100};
`,Je=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: ${r.gray900};
  display: flex;
  align-items: center;
  gap: 10px;
`,Qe=a.div`
  width: 32px;
  height: 32px;
  background: ${r.gray900};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${r.white};
  flex-shrink: 0;
`,Xe=a.nav`
  padding: 12px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
`,oe=a.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${r.gray400};
  padding: 12px 12px 6px;
`,B=a.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  color: ${r.gray600};
  transition: all 0.2s ease;
  user-select: none;

  &:hover { background: ${r.gray50}; color: ${r.gray800}; }

  ${i=>i.$active&&`background: ${r.accentLight}; color: ${r.accentDark};`}
`,Ze=a.span`
  margin-left: auto;
  background: ${r.red};
  color: ${r.white};
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
`,er=a.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${i=>i.$on?"#16a34a":r.gray400};
  background: ${i=>i.$on?r.greenLight:r.gray100};
  border-radius: 99px;
  padding: 2px 8px;
`,rr=a.span`
  width: 7px;
  height: 7px;
  background: ${i=>i.$on?r.green:r.gray400};
  border-radius: 50%;
  display: inline-block;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: ${i=>i.$on?r.green:"transparent"};
    opacity: 0.3;
    animation: ${Ye} 2s ease infinite;
  }
`,tr=a.div`
  padding: 14px 16px;
  border-top: 1px solid ${r.gray100};
  display: flex;
  align-items: center;
  gap: 10px;
`,ar=a.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${r.gray200};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: ${r.gray600};
  flex-shrink: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: ${i=>i.$online?r.green:r.gray400};
    border: 2px solid ${r.white};
    border-radius: 50%;
  }
`,ir=a.div`flex: 1; min-width: 0;`,sr=a.div`
  font-size: 13px; font-weight: 600; color: ${r.gray800};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`,nr=a.div`font-size: 11px; color: ${r.gray400};`,or=a.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`,lr=a.div`
  padding: 14px 24px;
  border-bottom: 1px solid ${r.gray200};
  display: flex;
  align-items: center;
  gap: 14px;
  background: ${r.white};
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 640px) { padding: 12px 16px; }
`,dr=a.div`display: flex; flex-direction: column;`,cr=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${r.gray900};
  line-height: 1.2;
`,pr=a.div`
  font-size: 11.5px;
  color: ${r.gray400};
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
`,xr=a.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${r.gray50};
  border: 1px solid ${r.gray200};
  border-radius: 8px;
  padding: 7px 12px;
  width: 240px;
  transition: all 0.2s ease;
  margin-left: auto;

  &:focus-within {
    border-color: ${r.accent};
    background: ${r.white};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: ${r.gray800}; width: 100%; font-family: inherit;
    &::placeholder { color: ${r.gray400}; }
  }

  @media (max-width: 640px) { width: 150px; }
`,_=a.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
  user-select: none;

  ${i=>i.$variant==="accent"&&`background: ${r.accent}; color: ${r.white}; &:hover:not(:disabled){background:${r.accentDark};}`}

  ${i=>i.$variant==="ghost"&&`background: transparent; color: ${r.gray600}; border: 1px solid ${r.gray200}; &:hover:not(:disabled){background:${r.gray50};border-color:${r.gray300};}`}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,gr=a.div`
  flex: 1;
  overflow: hidden;
  display: flex;
`,fr=a.div`
  width: 400px;
  border-right: 1px solid ${r.gray200};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 860px) { width: 320px; }
  @media (max-width: 640px) {
    width: 100%;
    max-height: 40%;
    border-right: none;
    border-bottom: 1px solid ${r.gray200};
  }
`,hr=a.div`
  padding: 12px 14px;
  display: flex;
  gap: 6px;
  border-bottom: 1px solid ${r.gray100};
  flex-shrink: 0;
  flex-wrap: wrap;
`,ur=a.div`
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${r.gray200};
  background: ${r.white};
  color: ${r.gray600};
  transition: all 0.2s ease;
  user-select: none;

  &:hover { border-color: ${r.gray300}; }

  ${i=>i.$active&&`background:${r.gray900}; color:${r.white}; border-color:${r.gray900};`}
`,mr=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${r.gray300}; border-radius: 10px; }
`,yr=a.div`
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  margin-bottom: 2px;

  &:hover { background: ${r.gray50}; }

  ${i=>i.$active&&`background:${r.gray50}; border-color:${r.gray200}; box-shadow:0 1px 2px rgba(0,0,0,0.04);`}
`,br=a.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`,le=a.span`
  font-size: 11px;
  font-weight: 600;
  color: ${r.gray400};
  font-family: 'Space Grotesk', sans-serif;
`,de=a.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${i=>i.$color||r.gray300};
`,ce=a.span`
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${i=>i.$bg};
  color: ${i=>i.$color};
`,vr=a.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${r.gray800};
  margin-bottom: 4px;
  line-height: 1.4;
`,$r=a.div`
  font-size: 12px;
  color: ${r.gray400};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`,jr=a.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`,wr=a.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${r.gray200};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: ${r.gray500};
  flex-shrink: 0;
`,pe=a.span`
  font-size: 11px;
  color: ${r.gray400};
  display: inline-flex;
  align-items: center;
  gap: 4px;

  ${i=>i.$right&&"margin-left: auto;"}
`,kr=a.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`,Sr=a.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${r.gray200};
  flex-shrink: 0;
`,zr=a.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  flex-wrap: wrap;
`,Tr=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: ${r.gray900};
  margin-top: 2px;
`,Cr=a.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: ${r.gray400};
  flex-wrap: wrap;

  span { display: inline-flex; align-items: center; gap: 5px; }
`,_r=a.select`
  padding: 4px 8px;
  border: 1px solid ${r.gray200};
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 600;
  color: ${r.gray700};
  background: ${r.white};
  outline: none;
  cursor: pointer;

  &:focus { border-color: ${r.accent}; }
`,Lr=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${r.gray300}; border-radius: 10px; }
`,Rr=a.div`
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  animation: ${He} 0.3s ease;
`,Ir=a.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${i=>i.$staff?r.accentLight:r.gray200};
  color: ${i=>i.$staff?r.accentDark:r.gray600};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
`,Mr=a.div`flex: 1; min-width: 0;`,Fr=a.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`,Dr=a.span`font-size: 13px; font-weight: 600; color: ${r.gray800};`,Nr=a.span`
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${r.accentLight};
  color: ${r.accentDark};
`,Er=a.span`font-size: 11px; color: ${r.gray400}; margin-left: auto; white-space: nowrap;`,Ar=a.div`
  font-size: 13.5px;
  color: ${r.gray700};
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
`,Pr=a.div`
  padding: 14px 22px 16px;
  border-top: 1px solid ${r.gray200};
  flex-shrink: 0;
  background: ${r.white};
`,Ur=a.div`
  border: 1px solid ${r.gray200};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${r.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  textarea {
    width: 100%;
    padding: 12px 14px;
    border: none;
    outline: none;
    font-size: 13.5px;
    font-family: inherit;
    resize: none;
    color: ${r.gray800};
    background: transparent;
    line-height: 1.6;
    min-height: 56px;
    max-height: 120px;
    &::placeholder { color: ${r.gray400}; }
  }
`,Br=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-top: 1px solid ${r.gray100};
  background: ${r.gray50};
`,Gr=a.span`font-size: 11px; color: ${r.gray400};`,L=a.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${r.gray400};
  padding: 40px;
  text-align: center;

  p { font-size: 14px; margin-top: 4px; }
`,Hr=a.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
`,Or=a.div`
  background: ${r.white};
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.08);
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${Oe} 0.25s ease;
  font-family: 'DM Sans', sans-serif;
`,qr=a.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${r.gray100};
  display: flex;
  align-items: center;
  justify-content: space-between;
`,Yr=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: ${r.gray900};
`,Kr=a.button`
  width: 30px; height: 30px;
  border-radius: 8px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: ${r.gray400}; transition: all 0.2s ease;

  &:hover { background: ${r.gray100}; color: ${r.gray600}; }
`,Vr=a.div`padding: 20px 24px;`,G=a.div`margin-bottom: 16px;`,H=a.label`
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: ${r.gray700};
  margin-bottom: 6px;
`,O=`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  font-size: 13.5px;
  font-family: inherit;
  color: #262626;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }
`,Wr=a.input`${O}`,Jr=a.select`${O}`,Qr=a.textarea`
  ${O}
  resize: vertical;
  min-height: 110px;
  line-height: 1.6;
`,Xr=a.div`
  padding: 16px 24px 20px;
  border-top: 1px solid ${r.gray100};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`,Zr=a.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
`,et=a.div`
  padding: 12px 18px;
  background: ${r.gray900};
  color: ${r.white};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  animation: ${qe} 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;
`,xe=a(ge)`
  animation: spin 1s linear infinite;
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
`,lt=()=>{const{slug:i}=Le(),d=i||localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||"system_shared",{socket:c,connected:g}=Ee(),[y,q]=(0,o.useState)([]),[fe,he]=(0,o.useState)(!0),[I,ue]=(0,o.useState)("all"),[M,me]=(0,o.useState)(""),[m,Y]=(0,o.useState)(null),[S,K]=(0,o.useState)([]),[ye,V]=(0,o.useState)(!1),[F,D]=(0,o.useState)(""),[N,W]=(0,o.useState)(!1),[be,b]=(0,o.useState)(!1),[f,z]=(0,o.useState)({subject:"",type:"help",message:""}),[J,Q]=(0,o.useState)(!1),[ve,X]=(0,o.useState)([]),$e=(0,o.useRef)(0),h=(0,o.useRef)(null),Z=(0,o.useRef)(null);h.current=m;const x=(0,o.useCallback)(t=>{const s=++$e.current;X(n=>[...n.slice(-3),{id:s,message:t}]),setTimeout(()=>X(n=>n.filter($=>$.id!==s)),3500)},[]),p=(0,o.useCallback)(async()=>{try{const t=await w.get(`/support/tickets?tenant=${encodeURIComponent(d)}`,{headers:{"x-tenant-slug":d}});t.data?.success&&Array.isArray(t.data.tickets)?q(t.data.tickets):Array.isArray(t.data)&&q(t.data)}catch(t){console.warn("[Support] Failed to fetch tickets:",t?.message)}finally{he(!1)}},[d]),j=(0,o.useCallback)(async t=>{if(t)try{const s=await w.get(`/support/tickets/${t}/replies`,{headers:{"x-tenant-slug":d}});s.data?.success&&Array.isArray(s.data.replies)&&String(h.current)===String(t)&&K(s.data.replies)}catch(s){console.warn("[Support] Failed to fetch replies:",s?.message)}},[d]);(0,o.useEffect)(()=>{p()},[p]),(0,o.useEffect)(()=>{const t=setInterval(p,3e4);return()=>clearInterval(t)},[p]),(0,o.useEffect)(()=>{if(!c)return;const t=(n={})=>{p();const $=n.ticketId;(!$||String($)===String(h.current))&&h.current&&j(h.current)},s=(n={})=>{n.userType==="admin"&&(x(n.message||"New response from the support team"),p(),(!n.ticketId||String(n.ticketId)===String(h.current))&&h.current&&j(h.current))};return c.on("ticket_updated",t),c.on("ticket_response",s),()=>{c.off("ticket_updated",t),c.off("ticket_response",s)}},[c,p,j,x]);const je=t=>{Y(t.ticket_id),K([]),D(""),V(!0),j(t.ticket_id).finally(()=>V(!1))},ee=async()=>{const t=F.trim();if(!(!t||!m||N)){W(!0);try{await w.post(`/support/tickets/${m}/reply`,{message:t,userType:"tenant"},{headers:{"x-tenant-slug":d}}),D(""),x("Reply sent"),await j(m),p()}catch(s){console.warn("[Support] Reply failed:",s?.message),x("Failed to send reply. Please try again.")}finally{W(!1)}}},we=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),ee())},ke=async()=>{const t=f.subject.trim(),s=f.message.trim();if(!t){x("Please enter a subject");return}if(!s){x("Please describe your issue");return}Q(!0);try{const n=ne(),$=localStorage.getItem("tenantName")||(()=>{try{return JSON.parse(localStorage.getItem("tenantData")||"{}").name}catch{return null}})()||"Unknown Tenant",E=await w.post("/support/tickets",{type:f.type,subject:t.substring(0,200),message:s,tenantName:$,userEmail:n.email||"",userName:n.full_name||n.name||""},{headers:{"x-tenant-slug":d}});b(!1),z({subject:"",type:"help",message:""}),x(`Ticket #${E.data?.ticketId??""} created`),await p(),E.data?.ticketId&&Y(E.data.ticketId)}catch(n){console.warn("[Support] Create failed:",n?.message),x(n?.response?.data?.message||"Failed to submit ticket")}finally{Q(!1)}},Se=async(t,s)=>{try{await w.request({method:"PATCH",url:`/support/tickets/${t}`,data:{status:s},headers:{"x-tenant-slug":d}}),x(`Ticket #${t} marked as ${k[s]?.label||s}`),p()}catch(n){console.warn("[Support] Status update failed:",n?.message),x("Failed to update status")}},v=ne(),ze=v.full_name||v.name||v.email||"You",Te=U(v.full_name||v.name,v.email),re=y.filter(t=>t.status==="open"||t.status==="in_progress").length,T=y.filter(t=>{if(I!=="all"&&t.status!==I)return!1;if(!M.trim())return!0;const s=M.toLowerCase();return String(t.ticket_id).includes(s)||(t.subject||"").toLowerCase().includes(s)||(t.message||"").toLowerCase().includes(s)||(t.user_name||"").toLowerCase().includes(s)}),l=y.find(t=>String(t.ticket_id)===String(m))||null,C=[];return l&&(C.push({key:"ticket-body",name:l.user_name||l.user_email||"User",staff:!1,text:l.message,time:l.created_at}),S.forEach(t=>{const s=t.user_type==="admin";C.push({key:`reply-${t.reply_id}`,name:s?"Support Team":l.user_name||"You",staff:s,text:t.message,time:t.created_at})})),(0,o.useEffect)(()=>{const t=Z.current;t&&t.scrollIntoView({behavior:"smooth",block:"end"})},[S.length,m]),(0,e.jsxs)("div",{style:{padding:"4px 2px"},children:[(0,e.jsx)(Ge,{}),(0,e.jsxs)(Ke,{children:[(0,e.jsxs)(Ve,{children:[(0,e.jsx)(We,{children:(0,e.jsxs)(Je,{children:[(0,e.jsx)(Qe,{children:(0,e.jsx)(De,{size:15})}),"SupportHub"]})}),(0,e.jsxs)(Xe,{children:[(0,e.jsx)(oe,{children:"Support"}),(0,e.jsxs)(B,{$active:!0,children:[(0,e.jsx)(A,{size:14})," Tickets",re>0&&(0,e.jsx)(Ze,{children:re})]}),(0,e.jsx)(oe,{style:{marginTop:8},children:"Actions"}),(0,e.jsxs)(B,{onClick:()=>b(!0),children:[(0,e.jsx)(ie,{size:14})," New Ticket"]}),(0,e.jsxs)(B,{onClick:p,children:[(0,e.jsx)(ge,{size:14})," Refresh"]})]}),(0,e.jsxs)(tr,{children:[(0,e.jsx)(ar,{$online:g,children:Te}),(0,e.jsxs)(ir,{children:[(0,e.jsx)(sr,{children:ze}),(0,e.jsx)(nr,{children:"Tenant Account"})]})]})]}),(0,e.jsxs)(or,{children:[(0,e.jsxs)(lr,{children:[(0,e.jsxs)(dr,{children:[(0,e.jsx)(cr,{children:"Tickets"}),(0,e.jsxs)(pr,{children:[T.length," ticket",T.length!==1?"s":""," ","· updates in real time"]})]}),(0,e.jsxs)(xr,{children:[(0,e.jsx)(Ne,{size:13}),(0,e.jsx)("input",{placeholder:"Search tickets...",value:M,onChange:t=>me(t.target.value)})]}),(0,e.jsxs)(er,{$on:g,children:[(0,e.jsx)(rr,{$on:g}),g?"LIVE":"OFFLINE"]}),(0,e.jsxs)(_,{$variant:"accent",onClick:()=>b(!0),children:[(0,e.jsx)(ie,{size:13})," New Ticket"]})]}),(0,e.jsxs)(gr,{children:[(0,e.jsxs)(fr,{children:[(0,e.jsx)(hr,{children:Ue.map(t=>(0,e.jsx)(ur,{$active:I===t.id,onClick:()=>ue(t.id),children:t.label},t.id))}),(0,e.jsx)(mr,{children:fe?(0,e.jsxs)(L,{children:[(0,e.jsx)(xe,{size:26}),(0,e.jsx)("p",{children:"Loading tickets..."})]}):T.length===0?(0,e.jsxs)(L,{children:[(0,e.jsx)(Me,{size:38}),(0,e.jsx)("p",{children:"No tickets found"}),(0,e.jsx)("p",{style:{fontSize:12},children:"Create a new ticket to get help from our team."})]}):T.map(t=>{const s=k[t.status]||k.open,n=u[t.type]||u.help;return(0,e.jsxs)(yr,{$active:String(m)===String(t.ticket_id),onClick:()=>je(t),children:[(0,e.jsxs)(br,{children:[(0,e.jsx)(de,{$color:s.color}),(0,e.jsxs)(le,{children:["#",t.ticket_id]}),(0,e.jsx)(ce,{$bg:n.bg,$color:n.color,children:n.label})]}),(0,e.jsx)(vr,{children:t.subject}),(0,e.jsx)($r,{children:t.message}),(0,e.jsxs)(jr,{children:[(0,e.jsx)(wr,{children:U(t.user_name,t.user_email)}),(0,e.jsxs)(pe,{children:[(0,e.jsx)(ae,{size:10})," ",t.user_name||t.user_email||"User"]}),(0,e.jsxs)(pe,{$right:!0,children:[(0,e.jsx)(te,{size:10})," ",P(t.created_at)]})]})]},t.ticket_id)})})]}),(0,e.jsx)(kr,{children:l?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(Sr,{children:[(0,e.jsxs)(zr,{children:[(0,e.jsx)(de,{$color:(k[l.status]||k.open).color}),(0,e.jsxs)(le,{style:{fontSize:13},children:["#",l.ticket_id]}),(0,e.jsx)(ce,{$bg:(u[l.type]||u.help).bg,$color:(u[l.type]||u.help).color,children:(u[l.type]||u.help).label}),(0,e.jsxs)(_r,{style:{marginLeft:"auto"},value:l.status||"open",onChange:t=>Se(l.ticket_id,t.target.value),children:[(0,e.jsx)("option",{value:"open",children:"Open"}),(0,e.jsx)("option",{value:"in_progress",children:"In Progress"}),(0,e.jsx)("option",{value:"resolved",children:"Resolved"}),(0,e.jsx)("option",{value:"closed",children:"Closed"})]})]}),(0,e.jsx)(Tr,{children:l.subject}),(0,e.jsxs)(Cr,{children:[(0,e.jsxs)("span",{children:[(0,e.jsx)(ae,{size:11})," ",l.user_name||l.user_email||"User"]}),(0,e.jsxs)("span",{children:[(0,e.jsx)(te,{size:11})," ",P(l.created_at)]}),(0,e.jsxs)("span",{children:[(0,e.jsx)(A,{size:11})," ",S.length," repl",S.length===1?"y":"ies"]}),g&&(0,e.jsxs)("span",{style:{color:"#16a34a"},children:[(0,e.jsx)(Pe,{size:11})," Live"]})]})]}),(0,e.jsx)(Lr,{children:ye&&C.length<=1?(0,e.jsxs)(L,{style:{padding:20},children:[(0,e.jsx)(xe,{size:20}),(0,e.jsx)("p",{children:"Loading conversation..."})]}):(0,e.jsxs)(e.Fragment,{children:[C.map(t=>(0,e.jsxs)(Rr,{children:[(0,e.jsx)(Ir,{$staff:t.staff,children:U(t.name)}),(0,e.jsxs)(Mr,{children:[(0,e.jsxs)(Fr,{children:[(0,e.jsx)(Dr,{children:t.name}),t.staff&&(0,e.jsx)(Nr,{children:"STAFF"}),(0,e.jsxs)(Er,{children:[Be(t.time)," · ",P(t.time)]})]}),(0,e.jsx)(Ar,{children:t.text})]})]},t.key)),(0,e.jsx)("div",{ref:Z})]})}),(0,e.jsx)(Pr,{children:(0,e.jsxs)(Ur,{children:[(0,e.jsx)("textarea",{placeholder:"Write a reply... (Enter to send, Shift+Enter for a new line)",rows:2,value:F,onChange:t=>D(t.target.value),onKeyDown:we}),(0,e.jsxs)(Br,{children:[(0,e.jsx)(Gr,{children:"Replies reach the support team instantly"}),(0,e.jsx)(_,{$variant:"accent",onClick:ee,disabled:!F.trim()||N,children:N?"Sending...":(0,e.jsxs)(e.Fragment,{children:[" Reply ",(0,e.jsx)(Ae,{size:12})]})})]})]})})]}):(0,e.jsxs)(L,{children:[(0,e.jsx)(A,{size:40}),(0,e.jsx)("p",{children:"Select a ticket to view the conversation"})]})})]})]})]}),be&&(0,e.jsx)(Hr,{onClick:t=>{t.target===t.currentTarget&&b(!1)},children:(0,e.jsxs)(Or,{children:[(0,e.jsxs)(qr,{children:[(0,e.jsx)(Yr,{children:"Create New Ticket"}),(0,e.jsx)(Kr,{onClick:()=>b(!1),children:(0,e.jsx)(Fe,{size:15})})]}),(0,e.jsxs)(Vr,{children:[(0,e.jsxs)(G,{children:[(0,e.jsx)(H,{children:"Subject"}),(0,e.jsx)(Wr,{placeholder:"Brief description of the issue",value:f.subject,onChange:t=>z({...f,subject:t.target.value})})]}),(0,e.jsxs)(G,{children:[(0,e.jsx)(H,{children:"Type"}),(0,e.jsxs)(Jr,{value:f.type,onChange:t=>z({...f,type:t.target.value}),children:[(0,e.jsx)("option",{value:"help",children:"Question"}),(0,e.jsx)("option",{value:"bug",children:"Bug Report"}),(0,e.jsx)("option",{value:"feature",children:"Suggestion"}),(0,e.jsx)("option",{value:"other",children:"General"})]})]}),(0,e.jsxs)(G,{children:[(0,e.jsx)(H,{children:"Description"}),(0,e.jsx)(Qr,{placeholder:"Detailed description of your question or issue...",value:f.message,onChange:t=>z({...f,message:t.target.value})})]})]}),(0,e.jsxs)(Xr,{children:[(0,e.jsx)(_,{$variant:"ghost",onClick:()=>b(!1),children:"Cancel"}),(0,e.jsx)(_,{$variant:"accent",onClick:ke,disabled:J,children:J?"Creating...":(0,e.jsxs)(e.Fragment,{children:[" Create Ticket ",(0,e.jsx)(se,{size:13})]})})]})]})}),(0,e.jsx)(Zr,{children:ve.map(t=>(0,e.jsxs)(et,{children:[(0,e.jsx)(se,{size:14})," ",t.message]},t.id))})]})};export{lt as default};
