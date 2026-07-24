import { Types, type FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { dayjs, localStamp, safeTimezone } from '../../utils/time.js';
import { User } from '../users/user.model.js';
import { toMoodScore } from './mood.constants.js';
import { Mood, type MoodAttrs, type MoodDocument } from './mood.model.js';
import type { CreateMoodInput, ListMoodsQuery, UpdateMoodInput } from './mood.schemas.js';

export async function resolveTimezone(userId: string, override?: string): Promise<string> {
  if (override) return safeTimezone(override);
  const user = await User.findById(userId).select('timezone').lean();
  return safeTimezone(user?.timezone);
}

export async function createMood(userId: string, input: CreateMoodInput): Promise<MoodDocument> {
  const tz = await resolveTimezone(userId, input.timezone);
  const recordedAt = input.recordedAt ?? new Date();

  if (recordedAt.getTime() > Date.now() + 60_000) {
    throw ApiError.badRequest('You cannot log a moment in the future');
  }

  return Mood.create({
    user: new Types.ObjectId(userId),
    pleasantness: input.pleasantness,
    energy: input.energy,
    moodScore: toMoodScore(input.pleasantness),
    emotions: dedupe(input.emotions),
    factors: dedupe(input.factors),
    note: input.note,
    recordedAt,
    timezone: tz,
    ...localStamp(recordedAt, tz),
  });
}

export async function listMoods(userId: string, query: ListMoodsQuery) {
  const filter: FilterQuery<MoodAttrs> = { user: new Types.ObjectId(userId) };

  if (query.from || query.to) {
    filter.localDate = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }
  if (query.emotion) filter.emotions = query.emotion;
  if (query.factor) filter.factors = query.factor;
  if (query.minScore || query.maxScore) {
    filter.moodScore = {
      ...(query.minScore ? { $gte: query.minScore } : {}),
      ...(query.maxScore ? { $lte: query.maxScore } : {}),
    };
  }
  if (query.search) filter.note = { $regex: escapeRegex(query.search), $options: 'i' };
  if (query.cursor) filter.recordedAt = { $lt: new Date(query.cursor) };

  const items = await Mood.find(filter)
    .sort({ recordedAt: -1 })
    .limit(query.limit + 1)
    .exec();

  const hasMore = items.length > query.limit;
  const page = hasMore ? items.slice(0, query.limit) : items;

  return {
    items: page.map((m) => m.toJSON()),
    nextCursor: hasMore ? page.at(-1)?.recordedAt.toISOString() ?? null : null,
    hasMore,
  };
}

export async function getMood(userId: string, id: string): Promise<MoodDocument> {
  const mood = await Mood.findOne({ _id: id, user: new Types.ObjectId(userId) });
  if (!mood) throw ApiError.notFound('That entry no longer exists');
  return mood;
}

export async function updateMood(
  userId: string,
  id: string,
  input: UpdateMoodInput,
): Promise<MoodDocument> {
  const mood = await getMood(userId, id);

  if (input.pleasantness !== undefined) {
    mood.pleasantness = input.pleasantness;
    mood.moodScore = toMoodScore(input.pleasantness);
  }
  if (input.energy !== undefined) mood.energy = input.energy;
  if (input.emotions !== undefined) mood.set('emotions', dedupe(input.emotions));
  if (input.factors !== undefined) mood.set('factors', dedupe(input.factors));
  if (input.note !== undefined) mood.note = input.note;

  if (input.recordedAt !== undefined || input.timezone !== undefined) {
    const recordedAt = input.recordedAt ?? mood.recordedAt;
    if (recordedAt.getTime() > Date.now() + 60_000) {
      throw ApiError.badRequest('You cannot log a moment in the future');
    }
    const tz = safeTimezone(input.timezone ?? mood.timezone);
    mood.recordedAt = recordedAt;
    mood.timezone = tz;
    const stamp = localStamp(recordedAt, tz);
    mood.localDate = stamp.localDate;
    mood.localHour = stamp.localHour;
    mood.localWeekday = stamp.localWeekday;
  }

  await mood.save();
  return mood;
}

export async function deleteMood(userId: string, id: string): Promise<void> {
  const result = await Mood.deleteOne({ _id: id, user: new Types.ObjectId(userId) });
  if (result.deletedCount === 0) throw ApiError.notFound('That entry no longer exists');
}

/** Everything the home screen needs in one round trip. */
export async function getToday(userId: string, tzOverride?: string) {
  const tz = await resolveTimezone(userId, tzOverride);
  const today = dayjs().tz(tz).format('YYYY-MM-DD');

  const [entries, lastEntry] = await Promise.all([
    Mood.find({ user: new Types.ObjectId(userId), localDate: today }).sort({ recordedAt: -1 }),
    Mood.findOne({ user: new Types.ObjectId(userId) }).sort({ recordedAt: -1 }),
  ]);

  const average =
    entries.length > 0
      ? {
          pleasantness: mean(entries.map((e) => e.pleasantness)),
          energy: mean(entries.map((e) => e.energy)),
        }
      : null;

  return {
    date: today,
    timezone: tz,
    entries: entries.map((e) => e.toJSON()),
    average,
    lastEntry: lastEntry ? lastEntry.toJSON() : null,
  };
}

function dedupe(values: string[] | undefined): string[] {
  return [...new Set(values ?? [])];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
