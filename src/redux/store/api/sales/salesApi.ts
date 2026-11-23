import baseApi from "../baseApi";
import type { ApiEnvelope, PagedEnvelope } from "@/types/api.types";
import type { Order, OrderListQuery, OrderListResponse, OrderStatus, SaleType } from "@/types/order.types";

// A "sale" is an Order made in the admin (orderSource SHOWROOM / MANUAL / WHOLESALE).
// The unused per-salesman endpoints (get-user-sales, my-sales) were removed 2026-11-23.

/** POST /sales/create-sale (sales.service createSale) */
export type CreateSalePayload = {
  items: { productId: string; variantId?: string; quantity: number; price: number; originalPrice?: number }[];
  amount: number;
  isPaid: boolean;
  method?: string;
  saleBy?: string;
  saleType: SaleType;
  orderSource: 'SHOWROOM' | 'MANUAL' | 'WHOLESALE';
  platform?: string;
  platformNote?: string;
  status?: OrderStatus;
  saleTime?: string;
  discount?: number;
  deliveryCharge?: number;
  customerInfo?: { name?: string; phone?: string; address?: string; email?: string; reference?: string };
};

/** PATCH /sales/update-sale/:id: any subset of the sale's fields */
export type UpdateSalePayload = { id: string } & Record<string, unknown>;

const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSales: builder.query<OrderListResponse, OrderListQuery | void>({
      query: (params) => ({
        url: "/sales/get-all-sales",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ['Sales'],
    }),

    updateSales: builder.mutation<ApiEnvelope<Order | null>, UpdateSalePayload>({
      query: ({ id, ...body }) => ({
        url: `/sales/update-sale/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Sales'],
    }),

    deleteSale: builder.mutation<ApiEnvelope<Order | null>, string>({
      query: (id) => ({
        url: `/sales/delete-sale/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales'],
    }),

    addSale: builder.mutation<ApiEnvelope<Order | null>, CreateSalePayload>({
      query: (body) => ({
        url: "/sales/create-sale",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    getSaleById: builder.query<ApiEnvelope<Order | null>, string>({
      query: (id) => {
        if (!id || id.trim() === '') {
          throw new Error('Sale ID is required'); // Prevents empty requests
        }
        return {
          url: `/sales/get-sale-by-id/${id}`,
          method: "GET",
        };
      },
      providesTags: ['Sales'],
    }),

    // Earlier sales to this phone number (to fill in a returning customer)
    getSalesByCustomer: builder.query<ApiEnvelope<{ meta: PagedEnvelope<Order>['meta']; data: Order[] }>, string>({
      query: (phone) => ({
        url: `/sales/get-sales-by-customer/${phone}`,
        method: "GET",
      }),
      providesTags: ['Sales'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllSalesQuery,
  useUpdateSalesMutation,
  useDeleteSaleMutation,
  useAddSaleMutation,
  useGetSaleByIdQuery,
  useLazyGetSalesByCustomerQuery,
} = salesApi;

export default salesApi;
