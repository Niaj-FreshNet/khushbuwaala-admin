import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Shimmer({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ animationDelay: `${delay}ms`, animationDuration: "1350ms" }}
    >
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export default function ProductPageLoading() {
  return (
    <>
      {/* 1. Breadcrumbs Skeleton (Exact container and item sizes) */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-5 sm:pt-5.5 pb-3 sm:pb-4.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-12 rounded" />
            <span className="text-gray-300 text-xs">/</span>
            <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28 rounded" />
            <span className="text-gray-300 text-xs">/</span>
            <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-44 rounded" />
          </div>
        </div>
      </div>

      <main className="bg-white">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 items-start">

              {/* Product Gallery Skeleton */}
              <div className="w-full order-1 flex justify-center">
                <div className="w-full max-w-[520px] lg:max-w-none lg:sticky lg:top-16 space-y-3">
                  {/* Exact 1:1 Aspect Ratio Main Image Container */}
                  <div className="relative w-full aspect-square rounded-2xl bg-gray-100 shadow-xs border border-gray-100 overflow-hidden flex items-center justify-center">
                    {/* Background Pulse / Shimmer */}
                    <Skeleton className="absolute inset-0 w-full h-full rounded-none" />

                    {/* Diagonal Light Sweep */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                      <div className="absolute -inset-x-40 -inset-y-20 rotate-12 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[pulse_1.5s_ease-in-out_infinite]" />
                    </div>

                    {/* Center Spinner Ring */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                    </div>

                    {/* Floating 360 View Icon Placeholder */}
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/80 shadow-xs border border-gray-200/50" />
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex gap-2.5 overflow-x-auto py-1 justify-center">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border ${idx === 0
                            ? "border-emerald-500/70 ring-2 ring-emerald-200/50"
                            : "border-gray-200"
                          }`}
                      >
                        <Skeleton className="w-full h-full rounded-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Details Section Skeleton */}
              <div className="w-full order-2">
                <div className="lg:sticky lg:top-16 space-y-1 sm:space-y-2">

                  {/* Header / Discount / Title / Price */}
                  <div className="space-y-2">
                    {/* Discount Badge */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <Skeleton className="h-7 sm:h-9 lg:h-10 w-4/5 rounded-lg" />
                      <div className="w-20 h-1 bg-gray-200 rounded-full" />
                    </div>

                    {/* Highlighted Price Banner */}
                    <div className="p-2 sm:p-2.5 bg-gray-50/90 rounded-xl border border-blue-100/60 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24 rounded-md" />
                        <Skeleton className="h-4 sm:h-5 w-14 sm:w-16 rounded line-through" />
                      </div>
                      <Skeleton className="h-5 sm:h-6 w-24 sm:w-28 rounded-lg" />
                    </div>
                  </div>

                  {/* Description Preview Box */}
                  <div className="px-2.5 sm:px-4 py-3 bg-white rounded-2xl border border-gray-200 space-y-2">
                    <Skeleton className="h-3.5 sm:h-4 w-full rounded" />
                    <Skeleton className="h-3.5 sm:h-4 w-11/12 rounded" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 sm:h-4 w-4/5 rounded" />
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>

                  {/* Choose Size (Matches grid-cols-4 layout) */}
                  <div className="p-1.5 sm:p-2 bg-white rounded-2xl border-gray-200 space-y-1 sm:space-y-2">
                    <Skeleton className="h-4 sm:h-5 w-24 rounded" />
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          className="h-10 sm:h-12 rounded-xl border border-gray-200 bg-white p-1 flex items-center justify-center"
                        >
                          <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-12 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity & Total Price Box */}
                  <div className="px-2 sm:px-3 py-2 bg-white rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-16 rounded" />
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-8 sm:h-10">
                      <Skeleton className="w-8 sm:w-10 h-full rounded-none" />
                      <Skeleton className="w-10 sm:w-16 h-full rounded-none border-x border-gray-200" />
                      <Skeleton className="w-8 sm:w-10 h-full rounded-none" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3 w-8 ml-auto rounded" />
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded" />
                    </div>
                  </div>

                  {/* Primary CTA Buttons (Stacks flex-col on mobile, flex-row on desktop) */}
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-2 sm:mt-3 w-full">
                    <Skeleton className="flex-1 h-12 sm:h-14 rounded-xl" />
                    <Skeleton className="flex-1 h-12 sm:h-14 rounded-xl" />
                  </div>

                  {/* Quick Order Buttons (WhatsApp & Call) */}
                  <div className="flex flex-row gap-2 mt-1.5 mb-2.5 w-full">
                    <Skeleton className="flex-1 h-10 sm:h-11 rounded-xl" />
                    <Skeleton className="flex-1 h-10 sm:h-11 rounded-xl" />
                  </div>

                  {/* Share Bar */}
                  <div className="pt-2 sm:pt-2.5 pb-1 flex items-center justify-between gap-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-3.5 h-3.5 rounded" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full" />
                      ))}
                      <Skeleton className="h-7.5 sm:h-8 w-20 rounded-full" />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Product Details Accordion Section */}
        <section className="bg-white relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3">
            <Skeleton className="h-5 sm:h-6 w-36 rounded" />

            {/* Top Navigation Tabs */}
            <div className="p-1 rounded-2xl bg-gray-100/80 flex gap-1.5 border border-gray-200/60 overflow-hidden">
              <Skeleton className="h-8 flex-1 rounded-xl bg-white shadow-xs" />
              <Skeleton className="h-8 flex-1 rounded-xl bg-transparent" />
              <Skeleton className="h-8 flex-1 rounded-xl bg-transparent" />
            </div>

            {/* Expanded Accordion Item */}
            <div className="rounded-2xl border border-emerald-500/20 bg-white p-3.5 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
                  <Skeleton className="h-4 w-44 sm:w-56 rounded" />
                </div>
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>

              {/* Description Body */}
              <Skeleton className="h-16 w-full rounded-xl" />

              {/* Longevity & Projection Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Collapsed Accordion Items */}
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/80 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
                  <Skeleton className="h-4 w-36 sm:w-44 rounded" />
                </div>
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* 4. Related Products Section */}
        <section className="bg-linear-to-b from-gray-50 to-white relative py-4 sm:py-6">
          <div className="relative max-w-screen-xl mx-auto px-3 lg:px-6 space-y-4">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div className="space-y-1">
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton className="h-3.5 w-64 rounded" />
              </div>
              <Skeleton className="hidden sm:block h-10 w-28 rounded-xl" />
            </div>

            {/* Responsive Product Cards Grid (Matching RelatedProducts.tsx) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden p-0 flex flex-col"
                >
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="p-3 sm:p-4 space-y-2">
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-5 w-16 rounded" />
                      <Skeleton className="h-4 w-10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Trust Signals / Help Section */}
        <section className="bg-white">
          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 text-center space-y-3">
              <Skeleton className="h-5 w-44 mx-auto rounded" />
              <Skeleton className="h-3.5 w-72 mx-auto rounded" />
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
                <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}