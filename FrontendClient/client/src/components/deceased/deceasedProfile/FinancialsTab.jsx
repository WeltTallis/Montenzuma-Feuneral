import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { todayKey } from '../../../utils/dates/parseDates';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { showToast } from '../../../utils/toast';
import { resolveTenantBranding } from '../../../utils/tenantResolver/tenantBranding';
import { useTenantStore } from '../../../modules/seo/useTenantStore';
import env from '../../../utils/config/env';
import axios from 'axios';

//  Icons
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
const IcoTrend = (p) => <Ico {...p} d="M12 3v18M5 8l7-5 7 5" />;
const IcoCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5" /></svg>
);

// ── Design system (unchanged from original) ──────────────────────────────
const FX_CSS = `
.fx-root{
  --fx-bg:#f4f3f0; --fx-paper:#fdfcf9;
  --fx-ink:#111827; --fx-ink-soft:#4b5563; --fx-ink-faint:#9ca3af;
  --fx-line:#e5e7eb; --fx-line-soft:#f1f2f4;
  --fx-accent:#8a6d3b; --fx-accent-dark:#6b522a;
  --fx-green:#10b981; --fx-green-bg:#ecfdf5; --fx-green-grad:#ddefe3;
  --fx-amber:#f59e0b; --fx-amber-bg:#fef3c7; --fx-amber-grad:#f5ead0;
  --fx-blue:#00296B;  --fx-blue-bg:#dbeafe;  --fx-blue-grad:#dbe8f5;
  --fx-brass:#8a6d3b; --fx-brass-bg:#f3ecdd; --fx-brass-grad:#ecdfc6;
  --fx-red:#ef4444;   --fx-red-bg:#fef2f2;
  --fx-radius:10px;
  --fx-shadow-sm:0 1px 2px rgba(17,24,39,.05);
  --fx-shadow-md:0 1px 3px rgba(17,24,39,.06), 0 6px 16px rgba(17,24,39,.06);
  --fx-shadow-paper:0 8px 22px rgba(17,24,39,.06), 0 2px 6px rgba(17,24,39,.04);

  --fx-serif:'Cormorant Garamond', Georgia, serif;
  --fx-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color:var(--fx-ink); font-family:var(--fx-sans); line-height:1.55;
  -webkit-font-smoothing:antialiased; overflow-wrap:anywhere;
}
.fx-root *, .fx-root *::before, .fx-root *::after{ box-sizing:border-box; }
.fx-root img{ max-width:100%; display:block; }
.fx-root button{ cursor:pointer; background:none; border:0; font:inherit; color:inherit; }
.fx-root input, .fx-root select{ font:inherit; color:inherit; }
.fx-root :focus-visible{ outline:2px solid var(--fx-accent); outline-offset:2px; border-radius:4px; }
.fx-root input[type=number]{ appearance:textfield; -moz-appearance:textfield; }
.fx-root input[type=number]::-webkit-outer-spin-button,
.fx-root input[type=number]::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
.fx-hidden{ display:none !important; }

.fx-btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:8px 14px; border-radius:8px; font-size:.8rem; font-weight:600; border:1px solid transparent; white-space:nowrap; transition:background .15s ease, border-color .15s ease; }
.fx-btn:disabled{ opacity:.55; cursor:not-allowed; transform:none !important; }
.fx-btn-primary{ background:var(--fx-ink); color:#fff; border-color:var(--fx-ink); }
.fx-btn-primary:hover:not(:disabled){ background:#1f2937; }
.fx-btn-green{ background:var(--fx-green); color:#fff; border-color:var(--fx-green); }
.fx-btn-green:hover:not(:disabled){ background:#0da271; }
.fx-btn-ghost{ background:#fff; border-color:var(--fx-line); color:var(--fx-ink-soft); }
.fx-btn-ghost:hover:not(:disabled){ border-color:var(--fx-ink-faint); color:var(--fx-ink); background:var(--fx-paper); }
.fx-icon-btn{ width:30px; height:30px; display:grid; place-items:center; border-radius:7px; color:var(--fx-ink-faint); transition:.15s; }
.fx-icon-btn:hover:not(:disabled){ background:var(--fx-red-bg); color:var(--fx-red); }
.fx-icon-btn:disabled{ opacity:.4; cursor:not-allowed; }

.fx-topbar{ position:sticky; top:0; z-index:40; background:rgba(253,252,249,.94); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border-bottom:1px solid var(--fx-line); }
.fx-topbar-inner{ display:flex; align-items:stretch; gap:22px; }
.fx-topbar-label{ display:flex; align-items:center; font-size:.68rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--fx-ink-faint); flex:none; }
.fx-tabs{ display:flex; gap:22px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; flex:1; min-width:0; }
.fx-tabs::-webkit-scrollbar{ display:none; }
.fx-tab{ position:relative; display:inline-flex; align-items:center; gap:7px; height:48px; font-size:.82rem; font-weight:500; color:var(--fx-ink-faint); white-space:nowrap; transition:color .15s; }
.fx-tab::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; border-radius:2px; background:transparent; transition:background .15s; }
.fx-tab:hover{ color:var(--fx-ink); }
.fx-tab.active{ color:var(--fx-ink); font-weight:600; }
.fx-tab.active::after{ background:var(--fx-green); }
.fx-topbar-side{ display:flex; align-items:center; gap:8px; flex:none; }
.fx-seg{ display:inline-flex; background:var(--fx-line-soft); padding:3px; border-radius:8px; gap:3px; }
.fx-seg button{ padding:5px 12px; border-radius:6px; font-size:.74rem; font-weight:600; color:var(--fx-ink-faint); transition:.15s; }
.fx-seg button.on{ background:#fff; color:var(--fx-ink); box-shadow:var(--fx-shadow-sm); }
.fx-chip{ font-size:.7rem; font-weight:600; padding:4px 10px; border-radius:999px; border:1px solid var(--fx-line); color:var(--fx-ink-soft); background:#fff; white-space:nowrap; }
.fx-chip.ok{ background:var(--fx-green-bg); color:#047857; border-color:#a7f3d0; }
.fx-chip.due{ background:var(--fx-amber-bg); color:#b45309; border-color:#fde68a; }

.fx-card{ background:#fff; border:0; border-radius:var(--fx-radius); box-shadow:var(--fx-shadow-md); }
.fx-panel{ display:none; }
.fx-panel.active{ display:block; animation:fxFadeUp .28s ease; }
@keyframes fxFadeUp{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:none; } }
@keyframes fxFadeIn{ from{ opacity:0; } to{ opacity:1; } }
.fx-panel-card{ padding:18px 20px; margin-bottom:20px; }
.fx-panel-head{ display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.fx-panel-head h2{ font-size:.95rem; font-weight:600; display:flex; align-items:center; gap:10px; margin:0; }
.fx-panel-head .fx-sub{ font-size:.78rem; color:var(--fx-ink-faint); margin-top:2px; }
.fx-panel-actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.fx-tile{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; flex:none; color:#fff; }
.fx-tile-green{ background:var(--fx-green); }
.fx-tile-brass{ background:var(--fx-accent); }
.fx-tile-ink{ background:var(--fx-ink); }

.fx-stats{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:20px; }
.fx-stat{ padding:14px 16px; border-radius:var(--fx-radius); border:1px solid var(--fx-line-soft); position:relative; overflow:hidden; background:#fff; box-shadow:var(--fx-shadow-sm); }
.fx-stat::after{ content:""; position:absolute; right:-24px; top:-24px; width:76px; height:76px; border-radius:50%; opacity:.35; }
.fx-stat .fx-stat-ico{ width:28px; height:28px; border-radius:8px; display:grid; place-items:center; margin-bottom:10px; color:#fff; }
.fx-stat-label{ font-size:.62rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--fx-ink-faint); }
.fx-stat-val{ font-family:var(--fx-sans); font-size:1.5rem; font-weight:600; margin-top:2px; line-height:1.15; font-variant-numeric:tabular-nums; }
.fx-stat-sub{ font-size:.74rem; color:var(--fx-ink-faint); margin-top:2px; display:block; }
.fx-stat.brass{ background:linear-gradient(160deg,var(--fx-brass-grad),#fcfaf5); border-color:#e6d9bd; }
.fx-stat.brass::after{ background:var(--fx-brass-bg); }
.fx-stat.brass .fx-stat-ico{ background:var(--fx-brass); }
.fx-stat.brass .fx-stat-val{ color:var(--fx-accent-dark); }
.fx-stat.blue{ background:linear-gradient(160deg,var(--fx-blue-grad),#f8fafd); border-color:#cfdff0; }
.fx-stat.blue::after{ background:var(--fx-blue-bg); }
.fx-stat.blue .fx-stat-ico{ background:var(--fx-blue); }
.fx-stat.blue .fx-stat-val{ color:var(--fx-blue); }
.fx-stat.amber{ background:linear-gradient(160deg,var(--fx-amber-grad),#fdfbf4); border-color:#ecdbb2; }
.fx-stat.amber::after{ background:var(--fx-amber-bg); }
.fx-stat.amber .fx-stat-ico{ background:var(--fx-amber); }
.fx-stat.amber .fx-stat-val{ color:var(--fx-amber); }
.fx-stat.green{ background:linear-gradient(160deg,var(--fx-green-grad),#fbfdfa); border-color:#cfe4d6; }
.fx-stat.green::after{ background:var(--fx-green-bg); }
.fx-stat.green .fx-stat-ico{ background:var(--fx-green); }
.fx-stat.green .fx-stat-val{ color:var(--fx-green); }
`;

