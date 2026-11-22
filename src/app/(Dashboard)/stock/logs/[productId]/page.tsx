/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import { useGetStockLogsQuery } from '@/redux/store/api/product/productApi';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileCard, MobileCardList } from '@/components/admin/MobileCards';
import { StockLog } from '@/types/product.types';
import { cn } from '@/lib/utils';

// Plain-language names for the reasons the backend writes
const REASONS: Record<string, string> = {
  SALE: 'Sold',
  RESTOCK: 'Restock',
  ADJUSTMENT: 'Count correction',
  RETURN: 'Customer return',
  ORDER_CANCELED: 'Order cancelled: stock back',
  ORDER_RETURNED: 'Order returned: stock back',
  ORDER_DELETED: 'Order deleted: stock back',
  ORDER_REACTIVATED: 'Order re-opened: stock taken',
  ORDER_EDIT: 'Order items edited',
  ORDER_CHECKOUT_RETRY: 'Unpaid online checkout retried: stock back',
};
const reasonLabel = (r: string) => REASONS[r] || r;

const when = (d: string | Date) =>
  new Date(d).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const fmt = (n: number) => Number(n.toFixed(2)).toLocaleString('en-US');

const Change = ({ v }: { v: number }) => (
  <span className={cn('font-bold px-2 py-0.5 rounded', v > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50')}>
    {v > 0 ? `+${fmt(v)}` : fmt(v)}
  </span>
);

const StockLogsPage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetStockLogsQuery(productId as string);

  const stockLogs: StockLog[] = useMemo(() => {
    const raw: any = data;
    return Array.isArray(raw?.data) ? raw.data : [];
  }, [data]);

  const productName = stockLogs[0]?.product?.name || 'Product';
  const totals = useMemo(() => {
    let added = 0, removed = 0;
    for (const l of stockLogs) (l.change > 0 ? (added += l.change) : (removed += l.change));
    return { added, removed };
  }, [stockLogs]);

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Stock history</h1>
            <p className="text-[11px] sm:text-[10px] text-gray-500 truncate">
              <span className="font-semibold text-gray-800">{productName}</span>
              {stockLogs.length > 0 && <> · {stockLogs.length} {stockLogs.length === 1 ? 'entry' : 'entries'} · in +{fmt(totals.added)} · out {fmt(totals.removed)}</>}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/stock')} className="text-xs sm:text-[11px] h-10 sm:h-7 border-gray-300">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to stock
        </Button>
      </div>

      {/* Phones */}
      <MobileCardList isLoading={isLoading} isEmpty={!isLoading && stockLogs.length === 0} emptyText="No stock history for this product yet.">
        {stockLogs.map((log) => (
          <MobileCard key={log.id} title={reasonLabel(log.reason)} subtitle={when(log.createdAt)} badge={<Change v={log.change} />} />
        ))}
      </MobileCardList>

      {/* Desktop */}
      <div className="hidden md:flex flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden flex-col">
        <div className="overflow-y-auto flex-1 max-h-[calc(100vh-130px)]">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-2.5 pl-3.5 font-bold text-xs">When (Dhaka)</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Change</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Reason</TableHead>
                <TableHead className="py-2.5 pr-3.5 font-bold text-xs">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {['w-36', 'w-16', 'w-32', 'w-24'].map((w, j) => (
                      <TableCell key={j} className="py-2.5 pl-3.5"><Skeleton className={cn('h-4', w)} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : stockLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500 font-semibold text-xs">No stock history for this product yet.</TableCell>
                </TableRow>
              ) : (
                stockLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="py-2.5 pl-3.5 text-gray-700">{when(log.createdAt)}</TableCell>
                    <TableCell className="py-2.5"><Change v={log.change} /></TableCell>
                    <TableCell className="py-2.5 font-semibold text-gray-800">{reasonLabel(log.reason)}</TableCell>
                    <TableCell className="py-2.5 pr-3.5 font-mono text-[10px] text-gray-400">{log.id}</TableCell>
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
