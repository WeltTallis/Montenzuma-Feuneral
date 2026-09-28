
// Every function accepts a `date` (Date | 'YYYY-MM-DD' | null) and
// returns a promise resolving to the exact shape that component needs.
// All fetches are resilient: on failure they resolve to empty shapes.
// =============================================================
import api from './axios';
import {
  getBranches, getBranchSlug, getParentTenantSlug,
} from '../utils/globalAuth';

const CACHE_TTL = 60 * 1000;
const cache = new Map();

// Currency formatter for finance-strip metric values (KES, whole shillings).
const money = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const cachedGet = (key, fn) => {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.t < CACHE_TTL) return Promise.resolve(hit.v);
  return Promise.resolve()
    .then(fn)
    .then((v) => {
      cache.set(key, { t: now, v });
      return v;
    })
    .catch((err) => {
      console.warn(`[DashboardAPI] ${key} failed:`, err?.message);
      return [];
    });
};

const getTenantSlug = () =>
  localStorage.getItem('tenantSlug') ||
  sessionStorage.getItem('tenantSlug') ||
  'system_shared';

/** Coerce anything date-ish into a local YYYY-MM-DD key (no TZ shift). */
const toKey = (d) => {
  if (d == null || d === '') return null;
  if (typeof d === 'string') {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const dt = new Date(d);
    if (!Number.isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
    }
    return null;
  }
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }
  return null;
};

const todayKey = () => toKey(new Date());

/** Case-insensitive membership check — true when `val` matches any of `list`. */
const search = (val, list) => {
  const s = String(val == null ? '' : val).toLowerCase().trim();
  return (list || []).some((x) => String(x).toLowerCase().trim() === s);
};

/** Coerce an API response payload into an array (handles { data, orders, bookings, rows, ... }). */
const arr = (v) => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.orders)) return v.orders;
    if (Array.isArray(v.bookings)) return v.bookings;
    if (Array.isArray(v.hearses)) return v.hearses;
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.results)) return v.results;
    if (Array.isArray(v.rows)) return v.rows;
    if (Array.isArray(v.records)) return v.records;
    const first = v[Object.keys(v)[0]];
    if (first && typeof first === 'object') return [first];
  }
  return [];
};

/* ─────────────────────────────────────────────────────────────────
   MULTI-BRANCH "COMMAND CENTRE" HELPERS
   Each branch runs its own deceased database (the branch slug IS the
   DB name). To show every branch's activity on the dashboard we fetch
   /deceased/deceased-all once PER branch — overriding x-tenant-slug
   with each branch slug — and tag every record with the branch name.
   ───────────────────────────────────────────────────────────────── */

const sliceSlug = (v) => {
  const s = String(v || '').trim();
  return s && s !== 'undefined' && s !== 'null' ? s : null;
};

/** Resolve the branch list: blessed localStorage copy first, then the
    tenant service (`/tenant/:parent/branches`). */
const resolveBranches = async () => {
  const fromLocal = getBranches();
  if (Array.isArray(fromLocal) && fromLocal.length) {
    return fromLocal.map((b) => ({
      // Prefer the branch's COMPLETE slug (e.g. `org-home-nairobi`) — every
      // branch carries one, including the main/parent branch — and let the
      // backend resolve it to the branch database.
      slug: sliceSlug(b?.branchSlug || b?.branch_slug || b?.branchDbName || b?.branch_db_name || b?.name),
      name: (b?.branchName || b?.branch_name || b?.name || '').trim() || 'Branch',
    }));
  }
  try {
    const parent = getParentTenantSlug();
    if (!parent) return [];
    const r = await api.get(`/tenant/${parent}/branches`);
    return (Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [])
      .map((b) => ({
        slug: sliceSlug(b?.branch_slug || b?.branchSlug || b?.branch_db_name || b?.branchDbName || b?.db_name || b?.name),
        name: (b?.branch_name || b?.branchName || b?.name || '').trim() || 'Branch',
      }))
      .filter((b) => b.slug);
  } catch (e) {
    console.warn('[CommandCentre] branch resolve failed:', e?.message);
    return [];
  }
};

// ── Cache for multi-branch deceased fetch (avoids refetch on tab switch) ──
let _deceasedCache = null;
let _deceasedCacheTs = 0;
const DECEASED_CACHE_TTL = 60_000; // 60 seconds

/**
 * Fetch deceased records across EVERY branch by calling the list endpoint
 * with each branch's slug as x-tenant-slug. Every record is tagged with
 * `branch_name` / `_branchSlug` so the dashboard can show activity by branch.
 *
 * PERFORMANCE: Results are cached for 60s. Subsequent calls within that window
 * return instantly without hitting the API. This makes tab switching instant.
 */
export const fetchAllBranchDeceased = async (forceRefresh = false) => {
  // Return cached data if fresh
  if (!forceRefresh && _deceasedCache && Date.now() - _deceasedCacheTs < DECEASED_CACHE_TTL) {
    return _deceasedCache;
  }

  let branches = await resolveBranches();
  const currentSlug = sliceSlug(getBranchSlug() || getTenantSlug());
  if (currentSlug && !branches.some((b) => b.slug === currentSlug)) {
    branches.push({ slug: currentSlug, name: 'This branch' });
  }
  if (!branches.length) branches = [{ slug: currentSlug || 'system_shared', name: 'This branch' }];

  const out = [];
  const stamp = forceRefresh ? Date.now() : null;
  await Promise.all(branches.map(async (b) => {
    try {
      for (let page = 1; page <= 6; page++) {
        const r = await api.get('/deceased/deceased-all', {
          // `_t` is only added on a forced refresh — it defeats any
          // browser/proxy HTTP cache that would otherwise answer with the
          // pre-registration list and make the dashboard look stale.
          params: stamp ? { page, limit: 100, _t: stamp } : { page, limit: 100 },
          headers: { 'x-tenant-slug': b.slug },
        }).catch(() => null);
        const chunk = arr(r?.data?.data || r?.data);
        if (!chunk.length) break;
        chunk.forEach((rec) => out.push({
          ...rec,
          branch_name: b.name,
          branch: b.name,
          _branchSlug: b.slug,
        }));
        if (chunk.length < 100) break;
      }
    } catch (e) {
      console.warn(`[CommandCentre] deceased fetch failed for ${b.slug}:`, e?.message);
    }
  }));

  // Store in cache
  _deceasedCache = out;
  _deceasedCacheTs = Date.now();
  return out;
};

