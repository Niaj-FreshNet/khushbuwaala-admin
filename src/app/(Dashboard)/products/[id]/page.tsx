"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProductQuery, useUpdateProductMutation } from '@/redux/store/api/product/productApi';
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
import SizesCheckboxes from '../_component/SizesCheckboxes';
import { VariantsSection } from '../_component/VariantsSection';
import AddVariantButton from '../_component/AddVariantButton';
import { PublishedSwitch } from '../_component/PublishedSwitch';
import { RichDescriptionEditor } from '../_component/RichDescriptionEditor';
import CategorySizesUpdater from '../_component/CategorySizesUpdater';
import { VariantForForm } from '@/types/product.types';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';
import { ImagePlus, X, Sparkles, Layers, Info, Sliders, ShieldCheck, Video, Loader2, SearchCheck, Wand2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import Thumb from "@/components/admin/Thumb";

// A picture chosen from the device and not uploaded yet, with its on-screen preview.
type PickedImage = { file: File; preview: string };

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
  videos: (File | string)[];
  origin?: string;
  condition?: string;
  googleProductCategory?: string;
  metaTitle?: string;
  metaDescription?: string;
  performance?: string;
  longevity?: string;
  projection?: string;
  sillage?: string;
  bestFor?: string;
  stock: number;
  supplier: string;
}

// ⚡ Comprehensive One-Click SEO Generator Button
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

    // 1. Generate SEO Meta Title
    const toTitleCase = (str: string) => {
      return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // In your generator function:
    const formattedCategoryName = toTitleCase(categoryName);
    const generatedTitle = `${name} - ${brand} | Premium ${formattedCategoryName} in Bangladesh`;
    form.setValue('metaTitle', generatedTitle, { shouldDirty: true, shouldValidate: true });

    // 2. Generate SEO Meta Description
    const notesSummary = topNotes.length ? ` Featuring notes of ${topNotes.slice(0, 3).join(', ')}.` : '';
    const generatedDescription = `Buy authentic ${name} ${categoryName.toLowerCase()} by ${brand}. Long-lasting ${gender} fragrance with ${accordsList.slice(0, 3).join(', ')} accords.${notesSummary} Order online in Bangladesh.`;
    form.setValue('metaDescription', generatedDescription.substring(0, 155), { shouldDirty: true, shouldValidate: true });

    // 3. Generate Clean Unique Tags
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
  };

  return (
    <Button
      type="button"
      onClick={handleGenerateAllSeo}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-2.5 font-semibold gap-1 shadow-2xs shrink-0"
    >
      <Wand2 className="w-3.5 h-3.5" /> Auto-Generate
    </Button>
  );
};

const EditProductPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [updateProduct] = useUpdateProductMutation();

  const { data: productResponse, isLoading, refetch } = useGetProductQuery(id);
  const product = productResponse?.data;

  const { data: categoriesData } = useGetAllCategoriesAdminQuery();
  const { data: materialsData } = useGetAllMaterialsQuery({});
  const { data: fragrancesData } = useGetAllFragrancesQuery({});

  const categories: Category[] = categoriesData?.data?.data || [];
  const materials: Material[] = materialsData?.data?.data || [];
  const fragrances: Fragrance[] = fragrancesData?.data?.data || [];

  const [defaultValues, setDefaultValues] = useState<FormValues | null>(null);
  // Pictures: the saved main picture and gallery, plus files picked in this visit (uploaded on save).
  const [savedPrimary, setSavedPrimary] = useState('');
  const [savedGallery, setSavedGallery] = useState<string[]>([]);
  const [newPrimary, setNewPrimary] = useState<PickedImage | null>(null);
  const [newGallery, setNewGallery] = useState<PickedImage[]>([]);
  const [videosToKeep, setVideosToKeep] = useState<string[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      const currentVideos = product.videos || [];

      setSavedPrimary(product.primaryImage || '');
      setSavedGallery((product.otherImages || []).filter(Boolean));
      setNewPrimary(null);
      setNewGallery([]);

      setVideoPreviews(currentVideos);
      setVideosToKeep(currentVideos);
      setNewVideoFiles([]);

      setDefaultValues({
        name: product.name || '',
        description: product.description || '',
        brand: product.brand || 'Khushbuwaala',
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
          product.variants?.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size.toString(),
            unit: v.unit,
            price: v.price,
            stock: v.stock,
            isDefault: v.isDefault,
            published: v.published ?? true,
            compareAtPrice: v.compareAtPrice,
            weightGrams: v.weightGrams,
            images: v.images || [],
          })) || [],
        origin: product.origin || '',
        condition: product.condition || 'new',
        googleProductCategory: product.googleProductCategory || 'Health & Beauty > Personal Care > Cosmetics > Perfume',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        performance: product.performance || 'GOOD',
        longevity: product.longevity || 'MODERATE',
        projection: product.projection || 'MODERATE',
        sillage: product.sillage || 'MODERATE',
        bestFor: (product.bestFor || []).join(', '),
        videos: currentVideos,
        stock: product.totalStock || 0,
        supplier: product.supplier || '',
        primaryImage: [product.primaryImage],
        otherImages: product.otherImages || [],
      });
    }
  }, [product]);

  const primaryPreview = newPrimary?.preview || savedPrimary;
  const galleryPreviews = [...savedGallery, ...newGallery.map((picked) => picked.preview)];

  const handleSubmit = async (values: FormValues) => {
    try {
      const primaryImageUrl = newPrimary
        ? await uploadToCloudinary(newPrimary.file, 'khushbuwaala_images/products')
        : savedPrimary;

      const newlyUploadedGallery = await Promise.all(
        newGallery.map((picked) => uploadToCloudinary(picked.file, 'khushbuwaala_images/products'))
      );
      const finalOtherImages = [...savedGallery, ...newlyUploadedGallery];

      const newlyUploadedVideos = await Promise.all(
        newVideoFiles.map(file => uploadToCloudinary(file, 'khushbuwaala_images/videos'))
      );
      const finalVideos = [...videosToKeep, ...newlyUploadedVideos];

      const processedVariants = await Promise.all(
        values.variants.map(async (v, index: number) => {
          let variantImageUrls: string[] = [];
          if (v.images && Array.isArray(v.images) && v.images.length > 0) {
            const uploaded = await Promise.all(
              v.images.map(async (img) => {
                if (img instanceof File) return uploadToCloudinary(img, 'khushbuwaala_images/variants');
                return typeof img === 'string' ? img : null;
              })
            );
            variantImageUrls = uploaded.filter((u): u is string => !!u);
          }

          return {
            // Keep the existing id so the backend updates this size in place
            // (order history, stock logs and carts point at it).
            id: v.id || undefined,
            sku: v.sku || `KWP-${values.name.replace(/\s+/g, "").toUpperCase()}-${v.size}-${v.unit}`,
            size: Number(v.size),
            unit: (v.unit || 'ML').toUpperCase(),
            price: Number(v.price),
            stock: Number(v.stock || 0),
            isDefault: Boolean(v.isDefault ?? (index === 0)),
            published: Boolean(v.published ?? true),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
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
        otherImages: finalOtherImages,
        videos: finalVideos,
        origin: values.origin || undefined,
        condition: values.condition || 'new',
        googleProductCategory: values.googleProductCategory || undefined,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        categoryId: values.categoryId,
        supplier: values.supplier || undefined,
        stock: Number(values.stock || 0),
        published: values.published,
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        accords: values.accords ? values.accords.split(",").map(a => a.trim()).filter(Boolean) : [],
        bestFor: values.bestFor ? values.bestFor.split(",").map(b => b.trim()).filter(Boolean) : [],
        perfumeNotes: {
          top: values.perfumeNotes.top.split(",").map(n => n.trim()).filter(Boolean),
          middle: values.perfumeNotes.middle.split(",").map(n => n.trim()).filter(Boolean),
          base: values.perfumeNotes.base.split(",").map(n => n.trim()).filter(Boolean),
        },
        materialIds: values.materialIds || [],
        fragranceIds: values.fragranceIds || [],
        variants: processedVariants,
      };

      await updateProduct({ id: product?.id as string, payload }).unwrap();
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FB923C]" />
        <p className="text-xs font-semibold text-gray-500">Loading product details...</p>
      </div>
    );
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
            <p className="text-[10px] text-gray-500">Modify catalog information, advanced SEO fields, performance attributes, media assets, and variants.</p>
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
            submitButtonClassName="bg-green-600 hover:bg-green-800 text-sm font-bold h-8 p-5 shadow-2xs"
            errorMessage="Failed to update product. Please check fields."
            showResetButton={false}
          >
            <div className="space-y-3 text-xs">
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

              {/* SECTION 1.5: Advanced SEO & AI Meta Generator */}
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <SearchCheck className="w-3.5 h-3.5 text-blue-600" />
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">1.5 Advanced SEO & Metadata</h3>
                  </div>
                  {/* ⚡ One-Click Full SEO Generator Button */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    <FormInput name="bestFor" label="Best For" placeholder="e.g. Office, Evening" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                    <FormInput name="accords" label="Accords (Comma separated)" placeholder="e.g. floral, woody, amber" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                  </div>
                </div>
              </div>

              {/* SECTION 4 & 5: Rich Description & Pyramid Notes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200/60 space-y-1">
                  <RichDescriptionEditor name="description" label="4. Description & Rich Story" />
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

              {/* SECTION 6: Images & Media (Includes Video Uploads) */}
              <div className="border border-gray-200/80 rounded-xl p-3 space-y-3 bg-white shadow-2xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <ImagePlus className="w-4 h-4 text-[#FB923C]" /> 6. Product Media & Imagery
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  {/* Primary Thumbnail */}
                  <div className="space-y-1.5">
                    <FormInput
                      name="primaryImage"
                      label="Primary Thumbnail Image"
                      type="file"
                      inputClassName="border-gray-300 text-xs"
                      onChange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        setNewPrimary({ file, preview: URL.createObjectURL(file) });
                      }}
                    />
                    {primaryPreview && (
                      <div className="relative w-12 h-12 border-2 border-[#FB923C] rounded-lg overflow-hidden shadow-2xs bg-gray-100 mt-1">
                        <Thumb src={primaryPreview} alt="Primary Preview" size={48} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {newPrimary && <p className="text-[11px] text-amber-700">New picture: saved when you press Update.</p>}
                  </div>

                  {/* Gallery Images */}
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
                        setNewGallery((prev) => [
                          ...prev,
                          ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
                        ]);
                      }}
                    />
                    {galleryPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {galleryPreviews.map((preview, index) => (
                          <div key={preview} className="relative w-11 h-11 rounded-lg border border-gray-300 overflow-hidden shadow-2xs bg-gray-100">
                            <Thumb src={preview} alt={`Gallery item ${index + 1}`} size={44} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none"
                              aria-label={`Remove gallery picture ${index + 1}`}
                              onClick={() => {
                                setSavedGallery((prev) => prev.filter((u) => u !== preview));
                                setNewGallery((prev) => prev.filter((picked) => picked.preview !== preview));
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

                {/* Showcase Videos Sub-section */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#FB923C]" /> Product Videos (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (!files.length) return;
                      const previews = files.map(f => URL.createObjectURL(f));
                      setVideoPreviews(prev => [...prev, ...previews]);
                      setNewVideoFiles(prev => [...prev, ...files]);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-md text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-[#FB923C] cursor-pointer truncate"
                  />

                  {videoPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {videoPreviews.map((vidSrc, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg border border-gray-300 overflow-hidden bg-black shadow-2xs group">
                          <video src={vidSrc} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setVideoPreviews(prev => prev.filter((_, i) => i !== idx));
                                if (vidSrc.startsWith("http")) {
                                  setVideosToKeep(prev => prev.filter(u => u !== vidSrc));
                                } else {
                                  setNewVideoFiles(prev => prev.filter((_, i) => i !== (idx - videosToKeep.length)));
                                }
                              }}
                              className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-sm"
                              title="Remove video"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 7: Variants & Stock Pricing */}
              <div className="border border-orange-200/80 rounded-xl p-3 bg-white space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#FB923C]" /> 7. Variants, Sizes, Pricing, Default Selection & Variant Images
                  </h4>
                  <SizesCheckboxes selectedSizes={selectedSizes} />
                </div>

                <VariantsSection />

                <div className="pt-1">
                  <AddVariantButton />
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