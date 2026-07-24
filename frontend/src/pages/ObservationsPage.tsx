import { useMemo, useState } from 'react';
import { Lightbulb, Pin, Plus, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { ObservationCard } from '@/components/observations/ObservationCard';
import { ObservationComposer } from '@/components/observations/ObservationComposer';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import {
  useGetObservationTagsQuery,
  useListObservationsQuery,
} from '@/features/observations/observationApi';
import { useDebounced } from '@/hooks/useDebounced';
import { errorMessage } from '@/lib/api';

export function ObservationsPage() {
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string | undefined>();
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  const debouncedSearch = useDebounced(search, 350);
  const { data: tagData } = useGetObservationTagsQuery();

  const query = useMemo(
    () => ({
      limit: 20,
      cursor,
      search: debouncedSearch || undefined,
      tag,
      pinned: pinnedOnly || undefined,
    }),
    [cursor, debouncedSearch, tag, pinnedOnly],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useListObservationsQuery(query);

  const filtering = Boolean(debouncedSearch || tag || pinnedOnly);
  const resetPaging = () => setCursor(undefined);

  const selectTag = (next: string) => {
    setTag((current) => (current === next ? undefined : next));
    resetPaging();
  };

  return (
    <>
      <PageHeader
        title="Observations"
        subtitle="The things you work out about yourself, kept where you can find them again."
        action={
          // Below `sm` the tab bar's compose button already covers this.
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            icon={<Plus className="size-4" />}
            onClick={() => setComposerOpen(true)}
          >
            New
          </Button>
        }
      />

      <div className="mb-5 space-y-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPaging();
          }}
          placeholder="Search observations"
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

        <div className="no-scrollbar edge-fade -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip
            size="sm"
            selected={pinnedOnly}
            onClick={() => {
              setPinnedOnly((v) => !v);
              resetPaging();
            }}
          >
            <Pin className="size-3" />
            Pinned
          </Chip>
          {(tagData?.tags ?? []).map((t) => (
            <Chip key={t.name} size="sm" selected={tag === t.name} onClick={() => selectTag(t.name)}>
              {t.name}
              <span className="text-ink-faint">{t.count}</span>
            </Chip>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Lightbulb className="size-5" />}
            title={filtering ? 'Nothing matches that' : 'No observations yet'}
            body={
              filtering
                ? 'Try a different word, or clear the filters.'
                : 'When something clicks — about a pattern, a person, yourself — put it here before it evaporates.'
            }
            action={
              filtering ? null : (
                <Button onClick={() => setComposerOpen(true)}>Write the first one</Button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((observation) => (
            <ObservationCard
              key={observation.id}
              observation={observation}
              onTagClick={selectTag}
            />
          ))}

          {data!.hasMore ? (
            <Button
              variant="secondary"
              fullWidth
              loading={isFetching}
              onClick={() => setCursor(data!.nextCursor ?? undefined)}
            >
              Load older
            </Button>
          ) : (
            <p className="py-4 text-center text-[0.75rem] text-ink-faint">That is everything.</p>
          )}
        </div>
      )}

      <ObservationComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}
