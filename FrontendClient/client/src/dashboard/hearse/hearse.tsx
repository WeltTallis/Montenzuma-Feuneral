import { useState, useEffect, useMemo, Fragment } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth,
  eachDayOfInterval, isToday, addWeeks, subWeeks,
} from "date-fns";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft, ChevronRight, Truck, AlertTriangle,
  CheckCircle2, Bell, X, User, Phone, MapPin, Navigation,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Branch = "Nairobi" | "Machakos" | "Thika";
type Status = "booked" | "in-transit" | "delayed" | "completed" | "available";
type CalView = "month" | "week" | "day";

interface Booking {
  id: string;
  hearseId: string;
  branch: Branch;
  status: Status;
  client: string;
  pickup: string;
  dropoff: string;
  date: string;
  startHour: number;
  duration: number;
  driver: string;
  phone: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SM: Record<Status, { label: string; color: string }> = {
  booked:       { label: "Booked",     color: "#3b82f6" },
  "in-transit": { label: "In Transit", color: "#f59e0b" },
  delayed:      { label: "Delayed",    color: "#ef4444" },
  completed:    { label: "Completed",  color: "#22c55e" },
  available:    { label: "Available",  color: "#64748b" },
};

const BC: Record<Branch, string> = {
  Nairobi:  "#818cf8",
  Machakos: "#fb923c",
  Thika:    "#34d399",
};

const HEARSES: Record<Branch, string[]> = {
  Nairobi:  ["H-NBI-01", "H-NBI-02", "H-NBI-03"],
  Machakos: ["H-MKS-01", "H-MKS-02"],
  Thika:    ["H-THK-01", "H-THK-02"],
};

const ALL_BRANCHES: Branch[] = ["Nairobi", "Machakos", "Thika"];
const ALL_STATUSES: Status[] = ["booked", "in-transit", "delayed", "completed", "available"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const DAY_START = 6;
const DAY_TOTAL = 18;
const HOUR_PX = 80;

// ─── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_BOOKINGS: Booking[] = [
  { id: "NBI-001", hearseId: "H-NBI-01", branch: "Nairobi",  status: "completed",  client: "Kamau Family",    pickup: "Kenyatta National Hospital",  dropoff: "Langata Cemetery",        date: "2026-08-10", startHour: 8,  duration: 3,  driver: "John Mwangi",    phone: "+254 712 345 678" },
  { id: "NBI-002", hearseId: "H-NBI-02", branch: "Nairobi",  status: "completed",  client: "Odhiambo Estate", pickup: "Nairobi Hospital Mortuary",   dropoff: "Kisii via Narok",         date: "2026-08-10", startHour: 7,  duration: 9,  driver: "Peter Ochieng",  phone: "+254 723 456 789" },
  { id: "NBI-003", hearseId: "H-NBI-01", branch: "Nairobi",  status: "completed",  client: "Wanjiku Family",  pickup: "MP Shah Hospital",            dropoff: "Kiambu Municipal Cemetery",date: "2026-08-11", startHour: 9,  duration: 2,  driver: "John Mwangi",    phone: "+254 712 345 678" },
  { id: "NBI-004", hearseId: "H-NBI-03", branch: "Nairobi",  status: "completed",  client: "Kariuki Family",  pickup: "Aga Khan Hospital",           dropoff: "St. Austin's, Westlands", date: "2026-08-12", startHour: 10, duration: 4,  driver: "Grace Njeri",    phone: "+254 711 234 567" },
  { id: "NBI-005", hearseId: "H-NBI-02", branch: "Nairobi",  status: "completed",  client: "Gitau Estate",    pickup: "Karen Hospital",              dropoff: "Karen Blixen Gardens",    date: "2026-08-13", startHour: 8,  duration: 3,  driver: "Peter Ochieng",  phone: "+254 723 456 789" },
  { id: "NBI-006", hearseId: "H-NBI-01", branch: "Nairobi",  status: "in-transit", client: "Njoroge Family",  pickup: "Kenyatta National Hospital",  dropoff: "Thogoto, Kiambu",         date: "2026-08-14", startHour: 7,  duration: 4,  driver: "John Mwangi",    phone: "+254 712 345 678" },
  { id: "NBI-007", hearseId: "H-NBI-02", branch: "Nairobi",  status: "delayed",    client: "Otieno Estate",   pickup: "Nairobi Hospital",            dropoff: "Siaya County",            date: "2026-08-14", startHour: 6,  duration: 10, driver: "Peter Ochieng",  phone: "+254 723 456 789" },
  { id: "NBI-008", hearseId: "H-NBI-03", branch: "Nairobi",  status: "booked",     client: "Muthoni Family",  pickup: "MP Shah Hospital",            dropoff: "Kabete Cemetery",         date: "2026-08-14", startHour: 13, duration: 2,  driver: "Grace Njeri",    phone: "+254 711 234 567" },
  { id: "NBI-009", hearseId: "H-NBI-01", branch: "Nairobi",  status: "booked",     client: "Akinyi Estate",   pickup: "Aga Khan Hospital",           dropoff: "Mombasa Rd. Memorial",    date: "2026-08-15", startHour: 9,  duration: 3,  driver: "John Mwangi",    phone: "+254 712 345 678" },
  { id: "NBI-010", hearseId: "H-NBI-02", branch: "Nairobi",  status: "booked",     client: "Kamande Family",  pickup: "KNH Mortuary",                dropoff: "City Park Cemetery",      date: "2026-08-15", startHour: 11, duration: 2,  driver: "Peter Ochieng",  phone: "+254 723 456 789" },
  { id: "NBI-011", hearseId: "H-NBI-03", branch: "Nairobi",  status: "booked",     client: "Waweru Estate",   pickup: "Nairobi Hospital",            dropoff: "Tigoni, Limuru",          date: "2026-08-16", startHour: 8,  duration: 5,  driver: "Grace Njeri",    phone: "+254 711 234 567" },
  { id: "NBI-012", hearseId: "H-NBI-01", branch: "Nairobi",  status: "booked",     client: "Nyambura Family", pickup: "MP Shah Hospital",            dropoff: "Ngong Hills",             date: "2026-08-18", startHour: 10, duration: 3,  driver: "John Mwangi",    phone: "+254 712 345 678" },
  { id: "NBI-013", hearseId: "H-NBI-02", branch: "Nairobi",  status: "booked",     client: "Muriuki Family",  pickup: "Nairobi Hospital",            dropoff: "Ruiru Memorial",          date: "2026-08-20", startHour: 9,  duration: 2,  driver: "Peter Ochieng",  phone: "+254 723 456 789" },
  { id: "MKS-001", hearseId: "H-MKS-01", branch: "Machakos", status: "completed",  client: "Mutua Family",    pickup: "Machakos Level 5 Hospital",   dropoff: "Mua Hills, Machakos",     date: "2026-08-11", startHour: 9,  duration: 3,  driver: "James Mutua",    phone: "+254 733 567 890" },
  { id: "MKS-002", hearseId: "H-MKS-02", branch: "Machakos", status: "completed",  client: "Musyoka Estate",  pickup: "Athi River Mission Hospital", dropoff: "Kithimani, Yatta",        date: "2026-08-12", startHour: 7,  duration: 6,  driver: "Mary Kavata",    phone: "+254 744 678 901" },
  { id: "MKS-003", hearseId: "H-MKS-01", branch: "Machakos", status: "in-transit", client: "Kilonzo Family",  pickup: "Machakos Level 5 Hospital",   dropoff: "Mwala, Machakos",         date: "2026-08-14", startHour: 9,  duration: 4,  driver: "James Mutua",    phone: "+254 733 567 890" },
  { id: "MKS-004", hearseId: "H-MKS-02", branch: "Machakos", status: "booked",     client: "Ndambuki Estate", pickup: "Machakos District Hospital",  dropoff: "Nziu, Kitui",             date: "2026-08-14", startHour: 14, duration: 5,  driver: "Mary Kavata",    phone: "+254 744 678 901" },
  { id: "MKS-005", hearseId: "H-MKS-01", branch: "Machakos", status: "booked",     client: "Ngoma Family",    pickup: "Kangundo Referral Hospital",  dropoff: "Matuu, Machakos",         date: "2026-08-15", startHour: 10, duration: 3,  driver: "James Mutua",    phone: "+254 733 567 890" },
  { id: "MKS-006", hearseId: "H-MKS-02", branch: "Machakos", status: "booked",     client: "Kyalo Estate",    pickup: "Machakos Level 5 Hospital",   dropoff: "Kathiani, Machakos",      date: "2026-08-17", startHour: 8,  duration: 2,  driver: "Mary Kavata",    phone: "+254 744 678 901" },
  { id: "MKS-007", hearseId: "H-MKS-01", branch: "Machakos", status: "booked",     client: "Nzomo Family",    pickup: "Kathiani Sub-County Hosp.",   dropoff: "Kivaa, Machakos",         date: "2026-08-19", startHour: 9,  duration: 3,  driver: "James Mutua",    phone: "+254 733 567 890" },
  { id: "THK-001", hearseId: "H-THK-01", branch: "Thika",    status: "completed",  client: "Njenga Family",   pickup: "Thika Level 5 Hospital",      dropoff: "Kamenu, Thika",           date: "2026-08-11", startHour: 8,  duration: 2,  driver: "David Kipchoge", phone: "+254 755 789 012" },
  { id: "THK-002", hearseId: "H-THK-02", branch: "Thika",    status: "completed",  client: "Githuku Estate",  pickup: "Gatundu District Hospital",   dropoff: "Kiambu Memorial Park",    date: "2026-08-12", startHour: 10, duration: 3,  driver: "Sarah Akinyi",   phone: "+254 766 890 123" },
  { id: "THK-003", hearseId: "H-THK-01", branch: "Thika",    status: "delayed",    client: "Njuguna Family",  pickup: "Thika Level 5 Hospital",      dropoff: "Maragua, Murang'a",       date: "2026-08-14", startHour: 8,  duration: 5,  driver: "David Kipchoge", phone: "+254 755 789 012" },
  { id: "THK-004", hearseId: "H-THK-02", branch: "Thika",    status: "booked",     client: "Kabiru Estate",   pickup: "Ruiru Sub-County Hospital",   dropoff: "Garden City, Ruiru",      date: "2026-08-14", startHour: 15, duration: 2,  driver: "Sarah Akinyi",   phone: "+254 766 890 123" },
  { id: "THK-005", hearseId: "H-THK-01", branch: "Thika",    status: "booked",     client: "Mwangi Family",   pickup: "Thika Level 5 Hospital",      dropoff: "Gatanga, Murang'a",       date: "2026-08-15", startHour: 9,  duration: 4,  driver: "David Kipchoge", phone: "+254 755 789 012" },
  { id: "THK-006", hearseId: "H-THK-02", branch: "Thika",    status: "booked",     client: "Kimani Estate",   pickup: "Kenol Sub-County Hospital",   dropoff: "Makuyu, Murang'a",        date: "2026-08-16", startHour: 10, duration: 3,  driver: "Sarah Akinyi",   phone: "+254 766 890 123" },
  { id: "THK-007", hearseId: "H-THK-01", branch: "Thika",    status: "booked",     client: "Wachira Family",  pickup: "Thika Level 5 Hospital",      dropoff: "Juja, Kiambu",            date: "2026-08-20", startHour: 8,  duration: 2,  driver: "David Kipchoge", phone: "+254 755 789 012" },
  { id: "THK-008", hearseId: "H-THK-02", branch: "Thika",    status: "booked",     client: "Maina Estate",    pickup: "Gatundu District Hospital",   dropoff: "Lari, Kiambu",            date: "2026-08-22", startHour: 11, duration: 3,  driver: "Sarah Akinyi",   phone: "+254 766 890 123" },
];

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Status }) {
  const { label, color } = SM[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

// ─── MonthView ────────────────────────────────────────────────────────────────
function MonthView({ currentDate, bookings, onSelect }: {
  currentDate: Date; bookings: Booking[]; onSelect: (b: Booking) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.08)", height: "100%" }}
    >
      <div className="grid grid-cols-7 shrink-0 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "1fr" }}>
        {days.map((day, i) => {
          const ds = format(day, "yyyy-MM-dd");
          const db = bookings.filter(b => b.date === ds);
          const inMonth = isSameMonth(day, currentDate);
          const tod = isToday(day);
          return (
            <div
              key={i}
              className="border-r border-b p-1.5 overflow-hidden"
              style={{
                borderColor: "rgba(148,163,184,0.06)",
                opacity: inMonth ? 1 : 0.3,
                backgroundColor: tod ? "rgba(79,70,229,0.06)" : undefined,
              }}
            >
              <div
                className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 mx-auto"
                style={tod
                  ? { backgroundColor: "#4f46e5", color: "#fff" }
                  : { color: "#64748b" }}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {db.slice(0, 3).map(bk => (
                  <button
                    key={bk.id}
                    onClick={() => onSelect(bk)}
                    className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate hover:opacity-70 transition-opacity"
                    style={{
                      backgroundColor: `${SM[bk.status].color}18`,
                      color: SM[bk.status].color,
                      border: `1px solid ${SM[bk.status].color}28`,
                    }}
                  >
                    <span style={{ color: BC[bk.branch] }}>▪</span>
                    {" "}{bk.client.split(" ")[0]}
                  </button>
                ))}
                {db.length > 3 && (
                  <div className="px-1.5 text-xs" style={{ color: "#475569" }}>
                    +{db.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────
function WeekView({ currentDate, bookings, onSelect }: {
  currentDate: Date; bookings: Booking[]; onSelect: (b: Booking) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.08)", height: "100%" }}
    >
      <div
        className="grid shrink-0 border-b"
        style={{ gridTemplateColumns: "52px repeat(7, 1fr)", borderColor: "rgba(148,163,184,0.08)" }}
      >
        <div className="border-r" style={{ borderColor: "rgba(148,163,184,0.06)" }} />
        {days.map((day, i) => {
          const tod = isToday(day);
          return (
            <div
              key={i}
              className="py-2 text-center border-r"
              style={{
                borderColor: "rgba(148,163,184,0.06)",
                backgroundColor: tod ? "rgba(79,70,229,0.06)" : undefined,
              }}
            >
              <div className="text-xs uppercase tracking-wide" style={{ color: "#475569" }}>
                {format(day, "EEE")}
              </div>
              <div
                className="text-lg font-bold mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full"
                style={tod
                  ? { backgroundColor: "#4f46e5", color: "#fff" }
                  : { color: "#94a3b8" }}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
          {WEEK_HOURS.map(hour => (
            <Fragment key={hour}>
              <div
                className="border-r border-b py-2.5 pr-2 text-right"
                style={{ borderColor: "rgba(148,163,184,0.06)" }}
              >
                <span className="text-xs font-mono" style={{ color: "#334155" }}>
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
              {days.map((day, di) => {
                const ds = format(day, "yyyy-MM-dd");
                const slotBks = bookings.filter(b => b.date === ds && b.startHour === hour);
                const tod = isToday(day);
                return (
                  <div
                    key={di}
                    className="border-r border-b p-0.5 min-h-[42px]"
                    style={{
                      borderColor: "rgba(148,163,184,0.06)",
                      backgroundColor: tod ? "rgba(79,70,229,0.03)" : undefined,
                    }}
                  >
                    {slotBks.map(bk => (
                      <button
                        key={bk.id}
                        onClick={() => onSelect(bk)}
                        className="w-full text-left p-1.5 rounded text-xs mb-0.5 hover:opacity-70 transition-opacity"
                        style={{
                          backgroundColor: `${SM[bk.status].color}18`,
                          border: `1px solid ${SM[bk.status].color}30`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: BC[bk.branch] }}
                          />
                          <span className="font-semibold truncate" style={{ color: SM[bk.status].color }}>
                            {bk.client.split(" ")[0]}
                          </span>
                        </div>
                        <div className="font-mono text-xs mt-0.5 truncate" style={{ color: "#475569" }}>
                          {bk.hearseId}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DayView (Gantt) ──────────────────────────────────────────────────────────
function DayView({ currentDate, bookings, activeBranches, onSelect }: {
  currentDate: Date; bookings: Booking[]; activeBranches: Branch[]; onSelect: (b: Booking) => void;
}) {
  const ds = format(currentDate, "yyyy-MM-dd");
  const dayBks = bookings.filter(b => b.date === ds);
  const hearseList = activeBranches.flatMap(br => HEARSES[br]);
  const getBranch = (h: string): Branch => ALL_BRANCHES.find(br => HEARSES[br].includes(h)) ?? "Nairobi";
  const timelineW = DAY_TOTAL * HOUR_PX;

  return (
    <div
      className="rounded-xl border overflow-auto flex flex-col"
      style={{ backgroundColor: "#111827", borderColor: "rgba(148,163,184,0.08)", height: "100%" }}
    >
      {/* Sticky time header */}
      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: "rgba(148,163,184,0.08)", position: "sticky", top: 0, zIndex: 10, backgroundColor: "#111827" }}
      >
        <div
          className="shrink-0 border-r p-3 flex items-end"
          style={{ width: 144, borderColor: "rgba(148,163,184,0.06)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>
            Fleet · {format(currentDate, "d MMM")}
          </span>
        </div>
        <div style={{ width: timelineW, position: "relative", height: 44 }}>
          {Array.from({ length: DAY_TOTAL + 1 }, (_, i) => i + DAY_START).map(h => (
            <div
              key={h}
              style={{ position: "absolute", left: (h - DAY_START) * HOUR_PX, top: 0, bottom: 0, display: "flex", alignItems: "flex-end", paddingBottom: 6 }}
            >
              <div
                style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, backgroundColor: "rgba(148,163,184,0.06)" }}
              />
              <span className="text-xs font-mono pl-1.5" style={{ color: "#334155" }}>
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hearse rows */}
      {hearseList.map(h => {
        const br = getBranch(h);
        const hBks = dayBks.filter(b => b.hearseId === h);
        const live = hBks.find(b => b.status === "in-transit" || b.status === "delayed");
        return (
          <div key={h} className="flex border-b" style={{ borderColor: "rgba(148,163,184,0.06)", minHeight: 60 }}>
            {/* Sticky left label */}
            <div
              className="shrink-0 border-r p-3 flex flex-col justify-center"
              style={{ width: 144, borderColor: "rgba(148,163,184,0.06)", position: "sticky", left: 0, backgroundColor: "#111827", zIndex: 5 }}
            >
              <div className="flex items-center gap-1.5">
                <Truck size={11} style={{ color: BC[br] }} />
                <span className="text-xs font-mono font-semibold" style={{ color: "#94a3b8" }}>{h}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{br}</div>
              {live && (
                <div className="text-xs font-semibold mt-1" style={{ color: SM[live.status].color }}>
                  ● {SM[live.status].label}
                </div>
              )}
            </div>
            {/* Timeline area */}
            <div style={{ width: timelineW, position: "relative", minHeight: 60 }}>
              {/* Hour grid lines */}
              {Array.from({ length: DAY_TOTAL }, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute", top: 0, bottom: 0, left: (i + 1) * HOUR_PX,
                    width: 1, backgroundColor: "rgba(148,163,184,0.05)",
                  }}
                />
              ))}
              {/* Booking blocks */}
              {hBks.map(bk => {
                const left = (bk.startHour - DAY_START) * HOUR_PX + 2;
                const width = Math.max(bk.duration * HOUR_PX - 4, 30);
                return (
                  <button
                    key={bk.id}
                    onClick={() => onSelect(bk)}
                    className="hover:opacity-75 transition-opacity text-left overflow-hidden"
                    style={{
                      position: "absolute", top: 6, bottom: 6,
                      left, width,
                      borderRadius: 8,
                      backgroundColor: `${SM[bk.status].color}1a`,
                      border: `1px solid ${SM[bk.status].color}40`,
                      padding: "4px 8px",
                    }}
                  >
                    <div className="font-semibold text-xs truncate" style={{ color: SM[bk.status].color }}>
                      {SM[bk.status].label}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: "#cbd5e1" }}>
                      {bk.client.split(" ")[0]}
                    </div>
                    <div className="text-xs font-mono" style={{ color: "#475569" }}>
                      {String(bk.startHour).padStart(2, "0")}–{String(bk.startHour + bk.duration).padStart(2, "0")}
                    </div>
                  </button>
                );
              })}
              {hBks.length === 0 && (
                <div className="absolute inset-0 flex items-center px-4">
                  <span className="text-xs" style={{ color: "#1e293b" }}>Free today</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {hearseList.length === 0 && (
        <div className="flex items-center justify-center flex-1 text-sm" style={{ color: "#334155" }}>
          No branches selected
        </div>
      )}
    </div>
  );
}

// ─── BookingPanel ─────────────────────────────────────────────────────────────
function BookingPanel({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col border-l shadow-2xl"
      style={{ width: 384, backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.1)" }}
    >
      <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
        <div>
          <div className="text-xs font-mono" style={{ color: "#334155" }}>
            {booking.id} · {booking.hearseId}
          </div>
          <div className="text-base font-semibold mt-1" style={{ color: "#f1f5f9", fontFamily: "'Archivo', sans-serif" }}>
            {booking.client}
          </div>
          <div className="mt-2">
            <StatusPill status={booking.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-all"
          style={{ color: "#475569" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1e293b")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Branch + hearse */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#161f2e", border: "1px solid rgba(148,163,184,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${BC[booking.branch]}18` }}
          >
            <Truck size={18} style={{ color: BC[booking.branch] }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>
              {booking.hearseId}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{booking.branch} Branch</div>
          </div>
          <div
            className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
            style={{ backgroundColor: `${BC[booking.branch]}12`, border: `1px solid ${BC[booking.branch]}28` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BC[booking.branch] }} />
            <span className="text-xs font-semibold" style={{ color: BC[booking.branch] }}>{booking.branch}</span>
          </div>
        </div>

        {/* Route */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>Route</div>
          <div className="space-y-2">
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#16a34a18", border: "1px solid #16a34a28" }}
              >
                <MapPin size={13} style={{ color: "#4ade80" }} />
              </div>
              <div>
                <div className="text-xs mb-0.5" style={{ color: "#475569" }}>Pickup</div>
                <div className="text-sm" style={{ color: "#e2e8f0" }}>{booking.pickup}</div>
              </div>
            </div>
            <div className="ml-4 w-px h-4" style={{ backgroundColor: "#1e293b" }} />
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#1d4ed818", border: "1px solid #1d4ed828" }}
              >
                <Navigation size={13} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <div className="text-xs mb-0.5" style={{ color: "#475569" }}>Drop-off</div>
                <div className="text-sm" style={{ color: "#e2e8f0" }}>{booking.dropoff}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>Schedule</div>
          <div
            className="rounded-xl p-4 grid grid-cols-2 gap-4"
            style={{ backgroundColor: "#161f2e", border: "1px solid rgba(148,163,184,0.06)" }}
          >
            <div>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Date</div>
              <div className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{booking.date}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Time window</div>
              <div className="text-sm font-mono" style={{ color: "#e2e8f0" }}>
                {String(booking.startHour).padStart(2, "0")}:00 – {String(booking.startHour + booking.duration).padStart(2, "0")}:00
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Duration</div>
              <div className="text-sm font-medium" style={{ color: "#e2e8f0" }}>
                {booking.duration}h
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Booking ID</div>
              <div className="text-sm font-mono" style={{ color: "#64748b" }}>{booking.id}</div>
            </div>
          </div>
        </div>

        {/* Driver */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>Driver</div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ backgroundColor: "#161f2e", border: "1px solid rgba(148,163,184,0.06)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#31287118", border: "1px solid #31287128" }}
            >
              <User size={15} style={{ color: "#818cf8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{booking.driver}</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: "#64748b" }}>{booking.phone}</div>
            </div>
            <a
              href={`tel:${booking.phone}`}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: "#16a34a18", border: "1px solid #16a34a30" }}
            >
              <Phone size={14} style={{ color: "#4ade80" }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<CalView>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 14));
  const [activeBranches, setActiveBranches] = useState<Branch[]>([...ALL_BRANCHES]);
  const [activeStatuses, setActiveStatuses] = useState<Status[]>([...ALL_STATUSES]);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date(2026, 7, 14, 9, 47, 32));
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Real-time simulation: status transitions every ~12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(prev => new Date(prev.getTime() + 12000));
      if (Math.random() < 0.3) {
        setBookings(prev => {
          const candidates = prev.filter(
            b => b.date === "2026-08-14" &&
            (b.status === "booked" || b.status === "delayed" || b.status === "in-transit")
          );
          if (!candidates.length) return prev;
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const next: Partial<Record<Status, Status>> = {
            booked: "in-transit",
            delayed: "in-transit",
            "in-transit": "completed",
          };
          const nextStatus = next[target.status];
          if (!nextStatus) return prev;
          const msg = `${target.id} · ${target.client.split(" ")[0]}: ${SM[target.status].label} → ${SM[nextStatus].label}`;
          setNotifications(n => [msg, ...n].slice(0, 8));
          return prev.map(b => b.id === target.id ? { ...b, status: nextStatus } : b);
        });
      }
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () => bookings.filter(b => activeBranches.includes(b.branch) && activeStatuses.includes(b.status)),
    [bookings, activeBranches, activeStatuses]
  );

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
    else if (view === "week") setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => addDays(d, dir));
  };

  const calTitle = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy");
  };

  const stats = useMemo(() => ({
    total: filtered.length,
    booked: filtered.filter(b => b.status === "booked").length,
    inTransit: filtered.filter(b => b.status === "in-transit").length,
    delayed: filtered.filter(b => b.status === "delayed").length,
    completed: filtered.filter(b => b.status === "completed").length,
  }), [filtered]);

  const branchChart = ALL_BRANCHES.map(br => ({
    name: br,
    Booked:    filtered.filter(b => b.branch === br && b.status === "booked").length,
    Transit:   filtered.filter(b => b.branch === br && b.status === "in-transit").length,
    Delayed:   filtered.filter(b => b.branch === br && b.status === "delayed").length,
    Completed: filtered.filter(b => b.branch === br && b.status === "completed").length,
  }));

  const pieData = [
    { name: "Booked",     value: stats.booked,    color: "#3b82f6" },
    { name: "In Transit", value: stats.inTransit, color: "#f59e0b" },
    { name: "Delayed",    value: stats.delayed,   color: "#ef4444" },
    { name: "Completed",  value: stats.completed, color: "#22c55e" },
  ].filter(d => d.value > 0);

  const todayStr = "2026-08-14";
  const todayBks = filtered.filter(b => b.date === todayStr);

  const toggleBranch = (br: Branch) =>
    setActiveBranches(p => p.includes(br) ? p.filter(x => x !== br) : [...p, br]);

  const toggleStatus = (st: Status) =>
    setActiveStatuses(p => p.includes(st) ? p.filter(x => x !== st) : [...p, st]);

  const fmtTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        backgroundColor: "#0b0f1a",
        color: "#e2e8f0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 border-b"
        style={{ backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.08)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#312e81" }}
          >
            <Truck size={14} style={{ color: "#a5b4fc" }} />
          </div>
          <div>
            <div
              className="text-sm font-bold leading-none"
              style={{ color: "#f1f5f9", fontFamily: "'Archivo', sans-serif", letterSpacing: "-0.01em" }}
            >
              Amani Hearse Co.
            </div>
            <div className="text-xs leading-none mt-0.5" style={{ color: "#334155" }}>
              Operations Calendar
            </div>
          </div>
        </div>

        <div className="w-px h-5 mx-2" style={{ backgroundColor: "rgba(148,163,184,0.08)" }} />

        {/* Branch toggles */}
        <div className="flex items-center gap-1">
          {ALL_BRANCHES.map(br => (
            <button
              key={br}
              onClick={() => toggleBranch(br)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={activeBranches.includes(br) ? {
                backgroundColor: `${BC[br]}15`,
                color: BC[br],
                border: `1px solid ${BC[br]}30`,
              } : {
                color: "#334155",
                border: "1px solid transparent",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeBranches.includes(br) ? BC[br] : "#1e293b" }}
              />
              {br}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Live badge */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono">Live · {fmtTime(lastUpdated)}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg transition-all"
            style={{ color: "#475569" }}
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#ef4444" }}
              />
            )}
          </button>
          {showNotifs && (
            <div
              className="absolute right-0 top-11 w-80 rounded-xl shadow-2xl z-50 p-3 border"
              style={{ backgroundColor: "#131c2e", borderColor: "rgba(148,163,184,0.1)" }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
                Status Feed
              </div>
              {notifications.length === 0 ? (
                <div className="text-xs py-4 text-center" style={{ color: "#1e293b" }}>
                  No updates yet — monitoring active bookings
                </div>
              ) : notifications.map((n, i) => (
                <div
                  key={i}
                  className="text-xs py-2 border-b last:border-0"
                  style={{ color: "#94a3b8", borderColor: "rgba(148,163,184,0.06)" }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className="w-52 shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.08)" }}
        >
          {/* View switcher */}
          <div className="p-3 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
              View
            </div>
            {(["month", "week", "day"] as CalView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all"
                style={view === v ? {
                  backgroundColor: "rgba(79,70,229,0.14)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(79,70,229,0.28)",
                } : {
                  color: "#475569",
                  border: "1px solid transparent",
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)} View
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="p-3 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
              Filter
            </div>
            {ALL_STATUSES.map(st => (
              <button
                key={st}
                onClick={() => toggleStatus(st)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs mb-1 flex items-center gap-2 transition-all"
                style={{ color: activeStatuses.includes(st) ? "#94a3b8" : "#1e293b" }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeStatuses.includes(st) ? SM[st].color : "#1e293b" }}
                />
                {SM[st].label}
              </button>
            ))}
          </div>

          {/* Today summary */}
          <div className="p-3 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
              Today · Aug 14
            </div>
            {[
              { label: "In Transit", value: todayBks.filter(b => b.status === "in-transit").length, color: "#f59e0b" },
              { label: "Delayed",    value: todayBks.filter(b => b.status === "delayed").length,    color: "#ef4444" },
              { label: "Booked",     value: todayBks.filter(b => b.status === "booked").length,     color: "#3b82f6" },
              { label: "Completed",  value: todayBks.filter(b => b.status === "completed").length,  color: "#22c55e" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs" style={{ color: "#64748b" }}>{s.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums font-mono" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Fleet status today */}
          <div className="p-3">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
              Fleet Status
            </div>
            {ALL_BRANCHES.filter(br => activeBranches.includes(br)).map(br => (
              <div key={br} className="mb-4">
                <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: BC[br] }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BC[br] }} />
                  {br}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {HEARSES[br].map(h => {
                    const bk = todayBks.find(b => b.hearseId === h);
                    const st = bk?.status;
                    return (
                      <button
                        key={h}
                        onClick={() => bk && setSelectedBooking(bk)}
                        title={`${h}: ${st ? SM[st].label : "Free"}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                          backgroundColor: st ? `${SM[st].color}18` : "#0f172a",
                          border: `1px solid ${st ? SM[st].color + "35" : "rgba(148,163,184,0.06)"}`,
                        }}
                      >
                        <Truck size={11} style={{ color: st ? SM[st].color : "#1e293b" }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar toolbar */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0 border-b"
            style={{ backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.08)" }}
          >
            <button
              onClick={() => setCurrentDate(new Date(2026, 7, 14))}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}
            >
              Today
            </button>
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg transition-all hover:bg-slate-800"
                style={{ color: "#475569" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 rounded-lg transition-all hover:bg-slate-800"
                style={{ color: "#475569" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <h2
              className="text-base font-bold"
              style={{ color: "#f1f5f9", fontFamily: "'Archivo', sans-serif", letterSpacing: "-0.01em" }}
            >
              {calTitle()}
            </h2>
            <div className="flex-1" />
            <div className="text-xs font-mono" style={{ color: "#334155" }}>
              {filtered.length} total · {stats.delayed} delayed · {stats.inTransit} active
            </div>
          </div>

          {/* KPI stats row */}
          <div
            className="grid grid-cols-4 gap-3 px-5 py-3 shrink-0 border-b"
            style={{ borderColor: "rgba(148,163,184,0.08)" }}
          >
            {[
              { label: "Total Bookings", value: stats.total,     sub: "This month", color: "#818cf8", Icon: CheckCircle2 },
              { label: "In Transit",     value: stats.inTransit, sub: "Active now",  color: "#f59e0b", Icon: Truck },
              { label: "Delayed",        value: stats.delayed,   sub: "Attention needed", color: "#ef4444", Icon: AlertTriangle },
              { label: "Completed",      value: stats.completed, sub: "This month", color: "#22c55e", Icon: CheckCircle2 },
            ].map(({ label, value, sub, color, Icon }) => (
              <div
                key={label}
                className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ backgroundColor: "#111827", border: "1px solid rgba(148,163,184,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div
                    className="text-2xl font-bold tabular-nums leading-none"
                    style={{ color, fontFamily: "'Archivo', sans-serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: "#64748b" }}>{label}</div>
                  <div className="text-xs" style={{ color: "#334155" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar area */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {view === "month" && (
              <MonthView currentDate={currentDate} bookings={filtered} onSelect={setSelectedBooking} />
            )}
            {view === "week" && (
              <WeekView currentDate={currentDate} bookings={filtered} onSelect={setSelectedBooking} />
            )}
            {view === "day" && (
              <DayView
                currentDate={currentDate}
                bookings={filtered}
                activeBranches={activeBranches}
                onSelect={setSelectedBooking}
              />
            )}
          </div>

          {/* Integrated charts row */}
          <div
            className="shrink-0 border-t flex"
            style={{ height: 192, backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.08)" }}
          >
            {/* Stacked bar — bookings by branch */}
            <div className="flex-1 p-4 border-r" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#334155" }}>
                Bookings by Branch
              </div>
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={branchChart} barSize={9} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={false}
                    tickLine={false}
                    width={18}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131c2e",
                      border: "1px solid rgba(148,163,184,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      color: "#94a3b8",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="Booked"    stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Transit"   stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Delayed"   stackId="a" fill="#ef4444" />
                  <Bar dataKey="Completed" stackId="a" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie — status distribution */}
            <div className="w-56 p-4 border-r" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#334155" }}>
                Status Mix
              </div>
              <ResponsiveContainer width="100%" height={148}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="54%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131c2e",
                      border: "1px solid rgba(148,163,184,0.1)",
                      borderRadius: 10,
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend + branch counts */}
            <div className="flex-1 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
                Summary
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {ALL_STATUSES.map(st => (
                  <div key={st} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SM[st].color }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>{SM[st].label}</span>
                    <span
                      className="ml-auto text-xs font-bold font-mono"
                      style={{ color: SM[st].color }}
                    >
                      {filtered.filter(b => b.status === st).length}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3" style={{ borderColor: "rgba(148,163,184,0.06)" }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
                  Branches
                </div>
                <div className="space-y-1.5">
                  {ALL_BRANCHES.map(br => (
                    <div key={br} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BC[br] }} />
                      <span className="text-xs" style={{ color: "#64748b" }}>{br}</span>
                      <div className="flex-1 mx-2 h-px" style={{ backgroundColor: `${BC[br]}20` }} />
                      <span className="text-xs font-bold font-mono" style={{ color: BC[br] }}>
                        {filtered.filter(b => b.branch === br).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Booking detail panel */}
      {selectedBooking && (
        <BookingPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
