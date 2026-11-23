import { baseApi } from "../baseApi";
import type { ApiEnvelope, PageMeta } from "@/types/api.types";

/** A gateway payment (Prisma Payment + its order) */
export type PaymentRecord = {
    id: string;
    orderId?: string | null;
    amount: number;
    provider: string;
    status: 'INITIATED' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
    gatewayPaymentId?: string | null;
    gatewayTrxId?: string | null;
    createdAt: string;
    order?: { id: string; invoice: string } | null;
};

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
        getAllPaymentHistory: builder.query<ApiEnvelope<{ meta: PageMeta; data: PaymentRecord[] }>, Record<string, string | number | undefined> | void>({
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