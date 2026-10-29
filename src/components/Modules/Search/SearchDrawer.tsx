"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  TagIcon,
  TrendingUp,
  Clock,
  Loader2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchProductsQuery } from "@/redux/store/api/product/productApi";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const trendingSearches = ["Dior Sauvage", "Oud", "Rose", "Vanilla"];
const recentSearches = ["Axe Signature", "Prada Candy"];

const smellTypes = [
  "Corporate",
  "Citrusy",
  "Manly",
  "Earthy",
  "Leathery",
  "Soapy",
  "Refreshing",
  "Fruity",
  "Sweet",
  "Chocolate",
  "Vanilla",
  "Candy",
  "Floral",
  "Powdery",
  "Bergamote",
  "Lavender",
  "Vetiver",
  "Woody",
  "Spicy",
  "Smooky",
  "Strong",
  "Amber",
  "Musky",
  "Nostalgic",
  "Projective",
  "Longetive",
  "Synthetic",
  "Organic",
];

function computeDiscountedPrice(basePrice: number, discount: any) {
  if (!discount || typeof discount.value !== "number") return basePrice;
  if (discount.type === "percentage") {
    return Math.max(0, Math.round(basePrice * (1 - discount.value / 100)));
  }
  if (discount.type === "fixed") {
    return Math.max(0, Math.round(basePrice - discount.value));
  }
  return basePrice;
}

