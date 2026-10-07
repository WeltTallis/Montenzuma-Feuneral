"use  strict"
import { workshopService } from "../components/workshop/services/workshopService";
import ModalRouter from "../components/workshop/pages/ModalRouter";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../utils/context/socketContext";
import { isWorkshopAdmin } from "../utils/workshopRole";
import WorkshopAnalytics from "./WorkshopAnalytics";
import StoreView from "./StoreView";
import { Ic } from "./opsIcons";

/* Sub-tabs inside the dashboard's Workshop module. Analytics was moved here
   from the workshop app, and the Store now has a dashboard view of its own.

   ORDER MATTERS: Analytics is first and is also the landing view. Analytics is
   the reason an owner opens this module — it answers "are we on track, and who
   is producing" — whereas the Store is a look-up ("did that coffin leave yet")
   that most visits never need. */

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

function TargetModal({ months, workerTargets, workers, production, onSave, onClose }) {
  /* Whose target is being edited: "workshop", or a worker id. Both live in the
     same 12-month grid so the admin sees one screen whichever scope they pick. */
  const [scope, setScope] = useState("workshop");
  const [err, setErr] = useState("");

  const workerOptions = (workers || []).map((w) => ({
    id: String(w.user_id ?? w.id),
    name: String(w.full_name || `${w.first_name || ""} ${w.last_name || ""}`.trim() || "Worker"),
  }));

  /* Which "made" figure belongs to the chosen scope. Workshop scope reads the
     server's per-month `produced`; a worker scope reads that worker's own
     per-month bucket from the worker-production report — so the "N made" beside
     each input is always the number the target will actually be judged against. */
  const producedFor = (monthKey) => {
    if (scope === "workshop") {
      return Number((months || []).find((m) => m.month === monthKey)?.produced) || 0;
    }
    const w = (production?.workers || []).find((x) => String(x.worker_id) === String(scope));
    return Number(w?.monthly?.[monthKey]) || 0;
  };

  /* The target already set for THIS scope, so switching to a worker shows that
     worker's numbers instead of re-using the workshop's. */
  const targetFor = (monthKey) => {
    if (scope === "workshop") {
      return Number((months || []).find((m) => m.month === monthKey)?.target) || 0;
    }
    const row = (workerTargets || []).find(
      (x) => String(x.worker_id) === String(scope) && String(x.month) === monthKey
    );
    return Number(row?.target) || 0;
  };

  const buildDraft = () => {
    const o = {};
    (months || []).forEach((m) => {
      const t = targetFor(m.month);
      o[m.month] = t > 0 ? String(t) : "";
    });
    return o;
  };

  const [draft, setDraft] = useState(buildDraft);

  /* Switching scope must rebuild the sheet, or a worker's sheet would still be
     showing the workshop's numbers. `months`/`workerTargets` are stable for the
     life of the modal, so scope is the only trigger that matters here. */
  useEffect(() => { setDraft(buildDraft()); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    // Validate everything before writing, so a typo in month 7 does not leave
    // months 1-6 saved and 7-12 missing.
    for (const m of months || []) {
      const raw = (draft[m.month] ?? "").trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        setErr(`${m.month} must be a whole number of coffins.`);
        return;
      }
    }
    setErr("");
    // null = the workshop-wide target; a worker id = that worker's own target.
    const workerId = scope === "workshop" ? null : scope;
    for (const m of months || []) {
      const raw = (draft[m.month] ?? "").trim();
      // Blank is saved as 0 rather than skipped, so clearing a target that was
      // previously set actually removes it instead of silently keeping the old
      // number in place.
      await onSave(m.month, raw === "" ? 0 : Number(raw), workerId);
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
            <label htmlFor="wp-target-who">Target applies to</label>
            <select
              id="wp-target-who"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="workshop">Whole workshop</option>
              {workerOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <p className="wp-target-sub">
            {scope === "workshop"
              ? "How many coffins the workshop aims to finish each month. Leave a month blank to track it without a target."
              : `How many coffins ${workerOptions.find((w) => w.id === scope)?.name || "this worker"} is expected to finish each month. A month they reach it turns green on the analytics.`}
          </p>

          <div className="wp-target-grid">
            {(months || []).map((m) => {
              const val = draft[m.month] ?? "";
              const has = val.trim() !== "";
              const produced = producedFor(m.month);
              const pct = has && Number(val) > 0
                ? Math.min(100, Math.round((produced / Number(val)) * 100))
                : 0;
              const met = has && Number(val) > 0 && produced >= Number(val);
              return (
                <div className="wp-target-cell" key={m.month}>
                  <label>{m.month}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="—"
                    value={val}
                    onChange={(e) => setDraft((d) => ({ ...d, [m.month]: e.target.value }))}
                  />
                  <div className="wp-target-actual">
                    <span className={met ? "met" : ""}>{produced} made</span>
                    {has && Number(val) > 0 && (
                      <span className={met ? "met" : "miss"}>
                        {met ? "Target met" : `${pct}%`}
                      </span>
                    )}
                  </div>
                  <div className="wp-target-track">
                    <span
                      className={met ? "met" : ""}
                      style={has && Number(val) > 0 ? { width: `${pct}%` } : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {err ? <div className="wp-err">{err}</div> : null}
        </div>

        <div className="wp-target-foot">
          <button type="button" className="wp-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="wp-addworker" onClick={save}>Save Targets</button>
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
      setTargetSaved(`Target for ${who} in ${month} set to ${qty} coffin${Number(qty) === 1 ? "" : "s"}.`);
      setTargetOpen(false);
      // Reload so the chart reflects the new mark immediately rather than waiting
      // for the next refresh cycle.
      await load();
    } else {
      setError(res?.error || "Could not save target");
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
      {/* Monthly target is an admin setting, exactly like Register Worker — it is
          a commitment the workshop makes, not something a worker needs to see.
          The set-target control opens on the month being viewed. */}
      <TabBar active={tab} onChange={setTab} />

      {isAdmin && (
        <button
          type="button"
          className="wp-addworker"
          onClick={() => setTargetOpen(true)}
          title="Set how many coffins the workshop aims to finish each month"
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
          workerTargets={targets?.workerTargets || []}
          workers={workers}
          production={production}
          onSave={saveTarget}
          onClose={() => { setTargetSaved(""); setTargetOpen(false); }}
        />
      )}
    </div>
  );
}
