import { Skeleton } from "@/components/ui/skeleton";
import { LiveSkeleton } from "./_components/LiveSkeleton";
import { ShopControlsSkeleton } from "@/components/Modules/Shop/ShopControlsSkeleton";
import { ShopProductsSkeletonGrid } from "@/components/Modules/Shop/ShopProductsSkeletonGrid";

export default function ShopLoading() {
  return (
    <div className="w-full mx-auto mt-0 sm:mt-4">
      {/* Products Section Wrapper — exactly matches ShopShell */}
      <div id="products" className="bg-white pt-0 pb-4">
        <section
          className="container mx-auto py-0 px-3 sm:px-4 relative"
          aria-label="Loading perfumes..."
        >
          {/* 1:1 Sticky Controls Bar Skeleton */}
          <ShopControlsSkeleton />

          {/* 1:1 Responsive Product Grid Skeleton (Mobile 2, Tablet 3, Desktop 4, XL 5) */}
          <ShopProductsSkeletonGrid
            count={15}
            colsClass="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          />

          {/* 1:1 Pagination Bar Skeleton (Matches the real Previous ... 1 2 3 ... Next) */}
          <div className="mt-8 mb-8">
            <div className="mx-auto w-full max-w-full overflow-x-hidden">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Previous Button Skeleton */}
                <LiveSkeleton delayMs={100} speedMs={1400}>
                  <Skeleton className="h-8 sm:h-9 w-[76px] sm:w-[86px] rounded-lg" />
                </LiveSkeleton>

                {/* Page Number Buttons Skeleton */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <LiveSkeleton
                      key={item}
                      delayMs={120 + item * 25}
                      speedMs={1400}
                    >
                      <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg" />
                    </LiveSkeleton>
                  ))}
                </div>

                {/* Next Button Skeleton */}
                <LiveSkeleton delayMs={260} speedMs={1400}>
                  <Skeleton className="h-8 sm:h-9 w-15 sm:w-17 rounded-lg" />
                </LiveSkeleton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}