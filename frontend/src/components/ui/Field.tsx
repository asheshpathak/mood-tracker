import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-2xl border border-line bg-surface px-4 text-[1rem] text-ink placeholder:text-ink-faint ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'hover:border-line-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 ' +
  'disabled:bg-surface-sunk disabled:text-ink-faint';

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block px-1 text-[0.8125rem] font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="px-1 text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="px-1 text-[0.8125rem] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, className, id, ...rest },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint">
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            CONTROL,
            'h-12',
            leading && 'pl-11',
            trailing && 'pr-11',
            error && 'border-danger/60 focus:border-danger focus:ring-danger/12',
            className,
          )}
          {...rest}
        />
        {trailing ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {trailing}
          </span>
        ) : null}
      </div>
    </Wrapper>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 4, ...rest },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL,
          'resize-none py-3 leading-relaxed',
          error && 'border-danger/60 focus:border-danger focus:ring-danger/12',
          className,
        )}
        {...rest}
      />
    </Wrapper>
  );
});
