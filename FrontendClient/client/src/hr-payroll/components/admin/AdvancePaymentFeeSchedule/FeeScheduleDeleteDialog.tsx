import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@hr/components/ui/alert-dialog";
import { Input } from "@hr/components/ui/input";
import { Label } from "@hr/components/ui/label";
import { formatKenyanDate } from "./rule-formatters";
import type { FeeScheduleEntry } from "@hr/types/api/advance-payment-fee-schedule.types";

interface Props {
  entry: FeeScheduleEntry | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Type-to-confirm delete: user must type the schedule's effective date
// (DD/MM/YYYY) verbatim to enable the destructive action.
export const FeeScheduleDeleteDialog = ({
  entry,
  isDeleting,
  onCancel,
  onConfirm,
}: Props) => {
  const [typed, setTyped] = useState("");
  const expected = entry ? formatKenyanDate(entry.effectiveDate) : "";
  const matches = typed.trim() === expected;

  useEffect(() => {
    if (entry) setTyped("");
  }, [entry]);

  return (
    <AlertDialog open={!!entry} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <AlertDialogTitle>Delete fee configuration?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Configuration effective from date{" "}
            <strong className="font-semibold text-foreground">
              {expected}
            </strong>{" "}
            will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 px-6 mt-4 pb-2">
          <Label htmlFor="delete-confirm-input" className="text-xs">
            Enter <strong className="font-semibold">{expected}</strong> to confirm
            deletion
          </Label>
          <Input
            id="delete-confirm-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expected}
            autoComplete="off"
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={!matches || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete configuration"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
