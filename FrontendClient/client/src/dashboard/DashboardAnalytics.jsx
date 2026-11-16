import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import { Activity, AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, RefreshCw, Truck, Users } from "lucide-react";
import { careOf } from "./opsData";
import { getTenantHeaders } from "../api/endpoints";
import { fetchWithCredentials } from "../api/axios";
import env from "../utils/config/env";

const API_BASE_URL = import.meta.env.PROD ? "https://restpoint.co.ke/api/v1/restpoint" : (env.FULL_API_URL || "http://localhost:5000/api/v1/restpoint");
const PALETTE = ["#00296B", "#059669", "#7C3AED", "#E36414", "#B4534B", "#0284C7", "#5F0F40"];
const ACTIVE_BOOKING = new Set(["pending", "booked", "confirmed", "scheduled", "in_transit", "in_progress", "postponed"]);
const INACTIVE_FLEET = new Set(["maintenance", "retired", "inactive", "out_of_service", "decommissioned"]);
const DAY_MS = 86400000;

function dateKey(value) {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function bookingDates(booking) {
  let dates = booking?.booking_dates;
  if (typeof dates === "string") { try { dates = JSON.parse(dates); } catch { dates = [dates]; } }
  if (Array.isArray(dates)) {
    const parsed = dates.map((item) => dateKey(typeof item === "object" ? item?.date || item?.booking_date : item)).filter(Boolean);
    if (parsed.length) return [...new Set(parsed)];
  }
  const start = dateKey(booking?.start_date || booking?.booking_date || booking?.date || booking?.estimated_departure_time || booking?.created_at);
  const end = dateKey(booking?.end_date || booking?.return_date || booking?.end || start);
  if (!start || !end || end < start) return start ? [start] : [];
  const values = [];
  for (let date = new Date(`${start}T12:00:00`), stop = new Date(`${end}T12:00:00`), n = 0; date <= stop && n < 45; date = new Date(date.getTime() + DAY_MS), n += 1) values.push(dateKey(date));
  return values;
}

function collection(payload, key) { return Array.isArray(payload?.[key]) ? payload[key] : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []; }
function labelDate(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function startOfWeek(date) { const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate()); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); return monday; }

