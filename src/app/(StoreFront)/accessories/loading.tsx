import { Skeleton } from "@/components/ui/skeleton"

export default function ShopLoading() {
  return (
    <div className="w-full mx-auto">
      {/* Shop Banner Skeleton */}
      <Skeleton className="w-full h-[250px] md:h-[360px] mt-16 mb-8" />

      {/* Notice Bar Skeleton */}
      <div className="py-6 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
      </div>

      {/* Shop Products Skeleton */}
      <section className="container mx-auto py-8 px-4">
        {/* Controls Skeleton */}
        <div className="flex justify-between items-center bg-white py-3 px-2 rounded-lg shadow-sm mb-6 border border-gray-100">
          <Skeleton className="h-9 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md hidden md:block" />
            <Skeleton className="h-9 w-9 rounded-md hidden lg:block" />
            <Skeleton className="h-9 w-9 rounded-md hidden xl:block" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="w-full h-64 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button Skeleton */}
        <div className="text-center mt-8">
          <Skeleton className="h-5 w-64 mx-auto mb-4" />
          <Skeleton className="h-12 w-40 mx-auto rounded-full" />
        </div>
      </section>
    </div>
  )
}
