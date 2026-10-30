import { memo, useCallback, useMemo } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@hr/components/ui/dialog';
import { Button } from '@hr/components/ui/button';
import { ButtonGroup } from '@hr/components/ui/button-group';
import { Label } from '@hr/components/ui/label';
import { useProjects } from '@hr/hooks/api/useProjects';
import { useBulkTransferExportForm } from '@hr/hooks/timesheet/useBulkTransferExportForm';
import type { BulkTransferExportParams } from '@hr/services/api/bulk-transfer.service';
import { BulkTransferDateRangeSection } from './bulk-transfer-export/BulkTransferDateRangeSection';
import { BulkTransferFiltersSection } from './bulk-transfer-export/BulkTransferFiltersSection';
import { useIsMobile } from '@hr/hooks/useBreakpoint';

interface BulkTransferExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (params: BulkTransferExportParams) => void;
  isLoading?: boolean;
  preselectedProjectIds?: number[];
}

export const BulkTransferExportDialog = memo(function BulkTransferExportDialog({
  open,
  onOpenChange,
  onExport,
  isLoading = false,
  preselectedProjectIds,
}: BulkTransferExportDialogProps) {
  const { data: projectsResponse } = useProjects();
  const projects = useMemo(() => projectsResponse?.data || [], [projectsResponse?.data]);
  const form = useBulkTransferExportForm({
    isOpen: open,
    onOpenChange,
    projects,
    initialProjectIds: preselectedProjectIds,
  });
  const isMobile = useIsMobile();

  const handleExport = useCallback(() => {
    onExport(form.buildExportParams());
  }, [form, onExport]);

  return (
    <Dialog open={open} onOpenChange={form.handleDialogOpen}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto sm:max-w-lg shadow-none"
        title="Export bank transfer file"
        description="Select the payroll period and employees to include."
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            Export bank transfer file
          </DialogTitle>
        </DialogHeader>

        <fieldset disabled={isLoading} className="space-y-4 disabled:opacity-70">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pay schedule
            </Label>
            <ButtonGroup
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              value={form.paymentSchedule}
              onChange={form.setPaymentSchedule}
              fullWidth
            />
          </div>

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

          <BulkTransferFiltersSection
            selectedProjects={form.selectedProjects}
            selectedEmployees={form.selectedEmployees}
            projects={projects}
            onProjectChange={form.setSelectedProjects}
            onEmployeeChange={form.setSelectedEmployees}
          />
        </fieldset>

        <DialogFooter className="flex-row gap-2.5 pt-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={form.handleClose}
            disabled={isLoading}
            className="min-h-11 flex-1 basis-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!form.canExport || isLoading}
            className="min-h-11 flex-1 basis-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export file
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
