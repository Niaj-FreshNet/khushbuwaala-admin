'use client';

/**
 * Add Sale — fast, compact, responsive point-of-sale entry.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    Check,
    ChevronDown,
    ChevronsUpDown,
    Loader2,
    Minus,
    Plus,
    Receipt,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import productApi, { useGetAllProductsQuery, useSearchProductsQuery } from '@/redux/store/api/product/productApi';
import {
    useAddSaleMutation,
    useLazyGetSalesByCustomerQuery,
} from '@/redux/store/api/sales/salesApi';
import { useAuth } from '@/redux/store/hooks/useAuth';
import type { IProductVariantResponse } from '@/types/product.types';

/** What the sale form needs from a product: a full product or a search hit (search hits have no price) */
type SaleProduct = { id: string; name: string; primaryImage?: string; price?: number };
import InvoiceDialog, { InvoiceData } from '../_components/SaleInvoiceDialog';
import { apiErrorMessage } from "@/lib/apiError";
import { PAYMENT_METHODS } from '@/lib/paymentMethods';
import { PLATFORMS, type PlatformValue } from '@/lib/salePlatforms';
import { isOrderStatus, type OrderStatus } from '@/types/order.types';
import Thumb from "@/components/admin/Thumb";

// ───────────────────────── Config ─────────────────────────




const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'COMPLETED', label: 'Completed' },
];

// ───────────────────────── Helpers ─────────────────────────

interface LineItem {
    key: string;
    productId: string;
    variantId: string;
    qty: number;
    unitPrice: string;
}

let lineSeq = 0;
const newLine = (): LineItem => ({
    key: `line-${++lineSeq}`,
    productId: '',
    variantId: '',
    qty: 1,
    unitPrice: '',
});

const money = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const nowLocalInput = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const errMessage = (err: unknown) => apiErrorMessage(err, 'Failed to create sale');

function Field({
    label,
    error,
    className,
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <Label className="mb-1 block text-[11px] font-medium text-gray-600">{label}</Label>
            {children}
            {error && <p className="mt-0.5 text-[11px] text-red-600">{error}</p>}
        </div>
    );
}

// ───────────────────────── Product Combobox ─────────────────────────

