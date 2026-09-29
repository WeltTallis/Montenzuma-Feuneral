// StoreView.jsx
// The workshop Store, surfaced in the dashboard: inventory counted BY COFFIN
// TYPE, a calendar/history journal of every dispatch and restock, plus the
// dispatch + restock actions. Takes the already-fetched `store` payload and
// calls `onChanged` after a write so the panel refreshes.

import { useEffect, useMemo, useState } from "react";
import { getTenantSlug } from "../utils/globalAuth";
import { workshopService } from "../components/workshop/services/workshopService";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const keyOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
/** "2025-09-22" -> "Mon 22 September 2025", parsed as LOCAL so it never shifts. */
const fmtDay = (k) => {
  const [y, m, d] = String(k).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
};
const isDispatch = (t) => String(t?.action || "").toUpperCase() === "DISPATCH";

/* Capacity is a per-tenant local preference, reusing the same key the
   workshop Store tab already writes, so both screens agree on "full". */
const capKey = () => `workshop.store.capacity.${getTenantSlug() || "default"}`;
const readCap = () => {
  try { return Math.max(1, parseInt(localStorage.getItem(capKey()), 10) || 50); }
  catch { return 50; }
};
const writeCap = (v) => {
  try { localStorage.setItem(capKey(), String(v)); } catch { /* storage blocked */ }
};

