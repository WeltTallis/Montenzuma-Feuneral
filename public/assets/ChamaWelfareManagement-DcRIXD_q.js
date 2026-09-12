import{r as h}from"./chunk-CXHxssQy.js";import{y as b}from"./chunk-CXAmgOhv.js";import{l as u}from"./chunk-DWc5g_hH.js";import{o as f}from"./chunk-BY9AVXEY.js";import{B as x,I as v,Rn as y,nn as w,v as c}from"./index-yov0GYHY.js";import{t as k}from"./chunk-BNAMOA04.js";var o=h(b(),1),e=f(),a={ink:"#15171A",bone:"#FAF8F4",bone2:"#F3EFE6",brass:"#8B7355",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",verdigrisLight:"#4D6359",verdigrisTint:"#EBEFEF",line:"#E3DDD0",lineDark:"rgba(250,248,244,0.14)",gray:"#6B6862",grayLight:"rgba(250,248,244,0.62)",accent:"#C77B5E"};function S(){const s=u(),[n,d]=(0,o.useState)(!1),[i,p]=(0,o.useState)(null),l=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/register")},m=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/contact")},g=()=>{window.scrollTo({top:0,behavior:"smooth"}),s("/terms")};return(0,o.useEffect)(()=>{document.title="Chama Welfare Management Software | Digital Chama Management Kenya | Rest Point",setTimeout(()=>d(!0),60)},[]),(0,e.jsxs)("div",{className:"page-container",children:[(0,e.jsx)("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;color:${a.gray};background:${a.bone};-webkit-font-smoothing:antialiased}
        h1,h2,h3,h4{font-family:'Fraunces',serif;font-weight:500;letter-spacing:-0.01em;color:${a.ink}}
        h1{font-size:clamp(2.2rem,5vw,3.5rem);line-height:1.1;margin-bottom:1.5rem}
        h2{font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.2;margin-bottom:1.5rem}
        h3{font-size:1.2rem;margin-bottom:0.6rem;color:${a.ink}}
        p{line-height:1.75;font-size:1rem;color:${a.gray}}
        
        .mono-label{font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:0.14em;text-transform:uppercase;color:${a.brass};font-weight:500;display:inline-flex;align-items:center;gap:0.5rem}
        
        .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:1rem 1.9rem;font-size:0.9rem;font-weight:500;font-family:'Inter',sans-serif;border:1px solid transparent;border-radius:8px;cursor:pointer;transition:all 0.3s ease;white-space:nowrap}
        .btn-dark{background:${a.ink};color:${a.bone}}
        .btn-dark:hover{background:${a.verdigris};transform:translateY(-2px);box-shadow:0 10px 20px rgba(21,23,26,0.15)}
        .btn-line{background:transparent;color:${a.ink};border-color:${a.line}}
        .btn-line:hover{background:${a.ink};color:${a.bone};border-color:${a.ink}}
        .btn-brass{background:${a.brass};color:${a.bone};border:none}
        .btn-brass:hover{background:${a.brassLight};transform:translateY(-2px);box-shadow:0 10px 20px rgba(139,115,85,0.25)}
        .btn-ghost{background:transparent;color:${a.bone};border:1px solid rgba(250,248,244,0.3)}
        .btn-ghost:hover{background:rgba(250,248,244,0.1);border-color:${a.bone}}
        
        .wrap{max-width:1180px;margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem)}
        .section{padding:clamp(4rem,8vw,6rem)0}
        .section-alt{background:${a.bone2}}
        
        /* Hero */
        .hero{padding-top:140px;padding-bottom:clamp(4rem,8vw,6rem);position:relative;overflow:hidden;background:#000000;color:${a.bone}}
        .hero-grid-bg{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;mask-image:linear-gradient(to bottom,black,transparent 80%);-webkit-mask-image:linear-gradient(to bottom,black,transparent 80%)}
        .hero-glow{position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 20% 50%,rgba(61,79,71,0.3) 0%,transparent 60%);pointer-events:none}
        .hero-content{display:grid;grid-template-columns:1.2fr 0.8fr;gap:4rem;align-items:center;position:relative;z-index:1}
        .hero-desc{font-size:1.1rem;max-width:540px;margin-bottom:2rem;color:rgba(255,255,255,0.8);line-height:1.8}
        .hero-buttons{display:flex;gap:1rem;flex-wrap:wrap}
        .hero h1{color:${a.bone}}
        
        /* Hero Mockup */
        .hero-mockup{background:rgba(255,255,255,0.03);border:1px solid ${a.lineDark};border-radius:16px;padding:2rem;backdrop-filter:blur(10px);box-shadow:0 30px 60px rgba(0,0,0,0.3)}
        .mockup-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid ${a.lineDark}}
        .mockup-title{font-family:'Fraunces',serif;color:${a.bone};font-size:1.1rem}
        .mockup-badge{font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:#4CAF50;background:rgba(40,200,64,0.1);padding:0.3rem 0.6rem;border-radius:4px;border:1px solid rgba(40,200,64,0.3)}
        .mockup-amount{font-size:2.2rem;font-family:'Fraunces',serif;color:${a.bone};margin-bottom:0.5rem}
        .mockup-label{font-size:0.75rem;color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;margin-bottom:1.5rem}
        .mockup-row{display:flex;justify-content:space-between;padding:0.8rem 0;border-bottom:1px solid ${a.lineDark};font-size:0.85rem;color:rgba(255,255,255,0.8)}
        .mockup-row:last-child{border-bottom:none}
        .mockup-status{color:${a.brass};font-family:'JetBrains Mono',monospace;font-size:0.75rem}

        /* Stats */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}
        .stat-card{text-align:center;padding:2rem 1rem;background:${a.bone};border:1px solid ${a.line};border-radius:12px;transition:all 0.3s ease}
        .stat-card:hover{transform:translateY(-5px);border-color:${a.verdigrisLight};box-shadow:0 15px 30px rgba(21,23,26,0.06)}
        .stat-num{font-size:clamp(1.8rem,4vw,2.5rem);font-weight:600;color:${a.verdigris};font-family:'Fraunces',serif;margin-bottom:0.5rem}
        .stat-label{font-size:0.9rem;color:${a.gray};font-family:'Inter',sans-serif}
        
        /* Benefits */
        .benefits-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:3rem}
        .benefit-card{background:${a.bone};padding:1.5rem;border-radius:12px;border:1px solid ${a.line};display:flex;gap:0.8rem;align-items:flex-start;transition:all 0.3s ease}
        .benefit-card:hover{border-color:${a.verdigrisLight};transform:translateY(-2px)}
        
        /* Steps */
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-top:3rem}
        .step-card{text-align:center;padding:2.5rem 2rem;background:${a.bone};border:1px solid ${a.line};border-radius:12px;transition:all 0.3s ease}
        .step-card:hover{transform:translateY(-5px);border-color:${a.verdigrisLight};box-shadow:0 15px 30px rgba(21,23,26,0.06)}
        .step-num{width:56px;height:56px;border-radius:50%;background:${a.verdigris};color:${a.bone};display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-family:'Fraunces',serif;font-size:1.4rem;font-weight:600;box-shadow:0 8px 20px rgba(61,79,71,0.3)}
        .step-title{color:${a.verdigris};font-weight:600;margin-bottom:0.8rem}
        
        /* Testimonials */
        .testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-top:3rem}
        .testimonial-card{background:${a.bone};padding:2.5rem;border-radius:12px;border:1px solid ${a.line};position:relative;transition:all 0.3s ease}
        .testimonial-card:hover{transform:translateY(-5px);box-shadow:0 15px 30px rgba(21,23,26,0.06)}
        .quote-icon{color:${a.bone2};position:absolute;top:20px;right:20px;opacity:0.5}
        .testimonial-text{font-style:italic;color:${a.gray};margin-bottom:1.5rem;font-size:0.95rem;line-height:1.7}
        .testimonial-name{font-weight:600;color:${a.ink};font-size:0.95rem}
        .testimonial-role{font-size:0.85rem;color:${a.gray};margin-top:0.25rem}
        
        /* FAQ */
        .faq-container{max-width:800px;margin:0 auto}
        .faq-item{border-bottom:1px solid ${a.line};padding:1.5rem 0}
        .faq-question{width:100%;text-align:left;background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'Fraunces',serif;font-size:1.1rem;color:${a.ink};padding:0.5rem 0;transition:color 0.2s}
        .faq-question:hover{color:${a.verdigris}}
        .faq-answer{max-height:0;overflow:hidden;transition:max-height 0.3s ease, padding 0.3s ease;color:${a.gray};line-height:1.7;font-size:0.95rem}
        .faq-item.active .faq-answer{max-height:200px;padding-top:1rem}
        
        /* CTA Section */
        .cta-wrapper{background:${a.bone};padding:0 0 clamp(4rem,8vw,7rem)}
        .cta-card{position:relative;background:linear-gradient(135deg,#000000 0%,${a.verdigrisDark} 100%);border-radius:24px;padding:clamp(3rem,6vw,5rem) 2rem;text-align:center;overflow:hidden;border:1px solid ${a.lineDark};box-shadow:0 40px 80px -20px rgba(21,23,26,0.3)}
        .cta-card::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background-image:radial-gradient(circle at 50% 0%,rgba(139,115,85,0.15) 0%,transparent 50%),linear-gradient(rgba(250,248,244,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(250,248,244,0.03) 1px,transparent 1px);background-size:100% 100%,40px 40px,40px 40px;pointer-events:none}
        .cta-content{position:relative;z-index:2;max-width:700px;margin:0 auto}
        .cta-content h2{color:${a.bone};margin-bottom:1.5rem;font-size:clamp(2rem,4.5vw,3rem);line-height:1.2}
        .cta-content p{color:rgba(250,248,244,0.8);font-size:1.1rem;line-height:1.8;margin-bottom:2.5rem}
        .cta-buttons{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
        
        @media(max-width:900px){
          .hero-content{grid-template-columns:1fr;gap:3rem}
          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .benefits-grid{grid-template-columns:1fr}
          .steps-grid{grid-template-columns:1fr}
          .testimonial-grid{grid-template-columns:1fr}
        }
        @media(max-width:480px){
          .hero-buttons{flex-direction:column;width:100%}
          .hero-buttons .btn{width:100%;justify-content:center}
          .stats-grid{grid-template-columns:1fr}
          .cta-buttons{flex-direction:column;width:100%}
          .cta-buttons .btn{width:100%;justify-content:center}
        }
      `}),(0,e.jsxs)("section",{className:"hero",children:[(0,e.jsx)("div",{className:"hero-grid-bg"}),(0,e.jsx)("div",{className:"hero-glow"}),(0,e.jsxs)("div",{className:"wrap hero-content",children:[(0,e.jsxs)("div",{style:{opacity:n?1:0,transform:n?"translateY(0)":"translateY(20px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)"},children:[(0,e.jsxs)("div",{className:"mono-label",style:{marginBottom:"1.5rem",color:a.brass},children:[(0,e.jsx)(y,{size:14})," For Chamas & Investment Groups"]}),(0,e.jsx)("h1",{children:"Chama Welfare Management Software"}),(0,e.jsx)("p",{className:"hero-desc",children:"Empower your chama with smart digital financial management. Track contributions, ensure transparency, and build member trust with Kenya's #1 chama management platform."}),(0,e.jsxs)("div",{className:"hero-buttons",children:[(0,e.jsxs)("button",{className:"btn btn-brass",onClick:l,children:["Start Free Trial ",(0,e.jsx)(c,{size:16})]}),(0,e.jsx)("button",{className:"btn btn-ghost",onClick:m,children:"Contact Sales"})]})]}),(0,e.jsx)("div",{style:{opacity:n?1:0,transform:n?"translateY(0)":"translateY(20px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1) 200ms"},children:(0,e.jsxs)("div",{className:"hero-mockup",children:[(0,e.jsxs)("div",{className:"mockup-header",children:[(0,e.jsx)("span",{className:"mockup-title",children:"Chama Balance"}),(0,e.jsx)("span",{className:"mockup-badge",children:"Active"})]}),(0,e.jsx)("div",{className:"mockup-amount",children:"KES 842,500"}),(0,e.jsx)("div",{className:"mockup-label",children:"TOTAL CONTRIBUTIONS"}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"Jane Muthoni"}),(0,e.jsx)("span",{className:"mockup-status",children:"Paid"})]}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"Samuel Kariuki"}),(0,e.jsx)("span",{className:"mockup-status",children:"Paid"})]}),(0,e.jsxs)("div",{className:"mockup-row",children:[(0,e.jsx)("span",{children:"Grace Njeri"}),(0,e.jsx)("span",{className:"mockup-status",style:{color:a.accent},children:"Pending"})]})]})})]})]}),(0,e.jsx)("section",{className:"section",style:{paddingTop:"4rem",paddingBottom:"4rem"},children:(0,e.jsx)("div",{className:"wrap",children:(0,e.jsx)("div",{className:"stats-grid",children:[{num:"300+",label:"Chamas using Rest Point"},{num:"70%",label:"Reduction in bookkeeping"},{num:"100%",label:"Financial transparency"},{num:"KES 9.2K",label:"Starting price per month"}].map((r,t)=>(0,e.jsxs)("div",{className:"stat-card",children:[(0,e.jsx)("div",{className:"stat-num",children:r.num}),(0,e.jsx)("div",{className:"stat-label",children:r.label})]},t))})})}),(0,e.jsx)("section",{className:"section section-alt",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"Features"}),(0,e.jsx)("h2",{children:"Complete Chama Financial Management"}),(0,e.jsx)("p",{children:"Everything you need to manage your chama's finances, welfare, and member engagement"})]}),(0,e.jsx)("div",{className:"benefits-grid",children:["Digital contribution tracking with M-Pesa integration","Complete financial transparency for all members","Automated payment reminders and arrears tracking","Real-time financial statements and reports","Member self-service portal (mobile-friendly)","Welfare fund management and disbursement","Beneficiary and dependant management","Audit trails for all transactions","SMS notifications for payments and meetings","Affordable pricing for chamas of all sizes"].map((r,t)=>(0,e.jsxs)("div",{className:"benefit-card",children:[(0,e.jsx)(v,{size:20,color:a.verdigris,style:{flexShrink:0,marginTop:"2px"}}),(0,e.jsx)("span",{style:{fontSize:"0.95rem",color:a.gray},children:r})]},t))})]})}),(0,e.jsx)("section",{className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"How It Works"}),(0,e.jsx)("h2",{children:"Get started in 3 simple steps"})]}),(0,e.jsx)("div",{className:"steps-grid",children:[{num:"1",title:"Register Members",desc:"Add chama members with their contact details, next of kin, and beneficiary information. Import from Excel in one click."},{num:"2",title:"Track Contributions",desc:"Members contribute via M-Pesa or cash. Rest Point automatically tracks all payments, sends reminders, and shows real-time balances."},{num:"3",title:"Manage Welfare",desc:"Process welfare requests, manage beneficiary payouts, and generate financial reports. Complete transparency for all members."}].map((r,t)=>(0,e.jsxs)("div",{className:"step-card",children:[(0,e.jsx)("div",{className:"step-num",children:r.num}),(0,e.jsx)("h3",{className:"step-title",children:r.title}),(0,e.jsx)("p",{style:{fontSize:"0.95rem"},children:r.desc})]},t))})]})}),(0,e.jsx)("section",{className:"section section-alt",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"Social Proof"}),(0,e.jsx)("h2",{children:"Trusted by Chamas Across Kenya"}),(0,e.jsx)("p",{children:"Join 300+ chamas already using Rest Point"})]}),(0,e.jsx)("div",{className:"testimonial-grid",children:[{quote:"Rest Point brought transparency to our chama. Members can now see their contributions in real-time, and we've eliminated disputes about finances.",name:"Jane Muthoni",role:"Chairperson, Mwanzo Investment Chama, Nairobi"},{quote:"The M-Pesa integration is a game-changer. Our members love being able to contribute from their phones, and we love the automatic reconciliation.",name:"Samuel Kariuki",role:"Treasurer, Umoja Women's Chama, Nakuru"},{quote:"We reduced bookkeeping from 10 hours per week to 2 hours. The automated reports save us so much time during meetings.",name:"Grace Njeri",role:"Secretary, Jamii Savings Chama, Mombasa"}].map((r,t)=>(0,e.jsxs)("div",{className:"testimonial-card",children:[(0,e.jsx)(w,{className:"quote-icon",size:40}),(0,e.jsxs)("p",{className:"testimonial-text",children:['"',r.quote,'"']}),(0,e.jsx)("div",{className:"testimonial-name",children:r.name}),(0,e.jsx)("div",{className:"testimonial-role",children:r.role})]},t))})]})}),(0,e.jsx)("section",{className:"section",children:(0,e.jsxs)("div",{className:"wrap",children:[(0,e.jsxs)("div",{style:{textAlign:"center",maxWidth:"600px",margin:"0 auto 3rem"},children:[(0,e.jsx)("div",{className:"mono-label",style:{marginBottom:"1rem"},children:"FAQ"}),(0,e.jsx)("h2",{children:"Frequently Asked Questions"})]}),(0,e.jsx)("div",{className:"faq-container",children:[{q:"How can chama management software help our group?",a:"Our chama welfare management software digitizes contribution tracking, ensures complete transparency, and automates financial reporting. Chamas using Rest Point reduce bookkeeping time by 70% and build member trust through visible, accountable financial management."},{q:"Does it work with M-Pesa for chama collections?",a:"Yes! Rest Point integrates seamlessly with M-Pesa, allowing chama members to contribute directly from their phones. The system automatically tracks payments, sends reminders for arrears, and provides real-time balance updates to all members."},{q:"How do you ensure transparency in chama finances?",a:"Rest Point provides complete financial transparency with real-time dashboards, automated member statements, audit trails for all transactions, and role-based access controls. Every member can see their contribution history, and leaders can generate instant financial reports."},{q:"Is the software affordable for small chamas?",a:"Yes, Rest Point offers affordable pricing starting from KES 9,200/month. We believe every chama deserves modern financial management tools. Our transparent pricing means no hidden fees, and you can start with a single-tenant plan that fits your budget."},{q:"Can members access their contribution records?",a:"Absolutely. Rest Point includes a member self-service portal where each member can view their contribution history, download statements, check their balance, and see upcoming payment dates - all from their phone or computer."},{q:"How long does it take to set up for our chama?",a:"Setup takes just 1-2 weeks. We help you import existing member data, configure your contribution rules, and train your chama leadership. Most chamas are fully operational within a few days of signing up."}].map((r,t)=>(0,e.jsxs)("div",{className:`faq-item ${i===t?"active":""}`,children:[(0,e.jsxs)("button",{className:"faq-question",onClick:()=>p(i===t?null:t),children:[(0,e.jsx)("span",{children:r.q}),(0,e.jsx)(x,{size:20,color:a.brass,style:{transform:i===t?"rotate(180deg)":"rotate(0)",transition:"transform 0.3s",flexShrink:0}})]}),(0,e.jsx)("div",{className:"faq-answer",children:r.a})]},t))})]})}),(0,e.jsx)("section",{className:"cta-wrapper",children:(0,e.jsx)("div",{className:"wrap",children:(0,e.jsx)("div",{className:"cta-card",children:(0,e.jsxs)("div",{className:"cta-content",children:[(0,e.jsx)("div",{className:"mono-label",style:{color:a.brass,marginBottom:"1.5rem"},children:"Get Started Today"}),(0,e.jsx)("h2",{children:"Ready to Transform Your Chama's Financial Management?"}),(0,e.jsx)("p",{children:"Join 300+ chamas across Kenya using Rest Point to manage finances with transparency and accountability."}),(0,e.jsxs)("div",{className:"cta-buttons",children:[(0,e.jsxs)("button",{className:"btn btn-brass",onClick:l,children:["Start Free Trial ",(0,e.jsx)(c,{size:18})]}),(0,e.jsx)("button",{className:"btn btn-ghost",onClick:m,children:"Schedule Demo"})]})]})})})}),(0,e.jsx)(k,{goTerms:g})]})}export{S as default};