function ProductCombobox({
    value,
    onSelect,
    invalid,
    products,
    onSearch,
    searchTerm,
    isSearching,
}: {
    value: string;
    onSelect: (id: string) => void;
    invalid?: boolean;
    products: SaleProduct[];
    onSearch: (term: string) => void;
    searchTerm: string;
    isSearching: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = products.find((p) => p.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    data-product-trigger
                    className={cn(
                        'h-9 w-full justify-between px-2.5 font-normal',
                        !selected && 'text-muted-foreground',
                        invalid && 'border-red-500'
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        {selected?.primaryImage && (
                            <Thumb src={selected.primaryImage} alt={selected.name} className="h-5 w-5 rounded object-cover border shrink-0" size={20} />
                        )}
                        <span className="truncate">{selected?.name ?? 'Search product…'}</span>
                    </span>
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="min-w-[280px] p-0"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type to search products..."
                        value={searchTerm}
                        onValueChange={onSearch}
                    />
                    <CommandList className="max-h-64">
                        {isSearching && <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>}
                        {!isSearching && products.length === 0 && <CommandEmpty>No product found.</CommandEmpty>}
                        <CommandGroup>
                            {products.map((p) => (
                                <CommandItem
                                    key={p.id}
                                    value={p.id}
                                    onSelect={() => {
                                        onSelect(p.id);
                                        setOpen(false);
                                    }}
                                >
                                    {p.primaryImage ? (
                                        <Thumb src={p.primaryImage} alt={p.name} className="mr-2 h-7 w-7 rounded object-cover border shrink-0" size={28} />
                                    ) : (
                                        <div className="mr-2 h-7 w-7 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                                            img
                                        </div>
                                    )}
                                    <span className="flex-1 truncate">{p.name}</span>
                                    <Check className={cn('ml-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ───────────────────────── Page ─────────────────────────

const AddSalesPage = () => {
    const { user } = useAuth();

    // Initial load via getAllProductsQuery
    const [searchTerm, setSearchTerm] = useState('');
    const { data: allProductsData, isLoading: isLoadingAll } = useGetAllProductsQuery({ limit: 100 });

    // Search query triggered conditionally only when typing
    const { data: searchResultData, isFetching: isSearching } = useSearchProductsQuery(
        { searchTerm: searchTerm.trim(), limit: 50 },
        { skip: !searchTerm.trim() }
    );

    // Resolve product list dynamically based on search status
    const products = useMemo<SaleProduct[]>(() => {
        if (!searchTerm.trim()) {
            return allProductsData?.data ?? [];
        }
        return searchResultData?.data ?? [];
    }, [searchTerm, allProductsData, searchResultData]);

    const productMap = useMemo(() => {
        const map = new Map<string, SaleProduct>();
        (allProductsData?.data ?? []).forEach((p) => map.set(p.id, p));
        products.forEach((p) => map.set(p.id, p));
        return map;
    }, [allProductsData, products]);

    const [addSale] = useAddSaleMutation();
    const [getProductVariants] = productApi.useLazyGetProductVariantsQuery();
    const [fetchCustomer] = useLazyGetSalesByCustomerQuery();

    // Items
    const [lines, setLines] = useState<LineItem[]>(() => [newLine()]);
    const [variantsMap, setVariantsMap] = useState<Record<string, IProductVariantResponse[]>>({});
    const [loadingVariants, setLoadingVariants] = useState<Record<string, boolean>>({});

    // Order meta
    const [platform, setPlatform] = useState<PlatformValue>('SHOWROOM');
    const [platformNote, setPlatformNote] = useState('');

    // Customer
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [reference, setReference] = useState('');
    const [showMore, setShowMore] = useState(false);
    const [saleTime, setSaleTime] = useState('');

    // Payment
    const [isPaid, setIsPaid] = useState(true);
    const [method, setMethod] = useState('cash');
    const [extraDiscount, setExtraDiscount] = useState('');
    const [extraDiscountMode, setExtraDiscountMode] = useState<'amount' | 'percent'>('amount');
    const [deliveryCharge, setDeliveryCharge] = useState('');
    const [status, setStatus] = useState<OrderStatus | ''>('');
    const [statusTouched, setStatusTouched] = useState(false);

    // UI
    const [attempted, setAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);

    useEffect(() => setSaleTime(nowLocalInput()), []);

    const effectiveStatus: OrderStatus | '' = statusTouched
        ? status
        : platform === 'SHOWROOM'
            ? 'COMPLETED'
            : 'PENDING';

    const patchLine = (key: string, patch: Partial<LineItem>) =>
        setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

    const addRow = () => {
        setLines((prev) => [...prev, newLine()]);
        setTimeout(() => {
            const triggers = document.querySelectorAll<HTMLElement>('[data-product-trigger]');
            triggers[triggers.length - 1]?.focus();
        }, 60);
    };

    const removeLastRow = () => {
        setLines((prev) => (prev.length > 1 ? prev.slice(0, -1) : [newLine()]));
    };

    const removeRow = (key: string) =>
        setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : [newLine()]));

    const selectProduct = async (key: string, productId: string) => {
        const product = productMap.get(productId);
        patchLine(key, { productId, variantId: '', qty: 1, unitPrice: String(product?.price ?? 0) });

        setLoadingVariants((s) => ({ ...s, [productId]: true }));
        try {
            const res = await getProductVariants(productId).unwrap();
            const list: IProductVariantResponse[] = res?.data ?? [];
            setVariantsMap((m) => ({ ...m, [productId]: list }));
            if (list.length === 1) {
                patchLine(key, {
                    variantId: list[0].id,
                    unitPrice: String(list[0].price ?? product?.price ?? 0),
                });
            }
        } catch (err) {
            console.error('Failed to fetch variants:', err);
            setVariantsMap((m) => ({ ...m, [productId]: [] }));
            toast.error('Could not load variants for this product');
        } finally {
            setLoadingVariants((s) => ({ ...s, [productId]: false }));
        }
    };

    const selectVariant = (key: string, productId: string, variantId: string) => {
        const v = variantsMap[productId]?.find((x) => x.id === variantId);
        patchLine(key, {
            variantId,
            ...(v?.price != null ? { unitPrice: String(v.price) } : {}),
        });
    };

    const computed = useMemo(
        () =>
            lines.map((line) => {
                const product = productMap.get(line.productId);
                const variant = variantsMap[line.productId]?.find((v) => v.id === line.variantId);
                const listUnit = Number(variant?.price ?? product?.price ?? 0);
                const unit = parseFloat(line.unitPrice) || 0;
                const listTotal = listUnit * line.qty;
                const total = unit * line.qty;
                const discount = listTotal - total;
                const pct = listTotal > 0 ? (discount / listTotal) * 100 : 0;
                return { line, product, variant, listUnit, unit, listTotal, total, discount, pct };
            }),
        [lines, productMap, variantsMap]
    );

    const active = computed.filter((c) => c.line.productId);
    const itemsTotal = active.reduce((s, c) => s + c.total, 0);
    const listTotal = active.reduce((s, c) => s + c.listTotal, 0);
    const itemSaving = listTotal - itemsTotal;
    const extraInput = Math.max(0, parseFloat(extraDiscount) || 0);

    const extra = extraDiscountMode === 'percent'
        ? (itemsTotal * extraInput) / 100
        : extraInput;

    const extraDiscountPercent = itemsTotal > 0
        ? (extra / itemsTotal) * 100
        : 0;
    const delivery = Math.max(0, parseFloat(deliveryCharge) || 0);
    const grandTotal = Math.max(0, itemsTotal - extra + delivery);

    const errors = useMemo(() => {
        const e: { cart?: string; items: Record<string, string>; phone?: string; method?: string } = {
            items: {},
        };
        if (!active.length) e.cart = 'Add at least one product';
        active.forEach(({ line }) => {
            const variants = variantsMap[line.productId];
            if (variants === undefined && line.productId) e.items[line.key] = 'Loading variants…';
            else if (variants?.length && !line.variantId) e.items[line.key] = 'Select a variant';
            else if (!(parseFloat(line.unitPrice) >= 0)) e.items[line.key] = 'Enter a valid price';
        });
        if (platform !== 'SHOWROOM' && !phone.trim()) e.phone = 'Phone is required for remote orders';
        else if (phone.trim() && !/^\+?[\d\s-]{7,16}$/.test(phone.trim())) e.phone = 'Invalid phone number';
        if (isPaid && !method) e.method = 'Select a payment method';
        return e;
    }, [active, variantsMap, platform, phone, isPaid, method]);

    const handlePhoneBlur = async () => {
        const p = phone.replace(/[\s-]/g, '');
        if (p.length < 11 || (name && address)) return;
        try {
            const res = await fetchCustomer(p).unwrap();
            const last = res?.data?.data?.[0];
            if (!last) return;
            if (!name && last.name) setName(last.name);
            if (!address && last.address) setAddress(last.address);
            if (!email && last.email) setEmail(last.email);
            toast.info(`Returning customer${last.name ? `: ${last.name}` : ''}`);
        } catch {
            /* lookup convenience */
        }
    };

    const resetForm = () => {
        setLines([newLine()]);
        setPlatform('SHOWROOM');
        setPlatformNote('');
        setPhone('');
        setName('');
        setAddress('');
        setEmail('');
        setReference('');
        setShowMore(false);
        setSaleTime(nowLocalInput());
        setIsPaid(true);
        setMethod('cash');
        setExtraDiscount('');
        setExtraDiscountMode('amount');
        setDeliveryCharge('');
        setStatus('');
        setStatusTouched(false);
        setAttempted(false);
    };

    const handleSubmit = async () => {
        if (submitting || invoice) return;
        setAttempted(true);
        const firstError =
            errors.cart || Object.values(errors.items)[0] || errors.phone || errors.method;
        if (firstError) {
            toast.error(firstError);
            return;
        }

        setSubmitting(true);
        try {
            // One request: the backend creates the sale lines inside the sale transaction.
            // `price` is the UNIT selling price the salesman entered.
            const items = active.map((c) => ({
                productId: c.line.productId,
                variantId: c.variant?.id ?? undefined,
                quantity: c.line.qty,
                price: c.unit,
                originalPrice: c.listUnit,
            }));

            const customerName = name.trim() || 'Random';
            const when = saleTime ? new Date(saleTime).toISOString() : new Date().toISOString();
            const platformMeta = PLATFORMS.find((p) => p.value === platform)!;
            const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label;

            const res = await addSale({
                items,
                amount: grandTotal,
                isPaid,
                method: method || undefined,
                saleBy: user?.name,
                saleType: 'SINGLE',
                orderSource: platform === 'SHOWROOM' ? 'SHOWROOM' : 'MANUAL',
                platform,
                platformNote: platform === 'OTHER' ? platformNote.trim() || undefined : undefined,
                status: effectiveStatus || undefined,
                saleTime: when,
                discount: extra,
                deliveryCharge: delivery,
                customerInfo: {
                    name: customerName,
                    phone: phone.trim(),
                    address: address.trim(),
                    email: email.trim(),
                    reference: reference.trim(),
                },
            }).unwrap();

            if (!res?.success) throw new Error(res?.message || 'Sale creation failed');

            const order = res.data;
            toast.success('Sale saved');
            setInvoice({
                invoiceNo: String(order?.invoice ?? ''),
                date: order?.orderTime ?? when,
                platform: platformMeta.full + (platform === 'OTHER' && platformNote.trim() ? ` (${platformNote.trim()})` : ''),
                soldBy: user?.name ?? '',
                customer: {
                    name: customerName,
                    phone: phone.trim(),
                    address: address.trim(),
                    email: email.trim(),
                },
                items: active.map((c) => ({
                    name: c.product?.name ?? 'Item',
                    variant: c.variant ? `${c.variant.size ?? ''} ${c.variant.unit ?? ''}`.trim() : undefined,
                    qty: c.line.qty,
                    unitPrice: c.unit,
                    listUnitPrice: c.listUnit,
                    total: c.total,
                })),
                subtotal: itemsTotal,
                discount: extra,
                deliveryCharge: delivery,
                total: grandTotal,
                isPaid,
                method: methodLabel,
            });
            resetForm();
        } catch (err) {
            console.error('Sale creation error:', err);
            toast.error(errMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const submitRef = useRef(handleSubmit);
    submitRef.current = handleSubmit;
    const addRowRef = useRef(addRow);
    addRowRef.current = addRow;
    const removeLastRowRef = useRef(removeLastRow);
    removeLastRowRef.current = removeLastRow;

    // Keyboard Shortcuts: Ctrl + Enter, Ctrl + +, Ctrl + -, Alt + N
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submitRef.current();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                addRowRef.current();
            } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                removeLastRowRef.current();
            } else if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                addRowRef.current();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const saveLabel = `Save sale · ৳${money(grandTotal)}`;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 lg:pb-6">
            <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">New sale</h1>
                        <p className="text-xs text-gray-500">
                            Sold by {user?.name ?? '—'}
                            <span className="hidden sm:inline"> · Ctrl + Enter to save · Ctrl + Plus/Minus to add/remove items</span>
                        </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="text-gray-600 hover:text-green-700">
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
                    </Button>
                </div>

                <section className="mb-3 rounded-xl border bg-white p-3 shadow-2xs">
                    <div className="mb-1.5 flex items-baseline justify-between">
                        <h2 className="text-xs font-bold text-gray-700">Where did the order come from?</h2>
                        <span className="text-[11px] text-gray-400">Default: Showroom</span>
                    </div>
                    <div
                        role="radiogroup"
                        aria-label="Order platform"
                        className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {PLATFORMS.map((p) => {
                            const Icon = p.icon;
                            const on = platform === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    onClick={() => setPlatform(on && p.value !== 'SHOWROOM' ? 'SHOWROOM' : p.value)}
                                    className={cn(
                                        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition',
                                        on
                                            ? 'border-green-600 bg-green-600 text-white shadow-xs'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                    {platform === 'OTHER' && (
                        <Input
                            value={platformNote}
                            onChange={(e) => setPlatformNote(e.target.value)}
                            placeholder="Which platform? (e.g. Instagram, Daraz, reference)"
                            className="mt-2 h-9 focus-visible:ring-green-600"
                        />
                    )}
                </section>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_370px]">
                    <section className="self-start rounded-xl border bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b px-3 py-2 bg-gray-50/50">
                            <h2 className="text-sm font-bold text-gray-800">
                                Items <span className="font-normal text-gray-400">({active.length})</span>
                            </h2>
                            <Button
                                type="button"
                                size="sm"
                                onClick={addRow}
                                className="h-8 bg-green-600 hover:bg-green-700 text-white font-semibold"
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add item
                            </Button>
                        </div>

                        <div className="hidden grid-cols-12 gap-2 px-3 pt-2 text-[11px] font-semibold text-gray-500 md:grid">
                            <div className="col-span-5">Product</div>
                            <div className="col-span-2">Variant</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-2">Unit price</div>
                            <div className="col-span-1 text-right">Total</div>
                        </div>


                        <div className="divide-y divide-gray-100">
                            {computed.map(({ line, listUnit, listTotal: lt, total, discount, pct }) => {
                                const variants = variantsMap[line.productId] ?? [];
                                const rowError = attempted ? errors.items[line.key] : undefined;

                                return (
                                    <div
                                        key={line.key}
                                        className="grid grid-cols-12 gap-x-2 gap-y-1.5 px-3 py-2.5 items-center"
                                    >
                                        {/* Product */}
                                        <div className="col-span-12 md:col-span-5 flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <span className="mb-0.5 block text-[11px] font-medium text-gray-500 md:hidden">
                                                    Product
                                                </span>
                                                <ProductCombobox
                                                    value={line.productId}
                                                    onSelect={(id) => selectProduct(line.key, id)}
                                                    invalid={!!rowError}
                                                    products={products}
                                                    onSearch={setSearchTerm}
                                                    searchTerm={searchTerm}
                                                    isSearching={isSearching || isLoadingAll}
                                                />
                                            </div>
                                        </div>

                                        {/* Variant */}
                                        <div className="col-span-6 md:col-span-2">
                                            <span className="mb-0.5 block text-[11px] font-medium text-gray-500 md:hidden">
                                                Variant
                                            </span>
                                            <Select
                                                value={line.variantId}
                                                disabled={!line.productId}
                                                onValueChange={(v) => selectVariant(line.key, line.productId, v)}
                                            >
                                                <SelectTrigger className="h-9 w-full">
                                                    <SelectValue
                                                        placeholder={loadingVariants[line.productId] ? 'Loading…' : 'Select'}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {variants.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            {loadingVariants[line.productId] ? 'Loading…' : 'No variants'}
                                                        </div>
                                                    ) : (
                                                        variants.map((v) => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.size} {v.unit}
                                                                {v.price != null ? ` · ৳${money(Number(v.price))}` : ''}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-6 md:col-span-2">
                                            <span className="mb-0.5 block text-[11px] font-medium text-gray-500 md:hidden">
                                                Qty
                                            </span>
                                            <div className="flex h-9 items-center rounded-md border bg-white">
                                                <button
                                                    type="button"
                                                    aria-label="Decrease quantity"
                                                    onClick={() => patchLine(line.key, { qty: Math.max(1, line.qty - 1) })}
                                                    className="flex h-full w-9 shrink-0 items-center justify-center rounded-l-md text-gray-600 hover:bg-gray-100"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <input
                                                    inputMode="numeric"
                                                    aria-label="Quantity"
                                                    value={line.qty}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) =>
                                                        patchLine(line.key, {
                                                            qty: Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1),
                                                        })
                                                    }
                                                    className="h-full w-full min-w-0 border-0 bg-transparent text-center text-sm outline-none font-semibold"
                                                />
                                                <button
                                                    type="button"
                                                    aria-label="Increase quantity"
                                                    onClick={() => patchLine(line.key, { qty: line.qty + 1 })}
                                                    className="flex h-full w-9 shrink-0 items-center justify-center rounded-r-md text-gray-600 hover:bg-gray-100"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Unit Price */}
                                        <div className="col-span-6 md:col-span-2">
                                            <span className="mb-0.5 block text-[11px] font-medium text-gray-500 md:hidden">
                                                Unit price (৳)
                                            </span>
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                min={0}
                                                aria-label="Unit price"
                                                value={line.unitPrice}
                                                placeholder={listUnit ? String(listUnit) : '0'}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => patchLine(line.key, { unitPrice: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        if (line.productId) addRow();
                                                    }
                                                }}
                                                className="h-9"
                                            />
                                        </div>

                                        {/* Total + Remove */}
                                        <div className="col-span-6 md:col-span-1 flex items-center justify-between md:justify-end gap-1 min-w-0">
                                            <span className="text-[11px] text-gray-500 md:hidden">
                                                Total
                                            </span>

                                            <div className="flex items-center justify-end gap-0.5 min-w-0">
                                                <span className="text-sm font-bold tabular-nums text-gray-900 whitespace-nowrap">
                                                    ৳{money(total)}
                                                </span>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Remove item"
                                                    onClick={() => removeRow(line.key)}
                                                    className="h-8 w-8 shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Discount information */}
                                        {line.productId && Math.abs(discount) > 0.005 && (
                                            <p
                                                className={cn(
                                                    'col-span-12 text-[11px] pl-0.5',
                                                    discount > 0 ? 'text-emerald-600' : 'text-amber-600'
                                                )}
                                            >
                                                List ৳{money(listUnit)} × {line.qty} = ৳{money(lt)} ·{' '}
                                                {discount > 0
                                                    ? `Discount ৳${money(discount)} (${pct.toFixed(1)}%)`
                                                    : `Above list by ৳${money(-discount)}`}
                                            </p>
                                        )}

                                        {/* Validation error */}
                                        {rowError && (
                                            <p className="col-span-12 text-[11px] text-red-600">
                                                {rowError}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>


                        {attempted && errors.cart && (
                            <p className="px-3 pb-2 text-xs text-red-600">{errors.cart}</p>
                        )}
                        <div className="border-t px-3 py-2 bg-gray-50/30">
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-green-300 text-sm font-semibold text-green-700 hover:bg-green-50 transition"
                            >
                                <Plus className="h-4 w-4" /> Add another item <span className="text-xs text-gray-400 font-normal">(Ctrl + +)</span>
                            </button>
                        </div>
                    </section>

                    <div className="space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100dvh-1.5rem)] lg:self-start lg:overflow-y-auto">
                        <section className="rounded-xl border bg-white p-3 shadow-2xs">
                            <h2 className="mb-2 text-sm font-bold text-gray-800">Customer</h2>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label={platform === 'SHOWROOM' ? 'Phone' : 'Phone *'} error={attempted ? errors.phone : undefined}>
                                    <Input
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="off"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onBlur={handlePhoneBlur}
                                        placeholder="01XXXXXXXXX"
                                        className={cn('h-9', attempted && errors.phone && 'border-red-500')}
                                    />
                                </Field>
                                <Field label="Name">
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Walk-in customer"
                                        className="h-9"
                                    />
                                </Field>
                            </div>
                            <Field label="Address" className="mt-2">
                                <Textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={2}
                                    placeholder={platform === 'SHOWROOM' ? 'Optional' : 'Delivery address'}
                                    className="min-h-0 resize-none py-1.5 text-sm"
                                />
                            </Field>

                            <button
                                type="button"
                                onClick={() => setShowMore((s) => !s)}
                                aria-expanded={showMore}
                                className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800"
                            >
                                <ChevronDown className={cn('h-3.5 w-3.5 transition', showMore && 'rotate-180')} />
                                More details
                            </button>
                            {showMore && (
                                <div className="mt-2 grid grid-cols-2 gap-2 pt-1 border-t">
                                    <Field label="Sale time" className="col-span-2">
                                        <Input
                                            type="datetime-local"
                                            value={saleTime}
                                            onChange={(e) => setSaleTime(e.target.value)}
                                            className="h-9"
                                        />
                                    </Field>
                                    <Field label="Email">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Optional"
                                            className="h-9"
                                        />
                                    </Field>
                                    <Field label="Reference">
                                        <Input
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Optional"
                                            className="h-9"
                                        />
                                    </Field>
                                    <Field label="Order status" className="col-span-2">
                                        <Select
                                            value={effectiveStatus}
                                            onValueChange={(v) => {
                                                setStatus(isOrderStatus(v) ? v : '');
                                                setStatusTouched(true);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_OPTIONS.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border bg-white p-3 shadow-2xs">
                            <h2 className="mb-2 text-sm font-bold text-gray-800">Payment</h2>

                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    role="radiogroup"
                                    aria-label="Payment status"
                                    className="col-span-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
                                >
                                    {[
                                        { v: true, label: 'Paid', on: 'bg-green-700 text-white shadow-xs' },
                                        { v: false, label: 'Due', on: 'bg-red-600 text-white shadow-xs' },
                                    ].map((o) => (
                                        <button
                                            key={o.label}
                                            type="button"
                                            role="radio"
                                            aria-checked={isPaid === o.v}
                                            onClick={() => setIsPaid(o.v)}
                                            className={cn(
                                                'h-8 rounded-md text-sm font-bold transition',
                                                isPaid === o.v ? o.on : 'text-gray-600 hover:bg-white'
                                            )}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>

                                <Field
                                    label={isPaid ? 'Payment method' : 'Method (optional)'}
                                    className="col-span-2"
                                    error={attempted ? errors.method : undefined}
                                >
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="h-9 w-full">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>


                                <Field label={`Extra discount (${extraDiscountMode === 'amount' ? '৳' : '%'})`}>
                                    <div className="flex h-9">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            max={extraDiscountMode === 'percent' ? 100 : undefined}
                                            value={extraDiscount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setExtraDiscount(e.target.value)}
                                            placeholder="0"
                                            className="h-9 rounded-r-none"
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 w-11 shrink-0 rounded-l-none px-2 font-semibold"
                                            onClick={() => {
                                                const nextMode = extraDiscountMode === 'amount' ? 'percent' : 'amount';

                                                setExtraDiscount((current) => {
                                                    const value = Math.max(0, parseFloat(current) || 0);

                                                    if (nextMode === 'percent') {
                                                        return itemsTotal > 0
                                                            ? ((value / itemsTotal) * 100).toFixed(2)
                                                            : '';
                                                    }

                                                    return ((itemsTotal * value) / 100).toFixed(2);
                                                });

                                                setExtraDiscountMode(nextMode);
                                            }}
                                        >
                                            {extraDiscountMode === 'amount' ? '%' : '৳'}
                                        </Button>
                                    </div>

                                    <p className="mt-1 text-[10px] text-gray-500">
                                        {extraDiscountMode === 'amount'
                                            ? `Equivalent to ${money(extraDiscountPercent)}% discount`
                                            : `Discount amount: ৳${money(extra)}`}
                                    </p>
                                </Field>

                                <Field label="Delivery charge (৳)">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        value={deliveryCharge}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setDeliveryCharge(e.target.value)}
                                        placeholder="0"
                                        className="h-9"
                                    />
                                </Field>
                            </div>

                            <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <dt>Items total</dt>
                                    <dd className="tabular-nums font-semibold">৳{money(itemsTotal)}</dd>
                                </div>
                                {itemSaving > 0.005 && (
                                    <div className="flex justify-between text-xs text-emerald-600 font-medium">
                                        <dt>Saved vs list price</dt>
                                        <dd className="tabular-nums">৳{money(itemSaving)}</dd>
                                    </div>
                                )}
                                {extra > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <dt>Extra discount</dt>
                                        <dd className="tabular-nums text-red-600">−৳{money(extra)}</dd>
                                    </div>
                                )}
                                {delivery > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <dt>Delivery</dt>
                                        <dd className="tabular-nums">৳{money(delivery)}</dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t pt-2 text-base font-bold text-gray-900">
                                    <dt>Total</dt>
                                    <dd className="tabular-nums text-green-700 text-lg">৳{money(grandTotal)}</dd>
                                </div>
                            </dl>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="mt-3 hidden h-11 w-full bg-green-700 text-base font-bold text-white hover:bg-green-800 lg:flex shadow-xs"
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Receipt className="mr-2 h-4 w-4" />
                                )}
                                {submitting ? 'Saving…' : saveLabel}
                            </Button>
                        </section>
                    </div>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden shadow-lg">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500">
                            {active.length} item{active.length === 1 ? '' : 's'} · {isPaid ? 'Paid' : 'Due'}
                        </div>
                        <div className="text-lg font-bold leading-tight tabular-nums text-green-700">
                            ৳{money(grandTotal)}
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-11 flex-1 bg-green-700 text-base font-bold text-white hover:bg-green-800 shadow-xs"
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Receipt className="mr-2 h-4 w-4" />
                        )}
                        {submitting ? 'Saving…' : 'Save sale'}
                    </Button>
                </div>
            </div>

            <InvoiceDialog
                open={!!invoice}
                onOpenChange={(o) => !o && setInvoice(null)}
                data={invoice}
                title="Sale saved"
            />
        </div>
    );
};

export default AddSalesPage;