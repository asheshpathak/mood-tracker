import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import {
  useCreateMoodMutation,
  useUpdateMoodMutation,
} from '@/features/moods/moodApi';
import { errorMessage } from '@/lib/api';
import { toLocalDateInputValue } from '@/lib/format';
import type { MoodEntry } from '@/lib/types';
import { EmotionPicker, FactorPicker } from './Pickers';
import { MoodPad } from './MoodPad';

interface Draft {
  pleasantness: number;
  energy: number;
  emotions: string[];
  factors: string[];
  note: string;
  recordedAt: string;
}

const emptyDraft = (): Draft => ({
  pleasantness: 0,
  energy: 0,
  emotions: [],
  factors: [],
  note: '',
  recordedAt: toLocalDateInputValue(new Date().toISOString()),
});

const fromEntry = (entry: MoodEntry): Draft => ({
  pleasantness: entry.pleasantness,
  energy: entry.energy,
  emotions: entry.emotions,
  factors: entry.factors,
  note: entry.note,
  recordedAt: toLocalDateInputValue(entry.recordedAt),
});

export function CheckInSheet({
  open,
  onClose,
  onSaved,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Present when editing an existing moment. */
  entry?: MoodEntry | null;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showTime, setShowTime] = useState(false);
  const [createMood, { isLoading: creating }] = useCreateMoodMutation();
  const [updateMood, { isLoading: updating }] = useUpdateMoodMutation();

  // Reset to a clean slate (or the entry being edited) each time it opens.
  useEffect(() => {
    if (!open) return;
    setDraft(entry ? fromEntry(entry) : emptyDraft());
    setShowTime(Boolean(entry));
  }, [open, entry]);

  const saving = creating || updating;

  const save = async () => {
    const payload = {
      pleasantness: draft.pleasantness,
      energy: draft.energy,
      emotions: draft.emotions,
      factors: draft.factors,
      note: draft.note.trim(),
      recordedAt: new Date(draft.recordedAt).toISOString(),
    };

    try {
      if (entry) {
        await updateMood({ id: entry.id, patch: payload }).unwrap();
        toast.success('Entry updated');
      } else {
        await createMood(payload).unwrap();
        toast.success('Logged', { description: 'Noted how you felt just now.' });
      }
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save that entry'));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="lg"
      title={entry ? 'Edit this moment' : 'How are you right now?'}
      description={
        entry ? undefined : 'Place the point where it feels right. Everything below is optional.'
      }
      footer={
        <Button fullWidth size="lg" loading={saving} onClick={save}>
          {entry ? 'Save changes' : 'Log this moment'}
        </Button>
      }
    >
      <div className="space-y-8 pb-4">
        <MoodPad
          pleasantness={draft.pleasantness}
          energy={draft.energy}
          onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
          className="mx-auto max-w-sm"
        />

        <EmotionPicker
          pleasantness={draft.pleasantness}
          energy={draft.energy}
          selected={draft.emotions}
          onChange={(emotions) => setDraft((d) => ({ ...d, emotions }))}
        />

        <FactorPicker
          selected={draft.factors}
          onChange={(factors) => setDraft((d) => ({ ...d, factors }))}
        />

        <Textarea
          label="Anything worth remembering?"
          placeholder="A sentence is plenty. What happened, or what you noticed."
          value={draft.note}
          maxLength={2000}
          rows={3}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
        />

        <div>
          {showTime ? (
            <label className="flex flex-wrap items-center gap-3 px-1 text-[0.8125rem] text-ink-soft animate-fade">
              <span className="font-medium">Happened at</span>
              <input
                type="datetime-local"
                value={draft.recordedAt}
                max={toLocalDateInputValue(new Date().toISOString())}
                onChange={(e) => setDraft((d) => ({ ...d, recordedAt: e.target.value }))}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-[0.8125rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
              />
            </label>
          ) : (
            <button
              type="button"
              onClick={() => setShowTime(true)}
              className="flex items-center gap-1.5 px-1 text-[0.8125rem] font-medium text-ink-faint transition-colors hover:text-ink"
            >
              <Clock3 className="size-4" />
              Logging this for another time?
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
