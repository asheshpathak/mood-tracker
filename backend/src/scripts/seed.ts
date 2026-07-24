/**
 * Seeds a demo account with ~8 weeks of plausible history so the insights
 * screens have something real to render. Safe to re-run: it wipes the demo
 * user's own data only.
 *
 *   npm run seed --prefix backend
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../db/mongoose.js';
import { toMoodScore, EMOTION_GROUPS, FACTORS } from '../modules/moods/mood.constants.js';
import { Mood } from '../modules/moods/mood.model.js';
import { Observation } from '../modules/observations/observation.model.js';
import { User } from '../modules/users/user.model.js';
import { dayjs, localStamp } from '../utils/time.js';
import { logger } from '../utils/logger.js';

const DEMO_EMAIL = 'demo@moodtracker.app';
const DEMO_PASSWORD = 'demo12345';
const TZ = process.env.SEED_TZ ?? 'Asia/Kolkata';
const DAYS = 56;

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const sample = <T>(arr: readonly T[], n: number): T[] =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

const NOTES = [
  'Slept badly, but the morning walk helped more than expected.',
  'Long stretch of focused work. Lost track of time in a good way.',
  'Felt scattered all afternoon — too many open tabs, literally and otherwise.',
  'Good call with an old friend. Reminded me how much I miss that.',
  'Skipped lunch and paid for it by 4pm.',
  'Quiet evening, nothing remarkable, and that was fine.',
  'Anxious about the deadline. Broke it into pieces and it shrank.',
  'Gym after a week off. Body complained, head cleared.',
  '',
  '',
];

const OBSERVATIONS = [
  {
    title: 'Motivation follows action',
    body: 'I keep waiting to feel ready before starting. It has never once worked that way. The feeling arrives about ten minutes in, never before.',
    tags: ['patterns', 'work'],
  },
  {
    title: 'The 4pm dip is physical, not emotional',
    body: 'Every time I have read the late-afternoon slump as a mood problem I was wrong. It is food and light. Eating properly and stepping outside fixes it almost every time.',
    tags: ['energy', 'body'],
  },
  {
    title: '',
    body: 'Noticed today that I feel most like myself in the first hour after waking, before I have looked at a screen. Worth protecting.',
    tags: ['mornings'],
  },
  {
    title: 'Rumination has a tell',
    body: 'When I start rehearsing conversations that already happened, I am not processing — I am spiralling. The tell is the rehearsal. Naming it usually breaks it.',
    tags: ['anxiety', 'patterns'],
  },
  {
    title: 'Small talk is not small',
    body: 'Two minutes with the neighbour changed the whole shape of my morning. I keep underrating how much incidental contact does for me.',
    tags: ['people'],
  },
  {
    title: 'I confuse tired with sad',
    body: 'Three times this month I have logged something as low mood and it turned out to be six hours of sleep. Check the body first.',
    tags: ['sleep', 'patterns'],
  },
  {
    title: 'Deep work needs a runway',
    body: 'It takes me roughly twenty minutes of mediocre work before anything good happens. If I quit at fifteen I never see it.',
    tags: ['work', 'focus'],
  },
];

async function seed() {
  await connectDatabase();

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Demo',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      timezone: TZ,
    });
    logger.info('Created demo user');
  }

  await Promise.all([Mood.deleteMany({ user: user._id }), Observation.deleteMany({ user: user._id })]);

  const moods = [];
  for (let d = DAYS - 1; d >= 0; d -= 1) {
    // A couple of days are deliberately skipped so streaks and coverage look real.
    if (Math.random() < 0.12 && d !== 0) continue;

    const day = dayjs().tz(TZ).startOf('day').subtract(d, 'day');
    const weekday = day.day();
    const isWeekend = weekday === 0 || weekday === 6;
    const entriesToday = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);

    for (let i = 0; i < entriesToday; i += 1) {
      const hour = [8, 13, 16, 21][i % 4]! + Math.floor(Math.random() * 2);
      const recordedAt = day.hour(hour).minute(Math.floor(Math.random() * 60)).toDate();

      // Gentle upward drift + weekend lift + time-of-day curve + noise.
      const drift = ((DAYS - d) / DAYS) * 0.35;
      const weekendLift = isWeekend ? 0.2 : 0;
      const dayCurve = hour < 10 ? 0.05 : hour < 15 ? 0.1 : hour < 18 ? -0.15 : 0.05;
      const pleasantness = clamp(-0.25 + drift + weekendLift + dayCurve + (Math.random() - 0.5) * 0.55);
      const energy = clamp((hour < 12 ? 0.15 : hour < 17 ? 0.05 : -0.3) + (Math.random() - 0.5) * 0.6);

      const group =
        pleasantness >= 0.15
          ? energy >= 0
            ? EMOTION_GROUPS.highEnergyPleasant
            : EMOTION_GROUPS.lowEnergyPleasant
          : pleasantness <= -0.15
            ? energy >= 0
              ? EMOTION_GROUPS.highEnergyUnpleasant
              : EMOTION_GROUPS.lowEnergyUnpleasant
            : EMOTION_GROUPS.neutral;

      moods.push({
        user: user._id,
        pleasantness: Number(pleasantness.toFixed(2)),
        energy: Number(energy.toFixed(2)),
        moodScore: toMoodScore(pleasantness),
        emotions: sample(group, 1 + Math.floor(Math.random() * 2)),
        factors: sample(
          isWeekend ? (['friends', 'hobbies', 'nature', 'sleep', 'food', 'exercise'] as const) : FACTORS,
          1 + Math.floor(Math.random() * 2),
        ),
        note: pick(NOTES),
        recordedAt,
        timezone: TZ,
        ...localStamp(recordedAt, TZ),
      });
    }
  }

  await Mood.insertMany(moods);

  const observations = OBSERVATIONS.map((o, i) => {
    const occurredAt = dayjs()
      .tz(TZ)
      .subtract(Math.floor((i * DAYS) / OBSERVATIONS.length) + 1, 'day')
      .hour(9 + ((i * 3) % 12))
      .minute(15)
      .toDate();
    return {
      user: user!._id,
      title: o.title,
      body: o.body,
      tags: o.tags,
      pinned: i < 2,
      occurredAt,
      timezone: TZ,
      ...localStamp(occurredAt, TZ),
    };
  });

  await Observation.insertMany(observations);

  logger.info(
    `Seeded ${moods.length} mood entries and ${observations.length} observations for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`,
  );
  await disconnectDatabase();
}

seed().catch(async (err) => {
  logger.error({ err }, 'Seed failed');
  await disconnectDatabase();
  process.exit(1);
});
