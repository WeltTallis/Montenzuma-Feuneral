import{r as At}from"./chunk-CXHxssQy.js";import{y as Tt}from"./chunk-CXAmgOhv.js";import{i as Rt,l as Pe,u as Ct}from"./chunk-DWc5g_hH.js";import{_ as a,h as Et,m as qe}from"./chunk-DJYPtS2Y.js";import{i as Pt,o as qt}from"./chunk-CwzAxjA3.js";import{o as It}from"./chunk-BY9AVXEY.js";import{t as O}from"./chunk-eZ3__Fgx.js";import{c as fe,n as me}from"./chunk-C935kdjU.js";import{t as U}from"./chunk-BUeZRQuQ.js";import{Vn as Bt,et as Nt,f as at,fn as Ut,h as Mt,i as be,nn as Ot,on as Wt,p as oe,t as Kt}from"./index-D6gguvjv.js";import{a as Me}from"./chunk-N6-xod2j.js";import{t as re}from"./chunk-D61LeRbQ.js";import{i as Gt,n as J,r as Ht,t as r}from"./chunk-B9F-LUG6.js";import{t as ke}from"./chunk-CizeQYCt.js";import{t as Yt}from"./chunk-BKSTJCFj.js";var u=At(Tt(),1),e=It(),nt="leaflet-css-cdn";if(!document.getElementById(nt)){const t=document.createElement("link");t.id=nt,t.rel="stylesheet",t.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",document.head.appendChild(t)}var Jt=qe`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Oe=[{id:"lee",name:"Lee Funeral Home, Nairobi",lat:-1.2954,lng:36.8078},{id:"chiromo",name:"Chiromo Funeral Parlour",lat:-1.2758,lng:36.8066},{id:"ku",name:"K.U. Funeral Home, Kiambu",lat:-1.1824,lng:36.9272},{id:"umash-nrb",name:"Umash Funeral Home, Nairobi",lat:-1.2921,lng:36.8041},{id:"umash-nkr",name:"Umash Funeral Home, Nakuru",lat:-.2833,lng:36.0667},{id:"jocham",name:"Jocham Mortuary, Mombasa",lat:-4.0416,lng:39.6706},{id:"eldoret",name:"Moi Teaching Mortuary, Eldoret",lat:.5204,lng:35.2863}],Vt=[{name:"Nakuru",lat:-.3031,lng:36.08},{name:"Eldoret",lat:.5143,lng:35.2698},{name:"Kisumu",lat:-.0917,lng:34.768},{name:"Nyeri",lat:-.4226,lng:36.9389}],Qt=a.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;
`,Xt=a.div`
  width: 100%; max-width: 1200px; height: 90vh; max-height: 850px; background: #121212;
  border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1); font-family: system-ui, sans-serif; color: #ffffff;
`,Zt=a.div`
  display: flex; justify-content: space-between; align-items: center; padding: 16px 24px;
  background: #0d1b22; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`,er=a.div`
  display: flex; flex: 1; min-height: 0;
  @media (max-width: 850px) { flex-direction: column; }
`,tr=a.div`
  flex: 1.4; position: relative; background: #050505;
  @media (max-width: 850px) { height: 350px; flex: none; }
