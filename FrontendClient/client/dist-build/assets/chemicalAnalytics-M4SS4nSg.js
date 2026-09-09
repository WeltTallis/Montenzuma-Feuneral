import{r as wr}from"./chunk-CXHxssQy.js";import{y as Cr}from"./chunk-CXAmgOhv.js";import{_ as a,g as ge,m as w}from"./chunk-DJYPtS2Y.js";import{a as j}from"./chunk-CwzAxjA3.js";import{o as _r}from"./chunk-BY9AVXEY.js";import{C as re,In as Fr,K as we,Qt as te,Un as Sr,Vn as ae,Yt as se,_ as Xe,b as Ce,ft as Ye,g as ne,i as W,in as zr,m as Lr,nn as Pe,on as Br}from"./index-D6gguvjv.js";var d=wr(Cr(),1),e=_r(),t={bg:"#F8FAFC",surface:"#FFFFFF",surfaceHover:"#F1F5F9",border:"#E2E8F0",borderLight:"#F1F5F9",text:"#0F172A",textBody:"#334155",textSecondary:"#64748B",textMuted:"#94A3B8",textFaint:"#CBD5E1",primary:"#2563EB",primaryBg:"#EFF6FF",primaryLight:"#93C5FD",success:"#059669",successBg:"#ECFDF5",successLight:"#6EE7B7",warning:"#D97706",warningBg:"#FFFBEB",warningLight:"#FCD34D",danger:"#DC2626",dangerBg:"#FEF2F2",dangerLight:"#FCA5A5",purple:"#7C3AED",purpleBg:"#F5F3FF",purpleLight:"#C4B5FD",cyan:"#0891B2",cyanBg:"#ECFEFF",cyanLight:"#67E8F9",orange:"#EA580C",orangeBg:"#FFF7ED",orangeLight:"#FDBA74",teal:"#0D9488",tealBg:"#F0FDFA",tealLight:"#5EEAD4",chartColors:["#2563EB","#7C3AED","#0891B2","#059669","#D97706","#DC2626","#DB2777","#EA580C"]},I=w`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`,Dr=w`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Ar=w`
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
`,Er=w`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`,ar=w`
  from { width: 0%; }
`,Mr=w`
  to { transform: rotate(360deg); }
`;w`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;var Pr=w`
  from { opacity: 0; }
  to { opacity: 1; }
`,_e=n=>n?n.split(" ").filter(Boolean).slice(0,2).map(y=>y[0]).join("").toUpperCase():"??",Fe=n=>n==null||isNaN(n)?{text:"—",type:"info"}:n<=3?{text:`${n}d gap`,type:"success"}:n<=7?{text:`${n}d gap`,type:"info"}:n<=14?{text:`${n}d gap`,type:"warn"}:{text:`${n}d gap`,type:"danger"},Rr=n=>{if(!n)return"—";const y=Math.max(0,Date.now()-new Date(n).getTime()),b=Math.floor(y/6e4);if(b<1)return"Just now";if(b<60)return`${b}m ago`;const N=Math.floor(b/60);if(N<24)return`${N}h ago`;const Q=Math.floor(N/24);return Q<30?`${Q}d ago`:`${Math.floor(Q/30)}mo ago`},Qe=a.div`
  min-height: 100vh;
  background: ${t.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: ${t.text};
  padding: 1.25rem 1.75rem;
  max-width: 1400px;
  margin: 0 auto;
`,Tr=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  animation: ${I} 0.2s ease-out;
`,qr=a.div``,Ir=a.h1`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${t.text};
`,Nr=a.p`
  font-size: 0.8125rem;
  color: ${t.textSecondary};
  margin: 0.25rem 0 0;
`,Ur=a.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`,ie=a.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid ${t.border};
  background: ${t.surface};
  color: ${t.textBody};

  &:hover { background: ${t.surfaceHover}; border-color: ${t.textMuted}; }

  ${n=>n.$variant==="primary"&&ge`
    background: ${t.primary}; color: white; border-color: ${t.primary};
    &:hover { background: #1D4ED8; box-shadow: 0 1px 3px rgba(37,99,235,0.3); }
  `}
`,Hr=a.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
  margin-bottom: 1.25rem;
  animation: ${I} 0.25s ease-out;

  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`,oe=a.div`
  background: ${n=>n.$bg||t.surface};
  border-radius: 10px;
  padding: 1rem 1.125rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.15s ease;
  animation: ${I} 0.3s ease-out;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
`,le=a.div``,ce=a.div`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${n=>n.$light?"rgba(255,255,255,0.75)":t.textSecondary};
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`,de=a.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${n=>n.$light?"#fff":t.text};
  line-height: 1;
  animation: ${Dr} 0.4s ease-out;
`,he=a.div`
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-top: 0.375rem;
  color: ${n=>n.$light?"rgba(255,255,255,0.7)":n.$up?t.success:t.danger};
