// FlowerSnowBookingForm.jsx
// Flower booking side panel: two step wizard, autofilled ready-at time,
// the arrangements the client picked in the gallery, departed name dedication,
// free text ribbon color, size cards, review step, and the compact
// confirmation. Rosewood footer inside.

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Snowfall from './Snowfall'
import notify from '../../utils/notify';
import { resolveTenantLogoSrc, getTenantBrandingFromStorage, firstNonEmptyString } from '../../utils/tenantResolver/tenantBranding';
import { getBranchSlug, getBranchId } from '../../utils/globalAuth';
/* ─────────────────────────────────────────────────────────────────────────────
   Flower booking panel — "intake sheet" design language.
   Palette + component treatment follow the approved reference: paper-white
   panel, brass section rules, dashed-underline fields, verdigris tick badges
   and berry reserved for buttons + footer only.
   Fonts (Saira / Cormorant Garamond / JetBrains Mono / Karla) are already
   loaded once in src/index.css — never re-import them here.
   ───────────────────────────────────────────────────────────────────────── */
const FORM_CSS = `
:root{
  --ink:#15171A; --ink2:#5F584C; --faint:#A8A29E;
  --line:#E3DFD3; --dash:#CFC9BA;
  --brass:#A98F6E; --brass-l:#C4AD8C;
  --verd:#3E7C6F; --red:#B91C1C;
  --bone:#FAF8F2; --bone2:#F3F0E8;
  --berry:#9C3D5C; --berry-d:#7E2F4B;
  --sans:'Saira',system-ui,sans-serif;
  --mono:'JetBrains Mono',monospace;
  --serif:'Cormorant Garamond',Georgia,serif;
  --karla:'Karla','Segoe UI',sans-serif;
  --ease:cubic-bezier(.32,.72,.24,1);
}
.fbp-scrim{position:fixed;inset:0;background:rgba(21,23,26,.5);backdrop-filter:blur(2px);z-index:300;
  animation:fbFade .25s ease}
@keyframes fbFade{from{opacity:0}to{opacity:1}}
.fbp-panel{position:fixed;top:0;right:0;bottom:0;width:min(620px,100vw);z-index:310;background:#fff;
  box-shadow:-30px 0 80px rgba(21,23,26,.35);animation:fbpIn .38s cubic-bezier(.16,1,.3,1);
  display:flex;flex-direction:column;overflow:hidden;
  font:400 15px/1.5 var(--sans);color:var(--ink)}
@keyframes fbpIn{from{transform:translateX(64px);opacity:0}to{transform:none;opacity:1}}
.fbp-close{position:absolute;top:14px;right:14px;z-index:30;width:38px;height:38px;
  border:1px solid var(--line);background:#fff;color:var(--ink2);font-size:20px;line-height:1;
  display:grid;place-items:center;transition:.2s var(--ease);cursor:pointer;padding:0;
  font-family:var(--sans)}
.fbp-close:hover{background:var(--ink);color:var(--bone);border-color:var(--ink)}
.fbp-scroll{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;position:relative}
svg{display:block}
.fbp-panel button{font-family:var(--sans);cursor:pointer;color:var(--ink);background:none;border:0}
.fbp-panel input,.fbp-panel select,.fbp-panel textarea{font:inherit;color:inherit}
.fbp-panel ::selection{background:var(--bone2)}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.fbp-panel button:focus-visible,.fbp-panel input:focus-visible,.fbp-panel textarea:focus-visible,
.fbp-panel select:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
/* ── petals ── */
.fbp-panel .snowfall{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
/* ── watermark ── */
.watermark{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-32deg);
  font:800 clamp(3.4rem,14vw,7rem)/1 var(--sans);letter-spacing:.18em;text-transform:uppercase;
  color:rgba(21,23,26,.022);white-space:nowrap;pointer-events:none;user-select:none;z-index:0}
/* ── document header ── */
.doc-head{position:relative;z-index:1;text-align:center;padding:38px 32px 0}
.logo-wrap{display:flex;justify-content:center;align-items:center;min-height:54px;margin-bottom:10px}
.logo-wrap img{height:50px;max-width:min(220px,68%);object-fit:contain}
.logo-wrap .sprig{display:none;width:min(200px,56vw);height:auto}
.logo-wrap.fallback img,.logo-wrap.fallback .logo-mono{display:none}
.logo-wrap.fallback .sprig{display:block}
.logo-mono{height:50px;width:50px;border-radius:50%;display:grid;place-items:center;
  background:var(--ink);color:var(--bone);font:600 1.25rem var(--sans)}
.doc-head h1{font:600 1.45rem/1.2 var(--sans);letter-spacing:-.01em;margin:0}
.doc-head h1 em{font-style:italic;color:var(--berry)}
.doc-sub{font:italic 500 .95rem var(--serif);color:var(--ink2);margin:3px 0 0}
.inmemory{font:italic 600 1rem var(--serif);color:var(--brass);margin:8px 0 0;animation:memIn .3s ease}
@keyframes memIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.doc-meta{font:500 .66rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:12px 0 0}
.doc-meta b{color:var(--ink2);font-weight:500;font-variant-numeric:tabular-nums}
.doc-rule{height:1px;background:var(--line);margin:18px 32px 0}
/* ── step strip ── */
.stepstrip{position:relative;z-index:1;display:flex;justify-content:center;gap:26px;list-style:none;
  padding:16px 32px 4px;margin:0;font:700 .6rem var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
.stepstrip li{display:flex;align-items:center;gap:8px;transition:.25s}
.stepstrip li i{font-style:normal;font-weight:500;border:1px solid var(--line);padding:2px 7px;color:var(--faint);transition:.25s}
.stepstrip li.cur{color:var(--ink)}
.stepstrip li.cur i{background:var(--ink);border-color:var(--ink);color:var(--bone)}
.stepstrip li.done{color:var(--brass)}
.stepstrip li.done i{background:var(--bone2);border-color:var(--brass);color:var(--brass)}
.stepstrip li::after{content:"";width:26px;height:1px;background:var(--line);margin-left:26px}
.stepstrip li:last-child::after{display:none}
@media(max-width:480px){.stepstrip li span{display:none}.stepstrip li::after{width:14px;margin-left:12px}}
/* ── body ── */
.panes{position:relative;z-index:1;padding:14px 36px 8px}
@media(max-width:600px){.panes{padding:10px 20px 6px}}
.pane{display:none}
.pane.active{display:block;animation:stepIn .35s cubic-bezier(.16,1,.3,1)}
@keyframes stepIn{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
.section{margin-bottom:2.4rem}
.section:last-child{margin-bottom:0}
.section-head{display:flex;align-items:center;gap:.7rem;margin-bottom:1.5rem;padding:.68rem 1.15rem;
  background:var(--ink);border-radius:3px}
.section-head .n{font:500 .7rem var(--mono);color:rgba(250,248,244,.42)}
.section-head .t{font:500 .76rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:#FAF8F2}
/* ── dashed-underline fields ── */
.frow{display:flex;gap:1.5rem;flex-wrap:wrap}
.frow>.field{flex:1 1 200px;min-width:0}
@media(max-width:560px){.frow{flex-direction:column;gap:1.25rem}}
.field{margin-bottom:1.5rem}
.field:last-child{margin-bottom:0}
.field>label{display:block;font:600 .68rem var(--sans);letter-spacing:.12em;text-transform:uppercase;
  color:var(--brass);margin-bottom:.5rem}
.req{color:var(--red)}
.opt{display:inline;text-transform:none;letter-spacing:0;font-weight:500;color:var(--faint);font-style:italic}
.inwrap{position:relative;display:flex;align-items:center}
.inwrap input,.inwrap select,.inwrap textarea{
  width:100%;height:2.75rem;background:transparent;border:none;border-radius:0;outline:none;
  border-bottom:1.5px dashed var(--dash);padding:0 2.1rem .35rem 0;
  font:400 .95rem var(--sans);color:var(--ink);transition:border-color .2s var(--ease)}
.inwrap textarea{height:auto;min-height:5.4rem;line-height:1.6;padding-top:.5rem;padding-bottom:1.7rem;resize:vertical}
.inwrap input:hover,.inwrap select:hover,.inwrap textarea:hover{border-bottom:1.5px solid var(--ink)}
.inwrap input:focus,.inwrap select:focus,.inwrap textarea:focus{border-bottom:1.5px solid var(--berry)}
.inwrap ::placeholder{color:var(--faint);font-weight:400}
.inwrap select{appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:2.4rem;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%235F584C' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 2px center}
.inwrap input:disabled{color:var(--faint);cursor:not-allowed;border-bottom-color:var(--line)}
.field.bad .inwrap input,.field.bad .inwrap select,.field.bad .inwrap textarea{border-bottom:1.5px solid var(--red)}
.field.bad>label{color:var(--red)}
.err{display:none;font:500 .75rem var(--sans);color:var(--red);margin:.35rem 0 0}
.field.bad .err{display:block}
.autofilled{font:italic 500 .82rem var(--serif);color:var(--faint);margin:.4rem 0 0}
.tareawrap{position:relative;width:100%}
.counter{position:absolute;bottom:.55rem;right:0;font:700 .62rem var(--mono);color:var(--faint)}
/* verdigris tick badge — appears when the field holds a value */
.tickbadge{position:absolute;right:.2rem;top:50%;transform:translateY(-50%);
  width:1.4rem;height:1.4rem;border-radius:50%;background:var(--verd);color:#fff;
  display:none;place-items:center;pointer-events:none}
.tickbadge svg{width:13px;height:13px}
.inwrap.has-val .tickbadge{display:grid}
.inwrap.has-val input,.inwrap.has-val select{padding-right:2.6rem}
.tareawrap .tickbadge{top:1rem}
/* any-color — square checkbox row, no pill */
.any-line{display:flex;align-items:center;gap:.7rem;padding:.35rem 0 .65rem;cursor:pointer;user-select:none}
.sqbox{appearance:none;-webkit-appearance:none;width:20px;height:20px;flex:none;position:relative;cursor:pointer;
  border:0;border-radius:4px;background:var(--bone2);box-shadow:inset 0 0 0 1.5px var(--line);
  transition:background .15s,box-shadow .15s}
.sqbox:checked{background:var(--verd);box-shadow:none}
.sqbox:checked::after{content:'';position:absolute;left:6.5px;top:2px;width:5px;height:10px;
  border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.sqbox:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.any-line span{font:500 .9rem var(--sans);color:var(--ink2)}
/* ── size cards ── */
.sizes{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-top:.3rem}
@media(max-width:460px){.sizes{grid-template-columns:1fr 1fr}}
.sizecard{position:relative;border:1.5px dashed var(--dash);background:#fff;padding:.8rem .5rem;
  text-align:center;transition:.2s var(--ease)}
.sizecard b{display:block;font:600 1rem var(--sans);color:var(--ink)}
.sizecard small{display:block;font:500 .58rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-top:3px}
.sizecard:hover{border-bottom:1.5px solid var(--ink)}
.sizecard.on{border:1.5px solid var(--ink);background:var(--bone)}
.sizecard .tick{position:absolute;top:6px;right:6px;width:17px;height:17px;border-radius:50%;
  background:var(--verd);color:#fff;display:none;place-items:center}
.sizecard.on .tick{display:grid}
.sizecard .tick svg{width:9px;height:9px}
/* ── arrangements picked in the gallery ── */
.chosen{display:flex;flex-direction:column;gap:10px;margin-bottom:1.6rem}
.chosenRow{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);background:var(--bone)}
.chosenThumb{width:52px;height:52px;flex:none;object-fit:cover;background:var(--bone2)}
.chosenInfo{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.chosenInfo b{font:600 1rem/1.25 var(--sans);color:var(--ink)}
.chosenInfo span{font:500 .7rem/1.35 var(--sans);letter-spacing:.04em;color:var(--faint)}
.chosenQty{display:flex;flex-direction:column;gap:4px;align-items:center;
  font:700 .58rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}
.chosenQty input{width:68px;height:2.2rem;padding:0 4px;border:none;border-bottom:1.5px dashed var(--dash);
  background:transparent;color:var(--ink);font:600 .9rem var(--sans);text-align:center}
.chosenQty input:focus{outline:none;border-bottom:1.5px solid var(--berry)}
/* flower-type multi-select */
.flower-choice-list{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:.6rem}
.flower-choice-list label{display:inline-flex;align-items:center;gap:7px;padding:.45rem .7rem;
  border:1px solid var(--line);background:#fff;cursor:pointer;user-select:none;transition:.15s}
.flower-choice-list input{appearance:none;-webkit-appearance:none;width:15px;height:15px;flex:none;
  border-radius:3px;background:var(--bone2);box-shadow:inset 0 0 0 1.5px var(--line);position:relative;cursor:pointer}
.flower-choice-list input:checked{background:var(--verd);box-shadow:none}
.flower-choice-list input:checked::after{content:'';position:absolute;left:4.5px;top:1px;width:4px;height:8px;
  border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.flower-choice-list span{font:500 .8rem var(--sans);color:var(--ink2)}
.flower-choice-list label.on{border-color:var(--ink);background:var(--bone)}
/* ── review ── */
.review{margin-bottom:1.9rem}
.rv{display:flex;justify-content:space-between;gap:16px;padding:.7rem 0;border-bottom:1px dashed var(--line)}
.rv:last-child{border-bottom:0}
.rv dt{font:700 .56rem var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--faint);padding-top:4px;flex:none}
.rv dd{font:500 .92rem var(--sans);color:var(--ink);text-align:right;min-width:0;overflow-wrap:anywhere;
  font-variant-numeric:tabular-nums}
/* ── confirm gate ── */
.confirm-block{margin:2.2rem 0 0;padding:1.05rem 1.2rem 1.15rem;border-radius:4px;scroll-margin-top:2rem;
  background:var(--bone2)}
.confirm-block:focus-within{box-shadow:0 0 0 2px rgba(169,143,110,.16)}
.confirm-block.checked:focus-within{box-shadow:none}
.confirm-label{display:flex;align-items:flex-start;gap:.8rem;cursor:pointer;user-select:none}
.confirm-label .sqbox{width:22px;height:22px;margin-top:.05rem}
.confirm-label .sqbox:checked::after{left:7.5px;top:3px;width:6px;height:11px;border-width:0 3px 3px 0}
.confirm-text{font:500 .95rem/1.5 var(--serif);color:var(--ink);padding-top:.1rem}
.confirm-err{display:none;align-items:center;gap:.4rem;margin:.5rem 0 0 2.1rem;font:500 .78rem var(--sans);color:var(--red)}
.confirm-block.bad .confirm-err{display:flex}
/* ── actions — berry only ── */
.actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:2.6rem;padding-top:1.6rem;
  border-top:1px solid var(--line);flex-wrap:wrap}
@media(max-width:600px){.actions{flex-direction:column-reverse}.actions>button{width:100%;justify-content:center}}
.btn-ghost{padding:.95rem 1.7rem;border:1px solid var(--line);background:#fff;color:var(--ink2);
  font:600 .8rem var(--sans);letter-spacing:.08em;text-transform:uppercase;border-radius:4px;transition:.2s var(--ease)}
.btn-ghost:hover{border-color:var(--ink2);color:var(--ink)}
.btn-primary{padding:.95rem 2rem;background:var(--berry);color:#FBF3EE;border:none;border-radius:4px;
  font:600 .85rem var(--sans);letter-spacing:.05em;text-transform:uppercase;transition:.2s var(--ease);
  display:inline-flex;align-items:center;justify-content:center;gap:.5rem;
  box-shadow:0 6px 16px -4px rgba(156,61,92,.4)}
.btn-primary:hover:not(:disabled){background:var(--berry-d);transform:translateY(-1px);
  box-shadow:0 10px 24px -4px rgba(156,61,92,.5)}
.btn-primary:disabled{opacity:.7;cursor:wait;transform:none}
.btn-primary .b{width:15px;height:15px;flex:none}
.fbspin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(251,243,238,.35);
  border-top-color:#FBF3EE;animation:fbspin .7s linear infinite;flex:none}
@keyframes fbspin{to{transform:rotate(360deg)}}
.formnote{text-align:center;font:italic 500 .86rem var(--serif);color:var(--faint);padding:1rem 0 0;margin:0}
/* ── confirmation ── */
.conf{text-align:center;padding:2.4rem 1rem 1.6rem;position:relative;z-index:1}
.conf h2{font:600 1.5rem/1.15 var(--sans);letter-spacing:-.01em;margin:0}
.conf h2 em{font-style:italic;color:var(--berry)}
.csub{font:italic 500 .98rem var(--serif);color:var(--ink2);margin:6px 0 0}
.cref{display:inline-flex;gap:18px;flex-wrap:wrap;justify-content:center;margin:1.3rem 0 .4rem;padding:.85rem 1.6rem;
  border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);
  font:700 .78rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--berry)}
.cref span:empty{display:none}
.conf-meta{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-top:1rem;
  font:500 .68rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.conf-meta b{color:var(--ink2);font-weight:500}
.conf .actions{justify-content:center;border-top:0;padding-top:1.4rem;margin-top:.6rem}
.conf .sprig{width:min(190px,56vw);height:auto;margin:1.6rem auto 0}
/* ── footer — berry ── */
.site-foot{position:relative;overflow:hidden;background:linear-gradient(150deg,#A54466 0%,#7E2F4B 100%);
  color:#F5EFE3;text-align:center;padding:40px 20px 34px;margin-top:2rem}
.site-foot::before{content:"";position:absolute;left:50%;bottom:-260px;transform:translateX(-50%);width:520px;height:520px;
  border-radius:50%;border:1.5px solid rgba(245,239,227,.14);pointer-events:none}
.site-foot::after{content:"";position:absolute;left:50%;bottom:-320px;transform:translateX(-50%);width:680px;height:680px;
  border-radius:50%;border:1px solid rgba(245,239,227,.08);pointer-events:none}
.leafmark{width:42px;height:42px;margin:0 auto 14px;border-radius:50%;background:rgba(245,239,227,.16);
  border:1px solid rgba(245,239,227,.34);display:grid;place-items:center;position:relative}
.leafmark svg{width:19px;height:19px}
.tagline{font:italic 500 1.15rem/1.5 var(--serif);color:rgba(245,239,227,.9);max-width:42ch;margin:0 auto;position:relative}
.values{display:flex;align-items:center;justify-content:center;gap:14px;margin:20px auto 0;max-width:380px;position:relative}
.values::before,.values::after{content:"";flex:1;height:1px;background:rgba(245,239,227,.22)}
.values span{font:700 .6rem var(--karla);letter-spacing:.26em;text-transform:uppercase;color:rgba(245,239,227,.65)}
@media(max-width:600px){.site-foot{padding:40px 20px 36px}}
@media(prefers-reduced-motion:reduce){
  .fbp-panel *,.fbp-scrim{animation:none!important;transition:none!important}
  .fbp-panel .snowfall{display:none}
}
`

