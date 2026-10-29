import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  // baseUrl: "http://localhost:7302/api",
  // baseUrl: "https://api.khushbuwaala.com/api",
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}`,

  credentials: "include", // allows cookies for refresh
  prepareHeaders: (headers, { getState }) => {
    // const token = (getState() as RootState).auth.accessTokenn || localStorage.getItem('accessToken');
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

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: rawBaseQuery,
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
  ],
  endpoints: () => ({}),
});

export default baseApi;
