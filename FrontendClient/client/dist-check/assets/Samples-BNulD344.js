import{r as R}from"./chunk-CXHxssQy.js";import{y as W}from"./chunk-CXAmgOhv.js";import{o as I}from"./chunk-BY9AVXEY.js";import{i as D}from"./index-Cjz35ncq.js";var x=R(W(),1),e=I(),T=`
.snowfall { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 5; }
.snowfall--bounded { position: absolute; }
.snowflake {
  position: absolute; top: -6vh; left: var(--x, 50%);
  width: var(--s, 12px); height: var(--s, 12px);
  opacity: 0; will-change: transform, opacity;
  animation: petalFall var(--d, 16s) linear infinite;
  animation-delay: var(--dl, 0s);
}
.snowflake svg {
  width: 100%; height: 100%; display: block;
  animation: petalSway var(--sw, 3s) ease-in-out infinite alternate;
}
@keyframes petalFall {
  0%   { transform: translate3d(0, -8vh, 0); opacity: 0; }
  10%  { opacity: var(--po, 0.5); }
  88%  { opacity: var(--po, 0.5); }
  100% { transform: translate3d(var(--px, 24px), 108vh, 0); opacity: 0; }
}
@keyframes petalSway {
  from { transform: translateX(-9px) rotate(-26deg); }
  to   { transform: translateX(9px) rotate(30deg); }
}
@media (prefers-reduced-motion: reduce) { .snowfall { display: none; } }
`,X=["#FDF6EE","#F3D9C8","#E9C9C9","#FFFFFF","#DCE8D8"];function q({count:s=14,opacity:f=.5,colors:o=X,bounded:m=!1}){const y=(0,x.useMemo)(()=>Array.from({length:s},(l,h)=>({id:h,x:(Math.random()*100).toFixed(2)+"%",s:Math.round(8+Math.random()*12),d:(11+Math.random()*16).toFixed(2)+"s",dl:(-Math.random()*26).toFixed(2)+"s",px:Math.round(Math.random()*60-30)+"px",sw:(2.4+Math.random()*2.6).toFixed(2)+"s",po:(f*(.45+Math.random()*.55)).toFixed(2),c:o[h%o.length]})),[s,f,o]);return(0,e.jsxs)("div",{className:"snowfall"+(m?" snowfall--bounded":""),"aria-hidden":"true",children:[(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:T}}),y.map(l=>(0,e.jsx)("span",{className:"snowflake",style:{"--x":l.x,"--s":l.s+"px","--d":l.d,"--dl":l.dl,"--px":l.px,"--po":l.po,"--sw":l.sw},children:(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M10 1C15 5 16 12 10 19 4 12 5 5 10 1Z",fill:l.c})})},l.id))]})}var Z=`
:root{
  --paper:#FBF6F1; --card:#FFFEFB;
  --hair:#F0E3DC; --hair2:#E0C9C0;
  --rosewood:#6B4045; --rosewood-d:#573438;
  --rose:#B98480; --blush:#DCAEA6; --blush-xl:#F6E7E2;
  --gold:#C8A262; --stem:#96A88B;
  --ink:#4A3B3C; --ink2:#7A6664; --ink3:#B09A94;
  --brick:#A4544C; --cream:#F3E6DC;
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Karla','Segoe UI',sans-serif;
}
/* ── side panel chrome ── */
.fbp-scrim{position:fixed;inset:0;background:rgba(30,18,19,.45);backdrop-filter:blur(2px);z-index:300;animation:fbFade .25s ease}
.fbp-panel{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:310;background:var(--paper);
  box-shadow:-30px 0 80px rgba(50,30,32,.35);animation:fbpIn .38s cubic-bezier(.16,1,.3,1);
  display:flex;flex-direction:column;overflow:hidden;font:400 16px/1.55 var(--sans);color:var(--ink)}
@keyframes fbpIn{from{transform:translateX(64px);opacity:0}to{transform:none;opacity:1}}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
.fbp-close{position:absolute;top:14px;right:14px;z-index:30;width:34px;height:34px;border-radius:50%;
  border:1px solid var(--hair2);background:var(--card);color:var(--rosewood);font-size:20px;line-height:1;
  cursor:pointer;display:grid;place-items:center;padding:0;transition:.2s}
.fbp-close:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.fbp-scroll{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;position:relative}
.fbp-panel .snowfall{z-index:0}
*{-webkit-tap-highlight-color:transparent}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible{outline:2px solid var(--rose);outline-offset:2px}
svg{display:block}
button{font-family:var(--sans);color:inherit}
::selection{background:var(--blush)}
/* ── page / frame ── */
.fb-page{position:relative;z-index:1;width:100%;padding:54px 0 0}
.frame{position:relative;border:1px solid var(--hair);background:var(--card);box-shadow:0 30px 70px -46px rgba(107,64,69,.45)}
.sheet{position:relative;outline:1px solid var(--hair);outline-offset:7px;margin:7px}
.corner{position:absolute;width:84px;height:84px;color:var(--hair2);pointer-events:none;z-index:2}
.corner.tl{top:9px;left:9px}
.corner.tr{top:9px;right:9px;transform:scaleX(-1)}
.corner.bl{bottom:9px;left:9px;transform:scaleY(-1)}
.corner.br{bottom:9px;right:9px;transform:scale(-1)}
/* ── head ── */
.head{position:relative;text-align:center;padding:44px 30px 8px}
.head .sprig{width:230px;height:58px;margin:0 auto 6px;color:var(--stem)}
.head h1{font:600 2.05rem/1.1 var(--serif);letter-spacing:.02em;color:var(--rosewood)}
.head .sub{font:italic 500 .98rem var(--serif);color:var(--rose);margin-top:4px}
/* ── form ── */
form{padding:6px 44px 34px}
@media(max-width:600px){form{padding:6px 22px 26px}.head{padding:36px 20px 4px}}
fieldset{border:0;padding:26px 0 8px;border-bottom:1px solid var(--hair)}
fieldset:last-of-type{border-bottom:0}
.fs-title{display:flex;align-items:center;gap:9px;font:700 .67rem var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--rose);margin-bottom:18px}
.fs-title .b{width:15px;height:15px;color:var(--blush);flex:none}
.fs-title::after{content:"";flex:1;height:1px;background:linear-gradient(to right,var(--hair),transparent)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.frow{grid-template-columns:1fr}}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field>label{display:block;font:700 .65rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);margin-bottom:.5rem}
.opt{display:inline;text-transform:none;letter-spacing:0;font-weight:500;color:var(--ink3)}
.inp{position:relative}
.inp svg{position:absolute;left:0;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--blush);pointer-events:none}
.inp input,.inp select{padding-left:30px}
.field input,.field select,.field textarea{width:100%;background:transparent;border:0;border-bottom:1px solid var(--hair2);padding:.6rem .15rem;font:500 .98rem var(--sans);color:var(--ink);transition:border-color .25s}
.field textarea{resize:vertical;min-height:80px;border:1px solid var(--hair2);padding:.7rem .8rem;margin-top:4px}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--rose)}
.field ::placeholder{color:var(--ink3)}
.selectwrap{position:relative}
.selectwrap select{appearance:none;padding-right:24px}
.selectwrap>svg{position:absolute;right:0;left:auto;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--blush);pointer-events:none}
/* ── pills / reveal / counters ── */
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pills input{position:absolute;opacity:0;pointer-events:none}
.pills label{display:inline-block;padding:.5rem .95rem;border:1px solid var(--hair2);font:600 .8rem var(--sans);color:var(--ink2);cursor:pointer;transition:.2s;margin:0;background:transparent}
.pills label:hover{border-color:var(--rose);color:var(--rosewood)}
.pills input:checked+label{background:var(--rosewood);border-color:var(--rosewood);color:#FBF3EE}
.pills input:focus-visible+label{outline:2px solid var(--rose);outline-offset:2px}
.reveal{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.reveal.open{grid-template-rows:1fr}
.reveal>div{overflow:hidden}
.reveal .field{padding-top:14px}
.tareawrap{position:relative}
.counter{position:absolute;bottom:8px;right:10px;font:600 .64rem var(--sans);color:var(--ink3)}
/* ── qty stepper + selections ── */
.qty{display:inline-flex;align-items:stretch;border:1px solid var(--hair2)}
.qty button{width:32px;height:36px;display:grid;place-items:center;border:0;background:transparent;cursor:pointer;transition:.2s;font-size:15px;line-height:1;padding:0}
.qty button:hover{background:var(--rosewood);color:#FBF3EE}
.qty span{min-width:36px;display:grid;place-items:center;font-weight:700;font-size:.92rem;border-left:1px solid var(--hair2);border-right:1px solid var(--hair2)}
.selrow{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--hair)}
.selrow .thumb{width:46px;height:36px;border-radius:6px;object-fit:cover;flex:none;border:1px solid var(--hair2)}
.selrow .info{flex:1;min-width:0}
.selrow .nm{font:600 .92rem var(--sans);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.selrow .tg{font:italic 500 .84rem var(--serif);color:var(--rose);margin-top:1px}
.selrow .rm{background:none;border:none;cursor:pointer;color:var(--ink3);font-size:17px;line-height:1;padding:2px 4px;transition:color .15s}
.selrow .rm:hover{color:var(--brick)}
.seltotal{display:flex;justify-content:space-between;align-items:center;padding:12px 0 2px;font:700 .64rem var(--sans);letter-spacing:.18em;text-transform:uppercase;color:var(--ink2)}
.seltotal b{font:600 1.05rem var(--serif);color:var(--rosewood);letter-spacing:.02em;text-transform:none}
/* ── errors ── */
.err{display:none;font:600 .72rem var(--sans);color:var(--brick);margin-top:5px}
.field.bad input,.field.bad select,.field.bad textarea{border-color:var(--brick)}
.field.bad .err{display:block}
.field.bad>label{color:var(--brick)}

/* ── submit ── */
.submit{width:100%;padding:1.1rem;background:var(--rosewood);color:#FBF3EE;border:0;font:700 .84rem var(--sans);letter-spacing:.24em;text-transform:uppercase;cursor:pointer;transition:.25s;display:flex;align-items:center;justify-content:center;gap:11px}
.submit:hover:not(:disabled){background:var(--rosewood-d)}
.submit:disabled{opacity:.75;cursor:wait}
.submit .b{width:15px;height:15px;color:var(--blush)}
.fbspin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(251,243,238,.35);border-top-color:#FBF3EE;animation:fbspin .7s linear infinite;flex:none}
@keyframes fbspin{to{transform:rotate(360deg)}}
.formnote{text-align:center;font:italic 500 .86rem var(--serif);color:var(--ink3);padding:12px 0 0}
/* ── confirmation ── */
.conf{text-align:center;padding:56px 30px}
.conf .sprig{width:200px;height:50px;margin:0 auto 10px;color:var(--stem)}
.ccheck{width:52px;height:52px;background:var(--rosewood);display:grid;place-items:center;margin:0 auto 18px;color:#FBF3EE}
.ccheck svg{width:23px;height:23px}
.conf h2{font:600 1.9rem var(--serif);color:var(--rosewood)}
.csub{font:italic 500 .98rem var(--serif);color:var(--ink2);margin-top:4px}
.cref{display:inline-flex;gap:16px;flex-wrap:wrap;justify-content:center;margin:22px 0;padding:12px 16px;border:1px solid var(--hair);font:600 .8rem var(--sans);background:var(--blush-xl)}
.cactions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:.72rem 1.5rem;border:1px solid var(--hair2);background:#fff;font:700 .76rem var(--sans);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:.25s;color:var(--rosewood)}
.btn-ghost:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
/* ── rosewood footer — flush inside ── */
.site-foot{position:relative;overflow:hidden;background:var(--rosewood);color:var(--cream);text-align:center;padding:48px 20px 44px}
.site-foot::before{content:"";position:absolute;left:50%;bottom:-260px;transform:translateX(-50%);width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(243,230,220,.12);pointer-events:none}
.site-foot::after{content:"";position:absolute;left:50%;bottom:-320px;transform:translateX(-50%);width:680px;height:680px;border-radius:50%;border:1px solid rgba(243,230,220,.07);pointer-events:none}
.leafmark{width:42px;height:42px;margin:0 auto 16px;border-radius:50%;background:rgba(243,230,220,.14);border:1px solid rgba(243,230,220,.3);display:grid;place-items:center}
.leafmark svg{width:20px;height:20px}
.tagline{font:italic 500 1.2rem/1.5 var(--serif);color:rgba(243,230,220,.85);max-width:40ch;margin:0 auto}
.values{display:flex;align-items:center;justify-content:center;gap:16px;margin:26px auto 0;max-width:380px}
.values::before,.values::after{content:"";flex:1;height:1px;background:rgba(243,230,220,.2)}
.values span{font:700 .62rem var(--sans);letter-spacing:.26em;text-transform:uppercase;color:rgba(243,230,220,.6)}
.values b{font:600 .95rem var(--serif);color:rgba(243,230,220,.9)}
@media(max-width:600px){.site-foot{padding:40px 20px 36px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.snowfall{display:none}}
`,$=()=>(0,e.jsx)("svg",{width:"0",height:"0",style:{position:"absolute"},"aria-hidden":"true",children:(0,e.jsxs)("defs",{children:[(0,e.jsxs)("symbol",{id:"bloom",viewBox:"0 0 24 24",children:[(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeWidth:"1.4",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(72 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(144 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(216 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(288 12 12)"})]}),(0,e.jsx)("circle",{cx:"12",cy:"12",r:"1.5",fill:"currentColor"})]}),(0,e.jsx)("symbol",{id:"cornerfl",viewBox:"0 0 90 90",children:(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round",children:[(0,e.jsx)("path",{d:"M8 84C22 60 36 42 62 26"}),(0,e.jsx)("path",{d:"M34 56q-2-11 6-18q6 8 2 18Z",fill:"currentColor",opacity:".25",stroke:"none"}),(0,e.jsx)("path",{d:"M50 42q-3-10 3-18q7 7 4 18Z",fill:"currentColor",opacity:".22",stroke:"none"}),(0,e.jsx)("path",{d:"M24 70q-9-3-11-12q10 0 14 10Z",fill:"currentColor",opacity:".2",stroke:"none"}),(0,e.jsx)("circle",{cx:"66",cy:"23",r:"2.4",fill:"currentColor",stroke:"none"}),(0,e.jsx)("circle",{cx:"73",cy:"30",r:"1.7",fill:"currentColor",stroke:"none",opacity:".7"}),(0,e.jsx)("circle",{cx:"61",cy:"32",r:"1.7",fill:"currentColor",stroke:"none",opacity:".7"})]})}),(0,e.jsxs)("symbol",{id:"sprig",viewBox:"0 0 260 64",children:[(0,e.jsxs)("g",{id:"spL",fill:"none",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round",children:[(0,e.jsx)("path",{d:"M118 54C88 52 58 42 36 20"}),(0,e.jsx)("path",{d:"M104 50q-3-10 3-18q7 7 3 18Z",fill:"currentColor",opacity:".28",stroke:"none"}),(0,e.jsx)("path",{d:"M86 44q-4-9 0-18q7 6 4 18Z",fill:"currentColor",opacity:".22",stroke:"none"}),(0,e.jsx)("path",{d:"M66 34q-5-8-3-17q8 5 7 17Z",fill:"currentColor",opacity:".22",stroke:"none"}),(0,e.jsx)("path",{d:"M50 24q-6-7-6-16q9 4 10 16Z",fill:"currentColor",opacity:".18",stroke:"none"}),(0,e.jsx)("circle",{cx:"124",cy:"54",r:"2",fill:"currentColor",stroke:"none"})]}),(0,e.jsx)("use",{href:"#spL",transform:"translate(260 0) scale(-1 1)"}),(0,e.jsx)("g",{transform:"translate(118 8) scale(2)",children:(0,e.jsx)("use",{href:"#bloom",width:"12",height:"12",style:{color:"inherit"}})}),(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeWidth:"1.2",children:[(0,e.jsx)("circle",{cx:"130",cy:"17",r:"5.5"}),(0,e.jsx)("path",{d:"M130 8.5v-3M136.5 17h3M130 25.5v3M123.5 17h-3M134.6 12.4l2.1-2.1M134.6 21.6l2.1 2.1M125.4 21.6l-2.1 2.1M125.4 12.4l-2.1-2.1"})]})]})]})}),L={date:"",dep:"",svc:"",notes:"",msg:"",name:"",phone:"",email:""},G=[["Funeral service","Funeral"],["Memorial","Memorial"],["Celebration of life","Celebration of life"],["Graveside","Graveside"]];function O({open:s,selected:f=[],quantities:o={},arrangements:m=[],onQtyChange:y,onRemove:l,onBooked:h,onClose:g}){const[c,N]=(0,x.useState)(L),[a,k]=(0,x.useState)({}),[d,b]=(0,x.useState)(!1),[j,C]=(0,x.useState)(null),t=f.reduce((i,v)=>i+(o[v]||1),0),n=f.map(i=>m.find(v=>v.id===i)).filter(Boolean),p=n.some(i=>i.price!=null),F=n.reduce((i,v)=>i+(v.price!=null?v.price*(o[v.id]||1):0),0),M=new Date,w=`${M.getFullYear()}-${String(M.getMonth()+1).padStart(2,"0")}-${String(M.getDate()).padStart(2,"0")}`,r=i=>({value:c[i],onChange:v=>{N(S=>({...S,[i]:v.target.value})),k(S=>({...S,[i]:!1}))}}),u=()=>{const i={};if((!c.date||c.date<w)&&(i.date=!0),c.svc||(i.svc=!0),c.name.trim().length<2&&(i.name=!0),/^[+\d][\d\s().-]{6,}$/.test(c.phone.trim())||(i.phone=!0),/^\S+@\S+\.\S+$/.test(c.email.trim())||(i.email=!0),k(i),Object.keys(i).length){const v=document.querySelector(".fbp-panel .field.bad input, .fbp-panel .field.bad select, .fbp-panel .field.bad textarea");return v&&v.focus(),!1}return!0},z=async i=>{if(i.preventDefault(),!!u()){b(!0);try{const v=f.map(A=>{const B=m.find(P=>P.id===A);return(B?.name||B?.title||"Arrangement")+" ×"+(o[A]||1)}).join(", "),S=[c.svc&&`Service type: ${c.svc}`,c.notes&&`Flower notes: ${c.notes}`].filter(Boolean).join(" | ");await D.post("/florist/bookings",{arrangement_name:v,deceased_name:c.dep||null,booked_by:c.name||null,date:c.date||null,phone:c.phone||null,email:c.email||null,card_message:c.msg||null,quantity:t,special_instructions:S||null});const E="MH-"+Math.random().toString(36).slice(2,6).toUpperCase(),_=c.date?new Date(c.date+"T12:00:00").toLocaleDateString(void 0,{day:"numeric",month:"long",year:"numeric"}):"";C({ref:E,dateStr:_})}catch(v){alert(v.friendlyMessage||"Failed to submit. Please try again.")}finally{b(!1)}}},Y=()=>{N(L),k({}),C(null),h&&h()};return s?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"fbp-scrim",onClick:g}),(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:Z}}),(0,e.jsxs)("aside",{className:"fbp-panel",role:"dialog","aria-modal":"true","aria-label":"Flower booking",children:[(0,e.jsx)(q,{count:8,opacity:.45,colors:["#DCAEA6","#F0D9C8","#E5C1B8"],bounded:!0}),(0,e.jsx)($,{}),(0,e.jsx)("button",{className:"fbp-close",onClick:g,"aria-label":"Close booking panel",children:"×"}),(0,e.jsx)("div",{className:"fbp-scroll",children:(0,e.jsx)("div",{className:"fb-page",children:(0,e.jsxs)("div",{className:"frame",children:[(0,e.jsx)("svg",{className:"corner tl",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner tr",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner bl",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner br",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsxs)("div",{className:"sheet",children:[(0,e.jsxs)("div",{className:"head",children:[(0,e.jsx)("svg",{className:"sprig",children:(0,e.jsx)("use",{href:"#sprig"})}),(0,e.jsx)("h1",{children:"Flower booking"}),(0,e.jsx)("p",{className:"sub",children:"Hand-arranged · Delivered with grace"})]}),j?(0,e.jsxs)("div",{className:"conf",children:[(0,e.jsx)("svg",{className:"sprig",children:(0,e.jsx)("use",{href:"#sprig"})}),(0,e.jsx)("div",{className:"ccheck",children:(0,e.jsx)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M5 12.5l4.5 4.5L19 7"})})}),(0,e.jsx)("h2",{children:"Booking received"}),(0,e.jsx)("p",{className:"csub",children:"We'll confirm by phone within two hours."}),(0,e.jsxs)("div",{className:"cref",children:[j.ref&&(0,e.jsxs)("span",{children:["Ref ",j.ref]}),j.dateStr&&(0,e.jsx)("span",{children:j.dateStr})]}),(0,e.jsx)("div",{className:"cactions",children:(0,e.jsx)("button",{type:"button",className:"btn-ghost",style:{marginTop:0},onClick:Y,children:"Make another booking"})})]}):(0,e.jsxs)("form",{noValidate:!0,onSubmit:z,children:[(0,e.jsxs)("fieldset",{children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Your selections"]}),n.map(i=>{const v=o[i.id]||1;return(0,e.jsxs)("div",{className:"selrow",children:[(0,e.jsx)("img",{className:"thumb",src:i.img||i.portrait,alt:i.name||i.title}),(0,e.jsxs)("div",{className:"info",children:[(0,e.jsx)("div",{className:"nm",children:i.name||i.title}),(0,e.jsxs)("div",{className:"tg",children:[i.tag," · ",i.note]})]}),(0,e.jsxs)("div",{className:"qty",children:[(0,e.jsx)("button",{type:"button","aria-label":"Decrease",onClick:()=>y&&y(i.id,v-1),children:"−"}),(0,e.jsx)("span",{children:v}),(0,e.jsx)("button",{type:"button","aria-label":"Increase",onClick:()=>y&&y(i.id,v+1),children:"+"})]}),(0,e.jsx)("button",{type:"button",className:"rm","aria-label":"Remove",onClick:()=>l&&l(i.id),children:"×"})]},i.id)}),(0,e.jsxs)("div",{className:"seltotal",children:[(0,e.jsxs)("span",{children:[t," arrangement",t!==1?"s":""," total"]}),p&&(0,e.jsxs)("b",{children:["≈ $",F.toLocaleString()]})]})]}),(0,e.jsxs)("fieldset",{children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Service"]}),(0,e.jsxs)("div",{className:"frow",children:[(0,e.jsxs)("div",{className:"field"+(a.date?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fDate",children:"Service date"}),(0,e.jsxs)("div",{className:"inp",children:[(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"5",y:"5.5",width:"14",height:"14.5",rx:"1"}),(0,e.jsx)("path",{d:"M5 9.5h14M9 3.5v4M15 3.5v4"})]}),(0,e.jsx)("input",{type:"date",id:"fDate",min:w,...r("date")})]}),(0,e.jsx)("p",{className:"err",children:"Required"})]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fDep",children:["Departed ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsxs)("div",{className:"inp",children:[(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("circle",{cx:"12",cy:"8",r:"3.4"}),(0,e.jsx)("path",{d:"M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4"})]}),(0,e.jsx)("input",{type:"text",id:"fDep",...r("dep")})]})]})]}),(0,e.jsxs)("div",{className:"field"+(a.svc?" bad":""),children:[(0,e.jsx)("label",{children:"Service type"}),(0,e.jsx)("div",{className:"pills",children:G.map(([i,v],S)=>(0,e.jsxs)("span",{children:[(0,e.jsx)("input",{type:"radio",name:"svc",id:"svc"+S,value:i,checked:c.svc===i,onChange:()=>{N(E=>({...E,svc:i})),k(E=>({...E,svc:!1}))}}),(0,e.jsx)("label",{htmlFor:"svc"+S,children:v})]},i))}),(0,e.jsx)("p",{className:"err",children:"Required"})]})]}),(0,e.jsxs)("fieldset",{children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Arrangement"]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fNotes",children:["Flower notes ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsxs)("div",{className:"tareawrap",children:[(0,e.jsx)("textarea",{id:"fNotes",maxLength:300,placeholder:"Favourite blooms, colours…",...r("notes")}),(0,e.jsxs)("span",{className:"counter",children:[c.notes.length," / 300"]})]})]})]}),(0,e.jsxs)("fieldset",{children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Card message"]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fMsg",children:["Sympathy card ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsxs)("div",{className:"tareawrap",children:[(0,e.jsx)("textarea",{id:"fMsg",maxLength:200,...r("msg")}),(0,e.jsxs)("span",{className:"counter",children:[c.msg.length," / 200"]})]})]})]}),(0,e.jsxs)("fieldset",{children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Your details"]}),(0,e.jsxs)("div",{className:"field"+(a.name?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fName",children:"Full name"}),(0,e.jsxs)("div",{className:"inp",children:[(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("circle",{cx:"12",cy:"8",r:"3.4"}),(0,e.jsx)("path",{d:"M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4"})]}),(0,e.jsx)("input",{type:"text",id:"fName",...r("name")})]}),(0,e.jsx)("p",{className:"err",children:"Required"})]}),(0,e.jsxs)("div",{className:"frow",children:[(0,e.jsxs)("div",{className:"field"+(a.phone?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fPhone",children:"Phone"}),(0,e.jsxs)("div",{className:"inp",children:[(0,e.jsx)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:(0,e.jsx)("path",{d:"M5 4h4l2 5-2.4 1.6a12.5 12.5 0 0 0 4.8 4.8L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"})}),(0,e.jsx)("input",{type:"tel",id:"fPhone",...r("phone")})]}),(0,e.jsx)("p",{className:"err",children:"Required"})]}),(0,e.jsxs)("div",{className:"field"+(a.email?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fEmail",children:"Email"}),(0,e.jsxs)("div",{className:"inp",children:[(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("rect",{x:"4",y:"6",width:"16",height:"12",rx:"1"}),(0,e.jsx)("path",{d:"M4 7l8 6 8-6"})]}),(0,e.jsx)("input",{type:"email",id:"fEmail",...r("email")})]}),(0,e.jsx)("p",{className:"err",children:"Required"})]})]})]}),(0,e.jsx)("button",{className:"submit",type:"submit",disabled:d,children:d?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{className:"fbspin"}),"Sending…"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Request booking"]})}),(0,e.jsx)("p",{className:"formnote",children:"No payment now — we'll confirm by phone."})]})]}),(0,e.jsxs)("footer",{className:"site-foot",children:[(0,e.jsx)("div",{className:"leafmark",children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"#F3E6DC",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)("p",{className:"tagline",children:"Every farewell, arranged with grace."}),(0,e.jsxs)("div",{className:"values",children:[(0,e.jsx)("span",{children:"Dignity"}),(0,e.jsx)("b",{children:"·"}),(0,e.jsx)("span",{children:"Care"}),(0,e.jsx)("b",{children:"·"}),(0,e.jsx)("span",{children:"Respect"})]})]})]})})})]})]}):null}var U=["Primary flower","Accent flower","Ribbon color","Foliage"];function H(){const[s,f]=(0,x.useState)({});return(0,e.jsxs)("div",{className:"color-inputs",children:[U.map(o=>(0,e.jsxs)("div",{className:"color-input-row",children:[(0,e.jsx)("div",{className:"color-input-label",children:o}),(0,e.jsx)("input",{className:"color-input-field",value:s[o]||"",placeholder:o==="Ribbon color"?"e.g. ivory white":o==="Primary flower"?"e.g. white roses":o==="Accent flower"?"e.g. pink carnations":"e.g. silver eucalyptus",onChange:m=>f(y=>({...y,[o]:m.target.value}))})]},o)),(0,e.jsx)("p",{style:{fontSize:12,color:"#B09A94",lineHeight:1.7,marginTop:4,fontStyle:"italic",fontFamily:"'Cormorant Garamond', Georgia, serif"},children:"Write in any color or flower name — our florist will match your request as closely as possible."})]})}function K({activeId:s,selectedIds:f,onNavigate:o,onClose:m,onToggle:y,onPreview:l,arrangements:h=[]}){const[g,c]=(0,x.useState)("overview"),N=h,a=N.find(r=>r.id===s),k=f.includes(s),d=N.findIndex(r=>r.id===s),b=N.length,j=(0,x.useRef)(null),[C,t]=(0,x.useState)({x:0,y:0,active:!1});(0,x.useEffect)(()=>{c("overview"),t({x:0,y:0,active:!1})},[s]);const n=(0,x.useCallback)(()=>{b>1&&o(N[(d-1+b)%b].id)},[N,b,d,o]),p=(0,x.useCallback)(()=>{b>1&&o(N[(d+1)%b].id)},[N,b,d,o]);(0,x.useEffect)(()=>{const r=u=>{u.key==="Escape"&&m(),u.key==="ArrowLeft"&&n(),u.key==="ArrowRight"&&p()};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[m,n,p]);const F=r=>{j.current={sx:r.touches[0].clientX,sy:r.touches[0].clientY,last:{x:0,y:0}},t({x:0,y:0,active:!0})},M=r=>{if(!j.current)return;const u=r.touches[0].clientX-j.current.sx,z=r.touches[0].clientY-j.current.sy;j.current.last={x:u,y:z},Math.abs(u)>Math.abs(z)+6?t({x:u,y:0,active:!0}):Math.abs(z)>Math.abs(u)&&t({x:0,y:0,active:!1})},w=()=>{const r=j.current&&j.current.last||{x:0,y:0};j.current=null,t({x:0,y:0,active:!1});const u=60;Math.abs(r.x)>Math.abs(r.y)&&Math.abs(r.x)>u&&(r.x<-60?p():r.x>u&&n())};return a?(0,e.jsxs)("div",{className:"expanded",children:[(0,e.jsxs)("div",{className:"detail-image-panel"+(C.active?" dragging":""),onTouchStart:F,onTouchMove:M,onTouchEnd:w,children:[(0,e.jsx)("div",{className:"detail-image-drag",style:{transform:`translate3d(${C.x*.18}px, 0, 0)`,transition:C.active?"none":"transform 0.35s cubic-bezier(0.16,1,0.3,1)"},children:(0,e.jsx)("img",{src:a.img||a.portrait,alt:a.name||a.title},s)}),(0,e.jsx)("div",{className:"img-overlay"}),b>1&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",{className:"swipe-hint prev",onClick:n,"aria-label":"Previous arrangement",children:"‹"}),(0,e.jsx)("button",{className:"swipe-hint next",onClick:p,"aria-label":"Next arrangement",children:"›"}),(0,e.jsxs)("div",{className:"swipe-counter",children:[d+1," / ",b]})]}),(0,e.jsxs)("div",{className:"swipe-down-hint",children:[(0,e.jsx)("span",{children:"‹ ›"}),(0,e.jsx)("span",{children:"swipe to browse"})]}),(0,e.jsxs)("div",{className:"detail-image-badge",children:[(0,e.jsxs)("div",{className:"detail-image-badge-tag",children:[a.tag," · ",a.note]}),(0,e.jsxs)("div",{className:"detail-image-badge-name",children:[(a.name||a.title).split(" ").slice(0,-1).join(" ")," ",(0,e.jsx)("em",{children:(a.name||a.title).split(" ").slice(-1)})]})]})]}),(0,e.jsxs)("div",{className:"detail-scroll-panel",children:[(0,e.jsxs)("div",{className:"detail-nav",children:[(0,e.jsx)("button",{className:"back-btn",onClick:m,children:"← All arrangements"}),(0,e.jsx)("div",{className:"detail-stories",children:N.map((r,u)=>{const z="detail-story-ring "+(r.id===s?"dsr-active":f.includes(r.id)?"dsr-selected":"dsr-normal");return(0,e.jsx)("button",{className:"detail-story-item",style:{animationDelay:`${u*.15}s`},onClick:()=>o(r.id),"aria-label":r.name||r.title,children:(0,e.jsx)("div",{className:z,style:{padding:2},children:(0,e.jsx)("div",{className:"detail-story-inner",style:{width:36,height:36},children:(0,e.jsx)("img",{src:r.portrait||r.img,alt:r.name||r.title})})})},r.id)})})]}),(0,e.jsxs)("div",{className:"detail-content",children:[(0,e.jsxs)("div",{className:"detail-eyebrow",children:[a.tag," · ",a.note]}),(0,e.jsx)("h2",{className:"detail-title",children:a.name||a.title}),(0,e.jsx)("p",{className:"detail-desc",children:a.desc}),(0,e.jsx)("div",{className:"tabs",children:["overview","colors","dimensions"].map(r=>(0,e.jsx)("button",{className:"tab"+(g===r?" active":""),onClick:()=>c(r),children:r},r))}),g==="overview"&&(0,e.jsx)("div",{className:"info-list",children:[["Size",a.size],["Flowers",a.flowers],["Weight",a.weight],["Display",a.display]].map(([r,u])=>(0,e.jsxs)("div",{className:"info-row",children:[(0,e.jsx)("div",{className:"info-label",children:r}),(0,e.jsx)("div",{className:"info-val",children:u})]},r))}),g==="colors"&&(0,e.jsx)(H,{}),g==="dimensions"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"dim-grid",children:[["Width",a.w],["Height",a.h],["Depth",a.d],["Weight",a.weight],["Display",a.display],["Size",a.size]].map(([r,u])=>(0,e.jsxs)("div",{className:"dim-cell",children:[(0,e.jsx)("div",{className:"dim-label",children:r}),(0,e.jsx)("div",{className:"dim-val",children:u})]},r))}),(0,e.jsxs)("div",{className:"placement",children:[(0,e.jsx)("div",{className:"placement-label",children:"Placement Guide"}),(0,e.jsx)("p",{className:"placement-text",children:a.placement})]})]}),(0,e.jsxs)("div",{className:"detail-footer",children:[(0,e.jsx)("button",{className:"btn btn-ghost",onClick:m,children:"← Back"}),(0,e.jsx)("button",{className:"btn btn-primary"+(k?" is-sel":""),onClick:()=>y(s),children:k?"✓ Remove":"+ Add to Booking"})]})]},s)]}),f.length>0&&(0,e.jsxs)("button",{className:"fs-cart",onClick:()=>{m(),l()},"aria-label":"Go to booking",children:[(0,e.jsx)("span",{className:"fs-cart-icon",children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)("span",{children:"Booking"}),(0,e.jsx)("span",{className:"fs-cart-count",children:f.length})]})]}):null}var V=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }
body {
  background: #0a0b0c;
  font-family: 'Inter', sans-serif;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

/* ── Animations ──────────────────────────────────────────────────────────── */
@keyframes heroFade { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
@keyframes storyFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0), 0 8px 32px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.5); }
}
@keyframes shimmer {
  from { background-position: -200% center; }
  to { background-position: 200% center; }
}

/* ── Swipe hint (browse) ────────────────────────────────────────────────── */
@keyframes hintPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.85; }
}
.browse-swipe-hint {
  position: absolute; top: 150px; left: 50%; transform: translateX(-50%);
  z-index: 10; font-size: 8.5px; font-weight: 600; letter-spacing: 0.3em;
  text-transform: uppercase; color: rgba(255,255,255,0.38); white-space: nowrap;
  display: flex; align-items: center; gap: 10px; pointer-events: none;
  animation: hintPulse 3.2s ease-in-out infinite;
  text-shadow: 0 1px 10px rgba(0,0,0,0.7);
}
.done-page { position: relative; }
.done-inner { position: relative; z-index: 6; }

/* candle animations */
@keyframes flicker {
  0%, 100% { transform: scaleX(1) scaleY(1) rotate(-1deg); opacity: 1; }
  20% { transform: scaleX(0.88) scaleY(1.06) rotate(2deg); opacity: 0.92; }
  40% { transform: scaleX(1.06) scaleY(0.96) rotate(-2deg); opacity: 1; }
  60% { transform: scaleX(0.94) scaleY(1.04) rotate(1deg); opacity: 0.95; }
  80% { transform: scaleX(1.02) scaleY(1.01) rotate(-1deg); opacity: 1; }
}
@keyframes candleGlow {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.08); }
}
@keyframes candleFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes wickFlicker { 0%, 100% { height: 14px; } 50% { height: 12px; } }

/* ── Browse ─────────────────────────────────────────────────────────────── */
.browse {
  position: relative; width: 100%; height: 100vh; overflow: hidden;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: #0a0b0c;
}
.browse-hero {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
  filter: brightness(0.82) saturate(0.95); opacity: 1;
}
.browse-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10,11,12,0.5) 0%,
    rgba(10,11,12,0.02) 30%,
    rgba(10,11,12,0.02) 55%,
    rgba(10,11,12,0.75) 100%
  );
}

/* ── Instagram-story strip ───────────────────────────────────────────────── */
.story-strip {
  position: absolute; top: 0; left: 0; right: 0; z-index: 20;
  padding: 28px 44px 0;
  display: flex; align-items: flex-start; gap: 20px;
  overflow-x: auto; scrollbar-width: none;
}
.story-strip::-webkit-scrollbar { display: none; }

.story-item {
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  background: none; border: none; cursor: pointer; padding: 0;
  flex-shrink: 0;
  /* floating animation — staggered via inline style */
  animation: storyFloat 3.2s ease-in-out infinite;
}

/* Ring container — IG gradient ring */
.story-ring-wrap {
  border-radius: 50%;
  padding: 2.5px;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  position: relative;
}
.story-ring-wrap.sr-unseen {
  background: conic-gradient(
    rgba(255,255,255,0.85) 0deg,
    rgba(200,200,200,0.5) 90deg,
    rgba(255,255,255,0.85) 180deg,
    rgba(200,200,200,0.5) 270deg,
    rgba(255,255,255,0.85) 360deg
  );
  box-shadow: 0 0 14px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.6);
  animation: storyFloat 3.2s ease-in-out infinite, ringPulse 2.8s ease-in-out infinite;
}
.story-ring-wrap.sr-seen {
  background: rgba(255,255,255,0.18);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.story-ring-wrap.sr-selected {
  background: linear-gradient(135deg, #475A43 0%, #6b8c64 50%, #475A43 100%);
  box-shadow: 0 0 18px rgba(71,90,67,0.5), 0 8px 24px rgba(0,0,0,0.6);
}
.story-item:hover .story-ring-wrap { transform: scale(1.06); }

.story-inner {
  width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
  border: 2.5px solid #0a0b0c;
  background: #1a1b1c;
}
.story-inner img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: brightness(0.88);
  transition: filter 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
.story-item:hover .story-inner img { filter: brightness(1.05); transform: scale(1.1); }
.story-item.is-sel .story-inner img { filter: brightness(0.95); }

.story-check {
  position: absolute; top: 0; right: 0;
  width: 20px; height: 20px; border-radius: 50%;
  background: #475A43; border: 2px solid #0a0b0c;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #fff; font-weight: 700;
  animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1);
}
.story-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgba(255,255,255,0.5);
  text-align: center; transition: color 0.2s;
  max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.story-item:hover .story-label { color: rgba(255,255,255,0.95); }
.story-item.is-sel .story-label { color: rgba(255,255,255,0.9); }

/* ── Story items ──────────────────────────────────────────────────────────── */
* { -webkit-tap-highlight-color: transparent; }
button:focus-visible, [role="button"]:focus-visible { outline: 2px solid #B98480; outline-offset: 2px; }

/* ── Floating add-to-booking button (left side, knows current view) ────────── */
.add-float {
  position: fixed; bottom: 28px; left: 28px; z-index: 200;
  display: flex; align-items: center; gap: 12px;
  animation: fadeIn 0.3s ease;
}
  .float-add {
    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    z-index: 20; width: 52px; height: 52px; border-radius: 50%;
    background: #6B4045; color: #FBF3EE; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(107,64,69,0.4); display: flex; align-items: center;
    justify-content: center; transition: transform .2s, box-shadow .2s;
    animation: fadeIn 0.4s ease;
  }
  .float-add:hover { transform: translateY(-50%) scale(1.06); box-shadow: 0 6px 28px rgba(107,64,69,0.55); }
  .float-add:active { transform: translateY(-50%) scale(0.94); }
  .float-add svg { width: 22px; height: 22px; }
  .float-add-label {
    position: absolute; right: 12px; top: calc(50% + 30px);
    font: 500 10px 'Karla', sans-serif; color: rgba(255,255,255,0.7);
    letter-spacing: 0.05em; white-space: nowrap; pointer-events: none;
  }
.add-float-btn {
  padding: 12px 22px; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; border: none; cursor: pointer;
  box-shadow: 0 8px 28px rgba(71,90,67,0.4);
  transition: all 0.2s; display: flex; align-items: center; gap: 8px;
}
.add-float-btn:hover { background: #556A50; transform: translateY(-1px); }
.add-float-btn.is-added { background: #C8A262; }
.add-float-btn .add-icon { font-size: 14px; font-weight: 700; line-height: 1; }

/* ── Browse title — bottom left ──────────────────────────────────────────── */
.browse-title-block {
  position: absolute; bottom: 52px; left: 48px; z-index: 10;
  animation: fadeUp 1.2s cubic-bezier(0.16,1,0.3,1);
}
.browse-name-tag {
  font-size: 9px; font-weight: 600; letter-spacing: 0.35em;
  text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px;
}
.browse-headline {
  font-family: 'Fraunces', serif; font-weight: 200;
  font-size: clamp(34px, 5vw, 54px); line-height: 1.05;
  color: #fff; letter-spacing: -0.02em;
}
.browse-headline em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.65); }

/* ── Wordmark ─────────────────────────────────────────────────────────────── */
.wordmark {
  position: absolute; bottom: 52px; right: 48px; z-index: 10;
  text-align: right; animation: fadeUp 1.4s cubic-bezier(0.16,1,0.3,1);
}
.wordmark-name {
  font-family: 'Fraunces', serif; font-size: 14px; font-weight: 300;
  color: rgba(255,255,255,0.3); letter-spacing: 0.04em;
}
.wordmark-sub {
  font-size: 8px; font-weight: 500; letter-spacing: 0.28em;
  color: rgba(255,255,255,0.14); text-transform: uppercase; margin-top: 4px;
}

/* ── Home preview drawer ─────────────────────────────────────────────────── */
.home-preview {
  position: absolute; bottom: 0; right: 0; z-index: 30;
  width: 290px; max-height: 72vh;
  max-height: 72dvh; /* Dynamic viewport height for mobile */
  background: rgba(8,9,10,0.94); backdrop-filter: blur(22px);
  border-left: 1px solid rgba(255,255,255,0.07);
  border-top: 1px solid rgba(255,255,255,0.07);
  border-top-left-radius: 14px;
  display: flex; flex-direction: column;
  animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
}
.home-preview-header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.home-preview-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
}
.home-preview-count { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); }
.home-preview-list { flex: 1; overflow-y: auto; padding: 10px 0; }
.home-preview-row {
  display: flex; align-items: center; gap: 12px; padding: 8px 18px;
  transition: background 0.15s;
}
.home-preview-row:hover { background: rgba(255,255,255,0.025); }
.home-preview-thumb {
  width: 54px; height: 40px; border-radius: 6px;
  object-fit: cover; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.07);
  filter: brightness(0.9);
}
.home-preview-info { flex: 1; min-width: 0; }
.home-preview-name {
  font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.85);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.home-preview-tag { font-size: 9px; color: rgba(255,255,255,0.28); margin-top: 2px; }
.home-preview-remove {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.18); font-size: 16px; padding: 2px 4px;
  transition: color 0.15s; flex-shrink: 0; line-height: 1;
}
.home-preview-remove:hover { color: rgba(255,255,255,0.65); }
.home-preview-footer {
  padding: 14px 18px;
  border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.home-preview-cta {
  width: 100%; padding: 13px 0; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
  text-transform: uppercase; border: none; cursor: pointer;
  transition: all 0.2s;
}
.home-preview-cta:hover { background: #556A50; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(71,90,67,0.35); }

/* Float badge */
.sel-float {
  position: fixed; bottom: 28px; right: 28px; z-index: 200;
  display: flex; align-items: center; gap: 12px;
  animation: fadeIn 0.3s ease;
}
.sel-float-faces { display: flex; }
.sel-float-face {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  border: 2px solid #0a0b0c; margin-left: -10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.sel-float-face:first-child { margin-left: 0; }
.sel-float-face img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.9); }
.sel-float-btn {
  padding: 11px 20px; border-radius: 8px;
  background: #475A43; color: #fff;
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; border: none; cursor: pointer;
  box-shadow: 0 8px 28px rgba(71,90,67,0.4);
  transition: all 0.2s;
}
.sel-float-btn:hover { background: #556A50; transform: translateY(-1px); }

/* Expanded / Detail view moved to ./FlowerDetail.jsx */

/* detail styles (tabs, info rows, colors, dimensions, buttons) moved to ./FlowerDetail.jsx */

/* ── Form ────────────────────────────────────────────────────────────────── */
/* booking form styles moved to ./FlowerSnowBookingForm.jsx */

/* ── Done / Candle screen ──────────────────────────────────────────────── */
.done-page {
  min-height: 100vh; background: #080909;
  min-height: 100dvh; /* Dynamic viewport height for mobile */
  display: flex; align-items: center; justify-content: center;
  padding: 24px; font-family: 'Inter', sans-serif;
}
.done-inner {
  max-width: 420px; text-align: center;
  animation: candleFadeUp 0.8s cubic-bezier(0.16,1,0.3,1);
}

/* Candle */
.candle-wrap {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 44px; position: relative;
}
.candle-glow {
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,210,120,0.35) 0%, rgba(255,180,60,0.12) 50%, transparent 75%);
  position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
  animation: candleGlow 2.2s ease-in-out infinite;
}
.candle-flame-wrap {
  position: relative; z-index: 2; margin-bottom: 2px;
  animation: flicker 2.8s ease-in-out infinite;
  transform-origin: bottom center;
}
.candle-flame {
  width: 18px; height: 28px; margin: 0 auto;
  background: linear-gradient(180deg, #fff5cc 0%, #ffd060 30%, #ff9020 70%, rgba(255,100,20,0.2) 100%);
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
  position: relative;
}
.candle-flame::after {
  content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,220,100,0.4) 100%);
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
}
.candle-wick {
  width: 2px; height: 12px; background: #3a2a1a;
  margin: 0 auto; border-radius: 1px; position: relative; z-index: 2;
  animation: wickFlicker 2.8s ease-in-out infinite;
}
.candle-body {
  width: 28px; border-radius: 3px 3px 2px 2px; position: relative;
  background: linear-gradient(180deg, #f5f0e8 0%, #e8dfc8 40%, #d4c9a8 100%);
  box-shadow: inset -3px 0 8px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.4);
}
.candle-drip {
  position: absolute; top: -6px; left: 6px;
  width: 6px; height: 10px;
  background: rgba(245,240,232,0.9);
  border-radius: 0 0 4px 4px;
}
.candle-base {
  width: 36px; height: 5px; border-radius: 2px;
  background: linear-gradient(180deg, #c8b890 0%, #b8a878 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.done-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.35em;
  text-transform: uppercase; color: rgba(255,255,255,0.2); margin-bottom: 20px;
}
.done-sorry {
  font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300;
  color: rgba(255,255,255,0.85); line-height: 1.3;
  margin-bottom: 12px; letter-spacing: -0.01em;
}
.done-sorry em { font-style: italic; font-weight: 200; color: rgba(255,255,255,0.55); }
.done-title {
  font-family: 'Fraunces', serif; font-size: 16px; font-weight: 300;
  color: rgba(255,255,255,0.45); margin-bottom: 22px; line-height: 1.5;
}
.done-text { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.9; margin-bottom: 36px; font-weight: 300; }
.done-text strong { color: rgba(255,255,255,0.7); font-weight: 500; }
.done-divider {
  width: 32px; height: 1px; background: rgba(255,255,255,0.12);
  margin: 0 auto 28px;
}
.done-btn {
  padding: 13px 28px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent;
  color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 600; cursor: pointer;
  letter-spacing: 0.14em; text-transform: uppercase;
  font-family: 'Inter', sans-serif; transition: all 0.22s;
}
.done-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

@media (max-width: 900px) {
  .story-strip { padding: 22px 22px 0; gap: 16px; }
  .browse-title-block { left: 24px; bottom: 32px; }
  .wordmark { right: 24px; bottom: 32px; }
  .home-preview { width: 100%; border-left: none; border-top-left-radius: 14px; border-top-right-radius: 14px; }
}

`;function J({arrangement:s,isActive:f,isSelected:o,size:m,animDelay:y,onClick:l}){const h="story-ring-wrap "+(f?"sr-unseen":o?"sr-selected":"sr-seen");return(0,e.jsxs)("div",{className:"story-item"+(o?" is-sel":""),onClick:l,style:{animationDelay:`${y}s`},role:"button",tabIndex:0,onKeyDown:g=>{(g.key==="Enter"||g.key===" ")&&l()},"aria-label":(s.name||s.title)+" — view details",children:[(0,e.jsx)("div",{className:h,style:{width:m+6,height:m+6,position:"relative"},children:(0,e.jsxs)("div",{className:"story-inner",style:{width:m,height:m},children:["          ",(0,e.jsx)("img",{src:s.portrait||s.img,alt:s.name||s.title})]})}),(0,e.jsx)("span",{className:"story-label",children:s.tag})]})}function Q({selectedIds:s,onRemove:f,onProceed:o,arrangements:m=[]}){if(!s.length)return null;const y=m;return(0,e.jsxs)("div",{className:"home-preview",children:[(0,e.jsxs)("div",{className:"home-preview-header",children:[(0,e.jsx)("span",{className:"home-preview-label",children:"Your Selections"}),(0,e.jsxs)("span",{className:"home-preview-count",children:[s.length," arrangement",s.length!==1?"s":""]})]}),(0,e.jsx)("div",{className:"home-preview-list",children:s.map(l=>{const h=y.find(g=>g.id===l);return h?(0,e.jsxs)("div",{className:"home-preview-row",children:[(0,e.jsx)("img",{className:"home-preview-thumb",src:h.img||h.portrait,alt:h.name||h.title}),(0,e.jsxs)("div",{className:"home-preview-info",children:[(0,e.jsx)("div",{className:"home-preview-name",children:h.name||h.title}),(0,e.jsx)("div",{className:"home-preview-tag",children:h.note||h.tag})]}),(0,e.jsx)("button",{className:"home-preview-remove",onClick:()=>f(l),children:"×"})]},l):null})}),(0,e.jsx)("div",{className:"home-preview-footer",children:(0,e.jsx)("button",{className:"home-preview-cta",onClick:o,children:"Continue to Booking →"})})]})}function ee({selectedIds:s,onOpen:f,onAdd:o,onRemove:m,onPreview:y,arrangements:l=[],loading:h=!1}){const[g,c]=(0,x.useState)(0),[N,a]=(0,x.useState)(!1),k=(0,x.useRef)(null),d=l;(0,x.useEffect)(()=>{if(d.length===0)return;const t=setInterval(()=>c(n=>(n+1)%d.length),6e3);return()=>clearInterval(t)},[d.length]),(0,x.useEffect)(()=>{s.length>0&&a(!0),s.length===0&&a(!1)},[s.length]);const b=d[g]||d[0];b?.id;const j=t=>{k.current={x:t.touches[0].clientX,y:t.touches[0].clientY,onUi:!!(t.target.closest&&t.target.closest(".story-strip, .home-preview, .sel-float, button"))}},C=t=>{if(!k.current||k.current.onUi){k.current=null;return}const n=t.changedTouches[0].clientX-k.current.x,p=t.changedTouches[0].clientY-k.current.y;k.current=null,d.length&&Math.abs(n)>Math.abs(p)&&Math.abs(n)>100&&c(F=>n<0?(F+1)%d.length:(F-1+d.length)%d.length)};return(0,e.jsxs)("div",{className:"browse",onTouchStart:j,onTouchEnd:C,children:[b&&(0,e.jsx)("img",{className:"browse-hero",src:b.img||b.portrait,alt:b.name||b.title},g),(0,e.jsx)("div",{className:"browse-overlay"}),(0,e.jsx)(q,{count:14,opacity:.5}),(0,e.jsx)("div",{className:"browse-swipe-hint",children:"‹ swipe ›"}),h&&d.length===0&&(0,e.jsx)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.7)",fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase"},children:"Loading arrangements…"}),!h&&d.length===0&&(0,e.jsxs)("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 24px"},children:[(0,e.jsx)("h2",{style:{fontFamily:"'Fraunces', serif",fontWeight:300,fontStyle:"italic",fontSize:"clamp(28px, 5vw, 48px)",marginBottom:12},children:"No arrangements yet"}),(0,e.jsx)("p",{style:{color:"rgba(255,255,255,0.6)",maxWidth:420,lineHeight:1.6,fontSize:14},children:"The funeral home hasn't uploaded any flower arrangements at the moment. Please check back soon."})]}),(0,e.jsxs)("div",{className:"story-strip",children:[d.map((t,n)=>(0,e.jsx)(J,{arrangement:t,isActive:n===g,isSelected:s.includes(t.id),size:72,animDelay:n*.18,onClick:()=>f(t.id),onAdd:()=>o(t.id)},t.id)),d.length>0&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",{className:"float-add",onClick:()=>{const t=d[g];t&&o(t.id)},"aria-label":"Add current flower to booking",title:d[g]?"Add "+d[g].name:"Add current flower",children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),(0,e.jsx)("line",{x1:"5",y1:"12",x2:"19",y2:"12"})]})}),(0,e.jsx)("span",{className:"float-add-label",children:"Add"})]})]}),(0,e.jsxs)("div",{className:"browse-title-block",children:[(0,e.jsx)("div",{className:"browse-name-tag",children:"Floral Tributes"}),(0,e.jsxs)("h1",{className:"browse-headline",children:["Choose your",(0,e.jsx)("br",{}),(0,e.jsx)("em",{children:"floral tribute"})]})]}),(0,e.jsxs)("div",{className:"wordmark",children:[(0,e.jsx)("div",{className:"wordmark-name",children:"Memorial Florals"}),(0,e.jsx)("div",{className:"wordmark-sub",children:"Est. since care began"})]}),N&&s.length>0&&(0,e.jsx)(Q,{selectedIds:s,onRemove:m,onProceed:y,arrangements:d}),!N&&s.length>0&&(0,e.jsxs)("div",{className:"sel-float",children:[(0,e.jsx)("div",{className:"sel-float-faces",children:s.slice(0,3).map(t=>{const n=d.find(p=>p.id===t);return n?(0,e.jsx)("div",{className:"sel-float-face",children:(0,e.jsx)("img",{src:n.portrait||n.img,alt:n.name||n.title})},t):null})}),(0,e.jsxs)("button",{className:"sel-float-btn",onClick:()=>a(!0),children:["View Selections · ",s.length]})]})]})}function ae(){const[s,f]=(0,x.useState)(null),[o,m]=(0,x.useState)([]),[y,l]=(0,x.useState)({}),[h,g]=(0,x.useState)([]),[c,N]=(0,x.useState)(!0),[a,k]=(0,x.useState)(!1),d=(0,x.useNavigate)();(0,x.useEffect)(()=>{let t=!1;return(async()=>{try{const p=localStorage.getItem("tenantSlug")||"system_shared",F=(await D.get("/florist/flower-samples",{params:{tenant_slug:p}})).data;if(!t&&F.success&&Array.isArray(F.data)){const M=F.data.map((w,r)=>{const u=w.images&&w.images.length>0?typeof w.images[0]=="string"?w.images[0]:w.images[0].url:null;return{id:String(w.sample_id||`arr-${r}`),name:w.title,img:u||"https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&h=1000",portrait:u||"https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&h=1200",tag:w.types&&w.types.length>0?w.types[0]:"Arrangement",note:w.price!=null?`$${Number(w.price).toLocaleString()}`:"Custom arrangement",desc:w.description||"A beautiful floral arrangement.",size:"Standard",flowers:w.description||"Fresh flowers",weight:"5–10 lbs",display:"Standard display",w:'18–24"',h:'12–18"',d:'12–18"',placement:"Place at the memorial service.",price:w.price!=null?Number(w.price):null}});g(M)}else t||g([])}catch(p){console.error("Failed to load flower samples:",p)}finally{t||N(!1)}})(),()=>{t=!0}},[]);const b=t=>{m(n=>n.includes(t)?(l(p=>{const F={...p};return delete F[t],F}),n.filter(p=>p!==t)):(l(p=>({...p,[t]:1})),[...n,t]))},j=t=>{m(n=>n.filter(p=>p!==t)),l(n=>{const p={...n};return delete p[t],p})},C=(0,x.useCallback)(()=>k(!0),[]);return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:V}}),(0,e.jsx)(ee,{selectedIds:o,onOpen:t=>f(t),onAdd:b,onRemove:j,onPreview:C,arrangements:h,loading:c}),s&&(0,e.jsx)(K,{activeId:s,selectedIds:o,onNavigate:f,onClose:()=>f(null),onToggle:b,onPreview:C,arrangements:h}),(0,e.jsx)(O,{open:a,selected:o,quantities:y,arrangements:h,onQtyChange:(t,n)=>l(p=>({...p,[t]:Math.max(1,n)})),onRemove:j,onBooked:()=>{m([]),l({}),d("/flower-samples")},onClose:()=>k(!1)})]})}export{ae as default};
