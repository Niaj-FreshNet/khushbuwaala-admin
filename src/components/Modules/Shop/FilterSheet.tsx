"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, FilterIcon, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  visible: boolean;
  onClose: (open: boolean) => void;
  onApplyFilters: (filters: any) => void;
  initialFilters?: {
    categoryName?: string;
  };
  lockCategory?: boolean;
}

export function FilterSheet({
  visible,
  onClose,
  onApplyFilters,
  initialFilters,
  lockCategory,
}: FilterSheetProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.categoryName ? [initialFilters.categoryName] : []
  );
  const [selectedSpecification, setSelectedSpecification] = useState<string>("all");
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [selectedPerfumeNotes, setSelectedPerfumeNotes] = useState<string[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<string[]>([]);
  const [selectedProjection, setSelectedProjection] = useState<string[]>([]);

  const lockedCategory = initialFilters?.categoryName?.trim() || "";

  const CATEGORY_OPTIONS = [
    { value: "ORGANIC ATTAR", label: "Organic Attar" },
    { value: "NATURAL ATTAR", label: "Natural Collections" },
    { value: "ORIENTAL ATTAR", label: "Oriental Collections" },
    { value: "ARTIFICIAL OUD", label: "Artificial Oud" },
    { value: "BRAND PERFUMES", label: "Brand Perfumes" },
    { value: "NICHE PERFUMES", label: "Niche Perfumes" },
    { value: "INSPIRED PERFUME OIL", label: "Inspired Perfume Oil" },
    { value: "GIFTS AND PACKAGES", label: "Combo Packages" },
    { value: "ACCESSORIES", label: "ACCESSORIES" },
  ];

  const visibleCategoryOptions =
    lockCategory && lockedCategory
      ? [{ value: lockedCategory, label: lockedCategory }]
      : CATEGORY_OPTIONS;

  const prevFiltersRef = useRef({
    priceRange,
    selectedCategories,
    selectedSpecification,
    selectedAccords,
    selectedPerfumeNotes,
    selectedPerformance,
    selectedProjection,
  });

  useEffect(() => {
    const currentFilters = {
      priceRange,
      selectedCategories,
      selectedSpecification,
      selectedAccords,
      selectedPerfumeNotes,
      selectedPerformance,
      selectedProjection,
    };

    const changed =
      prevFiltersRef.current.priceRange[0] !== currentFilters.priceRange[0] ||
      prevFiltersRef.current.priceRange[1] !== currentFilters.priceRange[1] ||
      prevFiltersRef.current.selectedSpecification !== currentFilters.selectedSpecification ||
      prevFiltersRef.current.selectedCategories.join(",") !== currentFilters.selectedCategories.join(",") ||
      prevFiltersRef.current.selectedAccords.join(",") !== currentFilters.selectedAccords.join(",") ||
      prevFiltersRef.current.selectedPerfumeNotes.join(",") !== currentFilters.selectedPerfumeNotes.join(",") ||
      prevFiltersRef.current.selectedPerformance.join(",") !== currentFilters.selectedPerformance.join(",") ||
      prevFiltersRef.current.selectedProjection.join(",") !== currentFilters.selectedProjection.join(",");

    if (changed) {
      onApplyFilters(currentFilters);
      prevFiltersRef.current = currentFilters;
    }
  }, [
    priceRange,
    selectedCategories,
    selectedSpecification,
    selectedAccords,
    selectedPerfumeNotes,
    selectedPerformance,
    selectedProjection,
    onApplyFilters,
  ]);

  const handleReset = () => {
    const resetFilters = {
      priceRange: [100, 5000] as [number, number],
      selectedCategories:
        lockCategory && initialFilters?.categoryName
          ? [initialFilters.categoryName]
          : [],
      selectedSpecification: "all",
      selectedAccords: [],
      selectedPerfumeNotes: [],
      selectedPerformance: [],
      selectedProjection: [],
    };

    setPriceRange(resetFilters.priceRange);
    setSelectedCategories(resetFilters.selectedCategories);
    setSelectedSpecification(resetFilters.selectedSpecification);
    setSelectedAccords(resetFilters.selectedAccords);
    setSelectedPerfumeNotes(resetFilters.selectedPerfumeNotes);
    setSelectedPerformance(resetFilters.selectedPerformance);
    setSelectedProjection(resetFilters.selectedProjection);

    onApplyFilters(resetFilters);
  };

  const smellTypes = {
    smellAccords: [
      { value: "Corporate", label: "Corporate" },
      { value: "Refreshing", label: "Refreshing" },
      { value: "Manly", label: "Manly" },
      { value: "Floral", label: "Floral" },
      { value: "Fruity", label: "Fruity" },
      { value: "Sweet", label: "Sweet" },
      { value: "Spicy", label: "Spicy" },
      { value: "Strong", label: "Strong" },
    ],
    perfumeNotes: [
      { value: "Musk", label: "Musk" },
      { value: "Amber", label: "Amber" },
      { value: "Rose", label: "Rose" },
      { value: "Jasmine", label: "Jasmine" },
      { value: "Vanilla", label: "Vanilla" },
      { value: "Sandalwood", label: "Sandalwood" },
      { value: "Oud", label: "Oud" },
      { value: "Bergamot", label: "Bergamot" },
      { value: "Patchouli", label: "Patchouli" },
      { value: "Saffron", label: "Saffron" },
      { value: "Cedarwood", label: "Cedarwood" },
      { value: "Vetiver", label: "Vetiver" },
      { value: "Lavender", label: "Lavender" },
      { value: "Citrus", label: "Citrus" },
      { value: "Iris", label: "Iris" },
      { value: "Incense", label: "Incense" },
      { value: "Leather", label: "Leather" },
      { value: "Coconut", label: "Coconut" },
      { value: "Caramel", label: "Caramel" },
      { value: "Honey", label: "Honey" },
      { value: "Geranium", label: "Geranium" },
      { value: "Mint", label: "Mint" },
      { value: "Tonka Bean", label: "Tonka Bean" },
      { value: "Cinnamon", label: "Cinnamon" },
    ],
    performance: [
      { value: "BEAST_MODE", label: "Ultra (12h+)" },
      { value: "EXCELLENT", label: "Excellent (8-10h)" },
      { value: "GOOD", label: "Good (5-6h)" },
      { value: "MODERATE", label: "Moderate (3-4h)" },
    ],
    projection: [
      { value: "NUCLEAR", label: "Nuclear (10ft+)" },
      { value: "STRONG", label: "Strong (7-9ft)" },
      { value: "MODERATE", label: "Moderate (4-6ft)" },
      { value: "INTIMATE", label: "Intimate (1-2ft)" },
    ],
  };

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[88vw] max-w-87.5 flex flex-col h-full p-0 bg-white border-r border-gray-200"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b bg-linear-to-r from-emerald-50/70 via-gray-50/50 to-white shrink-0">
          <SheetTitle className="flex items-center justify-between text-base font-bold text-gray-900">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100/70 rounded-lg text-emerald-700">
                <FilterIcon className="h-4 w-4" />
              </div>
              <span>Filter Products</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3 overflow-y-auto">
          <div className="flex flex-col space-y-3.5 pb-4">
            {/* Category Dropdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
                Category
              </label>
              <Select
                disabled={!!lockCategory}
                value={selectedCategories[0] || "all"}
                onValueChange={(value) =>
                  setSelectedCategories(value === "all" ? [] : [value])
                }
              >
                <SelectTrigger className="w-full h-8.5! min-h-0! py-0! bg-gray-50/60 text-xs border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-600">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {!lockCategory && <SelectItem value="all">All Categories</SelectItem>}
                  {visibleCategoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience Dropdown */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
                For Whom
              </label>
              <Select
                value={selectedSpecification}
                onValueChange={setSelectedSpecification}
              >
                <SelectTrigger className="w-full h-8.5! min-h-0! py-0! bg-gray-50/60 text-xs border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-600">
                  <SelectValue placeholder="For Men or Women?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All</SelectItem>
                  <SelectItem value="unisex" className="text-xs">Unisex</SelectItem>
                  <SelectItem value="male" className="text-xs">Men</SelectItem>
                  <SelectItem value="female" className="text-xs">Women</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-gray-100" />

            {/* Filter Groups */}
            {Object.entries(smellTypes).map(([groupName, items]) => {
              const isSingleSelect = groupName === "performance" || groupName === "projection";
              const isChipLayout = groupName === "smellAccords" || groupName === "perfumeNotes";

              const selected =
                groupName === "smellAccords"
                  ? selectedAccords
                  : groupName === "perfumeNotes"
                    ? selectedPerfumeNotes
                    : groupName === "performance"
                      ? selectedPerformance
                      : selectedProjection;

              const setSelected =
                groupName === "smellAccords"
                  ? setSelectedAccords
                  : groupName === "perfumeNotes"
                    ? setSelectedPerfumeNotes
                    : groupName === "performance"
                      ? setSelectedPerformance
                      : setSelectedProjection;

              const handleToggle = (val: string) => {
                if (isSingleSelect) {
                  setSelected(selected.includes(val) ? [] : [val]);
                } else {
                  setSelected((prev) =>
                    prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
                  );
                }
              };

              return (
                <div key={groupName} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {groupName.replace(/([A-Z])/g, " $1")}
                    </span>
                    {selected.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                        {selected.length} selected
                      </span>
                    )}
                  </div>

                  {/* Accords & Perfume Notes as Multi-select Chips */}
                  {isChipLayout ? (
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-0.5">
                      {items.map((item) => {
                        const checked = selected.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleToggle(item.value)}
                            className={cn(
                              "h-7! min-h-0! py-0! inline-flex items-center gap-1 text-[11px] px-2 rounded-md border font-medium transition-all active:scale-95 cursor-pointer leading-none",
                              checked
                                ? "border-emerald-700 text-emerald-600 font-bold shadow-xs"
                                : "bg-gray-50/70 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                            )}
                          >
                            {checked && <Check className="w-2.5 h-2.5 stroke-3" />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Performance & Projection in Compact 2-column Grid */
                    <div className="grid grid-cols-2 gap-1">
                      {items.map((item) => {
                        const checked = selected.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleToggle(item.value)}
                            className={cn(
                              "h-8.5! min-h-0! py-0! text-[11px] px-2.5 rounded-lg border text-left font-medium transition-all truncate active:scale-98 cursor-pointer flex items-center leading-none",
                              checked
                                ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold shadow-2xs"
                                : "bg-gray-50/70 text-gray-700 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <Separator className="bg-gray-100" />

            {/* Price Range */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Price Range
              </label>
              <Slider
                min={100}
                max={10000}
                step={50}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="w-full py-1 **:[[role=slider]]:border-emerald-600 **:[[role=slider]]:bg-white [&_.bg-primary]:bg-emerald-600"
              />
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>৳ {priceRange[0]}</span>
                <span>৳ {priceRange[1]}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions with h-8.5! min-h-0! py-0! */}
        <div className="p-3 border-t bg-gray-50/60 shrink-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-8.5! min-h-0! py-0! border-gray-200 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
            onClick={handleReset}
          >
            Reset
          </Button>
          <button
            className="flex-1 h-8.5! min-h-0! py-0! bg-white border rounded-md border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-600 hover:text-emerald-700 text-xs font-semibold shadow-xs active:scale-98 cursor-pointer"
            onClick={() => onClose(false)}
          >
            Apply
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}