import{r as se}from"./chunk-CXHxssQy.js";import{y as de}from"./chunk-CXAmgOhv.js";import{l as le,u as ce}from"./chunk-DWc5g_hH.js";import{_ as a,m as me}from"./chunk-DJYPtS2Y.js";import{o as he}from"./chunk-CwzAxjA3.js";import{o as pe}from"./chunk-BY9AVXEY.js";import{t as z}from"./chunk-eZ3__Fgx.js";import{c as B,n as X}from"./chunk-C935kdjU.js";import{t as F}from"./chunk-D61LeRbQ.js";var b=se(de(),1),e=pe(),L="https://restpoint.co.ke/api/v1/restpoint",t={ink:"#03071E",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",gray:"#6B6862",red:"#9B4A3F",redBg:"#F7ECE9",redLine:"#E8D2CC",success:"#475A43",successBg:"#EEF3EC",white:"#FFFFFF"},ge=me`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`,J=a.div`
  min-height: 100vh;
  background: ${t.bone2};
  font-family: 'Saira', sans-serif;
  color: ${t.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;
  animation: ${ge} 0.3s ease-out;
`,H=a.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: ${t.white};
  position: relative;
  overflow: hidden;

  /* Sheet watermark, like the intake form */
  &::before {
    content: 'POSTMORTEM';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 8rem;
    font-weight: 800;
    color: rgba(21, 23, 26, 0.025);
    font-family: 'Fraunces', serif;
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }
`,ue=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  border-bottom: 1px solid ${t.line};
  background: ${t.white};
  position: relative;
  flex-wrap: wrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${t.verdigris} 0%, ${t.brass} 50%, ${t.verdigris} 100%);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
  }
`,xe=a.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${t.verdigris};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 6px;

  &::before {
    content: '';
    width: 8px;
    height: 4px;
    background: ${t.brass};
    display: inline-block;
  }
`,fe=a.div`
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${t.ink};
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`,be=a.div`
  font-size: 0.8rem;
  color: ${t.gray};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-weight: 500;
`,ve=a.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: flex-start;
    text-align: left;
  }
`,T=a.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.ink};
  letter-spacing: 0.05em;

  span.label {
    display: block;
    font-weight: 400;
    color: ${t.gray};
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 2px;
  }
`,_e=a.span`
  display: inline-block;
  background: ${s=>s.$status==="completed"?t.successBg:t.redBg};
  color: ${s=>s.$status==="completed"?t.success:t.red};
  padding: 4px 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid ${s=>s.$status==="completed"?"#D5E0D3":t.redLine};
`,$=a.div`
  margin-bottom: 4rem;
  padding: 0 3rem;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 3rem;
  }

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`,k=a.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.75rem 1.25rem;
  background: ${t.ink};
  border-radius: 4px;
`,S=a.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250, 248, 244, 0.4);
  font-family: 'JetBrains Mono', monospace;
`,D=a.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.bone};
`,u=a.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
  }
`,d=a.div`
  flex: ${s=>s.$flex||1};
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 1 1 45%;
    min-width: 200px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`,l=a.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${t.brass};
  margin-bottom: 0.5rem;
  font-family: 'Saira', sans-serif;
`,x=a.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 0.5rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${s=>s.$readonly?t.gray:t.ink};
  transition: border-color 0.2s ease;
  cursor: ${s=>s.$readonly?"not-allowed":"text"};
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${t.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover { border-bottom: 1px solid ${t.ink}; }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`,ye=a.select`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 0.5rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${t.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    border: none;
    border-bottom: 1px solid ${t.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover { border-bottom: 1px solid ${t.ink}; }
`,U=a.textarea`
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0.5rem 0.5rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${t.ink};
  transition: border-color 0.2s ease;
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${t.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover { border-bottom: 1px solid ${t.ink}; }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`,je=a.div`
  border: 1px solid ${t.line};
  background: ${t.bone};
  padding: 16px;
  border-radius: 4px;
  position: relative;
  margin-bottom: 16px;
`,we=a.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: ${t.gray};
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  transition: color 0.2s;

  &:hover { color: ${t.red}; }
