import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function toDetails(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const key = issue.path.join('.') || '_';
    (acc[key] ??= []).push(issue.message);
    return acc;
  }, {});
}

/**
 * Validates + coerces `body`, `query` and `params`.
 * Express 5 exposes `req.query` as a getter, so parsed query values are stashed
 * on `res.locals.query` and read through `validatedQuery(req, res)`.
 */
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(ApiError.badRequest('Some fields need attention', toDetails(err)));
        return;
      }
      next(err);
    }
  };
}

/** Reads the query object produced by `validate({ query })`. */
export function parsedQuery<T>(res: Response): T {
  return res.locals.query as T;
}
