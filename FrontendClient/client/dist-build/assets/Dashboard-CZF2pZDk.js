import{r as or}from"./chunk-CXHxssQy.js";import{y as cr}from"./chunk-CXAmgOhv.js";import{_ as a}from"./chunk-DJYPtS2Y.js";import{o as hr}from"./chunk-BY9AVXEY.js";import{c as xr,l as pr,o as mr}from"./chunk-C935kdjU.js";import{En as gr,Hn as I,I as ae,In as Be,K as H,Nn as De,Nt as g,Qt as Pe,R as jr,Vn as ur,W as Ne,f as p,i as m,j as yr,lt as Ue,nn as vr}from"./index-D6gguvjv.js";import"./chunk-DaNwstzZ.js";var d=or(cr(),1),e=hr(),t={primaryLight:"#1A3A7A",textSecondary:"#6B7280",primary:"#0A2463",white:"#FFFFFF",bg:"#F5F7FA",border:"#E8ECF0",text:"#1A1D24",success:"#10B981",warning:"#F59E0B",danger:"#E74C3C",info:"#3B82F6"},Fe={pending:{bg:"rgba(245, 158, 11, 0.12)",fg:"#B45309",badge:t.warning},approved:{bg:"rgba(16, 185, 129, 0.12)",fg:"#047857",badge:t.success},rejected:{bg:"rgba(231, 76, 60, 0.12)",fg:"#B91C1C",badge:t.danger},cancelled:{bg:"#E5E7EB",fg:t.textSecondary,badge:t.textSecondary}},U={annual:"Annual",sick:"Sick",maternity:"Maternity",paternity:"Paternity",compassionate:"Compassionate",study:"Study",unpaid:"Unpaid"},Ve={pending:"Pending",approved:"Approved",rejected:"Rejected",cancelled:"Cancelled"},Me=n=>Fe[String(n||"").toLowerCase()]||Fe.cancelled,y=n=>n?new Date(n).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—",W=n=>!n||!n.data?[]:Array.isArray(n.data)?n.data:Array.isArray(n.data.data)?n.data.data:[],Oe=n=>!n||!n.data?null:n.data.data&&typeof n.data.data=="object"&&!Array.isArray(n.data.data)?n.data.data:n.data,i=n=>Number(n)||0,br=a.div`
  padding: 1.5rem;
  max-width: 1240px;
  margin: 0 auto;
  background: ${t.bg};
