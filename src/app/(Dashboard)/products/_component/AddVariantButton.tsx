import { Button } from "@/components/ui/button";
import { VariantForForm } from "@/types/product.types";
import { Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface Props {
  selectedSizes: string[];
}

interface FormValues {
  name: string;
  description: string;
  brand: string;
  gender: string;
  perfumeNotes: { top: string; middle: string; base: string };
  accords: string;
  tags: string;
  categoryId: string;
  materialId: string;
  published: boolean;
  variants: VariantForForm[];
  images: File[];
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
        const unitFromCategory = variants[0]?.unit || '';

        form.setValue('variants', [
          ...variants,
          { id: crypto.randomUUID(), size: '', price: 0, stock: 0, sku: '', unit: unitFromCategory },
        ]);
      }}
    >
      <Plus className="w-4 h-4 mr-1.5" /> Add New Variant Row
    </Button>
  );
}