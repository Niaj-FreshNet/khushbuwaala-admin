import baseApi from '../../api/baseApi'
import type {
  AddressInfo,
  Order,
  OrderLine,
  OrderListQuery,
  OrderListResponse,
  OrderSource,
  OrderStatus,
  SaleType,
} from '@/types/order.types'

export type { AddressInfo } from '@/types/order.types'

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/** Kept for the pages that already use these names */
export type OrderItemInfo = OrderLine;
export type IOrderData = Order;
export type IOrderResponse = ApiResponse<Order>;

export type IUpdateOrderPayload = {
  id: string;
  status?: OrderStatus;
  isPaid?: boolean;
  method?: string | null;
  orderSource?: OrderSource;
  saleType?: SaleType | null;
  shippingCost?: number;
  additionalNotes?: string | null;
  coupon?: string | null;
  discountAmount?: number;
  shipping?: AddressInfo;
  billing?: AddressInfo;
  salesmanId?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  amount?: number;
  customerId?: string | null;
  // Update quantities, remove lines (leave them out) and add new ones (no id)
  orderItems?: { id?: string; productId?: string; variantId?: string | null; size?: number; unit?: string; quantity: number; price?: number }[];
};

export type DashboardType = "all" | "website" | "manual";
type PeriodTotals = { orders: number; sales: number };

/** GET /order/dashboard/metrics */
export type DashboardMetrics = {
  type: DashboardType;
  today: PeriodTotals;
  thisWeek: PeriodTotals;
  thisMonth: PeriodTotals;
  last3Months: PeriodTotals;
};

/** One day of GET /order/dashboard/weekly-sales and /monthly-sales (date is dd-MM-yy, Dhaka) */
export type DailySalesRow = {
  date: string;
  totalSales: number;
  totalNetReceivable: number;
  totalOrders: number;
  orders: Order[];
};

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<OrderListResponse, OrderListQuery | void>({
      query: (params) => ({
        url: '/order/get-all-orders',
        params: params ?? undefined,
      }),
      providesTags: ['Order'],
    }),

    getOrderById: builder.query<IOrderResponse, string>({
      query: (id) => `/order/get-order-by-id/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order' as const, id }],
    }),

    updateOrderStatus: builder.mutation<IOrderResponse, { id: string; status: string; returnChargeCollected?: number | null }>({
      query: ({ id, status, returnChargeCollected }) => ({
        url: `/order/update-order-status/${id}`,
        method: 'PATCH',
        // returnChargeCollected: only for a courier parcel that came back (see components/admin/courierReturn.ts)
        body: returnChargeCollected === undefined ? { status } : { status, returnChargeCollected },
      }),
      invalidatesTags: ['Order'],
    }),

    updatePaymentStatus: builder.mutation<IOrderResponse, { id: string; isPaid: boolean }>({
      query: ({ id, isPaid }) => ({
        url: `/order/update-payment-status/${id}`,
        method: 'PATCH',
        body: { isPaid },
      }),
      invalidatesTags: ['Order'],
    }),

    updateOrder: builder.mutation<IOrderResponse, IUpdateOrderPayload>({
      query: ({ id, ...body }) => ({
        url: `/order/update-order/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Order"],
    }),

    getDashboardMetrics: builder.query<ApiResponse<DashboardMetrics>, { type?: DashboardType } | void>({
      query: (arg) => ({
        url: "/order/dashboard/metrics",
        params: arg?.type ? { type: arg.type } : undefined,
      }),
      providesTags: ["Order"],
    }),

    getWeeklySalesOverview: builder.query<ApiResponse<DailySalesRow[]>, { type?: DashboardType } | void>({
      query: (arg) => ({
        url: "/order/dashboard/weekly-sales",
        params: arg?.type ? { type: arg.type } : undefined,
      }),
      providesTags: ["Order"],
    }),

    getMonthlySalesOverview: builder.query<
      ApiResponse<DailySalesRow[]>,
      { type?: DashboardType; year?: number; month?: number } | void
    >({
      query: (arg) => ({
        url: "/order/dashboard/monthly-sales",
        params: {
          type: arg?.type || "all",
          ...(arg?.year ? { year: arg.year } : {}),
          ...(arg?.month ? { month: arg.month } : {}),
        },
      }),
      providesTags: ["Order"],
    }),

    deleteOrder: builder.mutation<ApiResponse<Order>, string>({
      query: (id) => ({
        url: `/order/delete-order/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useUpdateOrderMutation,
  useGetDashboardMetricsQuery,
  useGetWeeklySalesOverviewQuery,
  useGetMonthlySalesOverviewQuery,
  useDeleteOrderMutation,
} = orderApi