`,xe=a.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${n=>n.$light?"rgba(255,255,255,0.2)":n.$bg};
  color: ${n=>n.$light?"#fff":n.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,Ke=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
  margin-bottom: 1.25rem;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`,ue=a.div`
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: 10px;
  overflow: hidden;
  animation: ${I} 0.3s ease-out;
`,M=a.div`
  padding: 0.875rem 1.125rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${t.borderLight};
`,P=a.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${t.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`,R=a.span`
  font-size: 0.6875rem;
  color: ${t.textMuted};
  font-weight: 500;
`,pe=a.div`
  padding: 1.125rem;
`,Or=a.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`,Vr=a.svg`
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.04));
`,Wr=a.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`,Gr=a.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${t.text};
  line-height: 1;
`,Xr=a.div`
  font-size: 0.625rem;
  color: ${t.textMuted};
  margin-top: 0.125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`,Yr=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`,Qr=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
`,Kr=a.div`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${n=>n.$color};
  flex-shrink: 0;
`,Jr=a.div`
  flex: 1;
  font-size: 0.75rem;
  color: ${t.textBody};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`,Zr=a.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.text};
  white-space: nowrap;
`,et=a.div`
  font-size: 0.6875rem;
  color: ${t.textMuted};
  width: 32px;
  text-align: right;
`,rt=a.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,tt=a.div``,at=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
`,st=a.div`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${t.textBody};
`,nt=a.div`
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${t.text};
`,it=a.div`
  height: 8px;
  background: ${t.borderLight};
  border-radius: 10px;
  overflow: hidden;
`,ot=a.div`
  height: 100%;
  border-radius: 10px;
  background: ${n=>n.$color};
  width: ${n=>n.$width}%;
  animation: ${ar} 0.8s ease-out;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
    border-radius: 0 10px 10px 0;
  }
`,lt=a.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  &:last-child { margin-bottom: 0; }
`,ct=a.div`
  width: 70px;
  font-size: 0.75rem;
  color: ${t.textSecondary};
  text-align: right;
  flex-shrink: 0;
`,dt=a.div`
  flex: 1;
  height: 28px;
  background: ${t.borderLight};
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`,ht=a.div`
  height: 100%;
  border-radius: 6px;
  background: ${n=>n.$color};
  width: ${n=>n.$width}%;
  animation: ${ar} 0.6s ease-out;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: fit-content;
  transition: width 0.3s ease;
`,xt=a.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
`,ut=a.div`
  width: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.text};
  flex-shrink: 0;
`,pt=a.div`
  display: flex;
  flex-direction: column;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: ${t.textMuted}; }
  scrollbar-width: thin;
  scrollbar-color: ${t.border} transparent;
`,gt=a.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${t.borderLight};
  animation: ${Ar} 0.25s ease-out;
  &:last-child { border-bottom: none; }
`,mt=a.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${n=>n.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
`,vt=a.div`
  flex: 1;
  min-width: 0;
`,ft=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`,jt=a.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.text};
`,yt=a.span`
  font-size: 0.6875rem;
  color: ${t.textMuted};
  white-space: nowrap;
`,bt=a.div`
  font-size: 0.75rem;
  color: ${t.textSecondary};
  margin-top: 0.0625rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,$t=a.div`
  display: flex;
  gap: 0.375rem;
  margin-top: 0.375rem;
  flex-wrap: wrap;
`,T=a.span`
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.4375rem;
  border-radius: 4px;
  ${n=>{const y={info:{bg:t.primaryBg,color:t.primary},warn:{bg:t.warningBg,color:t.warning},success:{bg:t.successBg,color:t.success},danger:{bg:t.dangerBg,color:t.danger}},b=y[n.$type]||y.info;return ge`background: ${b.bg}; color: ${b.color};`}}
`,Je=a.table`
  width: 100%;
  border-collapse: collapse;
