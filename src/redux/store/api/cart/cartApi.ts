import { baseApi } from '../baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllCarts: builder.query({
      query: (params) => ({
        url: '/cart/all-carts',
        method: 'GET',
        params,
      }),
      providesTags: ['Cart'],
    }),

    // ✅ Add item to cart (works for both visitors & logged-in users)
    addToCart: builder.mutation({
      query: (data) => ({
        url: '/cart/add-to-cart',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),

    // ✅ Get user cart (for logged-in users, returns [] for visitors)
    getUserCart: builder.query({
      query: () => ({
        url: '/cart',
        method: 'GET',
      }),
      providesTags: ['Cart'],
    }),

    // ✅ Update quantity of a cart item
    updateCartItem: builder.mutation({
      query: ({ id, quantity }) => ({
        url: `/cart/${id}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    // ✅ Remove cart item
    removeCartItem: builder.mutation({
      query: (id) => ({
        url: `/cart/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetAllCartsQuery,
  useAddToCartMutation,
  useGetUserCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} = cartApi;
