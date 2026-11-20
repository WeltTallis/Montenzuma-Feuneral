import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@hr/components/ui/dialog";
import { Button } from "@hr/components/ui/button";
import { Textarea } from "@hr/components/ui/textarea";
import { Label } from "@hr/components/ui/label";
import { ConfirmDialog } from "@hr/components/ui/confirm-dialog";
import { formatCurrency } from "@hr/utils/formatters";
import type { AdminAttendanceResponse } from "@hr/types/api/attendance.types";

export type ReviewMode = "approve" | "reject" | "credit" | null;

export interface AttendanceReviewDialogsProps {
  mode: ReviewMode;
  row: AdminAttendanceResponse | null;
  onClose: () => void;
  onApprove: (row: AdminAttendanceResponse, note: string) => void;
  onReject: (row: AdminAttendanceResponse, note: string) => void;
  onCreditQuota: (row: AdminAttendanceResponse) => void;
  approveLoading?: boolean;
  rejectLoading?: boolean;
  creditLoading?: boolean;
}

/**
 * Renders the approve, reject, and credit-quota flows for an attendance row.
 *  - Approve uses ConfirmDialog (note optional; backend recomputes earning).
 *  - Reject uses a Dialog with a required reason Textarea.
 *  - Credit uses ConfirmDialog (no note; banks the completed shift's earning
 *    into the advance quota immediately, skipping the post-checkout hold).
 * Which dialog is open is controlled by `mode` (null = all closed).
 */
export function AttendanceReviewDialogs({
  mode,
  row,
  onClose,
  onApprove,
  onReject,
  onCreditQuota,
  approveLoading = false,
  rejectLoading = false,
  creditLoading = false,
}: AttendanceReviewDialogsProps) {
  const [rejectNote, setRejectNote] = useState("");
  const [approveNote, setApproveNote] = useState("");

  // Reset the reason inputs whenever a new row/mode opens so stale notes don't
  // carry over between successive reviews.
  useEffect(() => {
    if (mode !== null) {
      setRejectNote("");
      setApproveNote("");
    }
  }, [mode, row?.id]);

  const employeeLabel = row ? `${row.employee_name} · ${row.project_name || ""}`.trim() : "";
  const currentEarning = row?.earning_amount ?? 0;

  return (
    <>
      <ConfirmDialog
        open={mode === "approve" && row !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title="Approve this attendance record?"
        description={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pay will be recalculated using the configured shift. Any earlier automatic rejection reason will be cleared.
            </p>
            {employeeLabel && (
              <p className="text-xs font-medium text-foreground">{employeeLabel}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Current earnings: <span className="font-semibold text-foreground">{formatCurrency(currentEarning)}</span>
            </p>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="approve-note" className="text-xs text-muted-foreground">
                Approval note (optional)
              </Label>
              <Textarea
                id="approve-note"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="For example: The client confirmed the full shift."
                className="min-h-[88px] text-sm"
              />
            </div>
          </div>
        }
        confirmText="Approve"
        confirmVariant="default"
        loading={approveLoading}
        onConfirm={() => {
          if (!row) return;
          onApprove(row, approveNote.trim());
        }}
      />

      <ConfirmDialog
        open={mode === "credit" && row !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title="Credit the advance balance now?"
        description={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This shift's earnings will be added to the employee's salary-advance balance now, without waiting for the post-shift holding period.
            </p>
            {employeeLabel && (
              <p className="text-xs font-medium text-foreground">{employeeLabel}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Earnings: <span className="font-semibold text-foreground">{formatCurrency(currentEarning)}</span>
            </p>
          </div>
        }
        confirmText="Credit now"
        confirmVariant="default"
        loading={creditLoading}
        onConfirm={() => {
          if (!row) return;
          onCreditQuota(row);
        }}
      />

      <Dialog
        open={mode === "reject" && row !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reject attendance</DialogTitle>
            <DialogDescription>
              Earnings will be cancelled (0 ₫), and the reason will be recorded. You can reverse this later by approving the record.
            </DialogDescription>
          </DialogHeader>
          {employeeLabel && (
            <p className="text-xs font-medium text-foreground -mt-1">{employeeLabel}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reject-note" className="text-sm">
              Rejection reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-note"
              autoFocus
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="For example: The employee left the project early."
              className="min-h-[112px]"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be saved with the record's pay rejection notes.
            </p>
          </div>
          <DialogFooter className="grid grid-cols-1 gap-2 sm:flex sm:gap-2">
            <Button className="min-h-11" variant="outline" onClick={onClose} disabled={rejectLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-11"
              disabled={rejectNote.trim().length === 0 || rejectLoading}
              onClick={() => {
                if (!row) return;
                onReject(row, rejectNote.trim());
              }}
            >
              {rejectLoading ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
