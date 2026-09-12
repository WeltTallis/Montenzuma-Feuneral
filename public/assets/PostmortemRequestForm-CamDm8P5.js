import{r as ae}from"./chunk-CXHxssQy.js";import{y as ie}from"./chunk-CXAmgOhv.js";import{u as ne}from"./chunk-DWc5g_hH.js";import{_ as t,h as oe,m as z}from"./chunk-DJYPtS2Y.js";import{t as le}from"./chunk-CwzAxjA3.js";import{o as de}from"./chunk-BY9AVXEY.js";import{t as X}from"./chunk-eZ3__Fgx.js";var l=ae(ie(),1),e=de(),ce=oe`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Karla:wght@400;500;700&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
`,r={ink:"#16211E",pine:"#1F3D33",moss:"#3E6257",gold:"#C6A15B",goldSoft:"#F3EBD9",cream:"#F6F4EE",paper:"#FFFFFF",line:"#E6E1D5",lineSoft:"#EFECE3",muted:"#8B8677",text:"#232A27",ease:"cubic-bezier(.32, .72, .24, 1)",success:"#1a6641",successBg:"#edf7f1",error:"#9b2335",errorBg:"#fdf2f4"},A=`${typeof import.meta<"u"?"https://restpoint.co.ke/api/v1/restpoint":"http://localhost:5000"}/api/v1/restpoint`,Q=z`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`,pe=z`to{transform:rotate(360deg)}`,xe=z`0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}`,me=t.div`
    font-family: 'Outfit', sans-serif;
    background: ${r.cream};
    color: ${r.text};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-font-smoothing: antialiased;
`,fe=t.div`
    max-width: 2200px;
    width: 100%;
    background: ${r.paper};
    border-radius: 10px;
    box-shadow: 0 24px 60px -20px rgba(22,33,30,0.18);
    overflow: hidden;
    border: 1px solid ${r.line};
    margin: 40px 20px 0;
    animation: ${Q} 0.4s ${r.ease} both;

    @media (max-width: 600px) {
        margin: 0;
        border-radius: 0;
        min-height: 100vh;
    }
`,he=t.div`
    background: ${r.goldSoft};
    padding: 18px 40px;
    text-align: center;
    border-bottom: 1px solid ${r.line};

    p {
        font-family: 'Fraunces', serif;
        font-size: 15px;
        color: ${r.moss};
        font-weight: 500;
        font-style: italic;
        line-height: 1.4;
        margin: 0;
    }

    @media (max-width: 600px) { padding: 16px 20px; }
`,ue=t.header`
    background: ${r.paper};
    padding: 28px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid ${r.lineSoft};

    @media (max-width: 600px) {
        flex-direction: column;
        padding: 20px;
        align-items: center;
        text-align: center;
    }
`,ge=t.div`display:flex;flex-direction:column;gap:14px;`,be=t.div`font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:${r.ink};letter-spacing:.02em;display:flex;align-items:center;gap:10px;i{color:${r.gold};font-size:14px}`,je=t.div`display:flex;flex-direction:column;gap:7px;`,G=t.div`font-size:13px;color:${r.text};display:flex;align-items:center;gap:9px;i{color:${r.muted};font-size:12px;width:15px;text-align:center}span{font-weight:600;color:${r.ink};font-variant-numeric:tabular-nums}`,ye=t.div`display:flex;flex-direction:column;align-items:center;gap:8px;`,ve=t.div`width:156px;height:156px;padding:8px;border:1px solid ${r.line};border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.05);`,$e=t.span`font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:${r.pine};font-weight:700;`,we=t.div`
    padding: 28px 40px 20px;
    text-align: center;
    border-bottom: 1px solid ${r.lineSoft};

    h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: ${r.ink}; margin: 0 0 5px; }
    p  { font-size: 13px; color: ${r.muted}; font-style: italic; margin: 0; }

    @media (max-width: 600px) { padding: 20px; }
`,ke=t.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 18px 40px;
    background: ${r.cream};
    border-bottom: 1px solid ${r.line};
