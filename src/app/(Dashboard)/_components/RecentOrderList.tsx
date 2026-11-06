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
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download,
    MapPin,
    FileText,
    RefreshCw,
    ArrowUpRight,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
    useGetAllOrdersQuery,
    useGetOrderByIdQuery,
} from "@/redux/store/api/order/ordersApi";
import OrderInvoice from "../orders/_components/OrderInvoice";

type SortField = "orderTime" | "amount" | "status" | "invoice";
type SortOrder = "asc" | "desc";

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

const METHOD_OPTIONS = [
    { value: "ALL", label: "All Methods" },
    { value: "cash", label: "Cash" },
    { value: "bkashPayment", label: "Bkash Payment" },
    { value: "bkashPersonal", label: "Bkash Personal" },
    { value: "nagadPayment", label: "Nagad Payment" },
    { value: "nagadPersonal", label: "Nagad Personal" },
    { value: "rocketPayment", label: "Rocket Payment" },
    { value: "rocketPersonal", label: "Rocket Personal" },
    { value: "bankTransfer", label: "Bank Transfer" },
    { value: "cardPayment", label: "Card Payment" },
    { value: "cashOnDelivery", label: "Cash On Delivery" },
    { value: "onlinePayment", label: "Online Payment" },
] as const;

function useDebouncedValue<T>(value: T, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}

const statusBadgeClass = (s: string) => {
    return s === "COMPLETED"
        ? "bg-green-600 text-white shadow-sm font-bold text-xs"
        : s === "CANCELED"
            ? "bg-black text-white shadow-sm font-bold text-xs"
            : s === "DELIVERED"
                ? "bg-blue-600 text-white shadow-sm font-bold text-xs"
                : s === "SHIPPED"
                    ? "bg-indigo-600 text-white shadow-sm font-bold text-xs"
                    : s === "RETURNED"
                        ? "bg-red-600 text-white shadow-sm font-bold text-xs"
                        : s === "PROCESSING"
                            ? "bg-amber-500 text-white shadow-sm font-bold text-xs"
                            : "bg-orange-500 text-white shadow-sm font-bold text-xs";
};

const methodLabel = (m: string) => {
    const found = METHOD_OPTIONS.find((x) => x.value === m);
    return found?.label || m || "Unknown";
};

