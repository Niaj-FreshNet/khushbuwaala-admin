"use client"

import dynamic from "next/dynamic"

const BannerSection = dynamic(
    () => import("./BannerSection").then((m) => m.BannerSection),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-100 md:h-125 lg:h-150 mt-12 mb-4 rounded-2xl bg-gray-100 animate-pulse" />
        ),
    }
)

export default BannerSection
