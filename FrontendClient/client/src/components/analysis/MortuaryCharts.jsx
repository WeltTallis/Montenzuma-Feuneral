// src/components/analysis/MortuaryCharts.jsx
// Professional Mortuary Analytics Chart Suite - mounted inside the Comprehensive Dashboard
import React, { useState, useEffect, useCallback } from "react";
import {
  Row, Col, Card, Spinner, Modal, Button, Badge, Form, Table, Dropdown,
} from "react-bootstrap";

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler, RadialLinearScale,
} from "chart.js";     
import { Bar, Line, Pie, Doughnut, PolarArea } from "react-chartjs-2";
import GaugeChartModule from "react-gauge-chart";
import "chartjs-adapter-date-fns";

import {
  TrendingUp, DollarSign, Box, BarChart3, Calendar, ArrowUpRight,
  ClipboardList, Activity, FlaskConical, Truck, Stethoscope, UserCheck,
  Package, PackageX, ShoppingCart, Car, Shield, Users,
} from "lucide-react";

// react-gauge-chart ships a CommonJS default export; normalize it safely
const GaugeChart = GaugeChartModule.default || GaugeChartModule;

// ============================================================
// PROFESSIONAL COLOR SCHEME
// ============================================================
const COLORS = {
  primary: "#1e3a8a",
  primaryLight: "#3b82f6",
  secondary: "#64748b",
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  info: "#06b6d4",
  infoLight: "#cffafe",
  purple: "#8b5cf6",
  purpleLight: "#ede9fe",
  dark: "#1f2937",
  gray: "#6b7280",
  light: "#f3f4f6",
  white: "#ffffff",
  border: "#e5e7eb",
  chart1: "#3b82f6",
  chart2: "#10b981",
  chart3: "#f59e0b",
  chart4: "#ef4444",
  chart5: "#8b5cf6",
  chart6: "#06b6d4",
};

// Register all ChartJS components used in this suite
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler, RadialLinearScale,
);

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("MortuaryCharts Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center" style={{ fontFamily: "'Inter',sans-serif" }}>
          <h5 className="mb-2">Charts failed to render</h5>
          <Button size="sm" variant="outline-primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// SAFE DATA ACCESS HELPERS
// ============================================================
const getSafeData = (data, path, defaultValue = {}) => {
  try {
    const paths = path.split(".");
    let result = data;
    for (const p of paths) {
      result = result?.[p];
      if (result === undefined || result === null) return defaultValue;
    }
    return result ?? defaultValue;
  } catch (error) {
    console.warn(`Error accessing data path ${path}:`, error);
    return defaultValue;
  }
};

const getSafeArray = (data, path, defaultValue = []) => {
  const result = getSafeData(data, path, defaultValue);
  return Array.isArray(result) ? result : defaultValue;
};

const getSafeObject = (data, path, defaultValue = {}) => {
  const result = getSafeData(data, path, defaultValue);
  return typeof result === "object" && !Array.isArray(result) ? result : defaultValue;
};

const getSafeNumber = (data, path, defaultValue = 0) => {
  const result = getSafeData(data, path, defaultValue);
  return typeof result === "number" ? result : parseFloat(result) || defaultValue;
};
// ============================================================
// PROFESSIONAL SECTION HEADER
// ============================================================
const SectionHeader = ({ title, subtitle, icon: Icon, color = COLORS.primary }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    {Icon && (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ width: "34px", height: "34px", borderRadius: "9px", backgroundColor: `${color}1a`, color }}
      >
        <Icon size={17} />
      </div>
    )}
    <div>
      <h6 className="mb-0 fw-bold" style={{ color: COLORS.dark, fontSize: "1rem" }}>{title}</h6>
      {subtitle && <small className="text-muted" style={{ fontSize: "0.75rem" }}>{subtitle}</small>}
    </div>
  </div>
);

// ============================================================
// PROFESSIONAL CHART CARD
// ============================================================
const ChartCard = ({ title, subtitle, icon: Icon, color = COLORS.primary, children, footer, height = "300px", action }) => (
  <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: "12px" }}>
    <Card.Body className="p-4">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          {Icon && <Icon size={18} style={{ color, flexShrink: 0 }} />}
          <div>
            <h6 className="mb-0 fw-semibold" style={{ color: COLORS.dark, fontSize: "0.92rem" }}>{title}</h6>
            {subtitle && <small className="text-muted" style={{ fontSize: "0.72rem" }}>{subtitle}</small>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ height, position: "relative" }}>
        {children}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card.Body>
  </Card>
);
// ============================================================
// MOCK/DEMO DATA — used when the analytics API is offline
// ============================================================
const mockData = {
  casesTrends: {
    monthly: [45, 52, 48, 65, 58, 72, 68, 75, 70, 65, 78, 85],
    quarterly: [145, 185, 195, 210],
    yearly: [785],
  },
  revenueByCategory: {
    transport: {
      monthly: [120000, 135000, 142000, 158000, 145000, 162000, 178000, 195000, 182000, 175000, 190000, 205000],
      quarterly: [397000, 465000, 555000, 565000],
      yearly: [1982000],
    },
    storage: {
      monthly: [85000, 92000, 88000, 95000, 102000, 110000, 108000, 115000, 112000, 105000, 118000, 125000],
      quarterly: [265000, 307000, 335000, 348000],
      yearly: [1255000],
    },
    supplies: {
      monthly: [45000, 52000, 48000, 55000, 58000, 62000, 65000, 68000, 72000, 70000, 75000, 78000],
      quarterly: [145000, 175000, 205000, 223000],
      yearly: [748000],
    },
    embalming: {
      monthly: [35000, 38000, 42000, 45000, 48000, 52000, 55000, 58000, 53000, 50000, 55000, 60000],
      quarterly: [115000, 145000, 166000, 165000],
      yearly: [591000],
    },
  },
  chemicals: {
    formaldehyde: { monthly: [120, 135, 128, 145, 142, 158, 165, 172, 168, 162, 175, 182], unit: "liters" },
    disinfectants: { monthly: [85, 92, 88, 95, 102, 110, 108, 115, 112, 105, 118, 125], unit: "liters" },
    preservatives: { monthly: [45, 52, 48, 55, 58, 62, 65, 68, 72, 70, 75, 78], unit: "kg" },
    embalming: { monthly: [65, 72, 68, 75, 78, 82, 85, 88, 92, 90, 95, 98], unit: "liters" },
  },
  dispatchSchedule: [
    { id: 1, name: "John Doe", age: 72, cause: "Natural Causes", location: "Nairobi", scheduled: "2024-01-15 09:00", status: "confirmed" },
    { id: 2, name: "Mary Smith", age: 65, cause: "Illness", location: "Mombasa", scheduled: "2024-01-15 11:30", status: "pending" },
    { id: 3, name: "Robert Johnson", age: 58, cause: "Accident", location: "Kisumu", scheduled: "2024-01-15 14:00", status: "confirmed" },
    { id: 4, name: "Sarah Williams", age: 80, cause: "Natural Causes", location: "Nakuru", scheduled: "2024-01-16 10:00", status: "pending" },
    { id: 5, name: "James Brown", age: 45, cause: "Illness", location: "Eldoret", scheduled: "2024-01-16 13:30", status: "confirmed" },
    { id: 6, name: "Emily Davis", age: 68, cause: "Natural Causes", location: "Nairobi", scheduled: "2024-01-16 15:00", status: "pending" },
    { id: 7, name: "Michael Wilson", age: 52, cause: "Illness", location: "Kisumu", scheduled: "2024-01-17 08:30", status: "confirmed" },
  ],
  insurance: {
    activePolicies: 342,
    monthlyPremium: 2850000,
    claimsThisMonth: 18,
    totalCoverage: 125000000,
    trends: {
      policies: [320, 325, 332, 338, 342, 345, 350, 348, 355, 360, 362, 365],
      claims: [12, 15, 14, 18, 16, 20, 18, 22, 25, 28, 30, 32],
      premiums: [2500000, 2550000, 2620000, 2680000, 2720000, 2780000, 2820000, 2850000, 2900000, 2950000, 2980000, 3000000],
    },
  },
  ageDistribution: { "0-17": 15, "18-35": 85, "36-60": 165, "61+": 235 },
  genderDistribution: { male: 320, female: 180 },
  bodyStorage: { occupied: 12, available: 8, maintenance: 2 },
  paymentMethods: { cash: 245, mpesa: 180, insurance: 120, bank: 55, card: 40 },
  causeOfDeath: { "Natural Causes": 280, Illness: 120, Accident: 45, Other: 55 },
  weeklyAdmissions: [18, 22, 15, 20, 25, 19, 12],
};

