"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, Receipt, Save, ChevronDown, ChevronUp, Trash2, Plus, Search, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
    useGetOrderByIdQuery,
    useUpdateOrderMutation,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
    IOrderData,
    IUpdateOrderPayload
} from "@/redux/store/api/order/ordersApi";

import { useGetAllProductsQuery } from "@/redux/store/api/product/productApi";

import OrderInvoice from "../_components/OrderInvoice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Address = {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    district?: string | null;
    thana?: string | null;
};

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELED" | "RETURNED";
const STATUS_LIST: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED", "RETURNED"];

const METHOD_OPTIONS = [
    { value: "ALL", label: "All Methods" },
    { value: "cash", label: "Cash" },
    { value: "online", label: "Online" },
    { value: "cashOnDelivery", label: "Cash On Delivery" },
    { value: "bkashPayment", label: "Bkash Payment" },
] as const;

type MethodValue = (typeof METHOD_OPTIONS)[number]["value"];

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const orderId = (params as any)?.orderId as string | undefined;

    const { data, isLoading, isFetching, isError, refetch } = useGetOrderByIdQuery(orderId as string, {
        skip: !orderId,
    });

    const order: IOrderData | undefined = data?.data;

    const [updateOrder, { isLoading: saving }] = useUpdateOrderMutation();
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();
    const [updatePayment, { isLoading: updatingPayment }] = useUpdatePaymentStatusMutation();

    const [showInvoice, setShowInvoice] = useState(false);
    const [statusValue, setStatusValue] = useState<OrderStatus>("PENDING");
    const [paymentValue, setPaymentValue] = useState<"PAID" | "DUE" | "SHIPPED" | "RETURNED">("DUE");

    const [editableItems, setEditableItems] = useState<any[]>([]);
    const [amountInput, setAmountInput] = useState<number>(0);

    const [form, setForm] = useState<Partial<IUpdateOrderPayload> | null>(null);
    const [dirty, setDirty] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Product Picker Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const { data: productQueryResult, isLoading: loadingProducts } = useGetAllProductsQuery({ limit: 20, searchTerm: productSearchTerm });
    const productList = productQueryResult?.data ?? [];

    const normalizeNumber = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    useEffect(() => {
        if (!order) return;

        setForm({
            method: (order.method as MethodValue) ?? "cash",
            orderSource: order.orderSource as any,
            saleType: order.saleType as any ?? null,
            shippingCost: Number(order.shippingCost ?? 0),
            discountAmount: Number(order.discountAmount ?? 0),
            coupon: order.coupon ?? "",
            additionalNotes: order.additionalNotes ?? "",
            shipping: {
                name: order.shipping?.name ?? "",
                phone: order.shipping?.phone ?? "",
                email: order.shipping?.email ?? "",
                address: order.shipping?.address ?? "",
                district: order.shipping?.district ?? "",
                thana: order.shipping?.thana ?? "",
            },
            billing: {
                name: order.billing?.name ?? "",
                phone: order.billing?.phone ?? "",
                email: order.billing?.email ?? "",
                address: order.billing?.address ?? "",
                district: order.billing?.district ?? "",
                thana: order.billing?.thana ?? "",
            },
            salesmanId: order.salesmanId ?? null,
            name: order.name ?? "",
            phone: order.phone ?? "",
            email: order.email ?? "",
            address: order.address ?? "",
            customerId: order.customerId ?? null,
        });

        setStatusValue((order.status as OrderStatus) ?? "PENDING");
        setPaymentValue(order.isPaid ? "PAID" : "DUE");

        setEditableItems(
            (order.orderItems ?? []).map((it) => ({
                ...it,
                quantity: Number(it.quantity ?? 1),
                size: Number(it.size ?? 1),
                unit: it.unit ?? "ML",
                price: Number(it.price ?? 0),
            }))
        );

        setAmountInput(Number(order.amount ?? 0));
        setDirty(false);
    }, [order?.id]);

    const computedItemsTotal = useMemo(() => {
        if (!editableItems.length) return 0;
        return editableItems.reduce((sum, it) => {
            const qty = normalizeNumber(it.quantity ?? 0);
            const price = normalizeNumber(it.price ?? 0);
            return sum + price * qty;
        }, 0);
    }, [editableItems]);

    const setField = <K extends keyof IUpdateOrderPayload>(key: K, value: IUpdateOrderPayload[K]) => {
        setForm((prev) => {
            if (!prev) return prev;
            setDirty(true);
            return { ...prev, [key]: value };
        });
    };

    const setAddressField = (type: "shipping" | "billing", key: keyof Address, value: any) => {
        setForm((prev) => {
            if (!prev) return prev;
            setDirty(true);
            return {
                ...prev,
                [type]: {
                    ...(prev[type] ?? {}),
                    [key]: value,
                },
            };
        });
    };

    const handleItemFieldChange = (itemId: string, field: string, value: any) => {
        setEditableItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    let updatedVal = value;
                    if (field === "quantity" || field === "size" || field === "price") {
                        updatedVal = normalizeNumber(value);
                    }
                    return { ...item, [field]: updatedVal };
                }
                return item;
            })
        );
        setDirty(true);
    };

    const handleRemoveItem = (itemId: string) => {
        setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
        setDirty(true);
    };

    const handleSelectProductToAdd = (prod: any) => {
        const newItem = {
            id: `temp_${Date.now()}`,
            productId: prod.id,
            variantId: prod.variants?.[0]?.id || "default_variant",
            size: prod.variants?.[0]?.size || 3,
            unit: prod.variants?.[0]?.unit || "ML",
            quantity: 1,
            price: prod.variants?.[0]?.price || 150,
            product: {
                name: prod.name,
                primaryImage: prod.primaryImage || "/placeholder.png",
            }
        };
        setEditableItems((prev) => [...prev, newItem]);
        setDirty(true);
        setIsProductModalOpen(false);
    };

    const handleSaveAll = async () => {
        if (!orderId || !form || !order) return;

        const orderItemsPayload = editableItems.map((it) => ({
            id: it.id?.startsWith("temp_") ? undefined : it.id,
            productId: it.productId,
            variantId: it.variantId,
            size: normalizeNumber(it.size),
            unit: (it.unit ?? "").toString().trim(),
            quantity: Math.max(1, Math.floor(normalizeNumber(it.quantity))),
            price: normalizeNumber(it.price),
        }));

        const payload: IUpdateOrderPayload = {
            id: orderId,
            ...form,
            shippingCost: normalizeNumber(form.shippingCost),
            discountAmount: normalizeNumber(form.discountAmount),
            coupon: (form.coupon ?? "").toString().trim() || null,
            method: (form.method ?? "").toString().trim() || null,
            additionalNotes: (form.additionalNotes ?? "").toString().trim() || null,
            amount: normalizeNumber(amountInput),
            orderItems: orderItemsPayload as any,
        };

        await updateOrder(payload).unwrap();
        setDirty(false);
        refetch();
    };

    const onStatusChange = async (val: string) => {
        const next = val as OrderStatus;
        setStatusValue(next);
        if (!orderId) return;

        try {
            await updateStatus({ id: orderId, status: next }).unwrap();
            refetch();
        } catch {
            setStatusValue((order?.status as OrderStatus) ?? "PENDING");
        }
    };

    const onPaymentChange = async (val: string) => {
        const next = val as "PAID" | "DUE" | "SHIPPED" | "RETURNED";
        setPaymentValue(next);
        if (!orderId) return;

        try {
            // Mapping Shipped/Returned to appropriate backend parameters if needed, or passing isPaid boolean
            const isPaidBool = next === "PAID";
            await updatePayment({ id: orderId, isPaid: isPaidBool }).unwrap();
            refetch();
        } catch {
            setPaymentValue(order?.isPaid ? "PAID" : "DUE");
        }
    };

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.replace("/dashboard/orders");
        }
    };

    if (!orderId || isLoading || isFetching || !form) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
                <p className="text-xs text-gray-500 font-medium">Loading order data...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => refetch()} className="bg-orange-500 hover:bg-orange-600 text-white">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!order) return <div className="p-10 text-center">Order not found</div>;

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-4 text-sm relative">
            {/* Global Saving / Fetching Indicator Overlay Banner */}
            {(saving || updatingStatus || updatingPayment || isFetching) && (
                <div className="fixed top-4 right-4 z-50 bg-gray-900/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2.5 backdrop-blur-xs animate-in fade-in slide-in-from-top-4">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span className="text-xs font-medium">
                        {saving ? "Saving changes..." : updatingStatus ? "Updating status..." : updatingPayment ? "Updating payment..." : "Syncing..."}
                    </span>
                </div>
            )}

            {/* Top Minimal Header */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-xs">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowInvoice(true)} className="border-orange-300 text-orange-600 hover:bg-orange-50">
                        <Receipt className="w-4 h-4 mr-1.5" /> Invoice
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium">Invoice #{order.invoice}</span>
                    {dirty && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            Unsaved Changes
                        </span>
                    )}
                    <Button
                        onClick={handleSaveAll}
                        disabled={!dirty || saving}
                        size="sm"
                        className={`text-white gap-1.5 cursor-pointer transition-all ${dirty ? "bg-orange-500 hover:bg-orange-600 shadow-sm" : "bg-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Compact Quick Details & Status Bar with explicit loading feedback */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border shadow-xs">
                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 flex items-center justify-between">
                        <span>Order Status</span>
                        {updatingStatus && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
                    </label>
                    <Select value={statusValue} onValueChange={onStatusChange} disabled={updatingStatus}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_LIST.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 flex items-center justify-between">
                        <span>Payment Status</span>
                        {updatingPayment && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
                    </label>
                    <Select value={paymentValue} onValueChange={onPaymentChange} disabled={updatingPayment}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PAID" className="text-xs">PAID</SelectItem>
                            <SelectItem value="DUE" className="text-xs">DUE</SelectItem>
                            <SelectItem value="SHIPPED" className="text-xs">SHIPPED</SelectItem>
                            <SelectItem value="RETURNED" className="text-xs">RETURNED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Payment Method</label>
                    <Select value={(form.method ?? "") as any} onValueChange={(val) => setField("method", val as any)}>
                        <SelectTrigger className="h-9 text-xs border-orange-300">
                            <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                            {METHOD_OPTIONS.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500 font-medium">Final Amount (BDT)</label>
                        <button
                            type="button"
                            className="text-[10px] text-orange-600 hover:underline font-medium"
                            onClick={() => {
                                setAmountInput(computedItemsTotal);
                                setDirty(true);
                            }}
                        >
                            Sync Total ({computedItemsTotal})
                        </button>
                    </div>
                    <Input
                        type="number"
                        className="h-9 text-xs font-semibold"
                        value={String(amountInput)}
                        onChange={(e) => {
                            setAmountInput(normalizeNumber(e.target.value));
                            setDirty(true);
                        }}
                    />
                </div>
            </div>

            {/* Financial adjustments row */}
            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border shadow-xs">
                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Shipping Cost</label>
                    <Input
                        type="number"
                        className="h-8 text-xs"
                        value={String(form.shippingCost ?? 0)}
                        onChange={(e) => setField("shippingCost", normalizeNumber(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Discount Amount</label>
                    <Input
                        type="number"
                        className="h-8 text-xs"
                        value={String(form.discountAmount ?? 0)}
                        onChange={(e) => setField("discountAmount", normalizeNumber(e.target.value))}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Coupon Code</label>
                    <Input
                        className="h-8 text-xs"
                        value={form.coupon ?? ""}
                        onChange={(e) => setField("coupon", e.target.value)}
                        placeholder="e.g. NEWYEAR10"
                    />
                </div>
            </div>

            {/* Compact Order Items Card */}
            <Card className="shadow-xs">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                    <CardTitle className="text-sm font-semibold">Order Items ({editableItems.length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)} className="h-8 text-xs gap-1.5 border-orange-400 text-orange-600 hover:bg-orange-50">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </Button>
                </CardHeader>
                <CardContent className="p-3 space-y-2.5">
                    {editableItems.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-6">No items in this order.</p>
                    ) : (
                        editableItems.map((item) => {
                            const qty = item.quantity ?? 1;
                            const price = normalizeNumber(item.price ?? 0);
                            const lineTotal = price * normalizeNumber(qty);

                            return (
                                <div key={item.id} className="flex items-center gap-3 border p-2.5 rounded-md bg-gray-50/50">
                                    <Image
                                        src={item.product?.primaryImage || "/placeholder.png"}
                                        alt={item.product?.name || "Product"}
                                        width={44}
                                        height={44}
                                        className="rounded object-cover border"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-xs text-gray-900 truncate">{item.product?.name || "Product Item"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-16">
                                                <span className="text-[10px] text-gray-400 block">Size</span>
                                                <Input
                                                    type="number"
                                                    className="h-7 text-xs px-1.5"
                                                    value={String(item.size ?? "")}
                                                    onChange={(e) => handleItemFieldChange(item.id, "size", e.target.value)}
                                                />
                                            </div>
                                            <div className="w-16">
                                                <span className="text-[10px] text-gray-400 block">Unit</span>
                                                <Input
                                                    type="text"
                                                    className="h-7 text-xs px-1.5"
                                                    value={String(item.unit ?? "")}
                                                    onChange={(e) => handleItemFieldChange(item.id, "unit", e.target.value)}
                                                />
                                            </div>
                                            <div className="w-20">
                                                <span className="text-[10px] text-gray-400 block">Price</span>
                                                <Input
                                                    type="number"
                                                    className="h-7 text-xs px-1.5"
                                                    value={String(item.price ?? "")}
                                                    onChange={(e) => handleItemFieldChange(item.id, "price", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-16 text-center">
                                            <span className="text-[10px] text-gray-400 block mb-1">Qty</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-7 text-xs text-center px-1"
                                                value={String(qty)}
                                                onChange={(e) => handleItemFieldChange(item.id, "quantity", e.target.value)}
                                            />
                                        </div>

                                        <div className="w-20 text-right">
                                            <span className="text-[10px] text-gray-400 block">Total</span>
                                            <span className="text-xs font-semibold text-gray-800">{lineTotal} BDT</span>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Minimal Collapsible Advanced Section */}
            <Card className="shadow-xs">
                <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowAdvanced((p) => !p)}>
                    <CardTitle className="text-xs font-semibold text-gray-600">Customer, Shipping & Billing Details</CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showAdvanced ? "Hide" : "Expand"}
                    </Button>
                </CardHeader>

                {showAdvanced && (
                    <CardContent className="p-4 space-y-4 border-t text-xs">
                        <div>
                            <label className="text-gray-500 font-medium mb-1 block">Additional Notes</label>
                            <Textarea
                                value={form.additionalNotes ?? ""}
                                onChange={(e) => setField("additionalNotes", e.target.value)}
                                className="h-16 text-xs resize-none"
                            />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Shipping */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-700">Shipping Address</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Name" className="h-7 text-xs" value={form.shipping?.name ?? ""} onChange={(e) => setAddressField("shipping", "name", e.target.value)} />
                                    <Input placeholder="Phone" className="h-7 text-xs" value={form.shipping?.phone ?? ""} onChange={(e) => setAddressField("shipping", "phone", e.target.value)} />
                                </div>
                                <Input placeholder="Street Address" className="h-7 text-xs" value={form.shipping?.address ?? ""} onChange={(e) => setAddressField("shipping", "address", e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="District" className="h-7 text-xs" value={form.shipping?.district ?? ""} onChange={(e) => setAddressField("shipping", "district", e.target.value)} />
                                    <Input placeholder="Thana" className="h-7 text-xs" value={form.shipping?.thana ?? ""} onChange={(e) => setAddressField("shipping", "thana", e.target.value)} />
                                </div>
                            </div>

                            {/* Billing */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-700">Billing Address</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Name" className="h-7 text-xs" value={form.billing?.name ?? ""} onChange={(e) => setAddressField("billing", "name", e.target.value)} />
                                    <Input placeholder="Phone" className="h-7 text-xs" value={form.billing?.phone ?? ""} onChange={(e) => setAddressField("billing", "phone", e.target.value)} />
                                </div>
                                <Input placeholder="Street Address" className="h-7 text-xs" value={form.billing?.address ?? ""} onChange={(e) => setAddressField("billing", "address", e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="District" className="h-7 text-xs" value={form.billing?.district ?? ""} onChange={(e) => setAddressField("billing", "district", e.target.value)} />
                                    <Input placeholder="Thana" className="h-7 text-xs" value={form.billing?.thana ?? ""} onChange={(e) => setAddressField("billing", "thana", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Product Picker Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-3 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Select Product to Add</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsProductModalOpen(false)} className="h-7 w-7 p-0">✕</Button>
                        </div>
                        <div className="p-3 border-b bg-gray-50">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                                <Input
                                    placeholder="Search catalog products..."
                                    className="pl-8 h-8 text-xs bg-white"
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loadingProducts ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Loader2 className="animate-spin w-5 h-5 text-orange-500" />
                                    <p className="text-xs text-gray-400">Loading catalog...</p>
                                </div>
                            ) : productList.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-6">No products found.</p>
                            ) : (
                                productList.map((prod: any) => (
                                    <div
                                        key={prod.id}
                                        onClick={() => handleSelectProductToAdd(prod)}
                                        className="flex items-center gap-3 p-2 rounded border hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition-colors"
                                    >
                                        <Image src={prod.primaryImage || "/placeholder.png"} alt={prod.name} width={36} height={36} className="rounded object-cover" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-800">{prod.name}</p>
                                            <p className="text-[10px] text-gray-500">Variants available: {prod.variants?.length || 0}</p>
                                        </div>
                                        <span className="text-xs font-medium text-orange-600">Select</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <OrderInvoice order={order} visible={showInvoice} onClose={() => setShowInvoice(false)} />
        </div>
    );
}