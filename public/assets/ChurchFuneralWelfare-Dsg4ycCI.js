import{r as g}from"./chunk-CXHxssQy.js";import{y as u}from"./chunk-CXAmgOhv.js";import{l as b}from"./chunk-DWc5g_hH.js";import{o as f}from"./chunk-BY9AVXEY.js";import{B as x,I as v,St as y,nn as w,v as m}from"./index-DNPiyDLN.js";import{t as j}from"./chunk-BPfG06KN.js";var o=g(u(),1),e=f(),r={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",accent:"#C77B5E"};function S(){const s=b(),[i,d]=(0,o.useState)(!1),[n,p]=(0,o.useState)(null),l=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/register")},c=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/contact")},h=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/terms")};return(0,o.useEffect)(()=>{document.title="Church Funeral Welfare Software | Rest Point Kenya",setTimeout(()=>d(!0),60)},[]),(0,e.jsxs)("div",{className:"page-container",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${r.gray};background:${r.bone};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${r.ink}}
        h1{font-size:clamp(2.2rem,5vw,3.5rem);line-height:1.1;margin-bottom:1.5rem}
        h2{font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.2;margin-bottom:1.5rem}
        h3{font-size:1.2rem;margin-bottom:0.6rem;color:${r.ink}}
        p{line-height:1.75;font-size:1rem;color:${r.gray}}
        
        .mono-label{font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:0.14em;text-transform:uppercase;color:${r.brass};font-weight:500;display:inline-flex;align-items:center;gap:0.5rem}
        
        .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:1rem 1.9rem;font-size:0.9rem;font-weight:500;font-family:'Inter',sans-serif;border:1px solid transparent;border-radius:8px;cursor:pointer;transition:all 0.3s ease;white-space:nowrap}
        .btn-brass{background:${r.brass};color:${r.bone};border:none}
        .btn-brass:hover{background:${r.brassLight};transform:translateY(-2px);box-shadow:0 10px 20px rgba(139,115,85,0.25)}
        .btn-ghost{background:transparent;color:${r.bone};border:1px solid rgba(250,248,244,0.3)}
        .btn-ghost:hover{background:rgba(250,248,244,0.1);border-color:${r.bone}}
        
        .wrap{max-width:1180px;margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem)}
        .section{padding:clamp(4rem,8vw,6rem)0}
        .section-alt{background:${r.bone2}}
        
        /* Hero */
        .hero{padding-top:140px;padding-bottom:clamp(4rem,8vw,6rem);position:relative;overflow:hidden;background:#000000;color:${r.bone}}
        .hero-grid-bg{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;mask-image:linear-gradient(to bottom,black,transparent 80%);-webkit-mask-image:linear-gradient(to bottom,black,transparent 80%)}
        .hero-glow{position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 20% 50%,rgba(61,79,71,0.3) 0%,transparent 60%);pointer-events:none}
        .hero-content{display:grid;grid-template-columns:1.2fr 0.8fr;gap:4rem;align-items:center;position:relative;z-index:1}
        .hero-desc{font-size:1.1rem;max-width:540px;margin-bottom:2rem;color:rgba(255,255,255,0.8);line-height:1.8}
        .hero-buttons{display:flex;gap:1rem;flex-wrap:wrap}
        .hero h1{color:${r.bone}}
        
        /* Hero Mockup */
        .hero-mockup{background:rgba(255,255,255,0.03);border:1px solid ${r.lineDark};border-radius:16px;padding:2rem;backdrop-filter:blur(10px);box-shadow:0 30px 60px rgba(0,0,0,0.3)}
        .mockup-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid ${r.lineDark}}
        .mockup-title{font-family:'Fraunces',serif;color:${r.bone};font-size:1.1rem}
        .mockup-badge{font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:#4CAF50;background:rgba(40,200,64,0.1);padding:0.3rem 0.6rem;border-radius:4px;border:1px solid rgba(40,200,64,0.3)}
        .mockup-amount{font-size:2.2rem;font-family:'Fraunces',serif;color:${r.bone};margin-bottom:0.5rem}
        .mockup-label{font-size:0.75rem;color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;margin-bottom:1.5rem}
        .mockup-row{display:flex;justify-content:space-between;padding:0.8rem 0;border-bottom:1px solid ${r.lineDark};font-size:0.85rem;color:rgba(255,255,255,0.8)}
        .mockup-row:last-child{border-bottom:none}
        .mockup-status{color:${r.brass};font-family:'JetBrains Mono',monospace;font-size:0.75rem}

        /* Benefits */
        .benefits-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:3rem}
        .benefit-card{background:${r.bone};padding:1.5rem;border-radius:12px;border:1px solid ${r.line};display:flex;gap:0.8rem;align-items:flex-start;transition:all 0.3s ease}
        .benefit-card:hover{border-color:${r.verdigrisLight};transform:translateY(-2px)}
        
        /* Steps */
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-top:3rem}
        .step-card{text-align:center;padding:2.5rem 2rem;background:${r.bone};border:1px solid ${r.line};border-radius:12px;transition:all 0.3s ease}
        .step-card:hover{transform:translateY(-5px);border-color:${r.verdigrisLight};box-shadow:0 15px 30px rgba(21,23,26,0.06)}
        .step-num{width:56px;height:56px;border-radius:50%;background:${r.verdigris};color:${r.bone};display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-family:'Fraunces',serif;font-size:1.4rem;font-weight:600;box-shadow:0 8px 20px rgba(61,79,71,0.3)}
        .step-title{color:${r.verdigris};font-weight:600;margin-bottom:0.8rem}
        
        /* Testimonials */
        .testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-top:3rem}
        .testimonial-card{background:${r.bone};padding:2.5rem;border-radius:12px;border:1px solid ${r.line};position:relative;transition:all 0.3s ease}
        .testimonial-card:hover{transform:translateY(-5px);box-shadow:0 15px 30px rgba(21,23,26,0.06)}
        .quote-icon{color:${r.bone2};position:absolute;top:20px;right:20px;opacity:0.5}
        .testimonial-text{font-style:italic;color:${r.gray};margin-bottom:1.5rem;font-size:0.95rem;line-height:1.7}
        .testimonial-name{font-weight:600;color:${r.ink};font-size:0.95rem}
        .testimonial-role{font-size:0.85rem;color:${r.gray};margin-top:0.25rem}
        
        /* FAQ */
        .faq-container{max-width:800px;margin:0 auto}
        .faq-item{border-bottom:1px solid ${r.line};padding:1.5rem 0}
        .faq-question{width:100%;text-align:left;background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'Fraunces',serif;font-size:1.1rem;color:${r.ink};padding:0.5rem 0;transition:color 0.2s}
        .faq-question:hover{color:${r.verdigris}}
        .faq-answer{max-height:0;overflow:hidden;transition:max-height 0.3s ease, padding 0.3s ease;color:${r.gray};line-height:1.7;font-size:0.95rem}
        .faq-item.active .faq-answer{max-height:200px;padding-top:1rem}
        
        /* CTA Section */
        .cta-wrapper{background:${r.bone};padding:0 0 clamp(4rem,8vw,7rem)}
        .cta-card{position:relative;background:linear-gradient(135deg,#000000 0%,${r.verdigrisDark} 100%);border-radius:24px;padding:clamp(3rem,6vw,5rem) 2rem;text-align:center;overflow:hidden;border:1px solid ${r.lineDark};box-shadow:0 40px 80px -20px rgba(21,23,26,0.3)}
        .cta-card::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background-image:radial-gradient(circle at 50% 0%,rgba(139,115,85,0.15) 0%,transparent 50%),linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px);background-size:100% 100%,40px 40px,40px 40px;pointer-events:none}
        .cta-content{position:relative;z-index:2;max-width:700px;margin:0 auto}
        .cta-content h2{color:${r.bone};margin-bottom:1.5rem;font-size:clamp(2rem,4.5vw,3rem);line-height:1.2}
        .cta-content p{color:rgba(250,248,244,0.8);font-size:1.1rem;line-height:1.8;margin-bottom:2.5rem}
        .cta-buttons{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
        
        @media(max-width:900px){
          .hero-content{grid-template-columns:1fr;gap:3rem}
          .benefits-grid{grid-template-columns:1fr}
          .steps-grid{grid-template-columns:1fr}
          .testimonial-grid{grid-template-columns:1fr}
        }
        @media(max-width:480px){
          .hero-buttons{flex-direction:column;width:100%}
          .hero-buttons .btn{width:100%;justify-content:center}
          .cta-buttons{flex-direction:column;width:100%}
          .cta-buttons .btn{width:100%;justify-content:center}
        }
      `}),(0,e.jsxs)("section",{className:"hero",children:[(0,e.jsx)("div",{className:"hero-grid-bg"}),(0,e.jsx)("div",{className:"hero-glow"}),(0,e.jsxs)("div",{className:"wrap hero-content",children:[(0,e.jsxs)("div",{style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(20px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)"},children:[(0,e.jsxs)("div",{className:"mono-label",style:{marginBottom:"1.5rem",color:r.brass},children:[(0,e.jsx)(y,{size:14})," For Churches & Religious Organizations"]}),(0,e.jsx)("h1",{children:"Church Funeral Welfare Software"}),(0,e.jsx)("p",{className:"hero-desc",children:"Streamline your church's funeral welfare program with Kenya's #1 platform. Manage contributions, process claims, and support bereaved families with complete transparency and dignity."}),(0,e.jsxs)("div",{className:"hero-buttons",children:[(0,e.jsxs)("button",{className:"btn btn-brass",onClick:l,children:["Start Free Trial ",(0,e.jsx)(m,{size:16})]}),(0,e.jsx)("button",{className:"btn btn-ghost",onClick:c,children:"Contact Sales"})]})]}),(0,e.jsx)("div",{style:{opacity:i?1:0,transform:i?"translateY(0)":"translateY(20px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1) 200ms"},children:(0,e.jsxs)("div",{className:"hero-mockup",children:[(0,e.jsxs)("div",{className:"mockup-header",children:[(0,e.jsx)("span",{className:"mockup-title",children:"Welfare Fund"}),(0,e.jsx)("span",{className:"mockup-badge",children:"Active"})]}),(0,e.jsx)("div",{className:"mockup-amount",children:"KES 1,240,000"}),(0,e.jsx)("div",{className:"mockup-label",children:"TOTAL CONTRIBUTIONS"}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"John Kamau"}),(0,e.jsx)("span",{className:"mockup-status",children:"Paid"})]}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"Mary Wanjiku"}),(0,e.jsx)("span",{className:"mockup-status",children:"Paid"})]}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"David Mwangi"}),(0,e.jsx)("span",{className:"mockup-status",style:{color:r.accent},children:"Pending"})]})]})})]})]}),(0,e.jsx)("section",{className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"Features"}),(0,e.jsx)("h2",{children:"Everything Your Church Needs"}),(0,e.jsx)("p",{children:"Purpose-built for churches managing funeral welfare programs"})]}),(0,e.jsx)("div",{className:"benefits-grid",children:["Automated contribution tracking with M-Pesa integration","Fast claims processing (24-48 hours)","Real-time financial reporting and transparency","SMS notifications to members and families","Secure beneficiary and dependant management","Committee approval workflows","Member self-service portal","Comprehensive audit trails","Multi-branch support for large churches","24/7 customer support"].map((a,t)=>(0,e.jsxs)("div",{className:"benefit-card",children:[(0,e.jsx)(v,{size:20,color:r.verdigris,style:{flexShrink:0,marginTop:"2px"}}),(0,e.jsx)("span",{style:{fontSize:"0.95rem",color:r.gray},children:a})]},t))})]})}),(0,e.jsx)("section",{className:"section section-alt",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"How It Works"}),(0,e.jsx)("h2",{children:"Get started in 3 simple steps"})]}),(0,e.jsx)("div",{className:"steps-grid",children:[{num:"1",title:"Register Members",desc:"Easily register church members, collect beneficiary information, and store dependant details in a secure, centralized database."},{num:"2",title:"Track Contributions",desc:"Members contribute via M-Pesa or cash. Rest Point automatically tracks payments, sends reminders, and identifies arrears in real-time."},{num:"3",title:"Process Claims",desc:"When a member passes away, submit claims digitally, get committee approvals, and disburse benefits to families within 24-48 hours."}].map((a,t)=>(0,e.jsxs)("div",{className:"step-card",children:[(0,e.jsx)("div",{className:"step-num",children:a.num}),(0,e.jsx)("h3",{className:"step-title",children:a.title}),(0,e.jsx)("p",{style:{fontSize:"0.95rem"},children:a.desc})]},t))})]})}),(0,e.jsx)("section",{className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"Social Proof"}),(0,e.jsx)("h2",{children:"Trusted by Churches Across Kenya"}),(0,e.jsx)("p",{children:"Join 200+ churches already using Rest Point"})]}),(0,e.jsx)("div",{className:"testimonial-grid",children:[{quote:"Rest Point transformed how we manage our church's funeral welfare. The M-Pesa integration is seamless, and our members love the transparency.",name:"Rev. John Kamau",role:"Senior Pastor, Grace Community Church, Nairobi"},{quote:"We reduced claims processing time from 2 weeks to 48 hours. The financial reporting gives our church leadership complete confidence.",name:"Mary Wanjiku",role:"Welfare Committee Chair, St. Mary's Catholic Church"},{quote:"Finally, a system that understands church needs. Member registration, beneficiary management, and contribution tracking - all in one place.",name:"Pastor David Mwangi",role:"Administrative Pastor, Nairobi Baptist Church"}].map((a,t)=>(0,e.jsxs)("div",{className:"testimonial-card",children:[(0,e.jsx)(w,{className:"quote-icon",size:40}),(0,e.jsxs)("p",{className:"testimonial-text",children:['"',a.quote,'"']}),(0,e.jsx)("div",{className:"testimonial-name",children:a.name}),(0,e.jsx)("div",{className:"testimonial-role",children:a.role})]},t))})]})}),(0,e.jsx)("section",{className:"section section-alt",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto 3rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"FAQ"}),(0,e.jsx)("h2",{children:"Frequently Asked Questions"})]}),(0,e.jsx)("div",{className:"faq-container",children:[{q:"How can church funeral welfare software help our congregation?",a:"Our church funeral welfare software automates contribution tracking, streamlines claims processing, and provides complete financial transparency. Churches using Rest Point reduce administration time by 70% and ensure every bereaved family receives timely support."},{q:"Does the software integrate with M-Pesa for church collections?",a:"Yes! Rest Point fully integrates with M-Pesa, allowing church members to make funeral welfare contributions directly from their phones. The system automatically reconciles payments, sends SMS notifications, and updates member records in real-time."},{q:"How do we manage beneficiary information securely?",a:"Rest Point provides secure beneficiary management with role-based access controls, AES-256 encryption, and comprehensive audit trails. Only authorized church leaders can access sensitive member and beneficiary information."},{q:"Can we generate financial reports for church leadership?",a:"Absolutely. Rest Point includes comprehensive financial reporting with automated statements, contribution summaries, claims reports, and audit trails. All reports are available in real-time and can be exported to PDF or Excel."},{q:"How long does implementation take for a church?",a:"Implementation typically takes 1-2 weeks for churches. We provide dedicated onboarding support, help migrate existing member data, and train your welfare committee on using the platform effectively."},{q:"Is the software affordable for small churches?",a:"Yes, Rest Point offers flexible pricing starting from KES 9,200/month for single-tenant plans. We believe every church should have access to modern welfare management tools, regardless of size or budget."}].map((a,t)=>(0,e.jsxs)("div",{className:`faq-item ${n===t?"active":""}`,children:[(0,e.jsxs)("button",{className:"faq-question",onClick:()=>p(n===t?null:t),children:[(0,e.jsx)("span",{children:a.q}),(0,e.jsx)(x,{size:20,color:r.brass,style:{transform:n===t?"rotate(180deg)":"rotate(0)",transition:"transform 0.3s",flexShrink:0}})]}),(0,e.jsx)("div",{className:"faq-answer",children:a.a})]},t))})]})}),(0,e.jsx)("section",{className:"cta-wrapper",children:(0,e.jsx)("div",{className:"wrap",children:(0,e.jsx)("div",{className:"cta-card",children:(0,e.jsxs)("div",{className:"cta-content",children:[(0,e.jsx)("div",{className:"mono-label",style:{color:r.brass,marginBottom:"1.5rem"},children:"Get Started Today"}),(0,e.jsx)("h2",{children:"Ready to Transform Your Church's Funeral Welfare Program?"}),(0,e.jsx)("p",{children:"Join 200+ churches across Kenya using Rest Point to serve their communities with dignity and transparency."}),(0,e.jsxs)("div",{className:"cta-buttons",children:[(0,e.jsxs)("button",{className:"btn btn-brass",onClick:l,children:["Start Free Trial ",(0,e.jsx)(m,{size:18})]}),(0,e.jsx)("button",{className:"btn btn-ghost",onClick:c,children:"Schedule Demo"})]})]})})})}),(0,e.jsx)(j,{goTerms:h})]})}export{S as default};
