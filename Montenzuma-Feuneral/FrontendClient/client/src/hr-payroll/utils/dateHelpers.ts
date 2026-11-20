import { formatDate as formatDateUtil } from '@hr/utils/formatters';
import { DayType } from '@hr/types/api/payrate.types';

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function kenyaPublicHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const goodFriday = new Date(year, easter.getMonth(), easter.getDate() - 2);
  const easterMonday = new Date(year, easter.getMonth(), easter.getDate() + 1);
  const formatDate = (date: Date) => dateToString(date);

  return new Set([
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-06-01`,
    `${year}-10-10`,
    `${year}-10-20`,
    `${year}-12-12`,
    `${year}-12-25`,
    `${year}-12-26`,
    formatDate(goodFriday),
    formatDate(easterMonday),
  ]);
}

/**
 * Fixed-date and Easter-based Kenyan public holidays.
 * Eid holidays are gazetted annually and should be configured for each year.
 */
export function isKenyanPublicHoliday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T00:00:00`) : date;
  if (Number.isNaN(dateObj.getTime())) return false;
  return kenyaPublicHolidays(dateObj.getFullYear()).has(dateToString(dateObj));
}

/**
 * Determine the day type based on date
 * @param date - Date string in YYYY-MM-DD format or Date object
 * @returns DayType for the given date
 */
export function getDayType(date: string | Date): DayType {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Check if it's a public holiday first
  if (isKenyanPublicHoliday(date)) {
    return 'ngày lễ';
  }
  
  // Sunday is always "ngày nghỉ"
  if (dayOfWeek === 0) {
    return 'ngày nghỉ';
  }
  
  // Monday to Friday are "ngày thường"
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return 'ngày thường';
  }
  
  // Saturday requires user input - we return null to indicate this
  // The calling code should handle Saturday selection separately
  throw new Error('Saturday day type must be specified by user');
}

/**
 * Check if a date is Saturday and requires user input for day type
 */
export function isSaturdayRequiringDayType(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = dateObj.getDay();
  
  // If it's Saturday and not a public holiday, it requires user input
  return dayOfWeek === 6 && !isKenyanPublicHoliday(date);
}

/**
 * Get day type with Saturday handling
 * Returns the day type or null if Saturday requires user selection
 */
export function getDayTypeOrNull(date: string | Date): DayType | null {
  try {
    return getDayType(date);
  } catch (error) {
    // This happens for Saturdays that require user input
    if (isSaturdayRequiringDayType(date)) {
      return null;
    }
    throw error;
  }
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: string | Date): string {
  return formatDateUtil(date);
}

/**
 * Get the day of the week in English
 */
export function getDayOfWeek(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = dateObj.getDay();
  
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  
  return dayNames[dayOfWeek];
}

/**
 * Check if date string is in correct format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime());
}

/**
 * Convert Date object to YYYY-MM-DD string
 * Uses local timezone to avoid UTC conversion issues
 */
export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Renders an ISO date (YYYY-MM-DD, optionally with a time part) as dd/MM/yyyy.
 *
 * Server field suggestions and payrate bounds arrive as raw ISO strings; showing
 * them verbatim next to dates the rest of the app formats as dd/MM/yyyy reads as
 * a bug. Values that are not ISO dates pass through untouched, so mixed payloads
 * (numbers, labels) still render unchanged.
 */
export function formatIsoDateDisplay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
  const day = parsed.getDate().toString().padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * Get an English description for a day type without changing its API value.
 */
export function getDayTypeDescription(dayType: DayType): string {
  const descriptions = {
    'ngày thường': 'Regular working day (Monday to Friday)',
    'ngày nghỉ': 'Rest day (Sunday or a Saturday off)',
    'ngày lễ': 'Public holiday'
  };

  return descriptions[dayType];
}

/**
 * Generate month options for dropdowns
 * @param count - Number of months to generate (default: 12)
 * @returns Array of month options with value (YYYY-MM) and label
 */
export function generateMonthOptions(count: number = 12): Array<{ value: string; label: string }> {
  const months = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    const label = `Month ${month}/${year}`;
    months.push({ value, label });
  }

  return months;
}

/**
 * Check if an ISO date string occurs today (local time)
 */
export function isISODateToday(dateStr: string): boolean {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return false;
  const now = new Date();
  return (
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate()
  );
}
