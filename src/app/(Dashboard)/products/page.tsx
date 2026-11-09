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
import { Badge } from '@/components/ui/badge';
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
import { Search, Plus, Trash2, Eye, Calendar, Tag, Layers, Star, DollarSign, PackageOpen } from 'lucide-react';
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ProductList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const router = useRouter();
  const { data, isLoading } = useGetAllProductsAdminQuery(
    { searchTerm: query, page: currentPage, limit: pageSize },
    { refetchOnMountOrArgChange: true }
  );

  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const allProducts: IProductResponse[] = useMemo(
    () => (data as any)?.data || [],
    [data]
  );
  const meta = (data as any)?.meta;

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/40 px-2 sm:px-4 py-2 space-y-2">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-base font-bold tracking-tight text-gray-900 leading-tight">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Catalog, pricing, variants, and stock metrics overview</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search product name..."
              value={searchTerm}
              onChange={handleSearch}
              className={cn(
                "pl-9 h-8 text-xs bg-white transition-colors shadow-2xs",
                searchTerm.trim() ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
              )}
            />
          </div>
          <Button
            className="bg-[#FB923C] hover:bg-[#ff8a29] text-white h-8 text-xs px-3.5 font-semibold shrink-0 shadow-2xs"
            onClick={() => router.push('/products/add')}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="font-bold py-3 text-xs sm:text-sm">Product Details</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm">Category</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm">Price Range</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm">Variants & Stock</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm hidden md:table-cell">Accords / Tags</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm hidden lg:table-cell">Sales / Rating</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm hidden xl:table-cell">Created Date</TableHead>
                <TableHead className="font-bold py-3 text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-right font-bold pr-4 py-3 text-xs sm:text-sm w-[1%] whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-3">
                      <Skeleton className="w-full h-8 my-0.5 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : allProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-10 text-gray-500"
                  >
                    <p className="font-semibold text-sm">No products found.</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search query.</p>
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((product: any) => {
                  const variants = product.variants || [];
                  const prices = variants.map((v: any) => v.price || 0);
                  const min = prices.length ? Math.min(...prices) : 0;
                  const max = prices.length ? Math.max(...prices) : 0;
                  const accords = product.accords || [];

                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50/85 transition-colors">
                      {/* Image & Name */}
                      <TableCell className="align-top py-3 max-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-gray-200 bg-gray-100 shrink-0 overflow-hidden shadow-2xs">
                            <Image
                              src={product.primaryImage || '/placeholder.png'}
                              alt={product.name || 'Product Image'}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link target="_blank" href={`https://khushbuwaala.com/products/${product.slug}`} title={product.name}>
                              <span className="font-bold text-xs sm:text-sm text-blue-600 hover:underline block truncate">
                                {product.name || 'N/A'}
                              </span>
                            </Link>
                            <span className="text-[11px] text-gray-500 truncate block font-mono">/{product.slug || ''}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="align-top py-3 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold text-gray-800">
                          <Tag className="w-3 h-3 text-gray-500" />
                          {product.category?.categoryName || 'N/A'}
                        </span>
                      </TableCell>

                      {/* Price Range */}
                      <TableCell className="align-top py-3 font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {prices.length
                              ? min === max
                                ? `${min}৳`
                                : `${min}৳ - ${max}৳`
                              : 'N/A'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Variants & Stock (Hover Card) */}
                      <TableCell className="align-top py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <HoverCard openDelay={150} closeDelay={150}>
                            <HoverCardTrigger asChild>
                              <span className="inline-flex items-center text-xs font-bold text-[#FB923C] cursor-pointer hover:underline">
                                <Layers className="w-3.5 h-3.5 inline mr-1" />
                                {variants.length} Variants
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 p-3 text-xs space-y-2 shadow-lg rounded-xl border border-gray-200 bg-white" align="start">
                              <p className="font-bold text-gray-900 border-b pb-1 text-xs">Variant Details & Pricing</p>
                              {variants.length > 0 ? (
                                variants.map((variant: IProductVariantResponse, index: number) => (
                                  <div
                                    key={variant.id || index}
                                    className="flex items-center justify-between text-xs border-b border-gray-100 pb-1.5 last:border-b-0 last:pb-0"
                                  >
                                    <div>
                                      <span className="font-bold text-gray-800">
                                        {variant.size} {variant.unit}
                                      </span>
                                      <span className="block text-[10px] font-mono text-gray-400">{variant.sku}</span>
                                    </div>
                                    <span className="font-black text-emerald-700">{variant.price} BDT</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 text-center py-1">No variants</p>
                              )}
                            </HoverCardContent>
                          </HoverCard>

                          <div className={cn("text-xs font-semibold flex items-center gap-1", product.totalStock < 0 ? "text-rose-600" : "text-gray-700")}>
                            <PackageOpen className="w-3.5 h-3.5 shrink-0" />
                            <span>Stock: {product.totalStock ?? 'N/A'} {product.category?.unit || ''}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Accords / Tags */}
                      <TableCell className="align-top py-3 max-w-[200px] hidden md:table-cell">
                        {accords.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden">
                            {accords.map((accord: string, aIdx: number) => (
                              <Badge key={aIdx} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                                {accord}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tags</span>
                        )}
                      </TableCell>

                      {/* Sales & Rating */}
                      <TableCell className="align-top py-3 text-xs whitespace-nowrap hidden lg:table-cell">
                        <div className="font-bold text-gray-900">Sold: {product.salesCount ?? 0}</div>
                        <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{product.averageRating || 0} ({product.reviewCount || 0})</span>
                        </div>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="align-top py-3 text-xs text-gray-600 whitespace-nowrap font-medium hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{formatDate(product.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* Status Switch */}
                      <TableCell className="align-top py-3">
                        <Switch
                          checked={product.published}
                          onCheckedChange={(checked) =>
                            handlePublishedChange(checked, product.id)
                          }
                          className="data-[state=checked]:bg-[#4CD964]"
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-3 align-top py-3 whitespace-nowrap">
                        <div className="inline-flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() =>
                              router.push(`/products/${product.slug}`)
                            }
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteId(product.id)}
                            title="Delete Product"
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

        {/* Pagination Footer */}
        {meta && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 px-3.5 py-3 bg-gray-50/50 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600 font-semibold">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPage || 1}</span> (Total <span className="font-bold text-gray-900">{meta.total}</span> products)
              </p>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 font-semibold">Rows:</span>
                <select
                  value={pageSize.toString()}
                  onChange={(val) => {
                    setPageSize(Number(val.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 w-[65px] bg-white text-xs font-semibold border border-gray-300 rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-[#FB923C]"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="bg-white border-gray-300 text-gray-700 h-8 text-xs px-3 font-semibold shadow-2xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= (meta.totalPage || 1)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="bg-white border-gray-300 text-gray-700 h-8 text-xs px-3 font-semibold shadow-2xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and its variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductList;