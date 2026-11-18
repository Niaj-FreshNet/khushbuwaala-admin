import baseApi from "../baseApi";

const investorApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getInvestorDashboard: builder.query({
            query: ({ startDate, endDate }: { startDate?: string; endDate?: string }) => ({
                url: '/investor/dashboard',
                method: 'GET',
                params: { startDate, endDate },
            }),
            providesTags: ['Finance'],
        }),
        requestWithdrawal: builder.mutation({
            query: (body: { amount: number; method: string; note?: string }) => ({
                url: '/investor/withdraw',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Finance'], // Force refetch to show pending withdrawal
        }),
        getAllInvestors: builder.query({
            query: () => ({
                url: '/investor/all',
                method: 'GET',
            }),
            providesTags: ['Finance', 'User'], // Invalidate if user data changes
        }),
        updateInvestor: builder.mutation({
            query: ({ id, data }: { id: string, data: any }) => ({
                url: `/investor/update/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Finance', 'User'],
        }),
        getAllWithdrawals: builder.query({
            query: (status?: string) => ({
                url: '/investor/withdrawals',
                method: 'GET',
                params: status && status !== 'ALL' ? { status } : undefined
            }),
            providesTags: ['Finance', 'User'],
        }),
        updateWithdrawalStatus: builder.mutation({
            query: ({ id, data }: { id: string, data: { status: string; reference?: string } }) => ({
                url: `/investor/withdrawals/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Finance', 'User'], // Refresh balances immediately
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetInvestorDashboardQuery,
    useRequestWithdrawalMutation,
    useGetAllInvestorsQuery,
    useUpdateInvestorMutation,
    useGetAllWithdrawalsQuery,
    useUpdateWithdrawalStatusMutation,
} = investorApi;

export default investorApi;