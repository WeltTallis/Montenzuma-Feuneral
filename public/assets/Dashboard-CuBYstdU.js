import{r as _r}from"./chunk-CXHxssQy.js";import{y as kr}from"./chunk-CXAmgOhv.js";import{_ as a}from"./chunk-DJYPtS2Y.js";import{o as zr}from"./chunk-BY9AVXEY.js";import{c as Cr,l as Er,o as Lr}from"./chunk-C935kdjU.js";import{Fn as Ke,Ft as A,I as Ae,K as he,On as Tr,R as Dr,Rn as Xe,U as Rr,Un as Br,W as De,Wn as pe,d as w,en as Qe,i as $,in as Pr,j as je,ut as Je}from"./index-yov0GYHY.js";import"./chunk-BoetvTsJ.js";var o=_r(kr(),1),e=zr(),d={primary:"#0A2463",primaryLight:"#1A3A7A",white:"#FFFFFF",bg:"#F5F7FA",border:"#E8ECF0",text:"#1A1D24",textSecondary:"#6B7280",success:"#10B981",warning:"#F59E0B",danger:"#E74C3C",info:"#3B82F6"},V={approved:{tint:"#dcfce7",dot:"#22c581",badge:"#f0fdf4",label:"#166534"},pending:{tint:"#fef9c4",dot:"#f59e0b",badge:"#fefceb",label:"#854d0e"},rejected:{tint:"#fee2e2",dot:"#ef4444",badge:"#fef2f2",label:"#991b1b"},cancelled:{tint:"#f1f5f9",dot:"#94a3b8",badge:"#f8fafc",label:"#475569"}},Ze={annual:"Annual",sick:"Sick",maternity:"Maternity",paternity:"Paternity",compassionate:"Compassionate",study:"Study",unpaid:"Unpaid"},Fr=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],ae=n=>String(n).padStart(2,"0"),ve=n=>{if(!n)return null;if(typeof n=="string"&&/^\d{4}-\d{2}-\d{2}/.test(n))return n.slice(0,10);const l=new Date(n);return isNaN(l)?null:`${l.getFullYear()}-${ae(l.getMonth()+1)}-${ae(l.getDate())}`},er=n=>{const l=ve(n);return l?new Date(`${l}T00:00:00`):null},rr=n=>{const l=ve(n);return l?new Date(`${l}T23:59:59`):null},tr=n=>{const l=ve(n);if(!l)return"-";const j=new Date(`${l}T12:00:00`);return isNaN(j)?"-":j.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})},Mr=a.div`
  background: ${d.white};
  border: 1px solid ${d.border};
  border-radius: 12px;
  overflow: hidden;
`,Nr=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid ${d.border};
  background: ${d.bg};
`,_e=a.button`
  background: ${d.white};
  border: 1px solid ${d.border};
  border-radius: 6px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${d.textSecondary};
  transition: all 0.2s;
  &:hover {
    background: ${d.primary};
    color: ${d.white};
  }
`,Ur=a.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${d.text};
`,Or=a.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: ${d.bg};
  border-bottom: 1px solid ${d.border};
`,Vr=a.div`
  text-align: center;
  padding: 0.45rem 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${d.textSecondary};
`,ar=a.div`
  font-size: 0.7rem;
  font-weight: ${n=>n.$today?"700":"500"};
  color: ${n=>n.$today?d.primary:n.$muted?d.textSecondary:d.text};
  padding: 2px 4px;
`,Ir=a.span`
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  margin-top: 2px;
  background: ${n=>n.$color||d.info};
  cursor: ${n=>n.$interactive?"pointer":"default"};
`,Wr=a.div`
  padding: 1rem;
`,Hr=a.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
`,Yr=a.div`
  flex: 1;
  height: 18px;
  background: ${d.bg};
  border-radius: 9px;
  overflow: hidden;
  position: relative;
  min-width: 60px;
`,qr=a.div`
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9px;
  background: ${n=>n.$color||d.info};
`,Gr=a.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${n=>n.$color||d.info};
  flex-shrink: 0;