function generateSlug(str: string) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function RecentOrderList() {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 350);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState<number>(10);

    const [sortField, setSortField] = useState<SortField>("orderTime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const queryArgs = useMemo(() => {
        return {
            searchTerm: debouncedSearch?.trim() || undefined,
            page,
            limit,
        } as any;
    }, [debouncedSearch, page, limit]);

    const { data, isLoading, isFetching, refetch } = useGetAllOrdersQuery(queryArgs);

    const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
    const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

    const { data: invoiceData } = useGetOrderByIdQuery(invoiceOrderId || "", { skip: !invoiceOrderId });
    const invoiceOrder: Order | undefined = invoiceData?.data;

    const ordersRaw = useMemo(() => (data as any)?.data?.data || [], [data]);
    const meta = (data as any)?.data?.meta;

    const orders = useMemo(() => {
        const list = [...ordersRaw];

        list.sort((a: any, b: any) => {
            let valA: any = a?.[sortField];
            let valB: any = b?.[sortField];

            if (sortField === "orderTime") {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (sortField === "amount") {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else if (sortField === "status" || sortField === "invoice") {
                valA = String(valA || "");
                valB = String(valB || "");
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [ordersRaw, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (field === sortField) setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
        else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-gray-400" />;
        return sortOrder === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" />
        ) : (
            <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-[#FB923C]" />
        );
    };

    const handleViewInvoice = (orderId: string) => {
        setInvoiceOrderId(orderId);
        setIsInvoiceVisible(true);
    };

    const handleManualRefresh = () => {
        refetch();
        toast.success("Orders refreshed successfully!", { duration: 1000 });
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden p-4 sm:p-5 space-y-3">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">Recent Orders</h2>
                    <p className="text-xs text-gray-500">Overview of latest store activities and fulfillment status (Read-Only).</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[260px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                            placeholder="Search invoice, name, phone..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className={cn(
                                "pl-8 h-8 text-xs bg-white transition-colors",
                                searchTerm.trim() ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
                            )}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualRefresh}
                        disabled={isFetching}
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-8 text-xs px-2.5 flex items-center gap-1 shadow-2xs"
                        title="Refresh Orders"
                    >
                        <RefreshCw className={cn("w-3 h-3 text-gray-600", isFetching && "animate-spin text-[#FB923C]")} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
                <Table>
                    <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
                        <TableRow>
                            <TableHead className="w-10 text-center py-2.5 text-xs font-bold">Sr.</TableHead>

                            <TableHead
                                onClick={() => toggleSort("invoice")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">Invoice {renderSortIcon("invoice")}</div>
                            </TableHead>

                            <TableHead
                                onClick={() => toggleSort("orderTime")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">Order Time {renderSortIcon("orderTime")}</div>
                            </TableHead>

                            <TableHead className="font-bold py-2.5 text-xs">Customer & Contact</TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Shipping Address</TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Ordered Products</TableHead>

                            <TableHead
                                onClick={() => toggleSort("amount")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">COD {renderSortIcon("amount")}</div>
                            </TableHead>

                            <TableHead className="font-bold py-2.5 text-xs">Bill / Cash</TableHead>

                            <TableHead
                                onClick={() => toggleSort("status")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">Status {renderSortIcon("status")}</div>
                            </TableHead>

                            <TableHead className="font-bold py-2.5 text-xs">Payment</TableHead>
                            <TableHead className="text-right font-bold pr-4 py-2.5 text-xs">Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 text-xs">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={11} className="py-3">
                                        <Skeleton className="w-full h-7 my-1 rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-10 text-gray-500">
                                    <p className="font-medium text-sm">No orders found.</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order: any, idx: number) => {
                                const orderItems = order.items || order.orderItems || order.cartItems || [];

                                const shipping = Number(order.shippingCost || 0);
                                const itemsSubtotal = orderItems.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || it.qty || 1)), 0);
                                const productBill = itemsSubtotal > 0 ? itemsSubtotal : Math.max(0, Number(order.amount || 0) - shipping);

                                const districtLower = String(order.shipping?.district || "").toLowerCase();
                                const isDhaka = districtLower.includes("dhaka");
                                const courierDeliveryCharge = shipping > 0 ? shipping : (isDhaka ? 55 : 115);

                                const isShippingIncludedInCod = shipping > 0;
                                const effectiveDeliveryDeduction = isShippingIncludedInCod ? 0 : courierDeliveryCharge;

                                const isCod = String(order.method || "").toLowerCase().includes("cash") || String(order.method || "").toLowerCase().includes("cod");
                                const codCharge = isCod ? Math.round(productBill * 0.01) : 0;

                                const codOrTotalAmount = Number(order.amount || 0);
                                const orderStatus = String(order.status || "").toUpperCase();
                                const isCanceledOrReturned = orderStatus === "CANCELED" || orderStatus === "RETURNED";

                                let netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                let rcvColorClass = "text-green-700";

                                if (orderStatus === "COMPLETED") {
                                    netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                    rcvColorClass = "text-green-600";
                                } else if (orderStatus === "DELIVERED") {
                                    netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                    rcvColorClass = "text-blue-600";
                                } else if (orderStatus === "SHIPPED") {
                                    netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                    rcvColorClass = "text-indigo-600";
                                } else if (orderStatus === "PROCESSING") {
                                    netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                    rcvColorClass = "text-amber-500";
                                } else if (orderStatus === "CANCELED") {
                                    netReceivable = 0;
                                    rcvColorClass = "text-black";
                                } else if (orderStatus === "RETURNED") {
                                    netReceivable = -courierDeliveryCharge;
                                    rcvColorClass = "text-red-600";
                                } else {
                                    netReceivable = Math.max(0, productBill - effectiveDeliveryDeduction - codCharge);
                                    rcvColorClass = "text-orange-500";
                                }

                                let rcvDisplayClass = `font-black text-xs ${rcvColorClass}`;

                                return (
                                    <TableRow key={order.id} className="hover:bg-gray-50/85 transition-colors">
                                        <TableCell className="text-center py-3 font-semibold text-gray-500">
                                            {(page - 1) * limit + idx + 1}.
                                        </TableCell>

                                        {/* Invoice */}
                                        <TableCell className="font-bold align-top py-3 text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <div>
                                                    <Link href={`/orders/${order.id}`} className="text-blue-600 font-semibold hover:underline">
                                                        #{order.invoice}
                                                    </Link>
                                                </div>
                                                <div>
                                                    {order.consignmentId ? (
                                                        <Link target="_blank" href={`${order.trackingLink}`} className="text-[10px] text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono truncate max-w-30 inline-flex items-center" title={order.trackingCode}>
                                                            {order.consignmentId}
                                                            <ArrowUpRight className="w-3 h-3 inline-block ml-0.5" />
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Order Time */}
                                        <TableCell className="text-gray-600 text-[11px] whitespace-nowrap align-top py-3 font-medium">
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

                                        {/* Customer */}
                                        <TableCell className="text-gray-900 align-top py-3 max-w-[170px]">
                                            <div className="font-bold text-[13px] truncate text-gray-900" title={order?.customer?.name || order?.name || "Guest"}>
                                                {order?.customer?.name || order?.name || "Guest"}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-gray-700 font-semibold truncate">
                                                    {order?.customer?.phone || order?.shipping?.phone || "No phone"}
                                                </span>
                                                {(order?.customer?.phone || order?.shipping?.phone) && (
                                                    <a
                                                        href={`tel:${order?.customer?.phone || order?.shipping?.phone}`}
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

                                        {/* Shipping Address */}
                                        <TableCell className="align-top py-3 max-w-[210px]">
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
                                            <div className="text-[11px] text-gray-600 font-semibold mt-1">
                                                <span className="text-gray-900">{order.shipping?.district || "N/A"}</span>
                                            </div>
                                            {order.additionalNotes && (
                                                <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.2 mt-0.5 flex items-center gap-1 truncate font-medium" title={order.additionalNotes}>
                                                    <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                                                    <span className="truncate">Note: {order.additionalNotes}</span>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Ordered Products with line-through for canceled/returned */}
                                        <TableCell className="align-top py-2.5 max-w-[240px]">
                                            {orderItems.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {orderItems.map((item: any, iIdx: number) => {
                                                        const productName = item.name || item.product?.name || "Product";
                                                        const itemSize = item.size ? `(${item.size}` : "";
                                                        const itemUnit = item.unit ? `${item.unit})` : "";
                                                        const itemQty = item.quantity ?? item.qty ?? 1;
                                                        const itemPrice = item.price || item.amount || 0;
                                                        const slug = generateSlug(productName);

                                                        return (
                                                            <div key={iIdx} className={cn("text-[11px] bg-gray-50 border border-gray-200/80 rounded px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-2xs", isCanceledOrReturned && "line-through opacity-70 text-gray-400")}>
                                                                <div className="truncate font-semibold flex items-center gap-1 min-w-0">
                                                                    <span className="text-[#382efa] font-bold shrink-0">{itemQty}x</span>
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

                                        {/* COD / Method */}
                                        <TableCell className="font-bold text-gray-900 whitespace-nowrap align-top py-3 text-xs">
                                            <div>{codOrTotalAmount} BDT</div>
                                            <div className="text-[10px] text-gray-600 uppercase font-semibold mt-0.2">
                                                {methodLabel(order.method)}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                {shipping > 0 ? `(+${shipping} ship)` : "Free Shipping"}
                                            </div>
                                        </TableCell>

                                        {/* Bill / Cash Breakdown */}
                                        <TableCell className="align-top py-2.5 whitespace-nowrap text-xs">
                                            <div className="space-y-0.2 bg-gray-50/80 p-1.5 rounded border border-gray-200/70">
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

                                        {/* Status (Read-only Badge) */}
                                        <TableCell className="align-top py-3">
                                            <Badge className={`${statusBadgeClass(order.status)} px-2.5 py-1`}>
                                                {order.status || "PENDING"}
                                            </Badge>
                                        </TableCell>

                                        {/* Payment (Read-only Badge) */}
                                        <TableCell className="align-top py-3">
                                            <Badge className={`${order.isPaid ? "bg-emerald-600" : "bg-rose-600"} text-white text-[10px] px-2 py-0.5 font-bold`}>
                                                {order.isPaid ? "PAID" : "DUE"}
                                            </Badge>
                                        </TableCell>

                                        {/* Action: Invoice Download Only */}
                                        <TableCell className="text-right pr-4 align-top py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewInvoice(order.id)}
                                                className="inline-flex items-center gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 h-8 text-xs font-semibold shadow-2xs"
                                                title="Open Invoice"
                                            >
                                                <Download className="w-3.5 h-3.5 text-[#FB923C]" />
                                                <span>Invoice</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 font-semibold">
                            Showing <span className="font-bold text-gray-900">{orders.length}</span> of <span className="font-bold text-gray-900">{meta.total}</span> orders
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
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((prev) => prev - 1)}
                            className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
                        >
                            Previous
                        </Button>
                        <span className="text-xs text-gray-600 font-semibold px-1 self-center">
                            Page {page} of {meta.totalPage || 1}
                        </span>
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

            {/* Invoice Modal */}
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
}