import{r as X}from"./chunk-CXHxssQy.js";import{y as ee}from"./chunk-CXAmgOhv.js";import{l as re}from"./chunk-DWc5g_hH.js";import{o as ae}from"./chunk-BY9AVXEY.js";import{t as O}from"./chunk-BUeZRQuQ.js";import{t as se}from"./chunk-DyQAXL3m.js";import{$t as te,I as ne,Mn as oe,On as ie,at as le,en as ce,i as de,it as me,m as pe,n as ge,r as ue}from"./index-Cp7mIUwY.js";import"./chunk-DdOqE3vG.js";var c=X(ee(),1),e=ae(),r={ink:"#08090A",inkSoft:"#111315",inkBorder:"rgba(255,255,255,0.08)",bone:"#FAF8F4",bone2:"#F3EFE6",line:"#E5E7EB",lineDark:"#D1D5DB",text:"#111827",textDim:"#6B7280",textMute:"#9CA3AF",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisGlow:"rgba(61, 79, 71, 0.15)",gray:"#6B6862",red:"#9B4A3F",redBg:"#F7ECE9",success:"#475A43",successBg:"#EEF3EC"},E=[{key:"org",label:"Org Details",description:"Basic information"},{key:"security",label:"Security",description:"Create password"},{key:"review",label:"Review",description:"Verify & confirm"}],he=o=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o),fe=o=>/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}$/.test(o.replace(/\s/g,"")),be=o=>{const n=[];return o.length<8&&n.push("8+ characters"),/[A-Z]/.test(o)||n.push("1 uppercase"),/[!@#$%^&*(),.?":{}|<>]/.test(o)||n.push("1 special char"),n},xe=o=>{if(!o)return 0;let n=0;return o.length>=8&&n++,/[A-Z]/.test(o)&&n++,/[!@#$%^&*(),.?":{}|<>]/.test(o)&&n++,n},q=o=>o===0?r.gray:o===1?r.red:o===2?r.brass:r.verdigris,ye=o=>["Enter password","Weak","Medium","Strong"][o]||"Strong",ve=()=>(0,e.jsx)("span",{className:"spinner"}),G=({type:o,text:n})=>{if(!n)return null;const p={error:{bg:r.redBg,border:r.red,color:r.red},success:{bg:r.successBg,border:r.success,color:r.success}},d=p[o]||p.error;return(0,e.jsxs)("div",{className:"alert-message",style:{background:d.bg,borderColor:d.border,color:d.color},children:[(0,e.jsx)(pe,{size:16}),(0,e.jsx)("span",{children:n})]})},J=({label:o,value:n,onChange:p,showPassword:d,onToggle:f,hasError:x,errorMessage:N,disabled:j,placeholder:F})=>{const[w,$]=(0,c.useState)(!1);return(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsxs)("label",{className:"form-label",children:[o," ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsxs)("div",{className:"input-wrapper",style:{border:`1px solid ${x?r.red:w?r.verdigris:r.lineDark}`,boxShadow:w?`0 0 0 4px ${r.verdigrisGlow}`:"none"},children:[(0,e.jsx)("input",{type:d?"text":"password",value:n,onChange:p,onFocus:()=>$(!0),onBlur:()=>$(!1),placeholder:F,disabled:j,className:"form-input",style:{paddingRight:"2.5rem"}}),(0,e.jsx)("button",{type:"button",onClick:f,disabled:j,className:"input-icon-btn",children:d?(0,e.jsx)(le,{size:16}):(0,e.jsx)(me,{size:16})})]}),N&&(0,e.jsx)("span",{className:"form-error",children:N})]})},je=({currentStep:o})=>(0,e.jsx)("div",{className:"progress-header",children:(0,e.jsx)("div",{className:"progress-steps",children:E.map((n,p)=>{const d=p<o,f=p===o;return(0,e.jsxs)(c.Fragment,{children:[(0,e.jsxs)("div",{className:"step-node",children:[(0,e.jsx)("div",{className:`step-circle ${d?"completed":""} ${f?"active":""}`,children:d?(0,e.jsx)(ne,{size:14}):p+1}),(0,e.jsx)("span",{className:`step-text ${f?"active":""}`,children:n.label})]}),p<E.length-1&&(0,e.jsx)("div",{className:`step-line ${p<o?"active":""}`})]},n.key)})})}),we=({label:o,preview:n,onUpload:p,error:d})=>{const f=()=>document.getElementById("file-upload").click();return(0,e.jsxs)("div",{className:"form-group full",children:[(0,e.jsxs)("label",{className:"form-label",children:[o," ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsxs)("div",{onClick:f,className:"upload-area",style:{border:`1.5px dashed ${d?r.red:n?r.verdigris:r.lineDark}`},children:[(0,e.jsx)("div",{className:"upload-preview",children:n?(0,e.jsx)("img",{src:n,alt:"Preview",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"8px"}}):(0,e.jsx)(oe,{size:20,color:r.textMute})}),(0,e.jsxs)("div",{className:"upload-text",children:[(0,e.jsx)("span",{className:"upload-title",children:n?"Logo uploaded. Click to replace.":"Click to upload or drag and drop"}),(0,e.jsx)("span",{className:"upload-sub",children:"SVG, PNG, JPG (max 10MB)"})]})]}),(0,e.jsx)("input",{id:"file-upload",type:"file",accept:"image/jpeg,image/png,image/jpg,image/svg+xml",onChange:p,style:{display:"none"}}),d&&(0,e.jsx)("span",{className:"form-error",children:d})]})},k=({label:o,value:n})=>(0,e.jsxs)("div",{className:"review-item",children:[(0,e.jsx)("span",{className:"review-label",children:o}),(0,e.jsx)("span",{className:"review-value",children:n||"—"})]});function Fe(){const o=re(),[n,p]=(0,c.useState)(0),[d,f]=(0,c.useState)(null),[x,N]=(0,c.useState)(null),[j,F]=(0,c.useState)(!1),[w,$]=(0,c.useState)(!1),[g,D]=(0,c.useState)(!1),[S,_]=(0,c.useState)(!1),[V,b]=(0,c.useState)(""),[U,M]=(0,c.useState)(""),[z,H]=(0,c.useState)(null),[y,C]=(0,c.useState)({step:"",percent:0,details:""}),[a,A]=(0,c.useState)({organizationName:"",email:"",phoneNumber:"",location:"",password:"",verifyPassword:"",branchName:"",deploymentType:"multi"}),[u,P]=(0,c.useState)([{name:"",location:""}]),[l,h]=(0,c.useState)({}),K=()=>o("/login"),W=()=>o("/terms");(0,c.useEffect)(()=>{if(!O.SOCKET_URL)return;const s=se(O.SOCKET_URL,{transports:["websocket","polling"],reconnection:!0,reconnectionAttempts:10,reconnectionDelay:1e3,auth:ge()});return s.on("reconnect_attempt",()=>ue(s)),s.on("onboarding-progress",t=>{C({step:t.step||"",percent:t.progress||0,details:t.details||""})}),H(s),()=>s.close()},[]);const v=(0,c.useCallback)(s=>{const{name:t,value:m}=s.target;A(i=>({...i,[t]:m})),l[t]&&h(i=>({...i,[t]:""})),b("")},[l]),Y=(0,c.useCallback)(s=>{const t=s.target.files[0];if(!t)return;if(t.size>10485760){h(i=>({...i,logo:"File size must be less than 10MB"}));return}if(!["image/jpeg","image/png","image/jpg","image/svg+xml"].includes(t.type)){h(i=>({...i,logo:"Only JPG, PNG, or SVG allowed"}));return}N(t);const m=new FileReader;m.onloadend=()=>f(m.result),m.readAsDataURL(t),h(i=>({...i,logo:""}))},[]),I=(0,c.useCallback)(()=>{const s={};return a.organizationName.trim()||(s.organizationName="Organization name required"),a.email.trim()?he(a.email)||(s.email="Valid email required"):s.email="Email required",a.phoneNumber.trim()?fe(a.phoneNumber)||(s.phoneNumber="Valid phone number required (e.g., +254712345678)"):s.phoneNumber="Phone number required",a.location.trim()||(s.location="Location required"),a.deploymentType==="multi"?u.filter(t=>t.name.trim()).length===0&&(s.branches="At least one branch with a name is required"):a.branchName.trim()||(s.branchName="Primary branch name required"),!x&&!d&&(s.logo="Logo required"),h(s),Object.keys(s).length===0},[a,x,d,u]),L=(0,c.useCallback)(()=>{const s={};if(!a.password)s.password="Password required";else{const t=be(a.password);t.length>0&&(s.password=`Must have: ${t.join(", ")}`)}return a.verifyPassword?a.password!==a.verifyPassword&&(s.verifyPassword="Passwords do not match"):s.verifyPassword="Please confirm password",h(s),Object.keys(s).length===0},[a]),R=(0,c.useCallback)(()=>{n===0&&!I()||n===1&&!L()||(h({}),p(s=>Math.min(s+1,E.length-1)),window.scrollTo({top:0,behavior:"smooth"}))},[n,I,L]),Z=(0,c.useCallback)(()=>{h({}),p(s=>Math.max(s-1,0)),window.scrollTo({top:0,behavior:"smooth"})},[]),Q=(0,c.useCallback)(async s=>{if(s.preventDefault(),n<2){R();return}if(!S){h({terms:"You must agree to terms"});return}D(!0),b(""),M(""),C({step:"Initializing...",percent:0,details:""});try{const t=new FormData;t.append("organizationName",a.organizationName),t.append("email",a.email),t.append("phoneNumber",a.phoneNumber),t.append("location",a.location),t.append("password",a.password),t.append("deploymentType",a.deploymentType),t.append("termsAccepted",S),x&&t.append("logo",x),a.deploymentType==="multi"?t.append("branches",JSON.stringify(u.filter(T=>T.name.trim()))):t.append("branchName",a.branchName);const m=a.organizationName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");z&&z.connected&&z.emit("join-tenant",{tenantSlug:m,userId:"temp",userRole:"admin"});const i=await de.post("/onboarding/organization",t,{headers:{"Content-Type":null,"x-tenant-slug":""},timeout:3e5});if(i.data.success||i.status===200||i.status===201){M(i.data.message||"Organization setup completed! Redirecting..."),C({step:"Complete!",percent:100,details:"Redirecting to dashboard..."});const T={organizationName:a.organizationName,email:a.email,phoneNumber:a.phoneNumber,location:a.location,logo:d,organizationId:i.data.organizationId,userId:i.data.userId,completedAt:new Date().toISOString()};localStorage.setItem("onboardingData",JSON.stringify(T)),localStorage.setItem("onboardingComplete","true"),i.data.token&&localStorage.setItem("authToken",i.data.token),i.data.user&&localStorage.setItem("user",JSON.stringify(i.data.user)),setTimeout(()=>{D(!1),o("/login")},2e3)}else throw new Error(i.data.message||"Setup failed.")}catch(t){if(D(!1),C({step:"",percent:0,details:""}),t.response){const m=t.response.status,i=t.response.data?.message||t.response.data?.error||"Server error";b(m===409?"Organization with this email already exists.":m===400?i||"Invalid data provided.":m===500?"Server error. Please try again later.":i||`Error ${m}`)}else t.request?b("Network error. Please check your connection."):b(t.message||"An unexpected error occurred.")}},[a,x,S,o,d,n,R,z]),B=xe(a.password);return(0,e.jsxs)("div",{className:"split-layout",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${r.text};background:${r.bone};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:400;letter-spacing:-0.01em;color:${r.ink}}
        p{line-height:1.7;color:${r.textDim}}
        
        .split-layout { display: flex; min-height: 100vh; }
        
        /* ─── LEFT PANEL (Brand / Visual) ─── */
        .brand-panel {
          flex: 1;
          background: ${r.ink};
          color: ${r.bone};
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
          border-right: 1px solid ${r.inkBorder};
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: -10%; left: 20%;
          width: 60%; height: 50%;
          background: radial-gradient(circle, rgba(61, 79, 71, 0.35) 0%, transparent 70%);
          filter: blur(60px); z-index: 0;
          animation: pulse 8s infinite alternate;
        }

        .brand-panel::after {
          content: '';
          position: absolute;
          bottom: -10%; right: -10%;
          width: 50%; height: 50%;
          background: radial-gradient(circle, rgba(139, 115, 85, 0.25) 0%, transparent 70%);
          filter: blur(60px); z-index: 0;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        .brand-header, .brand-footer, .brand-content { position: relative; z-index: 1; }

        .brand-logo {
          display: flex; align-items: center; gap: 0.75rem;
          font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 500; color: ${r.bone};
        }

        .brand-content { max-width: 420px; margin-top: 2rem; }
        .brand-content h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem; color: ${r.bone}; }
        .brand-content h1 em { font-style: italic; color: ${r.brassLight}; }
        .brand-content p { color: rgba(250, 248, 244, 0.6); line-height: 1.7; font-size: 0.95rem; }

        .feature-list { margin-top: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .feature-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem; background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px;
          backdrop-filter: blur(10px); transition: all 0.3s ease;
        }
        .feature-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); }
        .feature-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(61, 79, 71, 0.2); display: flex; align-items: center; justify-content: center;
          color: ${r.verdigrisLight}; flex-shrink: 0;
        }
        .feature-text { display: flex; flex-direction: column; }
        .feature-title { font-size: 0.85rem; font-weight: 600; color: ${r.bone}; }
        .feature-sub { font-size: 0.75rem; color: rgba(250, 248, 244, 0.4); font-family: 'JetBrains Mono', monospace; }

        .brand-footer { font-size: 0.75rem; color: rgba(250, 248, 244, 0.3); font-family: 'JetBrains Mono', monospace; }

        /* ─── RIGHT PANEL (Form) ─── */
        .form-panel {
          flex: 1.2;
          background: ${r.bone};
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }

        .form-nav {
          padding: 1.5rem 3rem;
          display: flex; justify-content: flex-end;
          border-bottom: 1px solid ${r.line};
        }
        .nav-link {
          color: ${r.textDim}; font-size: 0.85rem; text-decoration: none; font-weight: 500; transition: color 0.2s;
          background: transparent; border: none; cursor: pointer; font-family: 'Inter', sans-serif;
        }
        .nav-link:hover { color: ${r.ink}; }

        .form-container {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem 3rem 4rem;
        }
        .form-content { width: 100%; max-width: 580px; }

        .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .progress-steps { display: flex; align-items: center; gap: 0.75rem; }
        .step-node { display: flex; align-items: center; gap: 0.5rem; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: ${r.bone2}; border: 1.5px solid ${r.lineDark};
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: ${r.textMute};
          transition: all 0.3s ease;
        }
        .step-circle.active {
          background: ${r.ink}; border-color: ${r.ink}; color: ${r.bone};
          box-shadow: 0 0 0 4px rgba(8, 9, 10, 0.05);
        }
        .step-circle.completed { background: ${r.verdigris}; border-color: ${r.verdigris}; color: ${r.bone}; }
        .step-line { width: 30px; height: 1.5px; background: ${r.lineDark}; }
        .step-line.active { background: ${r.verdigris}; }
        .step-text {
          font-size: 0.75rem; font-weight: 600; color: ${r.textMute};
          font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .step-text.active { color: ${r.ink}; }

        .form-header { margin-bottom: 2.5rem; }
        .form-header .appreciation {
          font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: ${r.brass}; margin-bottom: 0.75rem; font-weight: 500;
        }
        .form-header h2 {
          font-size: 2.25rem; line-height: 1.2; margin-bottom: 0.5rem; font-weight: 400; color: ${r.ink};
        }
        .form-header h2 em { font-style: italic; color: ${r.brass}; }
        .form-header p { color: ${r.textDim}; font-size: 0.95rem; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: span 2; }

        .form-label {
          font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; text-transform: uppercase;
          letter-spacing: 0.1em; color: ${r.textMute}; margin-bottom: 0.5rem; font-weight: 500;
        }

        .input-wrapper {
          position: relative; background: ${r.bone}; border: 1px solid ${r.lineDark};
          border-radius: 10px; transition: all 0.2s; display: flex; align-items: center;
        }
        .input-wrapper:hover { border-color: ${r.textMute}; }
        .input-wrapper:focus-within {
          border-color: ${r.verdigris}; box-shadow: 0 0 0 4px ${r.verdigrisGlow}; background: #fff;
        }
        .form-input {
          width: 100%; padding: 0.85rem 1rem; background: transparent; border: none; border-radius: 10px;
          font-size: 0.95rem; color: ${r.text}; font-family: 'Inter', sans-serif; outline: none;
        }
        .form-input::placeholder { color: ${r.textMute}; }
        .input-icon-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${r.textMute}; padding: 0.5rem; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .input-icon-btn:hover { color: ${r.ink}; }
        .input-icon-left { position: absolute; left: 1rem; color: ${r.textMute}; pointer-events: none; }
        .input-wrapper.has-icon .form-input { padding-left: 2.5rem; }

        .form-error { display: block; color: ${r.red}; font-size: 0.75rem; margin-top: 0.3rem; }
        .alert-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.5rem; }

        .upload-area {
          border: 1.5px dashed ${r.lineDark}; border-radius: 12px; padding: 1.5rem;
          display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s; background: ${r.bone2};
        }
        .upload-area:hover { border-color: ${r.verdigris}; background: rgba(61, 79, 71, 0.03); }
        .upload-preview {
          width: 48px; height: 48px; border-radius: 8px; background: ${r.bone}; border: 1px solid ${r.lineDark};
          display: flex; align-items: center; justify-content: center; color: ${r.textMute}; overflow: hidden; flex-shrink: 0;
        }
        .upload-text { display: flex; flex-direction: column; }
        .upload-title { font-size: 0.9rem; font-weight: 600; color: ${r.ink}; }
        .upload-sub { font-size: 0.75rem; color: ${r.textMute}; }

        .segmented-control {
          display: flex; background: ${r.bone2}; border: 1px solid ${r.lineDark};
          border-radius: 10px; padding: 4px; gap: 4px; cursor: pointer;
        }
        .segment {
          flex: 1; padding: 0.65rem 1rem; text-align: center; border-radius: 7px;
          font-size: 0.85rem; font-weight: 600; color: ${r.textMute}; transition: all 0.2s;
        }
        .segment.active { background: ${r.ink}; color: ${r.bone}; box-shadow: 0 2px 8px rgba(8, 9, 10, 0.15); }

        .branch-list { display: flex; flex-direction: column; gap: 1rem; }
        .branch-card {
          border: 1px solid ${r.line}; border-radius: 12px; padding: 1.25rem;
          background: #fff; transition: all 0.2s;
        }
        .branch-card:hover { border-color: ${r.lineDark}; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .branch-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .branch-title { font-weight: 600; font-size: 0.9rem; color: ${r.ink}; display: flex; align-items: center; gap: 0.5rem; }
        .branch-badge {
          background: ${r.verdigrisGlow}; color: ${r.verdigris}; font-size: 0.65rem;
          padding: 0.15rem 0.5rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;
        }
        .btn-icon {
          background: transparent; border: none; color: ${r.textMute}; cursor: pointer;
          display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; transition: color 0.2s;
        }
        .btn-icon:hover { color: ${r.red}; }

        .btn-add-branch {
          width: 100%; padding: 1rem; background: transparent; border: 1.5px dashed ${r.lineDark};
          border-radius: 10px; color: ${r.textDim}; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: all 0.2s; margin-top: 1rem;
        }
        .btn-add-branch:hover { border-color: ${r.verdigris}; color: ${r.verdigris}; background: rgba(61, 79, 71, 0.02); }

        .form-actions {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid ${r.line};
        }
        .btn-back {
          background: transparent; border: none; color: ${r.textDim}; font-size: 0.9rem; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: color 0.2s;
        }
        .btn-back:hover { color: ${r.ink}; }
        .btn-primary {
          background: ${r.ink}; color: ${r.bone}; border: none; padding: 0.9rem 2rem; border-radius: 10px;
          font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(8, 9, 10, 0.15);
        }
        .btn-primary:hover { background: #000; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(8, 9, 10, 0.2); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .review-item {
          display: flex; justify-content: space-between; padding: 0.8rem 1rem;
          border-bottom: 1px solid ${r.line}; font-size: 0.85rem;
        }
        .review-item:last-child { border-bottom: none; }
        .review-label { color: ${r.textDim}; }
        .review-value { color: ${r.ink}; font-weight: 500; }

        .spinner { width: 14px; height: 14px; border: 2px solid rgba(250,248,244,0.35); border-top-color: ${r.bone}; border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .progress-bar-container {
          margin-bottom: 1.5rem; padding: 1rem; background: ${r.bone2}; border-radius: 8px; border: 1px solid ${r.line};
        }
        .progress-bar-track { width: 100%; height: 6px; background: ${r.line}; border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, ${r.brass}, ${r.verdigris}); border-radius: 3px; transition: width 0.4s ease; }

        @media(max-width: 900px){
          .split-layout { flex-direction: column; }
          .brand-panel { display: none; }
          .form-nav, .form-container { padding-left: 1.5rem; padding-right: 1.5rem; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: span 1; }
          .form-actions { flex-direction: column-reverse; gap: 1rem; }
          .btn-back, .btn-primary { width: 100%; justify-content: center; }
        }
      `}),(0,e.jsxs)("aside",{className:"brand-panel",children:[(0,e.jsx)("div",{className:"brand-header",children:(0,e.jsxs)("div",{className:"brand-logo",children:[(0,e.jsxs)("svg",{width:"28",height:"28",viewBox:"0 0 32 32",fill:"none",children:[(0,e.jsx)("circle",{cx:"16",cy:"16",r:"15",stroke:"#FAF8F4","stroke-width":"1.5"}),(0,e.jsx)("path",{d:"M16 8V24M8 16H24",stroke:"#FAF8F4","stroke-width":"1.5","stroke-linecap":"round"}),(0,e.jsx)("circle",{cx:"16",cy:"16",r:"3.5",fill:"#8B7355"})]}),"Rest Point"]})}),(0,e.jsxs)("div",{className:"brand-content",children:[(0,e.jsxs)("h1",{children:["Configure your ",(0,e.jsx)("em",{children:"enterprise"})," workspace."]}),(0,e.jsx)("p",{children:"Rest Point provides a unified operating system for funeral homes. Set up your organization to begin managing cases, smart dispatch, and family portals with engineering precision."}),(0,e.jsxs)("div",{className:"feature-list",children:[(0,e.jsxs)("div",{className:"feature-item",children:[(0,e.jsx)("div",{className:"feature-icon",children:(0,e.jsx)("svg",{width:"18",height:"18",fill:"none",stroke:"currentColor","stroke-width":"2",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})})}),(0,e.jsxs)("div",{className:"feature-text",children:[(0,e.jsx)("span",{className:"feature-title",children:"Bank-Grade Security"}),(0,e.jsx)("span",{className:"feature-sub",children:"AES-256 / SOC2 Compliant"})]})]}),(0,e.jsxs)("div",{className:"feature-item",children:[(0,e.jsx)("div",{className:"feature-icon",children:(0,e.jsx)("svg",{width:"18",height:"18",fill:"none",stroke:"currentColor","stroke-width":"2",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M13 10V3L4 14h7v7l9-11h-7z"})})}),(0,e.jsxs)("div",{className:"feature-text",children:[(0,e.jsx)("span",{className:"feature-title",children:"Real-Time Sync"}),(0,e.jsx)("span",{className:"feature-sub",children:"12ms Global Latency"})]})]})]})]}),(0,e.jsx)("div",{className:"brand-footer",children:"Rest Point OS © 2024"})]}),(0,e.jsxs)("main",{className:"form-panel",children:[(0,e.jsx)("nav",{className:"form-nav",children:(0,e.jsx)("button",{onClick:K,className:"nav-link",children:"Already have an account? Log in"})}),(0,e.jsx)("div",{className:"form-container",children:(0,e.jsxs)("div",{className:"form-content",children:[(0,e.jsx)(je,{currentStep:n}),g&&y.percent>0&&(0,e.jsxs)("div",{className:"progress-bar-container",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,e.jsx)("span",{style:{fontSize:"0.85rem",fontWeight:600,color:r.ink},children:y.step}),(0,e.jsxs)("span",{style:{fontFamily:"'JetBrains Mono', monospace",fontSize:"0.75rem",color:r.brass},children:[y.percent,"%"]})]}),(0,e.jsx)("div",{className:"progress-bar-track",children:(0,e.jsx)("div",{className:"progress-bar-fill",style:{width:`${y.percent}%`}})}),y.details&&(0,e.jsx)("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:r.textDim,fontStyle:"italic"},children:y.details})]}),(0,e.jsxs)("div",{className:"form-header",children:[n===0&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"appreciation",children:"Thank you for choosing Rest Point."}),(0,e.jsxs)("h2",{children:["Let's get ",(0,e.jsx)("em",{children:"started"}),"."]}),(0,e.jsx)("p",{children:"Tell us about your organization so families and your team know who they're working with."})]}),n===1&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("h2",{children:["Secure your ",(0,e.jsx)("em",{children:"account"})]}),(0,e.jsx)("p",{children:"Create a strong password that only your team will use to sign in to Rest Point."})]}),n===2&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("h2",{children:["Review and ",(0,e.jsx)("em",{children:"confirm"})]}),(0,e.jsx)("p",{children:"Check everything looks right, then create your account."})]})]}),(0,e.jsxs)("form",{onSubmit:Q,children:[(0,e.jsx)(G,{type:"success",text:U}),(0,e.jsx)(G,{type:"error",text:V}),n===0&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(we,{label:"Organization Logo",preview:d,onUpload:Y,error:l.logo}),(0,e.jsxs)("div",{className:"form-grid",children:[(0,e.jsxs)("div",{className:"form-group full",children:[(0,e.jsxs)("label",{className:"form-label",children:["Organization Name ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsx)("div",{className:"input-wrapper",style:{border:`1px solid ${l.organizationName?r.red:r.lineDark}`},children:(0,e.jsx)("input",{type:"text",name:"organizationName",value:a.organizationName,onChange:v,placeholder:"e.g., Nairobi Funeral Home",className:"form-input",disabled:g})}),l.organizationName&&(0,e.jsx)("span",{className:"form-error",children:l.organizationName})]}),(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsxs)("label",{className:"form-label",children:["Contact Email ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsx)("div",{className:"input-wrapper",style:{border:`1px solid ${l.email?r.red:r.lineDark}`},children:(0,e.jsx)("input",{type:"email",name:"email",value:a.email,onChange:v,placeholder:"info@funeralhome.co.ke",className:"form-input",disabled:g})}),l.email&&(0,e.jsx)("span",{className:"form-error",children:l.email})]}),(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsxs)("label",{className:"form-label",children:["Phone Number ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsxs)("div",{className:"input-wrapper has-icon",style:{border:`1px solid ${l.phoneNumber?r.red:r.lineDark}`},children:[(0,e.jsx)("span",{className:"input-icon-left",children:(0,e.jsx)(te,{size:16})}),(0,e.jsx)("input",{type:"tel",name:"phoneNumber",value:a.phoneNumber,onChange:v,placeholder:"+254 712 345 678",className:"form-input",disabled:g})]}),l.phoneNumber&&(0,e.jsx)("span",{className:"form-error",children:l.phoneNumber})]}),(0,e.jsxs)("div",{className:"form-group full",children:[(0,e.jsxs)("label",{className:"form-label",children:["Primary Location ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsx)("div",{className:"input-wrapper",style:{border:`1px solid ${l.location?r.red:r.lineDark}`},children:(0,e.jsx)("input",{type:"text",name:"location",value:a.location,onChange:v,placeholder:"e.g., Nairobi, Kenya",className:"form-input",disabled:g})}),l.location&&(0,e.jsx)("span",{className:"form-error",children:l.location})]}),(0,e.jsxs)("div",{className:"form-group full",style:{marginBottom:"1.5rem"},children:[(0,e.jsxs)("label",{className:"form-label",children:["Deployment Type ",(0,e.jsx)("span",{style:{color:r.red},children:"*"})]}),(0,e.jsxs)("div",{className:"segmented-control",onClick:s=>{const t=s.target.classList.contains("segment")?s.target.textContent.includes("Single")?"single":"multi":a.deploymentType;A(m=>({...m,deploymentType:t}))},children:[(0,e.jsx)("div",{className:`segment ${a.deploymentType==="single"?"active":""}`,style:a.deploymentType==="single"?{background:r.ink,color:r.bone}:{},children:"Single Tenant"}),(0,e.jsx)("div",{className:`segment ${a.deploymentType==="multi"?"active":""}`,style:a.deploymentType==="multi"?{background:r.ink,color:r.bone}:{},children:"Multi Tenant"})]})]}),(0,e.jsxs)("div",{className:"form-group full",children:[(0,e.jsx)("label",{className:"form-label",style:{marginBottom:"1rem"},children:"Branch Configuration"}),(0,e.jsx)("div",{className:"branch-list",children:a.deploymentType==="multi"?u.map((s,t)=>(0,e.jsxs)("div",{className:"branch-card",children:[(0,e.jsxs)("div",{className:"branch-header",children:[(0,e.jsxs)("span",{className:"branch-title",children:["Branch ",String(t+1).padStart(2,"0"),t===0&&(0,e.jsx)("span",{className:"branch-badge",children:"Primary"})]}),u.length>1&&(0,e.jsxs)("button",{type:"button",className:"btn-icon",onClick:()=>P(u.filter((m,i)=>i!==t)),children:[(0,e.jsx)(ie,{size:14})," Remove"]})]}),(0,e.jsxs)("div",{className:"form-grid",style:{margin:0,gap:"1rem"},children:[(0,e.jsx)("div",{className:"input-wrapper",children:(0,e.jsx)("input",{type:"text",placeholder:"Branch Name",value:s.name,onChange:m=>{const i=[...u];i[t].name=m.target.value,P(i)},className:"form-input"})}),(0,e.jsx)("div",{className:"input-wrapper",children:(0,e.jsx)("input",{type:"text",placeholder:"Branch Location",value:s.location,onChange:m=>{const i=[...u];i[t].location=m.target.value,P(i)},className:"form-input"})})]})]},t)):(0,e.jsxs)("div",{className:"branch-card",children:[(0,e.jsx)("div",{className:"branch-header",children:(0,e.jsxs)("span",{className:"branch-title",children:["Main Branch ",(0,e.jsx)("span",{className:"branch-badge",children:"Primary"})]})}),(0,e.jsx)("div",{className:"input-wrapper",style:{border:`1px solid ${l.branchName?r.red:r.lineDark}`},children:(0,e.jsx)("input",{type:"text",name:"branchName",value:a.branchName,onChange:v,placeholder:"e.g., Headquarters",className:"form-input",disabled:g})}),l.branchName&&(0,e.jsx)("span",{className:"form-error",children:l.branchName})]})}),a.deploymentType==="multi"&&(0,e.jsxs)("button",{type:"button",className:"btn-add-branch",onClick:()=>P([...u,{name:"",location:""}]),children:[(0,e.jsx)(ce,{size:16})," Add Another Branch"]}),l.branches&&(0,e.jsx)("span",{className:"form-error",style:{marginTop:"0.5rem"},children:l.branches})]})]})]}),n===1&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(J,{label:"Password",value:a.password,onChange:s=>v({target:{name:"password",value:s.target.value}}),showPassword:j,onToggle:()=>F(!j),hasError:!!l.password,errorMessage:l.password,disabled:g,placeholder:"Create a strong password"}),a.password&&(0,e.jsxs)("div",{className:"form-group",children:[(0,e.jsx)("div",{style:{display:"flex",gap:"0.25rem",marginBottom:"0.25rem"},children:[1,2,3].map(s=>(0,e.jsx)("div",{style:{flex:1,height:"4px",background:s<=B?q(B):r.line,borderRadius:"2px",transition:"background 0.3s"}},s))}),(0,e.jsxs)("span",{style:{fontSize:"0.75rem",color:q(B),fontWeight:500},children:["Strength: ",ye(B)]})]}),(0,e.jsx)(J,{label:"Verify Password",value:a.verifyPassword,onChange:s=>v({target:{name:"verifyPassword",value:s.target.value}}),showPassword:w,onToggle:()=>$(!w),hasError:!!l.verifyPassword,errorMessage:l.verifyPassword,disabled:g,placeholder:"Confirm your password"})]}),n===2&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{border:`1px solid ${r.line}`,borderRadius:"12px",overflow:"hidden",marginBottom:"1.5rem",background:"#fff"},children:[(0,e.jsx)(k,{label:"Organization",value:a.organizationName}),(0,e.jsx)(k,{label:"Email Contact",value:a.email}),(0,e.jsx)(k,{label:"Phone Number",value:a.phoneNumber}),(0,e.jsx)(k,{label:"Location",value:a.location}),(0,e.jsx)(k,{label:"Primary Branch",value:a.deploymentType==="multi"?u[0]?.name||"—":a.branchName})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",alignItems:"flex-start",marginBottom:"1.5rem"},children:[(0,e.jsx)("input",{type:"checkbox",id:"terms",checked:S,onChange:s=>_(s.target.checked),style:{marginTop:"0.25rem",accentColor:r.ink}}),(0,e.jsxs)("label",{htmlFor:"terms",style:{fontSize:"0.85rem",color:r.textDim,lineHeight:1.5},children:["I agree to the ",(0,e.jsx)("span",{style:{color:r.brass,cursor:"pointer",textDecoration:"underline"},onClick:W,children:"Terms of Service"})," and ",(0,e.jsx)("span",{style:{color:r.brass,cursor:"pointer",textDecoration:"underline"},onClick:()=>o("/privacy"),children:"Privacy Policy"}),"."]})]}),l.terms&&(0,e.jsx)("span",{className:"form-error",style:{marginBottom:"1rem"},children:l.terms})]}),(0,e.jsxs)("div",{className:"form-actions",children:[n>0?(0,e.jsxs)("button",{type:"button",className:"btn-back",onClick:Z,disabled:g,children:[(0,e.jsx)("svg",{width:"14",height:"14",fill:"none",stroke:"currentColor","stroke-width":"2",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M10 19l-7-7m0 0l7-7m-7 7h18"})}),"Back"]}):(0,e.jsx)("div",{}),(0,e.jsxs)("button",{type:"submit",className:"btn-primary",disabled:g,children:[g?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ve,{}),(0,e.jsxs)("span",{children:["Setting up... ",y.percent,"%"]})]}):n===2?"Complete Setup":"Continue Setup",!g&&(0,e.jsx)("svg",{width:"16",height:"16",fill:"none",stroke:"currentColor","stroke-width":"2.5",viewBox:"0 0 24 24",children:(0,e.jsx)("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M14 5l7 7m0 0l-7 7m7-7H3"})})]})]})]})]})})]})]})}export{Fe as default};
