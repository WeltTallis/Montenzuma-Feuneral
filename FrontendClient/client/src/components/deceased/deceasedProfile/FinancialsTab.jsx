import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { todayKey } from '../../../utils/dates/parseDates';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { showToast } from '../../../utils/toast';
import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import { useTenantStore } from '../../../modules/seo/useTenantStore';
import env from '../../../utils/config/env';
import axios from 'axios';

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = ({ d, w = 15, sw = 1.8, style }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    <path d={d} />
  </svg>
);
const IcoCard = (p) => <Ico {...p} d="M2 5h20v14H2z M2 10h20" />;
const IcoReceipt = (p) => <Ico {...p} d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z M9 8h6 M9 12h6" />;
const IcoPrinter = (p) => <Ico {...p} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z" />;
const IcoPlus = (p) => <Ico {...p} d="M12 5v14M5 12h14" sw={2.4} />;
const IcoClose = (p) => <Ico {...p} d="M18 6 6 18M6 6l12 12" />;
const IcoTrash = (p) => <Ico {...p} d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />;
const IcoList = (p) => <Ico {...p} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />;
const IcoPhone = (p) => <Ico {...p} d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />;
const IcoMail = (p) => <Ico {...p} d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M3.4 6.2 12 12.6l8.6-6.4" />;
const IcoPin = (p) => <Ico {...p} d="M20 10.5c0 5.6-8 11.5-8 11.5S4 16.1 4 10.5a8 8 0 1 1 16 0z M12 13.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z" />;
const IcoGlobe = (p) => <Ico {...p} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2.5 12h19 M12 2c2.6 2.6 4 6.1 4 10s-1.4 7.4-4 10c-2.6-2.6-4-6.1-4-10s1.4-7.4 4-10z" />;

