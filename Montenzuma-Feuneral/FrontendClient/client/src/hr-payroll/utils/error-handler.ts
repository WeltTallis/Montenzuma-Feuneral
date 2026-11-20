import { toast } from '@hr/components/ui/sonner';

/**
 * Centralized error handling utility for the entire application
 * Provides consistent error titles and messages for backend errors
 */

export interface ErrorDetails {
  title: string;
  message: string;
  status?: number;
}

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

interface ApiErrorResponse {
  status: 'error';
  message?: string;
  http_status?: number;
  retry_after?: number;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

interface NetworkError {
  code?: string;
  response?: unknown;
}

const UPSTREAM_GATEWAY_MESSAGE =
  'The server is temporarily unavailable. Please try again shortly.';

const LEGACY_LOCALIZED_TEXT_PATTERN =
  /[đĐăĂơƠưƯáàạảãâầấậẩẫằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữýỳỵỷỹ]/i;

function sanitizeUserFacingMessage(message: string, statusCode?: number): string {
  if (/<\s*!doctype\s+html|<\s*html\b/i.test(message)) {
    return UPSTREAM_GATEWAY_MESSAGE;
  }
  if (LEGACY_LOCALIZED_TEXT_PATTERN.test(message)) {
    return getErrorMessageByStatusCode(statusCode ?? 0);
  }
  return message;
}

function sanitizeSuccessMessage(message: string): string {
  return LEGACY_LOCALIZED_TEXT_PATTERN.test(message)
    ? 'Completed successfully.'
    : message;
}

function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === 'error'
  );
}

function isAxiosErrorResponse(error: unknown): error is AxiosErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error
  );
}

function hasMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

function isNetworkErrorType(error: unknown): error is NetworkError {
  return (
    error !== null &&
    typeof error === 'object'
  );
}

/**
 * Context-aware error messages for different domains
 */
export const ERROR_MESSAGES_BY_CONTEXT = {
  PROJECT_EMPLOYEE: {
    REMOVE_FAILED: 'Could not remove the employee from the project.',
    ASSIGN_FAILED: 'Could not assign the employee to the project.',
    UPDATE_FAILED: 'Could not update the assignment.',
    FETCH_FAILED: 'Could not load the employee list.',
    VALIDATION_FAILED: 'The submitted data is invalid.',
    VALIDATION_ERROR: 'The submitted data is invalid.',
    NETWORK_ERROR: 'A network error occurred.',
    SERVER_ERROR: 'A server error occurred.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'An unexpected error occurred.',
    NETWORK_ERROR: 'A network error occurred.',
    SERVER_ERROR: 'A server error occurred.',
    VALIDATION_ERROR: 'The submitted data is invalid.',
    VALIDATION_FAILED: 'The submitted data is invalid.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
  },
} as const;

export type ErrorContext = keyof typeof ERROR_MESSAGES_BY_CONTEXT;

/**
 * Creates a standardized error object from various error types
 */
