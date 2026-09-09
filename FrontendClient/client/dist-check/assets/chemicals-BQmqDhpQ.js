import{r as Ze}from"./chunk-CXHxssQy.js";import{y as et}from"./chunk-CXAmgOhv.js";import{_ as a,g as tt,m as H}from"./chunk-DJYPtS2Y.js";import{a as C}from"./chunk-CwzAxjA3.js";import{o as rt}from"./chunk-BY9AVXEY.js";import{C as $e,Cn as at,Dn as st,G as it,Qt as Q,St as Fe,Vn as D,Yt as J,ft as V,g as Be,i as b,ln as nt,mn as S,on as X}from"./index-Cjz35ncq.js";var d=Ze(et(),1),e=rt(),r={primaryDark:"#1E293B",accentBlue:"#3B82F6",successGreen:"#10B981",dangerRed:"#DC2626",warningYellow:"#F59E0B",infoBlue:"#0EA5E9",light:"#F8FAFC",cardBg:"#FFFFFF",border:"#E2E8F0",borderLight:"#F1F5F9",textPrimary:"#1E293B",textSecondary:"#64748B",textTertiary:"#94A3B8"},ve=H`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`,ot=H`
  to { transform: rotate(360deg); }
`,lt=H`
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`,dt=H`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`,ct=a.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-left: 4px solid ${r.dangerRed};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 18px;
  animation: ${ve} 0.25s ease;
`,xt=a.div`
  flex: 1;
  font-size: 13px;
  line-height: 1.55;
  color: #7F1D1D;

  strong { font-weight: 800; }
`,pt=a.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #B91C1C;
  padding: 2px;
  display: flex;
  align-items: center;

  &:hover { color: #7F1D1D; }
`,ze=a.div`
  padding: 12px;
  background: ${r.light};
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: ${r.textPrimary};
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 28px 32px;
    max-width: 1100px;
    margin: 0 auto;
  }
`,ht=a.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
  }
`,ut=a.h1`
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${r.textPrimary};

  @media (min-width: 768px) {
    font-size: 26px;
  }

  svg {
    color: ${r.accentBlue};
  }
`,gt=a.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`,K=a.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  white-space: nowrap;

  background: ${({$variant:s})=>s==="blue"?r.accentBlue:s==="green"?r.successGreen:s==="amber"?r.warningYellow:r.cardBg};
  color: ${({$variant:s})=>s?"#fff":r.textPrimary};
  border: ${({$variant:s})=>s?"none":`1px solid ${r.border}`};
  box-shadow: ${({$variant:s})=>s?`0 2px 8px ${s==="blue"?"rgba(59,130,246,0.25)":s==="green"?"rgba(16,185,129,0.25)":"rgba(245,158,11,0.25)"}`:"none"};

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.08);
  }

  &:active { transform: scale(0.97); }

  @media (min-width: 768px) {
    padding: 10px 18px;
    font-size: 14px;
  }
`,mt=a.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 22px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
`,L=a.div`
  background: ${r.cardBg};
  border-radius: 14px;
  padding: 16px;
  border: 1px solid ${r.border};
  animation: ${ve} 0.5s ease-out both;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  }
`,A=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`,T=a.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${r.textSecondary};
`,R=a.div`
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: ${({$color:s})=>s||r.textPrimary};
  letter-spacing: -0.02em;
`,jt=a.div`
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;

  &::-webkit-scrollbar { display: none; }
`,Z=a.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
  border: 1.5px solid ${({$active:s})=>s?r.accentBlue:r.border};
  background: ${({$active:s})=>s?r.accentBlue:r.cardBg};
  color: ${({$active:s})=>s?"#fff":r.textSecondary};
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover { transform: translateY(-1px); }
`,ee=a.div`
  background: ${r.cardBg};
  border-radius: 14px;
  padding: 18px;
  border: 1px solid ${r.border};
  animation: ${ve} 0.5s ease-out both;
  animation-delay: 0.05s;

  @media (min-width: 768px) {
    padding: 22px;
  }
