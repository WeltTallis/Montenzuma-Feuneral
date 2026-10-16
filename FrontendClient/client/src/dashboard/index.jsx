/**
 * Operations dashboard — public entry point.
 *
 * The monolithic `index.jsx` was split into focused, single-responsibility
 * files. Re-export the default so existing imports keep working:
 *
 *   import Dashboard from "./dashboard"   // or "./dashboard/index"
 *
 *   ./Dashboard.jsx     — main shell (state, handlers, layout, view switching)
 *   ./Sidebar.jsx       — rail: calendar, filters, KPIs, donut, financials
 *   ./Header.jsx        — top strip + ops toolbar
 *   ./useCaseData.js    — data-fetching hook (feeds, socket sync, visibility)
 *   ./schedulePeriod.js — period-heading utility
 *
 * Supporting modules (opsData, opsBits, opsIcons, opsViews, opsAnalytics,
 * opsPanels, StoreSection, StoreView, WorkshopPanel, FlowerAnalytics,
 * shell/DashSidebar) are unchanged and live alongside.
 */
export { default } from "./Dashboard";
