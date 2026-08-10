// ===== Shared constants, helpers and embeddable stylesheet =====
// Used by the external daily (dailyView.jsx) and weekly (weeklyView.jsx) hearse
// dispatch viewers so both render with identical styling and data rules.

export const HH = 68;

// Maximum height of a booking card (px) - prevents single all-day bookings
// from stretching the whole grid; cards cap at about one hour slot.
export const MAX_H = 64;

export const BR = {
  nairobi: { name: 'Nairobi', color: '#DC2626' },
  thika: { name: 'Thika', color: '#16A34A' },
  mombasa: { name: 'Mombasa', color: '#2563EB' },
  nakuru: { name: 'Nakuru', color: '#7C3AED' },
  kisumu: { name: 'Kisumu', color: '#EA580C' }
};

export const SM = { pending: 'Pending', booked: 'Booked', transit: 'In Transit', completed: 'Completed', reserved: 'Reserved', standby: 'Standby' };
export const SC = { pending: '#D97706', booked: '#2563EB', transit: '#DC2626', completed: '#059669', reserved: '#7C3AED', standby: '#0D9488' };

export const dk = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export const ft = (h) => {
  const hr = Math.floor(h), mn = Math.round((h - hr) * 60);
  const ap = hr >= 12 ? 'PM' : 'AM', h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return h12 + ':' + String(mn).padStart(2, '0') + ' ' + ap;
};

export function layout(arr) {
  if (!arr.length) return [];
  const s = [...arr].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const cols = [];
  s.forEach(b => {
    let c = cols.findIndex(l => b.start >= l.end);
    if (c === -1) { c = cols.length; cols.push(b); } else cols[c] = b;
    b._c = c;
  });
  s.forEach(b => {
    let mx = b._c;
    s.forEach(o => {
      if (o.id !== b.id && o.start < b.end && o.end > b.start && o._c > mx) mx = o._c;
    });
    b._t = mx + 1;
  });
  return s;
}

