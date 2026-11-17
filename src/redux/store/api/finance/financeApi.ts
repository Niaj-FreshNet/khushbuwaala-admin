import baseApi from "../baseApi";

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

export const financeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPackagingCosts: builder.query<{ data: { costLines: CostLine[], totalCost: number } }, string>({
            query: (sku) => `/finance/packaging/variant/${sku}`, // Adjust /v1 if your baseApi already includes it
            providesTags: ["Finance"],
        }),

        setPackagingCosts: builder.mutation<any, { sku: string; costLines: CostLine[] }>({
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

        receiveStockPurchase: builder.mutation<any, { productId: string; payload: ReceiveStockPayload }>({
            query: ({ productId, payload }) => ({
                url: `/finance/procurement/purchase/${productId}`,
                method: "POST",
                body: payload,
            }),
            // Invalidates both Finance and Product/Stock tags to trigger UI updates across the admin panel
            invalidatesTags: ["Finance", "Stock", "Product"],
        }),

        getFinancialSummary: builder.query<{ data: any }, { startDate?: string; endDate?: string } | void>({
            query: (params) => {
                const queryArgs = new URLSearchParams();
                if (params?.startDate) queryArgs.append('startDate', params.startDate);
                if (params?.endDate) queryArgs.append('endDate', params.endDate);
                const queryStr = queryArgs.toString();
                return `/finance/analytics/summary${queryStr ? `?${queryStr}` : ''}`;
            },
            providesTags: ['Finance', 'Sales', 'Expenses'],
        }),

        backfillHistoricalCosts: builder.mutation<any, { orderIds?: string[] } | void>({
            query: (body) => ({
                url: '/finance/backfill-historical-costs',
                method: 'POST',
                body: body ?? {},
            }),
            invalidatesTags: ['Sales', 'Finance'],
        }),

        // ✅ Add manual profit override mutation
        overrideOrderProfit: builder.mutation<any, { orderId: string; profit: number }>({
            query: ({ orderId, ...body }) => ({
                url: `/finance/override-profit/${orderId}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Sales', 'Finance'],
        }),

        getLedger: builder.query({
      query: (params?: { startDate?: string; endDate?: string; type?: string }) => ({
        url: '/finance/ledger',
        method: 'GET',
        params,
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