`,Kr=a.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${d.text};
  min-width: 90px;
`,Xr=a.div`
  font-size: 0.78rem;
  color: ${d.textSecondary};
  white-space: nowrap;
`,Qr=a.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${n=>n.$color||d.info};
`,Jr=a.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-top: 1px solid ${d.border};
  background: ${d.bg};
  font-size: 0.76rem;
  color: ${d.textSecondary};
`,xe=a.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`,ge=a.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: ${n=>n.$color};
`,Zr=a.div`
  text-align: center;
  padding: 2.5rem 1rem;
  color: ${d.textSecondary};
`,et=a.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${d.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
`,rt=a.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`,nr=a.div`
  height: 54px;
  padding: 3px;
  border-bottom: 1px solid ${d.border};
  border-right: 1px solid ${d.border};
  position: relative;
  background: ${n=>n.$today?"#eff4ff":d.white};
`,sr=({leaves:n=[],onLeaveClick:l})=>{const j=new Date,ne=`${ae(j.getFullYear())}-${ae(j.getMonth()+1)}-${ae(j.getDate())}`,g=(0,o.useMemo)(()=>n.map(s=>{const p=er(s.start_date),x=rr(s.end_date);if(!p||!x)return null;const c=(s.status||"pending").toLowerCase(),L=V[c]||V.pending;return{id:s.id,title:s.name?`${s.name} · ${s.leave_type?Ze[s.leave_type]||s.leave_type:"Leave"}`:s.leave_type?Ze[s.leave_type]||s.leave_type:"Leave",start:p,end:x,days:Number(s.days)||0,status:c,style:L,leave:s}}).filter(Boolean),[n]),u=(0,o.useMemo)(()=>{if(g.length===0)return{year:j.getFullYear(),month:j.getMonth()};const s=g.reduce((p,x)=>x.start<p?x.start:p,g[0].start);return{year:s.getFullYear(),month:s.getMonth()}},[g,j]),[f,Y]=(0,o.useState)(u.year),[S,E]=(0,o.useState)(u.month),q=new Date(f,S+1,0).getDate(),fe=new Date(f,S,1).getDay(),v=[];for(let s=0;s<fe;s+=1)v.push({blank:!0,date:null});for(let s=1;s<=q;s+=1){const p=new Date(f,S,s);v.push({blank:!1,date:p,ymd:ve(p)})}const se=(0,o.useCallback)(s=>g.filter(p=>s&&p.start<=rr(s)&&p.end>=er(s)),[g]),G=new Date(f,S,1).toLocaleString("default",{month:"long"}),ie=()=>{S===0?(Y(s=>s-1),E(11)):E(s=>s-1)},_=()=>{S===11?(Y(s=>s+1),E(0)):E(s=>s+1)},K=()=>{Y(j.getFullYear()),E(j.getMonth())},X=(0,o.useMemo)(()=>{if(g.length===0)return{minStart:null,maxEnd:null,spanMs:0};const s=g.reduce((x,c)=>c.start<x?c.start:x,g[0].start),p=g.reduce((x,c)=>c.end>x?c.end:x,g[0].end);return{minStart:s,maxEnd:p,spanMs:p.getTime()-s.getTime()}},[g]);return(0,e.jsxs)(Mr,{children:[(0,e.jsxs)(Nr,{children:[(0,e.jsx)(_e,{onClick:ie,"aria-label":"Previous month",children:(0,e.jsx)(Rr,{size:16})}),(0,e.jsxs)(Ur,{children:[G," ",f]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.35rem"},children:[(0,e.jsx)(_e,{onClick:K,"aria-label":"Today",children:"Today"}),(0,e.jsx)(_e,{onClick:_,"aria-label":"Next month",children:(0,e.jsx)(De,{size:16})})]})]}),(0,e.jsx)(Or,{children:Fr.map(s=>(0,e.jsx)(Vr,{children:s},s))}),(0,e.jsx)(rt,{children:v.map((s,p)=>{if(s.blank)return(0,e.jsx)(nr,{},`blank-${p}`);const x=s.ymd===ne,c=se(s.ymd),L=c.slice(0,2),m=c.length-L.length;return(0,e.jsxs)(nr,{$today:x,children:[(0,e.jsx)(ar,{$today:x,children:s.date.getDate()}),c.length>0&&(0,e.jsxs)("div",{style:{marginTop:2,display:"flex",flexDirection:"column",gap:1},children:[L.map(k=>(0,e.jsx)(Ir,{$color:k.style.dot,$interactive:!!l,title:`${k.title} (${k.status})`,role:l?"button":void 0,tabIndex:l?0:void 0,onClick:l?()=>l(k.leave):void 0,onKeyDown:l?de=>{(de.key==="Enter"||de.key===" ")&&l(k.leave)}:void 0},k.id)),m>0&&(0,e.jsxs)(ar,{$muted:!0,style:{fontSize:"0.6rem"},children:["+",m]})]})]},s.ymd)})}),(0,e.jsxs)(Wr,{children:[(0,e.jsx)(et,{children:"Leave Periods"}),g.length===0?(0,e.jsxs)(Zr,{children:[(0,e.jsx)(je,{size:32,style:{marginBottom:"0.5rem",opacity:.3}}),(0,e.jsx)("p",{style:{margin:0,fontSize:"0.85rem"},children:"No leave history found for this employee."})]}):g.map(s=>{const{minStart:p,spanMs:x}=X,c=x>0?(s.start.getTime()-p.getTime())/x*100:0,L=x>0?(s.end.getTime()-s.start.getTime())/x*100:0;return(0,e.jsxs)(Hr,{onClick:l?()=>l(s.leave):void 0,style:l?{cursor:"pointer"}:void 0,title:l?"Open leave record":void 0,children:[(0,e.jsx)(Gr,{$color:s.style.dot}),(0,e.jsx)(Kr,{children:s.title}),(0,e.jsx)(Yr,{children:(0,e.jsx)(qr,{$color:s.style.dot,style:{left:`${c}%`,width:`${Math.max(L,4)}%`}})}),(0,e.jsxs)(Xr,{children:[tr(s.start)," → ",tr(s.end)]}),(0,e.jsxs)(Qr,{$color:s.style.dot,children:[s.days," day",s.days!==1?"s":""]})]},s.id)})]}),(0,e.jsxs)(Jr,{children:[(0,e.jsxs)(xe,{children:[(0,e.jsx)(ge,{$color:V.approved.dot})," Approved"]}),(0,e.jsxs)(xe,{children:[(0,e.jsx)(ge,{$color:V.pending.dot})," Pending"]}),(0,e.jsxs)(xe,{children:[(0,e.jsx)(ge,{$color:V.rejected.dot})," Rejected"]}),(0,e.jsxs)(xe,{children:[(0,e.jsx)(ge,{$color:V.cancelled.dot})," Cancelled"]}),(0,e.jsxs)("span",{style:{marginLeft:"auto",color:d.textSecondary,fontSize:"0.72rem"},children:[g.length," leave",g.length!==1?"s":""]})]})]})},t={primaryLight:"#1A3A7A",textSecondary:"#6B7280",primary:"#0A2463",white:"#FFFFFF",bg:"#F5F7FA",border:"#E8ECF0",text:"#1A1D24",success:"#10B981",warning:"#F59E0B",danger:"#E74C3C",info:"#3B82F6"},ir={pending:{bg:"rgba(245, 158, 11, 0.12)",fg:"#B45309",badge:t.warning},approved:{bg:"rgba(16, 185, 129, 0.12)",fg:"#047857",badge:t.success},rejected:{bg:"rgba(231, 76, 60, 0.12)",fg:"#B91C1C",badge:t.danger},cancelled:{bg:"#E5E7EB",fg:t.textSecondary,badge:t.textSecondary}},re={annual:"Annual",sick:"Sick",maternity:"Maternity",paternity:"Paternity",compassionate:"Compassionate",study:"Study",unpaid:"Unpaid"},dr={pending:"Pending",approved:"Approved",rejected:"Rejected",cancelled:"Cancelled"},or=n=>ir[String(n||"").toLowerCase()]||ir.cancelled,C=n=>n?new Date(n).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—",me=n=>!n||!n.data?[]:Array.isArray(n.data)?n.data:Array.isArray(n.data.data)?n.data.data:[],lr=n=>!n||!n.data?null:n.data.data&&typeof n.data.data=="object"&&!Array.isArray(n.data.data)?n.data.data:n.data,h=n=>Number(n)||0,tt=a.div`
  padding: 1.5rem;
  max-width: 1240px;
  margin: 0 auto;
  background: ${t.white};
`,at=a.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`,nt=a.h1`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: ${t.text};
`,st=a.p`
  margin: 0;
  color: ${t.textSecondary};
  font-size: 0.9rem;
`,it=a.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`,dt=a.button`
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
`,ot=a.button`
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
`,lt=a.span`
  font-size: 0.78rem;
  color: ${t.textSecondary};
`,ct=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0;
`,ht=a.div`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 14px;
  padding: 1.1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`,pt=a.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`,xt=a.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${n=>n.$bg||t.primary};
  color: ${n=>n.$fg||t.white};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,gt=a.div`
  font-size: 1.55rem;
  font-weight: 800;
  color: ${t.text};
  margin-top: 0.3rem;
`,mt=a.div`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: ${t.textSecondary};
`,B=a.div`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  overflow: hidden;
`,P=a.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${t.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`,F=a.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${t.text};
`,M=a.div`
  padding: 1.25rem;
`,ut=a.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`,yt=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`,jt=a.div`
  display: grid;
  grid-template-columns: 110px 1fr 55px;
  align-items: center;
  gap: 0.6rem;
`,vt=a.span`
  font-size: 0.8rem;
  color: ${t.text};
  font-weight: 600;
`,ft=a.div`
  background: ${t.bg};
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
`,bt=a.div`
  height: 100%;
  border-radius: 8px;
  background: ${n=>n.$color||t.primary};
  width: ${n=>`${n.$w}%`};
`,wt=a.span`
  font-weight: 700;
  color: ${t.text};
  justify-self: end;
`,ke=a.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid ${t.border};
  &:last-child { border-bottom: 0; }
`,ue=a.div`
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
`,N=a.div`
  padding: 2.2rem 1rem;
  text-align: center;
  color: ${t.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
`,$t=a.div`
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid ${t.danger};
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: ${t.danger};
  font-size: 0.85rem;
`,ze=a.div`
  overflow-x: auto;
`,Ce=a.table`
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
`,Ee=a.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: ${n=>or(n.$status).fg};
  background: ${n=>or(n.$status).bg};
`,Le=a.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: flex-end;
`,U=a.button`
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
`,te=a.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: ${t.bg};
  color: ${t.textSecondary};
`,St=a.div`text-align: center; margin: 0.5rem 0;`,At=a.div`font-size: 2rem; font-weight: 800; color: ${t.primary};`,_t=a.div`font-size: 0.78rem; color: ${t.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;`,kt=a.div`height: 9px; background: ${t.bg}; border-radius: 999px; overflow: hidden; display: flex; margin: 0.8rem 0;`,zt=a.div`background: ${t.primary}; width: ${n=>`${n.$w}%`}; height: 100%;`,Ct=a.div`background: ${t.warning}; width: ${n=>`${n.$p}%`}; height: 100%;`,cr=a.div`display: flex; justify-content: space-between; font-size: 0.82rem; color: ${t.textSecondary}; margin-top: 0.4rem;`,Te=a.div`font-size: 0.78rem; color: ${t.textSecondary}; margin-top: 0.6rem;`,Et=a.tr`
  cursor: pointer;
  &:hover td { background: rgba(10, 36, 99, 0.04); }
`,Lt=a.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid ${t.border};
  color: ${t.primary};
  background: ${t.white};
`,Tt=a.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`,Dt=a.div`
  width: min(480px, 100%);
  height: 100%;
  background: ${t.white};
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,Rt=a.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid ${t.border};
  background: ${t.bg};
`,Bt=a.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${t.text};
`,Pt=a.div`
  font-size: 0.78rem;
  color: ${t.textSecondary};
`,Ft=a.button`
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
`,Mt=a.div`
  padding: 1.1rem 1.25rem 2rem 1.25rem;
  overflow-y: auto;
  flex: 1;
`,Nt=a.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.4rem;
`,I=a.div`
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: ${n=>n.$hl?"rgba(10, 36, 99, 0.06)":t.white};
`,W=a.div`
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: ${t.textSecondary};
`,H=a.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${n=>n.$hl?t.primary:t.text};
`,ye=a.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${t.text};
  margin: 1.2rem 0 0.6rem 0;
`,Ut=a.div`
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 0.5rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`,hr=a.input`
  border: 1px solid ${t.border};
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  color: ${t.text};
  min-width: 0;
  &:focus { outline: none; border-color: ${t.primary}; }
`,Ot=a.button`
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
`,Vt=a.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${t.white};
`,It=a.div`
  border: 1px solid ${t.border};
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${t.white};
`,Wt=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`,Jt=()=>{const[n,l]=(0,o.useState)(!0),[j,ne]=(0,o.useState)(!1),[g,u]=(0,o.useState)(""),[f,Y]=(0,o.useState)({total:0,pending:0,on_leave:0,by_status:[],by_type:[]}),[S,E]=(0,o.useState)([]),[q,fe]=(0,o.useState)([]),[v,se]=(0,o.useState)(null),[G,ie]=(0,o.useState)([]),[_,K]=(0,o.useState)(null),[X,s]=(0,o.useState)([]),[p,x]=(0,o.useState)([]),[c,L]=(0,o.useState)(null),[m,k]=(0,o.useState)(null),[de,Re]=(0,o.useState)(!1),[Q,oe]=(0,o.useState)({days:"",reason:""}),[Be,Pe]=(0,o.useState)(!1),[Fe,Me]=(0,o.useState)(null),[le,be]=(0,o.useState)(null),T=Er(),Ne=Lr()||Cr(),y=(0,o.useMemo)(()=>{const r={"x-tenant-slug":Ne};return T&&(r["x-user-id"]=T.toString()),{headers:r}},[Ne,T]),ce=(0,o.useCallback)(async r=>{u("");const i=await $.get(w.LEAVE.STATS,{...y,signal:r});Y(i.data?.data||{total:0,pending:0,on_leave:0,by_status:[],by_type:[]});const[z,R]=await Promise.all([$.get(w.LEAVE.ALL,{...y,signal:r}),$.get(w.LEAVE.USERS_ON_LEAVE,{...y,signal:r})]),D=me(z);if(x(D),s(D.slice(0,12)),E(D.filter(b=>String(b.status||"").toLowerCase()==="pending")),fe(me(R)),T)try{const b=await $.get(w.LEAVE.BALANCE(T),{...y,signal:r});se(lr(b))}catch{se(null)}try{const b=await $.get(w.LEAVE.BALANCES,{...y,signal:r}),Ge=b?.data?.data||b?.data||[];ie(Array.isArray(Ge)?Ge:[])}catch{ie([])}l(!1)},[y,T]);(0,o.useEffect)(()=>{const r=new AbortController;let i=!1;return(async()=>{try{await ce(r.signal)}catch(z){i||u(z?.friendlyMessage||"Failed to load HR leave dashboard. Please try again."),i||l(!1)}})(),()=>{i=!0,r.abort()}},[ce]);const O=(0,o.useCallback)(async()=>{ne(!0);try{const r=new AbortController;await ce(r.signal)}catch(r){u(r?.friendlyMessage||"Failed to refresh data.")}finally{ne(!1)}},[ce]),Ue=(0,o.useCallback)(async(r,i,z)=>{K(r);const R=S.slice();E(D=>D.map(b=>b.id===r?{...b,status:i,rejection_reason:z||b.rejection_reason}:b));try{await $.patch(w.LEAVE.UPDATE_STATUS(r),{status:i,rejection_reason:z,approved_by:T},y)}catch(D){E(R),u(D?.friendlyMessage||"Could not update that request. It may have already been processed."),K(null);return}try{await O()}catch(D){u(D?.friendlyMessage||"Request updated, but the dashboard could not be refreshed.")}finally{K(null)}},[S,O,y]),Oe=r=>Ue(r,"approved",null),Ve=r=>{const i=window.prompt("Rejection reason (optional):")??"";i!==null&&Ue(r,"rejected",i.trim()||"Not specified")},J=(0,o.useCallback)(async r=>{if(!r?.user_id)return;Re(!0);const[i,z,R]=await Promise.all([$.get(w.LEAVE.BALANCE(r.user_id),y).catch(()=>null),$.get(w.LEAVE.ALL,{...y,params:{user_id:r.user_id}}).catch(()=>null),$.get(w.LEAVE.ADDITIONS(r.user_id),y).catch(()=>null)]);k({balance:lr(i),leaves:me(z),additions:me(R)}),Re(!1)},[y]),we=(0,o.useCallback)(r=>{L(r),k(null),oe({days:"",reason:""}),J(r)},[J]),Ie=()=>{L(null),k(null)},pr=async()=>{if(!c)return;const r=Number(Q.days);if(!r||r<1){u("Enter at least 1 day to add.");return}if(!String(Q.reason).trim()){u("A reason is required when adding leave days.");return}Pe(!0);try{await $.post(w.LEAVE.ADD_DAYS,{user_id:c.user_id,days:r,reason:String(Q.reason).trim(),added_by:T||void 0},y),oe({days:"",reason:""}),u(""),await Promise.all([J(c),O()])}catch(i){u(i?.friendlyMessage||"Could not add leave days. Please try again.")}finally{Pe(!1)}},xr=async r=>{Me(r);try{await $.delete(w.LEAVE.REMOVE_DAYS(r),y),u(""),c&&await Promise.all([J(c),O()])}catch(i){u(i?.friendlyMessage||"Could not remove that adjustment.")}finally{Me(null)}},We=async(r,i,z)=>{be(r);try{await $.patch(w.LEAVE.UPDATE_STATUS(r),{status:i,rejection_reason:z,approved_by:T},y)}catch(R){u(R?.friendlyMessage||"Could not update that request."),be(null);return}try{await O(),c&&await J(c)}finally{be(null)}},gr=r=>{const i=window.prompt("Rejection reason (optional):");i!==null&&We(r,"rejected",i.trim()||"Not specified")},mr=Array.isArray(f.by_status)?f.by_status:[],Z={};mr.forEach(r=>{Z[String(r.status).toLowerCase()]=h(r.count)});const ur=Object.values(Z).reduce((r,i)=>r+i,0),yr=h(f.total)||ur,jr=h(f.pending)||Z.pending||0,vr=Z.approved||0,fr=Z.rejected||0,br=h(f.on_leave)||0,$e=Array.isArray(f.by_type)?f.by_type:[],He=$e.reduce((r,i)=>h(i.count)>r?h(i.count):r,0),ee=v?h(v.initial):0,Ye=v?h(v.leaveTaken):0,qe=v?h(v.pendingDays):0,wr=v?h(v.currentBalance):0,$r=ee?Math.min(100,Ye/ee*100):0,Sr=ee?Math.min(100,qe/ee*100):0,Ar=[{label:"Total Leaves",value:yr,icon:Je,bg:t.primary,fg:t.white},{label:"Pending Review",value:jr,icon:he,bg:t.warning,fg:"#78350f"},{label:"On Leave Today",value:br,icon:Ke,bg:t.info,fg:t.white},{label:"Approved",value:vr,icon:Dr,bg:t.success,fg:"#065f46"},{label:"Rejected",value:fr,icon:pe,bg:t.danger,fg:t.white}],Se=Array.isArray(S)?S:[];return(0,e.jsxs)(tt,{children:[(0,e.jsxs)(at,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(nt,{children:"HR Leaves Dashboard"}),(0,e.jsx)(st,{children:"Tenant-wide overview, pending approvals, and who is out today."})]}),(0,e.jsxs)(it,{children:[(0,e.jsxs)(dt,{onClick:O,disabled:j,children:[j?(0,e.jsx)(A,{size:16}):(0,e.jsx)(Pr,{size:16}),"Refresh"]}),(0,e.jsx)(lt,{children:"Per-tenant • live"})]})]}),g&&(0,e.jsx)($t,{children:g}),n?(0,e.jsxs)(N,{children:[(0,e.jsx)(A,{size:28}),(0,e.jsx)("span",{children:"Loading HR leave dashboard…"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ct,{children:Ar.map(r=>(0,e.jsxs)(ht,{children:[(0,e.jsxs)(pt,{children:[(0,e.jsx)(xt,{$bg:r.bg,$fg:r.fg,children:r.icon&&(0,e.jsx)(r.icon,{size:18})}),(0,e.jsx)(gt,{children:r.value})]}),(0,e.jsx)(mt,{children:r.label})]},r.label))}),(0,e.jsxs)(ut,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(P,{children:(0,e.jsxs)(F,{children:[(0,e.jsx)(je,{size:18}),"Leaves by type"]})}),(0,e.jsx)(M,{children:$e.length===0?(0,e.jsx)(N,{style:{padding:"1.6rem 1rem"},children:"No leave types recorded yet."}):(0,e.jsx)(yt,{children:$e.map(r=>{const i=He?h(r.count)/He*100:0;return(0,e.jsxs)(jt,{children:[(0,e.jsx)(vt,{children:re[r.leave_type]||r.leave_type||"—"}),(0,e.jsx)(ft,{children:(0,e.jsx)(bt,{$color:t.primary,$w:i})}),(0,e.jsx)(wt,{children:h(r.count)})]},r.leave_type||"row")})})})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(P,{children:(0,e.jsxs)(F,{children:[(0,e.jsx)(he,{size:18}),"Pending approvals (",Se.length,")"]})}),(0,e.jsx)(M,{style:{padding:0},children:Se.length===0?(0,e.jsx)(N,{style:{padding:"1.6rem 1rem"},children:"No pending leave requests for your tenant."}):(0,e.jsx)(ze,{children:(0,e.jsxs)(Ce,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Requester"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Dates"}),(0,e.jsx)("th",{children:"Days"}),(0,e.jsx)("th",{children:"Reason"}),(0,e.jsx)("th",{style:{width:120},children:"Action"})]})}),(0,e.jsx)("tbody",{children:Se.map(r=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsxs)(ke,{style:{padding:0,borderBottom:0},children:[(0,e.jsx)(ue,{children:r.name?String(r.name)[0]:"?"}),r.name||r.email||"User"]})}),(0,e.jsx)("td",{children:re[r.leave_type]||r.leave_type||"—"}),(0,e.jsxs)("td",{children:[C(r.start_date)," → ",C(r.end_date)]}),(0,e.jsx)("td",{children:h(r.days)}),(0,e.jsx)("td",{style:{maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},title:r.reason||"",children:r.reason||(0,e.jsx)(te,{children:"No reason"})}),(0,e.jsx)("td",{children:(0,e.jsxs)(Le,{children:[(0,e.jsxs)(U,{className:"approve",onClick:()=>Oe(r.id),disabled:_===r.id,children:[_===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(Ae,{size:14})," Approve"]}),(0,e.jsxs)(U,{className:"reject",onClick:()=>Ve(r.id),disabled:_===r.id,children:[_===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(pe,{size:14})," Reject"]})]})})]},r.id))})]})})})]})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(P,{children:(0,e.jsxs)(F,{children:[(0,e.jsx)(Ke,{size:18}),"My leave balance"]})}),(0,e.jsx)(M,{children:v?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(St,{children:[(0,e.jsx)(At,{children:wr}),(0,e.jsx)(_t,{children:"days available"})]}),(0,e.jsxs)(kt,{children:[(0,e.jsx)(zt,{$w:$r}),(0,e.jsx)(Ct,{$p:Sr})]}),(0,e.jsxs)(cr,{children:[(0,e.jsxs)("span",{children:["Entitlement: ",ee]}),(0,e.jsxs)("span",{children:["Used: ",Ye]})]}),(0,e.jsxs)(cr,{children:[(0,e.jsxs)("span",{children:["Pending: ",qe]}),(0,e.jsxs)("span",{children:["Holiday credit: ",v.holidayCompensations||0]})]})]}):(0,e.jsx)(Te,{children:"Sign in to load your personal leave balance."})})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(P,{children:(0,e.jsxs)(F,{children:[(0,e.jsx)(Xe,{size:18}),"Out today (",q.length,")"]})}),(0,e.jsx)(M,{style:{padding:0},children:q.length===0?(0,e.jsx)(N,{style:{padding:"1.4rem 1rem"},children:"Nobody is on leave today."}):q.map(r=>(0,e.jsxs)(ke,{children:[(0,e.jsx)(ue,{children:r.full_name?String(r.full_name)[0]:"?"}),(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsx)("div",{style:{fontWeight:600,color:t.text},children:r.full_name||r.email||"User"}),(0,e.jsxs)("div",{style:{fontSize:.8,color:t.textSecondary},children:[re[r.leave_type]||r.leave_type||"Leave"," • ",C(r.start_date)," → ",C(r.end_date)]})]}),(0,e.jsx)(Ee,{$status:"approved",children:"Approved"})]},r.id||r.user_id||r.email))})]})]})]}),(0,e.jsxs)(B,{children:[(0,e.jsxs)(P,{children:[(0,e.jsxs)(F,{children:[(0,e.jsx)(he,{size:18}),"Recent history"]}),(0,e.jsxs)(te,{children:["Latest ",X.length," requests — approve or reject pending ones right here"]})]}),(0,e.jsx)(M,{style:{padding:0},children:X.length===0?(0,e.jsx)(N,{style:{padding:"1.6rem 1rem"},children:"No leave requests submitted yet."}):(0,e.jsx)(ze,{children:(0,e.jsxs)(Ce,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Employee"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Dates"}),(0,e.jsx)("th",{children:"Days"}),(0,e.jsx)("th",{children:"Reason"}),(0,e.jsx)("th",{children:"Submitted"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{style:{width:160},children:"Action"})]})}),(0,e.jsx)("tbody",{children:X.map(r=>{const i=String(r.status||"").toLowerCase();return(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsxs)(ke,{style:{padding:0,borderBottom:0},children:[(0,e.jsx)(ue,{children:r.name?String(r.name)[0]:"?"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontWeight:600,color:t.text},children:r.name||"—"}),(0,e.jsx)("div",{style:{fontSize:.72,color:t.textSecondary},children:r.email||""})]})]})}),(0,e.jsx)("td",{children:re[r.leave_type]||r.leave_type||"—"}),(0,e.jsxs)("td",{children:[C(r.start_date)," → ",C(r.end_date)]}),(0,e.jsx)("td",{children:h(r.days)}),(0,e.jsx)("td",{style:{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},title:r.reason||"",children:r.reason||(0,e.jsx)(te,{children:"No reason"})}),(0,e.jsx)("td",{children:C(r.created_at)}),(0,e.jsx)("td",{children:(0,e.jsx)(Ee,{$status:i,children:dr[i]||i})}),(0,e.jsx)("td",{children:i==="pending"?(0,e.jsxs)(Le,{children:[(0,e.jsxs)(U,{className:"approve",onClick:()=>Oe(r.id),disabled:_===r.id,children:[_===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(Ae,{size:14})," Approve"]}),(0,e.jsxs)(U,{className:"reject",onClick:()=>Ve(r.id),disabled:_===r.id,children:[_===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(pe,{size:14})," Reject"]})]}):(0,e.jsxs)(ot,{onClick:()=>we({user_id:r.user_id,name:r.name,email:r.email}),children:["View ",(0,e.jsx)(De,{size:13})]})})]},r.id)})})]})})})]}),(0,e.jsxs)(B,{style:{marginTop:"1.5rem"},children:[(0,e.jsxs)(P,{children:[(0,e.jsxs)(F,{children:[(0,e.jsx)(je,{size:18}),"Leave calendar"]}),(0,e.jsxs)(te,{children:[p.length," tenant leave records"]})]}),(0,e.jsx)(M,{style:{padding:"0.75rem"},children:(0,e.jsx)(sr,{leaves:p,onLeaveClick:r=>we({user_id:r.user_id,name:r.name,email:r.email})})})]}),(0,e.jsxs)(B,{style:{marginTop:"1.5rem"},children:[(0,e.jsxs)(P,{children:[(0,e.jsxs)(F,{children:[(0,e.jsx)(Xe,{size:18}),"All employees (",G.length,")"]}),(0,e.jsx)(te,{children:"Click an employee to open their leave dashboard & add days"})]}),(0,e.jsx)(M,{style:{padding:0},children:G.length===0?(0,e.jsx)(N,{style:{padding:"1.6rem 1rem"},children:"No employees found yet. Employees registered in the system appear here with their leave balances."}):(0,e.jsx)(ze,{children:(0,e.jsxs)(Ce,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Employee"}),(0,e.jsx)("th",{children:"Email"}),(0,e.jsx)("th",{children:"Entitlement"}),(0,e.jsx)("th",{children:"Taken"}),(0,e.jsx)("th",{children:"Pending"}),(0,e.jsx)("th",{children:"Available"}),(0,e.jsx)("th",{style:{width:60},"aria-label":"Open"})]})}),(0,e.jsx)("tbody",{children:G.map(r=>(0,e.jsxs)(Et,{onClick:()=>we(r),title:"Open this employee's leave dashboard",children:[(0,e.jsx)("td",{style:{fontWeight:600,color:t.text},children:r.name||r.full_name||"—"}),(0,e.jsx)("td",{children:r.email||"—"}),(0,e.jsxs)("td",{children:[h(r.initial)," days"]}),(0,e.jsxs)("td",{children:[h(r.leaveTaken)," days"]}),(0,e.jsxs)("td",{children:[h(r.pendingDays)," days"]}),(0,e.jsxs)("td",{style:{fontWeight:700,color:t.primary},children:[h(r.currentBalance)," days"]}),(0,e.jsx)("td",{children:(0,e.jsx)(Lt,{children:(0,e.jsx)(De,{size:14})})})]},r.user_id||r.id||r.email||`emp-${r.name}`))})]})})})]})]}),c&&(0,e.jsx)(Tt,{onClick:Ie,children:(0,e.jsxs)(Dt,{onClick:r=>r.stopPropagation(),role:"dialog","aria-label":"Employee leave dashboard",children:[(0,e.jsxs)(Rt,{children:[(0,e.jsx)(ue,{style:{width:42,height:42,fontSize:"1rem"},children:(c.name||c.full_name||"?").charAt(0)}),(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsx)(Bt,{children:c.name||c.full_name||"Employee"}),(0,e.jsx)(Pt,{children:c.email||"—"})]}),(0,e.jsx)(Ft,{onClick:Ie,"aria-label":"Close panel",children:(0,e.jsx)(Br,{size:16})})]}),(0,e.jsx)(Mt,{children:de||!m?(0,e.jsxs)(N,{style:{padding:"2.2rem 0"},children:[(0,e.jsx)(A,{size:22}),(0,e.jsx)("span",{children:"Loading leave dashboard…"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(Nt,{children:[(0,e.jsxs)(I,{children:[(0,e.jsx)(W,{children:"Entitlement"}),(0,e.jsx)(H,{children:h(m.balance?.initial)})]}),(0,e.jsxs)(I,{children:[(0,e.jsx)(W,{children:"Manual adds"}),(0,e.jsx)(H,{children:h(m.balance?.manualAdditions)})]}),(0,e.jsxs)(I,{children:[(0,e.jsx)(W,{children:"Holiday credit"}),(0,e.jsx)(H,{children:h(m.balance?.holidayCompensations)})]}),(0,e.jsxs)(I,{children:[(0,e.jsx)(W,{children:"Taken"}),(0,e.jsx)(H,{children:h(m.balance?.leaveTaken)})]}),(0,e.jsxs)(I,{children:[(0,e.jsx)(W,{children:"Pending"}),(0,e.jsx)(H,{children:h(m.balance?.pendingDays)})]}),(0,e.jsxs)(I,{$hl:!0,children:[(0,e.jsx)(W,{children:"Available"}),(0,e.jsx)(H,{children:h(m.balance?.currentBalance)})]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(je,{size:15})," Leave calendar"]}),(0,e.jsx)(sr,{leaves:m.leaves}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(Qe,{size:15})," Add leave days"]}),(0,e.jsxs)(Ut,{children:[(0,e.jsx)(hr,{type:"number",min:"1",step:"1",placeholder:"Days",value:Q.days,onChange:r=>oe(i=>({...i,days:r.target.value}))}),(0,e.jsx)(hr,{type:"text",placeholder:"Reason (e.g. 2025 carry-over)",value:Q.reason,onChange:r=>oe(i=>({...i,reason:r.target.value}))}),(0,e.jsxs)(Ot,{onClick:pr,disabled:Be,children:[Be?(0,e.jsx)(A,{size:14}):(0,e.jsx)(Qe,{size:14})," Add days"]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(he,{size:15})," Day adjustments (",m.additions.length,")"]}),m.additions.length===0?(0,e.jsx)(Te,{children:"No manual day adjustments for this employee yet."}):m.additions.map(r=>(0,e.jsxs)(Vt,{children:[(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsxs)("div",{style:{fontWeight:700,color:t.success},children:["+",h(r.days)," days"]}),(0,e.jsxs)("div",{style:{fontSize:.75,color:t.textSecondary},children:[C(r.created_at)," · ",r.reason||"No reason recorded"]})]}),(0,e.jsxs)(U,{className:"reject",onClick:()=>xr(r.id),disabled:Fe===r.id,children:[Fe===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(Tr,{size:13})," Undo"]})]},r.id)),(0,e.jsxs)(ye,{children:[(0,e.jsx)(Je,{size:15})," Leave history (",m.leaves.length,")"]}),m.leaves.length===0?(0,e.jsx)(Te,{children:"This employee has not applied for leave yet."}):m.leaves.map(r=>{const i=String(r.status||"").toLowerCase();return(0,e.jsxs)(It,{children:[(0,e.jsxs)(Wt,{children:[(0,e.jsx)("span",{style:{fontWeight:700,color:t.text},children:re[r.leave_type]||r.leave_type||"Leave"}),(0,e.jsx)(Ee,{$status:i,children:dr[i]||i})]}),(0,e.jsxs)("div",{style:{fontSize:.76,color:t.textSecondary,marginTop:2},children:[C(r.start_date)," → ",C(r.end_date)," · ",h(r.days)," day(s)"]}),r.reason&&(0,e.jsx)("div",{style:{fontSize:.76,color:t.textSecondary,marginTop:4},children:r.reason}),i==="rejected"&&r.rejection_reason&&(0,e.jsxs)("div",{style:{fontSize:.74,color:t.danger,marginTop:4},children:["Rejected: ",r.rejection_reason]}),i==="pending"&&(0,e.jsxs)(Le,{style:{justifyContent:"flex-start",marginTop:6},children:[(0,e.jsxs)(U,{className:"approve",onClick:()=>We(r.id,"approved",null),disabled:le===r.id,children:[le===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(Ae,{size:13})," Approve"]}),(0,e.jsxs)(U,{className:"reject",onClick:()=>gr(r.id),disabled:le===r.id,children:[le===r.id?(0,e.jsx)(A,{size:12}):(0,e.jsx)(pe,{size:13})," Reject"]})]})]},r.id)})]})})]})})]})};export{Jt as default};