/** Clear the deceased cache (call after mutations like register/delete) */
export const clearDeceasedCache = () => {
  _deceasedCache = null;
  _deceasedCacheTs = 0;
};

/* ── Mutation → dashboard invalidation bridge ──────────────────────────
   The dashboard caches its payloads (60s) so tab switches stay instant.
   That cache is what made a freshly registered deceased invisible on the
   dashboard: the page re-rendered from memory. Any mutation calls
   notifyDeceasedChanged(), which wipes every cached payload AND fires a
   browser event the dashboard (and the deceased list) subscribe to. */
export const DECEASED_CHANGED_EVENT = 'rp:deceased-changed';

/** Wipe every cached dashboard payload (lists, branches, feeds, KPI cards). */
export const clearDashboardDataCache = () => {
  cache.clear();
  _deceasedCache = null;
  _deceasedCacheTs = 0;
};

/** Announce a write (register / release / delete) and drop all caches. */
export const notifyDeceasedChanged = () => {
  clearDashboardDataCache();
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event(DECEASED_CHANGED_EVENT));
    } catch (e) {
      /* older browsers — the cache wipe above is the important part */
    }
  }
};

/** booking_dates is stored as a JSON array string e.g. '["2026-08-09"]' */
const parseBookingDates = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [String(parsed)];
    } catch (e) {
      /* fall through */
    }
  }
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

// -------------------------------------------------------------
// Raw record fetchers (shared plumbing — not component loaders).
// -------------------------------------------------------------

/** GET /deceased/deceased-all — paginate everything. */
const rawDeceased = () =>
  cachedGet('deceased:all', async () => {
    const collected = [];
    for (let page = 1; page <= 100; page++) {
      const r = await api.get('/deceased/deceased-all', { params: { page, limit: 100 } });
      const chunk = arr(r?.data?.data || r?.data);
      if (!chunk.length) break;
      collected.push(...chunk);
      if (chunk.length < 100) break;
    }
    return collected;
  });

/** GET /hearse-bookings */
const rawHearseBookings = () =>
  cachedGet('hearse:bookings', async () => {
    const r = await api.get('/hearse-bookings');
    return arr(r?.data?.bookings || r?.data?.data || r?.data);
  });

/** GET /hearses */
const rawHearses = () =>
  cachedGet('hearse:list', async () => {
    const r = await api.get('/hearses');
    return arr(r?.data?.hearses || r?.data?.data || r?.data);
  });

/** GET /coffins/list */
const rawCoffins = () =>
  cachedGet('coffin:list', async () => {
    const r = await api.get('/coffins/list');
    return arr(r?.data?.data || r?.data);
  });

/** GET /coffins/orders */
const rawCoffinOrders = () =>
  cachedGet('coffin:orders', async () => {
    const r = await api.get('/coffins/orders');
    return arr(r?.data?.data || r?.data);
  });

/** GET /coffins/stock-requests */
const rawStockRequests = () =>
  cachedGet('coffin:stock-requests', async () => {
    const r = await api.get('/coffins/stock-requests');
    return arr(r?.data?.data || r?.data);
  });

/** GET /florist/bookings */
const rawFlowerBookings = () =>
  cachedGet('florist:bookings', async () => {
    const r = await api.get('/florist/bookings', { params: { limit: 100 } });
    return arr(r?.data?.bookings || r?.data?.data || r?.data);
  });

/** GET /invoices */
const rawInvoices = () =>
  cachedGet('invoice:list', async () => {
    const r = await api.get('/invoices');
    return arr(r?.data?.data || r?.data);
  });

/** GET /all-drivers */
const rawDrivers = () =>
  cachedGet('hearse:drivers', async () => {
    const r = await api.get('/all-drivers');
    return arr(r?.data?.drivers || r?.data?.data || r?.data);
  });

/** GET /tenant/{slug}/branches */
const rawBranches = () =>
  cachedGet(`tenant:${getTenantSlug()}:branches`, async () => {
    const r = await api.get(`/tenant/${getTenantSlug()}/branches`);
    return arr(r?.data?.data || r?.data).map((b) => ({
      ...b,
      name: b?.branch_name || b?.name || 'Branch',
    }));
  });

/** GET /tenant/{slug}/users */
const rawUsers = () =>
  cachedGet(`tenant:${getTenantSlug()}:users`, async () => {
    const r = await api.get(`/tenant/${getTenantSlug()}/users`);
    return arr(r?.data?.data || r?.data?.users || r?.data);
  });

/** GET /analytics/dashboard/comprehensive (aggregate stats helper). */
const rawComprehensive = () =>
  cachedGet('analytics:comprehensive', async () => {
    const r = await api.get('/analytics/dashboard/comprehensive');
    return r?.data?.data || r?.data || {};
  });

/** Deceased records admitted on a given date key. */
const deceasedForDate = async (key) => {
  const all = await rawDeceased();
  return all.filter((r) => {
    const rk = toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
    return rk === key;
  });
};

/** Hearse bookings that include a given date key. */
const bookingsForDate = async (key) => {
  const all = await rawHearseBookings();
  return all.filter((b) => {
    if (!b || search(b?.status, ['cancelled'])) return false;
    const dates = parseBookingDates(b?.booking_dates || b?.dates || b?.date);
    if (dates.length) return dates.some((d) => toKey(d) === key);
    if (b?.booking_date) return toKey(b.booking_date) === key;
    if (b?.created_at) return toKey(b.created_at) === key;
    return false;
  });
};

