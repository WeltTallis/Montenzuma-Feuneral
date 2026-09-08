import api from "./axios";
import { getBranches, getBranchSlug, getTenantSlug, getParentTenantSlug } from "../utils/globalAuth";

/* ─────────────────────────────────────────────────────────────
   Independent dashboard feeds (Deceased analytics tab).

   • Releases  → bodycheckout-service
       server.ts:  app.use('/body-release', bodyReleaseRoutes)
       routes:     router.get('/checkout', listReleasesController)
       shape:      body_releases rows (name_of_deceased,
                   admission_number, date_of_removal, status …)

   • Postmortems → deceased-service
       server.ts:  app.use('/', postmortemRequestRoutes)
       routes:     router.get('/postmortem-requests', getPostmortemRequests)
       gateway:    '/deceased' prefix (same convention as DECEASED.*)
       shape:      postmortem_requests rows (deceased_name,
                   admission_number, status, scheduled_date …)
   ───────────────────────────────────────────────────────────── */

const RELEASES_URL = "/body-release/checkout";
const POSTMORTEMS_URL = "/deceased/postmortem-requests";

const unwrap = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  return payload.rows || payload.releases || payload.requests || payload.items || payload.data?.data || [];
};

export async function fetchReleasesFeed() {
  const branches = await resolveBranchList();

  /* Fetch (a few pages of) each branch's body_releases list with its slug as
     x-tenant-slug and tag every row with the branch name, so the dashboard's
     command-centre branch filter and the release panel work like the
     postmortem feed. One branch failing must never blank the others. */
  const fetchBranch = async (b) => {
    const rows = [];
    for (let p = 1; p <= 4; p++) {
      let chunk = [];
      try {
        const res = await api.get(RELEASES_URL, {
          headers: { "x-tenant-slug": b.slug },
          params: { page: p, limit: 100 },
        });
        chunk = unwrap(res.data);
      } catch {
        break;
      }
      if (!Array.isArray(chunk) || !chunk.length) break;
      rows.push(...chunk);
      if (chunk.length < 100) break;
    }
    return (rows || []).map((r) => ({
      ...r,
      branch_name: r?.branch_name || b.name,
      _branchSlug: r?._branchSlug || b.slug,
    }));
  };

  if (branches.length > 1) {
    const perBranch = await Promise.all(branches.map((b) => fetchBranch(b).catch(() => [])));
    return perBranch.flat();
  }
  // single-branch tenant (or resolution failed) — plain fetch
  const res = await api.get(RELEASES_URL);
  return unwrap(res.data);
}

const clean = (v) => String(v || "").trim();

/* Resolve every branch (current branch always included) — mirrors the
   dashboardDataApi branch resolution so all feeds stay consistent. */
const resolveBranchList = async () => {
  const out = [];
  const seen = new Set();
  const push = (slug, name) => {
    const s = clean(slug);
    if (s && s !== "undefined" && s !== "null" && !seen.has(s)) {
      seen.add(s);
      out.push({ slug: s, name: clean(name) || s });
    }
  };

  // 1) cached branch list (stored after login)
  (getBranches() || []).forEach((b) =>
    push(
      b?.branch_slug || b?.branchSlug || b?.branch_db_name || b?.branchDbName || b?.db_name || b?.name,
      b?.branch_name || b?.branchName || b?.name
    )
  );

  // 2) live refresh from the parent tenant (best effort)
  const parent = clean(getParentTenantSlug() || getTenantSlug());
  if (parent) {
    try {
      const r = await api.get(`/tenant/${parent}/branches`);
      const list = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
      list.forEach((b) =>
        push(
          b?.branch_slug || b?.branchSlug || b?.branch_db_name || b?.branchDbName || b?.db_name || b?.name,
          b?.branch_name || b?.branchName || b?.name
        )
      );
    } catch { /* offline — cached list is enough */ }
  }

  // 3) always include the current branch
  push(getBranchSlug() || getTenantSlug(), "Current Branch");

  return out;
};

/* Postmortem REQUESTS across EVERY branch — each branch is queried with its
   slug as x-tenant-slug (the axios interceptor never overrides an explicit
   header) and rows are tagged with branch_name / _branchSlug so the
   dashboard shows requests from all locations, activity by branch. */
export async function fetchPostmortemsFeed() {
  const branches = await resolveBranchList();
  if (branches.length > 1) {
    const perBranch = await Promise.all(
      branches.map(async (b) => {
        try {
          const res = await api.get(POSTMORTEMS_URL, { headers: { "x-tenant-slug": b.slug } });
          const rows = unwrap(res.data);
          return (Array.isArray(rows) ? rows : []).map((r) => ({
            ...r,
            branch_name: r?.branch_name || b.name,
            _branchSlug: r?._branchSlug || b.slug,
          }));
        } catch {
          return []; // one branch failing must never blank the others
        }
      })
    );
    return perBranch.flat();
  }
  // single-branch tenant (or resolution failed) — plain fetch
  const res = await api.get(POSTMORTEMS_URL);
  return unwrap(res.data);
}