export function createAppError(error: unknown): AppError {
  if (error instanceof Error) {
    const err = error as Error & { code?: string; statusCode?: number; details?: Record<string, unknown> };
    return {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const message = (errorObj.message as string) ||
                   (errorObj.error as string) ||
                   'An error occurred.';
    const statusCode = (errorObj.http_status as number) ||
                      (errorObj.statusCode as number) ||
                      (errorObj.status_code as number);

    return {
      message,
      code: errorObj.code as string,
      statusCode,
      details: errorObj.details as Record<string, unknown>,
    };
  }

  return {
    message: 'An unexpected error occurred.',
  };
}

/**
 * Maps HTTP status codes to user-friendly messages with context awareness
 */
export function getErrorMessageByStatusCode(statusCode: number, context: ErrorContext = 'GENERAL'): string {
  const messages = (ERROR_MESSAGES_BY_CONTEXT[context] || ERROR_MESSAGES_BY_CONTEXT.GENERAL) as typeof ERROR_MESSAGES_BY_CONTEXT.GENERAL;

  switch (statusCode) {
    case 400:
      return messages.VALIDATION_FAILED || messages.VALIDATION_ERROR;
    case 401:
    case 403:
      return messages.PERMISSION_DENIED || 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource could not be found.';
    case 409:
      return 'The request conflicts with the current data.';
    case 422:
      return messages.VALIDATION_FAILED || messages.VALIDATION_ERROR;
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
    case 504:
      return messages.SERVER_ERROR || 'A server error occurred.';
    default:
      if (statusCode >= 500) {
        return messages.SERVER_ERROR || 'A server error occurred.';
      }
      if (statusCode >= 400) {
        return messages.VALIDATION_ERROR || 'The request is invalid.';
      }
      return messages.UNKNOWN_ERROR;
  }
}

/**
 * Creates a user-friendly error message with context
 */
export function createErrorMessage(
  error: unknown,
  context: ErrorContext = 'GENERAL',
  fallbackMessage?: string
): string {
  const appError = createAppError(error);

  // Keep useful English backend details, but do not expose untranslated messages.
  if (appError.message && appError.message !== 'An error occurred.' && appError.message.trim().length > 0) {
    return sanitizeUserFacingMessage(appError.message, appError.statusCode);
  }

  if (appError.statusCode) {
    return getErrorMessageByStatusCode(appError.statusCode, context);
  }

  if (appError.code) {
    switch (appError.code) {
      case 'NETWORK_ERROR':
        return (ERROR_MESSAGES_BY_CONTEXT[context] as typeof ERROR_MESSAGES_BY_CONTEXT.GENERAL | undefined)?.NETWORK_ERROR || ERROR_MESSAGES_BY_CONTEXT.GENERAL.NETWORK_ERROR;
      case 'VALIDATION_ERROR':
        return (ERROR_MESSAGES_BY_CONTEXT[context] as typeof ERROR_MESSAGES_BY_CONTEXT.GENERAL | undefined)?.VALIDATION_FAILED || ERROR_MESSAGES_BY_CONTEXT.GENERAL.VALIDATION_ERROR;
      default:
        break;
    }
  }

  return fallbackMessage || (ERROR_MESSAGES_BY_CONTEXT[context] as typeof ERROR_MESSAGES_BY_CONTEXT.GENERAL | undefined)?.UNKNOWN_ERROR || ERROR_MESSAGES_BY_CONTEXT.GENERAL.UNKNOWN_ERROR;
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const appError = createAppError(error);
  return appError.statusCode === 400 ||
         appError.statusCode === 422 ||
         appError.code === 'VALIDATION_ERROR';
}

/**
 * Type guard to check if an error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  const appError = createAppError(error);
  return appError.statusCode === 401 ||
         appError.statusCode === 403 ||
         appError.code === 'PERMISSION_DENIED';
}

/**
 * Maps HTTP status codes to English error titles
 */
export const getErrorTitle = (statusCode?: number): string => {
  if (!statusCode) return 'System error';

  switch (statusCode) {
    case 400:
      return 'Invalid data';
    case 401:
      return 'Sign-in required';
    case 403:
      return 'Access denied';
    case 404:
      return 'No results found';
    case 409:
      return 'Data conflict';
    case 422:
      return 'Invalid data';
    case 429:
      return 'Too many requests';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error';
    default:
      return statusCode >= 500 ? 'Server error' : 'System error';
  }
};

/**
 * Extracts error message from various error response formats
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred.';
  }

  // Handle structured API error response (from client.ts)
  if (isApiErrorResponse(error)) {
    const apiError = error;

    // Handle rate limiting with retry_after — use the server's factual remaining
    // seconds (computed from X-RateLimit-Reset, not a hardcoded 60).
    if (apiError.http_status === 429) {
      const retryAfter = apiError.retry_after || 60;
      const baseMsg = sanitizeUserFacingMessage(apiError.message || 'Too many requests. Please try again later.', 429);
      if (baseMsg.includes('second')) {
        return baseMsg;
      }
      if (baseMsg.endsWith('later.')) {
        return `Too many requests. Please try again in ${retryAfter} seconds.`;
      }
      return `${baseMsg} (try again in ${retryAfter} seconds)`;
    }

    // If no message, return based on HTTP status code
    if (!apiError.message) {
      const statusCode = apiError.http_status;
      return statusCode >= 200 && statusCode < 300 ? 'Completed successfully.' : 'The request failed.';
    }

    return sanitizeUserFacingMessage(apiError.message, apiError.http_status);
  }

  // Handle axios error response
  if (isAxiosErrorResponse(error)) {
    const axiosError = error;
    const responseData = axiosError.response?.data;
    const statusCode = axiosError.response?.status;

    if (responseData) {
      // Handle structured error response: { status: "error", message: "...", http_status: 400 }
      if (responseData.message) {
        return sanitizeUserFacingMessage(responseData.message, statusCode);
      }
      // Handle alternative error field
      if (responseData.error) {
        return sanitizeUserFacingMessage(responseData.error, statusCode);
      }

      // If no message/error field, return based on HTTP status code
      if (statusCode) {
        return statusCode >= 200 && statusCode < 300 ? 'Completed successfully.' : 'The request failed.';
      }
    }

    // Fallback to axios error message
    if (axiosError.message) {
      return sanitizeUserFacingMessage(axiosError.message, statusCode);
    }

    // If no message but we have status code, return based on it
    if (statusCode) {
      return statusCode >= 200 && statusCode < 300 ? 'Completed successfully.' : 'The request failed.';
    }
  }

  // Handle direct error objects
  if (hasMessage(error)) {
    return sanitizeUserFacingMessage(error.message);
  }

  // Handle Error instances
  if (error instanceof Error) {
    return sanitizeUserFacingMessage(error.message);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return sanitizeUserFacingMessage(error);
  }

  // Fallback
  return 'An unexpected error occurred.';
};

/**
 * Extracts HTTP status code from various error formats
 */
export const getErrorStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  // Handle structured API error response
  if (isApiErrorResponse(error)) {
    return error.http_status;
  }

  // Handle axios error response
  if (isAxiosErrorResponse(error) && error.response?.status) {
    return error.response.status;
  }

  return undefined;
};

