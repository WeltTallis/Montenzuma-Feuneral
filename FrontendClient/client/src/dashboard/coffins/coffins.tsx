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