`,$e=a.button`
  background: transparent;
  border: 1.5px dashed ${t.brassLight};
  color: ${t.brass};
  padding: 12px;
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: ${t.verdigris};
    color: ${t.verdigris};
    background: ${t.verdigrisTint};
  }
`,ke=a.div`
  position: relative;
  border: none;
  border-bottom: 2px solid ${t.ink};
  background: ${t.bone};
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);
`,Se=a.canvas`
  width: 100%;
  height: 180px;
  cursor: crosshair;
  display: block;
  touch-action: none;
`,De=a.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: ${t.white};
  border-top: 1px solid ${t.line};
`,Ee=a.button`
  background: transparent;
  border: 1px solid ${t.line};
  padding: 6px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.65rem;
  cursor: pointer;
  border-radius: 4px;
  color: ${t.gray};
  transition: all 0.2s;

  &:hover {
    border-color: ${t.verdigris};
    color: ${t.verdigris};
    background: ${t.verdigrisTint};
  }
`,Ce=a.div`
  margin-top: 40px;
  padding: 24px 3rem;
  border-top: 1px solid ${t.line};
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 24px 1.5rem;
    flex-direction: column-reverse;

    > button { width: 100%; }
  }
`,Fe=a.button`
  background: ${t.verdigrisDark};
  color: ${t.bone};
  border: none;
  padding: 14px 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: ${t.verdigris};
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${t.gray};
    cursor: not-allowed;
    transform: none;
  }
`,Le=a.button`
  background: transparent;
  color: ${t.gray};
  border: 1px solid ${t.line};
  padding: 14px 40px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: ${t.ink};
    color: ${t.ink};
  }
`,ze=a.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: ${t.gray};
  font-size: 14px;
  gap: 12px;
