'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { VariantForForm } from '@/types/product.types';

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

  // Convert API product to form default values
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

  // console.log(product?.materialIds)
  const handleSubmit = async (values: FormValues) => {
    try {
      const fd = new FormData();

      // ----- normal fields -----
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

      // ----- json fields (because parseJsonFields expects JSON) -----
      fd.append("tags", JSON.stringify(values.tags.split(",").map(t => t.trim()).filter(Boolean)));
      fd.append("accords", JSON.stringify(values.accords.split(",").map(a => a.trim()).filter(Boolean)));
      fd.append("bestFor", JSON.stringify(values.bestFor?.split(",").map(b => b.trim()).filter(Boolean) || []));

      fd.append("perfumeNotes", JSON.stringify({
        top: values.perfumeNotes.top.split(",").map(n => n.trim()).filter(Boolean),
        middle: values.perfumeNotes.middle.split(",").map(n => n.trim()).filter(Boolean),
        base: values.perfumeNotes.base.split(",").map(n => n.trim()).filter(Boolean),
      }));

      // fd.append("materialIds", JSON.stringify(values.materialIds || []));
      fd.append("materialIds", JSON.stringify(values.materialIds || []));
      // fd.append("fragranceIds", JSON.stringify(values.fragranceIds || []));
      fd.append("fragranceIds", JSON.stringify(values.fragranceIds || []));

      fd.append("variants", JSON.stringify(values.variants.map(v => ({
        sku: v.sku,
        size: Number(v.size),
        unit: v.unit.toUpperCase(),
        price: Number(v.price),
      }))));

      // ----- image logic (this is the key) -----
      // fd.append("imagesToKeep", JSON.stringify(imagesToKeep.filter((u) => u.startsWith("http"))));
      fd.append("imagesToKeep", JSON.stringify(imagesToKeep));

      // newImageFiles.forEach((file) => {
      //   fd.append("images", file); // ✅ must be 'images' (backend expects)
      // });
      newImageFiles.forEach((f) => fd.append("images", f)); // multer expects 'images'

      await updateProduct({ id: product?.id as string, formData: fd }).unwrap();
      toast.success("Product updated successfully!");
      await refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product.");
    }
  };

  if (isLoading || !defaultValues) {
    return <div className="p-6 text-center text-gray-500">Loading product details...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <FormWrapper
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitButtonText="Update Product"
            submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29]"
            successMessage="Product updated successfully!"
            errorMessage="Failed to update product."
            resetButtonText="Cancel"
            resetButtonClassName="border-[#FB923C] text-[#FB923C]"
          >
            {/* Category Sizes */}
            <CategorySizesUpdater categories={categories} setSelectedSizes={setSelectedSizes} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput name="name" label="Name" placeholder="Product Name" inputClassName="border-[#FB923C]" />
              <FormInput
                name="categoryId"
                label="Category"
                type="select"
                options={categories.map(cat => ({ value: cat.id, label: cat.categoryName }))}
                inputClassName="border-[#FB923C]"
              />
              <FormCheckboxGroup
                name="fragranceIds"
                label="Fragrance-family"
                options={fragrances.map(f => ({ label: f.fragranceName, value: f.id }))}
              />

              <FormCheckboxGroup
                name="materialIds"
                label="Materials"
                options={materials.map(m => ({ label: m.materialName, value: m.id }))}
              />
              <FormInput name="brand" label="Brand" placeholder="Brand" inputClassName="border-[#FB923C]" />
              <FormInput name="origin" label="Origin" placeholder="e.g. France, Middle East" inputClassName="border-[#FB923C]" />
              <FormInput
                name="gender"
                label="Gender"
                type="select"
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'UNISEX', label: 'Unisex' },
                ]}
                inputClassName="border-[#FB923C]"
              />
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
                inputClassName="border-[#FB923C]"
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
                inputClassName="border-[#FB923C]"
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
                inputClassName="border-[#FB923C]"
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
                inputClassName="border-[#FB923C]"
              />
              <FormInput name="bestFor" label="Best For" placeholder="e.g. Office, Party" inputClassName="border-[#FB923C]" />
              <FormInput name="accords" label="Accords" placeholder="e.g. floral, luxury, unisex" inputClassName="border-[#FB923C]" />
              <FormInput name="tags" label="Tags" placeholder="e.g. floral, luxury, unisex" inputClassName="border-[#FB923C]" />
            </div>

            <FormInput name="description" label="Description" type="textarea" placeholder="Product Description" inputClassName="border-[#FB923C]" />

            {/* Perfume Notes */}
            <Card className="border-[#FB923C]">
              <CardHeader>
                <CardTitle>Perfume Notes</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput name="perfumeNotes.top" label="Top Notes" placeholder="e.g. bergamot, lemon" inputClassName="border-[#FB923C]" />
                <FormInput name="perfumeNotes.middle" label="Middle Notes" placeholder="e.g. jasmine, rose" inputClassName="border-[#FB923C]" />
                <FormInput name="perfumeNotes.base" label="Base Notes" placeholder="e.g. sandalwood, musk" inputClassName="border-[#FB923C]" />
              </CardContent>
            </Card>


            {/* Product Images */}
            <Card className="border-[#FB923C]">
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Image */}
                <div>
                  <FormInput
                    name="primaryImage"
                    label="Primary Image"
                    type="file"
                    inputClassName="border-[#FB923C]"
                    onChange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;

                      const previewUrl = URL.createObjectURL(file);

                      // UI preview
                      setImagePreviews((prev) => [previewUrl, ...prev.slice(1)]);

                      // backend logic:
                      // remove existing primary from keep-list (if it was an URL)
                      setImagesToKeep((prevKeep) => {
                        const currentPrimary = prevKeep[0];
                        const rest = prevKeep.slice(1);
                        // only remove if it looks like a real URL, not blob
                        return currentPrimary?.startsWith("http") ? rest : prevKeep;
                      });

                      // add new file to upload list
                      setNewImageFiles((prev) => [file, ...prev]);
                    }}
                  />
                  {imagePreviews[0] && (
                    <div className="mt-3 w-24 h-24 border border-[#FB923C] rounded overflow-hidden">
                      <img
                        src={imagePreviews[0]}
                        alt="Primary Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Other Images */}
                <div>
                  <FormInput
                    name="otherImages"
                    label="Other Images"
                    type="file"
                    inputClassName="border-[#FB923C]"
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
                    <div className="flex flex-wrap gap-2 mt-4">
                      {imagePreviews.slice(1).map((preview, index) => (
                        <div
                          key={index}
                          className="relative w-20 h-20 rounded border border-[#FB923C] overflow-hidden"
                        >
                          <img
                            src={preview}
                            alt={`Other preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-4 -translate-y-1/2 translate-x-1/2"
                            onClick={() => {
                              const img = imagePreviews[index + 1]; // because slice(1)

                              // remove from UI preview
                              setImagePreviews((prev) => prev.filter((_, i) => i !== index + 1));

                              // if it’s an old server URL -> remove from keep list
                              if (img?.startsWith("http")) {
                                setImagesToKeep((prev) => prev.filter((u) => u !== img));
                              }

                              // if it’s a blob preview -> also remove its file from newImageFiles
                              // easiest safe approach: rebuild newImageFiles by filtering out matching "last selected"
                              // (optional improvement: map blob->File in state)
                            }}
                          >
                            x
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            <FormInput name="videoUrl" label="Video URL" placeholder="Optional video link" inputClassName="border-[#FB923C]" />

            {/* Variants */}
            <Card className="border-[#FB923C]">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Variants</CardTitle>
                <SizesCheckboxes selectedSizes={selectedSizes} />
              </CardHeader>
              <CardContent>
                <VariantsSection selectedSizes={selectedSizes} />
                <div className="flex flex-wrap gap-2">
                  <AddVariantButton selectedSizes={selectedSizes} />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput name="stock" label="Stock" placeholder="Stock Quantity" type="number" inputClassName="border-[#FB923C]" />
              <FormInput name="supplier" label="Supplier" placeholder="Product Supplier" inputClassName="border-[#FB923C]" />
              <PublishedSwitch />
            </div>
          </FormWrapper>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPage;