const FbSymbols = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      {/* small bloom icon: bright filled petals with gold center */}
      <symbol id="bloom" viewBox="0 0 24 24">
        <g fill="#F0AFA0" stroke="#C96F63" strokeWidth="1.1" strokeLinejoin="round">
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(72 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(144 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(216 12 12)" />
          <path d="M12 10.6C10.4 8.6 10.4 6.2 12 4.4c1.6 1.8 1.6 4.2 0 6.2Z" transform="rotate(288 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.7" fill="#E9B44C" />
      </symbol>
      {/* reusable bright flower: solid petals plus gold center, recolorable */}
      <g id="flower6">
        <g fill="var(--pf,#E58B80)" stroke="var(--ps,#C4675B)" strokeWidth="1">
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(60)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(120)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(180)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(240)" />
          <ellipse cx="0" cy="-8" rx="3.4" ry="6.5" transform="rotate(300)" />
        </g>
        <circle r="3.4" fill="#F2C94C" stroke="#C8A262" strokeWidth="1" />
      </g>
      {/* sprig: bright greens, solid bright blooms, side blooms in bright rosewood */}
      <symbol id="sprig" viewBox="0 0 260 64">
        <g id="spg">
          <path d="M118 55C88 53 58 43 35 21" fill="none" stroke="#6FA45B" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M102 51q-3-11 3-19q8 7 4 19Z" fill="#8CC071" />
          <path d="M82 43q-4-10 0-19q8 6 5 19Z" fill="#A5D189" />
          <path d="M62 33q-5-9-3-18q9 5 8 18Z" fill="#8CC071" />
          <path d="M46 23q-6-8-6-17q10 4 11 17Z" fill="#A5D189" />
        </g>
        <use href="#spg" transform="translate(260 0) scale(-1 1)" />
        <use href="#flower6" transform="translate(34 20) scale(.85)" style={{ '--pf': '#D97F86', '--ps': '#B05A62' }} />
        <use href="#flower6" transform="translate(226 20) scale(.85)" style={{ '--pf': '#D97F86', '--ps': '#B05A62' }} />
        <use href="#flower6" transform="translate(130 27) scale(1.4)" />
        <circle cx="122" cy="56" r="2.2" fill="#E9B44C" />
        <circle cx="138" cy="56" r="2.2" fill="#E9B44C" />
      </symbol>
      <symbol id="tick" viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
    </defs>
  </svg>
)

/* helpers */

const BLANK = { time: '', dep: '', funeralDate: '', gender: '', ribbon: '', colors: '', anyColor: true, size: '', quantities: {}, flowers: '', notes: '', name: '', phone: '', confirm: false }
const SIZES = [
  ['Small', 'Thoughtful tribute'],
  ['Medium', 'Classic tribute'],
  ['Large', 'Full & abundant'],
]

/* Normalise a JSON/array sample field (types, colors, sizes…) into strings —
   the API hands these back either as arrays or as JSON text. */
const asTextList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string' && v.trim()) {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter(Boolean).map(String) : []
    } catch {
      return v.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

/* A picked sample → the shape the booking form + API need. */
const normaliseArrangement = (a) => {
  /* Sample images arrive as [{ url, is_primary, order }] — pick the primary. */
  const list = Array.isArray(a?.images) ? a.images : []
  const sorted = [...list].sort((x, y) => {
    const p = Number(y?.is_primary) - Number(x?.is_primary)
    if (p !== 0) return p
    return (Number(y?.order ?? 0) || 0) - (Number(x?.order ?? 0) || 0)
  })
  const firstUrl = sorted.find(img => typeof img?.url === 'string' && img.url.trim())?.url
    || sorted[0]?.url
    || (typeof a?.image === 'string' ? a.image : '')
    || (typeof a?.img === 'string' ? a.img : '')
    || '';
  return {
    id: a?.arrangement_id || a?.id || '',
    title: a?.title || a?.name || 'Arrangement',
    image: firstUrl,
    types: asTextList(a?.types ?? a?.type),
    colors: asTextList(a?.colors),
    sizes: asTextList(a?.sizes),
  }
}

const nowTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const hh = ((h + 11) % 12) + 1
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}
const localDateKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* main component */

