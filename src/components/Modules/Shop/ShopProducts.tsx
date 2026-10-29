"use client";

import { useState, useEffect, useRef } from "react";
import { useGetAllProductsQuery, useGetProductsByCategoryIdQuery } from "@/redux/store/api/product/productApi";
import { IProductResponse } from "@/types/product.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FilterIcon,
  LayoutGrid,
  Loader2,
  Columns3,
  Grid3X3,
  Search,
  X,
} from "lucide-react";
import { FilterSheet } from "./FilterSheet";
import SortDropdown from "./SortDropdown";
import { ProductCard } from "@/components/ReusableUI/ProductCard";
import { ProductQuickView } from "@/components/ReusableUI/ProductQuickView";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ShopProductsSkeletonGrid } from "./ShopProductsSkeletonGrid";

interface ShopProductProps {
  initialPage: number;
  categoryId?: string;
  categoryName?: string;
  specification?: string;
  section?: string;
  minPrice?: number;
  maxPrice?: number;
  accords?: string;
  perfumeNotes?: string;
  performance?: string;
  projection?: string;
  sortBy?: string;
  lockCategory?: boolean;
}

type Filters = {
  priceRange: [number, number];
  selectedCategories: string[];
  selectedAccords: string[];
  selectedPerfumeNotes: string[];
  selectedPerformance: string[];
  selectedProjection: string[];
  selectedSpecification: string;
};

const normalizeFilters = (f: Partial<Filters> | undefined, fallback: Filters): Filters => ({
  priceRange: (f?.priceRange ?? fallback.priceRange) as [number, number],
  selectedCategories: Array.isArray(f?.selectedCategories) ? f!.selectedCategories : fallback.selectedCategories,
  selectedAccords: Array.isArray(f?.selectedAccords) ? f!.selectedAccords : fallback.selectedAccords,
  selectedPerfumeNotes: Array.isArray(f?.selectedPerfumeNotes) ? f!.selectedPerfumeNotes : fallback.selectedPerfumeNotes,
  selectedPerformance: Array.isArray(f?.selectedPerformance) ? f!.selectedPerformance : fallback.selectedPerformance,
  selectedProjection: Array.isArray(f?.selectedProjection) ? f!.selectedProjection : fallback.selectedProjection,
  selectedSpecification: typeof f?.selectedSpecification === "string" ? f!.selectedSpecification : fallback.selectedSpecification,
});