export default function SearchDrawer({ visible, onClose }: SearchDrawerProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [showMoreTrending, setShowMoreTrending] = useState(false);
  const [showMoreRecent, setShowMoreRecent] = useState(false);
  const [showMoreRefine, setShowMoreRefine] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // Focus input when drawer opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [visible]);

  // Fetch search results from backend
  const { data, isFetching, isError } = useSearchProductsQuery(
    {
      searchTerm: debouncedSearch,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      limit: 30,
      page: 1,
    },
    { skip: !debouncedSearch }
  );

  const products = data?.data || [];
  const isTypingOrSearching = searchValue.trim() !== debouncedSearch || isFetching;

  const dismissKeyboard = () => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchValue(tag);
    setDebouncedSearch(tag);
    dismissKeyboard();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(searchValue.trim());
      dismissKeyboard();
    }
  };

  // Navigates to shop with filter sheet auto-opened
  const handleOpenShopFilter = () => {
    onClose();
    const query = selectedCategory && selectedCategory !== "all"
      ? `?category=${encodeURIComponent(selectedCategory)}&openFilters=true`
      : `?openFilters=true`;
    router.push(`/shop${query}`);
  };

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[320px] md:w-135 flex flex-col p-0 bg-white h-full border-l border-gray-200"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-linear-to-r from-red-50/60 via-emerald-50/30 to-white">
          <SheetTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
            <div className="p-2 bg-blue-100/80 rounded-xl text-blue-600">
              <Search className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span>Search Fragrances</span>
              <span className="text-xs font-normal text-gray-500">
                Discover your signature scent
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Controls Container */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-3 space-y-2.5 border-b bg-white">
            {/* Search Input with Live Spinner */}
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {isTypingOrSearching && debouncedSearch ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Search className="h-4 w-4 group-focus-within:text-blue-600 transition-colors" />
                )}
              </div>

              <Input
                ref={searchInputRef}
                type="text"
                enterKeyHint="search"
                placeholder="Search perfumes, notes, brands..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 h-10 border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all bg-gray-50/50 focus:bg-white shadow-none focus:ring-1 focus:ring-red-500"
              />

              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-gray-100 text-gray-400"
                  onClick={() => {
                    setSearchValue("");
                    setDebouncedSearch("");
                  }}
                  aria-label="Clear input"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Category Select & Shop Filter Button Side-by-Side */}
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 h-8.5! min-h-0! py-0 border-gray-200 rounded-lg bg-white text-xs font-medium text-gray-700 focus:ring-1 focus:ring-emerald-600">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ORGANIC ATTAR">Organic Attar</SelectItem>
                  <SelectItem value="NATURAL ATTAR">Natural Collections</SelectItem>
                  <SelectItem value="ORIENTAL ATTAR">Oriental Collections</SelectItem>
                  <SelectItem value="ARTIFICIAL OUD">Artificial Oud</SelectItem>
                  <SelectItem value="BRAND PERFUMES">Brand Perfumes</SelectItem>
                  <SelectItem value="INSPIRED PERFUME OIL">Inspired Perfume Oil</SelectItem>
                  <SelectItem value="NICHE PERFUMES">Niche Perfumes</SelectItem>
                  <SelectItem value="GIFTS AND PACKAGES">Combo Packages</SelectItem>
                  <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Sheet Shortcut */}
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenShopFilter}
                className="h-8.5! min-h-0! py-0 px-3 rounded-lg border-emerald-600/30 bg-gray-50 hover:bg-emerald-100 text-black text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Open Shop Filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-black" />
                <span>Filters</span>
              </Button>
            </div>

            {/* Trending & Recent Searches */}
            {debouncedSearch === "" && (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Trending Fragrances:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(showMoreTrending ? trendingSearches : trendingSearches.slice(0, 4)).map((search) => (
                      <Badge
                        key={search}
                        variant="secondary"
                        className="cursor-pointer text-xs py-1 px-2.5 bg-gray-100/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent rounded-lg transition-all"
                        onClick={() => handleTagClick(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                    {trendingSearches.length > 4 && (
                      <Badge
                        variant="outline"
                        className="cursor-pointer text-xs py-1 px-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        onClick={() => setShowMoreTrending(!showMoreTrending)}
                      >
                        {showMoreTrending ? "Less" : "More..."}
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Recent Searches:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(showMoreRecent ? recentSearches : recentSearches.slice(0, 4)).map((search) => (
                      <Badge
                        key={search}
                        variant="outline"
                        className="cursor-pointer text-xs py-0.5 px-2 bg-gray-50 text-gray-700 hover:bg-emerald-100 rounded-md border border-gray-200 hover:border-emerald-200 transition-all"
                        onClick={() => handleTagClick(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Filter Accord Tags */}
            {debouncedSearch && (
              <div className="pt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                  <TagIcon className="h-3.5 w-3.5 text-emerald-600" />
                  Filter by Notes:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(showMoreRefine ? smellTypes : smellTypes.slice(0, 5)).map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="cursor-pointer text-[11px] py-0.5 px-2 bg-gray-50 text-gray-700 hover:bg-emerald-100 rounded-md border border-gray-200 hover:border-emerald-200 transition-all"
                      onClick={() => handleTagClick(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                  {smellTypes.length > 5 && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-[11px] py-0.5 px-2 rounded-md text-gray-500 hover:bg-gray-100"
                      onClick={() => setShowMoreRefine(!showMoreRefine)}
                    >
                      {showMoreRefine ? "Less" : "More..."}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results Area with Live Status Bar */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {isTypingOrSearching && debouncedSearch && (
              <div className="absolute top-0 left-0 right-0 h-0.5 z-30 bg-red-100 overflow-hidden">
                <div className="h-full bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 w-2/5 animate-[loadingbar_1s_ease-in-out_infinite]" />
              </div>
            )}

            <div className="px-6 py-2.5 bg-gray-50/80 border-b flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700">Results</span>
              <div className="flex items-center gap-1.5">
                {isTypingOrSearching && debouncedSearch ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">
                    {debouncedSearch ? `${products.length} Found` : "Catalog"}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Products List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-2.5">
                {debouncedSearch === "" ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4 text-gray-400">
                    <div className="p-3 bg-gray-100 rounded-full mb-3 text-emerald-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Type above to search</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                      Search by perfume name, notes (e.g. Vanilla, Oud), or category
                    </p>
                  </div>
                ) : isFetching && products.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-3 p-3 border border-gray-100 rounded-xl bg-white shadow-xs">
                        <Skeleton className="w-16 h-20 rounded-lg shrink-0 bg-gray-200" />
                        <div className="flex-1 space-y-2 py-1">
                          <Skeleton className="h-4 w-3/4 bg-gray-200" />
                          <Skeleton className="h-3 w-1/3 bg-gray-200" />
                          <Skeleton className="h-3 w-1/2 bg-gray-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-center text-red-500 py-12 text-sm font-medium">
                    Failed to fetch search results. Please try again.
                  </div>
                ) : products.length > 0 ? (
                  <div className={cn("space-y-2.5 transition-opacity duration-200", isTypingOrSearching && "opacity-75")}>
                    {products.map((product) => {
                      const accords = product.accords || [];
                      const visibleAccords = accords.slice(0, 2);
                      const extraCount = Math.max(0, accords.length - visibleAccords.length);

                      const basePrice = product.minPrice ?? 0;
                      const hasDiscount = Boolean(product.discount);
                      const finalPrice = hasDiscount
                        ? computeDiscountedPrice(basePrice, product.discount)
                        : basePrice;

                      const discountBadgeText =
                        product.discount?.type === "percentage"
                          ? `-${Math.round(product.discount.value)}%`
                          : product.discount?.type === "fixed"
                            ? `-৳${Math.round(product.discount.value)}`
                            : null;

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          onClick={onClose}
                          className="block"
                        >
                          <div className="group flex gap-3.5 p-2.5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-xs transition-all bg-white">
                            <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                              <img
                                src={product.primaryImage || "/placeholder.svg?height=80&width=64"}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                              <h4 className="font-semibold text-sm leading-tight text-gray-900 group-hover:text-black transition-colors truncate">
                                {product.name}
                              </h4>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-gray-900">
                                  ৳{finalPrice}
                                </span>
                                {hasDiscount && (
                                  <>
                                    <span className="text-xs text-gray-400 line-through">
                                      ৳{basePrice}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-green-50 text-green-600 text-[10px] font-bold border border-green-200">
                                      {discountBadgeText}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-1 pt-0.5">
                                {visibleAccords.map((acc: string) => (
                                  <span
                                    key={acc}
                                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50/70 text-gray-800 border border-gray-200 truncate max-w-[90px]"
                                  >
                                    {acc}
                                  </span>
                                ))}
                                {extraCount > 0 && (
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    +{extraCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-16 text-gray-400">
                    <p className="text-sm font-medium text-gray-600">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with broader terms or check the spelling.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}