import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing access token'));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7).trim());
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    next(err);
  }
}

/** Narrowing helper — every route behind `requireAuth` is guaranteed a user. */
export function currentUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
