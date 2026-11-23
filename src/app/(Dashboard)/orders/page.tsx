// File: components/OrderList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IOrderData } from "@/redux/store/api/order/ordersApi";
import { isOrderStatus, orderDisplayLines } from "@/types/order.types";
import type { Order, OrderListQuery, OrderListSummary } from "@/types/order.types";
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
  Truck,
  RefreshCw,
  ArrowUpRight,
  Filter,
  MoreVertical,
  Phone,
  Pencil,
} from "lucide-react";
import { MobileCard, MobileCardList, MobileField } from "@/components/admin/MobileCards";
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
import { useSendOrderToSteadfastMutation } from "@/redux/store/api/steadfast/steadfastApi";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useBackfillHistoricalCostsMutation } from "@/redux/store/api/finance/financeApi";
import EditOrderModal from "./_components/EditOrderModal";
import OrderProfitEditorModal from "../sales/_components/OrderProfitEditorModal";
import { useCourierReturnPrompt } from "@/components/admin/courierReturn";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import { apiErrorMessage, apiErrorStatus } from "@/lib/apiError";
import { PAYMENT_METHOD_FILTERS, isCashOnDelivery, paymentMethodLabel } from "@/lib/paymentMethods";

type SortField = "orderTime" | "amount" | "status";
type SortOrder = "asc" | "desc";

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "RETURNED"] as const;
const PAYMENT_OPTIONS = ["ALL", "PAID", "DUE"] as const;

const METHOD_OPTIONS = PAYMENT_METHOD_FILTERS;

