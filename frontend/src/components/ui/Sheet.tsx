import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

/**
 * A bottom sheet on phones, a centred dialog from `sm` up — one component so
 * both breakpoints share behaviour (escape to close, scroll lock, focus trap
 * boundaries) instead of drifting apart.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ y: '4%', opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '3%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-float',
              'rounded-t-[var(--radius-sheet)] sm:rounded-[var(--radius-sheet)]',
              size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
            )}
          >
            <div className="flex items-start gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
              <span className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-line-strong sm:hidden" />
              <div className="min-w-0 flex-1 pt-1">
                {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
                {description ? (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint">
                    {description}
                  </p>
                ) : null}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-1">
                <X className="size-[18px]" />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
              {children}
            </div>

            {footer ? (
              <div className="hairline-t bg-surface px-5 pb-safe pt-3 sm:px-6 sm:pb-5">{footer}</div>
            ) : (
              <div className="pb-safe sm:pb-4" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