// Real-time chemical stock tracker rows
const chemicalInventoryData = [
  { id: 1, name: "Formaldehyde (40%)", branch: "Main Branch", currentStock: 45, maxCapacity: 200, unit: "L", dailyUsage: 8.5 },
  { id: 2, name: "Disinfectants", branch: "Main Branch", currentStock: 80, maxCapacity: 150, unit: "L", dailyUsage: 4.2 },
  { id: 3, name: "Embalming Fluid", branch: "Main Branch", currentStock: 60, maxCapacity: 120, unit: "L", dailyUsage: 3.5 },
  { id: 4, name: "Formaldehyde (40%)", branch: "Westlands", currentStock: 12, maxCapacity: 200, unit: "L", dailyUsage: 9.1 },
  { id: 5, name: "Disinfectants", branch: "Westlands", currentStock: 110, maxCapacity: 120, unit: "L", dailyUsage: 5.0 },
  { id: 6, name: "Embalming Fluid", branch: "Kilimani", currentStock: 8, maxCapacity: 100, unit: "L", dailyUsage: 2.0 },
];

// Real-time coffin stock / velocity rows
const coffinInventoryTableData = [
  { id: 1, type: "Premium Oak", currentStock: 12, soldThisMonth: 8, costPrice: 15000, sellingPrice: 35000 },
  { id: 2, type: "Standard Mahogany", currentStock: 25, soldThisMonth: 22, costPrice: 8000, sellingPrice: 18000 },
  { id: 3, type: "Pine Economy", currentStock: 40, soldThisMonth: 35, costPrice: 3000, sellingPrice: 6500 },
  { id: 4, type: "Metal Casket", currentStock: 5, soldThisMonth: 2, costPrice: 25000, sellingPrice: 55000 },
  { id: 5, type: "Eco-Cardboard", currentStock: 100, soldThisMonth: 45, costPrice: 500, sellingPrice: 1500 },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];
const YEAR_LABELS = ["Year"];
// ============================================================
// CHART OPTIONS
// ============================================================
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { usePointStyle: true, padding: 15, font: { size: 11 }, color: COLORS.gray },
    },
    tooltip: {
      backgroundColor: COLORS.dark,
      titleColor: COLORS.white,
      bodyColor: COLORS.white,
      cornerRadius: 8,
      padding: 12,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: COLORS.gray } },
    y: { grid: { color: COLORS.light }, ticks: { color: COLORS.gray }, beginAtZero: true },
  },
};

const chartOptionsDualAxis = {
  ...chartOptions,
  scales: {
    x: { grid: { display: false } },
    y: {
      type: "linear",
      display: true,
      position: "left",
      title: { display: true, text: "Count", color: COLORS.gray },
      grid: { color: COLORS.light },
      ticks: { color: COLORS.gray },
    },
    y1: {
      type: "linear",
      display: true,
      position: "right",
      title: { display: true, text: "Value (KES)", color: COLORS.gray },
      grid: { drawOnChartArea: false },
      ticks: { color: COLORS.gray },
    },
  },
};

// ============================================================
// CHART DATA PREPARATION
// ============================================================
const getPeriodLabels = (timeFrame) =>
  timeFrame === "monthly" ? MONTH_LABELS : timeFrame === "quarterly" ? QUARTER_LABELS : YEAR_LABELS;

const getPeriodData = (obj, timeFrame, fallback) => {
  if (timeFrame === "monthly") return obj.monthly || fallback;
  if (timeFrame === "quarterly") return obj.quarterly || fallback;
  return obj.yearly || fallback;
};

const getCasesTrendsData = (timeFrame, cases) => {
  const fallback =
    timeFrame === "monthly" ? mockData.casesTrends.monthly
      : timeFrame === "quarterly" ? mockData.casesTrends.quarterly
      : mockData.casesTrends.yearly;
  const data = Array.isArray(cases) && cases.length
    ? cases.map((c) => c.count || c.cases || c.total || 0)
    : fallback;
  return {
    labels: getPeriodLabels(timeFrame),
    datasets: [{
      label: "Cases Handled",
      data,
      borderColor: COLORS.chart1,
      backgroundColor: `${COLORS.chart1}20`,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: COLORS.chart1,
      pointBorderColor: COLORS.white,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };
};

const getMonthlyRevenueData = (revenueTotal) => {
  const labels = Object.keys(revenueTotal);
  const values = Object.values(revenueTotal);
  const hasData = labels.length > 0 && values.some((v) => Number(v) > 0);
  return {
    labels: hasData ? labels : [...MONTH_LABELS],
    datasets: [{
      label: "Monthly Revenue",
      data: hasData
        ? values
        : [450000, 520000, 480000, 650000, 580000, 720000, 680000, 750000, 700000, 650000, 780000, 850000],
      borderColor: COLORS.chart2,
      backgroundColor: `${COLORS.chart2}20`,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: COLORS.chart2,
      pointBorderColor: COLORS.white,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };
};
const getRevenueByCategoryData = (timeFrame, extraServices) => {
  const labels = getPeriodLabels(timeFrame);
  const getData = (key) => {
    if (extraServices && Object.keys(extraServices).length > 0) {
      return getPeriodData(extraServices[key] || {}, timeFrame, []);
    }
    return getPeriodData(mockData.revenueByCategory[key], timeFrame, []);
  };
  return {
    labels,
    datasets: [
      { label: "Transport", data: getData("transport"), borderColor: COLORS.chart1, backgroundColor: `${COLORS.chart1}20`, borderWidth: 2, fill: true, tension: 0.3 },
      { label: "Storage", data: getData("storage"), borderColor: COLORS.chart2, backgroundColor: `${COLORS.chart2}20`, borderWidth: 2, fill: true, tension: 0.3 },
      { label: "Supplies", data: getData("supplies"), borderColor: COLORS.chart3, backgroundColor: `${COLORS.chart3}20`, borderWidth: 2, fill: true, tension: 0.3 },
      { label: "Embalming", data: getData("embalming"), borderColor: COLORS.chart4, backgroundColor: `${COLORS.chart4}20`, borderWidth: 2, fill: true, tension: 0.3 },
    ],
  };
};

const getChemicalsUsageData = (usage) => {
  if (usage && Array.isArray(usage) && usage.length > 0) {
    const chemicals = [...new Set(usage.map((u) => u.chemical || u.name).filter(Boolean))];
    const palette = [COLORS.chart4, COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart5, COLORS.chart6];
    return {
      labels: [...MONTH_LABELS],
      datasets: chemicals.map((chem, idx) => ({
        label: chem,
        data: MONTH_LABELS.map((_, mIdx) => {
          const record = usage.find(
            (u) => (u.chemical || u.name) === chem &&
              (Number(u.month_num) === mIdx + 1 || u.month === MONTH_LABELS[mIdx])
          );
          return record ? Number(record.qty || record.quantity_used || 0) : 0;
        }),
        borderColor: palette[idx % palette.length],
        backgroundColor: `${palette[idx % palette.length]}20`,
        borderWidth: 2,
        fill: true,
      })),
    };
  }
  return {
    labels: [...MONTH_LABELS],
    datasets: [
      { label: "Formaldehyde", data: mockData.chemicals.formaldehyde.monthly, borderColor: COLORS.chart4, backgroundColor: `${COLORS.chart4}20`, borderWidth: 2, fill: true },
      { label: "Disinfectants", data: mockData.chemicals.disinfectants.monthly, borderColor: COLORS.chart1, backgroundColor: `${COLORS.chart1}20`, borderWidth: 2, fill: true },
      { label: "Preservatives", data: mockData.chemicals.preservatives.monthly, borderColor: COLORS.chart2, backgroundColor: `${COLORS.chart2}20`, borderWidth: 2, fill: true },
      { label: "Embalming Fluid", data: mockData.chemicals.embalming.monthly, borderColor: COLORS.chart3, backgroundColor: `${COLORS.chart3}20`, borderWidth: 2, fill: true },
    ],
  };
};
const getAgeDistributionData = (ageDist) => {
  const src = ageDist && Object.keys(ageDist).length > 0 ? ageDist : mockData.ageDistribution;
  return {
    labels: Object.keys(src),
    datasets: [{
      label: "Age Groups",
      data: Object.values(src),
      backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4],
      borderWidth: 2,
      borderColor: COLORS.white,
    }],
  };
};

const getGenderDistributionData = (gender) => {
  const src = gender && Object.keys(gender).length > 0 ? gender : mockData.genderDistribution;
  return {
    labels: ["Male", "Female"],
    datasets: [{
      data: [src.male || 0, src.female || 0],
      backgroundColor: [COLORS.chart1, COLORS.chart5],
      borderWidth: 2,
      borderColor: COLORS.white,
    }],
  };
};

const getBodyStorageData = (storage) => {
  const src = storage && Object.keys(storage).length > 0 ? storage : mockData.bodyStorage;
  return {
    labels: ["Occupied", "Available", "Maintenance"],
    datasets: [{
      data: [src.occupied || 0, src.available || 0, src.maintenance || 0],
      backgroundColor: [COLORS.danger, COLORS.success, COLORS.warning],
      borderWidth: 2,
      borderColor: COLORS.white,
    }],
  };
};

const getPaymentMethodsData = (methods) => {
  const src = methods && Object.keys(methods).length > 0 ? methods : mockData.paymentMethods;
  return {
    labels: Object.keys(src),
    datasets: [{
      label: "Payment Methods",
      data: Object.values(src),
      backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
      borderWidth: 0,
      borderRadius: 8,
    }],
  };
};

const getCauseOfDeathData = (causes) => {
  const src = causes && Object.keys(causes).length > 0 ? causes : mockData.causeOfDeath;
  return {
    labels: Object.keys(src),
    datasets: [{
      label: "Cause of Death",
      data: Object.values(src),
      backgroundColor: [COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart6],
      borderWidth: 2,
      borderColor: COLORS.white,
    }],
  };
};

const getCoffinSalesData = (sales) => {
  const hasData = Array.isArray(sales) && sales.length > 0;
  return {
    labels: hasData ? sales.map((c) => c.month || c.label || "") : [...MONTH_LABELS],
    datasets: [{
      label: "Coffin Sales",
      data: hasData
        ? sales.map((c) => c.sales || c.count || 0)
        : [12, 18, 15, 20, 22, 25, 18, 28, 24, 20, 26, 30],
      backgroundColor: COLORS.chart3,
      borderWidth: 0,
      borderRadius: 8,
    }],
  };
};

const getInsuranceTrendsData = (insurance) => {
  const src = (insurance && insurance.trends) || mockData.insurance.trends;
  return {
    labels: [...MONTH_LABELS],
    datasets: [
      { label: "Active Policies", data: src.policies || mockData.insurance.trends.policies, borderColor: COLORS.chart5, backgroundColor: `${COLORS.chart5}20`, borderWidth: 3, fill: true, yAxisID: "y" },
      { label: "Monthly Premiums (KES 100K)", data: (src.premiums || mockData.insurance.trends.premiums).map((p) => p / 100000), borderColor: COLORS.chart1, backgroundColor: `${COLORS.chart1}20`, borderWidth: 3, fill: true, yAxisID: "y1" },
    ],
  };
};

const getFinancialTrendsData = () => ({
  labels: [...MONTH_LABELS],
  datasets: [
    { label: "Collection Rate (%)", data: [85, 86, 88, 90, 91, 92, 93, 94, 95, 95, 96, 97], borderColor: COLORS.chart5, backgroundColor: `${COLORS.chart5}20`, borderWidth: 3, fill: true, tension: 0.4, yAxisID: "y" },
    { label: "Outstanding (%)", data: [15, 14, 12, 10, 9, 8, 7, 6, 5, 5, 4, 3], borderColor: COLORS.chart4, backgroundColor: `${COLORS.chart4}20`, borderWidth: 3, fill: true, tension: 0.4, yAxisID: "y1" },
  ],
});

const getVisitorTrendsData = (visitorTrends) => {
  const hasData = visitorTrends && Object.keys(visitorTrends).length > 0;
  return {
    labels: hasData ? Object.keys(visitorTrends) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Admissions",
        data: hasData ? Object.values(visitorTrends).map((day) => day.admissions || 0) : [18, 22, 15, 20, 25, 19, 12],
        backgroundColor: `${COLORS.chart1}20`,
        borderColor: COLORS.chart1,
        borderWidth: 2,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Avg Processing Days",
        data: hasData ? Object.values(visitorTrends).map((day) => day.avgProcessingDays || 0) : [2.1, 2.4, 1.9, 2.3, 2.0, 2.2, 1.8],
        backgroundColor: `${COLORS.chart2}20`,
        borderColor: COLORS.chart2,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };
};
// ============================================================
// MAIN CHART SUITE COMPONENT
// ============================================================
const MortuaryCharts = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    caseStatus: {},
    revenue: { total: {}, extraServices: {} },
    monthlyTrends: [],
    visitorTrends: {},
    coffinSales: [],
    averageStayDuration: {},
    coffinInventory: {},
    bodyStorage: {},
    paymentMethods: {},
    causeOfDeath: {},
    ageDistribution: {},
    genderDistribution: {},
    financialMetrics: {},
    operationalMetrics: {},
    chemicals: {},
    insurance: {},
  });
  const [vehicleData, setVehicleData] = useState({ fleetSummary: {}, vehicles: [], topPerformers: {} });

  const [timeFrame, setTimeFrame] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch mortuary + vehicle analytics (graceful fallback to mock data when offline)
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const mortuaryResponse = await fetch("http://localhost:5000/api/v1/restpoint/analytics/mortuary-analytics");
        const mortuaryResult = mortuaryResponse.ok ? await mortuaryResponse.json() : null;
        if (mounted && mortuaryResult?.success) setDashboardData(mortuaryResult.data);

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const vehicleResponse = await fetch(
          `http://localhost:5000/api/v1/restpoint/vehicle-analytics?month=${currentMonth}&year=${currentYear}`
        );
        const vehicleResult = vehicleResponse.ok ? await vehicleResponse.json() : null;
        if (mounted && vehicleResult?.success) setVehicleData(vehicleResult.data);
      } catch (error) {
        console.error("MortuaryCharts: error fetching data, using fallback mock data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // ============================================================
  // CHART CLICK — DRILL DOWN
  // ============================================================
  const handleChartClick = useCallback(async (elements, chart, type) => {
    if (!elements || !elements.length) return;
    setLoadingDetails(true);
    setShowModal(true);
    try {
      const element = elements[0];
      const isCircular = type === "pie" || type === "doughnut" || type === "polar";
      const label = chart.data.labels[element.index];
      const value = isCircular
        ? chart.data.datasets[0].data[element.index]
        : chart.data.datasets[element.datasetIndex].data[element.index];

      const mockDetails = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        caseNumber: `CASE-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        service: label,
        status: ["RECEIVED", "UNDER_CARE", "PENDING", "COMPLETED"][i % 4],
        amount: typeof value === "number" ? value / 8 : 0,
        date: new Date(Date.now() - i * 172800000).toLocaleDateString(),
        billedBy: ["Dr. Kamau", "Dr. Omondi", "Dr. Wanjiku", "Dr. Mutua"][i % 4],
      }));

      setSelectedData({ label, value, details: mockDetails, type });
    } catch (error) {
      console.error("Error loading details:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);
// ============================================================
  // MODAL CONTENT (DRILL-DOWN DETAILS)
  // ============================================================
  const renderModalContent = () => {
    if (!selectedData) return <div className="text-center text-muted py-4">No data selected</div>;
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">{selectedData.label}</h5>
            <Badge bg="info" className="px-3 py-2">
              Total: {typeof selectedData.value === "number" ? selectedData.value.toLocaleString() : selectedData.value}
              {selectedData.type === "revenue" ? " KES" : selectedData.type === "distance" ? " km" : ""}
            </Badge>
          </div>
        </div>
        {loadingDetails ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading detailed records...</p>
          </div>
        ) : selectedData.details?.length > 0 ? (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <Table hover responsive size="sm">
              <thead className="table-light">
                <tr>
                  <th>Case No.</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Billed By</th>
                </tr>
              </thead>
              <tbody>
                {selectedData.details.map((detail) => (
                  <tr key={detail.id}>
                    <td><strong>{detail.caseNumber}</strong></td>
                    <td>{detail.service}</td>
                    <td>
                      <Badge bg={
                        detail.status === "COMPLETED" ? "success"
                          : detail.status === "READY" ? "primary"
                          : detail.status === "UNDER_CARE" ? "warning"
                          : "secondary"
                      } className="px-2">{detail.status}</Badge>
                    </td>
                    <td>
                      {selectedData.type === "revenue"
                        ? `KES ${(detail.amount || 0).toLocaleString()}`
                        : selectedData.type === "distance"
                          ? `${detail.amount || 0} km`
                          : `${detail.amount || 0}`}
                    </td>
                    <td><small>{detail.date}</small></td>
                    <td><small>{detail.billedBy}</small></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted py-5">No records found</div>
        )}
      </div>
    );
  };

  // ============================================================
  // SAFE DATA ACCESS FOR RENDERING
  // ============================================================
  const caseStatusData = getSafeObject(dashboardData, "caseStatus");
  const revenueTotalData = getSafeObject(dashboardData, "revenue.total");
  const revenueExtraServicesData = getSafeObject(dashboardData, "revenue.extraServices");
  const monthlyTrendsData = getSafeArray(dashboardData, "monthlyTrends");
  const visitorTrendsData = getSafeObject(dashboardData, "visitorTrends");
  const coffinSalesData = getSafeArray(dashboardData, "coffinSales");
  const coffinInventoryData = getSafeObject(dashboardData, "coffinInventory");
  const financialMetricsData = getSafeObject(dashboardData, "financialMetrics");
  const operationalMetricsData = getSafeObject(dashboardData, "operationalMetrics");
  const vehicles = getSafeArray(vehicleData, "vehicles");
  const chemicalsUsage = getSafeArray(dashboardData, "chemicals.usageTrends");

  const collectionRate = financialMetricsData.collectionRate || 0;
  const outstandingPercentage = financialMetricsData.outstandingPercentage || 0;
  const todayVisitors = operationalMetricsData.todayVisitors || 0;
  const monthlyVisitors = operationalMetricsData.monthlyVisitors || 0;

  const storageSummarized = getSafeObject(dashboardData, "bodyStorage");
  const storageOccupied = storageSummarized.occupied || 12;
  const storageAvailable = storageSummarized.available || 8;
  const storageTotal = storageOccupied + storageAvailable;
  const storagePctOverall = storageTotal > 0 ? storageOccupied / storageTotal : 0;

  // ── Resource-utilization gauge sources (data-derived, no fabricated magic numbers) ──
  // react-gauge-chart feeds formatTextValue a 0-100 value, and `percent` a 0-1 fraction.
  const fleetSummary = getSafeObject(vehicleData, "fleetSummary");
  const fleetTotalUnits = getSafeNumber(fleetSummary, "total") || getSafeNumber(fleetSummary, "fleetTotal") || vehicles.length || 0;
  const fleetReadyUnits = getSafeNumber(fleetSummary, "ready") || getSafeNumber(fleetSummary, "available") || getSafeNumber(fleetSummary, "inService") || getSafeNumber(fleetSummary, "operational") || 0;
  const fleetReadinessPct = fleetTotalUnits > 0 ? Math.min(1, Math.max(0, fleetReadyUnits / fleetTotalUnits)) : 0;

  const chemicalsData = getSafeObject(dashboardData, "chemicals");
  const chemicalTypes = Object.keys(chemicalsData).filter(
    (k) => k !== "lowStock" && typeof chemicalsData[k] === "object" && !Array.isArray(chemicalsData[k])
  );
  const lowStockCount = getSafeArray(chemicalsData, "lowStock").length;
  const chemicalHealthPct = chemicalTypes.length > 0
    ? Math.min(1, Math.max(0, (chemicalTypes.length - lowStockCount) / chemicalTypes.length))
    : 0;

  const collectionPercent = collectionRate > 0 ? Math.min(1, collectionRate / 100) : 0;


  const getAvailableYears = () => {
    try {
      const years = new Set();
      Object.keys(revenueTotalData).forEach((monthYear) => {
        const year = monthYear.split(" ")[1];
        if (year) years.add(parseInt(year));
      });
      const list = Array.from(years).sort((a, b) => b - a);
      return list.length ? list : [new Date().getFullYear()];
    } catch (error) {
      return [new Date().getFullYear()];
    }
  };
// ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <ErrorBoundary>
      {loading ? (
        <div className="text-center py-4" style={{ fontFamily: "'Inter',sans-serif" }}>
          <Spinner animation="border" variant="primary" size="sm" className="me-2" />
          <small className="text-muted">Loading analytics charts...</small>
        </div>
      ) : (
        <div style={{ fontFamily: "'Inter',sans-serif" }}>
          {/* ─── Suite header + time controls ─── */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <SectionHeader
              title="Analytics & Charts"
              subtitle="Mortuary performance, operations, and financials"
              icon={BarChart3}
              color={COLORS.primary}
            />
            <div className="d-flex gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm" style={{ borderRadius: "8px" }}>
                  <Calendar size={14} className="me-1" /> {selectedYear}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {getAvailableYears().map((year) => (
                    <Dropdown.Item key={year} onClick={() => setSelectedYear(year)} active={year === selectedYear}>
                      {year}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Form.Select
                size="sm"
                style={{ width: "140px", borderRadius: "8px" }}
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Form.Select>
            </div>
          </div>

          {/* ─── OVERVIEW CHARTS ─── */}
          <Row className="g-3 mb-3">
            <Col xl={6}>
              <ChartCard title="Cases Handled Trends" icon={ArrowUpRight} color={COLORS.primary} height="280px">
                <Line
                  data={getCasesTrendsData(timeFrame, monthlyTrendsData)}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} cases` },
                      },
                    },
                  }}
                />
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Case Status" icon={ClipboardList} color={COLORS.info} height="260px">
                <Pie
                  data={
                    Object.keys(caseStatusData).length > 0
                      ? {
                          labels: Object.keys(caseStatusData).map((s) => s.charAt(0) + s.slice(1).toLowerCase()),
                          datasets: [{
                            data: Object.values(caseStatusData),
                            backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
                            borderWidth: 2,
                            borderColor: COLORS.white,
                          }],
                        }
                      : {
                          labels: ["Received", "Under Care", "Pending", "Completed", "Released"],
                          datasets: [{
                            data: [35, 25, 15, 18, 7],
                            backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
                            borderWidth: 2,
                            borderColor: COLORS.white,
                          }],
                        }
                  }
                  options={{ ...chartOptions, onClick: (e, elements) => { if (elements?.length) handleChartClick(elements, e.chart, "pie"); } }}
                />
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Gender Distribution" icon={Users} color={COLORS.purple} height="260px">
                <Doughnut
                  data={getGenderDistributionData(dashboardData.genderDistribution)}
                  options={{ ...chartOptions, onClick: (e, elements) => { if (elements?.length) handleChartClick(elements, e.chart, "doughnut"); } }}
                />
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Age Distribution" icon={BarChart3} color={COLORS.warning} height="260px">
                <Bar
                  data={getAgeDistributionData(dashboardData.ageDistribution)}
                  options={{ ...chartOptions, onClick: (e, elements) => { if (elements?.length) handleChartClick(elements, e.chart, "bar"); } }}
                />
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Cause of Death" icon={Stethoscope} color={COLORS.danger} height="260px">
                <PolarArea
                  data={getCauseOfDeathData(dashboardData.causeOfDeath)}
                  options={{ ...chartOptions, onClick: (e, elements) => { if (elements?.length) handleChartClick(elements, e.chart, "polar"); } }}
                />
              </ChartCard>
            </Col>
          </Row>
{/* ─── OPERATIONS: CHEMICALS ─── */}
          <Row className="g-3 mb-3">
            <Col xl={12}>
              <ChartCard title="Chemicals Usage Trends" icon={FlaskConical} color={COLORS.danger} height="280px">
                <Line
                  data={getChemicalsUsageData(chemicalsUsage)}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ${["liters", "liters", "kg", "liters", "units"][ctx.datasetIndex % 5]}`,
                        },
                      },
                    },
                  }}
                />
                <Row className="mt-3 text-center pt-3 border-top">
                  <Col xs={3}>
                    <h6 className="text-danger mb-0">{mockData.chemicals.formaldehyde.monthly.reduce((a, b) => a + b, 0)}L</h6>
                    <small className="text-muted">Formaldehyde</small>
                  </Col>
                  <Col xs={3}>
                    <h6 className="text-info mb-0">{mockData.chemicals.disinfectants.monthly.reduce((a, b) => a + b, 0)}L</h6>
                    <small className="text-muted">Disinfectants</small>
                  </Col>
                  <Col xs={3}>
                    <h6 className="text-success mb-0">{mockData.chemicals.preservatives.monthly.reduce((a, b) => a + b, 0)}kg</h6>
                    <small className="text-muted">Preservatives</small>
                  </Col>
                  <Col xs={3}>
                    <h6 className="text-warning mb-0">{mockData.chemicals.embalming.monthly.reduce((a, b) => a + b, 0)}L</h6>
                    <small className="text-muted">Embalming</small>
                  </Col>
                </Row>
              </ChartCard>
            </Col>
          </Row>
{/* ─── CHEMICAL INVENTORY TRACKER ─── */}
          <Row className="g-3 mb-3">
            <Col xl={12}>
              <div
                style={{
                  background: COLORS.white,
                  border: "1px solid var(--color-border, #e5e5e5)",
                  borderRadius: "12px",
                  padding: "16px 18px",
                }}
              >
                <SectionHeader
                  title="Chemical Inventory Tracker"
                  subtitle="Real-time stock levels, depletion rates, and reorder points"
                  icon={FlaskConical}
                  color={COLORS.danger}
                />
                <div style={{ overflowX: "auto" }}>
                  <Table hover responsive size="sm" style={{ fontSize: "0.85rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>Chemical</th>
                        <th>Branch</th>
                        <th>Current Stock</th>
                        <th className="text-center">Avg. Daily Use</th>
                        <th className="text-center">Days Until Empty</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chemicalInventoryData.map((chem) => {
                        const daysLeft = chem.dailyUsage > 0 ? Math.floor(chem.currentStock / chem.dailyUsage) : 999;
                        const pctLeft = Math.min(100, (chem.currentStock / chem.maxCapacity) * 100);
                        const statusColor = daysLeft <= 5 ? COLORS.danger : daysLeft <= 14 ? COLORS.warning : COLORS.success;
                        const statusText = daysLeft <= 5 ? "Critical" : daysLeft <= 14 ? "Low Stock" : "Adequate";
                        return (
                          <tr key={chem.id} style={{ backgroundColor: daysLeft <= 5 ? `${COLORS.dangerLight}40` : "transparent" }}>
                            <td className="fw-semibold">{chem.name}</td>
                            <td>{chem.branch}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{ width: "80px", height: "6px", borderRadius: "4px", backgroundColor: COLORS.light, overflow: "hidden" }}>
                                  <div style={{ width: `${pctLeft}%`, backgroundColor: statusColor, height: "100%", borderRadius: "4px" }} />
                                </div>
                                <span>{chem.currentStock} {chem.unit}</span>
                              </div>
                            </td>
                            <td className="text-center">{chem.dailyUsage} {chem.unit}/day</td>
                            <td className="text-center fw-bold" style={{ color: statusColor }}>
                              {daysLeft === 999 ? "N/A" : `${daysLeft} days`}
                            </td>
                            <td className="text-center">
                              <Badge bg={statusText === "Critical" ? "danger" : statusText === "Low Stock" ? "warning" : "success"} style={{ fontSize: "0.7rem" }}>
                                {statusText}
                              </Badge>
                            </td>
                            <td className="text-center">
                              {daysLeft <= 14 && (
                                <Button size="sm" variant="outline-danger" style={{ fontSize: "0.7rem", borderRadius: "6px", padding: "2px 8px" }}>
                                  <PackageX size={12} className="me-1" /> Reorder
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Col>
          </Row>
{/* ─── RESOURCE UTILIZATION GAUGES ─── */}
          <div className="mb-3" style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <ChartCard title="Body Storage Occupancy" icon={Package} color={COLORS.danger} height="200px">
              <GaugeChart
                id="storage-gauge"
                nrOfLevels={20}
                percent={Math.max(0.05, Math.min(1, storagePctOverall))}
                colors={[COLORS.success, COLORS.warning, COLORS.danger]}
                arcWidth={0.35}
                cornerRadius={4}
                textColor={COLORS.dark}
                needleColor={COLORS.dark}
                fontSize="16px"
                formatTextValue={(value) => `${Math.round(value)}% full`}
              />
            </ChartCard>

            <ChartCard title="Hearse Fleet Readiness" icon={Car} color={COLORS.info} height="200px">
              <GaugeChart
                id="fleet-gauge"
                nrOfLevels={20}
                                percent={fleetReadinessPct}
                colors={[COLORS.success, COLORS.warning]}
                arcWidth={0.35}
                cornerRadius={4}
                textColor={COLORS.dark}
                needleColor={COLORS.dark}
                fontSize="16px"
                formatTextValue={(value) => `${Math.round(value)}% ready`}
              />
            </ChartCard>

            <ChartCard title="Revenue Collection Rate" icon={DollarSign} color={COLORS.purple} height="200px">
              <GaugeChart
                id="collection-gauge"
                nrOfLevels={20}
                                percent={collectionPercent}
                colors={[COLORS.success, COLORS.warning]}
                arcWidth={0.35}
                cornerRadius={4}
                textColor={COLORS.dark}
                needleColor={COLORS.dark}
                fontSize="16px"
                formatTextValue={(value) => `${Math.round(value)}% collected`}
              />
            </ChartCard>

            <ChartCard title="Chemical Stock Health" icon={FlaskConical} color={COLORS.warning} height="200px">
              <GaugeChart
                id="chemical-gauge"
                nrOfLevels={20}
                                percent={chemicalHealthPct}
                colors={[COLORS.danger, COLORS.warning, COLORS.success]}
                arcWidth={0.35}
                cornerRadius={4}
                textColor={COLORS.dark}
                needleColor={COLORS.dark}
                fontSize="16px"
                formatTextValue={(value) => `${Math.round(value)}% healthy`}
              />
            </ChartCard>
          </div>
{/* ─── INVENTORY MANAGEMENT CHARTS ─── */}
          <Row className="g-3 mb-3">
            <Col xl={6}>
              <ChartCard title="Coffin Sales Trend" icon={Box} color={COLORS.warning} height="280px">
                <Bar
                  data={getCoffinSalesData(coffinSalesData)}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: { label: (ctx) => `${ctx.parsed.y} coffins sold` },
                      },
                    },
                  }}
                />
                <Row className="mt-3 text-center pt-3 border-top">
                  <Col xs={4}>
                    <h6 className="text-primary mb-0">
                      {coffinSalesData.length > 0 ? coffinSalesData.reduce((a, c) => a + (c.sales || c.count || 0), 0) : 248}
                    </h6>
                    <small className="text-muted">Total Sold</small>
                  </Col>
                  <Col xs={4}>
                    <h6 className="text-success mb-0">
                      {coffinSalesData.length > 0 ? (coffinSalesData.reduce((a, c) => a + (c.sales || c.count || 0), 0) / coffinSalesData.length).toFixed(1) : "20.7"}
                    </h6>
                    <small className="text-muted">Monthly Avg</small>
                  </Col>
                  <Col xs={4}>
                    <h6 className="text-warning mb-0">
                      {coffinSalesData.length > 0 ? Math.max(...coffinSalesData.map((c) => c.sales || c.count || 0)) : 30}
                    </h6>
                    <small className="text-muted">Best Month</small>
                  </Col>
                </Row>
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Coffin Inventory" icon={Box} color={COLORS.warning} height="280px">
                <Pie
                  data={
                    Object.keys(coffinInventoryData).length > 0
                      ? {
                          labels: Object.keys(coffinInventoryData),
                          datasets: [{
                            data: Object.values(coffinInventoryData).map((v) => (typeof v === "number" ? v : v.quantity || 0)),
                            backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
                            borderWidth: 2,
                            borderColor: COLORS.white,
                          }],
                        }
                      : {
                          labels: ["Oak", "Mahogany", "Pine", "Metal", "Eco"],
                          datasets: [{
                            data: [35, 25, 20, 12, 8],
                            backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
                            borderWidth: 2,
                            borderColor: COLORS.white,
                          }],
                        }
                  }
                  options={chartOptions}
                />
              </ChartCard>
            </Col>

            <Col xl={3} lg={6}>
              <ChartCard title="Fleet Status" icon={Car} color={COLORS.info} height="280px">
                <Doughnut
                  data={{
                    labels: vehicles.length > 0
                      ? vehicles.map((v) => v.vehiclePlate?.trim() || v.plateNumber || "Unknown")
                      : ["KDK 456G", "KDK 497C", "KCM 234D", "KCA 789E", "KCB 101F"],
                    datasets: [{
                      data: vehicles.length > 0
                        ? vehicles.map((v) => v.kilometers?.currentMonth || v.currentMonthKm || 0)
                        : [45, 28, 20, 15, 7],
                      backgroundColor: [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4, COLORS.chart5],
                      borderWidth: 2,
                      borderColor: COLORS.white,
                    }],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.y} km` },
                      },
                    },
                  }}
                />
              </ChartCard>
            </Col>