const FX_CSS2 = `
.fx-table-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
.fx-root table.fx{ width:100%; border-collapse:collapse; min-width:680px; }
.fx-root table.fx th{ text-align:left; font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--fx-ink-faint); font-weight:600; padding:8px 12px; border-bottom:1px solid var(--fx-line); white-space:nowrap; }
.fx-root table.fx td{ padding:10px 12px; border-bottom:1px solid var(--fx-line-soft); font-size:.83rem; vertical-align:middle; }
.fx-root table.fx tbody tr{ transition:background .12s; }
.fx-root table.fx tbody tr:hover{ background:#f9fafb; }
.fx-root table.fx tbody tr:last-child td{ border-bottom:0; }
.fx-root table.fx th:last-child, .fx-root table.fx td.fx-cell-actions{ text-align:right; }
.fx-root table.fx td.fx-num{ font-family:var(--fx-sans); color:var(--fx-ink-faint); width:40px; font-size:.82rem; }
.fx-root table.fx .fx-item-main{ font-weight:600; font-size:.84rem; }
.fx-root table.fx .fx-item-sub{ display:block; font-size:.72rem; color:var(--fx-ink-faint); font-weight:400; margin-top:1px; }
.fx-root table.fx .fx-money{ font-family:var(--fx-sans); font-size:.92rem; font-weight:600; white-space:nowrap; font-variant-numeric:tabular-nums; }
.fx-root table.fx .fx-muted{ color:var(--fx-ink-faint); }
.fx-root table.fx .fx-ref{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-size:.74rem; letter-spacing:.02em; background:#f9fafb; border:1px solid var(--fx-line-soft); padding:2px 7px; border-radius:6px; white-space:nowrap; }
.fx-root table.fx .fx-by{ max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; vertical-align:middle; color:var(--fx-ink-soft); font-size:.8rem; }
.fx-pill{ display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; font-size:.7rem; font-weight:600; white-space:nowrap; }
.fx-pill .fx-pdot{ width:5px; height:5px; border-radius:50%; background:currentColor; }
.fx-pill-cash{ background:var(--fx-amber-bg); color:#b45309; }
.fx-pill-mpesa{ background:var(--fx-green-bg); color:#047857; }
.fx-pill-card{ background:var(--fx-blue-bg); color:var(--fx-blue); }
.fx-pill-bank{ background:#eef2ff; color:#4338ca; }
.fx-pill-insurance{ background:var(--fx-brass-bg); color:var(--fx-accent-dark); }
.fx-empty{ text-align:center; padding:28px 10px; color:var(--fx-ink-faint); font-size:.83rem; }

.fx-field label{ display:block; font-size:.66rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--fx-ink-soft); margin-bottom:6px; }
.fx-input{ width:100%; padding:9px 12px; border:1px solid var(--fx-line); border-radius:8px; background:#fff; font-size:.85rem; color:var(--fx-ink); transition:border-color .15s, box-shadow .15s; }
.fx-input::placeholder{ color:#b9b4aa; }
.fx-input:focus{ outline:none; border-color:var(--fx-ink); box-shadow:0 0 0 3px rgba(26,26,26,.08); }
.fx-root select.fx-input{ appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%238a8a8a' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:34px; }
.fx-form-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.fx-form-grid .fx-full{ grid-column:1/-1; }
.fx-form-actions{ display:flex; justify-content:flex-end; gap:10px; grid-column:1/-1; margin-top:2px; }
`;

