import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth.js';
import * as authService from './auth.service.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schemas.js';

const ua = (req: Request) => req.get('user-agent') ?? '';

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInput, ua(req));
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput, ua(req));
  res.json(result);
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refresh(refreshToken, ua(req));
  res.json(result);
}

export async function logoutHandler(req: Request, res: Response) {
  const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
  await authService.logout(currentUser(req).id, refreshToken);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  res.json({ user: await authService.getProfile(currentUser(req).id) });
}

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await authService.updateProfile(currentUser(req).id, req.body as UpdateProfileInput);
  res.json({ user });
}

export async function changePasswordHandler(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await authService.changePassword(currentUser(req).id, currentPassword, newPassword);
  res.status(204).send();
}