`,_=t.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: ${s=>s.$active?r.pine:s.$done?r.gold:r.muted};
`,F=t.div`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    background: ${s=>s.$active?r.pine:s.$done?r.gold:r.lineSoft};
    color: ${s=>s.$active||s.$done?"#fff":r.muted};
    flex-shrink: 0;
`,M=t.div`
    flex: 1;
    height: 1px;
    background: ${s=>s.$done?r.gold:r.line};
    margin: 0 12px;
    max-width: 60px;
`,C=t.div`
    padding: 28px 40px;

    @media (max-width: 600px) { padding: 20px; }
`,b=t.div`
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
`,j=t.label`
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 700;
    color: ${r.moss};
    display: flex;
    align-items: center;
    gap: 7px;

    i { color: ${r.gold}; font-size: 11px; }
`,O=t.input`
    background: ${r.cream};
    border: 1px solid ${s=>s.$error?r.error:r.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${r.text};
    transition: all .2s ${r.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    animation: ${s=>s.$shake?xe:"none"} .4s ease;

    &::placeholder { color: #a7a294; }
    &:focus { background: ${r.paper}; border-color: ${r.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
    &:read-only { opacity: .7; cursor: default; }
`,U=t.select`
    background: ${r.cream};
    border: 1px solid ${r.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${r.text};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    transition: all .2s ${r.ease};

    &:focus { background: ${r.paper}; border-color: ${r.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
`,Se=t.textarea`
    background: ${r.cream};
    border: 1px solid ${r.line};
    border-radius: 8px;
    padding: 13px 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: ${r.text};
    transition: all .2s ${r.ease};
    outline: none;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 110px;
    line-height: 1.55;

    &::placeholder { color: #a7a294; }
    &:focus { background: ${r.paper}; border-color: ${r.pine}; box-shadow: 0 0 0 4px rgba(31,61,51,.06); }
`,k=t.div`
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: ${s=>s.$type==="success"?r.successBg:s.$type==="error"?r.errorBg:r.goldSoft};
    color:       ${s=>s.$type==="success"?r.success:s.$type==="error"?r.error:r.pine};
    border: 1px solid ${s=>s.$type==="success"?"#a3d4b5":s.$type==="error"?"#e5b5bc":r.line};

    i { flex-shrink: 0; margin-top: 1px; }
    strong { font-weight: 700; }
`,_e=t.div`
    background: ${r.cream};
    border: 1px solid ${r.line};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    animation: ${Q} .3s ease both;
`,u=t.div`
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 5px 0;
    border-bottom: 1px solid ${r.lineSoft};

    &:last-child { border-bottom: none; }

    span:first-child { color: ${r.muted}; font-weight: 500; }
    span:last-child  { color: ${r.ink};   font-weight: 600; }
`,N=t.div`
    border-top: 1px solid ${r.lineSoft};
    padding: 20px 40px;
    background: #fbfaf7;
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    @media (max-width: 600px) {
        padding: 16px 20px;
        flex-direction: column;
    }
`,y=t.button`
    padding: 13px 26px;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s ${r.ease};
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid transparent;
    text-transform: uppercase;
    letter-spacing: .05em;

    &:disabled { opacity: .6; cursor: not-allowed; transform: none !important; }

    ${s=>s.$ghost&&`
        background: ${r.paper};
        border-color: ${r.line};
        color: ${r.muted};
        &:hover:not(:disabled) { border-color: ${r.moss}; color: ${r.pine}; }
    `}

    ${s=>s.$primary&&`
        background: ${r.ink};
        color: #EDEAE0;
        box-shadow: 0 4px 12px rgba(22,33,30,.15);
        &:hover:not(:disabled) { background: ${r.pine}; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(31,61,51,.2); }
        i { color: ${r.gold}; }
    `}

    ${s=>s.$success&&`
        background: ${r.success};
        color: #fff;
        box-shadow: 0 4px 12px rgba(26,102,65,.2);
    `}
`,K=t.div`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    animation: ${pe} .8s linear infinite;
    flex-shrink: 0;
`,Fe=t.footer`
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #2F3A32;
    color: #E9EBDD;
    text-align: center;
    padding: 56px 20px 0;
    border-top: none;
    box-sizing: border-box;

    &::before {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -260px;
        transform: translateX(-50%);
        width: 520px;
        height: 520px;
        border-radius: 50%;
        border: 1.5px solid rgba(233,235,221,.10);
        pointer-events: none;
    }
    &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -320px;
        transform: translateX(-50%);
        width: 680px;
        height: 680px;
        border-radius: 50%;
        border: 1px solid rgba(233,235,221,.06);
        pointer-events: none;
    }

    @media (max-width: 560px) { padding: 44px 20px 0; }
`,Ce=t.div`
    width: 44px;
    height: 44px;
    margin: 0 auto 18px;
    border-radius: 50%;
    background: rgba(237,233,219,.12);
    border: 1px solid rgba(237,233,219,.25);
    display: grid;
    place-items: center;
`,Ne=t.p`
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.5;
    color: rgba(237,233,219,.82);
    max-width: 44ch;
    margin: 0 auto;
`,qe=t.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 30px auto 0;
    max-width: 420px;

    &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(237,233,219,.16);
    }
