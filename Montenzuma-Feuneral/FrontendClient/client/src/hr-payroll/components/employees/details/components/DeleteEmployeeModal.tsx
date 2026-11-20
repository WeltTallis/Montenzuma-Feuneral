import { useState, useEffect, useMemo } from "react";
import { Button } from "@hr/components/ui/button";
import { Badge } from "@hr/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@hr/components/ui/dialog";
import { AlertTriangle, Building, Clock, Calendar, XCircle } from "lucide-react";
import { useEmployeeTimesheetSummary } from "@hr/hooks/api/useTimesheets";
import { getEmployeeProjects } from "@hr/types/api/employee.types";
import type { Employee } from "@hr/types/api/employee.types";

interface DeleteEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteEmployeeModal({
  employee,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: DeleteEmployeeModalProps) {
  const [canDelete, setCanDelete] = useState(true);

  // Get employee's current projects
  const currentProjects = employee ? getEmployeeProjects(employee) : [];

  // Fetch employee timesheet summary to check for linked timesheets
  const { data: timesheetSummary, isLoading: timesheetLoading, error: timesheetError } = useEmployeeTimesheetSummary(
    employee?.id || 0,
    {},  // Pass empty object instead of undefined
    !!employee?.id && isOpen
  );


  // Calculate if employee has any timesheet entries
  const hasTimesheets = useMemo(() => {
    if (!timesheetSummary) {
      return false;
    }

    const totalHours = Object.values(timesheetSummary.totalHours || {}).reduce<number>((sum, hours) => sum + hours, 0);
    const result = totalHours > 0 || timesheetSummary.workingDays > 0 || timesheetSummary.pendingEntries > 0;

    return result;
  }, [timesheetSummary]);

  // Update canDelete status
  useEffect(() => {
    setCanDelete(!hasTimesheets);
  }, [hasTimesheets]);

  if (!employee) return null;

  const totalHours = timesheetSummary
    ? Object.values(timesheetSummary.totalHours || {}).reduce<number>((sum, hours) => sum + hours, 0)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-700" />
            Confirm xóa nhân viên
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa nhân viên <strong>"{employee.fullname}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">


          {/* Timesheet Loading State */}
          {timesheetLoading && (
            <div className="p-4 border border-border bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Đang kiểm tra dữ liệu chấm công...
              </div>
            </div>
          )}

          {/* Timesheet Warning Section */}
          {!timesheetLoading && hasTimesheets && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    Không thể xóa nhân viên này
                  </p>
                  <p className="text-sm text-red-700">
                    Employee này có:
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      <span><strong>{currentProjects.length}</strong> dự án đang tham gia</span>
                    </div>
                    {timesheetSummary?.workingDays !== undefined && timesheetSummary.workingDays > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span><strong>{timesheetSummary.workingDays}</strong> ngày chấm công</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    Please gỡ bỏ tất cả dữ liệu chấm công trước khi xóa nhân viên.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Warning for employees with projects but no timesheets */}
          {currentProjects.length > 0 && !hasTimesheets && (
            <div className="p-3 border border-amber-200 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Employee này đang được gán vào {currentProjects.length} dự án.
                  Hành động này sẽ gỡ bỏ nhân viên khỏi tất cả dự án và không thể hoàn thành.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel bỏ
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canDelete || isLoading || timesheetLoading}
          >
            {isLoading ? "Đang xóa..." : "Delete nhân viên"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
