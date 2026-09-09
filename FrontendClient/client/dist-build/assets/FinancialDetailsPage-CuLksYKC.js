import{r as ee}from"./chunk-CXHxssQy.js";import{y as we}from"./chunk-CXAmgOhv.js";import{l as $e,u as Se}from"./chunk-DWc5g_hH.js";import{_ as i,m as _e}from"./chunk-DJYPtS2Y.js";import{r as Ce}from"./chunk-CwzAxjA3.js";import{o as ke}from"./chunk-BY9AVXEY.js";import{t as re}from"./chunk-eZ3__Fgx.js";var d=ee(we(),1),P=ee(Ce(),1),e=ke(),te="https://restpoint.co.ke/api/v1/restpoint/api/v1/restpoint",r={primary:"#1a5f7a",primaryDark:"#134b5f",white:"#FFFFFF",bg:"#f5f7fa",surface:"#ffffff",border:"#d1d5db",text:"#111827",textSecondary:"#6b7280",success:"#10b981",successDark:"#059669",warning:"#f59e0b",danger:"#ef4444",info:"#3b82f6",radius:"8px",radiusSm:"6px",shadowSm:"0 1px 2px rgba(0, 0, 0, 0.04)",shadowMd:"0 4px 6px rgba(0, 0, 0, 0.06)",shadowLg:"0 10px 15px rgba(0, 0, 0, 0.08)",transition:"all 0.15s ease"},ae=_e`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`,O=i.div`
  min-height: 100vh;
  background: ${r.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${r.text};
`,Fe=i.div`
  background: ${r.surface};
  border-bottom: 1px solid ${r.border};
  padding: 1.25rem 2rem;
  box-shadow: ${r.shadowSm};
`,Ee=i.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`,De=i.h1`
  font-size: 1.375rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: ${r.text};
`,ze=i.p`
  color: ${r.textSecondary};
  font-size: 0.8125rem;
  margin: 0.25rem 0 0;
`,Be=i.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`,G=i.button`
  background: ${a=>a.$bg||r.primary};
  color: ${r.white};
  border: none;
  border-radius: ${r.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${r.transition};
  box-shadow: ${r.shadowSm};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${r.shadowMd};
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Pe=i.button`
  background: ${r.surface};
  color: ${r.primary};
  border: 1px solid ${r.border};
  border-radius: ${r.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${r.transition};

  &:hover {
    background: ${r.bg};
    border-color: ${r.primary};
  }
`,Te=i.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`,Re=i.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`,k=i.div`
  background: ${r.surface};
  border-left: 4px solid ${a=>a.$border||r.primary};
  padding: 1.25rem;
  border-radius: ${r.radius};
  box-shadow: ${r.shadowSm};
  transition: ${r.transition};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${r.shadowMd};
  }

  .label {
    font-size: 0.75rem;
    color: ${r.textSecondary};
    margin-bottom: 0.375rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${r.text};
  }

  .subtext {
    font-size: 0.6875rem;
    color: ${r.textSecondary};
    margin-top: 0.25rem;
  }
`,T=i.div`
  background: ${r.surface};
  border-radius: ${r.radius};
  box-shadow: ${r.shadowSm};
  border: 1px solid ${r.border};
  overflow: hidden;
  margin-bottom: 1.25rem;
  animation: ${ae} 0.25s ease-out;
