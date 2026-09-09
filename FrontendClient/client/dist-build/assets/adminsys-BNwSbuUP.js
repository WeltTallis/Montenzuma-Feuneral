import{r as Ie}from"./chunk-CXHxssQy.js";import{y as Me}from"./chunk-CXAmgOhv.js";import{_ as s,h as Pe,m as E}from"./chunk-DJYPtS2Y.js";import{o as Ue}from"./chunk-BY9AVXEY.js";import{In as se,K as ie,Mn as ne,Vt as A,bt as Fe,g as oe,i as f,ln as le,nn as me,t as Be,un as Ge,z as He}from"./index-D6gguvjv.js";var n=Ie(Me(),1),e=Ue(),r={white:"#ffffff",pageBg:"#f5f6f8",gray50:"#f5f5f5",gray100:"#f0f0f0",gray200:"#e4e4e4",gray300:"#d1d1d1",gray400:"#a3a3a3",gray500:"#737373",gray600:"#525252",gray700:"#404040",gray800:"#262626",gray900:"#171717",accent:"#0d9488",accentLight:"#ccfbf1",accentDark:"#0f766e",red:"#ef4444",redLight:"#fef2f2",amber:"#f59e0b",amberLight:"#fffbeb",green:"#22c55e",greenLight:"#f0fdf4",blue:"#3b82f6",blueLight:"#eff6ff"},k={open:{label:"Open",color:r.green,bg:r.greenLight},in_progress:{label:"In Progress",color:r.amber,bg:r.amberLight},resolved:{label:"Resolved",color:r.accent,bg:r.accentLight},closed:{label:"Closed",color:r.gray400,bg:r.gray100}},x={help:{label:"Question",color:r.blue,bg:r.blueLight},bug:{label:"Bug Report",color:r.red,bg:r.redLight},feature:{label:"Suggestion",color:"#16a34a",bg:r.greenLight},other:{label:"General",color:r.gray600,bg:r.gray100}},Oe=[{id:"all",label:"All"},{id:"open",label:"Open"},{id:"in_progress",label:"In Progress"},{id:"resolved",label:"Resolved"},{id:"closed",label:"Closed"}];function H(a){if(!a)return"";const c=new Date(a);if(isNaN(c.getTime()))return"";const d=Date.now()-c.getTime(),h=Math.floor(d/6e4);if(h<1)return"Just now";if(h<60)return`${h}m ago`;const S=Math.floor(d/36e5);return S<24?`${S}h ago`:c.toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}function qe(a){if(!a)return"";const c=new Date(a);return isNaN(c.getTime())?"":c.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}function O(a,c){const d=(a&&a.trim()||c||"?").replace(/[^\w\s@]/g,"").split(/[\s@._]+/).filter(Boolean);return d.length===0?"?":d.length===1?d[0].substring(0,2).toUpperCase():(d[0][0]+d[1][0]).toUpperCase()}var Ke=Pe`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`,Ve=E`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Ye=E`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`,We=E`
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.7); opacity: 0; }
`,Xe=E`
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
`,Je=s.div`
  min-height: 100vh;
  background: ${r.pageBg};
  font-family: 'DM Sans', sans-serif;
  color: ${r.gray800};
  padding: 20px;

  @media (max-width: 640px) { padding: 12px; }
`,Qe=s.div`
  background: ${r.white};
  border: 1px solid ${r.gray200};
  border-radius: 16px;
  overflow: hidden;
`,Ze=s.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 22px;
  border-bottom: 1px solid ${r.gray200};
  flex-wrap: wrap;
`,et=s.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${r.gray900};
  display: flex;
  align-items: center;
  gap: 10px;
`,tt=s.div`
  width: 32px; height: 32px;
  background: ${r.gray900};
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: ${r.white}; flex-shrink: 0;
`,rt=s.div`font-size: 11.5px; color: ${r.gray400}; margin-top: 2px;`,at=s.span`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px;
  color: ${a=>a.$on?"#16a34a":r.gray400};
  background: ${a=>a.$on?r.greenLight:r.gray100};
  border-radius: 99px; padding: 3px 9px;
`,st=s.span`
  width: 7px; height: 7px; border-radius: 50%;
  background: ${a=>a.$on?r.green:r.gray400};
  position: relative; display: inline-block;

  &::before {
    content: ''; position: absolute; inset: -3px; border-radius: 50%;
    background: ${a=>a.$on?r.green:"transparent"};
    opacity: 0.3; animation: ${We} 2s ease infinite;
  }
