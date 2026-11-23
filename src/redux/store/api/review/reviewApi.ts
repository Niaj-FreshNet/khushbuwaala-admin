import { IReview } from "@/types/product.types";
import baseApi from "../baseApi";
import type { ApiEnvelope, PageMeta } from "@/types/api.types";

// Define the review API slice
export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Create Review (User)
    createReview: builder.mutation<IReview, Partial<IReview>>({
      query: (review) => ({
        url: "/review/create-review",
        method: "POST",
        body: review,
      }),
      invalidatesTags: ["Review"],
    }),

    // ✅ Get All Reviews (Public)
    getAllReviews: builder.query<IReview[], void>({
      query: () => "/review/get-all-reviews",
      providesTags: ["Review"],
    }),

    // ✅ Get All Reviews (Admin / Super Admin)
    getAllReviewsAdmin: builder.query<ApiEnvelope<{ meta: PageMeta; data: IReview[] }>, void>({
      query: () => "/review/get-all-reviews/admin",
      providesTags: ["Review"],
    }),

    // ✅ Get Product Reviews
    getProductReviews: builder.query<IReview[], string>({
      query: (productId) => `/review/get-product-reviews/${productId}`,
      providesTags: (result, error, productId) => [{ type: "Review", id: productId }],
    }),

    // ✅ Approve / Publish Review (Admin)
    publishReview: builder.mutation<IReview[], string>({
      query: (id) => ({
        url: `/review/publish-review/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Review"],
    }),

// ✅ Delete Review (Admin)
    deleteReview: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/review/delete-review/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Review"],
    }),
  }),
  overrideExisting: false,
});

// ✅ Export hooks for use in components
export const {
  useCreateReviewMutation,
  useGetAllReviewsQuery,
  useGetAllReviewsAdminQuery,
  useGetProductReviewsQuery,
  usePublishReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;

export default reviewApi;