"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Receipt, Save, ChevronDown, ChevronUp, Trash2, Plus, Search, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    useGetOrderByIdQuery,
    useUpdateOrderMutation,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
    IOrderData,
    IUpdateOrderPayload
} from "@/redux/store/api/order/ordersApi";
import { useGetAllProductsQuery } from "@/redux/store/api/product/productApi";
import OrderInvoice from "./OrderInvoice";
import { useCourierReturnPrompt } from "@/components/admin/courierReturn";

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
    { value: "cash", label: "Cash" },
    { value: "cashOnDelivery", label: "Cash on Delivery" },
    { value: "onlinePayment", label: "Online Payment" },
    { value: "bkash", label: "bKash" },
    { value: "nagad", label: "Nagad" },
    { value: "rocket", label: "Rocket" },
    { value: "bankTransfer", label: "Bank Transfer" },
    { value: "cardPayment", label: "Card Payment" },
] as const;

type MethodValue = (typeof METHOD_OPTIONS)[number]["value"];

interface EditOrderModalProps {
    orderId: string | null;
    visible: boolean;
    onClose: () => void;
}

export default function EditOrderModal({ orderId, visible, onClose }: EditOrderModalProps) {
    const { data, isLoading, isFetching, isError, refetch } = useGetOrderByIdQuery(orderId as string, {
        skip: !orderId || !visible,
    });

    const order: IOrderData | undefined = data?.data;

    const [updateOrder, { isLoading: saving }] = useUpdateOrderMutation();
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();
    const [updatePayment, { isLoading: updatingPayment }] = useUpdatePaymentStatusMutation();

    const [showInvoice, setShowInvoice] = useState(false);
    const [statusValue, setStatusValue] = useState<OrderStatus>("PENDING");
    const [paymentValue, setPaymentValue] = useState<"PAID" | "DUE">("DUE");

    const [editableItems, setEditableItems] = useState<any[]>([]);
    const [amountInput, setAmountInput] = useState<number>(0);

    const [form, setForm] = useState<Partial<IUpdateOrderPayload> | null>(null);
    const [dirty, setDirty] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Product & Variant Picker Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<any | null>(null);

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
    }, [order?.id, order]);

    const computedItemsTotal = useMemo(() => {
        if (!editableItems.length) return 0;
        return editableItems.reduce((sum, it) => {
            const qty = normalizeNumber(it.quantity ?? 0);
            const price = normalizeNumber(it.price ?? 0);
            return sum + price * qty;
        }, 0);
    }, [editableItems]);

    const calculatedGrandTotal = useMemo(() => {
        const shipping = normalizeNumber(form?.shippingCost);
        const discount = normalizeNumber(form?.discountAmount);
        return Math.max(0, computedItemsTotal + shipping - discount);
    }, [computedItemsTotal, form?.shippingCost, form?.discountAmount]);

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

    const handleAddVariantToOrder = (prod: any, variant: any) => {
        const newItem = {
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            productId: prod.id,
            variantId: variant?.id || "default_variant",
            size: Number(variant?.size ?? 1),
            unit: variant?.unit ?? "ML",
            quantity: 1,
            price: Number(variant?.price ?? 0),
            product: {
                name: prod.name,
                primaryImage: prod.primaryImage || "/placeholder.png",
            }
        };
        setEditableItems((prev) => [...prev, newItem]);
        setDirty(true);
        setSelectedProductForVariant(null);
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

    const askReturnCharge = useCourierReturnPrompt();
    const onStatusChange = async (val: string) => {
        const next = val as OrderStatus;
        if (!orderId) return;
        const extra = await askReturnCharge(order as any, next);
        if (extra === null) return; // closed the question: change nothing
        setStatusValue(next);

        try {
            await updateStatus({ id: orderId, status: next, ...(extra || {}) }).unwrap();
            refetch();
        } catch {
            setStatusValue((order?.status as OrderStatus) ?? "PENDING");
        }
    };

    const onPaymentChange = async (val: string) => {
        const next = val as "PAID" | "DUE";
        setPaymentValue(next);
        if (!orderId) return;

        try {
            const isPaidBool = next === "PAID";
            await updatePayment({ id: orderId, isPaid: isPaidBool }).unwrap();
            refetch();
        } catch {
            setPaymentValue(order?.isPaid ? "PAID" : "DUE");
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-green-800 text-white px-3 sm:px-4 py-2.5 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-green-600 px-2 py-0.5 rounded text-white">
                            Edit Order
                        </span>
                        <span className="text-xs text-green-100 font-medium">
                            Invoice #{order?.invoice || "..."}
                        </span>
                        {dirty && (
                            <span className="text-[10px] bg-amber-400 text-green-950 px-2 py-0.5 rounded-full font-bold">
                                Unsaved
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInvoice(true)}
                            className="h-7 text-xs border-green-400 text-green-200 hover:bg-green-900 bg-transparent"
                        >
                            <Receipt className="w-3.5 h-3.5 mr-1" /> Invoice
                        </Button>
                        <Button
                            onClick={handleSaveAll}
                            disabled={!dirty || saving}
                            size="sm"
                            className={`h-7 text-xs gap-1.5 ${dirty ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : "bg-green-900 text-green-400 cursor-not-allowed"}`}
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-green-300 hover:text-white p-1 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body Content */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 bg-gray-50/50">
                    {(isLoading || isFetching || !form) ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                            <p className="text-xs text-gray-500 font-medium">Loading order details...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-rose-600 text-xs">Failed to load order data.</div>
                    ) : (
                        <>
                            {/* Quick Details & Status Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border shadow-xs">
                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 flex items-center justify-between">
                                        <span>Order Status</span>
                                        {updatingStatus && <Loader2 className="w-3 h-3 animate-spin text-green-600" />}
                                    </label>
                                    <Select value={statusValue} onValueChange={onStatusChange} disabled={updatingStatus}>
                                        <SelectTrigger className="h-8 text-xs">
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
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 flex items-center justify-between">
                                        <span>Payment Status</span>
                                        {updatingPayment && <Loader2 className="w-3 h-3 animate-spin text-green-600" />}
                                    </label>
                                    <Select value={paymentValue} onValueChange={onPaymentChange} disabled={updatingPayment}>
                                        <SelectTrigger className="h-8 text-xs">
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
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">Payment Method</label>
                                    <Select value={(form.method ?? "") as any} onValueChange={(val) => setField("method", val as any)}>
                                        <SelectTrigger className="h-8 text-xs border-green-300">
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
                                        <label className="text-[11px] text-gray-500 font-medium">Final Amount (BDT)</label>
                                        <button
                                            type="button"
                                            className="text-[10px] text-green-700 hover:underline font-semibold"
                                            onClick={() => {
                                                setAmountInput(calculatedGrandTotal);
                                                setDirty(true);
                                            }}
                                        >
                                            Sync Total ({calculatedGrandTotal})
                                        </button>
                                    </div>
                                    <Input
                                        type="number"
                                        className="h-8 text-xs font-semibold"
                                        value={String(amountInput)}
                                        onChange={(e) => {
                                            setAmountInput(normalizeNumber(e.target.value));
                                            setDirty(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Financial adjustments row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-lg border shadow-xs">
                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">Shipping Cost</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-xs"
                                        value={String(form.shippingCost ?? 0)}
                                        onChange={(e) => setField("shippingCost", normalizeNumber(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">Discount Amount</label>
                                    <Input
                                        type="number"
                                        className="h-8 text-xs"
                                        value={String(form.discountAmount ?? 0)}
                                        onChange={(e) => setField("discountAmount", normalizeNumber(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">Coupon Code</label>
                                    <Input
                                        className="h-8 text-xs"
                                        value={form.coupon ?? ""}
                                        onChange={(e) => setField("coupon", e.target.value)}
                                        placeholder="e.g. NEWYEAR10"
                                    />
                                </div>
                            </div>

                            {/* Order Items Card with fully editable fields */}
                            <Card className="shadow-xs">
                                <CardHeader className="py-2.5 px-3.5 flex flex-row items-center justify-between border-b bg-white">
                                    <CardTitle className="text-xs font-semibold">Order Items ({editableItems.length}) - Subtotal: {computedItemsTotal} BDT</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)} className="h-7 text-xs gap-1 border-green-600 text-green-700 hover:bg-green-50">
                                        <Plus className="w-3.5 h-3.5" /> Add Product
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-2.5 space-y-2 bg-white">
                                    {editableItems.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-4">No items in this order.</p>
                                    ) : (
                                        editableItems.map((item) => {
                                            const qty = item.quantity ?? 1;
                                            const price = normalizeNumber(item.price ?? 0);
                                            const lineTotal = price * normalizeNumber(qty);

                                            return (
                                                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 border p-2.5 rounded-md bg-gray-50/50">
                                                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                                        <Image
                                                            src={item.product?.primaryImage || "/placeholder.png"}
                                                            alt={item.product?.name || "Product"}
                                                            width={38}
                                                            height={38}
                                                            className="rounded object-cover border flex-shrink-0"
                                                        />
                                                        <p className="font-medium text-xs text-gray-900 truncate flex-1 sm:w-44">{item.product?.name || "Product Item"}</p>
                                                    </div>

                                                    {/* Editable item fields */}
                                                    <div className="grid grid-cols-4 sm:flex items-center gap-2 w-full sm:w-auto ml-auto">
                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">Size</span>
                                                            <Input
                                                                type="number"
                                                                className="h-7 text-xs px-1 bg-white"
                                                                value={String(item.size ?? "")}
                                                                onChange={(e) => handleItemFieldChange(item.id, "size", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">Unit</span>
                                                            <Input
                                                                type="text"
                                                                className="h-7 text-xs px-1 bg-white"
                                                                value={String(item.unit ?? "")}
                                                                onChange={(e) => handleItemFieldChange(item.id, "unit", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-20">
                                                            <span className="text-[9px] text-gray-400 block">Price (৳)</span>
                                                            <Input
                                                                type="number"
                                                                className="h-7 text-xs px-1 bg-white font-semibold"
                                                                value={String(item.price ?? "")}
                                                                onChange={(e) => handleItemFieldChange(item.id, "price", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">Qty</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                className="h-7 text-xs text-center px-1 bg-white font-semibold"
                                                                value={String(qty)}
                                                                onChange={(e) => handleItemFieldChange(item.id, "quantity", e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                                                        <div className="text-right sm:w-20">
                                                            <span className="text-[9px] text-gray-400 block">Total</span>
                                                            <span className="text-xs font-bold text-gray-800">{lineTotal}৳</span>
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

                            {/* Collapsible Advanced Section */}
                            <Card className="shadow-xs bg-white">
                                <CardHeader className="py-2 px-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowAdvanced((p) => !p)}>
                                    <CardTitle className="text-xs font-semibold text-gray-600">Customer, Shipping & Billing Details</CardTitle>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {showAdvanced ? "Hide" : "Expand"}
                                    </Button>
                                </CardHeader>

                                {showAdvanced && (
                                    <CardContent className="p-3 space-y-3 border-t text-xs">
                                        <div>
                                            <label className="text-gray-500 font-medium mb-1 block">Additional Notes</label>
                                            <Textarea
                                                value={form.additionalNotes ?? ""}
                                                onChange={(e) => setField("additionalNotes", e.target.value)}
                                                className="h-14 text-xs resize-none"
                                            />
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
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

                                            <div className="space-y-1.5">
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
                        </>
                    )}
                </div>

                {/* Product & Variant Picker Modal Sub-overlay */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-3 border-b flex items-center justify-between bg-green-50">
                                <h3 className="font-semibold text-xs text-green-900">
                                    {selectedProductForVariant ? `Choose Variant for: ${selectedProductForVariant.name}` : "Select Product to Add"}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedProductForVariant) {
                                            setSelectedProductForVariant(null);
                                        } else {
                                            setIsProductModalOpen(false);
                                        }
                                    }}
                                    className="h-6 w-6 p-0"
                                >
                                    ✕
                                </Button>
                            </div>

                            {!selectedProductForVariant ? (
                                <>
                                    <div className="p-2.5 border-b bg-gray-50">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                                            <Input
                                                placeholder="Search catalog products..."
                                                className="pl-8 h-7 text-xs bg-white"
                                                value={productSearchTerm}
                                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                                        {loadingProducts ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                                <Loader2 className="animate-spin w-4 h-4 text-green-600" />
                                                <p className="text-[11px] text-gray-400">Loading catalog...</p>
                                            </div>
                                        ) : productList.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-4">No products found.</p>
                                        ) : (
                                            productList.map((prod: any) => (
                                                <div
                                                    key={prod.id}
                                                    onClick={() => {
                                                        if (prod.variants && prod.variants.length > 0) {
                                                            setSelectedProductForVariant(prod);
                                                        } else {
                                                            // Add default variant if none exist
                                                            handleAddVariantToOrder(prod, { id: "default", size: 1, unit: "PCS", price: 0 });
                                                        }
                                                    }}
                                                    className="flex items-center gap-2.5 p-1.5 rounded border hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                                                >
                                                    <Image src={prod.primaryImage || "/placeholder.png"} alt={prod.name} width={32} height={32} className="rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate">{prod.name}</p>
                                                        <p className="text-[10px] text-gray-500">Variants available: {prod.variants?.length || 0}</p>
                                                    </div>
                                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">Choose</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Variant selection list */
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    <p className="text-[11px] text-gray-500 mb-2">Select a specific variant / size / price for this item:</p>
                                    {selectedProductForVariant.variants.map((v: any) => (
                                        <div
                                            key={v.id}
                                            onClick={() => handleAddVariantToOrder(selectedProductForVariant, v)}
                                            className="flex items-center justify-between p-2.5 rounded border bg-white hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors shadow-2xs"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    Size: {v.size} {v.unit}
                                                </p>
                                                <p className="text-[11px] text-green-700 font-semibold">
                                                    Price: ৳{v.price}
                                                </p>
                                            </div>
                                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white">
                                                Add Variant
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 text-xs"
                                        onClick={() => setSelectedProductForVariant(null)}
                                    >
                                        ← Back to product search
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {order && <OrderInvoice order={order} visible={showInvoice} onClose={() => setShowInvoice(false)} />}
            </div>
        </div>
    );
}