// Identical embeddable stylesheet shared by the daily and weekly dispatch views.
export const VIEWER_CSS = `

        :root{
          --bg:#fff;--bg-s:#FAFAFA;--bg-h:#F5F5F5;--bdr:#EEEEEE;--bdr-l:#F0F0F0;
          --tx:#000;--mt:#888;--dm:#BBB;
          --gn:#059669;--rd:#DC2626;--bl:#2563EB;--am:#D97706;--pp:#7C3AED;--or:#EA580C;
          --r:12px;--rs:8px;--sw:440px;
          --sh:0 4px 16px rgba(0,0,0,.06);--sh-lg:0 12px 40px rgba(0,0,0,.1);
        }
        .dispatch-board *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
        .dispatch-board{height:100vh;min-height: 100vh;max-height:100vh;display:flex;flex-direction:column;overflow:hidden}
        @media (max-width:640px){.dispatch-board{height:62vh;min-height:380px}}
        
        .main{flex:1;display:flex;overflow:hidden;position:relative}
        .cal{flex:1;display:flex;flex-direction:column;transition:margin-right .35s cubic-bezier(.22,1,.36,1);overflow:hidden}
        .cal.sh{margin-right:var(--sw)}
        
        .gw{flex:1;overflow-y:auto;padding:0 28px 20px;position:relative}
        .gw::-webkit-scrollbar{width:4px}.gw::-webkit-scrollbar-track{background:transparent}.gw::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
        .fl{position:absolute;top:8px;right:8px;z-index:15;display:flex;flex-direction:column;gap:5px;pointer-events:none}
        .fb{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:50px;font-size:8px;font-weight:700;box-shadow:var(--sh-lg);animation:fi .5s cubic-bezier(.22,1,.36,1) both;pointer-events:auto;white-space:nowrap;background:#fff;border:1px solid var(--bdr)}
        .fp{width:5px;height:5px;border-radius:50%;position:relative;flex-shrink:0}
        .fp::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid currentColor;opacity:.4;animation:pu 2s ease-in-out infinite}
        @keyframes pu{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.8);opacity:0}}
        @keyframes fi{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        .dh{display:grid;grid-template-columns:56px 1fr;position:sticky;top:0;background:var(--bg);z-index:8;padding-bottom:5px;border-bottom:1px solid var(--bdr)}
        .dhs{border-right:1px solid var(--bdr-l)}
        .dhc{padding:5px 14px;display:flex;align-items:center;gap:10px}
        .dhc .dn{font-size:10px;font-weight:700;color:var(--dm);text-transform:uppercase;letter-spacing:.7px}
        .dhc .dd{font-size:20px;font-weight:800;letter-spacing:-.5px}
        .dhc .dd.tm{color:var(--gn)}
        .dhc .db{padding:2px 8px;border-radius:50px;font-size:8px;font-weight:700;background:var(--bg-s);border:1px solid var(--bdr);color:var(--mt)}
        .dhc .dr{margin-left:auto;font-size:8px;font-weight:600;color:var(--dm);letter-spacing:.3px}
        .tg{display:grid;grid-template-columns:56px 1fr;position:relative}
        .tl{height:68px;display:flex;align-items:flex-start;justify-content:flex-end;padding:0 8px 0 0;font-size:9px;font-weight:600;color:var(--dm);border-right:1px solid var(--bdr-l);transform:translateY(-5px)}
        .dc{position:relative}
        .hc{height:68px;border-bottom:1px solid var(--bdr-l);cursor:pointer;transition:background .1s;position:relative}
        .hc:hover{background:var(--bg-h)}
        .hc::after{content:'';position:absolute;left:0;right:0;top:50%;border-bottom:1px dashed rgba(0,0,0,.03);pointer-events:none}
        .bb{position:absolute;border-radius:6px;padding:5px 7px;font-size:11px;cursor:pointer;overflow:hidden;z-index:5;color:#fff;transition:all .18s;animation:bi .35s cubic-bezier(.22,1,.36,1) both;box-shadow:0 2px 10px rgba(0,0,0,.18)}
        .bb:hover{transform:scale(1.012);z-index:9;box-shadow:0 6px 24px rgba(0,0,0,.28)}
        @keyframes bi{from{opacity:0;transform:scaleY(.88) translateY(3px)}to{opacity:1;transform:scaleY(1) translateY(0)}}
        .bb-br{font-size:6px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;opacity:.85;margin-bottom:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .bb-cl{font-size:11px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .bb-tm{font-size:7px;opacity:.8;font-weight:500;margin-top:0}
        .bb-ds{font-size:7px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:0}
        .bb-dt{font-size:7px;opacity:.65;margin-top:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .bb-sp{position:absolute;top:3px;right:4px;padding:1px 5px;border-radius:50px;font-size:5px;font-weight:700;text-transform:uppercase;background:rgba(255,255,255,.22);letter-spacing:.2px}
        .bb-pl{position:absolute;bottom:3px;right:4px;font-size:6px;font-weight:700;opacity:.7}
        .nl{position:absolute;left:0;right:0;height:2px;background:var(--gn);z-index:10;pointer-events:none}
        .nl::before{content:'';position:absolute;left:-4px;top:-3px;width:8px;height:8px;background:var(--gn);border-radius:50%}
        .nl-l{position:absolute;right:0;top:-16px;font-size:7px;font-weight:700;color:var(--gn);background:var(--bg);padding:0 3px;border-radius:2px}
        .tg-ov{position:absolute;left:56px;right:0;top:0;bottom:0;pointer-events:none}
        .tg-ov .bb{pointer-events:auto}
        .tg-ov .empty-ctr{position:absolute;inset:0;display:grid;place-items:center;color:var(--dm);font-size:11px;font-weight:600;text-align:center}
        .sov{position:fixed;inset:0;background:rgba(0,0,0,.1);z-index:50;opacity:0;pointer-events:none;transition:opacity .3s}
        .sov.op{opacity:1;pointer-events:auto}
        .sb{position:fixed;top:0;right:0;width:var(--sw);height:100vh;background:var(--bg);border-left:1px solid var(--bdr);z-index:60;transform:translateX(100%);transition:transform .35s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,.04)}
        .sb.op{transform:translateX(0)}
        .sbh{padding:18px 22px 14px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .sbh h3{font-size:15px;font-weight:800;letter-spacing:-.3px}
        .cbtn{width:26px;height:26px;border:1px solid var(--bdr);background:var(--bg);border-radius:var(--rs);cursor:pointer;display:grid;place-items:center;transition:all .15s;flex-shrink:0}
        .cbtn:hover{background:var(--tx);color:#fff;border-color:var(--tx)}
        .sbd{flex:1;overflow-y:auto;padding:18px 22px}
        .sbd::-webkit-scrollbar{width:3px}.sbd::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
        .scb{height:3px;border-radius:2px;margin-bottom:14px}
        .sbs{margin-bottom:18px}
        .sbst{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--dm);margin-bottom:6px}
        .sig{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .sic{background:var(--bg-s);border:1px solid var(--bdr);border-radius:var(--rs);padding:9px}
        .sil{font-size:7px;font-weight:600;color:var(--dm);text-transform:uppercase;margin-bottom:1px}
        .siv{font-size:11px;font-weight:700}
        .sdr{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bdr-l)}
        .sdr:last-child{border-bottom:none}
        .sdl{font-size:11px;color:var(--mt);font-weight:500}
        .sdvl{font-size:11px;font-weight:700}
        .srt{display:flex;align-items:stretch;gap:9px;background:var(--bg-s);border:1px solid var(--bdr);border-radius:var(--r);padding:12px}
        .srl{display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px 0}
        .srdt{width:7px;height:7px;border-radius:50%;border:2px solid;flex-shrink:0}
        .srdsh{flex:1;width:2px;background:var(--bdr)}
        .sri{display:flex;flex-direction:column;justify-content:space-between}
        .srpt{font-size:11px;font-weight:700}
        .srsb{font-size:9px;color:var(--mt);font-weight:500}
        .stl{display:flex;flex-direction:column;gap:0;position:relative;padding-left:20px}
        .stl::before{content:'';position:absolute;left:4px;top:5px;bottom:5px;width:2px;background:var(--bdr)}
        .sts{display:flex;align-items:center;gap:10px;padding:5px 0;position:relative}
        .std{position:absolute;left:-20px;width:9px;height:9px;border-radius:50%;background:var(--bdr);border:2px solid var(--bg);z-index:2}
        .sts.dn .std{background:var(--gn)}
        .sts.ac .std{background:var(--tx);box-shadow:0 0 0 3px rgba(0,0,0,.08)}
        .stt{font-size:10px;font-weight:600;color:var(--dm)}
        .sts.dn .stt,.sts.ac .stt{color:var(--tx)}
        .sbf{padding:12px 22px;border-top:1px solid var(--bdr);display:flex;gap:5px;flex-shrink:0}
        .sbb{flex:1;padding:8px;border-radius:var(--rs);font-size:9px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;text-align:center;display:flex;align-items:center;justify-content:center;gap:3px}
        .sbg{background:transparent;border:1px solid var(--bdr);color:var(--mt)}
        .sbg:hover{background:var(--bg-h);color:var(--tx)}
        .sbdn{background:#FEF2F2;border:1px solid rgba(220,38,38,.1);color:var(--rd)}
        .sbdn:hover{background:rgba(220,38,38,.1)}
        .sbp{background:var(--tx);border:1px solid var(--tx);color:#fff}
        .sbp:hover{background:#222}
        .mov{position:fixed;inset:0;background:rgba(0,0,0,.15);backdrop-filter:blur(3px);z-index:100;display:none;align-items:center;justify-content:center}
        .mov.op{display:flex}
        .mod{background:var(--bg);border:1px solid var(--bdr);border-radius:12px;padding:22px 24px;width:440px;max-width:92vw;box-shadow:var(--sh-lg);animation:mu .3s cubic-bezier(.22,1,.36,1)}
        @keyframes mu{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .moh{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .moh h3{font-size:15px;font-weight:800;letter-spacing:-.3px}
        .fg{margin-bottom:10px}
        .fg label{display:block;font-size:7px;font-weight:700;color:var(--mt);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
        .fg input,.fg select{width:100%;padding:7px 9px;background:var(--bg-s);border:1px solid var(--bdr);border-radius:var(--rs);font-size:11px;font-family:inherit;font-weight:500;color:var(--tx);outline:none;transition:border-color .15s}
        .fg input:focus,.fg select:focus{border-color:var(--tx)}
        .fr{display:grid;grid-template-columns:1fr 1fr;gap:7px}
        .brpk{display:flex;gap:4px;flex-wrap:wrap}
        .brc{padding:4px 9px;border-radius:50px;font-size:8px;font-weight:700;cursor:pointer;border:2px solid transparent;transition:all .15s;color:#fff}
        .brc:hover{transform:scale(1.05)}
        .brc.sel{border-color:var(--tx);box-shadow:0 0 0 2px var(--bg)}
        .moa{display:flex;gap:5px;margin-top:16px;justify-content:flex-end}
        .ta{position:fixed;bottom:18px;right:18px;z-index:200;display:flex;flex-direction:column;gap:4px}
        .tm{padding:8px 12px;background:var(--tx);color:#fff;border-radius:var(--rs);font-size:9px;font-weight:600;box-shadow:var(--sh-lg);animation:ts .3s cubic-bezier(.22,1,.36,1),tf .3s ease 2.5s forwards;display:flex;align-items:center;gap:4px}
        @keyframes ts{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes tf{to{opacity:0;transform:translateX(14px)}}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--dm)}
        .empty svg{margin-bottom:10px;opacity:.25}
        .empty p{font-size:12px;font-weight:600}
        @media(max-width:768px){:root{--sw:100vw}.gw{padding:0 8px 16px}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}}
`;

