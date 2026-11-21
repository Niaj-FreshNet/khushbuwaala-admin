{/*

  import { IProductAnalytics, IProductQuery, IProductResponse, IProductSearchResult, IRelatedProductsResponse, ITrendingProduct, LowStockProduct } from '@/types/product.types';
  import baseApi from './baseApi';
  
// Define query params type based on backend query parsing
interface ProductQueryParams extends Partial<IProductQuery> {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity';
  stock?: 'in' | 'out';
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
    createProduct: builder.mutation<IProductResponse, FormData>({
      query: (formData) => ({
        url: '/products/create-product',
        method: 'POST',
        body: formData,
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
        url: '/products/get-all-products',
        params,
      }),
      providesTags: ['Product'],
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
    getProduct: builder.query<IProductResponse, string>({
      query: (id) => `/products/get-product/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Update Product (ADMIN)
    updateProduct: builder.mutation<IProductResponse, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/products/update-product/${id}`,
        method: 'PATCH',
        body: formData,
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

    // Get Products by Category
    getProductsByCategoryId: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      { categoryId: string; params: ProductQueryParams }
    >({
      query: ({ categoryId, params }) => ({
        url: `/products/get-products-by-category/${categoryId}`,
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Related Products
    getRelatedProducts: builder.query<IRelatedProductsResponse, string>({
      query: (productId) => `/products/get-related-products/${productId}`,
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
    getBestsellers: builder.query<ITrendingProduct[], void>({
      query: () => '/products/get-bestsellers',
      providesTags: ['Product'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetAllProductsAdminQuery,
  useGetProductQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetTrendingProductsQuery,
  useGetNavbarProductsQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
  useGetProductsByCategoryIdQuery,
  useGetRelatedProductsQuery,
  useSearchProductsQuery,
  useGetProductVariantsQuery,
  useUpdateProductStockMutation,
  useGetProductAnalyticsQuery,
  useGetLowStockProductsQuery,
  useGetBestSellersQuery,
} = productApi;

export default productApi;
*/}


import { IProductAnalytics, IProductQuery, IProductResponse, IProductSearchResult, IRelatedProductsResponse, ITrendingProduct, LowStockProduct } from '@/types/product.types';
import baseApi from './baseApi';

// Define query params type based on backend query parsing
interface ProductQueryParams extends Partial<IProductQuery> {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity';
  stock?: 'in' | 'out';
}

// Define response types for specific endpoints
interface NavbarProductsResponse {
  trendingByCategory: Record<string, { id: string; name: string }[]>;
  overallTrending: { id: string; name: string }[];
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create Product (ADMIN)
    createProduct: builder.mutation<IProductResponse, FormData>({
      query: (formData) => ({
        url: '/products/create-product',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Product'],
    }),

    // Get All Products (Public)
    getAllProducts: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      ProductQueryParams
    >({
      query: (params) => ({
        url: '/products/get-all-products',
        params,
      }),
      providesTags: ['Product'],
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
    getProduct: builder.query<IProductResponse, string>({
      query: (id) => `/products/get-product/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Update Product (ADMIN)
    updateProduct: builder.mutation<IProductResponse, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/products/update-product/${id}`,
        method: 'PATCH',
        body: formData,
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

    // Get Products by Category
    getProductsByCategoryId: builder.query<
      { data: IProductResponse[]; meta: { total: number; totalPage: number } },
      { categoryId: string; params: ProductQueryParams }
    >({
      query: ({ categoryId, params }) => ({
        url: `/products/get-products-by-category/${categoryId}`,
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Related Products
    getRelatedProducts: builder.query<IRelatedProductsResponse, string>({
      query: (productId) => `/products/get-related-products/${productId}`,
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
        unit: string;
        size: number;
        price: number;
        stock?: number;
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
    getBestsellers: builder.query<
      { success: boolean; statusCode: number; message: string; data: ITrendingProduct[] },
      void
    >({
      query: () => '/products/get-bestsellers',
      providesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetAllProductsAdminQuery,
  useGetProductQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetTrendingProductsQuery,
  useGetNavbarProductsQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
  useGetProductsByCategoryIdQuery,
  useGetRelatedProductsQuery,
  useSearchProductsQuery,
  useGetProductVariantsQuery,
  useUpdateProductStockMutation,
  useGetProductAnalyticsQuery,
  useGetLowStockProductsQuery,
  useGetBestsellersQuery,
} = productApi;

export default productApi;