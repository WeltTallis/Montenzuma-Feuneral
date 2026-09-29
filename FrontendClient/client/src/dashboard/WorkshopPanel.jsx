// WorkshopPanel.jsx
// Workshop surface embedded in the Operations dashboard. Owns the single
// fetch (store inventory + orders + workers) and hands the payloads to the
// Store and Analytics views, so neither makes its own requests.

import { useCallback, useEffect, useState } from "react";
import { workshopService } from "../components/workshop/services/workshopService";
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

export default function WorkshopPanel() {
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

  if (loading) {
    return (
      <div className="wp-wrap">
        <div className="wp-loading">Loading workshop data…</div>
      </div>
    );
  }

  return (
    <div className="wp-wrap">
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
