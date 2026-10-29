"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveSkeleton } from "@/app/(StoreFront)/shop/_components/LiveSkeleton";

export function ShopControlsSkeleton() {
    return (
        <div className="sticky top-0 z-40 flex items-center gap-2 bg-white/95 backdrop-blur-xl py-2 sm:py-3 px-2 sm:px-4 rounded-b-xl shadow-sm mb-4 sm:mb-8 border border-gray-200 transition-all duration-300">
            {/* LEFT: Filter button */}
            <LiveSkeleton delayMs={100} speedMs={1400} className="shrink-0">
                <Skeleton className="h-8.5 sm:h-9 w-19 sm:w-23.5 rounded-lg" />
            </LiveSkeleton>

            {/* CENTER: Live Search input */}
            <div className="flex-1 min-w-0">
                <LiveSkeleton delayMs={150} speedMs={1400}>
                    <Skeleton className="w-full h-8.5 sm:h-9 rounded-lg" />
                </LiveSkeleton>
            </div>

            {/* DESKTOP: Column toggles (hidden on mobile/tablet) */}
            <div className="hidden lg:flex gap-1 bg-gray-50 p-1 rounded-lg shrink-0 border border-gray-100">
                <LiveSkeleton delayMs={200} speedMs={1500}>
                    <Skeleton className="h-7 w-7 rounded-md" />
                </LiveSkeleton>
                <LiveSkeleton delayMs={230} speedMs={1500}>
                    <Skeleton className="hidden lg:block h-7 w-7 rounded-md" />
                </LiveSkeleton>
                <LiveSkeleton delayMs={260} speedMs={1500}>
                    <Skeleton className="hidden xl:block h-7 w-7 rounded-md" />
                </LiveSkeleton>
            </div>

            {/* RIGHT: Sort dropdown */}
            <LiveSkeleton delayMs={220} speedMs={1450} className="shrink-0">
                <Skeleton className="h-8.5 sm:h-9 w-21.5 sm:w-32.5 rounded-lg" />
            </LiveSkeleton>
        </div>
    );
}