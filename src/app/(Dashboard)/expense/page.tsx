'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ReceiptText,
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
} from 'lucide-react';
import { MobileCard, MobileCardList, MobileField } from '@/components/admin/MobileCards';
import {
  useDeleteExpenseMutation,
  useGetAllExpensesQuery,
  useUpdateExpenseMutation,
} from '@/redux/store/api/expense/expenseApi';
import ExpenseDetailsModal from './_components/ExpenseDetailsModal';
import EditExpenseDialog from './_components/EditExpenseDialog';
import { useGetExpenseCategoriesQuery } from '@/redux/store/api/expense/expenseApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/redux/store/hooks/useAuth';
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

interface Expense {
  id: string;
  expenseTime: string;
  expenseBy: { name: string } | string;
  method: string;
  amount: number;
  status: string;
  isPaid: boolean;
  title: string;
  category?: string | null;
}

type SortField = 'expenseTime' | 'amount' | 'status' | 'title';
type SortOrder = 'asc' | 'desc';

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'CANCELED'] as const;
const PAYMENT_OPTIONS = ['ALL', 'PAID', 'DUE'] as const;

const METHOD_OPTIONS = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'card', label: 'Card Payment' },
];

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const ExpenseListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);

  const [status, setStatus] = useState<'ALL' | (typeof STATUS_OPTIONS)[number]>('ALL');
  const [payment, setPayment] = useState<(typeof PAYMENT_OPTIONS)[number]>('ALL');
  const [method, setMethod] = useState<(typeof METHOD_OPTIONS)[number]['value']>('ALL');

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

  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  // Salesmen see their own expenses and can set status; edit/delete are admin-only (the API enforces this too)
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [category, setCategory] = useState<string>('ALL');
  const { data: categoriesRes } = useGetExpenseCategoriesQuery();
  const categoryOptions = categoriesRes?.data ?? [];
  const categoryLabel = (v?: string | null) => (v ? categoryOptions.find((c) => c.value === v)?.label ?? v : 'Uncategorized');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('expenseTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
    if (payment !== 'ALL') args.isPaid = payment === 'PAID';
    if (method !== 'ALL') args.method = method;
    if (category !== 'ALL') args.category = category;
    if (dateFrom) args.dateFrom = dateFrom;
    if (dateTo) args.dateTo = dateTo;
    return args;
  }, [debouncedSearch, page, limit, status, payment, method, category, dateFrom, dateTo]);

  const { data, isLoading, isFetching, refetch } = useGetAllExpensesQuery(queryArgs);
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const handleManualRefresh = () => {
    refetch();
    toast.success('Expense data refreshed successfully!', { duration: 1000 });
  };

  const allExpenses: Expense[] = useMemo(() => data?.data?.data || [], [data]);
  const meta = data?.data?.meta;

  const summaryMetrics = useMemo(() => {
    const totalCount = meta?.total || allExpenses.length;
    const totalAmount = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const paidCount = allExpenses.filter((e) => e.isPaid).length;
    const dueCount = allExpenses.filter((e) => !e.isPaid).length;
    const paidAmount = allExpenses.filter((e) => e.isPaid).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const dueAmount = allExpenses.filter((e) => !e.isPaid).reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      totalCount,
      totalAmount,
      paidCount,
      dueCount,
      paidAmount,
      dueAmount,
    };
  }, [allExpenses, meta]);

  const sortedExpenses = useMemo(() => {
    const sorted = [...allExpenses];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'expenseTime') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (sortField === 'amount') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === 'status' || sortField === 'title') {
        valA = String(valA || '');
        valB = String(valB || '');
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allExpenses, sortField, sortOrder]);

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

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await updateExpense({ id, status: nextStatus }).unwrap();
      if (res?.success) toast.success(`Expense marked as ${nextStatus}`);
      else toast.error('Failed to update expense status');
    } catch (e) {
      toast.error('Error updating expense status');
    }
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!expenseToDelete) return;
    try {
      const res = await deleteExpense(expenseToDelete.id).unwrap();
      toast.success(res?.message || `Expense "${expenseToDelete.title}" deleted successfully`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete expense');
    } finally {
      setExpenseToDelete(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!selectedExpenseIds.length) return;
    try {
      const results = await Promise.allSettled(
        selectedExpenseIds.map((id) => deleteExpense(id).unwrap())
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} expense(s)`);
      } else {
        toast.error('Failed to delete selected expenses');
      }
      setSelectedExpenseIds([]);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error performing bulk deletion');
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedExpenseIds.length === sortedExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(sortedExpenses.map((e) => e.id));
    }
  };

  const toggleSelectExpense = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => window.print();

  const statusBadgeClass = (s: string) => {
    return s === 'COMPLETED'
      ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold'
      : s === 'CANCELED'
        ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold'
        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold';
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

  return (
    <div className="w-full min-h-screen bg-gray-50/40 px-2 py-2 sm:px-3 sm:py-3 space-y-2">

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-50 text-[#FB923C] rounded-lg">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 leading-tight">Expense Management</h1>
            <p className="text-[11px] text-gray-500">Monitor outlays, track payment statuses, and review financial records</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          {canManage && selectedExpenseIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs px-2.5 flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedExpenseIds.length})
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Title, expense by..."
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

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Category</label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className={cn(
                  'bg-white h-8 text-xs transition-colors py-0',
                  category !== 'ALL' ? 'border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30' : 'border-gray-300 text-gray-700'
                )}>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="UNCATEGORIZED">Uncategorized</SelectItem>
                  {categoryOptions.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</p>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">{summaryMetrics.totalCount}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Outlay</p>
            <h3 className="text-xs sm:text-sm font-bold text-orange-600">৳{summaryMetrics.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Paid Amount</p>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-600">৳{summaryMetrics.paidAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due Amount</p>
            <h3 className="text-xs sm:text-sm font-bold text-rose-600">৳{summaryMetrics.dueAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Paid Count</p>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-600">{summaryMetrics.paidCount}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due Count</p>
            <h3 className="text-xs sm:text-sm font-bold text-rose-600">{summaryMetrics.dueCount}</h3>
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {/* PHONE: cards */}
        <MobileCardList
          className="bg-gray-50/60 p-2"
          isLoading={isLoading}
          isEmpty={!isLoading && sortedExpenses.length === 0}
          emptyText="No expenses found. Try changing the filters."
        >
          {sortedExpenses.map((expense) => {
            const isSelected = selectedExpenseIds.includes(expense.id);
            const by = typeof expense.expenseBy === 'object' ? expense.expenseBy?.name : expense.expenseBy;
            const when = expense.expenseTime ? new Date(expense.expenseTime) : null;
            return (
              <MobileCard
                key={expense.id}
                selected={isSelected}
                onOpen={() => { setSelectedExpenseId(expense.id); setIsModalVisible(true); }}
                leading={
                  <button
                    type="button"
                    aria-label={isSelected ? 'Unselect expense' : 'Select expense'}
                    onClick={() => toggleSelectExpense(expense.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400"
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-[#FB923C]" /> : <Square className="h-5 w-5" />}
                  </button>
                }
                title={expense.title}
                subtitle={`${categoryLabel(expense.category)} · ${when ? when.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date'}`}
                badge={<Badge className={`${statusBadgeClass(expense.status)} text-[10px] px-2 py-0.5`}>{expense.status}</Badge>}
                actions={
                  <>
                    {canManage && (
                    <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" onClick={() => setEditExpenseId(expense.id)}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 flex-1 text-xs">Status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_OPTIONS.map((st) => (
                          <DropdownMenuItem key={st} onClick={() => handleUpdateStatus(expense.id, st)} className="py-2.5 text-sm">
                            <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${statusBadgeClass(st)}`}>{st}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {canManage && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 text-rose-600"
                      aria-label="Delete expense"
                      onClick={() => setExpenseToDelete({ id: expense.id, title: expense.title })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    )}
                  </>
                }
              >
                <MobileField label="Amount">
                  <span className="font-bold">৳{Number(expense.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>{' '}
                  <span className={cn('ml-1 rounded px-1 text-[10px] font-bold text-white', expense.isPaid ? 'bg-emerald-600' : 'bg-rose-600')}>
                    {expense.isPaid ? 'PAID' : 'DUE'}
                  </span>
                </MobileField>
                <MobileField label="Method">{expense.method ? expense.method.replace(/([A-Z])/g, ' $1').toLowerCase() : 'cash'}</MobileField>
                <MobileField label="Recorded by" full>{by || '—'}</MobileField>
              </MobileCard>
            );
          })}
        </MobileCardList>

        {/* DESKTOP: table */}
        <div className="hidden md:block overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="w-9 text-center py-2.5">
                  <button onClick={handleSelectAll} className="inline-flex items-center text-gray-500 hover:text-gray-900">
                    {selectedExpenseIds.length > 0 && selectedExpenseIds.length === sortedExpenses.length ? (
                      <CheckSquare className="w-4 h-4 text-[#FB923C]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Expense ID</TableHead>
                <TableHead onClick={() => toggleSort('expenseTime')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Expense Time {renderSortIcon('expenseTime')}</div>
                </TableHead>
                <TableHead onClick={() => toggleSort('title')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Title {renderSortIcon('title')}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Expense By</TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Method</TableHead>
                <TableHead onClick={() => toggleSort('amount')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Amount {renderSortIcon('amount')}</div>
                </TableHead>
                <TableHead onClick={() => toggleSort('status')} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Status {renderSortIcon('status')}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Payment Status</TableHead>
                <TableHead className="text-right font-bold pr-3 py-2.5 text-xs w-[1%] whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10} className="py-3">
                      <Skeleton className="w-full h-8 my-0.5 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-sm">No expenses found.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedExpenses.map((expense) => {
                  const isSelected = selectedExpenseIds.includes(expense.id);
                  const expenseByName = typeof expense.expenseBy === 'object' ? expense.expenseBy?.name : expense.expenseBy;

                  return (
                    <TableRow key={expense.id} className={cn('hover:bg-gray-50/85 transition-colors', isSelected && 'bg-orange-50/40')}>
                      <TableCell className="text-center align-middle py-3">
                        <button onClick={() => toggleSelectExpense(expense.id)} className="inline-flex items-center text-gray-400 hover:text-gray-900">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#FB923C]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </TableCell>

                      <TableCell
                        className="font-bold align-middle py-3 text-xs text-gray-700 font-mono cursor-pointer hover:text-orange-600 transition-colors"
                        title="Click to copy full ID"
                        onClick={() => navigator.clipboard.writeText(expense.id)}
                      >
                        {expense.id.slice(-6)}
                      </TableCell>

                      <TableCell className="text-gray-600 text-xs whitespace-nowrap align-top py-3 font-medium">
                        {expense.expenseTime ? (
                          <>
                            <div className="font-semibold text-gray-900">
                              {new Date(expense.expenseTime).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(expense.expenseTime).toLocaleTimeString("en-GB", {
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

                      <TableCell className="font-bold text-gray-900 align-middle py-3 max-w-[200px]">
                        <div className="truncate" title={expense.title}>{expense.title}</div>
                        <div className="truncate text-[10px] font-medium text-gray-500">{categoryLabel(expense.category)}</div>
                      </TableCell>

                      <TableCell className="text-gray-700 font-medium align-middle py-3 text-xs">
                        {expenseByName || 'N/A'}
                      </TableCell>

                      <TableCell className="text-gray-600 capitalize align-middle py-3 text-xs">
                        {expense.method ? expense.method.replace(/([A-Z])/g, ' $1').toLowerCase() : 'Cash'}
                      </TableCell>

                      <TableCell className="font-bold text-orange-600 tabular-nums align-middle py-3">
                        ৳{Number(expense.amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="align-middle py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={`${statusBadgeClass(expense.status)} cursor-pointer transition-transform active:scale-95 text-[10px] px-2 py-0.5`}>
                              {expense.status}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {STATUS_OPTIONS.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleUpdateStatus(expense.id, s)}
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
                            expense.isPaid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          )}
                        >
                          {expense.isPaid ? 'PAID' : 'DUE'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-3 align-middle py-3 whitespace-nowrap">
                        <div className="inline-flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => { setSelectedExpenseId(expense.id); setIsModalVisible(true); }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {canManage && (
                          <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-700 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setEditExpenseId(expense.id)}
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            onClick={() => setExpenseToDelete({ id: expense.id, title: expense.title })}
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          </>
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

        {/* PAGINATION FOOTER */}
        {meta && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-3 py-2.5 bg-gray-50/50 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600 font-semibold">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPage || 1}</span> (Total <span className="font-bold text-gray-900">{meta.total}</span> expenses)
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
                  <SelectTrigger className="h-9 sm:h-7 w-[76px] bg-white text-xs font-semibold">
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
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => { if (!open) setExpenseToDelete(null); }}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete expense <span className="font-semibold text-gray-900">&quot;{expenseToDelete?.title}&quot;</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteExpenseConfirm(); }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedExpenseIds.length} Selected Expenses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-gray-900">{selectedExpenseIds.length} expenses</span> at once. This action is irreversible.
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

      <EditExpenseDialog
        expenseId={editExpenseId}
        open={!!editExpenseId}
        onOpenChange={(o) => { if (!o) setEditExpenseId(null); }}
      />

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        expenseId={selectedExpenseId || ''}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </div>
  );
};

export default ExpenseListPage;