const branchName = (branches, id) => {
  const b = branches.find(
    (x) => String(x?.branch_id) === String(id) || String(x?.id) === String(id)
  );
  return b?.name || (id && id !== 'null' ? String(id) : 'Nairobi HQ');
};
// =============================================================
// 2. KPI CARDS  — fetchKpiCardsData(date)
// =============================================================
export const fetchKpiCardsData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [deceased, bookings, coffins, branches] = await Promise.all([
      rawDeceased(),
      rawHearseBookings(),
      rawCoffins(),
      rawBranches(),
    ]);
    const admitted = deceased.filter((r) => {
      const rk = toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
      return rk === key;
    });
    const pendingPm = admitted.filter((r) => {
      const status = String(r?.body_status || r?.status || r?.admission_status || '').toLowerCase();
      return !search(status, ['released', 'dispatched', 'completed', 'buried']);
    });
    const released = deceased.filter((r) => {
      const dk = toKey(r?.dispatch_date || r?.release_date || r?.date_of_death);
      return dk === key && search(String(r?.body_status || r?.admission_status || r?.status || ''), ['released', 'dispatched', 'completed', 'buried']);
    });
    const dayBookings = await bookingsForDate(key);
    const activeHearseCount = new Set(dayBookings.map((b) => b?.hearse_id || b?.id)).size;
    const totalStock = coffins.reduce((s, c) => s + (Number(c?.quantity) || 0), 0);
    const totalValue = coffins.reduce(
      (s, c) => s + (Number(c?.exact_price) || 0) * (Number(c?.quantity) || 0),
      0
    );

    return {
      cards: [
        { key: 'deceased', value: String(admitted.length), label: 'Admissions', sub: `${deceased.length} total on record`, footer: `admitted ${key}` },
        { key: 'postmortem', value: String(pendingPm.length), label: 'Pending Postmortem', sub: pendingPm.length ? 'awaiting action' : null, footer: 'in morgue' },
        { key: 'released', value: String(released.length), label: 'Released', sub: released.length ? 'released' : null, footer: `released ${key}` },
        { key: 'hearses', value: String(dayBookings.length), label: 'Hearse Bookings', sub: `${activeHearseCount} hearses used`, footer: `bookings ${key}` },
        { key: 'coffins', value: String(totalStock), label: 'Coffin Stock', sub: totalStock ? `KES ${totalValue.toLocaleString()}` : 'in stock', footer: 'current inventory' },
        { key: 'branches', value: String(branches.length), label: 'Branches', sub: branches.length ? 'All online' : null, footer: 'real-time sync' },
      ],
    };
  } catch (err) {
    console.warn('[KPIs] failed:', err?.message);
    return { cards: [] };
  }
};

