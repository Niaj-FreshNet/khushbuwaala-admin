'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState } from '@/redux/store/store';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { TUser } from '@/types/auth.types';
import { useGetMeUserQuery, useRefreshTokenMutation } from '@/redux/store/api/auth/authApi';
import { setUser, setAccessToken, logout as logoutSlice } from '@/redux/store/features/auth/authSlice';
import { toast } from 'sonner';

export const useAuth = () => {
  const dispatch = useDispatch();

  // 1️⃣ Pull current auth state from Redux
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const reduxToken = useSelector((state: RootState) => state.auth.accessToken);
  // Effects read the latest auth state from the store when they run, so they do not need it as a
  // dependency (listing it would re-run them on every change they make themselves).
  const store = useStore<RootState>();

  const [isLoading, setIsLoading] = useState(true);
  const isRefreshing = useRef(false);

  const storedToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') || Cookies.get('accessToken')
      : null;

  // 2️⃣ Fetch fresh user profile details from backend
  const { data: userData, isSuccess, refetch } = useGetMeUserQuery(undefined, {
    skip: !storedToken && !reduxToken,
    refetchOnMountOrArgChange: true,
  });

  const [refreshTokenApi] = useRefreshTokenMutation();

  // 3️⃣ 👉 UPDATE HERE: Sync full profile (name, image) into Redux whenever getMe succeeds
  useEffect(() => {
    if (isSuccess && userData?.data) {
      const { user, accessToken } = store.getState().auth;
      dispatch(
        setUser({
          user: { ...user, ...userData.data },
          accessToken: localStorage.getItem('accessToken') || accessToken || '',
        })
      );
    }
  }, [isSuccess, userData, dispatch, store]);

  // 4️⃣ Token initialization and refresh logic
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken') || null;
      const refresh = Cookies.get('refreshToken') || localStorage.getItem('refreshToken') || null;

      if (token) {
        localStorage.setItem('accessToken', token);
      }
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
      }

      if (token && !store.getState().auth.user) {
        try {
          const decoded = jwtDecode<TUser>(token);
          dispatch(setUser({ user: decoded, accessToken: token }));
        } catch {
          localStorage.removeItem('accessToken');
          Cookies.remove('accessToken', { path: '/' });
        }
      }

      if (!token && refresh && !isRefreshing.current) {
        isRefreshing.current = true;
        try {
          const result = await refreshTokenApi().unwrap();
          if (result?.accessToken) {
            localStorage.setItem('accessToken', result.accessToken);
            dispatch(setAccessToken(result.accessToken));
            refetch();
          }
        } catch (err) {
          console.error('Refresh token failed', err);
          toast.error('Session expired. Please login again.');
          dispatch(logoutSlice());
        } finally {
          isRefreshing.current = false;
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [dispatch, refetch, refreshTokenApi, store]);

  return {
    user: reduxUser,
    isAuthenticated: !!reduxUser,
    accessToken: reduxToken,
    isLoading,
  };
};