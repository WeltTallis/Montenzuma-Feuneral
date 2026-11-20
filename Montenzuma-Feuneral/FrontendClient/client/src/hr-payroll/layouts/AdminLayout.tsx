import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import AdminSidebar from "@hr/components/AdminSidebar";
import ProtectedRoute from "@hr/components/ProtectedRoute";
import { SidebarProvider } from "@hr/components/ui/sidebar";
import { NotificationFAB } from "@hr/components/notifications/NotificationFAB";
import { MobileBottomNav } from "@hr/components/MobileBottomNav";
import { SectionErrorBoundary } from "@hr/components/ErrorBoundary";
import { useAuth } from "@hr/contexts";
import { useIsMobile, useIsTablet } from "@hr/hooks/useBreakpoint";
import {
  Activity,
  BookOpen01,
  Briefcase01,
  CalendarDate,
  Clipboard,
  Clock,
  ClockRewind,
  Home01,
  Receipt,
  Settings01,
  UserEdit,
  Users01,
  Wallet01,
} from "@untitledui/icons";
import type { NavGroup, NavLeaf } from "@hr/components/MobileBottomNav";

const ADV_PARTNER_NAV_GROUPS: NavGroup[] = [
  { title: "Salary advances", icon: Wallet01, path: "/adv-partner/advance-payments" },
  { title: "Users", icon: UserEdit, path: "/adv-partner/users" },
];

const ADMIN_NAV_GROUPS: NavGroup[] = [
  { title: "Overview", icon: Home01, path: "/admin", end: true },
  { title: "Timesheets", icon: Clock, path: "/admin/timesheet" },
  { title: "Salary advances", icon: Wallet01, path: "/admin/advance-payments" },
];

export const ADMIN_MORE_ITEMS: NavLeaf[] = [
  { title: "Audit log", icon: Clipboard, path: "/admin/audit-log" },
  { title: "API health", icon: Activity, path: "/admin/system-health" },
  { title: "Users", icon: UserEdit, path: "/admin/users" },
  { title: "Projects", icon: Briefcase01, path: "/admin/projects" },
  { title: "Employees", icon: Users01, path: "/admin/employees" },
  { title: "Payment history", icon: ClockRewind, path: "/admin/payment-history" },
  { title: "Ledger", icon: BookOpen01, path: "/admin/ledger" },
  { title: "Wallet", icon: Wallet01, path: "/admin/wallet" },
  { title: "Scheduled jobs", icon: CalendarDate, path: "/admin/cron-health" },
  { title: "Settings", icon: Settings01, path: "/admin/settings" },
];

const AdminLayoutInner = () => {
  const isMobile = useIsMobile();

  return (
    <div
      className={
        isMobile
          ? "admin-shell relative flex min-h-dvh w-full group/layout"
          : "admin-shell relative flex h-dvh w-full group/layout"
      }
    >
      <AdminSidebar />
      <div
        className={
          isMobile
            ? "flex min-w-0 flex-1 flex-col"
            : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        }
      >
        <main
          id="main-content"
          className={
            isMobile
              ? "admin-main min-h-dvh flex-1 overflow-visible"
              : "admin-main min-h-0 flex-1 overflow-auto"
          }
        >
          <div className="admin-shell-rail" aria-hidden="true" />
          <div className="admin-page-frame mobile-main-content animate-page-enter">
            <div className="admin-page-inner">
              <SectionErrorBoundary sectionName="admin workspace">
                <Outlet />
              </SectionErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { user } = useAuth();
  const isAdvPartner = user?.role === 'adv_partner';
  const isAdmin = user?.role === 'admin';
  // Tablet (768–1023px): start with the sidebar collapsed to the icon rail so
  // data tables get the full remaining width. Desktop keeps it expanded.
  const isTablet = useIsTablet();

  useEffect(() => {
    if (!isAdmin) return;
    document.documentElement.classList.add("admin-route-active");
    return () => document.documentElement.classList.remove("admin-route-active");
  }, [isAdmin]);

  return (
    <ProtectedRoute requiredRole={["admin", "adv_partner"]}>
      <SidebarProvider defaultOpen={!isTablet}>
        <div
          data-admin-ui={isAdmin ? "" : undefined}
          data-theme={isAdmin ? "congtruong" : undefined}
          className={isAdmin ? "admin-shell-scope" : "w-full min-w-0"}
        >
          <div className="w-full min-w-0 [container-type:inline-size]">
            <AdminLayoutInner />
          </div>
          <MobileBottomNav
            groups={isAdvPartner ? ADV_PARTNER_NAV_GROUPS : ADMIN_NAV_GROUPS}
            moreItems={isAdvPartner ? undefined : ADMIN_MORE_ITEMS}
          />
          <NotificationFAB />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default AdminLayout;