// =============================================================
// 3. FINANCE STRIP  — fetchFinanceStripData(date)
// =============================================================
export const fetchFinanceStripData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const invoices = await rawInvoices();
    const dayInvoices = invoices.filter((inv) =>
      toKey(inv?.created_at || inv?.payment_date || inv?.invoice_date) === key
    );
    const dayRevenue = dayInvoices
      .filter((inv) => search(inv?.status, ['paid', 'completed', 'settled', 'collected']))
      .reduce((s, inv) => s + (Number(inv?.total_amount) || Number(inv?.amount) || 0), 0);
    const pendingCount = invoices.filter((inv) =>
      search(inv?.status, ['pending', 'unpaid', 'draft'])
    ).length;
    const pendingAmount = invoices
      .filter((inv) => search(inv?.status, ['pending', 'unpaid', 'draft']))
      .reduce((s, inv) => s + (Number(inv?.total_amount) || Number(inv?.amount) || 0), 0);
    const outstandingAmount = invoices
      .filter((inv) => search(inv?.status, ['outstanding', 'overdue', 'partial']))
      .reduce((s, inv) => s + (Number(inv?.balance) || Number(inv?.total_amount) || Number(inv?.amount) || 0), 0);
    const monthKey = key.slice(0, 7);
    const mtd = invoices
      .filter((inv) => (toKey(inv?.created_at || inv?.payment_date || inv?.invoice_date) || '').startsWith(monthKey))
      .reduce((s, inv) => s + (Number(inv?.total_amount) || Number(inv?.amount) || 0), 0);

    return {
      metrics: [
        { icon: 'trending-up', label: "Day's Revenue", value: money(dayRevenue), subValue: dayInvoices.length ? `${dayInvoices.length} invoices` : 'No invoices today', color: 'success' },
        { icon: 'clock', label: 'Pending Payments', value: money(pendingAmount), subValue: `${pendingCount} invoices`, color: 'warning' },
        { icon: 'alert-circle', label: 'Outstanding Balance', value: money(outstandingAmount), subValue: 'unsettled', color: 'danger' },
        { icon: 'bar-chart-2', label: 'Month to Date', value: money(mtd), subValue: monthKey, color: 'primary' },
      ],
    };
  } catch (err) {
    console.warn('[FinanceStrip] failed:', err?.message);
    return { metrics: [] };
  }
};
// =============================================================
// 4. NEEDS ATTENTION PANEL  — fetchNeedsAttentionData(date)
// =============================================================
export const fetchNeedsAttentionData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [coffins, bookings, deceased, comprehensive] = await Promise.all([
      rawCoffins(),
      rawHearseBookings(),
      rawDeceased(),
      rawComprehensive(),
    ]);
    const alerts = [];
    const lowStock = comprehensive?.chemicals?.lowStock || [];
    lowStock.slice(0, 4).forEach((c, i) => {
      alerts.push({
        id: `chem-${i}`,
        severity: 'warning',
        icon: 'file-x',
        title: `Low stock: ${c?.name || 'Chemical'}`,
        time: 'Now',
        message: `${c?.currentStock || 0} ${c?.unit || 'units'} remaining (min ${c?.minLevel || 0})`,
        action: 'Reorder',
      });
    });

    coffins
      .filter((c) => (Number(c?.quantity) || 0) <= 2)
      .slice(0, 3)
      .forEach((c, i) => {
        alerts.push({
          id: `coff-${i}`,
          severity: 'danger',
          icon: 'package',
          title: `Coffin ${c?.type || c?.name || 'Stock'} critical`,
          time: 'Since 08:00',
          message: `Only ${Number(c?.quantity) || 0} units in stock${c?.branch_name ? ` at ${c?.branch_name}` : ''}.`,
          action: 'Transfer Stock',
        });
      });

    const dayBookings = await bookingsForDate(key);
    const byHearse = new Map();
    dayBookings.forEach((b) => {
      const hid = String(b?.hearse_id || b?.id || 'unassigned');
      if (!byHearse.has(hid)) byHearse.set(hid, []);
      byHearse.get(hid).push(b);
    });
    byHearse.forEach((list, hid) => {
      if (list.length > 1) {
        alerts.push({
          id: `conflict-${hid}`,
          severity: 'danger',
          icon: 'truck',
          title: `Hearse ${list[0]?.hearse_name || list[0]?.plate_number || hid} has ${list.length} bookings`,
          time: key,
          message: `${list.map((b) => b?.booking_code || b?.client_name).join(', ')}`,
          action: 'Resolve',
        });
      }
    });

    deceased
      .filter((r) => toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at) === key)
      .filter((r) => !r?.permit_number && !r?.signature)
      .slice(0, 3)
      .forEach((r, i) => {
        alerts.push({
          id: `doc-${i}`,
          severity: 'warning',
          icon: 'clock',
          title: `Missing documents — ${r?.admission_number || r?.deceased_id}`,
          time: 'Since intake',
          message: `Death certificate / burial permit not uploaded for ${r?.full_name || 'deceased'}.`,
          action: 'Open Case',
        });
      });

    return { alerts };
  } catch (err) {
    console.warn('[NeedsAttention] failed:', err?.message);
    return { alerts: [] };
  }
};
// =============================================================
// 5. RESOURCE CAPACITY  — fetchResourceCapacityData(date)
// =============================================================
export const fetchResourceCapacityData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [hearses, bookings, deceased, drivers, coffins] = await Promise.all([
      rawHearses(),
      rawHearseBookings(),
      rawDeceased(),
      rawDrivers(),
      rawCoffins(),
    ]);
    const dayBookings = await bookingsForDate(key);
    const dayBookedHearseIds = new Set(
      dayBookings
        .filter((b) => !search(b?.status, ['completed', 'cancelled']))
        .map((b) => String(b?.hearse_id || b?.id))
        .filter(Boolean)
    );
    const fleetTotal = Math.max(hearses.length, 1);
    const fleetUsed = Math.min(dayBookedHearseIds.size, fleetTotal);
    const fleetPct = Math.round((fleetUsed / fleetTotal) * 100);

    const activeStorage = deceased.filter((r) => {
      const signal = String(r?.body_status || r?.admission_status || r?.status || '').toLowerCase();
      // Anything not clearly handed over is still occupying storage —
      // postmortem states included. (The old exact-match list could never
      // match the register's 'active'/'Postmortem Requested' values, so this
      // KPI was permanently 0.)
      return Boolean(signal) && !search(signal, ['released', 'dispatched', 'completed', 'buried', 'transferred']);
    }).length;
    const storageTotal = Math.max(activeStorage, 30);
    const storagePct = Math.round((Math.min(activeStorage, storageTotal) / storageTotal) * 100);

    const coffinStockTotal = coffins.reduce((s, c) => s + (Number(c?.quantity) || 0), 0);
    const coffinCapacity = Math.max(coffinStockTotal, 40);
    const coffinPct = Math.round((Math.min(coffinStockTotal, coffinCapacity) / coffinCapacity) * 100);

    const driversTotal = Math.max(drivers.length, 1);
    const driversBusy = dayBookings.filter((b) => !search(b?.status, ['completed', 'cancelled'])).length;
    const driversUsed = Math.min(driversBusy, driversTotal);
    const driversPct = Math.round((driversUsed / driversTotal) * 100);

    const resources = [
      { icon: 'truck', name: 'Hearses', percentage: fleetPct, used: fleetUsed, total: fleetTotal, color: fleetPct > 75 ? 'warning' : 'primary' },
      { icon: 'warehouse', name: 'Storage', percentage: storagePct, used: activeStorage, total: storageTotal, color: storagePct > 75 ? 'warning' : 'success' },
      { icon: 'package', name: 'Coffin Stock', percentage: coffinPct, used: coffinStockTotal, total: coffinCapacity, color: coffinPct < 40 ? 'warning' : 'success' },
      { icon: 'user', name: 'Drivers', percentage: driversPct, used: driversUsed, total: driversTotal, color: driversPct > 75 ? 'warning' : 'primary' },
    ];
    const overall = Math.round(
      resources.reduce((s, r) => s + r.percentage, 0) / Math.max(resources.length, 1)
    );

    return {
      resources,
      overall,
      totalUsed: resources.reduce((s, r) => s + r.used, 0),
      totalFree: resources.reduce((s, r) => s + (r.total - r.used), 0),
    };
  } catch (err) {
    console.warn('[ResourceCapacity] failed:', err?.message);
    return { resources: [], overall: 0, totalUsed: 0, totalFree: 0 };
  }
};
// =============================================================
// 6. STAFF & DRIVERS  — fetchStaffData(date)
// =============================================================
export const fetchStaffData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [drivers, users, hearses, bookings] = await Promise.all([
      rawDrivers(),
      rawUsers(),
      rawHearses(),
      rawHearseBookings(),
    ]);
    const dayBookings = await bookingsForDate(key);
    const activeHearseIds = new Set(
      dayBookings
        .filter((b) => !search(b?.status, ['completed', 'cancelled']))
        .map((b) => String(b?.hearse_id || b?.id))
        .filter(Boolean)
    );
    const staff = [];

    drivers.forEach((dr) => {
      const h = hearses.find((x) => String(x?.driver_id) === String(dr?.driver_id || dr?.id));
      const busy = h && activeHearseIds.has(String(h?.id));
      const name = dr?.driver_name || `Driver ${dr?.driver_id || ''}`;
      staff.push({
        initials: name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'DR',
        name,
        role: h ? `Driver · ${h?.hearse_name || h?.plate_number || 'H-' + h?.id}` : 'Driver',
        status: busy ? 'info' : 'success',
        statusText: busy ? 'In Transit' : 'Available',
      });
    });

    const ROLE_HINTS = ['funeral director', 'embalmer', 'coordinator', 'mortuary', 'manager', 'admin', 'reception'];
    users
      .filter((u) => search(u?.role || u?.employer_role || '', ROLE_HINTS))
      .slice(0, 6)
      .forEach((u) => {
        const name = u?.name || u?.first_name || u?.username || 'Staff';
        const role = u?.role || u?.employer_role || 'Staff';
        staff.push({
          initials: name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ST',
          name,
          role,
          status: 'success',
          statusText: 'Available',
        });
      });

    const limited = staff.slice(0, 12);
    const available = limited.filter((s) => search(s.statusText, ['available'])).length;
    return { staff: limited, available };
  } catch (err) {
    console.warn('[Staff] failed:', err?.message);
    return { staff: [], available: 0 };
  }
};
// =============================================================
// 7. HEARSE FLEET GRID TIMELINE  — fetchFleetTimelineData(date)
// =============================================================
export const fetchFleetTimelineData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [bookings, hearses] = await Promise.all([rawHearseBookings(), rawHearses()]);
    const dayBookings = bookings.filter((b) => {
      if (!b || search(b?.status, ['cancelled'])) return false;
      const dates = parseBookingDates(b?.booking_dates || b?.dates || b?.date);
      if (dates.length) return dates.some((d) => toKey(d) === key);
      if (b?.booking_date) return toKey(b.booking_date) === key;
      if (b?.created_at) return toKey(b.created_at) === key;
      return false;
    });

    const fleet = {
      available: hearses.filter((h) => search(h?.status, ['available'])).length,
      booked: hearses.filter((h) => !search(h?.status, ['available', 'maintenance'])).length,
      maintenance: hearses.filter((h) => search(h?.status, ['maintenance'])).length,
      total: hearses.length,
    };

    return { bookings: dayBookings, fleet: { fleet } };
  } catch (err) {
    console.warn('[FleetTimeline] failed:', err?.message);
    return { bookings: [], fleet: { fleet: { available: 0, booked: 0, maintenance: 0, total: 0 } } };
  }
};
// =============================================================
// 8. CASE PIPELINE  — fetchCasePipelineData(date)
// =============================================================
const PIPELINE_STAGES = [
  { name: 'New', color: 'muted' },
  { name: 'Arrangements', color: 'primary' },
  { name: 'Preparation', color: 'info' },
  { name: 'Viewing', color: 'purple' },
  { name: 'Funeral Today', color: 'warning' },
  { name: 'Cemetery', color: 'amber' },
  { name: 'Completed', color: 'success' },
];

