import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useAuth = () =>
  useAppSelector((state) => ({
    user: state.auth.user,
    isAuthenticated: Boolean(state.auth.accessToken && state.auth.user),
    refreshToken: state.auth.refreshToken,
  }));