/* Charge picker CSS */
const FX_CSS_PICKER = `
.fx-picker{ border:1px solid var(--fx-line); border-radius:10px; overflow:hidden; margin-bottom:18px; }
.fx-pick{ display:grid; grid-template-columns:24px 1fr auto; align-items:flex-start; gap:1rem; padding:.85rem 1rem; border-bottom:1px solid var(--fx-line-soft); transition:background .15s ease; }
.fx-pick:last-child{ border-bottom:0; }
.fx-pick.on{ background:rgba(16,185,129,.05); }
.fx-pick.waived{ background:rgba(156,163,175,.06); }
.fx-pick-check{ appearance:none; -webkit-appearance:none; width:20px; height:20px; margin-top:3px; border:1.5px solid var(--fx-ink); border-radius:3px; background:#fff; cursor:pointer; position:relative; flex:none; }
.fx-pick-check:hover{ border-color:var(--fx-green); }
.fx-pick-check:checked{ background:var(--fx-green); border-color:var(--fx-green); }
.fx-pick-check:checked::after{ content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid #fff; border-width:0 2.5px 2.5px 0; transform:rotate(45deg); }
.fx-pick-body{ min-width:0; }
.fx-pick-title{ font-weight:700; font-size:.88rem; color:var(--fx-ink); display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
.fx-pick-desc{ font-size:.76rem; color:var(--fx-ink-faint); margin-top:2px; line-height:1.4; }
.fx-pick-amt{ font-family:var(--fx-sans); font-weight:700; font-size:.88rem; color:var(--fx-ink); text-align:right; white-space:nowrap; padding-top:2px; font-variant-numeric:tabular-nums; }
.fx-pick.waived .fx-pick-amt{ color:var(--fx-ink-faint); }
.fx-pick.waived .fx-pick-amt s{ color:var(--fx-ink-faint); }
.fx-pick.off .fx-pick-amt{ color:var(--fx-ink-faint); }
.fx-free{ color:var(--fx-green); font-weight:700; font-size:.72rem; margin-left:6px; }
.fx-qty-chip{ font-family:ui-monospace,monospace; font-size:.68rem; color:#2A3670; background:rgba(42,54,112,.06); padding:1px 6px; border-radius:3px; font-weight:700; }
.fx-waived-chip{ font-size:.66rem; font-weight:700; color:var(--fx-ink-faint); letter-spacing:.08em; text-transform:uppercase; margin-left:4px; }

.fx-tier-block{ margin-top:.7rem; padding:.65rem .75rem; background:var(--fx-bg); border-radius:6px; border:1px solid var(--fx-line-soft); }
.fx-tier-label{ font-size:.62rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--fx-accent); margin-bottom:6px; }
.fx-tier-row{ display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:6px; }
.fx-tier-opt{ padding:7px 9px; border:1px solid var(--fx-line); border-radius:6px; background:#fff; cursor:pointer; transition:all .15s ease; }
.fx-tier-opt:hover{ border-color:var(--fx-accent); }
.fx-tier-opt.active{ border-color:var(--fx-green); background:rgba(16,185,129,.07); box-shadow:0 0 0 1px var(--fx-green) inset; }
.fx-tier-name{ font-size:.72rem; font-weight:700; color:var(--fx-ink); }
.fx-tier-amount{ font-size:.72rem; color:var(--fx-ink-faint); margin-top:2px; font-variant-numeric:tabular-nums; }
.fx-tier-note{ font-size:.72rem; color:var(--fx-ink-faint); margin-top:6px; font-style:italic; }

.fx-custom-inline{ display:flex; align-items:center; gap:8px; margin-top:6px; }
.fx-custom-label{ font-size:.62rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fx-accent); min-width:80px; }
.fx-custom-input{ flex:0 0 130px; border:none; outline:none; background:transparent; border-bottom:1px dashed #9a938a; padding:2px 4px; font-family:inherit; font-size:.85rem; color:#2A3670; font-weight:600; }
.fx-custom-input:focus{ border-bottom:1px solid var(--fx-green); }

.fx-days-input{ width:64px; border:none; outline:none; background:transparent; border-bottom:1px dashed #9a938a; padding:2px 4px; font-family:ui-monospace,monospace; font-size:.95rem; font-weight:700; color:#2A3670; text-align:center; }
.fx-days-input:focus{ border-bottom:1px solid var(--fx-green); }

.fx-waiver-banner{ display:flex; align-items:flex-start; gap:.85rem; padding:.85rem 1rem; background:rgba(16,185,129,.06); border:1px solid rgba(16,185,129,.25); border-radius:8px; margin-bottom:14px; cursor:pointer; user-select:none; transition:background .15s ease; }
.fx-waiver-banner:hover{ background:rgba(16,185,129,.1); }
.fx-waiver-banner input{ appearance:none; -webkit-appearance:none; width:20px; height:20px; margin-top:1px; border:1.5px solid var(--fx-green); border-radius:3px; background:#fff; cursor:pointer; position:relative; flex:none; }
.fx-waiver-banner input:checked{ background:var(--fx-green); }
.fx-waiver-banner input:checked::after{ content:''; position:absolute; left:6px; top:2px; width:5px; height:10px; border:solid #fff; border-width:0 2.5px 2.5px 0; transform:rotate(45deg); }
.fx-waiver-title{ font-weight:700; color:var(--fx-green); font-size:.82rem; }
.fx-waiver-desc{ font-size:.74rem; color:var(--fx-ink-soft); margin-top:3px; line-height:1.5; }

.fx-picker-totals{ margin-top:14px; margin-left:auto; width:100%; max-width:460px; border-top:2px solid var(--fx-ink); }
.fx-picker-totals .row{ display:flex; justify-content:space-between; padding:.55rem .75rem; font-size:.85rem; border-bottom:1px solid var(--fx-line); color:var(--fx-ink-faint); }
.fx-picker-totals .row.amt{ font-family:ui-monospace,monospace; font-weight:700; color:var(--fx-ink); }
.fx-picker-totals .grand{ border-bottom:none; border-top:1px solid var(--fx-ink); font-size:1rem; font-weight:800; color:var(--fx-ink); padding-top:.75rem; margin-top:.25rem; }
.fx-picker-totals .grand .amt{ color:#722F37; }

.fx-picker-note{ margin-top:14px; padding:.75rem 1rem; background:var(--fx-bg); border-left:3px solid var(--fx-accent); font-size:.76rem; color:var(--fx-ink-faint); line-height:1.6; }
`;

const FX_CSS3 = `
.fx-r-layout{ display:grid; grid-template-columns:minmax(0,1fr); gap:26px; align-items:start; }
@media (min-width:1100px){ .fx-r-layout{ grid-template-columns:minmax(0,1fr) 340px; } }
.fx-r-details{ margin-bottom:0 !important; }
.fx-r-details h3{ font-size:.92rem; font-weight:600; margin:0 0 4px; display:flex; align-items:center; gap:9px; }
.fx-r-details .fx-hint{ font-size:.78rem; color:var(--fx-ink-faint); margin:0 0 18px; }
.fx-r-section{ margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid var(--fx-line-soft); }
.fx-r-section:last-child{ margin-bottom:0; padding-bottom:0; border-bottom:0; }
.fx-r-section-title{ font-size:.6rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--fx-accent); margin-bottom:14px; }
.fx-r-live{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin-bottom:18px; }
.fx-r-live-item{ padding:11px 14px; border:1px solid var(--fx-line-soft); border-radius:8px; background:#fff; }
.fx-r-live-label{ display:block; font-size:.62rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--fx-ink-faint); }
.fx-r-live-val{ display:block; font-family:var(--fx-sans); font-size:1.1rem; font-weight:600; margin-top:2px; font-variant-numeric:tabular-nums; }
.fx-r-live-item.ok .fx-r-live-val{ color:#047857; }
.fx-r-live-item.due .fx-r-live-val{ color:#b45309; }
.fx-statement{ width:100%; max-width:900px; margin:0 auto; background:var(--fx-paper); padding:3.6rem 3.4rem; box-shadow:var(--fx-shadow-paper); position:relative; overflow:hidden; animation:fxFadeUp .35s ease; }
.fx-statement .fx-content{ position:relative; z-index:1; }
.fx-statement .fx-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2.8rem; padding-bottom:2rem; border-bottom:2px solid var(--fx-accent); gap:2rem; }
.fx-letterhead{ display:flex; align-items:flex-start; gap:16px; min-width:0; }
.fx-brand-logo{ width:66px; height:66px; border-radius:14px; background:linear-gradient(140deg,#3a3a3a,#151515); color:var(--fx-paper); display:grid; place-items:center; font-family:var(--fx-serif); font-size:1.8rem; font-weight:600; margin-bottom:0; overflow:hidden; flex:none; }
.fx-brand-logo img{ width:100%; height:100%; object-fit:contain; padding:7px; }
.fx-brand-text{ min-width:0; }
.fx-brand-name{ font-family:var(--fx-serif); font-size:1.35rem; font-weight:600; letter-spacing:.02em; margin-bottom:.45rem; }
.fx-address{ font-size:.85rem; color:var(--fx-ink-soft); line-height:1.65; }
.fx-contact{ display:flex; align-items:flex-start; gap:8px; margin-top:3px; }
.fx-contact svg{ flex:none; margin-top:3px; color:var(--fx-accent); }
.fx-meta-info{ text-align:right; }
.fx-doc-title{ font-family:var(--fx-serif); font-size:1.55rem; font-weight:500; letter-spacing:.05em; margin-bottom:1rem; }
.fx-meta-grid{ display:grid; grid-template-columns:auto 1fr; gap:.2rem 1.4rem; font-size:.8rem; justify-items:start; }
.fx-meta-grid .fx-label{ color:var(--fx-ink-faint); text-transform:uppercase; letter-spacing:.15em; font-size:.62rem; align-self:center; }
.fx-meta-grid .fx-val{ font-weight:500; font-family:var(--fx-serif); font-size:.98rem; }
.fx-memoriam{ text-align:center; margin-bottom:3.4rem; padding:1.8rem 0; border-top:1px solid var(--fx-line); border-bottom:1px solid var(--fx-line); }
.fx-memoriam .fx-label{ font-size:.66rem; letter-spacing:.3em; text-transform:uppercase; color:var(--fx-accent); margin-bottom:.9rem; display:block; }
.fx-memoriam .fx-name{ font-family:var(--fx-serif); font-size:2rem; font-weight:500; margin-bottom:.2rem; }
.fx-memoriam .fx-dates{ font-family:var(--fx-serif); font-style:italic; font-size:1.1rem; color:var(--fx-ink-soft); }
.fx-root table.fx-items{ width:100%; border-collapse:collapse; margin-bottom:2.6rem; min-width:0; }
.fx-root table.fx-items thead th{ text-align:left; font-size:.62rem; text-transform:uppercase; letter-spacing:.2em; color:var(--fx-accent); padding:.7rem 0; border-bottom:1px solid var(--fx-accent); font-weight:600; }
.fx-root table.fx-items thead th:last-child{ text-align:right; }
.fx-root table.fx-items tbody td{ padding:1rem 0; border-bottom:1px solid var(--fx-line); vertical-align:top; }
.fx-root table.fx-items td.fx-num{ color:var(--fx-ink-faint); font-size:.82rem; width:44px; font-family:var(--fx-serif); font-style:italic; }
.fx-root table.fx-items td.fx-desc{ font-size:.95rem; font-weight:500; }
.fx-root table.fx-items td.fx-desc .fx-details{ display:block; font-size:.74rem; color:var(--fx-ink-faint); font-weight:300; margin-top:.15rem; }
.fx-root table.fx-items td.fx-amount{ text-align:right; font-family:var(--fx-serif); font-size:1.15rem; font-weight:500; white-space:nowrap; }
.fx-root table.fx-items tbody tr:hover{ background:transparent; }
.fx-root table.fx-items td.fx-items-empty{ text-align:center; color:var(--fx-ink-faint); font-style:italic; font-family:var(--fx-serif); font-size:1rem; padding:1.6rem 0; }
`;

