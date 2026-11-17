/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import { useGetStockLogsQuery } from '@/redux/store/api/product/productApi';
import { Skeleton } from '@/components/ui/skeleton';
import { StockLog } from '@/types/product.types';

const StockLogsPage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetStockLogsQuery(productId as string);

  const stockLogs: StockLog[] = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const productName = stockLogs[0]?.product?.name || 'Product';

  return (
    <div className="w-full h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col overflow-hidden text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Stock Activity Audit Logs</h1>
            <p className="text-[10px] text-gray-500">History trail for: <span className="font-semibold text-gray-800">{productName}</span></p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/stock')}
          className="text-[11px] h-6 border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Stock
        </Button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 max-h-[calc(100vh-130px)]">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-2.5 pl-3.5 font-bold text-xs">Reference ID</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Timestamp</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Adjustment Amount</TableHead>
                <TableHead className="py-2.5 pr-3.5 font-bold text-xs">Reason Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-2.5 pl-3.5"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-2.5"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="py-2.5"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="py-2.5 pr-3.5"><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : stockLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-xs">No stock logs found for this product.</p>
                  </TableCell>
                </TableRow>
              ) : (
                stockLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="py-2.5 pl-3.5 font-mono text-gray-500">{log.id}</TableCell>
                    <TableCell className="py-2.5 text-gray-700">
                      {new Date(log.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </TableCell>
                    <TableCell className="py-2.5 font-bold">
                      <span className={log.change > 0 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded'}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 pr-3.5 font-semibold text-gray-800">{log.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StockLogsPage;