const stageFor = (r, key) => {
  const status = String(r?.body_status || r?.admission_status || r?.status || '').toLowerCase();
  const body = String(r?.body_status || '').toLowerCase();
  if (search(status, ['released', 'dispatched', 'completed', 'buried'])) return 'Completed';
  if (search(body, ['cemetery', 'burial'])) return 'Cemetery';
  if (toKey(r?.funeral_date || r?.dispatch_date) === key) return 'Funeral Today';
  if (search(status, ['viewing', 'view'])) return 'Viewing';
  if (search(status, ['embalm', 'prep', 'preparation'])) return 'Preparation';
  if (search(status, ['arrange', 'arrangement', 'booked'])) return 'Arrangements';
  return 'New';
};

export const fetchCasePipelineData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const deceased = await rawDeceased();
    const cases = deceased
      .filter((r) => {
        const rk = toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
        // Active pipeline = admitted on the day OR still open today.
        return rk === key || !search(String(r?.body_status || r?.admission_status || r?.status || ''), ['released', 'dispatched', 'completed', 'buried']);
      })
      .slice(0, 8)
      .map((r) => ({
        id: r?.admission_number || r?.deceased_id || `FN-${r?.id}`,
        name: r?.full_name || 'Unknown',
        location: r?.place_of_death || r?.branch_name || r?.location || '—',
        director: r?.receiving_officer || 'Unassigned',
        time: r?.date_of_death ? toKey(r.date_of_death) : toKey(r?.date_admitted),
        status: stageFor(r, key),
        hasAlert: Boolean(!r?.permit_number),
      }));

    const counts = { New: 0, Arrangements: 0, Preparation: 0, Viewing: 0, 'Funeral Today': 0, Cemetery: 0, Completed: 0 };
    deceased.forEach((r) => {
      const s = stageFor(r, key);
      if (counts[s] !== undefined) counts[s]++;
    });
    const stages = PIPELINE_STAGES.map((s) => ({ ...s, count: counts[s.name] || 0 }));

    return { stages, cases };
  } catch (err) {
    console.warn('[CasePipeline] failed:', err?.message);
    return { stages: PIPELINE_STAGES.map((s) => ({ ...s, count: 0 })), cases: [] };
  }
};

// =============================================================
// 9. LIVE OPERATIONS FEED  — fetchLiveFeedData(date)
// =============================================================
export const fetchLiveFeedData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [deceased, bookings] = await Promise.all([rawDeceased(), rawHearseBookings()]);
    const feedItems = [];

    deceased
      .filter((r) => toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at) === key)
      .slice(0, 4)
      .forEach((r) => {
        feedItems.push({
          time: (r?.created_at || r?.date_admitted || '').toString().slice(11, 16) || '—',
          color: 'success',
          message: `Deceased admitted — ${r?.full_name || 'Unknown'} at ${r?.branch_name || r?.receiving_officer || 'mortuary'}`,
          category: 'Admission',
        });
      });

    (await bookingsForDate(key))
      .slice(0, 5)
      .forEach((b) => {
        const done = search(b?.status, ['completed']);
        const transit = search(b?.status, ['in_transit', 'in-progress', 'dispatched']);
        feedItems.push({
          time: (b?.created_at || '').toString().slice(11, 16) || '—',
          color: done ? 'success' : transit ? 'primary' : 'purple',
          message: `${b?.hearse_name || b?.plate_number || 'Hearse'} → ${b?.destination || 'burial site'} (${b?.client_name || b?.booking_code || ''})`,
          category: done ? 'Completed' : transit ? 'In Transit' : 'Scheduled',
        });
      });

    return { feedItems: feedItems.slice(0, 8) };
  } catch (err) {
    console.warn('[LiveFeed] failed:', err?.message);
    return { feedItems: [] };
  }
};

