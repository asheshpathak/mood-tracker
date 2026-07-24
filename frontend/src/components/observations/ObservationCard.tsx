import { useState } from 'react';
import { MoreHorizontal, Pencil, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { IconButton } from '@/components/ui/Button';
import {
  useDeleteObservationMutation,
  useTogglePinMutation,
} from '@/features/observations/observationApi';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { fullTimestamp, relativeTime } from '@/lib/format';
import type { Observation } from '@/lib/types';
import { ObservationComposer } from './ObservationComposer';

export function ObservationCard({
  observation,
  onTagClick,
}: {
  observation: Observation;
  onTagClick?: (tag: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [togglePin] = useTogglePinMutation();
  const [remove, { isLoading: deleting }] = useDeleteObservationMutation();

  const act = async (fn: () => Promise<unknown>, failure: string) => {
    setMenuOpen(false);
    try {
      await fn();
    } catch (error) {
      toast.error(errorMessage(error, failure));
    }
  };

  return (
    <>
      <article
        className={cn(
          'card relative p-5 transition-shadow duration-300 hover:shadow-lift',
          observation.pinned && 'border-brand-line bg-brand-tint/25',
          deleting && 'opacity-50',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {observation.pinned ? (
                <Pin className="size-3.5 shrink-0 fill-current text-brand" />
              ) : null}
              <time
                dateTime={observation.occurredAt}
                title={fullTimestamp(observation.occurredAt)}
                className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-ink-faint"
              >
                {relativeTime(observation.occurredAt)}
              </time>
            </div>

            {observation.title ? (
              <h3 className="mt-2 text-pretty text-[1.0625rem] font-semibold leading-snug tracking-tight">
                {observation.title}
              </h3>
            ) : null}

            <p
              className={cn(
                'whitespace-pre-wrap text-pretty text-[0.9375rem] leading-relaxed text-ink-soft',
                observation.title ? 'mt-1.5' : 'mt-2',
              )}
            >
              {observation.body}
            </p>

            {observation.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {observation.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagClick?.(tag)}
                    disabled={!onTagClick}
                    className={cn(
                      'rounded-md bg-surface-sunk px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-faint',
                      onTagClick && 'transition-colors hover:bg-line hover:text-ink',
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative -mr-1 -mt-1 shrink-0">
            <IconButton label="Observation options" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal className="size-[18px]" />
            </IconButton>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-lift animate-fade">
                  <MenuItem
                    icon={<Pin className="size-4" />}
                    onClick={() =>
                      act(
                        () => togglePin(observation.id).unwrap(),
                        'Could not update that',
                      )
                    }
                  >
                    {observation.pinned ? 'Unpin' : 'Pin'}
                  </MenuItem>
                  <MenuItem
                    icon={<Pencil className="size-4" />}
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    icon={<Trash2 className="size-4" />}
                    destructive
                    onClick={() =>
                      act(async () => {
                        await remove(observation.id).unwrap();
                        toast.success('Observation removed');
                      }, 'Could not remove that')
                    }
                  >
                    Delete
                  </MenuItem>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </article>

      <ObservationComposer
        open={editing}
        onClose={() => setEditing(false)}
        observation={observation}
      />
    </>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.8125rem] font-medium transition-colors',
        destructive ? 'text-danger hover:bg-danger/8' : 'text-ink-soft hover:bg-surface-sunk',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
