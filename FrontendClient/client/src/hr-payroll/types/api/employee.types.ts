// Employee related types
import type { Bank } from "./bank.types";

export interface EmployeeProject {
  id: number;
  name: string;
  code: string;
  client_name: string;
}

export interface CurrentProject {
  project_id: number;
  project_employee_id?: number;
  name: string;
  code: string;
  client_name: string;
  position?: string;
  start_date?: string;
  last_date?: string | null;
  payment_schedule?: "weekly" | "monthly" | "flexible";
  pending_payment_schedule?: "weekly" | "monthly" | "flexible" | null;
  schedule_effective_from?: string | null;
  is_flexible?: boolean;
  check_in_enabled?: boolean;
  // Deferred check-in activation: enable is pending until day 1 of next month.
  pending_check_in_enabled?: boolean | null;
  check_in_effective_from?: string | null;
}

export interface TimesheetSummary {
  total_timesheets: number;
  total_hours_worked: number;
  pending_timesheets: number;
  approved_timesheets: number;
  rejected_timesheets: number;
  current_week_hours: number;
  last_timesheet_date: string;
}

export interface PayrollSummary {
  total_payroll_payments: number;
  total_earnings_vnd: number;
  last_payment_date: string;
  avg_weekly_earnings_vnd: number;
}

export interface Employee {
  id: number;
  username?: string;
  employee_code?: string;
  fullname: string;
  email?: string;
  cccd: string;
  address?: string;
  mobile?: string;
  position?: string;
  status?: "active" | "inactive";
  bank?: Bank | null;
  bank_account_number?: string;
  bank_account_name?: string;
  /**
   * Outcome of the last OnePay account verification.
   * - `valid`     : account confirmed good (default for pre-existing rows)
   * - `invalid`   : OnePay confirmed account bad or holder-name mismatch
   * - `unverified`: OnePay unreachable / timed out (not shown in warning list)
   */
  bank_account_status?: "valid" | "invalid" | "unverified";
  /** Kenyan human-readable reason, set only when status === "invalid". */
  bank_account_invalid_reason?: string | null;
  /** RFC3339 timestamp of the last OnePay validation. */
  bank_account_validated_at?: string | null;
  date_of_birth?: string;
  can_delete?: boolean;
  current_projects: CurrentProject[];
  timesheet_summary?: TimesheetSummary;
  payroll_summary?: PayrollSummary;
  created_by?: number;
  /** Global-pool listing only: true when the requesting partner already manages this employee */
  is_accessible?: boolean;
  /** Global-pool listing only: display name of the employee's creator */
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Add index signature for table compatibility
}

/** One existing employee matching the typed identifiers (masked). */
export interface DuplicateCheckMatch {
  id: number;
  fullname: string;
  cccd_masked?: string;
  mobile_masked?: string;
  email_masked?: string;
  current_project_names: string[];
  created_by_name: string;
  created_at: string;
  matched_on: string[];
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  data: DuplicateCheckMatch[];
}

// Employee Mobile Warning Types (compulsory-mobile nudge)
/** One in-scope member of a duplicate-mobile group. */
export interface DuplicateMobileMember {
  id: number;
  fullname: string;
}

/** One phone number carried by more than one employee. */
export interface DuplicateMobileGroup {
  mobile: string;
  /** In-scope members of the group — the ones the caller can act on. */
  employees: DuplicateMobileMember[];
  /** Members of the group outside the caller's scope. Never invent names for them. */
  hidden_count: number;
}

export interface DuplicateMobilesData {
  groups: DuplicateMobileGroup[];
  /** Total distinct employees across groups. */
  total_employees: number;
}

export interface EmployeeSummary {
  total_employees: number;
  total_working_employees: number;
  employees_hired_this_month: number;
  // Month-to-date totals from /employees/summary
  salary_month_to_date: number;
  paid_month_to_date: number;
}

export interface CreateEmployeeData {
  fullname: string;
  email?: string;
  cccd: string;
  address?: string;
  mobile?: string;
  bank_id?: number;
  bank_account_number?: string;
  bank_account_name?: string;
  date_of_birth?: string;
}

export type UpdateEmployeeData = Partial<CreateEmployeeData>;

export interface EmployeeFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: "working" | "unassigned";
  search?: string;
  projectId?: number;
  projectIds?: string;
  include_inactive?: boolean;
  month?: string;
  fromDate?: string;
  toDate?: string;
  paymentSchedule?: "weekly" | "monthly" | "flexible";
  /** Partner-only: "global" lists ALL employees (global pool); default = accessible only */
  scope?: "global";
}