function Stat({ icon: Icon, label, value, note, tone }) {
  return <article className={`da-stat da-${tone}`}><span className="da-stat-icon"><Icon size={17}/></span><span className="da-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export default function DashboardAnalytics({ cases = [], caseLoading = false }) {
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const loadBookings = useCallback(async () => {
    setBookingLoading(true);
    setBookingError("");
    const headers = getTenantHeaders();
    // These endpoints use the tenant-wide shared fleet, not the current branch.
    delete headers["x-branch-id"];
    delete headers["x-branch-slug"];
    delete headers["x-branch-db"];
    try {
      const [fleetResult, bookingResult] = await Promise.allSettled([
        fetchWithCredentials(`${API_BASE_URL}/hearses`, { headers }),
        fetchWithCredentials(`${API_BASE_URL}/hearse-bookings`, { headers }),
      ]);
      const failures = [];
      if (fleetResult.status === "fulfilled" && fleetResult.value.ok) setFleet(collection(await fleetResult.value.json(), "hearses"));
      else { setFleet([]); failures.push("fleet"); }
      if (bookingResult.status === "fulfilled" && bookingResult.value.ok) setBookings(collection(await bookingResult.value.json(), "bookings"));
      else { setBookings([]); failures.push("bookings"); }
      if (failures.length) setBookingError(`Could not load hearse ${failures.join(" and ")}. Capacity insights may be incomplete.`);
    } catch {
      setFleet([]); setBookings([]);
      setBookingError("Could not load hearse bookings. Refresh to try again.");
    } finally { setBookingLoading(false); }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings, refreshToken]);

  const deceased = useMemo(() => {
    const branches = new Map();
    const monthly = new Map();
    const state = { care: 0, pmPending: 0, pmDone: 0, released: 0 };
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      monthly.set(key, { month: month.toLocaleDateString(undefined, { month: "short" }), admissions: 0, releases: 0 });
    }
    cases.forEach((person) => {
      const name = String(person.branch || person.raw?.branch_name || person.raw?.branch || "Branch not recorded").trim();
      const branch = branches.get(name) || { branch: name, deceased: 0, inCare: 0, released: 0 };
      branch.deceased += 1;
      const careState = careOf(person);
      if (careState === "released" || careState === "transferred") { branch.released += 1; state.released += 1; }
      else { branch.inCare += 1; state.care += 1; }
      if (careState === "pm-req") state.pmPending += 1;
      if (careState === "pm-done") state.pmDone += 1;
      branches.set(name, branch);
      const admitted = String(person.admDate || "").slice(0, 7);
      if (monthly.has(admitted)) monthly.get(admitted).admissions += 1;
      const released = String(person.release?.date || "").slice(0, 7);
      if (person.release?.status === "completed" && monthly.has(released)) monthly.get(released).releases += 1;
    });
    const branchRows = [...branches.values()].sort((a, b) => b.deceased - a.deceased);
    const trend = [...monthly.values()];
    const busiestMonth = [...trend].sort((a, b) => b.admissions - a.admissions)[0];
    return { branches: branchRows, trend, state, total: cases.length, busiestMonth };
  }, [cases]);

  const hearse = useMemo(() => {
    const fleetActive = fleet.filter((vehicle) => !INACTIVE_FLEET.has(String(vehicle?.status || "available").toLowerCase().replace(/[\s-]+/g, "_")));
    const fleetIds = new Set(fleetActive.map((v) => String(v?.id ?? v?.hearse_id ?? v?.vehicle_id ?? "")).filter(Boolean));
    const monday = startOfWeek(new Date());
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = dateKey(date);
      return { key, day: date.toLocaleDateString(undefined, { weekday: "short" }), label: labelDate(key), ids: new Set(), bookings: 0 };
    });
    let weekBookingCount = 0;
    let todayBookingCount = 0;
    const today = dateKey(new Date());
    bookings.forEach((booking) => {
      const status = String(booking?.status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
      if (!ACTIVE_BOOKING.has(status)) return;
      const dates = bookingDates(booking);
      if (dates.includes(today)) todayBookingCount += 1;
      let overlapsWeek = false;
      for (const day of week) {
        if (!dates.includes(day.key)) continue;
        day.bookings += 1;
        const id = booking?.hearse_id ?? booking?.hearse?.id ?? booking?.vehicle_id ?? booking?.vehicle?.id;
        if (id != null) day.ids.add(String(id));
        overlapsWeek = true;
      }
      if (overlapsWeek) weekBookingCount += 1;
    });
    const daily = week.map((day) => ({ ...day, booked: Math.min(day.ids.size, fleetActive.length), free: Math.max(fleetActive.length - day.ids.size, 0), utilization: fleetActive.length ? Math.min(100, Math.round(day.ids.size / fleetActive.length * 100)) : 0 }));
    const peak = daily.reduce((max, day) => !max || day.ids.size > max.ids.size ? day : max, null);
    return { fleetCount: fleetActive.length, ids: fleetIds, todayBookings: todayBookingCount, weekBookings: weekBookingCount, daily, peak, freeAtPeak: peak ? Math.max(fleetActive.length - peak.ids.size, 0) : fleetActive.length };
  }, [fleet, bookings]);

  const peakMessage = !hearse.fleetCount && !bookingLoading ? "Fleet data unavailable" : hearse.peak?.ids.size >= hearse.fleetCount && hearse.fleetCount ? `Fully booked ${hearse.peak.label}` : hearse.freeAtPeak === 1 ? `1 hearse remaining ${hearse.peak?.label || "this week"}` : hearse.fleetCount ? `${hearse.freeAtPeak} hearses available ${hearse.peak?.label || "this week"}` : "Checking fleet capacity";
