import{r as z}from"./chunk-CXHxssQy.js";import{y as B}from"./chunk-CXAmgOhv.js";import{l as k}from"./chunk-DWc5g_hH.js";import{_ as t}from"./chunk-DJYPtS2Y.js";import{o as A}from"./chunk-BY9AVXEY.js";import{c as I,l as R,o as T}from"./chunk-C935kdjU.js";import{d as D,i as q}from"./index-Cp7mIUwY.js";import"./chunk-Be_uK67m.js";var l=z(B(),1),e=A(),r={primary:"#0A2463",primaryLight:"#1A3A7A",white:"#FFFFFF",bg:"#F5F7FA",border:"#E8ECF0",text:"#1A1D24",textSecondary:"#6B7280",success:"#10B981",warning:"#F59E0B",danger:"#E74C3C",info:"#3B82F6"},$=t.div`
  max-width: 1000px;
  margin: 0 auto;
  background: ${r.white};
`,H=t.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`,M=t.button`
  background: ${r.white};
  border: 1px solid ${r.border};
  border-radius: 8px;
  padding: 0.625rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${r.text};
  transition: all 0.2s;

  &:hover {
    background: ${r.bg};
    color: ${r.primary};
  }
`,O=t.div`
  flex: 1;
`,V=t.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${r.text};
  margin: 0;
`,N=t.p`
  color: ${r.textSecondary};
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
`,P=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
`,c=t.div`
  background: ${r.white};
  padding: 1.25rem;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid ${r.border};
  display: flex;
  align-items: center;
  gap: 1rem;
`,m=t.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${n=>n.$color||r.primary};
  color: ${r.white};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,p=t.div`
  flex: 1;
`,x=t.p`
  font-size: 0.7rem;
  color: ${r.textSecondary};
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
`,g=t.p`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${r.text};
  margin: 0;
`,G=t.div`
  background: ${r.white};
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid ${r.border};
  margin-bottom: 2rem;
  overflow: hidden;
