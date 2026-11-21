import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import type { Product } from '@/lib/Data/data'
import { IOrderResponse, orderApi } from '../../api/order/ordersApi'

// ✅ Define a cart-like item (local order content)
export interface CartLikeItem extends Product {
  quantity: number
  size: string
  variantPrices?: { [key: string]: number }
}

// ✅ Define local Order type for checkout
export interface Order {
  orderId: string
  cartItems: CartLikeItem[]
  subtotal: number
  discount?: number
  shippingCost: number
  estimatedTaxes: number
  total: number
  paymentMethod: 'cashOnDelivery' | 'sslCommerz'
  shippingMethod: 'insideDhaka' | 'outsideDhaka'
  postStatus: string
  paymentStatus: string
  notes?: string
  promoCode?: string | null
  contactInfo: { email?: string }
  shippingAddress: {
    name: string
    address: string
    district: string
    thana?: string
    contactNumber: string
  }
  billingAddress: {
    name: string
    address: string
    district: string
    thana?: string
    contactNumber: string
  }
  createdAt?: string
}

// ✅ Slice state
interface OrdersState {
  lastOrder?: Order | IOrderResponse
  byId: Record<string, Order | IOrderResponse>
  loading: boolean
  error?: string
}

const initialState: OrdersState = {
  lastOrder: undefined,
  byId: {},
  loading: false,
  error: undefined,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrder: (state, action: PayloadAction<Order | IOrderResponse>) => {
      const order = action.payload
      state.lastOrder = order
      state.byId[(order as any).orderId || (order as any).id] = order
    },
    clearLastOrder: (state) => {
      state.lastOrder = undefined
    },
  },
  extraReducers: (builder) => {
    // ✅ Create order
    builder
      .addMatcher(orderApi.endpoints.createOrder.matchPending, (state) => {
        state.loading = true
        state.error = undefined
      })
      .addMatcher(orderApi.endpoints.createOrder.matchFulfilled, (state, { payload }) => {
        state.loading = false
        state.lastOrder = payload
        const newId = (payload as any)?.data?.id ?? (payload as any)?.id
        if (newId) state.byId[newId] = payload
      })
      .addMatcher(orderApi.endpoints.createOrder.matchRejected, (state, { error }) => {
        state.loading = false
        state.error = error?.message || 'Failed to create order'
      })

    // ✅ Get my orders
    // builder
    //   .addMatcher(orderApi.endpoints.getMyOrders.matchFulfilled, (state, { payload }) => {
    //     payload.forEach((order) => {
    //       state.byId[order.id] = order
    //     })
    //   })
    builder
      .addMatcher(orderApi.endpoints.getMyOrders.matchFulfilled, (state, { payload }) => {
        const ordersArray: any[] = (payload as any)?.data?.data || [];
        ordersArray.forEach((order: any) => {
          state.byId[order.id] = order;
        });
      });
  },
})

export const { setOrder, clearLastOrder } = ordersSlice.actions

// ✅ Selectors
export const selectLastOrder = (state: RootState) => state.orders.lastOrder
export const selectOrderById =
  (orderId: string) =>
    (state: RootState): Order | IOrderResponse | undefined =>
      state.orders.byId[orderId]
export const selectOrderLoading = (state: RootState) => state.orders.loading
export const selectOrderError = (state: RootState) => state.orders.error

export default ordersSlice.reducer
