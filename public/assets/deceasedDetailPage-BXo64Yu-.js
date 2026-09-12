import{r as Jt}from"./chunk-CXHxssQy.js";import{y as Yt}from"./chunk-CXAmgOhv.js";import{i as Ut,l as Ke,u as qt}from"./chunk-DWc5g_hH.js";import{_ as a,h as Mt,m as me}from"./chunk-DJYPtS2Y.js";import{a as We,i as Vt,o as Xt}from"./chunk-CwzAxjA3.js";import{o as Zt}from"./chunk-BY9AVXEY.js";import{t as ae}from"./chunk-eZ3__Fgx.js";import{c as Se,n as we}from"./chunk-C935kdjU.js";import{t as V}from"./chunk-BUeZRQuQ.js";import{Ft as lt,I as He,K as Qt,Mn as Ge,R as dt,Un as Ot,d as ct,f as pe,h as pt,i as he,in as st,j as er,t as tr,tn as Je,ut as rr}from"./index-DNPiyDLN.js";import{a as Ye}from"./chunk-N6-xod2j.js";import{t as le}from"./chunk-D61LeRbQ.js";import{r as ar,t as nr}from"./chunk-B-oXcbbw.js";import{i as ir,n as re,r as sr,t as r}from"./chunk-B9F-LUG6.js";import{t as ue}from"./chunk-CizeQYCt.js";import{t as or}from"./chunk-BCWj3ww52.js";var p=Jt(Yt(),1),e=Zt(),ut="leaflet-css-cdn";if(!document.getElementById(ut)){const t=document.createElement("link");t.id=ut,t.rel="stylesheet",t.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",document.head.appendChild(t)}var lr=me`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`,Ve=[{id:"lee",name:"Lee Funeral Home, Nairobi",lat:-1.2954,lng:36.8078},{id:"chiromo",name:"Chiromo Funeral Parlour",lat:-1.2758,lng:36.8066},{id:"ku",name:"K.U. Funeral Home, Kiambu",lat:-1.1824,lng:36.9272},{id:"umash-nrb",name:"Umash Funeral Home, Nairobi",lat:-1.2921,lng:36.8041},{id:"umash-nkr",name:"Umash Funeral Home, Nakuru",lat:-.2833,lng:36.0667},{id:"jocham",name:"Jocham Mortuary, Mombasa",lat:-4.0416,lng:39.6706},{id:"eldoret",name:"Moi Teaching Mortuary, Eldoret",lat:.5204,lng:35.2863}],dr=[{name:"Nakuru",lat:-.3031,lng:36.08},{name:"Eldoret",lat:.5143,lng:35.2698},{name:"Kisumu",lat:-.0917,lng:34.768},{name:"Nyeri",lat:-.4226,lng:36.9389}],cr=a.div`
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
`,Xe=a.div` padding: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); `,ge=a.label`
  font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888;
  display: block; margin-bottom: 6px;
  span { color: #4fc3f7; font-weight: normal; text-transform: none; margin-left: 6px; }
`,xt=a.div` display: flex; gap: 8px; margin-bottom: 12px; `,be=a.input`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
  &:focus { outline: none; border-color: #4fc3f7; }
`,mr=a.select`
  flex: 1; height: 40px; background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px; padding: 0 12px; color: #fff; font-size: 14px;
`,Le=a.button`
  height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; border: none; white-space: nowrap; transition: 0.15s;
  background: ${t=>t.$variant==="success"?"#10b981":t.$variant==="whatsapp"?"#25D366":t.$variant==="outline"?"transparent":"#4fc3f7"};
  color: ${t=>t.$variant==="outline"?"#4fc3f7":t.$variant==="whatsapp"||t.$variant==="success"?"#fff":"#000"};
  border: ${t=>t.$variant==="outline"?"1px solid #4fc3f7":"none"};
  &:hover { opacity: 0.9; }
  &:disabled { background: #333; color: #666; cursor: not-allowed; }
`,fr=a.div`
  display: flex; background: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12);
`,gt=a.button`
  flex: 1; height: 38px; border: none; font-size: 13px; font-weight: 600; cursor: pointer;
  background: ${t=>t.$active?"#4fc3f7":"transparent"};
  color: ${t=>t.$active?"#000":"#888"}; transition: 0.2s;
`,br=a.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
`,ht=a.div`
  background: #161616; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; text-align: center;
  div:first-child { font-size: 18px; font-weight: 700; color: #4fc3f7; }
  div:last-child { font-size: 10px; text-transform: uppercase; color: #888; margin-top: 4px; }
`,yr=a.div`
  background: #161616; border: 1px solid rgba(79, 195, 247, 0.3); border-radius: 10px; padding: 16px;
  animation: ${lr} 0.3s ease; margin-top: 8px;
`,Ae=a.div`
  display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;
  color: ${t=>t.$bold?"#fff":"#aaa"}; font-weight: ${t=>t.$bold?"700":"400"};
  border-bottom: ${t=>t.$divider?"1px dashed rgba(255,255,255,0.1)":"none"};
  margin-bottom: ${t=>t.$divider?"8px":"0"};
`,jr=a.div`
  display: flex; align-items: center; gap: 8px; background: rgba(79, 195, 247, 0.1);
  padding: 8px; border-radius: 8px; border: 1px dashed #4fc3f7; margin-bottom: 12px;
  Input { height: 32px; width: 80px; text-align: center; font-weight: bold; font-size: 15px; color: #4fc3f7; border-color: #4fc3f7; background: #1a1a1a; }
`;function Kt({onClose:t}){const[o,i]=(0,p.useState)(Ve[0]),[b,c]=(0,p.useState)(""),[n,y]=(0,p.useState)(""),[k,s]=(0,p.useState)(null),[l,j]=(0,p.useState)("round"),[_,I]=(0,p.useState)(1),[v,$]=(0,p.useState)(5e3),[C,E]=(0,p.useState)(100),[P,w]=(0,p.useState)(3e3),[g,U]=(0,p.useState)(0),[F,R]=(0,p.useState)(0),[D,T]=(0,p.useState)(!1),K=(0,p.useRef)(null),x=(0,p.useRef)(null),L=(0,p.useRef)(null),B=(0,p.useRef)(null);(0,p.useEffect)(()=>{if(!K.current)return;(async()=>{if(window.L||await new Promise(O=>{const X=document.createElement("script");X.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",X.onload=O,document.body.appendChild(X)}),!x.current&&window.L){const O=window.L,X=O.map(K.current).setView([o.lat,o.lng],10);O.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(X),B.current=O.layerGroup().addTo(X),x.current=X,q(o)}})()},[]);const q=m=>{!x.current||!window.L||(B.current.clearLayers(),L.current&&x.current.removeLayer(L.current),window.L.marker([m.lat,m.lng]).addTo(B.current).bindPopup(`<b>${m.name}</b><br/>Origin`).openPopup(),x.current.setView([m.lat,m.lng],12),s(null),U(0))},A=m=>{const O=Ve.find(X=>X.id===m.target.value);i(O),q(O)},h=async(m,O,X)=>{T(!0),y(X),s({lat:m,lng:O});try{const xe=await(await fetch(`https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${O},${m}?overview=full&geometries=geojson`)).json();if(xe.routes&&xe.routes[0]){const de=xe.routes[0];if(U(Number((de.distance/1e3).toFixed(1))),R(Math.round(de.duration/60)),x.current&&window.L){const fe=window.L,u=x.current;L.current&&u.removeLayer(L.current),B.current.clearLayers(),fe.marker([o.lat,o.lng]).addTo(B.current),fe.marker([m,O]).addTo(B.current).bindPopup(`<b>${X}</b>`).openPopup();const N=de.geometry.coordinates.map(ot=>[ot[1],ot[0]]);L.current=fe.polyline(N,{color:"#4fc3f7",weight:5,opacity:.8}).addTo(u),u.fitBounds(L.current.getBounds(),{padding:[40,40]})}}}catch{alert("Routing failed.")}finally{T(!1)}},M=async()=>{if(b.trim()){T(!0);try{const m=await(await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(b+", Kenya")}&countrycodes=ke&limit=1`)).json();m&&m.length>0?h(parseFloat(m[0].lat),parseFloat(m[0].lon),m[0].display_name.split(",")[0]):alert("Location not found.")}catch{alert("Search failed.")}finally{T(!1)}}},d=g*(l==="round"?2:1),S=d*C,ie=Math.max(0,_-1),se=ie*P,oe=v+S+se,ne=()=>{if(!k)return;const m=`https://www.google.com/maps/search/?api=1&query=${k.lat},${k.lng}`,O=`🚗 *HEARSE DISPATCH ORDER*

*From:* ${o.name}
*To:* ${n}

*Trip Details:*
• Type: ${l==="round"?"Round Trip (To & From)":"One-Way Dropoff"}
• Duration: ${_} Day(s)
• One-Way Distance: ${g} km
• Billable Distance: ${d} km

📍 *Navigate via Google Maps:*
${m}`;window.open(`https://wa.me/?text=${encodeURIComponent(O)}`,"_blank")};return(0,e.jsx)(cr,{onClick:m=>m.target===m.currentTarget&&t?.(),children:(0,e.jsxs)(pr,{children:[(0,e.jsxs)(ur,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)("h2",{style:{margin:0,fontSize:18},children:"Pro Dispatch & Logistics"}),(0,e.jsx)("p",{style:{margin:"2px 0 0",fontSize:12,color:"#4fc3f7"},children:"One-Way View & Editable Mileage"})]}),(0,e.jsx)(Le,{$variant:"outline",onClick:t,style:{width:32,height:32,padding:0,borderRadius:"50%"},children:"✕"})]}),(0,e.jsxs)(xr,{children:[(0,e.jsx)(gr,{children:(0,e.jsx)("div",{ref:K,style:{width:"100%",height:"100%",zIndex:1}})}),(0,e.jsxs)(hr,{children:[(0,e.jsxs)(Xe,{children:[(0,e.jsx)(ge,{children:"1. Origin (Funeral Home)"}),(0,e.jsx)(mr,{value:o.id,onChange:A,style:{width:"100%",marginBottom:12},children:Ve.map(m=>(0,e.jsx)("option",{value:m.id,children:m.name},m.id))}),(0,e.jsx)(ge,{children:"2. Destination Search"}),(0,e.jsxs)(xt,{children:[(0,e.jsx)(be,{placeholder:"e.g. Nakuru, Eldoret...",value:b,onChange:m=>c(m.target.value),onKeyDown:m=>m.key==="Enter"&&M()}),(0,e.jsx)(Le,{onClick:M,disabled:D,children:D?"...":"Find"})]}),(0,e.jsx)("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:dr.map(m=>(0,e.jsx)("button",{onClick:()=>{c(m.name),h(m.lat,m.lng,m.name)},style:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",padding:"4px 10px",borderRadius:12,fontSize:11,cursor:"pointer"},children:m.name},m.name))})]}),(0,e.jsxs)(Xe,{children:[(0,e.jsx)(ge,{children:"3. Trip Parameters"}),(0,e.jsxs)(xt,{children:[(0,e.jsxs)(fr,{style:{flex:1},children:[(0,e.jsx)(gt,{$active:l==="one-way",onClick:()=>j("one-way"),children:"One-Way Dropoff"}),(0,e.jsx)(gt,{$active:l==="round",onClick:()=>j("round"),children:"Round Trip"})]}),(0,e.jsx)(be,{type:"number",min:"1",value:_,onChange:m=>I(parseInt(m.target.value)||1),style:{width:70,flex:"none"},title:"Days"})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,marginTop:12},children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(ge,{children:"Base (KES)"}),(0,e.jsx)(be,{type:"number",value:v,onChange:m=>$(Number(m.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(ge,{children:"Rate/KM"}),(0,e.jsx)(be,{type:"number",value:C,onChange:m=>E(Number(m.target.value))})]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(ge,{children:"Per Night"}),(0,e.jsx)(be,{type:"number",value:P,onChange:m=>w(Number(m.target.value))})]})]})]}),(0,e.jsxs)(Xe,{style:{flex:1,border:"none",background:"#0a0a0a"},children:[!k&&!D&&(0,e.jsx)("div",{style:{color:"#666",textAlign:"center",marginTop:20},children:"Search a destination to display distances."}),D&&(0,e.jsx)("div",{style:{color:"#4fc3f7",textAlign:"center",marginTop:20},children:"Plotting route..."}),k&&!D&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(br,{children:[(0,e.jsxs)(ht,{children:[(0,e.jsxs)("div",{children:[F," Mins"]}),(0,e.jsx)("div",{children:"Duration (One-Way)"})]}),(0,e.jsxs)(ht,{children:[(0,e.jsx)("div",{children:l==="round"?`${d} km`:`${g} km`}),(0,e.jsx)("div",{children:"Total Billable KM"})]})]}),(0,e.jsxs)(jr,{children:[(0,e.jsx)("div",{style:{flex:1},children:(0,e.jsxs)(ge,{style:{margin:0,color:"#fff"},children:["One-Way Distance (KM) ",(0,e.jsx)("span",{children:"(Editable)"})]})}),(0,e.jsx)(be,{type:"number",value:g,onChange:m=>U(Number(m.target.value))})]}),(0,e.jsxs)(yr,{children:[(0,e.jsxs)("div",{style:{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12},children:["📍 Invoice: ",n]}),(0,e.jsxs)(Ae,{children:[(0,e.jsx)("span",{children:"Base Dispatch Fee"}),(0,e.jsxs)("span",{children:["KES ",v.toLocaleString()]})]}),(0,e.jsxs)(Ae,{children:[(0,e.jsxs)("span",{children:["Mileage (",d," km × KES ",C,")"]}),(0,e.jsxs)("span",{children:["KES ",S.toLocaleString()]})]}),ie>0&&(0,e.jsxs)(Ae,{children:[(0,e.jsxs)("span",{children:["Overnight Allowance (",ie," nights)"]}),(0,e.jsxs)("span",{children:["KES ",se.toLocaleString()]})]}),(0,e.jsxs)(Ae,{$bold:!0,$divider:!0,style:{marginTop:12},children:[(0,e.jsx)("span",{children:"Total Invoice"}),(0,e.jsxs)("span",{style:{fontSize:18,color:"#10b981"},children:["KES ",oe.toLocaleString()]})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:12,marginTop:16},children:[(0,e.jsx)(Le,{$variant:"whatsapp",style:{flex:1},onClick:ne,children:"WA to Driver"}),(0,e.jsx)(Le,{$variant:"success",style:{flex:1},onClick:()=>alert(`Confirmed. Total: KES ${oe.toLocaleString()}`),children:"Confirm Booking"})]})]})]})]})]})]})})}var vr=a.button`
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
`,Ze=a.button`
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
`,mt=a.span`
  font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; color: ${r.black};
`,Cr=({value:t})=>{const o=p.useRef(null);return p.useEffect(()=>{if(o.current)try{Vt.toCanvas(o.current,{bcid:"code128",text:t||"AWAITING-ID",scale:2,height:8,includetext:!1,paddingwidth:0,paddingheight:0})}catch(i){console.error("Barcode generation error:",i)}},[t]),(0,e.jsx)("canvas",{ref:o,style:{display:"block",width:"auto",height:"40px"}})},Rr=({deceased:t,onBack:o,onTabSwitch:i,onChargeSettingsClick:b,onRefresh:c,onScanClick:n})=>{const y=Ke(),[k]=Ut(),s=qt(),l=k.get("id")||s.id,[j,_]=(0,p.useState)(!1),I=t?.deceased_id||t?.id,v=t?.admission_number||t?.admission_no||"—",$=()=>{let C=localStorage.getItem("tenantSlug")||"";if(!C||C==="dashboard"||C==="default"){const E=localStorage.getItem("user"),P=E?JSON.parse(E):{};C=P?.parentTenantSlug||P?.tenantSlug||C}y(`/tenant/${C}/release-form/${l||I}`,{state:{deceasedData:t}})};return(0,e.jsxs)(e.Fragment,{children:[j&&(0,e.jsx)(Kt,{onClose:()=>_(!1)}),(0,e.jsx)(vr,{onClick:o,children:"← Back to List"}),(0,e.jsxs)($r,{children:[(0,e.jsx)("div",{style:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:4},children:[(0,e.jsx)(_r,{title:"Admission barcode",children:(0,e.jsx)(Cr,{value:v!=="—"?v:"AWAITING-ID"})}),(0,e.jsx)(mt,{style:{fontWeight:700,fontSize:11},children:I}),(0,e.jsx)(mt,{style:{fontWeight:400,fontSize:10,opacity:.7},children:v!=="—"?v:"AWAITING-ID"})]})}),(0,e.jsxs)(wr,{children:[(0,e.jsxs)(kr,{onClick:c,children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Refresh"]}),(0,e.jsxs)(Sr,{onClick:()=>_(!0),children:[(0,e.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:[(0,e.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,e.jsx)("circle",{cx:"12",cy:"10",r:"3"})]}),"Route Calculations"]}),(0,e.jsxs)(Ze,{onClick:n,title:"Scan a paper document and upload it straight to this profile's documents",children:[(0,e.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 64 64",fill:"none",stroke:"currentColor",strokeWidth:"5",children:(0,e.jsx)("path",{d:"M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z",transform:"translate(1,0)"})}),"Scan Docs"]}),b&&(0,e.jsx)(Ze,{$primary:!0,onClick:b,children:"⚙️ Charge Settings"}),(0,e.jsx)(Ze,{$danger:!0,onClick:$,children:"Release Body"})]})]})]})};V.API_URL;var Dr=Mt`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@300;400;500;600&display=swap');
`,f={ink:"#16211E",pine:"#1F3D33",moss:"#3E6257",gold:"#C6A15B",goldSoft:"#F3EBD9",cream:"#F6F4EE",paper:"#FFFFFF",line:"#E6E1D5",lineSoft:"#EFECE3",muted:"#8B8677",text:"#232A27",textLight:"#C4BFAF",ease:"cubic-bezier(.32, .72, .24, 1)"};me`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;var Fr=a.div`
  position: fixed;
  inset: 0;
  background: rgba(22, 33, 30, .45);
  backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: opacity .35s ${f.ease}, visibility .35s;
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
  background: ${f.paper};
  box-shadow: -24px 0 60px -18px rgba(22, 33, 30, .35);
  border-radius: 16px 0 0 16px;
  transform: translateX(calc(100% + 40px));
  transition: transform .45s ${f.ease};
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
  border: 1px solid ${f.line};
  background: ${f.paper};
  color: ${f.muted};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all .25s;

  &:hover {
    border-color: ${f.pine};
    color: ${f.pine};
  }
`,Ar=a.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  scrollbar-width: thin;
  scrollbar-color: ${f.line} transparent;
`;a.footer`
  padding: 13px 22px 16px;
  border-top: 1px solid ${f.lineSoft};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${f.paper};
`;var Er=a.div`
  font-size: 9.5px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: ${f.gold};
  font-weight: 600;
  margin-bottom: 3px;
`,Pr=a.h2`
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 600;
  color: ${f.ink};
`,Ee=a.div`
  margin-bottom: 18px;
`,Pe=a.div`
  font-size: 9.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: ${f.muted};
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${f.lineSoft};
  }
`,Ir=a.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: ${f.cream};
  padding: 3px;
`,Br=a.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  background: ${f.pine};
  border-radius: 8px;
  transition: transform .3s ${f.ease};
  transform: ${t=>t.$isHourly?"translateX(100%)":"translateX(0)"};
`,ft=a.button`
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
  color: ${t=>t.$active?"#F3EFE4":f.muted};
  transition: color .25s;

`,Nr=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`,bt=a.label`
  position: relative;
  padding: 11px 12px;
  cursor: pointer;
  transition: all .2s ${f.ease};
  background: ${t=>t.$selected?`linear-gradient(150deg, #fff 55%, ${f.goldSoft})`:f.paper};

  &:hover {
    border-color: ${f.moss};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`,yt=a.span`
  font-family: 'Fraunces', serif;
  font-size: 14.5px;
  font-weight: 600;
  color: ${f.ink};
  display: block;
`,jt=a.span`
  font-size: 10.5px;
  color: ${f.muted};
  display: block;
  margin-top: 1px;
`,vt=a.span`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${f.pine};
  color: ${f.gold};
  display: grid;
  place-items: center;
  opacity: ${t=>t.$selected?1:0};
  transform: ${t=>t.$selected?"scale(1)":"scale(.5)"};
  transition: all .2s ${f.ease};
`,$t=a.div`
  display: flex;
  align-items: center;
  background: ${f.cream};
  border: 1px solid ${f.line};
  border-radius: 10px;
  transition: all .2s;

  &:focus-within {
    border-color: ${f.pine};
    background: ${f.paper};
    box-shadow: 0 0 0 3px rgba(31, 61, 51, .06);
  }
`,wt=a.span`
  padding: 10px 3px 10px 13px;
  font: 600 12.5px 'Outfit', sans-serif;
  color: ${f.muted};
  flex-shrink: 0;
`,St=a.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  outline: none;
  font: 500 14.5px 'Outfit', sans-serif;
  color: ${f.ink};
  padding: 10px 4px;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: ${f.textLight};
    font-weight: 300;
  }
`,kt=a.span`
  padding: 10px 13px 10px 3px;
  font-size: 11.5px;
  color: ${f.muted};
  flex-shrink: 0;
`,_t=a.p`
  font-size: 11px;
  color: ${f.muted};
  margin-top: 6px;
  padding-left: 2px;
  font-weight: 300;
`,Ur=a.div`
  background: ${f.pine};
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
  color: ${f.gold};
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
`,Qe=a.div`
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
  border-top: 1px solid ${f.lineSoft};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: ${f.paper};
`,Wt=a.button`
  flex: 1;
  padding: 10px 10px;
  border-radius: 10px;
  font: 600 13px 'Outfit', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all .2s ${f.ease};
`,Hr=a(Wt)`
  background: none;
  border: 1px solid ${f.line};
  color: ${f.muted};

  &:hover {
    border-color: ${f.pine};
    color: ${f.pine};
  }
`,Gr=a(Wt)`
  background: ${f.ink};
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
    color: ${f.gold};
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
  border-bottom: 1px solid ${f.lineSoft};
  padding-bottom: 16px;
  margin-bottom: 18px;
`,Vr=a.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${f.pine};
  color: ${f.gold};
  display: grid;
  place-items: center;
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`,Xr=a.div`
  font-weight: 600;
  font-size: 13.5px;
  color: ${f.ink};
`,Zr=a.div`
  font-size: 11.5px;
  color: ${f.muted};
`,Qr=({isOpen:t,onClose:o,deceasedId:i,deceasedData:b,onUpdate:c})=>{const[n,y]=(0,p.useState)({rateProfile:"standard",currency:"KES",chargeType:"daily",dailyRate:"",hourlyRate:"",usdRate:""}),[k,s]=(0,p.useState)(!1),[l,j]=(0,p.useState)(!1);(0,p.useEffect)(()=>{if(!t||!i)return;(async()=>{j(!0);try{const R=await he.get(ct.DECEASED.CHARGE_SETTINGS(i));if(R.data?.success){const D=R.data.data;y({rateProfile:D.rateProfile||"standard",currency:D.currency||"KES",chargeType:D.chargeType||"daily",dailyRate:D.dailyRate||"",hourlyRate:D.hourlyRate||"",usdRate:D.usdRate||"130"})}}catch(R){console.error("Error fetching charge settings:",R),We.error(R.response?.data?.message||"Failed to load charge settings")}finally{j(!1)}})()},[t,i]);const _=F=>{const{name:R,value:D}=F.target;if(R==="dailyRate"||R==="hourlyRate"||R==="usdRate"){let T=D.replace(/[^\d]/g,"").replace(/^0+/,"");T=T===""?"":parseInt(T,10),y(K=>({...K,[R]:T}))}else y(T=>({...T,[R]:D}))},I=F=>{y(R=>({...R,chargeType:F}))},v=F=>{y(R=>({...R,currency:F}))},$=async F=>{if(F.preventDefault(),!!i){s(!0);try{const R=n.dailyRate===""?0:parseInt(n.dailyRate,10),D=n.hourlyRate===""?0:parseInt(n.hourlyRate,10),T=n.usdRate===""?0:parseInt(n.usdRate,10);if(n.chargeType==="daily"&&(!R||R<=0))throw new Error("Please enter a valid daily rate.");if(n.chargeType==="hourly"&&(!D||D<=0))throw new Error("Please enter a valid hourly rate.");if(n.currency==="USD"&&(!T||T<=0))throw new Error("Please enter a valid USD exchange rate.");const K={rateProfile:n.rateProfile,currency:n.currency,chargeType:n.chargeType,dailyRate:R,hourlyRate:D,usdRate:T},x=await he.put(ct.DECEASED.UPDATE_CHARGE_SETTINGS(i),K);if(x.data?.success)We.success("Charge configuration saved."),c&&c(),o();else throw new Error(x.data?.message||"Failed to update charge settings")}catch(R){console.error("Update error:",R),We.error(R.response?.data?.message||R.message||"Failed to update settings")}finally{s(!1)}}},C=()=>{if(!b?.date_admitted)return 0;const F=new Date(b.date_admitted);if(isNaN(F.getTime()))return 0;const R=T=>new Date(T.getFullYear(),T.getMonth(),T.getDate()).getTime(),D=Math.floor((R(new Date)-R(F))/864e5);return Math.max(0,D)},E={KES:"KSh",USD:"$"},P=F=>F?parseInt(F,10).toLocaleString("en-US"):"",w=F=>F?`${E[n.currency]} ${parseInt(F,10).toLocaleString("en-US")}`:"Not set",g=n.chargeType==="daily"?n.dailyRate:n.hourlyRate,U=g?n.chargeType==="daily"?g*30:g*24*30:0;return t?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Dr,{}),(0,e.jsx)(Fr,{onClick:o}),(0,e.jsxs)(zr,{className:"open",role:"dialog","aria-modal":"true","aria-label":"Charge configuration",children:[(0,e.jsxs)(Tr,{children:[(0,e.jsxs)("div",{children:[(0,e.jsxs)(Er,{children:[i," · Billing"]}),(0,e.jsx)(Pr,{children:"Charge configuration"})]}),(0,e.jsx)(Lr,{onClick:o,"aria-label":"Close",children:(0,e.jsx)(Ot,{size:13})})]}),(0,e.jsxs)(Ar,{children:[(0,e.jsxs)(Yr,{children:[(0,e.jsx)(Vr,{children:b?.full_name?.charAt(0)||"C"}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Xr,{children:b?.full_name||"Client"}),(0,e.jsxs)(Zr,{children:["Admitted ",b?.date_admitted?new Date(b.date_admitted).toLocaleDateString():"—"," · ",C()," days in morgue"]})]})]}),(0,e.jsxs)("form",{onSubmit:$,children:[(0,e.jsxs)(Ee,{children:[(0,e.jsx)(Pe,{children:"Charge frequency"}),(0,e.jsxs)(Ir,{children:[(0,e.jsx)(Br,{$isHourly:n.chargeType==="hourly"}),(0,e.jsxs)(ft,{type:"button",$active:n.chargeType==="daily",onClick:()=>I("daily"),children:[(0,e.jsx)(er,{size:13}),"Per day"]}),(0,e.jsxs)(ft,{type:"button",$active:n.chargeType==="hourly",onClick:()=>I("hourly"),children:[(0,e.jsx)(Qt,{size:13}),"Per hour"]})]})]}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(Pe,{children:"Currency"}),(0,e.jsxs)(Nr,{children:[(0,e.jsxs)(bt,{$selected:n.currency==="KES",onClick:()=>v("KES"),children:[(0,e.jsx)("input",{type:"radio",name:"currency",value:"KES",checked:n.currency==="KES",onChange:()=>v("KES")}),(0,e.jsx)(yt,{children:"KES"}),(0,e.jsx)(jt,{children:"Kenyan Shilling"}),(0,e.jsx)(vt,{$selected:n.currency==="KES",children:(0,e.jsx)(He,{size:9})})]}),(0,e.jsxs)(bt,{$selected:n.currency==="USD",onClick:()=>v("USD"),children:[(0,e.jsx)("input",{type:"radio",name:"currency",value:"USD",checked:n.currency==="USD",onChange:()=>v("USD")}),(0,e.jsx)(yt,{children:"USD"}),(0,e.jsx)(jt,{children:"US Dollar"}),(0,e.jsx)(vt,{$selected:n.currency==="USD",children:(0,e.jsx)(He,{size:9})})]})]})]}),(0,e.jsxs)(Ee,{children:[(0,e.jsx)(Pe,{children:n.chargeType==="daily"?"Daily rate":"Hourly rate"}),(0,e.jsxs)($t,{children:[(0,e.jsx)(wt,{children:E[n.currency]}),(0,e.jsx)(St,{type:"text",inputMode:"numeric",name:n.chargeType==="daily"?"dailyRate":"hourlyRate",value:P(g),onChange:_,placeholder:n.chargeType==="daily"?"4,000":"200"}),(0,e.jsxs)(kt,{children:["/ ",n.chargeType==="daily"?"day":"hour"]})]}),(0,e.jsx)(_t,{children:n.chargeType==="daily"?"Charged once for each day in care.":"Charged for every hour in care."})]}),n.currency==="USD"&&(0,e.jsxs)(Ee,{children:[(0,e.jsx)(Pe,{children:"Exchange rate"}),(0,e.jsxs)($t,{children:[(0,e.jsx)(wt,{children:"1 USD ="}),(0,e.jsx)(St,{type:"text",inputMode:"numeric",name:"usdRate",value:P(n.usdRate),onChange:_,placeholder:"130"}),(0,e.jsx)(kt,{children:"KES"})]}),(0,e.jsx)(_t,{children:"Converts USD charges for local statements."})]}),(0,e.jsxs)(Ur,{children:[(0,e.jsx)(qr,{children:"Billing summary"}),(0,e.jsxs)(Mr,{children:[g?`${w(g)}`:"Not set"," ",(0,e.jsxs)("small",{children:["/ ",n.chargeType==="daily"?"day":"hour"]})]}),(0,e.jsx)(Or,{children:g?`Estimated 30-day charge · ${w(U)}`:"Enter a rate to see a projection."}),(0,e.jsxs)(Kr,{children:[(0,e.jsxs)(Qe,{children:[(0,e.jsx)("span",{children:"Frequency"}),(0,e.jsx)("span",{children:n.chargeType==="daily"?"Daily":"Hourly"})]}),(0,e.jsxs)(Qe,{children:[(0,e.jsx)("span",{children:"Currency"}),(0,e.jsx)("span",{children:n.currency})]}),n.currency==="USD"&&n.usdRate&&(0,e.jsxs)(Qe,{children:[(0,e.jsx)("span",{children:"Exchange rate"}),(0,e.jsxs)("span",{children:[P(n.usdRate)," KES"]})]})]})]}),(0,e.jsxs)(Wr,{children:[(0,e.jsx)(Hr,{type:"button",onClick:o,children:"Discard"}),(0,e.jsx)(Gr,{type:"submit",disabled:k,children:k?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Jr,{children:(0,e.jsx)(st,{size:14})}),"Saving…"]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(He,{size:14}),"Save configuration"]})})]})]})]})]})]}):null},ea=a.div`
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
`,Ie=a.div`background: white; padding: 12px 8px; text-align: center;`,Be=a.div`
  font-size: 16px; font-weight: 700; color: ${t=>t.$color||r.black};
`,Ne=a.div`
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: ${r.gray}; margin-top: 4px;
`,ke=a.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px dashed ${r.borderLight}; font-size: 13px;
  color: ${r.mid};
  &:last-child { border-bottom: none; }
  strong { color: ${t=>t.$highlight?r.danger:r.black}; font-weight: 700; }
`,sa=a.p`
  font-size: 11px; color: ${r.gray}; margin: 10px 0 0; line-height: 1.5;
`,et=a.div`
  margin-bottom: 24px;
  h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${r.black}; margin-bottom: 12px; letter-spacing: 0.05em; }
`,Ct=a.div`
  display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid ${r.borderLight};
  &:last-child { border-bottom: none; }
`,Rt=a.div`
  width: 28px; height: 28px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 14px; font-weight: bold;
  background: ${t=>t.$warning?r.warningBg:r.infoBg};
  color: ${t=>t.$warning?r.warning:r.info};
`,Dt=a.div`font-size: 12px; color: ${r.mid}; line-height: 1.4;`,Ft=a.div`font-size: 10px; color: ${r.lightGray}; margin-top: 2px;`,_e=a.div`
  display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;
`,Ce=a.div`
  width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
  background: ${t=>t.$done?r.success:t.$active?r.warning:r.border};
`,Re=a.div`
  font-size: 13px; font-weight: 600; color: ${t=>t.$muted?r.gray:r.dark};
`,De=a.div`font-size: 11px; color: ${r.gray};`,oa=({deceased:t,postmortem:o,bodyStatus:i,totalCharges:b,balance:c,age:n})=>{const y=t?.full_name||t?.name||"Unknown",k=t?.sex||t?.gender||"",s=k.toLowerCase()==="female",l=sr(t?.date_admitted||t?.admission_date||t?.created_at),j=parseFloat(t?.charges?.storage_rate)||500,_=Math.round(l*j);return(0,e.jsxs)(ea,{children:[(0,e.jsxs)(ta,{children:[(0,e.jsx)(ra,{$female:s,children:ir(y)}),(0,e.jsxs)("div",{children:[(0,e.jsx)(aa,{children:y}),(0,e.jsxs)(na,{children:[k?`${k}, `:"",n?`${n} Years`:""]})]})]}),(0,e.jsxs)(ia,{children:[(0,e.jsxs)(Ie,{children:[(0,e.jsx)(Be,{$color:r.warning,children:l}),(0,e.jsx)(Ne,{children:"Days in Morgue"})]}),(0,e.jsxs)(Ie,{children:[(0,e.jsx)(Be,{children:n||"—"}),(0,e.jsx)(Ne,{children:"Age"})]}),(0,e.jsxs)(Ie,{children:[(0,e.jsxs)(Be,{children:[b,"K"]}),(0,e.jsx)(Ne,{children:"Charges (KES)"})]}),(0,e.jsxs)(Ie,{children:[(0,e.jsxs)(Be,{$color:r.danger,children:[c,"K"]}),(0,e.jsx)(Ne,{children:"Balance (KES)"})]})]}),(0,e.jsxs)(et,{children:[(0,e.jsx)("h3",{children:"Storage Charges"}),(0,e.jsxs)(ke,{children:[(0,e.jsx)("span",{children:"Days in morgue"}),(0,e.jsxs)("strong",{children:[l," day",l===1?"":"s"]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)("span",{children:"Daily storage rate"}),(0,e.jsxs)("strong",{children:["KES ",j.toLocaleString()]})]}),(0,e.jsxs)(ke,{$highlight:!0,children:[(0,e.jsx)("span",{children:"Storage charge so far"}),(0,e.jsxs)("strong",{children:["KES ",_.toLocaleString()]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)("span",{children:"Total charges (all services)"}),(0,e.jsxs)("strong",{children:[b,"K"]})]}),(0,e.jsxs)(ke,{children:[(0,e.jsx)("span",{children:"Balance"}),(0,e.jsxs)("strong",{children:[c,"K"]})]}),(0,e.jsx)(sa,{children:"Storage charge = days in morgue × daily rate (set under Charge Settings). Embalming and extra charges are listed under the Financials tab."})]}),(0,e.jsxs)(et,{children:[(0,e.jsx)("h3",{children:"Notifications"}),l>7&&(0,e.jsxs)(Ct,{children:[(0,e.jsx)(Rt,{$warning:!0,children:"!"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Dt,{children:["Body has been in the morgue for ",l," days. Please contact next of kin."]}),(0,e.jsx)(Ft,{children:"Active"})]})]}),(0,e.jsxs)(Ct,{children:[(0,e.jsx)(Rt,{$info:!0,children:"i"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Dt,{children:["Record status: ",i]}),(0,e.jsxs)(Ft,{children:["Updated ",re(t?.updated_at)]})]})]})]}),(0,e.jsxs)(et,{children:[(0,e.jsx)("h3",{children:"Mortuary Progress"}),(0,e.jsxs)(_e,{children:[(0,e.jsx)(Ce,{$done:!0}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Re,{children:"Admitted to Morgue"}),(0,e.jsx)(De,{children:re(t?.created_at)})]})]}),(0,e.jsxs)(_e,{children:[(0,e.jsx)(Ce,{$done:t?.embalmed,$active:!t?.embalmed}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Re,{children:["Body ",t?.embalmed?"Embalmed":"Awaiting Embalming"]}),(0,e.jsx)(De,{children:t?.embalmed?re(t?.embalmed_date):"Pending"})]})]}),(0,e.jsxs)(_e,{children:[(0,e.jsx)(Ce,{$done:o?.status==="completed",$active:o?.status==="pending"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Re,{children:["Postmortem ",o?o.status==="completed"?"Completed":o.status==="pending"||o.status==="in_progress"?"In Progress":"Requested":"Not Requested"]}),(0,e.jsx)(De,{children:o?.status==="completed"?re(o.completed_at||o.updated_at):o?.status==="pending"||o?.status==="in_progress"?"Awaiting Results":o?re(o.requested_at||o.created_at):"—"})]})]}),(0,e.jsxs)(_e,{children:[(0,e.jsx)(Ce,{$active:i==="In Morgue"||i==="Active"}),(0,e.jsxs)("div",{children:[(0,e.jsxs)(Re,{children:["In Storage (",i,")"]}),(0,e.jsx)(De,{children:"Currently Active"})]})]}),(0,e.jsxs)(_e,{children:[(0,e.jsx)(Ce,{}),(0,e.jsxs)("div",{children:[(0,e.jsx)(Re,{$muted:!0,children:"Released to Family"}),(0,e.jsx)(De,{style:{color:r.lightGray},children:"Pending"})]})]})]})]})},tt=a.div`
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
`,rt=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,Z=a.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,Q=a.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,ee=a.div`
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
`,zt=a.p`
  font-size: 12px;
  color: ${r.gray};
  margin: 0 0 12px;
`,at=a.div`
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`,Ue=a.div`
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`,qe=a.label`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,Tt=a.input`
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
`,Lt=a.textarea`
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
`,Me=({label:t,value:o,color:i})=>(0,e.jsxs)("span",{style:{display:"inline-flex",alignItems:"baseline",gap:5},children:[(0,e.jsx)("b",{style:{fontSize:14,color:i||r.black,fontWeight:700},children:o}),(0,e.jsx)("span",{style:{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"#999",fontWeight:700},children:t})]}),fa=({postmortem:t,deceasedId:o,deceasedName:i,deceasedAdmission:b,requests:c,onRequestsChanged:n})=>{const y=Ke(),{socket:k}=tr(),s=t||{},l=Se(),[j,_]=(0,p.useState)([]),I=c&&c.length>0?c:j.length>0?j:c||j,[v,$]=(0,p.useState)(!1),[C,E]=(0,p.useState)(!1),[P,w]=(0,p.useState)(null),[g,U]=(0,p.useState)({reason:"",requested_by:"",requesting_authority:"",notes:""}),[F,R]=(0,p.useState)(null),D=(0,p.useCallback)(()=>ae.get(`${V.FULL_API_URL}/postmortem-requests/stats`,{headers:pe()}).then(d=>{d.data?.success&&R(d.data.data||null)}).catch(()=>{}),[]);(0,p.useEffect)(()=>{D()},[D]);const T=(0,p.useCallback)(async()=>{if(o)try{const d=await ae.get(`${V.FULL_API_URL}/postmortem-requests`,{headers:pe(),params:{deceased_id:o}});Array.isArray(d.data?.data)&&_(d.data.data)}catch{}},[o]);(0,p.useEffect)(()=>{T()},[T]);const K=()=>{let d="";try{const S=JSON.parse(localStorage.getItem("user")||"{}");d=[S.first_name,S.last_name].filter(Boolean).join(" ")||S.full_name||S.name||S.username||S.email||""}catch{}U(S=>({...S,requested_by:S.requested_by||d})),$(!0)},x=async()=>{try{n&&await n()}catch{}await Promise.all([T(),D()])},L=s.immediate_cause_of_death||s.manner_of_death||s.examination_summary||s.findings||s.toxicology_findings,B=()=>{y(`/tenant/${l}/postmortem-form/${o}`)},q=async()=>{try{const d=pe(),S=`${V.FULL_API_URL}/postmortem/${o}/pdf`,ie=await fetch(S,{method:"GET",headers:{...d,Accept:"application/pdf"},credentials:"include"});if(!ie.ok){const ne=await ie.json().catch(()=>({}));throw new Error(ne.message||`Failed to generate PDF (${ie.status})`)}const se=await ie.blob(),oe=URL.createObjectURL(se);window.open(oe,"_blank"),setTimeout(()=>URL.revokeObjectURL(oe),6e4)}catch(d){console.error("PDF generation error:",d),alert(`Failed to generate PDF: ${d.message}`)}},A=async d=>{if(d.preventDefault(),!g.reason||!g.requested_by){le.error("Requested-by and reason are required");return}E(!0);try{const S=await ae.post(`${V.FULL_API_URL}/postmortem-requests`,{deceased_id:o,...g},{headers:pe()});if(S.data?.success){const ie={id:S.data?.data?.id||`pm-request-${Date.now()}`,title:"Postmortem Request Initiated",message:`Requested by ${g.requested_by} for ${i||"deceased"}`,fullContent:[`Deceased: ${i||"Unknown"}`,`Admission No: ${b||"N/A"}`,`Requested By: ${g.requested_by}`,g.requesting_authority&&`Authority: ${g.requesting_authority}`,`Reason: ${g.reason}`,g.notes&&`Notes: ${g.notes}`].filter(Boolean).join(`
`),timestamp:new Date().toISOString(),priority:"high",deceasedName:i,deceasedId:o,admissionNo:b,requestedBy:g.requested_by,reason:g.reason};k&&k.emit("postmortem-request-created",ie),ue.success("Postmortem Request Initiated",[`Who: ${g.requested_by}`,`Deceased: ${i||"Unknown"}`,`Admission: ${b||"N/A"}`].join(" · "),{dur:6e3}),$(!1),U({reason:"",requested_by:"",requesting_authority:"",notes:""}),await x()}else throw new Error(S.data?.message||"Failed to initiate request")}catch(S){le.error(S.response?.data?.message||S.message||"Failed to initiate postmortem request")}finally{E(!1)}},h=async d=>{w(d);try{const S=await ae.post(`${V.FULL_API_URL}/postmortem-requests/${d}/send`,{},{headers:pe()});if(S.data?.success)le.success("Marked as sent - postmortem is now pending"),await x();else throw new Error(S.data?.message||"Failed to send request")}catch(S){le.error(S.response?.data?.message||S.message||"Failed to send postmortem request")}finally{w(null)}},M=async d=>{w(d);try{const S=await ae.put(`${V.FULL_API_URL}/postmortem-requests/${d}/status`,{status:"cancelled"},{headers:pe()});if(S.data?.success)le.success("Postmortem request cancelled"),await x();else throw new Error(S.data?.message||"Failed to cancel request")}catch(S){le.error(S.response?.data?.message||S.message||"Failed to cancel postmortem request")}finally{w(null)}};return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8},children:[(0,e.jsxs)(tt,{$mt0:!0,style:{marginBottom:0},children:[(0,e.jsx)("span",{children:"01"})," Postmortem Requests"]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[L&&(0,e.jsx)(ce,{onClick:B,children:"Edit Examination"}),(0,e.jsx)(ce,{onClick:B,children:L?"+ New Examination":"+ Fill Examination Form"}),(0,e.jsx)(ce,{$primary:!0,onClick:K,children:"+ Initiate Request"})]})]}),F&&(0,e.jsxs)("div",{style:{display:"flex",gap:22,flexWrap:"wrap",margin:"10px 0 14px"},children:[(0,e.jsx)(Me,{label:"Requested",value:F.initiated??0,color:"#d97706"}),(0,e.jsx)(Me,{label:"Sent",value:F.sent??0,color:"#2563eb"}),(0,e.jsx)(Me,{label:"Completed",value:F.official_completed??0,color:"#7c3aed"}),(0,e.jsx)(Me,{label:"Cancelled",value:F.cancelled??0,color:"#9ca3af"})]}),v&&(0,e.jsx)(da,{onClick:()=>$(!1),children:(0,e.jsxs)(ca,{onClick:d=>d.stopPropagation(),children:[(0,e.jsxs)(pa,{children:[(0,e.jsx)("span",{children:"Initiate Postmortem Request"}),(0,e.jsx)(ga,{onClick:()=>$(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:A,children:[(0,e.jsxs)(ua,{children:[(0,e.jsxs)(ha,{children:["Deceased record: ",(0,e.jsx)("b",{children:i||`#${o}`})]}),(0,e.jsxs)(at,{children:[(0,e.jsxs)(Ue,{children:[(0,e.jsx)(qe,{children:"Requested By *"}),(0,e.jsx)(Tt,{value:g.requested_by,onChange:d=>U({...g,requested_by:d.target.value}),placeholder:"e.g. Jane Wambui (Family)",required:!0})]}),(0,e.jsxs)(Ue,{children:[(0,e.jsx)(qe,{children:"Requesting Authority"}),(0,e.jsx)(Tt,{value:g.requesting_authority,onChange:d=>U({...g,requesting_authority:d.target.value}),placeholder:"e.g. Kenyatta National Hospital",list:"pm-request-authorities"}),(0,e.jsxs)("datalist",{id:"pm-request-authorities",children:[(0,e.jsx)("option",{value:"Kenya Police"}),(0,e.jsx)("option",{value:"Directorate of Criminal Investigations (DCI)"}),(0,e.jsx)("option",{value:"Court Order"}),(0,e.jsx)("option",{value:"Hospital / Referring Facility"}),(0,e.jsx)("option",{value:"Family Request"})]})]})]}),(0,e.jsx)(at,{children:(0,e.jsxs)(Ue,{children:[(0,e.jsx)(qe,{children:"Reason *"}),(0,e.jsx)(Lt,{rows:3,value:g.reason,onChange:d=>U({...g,reason:d.target.value}),placeholder:"Why is the postmortem being requested? (e.g. unclear cause of death, legal requirement, family request)",required:!0})]})}),(0,e.jsx)(at,{children:(0,e.jsxs)(Ue,{children:[(0,e.jsx)(qe,{children:"Additional Notes"}),(0,e.jsx)(Lt,{rows:2,value:g.notes,onChange:d=>U({...g,notes:d.target.value}),placeholder:"Optional notes — contact details, special instructions, deadlines..."})]})}),(0,e.jsx)(ma,{children:'Initiating creates a tracked request (status: initiated), marks the body as "Postmortem Requested" and notifies the mortuary team. Use "Mark as Sent" once the request reaches the requesting authority.'})]}),(0,e.jsxs)(xa,{children:[(0,e.jsx)(ce,{type:"button",onClick:()=>$(!1),children:"Cancel"}),(0,e.jsx)(ce,{$primary:!0,type:"submit",disabled:C,children:C?"Initiating...":"Initiate Request"})]})]})]})}),I.length===0?(0,e.jsx)(zt,{children:"No postmortem requests tracked yet."}):(0,e.jsx)("div",{style:{marginBottom:24},children:I.map(d=>(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:`1px solid ${r.borderLight||"#eeeceb"}`,flexWrap:"wrap"},children:[(0,e.jsxs)("div",{style:{flex:1,minWidth:220},children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[(0,e.jsx)("span",{style:{fontWeight:700,fontSize:13,color:r.black},children:d.request_ref||d.requested_by}),(0,e.jsx)(la,{$status:d.status,children:d.status})]}),(0,e.jsxs)("div",{style:{fontSize:12,color:r.gray,marginTop:3,lineHeight:1.6},children:["Requested by ",(0,e.jsx)("b",{children:d.requested_by||"—"}),d.requesting_authority?(0,e.jsxs)(e.Fragment,{children:[" · Authority: ",d.requesting_authority]}):null,(0,e.jsx)("br",{}),"Reason: ",d.reason||"—"," · Initiated ",re(d.created_at),d.sent_at?` · Sent ${re(d.sent_at)}`:""]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[d.status==="initiated"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(ce,{$primary:!0,onClick:()=>h(d.id),disabled:P===d.id,children:P===d.id?"Sending...":"Mark as Sent"}),(0,e.jsx)(ce,{onClick:()=>M(d.id),disabled:P===d.id,children:"Cancel"})]}),d.status==="sent"&&(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:"Awaiting examination"})]})]},d.id))}),L?(0,e.jsxs)("div",{style:{marginTop:16,border:`1px solid ${r.borderLight}`,borderRadius:8,padding:"18px 20px",background:r.bgSection},children:[(0,e.jsxs)(tt,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Official Determination of Death"]}),(0,e.jsxs)(rt,{children:[(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Immediate Cause of Death"}),(0,e.jsx)(ee,{children:s.immediate_cause_of_death||"—"})]}),(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Underlying Cause of Death"}),(0,e.jsx)(ee,{children:s.underlying_cause_of_death||"—"})]}),s.manner_of_death&&(0,e.jsxs)(Z,{children:[(0,e.jsx)(Q,{children:"Manner of Death"}),(0,e.jsx)(ee,{children:s.manner_of_death})]}),s.contributing_conditions&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Contributing Conditions"}),(0,e.jsx)(ee,{children:s.contributing_conditions})]})]}),(0,e.jsxs)(tt,{children:[(0,e.jsx)("span",{children:"03"})," Assessment & Findings"]}),(0,e.jsxs)(rt,{children:[(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Examination Summary"}),(0,e.jsx)(ee,{$body:!0,children:s.examination_summary||"No statement provided."})]}),Array.isArray(s.findings)&&s.findings.length>0&&s.findings.map((d,S)=>(0,e.jsxs)(Z,{children:[(0,e.jsx)(Q,{children:d.title||d.organ_system||`Finding ${S+1}`}),(0,e.jsx)(ee,{$body:!0,children:d.description||d.details||JSON.stringify(d)})]},S)),s.head_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Head / CNS Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.head_findings=="string"?s.head_findings:JSON.stringify(s.head_findings)})]}),s.chest_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Chest Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.chest_findings=="string"?s.chest_findings:JSON.stringify(s.chest_findings)})]}),s.abdomen_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Abdominal Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.abdomen_findings=="string"?s.abdomen_findings:JSON.stringify(s.abdomen_findings)})]}),s.extremities_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Extremities Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.extremities_findings=="string"?s.extremities_findings:JSON.stringify(s.extremities_findings)})]}),s.toxicology_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Toxicology / Lab Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.toxicology_findings=="string"?s.toxicology_findings:JSON.stringify(s.toxicology_findings)})]}),s.custom_findings&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Other Findings"}),(0,e.jsx)(ee,{$body:!0,children:typeof s.custom_findings=="string"?s.custom_findings:JSON.stringify(s.custom_findings)})]})]}),(0,e.jsxs)(rt,{children:[(0,e.jsxs)(Z,{children:[(0,e.jsx)(Q,{children:"Examining Pathologist"}),(0,e.jsx)(ee,{children:s.pathologist_name||s.external_pathologist_name||"—"})]}),(0,e.jsxs)(Z,{children:[(0,e.jsx)(Q,{children:"Status"}),(0,e.jsx)(ee,{children:s.status?String(s.status).replace(/_/g," ").replace(/^\w/,d=>d.toUpperCase()):"Completed"})]}),(0,e.jsxs)(Z,{children:[(0,e.jsx)(Q,{children:"Date Completed"}),(0,e.jsx)(ee,{children:re(s.completed_at||s.updated_at)})]}),s.requesting_authority&&(0,e.jsxs)(Z,{$full:!0,children:[(0,e.jsx)(Q,{children:"Requesting Authority"}),(0,e.jsx)(ee,{children:s.requesting_authority})]})]}),(0,e.jsx)("div",{style:{display:"flex",justifyContent:"flex-end",gap:12,marginTop:20,flexWrap:"wrap"},children:(0,e.jsx)(ce,{onClick:q,children:"Download PDF Report"})})]}):(0,e.jsx)(zt,{style:{marginTop:16},children:"No postmortem examination recorded yet.. Use «+ Fill Examination Form» to record the official assessment, or «+ Initiate Request» to track a pre-examination request."})]})},ba=a.div`
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
`;var At=a.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;
`,ye=a.div`
  flex: 1; 
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`,je=a.label`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,Oe=a.input`
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
`,Et=a.select`
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
`,nt=a.button`
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
`,Ca=({charges:t,payments:o,deceasedId:i,onDataChanged:b})=>{const[c,n]=(0,p.useState)(o||[]),[y,k]=(0,p.useState)(t||[]),[s,l]=(0,p.useState)(!1),[j,_]=(0,p.useState)(!1),[I,v]=(0,p.useState)(null),[$,C]=(0,p.useState)(!1),[E,P]=(0,p.useState)({charge_type:"",amount:"",currency:"USD",description:"",service_date:Ye()}),[w,g]=(0,p.useState)({date:Ye(),currency:"USD",payment_method:"Cash",reference:"",amount:"",description:""});(0,p.useEffect)(()=>{k(t||[])},[t]);const U=x=>x==="KES"?"KES":"$",F=(x,L)=>`${U(L)} ${parseFloat(x||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`,R=["USD","KES"],D=(x,L,B)=>x.filter(q=>(q.currency||"USD")===L).reduce((q,A)=>q+(parseFloat(B(A)||0)||0),0);R.map(x=>{const L=D(y,x,q=>q.amount??q.charge_amount),B=D(c,x,q=>q.amount);return{currency:x,chargesTotal:L,paidTotal:B,balance:L-B}}).filter(x=>x.chargesTotal!==0||x.paidTotal!==0),(0,p.useEffect)(()=>{i&&T()},[i]);const T=async()=>{try{const x=Se(),L=we?we():localStorage.getItem("token")||localStorage.getItem("authToken")||"",B=await ae.get(`${V.FULL_API_URL}/payments/${i}`,{headers:{"x-tenant-slug":x,Authorization:`Bearer ${L}`}});B.data?.success&&n(B.data.data||[])}catch(x){console.error("Error loading payments:",x)}},K=async x=>{if(x.preventDefault(),!w.amount||!w.reference){le.error("Please fill in all required fields");return}l(!0);try{const L=Se(),B=we?we():localStorage.getItem("token")||localStorage.getItem("authToken")||"",q=(()=>{try{const A=localStorage.getItem("user");if(A){const h=JSON.parse(A);return h.email||h.username||"Unknown"}}catch(A){console.error("Error getting user email:",A)}return"Unknown"})();(await ae.post(`${V.FULL_API_URL}/payments`,{deceased_id:i,amount:parseFloat(w.amount),currency:w.currency||"USD",payment_method:w.payment_method,reference:w.reference,payment_date:w.date,description:w.description||null,recorded_by:q},{headers:{"x-tenant-slug":L,Authorization:`Bearer ${B}`}})).data?.success&&(le.success("Payment recorded successfully"),_(!1),g({date:Ye(),currency:w.currency||"USD",payment_method:"Cash",reference:"",amount:"",description:""}),await T(),b&&b())}catch(L){console.error("Error recording payment:",L),le.error("Failed to record payment")}finally{l(!1)}};return(0,e.jsxs)(e.Fragment,{children:[j&&(0,e.jsx)(va,{onClick:()=>_(!1),children:(0,e.jsxs)($a,{onClick:x=>x.stopPropagation(),children:[(0,e.jsxs)(wa,{children:[(0,e.jsx)("span",{children:"Record Payment"}),(0,e.jsx)(_a,{onClick:()=>_(!1),children:"×"})]}),(0,e.jsxs)("form",{onSubmit:K,children:[(0,e.jsxs)(Sa,{children:[(0,e.jsxs)(At,{children:[(0,e.jsxs)(ye,{children:[(0,e.jsx)(je,{children:"Date"}),(0,e.jsx)(Oe,{type:"date",value:w.date,onChange:x=>g({...w,date:x.target.value}),required:!0})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(je,{children:"Currency"}),(0,e.jsxs)(Et,{value:w.currency,onChange:x=>g({...w,currency:x.target.value}),children:[(0,e.jsx)("option",{value:"USD",children:"USD ($)"}),(0,e.jsx)("option",{value:"KES",children:"KES"})]})]}),(0,e.jsxs)(ye,{children:[(0,e.jsx)(je,{children:"Payment Method"}),(0,e.jsxs)(Et,{value:w.payment_method,onChange:x=>g({...w,payment_method:x.target.value}),children:[(0,e.jsx)("option",{children:"Cash"}),(0,e.jsx)("option",{children:"M-Pesa"}),(0,e.jsx)("option",{children:"Card"}),(0,e.jsx)("option",{children:"Bank Transfer"})]})]})]}),(0,e.jsxs)(At,{children:[(0,e.jsxs)(ye,{children:[(0,e.jsx)(je,{children:"Reference Number"}),(0,e.jsx)(Oe,{placeholder:"e.g. QXR89YU72",value:w.reference,onChange:x=>g({...w,reference:x.target.value}),required:!0})]}),(0,e.jsxs)(ye,{children:[(0,e.jsxs)(je,{children:["Amount (",w.currency==="KES"?"KES":"USD",")"]}),(0,e.jsx)(Oe,{type:"number",placeholder:"0.00",value:w.amount,onChange:x=>g({...w,amount:x.target.value}),required:!0})]}),(0,e.jsxs)(ye,{style:{flex:2,minWidth:"200px"},children:[(0,e.jsx)(je,{children:"Description / Notes (Optional)"}),(0,e.jsx)(Oe,{placeholder:"e.g. Facility fee, Coffin, Embalming, etc.",value:w.description,onChange:x=>g({...w,description:x.target.value})})]})]})]}),(0,e.jsxs)(ka,{children:[(0,e.jsx)(nt,{type:"button",onClick:()=>_(!1),children:"Cancel"}),(0,e.jsx)(nt,{$primary:!0,type:"submit",disabled:s,children:s?"Recording...":"Save Payment"})]})]})]})}),(0,e.jsxs)(ba,{$mt4:!0,style:{justifyContent:"space-between",width:"100%"},children:[(0,e.jsxs)("span",{children:[(0,e.jsx)("span",{style:{opacity:.5,fontSize:"10px"},children:"02"})," Payment History"]}),(0,e.jsx)(nt,{$primary:!0,onClick:()=>_(!0),style:{padding:"4px 12px",fontSize:"11px"},children:"+ Record Payment"})]}),(0,e.jsxs)(ya,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Date"}),(0,e.jsx)("th",{children:"Method"}),(0,e.jsx)("th",{children:"Reference"}),(0,e.jsx)("th",{children:"Description"}),(0,e.jsx)("th",{children:"Amount"}),(0,e.jsx)("th",{children:"Recorded By"})]})}),(0,e.jsx)("tbody",{children:c.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:6,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No payments recorded"})}):c.map((x,L)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{children:re(x.created_at||x.payment_date)}),(0,e.jsx)("td",{children:(0,e.jsx)(ja,{$info:x.payment_method==="M-Pesa",$warning:x.payment_method==="Cash",children:x.payment_method||"—"})}),(0,e.jsx)("td",{children:x.reference||"—"}),(0,e.jsx)("td",{children:x.description||x.notes||"—"}),(0,e.jsx)("td",{children:(0,e.jsx)("strong",{children:F(x.amount,x.currency)})}),(0,e.jsx)("td",{children:x.recorded_by||"—"})]},L))})]})]})};a.div`
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
`;var Pt=a.button`
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
`,za=({documents:t,deceasedId:o})=>{const[i,b]=(0,p.useState)(!1),[c,n]=(0,p.useState)(!1),[y,k]=(0,p.useState)(null),s=(0,p.useRef)(null);(0,p.useEffect)(()=>{if(!o)return;let v=!1;return(async()=>{try{const $=await he.get(`/documents/${o}`,{headers:pe(),withCredentials:!1});if(!v){const C=$.data?.files||$.data?.data||[];k(Array.isArray(C)?C:[])}}catch{}})(),()=>{v=!0}},[o]);const l=y??(Array.isArray(t)?t:[]),j=async v=>{const $=v.target.files?.[0];if(!$||!o){ue.error("Upload failed","Missing file or deceased ID");return}n(!0);try{const C=new FormData;C.append("document",$);const E={"Content-Type":null,"x-tenant-slug":localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||""};try{const w=localStorage.getItem("accessToken")||localStorage.getItem("authToken");w&&(E.Authorization=`Bearer ${w}`);const g=localStorage.getItem("tenantSlug");g&&(E["x-tenant-slug"]=g)}catch{}const P=await he.post(`/documents/upload/${String(o)}`,C,{headers:E,withCredentials:!1});P.data?.success||P.data?.document?(ue.success("Document uploaded",P.data?.message||"Document uploaded successfully"),window.location.reload()):ue.error("Upload failed",P.data?.message||"Failed to upload document")}catch(C){console.error("Error uploading document:",C);const E=C.response?.status,P=C.response?.data?.message;let w="Upload failed",g="Failed to upload document. Please try again later.";E===400?g=P||"Invalid file type. Only PDFs, images, and Word documents are allowed.":E===413?g="File is too large (max 50MB).":E===404?g="Deceased record not found.":P&&(g=P),ue.error(w,g)}finally{n(!1)}},_=()=>{s.current&&s.current.click()},I=v=>{const $=v?.documentId??v?.document_id??v?.id,C=new URLSearchParams;C.set("deceasedId",o),$&&C.set("docId",$),C.set("session",Date.now().toString(36)+Math.random().toString(36).slice(2,10)),window.open(`/memorial-document-viewer.html?${C.toString()}`,"_blank","noopener")};return(0,e.jsxs)(e.Fragment,{children:[i&&(0,e.jsx)(Kt,{onClose:()=>b(!1)}),(0,e.jsxs)("div",{style:{display:"flex",gap:"12px",marginBottom:"32px",flexWrap:"wrap"},children:[(0,e.jsx)("input",{ref:s,type:"file",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png",onChange:j,disabled:c,style:{display:"none"}}),(0,e.jsx)(Pt,{$primary:!0,onClick:_,disabled:c,style:{cursor:"pointer"},children:c?"Uploading...":"+ Upload Document"})]}),(0,e.jsx)(Da,{children:(0,e.jsxs)(Ra,{children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Document Name"}),(0,e.jsx)("th",{children:"Type"}),(0,e.jsx)("th",{children:"Uploaded Date"}),(0,e.jsx)("th",{style:{textAlign:"right"},children:"Actions"})]})}),(0,e.jsx)("tbody",{children:l.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:4,style:{textAlign:"center",color:r.gray,padding:"24px 0"},children:"No documents uploaded"})}):l.map((v,$)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:600},children:v.originalName||v.storedName||v.name||v.file_name}),(0,e.jsx)("td",{children:(0,e.jsx)(Fa,{$info:!0,children:v.mimeType||v.category||v.type||"Document"})}),(0,e.jsx)("td",{children:re(v.uploadedAt||v.uploaded_at||v.created_at)}),(0,e.jsx)("td",{style:{textAlign:"right"},children:(0,e.jsxs)(Pt,{$sm:!0,onClick:()=>I(v),title:"Open document preview in a new page",children:[(0,e.jsx)("i",{className:"far fa-images",style:{marginRight:5,fontSize:11}})," View"]})})]},$))})]})})]})},z={black:"#0a0a0a",dark:"#1a1a1a",gray:"#777777",border:"#c8c8c8",borderLight:"#e0e0e0",bgField:"#f7f7f5",success:"#059669",successBg:"#ecfdf5",warning:"#d97706",warningBg:"#fef3c7",danger:"#dc2626",dangerBg:"#fef2f2",info:"#2563eb",infoBg:"#eff6ff"},Ta=me`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`,It=a.span`
  display: inline-flex;
  animation: ${Ta} 0.8s linear infinite;
`;me`from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); }`;var La=a.div`
  position: fixed; inset: 0; z-index: 120;
  background: rgba(10, 10, 10, 0.38);
  display: block;
  animation: ${me`from { opacity: 0; } to { opacity: 1; }`} 0.18s ease-out;
`,Aa=a.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(520px, 100vw);
  height: 100vh;
  overflow-y: auto;
  background: #ffffff;
  border-left: 1px solid ${z.border};
  box-shadow: -18px 0 44px -18px rgba(10, 10, 10, 0.35);
  animation: ${me`from { transform: translateX(100%); } to { transform: translateX(0); }`} 0.2s ease-out;
  padding: 28px 26px;

  @media (max-width: 560px) {
    padding: 22px 18px;
  }
`,Ea=a.div`
  display: flex; align-items: center; gap: 10px; justify-content: space-between;
  h3 { font-family: 'Source Sans 3', sans-serif; font-size: 17px; font-weight: 700; color: ${z.black}; margin: 0; display: flex; align-items: center; gap: 8px; }
`,Pa=a.button`
  width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${z.border};
  background: white; color: ${z.gray}; cursor: pointer; display: grid; place-items: center;
  &:hover { color: ${z.black}; border-color: ${z.black}; }
`,ve=a.div`
  display: flex; align-items: center; gap: 8px; margin-top: 14px; width: 100%;
  ${t=>t.$kind==="success"&&`background: ${z.successBg}; color: ${z.success};`}
  ${t=>t.$kind==="error"&&`background: ${z.dangerBg}; color: ${z.danger};`}
  ${t=>t.$kind==="info"&&`background: ${z.infoBg}; color: ${z.info};`}
  ${t=>t.$kind==="warning"&&`background: ${z.warningBg}; color: ${z.warning};`}
  padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid ${z.borderLight};
`,Ia=a.div`
  height: 5px; background: #e5e7eb; border-radius: 3px; margin: 10px 0; overflow: hidden;
  > div { height: 100%; background: ${z.black}; width: ${t=>t.$w}%; transition: width 0.3s ease; }
`,Ba=()=>(0,e.jsxs)("svg",{width:"42",height:"42",viewBox:"0 0 64 64",xmlns:"http://www.w3.org/2000/svg",children:[(0,e.jsx)("path",{d:"M12 22 L52 22 C54 22 56 24 56 26 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 L8 26 C8 24 10 22 12 22 Z",fill:"#334155"}),(0,e.jsx)("rect",{x:"14",y:"22",width:"36",height:"7",fill:"#0f172a"}),(0,e.jsx)("path",{d:"M8 46 L56 46 L56 50 C56 52 54 54 52 54 L12 54 C10 54 8 52 8 50 Z",fill:"#1e293b"}),(0,e.jsx)("rect",{x:"13",y:"37",width:"14",height:"5",rx:"1",fill:"#10b981"}),(0,e.jsx)("circle",{cx:"37",cy:"40",r:"2",fill:"#64748b"}),(0,e.jsx)("circle",{cx:"44",cy:"40",r:"2",fill:"#64748b"})]}),Na=async({file:t,deceasedId:o,documentName:i,category:b})=>{const c=new FormData;c.append("document",t),i&&c.append("documentName",i),b&&c.append("category",b);const n={"Content-Type":null};try{const y=localStorage.getItem("authToken")||localStorage.getItem("accessToken");y&&(n.Authorization=`Bearer ${y}`);const k=localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug");k&&(n["x-tenant-slug"]=k)}catch{}return(await he.post(`/documents/upload/${String(o)}`,c,{headers:n,withCredentials:!1})).data},Ua=t=>{const o=new Date,i=c=>String(c).padStart(2,"0"),b=`${o.getFullYear()}-${i(o.getMonth()+1)}-${i(o.getDate())}-${i(o.getHours())}${i(o.getMinutes())}`;return`Scan_${String(t||"document").replace(/\s+/g,"-").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,24)}_${b}.pdf`},qa=({deceasedId:t,deceasedName:o="",onClose:i,onScanned:b})=>{const[c,n]=(0,p.useState)("probe"),[y,k]=(0,p.useState)(5),[s,l]=(0,p.useState)(""),[j,_]=(0,p.useState)(null),[I,v]=(0,p.useState)(""),[$,C]=(0,p.useState)(()=>Ua(o)),[E,P]=(0,p.useState)("Scan"),[w,g]=(0,p.useState)(!1),U=(0,p.useRef)(null);(0,p.useEffect)(()=>{F()},[]);const F=async()=>{const h=await ar(4e3);h.ok?(v(h.url),n("ready")):n("unavailable")},R=()=>{if(!t){ue.error("Scan failed","Missing deceased ID");return}n("scanning"),k(5),l("Connecting to the scanner…");let h;try{h=new WebSocket(I||"ws://localhost:8081")}catch{n("error"),l("Cannot reach the Scanner Bridge. Is the local agent running?");return}h.onopen=()=>{const M=nr({deceasedId:t,documentName:$||void 0,category:E});h.send(JSON.stringify(M))},h.onmessage=M=>{let d={};try{d=JSON.parse(M.data)}catch{}switch(d.status){case"SCANNING":n("scanning"),k(typeof d.progress=="number"?d.progress:50),l(d.message||"Scanning…");break;case"UPLOADING":n("uploading"),k(85),l(d.message||"Uploading to the documents service…");break;case"COMPLETE":k(100),_(d.document||null),n("success"),l(d.message||"Document scanned and uploaded successfully!");try{h.close()}catch{}break;case"ERROR":n("error"),l(/spawnSync\s+naps2(?:\.exe)?\s+ENOENT/i.test(d.message||"")?"NAPS2 is not installed or is not on PATH. For a hardware-free test, start the Scanner Bridge in mock mode with MOCK_SCAN=1.":d.message||"Scan failed. Please try again.");try{h.close()}catch{}}},h.onerror=()=>{n("error"),l("Cannot reach the Scanner Bridge. Is the local agent running?")}},D=()=>{_(null),k(5),l(""),n(I?"ready":"unavailable")},T=async h=>{const M=h.target.files?.[0];if(M){if(!t){ue.error("Upload failed","Missing deceased ID");return}g(!0),n("uploading"),l("Uploading to the documents service…");try{const d=await Na({file:M,deceasedId:t,documentName:$||M.name,category:E});_(d?.data||d||{name:M.name}),n("success"),l(d?.message||"Document uploaded successfully!"),ue.success("Uploaded",d?.message||"Document uploaded to the documents service.")}catch(d){n("error"),l(d?.response?.data?.message||d?.message||"Upload failed. Please try again.")}finally{g(!1),U.current&&(U.current.value="")}}},K=()=>{typeof b=="function"&&b(j||{}),typeof i=="function"&&i()},x=(0,e.jsxs)("div",{style:{display:"grid",gap:10,marginTop:12},children:[(0,e.jsxs)("label",{style:{fontSize:12,fontWeight:600,color:z.dark},children:["Document name",(0,e.jsx)("input",{value:$,onChange:h=>C(h.target.value),style:{display:"block",width:"100%",marginTop:4,padding:"8px 10px",border:`1px solid ${z.border}`,borderRadius:8,fontFamily:"'Source Sans 3', sans-serif",fontSize:13}})]}),(0,e.jsxs)("label",{style:{fontSize:12,fontWeight:600,color:z.dark},children:["Category",(0,e.jsx)("select",{value:E,onChange:h=>P(h.target.value),style:{display:"block",width:"100%",marginTop:4,padding:"8px 10px",border:`1px solid ${z.border}`,borderRadius:8,fontFamily:"'Source Sans 3', sans-serif",fontSize:13},children:["Scan","General","Death Certificate","Medical","Police Report","ID / Passport","Release Forms","Other"].map(h=>(0,e.jsx)("option",{value:h,children:h},h))})]})]}),L={background:z.black,color:"#fff",border:"none",borderRadius:8,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Source Sans 3', sans-serif"},B={background:"#fff",color:z.dark,border:`1px solid ${z.border}`,borderRadius:8,padding:"10px 16px",fontSize:13.5,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,fontFamily:"'Source Sans 3', sans-serif"},q=(0,e.jsx)("input",{ref:U,type:"file",accept:".pdf,.jpg,.jpeg,.png",onChange:T,style:{display:"none"}}),A=c==="scanning"||c==="uploading"||w||c==="probe";return(0,e.jsx)(La,{onClick:A?void 0:i,children:(0,e.jsxs)(Aa,{onClick:h=>h.stopPropagation(),children:[(0,e.jsxs)(Ea,{children:[(0,e.jsxs)("h3",{children:[(0,e.jsx)(Ba,{})," Scan Document"]}),(0,e.jsx)(Pa,{onClick:i,disabled:A,title:"Close",children:(0,e.jsx)(Ot,{size:14})})]}),c==="probe"&&(0,e.jsxs)(ve,{$kind:"info",children:[(0,e.jsx)(It,{children:(0,e.jsx)(lt,{size:16})}),"Checking for the local Scanner Bridge…"]}),c==="ready"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ve,{$kind:"info",children:[(0,e.jsx)(Je,{size:16}),"Scanner Bridge connected",I?` — ${I.replace(/^ws:\/\//,"")}`:"","."]}),(0,e.jsxs)("div",{style:{background:z.bgField,border:`1px solid ${z.borderLight}`,borderRadius:8,padding:"12px 14px",marginTop:10,fontSize:13,color:z.dark},children:["Place the document(s) face-up in the scanner tray, then press",(0,e.jsx)("strong",{children:" Scan Document"}),". The pages are scanned to a PDF and uploaded straight to this deceased person's documents."]}),x,(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:{...L,flex:1},onClick:R,children:[(0,e.jsx)(Je,{size:16})," Scan Document"]}),(0,e.jsxs)("button",{style:B,onClick:()=>U.current?.click(),children:[(0,e.jsx)(Ge,{size:15})," Upload a file instead"]})]}),q]}),c==="unavailable"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ve,{$kind:"warning",children:[(0,e.jsx)(pt,{size:16}),"Scanner Bridge not found on this computer."]}),(0,e.jsxs)("div",{style:{background:z.bgField,border:`1px solid ${z.borderLight}`,borderRadius:8,padding:"12px 14px",marginTop:10,fontSize:13,color:z.dark},children:[(0,e.jsx)("strong",{children:"Install Scanner Bridge"})," to scan straight from Restpoint (no HP software or scanner buttons needed). Download the app at",(0,e.jsx)("a",{href:"/downloads/Restpoint-Scanner-Bridge-Installer.exe",download:!0,children:"Download the Scanner Bridge installer"})," ","and run it once on this computer. Node.js is not required."]}),x,(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:{...L,flex:1},onClick:F,children:[(0,e.jsx)(st,{size:15})," Check Again"]}),(0,e.jsxs)("button",{style:B,onClick:()=>U.current?.click(),children:[(0,e.jsx)(Ge,{size:15})," Upload a scanned file instead"]})]}),q]}),(c==="scanning"||c==="uploading")&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ve,{$kind:"info",children:[(0,e.jsx)(It,{children:(0,e.jsx)(lt,{size:16})}),s]}),(0,e.jsx)(Ia,{$w:y,children:(0,e.jsx)("div",{})}),(0,e.jsx)("div",{style:{fontSize:12,color:z.gray,textAlign:"center"},children:c==="scanning"?"Holding the scanner… pages are being digitised.":"Sending the PDF to the documents service…"})]}),c==="success"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ve,{$kind:"success",children:[(0,e.jsx)(dt,{size:16}),s||"Document scanned and uploaded successfully!"]}),(0,e.jsxs)("div",{style:{display:"flex",gap:8,marginTop:12,fontSize:13,color:z.dark,background:z.bgField,border:`1px solid ${z.borderLight}`,borderRadius:8,padding:"12px 14px"},children:[(0,e.jsx)(rr,{size:15}),(0,e.jsxs)("span",{children:[(0,e.jsx)("strong",{children:j?.original_name||j?.name||$||"Scanned document"}),j?.file_size?` · ${Math.max(1,Math.round(j.file_size/1024))} KB`:""," ","· uploaded to this profile's documents."]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16},children:[(0,e.jsxs)("button",{style:B,onClick:D,children:[(0,e.jsx)(Je,{size:15})," Scan another"]}),(0,e.jsxs)("button",{style:{...L,flex:1},onClick:K,children:[(0,e.jsx)(dt,{size:16})," Done"]})]})]}),c==="error"&&(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(ve,{$kind:"error",children:[(0,e.jsx)(pt,{size:16}),s||"Scan failed. Please try again."]}),(0,e.jsxs)("div",{style:{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"},children:[(0,e.jsxs)("button",{style:B,onClick:D,children:[(0,e.jsx)(st,{size:15})," Try Again"]}),(0,e.jsxs)("button",{style:B,onClick:()=>U.current?.click(),children:[(0,e.jsx)(Ge,{size:15})," Upload a file instead"]})]}),q]})]})})},Bt=a.div`
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
`,Nt=a.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 24px;
  margin-bottom: 20px;
`,W=a.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,H=a.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
`,G=a.div`
  font-size: 14px;
  font-weight: 600;
  color: ${r.black};
  word-break: break-word;
  line-height: 1.35;
  ${t=>t.$mono&&"font-family: ui-monospace, monospace; font-size: 13px;"}
`,Ma=({path:t})=>{const[o,i]=(0,p.useState)(!1),c=(n=>{if(!n)return null;if(n.startsWith("data:image"))return n;if(n.startsWith("http"))return or(n);if(n.startsWith("/"))return`${V.UPLOADS_URL}${n}`;const y=n.replace(/^\/+/,"");return`${V.UPLOADS_URL}/${y}`})(t);return t?o?(0,e.jsx)("a",{href:c,target:"_blank",rel:"noreferrer",style:{fontSize:14,color:"#1a73e8"},children:"Click to view signature ↗"}):(0,e.jsx)("img",{src:c,alt:"Next of Kin Signature",onError:()=>i(!0),style:{maxWidth:"100%",maxHeight:220,marginTop:6,background:"#fff",padding:6,objectFit:"contain"}}):null},Oa=({deceased:t,nextOfKin:o})=>{const i=t||{},b=o||{},c=i.signature||b.signature,n=i.full_name||i.name||"Unknown";return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(W,{$full:!0,style:{marginBottom:"20px"},children:[(0,e.jsx)(H,{style:{fontSize:11,opacity:.55},children:"Deceased Name"}),(0,e.jsx)(G,{style:{color:"#2563eb",fontSize:24,fontWeight:700,fontFamily:"Merriweather",marginBottom:8},children:n})]}),(0,e.jsxs)(Bt,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," Admission"]}),(0,e.jsxs)(Nt,{children:[(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Admission Number"}),(0,e.jsx)(G,{$mono:!0,children:i.admission_number||i.admission_no||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Date Admitted"}),(0,e.jsx)(G,{children:re(i.date_admitted||i.created_at)})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Time Received"}),(0,e.jsx)(G,{$mono:!0,children:i.time_received||i.admission_time||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Receiving Officer"}),(0,e.jsx)(G,{children:i.receiving_officer||i.admitted_by||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Body Status"}),(0,e.jsx)(G,{children:i.body_status||i.body_condition||"In Morgue"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Received From"}),(0,e.jsx)(G,{children:i.received_from||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Date of Death"}),(0,e.jsx)(G,{children:re(i.date_of_death)})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Place of Death"}),(0,e.jsx)(G,{children:i.place_of_death||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Physician"}),(0,e.jsx)(G,{children:i.physician||i.attending_physician||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Permit Number"}),(0,e.jsx)(G,{$mono:!0,children:i.permit_number||"—"})]}),(0,e.jsxs)(W,{$full:!0,children:[(0,e.jsx)(H,{children:"Cause of Death"}),(0,e.jsx)(G,{children:i.cause_of_death||"—"})]})]}),(0,e.jsxs)(Bt,{children:[(0,e.jsx)("span",{children:"03"})," Next of Kin"]}),(0,e.jsxs)(Nt,{children:[(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"NOK Name"}),(0,e.jsx)(G,{children:b.full_name||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Relationship"}),(0,e.jsx)(G,{children:b.relationship||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"National ID"}),(0,e.jsx)(G,{$mono:!0,children:b.id_number||i.national_id||i.id_number||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Telephone"}),(0,e.jsx)(G,{children:b.contact||"—"})]}),(0,e.jsxs)(W,{children:[(0,e.jsx)(H,{children:"Alt. Phone"}),(0,e.jsx)(G,{children:b.alternative_phone||"—"})]}),(0,e.jsxs)(W,{$full:!0,children:[(0,e.jsx)(H,{children:"Signature"}),c?(0,e.jsx)(Ma,{path:c}):(0,e.jsx)(G,{style:{color:"#999"},children:"—"})]})]})]})},Ka=a.div`
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
`,Ha=({deceased:t,postmortem:o,charges:i,payments:b,releaseData:c,requests:n})=>{const y=t||{},k=[{action:"Record Created (Admission Intake)",user:y.receiving_officer||y.admitted_by||"System",role:"Receiving Officer",timestamp:y.created_at||y.admission_time},...y.embalmed?[{action:"Body Embalmed",user:y.embalmed_by||y.admitted_by||"System",role:"Mortician",timestamp:y.embalmed_date||y.updated_at}]:[],...o?.status==="completed"?[{action:"Postmortem Results Saved",user:o.pathologist_name||"Unknown",role:"Pathologist",timestamp:o.completed_at||o.updated_at}]:[],...o?.status==="pending"?[{action:"Postmortem Requested",user:o.requested_by||"System",role:"Requesting Authority",timestamp:o.requested_at||o.created_at}]:[],...Array.isArray(i)&&i.length>0?i.map(l=>({action:`Charge Added: ${l.description||l.charge_name||"Service Charge"} ($${parseFloat(l.amount||l.charge_amount||0).toFixed(2)})`,user:l.created_by||l.added_by||y.admitted_by||"System",role:"Billing Officer",timestamp:l.created_at||l.updated_at})):[],...Array.isArray(b)&&b.length>0?b.map(l=>({action:`Payment Recorded: $${parseFloat(l.amount||0).toFixed(2)} (${l.payment_method||l.method||"N/A"})`,user:l.received_by||l.processed_by||y.admitted_by||"System",role:"Cashier",timestamp:l.payment_date||l.created_at})):[],...c?[{action:`Body Released to: ${c.released_to||c.receiver_name||"Unknown"}`,user:c.released_by||c.staff_name||c.authorized_by||"System",role:"Authorized Officer",timestamp:c.released_at||c.created_at}]:[],...y.body_status&&y.body_status!=="admitted"?[{action:`Body Status Changed: ${y.body_status}`,user:y.updated_by||y.admitted_by||"System",role:"Mortuary Attendant",timestamp:y.updated_at||y.date_admitted||y.created_at}]:[],...Array.isArray(n)?n.map(l=>{const j=l.status==="cancelled"?l.cancelled_at||l.updated_at||l.created_at:l.status==="sent"?l.sent_at||l.updated_at||l.created_at:l.created_at||l.updated_at;return{action:`${l.status==="sent"?"Postmortem Request Sent to Authority":l.status==="cancelled"?"Postmortem Request Cancelled":"Postmortem Request Initiated"}${l.request_ref?` (${l.request_ref})`:""}`,user:l.initiated_by||l.requested_by||"System",role:"Requesting Party",timestamp:j}}):[]].filter(Boolean),s=l=>{if(!l)return 0;const j=String(l).includes("T")?l:String(l).replace(" ","T"),_=Date.parse(j);return Number.isNaN(_)?0:_};return k.sort((l,j)=>s(j.timestamp)-s(l.timestamp)),(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)(Ka,{$mt0:!0,children:[(0,e.jsx)("span",{children:"01"})," System Audit Trail"]}),(0,e.jsx)("div",{style:{overflowX:"auto",border:`1px solid ${r.borderLight}`,borderRadius:6},children:(0,e.jsxs)(Wa,{style:{marginTop:0},children:[(0,e.jsx)("thead",{children:(0,e.jsxs)("tr",{children:[(0,e.jsx)("th",{children:"Action Performed"}),(0,e.jsx)("th",{children:"User"}),(0,e.jsx)("th",{children:"Timestamp"})]})}),(0,e.jsx)("tbody",{children:k.length===0?(0,e.jsx)("tr",{children:(0,e.jsx)("td",{colSpan:3,style:{textAlign:"center",color:r.gray,padding:20},children:"No audit records found"})}):k.map((l,j)=>(0,e.jsxs)("tr",{children:[(0,e.jsx)("td",{style:{fontWeight:500},children:l.action}),(0,e.jsxs)("td",{children:[(0,e.jsx)("strong",{children:l.user}),(0,e.jsx)("br",{}),(0,e.jsx)("span",{style:{fontSize:11,color:r.gray},children:l.role})]}),(0,e.jsx)("td",{style:{color:r.gray,fontSize:12,whiteSpace:"nowrap"},children:re(l.timestamp)})]},j))})]})})]})},Fe=a.div`
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
`,ze=a.div`
  display: grid; 
  grid-template-columns: ${t=>t.$cols?"repeat(2, 1fr)":"repeat(auto-fit, minmax(200px, 1fr))"}; 
  gap: 1.5rem 2rem; 
  margin-bottom: 24px;
`,Ga=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 24px;
`,it=a.div`
  min-width: 0;
`,J=a.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  
  ${t=>t.$full&&"grid-column: 1 / -1;"}
`,Y=a.span`
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${r.gray}; 
`,te=a.div`
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
`;var Ya=({deceased:t,nextOfKin:o,deceasedId:i})=>{const b=Ke(),c=t||{},[n,y]=(0,p.useState)(c?.releaseData||null),[k,s]=(0,p.useState)(!1),l=()=>{let j=localStorage.getItem("tenantSlug")||"";if(!j||j==="dashboard"||j==="default"){const _=localStorage.getItem("user"),I=_?JSON.parse(_):{};j=I?.parentTenantSlug||I?.tenantSlug||j}b(`/tenant/${j}/release-form/${i}`,{state:{deceasedData:t}})};return(0,p.useEffect)(()=>{(async()=>{if(i&&!c?.releaseData){s(!0);try{const _=c.admission_number||c.admission_no||i,I={...pe()};try{const $=await he.get(`/body-release/by-admission/${encodeURIComponent(_)}`,{headers:I});if($.data?.success&&$.data?.data){y($.data.data);return}}catch{}const v=await he.get("/body-release/checkout",{headers:I});if(v.data?.success&&Array.isArray(v.data?.data)){const $=g=>String(g||"").trim().toLowerCase(),C=$(_),E=$(i),P=new Set([c.full_name,c.name_of_deceased,c.name,c.fullname].filter(Boolean).map($)),w=v.data.data.find(g=>C&&($(g.admission_number)===C||$(g.admission_number)===E)||P.has($(g.name_of_deceased)));w&&y(w)}}catch(_){console.error("Error fetching release data:",_)}finally{s(!1)}}})()},[i,c.full_name,c.name_of_deceased,c.admission_number,c.admission_no,c.releaseData]),(0,e.jsxs)(e.Fragment,{children:[n?(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.successBg||"#ecfdf5",border:`1px solid ${r.success||"#059669"}44`},children:[(0,e.jsx)("i",{className:"fas fa-check-circle",style:{color:r.success||"#059669",fontSize:18}}),(0,e.jsxs)("div",{style:{flex:1,minWidth:200},children:[(0,e.jsxs)("div",{style:{fontWeight:700,color:r.success||"#059669",fontSize:14},children:["BODY RELEASED",n.release_id?` — ${n.release_id}`:""]}),(0,e.jsx)("div",{style:{fontSize:12,color:r.gray},children:n.created_at?`Released on ${re(n.created_at)}`:""})]})]}):(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",padding:"12px 16px",marginBottom:24,borderRadius:8,background:r.bgField||"#f7f7f5",border:`1px solid ${r.borderLight||"#e0e0e0"}`},children:[(0,e.jsx)("i",{className:"fas fa-clock",style:{color:r.gray,fontSize:16}}),(0,e.jsx)("div",{style:{flex:1,minWidth:200,fontSize:13,color:r.gray},children:"No body release has been recorded for this deceased yet."}),(0,e.jsxs)(Ja,{$primary:!0,onClick:l,children:[(0,e.jsx)("i",{className:"fas fa-door-open",style:{fontSize:12}})," Start Release"]})]}),(0,e.jsxs)(Ga,{children:[(0,e.jsxs)(it,{children:[(0,e.jsxs)(Fe,{$mt0:!0,$primary:!0,children:[(0,e.jsx)("span",{children:"01"})," Release Details"]}),(0,e.jsxs)(ze,{$cols:!0,children:[(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Release ID"}),(0,e.jsx)(te,{children:n?.release_id||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Deceased"}),(0,e.jsx)(te,{children:n?.name_of_deceased||c.full_name||c.name_of_deceased||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Scheduled Release Date"}),(0,e.jsx)(te,{children:n?.date_of_removal?re(n.date_of_removal):"Not scheduled"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Scheduled Release Time"}),(0,e.jsx)(te,{children:n?.time_of_removal||"—"})]})]})]}),(0,e.jsxs)(it,{children:[(0,e.jsxs)(Fe,{$mt0:!0,children:[(0,e.jsx)("span",{children:"02"})," Receiver / Next of Kin"]}),(0,e.jsxs)(ze,{$cols:!0,children:[(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Authorized By (NOK)"}),(0,e.jsx)(te,{children:n?.next_kin||o?.full_name||o?.name||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Relationship to Deceased"}),(0,e.jsx)(te,{children:n?.relationship||o?.relationship||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Receiver ID Number"}),(0,e.jsx)(te,{children:n?.id_number||o?.id_number||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Receiver Phone"}),(0,e.jsx)(te,{children:n?.tell_number||o?.contact||"—"})]})]})]})]}),(0,e.jsxs)(Fe,{$mt0:!0,children:[(0,e.jsx)("span",{children:"03"})," Transport & Release Officer"]}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Permit Number"}),(0,e.jsx)(te,{children:n?.permit_number||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Mode of Transport"}),(0,e.jsx)(te,{children:n?.mode_of_transport||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Released By (Staff)"}),(0,e.jsx)(te,{children:n?.staff_name||n?.received_by||n?.released_by||"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Recorded On"}),(0,e.jsx)(te,{children:n?.created_at?re(n.created_at):"—"})]})]}),(0,e.jsxs)(Fe,{$mt0:!0,children:[(0,e.jsx)("span",{children:"04"})," Verification & Handover Notes"]}),(0,e.jsxs)(ze,{children:[(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Payments Cleared"}),(0,e.jsx)(te,{children:n?n.everything_paid?"Yes — everything paid":"Not marked as fully paid":"—"})]}),(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Terms Accepted"}),(0,e.jsx)(te,{children:n?n.terms_accepted?"Yes":"No":"—"})]}),(0,e.jsxs)(J,{$full:!0,children:[(0,e.jsx)(Y,{children:"Items Returned with Body"}),(0,e.jsx)(te,{$muted:!0,children:n?.items_returned||"None recorded"})]}),(0,e.jsxs)(J,{$full:!0,children:[(0,e.jsx)(Y,{children:"Notes"}),(0,e.jsx)(te,{$muted:!0,children:n?.notes||"No notes recorded"})]})]}),(n?.signature||n?.staff_signature)&&(0,e.jsxs)(it,{style:{marginBottom:24},children:[(0,e.jsxs)(Fe,{$mt0:!0,children:[(0,e.jsx)("span",{children:"05"})," Authorizing Signatures"]}),(0,e.jsxs)(ze,{$cols:!0,children:[n?.signature&&(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Next of Kin Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(n.signature)?n.signature:`${V.API_GATEWAY_URL}${n.signature.startsWith("/")?"":"/"}${n.signature}`,alt:"Next of Kin Signature",style:{maxHeight:200,maxWidth:2200,width:"100%",objectFit:"contain",background:"white",padding:8},onError:j=>{j.currentTarget.style.display="none"}})]}),n?.staff_signature&&(0,e.jsxs)(J,{children:[(0,e.jsx)(Y,{children:"Staff Signature"}),(0,e.jsx)("img",{src:/^(data:|https?:\/\/)/.test(n.staff_signature)?n.staff_signature:`${V.API_GATEWAY_URL}${n.staff_signature.startsWith("/")?"":"/"}${n.staff_signature}`,alt:"Staff Signature",style:{maxHeight:170,maxWidth:460,width:"100%",objectFit:"contain",background:"white",border:`1px solid ${r.borderLight}`,borderRadius:6,padding:8},onError:j=>{j.currentTarget.style.display="none"}})]})]})]})]})},Ht=new Map,Va=3e4;function Xa(t){const o=Ht.get(t);return o&&Date.now()-o.ts<Va?o.data:null}function Za(t,o){Ht.set(t,{ts:Date.now(),data:o})}var Te=`${V.FULL_API_URL}/deceased`,Qa=Mt`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`,Gt=me`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`,en=a.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: #1a1a1a; 
  font-size: 14px; 
  line-height: 1.5;
  max-width: 1400px; 
  margin: 0 auto; 
  background: rgb(255, 255, 255);
  animation: ${Gt} 0.25s ease-out;
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
`,$e=a.div`
  display: ${t=>t.$active?"grid":"none"}; 
  gap: 1.5rem;
  animation: ${Gt} 0.2s ease;

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
`;var on=[{key:"overview",label:"Overview"},{key:"postmortem",label:"Postmortem"},{key:"financials",label:"Financials"},{key:"release",label:"Release"},{key:"docs",label:"Documents"},{key:"audit",label:"Audit Log"}],Sn=()=>{const[t]=Ut(),o=qt();let i=t.get("id")||o.id;const b=Ke(),[c,n]=(0,p.useState)("overview"),[y,k]=(0,p.useState)(!0),[s,l]=(0,p.useState)(null),[j,_]=(0,p.useState)(null),[I,v]=(0,p.useState)(null),[$,C]=(0,p.useState)([]),[E,P]=(0,p.useState)([]),[w,g]=(0,p.useState)([]),[U,F]=(0,p.useState)(!1),[R,D]=(0,p.useState)(!1),T=(0,p.useRef)(!0);(0,p.useEffect)(()=>()=>{T.current=!1},[]),(0,p.useEffect)(()=>{const A="noindex, nofollow, noarchive";let h=document.querySelector('meta[name="robots"]');const M=h?h.getAttribute("content"):null;return h?h.setAttribute("content",A):(h=document.createElement("meta"),h.name="robots",h.content=A,document.head.appendChild(h)),()=>{M!==null?h.setAttribute("content",M):h.remove()}},[]);const K=(0,p.useCallback)(async()=>{if(!i)return;const A=`${i}-${Se()}`,h=Xa(A);if(h){h.deceased&&l(h.deceased),h.nextOfKin&&v(h.nextOfKin),h.postmortem&&_(h.postmortem),h.charges&&P(h.charges),h.payments&&C(h.payments),h.requests&&g(h.requests),k(!1);return}k(!0);try{const M=Se(),d=we?we():localStorage.getItem("token")||"",S={"x-tenant-slug":M,Authorization:`Bearer ${d}`},ie=await Promise.allSettled([ae.get(`${Te}/${i}`,{headers:S}),ae.get(`${Te}/postmortem/${i}`,{headers:S}).catch(()=>null),ae.get(`${Te}/${i}/next-of-kin`,{headers:S}).catch(()=>null),ae.get(`${V.FULL_API_URL}/documents/${i}`,{headers:{"x-tenant-slug":M,Authorization:d?`Bearer ${d}`:""},withCredentials:!1}).catch(()=>null),ae.get(`${Te}/billing-summary/${i}`,{headers:S}).catch(()=>null),ae.get(`${Te}/charge-settings/${i}`,{headers:S}).catch(()=>null),ae.get(`${V.FULL_API_URL}/body-release/by-admission/${encodeURIComponent(i)}`,{headers:S}).catch(()=>null),ae.get(`${V.FULL_API_URL}/postmortem-requests`,{headers:S,params:{deceased_id:i}}).catch(()=>null)]);if(!T.current)return;const[se,oe,ne,m,O,X,xe,de]=ie;if(se.status==="fulfilled"&&se.value?.data?.data){const u=se.value.data.data;u.admission_number||u.admission_no;const N={...u,admission_no:u.admission_number,admission_time:u.time_received,admitted_by:u.receiving_officer,time_of_death:null,attending_physician:u.physician,embalmed:u.admission_status==="embalmed",embalmed_date:null,storage_location:u.chamber_assigned,morgue_slot:u.chamber_assigned,body_condition:u.body_status,tel_number:u.phone_number,tell_no:u.phone_number};l(N)}oe.status==="fulfilled"&&oe.value?.data?.data&&_(oe.value.data.data);let fe=!1;if(ne.status==="fulfilled"&&ne.value){const u=Array.isArray(ne.value.data?.data)?ne.value.data.data:ne.value.data?.data?[ne.value.data.data]:[];u.length>0&&(v(u[0]),fe=!0)}if(!fe&&se.status==="fulfilled"){const u=se.value?.data?.data;u&&(u.contact_person||u.phone_number||u.relationship||u.national_id)&&v({full_name:u.contact_person||"",relationship:u.relationship||"",contact:u.tel_number||u.phone_number||"",alternative_contact:u.alternative_phone||"",id_number:u.national_id||"",email:u.email||"",is_primary:1,_synthetic:!0})}if(m.status==="fulfilled"&&m.value)if(m.value.data?.files){const u=m.value.data.files.map(N=>({name:N.originalName,file_name:N.storedName||N.originalName,type:N.category||"Document",created_at:N.uploadedAt||N.uploaded_at,document_id:N.documentId,url:N.url}));l(N=>N&&{...N,documents:u})}else m.value.data?.data&&l(u=>u&&{...u,documents:m.value.data.data});if(O.status==="fulfilled"&&O.value?.data?.data){const u=O.value.data.data;u.charges&&P(Array.isArray(u.charges)?u.charges:[u.charges]),u.payments&&C(Array.isArray(u.payments)?u.payments:[])}if(X.status==="fulfilled"&&X.value?.data?.data){const u=X.value.data.data;l(N=>N&&{...N,charges:{storage_rate:parseFloat(u.dailyRate??u.daily_rate??u.storage_rate??u.per_day??N?.charges?.storage_rate??500),per_day:parseFloat(u.dailyRate??u.daily_rate??N?.charges?.per_day??500),per_hour:parseFloat(u.hourlyRate??u.hourly_rate??N?.charges?.per_hour??125),currency:u.currency??N?.charges?.currency??"KES",rate_profile:u.rateProfile??u.rate_profile??"standard",charge_type:u.chargeType??u.charge_type??"daily",usd_rate:parseFloat(u.usdRate??u.usd_rate??N?.charges?.usd_rate??130),updated_at:u.updatedAt??u.updated_at??null}})}xe.status==="fulfilled"&&xe.value?.data?.data&&l(u=>u&&{...u,releaseData:xe.value.data.data}),de.status==="fulfilled"&&Array.isArray(de.value?.data?.data)&&g(de.value.data.data),Za(A,{deceased:se.status==="fulfilled"?se.value?.data?.data:null,nextOfKin:ne.status==="fulfilled"?Array.isArray(ne.value?.data?.data)?ne.value.data.data[0]:ne.value?.data?.data:null,postmortem:oe.status==="fulfilled"?oe.value?.data?.data:null,charges:O.status==="fulfilled"?O.value?.data?.data?.charges||[]:[],payments:O.status==="fulfilled"?O.value?.data?.data?.payments||[]:[],requests:de.status==="fulfilled"?de.value?.data?.data||[]:[]})}catch(M){console.error("Error fetching deceased detail:",M),le.error("Failed to load deceased details")}finally{T.current&&k(!1)}},[i]);(0,p.useEffect)(()=>{K()},[K]);const x=A=>n(A),L=(0,p.useMemo)(()=>E.reduce((A,h)=>A+parseFloat(h.amount||h.charge_amount||0),0),[E]),B=L-(0,p.useMemo)(()=>$.reduce((A,h)=>A+parseFloat(h.amount||0),0),[$]),q=s?.deceased_id||s?.deceasedId||i;return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(Qa,{}),(0,e.jsxs)(en,{children:[(0,e.jsx)(Xt,{position:"top-right"}),(0,e.jsx)(Rr,{deceased:s,onBack:()=>{const A=Se();b(`/tenant/${A}/all-deceased`)},onTabSwitch:x,onChargeSettingsClick:()=>F(!0),onRefresh:K,onScanClick:()=>D(!0)}),(0,e.jsxs)(tn,{children:[(0,e.jsxs)(rn,{children:[(0,e.jsx)(an,{children:on.map(A=>(0,e.jsx)(nn,{$active:c===A.key,onClick:()=>x(A.key),children:A.label},A.key))}),(0,e.jsxs)(sn,{children:[(0,e.jsx)($e,{$active:c==="overview",children:(0,e.jsx)(Oa,{deceased:s,nextOfKin:I})}),(0,e.jsx)($e,{$active:c==="postmortem",children:(0,e.jsx)(fa,{postmortem:j,deceasedId:i,deceasedName:s?.full_name||s?.name||"",deceasedAdmission:s?.admission_number||s?.admission_no||"",requests:w,onRequestsChanged:K})}),(0,e.jsx)($e,{$active:c==="financials",children:(0,e.jsx)(Ca,{charges:E,payments:$,deceasedId:i})}),(0,e.jsx)($e,{$active:c==="release",children:(0,e.jsx)(Ya,{deceased:s,nextOfKin:I,deceasedId:i})}),(0,e.jsx)($e,{$active:c==="docs",children:(0,e.jsx)(za,{documents:s?.documents,deceasedId:q})}),(0,e.jsx)($e,{$active:c==="audit",children:(0,e.jsx)(Ha,{deceased:s,postmortem:j,charges:E,payments:$,releaseData:s?.releaseData||null,requests:w})})]})]}),(0,e.jsx)(oa,{deceased:s,postmortem:j,bodyStatus:s?.body_status||s?.status||"In Morgue",totalCharges:L,balance:B,age:s?.age})]}),R&&(0,e.jsx)(qa,{deceasedId:q,deceasedName:s?.full_name||s?.name||"",onClose:()=>D(!1),onScanned:()=>{D(!1),K()}}),U&&(0,e.jsx)(Qr,{isOpen:U,onClose:()=>F(!1),deceasedId:i,deceasedData:s,onUpdate:K})]})]})};export{Sn as default};
