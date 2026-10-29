'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useGetStockLogsQuery } from '@/redux/store/api/product/productApi';
import { Skeleton } from '@/components/ui/skeleton';
import { StockLog } from '@/types/product.types';

const StockLogsPage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetStockLogsQuery(productId as string);

  // Ensure stockLogs is always an array
  const stockLogs: StockLog[] = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const productName = stockLogs[0]?.product?.name || 'Product';

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-[#FB923C]">
            Stock Logs for {productName}
          </h1>
          <Button
            variant="outline"
            className="border-[#FB923C] text-[#FB923C]"
            onClick={() => router.push('/dashboard/stock')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stock
          </Button>
        </div>

        <Table className="border-[#FB923C]">
          <TableHeader>
            <TableRow>
              <TableHead>Log ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
              ))
            ) : (
              stockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id.slice(0, 8)}...</TableCell>
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{log.change > 0 ? `+${log.change}` : log.change}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StockLogsPage;
