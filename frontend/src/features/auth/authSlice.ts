import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearSession, loadSession, saveSession } from '@/lib/storage';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** `null` until the stored session has been read — keeps guards from flashing. */
  initialised: boolean;
}

const stored = loadSession();

const initialState: AuthState = {
  user: stored?.user ?? null,
  accessToken: stored?.accessToken ?? null,
  refreshToken: stored?.refreshToken ?? null,
  initialised: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEstablished(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      saveSession(action.payload);
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
      if (state.accessToken && state.refreshToken) {
        saveSession({
          user: action.payload,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        });
      }
    },
    signedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      clearSession();
    },
  },
});

export const { sessionEstablished, userUpdated, signedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
export type { AuthState };
