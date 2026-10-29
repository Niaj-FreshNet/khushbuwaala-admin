'use client';

import { VariantForForm } from "@/types/product.types";
import { useFormContext, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

interface FormValues {
  variants: VariantForForm[];
}

export default function SizesCheckboxes({ selectedSizes }: { selectedSizes: string[] }) {
  const form = useFormContext<FormValues>();

  // ✅ reactively read variants so unit updates in UI
  const variants = useWatch({ control: form.control, name: "variants" }) || [];

  // ✅ category unit is synced into variants by CategorySizesUpdater
  const unitFromCategory = variants[0]?.unit || "";

  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {selectedSizes.map((size) => {
        const checked = variants.some((v) => String(v.size) === String(size));

        return (
          <label
            key={size}
            className="flex items-center gap-1 text-sm text-gray-900 font-bold"
          >
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-900 accent-[#FB923C]"
              checked={checked}
              onChange={(e) => {
                const current = form.getValues("variants") || [];
                const unit = current[0]?.unit || unitFromCategory || "";

                if (e.target.checked) {
                  // ✅ prevent duplicate
                  if (current.some((v) => String(v.size) === String(size))) return;

                  form.setValue(
                    "variants",
                    [
                      ...current,
                      { id: uuidv4(), size, price: 0, stock: 0, sku: "", unit },
                    ],
                    { shouldDirty: true, shouldValidate: true }
                  );
                } else {
                  form.setValue(
                    "variants",
                    current.filter((v) => String(v.size) !== String(size)),
                    { shouldDirty: true, shouldValidate: true }
                  );
                }
              }}
            />

            {/* ✅ show size + category unit */}
            <span className="text-sm text-gray-900">
              {size} {unitFromCategory}
            </span>
          </label>
        );
      })}
    </div>
  );
}
