import { MOOD_COLORS, humanise, moodColorContinuous, moodInkColor, moodLabel } from '@/lib/mood';
import { hourLabel } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Analytics } from '@/lib/types';

/**
 * How the five mood steps are shared out. Every bar carries its own count and
 * percentage — the warm steps sit under 3:1 against white, so the labels are
 * doing the accessibility work, not the fill.
 */
export function DistributionBars({ data }: { data: Analytics['distribution'] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);

  if (total === 0) return <NotEnough />;

  return (
    <ul className="space-y-2.5">
      {[...data].reverse().map((slice) => (
        <li key={slice.score} className="flex items-center gap-3">
          <span className="w-[6.5rem] shrink-0 text-[0.75rem] text-ink-soft">{slice.label}</span>
          <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-sunk">
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[var(--ease-calm)]"
              style={{
                width: `${Math.max((slice.count / max) * 100, slice.count > 0 ? 4 : 0)}%`,
                backgroundColor: MOOD_COLORS[slice.score],
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-[0.75rem] tabular-nums text-ink-faint">
            {slice.count > 0 ? `${slice.percentage}%` : '—'}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Average mood per three-hour block — where the day actually lifts and dips. */
export function TimeOfDayChart({ data }: { data: Analytics['byHour'] }) {
  const blocks = [0, 3, 6, 9, 12, 15, 18, 21].map((start) => {
    const hours = data.filter((h) => h.hour >= start && h.hour < start + 3 && h.count > 0);
    const count = hours.reduce((sum, h) => sum + h.count, 0);
    const value =
      count > 0
        ? hours.reduce((sum, h) => sum + (h.avgPleasantness ?? 0) * h.count, 0) / count
        : null;
    return { start, label: hourLabel(start), value, count };
  });

  if (blocks.every((b) => b.count === 0)) return <NotEnough />;

  // Day-to-day mood swings are small in absolute terms, so the bars are scaled
  // to the widest swing in view. The axis is relative — hence no numbers on it.
  const scale = Math.max(...blocks.map((b) => Math.abs(b.value ?? 0)), 0.15);

  return (
    <div className="flex items-end gap-1.5" role="img" aria-label="Average mood by time of day">
      {blocks.map((block) => {
        // Bars grow up or down from a shared midline, so polarity is readable at a glance.
        const magnitude = block.value === null ? 0 : Math.abs(block.value) / scale;
        const height = Math.max(magnitude * 100, block.count > 0 ? 10 : 0);
        const positive = (block.value ?? 0) >= 0;

        return (
          <div key={block.start} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-24 w-full flex-col justify-center">
              <div className="flex h-1/2 items-end">
                {positive && block.count > 0 ? (
                  <span
                    className="w-full rounded-t-[4px]"
                    style={{
                      height: `${height}%`,
                      backgroundColor: moodColorContinuous(block.value ?? 0),
                    }}
                  />
                ) : null}
              </div>
              <span className="h-px w-full bg-line-strong" />
              <div className="flex h-1/2 items-start">
                {!positive && block.count > 0 ? (
                  <span
                    className="w-full rounded-b-[4px]"
                    style={{
                      height: `${height}%`,
                      backgroundColor: moodColorContinuous(block.value ?? 0),
                    }}
                  />
                ) : null}
              </div>
            </div>
            <span className="text-[0.625rem] tabular-nums text-ink-faint">{block.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Weekday cells, filled with the mood colour and labelled with the day. */
export function WeekdayStrip({ data }: { data: Analytics['byWeekday'] }) {
  // Monday-first reads better for "how does my week go".
  const ordered = [...data.slice(1), data[0]!];

  if (ordered.every((d) => d.count === 0)) return <NotEnough />;

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ordered.map((day) => (
        <div key={day.weekday} className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-xl',
              day.count === 0 && 'border border-dashed border-line',
            )}
            style={
              day.count > 0
                ? { backgroundColor: `${moodColorContinuous(day.avgPleasantness ?? 0)}42` }
                : undefined
            }
            title={
              day.count > 0
                ? `${day.label}: ${moodLabel(day.avgPleasantness ?? 0)}, ${day.count} check-ins`
                : `${day.label}: nothing logged`
            }
          >
            {day.count > 0 ? (
              <>
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: moodColorContinuous(day.avgPleasantness ?? 0) }}
                />
                <span
                  className="text-[0.6875rem] font-semibold tabular-nums"
                  style={{ color: moodInkColor(day.avgPleasantness ?? 0) }}
                >
                  {day.count}
                </span>
              </>
            ) : (
              <span className="text-[0.6875rem] text-ink-faint">·</span>
            )}
          </div>
          <span className="text-[0.625rem] text-ink-faint">{day.short}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Diverging bars around a zero baseline: how far each influence shifts mood
 * away from the period average. Cool arm left, warm arm right, grey midline.
 */
export function FactorImpact({ data }: { data: Analytics['factorImpact'] }) {
  const shown = [...data]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 8)
    .sort((a, b) => b.delta - a.delta);

  if (shown.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-[0.8125rem] text-ink-faint">
        Tag a few more check-ins with what was going on, and the influences will show up here.
      </p>
    );
  }

  const scale = Math.max(...shown.map((f) => Math.abs(f.delta)), 0.2);

  return (
    <ul className="space-y-2">
      {shown.map((factor) => {
        const width = (Math.abs(factor.delta) / scale) * 50;
        const positive = factor.delta >= 0;

        return (
          <li key={factor.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-[0.75rem] text-ink-soft">
              {humanise(factor.name)}
            </span>

            <span className="relative h-3.5 flex-1">
              <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
              <span
                className="absolute inset-y-0 rounded-[4px] transition-[width] duration-500"
                style={{
                  width: `${width}%`,
                  [positive ? 'left' : 'right']: '50%',
                  backgroundColor: positive ? MOOD_COLORS[4] : MOOD_COLORS[2],
                }}
              />
            </span>

            <span className="w-8 shrink-0 text-right text-[0.6875rem] tabular-nums text-ink-faint">
              {factor.count}×
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function EmotionCloud({ data }: { data: Analytics['topEmotions'] }) {
  if (data.length === 0) return <NotEnough />;
  const max = Math.max(...data.map((e) => e.count), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {data.map((emotion) => {
        const weight = emotion.count / max;
        const colour = moodColorContinuous(emotion.avgPleasantness);
        return (
          <span
            key={emotion.name}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium"
            style={{
              backgroundColor: `${colour}${weight > 0.6 ? '2e' : '1a'}`,
              color: moodInkColor(emotion.avgPleasantness),
            }}
          >
            {humanise(emotion.name)}
            <span className="text-[0.6875rem] tabular-nums opacity-60">{emotion.count}</span>
          </span>
        );
      })}
    </div>
  );
}

function NotEnough() {
  return (
    <p className="px-1 py-6 text-center text-[0.8125rem] text-ink-faint">
      Not enough check-ins in this period yet.
    </p>
  );
}
