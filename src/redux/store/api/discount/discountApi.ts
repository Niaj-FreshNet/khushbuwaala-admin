// src/redux/api/discount/discountApi.ts
import { IDiscount } from "@/types/product.types";
import baseApi from "../baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export const discountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Admin CRUD ───────────────────────────────────────
    getAllDiscountsAdmin: builder.query<ApiEnvelope<IDiscount[]>, void>({
      query: () => "/discount/admin",
      providesTags: ["Discount"],
    }),

    getDiscountById: builder.query<ApiEnvelope<IDiscount>, string>({
  query: (id) => `/discount/${id}`,
  providesTags: (_res, _err, id) => [{ type: "Discount", id }],
}),

    createDiscount: builder.mutation<IDiscount, Partial<IDiscount>>({
      query: (payload) => ({
        url: "/discount/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Discount"],
    }),

    updateDiscount: builder.mutation<IDiscount, { id: string; data: Partial<IDiscount> }>({
      query: ({ id, data }) => ({
        url: `/discount/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Discount"],
    }),

    deleteDiscount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/discount/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Discount"],
    }),

    // ── Public (apply discount) ────────────────────────
    applyDiscount: builder.mutation<
      { discount: IDiscount; discountAmount: number },
      { code: string; items: { productId: string, variantId?: string; price: number; qty: number }[] }
    >({
      query: (payload) => ({
        url: "/discount/apply",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetAllDiscountsAdminQuery,
  useGetDiscountByIdQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
  useApplyDiscountMutation,
} = discountApi;