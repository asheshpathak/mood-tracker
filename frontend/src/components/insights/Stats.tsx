import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Flame, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Insight } from '@/lib/types';

export function StatTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </p>
      <p
        className="mt-1.5 text-[1.5rem] font-semibold leading-none tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {detail ? <p className="mt-1.5 text-[0.75rem] text-ink-faint">{detail}</p> : null}
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

export function StreakBadge({ current, longest }: { current: number; longest: number }) {
  if (current === 0) {
    return <p className="text-[0.75rem] text-ink-faint">Log today to start a streak</p>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[0.75rem] text-ink-faint">
      <Flame className="size-3.5 text-caution" strokeWidth={2.2} />
      Best {longest} {longest === 1 ? 'day' : 'days'}
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
