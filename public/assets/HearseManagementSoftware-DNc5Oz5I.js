import{r as z}from"./chunk-CXHxssQy.js";import{y as C}from"./chunk-CXAmgOhv.js";import{r as h}from"./chunk-DWc5g_hH.js";import{j as T}from"./chunk-CwzAxjA3.js";import{o as A}from"./chunk-BY9AVXEY.js";import{A as k,An as $,B as F,Fn as y,Gn as N,K as D,M as E,R as B,Un as I,Ut as M,W as S,Xt as L,gn as W,it as R,rt as H,ut as P,v,zt as O}from"./index-Cp7mIUwY.js";var x=z(C(),1),e=A(),r={ink:"#07090A",inkSoft:"#0E1210",white:"#FFFFFF",bg:"#F7F8F6",bgSoft:"#EEF0EC",border:"#D4D9D2",borderDark:"rgba(255,255,255,0.06)",text:"#0A0C0B",textSec:"#525B52",textTer:"#8B9489",accent:"#15803D",accentLight:"#22C55E",accentDark:"#14532D",accentSoft:"rgba(21, 128, 61, 0.08)",accentBorder:"rgba(21, 128, 61, 0.25)",live:"#22C55E"},U=(o=.12)=>{const n=(0,x.useRef)(null),[l,s]=(0,x.useState)(!1);return(0,x.useEffect)(()=>{const t=n.current;if(!t)return;const p=new IntersectionObserver(([f])=>{f.isIntersecting&&(s(!0),p.unobserve(t))},{threshold:o});return p.observe(t),()=>p.disconnect()},[o]),[n,l]},i=({children:o,delay:n=0,className:l=""})=>{const[s,t]=U();return(0,e.jsx)("div",{ref:s,className:l,style:{opacity:t?1:0,transform:t?"translateY(0)":"translateY(30px)",transition:`opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${n}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${n}ms`},children:o})},g=({children:o,light:n})=>(0,e.jsxs)("div",{style:{display:"inline-flex",alignItems:"center",gap:"0.6rem",fontFamily:"'Inter', sans-serif",fontSize:"0.7rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:n?r.accentLight:r.accent,marginBottom:"1.25rem"},children:[(0,e.jsx)("span",{style:{width:20,height:2,background:n?r.accentLight:r.accent,display:"inline-block",borderRadius:2}}),o]}),b=({children:o,sub:n,light:l})=>(0,e.jsxs)("div",{style:{marginBottom:"3rem"},children:[(0,e.jsx)("h2",{style:{fontFamily:"'Inter', sans-serif",fontSize:"clamp(1.8rem, 4vw, 2.8rem)",color:l?r.white:r.text,fontWeight:700,lineHeight:1.15,letterSpacing:"-0.03em",marginBottom:n?"0.9rem":0},children:o}),n&&(0,e.jsx)("p",{style:{fontSize:"1.05rem",color:l?r.textTer:r.textSec,lineHeight:1.75,maxWidth:580,fontWeight:400},children:n})]}),V=()=>{const o=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],n=[14,15,16,17,18,19,20],[l,s]=(0,x.useState)({}),[t,p]=(0,x.useState)(null),f=[{id:"b1",date:15,time:"08:00 AM",location:"Langata Cemetery",client:"Family Mwangi"},{id:"b2",date:17,time:"10:30 AM",location:"Nairobi Hosp Mortuary",client:"Family Ochieng"},{id:"b3",date:18,time:"07:00 AM",location:"Holy Cross Church",client:"Family Kariuki"}],j=["James M.","Peter O.","John K.","Samuel L."],w=(m,d)=>{s(a=>({...a,[m]:d})),p(null)};return(0,e.jsxs)("div",{className:"hms-mockup-wrapper",children:[(0,e.jsxs)("div",{className:"hms-mockup-main",children:[(0,e.jsxs)("div",{className:"hms-mockup-header",children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"0.9rem",fontWeight:700,color:r.text},children:"Fleet Schedule"}),(0,e.jsx)("div",{style:{fontSize:"0.7rem",color:r.textTer,marginTop:2},children:"June 2024 · Advanced View"})]}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:6},children:[(0,e.jsx)("span",{style:{width:6,height:6,borderRadius:"50%",background:r.live,boxShadow:`0 0 8px ${r.live}`}}),(0,e.jsx)("span",{style:{fontSize:"0.65rem",color:r.live,fontWeight:700},children:"LIVE"})]})]}),(0,e.jsx)("div",{className:"hms-mockup-calendar-grid",children:o.map((m,d)=>{const a=f.find(c=>c.date===n[d]);return(0,e.jsxs)("div",{className:`hms-cal-day ${a?"has-booking":""}`,children:[(0,e.jsxs)("div",{className:"hms-cal-day-head",children:[(0,e.jsx)("span",{style:{fontSize:"0.65rem",color:r.textTer,fontWeight:500},children:m}),(0,e.jsx)("span",{style:{fontSize:"0.95rem",fontWeight:700,color:r.text},children:n[d]})]}),a?(0,e.jsxs)("div",{className:"hms-cal-booking-card",children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:4},children:[(0,e.jsx)("span",{style:{fontSize:"0.65rem",fontWeight:700,color:r.accentDark},children:a.time}),(0,e.jsx)(O,{size:10,color:r.textTer})]}),(0,e.jsx)("div",{style:{fontSize:"0.7rem",fontWeight:600,color:r.text,marginBottom:2,lineHeight:1.2},children:a.location}),(0,e.jsx)("div",{style:{fontSize:"0.6rem",color:r.textTer,marginBottom:8},children:a.client}),l[a.id]?(0,e.jsxs)("div",{className:"hms-assigned-badge",children:[(0,e.jsx)(y,{size:10}),(0,e.jsx)("span",{children:l[a.id]}),(0,e.jsx)("button",{onClick:c=>{c.stopPropagation(),w(a.id,null)},className:"hms-unassign-btn",children:(0,e.jsx)(I,{size:10})})]}):(0,e.jsxs)("div",{style:{position:"relative"},children:[(0,e.jsxs)("button",{className:"hms-assign-btn",onClick:c=>{c.stopPropagation(),p(t===a.id?null:a.id)},children:["Assign Driver ",(0,e.jsx)(F,{size:10})]}),t===a.id&&(0,e.jsx)("div",{className:"hms-dropdown-menu",children:j.map((c,u)=>(0,e.jsx)("button",{className:"hms-dropdown-item",onClick:()=>w(a.id,c),children:c},u))})]})]}):(0,e.jsxs)("div",{className:"hms-cal-empty",children:[(0,e.jsx)("span",{style:{fontSize:"1.2rem",color:r.border,fontWeight:300},children:"+"}),(0,e.jsx)("span",{style:{fontSize:"0.6rem",color:r.textTer},children:"Available"})]})]},d)})})]}),(0,e.jsxs)("div",{className:"hms-mockup-sidebar",children:[(0,e.jsxs)("div",{className:"hms-mockup-sidebar-header",children:[(0,e.jsx)(y,{size:14,color:r.textSec}),(0,e.jsx)("span",{style:{fontSize:"0.85rem",fontWeight:700,color:r.text},children:"Driver Portal"})]}),(0,e.jsx)("div",{className:"hms-mockup-drivers",children:j.map((m,d)=>{const a=Object.values(l).includes(m),c=a?"assigned":d===0?"online":"offline",u=a?"On Trip":d===0?"Standby":"Off Duty";return(0,e.jsxs)("div",{className:`hms-mockup-driver ${a?"is-assigned":""}`,children:[(0,e.jsx)("div",{className:"hms-mockup-driver-avatar",style:{background:a?r.accentSoft:r.bgSoft},children:(0,e.jsx)("span",{style:{color:a?r.accent:r.textTer,fontWeight:700,fontSize:"0.75rem"},children:m.charAt(0)})}),(0,e.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,e.jsx)("div",{style:{fontSize:"0.8rem",fontWeight:600,color:r.text},children:m}),(0,e.jsx)("div",{style:{fontSize:"0.65rem",color:a?r.accent:r.textTer,fontWeight:500},children:u})]}),(0,e.jsx)("span",{className:`hms-driver-dot ${c}`})]},d)})}),(0,e.jsxs)("div",{className:"hms-mockup-sync-row",children:[(0,e.jsx)(N,{size:12,color:r.accent}),(0,e.jsx)("span",{style:{fontSize:"0.7rem",color:r.textSec,lineHeight:1.4},children:"Portal synced. Assigned drivers received route details instantly."})]})]})]})},J=()=>{const o=[{icon:(0,e.jsx)(E,{size:20}),title:"Advanced Calendar View",desc:"See your entire week at a glance. Bookings appear directly on the calendar dates so staff know exactly when hearses are free."},{icon:(0,e.jsx)(y,{size:20}),title:"Direct Driver Assignment",desc:"Click a booking and assign a specific driver from your roster. They get notified instantly via the driver portal."},{icon:(0,e.jsx)(R,{size:20}),title:"Real-Time Sync",desc:"When a driver is assigned or a day is booked, the calendar locks out that slot for everyone else immediately."},{icon:(0,e.jsx)(M,{size:20}),title:"Accurate Client Communication",desc:"Families get exact details—driver name, vehicle, and ETA—eliminating guesswork during difficult times."},{icon:(0,e.jsx)(L,{size:20}),title:"Instant Dispatching",desc:"Once assigned, the driver receives routing and client details directly on their portal app. No radio calls needed."},{icon:(0,e.jsx)(P,{size:20}),title:"Complete Audit Trail",desc:"Every calendar action, assignment, and completion is logged automatically for management and compliance."}],n=[{icon:(0,e.jsx)(D,{size:20}),title:"Zero Double-Bookings",desc:"The calendar acts as the single source of truth. If a slot is taken, it's gone for everyone.",stat:"0",statLabel:"Conflicts",color:r.live},{icon:(0,e.jsx)(N,{size:20}),title:"Instant Client Responses",desc:"Staff look at the calendar and confidently tell families exactly what days are open.",stat:"<10s",statLabel:"Response Time",color:r.accentLight},{icon:(0,e.jsx)($,{size:20}),title:"Maximum Fleet Usage",desc:"Easily spot gaps in your schedule and fill them. Ensure no hearse sits idle.",stat:"40%",statLabel:"Utilization Up",color:r.white},{icon:(0,e.jsx)(B,{size:20}),title:"Seamless Driver Sync",desc:"Drivers get instant push notifications for new trips directly to their portal.",stat:"Live",statLabel:"Portal Sync",color:r.textTer}],l=[{icon:(0,e.jsx)(k,{size:18}),title:"Funeral Homes",desc:"Give front desk staff the power to book days ahead and assign specific drivers seamlessly.",tag:"Primary"},{icon:(0,e.jsx)($,{size:18}),title:"Hearse Fleets",desc:"Manage multiple vehicles and drivers from a calendar dashboard.",tag:"Fleet Ops"},{icon:(0,e.jsx)(k,{size:18}),title:"Hospital Morgues",desc:"Schedule transfers days out and assign external drivers through the portal.",tag:"Transfers"},{icon:(0,e.jsx)(W,{size:18}),title:"County Networks",desc:"Coordinate multiple homes sharing a fleet with transparent, real-time calendar booking.",tag:"Enterprise"}];return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(T,{children:[(0,e.jsx)("title",{children:"Hearse Management Software Kenya | Real-Time Booking & Driver Portal"}),(0,e.jsx)("meta",{name:"description",content:"Rest Point is Kenya's leading hearse management software. Advanced calendar booking, assign specific drivers, and connect directly to your drivers' portal."}),(0,e.jsx)("link",{rel:"canonical",href:"https://restpoint.co.ke/hearse-management"})]}),(0,e.jsxs)("div",{className:"hms-page",children:[(0,e.jsx)("style",{children:`
                    /* ═══ GLOBAL ═══ */
                    .hms-page { background: ${r.white}; color: ${r.text}; font-family: 'Inter', sans-serif; overflow-x: hidden; }
                    .hms-page .hms-container { max-width: 1200px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 2.5rem); }
                    .hms-page a { text-decoration: none; }
                    
                    /* ═══ HERO ═══ */
                    .hms-hero {
                        position: relative; padding: clamp(5rem, 11vw, 9rem) 0 clamp(4rem, 9vw, 7rem);
                        background: ${r.ink}; overflow: hidden;
                    }
                    .hms-hero-grid {
                        position: absolute; inset: 0; pointer-events: none;
                        background-image: linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px);
                        background-size: 64px 64px;
                        mask-image: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 70%);
                        -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 70%);
                    }
                    .hms-hero-glow {
                        position: absolute; top: -20%; right: -10%; width: 600px; height: 600px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(21, 128, 61, 0.15) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .hms-hero-content { position: relative; z-index: 2; max-width: 720px; }
                    .hms-hero-breadcrumb {
                        display: inline-flex; align-items: center; gap: 0.45rem;
                        font-size: '0.72rem'; color: ${r.textTer}; margin-bottom: 2.5rem; font-weight: 500;
                    }
                    .hms-hero-breadcrumb a { color: ${r.textTer}; transition: color 0.2s; }
                    .hms-hero-breadcrumb a:hover { color: ${r.white}; }
                    .hms-hero h1 {
                        font-family: 'Inter', sans-serif; font-size: clamp(2.4rem, 6vw, 3.8rem);
                        color: ${r.white}; font-weight: 700; line-height: 1.08;
                        letter-spacing: '-0.04em'; margin-bottom: 1.5rem;
                    }
                    .hms-hero h1 span { color: ${r.accentLight}; }
                    .hms-hero-desc {
                        font-size: '1.05rem'; color: ${r.textTer}; line-height: 1.8; margin-bottom: 2.5rem; max-width: 580px; font-weight: 400;
                    }
                    .hms-hero-desc strong { color: ${r.white}; font-weight: 600; }
                    .hms-hero-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
                    .hms-btn-primary {
                        display: inline-flex; align-items: center; gap: 0.5rem;
                        background: ${r.accent}; color: ${r.white}; border: none;
                        padding: 0.85rem 1.8rem; border-radius: 8px;
                        font-size: '0.9rem'; font-weight: 600; cursor: pointer;
                        font-family: 'Inter', sans-serif; transition: all 0.3s ease;
                    }
                    .hms-btn-primary:hover { background: ${r.accentLight}; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(34,197,94,0.3); }
                    .hms-btn-ghost {
                        display: inline-flex; align-items: center; gap: 0.5rem;
                        background: transparent; color: ${r.white};
                        border: 1px solid rgba(255,255,255,0.15); padding: 0.85rem 1.8rem;
                        border-radius: 8px; font-size: '0.9rem'; font-weight: 500;
                        cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s ease;
                    }
                    .hms-btn-ghost:hover { border-color: rgba(255,255,255,0.4); transform: translateY(-2px); }

                    .hms-hero-stats {
                        position: absolute; right: clamp(1.5rem, 5vw, 3rem); top: 50%; transform: translateY(-50%);
                        display: flex; flex-direction: column; gap: 0.85rem; z-index: 2;
                    }
                    .hms-hero-stat {
                        background: rgba(255,255,255,0.04); backdrop-filter: blur(20px);
                        border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
                        padding: 0.85rem 1.1rem; text-align: right; min-width: 130px; transition: all 0.3s ease;
                    }
                    .hms-hero-stat:hover { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); }
                    .hms-hero-stat-value { font-size: '1.5rem'; color: ${r.white}; font-weight: 700; line-height: 1; }
                    .hms-hero-stat-label { font-size: '0.62rem'; color: ${r.textTer}; margin-top: 0.25rem; text-transform: uppercase; letter-spacing: '0.05em'; font-weight: 500; }

                    /* ═══ MOCKUP SECTION ═══ */
                    .hms-mockup-section { padding: clamp(4rem, 8vw, 6rem) 0; background: ${r.bg}; }
                    .hms-mockup-wrapper {
                        display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; align-items: stretch;
                    }
                    .hms-mockup-main, .hms-mockup-sidebar {
                        background: ${r.white}; border: 1px solid ${r.border}; border-radius: 16px; overflow: hidden;
                    }
                    .hms-mockup-header, .hms-mockup-sidebar-header {
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 1rem 1.25rem; border-bottom: 1px solid ${r.border};
                    }
                    
                    /* Calendar Grid */
                    .hms-mockup-calendar-grid {
                        display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; padding: 1.25rem;
                    }
                    .hms-cal-day {
                        background: ${r.bgSoft}; border-radius: 10px; padding: 0.75rem; border: 1px solid transparent;
                        display: flex; flex-direction: column; min-height: 180px; transition: all 0.2s;
                    }
                    .hms-cal-day.has-booking { border-color: ${r.accentBorder}; background: ${r.white}; }
                    .hms-cal-day-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid ${r.border}; }
                    
                    .hms-cal-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; opacity: 0.6; }
                    
                    .hms-cal-booking-card { flex: 1; display: flex; flex-direction: column; }
                    .hms-assign-btn {
                        display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%;
                        background: ${r.accentSoft}; color: ${r.accent}; border: 1px dashed ${r.accentBorder};
                        padding: 4px; border-radius: 4px; font-size: '0.6rem'; font-weight: 600; cursor: pointer;
                        margin-top: auto; transition: all 0.2s; font-family: 'Inter', sans-serif;
                    }
                    .hms-assign-btn:hover { background: ${r.accent}; color: ${r.white}; border-style: solid; }
                    
                    .hms-assigned-badge {
                        display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-radius: 4px;
                        background: ${r.accentDark}; color: ${r.white}; font-size: '0.6rem'; font-weight: 600; margin-top: auto;
                    }
                    .hms-unassign-btn {
                        background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 0; margin-left: auto; display: flex;
                    }
                    .hms-unassign-btn:hover { color: ${r.white}; }

                    .hms-dropdown-menu {
                        position: absolute; top: 100%; left: 0; right: 0; background: ${r.white}; border: 1px solid ${r.border};
                        border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 50; margin-top: 4px; overflow: hidden;
                    }
                    .hms-dropdown-item {
                        display: block; width: 100%; text-align: left; padding: 8px 10px; background: none; border: none;
                        font-size: '0.75rem'; color: ${r.text}; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s;
                    }
                    .hms-dropdown-item:hover { background: ${r.bgSoft}; color: ${r.accent}; }

                    /* Driver Sidebar */
                    .hms-mockup-sidebar { display: flex; flex-direction: column; }
                    .hms-mockup-drivers { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
                    .hms-mockup-driver {
                        display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; border-radius: 8px; background: ${r.bgSoft}; border: 1px solid transparent; transition: all 0.2s;
                    }
                    .hms-mockup-driver.is-assigned { background: ${r.accentSoft}; border-color: ${r.accentBorder}; }
                    .hms-mockup-driver-avatar {
                        width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                    }
                    .hms-driver-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                    .hms-driver-dot.online { background: ${r.live}; box-shadow: 0 0 6px ${r.live}; }
                    .hms-driver-dot.assigned { background: ${r.accent}; box-shadow: 0 0 6px ${r.accent}; animation: none; }
                    .hms-driver-dot.offline { background: ${r.border}; }
                    
                    .hms-mockup-sync-row {
                        display: flex; align-items: flex-start; gap: 0.6rem; margin: 0.75rem 1.25rem 1rem;
                        padding: 0.75rem; background: ${r.accentSoft}; border-radius: 8px; border: 1px solid ${r.accentBorder};
                        font-size: '0.7rem'; color: ${r.textSec};
                    }

                    /* ═══ FEATURES ═══ */
                    .hms-features { padding: clamp(4rem, 8vw, 6rem) 0; background: ${r.white}; }
                    .hms-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
                    .hms-feature-card {
                        background: ${r.white}; border: 1px solid ${r.border}; border-radius: 14px;
                        padding: 1.6rem 1.4rem; transition: all 0.4s ease; position: relative;
                    }
                    .hms-feature-card:hover { border-color: ${r.accent}; transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }
                    .hms-feature-icon {
                        width: 42px; height: 42px; border-radius: 10px; background: ${r.bgSoft};
                        border: 1px solid ${r.border}; display: flex; align-items: center; justify-content: center;
                        color: ${r.text}; margin-bottom: 1rem; transition: all 0.3s ease;
                    }
                    .hms-feature-card:hover .hms-feature-icon { background: ${r.accent}; color: ${r.white}; border-color: ${r.accent}; }
                    .hms-feature-card h3 { font-size: '0.95rem'; color: ${r.text}; font-weight: 700; margin-bottom: 0.5rem; }
                    .hms-feature-card p { font-size: '0.85rem'; color: ${r.textSec}; line-height: 1.7; }

                    /* ═══ BENEFITS (DARK) ═══ */
                    .hms-benefits { padding: clamp(4rem, 8vw, 6rem) 0; background: ${r.inkSoft}; position: relative; overflow: hidden; }
                    .hms-benefits::before {
                        content: ''; position: absolute; top: -50%; left: -20%; width: 600px; height: 600px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%); pointer-events: none;
                    }
                    .hms-benefits-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; position: relative; z-index: 1; }
                    .hms-benefit-card {
                        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
                        padding: 1.8rem; transition: all 0.4s ease; position: relative; overflow: hidden;
                    }
                    .hms-benefit-card::before {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
                        background: var(--bc, ${r.accentLight}); opacity: 0; transition: opacity 0.4s ease;
                    }
                    .hms-benefit-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-4px); }
                    .hms-benefit-card:hover::before { opacity: 0.6; }
                    .hms-benefit-stat-big { font-size: '2.8rem'; color: ${r.white}; font-weight: 800; line-height: 1; margin-bottom: 0.3rem; letter-spacing: '-0.03em'; }
                    .hms-benefit-stat-label { font-size: '0.65rem'; color: var(--bc, ${r.accentLight}); text-transform: uppercase; letter-spacing: '0.1em'; margin-bottom: 1.3rem; font-weight: 600; }
                    .hms-benefit-card h3 { font-size: '1rem'; color: ${r.white}; font-weight: 700; margin-bottom: 0.5rem; }
                    .hms-benefit-card p { font-size: '0.85rem'; color: ${r.textTer}; line-height: 1.7; }

                    /* ═══ USE CASES ═══ */
                    .hms-usecases { padding: clamp(4rem, 8vw, 6rem) 0; background: ${r.white}; border-top: 1px solid ${r.border}; }
                    .hms-usecases-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
                    .hms-usecase-card {
                        background: ${r.bg}; border: 1px solid ${r.border}; border-radius: 14px;
                        padding: 1.6rem 1.3rem; transition: all 0.3s ease; display: flex; flex-direction: column;
                    }
                    .hms-usecase-card:hover { border-color: ${r.accent}; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); }
                    .hms-usecase-tag {
                        display: inline-flex; align-self: flex-start; font-size: '0.6rem'; font-weight: 700;
                        letter-spacing: '0.08em'; text-transform: uppercase; color: ${r.accentDark};
                        background: ${r.accentSoft}; border: 1px solid ${r.accentBorder}; padding: '0.2rem 0.5rem'; border-radius: 4px; margin-bottom: 1rem;
                    }
                    .hms-usecase-icon {
                        width: 38px; height: 38px; border-radius: 8px; background: ${r.white};
                        border: 1px solid ${r.border}; display: flex; align-items: center; justify-content: center;
                        color: ${r.text}; margin-bottom: 0.85rem; transition: all 0.3s ease;
                    }
                    .hms-usecase-card:hover .hms-usecase-icon { background: ${r.accent}; color: ${r.white}; border-color: ${r.accent}; }
                    .hms-usecase-card h3 { font-size: '0.95rem'; color: ${r.text}; font-weight: 700; margin-bottom: 0.45rem; }
                    .hms-usecase-card p { font-size: '0.82rem'; color: ${r.textSec}; line-height: 1.65; flex: 1; }

                    /* ═══ CTA ═══ */
                    .hms-cta { padding: clamp(4rem, 8vw, 6rem) 0; background: ${r.bg}; }
                    .hms-cta-box {
                        position: relative; background: ${r.ink}; border: 1px solid rgba(34,197,94,0.1);
                        border-radius: 20px; padding: clamp(3rem, 6vw, 4.5rem); text-align: center; overflow: hidden;
                    }
                    .hms-cta-box::before {
                        content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 800px; height: 800px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 60%); pointer-events: none;
                    }
                    .hms-cta-content { position: relative; z-index: 2; }
                    .hms-cta-box h2 { font-size: clamp(1.8rem, 4vw, 2.5rem); color: ${r.white}; font-weight: 700; margin-bottom: 0.85rem; letter-spacing: '-0.03em'; }
                    .hms-cta-box p { font-size: '1.05rem'; color: ${r.textTer}; line-height: 1.75; max-width: 520px; margin: 0 auto 2.25rem; }
                    .hms-cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

                    /* ═══ RELATED ═══ */
                    .hms-related { padding: clamp(3rem, 6vw, 4.5rem) 0; background: ${r.white}; border-top: 1px solid ${r.border}; }
                    .hms-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                    .hms-related-link {
                        display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem;
                        background: ${r.bg}; border: 1px solid ${r.border}; border-radius: 10px;
                        font-size: '0.82rem'; color: ${r.textSec}; transition: all 0.25s ease; cursor: pointer;
                    }
                    .hms-related-link:hover { background: ${r.white}; border-color: ${r.accent}; color: ${r.accent}; transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
                    .hms-related-link svg { flex-shrink: 0; color: ${r.textTer}; transition: color 0.2s; }
                    .hms-related-link:hover svg { color: ${r.accent}; }

                    /* ═══ RESPONSIVE ═══ */
                    @media (max-width: 1024px) {
                        .hms-features-grid { grid-template-columns: repeat(2, 1fr); }
                        .hms-usecases-grid { grid-template-columns: repeat(2, 1fr); }
                        .hms-hero-stats { display: none; }
                        .hms-mockup-wrapper { grid-template-columns: 1fr; }
                    }
                    @media (max-width: 768px) {
                        .hms-benefits-grid { grid-template-columns: 1fr; }
                        .hms-features-grid { grid-template-columns: 1fr; }
                        .hms-usecases-grid { grid-template-columns: 1fr; }
                        .hms-related-grid { grid-template-columns: 1fr; }
                        .hms-mockup-calendar-grid { grid-template-columns: repeat(2, 1fr); }
                        .hms-cal-day { min-height: 140px; }
                    }
                `}),(0,e.jsxs)("section",{className:"hms-hero",children:[(0,e.jsx)("div",{className:"hms-hero-grid"}),(0,e.jsx)("div",{className:"hms-hero-glow"}),(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)("div",{className:"hms-hero-content",children:[(0,e.jsx)(i,{children:(0,e.jsxs)("div",{className:"hms-hero-breadcrumb",children:[(0,e.jsx)(h,{to:"/",children:"Home"}),(0,e.jsx)(S,{size:12}),(0,e.jsx)(h,{to:"/mortuary-management-software",children:"Solutions"}),(0,e.jsx)(S,{size:12}),(0,e.jsx)("span",{children:"Hearse Management"})]})}),(0,e.jsx)(i,{delay:80,children:(0,e.jsxs)("h1",{children:["Advanced ",(0,e.jsx)("span",{children:"Calendar Booking"})," & Driver Assignment"]})}),(0,e.jsx)(i,{delay:160,children:(0,e.jsx)("p",{className:"hms-hero-desc",children:"View your fleet days in advance on a live calendar. Assign specific drivers to specific bookings instantly, and sync it directly to their portal."})}),(0,e.jsx)(i,{delay:240,children:(0,e.jsxs)("div",{className:"hms-hero-buttons",children:[(0,e.jsxs)(h,{to:"/register",className:"hms-btn-primary",children:["Request Demo ",(0,e.jsx)(v,{size:15})]}),(0,e.jsx)(h,{to:"/contact",className:"hms-btn-ghost",children:"Contact Sales"})]})})]}),(0,e.jsxs)("div",{className:"hms-hero-stats",children:[(0,e.jsx)(i,{delay:400,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"0"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"Conflicts"})]})}),(0,e.jsx)(i,{delay:500,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"Live"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"Driver Sync"})]})}),(0,e.jsx)(i,{delay:600,children:(0,e.jsxs)("div",{className:"hms-hero-stat",children:[(0,e.jsx)("div",{className:"hms-hero-stat-value",children:"Days"}),(0,e.jsx)("div",{className:"hms-hero-stat-label",children:"In Advance"})]})})]})]})]}),(0,e.jsx)("section",{className:"hms-mockup-section",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(i,{children:[(0,e.jsx)(g,{children:"System Interface"}),(0,e.jsx)(b,{sub:"Click a booking on the calendar to assign a driver. Watch the driver portal update instantly.",children:"Calendar & Driver Sync"})]}),(0,e.jsx)(i,{delay:150,children:(0,e.jsx)(V,{})})]})}),(0,e.jsx)("section",{className:"hms-features",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(i,{children:[(0,e.jsx)(g,{children:"Capabilities"}),(0,e.jsx)(b,{sub:"Built for funeral homes that need absolute certainty in their scheduling.",children:"Key Features"})]}),(0,e.jsx)("div",{className:"hms-features-grid",children:o.map((s,t)=>(0,e.jsx)(i,{delay:t*70,children:(0,e.jsxs)("div",{className:"hms-feature-card",children:[(0,e.jsx)("div",{className:"hms-feature-icon",children:s.icon}),(0,e.jsx)("h3",{children:s.title}),(0,e.jsx)("p",{children:s.desc})]})},t))})]})}),(0,e.jsx)("section",{className:"hms-benefits",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(i,{children:[(0,e.jsx)(g,{light:!0,children:"Impact"}),(0,e.jsx)(b,{light:!0,sub:"Measurable results for your scheduling accuracy and driver coordination.",children:"Why Rest Point?"})]}),(0,e.jsx)("div",{className:"hms-benefits-grid",children:n.map((s,t)=>(0,e.jsx)(i,{delay:t*90,children:(0,e.jsxs)("div",{className:"hms-benefit-card",style:{"--bc":s.color},children:[(0,e.jsx)("div",{className:"hms-benefit-stat-big",children:s.stat}),(0,e.jsx)("div",{className:"hms-benefit-stat-label",children:s.statLabel}),(0,e.jsx)("h3",{children:s.title}),(0,e.jsx)("p",{children:s.desc})]})},t))})]})}),(0,e.jsx)("section",{className:"hms-usecases",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsxs)(i,{children:[(0,e.jsx)(g,{children:"Deployments"}),(0,e.jsx)(b,{sub:"From single-vehicle operators to county-wide fleet networks.",children:"Who Uses This?"})]}),(0,e.jsx)("div",{className:"hms-usecases-grid",children:l.map((s,t)=>(0,e.jsx)(i,{delay:t*90,children:(0,e.jsxs)("div",{className:"hms-usecase-card",children:[(0,e.jsx)("span",{className:"hms-usecase-tag",children:s.tag}),(0,e.jsx)("div",{className:"hms-usecase-icon",children:s.icon}),(0,e.jsx)("h3",{children:s.title}),(0,e.jsx)("p",{children:s.desc})]})},t))})]})}),(0,e.jsx)("section",{className:"hms-cta",children:(0,e.jsx)("div",{className:"hms-container",children:(0,e.jsx)(i,{children:(0,e.jsx)("div",{className:"hms-cta-box",children:(0,e.jsxs)("div",{className:"hms-cta-content",children:[(0,e.jsx)("h2",{children:"Ready to Sync Your Fleet?"}),(0,e.jsx)("p",{children:"Stop manual booking errors. Give your staff the power to assign drivers directly from the calendar."}),(0,e.jsxs)("div",{className:"hms-cta-buttons",children:[(0,e.jsxs)(h,{to:"/register",className:"hms-btn-primary",children:["Get Free Demo ",(0,e.jsx)(v,{size:15})]}),(0,e.jsxs)(h,{to:"/pricing",className:"hms-btn-ghost",children:["View Pricing ",(0,e.jsx)(H,{size:13})]})]})]})})})})}),(0,e.jsx)("section",{className:"hms-related",children:(0,e.jsxs)("div",{className:"hms-container",children:[(0,e.jsx)(i,{children:(0,e.jsx)(g,{children:"Explore More"})}),(0,e.jsx)("div",{className:"hms-related-grid",children:[{to:"/mortuary-management-software",label:"Mortuary Management Software"},{to:"/blog/innovations-in-funeral-industry",label:"Innovations in Funeral Industry"},{to:"/mortuary-billing",label:"Mortuary Billing Software"},{to:"/blog/how-to-manage-funeral-home",label:"How to Manage a Funeral Home"}].map((s,t)=>(0,e.jsx)(i,{delay:t*60,children:(0,e.jsxs)(h,{to:s.to,className:"hms-related-link",children:[(0,e.jsx)(v,{size:14}),s.label]})},t))})]})})]})]})};export{J as default};
