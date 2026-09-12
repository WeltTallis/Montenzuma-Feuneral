import{r as Re}from"./chunk-CXHxssQy.js";import{y as Ve}from"./chunk-CXAmgOhv.js";import{l as Ke,u as qe}from"./chunk-DWc5g_hH.js";import{_ as n}from"./chunk-DJYPtS2Y.js";import{a as c,o as Ge,r as He}from"./chunk-CwzAxjA3.js";import{n as Ye,o as Ze,r as Xe,t as Je}from"./chunk-BY9AVXEY.js";import{Bt as ke,Gt as Qe,Hn as er,Kn as De,Mn as he,On as rr,Un as J,Vn as tr,X as or,_ as nr,bt as ir,d as T,en as ar,hn as re,i as X,it as sr,j as lr,ln as Se,on as dr,qn as Te,tn as de,tt as ce,ut as k,yn as cr}from"./index-Cp7mIUwY.js";var d=Re(Ve(),1),mr=Re(He(),1),fe=null,ze=!1,pr=()=>{if(!fe)try{fe=new(window.AudioContext||window.webkitAudioContext)}catch{return console.warn("AudioContext not available"),null}return fe},ur=(t="warning")=>{try{const l=pr();if(!l)return;const s=l.createOscillator(),p=l.createGain();s.connect(p),p.connect(l.destination),t==="warning"?(s.frequency.setValueAtTime(880,l.currentTime),s.frequency.setValueAtTime(660,l.currentTime+.15),s.type="square",p.gain.setValueAtTime(.15,l.currentTime),p.gain.exponentialRampToValueAtTime(.01,l.currentTime+.4),s.start(l.currentTime),s.stop(l.currentTime+.4)):t==="error"?(s.frequency.setValueAtTime(330,l.currentTime),s.frequency.setValueAtTime(220,l.currentTime+.2),s.type="sawtooth",p.gain.setValueAtTime(.2,l.currentTime),p.gain.exponentialRampToValueAtTime(.01,l.currentTime+.5),s.start(l.currentTime),s.stop(l.currentTime+.5)):t==="success"&&(s.frequency.setValueAtTime(523,l.currentTime),s.frequency.setValueAtTime(659,l.currentTime+.1),s.frequency.setValueAtTime(784,l.currentTime+.2),s.type="sine",p.gain.setValueAtTime(.1,l.currentTime),p.gain.exponentialRampToValueAtTime(.01,l.currentTime+.3),s.start(l.currentTime),s.stop(l.currentTime+.3))}catch(l){ze||(console.warn("Audio warning not available:",l.message),ze=!0)}},hr=async(t,l,s)=>(ur("warning"),await new Promise(p=>setTimeout(p,200)),(await s.fire({icon:"warning",title:t||"Are you sure?",text:l||"This action cannot be undone.",showCancelButton:!0,confirmButtonColor:"#DC2626",cancelButtonColor:"#6B7280",confirmButtonText:"Yes, delete it!",cancelButtonText:"Cancel",showClass:{popup:"swal2-noanimation",backdrop:"swal2-noanimation"}})).isConfirmed),e=Ze();Xe.workerSrc="/pdf.worker.min.js";var Ue=n.div`
  min-height: 100vh;
  padding: 0.5rem;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 0.25rem;
  }
`,fr=n.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`,gr=n.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
`,xr=n.input`
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    min-width: 150px;
    padding: 0.5rem 0.6rem;
  }
`,br=n.select`
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.6rem;
  }
`,wr=n.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`,vr=n.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`,jr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: #f8fafc;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border-color: #3b82f6;
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 0.6rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`,yr=n.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`,Cr=n.div`
  flex: 1;
  min-width: 0;
`,kr=n.h4`
  margin: 0 0 0.3rem 0;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
  word-break: break-word;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
`,Dr=n.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  line-height: 1.2;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`,Sr=n.span`
  background: ${t=>t.color||"#e2e8f0"};
  color: ${t=>t.textColor||"#475569"};
  padding: 0.15rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
`,Le=n.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${t=>t.bgColor};
  color: ${t=>t.textColor};
  padding: 0.2rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.65rem;
    padding: 0.15rem 0.3rem;
  }
`,Tr=n.div`
  display: flex;
  gap: 0.3rem;

  @media (max-width: 768px) {
    justify-content: space-between;
    gap: 0.2rem;
  }
`,C=n.button`
  background: ${t=>t.bgColor||"#3b82f6"};
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  &:hover {
    background: ${t=>t.hoverColor||"#2563eb"};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 0.3rem;
    flex: 1;
    font-size: 0.7rem;
  }
`,zr=n.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 0.5rem;
  backdrop-filter: blur(4px);
`,Ur=n.div`
  background: #ffffff;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 100%;
  height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  &.fullscreen {
    height: 100vh;
    border-radius: 0;
    max-width: 100vw;
  }

  @media (max-width: 768px) {
    height: 100vh;
    border-radius: 0;
    max-width: 100vw;
  }
