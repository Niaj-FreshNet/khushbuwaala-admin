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
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import SizesCheckboxes from '../_component/SizesCheckboxes';
import { VariantsSection } from '../_component/VariantsSection';
import AddVariantButton from '../_component/AddVariantButton';
import { PublishedSwitch } from '../_component/PublishedSwitch';
import { RichDescriptionEditor } from '../_component/RichDescriptionEditor';
import CategorySizesUpdater from '../_component/CategorySizesUpdater';
import { VariantForForm } from '@/types/product.types';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';
import { Sparkles, Layers, Info, Sliders, ShieldCheck, SearchCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductMediaSection } from '../_component/ProductMediaSection';
import { useFormContext } from 'react-hook-form';

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
  videos: (File | string)[];
  origin?: string;
  condition?: string;
  googleProductCategory?: string;
  metaTitle?: string;
  metaDescription?: string;
  performance?: 'POOR' | 'WEAK' | 'MODERATE' | 'GOOD' | 'EXCELLENT' | 'BEAST_MODE';
  longevity?: 'VERY_WEAK' | 'WEAK' | 'MODERATE' | 'LONG_LASTING' | 'ETERNAL';
  projection?: 'INTIMATE' | 'CLOSE' | 'MODERATE' | 'STRONG' | 'NUCLEAR';
  sillage?: 'SOFT' | 'MODERATE' | 'HEAVY' | 'ENORMOUS';
  bestFor?: string;
  stock: number;
  supplier: string;
}

// ⚡ Comprehensive One-Click Full SEO Metadata & Tags Generator Button
const AutoGenerateAllSeoFieldsButton = ({ categories, materials, fragrances }: { categories: Category[], materials: Material[], fragrances: Fragrance[] }) => {
  const form = useFormContext<FormValues>();

  const handleGenerateAllSeo = () => {
    const values = form.getValues();

    const name = values.name?.trim() || 'Signature Perfume';
    const brand = values.brand?.trim() || 'Khushbuwaala';
    const gender = values.gender?.toLowerCase() || 'unisex';

    const categoryObj = categories.find(c => c.id === values.categoryId);
    const categoryName = categoryObj?.categoryName || 'Fragrance';

    const selectedMaterials = (values.materialIds || [])
      .map(id => materials.find(m => m.id === id)?.materialName)
      .filter(Boolean);

    const selectedFragrances = (values.fragranceIds || [])
      .map(id => fragrances.find(f => f.id === id)?.fragranceName)
      .filter(Boolean);

    const accordsList = (values.accords || '').split(',').map(s => s.trim()).filter(Boolean);
    const topNotes = (values.perfumeNotes?.top || '').split(',').map(s => s.trim()).filter(Boolean);
    const baseNotes = (values.perfumeNotes?.base || '').split(',').map(s => s.trim()).filter(Boolean);

    // 1. Generate Title Case Category & SEO Meta Title
    const toTitleCase = (str: string) => {
      return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };
    const formattedCategoryName = toTitleCase(categoryName);
    const generatedTitle = `${name} - ${brand} | Premium ${formattedCategoryName} in Bangladesh`;
    form.setValue('metaTitle', generatedTitle, { shouldDirty: true, shouldValidate: true });

    // 2. Generate SEO Meta Description (under 155 chars)
    const notesSummary = topNotes.length ? ` Featuring notes of ${topNotes.slice(0, 3).join(', ')}.` : '';
    const generatedDescription = `Buy authentic ${name} ${categoryName.toLowerCase()} by ${brand}. Long-lasting ${gender} fragrance with ${accordsList.slice(0, 3).join(', ')} accords.${notesSummary} Order online in Bangladesh.`;
    form.setValue('metaDescription', generatedDescription.substring(0, 155), { shouldDirty: true, shouldValidate: true });

    // 3. Generate Clean Unique Tags & Keywords
    const khushbuwaalaSEOKeywords = [
      brand,
      'Khushbuwaala perfume',
      'Khushbuwaala attar',
      'luxury perfume Bangladesh',
      'long lasting attar',
      'premium oudh oil',
      'oriental attar online',
      'best niche fragrance',
      'best designer perfume',
    ];

    const rawTags = [
      name,
      `${name} perfume`,
      `${name} attar`,
      brand,
      gender,
      categoryName,
      ...selectedMaterials,
      ...selectedFragrances,
      ...accordsList,
      ...topNotes,
      ...baseNotes,
      ...khushbuwaalaSEOKeywords,
    ];

    const uniqueTagsSet = new Set<string>();
    rawTags.forEach(tag => {
      if (typeof tag !== 'string') return;
      const cleaned = tag.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      if (cleaned.length > 1) {
        uniqueTagsSet.add(cleaned);
      }
    });

    const finalTagsString = Array.from(uniqueTagsSet).join(', ');
    form.setValue('tags', finalTagsString, { shouldDirty: true, shouldValidate: true });

    toast.success('Complete SEO profile (Title, Description & Tags) generated successfully!');
  };

  return (
    <Button
      type="button"
      onClick={handleGenerateAllSeo}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-2.5 font-semibold gap-1 shadow-2xs shrink-0"
    >
      <Wand2 className="w-3.5 h-3.5" /> Auto-Generate All SEO Fields
    </Button>
  );
};

