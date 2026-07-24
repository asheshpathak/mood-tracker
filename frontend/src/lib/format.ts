import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function timeOfDay(iso: string): string {
  return format(parseISO(iso), 'h:mm a').toLowerCase();
}

/** "Today", "Yesterday", "Tue 14 Mar" — the label above a group of entries. */
export function dayHeading(iso: string): string {
  const date = parseISO(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (Math.abs(differenceInCalendarDays(date, new Date())) < 7) return format(date, 'EEEE');
  return isThisYear(date) ? format(date, 'EEE d MMM') : format(date, 'd MMM yyyy');
}

export function relativeTime(iso: string): string {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
}

export function fullTimestamp(iso: string): string {
  return format(parseISO(iso), "EEEE d MMMM, h:mm a");
}

/** Greeting keyed to the clock — the first line you see on the home screen. */
export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Winding down';
}

export function chartDateLabel(localDate: string, range: string): string {
  const date = parseISO(localDate);
  if (range === '7d') return format(date, 'EEE');
  if (range === '30d') return format(date, 'd MMM');
  return format(date, 'd MMM');
}

export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

export function toLocalDateInputValue(iso: string): string {
  const date = parseISO(iso);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
