"use client";

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
  ChevronLeft, ChevronRight, Package, AlertTriangle,
  CheckCircle2, Bell, X, User, Phone, MapPin, Navigation,
  ShoppingCart, Wrench, RefreshCw, ClipboardList,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Branch = "Nairobi" | "Machakos" | "Thika";
type CoffinStatus = "available" | "reserved" | "in-service" | "cleaning" | "maintenance" | "sold";
type CalView = "month" | "week" | "day" | "inventory";

interface CoffinModel {
  sku: string;
  label: string;
  capacity: number;
  basePrice: number;
}

interface CoffinBooking {
  id: string;
  sku: string;
  model: string;
  branch: Branch;
  status: CoffinStatus;
  client: string;
  deceasedName: string;
  pickup: string;
  dropoff: string;
  date: string;
  startHour: number;
  duration: number;
  driver: string;
  phone: string;
  price: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CM: Record<CoffinStatus, { label: string; color: string; Icon: any }> = {
  available:    { label: "Available",    color: "#22c55e", Icon: CheckCircle2 },
  reserved:     { label: "Reserved",     color: "#3b82f6", Icon: ClipboardList },
  "in-service": { label: "In Service",   color: "#f59e0b", Icon: Package },
  cleaning:     { label: "Cleaning",     color: "#06b6d4", Icon: RefreshCw },
  maintenance:  { label: "Maintenance",  color: "#ef4444", Icon: Wrench },
  sold:         { label: "Sold",         color: "#a855f7", Icon: ShoppingCart },
};

const BC: Record<Branch, string> = {
  Nairobi:  "#818cf8",
  Machakos: "#fb923c",
  Thika:    "#34d399",
};

const MODELS: CoffinModel[] = [
  { sku: "MHG-01", label: "Mahogany Premier",       capacity: 3, basePrice: 125000 },
  { sku: "OAK-02", label: "Oak Classic",            capacity: 4, basePrice:  85000 },
  { sku: "BRZ-03", label: "Bronze-Handle Elite",    capacity: 2, basePrice: 165000 },
  { sku: "PIN-04", label: "Pine Standard",          capacity: 8, basePrice:  45000 },
  { sku: "CDR-05", label: "Cedar Heritage",         capacity: 3, basePrice: 110000 },
];

const COFFINS: Record<Branch, CoffinModel[]> = {
  Nairobi:  MODELS,
  Machakos: MODELS,
  Thika:    MODELS,
};

import api from "../../api/axios";

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: CoffinStatus }) {
  const { label, color } = CM[status] || { label: status, color: "#64748b" };
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

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function BookingPanel({ booking, onClose }: { booking: CoffinBooking; onClose: () => void }) {
  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col border-l shadow-2xl"
      style={{ width: 384, backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.1)" }}
    >
      <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(148,163,184,0.08)" }}>
        <div>
          <div className="text-xs font-mono" style={{ color: "#334155" }}>
            {booking.id}
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
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#161f2e", border: "1px solid rgba(148,163,184,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${BC[booking.branch] || '#ffffff'}18` }}
          >
            <Package size={18} style={{ color: BC[booking.branch] || '#ffffff' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>
              {booking.model}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{booking.sku}</div>
          </div>
        </div>
        
        <div className="space-y-3">
           <div className="text-xs font-semibold text-white/50 uppercase tracking-widest">Details</div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111827] border border-white/5 p-3 rounded-lg">
                <div className="text-xs text-white/40 mb-1">Deceased</div>
                <div className="text-sm font-medium text-white/90">{booking.deceasedName}</div>
              </div>
              <div className="bg-[#111827] border border-white/5 p-3 rounded-lg">
                <div className="text-xs text-white/40 mb-1">Price</div>
                <div className="text-sm font-medium text-white/90">KES {booking.price?.toLocaleString()}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeBranches, setActiveBranches] = useState<Branch[]>(["Nairobi", "Machakos", "Thika"]);
  const [bookings, setBookings] = useState<CoffinBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<CoffinBooking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/coffins/orders');
        const raw = data?.data || data || [];
        const mapped = raw.map((b: any) => ({
          id: b.order_id || b.id || `UNK-${Math.random()}`,
          sku: b.sku || "UNKNOWN",
          model: b.coffin_name || b.model || "Unknown Model",
          branch: (b.branch_name || b.branch || "Nairobi") as Branch,
          status: (b.status?.toLowerCase() || "reserved") as CoffinStatus,
          client: b.client_name || "Unknown Client",
          deceasedName: b.deceased_name || "Unknown Deceased",
          pickup: b.pickup || "Unknown",
          dropoff: b.destination || b.dropoff || "Unknown",
          date: b.booking_date || b.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          startHour: b.start_hour || 8,
          duration: b.duration || 2,
          driver: b.driver_name || "Unassigned",
          phone: b.client_phone || b.phone || "N/A",
          price: b.price || b.exact_price || 0
        }));
        setBookings(mapped);
      } catch (err) {
        console.error("Failed to fetch coffin bookings", err);
      }
    };
    fetchBookings();
  }, []);

  const filtered = useMemo(
    () => bookings.filter(b => activeBranches.includes(b.branch)),
    [bookings, activeBranches]
  );

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        backgroundColor: "#0b0f1a",
        color: "#e2e8f0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <header
        className="flex items-center gap-3 px-5 py-3 shrink-0 border-b"
        style={{ backgroundColor: "#0d1220", borderColor: "rgba(148,163,184,0.08)" }}
      >
        <div className="flex items-center gap-2.5 mr-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#312e81" }}
          >
            <Package size={14} style={{ color: "#a5b4fc" }} />
          </div>
          <div>
            <div
              className="text-sm font-bold leading-none"
              style={{ color: "#f1f5f9", fontFamily: "'Archivo', sans-serif", letterSpacing: "-0.01em" }}
            >
              Coffin Inventory & Orders
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(bk => (
             <div 
               key={bk.id} 
               onClick={() => setSelectedBooking(bk)}
               className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer shadow-lg"
             >
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-lg font-semibold text-white/90">{bk.model}</h3>
                      <p className="text-sm text-white/50">{bk.client}</p>
                   </div>
                   <StatusPill status={bk.status} />
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-white/60">
                   <div>SKU: <span className="font-mono text-white/80">{bk.sku}</span></div>
                   <div>Branch: <span className="font-semibold" style={{ color: BC[bk.branch] || '#ffffff' }}>{bk.branch}</span></div>
                   <div>Date: <span className="text-white/80">{bk.date}</span></div>
                   <div>Price: <span className="font-mono text-white/80">KES {bk.price.toLocaleString()}</span></div>
                </div>
             </div>
          ))}
          {filtered.length === 0 && (
             <div className="col-span-full py-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
               No coffin orders found.
             </div>
          )}
        </div>
      </main>
      
      {selectedBooking && <BookingPanel booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
}
