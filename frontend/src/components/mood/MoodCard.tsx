import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { IconButton } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Chip';
import { useDeleteMoodMutation } from '@/features/moods/moodApi';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { timeOfDay } from '@/lib/format';
import { describeMood, humanise, moodColorContinuous, moodInkColor } from '@/lib/mood';
import type { MoodEntry } from '@/lib/types';
import { CheckInSheet } from './CheckInSheet';

export function MoodCard({ entry, className }: { entry: MoodEntry; className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleteMood, { isLoading: deleting }] = useDeleteMoodMutation();

  const emotionInk = moodInkColor(entry.pleasantness);

  const remove = async () => {
    setMenuOpen(false);
    try {
      await deleteMood(entry.id).unwrap();
      toast.success('Entry removed');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not remove that entry'));
    }
  };

  return (
    <>
      <article
        className={cn(
          'card relative flex gap-3.5 p-4 transition-shadow duration-300 hover:shadow-lift',
          deleting && 'opacity-50',
          className,
        )}
      >
        <MoodDot pleasantness={entry.pleasantness} energy={entry.energy} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-[0.9375rem] font-semibold tracking-tight">
              {describeMood(entry.pleasantness, entry.energy)}
            </h3>
            <time
              dateTime={entry.recordedAt}
              className="ml-auto shrink-0 text-[0.75rem] tabular-nums text-ink-faint"
            >
              {timeOfDay(entry.recordedAt)}
            </time>
          </div>

          {entry.emotions.length > 0 ? (
            <p className="mt-1 text-[0.8125rem] leading-snug" style={{ color: emotionInk }}>
              {entry.emotions.map(humanise).join(' · ')}
            </p>
          ) : null}

          {entry.note ? (
            <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-ink-soft">
              {entry.note}
            </p>
          ) : null}

          {entry.factors.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {entry.factors.map((factor) => (
                <Tag key={factor}>{humanise(factor)}</Tag>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative -mr-1 -mt-1 shrink-0">
          <IconButton label="Entry options" onClick={() => setMenuOpen((v) => !v)}>
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
                  icon={<Pencil className="size-4" />}
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing(true);
                  }}
                >
                  Edit
                </MenuItem>
                <MenuItem icon={<Trash2 className="size-4" />} destructive onClick={remove}>
                  Delete
                </MenuItem>
              </div>
            </>
          ) : null}
        </div>
      </article>

      <CheckInSheet open={editing} onClose={() => setEditing(false)} entry={entry} />
    </>
  );
}

/** The colour+position glyph that stands in for an entry everywhere in the app. */
export function MoodDot({
  pleasantness,
  energy,
  size = 40,
}: {
  pleasantness: number;
  energy: number;
  size?: number;
}) {
  const colour = moodColorContinuous(pleasantness);
  // Energy nudges the inner dot up or down inside its ring.
  const offset = -energy * (size * 0.14);

  return (
    <span
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: `${colour}1a` }}
      aria-hidden="true"
    >
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          backgroundColor: colour,
          transform: `translate(-50%, calc(-50% + ${offset}px))`,
        }}
      />
    </span>
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
