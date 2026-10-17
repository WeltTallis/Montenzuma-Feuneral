import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, CalendarDays,
  CheckCircle2, RefreshCw, Truck, Users,
} from "lucide-react";
import { careOf } from "./opsData";
import { getTenantHeaders } from "../api/endpoints";
import env from "../utils/config/env";

const API_BASE_URL = import.meta.env.PROD
  ? "https://restpoint.co.ke/api/v1/restpoint"
  : (env.FULL_API_URL || "http://localhost:5000/api/v1/restpoint");

const CHART_COLORS = ["#00296B", "#059669", "#7C3AED", "#E36414", "#B4534B", "#0284C7", "#5F0F40"];
const ACTIVE_BOOKING_STATES = new Set(["pending", "booked", "confirmed", "scheduled", "in_transit", "in_progress", "postponed"]);
const CLOSED_FLEET_STATES = new Set(["maintenance", "retired", "inactive", "out_of_service", "decommissioned"]);
const DAY = 24 * 60 * 60 * 1000;

function dateKey(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function bookingDates(booking) {
  let dates = booking?.booking_dates;
  if (typeof dates === "string") {
    try { dates = JSON.parse(dates); } catch { dates = [dates]; }
  }
  if (Array.isArray(dates) && dates.length) {
    const parsed = dates.map((item) => dateKey(typeof item === "object" ? item?.date || item?.booking_date : item)).filter(Boolean);
    if (parsed.length) return [...new Set(parsed)];
  }

  const start = dateKey(booking?.start_date || booking?.booking_date || booking?.date || booking?.estimated_departure_time || booking?.created_at);
  const end = dateKey(booking?.end_date || booking?.return_date || booking?.end || start);
  if (!start) return [];
  if (!end || end < start) return [start];
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  const result = [];
  for (let cursor = from, count = 0; cursor <= to && count < 45; cursor = new Date(cursor.getTime() + DAY), count += 1) {
    result.push(dateKey(cursor));
  }
  return result;
}

function mondayStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function dayLabel(key, options = { weekday: "short", month: "short", day: "numeric" }) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
}

function collection(payload, keys) {
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload)) return payload;
  return [];
}

