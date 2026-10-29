"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { IProduct, IProductVariant } from "@/types/product.types";

interface ProductSelectionContextValue {
  selectedVariant: IProductVariant | null;
  setSelectedVariant: React.Dispatch<React.SetStateAction<IProductVariant | null>>;

  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;

  isWishlisted: boolean;
  toggleWishlist: () => void;
}

const ProductSelectionContext = createContext<ProductSelectionContextValue | undefined>(
  undefined
);

function getDefaultVariant(product: IProduct): IProductVariant | null {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  const getNumericSize = (v: any) => {
    const raw = v?.size ?? v?.title ?? v?.name ?? "";
    const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : Infinity;
  };

  // Sort ascending by numeric size (fallback to price)
  const sorted = [...variants].sort((a: any, b: any) => {
    const sA = getNumericSize(a);
    const sB = getNumericSize(b);
    if (sA !== sB) return sA - sB;
    return Number(a?.price ?? 0) - Number(b?.price ?? 0);
  });

  // Pick the 2nd lowest variant (index 1), fallback to index 0 if only 1 exists
  return sorted[1] ?? sorted[0] ?? null;
}

export function ProductSelectionProvider({
  product,
  children,
}: {
  product: IProduct;
  children: ReactNode;
}) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);

  useEffect(() => {
    setSelectedVariant(defaultVariant);
  }, [defaultVariant]);

  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(
    defaultVariant
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  const toggleWishlist = () => setIsWishlisted((prev) => !prev);

  const value = useMemo<ProductSelectionContextValue>(
    () => ({
      selectedVariant,
      setSelectedVariant,
      quantity,
      setQuantity,
      isWishlisted,
      toggleWishlist,
    }),
    [selectedVariant, quantity, isWishlisted]
  );

  return (
    <ProductSelectionContext.Provider value={value}>
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelectionOptional() {
  return useContext(ProductSelectionContext);
}

export function useProductSelection() {
  const ctx = useContext(ProductSelectionContext);
  if (!ctx)
    throw new Error(
      "useProductSelection must be used within a ProductSelectionProvider"
    );
  return ctx;
}
