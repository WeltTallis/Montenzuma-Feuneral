import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@hr/components/ui/sheet";
import { Button } from "@hr/components/ui/button";
import { Input } from "@hr/components/ui/input";
import { Label } from "@hr/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@hr/components/ui/radio-group";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { useIsMobile } from '@hr/hooks/useBreakpoint';
import type { Employee } from "@hr/types/api/employee.types";
import type { ModalConfig } from '@hr/types/modal-config.types';

export const modalConfig: ModalConfig = {
  id: 'remove-employee',
  name: 'Remove Employee',
  description: 'Remove employee from project',
  category: 'project',
  permissions: {
    action: 'delete',
    subject: 'Project',
    roles: ['admin', 'partner'],
  },
  deeplink: {
    enabled: false,
  },
  requiresAuth: true,
  encryptData: false,
};

interface RemoveEmployeeSheetProps {
  employee: Employee | null;
  projectId?: number | null; // Specific project to remove employee from
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (employeeId: number, projectId: number, lastDate?: string, responseMessage?: string) => void;
  isLoading?: boolean;
  responseMessage?: string;
}

export function RemoveEmployeeSheet({
  employee,
  projectId,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  responseMessage,
}: RemoveEmployeeSheetProps) {
  const [removalType, setRemovalType] = useState<"immediate" | "scheduled">("immediate");
  const [lastDate, setLastDate] = useState("");
  const isMobile = useIsMobile();

  const handleConfirm = () => {
    if (!employee?.id || !projectId) return;

    const finalLastDate = removalType === "scheduled" ? lastDate : undefined;
    onConfirm(employee.id, projectId, finalLastDate);
  };

  const handleClose = () => {
    setRemovalType("immediate");
    setLastDate("");
    onClose();
  };

  // Find the specific project to remove
  const projectToRemove = employee?.current_projects?.find(project => project.project_id === projectId);

  if (!employee || !projectToRemove) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`${isMobile ? "w-full h-full" : "w-full md:w-[70%] lg:w-[500px]"} flex flex-col`}
      >
        <SheetHeader className="flex-shrink-0" style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            Delete nhân viên khỏi dự án
          </SheetTitle>
          <SheetDescription>
            Bạn có chắc chắn muốn xóa{" "}
            <span className="font-semibold">{employee.fullname}</span>{" "}
            khỏi dự án{" "}
            <span className="font-semibold">
              {projectToRemove.name} ({projectToRemove.code})
            </span>
            ?
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            <RadioGroup value={removalType} onValueChange={(value: "immediate" | "scheduled") => setRemovalType(value)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-xl">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="flex-1">
                    <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="w-4 h-4 text-red-700" />
                      <div>
                        <div className="font-medium">Delete ngay lập tức</div>
                        <div className="typography-body-medium text-muted-foreground">
                          Employee sẽ được xóa khỏi dự án ngay lập tức
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 border rounded-xl">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      <div>
                        <div className="font-medium">Delete vào ngày cụ thể</div>
                        <div className="typography-body-medium text-muted-foreground">
                          Đặt ngày cuối cùng làm việc trong dự án
                        </div>
                      </div>
                    </Label>

                    {removalType === "scheduled" && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="lastDate" className="typography-body-medium">
                          Date cuối cùng
                        </Label>
                        <Input
                          id="lastDate"
                          type="date"
                          value={lastDate}
                          onChange={(e) => setLastDate(e.target.value)}
                          min={today}
                          className="w-full"
                        />
                        <p className="typography-body-small text-muted-foreground">
                          Employee sẽ tiếp tục làm việc cho đến ngày này
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>

            {responseMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
                  <div className="typography-body-medium text-green-800">
                    <div className="font-medium mb-1">Phản hồi từ hệ thống:</div>
                    <p className="typography-body-small">{responseMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="typography-body-medium text-amber-800">
                  <div className="font-medium mb-1">Save ý:</div>
                  <ul className="space-y-1 typography-body-small">
                    <li>• Hành động này không thể hoàn thành</li>
                    <li>• Dữ liệu chấm công hiện tại sẽ được giữ lại</li>
                    <li>• Employee có thể được phân công lại sau này</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-shrink-0 pt-4 flex gap-2" style={{ paddingBottom: "max(16px, calc(16px + env(safe-area-inset-bottom)))" }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-3 sm:h-8 rounded border border-border bg-card text-foreground text-sm font-medium whitespace-nowrap hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (removalType === "scheduled" && !lastDate)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-3 sm:h-8 rounded bg-destructive text-destructive-foreground text-sm font-medium whitespace-nowrap hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? "Processing..." : "Confirm xóa"}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
