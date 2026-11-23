import baseApi from "../baseApi";
import type {
    ApiEnvelope,
    InvestorDashboard,
    InvestorRecord,
    InvestorUpdate,
    InvestorWithdrawal,
    LedgerAccessRequest,
    LedgerAccessRequestRow,
    MyLedgerAccess,
    ProfitApproval,
    ProfitPreview,
    WithdrawalWithInvestor,
} from "@/types/investor.types";

const investorApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getInvestorDashboard: builder.query<ApiEnvelope<InvestorDashboard>, { startDate?: string; endDate?: string }>({
            query: ({ startDate, endDate }) => ({
                url: '/investor/dashboard',
                method: 'GET',
                params: { startDate, endDate },
            }),
            providesTags: ['Finance'],
        }),
        requestWithdrawal: builder.mutation<ApiEnvelope<InvestorWithdrawal>, { amount: number; method: string; note?: string }>({
            query: (body) => ({
                url: '/investor/withdraw',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Finance'], // Force refetch to show pending withdrawal
        }),
        getAllInvestors: builder.query<ApiEnvelope<InvestorRecord[]>, void>({
            query: () => ({
                url: '/investor/all',
                method: 'GET',
            }),
            providesTags: ['Finance', 'User'], // Invalidate if user data changes
        }),
        updateInvestor: builder.mutation<ApiEnvelope<InvestorRecord>, { id: string; data: InvestorUpdate }>({
            query: ({ id, data }) => ({
                url: `/investor/update/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Finance', 'User'],
        }),
        getAllWithdrawals: builder.query<ApiEnvelope<WithdrawalWithInvestor[]>, string | void>({
            query: (status) => ({
                url: '/investor/withdrawals',
                method: 'GET',
                params: status && status !== 'ALL' ? { status } : undefined
            }),
            providesTags: ['Finance', 'User'],
        }),
        updateWithdrawalStatus: builder.mutation<ApiEnvelope<InvestorWithdrawal>, { id: string; data: { status: string; reference?: string } }>({
            query: ({ id, data }) => ({
                url: `/investor/withdrawals/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Finance', 'User'], // Refresh balances immediately
        }),
        // ---- Monthly profit share (SUPER_ADMIN) ----
        getProfitPreview: builder.query<ApiEnvelope<ProfitPreview>, { year: number; month: number }>({
            query: ({ year, month }) => ({ url: '/investor/profit-distributions', params: { year, month } }),
            providesTags: ['Finance'],
        }),
        approveProfitMonth: builder.mutation<ApiEnvelope<ProfitApproval>, { year: number; month: number }>({
            query: (body) => ({ url: '/investor/profit-distributions/approve', method: 'POST', body }),
            invalidatesTags: ['Finance', 'User'],
        }),
        // ---- Ledger access ----
        requestLedgerAccess: builder.mutation<ApiEnvelope<LedgerAccessRequest>, { reason?: string }>({
            query: (body) => ({ url: '/investor/ledger-access/request', method: 'POST', body }),
            invalidatesTags: ['Finance'],
        }),
        getMyLedgerAccess: builder.query<ApiEnvelope<MyLedgerAccess>, void>({
            query: () => '/investor/ledger-access/me',
            providesTags: ['Finance'],
        }),
        getLedgerAccessRequests: builder.query<ApiEnvelope<LedgerAccessRequestRow[]>, string | void>({
            query: (status) => ({ url: '/investor/ledger-access', params: status ? { status } : undefined }),
            providesTags: ['Finance'],
        }),
        decideLedgerAccess: builder.mutation<ApiEnvelope<LedgerAccessRequest>, { id: string; status: 'APPROVED' | 'REJECTED'; hours?: number }>({
            query: ({ id, ...body }) => ({ url: `/investor/ledger-access/${id}`, method: 'PATCH', body }),
            invalidatesTags: ['Finance'],
        }),
        revokeLedgerAccess: builder.mutation<ApiEnvelope<LedgerAccessRequest>, string>({
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