<Col xl={12}>
              <ChartCard title="Coffin Inventory & Velocity" icon={ShoppingCart} color={COLORS.purple} height="300px">
                <div style={{ overflowX: "auto", height: "100%" }}>
                  <Table hover size="sm" style={{ fontSize: "0.85rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>Coffin Type</th>
                        <th className="text-center">In Stock</th>
                        <th className="text-center">Sold (Mo.)</th>
                        <th className="text-center">Velocity</th>
                        <th className="text-center">Days of Stock</th>
                        <th className="text-end">Selling Price</th>
                        <th className="text-end">Margin</th>
                        <th className="text-end">Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coffinInventoryTableData.map((coffin) => {
                        const velocity = (coffin.soldThisMonth / 30).toFixed(2);
                        const daysOfStock = velocity > 0 ? Math.floor(coffin.currentStock / velocity) : 999;
                        const margin = ((coffin.sellingPrice - coffin.costPrice) / coffin.sellingPrice * 100).toFixed(0);
                        return (
                          <tr key={coffin.id}>
                            <td className="fw-semibold">{coffin.type}</td>
                            <td className="text-center">{coffin.currentStock}</td>
                            <td className="text-center text-danger fw-bold">{coffin.soldThisMonth}</td>
                            <td className="text-center">{velocity}/day</td>
                            <td className="text-center fw-bold" style={{ color: daysOfStock <= 14 ? COLORS.danger : COLORS.dark }}>
                              {daysOfStock === 999 ? "N/A" : `${daysOfStock} days`}
                            </td>
                            <td className="text-end">KES {coffin.sellingPrice.toLocaleString()}</td>
                            <td className="text-end text-success">{margin}%</td>
                            <td className="text-end fw-semibold">KES {(coffin.currentStock * coffin.costPrice).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </ChartCard>
            </Col>

            {/* Hearse Distance Coverage */}
            <Col xl={6}>
              <ChartCard title="Hearse Distance Coverage" icon={Truck} color={COLORS.primary} height="280px">
                <Line
                  data={{
                    labels: [...MONTH_LABELS],
                    datasets: [
                      { label: "KDK 456G", data: [245, 280, 265, 310, 295, 320, 335, 300, 285, 270, 290, 315], borderColor: COLORS.chart1, backgroundColor: `${COLORS.chart1}20`, borderWidth: 2, fill: true, tension: 0.4 },
                      { label: "KDK 497C", data: [180, 195, 210, 225, 240, 255, 270, 285, 260, 245, 230, 215], borderColor: COLORS.chart2, backgroundColor: `${COLORS.chart2}20`, borderWidth: 2, fill: true, tension: 0.4 },
                      { label: "KCM 234D", data: [150, 165, 180, 195, 210, 225, 240, 255, 230, 215, 200, 185], borderColor: COLORS.chart3, backgroundColor: `${COLORS.chart3}20`, borderWidth: 2, fill: true, tension: 0.4 },
                      { label: "KCA 789E", data: [120, 135, 150, 165, 180, 195, 210, 225, 200, 185, 170, 155], borderColor: COLORS.chart4, backgroundColor: `${COLORS.chart4}20`, borderWidth: 2, fill: true, tension: 0.4 },
                      { label: "KCB 101F", data: [90, 105, 120, 135, 150, 165, 180, 195, 170, 155, 140, 125], borderColor: COLORS.chart5, backgroundColor: `${COLORS.chart5}20`, borderWidth: 2, fill: true, tension: 0.4 },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} km` },
                      },
                    },
                  }}
                />
              </ChartCard>
            </Col>

            {/* Body Storage Status */}
            <Col xl={3} lg={6}>
              <ChartCard title="Body Storage Status" icon={Package} color={COLORS.danger} height="280px">
                <Doughnut data={getBodyStorageData(dashboardData.bodyStorage)} options={chartOptions} />
                <div className="mt-2 pt-2 border-top text-center">
                  <small className="text-muted">Occupied vs Available vs Maintenance</small>
                </div>
              </ChartCard>
            </Col>

            {/* Payment Methods */}
            <Col xl={3} lg={6}>
              <ChartCard title="Payment Methods" icon={DollarSign} color={COLORS.success} height="280px">
                <Bar
                  data={getPaymentMethodsData(dashboardData.paymentMethods)}
                  options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
                />
              </ChartCard>
            </Col>
{/* Visitor Admissions & Processing Time */}
            <Col xl={12}>
              <ChartCard title="Visitor Admissions & Processing Time" icon={UserCheck} color={COLORS.purple} height="260px">
                <Line
                  data={getVisitorTrendsData(visitorTrendsData)}
                  options={{
                    ...chartOptionsDualAxis,
                    plugins: {
                      ...chartOptionsDualAxis.plugins,
                      tooltip: {
                        ...chartOptionsDualAxis.plugins.tooltip,
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}${ctx.dataset.yAxisID === "y1" ? " days" : " admissions"}`,
                        },
                      },
                    },
                  }}
                />
                {Object.keys(visitorTrendsData).length > 0 && (
                  <div className="d-flex justify-content-center gap-4 mt-3 pt-3 border-top">
                    <span className="small text-muted"><UserCheck size={12} className="me-1" /> Today: <b>{todayVisitors || "—"}</b></span>
                    <span className="small text-muted"><Users size={12} className="me-1" /> This month: <b>{monthlyVisitors || "—"}</b></span>
                  </div>
                )}
              </ChartCard>
            </Col>
          </Row>
{/* ─── FINANCIALS & INSURANCE ─── */}
          <div
            className="mb-3"
            style={{
              background: COLORS.white,
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <SectionHeader
              title="Financials & Insurance"
              subtitle="Revenue streams, collections, and policy health"
              icon={DollarSign}
              color={COLORS.success}
            />
            <Row className="g-3">
              <Col xl={6}>
                <ChartCard title="Monthly Revenue Trend" icon={TrendingUp} color={COLORS.success} height="280px">
                  <Line
                    data={getMonthlyRevenueData(revenueTotalData)}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: { label: (ctx) => `KES ${ctx.parsed.y.toLocaleString()}` },
                        },
                      },
                    }}
                  />
                </ChartCard>
              </Col>

              <Col xl={6}>
                <ChartCard title="Revenue by Category" icon={BarChart3} color={COLORS.primary} height="280px">
                  <Line
                    data={getRevenueByCategoryData(timeFrame, revenueExtraServicesData)}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: { label: (ctx) => `${ctx.dataset.label}: KES ${ctx.parsed.y.toLocaleString()}` },
                        },
                      },
                    }}
                  />
                </ChartCard>
              </Col>

              <Col xl={6}>
                <ChartCard title="Insurance Trends" icon={Shield} color={COLORS.purple} height="280px">
                  <Line data={getInsuranceTrendsData(dashboardData.insurance)} options={chartOptionsDualAxis} />
                </ChartCard>
              </Col>

              <Col xl={6}>
                <ChartCard title="Financial Health" icon={Activity} color={COLORS.info} height="280px">
                  <Line
                    data={getFinancialTrendsData()}
                    options={{
                      ...chartOptionsDualAxis,
                      scales: {
                        ...chartOptionsDualAxis.scales,
                        y: { ...chartOptionsDualAxis.scales.y, title: { display: true, text: "%", color: COLORS.gray } },
                        y1: { ...chartOptionsDualAxis.scales.y1, title: { display: true, text: "%", color: COLORS.gray } },
                      },
                    }}
                  />
                  <div className="mt-2 pt-2 border-top text-center">
                    <small className="text-muted">
                      Collection: <b>{collectionRate > 0 ? `${collectionRate}%` : "97%"}</b> · Outstanding:{" "}
                      <b>{outstandingPercentage > 0 ? `${outstandingPercentage}%` : "3%"}</b>
                    </small>
                  </div>
                </ChartCard>
              </Col>
            </Row>
          </div>
{/* ─── DISPATCH SCHEDULE TABLE ─── */}
          <div
            style={{
              background: COLORS.white,
              border: "1px solid var(--color-border, #e5e5e5)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <SectionHeader
              title="Upcoming Dispatch Schedule"
              subtitle={`${mockData.dispatchSchedule.filter((d) => d.status === "confirmed").length} confirmed · ${mockData.dispatchSchedule.filter((d) => d.status === "pending").length} pending`}
              icon={Truck}
              color={COLORS.dark}
            />
            <div style={{ overflowX: "auto" }}>
              <Table hover responsive size="sm" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Cause</th>
                    <th>Destination</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.dispatchSchedule.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.age}</td>
                      <td><Badge bg="light" text="dark" style={{ fontSize: "0.75rem" }}>{item.cause}</Badge></td>
                      <td>{item.location}</td>
                      <td>{item.scheduled}</td>
                      <td>
                        <Badge bg={item.status === "confirmed" ? "success" : "warning"} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                          {item.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          {/* ─── DRILL-DOWN MODAL ─── */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: "1.1rem" }}>
                <BarChart3 size={20} className="me-2" style={{ color: COLORS.primary }} />
                Detailed Breakdown
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ paddingTop: "8px" }}>
              {renderModalContent()}
            </Modal.Body>
            <Modal.Footer style={{ border: "none" }}>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)} style={{ borderRadius: "8px" }}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default MortuaryCharts;