const FX_CSS4 = `
.fx-summary-wrapper{ display:flex; justify-content:flex-end; align-items:center; gap:2.6rem; margin-bottom:3rem; flex-wrap:wrap; }
.fx-summary{ width:min(330px,100%); }
.fx-summary-row{ display:flex; justify-content:space-between; align-items:baseline; gap:1rem; padding:.55rem 0; font-size:.88rem; color:var(--fx-ink-soft); }
.fx-summary-row .fx-val{ font-family:var(--fx-serif); font-size:1.08rem; color:var(--fx-ink); font-weight:500; white-space:nowrap; font-variant-numeric:tabular-nums; }
.fx-summary-row.fx-total{ margin-top:1rem; padding-top:1.3rem; border-top:1px solid var(--fx-accent); }
.fx-summary-row.fx-total .fx-label{ font-family:var(--fx-serif); text-transform:uppercase; font-weight:600; font-size:.9rem; color:var(--fx-ink); letter-spacing:.1em; }
.fx-summary-row.fx-total .fx-val{ font-size:1.75rem; font-weight:700; }
.fx-summary-row.fx-paid .fx-val{ color:var(--fx-accent); }
.fx-paid-methods{ font-size:.68rem; color:var(--fx-ink-faint); text-align:right; margin-top:-2px; letter-spacing:.04em; }
.fx-summary-row.fx-balance .fx-label, .fx-summary-row.fx-balance .fx-val{ color:var(--fx-accent); font-weight:700; }
.fx-paid-seal{ width:104px; height:104px; border:2px solid var(--fx-accent); border-radius:50%; color:var(--fx-accent); display:flex; align-items:center; justify-content:center; transform:rotate(-14deg); opacity:.85; flex:none; position:relative; }
.fx-paid-seal::before{ content:''; position:absolute; inset:5px; border:1px solid var(--fx-accent); border-radius:50%; }
.fx-paid-seal-text{ font-family:var(--fx-sans); font-size:1.35rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
.fx-signatures{ display:grid; grid-template-columns:1fr 1fr; gap:3.5rem; margin-top:3.4rem; }
.fx-sig-block{ text-align:center; }
.fx-sig-line{ border-bottom:1px solid var(--fx-ink); height:38px; margin-bottom:.7rem; }
.fx-sig-name{ font-family:var(--fx-serif); font-size:1.08rem; font-weight:500; }
.fx-sig-title{ font-size:.66rem; text-transform:uppercase; letter-spacing:.15em; color:var(--fx-ink-faint); margin-top:.2rem; }
.fx-statement .fx-footer{ text-align:center; margin-top:4rem; padding-top:2.2rem; border-top:1px solid var(--fx-line); }
.fx-footer-quote{ font-family:var(--fx-serif); font-style:italic; font-size:1.08rem; color:var(--fx-accent); margin-bottom:.9rem; }
.fx-footer-note{ font-size:.66rem; color:var(--fx-ink-faint); letter-spacing:.12em; text-transform:uppercase; }
.fx-bottom-barcode{ margin-top:2.6rem; display:flex; flex-direction:column; align-items:center; }
.fx-barcode{ height:38px; display:flex; align-items:stretch; gap:1px; justify-content:center; }
.fx-bar{ background:#000; }
.fx-barcode-num{ font-size:.72rem; letter-spacing:.22em; color:var(--fx-ink-soft); margin-top:8px; font-weight:600; }
.fx-drawer{ position:fixed; inset:0; z-index:1000; display:flex; justify-content:flex-end; background:rgba(17,24,39,.45); animation:fxFadeIn .2s ease; }
.fx-drawer-panel{ width:min(440px,100%); height:100%; display:flex; flex-direction:column; background:#fff; box-shadow:-12px 0 32px rgba(17,24,39,.16); animation:fxDrawerIn .25s cubic-bezier(.22,.7,.3,1); }
@keyframes fxDrawerIn{ from{ transform:translateX(100%); } to{ transform:translateX(0); } }
.fx-drawer-head{ flex:none; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:20px 22px 14px; border-bottom:1px solid var(--fx-line-soft); }
.fx-drawer-head h3{ font-size:.95rem; display:flex; align-items:center; gap:9px; margin:0; }
.fx-drawer-head p{ font-size:.78rem; color:var(--fx-ink-faint); margin-top:3px; max-width:34ch; }
.fx-drawer-body{ flex:1; min-height:0; overflow-y:auto; padding:18px 22px; display:grid; gap:13px; align-content:start; }
.fx-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fx-grid3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.fx-grid2 .fx-full, .fx-grid3 .fx-full{ grid-column:1/-1; }
.fx-drawer-foot{ flex:none; display:flex; justify-content:flex-end; gap:8px; padding:14px 22px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid var(--fx-line-soft); background:var(--fx-paper); }
.fx-drawer-foot .fx-btn{ min-width:110px; }
`;

