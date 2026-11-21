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
        // ---- Monthly profit share (SUPER_ADMIN) ----
        getProfitPreview: builder.query<any, { year: number; month: number }>({
            query: ({ year, month }) => ({ url: '/investor/profit-distributions', params: { year, month } }),
            providesTags: ['Finance'],
        }),
        approveProfitMonth: builder.mutation<any, { year: number; month: number }>({
            query: (body) => ({ url: '/investor/profit-distributions/approve', method: 'POST', body }),
            invalidatesTags: ['Finance', 'User'],
        }),
        // ---- Ledger access ----
        requestLedgerAccess: builder.mutation<any, { reason?: string }>({
            query: (body) => ({ url: '/investor/ledger-access/request', method: 'POST', body }),
            invalidatesTags: ['Finance'],
        }),
        getMyLedgerAccess: builder.query<any, void>({
            query: () => '/investor/ledger-access/me',
            providesTags: ['Finance'],
        }),
        getLedgerAccessRequests: builder.query<any, string | void>({
            query: (status) => ({ url: '/investor/ledger-access', params: status ? { status } : undefined }),
            providesTags: ['Finance'],
        }),
        decideLedgerAccess: builder.mutation<any, { id: string; status: 'APPROVED' | 'REJECTED'; hours?: number }>({
            query: ({ id, ...body }) => ({ url: `/investor/ledger-access/${id}`, method: 'PATCH', body }),
            invalidatesTags: ['Finance'],
        }),
        revokeLedgerAccess: builder.mutation<any, string>({
            query: (id) => ({ url: `/investor/ledger-access/${id}/revoke`, method: 'PATCH' }),
            invalidatesTags: ['Finance'],
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
    useGetProfitPreviewQuery,
    useApproveProfitMonthMutation,
    useRequestLedgerAccessMutation,
    useGetMyLedgerAccessQuery,
    useGetLedgerAccessRequestsQuery,
    useDecideLedgerAccessMutation,
    useRevokeLedgerAccessMutation,
} = investorApi;

export default investorApi;