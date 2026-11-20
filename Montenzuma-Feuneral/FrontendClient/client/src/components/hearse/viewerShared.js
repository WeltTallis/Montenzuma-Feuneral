

export const HH = 68;


export const MAX_H = 64;

export const BR = {
  nairobi: { name: 'Nairobi', color: '#DC2626' },
  thika: { name: 'Thika', color: '#16A34A' },
  mombasa: { name: 'Mombasa', color: '#2563EB' },
  nakuru: { name: 'Nakuru', color: '#7C3AED' },
  kisumu: { name: 'Kisumu', color: '#EA580C' }
};


export const BRANCH_SLUG_TO_NAME = {
  // Parent / main branches (complete slugs)
  'montenzuma-monalisa-feuneral-home-nairobi': 'Nairobi',
  'montenzuma-monalisa-feuneral-home-machakos': 'Machakos',
  'montenzuma-monalisa-feuneral-home-thika': 'Thika',
  'montenzuma-monalisa-feuneral-home-mombasa': 'Mombasa',
  'montenzuma-monalisa-feuneral-home-nakuru': 'Nakuru',
  'montenzuma-monalisa-feuneral-home-kisumu': 'Kisumu',
  // Short slugs (fallback)
  'nairobi': 'Nairobi',
  'machakos': 'Machakos',
  'thika': 'Thika',
  'mombasa': 'Mombasa',
  'nakuru': 'Nakuru',
  'kisumu': 'Kisumu',
};

// Dynamically update the branch name map from API data.
// Call this when branches are fetched from the backend.
// branches: array of { branch_id, branch_slug, branch_name, branch_city, ... }
export function updateBranchNameMap(branches) {
  if (!Array.isArray(branches)) return;
  branches.forEach((b) => {
    const slug = b.branch_slug || b.slug || b.branchSlug || '';
    const name = b.branch_name || b.name || b.branchName || b.city || '';
    if (slug && name) {
      BRANCH_SLUG_TO_NAME[slug] = name;
    }
  });
}

// Generic fallback values from the backend that are NOT real branch names.
// When branch_name is one of these, we skip it and try slug resolution instead.
const GENERIC_BRANCH_FALLBACKS = new Set([
  'main branch',
  'main',
  'default',
  'unknown',
  'n/a',
  '—',
  '',
]);

