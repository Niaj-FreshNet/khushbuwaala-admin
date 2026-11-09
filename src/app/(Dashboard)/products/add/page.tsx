/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useGetAllMaterialsQuery } from '@/redux/store/api/material/materialApi';
import { useGetAllFragrancesQuery } from '@/redux/store/api/fragrance/fragranceApi';
import { useCreateProductMutation } from '@/redux/store/api/product/productApi';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { Material } from '@/types/material.types';
import { Fragrance } from '@/types/fragrance.types';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { useFormContext } from 'react-hook-form';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import CategorySizesUpdater from '../_component/CategorySizesUpdater';
import SizesCheckboxes from '../_component/SizesCheckboxes';
import { VariantsSection } from '../_component/VariantsSection';
import AddVariantButton from '../_component/AddVariantButton';
import { PublishedSwitch } from '../_component/PublishedSwitch';
import { RichDescriptionEditor } from '../_component/RichDescriptionEditor';
import { VariantForForm } from '@/types/product.types';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';
import { ImagePlus, X, Sparkles, Layers, Info, Sliders, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  primaryImage: File[];
  otherImages: File[];
  origin?: string;
  performance?: 'POOR' | 'WEAK' | 'MODERATE' | 'GOOD' | 'EXCELLENT' | 'BEAST_MODE';
  longevity?: 'VERY_WEAK' | 'WEAK' | 'MODERATE' | 'LONG_LASTING' | 'ETERNAL';
  projection?: 'INTIMATE' | 'CLOSE' | 'MODERATE' | 'STRONG' | 'NUCLEAR';
  sillage?: 'SOFT' | 'MODERATE' | 'HEAVY' | 'ENORMOUS';
  bestFor?: string;
  videoUrl?: string;
  stock: number;
  supplier: string;
}

const AddProductPage = () => {
  const router = useRouter();
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [createProduct] = useCreateProductMutation();
  const { data: categoriesData } = useGetAllCategoriesAdminQuery();
  const { data: materialsData } = useGetAllMaterialsQuery({});
  const { data: fragrancesData } = useGetAllFragrancesQuery({});

  const categories: Category[] = categoriesData?.data?.data || [];
  const materials: Material[] = materialsData?.data?.data || [];
  const fragrances: Fragrance[] = fragrancesData?.data?.data || [];

  const defaultValues: FormValues = {
    name: '',
    description: '',
    brand: '',
    gender: 'UNISEX',
    perfumeNotes: { top: '', middle: '', base: '' },
    accords: '',
    tags: '',
    categoryId: '',
    materialIds: [],
    fragranceIds: [],
    published: true,
    variants: [{ id: 'default-1', size: '3', price: 480, stock: 10, sku: 'KWP-PRODUCT-3-ML', unit: 'ML' }],
    primaryImage: [],
    otherImages: [],
    origin: '',
    performance: 'GOOD',
    longevity: 'MODERATE',
    projection: 'MODERATE',
    sillage: 'MODERATE',
    bestFor: '',
    videoUrl: '',
    stock: 0,
    supplier: '',
  };

  const handleSubmit = async (values: FormValues) => {
    if (!values.name?.trim()) {
      toast.error('Product name is required.');
      return false;
    }
    if (!values.categoryId) {
      toast.error('Please select a product category.');
      return false;
    }
    if (!values.primaryImage || (Array.isArray(values.primaryImage) && values.primaryImage.length === 0)) {
      toast.error('Please upload a primary thumbnail image.');
      return false;
    }
    if (!values.variants || values.variants.length === 0) {
      toast.error('Please add at least one product variant.');
      return false;
    }

    try {
      const primaryFile = Array.isArray(values.primaryImage)
        ? values.primaryImage[0]
        : values.primaryImage;

      const primaryImageFile =
        primaryFile instanceof FileList ? primaryFile[0] : primaryFile;

      const primaryImageUrl = await uploadToCloudinary(
        primaryImageFile,
        'khushbuwaala_images/products'
      );

      const otherFiles = Array.isArray(values.otherImages)
        ? values.otherImages
        : [values.otherImages];

      const otherImageUrls = await Promise.all(
        otherFiles.flatMap(fileList =>
          Array.from(fileList instanceof FileList ? fileList : [fileList])
        ).map(file => uploadToCloudinary(file, 'khushbuwaala_images/products'))
      );

      const payload = {
        ...values,
        primaryImage: primaryImageUrl,
        otherImages: otherImageUrls,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        accords: values.accords ? values.accords.split(',').map(a => a.trim()).filter(Boolean) : [],
        bestFor: values.bestFor ? values.bestFor.split(',').map(b => b.trim()).filter(Boolean) : [],
        perfumeNotes: {
          top: values.perfumeNotes?.top ? values.perfumeNotes.top.split(',').map(n => n.trim()).filter(Boolean) : [],
          middle: values.perfumeNotes?.middle ? values.perfumeNotes.middle.split(',').map(n => n.trim()).filter(Boolean) : [],
          base: values.perfumeNotes?.base ? values.perfumeNotes.base.split(',').map(n => n.trim()).filter(Boolean) : [],
        },
        variants: values.variants.map(v => ({
          sku: v.sku || `KWP-${values.name.replace(/\s+/g, "").toUpperCase()}-${v.size}-${v.unit}`,
          size: Number(v.size),
          unit: (v.unit || 'ML').toUpperCase(),
          price: Number(v.price),
        })),
      };

      await createProduct(payload).unwrap();
      toast.success('Product published successfully!');
      setImagePreviews([]);
      router.push('/products');
      return true;
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.message || 'Product creation failed. Check fields and images.');
      return false;
    }
  };

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Compact Header Bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-50 rounded-lg text-[#FB923C] border border-orange-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Add New Product</h1>
            <p className="text-[10px] text-gray-500">Configure catalog details, fragrance profiles, and inventory settings.</p>
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
            submitButtonText="Save & Publish Product"
            submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29] text-xs font-bold h-8 px-5 shadow-2xs"
            errorMessage="Please resolve validation errors."
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

              {/* GRID CONTAINER FOR COMPACTNESS: Classifications & Performance */}
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
                      required
                      inputClassName="border-gray-300 text-xs"
                      onChange={(e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const previewUrl = URL.createObjectURL(file);
                          setImagePreviews((prev) => [previewUrl, ...prev.slice(1)]);
                        }
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
                      onChange={(e: any) => {
                        const files = Array.from(e.target.files || []);
                        const previews = files.map((file: any) => URL.createObjectURL(file));
                        setImagePreviews((prev) => [prev[0] || '', ...previews]);
                      }}
                    />
                    {imagePreviews.slice(1).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {imagePreviews.slice(1).map((preview, index) => (
                          <div key={index} className="relative w-11 h-11 rounded-lg border border-gray-300 overflow-hidden shadow-2xs bg-gray-100">
                            <img src={preview} alt="Gallery item" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none"
                              onClick={() => {
                                const form = useFormContext<FormValues>();
                                const otherImages = form.getValues("otherImages") || [];
                                if (Array.isArray(otherImages)) {
                                  otherImages.splice(index, 1);
                                  form.setValue("otherImages", otherImages);
                                }
                                setImagePreviews((prev) => prev.filter((_, i) => i !== index + 1));
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

export default AddProductPage;