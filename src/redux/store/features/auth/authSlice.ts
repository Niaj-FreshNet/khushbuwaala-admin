import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { TUser } from "@/types/auth.types";
import Cookies from "js-cookie";

interface AuthState {
  user: TUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ✅ Initial state: empty, will rehydrate on client
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

// ✅ Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set user + tokens (login)
    setUser(
      state,
      action: PayloadAction<{ user: TUser; accessToken: string; refreshToken?: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
      }
    },

    // Update access token only (after refresh)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload);
      }
    },

    // Update refresh token (if rotated)
    setRefreshToken(state, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("refreshToken", action.payload);
      }
    },

    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    // Logout: clear everything
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      if (typeof window !== "undefined") {
        // Clear Local Storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // ✅ Force Clear Cookies to trigger the middleware block
        Cookies.remove("accessToken", { path: '/' });
        Cookies.remove("access_token", { path: '/' });
        Cookies.remove("refreshToken", { path: '/' });
      }
    },

    // ✅ Rehydrate state from localStorage (call on app load)
    rehydrate(state) {
      if (typeof window === "undefined") return;

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken) {
        try {
          const user = jwtDecode<TUser>(accessToken);
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
          console.log('ok done boss')
        } catch (err) {
          console.warn("Invalid token in localStorage, clearing...");
          // localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          state.user = null;
          // state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        }
      }
    },
  },
});

export const { setUser, setAccessToken, setRefreshToken, setIsLoading, logout, rehydrate } =
  authSlice.actions;

export default authSlice.reducer;
