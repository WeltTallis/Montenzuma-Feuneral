import { format, parseISO } from 'date-fns';
import { enGB } from 'date-fns/locale';

/**
 * Legacy payroll currency formatter. Currency remains VND until the HR
 * backend's currency settings and stored values are migrated explicitly.
 * @param amount Amount in VND (integer)
 * @param options Formatting options
 */
export const formatVietnameseCurrency = (
  amount: number,
  options: {
    showSymbol?: boolean;
  } = {}
): string => {
  const { showSymbol = true } = options;

  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'decimal',
    notation: 'standard',
  });

  const formattedAmount = formatter.format(amount);
  return showSymbol ? `${formattedAmount} ₫` : formattedAmount;
};

/**
 * Format a date using Kenyan English conventions.
 * @param dateString ISO date string or Date object
 * @param formatPattern Date format pattern
 */
export const formatVietnameseDate = (
  dateString: string | Date,
  formatPattern: string = 'dd/MM/yyyy'
): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatPattern, { locale: enGB });
  } catch (error) {
    console.error('Error formatting HR date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date and time using Kenyan English conventions.
 * @param dateString ISO date string or Date object
 * @param includeTime Whether to include time
 */
export const formatVietnameseDateTime = (
  dateString: string | Date,
  includeTime: boolean = true
): string => {
  const pattern = includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy';
  return formatVietnameseDate(dateString, pattern);
};

/**
 * Format relative time in English.
 * @param dateString ISO date string or Date object
 */
export const formatVietnameseRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} year${years === 1 ? '' : 's'} ago`;
    } else if (months > 0) {
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return 'A few seconds ago';
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Time unavailable';
  }
};

/**
 * Format month and year in Kenyan English conventions.
 * @param dateString ISO date string or Date object
 */
export const formatVietnameseMonthYear = (dateString: string | Date): string => {
  return formatVietnameseDate(dateString, 'MM/yyyy');
};

/**
 * Format a percentage with Kenyan English conventions.
 * @param value Percentage value (e.g., 12.5 for 12.5%)
 * @param decimals Number of decimal places
 */
export const formatVietnamesePercentage = (
  value: number,
  decimals: number = 1
): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format a number with Kenyan English conventions.
 * @param value Number to format
 * @param decimals Number of decimal places
 */
export const formatVietnameseNumber = (
  value: number,
  decimals: number = 0
): string => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Get month name in English.
 * @param monthIndex 0-based month index (0 = January)
 */
export const getVietnameseMonthName = (monthIndex: number): string => {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return 'Invalid month';
  return new Intl.DateTimeFormat('en-KE', { month: 'long', timeZone: 'Africa/Nairobi' })
    .format(new Date(Date.UTC(2024, monthIndex, 1)));
}

/**
 * Get day name in English.
 * @param dayIndex 0-based day index (0 = Sunday)
 */
export const getVietnameseDayName = (dayIndex: number): string => {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return 'Invalid day';
  return new Intl.DateTimeFormat('en-KE', { weekday: 'long', timeZone: 'Africa/Nairobi' })
    .format(new Date(Date.UTC(2024, 0, 7 + dayIndex)));
};

/**
 * Format chart month label (e.g., "2024-01" -> "Jan 2024")
 * @param monthString Month string in YYYY-MM format
 */
export const formatChartMonthLabel = (monthString: string): string => {
  try {
    if (!monthString || typeof monthString !== 'string') {
      return monthString || '';
    }
    const [year, month] = monthString.split('-');
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) return monthString;
    const monthName = getVietnameseMonthName(monthNum - 1).slice(0, 3);
    return `${monthName} ${year}`;
  } catch (error) {
    console.error('Error formatting chart month label:', error);
    return monthString || '';
  }
};

/**
 * Resolve the icon for an activity type.
 */
export const getVietnameseActivityIcon = (activityType: string): string => {
  const iconMap: Record<string, string> = {
    'timesheet_approved': 'check-circle',
    'timesheet_rejected': 'x-circle',
    'employee_created': 'user-plus',
    'employee_updated': 'user-edit',
    'project_created': 'folder-plus',
    'project_status_changed': 'git-branch',
    'payroll_processed': 'dollar-sign',
    'user_login': 'log-in',
    'import_completed': 'upload',
  };

  return iconMap[activityType] || 'activity';
};

/**
 * Resolve the icon for a notification type.
 */
export const getVietnameseNotificationIcon = (notificationType: string): string => {
  const iconMap: Record<string, string> = {
    'error': 'alert-triangle',
    'warning': 'alert-circle',
    'info': 'info',
    'success': 'check-circle',
    'approval_needed': 'clock',
    'reminder': 'bell',
  };

  return iconMap[notificationType] || 'bell';
};

/**
 * Get a project status label in English.
 * @param status Project status value
 */
export const getVietnameseProjectStatus = (status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'active': 'Active',
    'paused': 'Paused',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };

  return statusMap[status] || status;
};

/**
 * Get project status badge variant
 * @param status Project status value
 */
export const getProjectStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'default';
    case 'paused':
      return 'outline';
    case 'completed':
      return 'secondary';
    case 'draft':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const COMBINING_RE = /[\u0300-\u036f]/g;

/** Strip Vietnamese diacritics for search. "Lù Văn Hà" → "lu van ha" */
export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(COMBINING_RE, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Find a day type from available options, preferring common variants
 * @param availableDayTypes - Array of available day type strings
 * @param preferredTypes - Preferred day type variants to search for (defaults to "ngày thường" variants)
 * @returns The matched day type or the first available day type
 */
export const findPreferredDayType = (
  availableDayTypes: string[],
  preferredTypes: string[] = ['ngay thuong', 'ngày thường']
): string => {
  if (availableDayTypes.length === 0) {
    return '';
  }

  // Try to find a preferred day type
  const preferred = availableDayTypes.find(dayType => {
    const normalized = normalizeVietnamese(dayType);
    return preferredTypes.some(pref =>
      normalized === normalizeVietnamese(pref)
    );
  });

  return preferred || availableDayTypes[0];
};

/**
 * Check if a day type matches any of the preferred variants
 * @param dayType - The day type to check
 * @param preferredTypes - Preferred day type variants
 * @returns True if the day type matches any preferred variant
 */
export const isPreferredDayType = (
  dayType: string,
  preferredTypes: string[] = ['ngay thuong', 'ngày thường']
): boolean => {
  const normalized = normalizeVietnamese(dayType);
  return preferredTypes.some(pref =>
    normalized === normalizeVietnamese(pref)
  );
};