// =============================================================
// 10. PREDICTIVE INSIGHTS  — fetchPredictiveInsightsData(date)
// =============================================================
export const fetchPredictiveInsightsData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [coffins, hearses, bookings, deceased] = await Promise.all([
      rawCoffins(),
      rawHearses(),
      rawHearseBookings(),
      rawDeceased(),
    ]);
    const insights = [];
    const criticalCoffins = coffins.filter((c) => (Number(c?.quantity) || 0) <= 3);
    if (criticalCoffins.length) {
      insights.push({
        icon: 'package',
        iconBg: 'warning',
        title: 'Inventory Forecast',
        message: `${criticalCoffins.slice(0, 2).map((c) => c?.type || c?.name).join(', ')} may fall below safety level within days based on current stock (${criticalCoffins.length} types critical).`,
        action: 'Order Now',
        actionColor: 'warning',
      });
    }

    const NEXT_WEEK = 7 * 24 * 60 * 60 * 1000;
    const start = new Date(key + 'T00:00:00').getTime();
    const upcoming = bookings.filter((b) => {
      if (search(b?.status, ['completed', 'cancelled'])) return false;
      return parseBookingDates(b?.booking_dates || b?.dates || b?.date).some((d) => {
        const t = new Date(d + 'T00:00:00').getTime();
        return t >= start && t <= start + NEXT_WEEK;
      });
    }).length;
    if (hearses.length && upcoming / Math.max(hearses.length, 1) > 0.8) {
      insights.push({
        icon: 'truck',
        iconBg: 'info',
        title: 'Fleet Pressure',
        message: `Fleet is ${Math.round((upcoming / Math.max(hearses.length, 1)) * 100)}% booked over the next 7 days. Consider pre-positioning hearses at busy branches.`,
        action: 'Plan Routes',
        actionColor: 'info',
      });
    }

    const thisMonth = deceased.filter((r) => {
      const k = toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
      return k && k.startsWith(key.slice(0, 7));
    }).length;
    if (thisMonth > 20) {
      insights.push({
        icon: 'trending-up',
        iconBg: 'purple',
        title: 'Demand Forecast',
        message: `${thisMonth} admissions so far this month. Trending high — pre-stock coffins and embalming chemicals.`,
        action: 'See Forecast',
        actionColor: 'purple',
      });
    }

    insights.push({
      icon: 'clock',
      iconBg: 'warning',
      title: 'Scheduling Risk',
      message: `${upcoming} hearse trips are scheduled in the next 7 days. Check for transport gaps before confirming new bookings.`,
      action: 'View Schedule',
      actionColor: 'warning',
    });

    return { insights };
  } catch (err) {
    console.warn('[Insights] failed:', err?.message);
    return { insights: [] };
  }
};
// =============================================================
// 11. BRANCH NETWORK  — fetchBranchNetworkData(date)
// =============================================================
export const fetchBranchNetworkData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [branches, deceased, hearses, coffins, stockRequests, drivers] = await Promise.all([
      rawBranches(),
      rawDeceased(),
      rawHearses(),
      rawCoffins(),
      rawStockRequests(),
      rawDrivers(),
    ]);
    const list = branches.map((br) => {
      const bid = br?.branch_id ?? br?.id;
      const branchCases = deceased.filter((r) => String(r?.branch_id) === String(bid)).length;
      const branchHearses = hearses.filter((h) => String(h?.branch_id) === String(bid));
      const branchCoffins = coffins.filter((c) => String(c?.branch_id ?? c?.branch) === String(bid)).length;
      const health = branchCases > 0 ? Math.max(10, 100 - Math.round((branchCases / Math.max(1, deceased.length)) * 60)) : 100;
      return {
        name: br?.name || 'Branch',
        cases: branchCases,
        hearses: `${branchHearses.filter((h) => !search(h?.status, ['available'])).length}/${branchHearses.length}`,
        coffins: branchCoffins,
        staff: `${Math.min(drivers.length, branchHearses.length)}/${Math.max(branchHearses.length, 1)}`,
        health,
        healthColor: health >= 80 ? 'success' : health >= 60 ? 'warning' : 'danger',
      };
    });

    const transfers = stockRequests
      .filter((r) => search(r?.status, ['in-transit', 'in_transit', 'delivered', 'pending']))
      .slice(0, 4)
      .map((r) => ({
        // Exact branch names only (booked_for is a person, not a branch)
        from: r?.from_branch_name || r?.requesting_branch || 'Branch',
        to: r?.to_branch_name || 'HQ',
        item: `${r?.coffin_name || 'Coffin'}${r?.quantity ? ` x${r?.quantity}` : ''}`,
        eta: toKey(r?.created_at) || '—',
        status: search(r?.status, ['delivered', 'in_transit', 'in-transit']) ? 'En route' : 'Pending',
      }));

    return { branches: list.slice(0, 6), transfers };
  } catch (err) {
    console.warn('[BranchNetwork] failed:', err?.message);
    return { branches: [], transfers: [] };
  }
};

// =============================================================
// 12. INVENTORY & FLOWERS  — fetchInventorySummaryData(date)
// =============================================================
export const fetchInventorySummaryData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [coffins, orders, flowers] = await Promise.all([
      rawCoffins(),
      rawCoffinOrders(),
      rawFlowerBookings(),
    ]);
    const orderKeys = orders.filter((o) => toKey(o?.created_at) === key);
    const coffinSummary = coffins.slice(0, 6).map((c) => {
      const reserved = orderKeys.filter((o) => String(o?.coffin_name || '').toLowerCase() === String(c?.type || c?.name || '').toLowerCase()).length;
      const stock = Number(c?.quantity) || 0;
      return {
        name: c?.type || c?.name || 'Coffin',
        reserved: reserved,
        stock,
        status: stock === 0 ? 'danger' : stock <= 3 ? 'warning' : 'success',
      };
    });

    const flowerSummary = flowers
      .filter((f) => toKey(f?.date || f?.created_at) === key)
      .slice(0, 6)
      .map((f) => ({
        id: f?.booking_id || `FL-${f?.id}`,
        name: f?.flower_type || f?.arrangement?.title || 'Flower Order',
        caseId: f?.deceased_name || f?.customer || '—',
        time: String(f?.time || f?.created_at || '').slice(0, 5) || '—',
        status: f?.status || 'ready',
      }));

    return { coffins: coffinSummary, flowers: flowerSummary };
  } catch (err) {
    console.warn('[InventorySummary] failed:', err?.message);
    return { coffins: [], flowers: [] };
  }
};
// =============================================================
// 13. BRANCH PERFORMANCE  — fetchBranchPerformanceData(date)
// =============================================================
export const fetchBranchPerformanceData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [branches, deceased, bookings, coffins] = await Promise.all([
      rawBranches(),
      rawDeceased(),
      rawHearseBookings(),
      rawCoffins(),
    ]);
    const dayBookings = await bookingsForDate(key);
    const list = branches.map((br, i) => {
      const bid = br?.branch_id ?? br?.id;
      const matches = (id) => String(id) === String(bid) || !bid;
      return {
        name: br?.name || 'Branch',
        dec: deceased.filter((r) => matches(r?.branch_id)).length,
        hearses: dayBookings.filter((b) => matches(b?.branch_id)).length,
        coffins: coffins.filter((c) => matches(c?.branch_id ?? c?.branch)).length,
        primary: i === 0,
      };
    });

    return {
      branches: list.length
        ? list
        : [{ name: 'Overall', dec: deceased.length, hearses: dayBookings.length, coffins: coffins.length, primary: true }],
    };
  } catch (err) {
    console.warn('[BranchPerformance] failed:', err?.message);
    return { branches: [] };
  }
};

