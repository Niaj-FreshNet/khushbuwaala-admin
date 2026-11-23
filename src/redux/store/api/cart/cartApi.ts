import { baseApi } from '../baseApi';
import type { ApiEnvelope, PageMeta } from '@/types/api.types';
import type { OrderLine } from '@/types/order.types';

/** A cart line as GET /cart/all-carts returns it (with its customer and order) */
export type AdminCartItem = Omit<OrderLine, 'product' | 'variant'> & {
  product?: { id: string; name: string; primaryImage?: string; slug?: string } | null;
  variant?: { id: string; sku: string; size: number; unit: string; price: number } | null;
  user?: { id: string; name: string; email: string; phone?: string | null; imageUrl?: string | null } | null;
  order?: { id: string; invoice: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type CartListQuery = { page?: number; limit?: number; status?: string; searchTerm?: string };

// The storefront cart endpoints (add, my cart, change quantity) are not used here; removed 2026-11-23.
export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCarts: builder.query<ApiEnvelope<AdminCartItem[]> & { meta: PageMeta }, CartListQuery>({
      query: (params) => ({
        url: '/cart/all-carts',
        method: 'GET',
        params,
      }),
      providesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/cart/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const { useGetAllCartsQuery, useRemoveCartItemMutation } = cartApi;
