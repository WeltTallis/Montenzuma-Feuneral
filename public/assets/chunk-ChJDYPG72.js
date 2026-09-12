import{n as ir,r as Pt}from"./chunk-CXHxssQy.js";import{y as or}from"./chunk-CXAmgOhv.js";import{f as ar,t as sr}from"./chunk-DWc5g_hH.js";import{_ as d,m as et}from"./chunk-DJYPtS2Y.js";import{o as lr}from"./chunk-BY9AVXEY.js";import{a as dr}from"./chunk-C935kdjU.js";import{$t as cr,An as dt,F as Wt,H as pr,I as Rt,Jt as mr,K as st,Nt as fr,R as gr,U as Ht,Un as Ue,V as hr,W as Ot,dn as ur,en as xr,f as br,in as Ut,j as lt,k as yr,t as vr,wt as kr,x as wr,yt as jr,zt as Sr}from"./index-Cp7mIUwY.js";import{t as _r}from"./chunk-55PMCuP4.js";import{i as Cr,n as $r,r as Fr}from"./chunk-gJ4P60Tf.js";import{t as ne}from"./chunk-CizeQYCt.js";var c=Pt(or(),1),De={pending:"#d97706",booked:"#00296B",confirmed:"#00296B",scheduled:"#E36414",in_transit:"#E36414",in_progress:"#0c0b0f",postponed:"#d97706",completed:"#5F0F40",delivered:"#132A13",cancelled:"#DD2D4A",maintenance:"#03071E"},we={pending:{label:"Pending",color:"#d97706",bg:"#FFFBEB",textColor:"#92400E"},booked:{label:"Booked",color:"#00296B",bg:"#EFF6FF",textColor:"#1E40AF"},confirmed:{label:"Confirmed",color:"#00296B",bg:"#EFF6FF",textColor:"#1E40AF"},scheduled:{label:"Scheduled",color:"#E36414",bg:"#FFEDD5",textColor:"#9A3412"},in_transit:{label:"In Transit",color:"#E36414",bg:"#FFEDD5",textColor:"#9A3412"},in_progress:{label:"In Progress",color:"#0c0b0f",bg:"#F3F4F6",textColor:"#374151"},postponed:{label:"Postponed",color:"#d97706",bg:"#FFFBEB",textColor:"#92400E"},completed:{label:"Completed",color:"#5F0F40",bg:"#FCE7F3",textColor:"#831843"},delivered:{label:"Delivered",color:"#132A13",bg:"#E8F5E9",textColor:"#166534"},cancelled:{label:"Cancelled",color:"#DD2D4A",bg:"#FEE2E2",textColor:"#991B1B"},maintenance:{label:"Maintenance",color:"#03071E",bg:"#E0E7FF",textColor:"#312E81"}},je={nairobi:{name:"Nairobi",color:"#DC2626"},thika:{name:"Thika",color:"#16A34A"},mombasa:{name:"Mombasa",color:"#2563EB"},nakuru:{name:"Nakuru",color:"#7C3AED"},kisumu:{name:"Kisumu",color:"#EA580C"}},ve={"montenzuma-monalisa-feuneral-home-nairobi":"Nairobi","montenzuma-monalisa-feuneral-home-machakos":"Machakos","montenzuma-monalisa-feuneral-home-thika":"Thika","montenzuma-monalisa-feuneral-home-mombasa":"Mombasa","montenzuma-monalisa-feuneral-home-nakuru":"Nakuru","montenzuma-monalisa-feuneral-home-kisumu":"Kisumu",nairobi:"Nairobi",machakos:"Machakos",thika:"Thika",mombasa:"Mombasa",nakuru:"Nakuru",kisumu:"Kisumu"};function Dr(t){Array.isArray(t)&&t.forEach(r=>{const o=r.branch_slug||r.slug||r.branchSlug||"",f=r.branch_name||r.name||r.branchName||r.city||"";o&&f&&(ve[o]=f)})}var zr=new Set(["main branch","main","default","unknown","n/a","—",""]);function Er(){try{const t=localStorage.getItem("branches")||localStorage.getItem("tenant_branches")||localStorage.getItem("branchList");if(t){const r=JSON.parse(t);Array.isArray(r)&&Dr(r)}}catch{}}Er();function Br(t){if(!t)return"Unknown";const r=t.booking_branch_slug||t.branch_slug||t.branchSlug||t.branch||"";if(r&&ve[r])return ve[r];if(r&&r.includes("-")){const s=r.split("-").pop();if(s){const S=s.charAt(0).toUpperCase()+s.slice(1);if(new Set(["nairobi","machakos","thika","mombasa","nakuru","kisumu","eldoret","naivasha","kitale","malaba","garissa","embu","meru","nyeri","kericho","kakamega","bungoma","nyeri","mombasa","machakos"]).has(s.toLowerCase()))return S}}const o=(t.branch_name||t.branchName||t.hearse_branch_name||"").trim();if(o&&!zr.has(o.toLowerCase()))return o;const f=t.branch_id||t.branchId;if(f&&ve[String(f)])return ve[String(f)];if(r&&je[r])return je[r].name;if(o&&je[o.toLowerCase()])return je[o.toLowerCase()].name;if(r&&r.includes("-")){const s=r.split("-").pop();if(s&&s.length>2)return s.charAt(0).toUpperCase()+s.slice(1)}return o||r||"Unknown"}function ft(t){if(!t)return!1;if(t.is_multi_day||t.multi_day||t.isMultiDay)return!0;const r=t.start_date||t.startDate||t.date,o=t.end_date||t.endDate;if(r&&o){const f=new Date(r),s=new Date(o);if(!isNaN(f.getTime())&&!isNaN(s.getTime()))return f.setHours(0,0,0,0),s.setHours(0,0,0,0),s.getTime()!==f.getTime()}return!1}function Tr(t){const r=t.start_date||t.startDate||t.date,o=t.end_date||t.endDate||r;if(!r)return[];const f=new Date(r),s=new Date(o);if(isNaN(f.getTime()))return[];isNaN(s.getTime())&&s.setTime(f.getTime()),f.setHours(0,0,0,0),s.setHours(0,0,0,0);const S=[],C=new Date(f);for(;C<=s;)S.push(Mr(C)),C.setDate(C.getDate()+1);return S}var gt=["#7C3AED","#DB2777","#0891B2","#CA8A04","#4F46E5","#059669","#DC2626","#EA580C"];function ht(t){const r=t?.id||t?.booking_id||t?.bookingId||0,o=String(r).split("").reduce((f,s)=>f+s.charCodeAt(0),0);return gt[o%gt.length]}var Mr=t=>t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"),e=lr();var xi=Array.from({length:17},(t,r)=>6+r),Ge=t=>{if(t.booking_dates)try{const o=typeof t.booking_dates=="string"?JSON.parse(t.booking_dates):t.booking_dates;if(Array.isArray(o)&&o.length)return o}catch{}const r=t.booking_date||t.estimated_departure_time||t.date||t.start_date;return r?[r]:[]},Ar=d.div`
  background: #FFFFFF;
  border-radius: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #000000;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  overflow: hidden;

  @media (max-width: 640px) {
    padding: 12px 16px;
    height: 100vh;
    min-height: 100vh;
  }

  /* FullCalendar custom styles */
  .fc {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    height: 100% !important;
    flex: 1 !important;
  }

  .fc .fc-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px !important;
  }

  .fc .fc-toolbar-title {
    font-size: 18px;
    font-weight: 700;
    color: #000000;
  }

  .fc .fc-button {
    background: #FFFFFF;
    border: 1px solid #EEEEEE;
    color: #000000;
    font-weight: 600;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    text-transform: capitalize;
    height: auto !important;
  }

  .fc .fc-button:hover {
    background: #000000;
    color: #FFFFFF;
    border-color: #000000;
  }

  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background: #000000;
    color: #FFFFFF;
    border-color: #000000;
  }

  .fc .fc-button-primary:focus {
    box-shadow: none;
  }

  /* ===== MONTH VIEW STYLES ===== */
  .fc .fc-daygrid-body {
    min-height: 300px !important;
  }

  .fc .fc-daygrid-day {
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 80px !important;
  }

  .fc .fc-daygrid-day:hover {
    background: #F5F5F5;
  }

  .fc .fc-daygrid-day-frame {
    padding: 4px;
    min-height: 80px !important;
  }

  .fc .fc-daygrid-day-number {
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    padding: 4px 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fc .fc-day-today .fc-daygrid-day-number {
    background: #2E7D32;
    color: #FFFFFF;
  }

  .fc .fc-daygrid-day.fc-day-today {
    background: transparent;
  }

  .fc .fc-daygrid-day-other .fc-daygrid-day-number {
    opacity: 0.3;
  }

  .fc .fc-daygrid-day-events {
    margin-top: 2px;
    display: flex;
    gap: 2px;
    justify-content: center;
    flex-wrap: wrap;
    min-height: 8px;
  }

  .fc-daygrid-day-events .fc-event-dot-wrapper {
    display: flex;
    gap: 2px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .fc-event-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    display: inline-block;
  }

  .fc .fc-daygrid-day-bottom {
    font-size: 10px;
    font-weight: 600;
    color: #999999;
  }

  .fc .fc-daygrid-day-events .fc-daygrid-day-event {
    display: none !important;
  }

  .fc .fc-daygrid-more-link {
    font-size: 10px !important;
    font-weight: 600 !important;
    color: #6b7280 !important;
    cursor: pointer !important;
    padding: 1px 4px !important;
    border-radius: 4px !important;
    margin-top: 2px !important;
  }

  .fc .fc-daygrid-more-link:hover {
    background: #F3F4F6 !important;
  }

  /* ===== WEEK & DAY VIEW - FULL CARDS LIKE BEFORE ===== */
  .fc .fc-timegrid-axis-cushion,
  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px;
    font-weight: 600;
    color: #999999;
    padding: 4px 8px !important;
  }

  .fc .fc-timegrid-axis {
    background: #FAFAFA !important;
    border-right: 1px solid #EEEEEE !important;
    width: 50px !important;
  }

  .fc .fc-timegrid-slot-label {
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
    height: 50px !important;
  }

  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #999999 !important;
  }

  .fc .fc-timegrid-col {
    border-right: 1px solid #EEEEEE !important;
    background: #FFFFFF;
  }

  .fc .fc-timegrid-col.fc-day-today {
    background: #FAFAFA !important;
  }

  .fc .fc-col-header-cell {
    padding: 8px 0 !important;
    background: #FFFFFF !important;
    border-bottom: 2px solid #EEEEEE !important;
  }

  .fc .fc-col-header-cell-cushion {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #000000 !important;
    text-decoration: none !important;
  }

  .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
    color: #2E7D32 !important;
  }

  /* Event styling - Full cards like before */
  .fc .fc-timegrid-event {
    border-radius: 6px !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    padding: 6px 8px !important;
    margin: 2px 3px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    min-height: 40px !important;
  }

  .fc .fc-timegrid-event:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 10 !important;
  }

  .fc .fc-timegrid-event .fc-event-main {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    padding: 2px !important;
  }

  .fc .fc-timegrid-event .fc-event-time {
    font-size: 10px !important;
    font-weight: 600 !important;
    opacity: 0.9 !important;
    display: block !important;
  }

  .fc .fc-timegrid-event .fc-event-title {
    font-weight: 700 !important;
    font-size: 13px !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-destination {
    font-size: 10px !important;
    opacity: 0.85 !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-from {
    font-size: 9px !important;
    opacity: 0.7 !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-plate {
    font-size: 9px !important;
    opacity: 0.7 !important;
    display: inline-block !important;
  }

  .fc .fc-timegrid-event .fc-event-status {
    font-size: 9px !important;
    font-weight: 600 !important;
    display: inline-block !important;
    padding: 1px 8px !important;
    border-radius: 4px !important;
    align-self: flex-start !important;
    margin-top: 2px !important;
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: #D32F2F !important;
    border-width: 2px !important;
  }

  .fc .fc-timegrid-now-indicator-arrow {
    border-color: #D32F2F !important;
    border-width: 5px !important;
  }

  .fc .fc-timegrid-now-indicator-line::before {
    content: '● ' !important;
    color: #D32F2F !important;
    font-size: 10px !important;
    position: absolute !important;
    left: -16px !important;
    top: -5px !important;
  }

  /* All-day row styling */
  .fc .fc-timegrid-axis-frame {
    background: #FAFAFA !important;
  }

  .fc .fc-timegrid-axis-frame .fc-timegrid-axis-cushion {
    font-size: 9px !important;
    font-weight: 700 !important;
    color: #999999 !important;
    text-transform: uppercase !important;
  }

  .fc .fc-timegrid-all-day-events {
    min-height: 35px !important;
    background: #FFFFFF !important;
    padding: 2px !important;
  }

  .fc .fc-timegrid-all-day-event {
    border-radius: 6px !important;
    border: none !important;
    padding: 4px 8px !important;
    margin: 2px 3px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
    min-height: 28px !important;
    display: flex !important;
    align-items: center !important;
  }

    .fc .fc-timegrid-all-day-event .fc-event-title {
    font-weight: 700 !important;
    font-size: 12px !important;
  }

  /* Week/Day view event card overflow fix */
  .fc .fc-timegrid-event,
  .fc .fc-timegrid-all-day-event {
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-main,
  .fc .fc-timegrid-all-day-event .fc-event-main {
    min-width: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-content,
  .fc .fc-timegrid-all-day-event .fc-event-content {
    min-width: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
  }

  .fc .fc-timegrid-event .fc-event-title,
  .fc .fc-timegrid-all-day-event .fc-event-title {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    min-width: 0 !important;
  }

  /* Popover styling */
  .fc .fc-popover {
    border-radius: 12px !important;
    border: 1px solid #EEEEEE !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
    background: #FFFFFF !important;
  }

  .fc .fc-popover-header {
    padding: 10px 14px !important;
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
    border-radius: 12px 12px 0 0 !important;
  }

  .fc .fc-popover-title {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #000000 !important;
  }

  .fc .fc-popover-body {
    padding: 6px 10px !important;
  }

  .fc .fc-popover-body .fc-event {
    border-radius: 6px !important;
    padding: 6px 10px !important;
    margin: 3px 0 !important;
    min-height: 30px !important;
  }

  .fc .fc-popover-body .fc-event .fc-event-title {
    font-weight: 600 !important;
    font-size: 12px !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .fc .fc-col-header-cell-cushion {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 11px !important;
    }

    .fc .fc-timegrid-event .fc-event-time {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-event .fc-event-destination {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-axis {
      width: 35px !important;
    }

    .fc .fc-timegrid-axis-cushion {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-slot-label {
      height: 40px !important;
    }

    .fc .fc-daygrid-day {
      min-height: 60px !important;
    }

    .fc .fc-daygrid-day-frame {
      min-height: 60px !important;
    }

    .fc .fc-timegrid-event {
      padding: 4px 6px !important;
      min-height: 32px !important;
    }

    .fc .fc-timegrid-all-day-event {
      font-size: 10px !important;
      padding: 2px 6px !important;
      min-height: 22px !important;
    }
  }

  @media (max-width: 640px) {
    .fc .fc-toolbar {
      flex-direction: column;
      gap: 8px;
    }
    
    .fc .fc-toolbar-chunk {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    
    .fc .fc-daygrid-day-number {
      font-size: 12px;
      width: 26px;
      height: 26px;
    }

    .fc .fc-daygrid-day-frame {
      min-height: 50px !important;
      padding: 2px !important;
    }

    .fc .fc-col-header-cell {
      padding: 4px 0 !important;
    }

    .fc .fc-col-header-cell-cushion {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-event {
      padding: 3px 4px !important;
      min-height: 28px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event .fc-event-time {
      font-size: 8px !important;
    }

    .fc .fc-timegrid-now-indicator-line::before {
      display: none !important;
    }

    .fc .fc-daygrid-day {
      min-height: 50px !important;
    }

    .fc .fc-timegrid-all-day-event {
      font-size: 9px !important;
      padding: 2px 4px !important;
      min-height: 20px !important;
    }
  }
`;d.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #FAFAFA;
  border-radius: 8px;
  flex-wrap: wrap;
  border: 1px solid #EEEEEE;
  flex-shrink: 0;
`;d.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #999999;
`;d.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${t=>t.color};
`;var Ir=d.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`,Nr=d.div`
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: #FFFFFF;
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid #E8ECEF;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`,ze=d.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px 5px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${t=>t.color||"#111827"};
  background: ${t=>t.tint||t.color||"#F3F4F6"};
  border: 1px solid ${t=>t.border||"transparent"};
  white-space: nowrap;
`,Ee=d.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: #FFFFFF;
  background: ${t=>t.color||"#111827"};
  flex-shrink: 0;
`,Lr=({bookings:t=[],onItemClick:r,onCreateBooking:o,selectedDate:f,onDateSelect:s,onDateClick:S})=>{const[C,q]=(0,c.useState)("dayGridMonth"),[y,D]=(0,c.useState)(null),O=(0,c.useRef)(null),W=(0,c.useMemo)(()=>{try{const p=dr(),x=new Map;return p.forEach(g=>{const m=g.branchId||g.branch_id||g.id,B=g.branchSlug||g.branch_slug||"",z=g.branchName||g.branch_name||g.name||"";m&&z&&x.set(`id:${String(m)}`,z),B&&z&&x.set(`slug:${B}`,z),B&&z&&x.set(`slug:${B}`,z)}),x}catch{return new Map}},[]),v=p=>{if(!p)return"";const x=p.split("-"),g=x[x.length-1];return g.charAt(0).toUpperCase()+g.slice(1)},N=(p,x,g)=>{const m=new Set(["main branch","main","default","unknown","n/a","—",""]),B=(g||"").trim();if(B&&!m.has(B.toLowerCase()))return B;if(p){const z=W.get(`id:${String(p)}`);if(z)return z}if(x){const z=W.get(`slug:${x}`);return z||(ve[x]?ve[x]:v(x))}return B&&je[B.toLowerCase()]?je[B.toLowerCase()].name:B||"Unknown"},w=(0,c.useMemo)(()=>Array.isArray(t)?t.map(p=>{const x=we[p.status]||we.pending,g=Ge(p),m=g[0],B=g[1]||p.end_date||p.estimated_arrival_time||m;if(!m)return null;const z=!String(m).includes("T")&&!String(m).includes(":");let M="",L="";try{const ie=new Date(m);isNaN(ie.getTime())||(M=ie.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}));const V=new Date(B);isNaN(V.getTime())||(L=V.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}))}catch{}const Y=p.hearse_name||p.hearse_plate||p.plate_number||"H",J=(p.client_name||p.client||"client").toString(),ee=`BK-${Y}-${J}-${m?String(m).split("T")[0]?.replace(/[-]/g,""):"nodate"}-${Math.random().toString(36).substring(2,7).toUpperCase()}`,de=N(p.branch_id,p.booking_branch_slug||p.branch_slug||p.branchSlug,p.branch_name||p.branchName||p.hearse_branch_name||p.branch),te=Ge(p),Se=te.length>1||(()=>{if(te.length===1){const ie=new Date(te[0]),V=new Date(ie);return V.setDate(V.getDate()+1),p.end_date&&new Date(p.end_date).toDateString()!==ie.toDateString()}return!1})();return{id:p.booking_id||p.id||`booking-${Math.random()}`,bookingId:ee,title:p.client_name||p.client||"Unknown Client",start:m,end:B||m,allDay:z,backgroundColor:x.color,borderColor:x.color,textColor:"#FFFFFF",extendedProps:{...p,status:p.status,statusLabel:x.label,statusColor:x.color,statusBg:x.bg,dest:p.destination||p.to_location||"—",from:p.from_location||p.origin||"—",plate:p.plate_number||p.hearse_plate||p.number_plate||"—",branchName:de,isMultiDay:Se,multiDayDates:te,phone:p.client_phone||p.phone||"",clientName:J,startTime:M,endTime:L,bookingCode:ee,hearseName:Y}}}).filter(p=>p!==null&&p.start):[],[t,W]),T=(0,c.useCallback)(()=>{if(!f)return{total:0,booked:0,transit:0,pending:0,completed:0};const p=f.split("T")[0],x=t.filter(g=>Ge(g).some(m=>m?String(m).split("T")[0]===p:!1));return{total:x.length,booked:x.filter(g=>g.status==="booked"||g.status==="confirmed").length,transit:x.filter(g=>g.status==="in_transit"||g.status==="transit").length,pending:x.filter(g=>g.status==="pending").length,completed:x.filter(g=>g.status==="completed").length}},[t,f])(),K=(0,c.useCallback)(p=>{const x=p.dateStr.split("T")[0];s&&s(x),S&&S(x)},[s,S]),U=(0,c.useCallback)(p=>{const x=p.event.extendedProps;x.isMultiDay&&D(x),r&&r(x)},[r]),R=(0,c.useCallback)(p=>{q(p.type)},[]),Q=(0,c.useCallback)(p=>{const x=C==="dayGridMonth",g=p.event.extendedProps,m=p.event.allDay;if(x)return null;const B=g.isMultiDay,z=B?{background:`repeating-linear-gradient(45deg, ${status.color}, ${status.color} 4px, ${status.color}dd 4px, ${status.color}dd 8px)`,border:`2px solid ${status.color}`}:{};return(0,e.jsxs)("div",{style:{padding:m?"3px 6px":"4px 8px",width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",overflow:"hidden",gap:"1px",boxSizing:"border-box",...z},children:[B&&(0,e.jsx)("div",{style:{fontSize:"7px",fontWeight:700,color:status.color,textTransform:"uppercase",letterSpacing:"0.3px"},children:"Multi-Day"}),(0,e.jsxs)("div",{style:{fontSize:"9px",fontWeight:600,opacity:.85,display:"flex",alignItems:"center",gap:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[(0,e.jsx)(st,{size:9})," ",g.startTime,g.endTime?` - ${g.endTime}`:""]}),(0,e.jsxs)("div",{style:{fontWeight:700,fontSize:"11px",lineHeight:1.2,display:"flex",alignItems:"center",gap:"4px",minWidth:0},children:[(0,e.jsx)("span",{style:{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%",flex:1,minWidth:0},children:g.clientName}),g.statusLabel&&(0,e.jsx)("span",{style:{fontSize:"7px",fontWeight:600,padding:"1px 6px",borderRadius:"3px",background:g.statusBg||g.statusColor,color:g.statusColor||"#FFFFFF",whiteSpace:"nowrap",flexShrink:0},children:g.statusLabel})]}),g.dest&&g.dest!=="—"&&(0,e.jsxs)("div",{style:{fontSize:"8px",opacity:.8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:"3px"},children:[(0,e.jsx)(Sr,{size:8})," ",g.dest]}),g.branchName&&(0,e.jsxs)("div",{style:{fontSize:"8px",opacity:.75,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:"3px"},children:[(0,e.jsx)(yr,{size:8})," ",g.branchName]}),!m&&g.bookingCode&&(0,e.jsx)("div",{style:{fontSize:"7px",opacity:.6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"monospace"},children:g.bookingCode}),g.from&&g.from!=="—"&&!m&&(0,e.jsxs)("div",{style:{fontSize:"7px",opacity:.65,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:"3px"},children:[(0,e.jsx)(kr,{size:8})," ",g.from]}),g.plate&&g.plate!=="—"&&(0,e.jsxs)("div",{style:{fontSize:"7px",opacity:.6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:"3px"},children:[(0,e.jsx)(Wt,{size:8})," ",g.plate]}),g.phone&&g.phone!=="—"&&!m&&(0,e.jsxs)("div",{style:{fontSize:"7px",opacity:.55,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:"3px"},children:[(0,e.jsx)(cr,{size:8})," ",g.phone]})]})},[C]),H=(0,c.useCallback)(p=>{if(C!=="dayGridMonth")return;const x=p.date.toISOString().split("T")[0],g=t.filter(M=>Ge(M).some(L=>L?String(L).split("T")[0]===x:!1));if(g.length>0&&(p.el.style.setProperty("background-color","rgba(17, 24, 39, 0.05)","important"),p.el.style.setProperty("border-radius","6px","important")),g.length===0)return;const m=document.createElement("div");m.className="fc-event-dot-wrapper",m.style.cssText="display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; margin-top: 2px;";const B=Math.min(g.length,3);for(let M=0;M<B;M++){const L=we[g[M].status]||we.pending,Y=document.createElement("span");Y.className="fc-event-dot",Y.style.cssText=`width: 5px; height: 5px; border-radius: 50%; background: ${L.color}; display: inline-block;`,m.appendChild(Y)}if(g.length>3){const M=document.createElement("span");M.style.cssText="font-size: 7px; font-weight: 600; color: #999; padding: 0 2px;",M.textContent=`+${g.length-3}`,m.appendChild(M)}const z=p.el.querySelector(".fc-daygrid-day-events");if(z)z.innerHTML="",z.appendChild(m);else{const M=document.createElement("div");M.className="fc-daygrid-day-events",M.style.cssText="margin-top: 2px; display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; min-height: 8px;",M.appendChild(m),p.el.appendChild(M)}},[t,C]);return(0,e.jsxs)(Ar,{children:[C==="timeGridDay"&&f&&T.total>0&&(0,e.jsxs)(Nr,{children:[(0,e.jsxs)(ze,{color:"#00296B",tint:"#EFF6FF",border:"#DBEAFE",children:[(0,e.jsx)(Ee,{color:"#00296B",children:(0,e.jsx)(wr,{size:13})}),T.total," Bookings"]}),T.booked>0&&(0,e.jsxs)(ze,{color:"#00296B",tint:"#EFF6FF",border:"#DBEAFE",children:[(0,e.jsx)(Ee,{color:"#00296B",children:(0,e.jsx)(gr,{size:13})}),T.booked," Booked"]}),T.transit>0&&(0,e.jsxs)(ze,{color:"#E36414",tint:"#FFEDD5",border:"#FBD6B4",children:[(0,e.jsx)(Ee,{color:"#E36414",children:(0,e.jsx)(dt,{size:13})}),T.transit," In Transit"]}),T.pending>0&&(0,e.jsxs)(ze,{color:"#d97706",tint:"#FFFBEB",border:"#FDE68A",children:[(0,e.jsx)(Ee,{color:"#d97706",children:(0,e.jsx)(st,{size:13})}),T.pending," Pending"]}),T.completed>0&&(0,e.jsxs)(ze,{color:"#5F0F40",tint:"#FCE7F3",border:"#E9B8D1",children:[(0,e.jsx)(Ee,{color:"#5F0F40",children:(0,e.jsx)(Rt,{size:13})}),T.completed," Completed"]})]}),(0,e.jsx)(Ir,{children:(0,e.jsx)(sr,{ref:O,plugins:[Cr,$r,Fr],initialView:"dayGridMonth",headerToolbar:{left:"prev,next today",center:"title",right:"dayGridMonth,timeGridWeek,timeGridDay"},views:{dayGridMonth:{titleFormat:{year:"numeric",month:"long"},dayHeaderFormat:{weekday:"short"},dayMaxEvents:3,moreLinkText:"+%d more"},timeGridWeek:{titleFormat:{year:"numeric",month:"short",day:"numeric"},dayHeaderFormat:{weekday:"short",month:"short",day:"numeric"},slotMinTime:"05:00:00",slotMaxTime:"23:00:00",slotDuration:"00:30:00",allDaySlot:!0,nowIndicator:!0,dayMaxEvents:10,moreLinkText:"+%d more"},timeGridDay:{titleFormat:{year:"numeric",month:"long",day:"numeric"},dayHeaderFormat:{weekday:"long",month:"long",day:"numeric"},slotMinTime:"05:00:00",slotMaxTime:"23:00:00",slotDuration:"00:30:00",allDaySlot:!0,nowIndicator:!0,dayMaxEvents:10,moreLinkText:"+%d more"}},events:w,dateClick:K,eventClick:U,viewDidMount:R,eventContent:Q,dayCellDidMount:H,height:"100%",contentHeight:"100%",aspectRatio:1.8,firstDay:0,weekends:!0,nowIndicator:!0,selectable:!0,unselectAuto:!0,dayMaxEvents:3,moreLinkText:"+%d more",eventTimeFormat:{hour:"numeric",minute:"2-digit",meridiem:"short"},slotLabelFormat:{hour:"numeric",minute:"2-digit",meridiem:"short"},slotLabelInterval:"01:00",buttonText:{today:"Today",month:"Month",week:"Week",day:"Day"},eventMinHeight:25,eventMaxStack:10,slotEventOverlap:!0,expandRows:!0,stickyHeaderDates:!0,weekNumbers:!1,displayEventTime:!0,displayEventEnd:!0,forceEventDuration:!0})}),(0,e.jsx)(Wr,{booking:y,onClose:()=>D(null)})]})},ut=["#7C3AED","#DB2777","#0891B2","#CA8A04","#4F46E5","#059669","#DC2626","#EA580C"],Pr=t=>{const r=String(t||"0").split("").reduce((o,f)=>o+f.charCodeAt(0),0);return ut[r%ut.length]},Wr=({booking:t,onClose:r})=>{if(!t)return null;const o=t.multiDayDates||[],f=we[t.status]||we.pending,s=Pr(t.bookingId||t.id);return(0,e.jsx)("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,padding:"20px"},onClick:r,children:(0,e.jsxs)("div",{style:{background:"#fff",borderRadius:"16px",maxWidth:"500px",width:"100%",maxHeight:"80vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"},onClick:S=>S.stopPropagation(),children:[(0,e.jsx)("div",{style:{padding:"20px 24px",background:s,borderRadius:"16px 16px 0 0",color:"#fff"},children:(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"12px",opacity:.8,marginBottom:"4px"},children:"Multi-Day Booking"}),(0,e.jsx)("div",{style:{fontSize:"20px",fontWeight:700},children:t.clientName||"Unknown"})]}),(0,e.jsx)("button",{onClick:r,style:{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"8px",padding:"8px",cursor:"pointer",color:"#fff"},children:"✕"})]})}),(0,e.jsxs)("div",{style:{padding:"24px"},children:[(0,e.jsxs)("div",{style:{display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap"},children:[(0,e.jsx)("span",{style:{padding:"6px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:600,background:f.bg||f.color+"20",color:f.color},children:f.label||t.status}),t.branchName&&(0,e.jsxs)("span",{style:{padding:"6px 12px",borderRadius:"20px",fontSize:"12px",fontWeight:600,background:"#f3f4f6",color:"#374151"},children:["📍 ",t.branchName]})]}),(0,e.jsxs)("div",{style:{background:"#f9fafb",borderRadius:"12px",padding:"16px",marginBottom:"20px"},children:[(0,e.jsx)("div",{style:{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"8px"},children:"Booking Period"}),(0,e.jsx)("div",{style:{fontSize:"16px",fontWeight:600,color:"#111827"},children:o.length>1?`${new Date(o[0]).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} — ${new Date(o[o.length-1]).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}`:new Date(o[0]).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}),(0,e.jsxs)("div",{style:{fontSize:"13px",color:"#6b7280",marginTop:"4px"},children:[o.length," day",o.length>1?"s":""," total"]})]}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"},children:[t.dest&&t.dest!=="—"&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"Destination"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827"},children:t.dest})]}),t.from&&t.from!=="—"&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"From"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827"},children:t.from})]}),t.plate&&t.plate!=="—"&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"Vehicle"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827"},children:t.plate})]}),t.hearseName&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"Hearse"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827"},children:t.hearseName})]}),t.phone&&t.phone!=="—"&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"Phone"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827"},children:t.phone})]}),t.bookingCode&&(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"10px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"4px"},children:"Code"}),(0,e.jsx)("div",{style:{fontSize:"14px",color:"#111827",fontFamily:"monospace"},children:t.bookingCode})]})]}),o.length>1&&(0,e.jsxs)("div",{style:{marginTop:"20px"},children:[(0,e.jsx)("div",{style:{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#9ca3af",marginBottom:"8px"},children:"Daily Breakdown"}),(0,e.jsx)("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:o.map((S,C)=>(0,e.jsxs)("div",{style:{padding:"8px 12px",borderRadius:"8px",background:C===0?s:C===o.length-1?s+"cc":s+"22",color:C===0||C===o.length-1?"#fff":s,fontSize:"11px",fontWeight:600,border:`1px solid ${s}44`},children:["Day ",C+1,": ",new Date(S).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})]},C))})]})]})]})})},Rr=Pt(ar(),1),Qe=6,rt=23,Hr=17,Or=24,Ur=1600/Hr,nt=240,Ve=t=>Or+(t-Qe)*Ur,Yr=t=>{if(!t)return"";const r=new Date(t);return isNaN(r.getTime())?"":r.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})},xt=t=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(t??"").trim()))return"";const r=Yr(t);if(r)return r;const o=String(t??"");let f=o.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);if(f){let s=parseInt(f[1],10)%12;return f[3].toUpperCase()==="PM"&&(s+=12),`${s%12===0?12:s%12}:${f[2]||"00"} ${s<12?"AM":"PM"}`}if(f=o.match(/(?:^|[\sT])(\d{1,2}):(\d{2})/),f){const s=parseInt(f[1],10);if(s<=23)return`${s%12===0?12:s%12}:${f[2]} ${s<12?"AM":"PM"}`}return""},Jr=["estimated_departure_time","start_time","from_timestamp","delivery_time","event_time","created_at","booking_date","start","date"],Yt=t=>{if(!t)return"";for(const r of Jr){const o=t[r];if(o!=null&&String(o).trim()!=="")return o}return""},bt=t=>{if(t==null||t==="")return null;if(t instanceof Date)return isNaN(t.getTime())||t.getUTCHours()===0&&t.getUTCMinutes()===0&&t.getUTCSeconds()===0?null:t.getHours()+t.getMinutes()/60;if(typeof t=="number"){if(t>=0&&t<=24)return t;const s=new Date(t);return isNaN(s.getTime())?null:s.getHours()+s.getMinutes()/60}const r=String(t).trim();let o=r.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);if(o){let s=parseInt(o[1],10)%12;return o[3].toUpperCase()==="PM"&&(s+=12),s+(o[2]?parseInt(o[2],10)/60:0)}if(!r.includes("T")){if(/^\d{4}-\d{2}-\d{2}$/.test(r))return null;if(o=r.match(/(?:^|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/),o||(o=r.match(/^(\d{1,2}):(\d{2})/)),o){const s=parseInt(o[1],10),S=parseInt(o[2],10);if(s<=23&&S<=59)return s+S/60}}const f=new Date(r);return isNaN(f.getTime())?null:f.getHours()+f.getMinutes()/60},ct=(t,r)=>{try{const o=typeof t?.booking_dates=="string"?JSON.parse(t.booking_dates):t?.booking_dates||[];if(Array.isArray(o)&&o.length){const f=o.find(s=>String(s).split("T")[0].slice(0,10)===r);if(f)return f}}catch{}return String(t?.booking_date||"").split("T")[0].slice(0,10)===r?t.booking_date:null},Gr=t=>{const r=t?.booking_date||t?.estimated_departure_time||t?.date||"";return String(r).split("T")[0].slice(0,10)},Vr=(t,r)=>{const o=r?ct(t,r):null;if(o&&String(o).length>10){const f=bt(o);if(f!==null)return f}return bt(Yt(t))},yt=(t,r)=>{const o=r?ct(t,r):null;if(o&&String(o).length>10){const f=xt(o);if(f)return f}return xt(Yt(t))||"All day"},Xr=t=>t?new Date(t).toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"",qr=({date:t,bookings:r=[],onClose:o,onItemClick:f})=>{const[s,S]=(0,c.useState)(null),C=(0,c.useMemo)(()=>{if(!t)return[];const y=String(t).split("T")[0].slice(0,10);return(Array.isArray(r)?r:[]).filter(D=>ct(D,y)?!0:Gr(D)===y)},[r,t]),q=(0,c.useMemo)(()=>{if(!C.length)return[];const y=String(t).split("T")[0].slice(0,10),D=2,O=1406,W=[...C].map(N=>({b:N,hour:Vr(N,y)})).sort((N,w)=>(N.hour??-1)-(w.hour??-1)),v=[];return W.map(({b:N,hour:w})=>{const T=w===null?null:Math.max(Qe,Math.min(rt,w)),K=T!==null?Ve(T):28,U=Math.max(D,Math.min(O,K-nt/2)),R=U,Q=U+nt;let H=0;for(;;){const p=v[H]||(v[H]=[]);if(!p.some(([x,g])=>R<g+6&&Q>x-6)){p.push([R,Q]);break}H++}return{b:N,hour:w,x:U,y:H*107}})},[C,t]);return(0,c.useEffect)(()=>{if(!t)return;const y=document.getElementById("day-timeline-scroll");y&&y.scrollTo({left:Math.max(0,Ve(13)-y.clientWidth/2),behavior:"smooth"})},[t]),t?(0,Rr.createPortal)((0,e.jsxs)("div",{className:"day-timeline-root",style:{position:"fixed",inset:0,zIndex:5e3,background:"rgba(15,17,23,0.28)",display:"flex",flexDirection:"column"},children:[(0,e.jsx)("style",{children:`
        .rtl-tl-card{
          position: absolute; width: ${nt}px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; transition: transform .15s, box-shadow .15s; z-index: 10;
        }
        .rtl-tl-card:hover{ transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.22); z-index: 12; }
        .rtl-tl-panel-row{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; margin-bottom:5px; }
      `}),(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#ffffff",borderBottom:"1px solid #e2e4ea"},children:[(0,e.jsx)("button",{onClick:o,title:"Close timeline",style:{border:"1px solid #e2e4ea",background:"#fff",color:"#5b5e66",borderRadius:8,cursor:"pointer",padding:"6px 10px",fontWeight:600,fontSize:12},children:"✕ Close"}),(0,e.jsx)("div",{style:{fontWeight:700,fontSize:15,color:"#1a1a2e"},children:"Day Timeline"}),(0,e.jsx)("div",{style:{fontSize:12,color:"#5b5e66"},children:Xr(t)}),(0,e.jsxs)("div",{style:{fontSize:11,color:"#9ca3af",fontWeight:600},children:[C.length," booking",C.length!==1?"s":""]})]}),(0,e.jsx)("div",{style:{flex:1,display:"flex",flexDirection:"column",background:"#ffffff",overflow:"hidden"},children:(0,e.jsx)("div",{id:"day-timeline-scroll",style:{flex:1,overflowX:"auto",overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#e2e4ea transparent"},children:(0,e.jsxs)("div",{style:{position:"relative",minWidth:1648},children:[(0,e.jsx)("div",{style:{position:"sticky",top:0,zIndex:20,background:"#fff",height:46,borderBottom:"1px solid #e2e4ea"},children:(()=>{const y=[];for(let D=Qe;D<=rt;D+=2){const O=D===0?"12 AM":D===12?"12 PM":D<12?`${D} AM`:`${D-12} PM`,W=D%4===0;y.push((0,e.jsxs)("div",{style:{position:"absolute",left:Ve(D),top:0,bottom:0,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",paddingBottom:8,pointerEvents:"none"},children:[(0,e.jsx)("span",{style:{fontSize:11,fontWeight:700,color:W?"#1a1a2e":"#a0a3b1",whiteSpace:"nowrap"},children:O}),(0,e.jsx)("div",{style:{width:1,height:W?10:6,background:W?"#a0a3b1":"#d4d6de",marginTop:4}})]},D))}return y})()}),(0,e.jsxs)("div",{style:{position:"relative",minHeight:q.length*107+24},children:[(()=>{const y=[];for(let D=Qe;D<=rt;D+=1)y.push((0,e.jsx)("div",{style:{position:"absolute",top:0,bottom:0,left:Ve(D),width:1,background:D%2===0?"#e7e9ef":"#f0f1f4",pointerEvents:"none"}},D));return y})(),q.map(({b:y,hour:D,x:O,y:W})=>{const v=De[y?.status]||"#475569",N=yt(y,String(t).slice(0,10)),w=y?.status||"booked";return(0,e.jsxs)("div",{className:"rtl-tl-card",style:{left:O,top:W,background:v,opacity:.95},onClick:()=>{f?(f(y),S(null)):S(y)},children:[(0,e.jsxs)("div",{style:{fontSize:10,fontWeight:600,opacity:.55,color:"#fff",marginBottom:1},children:["⏰ ",N]}),(0,e.jsx)("div",{style:{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.25,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:y.client_name||y.client||"Client"}),(0,e.jsx)("span",{style:{display:"inline-block",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,marginTop:5,textTransform:"uppercase",letterSpacing:".3px",background:"rgba(255,255,255,0.22)",color:"rgba(255,255,255,0.92)"},children:w})]},y.booking_id||y.id||`${O}-${W}`)})]})]})})}),(0,e.jsx)("div",{style:{position:"absolute",top:0,right:0,bottom:0,width:360,maxWidth:"92vw",background:"#ffffff",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",borderLeft:"1px solid #e2e4ea",transform:s?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.32,.72,0,1)",display:"flex",flexDirection:"column",zIndex:10},children:s&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"18px 20px 16px",borderBottom:"1px solid #eef0f3"},children:[(0,e.jsx)("div",{style:{fontSize:18,fontWeight:700,letterSpacing:"-.2px",lineHeight:1.2},children:s.client_name||s.client||"Client"}),(0,e.jsx)("button",{onClick:()=>S(null),"aria-label":"Close details",style:{width:30,height:30,border:"1px solid #e2e4ea",borderRadius:8,background:"#fff",color:"#888",cursor:"pointer",fontWeight:700,fontSize:14},children:"✕"})]}),(0,e.jsxs)("div",{style:{flex:1,overflowY:"auto",padding:20},children:[(0,e.jsxs)("div",{className:"rtl-tl-panel-row",style:{background:"#f4f6f9",marginBottom:16,padding:"10px 12px"},children:[(0,e.jsx)("span",{style:{width:8,height:8,borderRadius:"50%",background:De[s.status]||"#475569",flexShrink:0}}),(0,e.jsx)("span",{style:{fontSize:12,fontWeight:700,color:"#1a1a2e"},children:s.status||"booked"}),(0,e.jsx)("span",{style:{marginLeft:"auto",fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:5,textTransform:"uppercase",letterSpacing:".3px",background:"#f4f5f7",color:"#5b5e66"},children:s.priority||"standard"})]}),(0,e.jsx)("div",{style:{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".7px",color:"#c0c2cc",marginBottom:8},children:"Booking Details"}),[{id:"id",label:"Booking ID",value:s.booking_code||s.booking_id||"—",icon:"🗓"},{id:"time",label:"Time",value:yt(s,null),icon:"⏰"},{id:"from",label:"From",value:s.from_location||s.from||s.origin||"—",icon:"📍"},{id:"loc",label:"Location",value:s.destination||s.to_location||"—",icon:"🏁"},{id:"plate",label:"Hearse",value:`${s.hearse_name||""} ${s.plate_number||s.number_plate||s.hearse_plate||""}`.trim()||"—",icon:"🚚"},{id:"branch",label:"Branch",value:s.branch_name||s.branch||"—",icon:"🏢"}].map(y=>(0,e.jsxs)("div",{className:"rtl-tl-panel-row",style:{background:"#f9f9fb"},children:[(0,e.jsx)("div",{style:{width:30,height:30,borderRadius:7,background:De[s.status]||"#475569",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0},children:y.icon}),(0,e.jsxs)("div",{style:{flex:1},children:[(0,e.jsx)("div",{style:{fontSize:10,color:"#a0a3b1"},children:y.label}),(0,e.jsx)("div",{style:{fontSize:12,fontWeight:600,color:"#1a1a2e"},children:y.value})]})]},y.label)),(0,e.jsx)("div",{style:{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".7px",color:"#c0c2cc",marginBottom:8},children:"Client Contact"}),(0,e.jsxs)("div",{className:"rtl-tl-panel-row",style:{background:"#f9f9fb"},children:[(0,e.jsx)("div",{style:{width:30,height:30,borderRadius:7,background:De[s.status]||"#475569",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0},children:"📞"}),(0,e.jsxs)("div",{style:{flex:1},children:[(0,e.jsx)("div",{style:{fontSize:10,color:"#a0a3b1"},children:"Phone"}),(0,e.jsx)("div",{style:{fontSize:12,fontWeight:600,color:"#1a1a2e"},children:s.client_phone||s.phone||"—"})]})]}),f&&(0,e.jsx)("button",{onClick:()=>{f(s),S(null)},style:{width:"100%",padding:"10px",borderRadius:10,marginTop:16,background:De[s.status]||"#475569",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",border:"none"},children:"Open Full Booking →"})]})]})})]}),document.body):null},vt="https://restpoint.co.ke/api/v1/restpoint",u={primary:"#1a5f7a",primaryLight:"#2c8ac9",primaryDark:"#134b5f",white:"#FFFFFF",bg:"#f8f9fb",border:"#e2e5ea",text:"#1a1a2e",textSec:"#6b7280",textMuted:"#9ca3af",success:"#10b981",danger:"#ef4444",purple:"#8b5cf6",cardBg:"#03071E"},Kr=t=>{if(!t)return"";const r=new Date(t);return`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`},Zr=()=>{const t=localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug");if(t&&t!=="default"&&t!=="dashboard"&&t!=="undefined"&&t!=="null")return t;const r=localStorage.getItem("parentTenantSlug");if(r&&r!=="default"&&r!=="dashboard"&&r!=="undefined"&&r!=="null")return r;try{const o=JSON.parse(localStorage.getItem("user")||"{}");return o.parentTenantSlug||o.tenantSlug||o.tenant?.slug||""}catch{return""}},Qr=()=>{const t=localStorage.getItem("tenantId");if(t&&t!=="undefined"&&t!=="null")return t;try{const r=JSON.parse(localStorage.getItem("user")||"{}"),o=r.tenantId||r.tenant_id||r.tenant?.id||r.tenant?.tenantId;if(o)return String(o)}catch{}try{const r=sessionStorage.getItem("authToken")||localStorage.getItem("authToken")||"",o=JSON.parse(atob(r.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));if(o?.tenantId)return String(o.tenantId)}catch{}return null},kt=()=>{const t=sessionStorage.getItem("authToken")||localStorage.getItem("authToken")||"",r={"x-tenant-slug":Zr()},o=Qr();return o&&(r["x-tenant-id"]=o),t&&(r.Authorization=`Bearer ${t}`),r},en=()=>{try{const t=JSON.parse(localStorage.getItem("user")||sessionStorage.getItem("user")||"{}");return t?.full_name||t?.username||t?.name||t?.email||""}catch{return""}},Jt=et`from{opacity:0}to{opacity:1}`,Gt=et`to{transform:rotate(360deg)}`,tn=et`from{opacity:0;transform:scale(.96) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}`,rn=d.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998;animation:${Jt}.1s;backdrop-filter:blur(2px)`,nn=d.div`
  position:fixed;top:0;right:0;bottom:0;width:${t=>t.$w||"660px"};max-width:100%;
  background:${u.white};z-index:9999;
  transform:translateX(${t=>t.$open?"0":"100%"});
  transition:transform .25s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;
  box-shadow:-2px 0 20px rgba(0,0,0,.06);
  @media(max-width:900px){width:100%}
`,on=d.div`padding:.9rem 1.15rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${u.primaryDark},${u.primary});flex-shrink:0;`,an=d.h2`font-size:1.05rem;font-weight:700;margin:0;color:${u.white}`,sn=d.p`font-size:.7rem;color:rgba(255,255,255,.55);margin:.1rem 0 0`,ln=d.div`
  flex:1;overflow-y:auto;padding:1.1rem 1.15rem;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{width:3px}&::-webkit-scrollbar-thumb{background:${u.border};border-radius:9px}
`,dn=d.button`background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;padding:.3rem;border-radius:5px;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(255,255,255,.2)}`,wt=d.button`background:${u.primary};color:#fff;border:none;border-radius:5px;padding:.5rem 1.1rem;font-size:.78rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:.35rem;white-space:nowrap;&:hover{background:${u.primaryDark}}&:disabled{background:${u.textMuted};cursor:not-allowed}`,jt=d.button`background:#fff;color:${u.text};border:1px solid ${u.border};border-radius:5px;padding:.5rem 1.1rem;font-size:.78rem;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap;&:hover{background:${u.bg}}`,Be=d.input`width:100%;padding:.45rem .65rem;border:1px solid ${u.border};border-radius:5px;font-size:.78rem;color:${u.text};background:#fff;outline:none;box-sizing:border-box;&::placeholder{color:${u.textMuted}}&:focus{border-color:${u.primaryLight};box-shadow:0 0 0 2px rgba(44,138,201,.1)}&:disabled{background:${u.bg};color:${u.textSec};cursor:not-allowed}`,ye=d.label`display:block;font-weight:600;margin-bottom:.3rem;font-size:.76rem;color:${u.text}`,St=d.span`font-weight:400;color:${u.textMuted};font-size:.66rem;margin-left:.15rem`,_t=d.span`display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .45rem;background:rgba(26,95,122,.07);color:${u.primary};border-radius:4px;font-size:.66rem;font-weight:600;border:1px solid rgba(26,95,122,.1)`,Ct=d.div`height:1px;background:${u.border};margin:.85rem 0`,cn=d.div`position:relative;margin:0 -1.15rem;padding:0 2rem`,pn=d.div`
  display:flex;gap:.5rem;overflow-x:auto;scroll-behavior:smooth;
  scroll-snap-type:x mandatory;padding:.3rem .1rem .4rem;
  -webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{display:none}-ms-overflow-style:none;scrollbar-width:none;
`,$t=d.button`
  position:absolute;top:50%;transform:translateY(-50%);z-index:5;
  width:28px;height:28px;border-radius:50%;border:1px solid ${u.border};
  background:#fff;color:${u.textSec};cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 6px rgba(0,0,0,.1);transition:all .15s;
  &:hover{background:${u.primary};color:#fff;border-color:${u.primary}}
  &:disabled{opacity:0;pointer-events:none}
  ${t=>t.$dir==="left"?"left:5px":"right:5px"}
`,mn=d.button`
  flex-shrink:0;
  width:148px;
  scroll-snap-align:start;
  padding:0;
  border-radius:8px;
  border:1.5px solid ${t=>t.$sel?"rgba(44,138,201,.5)":t.$bk?"#dc2626":"rgba(3,7,30,.6)"};
  background:${t=>t.$bk?u.danger:u.cardBg};
  cursor:${t=>t.$off?"not-allowed":"pointer"};
  transition:border-color .15s,opacity .15s,background .15s;
  opacity:${t=>t.$bk?"0.85":t.$off?"0.35":"1"};
  text-align:left;
  display:flex;
  flex-direction:column;
  position:relative;
`,fn=d.div`padding:.45rem .5rem;display:flex;flex-direction:column;flex:1`,gn=d.div`font-size:.66rem;font-weight:700;color:rgba(255,255,255,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.08rem;`,hn=d.div`font-size:.58rem;font-weight:600;color:rgba(255,255,255,.38);display:flex;align-items:center;gap:.15rem;letter-spacing:.03em;margin-bottom:.12rem;`,un=d.div`display:flex;gap:.12rem;flex-wrap:wrap`,Ft=d.span`padding:.02rem .22rem;border-radius:3px;font-size:.48rem;font-weight:600;background:rgba(255,255,255,.08);color:rgba(255,255,255,.42);`,xn=d.div`margin-top:auto;padding-top:.18rem;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;`,bn=d.span`
  display:flex;align-items:center;gap:.12rem;
  font-size:.48rem;font-weight:700;text-transform:uppercase;letter-spacing:.02em;
  color:${t=>t.$c};
  &::before{content:'';width:4px;height:4px;border-radius:50%;background:${t=>t.$d};flex-shrink:0}
`,yn=d.span`font-size:.48rem;font-weight:700;color:rgba(44,138,201,.9)`,vn=d.div`position:absolute;top:.22rem;right:.22rem;width:14px;height:14px;border-radius:50%;background:${u.primary};color:#fff;display:flex;align-items:center;justify-content:center;font-size:.45rem;font-weight:800;`,kn=d.div`margin-top:.12rem;font-size:.42rem;font-weight:500;color:rgba(255,255,255,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`,Dt=d.div`padding:.55rem .7rem;border-radius:5px;background:#fffbeb;border:1px solid #fde68a;color:#b45309;font-size:.72rem;font-weight:600;display:flex;align-items:center;gap:.35rem;animation:${Jt}.15s;`,wn=d.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem;`,it=d.span`display:inline-flex;align-items:center;gap:.2rem;font-size:.65rem;font-weight:600;color:${u.textSec};&::before{content:'';width:5px;height:5px;border-radius:50%;background:${t=>t.$c}}`,jn=d.div`width:18px;height:18px;border:2.5px solid ${u.border};border-top-color:${u.primary};border-radius:50%;animation:${Gt}.6s linear infinite;margin:0 auto .35rem;`,Sn=d.span`width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:${Gt}.6s linear infinite;display:inline-block;`,_n=d.div`position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);padding:1rem`,Cn=d.div`background:#fff;border-radius:10px;width:400px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 16px 32px rgba(0,0,0,.12);animation:${tn}.12s`,$n=d.div`padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${u.primaryDark},${u.primary});border-radius:10px 10px 0 0`,Fn=d.button`width:26px;height:26px;border-radius:5px;background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;&:hover{background:rgba(255,255,255,.2)}`,Dn=d.div`padding:.9rem 1rem`,zt=d.button`width:26px;height:26px;border-radius:5px;border:1px solid ${u.border};background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${u.textSec};font-size:14px;&:hover{background:${u.bg}}`,zn=d.div`display:flex;gap:.5rem;justify-content:flex-end;margin-top:.85rem;border-top:1px solid ${u.border};padding-top:.85rem`;function En({open:t=!1,initialDates:r=[],hearses:o=[],branches:f=[],onClose:s,onCreated:S,showToast:C}){const q=(0,c.useRef)(null),[y,D]=(0,c.useState)(!1),[O,W]=(0,c.useState)(!1),[v,N]=(0,c.useState)({hearse_id:"",client_name:"",client_phone:"",from_location:"",to_location:"",destination:"",booking_dates:[],branch_id:"",booking_date:""}),[w,T]=(0,c.useState)([]),[K,U]=(0,c.useState)(!1),[R,Q]=(0,c.useState)([]),[H,p]=(0,c.useState)(()=>new Date().getMonth()),[x,g]=(0,c.useState)(()=>new Date().getFullYear()),[m,B]=(0,c.useState)(!1),[z,M]=(0,c.useState)(!1),[L,Y]=(0,c.useState)({}),J=(0,c.useCallback)(()=>{const l=q.current;l&&(D(l.scrollLeft>3),W(l.scrollLeft<l.scrollWidth-l.clientWidth-3))},[]);(0,c.useEffect)(()=>{const l=q.current;if(l)return J(),l.addEventListener("scroll",J,{passive:!0}),window.addEventListener("resize",J),()=>{l.removeEventListener("scroll",J),window.removeEventListener("resize",J)}},[J,w,L]),(0,c.useEffect)(()=>{const l=setTimeout(J,50);return()=>clearTimeout(l)},[L,J]);const ee=l=>{const h=q.current;h&&h.scrollBy({left:l==="l"?-155:155,behavior:"smooth"})};(0,c.useEffect)(()=>{if(!t)return;const l=Array.isArray(r)?r.filter(Boolean):[];T(l);const h=JSON.parse(localStorage.getItem("user")||"{}"),$=h?.dbName||h?.branchDbName||"";N({hearse_id:"",client_name:"",client_phone:"",from_location:"",to_location:"",destination:"",booking_dates:l,branch_id:h?.branch_id||"",branch_code:$.split("-").pop()||"",booking_date:l[0]||""}),Q([]),U(!1),Y({}),D(!1),W(!1)},[t,r]);const de=(0,c.useCallback)(async l=>{if(!l||!l.length){Y({});return}M(!0);try{const h=kt(),$=await Promise.all(l.map(async k=>{try{const G=await fetch(`${vt}/availability/check-by-date?date=${k}`,{headers:h});if(!G.ok)return null;const _=await G.json();return{date:k,avail:_.available_hearses||[],booked:_.booked_hearses||[]}}catch{return null}})),F={};(o||[]).forEach(k=>{F[String(k.id)]={status:"available",bookedFor:[]}}),$.forEach(k=>{if(!k)return;(o||[]).forEach(_=>{["maintenance","out_of_service","disabled"].includes(_.status)&&(F[String(_.id)]={status:"maintenance",bookedFor:[]})}),(k.booked||[]).forEach(_=>{const E=String(_.hearse_id);F[E]&&(F[E].bookedFor.some(se=>se.date===k.date)||F[E].bookedFor.push({date:k.date,client:_.client_name||_.booking_code||"Booked"}),F[E].status="booked")});const G=new Set((k.avail||[]).map(_=>String(_.id)));(o||[]).forEach(_=>{const E=String(_.id);F[E].status!=="maintenance"&&(G.has(E)||(F[E].status="booked"))})}),Y(F)}catch{}M(!1)},[o]);(0,c.useEffect)(()=>{t&&de(w)},[t,w,de]);const te=l=>{if(w.length>0){const h=L[String(l.id)];if(h&&h.status!=="available"){C(`${l.hearse_name||"This hearse"} is not available on the selected date(s).`,"error");return}}N(h=>({...h,hearse_id:l.id}))},Se=l=>{Q(h=>h.includes(l)?h.filter($=>$!==l):[...h,l].sort())},ie=()=>{if(T(R),N(l=>({...l,booking_dates:R,booking_date:R[0]||""})),U(!1),v.hearse_id){const l=L[String(v.hearse_id)];l&&l.status!=="available"&&N(h=>({...h,hearse_id:""}))}},V=(0,c.useCallback)(async l=>{if(l.preventDefault(),!v.hearse_id||!v.client_name||!v.from_location||!v.to_location||!w.length){C("Please fill all required fields and select at least one date","error");return}const h=L[String(v.hearse_id)];if(h&&h.status!=="available"){C(`This hearse is already booked for: ${h.bookedFor.map($=>`${$.date} (${$.client})`).join(", ")||"the selected date(s)"}.`,"error");return}B(!0);try{const $=kt();$["Content-Type"]="application/json";const F=JSON.parse(localStorage.getItem("user")||"{}");F?.branch_id&&($["x-branch-id"]=F.branch_id),F?.email&&($["x-user-email"]=F.email),$["x-user-name"]=F?.full_name||F?.username||F?.name||"System";const k=w.length>0?w[0]+"T00:00:00":new Date().toISOString(),G={hearse_id:v.hearse_id,client_name:v.client_name,client_phone:v.client_phone||"",from_location:v.from_location,to_location:v.to_location,destination:v.to_location,from_timestamp:k,booking_date:k,booking_dates:w,booked_by:en()||F?.email||"System",branch_id:v.branch_id||F?.branch_id||"",branch_code:v.branch_code||F?.branch_code||""},_=await fetch(`${vt}/hearse-bookings`,{method:"POST",headers:$,body:JSON.stringify(G)});if(!_.ok){const E=await _.json().catch(()=>({}));throw _.status===409?new Error(E.message||"Just booked by another user."):new Error(E.message||`HTTP ${_.status}`)}C("Booking created successfully!","success"),Y({}),s&&s(),S&&await S()}catch($){C("Failed: "+$.message,"error")}B(!1)},[v,w,L,C,s,S]),oe=f.length>0?f:[],ae=Object.values(L).filter(l=>l.status==="available").length,Ye=Object.values(L).filter(l=>l.status==="booked").length,_e=Object.values(L).filter(l=>l.status==="maintenance").length,P=w.length>0,Ce=o.length>0,ue=Ce&&!z,xe=P?(o||[]).filter(l=>{const h=L[String(l.id)];return!h||h.status==="available"}):o||[],Je=()=>{const l=Kr(new Date),h=new Date(x,H,1).getDay(),$=[];for(let k=0;k<h;k++)$.push(null);const F=new Date(x,H+1,0).getDate();for(let k=1;k<=F;k++)$.push(k);return{d:$,ts:l}};return(0,e.jsxs)(e.Fragment,{children:[t&&(0,e.jsx)(rn,{onClick:s}),(0,e.jsxs)(nn,{$open:t,$w:"660px",children:[(0,e.jsxs)(on,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(an,{children:"New Hearse Booking"}),(0,e.jsx)(sn,{children:"Pick dates, then choose an available hearse"})]}),(0,e.jsx)(dn,{onClick:s,children:(0,e.jsx)(Ue,{size:15})})]}),(0,e.jsx)(ln,{children:(0,e.jsxs)("form",{onSubmit:V,children:[(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:".85rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(ye,{children:"Client Name *"}),(0,e.jsx)(Be,{placeholder:"Full name",value:v.client_name,onChange:l=>N(h=>({...h,client_name:l.target.value})),required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(ye,{children:"Phone"}),(0,e.jsx)(Be,{placeholder:"0712 345 678",value:v.client_phone,onChange:l=>N(h=>({...h,client_phone:l.target.value}))})]})]}),(0,e.jsxs)("div",{style:{marginBottom:".85rem"},children:[(0,e.jsxs)(ye,{children:["Booking Dates *",(0,e.jsx)(St,{children:"(click to select)"})]}),(0,e.jsx)("div",{style:{width:"100%",padding:".45rem .65rem",border:`1.5px solid ${P?u.primary:u.border}`,borderRadius:"5px",fontSize:".78rem",color:u.text,background:u.white,cursor:"pointer",minHeight:"34px",display:"flex",alignItems:"center",flexWrap:"wrap",gap:".25rem",transition:"border-color .15s"},onClick:()=>{Q([...w]),p(new Date().getMonth()),g(new Date().getFullYear()),U(!0)},children:P?w.map(l=>{const h=new Date(l+"T00:00:00");return(0,e.jsxs)(_t,{children:[(0,e.jsx)(lt,{size:9}),h.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})]},l)}):(0,e.jsxs)("span",{style:{color:u.textMuted,display:"flex",alignItems:"center",gap:".2rem",fontSize:".76rem"},children:[(0,e.jsx)(lt,{size:11}),"Click to select dates..."]})}),P&&(0,e.jsxs)("div",{style:{fontSize:".65rem",color:u.textMuted,marginTop:".15rem",fontWeight:500},children:[w.length," date",w.length!==1?"s":""," selected",z?" · Checking…":` · ${ae} of ${o.length} available`]})]}),(0,e.jsx)(Ct,{}),(0,e.jsxs)("div",{style:{marginBottom:".85rem"},children:[(0,e.jsx)(ye,{style:{marginBottom:".35rem"},children:"Select Hearse *"}),!P&&(0,e.jsxs)(Dt,{children:[(0,e.jsx)("span",{children:"ⓘ"}),"Select dates above to check availability."]}),z&&(0,e.jsxs)("div",{style:{padding:".8rem",textAlign:"center",color:u.textMuted,fontSize:".76rem"},children:[(0,e.jsx)(jn,{}),"Checking availability…"]}),P&&!z&&(0,e.jsxs)(wn,{children:[(0,e.jsxs)("div",{style:{display:"flex",gap:".6rem"},children:[(0,e.jsxs)(it,{$c:"#10b981",children:[ae," avail"]}),(0,e.jsxs)(it,{$c:"#ef4444",children:[Ye," booked"]}),_e>0&&(0,e.jsxs)(it,{$c:"#8b5cf6",children:[_e," maint"]})]}),(0,e.jsx)("div",{style:{fontSize:".58rem",color:u.textMuted},children:"Scroll →"})]}),P&&!z&&xe.length===0&&(0,e.jsxs)(Dt,{children:[(0,e.jsx)("span",{children:"ⓘ"}),"All hearses are booked or under maintenance on the selected date(s). Try different dates."]}),ue&&xe.length>0&&(0,e.jsxs)(cn,{children:[(0,e.jsx)($t,{type:"button",$dir:"left",disabled:!y,onClick:l=>{l.preventDefault(),l.stopPropagation(),ee("l")},children:(0,e.jsx)(Ht,{size:13})}),(0,e.jsx)(pn,{ref:q,children:xe.map(l=>{const h=String(l.id)===String(v.hearse_id),$=L[String(l.id)],F=P&&$&&$.status==="booked",k=P&&$&&$.status==="maintenance",G=F||k;let _,E,se;return F?(_="#dc2626",E="#ffffff",se="Booked"):k?(_="#8b5cf6",E="#c4b5fd",se="Maint."):P&&(_="#10b981",E="#6ee7b7",se="Available"),(0,e.jsxs)(mn,{type:"button",$sel:h,$bk:F,$off:G,onClick:le=>{le.preventDefault(),te(l)},children:[h&&(0,e.jsx)(vn,{children:"✓"}),(0,e.jsxs)(fn,{children:[(0,e.jsx)(gn,{title:l.hearse_name||"Unnamed",children:l.hearse_name||"Unnamed Hearse"}),(0,e.jsxs)(hn,{children:[(0,e.jsx)("span",{style:{fontSize:".65rem"},children:"🚛"}),l.plate_number||l.number_plate||"—"]}),(0,e.jsxs)(un,{children:[l.model&&(0,e.jsx)(Ft,{children:l.model}),l.capacity&&(0,e.jsxs)(Ft,{children:[l.capacity," seats"]})]}),P&&(0,e.jsxs)(xn,{children:[(0,e.jsx)(bn,{$d:_,$c:E,children:se}),h&&(0,e.jsx)(yn,{children:"Selected"})]}),F&&$.bookedFor.length>0&&(0,e.jsx)(kn,{children:$.bookedFor.map(le=>le.date).join(", ")})]})]},l.id)})}),(0,e.jsx)($t,{type:"button",$dir:"right",disabled:!O,onClick:l=>{l.preventDefault(),l.stopPropagation(),ee("r")},children:(0,e.jsx)(Ot,{size:13})})]}),!Ce&&(0,e.jsx)("div",{style:{padding:"1rem",textAlign:"center",color:u.textMuted,fontSize:".76rem"},children:"No hearses registered yet."})]}),(0,e.jsx)(Ct,{}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:".85rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(ye,{children:"From Location *"}),(0,e.jsx)(Be,{placeholder:"e.g., Nairobi CBD",value:v.from_location,onChange:l=>N(h=>({...h,from_location:l.target.value})),required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(ye,{children:"To Location *"}),(0,e.jsx)(Be,{placeholder:"e.g., Karen Memorial Park",value:v.to_location,onChange:l=>N(h=>({...h,to_location:l.target.value})),required:!0})]})]}),(0,e.jsxs)("div",{style:{marginBottom:"1.2rem"},children:[(0,e.jsxs)(ye,{children:["Branch",(0,e.jsx)(St,{children:"(auto-filled)"})]}),(0,e.jsx)(Be,{value:v.branch_id?oe.find(l=>String(l.branch_id)===String(v.branch_id))?.branch_name||`Branch #${v.branch_id}`:"Auto-filled from your profile",disabled:!0,readOnly:!0})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:".5rem",justifyContent:"flex-end"},children:[(0,e.jsx)(jt,{type:"button",onClick:s,children:"Cancel"}),(0,e.jsx)(wt,{type:"submit",disabled:m,children:m?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Sn,{}),"Booking..."]}):"Make Booking"})]})]})})]}),K&&(0,e.jsx)(_n,{onClick:()=>U(!1),children:(0,e.jsxs)(Cn,{onClick:l=>l.stopPropagation(),children:[(0,e.jsxs)($n,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:".9rem",fontWeight:700,color:"#fff"},children:"Select Booking Dates"}),(0,e.jsx)("div",{style:{fontSize:".66rem",color:"rgba(255,255,255,.55)"},children:"Click to toggle"})]}),(0,e.jsx)(Fn,{onClick:()=>U(!1),children:(0,e.jsx)(Ue,{size:13})})]}),(0,e.jsxs)(Dn,{children:[(0,e.jsxs)("div",{style:{fontSize:".72rem",fontWeight:600,color:u.primary,marginBottom:".35rem"},children:[R.length," date",R.length!==1?"s":""," selected"]}),R.length>0&&(0,e.jsx)("div",{style:{display:"flex",flexWrap:"wrap",gap:".2rem",marginBottom:".6rem"},children:R.map(l=>{const h=new Date(l+"T00:00:00");return(0,e.jsx)(_t,{children:h.toLocaleDateString("en-US",{month:"short",day:"numeric"})},l)})}),(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".55rem"},children:[(0,e.jsx)(zt,{type:"button",onClick:()=>{H===0?(p(11),g(l=>l-1)):p(l=>l-1)}}),(0,e.jsxs)("div",{style:{fontSize:".85rem",fontWeight:700,color:u.text},children:[["January","February","March","April","May","June","July","August","September","October","November","December"][H]," ",x]}),(0,e.jsx)(zt,{type:"button",onClick:()=>{H===11?(p(0),g(l=>l+1)):p(l=>l+1)}})]}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"},children:[["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(l=>(0,e.jsx)("div",{style:{textAlign:"center",fontSize:".6rem",fontWeight:700,color:u.textMuted,padding:".3rem 0"},children:l},l)),(()=>{const{d:l,ts:h}=Je();return l.map(($,F)=>{if($===null)return(0,e.jsx)("div",{},`e${F}`);const k=`${x}-${String(H+1).padStart(2,"0")}-${String($).padStart(2,"0")}`,G=k===h,_=R.includes(k),E=new Date(k+"T00:00:00")<new Date(h+"T00:00:00");return(0,e.jsx)("div",{style:{textAlign:"center",padding:".38rem 0",cursor:E?"not-allowed":"pointer",borderRadius:"5px",fontSize:".78rem",fontWeight:_?700:500,background:_?u.primary:G?"#f0fdf4":"transparent",color:_?"#fff":E?"#ccc":G?"#059669":u.text,border:G&&!_?"1px solid #10b981":"1px solid transparent",transition:"all .1s"},onClick:()=>!E&&Se(k),children:$},k)})})()]}),(0,e.jsxs)(zn,{children:[(0,e.jsx)(jt,{type:"button",onClick:()=>U(!1),children:"Cancel"}),(0,e.jsxs)(wt,{type:"button",onClick:ie,disabled:!R.length,children:["Confirm (",R.length,")"]})]})]})]})})]})}var bi=ir({default:()=>ai}),Te="https://restpoint.co.ke/api/v1/restpoint",Me=10,X={pending:{label:"Pending",progress:10,color:"#d97706",bg:"#FFFBEB",dotColor:"#d97706"},booked:{label:"Booked",progress:25,color:"#00296B",bg:"#EFF6FF",dotColor:"#00296B"},confirmed:{label:"Confirmed",progress:25,color:"#00296B",bg:"#EFF6FF",dotColor:"#00296B"},scheduled:{label:"Scheduled",progress:25,color:"#E36414",bg:"#FFEDD5",dotColor:"#E36414"},in_transit:{label:"In Transit",progress:60,color:"#E36414",bg:"#FFEDD5",dotColor:"#E36414"},in_progress:{label:"In Progress",progress:60,color:"#0c0b0f",bg:"#F3F4F6",dotColor:"#0c0b0f"},postponed:{label:"Postponed",progress:15,color:"#d97706",bg:"#FFFBEB",dotColor:"#d97706"},completed:{label:"Completed",progress:100,color:"#5F0F40",bg:"#FCE7F3",dotColor:"#5F0F40"},delivered:{label:"Delivered",progress:100,color:"#132A13",bg:"#E8F5E9",dotColor:"#132A13"},cancelled:{label:"Cancelled",progress:0,color:"#DD2D4A",bg:"#FEE2E2",dotColor:"#DD2D4A"},maintenance:{label:"Maintenance",progress:0,color:"#03071E",bg:"#E0E7FF",dotColor:"#03071E"}},Bn=Object.keys(X),i={primary:"#1a5f7a",primaryLight:"#2c8ac9",primaryDark:"#134b5f",white:"#FFFFFF",bg:"#f5f7fa",surface:"#ffffff",border:"#d1d5db",borderLight:"#e5e7eb",text:"#111827",textSecondary:"#6b7280",textMuted:"#9ca3af",success:"#10b981",successLight:"#d1fae5",successDark:"#059669",warning:"#f59e0b",warningLight:"#fef3c7",warningDark:"#d97706",danger:"#ef4444",dangerLight:"#fee2e2",dangerDark:"#dc2626",info:"#3b82f6",infoLight:"#dbeafe",infoDark:"#2563eb",accent:"#3b82f6",accentHover:"#2563eb",radius:"8px",radiusSm:"6px",radiusXs:"4px",shadowSm:"0 1px 2px rgba(0, 0, 0, 0.04)",shadowMd:"0 4px 6px rgba(0, 0, 0, 0.06)",shadowLg:"0 10px 15px rgba(0, 0, 0, 0.08)",transition:"all 0.15s ease"},Vt=et`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`,Z=t=>{if(!t)return"";const r=new Date(t);return`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`},Tn=t=>t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"N/A",Mn=t=>t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"N/A",Et=t=>{let r=[];try{r=typeof t?.booking_dates=="string"?JSON.parse(t.booking_dates):t?.booking_dates||[]}catch{r=[]}if(!Array.isArray(r)||r.length===0){const S=t?.booking_date||t?.estimated_departure_time||t?.date;return Mn(S)}const o=r.map(S=>String(S).slice(0,10)).sort(),f=new Date(o[0]+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),s=new Date(o[o.length-1]+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});return o.length===1?f:`${f} – ${s}`},Bt=t=>t?.from_location&&(t?.to_location||t?.destination)?`${t.from_location} → ${t.to_location||t.destination}`:t?.to_location||t?.destination||"N/A",Xe=(t,r)=>{if(!t)return"N/A";const o=t.toString();if(o.startsWith("BK-"))return o;const f=Date.now().toString().slice(-6);let s;return r?s=r.replace(/[^A-Z0-9]/gi,"").slice(0,6):s=Math.floor(1e3+Math.random()*9e3).toString(),`BK-${s}${f}`},Xt=()=>{const t=localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug");if(t&&t!=="default"&&t!=="dashboard"&&t!=="undefined"&&t!=="null")return t;const r=localStorage.getItem("parentTenantSlug");if(r&&r!=="default"&&r!=="dashboard"&&r!=="undefined"&&r!=="null")return r;try{const o=JSON.parse(localStorage.getItem("user")||"{}");return o.parentTenantSlug||o.tenantSlug||o.tenant?.slug||""}catch{return""}},An=()=>{const t=localStorage.getItem("tenantId");if(t&&t!=="undefined"&&t!=="null")return t;try{const r=JSON.parse(localStorage.getItem("user")||"{}"),o=r.tenantId||r.tenant_id||r.tenant?.id||r.tenant?.tenantId;if(o)return String(o)}catch{}try{const r=sessionStorage.getItem("authToken")||localStorage.getItem("authToken")||"",o=JSON.parse(atob(r.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));if(o?.tenantId)return String(o.tenantId)}catch{}return null},Ae=()=>{const t=sessionStorage.getItem("authToken")||localStorage.getItem("authToken")||"",r={"x-tenant-slug":Xt()},o=An();return o&&(r["x-tenant-id"]=o),t&&(r.Authorization=`Bearer ${t}`),r},I={truck:(0,e.jsx)(dt,{size:16}),car:(0,e.jsx)(Wt,{size:16}),search:(0,e.jsx)(ur,{size:16}),plus:(0,e.jsx)(xr,{size:16}),refresh:(0,e.jsx)(Ut,{size:16}),moreV:(0,e.jsx)(mr,{size:16}),clock:(0,e.jsx)(st,{size:16}),check:(0,e.jsx)(Rt,{size:16}),chevLeft:(0,e.jsx)(Ht,{size:16}),chevRight:(0,e.jsx)(Ot,{size:16}),chevFirst:(0,e.jsx)(hr,{size:16}),chevLast:(0,e.jsx)(pr,{size:16}),list:(0,e.jsx)(fr,{size:16}),grid:(0,e.jsx)(jr,{size:16}),x:(0,e.jsx)(Ue,{size:16}),calendar:(0,e.jsx)(lt,{size:16})},ce={getBookings:async()=>{const t=await fetch(`${Te}/hearse-bookings?t=${Date.now()}`,{headers:Ae()});if(!t.ok)throw new Error("Failed");return(await t.json()).bookings||[]},getBranches:async()=>{try{const t=await fetch(`${Te}/tenant/${Xt()}/branches`,{headers:Ae()});return t.ok?(await t.json()).data||[]:[]}catch{return[]}},getAllHearses:async()=>{const t=await fetch(`${Te}/hearses`,{headers:{...br(),...Ae()}});return t.ok?(await t.json()).hearses||[]:[]},updateStatus:async(t,r,o)=>{const f=Ae();f["Content-Type"]="application/json";const s={status:r};String(r)==="cancelled"&&(s.cancel_reason=o||null);const S=await fetch(`${Te}/hearse-bookings/${t}/status`,{method:"PUT",headers:f,body:JSON.stringify(s)});if(!S.ok)throw new Error("Failed");return S.json()},registerHearse:async t=>{const r=Ae();r["Content-Type"]="application/json";const o=await fetch(`${Te}/hearses`,{method:"POST",headers:r,body:JSON.stringify(t)});if(!o.ok){const f=await o.json().catch(()=>({}));throw new Error(f.message||"Failed to register")}return o.json()}},Tt=d.div`
  min-height: 100vh;
  background: ${i.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${i.text};
  box-sizing: border-box;
  *, *::before, *::after { box-sizing: border-box; }
`,In=d.div`
  max-width: 2200px;
  margin: 0 auto;
  padding: 0rem;
  @media (max-width: 900px) { padding: 0.75rem; }
`,Nn=d.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
`,Ie=d.div`
  background: ${t=>t.$bg||i.surface};
  border-radius: ${i.radiusSm};
  box-shadow: ${i.shadowSm};
  border: none;
  padding: 0.7rem 0.9rem;
  transition: ${i.transition};
  position: relative;
  overflow: hidden;
  &:hover { transform: translateY(-2px); box-shadow: ${i.shadowMd}; }
`,Ne=d.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;`,Le=d.div`font-size:0.62rem;font-weight:700;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:0.05em;`,Pe=d.div`width:22px;height:22px;border-radius:${i.radiusXs};display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.2);color:#ffffff;`,We=d.div`font-size:1.25rem;font-weight:800;color:#ffffff;line-height:1.2;margin-bottom:0.15rem;`,Re=d.div`font-size:0.64rem;color:rgba(255,255,255,0.8);font-weight:500;`,Ln=d.div`
  background: ${i.surface};
  border-radius: ${i.radius};
  box-shadow: ${i.shadowSm};
  border: 1px solid ${i.border};
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
`,Pn=d.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${t=>t.$marginBottom||"0"};
  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    > div, > input, > select, > button { width: 100% !important; min-width: 0 !important; }
  }
`,Wn=d.input`
  flex: 0 1 200px;
  min-width: 150px;
  max-width: 200px;
  padding: 0.4rem 0.65rem;
  border: 1px solid ${i.border};
  border-radius: ${i.radiusSm};
  font-size: 0.8125rem;
  color: ${i.text};
  background: ${i.surface};
  transition: ${i.transition};
  &:focus { outline: none; border-color: ${i.primary}; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  @media (max-width: 900px) { width: 100%; min-width: 0; flex: 1 1 100%; }
`,ot=d.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${i.border};
  border-radius: ${i.radiusSm};
  font-size: 0.8125rem;
  color: ${i.text};
  background: ${i.surface};
  cursor: pointer;
  transition: ${i.transition};
  &:focus { outline: none; border-color: ${i.primary}; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
`,Rn=d.div`
  background: ${i.surface};
  border-radius: ${i.radius};
  box-shadow: ${i.shadowSm};
  border: 1px solid ${i.border};
  overflow: hidden;
`,Hn=d.table`width:100%;border-collapse:collapse;font-size:0.8125rem;min-width:800px;`,On=d.thead`background:${i.bg};border-bottom:1px solid ${i.border};`,Un=d.tr`
  border-bottom: 1px solid ${i.border};
  cursor: pointer;
  transition: ${i.transition};
  &:hover { background: ${i.bg}; }
  &:last-child { border-bottom: none; }
`,pe=d.td`padding:0.875rem 1rem;color:${i.text};vertical-align:middle;`,me=d.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: ${i.textSecondary};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`,Yn=d.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${t=>X[t.$status]?.bg||i.borderLight};
  color: ${t=>X[t.$status]?.color||i.textSecondary};
  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${t=>X[t.$status]?.dotColor||i.textMuted};
  }
`,at=d.button`
  background: transparent;
  border: none;
  color: ${i.textSecondary};
  cursor: pointer;
  padding: 0.375rem;
  border-radius: ${i.radiusXs};
  transition: ${i.transition};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover { background: ${i.border}; color: ${i.text}; }
`,ke=d.button`
  background: ${t=>t.$bg||i.primary};
  color: ${i.white};
  border: none;
  border-radius: ${i.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${i.transition};
  box-shadow: ${i.shadowSm};
  white-space: nowrap;
  &:hover { opacity: 0.9; }
  &:disabled { background: ${i.textMuted}; cursor: not-allowed; }
`,qe=d.button`
  background: ${i.surface};
  color: ${i.text};
  border: 1px solid ${i.border};
  border-radius: ${i.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${i.transition};
  white-space: nowrap;
  &:hover { background: ${i.bg}; }
`,Jn=d.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${i.textSecondary};
  svg { width: 3rem; height: 3rem; margin-bottom: 1rem; opacity: 0.4; }
  h4 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: ${i.text}; }
  p { font-size: 0.8125rem; margin: 0; color: ${i.textSecondary}; }
`,Gn=d.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${i.border};
  flex-wrap: wrap;
  gap: 0.5rem;
  @media (max-width: 900px) { justify-content: center; }
`,Vn=d.span`font-size:0.8rem;color:${i.textSecondary};`,Xn=d.div`display:flex;gap:0.25rem;align-items:center;flex-wrap:wrap;justify-content:center;`,He=d.button`
  width: 32px; height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${i.border};
  border-radius: 6px;
  background: ${i.surface};
  color: ${i.textSecondary};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${i.transition};
  &:hover:not(:disabled) { background: ${i.bg}; border-color: ${i.primary}; color: ${i.primary}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${t=>t.$active&&`background:${i.primary};color:${i.white};border-color:${i.primary};`}
`,qn=d.div`position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9998;animation:${Vt}0.12s ease-out;backdrop-filter:blur(3px);`,Kn=d.div`
  position:fixed;top:0;right:0;bottom:0;
  width:${t=>t.$w||"480px"};max-width:100%;
  background:${i.surface};
  box-shadow:-12px 0 36px rgba(17,24,39,0.18);
  z-index:9999;
  transform:translateX(${t=>t.$open?"0":"100%"});
  transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);
  display:flex;flex-direction:column;
  @media(max-width:900px){width:100%}
`,Zn=d.div`
  padding:1.1rem 1.25rem;
  background:linear-gradient(135deg,${i.primaryDark},${i.primary});
  display:flex;justify-content:space-between;align-items:center;gap:0.5rem;
  flex-shrink:0;
`,Qn=d.h2`font-size:1.0625rem;font-weight:700;margin:0;color:#FFFFFF;letter-spacing:0.01em;`,ei=d.p`
  display:inline-block;margin:0.5rem 0 0;
  padding:0.22rem 0.6rem;border-radius:99px;
  background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.22);
  font-size:0.72rem;font-weight:700;letter-spacing:0.05em;color:rgba(255,255,255,0.95);
`,ti=d.button`
  width:30px;height:30px;flex-shrink:0;
  border:none;border-radius:8px;cursor:pointer;
  background:rgba(255,255,255,0.16);color:#FFFFFF;
  display:inline-flex;align-items:center;justify-content:center;
  transition:background 0.15s ease;
  &:hover{background:rgba(255,255,255,0.3);}
`,ri=d.div`
  flex:1;overflow-y:auto;padding:1.25rem;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{width:5px}
  &::-webkit-scrollbar-thumb{background:${i.borderLight};border-radius:99px}
`,ni=d.div`
  display:flex;align-items:center;gap:0.5rem;
  padding:0.7rem 0.95rem;border-radius:${i.radiusSm};
  background:${t=>X[t.$status]?.bg||i.borderLight};
  border:1px solid ${t=>(X[t.$status]?.dotColor||i.borderLight)+"55"};
  margin-bottom:0.35rem;
  .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${t=>X[t.$status]?.dotColor||i.textMuted};}
  .lbl{font-size:0.875rem;font-weight:700;color:${t=>X[t.$status]?.color||i.text};}
  .cap{margin-left:auto;font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${t=>X[t.$status]?.color||i.textSecondary};opacity:0.7;}
`,ii=d.div`
  display:flex;
  flex-direction:column;
  margin:0.55rem 0 1.25rem;
`,fe=d.div`
  display:flex;
  flex-direction:column;
  gap:0.2rem;
  padding:0.65rem 0;
  border-bottom:1px solid ${i.borderLight};
  &:last-child{border-bottom:none;padding-bottom:0.35rem;}
`,ge=d.div`
  font-size:0.6875rem;
  font-weight:700;
  color:${i.textMuted};
  text-transform:uppercase;
  letter-spacing:0.06em;
`,he=d.div`
  font-size:0.9375rem;
  font-weight:600;
  color:${i.text};
  line-height:1.45;
  word-break:break-word;
  & > div{font-weight:400;color:${i.textSecondary};}
`,Mt=d.div`position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);padding:1rem;`,At=d.div`background:${i.white};border-radius:${i.radius};width:460px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 40px rgba(0,0,0,0.15);animation:${Vt}0.15s ease-out;`,It=d.div`padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${i.primaryDark},${i.primary});border-radius:${i.radius} ${i.radius} 0 0;`,Nt=d.div`padding:1.25rem;`,Lt=d.div`display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;border-top:1px solid ${i.border};padding-top:1rem;`,Ke=d.input`width:100%;padding:0.5rem 0.75rem;border:1px solid ${i.border};border-radius:${i.radiusSm};font-size:0.8125rem;color:${i.text};background:${i.white};outline:none;box-sizing:border-box;&::placeholder{color:${i.textMuted}}&:focus{border-color:${i.primaryLight};box-shadow:0 0 0 2px rgba(44,138,201,0.1);}`,Oe=d.label`display:block;font-weight:600;margin-bottom:0.35rem;font-size:0.78rem;color:${i.text};`,oi=d.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: ${i.white};
  border: 1px solid ${i.border};
  border-radius: ${i.radiusSm};
  box-shadow: ${i.shadowLg};
  z-index: 50;
  min-width: 160px;
  overflow: hidden;
`,Ze=d.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: ${i.text};
  font-size: 0.78rem;
  cursor: pointer;
  transition: ${i.transition};
  text-align: left;
  &:hover { background: ${i.bg}; }