`,rr=a.div`
  width: 480px; display: flex; flex-direction: column; background: #0d0d0d;
  border-left: 1px solid rgba(255, 255, 255, 0.08); overflow-y: auto;
  @media (max-width: 850px) { width: 100%; flex: 1; }
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`,We=a.div` padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); `,se=a.label`
  font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888;
  display: block; margin-bottom: 6px;
  span { color: #4fc3f7; font-weight: normal; text-transform: none; margin-left: 6px; }
`,it=a.div` display: flex; gap: 8px; margin-bottom: 12px; `,le=a.input`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
  &:focus { outline: none; border-color: #4fc3f7; }
`,ar=a.select`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
`,Re=a.button`
  height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; border: none; white-space: nowrap; transition: 0.15s;
  background: ${t=>t.$variant==="success"?"#10b981":t.$variant==="whatsapp"?"#25D366":t.$variant==="outline"?"transparent":"#4fc3f7"};
  color: ${t=>t.$variant==="outline"?"#4fc3f7":t.$variant==="whatsapp"||t.$variant==="success"?"#fff":"#000"};
  border: ${t=>t.$variant==="outline"?"1px solid #4fc3f7":"none"};
  &:hover { opacity: 0.9; }
  &:disabled { background: #333; color: #666; cursor: not-allowed; }
`,nr=a.div`
  display: flex; background: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12);
`,st=a.button`
  flex: 1; height: 38px; border: none; font-size: 13px; font-weight: 600; cursor: pointer;
  background: ${t=>t.$active?"#4fc3f7":"transparent"};
  color: ${t=>t.$active?"#000":"#888"}; transition: 0.2s;
`,ir=a.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
`,ot=a.div`
  background: #161616; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; text-align: center;
  div:first-child { font-size: 18px; font-weight: 700; color: #4fc3f7; }
  div:last-child { font-size: 10px; text-transform: uppercase; color: #888; margin-top: 4px; }
`,sr=a.div`
  background: #161616; border: 1px solid rgba(79, 195, 247, 0.3); border-radius: 10px; padding: 16px;
  animation: ${Jt} 0.3s ease; margin-top: 8px;
`,Ce=a.div`
  display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;
  color: ${t=>t.$bold?"#fff":"#aaa"}; font-weight: ${t=>t.$bold?"700":"400"};
  border-bottom: ${t=>t.$divider?"1px dashed rgba(255,255,255,0.1)":"none"};
  margin-bottom: ${t=>t.$divider?"8px":"0"};
`,or=a.div`
  display: flex; align-items: center; gap: 8px; background: rgba(79, 195, 247, 0.1);
  padding: 8px; border-radius: 8px; border: 1px dashed #4fc3f7; margin-bottom: 12px;
  Input { height: 32px; width: 80px; text-align: center; font-weight: bold; font-size: 15px; color: #4fc3f7; border-color: #4fc3f7; background: #1a1a1a; }
`;function Dt({onClose:t}){const[c,s]=(0,u.useState)(Oe[0]),[w,h]=(0,u.useState)(""),[p,$]=(0,u.useState)(""),[R,o]=(0,u.useState)(null),[d,v]=(0,u.useState)("round"),[k,S]=(0,u.useState)(1),[D,f]=(0,u.useState)(5e3),[z,F]=(0,u.useState)(100),[A,b]=(0,u.useState)(3e3),[j,E]=(0,u.useState)(0),[X,Z]=(0,u.useState)(0),[W,V]=(0,u.useState)(!1),te=(0,u.useRef)(null),l=(0,u.useRef)(null),y=(0,u.useRef)(null),C=(0,u.useRef)(null);(0,u.useEffect)(()=>{if(!te.current)return;(async()=>{if(window.L||await new Promise(Q=>{const ee=document.createElement("script");ee.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",ee.onload=Q,document.body.appendChild(ee)}),!l.current&&window.L){const Q=window.L,ee=Q.map(te.current).setView([c.lat,c.lng],10);Q.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(ee),C.current=Q.layerGroup().addTo(ee),l.current=ee,L(c)}})()},[]);const L=x=>{!l.current||!window.L||(C.current.clearLayers(),y.current&&l.current.removeLayer(y.current),window.L.marker([x.lat,x.lng]).addTo(C.current).bindPopup(`<b>${x.name}</b><br/>Origin`).openPopup(),l.current.setView([x.lat,x.lng],12),o(null),E(0))},T=x=>{const Q=Oe.find(ee=>ee.id===x.target.value);s(Q),L(Q)},m=async(x,Q,ee)=>{V(!0),$(ee),o({lat:x,lng:Q});try{const Ie=await(await fetch(`https://router.project-osrm.org/route/v1/driving/${c.lng},${c.lat};${Q},${x}?overview=full&geometries=geojson`)).json();if(Ie.routes&&Ie.routes[0]){const Be=Ie.routes[0];if(E(Number((Be.distance/1e3).toFixed(1))),Z(Math.round(Be.duration/60)),l.current&&window.L){const Ne=window.L,Ue=l.current;y.current&&Ue.removeLayer(y.current),C.current.clearLayers(),Ne.marker([c.lat,c.lng]).addTo(C.current),Ne.marker([x,Q]).addTo(C.current).bindPopup(`<b>${ee}</b>`).openPopup();const Lt=Be.geometry.coordinates.map(rt=>[rt[1],rt[0]]);y.current=Ne.polyline(Lt,{color:"#4fc3f7",weight:5,opacity:.8}).addTo(Ue),Ue.fitBounds(y.current.getBounds(),{padding:[40,40]})}}}catch{alert("Routing failed.")}finally{V(!1)}},i=async()=>{if(w.trim()){V(!0);try{const x=await(await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(w+", Kenya")}&countrycodes=ke&limit=1`)).json();x&&x.length>0?m(parseFloat(x[0].lat),parseFloat(x[0].lon),x[0].display_name.split(",")[0]):alert("Location not found.")}catch{alert("Search failed.")}finally{V(!1)}}},n=j*(d==="round"?2:1),g=n*z,M=Math.max(0,k-1),ne=M*A,ie=D+g+ne,de=()=>{if(!R)return;const x=`https://www.google.com/maps/search/?api=1&query=${R.lat},${R.lng}`,Q=`🚗 *HEARSE DISPATCH ORDER*

*From:* ${c.name}
*To:* ${p}

*Trip Details:*
• Type: ${d==="round"?"Round Trip (To & From)":"One-Way Dropoff"}
• Duration: ${k} Day(s)
• One-Way Distance: ${j} km
• Billable Distance: ${n} km

📍 *Navigate via Google Maps:*
${x}`;window.open(`https://wa.me/?text=${encodeURIComponent(Q)}`,"_blank")};return(0,e.jsx)(Qt,{onClick:x=>x.target===x.currentTarget&&t?.(),children:(0,e.jsxs)(Xt,{children:[(0,e.jsxs)(Zt,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{style:{margin:0,fontSize:18},children:"Pro Dispatch & Logistics"}),(0,e.jsx)("p",{style:{margin:"2px 0 0",fontSize:12,color:"#4fc3f7"},children:"One-Way View & Editable Mileage"})]}),(0,e.jsx)(Re,{$variant:"outline",onClick:t,style:{width:32,height:32,padding:0,borderRadius:"50%"},children:"✕"})]}),(0,e.jsxs)(er,{children:[(0,e.jsx)(tr,{children:(0,e.jsx)("div",{ref:te,style:{width:"100%",height:"100%",zIndex:1}})}),(0,e.jsxs)(rr,{children:[(0,e.jsxs)(We,{children:[(0,e.jsx)(se,{children:"1. Origin (Funeral Home)"}),(0,e.jsx)(ar,{value:c.id,onChange:T,style:{width:"100%",marginBottom:12},children:Oe.map(x=>(0,e.jsx)("option",{value:x.id,children:x.name},x.id))}),(0,e.jsx)(se,{children:"2. Destination Search"}),(0,e.jsxs)(it,{children:[(0,e.jsx)(le,{placeholder:"e.g. Nakuru, Eldoret...",value:w,onChange:x=>h(x.target.value),onKeyDown:x=>x.key==="Enter"&&i()}),(0,e.jsx)(Re,{onClick:i,disabled:W,children:W?"...":"Find"})]}),(0,e.jsx)("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:Vt.map(x=>(0,e.jsx)("button",{onClick:()=>{h(x.name),m(x.lat,x.lng,x.name)},style:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",padding:"4px 10px",borderRadius:12,fontSize:11,cursor:"pointer"},children:x.name},x.name))})]}),(0,e.jsxs)(We,{children:[(0,e.jsx)(se,{children:"3. Trip Parameters"}),(0,e.jsxs)(it,{children:[(0,e.jsxs)(nr,{style:{flex:1},children:[(0,e.jsx)(st,{$active:d==="one-way",onClick:()=>v("one-way"),children:"One-Way Dropoff"}),(0,e.jsx)(st,{$active:d==="round",onClick:()=>v("round"),children:"Round Trip"})]}),(0,e.jsx)(le,{type:"number",min:"1",value:k,onChange:x=>S(parseInt(x.target.value)||1),style:{width:70,flex:"none"},title:"Days"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,marginTop:12},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(se,{children:"Base (KES)"}),(0,e.jsx)(le,{type:"number",value:D,onChange:x=>f(Number(x.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(se,{children:"Rate/KM"}),(0,e.jsx)(le,{type:"number",value:z,onChange:x=>F(Number(x.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(se,{children:"Per Night"}),(0,e.jsx)(le,{type:"number",value:A,onChange:x=>b(Number(x.target.value))})]})]})]}),(0,e.jsxs)(We,{style:{flex:1,border:"none",background:"#0a0a0a"},children:[!R&&!W&&(0,e.jsx)("div",{style:{color:"#666",textAlign:"center",marginTop:20},children:"Search a destination to display distances."}),W&&(0,e.jsx)("div",{style:{color:"#4fc3f7",textAlign:"center",marginTop:20},children:"Plotting route..."}),R&&!W&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ir,{children:[(0,e.jsxs)(ot,{children:[(0,e.jsxs)("div",{children:[X," Mins"]}),(0,e.jsx)("div",{children:"Duration (One-Way)"})]}),(0,e.jsxs)(ot,{children:[(0,e.jsx)("div",{children:d==="round"?`${n} km`:`${j} km`}),(0,e.jsx)("div",{children:"Total Billable KM"})]})]}),(0,e.jsxs)(or,{children:[(0,e.jsx)("div",{style:{flex:1},children:(0,e.jsxs)(se,{style:{margin:0,color:"#fff"},children:["One-Way Distance (KM) ",(0,e.jsx)("span",{children:"(Editable)"})]})}),(0,e.jsx)(le,{type:"number",value:j,onChange:x=>E(Number(x.target.value))})]}),(0,e.jsxs)(sr,{children:[(0,e.jsxs)("div",{style:{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12},children:["📍 Invoice: ",p]}),(0,e.jsxs)(Ce,{children:[(0,e.jsx)("span",{children:"Base Dispatch Fee"}),(0,e.jsxs)("span",{children:["KES ",D.toLocaleString()]})]}),(0,e.jsxs)(Ce,{children:[(0,e.jsxs)("span",{children:["Mileage (",n," km × KES ",z,")"]}),(0,e.jsxs)("span",{children:["KES ",g.toLocaleString()]})]}),M>0&&(0,e.jsxs)(Ce,{children:[(0,e.jsxs)("span",{children:["Overnight Allowance (",M," nights)"]}),(0,e.jsxs)("span",{children:["KES ",ne.toLocaleString()]})]}),(0,e.jsxs)(Ce,{$bold:!0,$divider:!0,style:{marginTop:12},children:[(0,e.jsx)("span",{children:"Total Invoice"}),(0,e.jsxs)("span",{style:{fontSize:18,color:"#10b981"},children:["KES ",ie.toLocaleString()]})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:12,marginTop:16},children:[(0,e.jsx)(Re,{$variant:"whatsapp",style:{flex:1},onClick:de,children:"WA to Driver"}),(0,e.jsx)(Re,{$variant:"success",style:{flex:1},onClick:()=>alert(`Confirmed. Total: KES ${ie.toLocaleString()}`),children:"Confirm Booking"})]})]})]})]})]})]})})}var dr=a.button`
  font-size: 13px; font-weight: 600; color: #d93025; cursor: pointer;
  background: none; border: none; display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px; padding: 0; font-family: 'Source Sans 3', sans-serif;
  &:hover { color: #b91c1c; }
`,lr=a.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  padding-left: 12px;
  h2 { font-family: 'Merriweather', serif; font-size: 26px; font-weight: 900; color: ${r.black}; margin: 0 0 4px; }
  p { color: ${r.dark}; font-size: 14px; font-weight: 700; margin: 0; }
`,cr=a.div`
  display: flex; gap: 12px; flex-wrap: wrap;
`,Ke=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid ${r.border}; background: white; color: ${r.dark};
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: ${r.bgField}; border-color: ${r.gray}; }
  ${t=>t.$primary&&`background: ${r.black}; color: white; border-color: ${r.black};
    &:hover { background: ${r.dark}; }`}
  ${t=>t.$danger&&`background: ${r.danger}; color: white; border-color: ${r.danger};
    &:hover { background: #b91c1c; }`}
`,pr=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #0c2530; background: #0c2530; color: #ffffff;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #0d2d3a; border-color: #0d2d3a; }
`,ur=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #d97706; background: #d97706; color: #000000;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #d97706; border-color: #d97706; }
`,hr=a.div`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: transparent; border: none; padding: 0; box-shadow: none;
`,dt=a.span`
  font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; color: ${r.black};
`,gr=({value:t})=>{const c=u.useRef(null);return u.useEffect(()=>{if(c.current)try{Pt.toCanvas(c.current,{bcid:"code128",text:t||"AWAITING-ID",scale:2,height:8,includetext:!1,paddingwidth:0,paddingheight:0})}catch(s){console.error("Barcode generation error:",s)}},[t]),(0,e.jsx)("canvas",{ref:c,style:{display:"block",width:"auto",height:"40px"}})},xr=({deceased:t,onBack:c,onTabSwitch:s,onChargeSettingsClick:w,onRefresh:h})=>{const p=Pe(),[$]=Rt(),R=Ct(),o=$.get("id")||R.id,[d,v]=(0,u.useState)(!1),k=t?.deceased_id||t?.id,S=t?.admission_number||t?.admission_no||"—",D=()=>{let f=localStorage.getItem("tenantSlug")||"";if(!f||f==="dashboard"||f==="default"){const z=localStorage.getItem("user"),F=z?JSON.parse(z):{};f=F?.parentTenantSlug||F?.tenantSlug||f}p(`/tenant/${f}/release-form/${o||k}`,{state:{deceasedData:t}})};return(0,e.jsxs)(e.Fragment,{children:[d&&(0,e.jsx)(Dt,{onClose:()=>v(!1)}),(0,e.jsx)(dr,{onClick:c,children:"← Back to List"}),(0,e.jsxs)(lr,{children:[(0,e.jsx)("div",{style:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:4},children:[(0,e.jsx)(hr,{title:"Admission barcode",children:(0,e.jsx)(gr,{value:S!=="—"?S:"AWAITING-ID"})}),(0,e.jsx)(dt,{style:{fontWeight:700,fontSize:11},children:k}),(0,e.jsx)(dt,{style:{fontWeight:400,fontSize:10,opacity:.7},children:S!=="—"?S:"AWAITING-ID"})]})}),(0,e.jsxs)(cr,{children:[(0,e.jsxs)(ur,{onClick:h,children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Refresh"]}),(0,e.jsxs)(pr,{onClick:()=>v(!0),children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Route Calculations"]}),(0,e.jsx)(Ke,{children:"Scan Docs"}),w&&(0,e.jsx)(Ke,{$primary:!0,onClick:w,children:"⚙️ Charge Settings"}),(0,e.jsx)(Ke,{$danger:!0,onClick:D,children:"Release Body"})]})]})]})},_={primaryDark:"#0f172a",accentBlue:"#3b82f6",accentPurple:"#8b5cf6",successGreen:"#10b981",dangerRed:"#ef4444",warningYellow:"#f59e0b",lightGray:"#f8fafc",mediumGray:"#e2e8f0",darkGray:"#1e293b",textMuted:"#64748b",white:"#ffffff",borderGray:"#e2e8f0"},zt=qe`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`,mr=qe`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,fr=a.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${zt} 0.2s ease-out;
`,br=a.div`
  background: ${_.white};
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: ${zt} 0.3s ease-out;
  overflow: hidden;
`,yr=a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${_.borderGray};
  background: linear-gradient(135deg, ${_.primaryDark} 0%, ${_.accentPurple} 100%);
  
  h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: ${_.white};
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`,jr=a.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: ${_.white};
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`,vr=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`,$r=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${_.borderGray};
  background-color: ${_.lightGray};
`,wr=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,_r=a.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${_.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${_.borderGray};
`,Ge=a.div`
  display: grid;
  grid-template-columns: ${({cols:t})=>t||"1fr 1fr"};
  gap: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`,ce=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,pe=a.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${_.darkGray};
`,He=a.select`
  padding: 0.625rem 1rem;
  border: 1px solid ${_.borderGray};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: ${_.white};
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  
  &:focus {
    outline: none;
    border-color: ${_.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Ye=a.input`
  padding: 0.625rem 1rem;
  border: 1px solid ${_.borderGray};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${_.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,tt=a.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Sr=a(tt)`
  background: linear-gradient(135deg, ${_.accentBlue} 0%, ${_.accentPurple} 100%);
  color: ${_.white};
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
`,kr=a(tt)`
  background-color: ${_.mediumGray};
  color: ${_.darkGray};
  
  &:hover:not(:disabled) {
    background-color: #d1d5db;
  }
`;a(tt)`
  background: transparent;
  border: 1px solid ${_.borderGray};
  color: ${_.darkGray};
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  
  &:hover:not(:disabled) {
    border-color: ${_.accentBlue};
    color: ${_.accentBlue};
    background-color: #eff6ff;
  }
`;var lt=a.div`
  background: ${_.white};
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid ${_.borderGray};
  text-align: center;
`,ct=a.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${_.primaryDark};
`,pt=a.div`
  font-size: 0.75rem;
  color: ${_.textMuted};
  margin-top: 0.25rem;
`;a.div`
  border: 1px solid ${_.borderGray};
  border-radius: 0.75rem;
  overflow: hidden;
`;a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background-color: ${_.lightGray};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${_.mediumGray};
  }
  
  h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${_.primaryDark};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;a.div`
  max-height: ${({isOpen:t})=>t?"300px":"0"};
  overflow-y: auto;
  transition: max-height 0.3s ease;
`;a.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${_.borderGray};
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${_.lightGray};
  }
`;a.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;a.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${_.primaryDark};
`;a.span`
  font-size: 0.7rem;
  color: ${_.textMuted};
`;var Rr=a(Ot)`
  animation: ${mr} 1s linear infinite;
`,Cr=a.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: ${t=>t.type==="warning"?"#fef3c7":t.type==="success"?"#d1fae5":"#dbeafe"};
  border: 1px solid ${t=>t.type==="warning"?"#f59e0b":t.type==="success"?"#10b981":"#3b82f6"};
  color: ${t=>t.type==="warning"?"#92400e":t.type==="success"?"#065f46":"#1e40af"};
  font-size: 0.8rem;
`,ut=()=>localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||(()=>{try{const t=JSON.parse(localStorage.getItem("user")||"{}");return t.tenantSlug||t.tenant?.slug||"default"}catch{return"default"}})(),Dr=({isOpen:t,onClose:c,deceasedId:s,deceasedData:w,onUpdate:h})=>{const[p,$]=(0,u.useState)("standard"),[R,o]=(0,u.useState)("KES"),[d,v]=(0,u.useState)("daily"),[k,S]=(0,u.useState)(3e3),[D,f]=(0,u.useState)(125),[z,F]=(0,u.useState)(130),[A,b]=(0,u.useState)(!1),[j,E]=(0,u.useState)(!1),[X,Z]=(0,u.useState)(!1),[W,V]=(0,u.useState)(!1),[te,l]=(0,u.useState)([]),[y,C]=(0,u.useState)(null),L=async()=>{if(s){b(!0);try{const i=await be.get(at.DECEASED.CHARGE_SETTINGS(s),{headers:{"x-tenant-slug":ut()}});if(i.data.success){const n=i.data.data;$(n.rateProfile||"standard"),o(n.currency||"KES"),v(n.chargeType||"daily"),S(n.dailyRate||3e3),f(n.hourlyRate||125),F(n.usdRate||130)}}catch(i){console.error("Error loading charge settings:",i)}finally{b(!1)}}};(0,u.useEffect)(()=>{t&&s&&L()},[t,s]);const T=async()=>{if(s){E(!0);try{(await be.put(at.DECEASED.UPDATE_CHARGE_SETTINGS(s),{rateProfile:p,currency:R,chargeType:d,dailyRate:k,hourlyRate:D,usdRate:z},{headers:{"x-tenant-slug":ut()}})).data.success&&(h&&h(),c())}catch(i){console.error("Error saving charge settings:",i)}finally{E(!1)}}},m=()=>{if(!w?.date_admitted)return 0;const i=new Date(w.date_admitted);if(isNaN(i.getTime()))return 0;const n=M=>new Date(M.getFullYear(),M.getMonth(),M.getDate()).getTime(),g=Math.floor((n(new Date)-n(i))/864e5);return Math.max(0,g)};return t?(0,e.jsx)(fr,{onClick:c,children:(0,e.jsxs)(br,{onClick:i=>i.stopPropagation(),children:[(0,e.jsxs)(yr,{children:[(0,e.jsxs)("h2",{children:[(0,e.jsx)(Ut,{size:20}),"Charge Settings - ",w?.full_name]}),(0,e.jsx)(jr,{onClick:c,children:(0,e.jsx)(Bt,{size:18})})]}),(0,e.jsxs)(vr,{children:[(0,e.jsxs)(Ge,{cols:"1fr 1fr",children:[(0,e.jsxs)(lt,{children:[(0,e.jsxs)(ct,{children:[w?.total_mortuary_charge||0," ",R]}),(0,e.jsx)(pt,{children:"Current Balance"})]}),(0,e.jsxs)(lt,{children:[(0,e.jsxs)(ct,{children:[m()," days"]}),(0,e.jsx)(pt,{children:"Days in Morgue"})]})]}),(0,e.jsxs)(wr,{children:[(0,e.jsxs)(_r,{children:[(0,e.jsx)(Nt,{size:16}),"Rate Configuration"]}),(0,e.jsxs)(Ge,{cols:"1fr 1fr",children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(pe,{children:"Rate Profile"}),(0,e.jsxs)(He,{value:p,onChange:i=>$(i.target.value),children:[(0,e.jsx)("option",{value:"standard",children:"Standard (KES 3,000/day)"}),(0,e.jsx)("option",{value:"premium",children:"Premium (KES 5,000/day)"}),(0,e.jsx)("option",{value:"custom",children:"Custom"})]})]}),(0,e.jsxs)(ce,{children:[(0,e.jsx)(pe,{children:"Currency"}),(0,e.jsxs)(He,{value:R,onChange:i=>o(i.target.value),children:[(0,e.jsx)("option",{value:"KES",children:"KES (Kenyan Shilling)"}),(0,e.jsx)("option",{value:"USD",children:"USD (US Dollar)"})]})]})]}),(0,e.jsxs)(Ge,{cols:"1fr 1fr",children:[(0,e.jsxs)(ce,{children:[(0,e.jsx)(pe,{children:"Billing Type"}),(0,e.jsxs)(He,{value:d,onChange:i=>v(i.target.value),children:[(0,e.jsx)("option",{value:"daily",children:"Daily Rate"}),(0,e.jsx)("option",{value:"hourly",children:"Hourly Rate"})]})]}),d==="daily"?(0,e.jsxs)(ce,{children:[(0,e.jsxs)(pe,{children:["Daily Rate (",R,")"]}),(0,e.jsx)(Ye,{type:"number",value:k,onChange:i=>S(parseFloat(i.target.value)||0),min:"0",step:"100"})]}):(0,e.jsxs)(ce,{children:[(0,e.jsxs)(pe,{children:["Hourly Rate (",R,")"]}),(0,e.jsx)(Ye,{type:"number",value:D,onChange:i=>f(parseFloat(i.target.value)||0),min:"0",step:"10"})]})]}),R==="USD"&&(0,e.jsxs)(ce,{children:[(0,e.jsx)(pe,{children:"USD to KES Exchange Rate"}),(0,e.jsx)(Ye,{type:"number",value:z,onChange:i=>F(parseFloat(i.target.value)||130),min:"1",step:"1"})]})]}),(0,e.jsxs)(Cr,{type:"warning",children:[(0,e.jsx)(Mt,{size:16,style:{flexShrink:0}}),(0,e.jsxs)("div",{children:[(0,e.jsx)("strong",{children:"Note:"})," Changing these settings will apply the new rate to future charges. Existing charges will remain unchanged."]})]})]}),(0,e.jsxs)($r,{children:[(0,e.jsx)(kr,{onClick:c,children:"Cancel"}),(0,e.jsx)(Sr,{onClick:T,disabled:j||A,children:j?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Rr,{size:18})," Saving..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Wt,{size:18})," Save Changes"]})})]})]})}):null},zr=a.div`
  background: white; border: 1px solid ${r.borderLight}; border-radius: 8px;
  padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky; top: 24px;
  @media (max-width: 900px) { position: static; }
`,Fr=a.div`
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
  border-bottom: 1px solid ${r.borderLight}; padding-bottom: 16px;
`,Lr=a.div`
  width: 60px; height: 60px; border-radius: 50%; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 24px; flex-shrink: 0;
  font-family: 'Merriweather', serif;
  background: ${t=>t.$female?r.brown:r.black};
`,Ar=a.div`
  font-family: 'Merriweather', serif; font-size: 18px; font-weight: 700; color: ${r.black};
`,Tr=a.div`font-size: 12px; color: ${r.gray}; margin-top: 4px;`,Er=a.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: ${r.borderLight}; border: 1px solid ${r.borderLight};
  border-radius: 8px; overflow: hidden; margin-bottom: 24px;
`,De=a.div`background: white; padding: 12px 8px; text-align: center;`,ze=a.div`
  font-size: 16px; font-weight: 700; color: ${t=>t.$color||r.black};
`,Fe=a.div`
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: ${r.gray}; margin-top: 4px;
`,ye=a.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px dashed ${r.borderLight}; font-size: 13px;
  color: ${r.mid};
  &:last-child { border-bottom: none; }
  strong { color: ${t=>t.$highlight?r.danger:r.black}; font-weight: 700; }
`,Pr=a.p`
  font-size: 11px; color: ${r.gray}; margin: 10px 0 0; line-height: 1.5;
`,Je=a.div`
  margin-bottom: 24px;
  h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${r.black}; margin-bottom: 12px; letter-spacing: 0.05em; }
`,ht=a.div`
  display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${r.borderLight};
  &:last-child { border-bottom: none; }
`,gt=a.div`
  width: 28px; height: 28px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 14px; font-weight: bold;
  background: ${t=>t.$warning?r.warningBg:r.infoBg};
  color: ${t=>t.$warning?r.warning:r.info};
`,xt=a.div`font-size: 12px; color: ${r.mid}; line-height: 1.4;`,mt=a.div`font-size: 10px; color: ${r.lightGray}; margin-top: 2px;`,je=a.div`
  display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;
`,ve=a.div`
  width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
  background: ${t=>t.$done?r.success:t.$active?r.warning:r.border};
`,$e=a.div`
  font-size: 13px; font-weight: 600; color: ${t=>t.$muted?r.gray:r.dark};
`,we=a.div`font-size: 11px; color: ${r.gray};`,qr=({deceased:t,postmortem:c,bodyStatus:s,totalCharges:w,balance:h,age:p})=>{const $=t?.full_name||t?.name||"Unknown",R=t?.sex||t?.gender||"",o=R.toLowerCase()==="female",d=Ht(t?.date_admitted||t?.admission_date||t?.created_at),v=parseFloat(t?.charges?.storage_rate)||500,k=Math.round(d*v);return(0,e.jsxs)(zr,{children:[(0,e.jsxs)(Fr,{children:[(0,e.jsx)(Lr,{$female:o,children:Gt($)}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Ar,{children:$}),(0,e.jsxs)(Tr,{children:[R?`${R}, `:"",p?`${p} Years`:""]})]})]}),(0,e.jsxs)(Er,{children:[(0,e.jsxs)(De,{children:[(0,e.jsx)(ze,{$color:r.warning,children:d}),(0,e.jsx)(Fe,{children:"Days in Morgue"})]}),(0,e.jsxs)(De,{children:[(0,e.jsx)(ze,{children:p||"—"}),(0,e.jsx)(Fe,{children:"Age"})]}),(0,e.jsxs)(De,{children:[(0,e.jsxs)(ze,{children:[w,"K"]}),(0,e.jsx)(Fe,{children:"Charges (KES)"})]}),(0,e.jsxs)(De,{children:[(0,e.jsxs)(ze,{$color:r.danger,children:[h,"K"]}),(0,e.jsx)(Fe,{children:"Balance (KES)"})]})]}),(0,e.jsxs)(Je,{children:[(0,e.jsx)("h3",{children:"Storage Charges"}),(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{children:"Days in morgue"}),(0,e.jsxs)("strong",{children:[d," day",d===1?"":"s"]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{children:"Daily storage rate"}),(0,e.jsxs)("strong",{children:["KES ",v.toLocaleString()]})]}),(0,e.jsxs)(ye,{$highlight:!0,children:[(0,e.jsx)("span",{children:"Storage charge so far"}),(0,e.jsxs)("strong",{children:["KES ",k.toLocaleString()]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{children:"Total charges (all services)"}),(0,e.jsxs)("strong",{children:[w,"K"]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)("span",{children:"Balance"}),(0,e.jsxs)("strong",{children:[h,"K"]})]}),(0,e.jsx)(Pr,{children:"Storage charge = days in morgue × daily rate (set under Charge Settings). Embalming and extra charges are listed under the Financials tab."})]}),(0,e.jsxs)(Je,{children:[(0,e.jsx)("h3",{children:"Notifications"}),d>7&&(0,e.jsxs)(ht,{children:[(0,e.jsx)(gt,{$warning:!0,children:"!"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(xt,{children:["Body has been in the morgue for ",d," days. Please contact next of kin."]}),(0,e.jsx)(mt,{children:"Active"})]})]}),(0,e.jsxs)(ht,{children:[(0,e.jsx)(gt,{$info:!0,children:"i"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(xt,{children:["Record status: ",s]}),(0,e.jsxs)(mt,{children:["Updated ",J(t?.updated_at)]})]})]})]}),(0,e.jsxs)(Je,{children:[(0,e.jsx)("h3",{children:"Mortuary Progress"}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ve,{$done:!0}),(0,e.jsxs)("div",{children:[(0,e.jsx)($e,{children:"Admitted to Morgue"}),(0,e.jsx)(we,{children:J(t?.created_at)})]})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ve,{$done:t?.embalmed,$active:!t?.embalmed}),(0,e.jsxs)("div",{children:[(0,e.jsxs)($e,{children:["Body ",t?.embalmed?"Embalmed":"Awaiting Embalming"]}),(0,e.jsx)(we,{children:t?.embalmed?J(t?.embalmed_date):"Pending"})]})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ve,{$done:c?.status==="completed",$active:c?.status==="pending"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)($e,{children:["Postmortem ",c?c.status==="completed"?"Completed":c.status==="pending"||c.status==="in_progress"?"In Progress":"Requested":"Not Requested"]}),(0,e.jsx)(we,{children:c?.status==="completed"?J(c.completed_at||c.updated_at):c?.status==="pending"||c?.status==="in_progress"?"Awaiting Results":c?J(c.requested_at||c.created_at):"—"})]})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ve,{$active:s==="In Morgue"||s==="Active"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)($e,{children:["In Storage (",s,")"]}),(0,e.jsx)(we,{children:"Currently Active"})]})]}),(0,e.jsxs)(je,{children:[(0,e.jsx)(ve,{}),(0,e.jsxs)("div",{children:[(0,e.jsx)($e,{$muted:!0,children:"Released to Family"}),(0,e.jsx)(we,{style:{color:r.lightGray},children:"Pending"})]})]})]})]})},Ve=a.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 3px;
  border-bottom: 2px solid ${r.black};
  color: ${r.black};
  width: fit-content;
  span { opacity: 0.45; font-size: 9px; }
  ${t=>t.$mt0&&"margin-top: 0;"}
`,Qe=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,K=a.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,G=a.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,H=a.div`
  font-size: 14px;
  font-weight: 600;
  color: ${r.black};
  word-break: break-word;
  line-height: 1.35;
  ${t=>t.$body&&"font-weight: 400; line-height: 1.6; font-size: 13px; color: #555;"}
`,ae=a.button`
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid ${r.border||"#e0e0e0"};
  background: white;
  color: ${r.dark||"#1a1a1a"};
  transition: 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;

  &:hover {
    background: ${r.bgField||"#f7f7f5"};
    border-color: ${r.gray||"#777777"};
  }

  ${t=>t.$primary&&`
    background: ${r.black};
    color: white;
    border-color: ${r.black};
    &:hover {
      background: #333;
      border-color: #333;
    }
  `}
`,Ir=a.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  ${t=>t.$status==="sent"&&"background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;"}
  ${t=>t.$status==="initiated"&&"background: #fef3c7; color: #92400e; border: 1px solid #fde68a;"}
  ${t=>t.$status==="cancelled"&&"background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; text-decoration: line-through;"}
`,ft=a.p`
  font-size: 12px;
  color: ${r.gray};
  margin: 0 0 12px;
`,Xe=a.div`
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`,Le=a.div`
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`,Ae=a.label`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,bt=a.input`
  height: 34px;
  width: 100%;
  border: 1px solid ${r.border||"#e0e0e0"};
  border-radius: 4px;
  padding: 0 10px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${r.dark||"#1a1a1a"};
  background: #ffffff;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${r.black};
  }
`,yt=a.textarea`
  width: 100%;
  border: 1px solid ${r.border||"#e0e0e0"};
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${r.dark||"#1a1a1a"};
  background: #ffffff;
  box-sizing: border-box;
  resize: vertical;
  min-height: 56px;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${r.black};
  }
`,Br=a.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`,Nr=a.div`
  background: #fff; border-radius: 8px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`,Ur=a.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${r.borderLight};
  font-size: 16px; font-weight: 700; color: ${r.black};
`,Mr=a.div` padding: 20px; `,Or=a.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${r.borderLight};
`,Wr=a.button`
  background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: ${r.gray};
  &:hover { color: ${r.black}; }
`,Kr=a.div`
  font-size: 12px; color: ${r.gray}; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 1px dashed ${r.borderLight};
  b { color: ${r.black}; }
`,Gr=a.p`
  font-size: 11px; color: ${r.gray}; margin: 2px 0 0; line-height: 1.5;
`,Te=({label:t,value:c,color:s})=>(0,e.jsxs)("span",{style:{display:"inline-flex",alignItems:"baseline",gap:5},children:[(0,e.jsx)("b",{style:{fontSize:14,color:s||r.black,fontWeight:700},children:c}),(0,e.jsx)("span",{style:{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#999",fontWeight:700},children:t})]}),Hr=({postmortem:t,deceasedId:c,deceasedName:s,deceasedAdmission:w,requests:h,onRequestsChanged:p})=>{const $=Pe(),{socket:R}=Kt(),o=t||{},d=fe(),[v,k]=(0,u.useState)([]),S=h&&h.length>0?h:v.length>0?v:h||v,[D,f]=(0,u.useState)(!1),[z,F]=(0,u.useState)(!1),[A,b]=(0,u.useState)(null),[j,E]=(0,u.useState)({reason:"",requested_by:"",requesting_authority:"",notes:""}),[X,Z]=(0,u.useState)(null),W=(0,u.useCallback)(()=>O.get(`${U.FULL_API_URL}/postmortem-requests/stats`,{headers:oe()}).then(n=>{n.data?.success&&Z(n.data.data||null)}).catch(()=>{}),[]);(0,u.useEffect)(()=>{W()},[W]);const V=(0,u.useCallback)(async()=>{if(c)try{const n=await O.get(`${U.FULL_API_URL}/postmortem-requests`,{headers:oe(),params:{deceased_id:c}});Array.isArray(n.data?.data)&&k(n.data.data)}catch{}},[c]);(0,u.useEffect)(()=>{V()},[V]);const te=()=>{let n="";try{const g=JSON.parse(localStorage.getItem("user")||"{}");n=[g.first_name,g.last_name].filter(Boolean).join(" ")||g.full_name||g.name||g.username||g.email||""}catch{}E(g=>({...g,requested_by:g.requested_by||n})),f(!0)},l=async()=>{try{p&&await p()}catch{}await Promise.all([V(),W()])},y=o.immediate_cause_of_death||o.manner_of_death||o.examination_summary||o.findings||o.toxicology_findings,C=()=>{$(`/tenant/${d}/postmortem-form/${c}`)},L=async()=>{try{const n=oe(),g=`${U.FULL_API_URL}/postmortem/${c}/pdf`,M=await fetch(g,{method:"GET",headers:{...n,Accept:"application/pdf"},credentials:"include"});if(!M.ok){const de=await M.json().catch(()=>({}));throw new Error(de.message||`Failed to generate PDF (${M.status})`)}const ne=await M.blob(),ie=URL.createObjectURL(ne);window.open(ie,"_blank"),setTimeout(()=>URL.revokeObjectURL(ie),6e4)}catch(n){console.error("PDF generation error:",n),alert(`Failed to generate PDF: ${n.message}`)}},T=async n=>{if(n.preventDefault(),!j.reason||!j.requested_by){re.error("Requested-by and reason are required");return}F(!0);try{const g=await O.post(`${U.FULL_API_URL}/postmortem-requests`,{deceased_id:c,...j},{headers:oe()});if(g.data?.success){const M={id:g.data?.data?.id||`pm-request-${Date.now()}`,title:"Postmortem Request Initiated",message:`Requested by ${j.requested_by} for ${s||"deceased"}`,fullContent:[`Deceased: ${s||"Unknown"}`,`Admission No: ${w||"N/A"}`,`Requested By: ${j.requested_by}`,j.requesting_authority&&`Authority: ${j.requesting_authority}`,`Reason: ${j.reason}`,j.notes&&`Notes: ${j.notes}`].filter(Boolean).join(`
`),timestamp:new Date().toISOString(),priority:"high",deceasedName:s,deceasedId:c,admissionNo:w,requestedBy:j.requested_by,reason:j.reason};R&&R.emit("postmortem-request-created",M),ke.success("Postmortem Request Initiated",[`Who: ${j.requested_by}`,`Deceased: ${s||"Unknown"}`,`Admission: ${w||"N/A"}`].join(" · "),{dur:6e3}),f(!1),E({reason:"",requested_by:"",requesting_authority:"",notes:""}),await l()}else throw new Error(g.data?.message||"Failed to initiate request")}catch(g){re.error(g.response?.data?.message||g.message||"Failed to initiate postmortem request")}finally{F(!1)}},m=async n=>{b(n);try{const g=await O.post(`${U.FULL_API_URL}/postmortem-requests/${n}/send`,{},{headers:oe()});if(g.data?.success)re.success("Marked as sent - postmortem is now pending"),await l();else throw new Error(g.data?.message||"Failed to send request")}catch(g){re.error(g.response?.data?.message||g.message||"Failed to send postmortem request")}finally{b(null)}},i=async n=>{b(n);try{const g=await O.put(`${U.FULL_API_URL}/postmortem-requests/${n}/status`,{status:"cancelled"},{headers:oe()});if(g.data?.success)re.success("Postmortem request cancelled"),await l();else throw new Error(g.data?.message||"Failed to cancel request")}catch(g){re.error(g.response?.data?.message||g.message||"Failed to cancel postmortem request")}finally{b(null)}};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8},children:[(0,e.jsxs)(Ve,{$mt0:!0,style:{marginBottom:0},children:[(0,e.jsx)("span",{children:"01"})," Postmortem Requests"]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[y&&(0,e.jsx)(ae,{onClick:C,children:"Edit Examination"}),(0,e.jsx)(ae,{onClick:C,children:y?"+ New Examination":"+ Fill Examination Form"}),(0,e.jsx)(ae,{$primary:!0,onClick:te,children:"+ Initiate Request"})]})]}),X&&(0,e.jsxs)("div",{style:{display:"flex",gap:22,flexWrap:"wrap",margin:"10px 0 14px"},children:[(0,e.jsx)(Te,{label:"Requested",value:X.initiated??0,color:"#d97706"}),(0,e.jsx)(Te,{label:"Sent",value:X.sent??0,color:"#2563eb"}),(0,e.jsx)(Te,{label:"Completed",value:X.official_completed??0,color:"#7c3aed"}),(0,e.jsx)(Te,{label:"Cancelled",value:X.cancelled??0,color:"#9ca3af"})]}),D&&(0,e.jsx)(Br,{onClick:()=>f(!1),children:(0,e.jsxs)(Nr,{onClick:n=>n.stopPropagation(),children:[(0,e.jsxs)(Ur,{children:[(0,e.jsx)("span",{children:"Initiate Postmortem Request"}),(0,e.jsx)(Wr,{onClick:()=>f(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:T,children:[(0,e.jsxs)(Mr,{children:[(0,e.jsxs)(Kr,{children:["Deceased record: ",(0,e.jsx)("b",{children:s||`#${c}`})]}),(0,e.jsxs)(Xe,{children:[(0,e.jsxs)(Le,{children:[(0,e.jsx)(Ae,{children:"Requested By *"}),(0,e.jsx)(bt,{value:j.requested_by,onChange:n=>E({...j,requested_by:n.target.value}),placeholder:"e.g. Jane Wambui (Family)",required:!0})]}),(0,e.jsxs)(Le,{children:[(0,e.jsx)(Ae,{children:"Requesting Authority"}),(0,e.jsx)(bt,{value:j.requesting_authority,onChange:n=>E({...j,requesting_authority:n.target.value}),placeholder:"e.g. Kenyatta National Hospital",list:"pm-request-authorities"}),(0,e.jsxs)("datalist",{id:"pm-request-authorities",children:[(0,e.jsx)("option",{value:"Kenya Police"}),(0,e.jsx)("option",{value:"Directorate of Criminal Investigations (DCI)"}),(0,e.jsx)("option",{value:"Court Order"}),(0,e.jsx)("option",{value:"Hospital / Referring Facility"}),(0,e.jsx)("option",{value:"Family Request"})]})]})]}),(0,e.jsx)(Xe,{children:(0,e.jsxs)(Le,{children:[(0,e.jsx)(Ae,{children:"Reason *"}),(0,e.jsx)(yt,{rows:3,value:j.reason,onChange:n=>E({...j,reason:n.target.value}),placeholder:"Why is the postmortem being requested? (e.g. unclear cause of death, legal requirement, family request)",required:!0})]})}),(0,e.jsx)(Xe,{children:(0,e.jsxs)(Le,{children:[(0,e.jsx)(Ae,{children:"Additional Notes"}),(0,e.jsx)(yt,{rows:2,value:j.notes,onChange:n=>E({...j,notes:n.target.value}),placeholder:"Optional notes — contact details, special instructions, deadlines..."})]})}),(0,e.jsx)(Gr,{children:'Initiating creates a tracked request (status: initiated), marks the body as "Postmortem Requested" and notifies the mortuary team. Use "Mark as Sent" once the request reaches the requesting authority.'})]}),(0,e.jsxs)(Or,{children:[(0,e.jsx)(ae,{type:"button",onClick:()=>f(!1),children:"Cancel"}),(0,e.jsx)(ae,{$primary:!0,type:"submit",disabled:z,children:z?"Initiating...":"Initiate Request"})]})]})]})}),S.length===0?(0,e.jsx)(ft,{children:"No postmortem requests tracked yet."}):(0,e.jsx)("div",{style:{marginBottom:24},children:S.map(n=>(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:`1px solid ${r.borderLight||"#eeeceb"}`,flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{flex:1,minWidth:220},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("span",{style:{fontWeight:700,fontSize:13,color:r.black},children:n.request_ref||n.requested_by}),(0,e.jsx)(Ir,{$status:n.status,children:n.status})]}),(0,e.jsxs)("div",{style:{fontSize:12,color:r.gray,marginTop:3,lineHeight:1.6},children:["Requested by ",(0,e.jsx)("b",{children:n.requested_by||"—"}),n.requesting_authority?(0,e.jsxs)(e.Fragment,{children:[" · Authority: ",n.requesting_authority]}):null,(0,e.jsx)("br",{}),"Reason: ",n.reason||"—"," · Initiated ",J(n.created_at),n.sent_at?` · Sent ${J(n.sent_at)}`:""]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[n.status==="initiated"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ae,{$primary:!0,onClick:()=>m(n.id),disabled:A===n.id,children:A===n.id?"Sending...":"Mark as Sent"}),(0,e.jsx)(ae,{onClick:()=>i(n.id),disabled:A===n.id,children:"Cancel"})]}),n.status==="sent"&&(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:"Awaiting examination"})]})]},n.id))}),y?(0,e.jsxs)("div",{style:{marginTop:16,border:`1px solid ${r.borderLight}`,borderRadius:8,padding:"18px 20px",background:r.bgSection},children:[(0,e.jsxs)(Ve,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Official Determination of Death"]}),(0,e.jsxs)(Qe,{children:[(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Immediate Cause of Death"}),(0,e.jsx)(H,{children:o.immediate_cause_of_death||"—"})]}),(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Underlying Cause of Death"}),(0,e.jsx)(H,{children:o.underlying_cause_of_death||"—"})]}),o.manner_of_death&&(0,e.jsxs)(K,{children:[(0,e.jsx)(G,{children:"Manner of Death"}),(0,e.jsx)(H,{children:o.manner_of_death})]}),o.contributing_conditions&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Contributing Conditions"}),(0,e.jsx)(H,{children:o.contributing_conditions})]})]}),(0,e.jsxs)(Ve,{children:[(0,e.jsx)("span",{children:"03"})," Assessment & Findings"]}),(0,e.jsxs)(Qe,{children:[(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Examination Summary"}),(0,e.jsx)(H,{$body:!0,children:o.examination_summary||"No statement provided."})]}),Array.isArray(o.findings)&&o.findings.length>0&&o.findings.map((n,g)=>(0,e.jsxs)(K,{children:[(0,e.jsx)(G,{children:n.title||n.organ_system||`Finding ${g+1}`}),(0,e.jsx)(H,{$body:!0,children:n.description||n.details||JSON.stringify(n)})]},g)),o.head_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Head / CNS Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.head_findings=="string"?o.head_findings:JSON.stringify(o.head_findings)})]}),o.chest_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Chest Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.chest_findings=="string"?o.chest_findings:JSON.stringify(o.chest_findings)})]}),o.abdomen_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Abdominal Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.abdomen_findings=="string"?o.abdomen_findings:JSON.stringify(o.abdomen_findings)})]}),o.extremities_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Extremities Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.extremities_findings=="string"?o.extremities_findings:JSON.stringify(o.extremities_findings)})]}),o.toxicology_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Toxicology / Lab Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.toxicology_findings=="string"?o.toxicology_findings:JSON.stringify(o.toxicology_findings)})]}),o.custom_findings&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Other Findings"}),(0,e.jsx)(H,{$body:!0,children:typeof o.custom_findings=="string"?o.custom_findings:JSON.stringify(o.custom_findings)})]})]}),(0,e.jsxs)(Qe,{children:[(0,e.jsxs)(K,{children:[(0,e.jsx)(G,{children:"Examining Pathologist"}),(0,e.jsx)(H,{children:o.pathologist_name||o.external_pathologist_name||"—"})]}),(0,e.jsxs)(K,{children:[(0,e.jsx)(G,{children:"Status"}),(0,e.jsx)(H,{children:o.status?String(o.status).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase()):"Completed"})]}),(0,e.jsxs)(K,{children:[(0,e.jsx)(G,{children:"Date Completed"}),(0,e.jsx)(H,{children:J(o.completed_at||o.updated_at)})]}),o.requesting_authority&&(0,e.jsxs)(K,{$full:!0,children:[(0,e.jsx)(G,{children:"Requesting Authority"}),(0,e.jsx)(H,{children:o.requesting_authority})]})]}),(0,e.jsx)("div",{style:{display:"flex",justifyContent:"flex-end",gap:12,marginTop:20,flexWrap:"wrap"},children:(0,e.jsx)(ae,{onClick:L,children:"Download PDF Report"})})]}):(0,e.jsx)(ft,{style:{marginTop:16},children:"No postmortem examination recorded yet.. Use «+ Fill Examination Form» to record the official assessment, or «+ Initiate Request» to track a pre-examination request."})]})},Yr=a.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${r.black};
  color: ${r.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${t=>t.$mt0&&"margin-top: 0;"}
  ${t=>t.$mt4&&"margin-top: 32px;"}
`;a.div`
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 2rem; 
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0; /* Clean separator */
  
  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
    gap: 1.5rem;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
`;a.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;a.span`
  font-size: 11px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${t=>t.$color||r.gray}; 
`;a.div`
  font-size: 1.75rem; /* Larger, cooler numbers */
  font-weight: 700; 
  color: ${t=>t.$color||r.black}; 
  word-break: break-word;
  line-height: 1.2;
`;var jt=a.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;
`,ue=a.div`
  flex: 1; 
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`,he=a.label`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,Ee=a.input`
  height: 40px; 
  width: 100%; 
  border: 1px solid ${r.border||"#e0e0e0"}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${r.dark||"#1a1a1a"}; 
  background: #ffffff; 
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: ${r.black}; 
  }
`,vt=a.select`
  height: 40px; 
  width: 100%; 
  border: 1px solid ${r.border||"#e0e0e0"}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${r.dark||"#1a1a1a"}; 
  background: #ffffff; 
  box-sizing: border-box;
  transition: border-color 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: ${r.black}; 
  }
`,Ze=a.button`
  padding: 10px 20px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${r.border||"#e0e0e0"}; 
  background: white; 
  color: ${r.dark||"#1a1a1a"};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${r.bgField||"#f7f7f5"}; 
    border-color: ${r.gray||"#777777"}; 
  }
  
  ${t=>t.$primary&&`
    background: ${r.black}; 
    color: white; 
    border-color: ${r.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
`,Jr=a.table`
  width: 100%; 
  border-collapse: collapse;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${r.gray}; 
    padding: 12px 8px; 
    border-bottom: 2px solid ${r.borderLight||"#e0e0e0"}; 
    white-space: nowrap; 
  }
  
  td { 
    padding: 12px 8px; 
    font-size: 13px; 
    border-bottom: 1px solid ${r.borderLight||"#e0e0e0"}; 
    vertical-align: middle; 
  }
  
  /* Make table take full width and align nicely */
  tbody tr:last-child td {
    border-bottom: none;
  }
`,Vr=a.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 4px 10px;
  border-radius: 4px; 
  font-size: 11px; 
  font-weight: 700;
  background: ${t=>t.$success?r.successBg:t.$warning?r.warningBg:t.$info?r.infoBg:r.bgField};
  color: ${t=>t.$success?r.success:t.$warning?r.warning:t.$info?r.info:r.gray};
  border: 1px solid ${t=>t.$success?"#a7f3d0":t.$warning?"#fde68a":t.$info?"#bfdbfe":r.borderLight};
`,Qr=a.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
`,Xr=a.div`
  background: #fff; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`,Zr=a.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${r.borderLight};
  font-size: 16px; font-weight: 700;
`,ea=a.div` padding: 20px; `,ta=a.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${r.borderLight};
`,ra=a.button`
  background: none; border: none; font-size: 24px; cursor: pointer; color: ${r.gray};
  &:hover { color: ${r.black}; }
`,aa=({charges:t,payments:c,deceasedId:s,onDataChanged:w})=>{const[h,p]=(0,u.useState)(c||[]),[$,R]=(0,u.useState)(t||[]),[o,d]=(0,u.useState)(!1),[v,k]=(0,u.useState)(!1),[S,D]=(0,u.useState)(null),[f,z]=(0,u.useState)(!1),[F,A]=(0,u.useState)({charge_type:"",amount:"",currency:"USD",description:"",service_date:Me()}),[b,j]=(0,u.useState)({date:Me(),currency:"USD",payment_method:"Cash",reference:"",amount:"",description:""});(0,u.useEffect)(()=>{R(t||[])},[t]);const E=l=>l==="KES"?"KES":"$",X=(l,y)=>`${E(y)} ${parseFloat(l||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,Z=["USD","KES"],W=(l,y,C)=>l.filter(L=>(L.currency||"USD")===y).reduce((L,T)=>L+(parseFloat(C(T)||0)||0),0);Z.map(l=>{const y=W($,l,L=>L.amount??L.charge_amount),C=W(h,l,L=>L.amount);return{currency:l,chargesTotal:y,paidTotal:C,balance:y-C}}).filter(l=>l.chargesTotal!==0||l.paidTotal!==0),(0,u.useEffect)(()=>{s&&V()},[s]);const V=async()=>{try{const l=fe(),y=me?me():localStorage.getItem("token")||localStorage.getItem("authToken")||"",C=await O.get(`${U.FULL_API_URL}/payments/${s}`,{headers:{"x-tenant-slug":l,Authorization:`Bearer ${y}`}});C.data?.success&&p(C.data.data||[])}catch(l){console.error("Error loading payments:",l)}},te=async l=>{if(l.preventDefault(),!b.amount||!b.reference){re.error("Please fill in all required fields");return}d(!0);try{const y=fe(),C=me?me():localStorage.getItem("token")||localStorage.getItem("authToken")||"",L=(()=>{try{const T=localStorage.getItem("user");if(T){const m=JSON.parse(T);return m.email||m.username||"Unknown"}}catch(T){console.error("Error getting user email:",T)}return"Unknown"})();(await O.post(`${U.FULL_API_URL}/payments`,{deceased_id:s,amount:parseFloat(b.amount),currency:b.currency||"USD",payment_method:b.payment_method,reference:b.reference,payment_date:b.date,description:b.description||null,recorded_by:L},{headers:{"x-tenant-slug":y,Authorization:`Bearer ${C}`}})).data?.success&&(re.success("Payment recorded successfully"),k(!1),j({date:Me(),currency:b.currency||"USD",payment_method:"Cash",reference:"",amount:"",description:""}),await V(),w&&w())}catch(y){console.error("Error recording payment:",y),re.error("Failed to record payment")}finally{d(!1)}};return(0,e.jsxs)(e.Fragment,{children:[v&&(0,e.jsx)(Qr,{onClick:()=>k(!1),children:(0,e.jsxs)(Xr,{onClick:l=>l.stopPropagation(),children:[(0,e.jsxs)(Zr,{children:[(0,e.jsx)("span",{children:"Record Payment"}),(0,e.jsx)(ra,{onClick:()=>k(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:te,children:[(0,e.jsxs)(ea,{children:[(0,e.jsxs)(jt,{children:[(0,e.jsxs)(ue,{children:[(0,e.jsx)(he,{children:"Date"}),(0,e.jsx)(Ee,{type:"date",value:b.date,onChange:l=>j({...b,date:l.target.value}),required:!0})]}),(0,e.jsxs)(ue,{children:[(0,e.jsx)(he,{children:"Currency"}),(0,e.jsxs)(vt,{value:b.currency,onChange:l=>j({...b,currency:l.target.value}),children:[(0,e.jsx)("option",{value:"USD",children:"USD ($)"}),(0,e.jsx)("option",{value:"KES",children:"KES"})]})]}),(0,e.jsxs)(ue,{children:[(0,e.jsx)(he,{children:"Payment Method"}),(0,e.jsxs)(vt,{value:b.payment_method,onChange:l=>j({...b,payment_method:l.target.value}),children:[(0,e.jsx)("option",{children:"Cash"}),(0,e.jsx)("option",{children:"M-Pesa"}),(0,e.jsx)("option",{children:"Card"}),(0,e.jsx)("option",{children:"Bank Transfer"})]})]})]}),(0,e.jsxs)(jt,{children:[(0,e.jsxs)(ue,{children:[(0,e.jsx)(he,{children:"Reference Number"}),(0,e.jsx)(Ee,{placeholder:"e.g. QXR89YU72",value:b.reference,onChange:l=>j({...b,reference:l.target.value}),required:!0})]}),(0,e.jsxs)(ue,{children:[(0,e.jsxs)(he,{children:["Amount (",b.currency==="KES"?"KES":"USD",")"]}),(0,e.jsx)(Ee,{type:"number",placeholder:"0.00",value:b.amount,onChange:l=>j({...b,amount:l.target.value}),required:!0})]}),(0,e.jsxs)(ue,{style:{flex:2,minWidth:"200px"},children:[(0,e.jsx)(he,{children:"Description / Notes (Optional)"}),(0,e.jsx)(Ee,{placeholder:"e.g. Facility fee, Coffin, Embalming, etc.",value:b.description,onChange:l=>j({...b,description:l.target.value})})]})]})]}),(0,e.jsxs)(ta,{children:[(0,e.jsx)(Ze,{type:"button",onClick:()=>k(!1),children:"Cancel"}),(0,e.jsx)(Ze,{$primary:!0,type:"submit",disabled:o,children:o?"Recording...":"Save Payment"})]})]})]})}),(0,e.jsxs)(Yr,{$mt4:!0,style:{justifyContent:"space-between",width:"100%"},children:[(0,e.jsxs)("span",{children:[(0,e.jsx)("span",{style:{opacity:.5,fontSize:"10px"},children:"02"})," Payment History"]}),(0,e.jsx)(Ze,{$primary:!0,onClick:()=>k(!0),style:{padding:"4px 12px",fontSize:"11px"},children:"+ Record Payment"})]}),(0,e.jsxs)(Jr,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Method"}),(0,e.jsx)("th",{children:"Reference"}),(0,e.jsx)("th",{children:"Description"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Recorded By"})]})}),(0,e.jsx)("tbody",{children:h.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No payments recorded"})}):h.map((l,y)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:J(l.created_at||l.payment_date)}),(0,e.jsx)("td",{children:(0,e.jsx)(Vr,{$info:l.payment_method==="M-Pesa",$warning:l.payment_method==="Cash",children:l.payment_method||"—"})}),(0,e.jsx)("td",{children:l.reference||"—"}),(0,e.jsx)("td",{children:l.description||l.notes||"—"}),(0,e.jsx)("td",{children:(0,e.jsx)("strong",{children:X(l.amount,l.currency)})}),(0,e.jsx)("td",{children:l.recorded_by||"—"})]},y))})]})]})};a.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  /* Default style: Half underline */
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${r.black};
  color: ${r.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${t=>t.$mt0&&"margin-top: 0;"}

  /* Primary style: Solid black background bar */
  ${t=>t.$primary&&`
    background: ${r.black};
    color: white;
    padding: 8px 16px;
    border-radius: 2px;
    border-bottom: none;
    width: 100%;
  `}
`;var $t=a.button`
  padding: 8px 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${r.border||"#e0e0e0"}; 
  background: white; 
  color: ${r.dark||"#1a1a1a"};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${r.bgField||"#f7f7f5"}; 
    border-color: ${r.gray||"#777777"}; 
  }
  
  ${t=>t.$primary&&`
    background: ${r.black}; 
    color: white; 
    border-color: ${r.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
  
  ${t=>t.$sm&&"padding: 6px 12px; font-size: 12px;"}
`,na=a.table`
  width: 100%; 
  border-collapse: collapse;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${r.gray}; 
    padding: 12px 8px; 
    border-bottom: 2px solid ${r.borderLight||"#e0e0e0"}; 
    white-space: nowrap; 
  }
  
  td { 
    padding: 12px 8px; 
    font-size: 13px; 
    border-bottom: 1px solid ${r.borderLight||"#e0e0e0"}; 
    vertical-align: middle; 
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
`,ia=a.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 4px 10px;
  border-radius: 4px; 
  font-size: 11px; 
  font-weight: 700;
  background: ${t=>t.$info?r.infoBg:r.bgField};
  color: ${t=>t.$info?r.info:r.gray};
  border: 1px solid ${t=>t.$info?"#bfdbfe":r.borderLight};
`,sa=({documents:t,deceasedId:c})=>{const[s,w]=(0,u.useState)(!1),[h,p]=(0,u.useState)(!1),[$,R]=(0,u.useState)(null),o=(0,u.useRef)(null);(0,u.useEffect)(()=>{if(!c)return;let S=!1;return(async()=>{try{const D=await be.get(`/documents/${c}`,{headers:getTenantHeaders(),withCredentials:!1});if(!S){const f=D.data?.files||D.data?.data||[];R(Array.isArray(f)?f:[])}}catch{}})(),()=>{S=!0}},[c]);const d=$??(Array.isArray(t)?t:[]),v=async S=>{const D=S.target.files?.[0];if(!D||!c){ke.error("Upload failed","Missing file or deceased ID");return}p(!0);try{const f=new FormData;f.append("document",D);const z={"x-tenant-slug":localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||""};try{const A=localStorage.getItem("accessToken")||localStorage.getItem("authToken");A&&(z.Authorization=`Bearer ${A}`);const b=localStorage.getItem("tenantSlug");b&&(z["x-tenant-slug"]=b)}catch{}const F=await be.post(`/documents/${c}/upload`,f,{headers:z,withCredentials:!1});F.data?.success||F.data?.document?(ke.success("Document uploaded",F.data?.message||"Document uploaded successfully"),window.location.reload()):ke.error("Upload failed",F.data?.message||"Failed to upload document")}catch(f){console.error("Error uploading document:",f);const z=f.response?.status,F=f.response?.data?.message;let A="Upload failed",b="Failed to upload document. Please try again later.";z===400?b=F||"Invalid file type. Only PDFs, images, and Word documents are allowed.":z===413?b="File is too large (max 50MB).":z===404?b="Deceased record not found.":F&&(b=F),ke.error(A,b)}finally{p(!1)}},k=()=>{o.current&&o.current.click()};return(0,e.jsxs)(e.Fragment,{children:[s&&(0,e.jsx)(Dt,{onClose:()=>w(!1)}),(0,e.jsxs)("div",{style:{display:"flex",gap:"12px",marginBottom:"32px",flexWrap:"wrap"},children:[(0,e.jsx)("input",{ref:o,type:"file",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png",onChange:v,disabled:h,style:{display:"none"}}),(0,e.jsx)($t,{$primary:!0,onClick:k,disabled:h,style:{cursor:"pointer"},children:h?"Uploading...":"+ Upload Document"})]}),(0,e.jsxs)(na,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Document Name"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Uploaded Date"}),(0,e.jsx)("th",{style:{textAlign:"right"},children:"Actions"})]})}),(0,e.jsx)("tbody",{children:d.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:4,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No documents uploaded"})}):d.map((S,D)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:600},children:S.name||S.file_name}),(0,e.jsx)("td",{children:(0,e.jsx)(ia,{$info:!0,children:S.type||"Document"})}),(0,e.jsx)("td",{children:J(S.created_at)}),(0,e.jsx)("td",{style:{textAlign:"right"},children:(0,e.jsx)($t,{$sm:!0,onClick:()=>{const f=S?.url||(S?.stored_name?`/uploads/${localStorage.getItem("tenantSlug")||""}/documents/${c}/${S.stored_name}`:null);f&&window.open(`${U.UPLOADS_URL}${f.startsWith("/")?"":"/"}${f}`,"_blank","noopener")},children:"View"})})]},D))})]})]})},wt=a.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 3px;
  border-bottom: 2px solid ${r.black};
  color: ${r.black};
  width: fit-content;
  span { opacity: 0.45; font-size: 9px; }
  ${t=>t.$mt0&&"margin-top: 0;"}
`,_t=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,P=a.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,q=a.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,I=a.div`
  font-size: 14px;
  font-weight: 600;
  color: ${r.black};
  word-break: break-word;
  line-height: 1.35;
  ${t=>t.$mono&&"font-family: ui-monospace, monospace; font-size: 13px;"}
`,oa=({path:t})=>{const[c,s]=(0,u.useState)(!1),h=(p=>{if(!p)return null;if(p.startsWith("data:image"))return p;if(p.startsWith("http"))return Yt(p);if(p.startsWith("/"))return`${U.UPLOADS_URL}${p}`;const $=p.replace(/^\/+/,"");return`${U.UPLOADS_URL}/${$}`})(t);return t?c?(0,e.jsx)("a",{href:h,target:"_blank",rel:"noreferrer",style:{fontSize:12,color:"#1a73e8"},children:"Click to view signature ↗"}):(0,e.jsx)("img",{src:h,alt:"Next of Kin Signature",onError:()=>s(!0),style:{maxWidth:"100%",maxHeight:120,marginTop:6,background:"#fff",border:"1px solid #E3DDD0",borderRadius:6,padding:6,objectFit:"contain"}}):null},da=({deceased:t,nextOfKin:c})=>{const s=t||{},w=c||{},h=s.signature||w.signature,p=s.full_name||s.name||"Unknown";return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(P,{$full:!0,style:{marginBottom:"20px"},children:[(0,e.jsx)(q,{style:{fontSize:11,opacity:.55},children:"Deceased Name"}),(0,e.jsx)(I,{style:{color:"#2563eb",fontSize:24,fontWeight:700,fontFamily:"Merriweather",marginBottom:8},children:p})]}),(0,e.jsxs)(wt,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," Admission"]}),(0,e.jsxs)(_t,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Admission Number"}),(0,e.jsx)(I,{$mono:!0,children:s.admission_number||s.admission_no||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Date Admitted"}),(0,e.jsx)(I,{children:J(s.date_admitted||s.created_at)})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Time Received"}),(0,e.jsx)(I,{$mono:!0,children:s.time_received||s.admission_time||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Receiving Officer"}),(0,e.jsx)(I,{children:s.receiving_officer||s.admitted_by||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Body Status"}),(0,e.jsx)(I,{children:s.body_status||s.body_condition||"In Morgue"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Received From"}),(0,e.jsx)(I,{children:s.received_from||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Date of Death"}),(0,e.jsx)(I,{children:J(s.date_of_death)})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Place of Death"}),(0,e.jsx)(I,{children:s.place_of_death||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Physician"}),(0,e.jsx)(I,{children:s.physician||s.attending_physician||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Permit Number"}),(0,e.jsx)(I,{$mono:!0,children:s.permit_number||"—"})]}),(0,e.jsxs)(P,{$full:!0,children:[(0,e.jsx)(q,{children:"Cause of Death"}),(0,e.jsx)(I,{children:s.cause_of_death||"—"})]})]}),(0,e.jsxs)(wt,{children:[(0,e.jsx)("span",{children:"03"})," Next of Kin"]}),(0,e.jsxs)(_t,{children:[(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"NOK Name"}),(0,e.jsx)(I,{children:w.full_name||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Relationship"}),(0,e.jsx)(I,{children:w.relationship||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"National ID"}),(0,e.jsx)(I,{$mono:!0,children:w.id_number||s.national_id||s.id_number||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Telephone"}),(0,e.jsx)(I,{children:w.contact||"—"})]}),(0,e.jsxs)(P,{children:[(0,e.jsx)(q,{children:"Alt. Phone"}),(0,e.jsx)(I,{children:w.alternative_phone||"—"})]}),(0,e.jsxs)(P,{$full:!0,children:[(0,e.jsx)(q,{children:"Signature"}),h?(0,e.jsx)(oa,{path:h}):(0,e.jsx)(I,{style:{color:"#999"},children:"—"})]})]})]})},la=a.div`
  background: ${r.black}; color: white; padding: 8px 16px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: 24px; border-radius: 2px;
  display: flex; align-items: center; gap: 8px;
  span { opacity: 0.5; font-size: 10px; }
  ${t=>t.$mt0&&"margin-top: 0;"}
`,ca=a.table`
  width: 100%; border-collapse: collapse;
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: ${r.gray}; padding: 8px 12px; border-bottom: 2px solid ${r.borderLight}; white-space: nowrap; }
  td { padding: 12px; font-size: 13px; border-bottom: 1px solid ${r.borderLight}; vertical-align: middle; }
`,pa=({deceased:t,postmortem:c,charges:s,payments:w,releaseData:h,requests:p})=>{const $=t||{},R=[{action:"Record Created (Admission Intake)",user:$.receiving_officer||$.admitted_by||"System",role:"Receiving Officer",timestamp:$.created_at||$.admission_time},...$.embalmed?[{action:"Body Embalmed",user:$.embalmed_by||$.admitted_by||"System",role:"Mortician",timestamp:$.embalmed_date||$.updated_at}]:[],...c?.status==="completed"?[{action:"Postmortem Results Saved",user:c.pathologist_name||"Unknown",role:"Pathologist",timestamp:c.completed_at||c.updated_at}]:[],...c?.status==="pending"?[{action:"Postmortem Requested",user:c.requested_by||"System",role:"Requesting Authority",timestamp:c.requested_at||c.created_at}]:[],...Array.isArray(s)&&s.length>0?s.map(d=>({action:`Charge Added: ${d.description||d.charge_name||"Service Charge"} ($${parseFloat(d.amount||d.charge_amount||0).toFixed(2)})`,user:d.created_by||d.added_by||$.admitted_by||"System",role:"Billing Officer",timestamp:d.created_at||d.updated_at})):[],...Array.isArray(w)&&w.length>0?w.map(d=>({action:`Payment Recorded: $${parseFloat(d.amount||0).toFixed(2)} (${d.payment_method||d.method||"N/A"})`,user:d.received_by||d.processed_by||$.admitted_by||"System",role:"Cashier",timestamp:d.payment_date||d.created_at})):[],...h?[{action:`Body Released to: ${h.released_to||h.receiver_name||"Unknown"}`,user:h.released_by||h.staff_name||h.authorized_by||"System",role:"Authorized Officer",timestamp:h.released_at||h.created_at}]:[],...$.body_status&&$.body_status!=="admitted"?[{action:`Body Status Changed: ${$.body_status}`,user:$.updated_by||$.admitted_by||"System",role:"Mortuary Attendant",timestamp:$.updated_at||$.date_admitted||$.created_at}]:[],...Array.isArray(p)?p.map(d=>{const v=d.status==="cancelled"?d.cancelled_at||d.updated_at||d.created_at:d.status==="sent"?d.sent_at||d.updated_at||d.created_at:d.created_at||d.updated_at;return{action:`${d.status==="sent"?"Postmortem Request Sent to Authority":d.status==="cancelled"?"Postmortem Request Cancelled":"Postmortem Request Initiated"}${d.request_ref?` (${d.request_ref})`:""}`,user:d.initiated_by||d.requested_by||"System",role:"Requesting Party",timestamp:v}}):[]].filter(Boolean),o=d=>{if(!d)return 0;const v=String(d).includes("T")?d:String(d).replace(" ","T"),k=Date.parse(v);return Number.isNaN(k)?0:k};return R.sort((d,v)=>o(v.timestamp)-o(d.timestamp)),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(la,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," System Audit Trail"]}),(0,e.jsx)("div",{style:{overflowX:"auto",border:`1px solid ${r.borderLight}`,borderRadius:6},children:(0,e.jsxs)(ca,{style:{marginTop:0},children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Action Performed"}),(0,e.jsx)("th",{children:"User"}),(0,e.jsx)("th",{children:"Timestamp"})]})}),(0,e.jsx)("tbody",{children:R.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:3,style:{textAlign:"center",color:r.gray,padding:20},children:"No audit records found"})}):R.map((d,v)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:500},children:d.action}),(0,e.jsxs)("td",{children:[(0,e.jsx)("strong",{children:d.user}),(0,e.jsx)("br",{}),(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:d.role})]}),(0,e.jsx)("td",{style:{color:r.gray,fontSize:12,whiteSpace:"nowrap"},children:J(d.timestamp)})]},v))})]})})]})},_e=a.div`
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 16px; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  /* Default style: Half underline */
  width: fit-content;
  padding-bottom: 4px;
  border-bottom: 2px solid ${r.black};
  color: ${r.black};
  
  span { 
    opacity: 0.5; 
    font-size: 10px; 
  }
  
  ${t=>t.$mt0&&"margin-top: 0;"}

  /* Primary style: Solid black background bar */
  ${t=>t.$primary&&`
    background: ${r.black};
    color: white;
    padding: 8px 16px;
    border-radius: 2px;
    border-bottom: none;
    width: 100%;
  `}
`,Se=a.div`
  display: grid; 
  grid-template-columns: ${t=>t.$cols?"repeat(2, 1fr)":"repeat(auto-fit, minmax(200px, 1fr))"}; 
  gap: 1.5rem 2rem; 
  margin-bottom: 24px;
`,ua=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 24px;
`,et=a.div`
  min-width: 0;
`,B=a.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,N=a.span`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,Y=a.div`
  font-size: 15px; 
  font-weight: 600; 
  color: ${r.black}; 
  word-break: break-word;
  line-height: 1.4;
  
  ${t=>t.$muted&&`color: ${r.gray}; font-weight: 500;`}
`,ha=a.button`
  padding: 8px 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${r.border||"#e0e0e0"}; 
  background: white; 
  color: ${r.dark||"#1a1a1a"};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  
  &:hover { 
    background: ${r.bgField||"#f7f7f5"}; 
    border-color: ${r.gray||"#777777"}; 
  }
  
  ${t=>t.$primary&&`
    background: ${r.black}; 
    color: white; 
    border-color: ${r.black};
    &:hover { 
      background: #333; 
      border-color: #333;
    }
  `}
  
  ${t=>t.$danger&&`
    background: ${r.danger||"#ef4444"}; 
    color: white; 
    border-color: ${r.danger||"#ef4444"};
    &:hover { 
      background: #b91c1c; 
      border-color: #b91c1c;
    }
  `}
`;a.div`
  display: flex; 
  align-items: center; 
  gap: 10px; 
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    
    &.success {
      background: ${r.successBg||"#d1fae5"};
      color: ${r.success||"#10b981"};
    }
    
    &.pending {
      background: ${r.bgField||"#f7f7f5"};
      color: ${r.gray||"#777777"};
      border: 1px solid ${r.borderLight||"#e0e0e0"};
    }
  }
  
  span {
    font-size: 14px;
    color: ${r.black};
    
    &.muted {
      color: ${r.gray};
    }
  }
`;var ga=({deceased:t,nextOfKin:c,deceasedId:s})=>{const w=Pe(),h=t||{},[p,$]=(0,u.useState)(h?.releaseData||null),[R,o]=(0,u.useState)(!1),d=()=>{let v=localStorage.getItem("tenantSlug")||"";if(!v||v==="dashboard"||v==="default"){const k=localStorage.getItem("user"),S=k?JSON.parse(k):{};v=S?.parentTenantSlug||S?.tenantSlug||v}w(`/tenant/${v}/release-form/${s}`,{state:{deceasedData:t}})};return(0,u.useEffect)(()=>{(async()=>{if(s&&!h?.releaseData){o(!0);try{const k=h.admission_number||h.admission_no||s,S={...oe()};try{const f=await be.get(`/body-release/by-admission/${encodeURIComponent(k)}`,{headers:S});if(f.data?.success&&f.data?.data){$(f.data.data);return}}catch{}const D=await be.get("/body-release/checkout",{headers:S});if(D.data?.success&&Array.isArray(D.data?.data)){const f=j=>String(j||"").trim().toLowerCase(),z=f(k),F=f(s),A=new Set([h.full_name,h.name_of_deceased,h.name,h.fullname].filter(Boolean).map(f)),b=D.data.data.find(j=>z&&(f(j.admission_number)===z||f(j.admission_number)===F)||A.has(f(j.name_of_deceased)));b&&$(b)}}catch(k){console.error("Error fetching release data:",k)}finally{o(!1)}}})()},[s,h.full_name,h.name_of_deceased,h.admission_number,h.admission_no,h.releaseData]),(0,e.jsxs)(e.Fragment,{children:[p?(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.successBg||"#ecfdf5",border:`1px solid ${r.success||"#059669"}44`},children:[(0,e.jsx)("i",{className:"fas fa-check-circle",style:{color:r.success||"#059669",fontSize:18}}),(0,e.jsxs)("div",{style:{flex:1,minWidth:200},children:[(0,e.jsxs)("div",{style:{fontWeight:700,color:r.success||"#059669",fontSize:14},children:["BODY RELEASED",p.release_id?` — ${p.release_id}`:""]}),(0,e.jsx)("div",{style:{fontSize:12,color:r.gray},children:p.created_at?`Released on ${J(p.created_at)}`:""})]})]}):(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.bgField||"#f7f7f5",border:`1px solid ${r.borderLight||"#e0e0e0"}`},children:[(0,e.jsx)("i",{className:"fas fa-clock",style:{color:r.gray,fontSize:16}}),(0,e.jsx)("div",{style:{flex:1,minWidth:200,fontSize:13,color:r.gray},children:"No body release has been recorded for this deceased yet."}),(0,e.jsxs)(ha,{$primary:!0,onClick:d,children:[(0,e.jsx)("i",{className:"fas fa-door-open",style:{fontSize:12}})," Start Release"]})]}),(0,e.jsxs)(ua,{children:[(0,e.jsxs)(et,{children:[(0,e.jsxs)(_e,{$mt0:!0,$primary:!0,children:[(0,e.jsx)("span",{children:"01"})," Release Details"]}),(0,e.jsxs)(Se,{$cols:!0,children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Release ID"}),(0,e.jsx)(Y,{children:p?.release_id||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Deceased"}),(0,e.jsx)(Y,{children:p?.name_of_deceased||h.full_name||h.name_of_deceased||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Scheduled Release Date"}),(0,e.jsx)(Y,{children:p?.date_of_removal?J(p.date_of_removal):"Not scheduled"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Scheduled Release Time"}),(0,e.jsx)(Y,{children:p?.time_of_removal||"—"})]})]})]}),(0,e.jsxs)(et,{children:[(0,e.jsxs)(_e,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Receiver / Next of Kin"]}),(0,e.jsxs)(Se,{$cols:!0,children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Authorized By (NOK)"}),(0,e.jsx)(Y,{children:p?.next_kin||c?.full_name||c?.name||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Relationship to Deceased"}),(0,e.jsx)(Y,{children:p?.relationship||c?.relationship||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Receiver ID Number"}),(0,e.jsx)(Y,{children:p?.id_number||c?.id_number||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Receiver Phone"}),(0,e.jsx)(Y,{children:p?.tell_number||c?.contact||"—"})]})]})]})]}),(0,e.jsxs)(_e,{$mt0:!0,children:[(0,e.jsx)("span",{children:"03"})," Transport & Release Officer"]}),(0,e.jsxs)(Se,{children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Permit Number"}),(0,e.jsx)(Y,{children:p?.permit_number||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Mode of Transport"}),(0,e.jsx)(Y,{children:p?.mode_of_transport||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Released By (Staff)"}),(0,e.jsx)(Y,{children:p?.staff_name||p?.received_by||p?.released_by||"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Recorded On"}),(0,e.jsx)(Y,{children:p?.created_at?J(p.created_at):"—"})]})]}),(0,e.jsxs)(_e,{$mt0:!0,children:[(0,e.jsx)("span",{children:"04"})," Verification & Handover Notes"]}),(0,e.jsxs)(Se,{children:[(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Payments Cleared"}),(0,e.jsx)(Y,{children:p?p.everything_paid?"Yes — everything paid":"Not marked as fully paid":"—"})]}),(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Terms Accepted"}),(0,e.jsx)(Y,{children:p?p.terms_accepted?"Yes":"No":"—"})]}),(0,e.jsxs)(B,{$full:!0,children:[(0,e.jsx)(N,{children:"Items Returned with Body"}),(0,e.jsx)(Y,{$muted:!0,children:p?.items_returned||"None recorded"})]}),(0,e.jsxs)(B,{$full:!0,children:[(0,e.jsx)(N,{children:"Notes"}),(0,e.jsx)(Y,{$muted:!0,children:p?.notes||"No notes recorded"})]})]}),(p?.signature||p?.staff_signature)&&(0,e.jsxs)(et,{style:{marginBottom:24},children:[(0,e.jsxs)(_e,{$mt0:!0,children:[(0,e.jsx)("span",{children:"05"})," Authorizing Signatures"]}),(0,e.jsxs)(Se,{$cols:!0,children:[p?.signature&&(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Next of Kin Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(p.signature)?p.signature:`${U.API_GATEWAY_URL}${p.signature.startsWith("/")?"":"/"}${p.signature}`,alt:"Next of Kin Signature",style:{maxHeight:170,maxWidth:460,width:"100%",objectFit:"contain",background:"white",border:`1px solid ${r.borderLight}`,borderRadius:6,padding:8},onError:v=>{v.currentTarget.style.display="none"}})]}),p?.staff_signature&&(0,e.jsxs)(B,{children:[(0,e.jsx)(N,{children:"Staff Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(p.staff_signature)?p.staff_signature:`${U.API_GATEWAY_URL}${p.staff_signature.startsWith("/")?"":"/"}${p.staff_signature}`,alt:"Staff Signature",style:{maxHeight:170,maxWidth:460,width:"100%",objectFit:"contain",background:"white",border:`1px solid ${r.borderLight}`,borderRadius:6,padding:8},onError:v=>{v.currentTarget.style.display="none"}})]})]})]})]})},ge=`${U.FULL_API_URL}/deceased`,St=Et`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`,Ft=qe`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`,kt=a.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a; 
  font-size: 14px; 
  line-height: 1.5;
  max-width: 1400px; 
  margin: 0 auto; 
 
  background: rgb(255, 255, 255);
  animation: ${Ft} 0.25s ease-out;
`,xa=a.div`
  display: grid; 
  grid-template-columns: 1fr 320px; 
  gap: 4rem; 
  align-items: flex-start;
  @media (max-width: 900px) { 
    grid-template-columns: 1fr; 
    gap: 2rem;
  }
`,ma=a.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
   padding: 3rem 2rem;
`,fa=a.div`
  display: flex; 
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 2.5rem;
  overflow-x: auto;
`,ba=a.button`
  padding: 1rem 0; 
  margin-right: 2.5rem;
  background: none; 
  border: none; 
  cursor: pointer;
  font-size: 0.875rem; 
  font-weight: 600; 
  color: #888888;
  border-bottom: 2px solid transparent; 
  margin-bottom: -2px;
  white-space: nowrap;
  transition: all 0.15s ease; 
  font-family: 'Source Sans 3', sans-serif;
  display: flex;
  align-items: center;
  
  &:hover { color: #1a1a1a; }
  ${t=>t.$active&&`
    color: #0a0a0a; 
    border-bottom-color: #0a0a0a; 
  `}
`,ya=a.div`
  display: grid;
  gap: 2.5rem;
`,xe=a.div`
  display: ${t=>t.$active?"grid":"none"}; 
  gap: 2.5rem;
  animation: ${Ft} 0.2s ease;
`,ja=a.div`
  text-align: center; 
  padding: 10rem 0; 
  color: #777777;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 1rem;
  
  .spinner {
    width: 24px; 
    height: 24px; 
    border: 2px solid #e0e0e0;
    border-top-color: #0a0a0a; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;a.button`
  background: #0a0a0a;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
  width: fit-content;
  
  &:hover {
    background: #333;
  }
`;var va=[{key:"overview",label:"Overview"},{key:"postmortem",label:"Postmortem"},{key:"financials",label:"Financials"},{key:"release",label:"Release"},{key:"docs",label:"Documents"},{key:"audit",label:"Audit Log"}],qa=()=>{const[t]=Rt(),c=Ct();let s=t.get("id")||c.id;typeof s=="string"&&s.includes("=")&&(s=s.split("=")[0].trim());const w=Pe(),[h,p]=(0,u.useState)("overview"),[$,R]=(0,u.useState)(!0),[o,d]=(0,u.useState)(null),[v,k]=(0,u.useState)(null),[S,D]=(0,u.useState)(null),[f,z]=(0,u.useState)([]),[F,A]=(0,u.useState)([]),[b,j]=(0,u.useState)([]),[E,X]=(0,u.useState)(!1);(0,u.useEffect)(()=>{const l="noindex, nofollow, noarchive";let y=document.querySelector('meta[name="robots"]');const C=y?y.getAttribute("content"):null;return y?y.setAttribute("content",l):(y=document.createElement("meta"),y.name="robots",y.content=l,document.head.appendChild(y)),()=>{C!==null?y.setAttribute("content",C):y.remove()}},[]);const Z=(0,u.useCallback)(async()=>{if(s){R(!0);try{const l=fe(),y=me?me():localStorage.getItem("token")||"",C={"x-tenant-slug":l,Authorization:`Bearer ${y}`};let L=s;const T=await O.get(`${ge}/${s}`,{headers:C});if(T.data?.data){const m=T.data.data;L=m.admission_number||m.admission_no||s;const i={...m,admission_no:m.admission_number,admission_time:m.time_received,admitted_by:m.receiving_officer,time_of_death:null,attending_physician:m.physician,embalmed:m.admission_status==="embalmed",embalmed_date:null,storage_location:m.chamber_assigned,morgue_slot:m.chamber_assigned,body_condition:m.body_status,tel_number:m.phone_number,tell_no:m.phone_number};d(i)}try{const m=await O.get(`${ge}/postmortem/${s}`,{headers:C});m.data?.data&&k(m.data.data)}catch{}try{const m=await O.get(`${ge}/${s}/next-of-kin`,{headers:C}),i=Array.isArray(m.data?.data)?m.data.data:m.data?.data?[m.data.data]:[];if(i.length>0)D(i[0]);else{const n=T.data?.data;n&&(n.contact_person||n.phone_number||n.relationship||n.national_id)&&D({full_name:n.contact_person||"",relationship:n.relationship||"",contact:n.tel_number||n.phone_number||"",alternative_contact:n.alternative_phone||"",id_number:n.national_id||"",email:n.email||"",is_primary:1,_synthetic:!0})}}catch{const i=T.data?.data;i&&(i.contact_person||i.phone_number||i.relationship||i.national_id)&&D({full_name:i.contact_person||"",relationship:i.relationship||"",contact:i.tel_number||i.phone_number||"",alternative_contact:i.alternative_phone||"",id_number:i.national_id||"",email:i.email||"",is_primary:1,_synthetic:!0})}try{const m=fe(),i=await O.get(`${U.FULL_API_URL}/documents/${s}`,{headers:{"x-tenant-slug":m,Authorization:y?`Bearer ${y}`:""},withCredentials:!1});if(i.data?.files){const n=i.data.files.map(g=>({name:g.originalName,file_name:g.storedName||g.originalName,type:g.category||"Document",created_at:g.uploadedAt||g.uploaded_at,document_id:g.documentId,url:g.url}));d(g=>g&&{...g,documents:n})}else i.data?.data&&d(n=>n&&{...n,documents:i.data.data})}catch(m){console.warn("[DeceasedDetail] Documents service unavailable, showing empty list:",m.message),d(i=>i&&{...i,documents:[]})}try{const m=await O.get(`${ge}/billing-summary/${s}`,{headers:C});if(m.data?.data){const i=m.data.data;i.charges&&A(Array.isArray(i.charges)?i.charges:[i.charges]),i.payments&&z(Array.isArray(i.payments)?i.payments:[])}}catch{try{const i=await O.get(`${ge}/charges/${s}`,{headers:C});i.data?.data&&A(Array.isArray(i.data.data)?i.data.data:[i.data.data])}catch{}}try{const m=await O.get(`${ge}/charge-settings/${s}`,{headers:C});if(m.data?.data){const i=m.data.data;d(n=>n&&{...n,charges:{storage_rate:parseFloat(i.dailyRate??i.daily_rate??i.storage_rate??i.per_day??n?.charges?.storage_rate??500),per_day:parseFloat(i.dailyRate??i.daily_rate??n?.charges?.per_day??500),per_hour:parseFloat(i.hourlyRate??i.hourly_rate??n?.charges?.per_hour??125),currency:i.currency??n?.charges?.currency??"KES",rate_profile:i.rateProfile??i.rate_profile??"standard",charge_type:i.chargeType??i.charge_type??"daily",usd_rate:parseFloat(i.usdRate??i.usd_rate??n?.charges?.usd_rate??130),updated_at:i.updatedAt??i.updated_at??null}})}}catch{}try{const m=await O.get(`${U.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(L)}`,{headers:C});if(m.data?.data)d(i=>i&&{...i,releaseData:m.data.data});else throw new Error("no release data by admission")}catch{try{const i=await O.get(`${U.FULL_API_URL}/body-release/checkout`,{headers:C}),n=Array.isArray(i.data?.data)?i.data.data:[];if(n.length>0){const g=x=>String(x||"").trim().toLowerCase(),M=g(L),ne=g(s),ie=new Set([T.data?.data?.full_name,T.data?.data?.name,T.data?.data?.name_of_deceased].filter(Boolean).map(g)),de=n.find(x=>M&&g(x.admission_number)===M||ne&&g(x.admission_number)===ne||ie.has(g(x.name_of_deceased)));de&&d(x=>x&&{...x,releaseData:de})}}catch{}}try{const m=await O.get(`${U.FULL_API_URL}/postmortem-requests`,{headers:C,params:{deceased_id:s}});Array.isArray(m.data?.data)&&j(m.data.data)}catch{}}catch(l){console.error("Error fetching deceased detail:",l),re.error("Failed to load deceased details")}finally{R(!1)}}},[s]);(0,u.useEffect)(()=>{Z()},[Z]);const W=l=>p(l),V=F.reduce((l,y)=>l+parseFloat(y.amount||y.charge_amount||0),0),te=V-f.reduce((l,y)=>l+parseFloat(y.amount||0),0);return $?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(St,{}),(0,e.jsx)(kt,{children:(0,e.jsxs)(ja,{children:[(0,e.jsx)("div",{className:"spinner"})," Loading deceased details..."]})})]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(St,{}),(0,e.jsxs)(kt,{children:[(0,e.jsx)(qt,{position:"top-right"}),(0,e.jsx)(xr,{deceased:o,onBack:()=>{const l=fe();w(`/tenant/${l}/all-deceased`)},onTabSwitch:W,onChargeSettingsClick:()=>X(!0),onRefresh:Z}),(0,e.jsxs)(xa,{children:[(0,e.jsxs)(ma,{children:[(0,e.jsx)(fa,{children:va.map(l=>(0,e.jsx)(ba,{$active:h===l.key,onClick:()=>W(l.key),children:l.label},l.key))}),(0,e.jsxs)(ya,{children:[(0,e.jsx)(xe,{$active:h==="overview",children:(0,e.jsx)(da,{deceased:o,nextOfKin:S})}),(0,e.jsx)(xe,{$active:h==="postmortem",children:(0,e.jsx)(Hr,{postmortem:v,deceasedId:s,deceasedName:o?.full_name||o?.name||"",deceasedAdmission:o?.admission_number||o?.admission_no||"",requests:b,onRequestsChanged:Z})}),(0,e.jsx)(xe,{$active:h==="financials",children:(0,e.jsx)(aa,{charges:F,payments:f,deceasedId:s})}),(0,e.jsx)(xe,{$active:h==="release",children:(0,e.jsx)(ga,{deceased:o,nextOfKin:S,deceasedId:s})}),(0,e.jsx)(xe,{$active:h==="docs",children:(0,e.jsx)(sa,{documents:o?.documents,deceasedId:s})}),(0,e.jsx)(xe,{$active:h==="audit",children:(0,e.jsx)(pa,{deceased:o,postmortem:v,charges:F,payments:f,releaseData:o?.releaseData||null,requests:b})})]})]}),(0,e.jsx)(qr,{deceased:o,postmortem:v,bodyStatus:o?.body_status||o?.status||"In Morgue",totalCharges:V,balance:te,age:o?.age})]}),E&&(0,e.jsx)(Dr,{isOpen:E,onClose:()=>X(!1),deceasedId:s,deceasedData:o,onUpdate:Z})]})]})};export{qa as default};