`,q=t.span`
    font-family: 'Karla','Segoe UI',sans-serif;
    font-weight: 700;
    font-size: .64rem;
    letter-spacing: .26em;
    text-transform: uppercase;
    color: rgba(205,209,191,.55);
`,Y=t.b`
    font-family: 'Cormorant Garamond',Georgia,serif;
    font-weight: 600;
    font-size: 1rem;
    color: rgba(205,209,191,.85);
`,ze=t.div`
    margin-top: 44px;
    border-top: 1px solid rgba(237,233,219,.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 18px 32px;
    font-family: 'Karla','Segoe UI',sans-serif;
    font-weight: 500;
    font-size: .76rem;
    color: rgba(237,233,219,.42);

    @media (max-width: 560px) {
        flex-direction: column;
        gap: 6px;
        padding: 16px 20px;
        text-align: center;
    }
`;function Le(){const{slug:s}=ne(),S=s||typeof localStorage<"u"&&localStorage.getItem("tenantSlug")||"system_shared",V=`${typeof window<"u"?window.location.origin:""}/tenant/${S}/postmortem-verify`,[H,W]=(0,l.useState)(""),[J,Z]=(0,l.useState)(""),[D,E]=(0,l.useState)(""),[R,p]=(0,l.useState)(""),[P,B]=(0,l.useState)(!1),[a,v]=(0,l.useState)(null),[ee,$]=(0,l.useState)(!1),[x,re]=(0,l.useState)("phone"),[m,w]=(0,l.useState)({reason:"",requested_by:"",priority:"normal"}),[I,T]=(0,l.useState)(!1),[L,g]=(0,l.useState)(null);(0,l.useEffect)(()=>{const n=()=>{const c=new Date;W(c.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})),Z(c.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}))};n();const i=setInterval(n,6e4);return()=>clearInterval(i)},[]);const te=async n=>{n.preventDefault();const i=D.trim();if(!i){p("Please enter a deceased ID, next-of-kin phone, or ID number.");return}B(!0),p(""),v(null);const c=new URLSearchParams;x==="phone"?c.set("phone",i):x==="id_number"?c.set("id_number",i):x==="admission_number"&&c.set("admission_number",i);try{const f=await X.get(`${A}/public/postmortem/search?${c.toString()}`,{headers:{"x-tenant-slug":S}}),h=f.data?.data?.deceased||f.data?.deceased||f.data?.data;h&&(h.deceased_id||h.full_name)?v(h):(p("No matching deceased record found. Please check the details and try again."),$(!0),setTimeout(()=>$(!1),500))}catch(f){const h=f.response?.data?.message;f.response?.status===404?p("No matching deceased record found. Please check the details and try again."):p(h||"Unable to search at this time. Please try again shortly."),$(!0),setTimeout(()=>$(!1),500)}finally{B(!1)}},se=async n=>{if(n.preventDefault(),!m.reason||!m.requested_by){alert("Please fill in all required fields.");return}if(!a?.deceased_id){alert("Case not found. Please go back and search again.");return}T(!0),g(null);try{const i=await X.post(`${A}/public/postmortem/request`,{deceased_id:a.deceased_id,reason:m.reason,requested_by:m.requested_by,priority:m.priority,source:"family_reception"},{headers:{"x-tenant-slug":S}});i.data?.success?(g({ok:!0,msg:i.data?.message||"Postmortem request submitted successfully."}),w({reason:"",requested_by:"",priority:"normal"})):g({ok:!1,msg:i.data?.message||"Submission failed. Please try again."})}catch(i){const c=i.response?.data?.message||"Failed to submit postmortem request. Please try again.";g({ok:!1,msg:c})}finally{T(!1)}},d=!!a,o=L?.ok;return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ce,{}),(0,e.jsx)(me,{children:(0,e.jsxs)(fe,{children:[(0,e.jsx)(he,{children:(0,e.jsx)("p",{children:"We are deeply sorry for your loss. Please accept our heartfelt condolences."})}),(0,e.jsxs)(ue,{children:[(0,e.jsxs)(ge,{children:[(0,e.jsxs)(be,{children:[(0,e.jsx)("i",{className:"fas fa-hashtag"})," Postmortem Request Form"]}),(0,e.jsxs)(je,{children:[(0,e.jsxs)(G,{children:[(0,e.jsx)("i",{className:"fas fa-calendar-alt"}),(0,e.jsx)("span",{children:H})]}),(0,e.jsxs)(G,{children:[(0,e.jsx)("i",{className:"fas fa-clock"}),(0,e.jsx)("span",{children:J})]})]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(ve,{children:(0,e.jsx)(le,{value:V,size:140,level:"H",includeMargin:!1,bgColor:"#FFFFFF",fgColor:r.ink})}),(0,e.jsx)($e,{children:"Scan for Results"})]})]}),(0,e.jsxs)(we,{children:[(0,e.jsx)("h1",{children:"Postmortem Examination Request"}),(0,e.jsx)("p",{children:"Complete all fields accurately to authorize the procedure."})]}),(0,e.jsxs)(ke,{children:[(0,e.jsxs)(_,{$active:!d,$done:d,children:[(0,e.jsx)(F,{$active:!d,$done:d,children:d?"✓":"1"}),"Find Case"]}),(0,e.jsx)(M,{$done:d}),(0,e.jsxs)(_,{$active:d&&!o,$done:o,children:[(0,e.jsx)(F,{$active:d&&!o,$done:o,children:o?"✓":"2"}),"Submit Request"]}),(0,e.jsx)(M,{$done:o}),(0,e.jsxs)(_,{$active:!1,$done:o,children:[(0,e.jsx)(F,{$done:o,children:o?"✓":"3"}),"Confirmed"]})]}),!d&&!o&&(0,e.jsxs)("form",{onSubmit:te,children:[(0,e.jsxs)(C,{children:[(0,e.jsxs)(k,{children:[(0,e.jsx)("i",{className:"fas fa-info-circle"}),(0,e.jsxs)("div",{children:["Enter the ",(0,e.jsx)("strong",{children:"Deceased Admission Number"}),", the ",(0,e.jsx)("strong",{children:"Next-of-Kin phone number"}),", or the ",(0,e.jsx)("strong",{children:"National ID"})," to locate the case."]})]}),R&&(0,e.jsxs)(k,{$type:"error",children:[(0,e.jsx)("i",{className:"fas fa-exclamation-triangle"}),R]}),(0,e.jsxs)(b,{children:[(0,e.jsxs)(j,{htmlFor:"searchType",children:[(0,e.jsx)("i",{className:"fas fa-list"})," Search By"]}),(0,e.jsxs)(U,{id:"searchType",value:x,onChange:n=>{re(n.target.value),p("")},children:[(0,e.jsx)("option",{value:"phone",children:"Next of Kin Phone"}),(0,e.jsx)("option",{value:"id_number",children:"National ID"}),(0,e.jsx)("option",{value:"admission_number",children:"Deceased Admission Number"})]})]}),(0,e.jsxs)(b,{children:[(0,e.jsxs)(j,{htmlFor:"identifier",children:[(0,e.jsx)("i",{className:"fas fa-search"})," ",x==="phone"?"Phone Number":x==="id_number"?"ID Number":"Admission Number"]}),(0,e.jsx)(O,{id:"identifier",type:"text",placeholder:x==="phone"?"e.g. +254700000000":x==="id_number"?"e.g. 12345678":"e.g. MON-XXXXXX",value:D,onChange:n=>{E(n.target.value),p("")},$shake:ee,required:!0})]})]}),(0,e.jsxs)(N,{children:[(0,e.jsxs)(y,{type:"button",$ghost:!0,onClick:()=>window.history.back(),children:[(0,e.jsx)("i",{className:"fas fa-times"})," Cancel"]}),(0,e.jsx)(y,{type:"submit",$primary:!0,disabled:P,children:P?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(K,{})," Searching…"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("i",{className:"fas fa-search"})," Find Case"]})})]})]}),d&&!o&&(0,e.jsxs)("form",{onSubmit:se,children:[(0,e.jsxs)(C,{children:[(0,e.jsxs)(k,{$type:"success",children:[(0,e.jsx)("i",{className:"fas fa-check-circle"}),(0,e.jsx)("div",{children:"Case found. Please review the details below and complete your request."})]}),(0,e.jsxs)(_e,{children:[(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Full Name"}),(0,e.jsx)("span",{children:a.full_name||"—"})]}),(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Admission No."}),(0,e.jsx)("span",{children:a.admission_number||a.deceased_id})]}),a.date_of_death&&(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Date of Death"}),(0,e.jsx)("span",{children:a.date_of_death})]}),a.gender&&(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Gender"}),(0,e.jsx)("span",{children:a.gender})]}),(a.next_of_kin_name||a.next_of_kin)&&(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Next of Kin"}),(0,e.jsx)("span",{children:a.next_of_kin_name||a.next_of_kin})]}),(a.next_of_kin_phone||a.tell_no||a.phone_number)&&(0,e.jsxs)(u,{children:[(0,e.jsx)("span",{children:"Kin Contact"}),(0,e.jsx)("span",{children:a.next_of_kin_phone||a.tell_no||a.phone_number})]})]}),(0,e.jsxs)(b,{children:[(0,e.jsxs)(j,{htmlFor:"requested_by",children:[(0,e.jsx)("i",{className:"fas fa-user-shield"})," Requesting Authority / Your Name"]}),(0,e.jsx)(O,{id:"requested_by",type:"text",placeholder:"e.g. John Kamau (Son), Dr. Mwangi, Police Inspector Oloo",value:m.requested_by,onChange:n=>w(i=>({...i,requested_by:n.target.value})),required:!0})]}),(0,e.jsxs)(b,{children:[(0,e.jsxs)(j,{htmlFor:"priority",children:[(0,e.jsx)("i",{className:"fas fa-flag"})," Priority"]}),(0,e.jsxs)(U,{id:"priority",value:m.priority,onChange:n=>w(i=>({...i,priority:n.target.value})),children:[(0,e.jsx)("option",{value:"normal",children:"Normal"}),(0,e.jsx)("option",{value:"urgent",children:"Urgent"}),(0,e.jsx)("option",{value:"emergency",children:"Emergency"})]})]}),(0,e.jsxs)(b,{style:{marginBottom:0},children:[(0,e.jsxs)(j,{htmlFor:"reason",children:[(0,e.jsx)("i",{className:"fas fa-align-left"})," Reason for Request"]}),(0,e.jsx)(Se,{id:"reason",placeholder:"Please describe the circumstances or reason for requesting the postmortem examination…",value:m.reason,onChange:n=>w(i=>({...i,reason:n.target.value})),required:!0})]})]}),(0,e.jsxs)(N,{children:[(0,e.jsxs)(y,{type:"button",$ghost:!0,onClick:()=>{v(null),p("")},children:[(0,e.jsx)("i",{className:"fas fa-arrow-left"})," Back"]}),(0,e.jsx)(y,{type:"submit",$primary:!0,disabled:I,children:I?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(K,{})," Submitting…"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("i",{className:"fas fa-paper-plane"})," Submit Request"]})})]})]}),o&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(C,{children:(0,e.jsxs)(k,{$type:"success",children:[(0,e.jsx)("i",{className:"fas fa-check-circle"}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Request Submitted."}),(0,e.jsx)("br",{}),L.msg,(0,e.jsx)("br",{}),(0,e.jsx)("small",{style:{opacity:.8,marginTop:4,display:"block"},children:"The mortuary team will review your request and contact you shortly. You can scan the QR code above to check the results later."})]})]})}),(0,e.jsx)(N,{children:(0,e.jsxs)(y,{$primary:!0,onClick:()=>{v(null),E(""),g(null)},children:[(0,e.jsx)("i",{className:"fas fa-plus"})," New Request"]})})]}),(0,e.jsxs)(Fe,{children:[(0,e.jsx)(Ce,{children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"#EDE9DB",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",width:"21",height:"21",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)(Ne,{children:"Received with dignity. Cared for with respect. Remembered with love."}),(0,e.jsxs)(qe,{children:[(0,e.jsx)(q,{children:"Dignity"}),(0,e.jsx)(Y,{children:"·"}),(0,e.jsx)(q,{children:"Care"}),(0,e.jsx)(Y,{children:"·"}),(0,e.jsx)(q,{children:"Respect"})]}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)("span",{children:["© ",new Date().getFullYear()," RestPoint Funeral Management"]}),(0,e.jsx)("span",{children:"Official Postmortem Request"})]})]})]})})]})}export{Le as default};