`,fr=a.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`,wr=a.h1`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: ${t.text};
`,Sr=a.p`
  margin: 0;
  color: ${t.textSecondary};
  font-size: 0.9rem;
`,$r=a.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`,Ar=a.button`
  background: ${t.primary};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.52rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,_r=a.button`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 8px;
  padding: 0.42rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  &:hover { background: ${t.bg}; }
`,zr=a.span`
  font-size: 0.78rem;
  color: ${t.textSecondary};
`,Cr=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0;
`,kr=a.div`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 14px;
  padding: 1.1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`,Er=a.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`,Lr=a.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${n=>n.$bg||t.primary};
  color: ${n=>n.$fg||t.white};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,Tr=a.div`
  font-size: 1.55rem;
  font-weight: 800;
  color: ${t.text};
  margin-top: 0.3rem;
`,Rr=a.div`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: ${t.textSecondary};
`,z=a.div`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  overflow: hidden;
`,C=a.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${t.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`,k=a.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${t.text};
`,E=a.div`
  padding: 1.25rem;
`,Br=a.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`,Dr=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`,Pr=a.div`
  display: grid;
  grid-template-columns: 110px 1fr 55px;
  align-items: center;
  gap: 0.6rem;
`,Nr=a.span`
  font-size: 0.8rem;
  color: ${t.text};
  font-weight: 600;
`,Ur=a.div`
  background: ${t.bg};
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
`,Fr=a.div`
  height: 100%;
  border-radius: 8px;
  background: ${n=>n.$color||t.primary};
  width: ${n=>`${n.$w}%`};
`,Vr=a.span`
  font-weight: 700;
  color: ${t.text};
  justify-self: end;
`,se=a.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid ${t.border};
  &:last-child { border-bottom: 0; }
`,q=a.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${t.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
`,$=a.div`
  padding: 2.2rem 1rem;
  text-align: center;
  color: ${t.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
`,Mr=a.div`
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid ${t.danger};
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: ${t.danger};
  font-size: 0.85rem;
`,ne=a.div`
  overflow-x: auto;
`,ie=a.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  th, td { padding: 0.7rem 0.9rem; text-align: left; }
  th {
    background: ${t.bg};
    color: ${t.textSecondary};
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    border-bottom: 2px solid ${t.border};
  }
  td { border-bottom: 1px solid ${t.border}; }
  tr:last-child td { border-bottom: 0; }
`,de=a.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: ${n=>Me(n.$status).fg};
  background: ${n=>Me(n.$status).bg};
`,le=a.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: flex-end;
`,A=a.button`
  border: none;
  background: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  &:hover { opacity: 0.85; }
  &.approve { color: ${t.success}; }
  &.reject { color: ${t.danger}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`,G=a.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: ${t.bg};
  color: ${t.textSecondary};
`,Or=a.div`text-align: center; margin: 0.5rem 0;`,Ir=a.div`font-size: 2rem; font-weight: 800; color: ${t.primary};`,Hr=a.div`font-size: 0.78rem; color: ${t.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;`,Wr=a.div`height: 9px; background: ${t.bg}; border-radius: 999px; overflow: hidden; display: flex; margin: 0.8rem 0;`,qr=a.div`background: ${t.primary}; width: ${n=>`${n.$w}%`}; height: 100%;`,Gr=a.div`background: ${t.warning}; width: ${n=>`${n.$p}%`}; height: 100%;`,Ie=a.div`display: flex; justify-content: space-between; font-size: 0.82rem; color: ${t.textSecondary}; margin-top: 0.4rem;`,oe=a.div`font-size: 0.78rem; color: ${t.textSecondary}; margin-top: 0.6rem;`,Yr=a.tr`
  cursor: pointer;
  &:hover td { background: rgba(10, 36, 99, 0.04); }
`,Qr=a.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid ${t.border};
  color: ${t.primary};
  background: ${t.white};
`,Xr=a.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`,Kr=a.div`
  width: min(480px, 100%);
  height: 100%;
  background: ${t.white};
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,Jr=a.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid ${t.border};
  background: ${t.bg};
`,Zr=a.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${t.text};
`,et=a.div`
  font-size: 0.78rem;
  color: ${t.textSecondary};
`,rt=a.button`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${t.textSecondary};
  flex-shrink: 0;
  &:hover { color: ${t.danger}; border-color: ${t.danger}; }
`,tt=a.div`
  padding: 1.1rem 1.25rem 2rem 1.25rem;
  overflow-y: auto;
  flex: 1;
`,at=a.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.4rem;
`,L=a.div`
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: ${n=>n.$hl?"rgba(10, 36, 99, 0.06)":t.white};
`,T=a.div`
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: ${t.textSecondary};
`,R=a.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${n=>n.$hl?t.primary:t.text};
`,ce=a.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${t.text};
  margin: 1.2rem 0 0.6rem 0;
`,st=a.div`
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 0.5rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`,He=a.input`
  border: 1px solid ${t.border};
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  color: ${t.text};
  min-width: 0;
  &:focus { outline: none; border-color: ${t.primary}; }
`,nt=a.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${t.success};
  border: none;
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,it=a.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${t.white};
`,dt=a.div`
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${t.white};
`,lt=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`,jt=()=>{const[n,he]=(0,d.useState)(!0),[xe,pe]=(0,d.useState)(!1),[me,x]=(0,d.useState)(""),[w,We]=(0,d.useState)({total:0,pending:0,on_leave:0,by_status:[],by_type:[]}),[F,Y]=(0,d.useState)([]),[Q,qe]=(0,d.useState)([]),[j,ge]=(0,d.useState)(null),[X,je]=(0,d.useState)([]),[b,K]=(0,d.useState)(null),[J,Ge]=(0,d.useState)([]),[o,ue]=(0,d.useState)(null),[c,Z]=(0,d.useState)(null),[Ye,ye]=(0,d.useState)(!1),[B,V]=(0,d.useState)({days:"",reason:""}),[ve,be]=(0,d.useState)(!1),[fe,we]=(0,d.useState)(null),[M,ee]=(0,d.useState)(null),v=pr(),Se=mr()||xr(),l=(0,d.useMemo)(()=>{const r={"x-tenant-slug":Se};return v&&(r["x-user-id"]=v.toString()),{headers:r}},[Se,v]),O=(0,d.useCallback)(async r=>{x("");const s=await m.get(p.LEAVE.STATS,{...l,signal:r});We(s.data?.data||{total:0,pending:0,on_leave:0,by_status:[],by_type:[]});const[u,S]=await Promise.all([m.get(p.LEAVE.ALL,{...l,signal:r}),m.get(p.LEAVE.USERS_ON_LEAVE,{...l,signal:r})]),f=W(u);if(Ge(f.slice(0,12)),Y(f.filter(h=>String(h.status||"").toLowerCase()==="pending")),qe(W(S)),v)try{const h=await m.get(p.LEAVE.BALANCE(v),{...l,signal:r});ge(Oe(h))}catch{ge(null)}try{const h=await m.get(p.LEAVE.BALANCES,{...l,signal:r}),Re=h?.data?.data||h?.data||[];je(Array.isArray(Re)?Re:[])}catch{je([])}he(!1)},[l,v]);(0,d.useEffect)(()=>{const r=new AbortController;let s=!1;return(async()=>{try{await O(r.signal)}catch(u){s||x(u?.friendlyMessage||"Failed to load HR leave dashboard. Please try again."),s||he(!1)}})(),()=>{s=!0,r.abort()}},[O]);const _=(0,d.useCallback)(async()=>{pe(!0);try{const r=new AbortController;await O(r.signal)}catch(r){x(r?.friendlyMessage||"Failed to refresh data.")}finally{pe(!1)}},[O]),$e=(0,d.useCallback)(async(r,s,u)=>{K(r);const S=F.slice();Y(f=>f.map(h=>h.id===r?{...h,status:s,rejection_reason:u||h.rejection_reason}:h));try{await m.patch(p.LEAVE.UPDATE_STATUS(r),{status:s,rejection_reason:u,approved_by:v},l)}catch(f){Y(S),x(f?.friendlyMessage||"Could not update that request. It may have already been processed."),K(null);return}try{await _()}catch(f){x(f?.friendlyMessage||"Request updated, but the dashboard could not be refreshed.")}finally{K(null)}},[F,_,l]),Ae=r=>$e(r,"approved",null),_e=r=>{const s=window.prompt("Rejection reason (optional):")??"";s!==null&&$e(r,"rejected",s.trim()||"Not specified")},D=(0,d.useCallback)(async r=>{if(!r?.user_id)return;ye(!0);const[s,u,S]=await Promise.all([m.get(p.LEAVE.BALANCE(r.user_id),l).catch(()=>null),m.get(p.LEAVE.ALL,{...l,params:{user_id:r.user_id}}).catch(()=>null),m.get(p.LEAVE.ADDITIONS(r.user_id),l).catch(()=>null)]);Z({balance:Oe(s),leaves:W(u),additions:W(S)}),ye(!1)},[l]),ze=(0,d.useCallback)(r=>{ue(r),Z(null),V({days:"",reason:""}),D(r)},[D]),Ce=()=>{ue(null),Z(null)},Qe=async()=>{if(!o)return;const r=Number(B.days);if(!r||r<1){x("Enter at least 1 day to add.");return}if(!String(B.reason).trim()){x("A reason is required when adding leave days.");return}be(!0);try{await m.post(p.LEAVE.ADD_DAYS,{user_id:o.user_id,days:r,reason:String(B.reason).trim(),added_by:v||void 0},l),V({days:"",reason:""}),x(""),await Promise.all([D(o),_()])}catch(s){x(s?.friendlyMessage||"Could not add leave days. Please try again.")}finally{be(!1)}},Xe=async r=>{we(r);try{await m.delete(p.LEAVE.REMOVE_DAYS(r),l),x(""),o&&await Promise.all([D(o),_()])}catch(s){x(s?.friendlyMessage||"Could not remove that adjustment.")}finally{we(null)}},ke=async(r,s,u)=>{ee(r);try{await m.patch(p.LEAVE.UPDATE_STATUS(r),{status:s,rejection_reason:u,approved_by:v},l)}catch(S){x(S?.friendlyMessage||"Could not update that request."),ee(null);return}try{await _(),o&&await D(o)}finally{ee(null)}},Ke=r=>{const s=window.prompt("Rejection reason (optional):");s!==null&&ke(r,"rejected",s.trim()||"Not specified")},Je=Array.isArray(w.by_status)?w.by_status:[],P={};Je.forEach(r=>{P[String(r.status).toLowerCase()]=i(r.count)});const Ze=Object.values(P).reduce((r,s)=>r+s,0),er=i(w.total)||Ze,rr=i(w.pending)||P.pending||0,tr=P.approved||0,ar=P.rejected||0,sr=i(w.on_leave)||0,re=Array.isArray(w.by_type)?w.by_type:[],Ee=re.reduce((r,s)=>i(s.count)>r?i(s.count):r,0),N=j?i(j.initial):0,Le=j?i(j.leaveTaken):0,Te=j?i(j.pendingDays):0,nr=j?i(j.currentBalance):0,ir=N?Math.min(100,Le/N*100):0,dr=N?Math.min(100,Te/N*100):0,lr=[{label:"Total Leaves",value:er,icon:Ue,bg:t.primary,fg:t.white},{label:"Pending Review",value:rr,icon:H,bg:t.warning,fg:"#78350f"},{label:"On Leave Today",value:sr,icon:De,bg:t.info,fg:t.white},{label:"Approved",value:tr,icon:jr,bg:t.success,fg:"#065f46"},{label:"Rejected",value:ar,icon:I,bg:t.danger,fg:t.white}],te=Array.isArray(F)?F:[];return(0,e.jsxs)(br,{children:[(0,e.jsxs)(fr,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(wr,{children:"HR Leaves Dashboard"}),(0,e.jsx)(Sr,{children:"Tenant-wide overview, pending approvals, and who is out today."})]}),(0,e.jsxs)($r,{children:[(0,e.jsxs)(Ar,{onClick:_,disabled:xe,children:[xe?(0,e.jsx)(g,{size:16}):(0,e.jsx)(vr,{size:16}),"Refresh"]}),(0,e.jsx)(zr,{children:"Per-tenant • live"})]})]}),me&&(0,e.jsx)(Mr,{children:me}),n?(0,e.jsxs)($,{children:[(0,e.jsx)(g,{size:28}),(0,e.jsx)("span",{children:"Loading HR leave dashboard…"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Cr,{children:lr.map(r=>(0,e.jsxs)(kr,{children:[(0,e.jsxs)(Er,{children:[(0,e.jsx)(Lr,{$bg:r.bg,$fg:r.fg,children:r.icon&&(0,e.jsx)(r.icon,{size:18})}),(0,e.jsx)(Tr,{children:r.value})]}),(0,e.jsx)(Rr,{children:r.label})]},r.label))}),(0,e.jsxs)(Br,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(z,{children:[(0,e.jsx)(C,{children:(0,e.jsxs)(k,{children:[(0,e.jsx)(yr,{size:18}),"Leaves by type"]})}),(0,e.jsx)(E,{children:re.length===0?(0,e.jsx)($,{style:{padding:"1.6rem 1rem"},children:"No leave types recorded yet."}):(0,e.jsx)(Dr,{children:re.map(r=>{const s=Ee?i(r.count)/Ee*100:0;return(0,e.jsxs)(Pr,{children:[(0,e.jsx)(Nr,{children:U[r.leave_type]||r.leave_type||"—"}),(0,e.jsx)(Ur,{children:(0,e.jsx)(Fr,{$color:t.primary,$w:s})}),(0,e.jsx)(Vr,{children:i(r.count)})]},r.leave_type||"row")})})})]}),(0,e.jsxs)(z,{children:[(0,e.jsx)(C,{children:(0,e.jsxs)(k,{children:[(0,e.jsx)(H,{size:18}),"Pending approvals (",te.length,")"]})}),(0,e.jsx)(E,{style:{padding:0},children:te.length===0?(0,e.jsx)($,{style:{padding:"1.6rem 1rem"},children:"No pending leave requests for your tenant."}):(0,e.jsx)(ne,{children:(0,e.jsxs)(ie,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Requester"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Dates"}),(0,e.jsx)("th",{children:"Days"}),(0,e.jsx)("th",{children:"Reason"}),(0,e.jsx)("th",{style:{width:120},children:"Action"})]})}),(0,e.jsx)("tbody",{children:te.map(r=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsxs)(se,{style:{padding:0,borderBottom:0},children:[(0,e.jsx)(q,{children:r.name?String(r.name)[0]:"?"}),r.name||r.email||"User"]})}),(0,e.jsx)("td",{children:U[r.leave_type]||r.leave_type||"—"}),(0,e.jsxs)("td",{children:[y(r.start_date)," → ",y(r.end_date)]}),(0,e.jsx)("td",{children:i(r.days)}),(0,e.jsx)("td",{style:{maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},title:r.reason||"",children:r.reason||(0,e.jsx)(G,{children:"No reason"})}),(0,e.jsx)("td",{children:(0,e.jsxs)(le,{children:[(0,e.jsxs)(A,{className:"approve",onClick:()=>Ae(r.id),disabled:b===r.id,children:[b===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(ae,{size:14})," Approve"]}),(0,e.jsxs)(A,{className:"reject",onClick:()=>_e(r.id),disabled:b===r.id,children:[b===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(I,{size:14})," Reject"]})]})})]},r.id))})]})})})]})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(z,{children:[(0,e.jsx)(C,{children:(0,e.jsxs)(k,{children:[(0,e.jsx)(De,{size:18}),"My leave balance"]})}),(0,e.jsx)(E,{children:j?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(Or,{children:[(0,e.jsx)(Ir,{children:nr}),(0,e.jsx)(Hr,{children:"days available"})]}),(0,e.jsxs)(Wr,{children:[(0,e.jsx)(qr,{$w:ir}),(0,e.jsx)(Gr,{$p:dr})]}),(0,e.jsxs)(Ie,{children:[(0,e.jsxs)("span",{children:["Entitlement: ",N]}),(0,e.jsxs)("span",{children:["Used: ",Le]})]}),(0,e.jsxs)(Ie,{children:[(0,e.jsxs)("span",{children:["Pending: ",Te]}),(0,e.jsxs)("span",{children:["Holiday credit: ",j.holidayCompensations||0]})]})]}):(0,e.jsx)(oe,{children:"Sign in to load your personal leave balance."})})]}),(0,e.jsxs)(z,{children:[(0,e.jsx)(C,{children:(0,e.jsxs)(k,{children:[(0,e.jsx)(Be,{size:18}),"Out today (",Q.length,")"]})}),(0,e.jsx)(E,{style:{padding:0},children:Q.length===0?(0,e.jsx)($,{style:{padding:"1.4rem 1rem"},children:"Nobody is on leave today."}):Q.map(r=>(0,e.jsxs)(se,{children:[(0,e.jsx)(q,{children:r.full_name?String(r.full_name)[0]:"?"}),(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsx)("div",{style:{fontWeight:600,color:t.text},children:r.full_name||r.email||"User"}),(0,e.jsxs)("div",{style:{fontSize:.8,color:t.textSecondary},children:[U[r.leave_type]||r.leave_type||"Leave"," • ",y(r.start_date)," → ",y(r.end_date)]})]}),(0,e.jsx)(de,{$status:"approved",children:"Approved"})]},r.id||r.user_id||r.email))})]})]})]}),(0,e.jsxs)(z,{children:[(0,e.jsxs)(C,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(H,{size:18}),"Recent history"]}),(0,e.jsxs)(G,{children:["Latest ",J.length," requests — approve or reject pending ones right here"]})]}),(0,e.jsx)(E,{style:{padding:0},children:J.length===0?(0,e.jsx)($,{style:{padding:"1.6rem 1rem"},children:"No leave requests submitted yet."}):(0,e.jsx)(ne,{children:(0,e.jsxs)(ie,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Employee"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Dates"}),(0,e.jsx)("th",{children:"Days"}),(0,e.jsx)("th",{children:"Reason"}),(0,e.jsx)("th",{children:"Submitted"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{style:{width:160},children:"Action"})]})}),(0,e.jsx)("tbody",{children:J.map(r=>{const s=String(r.status||"").toLowerCase();return(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsxs)(se,{style:{padding:0,borderBottom:0},children:[(0,e.jsx)(q,{children:r.name?String(r.name)[0]:"?"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontWeight:600,color:t.text},children:r.name||"—"}),(0,e.jsx)("div",{style:{fontSize:.72,color:t.textSecondary},children:r.email||""})]})]})}),(0,e.jsx)("td",{children:U[r.leave_type]||r.leave_type||"—"}),(0,e.jsxs)("td",{children:[y(r.start_date)," → ",y(r.end_date)]}),(0,e.jsx)("td",{children:i(r.days)}),(0,e.jsx)("td",{style:{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},title:r.reason||"",children:r.reason||(0,e.jsx)(G,{children:"No reason"})}),(0,e.jsx)("td",{children:y(r.created_at)}),(0,e.jsx)("td",{children:(0,e.jsx)(de,{$status:s,children:Ve[s]||s})}),(0,e.jsx)("td",{children:s==="pending"?(0,e.jsxs)(le,{children:[(0,e.jsxs)(A,{className:"approve",onClick:()=>Ae(r.id),disabled:b===r.id,children:[b===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(ae,{size:14})," Approve"]}),(0,e.jsxs)(A,{className:"reject",onClick:()=>_e(r.id),disabled:b===r.id,children:[b===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(I,{size:14})," Reject"]})]}):(0,e.jsxs)(_r,{onClick:()=>ze({user_id:r.user_id,name:r.name,email:r.email}),children:["View ",(0,e.jsx)(Ne,{size:13})]})})]},r.id)})})]})})})]}),(0,e.jsxs)(z,{style:{marginTop:"1.5rem"},children:[(0,e.jsxs)(C,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(Be,{size:18}),"All employees (",X.length,")"]}),(0,e.jsx)(G,{children:"Click an employee to open their leave dashboard & add days"})]}),(0,e.jsx)(E,{style:{padding:0},children:X.length===0?(0,e.jsx)($,{style:{padding:"1.6rem 1rem"},children:"No employees found yet. Employees registered in the system appear here with their leave balances."}):(0,e.jsx)(ne,{children:(0,e.jsxs)(ie,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Employee"}),(0,e.jsx)("th",{children:"Email"}),(0,e.jsx)("th",{children:"Entitlement"}),(0,e.jsx)("th",{children:"Taken"}),(0,e.jsx)("th",{children:"Pending"}),(0,e.jsx)("th",{children:"Available"}),(0,e.jsx)("th",{style:{width:60},"aria-label":"Open"})]})}),(0,e.jsx)("tbody",{children:X.map(r=>(0,e.jsxs)(Yr,{onClick:()=>ze(r),title:"Open this employee's leave dashboard",children:[(0,e.jsx)("td",{style:{fontWeight:600,color:t.text},children:r.name||r.full_name||"—"}),(0,e.jsx)("td",{children:r.email||"—"}),(0,e.jsxs)("td",{children:[i(r.initial)," days"]}),(0,e.jsxs)("td",{children:[i(r.leaveTaken)," days"]}),(0,e.jsxs)("td",{children:[i(r.pendingDays)," days"]}),(0,e.jsxs)("td",{style:{fontWeight:700,color:t.primary},children:[i(r.currentBalance)," days"]}),(0,e.jsx)("td",{children:(0,e.jsx)(Qr,{children:(0,e.jsx)(Ne,{size:14})})})]},r.user_id||r.id||r.email||`emp-${r.name}`))})]})})})]})]}),o&&(0,e.jsx)(Xr,{onClick:Ce,children:(0,e.jsxs)(Kr,{onClick:r=>r.stopPropagation(),role:"dialog","aria-label":"Employee leave dashboard",children:[(0,e.jsxs)(Jr,{children:[(0,e.jsx)(q,{style:{width:42,height:42,fontSize:"1rem"},children:(o.name||o.full_name||"?").charAt(0)}),(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsx)(Zr,{children:o.name||o.full_name||"Employee"}),(0,e.jsx)(et,{children:o.email||"—"})]}),(0,e.jsx)(rt,{onClick:Ce,"aria-label":"Close panel",children:(0,e.jsx)(ur,{size:16})})]}),(0,e.jsx)(tt,{children:Ye||!c?(0,e.jsxs)($,{style:{padding:"2.2rem 0"},children:[(0,e.jsx)(g,{size:22}),(0,e.jsx)("span",{children:"Loading leave dashboard…"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(at,{children:[(0,e.jsxs)(L,{children:[(0,e.jsx)(T,{children:"Entitlement"}),(0,e.jsx)(R,{children:i(c.balance?.initial)})]}),(0,e.jsxs)(L,{children:[(0,e.jsx)(T,{children:"Manual adds"}),(0,e.jsx)(R,{children:i(c.balance?.manualAdditions)})]}),(0,e.jsxs)(L,{children:[(0,e.jsx)(T,{children:"Holiday credit"}),(0,e.jsx)(R,{children:i(c.balance?.holidayCompensations)})]}),(0,e.jsxs)(L,{children:[(0,e.jsx)(T,{children:"Taken"}),(0,e.jsx)(R,{children:i(c.balance?.leaveTaken)})]}),(0,e.jsxs)(L,{children:[(0,e.jsx)(T,{children:"Pending"}),(0,e.jsx)(R,{children:i(c.balance?.pendingDays)})]}),(0,e.jsxs)(L,{$hl:!0,children:[(0,e.jsx)(T,{children:"Available"}),(0,e.jsx)(R,{children:i(c.balance?.currentBalance)})]})]}),(0,e.jsxs)(ce,{children:[(0,e.jsx)(Pe,{size:15})," Add leave days"]}),(0,e.jsxs)(st,{children:[(0,e.jsx)(He,{type:"number",min:"1",step:"1",placeholder:"Days",value:B.days,onChange:r=>V(s=>({...s,days:r.target.value}))}),(0,e.jsx)(He,{type:"text",placeholder:"Reason (e.g. 2025 carry-over)",value:B.reason,onChange:r=>V(s=>({...s,reason:r.target.value}))}),(0,e.jsxs)(nt,{onClick:Qe,disabled:ve,children:[ve?(0,e.jsx)(g,{size:14}):(0,e.jsx)(Pe,{size:14})," Add days"]})]}),(0,e.jsxs)(ce,{children:[(0,e.jsx)(H,{size:15})," Day adjustments (",c.additions.length,")"]}),c.additions.length===0?(0,e.jsx)(oe,{children:"No manual day adjustments for this employee yet."}):c.additions.map(r=>(0,e.jsxs)(it,{children:[(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsxs)("div",{style:{fontWeight:700,color:t.success},children:["+",i(r.days)," days"]}),(0,e.jsxs)("div",{style:{fontSize:.75,color:t.textSecondary},children:[y(r.created_at)," · ",r.reason||"No reason recorded"]})]}),(0,e.jsxs)(A,{className:"reject",onClick:()=>Xe(r.id),disabled:fe===r.id,children:[fe===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(gr,{size:13})," Undo"]})]},r.id)),(0,e.jsxs)(ce,{children:[(0,e.jsx)(Ue,{size:15})," Leave history (",c.leaves.length,")"]}),c.leaves.length===0?(0,e.jsx)(oe,{children:"This employee has not applied for leave yet."}):c.leaves.map(r=>{const s=String(r.status||"").toLowerCase();return(0,e.jsxs)(dt,{children:[(0,e.jsxs)(lt,{children:[(0,e.jsx)("span",{style:{fontWeight:700,color:t.text},children:U[r.leave_type]||r.leave_type||"Leave"}),(0,e.jsx)(de,{$status:s,children:Ve[s]||s})]}),(0,e.jsxs)("div",{style:{fontSize:.76,color:t.textSecondary,marginTop:2},children:[y(r.start_date)," → ",y(r.end_date)," · ",i(r.days)," day(s)"]}),r.reason&&(0,e.jsx)("div",{style:{fontSize:.76,color:t.textSecondary,marginTop:4},children:r.reason}),s==="rejected"&&r.rejection_reason&&(0,e.jsxs)("div",{style:{fontSize:.74,color:t.danger,marginTop:4},children:["Rejected: ",r.rejection_reason]}),s==="pending"&&(0,e.jsxs)(le,{style:{justifyContent:"flex-start",marginTop:6},children:[(0,e.jsxs)(A,{className:"approve",onClick:()=>ke(r.id,"approved",null),disabled:M===r.id,children:[M===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(ae,{size:13})," Approve"]}),(0,e.jsxs)(A,{className:"reject",onClick:()=>Ke(r.id),disabled:M===r.id,children:[M===r.id?(0,e.jsx)(g,{size:12}):(0,e.jsx)(I,{size:13})," Reject"]})]})]},r.id)})]})})]})})]})};export{jt as default};
