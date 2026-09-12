import{r as Ee}from"./chunk-CXHxssQy.js";import{y as Ae}from"./chunk-CXAmgOhv.js";import{c as Be,l as Oe,u as Ne}from"./chunk-DWc5g_hH.js";import{_ as a,m as ve}from"./chunk-DJYPtS2Y.js";import{i as We,o as Me}from"./chunk-CwzAxjA3.js";import{o as Pe}from"./chunk-BY9AVXEY.js";import{t as je}from"./chunk-eZ3__Fgx.js";import{c as Ue,n as q}from"./chunk-C935kdjU.js";import{t as K}from"./chunk-BUeZRQuQ.js";import{Ft as V,I as h,Jn as Ge,Un as Ye,d as J,v as He}from"./index-CivMjfxx.js";import{t as ee}from"./chunk-CizeQYCt.js";import{n as qe}from"./chunk-CjRJa_dR2.js";import{n as Ke,r as Ve,t as Je}from"./chunk-CAiaA8Rq.js";var l=Ee(Ae(),1),e=Pe(),n={ink:"#1A1A1A",bone:"#FAF8F4",bone2:"#FFFFFF",brass:"#6B4045",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",line:"#E2DDD3",gray:"#6B6862",muted:"#999999",red:"#9B4A3F",white:"#FFFFFF",inkBlue:"#0f33e7",gold:"#C9A227",goldDark:"#A8851C",tickBlue:"#2564eb1b",green:"#22c55e"},Ze=ve`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,Xe=ve`
  0%, 20%   { transform: translateY(0); }
  25%, 45%  { transform: translateY(-32px); }
  50%, 70%  { transform: translateY(-64px); }
  75%, 95%  { transform: translateY(-96px); }
  100%      { transform: translateY(0); }
`,re=a.div`
  min-height: 100vh;
  background: ${n.white};
  font-family: 'Saira', sans-serif;
  color: ${n.ink};
  font-size: 15px;
  line-height: 1.5;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  .Toastify__toast-container { width: 380px !important; max-width: 100% !important; padding: 0 !important; }
  .Toastify__toast { border-radius: 8px !important; font-family: 'Saira', sans-serif !important; font-size: 0.85rem !important; padding: 10px 14px !important; min-height: 44px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; margin-bottom: 0.5rem !important; }
  .Toastify__toast-body { padding: 0 !important; margin: 0 !important; font-size: 0.85rem !important; }
`,Qe=a.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: ${n.white};
  border-radius: 0;
  box-shadow: none;
  border: none;
  overflow: hidden;
  position: relative;
`,er=a.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-35deg);
  font-size: 8rem;
  font-weight: 800;
  color: rgba(21, 23, 26, 0.015);
  font-family: 'Fraunces', serif;
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`,rr=a.div`
  position: relative;
  z-index: 1;
`,tr=a.header`
  padding: 2.5rem 3rem;
  position: relative;
  z-index: 1;
  background: transparent;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`,nr=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2.5rem;
  }
`,ar=a.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1.2;
  min-width: 0;
`,ir=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`,sr=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${n.muted};
`,or=a.div`
  height: 32px;
  overflow: hidden;
  position: relative;
`,lr=a.div`
  animation: ${Xe} 16s infinite cubic-bezier(0.65, 0.05, 0.36, 1);
`,Z=a.div`
  height: 32px;
  display: flex;
  align-items: center;
  font-family: 'Saira', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${n.ink};
  line-height: 1.2;
  letter-spacing: -0.01em;
  white-space: nowrap;
`,dr=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${n.brass};
  margin-top: 0.2rem;
`,cr=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,mr=a.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${n.brass};
  margin-bottom: 0.25rem;
  display: block;
`,te=a.div`
  font-size: 0.85rem;
  color: ${n.gray};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  svg {
    width: 15px;
    height: 15px;
    color: ${n.brass};
    flex-shrink: 0;
    stroke-width: 1.5;
  }
`,hr=a.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  text-align: right;
  gap: 2rem;
  flex: 1;

  @media (max-width: 768px) {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
`,pr=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`,xr=a.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${n.muted};
`,ur=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${n.ink};
  letter-spacing: 0.02em;
`,fr=a.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`,gr=a.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${n.inkBlue};
  letter-spacing: 0.02em;
`,br=a.div`
  font-family: 'Fraunces', serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${n.ink};
  line-height: 1.2;
  max-width: 200px;
  margin-top: 0.2rem;
`,jr=a.div`
  padding: 3rem 3rem 1.5rem 3rem;

  @media (max-width: 1024px) {
    padding: 2.5rem;
  }
  @media (max-width: 600px) {
    padding: 1.5rem;
  }
