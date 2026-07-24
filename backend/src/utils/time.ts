import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export { dayjs };

export function safeTimezone(tz: string | undefined | null): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export interface LocalStamp {
  localDate: string; // YYYY-MM-DD in the user's timezone
  localHour: number; // 0–23
  localWeekday: number; // 0 = Sunday … 6 = Saturday
}

/** Denormalised local-time fields, so analytics never has to do timezone math in Mongo. */
export function localStamp(date: Date, tz: string): LocalStamp {
  const zoned = dayjs(date).tz(safeTimezone(tz));
  return {
    localDate: zoned.format('YYYY-MM-DD'),
    localHour: zoned.hour(),
    localWeekday: zoned.day(),
  };
}

export type RangeKey = '7d' | '30d' | '90d' | '365d' | 'all';

export function rangeToStart(range: RangeKey, tz: string, now = new Date()): Date | null {
  if (range === 'all') return null;
  const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[range];
  return dayjs(now)
    .tz(safeTimezone(tz))
    .startOf('day')
    .subtract(days - 1, 'day')
    .toDate();
}

export function rangeDays(range: RangeKey): number | null {
  if (range === 'all') return null;
  return { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[range];
}

/** Inclusive list of YYYY-MM-DD strings, used to pad chart series with empty days. */
export function eachLocalDate(start: string, end: string): string[] {
  const out: string[] = [];
  let cursor = dayjs(start);
  const last = dayjs(end);
  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    out.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return out;
}
