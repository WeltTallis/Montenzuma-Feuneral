var g="ntf-styles",b="ntf-stack",h={ok:'<i class="fas fa-check"></i>',err:'<i class="fas fa-xmark"></i>',warn:'<i class="fas fa-exclamation"></i>',inf:'<i class="fas fa-info"></i>'},T=`
#ntf-stack{
  --ntf-ok:#16a34a;--ntf-ok-s:rgba(22,163,74,.3);
  --ntf-err:#e11d48;--ntf-err-s:rgba(225,29,72,.3);
  --ntf-warn:#ea580c;--ntf-warn-s:rgba(234,88,12,.3);
  --ntf-inf:#0e3345;--ntf-inf-s:rgba(14,51,69,.3);
  position:fixed;top:24px;right:24px;z-index:9999;
  display:flex;flex-direction:column;gap:10px;
  width:390px;max-width:calc(100vw - 48px);
  pointer-events:none;
  font-family:'DM Sans','Space Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;
}

.ntf-t{
  pointer-events:auto;box-sizing:border-box;
  position:relative;border-radius:14px;
  padding:15px 14px 13px 16px;
  color:#fff;overflow:hidden;
  transform:translateX(calc(100% + 48px));
  opacity:0;
  animation:ntf-slide-in .55s cubic-bezier(.16,1,.3,1) forwards;
}
.ntf-t.out{animation:ntf-slide-out .4s cubic-bezier(.4,0,1,1) forwards}

@keyframes ntf-slide-in{to{transform:translateX(0);opacity:1}}
@keyframes ntf-slide-out{
  0%{transform:translateX(0);opacity:1;max-height:180px;margin-bottom:0}
  100%{transform:translateX(calc(100% + 48px));opacity:0;max-height:0;margin-bottom:-10px;padding:0 14px;border-radius:14px}
}

.ntf-t.ntf-ok{background:var(--ntf-ok);box-shadow:0 10px 36px -6px var(--ntf-ok-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-err{background:var(--ntf-err);box-shadow:0 10px 36px -6px var(--ntf-err-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-warn{background:var(--ntf-warn);box-shadow:0 10px 36px -6px var(--ntf-warn-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-inf{background:var(--ntf-inf);box-shadow:0 10px 36px -6px var(--ntf-inf-s),0 4px 14px -4px rgba(0,0,0,.08)}

.ntf-t::before{
  content:'';position:absolute;top:0;left:0;right:0;height:45%;
  background:linear-gradient(180deg,rgba(255,255,255,.12) 0%,transparent 100%);
  border-radius:14px 14px 0 0;pointer-events:none;
}

.ntf-row{display:flex;align-items:flex-start;gap:12px;position:relative;z-index:1}

.ntf-ic{
  width:32px;height:32px;border-radius:9px;flex-shrink:0;
  background:rgba(255,255,255,.18);
  display:flex;align-items:center;justify-content:center;
  font-size:13px;color:#fff;
  transition:transform .3s cubic-bezier(.16,1,.3,1),background .2s ease;
  animation:ntf-icon-pop .35s .4s cubic-bezier(.16,1,.3,1) both;
}
.ntf-t:hover .ntf-ic{transform:scale(1.08);background:rgba(255,255,255,.26)}

@keyframes ntf-icon-pop{
  0%{transform:scale(0);opacity:0}
  60%{transform:scale(1.15)}
  100%{transform:scale(1);opacity:1}
}

.ntf-body{flex:1;min-width:0}
.ntf-ttl{font-size:13px;font-weight:700;line-height:1.35;margin-bottom:1px;letter-spacing:-.01em}
.ntf-msg{font-size:12px;line-height:1.55;opacity:.78;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.ntf-x{
  width:24px;height:24px;border-radius:7px;border:none;padding:0;
  background:transparent;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:rgba(255,255,255,.4);flex-shrink:0;margin-top:-2px;
  transition:all .15s ease;font-size:11px;
}
.ntf-x:hover{background:rgba(255,255,255,.15);color:#fff}

.ntf-acts{display:flex;gap:8px;margin-top:10px;padding-left:44px;position:relative;z-index:1}
.ntf-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 13px;border-radius:8px;
  font-size:11px;font-weight:600;font-family:inherit;
  cursor:pointer;border:none;transition:all .15s ease;color:#fff;
}
.ntf-btn.pri{background:rgba(255,255,255,.2)}
.ntf-btn.pri:hover{background:rgba(255,255,255,.32)}
.ntf-btn.gho{background:transparent;opacity:.65}
.ntf-btn.gho:hover{opacity:1;background:rgba(255,255,255,.1)}
.ntf-btn i{font-size:9px}

.ntf-bar{position:absolute;bottom:0;left:0;right:0;height:2.5px;background:rgba(0,0,0,.08);z-index:2}
.ntf-bar-f{height:100%;background:rgba(255,255,255,.35);transform-origin:left;animation:ntf-shrink linear forwards}
@keyframes ntf-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}

@media(max-width:560px){
  #ntf-stack{right:10px;width:calc(100vw - 20px)}
}
`,y=!1;function C(){if(!(y||typeof document>"u")){if(!document.getElementById(g)){const t=document.createElement("style");t.id=g,t.textContent=T,document.head.appendChild(t)}y=!0}}function S(){C();let t=document.getElementById(b);return t||(t=document.createElement("div"),t.id=b,t.setAttribute("role","region"),t.setAttribute("aria-label","Notifications"),t.setAttribute("aria-live","polite"),document.body.appendChild(t)),t}function f(t){!t||!t.classList||t.classList.contains("out")||(clearTimeout(t._ntfTimer),t.classList.add("out"),t.addEventListener("animationend",()=>t.remove(),{once:!0}))}function N(){typeof document>"u"||document.querySelectorAll(`#${b} .ntf-t`).forEach(f)}function i({type:t="inf",title:e="",msg:n="",dur:l=5500,acts:p=null,bar:v=!0,pause:w=!0}={}){if(typeof document>"u")return console.warn("[notify] No DOM available — toast skipped:",e||"(untitled)"),null;const E=S(),a=document.createElement("div");a.className=`ntf-t ntf-${t}`,a.setAttribute("role","status");const m=document.createElement("div");m.className="ntf-row";const u=document.createElement("div");u.className="ntf-ic",u.innerHTML=h[t]||h.inf;const d=document.createElement("div");d.className="ntf-body";const x=document.createElement("div");if(x.className="ntf-ttl",x.textContent=e,d.appendChild(x),n){const r=document.createElement("div");r.className="ntf-msg",r.textContent=n,d.appendChild(r)}const s=document.createElement("button");if(s.type="button",s.className="ntf-x",s.setAttribute("aria-label","Dismiss notification"),s.innerHTML='<i class="fas fa-xmark"></i>',s.addEventListener("click",()=>f(a)),m.append(u,d,s),a.appendChild(m),Array.isArray(p)&&p.length){const r=document.createElement("div");r.className="ntf-acts",p.forEach(o=>{const c=document.createElement("button");c.type="button",c.className=`ntf-btn ${o.p?"pri":"gho"}`,c.innerHTML=`${o.i?`<i class="${o.i}"></i> `:""}${o.l}`,c.addEventListener("click",()=>{typeof o.onClick=="function"&&o.onClick(),f(a)}),r.appendChild(c)}),a.appendChild(r)}if(v){const r=document.createElement("div");r.className="ntf-bar";const o=document.createElement("div");o.className="ntf-bar-f",o.style.animationDuration=`${l}ms`,r.appendChild(o),a.appendChild(r)}return E.appendChild(a),a._ntfTimer=setTimeout(()=>f(a),l),w&&(a.addEventListener("mouseenter",()=>{clearTimeout(a._ntfTimer);const r=a.querySelector(".ntf-bar-f");r&&(r.style.animationPlayState="paused")}),a.addEventListener("mouseleave",()=>{const r=a.querySelector(".ntf-bar-f");r&&(r.style.animationPlayState="running"),a._ntfTimer=setTimeout(()=>f(a),2500)})),a}var k={ok:"Success",err:"Error",warn:"Warning",inf:"Info"},z={success:(t,e="",n={})=>i({type:"ok",title:t,msg:e,...n}),ok:(t,e="",n={})=>i({type:"ok",title:t,msg:e,...n}),error:(t,e="",n={})=>i({type:"err",title:t,msg:e,...n}),err:(t,e="",n={})=>i({type:"err",title:t,msg:e,...n}),warning:(t,e="",n={})=>i({type:"warn",title:t,msg:e,...n}),warn:(t,e="",n={})=>i({type:"warn",title:t,msg:e,...n}),info:(t,e="",n={})=>i({type:"inf",title:t,msg:e,...n}),inf:(t,e="",n={})=>i({type:"inf",title:t,msg:e,...n}),custom:(t,e,n="",l={})=>i({type:t,title:e,msg:n,...l}),dismiss:f,dismissAll:N,demo(){["ok","err","warn","inf"].forEach((t,e)=>setTimeout(()=>i({type:t,title:k[t],msg:`This is the "${k[t]}" toast style.`}),e*200)),setTimeout(()=>i({type:"ok",title:"Item deleted",msg:"The record has been permanently removed.",dur:7e3,acts:[{l:"Undo",i:"fas fa-rotate-left",p:!0,onClick:()=>i({type:"ok",title:"Item restored",msg:"The record has been put back."})}]}),900)}};export{z as t};