// Money shown per order (bill, what the courier pays us, profit). One place for both layouts.
function getOrderRowMoney(order: Order) {
  const orderItems = orderDisplayLines(order);
  const shipping = Number(order.shippingCost || 0);
  const itemsSubtotal = orderItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || it.qty || 1)), 0);
  const productBill = itemsSubtotal > 0 ? itemsSubtotal : Math.max(0, Number(order.amount || 0) - shipping);

  const districtLower = String(order.shipping?.district || "").toLowerCase();
  const isDhaka = districtLower.includes("dhaka");
  const courierDeliveryCharge = shipping > 0 ? shipping : (isDhaka ? 55 : 115);
  const isShippingIncludedInCod = shipping > 0;
  const effectiveDeliveryDeduction = isShippingIncludedInCod ? 0 : courierDeliveryCharge;

  const isCod = isCashOnDelivery(order.method);
  const codCharge = isCod ? Math.round(productBill * 0.01) : 0;
  const codOrTotalAmount = Number(order.amount || 0);
  const orderStatus = String(order.status || "").toUpperCase();
  const isCanceledOrReturned = orderStatus === "CANCELED" || orderStatus === "RETURNED";

  let netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
  const rcvColorByStatus: Record<string, string> = {
    COMPLETED: "text-green-600", DELIVERED: "text-blue-600", SHIPPED: "text-indigo-600",
    PROCESSING: "text-amber-500", CANCELED: "text-black", RETURNED: "text-red-600",
  };
  if (orderStatus === "CANCELED") netReceivable = 0;
  if (orderStatus === "RETURNED") netReceivable = -courierDeliveryCharge;
  const rcvColorClass = rcvColorByStatus[orderStatus] ?? "text-orange-500";

  const orderItemCosts = order.orderItemCosts || [];
  const totalOrderProfit = orderItemCosts.reduce((sum, ic) => sum + Number(ic.profit || 0), 0);

  return {
    orderItems, shipping, productBill, courierDeliveryCharge, isShippingIncludedInCod, isCod, codCharge,
    codOrTotalAmount, isCanceledOrReturned, netReceivable, rcvColorClass, orderItemCosts, totalOrderProfit,
  };
}

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
    { page: 1, limit: 100, searchTerm: debouncedProductSearch },
    { skip: !open }
  );

  const products = data?.data || [];
  const selected = products.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between bg-white text-left font-normal truncate h-8 text-xs px-2 transition-colors",
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
            {products.map((p) => (
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
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);

  const [status, setStatus] = useState<"ALL" | (typeof STATUS_OPTIONS)[number]>("ALL");
  const [payment, setPayment] = useState<(typeof PAYMENT_OPTIONS)[number]>("ALL");
  const [method, setMethod] = useState<(typeof METHOD_OPTIONS)[number]["value"]>("ALL");
  const [activeTab, setActiveTab] = useState<"all" | "pending_online">("all");

  const [showFilters, setShowFilters] = useState(false);
  const [datePreset, setDatePreset] = useState<string>("THIS_MONTH");

  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const year = firstDay.getFullYear();
    const month = String(firstDay.getMonth() + 1).padStart(2, "0");
    const day = String(firstDay.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<{ id: string; invoice: string } | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [sortField, setSortField] = useState<SortField>("orderTime");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [productId, setProductId] = useState<string>("");
  const [productQ, setProductQ] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ✅ Profit Editor Modal State
  const [profitEditorOrder, setProfitEditorOrder] = useState<Order | null>(null);
  const [isProfitEditorVisible, setIsProfitEditorVisible] = useState(false);

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
    const args: OrderListQuery = {
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

  const { data, isLoading, isFetching, refetch } = useGetAllOrdersQuery(queryArgs);

  // ✅ Enhanced Backfill Hook (Supports manual selection & filtered list sync)
  const [backfillCosts, { isLoading: isBackfilling }] = useBackfillHistoricalCostsMutation();

  const handleBackfill = async () => {
    try {
      const payload: { orderIds?: string[] } = {};

      if (selectedOrderIds.length > 0) {
        payload.orderIds = selectedOrderIds;
      } else if (sortedOrders.length > 0) {
        payload.orderIds = sortedOrders.map((o) => o.id);
      }

      const res = await backfillCosts(payload).unwrap();
      toast.success(res?.message || "Profits synced successfully!");
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to sync profits"));
    }
  };

  const handleManualRefresh = () => {
    refetch();
    toast.success("Orders data refreshed successfully!", { duration: 1000 });
  };

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const [sendToSteadfast] = useSendOrderToSteadfastMutation();
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);

  const { data: invoiceData } = useGetOrderByIdQuery(invoiceOrderId || "", { skip: !invoiceOrderId });
  const invoiceOrder: IOrderData | undefined = invoiceData?.data;

  useEffect(() => {
    if (invoiceOrder && isInvoiceVisible) {
      setLoadingInvoiceId(null);
    }
  }, [invoiceOrder, isInvoiceVisible]);

  const handleOpenInvoice = (orderId: string) => {
    setLoadingInvoiceId(orderId);
    setInvoiceOrderId(null);
    setIsInvoiceVisible(false);

    setTimeout(() => {
      setInvoiceOrderId(orderId);
      setIsInvoiceVisible(true);
    }, 50);
  };

  const allOrders: Order[] = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta;

  const sortedOrders = useMemo(() => {
    const sorted = [...allOrders];
    sorted.sort((a, b) => {
      const key = (o: Order): number | string =>
        sortField === "orderTime" ? (o.orderTime ? new Date(o.orderTime).getTime() : 0)
          : sortField === "amount" ? Number(o.amount || 0)
            : String(o.status || "");
      const valA = key(a);
      const valB = key(b);

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allOrders, sortField, sortOrder]);

  const summaryMetrics = useMemo(() => {
    const fallback: OrderListSummary = {
      totalCount: meta?.total || 0,
      totalValidCount: 0,
      totalCodAmount: 0,
      totalBillAmount: 0,
      totalRcvAmount: 0,
      paidCount: 0,
      dueCount: 0,
    };
    return data?.summary || fallback;
  }, [data, meta]);

  // ✅ Net Profit Sum for Filtered Orders
  const filteredNetProfit = useMemo(() => {
    if (!isSuperAdmin) return 0;
    return sortedOrders.reduce((sum, order) => {
      const orderItemCosts = order.orderItemCosts || [];
      const orderProfit = orderItemCosts.reduce((itemSum, ic) => itemSum + Number(ic.profit || 0), 0);
      return sum + orderProfit;
    }, 0);
  }, [sortedOrders, isSuperAdmin]);

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

  const askReturnCharge = useCourierReturnPrompt();
  const handleUpdateStatus = async (id: string, nextStatus: string, order?: Order) => {
    const extra = await askReturnCharge(order, nextStatus);
    if (extra === null) return; // closed the question: change nothing
    try {
      setUpdatingStatusId(id);
      const res = await updateOrderStatus({ id, status: nextStatus, ...(extra || {}) }).unwrap();
      if (res?.success) toast.success(`Order marked as ${nextStatus}`);
      else toast.error("Failed to update order");
    } catch {
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
    } catch {
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
    } catch (e) {
      toast.error(apiErrorMessage(e, "Error deleting order"));
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
        } catch {
          // continue
        }
      }
      toast.success(`Successfully deleted ${successCount} order(s)`);
      setSelectedOrderIds([]);
    } catch {
      toast.error("Error performing bulk deletion");
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const confirmRebook = useConfirm();
  const handleSendToSteadfast = async (orderId: string, invoice: string, force = false): Promise<void> => {
    try {
      setSendingOrderId(orderId);
      const res = await sendToSteadfast({ orderId, force }).unwrap();
      if (res?.success) {
        toast.success(`Order #${invoice} successfully sent to Steadfast!`);
      } else {
        toast.error("Failed to send order to Steadfast");
      }
    } catch (err) {
      // Already booked: a second booking means a second parcel and a second delivery charge
      if (apiErrorStatus(err) === 409 && !force) {
        setSendingOrderId(null);
        const again = await confirmRebook({ title: `#${invoice} is already with Steadfast`, description: `${apiErrorMessage(err, '')} Booking again creates a new parcel and a new delivery charge.`, confirmText: 'Book again', danger: true });
        if (again) return handleSendToSteadfast(orderId, invoice, true);
        return;
      }
      toast.error(apiErrorMessage(err, "Error submitting order to Steadfast"));
    } finally {
      setSendingOrderId(null);
    }
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

  const methodLabel = paymentMethodLabel;

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

  function generateSlug(str: string) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

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
    <div className="w-full min-h-screen bg-gray-50/40 px-2 py-2 sm:px-3 sm:py-3 space-y-2">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 leading-tight">Order Management</h1>
            <p className="text-[11px] text-gray-500">Website orders overview</p>
          </div>
          <div className="flex items-center gap-1 border-l pl-2 sm:pl-3 border-gray-200">
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === "all"
                ? "bg-orange-50 text-[#FB923C] border border-orange-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              All Active
            </button>
            <button
              onClick={() => { setActiveTab("pending_online"); setPage(1); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${activeTab === "pending_online"
                ? "bg-orange-50 text-[#FB923C] border border-orange-200 shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Online
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">

            {/* 🔒 SUPER ADMIN ONLY: Sync Old Profits Button */}
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackfill}
                disabled={isBackfilling}
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 h-7 text-xs px-2.5 flex items-center gap-1 shadow-xs"
                title="Calculate missing profits for old orders"
              >
                {isBackfilling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span className="hidden xs:inline">
                  {selectedOrderIds.length > 0 ? `Sync Selected (${selectedOrderIds.length})` : "Sync Old Profits"}
                </span>
              </Button>
            )}

            {selectedOrderIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs px-2.5 flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedOrderIds.length})
              </Button>
            )}

            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-7 text-xs px-2.5 flex items-center gap-1 transition-colors",
                showFilters ? "bg-[#1b382b] hover:bg-[#254b3a] text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
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
              <RefreshCw className={cn("w-3.5 h-3.5 text-gray-600", isFetching && "animate-spin text-[#FB923C]")} />
              <span className="hidden xs:inline">Refresh</span>
            </Button>

            <Button variant="outline" size="sm" className="bg-white shadow-xs border-gray-300 h-7 text-xs px-2.5" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1 text-gray-600" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* COMPACT FILTER PANEL */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-xs space-y-2 transition-all">
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

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Invoice, phone..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className={cn(
                    "pl-7 h-8 text-xs bg-white shadow-xs transition-colors",
                    searchTerm.trim() ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date Range</label>
              <Select value={datePreset} onValueChange={(v) => handleDatePresetChange(v)}>
                <SelectTrigger className={cn(
                  "bg-white h-8 text-xs transition-colors py-0",
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
                  <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
                  <SelectItem value="THIS_YEAR">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <Select value={status} onValueChange={(v) => { setStatus(isOrderStatus(v) ? v : "ALL"); setPage(1); }}>
                <SelectTrigger className={cn(
                  "bg-white h-8 text-xs transition-colors py-0",
                  status !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
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
              <Select value={payment} onValueChange={(v) => { setPayment(PAYMENT_OPTIONS.find((p) => p === v) ?? "ALL"); setPage(1); }}>
                <SelectTrigger className={cn(
                  "bg-white h-8 text-xs transition-colors py-0",
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

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Method</label>
              <Select value={method} onValueChange={(v) => { setMethod(METHOD_OPTIONS.find((o) => o.value === v)?.value ?? "ALL"); setPage(1); }}>
                <SelectTrigger className={cn(
                  "bg-white h-8 text-xs transition-colors py-0",
                  method !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                )}>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</label>
              <div className="h-8">
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

            <div className="grid grid-cols-2 gap-1">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDatePreset("CUSTOM"); setPage(1); }}
                  className={cn(
                    "bg-white h-8 text-[11px] px-1 transition-colors",
                    dateFrom ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setDatePreset("CUSTOM"); setPage(1); }}
                  className={cn(
                    "bg-white h-8 text-[11px] px-1 transition-colors",
                    dateTo ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
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
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Filtered Orders</p>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">{summaryMetrics.totalValidCount} / {summaryMetrics.totalCount}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total COD</p>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">৳{summaryMetrics.totalCodAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Truck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Bill</p>
            <h3 className="text-xs sm:text-sm font-bold text-blue-600">৳{summaryMetrics.totalBillAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total RCV</p>
            <h3 className="text-xs sm:text-sm font-bold text-green-700">৳{summaryMetrics.totalRcvAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Paid Orders</p>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-600">{summaryMetrics.paidCount}</h3>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
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
                ৳{filteredNetProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* PHONE: cards */}
        <MobileCardList
          className="bg-gray-50/60 p-2"
          isLoading={isLoading}
          isEmpty={!isLoading && sortedOrders.length === 0}
          emptyText="No orders found. Try changing the filters."
        >
          {sortedOrders.map((order) => {
            const m = getOrderRowMoney(order);
            const isSelected = selectedOrderIds.includes(order.id);
            const phone = order.customer?.phone || order.shipping?.phone;
            const items = m.orderItems;
            const when = order.orderTime ? new Date(order.orderTime) : null;
            const itemsText = items.length === 0
              ? "No items"
              : items.slice(0, 2).map((it) => `${it.quantity ?? it.qty ?? 1}× ${it.name || it.product?.name || "Product"}${it.size ? ` ${it.size}${it.unit || ""}` : ""}`).join(", ") + (items.length > 2 ? ` +${items.length - 2} more` : "");
            return (
              <MobileCard
                key={order.id}
                selected={isSelected}
                onOpen={() => { setSelectedOrderId(order.id); setIsModalVisible(true); }}
                leading={
                  <button
                    type="button"
                    aria-label={isSelected ? "Unselect order" : "Select order"}
                    onClick={() => toggleSelectOrder(order.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400"
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-[#FB923C]" /> : <Square className="h-5 w-5" />}
                  </button>
                }
                title={<span>#{order.invoice} · {order.customer?.name || order.shipping?.name || "Guest"}</span>}
                subtitle={when ? `${when.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}, ${when.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })} · ${order.shipping?.district || "No district"}` : "No date"}
                badge={
                  <Badge className={`${statusBadgeClass(order.status)} text-[10px] px-2 py-0.5`}>
                    {updatingStatusId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : order.status}
                  </Badge>
                }
                actions={
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" disabled={updatingStatusId === order.id}>
                          Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_OPTIONS.map((st) => (
                          <DropdownMenuItem key={st} onClick={() => handleUpdateStatus(order.id, st, order)} className="py-2.5 text-sm">
                            <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${statusBadgeClass(st)}`}>{st}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      disabled={updatingPaymentId === order.id}
                      onClick={() => handleUpdatePayment(order.id, !order.isPaid)}
                      className={cn("h-10 flex-1 text-xs font-bold text-white", order.isPaid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}
                    >
                      {updatingPaymentId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : order.isPaid ? "PAID" : "DUE"}
                    </Button>
                    {phone && (
                      <a href={`tel:${phone}`} aria-label="Call customer" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700">
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10" aria-label="More actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem className="py-2.5" onClick={() => { setSelectedOrderId(order.id); setIsModalVisible(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5" onClick={() => { setEditingOrderId(order.id); setIsEditModalOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit order
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5" disabled={loadingInvoiceId === order.id} onClick={() => handleOpenInvoice(order.id)}>
                          <Download className="mr-2 h-4 w-4" /> Invoice PDF
                        </DropdownMenuItem>
                        {!order.consignmentId && (
                          <DropdownMenuItem className="py-2.5" disabled={sendingOrderId === order.id} onClick={() => handleSendToSteadfast(order.id, order.invoice)}>
                            <Truck className="mr-2 h-4 w-4" /> Send to Steadfast
                          </DropdownMenuItem>
                        )}
                        {isSuperAdmin && (
                          <DropdownMenuItem className="py-2.5" onClick={() => { setProfitEditorOrder(order); setIsProfitEditorVisible(true); }}>
                            <TrendingUp className="mr-2 h-4 w-4" /> Profit details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="py-2.5 text-rose-600" onClick={() => setOrderToDelete({ id: order.id, invoice: order.invoice })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              >
                <MobileField label="Items" full>
                  <span className={cn(m.isCanceledOrReturned && "line-through text-gray-400")}>{itemsText}</span>
                </MobileField>
                <MobileField label="Total (COD)">৳{m.codOrTotalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} · {methodLabel(order.method)}</MobileField>
                <MobileField label="You receive"><span className={cn("font-bold", m.rcvColorClass)}>৳{m.netReceivable.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span></MobileField>
                {isSuperAdmin && (
                  <MobileField label="Net profit">
                    <span className={cn("font-bold", m.totalOrderProfit >= 0 ? "text-emerald-700" : "text-rose-600")}>
                      {m.orderItemCosts.length ? `৳${m.totalOrderProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : "—"}
                    </span>
                  </MobileField>
                )}
                {order.consignmentId && <MobileField label="Courier">#{order.consignmentId}</MobileField>}
                {order.shipping?.address && <MobileField label="Address" full>{order.shipping.address}</MobileField>}
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
                  <div className="flex items-center">COD {renderSortIcon("amount")}</div>
                </TableHead>

                <TableHead className="font-bold py-2.5 text-xs">Bill / Cash</TableHead>

                {/* 🔒 Super Admin Net Profit Column Header */}
                {isSuperAdmin && (
                  <TableHead className="font-bold py-2.5 text-xs text-emerald-700">Net Profit</TableHead>
                )}

                <TableHead onClick={() => toggleSort("status")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                  <div className="flex items-center">Status {renderSortIcon("status")}</div>
                </TableHead>
                <TableHead className="font-bold py-2.5 text-xs">Payment</TableHead>
                <TableHead className="text-right font-bold pr-3 py-2.5 text-xs w-[1%] whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isSuperAdmin ? 12 : 11} className="py-3">
                      <Skeleton className="w-full h-6 my-0.5 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 12 : 11} className="text-center py-10 text-gray-500">
                    <p className="font-semibold text-sm">No orders found.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const isThisRowLoading = loadingInvoiceId === order.id;
                  const {
                    orderItems, shipping, productBill, courierDeliveryCharge, isShippingIncludedInCod, isCod, codCharge,
                    codOrTotalAmount, isCanceledOrReturned, netReceivable, rcvColorClass, orderItemCosts, totalOrderProfit,
                  } = getOrderRowMoney(order);
                  const rcvDisplayClass = `font-black text-xs ${rcvColorClass}`;

                  return (
                    <TableRow key={order.id} className={`hover:bg-gray-50/85 transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}>
                      <TableCell className="text-center align-top py-3">
                        <button onClick={() => toggleSelectOrder(order.id)} className="inline-flex items-center text-gray-400 hover:text-gray-900">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#FB923C]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </TableCell>

                      <TableCell className="font-bold align-top py-3 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrderId(order.id);
                                setIsEditModalOpen(true);
                              }}
                              className="text-blue-600 hover:underline font-bold text-left cursor-pointer"
                            >
                              #{order.invoice}
                            </button>
                          </div>
                          <div>
                            {order.consignmentId ? (
                              // no tracking link saved: show the number without a broken "null" link
                              order.trackingLink ? (
                                <Link target="_blank" href={order.trackingLink} className="text-xs text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono truncate max-w-30" title={order.trackingCode ?? undefined}>
                                  {order.consignmentId}
                                  <ArrowUpRight className="w-3 h-3 inline-block ml-0.5" />
                                </Link>
                              ) : (
                                <span className="text-xs text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono" title={order.trackingCode ?? undefined}>{order.consignmentId}</span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-600 text-xs whitespace-nowrap align-top py-3 font-medium">
                        {order.orderTime ? (
                          <>
                            <div className="font-semibold text-gray-900">
                              {new Date(order.orderTime).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(order.orderTime).toLocaleTimeString("en-GB", {
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

                      <TableCell className="text-gray-900 align-top py-3 max-w-[170px]">
                        <div className="font-bold text-[13px] truncate text-gray-900" title={order.customer?.name || order.shipping?.name || "Guest"}>
                          {order.customer?.name || order.shipping?.name || "Guest"}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-700 font-semibold truncate">
                            {order.customer?.phone || order.shipping?.phone || "No phone"}
                          </span>
                          {(order.customer?.phone || order.shipping?.phone) && (
                            <a
                              href={`tel:${order.customer?.phone || order.shipping?.phone}`}
                              className="inline-flex items-center justify-center p-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex-shrink-0"
                              title="Call Customer"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>
                          )}
                        </div>

                        {order.customer?.email && !order.customer.email.toLowerCase().includes("guest") && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5" title={order.customer.email}>{order.customer.email}</div>
                        )}
                      </TableCell>

                      <TableCell className="align-top py-3 max-w-[230px]">
                        <div className="flex items-start justify-between gap-1">
                          <span className="block max-w-[170px] line-clamp-2 overflow-hidden text-ellipsis whitespace-normal break-words text-xs font-medium text-gray-900" title={order.shipping?.address || "No address provided"}>
                            {order.shipping?.address || "No address"}
                          </span>
                          {order.shipping?.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shipping.address}, ${order.shipping.district || ""}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0 mt-0.5"
                              title="Search Address on Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-600 font-semibold mt-1 flex items-center gap-1">
                          <span className="text-gray-900">{order.shipping?.district || "N/A"}</span>
                        </div>

                        {order.additionalNotes && (
                          <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.2 mt-0.5 flex items-center gap-1 truncate font-medium" title={order.additionalNotes}>
                            <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">Note: {order.additionalNotes}</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="align-top py-3 max-w-[260px]">
                        {orderItems.length > 0 ? (
                          <div className="space-y-1">
                            {orderItems.map((item, idx: number) => {
                              const productName = item.name || item.product?.name || "Product";
                              const itemSize = item.size ? `(${item.size}` : "";
                              const itemUnit = item.unit ? `${item.unit})` : "";
                              const itemQty = item.quantity ?? item.qty ?? 1;
                              const itemPrice = item.price || item.amount || 0;
                              const slug = generateSlug(productName);

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

                      <TableCell className="font-bold text-gray-900 whitespace-nowrap align-top py-3 text-xs">
                        <div>{codOrTotalAmount} BDT</div>
                        <div className="text-[10px] text-gray-600 uppercase font-semibold mt-0.5">
                          {methodLabel(order.method)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {shipping > 0 ? null : "Free Shipping"}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-3 whitespace-nowrap text-xs">
                        <div className="space-y-0.5 bg-gray-50/80 p-2 rounded-lg border border-gray-200/70">
                          <div className="flex items-center justify-between gap-1">
                            <div className={cn("font-bold text-[11px]", isCanceledOrReturned ? "line-through text-gray-400" : "text-gray-900")}>
                              Bill: ৳{productBill}
                            </div>
                            <div className={`border-t border-gray-200 ${rcvDisplayClass}`}>
                              ৳{netReceivable}
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {isShippingIncludedInCod ? (
                              <span className="text-gray-500">Delivery: ৳{courierDeliveryCharge}</span>
                            ) : (
                              <span className="text-rose-600">Delivery: -৳{courierDeliveryCharge}</span>
                            )}
                          </div>
                          {isCod && codCharge > 0 && !isCanceledOrReturned && (
                            <div className="text-[10px] text-rose-600">
                              COD (1%): -৳{codCharge}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 🔒 Super Admin Net Profit Cell */}
                      {isSuperAdmin && (
                        <TableCell className="align-top py-3 whitespace-nowrap text-xs">
                          <div
                            onClick={() => {
                              setProfitEditorOrder(order);
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
                              {orderItemCosts.length > 0 ? `৳${totalOrderProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'Edit'}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="align-top py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={`${statusBadgeClass(order.status)} cursor-pointer transition-transform active:scale-95 text-[10px] px-2 py-0.5`}>
                              {updatingStatusId === order.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Saving
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
                                onClick={() => handleUpdateStatus(order.id, s, order)}
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

                      <TableCell className="align-top py-3">
                        <Badge
                          onClick={() => {
                            if (updatingPaymentId === order.id) return;
                            handleUpdatePayment(order.id, !order.isPaid);
                          }}
                          className={`${order.isPaid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"} text-white cursor-pointer transition-transform active:scale-95 text-[10px] px-2 py-0.5 font-bold`}
                        >
                          {updatingPaymentId === order.id ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                            </span>
                          ) : order.isPaid ? (
                            "PAID"
                          ) : (
                            "DUE"
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-2 align-top py-3 whitespace-nowrap">
                        <div className="inline-flex justify-end items-center gap-1">
                          {!order.consignmentId ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:bg-green-50"
                              disabled={sendingOrderId === order.id}
                              onClick={() => handleSendToSteadfast(order.id, order.invoice)}
                              title="Send to Steadfast Courier"
                            >
                              {sendingOrderId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          ) : (
                            <span className="w-7 h-7 inline-block" />
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            disabled={isThisRowLoading}
                            onClick={() => handleOpenInvoice(order.id)}
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
                            onClick={() => { setSelectedOrderId(order.id); setIsModalVisible(true); }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            onClick={() => setOrderToDelete({ id: order.id, invoice: order.invoice })}
                            title="Delete Order"
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
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPage || 1}</span> (Total <span className="font-bold text-gray-900">{meta.total}</span> orders)
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

      <EditOrderModal
        orderId={editingOrderId}
        visible={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOrderId(null);
        }}
      />

      {/* ✅ Interactive Order Profit Editor Modal */}
      {profitEditorOrder && (
        <OrderProfitEditorModal
          sale={profitEditorOrder}
          visible={isProfitEditorVisible}
          onClose={() => {
            setIsProfitEditorVisible(false);
            setProfitEditorOrder(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <OrderInvoice
        order={invoiceOrder}
        visible={isInvoiceVisible}
        onClose={() => {
          setIsInvoiceVisible(false);
          setInvoiceOrderId(null);
          setLoadingInvoiceId(null);
        }}
      />
    </div>
  );
};

export default OrderList;