import type { AxiosResponse } from 'axios';
import logger from './logger';

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string | null = null,
    public readonly details: unknown = null
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationIssue[] = []
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

interface KraResponse {
  resultCd?: unknown;
  resultMsg?: unknown;
}

export function handleApiResponse<T>(response: AxiosResponse<T>): T {
  if (response.data === undefined || response.data === null) {
    throw new ApiError('Invalid API response', 500);
  }

  if (typeof response.data === 'object') {
    const result = response.data as KraResponse;
    if (typeof result.resultCd === 'string' && result.resultCd !== '0000') {
      const message = typeof result.resultMsg === 'string' ? result.resultMsg : 'API Error';
      logger.error(`API Error: ${message}`);
      throw new ApiError(message, response.status || 400, result.resultCd);
    }
  }

  return response.data;
}

export interface FormattedError {
  success: false;
  error: {
    message: string;
    code?: string | null;
    details?: unknown;
    validationErrors?: ValidationIssue[];
  };
  statusCode: number;
}

export function formatError(error: unknown): FormattedError {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: { message: error.message, code: error.errorCode, details: error.details },
      statusCode: error.statusCode,
    };
  }
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: { message: error.message, validationErrors: error.errors },
      statusCode: 400,
    };
  }
  if (error instanceof AuthenticationError) {
    return { success: false, error: { message: error.message }, statusCode: 401 };
  }

  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return { success: false, error: { message }, statusCode: 500 };
}