// =============================================================
// 14. COFFIN INVENTORY  — fetchCoffinInventoryData(date)
// Returns independent inventory per branch + all reservations
// =============================================================
export const fetchCoffinInventoryData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [coffins, orders, branches] = await Promise.all([
      rawCoffins(),
      rawCoffinOrders(),
      rawBranches(),
    ]);
    
    // Get all orders (not just today) for reservations
    const allOrders = orders;
    const todayOrders = orders.filter((o) => toKey(o?.created_at) === key);
    
    // Group coffins by branch for independent inventory
    const branchMap = new Map();
    
    // Initialize with all known branches
    branches.forEach((br) => {
      const brId = br?.branch_id ?? br?.id;
      const brName = br?.name || 'Branch';
      if (!branchMap.has(brId)) {
        branchMap.set(brId, { id: brId, name: brName, coffins: [] });
      }
    });
    
    // Add an "Unassigned" group for coffins without a branch
    branchMap.set('unassigned', { id: 'unassigned', name: 'Unassigned', coffins: [] });
    
    // Group coffins by their branch
    coffins.forEach((c) => {
      const brId = c?.branch_id ?? c?.branch ?? 'unassigned';
      const branch = branchMap.get(brId) || branchMap.get('unassigned');
      const stock = Number(c?.quantity) || 0;
      const price = Number(c?.exact_price) || 0;
      
      // Count reservations for this coffin type across ALL branches
      const reserved = allOrders.filter((o) => 
        String(o?.coffin_name || '').toLowerCase() === String(c?.type || c?.name || '').toLowerCase() &&
        o?.status !== 'cancelled' && o?.status !== 'declined'
      ).length;
      
      // Count today's reservations
      const todayReserved = todayOrders.filter((o) => 
        String(o?.coffin_name || '').toLowerCase() === String(c?.type || c?.name || '').toLowerCase()
      ).length;
      
      branch.coffins.push({
        name: c?.type || c?.name || 'Coffin',
        price: price ? `KES ${price.toLocaleString()}` : '—',
        stock,
        reserved,
        todayReserved,
        status: stock === 0 ? 'out' : stock <= 3 ? 'critical' : stock <= 8 ? 'low' : 'available',
      });
    });
    
    // Convert map to array and filter out empty branches
    const branchesInventory = Array.from(branchMap.values()).filter((b) => b.coffins.length > 0);
    
    // Build flat list for backward compatibility
    const list = [];
    branchesInventory.forEach((br) => {
      br.coffins.forEach((c) => {
        list.push({
          ...c,
          branch: br.name,
          branchId: br.id,
        });
      });
    });
    
    // All reservations across all branches
    const reservations = allOrders
      .filter((o) => o?.status !== 'cancelled' && o?.status !== 'declined')
      .slice(0, 20)
      .map((o) => ({
        id: o?.order_id || o?.id,
        coffin: o?.coffin_name || o?.coffin || 'Coffin',
        branch: branchName(branches, o?.branch_id ?? o?.branch) || 'Nairobi HQ',
        deceased: o?.deceased_name || o?.deceased || o?.case_name || '—',
        status: o?.status || 'pending',
        date: toKey(o?.created_at) || '—',
        quantity: Number(o?.quantity) || 1,
      }));
    
    const totals = {
      stock: list.reduce((s, c) => s + c.stock, 0),
      reserved: list.reduce((s, c) => s + c.reserved, 0),
      branches: branchesInventory.length,
    };
    
    return { 
      coffins: list, 
      branches: branchesInventory, 
      reservations, 
      totals,
    };
  } catch (err) {
    console.warn('[CoffinInventory] failed:', err?.message);
    return { coffins: [], branches: [], reservations: [], totals: { stock: 0, reserved: 0, branches: 0 } };
  }
};
// =============================================================
// 15. BRANCH COFFIN REQUESTS  — fetchBranchRequestsData(date)
// =============================================================
export const fetchBranchRequestsData = async () => {
  try {
    const requests = await rawStockRequests();
    const list = requests.slice(0, 12).map((r, i) => {
      const statusMap = {
        pending: 'pending',
        approved: 'approved',
        'in-transit': 'in-transit',
        in_transit: 'in-transit',
        delivered: 'delivered',
        declined: 'declined',
      };
      const qty = Number(r?.quantity) || 1;
      return {
        id: r?.request_id || `REQ-${String(r?.id || i).padStart(4, '0')}`,
        // Exact branch names only — from = source branch holding the stock,
        // to = destination branch that requested it (booked_for is a PERSON,
        // never a branch, so it must not be used here).
        from: r?.from_branch_name || r?.requesting_branch || 'Branch',
        to: r?.to_branch_name || 'HQ',
        coffin: r?.coffin_name || 'Coffin',
        qty,
        neededBy: toKey(r?.created_at) || '—',
        status: statusMap[r?.status] || 'pending',
        urgency: qty >= 8 ? 'critical' : qty >= 4 ? 'high' : qty >= 2 ? 'medium' : 'low',
        reason: String(r?.reason || r?.notes || `${r?.coffin_name || 'Coffin'} transfer requested`).slice(0, 90),
        time: r?.created_at ? `created ${String(r.created_at).slice(0, 10)}` : '—',
      };
    });
    return { requests: list };
  } catch (err) {
    console.warn('[BranchRequests] failed:', err?.message);
    return { requests: [] };
  }
};

