// Application Constants

// Status Types
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  PARTNER: 'partner',
} as const;

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  INACTIVE: 'inactive',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const TIMESHEET_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PAY_TYPES = {
  NORMAL: 'normal',
  OVERTIME: 'overtime',
  WEEKEND: 'weekend',
  HOLIDAY: 'holiday',
} as const;

// English labels
export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
} as const;

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.DRAFT]: 'Draft',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.CANCELLED]: 'Cancelled',
  [PROJECT_STATUS.INACTIVE]: 'Inactive',
} as const;

export const EMPLOYEE_STATUS_LABELS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'Active',
  [EMPLOYEE_STATUS.INACTIVE]: 'Inactive',
} as const;

export const PAY_TYPE_LABELS = {
  [PAY_TYPES.NORMAL]: 'Standard hours',
  [PAY_TYPES.OVERTIME]: 'Overtime',
  [PAY_TYPES.WEEKEND]: 'Weekend',
  [PAY_TYPES.HOLIDAY]: 'Public holiday',
} as const;

// Date Formats
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd', // API format
  DISPLAY: 'dd/MM/yyyy', // Display format
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm:ss',
} as const;

// Existing records are denominated in VND; changing currency requires a
// deliberate backend/data migration rather than a display-only conversion.
export const CURRENCY = {
  CODE: 'VND',
  SYMBOL: '₫',
  LOCALE: 'en-KE',
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  CCCD: {
    LENGTH: 12,
    PATTERN: /^\d{12}$/,
  },
  PHONE: {
    PATTERN: /^(\+254|254|0)?[17]\d{8}$/,
  },
  EMAIL: {
    PATTERN: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  },
  TIMESHEET: {
    MIN_HOURS: 0,
    MAX_HOURS: 24,
    MAX_DAYS_PER_EMPLOYEE: 30,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Enter a valid email address',
  INVALID_PHONE: 'Enter a valid Kenyan phone number',
  INVALID_CCCD: 'Enter a valid National ID number',
  INVALID_DATE: 'Enter a valid date',
  DATE_RANGE: 'The end date must be after the start date',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`,
  PASSWORD_REQUIREMENTS: 'Password must include an uppercase letter, a lowercase letter, a number and a special character',
  HOURS_INVALID: `Hours must be between ${VALIDATION.TIMESHEET.MIN_HOURS} and ${VALIDATION.TIMESHEET.MAX_HOURS}`,
  NETWORK_ERROR: 'Connection error. Please try again',
  UNAUTHORIZED: 'You are not authorised to do this',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  SERVER_ERROR: 'Something went wrong. Please try again later',
} as const;

// Success Messages (Vietnamese)
export const SUCCESS_MESSAGES = {
  LOGIN: 'Đăng nhập thành công',
  LOGOUT: 'Đăng xuất thành công',
  CREATED: 'Tạo mới thành công',
  UPDATED: 'Cập nhật thành công',
  DELETED: 'Xóa thành công',
  APPROVED: 'Phê duyệt thành công',
  REJECTED: 'Loại thành công',
  IMPORTED: 'Nhập dữ liệu thành công',
  EXPORTED: 'Xuất dữ liệu thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
  BULK_CREATED: 'Tạo hàng loạt thành công',
  BULK_UPDATED: 'Cập nhật hàng loạt thành công',
  BULK_DELETED: 'Xóa hàng loạt thành công',
  BULK_APPROVED: 'Phê duyệt hàng loạt thành công',
  BULK_REJECTED: 'Loại hàng loạt thành công',
} as const;

// Sorting Options
export const SORT_OPTIONS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  NAME: 'name',
  DATE: 'date',
  AMOUNT: 'amount',
} as const;

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