export interface EmployeesResponse {
  status: "success";
  data: Employee[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  message: string;
}

// Employee Payroll History Types
export interface EmployeePayrollRecord {
  id: number;
  timesheet_id: number;
  payroll_id: number | null;
  batch_code: string | null;
  project_id: number;
  project_name: string;
  date: string;
  hours_worked: number;
  paytype: string;
  payrate: number;
  amount: number;
  payment_status: "pending" | "paid" | "failed" | "cancelled";
  payment_reference: string | null;
  payment_date: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface EmployeePayrollFilters {
  page?: number;
  pageSize?: number;
  sort_by?: "created_at" | "date" | "amount" | "payment_status" | "pay_date";
  sort_order?: "asc" | "desc";
  status?: "pending" | "paid" | "failed" | "cancelled";
  project_id?: number;
  fromDate?: string;
  toDate?: string;
  [key: string]: unknown;
}

export interface EmployeePayrollResponse {
  status: "success";
  data: EmployeePayrollRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  message: string;
}

// Additional types based on API documentation

export interface EmployeeSummaryResponse {
  status: "success";
  data: EmployeeSummaryData;
  message: string;
}

export interface EmployeeSummaryData {
  total_payroll_payments: number;
  total_earnings_vnd: number;
  last_payment_date?: string;
  avg_weekly_earnings_vnd: number;
}

export interface EmployeeTimesheetEntry {
  id: number;
  project_id: number;
  employee_id: number;
  date: string;
  hours_worked: number;
  paytype: string;
  hour_type: string;
  day_type: string;
  payrate_id: number;
  payrate: number;
  amount: number;
  status: "pending_approval" | "approved" | "rejected";
  payment_status: "pending" | "paid" | "failed" | "cancelled";
  force_payroll: boolean;
  paid_amount: number;
  paid_at: string | null;
  last_updated_by: number;
  last_approved_by: number;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  projectName: string;
  employeeName: string;
  employeeCode: string;
  submittedBy: number;
  submittedByName: string;
  submittedAt: string;
}

export interface EmployeeTimesheetFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  project_id?: number;
  status?:
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "pending"
    | "paid"
    | "failed"
    | "cancelled";
  fromDate?: string;
  toDate?: string;
  [key: string]: unknown;
}

export interface EmployeeTimesheetResponse {
  status: "success";
  data: EmployeeTimesheetEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  message: string;
}

export interface EmployeeExportResponse {
  // Binary XLSX file response
  data: Blob;
}

export interface EmployeeListFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  projectId?: number;
  status?: "working" | "unassigned";
  fromDate?: string;
  toDate?: string;
  include_inactive?: boolean;
}

// Employee Project Assignment Types
export interface EmployeeProjectAssignment {
  assignment_id: number;
  project_id: number;
  project_name: string;
  project_code: string;
  factory_employee_code: string;
  start_date: string;
  end_date?: string;
  status: "active" | "ended" | "inactive";
  total_hours_worked: number;
  total_earned_vnd: number;
}

