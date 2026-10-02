// WorkshopPanel.jsx
// Workshop surface embedded in the Operations dashboard. Owns the single
// fetch (store inventory + orders + workers) and hands the payloads to the
// Store and Analytics views, so neither makes its own requests.
//
// The module owns a real header — back-to-Operations, title, live status and
// refresh — so the dashboard never leaves the user stranded on a page with a
// bare strip of tabs and no way out.

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../utils/context/socketContext";
import { workshopService } from "../components/workshop/services/workshopService";
import { Ic } from "./opsIcons";
import WorkshopAnalytics from "./WorkshopAnalytics";
import StoreView from "./StoreView";
import ModalRouter from "../components/workshop/pages/ModalRouter";
// "Register Worker" adds people to the workshop roster — an admin action.
import { isWorkshopAdmin } from "../utils/workshopRole";

/* Sub-tabs inside the dashboard's Workshop module. Analytics was moved here
   from the workshop app, and the Store now has a dashboard view of its own. */
const TABS = [
  { id: "store", label: "Store", icon: "fa-warehouse" },
  { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
];

/* ONE top navigation for the whole Workshop module.

   There used to be THREE stacked bars: the wp-head (back / title / Live /
   Register Worker / Refresh), then the wp-tabs pill row (Store / Analytics)
   immediately below it, then the analytics panels' own headings. Same idea
   repeated three times in ~120px of vertical space, with the section switcher
   buried under the page title instead of being the most obvious control on
   screen.

   Now it is a single bar: back + title on the left, the Store/Analytics switcher
   in the middle, and the actions on the right. One row, and the section the
   user is actually switching between is the biggest thing in it. */
function TabBar({ active, onChange }) {
  return (
    <div className="wp-tabs" role="tablist" aria-label="Workshop sections">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          className={`wp-tab${active === t.id ? " on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          <i className={`fas ${t.icon}`} aria-hidden="true" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function WorkshopPanel({ onExit }) {
  const { connected } = useSocket();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  // Per-worker, per-month production. Kept separate from `orders` because the
  // live board no longer downloads finished orders, so production MUST come from
  // its own SQL aggregation or every headline figure reads zero.
  const [production, setProduction] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerSaved, setWorkerSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Store / Analytics sub-tab. Store is the landing view: the workshop's
  // numbers start with what is physically on the shelf.
  const [tab, setTab] = useState("store");
  const isAdmin = isWorkshopAdmin();

  const load = useCallback(async () => {
    try {
      setError("");
      const [storeRes, ordersRes, workersRes, productionRes] = await Promise.all([
        workshopService.getStoreInventory().catch(() => ({ data: null, success: false })),
        // The dashboard needs the FULL history, not just the live board. Its Analytics
        // tab counts FINISHED coffins per worker / per month, and that data only
        // exists in completed/delivered orders. Fetching active-only here made
        // "Coffins per Worker" and the trend chart permanently blank.
        //
        // The active-only filter belongs to the workshop's ORDERS TAB for normal
        // users (components/workshop/pages/WorkshopDashboard.jsx), which is a live
        // board of what is on the floor — not here.
        workshopService.getOrders().catch(() => ({ data: [], success: false })),
        workshopService.getWorkers().catch(() => ({ data: [], success: false })),
        workshopService.getWorkerProduction({ months: 12 }).catch(() => ({ data: null, success: false })),
      ]);
      if (storeRes?.success) setStore(storeRes.data);
      if (ordersRes?.success) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (workersRes?.success) setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      if (productionRes?.success && productionRes.data) setProduction(productionRes.data);
    } catch (e) {
      setError(e?.friendlyMessage || e?.message || "Could not load workshop data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createWorker = async (worker) => {
    const res = await workshopService.createWorker({
      full_name: worker.full_name,
      role: worker.role,
    });
    if (res && res.success) {
      setWorkerSaved(`${worker.full_name} added to the workshop roster.`);
      // Close first so the freshly-loaded roster is visible immediately.
      setShowWorkerModal(false);
      await load();
    } else {
      setWorkerSaved("");
      setError(res?.error || "Could not add worker");
    }
  };

  const header = (
    <div className="wp-head">
      <button
        type="button"
        className="wp-back"
        onClick={onExit}
        title="Back to Operations"
        aria-label="Back to Operations"
      >
        <Ic n="arrowL" s={13} />
        Operations
      </button>

      {/* The subtitle "Coffin store, production tracking and worker output" was
          removed: the two tabs below now say Store and Analytics outright, so
          the sentence only restated the switcher. The Live pill stays because
          it reports a real connection state that neither tab communicates. */}
      <div className="wp-head-txt">
        <h1>Workshop</h1>
      </div>

      {/* The section switcher sits INSIDE the header row, not on a second bar
          under it. It is the control the user reaches for most, so it belongs
          where the eye already is. */}
      <TabBar active={tab} onChange={setTab} />

      <div className="wp-head-right">
        <span className={`wp-live${connected ? " on" : ""}`}>
          <i aria-hidden="true" />
          {connected ? "Live" : "Offline"}
        </span>
        {/* Admin-only: adding people to the roster is a management action. It
            lives HERE rather than only on the standalone /workshop page because
            day-to-day users work from this dashboard tab and had no way to
            reach it at all. */}
        {isAdmin && (
          <button
            type="button"
            className="wp-addworker"
            onClick={() => { setWorkerSaved(""); setShowWorkerModal(true); }}
            title="Add a worker to the workshop roster"
          >
            <i className="fas fa-user-plus" aria-hidden="true" style={{ fontSize: 11 }} />
            Register Worker
          </button>
        )}
        <button
          type="button"
          className="wp-refresh"
          onClick={load}
          disabled={loading}
          title="Reload workshop data"
        >
          <span className={loading ? "spin" : ""}><Ic n="sync" s={13} /></span>
          Refresh
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="wp-wrap">
        {header}
        <div className="wp-loading">Loading workshop data…</div>
        {showWorkerModal && (
          <ModalRouter type="createWorker" onClose={() => setShowWorkerModal(false)} onSubmit={createWorker} />
        )}
      </div>
    );
  }

  return (
    <div className="wp-wrap">
      {header}

      {error ? <div className="wp-err">{error}</div> : null}
      {workerSaved ? <div className="wp-ok">{workerSaved}</div> : null}

      {/* No <TabBar /> here any more — it is part of `header` above, so the
          module is a single navigation row rather than a header plus a second
          bar repeating the same job. */}

      {tab === "store" ? (
        <StoreView store={store} onChanged={load} />
      ) : (
        <div className="wp-grid">
          <section className="wp-analytics">
            <WorkshopAnalytics orders={orders} workers={workers} production={production} />
          </section>
        </div>
      )}

      {showWorkerModal && (
        <ModalRouter type="createWorker" onClose={() => setShowWorkerModal(false)} onSubmit={createWorker} />
      )}
    </div>
  );
}
