'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Search,
  Printer,
  Eye,
  RefreshCw,
  Filter,
  X,
  CheckSquare,
  Square,
  Trash2,
  Loader2,
  TrendingUp,
  Truck,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ReceiptText,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  useGetAllSalesQuery,
  useUpdateSalesMutation,
  useGetSaleByIdQuery,
} from '@/redux/store/api/sales/salesApi';
import { useSendOrderToSteadfastMutation } from '@/redux/store/api/steadfast/steadfastApi';
import { useBackfillHistoricalCostsMutation, useOverrideOrderProfitMutation } from '@/redux/store/api/finance/financeApi';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import SaleDetailsModal from './SaleDetailsModal';
import SalesInvoice from './SalesInvoice';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import OrderProfitEditorModal from './OrderProfitEditorModal';
import { PLATFORMS } from '../add-sales/page';
import EditSaleModal from './EditSaleModal';

interface SaleItem {
  id?: string;
  name?: string;
  product?: { name?: string; primaryImage?: string };
  size?: string;
  unit?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  amount?: number;
}

interface Sale {
  id: string;
  invoice: string;
  orderTime: string;
  orderSource: string;
  saleType: string;
  platform?: string;
  method: string;
  salesman?: { name: string; email: string } | null;
  amount: number;
  status: string;
  isPaid: boolean;
  name: string;
  phone?: string;
  address?: string;
  district?: string;
  shippingCost?: number;
  additionalNotes?: string;
  consignmentId?: string;
  trackingCode?: string;
  trackingLink?: string;
  cartItems?: SaleItem[];
  orderItems?: SaleItem[];
  orderItemCosts?: any[];
}

type SortField = 'orderTime' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED', 'RETURNED'] as const;
const PAYMENT_OPTIONS = ['ALL', 'PAID', 'DUE'] as const;