const AddProductContent = ({ categories, materials, fragrances, setSelectedSizes, selectedSizes }: any) => {
  return (
    <div className="w-full space-y-3 pb-8">
      <CategorySizesUpdater categories={categories} setSelectedSizes={setSelectedSizes} />

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
            options={categories.map((cat: any) => ({ value: cat.id, label: cat.categoryName }))}
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

      {/* SECTION 1.5: Advanced SEO, Google Merchant & AI Metadata */}
      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-200/80 space-y-2.5">
        <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
          <div className="flex items-center gap-1.5">
            <SearchCheck className="w-3.5 h-3.5 text-blue-600" />
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">1.5 Advanced SEO & Metadata</h3>
          </div>
          <AutoGenerateAllSeoFieldsButton categories={categories} materials={materials} fragrances={fragrances} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <FormInput
            name="googleProductCategory"
            label="Google Product Taxonomy"
            placeholder="e.g. Health & Beauty > Personal Care > Cosmetics > Perfume"
            inputClassName="border-blue-200 text-xs h-8 bg-white"
          />
          <FormInput
            name="metaTitle"
            label="SEO Meta Title"
            placeholder="Auto-generated or custom browser title"
            inputClassName="border-blue-200 text-xs h-8 bg-white"
          />
          <FormInput
            name="metaDescription"
            label="SEO Meta Description"
            placeholder="Auto-generated summary for Google search snippets"
            inputClassName="border-blue-200 text-xs h-8 bg-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <FormInput
            name="condition"
            label="Item Condition"
            type="select"
            options={[
              { value: 'new', label: 'New' },
              { value: 'refurbished', label: 'Refurbished' },
              { value: 'used', label: 'Used' },
            ]}
            inputClassName="border-blue-200 text-xs h-8 bg-white"
          />
          <FormInput
            name="tags"
            label="Search Keywords & Tags (Comma separated)"
            placeholder="Click 'Auto-Generate All SEO Fields' above to populate"
            inputClassName="border-blue-200 text-xs h-8 bg-white"
          />
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
                options={fragrances.map((f: any) => ({ label: f.fragranceName, value: f.id }))}
              />
            </div>
            <div className="border border-gray-200/80 p-2 rounded-lg bg-white shadow-2xs max-h-48 overflow-y-auto">
              <FormCheckboxGroup
                name="materialIds"
                label="Materials / Ingredients"
                options={materials.map((m: any) => ({ label: m.materialName, value: m.id }))}
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
                { value: 'BEAST_MODE', label: 'Ultra (12h+)' },
                { value: 'EXCELLENT', label: 'Excellent (8-10h)' },
                { value: 'GOOD', label: 'Good (5-6h)' },
                { value: 'MODERATE', label: 'Moderate (3-4h)' },
              ]}
              inputClassName="border-gray-300 text-xs h-8 bg-white"
            />
            <FormInput
              name="longevity"
              label="Longevity"
              type="select"
              options={[
                { value: 'ETERNAL', label: 'Eternal (12h+)' },
                { value: 'LONG_LASTING', label: 'Long Lasting (8-10h)' },
                { value: 'MODERATE', label: 'Moderate (5-7h)' },
                { value: 'WEAK', label: 'Weak (3-4h)' },
              ]}
              inputClassName="border-gray-300 text-xs h-8 bg-white"
            />
            <FormInput
              name="projection"
              label="Projection"
              type="select"
              options={[
                { value: 'NUCLEAR', label: 'Nuclear (10ft+)' },
                { value: 'STRONG', label: 'Strong (7-9ft)' },
                { value: 'MODERATE', label: 'Moderate (4-6ft)' },
                { value: 'INTIMATE', label: 'Intimate (1-2ft)' },
              ]}
              inputClassName="border-gray-300 text-xs h-8 bg-white"
            />
            <FormInput
              name="sillage"
              label="Sillage"
              type="select"
              options={[
                { value: 'ENORMOUS', label: 'Enormous (Leaves a heavy trail)' },
                { value: 'HEAVY', label: 'Heavy (Noticeable trail)' },
                { value: 'MODERATE', label: 'Moderate (Balanced trail)' },
                { value: 'SOFT', label: 'Soft (Slight trail)' },
              ]}
              inputClassName="border-gray-300 text-xs h-8 bg-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <FormInput name="bestFor" label="Best For" placeholder="e.g. Office, Evening" inputClassName="border-gray-300 text-xs h-8 bg-white" />
            <FormInput name="accords" label="Accords (Comma separated)" placeholder="e.g. floral, woody, amber" inputClassName="border-gray-300 text-xs h-8 bg-white" />
          </div>
        </div>
      </div>

      {/* SECTION 4: Rich Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 space-y-1">
          <RichDescriptionEditor name="description" label="4. Description & Rich Story" rows={6} />
        </div>

        {/* SECTION 5: Fragrance Pyramid Notes */}
        <div className="border border-orange-200/80 rounded-xl p-3 bg-orange-50/10 space-y-3">
          <div className="flex items-center justify-between border-b border-orange-200/40 pb-1.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FB923C]" /> 5. Fragrance Notes
            </h4>
          </div>

          <div className="relative max-w-lg mx-auto py-3 px-2 flex flex-col items-center space-y-1">
            <div className="w-[65%] sm:w-[55%] bg-white border-0.5 border-orange-300 rounded-lg p-1.5 space-y-1 transition-all hover:border-[#FB923C] text-center">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider">▲ Top Notes</span>
                <span className="text-[8px] text-gray-400">15-30m</span>
              </div>
              <FormInput
                name="perfumeNotes.top"
                placeholder="e.g. Bergamot, Lemon"
                inputClassName="border-gray-300 text-xs h-7 bg-white text-center"
              />
            </div>

            <div className="w-[82%] sm:w-[77%] bg-white border-0.5 border-orange-300 rounded-lg p-1.5 space-y-1 transition-all hover:border-[#FB923C] text-center">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-orange-700 uppercase tracking-wider">◆ Middle Notes (Heart)</span>
                <span className="text-[8px] text-gray-400">1-2h</span>
              </div>
              <FormInput
                name="perfumeNotes.middle"
                placeholder="e.g. Jasmine, Rose"
                inputClassName="border-gray-300 text-xs h-7 bg-white text-center"
              />
            </div>

            <div className="w-full bg-white border-0.5 border-orange-300 rounded-lg p-1.5 space-y-1 transition-all hover:border-[#FB923C] text-center">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-orange-900 uppercase tracking-wider">▼ Base Notes (Dry Down)</span>
                <span className="text-[8px] text-gray-400">4h+</span>
              </div>
              <FormInput
                name="perfumeNotes.base"
                placeholder="e.g. Sandalwood, Musk, Vanilla"
                inputClassName="border-gray-300 text-xs h-7 bg-white text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: Images & Media */}
      <ProductMediaSection />

      {/* SECTION 7: Variants, Stock Pricing, Default Selection & Variant Images */}
      <div className="border border-orange-200/80 rounded-xl p-3 bg-white space-y-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#FB923C]" /> 7. Variants, Sizes, Pricing, Default Selection & Variant Images
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
  );
};

