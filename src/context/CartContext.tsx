"use client";

import { createContext, useContext, type ReactNode, useCallback } from "react";
import { useCart as useReduxCart } from "@/redux/store/hooks/useCart";
import type { IProductResponse } from "@/types/product.types";
import { CartItem } from "@/types/cart.types";

interface CartContextType {
  cartItems: CartItem[];
  checkoutItem: CartItem | null;
  checkoutMode: boolean;
  addToCart: (
    product: IProductResponse,
    quantity: number,
    selectedSize: string,
    selectedPrice: number
  ) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  setCheckoutOnlyItem: (
    product: IProductResponse,
    quantity: number,
    size: string,
    selectedPrice: number
  ) => void;
  proceedToCartCheckout: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const reduxCart = useReduxCart(); // from your redux slice

  // ✅ Recalculate subtotal with selectedPrice
  const calculateSubtotal = useCallback(() => {
    return reduxCart.cartItems.reduce((total, item) => {
      const price = item.selectedPrice ?? 0;
      return total + price * item.quantity;
    }, 0);
  }, [reduxCart.cartItems]);

  const calculateTotal = useCallback(() => calculateSubtotal(), [calculateSubtotal]);

  return (
    <CartContext.Provider
      value={{
        ...reduxCart,
        calculateSubtotal,
        calculateTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context || useReduxCart();
};
