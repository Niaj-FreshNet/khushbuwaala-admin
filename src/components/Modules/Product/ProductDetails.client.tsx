"use client";

import React, { useMemo, useState, useTransition, useCallback, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useProductSelectionOptional } from "@/context/ProductSelectionContext";
import { IDiscount, IProduct, IProductVariant } from "@/types/product.types";
import { useRouter } from "next/navigation";
import ProductDetailsUI from "./ProductDetailsUI.server";
import flyToCart from "./FlyToCart";
import { kwPushAddToCart, kwPushBeginCheckout } from "@/lib/Analytics/kwEcom";

export default function ProductDetailsClient({
  product,
}: {
  product: Partial<IProduct>;
}) {
  const cart = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // keep your selection context support
  const selection = useProductSelectionOptional();

  // Safe numeric extractor for sizes (handles 6, "6", "6ml", "100", etc.)
  const getNumericSize = (v: any) => {
    const raw = v?.size ?? v?.title ?? v?.name ?? "";
    const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : Infinity;
  };

  const sortedVariants = useMemo(() => {
    return [...(product.variants ?? [])].sort((a: any, b: any) => {
      const sA = getNumericSize(a);
      const sB = getNumericSize(b);
      if (sA !== sB) return sA - sB;
      return Number(a?.price ?? 0) - Number(b?.price ?? 0);
    });
  }, [product.variants]);

  const availableVariants = useMemo(() => sortedVariants.slice(0, 4), [sortedVariants]);

  function pickLowestPriceVariant(product: any) {
    if (!sortedVariants.length) return null;
    // Pick 2nd lowest variant (index 1), fallback to index 0
    return sortedVariants[1] ?? sortedVariants[0] ?? null;
  }

  function safeUnit(unit: any) {
    return String(unit || "").trim().toLowerCase();
  }

  const lowestPriceVariant = useMemo(() => {
    return pickLowestPriceVariant(product as any) as IProductVariant | null;
  }, [product, sortedVariants]);

  const [fallbackSelected, setFallbackSelected] = useState<IProductVariant | null>(null);

  const [fallbackQuantity, setFallbackQuantity] = useState(1);

  const quantity =
    typeof selection?.quantity === "number" && selection.quantity > 0
      ? selection.quantity
      : fallbackQuantity;

  const setQuantity = selection?.setQuantity ?? setFallbackQuantity;

  // Effective variant prioritizes user selection context, then fallback, then lowestPriceVariant
  const effectiveVariant = selection?.selectedVariant ?? fallbackSelected ?? lowestPriceVariant;

  const selectedSizeLabel = effectiveVariant
    ? `${String(effectiveVariant.size).trim()} ${safeUnit(effectiveVariant.unit)}`
    : "6 ml";

  const currentPrice = effectiveVariant?.price ?? product.minPrice ?? 0;

  const { discount, discountedPrice } = useMemo(() => {
    const now = new Date();

    const productDiscounts: IDiscount[] =
      ((product as any)?.discounts as IDiscount[]) ??
      ((product as any)?.Discounts as IDiscount[]) ??
      ((product as any)?.productDiscounts as IDiscount[]) ??
      [];

    const variantDiscounts: IDiscount[] =
      ((effectiveVariant as any)?.discounts as IDiscount[]) ??
      ((effectiveVariant as any)?.Discounts as IDiscount[]) ??
      [];

    const isActiveAuto = (d: any) => {
      if (!d) return false;
      if (d.code && String(d.code).trim() !== "") return false; // hide coupon discounts
      const startOk = !d.startDate || new Date(d.startDate) <= now;
      const endOk = !d.endDate || new Date(d.endDate) >= now;
      return startOk && endOk;
    };

    const active = variantDiscounts.find(isActiveAuto) || productDiscounts.find(isActiveAuto) || null;

    let final = currentPrice;

    if (active) {
      if (active.type === "percentage") final = currentPrice * (1 - active.value / 100);
      else if (active.type === "fixed") final = currentPrice - active.value;
    }

    final = Math.max(0, Math.round(final));
    return { discount: active as IDiscount | null, discountedPrice: final };
  }, [product, effectiveVariant, currentPrice]);

  // const isOutOfStock = (product.totalStock ?? 0) <= 0;
  const isOutOfStock = false; // OUT OF STOCK - disabled

  const onSelectVariant = useCallback(
    (variant: IProductVariant) => {
      if (selection) selection.setSelectedVariant(variant);
      else setFallbackSelected(variant);
    },
    [selection]
  );

  const onQtyDec = useCallback(() => setQuantity((q) => Math.max(1, q - 1)), [setQuantity]);
  const onQtyInc = useCallback(() => setQuantity((q) => Math.min(10, q + 1)), [setQuantity]);

  const onReadMore = useCallback(() => {
    const el = document.getElementById("product-accordion");

    // If not found, just open description (fallback)
    if (!el) {
      window.dispatchEvent(new Event("kw:open-description"));
      return;
    }

    // ✅ offset for sticky navbar (adjust if needed)
    const offset = 10;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    // ✅ scroll first
    window.scrollTo({ top, behavior: "smooth" });

    // ✅ then open after scroll begins (prevents layout shift cancelling scroll)
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.dispatchEvent(new Event("kw:open-description"));
      }, 500);
    });
  }, []);

  const onAddToCart = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (/* isOutOfStock || */ isAddingToCart || isBuyingNow) return;

      setIsAddingToCart(true);
      try {
        // ✅ fly animation first (from button → cart icon)
        flyToCart(e.currentTarget, (product as any)?.primaryImage);

        // If addToCart is sync, this still gives user feedback for a moment
        cart?.addToCart?.(product as any, quantity, selectedSizeLabel, discountedPrice);

        // ✅ TRACK: add_to_cart (GA4 + Meta via GTM)
        kwPushAddToCart({
          currency: "BDT",
          value: discountedPrice * quantity,
          items: [
            {
              item_id: String((product as any).id || (product as any).slug),
              item_name: String((product as any).name || ""),
              item_brand: String((product as any).brand || "Khushbuwaala"),
              item_category: String((product as any).categoryId || ""),
              item_variant: selectedSizeLabel, // ✅ variant
              price: discountedPrice,
              quantity,
            },
          ],
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("kw:cart-added"));
        }

        // tiny UX delay so spinner is actually visible (optional but recommended)
        await new Promise((r) => setTimeout(r, 1000));
      } finally {
        setIsAddingToCart(false);
      }
    }, [cart, product, quantity, selectedSizeLabel, discountedPrice, /* isOutOfStock, */ isAddingToCart, isBuyingNow]);

  const onBuyNow = useCallback(async () => {
    if (/* isOutOfStock || */ isBuyingNow || isAddingToCart) return;

    setIsBuyingNow(true);
    try {
      cart?.addToCart?.(product as any, quantity, selectedSizeLabel, discountedPrice);

      // ✅ TRACK begin_checkout from Buy Now (single-item checkout intent)
      kwPushBeginCheckout({
        currency: "BDT",
        value: discountedPrice * quantity,
        items: [
          {
            item_id: String((product as any).id || (product as any).slug),
            item_name: String((product as any).name || ""),
            item_brand: String((product as any).brand || "Khushbuwaala"),
            item_category: String((product as any).categoryId || ""),
            item_variant: selectedSizeLabel,
            price: discountedPrice,
            quantity,
          },
        ],
      });

      await new Promise((r) => setTimeout(r, 500));
      startTransition(() => router.push("/checkout"));
    } finally {
      setIsBuyingNow(false);
    }
  }, [cart, product, quantity, selectedSizeLabel, discountedPrice, router, startTransition, /* isOutOfStock, */ isBuyingNow, isAddingToCart]);

  const getActiveAutoDiscountForVariant = useCallback(
    (variant?: IProductVariant): IDiscount | null => {
      const now = new Date();

      const productDiscounts: IDiscount[] =
        ((product as any)?.discounts as IDiscount[]) ??
        ((product as any)?.Discounts as IDiscount[]) ??
        ((product as any)?.productDiscounts as IDiscount[]) ??
        [];

      const variantDiscounts: IDiscount[] =
        ((variant as any)?.discounts as IDiscount[]) ??
        ((variant as any)?.Discounts as IDiscount[]) ??
        [];

      const isActiveAuto = (d: any) => {
        if (!d) return false;

        // ❌ promo-code discounts are hidden (coupon only)
        if (d.code && String(d.code).trim() !== "") return false;

        const startOk = !d.startDate || new Date(d.startDate) <= now;
        const endOk = !d.endDate || new Date(d.endDate) >= now;
        return startOk && endOk;
      };

      // ✅ variant auto > product auto
      return (variantDiscounts.find(isActiveAuto) || productDiscounts.find(isActiveAuto) || null) as IDiscount | null;
    },
    [product]
  );

  return (
    <ProductDetailsUI
      product={product}
      selectedVariantId={effectiveVariant?.id}
      discount={discount}
      discountedPrice={discountedPrice}
      currentPrice={currentPrice}
      quantity={quantity}
      isOutOfStock={isOutOfStock}
      selectedSizeLabel={selectedSizeLabel}
      availableVariants={availableVariants}
      getVariantDiscount={getActiveAutoDiscountForVariant}
      onReadMore={onReadMore}
      onSelectVariant={onSelectVariant}
      onQtyDec={onQtyDec}
      onQtyInc={onQtyInc}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      isAddingToCart={isAddingToCart}
      isBuyingNow={isBuyingNow}
      isPending={isPending}
    />
  );
};