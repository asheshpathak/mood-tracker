import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, Home, Lightbulb, Plus, Settings, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/app/hooks';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { CheckInSheet } from '@/components/mood/CheckInSheet';
import { ObservationComposer } from '@/components/observations/ObservationComposer';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/insights', label: 'Insights', icon: Activity },
  { to: '/observations', label: 'Notes', icon: Lightbulb },
  { to: '/settings', label: 'You', icon: Settings },
];

export function AppShell() {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // The compose button follows the tab you are on: notes on the Notes tab,
  // a check-in everywhere else. One button, no menu to open first.
  const composingObservation = location.pathname.startsWith('/observations');
  const compose = () => (composingObservation ? setObservationOpen(true) : setCheckInOpen(true));
  const composeLabel = composingObservation ? 'New observation' : 'New check-in';

  return (
    <div className="min-h-dvh lg:flex">
      {/* Installed, the page scrolls under the status bar — this frosts the strip
          it passes through so text never collides with the clock. Zero height in
          a browser tab, where the inset is 0. */}
      <div
        aria-hidden="true"
        className="glass fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] lg:hidden"
      />

      <SideRail user={user?.name ?? ''} onCompose={compose} composeLabel={composeLabel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-32 pt-[calc(env(safe-area-inset-top)_+_1.5rem)] sm:px-6 lg:max-w-5xl lg:pb-16 lg:pt-8">
          <Outlet key={location.pathname} />
        </main>
      </div>

      <TabBar onCompose={compose} composeLabel={composeLabel} />

      <CheckInSheet
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSaved={() => {
          setCheckInOpen(false);
          if (location.pathname !== '/') navigate('/');
        }}
      />
      <ObservationComposer open={observationOpen} onClose={() => setObservationOpen(false)} />
    </div>
  );
}

function SideRail({
  user,
  onCompose,
  composeLabel,
}: {
  user: string;
  onCompose: () => void;
  composeLabel: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-4 pb-[calc(env(safe-area-inset-bottom)_+_1.75rem)] pt-[calc(env(safe-area-inset-top)_+_1.75rem)] lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <Logo />
        <span className="text-[0.9375rem] font-semibold tracking-tight">Mood</span>
      </div>

      <nav className="mt-8 flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.875rem] font-medium transition-colors duration-200',
                isActive ? 'bg-surface-sunk text-ink' : 'text-ink-soft hover:bg-surface-sunk/60 hover:text-ink',
              )
            }
          >
            <item.icon className="size-[18px]" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onCompose}
        className="mt-6 flex h-11 items-center justify-center gap-2 rounded-2xl bg-ink text-[0.875rem] font-medium text-white shadow-soft transition-transform duration-200 hover:bg-ink/90 active:scale-[0.98]"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        {composeLabel === 'New observation' ? 'New note' : 'Check in'}
      </button>

      <div className="mt-auto flex items-center gap-2.5 rounded-xl px-2 py-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-tint text-[0.6875rem] font-semibold text-brand-deep">
          {initials(user) || '·'}
        </span>
        <span className="truncate text-[0.8125rem] text-ink-soft">{user}</span>
      </div>
    </aside>
  );
}

function TabBar({ onCompose, composeLabel }: { onCompose: () => void; composeLabel: string }) {
  const [left, right] = [NAV.slice(0, 2), NAV.slice(2)];

  return (
    <nav className="glass px-safe fixed inset-x-0 bottom-0 z-40 hairline-t pb-safe lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-0.5 pt-2">
        {left.map((item) => (
          <Tab key={item.to} item={item} />
        ))}

        <button
          type="button"
          onClick={onCompose}
          aria-label={composeLabel}
          className="-mt-5 flex size-[52px] shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-lift transition-transform duration-200 active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>

        {right.map((item) => (
          <Tab key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}

function Tab({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'relative flex w-16 flex-col items-center gap-1 rounded-xl py-1.5 text-[0.625rem] font-medium transition-colors duration-200',
          isActive ? 'text-ink' : 'text-ink-faint',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className="size-[21px]" strokeWidth={isActive ? 2.3 : 1.9} />
          {item.label}
          {isActive ? (
            <motion.span
              layoutId="tab-dot"
              className="absolute -top-0.5 size-1 rounded-full bg-ink"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex size-8 items-center justify-center rounded-[0.5rem] bg-gradient-to-br from-brand to-[#96a6ff]',
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute size-4 rounded-full border-[1.6px] border-white/40" />
      <span className="absolute right-[7px] top-[7px] size-[7px] rounded-full bg-white" />
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-semibold leading-none tracking-[-0.03em] sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-faint">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pb-1">{action}</div> : null}
    </header>
  );
}
