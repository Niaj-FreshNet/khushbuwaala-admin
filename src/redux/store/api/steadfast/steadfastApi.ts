import baseApi from '../../api/baseApi';
import type { ApiEnvelope } from '@/types/api.types';

/** POST /steadfast/send-order: Steadfast's booking (consignment) */
export type SteadfastBooking = { consignment_id?: number; tracking_code?: string; invoice?: string; status?: string; [k: string]: unknown };

export type CourierParcel = {
  consignmentId: number;
  invoice: string | null;
  trackingCode: string | null;
  codAmount: number;
  status: string;
  bookedAt: string | null;
  orderId: string | null;
  order: { id: string; invoice: string; status: string; isPaid: boolean; amount: number; courierReview: string | null } | null;
};

export type CourierPayout = {
  id: string;
  payoutId: string;
  amount: number;
  method: string | null;
  dueBills: number;
  charges: number;
  total: number;
  statusLabel: string;
  paidAt: string | null;
  readyAt: string | null;
  courierCreatedAt: string | null;
  parcelCount: number;
  matchedCount: number;
  parcels: CourierParcel[];
};

export type CourierSyncResult = {
  at: string;
  ok: boolean;
  ms: number;
  trigger: string;
  error?: string;
  changes: string[];
  openOrders?: { checked: number; changed: number };
  payouts?: { created: number; updated: number; parcelsApplied: number };
} | null;

export type CourierReviewOrder = {
  id: string;
  invoice: string;
  status: string;
  isPaid: boolean;
  amount: number;
  method: string | null;
  courierStatus: string | null;
  courierCodCollected: number | null;
  courierPayoutId: string | null;
  courierReview: string;
  orderTime: string;
  name: string | null;
};

export const steadfastApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // force: book again although the order already has a consignment (only after it was cancelled)
    sendOrderToSteadfast: builder.mutation<ApiEnvelope<SteadfastBooking>, string | { orderId: string; force?: boolean }>({
      query: (arg) => {
        const { orderId, force } = typeof arg === 'string' ? { orderId: arg, force: false } : arg;
        return { url: `/steadfast/send-order/${orderId}`, method: 'POST', body: force ? { force: true } : {} };
      },
      invalidatesTags: ['Order', 'Sales'],
    }),
    getSteadfastBalance: builder.query<ApiEnvelope<{ current_balance?: number; [k: string]: unknown }>, void>({
      query: () => '/steadfast/balance',
    }),

    // Courier settlement (payouts = "Cleared" in the Steadfast panel)
    getCourierPayouts: builder.query<
      { data: CourierPayout[]; meta: { page: number; limit: number; total: number; totalPage: number }; totals: Record<string, number | null>; lastSync: CourierSyncResult },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => `/steadfast/payouts?page=${page}&limit=${limit}`,
      providesTags: ['Courier'],
    }),
    getCourierReview: builder.query<{ data: CourierReviewOrder[] }, void>({
      query: () => '/steadfast/review',
      providesTags: ['Courier'],
    }),
    syncCourier: builder.mutation<{ success: boolean; message: string; data: CourierSyncResult }, { full?: boolean } | void>({
      query: (arg) => ({ url: '/steadfast/sync', method: 'POST', body: arg || {} }),
      invalidatesTags: ['Courier', 'Order', 'Sales', 'Finance', 'Product'],
    }),
    resolveCourierReview: builder.mutation<{ success: boolean; message?: string }, string>({
      query: (orderId) => ({ url: `/steadfast/review/${orderId}/resolve`, method: 'PATCH' }),
      invalidatesTags: ['Courier', 'Order'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useSendOrderToSteadfastMutation,
  useGetSteadfastBalanceQuery,
  useGetCourierPayoutsQuery,
  useGetCourierReviewQuery,
  useSyncCourierMutation,
  useResolveCourierReviewMutation,
} = steadfastApi;