const AddProductPage = () => {
  const router = useRouter();
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

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
    brand: 'Khushbuwaala',
    gender: 'UNISEX',
    perfumeNotes: { top: '', middle: '', base: '' },
    accords: '',
    tags: '',
    categoryId: '',
    materialIds: [],
    fragranceIds: [],
    published: true,
    variants: [],
    primaryImage: [],
    otherImages: [],
    videos: [],
    origin: '',
    condition: 'new',
    googleProductCategory: 'Health & Beauty > Personal Care > Cosmetics > Perfume',
    metaTitle: '',
    metaDescription: '',
    performance: 'GOOD',
    longevity: 'MODERATE',
    projection: 'MODERATE',
    sillage: 'MODERATE',
    bestFor: '',
    stock: 0,
    supplier: '',
  };

  const handleSubmit = async (values: FormValues, formMethods: any) => {
    if (!values.name?.trim()) {
      toast.error('Product name is required.');
      return false;
    }
    if (!values.categoryId) {
      toast.error('Please select a product category.');
      return false;
    }

    const strippedDescription = values.description?.replace(/<[^>]*>/g, '').trim() || '';
    if (strippedDescription.length < 10) {
      toast.error('Description must be at least 10 characters long.');
      formMethods?.setError?.('description', {
        type: 'manual',
        message: 'Description must be at least 10 characters',
      });
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

    for (let i = 0; i < values.variants.length; i++) {
      const variantPrice = Number(values.variants[i].price);
      if (isNaN(variantPrice) || variantPrice < 0.01) {
        toast.error(`Variant #${i + 1} price must be at least 0.01.`);
        formMethods?.setError?.(`variants.${i}.price`, {
          type: 'manual',
          message: 'Price must be at least 0.01',
        });
        return false;
      }
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

      // Upload product videos asynchronously to Cloudinary
      const videoFiles = Array.isArray(values.videos) ? values.videos : [];
      const videoUrls = await Promise.all(
        videoFiles.map(async (vid) => {
          if (vid instanceof File) {
            return await uploadToCloudinary(vid, 'khushbuwaala_images/videos');
          }
          return typeof vid === 'string' ? vid : null;
        })
      );
      const filteredVideoUrls = videoUrls.filter(Boolean) as string[];

      const processedVariants = await Promise.all(
        values.variants.map(async (v: any, index: number) => {
          let variantImageUrls: string[] = [];

          if (v.images && Array.isArray(v.images) && v.images.length > 0) {
            variantImageUrls = await Promise.all(
              v.images.map(async (img: any) => {
                if (img instanceof File || img instanceof FileList) {
                  const fileToUpload = img instanceof FileList ? img[0] : img;
                  const uploadedRes = await uploadToCloudinary(fileToUpload, 'khushbuwaala_images/variants');
                  return uploadedRes;
                }
                return typeof img === 'string' ? img : null;
              })
            );
            variantImageUrls = variantImageUrls.filter(Boolean);
          }

          return {
            sku: v.sku || `KWP-${values.name.replace(/\s+/g, "").toUpperCase()}-${v.size}-${v.unit}`,
            size: Number(v.size),
            unit: (v.unit || 'ML').toUpperCase(),
            price: Number(v.price),
            stock: Number(v.stock || 0),
            isDefault: Boolean(v.isDefault ?? (index === 0)),
            published: Boolean(v.published ?? true),
            gtin: v.gtin || undefined,
            mpn: v.mpn || undefined,
            barcode: v.barcode || undefined,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
            costPrice: v.costPrice ? Number(v.costPrice) : undefined,
            weightGrams: v.weightGrams ? Number(v.weightGrams) : undefined,
            images: variantImageUrls,
          };
        })
      );

      const payload = {
        name: values.name,
        description: values.description,
        brand: values.brand,
        gender: values.gender,
        primaryImage: primaryImageUrl,
        otherImages: otherImageUrls,
        videos: filteredVideoUrls,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        accords: values.accords ? values.accords.split(',').map(a => a.trim()).filter(Boolean) : [],
        bestFor: values.bestFor ? values.bestFor.split(',').map(b => b.trim()).filter(Boolean) : [],
        perfumeNotes: {
          top: values.perfumeNotes?.top ? values.perfumeNotes.top.split(',').map(n => n.trim()).filter(Boolean) : [],
          middle: values.perfumeNotes?.middle ? values.perfumeNotes.middle.split(',').map(n => n.trim()).filter(Boolean) : [],
          base: values.perfumeNotes?.base ? values.perfumeNotes.base.split(',').map(n => n.trim()).filter(Boolean) : [],
        },
        categoryId: values.categoryId,
        materialIds: values.materialIds || [],
        fragranceIds: values.fragranceIds || [],
        published: values.published,
        supplier: values.supplier || undefined,
        stock: Number(values.stock || 0),
        origin: values.origin || undefined,
        condition: values.condition || 'new',
        googleProductCategory: values.googleProductCategory || undefined,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        variants: processedVariants,
      };

      const result = await createProduct(payload);
      if ('error' in result && result.error) {
        throw result.error;
      }

      toast.success('Product published successfully!');
      router.push('/products');
      return true;
    } catch (error: any) {
      console.error('Product Submission Error:', error);

      const errorData = error?.data || error?.response?.data || error;
      const errorSources = errorData?.errorSources;

      if (Array.isArray(errorSources) && errorSources.length > 0) {
        errorSources.forEach((err: { path: string | string[]; message: string }) => {
          let formPath = Array.isArray(err.path) ? err.path.join('.') : err.path;

          if (formPath === 'price' && values.variants?.length > 0) {
            values.variants.forEach((_, idx) => {
              formMethods?.setError?.(`variants.${idx}.price` as any, {
                type: 'server',
                message: err.message,
              });
            });
          } else {
            formMethods?.setError?.(formPath as any, {
              type: 'server',
              message: err.message,
            });
          }
        });

        toast.error('Please fix the validation errors highlighted below fields.');
      } else {
        const specificErrorMessage =
          errorData?.message ||
          error?.message ||
          'Product creation failed. Please check all required fields and try again.';

        toast.error(specificErrorMessage);
      }
      return false;
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Compact Header Bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-50 rounded-lg text-[#FB923C] border border-orange-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Add New Product</h1>
            <p className="text-[10px] text-gray-500">Configure catalog details, advanced SEO fields, variant pricing, and media.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/products')}
          className="text-xs font-semibold h-7 border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Button>
      </div>

      <Card className="border border-gray-200/80 shadow-2xs bg-white rounded-xl">
        <CardContent className="px-3 sm:px-4">
          <FormWrapper
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitButtonText="Save Product"
            submitButtonClassName="bg-green-700 hover:bg-green-800 text-sm font-bold h-8 p-5 shadow-2xs"
            errorMessage="Please resolve validation errors shown below."
            showResetButton={false}
          >
            <AddProductContent
              categories={categories}
              materials={materials}
              fragrances={fragrances}
              setSelectedSizes={setSelectedSizes}
              selectedSizes={selectedSizes}
            />
          </FormWrapper>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductPage;