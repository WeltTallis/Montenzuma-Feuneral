import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@hr/components/ui/skeleton";
import { toast } from "@hr/components/ui/sonner";
import { useAuth } from "@hr/contexts/AuthContext";
import {
  useEmployeeProfile,
  useUpdateEmployeePassword,
  useEmployeeTimesheetsInfinite,
} from "@hr/hooks/api/useEmployeePortal";
import { useSettingByKey } from "@hr/hooks/api/useSettings";
import { useEmployeeMonth } from "@hr/hooks/useEmployeeMonth";
import type { EmployeeTimesheetFilters } from "@hr/types/api/auth.types";
import { NotificationSheet } from "@hr/components/notifications/NotificationSheet";
import { EmployeeBankInfoCard } from "@hr/components/employees/EmployeeBankInfoCard";
import { EmployeeAdBanner } from "@hr/components/employees/EmployeeAdBanner";
import { EmployeeMobileShell } from "@hr/components/employees/EmployeeMobileShell";
import { EmployeeCanopy } from "@hr/components/employees/EmployeeCanopy";
import { EmployeeTimesheetPanel } from "@hr/components/employees/EmployeeTimesheetPanel";
import { ChangePasswordSheet } from "@hr/components/employees/ChangePasswordSheet";
import { useUnreadNotifications } from "@hr/hooks/api/useNotifications";
import { groupTimesheetsByDay } from "@hr/utils/employeePortal/timesheetGrouping";
import { useInfiniteScroll } from "@hr/hooks/use-infinite-scroll";
import {
  createRegularEmployeeHomeModel,
  hasEmployeeBankInfo,
} from "@hr/utils/employeePortal/mobileHome";

const EmployeePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const month = useEmployeeMonth();
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useEmployeeProfile();
  const {
    data: bulkTransferSetting,
    isLoading: paymentSettingLoading,
    isError: paymentSettingError,
    isFetching: paymentSettingFetching,
    refetch: refetchPaymentSetting,
  } = useSettingByKey("bulk_transfer_payment_percentage", !!profile);
  const { data: unreadNotifications } = useUnreadNotifications();
  const bulkTransferPercentage = bulkTransferSetting?.value ? parseFloat(bulkTransferSetting.value) : 0;

  const baseFilters = useMemo<Omit<EmployeeTimesheetFilters, "page" | "pageSize">>(
    () => ({
      sortBy: "date",
      sortOrder: "desc",
      fromDate: month.fromDate,
      toDate: month.toDate,
    }),
    [month.fromDate, month.toDate]
  );

  const { data: infiniteData, isLoading: timesheetsLoading, isError: timesheetsError, isFetching: timesheetsFetching, refetch: refetchTimesheets, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEmployeeTimesheetsInfinite(baseFilters, 50);

  const {
    groupedDays,
    monthlyTotalHours,
    monthlyTotalSalary,
    totalPaid,
    totalPayable,
    totalRecords,
  } = useMemo(() => {
    const timesheets = infiniteData?.pages.flatMap((page) => page.data) ?? [];
    const totals = timesheets.reduce(
      (summary, timesheet) => ({
        monthlyTotalSalary: summary.monthlyTotalSalary + timesheet.amount,
        monthlyTotalHours: summary.monthlyTotalHours + timesheet.hours_worked,
        totalPaid: summary.totalPaid + timesheet.paid_amount,
        totalPayable: summary.totalPayable + timesheet.amount * bulkTransferPercentage,
      }),
      {
        monthlyTotalSalary: 0,
        monthlyTotalHours: 0,
        totalPaid: 0,
        totalPayable: 0,
      }
    );

    return {
      groupedDays: groupTimesheetsByDay(timesheets),
      totalRecords: infiniteData?.pages?.[0]?.pagination?.totalRecords ?? 0,
      ...totals,
    };
  }, [bulkTransferPercentage, infiniteData]);
  const { observerRef } = useInfiniteScroll({
    hasMore: !!hasNextPage && !timesheetsError && !paymentSettingError,
    isLoading: isFetchingNextPage || timesheetsLoading,
    onLoadMore: () => { fetchNextPage(); },
  });

  const selectedMonthLabel = useMemo(
    () => format(month.date, "MMMM yyyy", { locale: vi }),
    [month.date]
  );
  const homeModel = useMemo(
    () =>
      createRegularEmployeeHomeModel({
        monthLabel: selectedMonthLabel,
        monthlyTotalSalary,
        monthlyTotalHours,
        totalPayable,
        totalPaid,
        workDayCount: groupedDays.length,
        totalRecords,
        hasBankInfo: hasEmployeeBankInfo(profile),
        unreadCount: unreadNotifications?.count,
      }),
    [
      groupedDays.length,
      monthlyTotalHours,
      monthlyTotalSalary,
      profile,
      selectedMonthLabel,
      totalPaid,
      totalPayable,
      totalRecords,
      unreadNotifications?.count,
    ]
  );

  const updatePasswordMutation = useUpdateEmployeePassword();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("userRole");
    toast({ title: "Sign out thành công" });
    navigate("/login");
  };

  const handleChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await updatePasswordMutation.mutateAsync({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    setPasswordSheetOpen(false);
  };

  const payrollError = timesheetsError || paymentSettingError;
  const isInitialLoading = profileLoading || paymentSettingLoading || timesheetsLoading;
  const handleRetryPayroll = () => {
    if (timesheetsFetching || paymentSettingFetching) return;
    void Promise.all([refetchTimesheets(), refetchPaymentSetting()]);
  };

  if (isInitialLoading) {
    return (
      <EmployeeMobileShell chrome="skeleton" contentClassName="max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        {[1, 2, 3].map((index) => <Skeleton key={index} className="h-32 w-full rounded-xl" />)}
      </EmployeeMobileShell>
    );
  }

  return (
    <EmployeeMobileShell
      employeeName={profile?.fullname}
      unreadCount={unreadNotifications?.count}
      onNotificationClick={() => setNotificationSheetOpen(true)}
      onChangePassword={() => setPasswordSheetOpen(true)}
      onLogout={handleLogout}
      canopy={
        <EmployeeCanopy
          employeeName={profile?.fullname}
          unreadCount={unreadNotifications?.count}
          onNotificationClick={() => setNotificationSheetOpen(true)}
          onChangePassword={() => setPasswordSheetOpen(true)}
          onLogout={handleLogout}
          wallet={payrollError ? undefined : { model: homeModel, paidAmount: totalPaid, totalAmount: monthlyTotalSalary }}
        />
      }
    >
      <div className="space-y-5">
        <EmployeeAdBanner />

        <EmployeeTimesheetPanel
          month={month}
          days={groupedDays}
          bulkTransferPercentage={bulkTransferPercentage}
          isLoading={timesheetsLoading}
          isError={payrollError}
          isRetrying={timesheetsFetching || paymentSettingFetching}
          onRetry={handleRetryPayroll}
          isFetchingNextPage={isFetchingNextPage}
          observerRef={observerRef}
        />

        <section id="employee-bank" className="scroll-mt-4">
          <EmployeeBankInfoCard profile={profile!} />
        </section>
      </div>

      <ChangePasswordSheet
        open={passwordSheetOpen}
        onOpenChange={setPasswordSheetOpen}
        onSubmit={handleChangePassword}
        isPending={updatePasswordMutation.isPending}
      />

      <NotificationSheet isOpen={notificationSheetOpen} onClose={() => setNotificationSheetOpen(false)} />
    </EmployeeMobileShell>
  );
};

export default EmployeePage;