`,U=t.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${r.border};
`,X=t.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${r.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Y=t.div`
  padding: 1.5rem;
`,J=t.div`
  padding: 1.25rem;
  border: 1px solid ${r.border};
  border-radius: 12px;
  margin-bottom: 1rem;
  background: ${r.white};
  transition: all 0.2s;

  &:hover {
    border-color: ${r.primary};
    box-shadow: 0 4px 12px rgba(10, 36, 99, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }
`,K=t.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
`,Q=t.div`
  flex: 1;
`,W=t.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${r.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`,Z=t.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${r.text};
`,ee=t.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${n=>{switch(n.$status){case"approved":return"#D1FAE5";case"rejected":return"#FEE2E2";case"pending":return"#FEF3C7";case"cancelled":return"#F3F4F6";default:return r.bg}}};
  color: ${n=>{switch(n.$status){case"approved":return"#065F46";case"rejected":return"#991B1B";case"pending":return"#92400E";case"cancelled":return"#6B7280";default:return r.textSecondary}}};
`,re=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`,h=t.div`
  padding: 0.75rem;
  background: ${r.bg};
  border-radius: 8px;
`,s=t.div`
  font-size: 0.7rem;
  color: ${r.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.25rem;
`,u=t.div`
  font-size: 0.95rem;
  color: ${r.text};
  font-weight: 500;
`,te=t.div`
  padding: 0.75rem;
  background: ${r.bg};
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${r.text};
  margin-bottom: 1rem;
`,ae=t.div`
  padding: 0.75rem;
  background: #FEE2E2;
  border-left: 4px solid ${r.danger};
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #991B1B;
  margin-bottom: 1rem;
`,ne=t.div`
  text-align: center;
  padding: 3rem;
  color: ${r.textSecondary};
`,se=t.div`
  text-align: center;
  padding: 3rem;
  color: ${r.textSecondary};
`,ie=n=>{switch(n){case"approved":return(0,e.jsx)(CheckCircle,{size:20,color:"#10B981"});case"rejected":return(0,e.jsx)(XCircle,{size:20,color:"#E74C3C"});case"pending":return(0,e.jsx)(Clock,{size:20,color:"#F59E0B"});default:return null}},j=n=>n?new Date(n).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"-",he=()=>{const n=k(),[v,S]=(0,l.useState)([]),[d,w]=(0,l.useState)({total:0,pending:0,approved:0,rejected:0}),[C,f]=(0,l.useState)(!0),b=localStorage.getItem("tenantSlug")||"system_shared";(0,l.useEffect)(()=>{E()},[]);const E=async()=>{try{f(!0);const a=R(),L=localStorage.getItem("tenantSlug")||"system_shared",F=T()||I()||L||"system_shared",y=await q.get(D.LEAVE.MY_LEAVES,{params:{user_id:a},headers:{"x-tenant-slug":F}}),i=Array.isArray(y?.data?.data)?y.data.data:[];S(i);const _={total:i.length,pending:i.filter(o=>o.status==="pending").length,approved:i.filter(o=>o.status==="approved").length,rejected:i.filter(o=>o.status==="rejected").length};w(_)}catch(a){console.error("Error fetching my leaves:",a)}finally{f(!1)}};return C?(0,e.jsx)($,{children:(0,e.jsxs)(se,{children:[(0,e.jsx)("div",{style:{width:"40px",height:"40px",border:"3px solid #E5E7EB",borderTop:"3px solid #C9A84C",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 1rem"}}),(0,e.jsx)("p",{children:"Loading your leave requests..."})]})}):(0,e.jsxs)($,{children:[(0,e.jsxs)(H,{children:[(0,e.jsx)(M,{onClick:()=>n(`/tenant/${b}/leaves/apply`),title:"Go back to Apply Leave",children:(0,e.jsx)(ArrowLeft,{size:20})}),(0,e.jsxs)(O,{children:[(0,e.jsx)(V,{children:"My Leave Applications"}),(0,e.jsx)(N,{children:"View all your leave requests and their status"})]})]}),(0,e.jsxs)(P,{children:[(0,e.jsxs)(c,{children:[(0,e.jsx)(m,{$color:r.info,children:(0,e.jsx)(Calendar,{size:24})}),(0,e.jsxs)(p,{children:[(0,e.jsx)(x,{children:"Total Requests"}),(0,e.jsx)(g,{children:d.total})]})]}),(0,e.jsxs)(c,{children:[(0,e.jsx)(m,{$color:r.warning,children:(0,e.jsx)(Clock,{size:24})}),(0,e.jsxs)(p,{children:[(0,e.jsx)(x,{children:"Pending"}),(0,e.jsx)(g,{children:d.pending})]})]}),(0,e.jsxs)(c,{children:[(0,e.jsx)(m,{$color:r.success,children:(0,e.jsx)(CheckCircle,{size:24})}),(0,e.jsxs)(p,{children:[(0,e.jsx)(x,{children:"Approved"}),(0,e.jsx)(g,{children:d.approved})]})]}),(0,e.jsxs)(c,{children:[(0,e.jsx)(m,{$color:r.danger,children:(0,e.jsx)(XCircle,{size:24})}),(0,e.jsxs)(p,{children:[(0,e.jsx)(x,{children:"Rejected"}),(0,e.jsx)(g,{children:d.rejected})]})]})]}),(0,e.jsxs)(G,{children:[(0,e.jsx)(U,{children:(0,e.jsxs)(X,{children:[(0,e.jsx)(Calendar,{size:20}),"Your Leave Requests"]})}),v.length===0?(0,e.jsxs)(ne,{children:[(0,e.jsx)(Calendar,{size:48,style:{marginBottom:"1rem",opacity:.3}}),(0,e.jsxs)("p",{children:["No leave requests found. ",(0,e.jsx)("a",{href:`/tenant/${b}/leaves/apply`,style:{color:r.primary},children:"Apply for leave now"})]})]}):(0,e.jsx)(Y,{children:v.map(a=>(0,e.jsxs)(J,{children:[(0,e.jsxs)(K,{children:[(0,e.jsxs)(Q,{children:[(0,e.jsx)(W,{children:a.leave_type}),(0,e.jsxs)(Z,{children:[j(a.start_date)," - ",j(a.end_date)]})]}),(0,e.jsxs)(ee,{$status:a.status,children:[ie(a.status),a.status]})]}),(0,e.jsxs)(re,{children:[(0,e.jsxs)(h,{children:[(0,e.jsx)(s,{children:"Total Days"}),(0,e.jsxs)(u,{children:[a.days," days"]})]}),(0,e.jsxs)(h,{children:[(0,e.jsx)(s,{children:"Applied On"}),(0,e.jsx)(u,{children:j(a.created_at)})]}),a.approved_at&&(0,e.jsxs)(h,{children:[(0,e.jsx)(s,{children:"Approved On"}),(0,e.jsx)(u,{children:j(a.approved_at)})]}),a.is_half_day&&(0,e.jsxs)(h,{children:[(0,e.jsx)(s,{children:"Type"}),(0,e.jsx)(u,{children:"Half Day"})]})]}),a.reason&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(s,{style:{marginBottom:"0.5rem"},children:"Reason"}),(0,e.jsx)(te,{children:a.reason})]}),a.rejection_reason&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(s,{style:{marginBottom:"0.5rem"},children:"Rejection Reason"}),(0,e.jsx)(ae,{children:a.rejection_reason})]})]},a.id))})]})]})};export{he as default};
