import{r as xe}from"./chunk-CXHxssQy.js";import{y as ge}from"./chunk-CXAmgOhv.js";import{_ as a,h as fe,m as _}from"./chunk-DJYPtS2Y.js";import{o as he}from"./chunk-BY9AVXEY.js";import{At as ue,K as H,Pn as G,Ut as q,Vn as me,dn as ye,fn as be,i as j,in as Z,t as ve,xt as we,z as $e}from"./index-yov0GYHY.js";import"./chunk-BoetvTsJ.js";var o=xe(ge(),1),r=he(),e={white:"#ffffff",gray50:"#f5f5f5",gray100:"#f0f0f0",gray200:"#e4e4e4",gray300:"#d1d1d1",gray400:"#a3a3a3",gray500:"#737373",gray600:"#525252",gray700:"#404040",gray800:"#262626",gray900:"#171717",accent:"#0d9488",accentLight:"#ccfbf1",accentDark:"#0f766e",red:"#ef4444",redLight:"#fef2f2",amber:"#f59e0b",amberLight:"#fffbeb",green:"#22c55e",greenLight:"#f0fdf4",blue:"#3b82f6",blueLight:"#eff6ff"},b={open:{label:"Open",color:e.green,bg:e.greenLight},in_progress:{label:"In Progress",color:e.amber,bg:e.amberLight},resolved:{label:"Resolved",color:e.accent,bg:e.accentLight},closed:{label:"Closed",color:e.gray400,bg:e.gray100}},f={help:{label:"Question",color:e.blue,bg:e.blueLight},bug:{label:"Bug Report",color:e.red,bg:e.redLight},feature:{label:"Suggestion",color:"#16a34a",bg:e.greenLight},other:{label:"General",color:e.gray600,bg:e.gray100}},ke=[{id:"all",label:"All"},{id:"open",label:"Open"},{id:"in_progress",label:"In Progress"},{id:"resolved",label:"Resolved"},{id:"closed",label:"Closed"}];function A(i){if(!i)return"";const d=new Date(i);if(isNaN(d.getTime()))return"";const c=Date.now()-d.getTime(),h=Math.floor(c/6e4);if(h<1)return"Just now";if(h<60)return`${h}m ago`;const v=Math.floor(c/36e5);return v<24?`${v}h ago`:d.toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}function je(i){if(!i)return"";const d=new Date(i);return isNaN(d.getTime())?"":d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}function D(i,d){const c=(i&&i.trim()||d||"?").replace(/[^\w\s@]/g,"").split(/[\s@._]+/).filter(Boolean);return c.length===0?"?":c.length===1?c[0].substring(0,2).toUpperCase():(c[0][0]+c[1][0]).toUpperCase()}function Se(){try{return JSON.parse(localStorage.getItem("user")||"{}")}catch{return{}}}var _e=fe`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`,ze=_`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;_`
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;var Te=_`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`,Ce=_`
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.7); opacity: 0; }
`,Le=a.div`
  display: flex;
  height: calc(100vh - 150px);
  min-height: 600px;
  background: ${e.white};
  border: 1px solid ${e.gray200};
  border-radius: 16px;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  color: ${e.gray800};

  @media (max-width: 860px) {
    height: calc(100vh - 110px);
    min-height: 480px;
    border-radius: 12px;
  }
`,Re=a.aside`
  width: 250px;
  background: ${e.white};
  border-right: 1px solid ${e.gray200};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 860px) { display: none; }
`,Ae=a.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${e.gray100};
`,De=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: ${e.gray900};
  display: flex;
  align-items: center;
  gap: 10px;
`,Ee=a.div`
  width: 32px; height: 32px;
  background: ${e.gray900};
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: ${e.white}; flex-shrink: 0;
`,Ie=a.nav`
  padding: 12px 10px; flex: 1;
  display: flex; flex-direction: column;
`,K=a.div`
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.2px; color: ${e.gray400}; padding: 12px 12px 6px;
`,O=a.div`
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px; cursor: pointer;
  font-size: 13.5px; font-weight: 500; color: ${e.gray600};
  transition: all 0.2s ease; user-select: none;

  &:hover { background: ${e.gray50}; color: ${e.gray800}; }

  ${i=>i.$active&&`background: ${e.accentLight}; color: ${e.accentDark};`}
`,Me=a.span`
  margin-left: auto;
  background: ${e.red};
  color: ${e.white};
  font-size: 10px; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
  min-width: 18px; text-align: center;
`,Fe=a.span`
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px;
  color: ${i=>i.$on?"#16a34a":e.gray400};
  background: ${i=>i.$on?e.greenLight:e.gray100};
  border-radius: 99px; padding: 2px 8px;
`,Ne=a.span`
  width: 7px; height: 7px;
  background: ${i=>i.$on?e.green:e.gray400};
  border-radius: 50%; display: inline-block; position: relative;

  &::before {
    content: ''; position: absolute; inset: -3px; border-radius: 50%;
    background: ${i=>i.$on?e.green:"transparent"};
    opacity: 0.3; animation: ${Ce} 2s ease infinite;
  }
`,Ue=a.div`
  padding: 14px 16px;
  border-top: 1px solid ${e.gray100};
  display: flex; align-items: center; gap: 10px;
`,Pe=a.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${e.accentLight}; color: ${e.accentDark};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0; position: relative;

  &::after {
    content: ''; position: absolute; bottom: 0; right: 0;
    width: 10px; height: 10px;
    background: ${i=>i.$online?e.green:e.gray400};
    border: 2px solid ${e.white}; border-radius: 50%;
  }
