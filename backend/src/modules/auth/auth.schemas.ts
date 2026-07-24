import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'That password is too long');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password,
  timezone: z.string().trim().min(1).max(64).default('UTC'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Missing refresh token'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    preferences: z
      .object({
        weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
        reminderTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
          .nullable()
          .optional(),
      })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
