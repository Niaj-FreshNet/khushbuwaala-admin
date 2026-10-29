import { Skeleton } from "@/components/ui/skeleton";
import StoreContainer from "@/components/Layout/StoreContainer";

export default function Loading() {
  return (
    <StoreContainer>
      <div className="bg-[#FBFBFA] pt-4 sm:pt-8 pb-8 sm:pb-12 min-h-screen">
        <div className="container mx-auto px-3 py-6 sm:px-4 max-w-6xl">
          {/* Header & Trust Badges */}
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <Skeleton className="h-7 w-52 sm:w-64" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Mobile Accordion Summary Skeleton */}
          <div className="lg:hidden mb-2">
            <div className="w-full p-2.5 sm:p-3.5 flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>

          {/* Main Grid: Form (Col 7) & Order Review (Col 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-3">
              {/* Delivery Address Card Skeleton */}
              <div className="bg-white rounded-2xl border border-gray-200 px-3 sm:px-4 pt-3 pb-3 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-3 rounded-full bg-gray-200" />
                  <Skeleton className="h-5 w-36" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <div className="sm:col-span-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-[52px] w-full rounded-lg" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>

                {/* Billing Address Toggle Pill */}
                <div className="pt-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>

                {/* Optional Email & Special Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Payment Method Card Skeleton */}
              <div className="bg-white rounded-2xl border border-gray-200 px-3 sm:px-4 pt-3 pb-3 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-3 rounded-full bg-gray-200" />
                  <Skeleton className="h-5 w-36" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox Skeleton */}
              <div className="hidden sm:flex items-center gap-2 pt-1 px-1">
                <Skeleton className="h-4 w-4 rounded-full shrink-0 ml-2" />
                <Skeleton className="h-3.5 w-72" />
              </div>

              {/* Desktop CTA Button Skeleton */}
              <div className="hidden lg:block pt-2">
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </div>

            {/* Right Column (Sticky Order Review) */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>

                {/* Items Preview List Skeleton */}
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="w-12 h-14 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3.5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>

                {/* Promo Input Skeleton */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 h-9">
                  <Skeleton className="h-full flex-1 rounded-md" />
                  <Skeleton className="h-full w-16 rounded-md" />
                </div>

                {/* Pricing Breakdown Skeleton */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-14" />
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-baseline">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0 ml-2" />
                    <Skeleton className="h-3.5 w-56" />
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="hidden sm:flex items-center justify-around bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>

                {/* Mobile Inline Button */}
                <div className="pt-2 lg:hidden">
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Sticky CTA Skeleton */}
      <div className="lg:hidden fixed left-0 right-0 bottom-16 sm:bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 sm:gap-6 max-w-md mx-auto">
          <div className="ml-4 space-y-1">
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="ml-6 flex-1 h-11 rounded-xl" />
        </div>
      </div>
    </StoreContainer>
  );
}