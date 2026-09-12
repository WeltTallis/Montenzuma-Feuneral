import{r as Se}from"./chunk-CXHxssQy.js";import{y as ke}from"./chunk-CXAmgOhv.js";import{l as Ce}from"./chunk-DWc5g_hH.js";import{_ as n}from"./chunk-DJYPtS2Y.js";import{o as ze}from"./chunk-BY9AVXEY.js";import{c as De,l as Ne,o as _e}from"./chunk-C935kdjU.js";import{Ft as Q,Mn as Fe,R as ce,U as ve,Un as Ae,W as Le,d as U,i as V,j as Te,m as te,ut as ae}from"./index-DNPiyDLN.js";import"./chunk-C_yWIlg6.js";var d=Se(ke(),1),e=ze(),t={primary:"#0A2463",primaryLight:"#1A3A7A",white:"#FFFFFF",bg:"#F5F7FA",border:"#E8ECF0",text:"#1A1D24",textSecondary:"#6B7280",success:"#10B981",warning:"#F59E0B",danger:"#E74C3C",info:"#3B82F6"},Ee=[{value:"annual",label:"Annual"},{value:"sick",label:"Sick"},{value:"maternity",label:"Maternity"},{value:"paternity",label:"Paternity"},{value:"compassionate",label:"Compassionate"},{value:"study",label:"Study"},{value:"unpaid",label:"Unpaid"}],Me=[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"},{value:"emergency",label:"Emergency"}],Re=["January","February","March","April","May","June","July","August","September","October","November","December"],Be=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],qe=a=>`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,Pe=qe(new Date);function le(a){if(!a)return null;const i=String(a).slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(i)return new Date(Number(i[1]),Number(i[2])-1,Number(i[3]));const u=new Date(a);return Number.isNaN(u.getTime())?null:u}function $(a){if(!a)return"—";const i=le(a);return i?i.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):String(a)}function pe(a,i){if(!a||!i)return 0;let u=0;const x=le(a),g=le(i);if(!x||!g)return 0;for(;x<=g;){const c=x.getDay();c!==0&&c!==6&&(u+=1),x.setDate(x.getDate()+1)}return u}function He(a,i,u){return a>=i&&a<=u}var P={pending:{bg:"rgba(245, 158, 11, 0.12)",fg:"#B45309"},approved:{bg:"rgba(16, 185, 129, 0.12)",fg:"#047857"},rejected:{bg:"rgba(231, 76, 60, 0.12)",fg:"#B91C1C"},cancelled:{bg:"rgba(107, 114, 128, 0.12)",fg:t.textSecondary}},me=n.div`
  max-width: 1280px;
  margin: 0 auto;
  background: ${t.white};
`,Ye=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
`,Ie=n.div`
  flex: 1;
  min-width: 220px;
`,Oe=n.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${t.text};
  margin: 0 0 0.25rem 0;
`,Ue=n.p`
  font-size: 0.875rem;
  color: ${t.textSecondary};
  margin: 0;
`,Ve=n.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`,ee=n.div`
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
`,G=n.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${t.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,ue=n.button`
  margin-left: auto;
  background: none;
  border: none;
  color: ${t.primary};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;

  &:hover { background: ${t.bg}; }
`,Ge=n.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`,Je=n.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${t.text};
`,ne=n.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${t.border};
  background: ${t.white};
  border-radius: 8px;
  color: ${t.textSecondary};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${t.primary}; color: ${t.primary}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`,We=n.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
`,Xe=n.div`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${t.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.35rem 0;
`,Ze=n.div`
  position: relative;
  min-height: 52px;
  border-radius: 8px;
  padding: 4px;
  background: ${t.white};
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;

  ${a=>a.$muted&&`color: ${t.textSecondary}; background: ${t.bg};`}
  ${a=>a.$weekend&&!a.$muted&&!a.$anchor&&`background: ${t.bg};`}
  ${a=>a.$isToday&&!a.$inRange&&!a.$anchor&&`border-color: ${t.info};`}

  /* Days in the middle of a selection — clearly visible, not a faint wash */
  ${a=>a.$inRange&&!a.$anchor&&`
    background: rgba(10, 36, 99, 0.18);
    border-color: ${t.primary};
    box-shadow: inset 0 0 0 1px rgba(10, 36, 99, 0.10);
  `}

  /* Start / end anchors — solid fill so they are unmistakable */
  ${a=>a.$anchor&&`
    background: ${t.primary};
    border-color: ${t.primary};
    color: ${t.white};
    z-index: 1;
    box-shadow: 0 2px 10px rgba(10, 36, 99, 0.35);
  `}

  &:hover { border-color: ${t.primary}; z-index: 2; }
`,Ke=n.span`
  font-size: 0.75rem;
  font-weight: ${a=>a.$isToday||a.$onAnchor?700:500};
  color: ${a=>a.$onAnchor?"#FFFFFF":a.$isToday?t.primary:t.text};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${a=>a.$isToday&&!a.$onAnchor?"rgba(59, 130, 246, 0.15)":"transparent"};
`,Qe=n.span`
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.28);
  padding: 2px 4px;
  border-radius: 4px;
`,er=n.div`
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 3px;
`,rr=n.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${a=>a.$color};
`,tr=n.p`
  font-size: 0.75rem;
  color: ${t.textSecondary};
  margin: 0.75rem 0 0 0;
  text-align: center;
`,ar=n.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`,J=n.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &.full { grid-column: 1 / -1; }
`,W=n.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,ge=n.span`
  color: ${t.danger};
`;n.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;n.button`
  padding: 0.5rem 0.35rem;
  border-radius: 10px;
  border: 1px solid ${t.border};
  background: ${t.white};
  color: ${t.textSecondary};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  ${a=>a.$active&&`
    background: ${t.primary};
    border-color: ${t.primary};
    color: ${t.white};
  `}
`;var xe=n.select`
  padding: 0.6rem 0.75rem;
  border: 1px solid ${t.border};
  border-radius: 10px;
  font-size: 0.875rem;
  color: ${t.text};
  background: ${t.white};
  font-family: inherit;

  &:focus { outline: none; border-color: ${t.primary}; }
`,nr=n.textarea`
  padding: 0.6rem 0.75rem;
  border: 1px solid ${t.border};
  border-radius: 10px;
  font-size: 0.875rem;
  color: ${t.text};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus { outline: none; border-color: ${t.primary}; }
`,sr=n.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0.7rem 0.9rem;
  background: rgba(10, 36, 99, 0.05);
  border: 1px solid rgba(10, 36, 99, 0.15);
  border-radius: 10px;
`,ir=n.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${t.primary};
`,se=n.span`
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${t.primary};
  background: rgba(10, 36, 99, 0.1);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
`;n.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${t.text};
  cursor: pointer;
  user-select: none;

  input { accent-color: ${t.primary}; width: 16px; height: 16px; cursor: pointer; }
`;var or=n.div`
  border: 2px dashed ${t.border};
  border-radius: 10px;
  padding: 1.1rem;
  text-align: center;
  transition: all 0.15s;
  cursor: pointer;

  ${a=>a.$drag&&`border-color: ${t.primary}; background: rgba(10, 36, 99, 0.04);`}

  p { margin: 0; font-size: 0.82rem; color: ${t.textSecondary}; }
  .browse { color: ${t.primary}; font-weight: 600; cursor: pointer; text-decoration: underline; }
  .hint { font-size: 0.7rem; color: ${t.textSecondary}; opacity: 0.7; margin-top: 0.25rem; }
`,lr=n.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  font-size: 0.85rem;
  color: ${t.text};

  button {
    background: none;
    border: none;
    color: ${t.danger};
    cursor: pointer;
    display: flex;
    padding: 0.15rem;
  }
`,dr=n.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`,he=n.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.secondary {
    background: ${t.white};
    border: 1px solid ${t.border};
    color: ${t.textSecondary};

    &:hover { background: ${t.bg}; }
  }

  &.primary {
    background: ${t.primary};
    border: 1px solid ${t.primary};
    color: ${t.white};

    &:hover { background: ${t.primaryLight}; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }
`,cr=n.div`
  text-align: center;
  padding: 0.75rem 0 1rem 0;

  .num { font-size: 2.6rem; font-weight: 700; color: ${t.primary}; line-height: 1; }
  .lbl { font-size: 0.78rem; color: ${t.textSecondary}; margin-top: 0.35rem; }
`,pr=n.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: ${t.bg};
  overflow: hidden;
  display: flex;

  .used { height: 100%; background: ${t.primary}; }
  .pending { height: 100%; background: ${t.warning}; }
`,mr=n.div`
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .row { display: flex; justify-content: space-between; align-items: center; }
  .k { font-size: 0.78rem; color: ${t.textSecondary}; }
  .v { font-size: 0.85rem; font-weight: 600; font-variant-numeric: tabular-nums; color: ${t.text}; }
  .v.primary { color: ${t.primary}; }
  .v.warning { color: #B45309; }
`,ur=n.div`
  padding: 0.65rem 0.7rem;
  border-radius: 10px;
  background: ${t.bg};
  margin-bottom: 0.5rem;

  &:last-child { margin-bottom: 0; }
`,gr=n.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`,xr=n.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.primary};
  text-transform: capitalize;
`,ye=n.span`
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${a=>(P[a.$status]||P.pending).bg};
  color: ${a=>(P[a.$status]||P.pending).fg};
`,hr=n.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${t.textSecondary};
`,yr=n.p`
  margin: 0.15rem 0 0 0;
  font-size: 0.72rem;
  color: ${t.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,fe=n.button`
  margin-top: 0.4rem;
  background: none;
  border: none;
  color: ${t.danger};
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
`,be=n.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1rem;

  &.success { background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); }
  &.error { background: rgba(231, 76, 60, 0.1); color: #B91C1C; border: 1px solid rgba(231, 76, 60, 0.3); }
`,ie=n.div`
  text-align: center;
  padding: 1rem 0;
  font-size: 0.8rem;
  color: ${t.textSecondary};
`,oe=n.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${t.textSecondary};
  padding: 0.5rem 0;

  svg { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;function fr({myLeaves:a,rangeStart:i,rangeEnd:u,onRangeChange:x}){const g=new Date,[c,F]=(0,d.useState)(g.getFullYear()),[y,C]=(0,d.useState)(g.getMonth()),f=(0,d.useRef)(null),S=(0,d.useRef)(null),[H,z]=(0,d.useState)(null),A=new Date(c,y,1).getDay(),j=new Date(c,y+1,0).getDate(),p=Array.from({length:A}),Y=Array.from({length:j},(o,s)=>s+1),m=o=>`${c}-${String(y+1).padStart(2,"0")}-${String(o).padStart(2,"0")}`,v=H||u,L=o=>!i||!v?!1:o>=(i<v?i:v)&&o<=(i<v?v:i),T=o=>(a||[]).filter(s=>{const k=String(s.start_date||"").slice(0,10),N=String(s.end_date||"").slice(0,10);return k&&N&&He(o,k,N)&&s.status!=="cancelled"}),X=o=>{const s=m(o);S.current=s,f.current=s,z(s),i&&u&&i===u||x(s,s)},I=o=>{if(!f.current)return;const s=m(o);z(s),x(f.current<s?f.current:s,f.current<s?s:f.current)},w=o=>{const s=o?m(o):null;s&&S.current===s&&(i&&u&&i===u&&s!==i?x(i<s?i:s,i<s?s:i):x(s,s)),f.current=null,S.current=null,z(null)},re=()=>{f.current=null,S.current=null,z(null)},E=()=>{y===0?(C(11),F(o=>o-1)):C(o=>o-1)},O=()=>{y===11?(C(0),F(o=>o+1)):C(o=>o+1)},D=()=>{F(g.getFullYear()),C(g.getMonth())};return(0,e.jsxs)("div",{onMouseLeave:re,children:[(0,e.jsxs)(Ge,{children:[(0,e.jsx)(ne,{onClick:E,type:"button","aria-label":"Previous month",children:(0,e.jsx)(ve,{size:16})}),(0,e.jsxs)(Je,{children:[Re[y]," ",c]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.4rem"},children:[(0,e.jsx)(ne,{onClick:D,type:"button",title:"Today",style:{width:"auto",padding:"0 0.6rem",fontSize:"0.72rem"},children:"Today"}),(0,e.jsx)(ne,{onClick:O,type:"button","aria-label":"Next month",children:(0,e.jsx)(Le,{size:16})})]})]}),(0,e.jsxs)(We,{children:[Be.map(o=>(0,e.jsx)(Xe,{children:o},o)),p.map((o,s)=>(0,e.jsx)("div",{},`p${s}`)),Y.map(o=>{const s=m(o),k=new Date(c,y,o).getDay(),N=k===0||k===6,Z=s===Pe,M=T(s),K=[...new Set(M.map(b=>b.status))],R=i===s,B=u===s,q=R||B;return(0,e.jsxs)(Ze,{$weekend:N,$isToday:Z,$inRange:L(s),$anchor:q,$isStart:R,$isEnd:B,onMouseDown:()=>X(o),onMouseEnter:()=>I(o),onMouseUp:()=>w(o),onTouchStart:b=>{b.preventDefault(),X(o)},onTouchEnd:()=>w(o),title:M.map(b=>`${b.leave_type} (${b.status})`).join(", "),children:[(0,e.jsx)(Ke,{$isToday:Z,$onAnchor:q,children:o}),q?(0,e.jsx)(Qe,{children:R&&B?"Selected":R?"Start":"End"}):M.length>0&&(0,e.jsx)(er,{children:K.slice(0,4).map(b=>(0,e.jsx)(rr,{$color:(P[b]||P.pending).fg},b))})]},s)})]}),(0,e.jsx)(tr,{children:"Click your start date, then your end date - or press & drag across the days."})]})}var br=n.div`
  margin-top: 1.5rem;
  background: ${t.white};
  border: 1px solid ${t.border};
  border-radius: 16px;
  padding: 1.2rem 1.4rem 1.4rem 1.4rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
`,vr=n.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid ${t.border};
`,$r=n.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`,jr=n.button`
  border: 1px solid ${a=>a.$active?t.primary:t.border};
  background: ${a=>a.$active?t.primary:t.white};
  color: ${a=>a.$active?t.white:t.textSecondary};
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${t.primary}; }
`,wr=n.div`
  border: 1px solid ${t.border};
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-top: 0.6rem;
  background: ${t.white};
`,Sr=n.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`,kr=n.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${t.text};
  text-transform: capitalize;
`,Cr=n.span`
  font-size: 0.68rem;
  font-weight: 600;
  font-family: monospace;
  color: ${t.textSecondary};
  background: ${t.bg};
  padding: 0.12rem 0.45rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
`,zr=n.div`
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: ${t.textSecondary};
`,Dr=n.div`
  margin-top: 0.45rem;
  font-size: 0.8rem;
  color: ${t.text};
  background: ${t.bg};
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
`,Nr=n.div`
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #B91C1C;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.25);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
`,Br=()=>{const a=Ce(),i=Ne(),u=(()=>{try{const r=JSON.parse(localStorage.getItem("user")||"{}");return r.full_name||r.name||[r.first_name,r.last_name].filter(Boolean).join(" ")||r.username||r.email||"You"}catch{return"You"}})(),x=_e()||De(),g=(0,d.useMemo)(()=>{const r={"x-tenant-slug":x};return i&&(r["x-user-id"]=String(i)),{headers:r}},[x,i]),[c,F]=(0,d.useState)([]),[y,C]=(0,d.useState)(null),[f,S]=(0,d.useState)(!0),[H,z]=(0,d.useState)(!1),[A,j]=(0,d.useState)(null),[p,Y]=(0,d.useState)({start:null,end:null}),[m,v]=(0,d.useState)({type:"",priority:"medium",reason:""}),[L,T]=(0,d.useState)(null),[X,I]=(0,d.useState)(!1),[w,re]=(0,d.useState)("all"),E=(0,d.useCallback)(async()=>{if(!i){S(!1);return}S(!0);try{const[r,l]=await Promise.all([V.get(U.LEAVE.MY_LEAVES,g).catch(()=>null),V.get(U.LEAVE.BALANCE(i),g).catch(()=>null)]),h=r?.data?.data||r?.data||[];F(Array.isArray(h)?h:[]),C(l?.data?.data||l?.data||null)}finally{S(!1)}},[i,g]);(0,d.useEffect)(()=>{E()},[E]);const O=(0,d.useMemo)(()=>{if(!p.start||!p.end)return 0;let r=0;const l=new Date(`${p.start}T00:00:00`),h=new Date(`${p.end}T00:00:00`);for(;l<=h;)r+=1,l.setDate(l.getDate()+1);return r},[p]),D=Number(y?.initial)||26,o=Number(y?.leaveTaken)||0,s=Number(y?.pendingDays)||0,k=y?Math.max(0,Number(y.currentBalance)||0):null,N=D>0?Math.min(100,o/D*100):0,Z=D>0?Math.min(100-N,s/D*100):0,M=(0,d.useMemo)(()=>c.filter(r=>r.status==="pending"),[c]),K=(0,d.useMemo)(()=>c.slice(0,6),[c]),R=(0,d.useMemo)(()=>{const r={all:c.length,pending:0,approved:0,rejected:0,cancelled:0};return c.forEach(l=>{const h=String(l.status||"").toLowerCase();r[h]!==void 0&&(r[h]+=1)}),r},[c]),B=(0,d.useMemo)(()=>w==="all"?c:c.filter(r=>String(r.status||"").toLowerCase()===w),[c,w]),q=!!(i&&m.type&&p.start&&p.end&&m.reason.trim()&&!H),b=(0,d.useCallback)((r,l)=>{Y({start:r,end:l}),j(null)},[]),$e=()=>Y({start:null,end:null}),je=async()=>{if(q){if(!m.type.trim()){j({type:"error",msg:"Please select a leave type"});return}z(!0),j(null);try{const r={user_id:i,leave_type:m.type.trim(),priority:m.priority,start_date:p.start,end_date:p.end,days:O,reason:m.reason.trim(),tenant_slug:x,parent_slug:x};console.log("[ApplyLeave] Submitting payload:",r),console.log("[ApplyLeave] Headers:",g);const l=await V.post(U.LEAVE.APPLY,r,g),h=l?.data?.data||l?.data;if(console.log("[ApplyLeave] Response:",h),L&&h?.id)try{const _=new FormData;_.append("document",L),await V.post(U.LEAVE.UPLOAD_DOCUMENT(h.id),_,{...g,headers:{...g.headers,"Content-Type":null}})}catch(_){console.warn("Document upload failed (leave was submitted):",_)}j({type:"success",msg:`Leave request submitted for ${$(p.start)} → ${$(p.end)}`}),v({type:"",priority:"medium",reason:""}),T(null),Y({start:null,end:null}),h&&h.id&&F(_=>[h,...(Array.isArray(_)?_:[]).filter(we=>we.id!==h.id)]),await E()}catch(r){console.error("[ApplyLeave] Submit failed:",{message:r?.message,status:r?.response?.status,data:r?.response?.data,stack:r?.stack});const l=r?.response?.data?.message||r?.message||"Failed to submit leave request";j({type:"error",msg:l})}finally{z(!1)}}},de=async r=>{try{await V.patch(U.LEAVE.CANCEL(r),{},g),j({type:"success",msg:"Leave request cancelled"}),await E()}catch(l){j({type:"error",msg:l?.response?.data?.message||"Failed to cancel request"})}};return i?(0,e.jsxs)(me,{children:[(0,e.jsxs)(Ye,{children:[(0,e.jsxs)(Ie,{children:[(0,e.jsx)(Oe,{children:"Apply for Leave"}),(0,e.jsxs)(Ue,{children:["Hi ",u," — select your dates on the calendar, fill in the details and submit."]})]}),(0,e.jsxs)(ue,{onClick:()=>a(-1),children:[(0,e.jsx)(ve,{size:14})," Back"]})]}),A&&(0,e.jsxs)(be,{className:A.type,children:[A.type==="success"?(0,e.jsx)(ce,{size:16}):(0,e.jsx)(te,{size:16}),A.msg]}),(0,e.jsxs)(Ve,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(ee,{children:[(0,e.jsxs)(G,{children:[(0,e.jsx)(Te,{size:16})," 1. Select your dates"]}),(0,e.jsx)(fr,{myLeaves:c,rangeStart:p.start,rangeEnd:p.end,onRangeChange:b})]}),(0,e.jsxs)(ee,{children:[(0,e.jsxs)(G,{children:[(0,e.jsx)(ae,{size:16})," 2. Leave details"]}),(0,e.jsxs)(ar,{children:[(0,e.jsxs)(J,{className:"full",children:[(0,e.jsxs)(W,{htmlFor:"leaveType",children:["Leave type ",(0,e.jsx)(ge,{children:"*"})]}),(0,e.jsxs)(xe,{id:"leaveType",value:m.type,onChange:r=>v({...m,type:r.target.value}),children:[(0,e.jsx)("option",{value:"",children:"Select leave type…"}),Ee.map(r=>(0,e.jsx)("option",{value:r.value,children:r.label},r.value))]})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(W,{htmlFor:"priority",children:"Priority"}),(0,e.jsx)(xe,{id:"priority",value:m.priority,onChange:r=>v({...m,priority:r.target.value}),children:Me.map(r=>(0,e.jsx)("option",{value:r.value,children:r.label},r.value))})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(W,{children:"Selected range"}),p.start&&p.end?(0,e.jsxs)(sr,{children:[(0,e.jsxs)(ir,{children:[$(p.start)," → ",$(p.end)]}),(0,e.jsxs)(se,{children:[O," day",O===1?"":"s"]}),(0,e.jsx)(ue,{type:"button",onClick:$e,children:"Clear"})]}):(0,e.jsx)(ie,{children:"No dates selected yet — drag on the calendar above."})]}),(0,e.jsxs)(J,{className:"full",children:[(0,e.jsxs)(W,{htmlFor:"reason",children:["Reason ",(0,e.jsx)(ge,{children:"*"})]}),(0,e.jsx)(nr,{id:"reason",value:m.reason,onChange:r=>v({...m,reason:r.target.value}),placeholder:"Please provide a reason for your leave request..."})]}),(0,e.jsxs)(J,{className:"full",children:[(0,e.jsx)(W,{children:"Supporting document (optional)"}),(0,e.jsx)("input",{id:"leave-file-input",type:"file",accept:".pdf,.jpg,.jpeg,.png",style:{display:"none"},onChange:r=>T(r.target.files?.[0]||null)}),(0,e.jsx)(or,{$drag:X,onClick:()=>document.getElementById("leave-file-input")?.click(),onDragOver:r=>{r.preventDefault(),I(!0)},onDragLeave:()=>I(!1),onDrop:r=>{r.preventDefault(),I(!1);const l=r.dataTransfer?.files?.[0];l&&T(l)},children:L?(0,e.jsxs)(lr,{children:[(0,e.jsx)(ae,{size:16}),L.name,(0,e.jsx)("button",{type:"button","aria-label":"Remove file",onClick:r=>{r.stopPropagation(),T(null)},children:(0,e.jsx)(Ae,{size:14})})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Fe,{size:22}),(0,e.jsxs)("p",{children:["Drag & drop a file here, or ",(0,e.jsx)("span",{className:"browse",children:"browse"})]}),(0,e.jsx)("p",{className:"hint",children:"PDF, JPG or PNG — one supporting document"})]})})]})]}),(0,e.jsxs)(dr,{children:[(0,e.jsx)(he,{className:"secondary",type:"button",onClick:()=>a(-1),children:"Cancel"}),(0,e.jsxs)(he,{className:"primary",type:"button",disabled:!q,onClick:je,children:[H?(0,e.jsx)(Q,{size:16}):(0,e.jsx)(ce,{size:16}),H?"Submitting...":"Submit request"]})]})]})]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(ee,{children:[(0,e.jsx)(G,{children:"Leave balance"}),f?(0,e.jsxs)(oe,{children:[(0,e.jsx)(Q,{size:14})," Loading your balance..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(cr,{children:[(0,e.jsx)("div",{className:"num",children:k??"—"}),(0,e.jsx)("div",{className:"lbl",children:"days available"})]}),(0,e.jsxs)(pr,{children:[(0,e.jsx)("div",{className:"used",style:{width:`${N}%`}}),(0,e.jsx)("div",{className:"pending",style:{width:`${Z}%`}})]}),(0,e.jsxs)(mr,{children:[(0,e.jsxs)("div",{className:"row",children:[(0,e.jsx)("span",{className:"k",children:"Entitlement"}),(0,e.jsx)("span",{className:"v",children:D})]}),(0,e.jsxs)("div",{className:"row",children:[(0,e.jsx)("span",{className:"k",children:"Taken"}),(0,e.jsx)("span",{className:"v",children:o})]}),(0,e.jsxs)("div",{className:"row",children:[(0,e.jsx)("span",{className:"k",children:"Pending"}),(0,e.jsx)("span",{className:"v warning",children:s})]}),(0,e.jsxs)("div",{className:"row",children:[(0,e.jsx)("span",{className:"k",children:"Available"}),(0,e.jsx)("span",{className:"v primary",children:k??"—"})]})]})]})]}),(0,e.jsxs)(ee,{children:[(0,e.jsxs)(G,{children:["Recent requests",(0,e.jsxs)(se,{children:[c.length," total"]}),M.length>0&&(0,e.jsxs)(se,{children:[M.length," pending"]})]}),f?(0,e.jsxs)(oe,{children:[(0,e.jsx)(Q,{size:14})," Loading your requests..."]}):K.length===0?(0,e.jsx)(ie,{children:"No leave requests yet — apply for your first one here."}):K.map(r=>(0,e.jsxs)(ur,{children:[(0,e.jsxs)(gr,{children:[(0,e.jsx)(xr,{children:String(r.leave_type||"leave").replace("_"," ")}),(0,e.jsx)(ye,{$status:r.status,children:r.status})]}),(0,e.jsxs)(hr,{children:[$(r.start_date)," → ",$(r.end_date)," ","·"," ",r.days??pe(r.start_date,r.end_date)," day(s)"]}),r.reason&&(0,e.jsx)(yr,{children:r.reason}),r.status==="pending"&&(0,e.jsx)(fe,{onClick:()=>de(r.id),children:"Cancel request"})]},r.id||`${r.start_date}-${r.end_date}`))]})]})]}),(0,e.jsxs)(br,{children:[(0,e.jsxs)(vr,{children:[(0,e.jsxs)(G,{style:{margin:0},children:[(0,e.jsx)(ae,{size:16})," My leave applications"]}),(0,e.jsx)($r,{children:["all","pending","approved","rejected","cancelled"].map(r=>(0,e.jsxs)(jr,{$active:w===r,onClick:()=>re(r),children:[r," (",R[r]??0,")"]},r))})]}),f?(0,e.jsxs)(oe,{children:[(0,e.jsx)(Q,{size:14})," Loading your applications..."]}):B.length===0?(0,e.jsx)(ie,{children:w==="all"?"No leave applications yet — select your dates above and submit your first request.":`No ${w} applications.`}):B.map(r=>{const l=String(r.status||"pending").toLowerCase();return(0,e.jsxs)(wr,{children:[(0,e.jsxs)(Sr,{children:[(0,e.jsxs)(kr,{children:[String(r.leave_type||"leave").replace("_"," "),r.is_half_day?" · half day":""]}),r.reference_code&&(0,e.jsx)(Cr,{children:r.reference_code}),(0,e.jsx)(ye,{$status:l,children:l}),l==="pending"&&(0,e.jsx)(fe,{onClick:()=>de(r.id),children:"Cancel request"})]}),(0,e.jsxs)(zr,{children:[$(r.start_date)," → ",$(r.end_date)," ","·"," ",r.days??pe(r.start_date,r.end_date)," day(s)"," ","·"," ","applied ",$(r.created_at),r.approved_at?` · decided ${$(r.approved_at)}`:""]}),r.reason&&(0,e.jsx)(Dr,{children:r.reason}),l==="rejected"&&r.rejection_reason&&(0,e.jsxs)(Nr,{children:[(0,e.jsx)(te,{size:13})," ",r.rejection_reason]})]},r.id||`${r.start_date}-${r.end_date}-${r.created_at}`)})]})]}):(0,e.jsx)(me,{children:(0,e.jsxs)(be,{className:"error",children:[(0,e.jsx)(te,{size:16})," You must be logged in to apply for leave."]})})};export{Br as default};
