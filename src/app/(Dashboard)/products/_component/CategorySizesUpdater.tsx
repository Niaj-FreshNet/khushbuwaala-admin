'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { VariantForForm } from '@/types/product.types';
import { Category } from '@/types/category.types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  categories: Category[];
  setSelectedSizes: (sizes: string[]) => void;
}

interface FormValues {
  categoryId: string;
  variants: VariantForForm[];
}

export default function CategorySizesUpdater({ categories, setSelectedSizes }: Props) {
  const form = useFormContext<FormValues>();

  const selectedCategoryId = useWatch({
    control: form.control,
    name: 'categoryId',
  });

  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (!selectedCategoryId) {
      if (prevKeyRef.current) {
        prevKeyRef.current = '';
        setSelectedSizes([]);
        form.setValue('variants', [], { shouldDirty: true });
      }
      return;
    }

    const category = categories.find((c) => c.id === selectedCategoryId);

    const sizes = (category?.sizes || []).map((s: any) => String(s).trim());
    const unit = category?.unit ? String(category.unit).trim() : '';

    const key = `${sizes.join('|')}__${unit}`;
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    setSelectedSizes(sizes);

    const existingVariants = form.getValues('variants') || [];

    const nextVariants: VariantForForm[] = sizes.map((size) => {
      const found = existingVariants.find((v) => String(v.size) === size);
      return {
        id: found?.id || uuidv4(),
        sku: found?.sku || '',
        price: found?.price ?? 0,
        stock: found?.stock ?? 0,
        size,
        unit: unit || found?.unit || '',
      };
    });

    queueMicrotask(() => {
      form.setValue('variants', nextVariants, { shouldDirty: true });
    });
  }, [selectedCategoryId, categories, setSelectedSizes, form]);

  return null;
}