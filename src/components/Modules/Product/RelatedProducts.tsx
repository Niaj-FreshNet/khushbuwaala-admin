"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Tag,
  ArrowRight,
} from "lucide-react";
import { IProduct } from "@/types/product.types";
import { useGetRelatedProductsQuery } from "@/redux/store/api/product/productApi";

interface RelatedProductsProps {
  product: IProduct;
}

function RelatedProductsSkeleton() {
  return (
    <section className="mt-12 max-w-screen-xl mx-auto px-3 lg:px-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 overflow-hidden bg-white"
          >
            <div className="relative aspect-square bg-gray-100 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 w-full bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  // ✅ Support both id + _id
  const productId = (product as any)?.id ?? (product as any)?._id;

  const { data, isLoading, isError } = useGetRelatedProductsQuery(productId, {
    skip: !productId,
  });

  if (!productId) return null;
  if (isLoading) return <RelatedProductsSkeleton />;
  if (isError || !data) return null;

  const relatedProducts = [
    ...(data.sameBrand ?? []),
    ...(data.sameCategory ?? []),
    ...(data.similarAccords ?? []),
    ...(data.recentlyViewed ?? []),
  ];

  // ✅ De-dupe + remove current product
  const uniqueProducts = Array.from(
    new Map(
      relatedProducts.map((p: any) => [(p?.id ?? p?._id) as string, p])
    ).values()
  ).filter((p: any) => (p?.id ?? p?._id) !== productId);

  if (!uniqueProducts.length) return null;

  // ✅ Show max items for cleaner UI
  const items = uniqueProducts.slice(0, 8);

  return (
    <section
      aria-label="Related products"
      className="mt-4 max-w-screen-xl mx-auto px-3 lg:px-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="mt-3 text-xl md:text-2xl font-bold text-gray-900">
            You may also like
          </h3>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Similar fragrances based on category, accords, and popularity.
          </p>
        </div>

        {/* Desktop only: top right button */}
        <Link
          href="/shop"
          className="hidden sm:inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold hover:shadow-sm hover:border-gray-300 transition"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3">
        {items.map((p: any) => {
          const pid = p?.id ?? p?._id;

          const activeDiscount = p.discounts?.[0];
          const basePrice = Number(p.minPrice ?? 0);

          const discountedPrice = activeDiscount
            ? activeDiscount.type === "percentage"
              ? basePrice - (basePrice * activeDiscount.value) / 100
              : basePrice - activeDiscount.value
            : basePrice;

          const unit = p?.variants?.[0]?.unit;
          const sizeCount = Array.isArray(p?.variants) ? p.variants.length : 0;

          return (
            <Link
              key={pid}
              href={`/product/${p.slug}`}
              className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden transition
                         hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <Image
                  src={p.primaryImage}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* subtle overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

                {/* Discount badge */}
                {activeDiscount && (
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg">
                    <Tag className="w-3.5 h-3.5" />
                    {activeDiscount.type === "percentage"
                      ? `${activeDiscount.value}%`
                      : `- ${activeDiscount.value}৳`}
                  </div>
                )}

                {/* Stock pill */}
                {/* <div className="absolute top-3 right-3">
                  {p.inStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-green-700 border border-white shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-red-700 border border-white shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      Out
                    </span>
                  )}
                </div> */}

                {/* Quick hint (shows on hover) */}
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition">
                  <div className="w-full text-center text-xs font-semibold text-white py-2 rounded-xl bg-black/55 backdrop-blur">
                    Tap to view details
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="text-sm md:text-[15px] font-semibold text-gray-900 line-clamp-1">
                  {p.name}
                </h4>

                {/* Meta line */}
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 line-clamp-1">
                    Khushbuwaala
                  </span>
                  {/* <span className="text-[11px] font-semibold text-gray-600">
                    {unit ? `${sizeCount}+ sizes • ${unit}` : "Standard size"}
                  </span> */}
                </div>

                {/* Price */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  {activeDiscount ? (
                    <>
                      <div className="flex flex-row items-baseline gap-1 md:gap-2">
                        <span className="text-sm md:text-base font-extrabold text-red-600">
                          ৳{discountedPrice.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ৳{basePrice.toFixed(0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm md:text-base font-extrabold text-gray-900">
                      ৳{basePrice.toFixed(0)}
                    </span>
                  )}

                  <span className="inline-flex items-center underline gap-1 text-xs font-bold text-gray-900">
                    View
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                {/* Divider + CTA */}
                {/* <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center">

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-900">
                    View
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div> */}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Phone only: bottom full-width button */}
      <div className="mt-4 sm:hidden">
        <Link
          href="/shop"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold shadow-xs active:bg-gray-50 transition"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