function Stat({ icon: Icon, label, value, note, tone = "blue" }) {
  return <article className={`da-stat da-${tone}`}>
    <span className="da-stat-icon"><Icon size={17}/></span>
    <span className="da-stat-label">{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>;
}

export default function DashboardAnalytics({ cases = [], caseLoading = false }) {
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshBookings = useCallback(async () => {
    setBookingLoading(true);
    setBookingError("");
    // Hearse records belong to the tenant-wide shared fleet. Remove any active
    // branch header so analytics always sees bookings across all branches.
    const headers = getTenantHeaders();
    delete headers["x-branch-id"];
    delete headers["x-branch-slug"];
    delete headers["x-branch-db"];
    try {
      const [fleetResponse, bookingsResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/hearses`, { headers }),
        fetch(`${API_BASE_URL}/hearse-bookings`, { headers }),
      ]);
      const failed = [];
      if (fleetResponse.status === "fulfilled" && fleetResponse.value.ok) {
        const payload = await fleetResponse.value.json();
        setFleet(collection(payload, ["hearses", "data"]));
      } else {
        setFleet([]);
        failed.push("fleet");
      }
      if (bookingsResponse.status === "fulfilled" && bookingsResponse.value.ok) {
        const payload = await bookingsResponse.value.json();
        setBookings(collection(payload, ["bookings", "data"]));
      } else {
        setBookings([]);
        failed.push("bookings");
      }
      if (failed.length) setBookingError(`Could not load hearse ${failed.join(" and ")}. Availability insights may be incomplete.`);
    } catch {
      setFleet([]);
      setBookings([]);
      setBookingError("Could not load hearse booking data. Try refreshing the analytics.");
    } finally {
      setBookingLoading(false);
    }
  }, []);

  useEffect(() => { refreshBookings(); }, [refreshBookings, refreshCount]);

  const deceasedStats = useMemo(() => {
    const branchMap = new Map();
    const flowMap = new Map();
    const states = { inCare: 0, pmPending: 0, pmDone: 0, released: 0 };
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      flowMap.set(key, { month: date.toLocaleDateString(undefined, { month: "short" }), admissions: 0, releases: 0 });
    }

    cases.forEach((person) => {
      const branch = String(person.branch || person.raw?.branch_name || person.raw?.branch || "Branch not recorded").trim();
      const row = branchMap.get(branch) || { branch, deceased: 0, inCare: 0, released: 0 };
      row.deceased += 1;
      const state = careOf(person);
      if (state === "released" || state === "transferred") {
        row.released += 1;
        states.released += 1;
      } else {
        row.inCare += 1;
        states.inCare += 1;
      }
      if (state === "pm-req") states.pmPending += 1;
      if (state === "pm-done") states.pmDone += 1;
      branchMap.set(branch, row);

      const admittedMonth = String(person.admDate || "").slice(0, 7);
      if (flowMap.has(admittedMonth)) flowMap.get(admittedMonth).admissions += 1;
      const releasedMonth = String(person.release?.date || "").slice(0, 7);
      if (person.release?.status === "completed" && flowMap.has(releasedMonth)) flowMap.get(releasedMonth).releases += 1;
    });

    const branches = [...branchMap.values()].sort((a, b) => b.deceased - a.deceased);
    const pie = branches.map((row, index) => ({ ...row, fill: CHART_COLORS[index % CHART_COLORS.length] }));
    const flow = [...flowMap.values()];
    const busiest = [...flow].sort((a, b) => b.admissions - a.admissions)[0];
    return { branches, pie, flow, states, busiest, total: cases.length };
  }, [cases]);

  const hearseStats = useMemo(() => {
    const operationalFleet = fleet.filter((vehicle) => !CLOSED_FLEET_STATES.has(String(vehicle?.status || "available").toLowerCase().replace(/[\s-]+/g, "_")));
    const fleetIds = new Set(operationalFleet.map((vehicle) => String(vehicle?.id ?? vehicle?.hearse_id ?? vehicle?.vehicle_id ?? "")).filter(Boolean));
    const start = mondayStart(new Date());
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const key = dateKey(date);
      return { key, day: dayLabel(key, { weekday: "short" }), label: dayLabel(key, { weekday: "short", month: "short", day: "numeric" }), ids: new Set(), bookings: 0 };
    });
    let activeWeekBookings = 0;
    const today = dateKey(new Date());

    bookings.forEach((booking) => {
      const status = String(booking?.status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
      if (!ACTIVE_BOOKING_STATES.has(status)) return;
      const dates = bookingDates(booking);
      let countedThisWeek = false;
      for (const day of days) {
        if (!dates.includes(day.key)) continue;
        day.bookings += 1;
        const vehicleId = booking?.hearse_id ?? booking?.hearse?.id ?? booking?.vehicle_id ?? booking?.vehicle?.id;
        if (vehicleId != null) day.ids.add(String(vehicleId));
        countedThisWeek = true;
      }
      if (countedThisWeek) activeWeekBookings += 1;
    });

    const capacity = days.map((day) => ({
      ...day,
      booked: Math.min(day.ids.size, operationalFleet.length),
      free: Math.max(operationalFleet.length - day.ids.size, 0),
      utilization: operationalFleet.length ? Math.min(Math.round((day.ids.size / operationalFleet.length) * 100), 100) : 0,
    }));
    const peak = capacity.reduce((best, day) => (!best || day.ids.size > best.ids.size ? day : best), null);
    const freeAtPeak = peak ? Math.max(operationalFleet.length - peak.ids.size, 0) : operationalFleet.length;
    const todayBookings = bookings.filter((booking) => ACTIVE_BOOKING_STATES.has(String(booking?.status || "pending").toLowerCase().replace(/[\s-]+/g, "_")) && bookingDates(booking).includes(today)).length;
    return { fleetCount: operationalFleet.length, activeWeekBookings, todayBookings, capacity, peak, freeAtPeak };
  }, [fleet, bookings]);

  const loading = caseLoading || bookingLoading;
  const insightTitle = !hearseStats.fleetCount && !bookingLoading
    ? "Fleet data unavailable"
    : hearseStats.peak && hearseStats.peak.ids.size >= hearseStats.fleetCount && hearseStats.fleetCount > 0
      ? `Fully booked ${hearseStats.peak.label}`
      : hearseStats.freeAtPeak === 1
        ? `1 hearse remaining ${hearseStats.peak?.label || "this week"}`
        : hearseStats.freeAtPeak > 1
          ? `${hearseStats.freeAtPeak} hearses still free ${hearseStats.peak?.label || "this week"}`
          : "Booking outlook unavailable";

  return <section className="da-page" aria-labelledby="da-title">
    <header className="da-header">
      <div><span className="da-kicker">CROSS-BRANCH OVERVIEW</span><h1 id="da-title">Smart operations analytics</h1><p>Deceased care, branch activity, and hearse capacity in one live view.</p></div>
      <button type="button" className="da-refresh" onClick={() => setRefreshCount((count) => count + 1)} disabled={bookingLoading}><RefreshCw size={15} className={bookingLoading ? "da-spin" : ""}/> Refresh data</button>
    </header>
    {bookingError && <div className="da-alert"><AlertCircle size={16}/><span>{bookingError}</span></div>}
    <div className="da-stats">
      <Stat icon={Users} label="Deceased records" value={deceasedStats.total} note={`${deceasedStats.branches.length} branches represented`} tone="blue"/>
      <Stat icon={Activity} label="Currently in care" value={deceasedStats.states.inCare} note="Across all branches" tone="green"/>
      <Stat icon={Truck} label="Operational hearses" value={bookingLoading ? "—" : hearseStats.fleetCount} note={`${hearseStats.todayBookings} active bookings today`} tone="purple"/>
      <Stat icon={CalendarDays} label="Bookings this week" value={bookingLoading ? "—" : hearseStats.activeWeekBookings} note="Active reservations, all branches" tone="orange"/>
    </div>

    <section className={`da-insight${hearseStats.freeAtPeak === 0 && hearseStats.fleetCount ? " da-insight-full" : ""}`} aria-live="polite">
      <span className="da-insight-icon">{hearseStats.freeAtPeak === 0 && hearseStats.fleetCount ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>}</span>
      <div className="da-insight-copy"><span>HEARSE CAPACITY · NEXT 7 DAYS</span><h2>{bookingLoading ? "Checking live fleet availability…" : insightTitle}</h2><p>{bookingLoading ? "Comparing scheduled trips with operational vehicles." : hearseStats.fleetCount ? `${hearseStats.peak?.booked || 0} of ${hearseStats.fleetCount} operational hearses are committed on the busiest day. ${hearseStats.activeWeekBookings} active booking${hearseStats.activeWeekBookings === 1 ? "" : "s"} scheduled this week.` : "No operational fleet was returned, so availability cannot be estimated."}</p></div>
      {hearseStats.peak && hearseStats.fleetCount > 0 && <div className="da-insight-meter"><strong>{hearseStats.peak.utilization}%</strong><span>peak utilization</span><div><i style={{ width: `${hearseStats.peak.utilization}%` }}/></div></div>}
    </section>

    <div className="da-charts">
      <article className="da-card da-card-wide"><div className="da-card-head"><div><span>BRANCH COMPARISON</span><h2>Deceased by branch</h2></div><small>{deceasedStats.total} total records</small></div>
        {caseLoading ? <div className="da-empty">Loading deceased records…</div> : deceasedStats.branches.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={deceasedStats.branches} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="branch" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip/><Legend/><Bar dataKey="inCare" name="In care" stackId="cases" fill="#059669" radius={[0,0,0,0]}/><Bar dataKey="released" name="Released" stackId="cases" fill="#5F0F40" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <div className="da-empty">No deceased records are available yet.</div>}
      </article>
      <article className="da-card"><div className="da-card-head"><div><span>CARE STATUS</span><h2>Records overview</h2></div></div>
        {caseLoading ? <div className="da-empty">Loading records…</div> : deceasedStats.total ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={[{ name: "In care", value: deceasedStats.states.inCare, color: "#059669" }, { name: "PM pending", value: deceasedStats.states.pmPending, color: "#d97706" }, { name: "PM complete", value: deceasedStats.states.pmDone, color: "#00296B" }, { name: "Released", value: deceasedStats.states.released, color: "#5F0F40" }].filter((item) => item.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={57} outerRadius={91} paddingAngle={3}><Cell fill="#059669"/><Cell fill="#d97706"/><Cell fill="#00296B"/><Cell fill="#5F0F40"/></Pie><Tooltip/><Legend verticalAlign="bottom" height={32}/></PieChart></ResponsiveContainer> : <div className="da-empty">No care-status data yet.</div>}
      </article>
      <article className="da-card"><div className="da-card-head"><div><span>RECENT TREND</span><h2>Admissions & releases</h2></div><small>Last 6 months</small></div>
        {caseLoading ? <div className="da-empty">Loading activity…</div> : <ResponsiveContainer width="100%" height={280}><LineChart data={deceasedStats.flow} margin={{ top: 12, right: 10, left: -18, bottom: 4 }}><CartesianGrid stroke="#edf1f6" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="admissions" name="Admissions" stroke="#00296B" strokeWidth={2.5} dot={{ r: 3 }}/><Line type="monotone" dataKey="releases" name="Releases" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }}/></LineChart></ResponsiveContainer>}
        {deceasedStats.busiest && <div className="da-card-foot"><ArrowUpRight size={14}/> Highest admissions in the last 6 months: <b>{deceasedStats.busiest.month}</b> ({deceasedStats.busiest.admissions}).</div>}
      </article>
      <article className="da-card da-card-wide da-capacity-card"><div className="da-card-head"><div><span>FLEET PLANNING</span><h2>Hearse bookings · this week</h2></div><small>{bookingLoading ? "Updating…" : `${hearseStats.fleetCount} active vehicles`}</small></div>
        {bookingLoading ? <div className="da-empty">Loading fleet and bookings…</div> : hearseStats.fleetCount ? <><ResponsiveContainer width="100%" height={250}><BarChart data={hearseStats.capacity} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} domain={[0, hearseStats.fleetCount]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip formatter={(value, name) => [value, name === "booked" ? "Hearses booked" : name]}/><Bar dataKey="booked" name="Hearses booked" fill="#00296B" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer><div className="da-capacity-days">{hearseStats.capacity.map((day) => <div key={day.key} className={day.free === 0 ? "is-full" : day.free === 1 ? "is-tight" : ""}><b>{day.day}</b><span>{day.free === 0 ? "Fully booked" : `${day.free} free`}</span></div>)}</div></> : <div className="da-empty">Add hearses to the fleet to see capacity insights.</div>}
      </article>
    </div>
    <footer className="da-note"><ArrowDownRight size={14}/> Capacity uses distinct hearses with active reservations on each date; cancelled and completed bookings are excluded. Branch totals use the live deceased register.</footer>
  </section>;
}