// ── Design system ──────────────────────────────────────────────────────────
const FX_CSS = `
.fx-root{
  --ink:#15171A; --bone:#FAF8F4; --white:#FFFFFF;
  --line:#E4E0D8; --line-strong:#9A938A;
  --brass:#A98F6E; --verdigris:#2E7D6B;
  --green:#22C55E; --red:#B03A2E; --gray:#A8A29E;
  --muted:#8A857C; --pen:#2A3670;
  --maroon:#722F37; --maroon-dark:#5C242B;
  --pine:#1A2A27; --pine-light:#24352F; --cream:#E9EBDD;
  --fx-serif:'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --fx-sans: 'Saira', 'Segoe UI', system-ui, Roboto, Arial, sans-serif;
  --fx-mono: ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace;
  color: var(--ink); font-family: var(--fx-sans); line-height: 1.5;
  -webkit-font-smoothing: antialiased; overflow-wrap: anywhere;
  background: #ffffff;
  padding: 18px;
  border-radius: 10px;
}
.fx-root *, .fx-root *::before, .fx-root *::after{ box-sizing: border-box; }
.fx-root img{ max-width:100%; display:block; }
.fx-root button{ cursor:pointer; background:none; border:0; font:inherit; color:inherit; }
.fx-root input, .fx-root select, .fx-root textarea{ font:inherit; color:inherit; }
.fx-root :focus-visible{ outline:2px solid var(--verdigris); outline-offset:2px; border-radius:4px; }
.fx-hidden{ display:none !important; }
.fx-mono{ font-family:var(--fx-mono); }

.fx-topbar{ background: var(--white); border:1px solid var(--line); border-radius:8px; margin-bottom:20px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.fx-tabs{ display:flex; gap:4px; overflow-x:auto; flex:1; min-width:0; scrollbar-width:none; }
.fx-tabs::-webkit-scrollbar{ display:none; }
.fx-tab{ display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:5px; font-size:.78rem; font-weight:600; color:var(--muted); white-space:nowrap; transition:all .15s; }
.fx-tab:hover{ color:var(--ink); }
.fx-tab.active{ background:var(--ink); color:var(--bone); }
.fx-topbar-side{ display:flex; align-items:center; gap:8px; flex:none; }
.fx-seg{ display:inline-flex; background:var(--bone); border:1px solid var(--line); padding:3px; border-radius:6px; gap:2px; }
.fx-seg button{ padding:4px 10px; border-radius:4px; font-size:.7rem; font-weight:600; color:var(--muted); font-family:var(--fx-mono); letter-spacing:.06em; transition:.15s; }
.fx-seg button.on{ background:var(--ink); color:var(--bone); }
.fx-chip{ font-family:var(--fx-mono); font-size:.68rem; font-weight:600; padding:4px 10px; border-radius:4px; border:1px solid var(--line); color:var(--muted); background:var(--bone); white-space:nowrap; letter-spacing:.05em; }
.fx-chip.ok{ background: rgba(34,197,94,.08); color:#15803D; border-color: rgba(34,197,94,.3); }
.fx-chip.due{ background: rgba(176,58,46,.06); color:var(--red); border-color: rgba(176,58,46,.25); }

.fx-panel{ display:none; }
.fx-panel.active{ display:block; animation:fxFade .25s ease; }
@keyframes fxFade { from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:none; } }

.fx-section-head{ display:flex; align-items:center; gap:12px; margin-bottom:18px; padding:10px 18px; background:var(--ink); border-radius:4px; }
.fx-section-num{ font-family:var(--fx-mono); font-size:.66rem; color:rgba(250,248,244,.4); font-weight:700; }
.fx-section-title{ margin:0; font-family:var(--fx-mono); font-size:.72rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:var(--bone); }

.fx-card{ background:var(--white); border:1px solid var(--line); border-radius:6px; margin-bottom:16px; overflow:hidden; }
.fx-card-body{ padding:18px 20px; }
.fx-card-title{ font-size:.9rem; font-weight:700; margin:0 0 4px; display:flex; align-items:center; gap:8px; color:var(--ink); }
.fx-card-sub{ font-size:.76rem; color:var(--muted); margin:0 0 14px; line-height:1.5; }
.fx-card-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:14px; }

.fx-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px 14px; border-radius:4px; font-size:.76rem; font-weight:600; font-family:var(--fx-sans); letter-spacing:.05em; text-transform:uppercase; border:1px solid transparent; white-space:nowrap; transition:all .15s ease; }
.fx-btn:disabled{ opacity:.55; cursor:not-allowed; }
.fx-btn-primary{ background:var(--maroon); color:var(--bone); border-color:var(--maroon); }
.fx-btn-primary:hover:not(:disabled){ background:var(--maroon-dark); }
.fx-btn-ink{ background:var(--ink); color:var(--bone); border-color:var(--ink); }
.fx-btn-ink:hover:not(:disabled){ background:#2a2d33; }
.fx-btn-ghost{ background:transparent; color:var(--ink); border-color:var(--pine); }
.fx-btn-ghost:hover:not(:disabled){ background:var(--pine); color:var(--bone); }
.fx-icon-btn{ width:28px; height:28px; display:grid; place-items:center; border-radius:4px; color:var(--muted); transition:.15s; }
.fx-icon-btn:hover:not(:disabled){ background:rgba(176,58,46,.08); color:var(--red); }
.fx-icon-btn:disabled{ opacity:.4; cursor:not-allowed; }

.fx-field label{ display:block; font-size:.62rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--brass); margin-bottom:5px; }
.fx-input{ width:100%; padding:8px 10px; border:none; border-bottom:1px dashed var(--line-strong); border-radius:0; background:transparent; font-size:.85rem; color:var(--ink); transition:border-color .15s; }
.fx-input::placeholder{ color:#b9b4aa; }
.fx-input:focus{ outline:none; border-bottom:1px solid var(--verdigris); }
.fx-root select.fx-input{ appearance:none; -webkit-appearance:none; padding-right:26px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%238A857C' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 6px center; }
.fx-form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; }
.fx-form-grid .fx-full{ grid-column:1/-1; }

.fx-table{ width:100%; border-collapse:collapse; font-size:.85rem; }
.fx-table thead th{ text-align:left; font-family:var(--fx-mono); font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); padding:8px 10px; background:var(--bone); border-bottom:1.5px solid var(--ink); white-space:nowrap; }
.fx-table thead th.num, .fx-table thead th.amt{ text-align:right; }
.fx-table tbody td{ padding:10px 10px; border-bottom:1px solid var(--line); vertical-align:top; font-size:.83rem; }
.fx-table tbody tr:last-child td{ border-bottom:none; }
.fx-table td.num{ width:32px; font-family:var(--fx-mono); font-size:.68rem; color:var(--brass); font-weight:700; }
.fx-table td.amt{ text-align:right; font-family:var(--fx-mono); font-weight:600; white-space:nowrap; color:var(--ink); }
.fx-table .item-main{ font-weight:600; color:var(--ink); }
.fx-table .item-sub{ display:block; font-size:.73rem; color:var(--muted); font-weight:400; margin-top:1px; }
.fx-empty{ text-align:center; padding:36px 16px; color:var(--muted); font-size:.85rem; }

.fx-pill{ display:inline-block; font-family:var(--fx-mono); font-size:.64rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:2px 8px; border-radius:3px; white-space:nowrap; }
.fx-pill-cash{ background: rgba(169,143,110,.12); color:var(--brass); }
.fx-pill-mpesa{ background: rgba(46,125,107,.1); color:var(--verdigris); }
.fx-pill-card{ background: rgba(42,54,112,.08); color:var(--pen); }
.fx-pill-bank{ background: rgba(42,54,112,.08); color:var(--pen); }
.fx-pill-insurance{ background: rgba(176,58,46,.08); color:var(--red); }

.fx-picker{ border:1px solid var(--line); border-radius:6px; overflow:hidden; margin-bottom:16px; background:var(--white); }
.fx-pick{ display:grid; grid-template-columns:22px 1fr auto; align-items:flex-start; gap:14px; padding:14px 16px; border-bottom:1px solid var(--line); transition:background .15s; }
.fx-pick:last-child{ border-bottom:none; }
.fx-pick.on{ background: rgba(46,125,107,.04); }
.fx-pick.waived{ background: rgba(168,162,158,.06); }
.fx-pick.added{ background: rgba(21,23,26,.04); opacity:.7; }
.fx-pick-check{ appearance:none; -webkit-appearance:none; width:20px; height:20px; margin-top:2px; border:1.5px solid var(--ink); border-radius:3px; background:var(--white); cursor:pointer; position:relative; flex:none; }
.fx-pick-check:hover{ border-color:var(--verdigris); }
.fx-pick-check:checked{ background:var(--verdigris); border-color:var(--verdigris); }
.fx-pick-check:checked::after{ content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid var(--bone); border-width:0 2.5px 2.5px 0; transform:rotate(45deg); }
.fx-pick-check:disabled{ cursor:not-allowed; opacity:.4; }
.fx-pick-body{ min-width:0; }
.fx-pick-title{ font-weight:700; font-size:.9rem; color:var(--ink); display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
.fx-pick-desc{ font-size:.75rem; color:var(--muted); margin-top:2px; line-height:1.45; }
.fx-pick-amt{ font-family:var(--fx-mono); font-weight:700; font-size:.85rem; color:var(--ink); text-align:right; white-space:nowrap; padding-top:2px; }
.fx-pick.waived .fx-pick-amt{ color:var(--gray); }
.fx-pick.waived .fx-pick-amt s{ color:var(--gray); }
.fx-pick.off .fx-pick-amt{ color:var(--gray); }
.fx-pick.added .fx-pick-amt{ color:var(--muted); font-style:italic; font-weight:600; }
.fx-free{ color:var(--verdigris); font-weight:700; font-size:.7rem; margin-left:6px; }
.fx-qty-chip{ font-family:var(--fx-mono); font-size:.66rem; color:var(--pen); background:rgba(42,54,112,.06); padding:1px 6px; border-radius:3px; font-weight:700; }
.fx-waived-chip{ font-size:.64rem; font-weight:700; color:var(--gray); letter-spacing:.08em; text-transform:uppercase; margin-left:4px; }
.fx-added-chip{ font-size:.6rem; font-weight:700; color:var(--white); background:var(--verdigris); letter-spacing:.08em; text-transform:uppercase; padding:1px 6px; border-radius:3px; margin-left:4px; }

.fx-tier-block{ margin-top:10px; padding:10px 12px; background:var(--bone); border-radius:5px; border:1px solid var(--line); }
.fx-tier-label{ font-family:var(--fx-mono); font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--brass); margin-bottom:8px; }
.fx-tier-row{ display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:6px; }
.fx-tier-opt{ padding:8px 10px; border:1px solid var(--line); border-radius:4px; background:var(--white); cursor:pointer; transition:all .15s; }
.fx-tier-opt:hover{ border-color:var(--brass); }
.fx-tier-opt.active{ border-color:var(--verdigris); background:rgba(46,125,107,.06); box-shadow:0 0 0 1px var(--verdigris) inset; }
.fx-tier-name{ font-size:.72rem; font-weight:700; color:var(--ink); }
.fx-tier-amount{ font-family:var(--fx-mono); font-size:.7rem; color:var(--muted); margin-top:3px; }
.fx-tier-note{ font-size:.72rem; color:var(--muted); margin-top:8px; font-style:italic; }

.fx-custom-inline{ display:flex; align-items:center; gap:8px; margin-top:6px; }
.fx-custom-label{ font-family:var(--fx-mono); font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--brass); min-width:80px; }
.fx-custom-input{ flex:0 0 130px; border:none; outline:none; background:transparent; border-bottom:1px dashed var(--line-strong); padding:2px 4px; font-family:var(--fx-sans); font-size:.85rem; color:var(--pen); font-weight:600; }
.fx-custom-input:focus{ border-bottom:1px solid var(--verdigris); }

.fx-days-input{ width:60px; border:none; outline:none; background:transparent; border-bottom:1px dashed var(--line-strong); padding:2px 4px; font-family:var(--fx-mono); font-size:.95rem; font-weight:700; color:var(--pen); text-align:center; }
.fx-days-input:focus{ border-bottom:1px solid var(--verdigris); }

.fx-waiver-banner{ display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:rgba(46,125,107,.05); border:1px solid rgba(46,125,107,.25); border-radius:6px; margin-bottom:14px; cursor:pointer; user-select:none; transition:background .15s; }
.fx-waiver-banner:hover{ background:rgba(46,125,107,.09); }
.fx-waiver-banner input{ appearance:none; -webkit-appearance:none; width:20px; height:20px; margin-top:1px; border:1.5px solid var(--verdigris); border-radius:3px; background:var(--white); cursor:pointer; position:relative; flex:none; }
.fx-waiver-banner input:checked{ background:var(--verdigris); }
.fx-waiver-banner input:checked::after{ content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid var(--bone); border-width:0 2.5px 2.5px 0; transform:rotate(45deg); }
.fx-waiver-title{ font-weight:700; color:var(--verdigris); font-size:.85rem; }
.fx-waiver-desc{ font-size:.75rem; color:var(--muted); margin-top:3px; line-height:1.5; }

.fx-totals{ margin-top:16px; margin-left:auto; width:100%; max-width:440px; border-top:2px solid var(--ink); }
.fx-totals .row{ display:flex; justify-content:space-between; padding:8px 12px; font-size:.83rem; border-bottom:1px solid var(--line); color:var(--muted); }
.fx-totals .row .amt{ font-family:var(--fx-mono); font-weight:600; color:var(--ink); }
.fx-totals .grand{ border-bottom:none; border-top:1px solid var(--ink); font-size:.95rem; font-weight:800; color:var(--ink); padding-top:10px; margin-top:4px; }
.fx-totals .grand .amt{ color:var(--maroon); }

.fx-note{ margin-top:16px; padding:12px 14px; background:var(--bone); border-left:3px solid var(--brass); font-size:.75rem; color:var(--muted); line-height:1.6; }

.fx-stats{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin-bottom:18px; }
.fx-stat{ padding:14px 16px; border:1px solid var(--line); border-radius:6px; background:var(--white); }
.fx-stat-label{ font-family:var(--fx-mono); font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.fx-stat-val{ font-family:var(--fx-mono); font-size:1.35rem; font-weight:700; margin-top:4px; color:var(--ink); }
.fx-stat-sub{ font-size:.72rem; color:var(--muted); margin-top:2px; }

.fx-statement-wrap{ max-width:900px; margin:0 auto; }
.fx-statement{ background:var(--white); position:relative; overflow:hidden; box-shadow:0 2px 18px rgba(21,23,26,.08); border:1px solid var(--line); }
.fx-watermark{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-family:Georgia, 'Times New Roman', serif; font-weight:800; font-size:clamp(2.4rem,8vw,6rem); letter-spacing:.2em; text-transform:uppercase; white-space:nowrap; color:rgba(21,23,26,.022); pointer-events:none; z-index:0; }
.fx-stmt-content{ position:relative; z-index:1; }

.fx-masthead{ padding:2.2rem clamp(20px,4vw,48px) 1.4rem; border-bottom:1px solid var(--line); }
.fx-mast-main{ display:flex; gap:2rem; justify-content:space-between; flex-wrap:wrap; }
.fx-mast-left{ flex:1 1 340px; min-width:0; }
.fx-mast-right{ flex:0 1 auto; min-width:200px; display:flex; flex-direction:column; align-items:flex-end; gap:1.1rem; }
.fx-letterhead-name{ margin:0; font-size:clamp(1rem,2.4vw,1.25rem); font-weight:700; letter-spacing:.03em; text-transform:uppercase; line-height:1.35; }
.fx-sec-label{ display:block; font-family:var(--fx-mono); font-size:.58rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:var(--brass); margin:1.2rem 0 .45rem; }
.fx-fac-line{ display:flex; align-items:center; gap:.5rem; font-size:.8rem; color:var(--ink); margin:.25rem 0; }
.fx-fac-line svg{ flex:none; color:var(--brass); }
.fx-date-block, .fx-verify-block{ text-align:right; }
.fx-mast-label{ font-family:var(--fx-mono); font-size:.58rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
.fx-mast-value{ font-size:.92rem; font-weight:600; margin-top:.25rem; }
.fx-mast-admno{ font-family:var(--fx-mono); font-size:1.1rem; font-weight:700; letter-spacing:.14em; margin-top:.25rem; }

.fx-branches{ display:grid; grid-template-columns:1fr 1fr 1fr; border-bottom:1px solid var(--line); background:var(--bone); }
.fx-branch{ padding:.8rem 1rem; font-family:var(--fx-mono); font-size:.58rem; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); line-height:1.8; text-align:center; }
.fx-branch + .fx-branch{ border-left:1px solid var(--line); }
.fx-branch b{ color:var(--ink); display:block; letter-spacing:.1em; }

.fx-stmt-body{ padding:2rem clamp(20px,4vw,48px) 1.5rem; }
.fx-stmt-title{ margin:0 0 4px; font-size:1.1rem; font-weight:700; letter-spacing:.02em; color:var(--ink); }
.fx-stmt-sub{ font-family:var(--fx-mono); font-size:.62rem; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin-bottom:18px; }

.fx-mem{ text-align:center; padding:18px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); margin-bottom:22px; }
.fx-mem-label{ font-family:var(--fx-mono); font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--brass); margin-bottom:8px; }
.fx-mem-name{ font-family:var(--fx-serif); font-size:1.75rem; font-weight:500; color:var(--ink); }
.fx-mem-dates{ font-family:var(--fx-serif); font-style:italic; font-size:1rem; color:var(--muted); margin-top:2px; }

.fx-summary{ margin-left:auto; width:min(340px,100%); margin-top:18px; }
.fx-summary-row{ display:flex; justify-content:space-between; padding:7px 0; font-size:.85rem; border-bottom:1px solid var(--line); }
.fx-summary-row:last-child{ border-bottom:none; }
.fx-summary-row .val{ font-family:var(--fx-mono); font-weight:600; color:var(--ink); }
.fx-summary-row.total{ border-top:1.5px solid var(--ink); border-bottom:none; margin-top:6px; padding-top:12px; font-weight:800; font-size:.95rem; }
.fx-summary-row.total .val{ font-size:1.15rem; color:var(--maroon); }
.fx-summary-row.paid .val{ color:var(--verdigris); }
.fx-summary-row.balance{ border-top:1px solid var(--line); margin-top:4px; padding-top:10px; font-weight:700; }
.fx-summary-row.balance .val{ color:var(--maroon); }

.fx-paid-seal{ width:96px; height:96px; border:2px solid var(--verdigris); border-radius:50%; color:var(--verdigris); display:flex; align-items:center; justify-content:center; transform:rotate(-14deg); opacity:.85; flex:none; position:relative; margin-left:20px; }
.fx-paid-seal::before{ content:''; position:absolute; inset:5px; border:1px solid var(--verdigris); border-radius:50%; }
.fx-paid-seal-text{ font-family:var(--fx-sans); font-size:1.2rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }

.fx-signatures{ display:grid; grid-template-columns:1fr 1fr; gap:2.4rem; margin-top:2.4rem; }
.fx-sig-block{ text-align:center; }
.fx-sig-line{ border-bottom:1px solid var(--ink); height:34px; margin-bottom:6px; }
.fx-sig-name{ font-family:var(--fx-serif); font-size:1rem; font-weight:500; }
.fx-sig-title{ font-family:var(--fx-mono); font-size:.6rem; text-transform:uppercase; letter-spacing:.15em; color:var(--muted); margin-top:3px; }

.fx-stmt-footer{ text-align:center; margin-top:2rem; padding-top:1.4rem; border-top:1px solid var(--line); }
.fx-stmt-quote{ font-family:var(--fx-serif); font-style:italic; font-size:1rem; color:var(--brass); margin-bottom:6px; }
.fx-stmt-note{ font-family:var(--fx-mono); font-size:.6rem; color:var(--muted); letter-spacing:.16em; text-transform:uppercase; }

.fx-drawer{ position:fixed; inset:0; z-index:1000; display:flex; justify-content:flex-end; background:rgba(21,23,26,.45); animation:fxFade .2s ease; }
.fx-drawer-panel{ width:min(440px,100%); height:100%; display:flex; flex-direction:column; background:var(--white); box-shadow:-12px 0 32px rgba(21,23,26,.18); animation:fxDrawerIn .25s cubic-bezier(.22,.7,.3,1); }
@keyframes fxDrawerIn{ from{ transform:translateX(100%); } to{ transform:translateX(0); } }
.fx-drawer-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:20px 22px 14px; border-bottom:1px solid var(--line); }
.fx-drawer-head h3{ font-size:.95rem; margin:0; display:flex; align-items:center; gap:8px; }
.fx-drawer-head p{ font-size:.75rem; color:var(--muted); margin-top:3px; }
.fx-drawer-body{ flex:1; min-height:0; overflow-y:auto; padding:18px 22px; display:grid; gap:14px; align-content:start; }
.fx-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fx-grid3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.fx-drawer-foot{ display:flex; justify-content:flex-end; gap:8px; padding:14px 22px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid var(--line); background:var(--bone); }

@media (max-width:880px){
  .fx-branches{ grid-template-columns:1fr; }
  .fx-branch + .fx-branch{ border-left:none; border-top:1px solid var(--line); }
  .fx-mast-right{ align-items:flex-start; }
  .fx-date-block, .fx-verify-block{ text-align:left; }
}
@media (max-width:640px){
  .fx-form-grid{ grid-template-columns:1fr; }
  .fx-grid2, .fx-grid3{ grid-template-columns:1fr; }
  .fx-signatures{ grid-template-columns:1fr; gap:1.6rem; }
  .fx-stats{ grid-template-columns:1fr; }
  .fx-pick{ grid-template-columns:22px 1fr; gap:.75rem; }
  .fx-pick-amt{ grid-column:2; text-align:left; }
  .fx-drawer-foot{ flex-direction:column-reverse; }
  .fx-drawer-foot .fx-btn{ width:100%; }
}
@media print{
  @page{ size:A4 portrait; margin:12mm; }
  .fx-root{ background:#fff !important; padding:0 !important; }
  .fx-no-print, .fx-topbar, .fx-drawer, .fx-stats, .fx-picker, .fx-waiver-banner, .fx-totals, .fx-note, .fx-section-head{ display:none !important; }
  .fx-panel{ display:none !important; }
  .fx-panel.fx-print-target{ display:block !important; }
  .fx-statement{ box-shadow:none !important; border:none !important; max-width:none !important; }
  .fx-watermark{ color:rgba(21,23,26,.03) !important; }
}
`;

