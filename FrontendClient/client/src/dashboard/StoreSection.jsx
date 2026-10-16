/* StoreSection.jsx — the dashboard shell's Store destination.
   Loads the workshop store payload once (same calls as WorkshopPanel) and
   hands it to the existing StoreView (inventory by coffin type + the
   dispatch/restock journal). Refreshes after every write via onChanged. */
import { useCallback, useEffect, useState } from "react";
import { workshopService } from "../components/workshop/services/workshopService";
import { useSocket } from "../utils/context/socketContext";
import { Ic } from "./opsIcons";
import StoreView from "./StoreView";

export default function StoreSection() {
  const { connected } = useSocket();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setErr("");
      const res = await workshopService.getStoreInventory().catch(() => ({ data: null, success: false }));
      if (res?.success) setStore(res.data);
      else setErr(res?.error || "Could not load store inventory");
    } catch (e) {
      setErr(e?.friendlyMessage || e?.message || "Could not load store inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="empty" style={{ padding: 90 }}>
        <span className="spin" style={{ color: "var(--acc)" }}><Ic n="sync" s={22} /></span>
        <span style={{ fontSize: 12 }}>Loading store…</span>
      </div>
    );
  }
  if (err && !store) {
    return (
      <div className="empty" style={{ padding: 90 }}>
        <Ic n="store" s={26} />
        <b>Could not load the store</b>
        <span style={{ fontSize: 12 }}>{err}</span>
        <button type="button" className="btn-acc" onClick={load}>Retry</button>
      </div>
    );
  }
  return (
    <div className="sv-page">
      <div className="sv-page-head">
        <div><h1>Store</h1><p>Coffin inventory by type, dispatches and restocks.</p></div>
        <span className={`wp-live${connected ? " on" : ""}`}>
          <i aria-hidden="true" />{connected ? "Live" : "Offline"}
        </span>
      </div>
      {err ? <div className="wp-err">{err}</div> : null}
      <StoreView store={store} onChanged={load} />
    </div>
  );
}
