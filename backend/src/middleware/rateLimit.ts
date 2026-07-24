import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const base: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooMany()),
  skip: () => env.NODE_ENV === 'test',
};

/** Generous ceiling for normal app traffic. */
export const apiLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 300 });

/** Tight ceiling for credential endpoints to blunt brute-force attempts. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 30,
  handler: (_req, _res, next) =>
    next(ApiError.tooMany('Too many attempts. Please wait a few minutes and try again.')),
});
