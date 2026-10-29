'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Search, Plus, FileText } from 'lucide-react';
import { useGetAllProductsAdminQuery } from '@/redux/store/api/product/productApi';
import { IProductResponse } from '@/types/product.types';

const StockManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popularity'>('name');
  const [stockFilter, setStockFilter] = useState<'in' | 'out' | 'all'>('all');
  const router = useRouter();

  const { data, isLoading } = useGetAllProductsAdminQuery({
    searchTerm,
    page,
    limit,
    sortBy,
    stock: stockFilter === 'all' ? undefined : stockFilter,
  });

  const allProducts: IProductResponse[] = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta;

  const handleViewLogs = (productId: string) => {
    router.push(`/dashboard/stock/logs/${productId}`);
  };

  const handleAddStock = (productId: string) => {
    router.push(`/dashboard/stock/add?productId=${productId}`);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4">
          <Input
            placeholder="Search by Product Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-80 border-[#FB923C] focus:ring-[#FB923C]"
            prefix={<Search className="w-4 h-4 text-gray-500" />}
          />
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-40 border-[#FB923C]">
              <SelectValue placeholder="Filter Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 border-[#FB923C]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
            onClick={() => router.push('/dashboard/stock/add')}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Stock
          </Button>
        </div>
        <Table className="border-[#FB923C]">
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell><span className='font-bold'>{product.totalStock} {product.category?.unit || 'Unit'}</span></TableCell>
                <TableCell>
                  {product.variants.map((variant) => (
                    <div key={variant.id}>
                      {variant.size} {variant.unit} ({variant.price} BDT)
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.totalStock <= 10 ? 'destructive' : 'success'}
                    className={product.totalStock <= 10 ? 'bg-red-500' : 'bg-[#4CD964]'}
                  >
                    {product.totalStock <= 10 ? 'Low Stock' : 'In Stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className='hover:bg-orange-300'
                      onClick={() => handleViewLogs(product.id)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className='hover:bg-orange-300'
                      onClick={() => handleAddStock(product.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {meta && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">Showing {allProducts.length} of {meta.total} products</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= meta.totalPage}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagementPage;