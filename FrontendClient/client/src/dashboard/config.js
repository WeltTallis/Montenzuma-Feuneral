import { Truck, Package, Flower2, Users, Calendar, Check, Wrench } from "lucide-react";

/* ---------------------------------------------------------------------------
 * Module definitions — each entry describes one bookable module rendered on
 * the dashboard calendar. Kept here (not in components) for separation of
 * concerns: components import and render, this file owns the domain config.
 * ------------------------------------------------------------------------- */
export const MODULES = [
  {
    id: "hearse",
    label: "Hearse Bookings",
    icon: Truck,
    accent: "#818cf8",
    apiEndpoint: "/hearse-bookings",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      confirmed: { label: "Confirmed", color: "#8b5cf6" },
      booked: { label: "Booked", color: "#3b82f6" },
      scheduled: { label: "Scheduled", color: "#8b5cf6" },
      in_transit: { label: "In Transit", color: "#f59e0b" },
      in_progress: { label: "In Progress", color: "#f59e0b" },
      postponed: { label: "Postponed", color: "#f59e0b" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.booking_dates || b?.booking_date || b?.created_at,
    clientField: "client_name",
    idField: "booking_id",
    kpiFields: [
      { key: "pending", label: "Pending", icon: Calendar },
      { key: "in_transit", label: "In Transit", icon: Truck },
      { key: "completed", label: "Completed", icon: Check },
      { key: "cancelled", label: "Cancelled", icon: Package },
    ],
  },
  {
    id: "coffin",
    label: "Coffin Bookings",
    icon: Package,
    accent: "#fb923c",
    apiEndpoint: "/coffins/orders",
    statusMap: {
      active: { label: "Active", color: "#3b82f6" },
      pending: { label: "Pending", color: "#3b82f6" },
      reserved: { label: "Reserved", color: "#8b5cf6" },
      booked: { label: "Booked", color: "#8b5cf6" },
      ready: { label: "Ready", color: "#f59e0b" },
      delivered: { label: "Delivered", color: "#22c55e" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.service_date || b?.booking_date || b?.created_at,
    clientField: "deceased_name",
    idField: "order_id",
    kpiFields: [
      { key: "active", label: "Active", icon: Package },
      { key: "booked", label: "Booked", icon: Calendar },
      { key: "completed", label: "Completed", icon: Check },
      { key: "cancelled", label: "Cancelled", icon: Package },
    ],
  },
  {
    id: "flower",
    label: "Flower Bookings",
    icon: Flower2,
    accent: "#34d399",
    apiEndpoint: "/florist/bookings",
    statusMap: {
      booked: { label: "Booked", color: "#f59e0b" },
      pending: { label: "Booked", color: "#f59e0b" },       // legacy aliases
      sourced: { label: "Booked", color: "#f59e0b" },
      preparing: { label: "Booked", color: "#f59e0b" },
      confirmed: { label: "Booked", color: "#f59e0b" },
      transit: { label: "Booked", color: "#f59e0b" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.delivery_date || b?.date || b?.created_at,
    clientField: "deceased_name",
    idField: "booking_id",
    kpiFields: [
      { key: "booked", label: "Booked", icon: Calendar },
      { key: "completed", label: "Completed", icon: Check },
    ],
  },
  {
    id: "deceased",
    label: "Deceased Register",
    icon: Users,
    accent: "#f472b6",
    apiEndpoint: "/deceased/deceased-all",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      admitted: { label: "Admitted", color: "#3b82f6" },
      admitting: { label: "Embalming", color: "#8b5cf6" },
      ready: { label: "Ready", color: "#f59e0b" },
      released: { label: "Released", color: "#22c55e" },
      buried: { label: "Buried", color: "#64748b" },
      dispatched: { label: "Dispatched", color: "#64748b" },
      completed: { label: "Completed", color: "#22c55e" },
      transferred: { label: "Transferred", color: "#64748b" },
    },
    dateField: (b) => b?.date_admitted || b?.adm_date || b?.created_at,
    clientField: "full_name",
    idField: "admission_number",
    kpiFields: [
      { key: "admitted", label: "Admitted", icon: Users },
      { key: "released", label: "Released", icon: Check },
      { key: "buried", label: "Buried", icon: Truck },
    ],
  },
  {
    id: "workshop",
    label: "Workshop",
    icon: Wrench,
    accent: "#f472b6",
    apiEndpoint: "/workshop/jobs",
    statusMap: {
      pending: { label: "Pending", color: "#3b82f6" },
      in_progress: { label: "In Progress", color: "#f59e0b" },
      completed: { label: "Completed", color: "#22c55e" },
      cancelled: { label: "Cancelled", color: "#64748b" },
    },
    dateField: (b) => b?.scheduled_date || b?.created_at,
    clientField: "client_name",
    idField: "job_id",
    kpiFields: [
      { key: "pending", label: "Pending", icon: Calendar },
      { key: "in_progress", label: "In Progress", icon: Wrench },
      { key: "completed", label: "Completed", icon: Check },
      { key: "cancelled", label: "Cancelled", icon: Package },
    ],
  },
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEK_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
export const DAY_START = 6;
export const DAY_TOTAL = 16;
export const HOUR_PX = 80;

export const DASH_NAV = [
  {
    section: "Operations",
    items: [
      { i: "H", label: "Hearse", path: "hearse" },
      { i: "D", label: "Deceased", path: "deceased" },
      { i: "C", label: "Coffins", path: "coffins" },
      { i: "W", label: "Workshop", path: "workshop" },
      { i: "F", label: "Flower Bookings", path: "flowers" },
      { i: "M", label: "Mini Store", path: "mini-store" },
    ],
  },
  {
    section: "Analytics & Admin",
    items: [
      { i: "Ch", label: "Chemical Analytics", path: "chemicals/analytics" },
      { i: "De", label: "Deceased Analytics", path: "deceased/analytics" },
      { i: "L", label: "Leaves Dashboard", path: "leaves" },
      { i: "A", label: "Apply Leave", path: "leaves/apply" },
      { i: "St", label: "Settings", path: "settings" },
      { i: "Su", label: "Support", path: "support" },
    ],
  },
];