`,it=s.div`
  display: flex; gap: 4px; padding: 10px 16px;
  border-bottom: 1px solid ${r.gray200}; flex-wrap: wrap;
  background: ${r.gray50};
`,q=s.button`
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px; border-radius: 8px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.2s ease;
  background: transparent; color: ${r.gray600};

  &:hover { background: ${r.gray100}; color: ${r.gray800}; }

  ${a=>a.$active&&`background:${r.white}; color:${r.accentDark}; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid ${r.gray200};`}
`,nt=s.span`
  background: ${r.red}; color: ${r.white};
  font-size: 10px; font-weight: 700;
  min-width: 17px; text-align: center;
  padding: 1px 6px; border-radius: 99px;
`,D=s.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 15px; border-radius: 8px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.2s ease; white-space: nowrap;

  ${a=>a.$variant==="accent"&&`background:${r.accent}; color:${r.white}; &:hover:not(:disabled){background:${r.accentDark};}`}
  ${a=>a.$variant==="ghost"&&`background:${r.white}; color:${r.gray600}; border:1px solid ${r.gray200}; &:hover:not(:disabled){background:${r.gray50};}`}
  ${a=>a.$variant==="danger"&&`background:${r.white}; color:${r.red}; border:1px solid #fecaca; &:hover:not(:disabled){background:${r.redLight};}`}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,ot=s.div`
  display: flex;
  min-height: calc(100vh - 210px);

  @media (max-width: 760px) { flex-direction: column; }
`,lt=s.div`
  width: 400px;
  border-right: 1px solid ${r.gray200};
  display: flex; flex-direction: column; flex-shrink: 0;

  @media (max-width: 1100px) { width: 330px; }
  @media (max-width: 760px) {
    width: 100%; max-height: 45vh;
    border-right: none; border-bottom: 1px solid ${r.gray200};
  }
`,de=s.div`
  padding: 12px 14px; display: flex; gap: 6px; align-items: center;
  border-bottom: 1px solid ${r.gray100}; flex-wrap: wrap;
`,dt=s.button`
  padding: 4px 12px; border-radius: 99px;
  font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid ${r.gray200}; background: ${r.white}; color: ${r.gray600};
  transition: all 0.2s ease;

  &:hover { border-color: ${r.gray300}; }

  ${a=>a.$active&&`background:${r.gray900}; color:${r.white}; border-color:${r.gray900};`}
`,ct=s.div`
  flex: 1; overflow-y: auto; padding: 8px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${r.gray300}; border-radius: 10px; }
`,pt=s.div`
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  transition: all 0.2s ease; border: 1px solid transparent; margin-bottom: 2px;

  &:hover { background: ${r.gray50}; }

  ${a=>a.$active&&`background:${r.gray50}; border-color:${r.gray200};`}
`,gt=s.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
`,ce=s.span`
  font-size: 11px; font-weight: 600; color: ${r.gray400};
  font-family: 'Space Grotesk', sans-serif;
`,pe=s.span`
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: ${a=>a.$color||r.gray300};
`,ge=s.span`
  margin-left: auto;
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px;
  background: ${a=>a.$bg}; color: ${a=>a.$color};
`,xt=s.div`
  font-size: 13.5px; font-weight: 600; color: ${r.gray800};
  margin-bottom: 4px; line-height: 1.4;
`,ht=s.div`
  font-size: 12px; color: ${r.gray400}; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
`,ut=s.div`
  display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;
`,ft=s.div`
  width: 20px; height: 20px; border-radius: 50%;
  background: ${r.gray200};
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: ${r.gray500}; flex-shrink: 0;
`,xe=s.span`
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.4px;
  padding: 2px 7px; border-radius: 99px;
  background: ${r.gray100}; color: ${r.gray600};
  max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`,he=s.span`
  font-size: 11px; color: ${r.gray400};
  display: inline-flex; align-items: center; gap: 4px;

  ${a=>a.$right&&"margin-left: auto;"}
`,mt=s.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;

  @media (max-width: 760px) { min-height: 55vh; }