`,Lr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 0.75rem;
  z-index: 10;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
  }
`,Fr=n.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: 200px;
    font-size: 0.9rem;
  }
`,Rr=n.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`,Or=n.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.25rem;
`,Er=n.input`
  width: 50px;
  padding: 0.25rem;
  border: none;
  text-align: center;
  font-size: 0.875rem;
  background: transparent;
  
  &:focus {
    outline: none;
    background: #f1f5f9;
    border-radius: 0.25rem;
  }
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`,Nr=n.span`
  font-size: 0.875rem;
  color: #64748b;
  padding: 0 0.25rem;
`,Pr=n.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.25rem;
`,Ar=n.span`
  font-size: 0.875rem;
  color: #475569;
  padding: 0 0.5rem;
  min-width: 45px;
  text-align: center;
`,x=n.button`
  background: ${t=>t.bgColor||"white"};
  color: ${t=>t.textColor||"#475569"};
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;

  &:hover {
    background: ${t=>t.hoverColor||"#f1f5f9"};
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    min-width: 32px;
    min-height: 32px;
    padding: 0.3rem 0.5rem;
  }
`,Ir=n.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background: #f1f5f9;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`,Br=n.div`
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`,Wr=n.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.9;
`,Mr=n.div`
  display: none;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.5rem;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    display: flex;
  }
`,_r=n.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  min-width: 60px;
  text-align: center;
`,$r=n.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 1rem;
`,Vr=n.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,Kr=n.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ef4444;
  text-align: center;
  padding: 2rem;
  gap: 0.5rem;
`,qr=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.75rem;
`,Gr=n.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.75rem;
  text-decoration: underline;
  
  &:hover {
    color: #475569;
  }
`,te=n.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 0.5rem;
`,oe=n.div`
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: ${t=>t.size==="large"?"95vw":"500px"};
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
`,ne=n.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
  }
`,ie=n.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`,ae=n.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f1f5f9;
    color: #374151;
  }
`,se=n.div`
  flex: 1;
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`,Hr=n.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,$=n.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`,V=n.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,ge=n.input`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`,Fe=n.select`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`,Yr=n.textarea`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`,Zr=n.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`,Xr=n.div`
  border: 2px dashed #e2e8f0;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  &.dragover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
