import{r as Q}from"./chunk-CXHxssQy.js";import{y as se}from"./chunk-CXAmgOhv.js";import{l as le,u as de}from"./chunk-DWc5g_hH.js";import{_ as i,a as o,g as ce,m as y,n as F,s as u}from"./chunk-DJYPtS2Y.js";import{f as me}from"./chunk-CwzAxjA3.js";import{o as pe}from"./chunk-BY9AVXEY.js";import{r as ge}from"./chunk-C935kdjU.js";import{t as he}from"./chunk-BUeZRQuQ.js";import{E as P,Hn as xe,Nt as ue,P as R,R as fe,Rt as U,Vn as _,Xt as be,Yt as ve,et as Y,f as we,jn as O,on as je,p as ye,rn as Ce,v as ze,wt as A}from"./index-D6gguvjv.js";import{t as $e}from"./chunk-gJ4P60Tf.js";var c=Q(se(),1),Se=Q($e(),1),e=pe(),r={primaryDark:"#1a1a2e",accentTeal:"#0ea5e9",accentOrange:"#f59e0b",accentPurple:"#8b5cf6",white:"#FFFFFF",lightGray:"#f8fafc",mediumGray:"#e2e8f0",darkGray:"#334155",successGreen:"#10b981",dangerRed:"#ef4444",infoBlue:"#3b82f6",inputBorder:"#cbd5e1",inputFocus:"#0ea5e9",textMuted:"#64748b"},G=y`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,ke=y`
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`,Ie=y`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`,Te=y`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`,Fe=y`
  0% { 
    transform: rotate(0deg); 
  }
  100% { 
    transform: rotate(360deg); 
  }
`,Ne=i.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${r.lightGray} 0%, #f1f5f9 100%);
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  animation: ${G} 0.8s ease-out;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }

  @media (max-width: 576px) {
    padding: 0.5rem;
  }
`,Pe=i.div`
  background: ${r.white};
  border-radius: 1.25rem;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
  width: 100%;
  max-width: 900px;
  border: 1px solid ${r.mediumGray};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  ${m=>m.blurred&&ce`
    filter: blur(3px);
    pointer-events: none;
  `}

  &:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 20px 40px -12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 1rem;
  }

  @media (max-width: 576px) {
    padding: 0.75rem;
    border-radius: 0.875rem;
  }
`,Re=i.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${G} 0.3s ease-out;
`,_e=i.div`
  width: 60px;
  height: 60px;
  border: 4px solid ${r.mediumGray};
  border-top: 4px solid ${r.accentTeal};
  border-radius: 50%;
  animation: ${Fe} 1s linear infinite;

  @media (max-width: 576px) {
    width: 50px;
    height: 50px;
  }
`,Ge=i.div`
  color: ${r.white};
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  text-align: center;

  @media (max-width: 576px) {
    font-size: 0.875rem;
  }
`,W=i.div`
  position: fixed;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  background: ${r.successGreen};
  color: ${r.white};
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1001;
  animation: ${Ie} 0.5s ease-out;
  max-width: 400px;
  margin: 0 auto;
  
  svg {
    font-size: 1.5rem;
    animation: ${Te} 2s infinite;
  }
  
  .success-content {
    flex: 1;
    
    h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 700;
    }
    
    p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.875rem;
    }
  }

  @media (max-width: 576px) {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    
    svg {
      font-size: 1.25rem;
    }
    
    .success-content h4 {
      font-size: 0.875rem;
    }
    
    .success-content p {
      font-size: 0.75rem;
    }
  }
`,Ee=i(W)`
  background: ${r.dangerRed};
`,Le=i.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: ${G} 0.3s ease-out;
  padding: 1rem;
`,Me=i.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  background: ${r.darkGray};
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`,Be=i.div`
  width: 100%;
  height: 400px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  .react-webcam {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    height: 300px;
  }

  @media (max-width: 576px) {
    height: 250px;
  }
