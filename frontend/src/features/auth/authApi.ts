import { api } from '@/lib/api';
import { localTimezone } from '@/lib/format';
import type { AuthResponse, User } from '@/lib/types';
import { sessionEstablished, signedOut, userUpdated } from './authSlice';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, { name: string; email: string; password: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body: { ...body, timezone: localTimezone() },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(sessionEstablished(data));
      },
    }),

    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(sessionEstablished(data));
      },
    }),

    logout: builder.mutation<void, { refreshToken: string | null }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Sign out locally regardless of what the server says.
        try {
          await queryFulfilled;
        } finally {
          dispatch(signedOut());
          dispatch(api.util.resetApiState());
        }
      },
    }),

    me: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userUpdated(data.user));
        } catch {
          /* the base query already handles auth failures */
        }
      },
    }),

    updateProfile: builder.mutation<
      { user: User },
      { name?: string; timezone?: string; preferences?: { weekStartsOn?: 0 | 1; reminderTime?: string | null } }
    >({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(userUpdated(data.user));
      },
    }),

    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
