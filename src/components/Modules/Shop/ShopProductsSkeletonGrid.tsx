"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LiveSkeleton({
  className = "",
  delayMs = 0,
  speedMs = 1400,
  children,
}: {
  className?: string;
  delayMs?: number;
  speedMs?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`skel-live ${className}`}
      style={
        {
          ["--skel-delay" as any]: `${delayMs}ms`,
          ["--skel-speed" as any]: `${speedMs}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function ShopProductsSkeletonGrid({
  count = 10,
  colsClass = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
}: {
  count?: number;
  colsClass?: string;
}) {
  return (
    <div className={`grid ${colsClass} gap-2 sm:gap-3 md:gap-4 items-start`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden flex flex-col"
        >
          {/* Product Image Area */}
          <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
            <LiveSkeleton delayMs={60 + (i % 6) * 35} speedMs={1400}>
              <Skeleton className="w-full h-full rounded-none" />
            </LiveSkeleton>

            {/* Badges Overlay */}
            <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
              <LiveSkeleton delayMs={120 + (i % 5) * 20} speedMs={1350}>
                <Skeleton className="h-5 sm:h-6 w-12 sm:w-14 rounded-full" />
              </LiveSkeleton>
            </div>

            {/* Wishlist Button Placeholder */}
            <div className="absolute top-2 right-2">
              <LiveSkeleton delayMs={140 + (i % 5) * 20} speedMs={1350}>
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
              </LiveSkeleton>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
            <div className="space-y-1.5 sm:space-y-2">
              {/* Product Title */}
              <LiveSkeleton delayMs={100 + (i % 6) * 25} speedMs={1450}>
                <Skeleton className="h-4 sm:h-4.5 w-11/12 rounded" />
              </LiveSkeleton>

              {/* Sub-line / Accords / Category */}
              <LiveSkeleton delayMs={140 + (i % 6) * 25} speedMs={1450}>
                <Skeleton className="h-3 sm:h-3.5 w-7/12 rounded" />
              </LiveSkeleton>
            </div>

            {/* Pricing Section */}
            <div className="flex items-center justify-between pt-1">
              <LiveSkeleton delayMs={180 + (i % 6) * 20} speedMs={1400}>
                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded" />
              </LiveSkeleton>
              <LiveSkeleton delayMs={210 + (i % 6) * 20} speedMs={1400}>
                <Skeleton className="h-4 w-10 sm:w-12 rounded" />
              </LiveSkeleton>
            </div>

            {/* Actions (Size Pill / Cart Button) */}
            <div className="flex gap-1.5 sm:gap-2 pt-1">
              <LiveSkeleton delayMs={240 + (i % 6) * 20} speedMs={1500} className="flex-1">
                <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
              </LiveSkeleton>
              <LiveSkeleton delayMs={260 + (i % 6) * 20} speedMs={1500}>
                <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg" />
              </LiveSkeleton>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}