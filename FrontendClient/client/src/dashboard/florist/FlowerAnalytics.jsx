/* FlowerAnalytics.jsx — the dashboard's Flowers view.
   Ports the florist/chart.html decision engine ("Flower bookings: trends and
   decisions") from sample numbers to REAL bookings (GET /florist/bookings,
   tenant-wide like FlowerBookingsNew), rendered with recharts.
   Decision rule kept verbatim: past-period averages = "usual"; a value 10%+
   above usual = Rising, 25%+ = High; the banner follows the worst of next-7
   days / weekly / monthly. [WHEN:…] note tags + funeral_date are honoured
   for bucketing, same as FlowerBookingsNew. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import api from "../api/axios";
import { getTenantId } from "../utils/globalAuth";
import { toDateKey } from "../utils/dates/parseDates";
import { useSocket } from "../utils/context/socketContext";
import { Ic } from "./opsIcons";

const LEAD_DAYS = 3;

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const p = String(k || "").split("-").map(Number); return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const lvl = (v, u) => (u > 0 && v >= u * 1.25 ? 2 : u > 0 && v >= u * 1.10 ? 1 : 0);
const pc = (v, u) => (u > 0 ? Math.round((v / u - 1) * 100) : 0);
const fmtDay = (k) => parseKey(k).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const unwrap = (r) => {
  const d = r?.data;
  const list = d?.bookings ?? d?.data ?? d?.rows ?? d?.items ?? d;
  return Array.isArray(list) ? list : [];
};

/* FlowerBookingsNew helpers, reproduced locally: date from funeral_date →
   [WHEN:…] note tag → created_at/delivery_date; line items from the
   `arrangements` JSON column → [TYPES:a|b|c] token → legacy flower_type. */
const parseWhenDate = (b) => {
  const m = /\[WHEN\s*:\s*(\d{4}-\d{2}-\d{2})/i.exec(String(b?.notes || ""));
  return m ? m[1] : null;
};
const bookingDay = (b) =>
  toDateKey(b?.funeral_date) || parseWhenDate(b) || toDateKey(b?.created_at) || toDateKey(b?.delivery_date || b?.date) || null;
const asList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean) : [p]; }
    catch { return v.split(",").map((s) => s.trim()).filter(Boolean); }
  }
  return [];
};
const flowerNames = (b) => {
  try {
    const raw = typeof b?.arrangements === "string" ? JSON.parse(b.arrangements) : b?.arrangements;
    if (Array.isArray(raw) && raw.length)
      return raw.filter(Boolean).map((x) => (typeof x === "string" ? x : x.name || x.title || "Flower"));
  } catch { /* fall through */ }
  const tok = /\[TYPES:([^\]]+)\]/i.exec(String(b?.notes || ""));
  if (tok) return tok[1].split("|").map((s) => s.trim()).filter(Boolean);
  return [b?.flower_type || "Custom Arrangement"];
};
const bookingQty = (b) => Math.max(1, Number(b?.quantity) || 1);
const isVoid = (b) => ["cancelled", "canceled"].includes(String(b?.status || "").toLowerCase());

