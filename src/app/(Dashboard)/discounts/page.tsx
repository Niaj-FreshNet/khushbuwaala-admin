'use client';

import { useMemo, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash, Copy } from 'lucide-react';
import {
  useGetAllDiscountsAdminQuery,
  useDeleteDiscountMutation,
} from '@/redux/store/api/discount/discountApi';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DiscountList() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetAllDiscountsAdminQuery();
  const [deleteDiscount] = useDeleteDiscountMutation();

  const discounts = useMemo(
    () => (Array.isArray(data) ? data : data?.data || []),
    [data]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return discounts.filter((d: any) => {
      const code = d.code?.toLowerCase() || '';
      const productName = d.product?.name?.toLowerCase() || '';
      return code.includes(q) || productName.includes(q);
    });
  }, [discounts, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      await deleteDiscount(id).unwrap();
      toast.success('Discount deleted successfully.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete discount.');
    }
  };

  // ---------- formatting helpers ----------
  const round1 = (n: number) => Math.round(n * 10) / 10;

  const formatDiscount = (d: any) =>
    d.type === 'percentage'
      ? `${round1(Number(d.value || 0))}%`
      : `৳${Math.round(Number(d.value || 0))}`;

  type DiscountStatus = 'Active' | 'Scheduled' | 'Expired';

  const getStatus = (d: any): DiscountStatus => {
    const now = Date.now();
    const start = d.startDate ? new Date(d.startDate).getTime() : null;
    const end = d.endDate ? new Date(d.endDate).getTime() : null;

    if (!start && !end) return 'Active';
    if (start && start > now) return 'Scheduled';
    if (end && end < now) return 'Expired';
    return 'Active';
  };

  const statusBadgeClass = (s: DiscountStatus) => {
    if (s === 'Active') return 'bg-emerald-50 text-emerald-700';
    if (s === 'Scheduled') return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  };

  const formatRange = (start: any, end: any) => {
    const s = start ? format(new Date(start), 'dd MMM yyyy, hh:mm a') : 'Always';
    const e = end ? format(new Date(end), 'dd MMM yyyy, hh:mm a') : 'No expiry';
    return `${s} → ${e}`;
  };

  const formatUsage = (d: any) => {
    const max = d.maxUsage == null ? '∞' : d.maxUsage;
    const used = d.usedCount ?? 0;
    return `${used}/${max}`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Discounts & Promotions
          </h1>
          <Link href="/dashboard/discounts/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Discount
            </Button>
          </Link>
        </div>

        <div className="relative mb-4 w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by code or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-orange-400"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            No discounts found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((d: any) => {
                const status = getStatus(d);
                const isPromo = !!d.code?.trim();

                return (
                  <TableRow key={d.id} className="hover:bg-gray-50">
                    {/* Code + Copy */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isPromo ? (
                          <>
                            <span className="text-gray-900">{d.code}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => copyText(d.code)}
                            >
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy
                            </Button>
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            Auto discount
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </TableCell>

                    {/* Scope */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          d.scope === 'ORDER'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {d.scope === 'ORDER' ? 'Order' : 'Product'}
                      </span>
                    </TableCell>

                    {/* Product */}
                    <TableCell className="max-w-[240px]">
                      <span className="truncate block text-gray-900">
                        {d.product?.name || '-'}
                      </span>
                    </TableCell>

                    {/* Variant */}
                    <TableCell className="max-w-[280px]">
                      {d.variant ? (
                        <div className="flex flex-col">
                          <span className="truncate text-gray-900">
                            {d.variant.sku}
                          </span>
                          {(d.variant.size || d.variant.unit) && (
                            <span className="text-xs text-gray-500">
                              {d.variant.size}
                              {d.variant.unit || ''}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    {/* Discount (merged) */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          d.type === 'percentage'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {formatDiscount(d)}
                      </span>
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                      {formatRange(d.startDate, d.endDate)}
                    </TableCell>

                    {/* Usage */}
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {formatUsage(d)}
                      </span>
                    </TableCell>

                    {/* Actions (ONLY place to navigate) */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/discounts/${d.id}`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Edit discount"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(d.id)}
                          aria-label="Delete discount"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
