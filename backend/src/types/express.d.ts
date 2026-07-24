import 'express';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      email: string;
      name: string;
    }
    interface Request {
      /** Populated by the `requireAuth` middleware. */
      user?: AuthenticatedUser;
      /** Correlation id attached to every request/response. */
      id?: string;
    }
  }
}

export {};
