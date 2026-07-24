import { z } from 'zod';

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(28)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u, 'Tags can use letters, numbers, spaces and hyphens');

export const createObservationSchema = z.object({
  title: z.string().trim().max(140).default(''),
  body: z.string().trim().min(1, 'Write something first').max(5000, 'Keep it under 5000 characters'),
  tags: z.array(tag).max(8, 'Up to 8 tags').default([]),
  moodId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  pinned: z.boolean().default(false),
  occurredAt: z.coerce.date().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const updateObservationSchema = createObservationSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listObservationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().datetime().optional(),
  search: z.string().trim().max(120).optional(),
  tag: z.string().trim().toLowerCase().max(28).optional(),
  pinned: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>;
export type UpdateObservationInput = z.infer<typeof updateObservationSchema>;
export type ListObservationsQuery = z.infer<typeof listObservationsSchema>;
