import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/hooks';
import { PageHeader } from '@/components/layout/AppShell';
import { CheckInSheet } from '@/components/mood/CheckInSheet';
import { MoodCard, MoodDot } from '@/components/mood/MoodCard';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useGetAnalyticsQuery, useGetTodayQuery } from '@/features/moods/moodApi';
import { errorMessage } from '@/lib/api';
import { greeting, pluralise } from '@/lib/format';
import { describeMood, moodColorContinuous } from '@/lib/mood';

export function TodayPage() {
  const { user } = useAuth();
  const [checkInOpen, setCheckInOpen] = useState(false);

  const today = useGetTodayQuery();
  const analytics = useGetAnalyticsQuery('7d');

  const firstName = user?.name.split(' ')[0] ?? '';
  const entries = today.data?.entries ?? [];

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        subtitle={
          today.isLoading
            ? undefined
            : entries.length > 0
              ? `${pluralise(entries.length, 'check-in')} today. You can add another whenever something shifts.`
              : 'Nothing logged today yet. It takes about ten seconds.'
        }
      />

      {today.isError ? (
        <ErrorState message={errorMessage(today.error)} onRetry={() => void today.refetch()} />
      ) : null}

      <section className="animate-rise">
        {today.isLoading ? (
          <Skeleton className="h-40 rounded-[var(--radius-card)]" />
        ) : (
          <HeroCard
            average={today.data?.average ?? null}
            entryCount={entries.length}
            onCheckIn={() => setCheckInOpen(true)}
          />
        )}
      </section>

      <section className="mt-8">
        <SectionTitle
          action={
            entries.length > 0 ? (
              <Link
                to="/timeline"
                className="inline-flex items-center gap-0.5 text-[0.75rem] font-medium text-ink-faint transition-colors hover:text-ink"
              >
                All entries
                <ArrowRight className="size-3.5" />
              </Link>
            ) : null
          }
        >
          Today
        </SectionTitle>

        {today.isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-24 rounded-[var(--radius-card)]" />
            <Skeleton className="h-20 rounded-[var(--radius-card)]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="The day is still blank"
              body="Check in whenever you notice something — a lift, a dip, or nothing much at all. Neutral is data too."
              action={<Button onClick={() => setCheckInOpen(true)}>Check in now</Button>}
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <MoodCard key={entry.id} entry={entry} className="animate-rise" />
            ))}
          </div>
        )}
      </section>

      {analytics.data && analytics.data.insights.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Worth noticing</SectionTitle>
          <Link
            to="/insights"
            className="card group flex items-start gap-3 p-4 transition-shadow duration-300 hover:shadow-lift"
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
              <Lightbulb className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] font-semibold tracking-tight">
                {analytics.data.insights[0]!.title}
              </span>
              <span className="mt-1 block text-pretty text-[0.8125rem] leading-relaxed text-ink-soft">
                {analytics.data.insights[0]!.body}
              </span>
            </span>
            <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </section>
      ) : null}

      <CheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </>
  );
}

function HeroCard({
  average,
  entryCount,
  onCheckIn,
}: {
  average: { pleasantness: number; energy: number } | null;
  entryCount: number;
  onCheckIn: () => void;
}) {
  if (!average) {
    return (
      <div className="card relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-25 blur-2xl"
          style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }}
        />
        <h2 className="relative text-[1.25rem] font-semibold tracking-tight">
          How are you right now?
        </h2>
        <p className="relative mt-1.5 max-w-sm text-pretty text-[0.875rem] leading-relaxed text-ink-soft">
          One point on a pad, and a word if you have one. That is the whole ritual.
        </p>
        <Button size="lg" className="relative mt-5" onClick={onCheckIn}>
          Check in
        </Button>
      </div>
    );
  }

  const colour = moodColorContinuous(average.pleasantness);

  return (
    <div className="card relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-30 blur-2xl"
        style={{ background: `radial-gradient(circle, ${colour} 0%, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-4">
        <MoodDot pleasantness={average.pleasantness} energy={average.energy} size={56} />
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
            Today so far
          </p>
          <h2 className="mt-1 text-[1.25rem] font-semibold leading-tight tracking-tight">
            {describeMood(average.pleasantness, average.energy)}
          </h2>
          <p className="mt-0.5 text-[0.75rem] text-ink-faint">
            Averaged over {pluralise(entryCount, 'check-in')}
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        className="relative mt-5 w-full sm:w-auto"
        onClick={onCheckIn}
      >
        Add another check-in
      </Button>
    </div>
  );
}
