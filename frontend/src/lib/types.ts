export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  preferences: {
    weekStartsOn: number;
    reminderTime: string | null;
    theme: string;
  };
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MoodEntry {
  id: string;
  pleasantness: number;
  energy: number;
  moodScore: number;
  emotions: string[];
  factors: string[];
  note: string;
  recordedAt: string;
  timezone: string;
  localDate: string;
  localHour: number;
  localWeekday: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoodDraft {
  pleasantness: number;
  energy: number;
  emotions: string[];
  factors: string[];
  note: string;
  recordedAt?: string;
  timezone?: string;
}

export interface Observation {
  id: string;
  title: string;
  body: string;
  tags: string[];
  mood: string | null;
  pinned: boolean;
  occurredAt: string;
  timezone: string;
  localDate: string;
  localHour: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationDraft {
  title?: string;
  body: string;
  tags?: string[];
  pinned?: boolean;
  occurredAt?: string;
  timezone?: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TodayResponse {
  date: string;
  timezone: string;
  entries: MoodEntry[];
  average: { pleasantness: number; energy: number } | null;
  lastEntry: MoodEntry | null;
}

export type RangeKey = '7d' | '30d' | '90d' | '365d' | 'all';

export interface TrendPoint {
  date: string;
  avgPleasantness: number | null;
  avgEnergy: number | null;
  count: number;
}

export interface NamedStat {
  name: string;
  count: number;
  avgPleasantness: number;
}

export interface FactorStat extends NamedStat {
  avgEnergy: number;
  delta: number;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: 'positive' | 'neutral' | 'attention';
}

export interface Analytics {
  range: RangeKey;
  from: string;
  to: string;
  timezone: string;
  summary: {
    entries: number;
    daysLogged: number;
    windowDays: number;
    coverage: number;
    avgPleasantness: number;
    avgEnergy: number;
    avgMoodScore: number;
    deltaPleasantness: number | null;
  };
  streak: { current: number; longest: number; lastLoggedOn: string | null };
  trend: TrendPoint[];
  distribution: { score: number; label: string; count: number; percentage: number }[];
  byHour: { hour: number; avgPleasantness: number | null; avgEnergy: number | null; count: number }[];
  byWeekday: {
    weekday: number;
    label: string;
    short: string;
    avgPleasantness: number | null;
    avgEnergy: number | null;
    count: number;
  }[];
  topEmotions: NamedStat[];
  factorImpact: FactorStat[];
  bestDay: TrendPoint | null;
  hardestDay: TrendPoint | null;
  insights: Insight[];
}

export interface Vocabulary {
  emotions: string[];
  emotionGroups: Record<string, string[]>;
  factors: string[];
  moodLabels: Record<string, string>;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
