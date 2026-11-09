'use client';

import { useEffect } from "react";
import FormInput from "@/components/ReusableUI/FormInput";
import { Button } from "@/components/ui/button";
import { VariantForForm } from "@/types/product.types";
import { X } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

interface Props {
  selectedSizes: string[];
}

interface FormValues {
  name: string;
  variants: VariantForForm[];
}

export const VariantsSection = ({ selectedSizes }: Props) => {
  const form = useFormContext<FormValues>();

  const productName = useWatch({ control: form.control, name: "name" });
  const variants = useWatch({ control: form.control, name: "variants" }) || [];

  // Auto-generate SKUs when name, size, or unit changes
  useEffect(() => {
    const existing = form.getValues("variants") || [];

    const updated = existing.map((variant) => {
      const namePart =
        productName?.trim().replace(/\s+/g, "").toUpperCase() || "PRODUCT";

      const sizePart = variant.size ? String(variant.size).toUpperCase() : "SIZE";
      const resolvedUnit = String(variant.unit || "ML").trim().toUpperCase();
      const skuWithDash = `KWP-${namePart}-${sizePart}-${resolvedUnit}`;

      return {
        ...variant,
        unit: resolvedUnit,
        sku: skuWithDash,
      };
    });

    const changed =
      updated.length !== existing.length ||
      updated.some((v, i) => v.sku !== existing[i]?.sku || v.unit !== existing[i]?.unit);

    if (changed) {
      form.setValue("variants", updated, { shouldDirty: true });
    }
  }, [productName, variants.map(v => `${v.size}-${v.unit}`).join("|"), form]);

  if (variants.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg text-gray-400 text-xs">
        No variants configured. Click &quot;Add New Variant Row&quot; below to start.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <div key={variant.id || index} className="border border-gray-200/80 bg-gray-50/60 rounded-xl p-3.5 shadow-2xs relative">
          <div className="absolute top-3 right-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                const allVariants = form.getValues("variants") || [];
                form.setValue("variants", allVariants.filter((_, i) => i !== index), { shouldDirty: true });
              }}
              title="Remove Variant"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pr-8 sm:pr-0">
            {/* Fully Editable Size */}
            <FormInput
              name={`variants.${index}.size`}
              label="Size Value"
              placeholder="e.g. 50"
              inputClassName="border-gray-300 text-xs h-9 bg-white"
            />

            {/* Fully Editable Price */}
            <FormInput
              name={`variants.${index}.price`}
              label="Price (BDT)"
              type="number"
              inputClassName="border-gray-300 text-xs h-9 bg-white"
              value={variant.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value === "" ? 0 : Number(e.target.value);
                const allVariants = form.getValues("variants") || [];
                allVariants[index].price = value;
                form.setValue("variants", allVariants, { shouldDirty: true });
              }}
            />

            {/* Fully Editable Unit (e.g. ML, GM, PCS, OZ) */}
            <FormInput
              name={`variants.${index}.unit`}
              label="Unit"
              placeholder="ML / GM"
              inputClassName="border-gray-300 text-xs h-9 bg-white uppercase"
              value={variant.unit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.toUpperCase();
                const allVariants = form.getValues("variants") || [];
                allVariants[index].unit = value;
                form.setValue("variants", allVariants, { shouldDirty: true });
              }}
            />

            {/* Auto SKU display */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Auto SKU Code</label>
              <input
                value={variant.sku ? variant.sku.replace(/-/g, "") : ""}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 h-9 text-xs text-gray-500 bg-gray-100 cursor-not-allowed truncate"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};