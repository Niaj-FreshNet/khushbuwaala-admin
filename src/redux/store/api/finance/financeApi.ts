import baseApi from "../baseApi";
import type { ApiEnvelope } from "@/types/investor.types";

export type CostCategory =
    | 'STOCK_BILL'
    | 'CARRYING'
    | 'BOTTLE'
    | 'PACKAGING'
    | 'LABEL'
    | 'COURIER'
    | 'COD_FEE'
    | 'GIFT_WRAP'
    | 'OTHER';

export interface CostLine {
    category: CostCategory;
    label?: string;
    amount: number;
}

export interface ReceiveStockPayload {
    quantity: number;
    unit?: string;
    supplier?: string;
    billNo?: string;
    note?: string;
    costLines: CostLine[];
}

/** GET /finance/analytics/summary (finance.service getFinancialSummary) */
export interface FinanceMetrics {
    grossSales: number; totalOrderDiscounts: number; totalRevenue: number; totalShippingCollected: number;
    totalCOGS: number; grossProfit: number; grossMarginPercentage: number;
    returnedCourierLoss: number; returnChargesCollected: number; netReturnLoss: number;
    freeShippingCourierCost: number; codFees: number; totalFulfillmentCosts: number;
    totalOperatingExpenses: number; netProfit: number; netMarginPercentage: number; totalInventoryInvestment: number;
}
export interface FinanceBreakdown {
    totalLiquidCost: number; totalPackagingCost: number; expenseCount: number; orderCount: number;
    returnedCount: number; courierReturnCount: number; missingCostItemCount: number;
    missingCostOrderCount: number; unsyncedOrderCount: number;
}
export interface FinancialSummary {
    period: { startDate: string; endDate: string };
    metrics: FinanceMetrics;
    breakdown: FinanceBreakdown;
}

/** GET /finance/ledger: one money movement */
export interface LedgerEntry {
    id: string;
    date: string;
    type: 'CREDIT' | 'DEBIT';
    source: string; // ORDER | RETURN | EXPENSE | PURCHASE
    description: string;
    method: string;
    amount: number;
    reference: string;
}
export interface LedgerResponse {
    metrics: { totalCredits: number; totalDebits: number; netCashFlow: number; transactionCount: number };
    data: LedgerEntry[];
}

export const financeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPackagingCosts: builder.query<{ data: { costLines: CostLine[], totalCost: number } }, string>({
            query: (sku) => `/finance/packaging/variant/${sku}`, // Adjust /v1 if your baseApi already includes it
            providesTags: ["Finance"],
        }),

        setPackagingCosts: builder.mutation<ApiEnvelope<unknown>, { sku: string; costLines: CostLine[] }>({
            query: ({ sku, costLines }) => ({
                url: `/finance/packaging/variant/${sku}`,
                method: "POST",
                body: { costLines },
            }),
            invalidatesTags: ["Finance"],
        }),

        getLiveWAC: builder.query<{ data: { avgCostPerUnit: number, lastCostPerUnit: number } }, string>({
            query: (productId) => `/finance/wac/${productId}`,
            providesTags: ["Finance"],
        }),

        receiveStockPurchase: builder.mutation<ApiEnvelope<unknown>, { productId: string; payload: ReceiveStockPayload }>({
            query: ({ productId, payload }) => ({
                url: `/finance/procurement/purchase/${productId}`,
                method: "POST",
                body: payload,
            }),
            // Invalidates both Finance and Product/Stock tags to trigger UI updates across the admin panel
            invalidatesTags: ["Finance", "Stock", "Product"],
        }),

        getFinancialSummary: builder.query<ApiEnvelope<FinancialSummary>, { startDate?: string; endDate?: string } | void>({
            query: (params) => {
                const queryArgs = new URLSearchParams();
                if (params?.startDate) queryArgs.append('startDate', params.startDate);
                if (params?.endDate) queryArgs.append('endDate', params.endDate);
                const queryStr = queryArgs.toString();
                return `/finance/analytics/summary${queryStr ? `?${queryStr}` : ''}`;
            },
            providesTags: ['Finance', 'Sales', 'Expenses'],
        }),

        backfillHistoricalCosts: builder.mutation<ApiEnvelope<unknown>, { orderIds?: string[] } | void>({
            query: (body) => ({
                url: '/finance/backfill-historical-costs',
                method: 'POST',
                body: body ?? {},
            }),
            invalidatesTags: ['Sales', 'Finance'],
        }),

        // ✅ Add manual profit override mutation
        overrideOrderProfit: builder.mutation<ApiEnvelope<unknown>, { orderId: string; profit: number }>({
            query: ({ orderId, ...body }) => ({
                url: `/finance/override-profit/${orderId}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Sales', 'Finance'],
        }),

        getLedger: builder.query<ApiEnvelope<LedgerResponse>, { startDate?: string; endDate?: string; type?: string } | void>({
      query: (params) => ({
        url: '/finance/ledger',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: ['Finance', 'Sales', 'Expenses'],
    }),

    }),
    overrideExisting: false,
});

export const {
    useGetPackagingCostsQuery,
    useSetPackagingCostsMutation,
    useGetLiveWACQuery,
    useReceiveStockPurchaseMutation,
    useGetFinancialSummaryQuery,
    useBackfillHistoricalCostsMutation,
    useOverrideOrderProfitMutation,
    useGetLedgerQuery,
} = financeApi;