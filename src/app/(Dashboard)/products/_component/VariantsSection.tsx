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

  // ✅ Hooks must be top-level
  const productName = useWatch({ control: form.control, name: "name" });
  const variants = useWatch({ control: form.control, name: "variants" }) || [];
  const categoryUnit = useWatch({ control: form.control, name: "variants.0.unit" }) || "";

  // ✅ Sync sizes <-> variants
  useEffect(() => {
    const existingVariants = form.getValues("variants") || [];

    // Add new sizes
    const newVariants = selectedSizes
      .filter((size) => !existingVariants.some((v) => String(v.size) === String(size)))
      .map((size) => ({
        size,
        price: 111,
        unit: categoryUnit || existingVariants.find(v => v.unit)?.unit || "", // ✅ dynamic unit
        sku: "",
      }));

    let next = existingVariants;

    if (newVariants.length > 0) {
      next = [...next, ...newVariants];
    }

    // Remove unselected sizes
    const filtered = next.filter((v) => selectedSizes.includes(String(v.size)));

    // Only set if changed (avoid loops)
    const changed =
      filtered.length !== existingVariants.length ||
      filtered.some((v, i) =>
        String(v.size) !== String(existingVariants[i]?.size) ||
        String(v.unit || "") !== String(existingVariants[i]?.unit || "")
      );

    if (changed) {
      form.setValue("variants", filtered, { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedSizes, categoryUnit, form]);

  // ✅ Auto-generate SKU
  useEffect(() => {
    const existing = form.getValues("variants") || [];

    const updated = existing.map((variant) => {
      const namePart =
        productName?.trim().replace(/\s+/g, "").toUpperCase() || "PRODUCT";

      const sizePart = variant.size ? String(variant.size).toUpperCase() : "SIZE";

      // ✅ use categoryUnit if variant.unit missing
      const resolvedUnit = String(variant.unit || categoryUnit || "").trim();
      const unitPart = resolvedUnit ? resolvedUnit.toUpperCase() : "UNIT";

      const skuWithDash = `KWP-${namePart}-${sizePart}-${unitPart}`;

      return {
        ...variant,
        unit: resolvedUnit,       // ✅ keep dynamic unit
        sku: skuWithDash,
      };
    });

    // Avoid infinite set loop
    const changed =
      updated.length !== existing.length ||
      updated.some((v, i) => v.sku !== existing[i]?.sku || v.unit !== existing[i]?.unit);

    if (changed) {
      form.setValue("variants", updated, { shouldDirty: true });
    }
  }, [productName, categoryUnit, variants.map(v => `${v.size}-${v.unit}`).join("|"), form]);

  return (
    <div>
      {variants.map((variant, index) => (
        <div key={variant.id || index} className="border border-[#FB923C] rounded-lg p-4 mb-4">
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const allVariants = form.getValues("variants") || [];
                form.setValue("variants", allVariants.filter((_, i) => i !== index), { shouldDirty: true });
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Size */}
            <FormInput
              name={`variants.${index}.size`}
              label="Size"
              type="select"
              options={selectedSizes.map((size) => ({
                value: size,
                label: `${size} ${variant.unit || categoryUnit || ""}`.trim(),
              }))}
              inputClassName="border-[#FB923C]"
              placeholder="Select Size"
            />

            {/* Price */}
            <FormInput
              name={`variants.${index}.price`}
              label="Price"
              type="number"
              inputClassName="border-[#FB923C]"
              value={variant.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value === "" ? 0 : Number(e.target.value);
                const allVariants = form.getValues("variants") || [];
                allVariants[index].price = value;
                form.setValue("variants", allVariants, { shouldDirty: true });
              }}
            />

            {/* Unit (read-only display) */}
            <FormInput
              name={`variants.${index}.unit`}
              label="Unit"
              placeholder=""
              inputClassName="border-[#FB923C] bg-gray-50 text-gray-600 cursor-not-allowed"
            />

            {/* SKU */}
            <div>
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input
                value={variant.sku ? variant.sku.replace(/-/g, "") : ""}
                readOnly
                className="w-full border border-[#FB923C] rounded-md px-3 py-2 text-gray-600 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
