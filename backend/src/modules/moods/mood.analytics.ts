import { Types } from 'mongoose';
import { dayjs, eachLocalDate, rangeDays, type RangeKey } from '../../utils/time.js';
import { Mood } from './mood.model.js';
import { MOOD_LABELS } from './mood.constants.js';
import { resolveTimezone } from './mood.service.js';

export interface TrendPoint {
  date: string;
  avgPleasantness: number | null;
  avgEnergy: number | null;
  count: number;
}

export interface NamedStat {
  name: string;
  count: number;
  avgPleasantness: number;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: 'positive' | 'neutral' | 'attention';
}

export interface DistributionSlice {
  score: number;
  label: string;
  count: number;
  percentage: number;
}

export interface HourStat {
  hour: number;
  avgPleasantness: number | null;
  avgEnergy: number | null;
  count: number;
}

export interface WeekdayStat {
  weekday: number;
  label: string;
  short: string;
  avgPleasantness: number | null;
  avgEnergy: number | null;
  count: number;
}

export interface FactorStat extends NamedStat {
  avgEnergy: number;
  /** How far this influence shifts mood relative to the period average. */
  delta: number;
}

export interface StreakStat {
  current: number;
  longest: number;
  lastLoggedOn: string | null;
}

export interface AnalyticsSummary {
  entries: number;
  daysLogged: number;
  windowDays: number;
  coverage: number;
  avgPleasantness: number;
  avgEnergy: number;
  avgMoodScore: number;
  deltaPleasantness: number | null;
}

export interface AnalyticsResult {
  range: RangeKey;
  from: string;
  to: string;
  timezone: string;
  summary: AnalyticsSummary;
  streak: StreakStat;
  trend: TrendPoint[];
  distribution: DistributionSlice[];
  byHour: HourStat[];
  byWeekday: WeekdayStat[];
  topEmotions: NamedStat[];
  factorImpact: FactorStat[];
  bestDay: TrendPoint | null;
  hardestDay: TrendPoint | null;
}

export interface AnalyticsResponse extends AnalyticsResult {
  insights: Insight[];
}

