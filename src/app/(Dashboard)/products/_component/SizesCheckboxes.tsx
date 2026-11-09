'use client';

import { VariantForForm } from "@/types/product.types";
import { useFormContext, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

interface FormValues {
  variants: VariantForForm[];
}

export default function SizesCheckboxes({ selectedSizes }: { selectedSizes: string[] }) {
  const form = useFormContext<FormValues>();

  const variants = useWatch({ control: form.control, name: "variants" }) || [];
  const unitFromCategory = variants[0]?.unit || "ML";

  if (!selectedSizes || selectedSizes.length === 0) {
    return (
      <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
        Custom sizing active. Use &quot;Add Variant Row&quot; below.
      </span>
    );
  }

  const handleToggleSize = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    const current = form.getValues("variants") || [];
    const unit = current[0]?.unit || unitFromCategory || "ML";

    const exists = current.some((v) => String(v.size) === String(size));

    if (exists) {
      const updated = current.filter((v) => String(v.size) !== String(size));
      form.setValue("variants", updated, { shouldDirty: true, shouldValidate: true });
    } else {
      const updated = [
        ...current,
        { id: uuidv4(), size, price: 0, stock: 0, sku: "", unit },
      ];
      form.setValue("variants", updated, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-500 font-medium mr-1">Quick Sizes:</span>
      {selectedSizes.map((size) => {
        const checked = variants.some((v) => String(v.size) === String(size));

        return (
          <button
            key={size}
            type="button"
            onClick={(e) => handleToggleSize(size, e)}
            className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all select-none ${checked
                ? "bg-orange-50 border-[#FB923C] text-orange-900 shadow-2xs ring-1 ring-[#FB923C]"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <span className={`w-3 h-3 rounded-full border flex items-center justify-center text-[9px] ${checked ? 'bg-[#FB923C] border-[#FB923C] text-white' : 'border-gray-300'}`}>
              {checked ? '✓' : ''}
            </span>
            <span>{size} {unitFromCategory}</span>
          </button>
        );
      })}
    </div>
  );
}