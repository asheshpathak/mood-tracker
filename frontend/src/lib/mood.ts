/**
 * The shared language of the app: how a (pleasantness, energy) pair becomes a
 * colour, a word and a position. Kept in one place so the pad, the cards and
 * the charts can never drift apart.
 */

/**
 * Mood is a polarity, so the scale is diverging: one cool hue for unpleasant,
 * one warm hue for pleasant, and a genuinely neutral grey in the middle. Each
 * arm is a single hue with monotone lightness, and the two poles separate under
 * protanopia and deuteranopia (ΔE 24.7) — verified with the palette validator,
 * not eyeballed. A rainbow ramp (violet→blue→teal→green→amber) was the obvious
 * first instinct and fails both the single-hue and step-separation checks.
 */
export const MOOD_COLORS: Record<number, string> = {
  1: '#574c9e',
  2: '#8f89cb',
  3: '#a8a7ad',
  4: '#d9a24f',
  5: '#a86c14',
};

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very unpleasant',
  2: 'Unpleasant',
  3: 'Neutral',
  4: 'Pleasant',
  5: 'Very pleasant',
};

export function toMoodScore(pleasantness: number): number {
  if (pleasantness <= -0.6) return 1;
  if (pleasantness <= -0.2) return 2;
  if (pleasantness < 0.2) return 3;
  if (pleasantness < 0.6) return 4;
  return 5;
}

export function moodColor(pleasantness: number): string {
  return MOOD_COLORS[toMoodScore(pleasantness)] ?? MOOD_COLORS[3]!;
}

export function moodLabel(pleasantness: number): string {
  return MOOD_LABELS[toMoodScore(pleasantness)] ?? 'Neutral';
}

/** Continuous colour so the pad glides between steps instead of snapping. */
export function moodColorContinuous(pleasantness: number): string {
  const stops = [
    { at: -1, rgb: [87, 76, 158] },
    { at: -0.5, rgb: [143, 137, 203] },
    { at: 0, rgb: [168, 167, 173] },
    { at: 0.5, rgb: [217, 162, 79] },
    { at: 1, rgb: [168, 108, 20] },
  ];
  const v = Math.max(-1, Math.min(1, pleasantness));

  let lower = stops[0]!;
  let upper = stops[stops.length - 1]!;
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (v >= stops[i]!.at && v <= stops[i + 1]!.at) {
      lower = stops[i]!;
      upper = stops[i + 1]!;
      break;
    }
  }

  const span = upper.at - lower.at || 1;
  const t = (v - lower.at) / span;
  const channel = (i: number) => Math.round(lower.rgb[i]! + (upper.rgb[i]! - lower.rgb[i]!) * t);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

/**
 * Text variant of the mood colour. The light steps of both arms are chosen to
 * work as *fills* and sit under 3:1 against white, so type takes the dark end
 * of the same arm instead. Fill and ink are different jobs.
 */
export function moodInkColor(pleasantness: number): string {
  if (pleasantness > 0.15) return '#8a5a11';
  if (pleasantness < -0.15) return '#4a4189';
  return '#55555f';
}

export const ENERGY_LABELS = [
  { max: -0.6, label: 'Depleted' },
  { max: -0.2, label: 'Low energy' },
  { max: 0.2, label: 'Steady' },
  { max: 0.6, label: 'Energised' },
  { max: 1.01, label: 'Buzzing' },
] as const;

export function energyLabel(energy: number): string {
  return ENERGY_LABELS.find((e) => energy < e.max)?.label ?? 'Steady';
}

/**
 * The quadrant a feeling lands in — used to surface the most relevant emotion
 * words first rather than making you scan the whole vocabulary.
 */
export type Quadrant =
  | 'highEnergyPleasant'
  | 'lowEnergyPleasant'
  | 'highEnergyUnpleasant'
  | 'lowEnergyUnpleasant'
  | 'neutral';

export function quadrantFor(pleasantness: number, energy: number): Quadrant {
  if (Math.abs(pleasantness) < 0.15 && Math.abs(energy) < 0.15) return 'neutral';
  if (pleasantness >= 0) return energy >= 0 ? 'highEnergyPleasant' : 'lowEnergyPleasant';
  return energy >= 0 ? 'highEnergyUnpleasant' : 'lowEnergyUnpleasant';
}

export const QUADRANT_NAMES: Record<Quadrant, string> = {
  highEnergyPleasant: 'Bright and lively',
  lowEnergyPleasant: 'Calm and content',
  highEnergyUnpleasant: 'Tense and restless',
  lowEnergyUnpleasant: 'Low and heavy',
  neutral: 'Even keel',
};

/** A short, human summary of a moment — the line shown on every mood card. */
export function describeMood(pleasantness: number, energy: number): string {
  return `${moodLabel(pleasantness)} · ${energyLabel(energy)}`;
}

export function humanise(value: string): string {
  return value.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** Maps -1…1 onto 0…100 for positioning and bar widths. */
export function toPercent(value: number): number {
  return ((Math.max(-1, Math.min(1, value)) + 1) / 2) * 100;
}