`,Be=a.div`flex: 1; min-width: 0;`,He=a.div`
  font-size: 13px; font-weight: 600; color: ${e.gray800};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`,Ge=a.div`font-size: 11px; color: ${e.gray400};`,qe=a.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`,Ke=a.div`
  padding: 14px 24px;
  border-bottom: 1px solid ${e.gray200};
  display: flex; align-items: center; gap: 14px;
  background: ${e.white}; flex-shrink: 0; flex-wrap: wrap;

  @media (max-width: 640px) { padding: 12px 16px; }
`,Oe=a.div`display: flex; flex-direction: column;`,Ye=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px; font-weight: 700; color: ${e.gray900}; line-height: 1.2;
`,Ve=a.div`
  font-size: 11.5px; color: ${e.gray400}; margin-top: 2px;
  display: flex; align-items: center; gap: 6px;
`,Je=a.div`
  display: flex; align-items: center; gap: 8px;
  background: ${e.gray50}; border: 1px solid ${e.gray200};
  border-radius: 8px; padding: 7px 12px; width: 240px;
  transition: all 0.2s ease; margin-left: auto;

  &:focus-within {
    border-color: ${e.accent}; background: ${e.white};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: ${e.gray800}; width: 100%; font-family: inherit;
    &::placeholder { color: ${e.gray400}; }
  }

  @media (max-width: 640px) { width: 150px; }
`,We=a.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: all 0.2s ease;
  font-family: inherit; white-space: nowrap; user-select: none;

  ${i=>i.$variant==="accent"&&`background:${e.accent}; color:${e.white}; &:hover:not(:disabled){background:${e.accentDark};}`}
  ${i=>i.$variant==="ghost"&&`background:transparent; color:${e.gray600}; border:1px solid ${e.gray200}; &:hover:not(:disabled){background:${e.gray50}; border-color:${e.gray300};}`}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,Xe=a.div`flex: 1; overflow: hidden; display: flex;`,Qe=a.div`
  width: 410px;
  border-right: 1px solid ${e.gray200};
  display: flex; flex-direction: column; flex-shrink: 0;

  @media (max-width: 860px) { width: 330px; }
  @media (max-width: 640px) {
    width: 100%; max-height: 40%;
    border-right: none; border-bottom: 1px solid ${e.gray200};
  }
`,Ze=a.div`
  padding: 12px 14px; display: flex; gap: 6px;
  border-bottom: 1px solid ${e.gray100}; flex-shrink: 0; flex-wrap: wrap;
`,er=a.div`
  padding: 4px 12px; border-radius: 99px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid ${e.gray200}; background: ${e.white}; color: ${e.gray600};
  transition: all 0.2s ease; user-select: none;

  &:hover { border-color: ${e.gray300}; }

  ${i=>i.$active&&`background:${e.gray900}; color:${e.white}; border-color:${e.gray900};`}