`,Y=a.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${t.line};
  border-top-color: ${t.verdigrisDark};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,Je=()=>{const{deceased_id:s}=ce(),P=le(),E=(0,b.useRef)(null),[R,A]=(0,b.useState)(!0),[M,N]=(0,b.useState)(!1),[Be,Te]=(0,b.useState)(!1),[j,W]=(0,b.useState)(null),[I,G]=(0,b.useState)(null),[Q,O]=(0,b.useState)(null),[K,V]=(0,b.useState)(""),[f,m]=(0,b.useState)({pathologist_name:"",external_pathologist_name:"",external_pathologist_mobile:"",external_pathologist_id:"",examination_summary:"",cause_of_death:"",immediate_cause_of_death:"",underlying_cause_of_death:"",contributing_conditions:"",manner_of_death:"",requesting_authority:"",custom_findings:"",staff_username:"",mortuary_name:""}),[w,C]=(0,b.useState)([]);(0,b.useEffect)(()=>{V(new Date().toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}));const n=`REQ-${s}-${Date.now().toString(36).toUpperCase()}`;O(n),Z()},[s]);const Z=async()=>{if(s){A(!0);try{const n={"x-tenant-slug":B(),Authorization:`Bearer ${X()}`},o=await z.get(`${L}/deceased/${s}`,{headers:n});o.data?.success&&o.data?.data&&W(o.data.data);const c=await z.get(`${L}/deceased/postmortem/${s}`,{headers:n});if(c.data?.success&&c.data?.data){const r=c.data.data;if(G(r),r.request_id||r.tracking_number){const i=r.request_id||r.tracking_number;O(i)}r.pathologist_name&&m(i=>({...i,pathologist_name:r.pathologist_name})),r.external_pathologist_name&&m(i=>({...i,external_pathologist_name:r.external_pathologist_name})),r.external_pathologist_mobile&&m(i=>({...i,external_pathologist_mobile:r.external_pathologist_mobile})),r.external_pathologist_id&&m(i=>({...i,external_pathologist_id:r.external_pathologist_id})),r.examination_summary&&m(i=>({...i,examination_summary:r.examination_summary})),r.cause_of_death&&m(i=>({...i,cause_of_death:r.cause_of_death})),r.immediate_cause_of_death&&m(i=>({...i,immediate_cause_of_death:r.immediate_cause_of_death})),r.underlying_cause_of_death&&m(i=>({...i,underlying_cause_of_death:r.underlying_cause_of_death})),r.contributing_conditions&&m(i=>({...i,contributing_conditions:r.contributing_conditions})),r.manner_of_death&&m(i=>({...i,manner_of_death:r.manner_of_death})),r.requesting_authority&&m(i=>({...i,requesting_authority:r.requesting_authority})),r.custom_findings&&m(i=>({...i,custom_findings:r.custom_findings})),r.staff_username&&m(i=>({...i,staff_username:r.staff_username})),r.mortuary_name&&m(i=>({...i,mortuary_name:r.mortuary_name})),r.findings&&Array.isArray(r.findings)&&r.findings.length>0&&C(r.findings)}}catch(n){console.error("Error loading data:",n),n.response?.status!==404&&F.error("Failed to load deceased information")}finally{A(!1)}}};(0,b.useEffect)(()=>{const n=E.current;if(!n)return;const o=n.getContext("2d");let c=!1;const r=()=>{const p=n.getBoundingClientRect(),g=window.devicePixelRatio||1;n.width=p.width*g,n.height=p.height*g,o.scale(g,g),o.lineWidth=3,o.lineCap="round",o.strokeStyle="#0f33e7"};r(),window.addEventListener("resize",r);const i=p=>{const g=n.getBoundingClientRect(),oe=p.touches?p.touches[0].clientX:p.clientX,ae=p.touches?p.touches[0].clientY:p.clientY;return{x:oe-g.left,y:ae-g.top}},y=p=>{p.preventDefault(),c=!0;const g=i(p);o.beginPath(),o.moveTo(g.x,g.y)},_=p=>{if(p.preventDefault(),!c)return;const g=i(p);o.lineTo(g.x,g.y),o.stroke(),o.beginPath(),o.moveTo(g.x,g.y)},h=()=>{c=!1,o.beginPath()};return n.addEventListener("mousedown",y),n.addEventListener("mousemove",_),n.addEventListener("mouseup",h),n.addEventListener("mouseleave",h),n.addEventListener("touchstart",y),n.addEventListener("touchmove",_),n.addEventListener("touchend",h),()=>{window.removeEventListener("resize",r),n.removeEventListener("mousedown",y),n.removeEventListener("mousemove",_),n.removeEventListener("mouseup",h),n.removeEventListener("mouseleave",h),n.removeEventListener("touchstart",y),n.removeEventListener("touchmove",_),n.removeEventListener("touchend",h)}},[R]);const ee=()=>{const n=E.current;n&&n.getContext("2d").clearRect(0,0,n.width,n.height)},te=()=>{const n=E.current;return!n||!n.getContext("2d").getImageData(0,0,n.width,n.height).data.some((o,c)=>c%4!==3&&o!==0)?null:n.toDataURL("image/png")},v=n=>o=>{m(c=>({...c,[n]:o.target.value}))},q=(n,o)=>c=>{const r=[...w];r[n]={...r[n],[o]:c.target.value},C(r)},ne=()=>{C(n=>[...n,{title:"",description:""}])},re=n=>{w.length<=1||C(o=>o.filter((c,r)=>r!==n))},ie=async n=>{n.preventDefault(),N(!0);try{const o=B();let c="";try{const h=JSON.parse(localStorage.getItem("user")||"{}");c=h.email||h.username||""}catch{}const r={deceased_id:s,...f,findings:w.filter(h=>h.title||h.description),custom_findings:f.custom_findings||null,status:"completed",updated_by:c},i=te();i&&(r.signature_base64=i);const y=X(),_=await z.post(`${L}/deceased/postmortem/save`,r,{headers:{"x-tenant-slug":o,Authorization:`Bearer ${y}`}});_.data?.success?(F.success("Examination record saved successfully! Status set to COMPLETED."),setTimeout(()=>{window.open(`${L}/deceased/postmortem/${s}/pdf`,"_blank")},800),setTimeout(()=>{const h=B();P(`/tenant/${h}/deceased?id=${encodeURIComponent(s)}`)},1500)):F.error(_.data?.message||"Failed to save record")}catch(o){console.error("Submit error:",o),F.error(o.response?.data?.message||"Network error occurred while saving.")}finally{N(!1)}};return R?(0,e.jsx)(J,{children:(0,e.jsx)(H,{children:(0,e.jsxs)(ze,{children:[(0,e.jsx)(Y,{}),"Loading deceased information..."]})})}):(0,e.jsxs)(J,{children:[(0,e.jsx)(he,{position:"top-right"}),(0,e.jsxs)(H,{children:[(0,e.jsxs)(ue,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(xe,{children:"RestPoint Mortuary"}),(0,e.jsx)(fe,{children:"Examination Report"}),(0,e.jsx)(be,{children:"Department of Forensics"})]}),(0,e.jsxs)(ve,{children:[(0,e.jsxs)(T,{children:[(0,e.jsx)("span",{className:"label",children:"Tracking Number"}),Q||"Generating..."]}),(0,e.jsxs)(T,{children:[(0,e.jsx)("span",{className:"label",children:"Date & Time"}),K]}),(0,e.jsxs)(T,{children:[(0,e.jsx)("span",{className:"label",children:"Status"}),(0,e.jsx)(_e,{$status:I?.status==="completed"?"completed":"pending",children:I?.status==="completed"?"Completed":"Pending"})]})]})]}),(0,e.jsxs)("form",{onSubmit:ie,children:[(0,e.jsxs)($,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(S,{children:"01"}),(0,e.jsx)(D,{children:"Case & Decedent Information"})]}),(0,e.jsxs)(u,{children:[(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Deceased ID"}),(0,e.jsx)(x,{type:"text",value:s||"",$readonly:!0,readOnly:!0})]}),(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Deceased Name"}),(0,e.jsx)(x,{type:"text",value:j?.full_name||"Loading...",$readonly:!0,readOnly:!0})]}),(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Admission No."}),(0,e.jsx)(x,{type:"text",value:j?.admission_number||j?.admission_no||"N/A",$readonly:!0,readOnly:!0})]})]}),(0,e.jsxs)(u,{children:[(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Requesting Authority"}),(0,e.jsx)(x,{type:"text",value:f.requesting_authority,onChange:v("requesting_authority"),placeholder:"e.g., Metropolitan Police Dept"})]}),(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Date of Death"}),(0,e.jsx)(x,{type:"text",value:j?.date_of_death?new Date(j.date_of_death).toLocaleDateString():"N/A",$readonly:!0,readOnly:!0})]})]})]}),(0,e.jsxs)($,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(S,{children:"02"}),(0,e.jsx)(D,{children:"Examining Pathologist"})]}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Internal Pathologist (Staff)"}),(0,e.jsx)(x,{type:"text",value:f.pathologist_name,onChange:v("pathologist_name"),placeholder:"Dr. John Doe"})]})}),(0,e.jsxs)(u,{children:[(0,e.jsxs)(d,{$flex:2,children:[(0,e.jsx)(l,{children:"External Pathologist Name"}),(0,e.jsx)(x,{type:"text",value:f.external_pathologist_name,onChange:v("external_pathologist_name"),placeholder:"Leave blank if internal"})]}),(0,e.jsxs)(d,{$flex:2,children:[(0,e.jsx)(l,{children:"External Pathologist Mobile"}),(0,e.jsx)(x,{type:"text",value:f.external_pathologist_mobile,onChange:v("external_pathologist_mobile"),placeholder:"(XXX) XXX-XXXX"})]})]}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{$flex:2,children:[(0,e.jsx)(l,{children:"External Pathologist ID / License"}),(0,e.jsx)(x,{type:"text",value:f.external_pathologist_id,onChange:v("external_pathologist_id"),placeholder:"License or professional ID"})]})})]}),(0,e.jsxs)($,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(S,{children:"03"}),(0,e.jsx)(D,{children:"Official Determination of Death"})]}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Immediate Cause of Death"}),(0,e.jsx)(x,{type:"text",value:f.immediate_cause_of_death,onChange:v("immediate_cause_of_death"),placeholder:"The final disease, injury, or complication resulting in death"})]})}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Underlying Cause of Death"}),(0,e.jsx)(x,{type:"text",value:f.underlying_cause_of_death,onChange:v("underlying_cause_of_death"),placeholder:"The disease or injury that initiated the chain of events"})]})}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Contributing Conditions"}),(0,e.jsx)(x,{type:"text",value:f.contributing_conditions,onChange:v("contributing_conditions"),placeholder:"Other significant conditions contributing to death"})]})}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Manner of Death"}),(0,e.jsxs)(ye,{value:f.manner_of_death,onChange:v("manner_of_death"),children:[(0,e.jsx)("option",{value:"",children:"Select manner of death"}),(0,e.jsx)("option",{value:"Natural",children:"Natural"}),(0,e.jsx)("option",{value:"Accident",children:"Accident"}),(0,e.jsx)("option",{value:"Suicide",children:"Suicide"}),(0,e.jsx)("option",{value:"Homicide",children:"Homicide"}),(0,e.jsx)("option",{value:"Undetermined",children:"Undetermined"})]})]})})]}),(0,e.jsxs)($,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(S,{children:"04"}),(0,e.jsx)(D,{children:"Examination Summary & Findings"})]}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Examination Summary / Pathologist Statement"}),(0,e.jsx)(U,{value:f.examination_summary,onChange:v("examination_summary"),placeholder:"Provide a clear, narrative summary of the autopsy findings, correlating external and internal examination, histology, and investigative history.",rows:5})]})}),(0,e.jsx)(u,{style:{marginBottom:"12px"},children:(0,e.jsx)(d,{children:(0,e.jsx)(l,{children:"Additional Specific Findings (Organ Systems / Trauma)"})})}),w.map((n,o)=>(0,e.jsxs)(je,{children:[w.length>1&&(0,e.jsx)(we,{type:"button",onClick:()=>re(o),children:"×"}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{$flex:3,children:[(0,e.jsx)(l,{children:"Finding Title / Organ System"}),(0,e.jsx)(x,{type:"text",value:n.title,onChange:q(o,"title"),placeholder:"e.g., Cardiovascular System"})]})}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Description / Details"}),(0,e.jsx)(U,{value:n.description,onChange:q(o,"description"),placeholder:"Describe specific findings, weights, abnormalities, etc.",rows:3})]})})]},o)),(0,e.jsx)($e,{type:"button",onClick:ne,children:"+ Add Finding Section"})]}),(0,e.jsxs)($,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)(S,{children:"05"}),(0,e.jsx)(D,{children:"Examiner Signature"})]}),(0,e.jsx)(u,{children:(0,e.jsxs)(d,{children:[(0,e.jsx)(l,{children:"Draw Signature Below"}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(Se,{ref:E}),(0,e.jsx)(De,{children:(0,e.jsx)(Ee,{type:"button",onClick:ee,children:"Clear Signature"})})]})]})})]}),(0,e.jsxs)(Ce,{children:[(0,e.jsx)(Le,{type:"button",onClick:()=>P(-1),children:"Cancel"}),(0,e.jsx)(Fe,{type:"submit",disabled:M,children:M?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Y,{style:{width:16,height:16,borderWidth:2}}),"Saving..."]}):"Save Examination Record"})]})]})]})]})};export{Je as default};
