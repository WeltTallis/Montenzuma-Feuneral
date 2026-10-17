import { useMemo, useState } from "react";
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, Boxes, ChevronRight,
  Clock3, Factory, PackageCheck, Search, SlidersHorizontal, TrendingUp,
  UsersRound, Warehouse,
} from "lucide-react";
import "./coffin-command-center.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FINISHED = new Set(["completed", "delivered", "store", "dispatched", "collected"]);
const STAGES = [
  ["Building", ["pending", "building", "design"]],
  ["Waiting bay", ["waiting_bay", "waiting", "inspection"]],
  ["Painting", ["painting"]],
  ["Interior", ["interior", "upholstery"]],
  ["Ready", ["completed", "delivered", "store", "dispatched", "collected"]],
];

const nameOf = (worker) => String(worker?.full_name || `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() || "Unassigned");
const initials = (name) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const dateOf = (order) => order.completed_at || order.updated_at || order.order_date || order.created_at || order.createdAt;
const formatAgo = (value) => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const hours = Math.max(0, Math.round((Date.now() - time) / 36e5));
  return hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
};
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";
};

function ownsOrder(worker, order) {
  const workerId = String(worker?.user_id ?? worker?.id ?? "");
  if (Array.isArray(order?.assignments) && order.assignments.some((assignment) => String(assignment.user_id) === workerId)) return true;
  if (order?.assigned_to != null && String(order.assigned_to) === workerId) return true;
  return String(order?.assigned_to_name || "").trim().toLowerCase() === nameOf(worker).toLowerCase();
}

function MiniTrend({ values }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 8 + index * 38;
    const y = 67 - (value / max) * 50;
    return `${x},${y}`;
  }).join(" ");
  const area = `8,72 ${points} 198,72`;
  return (
    <svg className="cc-trend" viewBox="0 0 206 80" role="img" aria-label="Monthly production trend">
      <defs>
        <linearGradient id="ccTrendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7c3aed" stopOpacity=".28" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${area}`} fill="url(#ccTrendFill)" />
      <polyline points={points} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => <circle key={index} cx={8 + index * 38} cy={67 - (value / max) * 50} r="3.5" fill="#fff" stroke="#7c3aed" strokeWidth="2" />)}
    </svg>
  );
}

function ProductionBars({ values }) {
  const max = Math.max(1, ...values);
  return (
    <div className="cc-bars" aria-label="Six month production chart">
      {values.map((value, index) => (
        <div className="cc-bar-group" key={index}>
          <div className="cc-bar-value">{value || ""}</div>
          <div className="cc-bar-track"><i style={{ height: `${Math.max(value ? 10 : 2, (value / max) * 100)}%` }} /></div>
          <span>{MONTHS[(new Date().getMonth() - 5 + index + 12) % 12]}</span>
        </div>
      ))}
    </div>
  );
}

