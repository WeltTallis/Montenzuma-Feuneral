import{r as H}from"./chunk-CXHxssQy.js";import{y as G}from"./chunk-CXAmgOhv.js";import{l as q}from"./chunk-DWc5g_hH.js";import{o as K}from"./chunk-BY9AVXEY.js";import{I as A,R as Q,at as D,f as w,h as X,hn as Z,i as v,it as P,v as B,y as k}from"./index-D6gguvjv.js";import"./chunk-Dz5RcEYL.js";var p=H(G(),1),e=K(),r={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",red:"#9B4A3F",redBg:"#F7ECE9",redLine:"#E8D2CC",success:"#475A43",successBg:"#EEF3EC",white:"#FFFFFF"},ee=({size:c=28,color:n=r.verdigris})=>(0,e.jsxs)("svg",{width:c,height:c,viewBox:"0 0 32 32",fill:"none",style:{flexShrink:0},children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:n,strokeWidth:"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:n,strokeWidth:"1.5",strokeLinecap:"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:n})]}),N=()=>(0,e.jsx)("span",{className:"fp-spinner"}),C=({type:c,text:n})=>{if(!n)return null;const d={error:{bg:r.redBg,color:r.red,border:r.redLine,icon:X},success:{bg:r.successBg,color:r.success,border:"#DCE6D9",icon:Q}},f=d[c]||d.error,g=f.icon;return(0,e.jsxs)("div",{className:"fp-alert",style:{background:f.bg,color:f.color,borderColor:f.border},children:[(0,e.jsx)(g,{size:16}),(0,e.jsx)("span",{children:n})]})},re=({number:c,label:n,active:d,done:f})=>(0,e.jsxs)("div",{className:`fp-step-pill ${d?"active":""} ${f?"done":""}`,children:[(0,e.jsx)("span",{className:"fp-step-num",children:f?(0,e.jsx)(A,{size:12,strokeWidth:3}):c}),(0,e.jsx)("span",{className:"fp-step-label",children:n})]}),R=[{n:1,label:"Email"},{n:2,label:"Code"},{n:3,label:"Password"}],de=()=>{const c=q(),n=(0,p.useRef)([]),[d,f]=(0,p.useState)(""),[g,u]=(0,p.useState)(["","","","","",""]),[h,L]=(0,p.useState)(""),[$,I]=(0,p.useState)(""),[i,x]=(0,p.useState)(1),[l,b]=(0,p.useState)(!1),[m,a]=(0,p.useState)({type:"",text:""}),[y,T]=(0,p.useState)(!1),[j,M]=(0,p.useState)(!1);(0,p.useEffect)(()=>{i===2&&setTimeout(()=>n.current[0]?.focus(),100)},[i]);const F=async s=>{if(s.preventDefault(),!d.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d)){a({type:"error",text:"Please enter a valid email address."});return}b(!0),a({type:"",text:""});try{const t=await v.post(w.AUTH.FORGOT_PASSWORD,{email:d.trim()});t.data?.success?(a({type:"success",text:"Verification code sent to your email."}),setTimeout(()=>{x(2),a({type:"",text:""})},900)):a({type:"error",text:t.data?.message||"Could not send the code."})}catch(t){a({type:"error",text:t.response?.data?.message||"Could not send the code. Please try again."})}finally{b(!1)}},_=(s,t)=>{if(t.length>1)return;const o=[...g];o[s]=t.replace(/\D/g,""),u(o),t&&s<5&&n.current[s+1]?.focus()},W=(s,t)=>{t.key==="Backspace"&&!g[s]&&s>0&&n.current[s-1]?.focus()},O=s=>{s.preventDefault();const t=s.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(t.length===0)return;const o=[...g];t.split("").forEach((V,E)=>{E<6&&(o[E]=V)}),u(o);const U=Math.min(t.length,5);n.current[U]?.focus()},J=async s=>{s.preventDefault();const t=g.join("");if(t.length!==6){a({type:"error",text:"Please enter the full 6-digit code."});return}b(!0),a({type:"",text:""});try{const o=await v.post(w.AUTH.VERIFY_CODE,{email:d.trim(),code:t});o.data?.success?(a({type:"success",text:"Code verified successfully."}),setTimeout(()=>{x(3),a({type:"",text:""})},900)):a({type:"error",text:o.data?.message||"That code did not match."})}catch(o){a({type:"error",text:o.response?.data?.message||"Could not verify that code."})}finally{b(!1)}},Y=async s=>{if(s.preventDefault(),h.length<6){a({type:"error",text:"Password must be at least 6 characters."});return}if(h!==$){a({type:"error",text:"Passwords do not match."});return}b(!0),a({type:"",text:""});try{const t=await v.post(w.AUTH.RESET_PASSWORD,{email:d.trim(),code:g.join(""),password:h});t.data?.success?(a({type:"success",text:"Password reset successfully. Redirecting to sign in..."}),setTimeout(()=>c("/login"),1800)):a({type:"error",text:t.data?.message||"Could not reset your password."})}catch(t){a({type:"error",text:t.response?.data?.message||"Could not reset your password."})}finally{b(!1)}},S=()=>{i===2?(x(1),u(["","","","","",""])):i===3&&x(2),a({type:"",text:""})},z={1:{headline:"Don't worry, it happens.",text:"We'll send a secure verification code to your email so you can reset your password and get back to what matters."},2:{headline:"Check your inbox.",text:"Enter the 6-digit code we sent. It expires in 10 minutes for your security."},3:{headline:"Almost there.",text:"Choose a strong new password. We recommend at least 8 characters with a mix of letters and numbers."}};return(0,e.jsxs)("div",{className:"fp-page-wrapper",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${r.gray};background:${r.bone2};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${r.ink}}

        .fp-page-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1.5rem; background:${r.bone2}; }

        /* Layout */
        .fp-container { width:100%; max-width:920px; display:flex; background:${r.white}; border-radius:24px; overflow:hidden; box-shadow:0 40px 80px -20px rgba(21,23,26,0.12), 0 10px 20px rgba(21,23,26,0.04); min-height:560px; }

        /* Sidebar */
        .fp-sidebar { width:380px; background:#000000; padding:3rem 2.5rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; flex-shrink:0; }
        .fp-sidebar-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
        .fp-sidebar-glow { position:absolute; inset:0; background:radial-gradient(circle at 30% 40%,rgba(61,79,71,0.3) 0%,transparent 60%); pointer-events:none; }
        .fp-sidebar-inner { position:relative; z-index:1; color:${r.bone}; height:100%; display:flex; flex-direction:column; }
        .fp-sidebar-logo { display:flex; align-items:center; gap:0.7rem; font-family:'Fraunces',serif; font-size:1.3rem; color:${r.bone}; margin-bottom:3rem; cursor:pointer; transition:opacity .2s; }
        .fp-sidebar-logo:hover { opacity:0.8; }
        .fp-sidebar-headline { font-family:'Fraunces',serif; font-size:1.8rem; line-height:1.3; margin-bottom:1rem; color:${r.bone}; }
        .fp-sidebar-text { font-size:0.9rem; color:rgba(255,255,255,0.6); line-height:1.6; }
        .fp-sidebar-footer { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:rgba(255,255,255,0.3); letter-spacing:0.05em; margin-top:auto; padding-top:2rem; }

        /* Steps in sidebar */
        .fp-sidebar-steps { display:flex; flex-direction:column; gap:0.6rem; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.08); }
        .fp-sidebar-step { display:flex; align-items:center; gap:0.75rem; font-size:0.82rem; color:rgba(255,255,255,0.35); transition:all .3s ease; }
        .fp-sidebar-step.active { color:${r.bone}; }
        .fp-sidebar-step.done { color:rgba(255,255,255,0.7); }
        .fp-sidebar-step-num { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:0.65rem; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); flex-shrink:0; transition:all .3s ease; }
        .fp-sidebar-step.active .fp-sidebar-step-num { background:rgba(139,115,85,0.2); border-color:rgba(139,115,85,0.4); color:${r.brassLight}; }
        .fp-sidebar-step.done .fp-sidebar-step-num { background:rgba(71,90,67,0.3); border-color:rgba(71,90,67,0.5); color:#8CB88C; }

        /* Form area */
        .fp-form { flex:1; padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; }

        /* Step pills (top) */
        .fp-steps-row { display:flex; gap:0.5rem; margin-bottom:2rem; }
        .fp-step-pill { display:flex; align-items:center; gap:0.5rem; padding:0.45rem 0.85rem; border-radius:8px; border:1px solid ${r.line}; background:${r.bone2}; font-size:0.78rem; color:${r.gray}; transition:all .3s ease; }
        .fp-step-pill.active { border-color:${r.brass}; background:rgba(139,115,85,0.06); color:${r.brass}; }
        .fp-step-pill.done { border-color:#C5D4C1; background:${r.successBg}; color:${r.success}; }
        .fp-step-num { display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:5px; background:rgba(0,0,0,0.04); font-family:'JetBrains Mono',monospace; font-size:0.6rem; font-weight:500; }
        .fp-step-pill.active .fp-step-num { background:${r.brass}; color:${r.white}; }
        .fp-step-pill.done .fp-step-num { background:${r.success}; color:${r.white}; }

        /* Form header */
        .fp-form-header { margin-bottom:1.5rem; }
        .fp-form-header h1 { font-size:1.8rem; margin-bottom:0.4rem; }
        .fp-form-header p { font-size:0.92rem; color:${r.gray}; line-height:1.5; }
        .fp-form-header p span { color:${r.ink}; font-weight:500; }

        /* Form elements */
        .fp-form-group { margin-bottom:1.2rem; }
        .fp-form-label { display:block; font-family:'JetBrains Mono',monospace; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:${r.brass}; margin-bottom:0.5rem; font-weight:500; }
        .fp-input-wrap { position:relative; border:1px solid ${r.line}; border-radius:8px; background:${r.bone2}; transition:all .2s; }
        .fp-input-wrap:focus-within { border-color:${r.brass}; background:${r.white}; box-shadow:0 0 0 3px rgba(139,115,85,0.12); }
        .fp-input { width:100%; padding:0.85rem 1rem; background:transparent; border:none; border-radius:8px; font-size:0.9rem; color:${r.ink}; font-family:'Inter',sans-serif; outline:none; }
        .fp-input::placeholder { color:${r.gray}; opacity:0.7; }
        .fp-input-icon-btn { position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:${r.gray}; padding:0.5rem; display:flex; align-items:center; justify-content:center; transition:color .2s; border-radius:4px; }
        .fp-input-icon-btn:hover { color:${r.ink}; background:rgba(0,0,0,0.04); }

        /* Code inputs */
        .fp-code-row { display:flex; gap:8px; justify-content:center; margin-bottom:1.5rem; }
        .fp-code-input { width:48px; height:58px; text-align:center; font-size:1.3rem; font-weight:500; font-family:'JetBrains Mono',monospace; background:${r.bone2}; border:1px solid ${r.line}; border-radius:10px; outline:none; color:${r.ink}; transition:all .25s ease; }
        .fp-code-input:focus { border-color:${r.brass}; background:${r.white}; box-shadow:0 0 0 3px rgba(139,115,85,0.12); transform:translateY(-2px); }
        .fp-code-input::placeholder { color:${r.gray}; opacity:0.3; }

        /* Alert */
        .fp-alert { display:flex; align-items:center; gap:0.6rem; padding:0.8rem 1rem; border-radius:8px; border:1px solid; font-size:0.85rem; font-weight:500; margin-bottom:1.2rem; animation:fpFadeUp .35s cubic-bezier(0.16,1,0.3,1) both; }

        /* Buttons */
        .fp-btn-primary { width:100%; padding:0.9rem 1.2rem; font-size:0.9rem; font-weight:600; font-family:'Inter',sans-serif; border:none; border-radius:8px; background:${r.ink}; color:${r.bone}; cursor:pointer; transition:all .3s ease; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .fp-btn-primary:hover:not(:disabled) { background:${r.verdigris}; transform:translateY(-1px); box-shadow:0 10px 20px rgba(21,23,26,0.15); }
        .fp-btn-primary:active:not(:disabled) { transform:translateY(0); }
        .fp-btn-primary:disabled { background:${r.gray}; cursor:not-allowed; opacity:0.5; transform:none; box-shadow:none; }

        .fp-btn-ghost { background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:500; padding:0.4rem 0; display:inline-flex; align-items:center; gap:0.35rem; transition:color .2s; }
        .fp-btn-ghost.brass { color:${r.brass}; }
        .fp-btn-ghost.brass:hover { color:${r.brassLight}; }
        .fp-btn-ghost.verdigris { color:${r.verdigris}; }
        .fp-btn-ghost.verdigris:hover { color:${r.verdigrisDark}; }

        .fp-btn-row { display:flex; align-items:center; justify-content:space-between; margin-top:0.8rem; }

        /* Footer */
        .fp-form-footer { margin-top:2rem; padding-top:1.5rem; border-top:1px solid ${r.line}; text-align:center; }
        .fp-encrypted-badge { display:flex; align-items:center; justify-content:center; gap:0.4rem; margin-top:0.8rem; font-size:0.7rem; font-family:'JetBrains Mono',monospace; color:${r.gray}; opacity:0.6; }

        /* Spinner */
        .fp-spinner { width:16px; height:16px; border:2px solid rgba(250,248,244,0.3); border-top-color:${r.bone}; border-radius:50%; animation:fpSpin .65s linear infinite; display:inline-block; }

        /* Animations */
        @keyframes fpSpin { to { transform:rotate(360deg); } }
        @keyframes fpFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fpFadeIn { from { opacity:0; } to { opacity:1; } }
        .fp-animate { animation:fpFadeUp .4s cubic-bezier(0.16,1,0.3,1) both; }

        /* Responsive */
        @media (max-width:768px) {
          .fp-container { flex-direction:column; max-width:440px; }
          .fp-sidebar { width:100%; padding:2rem; min-height:auto; }
          .fp-sidebar-logo { margin-bottom:1.5rem; }
          .fp-sidebar-headline { font-size:1.4rem; }
          .fp-sidebar-steps { display:none; }
          .fp-form { padding:2.5rem 2rem; }
        }
        @media (max-width:480px) {
          .fp-page-wrapper { padding:0; }
          .fp-container { border-radius:0; min-height:100vh; }
          .fp-sidebar { padding:1.5rem; }
          .fp-sidebar-headline { display:none; }
          .fp-sidebar-text { display:none; }
          .fp-form { padding:2rem 1.5rem; }
          .fp-code-input { width:42px; height:50px; font-size:1.1rem; }
        }
      `}),(0,e.jsxs)("div",{className:"fp-container",children:[(0,e.jsxs)("div",{className:"fp-sidebar",children:[(0,e.jsx)("div",{className:"fp-sidebar-grid"}),(0,e.jsx)("div",{className:"fp-sidebar-glow"}),(0,e.jsxs)("div",{className:"fp-sidebar-inner",children:[(0,e.jsxs)("div",{className:"fp-sidebar-logo",onClick:()=>c("/"),children:[(0,e.jsx)(ee,{size:28,color:r.brassLight}),"Rest Point"]}),(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{className:"fp-sidebar-headline",children:z[i].headline}),(0,e.jsx)("p",{className:"fp-sidebar-text",children:z[i].text})]}),(0,e.jsx)("div",{className:"fp-sidebar-steps",children:R.map(s=>{const t=i===s.n,o=i>s.n;return(0,e.jsxs)("div",{className:`fp-sidebar-step ${t?"active":""} ${o?"done":""}`,children:[(0,e.jsx)("span",{className:"fp-sidebar-step-num",children:o?(0,e.jsx)(A,{size:11,strokeWidth:3}):`0${s.n}`}),(0,e.jsx)("span",{children:s.label})]},s.n)})}),(0,e.jsx)("div",{className:"fp-sidebar-footer",children:"WELT TALLIS TECHNOLOGIES"})]})]}),(0,e.jsxs)("div",{className:"fp-form",children:[(0,e.jsx)("div",{className:"fp-steps-row",children:R.map(s=>{const t=i===s.n,o=i>s.n;return(0,e.jsx)(re,{number:`0${s.n}`,label:s.label,active:t,done:o},s.n)})}),(0,e.jsxs)("div",{className:"fp-animate",children:[i===1&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"fp-form-header",children:[(0,e.jsx)("h1",{children:"Forgot your password?"}),(0,e.jsx)("p",{children:"Enter your email and we'll send a verification code."})]}),(0,e.jsxs)("form",{onSubmit:F,children:[(0,e.jsx)(C,{type:m.type,text:m.text}),(0,e.jsxs)("div",{className:"fp-form-group",children:[(0,e.jsx)("label",{className:"fp-form-label",children:"Email address"}),(0,e.jsx)("div",{className:"fp-input-wrap",children:(0,e.jsx)("input",{type:"email",value:d,onChange:s=>{f(s.target.value),m.text&&a({type:"",text:""})},placeholder:"director@funeralhome.co.ke",disabled:l,autoFocus:!0,autoComplete:"email",className:"fp-input"})})]}),(0,e.jsx)("button",{type:"submit",disabled:l,className:"fp-btn-primary",children:l?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(N,{}),(0,e.jsx)("span",{children:"Sending code..."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{children:"Send verification code"}),(0,e.jsx)(k,{size:16})]})})]})]}),i===2&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"fp-form-header",children:[(0,e.jsx)("h1",{children:"Enter the code"}),(0,e.jsxs)("p",{children:["Sent to ",(0,e.jsx)("span",{children:d})]})]}),(0,e.jsxs)("form",{onSubmit:J,children:[(0,e.jsx)(C,{type:m.type,text:m.text}),(0,e.jsx)("div",{className:"fp-code-row",onPaste:O,children:g.map((s,t)=>(0,e.jsx)("input",{ref:o=>{n.current[t]=o},type:"text",inputMode:"numeric",maxLength:1,value:s,onChange:o=>_(t,o.target.value),onKeyDown:o=>W(t,o),className:"fp-code-input",placeholder:"·",autoFocus:t===0},t))}),(0,e.jsx)("button",{type:"submit",disabled:l,className:"fp-btn-primary",children:l?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(N,{}),(0,e.jsx)("span",{children:"Verifying..."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{children:"Verify code"}),(0,e.jsx)(k,{size:16})]})}),(0,e.jsxs)("div",{className:"fp-btn-row",children:[(0,e.jsxs)("button",{type:"button",className:"fp-btn-ghost verdigris",onClick:S,children:[(0,e.jsx)(B,{size:14})," Different email"]}),(0,e.jsx)("button",{type:"button",className:"fp-btn-ghost brass",onClick:F,disabled:l,children:"Resend code"})]})]})]}),i===3&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"fp-form-header",children:[(0,e.jsx)("h1",{children:"Set new password"}),(0,e.jsx)("p",{children:"Choose a strong password for your account."})]}),(0,e.jsxs)("form",{onSubmit:Y,children:[(0,e.jsx)(C,{type:m.type,text:m.text}),(0,e.jsxs)("div",{className:"fp-form-group",children:[(0,e.jsx)("label",{className:"fp-form-label",children:"New password"}),(0,e.jsxs)("div",{className:"fp-input-wrap",children:[(0,e.jsx)("input",{type:y?"text":"password",value:h,onChange:s=>{L(s.target.value),m.text&&a({type:"",text:""})},placeholder:"At least 6 characters",disabled:l,autoComplete:"new-password",className:"fp-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>T(!y),disabled:l,className:"fp-input-icon-btn",children:y?(0,e.jsx)(D,{size:16}):(0,e.jsx)(P,{size:16})})]})]}),(0,e.jsxs)("div",{className:"fp-form-group",children:[(0,e.jsx)("label",{className:"fp-form-label",children:"Confirm password"}),(0,e.jsxs)("div",{className:"fp-input-wrap",children:[(0,e.jsx)("input",{type:j?"text":"password",value:$,onChange:s=>{I(s.target.value),m.text&&a({type:"",text:""})},placeholder:"Repeat your password",disabled:l,autoComplete:"new-password",className:"fp-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:()=>M(!j),disabled:l,className:"fp-input-icon-btn",children:j?(0,e.jsx)(D,{size:16}):(0,e.jsx)(P,{size:16})})]})]}),(0,e.jsx)("button",{type:"submit",disabled:l,className:"fp-btn-primary",children:l?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(N,{}),(0,e.jsx)("span",{children:"Resetting..."})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{children:"Reset password"}),(0,e.jsx)(k,{size:16})]})}),(0,e.jsx)("div",{className:"fp-btn-row",children:(0,e.jsxs)("button",{type:"button",className:"fp-btn-ghost verdigris",onClick:S,children:[(0,e.jsx)(B,{size:14})," Go back"]})})]})]})]},i),(0,e.jsxs)("div",{className:"fp-form-footer",children:[(0,e.jsx)("button",{onClick:()=>c("/login"),className:"fp-btn-ghost verdigris",style:{fontWeight:600,fontSize:"0.88rem"},children:"Back to sign in"}),(0,e.jsxs)("div",{className:"fp-encrypted-badge",children:[(0,e.jsx)(Z,{size:12}),(0,e.jsx)("span",{children:"Secure recovery"}),(0,e.jsx)("span",{style:{opacity:.3},children:"·"}),(0,e.jsx)("span",{children:"© 2026 Rest Point"})]})]})]})]})]})};export{de as default};