`,W=a.div`
  margin-bottom: 4rem;

  &:last-child {
    margin-bottom: 0;
  }
`,M=a.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.75rem 1.25rem;
  background: ${n.ink}; 
  border-radius: 4px;
`,P=a.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(250,248,244,0.4);
  font-family: 'JetBrains Mono', monospace;
`,U=a.h2`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${n.bone};
  margin: 0;
`,S=a.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 1024px) {
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
  }
`,f=a.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: 1 1 45%;
    min-width: 200px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`,X=a(f)` flex: 2; @media (max-width: 1024px) { flex: 1 1 100%; } `,m=a.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${n.brass};
  margin-bottom: 0.5rem;
  font-family: 'Saira', sans-serif;
`,p=a.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`,j=a.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: ${n.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border: none;
    border-bottom: 1px solid ${n.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${n.ink};
  }

  &:disabled {
    background: transparent;
    color: ${n.gray};
    cursor: not-allowed;
    opacity: 0.8;
  }

  &::placeholder { color: #a8a29e; font-weight: 400; }
`,G=a(j)`
  height: 3rem;
  font-size: 1.05rem;
  font-weight: 500;
`,ne=a.select`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-bottom: 1px solid #ccc;
  border-radius: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 0 2rem 0 0;
  font-family: 'Saira', sans-serif;
  font-size: 0.95rem;
  color: ${n.ink};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;

  &:focus {
    border: none;
    border-bottom: 1px solid ${n.ink};
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  &:hover {
    border-bottom: 1px solid ${n.ink};
  }
`,x=a.div`
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${n.tickBlue};
  pointer-events: none;
`,_r=a.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${n.green};

  svg {
    animation: ${Ze} 0.8s linear infinite;
  }
`,_e=a.span`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${n.green};
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
`,_=a.span`
  color: ${n.red};
  font-size: 0.75rem;
  margin-top: 0.3rem;
  display: block;
  font-family: 'Saira', sans-serif;
`,yr=a.div`
  border-bottom: 2px solid ${n.ink};
  border-radius: 4px 4px 0 0;
  height: 14rem; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${n.bone};
  cursor: crosshair;
  position: relative;
  margin-bottom: 0.5rem;
  overflow: hidden;
  width: 100%;
  box-shadow: inset 0 1px 2px rgba(21, 23, 26, 0.03);

  & > canvas {
    width: 100% !important;
    height: 100% !important;
    touch-action: none;
  }

  @media (max-width: 1024px) {
    height: 14rem; 
  }
  @media (max-width: 768px) {
    height: 18rem; 
  }
`,vr=a.div`
  position: absolute;
  bottom: 10px;
  left: 15px;
  font-family: 'Alex Brush', cursive;
  font-size: 1.2rem;
  color: ${n.gray};
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`,wr=a.div`
  position: relative;
  margin-top: 2.5rem;
`,Sr=a.div`
  display: grid;
  grid-template-columns: 2.5fr 1.5fr;
  gap: 3rem;
  align-items: end;
  grid-template-areas: "sig right";

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "sig"
      "right";
    gap: 2.5rem;
  }
`,kr=a.div` grid-area: sig; min-width: 0; `,Cr=a.div`
  grid-area: right;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative; 
  padding-bottom: 1.5rem;
`,Dr=a.div` min-width: 0; position: relative; z-index: 1; `,zr=a.div`
  position: absolute;
  bottom: 25px;
  right: -15px;
  width: 240px;
  pointer-events: none;
  transform: rotate(-12deg);
  opacity: 0.92;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  z-index: 10;

  @media (max-width: 1024px) {
    position: relative;
    bottom: auto;
    right: auto;
    margin: 1rem auto 0;
    transform: rotate(-6deg) scale(0.9);
  }
