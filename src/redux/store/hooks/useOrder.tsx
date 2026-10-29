'use client'

import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { useCallback } from 'react'

import {
  setOrder,
  clearLastOrder,
  selectLastOrder,
  selectOrderById,
  selectOrderLoading,
  selectOrderError,
} from '../features/orders/ordersSlice'

import {
  IOrderPayload,
  IOrderResponse,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
} from '../api/order/ordersApi'

export const useOrder = () => {
  const dispatch = useDispatch()

  // ✅ Redux selectors
  const lastOrder = useSelector(selectLastOrder)
  const loading = useSelector(selectOrderLoading)
  const error = useSelector(selectOrderError)

  // ✅ RTK Query hooks
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation()
  const { data: myOrders, isLoading: isFetchingMyOrders, refetch: refetchMyOrders } =
    useGetMyOrdersQuery(undefined, { refetchOnMountOrArgChange: true })

  // ✅ Action: Create Order
  const handleCreateOrder = useCallback(
    async (payload: IOrderPayload): Promise<IOrderResponse> => {
      try {
        const res = await createOrder(payload).unwrap()

        // ✅ Use API response directly to ensure all required fields exist
        dispatch(setOrder(res))

        // ❌ REMOVED: toast.success('Order placed successfully!')
        // Toast is now triggered conditionally in CheckoutPage based on payment method.

        return res
      } catch (err: any) {
        console.error(err)
        toast.error(err?.data?.message || 'Failed to create order')
        throw err
      }
    },
    [createOrder, dispatch]
  )

  // ✅ Action: Clear last order
  const handleClearLastOrder = useCallback(() => {
    dispatch(clearLastOrder())
  }, [dispatch])

  // ✅ Selector helper for order by ID
  const getOrderById = useCallback(
    (orderId: string) => useSelector(selectOrderById(orderId)),
    []
  )

  return {
    // ✅ Data
    lastOrder,
    loading: loading || isCreating,
    error,
    myOrders,
    isFetchingMyOrders,
    getOrderById,

    // ✅ Actions
    handleCreateOrder,
    handleClearLastOrder,
    refetchMyOrders,
  }
}