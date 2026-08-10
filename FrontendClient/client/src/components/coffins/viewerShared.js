// ===== Coffin Calendar Shared Styles & Helpers =====
// Used by coffin weekView and horizontalCalendar for consistent styling.

export const HH = 68;
export const MAX_H = 64;

export const dk = (d) => {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const dt = d instanceof Date ? d : new Date(d);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
};

export const ft = (h) => {
  const hr = Math.floor(h), mn = Math.round((h - hr) * 60);
  const ap = hr >= 12 ? 'PM' : 'AM', h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return h12 + ':' + String(mn).padStart(2, '0') + ' ' + ap;
};

export function layout(arr) {
  if (!arr.length) return [];
  return arr.map((b, i) => ({ ...b, _c: i, _t: 1 }));
}

export const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'tag-pe', color: '#D97706' },
  booked: { label: 'Approved', cls: 'tag-bo', color: '#2563EB' },
  approved: { label: 'Approved', cls: 'tag-ar', color: '#2563EB' },
  completed: { label: 'Completed', cls: 'tag-co', color: '#059669' },
  cancelled: { label: 'Cancelled', cls: 'tag-ca', color: '#DC2626' },
  rejected: { label: 'Rejected', cls: 'tag-ou', color: '#DC2626' },
  transferring: { label: 'In Transit', cls: 'tag-tr', color: '#7C3AED' },
  delivered: { label: 'Delivered', cls: 'tag-de', color: '#0D9488' },
};

export const getStatus = (s) => STATUS_MAP[s] || STATUS_MAP.pending;

export const VIEWER_CSS = `
        :root{--bg:#fff;--bg-s:#FAFAFA;--bg-h:#F5F5F5;--bdr:#EEEEEE;--bdr-l:#F0F0F0;--tx:#000;--mt:#888;--dm:#BBB;--gn:#059669;--rd:#DC2626;--bl:#2563EB;--am:#D97706;--pp:#7C3AED;--or:#EA580C;--r:12px;--rs:8px;--sw:440px;--sh:0 4px 16px rgba(0,0,0,.06);--sh-lg:0 12px 40px rgba(0,0,0,.1)}
        .coffin-week-board *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
        .coffin-week-board{height:72vh;min-height:440px;max-height:780px;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);border-radius:var(--r);border:1px solid var(--bdr)}
        @media (max-width:640px){.coffin-week-board{height:62vh;min-height:380px}}
        .coffin-week-header{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--bdr);background:var(--bg-s);position:sticky;top:0;z-index:5}
        .coffin-day-hdr{text-align:center;padding:10px 4px 8px;border-right:1px solid var(--bdr-l)}
        .coffin-day-hdr:last-child{border-right:none}
        .coffin-day-name{font-size:10px;font-weight:700;color:var(--dm);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
        .coffin-day-name.td{color:var(--gn)}
        .coffin-day-num{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:13px;font-weight:700;color:var(--mt)}
        .coffin-day-num.td{background:var(--gn);color:#fff}
        .coffin-week-grid{flex:1;display:grid;grid-template-columns:repeat(7,1fr);overflow-y:auto}
        .coffin-week-grid::-webkit-scrollbar{width:4px}
        .coffin-week-grid::-webkit-scrollbar-track{background:transparent}
        .coffin-week-grid::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
        .coffin-day-col{border-right:1px solid var(--bdr-l);padding:8px;min-height:120px;position:relative;background:var(--bg)}
        .coffin-day-col:last-child{border-right:none}
        .coffin-day-col.today-col{background:var(--bg-s)}
        .coffin-day-col.selected-col{background:var(--bg-h);box-shadow:inset 0 0 0 2px var(--bl)}
        .coffin-empty-day{display:flex;align-items:center;justify-content:center;height:80px;color:var(--dm);font-size:11px;font-weight:600;letter-spacing:.3px}
        .coffin-bcard{background:#fff;border:1px solid var(--bdr);border-radius:8px;padding:8px 10px;margin-bottom:6px;cursor:pointer;transition:all .15s;box-shadow:var(--sh)}
        .coffin-bcard:hover{transform:translateY(-1px);box-shadow:var(--sh-lg);border-color:var(--tx)}
        .coffin-bcard-head{display:flex;justify-content:space-between;align-items:flex-start;gap:4px;margin-bottom:3px}
        .coffin-bcard-client{font-size:11px;font-weight:700;color:var(--tx);line-height:1.3}
        .coffin-bcard-status{font-size:8px;font-weight:700;padding:2px 6px;border-radius:50px;color:#fff;white-space:nowrap;flex-shrink:0}
        .coffin-bcard-meta{font-size:9px;color:var(--mt);line-height:1.4;display:flex;flex-direction:column;gap:1px}
        .coffin-bcard-pay{font-size:8px;font-weight:600;margin-top:3px;display:inline-block;padding:1px 6px;border-radius:50px}
        .coffin-bcard-pay.paid{background:#ecfdf5;color:#059669}
        .coffin-bcard-pay.unpaid{background:#fef2f2;color:#dc2626}
        .coffin-week-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--dm);gap:6px}
        .coffin-week-empty svg{opacity:.25}
        .coffin-week-empty p{font-size:12px;font-weight:600}
        @media(max-width:768px){.coffin-week-grid{font-size:11px}.coffin-bcard{padding:6px 8px}}
`;

export const COFFIN_WEEK_EXTRA = `
        .coffin-detail-panel{background:#fff;border:1px solid var(--bdr);border-radius:var(--r);padding:16px;margin-top:12px}
        .coffin-detail-title{font-size:14px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
        .coffin-detail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
        .coffin-detail-card{background:var(--bg-s);border:1px solid var(--bdr);border-radius:8px;padding:12px;cursor:pointer;transition:all .15s}
        .coffin-detail-card:hover{box-shadow:var(--sh-lg);border-color:var(--tx);transform:translateY(-1px)}
        .coffin-detail-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .coffin-detail-card-client{font-size:12px;font-weight:700;color:var(--tx)}
        .coffin-detail-card-meta{font-size:10px;color:var(--mt);line-height:1.5}
`;
