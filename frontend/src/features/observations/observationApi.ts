import { api } from '@/lib/api';
import { localTimezone } from '@/lib/format';
import type { Observation, ObservationDraft, Paginated } from '@/lib/types';

export interface ObservationListArgs {
  limit?: number;
  cursor?: string;
  search?: string;
  tag?: string;
  pinned?: boolean;
  from?: string;
  to?: string;
}

export const observationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listObservations: builder.query<Paginated<Observation>, ObservationListArgs>({
      query: (params) => ({ url: '/observations', params }),
      serializeQueryArgs: ({ queryArgs, endpointName }) => {
        const { cursor: _cursor, ...rest } = queryArgs;
        return `${endpointName}(${JSON.stringify(rest)})`;
      },
      merge: (current, incoming, { arg }) => {
        if (!arg.cursor) return incoming;
        const seen = new Set(current.items.map((o) => o.id));
        current.items.push(...incoming.items.filter((o) => !seen.has(o.id)));
        current.nextCursor = incoming.nextCursor;
        current.hasMore = incoming.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      providesTags: ['ObservationList'],
    }),

    getObservationTags: builder.query<{ tags: { name: string; count: number }[] }, void>({
      query: () => '/observations/tags',
      providesTags: ['Tags'],
    }),

    getObservationStats: builder.query<
      { total: number; pinned: number; lastRecordedAt: string | null },
      void
    >({
      query: () => '/observations/stats',
      providesTags: ['ObservationList'],
    }),

    createObservation: builder.mutation<{ observation: Observation }, ObservationDraft>({
      query: (body) => ({
        url: '/observations',
        method: 'POST',
        body: { ...body, timezone: body.timezone ?? localTimezone() },
      }),
      invalidatesTags: ['ObservationList', 'Tags'],
    }),

    updateObservation: builder.mutation<
      { observation: Observation },
      { id: string; patch: Partial<ObservationDraft> }
    >({
      query: ({ id, patch }) => ({ url: `/observations/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['ObservationList', 'Tags'],
    }),

    togglePin: builder.mutation<{ observation: Observation }, string>({
      query: (id) => ({ url: `/observations/${id}/pin`, method: 'POST' }),
      invalidatesTags: ['ObservationList'],
    }),

    deleteObservation: builder.mutation<void, string>({
      query: (id) => ({ url: `/observations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ObservationList', 'Tags'],
    }),
  }),
});

export const {
  useListObservationsQuery,
  useGetObservationTagsQuery,
  useGetObservationStatsQuery,
  useCreateObservationMutation,
  useUpdateObservationMutation,
  useTogglePinMutation,
  useDeleteObservationMutation,
} = observationApi;