`,Ir=a.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid ${n.line};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
`,Lr=a.button`
  background: ${n.verdigris};
  color: ${n.bone};
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  &:hover {
    background: ${n.verdigrisDark};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.2);
  }

  &:disabled {
    background: ${n.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`,$r=a.button`
  background: linear-gradient(135deg, ${n.gold} 0%, ${n.goldDark} 100%);
  color: ${n.ink};
  border: 1px solid ${n.goldDark};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(201, 162, 39, 0.25);

  &:hover {
    background: linear-gradient(135deg, ${n.goldDark} 0%, ${n.gold} 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201, 162, 39, 0.4);
    color: ${n.white};
  }

  &:disabled {
    background: ${n.gray};
    color: ${n.bone};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`,Fr=a.button`
  background: ${n.ink};
  color: ${n.bone};
  border: 1px solid ${n.ink};
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Saira', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(21, 23, 26, 0.2);

  &:hover {
    background: #2a2d31;
    border-color: #2a2d31;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(21, 23, 26, 0.35);
  }

  &:disabled {
    background: ${n.gray};
    border-color: ${n.gray};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`,Tr=a.button`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${n.gray};
  background: none;
  border: none;
  padding: 0.25rem 0;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Saira', sans-serif;

  &:hover {
    color: ${n.red};
  }
`,Rr=a.footer`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Karla:wght@400;500;700&display=swap');

  position: relative;
  width: 100%;
  overflow: hidden;
  background: #2F3A32;
  color: #E9EBDD;
  text-align: center;
  padding: 56px 20px 0;
  border-top: none;
  box-sizing: border-box;

  /* soft ring watermark */
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -260px;
    transform: translateX(-50%);
    width: 520px;
    height: 520px;
    border-radius: 50%;
    border: 1.5px solid rgba(233, 235, 221, 0.1);
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
    border: 1px solid rgba(233, 235, 221, 0.06);
    pointer-events: none;
  }

  @media (max-width: 560px) {
    padding: 44px 20px 0;
  }
`,Er=a.div`
  width: 44px;
  height: 44px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(237, 233, 219, 0.12);
  border: 1px solid rgba(237, 233, 219, 0.25);
  display: grid;
  place-items: center;
`,Ar=a.p`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.5;
  color: rgba(237, 233, 219, 0.82);
  max-width: 44ch;
  margin: 0 auto;
`,Br=a.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 30px auto 0;
  max-width: 420px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(237, 233, 219, 0.16);
  }
`,ae=a.span`
  font-family: 'Karla', 'Segoe UI', sans-serif;
  font-weight: 700;
  font-size: 0.64rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(205, 209, 191, 0.55);
`,ye=a.b`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 1rem;
  color: rgba(205, 209, 191, 0.85);
