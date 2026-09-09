import{r as P}from"./chunk-CXHxssQy.js";import{y as R}from"./chunk-CXAmgOhv.js";import{u as V}from"./chunk-DWc5g_hH.js";import{_ as s,m as N}from"./chunk-DJYPtS2Y.js";import{a as f}from"./chunk-CwzAxjA3.js";import{o as X}from"./chunk-BY9AVXEY.js";import{Mn as j,N as H,Tt as U,Vn as Y,f as S,i as F,nn as K,nt as W,on as J}from"./index-D6gguvjv.js";import{i as E}from"./chunk-N6-xod2j.js";var i=P(R(),1),r={colors:{ink:"#1a1a1a",white:"#FFFFFF",line:"#e5e5e5",gray:"#666666",verdigris:"#3D4F47",brass:"#7A2F26",success:"#475A43",red:"#dc3545"}},e=X();N`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;N`
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;var _=s.div`
  background: ${r.colors.white};
  border-radius: 6px;
  padding: 0.75rem;
  border: 1px solid ${r.colors.line};
`,Q=s.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${r.colors.line};
  flex-wrap: wrap;
  gap: 0.5rem;
`,Z=s.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${r.colors.ink};
  display: flex;
  align-items: center;
  gap: 0.4rem;

  svg {
    color: ${r.colors.gray};
    stroke-width: 2;
  }
`;s.span`
  background: ${r.colors.line};
  color: ${r.colors.gray};
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-block;
`;var ee=s.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`,y=s.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${r.colors.line};
  white-space: nowrap;

  &.primary {
    background: ${r.colors.verdigris};
    color: ${r.colors.white};
    border-color: ${r.colors.verdigris};

    &:hover {
      background: #2d3f37;
      border-color: #2d3f37;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: ${r.colors.white};
    color: ${r.colors.ink};

    &:hover {
      background: ${r.colors.line};
    }
  }

  &.success {
    background: ${r.colors.success};
    color: ${r.colors.white};
    border-color: ${r.colors.success};

    &:hover {
      background: #3d4a3a;
      border-color: #3d4a3a;
    }
  }
`,re=s.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`,I=s.div`
  padding: 1.25rem 0;
  border-bottom: 1px solid ${r.colors.line};

  &:last-child {
    border-bottom: none;
  }
`,z=s.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${r.colors.brass};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
`,ae=s.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  gap: 1rem;
`,te=s.span`
  color: ${r.colors.gray};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  flex-shrink: 0;
  min-width: fit-content;
`,C=s.span`
  color: ${r.colors.ink};
  font-weight: ${g=>g.bold?"700":"600"};
  text-align: right;
  word-break: break-word;
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;

  .status-badge {
    background: ${g=>g.statusColor||r.colors.gray};
    color: ${r.colors.bone};
    padding: 0.35rem 0.9rem;
    border-radius: 25px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
    margin-left: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    letter-spacing: 0.3px;
  }
`,oe=s.div`
  background: ${r.colors.bone};
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid ${r.colors.line};
`,se=s.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`,ie=s.div`
  margin-bottom: 1rem;
`,ne=s.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${r.colors.ink};
  margin-bottom: 0.4rem;
`,de=s.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${r.colors.line};
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: ${r.colors.white};

  &:focus {
    outline: none;
    border-color: ${r.colors.brass};
    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
  }
`,le=s.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${r.colors.line};
  border-radius: 10px;
  font-size: 0.9rem;
  background: ${r.colors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${r.colors.brass};
    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
  }
