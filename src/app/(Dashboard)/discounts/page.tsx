/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, useFormContext, SubmitHandler } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash, Copy, Tag, Loader2, Sparkles, Calendar } from 'lucide-react';
import { MobileCard, MobileCardList, MobileField } from '@/components/admin/MobileCards';

import {
  useGetAllDiscountsAdminQuery,
  useDeleteDiscountMutation,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useGetDiscountByIdQuery,
} from '@/redux/store/api/discount/discountApi';
import {
  useGetAllProductsAdminQuery,
  useGetProductVariantsQuery,
} from '@/redux/store/api/product/productApi';
import FormInput from '@/components/ReusableUI/FormInput';
import { cn } from '@/lib/utils';

/* ================= TYPES & ZOD SCHEMA ================= */
const localInputToISO = (value?: string) => {
  if (!value || !value.trim()) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const schema = z
  .object({
    scope: z.enum(["ORDER", "PRODUCT", "VARIANT"]).default("PRODUCT"),
    productId: z.string().optional(),
    variantId: z.string().optional(),
    code: z.string().optional(),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().positive("Enter a positive number"),
    maxUsage: z.union([z.string().transform((val) => (val === "" ? undefined : parseInt(val))), z.number(), z.undefined()]).optional(),
    startDate: z.string().default(""),
    endDate: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "ORDER" && !data.code?.trim()) {
      ctx.addIssue({ code: "custom", path: ["code"], message: "Coupon code is required for order discount" });
    }
    if (data.scope === "PRODUCT" && !data.productId?.trim()) {
      ctx.addIssue({ code: "custom", path: ["productId"], message: "Product is required" });
    }
    if (data.scope === "VARIANT") {
      if (!data.productId?.trim()) ctx.addIssue({ code: "custom", path: ["productId"], message: "Product is required" });
      if (!data.variantId?.trim()) ctx.addIssue({ code: "custom", path: ["variantId"], message: "Variant is required" });
    }
    if (data.startDate && data.endDate) {
      const s = new Date(data.startDate);
      const e = new Date(data.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after start date" });
      }
    }
  });

type FormData = z.infer<typeof schema>;

function computeDiscountPreview(opts: { originalPrice: number; type: "percentage" | "fixed"; value: number }) {
  const { originalPrice, type, value } = opts;
  const parsedValue = Number(value || 0);
  if (!parsedValue || parsedValue <= 0 || originalPrice <= 0) {
    return { originalPrice: Math.round(originalPrice), discountAmount: 0, discountPercent: 0, finalPrice: Math.round(originalPrice) };
  }
  let discountAmount = type === "percentage" ? (originalPrice * parsedValue) / 100 : parsedValue;
  let finalPrice = Math.max(0, originalPrice - discountAmount);
  let discountPercent = type === "percentage" ? parsedValue : (discountAmount / originalPrice) * 100;

  return {
    originalPrice: Math.round(originalPrice),
    discountAmount: Math.round(discountAmount),
    discountPercent: Math.round(discountPercent * 10) / 10,
    finalPrice: Math.round(finalPrice),
  };
}

