import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  addToCart as addToCartAction,
  updateQuantity as updateQuantityAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
  setCheckoutOnlyItem as setCheckoutOnlyItemAction,
  proceedToCartCheckout as proceedToCartCheckoutAction,
  selectCartItems,
  selectCheckoutItem,
  selectCheckoutMode,
  selectCartLoading,
  selectCartError,
  selectAppliedCouponCode,
  setAppliedCouponCode as setAppliedCouponCodeAction,
  clearAppliedCouponCode as clearAppliedCouponCodeAction,
} from '../features/cart/cartSlice'
import type { IProductResponse } from '@/types/product.types'
import { useAddToCartMutation, useUpdateCartItemMutation, useRemoveCartItemMutation } from '@/redux/store/api/cart/cartApi'
import { useRouter } from 'next/navigation'
// import { toast } from 'sonner'

export const useCart = () => {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(selectCartItems)
  const checkoutItem = useAppSelector(selectCheckoutItem)
  const checkoutMode = useAppSelector(selectCheckoutMode)
  const isLoading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)
  const appliedCouponCode = useAppSelector(selectAppliedCouponCode)

  // RTK Query mutations (silent background API)
  const [addToCartApi] = useAddToCartMutation()
  const [updateCartItemApi] = useUpdateCartItemMutation()
  const [removeCartItemApi] = useRemoveCartItemMutation()

  const router = useRouter()

  // -------------------- CART ACTIONS --------------------
  const addToCart = useCallback(
    async (product: IProductResponse, quantity: number, selectedSize: string, selectedPrice: number) => {
      // 1. Optimistic UI update
      dispatch(addToCartAction({ product, quantity, selectedSize, selectedPrice }));

      try {
        const [sizeVal, sizeUnit] = String(selectedSize || "").split(" ");
        const variant = product?.variants?.find(
          (v) =>
            Number(v.size) === Number(sizeVal) &&
            String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
        );

        const response: any = await addToCartApi({
          productId: product.id,
          variantId: variant?.id || null,
          size: variant?.size ? Number(variant.size) : null,
          unit: variant?.unit || null,
          quantity,
        }).unwrap();

        // 👉 CRUCIAL FIX: Sync the TRUE database quantity and cartItemId back into Redux!
        if (response?.data?.id) {
          dispatch(
            updateQuantityAction({
              productId: product.id,
              selectedSize,
              quantity: response.data.quantity, // 👈 Takes the true DB quantity (e.g. 6, not 1)
              cartItemId: response.data.id,
            })
          );
        }
      } catch (err) {
        console.warn('Failed to sync add to cart API', err);
      }
    },
    [dispatch, addToCartApi]
  );

  const removeFromCart = useCallback(
    async (productId: string, size: string, productName?: string, cartItenId?: string) => {
      dispatch(removeFromCartAction({ productId, size }))
      // if (productName) toast.info(`${productName} removed from cart`)

      if (cartItenId) {
        try {
          await removeCartItemApi(cartItenId).unwrap()
        } catch (err) {
          console.warn('Failed to remove cart item API', err)
        }
      }
    },
    [dispatch, removeCartItemApi]
  )

  const updateQuantity = useCallback(
    async (productId: string, selectedSize: string, quantity: number, productName?: string, cartItemId?: string) => {
      dispatch(updateQuantityAction({ productId, selectedSize, quantity, cartItemId }))
      // if (productName) toast.success(`${productName} quantity updated to ${quantity}`)

      if (cartItemId) {
        try {
          await updateCartItemApi({ id: cartItemId, quantity }).unwrap()
        } catch (err) {
          console.warn('Failed to update cart item API', err)
        }
      }
    },
    [dispatch, updateCartItemApi]
  )

  // -------------------- CALCULATIONS --------------------
  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.selectedPrice ?? 0
      return total + price * item.quantity
    }, 0)
  }, [cartItems])

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal()
    const taxes = subtotal * 0.0
    return subtotal + taxes
  }, [calculateSubtotal])

  // -------------------- CHECKOUT / CLEAR --------------------
  const setCheckoutOnlyItem = useCallback(
    (product: IProductResponse, quantity: number, selectedSize: string, selectedPrice: number) => {
      const existing = cartItems.find(
        (item) => item.product?.id === product.id && item.selectedSize === selectedSize
      );

      dispatch(
        setCheckoutOnlyItemAction({
          product,
          quantity,
          selectedSize,
          selectedPrice,
        })
      );

      // If this product was already in their cart, reset its DB quantity to the single purchase quantity
      if (existing?.cartItemId) {
        updateCartItemApi({ id: existing.cartItemId, quantity: Math.max(1, quantity) }).catch(() => { });
      }

      router.push('/checkout');
    },
    [dispatch, cartItems, updateCartItemApi, router]
  );

  const proceedToCartCheckout = useCallback(() => {
    dispatch(proceedToCartCheckoutAction())
  }, [dispatch])

  const clearCart = useCallback(() => {
    dispatch(clearCartAction())
    // toast.info('Cart cleared!')
  }, [dispatch])

  const setAppliedCouponCode = useCallback(
    (code: string | null) => {
      dispatch(setAppliedCouponCodeAction(code))
    },
    [dispatch]
  )

  const clearAppliedCouponCode = useCallback(() => {
    dispatch(clearAppliedCouponCodeAction())
  }, [dispatch])

  return {
    cartItems,
    checkoutItem,
    checkoutMode,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateSubtotal,
    calculateTotal,
    setCheckoutOnlyItem,
    proceedToCartCheckout,
    clearCart,
    appliedCouponCode,
    setAppliedCouponCode,
    clearAppliedCouponCode,
  }
}
