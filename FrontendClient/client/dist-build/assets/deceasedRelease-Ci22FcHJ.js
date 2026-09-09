import{r as Re}from"./chunk-CXHxssQy.js";import{y as Ee}from"./chunk-CXAmgOhv.js";import{c as Ae,l as Be,u as Oe}from"./chunk-DWc5g_hH.js";import{_ as a,m as ye}from"./chunk-DJYPtS2Y.js";import{i as Ne,o as We}from"./chunk-CwzAxjA3.js";import{o as Me}from"./chunk-BY9AVXEY.js";import{t as be}from"./chunk-eZ3__Fgx.js";import{n as q}from"./chunk-C935kdjU.js";import{t as K}from"./chunk-BUeZRQuQ.js";import{I as h,Nt as V,Vn as Pe,f as J,y as Ue}from"./index-D6gguvjv.js";import{t as ee}from"./chunk-CizeQYCt.js";import{n as Ge}from"./chunk-BKSTJCFj.js";import{n as He,r as Ye,t as qe}from"./chunk-CAiaA8Rq.js";var l=Re(Ee(),1),e=Me(),n={ink:"#1A1A1A",bone:"#FAF8F4",bone2:"#FFFFFF",brass:"#6B4045",brassLight:"#A98F6E",verdigris:"#3D4F47",verdigrisDark:"#2E3F37",line:"#E2DDD3",gray:"#6B6862",muted:"#999999",red:"#9B4A3F",white:"#FFFFFF",inkBlue:"#0f33e7",gold:"#C9A227",goldDark:"#A8851C",tickBlue:"#2564eb1b",green:"#22c55e"},Ke=ye`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,Ve=ye`
  0%, 20%   { transform: translateY(0); }
  25%, 45%  { transform: translateY(-32px); }
  50%, 70%  { transform: translateY(-64px); }
  75%, 95%  { transform: translateY(-96px); }
  100%      { transform: translateY(0); }
`,te=a.div`
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
`,Je=a.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: ${n.white};
  border-radius: 0;
  box-shadow: none;
  border: none;
  overflow: hidden;
  position: relative;
`,Ze=a.div`
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
`,Xe=a.div`
  position: relative;
  z-index: 1;
`,Qe=a.header`
  padding: 2.5rem 3rem;
  position: relative;
  z-index: 1;
  background: transparent;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`,et=a.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 2.5rem;
  }
`,tt=a.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1.2;
  min-width: 0;
`,rt=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`,nt=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${n.muted};
`,at=a.div`
  height: 32px;
  overflow: hidden;
  position: relative;
`,it=a.div`
  animation: ${Ve} 16s infinite cubic-bezier(0.65, 0.05, 0.36, 1);
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
`,st=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${n.brass};
  margin-top: 0.2rem;
`,ot=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,lt=a.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${n.brass};
  margin-bottom: 0.25rem;
  display: block;
`,re=a.div`
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
`,dt=a.div`
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
`,ct=a.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`,mt=a.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${n.muted};
`,ht=a.span`
  font-family: 'Saira', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${n.ink};
  letter-spacing: 0.02em;
`,pt=a.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`,xt=a.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${n.inkBlue};
  letter-spacing: 0.02em;
`,ut=a.div`
  font-family: 'Fraunces', serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${n.ink};
  line-height: 1.2;
  max-width: 200px;
  margin-top: 0.2rem;
`,ft=a.div`
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
`,gt=a.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${n.green};

  svg {
    animation: ${Ke} 0.8s linear infinite;
  }
`,je=a.span`
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
`,bt=a.div`
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
`,jt=a.div`
  position: absolute;
  bottom: 10px;
  left: 15px;
  font-family: 'Alex Brush', cursive;
  font-size: 1.2rem;
  color: ${n.gray};
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
`,_t=a.div`
  position: relative;
  margin-top: 2.5rem;
`,yt=a.div`
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
`,vt=a.div` grid-area: sig; min-width: 0; `,wt=a.div`
  grid-area: right;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative; 
  padding-bottom: 1.5rem;
