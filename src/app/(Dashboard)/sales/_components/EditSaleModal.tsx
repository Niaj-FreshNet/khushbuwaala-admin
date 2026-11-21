
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    Loader2,
    Receipt,
    Save,
    ChevronDown,
    ChevronUp,
    Trash2,
    Plus,
    Search,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    useGetSaleByIdQuery,
    useUpdateSalesMutation,
} from "@/redux/store/api/sales/salesApi";
import { useGetAllProductsQuery } from "@/redux/store/api/product/productApi";
import SalesInvoice from "./SalesInvoice";
import { PLATFORMS } from "../add-sales/page";

type OrderStatus =
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELED"
    | "RETURNED"
    | "CANCEL";

const STATUS_LIST: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
    "CANCELED",
    "RETURNED",
    "CANCEL",
];

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

interface EditSaleModalProps {
    saleId: string | null;
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditSaleModal({
    saleId,
    visible,
    onClose,
    onSuccess,
}: EditSaleModalProps) {
    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetSaleByIdQuery(saleId as string, {
        skip: !saleId || !visible,
    });

    const sale = data?.data;

    const [updateSale, { isLoading: saving }] = useUpdateSalesMutation();

    const [showInvoice, setShowInvoice] = useState(false);
    const [statusValue, setStatusValue] = useState<string>("PENDING");
    const [paymentValue, setPaymentValue] = useState<boolean>(false);
    const [methodValue, setMethodValue] = useState<string>("cash");
    const [platformValue, setPlatformValue] = useState<string>("");
    const [orderSourceValue, setOrderSourceValue] = useState<"SHOWROOM" | "MANUAL">("SHOWROOM");

    const [editableItems, setEditableItems] = useState<any[]>([]);
    const [amountInput, setAmountInput] = useState<number>(0);

    const [form, setForm] = useState<any>({
        shippingCost: 0,
        discountAmount: 0,
        additionalNotes: "",
        name: "",
        phone: "",
        address: "",
        district: "",
    });

    const [dirty, setDirty] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Product & Variant Picker Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [selectedProductForVariant, setSelectedProductForVariant] =
        useState<any | null>(null);

    const {
        data: productQueryResult,
        isLoading: loadingProducts,
    } = useGetAllProductsQuery({
        limit: 20,
        searchTerm: productSearchTerm,
    });

    const productList = productQueryResult?.data ?? [];

    const normalizeNumber = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    // Initialize form fields from sale data
    useEffect(() => {
        if (!sale) return;

        setForm({
            shippingCost: Number(sale.shippingCost ?? 0),
            discountAmount: Number(sale.discountAmount ?? 0),
            additionalNotes: sale.additionalNotes ?? "",
            name: sale.name ?? "",
            phone: sale.phone ?? "",
            address: sale.address ?? "",
            district: sale.district ?? "",
        });

        setStatusValue(sale.status ?? "PENDING");
        setPaymentValue(Boolean(sale.isPaid));
        setMethodValue(sale.method ?? "cash");

        const initialPlatform = sale.platform ?? "";
        const isShowroom =
            sale.orderSource === "SHOWROOM" ||
            !initialPlatform ||
            initialPlatform.toLowerCase() === "SHOWROOM";

        setPlatformValue(isShowroom ? "" : initialPlatform);
        setOrderSourceValue(isShowroom ? "SHOWROOM" : "MANUAL");
        setPlatformValue(sale.platform ?? "");

        const rawItems = sale.orderItems || sale.cartItems || [];

        setEditableItems(
            rawItems.map((it: any) => ({
                ...it,
                quantity: Number(it.quantity ?? it.qty ?? 1),
                size: Number(it.size ?? 1),
                unit: it.unit ?? "PCS",
                price: Number(it.price ?? 0),
            }))
        );

        setAmountInput(Number(sale.amount ?? 0));
        setDirty(false);
    }, [sale?.id, sale]);

    const computedItemsTotal = useMemo(() => {
        if (!editableItems.length) return 0;

        return editableItems.reduce((sum, it) => {
            const qty = normalizeNumber(it.quantity ?? it.qty ?? 0);
            const price = normalizeNumber(it.price ?? 0);

            return sum + price * qty;
        }, 0);
    }, [editableItems]);

    const calculatedGrandTotal = useMemo(() => {
        const shipping = normalizeNumber(form?.shippingCost);
        const discount = normalizeNumber(form?.discountAmount);

        return Math.max(0, computedItemsTotal + shipping - discount);
    }, [
        computedItemsTotal,
        form?.shippingCost,
        form?.discountAmount,
    ]);

    const setField = (key: string, value: any) => {
        setForm((prev: any) => {
            if (!prev) return prev;

            setDirty(true);

            return {
                ...prev,
                [key]: value,
            };
        });
    };

    const handleItemFieldChange = (
        itemId: string,
        field: string,
        value: any
    ) => {
        setEditableItems((prev) =>
            prev.map((item) => {
                if ((item.id || item.productId) === itemId) {
                    let updatedVal = value;

                    if (
                        field === "quantity" ||
                        field === "size" ||
                        field === "price"
                    ) {
                        updatedVal = normalizeNumber(value);
                    }

                    return {
                        ...item,
                        [field]: updatedVal,
                    };
                }

                return item;
            })
        );

        setDirty(true);
    };

    const handleRemoveItem = (itemId: string) => {
        setEditableItems((prev) =>
            prev.filter(
                (item) => (item.id || item.productId) !== itemId
            )
        );

        setDirty(true);
    };

    const handleAddVariantToOrder = (prod: any, variant: any) => {
        const newItem = {
            id: `temp_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 5)}`,
            productId: prod.id,
            variantId: variant?.id || "default_variant",
            size: Number(variant?.size ?? 1),
            unit: variant?.unit ?? "PCS",
            quantity: 1,
            price: Number(variant?.price ?? 0),
            product: {
                name: prod.name,
                primaryImage: prod.primaryImage || "/placeholder.png",
            },
        };

        setEditableItems((prev) => [...prev, newItem]);
        setDirty(true);
        setSelectedProductForVariant(null);
        setIsProductModalOpen(false);
    };

    const handleSaveAll = async () => {
        if (!saleId || !form || !sale) return;

        const orderItemsPayload = editableItems.map((it) => ({
            id: it.id?.startsWith("temp_") ? undefined : it.id,
            productId: it.productId || it.product?.id,
            variantId: it.variantId,
            size: normalizeNumber(it.size),
            unit: (it.unit ?? "PCS").toString().trim(),
            quantity: Math.max(
                1,
                Math.floor(normalizeNumber(it.quantity ?? it.qty))
            ),
            price: normalizeNumber(it.price),
        }));

        const payload: any = {
            id: saleId,
            ...form,
            status: statusValue,
            isPaid: paymentValue,
            method: methodValue,
            orderSource: orderSourceValue,
            platform: orderSourceValue === "SHOWROOM" ? "" : platformValue,
            shippingCost: normalizeNumber(form.shippingCost),
            discountAmount: normalizeNumber(form.discountAmount),
            amount: normalizeNumber(amountInput),
            orderItems: orderItemsPayload,
        };

        try {
            await updateSale(payload).unwrap();

            setDirty(false);
            refetch();

            if (onSuccess) onSuccess();

            onClose();
        } catch (error) {
            console.error("Failed to update sale:", error);
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
                            Edit Sale
                        </span>

                        <span className="text-xs text-green-100 font-medium">
                            Invoice #{sale?.invoice || "..."}
                        </span>

                        {dirty && (
                            <span className="text-[10px] bg-amber-400 text-green-950 px-2 py-0.5 rounded-full font-bold">
                                Unsaved
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {sale && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowInvoice(true)}
                                className="h-7 text-xs border-green-400 text-green-200 hover:bg-green-900 bg-transparent"
                            >
                                <Receipt className="w-3.5 h-3.5 mr-1" />
                                Invoice
                            </Button>
                        )}

                        <Button
                            onClick={handleSaveAll}
                            disabled={!dirty || saving}
                            size="sm"
                            className={`h-7 text-xs gap-1.5 ${dirty
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                : "bg-green-900 text-green-400 cursor-not-allowed"
                                }`}
                        >
                            {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
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
                    {(isLoading || isFetching || !sale) ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                            <p className="text-xs text-gray-500 font-medium">
                                Loading sale details...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-rose-600 text-xs">
                            Failed to load sale data.
                        </div>
                    ) : (
                        <>
                            {/* Quick Details & Status Bar */}
                            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 bg-white p-3 rounded-lg border shadow-xs">

                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">
                                        Sale Status
                                    </label>

                                    <Select
                                        value={statusValue}
                                        onValueChange={(val) => {
                                            setStatusValue(val);
                                            setDirty(true);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {STATUS_LIST.map((s) => (
                                                <SelectItem
                                                    key={s}
                                                    value={s}
                                                    className="text-xs"
                                                >
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">
                                        Payment Status
                                    </label>

                                    <Select
                                        value={paymentValue ? "PAID" : "DUE"}
                                        onValueChange={(val) => {
                                            setPaymentValue(val === "PAID");
                                            setDirty(true);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Payment" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="PAID" className="text-xs">
                                                PAID
                                            </SelectItem>
                                            <SelectItem value="DUE" className="text-xs">
                                                DUE
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">
                                        Payment Method
                                    </label>

                                    <Select
                                        value={methodValue}
                                        onValueChange={(val) => {
                                            setMethodValue(val);
                                            setDirty(true);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs border-green-300">
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {METHOD_OPTIONS.map((m) => (
                                                <SelectItem
                                                    key={m.value}
                                                    value={m.value}
                                                    className="text-xs"
                                                >
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Platform / Order Source */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] text-gray-500 font-medium">
                                            Platform
                                        </label>
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                            {orderSourceValue}
                                        </span>
                                    </div>

                                    <Select
                                        value={orderSourceValue === "SHOWROOM" ? "SHOWROOM" : platformValue || "SHOWROOM"}
                                        onValueChange={(val) => {
                                            if (val === "SHOWROOM" || val.toLowerCase() === "showroom") {
                                                setOrderSourceValue("SHOWROOM");
                                                setPlatformValue("");
                                            } else {
                                                setOrderSourceValue("MANUAL");
                                                setPlatformValue(val);
                                            }
                                            setDirty(true);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs border-green-300">
                                            <SelectValue placeholder="Select Platform" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="SHOWROOM" className="text-xs font-medium">
                                                Showroom
                                            </SelectItem>

                                            {PLATFORMS.filter(
                                                (p) => p.value.toLowerCase() !== "showroom"
                                            ).map((platform) => (
                                                <SelectItem
                                                    key={platform.value}
                                                    value={platform.value}
                                                    className="text-xs"
                                                >
                                                    {platform.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] text-gray-500 font-medium">
                                            Final Amount
                                        </label>

                                        <button
                                            type="button"
                                            className="text-[10px] text-green-700 hover:underline font-semibold"
                                            onClick={() => {
                                                setAmountInput(calculatedGrandTotal);
                                                setDirty(true);
                                            }}
                                        >
                                            Sync ({calculatedGrandTotal})
                                        </button>
                                    </div>

                                    <Input
                                        type="number"
                                        className="h-8 text-xs font-semibold"
                                        value={String(amountInput)}
                                        onChange={(e) => {
                                            setAmountInput(
                                                normalizeNumber(e.target.value)
                                            );
                                            setDirty(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Financial adjustments row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-lg border shadow-xs">
                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">
                                        Shipping Cost
                                    </label>

                                    <Input
                                        type="number"
                                        className="h-8 text-xs"
                                        value={String(form.shippingCost ?? 0)}
                                        onChange={(e) => {
                                            setField(
                                                "shippingCost",
                                                normalizeNumber(e.target.value)
                                            );
                                            setDirty(true);
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] text-gray-500 font-medium mb-1 block">
                                        Discount Amount
                                    </label>

                                    <Input
                                        type="number"
                                        className="h-8 text-xs"
                                        value={String(form.discountAmount ?? 0)}
                                        onChange={(e) => {
                                            setField(
                                                "discountAmount",
                                                normalizeNumber(e.target.value)
                                            );
                                            setDirty(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Order Items Card */}
                            <Card className="shadow-xs">
                                <CardHeader className="py-2.5 px-3.5 flex flex-row items-center justify-between border-b bg-white">
                                    <CardTitle className="text-xs font-semibold">
                                        Sale Items ({editableItems.length}) - Subtotal: {computedItemsTotal} BDT
                                    </CardTitle>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsProductModalOpen(true)}
                                        className="h-7 text-xs gap-1 border-green-600 text-green-700 hover:bg-green-50"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Product
                                    </Button>
                                </CardHeader>

                                <CardContent className="p-2.5 space-y-2 bg-white">
                                    {editableItems.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-4">
                                            No items in this sale.
                                        </p>
                                    ) : (
                                        editableItems.map((item) => {
                                            const qty = item.quantity ?? item.qty ?? 1;
                                            const price = normalizeNumber(item.price ?? 0);
                                            const lineTotal = price * normalizeNumber(qty);
                                            const itemId = item.id || item.productId;

                                            return (
                                                <div
                                                    key={itemId}
                                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 border p-2.5 rounded-md bg-gray-50/50"
                                                >
                                                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                                        <Image
                                                            src={item.product?.primaryImage || "/placeholder.png"}
                                                            alt={item.product?.name || item.name || "Product"}
                                                            width={38}
                                                            height={38}
                                                            className="rounded object-cover border flex-shrink-0"
                                                        />

                                                        <p className="font-medium text-xs text-gray-900 truncate flex-1 sm:w-44">
                                                            {item.product?.name || item.name || "Product Item"}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-4 sm:flex items-center gap-2 w-full sm:w-auto ml-auto">
                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">
                                                                Size
                                                            </span>

                                                            <Input
                                                                type="number"
                                                                className="h-7 text-xs px-1 bg-white"
                                                                value={String(item.size ?? "")}
                                                                onChange={(e) =>
                                                                    handleItemFieldChange(
                                                                        itemId,
                                                                        "size",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">
                                                                Unit
                                                            </span>

                                                            <Input
                                                                type="text"
                                                                className="h-7 text-xs px-1 bg-white"
                                                                value={String(item.unit ?? "")}
                                                                onChange={(e) =>
                                                                    handleItemFieldChange(
                                                                        itemId,
                                                                        "unit",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="w-full sm:w-20">
                                                            <span className="text-[9px] text-gray-400 block">
                                                                Price (৳)
                                                            </span>

                                                            <Input
                                                                type="number"
                                                                className="h-7 text-xs px-1 bg-white font-semibold"
                                                                value={String(item.price ?? "")}
                                                                onChange={(e) =>
                                                                    handleItemFieldChange(
                                                                        itemId,
                                                                        "price",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="w-full sm:w-16">
                                                            <span className="text-[9px] text-gray-400 block">
                                                                Qty
                                                            </span>

                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                className="h-7 text-xs text-center px-1 bg-white font-semibold"
                                                                value={String(qty)}
                                                                onChange={(e) =>
                                                                    handleItemFieldChange(
                                                                        itemId,
                                                                        "quantity",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                                                        <div className="text-right sm:w-20">
                                                            <span className="text-[9px] text-gray-400 block">
                                                                Total
                                                            </span>

                                                            <span className="text-xs font-bold text-gray-800">
                                                                {lineTotal}৳
                                                            </span>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() =>
                                                                handleRemoveItem(itemId)
                                                            }
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

                            {/* Customer & Delivery Details */}
                            <Card className="shadow-xs bg-white">
                                <CardHeader
                                    className="py-2 px-3 flex flex-row items-center justify-between cursor-pointer"
                                    onClick={() => setShowAdvanced((p) => !p)}
                                >
                                    <CardTitle className="text-xs font-semibold text-gray-600">
                                        Customer & Delivery Details
                                    </CardTitle>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs gap-1"
                                    >
                                        {showAdvanced ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                        {showAdvanced ? "Hide" : "Expand"}
                                    </Button>
                                </CardHeader>

                                {showAdvanced && (
                                    <CardContent className="p-3 space-y-3 border-t text-xs">
                                        <div>
                                            <label className="text-gray-500 font-medium mb-1 block">
                                                Additional Notes
                                            </label>

                                            <Textarea
                                                value={form.additionalNotes ?? ""}
                                                onChange={(e) => {
                                                    setField("additionalNotes", e.target.value);
                                                    setDirty(true);
                                                }}
                                                className="h-14 text-xs resize-none"
                                            />
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <h4 className="font-semibold text-gray-700">
                                                    Customer Info
                                                </h4>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder="Name"
                                                        className="h-7 text-xs"
                                                        value={form.name ?? ""}
                                                        onChange={(e) => {
                                                            setField("name", e.target.value);
                                                            setDirty(true);
                                                        }}
                                                    />

                                                    <Input
                                                        placeholder="Phone"
                                                        className="h-7 text-xs"
                                                        value={form.phone ?? ""}
                                                        onChange={(e) => {
                                                            setField("phone", e.target.value);
                                                            setDirty(true);
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <h4 className="font-semibold text-gray-700">
                                                    Address Info
                                                </h4>

                                                <Input
                                                    placeholder="Street Address"
                                                    className="h-7 text-xs mb-2"
                                                    value={form.address ?? ""}
                                                    onChange={(e) => {
                                                        setField("address", e.target.value);
                                                        setDirty(true);
                                                    }}
                                                />

                                                <Input
                                                    placeholder="District"
                                                    className="h-7 text-xs"
                                                    value={form.district ?? ""}
                                                    onChange={(e) => {
                                                        setField("district", e.target.value);
                                                        setDirty(true);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </>
                    )}
                </div>

                {/* Product & Variant Picker Modal */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-3 border-b flex items-center justify-between bg-green-50">
                                <h3 className="font-semibold text-xs text-green-900">
                                    {selectedProductForVariant
                                        ? `Choose Variant for: ${selectedProductForVariant.name}`
                                        : "Select Product to Add"}
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
                                                onChange={(e) =>
                                                    setProductSearchTerm(e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                                        {loadingProducts ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                                <Loader2 className="animate-spin w-4 h-4 text-green-600" />
                                                <p className="text-[11px] text-gray-400">
                                                    Loading catalog...
                                                </p>
                                            </div>
                                        ) : productList.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-4">
                                                No products found.
                                            </p>
                                        ) : (
                                            productList.map((prod: any) => (
                                                <div
                                                    key={prod.id}
                                                    onClick={() => {
                                                        if (
                                                            prod.variants &&
                                                            prod.variants.length > 0
                                                        ) {
                                                            setSelectedProductForVariant(prod);
                                                        } else {
                                                            handleAddVariantToOrder(prod, {
                                                                id: "default",
                                                                size: 1,
                                                                unit: "PCS",
                                                                price: 0,
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center gap-2.5 p-1.5 rounded border hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                                                >
                                                    <Image
                                                        src={prod.primaryImage || "/placeholder.png"}
                                                        alt={prod.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded object-cover"
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                                            {prod.name}
                                                        </p>

                                                        <p className="text-[10px] text-gray-500">
                                                            Variants available: {prod.variants?.length || 0}
                                                        </p>
                                                    </div>

                                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                        Choose
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    <p className="text-[11px] text-gray-500 mb-2">
                                        Select a specific variant / size / price for this item:
                                    </p>

                                    {selectedProductForVariant.variants.map((v: any) => (
                                        <div
                                            key={v.id}
                                            onClick={() =>
                                                handleAddVariantToOrder(
                                                    selectedProductForVariant,
                                                    v
                                                )
                                            }
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

                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Add Variant
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 text-xs"
                                        onClick={() =>
                                            setSelectedProductForVariant(null)
                                        }
                                    >
                                        ← Back to product search
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {sale && (
                    <SalesInvoice
                        sale={sale}
                        visible={showInvoice}
                        onClose={() => setShowInvoice(false)}
                    />
                )}
            </div>
        </div>
    );
}