`,yt=s.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${r.gray200}; flex-shrink: 0;
`,bt=s.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;
`,vt=s.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px; font-weight: 700; color: ${r.gray900}; margin-top: 2px;
`,$t=s.div`
  display: flex; gap: 16px; margin-top: 8px;
  font-size: 12px; color: ${r.gray400}; flex-wrap: wrap;

  span { display: inline-flex; align-items: center; gap: 5px; }
`,wt=s.select`
  padding: 4px 8px; border: 1px solid ${r.gray200}; border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: ${r.gray700}; background: ${r.white};
  outline: none; cursor: pointer;

  &:focus { border-color: ${r.accent}; }
`,jt=s.div`
  flex: 1; overflow-y: auto; padding: 20px 22px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${r.gray300}; border-radius: 10px; }
`,kt=s.div`
  display: flex; gap: 12px; margin-bottom: 18px;
  animation: ${Ve} 0.3s ease;
`,St=s.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${a=>a.$staff?r.accentLight:r.gray200};
  color: ${a=>a.$staff?r.accentDark:r.gray600};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
`,Tt=s.div`flex: 1; min-width: 0;`,_t=s.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`,zt=s.span`font-size: 13px; font-weight: 600; color: ${r.gray800};`,Lt=s.span`
  font-size: 10px; font-weight: 600; padding: 1px 6px;
  border-radius: 4px; background: ${r.accentLight}; color: ${r.accentDark};
`,Ct=s.span`font-size: 11px; color: ${r.gray400}; margin-left: auto; white-space: nowrap;`,Rt=s.div`
  font-size: 13.5px; color: ${r.gray700}; line-height: 1.7;
  word-break: break-word; white-space: pre-wrap;
`,At=s.div`
  padding: 14px 22px 16px;
  border-top: 1px solid ${r.gray200}; flex-shrink: 0; background: ${r.gray50};
`,Dt=s.div`
  border: 1px solid ${r.gray200}; border-radius: 12px; overflow: hidden;
  transition: all 0.2s ease; background: ${r.white};

  &:focus-within {
    border-color: ${r.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  textarea {
    width: 100%; padding: 12px 14px;
    border: none; outline: none;
    font-family: inherit; font-size: 13.5px; resize: none;
    color: ${r.gray800}; line-height: 1.6;
    min-height: 56px; max-height: 120px;
    &::placeholder { color: ${r.gray400}; }
  }
`,Nt=s.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; border-top: 1px solid ${r.gray100};
`,Et=s.span`font-size: 11px; color: ${r.gray400};`,v=s.div`
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: ${r.gray400}; padding: 40px; text-align: center;

  p { font-size: 14px; margin-top: 4px; }
`,N=s(me)`
  animation: ${Xe} 1s linear infinite;
