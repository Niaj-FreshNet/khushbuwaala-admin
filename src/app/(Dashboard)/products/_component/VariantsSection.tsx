"use client";

import { useEffect } from "react";
import FormInput from "@/components/ReusableUI/FormInput";
import { Button } from "@/components/ui/button";
import { VariantForForm } from "@/types/product.types";
import { X, ImagePlus, CheckCircle2, LucideAlertCircle, Eye, EyeOff } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import Thumb from "@/components/admin/Thumb";

interface FormValues {
  name: string;
  variants: VariantForForm[];
}

export const VariantsSection = () => {
  const form = useFormContext<FormValues>();
  const { formState: { errors } } = form;

  const productName = useWatch({ control: form.control, name: "name" });
  const variants = useWatch({ control: form.control, name: "variants" }) || [];

  // re-run when the name or any size/unit changes (not on every other edit)
  const sizeKey = variants.map((v) => `${v.size}-${v.unit}`).join("|");
  useEffect(() => {
    const existing = form.getValues("variants") || [];
    const updated = existing.map((variant) => {
      const namePart = productName?.trim().replace(/\s+/g, "").toUpperCase() || "PRODUCT";
      const sizePart = variant.size ? String(variant.size).toUpperCase() : "SIZE";
      const resolvedUnit = String(variant.unit || "ML").trim().toUpperCase();
      const skuWithDash = `KWP-${namePart}-${sizePart}-${resolvedUnit}`;

      return {
        ...variant,
        unit: resolvedUnit,
        sku: skuWithDash,
        published: variant.published ?? true,
      };
    });

    const changed =
      updated.length !== existing.length ||
      updated.some((v, i) => v.sku !== existing[i]?.sku || v.unit !== existing[i]?.unit);

    if (changed) {
      form.setValue("variants", updated, { shouldDirty: true });
    }
  }, [productName, sizeKey, form]);

  if (variants.length === 0) {
    return (
      <div className="text-center py-6 px-4 border border-dashed border-gray-300 rounded-xl text-gray-400 text-xs bg-gray-50/50">
        No variants configured. Click &quot;Add New Variant Row&quot; below or select a category size to start.
      </div>
    );
  }

  return (
    /* ⚡ 1 column on mobile, 2 columns on desktop */
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
      {variants.map((variant, index) => {
        const currentImages = (Array.isArray(variant.images) ? variant.images : []) as (File | string)[];

        const variantErrors = errors?.variants?.[index];
        const sizeError = variantErrors?.size?.message;
        const priceError = variantErrors?.price?.message;

        return (
          <div
            key={variant.id || index}
            className="border border-gray-200/80 bg-gray-50/50 hover:bg-white rounded-xl p-3 shadow-2xs transition-all relative space-y-3 group w-full overflow-hidden"
          >
            {/* Top Bar: Responsive Row Action Controls & Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded">
                  Variant #{index + 1}
                </span>

                {/* Manual Default Variant Selector Toggle */}
                <label className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all ${variant.isDefault
                    ? "bg-orange-50 border-[#FB923C] text-orange-900 shadow-2xs ring-1 ring-[#FB923C]"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  <input
                    type="checkbox"
                    checked={!!variant.isDefault}
                    onChange={(e) => {
                      const allVariants = form.getValues("variants") || [];
                      const updated = allVariants.map((v, i) => ({
                        ...v,
                        isDefault: i === index ? e.target.checked : false
                      }));
                      form.setValue("variants", updated, { shouldDirty: true });
                    }}
                    className="sr-only"
                  />
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${variant.isDefault ? "text-[#FB923C]" : "text-gray-300"}`} />
                  <span className="truncate">{variant.isDefault ? "Default Selection" : "Set Default"}</span>
                </label>

                {/* Variant Published / Unpublished Toggle Switch */}
                <label className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all ${variant.published !== false
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}>
                  <input
                    type="checkbox"
                    checked={variant.published !== false}
                    onChange={(e) => {
                      const allVariants = form.getValues("variants") || [];
                      allVariants[index].published = e.target.checked;
                      form.setValue("variants", allVariants, { shouldDirty: true });
                    }}
                    className="sr-only"
                  />
                  {variant.published !== false ? (
                    <Eye className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  )}
                  <span>{variant.published !== false ? "Published" : "Hidden"}</span>
                </label>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 ml-auto"
                onClick={() => {
                  const allVariants = form.getValues("variants") || [];
                  form.setValue("variants", allVariants.filter((_, i) => i !== index), { shouldDirty: true });
                }}
                title="Remove Variant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Fully Responsive Grid Layout */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-end"
              onWheel={() => {
                if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
                  document.activeElement.blur();
                }
              }}
            >
              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.size`}
                  label="Size"
                  placeholder="e.g. 50"
                  inputClassName="border-gray-300 text-xs h-8 bg-white w-full"
                />
                {sizeError && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                    <LucideAlertCircle className="w-3 h-3 shrink-0" /> {sizeError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.unit`}
                  label="Unit"
                  placeholder="ML"
                  inputClassName="border-gray-300 text-xs h-8 bg-white uppercase w-full"
                  value={variant.unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value.toUpperCase();
                    const allVariants = form.getValues("variants") || [];
                    allVariants[index].unit = value;
                    form.setValue("variants", allVariants, { shouldDirty: true });
                  }}
                />
              </div>

              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.price`}
                  label="Price (BDT)"
                  type="number"
                  inputClassName="border-gray-300 text-xs h-8 bg-white font-semibold text-[#FB923C] w-full"
                  value={variant.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value === "" ? "" : Number(e.target.value);
                    const allVariants = form.getValues("variants") || [];
                    allVariants[index].price = value;
                    form.setValue("variants", allVariants, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {priceError && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                    <LucideAlertCircle className="w-3 h-3 shrink-0" /> {priceError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.compareAtPrice`}
                  label="Compare Price"
                  type="number"
                  placeholder="Optional"
                  inputClassName="border-gray-300 text-xs h-8 bg-white w-full"
                />
              </div>

              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.stock`}
                  label="Stock"
                  type="number"
                  placeholder="0"
                  inputClassName="border-gray-300 text-xs h-8 bg-white w-full"
                />
              </div>

              <div className="space-y-1">
                <FormInput
                  name={`variants.${index}.weightGrams`}
                  label="Weight (g)"
                  type="number"
                  placeholder="0"
                  inputClassName="border-gray-300 text-xs h-8 bg-white w-full"
                />
              </div>
            </div>

            {/* Bottom Bar: SKU & Swatch Images */}
            <div className="space-y-2 pt-2 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/80 shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">SKU:</span>
                  <span className="text-[11px] font-mono text-gray-700 truncate max-w-[200px] sm:max-w-[150px]">{variant.sku ? variant.sku.replace(/-/g, "") : "Generating..."}</span>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-1 text-gray-600 font-medium text-[11px] shrink-0 hidden sm:flex">
                    <ImagePlus className="w-3.5 h-3.5 text-[#FB923C]" />
                    <span>Swatches:</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      const allVariants = form.getValues("variants") || [];
                      const existingImages = Array.isArray(allVariants[index].images) ? allVariants[index].images : [];
                      allVariants[index].images = [...existingImages, ...files];
                      form.setValue("variants", allVariants, { shouldDirty: true });
                    }}
                    className="w-full bg-white border border-gray-300 rounded-md text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-[#FB923C] cursor-pointer truncate"
                  />
                </div>
              </div>

              {currentImages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentImages.map((img, imgIdx) => {
                    const previewSrc = img instanceof File ? URL.createObjectURL(img) : img;
                    return (
                      <div key={imgIdx} className="relative w-11 h-11 rounded border border-gray-300 overflow-hidden bg-white shadow-2xs shrink-0">
                        <Thumb src={previewSrc} alt="Variant swatch preview" size={44} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const allVariants = form.getValues("variants") || [];
                            const updatedImages = currentImages.filter((_, i) => i !== imgIdx);
                            allVariants[index].images = updatedImages;
                            form.setValue("variants", allVariants, { shouldDirty: true });
                          }}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] hover:bg-red-700 shadow-sm"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};