const FX_CSS5 = `
@media (max-width:980px){ .fx-statement{ padding:2.8rem 2.2rem; } }
@media (max-width:760px){
  .fx-root table.fx{ min-width:0; }
  .fx-root table.fx thead{ display:none; }
  .fx-root table.fx, .fx-root table.fx tbody{ display:block; }
  .fx-root table.fx tbody tr{ display:block; border:1px solid var(--fx-line); border-radius:12px; padding:6px 16px; margin-bottom:12px; background:#fff; }
  .fx-root table.fx tbody tr:hover{ background:#fff; }
  .fx-root table.fx td{ display:flex; align-items:center; justify-content:space-between; gap:14px; padding:10px 0; border-bottom:1px solid var(--fx-line-soft); text-align:right; }
  .fx-root table.fx td::before{ content:attr(data-label); font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fx-ink-faint); text-align:left; }
  .fx-root table.fx td:last-child{ border-bottom:0; }
  .fx-root table.fx td.fx-num{ display:none; }
  .fx-root table.fx td.fx-cell-user{ justify-content:flex-start; }
  .fx-root table.fx td.fx-cell-user::before, .fx-root table.fx td.fx-cell-actions::before{ display:none; }
  .fx-statement{ padding:2.6rem 1.6rem; }
  .fx-statement .fx-header{ flex-direction:column; }
  .fx-letterhead{ gap:12px; }
  .fx-brand-logo{ width:54px; height:54px; border-radius:11px; font-size:1.4rem; }
  .fx-brand-logo img{ padding:5px; }
  .fx-brand-name{ font-size:1.15rem; }
  .fx-meta-info{ text-align:left; }
  .fx-signatures{ grid-template-columns:1fr; gap:2.2rem; }
  .fx-memoriam{ margin-bottom:2.2rem; padding:1.3rem 0; }
  .fx-memoriam .fx-name{ font-size:1.5rem; }
  .fx-summary-wrapper{ gap:1.6rem; }
  .fx-summary{ width:100%; }
  .fx-summary-row.fx-total .fx-val{ font-size:1.5rem; }
  .fx-pick{ grid-template-columns:24px 1fr; gap:.75rem; }
  .fx-pick-amt{ grid-column:2; text-align:left; }
}
@media (max-width:640px){
  .fx-form-grid{ grid-template-columns:1fr; }
  .fx-grid3{ grid-template-columns:1fr; }
  .fx-panel-card{ padding:18px 16px; }
  .fx-panel-head{ flex-direction:column; align-items:stretch; }
  .fx-panel-actions .fx-btn{ flex:1; }
  .fx-stats{ grid-template-columns:1fr; }
}
@media (max-width:560px){
  .fx-topbar{ padding-top:env(safe-area-inset-top); }
  .fx-topbar-label{ display:none; }
  .fx-topbar-side .fx-chip{ display:none; }
  .fx-tabs{ gap:18px; }
  .fx-btn, .fx-input{ min-height:44px; }
  .fx-root input, .fx-root select{ font-size:16px; }
  .fx-grid2{ grid-template-columns:1fr; }
  .fx-drawer-foot{ flex-direction:column-reverse; }
  .fx-drawer-foot .fx-btn{ width:100%; }
  .fx-form-actions{ flex-direction:column-reverse; }
  .fx-form-actions .fx-btn{ width:100%; }
  .fx-paid-seal{ width:84px; height:84px; }
  .fx-paid-seal-text{ font-size:1.05rem; }
}
@media (prefers-reduced-motion:reduce){
  .fx-root *, .fx-root *::before, .fx-root *::after{ animation-duration:.01ms !important; transition-duration:.01ms !important; }
}
@media print{
  @page{ size:A4; margin:12mm; }
  .fx-root{ background:#fff !important; }
  .fx-no-print, .fx-drawer{ display:none !important; }
  .fx-root .fx-panel{ display:none !important; }
  .fx-root .fx-panel.fx-print-target{ display:block !important; }
  .fx-r-layout{ display:block !important; }
  .fx-statement{ max-width:100% !important; box-shadow:none !important; padding:0 !important; animation:none; }
}
`;

// ── Formatting helpers ─────────────────────────────────────────────────────
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

// ── Charge catalogue (source of truth for prices) ─────────────────────────
const CHARGE_CATALOGUE = [
  { id: 'embalming',    title: 'Embalming',                   desc: 'Preservation and preparation of the body',                 type: 'fixed', amount: 8000,  defaultOn: true,  charge_type: 'Preparation & Restorative Care' },
  { id: 'storage',      title: 'Daily Storage',                desc: 'Cold-room storage, billed per day held',                   type: 'daily', amount: 2000,  defaultOn: true,  charge_type: 'Facilities — Visitation' },
  { id: 'prep',         title: 'Body Preparation & Dressing',  desc: 'Washing, grooming and dressing for viewing',               type: 'fixed', amount: 2500,  defaultOn: true,  charge_type: 'Preparation & Restorative Care' },
  { id: 'facility',     title: 'Facility Fee',                 desc: 'Use of mortuary facilities and equipment',                 type: 'fixed', amount: 5000,  defaultOn: true,  charge_type: 'Facilities — Funeral Ceremony' },
  { id: 'reconstruction', title: 'Body Reconstruction',        desc: 'Restoration after trauma / damage — pick a severity tier', type: 'tiered', defaultOn: false, charge_type: 'Preparation & Restorative Care',
    tiers: [
      { id: 'minor',    label: 'Minor',    amount: 8000,  note: 'Small abrasions, minimal shaping' },
      { id: 'moderate', label: 'Moderate', amount: 18000, note: 'Facial / limb repair, some suturing' },
      { id: 'severe',   label: 'Severe',   amount: 35000, note: 'Extensive trauma, major restoration' },
      { id: 'custom',   label: 'Custom',   amount: 0,     note: 'Enter the quoted amount' },
    ] },
  { id: 'airlift',      title: 'Hearse Transfer to JKIA',       desc: 'Airlift transport from facility to Jomo Kenyatta Intl.', type: 'fixed', amount: 15000, defaultOn: false, charge_type: 'Transportation' },
  { id: 'coffin_wrap',  title: 'Coffin Wrapping & Packaging',   desc: 'Protective wrapping and packaging for transit',            type: 'fixed', amount: 15000, defaultOn: false, charge_type: 'Casket' },
  { id: 'embalm_cert',  title: 'Embalming Certificate',         desc: 'Official certificate for travel / repatriation',           type: 'fixed', amount: 10000, defaultOn: true,  waivedBy: 'coffin_bundle', charge_type: 'Repatriation Documentation' },
  { id: 'booking',      title: 'Booking & Check-in',            desc: 'Airline booking and cargo check-in coordination',          type: 'fixed', amount: 10000, defaultOn: true,  waivedBy: 'coffin_bundle', charge_type: 'Repatriation Documentation' },
  { id: 'seal_cert',    title: 'Seal Certificate',              desc: 'Tamper-proof seal and certificate',                        type: 'fixed', amount: 5000,  defaultOn: true,  waivedBy: 'coffin_bundle', charge_type: 'Repatriation Documentation' },
  { id: 'custom',       title: 'Custom Charge',                 desc: 'Any other charge — describe and enter the amount',         type: 'custom', defaultOn: false, charge_type: 'Other' },
];

const tierAmount = (c, tierId, customAmt) => {
  const t = c.tiers?.find((x) => x.id === tierId);
  if (!t) return 0;
  return t.id === 'custom' ? (Number(customAmt) || 0) : t.amount;
};
const lineAmount = (c, daysHeld, tierId, reconCustom, customAmt) => {
  if (c.type === 'fixed')  return c.amount;
  if (c.type === 'daily')  return c.amount * Math.max(1, Number(daysHeld) || 1);
  if (c.type === 'tiered') return tierAmount(c, tierId, reconCustom);
  if (c.type === 'custom') return Number(customAmt) || 0;
  return 0;
};

// Deterministic barcode bars
const barcodeBars = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < String(seed).length; i++) { h ^= String(seed).charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const rnd = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const widths = [1, 1, 1, 2, 2, 3, 4];
  const out = [];
  for (let i = 0; i < 48; i++) { const w = widths[Math.floor(rnd() * widths.length)]; out.push({ dark: i % 2 === 0, w }); }
  return out;
};

