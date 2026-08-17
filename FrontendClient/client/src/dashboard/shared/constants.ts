/**
 * shared/constants.ts
 * Centralised design-tokens, static reference data, and status configs
 * shared across the Hearse, Deceased, and Coffins dashboards.
 */

// ─── Branches ──────────────────────────────────────────────────────────────────
export type Branch = "Nairobi" | "Machakos" | "Thika";

export const BRANCHES: { id: Branch; name: string; hex: string }[] = [
  { id: "Nairobi",   name: "Nairobi",   hex: "#818cf8" },
  { id: "Machakos",  name: "Machakos",  hex: "#fb923c" },
  { id: "Thika",     name: "Thika",     hex: "#34d399" },
];

export const BRANCH_COLOR: Record<Branch, string> = {
  Nairobi:  "#818cf8",
  Machakos: "#fb923c",
  Thika:    "#34d399",
};

// ─── Coffin Models ─────────────────────────────────────────────────────────────
export interface CoffinModel {
  sku: string;
  label: string;
  capacity: number;
  basePrice: number;
}

export const COFFIN_MODELS: CoffinModel[] = [
  { sku: "MHG-01", label: "Mahogany Premier",       capacity: 3, basePrice: 125000 },
  { sku: "OAK-02", label: "Oak Classic",            capacity: 4, basePrice:  85000 },
  { sku: "BRZ-03", label: "Bronze-Handle Elite",    capacity: 2, basePrice: 165000 },
  { sku: "PIN-04", label: "Pine Standard",          capacity: 8, basePrice:  45000 },
  { sku: "CDR-05", label: "Cedar Heritage",         capacity: 3, basePrice: 110000 },
];

// Per-branch stock levels
export interface StockEntry {
  available: number;
  total: number;
  sold: number;
}
export type StockMap = Record<string, StockEntry>;

export const COFFIN_STOCK: Record<Branch, StockMap> = {
  Nairobi:  {
    "MHG-01": { available: 2, total: 3, sold: 1 },
    "OAK-02": { available: 3, total: 4, sold: 1 },
    "BRZ-03": { available: 1, total: 2, sold: 1 },
    "PIN-04": { available: 5, total: 8, sold: 3 },
    "CDR-05": { available: 2, total: 3, sold: 1 },
  },
  Machakos: {
    "MHG-01": { available: 1, total: 2, sold: 1 },
    "OAK-02": { available: 2, total: 3, sold: 1 },
    "BRZ-03": { available: 0, total: 1, sold: 1 },
    "PIN-04": { available: 4, total: 5, sold: 1 },
    "CDR-05": { available: 1, total: 2, sold: 1 },
  },
  Thika: {
    "MHG-01": { available: 0, total: 1, sold: 1 },
    "OAK-02": { available: 1, total: 2, sold: 1 },
    "BRZ-03": { available: 1, total: 1, sold: 0 },
    "PIN-04": { available: 3, total: 4, sold: 1 },
    "CDR-05": { available: 0, total: 1, sold: 1 },
  },
};

// ─── Coffin Status ─────────────────────────────────────────────────────────────
export type CoffinStatus =
  | "available"
  | "reserved"
  | "in-service"
  | "cleaning"
  | "completed"
  | "maintenance"
  | "sold";

export interface StatusMeta {
  label: string;
  color: string;
}

export const COFFIN_STATUS: Record<CoffinStatus, StatusMeta> = {
  available:    { label: "Available",    color: "#22c55e" },
  reserved:     { label: "Reserved",     color: "#3b82f6" },
  "in-service": { label: "In Service",   color: "#f59e0b" },
  cleaning:     { label: "Cleaning",     color: "#06b6d4" },
  completed:    { label: "Completed",    color: "#22c55e" },
  maintenance:  { label: "Maintenance",  color: "#ef4444" },
  sold:         { label: "Sold",         color: "#a855f7" },
};

// ─── Hearse Status ─────────────────────────────────────────────────────────────
export type HearseStatus = "available" | "booked" | "in-transit" | "delayed" | "completed" | "maintenance";

export const HEARSE_STATUS: Record<HearseStatus, StatusMeta> = {
  available:    { label: "Available",   color: "#64748b" },
  booked:       { label: "Booked",      color: "#3b82f6" },
  "in-transit": { label: "In Transit",  color: "#f59e0b" },
  delayed:      { label: "Delayed",     color: "#ef4444" },
  completed:    { label: "Completed",   color: "#22c55e" },
  maintenance:  { label: "Maintenance", color: "#ef4444" },
};

// ─── Design tokens (dark shadcn-style) ────────────────────────────────────────
export const COLORS = {
  BG0:      "#0b0f1a",
  BG1:      "#0d1220",
  BG2:      "#111827",
  BG3:      "#161f2e",
  BORDER:   "rgba(148,163,184,0.08)",
  BORDER2:  "rgba(148,163,184,0.06)",
  TEXT1:    "#f1f5f9",
  TEXT2:    "#94a3b8",
  TEXT3:    "#475569",
  TEXT4:    "#334155",
  EV_INTAKE:   "#3498db",
  EV_RELEASE:  "#27ae60",
  EV_HEARSE:   "#e67e22",
  EV_COFFIN:   "#2e86c1",
  EV_FLOWERS:  "#d6336c",
  EV_SERVICE:  "#6f42c1",
  COFFIN_ACCENT:   "#2e86c1",
  HEARSE_ACCENT:   "#4f46e5",
  DECEASED_ACCENT: "#3498db",
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEK_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
export const DAY_START = 6;
export const DAY_TOTAL = 18;
export const HOUR_PX = 80;
export const REORDER_THRESHOLD = 2;