`,ai=()=>{const[t,r]=(0,c.useState)([]),[o,f]=(0,c.useState)([]),[s,S]=(0,c.useState)([]),[C,q]=(0,c.useState)(!0),[y,D]=(0,c.useState)(""),[O,W]=(0,c.useState)(""),[v,N]=(0,c.useState)(""),[w,T]=(0,c.useState)(1),[K,U]=(0,c.useState)("calendar"),[R,Q]=(0,c.useState)(Z(new Date)),[H,p]=(0,c.useState)(null),[x,g]=(0,c.useState)(!1),[m,B]=(0,c.useState)(null),[z,M]=(0,c.useState)(!1),[L,Y]=(0,c.useState)([]),[J,ee]=(0,c.useState)(null),de=(0,c.useRef)(null),[te,Se]=(0,c.useState)("all"),[ie,V]=(0,c.useState)(!1),[oe,ae]=(0,c.useState)({plate_number:"",hearse_name:"",model:"",capacity:"8",status:"available",branch_code:""}),[Ye,_e]=(0,c.useState)(!1),[P,Ce]=(0,c.useState)(null),[ue,xe]=(0,c.useState)(""),[Je,l]=(0,c.useState)(!1),{socket:h}=vr(),{user:$}=_r(),F=(0,c.useCallback)(n=>{const a=new Date,b=Z(a);switch(n){case"today":return{start:b,end:b};case"tomorrow":{const j=new Date(a);j.setDate(j.getDate()+1);const A=Z(j);return{start:A,end:A}}case"thisWeek":{const j=a.getDay(),A=new Date(a);A.setDate(a.getDate()-(j+6)%7);const re=new Date(A);return re.setDate(A.getDate()+6),{start:Z(A),end:Z(re)}}case"nextWeek":{const j=a.getDay(),A=new Date(a);A.setDate(a.getDate()+(7-(j+6)%7));const re=new Date(A);return re.setDate(A.getDate()+6),{start:Z(A),end:Z(re)}}case"thisMonth":return{start:Z(new Date(a.getFullYear(),a.getMonth(),1)),end:Z(new Date(a.getFullYear(),a.getMonth()+1,0))};case"nextMonth":{const j=a.getMonth()+1,A=j>11?a.getFullYear()+1:a.getFullYear(),re=j>11?0:j;return{start:Z(new Date(A,re,1)),end:Z(new Date(A,re+1,0))}}default:return{start:null,end:null}}},[]);(0,c.useCallback)(n=>{Se(n),T(1)},[]);const k=(0,c.useCallback)(async()=>{q(!0);try{const[n,a,b]=await Promise.all([ce.getBookings(),ce.getBranches(),ce.getAllHearses()]);r(n),S(a),f(b)}catch{ne.error("Failed to load data")}q(!1)},[]),G=(0,c.useCallback)(async()=>{try{const[n,a,b]=await Promise.all([ce.getBookings(),ce.getBranches(),ce.getAllHearses()]);r(n),S(a),f(b)}catch{ne.error("Failed to refresh data")}},[]);(0,c.useEffect)(()=>{k()},[k]),(0,c.useEffect)(()=>{if(h)return h.on("new_booking",n=>{if(n.booking){r(b=>[n.booking,...b]);const a=n.booking_code||`BK-${n.booking_id}`;ne.success(`New booking: ${a} - ${n.booking_client_name||"Client"}`)}}),h.on("booking_status_updated",n=>{r(a=>a.map(b=>b.booking_id===n.booking_id?{...b,status:n.status,...n.booking}:b))}),h.on("booking_postponed",()=>k()),()=>{h.off("new_booking"),h.off("booking_status_updated"),h.off("booking_postponed")}},[h,k]);const _=(0,c.useMemo)(()=>{let n=[...t];if(v&&(n=n.filter(a=>a.status===v)),O&&(n=n.filter(a=>String(a.branch_id)===String(O))),te!=="all"){const a=F(te);a.start&&a.end&&(n=n.filter(b=>{let j=[];try{j=typeof b.booking_dates=="string"?JSON.parse(b.booking_dates):b.booking_dates||[]}catch{j=[]}return j.length===0&&b.booking_date&&(j=[String(b.booking_date).slice(0,10)]),j.length===0&&b.estimated_departure_time&&(j=[String(b.estimated_departure_time).slice(0,10)]),j.some(A=>A>=a.start&&A<=a.end)}))}if(y.trim()){const a=y.toLowerCase();n=n.filter(b=>(b.client_name||"").toLowerCase().includes(a)||(b.booking_code||Xe(b.booking_id)||"").toLowerCase().includes(a)||(b.destination||"").toLowerCase().includes(a)||(b.from_location||b.from||"").toLowerCase().includes(a)||(b.to_location||"").toLowerCase().includes(a)||(b.hearse_name||"").toLowerCase().includes(a))}return n},[t,v,O,te,F,y]),E=Math.max(1,Math.ceil(_.length/Me)),se=_.slice((w-1)*Me,w*Me);(0,c.useEffect)(()=>{T(1)},[v,O,te,y]),(0,c.useEffect)(()=>{const n=a=>{de.current&&!de.current.contains(a.target)&&ee(null)};return document.addEventListener("mousedown",n),()=>document.removeEventListener("mousedown",n)},[]);const le=(0,c.useMemo)(()=>({total:t.length,pending:t.filter(n=>n.status==="pending"||n.status==="booked").length,inProgress:t.filter(n=>n.status==="in_transit").length,completed:t.filter(n=>n.status==="completed").length,active:t.filter(n=>!["completed","cancelled"].includes(n.status)).length}),[t]),tt=(0,c.useCallback)(n=>{B(n),g(!0),ee(null)},[]),$e=(0,c.useCallback)(()=>{g(!1),B(null)},[]),be=(0,c.useCallback)(async(n,a,b)=>{try{await ce.updateStatus(n,a,b),r(j=>j.map(A=>String(A.booking_id??A.id)===String(n)?{...A,status:a,...a==="cancelled"?{cancel_reason:b||null}:{}}:A)),m&&String(m.booking_id??m.id)===String(n)&&B(j=>({...j,status:a,...a==="cancelled"?{cancel_reason:b||null}:{}})),ne.success(`Status → ${X[a]?.label||a}`),ee(null)}catch{ne.error("Failed to update")}},[m]),pt=(0,c.useCallback)(n=>{Ce(n),xe(n?.cancel_reason||""),ee(null)},[]),Fe=(0,c.useCallback)(()=>{Ce(null),xe("")},[]),qt=(0,c.useCallback)(async()=>{if(P){if(!ue.trim()){ne.error("Please enter a cancel reason");return}l(!0),await be(P.booking_id||P.id,"cancelled",ue.trim()),l(!1),Fe()}},[P,ue,be,Fe]),Kt=(0,c.useCallback)(n=>{Y(n?[n]:[]),M(!0)},[]),Zt=(0,c.useCallback)(()=>{M(!1),Y([])},[]),Qt=(0,c.useCallback)(n=>{!n||n.length===0||(Y(n),M(!0))},[]),er=async n=>{if(n.preventDefault(),!oe.plate_number.trim()||!oe.hearse_name.trim()){ne.error("Plate number and name are required");return}_e(!0);try{await ce.registerHearse({...oe}),ne.success("Hearse registered successfully!"),V(!1),ae({plate_number:"",hearse_name:"",model:"",capacity:"8",status:"available",branch_code:""}),await G()}catch(a){ne.error("Failed: "+a.message)}_e(!1)},tr=(0,c.useMemo)(()=>{const n=[];return t.forEach(a=>{let b=[];try{b=typeof a.booking_dates=="string"?JSON.parse(a.booking_dates):a.booking_dates||[]}catch{const j=a.booking_date||a.estimated_departure_time;j&&(b=[Z(j)])}b.forEach(j=>{n.push({...a,date:String(j).slice(0,10)})})}),n},[t]),rr=()=>{const n=[];n.push((0,e.jsx)(He,{disabled:w===1,onClick:()=>T(1),children:I.chevFirst},"first"),(0,e.jsx)(He,{disabled:w===1,onClick:()=>T(a=>a-1),children:I.chevLeft},"prev"));for(let a=1;a<=E;a++){if(E>7&&a>2&&a<E-1&&Math.abs(a-w)>1){(a===3||a===E-2)&&n.push((0,e.jsx)("span",{style:{padding:"0 0.25rem",color:i.textMuted,fontSize:"0.8rem"},children:"…"},`dots-${a}`));continue}n.push((0,e.jsx)(He,{onClick:()=>T(a),$active:w===a,children:a},a))}return n.push((0,e.jsx)(He,{disabled:w===E,onClick:()=>T(a=>a+1),children:I.chevRight},"next"),(0,e.jsx)(He,{disabled:w===E,onClick:()=>T(E),children:I.chevLast},"last")),n};if(C)return(0,e.jsx)(Tt,{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:(0,e.jsx)(Ut,{size:32,color:i.primary,className:"animate-spin"})});const mt=s.length>0?s:[];return(0,e.jsxs)(Tt,{children:[(0,e.jsxs)(In,{children:[(0,e.jsxs)(Nn,{children:[(0,e.jsxs)(Ie,{$bg:"#1e3a8a",children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Le,{children:"Total Bookings"}),(0,e.jsx)(Pe,{children:I.truck})]}),(0,e.jsx)(We,{children:le.total}),(0,e.jsx)(Re,{children:"All time"})]}),(0,e.jsxs)(Ie,{$bg:"#0f766e",children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Le,{children:"Active"}),(0,e.jsx)(Pe,{children:I.car})]}),(0,e.jsx)(We,{children:le.active}),(0,e.jsx)(Re,{children:"In progress"})]}),(0,e.jsxs)(Ie,{$bg:"#d97706",children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Le,{children:"Pending"}),(0,e.jsx)(Pe,{children:I.clock})]}),(0,e.jsx)(We,{children:le.pending}),(0,e.jsx)(Re,{children:"Needs attention"})]}),(0,e.jsxs)(Ie,{$bg:"#be185d",children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Le,{children:"In Transit"}),(0,e.jsx)(Pe,{children:I.truck})]}),(0,e.jsx)(We,{children:le.inProgress}),(0,e.jsx)(Re,{children:"On the road"})]}),(0,e.jsxs)(Ie,{$bg:"#15803d",children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Le,{children:"Completed"}),(0,e.jsx)(Pe,{children:I.check})]}),(0,e.jsx)(We,{children:le.completed}),(0,e.jsx)(Re,{children:"Delivered"})]})]}),(0,e.jsx)(Ln,{children:(0,e.jsxs)(Pn,{children:[(0,e.jsx)(Wn,{type:"text",placeholder:"Search client, ID, destination...",value:y,onChange:n=>D(n.target.value)}),(0,e.jsxs)(ot,{value:O,onChange:n=>W(n.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Branches"}),mt.map(n=>(0,e.jsx)("option",{value:n.branch_id,children:n.branch_name},n.branch_id)),mt.length===0&&(0,e.jsx)("option",{value:"",children:"No branches"})]}),(0,e.jsxs)(ot,{value:v,onChange:n=>N(n.target.value),children:[(0,e.jsx)("option",{value:"",children:"All Statuses"}),Bn.map(n=>(0,e.jsx)("option",{value:n,children:X[n]?.label||n},n))]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.25rem"},children:[(0,e.jsx)(at,{onClick:()=>U("table"),style:{background:K==="table"?i.primary:i.surface,color:K==="table"?i.white:i.textSecondary},children:I.list}),(0,e.jsx)(at,{onClick:()=>U("calendar"),style:{background:K==="calendar"?i.primary:i.surface,color:K==="calendar"?i.white:i.textSecondary},children:I.grid})]}),(0,e.jsxs)(qe,{onClick:k,style:{marginLeft:"auto"},children:[I.refresh," Refresh"]}),(0,e.jsxs)(ke,{onClick:()=>Kt(""),children:[I.plus," Book Hearse"]}),(0,e.jsxs)(ke,{onClick:()=>V(!0),$bg:i.success,children:[I.plus," Register Hearse"]})]})}),(0,e.jsxs)(Rn,{children:[K==="table"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{style:{overflowX:"auto",WebkitOverflowScrolling:"touch"},children:(0,e.jsxs)(Hn,{children:[(0,e.jsx)(On,{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)(me,{children:"Booking ID"}),(0,e.jsx)(me,{children:"Client"}),(0,e.jsx)(me,{children:"Route"}),(0,e.jsx)(me,{children:"Hearse"}),(0,e.jsx)(me,{children:"Branch"}),(0,e.jsx)(me,{children:"Dates"}),(0,e.jsx)(me,{children:"Status"}),(0,e.jsx)(me,{children:"Actions"})]})}),(0,e.jsx)("tbody",{children:se.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:8,children:(0,e.jsxs)(Jn,{children:[(0,e.jsx)(dt,{}),(0,e.jsx)("h4",{children:"No bookings found"}),(0,e.jsx)("p",{children:"Try adjusting your filters or create a new booking."})]})})}):se.map(n=>{const a=n.booking_id||n.id,b=n.booking_code||Xe(a,n.plate_number);return(0,e.jsxs)(Un,{onClick:()=>tt(n),children:[(0,e.jsx)(pe,{children:(0,e.jsx)("span",{style:{fontWeight:600,color:i.primary,fontSize:"0.78rem"},children:b})}),(0,e.jsxs)(pe,{children:[(0,e.jsx)("div",{style:{fontWeight:500},children:n.client_name||"N/A"}),n.client_phone&&(0,e.jsx)("div",{style:{fontSize:"0.72rem",color:i.textMuted},children:n.client_phone})]}),(0,e.jsx)(pe,{children:(0,e.jsx)("div",{style:{fontSize:"0.78rem",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:Bt(n)})}),(0,e.jsxs)(pe,{children:[(0,e.jsx)("div",{style:{fontSize:"0.78rem"},children:n.hearse_name||"N/A"}),n.plate_number&&(0,e.jsx)("div",{style:{fontSize:"0.68rem",color:i.textMuted},children:n.plate_number})]}),(0,e.jsx)(pe,{children:(0,e.jsx)("div",{style:{fontSize:"0.78rem"},children:n.branch_name||"N/A"})}),(0,e.jsx)(pe,{children:(0,e.jsx)("div",{style:{fontSize:"0.78rem"},children:Et(n)})}),(0,e.jsx)(pe,{children:(0,e.jsx)(Yn,{$status:n.status,children:X[n.status]?.label||n.status})}),(0,e.jsx)(pe,{children:(0,e.jsxs)("div",{style:{position:"relative"},ref:de,children:[(0,e.jsx)(at,{onClick:j=>{j.stopPropagation(),ee(J===a?null:a)},children:I.moreV}),J===a&&(0,e.jsxs)(oi,{onClick:j=>j.stopPropagation(),children:[n.status==="booked"&&(0,e.jsxs)(Ze,{onClick:()=>be(a,"in_transit"),children:[I.truck," Mark In Transit"]}),n.status==="in_transit"&&(0,e.jsxs)(Ze,{onClick:()=>be(a,"completed"),children:[I.check," Mark Completed"]}),(n.status==="booked"||n.status==="pending")&&(0,e.jsxs)(Ze,{onClick:()=>be(a,"postponed"),children:[I.clock," Postpone"]}),!["completed","cancelled"].includes(n.status)&&(0,e.jsxs)(Ze,{onClick:()=>pt(n),style:{color:i.danger},children:[I.x," Cancel"]})]})]})})]},a)})})]})}),(0,e.jsxs)(Gn,{children:[(0,e.jsxs)(Vn,{children:["Showing ",(w-1)*Me+1,"–",Math.min(w*Me,_.length)," of ",_.length]}),(0,e.jsx)(Xn,{children:rr()})]})]}),K==="calendar"&&(0,e.jsx)(Lr,{bookings:_,selectedDate:R,onDateSelect:Q,onDateClick:n=>{Q(n),p(n)},onItemClick:tt,onCreateBooking:Qt}),H&&(0,e.jsx)("div",{style:{marginTop:"1rem"},children:(0,e.jsx)(qr,{date:H,bookings:tr.filter(n=>n.date===String(H).slice(0,10)),onClose:()=>p(null),onItemClick:tt})})]})]}),x&&(0,e.jsx)(qn,{onClick:$e}),(0,e.jsxs)(Kn,{$open:x,$w:"520px",children:[(0,e.jsxs)(Zn,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(Qn,{children:"Booking Details"}),m&&(0,e.jsx)(ei,{children:m.booking_code||Xe(m.booking_id)})]}),(0,e.jsx)(ti,{onClick:$e,"aria-label":"Close",children:I.x})]}),(0,e.jsx)(ri,{children:m&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ni,{$status:m.status,children:[(0,e.jsx)("span",{className:"dot"}),(0,e.jsx)("span",{className:"lbl",children:X[m.status]?.label||m.status}),(0,e.jsx)("span",{className:"cap",children:"Current status"})]}),(0,e.jsxs)(ii,{children:[(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Client"}),(0,e.jsxs)(he,{children:[m.client_name||"N/A",m.client_phone&&(0,e.jsx)("div",{style:{fontSize:"0.78rem",color:i.textMuted,marginTop:"0.15rem"},children:m.client_phone})]})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Route"}),(0,e.jsx)(he,{children:Bt(m)})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Dates"}),(0,e.jsx)(he,{children:(()=>{const n=ft(m),a=n?Tr(m):[],b=n?ht(m):null;return(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:2},children:[(0,e.jsx)("div",{children:Et(m)}),n&&a.length>1&&(0,e.jsx)("div",{style:{display:"flex",flexWrap:"wrap",gap:3},children:a.map((j,A)=>{const re=new Date(j+"T00:00:00"),nr=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][re.getDay()];return(0,e.jsxs)("span",{style:{background:b,color:"#fff",padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600},children:[nr," ",re.getDate()]},j)})})]})})()})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Hearse"}),(0,e.jsxs)(he,{children:[m.hearse_name||"N/A",m.plate_number&&(0,e.jsx)("div",{style:{fontSize:"0.78rem",color:i.textMuted,marginTop:"0.15rem"},children:m.plate_number})]})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Branch"}),(0,e.jsx)(he,{style:{display:"flex",alignItems:"center",gap:6},children:(()=>{const n=Br(m),a=ft(m)?ht(m):null;return(0,e.jsxs)(e.Fragment,{children:[a&&(0,e.jsx)("span",{style:{width:8,height:8,borderRadius:"50%",background:a,display:"inline-block",flexShrink:0}}),(0,e.jsx)("span",{style:{fontWeight:600,color:a||"inherit"},children:n})]})})()})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Booked By"}),(0,e.jsx)(he,{children:m.booked_by||"System"})]}),(0,e.jsxs)(fe,{children:[(0,e.jsx)(ge,{children:"Created"}),(0,e.jsx)(he,{children:Tn(m.created_at)})]}),m.cancel_reason&&(0,e.jsxs)(fe,{style:{gridColumn:"1 / -1"},children:[(0,e.jsx)(ge,{children:"Cancel Reason"}),(0,e.jsx)(he,{style:{color:i.danger},children:m.cancel_reason})]})]}),!["completed","cancelled"].includes(m.status)&&(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap"},children:[m.status==="booked"&&(0,e.jsxs)(ke,{onClick:()=>{be(m.booking_id||m.id,"in_transit"),$e()},children:[I.truck," Mark In Transit"]}),m.status==="in_transit"&&(0,e.jsxs)(ke,{onClick:()=>{be(m.booking_id||m.id,"completed"),$e()},children:[I.check," Mark Completed"]}),(0,e.jsxs)(qe,{onClick:()=>{pt(m),$e()},style:{color:i.danger,borderColor:i.dangerLight},children:[I.x," Cancel Booking"]})]})]})})]}),ie&&(0,e.jsx)(Mt,{onClick:()=>V(!1),children:(0,e.jsxs)(At,{onClick:n=>n.stopPropagation(),children:[(0,e.jsxs)(It,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"1rem",fontWeight:700,color:"#fff"},children:"Register New Hearse"}),(0,e.jsx)("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.6)"},children:"Add a new vehicle to the fleet"})]}),(0,e.jsx)("button",{style:{width:28,height:28,borderRadius:6,background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>V(!1),children:(0,e.jsx)(Ue,{size:14})})]}),(0,e.jsx)(Nt,{children:(0,e.jsxs)("form",{onSubmit:er,children:[(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"0.75rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(Oe,{children:"Plate Number *"}),(0,e.jsx)(Ke,{placeholder:"KAB 123A",value:oe.plate_number,onChange:n=>ae(a=>({...a,plate_number:n.target.value})),required:!0})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Oe,{children:"Hearse Name *"}),(0,e.jsx)(Ke,{placeholder:"e.g., Mercedes E-Class",value:oe.hearse_name,onChange:n=>ae(a=>({...a,hearse_name:n.target.value})),required:!0})]})]}),(0,e.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",marginBottom:"0.75rem"},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(Oe,{children:"Model"}),(0,e.jsx)(Ke,{placeholder:"e.g., E-Class",value:oe.model,onChange:n=>ae(a=>({...a,model:n.target.value}))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Oe,{children:"Capacity (seats)"}),(0,e.jsx)(Ke,{type:"number",min:"1",value:oe.capacity,onChange:n=>ae(a=>({...a,capacity:n.target.value}))})]})]}),(0,e.jsxs)("div",{style:{marginBottom:"0.75rem"},children:[(0,e.jsx)(Oe,{children:"Status"}),(0,e.jsxs)(ot,{value:oe.status,onChange:n=>ae(a=>({...a,status:n.target.value})),style:{width:"100%"},children:[(0,e.jsx)("option",{value:"available",children:"Available"}),(0,e.jsx)("option",{value:"maintenance",children:"Maintenance"}),(0,e.jsx)("option",{value:"inactive",children:"Inactive"})]})]}),(0,e.jsxs)(Lt,{children:[(0,e.jsx)(qe,{type:"button",onClick:()=>V(!1),children:"Cancel"}),(0,e.jsx)(ke,{type:"submit",disabled:Ye,children:Ye?"Registering...":"Register Hearse"})]})]})})]})}),P&&(0,e.jsx)(Mt,{onClick:Fe,children:(0,e.jsxs)(At,{onClick:n=>n.stopPropagation(),children:[(0,e.jsxs)(It,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("div",{style:{fontSize:"1rem",fontWeight:700,color:"#fff"},children:"Cancel Booking"}),(0,e.jsx)("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.6)"},children:P.booking_code||Xe(P.booking_id)})]}),(0,e.jsx)("button",{style:{width:28,height:28,borderRadius:6,background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},onClick:Fe,children:(0,e.jsx)(Ue,{size:14})})]}),(0,e.jsxs)(Nt,{children:[(0,e.jsx)("p",{style:{fontSize:"0.82rem",color:i.textSecondary,marginBottom:"0.75rem"},children:"Please provide a reason for cancelling this booking."}),(0,e.jsx)("textarea",{value:ue,onChange:n=>xe(n.target.value),placeholder:"Enter cancel reason...",rows:3,style:{width:"100%",padding:"0.5rem 0.75rem",border:"1px solid "+i.border,borderRadius:i.radiusSm,fontSize:"0.8125rem",color:i.text,background:i.white,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}),(0,e.jsxs)(Lt,{children:[(0,e.jsx)(qe,{type:"button",onClick:Fe,children:"Back"}),(0,e.jsx)(ke,{type:"button",onClick:qt,disabled:Je||!ue.trim(),$bg:i.danger,children:Je?"Cancelling...":"Confirm Cancel"})]})]})]})}),z&&(0,e.jsx)(En,{open:z,initialDates:L,hearses:o,branches:s,showToast:(n,a)=>{a==="success"?ne.success(n):ne.error(n)},onClose:Zt,onCreated:k})]})};export{bi as n,ai as t};