// Try to load branches from localStorage and update the map.
// This runs once on module load to pick up any cached branch data.
function loadBranchesFromStorage() {
  try {
    const stored = localStorage.getItem('branches') || localStorage.getItem('tenant_branches') || localStorage.getItem('branchList');
    if (stored) {
      const branches = JSON.parse(stored);
      if (Array.isArray(branches)) {
        updateBranchNameMap(branches);
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}
loadBranchesFromStorage();

// Resolve a booking's branch name from its data.
// Checks every possible field the backend might populate.
// Returns the REAL human-readable name (e.g. "Machakos", "Nairobi"),
// never the raw slug or a generic fallback like "Main Branch".
export function resolveBranchName(booking) {
  if (!booking) return 'Unknown';

  // 1. booking_branch_slug (the booking's own branch slug from backend) — MOST RELIABLE.
  //    This is the complete slug like "org-home-machakos" set at booking time.
  const bookingSlug = booking.booking_branch_slug || booking.branch_slug || booking.branchSlug || booking.branch || '';
  if (bookingSlug && BRANCH_SLUG_TO_NAME[bookingSlug]) return BRANCH_SLUG_TO_NAME[bookingSlug];

  // 2. Try to extract branch name from the END of a complete slug.
  //    Complete slugs look like "org-name-branch-city" — the last segment is the city.
  //    E.g. "montenzuma-monalisa-feuneral-home-machakos" → "Machakos"
  if (bookingSlug && bookingSlug.includes('-')) {
    const lastSegment = bookingSlug.split('-').pop();
    if (lastSegment) {
      // Capitalize first letter
      const candidate = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      // Only use it if it's a known city (not "home", "funeral", etc.)
      const knownCities = new Set(['nairobi', 'machakos', 'thika', 'mombasa', 'nakuru', 'kisumu', 'eldoret', 'naivasha', 'kitale', 'malaba', 'garissa', 'embu', 'meru', 'nyeri', 'kericho', 'kakamega', 'bungoma', 'nyeri', 'mombasa', 'machakos']);
      if (knownCities.has(lastSegment.toLowerCase())) {
        return candidate;
      }
    }
  }

  // 3. Explicit branch_name field — but skip generic fallbacks like "Main Branch".
  const branchName = (booking.branch_name || booking.branchName || booking.hearse_branch_name || '').trim();
  if (branchName && !GENERIC_BRANCH_FALLBACKS.has(branchName.toLowerCase())) {
    return branchName;
  }

  // 4. branch_id — look up in a map if we have one.
  const branchId = booking.branch_id || booking.branchId;
  if (branchId && BRANCH_SLUG_TO_NAME[String(branchId)]) return BRANCH_SLUG_TO_NAME[String(branchId)];

  // 5. Legacy short slug (e.g. "machakos", "nairobi").
  if (bookingSlug && BR[bookingSlug]) return BR[bookingSlug].name;

  // 6. If branch_name was a generic fallback, try the legacy BR lookup on it.
  if (branchName && BR[branchName.toLowerCase()]) return BR[branchName.toLowerCase()].name;

  // 7. If we have a complete slug but no match, extract and return the last segment as fallback.
  if (bookingSlug && bookingSlug.includes('-')) {
    const lastSegment = bookingSlug.split('-').pop();
    if (lastSegment && lastSegment.length > 2) {
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }
  }

  // 8. Last resort — return the branch_name if we have one (even if generic),
  //    otherwise the slug, otherwise "Unknown".
  return branchName || bookingSlug || 'Unknown';
}

// Resolve a booking's branch color.
// For multi-day bookings, returns the multi-day color (distinct palette).
// For single-day bookings, returns the branch color.
export function resolveBranchColor(booking) {
  if (!booking) return '#6B7280';

  // Multi-day bookings get their own distinct color
  if (isMultiDay(booking)) {
    return getMultiDayColor(booking);
  }

  const slug = booking.branch_slug || booking.branchSlug || booking.branch || 'nairobi';
  return BR[slug]?.color || '#6B7280';
}

// Detect if a booking spans multiple days.
// Returns true if start_date and end_date differ, or if is_multi_day / multi_day flag is set.
export function isMultiDay(booking) {
  if (!booking) return false;
  if (booking.is_multi_day || booking.multi_day || booking.isMultiDay) return true;

  const startDate = booking.start_date || booking.startDate || booking.date;
  const endDate = booking.end_date || booking.endDate;

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      return e.getTime() !== s.getTime();
    }
  }
  return false;
}

export function getBookingRoute(booking) {
  if (!booking) return { from: '—', to: '—' };

  const from = booking.from_location || booking.from || booking.origin || booking.pickup_location || '—';
  const explicitTo = booking.to_location || booking.dest || booking.destination_name || booking.delivery_location;
  const destination = booking.destination || '';
  const routeParts = typeof destination === 'string'
    ? destination.split(/\s*(?:→|->|➜|⟶)\s*/)
    : [];
  const legacyTo = routeParts.length > 1 ? routeParts[routeParts.length - 1] : destination;

  return {
    from,
    to: explicitTo || legacyTo || '—',
  };
}

// Get all dates a booking covers as an array of "YYYY-MM-DD" strings.
export function getBookingDateRange(booking) {
  const startDate = booking.start_date || booking.startDate || booking.date;
  const endDate = booking.end_date || booking.endDate || startDate;

  if (!startDate) return [];

  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime())) return [];
  if (isNaN(e.getTime())) e.setTime(s.getTime());

  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  const dates = [];
  const cur = new Date(s);
  while (cur <= e) {
    dates.push(dk(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Multi-day booking colors — distinct palette so they stand out from single-day bookings.
export const MULTI_DAY_COLORS = [
  '#7C3AED', // purple
  '#DB2777', // pink
  '#0891B2', // cyan
  '#CA8A04', // amber
  '#4F46E5', // indigo
  '#059669', // emerald
  '#DC2626', // red
  '#EA580C', // orange
];

// Get a consistent color for a multi-day booking based on its ID.
export function getMultiDayColor(booking) {
  const id = booking?.id || booking?.booking_id || booking?.bookingId || 0;
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MULTI_DAY_COLORS[hash % MULTI_DAY_COLORS.length];
}

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