`,rr=a.div`
  flex: 1; overflow-y: auto; padding: 8px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${e.gray300}; border-radius: 10px; }
`,tr=a.div`
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  transition: all 0.2s ease; border: 1px solid transparent; margin-bottom: 2px;

  &:hover { background: ${e.gray50}; }

  ${i=>i.$active&&`background:${e.gray50}; border-color:${e.gray200}; box-shadow:0 1px 2px rgba(0,0,0,0.04);`}
`,ar=a.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
`,Y=a.span`
  font-size: 11px; font-weight: 600; color: ${e.gray400};
  font-family: 'Space Grotesk', sans-serif;
`,V=a.span`
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: ${i=>i.$color||e.gray300};
`,J=a.span`
  margin-left: auto;
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px;
  background: ${i=>i.$bg}; color: ${i=>i.$color};
`,ir=a.div`
  font-size: 13.5px; font-weight: 600; color: ${e.gray800};
  margin-bottom: 4px; line-height: 1.4;
`,nr=a.div`
  font-size: 12px; color: ${e.gray400}; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
`,sr=a.div`
  display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;
`,or=a.div`
  width: 20px; height: 20px; border-radius: 50%;
  background: ${e.gray200};
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: ${e.gray500}; flex-shrink: 0;
`,W=a.span`
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.4px;
  padding: 2px 7px; border-radius: 99px;
  background: ${e.gray100}; color: ${e.gray600};
  max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`,X=a.span`
  font-size: 11px; color: ${e.gray400};
  display: inline-flex; align-items: center; gap: 4px;

  ${i=>i.$right&&"margin-left: auto;"}
`,lr=a.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;
`,dr=a.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${e.gray200};
  flex-shrink: 0;
`,cr=a.div`
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 4px; flex-wrap: wrap;
`,pr=a.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px; font-weight: 700; color: ${e.gray900}; margin-top: 2px;
`,xr=a.div`
  display: flex; gap: 16px; margin-top: 8px;
  font-size: 12px; color: ${e.gray400}; flex-wrap: wrap;

  span { display: inline-flex; align-items: center; gap: 5px; }
`,gr=a.select`
  padding: 4px 8px;
  border: 1px solid ${e.gray200}; border-radius: 6px;
  font-size: 12px; font-family: inherit; font-weight: 600;
  color: ${e.gray700}; background: ${e.white};
  outline: none; cursor: pointer;

  &:focus { border-color: ${e.accent}; }
`,fr=a.div`
  flex: 1; overflow-y: auto; padding: 20px 22px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${e.gray300}; border-radius: 10px; }
`,hr=a.div`
  display: flex; gap: 12px; margin-bottom: 18px;
  animation: ${ze} 0.3s ease;
`,ur=a.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${i=>i.$staff?e.accentLight:e.gray200};
  color: ${i=>i.$staff?e.accentDark:e.gray600};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
`,mr=a.div`flex: 1; min-width: 0;`,yr=a.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`,br=a.span`font-size: 13px; font-weight: 600; color: ${e.gray800};`,vr=a.span`
  font-size: 10px; font-weight: 600; padding: 1px 6px;
  border-radius: 4px; background: ${e.accentLight}; color: ${e.accentDark};
`,wr=a.span`font-size: 11px; color: ${e.gray400}; margin-left: auto; white-space: nowrap;`,$r=a.div`
  font-size: 13.5px; color: ${e.gray700}; line-height: 1.7;
  word-break: break-word; white-space: pre-wrap;
`,kr=a.div`
  padding: 14px 22px 16px;
  border-top: 1px solid ${e.gray200};
  flex-shrink: 0; background: ${e.white};
