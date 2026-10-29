'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  useGetAllProductsAdminQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from '@/redux/store/api/product/productApi';
import {
  IProductResponse,
  IProductVariantResponse,
} from '@/types/product.types';
import { Search, Plus, Trash2, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import Link from 'next/link';

const ProductList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState(''); // Debounced query
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const router = useRouter();
  const { data, isLoading } = useGetAllProductsAdminQuery(
    { searchTerm: query, page: currentPage, limit: pageSize },
    { refetchOnMountOrArgChange: true }
  );

  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  // ✅ Correct structure fix
  const allProducts: IProductResponse[] = useMemo(
    () => data?.data || [],
    [data]
  );
  const meta = data?.meta;

  // ✅ Debounce search for performance
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQuery(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId).unwrap();
      toast.success('Product deleted successfully!');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handlePublishedChange = async (checked: boolean, productId: string) => {
    try {
      await updateProduct({
        id: productId,
        data: { published: checked },
      }).unwrap();
      toast.success('Product status updated successfully!');
    } catch {
      toast.error('Failed to update product status');
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search by name, description or tags..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 border-[#FB923C] focus:ring-[#FB923C]"
            />
          </div>
          <Button
            className="bg-[#FB923C] hover:bg-[#ff8a29]"
            onClick={() => router.push('/dashboard/products/add')}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                // 🦴 Skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : allProducts.length === 0 ? (
                // 🚫 No products
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                // ✅ Data rows
                allProducts.map((product) => {
                  const variants = product.variants || [];
                  const prices = variants.map((v) => v.price || 0);
                  const min = prices.length ? Math.min(...prices) : 0;
                  const max = prices.length ? Math.max(...prices) : 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="capitalize">
                        <Link target="_blank" href={`/product/${product.slug}`}>
                          <span className='text-sky-700 hover:underline'>
                            {product.name?.toLowerCase() || 'N/A'}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Image
                          src={product.primaryImage || '/placeholder.png'}
                          alt={product.name || 'Product Image'}
                          width={60}
                          height={40}
                          className="object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>
                        {prices.length
                          ? min === max
                            ? `${min}`
                            : `${min} - ${max}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="link">
                              {variants.length} variants
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56">
                            {variants.length > 0 ? (
                              variants.map(
                                (variant: IProductVariantResponse, index) => (
                                  <div
                                    key={variant.id || index}
                                    className="mb-2 border-b pb-2"
                                  >
                                    <p className="font-semibold">
                                      {variant.size} {variant.unit}
                                    </p>
                                    <p>Price: {variant.price} BDT</p>
                                    {/* <p>SKU: {variant.sku}</p> */}
                                  </div>
                                )
                              )
                            ) : (
                              <p className="text-gray-500 text-sm">
                                No variants available
                              </p>
                            )}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>{product.totalStock || 'N/A'} {product.category?.unit}</TableCell>
                      <TableCell>
                        {product.category?.categoryName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.published}
                          onCheckedChange={(checked) =>
                            handlePublishedChange(checked, product.id)
                          }
                          className="data-[state=checked]:bg-[#4CD964]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/dashboard/products/${product.slug}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Total {meta.total} products
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={currentPage >= (meta.totalPage || 1)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You won&apos;t be able to revert this!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProductList;
