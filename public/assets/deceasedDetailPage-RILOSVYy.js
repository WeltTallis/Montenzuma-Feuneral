import{r as Jt}from"./chunk-CXHxssQy.js";import{y as Yt}from"./chunk-CXAmgOhv.js";import{i as Nt,l as Oe,u as Ut}from"./chunk-DWc5g_hH.js";import{_ as a,h as qt,m as he}from"./chunk-DJYPtS2Y.js";import{a as Ke,i as Vt,o as Xt}from"./chunk-CwzAxjA3.js";import{o as Zt}from"./chunk-BY9AVXEY.js";import{t as ie}from"./chunk-eZ3__Fgx.js";import{c as we,n as $e}from"./chunk-C935kdjU.js";import{t as X}from"./chunk-BUeZRQuQ.js";import{Ft as ot,I as We,K as Qt,Mn as He,R as lt,Un as Mt,d as dt,f as pe,h as ct,i as ge,in as it,j as er,t as tr,tn as Ge,ut as rr}from"./index-Cp7mIUwY.js";import{a as Je}from"./chunk-N6-xod2j.js";import{t as le}from"./chunk-D61LeRbQ.js";import{r as ar,t as nr}from"./chunk-B-oXcbbw.js";import{i as ir,n as ne,r as sr,t as r}from"./chunk-B9F-LUG6.js";import{t as ue}from"./chunk-CizeQYCt.js";import{t as or}from"./chunk-BbgS9YMk2.js";var p=Jt(Yt(),1),e=Zt(),pt="leaflet-css-cdn";if(!document.getElementById(pt)){const t=document.createElement("link");t.id=pt,t.rel="stylesheet",t.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",document.head.appendChild(t)}var lr=he`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Ye=[{id:"lee",name:"Lee Funeral Home, Nairobi",lat:-1.2954,lng:36.8078},{id:"chiromo",name:"Chiromo Funeral Parlour",lat:-1.2758,lng:36.8066},{id:"ku",name:"K.U. Funeral Home, Kiambu",lat:-1.1824,lng:36.9272},{id:"umash-nrb",name:"Umash Funeral Home, Nairobi",lat:-1.2921,lng:36.8041},{id:"umash-nkr",name:"Umash Funeral Home, Nakuru",lat:-.2833,lng:36.0667},{id:"jocham",name:"Jocham Mortuary, Mombasa",lat:-4.0416,lng:39.6706},{id:"eldoret",name:"Moi Teaching Mortuary, Eldoret",lat:.5204,lng:35.2863}],dr=[{name:"Nakuru",lat:-.3031,lng:36.08},{name:"Eldoret",lat:.5143,lng:35.2698},{name:"Kisumu",lat:-.0917,lng:34.768},{name:"Nyeri",lat:-.4226,lng:36.9389}],cr=a.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;
`,pr=a.div`
  width: 100%; max-width: 1200px; height: 90vh; max-height: 850px; background: #121212;
  border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1); font-family: system-ui, sans-serif; color: #ffffff;
`,ur=a.div`
  display: flex; justify-content: space-between; align-items: center; padding: 16px 24px;
  background: #0d1b22; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`,xr=a.div`
  display: flex; flex: 1; min-height: 0;
  @media (max-width: 850px) { flex-direction: column; }
`,gr=a.div`
  flex: 1.4; position: relative; background: #050505;
  @media (max-width: 850px) { height: 350px; flex: none; }
