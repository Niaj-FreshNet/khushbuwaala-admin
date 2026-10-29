"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortDropdownProps {
  value: string;
  onSortChange: (sortOption: string) => void;
  className?: string;
}

export const SORT_OPTIONS = [
  { label: "A-Z", value: "a-z" },
  { label: "Z-A", value: "z-a" },
  { label: "Lowest to High", value: "low-to-high" },
  { label: "Highest to Low", value: "high-to-low" },
  { label: "Most Selling", value: "featured" },
  { label: "On Sale", value: "onSale" },
];

export function SortDropdown({ value, onSortChange, className }: SortDropdownProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <Select value={value} onValueChange={onSortChange}>
        <SelectTrigger
          className="h-8.5! min-h-0! py-0! px-2.5 sm:px-3 rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs focus:ring-1 focus:ring-emerald-600 gap-1.5 transition-all cursor-pointer"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent align="end" className="text-xs rounded-xl shadow-lg border-gray-200">
          {SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs cursor-pointer focus:bg-emerald-50 focus:text-emerald-800"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default SortDropdown;