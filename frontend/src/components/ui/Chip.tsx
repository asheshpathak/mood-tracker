import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Chip({
  selected,
  onClick,
  children,
  className,
  size = 'md',
  tint,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  /** Optional accent used when selected — lets emotion chips carry mood colour. */
  tint?: string;
}) {
  const interactive = Boolean(onClick);

  return (
    <button
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      disabled={!interactive}
      style={
        selected && tint
          ? { backgroundColor: `${tint}1f`, borderColor: `${tint}59`, color: tint }
          : undefined
      }
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium',
        'transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-calm)]',
        size === 'sm' ? 'h-7 px-2.5 text-[0.75rem]' : 'h-9 px-3.5 text-[0.8125rem]',
        interactive && 'active:scale-[0.96]',
        selected
          ? !tint && 'border-ink bg-ink text-white'
          : 'border-line bg-surface text-ink-soft',
        interactive && !selected && 'hover:border-line-strong hover:text-ink',
        !interactive && 'disabled:opacity-100',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-surface-sunk px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-soft',
        className,
      )}
    >
      {children}
    </span>
  );
}
