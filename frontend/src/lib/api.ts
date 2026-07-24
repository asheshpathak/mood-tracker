import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { sessionEstablished, signedOut } from '@/features/auth/authSlice';
import type { RootState } from '@/app/store';
import type { ApiErrorBody, AuthResponse } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

// Every route lives under /api. Dropping the suffix makes each request 404 —
// which the browser reports as an opaque CORS failure, sending you hunting in
// entirely the wrong place. Say it plainly instead.
if (!API_URL.endsWith('/api')) {
  console.warn(
    `[mood] VITE_API_URL is "${API_URL}", which does not end in /api. ` +
      'Requests will almost certainly 404 — check the environment variable on your host.',
  );
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Refresh happens at most once at a time; every request that hits a 401 while a
 * refresh is in flight waits for it rather than firing its own.
 */
let refreshPromise: Promise<AuthResponse | null> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) return result;

  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;
  const isRefreshCall = typeof args !== 'string' && args.url === '/auth/refresh';

  if (!refreshToken || isRefreshCall) {
    api.dispatch(signedOut());
    return result;
  }

  refreshPromise ??= (async () => {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
      api,
      extraOptions,
    );
    return (refreshResult.data as AuthResponse | undefined) ?? null;
  })().finally(() => {
    // Release the slot on the next tick so concurrent callers all see the result.
    queueMicrotask(() => {
      refreshPromise = null;
    });
  });

  const session = await refreshPromise;

  if (!session) {
    api.dispatch(signedOut());
    return result;
  }

  api.dispatch(sessionEstablished(session));
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Mood', 'MoodList', 'Analytics', 'Today', 'Observation', 'ObservationList', 'Tags', 'User'],
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Pulls a readable message out of any RTK Query error shape. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback;
  const err = error as FetchBaseQueryError;

  if (typeof err.status === 'number') {
    const body = err.data as ApiErrorBody | undefined;
    return body?.error?.message ?? fallback;
  }
  if (err.status === 'FETCH_ERROR') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (err.status === 'PARSING_ERROR') return 'The server sent an unexpected response.';
  return fallback;
}

export function fieldErrors(error: unknown): Record<string, string[]> {
  const err = error as FetchBaseQueryError | undefined;
  if (err && typeof err.status === 'number') {
    return (err.data as ApiErrorBody | undefined)?.error?.details ?? {};
  }
  return {};
}

export { API_URL };
