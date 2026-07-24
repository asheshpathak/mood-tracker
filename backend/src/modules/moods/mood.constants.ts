/**
 * Emotion vocabulary grouped by the quadrant of the circumplex model of affect
 * (Russell, 1980): pleasantness on one axis, energy/arousal on the other.
 * Keeping the vocabulary closed makes analytics meaningful across time.
 */
export const EMOTION_GROUPS = {
  highEnergyPleasant: [
    'excited',
    'energized',
    'joyful',
    'proud',
    'confident',
    'playful',
    'inspired',
    'amused',
    'hopeful',
    'motivated',
  ],
  lowEnergyPleasant: [
    'calm',
    'content',
    'relaxed',
    'peaceful',
    'grateful',
    'satisfied',
    'serene',
    'loved',
    'relieved',
    'cozy',
  ],
  highEnergyUnpleasant: [
    'anxious',
    'stressed',
    'angry',
    'frustrated',
    'overwhelmed',
    'restless',
    'irritated',
    'worried',
    'panicked',
    'envious',
  ],
  lowEnergyUnpleasant: [
    'sad',
    'tired',
    'lonely',
    'bored',
    'drained',
    'disappointed',
    'numb',
    'discouraged',
    'guilty',
    'ashamed',
  ],
  neutral: ['okay', 'indifferent', 'focused', 'curious', 'surprised', 'nostalgic', 'reflective'],
} as const;

export const EMOTIONS: string[] = Object.values(EMOTION_GROUPS).flatMap((group) => [...group]);

/** What was influencing the moment — the raw material for correlation insights. */
export const FACTORS = [
  'work',
  'study',
  'family',
  'friends',
  'partner',
  'health',
  'exercise',
  'sleep',
  'food',
  'money',
  'weather',
  'travel',
  'social-media',
  'alone-time',
  'hobbies',
  'chores',
  'commute',
  'news',
  'music',
  'meditation',
  'nature',
  'pets',
] as const;

export type Factor = (typeof FACTORS)[number];

/** Buckets a -1..1 pleasantness value into the 1–5 scale used by charts and colours. */
export function toMoodScore(pleasantness: number): number {
  if (pleasantness <= -0.6) return 1;
  if (pleasantness <= -0.2) return 2;
  if (pleasantness < 0.2) return 3;
  if (pleasantness < 0.6) return 4;
  return 5;
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very unpleasant',
  2: 'Unpleasant',
  3: 'Neutral',
  4: 'Pleasant',
  5: 'Very pleasant',
};
