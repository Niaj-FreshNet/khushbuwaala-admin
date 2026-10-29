'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useGetAllMaterialsQuery } from '@/redux/store/api/material/materialApi';
import { useGetAllFragrancesQuery } from '@/redux/store/api/fragrance/fragranceApi';
import { useCreateProductMutation } from '@/redux/store/api/product/productApi';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { Material } from '@/types/material.types';
import { Fragrance } from '@/types/fragrance.types';
import { Button } from '@/components/ui/button';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { useFormContext } from 'react-hook-form';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import CategorySizesUpdater from '../_component/CategorySizesUpdater';
import SizesCheckboxes from '../_component/SizesCheckboxes';
import { VariantsSection } from '../_component/VariantsSection';
import AddVariantButton from '../_component/AddVariantButton';
import { PublishedSwitch } from '../_component/PublishedSwitch';
import { VariantForForm } from '@/types/product.types';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';

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
    variants: [{ size: '', price: 0, stock: 0, sku: '', unit: '' }],
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
    if (values.primaryImage.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }
    if (values.variants.length === 0) {
      toast.error('Please add at least one variant.');
      return;
    }

    try {
      // 🧠 Upload primary image first
      const primaryFile = Array.isArray(values.primaryImage)
        ? values.primaryImage[0]
        : values.primaryImage;

      const primaryImageFile =
        primaryFile instanceof FileList ? primaryFile[0] : primaryFile;

      const primaryImageUrl = await uploadToCloudinary(
        primaryImageFile,
        'khushbuwaala_images/products'
      );

      // 🧠 Upload other images next
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
        tags: values.tags.split(',').map(t => t.trim()).filter(Boolean),
        accords: values.accords.split(',').map(a => a.trim()).filter(Boolean),
        bestFor: values.bestFor?.split(',').map(b => b.trim()).filter(Boolean),
        perfumeNotes: {
          top: values.perfumeNotes.top.split(',').map(n => n.trim()).filter(Boolean),
          middle: values.perfumeNotes.middle.split(',').map(n => n.trim()).filter(Boolean),
          base: values.perfumeNotes.base.split(',').map(n => n.trim()).filter(Boolean),
        },
        variants: values.variants.map(v => ({
          sku: v.sku,
          size: Number(v.size),
          unit: v.unit.toUpperCase(),
          price: Number(v.price),
        })),
      };

      await createProduct(payload).unwrap();
      toast.success('Product added successfully!');
      setImagePreviews([]);
      // router.push('/dashboard/products');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Image upload or product creation failed.');
      return false;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <FormWrapper
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitButtonText="Add Product"
            submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29]"
            errorMessage='Failed to add product. Please try again.'
            resetButtonText="Cancel"
            resetButtonClassName="border-[#FB923C] text-[#FB923C]"
            resetOnSuccess={true}
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

            <FormInput
              name="description"
              label="Description"
              type="textarea"
              rows={10}
              maxLength={2000}
              showCount
              helperText="Supports line breaks, bullets and detailed formatting."
              placeholder={`Write a rich description...\n\n• Long lasting\n• Strong projection\n• Best for: Office, Evening`}
              inputClassName="border-[#FB923C]"
            />

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
                      const file = e.target.files?.[0];
                      if (file) {
                        const previewUrl = URL.createObjectURL(file);
                        setImagePreviews((prev) => [previewUrl, ...prev.slice(1)]);
                      }
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
                      const files = Array.from(e.target.files || []);
                      const previews = files.map((file) => URL.createObjectURL(file));
                      setImagePreviews((prev) => [prev[0], ...previews]); // keep primary first
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
                            type='button'
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-4 -translate-y-1/2 translate-x-1/2"
                            onClick={() => {
                              const form = useFormContext<FormValues>();
                              const otherImages = form.getValues("otherImages");
                              // adjust the array removing that image
                              otherImages.splice(index + 1, 1);
                              form.setValue("otherImages", otherImages);
                              setImagePreviews((prev) =>
                                prev.filter((_, i) => i !== index + 1)
                              );
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
    </div >
  );
};

export default AddProductPage;