`,v=a.th`
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${t.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid ${t.border};
`,Ze=a.tr`
  border-bottom: 1px solid ${t.borderLight};
  transition: background 0.1s ease;
  &:last-child { border-bottom: none; }
  &:hover { background: ${t.surfaceHover}; }
`,g=a.td`
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: ${t.textBody};
  vertical-align: middle;
`,er=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,rr=a.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${n=>n.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  flex-shrink: 0;
`,kt=a.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${n=>n.$up?t.success:t.danger};
`,tr=a.div`
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  animation: ${I} 0.3s ease-out;
`,wt=a.div`
  background: ${t.dangerBg};
  border: 1px solid ${t.dangerLight};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  animation: ${I} 0.3s ease-out;
`,Ct=a.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${t.danger};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,_t=a.div`
  flex: 1;
  min-width: 0;
`,Ft=a.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${t.danger};
  margin: 0 0 0.25rem;
`,St=a.p`
  font-size: 0.8125rem;
  color: ${t.textBody};
  margin: 0 0 0.5rem;
  line-height: 1.5;
`,zt=a.p`
  font-size: 0.75rem;
  color: ${t.textSecondary};
  margin: 0;
  font-weight: 500;
`,Lt=a.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid ${t.danger};
  background: white;
  color: ${t.danger};
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  &:hover { background: ${t.danger}; color: white; }
`,Bt=a.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 0.75rem;
`,Dt=a(Pe)`
  animation: ${Mr} 1s linear infinite;
`,Se=a.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: ${Pr} 0.15s ease;
`,ze=a.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  max-width: 92vw;
  background: ${t.surface};
  border-left: 1px solid ${t.border};
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  animation: ${Er} 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
`,Le=a.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${t.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`,Be=a.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${t.text};
`,De=a.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${t.border};
  background: ${t.surface};
  color: ${t.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  &:hover { border-color: ${t.danger}; color: ${t.danger}; background: ${t.dangerBg}; }
`,Ae=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }
`,Ee=a.div`
  padding: 14px 24px;
  border-top: 1px solid ${t.border};
  background: ${t.bg};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`,q=a.button`
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
  text-align: center;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  ${n=>n.$variant==="primary"&&ge`
    background: ${t.primary}; color: white;
    &:hover { background: #1D4ED8; }
  `}
  ${n=>n.$variant==="ghost"&&ge`
    background: ${t.surface}; color: ${t.textSecondary}; border: 1px solid ${t.border};
    &:hover { color: ${t.text}; border-color: ${t.textMuted}; }
  `}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,G=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`,F=a.div`
  margin-bottom: 16px;
`,h=a.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.text};
  margin-bottom: 4px;
  display: block;
`,$=a.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${t.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${t.text};
  background: ${t.surface};
  &:focus { border-color: ${t.primary}; box-shadow: 0 0 0 3px ${t.primaryBg}; }
  &::placeholder { color: ${t.textFaint}; }
`,X=a.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${t.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${t.text};
  background: ${t.surface};
  cursor: pointer;
  &:focus { border-color: ${t.primary}; box-shadow: 0 0 0 3px ${t.primaryBg}; }
`,Me=a.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${t.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${t.text};
  background: ${t.surface};
  resize: vertical;
  min-height: 60px;
  &:focus { border-color: ${t.primary}; box-shadow: 0 0 0 3px ${t.primaryBg}; }
`,Y=a.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${t.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${t.borderLight};
`,At=a.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${t.dangerBg};
  border: 1px solid ${t.dangerLight};
  border-left: 4px solid ${t.danger};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`,Et=a.div`
  flex: 1;
  min-width: 200px;
  font-size: 13px;
  line-height: 1.55;
  color: #7F1D1D;

  strong { font-weight: 800; }
`,Mt=a.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${t.danger};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:hover { background: #B91C1C; }
`,Pt=a.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #B91C1C;
  padding: 2px;
  display: flex;
  align-items: center;

  &:hover { color: #7F1D1D; }
`,Wt=()=>{const[n,y]=(0,d.useState)(!0),[b,N]=(0,d.useState)("30d"),[Q,Rt]=(0,d.useState)([]),[Tt,qt]=(0,d.useState)([]),[sr,nr]=(0,d.useState)(null),[ir,S]=(0,d.useState)(!1),[or,z]=(0,d.useState)(!1),[L,B]=(0,d.useState)(!1),[o,f]=(0,d.useState)({name:"",category:"embalming",unit:"liters",current_stock:"",min_stock_level:"",reorder_level:"",unit_cost:"",hazard_level:"low",notes:""}),[x,U]=(0,d.useState)({chemical_id:"",quantity_used:"",used_by:"",usage_notes:""}),[K,me]=(0,d.useState)(null),[H,lr]=(0,d.useState)([]),[cr,C]=(0,d.useState)(!1),[u,D]=(0,d.useState)({chemical_id:"",quantity:"",received_by:"",notes:""}),[dr,hr]=(0,d.useState)(!0),Re=(0,d.useRef)(!1),A=(0,d.useCallback)(async()=>{y(!0),me(null);try{const[r,s]=await Promise.allSettled([W.get("/chemicals/dashboard/summary"),W.get("/chemicals")]);if(r.status==="fulfilled"&&r.value?.data?.success&&nr(r.value.data.data),s.status==="fulfilled"&&s.value?.data?.success){const i=(s.value.data.data||[]).map(l=>({...l,id:l.chemical_id||l.id,name:l.chemical_name||l.name}));lr(i);const c=i.filter(l=>Number(l.is_low_stock)===1||parseFloat(l.current_stock)<=parseFloat(l.min_stock_level));if(c.length>0&&!Re.current){Re.current=!0;const l=c.slice(0,4).map(p=>`${p.name} (${parseFloat(p.current_stock)}${p.unit==="liters"?"L":" "+p.unit})`).join(", ");j.warning(`⚠ ${c.length} chemical${c.length>1?"s are":" is"} LOW on stock: ${l}${c.length>4?"…":""}. Please restock!`,{autoClose:8e3})}}}catch(r){console.error("Failed to fetch chemical data:",r);const s=r.response?.data;(s?.error==="SERVICE_DOWN"||r.response?.status===503)&&me({message:"Chemical service is currently unavailable",details:s?.message||"The service is down. Please contact your system administrator.",action:"Try again later"})}y(!1)},[]);(0,d.useEffect)(()=>{A()},[A]);const xr=()=>{me(null),A()},Te=async r=>{if(r.preventDefault(),!o.name)return j.error("Chemical name is required");B(!0);try{const s={name:o.name,category:o.category.toLowerCase(),unit:o.unit,current_stock:parseFloat(o.current_stock)||0,min_stock_level:parseFloat(o.min_stock_level)||0,reorder_level:parseFloat(o.reorder_level)||0,unit_cost:parseFloat(o.unit_cost)||0,hazard_level:o.hazard_level.toLowerCase(),notes:o.notes||null};(await W.post("/chemicals",s)).data.success&&(j.success("Chemical added successfully"),S(!1),f({name:"",category:"embalming",unit:"liters",current_stock:"",min_stock_level:"",reorder_level:"",unit_cost:"",hazard_level:"low",notes:""}),await A())}catch(s){j.error(s.response?.data?.message||"Failed to add chemical")}B(!1)},qe=async r=>{if(r.preventDefault(),!x.chemical_id||!x.quantity_used)return j.error("Select chemical and enter quantity");B(!0);try{const s={chemical_id:parseInt(x.chemical_id),quantity_used:parseFloat(x.quantity_used),used_by:x.used_by||"Staff",usage_notes:x.usage_notes||null};(await W.post("/chemicals/usage",s)).data.success&&(j.success("Pickup recorded successfully"),z(!1),U({chemical_id:"",quantity_used:"",used_by:"",usage_notes:""}),await A())}catch(s){j.error(s.response?.data?.message||"Failed to record pickup")}B(!1)},Ie=async r=>{if(r.preventDefault(),!u.chemical_id||!u.quantity)return j.error("Enter quantity to restock");B(!0);try{const s={chemical_id:parseInt(u.chemical_id),quantity:parseFloat(u.quantity),received_by:u.received_by||"Staff",notes:u.notes||null};(await W.post("/chemicals/restock",s)).data.success&&(j.success("Restock recorded successfully"),C(!1),D({chemical_id:"",quantity:"",received_by:"",notes:""}),await A())}catch(s){j.error(s.response?.data?.message||"Failed to record restock")}B(!1)},O=sr||{},Ne=O.recent_transactions||[],Ue=O.top_used_chemicals||[],ve=r=>String(r.performed_by||r.used_by||"").trim()||"Unknown",fe=r=>{const s=r.transaction_date||r.created_at;if(!s)return null;const i=new Date(s);return isNaN(i.getTime())||i.getFullYear()<2e3?null:i},J=O.total_chemicals||0,V=O.low_stock_count||0,je=H.filter(r=>Number(r.is_low_stock)===1||parseFloat(r.current_stock)<=parseFloat(r.min_stock_level)),He=parseFloat(O.total_usage_30d)||0,ye=Ne.filter(r=>r.transaction_type==="consumed"),ur=ye.length,Z=Ue.reduce((r,s)=>r+(parseFloat(s.total_used)||0),0),Oe=Ue.filter(r=>parseFloat(r.total_used)>0).map((r,s)=>({name:r.name,percentage:Z>0?Math.round(parseFloat(r.total_used)/Z*100):0,volume:`${parseFloat(r.total_used).toFixed(1)}${r.unit==="liters"?"L":r.unit}`,color:t.chartColors[s%t.chartColors.length]})),pr=[{label:"Stock Health",current:J>0?Math.round((J-V)/J*100):100,target:100,unit:"%",color:t.primary},{label:"Total Usage (30d)",current:He,target:100,unit:"L",color:t.success},{label:"Low Stock Alerts",current:V,target:0,unit:"",color:t.warning},{label:"Total Chemicals",current:J,target:10,unit:"",color:t.purple}],_={};ye.forEach(r=>{const s=ve(r);_[s]||(_[s]={name:s,unit:r.unit,pickups:0,totalVolume:0,dates:[]});const i=_[s];i.pickups++,i.totalVolume+=parseFloat(r.quantity)||0;const c=fe(r);c&&i.dates.push(c.getTime())}),Object.values(_).forEach(r=>r.dates.sort((s,i)=>s-i));const be=r=>{const s=[];for(let i=1;i<r.length;i++)s.push((r[i]-r[i-1])/864e5);return s},$e=r=>r.length?r.reduce((s,i)=>s+i,0)/r.length:null,gr=Ne.map((r,s)=>{const i=fe(r),c=_[ve(r)],l=i&&c?c.dates.indexOf(i.getTime()):-1,p=l>0?Math.round((c.dates[l]-c.dates[l-1])/864e5):null,k=c&&c.dates.length>1?$e(be(c.dates)):null;return{id:r.id,person:ve(r),chemical:`${r.chemical_name} (${parseFloat(r.quantity).toFixed(1)}${r.unit==="liters"?"L":r.unit})`,action:r.transaction_type==="received"?"Received":r.transaction_type==="consumed"?"Consumed":r.transaction_type,time:i?Rr(i):"—",date:i,gapDays:p,avgInterval:k!=null?k.toFixed(1):null,avatarColor:t.chartColors[s%t.chartColors.length],type:r.transaction_type}}),m={"0-3 days":0,"4-7 days":0,"8-14 days":0,"15+ days":0};let Ve=0;ye.forEach(r=>{const s=fe(r);if(!s)return;Ve++;const i=Math.floor((Date.now()-s.getTime())/864e5);i<=3?m["0-3 days"]++:i<=7?m["4-7 days"]++:i<=14?m["8-14 days"]++:m["15+ days"]++});const ee=Ve||1,mr=[{range:"0-3 days",count:m["0-3 days"],percentage:Math.round(m["0-3 days"]/ee*100),color:t.success},{range:"4-7 days",count:m["4-7 days"],percentage:Math.round(m["4-7 days"]/ee*100),color:t.primary},{range:"8-14 days",count:m["8-14 days"],percentage:Math.round(m["8-14 days"]/ee*100),color:t.warning},{range:"15+ days",count:m["15+ days"],percentage:Math.round(m["15+ days"]/ee*100),color:t.danger}],vr=Object.values(_).map((r,s)=>{const i=r.pickups>0?(r.totalVolume/r.pickups).toFixed(1):"0.0",c=r.unit==="liters"?"L":"units",l=be(r.dates),p=$e(l),k=l.length>=2?l[l.length-1]<=l[l.length-2]?"up":"down":null;return{name:r.name,pickups:r.pickups,avgDays:p!=null?parseFloat(p.toFixed(1)):null,avgVolume:`${i}${c}`,trend:k,color:t.chartColors[s%t.chartColors.length]}}),We=$e(Object.values(_).flatMap(r=>be(r.dates))),Ge=We!=null?We.toFixed(1):"N/A",E=70;let ke=-90;const fr=Oe.map(r=>{const s=r.percentage/100*360,i=ke,c=ke+s;ke=c;const l=i*Math.PI/180,p=c*Math.PI/180,k=s>180?1:0,jr=90+E*Math.cos(l),yr=90+E*Math.sin(l),br=90+E*Math.cos(p),$r=90+E*Math.sin(p),kr=s>=360?"":`M ${jr} ${yr} A ${E} ${E} 0 ${k} 1 ${br} ${$r}`;return{...r,d:kr,startAngle:i,endAngle:c}});return(0,d.useEffect)(()=>{const r=s=>{s.key==="Escape"&&(S(!1),z(!1),C(!1))};return document.addEventListener("keydown",r),()=>document.removeEventListener("keydown",r)},[]),n?(0,e.jsx)(Qe,{children:(0,e.jsxs)(Bt,{children:[(0,e.jsx)(Dt,{size:28,color:t.primary}),(0,e.jsx)("span",{style:{fontSize:"0.8125rem",color:t.textSecondary},children:"Loading analytics..."})]})}):(0,e.jsxs)(Qe,{children:[(0,e.jsxs)(Tr,{children:[(0,e.jsxs)(qr,{children:[(0,e.jsxs)(Ir,{children:[(0,e.jsx)(Ye,{size:22})," Chemical Inventory Analytics"]}),(0,e.jsx)(Nr,{children:"Track usage, pickup patterns, and staff chemical inventory behavior"})]}),(0,e.jsxs)(Ur,{children:[(0,e.jsxs)("select",{value:b,onChange:r=>N(r.target.value),style:{padding:"0.4375rem 1.75rem 0.4375rem 0.625rem",border:`1px solid ${t.border}`,borderRadius:"6px",fontSize:"0.8125rem",color:t.textBody,background:t.surface,cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 0.5rem center"},children:[(0,e.jsx)("option",{value:"7d",children:"Last 7 days"}),(0,e.jsx)("option",{value:"30d",children:"Last 30 days"}),(0,e.jsx)("option",{value:"90d",children:"Last 90 days"}),(0,e.jsx)("option",{value:"1y",children:"Last 1 year"})]}),(0,e.jsxs)(ie,{onClick:()=>S(!0),children:[(0,e.jsx)(te,{size:14})," New Chemical"]}),(0,e.jsxs)(ie,{$variant:"primary",onClick:()=>z(!0),children:[(0,e.jsx)(re,{size:14})," Record Pickup"]}),(0,e.jsxs)(ie,{onClick:()=>window.location.reload(),children:[(0,e.jsx)(Pe,{size:14})," Refresh"]})]})]}),K&&(0,e.jsxs)(wt,{children:[(0,e.jsx)(Ct,{children:(0,e.jsx)(ne,{size:20})}),(0,e.jsxs)(_t,{children:[(0,e.jsx)(Ft,{children:K.message}),(0,e.jsx)(St,{children:K.details}),(0,e.jsxs)(zt,{children:["Action: ",K.action]})]}),(0,e.jsxs)(Lt,{onClick:xr,children:[(0,e.jsx)(Pe,{size:14})," Retry"]})]}),dr&&je.length>0&&(0,e.jsxs)(At,{children:[(0,e.jsx)(ne,{size:16,color:t.danger}),(0,e.jsxs)(Et,{children:[(0,e.jsxs)("strong",{children:["⚠ Low stock alert (",je.length,"):"]})," ",je.map(r=>`${r.name} — ${parseFloat(r.current_stock)}${r.unit==="liters"?"L":" "+r.unit} left (min ${parseFloat(r.min_stock_level)})`).join(" · ")]}),(0,e.jsxs)(Mt,{onClick:()=>C(!0),children:[(0,e.jsx)(te,{size:12})," Restock now"]}),(0,e.jsx)(Pt,{onClick:()=>hr(!1),children:(0,e.jsx)(ae,{size:14})})]}),(0,e.jsxs)(tr,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(se,{size:15})," Chemical Stock List"]}),(0,e.jsx)(R,{children:"Manage inventory and restock levels"})]}),(0,e.jsx)("div",{style:{overflowX:"auto"},children:(0,e.jsxs)(Je,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)(v,{children:"Chemical Name"}),(0,e.jsx)(v,{children:"Category"}),(0,e.jsx)(v,{children:"Current Stock"}),(0,e.jsx)(v,{children:"Min Level"}),(0,e.jsx)(v,{children:"Reorder Level"}),(0,e.jsx)(v,{children:"Status"}),(0,e.jsx)(v,{children:"Action"})]})}),(0,e.jsx)("tbody",{children:H.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)(g,{colSpan:7,style:{textAlign:"center",padding:"2rem",color:t.textMuted},children:'No chemicals in stock. Click "New Chemical" to add one.'})}):H.map((r,s)=>{const i=parseFloat(r.current_stock)||0,c=parseFloat(r.min_stock_level)||0,l=parseFloat(r.reorder_level)||0,p=i<=c,k=i<=l;return(0,e.jsxs)(Ze,{children:[(0,e.jsx)(g,{children:(0,e.jsxs)(er,{children:[(0,e.jsx)(rr,{$color:t.chartColors[s%t.chartColors.length],children:_e(r.name)}),(0,e.jsx)("span",{style:{fontWeight:500},children:r.name})]})}),(0,e.jsx)(g,{children:r.category}),(0,e.jsxs)(g,{style:{fontWeight:600},children:[i," ",r.unit]}),(0,e.jsxs)(g,{children:[c," ",r.unit]}),(0,e.jsxs)(g,{children:[l," ",r.unit]}),(0,e.jsx)(g,{children:p?(0,e.jsx)(T,{$type:"danger",children:"Low Stock"}):k?(0,e.jsx)(T,{$type:"warn",children:"Below Reorder"}):(0,e.jsx)(T,{$type:"success",children:"In Stock"})}),(0,e.jsx)(g,{children:(0,e.jsxs)(ie,{onClick:()=>{D({chemical_id:r.id,quantity:"",received_by:"",notes:""}),C(!0)},children:[(0,e.jsx)(te,{size:12})," Restock"]})})]},r.id||s)})})]})})]}),(0,e.jsxs)(Hr,{children:[(0,e.jsxs)(oe,{$bg:"#2563EB",children:[(0,e.jsxs)(le,{children:[(0,e.jsx)(ce,{$light:!0,children:"Total Usage (30d)"}),(0,e.jsxs)(de,{$light:!0,children:[He.toFixed(1),(0,e.jsx)("span",{style:{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.7)",marginLeft:2},children:"L"})]}),(0,e.jsxs)(he,{$light:!0,children:[(0,e.jsx)(Ce,{size:12})," From backend"]})]}),(0,e.jsx)(xe,{$light:!0,children:(0,e.jsx)(re,{size:18})})]}),(0,e.jsxs)(oe,{$bg:"#7C3AED",children:[(0,e.jsxs)(le,{children:[(0,e.jsx)(ce,{$light:!0,children:"Total Pickups"}),(0,e.jsx)(de,{$light:!0,children:ur}),(0,e.jsxs)(he,{$light:!0,children:[(0,e.jsx)(Ce,{size:12})," Recorded"]})]}),(0,e.jsx)(xe,{$light:!0,children:(0,e.jsx)(se,{size:18})})]}),(0,e.jsxs)(oe,{$bg:"#D97706",children:[(0,e.jsxs)(le,{children:[(0,e.jsx)(ce,{$light:!0,children:"Avg. Interval"}),(0,e.jsxs)(de,{$light:!0,children:[Ge,Ge!=="N/A"?"d":""]}),(0,e.jsxs)(he,{$light:!0,children:[(0,e.jsx)(Xe,{size:12})," Between pickups"]})]}),(0,e.jsx)(xe,{$light:!0,children:(0,e.jsx)(we,{size:18})})]}),(0,e.jsxs)(oe,{$bg:V>0?"#DC2626":"#059669",children:[(0,e.jsxs)(le,{children:[(0,e.jsx)(ce,{$light:!0,children:"Low Stock Alerts"}),(0,e.jsx)(de,{$light:!0,children:V}),(0,e.jsxs)(he,{$light:!0,children:[(0,e.jsx)(ne,{size:12})," ",V>0?"Needs attention":"All good"]})]}),(0,e.jsx)(xe,{$light:!0,children:(0,e.jsx)(ne,{size:18})})]})]}),(0,e.jsxs)(Ke,{children:[(0,e.jsxs)(ue,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(Ye,{size:15})," Usage Distribution"]}),(0,e.jsxs)(R,{children:[Z,"L total"]})]}),(0,e.jsx)(pe,{children:(0,e.jsxs)(Or,{children:[(0,e.jsxs)("div",{style:{position:"relative"},children:[(0,e.jsx)(Vr,{width:"180",height:"180",viewBox:"0 0 180 180",children:fr.map((r,s)=>(0,e.jsx)("path",{d:r.d,fill:"none",stroke:r.color,strokeWidth:"28",strokeLinecap:"butt"},s))}),(0,e.jsxs)(Wr,{children:[(0,e.jsxs)(Gr,{children:[Z,"L"]}),(0,e.jsx)(Xr,{children:"Total Used"})]})]}),(0,e.jsx)(Yr,{children:Oe.map((r,s)=>(0,e.jsxs)(Qr,{children:[(0,e.jsx)(Kr,{$color:r.color}),(0,e.jsx)(Jr,{children:r.name}),(0,e.jsx)(Zr,{children:r.volume}),(0,e.jsxs)(et,{children:[r.percentage,"%"]})]},s))})]})})]}),(0,e.jsxs)(ue,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)("span",{style:{fontSize:"15px"},children:"🎯"})," Inventory Goals"]}),(0,e.jsx)(R,{children:"This period"})]}),(0,e.jsx)(pe,{children:(0,e.jsx)(rt,{children:pr.map((r,s)=>(0,e.jsxs)(tt,{children:[(0,e.jsxs)(at,{children:[(0,e.jsx)(st,{children:r.label}),(0,e.jsxs)(nt,{children:[r.current,r.unit]})]}),(0,e.jsx)(it,{children:(0,e.jsx)(ot,{$color:r.color,$width:r.current})})]},s))})})]})]}),(0,e.jsxs)(Ke,{children:[(0,e.jsxs)(ue,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(zr,{size:15})," Pickup Frequency"]}),(0,e.jsx)(R,{children:"Days between pickups"})]}),(0,e.jsx)(pe,{children:mr.map((r,s)=>(0,e.jsxs)(lt,{children:[(0,e.jsx)(ct,{children:r.range}),(0,e.jsx)(dt,{children:(0,e.jsx)(ht,{$color:r.color,$width:r.percentage,children:r.percentage>15&&(0,e.jsxs)(xt,{children:[r.percentage,"%"]})})}),(0,e.jsx)(ut,{children:r.count})]},s))})]}),(0,e.jsxs)(ue,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(Lr,{size:15})," Recent Pickups"]}),(0,e.jsx)(R,{children:"Last 7 days"})]}),(0,e.jsx)(pe,{style:{padding:"0.625rem 1.125rem"},children:(0,e.jsx)(pt,{children:gr.slice(0,5).map(r=>(0,e.jsxs)(gt,{children:[(0,e.jsx)(mt,{$color:r.avatarColor,children:_e(r.person)}),(0,e.jsxs)(vt,{children:[(0,e.jsxs)(ft,{children:[(0,e.jsx)(jt,{children:r.person}),(0,e.jsx)(yt,{children:r.time})]}),(0,e.jsxs)(bt,{children:[r.chemical," — ",r.action]}),(0,e.jsxs)($t,{children:[r.gapDays!=null&&(0,e.jsxs)(T,{$type:Fe(r.gapDays).type,children:[(0,e.jsx)(we,{size:9})," ",Fe(r.gapDays).text]}),r.avgInterval!=null&&(0,e.jsxs)(T,{$type:"info",children:[(0,e.jsx)(Sr,{size:9})," Avg ",r.avgInterval,"d"]})]})]})]},r.id))})})]})]}),(0,e.jsxs)(tr,{children:[(0,e.jsxs)(M,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(Fr,{size:15})," Staff Pickup Analysis"]}),(0,e.jsx)(R,{children:"Who picks what and how often"})]}),(0,e.jsx)("div",{style:{overflowX:"auto"},children:(0,e.jsxs)(Je,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)(v,{children:"Staff Member"}),(0,e.jsx)(v,{children:"Total Pickups"}),(0,e.jsx)(v,{children:"Avg. Interval"}),(0,e.jsx)(v,{children:"Avg. Volume"}),(0,e.jsx)(v,{children:"Freq. Trend"})]})}),(0,e.jsx)("tbody",{children:vr.map((r,s)=>(0,e.jsxs)(Ze,{children:[(0,e.jsx)(g,{children:(0,e.jsxs)(er,{children:[(0,e.jsx)(rr,{$color:r.color,children:_e(r.name)}),(0,e.jsx)("span",{style:{fontWeight:500},children:r.name})]})}),(0,e.jsx)(g,{style:{fontWeight:600},children:r.pickups}),(0,e.jsx)(g,{children:r.avgDays!=null?(0,e.jsxs)(T,{$type:Fe(r.avgDays).type,children:[r.avgDays," days"]}):(0,e.jsx)("span",{style:{color:t.textMuted,fontSize:12},children:"\\u2014"})}),(0,e.jsxs)(g,{children:[r.avgVolume,"/pickup"]}),(0,e.jsx)(g,{children:r.trend?(0,e.jsxs)(kt,{$up:r.trend==="up",children:[r.trend==="up"?(0,e.jsx)(Ce,{size:12}):(0,e.jsx)(Xe,{size:12}),r.trend==="up"?"More frequent":"Less frequent"]}):(0,e.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:4,fontSize:"0.6875rem",fontWeight:600,color:t.textMuted},children:[(0,e.jsx)(we,{size:12})," Not enough data"]})})]},s))})]})})]}),ir&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Se,{onClick:()=>S(!1)}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)(Le,{children:[(0,e.jsxs)(Be,{children:[(0,e.jsx)(te,{size:18,color:t.primary})," Add Chemical"]}),(0,e.jsx)(De,{onClick:()=>S(!1),children:(0,e.jsx)(ae,{size:15})})]}),(0,e.jsx)(Ae,{children:(0,e.jsxs)("form",{onSubmit:Te,children:[(0,e.jsx)(Y,{children:"Chemical Details"}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Chemical Name *"}),(0,e.jsx)($,{value:o.name,onChange:r=>f({...o,name:r.target.value}),placeholder:"e.g. Formaldehyde",required:!0})]}),(0,e.jsxs)(G,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Category"}),(0,e.jsxs)(X,{value:o.category,onChange:r=>f({...o,category:r.target.value}),children:[(0,e.jsx)("option",{value:"embalming",children:"Embalming"}),(0,e.jsx)("option",{value:"disinfectant",children:"Disinfectant"}),(0,e.jsx)("option",{value:"preservative",children:"Preservative"}),(0,e.jsx)("option",{value:"cosmetic",children:"Cosmetic"}),(0,e.jsx)("option",{value:"other",children:"Other"})]})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Unit"}),(0,e.jsxs)(X,{value:o.unit,onChange:r=>f({...o,unit:r.target.value}),children:[(0,e.jsx)("option",{value:"liters",children:"Liters"}),(0,e.jsx)("option",{value:"ml",children:"Milliliters"}),(0,e.jsx)("option",{value:"kg",children:"Kilograms"}),(0,e.jsx)("option",{value:"grams",children:"Grams"}),(0,e.jsx)("option",{value:"packets",children:"Packets"}),(0,e.jsx)("option",{value:"pieces",children:"Pieces"})]})]})]}),(0,e.jsx)(Y,{children:"Stock Levels"}),(0,e.jsxs)(G,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Initial Stock *"}),(0,e.jsx)($,{type:"number",step:"any",value:o.current_stock,onChange:r=>f({...o,current_stock:r.target.value}),placeholder:"0",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Min Stock Level"}),(0,e.jsx)($,{type:"number",step:"any",value:o.min_stock_level,onChange:r=>f({...o,min_stock_level:r.target.value}),placeholder:"0"})]})]}),(0,e.jsxs)(G,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Reorder Level"}),(0,e.jsx)($,{type:"number",step:"any",value:o.reorder_level,onChange:r=>f({...o,reorder_level:r.target.value}),placeholder:"0"})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Unit Cost"}),(0,e.jsx)($,{type:"number",step:"any",value:o.unit_cost,onChange:r=>f({...o,unit_cost:r.target.value}),placeholder:"0.00"})]})]}),(0,e.jsx)(Y,{children:"Safety"}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Hazard Level"}),(0,e.jsxs)(X,{value:o.hazard_level,onChange:r=>f({...o,hazard_level:r.target.value}),children:[(0,e.jsx)("option",{value:"low",children:"Low"}),(0,e.jsx)("option",{value:"medium",children:"Medium"}),(0,e.jsx)("option",{value:"high",children:"High"})]})]}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Notes"}),(0,e.jsx)(Me,{value:o.notes,onChange:r=>f({...o,notes:r.target.value}),placeholder:"Optional notes..."})]}),(0,e.jsx)("div",{style:{height:1}})]})}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(q,{$variant:"primary",onClick:Te,disabled:L,children:L?"Saving...":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Br,{size:14})," Save Chemical"]})}),(0,e.jsx)(q,{$variant:"ghost",onClick:()=>S(!1),children:"Cancel"})]})]})]}),or&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Se,{onClick:()=>z(!1)}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)(Le,{children:[(0,e.jsxs)(Be,{children:[(0,e.jsx)(re,{size:18,color:t.primary})," Record Pickup"]}),(0,e.jsx)(De,{onClick:()=>z(!1),children:(0,e.jsx)(ae,{size:15})})]}),(0,e.jsx)(Ae,{children:(0,e.jsxs)("form",{onSubmit:qe,children:[(0,e.jsx)(Y,{children:"Pickup Details"}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Chemical *"}),(0,e.jsxs)(X,{value:x.chemical_id,onChange:r=>U({...x,chemical_id:r.target.value}),children:[(0,e.jsx)("option",{value:"",children:"Select chemical..."}),H.map(r=>(0,e.jsxs)("option",{value:r.id,children:[r.name," (",parseFloat(r.current_stock||0)," ",r.unit," available)"]},r.id))]})]}),(0,e.jsxs)(G,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Quantity Used *"}),(0,e.jsx)($,{type:"number",step:"any",value:x.quantity_used,onChange:r=>U({...x,quantity_used:r.target.value}),placeholder:"0",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Used By"}),(0,e.jsx)($,{value:x.used_by,onChange:r=>U({...x,used_by:r.target.value}),placeholder:"Staff name"})]})]}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Usage Notes"}),(0,e.jsx)(Me,{value:x.usage_notes,onChange:r=>U({...x,usage_notes:r.target.value}),placeholder:"Optional notes about this usage..."})]}),(0,e.jsx)("div",{style:{height:1}})]})}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(q,{$variant:"primary",onClick:qe,disabled:L,children:L?"Saving...":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(re,{size:14})," Record Pickup"]})}),(0,e.jsx)(q,{$variant:"ghost",onClick:()=>z(!1),children:"Cancel"})]})]})]}),cr&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Se,{onClick:()=>C(!1)}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)(Le,{children:[(0,e.jsxs)(Be,{children:[(0,e.jsx)(se,{size:18,color:t.success})," Restock Chemical"]}),(0,e.jsx)(De,{onClick:()=>C(!1),children:(0,e.jsx)(ae,{size:15})})]}),(0,e.jsx)(Ae,{children:(0,e.jsxs)("form",{onSubmit:Ie,children:[(0,e.jsx)(Y,{children:"Restock Details"}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Chemical"}),(0,e.jsxs)(X,{value:u.chemical_id,onChange:r=>D({...u,chemical_id:r.target.value}),children:[(0,e.jsx)("option",{value:"",children:"Select chemical..."}),H.map(r=>(0,e.jsx)("option",{value:r.id,children:r.name},r.id))]})]}),(0,e.jsxs)(G,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Quantity to Add *"}),(0,e.jsx)($,{type:"number",step:"any",value:u.quantity,onChange:r=>D({...u,quantity:r.target.value}),placeholder:"0",required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(h,{children:"Received By"}),(0,e.jsx)($,{value:u.received_by,onChange:r=>D({...u,received_by:r.target.value}),placeholder:"Staff name"})]})]}),(0,e.jsxs)(F,{children:[(0,e.jsx)(h,{children:"Notes"}),(0,e.jsx)(Me,{value:u.notes,onChange:r=>D({...u,notes:r.target.value}),placeholder:"Optional notes..."})]}),(0,e.jsx)("div",{style:{height:1}})]})}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(q,{$variant:"primary",style:{background:t.success,":hover":{background:"#047857"}},onClick:Ie,disabled:L,children:L?"Saving...":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(se,{size:14})," Record Restock"]})}),(0,e.jsx)(q,{$variant:"ghost",onClick:()=>C(!1),children:"Cancel"})]})]})]})]})};export{Wt as default};
