import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { useGetVocabularyQuery } from '@/features/moods/moodApi';
import { humanise, moodColorContinuous, quadrantFor } from '@/lib/mood';
import { cn } from '@/lib/cn';

const MAX_EMOTIONS = 8;
const MAX_FACTORS = 10;

/**
 * Emotion words are ordered by the quadrant the pad is currently in. Naming a
 * feeling precisely is the part of mood tracking that actually helps, so the
 * words that fit the moment are one tap away rather than buried in an A–Z list.
 */
export function EmotionPicker({
  pleasantness,
  energy,
  selected,
  onChange,
}: {
  pleasantness: number;
  energy: number;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const { data } = useGetVocabularyQuery();
  const [expanded, setExpanded] = useState(false);
  const quadrant = quadrantFor(pleasantness, energy);
  const tint = moodColorContinuous(pleasantness);

  const { suggested, rest } = useMemo(() => {
    const groups = data?.emotionGroups ?? {};
    const primary = groups[quadrant] ?? [];
    const neutral = quadrant === 'neutral' ? [] : (groups.neutral ?? []);
    const suggestedList = [...primary, ...neutral.slice(0, 3)];
    const all = data?.emotions ?? [];
    return {
      suggested: suggestedList,
      rest: all.filter((e) => !suggestedList.includes(e)),
    };
  }, [data, quadrant]);

  const toggle = (emotion: string) => {
    if (selected.includes(emotion)) {
      onChange(selected.filter((e) => e !== emotion));
    } else if (selected.length < MAX_EMOTIONS) {
      onChange([...selected, emotion]);
    }
  };

  // Anything chosen before the pad moved still needs to be visible and removable.
  const orphans = selected.filter((e) => !suggested.includes(e) && !expanded);

  return (
    <section className="space-y-3">
      <Label
        title="What is it, more precisely?"
        hint={selected.length > 0 ? `${selected.length}/${MAX_EMOTIONS}` : 'Optional'}
      />

      <div className="flex flex-wrap gap-2">
        {[...orphans, ...suggested].map((emotion) => (
          <Chip
            key={emotion}
            selected={selected.includes(emotion)}
            tint={tint}
            onClick={() => toggle(emotion)}
          >
            {humanise(emotion)}
          </Chip>
        ))}
      </div>

      {rest.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 px-1 text-[0.8125rem] font-medium text-ink-faint transition-colors hover:text-ink"
          >
            {expanded ? 'Show fewer' : 'All feelings'}
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
          </button>

          {expanded ? (
            <div className="flex flex-wrap gap-2 animate-fade">
              {rest.map((emotion) => (
                <Chip
                  key={emotion}
                  selected={selected.includes(emotion)}
                  tint={tint}
                  onClick={() => toggle(emotion)}
                >
                  {humanise(emotion)}
                </Chip>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function FactorPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const { data } = useGetVocabularyQuery();

  const toggle = (factor: string) => {
    if (selected.includes(factor)) {
      onChange(selected.filter((f) => f !== factor));
    } else if (selected.length < MAX_FACTORS) {
      onChange([...selected, factor]);
    }
  };

  return (
    <section className="space-y-3">
      <Label
        title="What's shaping this?"
        hint="These are what turn entries into patterns"
      />
      <div className="flex flex-wrap gap-2">
        {(data?.factors ?? []).map((factor) => (
          <Chip
            key={factor}
            size="sm"
            selected={selected.includes(factor)}
            onClick={() => toggle(factor)}
          >
            {humanise(factor)}
          </Chip>
        ))}
      </div>
    </section>
  );
}

function Label({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h3 className="text-[0.9375rem] font-semibold tracking-tight">{title}</h3>
      {hint ? <span className="text-[0.75rem] text-ink-faint">{hint}</span> : null}
    </div>
  );
}