`,R=i.div`
  padding: 0.875rem 1.125rem;
  border-bottom: 1px solid ${r.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${r.bg};
`,L=i.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${r.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,N=i.span`
  background: ${a=>a.$bg||r.primary};
  color: ${r.white};
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
`,M=i.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  thead {
    background: ${a=>a.$header||r.primary};
    color: ${r.white};

    th {
      padding: 0.625rem 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  }

  tbody tr {
    border-bottom: 1px solid ${r.border};
    transition: background 0.2s ease;

    &:hover {
      background: ${r.bg};
    }

    td {
      padding: 0.625rem 0.75rem;
      color: ${r.text};
    }
  }
`,W=i.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: ${a=>a.$status==="paid"?"#D1FAE5":a.$status==="partial"?"#FEF3C7":a.$status==="pending"||a.$status==="unpaid"?"#FEE2E2":"#E5E7EB"};
  color: ${a=>a.$status==="paid"?"#065F46":a.$status==="partial"?"#92400E":a.$status==="pending"||a.$status==="unpaid"?"#DC2626":"#374151"};
`,A=i.div`
  text-align: center;
  padding: 2rem 1rem;
  color: ${r.textSecondary};

  .icon { font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.5; }
  p { margin: 0.25rem 0; font-size: 0.875rem; }
  .subtext { font-size: 0.75rem; color: ${r.textSecondary}; }
`,F=i.button`
  background: none;
  border: none;
  color: ${a=>a.$color||r.primary};
  cursor: pointer;
  padding: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 0.25rem;

  &:hover:not(:disabled) {
    background: ${a=>a.$bg||r.bg};
    transform: scale(1.1);
  }

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`,X=i.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  backdrop-filter: blur(3px);
`,J=i.div`
  background: ${r.surface};
  border-radius: ${r.radius};
  box-shadow: ${r.shadowLg};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${ae} 0.2s ease-out;
`,Q=i.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${r.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${r.bg};

  h3 { margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
`,V=i.div`
  padding: 1.25rem;
`,Z=i.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid ${r.border};
`,x=i.div`
  margin-bottom: 1rem;

  label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${r.text};
    margin-bottom: 0.375rem;
  }
`,p=i.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid ${r.border};
  font-size: 0.875rem;
  font-family: inherit;
  transition: ${r.transition};

  &:focus {
    outline: none;
    border-color: ${r.primary};
    box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.1);
  }
`,Le=i.select`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid ${r.border};
  font-size: 0.875rem;
  font-family: inherit;
  background: ${r.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${r.primary};
    box-shadow: 0 0 0 3px rgba(26, 95, 122, 0.1);
  }
`,E=i.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`,D=i.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${a=>a.$variant==="primary"?r.primary:a.$variant==="danger"?r.danger:r.border};
  background: ${a=>a.$variant==="primary"?r.primary:a.$variant==="danger"?r.danger:r.white};
  color: ${a=>a.$variant==="primary"||a.$variant==="danger"?r.white:r.text};
  cursor: pointer;
  transition: ${r.transition};
  font-family: inherit;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${r.shadowMd};
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`,Ne=i.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: ${r.textSecondary};
`,ne=()=>localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||"default",m=re.create({baseURL:te,headers:{"Content-Type":"application/json"}});m.interceptors.request.use(a=>{const j=localStorage.getItem("authToken"),c=ne();return j&&(a.headers.Authorization=`Bearer ${j}`),c&&c!=="default"&&(a.headers["x-tenant-slug"]=c),a});var Ye=()=>{const{id:a}=Se(),j=$e(),[c,se]=(0,d.useState)(null),[v,ie]=(0,d.useState)([]),[w,oe]=(0,d.useState)([]),[$,de]=(0,d.useState)([]),[l,le]=(0,d.useState)({total_charges:0,mortuary_charges:0,extra_charges:0,total_payments:0,balance:0}),[ce,I]=(0,d.useState)(!0),[he,f]=(0,d.useState)(!1),[me,b]=(0,d.useState)(!1),[S,_]=(0,d.useState)(!1),g=(0,d.useCallback)(async()=>{if(a){I(!0);try{const t={"x-tenant-slug":ne()},[n,h,s,C]=await Promise.all([re.get(`${te}/deceased/${a}`,{headers:t}).catch(()=>({data:{data:null}})),m.get(`/invoices/payments/${a}`,{headers:t}).catch(()=>({data:{data:[]}})),m.get(`/invoices/extra-charges/${a}`,{headers:t}).catch(()=>({data:{data:[]}})),m.get(`/invoices/deceased/${a}`,{headers:t}).catch(()=>({data:{data:[]}}))]),u=n.data?.data||n.data||{},y=h.data?.data||[],q=s.data?.data||[],ve=C.data?.data||[];se(u),ie(y),oe(q),de(ve);const K=parseFloat(u?.total_mortuary_charge||u?.billing||0),U=q.reduce((z,B)=>z+(parseFloat(B.amount)||0),0),H=y.reduce((z,B)=>z+(parseFloat(B.amount)||0),0),Y=K+U;le({total_charges:Y,mortuary_charges:K,extra_charges:U,total_payments:H,balance:Y-H})}catch(t){console.error("Error fetching financial data:",t)}finally{I(!1)}}},[a]);(0,d.useEffect)(()=>{g()},[g]);const o=(t,n)=>{P.default.fire({toast:!0,position:"top-end",icon:t,title:n,showConfirmButton:!1,timer:3e3,timerProgressBar:!0})},ue=async t=>{_(!0);try{const n=await m.post("/invoices/payment",{deceased_id:a,amount:parseFloat(t.amount),payment_method:t.payment_method,reference_code:t.reference_code,description:t.description});if(n.data?.status==="success")o("success","Payment recorded successfully!"),f(!1),g();else throw new Error(n.data?.message||"Failed to record payment")}catch(n){o("error",n.response?.data?.message||n.message||"Failed to record payment")}finally{_(!1)}},xe=async t=>{_(!0);try{const n=await m.post("/invoices/extra-charge",{deceased_id:a,charge_type:t.charge_type,amount:parseFloat(t.amount),description:t.description,notes:t.notes,service_date:t.service_date});if(n.data?.status==="success")o("success","Extra charge added successfully!"),b(!1),g();else throw new Error(n.data?.message||"Failed to add charge")}catch(n){o("error",n.response?.data?.message||n.message||"Failed to add charge")}finally{_(!1)}},pe=async t=>{if((await P.default.fire({title:"Delete Extra Charge?",text:"This will be permanently removed",icon:"warning",showCancelButton:!0,confirmButtonColor:"#d33",confirmButtonText:"Yes, delete it!"})).isConfirmed)try{const n=await m.delete(`/invoices/extra-charge/${t}`);if(n.data?.status==="success"||n.data?.success)o("success","Charge deleted successfully!"),g();else throw new Error("Failed to delete charge")}catch(n){o("error",n.response?.data?.message||n.message||"Failed to delete charge")}},ge=async t=>{if((await P.default.fire({title:"Delete Invoice?",text:"This will be permanently removed",icon:"warning",showCancelButton:!0,confirmButtonColor:"#d33",confirmButtonText:"Yes, delete it!"})).isConfirmed)try{if((await m.delete(`/invoices/${t}`)).data?.status==="success")o("success","Invoice deleted successfully!"),g();else throw new Error("Failed to delete invoice")}catch(n){o("error",n.response?.data?.message||n.message||"Failed to delete invoice")}},fe=async t=>{try{const n=await m.get(`/invoices/${t}/download`,{responseType:"blob"}),h=n.headers["content-disposition"];let s=`invoice-${t}.pdf`;if(h){const y=h.match(/filename="?(.+?)"?$/);y&&(s=y[1])}const C=window.URL.createObjectURL(new Blob([n.data])),u=document.createElement("a");u.href=C,u.download=s,document.body.appendChild(u),u.click(),u.remove(),window.URL.revokeObjectURL(C),o("success","Invoice downloaded!")}catch{o("error","Failed to download invoice")}},be=async t=>{try{const n=await m.get(`/invoices/${t}/download`,{responseType:"blob"}),h=window.URL.createObjectURL(new Blob([n.data],{type:"application/pdf"})),s=window.open(h,"_blank");s&&(s.onload=()=>setTimeout(()=>s.print(),500))}catch{o("error","Failed to print invoice")}},ye=()=>{const[t,n]=(0,d.useState)({amount:"",payment_method:"Cash",reference_code:"",description:`Payment for ${c?.full_name||"deceased"}`}),h=s=>{if(s.preventDefault(),!t.amount||parseFloat(t.amount)<=0){o("error","Please enter a valid amount");return}ue(t)};return(0,e.jsx)(X,{onClick:()=>f(!1),children:(0,e.jsxs)(J,{onClick:s=>s.stopPropagation(),children:[(0,e.jsxs)(Q,{children:[(0,e.jsx)("h3",{children:"💰 Record Payment"}),(0,e.jsx)("button",{onClick:()=>f(!1),style:{background:"none",border:"none",cursor:"pointer",fontSize:"1.25rem"},children:"✕"})]}),(0,e.jsxs)(V,{children:[(0,e.jsxs)("div",{style:{background:"#EFF6FF",padding:"0.75rem 1rem",borderRadius:"0.5rem",marginBottom:"1rem",fontSize:"0.875rem"},children:[(0,e.jsx)("strong",{children:"Recording payment for:"})," ",c?.full_name||"Unknown"," (",c?.deceased_id||a,")"]}),(0,e.jsxs)("form",{onSubmit:h,children:[(0,e.jsxs)(E,{children:[(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Amount (KES) *"}),(0,e.jsx)(p,{type:"number",step:"0.01",min:"0",placeholder:"0.00",value:t.amount,onChange:s=>n({...t,amount:s.target.value}),required:!0})]}),(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Payment Method *"}),(0,e.jsxs)(Le,{value:t.payment_method,onChange:s=>n({...t,payment_method:s.target.value}),children:[(0,e.jsx)("option",{value:"Cash",children:"Cash"}),(0,e.jsx)("option",{value:"M-Pesa",children:"M-Pesa"}),(0,e.jsx)("option",{value:"Bank Transfer",children:"Bank Transfer"}),(0,e.jsx)("option",{value:"Cheque",children:"Cheque"}),(0,e.jsx)("option",{value:"Card",children:"Card"})]})]})]}),(0,e.jsxs)(E,{children:[(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Reference Code"}),(0,e.jsx)(p,{type:"text",placeholder:"Optional",value:t.reference_code,onChange:s=>n({...t,reference_code:s.target.value})})]}),(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Description"}),(0,e.jsx)(p,{type:"text",value:t.description,onChange:s=>n({...t,description:s.target.value})})]})]}),(0,e.jsxs)(Z,{style:{padding:"1rem 0 0",borderTop:`1px solid ${r.border}`,marginTop:"1rem"},children:[(0,e.jsx)(D,{type:"button",onClick:()=>f(!1),children:"Cancel"}),(0,e.jsx)(D,{type:"submit",$variant:"primary",disabled:S,children:S?"Recording...":"💰 Record Payment"})]})]})]})]})})},je=()=>{const[t,n]=(0,d.useState)({charge_type:"",amount:"",description:"",notes:"",service_date:new Date().toISOString().split("T")[0]}),h=s=>{if(s.preventDefault(),!t.charge_type||!t.amount||parseFloat(t.amount)<=0){o("error","Please fill in all required fields");return}xe(t)};return(0,e.jsx)(X,{onClick:()=>b(!1),children:(0,e.jsxs)(J,{onClick:s=>s.stopPropagation(),children:[(0,e.jsxs)(Q,{children:[(0,e.jsx)("h3",{children:"📋 Add Extra Charge"}),(0,e.jsx)("button",{onClick:()=>b(!1),style:{background:"none",border:"none",cursor:"pointer",fontSize:"1.25rem"},children:"✕"})]}),(0,e.jsx)(V,{children:(0,e.jsxs)("form",{onSubmit:h,children:[(0,e.jsxs)(E,{children:[(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Charge Type *"}),(0,e.jsx)(p,{type:"text",placeholder:"e.g., Transportation, Special Casket",value:t.charge_type,onChange:s=>n({...t,charge_type:s.target.value}),required:!0})]}),(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Amount (KES) *"}),(0,e.jsx)(p,{type:"number",step:"0.01",min:"0",placeholder:"0.00",value:t.amount,onChange:s=>n({...t,amount:s.target.value}),required:!0})]})]}),(0,e.jsxs)(E,{children:[(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Service Date"}),(0,e.jsx)(p,{type:"date",value:t.service_date,onChange:s=>n({...t,service_date:s.target.value})})]}),(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Description"}),(0,e.jsx)(p,{type:"text",placeholder:"Brief description",value:t.description,onChange:s=>n({...t,description:s.target.value})})]})]}),(0,e.jsxs)(x,{children:[(0,e.jsx)("label",{children:"Notes"}),(0,e.jsx)(p,{type:"text",placeholder:"Additional notes (optional)",value:t.notes,onChange:s=>n({...t,notes:s.target.value})})]}),(0,e.jsxs)(Z,{style:{padding:"1rem 0 0",borderTop:`1px solid ${r.border}`,marginTop:"1rem"},children:[(0,e.jsx)(D,{type:"button",onClick:()=>b(!1),children:"Cancel"}),(0,e.jsx)(D,{type:"submit",$variant:"primary",disabled:S,children:S?"Adding...":"📋 Add Charge"})]})]})})]})})};return ce?(0,e.jsx)(O,{children:(0,e.jsx)(Ne,{children:"Loading financial details..."})}):(0,e.jsxs)(O,{children:[(0,e.jsx)(Fe,{children:(0,e.jsxs)(Ee,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(De,{children:["💰 Financial Details",c?.full_name&&(0,e.jsxs)("span",{style:{fontSize:"0.875rem",color:r.textSecondary,fontWeight:400},children:[" - ",c.full_name]})]}),(0,e.jsxs)(ze,{children:["Ref: ",c?.deceased_id||a," • Manage payments, charges, and invoices"]})]}),(0,e.jsxs)(Be,{children:[(0,e.jsx)(G,{$bg:r.successDark,onClick:()=>f(!0),children:"💳 Record Payment"}),(0,e.jsx)(G,{$bg:r.warning,onClick:()=>b(!0),children:"📋 Add Charge"}),(0,e.jsx)(Pe,{onClick:()=>j(-1),children:"← Back"})]})]})}),(0,e.jsxs)(Te,{children:[(0,e.jsxs)(Re,{children:[(0,e.jsxs)(k,{$border:r.primary,children:[(0,e.jsx)("div",{className:"label",children:"Total Charges"}),(0,e.jsxs)("div",{className:"value",children:["KES ",l.total_charges.toLocaleString()]}),(0,e.jsxs)("div",{className:"subtext",children:["Base: KES ",l.mortuary_charges.toLocaleString()," • Extra: KES ",l.extra_charges.toLocaleString()]})]}),(0,e.jsxs)(k,{$border:r.successDark,children:[(0,e.jsx)("div",{className:"label",children:"Total Payments"}),(0,e.jsxs)("div",{className:"value",children:["KES ",l.total_payments.toLocaleString()]}),(0,e.jsxs)("div",{className:"subtext",children:[v.length," payment(s)"]})]}),(0,e.jsxs)(k,{$border:l.balance>0?r.warning:r.info,children:[(0,e.jsx)("div",{className:"label",style:{color:l.balance>0?r.warning:r.info},children:l.balance>0?"Balance Due":"Fully Paid"}),(0,e.jsxs)("div",{className:"value",style:{color:l.balance>0?r.danger:r.successDark},children:["KES ",Math.abs(l.balance).toLocaleString()]}),(0,e.jsxs)("div",{className:"subtext",children:[$.length," invoice(s)"]})]}),(0,e.jsxs)(k,{$border:r.textSecondary,children:[(0,e.jsx)("div",{className:"label",children:"Status"}),(0,e.jsx)("div",{className:"value",children:(0,e.jsx)(W,{$status:l.balance>0?"pending":"paid",children:l.balance>0?"⏳ Pending":"✅ Paid"})}),(0,e.jsxs)("div",{className:"subtext",children:[w.length," extra charge(s)"]})]})]}),(0,e.jsxs)(T,{children:[(0,e.jsxs)(R,{children:[(0,e.jsx)(L,{children:"💳 Payment History"}),(0,e.jsxs)(N,{$bg:r.successDark,children:[v.length," payments"]})]}),(0,e.jsx)("div",{style:{maxHeight:"300px",overflowY:"auto"},children:v.length===0?(0,e.jsxs)(A,{children:[(0,e.jsx)("div",{className:"icon",children:"💳"}),(0,e.jsx)("p",{children:"No payments recorded"}),(0,e.jsx)("p",{className:"subtext",children:'Click "Record Payment" to add one'})]}):(0,e.jsxs)(M,{$header:r.successDark,children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Method"}),(0,e.jsx)("th",{children:"Reference"}),(0,e.jsx)("th",{children:"Description"})]})}),(0,e.jsx)("tbody",{children:v.map(t=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:new Date(t.payment_date||t.created_at).toLocaleDateString()}),(0,e.jsx)("td",{children:(0,e.jsxs)("strong",{style:{color:r.successDark},children:["KES ",parseFloat(t.amount||0).toLocaleString()]})}),(0,e.jsx)("td",{children:(0,e.jsx)("span",{style:{background:"#E5E7EB",padding:"0.25rem 0.5rem",borderRadius:"0.375rem",fontSize:"0.6875rem"},children:t.payment_method})}),(0,e.jsx)("td",{style:{color:r.textSecondary,fontSize:"0.75rem"},children:t.reference_code||t.reference_number||"N/A"}),(0,e.jsx)("td",{style:{fontSize:"0.75rem",color:r.textSecondary},children:t.description||"-"})]},t.payment_id||t.id))})]})})]}),(0,e.jsxs)(T,{children:[(0,e.jsxs)(R,{children:[(0,e.jsx)(L,{children:"📋 Extra Charges"}),(0,e.jsxs)(N,{$bg:r.warning,children:[w.length," charges"]})]}),(0,e.jsx)("div",{style:{maxHeight:"300px",overflowY:"auto"},children:w.length===0?(0,e.jsxs)(A,{children:[(0,e.jsx)("div",{className:"icon",children:"📋"}),(0,e.jsx)("p",{children:"No extra charges"}),(0,e.jsx)("p",{className:"subtext",children:'Click "Add Charge" to add one'})]}):(0,e.jsxs)(M,{$header:r.warning,children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Description"}),(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Actions"})]})}),(0,e.jsx)("tbody",{children:w.map(t=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsx)("strong",{children:t.charge_type})}),(0,e.jsx)("td",{children:(0,e.jsxs)("strong",{style:{color:r.warning},children:["KES ",parseFloat(t.amount||0).toLocaleString()]})}),(0,e.jsxs)("td",{children:[(0,e.jsx)("div",{children:t.description}),t.notes&&(0,e.jsx)("div",{style:{fontSize:"0.6875rem",color:r.textSecondary},children:t.notes})]}),(0,e.jsx)("td",{style:{fontSize:"0.75rem"},children:new Date(t.service_date||t.created_at).toLocaleDateString()}),(0,e.jsx)("td",{children:(0,e.jsx)(F,{$color:r.danger,onClick:()=>pe(t.id||t.charge_id),title:"Delete",children:"🗑️"})})]},t.id||t.charge_id))})]})})]}),(0,e.jsxs)(T,{children:[(0,e.jsxs)(R,{children:[(0,e.jsx)(L,{children:"🧾 Invoices"}),(0,e.jsxs)(N,{$bg:r.primary,children:[$.length," invoices"]})]}),(0,e.jsx)("div",{style:{overflowX:"auto"},children:$.length===0?(0,e.jsxs)(A,{children:[(0,e.jsx)("div",{className:"icon",children:"🧾"}),(0,e.jsx)("p",{children:"No invoices generated yet"}),(0,e.jsx)("p",{className:"subtext",children:"Generate an invoice from the deceased profile"})]}):(0,e.jsxs)(M,{$header:r.primary,children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Invoice #"}),(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Status"}),(0,e.jsx)("th",{children:"Actions"})]})}),(0,e.jsx)("tbody",{children:$.map(t=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:(0,e.jsx)("strong",{children:t.invoice_number})}),(0,e.jsx)("td",{style:{fontSize:"0.75rem"},children:new Date(t.created_at).toLocaleDateString()}),(0,e.jsx)("td",{children:(0,e.jsxs)("strong",{style:{color:r.info},children:["KES ",parseFloat(t.total_amount||0).toLocaleString()]})}),(0,e.jsx)("td",{children:(0,e.jsx)(W,{$status:t.payment_status||"unpaid",children:t.payment_status||"unpaid"})}),(0,e.jsx)("td",{children:(0,e.jsxs)("div",{style:{display:"flex",gap:"0.25rem"},children:[(0,e.jsx)(F,{$color:r.info,onClick:()=>fe(t.id||t.invoice_id),title:"Download",children:"⬇️"}),(0,e.jsx)(F,{$color:r.text,onClick:()=>be(t.id||t.invoice_id),title:"Print",children:"🖨️"}),(0,e.jsx)(F,{$color:r.danger,onClick:()=>ge(t.id||t.invoice_id),title:"Delete",children:"🗑️"})]})})]},t.id||t.invoice_id))})]})})]})]}),he&&(0,e.jsx)(ye,{}),me&&(0,e.jsx)(je,{})]})};export{Ye as default};
