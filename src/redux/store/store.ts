import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import baseApi from './api/baseApi';
import authReducer from './features/auth/authSlice';

// The session lives in cookies/localStorage (see hooks/useAuth), so nothing here needs persisting.
// (The cart, wishlist and orders slices copied from the storefront were never read by the admin; removed 2026-11-23.)
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // RTK Query actions may carry non-serializable data (e.g. FormData for product uploads)
          `${baseApi.reducerPath}/executeMutation`,
          `${baseApi.reducerPath}/executeQuery`,
        ],
        ignoredPaths: [`${baseApi.reducerPath}.mutations`, `${baseApi.reducerPath}.queries`],
      },
    }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