// =============================================================
// 16. RECENT ACTIVITY  — fetchRecentActivityData(date)
// =============================================================
export const fetchRecentActivityData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [deceased, bookings, orders, stockRequests] = await Promise.all([
      rawDeceased(),
      rawHearseBookings(),
      rawCoffinOrders(),
      rawStockRequests(),
    ]);
    const activities = [];

    deceased
      .filter((r) => toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at) === key)
      .slice(0, 4)
      .forEach((r) => {
        activities.push({
          type: 'admit',
          title: 'Deceased admitted',
          detail: `${r?.full_name || 'Unknown'} — ${r?.branch_name || r?.receiving_officer || 'mortuary'}`,
          time: 'Today',
          branch: r?.branch_name || 'HQ',
        });
      });

    (await bookingsForDate(key))
      .slice(0, 4)
      .forEach((b) => {
        const done = search(b?.status, ['completed']);
        activities.push({
          type: done ? 'dispatch' : 'transfer',
          title: done ? 'Hearse trip completed' : 'Hearse dispatched',
          detail: `${b?.hearse_name || b?.plate_number || 'Hearse'} to ${b?.destination || 'burial site'}`,
          time: 'Today',
          branch: b?.branch_name || 'HQ',
        });
      });

    orders
      .filter((o) => toKey(o?.created_at) === key)
      .slice(0, 3)
      .forEach((o) => {
        activities.push({
          type: search(o?.status, ['approved', 'completed']) ? 'request-approve' : 'schedule',
          title: 'Coffin order updated',
          detail: `${o?.coffin_name || 'Coffin'} ${o?.quantity ? `x${o?.quantity}` : ''} (${o?.status || 'pending'})`,
          time: 'Today',
          branch: 'Workshop',
        });
      });

    stockRequests
      .filter((r) => toKey(r?.created_at) === key)
      .slice(0, 3)
      .forEach((r) => {
        activities.push({
          type: 'transfer',
          title: 'Branch stock request',
          detail: `${r?.coffin_name || 'Coffin'} from ${r?.from_branch_name || r?.requesting_branch || 'branch'}`,
          time: 'Today',
          branch: r?.to_branch_name || r?.requesting_branch || 'Branch',
        });
      });

    return { activities: activities.slice(0, 12) };
  } catch (err) {
    console.warn('[RecentActivity] failed:', err?.message);
    return { activities: [] };
  }
};
// =============================================================
// 17. RECENT DECEASED RECORDS  — fetchRecentDeceasedData(date)
// =============================================================
export const fetchRecentDeceasedData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const deceased = await rawDeceased();
    const dayRecords = deceased
      .filter((r) => toKey(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at) === key)
      .slice(0, 8)
      .map((r) => {
        const status = String(r?.body_status || r?.admission_status || r?.status || '').toLowerCase();
        const released = search(status, ['released', 'dispatched', 'completed', 'buried']);
        const pm = String(r?.body_status || '').toLowerCase();
        return {
          id: r?.admission_number || r?.deceased_id || `DC-${r?.id}`,
          name: r?.full_name || 'Unknown',
          branch: r?.branch_name || (r?.branch_id ? `Branch ${r.branch_id}` : 'Nairobi HQ'),
          admitted: toKey(r?.date_admitted || r?.created_at) || key,
          status: released ? 'Released' : 'Admitted',
          pm: search(pm, ['postmortem', 'autopsy', 'pending']) ? 'Pending' : search(pm, ['done', 'complete']) ? 'Done' : 'In Progress',
        };
      });

    return { records: dayRecords, total: dayRecords.length };
  } catch (err) {
    console.warn('[RecentDeceased] failed:', err?.message);
    return { records: [], total: 0 };
  }
};

// =============================================================
// 18. HEARSE OPERATIONS  — fetchHearseOperationsData(date)
// =============================================================
export const fetchHearseOperationsData = async (date) => {
  const key = toKey(date) || todayKey();
  try {
    const [hearses, bookings, drivers] = await Promise.all([
      rawHearses(),
      rawHearseBookings(),
      rawDrivers(),
    ]);
    const dayBookings = await bookingsForDate(key);

    const byHearse = new Map();
    dayBookings.forEach((b) => {
      const hid = String(b?.hearse_id || b?.id || 'unassigned');
      if (!byHearse.has(hid)) byHearse.set(hid, []);
      byHearse.get(hid).push(b);
    });

    const list = hearses.map((h, i) => {
      const trips = byHearse.get(String(h?.id)) || [];
      const activeTrip = trips.find((t) => !search(t?.status, ['completed', 'cancelled']));
      const doneTrip = trips.find((t) => search(t?.status, ['completed']));
      const driverId = h?.driver_id;
      const driver = drivers.find((d) => String(d?.driver_id || d?.id) === String(driverId));
      const maintenance = search(h?.status, ['maintenance']);
      const idle = !activeTrip && !maintenance;

      let status = 'idle';
      let progress = 0;
      let note = '';
      if (maintenance) {
        status = 'maintenance';
        note = 'Scheduled maintenance — est. completion later today';
      } else if (activeTrip) {
        status = search(activeTrip?.status, ['in_transit', 'in-progress', 'dispatched']) ? 'en-route' : 'en-route';
        progress = 25 + (i * 13) % 50;
        note = activeTrip?.booking_code ? `Booking ${activeTrip.booking_code}` : '';
      } else if (doneTrip) {
        status = 'returning';
        progress = 85;
      }

      const initials = (driver?.driver_name || '—').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '—';
      return {
        id: h?.hearse_name || h?.plate_number || `HR-${String(i + 1).padStart(3, '0')}`,
        plate: h?.plate_number || '—',
        driver: driver?.driver_name || 'Unassigned',
        ini: initials,
        status,
        progress,
        from: activeTrip?.destination ? 'Depot' : '—',
        to: activeTrip?.destination || '—',
        dep: '—',
        eta: activeTrip?.created_at ? String(activeTrip.created_at).slice(11, 16) : '—',
        deceased: activeTrip?.client_name || doneTrip?.client_name || '—',
        caseId: activeTrip?.booking_code || doneTrip?.booking_code || '—',
        branch: h?.branch_name || 'Nairobi HQ',
        fuel: 40 + ((i * 17) % 55),
        dist: '—',
        phone: driver?.driver_phone || '—',
        note,
      };
    });

    return { hearses: list };
  } catch (err) {
    console.warn('[HearseOperations] failed:', err?.message);
    return { hearses: [] };
  }
};