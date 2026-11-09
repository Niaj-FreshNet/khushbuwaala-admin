/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProductBySlugQuery, useUpdateProductMutation } from '@/redux/store/api/product/productApi';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useGetAllMaterialsQuery } from '@/redux/store/api/material/materialApi';
import { useGetAllFragrancesQuery } from '@/redux/store/api/fragrance/fragranceApi';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { Material } from '@/types/material.types';
import { Fragrance } from '@/types/fragrance.types';
import { Button } from '@/components/ui/button';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import CategorySizesUpdater from '../_component/CategorySizesUpdater';
import SizesCheckboxes from '../_component/SizesCheckboxes';
import { VariantsSection } from '../_component/VariantsSection';
import AddVariantButton from '../_component/AddVariantButton';
import { PublishedSwitch } from '../_component/PublishedSwitch';
import { RichDescriptionEditor } from '../_component/RichDescriptionEditor';
import { VariantForForm } from '@/types/product.types';
import { ImagePlus, X, Sparkles, Layers, Info, Sliders, ShieldCheck } from 'lucide-react';

interface FormValues {
  name: string;
  description: string;
  brand: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  perfumeNotes: { top: string; middle: string; base: string };
  accords: string;
  tags: string;
  categoryId: string;
  materialIds: string[];
  fragranceIds: string[];
  published: boolean;
  variants: VariantForForm[];
  primaryImage: File[] | string[];
  otherImages: File[] | string[];
  origin?: string;
  performance?: string;
  longevity?: string;
  projection?: string;
  sillage?: string;
  bestFor?: string;
  videoUrl?: string;
  stock: number;
  supplier: string;
}