// Extra rules used only by the weekly 7-day view (day header + grid columns).
export const WEEK_CSS = `
        .wkdh{display:grid;grid-template-columns:56px repeat(7,1fr);position:sticky;top:0;background:var(--bg);z-index:8;padding-bottom:5px;border-bottom:1px solid var(--bdr)}
        .wkdh .dhs{border-right:1px solid var(--bdr-l)}
        .wkc{text-align:center;padding:1px 0 0;border-right:1px solid var(--bdr-l)}
        .wkc:last-child{border-right:none}
        .wkn{font-size:8px;font-weight:700;color:var(--dm);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
        .wkn.td{color:var(--gn)}
        .wknm{font-size:13px;font-weight:700;color:var(--mt);width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;margin-top:1px}
        .wknm.td{background:var(--gn);color:#fff}
        .tg-wk{grid-template-columns:56px repeat(7,1fr)}
        .tg-ov{position:absolute;left:56px;right:0;top:0;bottom:0;pointer-events:none}
        .tg-ov .bb{pointer-events:auto}
        .wk-empty{position:absolute;inset:0;display:grid;place-items:center;color:var(--dm);font-size:11px;font-weight:600;letter-spacing:.3px}
        @media (max-width:640px){.gw{padding:0 8px 16px}}
`;
