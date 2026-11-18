import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public details: any;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number, details: any = null, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const appError = err instanceof AppError;
  res.status(appError ? (err as AppError).statusCode : 500).json({
    success: false,
    message: appError ? err.message : 'Internal server error',
    ...(appError && (err as AppError).details ? { details: (err as AppError).details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
