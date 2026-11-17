import { IProductAnalytics, IProductQuery, IProductResponse, IProductSearchResult, IRelatedProductsResponse, ITrendingProduct, LowStockProduct, StockLog } from "@/types/product.types";
import baseApi from "../baseApi";

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
  // Add other query fields as needed (e.g., brand, category, price range)
}

// Define response types for specific endpoints
interface NavbarProductsResponse {
  trendingByCategory: Record<string, { id: string; name: string }[]>;
  overallTrending: { id: string; name: string }[];
}

// Define the product API slice
export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create Product (ADMIN)
    createProduct: builder.mutation<IProductResponse, any>({
      query: (payload) => ({
        url: '/products/create-product',
        method: 'POST',
        body: payload,
        headers: {
          // Remove Content-Type header to let browser set multipart/form-data with boundary
        },
      }),
      invalidatesTags: ['Product'],
    }),

    // Get All Products (Public)
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

    // Get All Products (Admin)
    getAllProductsAdmin: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      ProductQueryParams
    >({
      query: (params) => ({
        url: '/products/get-all-products/admin',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Single Product
    getProduct: builder.query<ApiResponse<IProductResponse>, string>({
      query: (id) => `/products/get-product/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Get Single Product By Slug
    getProductBySlug: builder.query<ApiResponse<IProductResponse>, string>({
      query: (slug) => `/products/get-product-by-slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Product", slug }],
    }),

    // Update Product (ADMIN)
    updateProduct: builder.mutation<IProductResponse, { id: string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/products/update-product/${id}`,
        method: 'PATCH',
        body: payload,
        headers: {
          // Remove Content-Type header for multipart/form-data
        },
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

    // Get Trending Products
    getTrendingProducts: builder.query<ITrendingProduct[], void>({
      query: () => '/products/get-trending-products',
      providesTags: ['Product'],
    }),

    // Get Navbar Products
    getNavbarProducts: builder.query<NavbarProductsResponse, void>({
      query: () => '/products/get-navbar-products',
      providesTags: ['Product'],
    }),

    // Get Featured Products
    getFeaturedProducts: builder.query<IProductResponse[], void>({
      query: () => '/products/get-featured-products',
      providesTags: ['Product'],
    }),

    // Get New Arrivals
    getNewArrivals: builder.query<IProductResponse[], void>({
      query: () => '/products/get-new-arrivals',
      providesTags: ['Product'],
    }),

    // Get Products by Category Id
    getProductsByCategoryId: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      { categoryId: string; params: ProductQueryParams }
    >({
      query: ({ categoryId, params }) => ({
        url: `/products/get-products-by-category-id/${categoryId}`,
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Products by Category Name (NOT WORKING)
    getProductsByCategoryName: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      { categoryName: string; params: ProductQueryParams }
    >({
      query: ({ categoryName, params }) => ({
        url: `/products/get-products-by-category-name/${categoryName}`,
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Related Products
    getRelatedProducts: builder.query<IRelatedProductsResponse, string>({
      query: (productId) => `/products/get-related-products/${productId}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Product'],
    }),

    // Search Products
    searchProducts: builder.query<IProductSearchResult, ProductQueryParams>({
      query: (params) => ({
        url: '/products/search-products',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Product Variants
    getProductVariants: builder.query<
      Array<{
        id: string;
        sku: string;
        size: number;
        // unit: Unit;
        unit: string;
        price: number;
        stock: number;
      }>,
      string
    >({
      query: (productId) => `/products/get-product-variants/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Product', id: productId }],
    }),

    // Update Product Stock (ADMIN)
    updateProductStock: builder.mutation<
      IProductResponse,
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

    // Get Product Analytics (ADMIN)
    getProductAnalytics: builder.query<IProductAnalytics, void>({
      query: () => '/products/get-product-analytics',
      providesTags: ['Product'],
    }),

    // Get Low Stock Products (ADMIN)
    getLowStockProducts: builder.query<LowStockProduct[], { threshold?: number }>({
      query: ({ threshold = 10 }) => ({
        url: '/products/get-low-stock-products',
        params: { threshold },
      }),
      providesTags: ['Product'],
    }),

    // Get Bestsellers
    getBestSellers: builder.query<
      { success: boolean; statusCode: number; message: string; data: ITrendingProduct[] },
      void
    >({
      query: () => '/products/get-best-sellers',
      providesTags: ['Product'],
    }),

    // New endpoint for stock logs
    getStockLogs: builder.query<StockLog[], string>({
      query: (productId) => `/products/get-stock-logs/${productId}`,
      providesTags: ['Product'],
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
  useGetProductBySlugQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetTrendingProductsQuery,
  useGetNavbarProductsQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
  useGetProductsByCategoryIdQuery,
  useGetProductsByCategoryNameQuery,
  useGetRelatedProductsQuery,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
  useGetProductVariantsQuery,
  useUpdateProductStockMutation,
  useGetProductAnalyticsQuery,
  useGetLowStockProductsQuery,
  useGetBestSellersQuery,
  useGetStockLogsQuery,
} = productApi;

export default productApi;