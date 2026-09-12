import{r as g}from"./chunk-CXHxssQy.js";import{y as w}from"./chunk-CXAmgOhv.js";import{_ as t}from"./chunk-DJYPtS2Y.js";import{o as u}from"./chunk-BY9AVXEY.js";import{Gn as v,Ht as j,Rt as b,_t as y,gn as S}from"./index-Cp7mIUwY.js";var a=g(w(),1),e=u(),l={phone:"0740045355",email:"infowelttallis@gmail.com"},k={dangerRed:"#C0392B",kinSuccess:"#00A896",kinDanger:"#E71D36",autopsySuccess:"#6A0572",autopsyDanger:"#37fc00"},_=t.footer`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 0.65rem 1.25rem;
  background: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  font-size: 0.75rem;
  gap: 0.75rem;
  overflow: hidden;

  > * {
    min-width: 0;
  }

  @media (max-width: 900px) {
    justify-content: center;
  }

  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
  }
`,s=t.div`
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.8rem;
  flex-shrink: 1;

  /* Prevent long text from pushing the footer wider */
  > * {
    min-width: 0;
  }

  span {
    min-width: 0;
  }

  @media (max-width: 900px) {
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.55rem;

    &:first-child {
      grid-column: auto;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }
  }
`,I=t.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;

  svg {
    flex-shrink: 0;
  }
`,d=t.a`
  color: #94a3b8;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #60a5fa;
  }

  svg {
    flex-shrink: 0;
  }
`,z=t.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #10b981;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;

  span {
    width: 6px;
    height: 6px;
    min-width: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
  }
`,D=t.span`
  color: ${k.autopsyDanger};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: inline-block;
  vertical-align: bottom;

  @media (max-width: 600px) {
    max-width: 140px;
  }
`,C=t.span`
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
`,L=t.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;

  > div {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    width: 100%;
    gap: 0.6rem;
    justify-content: flex-start;
  }
`,R=()=>{const[p,c]=(0,a.useState)("24ms"),[m,n]=(0,a.useState)("User"),o=new Date().getFullYear();(0,a.useEffect)(()=>{try{const r=localStorage.getItem("user");if(r){const i=JSON.parse(r),f=i.full_name||i.name||i.username||i.email||"User";n(f)}}catch{n("User")}},[]);const x=()=>{const r=Math.random().toString(36).substring(2,7).toUpperCase();return`WT-RSP-CLOUD.V2.1-${o}-${r}`},[h]=(0,a.useState)(x());return(0,a.useEffect)(()=>{const r=setInterval(()=>{c(`${Math.floor(Math.random()*10)+21}ms`)},5e3);return()=>clearInterval(r)},[]),(0,e.jsxs)(_,{children:[(0,e.jsxs)(s,{children:[(0,e.jsxs)(I,{children:[(0,e.jsx)(S,{size:14})," © ",o," WELT TALLIS Inc"]}),(0,e.jsx)("div",{style:{opacity:.5},children:"|"}),(0,e.jsxs)("span",{children:[" ","- Logged in as : ",(0,e.jsx)(D,{children:m})]})]}),(0,e.jsxs)(s,{children:[(0,e.jsxs)(d,{href:`https://wa.me/${l.phone}`,target:"_blank",children:[(0,e.jsx)(j,{size:14})," WhatsApp"]}),(0,e.jsxs)(d,{href:`mailto:${l.email}`,children:[(0,e.jsx)(b,{size:14})," Contact"]})]}),(0,e.jsxs)(s,{style:{alignItems:"flex-end"},children:[(0,e.jsxs)(z,{children:[(0,e.jsx)("span",{})," Operational"]}),(0,e.jsxs)(L,{children:[(0,e.jsxs)("div",{children:[(0,e.jsx)(v,{size:12})," ",p]}),(0,e.jsxs)("div",{children:[(0,e.jsx)(y,{size:12})," v2.1"]}),(0,e.jsxs)(C,{children:["Product ID: ",h]})]})]})]})};export{R as default};
