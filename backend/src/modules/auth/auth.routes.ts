import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from './auth.schemas.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  controller.registerHandler,
);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), controller.loginHandler);
authRouter.post(
  '/refresh',
  authLimiter,
  validate({ body: refreshSchema }),
  controller.refreshHandler,
);

authRouter.post('/logout', requireAuth, controller.logoutHandler);
authRouter.get('/me', requireAuth, controller.meHandler);
authRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  controller.updateProfileHandler,
);
authRouter.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate({ body: changePasswordSchema }),
  controller.changePasswordHandler,
);
