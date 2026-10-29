import baseApi from '../../api/baseApi'

// Types
export interface IOrderPayload {
  cartItemIds: string[]
  amount: number
  isPaid?: boolean
  orderSource?: 'WEBSITE' | 'ADMIN_PANEL'
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
    address?: string
  }
}

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AddressInfo = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  district?: string | null;
  thana?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type OrderItemInfo = {
  id: string;
  userId?: string;
  productId: string;
  variantId: string;
  size: number;
  unit: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  status?: string;
  orderId?: string;
  product?: {
    id: string;
    name: string;
    primaryImage?: string;
  };
  variant?: {
    id: string;
    productId: string;
    sku: string;
    unit: string;
    size: number;
    price: number;
  };
};

export type IOrderData = {
  id: string;
  invoice: string;
  orderTime: string;
  payToken?: string;
  amount: number;
  isPaid: boolean;
  method?: string | null;
  cartItems?: any[];
  status: string;
  orderSource: string;
  productIds?: string[];
  coupon?: string | null;
  discountAmount?: number;
  customerId?: string | null;
  shippingCost?: number;
  additionalNotes?: string | null;
  shipping?: AddressInfo;
  billing?: AddressInfo;
  salesmanId?: string | null;
  saleType?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  orderItems?: OrderItemInfo[];
};

export type IOrderResponse = ApiResponse<IOrderData>;

export interface IPaginatedResponse<T> {
  meta: {
    page: number
    limit: number
    total: number
  }
  data: T[]
}

export type IUpdateOrderPayload = {
  id: string;
  status?: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELED" | "RETURNED";
  isPaid?: boolean;
  method?: string | null;
  orderSource?: "WEBSITE" | "SHOWROOM" | "WHOLESALE" | "MANUAL";
  saleType?: "SINGLE" | "BULK" | null;
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
  // ✅ Support updating quantities, removing items, and adding new ones
  orderItems?: { id?: string; productId?: string; variantId?: string; quantity: number }[];
};

export type DashboardMetrics = {
  todayOrders: number;
  monthOrders: number;
  monthSales: number;
  totalSales: number;
};

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<IOrderResponse, IOrderPayload>({
      query: (body) => ({
        url: '/order/create-order',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),

    getAllOrders: builder.query<IPaginatedResponse<IOrderResponse>, Record<string, any> | void>({
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

    updateOrderStatus: builder.mutation<IOrderResponse, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/order/update-order-status/${id}`,
        method: 'PATCH',
        body: { status },
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

    getAllCustomers: builder.query<IPaginatedResponse<any>, Record<string, any> | void>({
      query: (params) => ({
        url: '/order/get-all-customers',
        params: params ?? undefined,
      }),
      providesTags: ['User'],
    }),

    getUserOrders: builder.query<IOrderResponse[], string>({
      query: (userId) => `/order/get-user-order/${userId}`,
      providesTags: ['Order'],
    }),

    getMyOrders: builder.query<IOrderResponse[], void>({
      query: () => '/order/my-orders',
      providesTags: ['Order'],
    }),

    getMyOrderById: builder.query<IOrderResponse, string>({
      query: (id) => `/order/my-order/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order' as const, id }],
    }),

    getDashboardMetrics: builder.query<ApiResponse<DashboardMetrics & { type: string }>, { type?: "all" | "website" | "manual" } | void>({
      query: (arg) => ({
        url: "/order/dashboard/metrics",
        params: arg?.type ? { type: arg.type } : undefined,
      }),
      providesTags: ["Order"],
    }),

    getWeeklySalesOverview: builder.query<
      ApiResponse<{ day: string; sales: number; orders: number }[]>,
      { type?: "all" | "website" | "manual" } | void
    >({
      query: (arg) => ({
        url: "/order/dashboard/weekly-sales",
        params: arg?.type ? { type: arg.type } : undefined,
      }),
      providesTags: ["Order"],
    }),

    trackOrders: builder.query<ApiResponse<any[]>, string>({
      query: (query) => `/order/track/${encodeURIComponent(query)}`,
      providesTags: ["Order"],
    }),

    deleteOrder: builder.mutation<ApiResponse<any>, string>({
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
  useCreateOrderMutation,
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useUpdatePaymentStatusMutation,
  useUpdateOrderMutation,
  useGetAllCustomersQuery,
  useGetUserOrdersQuery,
  useGetMyOrdersQuery,
  useGetMyOrderByIdQuery,
  useGetDashboardMetricsQuery,
  useGetWeeklySalesOverviewQuery,
  useLazyTrackOrdersQuery,
  useDeleteOrderMutation,
} = orderApi