const round = (n: number, digits = 2) => Number(n.toFixed(digits));
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getAnalytics(
  userId: string,
  range: RangeKey,
  tzOverride?: string,
): Promise<AnalyticsResponse> {
  const tz = await resolveTimezone(userId, tzOverride);
  const user = new Types.ObjectId(userId);
  const today = dayjs().tz(tz);
  const days = rangeDays(range);

  const from = days ? today.startOf('day').subtract(days - 1, 'day') : null;
  const fromDate = from ? from.format('YYYY-MM-DD') : null;
  const toDate = today.format('YYYY-MM-DD');

  // Previous window of equal length, for period-over-period comparison.
  const prevFrom = days ? from!.subtract(days, 'day').format('YYYY-MM-DD') : null;
  const prevTo = days ? from!.subtract(1, 'day').format('YYYY-MM-DD') : null;

  const match = {
    user,
    ...(fromDate ? { localDate: { $gte: fromDate, $lte: toDate } } : {}),
  };

  const [facet] = await Mood.aggregate<AggregateShape>([
    { $match: match },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              entries: { $sum: 1 },
              avgPleasantness: { $avg: '$pleasantness' },
              avgEnergy: { $avg: '$energy' },
              avgMoodScore: { $avg: '$moodScore' },
              days: { $addToSet: '$localDate' },
            },
          },
          { $project: { entries: 1, avgPleasantness: 1, avgEnergy: 1, avgMoodScore: 1, daysLogged: { $size: '$days' } } },
        ],
        byDate: [
          {
            $group: {
              _id: '$localDate',
              avgPleasantness: { $avg: '$pleasantness' },
              avgEnergy: { $avg: '$energy' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        distribution: [{ $group: { _id: '$moodScore', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        byHour: [
          {
            $group: {
              _id: '$localHour',
              avgPleasantness: { $avg: '$pleasantness' },
              avgEnergy: { $avg: '$energy' },
              count: { $sum: 1 },
            },
          },
        ],
        byWeekday: [
          {
            $group: {
              _id: '$localWeekday',
              avgPleasantness: { $avg: '$pleasantness' },
              avgEnergy: { $avg: '$energy' },
              count: { $sum: 1 },
            },
          },
        ],
        emotions: [
          { $unwind: '$emotions' },
          {
            $group: {
              _id: '$emotions',
              count: { $sum: 1 },
              avgPleasantness: { $avg: '$pleasantness' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 12 },
        ],
        factors: [
          { $unwind: '$factors' },
          {
            $group: {
              _id: '$factors',
              count: { $sum: 1 },
              avgPleasantness: { $avg: '$pleasantness' },
              avgEnergy: { $avg: '$energy' },
            },
          },
          { $match: { count: { $gte: 2 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ],
      },
    },
  ]);

  const summaryRow = facet?.summary?.[0];
  const entries = summaryRow?.entries ?? 0;
  const avgPleasantness = summaryRow?.avgPleasantness ?? 0;
  const avgEnergy = summaryRow?.avgEnergy ?? 0;

  const previous = prevFrom
    ? (
        await Mood.aggregate<{ avgPleasantness: number; entries: number }>([
          { $match: { user, localDate: { $gte: prevFrom, $lte: prevTo! } } },
          { $group: { _id: null, avgPleasantness: { $avg: '$pleasantness' }, entries: { $sum: 1 } } },
        ])
      )[0]
    : undefined;

  // Pad the trend so charts show gaps honestly instead of interpolating over them.
  const byDateMap = new Map((facet?.byDate ?? []).map((d) => [d._id, d]));
  const seriesStart = fromDate ?? (facet?.byDate?.[0]?._id ?? toDate);
  const trend: TrendPoint[] = eachLocalDate(seriesStart, toDate).map((date) => {
    const row = byDateMap.get(date);
    return {
      date,
      avgPleasantness: row ? round(row.avgPleasantness) : null,
      avgEnergy: row ? round(row.avgEnergy) : null,
      count: row?.count ?? 0,
    };
  });

  const distribution: DistributionSlice[] = [1, 2, 3, 4, 5].map((score) => {
    const row = (facet?.distribution ?? []).find((d) => d._id === score);
    return {
      score,
      label: MOOD_LABELS[score] ?? '',
      count: row?.count ?? 0,
      percentage: entries > 0 ? round(((row?.count ?? 0) / entries) * 100, 1) : 0,
    };
  });

  const byHour: HourStat[] = Array.from({ length: 24 }, (_, hour) => {
    const row = (facet?.byHour ?? []).find((d) => d._id === hour);
    return {
      hour,
      avgPleasantness: row ? round(row.avgPleasantness) : null,
      avgEnergy: row ? round(row.avgEnergy) : null,
      count: row?.count ?? 0,
    };
  });

  const byWeekday: WeekdayStat[] = Array.from({ length: 7 }, (_, weekday) => {
    const row = (facet?.byWeekday ?? []).find((d) => d._id === weekday);
    return {
      weekday,
      label: WEEKDAY_NAMES[weekday]!,
      short: WEEKDAY_NAMES[weekday]!.slice(0, 3),
      avgPleasantness: row ? round(row.avgPleasantness) : null,
      avgEnergy: row ? round(row.avgEnergy) : null,
      count: row?.count ?? 0,
    };
  });

  const topEmotions: NamedStat[] = (facet?.emotions ?? []).map((e) => ({
    name: e._id,
    count: e.count,
    avgPleasantness: round(e.avgPleasantness),
  }));

  const factorImpact: FactorStat[] = (facet?.factors ?? [])
    .map((f) => ({
      name: f._id,
      count: f.count,
      avgPleasantness: round(f.avgPleasantness),
      avgEnergy: round(f.avgEnergy),
      delta: round(f.avgPleasantness - avgPleasantness),
    }))
    .sort((a, b) => b.delta - a.delta);

  const streak = await getStreak(userId, tz);

  const bestDay = [...trend].filter((t) => t.count > 0).sort((a, b) => b.avgPleasantness! - a.avgPleasantness!)[0] ?? null;
  const hardestDay = [...trend].filter((t) => t.count > 0).sort((a, b) => a.avgPleasantness! - b.avgPleasantness!)[0] ?? null;

  const deltaPleasantness =
    previous && previous.entries > 0 ? round(avgPleasantness - previous.avgPleasantness) : null;

  const windowDays = days ?? Math.max(trend.length, 1);

  const result: AnalyticsResult = {
    range,
    from: seriesStart,
    to: toDate,
    timezone: tz,
    summary: {
      entries,
      daysLogged: summaryRow?.daysLogged ?? 0,
      windowDays,
      coverage: round(((summaryRow?.daysLogged ?? 0) / windowDays) * 100, 0),
      avgPleasantness: round(avgPleasantness),
      avgEnergy: round(avgEnergy),
      avgMoodScore: round(summaryRow?.avgMoodScore ?? 0, 1),
      deltaPleasantness,
    },
    streak,
    trend,
    distribution,
    byHour,
    byWeekday,
    topEmotions,
    factorImpact,
    bestDay,
    hardestDay,
  };

  return { ...result, insights: buildInsights(result) };
}

interface AggregateShape {
  summary: { entries: number; avgPleasantness: number; avgEnergy: number; avgMoodScore: number; daysLogged: number }[];
  byDate: { _id: string; avgPleasantness: number; avgEnergy: number; count: number }[];
  distribution: { _id: number; count: number }[];
  byHour: { _id: number; avgPleasantness: number; avgEnergy: number; count: number }[];
  byWeekday: { _id: number; avgPleasantness: number; avgEnergy: number; count: number }[];
  emotions: { _id: string; count: number; avgPleasantness: number }[];
  factors: { _id: string; count: number; avgPleasantness: number; avgEnergy: number }[];
}

export async function getStreak(userId: string, tz: string): Promise<StreakStat> {
  const rows = await Mood.aggregate<{ _id: string }>([
    { $match: { user: new Types.ObjectId(userId) } },
    { $group: { _id: '$localDate' } },
    { $sort: { _id: -1 } },
  ]);

  const dates = rows.map((r) => r._id);
  if (dates.length === 0) return { current: 0, longest: 0, lastLoggedOn: null };

  const dateSet = new Set(dates);
  const today = dayjs().tz(tz).startOf('day');

  // A streak stays alive if today is logged, or if yesterday was and today is still open.
  let current = 0;
  let cursor = dateSet.has(today.format('YYYY-MM-DD')) ? today : today.subtract(1, 'day');
  while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
    current += 1;
    cursor = cursor.subtract(1, 'day');
  }

  let longest = 0;
  let run = 0;
  const ascending = [...dates].sort();
  for (let i = 0; i < ascending.length; i += 1) {
    const prev = i > 0 ? ascending[i - 1]! : null;
    run = prev && dayjs(ascending[i]!).diff(dayjs(prev), 'day') === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest, lastLoggedOn: dates[0] ?? null };
}

/**
 * Turns the aggregates into a few plain-language observations.
 * Deliberately conservative: nothing is claimed from fewer than a handful of entries.
 */
function buildInsights(data: AnalyticsResult): Insight[] {
  const insights: Insight[] = [];
  const { summary, byHour, byWeekday, factorImpact, topEmotions, streak, distribution } = data;

  if (summary.entries < 3) {
    insights.push({
      id: 'getting-started',
      title: 'Keep going',
      body: 'A few more check-ins and patterns will start to show up here — most people see something useful after about a week.',
      tone: 'neutral',
    });
    return insights;
  }

  if (summary.deltaPleasantness !== null && Math.abs(summary.deltaPleasantness) >= 0.12) {
    const better = summary.deltaPleasantness > 0;
    insights.push({
      id: 'period-shift',
      title: better ? 'Trending brighter' : 'A heavier stretch',
      body: better
        ? `Your average mood is up ${Math.abs(Math.round(summary.deltaPleasantness * 50))}% compared with the previous period.`
        : `Your average mood is down ${Math.abs(Math.round(summary.deltaPleasantness * 50))}% compared with the previous period. Worth noticing what changed.`,
      tone: better ? 'positive' : 'attention',
    });
  }

  const ranked = byHour.filter((h) => h.count >= 2 && h.avgPleasantness !== null);
  if (ranked.length >= 3) {
    const best = [...ranked].sort((a, b) => b.avgPleasantness! - a.avgPleasantness!)[0]!;
    const worst = [...ranked].sort((a, b) => a.avgPleasantness! - b.avgPleasantness!)[0]!;
    if (best.avgPleasantness! - worst.avgPleasantness! >= 0.25) {
      insights.push({
        id: 'time-of-day',
        title: 'Your day has a shape',
        body: `You tend to feel best around ${formatHour(best.hour)} and lowest around ${formatHour(worst.hour)}.`,
        tone: 'neutral',
      });
    }
  }

  const days = byWeekday.filter((d) => d.count >= 2 && d.avgPleasantness !== null);
  if (days.length >= 4) {
    const worst = [...days].sort((a, b) => a.avgPleasantness! - b.avgPleasantness!)[0]!;
    const best = [...days].sort((a, b) => b.avgPleasantness! - a.avgPleasantness!)[0]!;
    if (best.avgPleasantness! - worst.avgPleasantness! >= 0.25) {
      insights.push({
        id: 'weekday',
        title: `${worst.label}s ask more of you`,
        body: `${worst.label} is consistently your lowest day, while ${best.label} is your highest.`,
        tone: 'neutral',
      });
    }
  }

  const lifted = factorImpact.filter((f) => f.count >= 3 && f.delta >= 0.15)[0];
  if (lifted) {
    insights.push({
      id: `factor-up-${lifted.name}`,
      title: `${humanise(lifted.name)} lifts you`,
      body: `Entries tagged “${humanise(lifted.name)}” average noticeably higher than the rest of this period.`,
      tone: 'positive',
    });
  }

  const drains = [...factorImpact].reverse().filter((f) => f.count >= 3 && f.delta <= -0.15)[0];
  if (drains) {
    insights.push({
      id: `factor-down-${drains.name}`,
      title: `${humanise(drains.name)} weighs on you`,
      body: `Entries tagged “${humanise(drains.name)}” average lower than the rest of this period. Not a verdict — just a pattern worth sitting with.`,
      tone: 'attention',
    });
  }

  const topEmotion = topEmotions[0];
  if (topEmotion && topEmotion.count >= 3) {
    insights.push({
      id: 'top-emotion',
      title: `“${humanise(topEmotion.name)}” came up most`,
      body: `You named it in ${topEmotion.count} ${topEmotion.count === 1 ? 'entry' : 'entries'} this period.`,
      tone: 'neutral',
    });
  }

  if (streak.current >= 3) {
    insights.push({
      id: 'streak',
      title: `${streak.current}-day streak`,
      body:
        streak.current >= streak.longest
          ? 'This is your longest run yet. Consistency is what makes the rest of this page trustworthy.'
          : `Your best run is ${streak.longest} days.`,
      tone: 'positive',
    });
  }

  const tough = distribution.filter((d) => d.score <= 2).reduce((a, d) => a + d.percentage, 0);
  if (tough >= 40) {
    insights.push({
      id: 'hard-period',
      title: 'This has been a hard stretch',
      body: `${Math.round(tough)}% of your check-ins landed in the unpleasant range. If that keeps up, it may be worth talking to someone you trust.`,
      tone: 'attention',
    });
  }

  return insights.slice(0, 5);
}

function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

function humanise(value: string): string {
  return value.replace(/-/g, ' ');
}
