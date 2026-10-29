'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import {
  useGetAllProductsAdminQuery,
  useGetProductVariantsQuery,
  useUpdateProductStockMutation,
} from '@/redux/store/api/product/productApi';
import { toast } from 'sonner';
import { z } from 'zod';

// Define form schema using Zod
const formSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  change: z.number().min(1, 'Stock change must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});

interface FormValues {
  productId: string;
  change: number;
  reason: string;
}

const AddStockPage = () => {
  const [updateProductStock, { isLoading }] = useUpdateProductStockMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') || '';
  const { data: productsData } = useGetAllProductsAdminQuery({ searchTerm: '', page: 1, limit: 100 });
  const products = productsData?.data || [];

  const handleSubmit = async (values: FormValues) => {
    try {
      await updateProductStock({
        productId: values.productId,
        addedStock: values.change,
        reason: values.reason,
      }).unwrap();
      toast.success('Stock added successfully!');
      router.push('/dashboard/stock');
    } catch (error) {
      console.error('Failed to add stock:', error);
      toast.error('Failed to add stock');
    }
  };

  const productOptions = products.map((product: any) => ({
    value: product.id,
    label: product.name,
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#FB923C] mb-6">Add Stock</h1>
        <FormWrapper
          defaultValues={{
            productId,
            change: 0,
            reason: 'RESTOCK',
          }}
          onSubmit={handleSubmit}
          submitButtonText="Add Stock"
          submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
          resetButtonText="Cancel"
          resetButtonClassName="border-[#FB923C] text-[#FB923C]"
          schema={formSchema}
        >
          <Card className="border-[#FB923C]">
            <CardHeader>
              <CardTitle>Stock Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                name="productId"
                label="Product"
                type="select"
                placeholder="Select Product"
                options={productOptions}
                required
                inputClassName="border-[#FB923C]"
              />
              <FormInput
                name="change"
                label="Stock Change"
                type="number"
                placeholder="Enter stock amount"
                required
                inputClassName="border-[#FB923C]"
              />
              <FormInput
                name="reason"
                label="Reason"
                type="select"
                placeholder="Select Reason"
                options={[
                  { value: 'RESTOCK', label: 'Restock' },
                  { value: 'ADJUSTMENT', label: 'Adjustment' },
                  { value: 'RETURN', label: 'Return' },
                ]}
                required
                inputClassName="border-[#FB923C]"
              />
            </CardContent>
          </Card>
        </FormWrapper>
      </div>
    </div>
  );
};

export default AddStockPage;