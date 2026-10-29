"use client"

import { motion, useReducedMotion } from "framer-motion"
import { SectionTitle } from "./SectionTitle"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ProductCarouselSkeleton({
  title,
  titleVariant = "default",
  titleSubtitle,
  titleIcon,
  titleUnderlineWidth,
  titleAnimated = true,
  titleShowDecorations = true,
  titleUnderlineVariant = "default",
}: {
  title: string
  titleVariant?: "default" | "gradient" | "elegant" | "modern" | "premium"
  titleSubtitle?: string
  titleIcon?: React.ReactNode
  titleUnderlineWidth?: string
  titleAnimated?: boolean
  titleShowDecorations?: boolean
  titleUnderlineVariant?: "default" | "wide" | "full"
}) {
  const reduce = useReducedMotion()
  const items = [0, 1, 2, 3, 4, 5]

  return (
    <motion.section
      initial={{ opacity: reduce ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={reduce ? undefined : { duration: 0.25 }}
      className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-1 sm:px-2 lg:px-3 mb-8 sm:mb-10 lg:mb-12 overflow-hidden"
    >
      <SectionTitle
        title={title}
        subtitle={titleSubtitle}
        variant={titleVariant}
        icon={titleIcon}
        animated={titleAnimated}
        showDecorations={titleShowDecorations}
        underlineVariant={titleUnderlineVariant}
      />

      <div className="relative">
        {/* Matches CarouselContent negative margin rhythm */}
        <div className="flex w-full -ml-2 md:-ml-3">
          {items.map((i) => (
            <div
              key={i}
              className={cn(
                "pl-1 shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 2xl:basis-1/6",
                i >= 2 && "hidden sm:block",
                i >= 3 && "hidden md:block",
                i >= 4 && "hidden lg:block",
                i >= 5 && "hidden 2xl:block"
              )}
            >
              <div className="h-full flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-gray-100 shadow-xs p-0">
                {/* Image Section (aspect 4/5 with subtle badge placeholders) */}
                <div className="relative aspect-4/5 w-full overflow-hidden bg-gray-100">
                  <Skeleton className="absolute inset-0 rounded-none bg-gray-200/80" />

                  {/* Discount Badge Placeholder */}
                  <div className="absolute top-2 left-2.5 z-10">
                    <Skeleton className="h-4 w-12 rounded-full bg-gray-300/80" />
                  </div>

                  {/* Wishlist Button Placeholder */}
                  <div className="absolute top-2 right-2.5 z-10">
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 shadow-xs" />
                  </div>

                  {/* Quick View Button Placeholder */}
                  <div className="absolute top-10 sm:top-11 right-2.5 z-10">
                    <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 shadow-xs" />
                  </div>
                </div>

                {/* Content Details: Matches tight padding */}
                <div className="p-2 sm:p-2.5 space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-center items-center">
                  {/* Product Title */}
                  <Skeleton className="h-3.5 sm:h-4 w-4/5 rounded-md bg-gray-200" />

                  {/* Price */}
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <Skeleton className="h-4 sm:h-5 w-14 rounded-md bg-gray-200" />
                    <Skeleton className="h-3 w-10 rounded-md bg-gray-200/60" />
                  </div>

                  {/* Fragrance Families Tags */}
                  <div className="flex justify-center gap-1 pt-0.5">
                    <Skeleton className="h-3.5 w-10 rounded-full bg-gray-200/70" />
                    <Skeleton className="h-3.5 w-12 rounded-full bg-gray-200/70" />
                  </div>
                </div>

                {/* Bottom Add-to-Cart Button Placeholder */}
                <div className="p-2 pt-0 sm:p-2.5 sm:pt-0">
                  <Skeleton className="w-full h-8 sm:h-9 md:h-10 rounded-lg bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}