// ── Helpers ────────────────────────────────────────────────────────────────
const CURRENCIES = ['KES', 'USD'];
const sym = (c) => (c === 'USD' ? '$' : 'KES');
const fmt2 = (a, c) => `${sym(c)} ${Number(a || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt0 = (a, c) => `${sym(c)} ${Math.round(Number(a || 0)).toLocaleString('en-US')}`;
const pad2 = (n) => String(n).padStart(2, '0');

const toDate = (v) => {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.slice(0, 10))) return new Date(`${v.slice(0, 10)}T00:00:00`);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const shortDate = (v) => { const d = toDate(v); return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; };
const longDate = (v) => { const d = toDate(v); return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'; };

const sumBy = (rows, cur, get) => rows
  .filter((r) => (r.currency || 'KES') === cur)
  .reduce((s, r) => s + (parseFloat(get(r)) || 0), 0);

const pillClass = (m) => {
  const k = String(m || '').toLowerCase();
  if (k.includes('m-pesa') || k.includes('mpesa')) return 'fx-pill-mpesa';
  if (k.includes('cash')) return 'fx-pill-cash';
  if (k.includes('card')) return 'fx-pill-card';
  if (k.includes('insur')) return 'fx-pill-insurance';
  return 'fx-pill-bank';
};

// ── Charge catalogue ───────────────────────────────────────────────────────
// defaultOn is now false for ALL items — nothing gets auto-added.
// The user must explicitly tick what applies to this case.
const CHARGE_CATALOGUE = [
  { id: 'embalming', title: 'Embalming', desc: 'Preservation and preparation of the body', type: 'fixed', amount: 8000, charge_type: 'Embalming' },
  { id: 'storage', title: 'Daily Storage', desc: 'Cold-room storage, billed per day held', type: 'daily', amount: 2000, charge_type: 'Daily Storage' },
  { id: 'prep', title: 'Body Preparation & Dressing', desc: 'Washing, grooming and dressing for viewing', type: 'fixed', amount: 2500, charge_type: 'Body Preparation & Dressing' },
  { id: 'facility', title: 'Facility Fee', desc: 'Use of mortuary facilities and equipment', type: 'fixed', amount: 5000, charge_type: 'Facility Fee' },
  {
    id: 'reconstruction', title: 'Body Reconstruction', desc: 'Restoration after trauma / damage — pick a severity tier', type: 'tiered', charge_type: 'Body Reconstruction',
    tiers: [
      { id: 'minor', label: 'Minor', amount: 8000, note: 'Small abrasions, minimal shaping' },
      { id: 'moderate', label: 'Moderate', amount: 18000, note: 'Facial / limb repair, some suturing' },
      { id: 'severe', label: 'Severe', amount: 35000, note: 'Extensive trauma, major restoration' },
      { id: 'custom', label: 'Custom', amount: 0, note: 'Enter the quoted amount' },
    ]
  },
  { id: 'airlift', title: 'Hearse Transfer to JKIA', desc: 'Airlift transport from facility to Jomo Kenyatta Intl.', type: 'fixed', amount: 15000, charge_type: 'Hearse Transfer to JKIA' },
  { id: 'coffin_wrap', title: 'Coffin Wrapping & Packaging', desc: 'Protective wrapping and packaging for transit', type: 'fixed', amount: 15000, charge_type: 'Coffin Wrapping & Packaging' },
  { id: 'embalm_cert', title: 'Embalming Certificate', desc: 'Official certificate for travel / repatriation', type: 'fixed', amount: 10000, waivedBy: 'coffin_bundle', charge_type: 'Embalming Certificate' },
  { id: 'booking', title: 'Booking & Check-in', desc: 'Airline booking and cargo check-in coordination', type: 'fixed', amount: 10000, waivedBy: 'coffin_bundle', charge_type: 'Booking & Check-in' },
  { id: 'seal_cert', title: 'Seal Certificate', desc: 'Tamper-proof seal and certificate', type: 'fixed', amount: 5000, waivedBy: 'coffin_bundle', charge_type: 'Seal Certificate' },
  { id: 'custom', title: 'Custom Charge', desc: 'Any other charge — describe and enter the amount', type: 'custom', charge_type: 'Other' },
];

const tierAmount = (c, tierId, customAmt) => {
  const t = c.tiers?.find((x) => x.id === tierId);
  if (!t) return 0;
  return t.id === 'custom' ? (Number(customAmt) || 0) : t.amount;
};
const lineAmount = (c, daysHeld, tierId, reconCustom, customAmt) => {
  if (c.type === 'fixed') return c.amount;
  if (c.type === 'daily') return c.amount * Math.max(1, Number(daysHeld) || 1);
  if (c.type === 'tiered') return tierAmount(c, tierId, reconCustom);
  if (c.type === 'custom') return Number(customAmt) || 0;
  return 0;
};

// ── Statement details pane ────────────────────────────────────────────────
const StatementDetailsPane = ({ receipt, setField }) => (
  <div className="fx-card fx-no-print">
    <div className="fx-card-body">
      <div className="fx-card-head">
        <div>
          <h3 className="fx-card-title">Statement details</h3>
          <p className="fx-card-sub">These print exactly as typed. Totals are computed live from the bill.</p>
        </div>
      </div>

      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
        <div className="fx-sec-label" style={{ marginTop: 0 }}>Statement</div>
        <div className="fx-form-grid">
          <div className="fx-field"><label htmlFor="dCurrency">Currency</label>
            <select id="dCurrency" className="fx-input" value={receipt.currency} onChange={(e) => setField('currency', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="fx-field"><label htmlFor="dInvoice">Invoice no.</label>
            <input id="dInvoice" className="fx-input" value={receipt.invoice} onChange={(e) => setField('invoice', e.target.value)} />
          </div>
          <div className="fx-field"><label htmlFor="dStmtDate">Statement date</label>
            <input id="dStmtDate" className="fx-input" type="date" value={receipt.stmtDate} onChange={(e) => setField('stmtDate', e.target.value)} />
          </div>
          <div className="fx-field"><label htmlFor="dServiceDate">Service date</label>
            <input id="dServiceDate" className="fx-input" type="date" value={receipt.serviceDate} onChange={(e) => setField('serviceDate', e.target.value)} />
          </div>
          <div className="fx-field fx-full"><label htmlFor="dAdjust">Courtesy adjustment</label>
            <input id="dAdjust" className="fx-input" type="number" min="0" step="any" placeholder="0.00" value={receipt.adjust} onChange={(e) => setField('adjust', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
        <div className="fx-sec-label" style={{ marginTop: 0 }}>Deceased</div>
        <div className="fx-form-grid">
          <div className="fx-field fx-full"><label htmlFor="dDeceased">In loving memory of</label>
            <input id="dDeceased" className="fx-input" value={receipt.deceased} onChange={(e) => setField('deceased', e.target.value)} />
          </div>
          <div className="fx-field fx-full"><label htmlFor="dYears">Years</label>
            <input id="dYears" className="fx-input" value={receipt.years} onChange={(e) => setField('years', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
        <div className="fx-sec-label" style={{ marginTop: 0 }}>Signatories</div>
        <div className="fx-form-grid">
          <div className="fx-field"><label htmlFor="dSigName">Signatory</label><input id="dSigName" className="fx-input" value={receipt.sigName} onChange={(e) => setField('sigName', e.target.value)} /></div>
          <div className="fx-field"><label htmlFor="dSigTitle">Signatory title</label><input id="dSigTitle" className="fx-input" value={receipt.sigTitle} onChange={(e) => setField('sigTitle', e.target.value)} /></div>
          <div className="fx-field"><label htmlFor="dRepName">Authorizing rep.</label><input id="dRepName" className="fx-input" value={receipt.repName} onChange={(e) => setField('repName', e.target.value)} /></div>
          <div className="fx-field"><label htmlFor="dRepTitle">Rep. title</label><input id="dRepTitle" className="fx-input" value={receipt.repTitle} onChange={(e) => setField('repTitle', e.target.value)} /></div>
        </div>
      </div>

      <div>
        <div className="fx-sec-label" style={{ marginTop: 0 }}>Footer</div>
        <div className="fx-field"><label htmlFor="dQuote">Footer quote</label>
          <input id="dQuote" className="fx-input" placeholder="e.g. Thank you for trusting us with your loved one." value={receipt.quote} onChange={(e) => setField('quote', e.target.value)} />
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const FinancialsTab = ({ charges: initialCharges, payments: initialPayments, deceasedId, deceased, onDataChanged, branchSlug, refreshVersion = 0 }) => {
  const [payments, setPayments] = useState(initialPayments || []);
  const [chargeList, setChargeList] = useState(initialCharges || []);
  const [tab, setTab] = useState('charges');
  const [viewCur, setViewCur] = useState('KES');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState(null);
  const [isSubmittingCharges, setIsSubmittingCharges] = useState(false);

  // ── Picker state ───────────────────────────────────────────────────────
  // The picker is a ONE-SHOT "add these" form. Nothing is ticked by default.
  // After a successful submit, the ticked rows are cleared and the catalogue
  // rows that were added are tracked in `addedIds` (so the user can still see
  // them greyed with an "Added" chip and cannot re-add them accidentally —
  // though they CAN use the Custom Charge row any number of times).
  const [selected, setSelected] = useState({});          // { [id]: true }
  const [addedIds, setAddedIds] = useState({});          // { [id]: true } — already on the bill
  const [daysHeld, setDaysHeld] = useState(5);
  const [tierChoice, setTierChoice] = useState('moderate');
  const [reconstructionCustom, setReconstructionCustom] = useState(0);
  const [customAmount, setCustomAmount] = useState(0);
  const [customDesc, setCustomDesc] = useState('');
  const [waiveBundle, setWaiveBundle] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    date: todayKey(), currency: 'KES', payment_method: 'Cash',
    reference: '', amount: '', description: '', insurance_provider: '',
  });

  const { tenantData } = useTenantStore();
  const brand = useMemo(() => resolveTenantBranding(tenantData), [tenantData]);
  const brandEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.displayEmail || '') ? brand.displayEmail : '';
  const org = {
    name: brand.name || '',
    phone: brand.displayPhone || '',
    email: brandEmail,
    address: brand.displayAddress || brand.location || '',
    country: brand.country || '',
    branch: brand.displayBranch || '',
    logoUrl: brand.tenantLogoUrl || '',
  };

  const dName = deceased?.full_name || deceased?.name || deceased?.deceased_name || '';
  const dBirth = deceased?.date_of_birth || deceased?.dob || deceased?.birth_date || '';
  const dDeath = deceased?.date_of_death || deceased?.dod || deceased?.death_date || '';
  const dAdmNo = deceased?.admission_number || deceased?.admission_no || deceased?.admissionNumber || '';
  const yearOf = (v) => { const d = toDate(v); return d ? String(d.getFullYear()) : ''; };
  const lifeYears = (yearOf(dBirth) && yearOf(dDeath)) ? `${yearOf(dBirth)} — ${yearOf(dDeath)}` : '';

  const [receipt, setReceipt] = useState(() => ({
    currency: 'KES',
    invoice: dAdmNo || '',
    adjust: '',
    stmtDate: todayKey(),
    serviceDate: (initialCharges || [])[0]?.service_date || todayKey(),
    deceased: dName,
    years: lifeYears,
    repName: '', repTitle: 'Authorizing Representative',
    sigName: '', sigTitle: '',
    quote: '',
  }));
  const setReceiptField = useCallback((k, v) => setReceipt((p) => ({ ...p, [k]: v })), []);

  useEffect(() => { setChargeList(initialCharges || []); }, [initialCharges]);
  useEffect(() => { setPayments(initialPayments || []); }, [initialPayments]);
  useEffect(() => {
    setReceipt((p) => ({ ...p, deceased: p.deceased || dName, years: p.years || lifeYears, invoice: p.invoice || dAdmNo }));
  }, [dName, lifeYears, dAdmNo]);

  const headers = useCallback(() => ({
    'x-tenant-slug': branchSlug || getTenantSlug(),
    ...(branchSlug ? { 'x-branch-slug': branchSlug, 'x-branch-db': branchSlug } : {}),
    'Authorization': `Bearer ${getAuthToken ? getAuthToken() : localStorage.getItem('token') || localStorage.getItem('authToken') || ''}`,
  }), [branchSlug]);

  const loadPayments = useCallback(async () => {
    if (!deceasedId) return;
    try {
      const res = await axios.get(`${env.FULL_API_URL}/payments/${deceasedId}`, { headers: headers() });
      if (res.data?.success) setPayments(res.data.data || []);
    } catch (error) { console.error('Error loading payments:', error); }
  }, [deceasedId, headers]);
  useEffect(() => { loadPayments(); }, [loadPayments, refreshVersion]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.reference) { showToast.error('Please fill in all required fields'); return; }
    if (paymentForm.payment_method === 'Insurance' && !(paymentForm.insurance_provider || '').trim()) {
      showToast.error('Please enter the name of the insurance provider'); return;
    }
    setIsRecording(true);
    try {
      let userEmail = 'Unknown';
      try { const raw = localStorage.getItem('user'); if (raw) { const u = JSON.parse(raw); userEmail = u.email || u.username || 'Unknown'; } } catch (_) { }
      const res = await axios.post(`${env.FULL_API_URL}/payments`, {
        deceased_id: deceasedId,
        amount: parseFloat(paymentForm.amount),
        currency: paymentForm.currency || 'KES',
        payment_method: paymentForm.payment_method,
        insurance_provider: paymentForm.payment_method === 'Insurance' ? (paymentForm.insurance_provider || '').trim() || null : null,
        reference: paymentForm.reference,
        payment_date: paymentForm.date,
        description: paymentForm.description || null,
        recorded_by: userEmail,
      }, { headers: headers() });
      if (res.data?.success) {
        showToast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        setPaymentForm((p) => ({ ...p, payment_method: 'Cash', reference: '', amount: '', description: '', insurance_provider: '' }));
        await loadPayments();
        if (onDataChanged) onDataChanged();
      }
    } catch (error) { console.error('Error recording payment:', error); showToast.error('Failed to record payment'); }
    finally { setIsRecording(false); }
  };

  // ── Submit ONLY the ticked, not-yet-added rows ─────────────────────────
  const handleSubmitCharges = async (e) => {
    e.preventDefault();
    if (!deceasedId) { showToast.error('Deceased ID missing'); return; }

    // Build the lines from the ticked catalogue rows only.
    // Skip rows already on the bill (addedIds) so re-submits never duplicate.
    // The "custom" row is the ONE exception — it can be added any number of
    // times because each occurrence is a distinct custom charge.
    const lines = CHARGE_CATALOGUE
      .filter((c) => {
        if (!selected[c.id]) return false;
        if (c.type === 'custom') return true;        // allow repeats
        return !addedIds[c.id];                      // skip already-added
      })
      .map((c) => {
        const waived = !!(c.waivedBy && waiveBundle);
        if (waived) return null;
        const amount = lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount);
        if (!amount || amount <= 0) return null;
        let description = c.desc;
        if (c.id === 'storage') description = `Cold-room storage — ${daysHeld} day${daysHeld > 1 ? 's' : ''} @ 2,000/day`;
        if (c.id === 'reconstruction') {
          const t = c.tiers.find((x) => x.id === tierChoice);
          description = `Body reconstruction — ${t?.label || 'Custom'}${tierChoice === 'custom' ? '' : ' severity'}`;
        }
        if (c.id === 'custom') description = customDesc || 'Custom charge';
        return {
          _catalogueId: c.id,
          charge_type: c.charge_type || c.title,
          amount,
          currency: viewCur,
          description,
          service_date: receipt.serviceDate || todayKey(),
        };
      })
      .filter(Boolean);

    if (lines.length === 0) {
      showToast.error('Tick at least one charge with a non-zero amount');
      return;
    }

    setIsSubmittingCharges(true);
    try {
      const created = [];
      const succeededIds = [];
      for (const line of lines) {
        const { _catalogueId, ...payload } = line;
        const res = await axios.post(
          `${env.FULL_API_URL}/charges`,
          { deceased_id: deceasedId, ...payload },
          { headers: headers() },
        );
        if (res.data?.success && res.data.data) {
          created.push(res.data.data);
          if (_catalogueId !== 'custom') succeededIds.push(_catalogueId);
        }
      }
      if (created.length) {
        setChargeList((prev) => [...created, ...prev]);
        // Mark succeeded IDs as "already on the bill" and clear their tick.
        setAddedIds((prev) => {
          const next = { ...prev };
          succeededIds.forEach((id) => { next[id] = true; });
          return next;
        });
        setSelected((prev) => {
          const next = { ...prev };
          succeededIds.forEach((id) => { delete next[id]; });
          delete next.custom;   // reset custom row so it's ready for the next one
          return next;
        });
        // Reset custom-charge inputs so the next custom can be typed fresh
        setCustomAmount(0);
        setCustomDesc('');
        showToast.success(`${created.length} charge${created.length === 1 ? '' : 's'} added to bill`);
        if (onDataChanged) onDataChanged();
      }
    } catch (error) {
      console.error('Error adding charges:', error);
      showToast.error(error.response?.data?.message || error.message || 'Failed to add charges');
    } finally {
      setIsSubmittingCharges(false);
    }
  };

  const handleDeleteCharge = async (chargeId) => {
    if (!window.confirm('Remove this charge from the bill?')) return;
    setDeletingChargeId(chargeId);
    try {
      await axios.delete(`${env.FULL_API_URL}/charges/${chargeId}`, { headers: headers() });
      setChargeList((prev) => prev.filter((c) => (c.charge_id ?? c.id) !== chargeId));
      showToast.success('Charge removed');
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting charge:', error);
      showToast.error(error.response?.data?.message || 'Failed to remove charge');
    } finally { setDeletingChargeId(null); }
  };

  // Derived
  const chargeAmount = (c) => c.amount ?? c.charge_amount;
  const shownPayments = useMemo(() => payments.filter((p) => (p.currency || 'KES') === viewCur), [payments, viewCur]);
  const shownCharges = useMemo(() => chargeList.filter((c) => (c.currency || 'KES') === viewCur), [chargeList, viewCur]);
  const billed = sumBy(chargeList, viewCur, chargeAmount);
  const largest = shownCharges.reduce((m, c) => Math.max(m, Number(chargeAmount(c)) || 0), 0);
  const biggestRow = shownCharges.find((c) => Number(chargeAmount(c)) === largest);

  const dues = CURRENCIES
    .map((c) => ({ c, b: sumBy(chargeList, c, chargeAmount) - sumBy(payments, c, (p) => p.amount) }))
    .filter((r) => r.b > 0.004);

  const rc = receipt.currency;
  const rcItems = chargeList.filter((c) => (c.currency || 'KES') === rc);
  const rcPays = payments.filter((p) => (p.currency || 'KES') === rc);
  const subtotal = sumBy(rcItems, rc, chargeAmount);
  const paid = sumBy(rcPays, rc, (p) => p.amount);
  const adjust = Math.max(0, parseFloat(receipt.adjust) || 0);
  const total = Math.max(0, subtotal - adjust);
  const balance = total - paid;
  const paidMethods = [...new Set(rcPays.map((p) => p.payment_method).filter(Boolean))];
  const monogram = (org.name || 'O').trim().charAt(0).toUpperCase();
  const orgContacts = [
    org.branch ? { Icon: IcoPin, text: org.branch } : null,
    org.address ? { Icon: IcoPin, text: org.address } : null,
    org.phone ? { Icon: IcoPhone, text: org.phone } : null,
    org.email ? { Icon: IcoMail, text: org.email } : null,
    org.country ? { Icon: IcoGlobe, text: org.country } : null,
  ].filter(Boolean);

  // Picker subtotal counts ONLY ticked, not-yet-added rows (with custom
  // exceptions allowed since custom may repeat).
  const pickerLines = CHARGE_CATALOGUE.filter((c) => {
    if (!selected[c.id]) return false;
    if (c.type === 'custom') return true;
    return !addedIds[c.id];
  });
  const pickerSubtotal = pickerLines
    .filter((c) => !(c.waivedBy && waiveBundle))
    .reduce((s, c) => s + lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount), 0);
  const pickerWaived = pickerLines
    .filter((c) => c.waivedBy && waiveBundle)
    .reduce((s, c) => s + lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount), 0);
  const pickerCount = pickerLines.length;

  const payPanelRef = useRef(null);
  useEffect(() => {
    if (!showPaymentModal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowPaymentModal(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => { const first = payPanelRef.current?.querySelector('input, select, button'); if (first) first.focus(); }, 320);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [showPaymentModal]);

  const TABS = [
    { key: 'charges', label: 'Itemized Charges', Icon: IcoReceipt },
    { key: 'receipt', label: 'Generate Receipt', Icon: IcoPrinter },
    { key: 'payments', label: 'Payments', Icon: IcoCard },
  ];

  return (
    <div className="fx-root">
      <style>{FX_CSS}</style>

      {/* Top nav */}
      <div className="fx-topbar fx-no-print">
        <nav className="fx-tabs" role="tablist">
          {TABS.map((t) => {
            const TabIcon = t.Icon;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                className={'fx-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
                <TabIcon w={13} />{t.label}
              </button>
            );
          })}
        </nav>
        <div className="fx-topbar-side">
          <div className="fx-seg">
            {CURRENCIES.map((c) => (
              <button key={c} type="button" className={viewCur === c ? 'on' : ''} onClick={() => setViewCur(c)}>{c}</button>
            ))}
          </div>
          <span className={'fx-chip ' + (dues.length ? 'due' : 'ok')}>
            {dues.length ? dues.map((r) => `${fmt0(r.b, r.c)} due`).join(' · ') : 'Settled'}
          </span>
        </div>
      </div>

      {/* ═══ TAB 1 · ITEMIZED CHARGES ═══ */}
      <section className={'fx-panel' + (tab === 'charges' ? ' active' : '')} role="tabpanel">
        <div className="fx-stats fx-no-print">
          <div className="fx-stat">
            <div className="fx-stat-label">Total billed</div>
            <div className="fx-stat-val">{fmt0(billed, viewCur)}</div>
            <div className="fx-stat-sub">{shownCharges.length} item{shownCharges.length === 1 ? '' : 's'} on the bill</div>
          </div>
          <div className="fx-stat">
            <div className="fx-stat-label">Items on bill</div>
            <div className="fx-stat-val">{shownCharges.length}</div>
            <div className="fx-stat-sub">line items numbered like the statement</div>
          </div>
          <div className="fx-stat">
            <div className="fx-stat-label">Largest item</div>
            <div className="fx-stat-val">{shownCharges.length ? fmt0(largest, viewCur) : '—'}</div>
            <div className="fx-stat-sub">{biggestRow ? (biggestRow.charge_type || 'Charge') : 'no items yet'}</div>
          </div>
        </div>

        <form className="fx-card" onSubmit={handleSubmitCharges} noValidate>
          <div className="fx-card-body">
            <div className="fx-section-head">
              <span className="fx-section-num">01</span>
              <h2 className="fx-section-title">Select the Charges to Apply</h2>
            </div>

            <div className="fx-form-grid" style={{ marginBottom: 16, maxWidth: 420 }}>
              <div className="fx-field">
                <label htmlFor="daysHeld">Days held</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input id="daysHeld" className="fx-days-input" type="number" min="1" value={daysHeld}
                    onChange={(e) => setDaysHeld(Math.max(1, Number(e.target.value) || 1))} />
                  <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>days</span>
                </div>
              </div>
            </div>

            <label className="fx-waiver-banner">
              <input type="checkbox" checked={waiveBundle} onChange={(e) => setWaiveBundle(e.target.checked)} />
              <div style={{ flex: 1 }}>
                <div className="fx-waiver-title">Coffin was purchased from our funeral home</div>
                <div className="fx-waiver-desc">
                  Tick to waive the <strong>Embalming Certificate</strong>, <strong>Booking &amp; Check-in</strong> and <strong>Seal Certificate</strong> charges.
                  Optional — leave unticked if the coffin came from elsewhere.
                </div>
              </div>
            </label>

            <div className="fx-picker">
              {CHARGE_CATALOGUE.map((c) => {
                const isAdded = !!addedIds[c.id] && c.type !== 'custom';
                const on = !!selected[c.id];
                const waived = !!(c.waivedBy && waiveBundle);
                const amount = lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount);
                return (
                  <div key={c.id} className={'fx-pick' + (on ? ' on' : ' off') + (waived ? ' waived' : '') + (isAdded ? ' added' : '')}>
                    <input
                      type="checkbox"
                      className="fx-pick-check"
                      checked={on}
                      disabled={isAdded}
                      onChange={() => {
                        if (isAdded) return;
                        setSelected((p) => ({ ...p, [c.id]: !p[c.id] }));
                      }}
                      aria-label={`Toggle ${c.title}`}
                    />
                    <div className="fx-pick-body">
                      <div className="fx-pick-title">
                        {c.title}
                        {c.type === 'daily' && on && !isAdded && <span className="fx-qty-chip">× {daysHeld} day{daysHeld > 1 ? 's' : ''}</span>}
                        {waived && !isAdded && <span className="fx-waived-chip">— waived</span>}
                        {isAdded && <span className="fx-added-chip">added</span>}
                      </div>
                      <div className="fx-pick-desc">{c.desc}</div>

                      {c.type === 'tiered' && on && !isAdded && (
                        <div className="fx-tier-block">
                          <div className="fx-tier-label">Severity</div>
                          <div className="fx-tier-row">
                            {c.tiers.map((t) => (
                              <label key={t.id} className={'fx-tier-opt' + (tierChoice === t.id ? ' active' : '')}>
                                <input type="radio" name={`tier-${c.id}`} value={t.id} checked={tierChoice === t.id}
                                  onChange={() => setTierChoice(t.id)} style={{ display: 'none' }} />
                                <div className="fx-tier-name">{t.label}</div>
                                <div className="fx-tier-amount">{t.id === 'custom' ? 'Enter amount' : fmt0(t.amount, viewCur)}</div>
                              </label>
                            ))}
                          </div>
                          {tierChoice === 'custom' && (
                            <div className="fx-custom-inline">
                              <label className="fx-custom-label">Quoted amount</label>
                              <input type="number" min="0" step="100" value={reconstructionCustom || ''}
                                onChange={(e) => setReconstructionCustom(Number(e.target.value) || 0)}
                                className="fx-custom-input" placeholder="0" />
                            </div>
                          )}
                          <div className="fx-tier-note">{c.tiers.find((t) => t.id === tierChoice)?.note}</div>
                        </div>
                      )}

                      {c.type === 'custom' && on && (
                        <div style={{ marginTop: 10 }}>
                          <div className="fx-custom-inline">
                            <label className="fx-custom-label">Description</label>
                            <input type="text" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)}
                              className="fx-custom-input" style={{ flex: '1 1 220px' }} placeholder="e.g. Repairs after damage" />
                          </div>
                          <div className="fx-custom-inline">
                            <label className="fx-custom-label">Amount</label>
                            <input type="number" min="0" step="50" value={customAmount || ''}
                              onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
                              className="fx-custom-input" placeholder="0" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="fx-pick-amt">
                      {isAdded
                        ? 'On bill'
                        : !on
                          ? '—'
                          : waived
                            ? <><s>{fmt0(amount, viewCur)}</s><span className="fx-free">FREE</span></>
                            : (c.type === 'custom' || (c.type === 'tiered' && tierChoice === 'custom'))
                              ? (amount > 0 ? fmt0(amount, viewCur) : 'Enter amount')
                              : fmt0(amount, viewCur)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fx-totals">
              <div className="row"><span>Selected charges</span><span className="amt">{pickerCount}</span></div>
              <div className="row"><span>Subtotal</span><span className="amt">{fmt0(pickerSubtotal, viewCur)}</span></div>
              <div className="row"><span>Waived</span><span className="amt">{pickerWaived > 0 ? '− ' + fmt0(pickerWaived, viewCur) : '—'}</span></div>
              <div className="row grand"><span>Total Payable</span><span className="amt">{fmt0(pickerSubtotal, viewCur)}</span></div>
            </div>

            <div className="fx-note">
              <strong>Notes.</strong> Tick only what applies to this case — nothing is added by default.
              Once a charge is added to the bill it turns grey with an “Added” chip and cannot be ticked again.
              The <em>Custom Charge</em> row can be used as many times as needed for one-off items.
              If the coffin was purchased from us, tick the banner above to waive the embalming certificate,
              booking / check-in and seal certificate.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="fx-btn fx-btn-primary" disabled={isSubmittingCharges || pickerCount === 0}>
                <IcoPlus w={13} /> {isSubmittingCharges ? 'Adding…' : `Add ${pickerCount} charge${pickerCount === 1 ? '' : 's'} to bill`}
              </button>
            </div>
          </div>
        </form>

        {/* Existing charges list */}
        <div className="fx-card">
          <div className="fx-card-body">
            <div className="fx-section-head">
              <span className="fx-section-num">02</span>
              <h2 className="fx-section-title">Itemized Charges</h2>
            </div>

            <table className="fx-table">
              <thead>
                <tr><th className="num">#</th><th>Item</th><th>Date</th><th className="amt">Amount</th><th style={{ width: 40 }}></th></tr>
              </thead>
              <tbody>
                {shownCharges.length === 0 && (
                  <tr><td colSpan={5}><div className="fx-empty">No charges billed in {viewCur} yet.</div></td></tr>
                )}
                {shownCharges.map((c, i) => {
                  const cid = c.charge_id ?? c.id;
                  return (
                    <tr key={cid ?? i}>
                      <td className="num">{pad2(i + 1)}</td>
                      <td>
                        <span className="item-main">{c.charge_type || 'Charge'}</span>
                        {c.description && <span className="item-sub">{c.description}</span>}
                      </td>
                      <td>{shortDate(c.service_date)}</td>
                      <td className="amt">{fmt2(chargeAmount(c), c.currency)}</td>
                      <td>
                        <button type="button" className="fx-icon-btn" title="Remove charge" disabled={deletingChargeId === cid} onClick={() => handleDeleteCharge(cid)}>
                          <IcoTrash w={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ TAB 2 · GENERATE RECEIPT ═══ */}
      <section className={'fx-panel fx-print-target' + (tab === 'receipt' ? ' active' : '')} role="tabpanel">
        <div className="fx-card fx-no-print" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="fx-card-title"><IcoPrinter w={15} /> Generate Receipt</h2>
            <p className="fx-card-sub" style={{ margin: 0 }}>A formal Statement of Arrangements, auto-filled live from the bill.</p>
          </div>
          <button type="button" className="fx-btn fx-btn-ink" onClick={() => window.print()}>
            <IcoPrinter w={14} /> Print / Save PDF
          </button>
        </div>

        <div className="fx-statement-wrap">
          <div className="fx-statement">
            <div className="fx-watermark">Official Record</div>
            <div className="fx-stmt-content">
              <header className="fx-masthead">
                <div className="fx-mast-main">
                  <div className="fx-mast-left">
                    <h1 className="fx-letterhead-name">{org.name || 'Montezuma Monalisa Funeral Home Ltd'}</h1>
                    <span className="fx-sec-label">Facility</span>
                    {org.phone && <p className="fx-fac-line"><IcoPhone w={13} sw={2} />{org.phone}</p>}
                    {org.email && <p className="fx-fac-line"><IcoMail w={13} sw={2} />{org.email}</p>}
                    {org.address && <p className="fx-fac-line"><IcoPin w={13} sw={2} />{org.address}</p>}
                  </div>
                  <div className="fx-mast-right">
                    <div className="fx-date-block">
                      <span className="fx-mast-label">Statement Date</span>
                      <div className="fx-mast-value">{longDate(receipt.stmtDate)}</div>
                    </div>
                    <div className="fx-verify-block">
                      <span className="fx-mast-label">Admission No.</span>
                      <div className="fx-mast-admno">{dAdmNo || receipt.invoice || '—'}</div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="fx-branches">
                <div className="fx-branch"><b>MBAGATHI WAY (HEAD OFFICE)</b>Opp. Forces Memorial Hospital<br />Tel: (020) 2346928 / 9</div>
                <div className="fx-branch"><b>CHAPEL OF REST · THIKA ROAD</b>Opp. Shell Kabati<br />Tel: 0726 094 847</div>
                <div className="fx-branch"><b>MACHAKOS BRANCH</b>Opp. Governors Office<br />Tel: (020) 2672677 / 2111904</div>
              </div>

              <div className="fx-stmt-body">
                <h2 className="fx-stmt-title">Statement of Arrangements</h2>
                <div className="fx-stmt-sub">Invoice {receipt.invoice ? `No. ${receipt.invoice}` : '—'} · Service {longDate(receipt.serviceDate)}</div>

                <section className="fx-mem">
                  <div className="fx-mem-label">In Loving Memory Of</div>
                  <div className="fx-mem-name">{receipt.deceased || '—'}</div>
                  {receipt.years ? <div className="fx-mem-dates">{receipt.years}</div> : null}
                </section>

                <table className="fx-table">
                  <thead>
                    <tr><th className="num">#</th><th>Description</th><th className="amt">Amount</th></tr>
                  </thead>
                  <tbody>
                    {rcItems.length === 0 && (<tr><td colSpan={3}><div className="fx-empty">No items billed in {rc} for this statement.</div></td></tr>)}
                    {rcItems.map((c, i) => (
                      <tr key={c.charge_id ?? c.id ?? i}>
                        <td className="num">{pad2(i + 1)}</td>
                        <td>
                          <span className="item-main">{c.charge_type || 'Charge'}</span>
                          {c.description && <span className="item-sub">{c.description}</span>}
                        </td>
                        <td className="amt">{fmt0(chargeAmount(c), rc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, marginTop: 18, flexWrap: 'wrap' }}>
                  {(balance <= 0.004 && paid > 0) && (
                    <div className="fx-paid-seal"><span className="fx-paid-seal-text">Paid</span></div>
                  )}
                  <div className="fx-summary">
                    <div className="fx-summary-row"><span>Subtotal</span><span className="val">{fmt0(subtotal, rc)}</span></div>
                    {adjust > 0 && (<div className="fx-summary-row"><span>Courtesy Adjustment</span><span className="val">— {fmt0(adjust, rc)}</span></div>)}
                    <div className="fx-summary-row total"><span>Total Due</span><span className="val">{fmt0(total, rc)}</span></div>
                    <div className="fx-summary-row paid"><span>Payment Received</span><span className="val">{fmt0(paid, rc)}</span></div>
                    {paidMethods.length > 0 && (
                      <div style={{ textAlign: 'right', fontSize: '.7rem', color: 'var(--muted)', marginTop: -4, marginBottom: 4 }}>{paidMethods.join(' · ')}</div>
                    )}
                    <div className="fx-summary-row balance"><span>Balance Remaining</span><span className="val">{fmt2(Math.max(0, balance), rc)}</span></div>
                  </div>
                </div>

                <div className="fx-signatures">
                  <div className="fx-sig-block">
                    <div className="fx-sig-line" />
                    <div className="fx-sig-name">{receipt.sigName || '—'}</div>
                    <div className="fx-sig-title">{receipt.sigTitle || '—'}</div>
                  </div>
                  <div className="fx-sig-block">
                    <div className="fx-sig-line" />
                    <div className="fx-sig-name">{receipt.repName || '—'}</div>
                    <div className="fx-sig-title">{receipt.repTitle || '—'}</div>
                  </div>
                </div>

                <footer className="fx-stmt-footer">
                  {receipt.quote ? <div className="fx-stmt-quote">“{receipt.quote}”</div> : null}
                  <div className="fx-stmt-note">Official Statement</div>
                </footer>
              </div>
            </div>
          </div>

          <StatementDetailsPane receipt={receipt} setField={setReceiptField} />
        </div>
      </section>

      {/* ═══ TAB 3 · PAYMENTS ═══ */}
      <section className={'fx-panel' + (tab === 'payments' ? ' active' : '')} role="tabpanel">
        <div className="fx-card">
          <div className="fx-card-body">
            <div className="fx-card-head">
              <div>
                <h2 className="fx-card-title"><IcoCard w={15} sw={2} /> Payment History</h2>
                <p className="fx-card-sub">Every payment received, with method and reference.</p>
              </div>
              <button type="button" className="fx-btn fx-btn-ink" onClick={() => setShowPaymentModal(true)}>
                <IcoPlus w={13} /> Record payment
              </button>
            </div>

            <table className="fx-table">
              <thead>
                <tr><th>Date</th><th>Method</th><th>Insurance</th><th>Reference</th><th>Description</th><th className="amt">Amount</th><th>Recorded by</th></tr>
              </thead>
              <tbody>
                {shownPayments.length === 0 && (
                  <tr><td colSpan={7}><div className="fx-empty">No payments recorded in {viewCur} yet.</div></td></tr>
                )}
                {shownPayments.map((p, i) => (
                  <tr key={p.payment_id || p.id || i}>
                    <td>{shortDate(p.payment_date || p.created_at)}</td>
                    <td><span className={'fx-pill ' + pillClass(p.payment_method)}>{p.payment_method || '—'}</span></td>
                    <td>{p.insurance_provider || '—'}</td>
                    <td className="fx-mono" style={{ fontSize: '.74rem' }}>{p.reference || '—'}</td>
                    <td>{p.description || p.notes || '—'}</td>
                    <td className="amt">{fmt2(p.amount, p.currency)}</td>
                    <td style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{p.recorded_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Record payment drawer */}
      {showPaymentModal && (
        <div className="fx-drawer" onClick={() => setShowPaymentModal(false)}>
          <div className="fx-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="fx-pay-title" ref={payPanelRef} onClick={(e) => e.stopPropagation()}>
            <div className="fx-drawer-head">
              <div>
                <h3 id="fx-pay-title"><IcoCard w={15} sw={2} /> Record payment</h3>
                <p>Receipts feed straight into the statement.</p>
              </div>
              <button type="button" className="fx-icon-btn" aria-label="Close" onClick={() => setShowPaymentModal(false)}><IcoClose w={16} /></button>
            </div>
            <form id="fx-pay-form" className="fx-drawer-body" onSubmit={handleRecordPayment} noValidate>
              <div className="fx-grid3">
                <div className="fx-field"><label htmlFor="pDate">Date</label><input id="pDate" className="fx-input" type="date" required value={paymentForm.date} onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))} /></div>
                <div className="fx-field"><label htmlFor="pCurrency">Currency</label><select id="pCurrency" className="fx-input" value={paymentForm.currency} onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="fx-field"><label htmlFor="pMethod">Method</label><select id="pMethod" className="fx-input" value={paymentForm.payment_method} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))}><option>Cash</option><option>M-Pesa</option><option>Card</option><option>Bank Transfer</option><option>Insurance</option></select></div>
              </div>
              {paymentForm.payment_method === 'Insurance' && (
                <div className="fx-field"><label htmlFor="pIns">Name of insurance *</label><input id="pIns" className="fx-input" placeholder="e.g. CIC Insurance, Jubilee, Britam" value={paymentForm.insurance_provider} onChange={(e) => setPaymentForm((p) => ({ ...p, insurance_provider: e.target.value }))} required /></div>
              )}
              <div className="fx-grid2">
                <div className="fx-field"><label htmlFor="pRef">Reference number</label><input id="pRef" className="fx-input" placeholder="e.g. QXR89YU72" required value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} /></div>
                <div className="fx-field"><label htmlFor="pAmount">Amount</label><input id="pAmount" className="fx-input" type="number" min="0" step="any" placeholder="0.00" required value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} /></div>
              </div>
              <div className="fx-field"><label htmlFor="pDesc">Description / notes (optional)</label><input id="pDesc" className="fx-input" placeholder="e.g. Facility fee, coffin, embalming…" value={paymentForm.description} onChange={(e) => setPaymentForm((p) => ({ ...p, description: e.target.value }))} /></div>
            </form>
            <div className="fx-drawer-foot">
              <button type="button" className="fx-btn fx-btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button type="submit" form="fx-pay-form" className="fx-btn fx-btn-primary" disabled={isRecording}>{isRecording ? 'Saving…' : 'Save payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsTab;