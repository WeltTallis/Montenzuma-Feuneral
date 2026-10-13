"use  strict"
import { workshopService } from "../components/workshop/services/workshopService";
import ModalRouter from "../components/workshop/pages/ModalRouter";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../utils/context/socketContext";
import { isWorkshopAdmin } from "../utils/workshopRole";
import WorkshopAnalytics from "./WorkshopAnalytics";
import StoreView from "./StoreView";
import { Ic } from "./opsIcons";


const TABS = [
  { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
  { id: "store", label: "Store", icon: "fa-warehouse" },
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

/* "2026-10" -> "Oct 2026" — readable labels for the month select and the
   saved-confirmation banner. */
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (key) => {
  const [y, m] = String(key).split("-");
  const name = MONTH_SHORT[Number(m) - 1];
  return name ? `${name} ${y}` : String(key);
};

/* Single-value target dialog — the layout the modal stylesheet was written
   for: pick a month, type ONE number (the coffins each worker must finish
   this month), save. The old 12-month grid lost its CSS when the stylesheet
   was converted (`.wp-target-grid` / `.wp-target-cell` were deleted), so the
   cells rendered with no styling at all, and its save loop closed the dialog
   after writing the first month. */
function TargetModal({ months, onSave, onClose }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const keys = (months || []).map((m) => m.month).filter(Boolean);
  const monthKeys = keys.length ? keys : [currentKey];

  const [month, setMonth] = useState(monthKeys.includes(currentKey) ? currentKey : monthKeys[0]);
  const [qty, setQty] = useState("");

  /* Re-seed the input whenever the month changes so it shows what is already
     saved for that month (blank when none is set yet). */
  useEffect(() => {
    const saved = Number((months || []).find((m) => m.month === month)?.target) || 0;
    setQty(saved > 0 ? String(saved) : "");
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const savedRow = (months || []).find((m) => m.month === month);
  const produced = Number(savedRow?.produced) || 0;
  const targetNum = Number(qty) > 0 ? Number(qty) : 0;
  const pct = targetNum > 0 ? Math.min(100, Math.round((produced / targetNum) * 100)) : 0;
  const met = targetNum > 0 && produced >= targetNum;

  const save = async () => {
    const raw = String(qty ?? "").trim();
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        setErr("Target must be a whole number of coffins, e.g. 8.");
        return;
      }
    }
    setErr("");
    setBusy(true);
    try {
      // Blank is saved as 0, which clears the month's target. workerId is null:
      // ONE shared number that every worker is measured against.
      const res = await onSave(month, raw === "" ? 0 : Number(raw), null);
      if (res && res.success === false) setErr(res.error || "Could not save target");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="wp-modal-ov" onClick={onClose} />
      <div className="wp-target-modal" role="dialog" aria-label="Set monthly coffin target">
        <div className="wp-target-head">
          <h3>Monthly Coffin Target</h3>
          <button type="button" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="wp-target-body">
          <div className="wp-target-scope">
            <label htmlFor="wp-target-month">Month</label>
            <select
              id="wp-target-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthKeys.map((k) => (
                <option key={k} value={k}>{monthLabel(k)}</option>
              ))}
            </select>
          </div>

          <p className="wp-target-sub">
            The number of coffins each worker must finish in the selected
            month. Leave the field blank to track the month without a target.
          </p>

          <div className="wp-target-single">
            <label htmlFor="wp-target-qty">Target per worker</label>
            <div className="wp-target-single-row">
              <input
                id="wp-target-qty"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="e.g. 8"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <span className="wp-target-unit">coffins each<br />this month</span>
            </div>

            <div className="wp-target-actual">
              <span>{produced} made</span>
              {targetNum > 0 && (
                <span className={met ? "met" : "miss"}>
                  {met ? "Target met" : `${pct}%`}
                </span>
              )}
            </div>
          </div>

          {err ? <div className="wp-target-err">{err}</div> : null}
        </div>

        <div className="wp-target-foot">
          <button type="button" className="wp-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="wp-addworker" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save Target"}
          </button>
        </div>
      </div>
    </>
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
  // Monthly output target. `targets.months` is all twelve months of the year,
  // each with target / produced / met, so the chart can mark attainment without
  // the client having to fill gaps in the year itself.
  const [targets, setTargets] = useState(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetSaved, setTargetSaved] = useState("");
  const [workerSaved, setWorkerSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Analytics / Store sub-tab. Analytics lands first: it is what the owner
  // opens the module for. The Store is a second-look screen.
  const [tab, setTab] = useState("analytics");
  const isAdmin = isWorkshopAdmin();

  const load = useCallback(async () => {
    try {
      setError("");
      const [storeRes, ordersRes, workersRes, productionRes, targetsRes] = await Promise.all([
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
        // Targets are additive: if this call fails the rest of the dashboard still
        // renders and simply shows no target marks.
        workshopService.getMonthlyTargets({ year: new Date().getFullYear() })
          .catch(() => ({ data: null, success: false })),
      ]);
      if (storeRes?.success) setStore(storeRes.data);
      if (ordersRes?.success) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (workersRes?.success) setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
      if (productionRes?.success && productionRes.data) setProduction(productionRes.data);
      if (targetsRes?.success && targetsRes.data) setTargets(targetsRes.data);
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

  const saveTarget = async (month, qty, workerId = null) => {
    const res = await workshopService.setMonthlyTarget(month, qty, workerId);
    if (res && res.success) {
      const who = workerId
        ? (workers.find((w) => String(w.user_id ?? w.id) === String(workerId))?.full_name || "Worker")
        : "the workshop";
      setTargetSaved(qty > 0
        ? `Target for ${who} in ${monthLabel(month)} set to ${qty} coffin${Number(qty) === 1 ? "" : "s"} per worker.`
        : `Target for ${who} in ${monthLabel(month)} cleared.`);
      setTargetOpen(false);
      // Reload so the chart reflects the new mark immediately rather than waiting
      // for the next refresh cycle.
      await load();
    } else {
      setError(res?.error || "Could not save target");
    }
    // Returned so the modal can show a failure inline instead of silently
    // staying open with no message.
    return res;
  };

  const header = (
    <div className="wp-head">
      <div className="wp-head-brand">
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
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      <div className="wp-head-actions">
        {isAdmin && (
          <button
            type="button"
            className="wp-addworker"
            onClick={() => setTargetOpen(true)}
            title="Set the number of coffins every worker must finish this month"
          >
            <i className="fas fa-bullseye" aria-hidden="true" style={{ fontSize: 11 }} />
            Set Target
          </button>
        )}
        <div className="wp-head-right">
          <span className={`wp-live${connected ? " on" : ""}`}>
            <i aria-hidden="true" />
            {connected ? "Live" : "Offline"}
          </span>
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
      {targetSaved ? <div className="wp-ok">{targetSaved}</div> : null}

      {/* No <TabBar /> here any more — it is part of `header` above, so the
          module is a single navigation row rather than a header plus a second
          bar repeating the same job. */}

      {tab === "store" ? (
        <StoreView store={store} onChanged={load} />
      ) : (
        <div className="wp-grid">
          <section className="wp-analytics">
            <WorkshopAnalytics
              orders={orders}
              workers={workers}
              production={production}
              targets={targets}
            />
          </section>
        </div>
      )}

      {showWorkerModal && (
        <ModalRouter type="createWorker" onClose={() => setShowWorkerModal(false)} onSubmit={createWorker} />
      )}

      {/* Admin-only. Rendered here rather than in the header so it is a sibling
          of the rest of the content and cannot disturb the single nav bar. */}
      {targetOpen && (
        <TargetModal
          months={targets?.months || []}
          onSave={saveTarget}
          onClose={() => { setTargetSaved(""); setTargetOpen(false); }}
        />
      )}
    </div>
  );
}