export default function StoreView({ store, onChanged }) {
  const [capacity, setCapacity] = useState(readCap);
  const [section, setSection] = useState("cal");
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(todayKey);
  // {mode:'dispatch'|'restock', item} | null — the single-item modal
  const [modal, setModal] = useState(null);
  // the multi-item aviation drawer
  const [drawer, setDrawer] = useState(null);
  // the transaction detail drawer
  const [txn, setTxn] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── derived ─────────────────────────────────────────────────────────── */

  // Inventory rows: one per store item (coffins are grouped by type upstream).
  const rows = useMemo(() => {
    const outByKey = new Map();
    (Array.isArray(store?.history) ? store.history : []).forEach((h) => {
      if (!isDispatch(h)) return;
      outByKey.set(String(h.item_key), (outByKey.get(String(h.item_key)) || 0) + (Number(h.qty) || 0));
    });
    return (Array.isArray(store?.items) ? store.items : []).map((it) => ({
      key: it.item_key,
      kind: it.item_type || "Item",
      name: it.item_name || it.item_key,
      sub: it.item_sub || "",
      unit: it.unit || "pcs",
      qty: Number(it.quantity) || 0,
      out: outByKey.get(String(it.item_key)) || 0,
    }));
  }, [store]);

  const coffins = useMemo(() => rows.filter((r) => r.kind === "Coffin"), [rows]);

  const inStore = coffins.reduce((s, r) => s + r.qty, 0);
  const units = rows.reduce((s, r) => s + r.qty, 0);
  const capPct = Math.min(100, Math.round((inStore / capacity) * 100));
  const capColor = capPct >= 85 ? "#DC2626" : capPct >= 60 ? "#D97706" : "#34C77B";

  // Every transaction, keyed by local day so the calendar can badge it.
  const history = useMemo(
    () => (Array.isArray(store?.history) ? store.history : []).map((h) => ({
      ...h,
      day: String(h.txn_date || "").slice(0, 10),
    })),
    [store]
  );
  const byDay = useMemo(() => {
    const map = new Map();
    history.forEach((t) => {
      if (!t.day) return;
      if (!map.has(t.day)) map.set(t.day, []);
      map.get(t.day).push(t);
    });
    return map;
  }, [history]);

  const dispToday = Number(store?.stats?.dispatchedToday) || 0;
  const totalDisp = history.filter(isDispatch).reduce((s, t) => s + (Number(t.qty) || 0), 0);
  const totalRest = history.filter((t) => !isDispatch(t)).reduce((s, t) => s + (Number(t.qty) || 0), 0);

  // Calendar cells, Monday-first, padded to whole weeks.
  const cells = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const out = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= dim; d += 1) out.push({ d, key: keyOf(y, m, d) });
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const dayEntries = byDay.get(selectedDay) || [];

  // Escape closes whichever layer is on top, newest first.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (txn) setTxn(null);
      else if (drawer) setDrawer(null);
      else if (modal) setModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [txn, drawer, modal]);

  const setCap = (v) => {
    const n = Math.max(1, parseInt(v, 10) || 1);
    setCapacity(n);
    writeCap(n);
  };
  const shiftMonth = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const openModal = (mode, item) => { setFormError(""); setModal({ mode, item }); };
  const closeModal = () => { if (!busy) setModal(null); };


  /* ── writes ──────────────────────────────────────────────────────────── */

  /** Dispatch or restock one item. Returns success so callers can close. */
  const write = async (mode, item, { qty, date, who, notes }) => {
    const n = parseInt(qty, 10) || 0;
    if (n <= 0) { setFormError("Quantity must be at least 1."); return false; }
    if (mode === "dispatch" && n > item.qty) {
      setFormError(`Only ${item.qty} ${item.unit} of ${item.name} available.`);
      return false;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        item_key: item.key,
        item_type: item.kind,
        item_name: item.name,
        item_sub: item.sub,
        unit: item.unit,
        qty: n,
        date: date || todayKey(),
        notes: notes || "",
      };
      const res = mode === "dispatch"
        ? await workshopService.dispatchStoreItem({ ...payload, picked_by: who || "" })
        : await workshopService.restockStoreItem({ ...payload, received_by: who || "" });
      if (!res || !res.success) {
        setFormError(res?.error || (mode === "dispatch" ? "Dispatch failed" : "Restock failed"));
        return false;
      }
      if (onChanged) onChanged();
      return true;
    } catch (e) {
      setFormError(e?.friendlyMessage || e?.message || "Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="sv">
      {/* -- top bar: stats, capacity, dispatch -- */}
      <div className="sv-topbar">
        <div className="sv-tstats">
          <div className="sv-tstat"><b>{inStore}</b><span>in store</span></div>
          <div className="sv-tsep" />
          <div className="sv-tstat"><b className="up">{dispToday}</b><span>today</span></div>
        </div>

        <div className="sv-tcap">
          <span className="sv-pct" style={{ color: capColor }}>{capPct}%</span>
          <div className="sv-bar"><i style={{ width: `${capPct}%`, background: capColor }} /></div>
          <input
            type="number" min="1" value={capacity} aria-label="Store capacity"
            onChange={(e) => setCap(e.target.value)}
          />
          <span className="sv-units">cap · {inStore} used</span>
        </div>

        <button
          className="sv-btn-dispatch"
          onClick={() => { setFormError(""); setDrawer({ step: 1, picks: {} }); }}
          disabled={coffins.filter((c) => c.qty > 0).length === 0}
        >
          <i className="fas fa-truck-fast" style={{ fontSize: 12 }} /> Dispatch Coffins ({coffins.filter((c) => c.qty > 0).length})
        </button>
      </div>

      {/* -- inventory -- */}
      <div className="sv-panel">
        <div className="sv-panel-head">
          <h2><i className="fas fa-list-check" style={{ color: "#00296B" }} /> Store Inventory</h2>
          <span className="sv-meta">{rows.length} item(s) · {units} units</span>
        </div>

        {rows.length === 0 ? (
          <div className="sv-inv-empty">
            <i className="fas fa-box-open" />
            Nothing in the store yet. Coffins appear here once an order finishes.
          </div>
        ) : (
          rows.map((r) => (
            <div className="sv-inv-row" key={r.key}>
              <div>
                <div className="sv-inv-name">{r.name}</div>
                {r.sub ? <div className="sv-inv-sub">{r.sub}</div> : null}
              </div>
              <span className="sv-inv-kind">{r.kind}</span>
              <span className={`sv-inv-qty${r.qty === 0 ? " zero" : ""}`}>{r.qty} <small>{r.unit}</small></span>
              <span className="sv-inv-out">{r.out} out</span>
              <div className="sv-inv-actions">
                <button className="sv-mini sv-mini--add" onClick={() => openModal("restock", r)}>
                  <i className="fas fa-plus" style={{ fontSize: 9 }} /> Add
                </button>
                <button
                  className="sv-mini sv-mini--disp"
                  onClick={() => openModal("dispatch", r)}
                  disabled={r.qty === 0}
                >
                  <i className="fas fa-truck" style={{ fontSize: 9 }} /> Dispatch
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* -- journal: calendar / history -- */}
      <div className="sv-panel">
        <div className="sv-panel-head">
          <div className="sv-seg">
            <button className={section === "cal" ? "on" : ""} onClick={() => setSection("cal")}>
              <i className="fas fa-calendar-days" style={{ fontSize: 11 }} /> Calendar
            </button>
            <button className={section === "hist" ? "on" : ""} onClick={() => setSection("hist")}>
              <i className="fas fa-clock-rotate-left" style={{ fontSize: 11 }} /> History
            </button>
          </div>

          {section === "cal" ? (
            <div className="sv-monthnav">
              <button onClick={() => shiftMonth(-1)} aria-label="Previous month"><i className="fas fa-chevron-left" /></button>
              <b>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</b>
              <button onClick={() => shiftMonth(1)} aria-label="Next month"><i className="fas fa-chevron-right" /></button>
            </div>
          ) : (
            <span className="sv-meta">{history.length} record(s) · click one for details</span>
          )}
        </div>

        {section === "cal" ? (
          <div className="sv-journal">
            <div className="sv-left">
              <div className="sv-cal-head">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
              <div className="sv-cal-grid">
                {cells.map((c, i) => {
                  if (!c) return <div key={`e${i}`} />;
                  const entries = byDay.get(c.key) || [];
                  const disps = entries.filter(isDispatch).length;
                  const rests = entries.length - disps;
                  const isSel = c.key === selectedDay;
                  const isToday = c.key === todayKey();
                  return (
                    <button
                      key={c.key}
                      className={`sv-day${isSel ? " selected" : ""}${isToday ? " today" : ""}`}
                      onClick={() => setSelectedDay(c.key)}
                    >
                      <span className="sv-dnum">{c.d}</span>
                      {disps > 0 && <span className="sv-badge"><i className="fas fa-truck" style={{ fontSize: 7 }} /> {disps}</span>}
                      {rests > 0 && <span className="sv-badge sv-badge--restock"><i className="fas fa-plus" style={{ fontSize: 7 }} /> {rests}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sv-right">
              <div className="sv-day-title">
                <i className="fas fa-magnifying-glass" style={{ color: "#00296B" }} /> What happened on <span>{fmtDay(selectedDay)}</span>
              </div>
              {dayEntries.length === 0 ? (
                <div className="sv-day-empty">No store activity on this day.</div>
              ) : (
                dayEntries.map((t) => <TxRow key={t.id} t={t} onOpen={() => setTxn(t)} />)
              )}
            </div>
          </div>
        ) : (
          <div className="sv-journal">
            <div className="sv-left" style={{ maxHeight: 460, overflowY: "auto" }}>
              {history.length === 0 ? (
                <div className="sv-day-empty">No store activity recorded yet.</div>
              ) : (
                history.map((t) => <TxRow key={t.id} t={t} onOpen={() => setTxn(t)} />)
              )}
            </div>
            <div className="sv-right">
              <div className="sv-day-title" style={{ marginBottom: 10 }}>
                <i className="fas fa-chart-simple" style={{ color: "#00296B" }} /> Store Activity Summary
              </div>
              <div className="sv-sum"><div className="k">Total Dispatched</div><div className="v disp">{totalDisp} <small>units</small></div></div>
              <div className="sv-sum"><div className="k">Total Restocked</div><div className="v rest">{totalRest} <small>units</small></div></div>
              <div className="sv-sum"><div className="k">Transactions</div><div className="v txn">{history.length} <small>records</small></div></div>
              <div className="sv-day-title" style={{ margin: "12px 0 8px" }}>
                <i className="fas fa-clock-rotate-left" style={{ color: "#00296B" }} /> Most Recent
              </div>
              {history.length === 0 ? (
                <div className="sv-day-empty">Nothing yet.</div>
              ) : (
                <div className="sv-sum">
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{history[0].item_name || history[0].item_key}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)" }}>
                    {isDispatch(history[0]) ? "Dispatched" : "Restocked"} · {fmtDay(history[0].day)}
                    {history[0].txn_by ? ` · by ${history[0].txn_by}` : ""}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* -- overlays -- */}
      {modal && <ItemModal {...modal} busy={busy} error={formError} onClose={closeModal} onWrite={write} />}
      {drawer && (
        <DispatchDrawer
          items={coffins.filter((c) => c.qty > 0)}
          state={drawer}
          setState={setDrawer}
          busy={busy}
          error={formError}
          onClose={() => !busy && setDrawer(null)}
          onWrite={write}
        />
      )}
      {txn && <TxnDrawer t={txn} onClose={() => setTxn(null)} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════════════ */

/** One journal line - shared by the calendar detail pane and History. */
function TxRow({ t, onOpen }) {
  const out = isDispatch(t);
  return (
    <button className="sv-tx" onClick={onOpen}>
      <i className={`fas ${out ? "fa-truck sv-tx-ico disp" : "fa-box-open sv-tx-ico rest"}`} />
      <div className="sv-tx-body">
        <div className="sv-tx-name">
          <b className={out ? "disp" : "rest"}>{out ? "Dispatched" : "Restocked"}</b> · {t.item_name || t.item_key}
        </div>
        <div className="sv-tx-sub">
          {[t.item_sub, t.txn_by ? `by ${t.txn_by}` : "", t.day ? fmtDay(t.day) : ""]
            .filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="sv-tx-qty">
        <div className={`q ${out ? "disp" : "rest"}`}>{out ? "-" : "+"}{Number(t.qty) || 0} {t.unit || "pcs"}</div>
      </div>
      <i className="fas fa-chevron-right sv-chev" />
    </button>
  );
}

/** Shared modal chrome. */
function Modal({ title, icon, tone, onClose, children, foot, max = 460 }) {
  return (
    <div className="sv-overlay open" onClick={onClose}>
      <div className="sv-modal" style={{ maxWidth: max }} onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal-head">
          <h3><i className={`fas ${icon} ${tone}`} /> {title}</h3>
          <button className="sv-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="sv-modal-body">{children}</div>
        {foot ? <div className="sv-modal-foot">{foot}</div> : null}
      </div>
    </div>
  );
}

/** Single-item dispatch / restock. */
function ItemModal({ mode, item, busy, error, onClose, onWrite }) {
  const [qty, setQty] = useState("1");
  const [date, setDate] = useState(todayKey);
  const [who, setWho] = useState("");
  const [notes, setNotes] = useState("");
  const out = mode === "dispatch";

  const submit = async () => {
    const ok = await onWrite(mode, item, { qty, date, who, notes });
    if (ok) onClose();
  };

  return (
    <Modal
      title={out ? "Dispatch from Store" : "Restock Item"}
      icon={out ? "fa-truck disp" : "fa-box-open rest"}
      tone={out ? "disp" : "rest"}
      onClose={onClose}
      foot={
        <>
          <button className="sv-btn sv-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className={`sv-btn ${out ? "sv-btn--danger" : "sv-btn--ok"}`}
            onClick={submit}
            disabled={busy}
          >
            <i className={`fas ${out ? "fa-truck" : "fa-plus"}`} style={{ fontSize: 12 }} />
            {busy ? "Saving..." : out ? "Confirm Dispatch" : "Add to Store"}
          </button>
        </>
      }
    >
      <div className={`sv-note${out ? " sv-note--danger" : ""}`}>
        <div className="n-name">{item.name}</div>
        <div className="n-sub">
          {item.sub ? `${item.sub} · ` : ""}
          {out ? `Available: ${item.qty} ${item.unit}` : `Currently: ${item.qty} ${item.unit}`}
        </div>
      </div>

      {error ? <div className="sv-err">{error}</div> : null}

      <div className="sv-f2">
        <div className="sv-field">
          <label>{out ? "Quantity to Dispatch" : "Quantity to Add"}</label>
          <input
            type="number" min="1" max={out ? item.qty : undefined} value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="sv-field">
          <label>{out ? "Date Dispatched" : "Date"}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="sv-field">
        <label>{out ? "Picked By" : "Received By"}</label>
        <input placeholder="Name of person" value={who} onChange={(e) => setWho(e.target.value)} />
      </div>
      <div className="sv-field">
        <label>Notes</label>
        <textarea rows={2} placeholder="Additional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

/** Multi-item aviation dispatch: pick coffins, then the dispatch details. */
function DispatchDrawer({ items, state, setState, busy, error, onClose, onWrite }) {
  const { step, picks } = state;
  const [date, setDate] = useState(todayKey);
  const [from, setFrom] = useState("Main Workshop Store");
  const [to, setTo] = useState("");
  const [by, setBy] = useState("");
  const [recv, setRecv] = useState("");
  const [driver, setDriver] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [localErr, setLocalErr] = useState("");

  const chosen = items.filter((i) => picks[i.key]);
  const pickedUnits = chosen.reduce((s, i) => s + (parseInt(picks[i.key], 10) || 0), 0);
  const setPick = (key, on, qty) =>
    setState((s) => ({ ...s, picks: on ? { ...s.picks, [key]: qty || 1 } : omit(s.picks, key) }));

  const submit = async () => {
    if (chosen.length === 0) { setLocalErr("Pick at least one coffin."); return; }
    if (!to.trim()) { setLocalErr("Destination is required."); return; }
    if (!by.trim()) { setLocalErr("Dispatched by is required."); return; }
    setLocalErr("");
    // One ledger entry per picked coffin, sent sequentially so each row keeps
    // its own key — the journal then shows them as separate dispatches.
    for (const item of chosen) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await onWrite("dispatch", item, {
        qty: picks[item.key], date, who: by,
        notes: [to && `To: ${to}`, driver && `Driver: ${driver}`, purpose && `Purpose: ${purpose}`, notes]
          .filter(Boolean).join(" · "),
      });
      if (!ok) return;
    }
    onClose();
  };

  return (
    <>
      <div className="sv-drawer-ov open" onClick={onClose} />
      <aside className="sv-drawer open" role="dialog" aria-label="Dispatch coffins">
        <div className="sv-drawer-head">
          <h3><i className="fas fa-truck-fast" /> Dispatch Coffin</h3>
          <button className="sv-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="sv-drawer-body">
          <div className="sv-steps">
            <div className={`sv-step${step === 1 ? " on" : " done"}`}>
              <span className="snum">{step === 2 ? <i className="fas fa-check" style={{ fontSize: 9 }} /> : "1"}</span>
              <span className="slabel">Select Coffin</span>
            </div>
            <i className="fas fa-chevron-right sv-arrow" />
            <div className={`sv-step${step === 2 ? " on" : ""}`}>
              <span className="snum">2</span>
              <span className="slabel">Dispatch Details</span>
            </div>
          </div>

          {step === 1 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tx2)" }}>{items.length} coffin(s) in store</span>
                {chosen.length > 0 && <span className="sv-picked-sum">{chosen.length} selected · {pickedUnits} units</span>}
              </div>
              {items.map((i) => (
                <label className={`sv-pick${picks[i.key] ? " picked" : ""}`} key={i.key}>
                  <input
                    type="checkbox"
                    checked={!!picks[i.key]}
                    onChange={(e) => setPick(i.key, e.target.checked, 1)}
                  />
                  <div className="sv-pick-body">
                    <div className="sv-pick-name">{i.name}</div>
                    <div className="sv-pick-sub">{i.sub ? `${i.sub} · ` : ""}Available: {i.qty} {i.unit}</div>
                  </div>
                  <input
                    type="number" min="1" max={i.qty} value={picks[i.key] || 1}
                    disabled={!picks[i.key]}
                    onChange={(e) => setPick(i.key, true, e.target.value)}
                  />
                </label>
              ))}
            </>
          ) : (
            <>
              <div className="sv-dispatch-id">
                <span className="k">Dispatching</span>
                <span className="v">{chosen.length} type(s) · {pickedUnits} unit(s)</span>
              </div>
              <div className="sv-f2">
                <div className="sv-field"><label>From</label><input value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div className="sv-field"><label className="req">Destination *</label><input placeholder="Destination (required)" value={to} onChange={(e) => setTo(e.target.value)} /></div>
                <div className="sv-field"><label>Date Dispatched</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="sv-field"><label className="req">Dispatched By *</label><input placeholder="Name (required)" value={by} onChange={(e) => setBy(e.target.value)} /></div>
                <div className="sv-field"><label>Driver</label><input value={driver} onChange={(e) => setDriver(e.target.value)} /></div>
                <div className="sv-field"><label>Received By</label><input value={recv} onChange={(e) => setRecv(e.target.value)} /></div>
                <div className="sv-field" style={{ gridColumn: "1/-1" }}><label>Purpose</label><input value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
              </div>
              <div className="sv-field"><label>Remarks</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </>
          )}

          {(error || localErr) ? <div className="sv-err">{localErr || error}</div> : null}
        </div>

        <div className="sv-drawer-foot">
          {step === 2 && (
            <button className="sv-btn sv-btn--ghost" onClick={() => setState((s) => ({ ...s, step: 1 }))} disabled={busy}>
              <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back
            </button>
          )}
          {step === 1 ? (
            <button
              className="sv-btn sv-btn--danger"
              onClick={() => { setLocalErr(""); setState((s) => ({ ...s, step: 2 })); }}
              disabled={chosen.length === 0}
            >
              Next <i className="fas fa-arrow-right" style={{ fontSize: 11 }} />
            </button>
          ) : (
            <button className="sv-btn sv-btn--danger" onClick={submit} disabled={busy}>
              <i className="fas fa-truck-fast" style={{ fontSize: 12 }} /> {busy ? "Dispatching..." : "Confirm & Dispatch"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/** Small helper: drop a key without mutating. */
function omit(obj, key) {
  const out = {};
  Object.keys(obj).forEach((k) => { if (k !== key) out[k] = obj[k]; });
  return out;
}

/** Transaction detail: coloured hero + the fields the ledger actually stores. */
function TxnDrawer({ t, onClose }) {
  const out = isDispatch(t);
  const Field = ({ k, v, full }) => (
    <div className={`sv-txn-field${full ? " full" : ""}`}>
      <div className="k">{k}</div>
      <div className="v">{v || "-"}</div>
    </div>
  );
  return (
    <>
      <div className="sv-txn-ov open" onClick={onClose} />
      <aside className="sv-txn-drawer open" role="dialog" aria-label="Transaction details">
        <div className={`sv-txn-hero ${out ? "disp" : "rest"}`}>
          <span className="act-chip">
            <i className={`fas ${out ? "fa-truck-fast" : "fa-box-open"}`} style={{ fontSize: 9 }} />
            {out ? "Dispatched from Store" : "Restocked into Store"}
          </span>
          <h3>{t.item_name || t.item_key}</h3>
          {t.item_sub ? <div className="sub">{t.item_sub}</div> : null}
          <div className="qty-big">
            {out ? "-" : "+"}{Number(t.qty) || 0} <small>{t.unit || "pcs"}</small>
          </div>
        </div>

        <div className="sv-txn-body">
          <div className="sv-txn-sec">{out ? "Dispatch Record" : "Restock Record"}</div>
          <div className="sv-txn-grid">
            <Field k="Date" v={t.day ? fmtDay(t.day) : ""} />
            <Field k={out ? "Dispatched By" : "Received By"} v={t.txn_by} />
            <Field k="Type" v={t.item_type} />
            <Field k="Quantity" v={`${Number(t.qty) || 0} ${t.unit || "pcs"}`} />
          </div>

          <div className="sv-txn-sec">Notes</div>
          <div className="sv-txn-grid">
            <Field k="" v={t.notes || "No notes recorded."} full />
          </div>
        </div>

        <div className="sv-txn-foot">
          <div className="sv-txn-id-chip">
            <span className="k">Transaction</span>
            <span className="v">#{t.id}</span>
          </div>
          <button className="sv-btn sv-btn--ghost" onClick={onClose}>Close</button>
        </div>
      </aside>
    </>
  );
}