/* ================= PRODUCT & VARIANT SEARCH PICKER COMPONENT ================= */
const ProductSearchAndVariantPicker = () => {
  const { watch, setValue } = useFormContext<FormData>();
  const scope = watch("scope");
  const productId = watch("productId");
  const variantId = watch("variantId");
  const type = watch("type");
  const value = watch("value");

  const [productSearch, setProductSearch] = useState("");
  const [selectedProductName, setSelectedProductName] = useState("");
  const prevProductIdRef = useRef<string>("");

  // Fetch products dynamically based on search query
  const { data: productsData, isLoading: isProductsLoading, isFetching: isProductsFetching } = useGetAllProductsAdminQuery({
    searchTerm: productSearch.trim(),
    page: 1,
    limit: 50,
  });

  const rawProducts = (productsData as any)?.data || [];

  const products = useMemo(() => {
    if (!productSearch.trim()) return rawProducts;
    const q = productSearch.toLowerCase().trim();
    return rawProducts.filter((p: any) => p.name?.toLowerCase().includes(q));
  }, [rawProducts, productSearch]);

  const shouldFetchVariants = Boolean(scope !== "ORDER" && productId?.trim());
  const { data: variantsData, isLoading: isVariantsLoading, isFetching: isVariantsFetching, error } = useGetProductVariantsQuery(productId as string, { skip: !shouldFetchVariants });

  useEffect(() => {
    if (!productId) return;
    if (prevProductIdRef.current && productId !== prevProductIdRef.current) {
      setValue("variantId", "", { shouldValidate: false });
    }
    prevProductIdRef.current = productId;
  }, [productId, setValue]);

  if (scope === "ORDER") return null;

  const variants = Array.isArray((variantsData as any)?.data) ? (variantsData as any).data : [];
  const selectedVariant = variants.find((v: any) => v.id === variantId);
  const minPrice = variants.length ? Math.min(...variants.map((v: any) => Number(v.price || 0))) : 0;
  const previewBasePrice = scope === "PRODUCT" ? minPrice : Number(selectedVariant?.price ?? 0);
  const preview = computeDiscountPreview({ originalPrice: previewBasePrice, type, value: Number(value || 0) });

  return (
    <div className="space-y-3">
      {/* Searchable Product Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-gray-700">Search & Select Product *</label>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <Input
            placeholder="Type product name to filter below..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              if (!e.target.value) {
                setValue("productId", "", { shouldValidate: true });
                setSelectedProductName("");
              }
            }}
            className="pl-8 h-8 text-xs bg-white border-gray-300 shadow-2xs"
          />
        </div>

        {selectedProductName && (
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between bg-emerald-50 px-2.5 py-1 rounded-md">
            <span>Selected: {selectedProductName}</span>
            <button
              type="button"
              onClick={() => { setSelectedProductName(""); setValue("productId", ""); }}
              className="text-rose-600 hover:underline text-[10px]"
            >
              Change
            </button>
          </div>
        )}

        {/* ALWAYS VISIBLE INLINE RESULTS CONTAINER WITH SPIN LOADING */}
        {!selectedProductName && (
          <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm max-h-44 overflow-y-auto divide-y divide-gray-50 relative">
            {isProductsLoading || isProductsFetching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-gray-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Searching products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-xs">No products found matching "{productSearch}"</div>
            ) : (
              products.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setValue("productId", p.id, { shouldValidate: true });
                    setSelectedProductName(p.name);
                    setProductSearch("");
                  }}
                  className="px-3 py-2 text-xs text-gray-800 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">Stock: {p.totalStock}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Variant Selector */}
      {scope === "VARIANT" && shouldFetchVariants && (
        <div className="space-y-1">
          {isVariantsLoading || isVariantsFetching ? (
            <div className="p-3 flex items-center justify-center gap-2 text-gray-500 text-xs bg-gray-50 rounded-lg border border-gray-200">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading product variants...</span>
            </div>
          ) : error ? (
            <div className="p-2 bg-rose-50 text-rose-800 text-[11px] rounded">Failed to load variants.</div>
          ) : variants.length === 0 ? (
            <div className="p-2 bg-gray-50 text-gray-500 text-[11px] rounded">No variants available for this product.</div>
          ) : (
            <FormInput
              name="variantId"
              label="Select Variant *"
              type="select"
              options={variants.map((v: any) => ({
                value: v.id,
                label: `${selectedProductName} - ${v.size}${v.unit} - ${Math.round(v.price)} BDT`,
              }))}
              placeholder="Choose variant..."
              required
              inputClassName="border-gray-300 text-xs h-8 bg-white"
            />
          )}
        </div>
      )}

      {/* Live Preview Box */}
      {Number(value || 0) > 0 && previewBasePrice > 0 && (
        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-gray-900 flex justify-between">
            <span>Base Reference Price:</span> <span>{preview.originalPrice} BDT</span>
          </p>
          <p className="font-semibold text-emerald-700 flex justify-between">
            <span>Discount Amount:</span> <span>-{preview.discountAmount} BDT ({preview.discountPercent}%)</span>
          </p>
          <p className="font-bold text-gray-900 flex justify-between border-t border-emerald-200/60 pt-1">
            <span>Estimated Final Price:</span> <span className="text-emerald-600">{preview.finalPrice} BDT</span>
          </p>
        </div>
      )}
    </div>
  );
};

