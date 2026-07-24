import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens.js';
import { User, toPublicUser, type PublicUser, type UserDocument } from '../users/user.model.js';
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from './auth.schemas.js';

const SALT_ROUNDS = 12;
const MAX_SESSIONS = 10;

interface RefreshSession {
  tokenHash: string;
  expiresAt: Date;
  userAgent: string;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

async function issueSession(user: UserDocument, userAgent: string): Promise<AuthResult> {
  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
  });
  const { token: refreshToken, expiresAt } = signRefreshToken(String(user._id));

  const now = Date.now();
  const sessions: RefreshSession[] = (user.refreshSessions ?? [])
    .filter((s) => s.expiresAt.getTime() > now)
    .map((s) => ({
      tokenHash: s.tokenHash,
      expiresAt: s.expiresAt,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
    }));

  sessions.push({
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: userAgent.slice(0, 200),
    createdAt: new Date(),
  });

  user.set('refreshSessions', sessions.slice(-MAX_SESSIONS));
  user.set('lastActiveAt', new Date());
  await user.save();

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function register(input: RegisterInput, userAgent: string): Promise<AuthResult> {
  if (!env.ALLOW_REGISTRATION) {
    throw ApiError.forbidden('Registration is currently closed');
  }

  const existing = await User.exists({ email: input.email });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    timezone: input.timezone,
  });

  // `create` respects `select: false`, so re-select the fields the session needs.
  const fresh = await User.findById(user._id).select('+refreshSessions');
  if (!fresh) throw ApiError.internal('Could not create your account');

  return issueSession(fresh, userAgent);
}

export async function login(input: LoginInput, userAgent: string): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash +refreshSessions');
  // Constant-ish work either way so timing does not leak account existence.
  const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
  const ok = await bcrypt.compare(input.password, hash);

  if (!user || !ok) throw ApiError.unauthorized('Email or password is incorrect');

  return issueSession(user, userAgent);
}

export async function refresh(token: string, userAgent: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub).select('+refreshSessions');
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  const tokenHash = hashToken(token);
  const now = Date.now();
  const sessions = user.refreshSessions ?? [];
  const match = sessions.find((s) => s.tokenHash === tokenHash && s.expiresAt.getTime() > now);

  if (!match) {
    // Token was already rotated away (or forged) — drop every session as a precaution.
    user.set('refreshSessions', []);
    await user.save();
    throw new ApiError(401, 'Your session is no longer valid. Please sign in again.', {
      code: 'REFRESH_INVALID',
    });
  }

  // Rotation: the presented token is retired before a new one is minted.
  user.set(
    'refreshSessions',
    sessions.filter((s) => s.tokenHash !== tokenHash && s.expiresAt.getTime() > now),
  );

  return issueSession(user, userAgent);
}

export async function logout(userId: string, token?: string): Promise<void> {
  const user = await User.findById(userId).select('+refreshSessions');
  if (!user) return;

  if (token) {
    const tokenHash = hashToken(token);
    user.set(
      'refreshSessions',
      (user.refreshSessions ?? []).filter((s) => s.tokenHash !== tokenHash),
    );
  } else {
    user.set('refreshSessions', []);
  }
  await user.save();
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  if (input.name !== undefined) user.name = input.name;
  if (input.timezone !== undefined) user.timezone = input.timezone;
  if (input.preferences?.weekStartsOn !== undefined) {
    user.set('preferences.weekStartsOn', input.preferences.weekStartsOn);
  }
  if (input.preferences?.reminderTime !== undefined) {
    user.set('preferences.reminderTime', input.preferences.reminderTime);
  }

  await user.save();
  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash +refreshSessions');
  if (!user) throw ApiError.notFound('Account not found');

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Your current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.set('refreshSessions', []); // force re-auth everywhere
  await user.save();
}
