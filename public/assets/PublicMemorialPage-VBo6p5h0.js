import{r as N}from"./chunk-CXHxssQy.js";import{y as T}from"./chunk-CXAmgOhv.js";import{u as Y}from"./chunk-DWc5g_hH.js";import{_ as r,m as P}from"./chunk-DJYPtS2Y.js";import{o as B}from"./chunk-BY9AVXEY.js";import{d as l,i as c}from"./index-DNPiyDLN.js";var d=N(T(),1),e=B(),U=P`
  0%, 100% { opacity: 1; transform: scaleY(1); }
  25% { opacity: 0.9; transform: scaleY(0.98); }
  50% { opacity: 1; transform: scaleY(1.02); }
  75% { opacity: 0.95; transform: scaleY(0.99); }
`,p=P`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`,F=P`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 165, 0, 0.5); }
`,S=r.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0e1a 0%, #111827 50%, #0f172a 100%);
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
`,H=r.div`
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
`,V=r.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: ${p} 0.8s ease;
`,q=r.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #334155);
  border: 4px solid #A67C52;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  animation: ${F} 3s ease-in-out infinite;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,G=r.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  text-align: center;
`,J=r.p`
  color: #94a3b8;
  font-size: 1rem;
  margin: 0;
`,X=r.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 2rem 0;
  animation: ${p} 1s ease;
`,y=r.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: scale(1.1); }
`,f=r.div`
  width: 20px;
  height: 30px;
  background: radial-gradient(ellipse at bottom, #ffd700 0%, #ff8c00 40%, #ff4500 70%, transparent 100%);
  border-radius: 50% 50% 20% 20%;
  animation: ${U} 0.8s ease-in-out infinite;
  filter: blur(0.5px);
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 10px;
    background: radial-gradient(ellipse, rgba(255,165,0,0.3), transparent);
    border-radius: 50%;
  }
