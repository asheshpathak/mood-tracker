import { api } from '@/lib/api';
import { localTimezone } from '@/lib/format';
import type {
  Analytics,
  MoodDraft,
  MoodEntry,
  Paginated,
  RangeKey,
  TodayResponse,
  Vocabulary,
} from '@/lib/types';

export interface MoodListArgs {
  limit?: number;
  cursor?: string;
  from?: string;
  to?: string;
  emotion?: string;
  factor?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
}

export const moodApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVocabulary: builder.query<Vocabulary, void>({
      query: () => '/moods/vocabulary',
      keepUnusedDataFor: 3600,
    }),

    getToday: builder.query<TodayResponse, void>({
      query: () => ({ url: '/moods/today', params: { tz: localTimezone() } }),
      providesTags: ['Today'],
    }),

    getAnalytics: builder.query<Analytics, RangeKey>({
      query: (range) => ({ url: '/moods/analytics', params: { range, tz: localTimezone() } }),
      providesTags: ['Analytics'],
    }),

    listMoods: builder.query<Paginated<MoodEntry>, MoodListArgs>({
      query: (params) => ({ url: '/moods', params }),
      // Infinite scroll: pages are merged into one list keyed by the filter set.
      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        const { cursor: _cursor, ...rest } = queryArgs;
        return `${endpointName}(${JSON.stringify(rest)})`;
      },
      merge: (current, incoming, { arg }) => {
        if (!arg.cursor) return incoming;
        const seen = new Set(current.items.map((m) => m.id));
        current.items.push(...incoming.items.filter((m) => !seen.has(m.id)));
        current.nextCursor = incoming.nextCursor;
        current.hasMore = incoming.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      providesTags: ['MoodList'],
    }),

    getMood: builder.query<{ mood: MoodEntry }, string>({
      query: (id) => `/moods/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Mood', id }],
    }),

    createMood: builder.mutation<{ mood: MoodEntry }, MoodDraft>({
      query: (body) => ({
        url: '/moods',
        method: 'POST',
        body: { ...body, timezone: body.timezone ?? localTimezone() },
      }),
      invalidatesTags: ['MoodList', 'Analytics', 'Today'],
    }),

    updateMood: builder.mutation<{ mood: MoodEntry }, { id: string; patch: Partial<MoodDraft> }>({
      query: ({ id, patch }) => ({ url: `/moods/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Mood', id },
        'MoodList',
        'Analytics',
        'Today',
      ],
    }),

    deleteMood: builder.mutation<void, string>({
      query: (id) => ({ url: `/moods/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MoodList', 'Analytics', 'Today'],
    }),
  }),
});

export const {
  useGetVocabularyQuery,
  useGetTodayQuery,
  useGetAnalyticsQuery,
  useListMoodsQuery,
  useGetMoodQuery,
  useCreateMoodMutation,
  useUpdateMoodMutation,
  useDeleteMoodMutation,
} = moodApi;