export function ShopProducts(props: ShopProductProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [page, setPage] = useState(props.initialPage);

  const productsTopRef = useRef<HTMLDivElement | null>(null);
  const [pageTransitionLoading, setPageTransitionLoading] = useState(false);

  // Search input state with initial search param hydration
  const initialSearchParam = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchParam);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const routeKey = `${pathname}?${searchParams.toString()}`;

  const scrollToProductsTopStable = () => {
    if (!productsTopRef.current) return;
    const y = productsTopRef.current.getBoundingClientRect().top + window.scrollY - 210;
    window.scrollTo({ top: y, behavior: "auto" });

    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
    });
  };

  const limit = 20;

  const initialFilters: Filters = {
    priceRange: [props.minPrice || 100, props.maxPrice || 5000],
    selectedCategories: props.categoryName ? [props.categoryName] : [],
    selectedAccords: props.accords ? props.accords.split(",") : [],
    selectedPerfumeNotes: props.perfumeNotes ? props.perfumeNotes.split(",") : [],
    selectedPerformance: props.performance ? props.performance.split(",") : [],
    selectedProjection: props.projection ? props.projection.split(",") : [],
    selectedSpecification: props.specification || "all",
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortOption, setSortOption] = useState(props.sortBy || "new-to-old");
  const [columns, setColumns] = useState(2);
  const [visibleProductsCount, setVisibleProductsCount] = useState(limit);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<IProductResponse | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("openFilters") === "true") {
      setIsFilterSheetVisible(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openFilters");
      const cleanUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(cleanUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const [stableProducts, setStableProducts] = useState<IProductResponse[]>([]);
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);

  const LOADING_TIMEOUT_MS = 20_000;
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  type SortBy = "name" | "price_asc" | "price_desc" | "newest" | "oldest" | "popularity";

  const sortMap: Record<string, SortBy> = {
    newArrival: "newest",
    featured: "popularity",
    onSale: "price_asc",
    "a-z": "name",
    "z-a": "name",
    "low-to-high": "price_asc",
    "high-to-low": "price_desc",
    "old-to-new": "oldest",
    "new-to-old": "newest",
  };

  const isLocked = !!props.lockCategory;
  const categoryId = props.categoryId;

  const DEFAULT_MIN = 100;
  const DEFAULT_MAX = 5000;
  const DEFAULT_SORT = "new-to-old";

  const isFilteringActive =
    filters.selectedAccords.length > 0 ||
    filters.selectedPerfumeNotes.length > 0 ||
    filters.selectedPerformance.length > 0 ||
    filters.selectedSpecification !== "all" ||
    filters.priceRange[0] !== DEFAULT_MIN ||
    filters.priceRange[1] !== DEFAULT_MAX ||
    sortOption !== DEFAULT_SORT ||
    debouncedSearch.length > 0 ||
    (!props.lockCategory && filters.selectedCategories.length > 0);

  const apiCategoryForAllProducts = isLocked
    ? props.categoryName
    : (filters.selectedCategories.join(",") || undefined);

  // 1) all products query (includes searchTerm)
  const allQuery = useGetAllProductsQuery(
    {
      page,
      limit,
      searchTerm: debouncedSearch || undefined,
      category: apiCategoryForAllProducts,
      gender: filters.selectedSpecification === "all" ? undefined : filters.selectedSpecification.toUpperCase(),
      section: props.section,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      accords: filters.selectedAccords.join(",") || undefined,
      perfumeNotes: filters.selectedPerfumeNotes.join(",") || undefined,
      performance: filters.selectedPerformance.join(",") || undefined,
      projection: filters.selectedProjection.join(",") || undefined,
      sortBy: sortMap[sortOption] as any,
    },
    {
      skip: props.lockCategory ? !isFilteringActive : false,
    }
  );

  // 2) category products query
  const catQuery = useGetProductsByCategoryIdQuery(
    {
      categoryId: categoryId as string,
      params: { page, limit },
    },
    {
      skip: !props.lockCategory || !props.categoryId || isFilteringActive,
    }
  );

  const active = isLocked ? (isFilteringActive ? allQuery : catQuery) : allQuery;
  const { data, isLoading, isFetching, error } = active;

  useEffect(() => {
    if (!isLoading && !isFetching) {
      setHasResolvedOnce(true);
    }
  }, [isLoading, isFetching]);

  useEffect(() => {
    if (Array.isArray(data?.data)) setStableProducts(data.data);
  }, [data?.data]);

  const products = Array.isArray(data?.data) ? data!.data : stableProducts;
  const totalPages = data?.meta?.totalPage || 1;

  const prevKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = routeKey;
      return;
    }
    if (prevKeyRef.current === routeKey) return;

    prevKeyRef.current = routeKey;
    scrollToProductsTopStable();
    setPageTransitionLoading(true);
  }, [routeKey]);

  useEffect(() => {
    const busy = isLoading || isFetching || pageTransitionLoading;

    if (Array.isArray(data?.data)) {
      setPageTransitionLoading(false);
    }

    if (busy && !timedOut) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setTimedOut(true);
        setPageTransitionLoading(false);
        setHasResolvedOnce(true);
      }, LOADING_TIMEOUT_MS);
      return;
    }

    if (!busy) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setTimedOut(false);
      setHasResolvedOnce(true);
    }
  }, [isLoading, isFetching, pageTransitionLoading, data?.data]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isBusy = (isLoading || isFetching || pageTransitionLoading) && !timedOut;
  const showInitialSkeleton = isBusy && products.length === 0;
  const showEmptyState = (hasResolvedOnce || timedOut) && !isBusy && !error && products.length === 0;

  // Sync URL Params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (page > 1) params.set("page", page.toString());
    else params.delete("page");

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (!props.lockCategory && filters.selectedCategories.length) {
      params.set("category", filters.selectedCategories.join(","));
    }
    if (filters.selectedSpecification !== "all") params.set("specification", filters.selectedSpecification);
    if (filters.selectedAccords.length) params.set("accords", filters.selectedAccords.join(","));
    else params.delete("accords");
    if (filters.selectedPerfumeNotes.length) params.set("perfumeNotes", filters.selectedPerfumeNotes.join(","));
    else params.delete("perfumeNotes");
    if (filters.selectedPerformance.length) params.set("performance", filters.selectedPerformance.join(","));
    else params.delete("performance");
    if (filters.selectedProjection.length) params.set("projection", filters.selectedProjection.join(","));
    else params.delete("projection");
    if (filters.priceRange[0] !== 100) params.set("minPrice", filters.priceRange[0].toString());
    else params.delete("minPrice");
    if (filters.priceRange[1] !== 5000) params.set("maxPrice", filters.priceRange[1].toString());
    else params.delete("maxPrice");
    if (sortOption !== "new-to-old") params.set("sortBy", sortOption);
    else params.delete("sortBy");
    if (props.section) params.set("section", props.section);
    else params.delete("section");

    const nextUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [page, filters, sortOption, debouncedSearch, props.section, pathname, router, searchParams, props.lockCategory]);

  const handleQuickView = (product: IProductResponse) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleApplyFilters = (newFilters: Partial<Filters>) => {
    setTimedOut(false);
    setHasResolvedOnce(false);

    setFilters((prev) => {
      const next = normalizeFilters(newFilters, prev);
      if (props.lockCategory && props.categoryName) {
        next.selectedCategories = [props.categoryName];
      }
      return next;
    });

    setPage(1);
    setVisibleProductsCount(limit);
  };

  const handleSortChange = (newSortOption: string) => {
    setTimedOut(false);
    setHasResolvedOnce(false);
    setSortOption(newSortOption);
    setPage(1);
    setVisibleProductsCount(limit);
  };

  const handleColumnChange = (cols: number) => {
    setColumns(cols);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setColumns(5);
      } else if (window.innerWidth >= 768) {
        setColumns(4);
      } else {
        setColumns(2);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const safeCols = typeof window !== "undefined" && window.innerWidth < 640 ? 2 : columns;

  const gridColsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-2 md:grid-cols-3",
      4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    }[safeCols] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  function ErrorUI() {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Perfumes</h3>
        <p className="text-sm text-gray-600 max-w-sm">Failed to fetch products. Please try again later.</p>
      </div>
    );
  }

  function NoProductsUI({ timedOut }: { timedOut?: boolean }) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
        <FilterIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {timedOut ? "Taking too long" : "No products found"}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm">
          {timedOut
            ? "The request didn’t finish within 20 seconds. Please try again."
            : "Try searching for a different keyword or resetting your filters."}
        </p>
      </div>
    );
  }

  function ProductsGrid({
    products,
    visibleProductsCount,
    gridColsClass,
    isBusy,
    onQuickView,
  }: {
    products: IProductResponse[];
    visibleProductsCount: number;
    gridColsClass: string;
    isBusy: boolean;
    onQuickView: (p: IProductResponse) => void;
  }) {
    return (
      <div className="relative">
        <div
          className={[
            `grid gap-2 sm:gap-3 md:gap-4 items-start ${gridColsClass}`,
            isBusy ? "opacity-60" : "opacity-100",
            "transition-opacity duration-200",
          ].join(" ")}
        >
          {products.slice(0, visibleProductsCount).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={() => onQuickView(product)}
            />
          ))}
        </div>

        {isBusy && products.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
            <div className="absolute left-0 right-0 top-0 h-0.75 overflow-hidden rounded-t-xl">
              <div className="h-full w-1/2 animate-[loadingbar_1.1s_ease-in-out_infinite] bg-green-700/80" />
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow-md">
                <Loader2 className="h-4 w-4 animate-spin text-green-700" />
                Loading products…
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="container mx-auto py-0 px-3 sm:px-4 relative" aria-labelledby="shop-products-heading">
      {page > 1 && <link rel="prev" href={`/shop?page=${page - 1}`} />}
      {page < totalPages && <link rel="next" href={`/shop?page=${page + 1}`} />}

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Premium Perfume Oil Collection",
            description: "Explore Khushbuwaala's curated collection of world-class perfume oils and fragrances",
            url: `https://khushbuwaala.com/shop${page > 1 ? `?page=${page}` : ""}`,
            mainEntity: {
              "@type": "ItemList",
              name: "Perfume Oil Products",
              description: "Premium quality perfume oils and fragrances",
              itemListElement: products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1 + (page - 1) * limit,
                url: `https://khushbuwaala.com/product/${product.slug}`,
                name: product.name,
              })),
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
                { "@type": "ListItem", position: 2, name: "Shop", item: "https://khushbuwaala.com/shop" },
              ],
            },
          }),
        }}
      />

      <h2 id="shop-products-heading" className="sr-only">
        All Products
      </h2>

      {/* Sticky Controls Bar */}
      <div className="sticky top-0 z-40 flex items-center gap-2 bg-white/95 backdrop-blur-xl py-2 sm:py-3 px-2 sm:px-4 rounded-b-xl shadow-sm mb-4 sm:mb-8 border border-gray-200 transition-all duration-300">
        {/* Filter Button */}
        <Button
          variant="outline"
          className="h-8.5! min-h-0! py-0! flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 bg-white rounded-lg px-2.5 sm:px-4 shadow-xs shrink-0"
          onClick={() => setIsFilterSheetVisible(true)}
          aria-controls="filter-sheet"
          aria-expanded={isFilterSheetVisible}
        >
          <FilterIcon className="h-3.5 w-3.5" />
          <span>Filter</span>
        </Button>

        {/* Embedded Live Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search perfumes, notes, attars..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-8.5 sm:h-9 pl-8 pr-7 text-xs bg-gray-50/80 border-gray-200 rounded-lg placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-green-600 focus-visible:bg-white transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Columns Toggles */}
        <div className="hidden lg:flex gap-1 bg-gray-50 p-1 rounded-lg shrink-0 border border-gray-100">
          <Button
            variant="outline"
            size="icon"
            className={`h-7 w-7 text-gray-700 rounded-md border-transparent ${columns === 3 ? "bg-white text-green-700 shadow-xs border-gray-200" : "bg-transparent hover:bg-white"
              }`}
            onClick={() => handleColumnChange(3)}
            aria-label="Show products in 3 columns"
          >
            <Columns3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`hidden lg:flex h-7 w-7 text-gray-700 rounded-md border-transparent ${columns === 4 ? "bg-white text-green-700 shadow-xs border-gray-200" : "bg-transparent hover:bg-white"
              }`}
            onClick={() => handleColumnChange(4)}
            aria-label="Show products in 4 columns"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`hidden xl:flex h-7 w-7 text-gray-700 rounded-md border-transparent ${columns === 5 ? "bg-white text-green-700 shadow-xs border-gray-200" : "bg-transparent hover:bg-white"
              }`}
            onClick={() => handleColumnChange(5)}
            aria-label="Show products in 5 columns"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Integrated Sort Dropdown */}
        <div className="shrink-0">
          <SortDropdown
            value={sortOption}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Main Product Container */}
      <div className="overflow-x-hidden">
        <div ref={productsTopRef} />

        {showInitialSkeleton ? (
          <ShopProductsSkeletonGrid />
        ) : error ? (
          <ErrorUI />
        ) : products.length > 0 ? (
          <ProductsGrid
            products={products}
            visibleProductsCount={visibleProductsCount}
            gridColsClass={gridColsClass}
            isBusy={isBusy}
            onQuickView={handleQuickView}
          />
        ) : showEmptyState ? (
          <NoProductsUI timedOut={timedOut} />
        ) : (
          <ShopProductsSkeletonGrid colsClass={gridColsClass} />
        )}

        {/* Pagination */}
        <div className="mt-8 mb-8">
          <div className="mx-auto w-full max-w-full overflow-x-hidden">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 sm:h-9 px-3 text-xs sm:text-sm rounded-lg"
              >
                Previous
              </Button>

              {(() => {
                const total = totalPages;
                const current = page;
                const delta = 1;
                const range: number[] = [];
                const rangeWithDots: (number | "...")[] = [];

                const left = Math.max(2, current - delta);
                const right = Math.min(total - 1, current + delta);

                range.push(1);
                for (let i = left; i <= right; i++) range.push(i);
                if (total > 1) range.push(total);

                const uniq = Array.from(new Set(range)).sort((a, b) => a - b);

                for (let i = 0; i < uniq.length; i++) {
                  const n = uniq[i];
                  const prev = uniq[i - 1];

                  if (i > 0 && prev !== undefined && n - prev > 1) {
                    rangeWithDots.push("...");
                  }
                  rangeWithDots.push(n);
                }

                return rangeWithDots.map((item, idx) => {
                  if (item === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-xs sm:text-sm text-gray-500 select-none">
                        …
                      </span>
                    );
                  }

                  const pageNum = item as number;

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={[
                        "h-8 sm:h-9 min-w-8 sm:min-w-9 px-2 sm:px-3 rounded-lg text-xs sm:text-sm",
                        page === pageNum
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      ].join(" ")}
                    >
                      {pageNum}
                    </Button>
                  );
                });
              })()}

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 sm:h-9 px-3 text-xs sm:text-sm rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FilterSheet
        visible={isFilterSheetVisible}
        onClose={setIsFilterSheetVisible}
        onApplyFilters={handleApplyFilters}
        initialFilters={{ categoryName: props.categoryName }}
        lockCategory={props.lockCategory}
      />
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
        />
      )}
    </section>
  );
}