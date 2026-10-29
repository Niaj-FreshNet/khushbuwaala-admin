"use client";

import { useEffect, useRef } from "react";
import { useProductSelection } from "@/context/ProductSelectionContext";
import type { IProduct } from "@/types/product.types";

declare global {
    interface Window {
        dataLayer?: any[];
        __kw_last_view_item?: { key: string; t: number };
    }
}

function eventId() {
    return `${Date.now()}.${Math.random().toString(16).slice(2)}`;
}

function formatVariantLabel(v: any) {
    // e.g. 6 + ml => "6ml"
    if (v?.size != null && v?.unit) return `${v.size}${v.unit}`;
    if (v?.sku) return v.sku;
    if (v?.id) return v.id;
    return undefined;
}

export default function ViewItemDataLayer({
    product,
}: {
    product: IProduct;
}) {
    const { selectedVariant } = useProductSelection();

    // Fire only once per "page view" (not per rerender)
    const firedOnceRef = useRef(false);

    useEffect(() => {
        if (!product?.slug) return;

        // Price: prefer selected variant price, fallback to minPrice
        const price = selectedVariant?.price ?? product.minPrice ?? undefined;
        const currency = "BDT"; // set your store currency here
        const itemVariant = formatVariantLabel(selectedVariant);

        const category = product.categoryId || undefined;

        // Dedupe key: same product page view
        // If you want to re-fire when variant changes, include variant.id in key.
        const dedupeKey = `view_item:${product.slug}`; // keep stable for "once per view"
        const now = Date.now();

        // Avoid accidental duplicate fires (StrictMode, fast refresh, etc.)
        const last = window.__kw_last_view_item;
        if (last?.key === dedupeKey && now - last.t < 1500) return;

        if (firedOnceRef.current) return;
        firedOnceRef.current = true;
        window.__kw_last_view_item = { key: dedupeKey, t: now };

        const eid = `${eventId()}.${product.slug}`;

        window.dataLayer = window.dataLayer || [];

        // Important: clear ecommerce so GA4 doesn't merge items across events
        window.dataLayer.push({ ecommerce: null });

        window.dataLayer.push({
            event: "view_item",
            event_id: eid, // <-- keep for Meta dedup later
            ecommerce: {
                currency,
                value: price,
                items: [
                    {
                        item_id: String(product.id || product.slug),
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
    }, [product.slug]); // intentionally only once per product view

    return null;
}
