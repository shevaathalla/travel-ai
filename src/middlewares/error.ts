import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { isDevelopment } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  
  const errorResponse: {
    error: {
      message: string;
      code: string;
      details?: unknown;
      stack?: string;
    };
  } = {
    error: {
      message: statusCode === 500 ? 'Internal server error' : error.message,
      code,
    },
  };

  if (error.details) {
    errorResponse.error.details = error.details;
  }

  if (isDevelopment && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
};
