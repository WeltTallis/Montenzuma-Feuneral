import{r as T}from"./chunk-CXHxssQy.js";import{y as E}from"./chunk-CXAmgOhv.js";import{l as L}from"./chunk-DWc5g_hH.js";import{a as x,o as P}from"./chunk-CwzAxjA3.js";import{o as F}from"./chunk-BY9AVXEY.js";import{R as w,at as B,d as O,h as M,hn as y,it as A,y as D}from"./index-Cjz35ncq.js";import{t as R}from"./chunk-CtrK9VBE.js";var l=T(E(),1),e=F(),r=R,J=()=>(0,e.jsx)("span",{className:"spinner"}),q=({type:s,text:m})=>{if(!m)return null;const i={error:{bg:r.redBg,color:r.red,border:r.redLine,icon:M},success:{bg:r.successBg,color:r.success,border:"#DCE6D9",icon:w}},d=i[s]||i.error,n=d.icon;return(0,e.jsxs)("div",{className:"alert-message",style:{background:d.bg,color:d.color,borderColor:d.border},children:[(0,e.jsx)(n,{size:16}),(0,e.jsx)("span",{children:m})]})};function K(){const s=L(),{login:m}=O(),[i,d]=(0,l.useState)(""),[n,v]=(0,l.useState)(""),[f,j]=(0,l.useState)(!1),[c,b]=(0,l.useState)(!1),[p,g]=(0,l.useState)({type:"",text:""}),[k,S]=(0,l.useState)(!1),[N,$]=(0,l.useState)("");(0,l.useEffect)(()=>{const a=localStorage.getItem("authToken");let t=null,o={};try{o=JSON.parse(localStorage.getItem("user")||"{}"),t=o.branchSlug||null}catch{}if(t=t||localStorage.getItem("tenantSlug"),a&&a!=="undefined"&&a!=="null"&&t&&t!=="default"&&t!=="dashboard"){const u=o.role==="driver"?"driver-portal":"dashboard";s(`/tenant/${t}/${u}`)}else(!a||a==="undefined"||a==="null")&&(localStorage.removeItem("authToken"),localStorage.removeItem("tenantSlug"),localStorage.removeItem("user"),sessionStorage.removeItem("user"))},[s]);const z=i.trim().length>0&&n.length>=6,C=(0,l.useCallback)(async a=>{if(a.preventDefault(),!i.trim()||!n.trim()){g({type:"error",text:"Please enter your username/email and password."});return}b(!0),g({type:"",text:""});try{const t=await m({email:i.trim(),password:n.trim()});if(t&&t.success){x.success("Login successful! Welcome back.",{position:"top-right",autoClose:5e3,hideProgressBar:!1,closeOnClick:!0,pauseOnHover:!0,draggable:!0,progress:void 0,theme:"light"});const o=t.user||{},u=o.parentTenantSlug||t.tenant?.parentTenantSlug||t.tenant?.slug||o.tenantSlug,_=o.branchSlug||u;if(u)localStorage.setItem("tenantSlug",u),o.branchSlug&&localStorage.setItem("branchSlug",o.branchSlug),o.parentTenantSlug&&localStorage.setItem("parentTenantSlug",o.parentTenantSlug),$(o.fullName||o.username||"User"),S(!0),setTimeout(()=>{const I=o.role==="driver"?"driver-portal":"dashboard";s(`/tenant/${_}/${I}`,{replace:!0})},400);else throw new Error("No tenant information available")}else throw new Error(t?.message||"Login failed. Please check your credentials.")}catch(t){console.error("Login error:",t),x.error(t.message||"Connection error. Please try again.",{position:"top-right",autoClose:5e3,hideProgressBar:!1,closeOnClick:!0,pauseOnHover:!0,draggable:!0,progress:void 0,theme:"light"}),g({type:"error",text:t.message||"Connection error. Please try again."})}finally{b(!1)}},[i,n,s,m]),h=p.type==="error";return(0,e.jsxs)("div",{className:"page-wrapper",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${r.gray};background:${r.bone2};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${r.ink}}
        
        .page-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: ${r.bone2}; }
        
        /* Toast Container - Minimal padding */
        .Toastify__toast-container {
          width: 380px !important;
          max-width: 90vw !important;
          padding: 0 !important;
        }
        .Toastify__toast {
          border-radius: 8px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 0.85rem !important;
          padding: 10px 14px !important;
          min-height: 44px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          margin-bottom: 0.5rem !important;
        }
        .Toastify__toast-body {
          padding: 0 !important;
          margin: 0 !important;
          font-size: 0.85rem !important;
        }
        .Toastify__toast-icon {
          width: 18px !important;
          margin-right: 8px !important;
        }
        .Toastify__progress-bar {
          height: 2px !important;
        }
        .Toastify__close-button {
          padding: 2px !important;
          opacity: 0.5 !important;
          width: 20px !important;
        }
        .Toastify__close-button > svg {
          width: 14px !important;
          height: 14px !important;
        }
        
        /* Layout */
        .login-container { width: 100%; max-width: 920px; display: flex; background: ${r.white}; border-radius: 24px; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(21,23,26,0.12), 0 10px 20px rgba(21,23,26,0.04); min-height: 520px; }
        
        /* Sidebar */
        .login-sidebar { width: 380px; background: #000000; padding: 3rem 2.5rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; flex-shrink: 0; }
        .sidebar-grid-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
        .sidebar-glow { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 30%, rgba(61,79,71,0.3) 0%, transparent 60%); pointer-events: none; }
        .sidebar-content { position: relative; z-index: 1; color: ${r.bone}; height: 100%; display: flex; flex-direction: column; }
        .sidebar-logo { display: flex; align-items: center; gap: 0.7rem; font-family: 'Fraunces', serif; font-size: 1.3rem; color: ${r.bone}; margin-bottom: 3rem; }
        .sidebar-headline { font-family: 'Fraunces', serif; font-size: 1.8rem; line-height: 1.3; margin-bottom: 1rem; color: ${r.bone}; }
        .sidebar-text { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.6; }
        .sidebar-footer { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: rgba(255,255,255,0.3); letter-spacing: 0.05em; margin-top: auto; }
        
        /* Form */
        .login-form { flex: 1; padding: 3rem 3.5rem; display: flex; flex-direction: column; justify-content: center; }
        .form-header { margin-bottom: 2rem; }
        .form-header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
        .form-header p { font-size: 0.95rem; color: ${r.gray}; }
        
        .form-group { margin-bottom: 1.2rem; }
        .form-label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: ${r.brass}; margin-bottom: 0.5rem; font-weight: 500; }
        
        .input-wrapper { position: relative; border: 1px solid ${r.line}; border-radius: 8px; background: ${r.bone2}; transition: all 0.2s; }
        .input-wrapper.error { border-color: ${r.red}; }
        .input-wrapper:focus-within { border-color: ${r.brass}; background: ${r.white}; box-shadow: 0 0 0 3px rgba(139,115,85,0.12); }
        .form-input { width: 100%; padding: 0.85rem 1rem; background: transparent; border: none; border-radius: 8px; font-size: 0.9rem; color: ${r.ink}; font-family: 'Inter', sans-serif; outline: none; }
        .form-input::placeholder { color: ${r.gray}; }
        .input-icon-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${r.gray}; padding: 0.5rem; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .input-icon-btn:hover { color: ${r.ink}; }
        .form-error { display: block; color: ${r.red}; font-size: 0.75rem; margin-top: 0.3rem; }
        
        .alert-message { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.2rem; }
        
        /* Buttons */
        .btn-submit { width: 100%; padding: 0.9rem 1.2rem; font-size: 0.9rem; font-weight: 600; font-family: 'Inter', sans-serif; border: none; border-radius: 8px; background: ${r.ink}; color: ${r.bone}; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .btn-submit:hover { background: ${r.verdigris}; transform: translateY(-1px); box-shadow: 0 10px 20px rgba(21,23,26,0.15); }
        .btn-submit:disabled { background: ${r.gray}; cursor: not-allowed; opacity: 0.6; transform: none; box-shadow: none; }
        
        .form-links { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; }
        .text-link { background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; padding: 0.2rem; transition: color 0.2s; }
        .text-link.brass { color: ${r.brass}; }
        .text-link.brass:hover { color: ${r.brassLight}; }
        .text-link.verdigris { color: ${r.verdigris}; }
        .text-link.verdigris:hover { color: ${r.verdigrisDark}; }
        
        .form-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid ${r.line}; text-align: center; font-size: 0.8rem; color: ${r.gray}; }
        .encrypted-badge { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1rem; font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; color: ${r.gray}; opacity: 0.6; }
        
        /* Spinner & Animations */
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(250,248,244,0.3); border-top-color: ${r.bone}; border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        
        /* Success Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(21,23,26,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease both; }
        .modal-card { background: ${r.white}; border-radius: 16px; padding: 2.5rem 2rem; text-align: center; max-width: 360px; width: 90%; animation: popIn 0.4s cubic-bezier(0.16,1,0.3,1) both; box-shadow: 0 40px 80px rgba(21,23,26,0.3); }
        .modal-icon { width: 56px; height: 56px; border-radius: 50%; background: ${r.successBg}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: ${r.success}; }
        .modal-title { font-family: 'Fraunces', serif; font-size: 1.4rem; color: ${r.ink}; margin-bottom: 0.5rem; font-weight: 500; }
        .modal-text { font-size: 0.9rem; color: ${r.gray}; margin-bottom: 1.5rem; }
        .modal-progress { width: 60%; height: 4px; background: ${r.line}; border-radius: 2px; margin: 0 auto; overflow: hidden; }
        .modal-progress-bar { width: 100%; height: 100%; background: ${r.verdigris}; border-radius: 2px; animation: shimmer 1.2s ease infinite; background-size: 200% 100%; }
        
        /* Responsive */
        @media (max-width: 768px) {
          .login-container { flex-direction: column; max-width: 820px; }
          .login-sidebar { width: 100%; padding: 2rem; min-height: auto; }
          .sidebar-logo { margin-bottom: 1.5rem; }
          .sidebar-headline { font-size: 1.4rem; }
          .login-form { padding: 2.5rem 2rem; }
          .Toastify__toast-container { width: 320px !important; }
        }
        @media (max-width: 480px) {
          .page-wrapper { padding: 0; }
          .login-container { border-radius: 0; min-height: 100vh; }
          .login-sidebar { padding: 1.5rem; }
          .sidebar-headline { display: none; }
          .sidebar-text { display: none; }
          .login-form { padding: 2rem 1.5rem; }
          .Toastify__toast-container { width: 280px !important; }
          .Toastify__toast { padding: 8px 12px !important; font-size: 0.8rem !important; min-height: 38px !important; }
        }
      `}),(0,e.jsx)(P,{position:"top-right",autoClose:5e3,hideProgressBar:!1,newestOnTop:!0,closeOnClick:!0,rtl:!1,pauseOnFocusLoss:!0,draggable:!0,pauseOnHover:!0,theme:"light",limit:3}),(0,e.jsxs)("div",{className:"login-container",children:[(0,e.jsxs)("div",{className:"login-sidebar",children:[(0,e.jsx)("div",{className:"sidebar-grid-bg"}),(0,e.jsx)("div",{className:"sidebar-glow"}),(0,e.jsxs)("div",{className:"sidebar-content",children:[(0,e.jsxs)("div",{className:"sidebar-logo",children:[(0,e.jsx)(y,{size:28,color:r.brassLight}),"Rest Point"]}),(0,e.jsxs)("div",{children:[(0,e.jsxs)("h2",{className:"sidebar-headline",children:["Dignified care, ",(0,e.jsx)("br",{})," perfectly managed."]}),(0,e.jsx)("p",{className:"sidebar-text",children:"Sign in to access your funeral home registry and continue serving families with excellence."})]}),(0,e.jsx)("div",{className:"sidebar-footer",children:"WELT TALLIS TECHNOLOGIES"})]})]}),(0,e.jsxs)("div",{className:"login-form",children:[(0,e.jsxs)("div",{className:"form-header",children:[(0,e.jsx)("h1",{children:"Sign in to the registry"}),(0,e.jsx)("p",{children:"Enter your credentials to access your dashboard."})]}),(0,e.jsxs)("form",{onSubmit:C,children:[(0,e.jsx)(q,{type:p.type,text:p.text}),(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsx)("label",{className:"form-label",children:"Username or Email"}),(0,e.jsx)("div",{className:`input-wrapper ${h&&!i?"error":""}`,children:(0,e.jsx)("input",{type:"text",value:i,onChange:a=>{d(a.target.value),p.text&&g({type:"",text:""})},placeholder:"Enter your username or email",disabled:c,autoFocus:!0,autoComplete:"username",className:"form-input"})}),h&&!i&&(0,e.jsx)("span",{className:"form-error",children:"Username or email is required."})]}),(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsx)("label",{className:"form-label",children:"Password"}),(0,e.jsxs)("div",{className:`input-wrapper ${h&&!n?"error":""}`,children:[(0,e.jsx)("input",{type:f?"text":"password",value:n,onChange:a=>{v(a.target.value),p.text&&g({type:"",text:""})},placeholder:"Enter your password",disabled:c,autoComplete:"current-password",className:"form-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>j(!f),disabled:c,className:"input-icon-btn",children:f?(0,e.jsx)(B,{size:16}):(0,e.jsx)(A,{size:16})})]}),h&&!n&&(0,e.jsx)("span",{className:"form-error",children:"Password is required."})]}),(0,e.jsx)("button",{type:"submit",disabled:c||!z,className:"btn-submit",children:c?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(J,{}),(0,e.jsx)("span",{children:"Signing in..."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{children:"Sign in"}),(0,e.jsx)(D,{size:16})]})})]}),(0,e.jsxs)("div",{className:"form-links",children:[(0,e.jsx)("button",{onClick:()=>s("/forgot-password"),className:"text-link brass",children:"Forgot password?"}),(0,e.jsx)("button",{onClick:()=>s("/change-password"),className:"text-link verdigris",children:"Change password"})]}),(0,e.jsxs)("div",{className:"form-footer",children:[(0,e.jsxs)("span",{children:["Family member? ",(0,e.jsx)("button",{onClick:()=>s("/portal/login"),className:"text-link verdigris",style:{fontWeight:600,textDecoration:"underline"},children:"Access family portal"})]}),(0,e.jsxs)("div",{className:"encrypted-badge",children:[(0,e.jsx)(y,{size:12}),(0,e.jsx)("span",{children:"Encrypted connection"}),(0,e.jsx)("span",{style:{opacity:.3},children:"·"}),(0,e.jsx)("span",{children:"© 2026 Rest Point"})]})]})]})]}),k&&(0,e.jsx)("div",{className:"modal-overlay",children:(0,e.jsxs)("div",{className:"modal-card",children:[(0,e.jsx)("div",{className:"modal-icon",children:(0,e.jsx)(w,{size:28})}),(0,e.jsxs)("h3",{className:"modal-title",children:["Welcome, ",N]}),(0,e.jsx)("p",{className:"modal-text",children:"Redirecting to your dashboard..."}),(0,e.jsx)("div",{className:"modal-progress",children:(0,e.jsx)("div",{className:"modal-progress-bar"})})]})})]})}export{K as default};
