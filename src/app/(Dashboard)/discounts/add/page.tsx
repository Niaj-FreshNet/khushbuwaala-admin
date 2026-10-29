"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useGetDiscountByIdQuery,
} from "@/redux/store/api/discount/discountApi";
import { Skeleton } from "@/components/ui/skeleton";
import FormInput from "@/components/ReusableUI/FormInput";
import { FormProvider, useForm, useFormContext, SubmitHandler } from "react-hook-form";
import {
  useGetAllProductsAdminQuery,
  useGetProductVariantsQuery,
} from "@/redux/store/api/product/productApi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** ✅ datetime-local -> ISO */
const localInputToISO = (value?: string) => {
  if (!value || !value.trim()) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

// ISO -> datetime-local (YYYY-MM-DDTHH:mm)
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const schema = z
  .object({
    scope: z.enum(["ORDER", "PRODUCT", "VARIANT"]).default("PRODUCT"),
    productId: z.string().optional(),
    variantId: z.string().optional(),
    code: z.string().optional(),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().positive("Enter a positive number"),
    maxUsage: z
      .union([
        z.string().transform((val) => (val === "" ? undefined : parseInt(val))),
        z.number(),
        z.undefined(),
      ])
      .optional(),
    startDate: z.string().default(""),
    endDate: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "ORDER") {
      if (!data.code?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["code"],
          message: "Coupon code is required for order discount",
        });
      }
    }

    if (data.scope === "PRODUCT") {
      if (!data.productId?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["productId"],
          message: "Product is required",
        });
      }
    }

    if (data.scope === "VARIANT") {
      if (!data.productId?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["productId"],
          message: "Product is required",
        });
      }
      if (!data.variantId?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["variantId"],
          message: "Variant is required",
        });
      }
    }

    // ✅ Date order validation (end can't be before start)
    if (data.startDate && data.endDate) {
      const s = new Date(data.startDate);
      const e = new Date(data.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date must be after start date",
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

function computeDiscountPreview(opts: {
  originalPrice: number;
  type: "percentage" | "fixed";
  value: number;
}) {
  const { originalPrice, type, value } = opts;

  const parsedValue = Number(value || 0);
  if (!parsedValue || parsedValue <= 0 || originalPrice <= 0) {
    return {
      originalPrice: Math.round(originalPrice),
      discountAmount: 0,
      discountPercent: 0,
      finalPrice: Math.round(originalPrice),
    };
  }

  let discountAmount = 0;
  let finalPrice = originalPrice;
  let discountPercent = 0;

  if (type === "percentage") {
    discountAmount = (originalPrice * parsedValue) / 100;
    finalPrice = originalPrice - discountAmount;
    discountPercent = parsedValue;
  } else {
    discountAmount = parsedValue;
    finalPrice = originalPrice - discountAmount;
    discountPercent = originalPrice ? (discountAmount / originalPrice) * 100 : 0;
  }

  discountAmount = Math.round(discountAmount);
  finalPrice = Math.max(0, Math.round(finalPrice));
  discountPercent = Math.round(discountPercent * 10) / 10;

  return {
    originalPrice: Math.round(originalPrice),
    discountAmount,
    discountPercent,
    finalPrice,
  };
}

const VariantPickerAndPreview = () => {
  const { watch, setValue } = useFormContext<FormData>();

  const scope = watch("scope");
  const productId = watch("productId");
  const variantId = watch("variantId");
  const type = watch("type");
  const value = watch("value");

  const prevProductIdRef = useRef<string>("");

  const shouldFetchVariants = Boolean(scope !== "ORDER" && productId?.trim());

  const { data: variantsData, isLoading, error } = useGetProductVariantsQuery(
    productId as string,
    { skip: !shouldFetchVariants }
  );

  useEffect(() => {
    if (!productId) return;
    if (prevProductIdRef.current && productId !== prevProductIdRef.current) {
      setValue("variantId", "", { shouldValidate: false });
    }
    prevProductIdRef.current = productId;
  }, [productId, setValue]);

  if (scope === "ORDER") return null;
  if (!shouldFetchVariants) return null;
  if (isLoading) return <Skeleton className="h-12 w-full mb-4" />;

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded mb-4 text-red-800">
        Failed to load variants. Please try again.
      </div>
    );
  }

  const variants = Array.isArray((variantsData as any)?.data) ? (variantsData as any).data : [];
  if (!variants.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded mb-4 text-gray-600">
        No variants available for this product.
      </div>
    );
  }

  const selectedVariant = variants.find((v: any) => v.id === variantId);
  const minPrice = Math.min(...variants.map((v: any) => Number(v.price || 0)));

  const previewBasePrice = scope === "PRODUCT" ? minPrice : Number(selectedVariant?.price ?? 0);

  const preview = computeDiscountPreview({
    originalPrice: previewBasePrice,
    type,
    value: Number(value || 0),
  });

  return (
    <>
      {scope === "VARIANT" && (
        <FormInput
          name="variantId"
          label="Select Variant"
          type="select"
          options={variants.map((v: any) => ({
            value: v.id,
            label: `${v.sku} - (${v.size}${v.unit}) - ${Math.round(v.price)} BDT`,
          }))}
          placeholder="Select variant"
          required
        />
      )}

      {Number(value || 0) > 0 && previewBasePrice > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded mt-4 text-gray-800">
          <p>
            <strong>Preview Base Price:</strong> {preview.originalPrice} BDT{" "}
            {scope === "PRODUCT" ? (
              <span className="text-xs text-gray-600">(minimum variant price)</span>
            ) : null}
          </p>
          <p>
            <strong>Discount:</strong> {preview.discountAmount} BDT ({preview.discountPercent.toFixed(1)}%)
          </p>
          <p>
            <strong>Final Price:</strong> {preview.finalPrice} BDT
          </p>
        </div>
      )}
    </>
  );
};

