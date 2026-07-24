import { Types, type FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { localStamp } from '../../utils/time.js';
import { resolveTimezone } from '../moods/mood.service.js';
import {
  Observation,
  type ObservationAttrs,
  type ObservationDocument,
} from './observation.model.js';
import type {
  CreateObservationInput,
  ListObservationsQuery,
  UpdateObservationInput,
} from './observation.schemas.js';

export async function createObservation(
  userId: string,
  input: CreateObservationInput,
): Promise<ObservationDocument> {
  const tz = await resolveTimezone(userId, input.timezone);
  const occurredAt = input.occurredAt ?? new Date();

  if (occurredAt.getTime() > Date.now() + 60_000) {
    throw ApiError.badRequest('You cannot record something from the future');
  }

  return Observation.create({
    user: new Types.ObjectId(userId),
    title: input.title,
    body: input.body,
    tags: dedupe(input.tags),
    mood: input.moodId ? new Types.ObjectId(input.moodId) : null,
    pinned: input.pinned,
    occurredAt,
    timezone: tz,
    ...localStamp(occurredAt, tz),
  });
}

export async function listObservations(userId: string, query: ListObservationsQuery) {
  const filter: FilterQuery<ObservationAttrs> = { user: new Types.ObjectId(userId) };

  if (query.tag) filter.tags = query.tag;
  if (query.pinned !== undefined) filter.pinned = query.pinned;
  if (query.from || query.to) {
    filter.localDate = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }
  if (query.search) {
    const rx = { $regex: escapeRegex(query.search), $options: 'i' };
    filter.$or = [{ title: rx }, { body: rx }, { tags: rx }];
  }
  if (query.cursor) filter.occurredAt = { $lt: new Date(query.cursor) };

  const items = await Observation.find(filter)
    .sort({ occurredAt: -1 })
    .limit(query.limit + 1)
    .exec();

  const hasMore = items.length > query.limit;
  const page = hasMore ? items.slice(0, query.limit) : items;

  return {
    items: page.map((o) => o.toJSON()),
    nextCursor: hasMore ? page.at(-1)?.occurredAt.toISOString() ?? null : null,
    hasMore,
  };
}

export async function getObservation(userId: string, id: string): Promise<ObservationDocument> {
  const observation = await Observation.findOne({ _id: id, user: new Types.ObjectId(userId) });
  if (!observation) throw ApiError.notFound('That observation no longer exists');
  return observation;
}

export async function updateObservation(
  userId: string,
  id: string,
  input: UpdateObservationInput,
): Promise<ObservationDocument> {
  const observation = await getObservation(userId, id);

  if (input.title !== undefined) observation.title = input.title;
  if (input.body !== undefined) observation.body = input.body;
  if (input.tags !== undefined) observation.set('tags', dedupe(input.tags));
  if (input.pinned !== undefined) observation.pinned = input.pinned;
  if (input.moodId !== undefined) {
    observation.set('mood', input.moodId ? new Types.ObjectId(input.moodId) : null);
  }

  if (input.occurredAt !== undefined || input.timezone !== undefined) {
    const occurredAt = input.occurredAt ?? observation.occurredAt;
    if (occurredAt.getTime() > Date.now() + 60_000) {
      throw ApiError.badRequest('You cannot record something from the future');
    }
    const tz = input.timezone ?? observation.timezone ?? 'UTC';
    observation.occurredAt = occurredAt;
    observation.timezone = tz;
    const stamp = localStamp(occurredAt, tz);
    observation.localDate = stamp.localDate;
    observation.localHour = stamp.localHour;
  }

  await observation.save();
  return observation;
}

export async function deleteObservation(userId: string, id: string): Promise<void> {
  const result = await Observation.deleteOne({ _id: id, user: new Types.ObjectId(userId) });
  if (result.deletedCount === 0) throw ApiError.notFound('That observation no longer exists');
}

export async function togglePin(userId: string, id: string): Promise<ObservationDocument> {
  const observation = await getObservation(userId, id);
  observation.pinned = !observation.pinned;
  await observation.save();
  return observation;
}

export async function listTags(userId: string) {
  const rows = await Observation.aggregate<{ _id: string; count: number }>([
    { $match: { user: new Types.ObjectId(userId) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 50 },
  ]);
  return rows.map((r) => ({ name: r._id, count: r.count }));
}

export async function getStats(userId: string) {
  const user = new Types.ObjectId(userId);
  const [total, pinned, latest] = await Promise.all([
    Observation.countDocuments({ user }),
    Observation.countDocuments({ user, pinned: true }),
    Observation.findOne({ user }).sort({ occurredAt: -1 }).select('occurredAt').lean(),
  ]);
  return { total, pinned, lastRecordedAt: latest?.occurredAt?.toISOString() ?? null };
}

function dedupe(values: string[] | undefined): string[] {
  return [...new Set(values ?? [])];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