`,jr=a.div`
  border: 1px solid ${e.gray200}; border-radius: 12px; overflow: hidden;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${e.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  textarea {
    width: 100%; padding: 12px 14px;
    border: none; outline: none;
    font-size: 13.5px; font-family: inherit; resize: none;
    color: ${e.gray800}; background: transparent; line-height: 1.6;
    min-height: 56px; max-height: 120px;
    &::placeholder { color: ${e.gray400}; }
  }
`,Sr=a.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; border-top: 1px solid ${e.gray100}; background: ${e.gray50};
`,_r=a.span`font-size: 11px; color: ${e.gray400};`,S=a.div`
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: ${e.gray400}; padding: 40px; text-align: center;

  p { font-size: 14px; margin-top: 4px; }
`,zr=a.div`
  position: fixed; top: 20px; right: 20px; z-index: 2000;
  display: flex; flex-direction: column; gap: 8px;
`,Tr=a.div`
  padding: 12px 18px;
  background: ${e.gray900}; color: ${e.white};
  border-radius: 8px; font-size: 13px; font-weight: 500;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  animation: ${Te} 0.3s ease;
  display: flex; align-items: center; gap: 8px; max-width: 360px;
`,Q=a(Z)`
  animation: spin 1s linear infinite;
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
`,Ir=()=>{const{socket:i,connected:d}=ve(),[c,h]=(0,o.useState)([]),[v,ee]=(0,o.useState)(!0),[z,re]=(0,o.useState)("all"),[T,te]=(0,o.useState)(""),[w,ae]=(0,o.useState)(null),[E,I]=(0,o.useState)([]),[ie,M]=(0,o.useState)(!1),[C,L]=(0,o.useState)(""),[R,F]=(0,o.useState)(!1),[ne,N]=(0,o.useState)([]),se=(0,o.useRef)(0),x=(0,o.useRef)(null),U=(0,o.useRef)(null);x.current=w;const u=(0,o.useCallback)(t=>{const n=++se.current;N(l=>[...l.slice(-3),{id:n,message:t}]),setTimeout(()=>N(l=>l.filter(g=>g.id!==n)),3500)},[]),p=(0,o.useCallback)(async()=>{try{const t=await j.get("/support/tickets/all");t.data?.success&&Array.isArray(t.data.tickets)?h(t.data.tickets):Array.isArray(t.data)&&h(t.data)}catch(t){console.warn("[SupportAdmin] Failed to fetch tickets:",t?.message)}finally{ee(!1)}},[]),y=(0,o.useCallback)(async t=>{if(t)try{const n=await j.get(`/support/tickets/${t}/replies`);n.data?.success&&Array.isArray(n.data.replies)&&String(x.current)===String(t)&&I(n.data.replies)}catch(n){console.warn("[SupportAdmin] Failed to fetch replies:",n?.message)}},[]);(0,o.useEffect)(()=>{p()},[p]),(0,o.useEffect)(()=>{const t=setInterval(p,3e4);return()=>clearInterval(t)},[p]),(0,o.useEffect)(()=>{if(!i)return;const t=(l={})=>{p();const g=l.ticketId;(!g||String(g)===String(x.current))&&x.current&&y(x.current)},n=(l={})=>{l.userType!=="admin"&&(u(l.message||"New customer message received"),p(),(!l.ticketId||String(l.ticketId)===String(x.current))&&x.current&&y(x.current))};return i.on("ticket_updated",t),i.on("ticket_response",n),()=>{i.off("ticket_updated",t),i.off("ticket_response",n)}},[i,p,y,u]);const oe=t=>{ae(t.ticket_id),I([]),L(""),M(!0),y(t.ticket_id).finally(()=>M(!1))},P=async()=>{const t=C.trim();if(!(!t||!s||R)){F(!0);try{await j.post(`/support/tickets/${s.ticket_id}/reply`,{message:t,userType:"admin"},{headers:{"x-tenant-slug":s.tenant_slug||"system_shared"}}),L(""),u("Reply sent to customer"),await y(s.ticket_id),p()}catch(n){console.warn("[SupportAdmin] Reply failed:",n?.message),u("Failed to send reply. Please try again.")}finally{F(!1)}}},le=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),P())},de=async(t,n)=>{const l=c.find(g=>String(g.ticket_id)===String(t));try{await j.request({method:"PATCH",url:`/support/tickets/${t}`,data:{status:n},headers:{"x-tenant-slug":l?.tenant_slug||"system_shared"}}),u(`Ticket #${t} marked as ${b[n]?.label||n}`),p()}catch(g){console.warn("[SupportAdmin] Status update failed:",g?.message),u("Failed to update status")}},m=Se(),ce=m.full_name||m.name||m.email||"Support Agent",pe=D(m.full_name||m.name,m.email),B=c.filter(t=>t.status==="open"||t.status==="in_progress").length,$=c.filter(t=>{if(z!=="all"&&t.status!==z)return!1;if(!T.trim())return!0;const n=T.toLowerCase();return String(t.ticket_id).includes(n)||(t.subject||"").toLowerCase().includes(n)||(t.message||"").toLowerCase().includes(n)||(t.user_name||"").toLowerCase().includes(n)||(t.tenant_name||"").toLowerCase().includes(n)}),s=c.find(t=>String(t.ticket_id)===String(w))||null,k=[];return s&&(k.push({key:"ticket-body",name:s.user_name||s.user_email||"Customer",staff:!1,text:s.message,time:s.created_at}),E.forEach(t=>{const n=t.user_type==="admin";k.push({key:`reply-${t.reply_id}`,name:n?"Support Team":s.user_name||"Customer",staff:n,text:t.message,time:t.created_at})})),(0,o.useEffect)(()=>{const t=U.current;t&&t.scrollIntoView({behavior:"smooth",block:"end"})},[E.length,w]),(0,r.jsxs)("div",{style:{padding:"4px 2px"},children:[(0,r.jsx)(_e,{}),(0,r.jsxs)(Le,{children:[(0,r.jsxs)(Re,{children:[(0,r.jsx)(Ae,{children:(0,r.jsxs)(De,{children:[(0,r.jsx)(Ee,{children:(0,r.jsx)(we,{size:15})}),"SupportHub"]})}),(0,r.jsxs)(Ie,{children:[(0,r.jsx)(K,{children:"Support Console"}),(0,r.jsxs)(O,{$active:!0,children:[(0,r.jsx)(q,{size:14})," All Tickets",B>0&&(0,r.jsx)(Me,{children:B})]}),(0,r.jsx)(K,{style:{marginTop:8},children:"Actions"}),(0,r.jsxs)(O,{onClick:p,children:[(0,r.jsx)(Z,{size:14})," Refresh"]})]}),(0,r.jsxs)(Ue,{children:[(0,r.jsx)(Pe,{$online:d,children:pe}),(0,r.jsxs)(Be,{children:[(0,r.jsx)(He,{children:ce}),(0,r.jsx)(Ge,{children:"Support Agent"})]})]})]}),(0,r.jsxs)(qe,{children:[(0,r.jsxs)(Ke,{children:[(0,r.jsxs)(Oe,{children:[(0,r.jsx)(Ye,{children:"All Tickets"}),(0,r.jsxs)(Ve,{children:[$.length," ticket",$.length!==1?"s":""," ","· all tenants · live"]})]}),(0,r.jsxs)(Je,{children:[(0,r.jsx)(ye,{size:13}),(0,r.jsx)("input",{placeholder:"Search tickets, tenants...",value:T,onChange:t=>te(t.target.value)})]}),(0,r.jsxs)(Fe,{$on:d,children:[(0,r.jsx)(Ne,{$on:d}),d?"LIVE":"OFFLINE"]})]}),(0,r.jsxs)(Xe,{children:[(0,r.jsxs)(Qe,{children:[(0,r.jsx)(Ze,{children:ke.map(t=>(0,r.jsx)(er,{$active:z===t.id,onClick:()=>re(t.id),children:t.label},t.id))}),(0,r.jsx)(rr,{children:v?(0,r.jsxs)(S,{children:[(0,r.jsx)(Q,{size:26}),(0,r.jsx)("p",{children:"Loading tickets..."})]}):$.length===0?(0,r.jsxs)(S,{children:[(0,r.jsx)(ue,{size:38}),(0,r.jsx)("p",{children:"No tickets found"})]}):$.map(t=>{const n=b[t.status]||b.open,l=f[t.type]||f.help;return(0,r.jsxs)(tr,{$active:String(w)===String(t.ticket_id),onClick:()=>oe(t),children:[(0,r.jsxs)(ar,{children:[(0,r.jsx)(V,{$color:n.color}),(0,r.jsxs)(Y,{children:["#",t.ticket_id]}),(0,r.jsx)(J,{$bg:l.bg,$color:l.color,children:l.label})]}),(0,r.jsx)(ir,{children:t.subject}),(0,r.jsx)(nr,{children:t.message}),(0,r.jsxs)(sr,{children:[(0,r.jsx)(or,{children:D(t.user_name,t.user_email)}),(0,r.jsxs)(X,{children:[(0,r.jsx)(G,{size:10})," ",t.user_name||t.user_email||"User"]}),t.tenant_name&&(0,r.jsx)(W,{children:t.tenant_name}),(0,r.jsxs)(X,{$right:!0,children:[(0,r.jsx)(H,{size:10})," ",A(t.created_at)]})]})]},t.ticket_id)})})]}),(0,r.jsx)(lr,{children:s?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(dr,{children:[(0,r.jsxs)(cr,{children:[(0,r.jsx)(V,{$color:(b[s.status]||b.open).color}),(0,r.jsxs)(Y,{style:{fontSize:13},children:["#",s.ticket_id]}),(0,r.jsx)(J,{$bg:(f[s.type]||f.help).bg,$color:(f[s.type]||f.help).color,children:(f[s.type]||f.help).label}),s.tenant_name&&(0,r.jsx)(W,{children:s.tenant_name}),(0,r.jsxs)(gr,{style:{marginLeft:"auto"},value:s.status||"open",onChange:t=>de(s.ticket_id,t.target.value),children:[(0,r.jsx)("option",{value:"open",children:"Open"}),(0,r.jsx)("option",{value:"in_progress",children:"In Progress"}),(0,r.jsx)("option",{value:"resolved",children:"Resolved"}),(0,r.jsx)("option",{value:"closed",children:"Closed"})]})]}),(0,r.jsx)(pr,{children:s.subject}),(0,r.jsxs)(xr,{children:[(0,r.jsxs)("span",{children:[(0,r.jsx)(G,{size:11})," ",s.user_name||"User"]}),s.user_email&&(0,r.jsxs)("span",{children:["✉ ",s.user_email]}),(0,r.jsxs)("span",{children:[(0,r.jsx)(H,{size:11})," ",A(s.created_at)]}),d&&(0,r.jsxs)("span",{style:{color:"#16a34a"},children:[(0,r.jsx)(me,{size:11})," Live"]})]})]}),(0,r.jsx)(fr,{children:ie&&k.length<=1?(0,r.jsxs)(S,{style:{padding:20},children:[(0,r.jsx)(Q,{size:20}),(0,r.jsx)("p",{children:"Loading conversation..."})]}):(0,r.jsxs)(r.Fragment,{children:[k.map(t=>(0,r.jsxs)(hr,{children:[(0,r.jsx)(ur,{$staff:t.staff,children:D(t.name)}),(0,r.jsxs)(mr,{children:[(0,r.jsxs)(yr,{children:[(0,r.jsx)(br,{children:t.name}),t.staff&&(0,r.jsx)(vr,{children:"STAFF"}),(0,r.jsxs)(wr,{children:[je(t.time)," · ",A(t.time)]})]}),(0,r.jsx)($r,{children:t.text})]})]},t.key)),(0,r.jsx)("div",{ref:U})]})}),(0,r.jsx)(kr,{children:(0,r.jsxs)(jr,{children:[(0,r.jsx)("textarea",{placeholder:"Reply as Support Team... (Enter to send, Shift+Enter for a new line)",rows:2,value:C,onChange:t=>L(t.target.value),onKeyDown:le}),(0,r.jsxs)(Sr,{children:[(0,r.jsx)(_r,{children:"Customer is notified instantly via live updates"}),(0,r.jsx)(We,{$variant:"accent",onClick:P,disabled:!C.trim()||R,children:R?"Sending...":(0,r.jsxs)(r.Fragment,{children:[" Reply ",(0,r.jsx)(be,{size:12})]})})]})]})})]}):(0,r.jsxs)(S,{children:[(0,r.jsx)(q,{size:40}),(0,r.jsx)("p",{children:"Select a ticket to view the conversation"})]})})]})]})]}),(0,r.jsx)(zr,{children:ne.map(t=>(0,r.jsxs)(Tr,{children:[(0,r.jsx)($e,{size:14})," ",t.message]},t.id))})]})};export{Ir as default};
