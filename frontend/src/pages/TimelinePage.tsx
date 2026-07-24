import { useMemo, useState } from 'react';
import { CalendarDays, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { MoodCard } from '@/components/mood/MoodCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useListMoodsQuery } from '@/features/moods/moodApi';
import { useDebounced } from '@/hooks/useDebounced';
import { errorMessage } from '@/lib/api';
import { dayHeading } from '@/lib/format';
import type { MoodEntry } from '@/lib/types';

const FILTERS = [
  { value: undefined, label: 'Everything' },
  { value: 4, label: 'Pleasant' },
  { value: 3, label: 'Neutral' },
  { value: 2, label: 'Unpleasant' },
] as const;

export function TimelinePage() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [band, setBand] = useState<number | undefined>();

  const debouncedSearch = useDebounced(search, 350);

  const query = useMemo(
    () => ({
      limit: 20,
      cursor,
      search: debouncedSearch || undefined,
      ...(band === 4 ? { minScore: 4 } : {}),
      ...(band === 3 ? { minScore: 3, maxScore: 3 } : {}),
      ...(band === 2 ? { maxScore: 2 } : {}),
    }),
    [cursor, debouncedSearch, band],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useListMoodsQuery(query);

  const grouped = useMemo(() => groupByDay(data?.items ?? []), [data?.items]);
  const resetPaging = () => setCursor(undefined);

  return (
    <>
      <PageHeader
        title="Timeline"
        subtitle="Everything you have logged, most recent first."
      />

      <div className="mb-5 space-y-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPaging();
          }}
          placeholder="Search your notes"
          leading={<Search className="size-4" />}
          trailing={
            search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch('');
                  resetPaging();
                }}
                className="rounded-full p-1 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            ) : null
          }
        />

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((filter) => (
            <Chip
              key={filter.label}
              size="sm"
              selected={band === filter.value}
              onClick={() => {
                setBand(filter.value);
                resetPaging();
              }}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title={search || band ? 'Nothing matches that' : 'No entries yet'}
            body={
              search || band
                ? 'Try a different word, or clear the filters.'
                : 'Your check-ins will collect here, grouped by day.'
            }
          />
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map(([day, entries]) => (
            <section key={day}>
              <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
                {dayHeading(entries[0]!.recordedAt)}
              </h2>
              <div className="space-y-2.5">
                {entries.map((entry) => (
                  <MoodCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}

          {data?.hasMore ? (
            <Button
              variant="secondary"
              fullWidth
              loading={isFetching}
              onClick={() => setCursor(data.nextCursor ?? undefined)}
            >
              Load older entries
            </Button>
          ) : (
            <p className="py-4 text-center text-[0.75rem] text-ink-faint">
              That is everything.
            </p>
          )}
        </div>
      )}
    </>
  );
}

function groupByDay(entries: MoodEntry[]): [string, MoodEntry[]][] {
  const map = new Map<string, MoodEntry[]>();
  for (const entry of entries) {
    const bucket = map.get(entry.localDate);
    if (bucket) bucket.push(entry);
    else map.set(entry.localDate, [entry]);
  }
  return [...map.entries()];
}