/**
 * Gets complete error details from any error format
 */
export const getErrorDetails = (error: unknown): ErrorDetails => {
  const statusCode = getErrorStatusCode(error);
  const title = getErrorTitle(statusCode);
  const message = getErrorMessage(error);

  return {
    title,
    message,
    status: statusCode,
  };
};

/**
 * Shows error notification using toast system
 * This is the main function to use for displaying errors to users
 */
export const showErrorNotification = (error: unknown, customTitle?: string): void => {
  const details = getErrorDetails(error);
  const title = customTitle || details.title || 'Request failed';
  const description = details.message;
  const duration = description.length <= 80 ? 3000 : 6000;
  // Keep rejected-upload details readable until the user dismisses the toast.
  // that carries the server's reason for a refused file.
  toast({ title, description, duration, closeButton: true });
};

/**
 * Gets success message from response or fallback to default
 */
export const getSuccessMessage = (response: unknown): string => {
  // Handle null/undefined
  if (!response) {
    return 'Completed successfully.';
  }

  // Handle structured API response
  if (response && typeof response === 'object') {
    const apiResponse = response as Record<string, unknown>;

    // Check for message field
    if (typeof apiResponse.message === 'string') {
      return sanitizeSuccessMessage(apiResponse.message);
    }

    // Check for data.message
    if (apiResponse.data && typeof apiResponse.data === 'object' && 'message' in apiResponse.data && typeof apiResponse.data.message === 'string') {
      return sanitizeSuccessMessage(apiResponse.data.message);
    }
  }

  // Fallback to default success message
  return 'Completed successfully.';
};

/**
 * Shows success notification
 */
export const showSuccessNotification = (messageOrResponse: string | unknown): void => {
  const message = typeof messageOrResponse === 'string'
    ? sanitizeSuccessMessage(messageOrResponse)
    : getSuccessMessage(messageOrResponse);

  toast('Success', { description: message, duration: 3000 });
};

/**
 * Shows notification for bulk operations with detailed results
 */
export const showBulkOperationNotification = (result: {
  total_created?: number;
  total_failed?: number;
  total_updated?: number;
  total_deleted?: number;
  total_approved?: number;
  total_rejected?: number;
  approved?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
}, operationType: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'reset' | 'import'): void => {
  const {
    total_created = 0,
    total_failed = 0,
    total_updated = 0,
    total_deleted = 0,
    total_approved = 0,
    total_rejected = 0,
    approved = 0,
    skipped = 0,
    failed = 0,
    errors = []
  } = result;

  const hasFailures = total_failed > 0 || failed > 0 || errors.length > 0;
  const hasSkipped = skipped > 0;
  const verbMap: Record<typeof operationType, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    approve: 'approved',
    reject: 'rejected',
    reset: 'reset',
    import: 'imported'
  };
  let affected = 0;
  switch (operationType) {
    case 'create': affected = total_created; break;
    case 'update': affected = total_updated; break;
    case 'delete': affected = total_deleted; break;
    case 'approve': affected = total_approved || approved; break;
    case 'reject': affected = total_rejected; break;
    case 'reset': affected = approved; break;
    case 'import': affected = total_created + total_updated; break;
  }

  const title = hasFailures ? 'Completed with errors' : 'Success';

  let description = '';
  if (hasFailures && hasSkipped) {
    description = `${verbMap[operationType]} ${affected} records; skipped ${skipped} approved records; ${total_failed || failed} failed.`;
  } else if (hasFailures) {
    description = `${verbMap[operationType]} ${affected} records; ${total_failed || failed} failed.`;
  } else if (hasSkipped) {
    description = `${verbMap[operationType]} ${affected} records; skipped ${skipped} approved records.`;
  } else {
    description = `${verbMap[operationType]} ${affected} records.`;
  }

  toast(title, { description, duration: 3000 });
};

/**
 * Network error handler for specific network-related errors
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!isNetworkErrorType(error)) return false;

  // Check for common network error indicators
  const errorCode = error.code;
  const networkErrors = ['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED', 'ENETDOWN', 'ENETUNREACH', 'EHOSTDOWN', 'EHOSTUNREACH', 'EPIPE'];

  if (errorCode && networkErrors.includes(errorCode)) return true;

  // Check if it's a network error without response
  if ('response' in error && !error.response) return true;

  return false;
};

/**
 * Handles network errors specifically
 */
export const handleNetworkError = (): void => {
  toast('Connection error', { description: 'Could not connect to the server. Please try again.', duration: 3000 });
};