`,hr=a.div`
  width: 480px; display: flex; flex-direction: column; background: #0d0d0d;
  border-left: 1px solid rgba(255, 255, 255, 0.08); overflow-y: auto;
  @media (max-width: 850px) { width: 100%; flex: 1; }
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`,Ve=a.div` padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); `,xe=a.label`
  font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888;
  display: block; margin-bottom: 6px;
  span { color: #4fc3f7; font-weight: normal; text-transform: none; margin-left: 6px; }
`,ut=a.div` display: flex; gap: 8px; margin-bottom: 12px; `,fe=a.input`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
  &:focus { outline: none; border-color: #4fc3f7; }
`,mr=a.select`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
`,Te=a.button`
  height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; border: none; white-space: nowrap; transition: 0.15s;
  background: ${t=>t.$variant==="success"?"#10b981":t.$variant==="whatsapp"?"#25D366":t.$variant==="outline"?"transparent":"#4fc3f7"};
  color: ${t=>t.$variant==="outline"?"#4fc3f7":t.$variant==="whatsapp"||t.$variant==="success"?"#fff":"#000"};
  border: ${t=>t.$variant==="outline"?"1px solid #4fc3f7":"none"};
  &:hover { opacity: 0.9; }
  &:disabled { background: #333; color: #666; cursor: not-allowed; }
`,fr=a.div`
  display: flex; background: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12);
`,xt=a.button`
  flex: 1; height: 38px; border: none; font-size: 13px; font-weight: 600; cursor: pointer;
  background: ${t=>t.$active?"#4fc3f7":"transparent"};
  color: ${t=>t.$active?"#000":"#888"}; transition: 0.2s;
`,br=a.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
`,gt=a.div`
  background: #161616; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; text-align: center;
  div:first-child { font-size: 18px; font-weight: 700; color: #4fc3f7; }
  div:last-child { font-size: 10px; text-transform: uppercase; color: #888; margin-top: 4px; }
`,yr=a.div`
  background: #161616; border: 1px solid rgba(79, 195, 247, 0.3); border-radius: 10px; padding: 16px;
  animation: ${lr} 0.3s ease; margin-top: 8px;
`,Le=a.div`
  display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;
  color: ${t=>t.$bold?"#fff":"#aaa"}; font-weight: ${t=>t.$bold?"700":"400"};
  border-bottom: ${t=>t.$divider?"1px dashed rgba(255,255,255,0.1)":"none"};
  margin-bottom: ${t=>t.$divider?"8px":"0"};
`,jr=a.div`
  display: flex; align-items: center; gap: 8px; background: rgba(79, 195, 247, 0.1);
  padding: 8px; border-radius: 8px; border: 1px dashed #4fc3f7; margin-bottom: 12px;
  Input { height: 32px; width: 80px; text-align: center; font-weight: bold; font-size: 15px; color: #4fc3f7; border-color: #4fc3f7; background: #1a1a1a; }
`;function Ot({onClose:t}){const[s,i]=(0,p.useState)(Ye[0]),[f,c]=(0,p.useState)(""),[n,b]=(0,p.useState)(""),[S,o]=(0,p.useState)(null),[d,y]=(0,p.useState)("round"),[k,I]=(0,p.useState)(1),[j,v]=(0,p.useState)(5e3),[_,P]=(0,p.useState)(100),[B,$]=(0,p.useState)(3e3),[g,q]=(0,p.useState)(0),[T,F]=(0,p.useState)(0),[z,A]=(0,p.useState)(!1),M=(0,p.useRef)(null),x=(0,p.useRef)(null),E=(0,p.useRef)(null),N=(0,p.useRef)(null);(0,p.useEffect)(()=>{if(!M.current)return;(async()=>{if(window.L||await new Promise(W=>{const Q=document.createElement("script");Q.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",Q.onload=W,document.body.appendChild(Q)}),!x.current&&window.L){const W=window.L,Q=W.map(M.current).setView([s.lat,s.lng],10);W.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(Q),N.current=W.layerGroup().addTo(Q),x.current=Q,C(s)}})()},[]);const C=h=>{!x.current||!window.L||(N.current.clearLayers(),E.current&&x.current.removeLayer(E.current),window.L.marker([h.lat,h.lng]).addTo(N.current).bindPopup(`<b>${h.name}</b><br/>Origin`).openPopup(),x.current.setView([h.lat,h.lng],12),o(null),q(0))},w=h=>{const W=Ye.find(Q=>Q.id===h.target.value);i(W),C(W)},R=async(h,W,Q)=>{A(!0),b(Q),o({lat:h,lng:W});try{const de=await(await fetch(`https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${W},${h}?overview=full&geometries=geojson`)).json();if(de.routes&&de.routes[0]){const me=de.routes[0];if(q(Number((me.distance/1e3).toFixed(1))),F(Math.round(me.duration/60)),x.current&&window.L){const u=window.L,U=x.current;E.current&&U.removeLayer(E.current),N.current.clearLayers(),u.marker([s.lat,s.lng]).addTo(N.current),u.marker([h,W]).addTo(N.current).bindPopup(`<b>${Q}</b>`).openPopup();const Gt=me.geometry.coordinates.map(st=>[st[1],st[0]]);E.current=u.polyline(Gt,{color:"#4fc3f7",weight:5,opacity:.8}).addTo(U),U.fitBounds(E.current.getBounds(),{padding:[40,40]})}}}catch{alert("Routing failed.")}finally{A(!1)}},O=async()=>{if(f.trim()){A(!0);try{const h=await(await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(f+", Kenya")}&countrycodes=ke&limit=1`)).json();h&&h.length>0?R(parseFloat(h[0].lat),parseFloat(h[0].lon),h[0].display_name.split(",")[0]):alert("Location not found.")}catch{alert("Search failed.")}finally{A(!1)}}},l=g*(d==="round"?2:1),D=l*_,K=Math.max(0,k-1),se=K*B,Z=j+D+se,oe=()=>{if(!S)return;const h=`https://www.google.com/maps/search/?api=1&query=${S.lat},${S.lng}`,W=`🚗 *HEARSE DISPATCH ORDER*

*From:* ${s.name}
*To:* ${n}

*Trip Details:*
• Type: ${d==="round"?"Round Trip (To & From)":"One-Way Dropoff"}
• Duration: ${k} Day(s)
• One-Way Distance: ${g} km
• Billable Distance: ${l} km

📍 *Navigate via Google Maps:*
${h}`;window.open(`https://wa.me/?text=${encodeURIComponent(W)}`,"_blank")};return(0,e.jsx)(cr,{onClick:h=>h.target===h.currentTarget&&t?.(),children:(0,e.jsxs)(pr,{children:[(0,e.jsxs)(ur,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{style:{margin:0,fontSize:18},children:"Pro Dispatch & Logistics"}),(0,e.jsx)("p",{style:{margin:"2px 0 0",fontSize:12,color:"#4fc3f7"},children:"One-Way View & Editable Mileage"})]}),(0,e.jsx)(Te,{$variant:"outline",onClick:t,style:{width:32,height:32,padding:0,borderRadius:"50%"},children:"✕"})]}),(0,e.jsxs)(xr,{children:[(0,e.jsx)(gr,{children:(0,e.jsx)("div",{ref:M,style:{width:"100%",height:"100%",zIndex:1}})}),(0,e.jsxs)(hr,{children:[(0,e.jsxs)(Ve,{children:[(0,e.jsx)(xe,{children:"1. Origin (Funeral Home)"}),(0,e.jsx)(mr,{value:s.id,onChange:w,style:{width:"100%",marginBottom:12},children:Ye.map(h=>(0,e.jsx)("option",{value:h.id,children:h.name},h.id))}),(0,e.jsx)(xe,{children:"2. Destination Search"}),(0,e.jsxs)(ut,{children:[(0,e.jsx)(fe,{placeholder:"e.g. Nakuru, Eldoret...",value:f,onChange:h=>c(h.target.value),onKeyDown:h=>h.key==="Enter"&&O()}),(0,e.jsx)(Te,{onClick:O,disabled:z,children:z?"...":"Find"})]}),(0,e.jsx)("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:dr.map(h=>(0,e.jsx)("button",{onClick:()=>{c(h.name),R(h.lat,h.lng,h.name)},style:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",padding:"4px 10px",borderRadius:12,fontSize:11,cursor:"pointer"},children:h.name},h.name))})]}),(0,e.jsxs)(Ve,{children:[(0,e.jsx)(xe,{children:"3. Trip Parameters"}),(0,e.jsxs)(ut,{children:[(0,e.jsxs)(fr,{style:{flex:1},children:[(0,e.jsx)(xt,{$active:d==="one-way",onClick:()=>y("one-way"),children:"One-Way Dropoff"}),(0,e.jsx)(xt,{$active:d==="round",onClick:()=>y("round"),children:"Round Trip"})]}),(0,e.jsx)(fe,{type:"number",min:"1",value:k,onChange:h=>I(parseInt(h.target.value)||1),style:{width:70,flex:"none"},title:"Days"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,marginTop:12},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(xe,{children:"Base (KES)"}),(0,e.jsx)(fe,{type:"number",value:j,onChange:h=>v(Number(h.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(xe,{children:"Rate/KM"}),(0,e.jsx)(fe,{type:"number",value:_,onChange:h=>P(Number(h.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(xe,{children:"Per Night"}),(0,e.jsx)(fe,{type:"number",value:B,onChange:h=>$(Number(h.target.value))})]})]})]}),(0,e.jsxs)(Ve,{style:{flex:1,border:"none",background:"#0a0a0a"},children:[!S&&!z&&(0,e.jsx)("div",{style:{color:"#666",textAlign:"center",marginTop:20},children:"Search a destination to display distances."}),z&&(0,e.jsx)("div",{style:{color:"#4fc3f7",textAlign:"center",marginTop:20},children:"Plotting route..."}),S&&!z&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(br,{children:[(0,e.jsxs)(gt,{children:[(0,e.jsxs)("div",{children:[T," Mins"]}),(0,e.jsx)("div",{children:"Duration (One-Way)"})]}),(0,e.jsxs)(gt,{children:[(0,e.jsx)("div",{children:d==="round"?`${l} km`:`${g} km`}),(0,e.jsx)("div",{children:"Total Billable KM"})]})]}),(0,e.jsxs)(jr,{children:[(0,e.jsx)("div",{style:{flex:1},children:(0,e.jsxs)(xe,{style:{margin:0,color:"#fff"},children:["One-Way Distance (KM) ",(0,e.jsx)("span",{children:"(Editable)"})]})}),(0,e.jsx)(fe,{type:"number",value:g,onChange:h=>q(Number(h.target.value))})]}),(0,e.jsxs)(yr,{children:[(0,e.jsxs)("div",{style:{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12},children:["📍 Invoice: ",n]}),(0,e.jsxs)(Le,{children:[(0,e.jsx)("span",{children:"Base Dispatch Fee"}),(0,e.jsxs)("span",{children:["KES ",j.toLocaleString()]})]}),(0,e.jsxs)(Le,{children:[(0,e.jsxs)("span",{children:["Mileage (",l," km × KES ",_,")"]}),(0,e.jsxs)("span",{children:["KES ",D.toLocaleString()]})]}),K>0&&(0,e.jsxs)(Le,{children:[(0,e.jsxs)("span",{children:["Overnight Allowance (",K," nights)"]}),(0,e.jsxs)("span",{children:["KES ",se.toLocaleString()]})]}),(0,e.jsxs)(Le,{$bold:!0,$divider:!0,style:{marginTop:12},children:[(0,e.jsx)("span",{children:"Total Invoice"}),(0,e.jsxs)("span",{style:{fontSize:18,color:"#10b981"},children:["KES ",Z.toLocaleString()]})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:12,marginTop:16},children:[(0,e.jsx)(Te,{$variant:"whatsapp",style:{flex:1},onClick:oe,children:"WA to Driver"}),(0,e.jsx)(Te,{$variant:"success",style:{flex:1},onClick:()=>alert(`Confirmed. Total: KES ${Z.toLocaleString()}`),children:"Confirm Booking"})]})]})]})]})]})]})})}var vr=a.button`
  font-size: 13px; font-weight: 600; color: #d93025; cursor: pointer;
  background: none; border: none; display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px; padding: 14; font-family: 'Source Sans 3', sans-serif;
  &:hover { color: #b91c1c; }
`,$r=a.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  padding-left: 12px;
  h2 { font-family: 'Merriweather', serif; font-size: 26px; font-weight: 900; color: ${r.black}; margin: 0 0 4px; }
  p { color: ${r.dark}; font-size: 14px; font-weight: 700; margin: 0; }
`,wr=a.div`
  display: flex; gap: 12px; flex-wrap: wrap;
`,Xe=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid ${r.border}; background: white; color: ${r.dark};
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: ${r.bgField}; border-color: ${r.gray}; }
  ${t=>t.$primary&&`background: ${r.black}; color: white; border-color: ${r.black};
    &:hover { background: ${r.dark}; }`}
  ${t=>t.$danger&&`background: ${r.danger}; color: white; border-color: ${r.danger};
    &:hover { background: #b91c1c; }`}
`,Sr=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #0c2530; background: #0c2530; color: #ffffff;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #0d2d3a; border-color: #0d2d3a; }
`,kr=a.button`
  padding: 10px 16px; border-radius: 4px; font-weight: 600; font-size: 13px;
  cursor: pointer; border: 1px solid #d97706; background: #d97706; color: #000000;
  transition: 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  &:hover { background: #d97706; border-color: #d97706; }
`,_r=a.div`
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: transparent; border: none; padding: 0; box-shadow: none;
`,ht=a.span`
  font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; color: ${r.black};
`,Cr=({value:t})=>{const s=p.useRef(null);return p.useEffect(()=>{if(s.current)try{Vt.toCanvas(s.current,{bcid:"code128",text:t||"AWAITING-ID",scale:2,height:8,includetext:!1,paddingwidth:0,paddingheight:0})}catch(i){console.error("Barcode generation error:",i)}},[t]),(0,e.jsx)("canvas",{ref:s,style:{display:"block",width:"auto",height:"40px"}})},Rr=({deceased:t,onBack:s,onTabSwitch:i,onChargeSettingsClick:f,onRefresh:c,onScanClick:n})=>{const b=Oe(),[S]=Nt(),o=Ut(),d=S.get("id")||o.id,[y,k]=(0,p.useState)(!1),I=t?.deceased_id||t?.id,j=t?.admission_number||t?.admission_no||"—",v=()=>{let _=localStorage.getItem("tenantSlug")||"";if(!_||_==="dashboard"||_==="default"){const P=localStorage.getItem("user"),B=P?JSON.parse(P):{};_=B?.parentTenantSlug||B?.tenantSlug||_}b(`/tenant/${_}/release-form/${d||I}`,{state:{deceasedData:t}})};return(0,e.jsxs)(e.Fragment,{children:[y&&(0,e.jsx)(Ot,{onClose:()=>k(!1)}),(0,e.jsx)(vr,{onClick:s,children:"← Back to List"}),(0,e.jsxs)($r,{children:[(0,e.jsx)("div",{style:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:4},children:[(0,e.jsx)(_r,{title:"Admission barcode",children:(0,e.jsx)(Cr,{value:j!=="—"?j:"AWAITING-ID"})}),(0,e.jsx)(ht,{style:{fontWeight:700,fontSize:11},children:I}),(0,e.jsx)(ht,{style:{fontWeight:400,fontSize:10,opacity:.7},children:j!=="—"?j:"AWAITING-ID"})]})}),(0,e.jsxs)(wr,{children:[(0,e.jsxs)(kr,{onClick:c,children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Refresh"]}),(0,e.jsxs)(Sr,{onClick:()=>k(!0),children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Route Calculations"]}),(0,e.jsxs)(Xe,{onClick:n,title:"Scan a paper document and upload it straight to this profile's documents",children:[(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 64 64",fill:"none",stroke:"currentColor",strokeWidth:"5",children:(0,e.jsx)("path",{d:"M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z",transform:"translate(1,0)"})}),"Scan Docs"]}),f&&(0,e.jsx)(Xe,{$primary:!0,onClick:f,children:"⚙️ Charge Settings"}),(0,e.jsx)(Xe,{$danger:!0,onClick:v,children:"Release Body"})]})]})]})};X.API_URL;var Dr=qt`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@300;400;500;600&display=swap');
`,m={ink:"#16211E",pine:"#1F3D33",moss:"#3E6257",gold:"#C6A15B",goldSoft:"#F3EBD9",cream:"#F6F4EE",paper:"#FFFFFF",line:"#E6E1D5",lineSoft:"#EFECE3",muted:"#8B8677",text:"#232A27",textLight:"#C4BFAF",ease:"cubic-bezier(.32, .72, .24, 1)"};he`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;var Fr=a.div`
  position: fixed;
  inset: 0;
  background: rgba(22, 33, 30, .45);
  backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity .35s ${m.ease}, visibility .35s;
  z-index: 90;

  &.show {
    opacity: 1;
    visibility: visible;
  }
`,zr=a.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 100vw);
  background: ${m.paper};
  box-shadow: -24px 0 60px -18px rgba(22, 33, 30, .35);
  border-radius: 16px 0 0 16px;
  transform: translateX(calc(100% + 40px));
  transition: transform .45s ${m.ease};
  z-index: 100;
  display: flex;
  flex-direction: column;

  &.open {
    transform: translateX(0);
  }

  @media (max-width: 480px) {
    border-radius: 0;
  }
`,Tr=a.header`
  padding: 18px 22px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`,Lr=a.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${m.line};
  background: ${m.paper};
  color: ${m.muted};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all .25s;

  &:hover {
    border-color: ${m.pine};
    color: ${m.pine};
  }
`,Ar=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  scrollbar-width: thin;
  scrollbar-color: ${m.line} transparent;
`;a.footer`
  padding: 13px 22px 16px;
  border-top: 1px solid ${m.lineSoft};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${m.paper};
`;var Er=a.div`
  font-size: 9.5px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: ${m.gold};
  font-weight: 600;
  margin-bottom: 3px;
`,Pr=a.h2`
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 600;
  color: ${m.ink};
`,Ae=a.div`
  margin-bottom: 18px;
`,Ee=a.div`
  font-size: 9.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: ${m.muted};
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${m.lineSoft};
  }
`,Br=a.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${m.cream};
  padding: 3px;
`,Ir=a.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: ${m.pine};
  border-radius: 8px;
  transition: transform .3s ${m.ease};
  transform: ${t=>t.$isHourly?"translateX(100%)":"translateX(0)"};
`,mt=a.button`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 6px;
  border: none;
  background: none;
  cursor: pointer;
  font: 600 12.5px 'Outfit', sans-serif;
  color: ${t=>t.$active?"#F3EFE4":m.muted};
  transition: color .25s;

`,Nr=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`,ft=a.label`
  position: relative;
  padding: 11px 12px;
  cursor: pointer;
  transition: all .2s ${m.ease};
  background: ${t=>t.$selected?`linear-gradient(150deg, #fff 55%, ${m.goldSoft})`:m.paper};

  &:hover {
    border-color: ${m.moss};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`,bt=a.span`
  font-family: 'Fraunces', serif;
  font-size: 14.5px;
  font-weight: 600;
  color: ${m.ink};
  display: block;
`,yt=a.span`
  font-size: 10.5px;
  color: ${m.muted};
  display: block;
  margin-top: 1px;
`,jt=a.span`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${m.pine};
  color: ${m.gold};
  display: grid;
  place-items: center;
  opacity: ${t=>t.$selected?1:0};
  transform: ${t=>t.$selected?"scale(1)":"scale(.5)"};
  transition: all .2s ${m.ease};
`,vt=a.div`
  display: flex;
  align-items: center;
  background: ${m.cream};
  border: 1px solid ${m.line};
  border-radius: 10px;
  transition: all .2s;

  &:focus-within {
    border-color: ${m.pine};
    background: ${m.paper};
    box-shadow: 0 0 0 3px rgba(31, 61, 51, .06);
  }
`,$t=a.span`
  padding: 10px 3px 10px 13px;
  font: 600 12.5px 'Outfit', sans-serif;
  color: ${m.muted};
  flex-shrink: 0;
`,wt=a.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font: 500 14.5px 'Outfit', sans-serif;
  color: ${m.ink};
  padding: 10px 4px;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: ${m.textLight};
    font-weight: 300;
  }
`,St=a.span`
  padding: 10px 13px 10px 3px;
  font-size: 11.5px;
  color: ${m.muted};
  flex-shrink: 0;
`,kt=a.p`
  font-size: 11px;
  color: ${m.muted};
  margin-top: 6px;
  padding-left: 2px;
  font-weight: 300;
`,Ur=a.div`
  background: ${m.pine};
  border-radius: 12px;
  padding: 16px 18px;
  color: #EDEAE0;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -50px;
    bottom: -50px;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    border: 1px solid rgba(198, 161, 91, .28);
  }
`,qr=a.div`
  font-size: 9.5px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: ${m.gold};
  font-weight: 600;
  margin-bottom: 7px;
`,Mr=a.div`
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;

  small {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: rgba(237, 234, 224, .6);
    font-weight: 400;
  }
`,Or=a.div`
  font-size: 11.5px;
  color: rgba(237, 234, 224, .55);
  font-weight: 300;
  margin: 3px 0 12px;
`,Kr=a.div`
  border-top: 1px solid rgba(237, 234, 224, .14);
`,Ze=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(237, 234, 224, .14);
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: rgba(237, 234, 224, .6);
    font-weight: 300;
  }

  span:last-child {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`,Wr=a.footer`
  padding: 13px 22px 16px;
  border-top: 1px solid ${m.lineSoft};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${m.paper};
`,Kt=a.button`
  flex: 1;
  padding: 10px 10px;
  border-radius: 10px;
  font: 600 13px 'Outfit', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all .2s ${m.ease};
`,Hr=a(Kt)`
  background: none;
  border: 1px solid ${m.line};
  color: ${m.muted};

  &:hover {
    border-color: ${m.pine};
    color: ${m.pine};
  }
`,Gr=a(Kt)`
  background: ${m.ink};
  color: #F3EFE4;
  border: none;

  &:hover:not(:disabled) {
    background: #24332e;
  }

  &:disabled {
    opacity: .55;
    cursor: wait;
  }

  svg {
    color: ${m.gold};
  }
`,Jr=a.div`
  animation: spin .9s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,Yr=a.div`
  display: flex;
  align-items: center;
  gap: 11px;
  border-bottom: 1px solid ${m.lineSoft};
  padding-bottom: 16px;
  margin-bottom: 18px;
`,Vr=a.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${m.pine};
  color: ${m.gold};
  display: grid;
  place-items: center;
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`,Xr=a.div`
  font-weight: 600;
  font-size: 13.5px;
  color: ${m.ink};
`,Zr=a.div`
  font-size: 11.5px;
  color: ${m.muted};
`,Qr=({isOpen:t,onClose:s,deceasedId:i,deceasedData:f,onUpdate:c})=>{const[n,b]=(0,p.useState)({rateProfile:"standard",currency:"KES",chargeType:"daily",dailyRate:"",hourlyRate:"",usdRate:""}),[S,o]=(0,p.useState)(!1),[d,y]=(0,p.useState)(!1);(0,p.useEffect)(()=>{if(!t||!i)return;(async()=>{y(!0);try{const F=await ge.get(dt.DECEASED.CHARGE_SETTINGS(i));if(F.data?.success){const z=F.data.data;b({rateProfile:z.rateProfile||"standard",currency:z.currency||"KES",chargeType:z.chargeType||"daily",dailyRate:z.dailyRate||"",hourlyRate:z.hourlyRate||"",usdRate:z.usdRate||"130"})}}catch(F){console.error("Error fetching charge settings:",F),Ke.error(F.response?.data?.message||"Failed to load charge settings")}finally{y(!1)}})()},[t,i]);const k=T=>{const{name:F,value:z}=T.target;if(F==="dailyRate"||F==="hourlyRate"||F==="usdRate"){let A=z.replace(/[^\d]/g,"").replace(/^0+/,"");A=A===""?"":parseInt(A,10),b(M=>({...M,[F]:A}))}else b(A=>({...A,[F]:z}))},I=T=>{b(F=>({...F,chargeType:T}))},j=T=>{b(F=>({...F,currency:T}))},v=async T=>{if(T.preventDefault(),!!i){o(!0);try{const F=n.dailyRate===""?0:parseInt(n.dailyRate,10),z=n.hourlyRate===""?0:parseInt(n.hourlyRate,10),A=n.usdRate===""?0:parseInt(n.usdRate,10);if(n.chargeType==="daily"&&(!F||F<=0))throw new Error("Please enter a valid daily rate.");if(n.chargeType==="hourly"&&(!z||z<=0))throw new Error("Please enter a valid hourly rate.");if(n.currency==="USD"&&(!A||A<=0))throw new Error("Please enter a valid USD exchange rate.");const M={rateProfile:n.rateProfile,currency:n.currency,chargeType:n.chargeType,dailyRate:F,hourlyRate:z,usdRate:A},x=await ge.put(dt.DECEASED.UPDATE_CHARGE_SETTINGS(i),M);if(x.data?.success)Ke.success("Charge configuration saved."),c&&c(),s();else throw new Error(x.data?.message||"Failed to update charge settings")}catch(F){console.error("Update error:",F),Ke.error(F.response?.data?.message||F.message||"Failed to update settings")}finally{o(!1)}}},_=()=>{if(!f?.date_admitted)return 0;const T=new Date(f.date_admitted);if(isNaN(T.getTime()))return 0;const F=A=>new Date(A.getFullYear(),A.getMonth(),A.getDate()).getTime(),z=Math.floor((F(new Date)-F(T))/864e5);return Math.max(0,z)},P={KES:"KSh",USD:"$"},B=T=>T?parseInt(T,10).toLocaleString("en-US"):"",$=T=>T?`${P[n.currency]} ${parseInt(T,10).toLocaleString("en-US")}`:"Not set",g=n.chargeType==="daily"?n.dailyRate:n.hourlyRate,q=g?n.chargeType==="daily"?g*30:g*24*30:0;return t?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Dr,{}),(0,e.jsx)(Fr,{onClick:s}),(0,e.jsxs)(zr,{className:"open",role:"dialog","aria-modal":"true","aria-label":"Charge configuration",children:[(0,e.jsxs)(Tr,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(Er,{children:[i," · Billing"]}),(0,e.jsx)(Pr,{children:"Charge configuration"})]}),(0,e.jsx)(Lr,{onClick:s,"aria-label":"Close",children:(0,e.jsx)(Mt,{size:13})})]}),(0,e.jsxs)(Ar,{children:[(0,e.jsxs)(Yr,{children:[(0,e.jsx)(Vr,{children:f?.full_name?.charAt(0)||"C"}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Xr,{children:f?.full_name||"Client"}),(0,e.jsxs)(Zr,{children:["Admitted ",f?.date_admitted?new Date(f.date_admitted).toLocaleDateString():"—"," · ",_()," days in morgue"]})]})]}),(0,e.jsxs)("form",{onSubmit:v,children:[(0,e.jsxs)(Ae,{children:[(0,e.jsx)(Ee,{children:"Charge frequency"}),(0,e.jsxs)(Br,{children:[(0,e.jsx)(Ir,{$isHourly:n.chargeType==="hourly"}),(0,e.jsxs)(mt,{type:"button",$active:n.chargeType==="daily",onClick:()=>I("daily"),children:[(0,e.jsx)(er,{size:13}),"Per day"]}),(0,e.jsxs)(mt,{type:"button",$active:n.chargeType==="hourly",onClick:()=>I("hourly"),children:[(0,e.jsx)(Qt,{size:13}),"Per hour"]})]})]}),(0,e.jsxs)(Ae,{children:[(0,e.jsx)(Ee,{children:"Currency"}),(0,e.jsxs)(Nr,{children:[(0,e.jsxs)(ft,{$selected:n.currency==="KES",onClick:()=>j("KES"),children:[(0,e.jsx)("input",{type:"radio",name:"currency",value:"KES",checked:n.currency==="KES",onChange:()=>j("KES")}),(0,e.jsx)(bt,{children:"KES"}),(0,e.jsx)(yt,{children:"Kenyan Shilling"}),(0,e.jsx)(jt,{$selected:n.currency==="KES",children:(0,e.jsx)(We,{size:9})})]}),(0,e.jsxs)(ft,{$selected:n.currency==="USD",onClick:()=>j("USD"),children:[(0,e.jsx)("input",{type:"radio",name:"currency",value:"USD",checked:n.currency==="USD",onChange:()=>j("USD")}),(0,e.jsx)(bt,{children:"USD"}),(0,e.jsx)(yt,{children:"US Dollar"}),(0,e.jsx)(jt,{$selected:n.currency==="USD",children:(0,e.jsx)(We,{size:9})})]})]})]}),(0,e.jsxs)(Ae,{children:[(0,e.jsx)(Ee,{children:n.chargeType==="daily"?"Daily rate":"Hourly rate"}),(0,e.jsxs)(vt,{children:[(0,e.jsx)($t,{children:P[n.currency]}),(0,e.jsx)(wt,{type:"text",inputMode:"numeric",name:n.chargeType==="daily"?"dailyRate":"hourlyRate",value:B(g),onChange:k,placeholder:n.chargeType==="daily"?"4,000":"200"}),(0,e.jsxs)(St,{children:["/ ",n.chargeType==="daily"?"day":"hour"]})]}),(0,e.jsx)(kt,{children:n.chargeType==="daily"?"Charged once for each day in care.":"Charged for every hour in care."})]}),n.currency==="USD"&&(0,e.jsxs)(Ae,{children:[(0,e.jsx)(Ee,{children:"Exchange rate"}),(0,e.jsxs)(vt,{children:[(0,e.jsx)($t,{children:"1 USD ="}),(0,e.jsx)(wt,{type:"text",inputMode:"numeric",name:"usdRate",value:B(n.usdRate),onChange:k,placeholder:"130"}),(0,e.jsx)(St,{children:"KES"})]}),(0,e.jsx)(kt,{children:"Converts USD charges for local statements."})]}),(0,e.jsxs)(Ur,{children:[(0,e.jsx)(qr,{children:"Billing summary"}),(0,e.jsxs)(Mr,{children:[g?`${$(g)}`:"Not set"," ",(0,e.jsxs)("small",{children:["/ ",n.chargeType==="daily"?"day":"hour"]})]}),(0,e.jsx)(Or,{children:g?`Estimated 30-day charge · ${$(q)}`:"Enter a rate to see a projection."}),(0,e.jsxs)(Kr,{children:[(0,e.jsxs)(Ze,{children:[(0,e.jsx)("span",{children:"Frequency"}),(0,e.jsx)("span",{children:n.chargeType==="daily"?"Daily":"Hourly"})]}),(0,e.jsxs)(Ze,{children:[(0,e.jsx)("span",{children:"Currency"}),(0,e.jsx)("span",{children:n.currency})]}),n.currency==="USD"&&n.usdRate&&(0,e.jsxs)(Ze,{children:[(0,e.jsx)("span",{children:"Exchange rate"}),(0,e.jsxs)("span",{children:[B(n.usdRate)," KES"]})]})]})]}),(0,e.jsxs)(Wr,{children:[(0,e.jsx)(Hr,{type:"button",onClick:s,children:"Discard"}),(0,e.jsx)(Gr,{type:"submit",disabled:S,children:S?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Jr,{children:(0,e.jsx)(it,{size:14})}),"Saving…"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(We,{size:14}),"Save configuration"]})})]})]})]})]})]}):null},ea=a.div`
  background: white; border: 1px solid ${r.borderLight}; border-radius: 8px;
  padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky; top: 24px;
  @media (max-width: 900px) { position: static; }
`,ta=a.div`
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
  border-bottom: 1px solid ${r.borderLight}; padding-bottom: 16px;
`,ra=a.div`
  width: 60px; height: 60px; border-radius: 50%; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 24px; flex-shrink: 0;
  font-family: 'Merriweather', serif;
  background: ${t=>t.$female?r.brown:r.black};
`,aa=a.div`
  font-family: 'Merriweather', serif; font-size: 18px; font-weight: 700; color: ${r.black};
`,na=a.div`font-size: 12px; color: ${r.gray}; margin-top: 4px;`,ia=a.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: ${r.borderLight}; border: 1px solid ${r.borderLight};
  border-radius: 8px; overflow: hidden; margin-bottom: 24px;
`,Pe=a.div`background: white; padding: 12px 8px; text-align: center;`,Be=a.div`
  font-size: 16px; font-weight: 700; color: ${t=>t.$color||r.black};
`,Ie=a.div`
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: ${r.gray}; margin-top: 4px;
`,Se=a.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px dashed ${r.borderLight}; font-size: 13px;
  color: ${r.mid};
  &:last-child { border-bottom: none; }
  strong { color: ${t=>t.$highlight?r.danger:r.black}; font-weight: 700; }
`,sa=a.p`
  font-size: 11px; color: ${r.gray}; margin: 10px 0 0; line-height: 1.5;
`,Qe=a.div`
  margin-bottom: 24px;
  h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${r.black}; margin-bottom: 12px; letter-spacing: 0.05em; }
`,_t=a.div`
  display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${r.borderLight};
  &:last-child { border-bottom: none; }
`,Ct=a.div`
  width: 28px; height: 28px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 14px; font-weight: bold;
  background: ${t=>t.$warning?r.warningBg:r.infoBg};
  color: ${t=>t.$warning?r.warning:r.info};
`,Rt=a.div`font-size: 12px; color: ${r.mid}; line-height: 1.4;`,Dt=a.div`font-size: 10px; color: ${r.lightGray}; margin-top: 2px;`,ke=a.div`
  display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;
`,_e=a.div`
  width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
  background: ${t=>t.$done?r.success:t.$active?r.warning:r.border};
`,Ce=a.div`
  font-size: 13px; font-weight: 600; color: ${t=>t.$muted?r.gray:r.dark};
`,Re=a.div`font-size: 11px; color: ${r.gray};`,oa=({deceased:t,postmortem:s,bodyStatus:i,totalCharges:f,balance:c,age:n})=>{const b=t?.full_name||t?.name||"Unknown",S=t?.sex||t?.gender||"",o=S.toLowerCase()==="female",d=sr(t?.date_admitted||t?.admission_date||t?.created_at),y=parseFloat(t?.charges?.storage_rate)||500,k=Math.round(d*y);return(0,e.jsxs)(ea,{children:[(0,e.jsxs)(ta,{children:[(0,e.jsx)(ra,{$female:o,children:ir(b)}),(0,e.jsxs)("div",{children:[(0,e.jsx)(aa,{children:b}),(0,e.jsxs)(na,{children:[S?`${S}, `:"",n?`${n} Years`:""]})]})]}),(0,e.jsxs)(ia,{children:[(0,e.jsxs)(Pe,{children:[(0,e.jsx)(Be,{$color:r.warning,children:d}),(0,e.jsx)(Ie,{children:"Days in Morgue"})]}),(0,e.jsxs)(Pe,{children:[(0,e.jsx)(Be,{children:n||"—"}),(0,e.jsx)(Ie,{children:"Age"})]}),(0,e.jsxs)(Pe,{children:[(0,e.jsxs)(Be,{children:[f,"K"]}),(0,e.jsx)(Ie,{children:"Charges (KES)"})]}),(0,e.jsxs)(Pe,{children:[(0,e.jsxs)(Be,{$color:r.danger,children:[c,"K"]}),(0,e.jsx)(Ie,{children:"Balance (KES)"})]})]}),(0,e.jsxs)(Qe,{children:[(0,e.jsx)("h3",{children:"Storage Charges"}),(0,e.jsxs)(Se,{children:[(0,e.jsx)("span",{children:"Days in morgue"}),(0,e.jsxs)("strong",{children:[d," day",d===1?"":"s"]})]}),(0,e.jsxs)(Se,{children:[(0,e.jsx)("span",{children:"Daily storage rate"}),(0,e.jsxs)("strong",{children:["KES ",y.toLocaleString()]})]}),(0,e.jsxs)(Se,{$highlight:!0,children:[(0,e.jsx)("span",{children:"Storage charge so far"}),(0,e.jsxs)("strong",{children:["KES ",k.toLocaleString()]})]}),(0,e.jsxs)(Se,{children:[(0,e.jsx)("span",{children:"Total charges (all services)"}),(0,e.jsxs)("strong",{children:[f,"K"]})]}),(0,e.jsxs)(Se,{children:[(0,e.jsx)("span",{children:"Balance"}),(0,e.jsxs)("strong",{children:[c,"K"]})]}),(0,e.jsx)(sa,{children:"Storage charge = days in morgue × daily rate (set under Charge Settings). Embalming and extra charges are listed under the Financials tab."})]}),(0,e.jsxs)(Qe,{children:[(0,e.jsx)("h3",{children:"Notifications"}),d>7&&(0,e.jsxs)(_t,{children:[(0,e.jsx)(Ct,{$warning:!0,children:"!"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Rt,{children:["Body has been in the morgue for ",d," days. Please contact next of kin."]}),(0,e.jsx)(Dt,{children:"Active"})]})]}),(0,e.jsxs)(_t,{children:[(0,e.jsx)(Ct,{$info:!0,children:"i"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Rt,{children:["Record status: ",i]}),(0,e.jsxs)(Dt,{children:["Updated ",ne(t?.updated_at)]})]})]})]}),(0,e.jsxs)(Qe,{children:[(0,e.jsx)("h3",{children:"Mortuary Progress"}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(_e,{$done:!0}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Ce,{children:"Admitted to Morgue"}),(0,e.jsx)(Re,{children:ne(t?.created_at)})]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(_e,{$done:t?.embalmed,$active:!t?.embalmed}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Ce,{children:["Body ",t?.embalmed?"Embalmed":"Awaiting Embalming"]}),(0,e.jsx)(Re,{children:t?.embalmed?ne(t?.embalmed_date):"Pending"})]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(_e,{$done:s?.status==="completed",$active:s?.status==="pending"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Ce,{children:["Postmortem ",s?s.status==="completed"?"Completed":s.status==="pending"||s.status==="in_progress"?"In Progress":"Requested":"Not Requested"]}),(0,e.jsx)(Re,{children:s?.status==="completed"?ne(s.completed_at||s.updated_at):s?.status==="pending"||s?.status==="in_progress"?"Awaiting Results":s?ne(s.requested_at||s.created_at):"—"})]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(_e,{$active:i==="In Morgue"||i==="Active"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Ce,{children:["In Storage (",i,")"]}),(0,e.jsx)(Re,{children:"Currently Active"})]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)(_e,{}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Ce,{$muted:!0,children:"Released to Family"}),(0,e.jsx)(Re,{style:{color:r.lightGray},children:"Pending"})]})]})]})]})},et=a.div`
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
`,tt=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,ee=a.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,te=a.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,re=a.div`
  font-size: 14px;
  font-weight: 600;
  color: ${r.black};
  word-break: break-word;
  line-height: 1.35;
  ${t=>t.$body&&"font-weight: 400; line-height: 1.6; font-size: 13px; color: #555;"}
`,ce=a.button`
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
`,la=a.span`
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
`,Ft=a.p`
  font-size: 12px;
  color: ${r.gray};
  margin: 0 0 12px;
`,rt=a.div`
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`,Ne=a.div`
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`,Ue=a.label`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,zt=a.input`
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
`,Tt=a.textarea`
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
`,da=a.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
`,ca=a.div`
  background: #fff; border-radius: 8px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`,pa=a.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${r.borderLight};
  font-size: 16px; font-weight: 700; color: ${r.black};
`,ua=a.div` padding: 20px; `,xa=a.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${r.borderLight};
`,ga=a.button`
  background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: ${r.gray};
  &:hover { color: ${r.black}; }
`,ha=a.div`
  font-size: 12px; color: ${r.gray}; margin-bottom: 14px;
  padding-bottom: 10px; border-bottom: 1px dashed ${r.borderLight};
  b { color: ${r.black}; }
`,ma=a.p`
  font-size: 11px; color: ${r.gray}; margin: 2px 0 0; line-height: 1.5;
`,qe=({label:t,value:s,color:i})=>(0,e.jsxs)("span",{style:{display:"inline-flex",alignItems:"baseline",gap:5},children:[(0,e.jsx)("b",{style:{fontSize:14,color:i||r.black,fontWeight:700},children:s}),(0,e.jsx)("span",{style:{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#999",fontWeight:700},children:t})]}),fa=({postmortem:t,deceasedId:s,deceasedName:i,deceasedAdmission:f,requests:c,onRequestsChanged:n})=>{const b=Oe(),{socket:S}=tr(),o=t||{},d=we(),[y,k]=(0,p.useState)([]),I=c&&c.length>0?c:y.length>0?y:c||y,[j,v]=(0,p.useState)(!1),[_,P]=(0,p.useState)(!1),[B,$]=(0,p.useState)(null),[g,q]=(0,p.useState)({reason:"",requested_by:"",requesting_authority:"",notes:""}),[T,F]=(0,p.useState)(null),z=(0,p.useCallback)(()=>ie.get(`${X.FULL_API_URL}/postmortem-requests/stats`,{headers:pe()}).then(l=>{l.data?.success&&F(l.data.data||null)}).catch(()=>{}),[]);(0,p.useEffect)(()=>{z()},[z]);const A=(0,p.useCallback)(async()=>{if(s)try{const l=await ie.get(`${X.FULL_API_URL}/postmortem-requests`,{headers:pe(),params:{deceased_id:s}});Array.isArray(l.data?.data)&&k(l.data.data)}catch{}},[s]);(0,p.useEffect)(()=>{A()},[A]);const M=()=>{let l="";try{const D=JSON.parse(localStorage.getItem("user")||"{}");l=[D.first_name,D.last_name].filter(Boolean).join(" ")||D.full_name||D.name||D.username||D.email||""}catch{}q(D=>({...D,requested_by:D.requested_by||l})),v(!0)},x=async()=>{try{n&&await n()}catch{}await Promise.all([A(),z()])},E=o.immediate_cause_of_death||o.manner_of_death||o.examination_summary||o.findings||o.toxicology_findings,N=()=>{b(`/tenant/${d}/postmortem-form/${s}`)},C=async()=>{try{const l=pe(),D=`${X.FULL_API_URL}/postmortem/${s}/pdf`,K=await fetch(D,{method:"GET",headers:{...l,Accept:"application/pdf"},credentials:"include"});if(!K.ok){const oe=await K.json().catch(()=>({}));throw new Error(oe.message||`Failed to generate PDF (${K.status})`)}const se=await K.blob(),Z=URL.createObjectURL(se);window.open(Z,"_blank"),setTimeout(()=>URL.revokeObjectURL(Z),6e4)}catch(l){console.error("PDF generation error:",l),alert(`Failed to generate PDF: ${l.message}`)}},w=async l=>{if(l.preventDefault(),!g.reason||!g.requested_by){le.error("Requested-by and reason are required");return}P(!0);try{const D=await ie.post(`${X.FULL_API_URL}/postmortem-requests`,{deceased_id:s,...g},{headers:pe()});if(D.data?.success){const K={id:D.data?.data?.id||`pm-request-${Date.now()}`,title:"Postmortem Request Initiated",message:`Requested by ${g.requested_by} for ${i||"deceased"}`,fullContent:[`Deceased: ${i||"Unknown"}`,`Admission No: ${f||"N/A"}`,`Requested By: ${g.requested_by}`,g.requesting_authority&&`Authority: ${g.requesting_authority}`,`Reason: ${g.reason}`,g.notes&&`Notes: ${g.notes}`].filter(Boolean).join(`
`),timestamp:new Date().toISOString(),priority:"high",deceasedName:i,deceasedId:s,admissionNo:f,requestedBy:g.requested_by,reason:g.reason};S&&S.emit("postmortem-request-created",K),ue.success("Postmortem Request Initiated",[`Who: ${g.requested_by}`,`Deceased: ${i||"Unknown"}`,`Admission: ${f||"N/A"}`].join(" · "),{dur:6e3}),v(!1),q({reason:"",requested_by:"",requesting_authority:"",notes:""}),await x()}else throw new Error(D.data?.message||"Failed to initiate request")}catch(D){le.error(D.response?.data?.message||D.message||"Failed to initiate postmortem request")}finally{P(!1)}},R=async l=>{$(l);try{const D=await ie.post(`${X.FULL_API_URL}/postmortem-requests/${l}/send`,{},{headers:pe()});if(D.data?.success)le.success("Marked as sent - postmortem is now pending"),await x();else throw new Error(D.data?.message||"Failed to send request")}catch(D){le.error(D.response?.data?.message||D.message||"Failed to send postmortem request")}finally{$(null)}},O=async l=>{$(l);try{const D=await ie.put(`${X.FULL_API_URL}/postmortem-requests/${l}/status`,{status:"cancelled"},{headers:pe()});if(D.data?.success)le.success("Postmortem request cancelled"),await x();else throw new Error(D.data?.message||"Failed to cancel request")}catch(D){le.error(D.response?.data?.message||D.message||"Failed to cancel postmortem request")}finally{$(null)}};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8},children:[(0,e.jsxs)(et,{$mt0:!0,style:{marginBottom:0},children:[(0,e.jsx)("span",{children:"01"})," Postmortem Requests"]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[E&&(0,e.jsx)(ce,{onClick:N,children:"Edit Examination"}),(0,e.jsx)(ce,{onClick:N,children:E?"+ New Examination":"+ Fill Examination Form"}),(0,e.jsx)(ce,{$primary:!0,onClick:M,children:"+ Initiate Request"})]})]}),T&&(0,e.jsxs)("div",{style:{display:"flex",gap:22,flexWrap:"wrap",margin:"10px 0 14px"},children:[(0,e.jsx)(qe,{label:"Requested",value:T.initiated??0,color:"#d97706"}),(0,e.jsx)(qe,{label:"Sent",value:T.sent??0,color:"#2563eb"}),(0,e.jsx)(qe,{label:"Completed",value:T.official_completed??0,color:"#7c3aed"}),(0,e.jsx)(qe,{label:"Cancelled",value:T.cancelled??0,color:"#9ca3af"})]}),j&&(0,e.jsx)(da,{onClick:()=>v(!1),children:(0,e.jsxs)(ca,{onClick:l=>l.stopPropagation(),children:[(0,e.jsxs)(pa,{children:[(0,e.jsx)("span",{children:"Initiate Postmortem Request"}),(0,e.jsx)(ga,{onClick:()=>v(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:w,children:[(0,e.jsxs)(ua,{children:[(0,e.jsxs)(ha,{children:["Deceased record: ",(0,e.jsx)("b",{children:i||`#${s}`})]}),(0,e.jsxs)(rt,{children:[(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Ue,{children:"Requested By *"}),(0,e.jsx)(zt,{value:g.requested_by,onChange:l=>q({...g,requested_by:l.target.value}),placeholder:"e.g. Jane Wambui (Family)",required:!0})]}),(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Ue,{children:"Requesting Authority"}),(0,e.jsx)(zt,{value:g.requesting_authority,onChange:l=>q({...g,requesting_authority:l.target.value}),placeholder:"e.g. Kenyatta National Hospital",list:"pm-request-authorities"}),(0,e.jsxs)("datalist",{id:"pm-request-authorities",children:[(0,e.jsx)("option",{value:"Kenya Police"}),(0,e.jsx)("option",{value:"Directorate of Criminal Investigations (DCI)"}),(0,e.jsx)("option",{value:"Court Order"}),(0,e.jsx)("option",{value:"Hospital / Referring Facility"}),(0,e.jsx)("option",{value:"Family Request"})]})]})]}),(0,e.jsx)(rt,{children:(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Ue,{children:"Reason *"}),(0,e.jsx)(Tt,{rows:3,value:g.reason,onChange:l=>q({...g,reason:l.target.value}),placeholder:"Why is the postmortem being requested? (e.g. unclear cause of death, legal requirement, family request)",required:!0})]})}),(0,e.jsx)(rt,{children:(0,e.jsxs)(Ne,{children:[(0,e.jsx)(Ue,{children:"Additional Notes"}),(0,e.jsx)(Tt,{rows:2,value:g.notes,onChange:l=>q({...g,notes:l.target.value}),placeholder:"Optional notes — contact details, special instructions, deadlines..."})]})}),(0,e.jsx)(ma,{children:'Initiating creates a tracked request (status: initiated), marks the body as "Postmortem Requested" and notifies the mortuary team. Use "Mark as Sent" once the request reaches the requesting authority.'})]}),(0,e.jsxs)(xa,{children:[(0,e.jsx)(ce,{type:"button",onClick:()=>v(!1),children:"Cancel"}),(0,e.jsx)(ce,{$primary:!0,type:"submit",disabled:_,children:_?"Initiating...":"Initiate Request"})]})]})]})}),I.length===0?(0,e.jsx)(Ft,{children:"No postmortem requests tracked yet."}):(0,e.jsx)("div",{style:{marginBottom:24},children:I.map(l=>(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:`1px solid ${r.borderLight||"#eeeceb"}`,flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{flex:1,minWidth:220},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("span",{style:{fontWeight:700,fontSize:13,color:r.black},children:l.request_ref||l.requested_by}),(0,e.jsx)(la,{$status:l.status,children:l.status})]}),(0,e.jsxs)("div",{style:{fontSize:12,color:r.gray,marginTop:3,lineHeight:1.6},children:["Requested by ",(0,e.jsx)("b",{children:l.requested_by||"—"}),l.requesting_authority?(0,e.jsxs)(e.Fragment,{children:[" · Authority: ",l.requesting_authority]}):null,(0,e.jsx)("br",{}),"Reason: ",l.reason||"—"," · Initiated ",ne(l.created_at),l.sent_at?` · Sent ${ne(l.sent_at)}`:""]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[l.status==="initiated"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ce,{$primary:!0,onClick:()=>R(l.id),disabled:B===l.id,children:B===l.id?"Sending...":"Mark as Sent"}),(0,e.jsx)(ce,{onClick:()=>O(l.id),disabled:B===l.id,children:"Cancel"})]}),l.status==="sent"&&(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:"Awaiting examination"})]})]},l.id))}),E?(0,e.jsxs)("div",{style:{marginTop:16,border:`1px solid ${r.borderLight}`,borderRadius:8,padding:"18px 20px",background:r.bgSection},children:[(0,e.jsxs)(et,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Official Determination of Death"]}),(0,e.jsxs)(tt,{children:[(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Immediate Cause of Death"}),(0,e.jsx)(re,{children:o.immediate_cause_of_death||"—"})]}),(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Underlying Cause of Death"}),(0,e.jsx)(re,{children:o.underlying_cause_of_death||"—"})]}),o.manner_of_death&&(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:"Manner of Death"}),(0,e.jsx)(re,{children:o.manner_of_death})]}),o.contributing_conditions&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Contributing Conditions"}),(0,e.jsx)(re,{children:o.contributing_conditions})]})]}),(0,e.jsxs)(et,{children:[(0,e.jsx)("span",{children:"03"})," Assessment & Findings"]}),(0,e.jsxs)(tt,{children:[(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Examination Summary"}),(0,e.jsx)(re,{$body:!0,children:o.examination_summary||"No statement provided."})]}),Array.isArray(o.findings)&&o.findings.length>0&&o.findings.map((l,D)=>(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:l.title||l.organ_system||`Finding ${D+1}`}),(0,e.jsx)(re,{$body:!0,children:l.description||l.details||JSON.stringify(l)})]},D)),o.head_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Head / CNS Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.head_findings=="string"?o.head_findings:JSON.stringify(o.head_findings)})]}),o.chest_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Chest Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.chest_findings=="string"?o.chest_findings:JSON.stringify(o.chest_findings)})]}),o.abdomen_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Abdominal Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.abdomen_findings=="string"?o.abdomen_findings:JSON.stringify(o.abdomen_findings)})]}),o.extremities_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Extremities Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.extremities_findings=="string"?o.extremities_findings:JSON.stringify(o.extremities_findings)})]}),o.toxicology_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Toxicology / Lab Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.toxicology_findings=="string"?o.toxicology_findings:JSON.stringify(o.toxicology_findings)})]}),o.custom_findings&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Other Findings"}),(0,e.jsx)(re,{$body:!0,children:typeof o.custom_findings=="string"?o.custom_findings:JSON.stringify(o.custom_findings)})]})]}),(0,e.jsxs)(tt,{children:[(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:"Examining Pathologist"}),(0,e.jsx)(re,{children:o.pathologist_name||o.external_pathologist_name||"—"})]}),(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:"Status"}),(0,e.jsx)(re,{children:o.status?String(o.status).replace(/_/g," ").replace(/^\w/,l=>l.toUpperCase()):"Completed"})]}),(0,e.jsxs)(ee,{children:[(0,e.jsx)(te,{children:"Date Completed"}),(0,e.jsx)(re,{children:ne(o.completed_at||o.updated_at)})]}),o.requesting_authority&&(0,e.jsxs)(ee,{$full:!0,children:[(0,e.jsx)(te,{children:"Requesting Authority"}),(0,e.jsx)(re,{children:o.requesting_authority})]})]}),(0,e.jsx)("div",{style:{display:"flex",justifyContent:"flex-end",gap:12,marginTop:20,flexWrap:"wrap"},children:(0,e.jsx)(ce,{onClick:C,children:"Download PDF Report"})})]}):(0,e.jsx)(Ft,{style:{marginTop:16},children:"No postmortem examination recorded yet.. Use «+ Fill Examination Form» to record the official assessment, or «+ Initiate Request» to track a pre-examination request."})]})},ba=a.div`
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
`;var Lt=a.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;
`,be=a.div`
  flex: 1; 
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`,ye=a.label`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,Me=a.input`
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
`,At=a.select`
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
`,at=a.button`
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
`,ya=a.table`
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
`,ja=a.span`
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
`,va=a.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
`,$a=a.div`
  background: #fff; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`,wa=a.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid ${r.borderLight};
  font-size: 16px; font-weight: 700;
`,Sa=a.div` padding: 20px; `,ka=a.div`
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 20px; border-top: 1px solid ${r.borderLight};
`,_a=a.button`
  background: none; border: none; font-size: 24px; cursor: pointer; color: ${r.gray};
  &:hover { color: ${r.black}; }
`,Ca=({charges:t,payments:s,deceasedId:i,onDataChanged:f})=>{const[c,n]=(0,p.useState)(s||[]),[b,S]=(0,p.useState)(t||[]),[o,d]=(0,p.useState)(!1),[y,k]=(0,p.useState)(!1),[I,j]=(0,p.useState)(null),[v,_]=(0,p.useState)(!1),[P,B]=(0,p.useState)({charge_type:"",amount:"",currency:"USD",description:"",service_date:Je()}),[$,g]=(0,p.useState)({date:Je(),currency:"USD",payment_method:"Cash",reference:"",amount:"",description:""});(0,p.useEffect)(()=>{S(t||[])},[t]);const q=x=>x==="KES"?"KES":"$",T=(x,E)=>`${q(E)} ${parseFloat(x||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,F=["USD","KES"],z=(x,E,N)=>x.filter(C=>(C.currency||"USD")===E).reduce((C,w)=>C+(parseFloat(N(w)||0)||0),0);F.map(x=>{const E=z(b,x,C=>C.amount??C.charge_amount),N=z(c,x,C=>C.amount);return{currency:x,chargesTotal:E,paidTotal:N,balance:E-N}}).filter(x=>x.chargesTotal!==0||x.paidTotal!==0),(0,p.useEffect)(()=>{i&&A()},[i]);const A=async()=>{try{const x=we(),E=$e?$e():localStorage.getItem("token")||localStorage.getItem("authToken")||"",N=await ie.get(`${X.FULL_API_URL}/payments/${i}`,{headers:{"x-tenant-slug":x,Authorization:`Bearer ${E}`}});N.data?.success&&n(N.data.data||[])}catch(x){console.error("Error loading payments:",x)}},M=async x=>{if(x.preventDefault(),!$.amount||!$.reference){le.error("Please fill in all required fields");return}d(!0);try{const E=we(),N=$e?$e():localStorage.getItem("token")||localStorage.getItem("authToken")||"",C=(()=>{try{const w=localStorage.getItem("user");if(w){const R=JSON.parse(w);return R.email||R.username||"Unknown"}}catch(w){console.error("Error getting user email:",w)}return"Unknown"})();(await ie.post(`${X.FULL_API_URL}/payments`,{deceased_id:i,amount:parseFloat($.amount),currency:$.currency||"USD",payment_method:$.payment_method,reference:$.reference,payment_date:$.date,description:$.description||null,recorded_by:C},{headers:{"x-tenant-slug":E,Authorization:`Bearer ${N}`}})).data?.success&&(le.success("Payment recorded successfully"),k(!1),g({date:Je(),currency:$.currency||"USD",payment_method:"Cash",reference:"",amount:"",description:""}),await A(),f&&f())}catch(E){console.error("Error recording payment:",E),le.error("Failed to record payment")}finally{d(!1)}};return(0,e.jsxs)(e.Fragment,{children:[y&&(0,e.jsx)(va,{onClick:()=>k(!1),children:(0,e.jsxs)($a,{onClick:x=>x.stopPropagation(),children:[(0,e.jsxs)(wa,{children:[(0,e.jsx)("span",{children:"Record Payment"}),(0,e.jsx)(_a,{onClick:()=>k(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:M,children:[(0,e.jsxs)(Sa,{children:[(0,e.jsxs)(Lt,{children:[(0,e.jsxs)(be,{children:[(0,e.jsx)(ye,{children:"Date"}),(0,e.jsx)(Me,{type:"date",value:$.date,onChange:x=>g({...$,date:x.target.value}),required:!0})]}),(0,e.jsxs)(be,{children:[(0,e.jsx)(ye,{children:"Currency"}),(0,e.jsxs)(At,{value:$.currency,onChange:x=>g({...$,currency:x.target.value}),children:[(0,e.jsx)("option",{value:"USD",children:"USD ($)"}),(0,e.jsx)("option",{value:"KES",children:"KES"})]})]}),(0,e.jsxs)(be,{children:[(0,e.jsx)(ye,{children:"Payment Method"}),(0,e.jsxs)(At,{value:$.payment_method,onChange:x=>g({...$,payment_method:x.target.value}),children:[(0,e.jsx)("option",{children:"Cash"}),(0,e.jsx)("option",{children:"M-Pesa"}),(0,e.jsx)("option",{children:"Card"}),(0,e.jsx)("option",{children:"Bank Transfer"})]})]})]}),(0,e.jsxs)(Lt,{children:[(0,e.jsxs)(be,{children:[(0,e.jsx)(ye,{children:"Reference Number"}),(0,e.jsx)(Me,{placeholder:"e.g. QXR89YU72",value:$.reference,onChange:x=>g({...$,reference:x.target.value}),required:!0})]}),(0,e.jsxs)(be,{children:[(0,e.jsxs)(ye,{children:["Amount (",$.currency==="KES"?"KES":"USD",")"]}),(0,e.jsx)(Me,{type:"number",placeholder:"0.00",value:$.amount,onChange:x=>g({...$,amount:x.target.value}),required:!0})]}),(0,e.jsxs)(be,{style:{flex:2,minWidth:"200px"},children:[(0,e.jsx)(ye,{children:"Description / Notes (Optional)"}),(0,e.jsx)(Me,{placeholder:"e.g. Facility fee, Coffin, Embalming, etc.",value:$.description,onChange:x=>g({...$,description:x.target.value})})]})]})]}),(0,e.jsxs)(ka,{children:[(0,e.jsx)(at,{type:"button",onClick:()=>k(!1),children:"Cancel"}),(0,e.jsx)(at,{$primary:!0,type:"submit",disabled:o,children:o?"Recording...":"Save Payment"})]})]})]})}),(0,e.jsxs)(ba,{$mt4:!0,style:{justifyContent:"space-between",width:"100%"},children:[(0,e.jsxs)("span",{children:[(0,e.jsx)("span",{style:{opacity:.5,fontSize:"10px"},children:"02"})," Payment History"]}),(0,e.jsx)(at,{$primary:!0,onClick:()=>k(!0),style:{padding:"4px 12px",fontSize:"11px"},children:"+ Record Payment"})]}),(0,e.jsxs)(ya,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Method"}),(0,e.jsx)("th",{children:"Reference"}),(0,e.jsx)("th",{children:"Description"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Recorded By"})]})}),(0,e.jsx)("tbody",{children:c.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No payments recorded"})}):c.map((x,E)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:ne(x.created_at||x.payment_date)}),(0,e.jsx)("td",{children:(0,e.jsx)(ja,{$info:x.payment_method==="M-Pesa",$warning:x.payment_method==="Cash",children:x.payment_method||"—"})}),(0,e.jsx)("td",{children:x.reference||"—"}),(0,e.jsx)("td",{children:x.description||x.notes||"—"}),(0,e.jsx)("td",{children:(0,e.jsx)("strong",{children:T(x.amount,x.currency)})}),(0,e.jsx)("td",{children:x.recorded_by||"—"})]},E))})]})]})};a.div`
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
`;var Et=a.button`
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
`,Ra=a.table`
  width: 100%;
  min-width: 620px;
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
`,Da=a.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid ${r.borderLight||"#e0e0e0"};
  border-radius: 6px;
`,Fa=a.span`
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
`,za=({documents:t,deceasedId:s})=>{const[i,f]=(0,p.useState)(!1),[c,n]=(0,p.useState)(!1),[b,S]=(0,p.useState)(null),o=(0,p.useRef)(null);(0,p.useEffect)(()=>{if(!s)return;let j=!1;return(async()=>{try{const v=await ge.get(`/documents/${s}`,{headers:pe(),withCredentials:!1});if(!j){const _=v.data?.files||v.data?.data||[];S(Array.isArray(_)?_:[])}}catch{}})(),()=>{j=!0}},[s]);const d=b??(Array.isArray(t)?t:[]),y=async j=>{const v=j.target.files?.[0];if(!v||!s){ue.error("Upload failed","Missing file or deceased ID");return}n(!0);try{const _=new FormData;_.append("document",v);const P={"Content-Type":null,"x-tenant-slug":localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||""};try{const $=localStorage.getItem("accessToken")||localStorage.getItem("authToken");$&&(P.Authorization=`Bearer ${$}`);const g=localStorage.getItem("tenantSlug");g&&(P["x-tenant-slug"]=g)}catch{}const B=await ge.post(`/documents/upload/${String(s)}`,_,{headers:P,withCredentials:!1});B.data?.success||B.data?.document?(ue.success("Document uploaded",B.data?.message||"Document uploaded successfully"),window.location.reload()):ue.error("Upload failed",B.data?.message||"Failed to upload document")}catch(_){console.error("Error uploading document:",_);const P=_.response?.status,B=_.response?.data?.message;let $="Upload failed",g="Failed to upload document. Please try again later.";P===400?g=B||"Invalid file type. Only PDFs, images, and Word documents are allowed.":P===413?g="File is too large (max 50MB).":P===404?g="Deceased record not found.":B&&(g=B),ue.error($,g)}finally{n(!1)}},k=()=>{o.current&&o.current.click()},I=j=>{const v=j?.documentId??j?.document_id??j?.id,_=new URLSearchParams;_.set("deceasedId",s),v&&_.set("docId",v),_.set("session",Date.now().toString(36)+Math.random().toString(36).slice(2,10)),window.open(`/memorial-document-viewer.html?${_.toString()}`,"_blank","noopener")};return(0,e.jsxs)(e.Fragment,{children:[i&&(0,e.jsx)(Ot,{onClose:()=>f(!1)}),(0,e.jsxs)("div",{style:{display:"flex",gap:"12px",marginBottom:"32px",flexWrap:"wrap"},children:[(0,e.jsx)("input",{ref:o,type:"file",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png",onChange:y,disabled:c,style:{display:"none"}}),(0,e.jsx)(Et,{$primary:!0,onClick:k,disabled:c,style:{cursor:"pointer"},children:c?"Uploading...":"+ Upload Document"})]}),(0,e.jsx)(Da,{children:(0,e.jsxs)(Ra,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Document Name"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Uploaded Date"}),(0,e.jsx)("th",{style:{textAlign:"right"},children:"Actions"})]})}),(0,e.jsx)("tbody",{children:d.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:4,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No documents uploaded"})}):d.map((j,v)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:600},children:j.originalName||j.storedName||j.name||j.file_name}),(0,e.jsx)("td",{children:(0,e.jsx)(Fa,{$info:!0,children:j.mimeType||j.category||j.type||"Document"})}),(0,e.jsx)("td",{children:ne(j.uploadedAt||j.uploaded_at||j.created_at)}),(0,e.jsx)("td",{style:{textAlign:"right"},children:(0,e.jsxs)(Et,{$sm:!0,onClick:()=>I(j),title:"Open document preview in a new page",children:[(0,e.jsx)("i",{className:"far fa-images",style:{marginRight:5,fontSize:11}})," View"]})})]},v))})]})})]})},L={black:"#0a0a0a",dark:"#1a1a1a",gray:"#777777",border:"#c8c8c8",borderLight:"#e0e0e0",bgField:"#f7f7f5",success:"#059669",successBg:"#ecfdf5",warning:"#d97706",warningBg:"#fef3c7",danger:"#dc2626",dangerBg:"#fef2f2",info:"#2563eb",infoBg:"#eff6ff"},Ta=he`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`,Pt=a.span`
  display: inline-flex;
  animation: ${Ta} 0.8s linear infinite;
`;he`from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); }`;var La=a.div`
  position: fixed; inset: 0; z-index: 120;
  background: rgba(10, 10, 10, 0.38);
  display: block;
  animation: ${he`from { opacity: 0; } to { opacity: 1; }`} 0.18s ease-out;
`,Aa=a.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(520px, 100vw);
  height: 100vh;
  overflow-y: auto;
  background: #ffffff;
  border-left: 1px solid ${L.border};
  box-shadow: -18px 0 44px -18px rgba(10, 10, 10, 0.35);
  animation: ${he`from { transform: translateX(100%); } to { transform: translateX(0); }`} 0.2s ease-out;
  padding: 28px 26px;

  @media (max-width: 560px) {
    padding: 22px 18px;
  }
`,Ea=a.div`
  display: flex; align-items: center; gap: 10px; justify-content: space-between;
  h3 { font-family: 'Source Sans 3', sans-serif; font-size: 17px; font-weight: 700; color: ${L.black}; margin: 0; display: flex; align-items: center; gap: 8px; }
`,Pa=a.button`
  width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${L.border};
  background: white; color: ${L.gray}; cursor: pointer; display: grid; place-items: center;
  &:hover { color: ${L.black}; border-color: ${L.black}; }
`,je=a.div`
  display: flex; align-items: center; gap: 8px; margin-top: 14px; width: 100%;
  ${t=>t.$kind==="success"&&`background: ${L.successBg}; color: ${L.success};`}
  ${t=>t.$kind==="error"&&`background: ${L.dangerBg}; color: ${L.danger};`}
  ${t=>t.$kind==="info"&&`background: ${L.infoBg}; color: ${L.info};`}
  ${t=>t.$kind==="warning"&&`background: ${L.warningBg}; color: ${L.warning};`}
  padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid ${L.borderLight};
`,Ba=a.div`
  height: 5px; background: #e5e7eb; border-radius: 3px; margin: 10px 0; overflow: hidden;
  > div { height: 100%; background: ${L.black}; width: ${t=>t.$w}%; transition: width 0.3s ease; }
`,Ia=()=>(0,e.jsxs)("svg",{width:"42",height:"42",viewBox:"0 0 64 64",xmlns:"http://www.w3.org/2000/svg",children:[(0,e.jsx)("path",{d:"M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z",fill:"#334155"}),(0,e.jsx)("rect",{x:"14",y:"22",width:"36",height:"7",fill:"#0f172a"}),(0,e.jsx)("path",{d:"M8 46 L56 46 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 Z",fill:"#1e293b"}),(0,e.jsx)("rect",{x:"13",y:"37",width:"14",height:"5",rx:"1",fill:"#10b981"}),(0,e.jsx)("circle",{cx:"37",cy:"40",r:"2",fill:"#64748b"}),(0,e.jsx)("circle",{cx:"44",cy:"40",r:"2",fill:"#64748b"})]}),Na=async({file:t,deceasedId:s,documentName:i,category:f})=>{const c=new FormData;c.append("document",t),i&&c.append("documentName",i),f&&c.append("category",f);const n={"Content-Type":null};try{const b=localStorage.getItem("authToken")||localStorage.getItem("accessToken");b&&(n.Authorization=`Bearer ${b}`);const S=localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug");S&&(n["x-tenant-slug"]=S)}catch{}return(await ge.post(`/documents/upload/${String(s)}`,c,{headers:n,withCredentials:!1})).data},Ua=t=>{const s=new Date,i=c=>String(c).padStart(2,"0"),f=`${s.getFullYear()}-${i(s.getMonth()+1)}-${i(s.getDate())}-${i(s.getHours())}${i(s.getMinutes())}`;return`Scan_${String(t||"document").replace(/\s+/g,"-").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,24)}_${f}.pdf`},qa=({deceasedId:t,deceasedName:s="",onClose:i,onScanned:f})=>{const[c,n]=(0,p.useState)("probe"),[b,S]=(0,p.useState)(5),[o,d]=(0,p.useState)(""),[y,k]=(0,p.useState)(null),[I,j]=(0,p.useState)(""),[v,_]=(0,p.useState)(()=>Ua(s)),[P,B]=(0,p.useState)("Scan"),[$,g]=(0,p.useState)(!1),q=(0,p.useRef)(null);(0,p.useEffect)(()=>{T()},[]);const T=async()=>{const R=await ar(4e3);R.ok?(j(R.url),n("ready")):n("unavailable")},F=()=>{if(!t){ue.error("Scan failed","Missing deceased ID");return}n("scanning"),S(5),d("Connecting to the scanner…");let R;try{R=new WebSocket(I||"ws://localhost:8081")}catch{n("error"),d("Cannot reach the Scanner Bridge. Is the local agent running?");return}R.onopen=()=>{const O=nr({deceasedId:t,documentName:v||void 0,category:P});R.send(JSON.stringify(O))},R.onmessage=O=>{let l={};try{l=JSON.parse(O.data)}catch{}switch(l.status){case"SCANNING":n("scanning"),S(typeof l.progress=="number"?l.progress:50),d(l.message||"Scanning…");break;case"UPLOADING":n("uploading"),S(85),d(l.message||"Uploading to the documents service…");break;case"COMPLETE":S(100),k(l.document||null),n("success"),d(l.message||"Document scanned and uploaded successfully!");try{R.close()}catch{}break;case"ERROR":n("error"),d(l.message||"Scan failed. Please try again.");try{R.close()}catch{}}},R.onerror=()=>{n("error"),d("Cannot reach the Scanner Bridge. Is the local agent running?")}},z=()=>{k(null),S(5),d(""),n(I?"ready":"unavailable")},A=async R=>{const O=R.target.files?.[0];if(O){if(!t){ue.error("Upload failed","Missing deceased ID");return}g(!0),n("uploading"),d("Uploading to the documents service…");try{const l=await Na({file:O,deceasedId:t,documentName:v||O.name,category:P});k(l?.data||l||{name:O.name}),n("success"),d(l?.message||"Document uploaded successfully!"),ue.success("Uploaded",l?.message||"Document uploaded to the documents service.")}catch(l){n("error"),d(l?.response?.data?.message||l?.message||"Upload failed. Please try again.")}finally{g(!1),q.current&&(q.current.value="")}}},M=()=>{typeof f=="function"&&f(y||{}),typeof i=="function"&&i()},x=(0,e.jsxs)("div",{style:{display:"grid",gap:10,marginTop:12},children:[(0,e.jsxs)("label",{style:{fontSize:12,fontWeight:600,color:L.dark},children:["Document name",(0,e.jsx)("input",{value:v,onChange:R=>_(R.target.value),style:{display:"block",width:"100%",marginTop:4,padding:"8px 10px",border:`1px solid ${L.border}`,borderRadius:8,fontFamily:"'Source Sans 3', sans-serif",fontSize:13}})]}),(0,e.jsxs)("label",{style:{fontSize:12,fontWeight:600,color:L.dark},children:["Category",(0,e.jsx)("select",{value:P,onChange:R=>B(R.target.value),style:{display:"block",width:"100%",marginTop:4,padding:"8px 10px",border:`1px solid ${L.border}`,borderRadius:8,fontFamily:"'Source Sans 3', sans-serif",fontSize:13},children:["Scan","General","Death Certificate","Medical","Police Report","ID / Passport","Release Forms","Other"].map(R=>(0,e.jsx)("option",{value:R,children:R},R))})]})]}),E={background:L.black,color:"#fff",border:"none",borderRadius:8,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Source Sans 3', sans-serif"},N={background:"#fff",color:L.dark,border:`1px solid ${L.border}`,borderRadius:8,padding:"10px 16px",fontSize:13.5,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Source Sans 3', sans-serif"},C=(0,e.jsx)("input",{ref:q,type:"file",accept:".pdf,.jpg,.jpeg,.png",onChange:A,style:{display:"none"}}),w=c==="scanning"||c==="uploading"||$||c==="probe";return(0,e.jsx)(La,{onClick:w?void 0:i,children:(0,e.jsxs)(Aa,{onClick:R=>R.stopPropagation(),children:[(0,e.jsxs)(Ea,{children:[(0,e.jsxs)("h3",{children:[(0,e.jsx)(Ia,{})," Scan Document"]}),(0,e.jsx)(Pa,{onClick:i,disabled:w,title:"Close",children:(0,e.jsx)(Mt,{size:14})})]}),c==="probe"&&(0,e.jsxs)(je,{$kind:"info",children:[(0,e.jsx)(Pt,{children:(0,e.jsx)(ot,{size:16})}),"Checking for the local Scanner Bridge…"]}),c==="ready"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(je,{$kind:"info",children:[(0,e.jsx)(Ge,{size:16}),"Scanner Bridge connected",I?` — ${I.replace(/^ws:\/\//,"")}`:"","."]}),(0,e.jsxs)("div",{style:{background:L.bgField,border:`1px solid ${L.borderLight}`,borderRadius:8,padding:"12px 14px",marginTop:10,fontSize:13,color:L.dark},children:["Place the document(s) face-up in the scanner tray, then press",(0,e.jsx)("strong",{children:" Scan Document"}),". The pages are scanned to a PDF and uploaded straight to this deceased person's documents."]}),x,(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:{...E,flex:1},onClick:F,children:[(0,e.jsx)(Ge,{size:16})," Scan Document"]}),(0,e.jsxs)("button",{style:N,onClick:()=>q.current?.click(),children:[(0,e.jsx)(He,{size:15})," Upload a file instead"]})]}),C]}),c==="unavailable"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(je,{$kind:"warning",children:[(0,e.jsx)(ct,{size:16}),"Scanner Bridge not found on this computer."]}),(0,e.jsxs)("div",{style:{background:L.bgField,border:`1px solid ${L.borderLight}`,borderRadius:8,padding:"12px 14px",marginTop:10,fontSize:13,color:L.dark},children:[(0,e.jsx)("strong",{children:"Install Scanner Bridge"})," to scan straight from Restpoint (no HP software or scanner buttons needed). Download the app at",(0,e.jsx)("a",{href:"/downloads/Restpoint-Scanner-Bridge-Installer.exe",download:!0,children:"Download the Scanner Bridge installer"})," ","and run it once on this computer. Node.js is not required."]}),x,(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:{...E,flex:1},onClick:T,children:[(0,e.jsx)(it,{size:15})," Check Again"]}),(0,e.jsxs)("button",{style:N,onClick:()=>q.current?.click(),children:[(0,e.jsx)(He,{size:15})," Upload a scanned file instead"]})]}),C]}),(c==="scanning"||c==="uploading")&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(je,{$kind:"info",children:[(0,e.jsx)(Pt,{children:(0,e.jsx)(ot,{size:16})}),o]}),(0,e.jsx)(Ba,{$w:b,children:(0,e.jsx)("div",{})}),(0,e.jsx)("div",{style:{fontSize:12,color:L.gray,textAlign:"center"},children:c==="scanning"?"Holding the scanner… pages are being digitised.":"Sending the PDF to the documents service…"})]}),c==="success"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(je,{$kind:"success",children:[(0,e.jsx)(lt,{size:16}),o||"Document scanned and uploaded successfully!"]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,marginTop:12,fontSize:13,color:L.dark,background:L.bgField,border:`1px solid ${L.borderLight}`,borderRadius:8,padding:"12px 14px"},children:[(0,e.jsx)(rr,{size:15}),(0,e.jsxs)("span",{children:[(0,e.jsx)("strong",{children:y?.original_name||y?.name||v||"Scanned document"}),y?.file_size?` · ${Math.max(1,Math.round(y.file_size/1024))} KB`:""," ","· uploaded to this profile's documents."]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16},children:[(0,e.jsxs)("button",{style:N,onClick:z,children:[(0,e.jsx)(Ge,{size:15})," Scan another"]}),(0,e.jsxs)("button",{style:{...E,flex:1},onClick:M,children:[(0,e.jsx)(lt,{size:16})," Done"]})]})]}),c==="error"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(je,{$kind:"error",children:[(0,e.jsx)(ct,{size:16}),o||"Scan failed. Please try again."]}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:N,onClick:z,children:[(0,e.jsx)(it,{size:15})," Try Again"]}),(0,e.jsxs)("button",{style:N,onClick:()=>q.current?.click(),children:[(0,e.jsx)(He,{size:15})," Upload a file instead"]})]}),C]})]})})},Bt=a.div`
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
`,It=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,H=a.div`
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
`,J=a.div`
  font-size: 14px;
  font-weight: 600;
  color: ${r.black};
  word-break: break-word;
  line-height: 1.35;
  ${t=>t.$mono&&"font-family: ui-monospace, monospace; font-size: 13px;"}
`,Ma=({path:t})=>{const[s,i]=(0,p.useState)(!1),c=(n=>{if(!n)return null;if(n.startsWith("data:image"))return n;if(n.startsWith("http"))return or(n);if(n.startsWith("/"))return`${X.UPLOADS_URL}${n}`;const b=n.replace(/^\/+/,"");return`${X.UPLOADS_URL}/${b}`})(t);return t?s?(0,e.jsx)("a",{href:c,target:"_blank",rel:"noreferrer",style:{fontSize:14,color:"#1a73e8"},children:"Click to view signature ↗"}):(0,e.jsx)("img",{src:c,alt:"Next of Kin Signature",onError:()=>i(!0),style:{maxWidth:"100%",maxHeight:220,marginTop:6,background:"#fff",padding:6,objectFit:"contain"}}):null},Oa=({deceased:t,nextOfKin:s})=>{const i=t||{},f=s||{},c=i.signature||f.signature,n=i.full_name||i.name||"Unknown";return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(H,{$full:!0,style:{marginBottom:"20px"},children:[(0,e.jsx)(G,{style:{fontSize:11,opacity:.55},children:"Deceased Name"}),(0,e.jsx)(J,{style:{color:"#2563eb",fontSize:24,fontWeight:700,fontFamily:"Merriweather",marginBottom:8},children:n})]}),(0,e.jsxs)(Bt,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," Admission"]}),(0,e.jsxs)(It,{children:[(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Admission Number"}),(0,e.jsx)(J,{$mono:!0,children:i.admission_number||i.admission_no||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Date Admitted"}),(0,e.jsx)(J,{children:ne(i.date_admitted||i.created_at)})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Time Received"}),(0,e.jsx)(J,{$mono:!0,children:i.time_received||i.admission_time||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Receiving Officer"}),(0,e.jsx)(J,{children:i.receiving_officer||i.admitted_by||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Body Status"}),(0,e.jsx)(J,{children:i.body_status||i.body_condition||"In Morgue"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Received From"}),(0,e.jsx)(J,{children:i.received_from||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Date of Death"}),(0,e.jsx)(J,{children:ne(i.date_of_death)})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Place of Death"}),(0,e.jsx)(J,{children:i.place_of_death||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Physician"}),(0,e.jsx)(J,{children:i.physician||i.attending_physician||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Permit Number"}),(0,e.jsx)(J,{$mono:!0,children:i.permit_number||"—"})]}),(0,e.jsxs)(H,{$full:!0,children:[(0,e.jsx)(G,{children:"Cause of Death"}),(0,e.jsx)(J,{children:i.cause_of_death||"—"})]})]}),(0,e.jsxs)(Bt,{children:[(0,e.jsx)("span",{children:"03"})," Next of Kin"]}),(0,e.jsxs)(It,{children:[(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"NOK Name"}),(0,e.jsx)(J,{children:f.full_name||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Relationship"}),(0,e.jsx)(J,{children:f.relationship||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"National ID"}),(0,e.jsx)(J,{$mono:!0,children:f.id_number||i.national_id||i.id_number||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Telephone"}),(0,e.jsx)(J,{children:f.contact||"—"})]}),(0,e.jsxs)(H,{children:[(0,e.jsx)(G,{children:"Alt. Phone"}),(0,e.jsx)(J,{children:f.alternative_phone||"—"})]}),(0,e.jsxs)(H,{$full:!0,children:[(0,e.jsx)(G,{children:"Signature"}),c?(0,e.jsx)(Ma,{path:c}):(0,e.jsx)(J,{style:{color:"#999"},children:"—"})]})]})]})},Ka=a.div`
  background: ${r.black}; color: white; padding: 8px 16px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; margin-bottom: 24px; border-radius: 2px;
  display: flex; align-items: center; gap: 8px;
  span { opacity: 0.5; font-size: 10px; }
  ${t=>t.$mt0&&"margin-top: 0;"}
`,Wa=a.table`
  width: 100%; border-collapse: collapse;
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: ${r.gray}; padding: 8px 12px; border-bottom: 2px solid ${r.borderLight}; white-space: nowrap; }
  td { padding: 12px; font-size: 13px; border-bottom: 1px solid ${r.borderLight}; vertical-align: middle; }
`,Ha=({deceased:t,postmortem:s,charges:i,payments:f,releaseData:c,requests:n})=>{const b=t||{},S=[{action:"Record Created (Admission Intake)",user:b.receiving_officer||b.admitted_by||"System",role:"Receiving Officer",timestamp:b.created_at||b.admission_time},...b.embalmed?[{action:"Body Embalmed",user:b.embalmed_by||b.admitted_by||"System",role:"Mortician",timestamp:b.embalmed_date||b.updated_at}]:[],...s?.status==="completed"?[{action:"Postmortem Results Saved",user:s.pathologist_name||"Unknown",role:"Pathologist",timestamp:s.completed_at||s.updated_at}]:[],...s?.status==="pending"?[{action:"Postmortem Requested",user:s.requested_by||"System",role:"Requesting Authority",timestamp:s.requested_at||s.created_at}]:[],...Array.isArray(i)&&i.length>0?i.map(d=>({action:`Charge Added: ${d.description||d.charge_name||"Service Charge"} ($${parseFloat(d.amount||d.charge_amount||0).toFixed(2)})`,user:d.created_by||d.added_by||b.admitted_by||"System",role:"Billing Officer",timestamp:d.created_at||d.updated_at})):[],...Array.isArray(f)&&f.length>0?f.map(d=>({action:`Payment Recorded: $${parseFloat(d.amount||0).toFixed(2)} (${d.payment_method||d.method||"N/A"})`,user:d.received_by||d.processed_by||b.admitted_by||"System",role:"Cashier",timestamp:d.payment_date||d.created_at})):[],...c?[{action:`Body Released to: ${c.released_to||c.receiver_name||"Unknown"}`,user:c.released_by||c.staff_name||c.authorized_by||"System",role:"Authorized Officer",timestamp:c.released_at||c.created_at}]:[],...b.body_status&&b.body_status!=="admitted"?[{action:`Body Status Changed: ${b.body_status}`,user:b.updated_by||b.admitted_by||"System",role:"Mortuary Attendant",timestamp:b.updated_at||b.date_admitted||b.created_at}]:[],...Array.isArray(n)?n.map(d=>{const y=d.status==="cancelled"?d.cancelled_at||d.updated_at||d.created_at:d.status==="sent"?d.sent_at||d.updated_at||d.created_at:d.created_at||d.updated_at;return{action:`${d.status==="sent"?"Postmortem Request Sent to Authority":d.status==="cancelled"?"Postmortem Request Cancelled":"Postmortem Request Initiated"}${d.request_ref?` (${d.request_ref})`:""}`,user:d.initiated_by||d.requested_by||"System",role:"Requesting Party",timestamp:y}}):[]].filter(Boolean),o=d=>{if(!d)return 0;const y=String(d).includes("T")?d:String(d).replace(" ","T"),k=Date.parse(y);return Number.isNaN(k)?0:k};return S.sort((d,y)=>o(y.timestamp)-o(d.timestamp)),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(Ka,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," System Audit Trail"]}),(0,e.jsx)("div",{style:{overflowX:"auto",border:`1px solid ${r.borderLight}`,borderRadius:6},children:(0,e.jsxs)(Wa,{style:{marginTop:0},children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Action Performed"}),(0,e.jsx)("th",{children:"User"}),(0,e.jsx)("th",{children:"Timestamp"})]})}),(0,e.jsx)("tbody",{children:S.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:3,style:{textAlign:"center",color:r.gray,padding:20},children:"No audit records found"})}):S.map((d,y)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:500},children:d.action}),(0,e.jsxs)("td",{children:[(0,e.jsx)("strong",{children:d.user}),(0,e.jsx)("br",{}),(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:d.role})]}),(0,e.jsx)("td",{style:{color:r.gray,fontSize:12,whiteSpace:"nowrap"},children:ne(d.timestamp)})]},y))})]})})]})},De=a.div`
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
`,Fe=a.div`
  display: grid; 
  grid-template-columns: ${t=>t.$cols?"repeat(2, 1fr)":"repeat(auto-fit, minmax(200px, 1fr))"}; 
  gap: 1.5rem 2rem; 
  margin-bottom: 24px;
`,Ga=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 24px;
`,nt=a.div`
  min-width: 0;
`,Y=a.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,V=a.span`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,ae=a.div`
  font-size: 15px; 
  font-weight: 600; 
  color: ${r.black}; 
  word-break: break-word;
  line-height: 1.4;
  
  ${t=>t.$muted&&`color: ${r.gray}; font-weight: 500;`}
`,Ja=a.button`
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
`;var Ya=({deceased:t,nextOfKin:s,deceasedId:i})=>{const f=Oe(),c=t||{},[n,b]=(0,p.useState)(c?.releaseData||null),[S,o]=(0,p.useState)(!1),d=()=>{let y=localStorage.getItem("tenantSlug")||"";if(!y||y==="dashboard"||y==="default"){const k=localStorage.getItem("user"),I=k?JSON.parse(k):{};y=I?.parentTenantSlug||I?.tenantSlug||y}f(`/tenant/${y}/release-form/${i}`,{state:{deceasedData:t}})};return(0,p.useEffect)(()=>{(async()=>{if(i&&!c?.releaseData){o(!0);try{const k=c.admission_number||c.admission_no||i,I={...pe()};try{const v=await ge.get(`/body-release/by-admission/${encodeURIComponent(k)}`,{headers:I});if(v.data?.success&&v.data?.data){b(v.data.data);return}}catch{}const j=await ge.get("/body-release/checkout",{headers:I});if(j.data?.success&&Array.isArray(j.data?.data)){const v=g=>String(g||"").trim().toLowerCase(),_=v(k),P=v(i),B=new Set([c.full_name,c.name_of_deceased,c.name,c.fullname].filter(Boolean).map(v)),$=j.data.data.find(g=>_&&(v(g.admission_number)===_||v(g.admission_number)===P)||B.has(v(g.name_of_deceased)));$&&b($)}}catch(k){console.error("Error fetching release data:",k)}finally{o(!1)}}})()},[i,c.full_name,c.name_of_deceased,c.admission_number,c.admission_no,c.releaseData]),(0,e.jsxs)(e.Fragment,{children:[n?(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.successBg||"#ecfdf5",border:`1px solid ${r.success||"#059669"}44`},children:[(0,e.jsx)("i",{className:"fas fa-check-circle",style:{color:r.success||"#059669",fontSize:18}}),(0,e.jsxs)("div",{style:{flex:1,minWidth:200},children:[(0,e.jsxs)("div",{style:{fontWeight:700,color:r.success||"#059669",fontSize:14},children:["BODY RELEASED",n.release_id?` — ${n.release_id}`:""]}),(0,e.jsx)("div",{style:{fontSize:12,color:r.gray},children:n.created_at?`Released on ${ne(n.created_at)}`:""})]})]}):(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.bgField||"#f7f7f5",border:`1px solid ${r.borderLight||"#e0e0e0"}`},children:[(0,e.jsx)("i",{className:"fas fa-clock",style:{color:r.gray,fontSize:16}}),(0,e.jsx)("div",{style:{flex:1,minWidth:200,fontSize:13,color:r.gray},children:"No body release has been recorded for this deceased yet."}),(0,e.jsxs)(Ja,{$primary:!0,onClick:d,children:[(0,e.jsx)("i",{className:"fas fa-door-open",style:{fontSize:12}})," Start Release"]})]}),(0,e.jsxs)(Ga,{children:[(0,e.jsxs)(nt,{children:[(0,e.jsxs)(De,{$mt0:!0,$primary:!0,children:[(0,e.jsx)("span",{children:"01"})," Release Details"]}),(0,e.jsxs)(Fe,{$cols:!0,children:[(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Release ID"}),(0,e.jsx)(ae,{children:n?.release_id||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Deceased"}),(0,e.jsx)(ae,{children:n?.name_of_deceased||c.full_name||c.name_of_deceased||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Scheduled Release Date"}),(0,e.jsx)(ae,{children:n?.date_of_removal?ne(n.date_of_removal):"Not scheduled"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Scheduled Release Time"}),(0,e.jsx)(ae,{children:n?.time_of_removal||"—"})]})]})]}),(0,e.jsxs)(nt,{children:[(0,e.jsxs)(De,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Receiver / Next of Kin"]}),(0,e.jsxs)(Fe,{$cols:!0,children:[(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Authorized By (NOK)"}),(0,e.jsx)(ae,{children:n?.next_kin||s?.full_name||s?.name||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Relationship to Deceased"}),(0,e.jsx)(ae,{children:n?.relationship||s?.relationship||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Receiver ID Number"}),(0,e.jsx)(ae,{children:n?.id_number||s?.id_number||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Receiver Phone"}),(0,e.jsx)(ae,{children:n?.tell_number||s?.contact||"—"})]})]})]})]}),(0,e.jsxs)(De,{$mt0:!0,children:[(0,e.jsx)("span",{children:"03"})," Transport & Release Officer"]}),(0,e.jsxs)(Fe,{children:[(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Permit Number"}),(0,e.jsx)(ae,{children:n?.permit_number||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Mode of Transport"}),(0,e.jsx)(ae,{children:n?.mode_of_transport||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Released By (Staff)"}),(0,e.jsx)(ae,{children:n?.staff_name||n?.received_by||n?.released_by||"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Recorded On"}),(0,e.jsx)(ae,{children:n?.created_at?ne(n.created_at):"—"})]})]}),(0,e.jsxs)(De,{$mt0:!0,children:[(0,e.jsx)("span",{children:"04"})," Verification & Handover Notes"]}),(0,e.jsxs)(Fe,{children:[(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Payments Cleared"}),(0,e.jsx)(ae,{children:n?n.everything_paid?"Yes — everything paid":"Not marked as fully paid":"—"})]}),(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Terms Accepted"}),(0,e.jsx)(ae,{children:n?n.terms_accepted?"Yes":"No":"—"})]}),(0,e.jsxs)(Y,{$full:!0,children:[(0,e.jsx)(V,{children:"Items Returned with Body"}),(0,e.jsx)(ae,{$muted:!0,children:n?.items_returned||"None recorded"})]}),(0,e.jsxs)(Y,{$full:!0,children:[(0,e.jsx)(V,{children:"Notes"}),(0,e.jsx)(ae,{$muted:!0,children:n?.notes||"No notes recorded"})]})]}),(n?.signature||n?.staff_signature)&&(0,e.jsxs)(nt,{style:{marginBottom:24},children:[(0,e.jsxs)(De,{$mt0:!0,children:[(0,e.jsx)("span",{children:"05"})," Authorizing Signatures"]}),(0,e.jsxs)(Fe,{$cols:!0,children:[n?.signature&&(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Next of Kin Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(n.signature)?n.signature:`${X.API_GATEWAY_URL}${n.signature.startsWith("/")?"":"/"}${n.signature}`,alt:"Next of Kin Signature",style:{maxHeight:200,maxWidth:2200,width:"100%",objectFit:"contain",background:"white",padding:8},onError:y=>{y.currentTarget.style.display="none"}})]}),n?.staff_signature&&(0,e.jsxs)(Y,{children:[(0,e.jsx)(V,{children:"Staff Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(n.staff_signature)?n.staff_signature:`${X.API_GATEWAY_URL}${n.staff_signature.startsWith("/")?"":"/"}${n.staff_signature}`,alt:"Staff Signature",style:{maxHeight:170,maxWidth:460,width:"100%",objectFit:"contain",background:"white",border:`1px solid ${r.borderLight}`,borderRadius:6,padding:8},onError:y=>{y.currentTarget.style.display="none"}})]})]})]})]})},Wt=new Map,Va=3e4;function Xa(t){const s=Wt.get(t);return s&&Date.now()-s.ts<Va?s.data:null}function Za(t,s){Wt.set(t,{ts:Date.now(),data:s})}var ze=`${X.FULL_API_URL}/deceased`,Qa=qt`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`,Ht=he`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`,en=a.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a; 
  font-size: 14px; 
  line-height: 1.5;
  max-width: 1400px; 
  margin: 0 auto; 
  background: rgb(255, 255, 255);
  animation: ${Ht} 0.25s ease-out;
  padding: 1rem; /* Base padding for mobile */
  
  @media (min-width: 900px) {
    padding: 2rem; /* Desktop padding */
  }
`,tn=a.div`
  display: grid; 
  grid-template-columns: 1fr; /* Mobile first: single column */
  gap: 2rem; 
  align-items: flex-start;
  
  @media (min-width: 900px) { 
    grid-template-columns: 1fr 320px; 
    gap: 4rem;
  }
`,rn=a.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0; /* Remove fixed padding for mobile, rely on AppContainer */
  
  @media (min-width: 900px) {
    padding: 2rem 1rem; /* Add some breathing room on desktop */
  }
`,an=a.div`
  display: flex; 
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Safari and Chrome */
  }

  @media (min-width: 900px) {
    margin-bottom: 2.5rem;
  }
`,nn=a.button`
  padding: 0.75rem 0; 
  margin-right: 1.5rem;
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

  @media (min-width: 900px) {
    padding: 1rem 0;
    margin-right: 2.5rem;
  }
`,sn=a.div`
  display: grid;
  gap: 1.5rem;

  @media (min-width: 900px) {
    gap: 2.5rem;
  }
`,ve=a.div`
  display: ${t=>t.$active?"grid":"none"}; 
  gap: 1.5rem;
  animation: ${Ht} 0.2s ease;

  @media (min-width: 900px) {
    gap: 2.5rem;
  }
`;a.div`
  text-align: center; 
  padding: 5rem 0; 
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
  
  @media (min-width: 900px) {
    padding: 10rem 0;
  }
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
`;var on=[{key:"overview",label:"Overview"},{key:"postmortem",label:"Postmortem"},{key:"financials",label:"Financials"},{key:"release",label:"Release"},{key:"docs",label:"Documents"},{key:"audit",label:"Audit Log"}],Sn=()=>{const[t]=Nt(),s=Ut();let i=t.get("id")||s.id;const f=Oe(),[c,n]=(0,p.useState)("overview"),[b,S]=(0,p.useState)(!0),[o,d]=(0,p.useState)(null),[y,k]=(0,p.useState)(null),[I,j]=(0,p.useState)(null),[v,_]=(0,p.useState)([]),[P,B]=(0,p.useState)([]),[$,g]=(0,p.useState)([]),[q,T]=(0,p.useState)(!1),[F,z]=(0,p.useState)(!1),A=(0,p.useRef)(!0);(0,p.useEffect)(()=>()=>{A.current=!1},[]),(0,p.useEffect)(()=>{const C="noindex, nofollow, noarchive";let w=document.querySelector('meta[name="robots"]');const R=w?w.getAttribute("content"):null;return w?w.setAttribute("content",C):(w=document.createElement("meta"),w.name="robots",w.content=C,document.head.appendChild(w)),()=>{R!==null?w.setAttribute("content",R):w.remove()}},[]);const M=(0,p.useCallback)(async()=>{if(!i)return;const C=`${i}-${we()}`,w=Xa(C);if(w){w.deceased&&d(w.deceased),w.nextOfKin&&j(w.nextOfKin),w.postmortem&&k(w.postmortem),w.charges&&B(w.charges),w.payments&&_(w.payments),w.requests&&g(w.requests),S(!1);return}S(!0);try{const R=we(),O=$e?$e():localStorage.getItem("token")||"",l={"x-tenant-slug":R,Authorization:`Bearer ${O}`},D=await Promise.allSettled([ie.get(`${ze}/${i}`,{headers:l}),ie.get(`${ze}/postmortem/${i}`,{headers:l}).catch(()=>null),ie.get(`${ze}/${i}/next-of-kin`,{headers:l}).catch(()=>null),ie.get(`${X.FULL_API_URL}/documents/${i}`,{headers:{"x-tenant-slug":R,Authorization:O?`Bearer ${O}`:""},withCredentials:!1}).catch(()=>null),ie.get(`${ze}/billing-summary/${i}`,{headers:l}).catch(()=>null),ie.get(`${ze}/charge-settings/${i}`,{headers:l}).catch(()=>null),ie.get(`${X.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(i)}`,{headers:l}).catch(()=>null),ie.get(`${X.FULL_API_URL}/postmortem-requests`,{headers:l,params:{deceased_id:i}}).catch(()=>null)]);if(!A.current)return;const[K,se,Z,oe,h,W,Q,de]=D;if(K.status==="fulfilled"&&K.value?.data?.data){const u=K.value.data.data;u.admission_number||u.admission_no;const U={...u,admission_no:u.admission_number,admission_time:u.time_received,admitted_by:u.receiving_officer,time_of_death:null,attending_physician:u.physician,embalmed:u.admission_status==="embalmed",embalmed_date:null,storage_location:u.chamber_assigned,morgue_slot:u.chamber_assigned,body_condition:u.body_status,tel_number:u.phone_number,tell_no:u.phone_number};d(U)}se.status==="fulfilled"&&se.value?.data?.data&&k(se.value.data.data);let me=!1;if(Z.status==="fulfilled"&&Z.value){const u=Array.isArray(Z.value.data?.data)?Z.value.data.data:Z.value.data?.data?[Z.value.data.data]:[];u.length>0&&(j(u[0]),me=!0)}if(!me&&K.status==="fulfilled"){const u=K.value?.data?.data;u&&(u.contact_person||u.phone_number||u.relationship||u.national_id)&&j({full_name:u.contact_person||"",relationship:u.relationship||"",contact:u.tel_number||u.phone_number||"",alternative_contact:u.alternative_phone||"",id_number:u.national_id||"",email:u.email||"",is_primary:1,_synthetic:!0})}if(oe.status==="fulfilled"&&oe.value)if(oe.value.data?.files){const u=oe.value.data.files.map(U=>({name:U.originalName,file_name:U.storedName||U.originalName,type:U.category||"Document",created_at:U.uploadedAt||U.uploaded_at,document_id:U.documentId,url:U.url}));d(U=>U&&{...U,documents:u})}else oe.value.data?.data&&d(u=>u&&{...u,documents:oe.value.data.data});if(h.status==="fulfilled"&&h.value?.data?.data){const u=h.value.data.data;u.charges&&B(Array.isArray(u.charges)?u.charges:[u.charges]),u.payments&&_(Array.isArray(u.payments)?u.payments:[])}if(W.status==="fulfilled"&&W.value?.data?.data){const u=W.value.data.data;d(U=>U&&{...U,charges:{storage_rate:parseFloat(u.dailyRate??u.daily_rate??u.storage_rate??u.per_day??U?.charges?.storage_rate??500),per_day:parseFloat(u.dailyRate??u.daily_rate??U?.charges?.per_day??500),per_hour:parseFloat(u.hourlyRate??u.hourly_rate??U?.charges?.per_hour??125),currency:u.currency??U?.charges?.currency??"KES",rate_profile:u.rateProfile??u.rate_profile??"standard",charge_type:u.chargeType??u.charge_type??"daily",usd_rate:parseFloat(u.usdRate??u.usd_rate??U?.charges?.usd_rate??130),updated_at:u.updatedAt??u.updated_at??null}})}Q.status==="fulfilled"&&Q.value?.data?.data&&d(u=>u&&{...u,releaseData:Q.value.data.data}),de.status==="fulfilled"&&Array.isArray(de.value?.data?.data)&&g(de.value.data.data),Za(C,{deceased:K.status==="fulfilled"?K.value?.data?.data:null,nextOfKin:Z.status==="fulfilled"?Array.isArray(Z.value?.data?.data)?Z.value.data.data[0]:Z.value?.data?.data:null,postmortem:se.status==="fulfilled"?se.value?.data?.data:null,charges:h.status==="fulfilled"?h.value?.data?.data?.charges||[]:[],payments:h.status==="fulfilled"?h.value?.data?.data?.payments||[]:[],requests:de.status==="fulfilled"?de.value?.data?.data||[]:[]})}catch(R){console.error("Error fetching deceased detail:",R),le.error("Failed to load deceased details")}finally{A.current&&S(!1)}},[i]);(0,p.useEffect)(()=>{M()},[M]);const x=C=>n(C),E=(0,p.useMemo)(()=>P.reduce((C,w)=>C+parseFloat(w.amount||w.charge_amount||0),0),[P]),N=E-(0,p.useMemo)(()=>v.reduce((C,w)=>C+parseFloat(w.amount||0),0),[v]);return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Qa,{}),(0,e.jsxs)(en,{children:[(0,e.jsx)(Xt,{position:"top-right"}),(0,e.jsx)(Rr,{deceased:o,onBack:()=>{const C=we();f(`/tenant/${C}/all-deceased`)},onTabSwitch:x,onChargeSettingsClick:()=>T(!0),onRefresh:M,onScanClick:()=>z(!0)}),(0,e.jsxs)(tn,{children:[(0,e.jsxs)(rn,{children:[(0,e.jsx)(an,{children:on.map(C=>(0,e.jsx)(nn,{$active:c===C.key,onClick:()=>x(C.key),children:C.label},C.key))}),(0,e.jsxs)(sn,{children:[(0,e.jsx)(ve,{$active:c==="overview",children:(0,e.jsx)(Oa,{deceased:o,nextOfKin:I})}),(0,e.jsx)(ve,{$active:c==="postmortem",children:(0,e.jsx)(fa,{postmortem:y,deceasedId:i,deceasedName:o?.full_name||o?.name||"",deceasedAdmission:o?.admission_number||o?.admission_no||"",requests:$,onRequestsChanged:M})}),(0,e.jsx)(ve,{$active:c==="financials",children:(0,e.jsx)(Ca,{charges:P,payments:v,deceasedId:i})}),(0,e.jsx)(ve,{$active:c==="release",children:(0,e.jsx)(Ya,{deceased:o,nextOfKin:I,deceasedId:i})}),(0,e.jsx)(ve,{$active:c==="docs",children:(0,e.jsx)(za,{documents:o?.documents,deceasedId:i})}),(0,e.jsx)(ve,{$active:c==="audit",children:(0,e.jsx)(Ha,{deceased:o,postmortem:y,charges:P,payments:v,releaseData:o?.releaseData||null,requests:$})})]})]}),(0,e.jsx)(oa,{deceased:o,postmortem:y,bodyStatus:o?.body_status||o?.status||"In Morgue",totalCharges:E,balance:N,age:o?.age})]}),F&&(0,e.jsx)(qa,{deceasedId:i,deceasedName:o?.full_name||o?.name||"",onClose:()=>z(!1),onScanned:()=>{z(!1),M()}}),q&&(0,e.jsx)(Qr,{isOpen:q,onClose:()=>T(!1),deceasedId:i,deceasedData:o,onUpdate:M})]})]})};export{Sn as default};
