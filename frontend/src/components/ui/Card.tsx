import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={cn('card', className)}>{children}</Tag>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[0.9375rem] font-semibold leading-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-[0.8125rem] text-ink-faint">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3 px-1', className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {children}
      </h2>
      {action}
    </div>
  );
}
