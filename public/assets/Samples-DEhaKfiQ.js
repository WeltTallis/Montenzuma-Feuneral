import{r as W}from"./chunk-CXHxssQy.js";import{y as T}from"./chunk-CXAmgOhv.js";import{o as q}from"./chunk-BY9AVXEY.js";import{s as I}from"./chunk-C935kdjU.js";import{i as _,mt as M}from"./index-DNPiyDLN.js";var c=W(T(),1),e=q(),$=`
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
`,Z=["#E8909B","#F3B8AC","#F6D3A0","#BFD8A8"];function P({count:i=14,opacity:h=.5,colors:n=Z,bounded:p=!1}){const x=(0,c.useMemo)(()=>Array.from({length:i},(a,g)=>({id:g,x:(Math.random()*100).toFixed(2)+"%",s:Math.round(8+Math.random()*12),d:(11+Math.random()*16).toFixed(2)+"s",dl:(-Math.random()*26).toFixed(2)+"s",px:Math.round(Math.random()*60-30)+"px",sw:(2.4+Math.random()*2.6).toFixed(2)+"s",po:(h*(.45+Math.random()*.55)).toFixed(2),c:n[g%n.length]})),[i,h,n]);return(0,e.jsxs)("div",{className:"snowfall"+(p?" snowfall--bounded":""),"aria-hidden":"true",children:[(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:$}}),x.map(a=>(0,e.jsx)("span",{className:"snowflake",style:{"--x":a.x,"--s":a.s+"px","--d":a.d,"--dl":a.dl,"--px":a.px,"--po":a.po,"--sw":a.sw},children:(0,e.jsx)("svg",{viewBox:"0 0 20 20",children:(0,e.jsx)("path",{d:"M10 1C15 5 16 12 10 19 4 12 5 5 10 1Z",fill:a.c})})},a.id))]})}var X=["Primary flower","Accent flower","Ribbon color","Foliage"];function O(){const[i,h]=(0,c.useState)({});return(0,e.jsxs)("div",{className:"color-inputs",children:[X.map(n=>(0,e.jsxs)("div",{className:"color-input-row",children:[(0,e.jsx)("div",{className:"color-input-label",children:n}),(0,e.jsx)("input",{className:"color-input-field",value:i[n]||"",placeholder:n==="Ribbon color"?"e.g. ivory white":n==="Primary flower"?"e.g. white roses":n==="Accent flower"?"e.g. pink carnations":"e.g. silver eucalyptus",onChange:p=>h(x=>({...x,[n]:p.target.value}))})]},n)),(0,e.jsx)("p",{style:{fontSize:12,color:"#B09A94",lineHeight:1.7,marginTop:4,fontStyle:"italic",fontFamily:"'Cormorant Garamond', Georgia, serif"},children:"Write in any color or flower name — our florist will match your request as closely as possible."})]})}function H({activeId:i,selectedIds:h,onNavigate:n,onClose:p,onToggle:x,onPreview:a,arrangements:g=[]}){const[b,N]=(0,c.useState)("overview"),j=g,o=j.find(r=>r.id===i),f=h.includes(i),w=j.findIndex(r=>r.id===i),v=j.length,m=(0,c.useRef)(null),[u,C]=(0,c.useState)({x:0,y:0,active:!1});(0,c.useEffect)(()=>{N("overview"),C({x:0,y:0,active:!1})},[i]);const F=(0,c.useCallback)(()=>{v>1&&n(j[(w-1+v)%v].id)},[j,v,w,n]),y=(0,c.useCallback)(()=>{v>1&&n(j[(w+1)%v].id)},[j,v,w,n]);(0,c.useEffect)(()=>{const r=l=>{l.key==="Escape"&&p(),l.key==="ArrowLeft"&&F(),l.key==="ArrowRight"&&y()};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[p,F,y]);const S=r=>{m.current={sx:r.touches[0].clientX,sy:r.touches[0].clientY,last:{x:0,y:0}},C({x:0,y:0,active:!0})},E=r=>{if(!m.current)return;const l=r.touches[0].clientX-m.current.sx,t=r.touches[0].clientY-m.current.sy;m.current.last={x:l,y:t},Math.abs(l)>Math.abs(t)+6?C({x:l,y:0,active:!0}):Math.abs(t)>Math.abs(l)&&C({x:0,y:0,active:!1})},s=()=>{const r=m.current&&m.current.last||{x:0,y:0};m.current=null,C({x:0,y:0,active:!1});const l=60;Math.abs(r.x)>Math.abs(r.y)&&Math.abs(r.x)>l&&(r.x<-60?y():r.x>l&&F())};return o?(0,e.jsxs)("div",{className:"expanded",children:[(0,e.jsxs)("div",{className:"detail-image-panel"+(u.active?" dragging":""),onTouchStart:S,onTouchMove:E,onTouchEnd:s,children:[(0,e.jsx)("div",{className:"detail-image-drag",style:{transform:`translate3d(${u.x*.18}px, 0, 0)`,transition:u.active?"none":"transform 0.35s cubic-bezier(0.16,1,0.3,1)"},children:(0,e.jsx)("img",{src:o.img||o.portrait,alt:o.name||o.title},i)}),(0,e.jsx)("div",{className:"img-overlay"}),v>1&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("button",{className:"swipe-hint prev",onClick:F,"aria-label":"Previous arrangement",children:"‹"}),(0,e.jsx)("button",{className:"swipe-hint next",onClick:y,"aria-label":"Next arrangement",children:"›"}),(0,e.jsxs)("div",{className:"swipe-counter",children:[w+1," / ",v]})]}),(0,e.jsxs)("div",{className:"swipe-down-hint",children:[(0,e.jsx)("span",{children:"‹ ›"}),(0,e.jsx)("span",{children:"swipe to browse"})]}),(0,e.jsxs)("div",{className:"detail-image-badge",children:[(0,e.jsxs)("div",{className:"detail-image-badge-tag",children:[o.tag," · ",o.note]}),(0,e.jsxs)("div",{className:"detail-image-badge-name",children:[(o.name||o.title).split(" ").slice(0,-1).join(" ")," ",(0,e.jsx)("em",{children:(o.name||o.title).split(" ").slice(-1)})]})]})]}),(0,e.jsxs)("div",{className:"detail-scroll-panel",children:[(0,e.jsxs)("div",{className:"detail-nav",children:[(0,e.jsx)("button",{className:"back-btn",onClick:p,children:"← All arrangements"}),(0,e.jsx)("div",{className:"detail-stories",children:j.map((r,l)=>{const t="detail-story-ring "+(r.id===i?"dsr-active":h.includes(r.id)?"dsr-selected":"dsr-normal");return(0,e.jsx)("button",{className:"detail-story-item",style:{animationDelay:`${l*.15}s`},onClick:()=>n(r.id),"aria-label":r.name||r.title,children:(0,e.jsx)("div",{className:t,style:{padding:2},children:(0,e.jsx)("div",{className:"detail-story-inner",style:{width:36,height:36},children:(0,e.jsx)("img",{src:r.portrait||r.img,alt:r.name||r.title})})})},r.id)})})]}),(0,e.jsxs)("div",{className:"detail-content",children:[(0,e.jsxs)("div",{className:"detail-eyebrow",children:[o.tag," · ",o.note]}),(0,e.jsx)("h2",{className:"detail-title",children:o.name||o.title}),(0,e.jsx)("p",{className:"detail-desc",children:o.desc}),(0,e.jsx)("div",{className:"tabs",children:["overview","colors","dimensions"].map(r=>(0,e.jsx)("button",{className:"tab"+(b===r?" active":""),onClick:()=>N(r),children:r},r))}),b==="overview"&&(0,e.jsx)("div",{className:"info-list",children:[["Size",o.size],["Flowers",o.flowers],["Weight",o.weight],["Display",o.display]].map(([r,l])=>(0,e.jsxs)("div",{className:"info-row",children:[(0,e.jsx)("div",{className:"info-label",children:r}),(0,e.jsx)("div",{className:"info-val",children:l})]},r))}),b==="colors"&&(0,e.jsx)(O,{}),b==="dimensions"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"dim-grid",children:[["Width",o.w],["Height",o.h],["Depth",o.d],["Weight",o.weight],["Display",o.display],["Size",o.size]].map(([r,l])=>(0,e.jsxs)("div",{className:"dim-cell",children:[(0,e.jsx)("div",{className:"dim-label",children:r}),(0,e.jsx)("div",{className:"dim-val",children:l})]},r))}),(0,e.jsxs)("div",{className:"placement",children:[(0,e.jsx)("div",{className:"placement-label",children:"Placement Guide"}),(0,e.jsx)("p",{className:"placement-text",children:o.placement})]})]}),(0,e.jsxs)("div",{className:"detail-footer",children:[(0,e.jsx)("button",{className:"btn btn-ghost",onClick:p,children:"← Back"}),(0,e.jsx)("button",{className:"btn btn-primary"+(f?" is-sel":""),onClick:()=>x(i),children:f?"✓ Remove":"+ Add to Booking"})]})]},i)]}),h.length>0&&(0,e.jsxs)("button",{className:"fs-cart",onClick:()=>{p(),a()},"aria-label":"Go to booking",children:[(0,e.jsx)("span",{className:"fs-cart-icon",children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)("span",{children:"Booking"}),(0,e.jsx)("span",{className:"fs-cart-count",children:h.length})]})]}):null}var G=`
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
.fbp-scrim{position:fixed;inset:0;background:rgba(30,18,19,.45);backdrop-filter:blur(2px);z-index:300;animation:fbFade .25s ease}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
.fbp-panel{position:fixed;top:0;right:0;bottom:0;width:min(620px,100vw);z-index:310;background:var(--paper);
  box-shadow:-30px 0 80px rgba(50,30,32,.35);animation:fbpIn .38s cubic-bezier(.16,1,.3,1);
  display:flex;flex-direction:column;overflow:hidden;font:400 16px/1.55 var(--sans);color:var(--ink)}
@keyframes fbpIn{from{transform:translateX(64px);opacity:0}to{transform:none;opacity:1}}
.fbp-close{position:absolute;top:12px;right:12px;z-index:30;width:40px;height:40px;border-radius:50%;
  border:1px solid var(--hair2);background:var(--card);color:var(--rosewood);font-size:22px;line-height:1;
  cursor:pointer;display:grid;place-items:center;padding:0;transition:.2s}
.fbp-close:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.fbp-scroll{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;position:relative}
.fbp-panel .snowfall{z-index:0}
*{-webkit-tap-highlight-color:transparent}
.fbp-panel button:focus-visible,.fbp-panel input:focus-visible,.fbp-panel textarea:focus-visible{outline:2px solid var(--rose);outline-offset:2px}
svg{display:block}
.fbp-panel button{font-family:var(--sans);color:var(--ink);cursor:pointer}
.fbp-panel ::selection{background:var(--blush)}
/* page / frame */
.fb-page{position:relative;z-index:1;width:100%}
.frame{position:relative;border:1px solid var(--hair);background:var(--card);box-shadow:0 30px 70px -46px rgba(107,64,69,.45)}
.sheet{position:relative;outline:1px solid var(--hair);outline-offset:7px;margin:7px}
.corner{position:absolute;width:76px;height:76px;color:var(--hair2);pointer-events:none;z-index:2}
.corner.tl{top:8px;left:8px}
.corner.tr{top:8px;right:8px;transform:scaleX(-1)}
.corner.bl{bottom:8px;left:8px;transform:scaleY(-1)}
.corner.br{bottom:8px;right:8px;transform:scale(-1)}
/* head */
.head{text-align:center;padding:26px 24px 0}
.head .sprig{width:min(300px,72vw);height:auto;margin:0 auto 2px}
.head h1{font:600 clamp(1.7rem,5vw,2.05rem)/1.1 var(--serif);letter-spacing:.02em;color:var(--rosewood)}
.head .sub{font:italic 500 .95rem var(--serif);color:var(--rose);margin-top:2px}
.inmemory{font:italic 600 1.05rem var(--serif);color:var(--gold);margin-top:8px;animation:memIn .3s ease}
@keyframes memIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
/* progress steps */
.steps{display:flex;justify-content:space-between;list-style:none;padding:20px 56px 4px}
.stp{flex:1;text-align:center;position:relative}
.stp .dot{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--hair2);background:var(--card);
  display:grid;place-items:center;margin:0 auto 6px;font:800 .74rem var(--sans);color:var(--ink3);transition:.25s;position:relative;z-index:1}
.stp .lbl{font:800 .58rem var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);transition:.25s}
.stp::before{content:"";position:absolute;top:16px;left:calc(-50% + 26px);right:calc(50% + 26px);height:1.5px;background:var(--hair2);transition:.3s}
.stp:first-child::before{display:none}
.stp.ln-on::before{background:var(--blush)}
.stp.current .dot{background:var(--rosewood);border-color:var(--rosewood);color:#FBF3EE;box-shadow:0 0 0 5px var(--blush-xl)}
.stp.current .lbl{color:var(--rosewood)}
.stp.done .dot{background:var(--blush-xl);border-color:var(--rose);color:var(--rosewood)}
.stp.done .lbl{color:var(--rose)}
@media(max-width:430px){.stp .lbl{display:none}.stp::before{top:15px;left:calc(-50% + 24px);right:calc(50% + 24px)}}
/* panes */
.panes{padding:14px 32px 30px}
@media(max-width:600px){.panes{padding:12px 18px 24px}}
.pane{display:none}
.pane.active{display:block;animation:stepIn .35s cubic-bezier(.16,1,.3,1)}
@keyframes stepIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
.fs-title{display:flex;align-items:center;gap:9px;font:800 .68rem var(--sans);letter-spacing:.22em;text-transform:uppercase;color:var(--rose);margin:20px 0 16px}
.fs-title .b{width:16px;height:16px;flex:none}
.fs-title::after{content:"";flex:1;height:1px;background:linear-gradient(to right,var(--hair),transparent)}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:540px){.frow{grid-template-columns:1fr}}
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field>label{display:block;font:800 .68rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);margin-bottom:.5rem}
.opt{display:inline;text-transform:none;letter-spacing:0;font-weight:600;color:var(--ink3)}
.field input,.field textarea{width:100%;background:#fff;border:1px solid var(--hair2);border-radius:12px;
  padding:.82rem .95rem;font:500 1rem/1.4 var(--sans);color:var(--ink);transition:border-color .2s,box-shadow .2s;min-height:50px}
.field textarea{resize:vertical;min-height:92px}
.field input:focus,.field textarea:focus{outline:none;border-color:var(--rose);box-shadow:0 0 0 3px var(--blush-xl)}
.field ::placeholder{color:var(--ink3)}
.autofilled{font:italic 500 .84rem var(--serif);color:var(--ink3);margin-top:6px}
.tareawrap{position:relative}
.tareawrap textarea{padding-bottom:2.3rem}
.counter{position:absolute;bottom:10px;right:12px;font:700 .66rem var(--sans);color:var(--ink3);background:#fff;padding:1px 5px;border-radius:6px}
/* size cards */
.sizes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media(max-width:460px){.sizes{grid-template-columns:1fr 1fr}}
.sizecard{position:relative;border:1px solid var(--hair2);border-radius:14px;background:#fff;padding:.85rem .6rem;text-align:center;transition:.2s}
.sizecard b{display:block;font:600 1.05rem var(--serif);color:var(--ink)}
.sizecard small{display:block;font:600 .64rem var(--sans);letter-spacing:.06em;color:var(--ink3);margin-top:2px}
.sizecard:hover{border-color:var(--rose)}
.sizecard.on{border-color:var(--rosewood);background:var(--blush-xl);box-shadow:0 0 0 1px var(--rosewood)}
.sizecard .tick{position:absolute;top:8px;right:8px;width:18px;height:18px;border-radius:50%;background:var(--rosewood);color:#FBF3EE;display:none;place-items:center}
.sizecard.on .tick{display:grid}
.sizecard .tick svg{width:10px;height:10px}
/* suggestion chips */
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.chip{padding:.45rem .85rem;border:1px dashed var(--hair2);border-radius:999px;background:transparent;
  font:600 .76rem var(--sans);color:var(--ink2);transition:.2s}
.chip:hover{border-color:var(--rose);color:var(--rosewood);border-style:solid}
/* errors */
.err{display:none;font:700 .76rem var(--sans);color:var(--brick);margin-top:6px}
.field.bad input,.field.bad textarea{border-color:var(--brick)}
.field.bad .err{display:block}
.field.bad>label{color:var(--brick)}
/* review */
.review{background:var(--blush-xl);border:1px solid var(--hair);border-radius:14px;padding:6px 18px;margin-bottom:16px}
.rv{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px dashed var(--hair2)}
.rv:last-child{border-bottom:0}
.rv dt{font:800 .64rem var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--ink2);padding-top:3px;flex:none}
.rv dd{font:500 .95rem var(--sans);color:var(--ink);text-align:right;min-width:0;overflow-wrap:anywhere}
/* buttons */
.btnrow{display:flex;gap:12px;margin-top:24px}
.btn-back{flex:0 0 auto;padding:1.05rem 1.5rem;border:1px solid var(--hair2);border-radius:12px;background:#fff;
  color:var(--rosewood);font:800 .78rem var(--sans);letter-spacing:.16em;text-transform:uppercase;transition:.25s}
.btn-back:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
.btn-next,.submit{flex:1;padding:1.05rem;background:var(--rosewood);color:#FBF3EE;border:0;border-radius:12px;
  font:800 .84rem var(--sans);letter-spacing:.2em;text-transform:uppercase;transition:.25s;display:flex;align-items:center;justify-content:center;gap:10px}
.btn-next:hover,.submit:hover:not(:disabled){background:var(--rosewood-d)}
.submit:disabled{opacity:.75;cursor:wait}
.btn-next .b,.submit .b{width:16px;height:16px}
.fbspin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(251,243,238,.35);border-top-color:#FBF3EE;animation:fbspin .7s linear infinite;flex:none}
@keyframes fbspin{to{transform:rotate(360deg)}}
.formnote{text-align:center;font:italic 500 .88rem var(--serif);color:var(--ink3);padding:12px 0 0}
/* confirmation: heading first, compact, sprig below the button */
.conf{text-align:center;padding:34px 22px 26px}
.conf h2{font:600 1.65rem/1.1 var(--serif);color:var(--rosewood)}
.csub{font:italic 500 .98rem var(--serif);color:var(--ink2);margin-top:5px}
.cref{display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;margin:14px 0;padding:10px 16px;border:1px solid var(--hair);border-radius:10px;font:700 .8rem var(--sans);background:var(--blush-xl)}
.conf .btn-ghost{margin-top:2px}
.conf .sprig{width:min(190px,58vw);height:auto;margin:16px auto 0}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:.72rem 1.35rem;border:1px solid var(--hair2);border-radius:10px;background:#fff;
  font:800 .74rem var(--sans);letter-spacing:.14em;text-transform:uppercase;transition:.25s;color:var(--rosewood)}
.btn-ghost:hover{background:var(--rosewood);color:#FBF3EE;border-color:var(--rosewood)}
/* rosewood footer */
.site-foot{position:relative;overflow:hidden;background:var(--rosewood);color:var(--cream);text-align:center;padding:38px 20px 34px}
.site-foot::before{content:"";position:absolute;left:50%;bottom:-260px;transform:translateX(-50%);width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(243,230,220,.12);pointer-events:none}
.site-foot::after{content:"";position:absolute;left:50%;bottom:-320px;transform:translateX(-50%);width:680px;height:680px;border-radius:50%;border:1px solid rgba(243,230,220,.07);pointer-events:none}
.leafmark{width:42px;height:42px;margin:0 auto 14px;border-radius:50%;background:rgba(243,230,220,.14);border:1px solid rgba(243,230,220,.3);display:grid;place-items:center;position:relative}
.leafmark svg{width:20px;height:20px}
.tagline{font:italic 500 1.12rem/1.5 var(--serif);color:rgba(243,230,220,.85);max-width:40ch;margin:0 auto;position:relative}
.values{display:flex;align-items:center;justify-content:center;gap:14px;margin:20px auto 0;max-width:380px;position:relative}
.values::before,.values::after{content:"";flex:1;height:1px;background:rgba(243,230,220,.2)}
.values span{font:800 .6rem var(--sans);letter-spacing:.26em;text-transform:uppercase;color:rgba(243,230,220,.6)}
.values b{font:600 .9rem var(--serif);color:rgba(243,230,220,.9)}
@media(max-width:600px){.site-foot{padding:40px 20px 36px}}
@media(prefers-reduced-motion:reduce){.fbp-panel *,.fbp-scrim{animation:none!important;transition:none!important}.snowfall{display:none}}
`,Y=()=>(0,e.jsx)("svg",{width:"0",height:"0",style:{position:"absolute"},"aria-hidden":"true",children:(0,e.jsxs)("defs",{children:[(0,e.jsxs)("symbol",{id:"bloom",viewBox:"0 0 24 24",children:[(0,e.jsxs)("g",{fill:"#F0AFA0",stroke:"#C96F63",strokeWidth:"1.1",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(72 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(144 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(216 12 12)"}),(0,e.jsx)("path",{d:"M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z",transform:"rotate(288 12 12)"})]}),(0,e.jsx)("circle",{cx:"12",cy:"12",r:"1.7",fill:"#E9B44C"})]}),(0,e.jsx)("symbol",{id:"cornerfl",viewBox:"0 0 90 90",children:(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeWidth:"1.2",strokeLinecap:"round",children:[(0,e.jsx)("path",{d:"M8 84C22 60 36 42 62 26"}),(0,e.jsx)("path",{d:"M34 56q-2-11 6-18q6 8 2 18Z",fill:"currentColor",opacity:".25",stroke:"none"}),(0,e.jsx)("path",{d:"M50 42q-3-10 3-18q7 7 4 18Z",fill:"currentColor",opacity:".22",stroke:"none"}),(0,e.jsx)("path",{d:"M24 70q-9-3-11-12q10 0 14 10Z",fill:"currentColor",opacity:".2",stroke:"none"}),(0,e.jsx)("circle",{cx:"66",cy:"23",r:"2.4",fill:"currentColor",stroke:"none"}),(0,e.jsx)("circle",{cx:"73",cy:"30",r:"1.7",fill:"currentColor",stroke:"none",opacity:".7"}),(0,e.jsx)("circle",{cx:"61",cy:"32",r:"1.7",fill:"currentColor",stroke:"none",opacity:".7"})]})}),(0,e.jsxs)("g",{id:"flower6",children:[(0,e.jsxs)("g",{fill:"var(--pf,#E58B80)",stroke:"var(--ps,#C4675B)",strokeWidth:"1",children:[(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5"}),(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5",transform:"rotate(60)"}),(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5",transform:"rotate(120)"}),(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5",transform:"rotate(180)"}),(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5",transform:"rotate(240)"}),(0,e.jsx)("ellipse",{cx:"0",cy:"-8",rx:"3.4",ry:"6.5",transform:"rotate(300)"})]}),(0,e.jsx)("circle",{r:"3.4",fill:"#F2C94C",stroke:"#C8A262",strokeWidth:"1"})]}),(0,e.jsxs)("symbol",{id:"sprig",viewBox:"0 0 260 64",children:[(0,e.jsxs)("g",{id:"spg",children:[(0,e.jsx)("path",{d:"M118 55C88 53 58 43 35 21",fill:"none",stroke:"#6FA45B",strokeWidth:"1.6",strokeLinecap:"round"}),(0,e.jsx)("path",{d:"M102 51q-3-11 3-19q8 7 4 19Z",fill:"#8CC071"}),(0,e.jsx)("path",{d:"M82 43q-4-10 0-19q8 6 5 19Z",fill:"#A5D189"}),(0,e.jsx)("path",{d:"M62 33q-5-9-3-18q9 5 8 18Z",fill:"#8CC071"}),(0,e.jsx)("path",{d:"M46 23q-6-8-6-17q10 4 11 17Z",fill:"#A5D189"})]}),(0,e.jsx)("use",{href:"#spg",transform:"translate(260 0) scale(-1 1)"}),(0,e.jsx)("use",{href:"#flower6",transform:"translate(34 20) scale(.85)",style:{"--pf":"#D97F86","--ps":"#B05A62"}}),(0,e.jsx)("use",{href:"#flower6",transform:"translate(226 20) scale(.85)",style:{"--pf":"#D97F86","--ps":"#B05A62"}}),(0,e.jsx)("use",{href:"#flower6",transform:"translate(130 27) scale(1.4)"}),(0,e.jsx)("circle",{cx:"122",cy:"56",r:"2.2",fill:"#E9B44C"}),(0,e.jsx)("circle",{cx:"138",cy:"56",r:"2.2",fill:"#E9B44C"})]}),(0,e.jsx)("symbol",{id:"tick",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{d:"M5 12.5l4.5 4.5L19 7",fill:"none",stroke:"currentColor",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round"})})]})}),z={date:"",time:"",dep:"",ribbon:"",size:"",notes:"",name:"",phone:"",email:""},U=[["Standard","Classic tribute"],["Large","Full & abundant"],["Grand","Statement piece"]],K=["White lilies","Blush roses","Seasonal wildflowers","Extra greenery","No strong fragrance"],B=()=>{const i=new Date;return`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}-${String(i.getDate()).padStart(2,"0")}`},D=()=>{const i=new Date;return`${String(i.getHours()).padStart(2,"0")}:${String(i.getMinutes()).padStart(2,"0")}`},L=i=>{if(!i)return"";const[h,n]=i.split(":").map(Number),p=h>=12?"pm":"am";return`${(h+11)%12+1}:${String(n).padStart(2,"0")} ${p}`};function V({open:i,onBooked:h,onClose:n}){const[p,x]=(0,c.useState)(1),[a,g]=(0,c.useState)(z),[b,N]=(0,c.useState)({}),[j,o]=(0,c.useState)(!1),[f,w]=(0,c.useState)(null),v=B();if((0,c.useEffect)(()=>{i&&g(t=>({...t,date:B(),time:D()}))},[i]),(0,c.useEffect)(()=>{if(!i)return;const t=d=>{d.key==="Escape"&&n&&n()};return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)},[i,n]),!i)return null;const m=t=>({value:a[t],onChange:d=>{g(k=>({...k,[t]:d.target.value})),N(k=>({...k,[t]:!1}))}}),u=t=>{const d=t.target.value,k=d.trim().startsWith("+"),R=d.replace(/\D/g,"").slice(0,15);g(A=>({...A,phone:(k?"+":"")+R.replace(/(\d{3})(?=\d)/g,"$1 ")})),N(A=>({...A,phone:!1}))},C=t=>{g(d=>({...d,size:d.size===t?"":t}))},F=t=>{g(d=>{const k=d.notes.trim();return k.toLowerCase().includes(t.toLowerCase())?d:{...d,notes:(k?k.replace(/,\s*$/,"")+", ":"")+t}})},y=a.dep.trim(),S=()=>{const t={};(!a.date||a.date<v)&&(t.date=!0),a.time||(t.time=!0),N(d=>({...d,...t})),!Object.keys(t).length&&x(2)},E=async()=>{const t={};if(a.name.trim().length<2&&(t.name=!0),/^[+\d][\d\s().-]{6,}$/.test(a.phone.trim())||(t.phone=!0),/^\S+@\S+\.\S+$/.test(a.email.trim())||(t.email=!0),N(d=>({...d,...t})),Object.keys(t).length){const d=document.querySelector(".fbp-panel .field.bad input, .fbp-panel .field.bad textarea");d&&d.focus();return}o(!0);try{await _.post("/florist/bookings",{date:a.date||null,time:a.time||null,deceased_name:y||null,ribbon_color:a.ribbon.trim()||null,size:a.size||null,special_instructions:a.notes.trim()||null,booked_by:a.name.trim()||null,phone:a.phone.trim()||null,email:a.email.trim()||null});const d="MH-"+Math.random().toString(36).slice(2,6).toUpperCase(),k=a.date?new Date(a.date+"T12:00:00").toLocaleDateString(void 0,{day:"numeric",month:"long",year:"numeric"})+(a.time?" · "+L(a.time):""):"";w({ref:d,dateStr:k,mem:y?`Flowers for ${y}, arranged with care.`:"We'll confirm by phone within two hours."}),x(3)}catch(d){alert(d.friendlyMessage||"Failed to submit. Please try again.")}finally{o(!1)}},s=()=>{g({...z,date:B(),time:D()}),N({}),w(null),o(!1),x(1),h&&h()},r=[["When",[a.date?new Date(a.date+"T12:00:00").toLocaleDateString(void 0,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"",a.time?L(a.time):""].filter(Boolean).join(" · ")],["Departed",y],["Ribbon color",a.ribbon.trim()],["Size",a.size],["Notes",a.notes.trim()]].filter(t=>t[1]),l=t=>"stp"+(t===p?" current":"")+(t<p?" done":"")+(t<=p&&p<=2?" ln-on":"");return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"fbp-scrim",onClick:n}),(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:G}}),(0,e.jsxs)("aside",{className:"fbp-panel",role:"dialog","aria-modal":"true","aria-label":"Flower booking",children:[(0,e.jsx)(P,{count:10,opacity:.5,colors:["#E8909B","#F3B8AC","#F6D3A0","#BFD8A8"],bounded:!0}),(0,e.jsx)(Y,{}),(0,e.jsx)("button",{className:"fbp-close",onClick:n,"aria-label":"Close booking panel",children:"×"}),(0,e.jsx)("div",{className:"fbp-scroll",children:(0,e.jsx)("div",{className:"fb-page",children:(0,e.jsxs)("div",{className:"frame",children:[(0,e.jsx)("svg",{className:"corner tl",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner tr",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner bl",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsx)("svg",{className:"corner br",children:(0,e.jsx)("use",{href:"#cornerfl"})}),(0,e.jsxs)("div",{className:"sheet",children:[(0,e.jsxs)("div",{className:"head",children:[(0,e.jsx)("svg",{className:"sprig",children:(0,e.jsx)("use",{href:"#sprig"})}),(0,e.jsx)("h1",{children:"Flower booking"}),(0,e.jsx)("p",{className:"sub",children:"Hand-arranged · Delivered with grace"}),!f&&y&&(0,e.jsxs)("p",{className:"inmemory",children:["Flowers for ",y]})]}),!f&&(0,e.jsxs)("ol",{className:"steps",children:[(0,e.jsxs)("li",{className:l(1),"aria-current":p===1?"step":"false",children:[(0,e.jsx)("span",{className:"dot",children:"1"}),(0,e.jsx)("span",{className:"lbl",children:"Arrangement"})]}),(0,e.jsxs)("li",{className:l(2),"aria-current":p===2?"step":"false",children:[(0,e.jsx)("span",{className:"dot",children:"2"}),(0,e.jsx)("span",{className:"lbl",children:"Details"})]})]}),(0,e.jsxs)("div",{className:"panes",children:[p===1&&(0,e.jsxs)("section",{className:"pane active",children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Service"]}),(0,e.jsxs)("div",{className:"frow",children:[(0,e.jsxs)("div",{className:"field"+(b.date?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fDate",children:"Service date"}),(0,e.jsx)("input",{type:"date",id:"fDate",min:v,...m("date")}),(0,e.jsx)("p",{className:"err",children:"Required"})]}),(0,e.jsxs)("div",{className:"field"+(b.time?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fTime",children:"Service time"}),(0,e.jsx)("input",{type:"time",id:"fTime",...m("time")}),(0,e.jsx)("p",{className:"err",children:"Required"})]})]}),(0,e.jsx)("p",{className:"autofilled",children:"Set to today, just now. Adjust if the service is later."}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fDep",children:["Departed name ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsx)("input",{type:"text",id:"fDep",placeholder:"e.g. Mary Wanjiku",...m("dep")})]}),(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Arrangement"]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fRibbon",children:["Ribbon color ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsx)("input",{type:"text",id:"fRibbon",placeholder:"Type the color you want, e.g. Ivory White",...m("ribbon")})]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{children:["Size preference ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsx)("div",{className:"sizes",children:U.map(([t,d])=>(0,e.jsxs)("button",{type:"button",className:"sizecard"+(a.size===t?" on":""),onClick:()=>C(t),children:[(0,e.jsx)("span",{className:"tick",children:(0,e.jsx)("svg",{children:(0,e.jsx)("use",{href:"#tick"})})}),(0,e.jsx)("b",{children:t}),(0,e.jsx)("small",{children:d})]},t))})]}),(0,e.jsxs)("div",{className:"field",children:[(0,e.jsxs)("label",{htmlFor:"fNotes",children:["Flower notes ",(0,e.jsx)("span",{className:"opt",children:"(optional)"})]}),(0,e.jsxs)("div",{className:"tareawrap",children:[(0,e.jsx)("textarea",{id:"fNotes",maxLength:300,placeholder:"Favourite blooms, colours...",...m("notes")}),(0,e.jsxs)("span",{className:"counter",children:[a.notes.length," / 300"]})]}),(0,e.jsx)("div",{className:"chips",children:K.map(t=>(0,e.jsx)("button",{type:"button",className:"chip",onClick:()=>F(t),children:t},t))})]}),(0,e.jsx)("div",{className:"btnrow",children:(0,e.jsxs)("button",{type:"button",className:"btn-next",onClick:S,children:["Continue",(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})})]})})]}),p===2&&(0,e.jsxs)("section",{className:"pane active",children:[(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Review"]}),(0,e.jsx)("dl",{className:"review",children:r.length?r.map(([t,d])=>(0,e.jsxs)("div",{className:"rv",children:[(0,e.jsx)("dt",{children:t}),(0,e.jsx)("dd",{children:d})]},t)):(0,e.jsxs)("div",{className:"rv",children:[(0,e.jsx)("dt",{children:"Arrangement"}),(0,e.jsx)("dd",{children:"Standard, florist's choice"})]})}),(0,e.jsxs)("div",{className:"fs-title",children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Your details"]}),(0,e.jsxs)("div",{className:"field"+(b.name?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fName",children:"Full name"}),(0,e.jsx)("input",{type:"text",id:"fName",autoComplete:"name",...m("name")}),(0,e.jsx)("p",{className:"err",children:"Please enter your name"})]}),(0,e.jsxs)("div",{className:"field"+(b.phone?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fPhone",children:"Phone"}),(0,e.jsx)("input",{type:"tel",id:"fPhone",autoComplete:"tel",inputMode:"tel",value:a.phone,onChange:u}),(0,e.jsx)("p",{className:"err",children:"Enter a valid phone number"})]}),(0,e.jsxs)("div",{className:"field"+(b.email?" bad":""),children:[(0,e.jsx)("label",{htmlFor:"fEmail",children:"Email"}),(0,e.jsx)("input",{type:"email",id:"fEmail",autoComplete:"email",inputMode:"email",...m("email")}),(0,e.jsx)("p",{className:"err",children:"Enter a valid email address"})]}),(0,e.jsxs)("div",{className:"btnrow",children:[(0,e.jsx)("button",{type:"button",className:"btn-back",onClick:()=>x(1),children:"Back"}),(0,e.jsx)("button",{className:"submit",type:"button",onClick:E,disabled:j,children:j?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{className:"fbspin"}),"Sending..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("svg",{className:"b",children:(0,e.jsx)("use",{href:"#bloom"})}),"Request booking"]})})]}),(0,e.jsx)("p",{className:"formnote",children:"No payment now. We'll confirm by phone."})]}),p===3&&f&&(0,e.jsx)("section",{className:"pane active",children:(0,e.jsxs)("div",{className:"conf",children:[(0,e.jsx)("h2",{children:"Booking received"}),(0,e.jsx)("p",{className:"csub",children:f.mem}),(0,e.jsxs)("div",{className:"cref",children:[f.ref&&(0,e.jsxs)("span",{children:["Ref ",f.ref]}),f.dateStr&&(0,e.jsx)("span",{children:f.dateStr})]}),(0,e.jsx)("div",{children:(0,e.jsx)("button",{type:"button",className:"btn-ghost",style:{marginTop:0},onClick:s,children:"Make another booking"})}),(0,e.jsx)("svg",{className:"sprig","aria-hidden":"true",children:(0,e.jsx)("use",{href:"#sprig"})})]})})]})]}),(0,e.jsxs)("footer",{className:"site-foot",children:[(0,e.jsx)("div",{className:"leafmark",children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"#F3E6DC",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)("p",{className:"tagline",children:"Every farewell, arranged with grace."}),(0,e.jsxs)("div",{className:"values",children:[(0,e.jsx)("span",{children:"Dignity"}),(0,e.jsx)("b",{children:"·"}),(0,e.jsx)("span",{children:"Care"}),(0,e.jsx)("b",{children:"·"}),(0,e.jsx)("span",{children:"Respect"})]})]})]})})})]})]})}var J=`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');
:root{
  --paper:#FBF8F4; --ink:#4A3B3C; --ink2:#7A6664; --ink3:#B09A94;
  --rosewood:#8B4557; --blush:#DCAEA6; --blush-xl:#F6E7E2;
  --gold:#C8A262; --hair:#E8E0DA; --hair2:#E0C9C0;
  --serif:'Fraunces',Georgia,serif; --sans:'Inter',sans-serif;
}
.mg-viewport{position:fixed;inset:0;overflow:hidden;background:#000;pointer-events:auto}
.mg-slide{position:absolute;inset:0;transition:opacity .5s ease}
.mg-slide img{width:100%;height:100%;object-fit:cover;display:block}
.mg-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,transparent 35%,transparent 55%,rgba(0,0,0,.75) 100%)}
.mg-stories{position:fixed;top:0;left:0;right:0;z-index:10;padding:20px 24px 12px;display:flex;gap:12px;overflow-x:auto;scrollbar-width:none}
.mg-stories::-webkit-scrollbar{display:none}
.mg-story-item{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;cursor:pointer;transition:transform .2s}
.mg-story-item:hover{transform:scale(1.06)}
.mg-story-ring{width:56px;height:56px;border-radius:50%;padding:2px;display:grid;place-items:center;transition:.25s}
.mg-story-ring.unseen{background:conic-gradient(var(--gold) 0deg,var(--blush-xl) 90deg,var(--gold) 180deg,var(--blush-xl) 270deg,var(--gold) 360deg);box-shadow:0 0 10px rgba(185,132,128,.35)}
.mg-story-ring.seen{background:rgba(255,255,255,.18)}
.mg-story-inner{width:48px;height:48px;border-radius:50%;border:2px solid var(--paper);overflow:hidden;display:grid;place-items:center}
.mg-story-inner img{width:100%;height:100%;object-fit:cover}
.mg-bottom{position:fixed;bottom:0;left:0;right:0;z-index:10;padding:32px 40px 40px;color:#fff}
.mg-badge{display:inline-block;margin-bottom:12px;padding:6px 16px;border-radius:999px;font:700 10px 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase}
.mg-badge.premium{background:var(--gold);color:#fff}
.mg-badge.standard{background:rgba(251,246,241,.15);color:rgba(255,255,255,.85)}
.mg-type{font:400 11px/1.2 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.6}
.mg-name{font:400 clamp(2rem,5vw,2.8rem)/1.05 var(--serif);margin:6px 0 10px;letter-spacing:-.01em}
.mg-price{font:300 2rem var(--serif);color:var(--gold)}
.mg-actions{display:flex;align-items:end;justify-content:space-between}
.mg-btn{padding:14px 32px;border-radius:999px;cursor:pointer;font:600 13px 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;transition:opacity .2s;border:none}
.mg-btn.details{background:rgba(251,246,241,.9);color:var(--rosewood)}
.mg-btn.details:hover{opacity:.88}
.mg-dots{display:flex;justify-content:center;gap:8px;margin-top:24px}
.mg-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.3);transition:all .3s;cursor:pointer}
.mg-dot.active{width:22px;background:var(--gold)}
.mg-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:10;width:48px;height:48px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;cursor:pointer;background:rgba(0,0,0,.35);color:#fff;border:1px solid rgba(255,255,255,.15);transition:opacity .2s}
.mg-arrow:hover{opacity:.8}
.mg-arrow.left{left:24px}
.mg-arrow.right{right:24px}
.mg-empty{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--paper);text-align:center;padding:40px}
.mg-empty-icon{opacity:.35;margin-bottom:16px}
.mg-empty h3{font:400 22px var(--serif);color:var(--rosewood);margin-bottom:8px}
.mg-empty p{font:400 15px var(--sans);color:var(--ink3)}
@media (max-width:768px){.mg-bottom{padding:24px 20px 32px}.mg-name{font-size:1.6rem}.mg-price{font-size:1.5rem}.mg-arrow{width:42px;height:42px}}
`;function ae(){const[i,h]=(0,c.useState)([]),[n,p]=(0,c.useState)(0),[x,a]=(0,c.useState)(null),[g,b]=(0,c.useState)(!1),[N,j]=(0,c.useState)(!0),o=(0,c.useRef)(null),f=(0,c.useRef)(!1),w=(0,c.useRef)(new Set);(0,c.useEffect)(()=>{(async()=>{try{const r=I(),l=(await _.get("/florist/flower-samples/",{params:{tenant_id:r||void 0}})).data?.data||[];h(l)}catch(r){console.error("Failed to load arrangements:",r)}j(!1)})()},[]);const v=i.slice().reverse().map((s,r)=>({id:s.arrangement_id||r,label:(s.title||s.name||"Arrangement").split(" ")[0],arrangementId:s.arrangement_id||s.id,img:s.images?.[0]?.url||s.images?.[0]||s.img||"",viewed:w.current.has(s.arrangement_id||r)})),m=(0,c.useCallback)(s=>{p(Math.max(0,Math.min(Math.max(i.length-1,0),s)))},[i.length]),u=i[n]||null,C=s=>{o.current=s.clientX,f.current=!1,s.currentTarget.setPointerCapture(s.pointerId)},F=s=>{o.current!==null&&Math.abs(s.clientX-o.current)>6&&(f.current=!0)},y=s=>{if(o.current===null)return;const r=s.clientX-o.current;f.current?r<-50?m(n+1):r>50&&m(n-1):a(u),o.current=null,f.current=!1},S=s=>{w.current.add(s.id);const r=i.findIndex(l=>(l.arrangement_id||l.id)===s.arrangementId);r>=0&&(p(r),a(i[r]))};(0,c.useEffect)(()=>{const s=r=>{x||g||(r.key==="ArrowRight"&&m(n+1),r.key==="ArrowLeft"&&m(n-1))};return window.addEventListener("keydown",s),()=>window.removeEventListener("keydown",s)},[n,m,x,g]);const E=i.map(s=>({...s,name:s.title||s.name,img:s.images?.[0]?.url||s.images?.[0]||s.img,desc:s.desc||s.description||"",title:s.title||s.name,portrait:s.images?.[0]?.url||s.images?.[0]||s.portrait||s.img}));return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("style",{dangerouslySetInnerHTML:{__html:J}}),(0,e.jsx)(P,{count:24,opacity:.5,colors:["#E8909B","#F3B8AC","#F6D3A0","#BFD8A8"]}),N?(0,e.jsxs)("div",{className:"mg-empty",children:[(0,e.jsx)(M,{size:48,className:"mg-empty-icon"}),(0,e.jsx)("h3",{children:"Loading arrangements..."})]}):i.length===0?(0,e.jsxs)("div",{className:"mg-empty",children:[(0,e.jsx)(M,{size:48,className:"mg-empty-icon"}),(0,e.jsx)("h3",{children:"No floral samples yet"}),(0,e.jsx)("p",{children:"Upload samples in the florist portal to showcase your arrangements here."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"mg-viewport",onPointerDown:C,onPointerMove:F,onPointerUp:y,children:[i.map((s,r)=>{const l=s.images?.[0]?.url||s.images?.[0]||s.img;return(0,e.jsx)("div",{className:"mg-slide",style:{opacity:r===n?1:0,pointerEvents:r===n?"auto":"none"},children:(0,e.jsx)("img",{src:l,alt:s.title||s.name||"Arrangement",draggable:!1})},s.arrangement_id||s.id)}),(0,e.jsx)("div",{className:"mg-vignette"}),(0,e.jsx)("div",{className:"mg-stories",children:v.map(s=>{const r=w.current.has(s.id);return(0,e.jsxs)("button",{className:"mg-story-item",onClick:l=>{l.stopPropagation(),S(s)},children:[(0,e.jsx)("div",{className:`mg-story-ring ${r?"seen":"unseen"}`,children:(0,e.jsx)("div",{className:"mg-story-inner",children:(0,e.jsx)("img",{src:s.img,alt:s.label})})}),(0,e.jsx)("span",{className:"text-[11px] uppercase tracking-widest",style:{color:r?"rgba(255,255,255,.35)":"rgba(255,255,255,.85)"},children:s.label})]},s.id)})}),n>0&&(0,e.jsx)("button",{className:"mg-arrow left",onClick:s=>{s.stopPropagation(),m(n-1)},"aria-label":"Previous arrangement",children:(0,e.jsx)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,e.jsx)("polyline",{points:"15 18 9 12 15 6"})})}),n<i.length-1&&(0,e.jsx)("button",{className:"mg-arrow right",onClick:s=>{s.stopPropagation(),m(n+1)},"aria-label":"Next arrangement",children:(0,e.jsx)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,e.jsx)("polyline",{points:"9 18 15 12 9 6"})})}),(0,e.jsxs)("div",{className:"mg-bottom",children:[u?.tag&&(0,e.jsx)("div",{className:`mg-badge ${u.tag==="Premium"?"premium":"standard"}`,children:u.tag}),(0,e.jsx)("p",{className:"mg-type",children:u?.types?.[0]||u?.type||"Flower Arrangement"}),(0,e.jsx)("h2",{className:"mg-name",children:u?.title||u?.name||"Arrangement"}),(0,e.jsxs)("div",{className:"mg-actions",children:[(0,e.jsxs)("span",{className:"mg-price",children:["$",u?.price||"—"]}),(0,e.jsx)("button",{className:"mg-btn details",onClick:s=>{s.stopPropagation(),a(u)},children:"View Details"})]}),(0,e.jsx)("div",{className:"mg-dots",children:i.map((s,r)=>(0,e.jsx)("button",{className:`mg-dot ${r===n?"active":""}`,onClick:l=>{l.stopPropagation(),m(r)}},r))})]})]}),x&&(0,e.jsx)(H,{activeId:x.arrangement_id||x.id,selectedIds:[x.arrangement_id||x.id],onNavigate:s=>{const r=i.findIndex(l=>(l.arrangement_id||l.id)===s);r>=0&&(p(r),a(i[r]))},onClose:()=>a(null),onToggle:()=>{},onPreview:()=>b(!0),arrangements:E}),g&&(0,e.jsx)(V,{open:g,onBooked:()=>b(!1),onClose:()=>b(!1)})]})]})}export{ae as default};
