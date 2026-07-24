import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { energyLabel, moodColorContinuous, moodLabel, quadrantFor, QUADRANT_NAMES } from '@/lib/mood';
import { cn } from '@/lib/cn';

const clamp = (n: number) => Math.max(-1, Math.min(1, n));
const snap = (n: number) => Math.round(n * 100) / 100;

/**
 * A two-axis pad: pleasantness left→right, energy bottom→top.
 *
 * One gesture captures both dimensions, which is the whole point — asking for
 * "how good" and "how activated" separately is slower and produces vaguer data
 * than letting someone place a single point.
 */
export function MoodPad({
  pleasantness,
  energy,
  onChange,
  className,
}: {
  pleasantness: number;
  energy: number;
  onChange: (next: { pleasantness: number; energy: number }) => void;
  className?: string;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const colour = moodColorContinuous(pleasantness);
  const quadrant = quadrantFor(pleasantness, energy);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = padRef.current?.getBoundingClientRect();
      if (!rect) return;
      onChange({
        pleasantness: snap(clamp(((clientX - rect.left) / rect.width) * 2 - 1)),
        energy: snap(clamp(1 - ((clientY - rect.top) / rect.height) * 2)),
      });
    },
    [onChange],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPoint(event.clientX, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromPoint(event.clientX, event.clientY);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.2 : 0.05;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({
      pleasantness: snap(clamp(pleasantness + move[0])),
      energy: snap(clamp(energy + move[1])),
    });
  };

  const x = ((pleasantness + 1) / 2) * 100;
  const y = (1 - (energy + 1) / 2) * 100;

  return (
    <div className={cn('select-none', className)}>
      <div
        ref={padRef}
        role="group"
        tabIndex={0}
        aria-label={`Mood pad. Currently ${moodLabel(pleasantness)}, ${energyLabel(energy)}. Use the arrow keys to adjust.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-soft"
      >
        {/* Ambient wash that follows the point — the colour reads before the words do. */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: `radial-gradient(120% 120% at ${x}% ${y}%, ${colour}2e 0%, ${colour}12 38%, transparent 72%)`,
          }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        />

        <Grid />
        <AxisLabels />

        {/* Puck */}
        <motion.div
          className="pointer-events-none absolute"
          animate={{ left: `${x}%`, top: `${y}%` }}
          transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }}
          style={{ translateX: '-50%', translateY: '-50%' }}
        >
          <span
            className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-md animate-breathe"
            style={{ backgroundColor: colour }}
          />
          <span
            className="relative block size-8 rounded-full border-[3px] border-white shadow-lift"
            style={{ backgroundColor: colour }}
          />
        </motion.div>
      </div>

      <div className="mt-5 text-center">
        <motion.p
          key={quadrant}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[1.375rem] font-semibold tracking-tight"
        >
          {QUADRANT_NAMES[quadrant]}
        </motion.p>
        <p className="mt-1 text-[0.8125rem] text-ink-faint">
          {moodLabel(pleasantness)} · {energyLabel(energy)}
        </p>
      </div>

      {/* Screen-reader and keyboard-only fallback for each axis. */}
      <div className="sr-only">
        <label>
          Pleasantness
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={pleasantness}
            onChange={(e) => onChange({ pleasantness: Number(e.target.value), energy })}
          />
        </label>
        <label>
          Energy
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={energy}
            onChange={(e) => onChange({ pleasantness, energy: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}

function Grid() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <line x1="50%" y1="8%" x2="50%" y2="92%" stroke="var(--color-line)" strokeWidth="1" />
      <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="var(--color-line)" strokeWidth="1" />
      <circle
        cx="50%"
        cy="50%"
        r="30%"
        fill="none"
        stroke="var(--color-line)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />
    </svg>
  );
}

function AxisLabels() {
  const base =
    'pointer-events-none absolute text-[0.625rem] font-medium uppercase tracking-[0.1em] text-ink-faint/70';
  return (
    <>
      <span className={cn(base, 'left-1/2 top-3 -translate-x-1/2')}>High energy</span>
      <span className={cn(base, 'bottom-3 left-1/2 -translate-x-1/2')}>Low energy</span>
      <span
        className={cn(base, 'left-2.5 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl]')}
      >
        Unpleasant
      </span>
      <span className={cn(base, 'right-2.5 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]')}>
        Pleasant
      </span>
    </>
  );
}
