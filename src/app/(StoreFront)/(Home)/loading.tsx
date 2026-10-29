import { Skeleton } from "@/components/ui/skeleton"

export default function StoreFrontLoading() {
  return (
    <div className="w-full mx-auto">
      {/* 1. Hero Carousel Slider Skeleton (matches aspect-ratio & max-h-[380px]) */}
      <section className="w-full overflow-hidden relative mt-1 sm:mt-2">
        <Skeleton className="w-full aspect-21/9 sm:aspect-[2.6/1] md:aspect-[3/1] lg:aspect-[3.4/1] 2xl:aspect-[3.8/1] min-h-[190px] sm:min-h-[240px] max-h-[380px] rounded-none sm:rounded-2xl" />
      </section>

      {/* Shared Section Shell Generator */}
      {/* 2. Best Sellers */}
      <ProductSectionSkeleton />

      {/* 3. Category Banner Skeleton (6 cards in grid) */}
      <section className="pt-2 sm:pt-4 pb-2">
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <Skeleton className="h-6 sm:h-7 w-44 sm:w-56 mb-2 rounded-md" />
            <Skeleton className="h-0.5 w-16 bg-red-200 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-full h-40 sm:h-48 md:h-52 rounded-xl sm:rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Arabian Attar Section */}
      <ProductSectionSkeleton />

      {/* 5. Artificial Oud Section */}
      <ProductSectionSkeleton />

      {/* 6. Inspired Perfume Oils Section */}
      <ProductSectionSkeleton />

      {/* 7. Services Section Skeleton */}
      <section className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <Skeleton className="h-6 sm:h-7 w-48 sm:w-60 mb-2 rounded-md" />
          <Skeleton className="h-0.5 w-16 bg-red-200 rounded-full" />
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-28 sm:w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <Skeleton className="h-px w-full mt-4 mb-3" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      {/* 8. Reviews Section Skeleton */}
      <section className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-6 sm:h-7 w-36 mb-2 rounded-md" />
          <Skeleton className="h-0.5 w-12 bg-red-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-36 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* 9. Subscribe Section Skeleton */}
      <section className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-72" />
          <div className="flex w-full gap-2 pt-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  )
}

function ProductSectionSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* Title */}
      <div className="flex flex-col items-center mb-3 sm:mb-4">
        <Skeleton className="h-6 sm:h-7 w-36 sm:w-44 mb-2 rounded-md" />
        <Skeleton className="h-0.5 w-16 bg-red-200 rounded-full" />
      </div>

      {/* Carousel items mimicking pl-2 md:pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 2xl:basis-1/6 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex flex-col rounded-xl sm:rounded-2xl border border-gray-100 bg-white p-0 overflow-hidden ${i === 5 ? "hidden 2xl:flex" : i === 4 ? "hidden lg:flex" : i === 3 ? "hidden md:flex" : i === 2 ? "hidden sm:flex" : "flex"
              }`}
          >
            {/* Image (aspect 4/5) */}
            <Skeleton className="aspect-4/5 w-full rounded-none" />

            {/* Info Area */}
            <div className="p-2 sm:p-2.5 space-y-1.5 flex flex-col items-center">
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="flex gap-1 pt-0.5">
                <Skeleton className="h-3 w-10 rounded-full" />
                <Skeleton className="h-3 w-10 rounded-full" />
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-2 pt-0 sm:p-2.5 sm:pt-0">
              <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}