/* The tenant's real logo + name. Reads the session-persisted branding first
   (written at login / by TenantResolver), then the same public settings endpoint
   the postmortem portal uses, and finally degrades to a monogram / sprig. The
   point is that a family sees THEIR funeral home's crest here, never a
   placeholder from someone else's tenant. */
function useFuneralHomeBranding(tenantSlug) {
  const [remote, setRemote] = useState(null)

  useEffect(() => {
    if (!tenantSlug) { setRemote(null); return undefined }
    let cancelled = false
    api.get(`/tenant/${tenantSlug}/settings`, { headers: { 'x-tenant-slug': tenantSlug } })
      .then(res => { if (!cancelled) setRemote(res?.data?.data ?? null) })
      .catch(() => { if (!cancelled) setRemote(null) })   // never break the form
    return () => { cancelled = true }
  }, [tenantSlug])

  return useMemo(() => {
    const stored = getTenantBrandingFromStorage()
    const t = remote || {}
    const name = firstNonEmptyString(t.tenantName, t.name, stored.name)
    const rawLogo = firstNonEmptyString(t.logoUrl, t.logo_url, t.logo, stored.logoUrl)
    return {
      name,
      logoUrl: resolveTenantLogoSrc(rawLogo),
      monogram: (name || 'R').trim().charAt(0).toUpperCase(),
    }
  }, [remote])
}

