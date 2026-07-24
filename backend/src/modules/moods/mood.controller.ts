import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth.js';
import { parsedQuery } from '../../middleware/validate.js';
import type { RangeKey } from '../../utils/time.js';
import { getAnalytics } from './mood.analytics.js';
import { EMOTION_GROUPS, EMOTIONS, FACTORS, MOOD_LABELS } from './mood.constants.js';
import * as service from './mood.service.js';
import type { AnalyticsQuery, CreateMoodInput, ListMoodsQuery, UpdateMoodInput } from './mood.schemas.js';

export async function createHandler(req: Request, res: Response) {
  const mood = await service.createMood(currentUser(req).id, req.body as CreateMoodInput);
  res.status(201).json({ mood: mood.toJSON() });
}

export async function listHandler(req: Request, res: Response) {
  const query = parsedQuery<ListMoodsQuery>(res);
  res.json(await service.listMoods(currentUser(req).id, query));
}

export async function getHandler(req: Request, res: Response) {
  const mood = await service.getMood(currentUser(req).id, String(req.params.id));
  res.json({ mood: mood.toJSON() });
}

export async function updateHandler(req: Request, res: Response) {
  const mood = await service.updateMood(
    currentUser(req).id,
    String(req.params.id),
    req.body as UpdateMoodInput,
  );
  res.json({ mood: mood.toJSON() });
}

export async function deleteHandler(req: Request, res: Response) {
  await service.deleteMood(currentUser(req).id, String(req.params.id));
  res.status(204).send();
}

export async function todayHandler(req: Request, res: Response) {
  const tz = typeof req.query.tz === 'string' ? req.query.tz : undefined;
  res.json(await service.getToday(currentUser(req).id, tz));
}

export async function analyticsHandler(req: Request, res: Response) {
  const { range } = parsedQuery<AnalyticsQuery>(res);
  const tz = typeof req.query.tz === 'string' ? req.query.tz : undefined;
  res.json(await getAnalytics(currentUser(req).id, range as RangeKey, tz));
}

export function vocabularyHandler(_req: Request, res: Response) {
  res.json({
    emotions: EMOTIONS,
    emotionGroups: EMOTION_GROUPS,
    factors: FACTORS,
    moodLabels: MOOD_LABELS,
  });
}
