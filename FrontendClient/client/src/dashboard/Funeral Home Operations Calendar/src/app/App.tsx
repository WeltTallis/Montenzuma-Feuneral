import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart2,
  X,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Stethoscope,
  Activity,
  Users,
  AlertCircle,
  Heart,
  MapPin,
  TrendingUp,
  Hash,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────
type BranchId = "machakos" | "nairobi" | "thika";
type EventType = "INTAKE" | "RELEASE" | "POSTMORTEM";
type ViewMode = "MONTH" | "DAY" | "ANALYTICS";
type StatusType = "scheduled" | "in-progress" | "completed";

interface FuneralEvent {
  id: string;
  deceasedName: string;
  age: number;
  gender: "M" | "F";
  branch: BranchId;
  type: EventType;
  date: string;
  time: string;
  cause: string;
  nextOfKin: string;
  status: StatusType;
  caseNumber: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const BRANCHES = [
  { id: "machakos" as BranchId, name: "Machakos", hex: "#60a5fa", dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/25" },
  { id: "nairobi" as BranchId, name: "Nairobi", hex: "#34d399", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
  { id: "thika" as BranchId, name: "Thika", hex: "#fbbf24", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25" },
];

const EVENT_TYPES = [
  { id: "INTAKE" as EventType, label: "Deceased Intake", short: "Intake", hex: "#f97316", dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/25", Icon: ArrowDownToLine },
  { id: "RELEASE" as EventType, label: "Deceased Release", short: "Release", hex: "#22c55e", dot: "bg-green-400", text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/25", Icon: ArrowUpFromLine },
  { id: "POSTMORTEM" as EventType, label: "Postmortem Request", short: "Postmortem", hex: "#ef4444", dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/25", Icon: Stethoscope },
];

const STATUS_META: Record<StatusType, { label: string; Icon: any; color: string; bg: string }> = {
  completed: { label: "Completed", Icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  "in-progress": { label: "In Progress", Icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10" },
  scheduled: { label: "Scheduled", Icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getBranch = (id: BranchId) => BRANCHES.find((b) => b.id === id)!;
const getET = (id: EventType) => EVENT_TYPES.find((t) => t.id === id)!;

const TOOLTIP_STYLE = {
  backgroundColor: "#131925",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#dde3ee",
  fontSize: "12px",
};

// ── Events Data ─────────────────────────────────────────────────────────────
const EVENTS: FuneralEvent[] = [
  // ── NAIROBI ──
  { id: "NBI-001", deceasedName: "Peter Kamau Njoroge", age: 72, gender: "M", branch: "nairobi", type: "INTAKE", date: "2026-08-01", time: "08:15", cause: "Hypertensive Heart Disease", nextOfKin: "Grace Njoroge (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0801" },
  { id: "NBI-002", deceasedName: "Mary Wanjiku Kuria", age: 58, gender: "F", branch: "nairobi", type: "INTAKE", date: "2026-08-01", time: "14:30", cause: "Breast Cancer", nextOfKin: "James Kuria (Husband)", status: "completed", caseNumber: "FH/NBI/2026/0802" },
  { id: "NBI-003", deceasedName: "Peter Kamau Njoroge", age: 72, gender: "M", branch: "nairobi", type: "POSTMORTEM", date: "2026-08-02", time: "09:00", cause: "Cardiac Event — Autopsy Ordered", nextOfKin: "Grace Njoroge (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0801" },
  { id: "NBI-004", deceasedName: "Samuel Odhiambo Ochieng", age: 45, gender: "M", branch: "nairobi", type: "INTAKE", date: "2026-08-03", time: "11:00", cause: "Road Traffic Accident", nextOfKin: "Faith Ochieng (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0803" },
  { id: "NBI-005", deceasedName: "Samuel Odhiambo Ochieng", age: 45, gender: "M", branch: "nairobi", type: "POSTMORTEM", date: "2026-08-03", time: "13:30", cause: "Trauma — Coroner Requested", nextOfKin: "Faith Ochieng (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0803" },
  { id: "NBI-006", deceasedName: "Agnes Nyambura Muthoni", age: 83, gender: "F", branch: "nairobi", type: "INTAKE", date: "2026-08-04", time: "10:45", cause: "Natural Causes (Old Age)", nextOfKin: "David Muthoni (Son)", status: "completed", caseNumber: "FH/NBI/2026/0804" },
  { id: "NBI-007", deceasedName: "Mary Wanjiku Kuria", age: 58, gender: "F", branch: "nairobi", type: "RELEASE", date: "2026-08-05", time: "09:00", cause: "Release to Family", nextOfKin: "James Kuria (Husband)", status: "completed", caseNumber: "FH/NBI/2026/0802" },
  { id: "NBI-008", deceasedName: "Joseph Kiprono Bett", age: 61, gender: "M", branch: "nairobi", type: "INTAKE", date: "2026-08-06", time: "16:20", cause: "Stroke (CVA)", nextOfKin: "Rose Bett (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0805" },
  { id: "NBI-009", deceasedName: "Agnes Nyambura Muthoni", age: 83, gender: "F", branch: "nairobi", type: "RELEASE", date: "2026-08-07", time: "08:30", cause: "Release to Family", nextOfKin: "David Muthoni (Son)", status: "completed", caseNumber: "FH/NBI/2026/0804" },
  { id: "NBI-010", deceasedName: "Elizabeth Akinyi Owino", age: 39, gender: "F", branch: "nairobi", type: "INTAKE", date: "2026-08-08", time: "07:50", cause: "Obstetric Complication", nextOfKin: "Michael Owino (Husband)", status: "completed", caseNumber: "FH/NBI/2026/0806" },
  { id: "NBI-011", deceasedName: "Elizabeth Akinyi Owino", age: 39, gender: "F", branch: "nairobi", type: "POSTMORTEM", date: "2026-08-08", time: "11:00", cause: "Maternal Death — Autopsy Required", nextOfKin: "Michael Owino (Husband)", status: "completed", caseNumber: "FH/NBI/2026/0806" },
  { id: "NBI-012", deceasedName: "Thomas Maina Githu", age: 55, gender: "M", branch: "nairobi", type: "INTAKE", date: "2026-08-10", time: "13:15", cause: "Liver Cirrhosis", nextOfKin: "Patricia Githu (Sister)", status: "completed", caseNumber: "FH/NBI/2026/0807" },
  { id: "NBI-013", deceasedName: "Joseph Kiprono Bett", age: 61, gender: "M", branch: "nairobi", type: "RELEASE", date: "2026-08-11", time: "10:00", cause: "Release to Family", nextOfKin: "Rose Bett (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0805" },
  { id: "NBI-014", deceasedName: "Hannah Chebet Korir", age: 28, gender: "F", branch: "nairobi", type: "INTAKE", date: "2026-08-12", time: "20:45", cause: "Suspected Poisoning", nextOfKin: "Paul Korir (Father)", status: "completed", caseNumber: "FH/NBI/2026/0808" },
  { id: "NBI-015", deceasedName: "Hannah Chebet Korir", age: 28, gender: "F", branch: "nairobi", type: "POSTMORTEM", date: "2026-08-13", time: "09:00", cause: "Toxicological Examination", nextOfKin: "Paul Korir (Father)", status: "completed", caseNumber: "FH/NBI/2026/0808" },
  { id: "NBI-016", deceasedName: "Robert Otieno Ouma", age: 49, gender: "M", branch: "nairobi", type: "INTAKE", date: "2026-08-14", time: "15:00", cause: "Kidney Failure", nextOfKin: "Sarah Ouma (Wife)", status: "completed", caseNumber: "FH/NBI/2026/0809" },
  { id: "NBI-017", deceasedName: "Thomas Maina Githu", age: 55, gender: "M", branch: "nairobi", type: "RELEASE", date: "2026-08-15", time: "09:30", cause: "Release to Family", nextOfKin: "Patricia Githu (Sister)", status: "in-progress", caseNumber: "FH/NBI/2026/0807" },
  { id: "NBI-018", deceasedName: "Esther Wairimu Mugo", age: 67, gender: "F", branch: "nairobi", type: "INTAKE", date: "2026-08-15", time: "11:20", cause: "Diabetes Mellitus Type II", nextOfKin: "John Mugo (Son)", status: "in-progress", caseNumber: "FH/NBI/2026/0810" },
  // ── MACHAKOS ──
  { id: "MKS-001", deceasedName: "Mwangi Kiilu Mutisya", age: 78, gender: "M", branch: "machakos", type: "INTAKE", date: "2026-08-01", time: "10:30", cause: "Prostate Cancer", nextOfKin: "Alice Mutisya (Wife)", status: "completed", caseNumber: "FH/MKS/2026/0801" },
  { id: "MKS-002", deceasedName: "Nduku Mueni Nzomo", age: 65, gender: "F", branch: "machakos", type: "INTAKE", date: "2026-08-02", time: "09:20", cause: "Stroke", nextOfKin: "Moses Nzomo (Son)", status: "completed", caseNumber: "FH/MKS/2026/0802" },
  { id: "MKS-003", deceasedName: "Mwangi Kiilu Mutisya", age: 78, gender: "M", branch: "machakos", type: "RELEASE", date: "2026-08-04", time: "08:00", cause: "Release to Family", nextOfKin: "Alice Mutisya (Wife)", status: "completed", caseNumber: "FH/MKS/2026/0801" },
  { id: "MKS-004", deceasedName: "Kavata Muthiani Nzeki", age: 52, gender: "F", branch: "machakos", type: "INTAKE", date: "2026-08-05", time: "17:45", cause: "HIV/AIDS Complications", nextOfKin: "Susan Nzeki (Daughter)", status: "completed", caseNumber: "FH/MKS/2026/0803" },
  { id: "MKS-005", deceasedName: "Nduku Mueni Nzomo", age: 65, gender: "F", branch: "machakos", type: "POSTMORTEM", date: "2026-08-06", time: "10:00", cause: "Cerebrovascular Autopsy", nextOfKin: "Moses Nzomo (Son)", status: "completed", caseNumber: "FH/MKS/2026/0802" },
  { id: "MKS-006", deceasedName: "Matheka Kioko Mutunga", age: 34, gender: "M", branch: "machakos", type: "INTAKE", date: "2026-08-07", time: "22:10", cause: "Road Traffic Accident", nextOfKin: "Jane Mutunga (Mother)", status: "completed", caseNumber: "FH/MKS/2026/0804" },
  { id: "MKS-007", deceasedName: "Matheka Kioko Mutunga", age: 34, gender: "M", branch: "machakos", type: "POSTMORTEM", date: "2026-08-08", time: "08:30", cause: "Trauma Assessment", nextOfKin: "Jane Mutunga (Mother)", status: "completed", caseNumber: "FH/MKS/2026/0804" },
  { id: "MKS-008", deceasedName: "Kavata Muthiani Nzeki", age: 52, gender: "F", branch: "machakos", type: "RELEASE", date: "2026-08-09", time: "11:00", cause: "Release to Family", nextOfKin: "Susan Nzeki (Daughter)", status: "completed", caseNumber: "FH/MKS/2026/0803" },
  { id: "MKS-009", deceasedName: "Wambua Nzau Kimanzi", age: 88, gender: "M", branch: "machakos", type: "INTAKE", date: "2026-08-10", time: "07:00", cause: "Natural Causes", nextOfKin: "Francis Kimanzi (Son)", status: "completed", caseNumber: "FH/MKS/2026/0805" },
  { id: "MKS-010", deceasedName: "Nduku Mueni Nzomo", age: 65, gender: "F", branch: "machakos", type: "RELEASE", date: "2026-08-11", time: "14:00", cause: "Release to Family", nextOfKin: "Moses Nzomo (Son)", status: "completed", caseNumber: "FH/MKS/2026/0802" },
  { id: "MKS-011", deceasedName: "Musyoka Muli Nganga", age: 41, gender: "M", branch: "machakos", type: "INTAKE", date: "2026-08-12", time: "19:00", cause: "Firearm Injury", nextOfKin: "Mary Nganga (Wife)", status: "completed", caseNumber: "FH/MKS/2026/0806" },
  { id: "MKS-012", deceasedName: "Musyoka Muli Nganga", age: 41, gender: "M", branch: "machakos", type: "POSTMORTEM", date: "2026-08-13", time: "09:30", cause: "Ballistic Examination", nextOfKin: "Mary Nganga (Wife)", status: "completed", caseNumber: "FH/MKS/2026/0806" },
  { id: "MKS-013", deceasedName: "Wambua Nzau Kimanzi", age: 88, gender: "M", branch: "machakos", type: "RELEASE", date: "2026-08-14", time: "08:00", cause: "Release to Family", nextOfKin: "Francis Kimanzi (Son)", status: "completed", caseNumber: "FH/MKS/2026/0805" },
  { id: "MKS-014", deceasedName: "Philomena Kathambi Mbithi", age: 70, gender: "F", branch: "machakos", type: "INTAKE", date: "2026-08-15", time: "13:45", cause: "Cardiac Failure", nextOfKin: "Daniel Mbithi (Husband)", status: "scheduled", caseNumber: "FH/MKS/2026/0807" },
  // ── THIKA ──
  { id: "THK-001", deceasedName: "Kariuki Njenga Waweru", age: 54, gender: "M", branch: "thika", type: "INTAKE", date: "2026-08-01", time: "12:00", cause: "Colorectal Cancer", nextOfKin: "Lucy Waweru (Wife)", status: "completed", caseNumber: "FH/THK/2026/0801" },
  { id: "THK-002", deceasedName: "Njeri Gathoni Kamwe", age: 46, gender: "F", branch: "thika", type: "INTAKE", date: "2026-08-03", time: "08:00", cause: "Pulmonary Embolism", nextOfKin: "Chris Kamwe (Husband)", status: "completed", caseNumber: "FH/THK/2026/0802" },
  { id: "THK-003", deceasedName: "Njeri Gathoni Kamwe", age: 46, gender: "F", branch: "thika", type: "POSTMORTEM", date: "2026-08-03", time: "14:00", cause: "Sudden Death — Autopsy Required", nextOfKin: "Chris Kamwe (Husband)", status: "completed", caseNumber: "FH/THK/2026/0802" },
  { id: "THK-004", deceasedName: "Kariuki Njenga Waweru", age: 54, gender: "M", branch: "thika", type: "RELEASE", date: "2026-08-05", time: "10:30", cause: "Release to Family", nextOfKin: "Lucy Waweru (Wife)", status: "completed", caseNumber: "FH/THK/2026/0801" },
  { id: "THK-005", deceasedName: "Githae Muriuki Kabugu", age: 63, gender: "M", branch: "thika", type: "INTAKE", date: "2026-08-06", time: "15:30", cause: "Tuberculosis", nextOfKin: "Anne Kabugu (Daughter)", status: "completed", caseNumber: "FH/THK/2026/0803" },
  { id: "THK-006", deceasedName: "Njeri Gathoni Kamwe", age: 46, gender: "F", branch: "thika", type: "RELEASE", date: "2026-08-07", time: "09:00", cause: "Release to Family", nextOfKin: "Chris Kamwe (Husband)", status: "completed", caseNumber: "FH/THK/2026/0802" },
  { id: "THK-007", deceasedName: "Wairimu Ndirangu Kahinga", age: 22, gender: "F", branch: "thika", type: "INTAKE", date: "2026-08-08", time: "03:20", cause: "Road Traffic Accident", nextOfKin: "Peter Ndirangu (Father)", status: "completed", caseNumber: "FH/THK/2026/0804" },
  { id: "THK-008", deceasedName: "Wairimu Ndirangu Kahinga", age: 22, gender: "F", branch: "thika", type: "POSTMORTEM", date: "2026-08-09", time: "09:00", cause: "Trauma Assessment", nextOfKin: "Peter Ndirangu (Father)", status: "completed", caseNumber: "FH/THK/2026/0804" },
  { id: "THK-009", deceasedName: "Githae Muriuki Kabugu", age: 63, gender: "M", branch: "thika", type: "RELEASE", date: "2026-08-10", time: "11:00", cause: "Release to Family", nextOfKin: "Anne Kabugu (Daughter)", status: "completed", caseNumber: "FH/THK/2026/0803" },
  { id: "THK-010", deceasedName: "Mwenda Kimani Nderi", age: 77, gender: "M", branch: "thika", type: "INTAKE", date: "2026-08-11", time: "14:00", cause: "Pneumonia", nextOfKin: "Ruth Nderi (Wife)", status: "completed", caseNumber: "FH/THK/2026/0805" },
  { id: "THK-011", deceasedName: "Wairimu Ndirangu Kahinga", age: 22, gender: "F", branch: "thika", type: "RELEASE", date: "2026-08-11", time: "16:00", cause: "Release to Family", nextOfKin: "Peter Ndirangu (Father)", status: "completed", caseNumber: "FH/THK/2026/0804" },
  { id: "THK-012", deceasedName: "Wanjiru Kagucia Ngugi", age: 35, gender: "F", branch: "thika", type: "INTAKE", date: "2026-08-13", time: "18:30", cause: "Eclampsia", nextOfKin: "Philip Ngugi (Husband)", status: "completed", caseNumber: "FH/THK/2026/0806" },
  { id: "THK-013", deceasedName: "Wanjiru Kagucia Ngugi", age: 35, gender: "F", branch: "thika", type: "POSTMORTEM", date: "2026-08-14", time: "09:00", cause: "Maternal Death — Coroner Review", nextOfKin: "Philip Ngugi (Husband)", status: "completed", caseNumber: "FH/THK/2026/0806" },
  { id: "THK-014", deceasedName: "Mwenda Kimani Nderi", age: 77, gender: "M", branch: "thika", type: "RELEASE", date: "2026-08-15", time: "08:30", cause: "Release to Family", nextOfKin: "Ruth Nderi (Wife)", status: "in-progress", caseNumber: "FH/THK/2026/0805" },
  { id: "THK-015", deceasedName: "Kamau Njoroge Gacheru", age: 59, gender: "M", branch: "thika", type: "INTAKE", date: "2026-08-15", time: "12:00", cause: "Myocardial Infarction", nextOfKin: "Jane Gacheru (Wife)", status: "scheduled", caseNumber: "FH/THK/2026/0807" },
];

// ── Event Detail Panel ─────────────────────────────────────────────────────
function EventDetailPanel({ event, onClose }: { event: FuneralEvent; onClose: () => void }) {
  const branch = getBranch(event.branch);
  const et = getET(event.type);
  const sm = STATUS_META[event.status];
  const StatusIcon = sm.Icon;
  const ETIcon = et.Icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-[400px] bg-card border-l border-border h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <h2
              className="text-xl font-semibold text-foreground leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {event.deceasedName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono tracking-wide">
              {event.caseNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Event Type Badge */}
        <div className={`mx-6 mt-5 flex items-center gap-3 px-4 py-3 rounded-lg border ${et.bg} ${et.border}`}>
          <ETIcon className={`w-4 h-4 ${et.text} flex-shrink-0`} />
          <span className={`font-semibold text-sm ${et.text}`}>{et.label}</span>
          <span className="text-muted-foreground text-xs ml-auto font-mono">
            {event.date} · {event.time}
          </span>
        </div>

        {/* Status */}
        <div className={`mx-6 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg ${sm.bg}`}>
          <StatusIcon className={`w-4 h-4 ${sm.color}`} />
          <span className={`text-sm font-medium ${sm.color}`}>{sm.label}</span>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Age</p>
              <p className="text-foreground font-semibold">{event.age} years</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Gender</p>
              <p className="text-foreground font-semibold">{event.gender === "M" ? "Male" : "Female"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Branch</p>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${branch.bg} border ${branch.border}`}>
              <MapPin className={`w-3.5 h-3.5 ${branch.text}`} />
              <span className={`font-semibold text-sm ${branch.text}`}>{branch.name} Branch</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
              {event.type === "RELEASE" ? "Release Reason" : "Cause of Death / Procedure"}
            </p>
            <p className="text-foreground text-sm leading-relaxed">{event.cause}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Next of Kin</p>
            <p className="text-foreground text-sm">{event.nextOfKin}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Date & Time</p>
            <p className="text-foreground text-sm font-mono">
              {format(new Date(event.date), "EEEE, dd MMMM yyyy")} — {event.time}
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Case Reference</p>
            <p className="text-foreground text-sm font-mono tracking-wide">{event.caseNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Month View ─────────────────────────────────────────────────────────────
function MonthView({
  currentMonth,
  calendarDays,
  filteredEvents,
  selectedDay,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onEventClick,
}: {
  currentMonth: Date;
  calendarDays: (Date | null)[];
  filteredEvents: FuneralEvent[];
  selectedDay: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (d: Date) => void;
  onEventClick: (e: FuneralEvent) => void;
}) {
  const getEventsForDay = (day: Date) => {
    const ds = format(day, "yyyy-MM-dd");
    return filteredEvents.filter((e) => e.date === ds);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-card/30">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="text-center">
          <h2
            className="text-xl font-semibold text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredEvents.filter((e) => e.date.startsWith(format(currentMonth, "yyyy-MM"))).length} events this month
          </p>
        </div>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) {
              return (
                <div
                  key={`blank-${i}`}
                  className="border-r border-b border-border min-h-[110px] bg-background/30"
                />
              );
            }
            const events = getEventsForDay(day);
            const isSelected = isSameDay(day, selectedDay);
            const isTodayDay = isToday(day);
            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`border-r border-b border-border p-2 cursor-pointer transition-colors min-h-[110px] ${
                  isSelected
                    ? "bg-primary/8 ring-1 ring-inset ring-primary/30"
                    : isTodayDay
                    ? "bg-primary/5"
                    : "hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span
                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isTodayDay
                        ? "bg-primary text-primary-foreground"
                        : isSelected
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {events.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">{events.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map((event) => {
                    const et = getET(event.type);
                    const br = getBranch(event.branch);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${et.bg} ${et.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${et.dot}`} />
                        <span
                          className={`flex-1 truncate font-medium ${et.text}`}
                          style={{ fontSize: "10px", lineHeight: "1.4" }}
                        >
                          {event.deceasedName.split(" ").slice(0, 2).join(" ")}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${br.dot}`} />
                      </div>
                    );
                  })}
                  {events.length > 3 && (
                    <p
                      className="text-muted-foreground px-1 mt-0.5"
                      style={{ fontSize: "10px" }}
                    >
                      +{events.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-6 py-3 border-t border-border flex-shrink-0 bg-card/30">
        {EVENT_TYPES.map((et) => (
          <div key={et.id} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${et.dot}`} />
            <span className="text-xs text-muted-foreground">{et.label}</span>
          </div>
        ))}
        <div className="mx-2 w-px h-3 bg-border" />
        {BRANCHES.map((b) => (
          <div key={b.id} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${b.dot}`} />
            <span className="text-xs text-muted-foreground">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day View ───────────────────────────────────────────────────────────────
function DayView({
  selectedDay,
  dayEvents,
  allEvents,
  onPrevDay,
  onNextDay,
  onEventClick,
}: {
  selectedDay: Date;
  dayEvents: FuneralEvent[];
  allEvents: FuneralEvent[];
  onPrevDay: () => void;
  onNextDay: () => void;
  onEventClick: (e: FuneralEvent) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (h: number) =>
    dayEvents.filter((e) => parseInt(e.time.split(":")[0]) === h);

  const formatHour = (h: number) => {
    if (h === 0) return "12:00 AM";
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return "12:00 PM";
    return `${h - 12}:00 PM`;
  };

  // Summary stats for the day
  const daySummary = {
    intake: dayEvents.filter((e) => e.type === "INTAKE").length,
    release: dayEvents.filter((e) => e.type === "RELEASE").length,
    postmortem: dayEvents.filter((e) => e.type === "POSTMORTEM").length,
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-card/30">
          <button onClick={onPrevDay} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <h2
              className="text-xl font-semibold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {format(selectedDay, "EEEE, dd MMMM yyyy")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayEvents.length === 0
                ? "No events scheduled"
                : `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} scheduled`}
            </p>
          </div>
          <button onClick={onNextDay} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
              <CalendarDays className="w-12 h-12 opacity-20" />
              <p className="text-sm">No events scheduled for this day</p>
              <p className="text-xs opacity-60">Select a day with events from the monthly view</p>
            </div>
          ) : (
            <div className="p-6">
              {hours.map((hour) => {
                const hourEvents = getEventsForHour(hour);
                const hasEvents = hourEvents.length > 0;
                if (!hasEvents && (hour < 3 || hour > 23)) return null;
                return (
                  <div key={hour} className={`flex gap-4 ${hasEvents ? "py-3" : "py-1"}`}>
                    <div className="w-20 flex-shrink-0 text-right pt-0.5">
                      <span
                        className={`text-xs font-mono ${hasEvents ? "text-foreground/70" : "text-muted-foreground/40"}`}
                      >
                        {formatHour(hour)}
                      </span>
                    </div>
                    <div className="flex-1 border-t border-border/40 pt-1 min-h-[24px]">
                      {hasEvents && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-2">
                          {hourEvents.map((event) => {
                            const et = getET(event.type);
                            const br = getBranch(event.branch);
                            const sm = STATUS_META[event.status];
                            const ETIcon = et.Icon;
                            return (
                              <div
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className={`flex gap-3 p-4 rounded-xl border cursor-pointer hover:brightness-110 transition-all ${et.bg} ${et.border}`}
                              >
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-background/30`}
                                >
                                  <ETIcon className={`w-5 h-5 ${et.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {event.time}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${br.bg} ${br.text} ${br.border}`}
                                    >
                                      {br.name}
                                    </span>
                                    <span className={`text-xs ${sm.color} ml-auto`}>
                                      {sm.label}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {event.deceasedName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {event.cause}
                                  </p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className={`text-xs font-semibold ${et.text}`}>
                                      {et.label}
                                    </span>
                                    <span
                                      className="text-xs text-muted-foreground font-mono"
                                      style={{ fontSize: "10px" }}
                                    >
                                      {event.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 border-l border-border overflow-y-auto flex-shrink-0 bg-card/20">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Day Summary</h3>
          <div className="space-y-3">
            {EVENT_TYPES.map((et) => {
              const count = daySummary[et.id.toLowerCase() as keyof typeof daySummary];
              const ETIcon = et.Icon;
              return (
                <div key={et.id} className={`flex items-center gap-3 p-3 rounded-lg ${et.bg} border ${et.border}`}>
                  <ETIcon className={`w-4 h-4 ${et.text} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${et.text}`}>{et.short}</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">By Branch</h3>
          <div className="space-y-2">
            {BRANCHES.map((br) => {
              const count = dayEvents.filter((e) => e.branch === br.id).length;
              return (
                <div key={br.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${br.dot}`} />
                  <span className="text-sm text-muted-foreground flex-1">{br.name}</span>
                  <span className={`text-sm font-bold ${br.text}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming Events</h3>
          <div className="space-y-2">
            {allEvents
              .filter((e) => e.date > format(selectedDay, "yyyy-MM-dd"))
              .slice(0, 5)
              .map((event) => {
                const et = getET(event.type);
                return (
                  <div key={event.id} className="flex items-start gap-2.5 py-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${et.dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {event.deceasedName.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.date} · {event.time}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics View ─────────────────────────────────────────────────────────
function AnalyticsView({
  filteredEvents,
  dailyTrend,
  branchComparison,
  typeDistribution,
  onEventClick,
}: {
  filteredEvents: FuneralEvent[];
  dailyTrend: any[];
  branchComparison: any[];
  typeDistribution: any[];
  onEventClick: (e: FuneralEvent) => void;
}) {
  const totalIntake = filteredEvents.filter((e) => e.type === "INTAKE").length;
  const totalRelease = filteredEvents.filter((e) => e.type === "RELEASE").length;
  const totalPM = filteredEvents.filter((e) => e.type === "POSTMORTEM").length;
  const completedReleases = filteredEvents.filter(
    (e) => e.type === "RELEASE" && e.status === "completed"
  ).length;
  const activeCases = totalIntake - completedReleases;

  const kpis = [
    { label: "Total Intake (Aug)", value: totalIntake, Icon: ArrowDownToLine, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { label: "Released (Aug)", value: totalRelease, Icon: ArrowUpFromLine, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    { label: "Postmortems (Aug)", value: totalPM, Icon: Stethoscope, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
    { label: "Currently In Care", value: activeCases, Icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { label: "Total Events", value: filteredEvents.length, Icon: Activity, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
    { label: "Branches Active", value: 3, Icon: MapPin, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  ];

  const recentEvents = [...filteredEvents]
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .slice(0, 12);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Analytics header */}
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h2
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Operations Analytics
            </h2>
            <p className="text-xs text-muted-foreground">August 2026 · All Branches · Real-time</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(({ label, value, Icon, color, bg, border }) => (
            <div key={label} className={`p-4 rounded-xl border ${bg} ${border} flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Daily Activity Trend — August 2026</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Intake, release & postmortem activity across all branches</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIntake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRelease" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#5d7a9e", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5d7a9e", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#5d7a9e", paddingTop: "12px" }}
                />
                <Area type="monotone" dataKey="Intake" stroke="#f97316" strokeWidth={2} fill="url(#gradIntake)" dot={false} />
                <Area type="monotone" dataKey="Release" stroke="#22c55e" strokeWidth={2} fill="url(#gradRelease)" dot={false} />
                <Area type="monotone" dataKey="Postmortem" stroke="#ef4444" strokeWidth={2} fill="url(#gradPM)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Event Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">By event type — August 2026</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {typeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "#5d7a9e", paddingTop: "4px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Branch Bar Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Branch Performance Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Machakos · Nairobi · Thika — August 2026</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={branchComparison} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#5d7a9e", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5d7a9e", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#5d7a9e", paddingTop: "12px" }} />
                <Bar dataKey="Intake" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="Release" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="Postmortem" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Stacked Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Cumulative Operations by Branch</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total event load per branch — stacked view</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={branchComparison} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#5d7a9e", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5d7a9e", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#5d7a9e", paddingTop: "12px" }} />
                <Bar dataKey="Intake" stackId="a" fill="#f97316" opacity={0.85} />
                <Bar dataKey="Release" stackId="a" fill="#22c55e" opacity={0.85} />
                <Bar dataKey="Postmortem" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Events Log</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest {recentEvents.length} records — click a row for full details</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{filteredEvents.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Case No.", "Deceased", "Branch", "Type", "Date", "Time", "Cause", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, i) => {
                  const et = getET(event.type);
                  const br = getBranch(event.branch);
                  const sm = STATUS_META[event.status];
                  const StatusIcon = sm.Icon;
                  const ETIcon = et.Icon;
                  return (
                    <tr
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`border-b border-border/40 cursor-pointer transition-colors hover:bg-secondary/30 ${
                        i % 2 === 0 ? "" : "bg-background/20"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {event.caseNumber.split("/").slice(-1)[0]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-foreground">{event.deceasedName}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.age}y · {event.gender === "M" ? "Male" : "Female"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${br.bg} ${br.text} ${br.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${br.dot}`} />
                          {br.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${et.bg} ${et.text} ${et.border}`}>
                          <ETIcon className="w-3 h-3" />
                          {et.short}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {event.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {event.time}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                        {event.cause}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${sm.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sm.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<ViewMode>("MONTH");
  const [branchFilter, setBranchFilter] = useState<BranchId | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7, 1));
  const [selectedDay, setSelectedDay] = useState(new Date(2026, 7, 15));
  const [selectedEvent, setSelectedEvent] = useState<FuneralEvent | null>(null);

  const filteredEvents = useMemo(
    () =>
      EVENTS.filter(
        (e) =>
          (branchFilter === "ALL" || e.branch === branchFilter) &&
          (typeFilter === "ALL" || e.type === typeFilter)
      ),
    [branchFilter, typeFilter]
  );

  const dayEvents = useMemo(() => {
    const ds = format(selectedDay, "yyyy-MM-dd");
    return filteredEvents.filter((e) => e.date === ds).sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredEvents, selectedDay]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const blanks: null[] = Array(getDay(start)).fill(null);
    return [...blanks, ...days] as (Date | null)[];
  }, [currentMonth]);

  // Computed analytics data
  const dailyTrend = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const ds = `2026-08-${String(i + 1).padStart(2, "0")}`;
        const de = filteredEvents.filter((e) => e.date === ds);
        return {
          day: String(i + 1),
          Intake: de.filter((e) => e.type === "INTAKE").length,
          Release: de.filter((e) => e.type === "RELEASE").length,
          Postmortem: de.filter((e) => e.type === "POSTMORTEM").length,
        };
      }),
    [filteredEvents]
  );

  const branchComparison = BRANCHES.map((b) => ({
    name: b.name,
    Intake: filteredEvents.filter((e) => e.branch === b.id && e.type === "INTAKE").length,
    Release: filteredEvents.filter((e) => e.branch === b.id && e.type === "RELEASE").length,
    Postmortem: filteredEvents.filter((e) => e.branch === b.id && e.type === "POSTMORTEM").length,
  }));

  const typeDistribution = [
    { name: "Intake", value: filteredEvents.filter((e) => e.type === "INTAKE").length, fill: "#f97316" },
    { name: "Release", value: filteredEvents.filter((e) => e.type === "RELEASE").length, fill: "#22c55e" },
    { name: "Postmortem", value: filteredEvents.filter((e) => e.type === "POSTMORTEM").length, fill: "#ef4444" },
  ];

  // Stats for header
  const monthStr = format(currentMonth, "yyyy-MM");
  const monthEvents = filteredEvents.filter((e) => e.date.startsWith(monthStr));
  const todayStr = "2026-08-15";
  const todayEvents = EVENTS.filter((e) => e.date === todayStr);
  const activeIntakes = EVENTS.filter((e) => e.type === "INTAKE").length;
  const completedReleases = EVENTS.filter((e) => e.type === "RELEASE" && e.status === "completed").length;
  const activeCases = activeIntakes - completedReleases;

  const headerStats = [
    { label: "In Care", value: activeCases, Icon: Users, color: "text-blue-400" },
    { label: "Aug Intakes", value: monthEvents.filter((e) => e.type === "INTAKE").length, Icon: ArrowDownToLine, color: "text-orange-400" },
    { label: "Aug Releases", value: monthEvents.filter((e) => e.type === "RELEASE").length, Icon: ArrowUpFromLine, color: "text-green-400" },
    { label: "Postmortems", value: monthEvents.filter((e) => e.type === "POSTMORTEM").length, Icon: Stethoscope, color: "text-red-400" },
    { label: "Today Arrivals", value: todayEvents.filter((e) => e.type === "INTAKE").length, Icon: Activity, color: "text-purple-400" },
    { label: "Today Releases", value: todayEvents.filter((e) => e.type === "RELEASE").length, Icon: CheckCircle2, color: "text-teal-400" },
  ];

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setView("DAY");
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() - 1);
    setSelectedDay(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + 1);
    setSelectedDay(d);
  };

  return (
    <div
      className="h-screen overflow-hidden bg-background text-foreground flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-4 px-5 py-3 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0 mr-2">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1
                className="text-sm font-semibold text-foreground leading-tight tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Serene Care Funeral Homes
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <p className="text-xs text-muted-foreground">Live Operations · 3 Branches</p>
              </div>
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setBranchFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                branchFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              All Branches
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                onClick={() => setBranchFilter(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                  branchFilter === b.id
                    ? `${b.bg} ${b.text} ${b.border}`
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                {b.name}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Type Filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === "ALL"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              All Types
            </button>
            {EVENT_TYPES.map((et) => (
              <button
                key={et.id}
                onClick={() => setTypeFilter(et.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                  typeFilter === et.id
                    ? `${et.bg} ${et.text} ${et.border}`
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${et.dot}`} />
                {et.short}
              </button>
            ))}
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 flex-shrink-0">
            {(
              [
                { id: "MONTH" as ViewMode, label: "Month", Icon: CalendarDays },
                { id: "DAY" as ViewMode, label: "Day", Icon: Clock },
                { id: "ANALYTICS" as ViewMode, label: "Analytics", Icon: BarChart2 },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  view === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="flex-shrink-0 border-b border-border bg-card/20 px-5 py-2.5">
        <div className="flex items-center gap-6 overflow-x-auto">
          {headerStats.map(({ label, value, Icon, color }) => (
            <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-xl font-bold leading-none ${color}`}>{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="w-px h-5 bg-border ml-3" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden">
        {view === "MONTH" && (
          <MonthView
            currentMonth={currentMonth}
            calendarDays={calendarDays}
            filteredEvents={filteredEvents}
            selectedDay={selectedDay}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
            onDayClick={handleDayClick}
            onEventClick={setSelectedEvent}
          />
        )}
        {view === "DAY" && (
          <DayView
            selectedDay={selectedDay}
            dayEvents={dayEvents}
            allEvents={filteredEvents}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            onEventClick={setSelectedEvent}
          />
        )}
        {view === "ANALYTICS" && (
          <AnalyticsView
            filteredEvents={filteredEvents}
            dailyTrend={dailyTrend}
            branchComparison={branchComparison}
            typeDistribution={typeDistribution}
            onEventClick={setSelectedEvent}
          />
        )}
      </main>

      {/* ── Event Detail Panel ── */}
      {selectedEvent && (
        <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