`,Jr=n.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`,xe={Identification:{bg:"#dbeafe",text:"#1e40af"},"Next of Kin":{bg:"#f3e8ff",text:"#7c3aed"},Billing:{bg:"#dcfce7",text:"#166534"},"Release Forms":{bg:"#fef3c7",text:"#92400e"},"Case File":{bg:"#fce7f3",text:"#be185d"},"Medical Records":{bg:"#ffedd5",text:"#9a3412"},"Legal Documents":{bg:"#e0e7ff",text:"#3730a3"},General:{bg:"#f1f5f9",text:"#475569"}},le={date:{bg:"#fef3c7",text:"#92400e"},size:{bg:"#d1fae5",text:"#065f46"},type:{bg:"#e0e7ff",text:"#3730a3"},format:{bg:"#fce7f3",text:"#be185d"},user:{bg:"#f3e8ff",text:"#7c3aed"},barcode:{bg:"#fff7ed",text:"#9a3412"}},Qr=t=>{const l=t.documentId||t.id||Date.now().toString();return`${t.category?t.category.substring(0,3).toUpperCase():"DOC"}-${l.toString().slice(-6).padStart(6,"0")}-${t.uploadedAt?new Date(t.uploadedAt).getTime().toString(36).slice(-4).toUpperCase():"0000"}`},et=({code:t,documentName:l})=>{(0,d.useRef)(null);const[s,p]=(0,d.useState)(!1),w=async()=>{try{await navigator.clipboard.writeText(t),p(!0),c.success("Barcode copied to clipboard"),setTimeout(()=>p(!1),2e3)}catch{c.error("Failed to copy barcode")}},A=()=>{const D=window.open("","_blank");D.document.write(`
      <html><head><title>Document Barcode</title>
      <style>
        body { font-family: monospace; text-align: center; padding: 20px; }
        .barcode { font-size: 24px; letter-spacing: 3px; margin: 10px 0; 
                   border: 2px solid #000; padding: 10px 20px; display: inline-block; }
        .name { font-size: 12px; margin: 5px 0; color: #666; }
        .code { font-size: 10px; color: #999; }
      </style></head><body>
        <div class="name">${l||"Document"}</div>
        <div class="barcode">${t}</div>
        <div class="code">Scan to track this document</div>
      </body></html>
    `),D.document.close(),D.print()};return(0,e.jsxs)("div",{style:{textAlign:"center",padding:"1rem"},children:[(0,e.jsx)("div",{style:{fontFamily:"monospace",fontSize:"1.5rem",letterSpacing:"3px",border:"2px solid #1e293b",borderRadius:"0.5rem",padding:"1rem 1.5rem",background:"white",display:"inline-block",marginBottom:"0.5rem",fontWeight:"bold"},children:t}),(0,e.jsx)("p",{style:{color:"#64748b",fontSize:"0.75rem",margin:"0.5rem 0"},children:"Scan or enter this code to track the document"}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",justifyContent:"center",marginTop:"1rem"},children:[(0,e.jsxs)("button",{onClick:w,style:{background:s?"#10b981":"#3b82f6",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"0.375rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.8rem",fontWeight:600},children:[(0,e.jsx)(or,{size:14})," ",s?"Copied!":"Copy Code"]}),(0,e.jsxs)("button",{onClick:A,style:{background:"#f59e0b",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"0.375rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.8rem",fontWeight:600},children:[(0,e.jsx)(de,{size:14})," Print Label"]})]})]})},rt=({document:t,onClose:l})=>{const[s,p]=(0,d.useState)(null),[w,A]=(0,d.useState)(1),[D,z]=(0,d.useState)(1),[me,I]=(0,d.useState)(0),[F,K]=(0,d.useState)(!1),[f,B]=(0,d.useState)(navigator.onLine),[b,R]=(0,d.useState)(!1),[v,Q]=(0,d.useState)(null),S=(0,d.useRef)(null),O=(0,d.useRef)(null);(0,d.useEffect)(()=>{(async()=>{if("caches"in window)try{const L=await(await caches.open("pdf-viewer-cache")).match(t.url);if(L){R(!0);const pe=await L.blob();Q(pe)}}catch(L){console.error("Cache error:",L)}})();const a=()=>B(!0),Y=()=>B(!1);return window.addEventListener("online",a),window.addEventListener("offline",Y),()=>{window.removeEventListener("online",a),window.removeEventListener("offline",Y)}},[t.url]);const u=async()=>{if("caches"in window)try{await caches.delete("pdf-viewer-cache"),R(!1),Q(null),c.success("Cache cleared")}catch(o){console.error("Failed to clear cache:",o)}};function E({numPages:o}){p(o),A(1),O.current&&O.current.scrollTo({top:0,behavior:"smooth"})}const W=o=>{o>=1&&o<=s&&(A(o),O.current&&O.current.scrollTo({top:0,behavior:"smooth"}))},U=()=>W(w-1),q=()=>W(w+1),N=()=>z(o=>Math.min(o+.25,3)),y=()=>z(o=>Math.max(o-.25,.5)),M=()=>{if(S.current){const o=S.current.offsetWidth;z(o/800)}},G=()=>z(1),H=()=>I(o=>(o+90)%360),_=()=>{t.fullscreenElement?(t.exitFullscreen?.(),K(!1)):(S.current?.requestFullscreen?.(),K(!0))},ee=()=>{try{if(v){const o=URL.createObjectURL(v),a=window.open(o,"_blank");a&&(a.onload=()=>{a.print(),setTimeout(()=>URL.revokeObjectURL(o),1e3)})}else{const o=t.createElement("iframe");o.style.display="none",o.src=t.url,t.body.appendChild(o),o.onload=()=>{setTimeout(()=>{o.contentWindow.print(),setTimeout(()=>{t.body.removeChild(o)},1e3)},500)}}c.info("Opening print dialog...")}catch(o){console.error("Print error:",o),c.error("Failed to print document")}},P=()=>{try{const o=t.createElement("a");if(v){const a=URL.createObjectURL(v);o.href=a,o.download=t.originalName||"document.pdf",t.body.appendChild(o),o.click(),t.body.removeChild(o),URL.revokeObjectURL(a)}else o.href=t.url,o.download=t.originalName||"document.pdf",o.target="_blank",t.body.appendChild(o),o.click(),t.body.removeChild(o);c.success("Download started...")}catch(o){console.error("Download error:",o),c.error("Failed to download document")}};return(0,d.useEffect)(()=>{const o=a=>{if(!(a.target.tagName==="INPUT"||a.target.tagName==="TEXTAREA"))switch(a.key){case"ArrowLeft":case"ArrowUp":!a.ctrlKey&&!a.metaKey&&(a.preventDefault(),U());break;case"ArrowRight":case"ArrowDown":!a.ctrlKey&&!a.metaKey&&(a.preventDefault(),q());break;case"+":case"=":(a.ctrlKey||a.metaKey)&&(a.preventDefault(),N());break;case"-":(a.ctrlKey||a.metaKey)&&(a.preventDefault(),y());break;case"0":(a.ctrlKey||a.metaKey)&&(a.preventDefault(),G());break;case"f":(a.ctrlKey||a.metaKey)&&(a.preventDefault(),_());break;case"Escape":F?_():l()}};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[w,s,D,F,l]),(0,e.jsx)(zr,{onClick:l,children:(0,e.jsxs)(Ur,{ref:S,onClick:o=>o.stopPropagation(),className:F?"fullscreen":"",children:[(0,e.jsxs)(Lr,{children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[(0,e.jsx)(k,{size:20,color:"#3b82f6"}),(0,e.jsx)(Fr,{children:t.originalName}),(0,e.jsxs)(Rr,{children:[f?(0,e.jsx)(tr,{size:14,color:"#10b981",title:"Online"}):(0,e.jsx)(er,{size:14,color:"#ef4444",title:"Offline"}),b&&(0,e.jsx)(cr,{size:14,color:"#3b82f6",title:"Available offline"})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",alignItems:"center"},children:[(0,e.jsxs)(Or,{children:[(0,e.jsx)(x,{onClick:U,disabled:w<=1,title:"Previous page (←)",children:"←"}),(0,e.jsx)(Er,{type:"number",min:"1",max:s||1,value:w,onChange:o=>W(parseInt(o.target.value))}),(0,e.jsxs)(Nr,{children:["of ",s||"?"]}),(0,e.jsx)(x,{onClick:q,disabled:w>=(s||1),title:"Next page (→)",children:"→"})]}),(0,e.jsxs)(Pr,{children:[(0,e.jsx)(x,{onClick:y,title:"Zoom out (Ctrl+-)",children:(0,e.jsx)(Te,{size:16})}),(0,e.jsxs)(Ar,{children:[Math.round(D*100),"%"]}),(0,e.jsx)(x,{onClick:N,title:"Zoom in (Ctrl++)",children:(0,e.jsx)(De,{size:16})}),(0,e.jsx)(x,{onClick:M,title:"Fit to width",children:(0,e.jsx)(ke,{size:16})}),(0,e.jsx)(x,{onClick:G,title:"Reset zoom (Ctrl+0)",children:"100%"})]}),(0,e.jsx)(x,{onClick:H,title:"Rotate",children:(0,e.jsx)(dr,{size:16})}),(0,e.jsx)(x,{onClick:P,bgColor:"#10b981",hoverColor:"#059669",title:"Download",children:(0,e.jsx)(ce,{size:16})}),(0,e.jsx)(x,{onClick:ee,bgColor:"#f59e0b",hoverColor:"#d97706",title:"Print",children:(0,e.jsx)(de,{size:16})}),(0,e.jsx)(x,{onClick:_,title:F?"Exit fullscreen (Esc)":"Enter fullscreen (Ctrl+F)",children:F?(0,e.jsx)(Qe,{size:16}):(0,e.jsx)(ke,{size:16})}),(0,e.jsx)(x,{onClick:l,bgColor:"#ef4444",hoverColor:"#dc2626",title:"Close (Esc)",children:(0,e.jsx)(J,{size:16})})]})]}),(0,e.jsx)(Ir,{ref:O,children:(0,e.jsx)(Ye,{file:v?URL.createObjectURL(v):t.url,onLoadSuccess:E,loading:(0,e.jsxs)($r,{children:[(0,e.jsx)(Vr,{}),(0,e.jsx)("p",{children:"Loading PDF..."}),!f&&b&&(0,e.jsx)("p",{children:"Showing cached version"})]}),error:(0,e.jsxs)(Kr,{children:[(0,e.jsx)("p",{children:"Failed to load PDF"}),!f&&!b&&(0,e.jsx)("p",{children:"PDF not available offline. Please connect to internet."})]}),children:Array.from(new Array(s),(o,a)=>(0,e.jsxs)(Br,{children:[(0,e.jsx)(Je,{pageNumber:a+1,scale:D,rotate:me,renderTextLayer:!0,renderAnnotationLayer:!0,loading:(0,e.jsxs)("div",{children:["Loading page ",a+1,"..."]})}),(0,e.jsxs)(Wr,{children:["Page ",a+1," of ",s]})]},`page_${a+1}`))})}),(0,e.jsxs)(Mr,{children:[(0,e.jsx)(x,{onClick:U,disabled:w<=1,children:"←"}),(0,e.jsxs)(_r,{children:[w," / ",s||"?"]}),(0,e.jsx)(x,{onClick:q,disabled:w>=(s||1),children:"→"}),(0,e.jsx)("div",{style:{flex:1}}),(0,e.jsx)(x,{onClick:y,children:(0,e.jsx)(Te,{size:18})}),(0,e.jsx)(x,{onClick:N,children:(0,e.jsx)(De,{size:18})}),(0,e.jsx)(x,{onClick:P,children:(0,e.jsx)(ce,{size:18})})]}),(0,e.jsxs)(qr,{children:[(0,e.jsx)("small",{style:{color:"#64748b"},children:b?"✓ Available offline":"Online only"}),b&&(0,e.jsx)(Gr,{onClick:u,children:"Clear cache"})]})]})})},dt=()=>{const t=qe(),l=Ke(),[s,p]=(0,d.useState)([]),[w,A]=(0,d.useState)([]),[D,z]=(0,d.useState)(null),[me,I]=(0,d.useState)(!0),[F,K]=(0,d.useState)(!1),[f,B]=(0,d.useState)(null),[b,R]=(0,d.useState)(null),[v,Q]=(0,d.useState)(""),[S,O]=(0,d.useState)("all"),[u,E]=(0,d.useState)({email:"",method:"whatsapp",message:""}),[W,U]=(0,d.useState)(!1),[q,N]=(0,d.useState)(!1),[y,M]=(0,d.useState)(null),[G,H]=(0,d.useState)("General"),[_,ee]=(0,d.useState)(!1),[P,o]=(0,d.useState)(null),a=t.deceasedId||t.id,Y=()=>{try{const r=localStorage.getItem("user");if(r){const i=JSON.parse(r);return i.name||i.username||i.email||"User"}}catch(r){console.error("Error getting user data:",r)}return"User"};(0,d.useEffect)(()=>{a?(L(),pe()):I(!1)},[a]),(0,d.useEffect)(()=>{Oe()},[s,v,S]);const L=async()=>{try{I(!0);const r=await X.get(T.DOCUMENTS.LIST(a));r.data&&r.data.success?p(r.data.files||[]):p([]),I(!1)}catch(r){console.error("Error fetching documents:",r);let i="Failed to fetch documents";r.code==="ECONNABORTED"?i="Request timeout - server is not responding":r.response?i=`Server error: ${r.response.status}`:r.request&&(i="No response from server - check if backend is running"),c.error(i),I(!1)}},pe=async()=>{try{const r=await X.get(T.DECEASED.DETAIL(a));r.data&&r.data.data?z(r.data.data):z({full_name:"Unknown Deceased"})}catch{console.log("Could not fetch deceased details, using fallback"),z({full_name:"Unknown Deceased"})}},Oe=()=>{let r=s;v&&(r=r.filter(i=>i.originalName?.toLowerCase().includes(v.toLowerCase())||i.category?.toLowerCase().includes(v.toLowerCase())||i.mimeType?.toLowerCase().includes(v.toLowerCase()))),S!=="all"&&(r=r.filter(i=>i.category===S)),A(r)},be=async r=>{try{const i=T.DOCUMENTS.DOWNLOAD(r.documentId),m=await fetch(i,{headers:{"x-tenant-slug":localStorage.getItem("tenantSlug")||"system_shared"}});if(!m.ok)throw new Error(`HTTP error! status: ${m.status}`);const g=await m.blob(),j=window.URL.createObjectURL(g),h=r.createElement("a");h.href=j,h.download=r.originalName||"document",r.body.appendChild(h),h.click(),r.body.removeChild(h),window.URL.revokeObjectURL(j),c.success(`Downloading ${r.originalName||"document"}...`)}catch(i){console.error("Error downloading document:",i),c.error("Failed to download document: "+i.message)}},Ee=async r=>{try{const i=T.DOCUMENTS.DOWNLOAD(r.documentId);if(r.mimeType==="application/pdf"||r.originalName?.toLowerCase().endsWith(".pdf"))B({...r,url:i}),c.info("Opening PDF document...");else{const m=await fetch(i,{headers:{"x-tenant-slug":localStorage.getItem("tenantSlug")||"system_shared"}});if(!m.ok)throw new Error(`HTTP error! status: ${m.status}`);const g=await m.blob(),j=URL.createObjectURL(g);B({...r,url:j}),c.info(`Opening ${r.originalName||"document"}...`)}}catch(i){console.error("Error viewing document:",i),c.error("Failed to view document: "+i.message)}},we=async r=>{try{const i=T.DOCUMENTS.DOWNLOAD(r.documentId),m=await fetch(i,{headers:{"x-tenant-slug":localStorage.getItem("tenantSlug")||"system_shared"}});if(!m.ok)throw new Error(`HTTP error! status: ${m.status}`);const g=await m.blob(),j=URL.createObjectURL(g);if(r.mimeType==="application/pdf"){const h=r.createElement("iframe");h.style.display="none",h.src=j,r.body.appendChild(h),h.onload=()=>{setTimeout(()=>{h.contentWindow.print(),setTimeout(()=>{r.body.removeChild(h),URL.revokeObjectURL(j)},1e3)},500)}}else{const h=window.open(j,"_blank");h?h.onload=()=>{try{h.print(),setTimeout(()=>URL.revokeObjectURL(j),1e3)}catch(Z){console.error("Print error:",Z),c.error("Failed to print document.")}}:(c.error("Please allow popups for printing"),URL.revokeObjectURL(j))}c.info("Opening document for printing...")}catch(i){console.error("Error printing document:",i),c.error("Failed to print document: "+i.message)}},ve=r=>{R(r),E({email:"",method:"whatsapp",message:`Hello! Please find attached document: ${r.originalName}`})},Ne=async r=>{if(r.preventDefault(),u.method==="email"){if(!u.email){c.error("Please enter an email address");return}U(!0);try{await X.post(T.DOCUMENTS.LIST+"/share",{documentId:b.documentId,recipientEmail:u.email,method:u.method,message:u.message,documentName:b.originalName}),c.success(`Document shared successfully via email to ${u.email}`),R(null)}catch(i){console.error("Error sharing document:",i),c.error("Failed to share document: "+i.message)}finally{U(!1)}}else if(u.method==="whatsapp"){U(!0);try{const i=T.DOCUMENTS.DOWNLOAD(b.documentId),m=await fetch(i,{headers:{"x-tenant-slug":localStorage.getItem("tenantSlug")||"system_shared"}});if(!m.ok)throw new Error(`HTTP error! status: ${m.status}`);const g=await m.blob(),j=new File([g],b.originalName,{type:b.mimeType||"application/pdf"});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[j]}))await navigator.share({files:[j],title:b.originalName,text:u.message}),c.success("Document shared via native share dialog");else{const h=URL.createObjectURL(g),Z=document.createElement("a");Z.href=h,Z.download=b.originalName,Z.click(),c.info("Document downloaded. You can now share it via WhatsApp."),setTimeout(()=>URL.revokeObjectURL(h),1e3)}R(null)}catch(i){console.error("Error sharing via WhatsApp:",i),c.error("Failed to share document: "+i.message)}finally{U(!1)}}},Pe=async(r,i)=>{if(await hr(`Delete "${i}"?`,"This action cannot be undone. All data will be permanently removed.",mr.default))try{K(!0),await X.delete(T.DOCUMENTS.DETAIL(r),{data:{deletedBy:Y()}}),p(m=>m.filter(g=>g.documentId!==r)),c.success("Document deleted successfully")}catch(m){console.error("Error deleting document:",m),c.error("Failed to delete document")}finally{K(!1)}},Ae=r=>{r.preventDefault();const i=r.dataTransfer?.files[0]||r.target.files?.[0];i&&M(i)},Ie=async()=>{if(!y){c.error("Please select a file to upload");return}ee(!0);try{const r=new FormData;r.append("document",y),r.append("category",G),r.append("uploadedBy",Y()),await X.post(T.DOCUMENTS.UPLOAD,r,{headers:{"Content-Type":null}}),c.success("Document uploaded successfully"),N(!1),M(null),H("General"),L()}catch(r){console.error("Error uploading document:",r),c.error("Failed to upload document: "+r.message)}finally{ee(!1)}},ue=()=>{f&&f.url.startsWith("blob:")&&URL.revokeObjectURL(f.url),B(null)},je=()=>{R(null)},ye=()=>{N(!1),M(null),H("General")},Be=(r,i)=>{const m=window.innerWidth<768?18:20;if(!r&&!i)return(0,e.jsx)(k,{size:m,color:"#3b82f6"});const g=i||"";return g.includes("pdf")?(0,e.jsx)(k,{size:m,color:"#ef4444"}):g.includes("image")?(0,e.jsx)(k,{size:m,color:"#10b981"}):g.includes("word")||g.includes("document")?(0,e.jsx)(k,{size:m,color:"#2b579a"}):g.includes("excel")||g.includes("spreadsheet")?(0,e.jsx)(k,{size:m,color:"#217346"}):(0,e.jsx)(k,{size:m,color:"#3b82f6"})},We=r=>r?r<1024?r+" B":r<1048576?(r/1024).toFixed(1)+" KB":(r/1048576).toFixed(1)+" MB":"Unknown size",Me=r=>{if(!r)return"Unknown date";try{return new Date(r).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}catch{return"Invalid date"}},Ce=r=>xe[r]||xe.General,_e=()=>{L()};if(me)return(0,e.jsx)(Ue,{children:(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"50vh",flexDirection:"column",gap:"1rem"},children:[(0,e.jsx)("div",{style:{width:"40px",height:"40px",border:"3px solid #e2e8f0",borderTop:"3px solid #3b82f6",borderRadius:"50%",animation:"spin 1s linear infinite"}}),(0,e.jsx)("p",{style:{color:"#64748b",fontSize:"0.9rem"},children:"Loading documents..."}),(0,e.jsx)("button",{onClick:_e,style:{background:"#3b82f6",color:"white",border:"none",padding:"0.4rem 0.8rem",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.8rem"},children:"Retry"})]})});s&&s.length;const $e=[...new Set(s.map(r=>r.category).filter(Boolean))];return(0,e.jsxs)(Ue,{children:[(0,e.jsx)(Ge,{position:"top-right",autoClose:3e3}),(0,e.jsxs)(fr,{children:[(0,e.jsxs)("div",{style:{flex:1},children:[(0,e.jsxs)("h1",{style:{margin:0,fontSize:window.innerWidth<768?"1.2rem":"1.4rem",fontWeight:"bold",color:"#1e293b",display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.4rem"},children:[(0,e.jsx)(k,{size:window.innerWidth<768?20:22}),"Documents"]}),(0,e.jsxs)("p",{style:{margin:"0.2rem 0 0 0",color:"#64748b",fontSize:window.innerWidth<768?"0.75rem":"0.8rem"},children:["Managing documents for: ",(0,e.jsx)("strong",{children:D?.full_name||"Unknown"})]})]}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",alignItems:"center"},children:[(0,e.jsxs)(wr,{onClick:()=>l(-1),children:[(0,e.jsx)(nr,{size:window.innerWidth<768?14:16}),"Back"]}),(0,e.jsxs)(C,{onClick:()=>N(!0),bgColor:"#10b981",hoverColor:"#059669",title:"Upload Document",children:[(0,e.jsx)(ar,{size:16}),window.innerWidth>=768&&"Upload"]})]})]}),(0,e.jsxs)(gr,{children:[(0,e.jsx)(xr,{type:"text",placeholder:"Search documents...",value:v,onChange:r=>Q(r.target.value)}),(0,e.jsxs)(br,{value:S,onChange:r=>O(r.target.value),children:[(0,e.jsx)("option",{value:"all",children:"All Categories"}),$e.map(r=>(0,e.jsx)("option",{value:r,children:r},r))]})]}),(0,e.jsx)(vr,{children:w.length>0?w.map(r=>(0,e.jsxs)(jr,{children:[(0,e.jsxs)(yr,{children:[Be(r.originalName,r.mimeType),(0,e.jsxs)(Cr,{children:[(0,e.jsx)(kr,{children:r.originalName||"Unnamed Document"}),(0,e.jsxs)(Dr,{children:[(0,e.jsx)(Sr,{color:Ce(r.category).bg,textColor:Ce(r.category).text,children:r.category||"General"}),(0,e.jsxs)(Le,{bgColor:le.date.bg,textColor:le.date.text,children:[(0,e.jsx)(lr,{size:10}),Me(r.uploadedAt)]}),r.sizeKB&&(0,e.jsxs)(Le,{bgColor:le.size.bg,textColor:le.size.text,children:[(0,e.jsx)(ir,{size:10}),We(r.sizeKB*1024)]})]})]})]}),(0,e.jsxs)(Tr,{children:[(0,e.jsxs)(C,{onClick:()=>Ee(r),bgColor:"#3b82f6",hoverColor:"#2563eb",title:"View",children:[(0,e.jsx)(sr,{size:14}),window.innerWidth>=768&&"View"]}),(0,e.jsxs)(C,{onClick:()=>be(r),bgColor:"#10b981",hoverColor:"#059669",title:"Download",children:[(0,e.jsx)(ce,{size:14}),window.innerWidth>=768&&"Download"]}),(0,e.jsxs)(C,{onClick:()=>ve(r),bgColor:"#8b5cf6",hoverColor:"#7c3aed",title:"Share",children:[(0,e.jsx)(re,{size:14}),window.innerWidth>=768&&"Share"]}),(0,e.jsxs)(C,{onClick:()=>we(r),bgColor:"#f59e0b",hoverColor:"#d97706",title:"Print",children:[(0,e.jsx)(de,{size:14}),window.innerWidth>=768&&"Print"]}),(0,e.jsxs)(C,{onClick:()=>Pe(r.documentId,r.originalName),bgColor:"#ef4444",hoverColor:"#dc2626",disabled:F,title:"Delete",children:[(0,e.jsx)(rr,{size:14}),window.innerWidth>=768&&"Delete"]}),(0,e.jsxs)(C,{onClick:()=>o(r),bgColor:"#9333ea",hoverColor:"#7e22ce",title:"Track Barcode",children:[(0,e.jsx)(Se,{size:14}),window.innerWidth>=768&&"Track"]})]})]},r.documentId)):(0,e.jsxs)("div",{style:{textAlign:"center",padding:"2rem",color:"#64748b"},children:[(0,e.jsx)(k,{size:40,color:"#cbd5e1"}),(0,e.jsx)("h3",{style:{color:"#64748b",margin:"1rem 0 0.5rem 0"},children:s.length===0?"No Documents Found":"No Matching Documents"}),s.length===0&&(0,e.jsx)("p",{style:{fontSize:"0.875rem",marginTop:"0.5rem"},children:'Click the "Upload" button to add documents for this deceased.'})]})}),f&&(f.mimeType==="application/pdf"||f.originalName?.toLowerCase().endsWith(".pdf"))?(0,e.jsx)(rt,{document:f,onClose:ue}):f?(0,e.jsx)(te,{onClick:ue,children:(0,e.jsxs)(oe,{onClick:r=>r.stopPropagation(),size:"large",children:[(0,e.jsxs)(ne,{children:[(0,e.jsxs)(ie,{children:[(0,e.jsx)(k,{size:18,style:{marginRight:"0.4rem"}}),f.originalName||"Document Viewer"]}),(0,e.jsx)(ae,{onClick:ue,children:(0,e.jsx)(J,{size:18})})]}),(0,e.jsxs)(se,{children:[(0,e.jsx)("iframe",{src:f.url,title:f.originalName,style:{width:"100%",height:"70vh",border:"none",borderRadius:"0.375rem"}}),(0,e.jsxs)("div",{style:{display:"flex",gap:"0.5rem",marginTop:"1rem",justifyContent:"center",flexWrap:"wrap"},children:[(0,e.jsxs)(C,{onClick:()=>be(f),bgColor:"#10b981",hoverColor:"#059669",children:[(0,e.jsx)(ce,{size:16}),"Download"]}),(0,e.jsxs)(C,{onClick:()=>we(f),bgColor:"#f59e0b",hoverColor:"#d97706",children:[(0,e.jsx)(de,{size:16}),"Print"]}),(0,e.jsxs)(C,{onClick:()=>ve(f),bgColor:"#8b5cf6",hoverColor:"#7c3aed",children:[(0,e.jsx)(re,{size:16}),"Share"]})]})]})]})}):null,b&&(0,e.jsx)(te,{onClick:je,children:(0,e.jsxs)(oe,{onClick:r=>r.stopPropagation(),children:[(0,e.jsxs)(ne,{children:[(0,e.jsxs)(ie,{children:[(0,e.jsx)(re,{size:18,style:{marginRight:"0.4rem"}}),"Share Document"]}),(0,e.jsx)(ae,{onClick:je,children:(0,e.jsx)(J,{size:18})})]}),(0,e.jsx)(se,{children:(0,e.jsxs)(Hr,{onSubmit:Ne,children:[(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Document"}),(0,e.jsx)(ge,{type:"text",value:b.originalName,disabled:!0,style:{background:"#f9fafb"}})]}),(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Share Method"}),(0,e.jsxs)(Fe,{value:u.method,onChange:r=>E({...u,method:r.target.value}),children:[(0,e.jsx)("option",{value:"whatsapp",children:"WhatsApp (Native Share)"}),(0,e.jsx)("option",{value:"email",children:"Email"})]})]}),u.method==="email"?(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Email Address"}),(0,e.jsx)(ge,{type:"email",placeholder:"recipient@example.com",value:u.email,onChange:r=>E({...u,email:r.target.value}),required:!0})]}):(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Phone Number"}),(0,e.jsx)(ge,{type:"tel",placeholder:"+254712345678",value:u.email,onChange:r=>E({...u,email:r.target.value}),required:!0})]}),(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Message (Optional)"}),(0,e.jsx)(Yr,{placeholder:"Add a personal message...",value:u.message,onChange:r=>E({...u,message:r.target.value})})]}),(0,e.jsx)(Zr,{type:"submit",disabled:W,children:W?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{style:{width:"16px",height:"16px",border:"2px solid transparent",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 1s linear infinite",marginRight:"0.5rem"}}),"Sharing..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(re,{size:16,style:{marginRight:"0.5rem"}}),"Share Document"]})})]})})]})}),P&&(0,e.jsx)(te,{onClick:()=>o(null),children:(0,e.jsxs)(oe,{onClick:r=>r.stopPropagation(),children:[(0,e.jsxs)(ne,{children:[(0,e.jsxs)(ie,{children:[(0,e.jsx)(Se,{size:18,style:{marginRight:"0.4rem"}}),"Document Tracking Code"]}),(0,e.jsx)(ae,{onClick:()=>o(null),children:(0,e.jsx)(J,{size:18})})]}),(0,e.jsxs)(se,{children:[(0,e.jsxs)("p",{style:{color:"#475569",fontSize:"0.85rem",marginBottom:"1rem"},children:["Tracking code for: ",(0,e.jsx)("strong",{children:P.originalName})]}),(0,e.jsx)(et,{code:Qr(P),documentName:P.originalName})]})]})}),q&&(0,e.jsx)(te,{onClick:ye,children:(0,e.jsxs)(oe,{onClick:r=>r.stopPropagation(),children:[(0,e.jsxs)(ne,{children:[(0,e.jsxs)(ie,{children:[(0,e.jsx)(he,{size:18,style:{marginRight:"0.4rem"}}),"Upload Document"]}),(0,e.jsx)(ae,{onClick:ye,children:(0,e.jsx)(J,{size:18})})]}),(0,e.jsxs)(se,{children:[(0,e.jsxs)($,{children:[(0,e.jsx)(V,{children:"Category"}),(0,e.jsx)(Fe,{value:G,onChange:r=>H(r.target.value),children:Object.keys(xe).map(r=>(0,e.jsx)("option",{value:r,children:r},r))})]}),(0,e.jsxs)(Xr,{onDrop:Ae,onDragOver:r=>r.preventDefault(),onClick:()=>document.getElementById("fileInput").click(),className:y?"dragover":"",children:[(0,e.jsx)("input",{id:"fileInput",type:"file",accept:".pdf,.doc,.docx,.jpg,.jpeg,.png",onChange:r=>M(r.target.files[0]),style:{display:"none"}}),(0,e.jsx)(he,{size:40,color:"#3b82f6",style:{marginBottom:"0.5rem"}}),(0,e.jsx)("p",{style:{margin:0,color:"#64748b",fontSize:"0.875rem"},children:y?y.name:"Drag & drop file here or click to browse"}),(0,e.jsx)("p",{style:{margin:"0.5rem 0 0 0",color:"#94a3b8",fontSize:"0.75rem"},children:"Supported: PDF, Word, Images (max 50MB)"})]}),(0,e.jsx)(Jr,{onClick:Ie,disabled:!y||_,children:_?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{style:{width:"16px",height:"16px",border:"2px solid transparent",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 1s linear infinite"}}),"Uploading..."]}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(he,{size:16}),"Upload Document"]})})]})]})})]})};export{dt as default};