`,ue=s.div`padding: 20px 22px; overflow-y: auto;`,It=s.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px; margin-bottom: 22px;
`,$=s.div`
  background: ${r.white}; border: 1px solid ${r.gray200};
  border-radius: 12px; padding: 16px 18px;

  .label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: ${r.gray400}; }
  .value { font-family: 'Space Grotesk', sans-serif;
    font-size: 26px; font-weight: 700; color: ${r.gray900}; margin-top: 6px; }
`,Mt=s.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;
`,fe=s.div`
  display: flex; align-items: center; gap: 8px;
  background: ${r.white}; border: 1px solid ${r.gray200};
  border-radius: 8px; padding: 8px 12px; width: 280px;

  &:focus-within {
    border-color: ${r.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: ${r.gray800}; width: 100%; font-family: inherit;
    &::placeholder { color: ${r.gray400}; }
  }
`,Pt=s.div`
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; border: 1px solid ${r.gray200};
  border-radius: 12px; margin-bottom: 8px; background: ${r.white};
  flex-wrap: wrap;
`,Ut=s.div`
  font-size: 13.5px; font-weight: 600; color: ${r.gray800};
`,Ft=s.div`
  font-size: 11.5px; color: ${r.gray400};
`,Bt=s.span`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 3px 9px; border-radius: 99px;

  ${a=>a.$status==="active"&&`background:${r.greenLight}; color:#16a34a;`}
  ${a=>a.$status==="suspended"&&`background:${r.amberLight}; color:${r.amber};`}
  ${a=>a.$status==="stopped"&&`background:${r.redLight}; color:${r.red};`}
  ${a=>!["active","suspended","stopped"].includes(a.$status)&&`background:${r.gray100}; color:${r.gray600};`}
`,Gt=s.div`
  position: fixed; top: 20px; right: 20px; z-index: 3000;
  display: flex; flex-direction: column; gap: 8px;
`,Ht=s.div`
  padding: 12px 18px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  animation: ${Ye} 0.3s ease;
  display: flex; align-items: center; gap: 8px; max-width: 380px;

  ${a=>a.$type==="error"&&`background:${r.redLight}; color:#991b1b; border:1px solid #fecaca;`}
  ${a=>a.$type==="warning"&&`background:${r.amberLight}; color:#92400e; border:1px solid #fde68a;`}
  ${a=>(!a.$type||a.$type==="success")&&`background:${r.gray900}; color:${r.white};`}
`,Wt=()=>{const{socket:a,connected:c}=Be(),[d,h]=(0,n.useState)("support"),[S,ye]=(0,n.useState)(new Date),[u,be]=(0,n.useState)([]),[ve,$e]=(0,n.useState)(!0),[I,we]=(0,n.useState)("all"),[M,je]=(0,n.useState)(""),[p,ke]=(0,n.useState)(null),[T,K]=(0,n.useState)([]),[Se,V]=(0,n.useState)(!1),[P,U]=(0,n.useState)(""),[F,Y]=(0,n.useState)(!1),[m,Te]=(0,n.useState)([]),[W,_e]=(0,n.useState)(null),[ze,X]=(0,n.useState)(!0),[J,Le]=(0,n.useState)(""),[Ce,Q]=(0,n.useState)(null),[Re,Z]=(0,n.useState)([]),Ae=(0,n.useRef)(0),w=(0,n.useRef)(null),ee=(0,n.useRef)(null);w.current=p;const y=(0,n.useCallback)((t,i="success")=>{const l=++Ae.current;Z(b=>[...b.slice(-3),{id:l,message:t,type:i}]),setTimeout(()=>Z(b=>b.filter(Ee=>Ee.id!==l)),3500)},[]),g=(0,n.useCallback)(async()=>{try{const t=await f.get("/support/tickets/all");t.data?.success&&Array.isArray(t.data.tickets)&&be(t.data.tickets)}catch(t){console.warn("[AdminSys] tickets:",t?.message)}finally{$e(!1),ye(new Date)}},[]),_=(0,n.useCallback)(async t=>{if(t)try{const i=await f.get(`/support/tickets/${t}/replies`);i.data?.success&&Array.isArray(i.data.replies)&&String(w.current)===String(t)&&K(i.data.replies)}catch(i){console.warn("[AdminSys] replies:",i?.message)}},[]),z=(0,n.useCallback)(async()=>{X(!0);try{const t=await f.get("/system-admin/tenants");t.data?.success&&Te(Array.isArray(t.data.data)?t.data.data:[])}catch(t){console.warn("[AdminSys] tenants:",t?.message)}finally{X(!1)}},[]),L=(0,n.useCallback)(async()=>{try{const t=await f.get("/system-admin/dashboard");t.data?.success&&_e(t.data.data||null)}catch(t){console.warn("[AdminSys] dashboard:",t?.message)}},[]);(0,n.useEffect)(()=>{g(),z(),L()},[g,z,L]),(0,n.useEffect)(()=>{const t=setInterval(g,15e3);return()=>clearInterval(t)},[g]),(0,n.useEffect)(()=>{if(!a)return;const t=(i={})=>{g();const l=i.ticketId;(!l||String(l)===String(w.current))&&w.current&&_(w.current)};return a.on("ticket_updated",t),a.on("ticket_response",t),()=>{a.off("ticket_updated",t),a.off("ticket_response",t)}},[a,g,_]);const te=t=>{ke(t.ticket_id),K([]),U(""),V(!0),_(t.ticket_id).finally(()=>V(!1))},re=async()=>{const t=P.trim();if(!(!t||!p||F)){Y(!0);try{const i=u.find(l=>String(l.ticket_id)===String(p));await f.post(`/support/tickets/${p}/reply`,{message:t,userType:"admin"},{headers:{"x-tenant-slug":i?.tenant_slug||"system_shared"}}),U(""),y("Reply sent — the user sees it instantly"),await _(p),g()}catch{y("Failed to send reply","error")}finally{Y(!1)}}},De=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),re())},Ne=async(t,i)=>{try{const l=u.find(b=>String(b.ticket_id)===String(t));await f.patch(`/support/tickets/${t}`,{status:i},{headers:{"x-tenant-slug":l?.tenant_slug||"system_shared"}}),y(`Ticket #${t} marked as ${k[i]?.label||i}`),g()}catch{y("Failed to update status","error")}},ae=async(t,i)=>{const l=i==="suspend"?"SUSPEND":"ACTIVATE";if(window.confirm(`Are you sure you want to ${l} "${t.tenant_name}"?`)){Q(t.id||t.tenant_id);try{await f.post(`/system-admin/tenants/${t.id||t.tenant_id}/${i}`),y(`"${t.tenant_name}" ${i==="suspend"?"suspended":"activated"}`,i==="suspend"?"warning":"success"),z(),L()}catch{y(`Failed to ${i} tenant`,"error")}finally{Q(null)}}},C=u.filter(t=>t.status==="open").length,j=u.filter(t=>{if(I!=="all"&&t.status!==I)return!1;if(!M.trim())return!0;const i=M.toLowerCase();return String(t.ticket_id).includes(i)||(t.subject||"").toLowerCase().includes(i)||(t.message||"").toLowerCase().includes(i)||(t.user_name||"").toLowerCase().includes(i)||(t.tenant_name||"").toLowerCase().includes(i)});(0,n.useEffect)(()=>{!p&&j.length>0&&te(j[0])},[j.length]);const o=u.find(t=>String(t.ticket_id)===String(p))||null,R=[];o&&(R.push({key:"ticket-body",name:o.user_name||o.user_email||"Customer",staff:!1,text:o.message,time:o.created_at}),T.forEach(t=>R.push({key:`reply-${t.reply_id}`,name:t.user_type==="admin"?"Support Team":o.user_name||"Customer",staff:t.user_type==="admin",text:t.message,time:t.created_at}))),(0,n.useEffect)(()=>{const t=ee.current;t&&t.scrollIntoView({behavior:"smooth",block:"end"})},[T.length,p]);const B=m.filter(t=>{const i=J.toLowerCase();return i?(t.tenant_name||"").toLowerCase().includes(i)||(t.email||"").toLowerCase().includes(i)||(t.tenant_slug||"").toLowerCase().includes(i):!0}),G=W?.overview||{};return(0,e.jsxs)(Je,{children:[(0,e.jsx)(Ke,{}),(0,e.jsxs)(Qe,{children:[(0,e.jsxs)(Ze,{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12},children:[(0,e.jsxs)(et,{children:[(0,e.jsx)(tt,{children:(0,e.jsx)(Fe,{size:15})}),"System Administrator"]}),(0,e.jsxs)(at,{$on:c,children:[(0,e.jsx)(st,{$on:c}),c?"LIVE":"OFFLINE"]})]}),(0,e.jsxs)(rt,{style:{marginLeft:"auto"},children:["Updated ",S.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit"})," ","· auto-refresh every 15s"]}),(0,e.jsxs)(D,{$variant:"ghost",onClick:()=>{g(),z(),L()},children:[(0,e.jsx)(me,{size:13})," Refresh"]})]}),(0,e.jsxs)(it,{children:[(0,e.jsxs)(q,{$active:d==="support",onClick:()=>h("support"),children:[(0,e.jsx)(A,{size:14})," Support Tickets",C>0&&(0,e.jsx)(nt,{children:C})]}),(0,e.jsxs)(q,{$active:d==="tenants",onClick:()=>h("tenants"),children:[(0,e.jsx)(se,{size:14})," Tenants (",m.length,")"]}),(0,e.jsx)(q,{$active:d==="overview",onClick:()=>h("overview"),children:"📊 Overview"})]}),d==="support"&&(0,e.jsxs)(ot,{children:[(0,e.jsxs)(lt,{children:[(0,e.jsx)(de,{children:Oe.map(t=>(0,e.jsx)(dt,{$active:I===t.id,onClick:()=>we(t.id),children:t.label},t.id))}),(0,e.jsx)(de,{children:(0,e.jsxs)(fe,{style:{width:"100%"},children:[(0,e.jsx)(le,{size:13}),(0,e.jsx)("input",{placeholder:"Search tickets, tenants, users...",value:M,onChange:t=>je(t.target.value)})]})}),(0,e.jsx)(ct,{children:ve?(0,e.jsxs)(v,{children:[(0,e.jsx)(N,{size:26}),(0,e.jsx)("p",{children:"Loading tickets..."})]}):j.length===0?(0,e.jsxs)(v,{children:[(0,e.jsx)(A,{size:38}),(0,e.jsx)("p",{children:"No support tickets found"}),(0,e.jsx)("p",{style:{fontSize:12},children:"New tickets from tenants appear here instantly."})]}):j.map(t=>{const i=k[t.status]||k.open,l=x[t.type]||x.help;return(0,e.jsxs)(pt,{$active:String(p)===String(t.ticket_id),onClick:()=>te(t),children:[(0,e.jsxs)(gt,{children:[(0,e.jsx)(pe,{$color:i.color}),(0,e.jsxs)(ce,{children:["#",t.ticket_id]}),(0,e.jsx)(ge,{$bg:l.bg,$color:l.color,children:l.label})]}),(0,e.jsx)(xt,{children:t.subject}),(0,e.jsx)(ht,{children:t.message}),(0,e.jsxs)(ut,{children:[(0,e.jsx)(ft,{children:O(t.user_name,t.user_email)}),(0,e.jsxs)(he,{children:[(0,e.jsx)(ne,{size:10})," ",t.user_name||t.user_email||"User"]}),t.tenant_name&&(0,e.jsx)(xe,{children:t.tenant_name}),(0,e.jsxs)(he,{$right:!0,children:[(0,e.jsx)(ie,{size:10})," ",H(t.created_at)]})]})]},t.ticket_id)})})]}),(0,e.jsx)(mt,{children:o?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(yt,{children:[(0,e.jsxs)(bt,{children:[(0,e.jsx)(pe,{$color:(k[o.status]||k.open).color}),(0,e.jsxs)(ce,{style:{fontSize:13},children:["#",o.ticket_id]}),(0,e.jsx)(ge,{$bg:(x[o.type]||x.help).bg,$color:(x[o.type]||x.help).color,children:(x[o.type]||x.help).label}),o.tenant_name&&(0,e.jsx)(xe,{children:o.tenant_name}),(0,e.jsxs)(wt,{style:{marginLeft:"auto"},value:o.status||"open",onChange:t=>Ne(o.ticket_id,t.target.value),children:[(0,e.jsx)("option",{value:"open",children:"Open"}),(0,e.jsx)("option",{value:"in_progress",children:"In Progress"}),(0,e.jsx)("option",{value:"resolved",children:"Resolved"}),(0,e.jsx)("option",{value:"closed",children:"Closed"})]})]}),(0,e.jsx)(vt,{children:o.subject}),(0,e.jsxs)($t,{children:[(0,e.jsxs)("span",{children:[(0,e.jsx)(ne,{size:11})," ",o.user_name||"User"]}),o.user_email&&(0,e.jsxs)("span",{children:["✉ ",o.user_email]}),(0,e.jsxs)("span",{children:[(0,e.jsx)(ie,{size:11})," ",H(o.created_at)]}),(0,e.jsxs)("span",{children:[(0,e.jsx)(A,{size:11})," ",T.length," repl",T.length===1?"y":"ies"]})]})]}),(0,e.jsx)(jt,{children:Se&&R.length<=1?(0,e.jsxs)(v,{style:{padding:20},children:[(0,e.jsx)(N,{size:20}),(0,e.jsx)("p",{children:"Loading conversation..."})]}):(0,e.jsxs)(e.Fragment,{children:[R.map(t=>(0,e.jsxs)(kt,{children:[(0,e.jsx)(St,{$staff:t.staff,children:O(t.name)}),(0,e.jsxs)(Tt,{children:[(0,e.jsxs)(_t,{children:[(0,e.jsx)(zt,{children:t.name}),t.staff&&(0,e.jsx)(Lt,{children:"SUPPORT"}),(0,e.jsxs)(Ct,{children:[qe(t.time)," · ",H(t.time)]})]}),(0,e.jsx)(Rt,{children:t.text})]})]},t.key)),(0,e.jsx)("div",{ref:ee})]})}),(0,e.jsx)(At,{children:(0,e.jsxs)(Dt,{children:[(0,e.jsx)("textarea",{placeholder:"Reply as Support Team... (Enter to send, Shift+Enter for new line)",rows:2,value:P,onChange:t=>U(t.target.value),onKeyDown:De}),(0,e.jsxs)(Nt,{children:[(0,e.jsx)(Et,{children:"The tenant is notified instantly via live updates"}),(0,e.jsx)(D,{$variant:"accent",onClick:re,disabled:!P.trim()||F,children:F?"Sending...":(0,e.jsxs)(e.Fragment,{children:[" Reply ",(0,e.jsx)(Ge,{size:12})]})})]})]})})]}):(0,e.jsxs)(v,{children:[(0,e.jsx)(A,{size:40}),(0,e.jsx)("p",{children:"Select a ticket to view the conversation"})]})})]}),d==="tenants"&&(0,e.jsxs)(ue,{children:[(0,e.jsxs)(Mt,{children:[(0,e.jsxs)(fe,{children:[(0,e.jsx)(le,{size:13}),(0,e.jsx)("input",{placeholder:"Search tenants...",value:J,onChange:t=>Le(t.target.value)})]}),(0,e.jsxs)("span",{style:{fontSize:12,color:r.gray400},children:[B.length," of ",m.length]})]}),ze?(0,e.jsxs)(v,{children:[(0,e.jsx)(N,{size:24}),(0,e.jsx)("p",{children:"Loading tenants..."})]}):B.length===0?(0,e.jsxs)(v,{children:[(0,e.jsx)(se,{size:38}),(0,e.jsx)("p",{children:"No tenants found"})]}):B.map(t=>{const i=t.id??t.tenant_id,l=(t.status||"").toLowerCase();return(0,e.jsxs)(Pt,{children:[(0,e.jsx)("div",{style:{width:36,height:36,borderRadius:10,background:r.accentLight,color:r.accentDark,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0},children:O(t.tenant_name)}),(0,e.jsxs)("div",{style:{flex:1,minWidth:150},children:[(0,e.jsx)(Ut,{children:t.tenant_name}),(0,e.jsxs)(Ft,{children:[t.email," · ",t.tenant_slug," · ",t.country||"—"]})]}),(0,e.jsx)(Bt,{$status:l,children:l||"unknown"}),Ce===i?(0,e.jsx)(N,{size:14}):l==="active"?(0,e.jsx)(D,{$variant:"danger",onClick:()=>ae(t,"suspend"),children:"Suspend"}):(0,e.jsx)(D,{$variant:"accent",onClick:()=>ae(t,"activate"),children:"Activate"})]},i)})]}),d==="overview"&&(0,e.jsxs)(ue,{children:[(0,e.jsxs)(It,{children:[(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Total Tenants"}),(0,e.jsx)("div",{className:"value",children:G.totalTenants??m.length})]}),(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Active"}),(0,e.jsx)("div",{className:"value",children:G.activeTenants??m.filter(t=>(t.status||"").toLowerCase()==="active").length})]}),(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Suspended"}),(0,e.jsx)("div",{className:"value",children:G.suspendedTenants??m.filter(t=>(t.status||"").toLowerCase()==="suspended").length})]}),(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Open Tickets"}),(0,e.jsx)("div",{className:"value",style:{color:C>0?r.amber:r.gray900},children:C})]}),(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Total Tickets"}),(0,e.jsx)("div",{className:"value",children:u.length})]}),(0,e.jsxs)($,{children:[(0,e.jsx)("div",{className:"label",children:"Resolved"}),(0,e.jsx)("div",{className:"value",children:u.filter(t=>t.status==="resolved").length})]})]}),!W&&(0,e.jsxs)("div",{style:{display:"flex",gap:10,alignItems:"flex-start",padding:"14px 16px",borderRadius:12,background:r.amberLight,border:"1px solid #fde68a",fontSize:13,color:"#92400e",marginBottom:14},children:[(0,e.jsx)(oe,{size:16}),(0,e.jsxs)("span",{children:["Live platform stats are unavailable right now (","/system-admin/dashboard"," did not respond). Ticket counts above come directly from the support database and are always live."]})]})]})]}),(0,e.jsx)(Gt,{children:Re.map(t=>(0,e.jsxs)(Ht,{$type:t.type,children:[t.type==="error"?(0,e.jsx)(oe,{size:14}):(0,e.jsx)(He,{size:14}),t.message]},t.id))})]})};export{Wt as default};
