/**
 * shared/api.ts
 * API service layer for the unified dashboard.
 * Uses the existing axios instance and fetches real backend data
 * with fallback to demo data on failure.
 */
import api from "../api/axios.ts";
import { ENDPOINTS } from "../api/endpoints.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);

function toKey(date: string | Date): string | null {
  if (date == null || date === "") return null;
  if (typeof date === "string") {
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const dt = new Date(date);
    if (!Number.isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }
    return null;
  }
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return null;
}

const todayKey = () => toKey(new Date()) ?? "";

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await fn();
    return data ?? fallback;
  } catch (err: any) {
    console.warn("[DashboardAPI] fetch failed:", err?.message || err);
    return fallback;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CoffinStockRecord {
  coffin_id?: string;
  id?: string;
  type?: string;
  name?: string;
  quantity?: number;
  stock?: number;
  exact_price?: number;
  price?: number;
  branch_id?: string;
  branch_name?: string;
  branch?: string;
  color?: string;
  category?: string;
  size?: string;
  material?: string;
  capacity?: number;
  [key: string]: any;
}

export interface CoffinOrderRecord {
  id?: string;
  order_id?: string;
  coffin_name?: string;
  coffin_id?: string;
  client_name?: string;
  deceased_name?: string;
  customer_name?: string;
  customer_phone?: string;
  branch_name?: string;
  branch_id?: string;
  status?: string;
  quantity?: number;
  total_amount?: number;
  amount?: number;
  created_at?: string;
  order_date?: string;
  delivery_date?: string;
  [key: string]: any;
}

export interface BranchRecord {
  id?: string;
  branch_id?: string;
  name?: string;
  branch_name?: string;
  [key: string]: any;
}

export interface HearseRecord {
  id?: string;
  hearse_id?: string;
  plate_number?: string;
  hearse_name?: string;
  name?: string;
  branch?: string;
  branch_id?: string;
  branch_name?: string;
  status?: string;
  driver_id?: string;
  driver_name?: string;
  fuel?: number;
  [key: string]: any;
}

export interface HearseBookingRecord {
  id?: string;
  booking_id?: string;
  hearse_id?: string;
  hearse_name?: string;
  plate_number?: string;
  client_name?: string;
  client_phone?: string;
  pickup?: string;
  dropoff?: string;
  booking_date?: string;
  created_at?: string;
  status?: string;
  driver_name?: string;
  branch_name?: string;
  branch_id?: string;
  start_hour?: number;
  duration?: number;
  [key: string]: any;
}

export interface DeceasedRecord {
  id?: string;
  deceased_id?: string;
  admission_number?: string;
  full_name?: string;
  name?: string;
  branch_name?: string;
  branch_id?: string;
  status?: string;
  admission_status?: string;
  date_admitted?: string;
  date_key?: string;
  created_at?: string;
  dispatch_date?: string;
  release_date?: string;
  date_of_death?: string;
  body_status?: string;
  next_of_kin?: string;
  locker?: string;
  age?: number;
  gender?: string;
  [key: string]: any;
}
