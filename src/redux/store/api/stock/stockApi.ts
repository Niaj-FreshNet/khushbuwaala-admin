import baseApi from '../baseApi';

const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: ({ searchTerm, page, limit }) => ({
        url: '/stock/get-all-products',
        method: 'GET',
        params: {
          searchTerm,
          page: String(page),
          limit: String(limit),
        },
      }),
      providesTags: ['Stock'],
    }),
    getLowStockProducts: builder.query({
      query: ({ searchTerm, page, limit, threshold }) => ({
        url: '/stock/get-low-stock-products',
        method: 'GET',
        params: {
          searchTerm,
          page: String(page),
          limit: String(limit),
          threshold: String(threshold),
        },
      }),
      providesTags: ['Stock'],
    }),
    getStockLogs: builder.query({
      query: (productId) => ({
        url: `/stock/get-stock-logs/${productId}`,
        method: 'GET',
      }),
      providesTags: ['Stock'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllProductsQuery,
  useGetLowStockProductsQuery,
  useGetStockLogsQuery,
} = stockApi;

export default stockApi;