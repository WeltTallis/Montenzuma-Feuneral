// Import types from payrate structure
import type { DayType } from '@hr/types/api/payrate.types';

export interface TimesheetItem {
  id: number;
  employee_id: number;
  project_id: number;
  date: string;
  hours_worked: number;

  // New 3-level payrate fields
  position: string; // Positi
  day_type: DayType; // Auto-calculated 
  hour_type: string; // User input: "ca 
  payrate: number; // VND per hour - 
  amount: number; // calculated by 

  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;

  employee?: {
    id: number;
    fullname: string;
    employee_code?: string;
  };
  project?: {
    id: number;
    name: string;
    code?: string;
  };

  // Derived fields for UI
  employeeName?: string;

  // Additional calculated fields for display
  workDays?: number;
  actualDays?: number;
  overtime?: number;
  totalHours?: number;
  late?: number;
  absent?: number;
}

export interface TimesheetFormData {
  employee_id: number;
  project_id: number;
  date: string;
  hours_worked: number;

  // New 3-level fields
  position: string; // Required - 
  hour_type: string; // Required - hour 
  notes?: string;
}

export interface TimesheetStats {
  totalActualDays: number;
  totalOvertime: number;
  pendingApproval: number;
  efficiency: number;
  totalEmployees: number;
}

// Additional types for timesheet entry validation
export interface TimesheetValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  calculatedRate?: number; // Preview rate from backend
  calculatedAmount?: number; // Preview amount
  calculatedDayType?: DayType; // What day type will be used
}

// For position and hour type selection in forms
export interface TimesheetFormOptions {
  positions: string[]; // Available positions from current payrate config
  hourTypes: string[]; // Available hour types from current payrate config
  dayTypePreview?: DayType; // Preview of day type for selected date
  ratePreview?: number; // Preview of rate for selected position/day_type/hour_type
}


// Utility functions
export function getDisplayPosition(item: TimesheetItem): string {
  return item.position || 'Not specified';
}

export function getDisplayHourType(item: TimesheetItem): string {
  return item.hour_type || 'Not specified';
}

export function getDisplayDayType(item: TimesheetItem): string {
  const dayTypeLabels = {
    weekday: 'Weekday',
    weekend: 'Rest day',
    holiday: 'Public holiday',
    'ngày thường': 'Weekday',
    'ngày nghỉ': 'Rest day',
    'ngày lễ': 'Public holiday',
  };
  return dayTypeLabels[item.day_type] || item.day_type;
}


// Validation for timesheet form data
export function validateTimesheetFormData(data: TimesheetFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.employee_id) {
    errors.push('Employee is required');
  }

  if (!data.project_id) {
    errors.push('Project is required');
  }

  if (!data.date) {
    errors.push('Work date is required');
  }

  if (data.hours_worked < 0) {
    errors.push('Hours worked cannot be negative');
  }

  if (data.hours_worked && data.hours_worked > 24) {
    errors.push('Hours worked cannot exceed 24');
  }

  if (!data.position || !data.position.trim()) {
    errors.push('Position is required');
  }

  if (!data.hour_type || !data.hour_type.trim()) {
    errors.push('Hour type is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Enhanced validation that includes payrate checking
export function validateTimesheetFormDataWithPayrate(
  data: TimesheetFormData,
  formOptions: TimesheetFormOptions
): { valid: boolean; errors: string[] } {
  const baseValidation = validateTimesheetFormData(data);
  const errors = [...baseValidation.errors];

  // Check if the payrate is 0 (slot is disabled)
  if (formOptions.ratePreview === 0) {
    errors.push('A timesheet entry cannot be created for a disabled pay-rate slot.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
