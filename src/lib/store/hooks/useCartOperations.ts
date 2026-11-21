"use client";

import { useCallback } from "react";
import { useCart } from "@/redux/store/hooks/useCart";

/**
 * Thin adapter over the Redux cart hook, used by the CartBadge / CartButton
 * components. Keeps those components working without duplicating cart logic.
 */
export function useCartOperations() {
  const cart = useCart();
  const items: any[] = cart.cartItems as any[];

  const find = useCallback(
    (productId: string, size: string) =>
      items.find((i) => (i.product?.id ?? i.productId) === productId && i.selectedSize === size),
    [items]
  );

  const itemsCount = items.reduce((n, i) => n + (i.quantity ?? 0), 0);
  const subtotal = cart.calculateSubtotal();

  const isInCart = (productId: string, size: string) => !!find(productId, size);
  const getItemQuantity = (productId: string, size: string) => find(productId, size)?.quantity ?? 0;

  const addItemToCart = (product: any, quantity: number, size: string) => {
    const [sizeVal, sizeUnit] = String(size || "").split(" ");
    const variant = product?.variants?.find(
      (v: any) =>
        Number(v.size) === Number(sizeVal) &&
        String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
    );
    cart.addToCart(product, quantity, size, Number(variant?.price ?? product?.minPrice ?? 0));
  };

  const incrementQuantity = (productId: string, size: string) => {
    const item = find(productId, size);
    if (item) cart.updateQuantity(productId, size, item.quantity + 1, undefined, item.cartItemId);
  };

  const decrementQuantity = (productId: string, size: string) => {
    const item = find(productId, size);
    if (item && item.quantity > 1) cart.updateQuantity(productId, size, item.quantity - 1, undefined, item.cartItemId);
  };

  const removeItemFromCart = (productId: string, size: string) => {
    const item = find(productId, size);
    cart.removeFromCart(productId, size, undefined, item?.cartItemId);
  };

  return {
    itemsCount,
    subtotal,
    isInCart,
    getItemQuantity,
    addItemToCart,
    incrementQuantity,
    decrementQuantity,
    removeItemFromCart,
  };
}
