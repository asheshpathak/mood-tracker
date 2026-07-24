import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { moodColorContinuous, moodInkColor, moodLabel } from '@/lib/mood';
import type { Analytics, Insight } from '@/lib/types';

/**
 * The lede for the page.
 *
 * This replaced four equally sized cards, which was the problem: it gave four
 * unequal facts the same weight. Average mood is the finding. Check-ins, streak
 * and coverage all answer a quieter second question — how much of this window is
 * actually you, and therefore how much the finding is worth. So the mood reads
 * as a headline and the rest as a footing beneath it.
 *
 * The rule between the two doubles as the coverage meter: it fills to the share
 * of days logged, so the line separating the headline from its evidence *is*
 * that evidence. Coverage stays written out as a percentage in the row below —
 * the bar reinforces the number, it never carries it alone.
 */
export function SummaryLede({
  summary,
  streak,
}: {
  summary: Analytics['summary'];
  streak: Analytics['streak'];
}) {
  const { avgPleasantness, coverage, daysLogged, entries, windowDays } = summary;
  const perDay = daysLogged > 0 ? (entries / daysLogged).toFixed(1) : null;

  return (
    <section aria-label="Summary">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
        Average mood
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className="text-[2.5rem] font-semibold leading-none tracking-[-0.035em] sm:text-[3rem]"
          style={{ color: moodInkColor(avgPleasantness) }}
        >
          {moodLabel(avgPleasantness)}
        </h2>
        <DeltaBadge delta={summary.deltaPleasantness} />
      </div>

      <div
        className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${coverage}% of the last ${windowDays} days have a check-in`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease-calm)]"
          style={{
            // A hair of width even at 0% so the meter never reads as a rendering
            // fault on an empty window.
            width: `${Math.max(coverage, 1.5)}%`,
            backgroundColor: moodColorContinuous(avgPleasantness),
          }}
        />
      </div>

      <dl className="mt-3.5 grid grid-cols-3 divide-x divide-line">
        <Figure
          label="Check-ins"
          value={entries}
          detail={perDay ? `${perDay} a day` : 'none yet'}
        />
        <Figure
          label="Streak"
          value={`${streak.current}d`}
          detail={streak.longest > 0 ? `best ${streak.longest}d` : 'start today'}
        />
        <Figure
          label="Logged"
          value={`${coverage}%`}
          detail={`${daysLogged} of ${windowDays} days`}
        />
      </dl>
    </section>
  );
}

function Figure({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1.5 text-[1.375rem] font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </dd>
      <dd className="mt-1 text-[0.75rem] text-ink-faint">{detail}</dd>
    </div>
  );
}

export function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-[0.75rem] text-ink-faint">No prior period</span>;

  const flat = Math.abs(delta) < 0.05;
  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = flat ? 'text-ink-faint' : delta > 0 ? 'text-positive' : 'text-caution';

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[0.75rem] font-medium', tone)}>
      <Icon className="size-3.5" strokeWidth={2.4} />
      {flat ? 'Steady' : `${delta > 0 ? '+' : ''}${Math.round(delta * 50)}%`}
      <span className="font-normal text-ink-faint"> vs before</span>
    </span>
  );
}

const TONE_STYLES: Record<Insight['tone'], string> = {
  positive: 'border-positive/20 bg-positive/6',
  neutral: 'border-line bg-surface',
  attention: 'border-caution/24 bg-caution/6',
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article
      className={cn(
        'rounded-[var(--radius-card)] border p-4 shadow-soft',
        TONE_STYLES[insight.tone],
      )}
    >
      <h3 className="text-[0.9375rem] font-semibold tracking-tight">{insight.title}</h3>
      <p className="mt-1.5 text-pretty text-[0.8125rem] leading-relaxed text-ink-soft">
        {insight.body}
      </p>
    </article>
  );
}
