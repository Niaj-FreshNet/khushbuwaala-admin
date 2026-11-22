/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useRouter } from 'next/navigation';
import { Search, FileText, Package, PackagePlus, Layers } from 'lucide-react';
import { MobileCard, MobileCardList, MobileField } from '@/components/admin/MobileCards';
import { useGetAllProductsAdminQuery } from '@/redux/store/api/product/productApi';
import { IProductResponse } from '@/types/product.types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import RestockDialog from '@/components/admin/RestockDialog';
import { useAuth } from '@/redux/store/hooks/useAuth';

const StockManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity'>('name');
  const [stockFilter, setStockFilter] = useState<'in' | 'out' | 'all'>('all');

  // Auth check for Super Admin privileges
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Restock form (shared with Low Stock; cost fields for super admin only)
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductResponse | null>(null);
  const canRestock = isSuperAdmin || user?.role === 'ADMIN';

  const router = useRouter();
  const { data, isLoading, refetch } = useGetAllProductsAdminQuery({
    searchTerm,
    page,
    limit,
    sortBy,
    stock: stockFilter === 'all' ? undefined : stockFilter,
  });

  const allProducts: IProductResponse[] = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta;

  const handleViewLogs = (productId: string) => {
    router.push(`/stock/logs/${productId}`);
  };

  const handleOpenRestock = (product: IProductResponse) => {
    setSelectedProduct(product);
    setRestockModalOpen(true);
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col overflow-hidden text-xs">
      {/* Top Header & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Stock & Inventory Overview</h1>
            <p className="text-[10px] text-gray-500">Track stock levels, variants, supplier data, and financial WAC logs</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-7 text-xs bg-white border-gray-300 shadow-2xs"
            />
          </div>

          <Select value={stockFilter} onValueChange={(val: any) => setStockFilter(val)}>
            <SelectTrigger className="w-28 h-7 text-xs border-gray-300 bg-white">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-32 h-7 text-xs border-gray-300 bg-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        {/* PHONE: cards (sizes shown inline: hover popups don't work on touch) */}
        <MobileCardList
          className="bg-gray-50/60 p-2"
          isLoading={isLoading}
          isEmpty={!isLoading && allProducts.length === 0}
          emptyText="No products match these filters."
        >
          {allProducts.map((product: any) => {
            const sizes = [...(product.variants || [])].sort((a: any, b: any) => (Number(a.size) || 0) - (Number(b.size) || 0));
            const low = product.totalStock <= 10;
            return (
              <MobileCard
                key={product.id}
                title={product.name}
                subtitle={`${product.brand || 'Khushbuwaala'}${product.supplier ? ` · ${product.supplier}` : ''}`}
                badge={
                  <Badge className={cn('text-[10px] font-bold px-2 py-0.5', low ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white')}>
                    {low ? 'Low' : 'In stock'}
                  </Badge>
                }
                actions={
                  <>
                    <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" onClick={() => handleViewLogs(product.id)}>
                      <FileText className="mr-1 h-4 w-4" /> Stock history
                    </Button>
                    {canRestock && (
                      <Button size="sm" className="h-10 flex-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700" onClick={() => handleOpenRestock(product)}>
                        <PackagePlus className="mr-1 h-4 w-4" /> Restock
                      </Button>
                    )}
                  </>
                }
              >
                <MobileField label="Total stock">
                  <span className={cn('font-bold', low ? 'text-rose-600' : 'text-gray-900')}>
                    {product.totalStock} {product.category?.unit || 'units'}
                  </span>
                </MobileField>
                <MobileField label="Sizes">{sizes.length}</MobileField>
                {sizes.length > 0 && (
                  <MobileField label="Prices" full>
                    <span className="whitespace-normal">{sizes.map((v: any) => `${v.size}${v.unit} ৳${v.price}`).join(' · ')}</span>
                  </MobileField>
                )}
              </MobileCard>
            );
          })}
        </MobileCardList>

        {/* DESKTOP: table */}
        <div className="hidden md:block overflow-y-auto flex-1 max-h-[calc(100vh-170px)]">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-3 pl-3.5 font-bold text-xs">Product Information</TableHead>
                <TableHead className="py-3 font-bold text-xs">Supplier / Brand</TableHead>
                <TableHead className="py-3 font-bold text-xs">Total Stock</TableHead>
                <TableHead className="py-3 font-bold text-xs">Variants Summary</TableHead>
                <TableHead className="py-3 font-bold text-xs">Status</TableHead>
                <TableHead className="py-3 pr-3.5 font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-3 pl-3.5"><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="py-3 pr-3.5 text-right"><Skeleton className="h-7 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : allProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-xs">No products found matching your criteria.</p>
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((product: any) => {
                  // <-- ⚡ SORT VARIANTS: From small size to large size
                  const sortedVariants = [...(product.variants || [])].sort(
                    (a: any, b: any) => (Number(a.size) || 0) - (Number(b.size) || 0)
                  );

                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell className="py-3 pl-3.5">
                        <span className="font-bold text-gray-900 block truncate max-w-[220px]">{product.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {product.id.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-gray-700 block">{product.brand || 'Khushbuwaala'}</span>
                        <span className="text-[10px] text-gray-400">{product.supplier || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="py-3 font-bold text-gray-900">
                        {product.totalStock} <span className="text-[10px] text-gray-500 font-normal">{product.category?.unit || 'Units'}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <HoverCard openDelay={150} closeDelay={150}>
                          <HoverCardTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md font-semibold cursor-pointer hover:bg-emerald-100 transition-colors">
                              <Layers className="w-3.5 h-3.5 text-emerald-600" />
                              {sortedVariants.length} Sizes Available
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-60 p-2.5 text-xs space-y-1.5 shadow-lg rounded-xl border border-gray-200 bg-white" align="start">
                            <p className="font-bold text-gray-900 border-b pb-1 text-[11px] mb-1">Variant Sizes & Pricing</p>
                            {sortedVariants.length > 0 ? (
                              sortedVariants.map((v: any, index: number) => (
                                <div key={v.id || index} className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-1 last:border-b-0">
                                  <span className="font-semibold text-gray-700">{v.size} {v.unit}</span>
                                  <span className="font-bold text-emerald-700">{v.price}৳</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400 text-center py-1">No variants</p>
                            )}
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 shadow-2xs",
                            product.totalStock <= 10 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                          )}
                        >
                          {product.totalStock <= 10 ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 pr-3.5 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 border-gray-300 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleViewLogs(product.id)}
                            title="View Audit Logs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1 text-gray-500" /> Logs
                          </Button>

                          {/* Super admin: purchase with cost. Admin: add stock without cost (RestockDialog) */}
                          {canRestock && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                              onClick={() => handleOpenRestock(product)}
                            >
                              <PackagePlus className="w-3.5 h-3.5 mr-1" /> Restock
                            </Button>
                          )}
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
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-gray-50/80 border-t border-gray-200 shrink-0 text-xs text-gray-600">
            <span>Showing <span className="font-bold">{allProducts.length}</span> of <span className="font-bold">{meta.total}</span> products</span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="h-7 text-[11px] bg-white border-gray-300"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="h-7 text-[11px] bg-white border-gray-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <RestockDialog product={selectedProduct} open={restockModalOpen} onOpenChange={setRestockModalOpen} onDone={refetch} />
    </div>
  );
};

export default StockManagementPage;