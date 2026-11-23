import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import Cookies from "js-cookie";
import { logout, setAccessToken } from "../features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  // baseUrl: "http://localhost:7302/api",
  // baseUrl: "https://api.khushbuwaala.com/api",
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}`,

  credentials: "include", // allows cookies for refresh
  prepareHeaders: (headers) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// ── Keep the session alive ──────────────────────────────────────────────────
// The access token expires after a few days. When any request gets 401, ask the backend for
// a new one using the httpOnly refresh cookie, then retry once. If that fails, the session
// really is over: clear it and go to the login page instead of showing "failed to load".
let refreshInFlight: Promise<string | null> | null = null;

const saveAccessToken = (token: string) => {
  localStorage.setItem("accessToken", token);
  // Host-only (admin subdomain); also clear any old site-wide copy.
  Cookies.remove("accessToken", { path: "/", domain: ".khushbuwaala.com" });
  Cookies.set("accessToken", token, {
    path: "/",
    secure: window.location.protocol === "https:",
    sameSite: "lax",
  });
};

const endSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("accessToken", { path: "/", domain: ".khushbuwaala.com" });
  if (!window.location.pathname.startsWith("/login")) {
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?expired=1&redirect=${back}`);
  }
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;
  const isAuthCall = /\/auth\/(login|refresh-token|logout)/.test(url);

  if (result.error?.status === 401 && !isAuthCall && typeof window !== "undefined") {
    // Several requests can fail at once; refresh only once and let them all wait for it.
    refreshInFlight ??= (async () => {
      const r = await rawBaseQuery({ url: "/auth/refresh-token", method: "POST" }, api, extraOptions);
      const token = (r.data as { data?: { accessToken?: string } } | undefined)?.data?.accessToken;
      return token || null;
    })().finally(() => {
      setTimeout(() => (refreshInFlight = null), 0);
    });

    const token = await refreshInFlight;
    if (token) {
      saveAccessToken(token);
      api.dispatch(setAccessToken(token));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      endSession();
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Cart",
    "CartSync",
    "Wishlist",
    "Category",
    "Material",
    "Fragrance",
    "Product",
    "Review",
    "Auth",
    "User",
    "Order",
    "Sales",
    "Expenses",
    "Stock",
    "Blog",
    "Discount",
    "Finance",
    "Courier",
    "Storefront",
  ],
  endpoints: () => ({}),
});

export default baseApi;
