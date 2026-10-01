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

/* Sub-tabs inside the dashboard's Workshop module. Analytics was moved here
   from the workshop app, and the Store now has a dashboard view of its own. */
const TABS = [
  { id: "store", label: "Store", icon: "fa-warehouse" },
  { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Store / Analytics sub-tab. Store is the landing view: the workshop's
  // numbers start with what is physically on the shelf.
  const [tab, setTab] = useState("store");

  const load = useCallback(async () => {
    try {
      setError("");
      const [storeRes, ordersRes, workersRes] = await Promise.all([
        workshopService.getStoreInventory().catch(() => ({ data: null, success: false })),
        workshopService.getOrders().catch(() => ({ data: [], success: false })),
        workshopService.getWorkers().catch(() => ({ data: [], success: false })),
      ]);
      if (storeRes?.success) setStore(storeRes.data);
      if (ordersRes?.success) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (workersRes?.success) setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
    } catch (e) {
      setError(e?.friendlyMessage || e?.message || "Could not load workshop data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

      <div className="wp-head-txt">
        <h1>Workshop</h1>
        <p>Coffin store, production tracking and worker output</p>
      </div>

      <div className="wp-head-right">
        <span className={`wp-live${connected ? " on" : ""}`}>
          <i aria-hidden="true" />
          {connected ? "Live" : "Offline"}
        </span>
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
      </div>
    );
  }

  return (
    <div className="wp-wrap">
      {header}

      {error ? <div className="wp-err">{error}</div> : null}

      <TabBar active={tab} onChange={setTab} />

      {tab === "store" ? (
        <StoreView store={store} onChanged={load} />
      ) : (
        <div className="wp-grid">
          <section className="wp-analytics">
            <WorkshopAnalytics orders={orders} workers={workers} />
          </section>
        </div>
      )}
    </div>
  );
}
