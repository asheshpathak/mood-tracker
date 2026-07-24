import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-surface-sunk', className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
      {body ? (
        <p className="mt-1.5 max-w-xs text-pretty text-[0.8125rem] leading-relaxed text-ink-faint">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('card p-5 text-center', className)}>
      <p className="text-[0.875rem] text-ink-soft">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[0.8125rem] font-medium text-brand hover:text-brand-deep"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