export default function DiscountFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [createDiscount, { isLoading: isCreating }] = useCreateDiscountMutation();
  const [updateDiscount, { isLoading: isUpdating }] = useUpdateDiscountMutation();

  const { data: productData, isLoading: isProductsLoading } =
    useGetAllProductsAdminQuery({ page: 1, limit: 200 });

  const {
    data: discountRes,
    isLoading: isDiscountLoading,
    isFetching: isDiscountFetching,
    error: discountError,
  } = useGetDiscountByIdQuery(id as string, { skip: !id });

  const discount = (discountRes as any)?.data ?? discountRes;

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
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

  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    if (!discount) return;

    methods.reset(
      {
        scope: discount.scope || "PRODUCT",
        productId: discount.productId || "",
        variantId: discount.variantId || "",
        code: discount.code || "",
        type: discount.type || "percentage",
        value: Number(discount.value ?? 0),
        maxUsage: discount.maxUsage ?? undefined,
        startDate: toLocalInput(discount.startDate),
        endDate: toLocalInput(discount.endDate),
      },
      { keepDefaultValues: false }
    );

    isHydratedRef.current = true;
  }, [id, discount, methods]);

  const scope = methods.watch("scope");
  const productId = methods.watch("productId");
  const code = methods.watch("code");

  useEffect(() => {
    if (!isHydratedRef.current && id) return;

    if (scope === "ORDER") {
      methods.setValue("productId", "", { shouldValidate: false });
      methods.setValue("variantId", "", { shouldValidate: false });
    }
    if (scope === "PRODUCT") {
      methods.setValue("variantId", "", { shouldValidate: false });
    }
  }, [scope, methods, id]);

  const handleSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const submitData = {
        ...data,
        code: data.code?.trim() ? data.code.trim().toUpperCase() : undefined,
        productId: data.scope === "ORDER" ? undefined : data.productId,
        variantId: data.scope === "VARIANT" ? data.variantId : undefined,
        maxUsage: data.maxUsage || undefined,

        // ✅ Prisma-safe ISO
        startDate: localInputToISO(data.startDate),
        endDate: localInputToISO(data.endDate),
      };

      if (id) {
        await updateDiscount({ id, data: submitData }).unwrap();
        toast.success("Discount updated successfully");
      } else {
        await createDiscount(submitData).unwrap();
        toast.success("Discount created successfully");
      }

      router.push("/dashboard/discounts");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save discount");
    }
  };

  const isSubmitting = isCreating || isUpdating;
  const isEditLoading = !!id && (isDiscountLoading || isDiscountFetching);

  const badge = useMemo(() => {
    if (scope === "ORDER") return { text: "Order Coupon", cls: "bg-purple-600" };
    if (code?.trim()) return { text: "Promo Code Discount", cls: "bg-blue-500" };
    return { text: "Auto Discount", cls: "bg-green-500" };
  }, [scope, code]);

  if (id && discountError) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          Failed to load discount for editing.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {id ? "Edit Discount" : "Create New Discount"}
      </h1>

      {isEditLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
            <FormInput
              name="scope"
              label="Discount Apply On"
              type="select"
              options={[
                { value: "ORDER", label: "Total Order (Cart Total)" },
                { value: "PRODUCT", label: "Specific Product" },
                { value: "VARIANT", label: "Specific Variant" },
              ]}
              required
            />

            {scope !== "ORDER" && (
              <>
                {isProductsLoading ? (
                  <Skeleton className="h-12 w-full mb-4" />
                ) : (
                  <FormInput
                    name="productId"
                    label="Select Product"
                    type="select"
                    options={
                      (productData as any)?.data?.map((p: any) => ({
                        value: p.id,
                        label: p.name,
                      })) || []
                    }
                    placeholder="Choose a product"
                    required
                  />
                )}

                {productId && <VariantPickerAndPreview key={productId} />}
              </>
            )}

            <FormInput
              name="code"
              label={scope === "ORDER" ? "Coupon Code (required)" : "Discount Code (optional)"}
              placeholder="SAVE10"
              required={scope === "ORDER"}
            />

            <div className="mb-2">
              <span
                className={cn(
                  "inline-block px-3 py-1 text-sm font-semibold text-white rounded-full",
                  badge.cls
                )}
              >
                {badge.text}
              </span>
            </div>

            <FormInput
              name="type"
              label="Discount Type"
              type="select"
              options={[
                { value: "percentage", label: "Percentage (%)" },
                { value: "fixed", label: "Fixed Amount (BDT)" },
              ]}
              required
            />

            <FormInput name="value" label="Discount Value" type="number" placeholder="e.g. 10" required />

            <FormInput name="maxUsage" label="Maximum Usage (optional)" type="number" placeholder="e.g. 100" />

            <div className="grid grid-cols-2 gap-4">
              <FormInput name="startDate" label="Start Date" type="datetime-local" />
              <FormInput name="endDate" label="End Date" type="datetime-local" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (id && discount) {
                    methods.reset({
                      scope: discount.scope || "PRODUCT",
                      productId: discount.productId || "",
                      variantId: discount.variantId || "",
                      code: discount.code || "",
                      type: discount.type || "percentage",
                      value: Number(discount.value ?? 0),
                      maxUsage: discount.maxUsage ?? undefined,
                      startDate: toLocalInput(discount.startDate),
                      endDate: toLocalInput(discount.endDate),
                    });
                  } else {
                    methods.reset();
                  }
                }}
                disabled={isSubmitting}
                className="border-orange-400 text-orange-500 hover:bg-orange-50"
              >
                Reset
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:from-orange-600 hover:to-red-600",
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {id ? "Updating..." : "Creating..."}
                  </span>
                ) : id ? (
                  "Update Discount"
                ) : (
                  "Create Discount"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  );
}
