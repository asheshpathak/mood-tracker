import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const apiError = normalize(err);

  if (apiError.statusCode >= 500) {
    logger.error({ err, requestId: req.id, path: req.originalUrl }, apiError.message);
  } else {
    logger.warn(
      { requestId: req.id, path: req.originalUrl, code: apiError.code },
      apiError.message,
    );
  }

  res.status(apiError.statusCode).json({
    error: {
      code: apiError.code,
      message: apiError.expose ? apiError.message : 'Something went wrong on our side',
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(env.isProd ? {} : { stack: (err as Error)?.stack }),
    },
  });
}

function normalize(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.reduce<Record<string, string[]>>((acc, issue) => {
      const key = issue.path.join('.') || '_';
      (acc[key] ??= []).push(issue.message);
      return acc;
    }, {});
    return ApiError.badRequest('Some fields need attention', details);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).reduce<Record<string, string[]>>(
      (acc, [key, value]) => {
        acc[key] = [value.message];
        return acc;
      },
      {},
    );
    return ApiError.badRequest('Some fields need attention', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`);
  }

  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return ApiError.conflict('That record already exists');
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return ApiError.badRequest('Request body is not valid JSON');
  }

  return ApiError.internal('Something went wrong', err);
}