`,St=a.div` min-width: 0; position: relative; z-index: 1; `,kt=a.div`
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
`,Ct=a.div`
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
`,Dt=a.button`
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
`,zt=a.button`
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
`,It=a.button`
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
`,Lt=a.button`
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
`,$t=a.footer`
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
`,Ft=a.div`
  width: 44px;
  height: 44px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: rgba(237, 233, 219, 0.12);
  border: 1px solid rgba(237, 233, 219, 0.25);
  display: grid;
  place-items: center;
`,Tt=a.p`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.5;
  color: rgba(237, 233, 219, 0.82);
  max-width: 44ch;
  margin: 0 auto;
`,Rt=a.div`
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
`,_e=a.b`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  font-size: 1rem;
  color: rgba(205, 209, 191, 0.85);
`,Et=a.div`
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
`,At=a.div`
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
`,Bt=()=>(0,e.jsx)("svg",{viewBox:"0 0 32 32",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("path",{d:"M25.497 6.503l.001-.003-.004.005L3.5 15.901l11.112 1.489 1.487 11.11 9.396-21.992.005-.006z"})}),Ot=()=>(0,e.jsx)("svg",{viewBox:"0 0 20 20",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("g",{transform:"translate(-140.000000, -7319.000000)",children:(0,e.jsx)("g",{transform:"translate(56.000000, 160.000000)",children:(0,e.jsx)("path",{d:"M94,7167 L94,7169 L96,7169 C96,7167.895 95.105,7167 94,7167 M94,7163 L94,7165 C96.206,7165 98,7166.794 98,7169 L100,7169 C100,7165.686 97.314,7163 94,7163 M94,7159 L94,7161 C98.411,7161 102,7164.589 102,7169 L104,7169 C104,7163.477 99.523,7159 94,7159 M98.652,7177.234 C98.641,7177.265 98.64,7177.27 98.652,7177.234 M98.117,7174.578 C97.422,7174.204 96.719,7173.778 95.992,7173.481 C94.587,7172.908 94.682,7174.602 93.679,7175.151 C93.027,7175.508 92.107,7174.861 91.538,7174.503 C90.544,7173.877 89.663,7173.053 88.931,7172.1 C88.556,7171.613 87.728,7170.697 87.83,7170.014 C87.992,7168.93 89.274,7168.876 88.907,7167.55 C88.711,7166.84 88.36,7166.141 88.097,7165.457 C87.745,7164.54 87.6,7163.953 86.573,7164.003 C85.831,7164.039 85.339,7164.356 84.883,7164.951 C83.649,7166.558 83.835,7168.725 84.664,7170.488 C85.838,7172.983 87.85,7175.335 89.999,7176.855 C91.461,7177.889 93.387,7178.828 95.157,7178.987 C96.453,7179.104 98.266,7178.403 98.73,7176.996 C98.698,7177.094 98.667,7177.189 98.652,7177.234 C98.663,7177.199 98.687,7177.128 98.73,7176.996 C98.777,7176.854 98.8,7176.783 98.811,7176.751 C98.797,7176.793 98.765,7176.891 98.731,7176.993 C99.139,7175.753 99.189,7175.155 98.117,7174.578 M98.811,7176.751 C98.819,7176.727 98.819,7176.725 98.811,7176.751"})})})}),Nt=()=>(0,e.jsx)("svg",{viewBox:"0 -3.5 32 32",fill:"currentColor",xmlns:"http://www.w3.org/2000/svg",children:(0,e.jsx)("g",{transform:"translate(-414.000000, -261.000000)",children:(0,e.jsx)("path",{d:"M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z"})})}),Wt=C=>{if(!C)return"—";const g=String(C),k=new Date(g.length<=10?`${g}T00:00:00`:g);return Number.isNaN(k.getTime())?g:k.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})},Mt=({value:C})=>{const g=(0,l.useRef)(null);return(0,l.useEffect)(()=>{if(g.current)try{const k=C||"AWAITING-ID";Ne.toCanvas(g.current,{bcid:"code128",text:k,scale:2,height:8,includetext:!1,paddingwidth:0,paddingheight:0})}catch(k){console.error("Barcode generation error:",k)}},[C]),(0,e.jsx)("canvas",{ref:g,style:{display:"block",width:"auto",height:"40px"}})},dr=()=>{const C=Be(),g=Ae(),{id:k}=Oe(),F=()=>localStorage.getItem("tenantSlug")||localStorage.getItem("tenant_slug")||(()=>{try{const t=JSON.parse(localStorage.getItem("user")||"{}");return t.tenantSlug||t.tenant?.slug||"default"}catch{return"default"}})(),T=(0,l.useRef)(null),D=(0,l.useRef)(null),R=(0,l.useRef)(""),[Pt,Ut]=(0,l.useState)(!1),[o,y]=(0,l.useState)({}),[Gt,ie]=(0,l.useState)(!1),[ve,se]=(0,l.useState)(!1),[oe,z]=(0,l.useState)(!1),[B,I]=(0,l.useState)(!1),[we,E]=(0,l.useState)({type:"",text:""}),[Ht,Se]=(0,l.useState)([]),[le,de]=(0,l.useState)(!1),[O,ce]=(0,l.useState)(!1),[Yt,me]=(0,l.useState)(""),[ke,he]=(0,l.useState)(null),{name:H,displayPhone:pe,displayEmail:Ce,displayLocation:De,tenantCountry:qt,displayBranch:Kt,displayAddress:ze,tenantLogoUrl:Vt,fallback:A}=(0,l.useMemo)(()=>Ge(),[]),Y=()=>{try{const t=JSON.parse(localStorage.getItem("user")||"{}");return t.email||t.userEmail||""}catch{return""}},Ie=()=>{try{const t=JSON.parse(localStorage.getItem("user")||"{}");return t.full_name||t.name||t.userName||t.email||""}catch{return""}},v=()=>{const t=new Date;return`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`},Le=()=>{const t=new Date().getHours();return t<12?"Good morning":t<18?"Good afternoon":"Good evening"},Q={admission_number:g.state?.permitNumber||"",date_admitted:new Date().toISOString().split("T")[0],time_received:v(),full_name:"",gender:"",age:"",date_of_death:"",cause_of_death:"",place_of_death:"",body_status:"Released",contact_person:"",next_kin:"",relationship:"",id_type:"National ID",id_number:"",tel_number:"",release_date:new Date().toISOString().split("T")[0],release_time:v(),released_by:Ie(),permit_number:"",mode_of_transport:"hearse",terms_accepted:!1,everything_paid:!1,signature:"",verified_by:Y()},[r,L]=(0,l.useState)(Q);(0,l.useEffect)(()=>{L(t=>({...t,time_received:v(),release_time:v()}))},[]),(0,l.useEffect)(()=>{(async()=>{const s=F();ie(!0);try{const i=await be.get(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_LIST}`,{headers:{"x-tenant-slug":s,Authorization:`Bearer ${q()}`}}),u=i.data?.data||i.data||[];if(Array.isArray(u)&&u.length>0){const b=u.filter(w=>w.body_status!=="Released"&&w.body_status!=="Transferred");Se(b)}}catch(i){console.error("Error fetching deceased list:",i)}finally{ie(!1)}})()},[]),(0,l.useEffect)(()=>{(async()=>{const s=k||g.state?.deceasedId||g.state?.deceasedData?.deceased_id||g.state?.deceasedData?.id;if(s){se(!0);try{const i=F(),u=await fetch(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_DETAIL(s)}`,{headers:{"x-tenant-slug":i,Authorization:`Bearer ${q()}`}}),b=await u.json();u.ok&&b.data&&(ue(b.data),L(w=>({...w,release_date:new Date().toISOString().split("T")[0],release_time:v()})))}catch(i){console.error("Error fetching deceased data:",i)}finally{se(!1)}}})()},[k,g.state]);const xe=()=>{L(t=>({...t,full_name:"",gender:"",age:"",date_of_death:"",cause_of_death:"",place_of_death:"",next_kin:"",contact_person:"",relationship:"",id_number:"",tel_number:"",permit_number:""}))},d=t=>{const{name:s,value:i,type:u,checked:b}=t.target;let w=i;s==="admission_number"&&(w=i.toUpperCase()),L(N=>({...N,[s]:u==="checkbox"?b:w})),s==="admission_number"&&(I(!1),xe()),o[s]&&y(N=>({...N,[s]:""})),we.text&&E({type:"",text:""})};(0,l.useEffect)(()=>{const t=String(r.admission_number||"").trim().toUpperCase();if(D.current&&clearTimeout(D.current),!t){z(!1),I(!1),R.current="",y(s=>({...s,admission_number:""}));return}if(B&&t===R.current){z(!1);return}return z(!0),I(!1),y(s=>({...s,admission_number:""})),D.current=setTimeout(()=>{String(r.admission_number||"").trim().toUpperCase()===t&&(R.current=t,fe(t))},800),()=>{D.current&&clearTimeout(D.current)}},[r.admission_number,B]);const ue=t=>{y(i=>({...i,admission_number:"",full_name:"",gender:""})),I(!0),z(!1);const s=String(t.admission_number||"").trim().toUpperCase();R.current=s,L(i=>({...i,admission_number:i.admission_number||s,full_name:t.full_name||t.name_of_deceased||"",gender:t.gender||"",age:t.age||"",date_of_death:t.date_of_death||"",cause_of_death:t.cause_of_death||"",place_of_death:t.place_of_death||t.death_location||"",next_kin:t.contact_person||t.next_kin||t.next_of_kin||"",contact_person:t.contact_person||t.next_kin||"",relationship:t.relationship||t.kin_relationship||"",id_number:t.national_id||t.id_number||t.nationalId||"",tel_number:t.tell_no||t.tel_number||t.phone_number||t.contact||"",date_admitted:t.date_admitted||i.date_admitted,permit_number:t.permit_number||t.permit_no||""}))},fe=async t=>{const s=String(t||"").trim().toUpperCase();if(!s){y(i=>({...i,admission_number:"Enter an admission number to search"}));return}if(!(R.current===s&&B)){z(!0),I(!1),y(i=>({...i,admission_number:""})),E({type:"",text:""});try{const i=F(),u=(await be.get(`${K.FULL_API_URL}${J.BODYCHECKOUT.DECEASED_BY_ADMISSION(encodeURIComponent(s))}`,{headers:{"x-tenant-slug":i,Authorization:`Bearer ${q()}`}})).data;if(!u.success)throw new Error(u.message||"Failed to fetch");const b=u.data;if(!b)throw new Error("not-found");ue(b)}catch(i){const u=i?.response?.data?.message||i?.message||"Search failed";I(!1),y(b=>({...b,admission_number:u==="No-checkout"||/not found/i.test(String(u))?`No deceased record found for admission number "${s}".`:u})),xe()}finally{z(!1)}}},$e=()=>{const t={};return r.admission_number||(t.admission_number="Admission number is required"),r.full_name.trim()||(t.full_name="Full name is required"),r.gender||(t.gender="Gender is required"),r.date_admitted||(t.date_admitted="Date admitted is required"),r.release_date||(t.release_date="Release date is required"),r.released_by.trim()||(t.released_by="Released by is required"),r.next_kin.trim()||(t.next_kin="Next of kin is required"),r.id_number.trim()||(t.id_number="ID number is required"),r.tel_number.trim()||(t.tel_number="Telephone number is required"),r.terms_accepted||(t.terms_accepted="You must accept the terms"),r.tel_number&&!/^(\+254|0)[17]\d{8}$/.test(r.tel_number.replace(/\s/g,""))&&(t.tel_number="Please enter a valid Kenyan phone number"),T.current?.isEmpty()&&(t.signature="Signature is required to proceed"),y(t),t},Fe=async t=>{t?.preventDefault();const s=$e();if(Object.keys(s).length>0){const i=Object.values(s);ee.info("Missing required details",`Please complete the following: ${i.join(", ")}`),E({type:"error",text:`Please complete all required fields: ${i.join(", ")}`});return}ce(!0),E({type:"",text:""});try{const i=F(),u=q(),b=T.current?.toDataURL(),w=v(),N={...r,admission_number:String(r.admission_number||"").toUpperCase(),time_received:w,release_time:w,age:r.age?parseInt(r.age,10):null,body_status:"Released",verified_by:r.verified_by||Y()||null,signature:b,name_of_deceased:r.full_name,tell_number:r.tel_number},ge=await fetch(`${K.FULL_API_URL}${J.BODYCHECKOUT.CHECKOUT}`,{method:"POST",headers:{"Content-Type":"application/json","x-tenant-slug":i,Authorization:`Bearer ${u}`},body:JSON.stringify(N)}),$=await ge.json();if(!ge.ok)throw new Error($.message||"Release failed");ee.success("Release Successful",`${r.full_name||"The record"} has been released successfully.`),$.data&&$.data.release_id&&me($.data.release_id),he({full_name:r.full_name,date_of_death:r.date_of_death,admission_number:String(r.admission_number||"").toUpperCase(),release_id:$.data?.release_id||"",release_date:r.release_date,signature:$.data?.signature||b||"",staff_signature:$.data?.staff_signature||""}),de(!0),L({...Q,verified_by:Y(),time_received:v(),release_time:v(),date_admitted:new Date().toISOString().split("T")[0],release_date:new Date().toISOString().split("T")[0]}),T.current?.clear(),y({})}catch(i){ee.error("Release failed",i.message||"Please check the details and try again."),E({type:"error",text:i.message||"Something went wrong. Please try again."})}finally{ce(!1)}},Te=()=>{L({...Q,verified_by:Y(),time_received:v(),release_time:v(),date_admitted:new Date().toISOString().split("T")[0],release_date:new Date().toISOString().split("T")[0]}),y({}),E({type:"",text:""}),me(""),de(!1),he(null),I(!1),z(!1),R.current="",T.current?.clear()},c=t=>t!=null&&String(t).trim().length>0;if(ve&&!le)return(0,e.jsx)(te,{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)(V,{size:48,color:n.ink,className:"animate-spin"}),(0,e.jsx)("p",{style:{marginTop:"1rem",fontSize:"0.85rem",color:n.gray,fontFamily:"Saira",textTransform:"uppercase",letterSpacing:"0.1em"},children:"Loading Record..."})]})});if(O)return(0,e.jsx)(te,{style:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"},children:(0,e.jsxs)("div",{style:{textAlign:"center"},children:[(0,e.jsx)(V,{size:48,color:n.ink,className:"animate-spin"}),(0,e.jsx)("p",{style:{marginTop:"1rem",fontSize:"0.85rem",color:n.gray,fontFamily:"Saira",textTransform:"uppercase",letterSpacing:"0.1em"},children:"Processing Release..."})]})});if(le){const t=ke||{};return(0,e.jsx)(qe,{mode:"release",name:t.full_name||"The deceased",passed:t.date_of_death,reference:t.release_id||t.admission_number||"",onDone:()=>{const s=typeof F=="function"&&F()||localStorage.getItem("tenantSlug")||"";C(s?`/tenant/${s}/receptionist`:"/reception")}})}return(0,e.jsxs)(te,{children:[(0,e.jsx)(We,{position:"top-right",autoClose:5e3,hideProgressBar:!1,newestOnTop:!0,closeOnClick:!0,rtl:!1,pauseOnFocusLoss:!0,draggable:!0,pauseOnHover:!0,theme:"light",limit:3}),(0,e.jsxs)(Je,{children:[(0,e.jsx)(Ze,{children:"OFFICIAL RECORD"}),(0,e.jsxs)(Xe,{children:[(0,e.jsx)(Qe,{children:(0,e.jsxs)(et,{children:[(0,e.jsxs)(tt,{children:[(0,e.jsxs)(rt,{children:[(0,e.jsx)(nt,{children:"Welcome to"}),(0,e.jsx)(at,{children:(0,e.jsxs)(it,{children:[(0,e.jsx)(Z,{children:H||"Lee Funeral Home"}),(0,e.jsx)(Z,{children:"Sorry for your loss"}),(0,e.jsx)(Z,{children:"With deepest sympathy"}),(0,e.jsx)(Z,{children:"May they rest in peace"})]})}),(0,e.jsx)(st,{children:Le()})]}),(0,e.jsxs)(ot,{children:[(0,e.jsx)(lt,{children:"Facility Information"}),(0,e.jsxs)(re,{children:[(0,e.jsx)(Bt,{}),ze||A.address||A.location]}),(0,e.jsxs)(re,{children:[(0,e.jsx)(Nt,{}),Ce||A.email]}),(0,e.jsxs)(re,{children:[(0,e.jsx)(Ot,{}),pe||A.phone]})]})]}),(0,e.jsxs)(dt,{children:[(0,e.jsxs)(ct,{children:[(0,e.jsx)(mt,{children:"Record Date"}),(0,e.jsx)(ht,{children:Wt(r.release_date)})]}),(0,e.jsxs)(pt,{children:[(0,e.jsx)(xt,{children:r.admission_number||"AWAITING-ID"}),(0,e.jsx)(Mt,{value:r.admission_number}),(0,e.jsx)(ut,{children:r.full_name||"—"})]})]})]})}),(0,e.jsx)(ft,{children:(0,e.jsxs)("form",{onSubmit:Fe,noValidate:!0,children:[(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"01"}),(0,e.jsx)(U,{children:"Release & Facility Information"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Admission Number ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"text",name:"admission_number",value:r.admission_number,onChange:d,onKeyDown:t=>{t.key==="Enter"&&(t.preventDefault(),D.current&&clearTimeout(D.current),fe(r.admission_number))},placeholder:"Start typing to search the database...",autoComplete:"off",autoCorrect:"off",autoCapitalize:"off",spellCheck:"false",style:{textTransform:"uppercase"}}),oe?(0,e.jsxs)(je,{children:[(0,e.jsx)(gt,{children:(0,e.jsx)(V,{size:14})}),"Searching..."]}):c(r.admission_number)&&B?(0,e.jsxs)(x,{style:{color:n.green},children:[(0,e.jsx)(h,{size:16,strokeWidth:2.5}),(0,e.jsx)("span",{style:{fontSize:"0.65rem",color:n.green,fontWeight:700,marginLeft:"0.3rem"},children:"Found"})]}):!oe&&c(r.admission_number)&&!B&&o.admission_number?(0,e.jsxs)(je,{style:{color:n.red},children:[(0,e.jsx)(Pe,{size:14})," Not Found"]}):null]}),o.admission_number&&(0,e.jsx)(_,{children:o.admission_number})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Date Admitted ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"date",name:"date_admitted",value:r.date_admitted,onChange:d}),c(r.date_admitted)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.date_admitted&&(0,e.jsx)(_,{children:o.date_admitted})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Permit Number"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"permit_number",value:r.permit_number,onChange:d,placeholder:"Permit/Reference Number"}),c(r.permit_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Released By ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"released_by",value:r.released_by,onChange:d,placeholder:"Name of person releasing the body"}),c(r.released_by)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.released_by&&(0,e.jsx)(_,{children:o.released_by})]})]})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"02"}),(0,e.jsx)(U,{children:"Deceased Information"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Full Legal Name of Deceased ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"text",name:"full_name",value:r.full_name,onChange:d,placeholder:"Enter full legal name"}),c(r.full_name)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.full_name&&(0,e.jsx)(_,{children:o.full_name})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Gender ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"gender",value:r.gender,onChange:d,children:[(0,e.jsx)("option",{value:"",children:"Select Gender"}),(0,e.jsx)("option",{value:"Male",children:"Male"}),(0,e.jsx)("option",{value:"Female",children:"Female"})]}),c(r.gender)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.gender&&(0,e.jsx)(_,{children:o.gender})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Age"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"number",name:"age",value:r.age,onChange:d,placeholder:"Years"}),c(r.age)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Date of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"date",name:"date_of_death",value:r.date_of_death,onChange:d}),c(r.date_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Cause of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"cause_of_death",value:r.cause_of_death,onChange:d,placeholder:"As certified on medical document"}),c(r.cause_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Place of Death"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"place_of_death",value:r.place_of_death,onChange:d,placeholder:"Location/Hospital"}),c(r.place_of_death)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Body Status"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"body_status",value:r.body_status||"Released",readOnly:!0,disabled:!0}),c(r.body_status)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"03"}),(0,e.jsx)(U,{children:"Next of Kin / Authorizing Party"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Next of Kin Full Name ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"next_kin",value:r.next_kin,onChange:d,placeholder:"Full name of authorizing party"}),c(r.next_kin)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.next_kin&&(0,e.jsx)(_,{children:o.next_kin})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Relationship"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"relationship",value:r.relationship,onChange:d,placeholder:"e.g. Spouse, Child, Sibling"}),c(r.relationship)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"ID Type"}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"id_type",value:r.id_type,onChange:d,children:[(0,e.jsx)("option",{value:"",children:"Select Identification"}),(0,e.jsx)("option",{value:"National ID",children:"National ID"}),(0,e.jsx)("option",{value:"Passport",children:"Passport"}),(0,e.jsx)("option",{value:"Alien Card",children:"Alien Card"})]}),c(r.id_type)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["ID / Passport Number ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"id_number",value:r.id_number,onChange:d,placeholder:"Identification number"}),c(r.id_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.id_number&&(0,e.jsx)(_,{children:o.id_number})]})]}),(0,e.jsx)(S,{children:(0,e.jsxs)(X,{children:[(0,e.jsxs)(m,{children:["Primary Telephone ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"tel",name:"tel_number",value:r.tel_number,onChange:d,placeholder:"e.g., 0712345678"}),c(r.tel_number)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.tel_number&&(0,e.jsx)(_,{children:o.tel_number})]})})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"04"}),(0,e.jsx)(U,{children:"Removal, Transportation & Release Details"})]}),(0,e.jsxs)(S,{children:[(0,e.jsxs)(f,{children:[(0,e.jsxs)(m,{children:["Release Date ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"date",name:"release_date",value:r.release_date,onChange:d}),c(r.release_date)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]}),o.release_date&&(0,e.jsx)(_,{children:o.release_date})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Release Time"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(G,{type:"time",name:"release_time",value:r.release_time,onChange:d}),c(r.release_time)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsxs)(f,{children:[(0,e.jsx)(m,{children:"Mode of Transport"}),(0,e.jsxs)(p,{children:[(0,e.jsxs)(ne,{name:"mode_of_transport",value:r.mode_of_transport,onChange:d,children:[(0,e.jsx)("option",{value:"hearse",children:"Hearse / Van"}),(0,e.jsx)("option",{value:"air",children:"Air Transport"}),(0,e.jsx)("option",{value:"rail",children:"Rail"}),(0,e.jsx)("option",{value:"private",children:"Private Vehicle"}),(0,e.jsx)("option",{value:"courier",children:"Courier Service"}),(0,e.jsx)("option",{value:"other",children:"Other"})]}),c(r.mode_of_transport)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]})]}),(0,e.jsx)(S,{children:(0,e.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"1rem",width:"100%"},children:[(0,e.jsxs)("label",{style:{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"},children:[(0,e.jsx)("input",{type:"checkbox",name:"terms_accepted",checked:r.terms_accepted,onChange:d,style:{marginTop:"0.2rem",width:"1rem",height:"1rem",accentColor:n.verdigris}}),(0,e.jsx)("span",{style:{fontSize:"0.8rem",color:n.gray,lineHeight:"1.5"},children:"I hereby authorize the release and transportation of the deceased. I certify that I am the legally authorized next of kin or representative and have the right to make this authorization."})]}),o.terms_accepted&&(0,e.jsx)(_,{children:o.terms_accepted}),(0,e.jsxs)("label",{style:{display:"flex",alignItems:"flex-start",gap:"0.6rem",cursor:"pointer"},children:[(0,e.jsx)("input",{type:"checkbox",name:"everything_paid",checked:r.everything_paid,onChange:d,style:{marginTop:"0.2rem",width:"1rem",height:"1rem",accentColor:n.verdigris}}),(0,e.jsx)("span",{style:{fontSize:"0.8rem",color:n.gray,lineHeight:"1.5"},children:"I confirm that all outstanding charges and payments have been settled."})]})]})})]}),(0,e.jsxs)(W,{children:[(0,e.jsxs)(M,{children:[(0,e.jsx)(P,{children:"05"}),(0,e.jsx)(U,{children:"Verification & Digital Sign-off"})]}),(0,e.jsx)(_t,{children:(0,e.jsxs)(yt,{children:[(0,e.jsxs)(vt,{children:[(0,e.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,e.jsxs)(m,{children:["Authorizing Signature ",(0,e.jsx)("span",{style:{color:n.red},children:"*"})]}),(0,e.jsx)(Lt,{type:"button",onClick:()=>T.current?.clear(),children:"Clear Pad"})]}),(0,e.jsxs)(bt,{children:[(0,e.jsx)(Ye,{ref:T,penColor:n.inkBlue}),(0,e.jsx)(jt,{children:"Sign within boundaries"})]}),o.signature&&(0,e.jsx)(_,{children:o.signature})]}),(0,e.jsxs)(wt,{children:[(0,e.jsxs)(St,{children:[(0,e.jsx)(m,{children:"Released By Officer"}),(0,e.jsxs)(p,{children:[(0,e.jsx)(j,{type:"text",name:"released_by",value:r.released_by,onChange:d,placeholder:"Officer full name"}),c(r.released_by)&&(0,e.jsx)(x,{children:(0,e.jsx)(h,{size:16,strokeWidth:2.5})})]})]}),(0,e.jsx)(kt,{children:(0,e.jsx)(He,{tenantName:H,tenantPhone:pe||A.phone,tenantLocation:De||A.location,recordLabel:"OFFICIAL RELEASE RECORD"})})]})]})})]}),(0,e.jsxs)(Ct,{children:[(0,e.jsx)(zt,{type:"button",onClick:Te,disabled:O,children:"Reset Inputs"}),(0,e.jsx)(It,{type:"button",onClick:()=>C(-1),disabled:O,children:"Cancel / Back"}),(0,e.jsx)(Dt,{type:"submit",disabled:O,children:O?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(V,{size:16,className:"animate-spin"})," Submitting Release..."]}):(0,e.jsxs)(e.Fragment,{children:["Submit Release ",(0,e.jsx)(Ue,{size:16})]})})]})]})}),(0,e.jsxs)(At,{children:[H||"This Funeral Home"," — Generated ",new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})," at ",new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}),(0,e.jsx)("br",{}),"- Official Release Record -"]}),(0,e.jsxs)($t,{children:[(0,e.jsx)(Ft,{children:(0,e.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"#EDE9DB",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round",width:"21",height:"21",children:[(0,e.jsx)("path",{d:"M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z"}),(0,e.jsx)("path",{d:"M4 20c4-6.5 8.5-10 13-12.5"})]})}),(0,e.jsx)(Tt,{children:"Received with dignity. Cared for with respect. Remembered with love."}),(0,e.jsxs)(Rt,{children:[(0,e.jsx)(ae,{children:"Dignity"}),(0,e.jsx)(_e,{children:"·"}),(0,e.jsx)(ae,{children:"Care"}),(0,e.jsx)(_e,{children:"·"}),(0,e.jsx)(ae,{children:"Respect"})]}),(0,e.jsxs)(Et,{children:[(0,e.jsxs)("span",{children:["© ",new Date().getFullYear()," ",H||"This Funeral Home"]}),(0,e.jsx)("span",{children:"Official Release Record"})]})]})]})]})]})};export{dr as default};
