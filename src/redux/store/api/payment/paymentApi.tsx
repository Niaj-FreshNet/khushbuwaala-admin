import { baseApi } from "../baseApi";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // DGePay payment endpoint
        createDgepayPayment: builder.mutation<
            { success: boolean; paymentUrl: string; transactionId: string },
            { orderId: string; payToken: string }
        >({
            query: (body) => ({
                url: "/checkout/dgepay/create",
                method: "POST",
                body,
            }),
        }),

        // ✅ Add this endpoint to fetch payment history for the admin dashboard
        getAllPaymentHistory: builder.query<any, Record<string, any> | void>({
            query: (params) => ({
                url: "/payment/get-all-payment-history",
                method: "GET",
                params: params ?? undefined,
            }),
            providesTags: ["Order"],
        }),
    }),
});

export const {
    useCreateDgepayPaymentMutation,
    useGetAllPaymentHistoryQuery,
} = paymentApi;