`,De=i.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: ${r.darkGray};
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    gap: 0.5rem;
    padding: 0.75rem;
  }
`,X=i.button`
  background: ${m=>m.primary?r.accentTeal:r.dangerRed};
  color: ${r.white};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 576px) {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`,qe=i.button`
  background: ${r.infoBlue};
  color: ${r.white};
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 576px) {
    padding: 0.5rem;
    font-size: 0.75rem;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`,Ue=i.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: ${r.white};
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${r.dangerRed};
    transform: scale(1.1);
  }

  @media (max-width: 576px) {
    width: 2rem;
    height: 2rem;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`,Ye=i.div`
  margin-top: 1rem;
  padding: 1rem;
  border: 2px dashed ${r.mediumGray};
  border-radius: 0.75rem;
  text-align: center;
  background: ${r.lightGray};
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${r.textMuted};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${r.accentTeal};
    background: ${r.white};
    
    .overlay {
      opacity: 1;
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
    width: 100%;
    max-height: 250px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .image-item {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
    aspect-ratio: 1;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .remove-btn {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      background: ${r.dangerRed};
      color: white;
      border: none;
      border-radius: 50%;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      font-size: 0.75rem;
    }
    
    &:hover .remove-btn {
      opacity: 1;
    }
  }

  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    
    svg {
      font-size: 2.5rem;
      opacity: 0.7;
    }
    
    .placeholder-text {
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .placeholder-subtext {
      font-size: 0.75rem;
      opacity: 0.8;
      text-align: center;
      max-width: 300px;
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(14, 165, 233, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  @media (max-width: 576px) {
    padding: 0.75rem;
    min-height: 150px;
    
    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
    }
    
    .placeholder-content {
      padding: 0.5rem;
      
      svg {
        font-size: 2rem;
      }
      
      .placeholder-text {
        font-size: 0.75rem;
      }
      
      .placeholder-subtext {
        font-size: 0.65rem;
      }
    }
  }
`,Oe=i.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
`,H=i.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 2px solid ${r.accentTeal};
  background: ${m=>m.active?r.accentTeal:"transparent"};
  color: ${m=>m.active?r.white:r.accentTeal};
  border-radius: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  flex: 1;
  min-width: 140px;
  justify-content: center;
  
  &:hover {
    background: ${r.accentTeal};
    color: ${r.white};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 576px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    min-width: 120px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`,f=i(o.Group)`
  margin-bottom: 1.5rem;
  animation: ${ke} 0.5s ease-out;

  label {
    font-weight: 600;
    color: ${r.darkGray};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    svg {
      color: ${r.accentTeal};
      width: 16px;
      height: 16px;
    }
    
    .required-badge {
      margin-left: auto;
      font-size: 0.7rem;
      background: ${r.dangerRed};
      color: ${r.white};
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
    }
  }

  .form-control, .form-select {
    border-radius: 0.75rem;
    border: 2px solid ${r.inputBorder};
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    transition: all 0.2s ease-in-out;
    background: ${r.white};
    font-weight: 500;

    &:focus {
      border-color: ${r.inputFocus};
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
      transform: translateY(-1px);
    }

    &::placeholder {
      color: ${r.textMuted};
      font-weight: 400;
    }
  }

  .form-text {
    color: ${r.textMuted};
    font-size: 0.75rem;
    margin-top: 0.375rem;
    font-style: italic;
  }

  @media (max-width: 576px) {
    margin-bottom: 1rem;
    
    label {
      font-size: 0.75rem;
    }
    
    .form-control, .form-select {
      padding: 0.75rem;
      font-size: 0.75rem;
    }
    
    .form-text {
      font-size: 0.65rem;
    }
  }
`,Ae=i.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, ${r.accentTeal} 0%, ${r.infoBlue} 100%);
  color: ${r.white};
  border: none;
  cursor: pointer;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 300px;
  margin: 1.5rem auto 0;
  min-height: 48px;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 10px 20px -5px rgba(14, 165, 233, 0.25),
      0 6px 10px -5px rgba(0, 0, 0, 0.1);
    
    &:before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    margin-right: 0.5rem;
    width: 18px;
    height: 18px;
  }

  @media (max-width: 576px) {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
    max-width: 100%;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`,N=i.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${r.mediumGray};
  
  &:last-of-type {
    border-bottom: none;
  }
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: ${r.primaryDark};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    svg {
      color: ${r.accentTeal};
      width: 20px;
      height: 20px;
    }
  }

  @media (max-width: 576px) {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    
    .section-title {
      font-size: 1rem;
      
      svg {
        width: 18px;
        height: 18px;
      }
    }
  }
`,Xe=i.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    color: ${r.primaryDark};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    
    svg {
      color: ${r.accentTeal};
      width: 28px;
      height: 28px;
    }
  }
  
  .subtitle {
    color: ${r.textMuted};
    font-size: 0.875rem;
    font-weight: 500;
  }

  @media (max-width: 576px) {
    margin-bottom: 1.5rem;
    
    h1 {
      font-size: 1.5rem;
      
      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    .subtitle {
      font-size: 0.75rem;
    }
  }
`;i.div`
  background: ${r.lightGray};
  padding: 0.75rem;
  border-radius: 0.625rem;
  margin-top: 0.5rem;
  border: 1px solid ${r.mediumGray};
  
  .currency-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .amount {
      font-weight: 600;
      color: ${r.accentTeal};
    }
    
    .conversion {
      color: ${r.textMuted};
      font-style: italic;
    }
  }

  @media (max-width: 576px) {
    padding: 0.625rem;
    
    .currency-info {
      font-size: 0.65rem;
    }
  }
`;var ar=()=>{const m=le(),C=(0,c.useRef)(null),z=(0,c.useRef)(null),[l,E]=(0,c.useState)({name:"",price:"",size:"",color:"",quantity:""}),[b,$]=(0,c.useState)([]),[h,S]=(0,c.useState)([]),[k,I]=(0,c.useState)(!1),[L,p]=(0,c.useState)(null),[M,v]=(0,c.useState)(null),[B,T]=(0,c.useState)(!1),[x,D]=(0,c.useState)("gallery"),[q,J]=(0,c.useState)("environment"),{slug:K}=de(),V=()=>K||localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||(()=>{try{const t=JSON.parse(localStorage.getItem("user")||"{}");return t.tenantSlug||t.tenant?.slug||"default"}catch{return"default"}})(),Z=()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);return a.username||a.name||"Admin"}}catch(t){console.log("Could not get user from localStorage:",t)}return"Admin"},w=t=>{const{name:a,value:s}=t.target;E({...l,[a]:s})},ee=t=>{const a=Array.from(t.target.files);if(a.length===0)return;const s=[...b],d=[...h];a.forEach(n=>{if(!n.type.startsWith("image/")){p("Please select only image files"),setTimeout(()=>p(null),5e3);return}s.push(n);const g=new FileReader;g.onloadend=()=>{d.push(g.result),d.length===s.length&&S([...d])},g.readAsDataURL(n)}),$(s)},re=t=>{const a=b.filter((d,n)=>n!==t),s=h.filter((d,n)=>n!==t);$(a),S(s)},te=()=>{x==="camera"?T(!0):C.current?.click()},ae=(0,c.useCallback)(()=>{if(z.current){const t=z.current.getScreenshot();t&&fetch(t).then(a=>a.blob()).then(a=>{const s=new File([a],`coffin-photo-${Date.now()}.jpg`,{type:"image/jpeg"}),d=[...b,s],n=[...h,t];$(d),S(n),T(!1),v("Photo captured successfully!"),setTimeout(()=>v(null),3e3)}).catch(a=>{console.error("Error processing photo:",a),p("Failed to capture photo. Please try again."),setTimeout(()=>p(null),5e3)})}},[z,b,h]),ie=()=>{J(t=>t==="user"?"environment":"user")},ne={facingMode:q,width:{ideal:1920},height:{ideal:1080}},oe=async t=>{if(t.preventDefault(),I(!0),p(null),v(null),!l.name){p("Coffin Name is required."),I(!1);return}if(!l.price||parseFloat(l.price)<=0){p("Price must be greater than 0."),I(!1);return}const a=new FormData;Object.keys(l).forEach(n=>{l[n]!==""&&a.append(n,l[n])}),a.append("created_by",Z());const s=ge();s&&a.append("branch_id",String(s));const d=localStorage.getItem("tenantId");d&&d!=="undefined"&&d!=="null"&&a.append("tenant_id",String(d)),b.forEach((n,g)=>{a.append("images",n)});try{console.log("Sending request to server...");const n=`${he.FULL_API_URL}${we.COFFINS.BASE}/register`,g=await fetch(n,{method:"POST",headers:ye(),body:a}),j=await g.json();if(console.log("Server response:",j),!g.ok)throw new Error(j.error||`Server error: ${g.status}`);if(!j.success)throw new Error(j.error||"Unknown server error");v(j.message||"Coffin registered successfully! ⚰️✅"),E({name:"",price:"",size:"",color:"",quantity:""}),$([]),S([]),C.current&&(C.current.value=""),setTimeout(()=>{v(null)},5e3)}catch(n){console.error("Error registering coffin:",n),p(n.message||"An unexpected error occurred. Please try again."),setTimeout(()=>{p(null)},5e3)}finally{I(!1)}};return(0,e.jsxs)(Ne,{children:[k&&(0,e.jsxs)(Re,{children:[(0,e.jsx)(_e,{}),(0,e.jsx)(Ge,{children:"Registering Coffin..."})]}),M&&(0,e.jsxs)(W,{children:[(0,e.jsx)(fe,{size:24}),(0,e.jsxs)("div",{className:"success-content",children:[(0,e.jsx)("h4",{children:"Success!"}),(0,e.jsx)("p",{children:M})]})]}),L&&(0,e.jsxs)(Ee,{children:[(0,e.jsx)(xe,{size:24}),(0,e.jsxs)("div",{className:"success-content",children:[(0,e.jsx)("h4",{children:"Error"}),(0,e.jsx)("p",{children:L})]})]}),B&&(0,e.jsxs)(Le,{children:[(0,e.jsx)(Ue,{onClick:()=>T(!1),children:(0,e.jsx)(_,{size:20})}),(0,e.jsxs)(Me,{children:[(0,e.jsx)(Be,{children:(0,e.jsx)(Se.default,{ref:z,audio:!1,screenshotFormat:"image/jpeg",videoConstraints:ne,className:"react-webcam",mirrored:q==="user"})}),(0,e.jsxs)(De,{children:[(0,e.jsxs)(qe,{onClick:ie,children:[(0,e.jsx)(Ce,{size:16}),"Switch Camera"]}),(0,e.jsxs)(X,{onClick:ae,primary:!0,children:[(0,e.jsx)(R,{size:16}),"Capture Photo"]}),(0,e.jsxs)(X,{onClick:()=>T(!1),children:[(0,e.jsx)(_,{size:16}),"Cancel"]})]})]})]}),(0,e.jsxs)(Pe,{blurred:k||B,children:[(0,e.jsxs)(Xe,{children:[(0,e.jsxs)("h1",{children:[(0,e.jsx)(P,{})," Register New Coffin"]}),(0,e.jsx)("div",{className:"subtitle",children:"Add coffin details to inventory management system"})]}),(0,e.jsxs)(o,{onSubmit:oe,children:[(0,e.jsxs)(N,{children:[(0,e.jsxs)("div",{className:"section-title",children:[(0,e.jsx)(P,{})," Coffin Information"]}),(0,e.jsx)(F,{children:(0,e.jsx)(u,{md:12,children:(0,e.jsxs)(f,{controlId:"formName",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(P,{})," Coffin Name",(0,e.jsx)("span",{className:"required-badge",children:"REQUIRED"})]}),(0,e.jsx)(o.Control,{type:"text",name:"name",value:l.name,onChange:w,placeholder:"e.g., Mahogany Heritage",required:!0})]})})})]}),(0,e.jsxs)(N,{children:[(0,e.jsxs)("div",{className:"section-title",children:[(0,e.jsx)(U,{})," Specifications"]}),(0,e.jsxs)(F,{children:[(0,e.jsx)(u,{md:12,lg:6,children:(0,e.jsxs)(f,{controlId:"formSize",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(U,{})," Size"]}),(0,e.jsxs)(o.Select,{name:"size",value:l.size,onChange:w,children:[(0,e.jsx)("option",{value:"",children:"Select Size (Optional)"}),(0,e.jsx)("option",{value:"Small",children:"Small"}),(0,e.jsx)("option",{value:"Standard",children:"Standard"}),(0,e.jsx)("option",{value:"Large",children:"Large"}),(0,e.jsx)("option",{value:"Extra Large",children:"Extra Large"})]})]})}),(0,e.jsx)(u,{md:12,lg:6,children:(0,e.jsxs)(f,{controlId:"formColor",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(be,{})," Color"]}),(0,e.jsx)(o.Control,{type:"text",name:"color",value:l.color,onChange:w,placeholder:"e.g., Dark Brown"})]})})]})]}),(0,e.jsxs)(N,{children:[(0,e.jsxs)("div",{className:"section-title",children:[(0,e.jsx)(Y,{})," Pricing & Inventory"]}),(0,e.jsxs)(F,{children:[(0,e.jsx)(u,{md:12,lg:6,children:(0,e.jsxs)(f,{controlId:"formPrice",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(Y,{})," Price (KES)",(0,e.jsx)("span",{className:"required-badge",children:"REQUIRED"})]}),(0,e.jsx)(o.Control,{type:"number",name:"price",value:l.price,onChange:w,placeholder:"e.g., 120000",required:!0,min:"0",step:"0.01"})]})}),(0,e.jsx)(u,{md:12,lg:6,children:(0,e.jsxs)(f,{controlId:"formQuantity",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(ve,{})," Stock Quantity"]}),(0,e.jsx)(o.Control,{type:"number",name:"quantity",value:l.quantity,onChange:w,placeholder:"e.g., 6",min:"0"}),(0,e.jsx)(o.Text,{children:"Defaults to 0 if not specified"})]})})]})]}),(0,e.jsxs)(N,{children:[(0,e.jsxs)("div",{className:"section-title",children:[(0,e.jsx)(A,{})," Coffin Images"]}),(0,e.jsx)(F,{children:(0,e.jsx)(u,{md:12,children:(0,e.jsxs)(f,{controlId:"formImageFile",children:[(0,e.jsxs)(o.Label,{children:[(0,e.jsx)(A,{})," Coffin Images"]}),(0,e.jsxs)(Oe,{children:[(0,e.jsxs)(H,{type:"button",active:x==="camera",onClick:()=>D("camera"),children:[(0,e.jsx)(R,{size:16}),"Take Photos"]}),(0,e.jsxs)(H,{type:"button",active:x==="gallery",onClick:()=>D("gallery"),children:[(0,e.jsx)(O,{size:16}),"Upload Images"]})]}),(0,e.jsx)(o.Control,{type:"file",name:"coffin_images",onChange:ee,accept:"image/*",ref:C,style:{display:"none"},multiple:!0}),(0,e.jsx)(Ye,{onClick:te,children:h.length>0?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"image-grid",children:h.map((t,a)=>(0,e.jsxs)("div",{className:"image-item",children:[(0,e.jsx)("img",{src:t,alt:`Coffin preview ${a+1}`}),(0,e.jsx)("button",{type:"button",className:"remove-btn",onClick:s=>{s.stopPropagation(),re(a)},children:(0,e.jsx)(_,{size:10})})]},a))}),(0,e.jsx)("div",{className:"overlay",children:x==="camera"?"Tap to take more photos":"Tap to add more images"})]}):(0,e.jsx)("div",{className:"placeholder-content",children:x==="camera"?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(R,{size:40}),(0,e.jsx)("div",{className:"placeholder-text",children:"Tap to take photos"}),(0,e.jsx)("div",{className:"placeholder-subtext",children:"Use your camera to capture coffin images from different angles"})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(O,{size:40}),(0,e.jsx)("div",{className:"placeholder-text",children:"Tap to upload images"}),(0,e.jsx)("div",{className:"placeholder-subtext",children:"Select existing images from your device gallery"})]})})}),(0,e.jsx)(o.Text,{children:x==="camera"?"Capture multiple photos from different angles for better documentation":"Upload multiple images (JPG, PNG up to 5MB each)"})]})})})]}),(0,e.jsx)(Ae,{type:"submit",disabled:k,children:k?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ue,{className:"animate-spin"}),"Registering..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(je,{}),"Register Coffin"]})}),(0,e.jsxs)(me,{onClick:()=>{const t=V();m(`/tenant/${t}/coffins`)},style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",padding:"1rem 2rem",borderRadius:"0.75rem",fontSize:"1rem",fontWeight:"600",background:"transparent",border:`2px solid ${r.mediumGray}`,color:r.darkGray,cursor:"pointer",transition:"all 0.3s ease",width:"100%",maxWidth:"300px",margin:"1rem auto 0"},onMouseEnter:t=>{t.currentTarget.style.borderColor=r.accentTeal,t.currentTarget.style.color=r.accentTeal,t.currentTarget.style.transform="translateY(-2px)"},onMouseLeave:t=>{t.currentTarget.style.borderColor=r.mediumGray,t.currentTarget.style.color=r.darkGray,t.currentTarget.style.transform="translateY(0)"},children:[(0,e.jsx)(ze,{size:18}),"Back to Inventory"]})]})]})]})};export{ar as default};
