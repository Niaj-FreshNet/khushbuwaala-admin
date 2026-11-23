import { IProductQuery, IProductResponse, IProductVariantResponse, ITrendingProduct, StockLog } from "@/types/product.types";
import type { ApiEnvelope } from "@/types/api.types";
import baseApi from "../baseApi";

// Storefront-only endpoints (trending, navbar, featured, new arrivals, by category, related,
// analytics, low stock) were never used by the admin and were removed 2026-11-23.

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T;
}

// Define query params type based on backend query parsing
export interface ProductQueryParams extends Partial<IProductQuery> {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity';
  stock?: 'in' | 'out';
  smells?: string;
}

/** One hit of GET /products/search-products (product.service formatProductSearchResponse) */
export interface ProductSearchHit {
  id: string;
  name: string;
  slug: string;
  primaryImage?: string;
  accords: string[];
  categoryName?: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  averageRating: number;
  reviewCount: number;
}

/** Product create/update body (JSON; images are uploaded to Cloudinary first) */
export type ProductPayload = Record<string, unknown>;

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create Product (ADMIN)
    createProduct: builder.mutation<ApiEnvelope<IProductResponse>, ProductPayload>({
      query: (payload) => ({
        url: '/products/create-product',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Product'],
    }),

    getAllProducts: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      ProductQueryParams
    >({
      query: (params) => ({
        url: "/products/get-all-products",
        params: {
          ...params,
          smells: params.smells ? params?.smells?.split(",").join(",") : undefined,
        },
      }),
      providesTags: ["Product"],
    }),

    getAllProductsAdmin: builder.query<
      { data: IProductResponse[]; meta: { page: number; limit: number; total: number; totalPage: number } },
      ProductQueryParams
    >({
      query: (params) => ({
        url: '/products/get-all-products/admin',
        params,
      }),
      providesTags: ['Product'],
    }),

    getProduct: builder.query<ApiResponse<IProductResponse>, string>({
      query: (id) => `/products/get-product/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Update Product (ADMIN)
    updateProduct: builder.mutation<ApiEnvelope<IProductResponse>, { id: string; payload: ProductPayload }>({
      query: ({ id, payload }) => ({
        url: `/products/update-product/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        'Product',
      ],
    }),

    // Delete Product (ADMIN)
    deleteProduct: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/products/delete-product/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    searchProducts: builder.query<ApiEnvelope<ProductSearchHit[]> & { meta?: { total: number; page: number; limit: number; totalPages: number } }, ProductQueryParams>({
      query: (params) => ({
        url: '/products/search-products',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Published sizes of one product (404 when it has none)
    getProductVariants: builder.query<ApiEnvelope<IProductVariantResponse[]>, string>({
      query: (productId) => `/products/get-product-variants/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Product', id: productId }],
    }),

    // Stock count change, no cost (ADMIN). Stock is per product in ml/gm.
    updateProductStock: builder.mutation<
      ApiEnvelope<IProductResponse>,
      { productId: string; addedStock: number; reason?: string }
    >({
      query: ({ productId, addedStock, reason }) => ({
        url: `/products/update-product-stock/${productId}`,
        method: 'PATCH',
        body: { addedStock, reason },
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        'Product',
      ],
    }),

    getBestSellers: builder.query<
      { success: boolean; statusCode: number; message: string; data: ITrendingProduct[] },
      void
    >({
      query: () => '/products/get-best-sellers',
      providesTags: ['Product'],
    }),

    getStockLogs: builder.query<ApiEnvelope<StockLog[]>, string>({
      query: (productId) => `/products/get-stock-logs/${productId}`,
      providesTags: ['Product'],
    }),

    // One cell of the Master Price Sheet
    quickUpdateCell: builder.mutation<
      ApiEnvelope<unknown>,
      {
        entity: 'PRODUCT' | 'VARIANT';
        id: string;
        field: string;
        value: string | number | boolean | null;
      }
    >({
      query: (body) => ({
        url: '/products/quick-cell-update',
        method: 'PATCH',
        body,
      }),
      // Optimistic / silent tag invalidation so typing doesn't cause full table flicker
      invalidatesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for usage in components
export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetAllProductsAdminQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useSearchProductsQuery,
  useGetProductVariantsQuery,
  useUpdateProductStockMutation,
  useGetBestSellersQuery,
  useGetStockLogsQuery,
  useQuickUpdateCellMutation,
} = productApi;

export default productApi;