// Statement details editor (unchanged behaviour, rendered as a right-hand pane)
const StatementDetailsPane = ({ receipt, setField }) => (
  <aside className="fx-card fx-panel-card fx-r-details fx-no-print">
    <h3>
      <span className="fx-tile fx-tile-brass"><IcoCard w={16} sw={2} /></span>
      Statement details
    </h3>
    <p className="fx-hint">These print exactly as typed. Totals and the paid seal are computed live from the bill.</p>

    <div className="fx-r-section">
      <div className="fx-r-section-title">Statement</div>
      <div className="fx-form-grid">
        <div className="fx-field">
          <label htmlFor="dCurrency">Currency</label>
          <select id="dCurrency" className="fx-input" value={receipt.currency} onChange={(e) => setField('currency', e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="fx-field">
          <label htmlFor="dInvoice">Invoice no.</label>
          <input id="dInvoice" className="fx-input" value={receipt.invoice} onChange={(e) => setField('invoice', e.target.value)} />
        </div>
        <div className="fx-field">
          <label htmlFor="dStmtDate">Statement date</label>
          <input id="dStmtDate" className="fx-input" type="date" value={receipt.stmtDate} onChange={(e) => setField('stmtDate', e.target.value)} />
        </div>
        <div className="fx-field">
          <label htmlFor="dServiceDate">Service date</label>
          <input id="dServiceDate" className="fx-input" type="date" value={receipt.serviceDate} onChange={(e) => setField('serviceDate', e.target.value)} />
        </div>
        <div className="fx-field fx-full">
          <label htmlFor="dAdjust">Courtesy adjustment</label>
          <input id="dAdjust" className="fx-input" type="number" min="0" step="any" placeholder="0.00" value={receipt.adjust} onChange={(e) => setField('adjust', e.target.value)} />
        </div>
      </div>
    </div>

    <div className="fx-r-section">
      <div className="fx-r-section-title">Deceased</div>
      <div className="fx-form-grid">
        <div className="fx-field fx-full">
          <label htmlFor="dDeceased">In loving memory of</label>
          <input id="dDeceased" className="fx-input" value={receipt.deceased} onChange={(e) => setField('deceased', e.target.value)} />
        </div>
        <div className="fx-field fx-full">
          <label htmlFor="dYears">Years</label>
          <input id="dYears" className="fx-input" value={receipt.years} onChange={(e) => setField('years', e.target.value)} />
        </div>
      </div>
    </div>

    <div className="fx-r-section">
      <div className="fx-r-section-title">Signatories</div>
      <div className="fx-form-grid">
        <div className="fx-field"><label htmlFor="dSigName">Signatory</label><input id="dSigName" className="fx-input" value={receipt.sigName} onChange={(e) => setField('sigName', e.target.value)} /></div>
        <div className="fx-field"><label htmlFor="dSigTitle">Signatory title</label><input id="dSigTitle" className="fx-input" value={receipt.sigTitle} onChange={(e) => setField('sigTitle', e.target.value)} /></div>
        <div className="fx-field"><label htmlFor="dRepName">Authorizing representative</label><input id="dRepName" className="fx-input" value={receipt.repName} onChange={(e) => setField('repName', e.target.value)} /></div>
        <div className="fx-field"><label htmlFor="dRepTitle">Representative title</label><input id="dRepTitle" className="fx-input" value={receipt.repTitle} onChange={(e) => setField('repTitle', e.target.value)} /></div>
      </div>
    </div>

    <div className="fx-r-section">
      <div className="fx-r-section-title">Footer</div>
      <div className="fx-form-grid">
        <div className="fx-field fx-full">
          <label htmlFor="dQuote">Footer quote</label>
          <input id="dQuote" className="fx-input" placeholder="e.g. Thank you for trusting us with your loved one." value={receipt.quote} onChange={(e) => setField('quote', e.target.value)} />
        </div>
      </div>
    </div>
  </aside>
);

// ── Main component ─────────────────────────────────────────────────────────
const FinancialsTab = ({ charges: initialCharges, payments: initialPayments, deceasedId, deceased, onDataChanged, branchSlug, refreshVersion = 0 }) => {
  const [payments, setPayments] = useState(initialPayments || []);
  const [chargeList, setChargeList] = useState(initialCharges || []);
  const [tab, setTab] = useState('payments');
  const [viewCur, setViewCur] = useState('KES');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState(null);
  const [isSubmittingCharges, setIsSubmittingCharges] = useState(false);

  // Charge picker state
  const [selected, setSelected] = useState(() => {
    const s = {};
    CHARGE_CATALOGUE.forEach((c) => { s[c.id] = !!c.defaultOn; });
    return s;
  });
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

  // Branding
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

  // Sync with parent
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

  const loadCharges = useCallback(async () => {
    if (!deceasedId) return;
    try {
      const res = await axios.get(`${env.FULL_API_URL}/charges/${deceasedId}`, { headers: headers() });
      if (res.data?.success) setChargeList(res.data.data || []);
    } catch (error) { console.error('Error loading charges:', error); }
  }, [deceasedId, headers]);

  // ── Payment ─────────────────────────────────────────────────
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.reference) { showToast.error('Please fill in all required fields'); return; }
    if (paymentForm.payment_method === 'Insurance' && !(paymentForm.insurance_provider || '').trim()) {
      showToast.error('Please enter the name of the insurance provider'); return;
    }
    setIsRecording(true);
    try {
      let userEmail = 'Unknown';
      try { const raw = localStorage.getItem('user'); if (raw) { const u = JSON.parse(raw); userEmail = u.email || u.username || 'Unknown'; } } catch (_) {}
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

  // ── Add charges from picker (one row per ticked item) ────────
  const handleSubmitCharges = async (e) => {
    e.preventDefault();
    if (!deceasedId) { showToast.error('Deceased ID missing'); return; }
    const lines = CHARGE_CATALOGUE
      .filter((c) => selected[c.id])
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
          charge_type: c.charge_type || c.title,
          amount,
          currency: viewCur,
          description,
          service_date: receipt.serviceDate || todayKey(),
        };
      })
      .filter(Boolean);

    if (lines.length === 0) { showToast.error('Tick at least one charge with a non-zero amount'); return; }

    setIsSubmittingCharges(true);
    try {
      const created = [];
      for (const line of lines) {
        const res = await axios.post(`${env.FULL_API_URL}/charges`, {
          deceased_id: deceasedId, ...line,
        }, { headers: headers() });
        if (res.data?.success && res.data.data) created.push(res.data.data);
      }
      if (created.length) {
        setChargeList((prev) => [...created, ...prev]);
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

  // ── Derived values ──────────────────────────────────────────
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
  const invoiceCode = `MTZ-${(toDate(receipt.stmtDate)?.getFullYear() || '')}-${receipt.invoice || '0000'}`;
  const bars = useMemo(() => barcodeBars(invoiceCode), [invoiceCode]);
  const monogram = (org.name || 'O').trim().charAt(0).toUpperCase();
  const orgContacts = [
    org.branch ? { Icon: IcoPin, text: org.branch } : null,
    org.address ? { Icon: IcoPin, text: org.address } : null,
    org.phone ? { Icon: IcoPhone, text: org.phone } : null,
    org.email ? { Icon: IcoMail, text: org.email } : null,
    org.country ? { Icon: IcoGlobe, text: org.country } : null,
  ].filter(Boolean);

  // Charge picker totals
  const pickerSubtotal = CHARGE_CATALOGUE
    .filter((c) => selected[c.id] && !(c.waivedBy && waiveBundle))
    .reduce((s, c) => s + lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount), 0);
  const pickerWaived = CHARGE_CATALOGUE
    .filter((c) => selected[c.id] && c.waivedBy && waiveBundle)
    .reduce((s, c) => s + lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount), 0);
  const pickerCount = CHARGE_CATALOGUE.filter((c) => selected[c.id]).length;

  // Payment drawer focus trap
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

  // Stat count-up
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [statNow, setStatNow] = useState({ billed: 0, count: shownCharges.length });
  useEffect(() => {
    const targetBilled = billed; const targetCount = shownCharges.length;
    setStatNow((p) => ({ ...p, billed: targetBilled, count: targetCount }));
    if (prefersReduced) return undefined;
    const t0 = performance.now(); const dur = 550; let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3);
      setStatNow({ billed: targetBilled * e, count: targetCount * e });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [billed, shownCharges.length, prefersReduced]);

  const TABS = [
    { key: 'payments', label: 'Payments', Icon: IcoCard },
    { key: 'charges',  label: 'Itemized Charges', Icon: IcoReceipt },
    { key: 'receipt',  label: 'Generate Receipt', Icon: IcoPrinter },
  ];

  return (
    <div className="fx-root">
      <style>{FX_CSS}</style>
      <style>{FX_CSS2}</style>
      <style>{FX_CSS_PICKER}</style>
      <style>{FX_CSS3}</style>
      <style>{FX_CSS4}</style>
      <style>{FX_CSS5}</style>

      {/* Top bar */}
      <div className="fx-topbar fx-no-print">
        <div className="fx-topbar-inner">
          <span className="fx-topbar-label">Financials</span>
          <nav className="fx-tabs" role="tablist" aria-label="Financials sections">
            {TABS.map((t) => {
              const TabIcon = t.Icon;
              return (
                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                  className={'fx-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
                  <TabIcon w={14} />{t.label}
                </button>
              );
            })}
          </nav>
          <div className="fx-topbar-side">
            <div className="fx-seg" role="group" aria-label="Display currency">
              {CURRENCIES.map((c) => (
                <button key={c} type="button" className={viewCur === c ? 'on' : ''} onClick={() => setViewCur(c)}>{c}</button>
              ))}
            </div>
            <span className={'fx-chip ' + (dues.length ? 'due' : 'ok')}>
              {dues.length ? dues.map((r) => `${fmt0(r.b, r.c)} due`).join(' · ') : 'Account settled'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ TAB 1 · PAYMENTS ═══ */}
      <section className={'fx-panel' + (tab === 'payments' ? ' active' : '')} role="tabpanel">
        <div className="fx-card fx-panel-card">
          <div className="fx-panel-head">
            <div>
              <h2><span className="fx-tile fx-tile-green"><IcoCard w={15} sw={2} /></span>Payment History</h2>
              <p className="fx-sub">Every payment received, with method and reference.</p>
            </div>
            <div className="fx-panel-actions">
              <button type="button" className="fx-btn fx-btn-green" onClick={() => setShowPaymentModal(true)}>
                <IcoPlus w={14} /> Record payment
              </button>
            </div>
          </div>

          <div className="fx-table-scroll">
            <table className="fx">
              <thead>
                <tr><th>Date</th><th>Method</th><th>Insurance</th><th>Reference</th><th>Description</th><th>Amount</th><th>Recorded by</th></tr>
              </thead>
              <tbody>
                {shownPayments.length === 0 && (
                  <tr><td colSpan={7}><div className="fx-empty"><IcoCard w={22} style={{ margin: '0 auto 8px', opacity: .45 }} />No payments recorded in {viewCur} yet.</div></td></tr>
                )}
                {shownPayments.map((p, i) => (
                  <tr key={p.payment_id || p.id || i}>
                    <td data-label="Date">{shortDate(p.payment_date || p.created_at)}</td>
                    <td data-label="Method"><span className={'fx-pill ' + pillClass(p.payment_method)}><span className="fx-pdot" />{p.payment_method || '—'}</span></td>
                    <td data-label="Insurance">{p.insurance_provider || <span className="fx-muted">—</span>}</td>
                    <td data-label="Reference"><span className="fx-ref">{p.reference || '—'}</span></td>
                    <td data-label="Description">{p.description || p.notes || <span className="fx-muted">—</span>}</td>
                    <td data-label="Amount"><span className="fx-money">{fmt2(p.amount, p.currency)}</span></td>
                    <td data-label="Recorded by"><span className="fx-by" title={p.recorded_by || ''}>{p.recorded_by || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ TAB 2 · ITEMIZED CHARGES (picker + table) ═══ */}
      <section className={'fx-panel' + (tab === 'charges' ? ' active' : '')} role="tabpanel">
        <div className="fx-stats">
          <div className="fx-stat brass">
            <div className="fx-stat-ico"><IcoReceipt w={16} sw={2} /></div>
            <span className="fx-stat-label">Total billed</span>
            <div className="fx-stat-val">{fmt0(statNow.billed, viewCur)}</div>
            <span className="fx-stat-sub">{shownCharges.length ? `${shownCharges.length} item${shownCharges.length === 1 ? '' : 's'} on the bill` : 'nothing billed'}</span>
          </div>
          <div className="fx-stat blue">
            <div className="fx-stat-ico"><IcoList w={16} sw={2} /></div>
            <span className="fx-stat-label">Items on bill</span>
            <div className="fx-stat-val">{Math.round(statNow.count)}</div>
            <span className="fx-stat-sub">line items, numbered like the statement</span>
          </div>
          <div className="fx-stat amber">
            <div className="fx-stat-ico"><IcoTrend w={16} sw={2} /></div>
            <span className="fx-stat-label">Largest item</span>
            <div className="fx-stat-val">{shownCharges.length ? fmt0(largest, viewCur) : '—'}</div>
            <span className="fx-stat-sub">{biggestRow ? (biggestRow.charge_type || 'Charge') : 'no items yet'}</span>
          </div>
        </div>

        <form className="fx-card fx-panel-card" onSubmit={handleSubmitCharges} noValidate>
          <div className="fx-panel-head">
            <div>
              <h2><span className="fx-tile fx-tile-brass"><IcoReceipt w={17} sw={2} /></span>Add charges to the bill</h2>
              <p className="fx-sub">Tick what applies to this case. Storage is billed per day held; reconstruction is priced by severity tier.</p>
            </div>
          </div>

          {/* Days held */}
          <div className="fx-form-grid" style={{ marginBottom: 14, maxWidth: 420 }}>
            <div className="fx-field">
              <label htmlFor="daysHeld">Days held</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input id="daysHeld" className="fx-days-input" type="number" min="1" value={daysHeld}
                  onChange={(e) => setDaysHeld(Math.max(1, Number(e.target.value) || 1))} />
                <span style={{ color: 'var(--fx-ink-faint)', fontSize: '.8rem' }}>days</span>
              </div>
            </div>
          </div>

          {/* Waiver banner */}
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

          {/* Charge picker */}
          <div className="fx-picker">
            {CHARGE_CATALOGUE.map((c) => {
              const on = !!selected[c.id];
              const waived = !!(c.waivedBy && waiveBundle);
              const amount = lineAmount(c, daysHeld, tierChoice, reconstructionCustom, customAmount);
              return (
                <div key={c.id} className={'fx-pick' + (on ? ' on' : ' off') + (waived ? ' waived' : '')}>
                  <input type="checkbox" className="fx-pick-check" checked={on} onChange={() => setSelected((p) => ({ ...p, [c.id]: !p[c.id] }))} aria-label={`Toggle ${c.title}`} />
                  <div className="fx-pick-body">
                    <div className="fx-pick-title">
                      {c.title}
                      {c.type === 'daily' && on && <span className="fx-qty-chip">× {daysHeld} day{daysHeld > 1 ? 's' : ''}</span>}
                      {waived && <span className="fx-waived-chip">— waived</span>}
                    </div>
                    <div className="fx-pick-desc">{c.desc}</div>

                    {c.type === 'tiered' && on && (
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
                      <div style={{ marginTop: '.7rem' }}>
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
                    {!on ? '—' : waived
                      ? <><s>{fmt0(amount, viewCur)}</s><span className="fx-free">FREE</span></>
                      : (c.type === 'custom' || (c.type === 'tiered' && tierChoice === 'custom'))
                        ? (amount > 0 ? fmt0(amount, viewCur) : 'Enter amount')
                        : fmt0(amount, viewCur)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fx-picker-totals">
            <div className="row"><span>Selected charges</span><span className="amt">{pickerCount}</span></div>
            <div className="row"><span>Subtotal</span><span className="amt">{fmt0(pickerSubtotal, viewCur)}</span></div>
            <div className="row"><span>Waived</span><span className="amt">{pickerWaived > 0 ? '− ' + fmt0(pickerWaived, viewCur) : '—'}</span></div>
            <div className="row grand"><span>Total Payable</span><span className="amt">{fmt0(pickerSubtotal, viewCur)}</span></div>
          </div>

          <div className="fx-picker-note">
            <strong>Notes.</strong> Every line is optional. Only ticked charges are written to the bill on submit.
            Where the coffin was purchased from us, tick the banner above to waive the embalming certificate,
            booking / check-in and seal certificate.
          </div>

          <div className="fx-form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="fx-btn fx-btn-primary" disabled={isSubmittingCharges}>
              <IcoPlus w={14} /> {isSubmittingCharges ? 'Adding…' : `Add ${pickerCount} charge${pickerCount === 1 ? '' : 's'} to bill`}
            </button>
          </div>
        </form>

        {/* Existing charges table */}
        <div className="fx-card fx-panel-card">
          <div className="fx-panel-head">
            <div>
              <h2><span className="fx-tile fx-tile-brass"><IcoReceipt w={17} sw={2} /></span>Itemized Charges</h2>
              <p className="fx-sub">Every service and item billed to this account.</p>
            </div>
          </div>

          <div className="fx-table-scroll">
            <table className="fx">
              <thead><tr><th /><th>Item</th><th>Date</th><th>Amount</th><th /></tr></thead>
              <tbody>
                {shownCharges.length === 0 && (
                  <tr><td colSpan={5}><div className="fx-empty"><IcoReceipt w={26} style={{ margin: '0 auto 10px', opacity: .5 }} />No charges billed in {viewCur} yet.</div></td></tr>
                )}
                {shownCharges.map((c, i) => {
                  const cid = c.charge_id ?? c.id;
                  return (
                    <tr key={cid ?? i}>
                      <td className="fx-num">{pad2(i + 1)}</td>
                      <td className="fx-cell-user" data-label="Item">
                        <span className="fx-item-main">
                          {c.charge_type || 'Charge'}
                          {c.description && <span className="fx-item-sub">{c.description}</span>}
                        </span>
                      </td>
                      <td data-label="Date">{shortDate(c.service_date)}</td>
                      <td data-label="Amount"><span className="fx-money">{fmt2(chargeAmount(c), c.currency)}</span></td>
                      <td className="fx-cell-actions" data-label="">
                        <button type="button" className="fx-icon-btn" title="Remove charge" disabled={deletingChargeId === cid} onClick={() => handleDeleteCharge(cid)}>
                          <IcoTrash w={15} />
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

      {/* ═══ TAB 3 · GENERATE RECEIPT ═══ */}
      <section className={'fx-panel fx-print-target' + (tab === 'receipt' ? ' active' : '')} role="tabpanel">
        <div className="fx-panel-head fx-no-print">
          <div>
            <h2><span className="fx-tile fx-tile-ink"><IcoPrinter w={17} /></span>Generate Receipt</h2>
            <p className="fx-sub">A formal Statement of Arrangements, auto-filled live from the bill.</p>
          </div>
          <div className="fx-panel-actions">
            <button type="button" className="fx-btn fx-btn-primary" onClick={() => window.print()}>
              <IcoPrinter w={15} /> Print / Save PDF
            </button>
          </div>
        </div>

        <div className="fx-r-layout">
          <div>
            <div className="fx-r-live fx-no-print">
              <div className="fx-r-live-item"><span className="fx-r-live-label">Items</span><span className="fx-r-live-val">{rcItems.length}</span></div>
              <div className="fx-r-live-item"><span className="fx-r-live-label">Billed</span><span className="fx-r-live-val">{fmt0(subtotal, rc)}</span></div>
              <div className="fx-r-live-item ok"><span className="fx-r-live-label">Received</span><span className="fx-r-live-val">{fmt0(paid, rc)}</span></div>
              <div className={'fx-r-live-item' + (balance > 0.004 ? ' due' : ' ok')}><span className="fx-r-live-label">Balance</span><span className="fx-r-live-val">{fmt0(Math.max(0, balance), rc)}</span></div>
            </div>

            <div className="fx-statement">
              <div className="fx-content">
                <header className="fx-header">
                  <div className="fx-letterhead">
                    <div className="fx-brand-logo">{org.logoUrl ? <img src={org.logoUrl} alt="" /> : monogram}</div>
                    <div className="fx-brand-text">
                      <div className="fx-brand-name">{org.name || '—'}</div>
                      <div className="fx-address">
                        {orgContacts.length ? orgContacts.map(({ Icon, text }, i) => (<span className="fx-contact" key={i}><Icon w={12} />{text}</span>)) : <span className="fx-muted">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="fx-meta-info">
                    <div className="fx-doc-title">Statement of Arrangements</div>
                    <div className="fx-meta-grid">
                      <span className="fx-label">Invoice</span><span className="fx-val">{receipt.invoice ? `No. ${receipt.invoice}` : '—'}</span>
                      <span className="fx-label">Date</span><span className="fx-val">{longDate(receipt.stmtDate)}</span>
                      <span className="fx-label">Service</span><span className="fx-val">{longDate(receipt.serviceDate)}</span>
                    </div>
                  </div>
                </header>

                <section className="fx-memoriam">
                  <span className="fx-label">In Loving Memory Of</span>
                  <div className="fx-name">{receipt.deceased || '—'}</div>
                  {receipt.years ? <div className="fx-dates">{receipt.years}</div> : null}
                </section>

                <table className="fx-items">
                  <thead><tr><th>Item</th><th>Description</th><th>Amount</th></tr></thead>
                  <tbody>
                    {rcItems.length === 0 && (<tr><td className="fx-items-empty" colSpan={3}>No items billed in {rc} for this statement.</td></tr>)}
                    {rcItems.map((c, i) => (
                      <tr key={c.charge_id ?? c.id ?? i}>
                        <td className="fx-num">{pad2(i + 1)}</td>
                        <td className="fx-desc">{c.charge_type || 'Charge'}{c.description && <span className="fx-details">{c.description}</span>}</td>
                        <td className="fx-amount">{fmt0(chargeAmount(c), rc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="fx-summary-wrapper">
                  {(balance <= 0.004 && paid > 0) && (<div className="fx-paid-seal"><span className="fx-paid-seal-text">Paid</span></div>)}
                  <div className="fx-summary">
                    <div className="fx-summary-row"><span>Subtotal</span><span className="fx-val">{fmt0(subtotal, rc)}</span></div>
                    {adjust > 0 && (<div className="fx-summary-row"><span>Courtesy Adjustment</span><span className="fx-val">— {fmt0(adjust, rc)}</span></div>)}
                    <div className="fx-summary-row fx-total"><span className="fx-label">Total Due</span><span className="fx-val">{fmt0(total, rc)}</span></div>
                    <div className="fx-summary-row fx-paid"><span>Payment Received</span><span className="fx-val">{fmt0(paid, rc)}</span></div>
                    <div className="fx-paid-methods">{paidMethods.length ? paidMethods.join(' · ') : ''}</div>
                    <div className="fx-summary-row fx-balance"><span className="fx-label">Balance Remaining</span><span className="fx-val">{fmt2(Math.max(0, balance), rc)}</span></div>
                  </div>
                </div>

                <div className="fx-signatures">
                  <div className="fx-sig-block"><div className="fx-sig-line" /><div className="fx-sig-name">{receipt.sigName || '—'}</div><div className="fx-sig-title">{receipt.sigTitle || '—'}</div></div>
                  <div className="fx-sig-block"><div className="fx-sig-line" /><div className="fx-sig-name">{receipt.repName || '—'}</div><div className="fx-sig-title">{receipt.repTitle || '—'}</div></div>
                </div>

                <footer className="fx-footer">
                  {receipt.quote ? <div className="fx-footer-quote">“{receipt.quote}”</div> : null}
                  <div className="fx-footer-note">Official Statement</div>
                </footer>

                <div className="fx-bottom-barcode">
                  <div className="fx-barcode">{bars.map((b, i) => (<span key={i} className={b.dark ? 'fx-bar' : undefined} style={{ width: `${b.w}px` }} />))}</div>
                  <div className="fx-barcode-num">{invoiceCode}</div>
                </div>
              </div>
            </div>
          </div>

          <StatementDetailsPane receipt={receipt} setField={setReceiptField} />
        </div>
      </section>

      {/* Payment side panel */}
      {showPaymentModal && (
        <div className="fx-drawer" onClick={() => setShowPaymentModal(false)}>
          <div className="fx-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="fx-pay-title" ref={payPanelRef} onClick={(e) => e.stopPropagation()}>
            <div className="fx-drawer-head">
              <div>
                <h3 id="fx-pay-title"><span className="fx-tile fx-tile-green"><IcoCard w={15} sw={2} /></span>Record payment</h3>
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
              <button type="submit" form="fx-pay-form" className="fx-btn fx-btn-green" disabled={isRecording}>{isRecording ? 'Saving…' : 'Save payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsTab;