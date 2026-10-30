import { memo, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogNavyHeader } from '@hr/components/ui/dialog';
import { Button } from '@hr/components/ui/button';
import { useIsMobile } from '@hr/hooks/useBreakpoint';
import { useProjects } from '@hr/hooks/api/useProjects';
import { useExportBulkTransfer } from '@hr/hooks/api/usePayrolls';
import { useBulkTransferExportForm } from '@hr/hooks/timesheet/useBulkTransferExportForm';
import type { Project } from '@hr/types/api/project.types';
import { recordPendingExport } from '@hr/utils/timesheet/pendingExports';
import { BulkTransferDateRangeSection } from '../bulk-transfer-export/BulkTransferDateRangeSection';
import { BulkTransferFiltersSection } from '../bulk-transfer-export/BulkTransferFiltersSection';
import { Loader2, Download } from 'lucide-react';

interface ChuyenLoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedEmployeeIds?: number[];
  estimatedTotal?: number | null;
}

export const ChuyenLoDialog = memo(function ChuyenLoDialog({
  open,
  onOpenChange,
  preselectedEmployeeIds,
  estimatedTotal,
}: ChuyenLoDialogProps) {
  const { data: projectsResponse } = useProjects();
  const projects = useMemo(() => projectsResponse?.data || [], [projectsResponse?.data]);
  const form = useBulkTransferExportForm({ isOpen: open, onOpenChange, projects });
  const exportMutation = useExportBulkTransfer();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open && preselectedEmployeeIds?.length) {
      form.setSelectedEmployees(preselectedEmployeeIds);
    }
  }, [open, preselectedEmployeeIds, form.setSelectedEmployees]);

  const handleExport = useCallback(async () => {
    const params = form.buildExportParams();
    try {
      await exportMutation.mutateAsync(params);
      recordPendingExport({
        fromDate: params.fromDate,
        toDate: params.toDate,
        forMonth: params.for_month,
        employeeIdsCount: params.employee_ids?.length,
        projectIdsCount: params.project_ids?.length,
      });
      onOpenChange(false);
    } catch {
      // The export mutation reports errors to the user.
    }
  }, [form, exportMutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={form.handleDialogOpen}>
      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden" contentPadding="none">
        <DialogNavyHeader
          title="Prepare bank transfer file"
          description={preselectedEmployeeIds?.length
            ? `${preselectedEmployeeIds.length} employees selected${estimatedTotal != null ? ` · Total: ${estimatedTotal.toLocaleString('en-KE')}` : ''}`
            : 'Export approved payroll rows for payment through your bank.'}
        />
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Upload the exported file through your bank, then import the bank results to reconcile payments.
          </p>
          <div className="space-y-2">
            <BulkTransferDateRangeSection
              paymentSchedule={form.paymentSchedule}
              fromDate={form.fromDate}
              toDate={form.toDate}
              weekPeriods={form.weekPeriods}
              monthPeriods={form.monthPeriods}
              customDateRanges={form.customDateRanges}
              selectedCustomRange={form.selectedCustomRange}
              hasDateError={form.hasDateError}
              isMobile={isMobile}
              onFromDateChange={form.setFromDate}
              onToDateChange={form.setToDate}
              onWeekPeriodApply={form.applyWeekPeriod}
              onMonthPeriodApply={form.applyMonthPeriod}
              onCustomRangeApply={form.applyCustomRange}
            />
          </div>
          <BulkTransferFiltersSection
            selectedProjects={form.selectedProjects}
            selectedEmployees={form.selectedEmployees}
            projects={projects as Project[]}
            onProjectChange={form.setSelectedProjects}
            onEmployeeChange={form.setSelectedEmployees}
          />
        </div>
        <DialogFooter className="gap-2 px-5 py-3">
          <Button variant="outline" onClick={form.handleClose} disabled={exportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!form.canExport || exportMutation.isPending}>
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exportMutation.isPending ? 'Preparing file…' : 'Export bank file'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
