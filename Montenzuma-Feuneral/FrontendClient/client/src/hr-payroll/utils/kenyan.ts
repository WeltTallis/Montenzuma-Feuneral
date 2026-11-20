// Kenyan system utilities for the payroll UI.
import { format, parseISO } from 'date-fns';
import { enGB } from 'date-fns/locale';

export const formatKenyanCurrency = (
  amount: number,
  options: { showSymbol?: boolean } = {}
): string => {
  const { showSymbol = true } = options;
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'decimal',
    notation: 'standard',
  });
  const formattedAmount = formatter.format(amount);
  return showSymbol ? `KES ${formattedAmount}` : formattedAmount;
};

export const formatKenyanDate = (
  dateString: string | Date,
  formatPattern: string = 'dd/MM/yyyy'
): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatPattern, { locale: enGB });
  } catch (error) {
    console.error('Error formatting Kenyan date:', error);
    return 'Invalid date';
  }
};

export const formatKenyanDateTime = (
  dateString: string | Date,
  includeTime: boolean = true
): string => {
  const pattern = includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy';
  return formatKenyanDate(dateString, pattern);
};

export const formatKenyanRelativeTime = (dateString: string | Date): string => {
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

export const formatKenyanMonthYear = (dateString: string | Date): string => {
  return formatKenyanDate(dateString, 'MM/yyyy');
};

export const formatKenyanPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

export const formatKenyanNumber = (
  value: number,
  decimals: number = 0
): string => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const getKenyanMonthName = (monthIndex: number): string => {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return 'Invalid month';
  return new Intl.DateTimeFormat('en-KE', { month: 'long', timeZone: 'Africa/Nairobi' })
    .format(new Date(Date.UTC(2024, monthIndex, 1)));
};

export const getKenyanDayName = (dayIndex: number): string => {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) return 'Invalid day';
  return new Intl.DateTimeFormat('en-KE', { weekday: 'long', timeZone: 'Africa/Nairobi' })
    .format(new Date(Date.UTC(2024, 0, 7 + dayIndex)));
};

export const formatChartMonthLabel = (monthString: string): string => {
  try {
    if (!monthString || typeof monthString !== 'string') {
      return monthString || '';
    }
    const [year, month] = monthString.split('-');
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) return monthString;
    const monthName = getKenyanMonthName(monthNum - 1).slice(0, 3);
    return `${monthName} ${year}`;
  } catch (error) {
    console.error('Error formatting chart month label:', error);
    return monthString || '';
  }
};

export const getKenyanActivityIcon = (activityType: string): string => {
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

export const getKenyanNotificationIcon = (notificationType: string): string => {
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

export const getProjectStatus = (status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'active': 'Active',
    'paused': 'Paused',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
};

export const getProjectStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status?.toLowerCase()) {
    case 'active': return 'default';
    case 'paused': return 'outline';
    case 'completed': return 'secondary';
    case 'draft': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const COMBINING_RE = /[\u0300-\u036f]/g;

export function stripDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(COMBINING_RE, '')
    .replace(/[Đđ]/g, character => character === 'Đ' ? 'D' : 'd');
}

export function normalizeText(str: string): string {
  return stripDiacritics(str).toLowerCase();
}

export const textIncludes = (text: string, searchTerm: string): boolean =>
  normalizeText(text).includes(normalizeText(searchTerm));

export const textEquals = (left: string, right: string): boolean =>
  normalizeText(left) === normalizeText(right);

export const findPreferredDayType = (
  availableDayTypes: string[],
  preferredTypes: string[] = ['regular', 'ngay thuong']
): string => {
  if (availableDayTypes.length === 0) {
    return '';
  }
  const preferred = availableDayTypes.find(dayType => {
    const normalized = normalizeText(dayType);
    return preferredTypes.some(pref =>
      normalized === normalizeText(pref)
    );
  });
  return preferred || availableDayTypes[0];
};

export const isPreferredDayType = (
  dayType: string,
  preferredTypes: string[] = ['regular', 'ngay thuong']
): boolean => {
  const normalized = normalizeText(dayType);
  return preferredTypes.some(pref =>
    normalized === normalizeText(pref)
  );
};