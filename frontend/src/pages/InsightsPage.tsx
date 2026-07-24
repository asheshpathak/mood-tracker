import { useState } from 'react';
import { PageHeader } from '@/components/layout/AppShell';
import {
  DistributionBars,
  EmotionCloud,
  FactorImpact,
  TimeOfDayChart,
  WeekdayStrip,
} from '@/components/insights/Charts';
import { TrendChart } from '@/components/insights/TrendChart';
import { DeltaBadge, InsightCard, StatTile, StreakBadge } from '@/components/insights/Stats';
import { Card, CardHeader, SectionTitle } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useGetAnalyticsQuery } from '@/features/moods/moodApi';
import { errorMessage } from '@/lib/api';
import { moodColorContinuous, moodLabel } from '@/lib/mood';
import type { RangeKey } from '@/lib/types';

const RANGES = [
  { value: '7d' as const, label: '7d' },
  { value: '30d' as const, label: '30d' },
  { value: '90d' as const, label: '90d' },
  { value: 'all' as const, label: 'All' },
];

const METRICS = [
  { value: 'mood' as const, label: 'Mood' },
  { value: 'energy' as const, label: 'Energy' },
];

export function InsightsPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [metric, setMetric] = useState<'mood' | 'energy'>('mood');
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAnalyticsQuery(range);

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="Patterns only mean something once there is enough of you in here. Read them as questions, not verdicts."
      />

      <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-5 mb-5 px-5 py-2 glass sm:-mx-6 sm:px-6">
        <Segmented options={RANGES} value={range} onChange={setRange} />
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <LoadingSkeleton />
      ) : data.summary.entries === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[0.9375rem] font-semibold">Nothing logged in this window</p>
          <p className="mx-auto mt-1.5 max-w-sm text-pretty text-[0.8125rem] leading-relaxed text-ink-faint">
            Try a wider range, or check in a few times — most patterns need about a week before
            they say anything honest.
          </p>
        </Card>
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Average mood"
              value={moodLabel(data.summary.avgPleasantness)}
              accent={moodColorContinuous(data.summary.avgPleasantness)}
              detail={<DeltaBadge delta={data.summary.deltaPleasantness} />}
            />
            <StatTile
              label="Check-ins"
              value={data.summary.entries}
              detail={`across ${data.summary.daysLogged} days`}
            />
            <StatTile
              label="Streak"
              value={`${data.streak.current}d`}
              detail={<StreakBadge current={data.streak.current} longest={data.streak.longest} />}
            />
            <StatTile
              label="Coverage"
              value={`${data.summary.coverage}%`}
              detail={`of the last ${data.summary.windowDays} days`}
            />
          </div>

          {data.insights.length > 0 ? (
            <section className="mt-8">
              <SectionTitle>What stands out</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <Card className="p-5">
              <CardHeader
                title="Over time"
                subtitle="Daily average. Gaps are days without a check-in — they are left blank rather than guessed."
                action={
                  <Segmented size="sm" options={METRICS} value={metric} onChange={setMetric} />
                }
                className="mb-4"
              />
              <TrendChart data={data.trend} range={range} metric={metric} />
            </Card>
          </section>

          {/* `items-start` keeps the short cards from stretching to match a tall
              neighbour and leaving a pane of empty white. */}
          <section className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader
                title="How the days split"
                subtitle="Share of check-ins at each step"
                className="mb-4"
              />
              <DistributionBars data={data.distribution} />
            </Card>

            <Card className="p-5">
              <CardHeader
                title="The shape of your day"
                subtitle="Average mood by time of day, above and below neutral"
                className="mb-4"
              />
              <TimeOfDayChart data={data.byHour} />
            </Card>

            <Card className="p-5">
              <CardHeader
                title="Across the week"
                subtitle="Colour is average mood, the number is how often you checked in"
                className="mb-4"
              />
              <WeekdayStrip data={data.byWeekday} />
            </Card>

            <Card className="p-5">
              <CardHeader
                title="What moves you"
                subtitle="How far each influence sits from your average — association, not cause"
                className="mb-4"
              />
              <FactorImpact data={data.factorImpact} />
            </Card>

            <Card className="p-5 lg:col-span-2">
              <CardHeader
                title="Words you reached for"
                subtitle="Sized by how often, coloured by how they felt"
                className="mb-4"
              />
              <EmotionCloud data={data.topEmotions} />
            </Card>
          </section>
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[5.5rem] rounded-[var(--radius-card)]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[var(--radius-card)]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-[var(--radius-card)]" />
        <Skeleton className="h-56 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
