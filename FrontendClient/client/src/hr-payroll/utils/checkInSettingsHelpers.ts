import type {
  CheckInConfigurationEmployee,
  CheckInConfigurationResponse,
  CheckInConfigurationStatus,
} from "@hr/types/api/project-employee.types";
import { formatDateTime } from "@hr/utils/formatters";

export const DEFAULT_CHECK_IN_PAGE_SIZE = 20;

export function getCurrentCheckInMonthValue(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function flattenCheckInConfigurationEmployees(
  pages?: CheckInConfigurationResponse[],
): CheckInConfigurationEmployee[] {
  const employees = new Map<number, CheckInConfigurationEmployee>();
  for (const page of pages ?? []) {
    for (const employee of page.employees) {
      employees.set(employee.assignment_id, employee);
    }
  }
  return Array.from(employees.values());
}

export type CheckInEmployeeState =
  | "pending"
  | "disabled"
  | "used"
  | "unused";

export interface CheckInStatusFilter {
  value: CheckInConfigurationStatus;
  label: string;
  count?: number;
}

export function formatCheckInMonth(month?: string): string {
  if (!month) return "Current month";
  const [year, monthNumber] = month.split("-");
  return `Month ${monthNumber}/${year}`;
}

export function formatLastCheckIn(value?: string | null): string {
  if (!value) return "Not available";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}+07:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDateTime(parsed);
}

export function getCheckInEmployeeState(
  employee: CheckInConfigurationEmployee,
): CheckInEmployeeState {
  if (employee.pending_check_in_enable) return "pending";
  if (!employee.check_in_enabled) return "disabled";
  if (employee.attendance_count > 0) return "used";
  return "unused";
}

export function buildCheckInStatusFilters(summary?: {
  enabled: number;
  active: number;
  inactive: number;
  pending: number;
}): CheckInStatusFilter[] {
  return [
    { value: "all", label: "All" },
    { value: "enabled", label: "Enabled", count: summary?.enabled },
    { value: "active", label: "Checked in", count: summary?.active },
    { value: "inactive", label: "Not checked in", count: summary?.inactive },
    { value: "pending", label: "Pending activation", count: summary?.pending },
  ];
}