/* ================= MAIN DISCOUNT COMPONENT ================= */
export default function DiscountManagementPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetAllDiscountsAdminQuery();
  const [deleteDiscount] = useDeleteDiscountMutation();
  const [createDiscount, { isLoading: isCreating }] = useCreateDiscountMutation();
  const [updateDiscount, { isLoading: isUpdating }] = useUpdateDiscountMutation();

  const {
    data: discountRes,
  } = useGetDiscountByIdQuery(editingId as string, { skip: !editingId });

  const activeDiscount = (discountRes as any)?.data ?? discountRes;

  const methods = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      code: "",
      type: "percentage",
      value: 10,
      maxUsage: undefined,
      startDate: "",
      endDate: "",
    },
    mode: "onChange",
  });

  // Populate form on edit
  useEffect(() => {
    if (!editingId || !activeDiscount) return;
    methods.reset({
      scope: activeDiscount.scope || "PRODUCT",
      productId: activeDiscount.productId || "",
      variantId: activeDiscount.variantId || "",
      code: activeDiscount.code || "",
      type: activeDiscount.type || "percentage",
      value: Number(activeDiscount.value ?? 0),
      maxUsage: activeDiscount.maxUsage ?? undefined,
      startDate: toLocalInput(activeDiscount.startDate),
      endDate: toLocalInput(activeDiscount.endDate),
    });
  }, [editingId, activeDiscount, methods]);

  const discounts = useMemo(() => (Array.isArray(data) ? data : (data as any)?.data || []), [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return discounts.filter((d: any) => {
      const code = d.code?.toLowerCase() || '';
      const productName = d.product?.name?.toLowerCase() || '';
      return code.includes(q) || productName.includes(q);
    });
  }, [discounts, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      await deleteDiscount(id).unwrap();
      toast.success('Discount deleted successfully.');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete discount.');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    methods.reset({
      scope: "PRODUCT",
      productId: "",
      variantId: "",
      code: "",
      type: "percentage",
      value: 10,
      maxUsage: undefined,
      startDate: "",
      endDate: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      const submitData = {
        ...formData,
        code: formData.code?.trim() ? formData.code.trim().toUpperCase() : undefined,
        productId: formData.scope === "ORDER" ? undefined : formData.productId,
        variantId: formData.scope === "VARIANT" ? formData.variantId : undefined,
        maxUsage: formData.maxUsage || undefined,
        startDate: localInputToISO(formData.startDate),
        endDate: localInputToISO(formData.endDate),
      };

      if (editingId) {
        await updateDiscount({ id: editingId, data: submitData }).unwrap();
        toast.success("Discount updated successfully!");
      } else {
        await createDiscount(submitData).unwrap();
        toast.success("Discount created successfully!");
      }

      setModalOpen(false);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save discount.");
    }
  };

  const scopeVal = methods.watch("scope");
  const codeVal = methods.watch("code");

  const badgeInfo = useMemo(() => {
    if (scopeVal === "ORDER") return { text: "Cart Total Coupon", cls: "bg-purple-600" };
    if (codeVal?.trim()) return { text: "Promo Code", cls: "bg-blue-600" };
    return { text: "Auto-Applied", cls: "bg-emerald-600" };
  }, [scopeVal, codeVal]);

  const getStatus = (d: any) => {
    const now = Date.now();
    const start = d.startDate ? new Date(d.startDate).getTime() : null;
    const end = d.endDate ? new Date(d.endDate).getTime() : null;
    if (!start && !end) return 'Active';
    if (start && start > now) return 'Scheduled';
    if (end && end < now) return 'Expired';
    return 'Active';
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-6 py-4 flex flex-col text-xs">
      {/* Top Header Bar with Main Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Discounts & Promotions</h1>
            <p className="text-[10px] text-gray-500">Manage coupon codes, automatic sales, and promotional pricing structures</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder="Search by code or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-white border-gray-300 shadow-2xs"
            />
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white h-8 text-xs px-4 font-semibold shrink-0 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Discount
          </Button>
        </div>
      </div>

      {/* Table Container with full responsiveness */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        {/* PHONE: cards */}
        <MobileCardList
          className="bg-gray-50/60 p-2"
          isLoading={isLoading}
          isEmpty={!isLoading && filtered.length === 0}
          emptyText="No discounts found."
        >
          {filtered.map((d: any) => {
            const status = getStatus(d);
            const isPromo = !!d.code?.trim();
            const amount = d.type === 'percentage' ? `${d.value}% off` : `৳${d.value} off`;
            const target =
              d.scope === 'ORDER' ? 'Entire order' : `${d.product?.name || 'Product'}${d.variant ? ` · ${d.variant.size}${d.variant.unit}` : ''}`;
            return (
              <MobileCard
                key={d.id}
                title={isPromo ? `Code ${d.code}` : 'Automatic sale'}
                subtitle={target}
                badge={
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold text-white', status === 'Active' ? 'bg-emerald-600' : status === 'Expired' ? 'bg-rose-600' : 'bg-amber-500')}>
                    {status}
                  </span>
                }
                actions={
                  <>
                    {isPromo && (
                      <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" onClick={() => copyText(d.code)}>
                        <Copy className="mr-1 h-4 w-4" /> Copy code
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" onClick={() => handleOpenEdit(d.id)}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 text-rose-600" aria-label="Delete discount" onClick={() => handleDelete(d.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                }
              >
                <MobileField label="Discount"><span className="font-bold text-emerald-700">{amount}</span></MobileField>
                <MobileField label="Used">{d.usedCount ?? 0}{d.maxUsage ? ` / ${d.maxUsage}` : ''}</MobileField>
                {(d.startDate || d.endDate) && (
                  <MobileField label="Runs" full>
                    {d.startDate ? new Date(d.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Now'} →{' '}
                    {d.endDate ? new Date(d.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No end'}
                  </MobileField>
                )}
              </MobileCard>
            );
          })}
        </MobileCardList>

        {/* DESKTOP: table */}
        <div className="hidden md:block overflow-x-auto w-full flex-1">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="py-3 pl-4 font-bold text-xs whitespace-nowrap">Code / Type</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Status</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Scope</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Target Product / Variant</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Value</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Validity Range</TableHead>
                <TableHead className="py-3 font-bold text-xs whitespace-nowrap">Usage</TableHead>
                <TableHead className="py-3 pr-4 font-bold text-xs text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-3 pl-4"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="py-3 pr-4 text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-xs">No active discounts found.</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Click "Add Discount" above to set up a new campaign.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d: any) => {
                  const status = getStatus(d);
                  const isPromo = !!d.code?.trim();

                  return (
                    <TableRow key={d.id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell className="py-3 pl-4 font-medium whitespace-nowrap">
                        {isPromo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{d.code}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-gray-700" onClick={() => copyText(d.code)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Automatic Sale
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <Badge className={cn("text-[10px] font-bold px-2 py-0.5 shadow-2xs",
                          status === 'Active' ? 'bg-emerald-600 text-white' : status === 'Scheduled' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                        )}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-gray-700 whitespace-nowrap">
                        {d.scope}
                      </TableCell>
                      <TableCell className="py-3 max-w-[220px]">
                        <span className="font-bold text-gray-900 block truncate">{d.product?.name || 'Entire Order / Cart'}</span>
                        {d.variant && <span className="text-[10px] text-gray-500 font-mono block truncate">SKU: {d.variant.sku} ({d.variant.size}{d.variant.unit})</span>}
                      </TableCell>
                      <TableCell className="py-3 font-bold text-emerald-700 whitespace-nowrap">
                        {d.type === 'percentage' ? `${Math.round(Number(d.value))}% OFF` : `৳${Math.round(Number(d.value))} OFF`}
                      </TableCell>
                      <TableCell className="py-3 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{d.startDate ? format(new Date(d.startDate), 'dd MMM yyyy, hh:mm a') : 'Always'} → {d.endDate ? format(new Date(d.endDate), 'dd MMM yyyy, hh:mm a') : 'No expiry'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-gray-600 whitespace-nowrap">
                        {d.usedCount ?? 0} / {d.maxUsage == null ? '∞' : d.maxUsage}
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(d.id)} title="Edit Discount">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(d.id)} title="Delete Discount">
                            <Trash className="w-3.5 h-3.5" />
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
      </div>

      {/* CREATE / EDIT SLIDER DIALOG MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-2.5 mb-3">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> {editingId ? "Edit Promotion Campaign" : "Create New Promotion Campaign"}
            </DialogTitle>
          </DialogHeader>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-3.5 text-xs">
              <FormInput
                name="scope"
                label="Discount Target Scope"
                type="select"
                options={[
                  { value: "ORDER", label: "Cart / Total Order Discount" },
                  { value: "PRODUCT", label: "Specific Product Discount" },
                  { value: "VARIANT", label: "Specific Product Variant Discount" },
                ]}
                required
                inputClassName="border-gray-300 text-xs h-8 bg-white"
              />

              {scopeVal !== "ORDER" && <ProductSearchAndVariantPicker />}

              <FormInput
                name="code"
                label={scopeVal === "ORDER" ? "Coupon Code (Required)" : "Promo Code (Optional - leave blank for auto)"}
                placeholder="e.g. EID20 || SAVE10"
                required={scopeVal === "ORDER"}
                inputClassName="border-gray-300 text-xs h-8 bg-white font-mono uppercase"
              />

              <div className="flex items-center gap-2">
                <span className={cn("inline-block px-2.5 py-0.5 text-[10px] font-bold text-white rounded-full", badgeInfo.cls)}>
                  {badgeInfo.text}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <FormInput
                  name="type"
                  label="Discount Type"
                  type="select"
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount (BDT)" },
                  ]}
                  required
                  inputClassName="border-gray-300 text-xs h-8 bg-white"
                />
                <FormInput name="value" label="Discount Value" type="number" placeholder="e.g. 15" required inputClassName="border-gray-300 text-xs h-8 bg-white" />
              </div>

              <FormInput name="maxUsage" label="Maximum Usage Limit (optional)" type="number" placeholder="e.g. 100" inputClassName="border-gray-300 text-xs h-8 bg-white" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <FormInput name="startDate" label="Start Date / Time" type="datetime-local" inputClassName="border-gray-300 text-xs h-8 bg-white" />
                <FormInput name="endDate" label="End Date / Time" type="datetime-local" inputClassName="border-gray-300 text-xs h-8 bg-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={isSubmitting} className="h-7 text-xs border-gray-300">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white h-7 text-xs font-semibold shadow-2xs transition-colors">
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </span>
                  ) : editingId ? "Update Campaign" : "Launch Campaign"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}