`,j=r.div`
  width: 12px;
  height: 40px;
  background: linear-gradient(180deg, #f5f5dc 0%, #ddd 100%);
  border-radius: 2px;
  margin-top: -5px;
`,w=r.span`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.5rem;
`,K=r.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`,Q=r.div`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: ${p} 0.6s ease;
`,W=r.textarea`
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #A67C52;
  }
  &::placeholder { color: #64748b; }
`,Z=r.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`,D=r.button`
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #A67C52 0%, #C9A876 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`,ee=r.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover { background: rgba(148, 163, 184, 0.2); color: #e2e8f0; }
`,re=r.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  animation: ${p} 0.5s ease;
`,te=r.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`,ae=r.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A67C52, #C9A876);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
`,ne=r.div`
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
`,ie=r.div`
  font-size: 0.75rem;
  color: #64748b;
`,oe=r.p`
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem;
`;r.img`
  width: 100%;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  max-height: 400px;
  object-fit: cover;
`;var se=r.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
`,C=r.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: ${n=>n.active?"#ef4444":"#64748b"};
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover { color: #ef4444; }
`,de=r.div`
  background: rgba(166, 124, 82, 0.1);
  border: 1px solid rgba(166, 124, 82, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`,le=r.h3`
  color: #A67C52;
  font-size: 1rem;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,ce=r.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  &:last-child { border-bottom: none; }
`,me=r.div`
  color: #A67C52;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 80px;
`,ge=r.div`
  color: #e2e8f0;
  font-size: 0.9rem;
`,ve=()=>{const{tenantSlug:n,deceasedId:x}=Y(),[o,E]=(0,d.useState)(null),[L,g]=(0,d.useState)([]),[m,u]=(0,d.useState)(""),[z,h]=(0,d.useState)(0),[b,k]=(0,d.useState)(null),[M,I]=(0,d.useState)(!0),[_,R]=(0,d.useState)("");(0,d.useEffect)(()=>{R(window.location.href),O()},[n,x]);const O=async()=>{try{const t=await c.get(l.PUBLIC.DECEASED_RECORD(n,x),{headers:{"x-tenant-slug":n}});E(t.data?.data||t.data);try{const a=await c.get(l.MEMORIAL.CANDLES(n),{headers:{"x-tenant-slug":n}});h(a.data?.count||a.data?.data?.length||0)}catch{h(0)}try{const a=await c.get(l.MEMORIAL.CONDOLENCES(n),{headers:{"x-tenant-slug":n}}),s=a.data?.data||a.data||[];g(Array.isArray(s)?s.map(i=>({id:i.id,author:i.author_name||i.name||"Visitor",content:i.message||i.content,time:i.created_at?new Date(i.created_at).toLocaleDateString():"recent",likes:i.likes||0,comments:i.comments||0})):[])}catch{g([])}try{const a=await c.get(l.MEMORIAL.PROGRAM(n),{headers:{"x-tenant-slug":n}}),s=a.data?.data||a.data||null;if(s){const i=Array.isArray(s)?s:s.events||[];k(i.length>0?i:null)}}catch{k(null)}}catch(t){console.error("Error loading memorial:",t)}finally{I(!1)}},v=async()=>{try{await c.post(l.MEMORIAL.LIGHT(n),{},{headers:{"x-tenant-slug":n}}),h(t=>t+1)}catch{h(a=>a+1)}},$=async()=>{if(m.trim())try{const t={id:(await c.post(l.MEMORIAL.ADD_CONDOLENCE(n),{message:m,deceased_id:x},{headers:{"x-tenant-slug":n}})).data?.id||Date.now(),author:"Visitor",content:m,time:"Just now",likes:0,comments:0};g(a=>[t,...a]),u("")}catch{const a={id:Date.now(),author:"Visitor",content:m,time:"Just now",likes:0,comments:0};g(s=>[a,...s]),u("")}},A=()=>{navigator.share?navigator.share({title:`In Memory of ${o?.full_name||" Loved One"}`,url:_}):(navigator.clipboard.writeText(_),alert("Link copied to clipboard!"))};return M?(0,e.jsx)(S,{children:(0,e.jsx)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",color:"#94a3b8"},children:(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)(f,{size:48,color:"#A67C52",style:{marginBottom:"1rem"}}),(0,e.jsx)("p",{children:"Loading memorial..."})]})})}):(0,e.jsxs)(S,{children:[(0,e.jsx)(H,{children:(0,e.jsxs)(V,{children:[(0,e.jsx)(q,{children:o?.photo_url?(0,e.jsx)("img",{src:o.photo_url,alt:o.full_name}):(0,e.jsx)("span",{children:"🕊️"})}),(0,e.jsx)(G,{children:o?.full_name||"In Loving Memory"}),(0,e.jsxs)(J,{children:[o?.date_of_death?new Date(o.date_of_death).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):"",o?.date_of_birth?` — ${new Date(o.date_of_birth).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`:""]}),(0,e.jsx)("p",{style:{color:"#94a3b8",fontSize:"0.9rem",fontStyle:"italic",margin:"0.5rem 0"},children:'"Forever in our hearts"'})]})}),(0,e.jsxs)(X,{children:[(0,e.jsxs)(y,{onClick:v,children:[(0,e.jsx)(f,{}),(0,e.jsx)(j,{}),(0,e.jsxs)(w,{children:[z," candles lit"]})]}),(0,e.jsxs)(y,{onClick:v,children:[(0,e.jsx)(f,{style:{animationDelay:"0.3s"}}),(0,e.jsx)(j,{}),(0,e.jsx)(w,{children:"Light a candle"})]}),(0,e.jsxs)(y,{onClick:v,children:[(0,e.jsx)(f,{style:{animationDelay:"0.6s"}}),(0,e.jsx)(j,{}),(0,e.jsx)(w,{children:"Share love"})]})]}),(0,e.jsxs)(K,{children:[b&&b.length>0&&(0,e.jsxs)(de,{children:[(0,e.jsxs)(le,{children:[(0,e.jsx)(Clock,{size:16})," Order of Events"]}),b.map((t,a)=>(0,e.jsxs)(ce,{children:[(0,e.jsx)(me,{children:t.time||t.event_time||`Event ${a+1}`}),(0,e.jsx)(ge,{children:t.description||t.title||t.event_name})]},a))]}),(0,e.jsxs)(Q,{children:[(0,e.jsx)(W,{value:m,onChange:t=>u(t.target.value),placeholder:"Share a memory, prayer, or tribute..."}),(0,e.jsxs)(Z,{children:[(0,e.jsxs)(ee,{children:["📷 Add Photo",(0,e.jsx)("input",{type:"file",accept:"image/*",style:{display:"none"}})]}),(0,e.jsx)(D,{onClick:$,children:"Post Tribute"})]})]}),L.map(t=>(0,e.jsxs)(re,{children:[(0,e.jsxs)(te,{children:[(0,e.jsx)(ae,{children:t.author[0]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(ne,{children:t.author}),(0,e.jsx)(ie,{children:t.time})]})]}),(0,e.jsx)(oe,{children:t.content}),(0,e.jsxs)(se,{children:[(0,e.jsxs)(C,{children:["❤️ ",t.likes]}),(0,e.jsxs)(C,{children:["💬 ",t.comments]}),(0,e.jsx)(C,{onClick:A,children:"🔗 Share"})]})]},t.id)),(0,e.jsx)("div",{style:{textAlign:"center",padding:"2rem 0"},children:(0,e.jsx)(D,{onClick:A,style:{padding:"0.8rem 2rem"},children:"🔗 Share Memorial Link"})})]})]})};export{ve as default};
