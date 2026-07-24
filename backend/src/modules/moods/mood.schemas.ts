import { z } from 'zod';
import { EMOTIONS, FACTORS } from './mood.constants.js';

const emotionEnum = z.string().refine((v) => EMOTIONS.includes(v), 'Unknown emotion');
const factorEnum = z.string().refine((v) => (FACTORS as readonly string[]).includes(v), 'Unknown factor');

export const createMoodSchema = z.object({
  pleasantness: z.number().min(-1).max(1),
  energy: z.number().min(-1).max(1),
  emotions: z.array(emotionEnum).max(8, 'Pick up to 8 feelings').default([]),
  factors: z.array(factorEnum).max(10, 'Pick up to 10 influences').default([]),
  note: z.string().trim().max(2000, 'Keep it under 2000 characters').default(''),
  recordedAt: z.coerce.date().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const updateMoodSchema = createMoodSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  'Nothing to update',
);

export const listMoodsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().datetime().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emotion: z.string().optional(),
  factor: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  minScore: z.coerce.number().int().min(1).max(5).optional(),
  maxScore: z.coerce.number().int().min(1).max(5).optional(),
});

export const analyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '365d', 'all']).default('30d'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export type CreateMoodInput = z.infer<typeof createMoodSchema>;
export type UpdateMoodInput = z.infer<typeof updateMoodSchema>;
export type ListMoodsQuery = z.infer<typeof listMoodsSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