`,Or=a.div`
  margin-top: 44px;
  border-top: 1px solid rgba(237, 233, 219, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 18px 32px;
  font-family: 'Karla', 'Segoe UI', sans-serif;
  font-weight: 500;
  font-size: 0.76rem;
  color: rgba(237, 233, 219, 0.42);

  @media (max-width: 560px) {
    flex-direction: column;
    gap: 6px;
    padding: 16px 20px;
    text-align: center;
  }
`,Nr=a.div`
  font-size: 0.65rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${n.gray};
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  line-height: 1.7;
  margin: 2rem 3rem 0;
  padding: 0.9rem 1rem 0.4rem;
  border-top: 1px solid ${n.line};

  @media (max-width: 600px) {
    margin: 1.5rem 1.25rem 0;
  }
`,Wr=()=>(0,e.jsx)("svg",{viewBox:"0 0 32 32",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("path",{d:"M25.497 6.503l.001-.003-.004.005L3.5 15.901l11.112 1.489 1.487 11.11 9.396-21.992.005-.006z"})}),Mr=()=>(0,e.jsx)("svg",{viewBox:"0 0 20 20",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("g",{transform:"translate(-140.000000, -7319.000000)",children:(0,e.jsx)("g",{transform:"translate(56.000000, 160.000000)",children:(0,e.jsx)("path",{d:"M94,7167 L94,7169 L96,7169 C96,7167.895 95.105,7167 94,7167 M94,7163 L94,7165 C96.206,7165 98,7166.794 98,7169 L100,7169 C100,7165.686 97.314,7163 94,7163 M94,7159 L94,7161 C98.411,7161 102,7164.589 102,7169 L104,7169 C104,7163.477 99.523,7159 94,7159 M98.652,7177.234 C98.641,7177.265 98.64,7177.27 98.652,7177.234 M98.117,7174.578 C97.422,7174.204 96.719,7173.778 95.992,7173.481 C94.587,7172.908 94.682,7174.602 93.679,7175.151 C93.027,7175.508 92.107,7174.861 91.538,7174.503 C90.544,7173.877 89.663,7173.053 88.931,7172.1 C88.556,7171.613 87.728,7170.697 87.83,7170.014 C87.992,7168.93 89.274,7168.876 88.907,7167.55 C88.711,7166.84 88.36,7166.141 88.097,7165.457 C87.745,7164.54 87.6,7163.953 86.573,7164.003 C85.831,7164.039 85.339,7164.356 84.883,7164.951 C83.649,7166.558 83.835,7168.725 84.664,7170.488 C85.838,7172.983 87.85,7175.335 89.999,7176.855 C91.461,7177.889 93.387,7178.828 95.157,7178.987 C96.453,7179.104 98.266,7178.403 98.73,7176.996 C98.698,7177.094 98.667,7177.189 98.652,7177.234 C98.663,7177.199 98.687,7177.128 98.73,7176.996 C98.777,7176.854 98.8,7176.783 98.811,7176.751 C98.797,7176.793 98.765,7176.891 98.731,7176.993 C99.139,7175.753 99.189,7175.155 98.117,7174.578 M98.811,7176.751 C98.819,7176.727 98.819,7176.725 98.811,7176.751"})})})}),Pr=()=>(0,e.jsx)("svg",{viewBox:"0 -3.5 32 32",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("g",{transform:"translate(-414.000000, -261.000000)",children:(0,e.jsx)("path",{d:"M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z"})})}),Ur=C=>{if(!C)return"—";const g=String(C),k=new Date(g.length<=10?`${g}T00:00:00`:g);return Number.isNaN(k.getTime())?g:k.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})},Gr=({value:C})=>{const g=(0,l.useRef)(null);return(0,l.useEffect)(()=>{if(g.current)try{const k=C||"AWAITING-ID";We.toCanvas(g.current,{bcid:"code128",text:k,scale:2,height:8,includetext:!1,paddingwidth:0,paddingheight:0})}catch(k){console.error("Barcode generation error:",k)}},[C]),(0,e.jsx)("canvas",{ref:g,style:{display:"block",width:"auto",height:"40px"}})},pt=()=>{const C=Oe(),g=Be(),{id:k,slug:F}=Ne(),{tenantData:ie}=Ge(),T=()=>(F&&F!=="default"&&F!=="dashboard"&&F!=="undefined"&&F!=="null"?F:"")||Ue()||"",R=(0,l.useRef)(null),D=(0,l.useRef)(null),E=(0,l.useRef)(""),[Yr,Hr]=(0,l.useState)(!1),[o,y]=(0,l.useState)({}),[qr,se]=(0,l.useState)(!1),[we,oe]=(0,l.useState)(!1),[le,z]=(0,l.useState)(!1),[B,I]=(0,l.useState)(!1),[Se,A]=(0,l.useState)({type:"",text:""}),[Kr,ke]=(0,l.useState)([]),[de,ce]=(0,l.useState)(!1),[O,me]=(0,l.useState)(!1),[Vr,he]=(0,l.useState)(""),[Ce,pe]=(0,l.useState)(null),{name:Y,displayPhone:xe,displayEmail:De,displayLocation:ze,tenantCountry:Jr,displayBranch:Zr,displayAddress:Ie,tenantLogoUrl:Xr,fallback:Qr}=(0,l.useMemo)(()=>qe(ie),[ie]),H=()=>{try{const r=JSON.parse(localStorage.getItem("user")||"{}");return r.email||r.userEmail||""}catch{return""}},Le=()=>{try{const r=JSON.parse(localStorage.getItem("user")||"{}");return r.full_name||r.name||r.userName||r.email||""}catch{return""}},v=()=>{const r=new Date;return`${String(r.getHours()).padStart(2,"0")}:${String(r.getMinutes()).padStart(2,"0")}`},$e=()=>{const r=new Date().getHours();return r<12?"Good morning":r<18?"Good afternoon":"Good evening"},Q={admission_number:g.state?.permitNumber||"",date_admitted:new Date().toISOString().split("T")[0],time_received:v(),full_name:"",gender:"",age:"",date_of_death:"",cause_of_death:"",place_of_death:"",body_status:"Released",contact_person:"",next_kin:"",relationship:"",id_type:"National ID",id_number:"",tel_number:"",release_date:new Date().toISOString().split("T")[0],release_time:v(),released_by:Le(),permit_number:"",mode_of_transport:"hearse",terms_accepted:!1,everything_paid:!1,signature:"",verified_by:H()},[t,L]=(0,l.useState)(Q);(0,l.useEffect)(()=>{L(r=>({...r,time_received:v(),release_time:v()}))},[]),(0,l.useEffect)(()=>{(async()=>{const s=T();se(!0);try{const i=await je.get(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_LIST}`,{headers:{"x-tenant-slug":s,Authorization:`Bearer ${q()}`}}),u=i.data?.data||i.data||[];if(Array.isArray(u)&&u.length>0){const b=u.filter(w=>w.body_status!=="Released"&&w.body_status!=="Transferred");ke(b)}}catch(i){console.error("Error fetching deceased list:",i)}finally{se(!1)}})()},[]),(0,l.useEffect)(()=>{(async()=>{const s=k||g.state?.deceasedId||g.state?.deceasedData?.deceased_id||g.state?.deceasedData?.id;if(s){oe(!0);try{const i=T(),u=await fetch(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_DETAIL(s)}`,{headers:{"x-tenant-slug":i,Authorization:`Bearer ${q()}`}}),b=await u.json();u.ok&&b.data&&(fe(b.data),L(w=>({...w,release_date:new Date().toISOString().split("T")[0],release_time:v()})))}catch(i){console.error("Error fetching deceased data:",i)}finally{oe(!1)}}})()},[k,g.state]);const ue=()=>{L(r=>({...r,full_name:"",gender:"",age:"",date_of_death:"",cause_of_death:"",place_of_death:"",next_kin:"",contact_person:"",relationship:"",id_number:"",tel_number:"",permit_number:""}))},d=r=>{const{name:s,value:i,type:u,checked:b}=r.target;let w=i;s==="admission_number"&&(w=i.toUpperCase()),L(N=>({...N,[s]:u==="checkbox"?b:w})),s==="admission_number"&&(I(!1),ue()),o[s]&&y(N=>({...N,[s]:""})),Se.text&&A({type:"",text:""})};(0,l.useEffect)(()=>{const r=String(t.admission_number||"").trim().toUpperCase();if(D.current&&clearTimeout(D.current),!r){z(!1),I(!1),E.current="",y(s=>({...s,admission_number:""}));return}if(B&&r===E.current){z(!1);return}return z(!0),I(!1),y(s=>({...s,admission_number:""})),D.current=setTimeout(()=>{String(t.admission_number||"").trim().toUpperCase()===r&&(E.current=r,ge(r))},800),()=>{D.current&&clearTimeout(D.current)}},[t.admission_number,B]);const fe=r=>{y(i=>({...i,admission_number:"",full_name:"",gender:""})),I(!0),z(!1);const s=String(r.admission_number||"").trim().toUpperCase();E.current=s,L(i=>({...i,admission_number:i.admission_number||s,full_name:r.full_name||r.name_of_deceased||"",gender:r.gender||"",age:r.age||"",date_of_death:r.date_of_death||"",cause_of_death:r.cause_of_death||"",place_of_death:r.place_of_death||r.death_location||"",next_kin:r.contact_person||r.next_kin||r.next_of_kin||"",contact_person:r.contact_person||r.next_kin||"",relationship:r.relationship||r.kin_relationship||"",id_number:r.national_id||r.id_number||r.nationalId||"",tel_number:r.tell_no||r.tel_number||r.phone_number||r.contact||"",date_admitted:r.date_admitted||i.date_admitted,permit_number:r.permit_number||r.permit_no||""}))},ge=async r=>{const s=String(r||"").trim().toUpperCase();if(!s){y(i=>({...i,admission_number:"Enter an admission number to search"}));return}if(!(E.current===s&&B)){z(!0),I(!1),y(i=>({...i,admission_number:""})),A({type:"",text:""});try{const i=T(),u=(await je.get(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_BY_ADMISSION(encodeURIComponent(s))}`,{headers:{"x-tenant-slug":i,Authorization:`Bearer ${q()}`}})).data;if(!u.success)throw new Error(u.message||"Failed to fetch");const b=u.data;if(!b)throw new Error("not-found");fe(b)}catch(i){const u=i?.response?.data?.message||i?.message||"Search failed";I(!1),y(b=>({...b,admission_number:u==="No-checkout"||/not found/i.test(String(u))?`No deceased record found for admission number "${s}".`:u})),ue()}finally{z(!1)}}},Fe=()=>{const r={};return t.admission_number||(r.admission_number="Admission number is required"),t.full_name.trim()||(r.full_name="Full name is required"),t.gender||(r.gender="Gender is required"),t.date_admitted||(r.date_admitted="Date admitted is required"),t.release_date||(r.release_date="Release date is required"),t.released_by.trim()||(r.released_by="Released by is required"),t.next_kin.trim()||(r.next_kin="Next of kin is required"),t.id_number.trim()||(r.id_number="ID number is required"),t.tel_number.trim()||(r.tel_number="Telephone number is required"),t.terms_accepted||(r.terms_accepted="You must accept the terms"),t.tel_number&&!/^(\+254|0)[17]\d{8}$/.test(t.tel_number.replace(/\s/g,""))&&(r.tel_number="Please enter a valid Kenyan phone number"),R.current?.isEmpty()&&(r.signature="Signature is required to proceed"),y(r),r},Te=async r=>{r?.preventDefault();const s=Fe();if(Object.keys(s).length>0){const i=Object.values(s);ee.info("Missing required details",`Please complete the following: ${i.join(", ")}`),A({type:"error",text:`Please complete all required fields: ${i.join(", ")}`});return}me(!0),A({type:"",text:""});try{const i=T(),u=q(),b=R.current?.toDataURL(),w=v(),N={...t,admission_number:String(t.admission_number||"").toUpperCase(),time_received:w,release_time:w,age:t.age?parseInt(t.age,10):null,body_status:"Released",verified_by:t.verified_by||H()||null,signature:b,name_of_deceased:t.full_name,tell_number:t.tel_number},be=await fetch(`${K.FULL_API_URL}${J.BODYCHECKOUT.CHECKOUT}`,{method:"POST",headers:{"Content-Type":"application/json","x-tenant-slug":i,Authorization:`Bearer ${u}`},body:JSON.stringify(N)}),$=await be.json();if(!be.ok)throw new Error($.message||"Release failed");ee.success("Release Successful",`${t.full_name||"The record"} has been released successfully.`),$.data&&$.data.release_id&&he($.data.release_id),pe({full_name:t.full_name,date_of_death:t.date_of_death,admission_number:String(t.admission_number||"").toUpperCase(),release_id:$.data?.release_id||"",release_date:t.release_date,signature:$.data?.signature||b||"",staff_signature:$.data?.staff_signature||""}),ce(!0),L({...Q,verified_by:H(),time_received:v(),release_time:v(),date_admitted:new Date().toISOString().split("T")[0],release_date:new Date().toISOString().split("T")[0]}),R.current?.clear(),y({})}catch(i){ee.error("Release failed",i.message||"Please check the details and try again."),A({type:"error",text:i.message||"Something went wrong. Please try again."})}finally{me(!1)}},Re=()=>{L({...Q,verified_by:H(),time_received:v(),release_time:v(),date_admitted:new Date().toISOString().split("T")[0],release_date:new Date().toISOString().split("T")[0]}),y({}),A({type:"",text:""}),he(""),ce(!1),pe(null),I(!1),z(!1),E.current="",R.current?.clear()},c=r=>r!=null&&String(r).trim().length>0;if(we&&!de)return(0,e.jsx)(re,{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)(V,{size:48,color:n.ink,className:"animate-spin"}),(0,e.jsx)("p",{style:{marginTop:"1rem",fontSize:"0.85rem",color:n.gray,fontFamily:"Saira",textTransform:"uppercase",letterSpacing:"0.1em"},children:"Loading Record..."})]})});if(O)return(0,e.jsx)(re,{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)(V,{size:48,color:n.ink,className:"animate-spin"}),(0,e.jsx)("p",{style:{marginTop:"1rem",fontSize:"0.85rem",color:n.gray,fontFamily:"Saira",textTransform:"uppercase",letterSpacing:"0.1em"},children:"Processing Release..."})]})});if(de){const r=Ce||{};return(0,e.jsx)(Je,{mode:"release",name:r.full_name||"The deceased",passed:r.date_of_death,reference:r.release_id||r.admission_number||"",onDone:()=>{const s=typeof T=="function"&&T()||localStorage.getItem("tenantSlug")||"";C(s?`/tenant/${s}/receptionist`:"/reception")}})}return(0,e.jsxs)(re,{children:[(0,e.jsx)(Me,{position:"top-right",autoClose:5e3,hideProgressBar:!1,newestOnTop:!0,closeOnClick:!0,rtl:!1,pauseOnFocusLoss:!0,draggable:!0,pauseOnHover:!0,theme:"light",limit:3}),(0,e.jsxs)(Qe,{children:[(0,e.jsx)(er,{children:"OFFICIAL RECORD"}),(0,e.jsxs)(rr,{children:[(0,e.jsx)(tr,{children:(0,e.jsxs)(nr,{children:[(0,e.jsxs)(ar,{children:[(0,e.jsxs)(ir,{children:[(0,e.jsx)(sr,{children:"Welcome to"}),(0,e.jsx)(or,{children:(0,e.jsxs)(lr,{children:[(0,e.jsx)(Z,{children:Y}),(0,e.jsx)(Z,{children:"Sorry for your loss"}),(0,e.jsx)(Z,{children:"With deepest sympathy"}),(0,e.jsx)(Z,{children:"May they rest in peace"})]})}),(0,e.jsx)(dr,{children:$e()})]}),(0,e.jsxs)(cr,{children:[(0,e.jsx)(mr,{children:"Facility Information"}),(0,e.jsxs)(te,{children:[(0,e.jsx)(Wr,{}),Ie]}),(0,e.jsxs)(te,{children:[(0,e.jsx)(Pr,{}),De]}),(0,e.jsxs)(te,{children:[(0,e.jsx)(Mr,{}),xe]})]})]}),(0,e.jsxs)(hr,{children:[(0,e.jsxs)(pr,{children:[(0,e.jsx)(xr,{children:"Record Date"}),(0,e.jsx)(ur,{children:Ur(t.release_date)})]}),(0,e.jsxs)(fr,{children:[(0,e.jsx)(gr,{children:t.admission_number||"AWAITING-ID"}),(0,e.jsx)(Gr,{value:t.admission_number}),(0,e.jsx)(br,{children:t.full_name||"—"})]})]})]})}),(0,e.jsx)(jr,{children:(0,e.jsxs)("form",{onSubmit:Te,noValidate:!0,children:[(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"01"}),(0,e.jsx)(U,{children:"Release & Facility Information"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Admission Number ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"text",name:"admission_number",value:t.admission_number,onChange:d,onKeyDown:r=>{r.key==="Enter"&&(r.preventDefault(),D.current&&clearTimeout(D.current),ge(t.admission_number))},placeholder:"Start typing to search the database...",autoComplete:"off",autoCorrect:"off",autoCapitalize:"off",spellCheck:"false",style:{textTransform:"uppercase"}}),le?(0,e.jsxs)(_e,{children:[(0,e.jsx)(_r,{children:(0,e.jsx)(V,{size:14})}),"Searching..."]}):c(t.admission_number)&&B?(0,e.jsxs)(x,{style:{color:n.green},children:[(0,e.jsx)(h,{size:16,strokeWidth:2.5}),(0,e.jsx)("span",{style:{fontSize:"0.65rem",color:n.green,fontWeight:700,marginLeft:"0.3rem"},children:"Found"})]}):!le&&c(t.admission_number)&&!B&&o.admission_number?(0,e.jsxs)(_e,{style:{color:n.red},children:[(0,e.jsx)(Ye,{size:14})," Not Found"]}):null]}),o.admission_number&&(0,e.jsx)(_,{children:o.admission_number})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Date Admitted ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"date",name:"date_admitted",value:t.date_admitted,onChange:d}),c(t.date_admitted)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.date_admitted&&(0,e.jsx)(_,{children:o.date_admitted})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Permit Number"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"permit_number",value:t.permit_number,onChange:d,placeholder:"Permit/Reference Number"}),c(t.permit_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Released By ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"released_by",value:t.released_by,onChange:d,placeholder:"Name of person releasing the body"}),c(t.released_by)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.released_by&&(0,e.jsx)(_,{children:o.released_by})]})]})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"02"}),(0,e.jsx)(U,{children:"Deceased Information"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Full Legal Name of Deceased ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"text",name:"full_name",value:t.full_name,onChange:d,placeholder:"Enter full legal name"}),c(t.full_name)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.full_name&&(0,e.jsx)(_,{children:o.full_name})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Gender ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"gender",value:t.gender,onChange:d,children:[(0,e.jsx)("option",{value:"",children:"Select Gender"}),(0,e.jsx)("option",{value:"Male",children:"Male"}),(0,e.jsx)("option",{value:"Female",children:"Female"})]}),c(t.gender)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.gender&&(0,e.jsx)(_,{children:o.gender})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Age"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"number",name:"age",value:t.age,onChange:d,placeholder:"Years"}),c(t.age)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Date of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"date",name:"date_of_death",value:t.date_of_death,onChange:d}),c(t.date_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Cause of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"cause_of_death",value:t.cause_of_death,onChange:d,placeholder:"As certified on medical document"}),c(t.cause_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Place of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"place_of_death",value:t.place_of_death,onChange:d,placeholder:"Location/Hospital"}),c(t.place_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Body Status"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"body_status",value:t.body_status||"Released",readOnly:!0,disabled:!0}),c(t.body_status)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"03"}),(0,e.jsx)(U,{children:"Next of Kin / Authorizing Party"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Next of Kin Full Name ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"next_kin",value:t.next_kin,onChange:d,placeholder:"Full name of authorizing party"}),c(t.next_kin)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.next_kin&&(0,e.jsx)(_,{children:o.next_kin})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Relationship"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"relationship",value:t.relationship,onChange:d,placeholder:"e.g. Spouse, Child, Sibling"}),c(t.relationship)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"ID Type"}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"id_type",value:t.id_type,onChange:d,children:[(0,e.jsx)("option",{value:"",children:"Select Identification"}),(0,e.jsx)("option",{value:"National ID",children:"National ID"}),(0,e.jsx)("option",{value:"Passport",children:"Passport"}),(0,e.jsx)("option",{value:"Alien Card",children:"Alien Card"})]}),c(t.id_type)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["ID / Passport Number ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"id_number",value:t.id_number,onChange:d,placeholder:"Identification number"}),c(t.id_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.id_number&&(0,e.jsx)(_,{children:o.id_number})]})]}),(0,e.jsx)(S,{children:(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Primary Telephone ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"tel",name:"tel_number",value:t.tel_number,onChange:d,placeholder:"e.g., 0712345678"}),c(t.tel_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.tel_number&&(0,e.jsx)(_,{children:o.tel_number})]})})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"04"}),(0,e.jsx)(U,{children:"Removal, Transportation & Release Details"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Release Date ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"date",name:"release_date",value:t.release_date,onChange:d}),c(t.release_date)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.release_date&&(0,e.jsx)(_,{children:o.release_date})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Release Time"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"time",name:"release_time",value:t.release_time,onChange:d}),c(t.release_time)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Mode of Transport"}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"mode_of_transport",value:t.mode_of_transport,onChange:d,children:[(0,e.jsx)("option",{value:"hearse",children:"Hearse / Van"}),(0,e.jsx)("option",{value:"air",children:"Air Transport"}),(0,e.jsx)("option",{value:"rail",children:"Rail"}),(0,e.jsx)("option",{value:"private",children:"Private Vehicle"}),(0,e.jsx)("option",{value:"courier",children:"Courier Service"}),(0,e.jsx)("option",{value:"other",children:"Other"})]}),c(t.mode_of_transport)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsx)(S,{children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"1rem",width:"100%"},children:[(0,e.jsxs)("label",{style:{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"},children:[(0,e.jsx)("input",{type:"checkbox",name:"terms_accepted",checked:t.terms_accepted,onChange:d,style:{marginTop:"0.2rem",width:"1rem",height:"1rem",accentColor:n.verdigris}}),(0,e.jsx)("span",{style:{fontSize:"0.8rem",color:n.gray,lineHeight:"1.5"},children:"I hereby authorize the release and transportation of the deceased. I certify that I am the legally authorized next of kin or representative and have the right to make this authorization."})]}),o.terms_accepted&&(0,e.jsx)(_,{children:o.terms_accepted}),(0,e.jsxs)("label",{style:{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"},children:[(0,e.jsx)("input",{type:"checkbox",name:"everything_paid",checked:t.everything_paid,onChange:d,style:{marginTop:"0.2rem",width:"1rem",height:"1rem",accentColor:n.verdigris}}),(0,e.jsx)("span",{style:{fontSize:"0.8rem",color:n.gray,lineHeight:"1.5"},children:"I confirm that all outstanding charges and payments have been settled."})]})]})})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"05"}),(0,e.jsx)(U,{children:"Verification & Digital Sign-off"})]}),(0,e.jsx)(wr,{children:(0,e.jsxs)(Sr,{children:[(0,e.jsxs)(kr,{children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,e.jsxs)(m,{children:["Authorizing Signature ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsx)(Tr,{type:"button",onClick:()=>R.current?.clear(),children:"Clear Pad"})]}),(0,e.jsxs)(yr,{children:[(0,e.jsx)(Ve,{ref:R,penColor:n.inkBlue}),(0,e.jsx)(vr,{children:"Sign within boundaries"})]}),o.signature&&(0,e.jsx)(_,{children:o.signature})]}),(0,e.jsxs)(Cr,{children:[(0,e.jsxs)(Dr,{children:[(0,e.jsx)(m,{children:"Released By Officer"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"released_by",value:t.released_by,onChange:d,placeholder:"Officer full name"}),c(t.released_by)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsx)(zr,{children:(0,e.jsx)(Ke,{tenantName:Y,tenantPhone:xe,tenantLocation:ze,recordLabel:"OFFICIAL RELEASE RECORD"})})]})]})})]}),(0,e.jsxs)(Ir,{children:[(0,e.jsx)($r,{type:"button",onClick:Re,disabled:O,children:"Reset Inputs"}),(0,e.jsx)(Fr,{type:"button",onClick:()=>C(-1),disabled:O,children:"Cancel / Back"}),(0,e.jsx)(Lr,{type:"submit",disabled:O,children:O?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(V,{size:16,className:"animate-spin"})," Submitting Release..."]}):(0,e.jsxs)(e.Fragment,{children:["Submit Release ",(0,e.jsx)(He,{size:16})]})})]})]})}),(0,e.jsxs)(Nr,{children:[Y," — Generated ",new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})," at ",new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}),(0,e.jsx)("br",{}),"- Official Release Record -"]}),(0,e.jsxs)(Rr,{children:[(0,e.jsx)(Er,{children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"#EDE9DB",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",width:"21",height:"21",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)(Ar,{children:"Received with dignity. Cared for with respect. Remembered with love."}),(0,e.jsxs)(Br,{children:[(0,e.jsx)(ae,{children:"Dignity"}),(0,e.jsx)(ye,{children:"·"}),(0,e.jsx)(ae,{children:"Care"}),(0,e.jsx)(ye,{children:"·"}),(0,e.jsx)(ae,{children:"Respect"})]}),(0,e.jsxs)(Or,{children:[(0,e.jsxs)("span",{children:["© ",new Date().getFullYear()," ",Y]}),(0,e.jsx)("span",{children:"Official Release Record"})]})]})]})]})]})};export{pt as default};
