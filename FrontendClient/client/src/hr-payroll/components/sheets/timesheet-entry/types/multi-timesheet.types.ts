import type { Employee } from '@hr/types/api/employee.types';

export interface TimesheetEntry {
  id: string; // Temporary ID for React keys
  employeeId: number;
  employee?: Employee;
  projectId: number;
  date: string;
  hours: Record<string, number>; // { "ca ngày": 8, "ca đêm": 4, "tăng ca": 2 }
  position: string;
  dayType?: 'Date thường' | 'Date nghỉ' | 'Date lễ' | string;

  originalValues?: {
    hours: Record<string, number>;
    dayType?: string;
  }; // Store original values to detect actual changes
}

export interface MultiTimesheetFormData {
  projectId: number; // Keep for backward compatibility with project-based filtering
  entries: TimesheetEntry[];
}

export interface MultiTimesheetFormOptions {
  positions: string[];
  hourTypes: string[];
  availableEmployees: Employee[];
}

export interface TimesheetValidation {
  valid: boolean;
  errors: string[];
  entryValidations: Record<string, {
    valid: boolean;
    errors: string[];
  }>;
}
