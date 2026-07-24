import { useEffect, useState, type KeyboardEvent } from 'react';
import { Pin, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import {
  useCreateObservationMutation,
  useGetObservationTagsQuery,
  useUpdateObservationMutation,
} from '@/features/observations/observationApi';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toLocalDateInputValue } from '@/lib/format';
import type { Observation } from '@/lib/types';

const MAX_TAGS = 8;

export function ObservationComposer({
  open,
  onClose,
  observation,
}: {
  open: boolean;
  onClose: () => void;
  observation?: Observation | null;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [pinned, setPinned] = useState(false);
  const [occurredAt, setOccurredAt] = useState(toLocalDateInputValue(new Date().toISOString()));

  const { data: tagData } = useGetObservationTagsQuery();
  const [create, { isLoading: creating }] = useCreateObservationMutation();
  const [update, { isLoading: updating }] = useUpdateObservationMutation();

  useEffect(() => {
    if (!open) return;
    setTitle(observation?.title ?? '');
    setBody(observation?.body ?? '');
    setTags(observation?.tags ?? []);
    setTagDraft('');
    setPinned(observation?.pinned ?? false);
    setOccurredAt(toLocalDateInputValue(observation?.occurredAt ?? new Date().toISOString()));
  }, [open, observation]);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags((current) => [...current, tag]);
    setTagDraft('');
  };

  const onTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagDraft);
    } else if (event.key === 'Backspace' && !tagDraft && tags.length > 0) {
      setTags((current) => current.slice(0, -1));
    }
  };

  const save = async () => {
    if (!body.trim()) {
      toast.error('Write the observation first');
      return;
    }

    const payload = {
      title: title.trim(),
      body: body.trim(),
      tags,
      pinned,
      occurredAt: new Date(occurredAt).toISOString(),
    };

    try {
      if (observation) {
        await update({ id: observation.id, patch: payload }).unwrap();
        toast.success('Observation updated');
      } else {
        await create(payload).unwrap();
        toast.success('Kept', { description: 'Filed with the rest of your thinking.' });
      }
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save that'));
    }
  };

  const suggestions = (tagData?.tags ?? []).filter((t) => !tags.includes(t.name)).slice(0, 6);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="lg"
      title={observation ? 'Edit observation' : 'What did you notice?'}
      description={
        observation
          ? undefined
          : 'The realisations that arrive sideways — about yourself, a pattern, anything worth keeping.'
      }
      footer={
        <Button fullWidth size="lg" loading={creating || updating} onClick={save}>
          {observation ? 'Save changes' : 'Keep this'}
        </Button>
      }
    >
      <div className="space-y-5 pb-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write it the way you would say it out loud."
          rows={6}
          maxLength={5000}
          autoFocus
          className="text-[1rem] leading-relaxed"
        />

        <Input
          label="Give it a name"
          hint="Optional — helps when you scroll back through months of these"
          value={title}
          maxLength={140}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Motivation follows action"
        />

        <div className="space-y-2">
          <label className="block px-1 text-[0.8125rem] font-medium text-ink-soft">
            Tags <span className="text-ink-faint">({tags.length}/{MAX_TAGS})</span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-surface px-2.5 py-2 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-surface-sunk px-2.5 py-1 text-[0.75rem] font-medium text-ink-soft"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags((current) => current.filter((t) => t !== tag))}
                  className="text-ink-faint transition-colors hover:text-danger"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => addTag(tagDraft)}
              placeholder={tags.length === 0 ? 'patterns, work, sleep…' : ''}
              maxLength={28}
              className="min-w-24 flex-1 bg-transparent py-1 text-[0.875rem] placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-1 pt-1">
              {suggestions.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => addTag(tag.name)}
                  className="rounded-full border border-line px-2.5 py-1 text-[0.75rem] text-ink-faint transition-colors hover:border-line-strong hover:text-ink"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 text-[0.8125rem] text-ink-soft">
            <span className="font-medium">When</span>
            <input
              type="datetime-local"
              value={occurredAt}
              max={toLocalDateInputValue(new Date().toISOString())}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-[0.8125rem] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
            />
          </label>

          <button
            type="button"
            onClick={() => setPinned((v) => !v)}
            aria-pressed={pinned}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[0.8125rem] font-medium transition-colors',
              pinned
                ? 'border-brand-line bg-brand-tint text-brand-deep'
                : 'border-line text-ink-faint hover:text-ink',
            )}
          >
            <Pin className={cn('size-3.5', pinned && 'fill-current')} />
            {pinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