`,te=a.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
  }
`,re=a.h3`
  font-size: 16px;
  font-weight: 750;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${r.textPrimary};

  svg { color: ${r.accentBlue}; }

  @media (min-width: 768px) { font-size: 17px; }
`,bt=a.div`
  position: relative;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${r.textTertiary};
    pointer-events: none;
  }
`,vt=a.input`
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1.5px solid ${r.border};
  border-radius: 10px;
  font-size: 14px;
  background: ${r.light};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${r.accentBlue};
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
    background: #fff;
  }

  @media (min-width: 768px) { width: 280px; }
`,ft=a.div`
  background: ${r.cardBg};
  border-radius: 14px;
  padding: 18px;
  border: 1px solid ${r.border};
  margin-bottom: 12px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    border-color: #CBD5E1;
  }
`,yt=a.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  gap: 10px;
`,_t=a.div`
  font-size: 15px;
  font-weight: 750;
  color: ${r.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;

  svg { color: ${r.accentBlue}; flex-shrink: 0; }
`,wt=a.div`
  font-size: 12px;
  color: ${r.textTertiary};
  margin-top: 3px;
  font-weight: 500;
`,kt=a.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;

  background: ${({$low:s})=>s?"#FEF2F2":"#F0FDF4"};
  color: ${({$low:s})=>s?"#DC2626":"#16A34A"};
  border: 1px solid ${({$low:s})=>s?"#FECACA":"#BBF7D0"};

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    ${({$low:s})=>s&&tt`animation: ${dt} 1.4s ease-in-out infinite;`}
  }
`,Ct=a.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px;
  background: ${r.light};
  border-radius: 10px;
  margin-bottom: 14px;
`,U=a.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`,N=a.div`
  font-size: 10.5px;
  color: ${r.textTertiary};
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,M=a.div`
  font-size: 16px;
  font-weight: 800;
  color: ${r.textPrimary};
`,St=a.div`
  margin-bottom: 12px;
`,$t=a.div`
  width: 100%;
  height: 7px;
  background: ${r.border};
  border-radius: 4px;
  overflow: hidden;
`,Ft=a.div`
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background 0.5s ease;
  width: ${({$pct:s})=>Math.min(100,Math.max(0,s))}%;
  background: ${({$pct:s})=>s>=80?"#10B981":s>=60?"#22C55E":s>=40?"#F59E0B":s>=20?"#F97316":"#EF4444"};
  box-shadow: ${({$pct:s})=>s<20?"0 0 8px rgba(239,68,68,0.4)":"none"};
`,Bt=a.div`
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 11px;
  font-weight: 650;
`,zt=a.span`
  color: ${({$pct:s})=>s>=60?"#10B981":s>=40?"#F59E0B":s>=20?"#F97316":"#EF4444"};
`,qt=a.span`
  color: ${({$pct:s})=>s>=80?"#10B981":s>=60?"#22C55E":s>=40?"#F59E0B":s>=20?"#F97316":"#EF4444"};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 10px;
`,Pt=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${r.light};
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
`,Et=a.span`
  color: ${r.textSecondary};
  font-weight: 600;
`,Dt=a.span`
  color: ${r.accentBlue};
  font-weight: 750;
`,Lt=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`,qe=a.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1.5px solid ${r.border};
  border-radius: 10px;
  background: ${r.cardBg};
  color: ${r.textSecondary};
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${r.accentBlue};
    color: ${r.accentBlue};
    background: ${r.light};
  }

  &:active { transform: scale(0.97); }
`,Pe=a.table`
  width: 100%;
  border-collapse: collapse;
`,Ee=a.tr`
  border-bottom: 2px solid ${r.border};
`,m=a.th`
  padding: 10px 10px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: ${r.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`,j=a.td`
  padding: 12px 10px;
  font-size: 13px;
  color: ${r.textPrimary};
  border-bottom: 1px solid ${r.borderLight||"#F1F5F9"};
  white-space: nowrap;
`,At=a(j)`
  white-space: normal;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${r.textSecondary};
`,ae=a.div`
  text-align: center;
  padding: 50px 24px;
`,se=a.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: ${r.light};
  border: 1.5px solid ${r.border};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${r.textTertiary};
`,ie=a.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${r.textPrimary};
  margin: 0 0 6px;
`,ne=a.p`
  font-size: 13px;
  color: ${r.textTertiary};
  margin: 0;
  line-height: 1.6;
`,Tt=a.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
`,Rt=a.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${r.border};
  border-top-color: ${r.accentBlue};
  border-radius: 50%;
  animation: ${ot} 0.8s linear infinite;
`,Ut=a.p`
  font-size: 14px;
  color: ${r.textSecondary};
  font-weight: 500;
  margin: 0;
`,oe=a.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  overflow-y: auto;
`,le=a.div`
  background: ${r.cardBg};
  border-radius: 18px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${lt} 0.3s ease-out;
  display: flex;
  flex-direction: column;
`,de=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 22px 0;
  margin-bottom: 16px;
`,ce=a.h2`
  font-size: 18px;
  font-weight: 750;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  color: ${r.textPrimary};

  svg { color: ${r.accentBlue}; }
`,xe=a.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid ${r.border};
  background: ${r.light};
  color: ${r.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #FEE2E2;
    color: ${r.dangerRed};
    border-color: #FECACA;
  }
`,pe=a.div`
  padding: 0 22px 22px;
  overflow-y: auto;
  flex: 1;
`,he=a.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 14px;

  @media (min-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
`,o=a.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`,l=a.label`
  font-size: 12.5px;
  font-weight: 650;
  color: ${r.textPrimary};
`,x=a.input`
  padding: 10px 12px;
  border: 1.5px solid ${r.border};
  border-radius: 9px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fff;

  &:focus {
    outline: none;
    border-color: ${r.accentBlue};
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
`,De=a.select`
  padding: 10px 12px;
  border: 1.5px solid ${r.border};
  border-radius: 9px;
  font-size: 14px;
  background: #fff;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${r.accentBlue};
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
`,ue=a.textarea`
  padding: 10px 12px;
  border: 1.5px solid ${r.border};
  border-radius: 9px;
  font-size: 14px;
  min-height: 76px;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${r.accentBlue};
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
`,ge=a.div`
  @media (min-width: 500px) {
    grid-column: 1 / -1;
  }
`,me=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
`,je=a.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 16px;
  border-radius: 10px;
  background: ${r.accentBlue};
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59,130,246,0.25);

  &:hover:not(:disabled) {
    background: #2563EB;
    transform: translateY(-1px);
  }

  &:active { transform: scale(0.97); }

  &:disabled {
    background: #94A3B8;
    cursor: not-allowed;
    box-shadow: none;
  }
`,be=a.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 16px;
  border-radius: 10px;
  background: ${r.cardBg};
  color: ${r.textSecondary};
  border: 1.5px solid ${r.border};
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: ${r.light}; }
  &:active { transform: scale(0.97); }
`,Le=s=>s?new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"N/A",Nt=s=>!s.min_stock_level||s.min_stock_level<=0?s.quantity_available>0?100:0:Math.round(s.quantity_available/s.min_stock_level*100),Mt=s=>s>=200?"Excellent":s>=150?"Good":s>=100?"Adequate":s>=50?"Low":"Critical",Ae={pending:{bg:"#FFFBEB",border:"#FDE68A",color:"#D97706"},approved:{bg:"#EFF6FF",border:"#BFDBFE",color:"#2563EB"},rejected:{bg:"#FEF2F2",border:"#FECACA",color:"#DC2626"},fulfilled:{bg:"#F0FDF4",border:"#BBF7D0",color:"#16A34A"}},Ht=({status:s})=>{const $=Ae[s]||Ae.pending;return(0,e.jsxs)("span",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:"10.5px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.03em",background:$.bg,color:$.color,border:`1px solid ${$.border}`,whiteSpace:"nowrap"},children:[(0,e.jsx)("span",{className:"dot",style:{width:5,height:5,borderRadius:"50%",background:"currentColor"}}),s||"Unknown"]})},Jt=()=>{const[s,$]=(0,d.useState)([]),[fe,Te]=(0,d.useState)([]),[I,Re]=(0,d.useState)([]),[Ue,ye]=(0,d.useState)(!0),[Y,Ne]=(0,d.useState)(""),[w,W]=(0,d.useState)("inventory"),[Me,v]=(0,d.useState)(!1),[He,k]=(0,d.useState)(!1),[Ie,F]=(0,d.useState)(!1),[h,B]=(0,d.useState)(null),[Ye,We]=(0,d.useState)(!0),_e=(0,d.useRef)(!1),[we,Ge]=(0,d.useState)({total_chemicals:0,low_stock_count:0,total_usage_30d:0,recent_transactions:[],top_used_chemicals:[]}),[i,p]=(0,d.useState)({name:"",category:"embalming",unit:"liters",current_stock:"",min_stock_level:"",reorder_level:"",unit_cost:"",hazard_level:"low",notes:"",jerican_capacity:"",jericans_received:""}),[c,f]=(0,d.useState)({chemical_id:"",quantity_used:"",used_by:"",usage_notes:"",deceased_id:""}),[u,z]=(0,d.useState)({item_name:"",quantity_requested:"",requested_by:"",notes:""});(0,d.useEffect)(()=>{Oe()},[]);const Oe=async()=>{ye(!0),await Promise.all([q(),ke(),Ce(),P()]),ye(!1)},q=async()=>{try{const t=await b.get("/chemicals");if(t.data.success){const n=t.data.data||[];$(n);const g=n.filter(_=>Number(_.is_low_stock)===1||parseFloat(_.current_stock)<=parseFloat(_.min_stock_level));if(g.length>0&&!_e.current){_e.current=!0;const _=g.slice(0,4).map(E=>`${E.chemical_name} (${parseFloat(E.current_stock)}${E.unit==="liters"?"L":" "+E.unit})`).join(", ");C.warning(`⚠ ${g.length} chemical${g.length>1?"s are":" is"} LOW on stock: ${_}${g.length>4?"…":""}. Please restock!`,{autoClose:8e3})}}}catch(t){console.error(t)}},ke=async()=>{try{const t=await b.get("/chemicals/usage/branch/1");t.data.success&&Te(t.data.data||[])}catch(t){console.error(t)}},Ce=async()=>{try{const t=await b.get("/chemicals/ppe-requests/branch/1");t.data.success&&Re(t.data.data||[])}catch(t){console.error(t)}},P=async()=>{try{const t=await b.get("/chemicals/dashboard/summary/1");t.data.success&&Ge(t.data.data)}catch(t){console.error(t)}},Qe=async t=>{t.preventDefault();try{if(h){const g=parseFloat(i.current_stock)||0;if(g<=0){C.error("Please enter a valid quantity to add.");return}const _={quantity:g,notes:i.notes||`Added stock to ${h.chemical_name}`};(await b.post(`/chemicals/${h.chemical_id}/receive`,_)).data.success&&(C.success("Stock added successfully"),v(!1),y(),await q(),await P());return}const n={name:i.name,category:i.category.toLowerCase(),unit:i.unit,current_stock:parseFloat(i.current_stock)||0,min_stock_level:parseFloat(i.min_stock_level)||0,reorder_level:parseFloat(i.reorder_level)||0,unit_cost:parseFloat(i.unit_cost)||0,hazard_level:i.hazard_level.toLowerCase(),notes:i.notes||null};(await b.post("/chemicals",n)).data.success&&(C.success("Chemical added successfully"),v(!1),y(),await q(),await P())}catch(n){console.error(n)}},Je=async t=>{t.preventDefault();try{const n={chemical_id:parseInt(c.chemical_id),quantity_used:parseFloat(c.quantity_used),used_by:c.used_by,usage_notes:c.usage_notes,deceased_id:c.deceased_id||null};(await b.post("/chemicals/usage",n)).data.success&&(C.success("Usage recorded successfully"),k(!1),y(),await q(),await ke(),await P())}catch(n){console.error(n)}},Ve=async t=>{t.preventDefault();try{const n={item_name:u.item_name,quantity_requested:parseInt(u.quantity_requested),requested_by:u.requested_by,notes:u.notes,branch_id:1};(await b.post("/chemicals/ppe-requests",n)).data.success&&(C.success("PPE request submitted successfully"),F(!1),y(),await Ce())}catch(n){console.error(n)}},y=()=>{p({name:"",category:"embalming",unit:"liters",current_stock:"",min_stock_level:"",reorder_level:"",unit_cost:"",hazard_level:"low",notes:"",jerican_capacity:"",jericans_received:""}),f({chemical_id:"",quantity_used:"",used_by:"",usage_notes:"",deceased_id:""}),z({item_name:"",quantity_requested:"",requested_by:"",notes:""}),B(null)},Xe=t=>{B(t),f(n=>({...n,chemical_id:String(t.chemical_id)})),k(!0)},Ke=t=>{B(t),p(n=>({...n,name:t.chemical_name,category:t.category,unit:t.unit,current_stock:"",min_stock_level:String(t.min_stock_level),reorder_level:String(t.reorder_level),unit_cost:"",hazard_level:t.hazard_level||"low",notes:"",jerican_capacity:t.jerican_capacity?String(t.jerican_capacity):"",jericans_received:""})),v(!0)},Se=s.filter(t=>t.chemical_name.toLowerCase().includes(Y.toLowerCase())||t.category.toLowerCase().includes(Y.toLowerCase())),G=we.low_stock_count||0,O=s.filter(t=>Number(t.is_low_stock)===1||parseFloat(t.current_stock)<=parseFloat(t.min_stock_level));return Ue?(0,e.jsx)(ze,{children:(0,e.jsxs)(Tt,{children:[(0,e.jsx)(Rt,{}),(0,e.jsx)(Ut,{children:"Loading chemical inventory..."})]})}):(0,e.jsxs)(ze,{children:[(0,e.jsxs)(ht,{children:[(0,e.jsxs)(ut,{children:[(0,e.jsx)($e,{size:22}),"Chemical Inventory"]}),(0,e.jsxs)(gt,{children:[(0,e.jsxs)(K,{$variant:"blue",onClick:()=>{B(null),y(),v(!0)},children:[(0,e.jsx)(Q,{size:16}),(0,e.jsx)("span",{className:"btn-label",children:"Add Chemical"})]}),(0,e.jsxs)(K,{$variant:"green",onClick:()=>{B(null),y(),k(!0)},children:[(0,e.jsx)(V,{size:16}),(0,e.jsx)("span",{className:"btn-label",children:"Record Usage"})]}),(0,e.jsxs)(K,{$variant:"amber",onClick:()=>{y(),F(!0)},children:[(0,e.jsx)(S,{size:16}),(0,e.jsx)("span",{className:"btn-label",children:"PPE Request"})]})]})]}),Ye&&O.length>0&&(0,e.jsxs)(ct,{children:[(0,e.jsx)(Be,{size:16,color:r.dangerRed}),(0,e.jsxs)(xt,{children:[(0,e.jsxs)("strong",{children:["⚠ Low stock alert (",O.length,"):"]})," ",O.map(t=>`${t.chemical_name} — ${parseFloat(t.current_stock)}${t.unit==="liters"?"L":" "+t.unit} left (min ${parseFloat(t.min_stock_level)})`).join(" · ")]}),(0,e.jsx)(pt,{onClick:()=>We(!1),children:(0,e.jsx)(D,{size:14})})]}),(0,e.jsxs)(mt,{children:[(0,e.jsxs)(L,{style:{animationDelay:"0s"},children:[(0,e.jsxs)(A,{children:[(0,e.jsx)(T,{children:"Total Chemicals"}),(0,e.jsx)(J,{size:18,color:r.accentBlue})]}),(0,e.jsx)(R,{children:s.length})]}),(0,e.jsxs)(L,{style:{animationDelay:"0.05s"},children:[(0,e.jsxs)(A,{children:[(0,e.jsx)(T,{children:"Low Stock"}),(0,e.jsx)(Be,{size:18,color:G>0?r.dangerRed:r.textTertiary})]}),(0,e.jsx)(R,{$color:G>0?r.dangerRed:r.textPrimary,children:G})]}),(0,e.jsxs)(L,{style:{animationDelay:"0.1s"},children:[(0,e.jsxs)(A,{children:[(0,e.jsx)(T,{children:"Usage (30d)"}),(0,e.jsx)(st,{size:18,color:r.successGreen})]}),(0,e.jsxs)(R,{children:[we.total_usage_30d||0,(0,e.jsx)("span",{style:{fontSize:"14px",fontWeight:600,color:r.textTertiary,marginLeft:2},children:"L"})]})]}),(0,e.jsxs)(L,{style:{animationDelay:"0.15s"},children:[(0,e.jsxs)(A,{children:[(0,e.jsx)(T,{children:"PPE Requests"}),(0,e.jsx)(S,{size:18,color:r.warningYellow})]}),(0,e.jsx)(R,{children:I.length})]})]}),(0,e.jsxs)(jt,{children:[(0,e.jsxs)(Z,{$active:w==="inventory",onClick:()=>W("inventory"),children:[(0,e.jsx)(J,{size:15})," Inventory"]}),(0,e.jsxs)(Z,{$active:w==="usage",onClick:()=>W("usage"),children:[(0,e.jsx)(Fe,{size:15})," Usage History"]}),(0,e.jsxs)(Z,{$active:w==="ppe",onClick:()=>W("ppe"),children:[(0,e.jsx)(S,{size:15})," PPE Requests"]})]}),w==="inventory"&&(0,e.jsxs)(ee,{children:[(0,e.jsxs)(te,{children:[(0,e.jsxs)(re,{children:[(0,e.jsx)(J,{size:18})," Chemical Stock"]}),(0,e.jsxs)(bt,{children:[(0,e.jsx)(nt,{size:16}),(0,e.jsx)(vt,{placeholder:"Search chemicals...",value:Y,onChange:t=>Ne(t.target.value)})]})]}),Se.length===0?(0,e.jsxs)(ae,{children:[(0,e.jsx)(se,{children:(0,e.jsx)(at,{size:26})}),(0,e.jsx)(ie,{children:"No chemicals found"}),(0,e.jsx)(ne,{children:"Add your first chemical to get started"})]}):Se.map(t=>{const n=Nt(t),g=t.is_low_stock===1;return(0,e.jsxs)(ft,{children:[(0,e.jsxs)(yt,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(_t,{children:[(0,e.jsx)($e,{size:16}),t.chemical_name]}),(0,e.jsxs)(wt,{children:["ID: ",t.chemical_uid," · ",t.category]})]}),(0,e.jsxs)(kt,{$low:g,children:[(0,e.jsx)("span",{className:"dot"}),g?"Low Stock":"In Stock"]})]}),(0,e.jsxs)(Ct,{children:[(0,e.jsxs)(U,{children:[(0,e.jsx)(N,{children:"Available"}),(0,e.jsxs)(M,{children:[t.quantity_available," ",t.unit]})]}),(0,e.jsxs)(U,{children:[(0,e.jsx)(N,{children:"Min Level"}),(0,e.jsxs)(M,{children:[t.min_stock_level," ",t.unit]})]}),t.jerican_capacity&&(0,e.jsxs)(U,{children:[(0,e.jsx)(N,{children:"Jerican Size"}),(0,e.jsxs)(M,{children:[t.jerican_capacity,"L"]})]}),t.jericans_received>0&&(0,e.jsxs)(U,{children:[(0,e.jsx)(N,{children:"Jericans"}),(0,e.jsx)(M,{children:t.jericans_received})]})]}),(0,e.jsxs)(St,{children:[(0,e.jsx)($t,{children:(0,e.jsx)(Ft,{$pct:n})}),(0,e.jsxs)(Bt,{children:[(0,e.jsx)(zt,{$pct:n,children:t.min_stock_level>0?`${n}%`:"N/A"}),(0,e.jsx)(qt,{$pct:n,children:t.min_stock_level>0?Mt(n):t.quantity_available>0?"Healthy":"Empty"})]})]}),(0,e.jsxs)(Pt,{children:[(0,e.jsx)(Et,{children:"Usage (30 days):"}),(0,e.jsxs)(Dt,{children:[t.total_used||0," ",t.unit]})]}),(0,e.jsxs)(Lt,{children:[(0,e.jsxs)(qe,{onClick:()=>Xe(t),children:[(0,e.jsx)(V,{size:15})," Use"]}),(0,e.jsxs)(qe,{onClick:()=>Ke(t),children:[(0,e.jsx)(Q,{size:15})," Add Stock"]})]})]},t.chemical_id)})]}),w==="usage"&&(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:(0,e.jsxs)(re,{children:[(0,e.jsx)(Fe,{size:18})," Usage History"]})}),fe.length===0?(0,e.jsxs)(ae,{children:[(0,e.jsx)(se,{children:(0,e.jsx)(it,{size:26})}),(0,e.jsx)(ie,{children:"No usage records"}),(0,e.jsx)(ne,{children:"Usage history will appear here after recording chemical usage"})]}):(0,e.jsx)("div",{style:{overflowX:"auto"},children:(0,e.jsxs)(Pe,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)(Ee,{children:[(0,e.jsx)(m,{children:"Date"}),(0,e.jsx)(m,{children:"Chemical"}),(0,e.jsx)(m,{children:"Quantity"}),(0,e.jsx)(m,{children:"Used By"}),(0,e.jsx)(m,{children:"Notes"})]})}),(0,e.jsx)("tbody",{children:fe.slice(0,30).map(t=>(0,e.jsxs)("tr",{style:{borderBottom:"1px solid #F1F5F9"},children:[(0,e.jsx)(j,{children:Le(t.used_at)}),(0,e.jsx)(j,{style:{fontWeight:650},children:t.chemical_name}),(0,e.jsxs)(j,{children:[t.quantity_used," ",t.unit]}),(0,e.jsx)(j,{children:t.used_by||"—"}),(0,e.jsx)(At,{children:t.usage_notes||"—"})]},t.usage_id))})]})})]}),w==="ppe"&&(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:(0,e.jsxs)(re,{children:[(0,e.jsx)(S,{size:18})," PPE Requests"]})}),I.length===0?(0,e.jsxs)(ae,{children:[(0,e.jsx)(se,{children:(0,e.jsx)(S,{size:26})}),(0,e.jsx)(ie,{children:"No PPE requests"}),(0,e.jsx)(ne,{children:"Submit new requests using the PPE Request button above"})]}):(0,e.jsx)("div",{style:{overflowX:"auto"},children:(0,e.jsxs)(Pe,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)(Ee,{children:[(0,e.jsx)(m,{children:"Date"}),(0,e.jsx)(m,{children:"Item"}),(0,e.jsx)(m,{children:"Qty"}),(0,e.jsx)(m,{children:"Requested By"}),(0,e.jsx)(m,{children:"Status"})]})}),(0,e.jsx)("tbody",{children:I.map(t=>(0,e.jsxs)("tr",{style:{borderBottom:"1px solid #F1F5F9"},children:[(0,e.jsx)(j,{children:Le(t.created_at)}),(0,e.jsx)(j,{style:{fontWeight:650},children:t.item_name}),(0,e.jsx)(j,{children:t.quantity_requested}),(0,e.jsx)(j,{children:t.requested_by}),(0,e.jsx)(j,{children:(0,e.jsx)(Ht,{status:t.status})})]},t.id))})]})})]}),Me&&(0,e.jsx)(oe,{onClick:()=>v(!1),children:(0,e.jsxs)(le,{onClick:t=>t.stopPropagation(),children:[(0,e.jsxs)(de,{children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(Q,{size:20}),h?"Add Stock":"Add Chemical"]}),(0,e.jsx)(xe,{onClick:()=>v(!1),children:(0,e.jsx)(D,{size:16})})]}),(0,e.jsx)(pe,{children:(0,e.jsxs)("form",{onSubmit:Qe,children:[(0,e.jsxs)(he,{children:[(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Chemical Name *"}),(0,e.jsx)(x,{placeholder:"e.g., Formaldehyde Solution",value:i.name,onChange:t=>p({...i,name:t.target.value}),required:!h,disabled:!!h})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Category *"}),(0,e.jsx)(x,{placeholder:"e.g., embalming, disinfectant",value:i.category,onChange:t=>p({...i,category:t.target.value}),required:!h,disabled:!!h})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Unit *"}),(0,e.jsx)(x,{placeholder:"e.g., liters, kg, ml",value:i.unit,onChange:t=>p({...i,unit:t.target.value}),required:!h,disabled:!!h})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:h?"Stock to Add *":"Initial Stock *"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"0.00",value:i.current_stock,onChange:t=>p({...i,current_stock:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Min Stock Level *"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"0.00",value:i.min_stock_level,onChange:t=>p({...i,min_stock_level:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Reorder Level *"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"0.00",value:i.reorder_level,onChange:t=>p({...i,reorder_level:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Unit Cost"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"0.00",value:i.unit_cost,onChange:t=>p({...i,unit_cost:t.target.value})})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Hazard Level"}),(0,e.jsxs)(De,{value:i.hazard_level,onChange:t=>p({...i,hazard_level:t.target.value}),children:[(0,e.jsx)("option",{value:"low",children:"Low"}),(0,e.jsx)("option",{value:"medium",children:"Medium"}),(0,e.jsx)("option",{value:"high",children:"High"})]})]}),i.unit.toLowerCase()!=="liters"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Jerican Capacity (L)"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"e.g., 20",value:i.jerican_capacity,onChange:t=>p({...i,jerican_capacity:t.target.value})})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Jericans Received"}),(0,e.jsx)(x,{type:"number",placeholder:"0",value:i.jericans_received,onChange:t=>p({...i,jericans_received:t.target.value})})]})]}),(0,e.jsx)(ge,{children:(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Notes"}),(0,e.jsx)(ue,{placeholder:"Additional notes...",value:i.notes,onChange:t=>p({...i,notes:t.target.value})})]})})]}),(0,e.jsxs)(me,{children:[(0,e.jsx)(be,{type:"button",onClick:()=>v(!1),children:"Cancel"}),(0,e.jsxs)(je,{type:"submit",children:[(0,e.jsx)(X,{size:16}),h?"Add Stock":"Save Chemical"]})]})]})})]})}),He&&(0,e.jsx)(oe,{onClick:()=>k(!1),children:(0,e.jsxs)(le,{onClick:t=>t.stopPropagation(),children:[(0,e.jsxs)(de,{children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(V,{size:20})," Record Usage"]}),(0,e.jsx)(xe,{onClick:()=>k(!1),children:(0,e.jsx)(D,{size:16})})]}),(0,e.jsx)(pe,{children:(0,e.jsxs)("form",{onSubmit:Je,children:[(0,e.jsxs)(he,{children:[(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Chemical *"}),(0,e.jsxs)(De,{value:c.chemical_id,onChange:t=>f({...c,chemical_id:t.target.value}),required:!0,children:[(0,e.jsx)("option",{value:"",children:"Select chemical..."}),s.map(t=>(0,e.jsxs)("option",{value:t.chemical_id,children:[t.chemical_name," (",t.quantity_available," ",t.unit," available)"]},t.chemical_id))]})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Quantity Used *"}),(0,e.jsx)(x,{type:"number",step:"0.01",placeholder:"0.00",value:c.quantity_used,onChange:t=>f({...c,quantity_used:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Used By"}),(0,e.jsx)(x,{placeholder:"Staff name",value:c.used_by,onChange:t=>f({...c,used_by:t.target.value})})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Deceased ID (Optional)"}),(0,e.jsx)(x,{placeholder:"Deceased #",value:c.deceased_id,onChange:t=>f({...c,deceased_id:t.target.value})})]}),(0,e.jsx)(ge,{children:(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Usage Notes"}),(0,e.jsx)(ue,{placeholder:"Notes about this usage...",value:c.usage_notes,onChange:t=>f({...c,usage_notes:t.target.value})})]})})]}),(0,e.jsxs)(me,{children:[(0,e.jsx)(be,{type:"button",onClick:()=>k(!1),children:"Cancel"}),(0,e.jsxs)(je,{type:"submit",children:[(0,e.jsx)(X,{size:16})," Record Usage"]})]})]})})]})}),Ie&&(0,e.jsx)(oe,{onClick:()=>F(!1),children:(0,e.jsxs)(le,{onClick:t=>t.stopPropagation(),children:[(0,e.jsxs)(de,{children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(S,{size:20})," Request PPE"]}),(0,e.jsx)(xe,{onClick:()=>F(!1),children:(0,e.jsx)(D,{size:16})})]}),(0,e.jsx)(pe,{children:(0,e.jsxs)("form",{onSubmit:Ve,children:[(0,e.jsxs)(he,{children:[(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Item Name *"}),(0,e.jsx)(x,{placeholder:"e.g., Nitrile Gloves, N95 Masks",value:u.item_name,onChange:t=>z({...u,item_name:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Quantity *"}),(0,e.jsx)(x,{type:"number",placeholder:"0",value:u.quantity_requested,onChange:t=>z({...u,quantity_requested:t.target.value}),required:!0})]}),(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Requested By *"}),(0,e.jsx)(x,{placeholder:"Your name",value:u.requested_by,onChange:t=>z({...u,requested_by:t.target.value}),required:!0})]}),(0,e.jsx)(ge,{children:(0,e.jsxs)(o,{children:[(0,e.jsx)(l,{children:"Notes"}),(0,e.jsx)(ue,{placeholder:"Additional notes...",value:u.notes,onChange:t=>z({...u,notes:t.target.value})})]})})]}),(0,e.jsxs)(me,{children:[(0,e.jsx)(be,{type:"button",onClick:()=>F(!1),children:"Cancel"}),(0,e.jsxs)(je,{type:"submit",children:[(0,e.jsx)(X,{size:16})," Submit Request"]})]})]})})]})})]})};export{Jt as default};
