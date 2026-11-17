/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from "@/components/ui/button";
import { VariantForForm } from "@/types/product.types";
import { Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

interface Props {
  selectedSizes: string[];
}

interface FormValues {
  variants: VariantForForm[];
}

export default function AddVariantButton({ selectedSizes }: Props) {
  const form = useFormContext<FormValues>();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-dashed border-2 border-[#FB923C] text-[#FB923C] hover:bg-orange-50/50 text-xs sm:text-sm font-semibold h-10 shadow-2xs"
      onClick={() => {
        const variants = form.getValues('variants') || [];
        const unitFromCategory = variants[0]?.unit || 'ML';

        form.setValue('variants', [
          ...variants,
          {
            id: uuidv4(),
            size: '',
            price: 0,
            stock: 0,
            sku: '',
            unit: unitFromCategory,
            isDefault: variants.length === 0, // Make default if it's the first row
            compareAtPrice: '',
            weightGrams: '',
            images: []
          },
        ], { shouldDirty: true });
      }}
    >
      <Plus className="w-4 h-4 mr-1.5" /> Add New Variant Row
    </Button>
  );
}