export default function CoffinCommandCenter({ orders = [], workers = [], production, targets, store, onOpenStore }) {
  const [workerFilter, setWorkerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const data = useMemo(() => {
    const now = new Date();
    const currentKey = monthKey(now);
    const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const productionByWorker = new Map((production?.workers || []).map((entry) => [String(entry.worker_id), entry]));
    const staff = workers.map((worker, index) => {
      const record = productionByWorker.get(String(worker.user_id ?? worker.id));
      const monthly = record?.monthly || {};
      const active = orders.filter((order) => ownsOrder(worker, order) && !FINISHED.has(String(order.status || "").toLowerCase())).length;
      return {
        id: String(worker.user_id ?? worker.id),
        name: nameOf(worker),
        role: worker.role || "Craft worker",
        output: Number(record?.total) || 0,
        month: Number(monthly[currentKey]) || 0,
        previous: Number(monthly[previousKey]) || 0,
        active,
        tint: ["violet", "blue", "amber", "rose", "teal"][index % 5],
      };
    }).sort((a, b) => b.month - a.month || b.output - a.output);

    const finished = orders.filter((order) => FINISHED.has(String(order.status || "").toLowerCase()));
    const currentOutput = staff.reduce((total, worker) => total + worker.month, 0) || finished.filter((order) => monthKey(new Date(dateOf(order))) === currentKey).length;
    const priorOutput = staff.reduce((total, worker) => total + worker.previous, 0);
    const target = Number((targets?.months || []).find((entry) => entry.month === currentKey)?.target) || 0;
    const monthValues = Array.from({ length: 6 }, (_, index) => {
      const cursor = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = monthKey(cursor);
      return staff.reduce((sum, worker) => sum + (Number(productionByWorker.get(worker.id)?.monthly?.[key]) || 0), 0);
    });
    const activeOrders = orders.filter((order) => !FINISHED.has(String(order.status || "").toLowerCase()));
    const stageCounts = STAGES.map(([label, statuses]) => ({ label, count: orders.filter((order) => statuses.includes(String(order.status || "").toLowerCase())).length }));
    const inventory = (store?.items || []).map((item) => ({
      key: item.item_key,
      name: item.item_name || item.item_key,
      type: item.item_type || "Coffin",
      quantity: Number(item.quantity) || 0,
      unit: item.unit || "units",
    }));
    const coffinStock = inventory.filter((item) => item.type === "Coffin");
    const stockTotal = coffinStock.reduce((total, item) => total + item.quantity, 0);
    const activity = [
      ...activeOrders.map((order) => ({ type: "In production", title: order.coffin_name || order.name || "Coffin order", time: dateOf(order), tone: "violet" })),
      ...finished.map((order) => ({ type: "Completed", title: order.coffin_name || order.name || "Coffin order", time: dateOf(order), tone: "green" })),
      ...(store?.history || []).map((entry) => ({ type: String(entry.action || "Stock update").toLowerCase(), title: entry.item_name || entry.item_key || "Inventory", time: entry.txn_date, tone: String(entry.action || "").toUpperCase() === "DISPATCH" ? "amber" : "blue" })),
    ].filter((item) => item.time).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
    return { staff, currentOutput, priorOutput, target, monthValues, activeOrders, stageCounts, inventory, coffinStock, stockTotal, activity };
  }, [orders, workers, production, targets, store]);

  const outputDelta = data.priorOutput ? Math.round(((data.currentOutput - data.priorOutput) / data.priorOutput) * 100) : 0;
  const completion = data.target ? Math.min(100, Math.round((data.currentOutput / (data.target * Math.max(1, workers.length))) * 100)) : 0;
  const filteredStaff = data.staff.filter((worker) => (workerFilter === "all" || worker.id === workerFilter) && worker.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = data.coffinStock.filter((item) => item.quantity <= 2).length;

  return (
    <section className="cc-shell">
      <div className="cc-hero">
        <div>
          <p className="cc-eyebrow"><span /> Operations overview</p>
          <h2>Make every coffin count.</h2>
          <p className="cc-subtitle">A clear view of workshop output, production flow, and ready-to-dispatch stock.</p>
        </div>
        <div className="cc-hero-actions">
          <div className="cc-live"><i /> Live workshop</div>
          <button className="cc-primary" type="button" onClick={onOpenStore}><Warehouse size={16} /> Manage inventory</button>
        </div>
      </div>

      <div className="cc-kpis">
        <article className="cc-kpi cc-kpi--purple"><div className="cc-kpi-icon"><Factory size={19} /></div><span>This month</span><strong>{data.currentOutput}</strong><p className={outputDelta >= 0 ? "good" : ""}>{outputDelta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(outputDelta)}% vs. last month</p></article>
        <article className="cc-kpi"><div className="cc-kpi-icon cc-kpi-icon--blue"><Clock3 size={19} /></div><span>On the floor</span><strong>{data.activeOrders.length}</strong><p>{data.stageCounts[0].count} in build · {data.stageCounts[2].count} in paint</p></article>
        <article className="cc-kpi"><div className="cc-kpi-icon cc-kpi-icon--green"><PackageCheck size={19} /></div><span>Ready to dispatch</span><strong>{data.stockTotal}</strong><p className={lowStock ? "warn" : ""}>{lowStock ? `${lowStock} stock line${lowStock === 1 ? "" : "s"} needs attention` : "Stock levels are healthy"}</p></article>
        <article className="cc-kpi"><div className="cc-kpi-icon cc-kpi-icon--orange"><UsersRound size={19} /></div><span>Active craftspeople</span><strong>{data.staff.length}</strong><p>{data.staff.reduce((total, worker) => total + worker.active, 0)} assignments in progress</p></article>
      </div>

      <div className="cc-grid cc-grid--primary">
        <article className="cc-card cc-production-card">
          <div className="cc-card-head"><div><p>Production analytics</p><h3>Six-month output</h3></div><button type="button" className="cc-quiet-button">Last 6 months <ChevronRight size={14} /></button></div>
          <ProductionBars values={data.monthValues} />
          <div className="cc-chart-foot"><span><i className="cc-key cc-key--purple" /> Finished coffins</span><strong>{data.monthValues.reduce((sum, value) => sum + value, 0)} total</strong></div>
        </article>
        <article className="cc-card cc-target-card">
          <div className="cc-card-head"><div><p>Monthly target</p><h3>Output pacing</h3></div><TrendingUp size={19} /></div>
          <div className="cc-target-body">
            <div className="cc-ring" style={{ "--progress": `${completion * 3.6}deg` }}><div><strong>{completion}%</strong><span>complete</span></div></div>
            <div><strong className="cc-target-number">{data.currentOutput}<small> / {data.target ? data.target * Math.max(1, workers.length) : "—"}</small></strong><p>{data.target ? "Coffins finished against this month’s team target" : "Set a monthly target to measure workshop pacing"}</p></div>
          </div>
          <div className="cc-target-note"><span>Run rate</span><b>{data.currentOutput ? `${Math.max(1, Math.round(data.currentOutput / Math.max(1, new Date().getDate()) * 7))} per week` : "No output yet"}</b></div>
        </article>
      </div>

      <div className="cc-grid cc-grid--secondary">
        <article className="cc-card cc-flow-card">
          <div className="cc-card-head"><div><p>Workshop flow</p><h3>Where work is right now</h3></div><button type="button" className="cc-link-button">View board <ChevronRight size={14} /></button></div>
          <div className="cc-stage-list">{data.stageCounts.map((stage, index) => <div className="cc-stage" key={stage.label}><span className={`cc-stage-dot cc-stage-dot--${index}`} /><div><b>{stage.label}</b><small>{index === 4 ? "Awaiting dispatch" : "In progress"}</small></div><strong>{stage.count}</strong></div>)}</div>
        </article>
        <article className="cc-card cc-stock-card">
          <div className="cc-card-head"><div><p>Inventory snapshot</p><h3>Finished coffin stock</h3></div><button type="button" className="cc-link-button" onClick={onOpenStore}>Open inventory <ChevronRight size={14} /></button></div>
          <div className="cc-stock-list">{data.coffinStock.slice(0, 4).map((item) => <div className="cc-stock-row" key={item.key}><div className="cc-stock-icon"><Boxes size={17} /></div><div><b>{item.name}</b><small>{item.type}</small></div><strong className={item.quantity <= 2 ? "low" : ""}>{item.quantity} <small>{item.unit}</small></strong></div>)}{!data.coffinStock.length && <div className="cc-empty">No finished coffin stock yet.</div>}</div>
          {!!data.coffinStock.length && <div className="cc-stock-footer"><span><i className={lowStock ? "alert" : ""} />{lowStock ? `${lowStock} item type${lowStock === 1 ? "" : "s"} running low` : "All stock levels are on track"}</span><button type="button" onClick={onOpenStore}>Manage</button></div>}
        </article>
      </div>

      <div className="cc-grid cc-grid--lower">
        <article className="cc-card cc-team-card">
          <div className="cc-card-head cc-team-head"><div><p>Team performance</p><h3>Craftspeople leaderboard</h3></div><div className="cc-tools"><label><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find worker" /></label><button type="button" aria-label="Filter workers"><SlidersHorizontal size={16} /></button></div></div>
          <div className="cc-team-list">{filteredStaff.map((worker) => <div className="cc-worker" key={worker.id} onClick={() => setWorkerFilter(workerFilter === worker.id ? "all" : worker.id)} role="button" tabIndex={0}><span className={`cc-avatar cc-avatar--${worker.tint}`}>{initials(worker.name)}</span><div className="cc-worker-name"><b>{worker.name}</b><small>{worker.role}</small></div><div className="cc-worker-stat"><span>Made this month</span><b>{worker.month}</b></div><div className="cc-worker-stat"><span>On floor</span><b>{worker.active}</b></div><MiniTrend values={data.monthValues.slice(-5).map((value) => worker.month ? Math.max(0, Math.round(value * (worker.month / Math.max(1, data.currentOutput)))) : 0)} /></div>)}{!filteredStaff.length && <div className="cc-empty">No workers match this search.</div>}</div>
        </article>
        <article className="cc-card cc-activity-card">
          <div className="cc-card-head"><div><p>Activity</p><h3>Latest updates</h3></div><button type="button" className="cc-link-button">All activity <ChevronRight size={14} /></button></div>
          <div className="cc-activity-list">{data.activity.map((item, index) => <div className="cc-activity" key={`${item.title}-${index}`}><span className={`cc-activity-mark cc-activity-mark--${item.tone}`} /><div><b>{item.title}</b><small>{item.type}</small></div><time>{formatAgo(item.time)}<small>{formatDate(item.time)}</small></time></div>)}{!data.activity.length && <div className="cc-empty"><AlertCircle size={18} /> No workshop activity has been recorded yet.</div>}</div>
        </article>
      </div>
    </section>
  );
}
