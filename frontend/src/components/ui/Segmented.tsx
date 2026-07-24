import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** iOS-style segmented control with a sliding indicator. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-surface-sunk p-1',
        size === 'sm' ? 'text-[0.75rem]' : 'text-[0.8125rem]',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors duration-200',
              size === 'sm' ? 'h-7 px-3' : 'h-8 px-3.5',
              active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
