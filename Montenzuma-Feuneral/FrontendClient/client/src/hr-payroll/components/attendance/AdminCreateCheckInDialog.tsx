import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@hr/components/ui/alert";
import { Button } from "@hr/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hr/components/ui/dialog";
import { EmployeeSelector } from "@hr/components/ui/employee-selector";
import { ProjectSelector } from "@hr/components/ui/project-selector";
import { SearchableSelect } from "@hr/components/ui/searchable-select";
import { useAdminCheckInShifts, useAdminCreateCheckIn } from "@hr/hooks/api/useAdminAttendance";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Employee } from "@hr/types/api/employee.types";
import type { Project } from "@hr/types/api/project.types";

interface AdminCreateCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function vietnamBusinessDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Admin entry point for a missed check-in. The form intentionally has no
 * checkout control: selecting a shift only creates an open check-in, leaving
 * the employee's normal GPS checkout as the completion/earning authority.
 */
export function AdminCreateCheckInDialog({ open, onOpenChange }: AdminCreateCheckInDialogProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [shiftIndex, setShiftIndex] = useState<string>("");
  const date = vietnamBusinessDate();
  const createCheckIn = useAdminCreateCheckIn();
  const shiftsQuery = useAdminCheckInShifts(employee?.id ?? null, project?.id ?? null, date, { enabled: open });

  useEffect(() => {
    setShiftIndex("");
  }, [employee?.id, project?.id]);

  useEffect(() => {
    if (!open) {
      setEmployee(null);
      setProject(null);
      setShiftIndex("");
    }
  }, [open]);

  const shifts = shiftsQuery.data?.shifts ?? [];
  const canSubmit = employee !== null && project !== null && shiftIndex !== "" && !createCheckIn.isPending;
  const errorMessage = shiftsQuery.error instanceof Error ? shiftsQuery.error.message : null;

  const handleCreate = () => {
    if (!employee || !project || shiftIndex === "") return;
    createCheckIn.mutate(
      {
        employee_id: employee.id,
        project_id: project.id,
        date,
        shift_index: Number(shiftIndex),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b px-4 pb-3 pt-4 sm:px-6">
          <DialogTitle>Record an employee's clock-in</DialogTitle>
          <DialogDescription>
            You can only record a clock-in for today. The employee must still clock out at the attendance area to complete the shift and record earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Employees</p>
              <EmployeeSelector
                value={employee}
                onSelect={setEmployee}
                showAllOption={false}
                className="min-h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Projects</p>
              <ProjectSelector
                value={project}
                onSelect={setProject}
                activeOnly
                flexibleOnly
                className="min-h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="checkin-shift" className="text-sm font-medium">Today's shift</label>
              <SearchableSelect
                triggerId="checkin-shift"
                value={shiftIndex}
                onChange={setShiftIndex}
                disabled={!employee || !project || shiftsQuery.isLoading}
                placeholder={shiftsQuery.isLoading ? "Loading shifts..." : "Select a shift"}
                searchPlaceholder="Search shifts..."
                triggerClassName="min-h-11"
                options={shifts.map((shift) => ({
                  value: String(shift.index),
                  label: `${shift.label}${shift.position ? ` · ${shift.position}` : ""}`,
                }))}
              />
              {employee && project && shifts.length === 0 && !shiftsQuery.isLoading && (
                <p className="text-xs text-muted-foreground">No valid shifts are available for this assignment.</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                An administrator-recorded clock-in does not replace the employee's GPS clock-out and does not create earnings by itself.
              </AlertDescription>
            </Alert>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)} disabled={createCheckIn.isPending}>
            Cancel
          </Button>
          <Button type="button" className="min-h-11" disabled={!canSubmit} onClick={handleCreate}>
            {createCheckIn.isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Record clock-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
