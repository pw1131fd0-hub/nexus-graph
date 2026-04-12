import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[Error] ${code}:`, err.message);

  res.status(status).json({
    error: {
      code,
      message: err.message,
      details: err.details || {},
    },
  });
};

export const createError = (
  message: string,
  status: number,
  code: string,
  details?: Record<string, unknown>
): AppError => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};
