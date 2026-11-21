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

// APIs
import {
    useGetAllOrdersQuery,
    useGetOrderByIdQuery,
} from "@/redux/store/api/order/ordersApi";
import {
    useGetAllSalesQuery,
    useGetSaleByIdQuery,
} from "@/redux/store/api/sales/salesApi"; // Adjust path if necessary

import OrderInvoice from "../orders/_components/OrderInvoice";

type SortField = "orderTime" | "amount" | "status" | "invoice";
type SortOrder = "asc" | "desc";

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

// Deep extractors to permanently solve the "No Data" issue by checking all standard payload formats
const extractList = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
};

const extractMeta = (res: any) => {
    if (!res) return null;
    if (res.meta) return res.meta;
    if (res.data && res.data.meta) return res.data.meta;
    return null;
};


export default function RecentOrderList({ type = "website" }: { type?: "all" | "website" | "manual" }) {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 350);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState<number>(10);
    const [sortField, setSortField] = useState<SortField>("orderTime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const queryArgs = useMemo(() => ({
        searchTerm: debouncedSearch?.trim() || undefined,
        page,
        limit,
    }), [debouncedSearch, page, limit]);

    // "Orders" are website orders only; manual sales come from the sales list (otherwise
    // every manual sale appeared twice in the All view).
    const ordersArgs = useMemo(() => ({ ...queryArgs, orderSource: "WEBSITE" }), [queryArgs]);

    const fetchOrders = type === "all" || type === "website";
    const fetchSales = type === "all" || type === "manual";

    const { data: oData, isLoading: oLoading, isFetching: oFetching, refetch: oRefetch } = useGetAllOrdersQuery(ordersArgs, { skip: !fetchOrders });
    const { data: sData, isLoading: sLoading, isFetching: sFetching, refetch: sRefetch } = useGetAllSalesQuery(queryArgs, { skip: !fetchSales });

    const [invoiceId, setInvoiceId] = useState<string | null>(null);
    const [invoiceType, setInvoiceType] = useState<"ORDER" | "SALE" | null>(null);
    const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

    const { data: invOrderData } = useGetOrderByIdQuery(invoiceId || "", { skip: invoiceType !== "ORDER" || !invoiceId });
    const { data: invSaleData } = useGetSaleByIdQuery(invoiceId || "", { skip: invoiceType !== "SALE" || !invoiceId });

    const invoiceOrder = invoiceType === "ORDER" ? (invOrderData as any)?.data : (invSaleData as any)?.data;

    const ordersRaw = extractList(oData);
    const salesRaw = extractList(sData);

    const combinedMeta = useMemo(() => {
        if (type === "website") return extractMeta(oData);
        if (type === "manual") return extractMeta(sData);

        // Combine meta for "all"
        const oMeta = extractMeta(oData) || { total: 0, totalPage: 1 };
        const sMeta = extractMeta(sData) || { total: 0, totalPage: 1 };
        return {
            total: oMeta.total + sMeta.total,
            totalPage: Math.max(oMeta.totalPage, sMeta.totalPage)
        };
    }, [type, oData, sData]);

    const unifiedList = useMemo(() => {
        const list: any[] = [];
        if (fetchOrders) {
            list.push(...ordersRaw.map((o: any) => ({ ...o, _type: 'ORDER', date: o.orderTime || o.createdAt })));
        }
        if (fetchSales) {
            list.push(...salesRaw.map((s: any) => ({ ...s, _type: 'SALE', date: s.saleTime || s.orderTime || s.createdAt })));
        }

        list.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            if (sortField === "orderTime") {
                valA = a.date ? new Date(a.date).getTime() : 0;
                valB = b.date ? new Date(b.date).getTime() : 0;
            } else if (sortField === "amount") {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            } else {
                valA = String(valA || "");
                valB = String(valB || "");
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        // Never show the same order twice, then respect the limit when merging two responses
        const seen = new Set<string>();
        const unique = list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
        return type === 'all' ? unique.slice(0, limit) : unique;
    }, [ordersRaw, salesRaw, fetchOrders, fetchSales, sortField, sortOrder, type, limit]);

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

    const handleViewInvoice = (id: string, itemType: "ORDER" | "SALE") => {
        setInvoiceId(id);
        setInvoiceType(itemType);
        setIsInvoiceVisible(true);
    };

    const handleManualRefresh = () => {
        if (fetchOrders) oRefetch();
        if (fetchSales) sRefetch();
        toast.success("List refreshed successfully!", { duration: 1000 });
    };

    const isLoading = (fetchOrders && oLoading) || (fetchSales && sLoading);
    const isFetching = (fetchOrders && oFetching) || (fetchSales && sFetching);

    return (
        <div className="w-full bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden p-4 sm:p-5 space-y-3">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                        {type === 'website' ? "Recent Orders" : type === 'manual' ? "Recent Sales" : "Recent Transactions"}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {type === 'website' ? "Website Orders Only" : type === 'manual' ? "Manual Sales Only" : "Combined Orders & Sales"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-65">
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
                        title="Refresh List"
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
                            <TableHead onClick={() => toggleSort("invoice")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                                <div className="flex items-center">Invoice {renderSortIcon("invoice")}</div>
                            </TableHead>
                            <TableHead onClick={() => toggleSort("orderTime")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                                <div className="flex items-center">Date & Time {renderSortIcon("orderTime")}</div>
                            </TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Customer & Contact</TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Address / Note</TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Products</TableHead>
                            <TableHead onClick={() => toggleSort("amount")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
                                <div className="flex items-center">Total {renderSortIcon("amount")}</div>
                            </TableHead>
                            <TableHead className="font-bold py-2.5 text-xs">Bill / Cash</TableHead>
                            <TableHead onClick={() => toggleSort("status")} className="cursor-pointer select-none font-bold py-2.5 text-xs">
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
                        ) : unifiedList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-10 text-gray-500">
                                    <p className="font-medium text-sm">No transactions found.</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            unifiedList.map((order: any, idx: number) => {
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

                                if (orderStatus === "CANCELED") {
                                    netReceivable = 0;
                                    rcvColorClass = "text-black";
                                } else if (orderStatus === "RETURNED") {
                                    netReceivable = -courierDeliveryCharge;
                                    rcvColorClass = "text-red-600";
                                }

                                return (
                                    <TableRow key={order.id} className="hover:bg-gray-50/85 transition-colors">
                                        <TableCell className="text-center py-3 font-semibold text-gray-500">
                                            {(page - 1) * limit + idx + 1}.
                                        </TableCell>

                                        {/* Invoice */}
                                        <TableCell className="font-bold align-top py-3 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div>
                                                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", order._type === 'ORDER' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700")}>
                                                        {order._type}
                                                    </span>
                                                </div>
                                                <Link href={`/${order._type === 'SALE' ? 'sales' : 'orders'}/${order.id}`} className="text-blue-600 font-semibold hover:underline mt-0.5 block">
                                                    #{order.invoice}
                                                </Link>
                                            </div>
                                        </TableCell>

                                        {/* Order Time */}
                                        <TableCell className="text-gray-600 text-xs whitespace-nowrap align-top py-2.5 font-medium">
                                            {order.date ? (
                                                <>
                                                    <div className="font-semibold text-gray-900">
                                                        {new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {new Date(order.date).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })}
                                                    </div>
                                                </>
                                            ) : (
                                                "N/A"
                                            )}
                                        </TableCell>

                                        {/* Customer */}
                                        <TableCell className="text-gray-900 align-top py-3 max-w-[170px]">
                                            <div className="font-bold text-xs truncate text-gray-900" title={order?.customer?.name || order?.name || "Guest"}>
                                                {order?.customer?.name || order?.name || "Guest"}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[13px] text-gray-700 font-semibold truncate">
                                                    {order?.customer?.phone || order?.shipping?.phone || order?.phone || "No phone"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Address & Note */}
                                        <TableCell className="align-top py-3 max-w-[210px]">
                                            <span className="block max-w-[170px] line-clamp-2 text-xs font-medium text-gray-900">
                                                {order.shipping?.address || order.address || "No address"}
                                            </span>
                                            <div className="text-[11px] text-gray-600 font-semibold mt-1">
                                                {order.shipping?.district && <span className="text-gray-900">{order.shipping.district}</span>}
                                            </div>
                                            {order.additionalNotes && (
                                                <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 rounded px-1.5 py-0.5 mt-1 flex items-center gap-1 truncate font-medium">
                                                    <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                                                    <span className="truncate">Note: {order.additionalNotes}</span>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Products */}
                                        <TableCell className="align-top py-2.5 max-w-[240px]">
                                            {orderItems.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {orderItems.map((item: any, iIdx: number) => {
                                                        const productName = item.name || item.product?.name || "Product";
                                                        const itemQty = item.quantity ?? item.qty ?? 1;
                                                        const itemPrice = item.price || item.amount || 0;
                                                        return (
                                                            <div key={iIdx} className={cn("text-[11px] bg-gray-50 border border-gray-200/80 rounded px-1.5 py-0.5 flex items-center justify-between gap-1 shadow-2xs", isCanceledOrReturned && "line-through opacity-70 text-gray-400")}>
                                                                <div className="truncate font-semibold flex items-center gap-1 min-w-0">
                                                                    <span className="text-[#382efa] font-bold shrink-0">{itemQty}x</span>
                                                                    <span className="truncate">{productName}</span>
                                                                </div>
                                                                {itemPrice > 0 && <div className="font-bold whitespace-nowrap text-[11px]">{itemPrice * itemQty}৳</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-gray-400 italic">No items listed</span>
                                            )}
                                        </TableCell>

                                        {/* Amount & Method */}
                                        <TableCell className="font-bold text-gray-900 whitespace-nowrap align-top py-3 text-xs">
                                            <div>{codOrTotalAmount} BDT</div>
                                            <div className="text-[10px] text-gray-600 uppercase font-semibold mt-0.5">{methodLabel(order.method)}</div>
                                        </TableCell>

                                        {/* Bill / Cash */}
                                        <TableCell className="align-top py-2.5 whitespace-nowrap text-xs">
                                            <div className="space-y-0.5 bg-gray-50/80 p-1.5 rounded border border-gray-200/70">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className={cn("font-bold text-[11px]", isCanceledOrReturned ? "line-through text-gray-400" : "text-gray-900")}>
                                                        Bill: ৳{productBill}
                                                    </div>
                                                    <div className={`border-t border-gray-200 font-black text-xs ${rcvColorClass}`}>
                                                        ৳{netReceivable}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="align-top py-3">
                                            <Badge className={`${statusBadgeClass(order.status)} px-2.5 py-1`}>
                                                {order.status || "PENDING"}
                                            </Badge>
                                        </TableCell>

                                        {/* Payment Status */}
                                        <TableCell className="align-top py-3">
                                            <Badge className={`${order.isPaid ? "bg-emerald-600" : "bg-rose-600"} text-white text-[10px] px-2 py-0.5 font-bold`}>
                                                {order.isPaid ? "PAID" : "DUE"}
                                            </Badge>
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell className="text-right pr-4 align-top py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewInvoice(order.id, order._type)}
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
            {combinedMeta && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 font-semibold">
                            Showing <span className="font-bold text-gray-900">{unifiedList.length}</span> of <span className="font-bold text-gray-900">{combinedMeta.total}</span> items
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
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
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
                            Page {page} of {combinedMeta.totalPage || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= (combinedMeta.totalPage || 1)}
                            onClick={() => setPage((prev) => prev + 1)}
                            className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Invoice Modal - Handles BOTH Orders & Sales seamlessly */}
            {invoiceOrder && (
                <OrderInvoice
                    order={invoiceOrder}
                    visible={isInvoiceVisible}
                    onClose={() => {
                        setIsInvoiceVisible(false);
                        setInvoiceId(null);
                        setInvoiceType(null);
                    }}
                />
            )}
        </div>
    );
}