`,ce=s.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${r.colors.gray};
  font-size: 1rem;
  gap: 0.75rem;

  .spinner {
    border: 3px solid ${r.colors.line};
    border-top: 3px solid ${r.colors.brass};
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`,me=s.div`
  text-align: center;
  padding: 3rem;
  color: ${r.colors.gray};
  font-size: 1rem;
`,pe=[{title:"Personal Information",icon:j,fields:[{key:"full_name",label:"Full Name",bold:!0},{key:"gender",label:"Gender"},{key:"date_of_birth",label:"Date of Birth"},{key:"date_of_death",label:"Date of Death"}]},{title:"Timeline",icon:H,fields:[{key:"date_admitted",label:"Admitted On"},{key:"dispatch_date",label:"Dispatch Date"}]}],ge=[{section:"Personal Information",icon:j,fields:[{name:"full_name",label:"Full Name",type:"text",required:!0},{name:"gender",label:"Gender",type:"select",options:["Male","Female","Other"]},{name:"date_of_birth",label:"Date of Birth",type:"date"},{name:"date_of_death",label:"Date of Death",type:"date"}]}],je=({deceasedId:g,deceased:d,ageInfo:fe,onUpdate:T})=>{const{id:A}=V(),l=g||A,[$,v]=(0,i.useState)(!1),[c,m]=(0,i.useState)(null),[G,h]=(0,i.useState)(null),[u,p]=(0,i.useState)(!0),[k,b]=(0,i.useState)(null),x=(0,i.useCallback)(async()=>{if(!l){p(!1),b("No deceased ID provided");return}p(!0),b(null);try{const t=`${S.DECEASED.BASE}/deceased-id/${l}`,o=await F.get(t);console.log("📦 DeceasedInfoSection API Response:",o.data);const a=o.data?.data||o.data;if(a&&Object.keys(a).length>0){const n={...a,date_of_birth:a.date_of_birth?E(a.date_of_birth):"",date_of_death:a.date_of_death?E(a.date_of_death):"",date_admitted:a.date_admitted?new Date(a.date_admitted).toISOString().split("T")[0]:"",dispatch_date:a.dispatch_date?new Date(a.dispatch_date).toISOString().split("T")[0]:""};m(n),h(n)}else b("No data found for this deceased record"),m(null),h(null)}catch(t){console.error("Error fetching data:",t);const o=t.response?.data?.message||t.message||"Failed to load deceased information";b(o),f.error(o),m(null),h(null)}finally{p(!1)}},[l]);(0,i.useEffect)(()=>{if(d){const t={...d,date_of_birth:d.date_of_birth?new Date(d.date_of_birth).toISOString().split("T")[0]:"",date_of_death:d.date_of_death?new Date(d.date_of_death).toISOString().split("T")[0]:""};m(t),h(t),p(!1)}else x()},[d,x,l]);const D=t=>{const{name:o,value:a}=t.target;m(n=>({...n,[o]:a}))},O=async()=>{if(!c||!l){f.error("No data to save");return}p(!0);try{const t=`${S.DECEASED.BASE}/${l}`,o=await F.put(t,c);o.data.success?(f.success("Details updated successfully"),v(!1),await x(),T?.()):f.error(o.data.message||"Failed to update details")}catch(t){console.error("Update error:",t);const o=t.response?.data?.message||t.message||"Failed to update details";f.error(o)}finally{p(!1)}},L=()=>{m(G),v(!1)},M=t=>{if(!t)return"-";const o=new Date(t);return isNaN(o.getTime())?"-":o.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})},B=(t,o)=>{let a=o[t.key];return!a&&a!==0?(0,e.jsx)(C,{children:"-"}):(t.key.includes("date")&&(a=M(a)),(0,e.jsx)(C,{bold:t.bold,children:a}))},q=(t,o)=>(0,e.jsxs)(I,{children:[(0,e.jsxs)(z,{children:[i.createElement(t.icon,{size:18}),t.title]}),t.fields.map((a,n)=>(0,e.jsxs)(ae,{children:[(0,e.jsxs)(te,{children:[a.label,":"]}),B(a,c)]},n))]},o);return u?(0,e.jsx)(_,{children:(0,e.jsxs)(ce,{children:[(0,e.jsx)("div",{className:"spinner"}),"Loading deceased information..."]})}):k||!c?(0,e.jsx)(_,{children:(0,e.jsxs)(me,{children:[(0,e.jsx)(U,{size:32,strokeWidth:1.5}),(0,e.jsx)("div",{style:{marginTop:"1rem",color:r.colors.red},children:k||"No data found for this deceased record"}),(0,e.jsxs)(y,{className:"secondary",onClick:x,style:{marginTop:"1rem"},children:[(0,e.jsx)(K,{size:16}),"Retry"]})]})}):(0,e.jsx)(e.Fragment,{children:(0,e.jsxs)(_,{children:[(0,e.jsxs)(Q,{children:[(0,e.jsxs)(Z,{children:[(0,e.jsx)(j,{size:22}),"Deceased Information"]}),(0,e.jsx)(ee,{children:$?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(y,{className:"success",onClick:O,disabled:u,children:[(0,e.jsx)(J,{size:16}),u?"Saving...":"Save Changes"]}),(0,e.jsxs)(y,{className:"secondary",onClick:L,disabled:u,children:[(0,e.jsx)(Y,{size:16}),"Cancel"]})]}):(0,e.jsxs)(y,{className:"primary",onClick:()=>v(!0),children:[(0,e.jsx)(W,{size:16}),"Edit Information"]})})]}),$?(0,e.jsx)(oe,{children:(0,e.jsx)(se,{children:ge.map((t,o)=>(0,e.jsxs)(I,{children:[(0,e.jsxs)(z,{children:[i.createElement(t.icon,{size:18}),t.section]}),t.fields.map((a,n)=>(0,e.jsxs)(ie,{children:[(0,e.jsx)(ne,{children:a.label}),a.type==="select"?(0,e.jsxs)(le,{name:a.name,value:c[a.name]||"",onChange:D,children:[(0,e.jsxs)("option",{value:"",children:["Select ",a.label]}),a.options?.map(w=>(0,e.jsx)("option",{value:w,children:w},w))]}):(0,e.jsx)(de,{type:a.type,name:a.name,value:c[a.name]||"",onChange:D,placeholder:`Enter ${a.label.toLowerCase()}`,required:a.required})]},n))]},o))})}):(0,e.jsx)(re,{children:pe.map(q)})]})})};export{je as default};
