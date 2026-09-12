import{r as B}from"./chunk-CXHxssQy.js";import{y as L}from"./chunk-CXAmgOhv.js";import{l as A}from"./chunk-DWc5g_hH.js";import{o as D}from"./chunk-BY9AVXEY.js";import{Ot as M,R as v,_ as I,_n as R,at as w,d as _,i as T,in as J,it as j,m as O}from"./index-CivMjfxx.js";import"./chunk-FQ1nb9b-.js";var o=B(L(),1),e=D(),r={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",red:"#9B4A3F",redBg:"#F7ECE9",redLine:"#E8D2CC",success:"#475A43",successBg:"#EEF3EC",white:"#FFFFFF"},U=({size:i=28,color:t=r.verdigris})=>(0,e.jsxs)("svg",{width:i,height:i,viewBox:"0 0 32 32",fill:"none",style:{flexShrink:0},children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:t,strokeWidth:"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:t,strokeWidth:"1.5",strokeLinecap:"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:t})]}),Y=()=>(0,e.jsx)("span",{className:"cp-spinner"}),W=({type:i,text:t})=>{if(!t)return null;const n={error:{bg:r.redBg,color:r.red,border:r.redLine,icon:O},success:{bg:r.successBg,color:r.success,border:"#DCE6D9",icon:v}},a=n[i]||n.error,l=a.icon;return(0,e.jsxs)("div",{className:"cp-alert",style:{background:a.bg,color:a.color,borderColor:a.border},children:[(0,e.jsx)(l,{size:16}),(0,e.jsx)("span",{children:t})]})},G=({password:i})=>{if(!i)return null;const t=[{label:"At least 6 characters",met:i.length>=6},{label:"Contains a number",met:/\d/.test(i)},{label:"Contains uppercase letter",met:/[A-Z]/.test(i)},{label:"Contains special character",met:/[^A-Za-z0-9]/.test(i)}],n=t.filter(s=>s.met).length,a=["","Weak","Fair","Good","Strong"],l=["",r.red,"#B8860B",r.brass,r.success];return(0,e.jsxs)("div",{className:"cp-strength",children:[(0,e.jsxs)("div",{className:"cp-strength-header",children:[(0,e.jsx)("span",{className:"cp-strength-label",children:"Password strength"}),(0,e.jsx)("span",{className:"cp-strength-value",style:{color:l[n]},children:a[n]})]}),(0,e.jsx)("div",{className:"cp-strength-bars",children:[1,2,3,4].map(s=>(0,e.jsx)("div",{className:"cp-strength-bar",style:{background:s<=n?l[n]:r.line}},s))}),(0,e.jsx)("div",{className:"cp-strength-checks",children:t.map((s,m)=>(0,e.jsxs)("div",{className:`cp-strength-check ${s.met?"met":""}`,children:[s.met?(0,e.jsx)(v,{size:13}):(0,e.jsx)("div",{className:"cp-check-dot"}),(0,e.jsx)("span",{children:s.label})]},m))})]})};function ee(){const i=A(),[t,n]=(0,o.useState)(""),[a,l]=(0,o.useState)(""),[s,m]=(0,o.useState)(""),[h,$]=(0,o.useState)(!1),[b,C]=(0,o.useState)(!1),[x,z]=(0,o.useState)(!1),[p,k]=(0,o.useState)(!1),[u,d]=(0,o.useState)({type:"",text:""}),[S,N]=(0,o.useState)(!1),[F,H]=(0,o.useState)(()=>{try{const c=localStorage.getItem("user");return c&&JSON.parse(c).email||""}catch{return""}}),f=()=>{u.text&&d({type:"",text:""})},E=()=>t?a.length<6?(d({type:"error",text:"New password must be at least 6 characters."}),!1):a===t?(d({type:"error",text:"New password must be different from your current password."}),!1):a!==s?(d({type:"error",text:"Passwords do not match."}),!1):!0:(d({type:"error",text:"Please enter your current password."}),!1),P=(0,o.useCallback)(async c=>{if(c.preventDefault(),!!E()){k(!0),d({type:"",text:""});try{const g=await T.post(_.AUTH.CHANGE_PASSWORD,{email:F,currentPassword:t,newPassword:a,confirmPassword:s});g.data?.success?(N(!0),setTimeout(()=>{N(!1),n(""),l(""),m(""),i(-1)},2200)):d({type:"error",text:g.data?.message||"Could not change your password."})}catch(g){const y=g.response?.data?.message;y?.toLowerCase().includes("current")||y?.toLowerCase().includes("incorrect")?d({type:"error",text:"Current password is incorrect."}):d({type:"error",text:y||"Something went wrong. Please try again."})}finally{k(!1)}}},[t,a,s,i]);return(0,e.jsxs)("div",{className:"cp-page-wrapper",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${r.gray};background:${r.bone2};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${r.ink}}

        .cp-page-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1.5rem; background:${r.bone2}; }

        .cp-container { width:100%; max-width:920px; display:flex; background:${r.white}; border-radius:24px; overflow:hidden; box-shadow:0 40px 80px -20px rgba(21,23,26,0.12), 0 10px 20px rgba(21,23,26,0.04); min-height:580px; }

        /* Sidebar */
        .cp-sidebar { width:380px; background:#000000; padding:3rem 2.5rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; flex-shrink:0; }
        .cp-sidebar-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
        .cp-sidebar-glow { position:absolute; inset:0; background:radial-gradient(circle at 70% 60%,rgba(139,115,85,0.15) 0%,transparent 60%); pointer-events:none; }
        .cp-sidebar-inner { position:relative; z-index:1; color:${r.bone}; height:100%; display:flex; flex-direction:column; }
        .cp-sidebar-logo { display:flex; align-items:center; gap:0.7rem; font-family:'Fraunces',serif; font-size:1.3rem; color:${r.bone}; margin-bottom:3rem; cursor:pointer; transition:opacity .2s; }
        .cp-sidebar-logo:hover { opacity:0.8; }

        .cp-sidebar-icon-wrap { width:48px; height:48px; border-radius:12px; background:rgba(139,115,85,0.12); border:1px solid rgba(139,115,85,0.2); display:flex; align-items:center; justify-content:center; margin-bottom:1.5rem; color:${r.brassLight}; }
        .cp-sidebar-headline { font-family:'Fraunces',serif; font-size:1.8rem; line-height:1.3; margin-bottom:1rem; color:${r.bone}; }
        .cp-sidebar-text { font-size:0.9rem; color:rgba(255,255,255,0.6); line-height:1.6; margin-bottom:0.6rem; }

        .cp-sidebar-tips { margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.08); }
        .cp-sidebar-tips-title { font-family:'JetBrains Mono',monospace; font-size:0.65rem; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:1rem; }
        .cp-sidebar-tip { display:flex; align-items:flex-start; gap:0.6rem; margin-bottom:0.75rem; font-size:0.82rem; color:rgba(255,255,255,0.55); line-height:1.5; }
        .cp-sidebar-tip-dot { width:5px; height:5px; border-radius:50%; background:${r.brassLight}; margin-top:0.4rem; flex-shrink:0; opacity:0.6; }

        .cp-sidebar-footer { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:rgba(255,255,255,0.3); letter-spacing:0.05em; margin-top:auto; padding-top:2rem; }

        /* Form */
        .cp-form { flex:1; padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; }
        .cp-form-header { margin-bottom:1.8rem; }
        .cp-form-header h1 { font-size:1.8rem; margin-bottom:0.4rem; }
        .cp-form-header p { font-size:0.92rem; color:${r.gray}; line-height:1.5; }

        .cp-form-group { margin-bottom:1.1rem; }
        .cp-form-label { display:block; font-family:'JetBrains Mono',monospace; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:${r.brass}; margin-bottom:0.5rem; font-weight:500; }
        .cp-form-hint { font-size:0.75rem; color:${r.gray}; margin-top:0.35rem; opacity:0.7; }

        .cp-input-wrap { position:relative; border:1px solid ${r.line}; border-radius:8px; background:${r.bone2}; transition:all .2s; }
        .cp-input-wrap:focus-within { border-color:${r.brass}; background:${r.white}; box-shadow:0 0 0 3px rgba(139,115,85,0.12); }
        .cp-input-wrap.has-error { border-color:${r.red}; }
        .cp-input-wrap.has-error:focus-within { box-shadow:0 0 0 3px rgba(155,74,63,0.1); }
        .cp-input { width:100%; padding:0.85rem 1rem; background:transparent; border:none; border-radius:8px; font-size:0.9rem; color:${r.ink}; font-family:'Inter',sans-serif; outline:none; }
        .cp-input::placeholder { color:${r.gray}; opacity:0.7; }
        .cp-input-icon-btn { position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:${r.gray}; padding:0.5rem; display:flex; align-items:center; justify-content:center; transition:color .2s; border-radius:4px; }
        .cp-input-icon-btn:hover { color:${r.ink}; background:rgba(0,0,0,0.04); }

        .cp-alert { display:flex; align-items:center; gap:0.6rem; padding:0.8rem 1rem; border-radius:8px; border:1px solid; font-size:0.85rem; font-weight:500; margin-bottom:1.2rem; animation:cpFadeUp .35s cubic-bezier(0.16,1,0.3,1) both; }

        /* Password strength */
        .cp-strength { margin-top:0.5rem; margin-bottom:0.3rem; }
        .cp-strength-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem; }
        .cp-strength-label { font-size:0.72rem; color:${r.gray}; }
        .cp-strength-value { font-family:'JetBrains Mono',monospace; font-size:0.68rem; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; }
        .cp-strength-bars { display:flex; gap:4px; margin-bottom:0.7rem; }
        .cp-strength-bar { height:3px; flex:1; border-radius:2px; transition:background .3s ease; }
        .cp-strength-checks { display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 1rem; }
        .cp-strength-check { display:flex; align-items:center; gap:0.4rem; font-size:0.72rem; color:${r.gray}; opacity:0.5; transition:all .25s ease; }
        .cp-strength-check.met { opacity:1; color:${r.success}; }
        .cp-check-dot { width:13px; height:13px; border-radius:50%; border:1.5px solid ${r.line}; flex-shrink:0; }

        /* Divider */
        .cp-divider { display:flex; align-items:center; gap:1rem; margin:1.3rem 0; }
        .cp-divider-line { flex:1; height:1px; background:${r.line}; }
        .cp-divider-text { font-family:'JetBrains Mono',monospace; font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; color:${r.gray}; opacity:0.5; white-space:nowrap; }

        /* Buttons */
        .cp-btn-primary { width:100%; padding:0.9rem 1.2rem; font-size:0.9rem; font-weight:600; font-family:'Inter',sans-serif; border:none; border-radius:8px; background:${r.ink}; color:${r.bone}; cursor:pointer; transition:all .3s ease; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .cp-btn-primary:hover:not(:disabled) { background:${r.verdigris}; transform:translateY(-1px); box-shadow:0 10px 20px rgba(21,23,26,0.15); }
        .cp-btn-primary:active:not(:disabled) { transform:translateY(0); }
        .cp-btn-primary:disabled { background:${r.gray}; cursor:not-allowed; opacity:0.5; transform:none; box-shadow:none; }

        .cp-btn-ghost { background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:500; padding:0.4rem 0; display:inline-flex; align-items:center; gap:0.35rem; transition:color .2s; }
        .cp-btn-ghost.brass { color:${r.brass}; }
        .cp-btn-ghost.brass:hover { color:${r.brassLight}; }
        .cp-btn-ghost.verdigris { color:${r.verdigris}; }
        .cp-btn-ghost.verdigris:hover { color:${r.verdigrisDark}; }

        .cp-form-footer { margin-top:2rem; padding-top:1.5rem; border-top:1px solid ${r.line}; text-align:center; }
        .cp-encrypted-badge { display:flex; align-items:center; justify-content:center; gap:0.4rem; margin-top:0.8rem; font-size:0.7rem; font-family:'JetBrains Mono',monospace; color:${r.gray}; opacity:0.6; }

        .cp-spinner { width:16px; height:16px; border:2px solid rgba(250,248,244,0.3); border-top-color:${r.bone}; border-radius:50%; animation:cpSpin .65s linear infinite; display:inline-block; }

        /* Success modal */
        .cp-modal-overlay { position:fixed; inset:0; background:rgba(21,23,26,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; animation:cpFadeIn .3s ease both; }
        .cp-modal-card { background:${r.white}; border-radius:16px; padding:2.5rem 2rem; text-align:center; max-width:380px; width:90%; animation:cpPopIn .4s cubic-bezier(0.16,1,0.3,1) both; box-shadow:0 40px 80px rgba(21,23,26,0.3); }
        .cp-modal-icon { width:56px; height:56px; border-radius:50%; background:${r.successBg}; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; color:${r.success}; }
        .cp-modal-title { font-family:'Fraunces',serif; font-size:1.4rem; color:${r.ink}; margin-bottom:0.5rem; font-weight:500; }
        .cp-modal-text { font-size:0.9rem; color:${r.gray}; margin-bottom:1.5rem; }
        .cp-modal-progress { width:60%; height:4px; background:${r.line}; border-radius:2px; margin:0 auto; overflow:hidden; }
        .cp-modal-progress-bar { width:100%; height:100%; background:${r.verdigris}; border-radius:2px; animation:cpShimmer 1.2s ease infinite; background-size:200% 100%; background-image:linear-gradient(90deg,${r.verdigris} 0%,${r.verdigrisLight} 50%,${r.verdigris} 100%); }

        /* Animations */
        @keyframes cpSpin { to { transform:rotate(360deg); } }
        @keyframes cpFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cpFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes cpPopIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes cpShimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }

        /* Responsive */
        @media (max-width:768px) {
          .cp-container { flex-direction:column; max-width:440px; }
          .cp-sidebar { width:100%; padding:2rem; min-height:auto; }
          .cp-sidebar-logo { margin-bottom:1.5rem; }
          .cp-sidebar-headline { font-size:1.4rem; }
          .cp-sidebar-tips { display:none; }
          .cp-form { padding:2.5rem 2rem; }
          .cp-strength-checks { grid-template-columns:1fr; }
        }
        @media (max-width:480px) {
          .cp-page-wrapper { padding:0; }
          .cp-container { border-radius:0; min-height:100vh; }
          .cp-sidebar { padding:1.5rem; }
          .cp-sidebar-headline { display:none; }
          .cp-sidebar-text { display:none; }
          .cp-sidebar-icon-wrap { display:none; }
          .cp-form { padding:2rem 1.5rem; }
        }
      `}),(0,e.jsxs)("div",{className:"cp-container",children:[(0,e.jsxs)("div",{className:"cp-sidebar",children:[(0,e.jsx)("div",{className:"cp-sidebar-grid"}),(0,e.jsx)("div",{className:"cp-sidebar-glow"}),(0,e.jsxs)("div",{className:"cp-sidebar-inner",children:[(0,e.jsxs)("div",{className:"cp-sidebar-logo",onClick:()=>i("/"),children:[(0,e.jsx)(U,{size:28,color:r.brassLight}),"Rest Point"]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{className:"cp-sidebar-icon-wrap",children:(0,e.jsx)(M,{size:22})}),(0,e.jsx)("h2",{className:"cp-sidebar-headline",children:"Update your credentials."}),(0,e.jsx)("p",{className:"cp-sidebar-text",children:"Regularly changing your password is one of the simplest ways to keep your account secure."})]}),(0,e.jsxs)("div",{className:"cp-sidebar-tips",children:[(0,e.jsx)("div",{className:"cp-sidebar-tips-title",children:"Security tips"}),(0,e.jsxs)("div",{className:"cp-sidebar-tip",children:[(0,e.jsx)("div",{className:"cp-sidebar-tip-dot"}),(0,e.jsx)("span",{children:"Use a unique password you don't use elsewhere"})]}),(0,e.jsxs)("div",{className:"cp-sidebar-tip",children:[(0,e.jsx)("div",{className:"cp-sidebar-tip-dot"}),(0,e.jsx)("span",{children:"Mix uppercase, numbers, and symbols"})]}),(0,e.jsxs)("div",{className:"cp-sidebar-tip",children:[(0,e.jsx)("div",{className:"cp-sidebar-tip-dot"}),(0,e.jsx)("span",{children:"Avoid personal info like names or dates"})]}),(0,e.jsxs)("div",{className:"cp-sidebar-tip",children:[(0,e.jsx)("div",{className:"cp-sidebar-tip-dot"}),(0,e.jsx)("span",{children:"Consider a password manager for storage"})]})]}),(0,e.jsx)("div",{className:"cp-sidebar-footer",children:"WELT TALLIS TECHNOLOGIES"})]})]}),(0,e.jsxs)("div",{className:"cp-form",children:[(0,e.jsxs)("div",{className:"cp-form-header",children:[(0,e.jsx)("h1",{children:"Change password"}),(0,e.jsx)("p",{children:"Enter your current password, then choose a new one."})]}),(0,e.jsxs)("form",{onSubmit:P,children:[(0,e.jsx)(W,{type:u.type,text:u.text}),(0,e.jsxs)("div",{className:"cp-form-group",children:[(0,e.jsx)("label",{className:"cp-form-label",children:"Current password"}),(0,e.jsxs)("div",{className:"cp-input-wrap",children:[(0,e.jsx)("input",{type:h?"text":"password",value:t,onChange:c=>{n(c.target.value),f()},placeholder:"Enter your current password",disabled:p,autoComplete:"current-password",className:"cp-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>$(!h),disabled:p,className:"cp-input-icon-btn",children:h?(0,e.jsx)(w,{size:16}):(0,e.jsx)(j,{size:16})})]})]}),(0,e.jsxs)("div",{className:"cp-divider",children:[(0,e.jsx)("div",{className:"cp-divider-line"}),(0,e.jsx)("span",{className:"cp-divider-text",children:"New password"}),(0,e.jsx)("div",{className:"cp-divider-line"})]}),(0,e.jsxs)("div",{className:"cp-form-group",children:[(0,e.jsx)("label",{className:"cp-form-label",children:"New password"}),(0,e.jsxs)("div",{className:"cp-input-wrap",children:[(0,e.jsx)("input",{type:b?"text":"password",value:a,onChange:c=>{l(c.target.value),f()},placeholder:"Create a strong password",disabled:p,autoComplete:"new-password",className:"cp-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>C(!b),disabled:p,className:"cp-input-icon-btn",children:b?(0,e.jsx)(w,{size:16}):(0,e.jsx)(j,{size:16})})]}),(0,e.jsx)(G,{password:a})]}),(0,e.jsxs)("div",{className:"cp-form-group",style:{marginTop:"0.3rem"},children:[(0,e.jsx)("label",{className:"cp-form-label",children:"Confirm new password"}),(0,e.jsxs)("div",{className:`cp-input-wrap ${s&&s!==a?"has-error":""}`,children:[(0,e.jsx)("input",{type:x?"text":"password",value:s,onChange:c=>{m(c.target.value),f()},placeholder:"Repeat your new password",disabled:p,autoComplete:"new-password",className:"cp-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>z(!x),disabled:p,className:"cp-input-icon-btn",children:x?(0,e.jsx)(w,{size:16}):(0,e.jsx)(j,{size:16})})]}),s&&s!==a&&(0,e.jsx)("span",{className:"cp-form-hint",style:{color:r.red,opacity:1},children:"Passwords do not match"})]}),(0,e.jsx)("button",{type:"submit",disabled:p||!t||!a||!s,className:"cp-btn-primary",style:{marginTop:"1.4rem"},children:p?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Y,{}),(0,e.jsx)("span",{children:"Updating password..."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(J,{size:16}),(0,e.jsx)("span",{children:"Update password"})]})})]}),(0,e.jsxs)("div",{className:"cp-form-footer",children:[(0,e.jsxs)("button",{onClick:()=>i(-1),className:"cp-btn-ghost verdigris",style:{fontWeight:500,fontSize:"0.88rem"},children:[(0,e.jsx)(I,{size:14})," Go back"]}),(0,e.jsxs)("div",{className:"cp-encrypted-badge",children:[(0,e.jsx)(R,{size:12}),(0,e.jsx)("span",{children:"End-to-end encrypted"}),(0,e.jsx)("span",{style:{opacity:.3},children:"·"}),(0,e.jsx)("span",{children:"© 2026 Rest Point"})]})]})]})]}),S&&(0,e.jsx)("div",{className:"cp-modal-overlay",children:(0,e.jsxs)("div",{className:"cp-modal-card",children:[(0,e.jsx)("div",{className:"cp-modal-icon",children:(0,e.jsx)(v,{size:28})}),(0,e.jsx)("h3",{className:"cp-modal-title",children:"Password updated"}),(0,e.jsx)("p",{className:"cp-modal-text",children:"Your password has been changed successfully. You may need to sign in again on other devices."}),(0,e.jsx)("div",{className:"cp-modal-progress",children:(0,e.jsx)("div",{className:"cp-modal-progress-bar"})})]})})]})}export{ee as default};