const METHOD_OPTIONS = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'cashOnDelivery', label: 'Cash on Delivery' },
  { value: 'onlinePayment', label: 'Online Payment' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bankTransfer', label: 'Bank Transfer' },
  { value: 'cardPayment', label: 'Card Payment' },
];

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SaleListClient = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);

  const [status, setStatus] = useState<'ALL' | (typeof STATUS_OPTIONS)[number]>('ALL');
  const [payment, setPayment] = useState<(typeof PAYMENT_OPTIONS)[number]>('ALL');
  const [method, setMethod] = useState<(typeof METHOD_OPTIONS)[number]['value']>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  const [showFilters, setShowFilters] = useState(false);
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');

  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
  });

  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [invoiceSaleId, setInvoiceSaleId] = useState<string | null>(null);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const [saleToDelete, setSaleToDelete] = useState<{ id: string; invoice: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  const [sortField, setSortField] = useState<SortField>('orderTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [sendingSaleId, setSendingSaleId] = useState<string | null>(null);
  const [sendToSteadfast] = useSendOrderToSteadfastMutation();

  const [profitEditorSale, setProfitEditorSale] = useState<Sale | null>(null);
  const [isProfitEditorVisible, setIsProfitEditorVisible] = useState(false);

  const [backfillCosts, { isLoading: isBackfilling }] = useBackfillHistoricalCostsMutation();
  const [overrideProfit] = useOverrideOrderProfitMutation();

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();

    const toLocalDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (preset === 'TODAY') {
      const todayStr = toLocalDateString(now);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      setDateFrom(toLocalDateString(yest));
      setDateTo(toLocalDateString(yest));
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setDateFrom(toLocalDateString(past));
      setDateTo(toLocalDateString(now));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(toLocalDateString(firstDay));
      setDateTo(toLocalDateString(now));
    } else if (preset === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(toLocalDateString(firstDayLastMonth));
      setDateTo(toLocalDateString(lastDayLastMonth));
    } else if (preset === 'LAST_3_MONTHS') {
      const past = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      setDateFrom(toLocalDateString(past));
      setDateTo(toLocalDateString(now));
    } else if (preset === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      setDateFrom(toLocalDateString(firstDay));
      setDateTo(toLocalDateString(now));
    } else {
      setDateFrom('');
      setDateTo('');
    }

    setPage(1);
  };

  const queryArgs = useMemo(() => {
    const args: any = {
      searchTerm: debouncedSearch?.trim() || undefined,
      page,
      limit,
    };
    if (status !== 'ALL') args.status = status;
    if (payment !== 'ALL') args.payment = payment;
    if (method !== 'ALL') args.method = method;
    if (dateFrom) args.dateFrom = dateFrom;
    if (dateTo) args.dateTo = dateTo;
    return args;
  }, [debouncedSearch, page, limit, status, payment, method, dateFrom, dateTo]);

  const { data, isLoading, isFetching, refetch } = useGetAllSalesQuery(queryArgs);
  const [updateSale] = useUpdateSalesMutation();

  const { data: invoiceData } = useGetSaleByIdQuery(invoiceSaleId || '', {
    skip: !invoiceSaleId,
  });

  useEffect(() => {
    if (invoiceData && isInvoiceVisible) {
      setLoadingInvoiceId(null);
    }
  }, [invoiceData, isInvoiceVisible]);

  const handleBackfill = async () => {
    try {
      let payload: { orderIds?: string[] } | undefined = undefined;

      if (selectedSaleIds.length > 0) {
        // 1. Sync manually selected rows
        payload = { orderIds: selectedSaleIds };
      } else if (sortedSales.length > 0) {
        // 2. Sync all sales currently visible in the filtered results
        payload = { orderIds: sortedSales.map((s) => s.id) };
      }

      const res = await backfillCosts(payload).unwrap();
      toast.success(res?.message || 'Profits synced successfully!');
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to sync profits');
    }
  };

  const handleQuickEditProfit = async (saleId: string, currentProfit: number) => {
    const newProfitStr = prompt('Enter correct net profit amount (৳):', String(currentProfit));
    if (newProfitStr === null) return;

    const profit = Number(newProfitStr);
    if (isNaN(profit)) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      await overrideProfit({ orderId: saleId, profit }).unwrap();
      toast.success('Profit updated successfully!', { duration: 1000 });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update profit');
    }
  };

  const handleOpenInvoice = (saleId: string) => {
    setLoadingInvoiceId(saleId);
    setInvoiceSaleId(null);
    setIsInvoiceVisible(false);

    setTimeout(() => {
      setInvoiceSaleId(saleId);
      setIsInvoiceVisible(true);
    }, 50);
  };

  const handleManualRefresh = () => {
    refetch();
    toast.success('Sales data refreshed successfully!', { duration: 1000 });
  };

  const allSales: Sale[] = useMemo(() => (data as any)?.data || [], [data]);
  const meta = (data as any)?.meta;

  const summaryMetrics = useMemo(() => {
    return (data as any)?.summary || {
      totalCount: meta?.total || 0,
      totalValidCount: 0,
      totalCodAmount: 0,
      totalBillAmount: 0,
      totalRcvAmount: 0,
      paidCount: 0,
      dueCount: 0,
    };
  }, [data, meta]);

  const sortedSales = useMemo(() => {
    const sorted = [...allSales];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'orderTime') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (sortField === 'amount') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === 'status') {
        valA = String(valA || '');
        valB = String(valB || '');
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allSales, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-gray-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" /> : <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" />;
  };

  const filteredNetProfit = useMemo(() => {
    if (!isSuperAdmin) return 0;
    return sortedSales.reduce((sum, sale) => {
      const orderItemCosts = sale.orderItemCosts || [];
      const orderProfit = orderItemCosts.reduce((itemSum: number, ic: any) => itemSum + Number(ic.profit || 0), 0);
      return sum + orderProfit;
    }, 0);
  }, [sortedSales, isSuperAdmin]);

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await updateSale({ id, status: nextStatus }).unwrap();
      if (res?.success) toast.success(`Sale marked as ${nextStatus}`);
      else toast.error('Failed to update sale status');
    } catch (e) {
      toast.error('Error updating sale status');
    }
  };

  const handleDeleteSaleConfirm = async () => {
    if (!saleToDelete) return;
    try {
      const res = await fetch(`/api/sales/${saleToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.success) {
        toast.success(`Sale #${saleToDelete.invoice} deleted successfully`);
        refetch();
      } else {
        toast.error(json?.message || 'Failed to delete sale');
      }
    } catch (e) {
      toast.error('Error deleting sale');
    } finally {
      setSaleToDelete(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      let successCount = 0;
      for (const id of selectedSaleIds) {
        try {
          const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json?.success) successCount++;
        } catch (err) {
          // continue
        }
      }
      toast.success(`Successfully deleted ${successCount} sale(s)`);
      setSelectedSaleIds([]);
      refetch();
    } catch (e) {
      toast.error('Error performing bulk deletion');
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleSendToSteadfast = async (saleId: string, invoice: string) => {
    try {
      setSendingSaleId(saleId);
      const res = await sendToSteadfast(saleId).unwrap();
      if (res?.success) {
        toast.success(`Sale #${invoice} successfully submitted to Steadfast!`);
        refetch();
      } else {
        toast.error('Failed to send order to Steadfast');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error submitting order to Steadfast');
    } finally {
      setSendingSaleId(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedSaleIds.length === sortedSales.length) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(sortedSales.map((s) => s.id));
    }
  };

  const toggleSelectSale = (id: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => window.print();

  const statusBadgeClass = (s: string) => {
    return s === "COMPLETED"
      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold"
      : s === "CANCELED"
        ? "bg-black hover:bg-gray-700 text-white shadow-sm font-bold"
        : s === "DELIVERED"
          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold"
          : s === "SHIPPED"
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold"
            : s === "RETURNED"
              ? "bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold"
              : s === "PROCESSING"
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold";
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (debouncedSearch?.trim()) {
      chips.push({
        key: 'search',
        label: `Search: ${debouncedSearch.trim()}`,
        onRemove: () => { setSearchTerm(''); setPage(1); },
      });
    }
    if (status !== 'ALL') {
      chips.push({
        key: 'status',
        label: `Status: ${status}`,
        onRemove: () => { setStatus('ALL'); setPage(1); },
      });
    }
    if (payment !== 'ALL') {
      chips.push({
        key: 'payment',
        label: `Payment: ${payment}`,
        onRemove: () => { setPayment('ALL'); setPage(1); },
      });
    }
    if (method !== 'ALL') {
      const lbl = METHOD_OPTIONS.find((x) => x.value === method)?.label || method;
      chips.push({
        key: 'method',
        label: `Method: ${lbl}`,
        onRemove: () => { setMethod('ALL'); setPage(1); },
      });
    }
    if (datePreset !== 'ALL') {
      chips.push({
        key: 'datePreset',
        label: `Range: ${datePreset.replace(/_/g, ' ')}`,
        onRemove: () => { handleDatePresetChange('ALL'); },
      });
    } else if (dateFrom || dateTo) {
      chips.push({
        key: 'date',
        label: `Date: ${dateFrom || '…'} → ${dateTo || '…'}`,
        onRemove: () => { setDateFrom(''); setDateTo(''); setPage(1); },
      });
    }
    return chips;
  }, [debouncedSearch, status, payment, method, datePreset, dateFrom, dateTo]);

  const clearAll = () => {
    setSearchTerm('');
    setStatus('ALL');
    setPayment('ALL');
    setMethod('ALL');
    setDatePreset('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  function generateSlug(str: string) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/40 px-2 py-2 sm:px-3 sm:py-3 space-y-2">

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-50 text-[#FB923C] rounded-lg">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 leading-tight">Sales Management</h1>
            <p className="text-[11px] text-gray-500">Monitor transactions, update statuses, and print invoices</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">

          {/* 🔒 SUPER ADMIN ONLY: Sync Old Profits Button */}
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackfill}
              disabled={isBackfilling}
              className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 h-7 text-xs px-2.5 flex items-center gap-1 shadow-xs"
              title="Calculate missing profits for old sales"
            >
              {isBackfilling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span className="hidden xs:inline">Sync Old Profits</span>
            </Button>
          )}

          {selectedSaleIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs px-2.5 flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedSaleIds.length})
            </Button>
          )}

          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-7 text-xs px-2.5 flex items-center gap-1 transition-colors',
              showFilters ? 'bg-[#1b382b] hover:bg-[#254b3a] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {activeChips.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-orange-500 text-white rounded-full text-[9px] font-bold">
                {activeChips.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-7 text-xs px-2.5 flex items-center gap-1"
            title="Refresh Data"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-600', isFetching && 'animate-spin text-[#FB923C]')} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>

          <Button variant="outline" size="sm" className="bg-white shadow-2xs border-gray-300 h-7 text-xs px-2.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1 text-gray-600" /> Print
          </Button>
        </div>
      </div>

      {/* COMPACT FILTER PANEL */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs space-y-2 transition-all">
          <div className="flex items-center justify-between border-b border-gray-100 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Filter Controls</span>
              {activeChips.length > 0 && (
                <span className="text-[10px] bg-orange-100 text-orange-800 rounded-full px-2 py-0.2 font-semibold">
                  {activeChips.length} Active
                </span>
              )}
            </div>
            {activeChips.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-6 px-2">
                Reset All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Invoice, phone, customer..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className={cn(
                    'pl-7 h-8 text-xs bg-white shadow-2xs transition-colors',
                    searchTerm.trim() ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date Range</label>
              <Select value={datePreset} onValueChange={(v) => handleDatePresetChange(v)}>
                <SelectTrigger className={cn(
                  'bg-white h-8 text-xs transition-colors py-0',
                  datePreset !== 'ALL' ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                )}>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time / Max</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                  <SelectItem value="THIS_MONTH">This Month</SelectItem>
                  <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                  <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
                  <SelectItem value="THIS_YEAR">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
                <SelectTrigger className={cn(
                  'bg-white h-8 text-xs transition-colors py-0',
                  status !== 'ALL' ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                )}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${statusBadgeClass(s)}`}>
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Platform</label>
              <Select value={platformFilter} onValueChange={(val) => {
                setPlatformFilter(val);
              }}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Filter Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Payment</label>
              <Select value={payment} onValueChange={(v) => { setPayment(v as any); setPage(1); }}>
                <SelectTrigger className={cn(
                  'bg-white h-8 text-xs transition-colors py-0',
                  payment !== 'ALL' ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                )}>
                  <SelectValue placeholder="All Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === 'PAID' ? <span className="text-emerald-700 font-bold">PAID</span> : p === 'DUE' ? <span className="text-rose-600 font-bold">DUE</span> : p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Method</label>
              <Select value={method} onValueChange={(v) => { setMethod(v as any); setPage(1); }}>
                <SelectTrigger className={cn(
                  'bg-white h-8 text-xs transition-colors py-0',
                  method !== 'ALL' ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                )}>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDatePreset('CUSTOM'); setPage(1); }}
                  className={cn(
                    'bg-white h-8 text-[11px] px-1 transition-colors',
                    dateFrom ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setDatePreset('CUSTOM'); setPage(1); }}
                  className={cn(
                    'bg-white h-8 text-[11px] px-1 transition-colors',
                    dateTo ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                  )}
                />
              </div>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-100">
              {activeChips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1 text-[11px] bg-orange-50 text-orange-800 border border-orange-200 rounded-full px-2.5 py-0.5 font-medium shadow-2xs"
                >
                  {c.label}
                  <button type="button" onClick={c.onRemove} className="hover:text-orange-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* METRICS BAR */}
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-3 gap-2",
        isSuperAdmin ? "lg:grid-cols-7" : "lg:grid-cols-6"
      )}>
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Filtered Sales</p>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">{summaryMetrics.totalValidCount} / {summaryMetrics.totalCount}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total COD</p>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">৳{summaryMetrics.totalCodAmount.toLocaleString()}</h3>
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Truck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Bill</p>
            <h3 className="text-xs sm:text-sm font-bold text-blue-600">৳{summaryMetrics.totalBillAmount.toLocaleString()}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total RCV</p>
            <h3 className="text-xs sm:text-sm font-bold text-green-700">৳{summaryMetrics.totalRcvAmount.toLocaleString()}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Paid Sales</p>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-600">{summaryMetrics.paidCount}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due / Unpaid</p>
            <h3 className="text-xs sm:text-sm font-bold text-rose-600">{summaryMetrics.dueCount}</h3>
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 🔒 Super Admin Net Profit Card (7th column) */}
        {isSuperAdmin && (
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Net Profit</p>
              <h3 className={cn("text-xs sm:text-sm font-black", filteredNetProfit >= 0 ? "text-emerald-700" : "text-rose-600")}>
                ৳{filteredNetProfit.toLocaleString()}
              </h3>
            </div>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="w-9 text-center py-2.5">
                  <button onClick={handleSelectAll} className="inline-flex items-center text-gray-500 hover:text-gray-900">
                    {selectedSaleIds.length > 0 && selectedSaleIds.length === sortedSales.length ? (
                      <CheckSquare className="w-4 h-4 text-[#FB923C]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Invoice</TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Order Source</TableHead>
                <TableHead onClick={() => toggleSort('orderTime')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Sale Time {renderSortIcon('orderTime')}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Customer & Contact</TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Ordered Products</TableHead>
                <TableHead onClick={() => toggleSort('amount')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Amount {renderSortIcon('amount')}</div>
                </TableHead>

                {/* 🔒 Super Admin Net Profit Column Header */}
                {isSuperAdmin && (
                  <TableHead className="font-bold py-2.5 text-xs text-emerald-700">Net Profit</TableHead>
                )}

                <TableHead onClick={() => toggleSort('status')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Status {renderSortIcon('status')}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Payment</TableHead>
                <TableHead className="text-right font-bold pr-3 py-2.5 text-xs w-[1%] whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isSuperAdmin ? 12 : 11} className="py-3">
                      <Skeleton className="w-full h-8 my-0.5 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 12 : 11} className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-sm">No sales records found.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSales.map((sale) => {
                  const isSelected = selectedSaleIds.includes(sale.id);
                  const isThisRowLoading = loadingInvoiceId === sale.id;
                  const saleItems = sale.orderItems || sale.cartItems || [];
                  const isShowroom = sale.orderSource === 'SHOWROOM';

                  // Profit calculation for Super Admin
                  const orderItemCosts = sale.orderItemCosts || [];
                  const totalOrderProfit = orderItemCosts.reduce((sum: number, ic: any) => sum + Number(ic.profit || 0), 0);

                  return (
                    <TableRow key={sale.id} className={cn('hover:bg-gray-50/85 transition-colors', isSelected && 'bg-orange-50/40')}>
                      <TableCell className="text-center align-middle py-3">
                        <button onClick={() => toggleSelectSale(sale.id)} className="inline-flex items-center text-gray-400 hover:text-gray-900">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#FB923C]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </TableCell>

                      <TableCell className="font-bold align-middle py-3 text-xs">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSaleId(sale.id);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:underline font-bold text-left cursor-pointer"
                          >
                            #{sale.invoice}
                          </button>

                          {sale.consignmentId && (
                            <Link
                              target="_blank"
                              href={sale.trackingLink || '#'}
                              className="text-xs text-emerald-700 border border-emerald-200 px-1 rounded font-mono inline-flex items-center gap-0.5 w-fit"
                              title={sale.trackingCode}
                            >
                              {sale.consignmentId}
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-middle py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-semibold uppercase text-gray-700 border-gray-200"
                          >
                            {sale.orderSource || 'N/A'}
                          </Badge>

                          {sale.orderSource === 'MANUAL' && sale.platform && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-medium uppercase bg-orange-50 text-orange-700 border border-orange-100"
                            >
                              {sale.platform}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-600 text-xs whitespace-nowrap align-top py-3 font-medium">
                        {sale.orderTime ? (
                          <>
                            <div className="font-semibold text-gray-900">
                              {new Date(sale.orderTime).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(sale.orderTime).toLocaleTimeString("en-GB", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>

                      <TableCell className="text-gray-900 align-middle py-3 max-w-[170px]">
                        <div className="font-bold text-[13px] truncate text-gray-900" title={sale.name}>
                          {sale.name || 'Walk-in Customer'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-700 font-semibold truncate">
                            {sale.phone || 'No phone'}
                          </span>
                          {sale.phone && (
                            <a
                              href={`tel:${sale.phone}`}
                              className="inline-flex items-center justify-center p-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex-shrink-0"
                              title="Call Customer"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-3 max-w-[260px]">
                        {saleItems.length > 0 ? (
                          <div className="space-y-1">
                            {saleItems.map((item: any, idx: number) => {
                              const productName = item.name || item.product?.name || "Product";
                              const itemSize = item.size ? `(${item.size}` : "";
                              const itemUnit = item.unit ? `${item.unit})` : "";
                              const itemQty = item.quantity ?? item.qty ?? 1;
                              const itemPrice = item.price || item.amount || 0;
                              const slug = generateSlug(productName);

                              const saleStatus = String(sale.status || "").toUpperCase();
                              const isCanceledOrReturned = saleStatus === "CANCELED" || saleStatus === "RETURNED";

                              return (
                                <div key={idx} className={cn("text-[11px] bg-gray-50 border border-gray-200/80 rounded px-1.5 py-1 flex items-center justify-between gap-1 shadow-2xs", isCanceledOrReturned && "line-through opacity-70 text-gray-400")}>
                                  <div className="truncate font-semibold flex items-center gap-1 min-w-0">
                                    <span className="text-blue-600 font-bold shrink-0">{itemQty}x</span>
                                    <span className="truncate" title={`${productName} ${itemSize} ${itemUnit}`}>
                                      {productName} <span className="text-[10px]">{itemSize}</span> <span className="text-[10px]">{itemUnit}</span>
                                    </span>
                                    {slug && !isCanceledOrReturned && (
                                      <Link
                                        href={`https://khushbuwaala.com/products/${slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 shrink-0 inline-flex items-center"
                                        title="View Product Details"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </Link>
                                    )}
                                  </div>
                                  {itemPrice > 0 && (
                                    <div className="font-bold whitespace-nowrap text-[11px]">
                                      {itemPrice * itemQty}৳
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No items listed</span>
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-gray-900 tabular-nums align-middle py-3">
                        <div>৳{Number(sale.amount || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 capitalize font-medium">
                          {sale.method ? sale.method.replace(/([A-Z])/g, ' $1').toLowerCase() : 'Cash'}
                        </div>
                      </TableCell>

                      {isSuperAdmin && (
                        <TableCell className="align-middle py-3 whitespace-nowrap text-xs">
                          <div
                            onClick={() => {
                              setProfitEditorSale(sale);
                              setIsProfitEditorVisible(true);
                            }}
                            className={cn(
                              'p-1.5 rounded-md border inline-flex items-center gap-1.5 cursor-pointer hover:shadow-xs transition-all',
                              orderItemCosts.length > 0
                                ? totalOrderProfit >= 0
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            )}
                            title="Click to view full financial calculation and edit fields"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="font-black text-xs">
                              {orderItemCosts.length > 0 ? `৳${totalOrderProfit.toLocaleString()}` : 'Sync / Edit'}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="align-middle py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={`${statusBadgeClass(sale.status)} cursor-pointer transition-transform active:scale-95 text-[10px] px-2 py-0.5`}>
                              {sale.status}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {STATUS_OPTIONS.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleUpdateStatus(sale.id, s)}
                                className="text-xs font-medium cursor-pointer py-1"
                              >
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white mr-1.5 ${statusBadgeClass(s)}`}>
                                  {s}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      <TableCell className="align-middle py-3">
                        <Badge
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                            sale.isPaid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          )}
                        >
                          {sale.isPaid ? 'PAID' : 'DUE'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-3 align-middle py-3 whitespace-nowrap">
                        <div className="inline-flex justify-end items-center gap-1">
                          {/* Steadfast Courier Integration — ONLY shown for non-showroom / platform orders */}
                          {!isShowroom && !sale.consignmentId ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:bg-green-50"
                              disabled={sendingSaleId === sale.id}
                              onClick={() => handleSendToSteadfast(sale.id, sale.invoice)}
                              title="Send to Steadfast Courier"
                            >
                              {sendingSaleId === sale.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            disabled={isThisRowLoading}
                            onClick={() => handleOpenInvoice(sale.id)}
                            title="Download Invoice PDF"
                          >
                            {isThisRowLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => { setSelectedSaleId(sale.id); setIsModalVisible(true); }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            onClick={() => setSaleToDelete({ id: sale.id, invoice: sale.invoice })}
                            title="Delete Sale"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* PAGINATION FOOTER */}
        {meta && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-3 py-2.5 bg-gray-50/50 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600 font-semibold">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPage || 1}</span> (Total <span className="font-bold text-gray-900">{meta.total}</span> sales)
              </p>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 font-semibold">Rows:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[60px] bg-white text-xs font-semibold">
                    <SelectValue placeholder={limit.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (meta.totalPage || 1)}
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alerts */}
      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => { if (!open) setSaleToDelete(null); }}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete sale <span className="font-semibold text-gray-900">#{saleToDelete?.invoice}</span> and unlink associated cart items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteSaleConfirm(); }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSaleIds.length} Selected Sales?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-gray-900">{selectedSaleIds.length} sales</span> at once. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleBulkDeleteConfirm(); }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <SaleDetailsModal
        saleId={selectedSaleId || ''}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />

      <EditSaleModal
        saleId={editingSaleId}
        visible={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSaleId(null);
        }}
        onSuccess={() => refetch()}
      />

      {profitEditorSale && (
        <OrderProfitEditorModal
          sale={profitEditorSale}
          visible={isProfitEditorVisible}
          onClose={() => {
            setIsProfitEditorVisible(false);
            setProfitEditorSale(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {invoiceData?.data && (
        <SalesInvoice
          sale={invoiceData.data}
          visible={isInvoiceVisible}
          onClose={() => {
            setIsInvoiceVisible(false);
            setInvoiceSaleId(null);
            setLoadingInvoiceId(null);
          }}
        />
      )}
    </div>
  );
};

export default SaleListClient;