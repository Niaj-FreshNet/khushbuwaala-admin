"use client";

import { useEffect, useRef } from "react";
import { useProductSelection } from "@/context/ProductSelectionContext";
import type { IProduct } from "@/types/product.types";

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

function formatVariantLabel(v: any) {
  if (v?.size != null && v?.unit) return `${v.size}${v.unit}`;
  if (v?.sku) return v.sku;
  if (v?.id) return v.id;
  return undefined;
}

export default function TrackVariantChange({
  product,
}: {
  product: IProduct;
}) {
  const { selectedVariant } = useProductSelection();
  const prevVariantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product?.slug || !selectedVariant?.id) return;

    // don't fire on first default set (page load)
    if (prevVariantIdRef.current === null) {
      prevVariantIdRef.current = selectedVariant.id;
      return;
    }

    // fire only when variant actually changes
    if (prevVariantIdRef.current === selectedVariant.id) return;
    prevVariantIdRef.current = selectedVariant.id;

    const price = selectedVariant.price ?? product.minPrice ?? undefined;
    const currency = "BDT";
    const itemVariant = formatVariantLabel(selectedVariant);

    const itemId = String(product.id || product.slug);
    const variantId = String(selectedVariant.id);

    const category = product.categoryId || undefined;

    window.dataLayer = window.dataLayer || [];

    // ----- GA4 (your existing push) -----
    window.dataLayer.push({ ecommerce: null });

    window.dataLayer.push({
      event: "select_item",
      ecommerce: {
        currency,
        value: price,
        item_list_name: "Product Detail Variant",
        items: [
          {
            item_id: itemId,
            item_name: product.name,
            item_brand: product.brand || "Khushbuwaala",
            item_category: category || "Shop",
            item_variant: itemVariant,
            price,
            quantity: 1,
          },
        ],
      },
    });

    // ----- META (NEW) -----
    // Dedicated event name to trigger Meta tag in GTM
    window.dataLayer.push({
      event: "fb_select_variant",

      // Meta-friendly params
      content_name: product.name,
      content_type: "product",
      content_ids: [itemId], // or use variantId if your Meta catalog uses variant IDs
      currency,
      value: price,

      // Recommended "contents" structure for Meta
      contents: [
        {
          id: itemId, // or variantId (see note below)
          quantity: 1,
          item_price: price,
        },
      ],

      // extra helpful fields (optional)
      variant_id: variantId,
      item_variant: itemVariant,
      sku: selectedVariant.sku,
      category: category,
    });
  }, [
    selectedVariant?.id,
    selectedVariant?.price,
    selectedVariant?.sku,
    selectedVariant?.size,
    selectedVariant?.unit,
    product?.slug,
    product?.id,
    product?.name,
    product?.brand,
    product?.categoryId,
    product?.minPrice,
  ]);

  return null;
}
