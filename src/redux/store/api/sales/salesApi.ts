import baseApi from "../baseApi";

const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllSales: builder.query({
      query: (params) => ({
        url: "/sales/get-all-sales",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ['Sales'],
    }),


    //get user sales 
    getUserSales: builder.query({
      query: (id) => ({
        url: `/sales/get-user-sales/${id}`,
        method: "GET",
      }),
      providesTags: ['Sales'],
    }),


    // sale deatils api
    getUserSaleDetils: builder.query({
      query: (id) => ({
        url: `/sales/my-sales/${id}`,
        method: "GET",
      }),
      providesTags: ['Sales'],
    }),
    // admin sale deatils api 
    getAdminSaleDetils: builder.query({
      query: (id) => ({
        url: `/sales/get-user-sales/${id}`,
        method: "GET",
      }),
      providesTags: ['Sales'],
    }),

    // ✅ Full Update Sale API (PATCH)
    updateSales: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/sales/update-sale/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Sales'],
    }),

    // ✅ Delete Sale API (DELETE)
    deleteSale: builder.mutation({
      query: (id) => ({
        url: `/sales/delete-sale/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales'],
    }),

    // Add Sale API (POST)
    addSale: builder.mutation<any, any>({
      // Define the mutation for adding a sale
      query: (body) => ({
        url: "/sales/create-sale", // Backend route for adding sale
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"], // Invalidate 'Sales' to refetch all sales after adding
    }),

    // ✅ Get order by ID (Admin)
    getSaleById: builder.query({
      query: (id) => {
        if (!id || id.trim() === '') {
          throw new Error('Sale ID is required'); // Prevents empty requests
        }
        return {
          url: `/sales/get-sale-by-id/${id}`,
          method: "GET",
        };
      },
      providesTags: ['Sales'],
    }),

    getSalesByCustomer: builder.query({
      query: (phone: string) => ({
        url: `/sales/get-sales-by-customer/${phone}`,
        method: "GET",
      }),
      providesTags: ['Sales'],
    }),

  }),
  overrideExisting: false,

});

export const {

  useGetAllSalesQuery, // Export the query hook for fetching all Sales
  useGetUserSalesQuery,
  useGetUserSaleDetilsQuery,
  useGetAdminSaleDetilsQuery,
  useUpdateSalesMutation, // Export the update mutation hook
  useDeleteSaleMutation,
  useAddSaleMutation, // Export the new add sale mutation hook
  useGetSaleByIdQuery,
  useLazyGetSalesByCustomerQuery,
} = salesApi;

export default salesApi;