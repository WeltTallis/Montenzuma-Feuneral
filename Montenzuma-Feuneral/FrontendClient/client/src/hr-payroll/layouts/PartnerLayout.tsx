import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import PartnerSidebar from "@hr/components/PartnerSidebar";
import ProtectedRoute from "@hr/components/ProtectedRoute";
import { SidebarProvider } from "@hr/components/ui/sidebar";
import { NotificationFAB } from "@hr/components/notifications/NotificationFAB";
import { MobileBottomNav } from "@hr/components/MobileBottomNav";
import { SectionErrorBoundary } from "@hr/components/ErrorBoundary";
import { Briefcase01, Calendar, Grid01, Users01 } from "@untitledui/icons";
import type { NavGroup } from "@hr/components/MobileBottomNav";
import { useAuth } from "@hr/contexts";

const PARTNER_NAV_GROUPS: NavGroup[] = [
  { title: "Overview", icon: Grid01, path: "/partner/dashboard", end: true },
  { title: "Projects", icon: Briefcase01, path: "/partner/projects" },
  { title: "Employees", icon: Users01, path: "/partner/employees" },
  { title: "Timesheets", icon: Calendar, path: "/partner/timesheet" },
];

const PartnerLayoutInner = ({ isPartner }: { isPartner: boolean }) => {
  useEffect(() => {
    if (!isPartner) return;
    document.documentElement.classList.add("partner-route-active");
    return () => document.documentElement.classList.remove("partner-route-active");
  }, [isPartner]);

  return (
    <div
      data-partner-ui={isPartner ? "" : undefined}
      data-theme={isPartner ? "congtruong" : undefined}
      className={isPartner ? "partner-shell-scope relative flex h-dvh w-full group/layout" : "relative flex h-dvh w-full group/layout"}
    >
      <PartnerSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(8,120,62,0.07),transparent_30rem)]"
        >
          <div className="min-h-full mobile-main-content animate-page-enter max-w-[1320px] mx-auto">
            <SectionErrorBoundary sectionName="partner workspace">
              <Outlet />
            </SectionErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

const PartnerLayout = () => {
  const { user } = useAuth();
  const isPartner = user?.role === "partner";

  return (
    <ProtectedRoute requiredRole="partner">
      <SidebarProvider defaultOpen={true}>
        <PartnerLayoutInner isPartner={isPartner} />
        <MobileBottomNav groups={PARTNER_NAV_GROUPS} />
        <NotificationFAB />
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default PartnerLayout;
