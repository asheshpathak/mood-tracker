import { useId, useMemo } from 'react';
import {
  Area,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartDateLabel } from '@/lib/format';
import { MOOD_COLORS, energyLabel, moodLabel } from '@/lib/mood';
import type { RangeKey, TrendPoint } from '@/lib/types';

type Metric = 'mood' | 'energy';

/**
 * One measure at a time, never two y-scales on one frame. The stroke runs
 * through the mood ramp vertically, so colour restates the value the height
 * already shows — no legend needed for a single series.
 */
export function TrendChart({
  data,
  range,
  metric,
}: {
  data: TrendPoint[];
  range: RangeKey;
  metric: Metric;
}) {
  const gradientId = useId().replace(/:/g, '');

  const series = useMemo(
    () =>
      data.map((point) => ({
        date: point.date,
        label: chartDateLabel(point.date, range),
        value: metric === 'mood' ? point.avgPleasantness : point.avgEnergy,
        count: point.count,
      })),
    [data, range, metric],
  );

  const logged = series.filter((d) => d.value !== null);

  if (logged.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center px-6 text-center text-[0.8125rem] text-ink-faint">
        Two days of check-ins and this chart starts drawing itself.
      </div>
    );
  }

  // Show at most six ticks so labels never collide on a phone.
  const tickStep = Math.max(1, Math.ceil(series.length / 6));
  const ticks = series.filter((_, i) => i % tickStep === 0).map((d) => d.label);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`stroke-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOOD_COLORS[5]} />
              <stop offset="30%" stopColor={MOOD_COLORS[4]} />
              <stop offset="50%" stopColor={MOOD_COLORS[3]} />
              <stop offset="70%" stopColor={MOOD_COLORS[2]} />
              <stop offset="100%" stopColor={MOOD_COLORS[1]} />
            </linearGradient>
            <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOOD_COLORS[4]} stopOpacity={0.16} />
              <stop offset="50%" stopColor={MOOD_COLORS[3]} stopOpacity={0.06} />
              <stop offset="100%" stopColor={MOOD_COLORS[1]} stopOpacity={0.14} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
            dy={6}
          />
          <YAxis
            domain={[-1, 1]}
            ticks={[-1, 0, 1]}
            tickLine={false}
            axisLine={false}
            width={74}
            tick={{ fill: 'var(--color-ink-faint)', fontSize: 10 }}
            tickFormatter={(v: number) =>
              metric === 'mood'
                ? v > 0
                  ? 'Pleasant'
                  : v < 0
                    ? 'Unpleasant'
                    : 'Neutral'
                : v > 0
                  ? 'High'
                  : v < 0
                    ? 'Low'
                    : 'Steady'
            }
          />

          <ReferenceLine y={0} stroke="var(--color-line-strong)" strokeDasharray="3 4" />

          <Tooltip
            cursor={{ stroke: 'var(--color-line-strong)', strokeWidth: 1 }}
            content={<TrendTooltip metric={metric} />}
          />

          <Area
            type="monotone"
            dataKey="value"
            connectNulls
            stroke={`url(#stroke-${gradientId})`}
            strokeWidth={2}
            fill={`url(#fill-${gradientId})`}
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayload {
  payload?: { date: string; value: number | null; count: number };
}

function TrendTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  metric: Metric;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point || point.value === null) return null;

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-lift">
      <p className="text-[0.75rem] font-medium">{chartDateLabel(point.date, 'all')}</p>
      <p className="mt-0.5 text-[0.8125rem] font-semibold">
        {metric === 'mood' ? moodLabel(point.value) : energyLabel(point.value)}
      </p>
      <p className="text-[0.6875rem] text-ink-faint">
        {point.count} {point.count === 1 ? 'check-in' : 'check-ins'}
      </p>
    </div>
  );
}