export interface EmployeeProjectsResponse {
  data: EmployeeProjectAssignment[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

// Employee Individual Summary Types
export interface EmployeeIndividualSummary {
  total_payroll_payments: number;
  total_earnings_vnd: number;
  last_payment_date?: string;
  avg_weekly_earnings_vnd: number;
}

// Utility functions for employee projects
export const getEmployeeProjectCount = (employee: Employee): number => {
  return employee.current_projects?.length || 0;
};

export const getEmployeeProjects = (employee: Employee): CurrentProject[] => {
  return employee.current_projects || [];
};

export const isEmployeeAssignedToProject = (
  employee: Employee,
  projectId: number,
): boolean => {
  return (
    employee.current_projects?.some(
      (project) => project.project_id === projectId,
    ) || false
  );
};

export const hasCompleteBankDetails = (employee: Employee): boolean => {
  return !!(
    employee.bank &&
    employee.bank_account_number &&
    employee.bank_account_name
  );
};

// Employee Current Projects with Timesheets Types
export interface CurrentProjectTimesheet {
  id: number;
  date: string;
  hours_worked: number;
  paytype: string;
  hour_type: string;
  day_type: string;
  payrate: number;
  amount: number;
  status: "pending_approval" | "approved" | "rejected";
  payment_status?: "pending" | "paid" | "failed" | "cancelled";
  paid_amount?: number;
  paid_at?: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface CurrentProjectWithTimesheets {
  project_id: number;
  project_name: string;
  project_code: string;
  client_name: string;
  position: string;
  start_date: string;
  last_date: string | null;
  timesheets: CurrentProjectTimesheet[];
}

export interface EmployeeCurrentProjectsFilters {
  fromDate?: string;
  toDate?: string;
  [key: string]: unknown;
}

export interface EmployeeCurrentProjectsResponse {
  data: CurrentProjectWithTimesheets[];
}

// Employee User Access Types
export interface EmployeeUser {
  id: number;
  user_id: number;
  user_fullname: string;
  user_email: string;
  granted_by: number;
  granted_at: string;
}

export interface EmployeeUsersResponse {
  status: "success";
  data: EmployeeUser[];
  message: string;
}

export interface GrantEmployeeAccessData {
  user_id: number;
}

export interface GrantEmployeeAccessResponse {
  status: "success";
  message: string;
}

export interface RevokeEmployeeAccessResponse {
  status: "success";
  message: string;
}

// Employee Password Change Types
export interface ChangeEmployeePasswordRequest {
  new_password: string;
}

export interface ChangeEmployeePasswordResponse {
  status: "success";
  message: string;
}

// Payment Schedule Management Types
export interface ChangePaymentScheduleRequest {
  new_schedule: "weekly" | "monthly";
}

export interface ChangePaymentScheduleResponse {
  status: "success";
  data: {
    id: number;
    project_id: number;
    employee_id: number;
    payment_schedule: "weekly" | "monthly";
    pending_payment_schedule: "weekly" | "monthly" | null;
    schedule_effective_from: string | null;
    message: string;
  } | null;
  message: string;
}

export interface CancelScheduleChangeResponse {
  status: "success";
  data: {
    id: number;
    project_id: number;
    employee_id: number;
    payment_schedule: "weekly" | "monthly";
    pending_payment_schedule: null;
    schedule_effective_from: null;
  };
  message: string;
}

export interface PendingScheduleChange {
  id: number;
  project_id: number;
  project_name: string;
  employee_id: number;
  employee_name: string;
  current_schedule: "weekly" | "monthly";
  pending_schedule: "weekly" | "monthly";
  effective_from: string;
}

export interface PendingScheduleChangesResponse {
  status: "success";
  data: PendingScheduleChange[];
  message: string;
}

// Employee Import Types
export interface EmployeeImportStatus {
  import_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  errors: Array<{ row_number: number; cccd?: string; message: string }>;
  percentage: number;
  started_at: string;
  completed_at?: string;
}

export interface EmployeeImportResponse {
  import_id: string;
  status: string;
  message: string;
}

// Mobile backfill import — fills blank employee mobile numbers from the
// "NV chưa có SĐT" export with the Mobile column filled in. Rows are matched
// by CCCD; existing mobile numbers are never overwritten.
export interface MobileBackfillRowError {
  row_number: number;
  cccd?: string;
  message: string;
}

export interface MobileBackfillResult {
  total_rows: number;
  updated: number;
  skipped_existing: number;
  not_found: number;
  error_count: number;
  errors: MobileBackfillRowError[];
}

export const EMPLOYEE_LABELS = {
  statuses: {
    active: "Active",
    inactive: "Inactive",
    pending_approval: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Awaiting payment",
    paid: "Paid",
    failed: "Failed",
    cancelled: "Cancelled",
    working: "Active",
    unassigned: "Unassigned",
  },
  actions: {
    create: "Create",
    update: "Update",
    delete: "Delete",
    approve: "Approve",
    reject: "Reject",
    export: "Export to Excel",
    change_password: "Change password",
    assign_project: "Assign project",
    grant_access: "Grant access",
    revoke_access: "Revoke access",
    change_schedule: "Change pay schedule",
    cancel_schedule_change: "Cancel schedule change",
  },
  fields: {
    fullname: "Full name",
    email: "Email",
    cccd: "National ID",
    address: "Address",
    mobile: "Phone number",
    bank: "Bank",
    bank_account_number: "Account number",
    bank_account_name: "Account name",
    date_of_birth: "Date of birth",
    position: "Position",
    status: "Status",
    current_projects: "Current projects",
    created_at: "Created on",
    updated_at: "Last updated",
    project_name: "Project name",
    project_code: "Project code",
    client_name: "Client name",
    start_date: "Start date",
    last_date: "End date",
    hours_worked: "Hours worked",
    paytype: "Pay type",
    payrate: "Pay rate",
    amount: "Amount",
    date: "Date",
    hour_type: "Shift type",
    day_type: "Day type",
    payroll_id: "Payroll ID",
    timesheet_id: "Timesheet ID",
    batch_code: "Payment batch",
    payment_status: "Payment status",
    payment_date: "Payment date",
    payment_reference: "Payment reference",
    period_start: "Period start",
    period_end: "Period end",
    approved_at: "Approval date",
    rejection_reason: "Rejection reason",
    paid_amount: "Amount paid",
    paid_at: "Payment date",
    submitted_at: "Submission date",
    employee_code: "Employee code",
    user_fullname: "User name",
    user_email: "User email",
    granted_by: "Granted by",
    granted_at: "Granted on",
    schedule: "Payment schedule",
    current_schedule: "Current schedule",
    pending_schedule: "Pending schedule",
    effective_from: "Effective from",
    factory_employee_code: "Factory employee code",
  },
  schedule: {
    weekly: "Weekly pay",
    monthly: "Monthly pay",
    flexible: "Flexible",
  },
  messages: {
    employee_created: "Employee created successfully",
    employee_updated: "Employee updated successfully",
    employee_deleted: "Employee deleted successfully",
    password_changed: "Password changed successfully",
    access_granted: "Access granted successfully",
    access_revoked: "Access revoked successfully",
    schedule_change_requested: "Payment schedule change requested successfully",
    schedule_change_cancelled: "Payment schedule change cancelled successfully",
    export_success: "Data exported successfully",
    import_success: "Data imported successfully",
  },
} as const;
