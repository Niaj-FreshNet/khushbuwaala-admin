"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Printer,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  X,
  Trash2,
  AlertCircle,
  CheckSquare,
  Square,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAllProductsAdminQuery } from "@/redux/store/api/product/productApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import OrderDetailsModal from "./_components/OrderDetailsModal";
import OrderInvoice from "./_components/OrderInvoice";
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetOrderByIdQuery,
  useUpdatePaymentStatusMutation,
  useDeleteOrderMutation,
} from "@/redux/store/api/order/ordersApi";

interface OrderItem {
  id?: string;
  name?: string;
  product?: { name?: string };
  size?: string;
  unit?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  amount?: number;
}

interface Order {
  id: string;
  orderTime: string;
  invoice: string;
  customer: { name: string; phone?: string; email?: string } | null;
  shipping?: { name?: string; phone?: string; address?: string; district?: string };
  method: string;
  amount: number;
  shippingCost?: number;
  additionalNotes?: string;
  status: string;
  isPaid: boolean;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  cartItems?: OrderItem[];
}

type SortField = "orderTime" | "amount" | "status";
type SortOrder = "asc" | "desc";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "RETURNED"] as const;
const PAYMENT_OPTIONS = ["ALL", "PAID", "DUE"] as const;

const METHOD_OPTIONS = [
  { value: "ALL", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "cashOnDelivery", label: "Cash On Delivery" },
  { value: "bkashPayment", label: "Bkash Payment" },
] as const;

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ProductPicker({
  value,
  onPick,
  searchValue,
  onSearchChange,
}: {
  value: string;
  onPick: (product: { id: string; name: string } | null) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedProductSearch = useDebouncedValue(localSearch, 300);

  const { data, isLoading } = useGetAllProductsAdminQuery(
    { page: 1, limit: 100, searchTerm: debouncedProductSearch } as any,
    { skip: !open }
  );

  const products = (data as any)?.data || [];
  const selected = products.find((p: any) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between bg-white text-left font-normal truncate h-7 text-[11px] px-2 transition-colors",
            value ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
          )}
        >
          <span className="truncate">{value ? (selected?.name ?? "Selected product") : "All Products"}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 opacity-60 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products..."
            value={localSearch}
            onValueChange={(val) => {
              setLocalSearch(val);
              onSearchChange(val);
            }}
          />
          <CommandEmpty>
            {isLoading ? (
              <span className="flex items-center gap-2 p-2 text-xs text-gray-500 justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FB923C]" /> Searching...
              </span>
            ) : (
              <div className="p-2 text-center text-xs text-gray-500">No products found.</div>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-56 overflow-y-auto text-xs">
            <CommandItem
              onSelect={() => {
                onPick(null);
                setOpen(false);
              }}
              className="cursor-pointer font-medium text-gray-700"
            >
              <Check className={cn("mr-2 h-3.5 w-3.5", !value ? "opacity-100" : "opacity-0")} />
              All Products
            </CommandItem>
            {products.map((p: any) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  onPick({ id: p.id, name: p.name });
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check className={cn("mr-2 h-3.5 w-3.5", value === p.id ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{p.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const OrderList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);

  const [status, setStatus] = useState<"ALL" | (typeof STATUS_OPTIONS)[number]>("ALL");
  const [payment, setPayment] = useState<(typeof PAYMENT_OPTIONS)[number]>("ALL");
  const [method, setMethod] = useState<(typeof METHOD_OPTIONS)[number]["value"]>("ALL");
  const [activeTab, setActiveTab] = useState<"all" | "pending_online">("all");
  const [datePreset, setDatePreset] = useState<string>("ALL");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

  const [orderToDelete, setOrderToDelete] = useState<{ id: string; invoice: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [sortField, setSortField] = useState<SortField>("orderTime");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [productId, setProductId] = useState<string>("");
  const [productQ, setProductQ] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "TODAY") {
      const todayStr = formatDate(now);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === "YESTERDAY") {
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      const yestStr = formatDate(yest);
      setDateFrom(yestStr);
      setDateTo(yestStr);
    } else if (preset === "LAST_7_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(now));
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(formatDate(firstDay));
      setDateTo(formatDate(now));
    } else if (preset === "LAST_MONTH") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(formatDate(firstDayLastMonth));
      setDateTo(formatDate(lastDayLastMonth));
    } else {
      setDateFrom("");
      setDateTo("");
    }
    setPage(1);
  };

  const queryArgs = useMemo(() => {
    const args: any = {
      searchTerm: debouncedSearch?.trim() || undefined,
      page,
      limit,
      orderSource: "WEBSITE",
    };

    if (activeTab === "pending_online") {
      args.method = "online";
      args.payment = "DUE";
      args.status = "PENDING";
    } else {
      if (status !== "ALL") args.status = status;
      if (payment !== "ALL") args.payment = payment;
      if (method !== "ALL") args.method = method;
    }

    if (dateFrom) args.dateFrom = dateFrom;
    if (dateTo) args.dateTo = dateTo;
    if (productId) args.productId = productId;

    return args;
  }, [debouncedSearch, page, limit, status, payment, method, activeTab, dateFrom, dateTo, productId]);

  const { data, isLoading, isFetching } = useGetAllOrdersQuery(queryArgs);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const { data: invoiceData } = useGetOrderByIdQuery(invoiceOrderId || "", { skip: !invoiceOrderId });
  const invoiceOrder: Order | undefined = invoiceData?.data;

  const allOrders: Order[] = useMemo(() => data?.data?.data || [], [data]);
  const meta = data?.data?.meta;

  const sortedOrders = useMemo(() => {
    const sorted = [...allOrders];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "orderTime") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else if (sortField === "amount") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === "status") {
        valA = String(valA || "");
        valB = String(valB || "");
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allOrders, sortField, sortOrder]);

  const summaryMetrics = useMemo(() => {
    const totalCount = meta?.total || allOrders.length;
    const totalAmount = allOrders.reduce((acc, order) => acc + (order.amount || 0), 0);
    const paidCount = allOrders.filter((order) => order.isPaid).length;
    const dueCount = allOrders.filter((order) => !order.isPaid).length;
    return { totalCount, totalAmount, paidCount, dueCount };
  }, [allOrders, meta]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-gray-400" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" /> : <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" />;
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      setUpdatingStatusId(id);
      const res = await updateOrderStatus({ id, status: nextStatus }).unwrap();
      if (res?.success) toast.success(`Order marked as ${nextStatus}`);
      else toast.error("Failed to update order");
    } catch (e) {
      toast.error("Error updating order");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleUpdatePayment = async (id: string, isPaid: boolean) => {
    try {
      setUpdatingPaymentId(id);
      const res = await updatePaymentStatus({ id, isPaid }).unwrap();
      if (res?.success) toast.success(isPaid ? "Marked as PAID" : "Marked as DUE");
      else toast.error("Failed to update payment");
    } catch (e) {
      toast.error("Error updating payment");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      const res = await deleteOrder(orderToDelete.id).unwrap();
      if (res?.success) {
        toast.success(`Order #${orderToDelete.invoice} deleted successfully`);
      } else {
        toast.error("Failed to delete order");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Error deleting order");
    } finally {
      setOrderToDelete(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      let successCount = 0;
      for (const id of selectedOrderIds) {
        try {
          await deleteOrder(id).unwrap();
          successCount++;
        } catch (err) {
          // continue
        }
      }
      toast.success(`Successfully deleted ${successCount} order(s)`);
      setSelectedOrderIds([]);
    } catch (e) {
      toast.error("Error performing bulk deletion");
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleViewInvoice = (orderId: string) => {
    setInvoiceOrderId(null);
    setTimeout(() => {
      setInvoiceOrderId(orderId);
      setIsInvoiceVisible(true);
    }, 10);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === sortedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(sortedOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => window.print();

  const methodLabel = (m: string) => {
    const found = METHOD_OPTIONS.find((x) => x.value === m);
    return found?.label || "Unknown";
  };

  const statusBadgeClass = (s: string) => {
    return s === "COMPLETED"
      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold"
      : s === "CANCELED"
        ? "bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold"
        : s === "DELIVERED"
          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold"
          : s === "SHIPPED"
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold"
            : s === "RETURNED"
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-bold"
              : s === "PROCESSING"
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold";
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (activeTab === "pending_online") {
      chips.push({
        key: "tab",
        label: "View: Pending Online Checkouts",
        onRemove: () => setActiveTab("all"),
      });
    }
    if (debouncedSearch?.trim()) {
      chips.push({
        key: "search",
        label: `Search: ${debouncedSearch.trim()}`,
        onRemove: () => { setSearchTerm(""); setPage(1); },
      });
    }
    if (status !== "ALL") {
      chips.push({
        key: "status",
        label: `Status: ${status}`,
        onRemove: () => { setStatus("ALL"); setPage(1); },
      });
    }
    if (payment !== "ALL") {
      chips.push({
        key: "payment",
        label: `Payment: ${payment}`,
        onRemove: () => { setPayment("ALL"); setPage(1); },
      });
    }
    if (method !== "ALL") {
      const lbl = METHOD_OPTIONS.find((x) => x.value === method)?.label || method;
      chips.push({
        key: "method",
        label: `Method: ${lbl}`,
        onRemove: () => { setMethod("ALL"); setPage(1); },
      });
    }
    if (datePreset !== "ALL") {
      chips.push({
        key: "datePreset",
        label: `Range: ${datePreset.replace(/_/g, " ")}`,
        onRemove: () => { handleDatePresetChange("ALL"); },
      });
    } else if (dateFrom || dateTo) {
      chips.push({
        key: "date",
        label: `Date: ${dateFrom || "…"} → ${dateTo || "…"}`,
        onRemove: () => { setDateFrom(""); setDateTo(""); setPage(1); },
      });
    }
    if (productId) {
      chips.push({
        key: "product",
        label: `Product: ${selectedProductName || "Selected"}`,
        onRemove: () => { setProductId(""); setProductQ(""); setPage(1); },
      });
    }
    return chips;
  }, [debouncedSearch, status, payment, method, activeTab, datePreset, dateFrom, dateTo, productId, selectedProductName]);

  const clearAll = () => {
    setSearchTerm("");
    setStatus("ALL");
    setPayment("ALL");
    setMethod("ALL");
    setActiveTab("all");
    setDatePreset("ALL");
    setDateFrom("");
    setDateTo("");
    setProductId("");
    setProductQ("");
    setPage(1);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/40 px-2 pt-0.5 pb-2 sm:px-3 sm:pt-0.5 sm:pb-2 space-y-1.5 mt-0">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900 leading-tight">Order Management</h1>
            <p className="text-[11px] text-gray-500">Store orders & fulfillment</p>
          </div>
          <div className="flex items-center gap-1.5 border-l pl-3 border-gray-200">
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${activeTab === "all"
                ? "bg-orange-50 text-[#FB923C] border border-orange-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              All Active
            </button>
            <button
              onClick={() => { setActiveTab("pending_online"); setPage(1); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${activeTab === "pending_online"
                ? "bg-orange-50 text-[#FB923C] border border-orange-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              <AlertCircle className="w-3 h-3 text-amber-500" /> Pending Online
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs flex items-center gap-1 shadow-2xs"
            >
              <Trash2 className="w-3 h-3" /> Delete ({selectedOrderIds.length})
            </Button>
          )}
          {isFetching && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              <Loader2 className="w-3 h-3 animate-spin text-[#FB923C]" /> Syncing...
            </span>
          )}
          <Button variant="outline" size="sm" className="bg-white shadow-2xs border-gray-300 h-7 text-xs px-2.5" onClick={handlePrint}>
            <Printer className="w-3 h-3 mr-1 text-gray-600" /> Print
          </Button>
        </div>
      </div>

      {/* ULTRA-MINIMAL SINGLE-LINE FILTER PANEL WITH DYNAMIC ACTIVE COLORING */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Filter Controls</span>
            {activeChips.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-800 rounded-full px-2 py-0.2 font-semibold shadow-2xs">
                {activeChips.length} Active
              </span>
            )}
          </div>
          {activeChips.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] h-5 px-1.5">
              Reset All
            </Button>
          )}
        </div>

        {/* All filters in a single seamless row with dynamic active highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 items-end">
          {/* Search Input */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Invoice, phone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className={cn(
                  "pl-6 h-7 text-[11px] bg-white shadow-2xs transition-colors",
                  searchTerm.trim() ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                )}
              />
            </div>
          </div>

          {/* Date Range Preset Selector */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Date Range</label>
            <Select value={datePreset} onValueChange={(v) => handleDatePresetChange(v)}>
              <SelectTrigger className={cn(
                "bg-white h-7 text-[11px] transition-colors",
                datePreset !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
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
              </SelectContent>
            </Select>
          </div>

          {/* Status Selector */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
              <SelectTrigger className={cn(
                "bg-white h-7 text-[11px] transition-colors",
                status !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
              )}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold text-white ${statusBadgeClass(s)}`}>
                      {s}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Selector */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Payment</label>
            <Select value={payment} onValueChange={(v) => { setPayment(v as any); setPage(1); }}>
              <SelectTrigger className={cn(
                "bg-white h-7 text-[11px] transition-colors",
                payment !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
              )}>
                <SelectValue placeholder="All Payment" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p === "PAID" ? <span className="text-emerald-700 font-bold">PAID</span> : p === "DUE" ? <span className="text-rose-600 font-bold">DUE</span> : p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Method</label>
            <Select value={method} onValueChange={(v) => { setMethod(v as any); setPage(1); }}>
              <SelectTrigger className={cn(
                "bg-white h-7 text-[11px] transition-colors",
                method !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
              )}>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Picker */}
          <div className="space-y-0.5">
            <label className="text-[9px] font-semibold text-gray-500">Product</label>
            <div className="h-7">
              <ProductPicker
                value={productId}
                searchValue={productQ}
                onSearchChange={(v) => setProductQ(v)}
                onPick={(p) => {
                  setProductId(p?.id ?? "");
                  setSelectedProductName(p?.name ?? "");
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Custom Date Inputs (From / To) */}
          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-gray-500">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setDatePreset("CUSTOM"); setPage(1); }}
                className={cn(
                  "bg-white h-7 text-[10px] px-1 transition-colors",
                  dateFrom ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                )}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-gray-500">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setDatePreset("CUSTOM"); setPage(1); }}
                className={cn(
                  "bg-white h-7 text-[10px] px-1 transition-colors",
                  dateTo ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                )}
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
            {activeChips.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-800 border border-orange-200 rounded-full px-2 py-0.5 font-medium shadow-2xs"
              >
                {c.label}
                <button type="button" onClick={c.onRemove} className="hover:text-orange-900">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filtered Orders Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Filtered Orders</p>
            <h3 className="text-sm font-bold text-gray-900">{summaryMetrics.totalCount}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Total Value / COD</p>
            <h3 className="text-sm font-bold text-gray-900">{summaryMetrics.totalAmount.toLocaleString()} BDT</h3>
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Paid Orders</p>
            <h3 className="text-sm font-bold text-emerald-600">{summaryMetrics.paidCount}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Due / Unpaid</p>
            <h3 className="text-sm font-bold text-rose-600">{summaryMetrics.dueCount}</h3>
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Full-Width Responsive Table Container (Enhanced Data Density & Increased Fonts for Necessary Fields) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="w-9 text-center py-2.5">
                  <button onClick={handleSelectAll} className="inline-flex items-center text-gray-500 hover:text-gray-900">
                    {selectedOrderIds.length > 0 && selectedOrderIds.length === sortedOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-[#FB923C]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Invoice</TableHead>
                <TableHead onClick={() => toggleSort("orderTime")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Order Time {renderSortIcon("orderTime")}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Customer & Contact</TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Shipping Details</TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Ordered Products</TableHead>
                <TableHead onClick={() => toggleSort("amount")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">COD / Total {renderSortIcon("amount")}</div>
                </TableHead>
                <TableHead onClick={() => toggleSort("status")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Status {renderSortIcon("status")}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Payment</TableHead>
                <TableHead className="text-right font-bold pr-3 py-2.5 text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10} className="py-3">
                      <Skeleton className="w-full h-7 my-0.5 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-500">
                    <p className="font-semibold text-base">No orders found.</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const orderItems = order.items || order.orderItems || order.cartItems || [];

                  return (
                    <TableRow key={order.id} className={`hover:bg-gray-50/85 transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}>
                      <TableCell className="text-center py-3">
                        <button onClick={() => toggleSelectOrder(order.id)} className="inline-flex items-center text-gray-400 hover:text-gray-900">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#FB923C]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </TableCell>

                      {/* Increased font for Invoice */}
                      <TableCell className="font-bold align-top py-3 text-sm">
                        <Link target="_blank" href={`/dashboard/orders/${order.id}`} className="text-blue-600 hover:underline">
                          #{order.invoice}
                        </Link>
                      </TableCell>

                      <TableCell className="text-gray-600 text-xs whitespace-nowrap align-top py-3 font-medium">
                        {order.orderTime
                          ? new Date(order.orderTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          : "N/A"}
                      </TableCell>

                      {/* Increased font for Customer Name */}
                      <TableCell className="text-gray-900 align-top py-3 max-w-[150px]">
                        <div className="font-bold text-sm truncate text-gray-900" title={order.customer?.name || order.shipping?.name || "Guest"}>
                          {order.customer?.name || order.shipping?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-700 font-semibold mt-0.5">{order.customer?.phone || order.shipping?.phone || "No phone"}</div>
                        {order.customer?.email && (
                          <div className="text-[10px] text-gray-500 truncate" title={order.customer.email}>{order.customer.email}</div>
                        )}
                      </TableCell>

                      {/* Shipping Address */}
                      <TableCell className="align-top py-3 max-w-[210px]">
                        <div className="text-xs font-medium text-gray-900 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                          <span className="truncate" title={order.shipping?.address || "No address provided"}>
                            {order.shipping?.address || "No address"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mt-0.5">
                          District: <span className="text-gray-900">{order.shipping?.district || "N/A"}</span>
                        </div>
                        {order.additionalNotes && (
                          <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.5 mt-1 flex items-center gap-1 truncate font-medium" title={order.additionalNotes}>
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">Note: {order.additionalNotes}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Increased font for Ordered Products */}
                      <TableCell className="align-top py-2.5 max-w-[260px]">
                        {orderItems.length > 0 ? (
                          <div className="space-y-1">
                            {orderItems.map((item, idx) => {
                              const productName = item.name || item.product?.name || "Product";
                              const itemSize = item.size ? `(${item.size}` : "";
                              const itemUnit = item.unit ? `${item.unit})` : "";
                              const itemQty = item.quantity ?? item.qty ?? 1;
                              const itemPrice = item.price || item.amount || 0;

                              return (
                                <div key={idx} className="text-xs bg-gray-50 border border-gray-200/80 rounded px-2 py-1 flex items-center justify-between gap-2 shadow-2xs">
                                  <div className="truncate font-semibold text-gray-900" title={`${productName} ${itemSize} ${itemUnit}`}>
                                    <span className="text-[#FB923C] font-bold mr-1">{itemQty}x</span> {productName} <span className="text-gray-600 text-[11px]">{itemSize}</span> <span className="text-gray-600 text-[11px]">{itemUnit}</span>
                                  </div>
                                  {itemPrice > 0 && (
                                    <div className="text-gray-900 font-bold whitespace-nowrap text-xs">
                                      {itemPrice * itemQty}৳
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No items listed</span>
                        )}
                      </TableCell>

                      {/* Increased font for COD / Total Amount */}
                      <TableCell className="font-black text-gray-900 whitespace-nowrap align-top py-3 text-sm">
                        <div>{order.amount} BDT</div>
                        <div className="text-[10px] text-gray-600 uppercase font-bold mt-0.5">
                          {methodLabel(order.method)} {order.shippingCost ? `(+${order.shippingCost} ship)` : ""}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={`${statusBadgeClass(order.status)} cursor-pointer transition-transform active:scale-95 text-xs px-2.5 py-1`}>
                              {updatingStatusId === order.id ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
                                </span>
                              ) : (
                                order.status
                              )}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {STATUS_OPTIONS.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={updatingStatusId === order.id}
                                onClick={() => handleUpdateStatus(order.id, s)}
                                className="text-xs font-medium cursor-pointer py-1.5"
                              >
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white mr-2 ${statusBadgeClass(s)}`}>
                                  {s}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      <TableCell className="align-top py-2.5">
                        <Badge
                          onClick={() => {
                            if (updatingPaymentId === order.id) return;
                            handleUpdatePayment(order.id, !order.isPaid);
                          }}
                          className={`${order.isPaid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"} text-white cursor-pointer transition-transform active:scale-95 text-xs px-2.5 py-1 font-bold`}
                        >
                          {updatingPaymentId === order.id ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </span>
                          ) : order.isPaid ? (
                            "PAID"
                          ) : (
                            "DUE"
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-3 align-top py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => { setSelectedOrderId(order.id); setIsModalVisible(true); }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => handleViewInvoice(order.id)}
                            title="Download Invoice PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            onClick={() => setOrderToDelete({ id: order.id, invoice: order.invoice })}
                            title="Delete Order"
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-3 py-2.5 bg-gray-50/50 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600 font-semibold">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPage || 1}</span> (Total <span className="font-bold text-gray-900">{meta.total}</span> orders)
              </p>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 font-semibold">Rows:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[65px] bg-white text-xs font-semibold">
                    <SelectValue placeholder={limit.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
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

      {/* Delete Confirmation Alert (Single) */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setOrderToDelete(null); }}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order <span className="font-semibold text-gray-900">#{orderToDelete?.invoice}</span> and unlink associated cart items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</span> : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Alert */}
      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedOrderIds.length} Selected Orders?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-gray-900">{selectedOrderIds.length} orders</span> at once. This action is irreversible.
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
      <OrderDetailsModal orderId={selectedOrderId || ""} visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

      {invoiceData && (
        <OrderInvoice
          order={invoiceOrder}
          visible={isInvoiceVisible}
          onClose={() => {
            setIsInvoiceVisible(false);
            setInvoiceOrderId(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderList;