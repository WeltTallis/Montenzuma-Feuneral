import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
// PageHeader's icon slot is widened to ComponentType<SVGProps> (W13a
// follow-up), so the UU icon fits; page-owned icons are UU as well.
import { AlertCircle, RefreshCw05, Settings01 } from '@untitledui/icons';
import {
  AdminPageCanvas,
  AdminPageHeaderCard,
} from '@hr/components/shared/AdminPageFrame';
import { PageHeader } from '@hr/components/shared/PageHeader';
import { Skeleton } from '@hr/components/ui/skeleton';
import { Button } from '@hr/components/ui/button';
import { Separator } from '@hr/components/ui/separator';
import { Tabs, TabsContent } from '@hr/components/ui/tabs';
import { SettingsGeneralPanel } from '@hr/components/settings/SettingsGeneralPanel';
import { SettingsEmployeePanel } from '@hr/components/settings/SettingsEmployeePanel';
import {
  SETTINGS_TABS,
  SettingsTabList,
  VALID_SETTINGS_TABS,
} from '@hr/components/settings/SettingsTabList';
import { useSettingsForm } from '@hr/hooks/settings/useSettingsForm';
import { FeeScheduleSection } from '@hr/components/admin/AdvancePaymentFeeSchedule/FeeScheduleSection';
import { WeeklyPaymentFeeScheduleSection } from '@hr/components/admin/WeeklyPaymentFeeSchedule/WeeklyPaymentFeeScheduleSection';
import { AdminEmailComposer } from '@hr/components/email/AdminEmailComposer';
import { SendNotificationComposer } from '@hr/components/settings/SendNotificationComposer';
import { AdBannerSection } from '@hr/components/settings/AdBannerSection';

const SettingsPage = () => {
  const form = useSettingsForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab && VALID_SETTINGS_TABS.has(requestedTab)
      ? requestedTab
      : SETTINGS_TABS.general;

  const handleTabChange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === SETTINGS_TABS.general) {
        next.delete('tab');
      } else {
        next.set('tab', value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const headerSkeleton = useMemo(
    () => (
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
    ),
    [],
  );

  if (form.isLoading) {
    return (
      <AdminPageCanvas contentClassName="max-w-[1180px] space-y-6">
        <AdminPageHeaderCard>{headerSkeleton}</AdminPageHeaderCard>
        <Skeleton className="h-9 w-72" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-72 w-full" />
        </div>
      </AdminPageCanvas>
    );
  }

  if (form.loadError) {
    return (
      <AdminPageCanvas contentClassName="max-w-[1180px] space-y-6">
        <AdminPageHeaderCard>
          <PageHeader
            icon={Settings01}
            title="System settings"
            description="Manage system settings"
          />
        </AdminPageHeaderCard>
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-xl border border-utility-error-300 bg-utility-error-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-utility-error-700" />
            <p className="text-sm text-fg-error-primary">{form.loadError}</p>
          </div>
          <Button type="button" variant="outline" onClick={form.retryLoading} className="h-11 gap-2">
            <RefreshCw05 aria-hidden="true" className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </AdminPageCanvas>
    );
  }

  return (
    <AdminPageCanvas contentClassName="max-w-[1180px] space-y-5">
      <AdminPageHeaderCard>
        <PageHeader
          icon={Settings01}
          title="System settings"
          description="Manage system settings"
        />
      </AdminPageHeaderCard>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <SettingsTabList />

        <TabsContent value={SETTINGS_TABS.general} className="mt-0">
          <SettingsGeneralPanel form={form} />
        </TabsContent>

        <TabsContent value={SETTINGS_TABS.employees} className="mt-0">
          <SettingsEmployeePanel />
        </TabsContent>

        <TabsContent value={SETTINGS_TABS.feeConfig} className="mt-0 space-y-8">
          <FeeScheduleSection />
          <Separator />
          <WeeklyPaymentFeeScheduleSection />
        </TabsContent>

        <TabsContent value={SETTINGS_TABS.email} className="mt-0">
          <AdminEmailComposer embedded />
        </TabsContent>

        <TabsContent value={SETTINGS_TABS.notifications} className="mt-0">
          <SendNotificationComposer />
        </TabsContent>

        <TabsContent value={SETTINGS_TABS.ads} className="mt-0">
          <AdBannerSection />
        </TabsContent>
      </Tabs>
    </AdminPageCanvas>
  );
};

export default SettingsPage;
