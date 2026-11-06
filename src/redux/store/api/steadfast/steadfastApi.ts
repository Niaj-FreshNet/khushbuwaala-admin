import baseApi from '../../api/baseApi';

export const steadfastApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOrderToSteadfast: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/steadfast/send-order/${orderId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),
    getSteadfastBalance: builder.query<any, void>({
      query: () => '/steadfast/balance',
    }),
  }),
  overrideExisting: true,
});

export const {
  useSendOrderToSteadfastMutation,
  useGetSteadfastBalanceQuery,
} = steadfastApi;