
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
    Loader2,
    Download,
    Eye,
    MapPin,
    FileText,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    useUpdateOrderStatusMutation,
} from "@/redux/store/api/order/ordersApi";
import OrderInvoice from "../../orders/_components/OrderInvoice";

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

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "RETURNED"] as const;

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
        ? "bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold text-xs"
        : s === "CANCELED"
            ? "bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold text-xs"
            : s === "DELIVERED"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold text-xs"
                : s === "SHIPPED"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold text-xs"
                    : s === "RETURNED"
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-bold text-xs"
                        : s === "PROCESSING"
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold text-xs"
                            : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold text-xs";
};

const methodLabel = (m: string) => {
    const found = METHOD_OPTIONS.find((x) => x.value === m);
    return found?.label || m || "Unknown";
};

export default function RecentOrderList() {
    // Search
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 350);

    // Pagination & Rows Limit
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState<number>(10);

    // Local sorting
    const [sortField, setSortField] = useState<SortField>("orderTime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const queryArgs = useMemo(() => {
        return {
            searchTerm: debouncedSearch?.trim() || undefined,
            page,
            limit,
        } as any;
    }, [debouncedSearch, page, limit]);

    const { data, isLoading, refetch } = useGetAllOrdersQuery(queryArgs);
    const [updateOrderStatus] = useUpdateOrderStatusMutation();
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
    const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

    const { data: invoiceData } = useGetOrderByIdQuery(invoiceOrderId || "", { skip: !invoiceOrderId });
    const invoiceOrder: Order | undefined = invoiceData?.data;

    const ordersRaw = useMemo(() => (data as any)?.data?.data || [], [data]);
    const meta = (data as any)?.data?.meta;

    // Local sort implementation
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

    const handleUpdateStatus = async (id: string, nextStatus: string) => {
        try {
            setUpdatingStatusId(id);
            const res = await updateOrderStatus({ id, status: nextStatus }).unwrap();
            if (res?.success) {
                toast.success(`Order marked as ${nextStatus} `);
                refetch();
            } else toast.error("Failed to update order");
        } catch (e) {
            toast.error("Error updating order");
            console.error(e);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleViewInvoice = (orderId: string) => {
        setInvoiceOrderId(orderId);
        setIsInvoiceVisible(true);
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden p-4 sm:p-5 space-y-3">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">Recent Orders</h2>
                    <p className="text-xs text-gray-500">Overview of latest store activities and fulfillment status.</p>
                </div>

                <div className="relative w-full sm:w-[300px]">
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
                            <TableHead className="font-bold py-2.5 text-xs">Method</TableHead>

                            <TableHead
                                onClick={() => toggleSort("amount")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">Amount {renderSortIcon("amount")}</div>
                            </TableHead>

                            <TableHead
                                onClick={() => toggleSort("status")}
                                className="cursor-pointer select-none font-bold py-2.5 text-xs"
                            >
                                <div className="flex items-center">Status {renderSortIcon("status")}</div>
                            </TableHead>

                            <TableHead className="text-right font-bold pr-4 py-2.5 text-xs">Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 text-xs">
                        {isLoading ? (
                            [...Array(6)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={10} className="py-3">
                                        <Skeleton className="w-full h-7 my-1 rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-10 text-gray-500">
                                    <p className="font-medium text-sm">No orders found.</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search criteria.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order: any, idx: number) => {
                                const orderItems = order.items || order.orderItems || order.cartItems || [];

                                return (
                                    <TableRow key={order.id} className="hover:bg-gray-50/85 transition-colors">
                                        <TableCell className="text-center py-3 font-semibold text-gray-500">
                                            {(page - 1) * limit + idx + 1}.
                                        </TableCell>

                                        {/* Invoice */}
                                        <TableCell className="font-bold align-top py-3 text-sm">
                                            <Link href={`/dashboard/orders/${order.id}`} className="text-blue-600 font-semibold hover:underline">
                                                #{order.invoice}
                                            </Link>
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
                                        <TableCell className="text-gray-900 align-top py-3 max-w-[140px]">
                                            <div className="font-bold text-sm truncate text-gray-900" title={order?.customer?.name || order?.name || "Guest"}>
                                                {order?.customer?.name || order?.name || "Guest"}
                                            </div>
                                            <div className="text-xs text-gray-700 font-semibold mt-0.5">
                                                {order?.customer?.phone || order?.shipping?.phone || "No phone"}
                                            </div>
                                        </TableCell>

                                        {/* Shipping Address */}
                                        <TableCell className="align-top py-3 max-w-[180px]">
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

                                        {/* Ordered Products */}
                                        <TableCell className="align-top py-2.5 max-w-[240px]">
                                            {orderItems.length > 0 ? (
                                                <div className="space-y-1">
                                                    {orderItems.map((item: any, iIdx: number) => {
                                                        const productName = item.name || item.product?.name || "Product";
                                                        const itemSize = item.size ? `(${item.size}` : "";
                                                        const itemUnit = item.unit ? `${item.unit})` : "";
                                                        const itemQty = item.quantity ?? item.qty ?? 1;
                                                        const itemPrice = item.price || item.amount || 0;

                                                        return (
                                                            <div key={iIdx} className="text-xs bg-gray-50 border border-gray-200/80 rounded px-2 py-1 flex items-center justify-between gap-2 shadow-2xs">
                                                                <div className="truncate font-semibold text-gray-900" title={`${productName} ${itemSize} ${itemUnit} `}>
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

                                        {/* Method */}
                                        <TableCell className="align-top py-3 text-xs font-semibold text-gray-700">
                                            {methodLabel(order.method)}
                                        </TableCell>

                                        {/* Amount */}
                                        <TableCell className="font-black text-gray-900 whitespace-nowrap align-top py-3 text-sm">
                                            {Number(order.amount || 0).toLocaleString()} BDT
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="align-top py-2.5">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge
                                                        className={`${statusBadgeClass(order.status)} ${updatingStatusId === order.id
                                                                ? "opacity-70 cursor-not-allowed"
                                                                : "cursor-pointer"
                                                            } px - 2.5 py - 1 transition - transform active: scale - 95`}
                                                        title="Update Status"
                                                    >
                                                        {updatingStatusId === order.id ? (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                                                            </span>
                                                        ) : (
                                                            order.status || "PENDING"
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
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white mr-2 ${statusBadgeClass(s)} `}>
                                                                {s}
                                                            </span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                        {/* Invoice Action */}
                                        <TableCell className="text-right pr-4 align-top py-2.5">
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