function useFlowerData() {

  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const tenantSlug = (() => { try { return localStorage.getItem("tenantSlug") || ""; } catch { return ""; } })();

  const load = useCallback(async () => {
    try {
      setErr("");
      /* Fetch big (limit 500): the analytics needs ~8 weeks of history, and
         the endpoint's own page uses { limit: 100 } only for its list UI. */
      const res = await api.get("/florist/bookings", {
        params: { tenant_id: getTenantId() || undefined, limit: 500 },
      });
      setBookings(unwrap(res));
    } catch (e) {
      setErr(e?.friendlyMessage || e?.response?.data?.message || e?.message || "Could not load flower bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Live: the same booking events the bookings page listens to. */
  useEffect(() => {
    if (!socket || !connected) return;
    const refresh = () => load();
    socket.on("notification:flower-booking-created", refresh);
    socket.on("notification:flower-booking-updated", refresh);
    socket.on("notification:flower-booking-deleted", refresh);
    return () => {
      socket.off("notification:flower-booking-created", refresh);
      socket.off("notification:flower-booking-updated", refresh);
      socket.off("notification:flower-booking-deleted", refresh);
    };
  }, [socket, connected, load]);

  const stats = useMemo(() => {
    const live = bookings.filter((b) => !isVoid(b));
    const today = keyOf(new Date());
    const monday = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return keyOf(d); })();
    const byDay = new Map();
    live.forEach((b) => { const k = bookingDay(b); if (k) byDay.set(k, (byDay.get(k) || 0) + bookingQty(b)); });

    const daily7 = Array.from({ length: 7 }, (_, i) => byDay.get(addDays(today, i)) || 0);
    const weekIdxOf = (k) => { const m = parseKey(monday); const d = Math.floor((parseKey(k) - m) / 864e5); return d < 0 ? -1 : Math.floor(d / 7); };
    const pastW = Array(8).fill(0); const aheadW = [0, 0, 0];
    const monthIdxOf = (k) => { const t = new Date(); return (t.getFullYear() - parseKey(k).getFullYear()) * 12 + (t.getMonth() - parseKey(k).getMonth()); };
    const pastM = Array(6).fill(0);
    let monthSoFar = 0;
    byDay.forEach((v, k) => {
      const w = weekIdxOf(k);
      if (w >= -8 && w < 0) pastW[w + 8] += v;
      else if (w >= 0 && w <= 2) aheadW[w] += v;
      const m = monthIdxOf(k);
      if (m === 0) monthSoFar += v; else if (m >= 1 && m <= 6) pastM[6 - m] += v;
    });

    const avgW = sum(pastW) / pastW.length || 0;
    const avgD = avgW / 7;
    const avgM = sum(pastM) / pastM.length || 0;
    const dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const proj = monthSoFar > 0 ? Math.round((monthSoFar / new Date().getDate()) * dim) : 0;
    const sum7 = sum(daily7);
    let peakI = 0; aheadW.forEach((v, i) => { if (v > aheadW[peakI]) peakI = i; });
    const peakW = aheadW[peakI];
    const wkName = ["this week", "next week", "in 2 weeks"][peakI];
    const L7 = lvl(sum7, avgW), LW = lvl(peakW, avgW), LM = lvl(proj, avgM);
    const worst = Math.max(L7, LW, LM);
    const pct = Math.max(pc(sum7, avgW), pc(peakW, avgW), pc(proj, avgM));
    const start = peakI === 0 ? today : addDays(monday, 7 * peakI);
    let by = addDays(start, -LEAD_DAYS); if (by < today) by = today;
    const when = L7 > 0 ? "today" : LW > 0 ? "by " + fmtDay(by) : "this week";

    /* Flowers: stems in the last 30 days vs the 30 before. */
    const cutoff = addDays(today, -30), prevCutoff = addDays(today, -60);
    const cur = new Map(), prev = new Map();
    live.forEach((b) => {
      const k = bookingDay(b); if (!k) return;
      const target = k > cutoff ? cur : k > prevCutoff ? prev : null;
      if (!target) return;
      flowerNames(b).forEach((n) => target.set(n, (target.get(n) || 0) + bookingQty(b)));
    });
    const flowers = [...cur.entries()].map(([name, v]) => ({ name, cur: v, prev: prev.get(name) || 0 }))
      .sort((a, b2) => b2.cur - a.cur).slice(0, 8);

    const half = sum(pastW.slice(4)) / 4, prevAvg = sum(pastW.slice(0, 4)) / 4;
    const trend = pc(half, prevAvg);
    return { daily7, pastW, aheadW, pastM, monthSoFar, proj, avgW, avgD, avgM, sum7, peakW, wkName, peakI, worst, pct, when, flowers, trend, today, monday, total: sum([...byDay.values()]), weekAvgHalf: half, weekAvgPrev: prevAvg };
  }, [bookings]);

  return { bookings, stats, loading, err, connected, tenantSlug, reload: load };
}

export default function FlowerAnalytics() {
  const navigate = useNavigate();
  const { stats, loading, err, connected, tenantSlug, reload } = useFlowerData();
  if (loading) return <div className="fl-wrap"><div className="fl-empty"><span className="spin"><Ic n="sync" s={20} /></span><span>Loading flower analytics…</span></div></div>;
  if (err) return <div className="fl-wrap"><div className="fl-empty"><Ic n="flower" s={26} /><b>Could not load flower bookings</b><span>{err}</span><button type="button" className="fl-btn" onClick={reload}>Retry</button></div></div>;
  if (!stats.total) return <div className="fl-wrap"><div className="fl-head"><div><h1>Flowers</h1><p>No flower bookings yet — charts will appear once families start booking.</p></div></div></div>;
  return <FlowerBody s={stats} live={connected} onManage={() => navigate(`/${tenantSlug}/flower-bookings`)} />;
}

/* ── presentation ── */
const GREEN = "#2f8f66", AMBER = "#b26a00", RED = "#c4103a";
const lvlColor = (k) => (k === 2 ? RED : k === 1 ? AMBER : GREEN);
const band = (v, u) => lvl(v, u);

function FlowerBody({ s, live, onManage }) {
  const d7 = s.daily7.map((v, i) => {
    const d = parseKey(addDays(s.today, i));
    return { name: (i === 0 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" })) + " " + d.getDate(), stems: v, level: band(v, s.avgD) };
  });
  const wk = s.pastW.map((v, i) => ({
    name: parseKey(addDays(s.monday, 7 * (i - s.pastW.length))).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    stems: v,
  })).concat(s.aheadW.map((v, i) => ({ name: ["This week", "Next week", "In 2 wks"][i], stems: v })));
  const mo = s.pastM.map((v, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (s.pastM.length - i));
    return { name: MON[d.getMonth()], stems: v, past: true };
  }).concat([{ name: MON[new Date().getMonth()] + " *", stems: s.proj, past: false }]);

  const banner = [
    { cls: "ok", tag: "Normal", h: "Bookings are normal", p: "Keep ordering your usual amount of materials. No action needed." },
    { cls: "warn", tag: "Rising", h: "Bookings are going up", p: `Order a little extra: about ${s.pct}% more than usual, ${s.when}.` },
    { cls: "bad", tag: "High", h: "Bookings are high: order more materials now", p: `Order about ${s.pct}% more flowers and materials than usual, ${s.when}. Suppliers need about ${LEAD_DAYS} days.` },
  ][s.worst];

  let busiest = 0; s.daily7.forEach((v, i) => { if (v > s.daily7[busiest]) busiest = i; });
  const rise = s.flowers.filter((f) => band(f.cur, f.prev) > 0);
  const maxF = s.flowers.length ? s.flowers[0].cur : 1;
  return (
    <div className="fl-wrap">
      <div className="fl-head">
        <div><h1>Flowers</h1><p>Flower charts and bookings analysis — live booking data.</p></div>
        <div className="fl-head-actions">
          <span className={`fl-live${live ? " on" : ""}`}><i aria-hidden="true" />{live ? "Live" : "Offline"}</span>
          <button type="button" className="fl-btn" onClick={onManage}>Manage bookings</button>
        </div>
      </div>
      <div className={`fl-status ${banner.cls}`}>
        <span className="fl-tag">{banner.tag}</span><h2>{banner.h}</h2><p>{banner.p}</p>
      </div>
      <div className="fl-grid">
        <section className="fl-card">
          <h3>Next 7 days</h3><p>Stems due per day, usual day: {s.avgD.toFixed(1)}</p>
          <div className="fl-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d7} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} dy={8} height={52} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
                <ReferenceLine y={s.avgD} stroke="#888" strokeDasharray="5 4" />
                <Bar dataKey="stems" radius={[5, 5, 0, 0]}>
                  {d7.map((e, i) => <Cell key={i} fill={lvlColor(e.level)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="fl-take"><b>{s.sum7} stems in the next 7 days</b> ({(pc(s.sum7, s.avgW) >= 0 ? "+" : "") + pc(s.sum7, s.avgW)}% vs a usual week of {Math.round(s.avgW)}). Busiest day: <b>{fmtDay(addDays(s.today, busiest))}</b> with {s.daily7[busiest]}.</div>
        </section>
        <section className="fl-card">
          <h3>Weekly rhythm</h3><p>Last 8 weeks behind, 3 weeks ahead, usual: {Math.round(s.avgW)}</p>
          <div className="fl-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={wk} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={1} angle={-18} dy={8} height={52} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
                <ReferenceLine y={s.avgW} stroke="#888" strokeDasharray="5 4" />
                <Line type="monotone" dataKey="stems" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="fl-take">Busiest week ahead: <b>{s.wkName} with {s.peakW}</b> ({(pc(s.peakW, s.avgW) >= 0 ? "+" : "") + pc(s.peakW, s.avgW)}% vs usual). 8-week trend is {Math.abs(s.trend) < 3 ? "flat" : s.trend > 0 ? "up " + s.trend + "%" : "down " + Math.abs(s.trend) + "%"}.</div>
        </section>
      </div>
      <div className="fl-grid">
        <section className="fl-card">
          <h3>Monthly momentum</h3><p>Last 6 full months + this month projected, usual: {Math.round(s.avgM)}</p>
          <div className="fl-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mo} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
                <ReferenceLine y={s.avgM} stroke="#888" strokeDasharray="5 4" />
                <Bar dataKey="stems" radius={[5, 5, 0, 0]}>
                  {mo.map((e, i) => <Cell key={i} fill={e.past ? "#cfc8c0" : lvlColor(band(e.stems, s.avgM))} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="fl-take"><b>{s.monthSoFar} bookings so far this month</b>, on track for about <b>{s.proj}</b> ({(pc(s.proj, s.avgM) >= 0 ? "+" : "") + pc(s.proj, s.avgM)}% vs a usual month of {Math.round(s.avgM)}).</div>
        </section>
        <section className="fl-card">
          <h3>Most booked flowers</h3><p>Last 30 days vs the 30 days before</p>
          <div className="fl-chart">
            <ResponsiveContainer width="100%" height={Math.max(180, s.flowers.length * 34)}>
              <BarChart data={s.flowers} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} /><Tooltip />
                <Bar dataKey="cur" radius={[0, 5, 5, 0]} barSize={18}>
                  {s.flowers.map((f, i) => <Cell key={i} fill={lvlColor(band(f.cur, f.prev))} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="fl-rows">
            {s.flowers.map((f) => {
              const p = pc(f.cur, f.prev), k = band(f.cur, f.prev);
              return (
                <div key={f.name} className={`fl-row${k === 2 ? " hi" : k === 1 ? " mid" : ""}`}>
                  <span>{f.name}</span>
                  <div className="fl-track"><i style={{ width: `${(f.cur / maxF) * 100}%` }} /></div>
                  <div><b>{f.cur}</b><small>{(p >= 0 ? "+" : "") + p}%</small></div>
                </div>
              );
            })}
          </div>
          <div className="fl-take">{rise.length ? <><b>Order more: {rise.map((f) => f.name).join(", ")}.</b> Booked 10%+ above the previous 30 days.</> : "No flower is booked much above the previous 30 days. Keep your usual flower order."}</div>
        </section>
      </div>
      <div className="fl-key">
        <span><i style={{ background: "#cfc8c0" }} />Past</span>
        <span><i style={{ background: GREEN }} />Coming up</span>
        <span><i style={{ background: AMBER }} />Rising (10%+ above usual)</span>
        <span><i style={{ background: RED }} />High (25%+ above usual)</span>
      </div>
      <p className="fl-how">"Usual" is the average of your past periods. The decision follows the highest warning among the next 7 days, the weekly trend and the monthly trend.</p>
    </div>
  );
}