const EditProductPage = () => {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [updateProduct] = useUpdateProductMutation();

  const { data: productResponse, isLoading, refetch } = useGetProductBySlugQuery(slug);
  const product = productResponse?.data;

  const { data: categoriesData } = useGetAllCategoriesAdminQuery();
  const { data: materialsData } = useGetAllMaterialsQuery({});
  const { data: fragrancesData } = useGetAllFragrancesQuery({});

  const categories: Category[] = categoriesData?.data?.data || [];
  const materials: Material[] = materialsData?.data?.data || [];
  const fragrances: Fragrance[] = fragrancesData?.data?.data || [];

  const [defaultValues, setDefaultValues] = useState<FormValues | null>(null);
  const [imagesToKeep, setImagesToKeep] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      const current = [product.primaryImage, ...(product.otherImages || [])].filter(Boolean);
      setImagePreviews(current);
      setImagesToKeep(current);
      setNewImageFiles([]);

      setDefaultValues({
        name: product.name || '',
        description: product.description || '',
        brand: product.brand || '',
        gender: product.gender || 'UNISEX',
        perfumeNotes: {
          top: (product.perfumeNotes?.top || []).join(', '),
          middle: (product.perfumeNotes?.middle || []).join(', '),
          base: (product.perfumeNotes?.base || []).join(', '),
        },
        accords: (product.accords || []).join(', '),
        tags: (product.tags || []).join(', '),
        categoryId: product.categoryId || '',
        materialIds: product.materialIds || [],
        fragranceIds: product.fragranceIds || [],
        published: product.published,
        variants:
          product.variants?.map(v => ({
            sku: v.sku,
            size: v.size.toString(),
            price: v.price,
            unit: v.unit,
          })) || [{ size: '', price: 0, stock: 0, sku: '', unit: 'ML' }],
        origin: product.origin || '',
        performance: product.performance || 'GOOD',
        longevity: product.longevity || 'MODERATE',
        projection: product.projection || 'MODERATE',
        sillage: product.sillage || 'MODERATE',
        bestFor: (product.bestFor || []).join(', '),
        videoUrl: product.videoUrl || '',
        stock: product.totalStock || 0,
        supplier: product.supplier || '',
        primaryImage: [product.primaryImage],
        otherImages: product.otherImages || [],
      });
    }
  }, [product]);

  const handleSubmit = async (values: FormValues) => {
    try {
      const fd = new FormData();

      fd.append("name", values.name);
      fd.append("description", values.description);
      fd.append("brand", values.brand);
      fd.append("gender", values.gender);
      fd.append("origin", values.origin || "");
      fd.append("videoUrl", values.videoUrl || "");
      fd.append("categoryId", values.categoryId);
      fd.append("supplier", values.supplier || "");
      fd.append("stock", String(values.stock));
      fd.append("published", String(values.published));

      fd.append("tags", JSON.stringify(values.tags.split(",").map(t => t.trim()).filter(Boolean)));
      fd.append("accords", JSON.stringify(values.accords.split(",").map(a => a.trim()).filter(Boolean)));
      fd.append("bestFor", JSON.stringify(values.bestFor?.split(",").map(b => b.trim()).filter(Boolean) || []));

      fd.append("perfumeNotes", JSON.stringify({
        top: values.perfumeNotes.top.split(",").map(n => n.trim()).filter(Boolean),
        middle: values.perfumeNotes.middle.split(",").map(n => n.trim()).filter(Boolean),
        base: values.perfumeNotes.base.split(",").map(n => n.trim()).filter(Boolean),
      }));

      fd.append("materialIds", JSON.stringify(values.materialIds || []));
      fd.append("fragranceIds", JSON.stringify(values.fragranceIds || []));

      fd.append("variants", JSON.stringify(values.variants.map(v => ({
        sku: v.sku,
        size: Number(v.size),
        unit: v.unit.toUpperCase(),
        price: Number(v.price),
      }))));

      fd.append("imagesToKeep", JSON.stringify(imagesToKeep));
      newImageFiles.forEach((f) => fd.append("images", f));

      await updateProduct({ id: product?.id as string, formData: fd }).unwrap();
      toast.success("Product updated successfully!");
      await refetch();
      router.push('/products');
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product.");
      return false;
    }
  };

  if (isLoading || !defaultValues) {
    return <div className="p-10 text-center text-gray-500 text-xs">Loading product details...</div>;
  }

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Compact Header Bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-50 rounded-lg text-[#FB923C] border border-orange-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Edit Product</h1>
            <p className="text-[10px] text-gray-500">Modify catalog information, performance attributes, and inventory.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/products')}
          className="text-xs font-semibold h-7 border-gray-300 hover:bg-gray-50"
        >
          Cancel & Return
        </Button>
      </div>

      <Card className="border border-gray-200/80 shadow-2xs bg-white rounded-xl">
        <CardContent className="p-3 sm:p-4">
          <FormWrapper
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitButtonText="Update Product Details"
            submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29] text-xs font-bold h-8 px-5 shadow-2xs"
            successMessage="Product updated successfully!"
            errorMessage="Failed to update product. Please check fields."
            showResetButton={false}
          >
            <CategorySizesUpdater categories={categories} setSelectedSizes={setSelectedSizes} />

            <div className="space-y-3 text-xs">

              {/* SECTION 1: General Info */}
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 space-y-2">
                <div className="flex items-center gap-1.5 border-b border-gray-200/80 pb-1.5">
                  <Info className="w-3.5 h-3.5 text-[#FB923C]" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">1. General Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <FormInput name="name" label="Product Name" placeholder="e.g. Royal Oudh" required inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  <FormInput
                    name="categoryId"
                    label="Category"
                    type="select"
                    required
                    options={categories.map(cat => ({ value: cat.id, label: cat.categoryName }))}
                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                  />
                  <FormInput name="brand" label="Brand" placeholder="e.g. Khushbuwaala" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  <FormInput name="origin" label="Origin Country" placeholder="e.g. France, UAE" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  <FormInput
                    name="gender"
                    label="Gender Target"
                    type="select"
                    options={[
                      { value: 'MALE', label: 'Male' },
                      { value: 'FEMALE', label: 'Female' },
                      { value: 'UNISEX', label: 'Unisex' },
                    ]}
                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                  />
                  <FormInput name="supplier" label="Supplier" placeholder="Supplier name" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                </div>
              </div>

              {/* GRID CONTAINER: Classifications & Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* SECTION 2: Classifications */}
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 flex flex-col justify-between space-y-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200/80 pb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#FB923C]" /> 2. Classifications & Families
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <div className="border border-gray-200/80 p-2 rounded-lg bg-white shadow-2xs max-h-48 overflow-y-auto">
                      <FormCheckboxGroup
                        name="fragranceIds"
                        label="Fragrance Families"
                        options={fragrances.map(f => ({ label: f.fragranceName, value: f.id }))}
                      />
                    </div>
                    <div className="border border-gray-200/80 p-2 rounded-lg bg-white shadow-2xs max-h-48 overflow-y-auto">
                      <FormCheckboxGroup
                        name="materialIds"
                        label="Materials / Ingredients"
                        options={materials.map(m => ({ label: m.materialName, value: m.id }))}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Performance & Attributes */}
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 space-y-2">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200/80 pb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FB923C]" /> 3. Performance & Attributes
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FormInput
                      name="performance"
                      label="Performance"
                      type="select"
                      options={[
                        { value: 'POOR', label: 'Poor' },
                        { value: 'WEAK', label: 'Weak' },
                        { value: 'MODERATE', label: 'Moderate' },
                        { value: 'GOOD', label: 'Good' },
                        { value: 'EXCELLENT', label: 'Excellent' },
                        { value: 'BEAST_MODE', label: 'Beast Mode' },
                      ]}
                      inputClassName="border-gray-300 text-xs h-8 bg-white"
                    />
                    <FormInput
                      name="longevity"
                      label="Longevity"
                      type="select"
                      options={[
                        { value: 'VERY_WEAK', label: 'Very Weak' },
                        { value: 'WEAK', label: 'Weak' },
                        { value: 'MODERATE', label: 'Moderate' },
                        { value: 'LONG_LASTING', label: 'Long Lasting' },
                        { value: 'ETERNAL', label: 'Eternal' },
                      ]}
                      inputClassName="border-gray-300 text-xs h-8 bg-white"
                    />
                    <FormInput
                      name="projection"
                      label="Projection"
                      type="select"
                      options={[
                        { value: 'INTIMATE', label: 'Intimate' },
                        { value: 'CLOSE', label: 'Close' },
                        { value: 'MODERATE', label: 'Moderate' },
                        { value: 'STRONG', label: 'Strong' },
                        { value: 'NUCLEAR', label: 'Nuclear' },
                      ]}
                      inputClassName="border-gray-300 text-xs h-8 bg-white"
                    />
                    <FormInput
                      name="sillage"
                      label="Sillage"
                      type="select"
                      options={[
                        { value: 'SOFT', label: 'Soft' },
                        { value: 'MODERATE', label: 'Moderate' },
                        { value: 'HEAVY', label: 'Heavy' },
                        { value: 'ENORMOUS', label: 'Enormous' },
                      ]}
                      inputClassName="border-gray-300 text-xs h-8 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    <FormInput name="bestFor" label="Best For" placeholder="e.g. Office, Evening" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                    <FormInput name="accords" label="Accords" placeholder="e.g. floral, woody" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                    <FormInput name="tags" label="Tags" placeholder="e.g. luxury, gift" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  </div>
                </div>
              </div>

              {/* SECTION 4 & 5: Rich Description & Pyramid Notes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 space-y-1">
                  <RichDescriptionEditor name="description" label="4. Description & Rich Story" rows={3} />
                </div>
                <div className="border border-orange-200/80 rounded-xl p-3 bg-orange-50/10 space-y-2 flex flex-col justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">5. Fragrance Pyramid Notes</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <FormInput name="perfumeNotes.top" label="Top Notes" placeholder="e.g. Bergamot, Lemon" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                    <FormInput name="perfumeNotes.middle" label="Middle Notes" placeholder="e.g. Jasmine, Rose" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                    <FormInput name="perfumeNotes.base" label="Base Notes" placeholder="e.g. Sandalwood, Musk" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Images & Media */}
              <div className="border border-gray-200/80 rounded-xl p-3 space-y-2.5 bg-white shadow-2xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <ImagePlus className="w-4 h-4 text-[#FB923C]" /> 6. Product Media & Imagery
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div className="space-y-1.5">
                    <FormInput
                      name="primaryImage"
                      label="Primary Thumbnail Image"
                      type="file"
                      inputClassName="border-gray-300 text-xs"
                      onChange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        const previewUrl = URL.createObjectURL(file);
                        setImagePreviews((prev) => [previewUrl, ...prev.slice(1)]);
                        setImagesToKeep((prevKeep) => {
                          const currentPrimary = prevKeep[0];
                          const rest = prevKeep.slice(1);
                          return currentPrimary?.startsWith("http") ? rest : prevKeep;
                        });
                        setNewImageFiles((prev) => [file, ...prev]);
                      }}
                    />
                    {imagePreviews[0] && (
                      <div className="relative w-12 h-12 border-2 border-[#FB923C] rounded-lg overflow-hidden shadow-2xs bg-gray-100">
                        <img src={imagePreviews[0]} alt="Primary Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <FormInput
                      name="otherImages"
                      label="Gallery Images (Multiple)"
                      type="file"
                      inputClassName="border-gray-300 text-xs"
                      multiple
                      onChange={(e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (!files.length) return;
                        const previews = files.map((f) => URL.createObjectURL(f));
                        setImagePreviews((prev) => [prev[0], ...prev.slice(1), ...previews]);
                        setNewImageFiles((prev) => [...prev, ...files]);
                      }}
                    />
                    {imagePreviews.slice(1).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {imagePreviews.slice(1).map((preview, index) => (
                          <div key={index} className="relative w-11 h-11 rounded-lg border border-gray-300 overflow-hidden shadow-2xs bg-gray-100">
                            <img src={preview} alt={`Gallery item ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none"
                              onClick={() => {
                                const img = imagePreviews[index + 1];
                                setImagePreviews((prev) => prev.filter((_, i) => i !== index + 1));
                                if (img?.startsWith("http")) {
                                  setImagesToKeep((prev) => prev.filter((u) => u !== img));
                                }
                              }}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <FormInput name="videoUrl" label="Video URL Link (Optional)" placeholder="https://youtube.com/..." inputClassName="border-gray-300 text-xs h-8" />
                </div>
              </div>

              {/* SECTION 7: Variants & Stock Pricing */}
              <div className="border border-orange-200/80 rounded-xl p-3 bg-white space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#FB923C]" /> 7. Variants, Sizes & Pricing
                  </h4>
                  <SizesCheckboxes selectedSizes={selectedSizes} />
                </div>

                <VariantsSection selectedSizes={selectedSizes} />

                <div className="pt-1">
                  <AddVariantButton selectedSizes={selectedSizes} />
                </div>
              </div>

              {/* SECTION 8: Final Inventory & Publish State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-gray-200/80 items-center bg-gray-50/40 p-3 rounded-xl">
                <FormInput name="stock" label="Total Store Stock Count" placeholder="0" type="number" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                <div className="flex flex-col justify-end pb-0 sm:col-span-2 items-center sm:justify-start">
                  <PublishedSwitch />
                </div>
              </div>

            </div>
          </FormWrapper>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPage;