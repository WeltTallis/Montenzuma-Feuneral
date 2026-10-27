import { Button } from "@hr/components/ui/button";
import { memo } from "react";
import { authManager } from "@hr/lib/auth";
import { Save, X, Trash2, KeyRound } from "lucide-react";
import { cn } from "@hr/lib/utils";
import type { EmployeeActionsProps } from "../types";

/**
 * Footer action bar for EmployeeDetailsSheet.
 *
 * Tailkit-inspired (a-c-form-actions-02/03) button styling translated to
 * project semantic tokens. All buttons meet the 44px mobile tap-target
 * standard (min-h-11). Layout adapts to viewport:
 *   - Mobile (<sm): full-width stacked or grid-cols-2
 *   - Tablet/desktop (>=sm): space-between with grouped actions
 *
 * Two modes:
 *   - View: destructive "Delete" (admin-only) + neutral "Đổi mật khẩu"
 *     (admin/partner) on the left, primary "Close" on the right.
 *   - Edit: full-width row with ghost "Cancel" (left) and primary
 *     "Save thay đổi" (right).
 */
export const EmployeeActions = memo(({
  onSave,
  onCancel,
  onDelete,
  onResetPassword,
  onClose,
  isDirty,
}: EmployeeActionsProps) => {
  const userRole = authManager.getUserRole();
  const canResetPassword = userRole === 'admin' || userRole === 'partner';
  // Employee deletion is admin-only — partners never see the "Delete" button.
  const canDelete = userRole === 'admin';

  // ─── Editing mode — save/cancel ──────────────────────────────────────────
  if (onSave && onCancel) {
    return (
      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="min-h-11 w-full border border-border bg-card"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!isDirty}
          className="min-h-11 w-full"
        >
          <Save className="h-4 w-4" />
          Save thay đổi
        </Button>
      </div>
    );
  }

  // ─── View mode — delete/reset/close ──────────────────────────────────────
  // All actions share one row of equal cells. Icon sits above the label (the
  // same pattern the mobile wallet action row uses) so a long Vietnamese label
  // like "Đổi mật khẩu" still fits a third of a 320px sheet without truncation.
  const actions = [
    canDelete && onDelete
      ? {
          key: "delete",
          label: "Delete",
          icon: Trash2,
          onClick: onDelete,
          className: cn(
            "border border-destructive/30 bg-destructive/10 text-red-700 dark:text-red-300",
            "hover:bg-destructive/20 hover:text-red-800 dark:hover:text-red-200",
          ),
        }
      : null,
    canResetPassword && onResetPassword
      ? {
          key: "reset",
          label: "Đổi mật khẩu",
          icon: KeyRound,
          onClick: onResetPassword,
          className: "border border-border bg-card text-foreground hover:bg-muted",
        }
      : null,
    onClose
      ? {
          key: "close",
          label: "Close",
          icon: X,
          onClick: onClose,
          className: "",
        }
      : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  if (actions.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))`,
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            type="button"
            variant={action.key === "close" ? "default" : "ghost"}
            onClick={action.onClick}
            className={cn(
              "h-auto min-h-11 flex-col gap-1 px-2 py-2 text-xs",
              action.className,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
});

EmployeeActions.displayName = "EmployeeActions";