export default function FlowerSnowBookingForm({ open, onBooked, onClose, selectedArrangements = [], tenantSlug }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)          // 1 arrangement, 2 details, 3 confirmation
  const [form, setForm] = useState(BLANK)
  const [selectedFlowers, setSelectedFlowers] = useState([])
  const [bad, setBad] = useState({})
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [logoBroken, setLogoBroken] = useState(false)
  const [clock, setClock] = useState(() => ({ date: '', time: '' }))

  const branding = useFuneralHomeBranding(tenantSlug)
  const showLogo = !!branding.logoUrl && !logoBroken
  const showMonogram = !showLogo && !!branding.name

  /* Live date/time line on the document header (the reference ticks it every
     30s so a panel left open overnight doesn't show yesterday). */
  useEffect(() => {
    if (!open) return undefined
    const tick = () => {
      const n = new Date()
      setClock({
        date: n.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      })
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [open])

  /* The arrangements the client picked in the gallery. Normalised once so the
     whole flow (display → review → POST) speaks the same shape. */
  const chosen = (Array.isArray(selectedArrangements) ? selectedArrangements : [])
    .map(normaliseArrangement)
    .filter(a => a.id || a.title)
  const flowerOptions = [...new Set(chosen.flatMap(arrangement => arrangement.types))]
  const flowerOptionsKey = flowerOptions.join('|')

  /* autofill the time whenever the panel opens */
  useEffect(() => {
    if (open) {
      const options = flowerOptionsKey ? flowerOptionsKey.split('|') : []
      setForm(f => ({ ...f, time: nowTimeStr(), flowers: '' }))
      setSelectedFlowers(options)
    }
  }, [open, flowerOptionsKey])

  /* Escape closes the panel */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (k) => ({
    value: form[k],
    onChange: (e) => {
      setForm(f => ({ ...f, [k]: e.target.value }))
      setBad(b => ({ ...b, [k]: false }))
    },
  })

  const setPhone = (e) => {
    const raw = e.target.value
    const plus = raw.trim().startsWith('+')
    const d = raw.replace(/\D/g, '').slice(0, 15)
    setForm(f => ({ ...f, phone: (plus ? '+' : '') + d.replace(/(\d{3})(?=\d)/g, '$1 ') }))
    setBad(b => ({ ...b, phone: false }))
  }

  const toggleSize = (s) => {
    setForm(f => ({ ...f, size: f.size === s ? '' : s }))
  }

  const toggleFlower = (flower) => {
    setSelectedFlowers(current => current.includes(flower)
      ? current.filter(item => item !== flower)
      : [...current, flower])
  }

  const dep = form.dep.trim()

  /* step 1 to step 2: the service time is required */
  const goDetails = () => {
    const b = {}
    if (!form.time) b.time = true
    setBad(prev => ({ ...prev, ...b }))
    if (Object.keys(b).length) return
    setStep(2)
  }

  const submit = async () => {
    const b = {}
    if (form.name.trim().length < 2) b.name = true
    if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim())) b.phone = true
    if (!form.confirm) b.confirm = true
    setBad(prev => ({ ...prev, ...b }))
    if (Object.keys(b).length) {
      // Focus the FIRST offending control so keyboard/screen-reader users are
      // taken straight to it rather than just seeing a red border.
      const target = Object.keys(b)[0]
      const el = document.querySelector(`#f${target.charAt(0).toUpperCase()}${target.slice(1)}`)
        || document.getElementById('fConfirm')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus({ preventScroll: true })
      }
      return
    }
    setSending(true)
    try {
      /* Every picked arrangement travels with the booking. The FIRST one is the
         headline (flower_type) and `arrangement_id` links the row back to the
         sample so the dashboard shows its real photos/colours — every picked
         name is also stamped in [TYPES:a|b] so nothing is ever lost. */
      const clean = s => String(s || '').replace(/\|/g, '/').replace(/[[\]]/g, '').trim()
      const names = chosen.map(c => c.title).filter(Boolean)
      const headline = names[0] || 'Custom Arrangement'
      const bookedDate = localDateKey()
      const flowerNames = [...new Set([
        ...selectedFlowers,
        ...String(form.flowers || '').split(/[\n,]+/).map(item => item.trim()).filter(Boolean),
      ])]
      const preferredColors = form.anyColor
        ? []
        : form.colors.split(/[\n,]+/).map(color => color.trim()).filter(Boolean)
      const lineItems = chosen.map(arrangement => ({
        arrangement_id: arrangement.id || null,
        name: arrangement.title,
        types: arrangement.types.filter(flower => selectedFlowers.includes(flower)),
        colors: preferredColors.length ? preferredColors : arrangement.colors,
        quantity: Math.max(1, Number(form.quantities[arrangement.id]) || 1),
      }))
      const totalQuantity = lineItems.reduce((total, item) => total + item.quantity, 0)
      const notesParts = [
        names.length ? `[TYPES:${names.map(clean).join('|')}]` : '',
        `[WHEN:${bookedDate} ${form.time}]`,
        form.notes.trim() || '',
      ].filter(Boolean).join(' ')

      await api.post('/florist/bookings', {
        arrangement_id: lineItems[0]?.arrangement_id || null,
        arrangement_name: headline.slice(0, 255),
        flower_type: headline.slice(0, 255),
        flower_description: flowerNames.join(', ') || null,
        arrangements: lineItems,
        date: bookedDate,
        funeral_date: form.funeralDate || null,
        deceased_gender: form.gender || null,
        quantity: totalQuantity,
        time: form.time || null,
        deceased_name: dep || null,
        ribbon_color: preferredColors[0] || null,
        primary_color: form.anyColor ? 'Any color (florist choice)' : preferredColors[0] || null,
        accent_color: preferredColors.slice(1).join(', ') || null,
        ribbon_message: form.ribbon.trim() || null,
        size: form.size || null,
        special_instructions: form.notes.trim() || null,
        notes: notesParts || null,
        booked_by: form.name.trim() || null,
        phone: form.phone.trim() || null,
      }, {
        headers: tenantSlug ? { 'x-tenant-slug': tenantSlug } : undefined,
      })
      const ref = 'MH-' + Math.random().toString(36).slice(2, 6).toUpperCase()
      setConfirm({
        ref,
        whenStr: form.time ? fmtTime(form.time) : '',
        size: form.size || '',
        mem: dep ? `Flowers for ${dep}, arranged with care.` : "We'll confirm by phone within two hours.",
      })
      setStep(3)
    } catch (error) {
      notify.error('Submission failed', error.friendlyMessage || 'Failed to submit. Please try again.');
    } finally {
      setSending(false)
    }
  }

  const resetAll = () => {
    setForm({ ...BLANK, time: nowTimeStr() })
    setBad({})
    setConfirm(null)
    setSending(false)
    setStep(1)
    if (onBooked) onBooked()
  }

  /* review rows for step 2 */
  const reviewRows = (() => {
    const names = chosen.map(c => c.title).filter(Boolean)
    return [
      ['Arrangement', names.join(' · ')],
      ['Flowers', [...new Set([...selectedFlowers, ...form.flowers.split(/[\n,]+/).map(item => item.trim()).filter(Boolean)])].join(', ')],
      ['Departed', dep],
      ['Funeral date', form.funeralDate],
      ['Gender', form.gender],
      ['Ready at', form.time ? fmtTime(form.time) : ''],
      ['Color preference', form.anyColor ? "Any color · florist's choice" : form.colors],
      ['Ribbon wording', form.ribbon.trim()],
      ['Size', form.size],
      ['Quantities', chosen.map(c => `${c.title} ×${Math.max(1, Number(form.quantities[c.id]) || 1)}`).join(', ')],
      ['Notes', form.notes.trim()],
    ].filter(r => r[1])
  })()

  const stepClass = (n) =>
    'stp'
    + (n === step ? ' current' : '')
    + (n < step ? ' done' : '')
    + (n <= step && step <= 2 ? ' ln-on' : '')

  return (
    <>
      <div className="fbp-scrim" onClick={onClose} />
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />
      <aside className="fbp-panel" role="dialog" aria-modal="true" aria-label="Flower booking">
        <Snowfall count={8} opacity={0.4} colors={['#E9B7AC', '#F3D3C2', '#EAD3A0', '#C6D4B0']} bounded />
        <div className="watermark" aria-hidden="true">With Sympathy</div>
        <FbSymbols />
        <button className="fbp-close" onClick={onClose} aria-label="Close booking panel">×</button>

        <div className="fbp-scroll">
              <header className="doc-head">
                {/* The REAL funeral home crest: tenant settings first, session
                    branding second, then a monogram, then the sprig. A broken or
                    missing image degrades instead of showing a broken icon. */}
                <div className={'logo-wrap' + (!showLogo && !showMonogram ? ' fallback' : '')}>
                  {showLogo && (
                    <img src={branding.logoUrl} alt={`${branding.name} logo`} onError={() => setLogoBroken(true)} />
                  )}
                  {showMonogram && (
                    <div className="logo-mono" aria-label={branding.name}>{branding.monogram}</div>
                  )}
                  <svg className="sprig" aria-hidden="true"><use href="#sprig" /></svg>
                </div>
                <h1>Flower <em>Booking</em> Request</h1>
                <p className="doc-sub">Hand-arranged · Delivered with grace</p>
                {!confirm && dep && <p className="inmemory">Flowers for {dep}</p>}
                <p className="doc-meta">
                  DATE <b>{clock.date || '—'}</b> &nbsp;·&nbsp; TIME <b>{clock.time || '—'}</b>
                </p>
              </header>
              <div className="doc-rule" />

              {!confirm && (
                <ol className="stepstrip">
                  <li className={step === 1 ? 'cur' : step > 1 ? 'done' : ''} aria-current={step === 1 ? 'step' : undefined}>
                    <i>01</i><span>Arrangement</span>
                  </li>
                  <li className={step === 2 ? 'cur' : ''} aria-current={step === 2 ? 'step' : undefined}>
                    <i>02</i><span>Details</span>
                  </li>
                </ol>
              )}

                <div className="panes">

                  {/* STEP 1: arrangement */}
                  {step === 1 && (
                    <section className="pane active">
                      {/* 01 · SERVICE */}
                      <div className="section">
                        <div className="section-head"><span className="n">01</span><span className="t">Service &amp; Tribute</span></div>

                        <div className="frow">
                          <div className={'field' + (bad.time ? ' bad' : '')}>
                            <label htmlFor="fTime">Ready at <span className="req">*</span></label>
                            <div className={'inwrap' + (form.time ? ' has-val' : '')}>
                              <input type="time" id="fTime" {...set('time')} />
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                            <p className="err">Ready-at time is required</p>
                          </div>
                          <div className="field">
                            <label htmlFor="fFuneralDate">Funeral date <span className="opt">(optional)</span></label>
                            <div className={'inwrap' + (form.funeralDate ? ' has-val' : '')}>
                              <input type="date" id="fFuneralDate" {...set('funeralDate')} />
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                          </div>
                        </div>
                        <p className="autofilled" style={{ marginTop: '-0.7rem', marginBottom: '1.4rem' }}>
                          Set to now. Adjust if the flowers are needed later.
                        </p>

                        <div className="frow">
                          <div className="field">
                            <label htmlFor="fDep">Departed name <span className="opt">(optional)</span></label>
                            <div className={'inwrap' + (form.dep ? ' has-val' : '')}>
                              <input type="text" id="fDep" placeholder="e.g. Mary Wanjiku" autoComplete="off" {...set('dep')} />
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                          </div>
                          <div className="field">
                            <label htmlFor="fGender">Gender <span className="opt">(optional)</span></label>
                            <div className={'inwrap' + (form.gender ? ' has-val' : '')}>
                              <select id="fGender" {...set('gender')}>
                                <option value="">Not specified</option>
                                <option value="Woman">Woman</option>
                                <option value="Man">Man</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                              </select>
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 02 · ARRANGEMENT */}
                      <div className="section">
                        <div className="section-head"><span className="n">02</span><span className="t">Arrangement Details</span></div>

                      {/* The arrangements the client picked in the gallery */}
                      {chosen.length > 0 && (
                        <div className="chosen" role="list">
                          {chosen.map(c => (
                            <div className="chosenRow" key={c.id || c.title} role="listitem">
                              {c.image && <img className="chosenThumb" src={c.image} alt={c.title} />}
                              <div className="chosenInfo">
                                <b>{c.title}</b>
                                <span>{[c.types[0], c.colors.slice(0, 2).join(', '), c.sizes[0]].filter(Boolean).join(' · ') || 'Custom arrangement'}</span>
                              </div>
                              <label className="chosenQty">
                                Qty
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={form.quantities[c.id] || 1}
                                  onChange={event => setForm(current => ({
                                    ...current,
                                    quantities: { ...current.quantities, [c.id]: event.target.value },
                                  }))}
                                  aria-label={`Quantity for ${c.title}`}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="field">
                          <label htmlFor="fFlowers">Flowers</label>
                          {flowerOptions.length > 0 && (
                            <div className="flower-choice-list">
                              {flowerOptions.map(flower => (
                                <label key={flower} className={selectedFlowers.includes(flower) ? 'on' : ''}>
                                  <input type="checkbox" checked={selectedFlowers.includes(flower)} onChange={() => toggleFlower(flower)} />
                                  <span>{flower}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          <div className={'inwrap' + (form.flowers ? ' has-val' : '')}>
                            <input type="text" id="fFlowers" placeholder="e.g. Red Roses, White Lilies, Gypsophila" autoComplete="off" {...set('flowers')} />
                            <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                          </div>
                          <p className="autofilled">Leave blank and the florist will arrange seasonal flowers.</p>
                        </div>

                        <div className="frow">
                          <div className="field">
                            <label htmlFor="fColors">Color preference</label>
                            <label className="any-line">
                              <input type="checkbox" id="fAnyColor" className="sqbox" checked={form.anyColor} onChange={event => setForm(current => ({ ...current, anyColor: event.target.checked }))} />
                              <span>Any color · florist's choice</span>
                            </label>
                            <div className={'inwrap' + (!form.anyColor && form.colors ? ' has-val' : '')}>
                              <input type="text" id="fColors" placeholder="e.g. Deep red, white" autoComplete="off" disabled={form.anyColor} {...set('colors')} />
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                          </div>
                          <div className="field">
                            <label htmlFor="fRibbon">Ribbon wording <span className="opt">(optional)</span></label>
                            <div className={'inwrap' + (form.ribbon ? ' has-val' : '')}>
                              <input type="text" id="fRibbon" placeholder='e.g. "Rest in Peace"' autoComplete="off" {...set('ribbon')} />
                              <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            </div>
                          </div>
                        </div>

                      <div className="field">
                          <label>Size preference <span className="opt">(optional)</span></label>
                          <div className="sizes">
                            {SIZES.map(([s, sub]) => (
                              <button
                                key={s}
                                type="button"
                                className={'sizecard' + (form.size === s ? ' on' : '')}
                                onClick={() => toggleSize(s)}
                                aria-pressed={form.size === s}
                              >
                                <span className="tick"><svg><use href="#tick" /></svg></span>
                                <b>{s}</b>
                                <small>{sub}</small>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="field">
                          <label htmlFor="fNotes">Special design instructions <span className="opt">(optional)</span></label>
                          <div className={'tareawrap' + (form.notes ? ' has-val' : '')}>
                            <textarea id="fNotes" maxLength={300} placeholder="Favourite blooms, colours..." {...set('notes')} />
                            <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                            <span className="counter">{form.notes.length} / 300</span>
                          </div>
                        </div>
                      </div>

                        <div className="actions">
                          <button type="button" className="btn-primary" onClick={goDetails}>
                            Continue
                            <svg className="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          </button>
                        </div>
                    </section>
                  )}

                  {/* STEP 2: review + details */}
                  {step === 2 && (
                    <section className="pane active">
                      <div className="section">
                        <div className="section-head"><span className="n">01</span><span className="t">Review Request</span></div>
                        <dl className="review">
                          {reviewRows.length
                            ? reviewRows.map(([k, v]) => (
                              <div className="rv" key={k}><dt>{k}</dt><dd>{v}</dd></div>
                            ))
                            : <div className="rv"><dt>Arrangement</dt><dd>Standard, florist's choice</dd></div>}
                        </dl>
                      </div>

                      <div className="section">
                        <div className="section-head"><span className="n">02</span><span className="t">Your Details</span></div>

                        <div className={'field' + (bad.name ? ' bad' : '')}>
                          <label htmlFor="fName">Full name <span className="req">*</span></label>
                          <div className={'inwrap' + (form.name ? ' has-val' : '')}>
                            <input type="text" id="fName" autoComplete="name" placeholder="e.g. John Kamau" {...set('name')} />
                            <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                          </div>
                          <p className="err">Please enter your name</p>
                        </div>

                        <div className={'field' + (bad.phone ? ' bad' : '')}>
                          <label htmlFor="fPhone">Phone <span className="req">*</span></label>
                          <div className={'inwrap' + (form.phone ? ' has-val' : '')}>
                            <input type="tel" id="fPhone" autoComplete="tel" inputMode="tel" placeholder="e.g. +254 700 000 000" value={form.phone} onChange={setPhone} />
                            <span className="tickbadge"><svg><use href="#tick" /></svg></span>
                          </div>
                          <p className="err">Enter a valid phone number</p>
                        </div>

                        {/* Confirmation gate — the reference requires an explicit
                            authorisation, so an unreviewed request can never
                            reach the florist. */}
                        <div className={'confirm-block' + (bad.confirm ? ' bad' : form.confirm ? ' checked' : '')}>
                          <label className="confirm-label">
                            <input
                              type="checkbox"
                              id="fConfirm"
                              className="sqbox"
                              checked={form.confirm}
                              onChange={event => {
                                const next = event.target.checked;
                                setForm(current => ({ ...current, confirm: next }));
                                setBad(prev => ({ ...prev, confirm: next ? undefined : prev.confirm }));
                              }}
                            />
                            <span className="confirm-text">
                              I confirm the details above are correct and authorise the florist to proceed with this arrangement.
                            </span>
                          </label>
                          <p className="confirm-err">Please confirm the details are correct to continue</p>
                        </div>
                      </div>

                      <div className="actions">
                        <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                        <button className="btn-primary" type="button" onClick={submit} disabled={sending}>
                          {sending ? <><span className="fbspin" />Submitting…</> : <>Request Booking</>}
                        </button>
                      </div>
                      <p className="formnote">No payment now. We'll confirm by phone.</p>
                    </section>
                  )}

                  {/* CONFIRMATION: heading first, sprig below the button */}
                  {step === 3 && confirm && (
                    <section className="pane active">
                      <div className="conf">
                        <h2>Booking <em>Received</em></h2>
                        <p className="csub">{confirm.mem}</p>
                        <div className="cref">
                          {confirm.ref && <span>Ref · {confirm.ref}</span>}
                          {confirm.whenStr && <span>Ready · {confirm.whenStr}</span>}
                        </div>
                        <div className="conf-meta">
                          {clock.date && <span>Logged · <b>{clock.date}</b></span>}
                          {confirm.size && <span>Size · <b>{confirm.size.toUpperCase()}</b></span>}
                        </div>
                        <div className="actions">
                          <button type="button" className="btn-primary" onClick={() => {
                            const slug = localStorage.getItem('tenantSlug') || ''
                            navigate(slug ? `/${slug}/receptionist` : '/reception')
                          }}>
                            Done
                          </button>
                        </div>
                        <svg className="sprig" aria-hidden="true"><use href="#sprig" /></svg>
                      </div>
                    </section>
                  )}

                </div>

              <footer className="site-foot">
                <div className="leafmark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F5EFE3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20C4 10.5 10.5 4 20 4c0 9.5-6.5 16-16 16Z" /><path d="M4 20c4-6.5 8.5-10 13-12.5" />
                  </svg>
                </div>
                <p className="tagline">Every farewell, arranged with grace.</p>
                <div className="values">
                  <span>Dignity</span><b>·</b><span>Care</span><b>·</b><span>Respect</span>
                </div>
              </footer>
        </div>
      </aside>
    </>
  )
}