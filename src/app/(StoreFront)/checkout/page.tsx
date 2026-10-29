"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Phone,
  Loader2,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Tag,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/redux/store/hooks/useCart";
import { useOrder } from "@/redux/store/hooks/useOrder";
import StoreContainer from "@/components/Layout/StoreContainer";
import { useCreateDgepayPaymentMutation } from "@/redux/store/api/payment/paymentApi";
import { cn } from "@/lib/utils";
import { useApplyDiscountMutation } from "@/redux/store/api/discount/discountApi";
import { kwPushAddPaymentInfo, kwPushAddShippingInfo } from "@/lib/Analytics/kwEcom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { districtAliases, districts } from "./_components/districts";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useGetUserProfileQuery } from "@/redux/store/api/user/userApi";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";

// --- Types ---
type ShippingMethod = "insideDhaka" | "outsideDhaka";
type PaymentMethod = "online" | "bkash" | "cashOnDelivery";
type DiscountLabel =
  | { type: "percentage"; value: number }
  | { type: "fixed"; value: number }
  | null;

type DistrictSource = "auto" | "manual" | null;

function normalizeLines(p: any) {
  const productDoc = p?.product || p;
  const [sizeValue, sizeUnit] = String(p?.selectedSize || "").split(" ");

  const matchedVariant = productDoc?.variants?.find(
    (v: any) =>
      Number(v.size) === Number(sizeValue) &&
      String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
  );

  const originalUnit = Number(matchedVariant?.price ?? p?.price ?? 0);
  const finalUnit = Number(p?.selectedPrice ?? originalUnit);
  const qty = Math.max(1, Number(p?.quantity || 1));

  const lineOriginal = Math.max(0, Math.round(originalUnit * qty));
  const lineFinal = Math.max(0, Math.round(finalUnit * qty));

  const save = Math.max(0, lineOriginal - lineFinal);
  const hasDiscount = originalUnit > 0 && finalUnit > 0 && finalUnit < originalUnit;

  return {
    productDoc,
    matchedVariant,
    originalUnit,
    finalUnit,
    qty,
    lineOriginal,
    lineFinal,
    save,
    hasDiscount,
  };
}

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[—–-]/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function detectDistrictEnFromText(text: string) {
  const t = norm(text);
  if (!t) return undefined;

  for (const d of districts) {
    const aliases = districtAliases[d.en] ?? [d.en, d.bn];
    for (const a of aliases) {
      const aa = norm(a);
      if (!aa) continue;
      const isEnglish = /^[a-z0-9\s]+$/.test(aa);
      if (isEnglish) {
        const re = new RegExp(`\\b${aa.replace(/\s+/g, "\\s+")}\\b`, "i");
        if (re.test(t)) return d.en;
      } else {
        if (t.includes(aa)) return d.en;
      }
    }
  }

  for (const d of districts) {
    const en = norm(d.en);
    const bn = norm(d.bn);
    if (en) {
      const re = new RegExp(`\\b${en.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (re.test(t)) return d.en;
    }
    if (bn && t.includes(bn)) return d.en;
  }

  return undefined;
}

function getDistrictLabel(en?: string) {
  if (!en) return undefined;
  const d = districts.find((x) => x.en === en);
  return d ? `${d.en} — ${d.bn}` : en;
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cartItems,
    checkoutItem,
    checkoutMode,
    calculateSubtotal,
    proceedToCartCheckout,
    clearCart,
    appliedCouponCode,
    setAppliedCouponCode,
    clearAppliedCouponCode,
  } = useCart();

  const { handleCreateOrder, loading: isPlacingOrder } = useOrder();
  const [createDgepayPayment, { isLoading: isPaymentRedirecting }] = useCreateDgepayPaymentMutation();

  // --- UI States ---
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isDistrictPopoverOpen, setIsDistrictPopoverOpen] = useState(false);
  const [isBillingDistrictPopoverOpen, setIsBillingDistrictPopoverOpen] = useState(false);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("insideDhaka");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cashOnDelivery");
  const [hasDifferentBillingAddress, setHasDifferentBillingAddress] = useState(false);

  const [selectedDistrictEn, setSelectedDistrictEn] = useState<string | undefined>(undefined);
  const [districtSource, setDistrictSource] = useState<DistrictSource>(null);

  // --- Form fields ---
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Auth & Account Autofill ---
  const { user: authUser } = useAuth();
  const { data: profileData } = useGetUserProfileQuery(undefined, {
    skip: !authUser,
  });

  const hasHydratedRef = useRef(false);
  const userInteractedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const profile = (profileData as any)?.data || profileData;
    const userToApply = profile || authUser;

    if (!userToApply || hasHydratedRef.current) return;

    // Once detailed profile arrives, lock permanently for this page session
    if (profile) {
      hasHydratedRef.current = true;
    }

    // 1. Full Name
    if (userToApply.name && !userInteractedRef.current.name) {
      setName(userToApply.name);
    }

    // 2. Phone / Contact
    const phone = userToApply.phone || userToApply.contact;
    if (phone && !userInteractedRef.current.contactNumber) {
      setContactNumber(phone);
    }

    // 3. Email
    if (userToApply.email && !userInteractedRef.current.email) {
      setEmail(userToApply.email);
    }

    // 4. Address
    if (userToApply.address && !userInteractedRef.current.address) {
      setAddress(userToApply.address);
    }

    // 5. District
    if (userToApply.district && !userInteractedRef.current.district) {
      setSelectedDistrictEn(userToApply.district);
      setDistrictSource("manual");
      setDistrictQuery(getDistrictLabel(userToApply.district) ?? "");
    }
  }, [profileData, authUser]);

  // --- Promo code ---
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(
    appliedCouponCode ?? null
  );
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState<DiscountLabel>(null);
  const [applyDiscount, { isLoading: isApplyingDiscount }] = useApplyDiscountMutation();

  // --- Billing details ---
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingDistrictEn, setBillingDistrictEn] = useState<string | undefined>(undefined);
  const [billingDistrictQuery, setBillingDistrictQuery] = useState("");
  const [billingContactNumber, setBillingContactNumber] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");

  type SubmitStep =
    | "idle"
    | "validating"
    | "creating_order"
    | "redirecting"
    | "done"
    | "error";

  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");
  const submitStepRef = useRef<SubmitStep>("idle");
  useEffect(() => {
    submitStepRef.current = submitStep;
  }, [submitStep]);

  const isSubmittingRef = useRef(false);
  const isNavigatingAwayRef = useRef(false);

  const stepText: Record<SubmitStep, string> = {
    idle: "",
    validating: "Validating your information…",
    creating_order: "Placing your order…",
    redirecting: paymentMethod === "online" ? "Redirecting to payment gateway…" : "Finishing…", done: "Completed!",
    error: "Something went wrong. Please try again.",
  };

  const isBlockingUI = submitStep !== "idle" && submitStep !== "error";

  const selectedDistrictLabel = useMemo(
    () => getDistrictLabel(selectedDistrictEn),
    [selectedDistrictEn]
  );

  const billingDistrictLabel = useMemo(
    () => getDistrictLabel(billingDistrictEn) || "",
    [billingDistrictEn]
  );

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const itemsToDisplay = useMemo(() => {
    if (checkoutMode && checkoutItem) {
      const item = checkoutItem as any;
      return [
        {
          ...item,
          cartItemId: item.cartItemId ?? item.id ?? item._id ?? item.productId,
        },
      ];
    }
    return (Array.isArray(cartItems) ? cartItems : []).map((it: any) => ({
      ...it,
      cartItemId: it.cartItemId ?? it.id ?? it._id ?? it.productId,
    }));
  }, [checkoutMode, checkoutItem, cartItems]);

  useEffect(() => {
    if (districtSource === "manual") return;

    const guess = detectDistrictEnFromText(address);
    if (guess && guess !== selectedDistrictEn) {
      setSelectedDistrictEn(guess);
      setDistrictSource("auto");
      setDistrictQuery(getDistrictLabel(guess) ?? "");
      return;
    }

    if (!guess && districtSource === "auto") {
      setSelectedDistrictEn(undefined);
      setDistrictSource(null);
      setDistrictQuery("");
    }
  }, [address]);

  useEffect(() => {
    if (!selectedDistrictEn) return;
    const next: ShippingMethod = selectedDistrictEn === "Dhaka" ? "insideDhaka" : "outsideDhaka";
    if (shippingMethod !== next) setShippingMethod(next);
  }, [selectedDistrictEn, shippingMethod]);

  const formatBDT = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    })
      .format(Math.max(0, Math.round(Number(amount || 0))))
      .replace("BDT", "৳")
      .trim();

  const subtotal = useMemo(() => {
    if (checkoutMode && checkoutItem) {
      return Number(checkoutItem.selectedPrice || 0) * Number(checkoutItem.quantity || 1);
    }
    return calculateSubtotal();
  }, [checkoutMode, checkoutItem, calculateSubtotal]);

  const autoDiscount = useMemo(() => {
    return itemsToDisplay.reduce((sum, p) => sum + (normalizeLines(p).save || 0), 0);
  }, [itemsToDisplay]);

  const safeCouponDiscount = Math.max(0, Math.round(Number(couponDiscount || 0)));
  const displayedDiscount = Math.max(0, Math.round(autoDiscount + safeCouponDiscount));
  const estimatedTaxes = 0;
  const discountedSubtotal = Math.max(0, Math.round(subtotal - safeCouponDiscount));

  const FREE_SHIPPING_MIN = 1000;
  const isFreeShipping = useMemo(
    () => discountedSubtotal >= FREE_SHIPPING_MIN,
    [discountedSubtotal]
  );

  const baseShippingCost = useMemo(
    () => (shippingMethod === "outsideDhaka" ? 120 : 60),
    [shippingMethod]
  );

  const shippingCost = useMemo(
    () => (isFreeShipping ? 0 : baseShippingCost),
    [isFreeShipping, baseShippingCost]
  );

  const total = Math.max(0, Math.round(discountedSubtotal + estimatedTaxes + shippingCost));

  // ========================================================
  // ✅ Declare pendingOrderRef & useEffect AFTER 'total'
  // ========================================================
  const pendingOrderRef = useRef<{ orderId: string; payToken: string } | null>(null);

  // Reset cached order if customer modifies payment/totals
  useEffect(() => {
    pendingOrderRef.current = null;
  }, [paymentMethod, appliedPromoCode, shippingMethod, total]);

  const userData = useMemo(() => {
    return {
      em: email || undefined,
      ph: contactNumber || undefined,
      fn: name || undefined,
      ct: selectedDistrictEn || undefined,
      country: "bd",
    };
  }, [email, contactNumber, name, selectedDistrictEn]);

  const analyticsItems = useMemo(() => {
    return itemsToDisplay
      .map((product: any) => {
        const p = product?.product || product;
        const productId =
          product?.product?.id ||
          product?.product?._id ||
          product?.productId ||
          product?.product?.productId;

        const productName = p?.name || product?.name || "Product";
        const brand = p?.brand || "Khushbuwaala";
        const category = p?.categoryId || undefined;
        const variant = product?.selectedSize
          ? String(product.selectedSize).trim().toUpperCase()
          : undefined;

        const [sizeValue, sizeUnit] = String(product?.selectedSize || "").split(" ");
        const matchedVariant = product?.product?.variants?.find(
          (v: any) =>
            Number(v.size) === Number(sizeValue) &&
            String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
        );

        const price = Number(product?.selectedPrice ?? matchedVariant?.price ?? product?.price ?? 0);
        const quantity = Math.max(1, Number(product?.quantity || 1));

        if (!productId) return null;

        return {
          item_id: String(productId),
          item_name: String(productName),
          item_brand: String(brand),
          item_category: category ? String(category) : undefined,
          item_variant: variant ? String(variant) : undefined,
          price,
          quantity,
        };
      })
      .filter(Boolean) as any[];
  }, [itemsToDisplay]);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLTextAreaElement | null>(null);

  const shippingDedupeRef = useRef<string>("");
  const paymentDedupeRef = useRef<string>("");

  useEffect(() => {
    if (!analyticsItems.length) return;
    if (analyticsItems.some((i) => !i.price || i.price <= 0)) return;

    const shippingTier = isFreeShipping
      ? "Free Shipping"
      : shippingMethod === "insideDhaka"
        ? "Inside Dhaka"
        : "Outside Dhaka";

    const fp = [
      "ship",
      selectedDistrictEn || "unknown",
      shippingMethod,
      String(Math.round(total)),
      analyticsItems
        .map((i) => `${i.item_id}:${i.item_variant || ""}:${i.price}:${i.quantity}`)
        .sort()
        .join("|"),
    ].join("~");

    if (shippingDedupeRef.current === fp) return;
    shippingDedupeRef.current = fp;

    kwPushAddShippingInfo({
      currency: "BDT",
      value: total,
      items: analyticsItems,
      shipping_tier: shippingTier,
      coupon: appliedPromoCode ?? undefined,
      user_data: userData,
    });
  }, [selectedDistrictEn, shippingMethod, total, analyticsItems, isFreeShipping, appliedPromoCode, userData]);

  useEffect(() => {
    if (!analyticsItems.length) return;
    if (analyticsItems.some((i) => !i.price || i.price <= 0)) return;

    const paymentType = paymentMethod === "bkash" ? "bkash" : "cod";
    const fp = [
      "pay",
      paymentType,
      String(Math.round(total)),
      analyticsItems
        .map((i) => `${i.item_id}:${i.item_variant || ""}:${i.price}:${i.quantity}`)
        .sort()
        .join("|"),
    ].join("~");

    if (paymentDedupeRef.current === fp) return;
    paymentDedupeRef.current = fp;

    kwPushAddPaymentInfo({
      currency: "BDT",
      value: total,
      items: analyticsItems,
      payment_type: paymentType,
      coupon: appliedPromoCode ?? undefined,
      user_data: userData,
    });
  }, [paymentMethod, total, analyticsItems, appliedPromoCode, userData]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Please enter your full name.";
    if (contactNumber.replace(/\D/g, "").length < 10)
      nextErrors.contactNumber = "Enter a valid 11-digit mobile number.";
    if (!address.trim()) nextErrors.address = "Please enter full delivery address.";
    setErrors(nextErrors);

    const order: Array<keyof typeof nextErrors> = ["name", "contactNumber", "address"];
    const firstKey = order.find((k) => nextErrors[k]);

    if (firstKey === "name") scrollToField(nameRef.current);
    if (firstKey === "contactNumber") scrollToField(phoneRef.current);
    if (firstKey === "address") scrollToField(addressRef.current);

    return Object.keys(nextErrors).length === 0;
  };

  const buildDiscountItems = () => {
    return itemsToDisplay.map((product: any) => {
      const productDoc = product?.product || product;
      const [sizeValue, sizeUnit] = String(product?.selectedSize || "").split(" ");

      const matchedVariant = productDoc?.variants?.find(
        (v: any) =>
          Number(v.size) === Number(sizeValue) &&
          String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
      );

      const originalUnitPrice = Number(matchedVariant?.price ?? product?.price ?? 0);
      const qty = Math.max(1, Number(product?.quantity || 1));
      const productId = productDoc?.id || productDoc?._id || product?.productId;
      const variantId =
        product?.variantId || product?.selectedVariantId || matchedVariant?.id || matchedVariant?._id;

      return {
        productId,
        variantId,
        price: originalUnitPrice,
        qty,
      };
    });
  };

  const pickDiscountAmount = (res: any) => {
    const root = res?.data ?? res;
    const total = Number(root?.discountAmount ?? 0);
    const orderPart = Number(root?.orderDiscountAmount ?? 0);
    if (total > 0 && orderPart > 0) return total;
    if (total > 0) return total;
    return orderPart;
  };

  const pickDiscountInfo = (res: any): DiscountLabel => {
    const root = res?.data ?? res;
    const od = root?.orderDiscount;
    if (od?.type && typeof od?.value === "number") {
      return { type: od.type, value: Number(od.value) };
    }
    const items = root?.items ?? [];
    for (const it of items) {
      const promo = (it?.appliedDiscounts ?? []).find((d: any) => d?.code);
      if (promo?.type && typeof promo?.value === "number") {
        return { type: promo.type, value: Number(promo.value) };
      }
    }
    for (const it of items) {
      const auto = (it?.appliedDiscounts ?? []).find((d: any) => !d?.code);
      if (auto?.type && typeof auto?.value === "number") {
        return { type: auto.type, value: Number(auto.value) };
      }
    }
    return null;
  };

  const discountLabel = useMemo(() => {
    if (!discountInfo) return null;
    if (discountInfo.type === "percentage") return `${Math.round(discountInfo.value)}%`;
    return formatBDT(discountInfo.value);
  }, [discountInfo]);

  const applyPromo = async () => {
    if (appliedPromoCode) {
      setAppliedPromoCode(null);
      setAppliedCouponCode?.("");
      clearAppliedCouponCode?.();
      setCouponDiscount(0);
      setDiscountInfo(null);
      setPromoCode("");
      toast.success("Promo removed");
      return;
    }

    const code = promoCode.trim().toUpperCase();
    if (!code) return toast.error("Enter a promo code");

    try {
      const items = buildDiscountItems();
      if (!items.length) return toast.error("Your cart is empty.");
      if (items.some((it) => !it.price || it.price <= 0)) {
        return toast.error("Some items have invalid price.");
      }

      const res = await applyDiscount({ code, items }).unwrap();
      const discountAmount = pickDiscountAmount(res);
      const info = pickDiscountInfo(res);

      if (discountAmount <= 0) {
        toast.error("This coupon doesn't apply to your cart.");
        return;
      }

      setAppliedPromoCode(code);
      setAppliedCouponCode?.(code);
      setCouponDiscount(discountAmount);
      setDiscountInfo(info);
      toast.success(`Promo applied: -${formatBDT(discountAmount)}`);
    } catch (e: any) {
      const msg = e?.data?.message || e?.error || "Failed to apply coupon. Please try again.";
      toast.error(msg);
    }
  };

  useEffect(() => {
    const revalidate = async () => {
      if (!appliedPromoCode) return;
      try {
        const items = buildDiscountItems();
        const res = await applyDiscount({ code: appliedPromoCode, items }).unwrap();
        setCouponDiscount(pickDiscountAmount(res));
        setDiscountInfo(pickDiscountInfo(res));
      } catch {
        setAppliedPromoCode(null);
        setCouponDiscount(0);
        setDiscountInfo(null);
      }
    };
    revalidate();
  }, [itemsToDisplay, appliedPromoCode]);

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (isPlacingOrder || isPaymentRedirecting) return;

    isSubmittingRef.current = true;
    setSubmitStep("validating");

    try {
      if (!validateForm()) {
        setSubmitStep("idle");
        toast.error("Please provide name, phone and address");
        return;
      }
      if (!agreeToTerms) {
        setSubmitStep("idle");
        toast.error("Please agree to the terms to continue");
        return;
      }

      setSubmitStep("creating_order");

      let orderId = pendingOrderRef.current?.orderId;
      let payToken = pendingOrderRef.current?.payToken;

      // Only create in DB if this order was not already created in this session
      if (!orderId || !payToken) {
        const cartItemIds = itemsToDisplay
          .map((item: any) => item.cartItemId)
          .filter(Boolean) as string[];

        const items = itemsToDisplay.map((item: any) => {
          const productDoc = item?.product || item;
          const [sizeValue, sizeUnit] = String(item?.selectedSize || "").split(" ");

          const matchedVariant = productDoc?.variants?.find(
            (v: any) =>
              Number(v.size) === Number(sizeValue) &&
              String(v.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
          );

          const originalPrice = Number(matchedVariant?.price ?? productDoc?.price ?? item?.price ?? 0);
          const selectedPrice = Number(item?.selectedPrice ?? originalPrice);

          return {
            cartItemId: item?.cartItemId || item?.id || undefined,
            productId: productDoc?.id || productDoc?._id || item?.productId,
            variantId: item?.variantId || matchedVariant?.id || undefined,
            quantity: Math.max(1, Number(item?.quantity || 1)),
            price: selectedPrice,
            originalPrice: originalPrice,
          };
        });

      // Helper to grab cookies on client side
      const getCookie = (name: string) => {
        if (typeof document === "undefined") return undefined;
        const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`));
        return m ? decodeURIComponent(m[1]) : undefined;
      };

      // Inside payload object definition:
      const payload: any = {
        cartItemIds,
        items,
        amount: total,
        isPaid: false,
        method: paymentMethod,
        orderSource: "WEBSITE",
        saleType: "SINGLE",
        shippingCost: Number(shippingCost),
        additionalNotes,
        coupon: appliedPromoCode ?? null,
        discountAmount: Number(displayedDiscount || 0),

        // ✅ Pass Meta Browser Cookies for High Event Match Quality (EMQ)
        fbp: getCookie("_fbp") || null,
        fbc: getCookie("_fbc") || null,

          customerInfo: { name, phone: contactNumber, email, address, district: selectedDistrictEn },
          shippingAddress: { name, phone: contactNumber, email, address, district: selectedDistrictEn },
          billingAddress: !hasDifferentBillingAddress
            ? { name, phone: contactNumber, email, address, district: selectedDistrictEn }
            : {
              name: billingName || name,
              phone: billingContactNumber || contactNumber,
              address: billingAddress || address,
              district: billingDistrictEn || selectedDistrictEn,
            },
        };

        const res: any = await handleCreateOrder(payload);
        proceedToCartCheckout();

        orderId = res?.data?.id || res?.id;
        payToken = res?.data?.payToken || res?.payToken;

        if (orderId && payToken && paymentMethod === "online") {
          pendingOrderRef.current = { orderId, payToken };
        }
      }

      if (!orderId) {
        setSubmitStep("error");
        toast.error("Order created but orderId missing.");
        return;
      }

      setSubmitStep("redirecting");

      // 1. Cash on Delivery Flow
      if (paymentMethod === "cashOnDelivery") {
        clearCart();
        pendingOrderRef.current = null;
        setSubmitStep("done");
        toast.success("Order placed successfully!");
        router.push(`/thank-you?order=${encodeURIComponent(orderId)}`);
        return;
      }

      // Guard check for payment token
      if (!payToken) {
        clearCart();
        setSubmitStep("done");
        toast.error("Order created but payToken missing.");
        router.push(`/thank-you?order=${encodeURIComponent(orderId)}`);
        return;
      }

      // 2. DGePay Payment Gateway Flow
      if (paymentMethod === "online") {
        const paymentRes = await createDgepayPayment({ orderId, payToken }).unwrap();

        if (typeof window !== "undefined") {
          localStorage.setItem("lastOrderId", orderId);
          if (paymentRes.transactionId) {
            localStorage.setItem("lastTransactionId", paymentRes.transactionId);
          }
        }

        clearCart();
        pendingOrderRef.current = null;

        // Flag intentional departure so beforeunload does not pop up
        isNavigatingAwayRef.current = true;
        window.location.href = paymentRes.paymentUrl;
        return;
      }
    } catch (err: any) {
      console.error("Order Submission Error:", err);
      setSubmitStep("error");
      toast.error(err?.data?.message || err?.message || "Failed to place order. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      if (submitStepRef.current !== "redirecting" && submitStepRef.current !== "done") {
        setSubmitStep("idle");
      }
    }
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // Only intercept if blocking UI AND not intentionally leaving to the gateway
      if (!isBlockingUI || isNavigatingAwayRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isBlockingUI]);

  function scrollToField(el: HTMLElement | null) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (el as any)?.focus?.(), 300);
  }

  useEffect(() => {
    nameRef.current?.focus?.();
  }, []);

  const inlineButtonRef = useRef<HTMLDivElement | null>(null);
  const [isInlineButtonVisible, setIsInlineButtonVisible] = useState(false);

  useEffect(() => {
    const target = inlineButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Instantly hides floating bar the moment the static button enters viewport
        setIsInlineButtonVisible(entry.isIntersecting);
      },
      {
        root: null,
        // Triggers as soon as the top edge of the inline button touches the bottom area
        rootMargin: "0px 0px -40px 0px",
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const isBillingFilled = useMemo(() => {
    return Boolean(
      hasDifferentBillingAddress &&
      billingName.trim() &&
      billingContactNumber.trim() &&
      billingAddress.trim()
    );
  }, [hasDifferentBillingAddress, billingName, billingContactNumber, billingAddress]);

  return (
    <StoreContainer>
      {/* Processing Modal Screen */}
      {isBlockingUI && (
        <div className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Processing Your Order</h3>
            <p className="text-xs text-gray-500 mt-1">{stepText[submitStep]}</p>

            <div className="mt-4 space-y-2 text-xs text-left bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className={cn("flex items-center gap-2", submitStep === "validating" ? "font-bold text-gray-900" : "text-gray-400")}>
                <span className={cn("h-2 w-2 rounded-full", submitStep === "validating" ? "bg-green-600 animate-pulse" : "bg-gray-300")} />
                Verifying shipping details…
              </div>
              <div className={cn("flex items-center gap-2", submitStep === "creating_order" ? "font-bold text-gray-900" : "text-gray-400")}>
                <span className={cn("h-2 w-2 rounded-full", submitStep === "creating_order" ? "bg-green-600 animate-pulse" : "bg-gray-300")} />
                Generating order record…
              </div>
              <div className={cn("flex items-center gap-2", submitStep === "redirecting" ? "font-bold text-gray-900" : "text-gray-400")}>
                <span className={cn("h-2 w-2 rounded-full", submitStep === "redirecting" ? "bg-green-600 animate-pulse" : "bg-gray-300")} />
                Redirecting securely…
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">Please do not refresh or hit the back button.</p>
          </div>
        </div>
      )}

      <div className="bg-[#FBFBFA] pt-4 sm:pt-6 pb-4 sm:pb-8">
        <div className="container mx-auto px-3 py-2 sm:px-4 max-w-6xl">


          {/* Header & Trust Badge */}
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Complete Your Order</h1>
            </div>
            {/* <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Truck className="h-4 w-4 text-green-600" /> Nationwide Delivery</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Cash on Delivery</span>
            </div> */}
          </div>

          {/* Mobile Accordion Summary */}
          <div className="lg:hidden mb-2">
            <button
              type="button"
              className={cn(
                "w-full p-2.5 sm:p-3.5 flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all",
                isMobileSummaryOpen && "border-green-700 ring-1 ring-green-700"
              )}
              onClick={() => setIsMobileSummaryOpen((s) => !s)}
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-xs font-semibold text-gray-700">Order Items & Summary</span>
                <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                  {itemsToDisplay.reduce((acc: number, it: any) => acc + (it?.quantity || 1), 0)} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{formatBDT(total)}</span>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200", isMobileSummaryOpen && "rotate-180")} />
              </div>
            </button>

            {isMobileSummaryOpen && (
              <div className="mt-1 sm:mt-2 p-2.5 sm:p-3.5 bg-white rounded-xl border border-gray-200 space-y-3 animate-in fade-in-50 duration-150">
                {itemsToDisplay.map((product: any, idx: number) => {
                  const { productDoc, qty, finalUnit, lineFinal, lineOriginal, save, hasDiscount } = normalizeLines(product);
                  return (
                    <div key={`${productDoc?.id}-${idx}`} className="flex gap-3 items-center">
                      <div className="relative w-12 h-14 rounded-md overflow-hidden bg-gray-100 shrink-0 border">
                        <Image src={productDoc?.primaryImage} alt={productDoc?.name || "product"} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-semibold text-gray-800 truncate">{productDoc?.name}</p>
                        <p className="text-gray-500 text-[11px]">{product.selectedSize} · Qty: {qty}</p>
                        <div className="text-gray-900 font-bold mt-0.5">{formatBDT(lineFinal)}</div>
                      </div>
                      {hasDiscount && (
                        <div className="text-right text-[10px]">
                          <span className="line-through text-gray-400 block">{formatBDT(lineOriginal)}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Save {formatBDT(save)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator />
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-gray-900">{formatBDT(subtotal)}</span></div>
                  {autoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700"><span>Special Discount</span><span>-{formatBDT(autoDiscount)}</span></div>
                  )}
                  {safeCouponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700"><span>Promo ({appliedPromoCode})</span><span>-{formatBDT(safeCouponDiscount)}</span></div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-medium text-gray-900">
                      {isFreeShipping ? <span className="text-emerald-600 font-bold">FREE</span> : formatBDT(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t">
                    <span>Payable Total</span>
                    <span>{formatBDT(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Grid: Form (Left) & Sticky Order Review (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3">

              {/* Delivery Address Card */}
              <div className="bg-white rounded-2xl border border-gray-200 px-3 sm:px-4 pt-3 pb-1 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-3 rounded-full bg-green-700" />
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">1. Delivery Address</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                  {/* Full Name */}
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      ref={nameRef}
                      placeholder="Your Name (আপনার নাম)"
                      value={name}
                      enterKeyHint="next"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          phoneRef.current?.focus();
                        }
                      }}
                      onChange={(e) => {
                        userInteractedRef.current.name = true;
                        setName(e.target.value);
                      }}
                      className={cn(
                        "h-10 mt-0.5 text-xs sm:text-sm bg-gray-50/60 border-gray-200 focus:bg-white placeholder:text-gray-400 focus-visible:ring-green-700",
                        errors.name && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                    />
                    {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
                  </div>

                  {/* Mobile Number */}
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      ref={phoneRef}
                      placeholder="01XXXXXXXXX (মোবাইল নম্বর)"
                      inputMode="numeric"
                      enterKeyHint="next"
                      value={contactNumber}
                      onChange={(e) => {
                        userInteractedRef.current.contactNumber = true;
                        const v = e.target.value;
                        setContactNumber(v);
                        if (v.replace(/\D/g, "").length >= 11) {
                          addressRef.current?.focus();
                        }
                      }}
                      className={cn(
                        "h-10 mt-0.5 text-xs sm:text-sm bg-gray-50/60 border-gray-200 focus:bg-white placeholder:text-gray-400 focus-visible:ring-green-700",
                        errors.contactNumber && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                    />
                    {errors.contactNumber && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.contactNumber}</p>
                    )}
                  </div>

                  {/* Full Delivery Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Delivery Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      ref={addressRef}
                      rows={2}
                      placeholder="House no, Road, Area, Thana (ডেলিভারি ঠিকানা)"
                      className={cn(
                        "w-full mt-0.5 p-2.5 rounded-lg border text-xs sm:text-sm outline-none bg-gray-50/60 border-gray-200 focus:bg-white focus:ring-1 focus:ring-green-700 resize-none min-h-[52px] placeholder:text-gray-400 transition-colors",
                        errors.address ? "border-rose-500 focus:ring-rose-500" : "border-input"
                      )}
                      value={address}
                      onChange={(e) => {
                        userInteractedRef.current.address = true;
                        setAddress(e.target.value);
                      }}
                    />
                    {errors.address && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.address}</p>
                    )}
                  </div>

                  {/* District Selector */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        District <span className="text-gray-400 font-normal">(জেলা)</span>
                      </label>
                      {selectedDistrictEn && (
                        <span className="text-[11px] font-medium text-orange-500">
                          Shipping: {selectedDistrictEn === "Dhaka" ? "Inside Dhaka (৳60)" : "Outside Dhaka (৳120)"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <Popover open={isDistrictPopoverOpen} onOpenChange={setIsDistrictPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 justify-between bg-gray-50/60 border-gray-200 font-normal hover:bg-gray-50 text-xs sm:text-sm"
                          >
                            <span className={cn("truncate", !selectedDistrictEn && "text-gray-400")}>
                              {selectedDistrictLabel ?? "Select District (জেলা নির্বাচন করুন)"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                          <Command shouldFilter>
                            <CommandInput
                              placeholder="Search district (e.g. Dhaka, Rangpur, চট্টগ্রাম)..."
                              value={districtQuery}
                              onValueChange={(val) => {
                                setDistrictQuery(val);
                                const q = norm(val);
                                const match = districts.find((d) => {
                                  const label = `${d.en} — ${d.bn}`;
                                  return norm(label) === q || norm(`${d.en} ${d.bn}`) === q;
                                });
                                if (match) {
                                  setSelectedDistrictEn(match.en);
                                  setDistrictSource("manual");
                                }
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>No district found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    userInteractedRef.current.district = true;
                                    setSelectedDistrictEn(undefined);
                                    setDistrictSource(null);
                                    setDistrictQuery("");
                                    setIsDistrictPopoverOpen(false);
                                  }}
                                >
                                  <span className="text-xs text-gray-500 font-semibold">Clear Selection</span>
                                </CommandItem>
                                {districts.map((d) => {
                                  const label = `${d.en} — ${d.bn}`;
                                  return (
                                    <CommandItem
                                      key={d.en}
                                      value={`${label} ${d.en} ${d.bn}`}
                                      onSelect={() => {
                                        userInteractedRef.current.district = true;
                                        setSelectedDistrictEn(d.en);
                                        setDistrictSource("manual");
                                        setDistrictQuery(label);
                                        setIsDistrictPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-green-600",
                                          selectedDistrictEn === d.en ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="text-xs">{label}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Single Pill Billing Toggle[cite: 1] */}
                <div className="pt-2.5">
                  <div
                    onClick={() => setHasDifferentBillingAddress((prev) => !prev)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none bg-white",
                      hasDifferentBillingAddress ? "border-emerald-600 ring-0.5 ring-emerald-700 shadow-sm" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-1.5 rounded-full bg-green-700" />
                      <span className="text-xs font-semibold text-gray-800">Different Billing Address</span>
                    </div>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center transition-all shrink-0",
                        isBillingFilled
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : hasDifferentBillingAddress
                            ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                            : "border-emerald-700 bg-white"
                      )}
                    >
                      {isBillingFilled && (
                        <Check className="w-2.5 h-2.5 stroke-[5.5]" />
                      )}
                    </div>
                  </div>

                  {hasDifferentBillingAddress && (
                    <div className="mt-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5 animate-in fade-in-50 duration-150">
                      <Input
                        placeholder="Billing Person Name (বিলিং প্রাপকের নাম)"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        className="h-10 text-xs bg-white placeholder:text-gray-400"
                      />
                      <Input
                        placeholder="Billing Phone Number (বিলিং ফোন নম্বর)"
                        value={billingContactNumber}
                        onChange={(e) => setBillingContactNumber(e.target.value)}
                        className="h-10 text-xs bg-white placeholder:text-gray-400"
                      />
                      <textarea
                        rows={2}
                        placeholder="Billing Address (বিলিং ঠিকানা)"
                        className="w-full p-2.5 rounded-lg border text-xs outline-none bg-white border-gray-200 focus:ring-1 focus:ring-green-700 resize-none placeholder:text-gray-400"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                      />
                      <Popover open={isBillingDistrictPopoverOpen} onOpenChange={setIsBillingDistrictPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full h-10 justify-between bg-white text-xs font-normal">
                            <span className={cn(!billingDistrictEn && "text-gray-400")}>
                              {billingDistrictLabel || "Billing District (জেলা নির্বাচন করুন)"}
                            </span>
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                          <Command shouldFilter>
                            <CommandInput placeholder="Search district..." value={billingDistrictQuery} onValueChange={(val) => setBillingDistrictQuery(val)} />
                            <CommandList>
                              <CommandEmpty>No district found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem onSelect={() => { setBillingDistrictEn(undefined); setBillingDistrictQuery(""); setIsBillingDistrictPopoverOpen(false); }}>
                                  Clear
                                </CommandItem>
                                {districts.map((d) => (
                                  <CommandItem
                                    key={d.en}
                                    value={`${d.en} ${d.bn}`}
                                    onSelect={() => {
                                      setBillingDistrictEn(d.en);
                                      setBillingDistrictQuery(`${d.en} — ${d.bn}`);
                                      setIsBillingDistrictPopoverOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", billingDistrictEn === d.en ? "opacity-100" : "opacity-0")} />
                                    {d.en} — {d.bn}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Optional Email & Delivery Note field */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0">
                  <div>
                    <label className="text-[11px] font-medium text-gray-600">
                      Email Address <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => {
                        userInteractedRef.current.email = true;
                        setEmail(e.target.value);
                      }}
                      className="h-10 mt-1 text-xs bg-gray-50/60 border-gray-200 focus:bg-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-600">
                      Special Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Call before delivery, urgent parcel..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-lg border text-xs outline-none bg-gray-50/60 border-gray-200 focus:bg-white focus:ring-1 focus:ring-green-700 resize-none min-h-[40px] placeholder:text-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-2xl border border-gray-200 px-3 sm:px-4 pt-3 pb-3 shadow-sm space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-3 rounded-full bg-green-700" />
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">2. Payment Method</h2>
                </div>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                  <label
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer",
                      paymentMethod === "cashOnDelivery"
                        ? "border-green-700 bg-amber-50/30 ring-0.5 ring-emerald-700"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="w-4 h-4 min-w-4 min-h-4 shrink-0 flex items-center justify-center">
                      <RadioGroupItem
                        value="cashOnDelivery"
                        style={{ width: "12px", height: "12px", minWidth: "12px", minHeight: "12px" }}
                        className="rounded-full border-emerald-700 text-emerald-700 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-transparent m-0 [&_svg]:fill-emerald-700 [&_svg]:text-emerald-700"
                      />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">Cash on Delivery</span>
                      <span className="text-[11px] text-gray-500">Pay cash when received</span>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer",
                      paymentMethod === "online"
                        ? "border-green-700 bg-amber-50/30 ring-0.5 ring-emerald-700"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="w-4 h-4 min-w-4 min-h-4 shrink-0 flex items-center justify-center">
                      <RadioGroupItem
                        value="online"
                        style={{ width: "12px", height: "12px", minWidth: "12px", minHeight: "12px" }}
                        className="rounded-full border-emerald-700 text-emerald-700 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-transparent m-0 [&_svg]:fill-emerald-700 [&_svg]:text-emerald-700"
                      />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">Online Payment</span>
                      <span className="text-[11px] text-gray-500">Pay with Bkash, Nagad, Rocket, Cards</span>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="hidden sm:flex items-center gap-2 pt-1">
                <div className="w-4 h-4 min-w-4 min-h-4 shrink-0 flex items-center justify-center">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(v) => setAgreeToTerms(Boolean(v))}
                    style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px" }}
                    className="rounded-full ml-2 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700 [&_svg]:stroke-[3.5]"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="select-none">
                    I agree to the Terms &amp; Conditions and Return Policy
                  </div>

                  <Link
                    href="/terms-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View Terms and Conditions"
                    className="inline-flex items-center justify-center rounded p-0.5 text-blue-500 transition-colors bg-blue-100 hover:bg-blue-200 hover:text-blue-600"
                  >
                    <MdArrowOutward className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Desktop Place Order Button (Inside Column) */}
              <div className="hidden lg:block pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitStep !== "idle" && submitStep !== "error"}
                  className="w-full h-14 text-xl font-extrabold tracking-wider rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all hover:scale-[1.005] cursor-pointer"
                >
                  {submitStep !== "idle" && submitStep !== "error" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {stepText[submitStep]}
                    </span>
                  ) : (
                    `Place Order`
                  )}
                </Button>
              </div>
            </div>

            {/* Sticky Order Review (Right Column) */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Order Summary</h3>
                  <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                    {itemsToDisplay.reduce((acc: number, it: any) => acc + (it?.quantity || 1), 0)} items
                  </span>
                </div>

                {/* Items preview list */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {itemsToDisplay.map((product: any, idx: number) => {
                    const { productDoc, qty, lineFinal, lineOriginal, save, hasDiscount } = normalizeLines(product);
                    return (
                      <div key={`${productDoc?.id}-${idx}`} className="flex gap-3 items-center">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                          <Image src={productDoc?.primaryImage} alt={productDoc?.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{productDoc?.name}</p>
                          <p className="text-[11px] text-gray-500">{product.selectedSize} · Qty: {qty}</p>
                          <div className="text-xs font-bold text-gray-900 mt-0.5">{formatBDT(lineFinal)}</div>
                        </div>
                        {hasDiscount && (
                          <div className="text-right">
                            <span className="text-[10px] line-through text-gray-400 block">{formatBDT(lineOriginal)}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                              Save {formatBDT(save)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code Input */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 h-9">
                    <div className="relative flex-1 h-full">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Coupon code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-full pl-8 text-xs bg-gray-50/60 uppercase placeholder:text-gray-400 border-gray-200"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyPromo}
                      disabled={isApplyingDiscount}
                      className="h-full text-xs font-semibold px-3.5 py-0 border-gray-300 shrink-0"
                    >
                      {isApplyingDiscount ? "..." : appliedPromoCode ? "Remove" : "Apply"}
                    </Button>
                  </div>
                  {discountLabel && appliedPromoCode && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Applied: {discountLabel}</p>
                  )}
                </div>

                {/* Calculations Breakdown */}
                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatBDT(subtotal)}</span>
                  </div>

                  {autoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount Saved</span>
                      <span>-{formatBDT(autoDiscount)}</span>
                    </div>
                  )}

                  {safeCouponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Coupon ({appliedPromoCode})</span>
                      <span>-{formatBDT(safeCouponDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 items-center">
                    <span>Delivery Fee</span>
                    <span>
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                          FREE SHIPPING
                        </span>
                      ) : (
                        formatBDT(shippingCost)
                      )}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold text-gray-900">Total Payable</span>
                    <span className="text-lg font-black text-gray-900">{formatBDT(total)}</span>
                  </div>

                  <div className="flex sm:hidden items-center gap-2 pt-2">
                    <div className="w-4 h-4 min-w-4 min-h-4 shrink-0 flex items-center justify-center">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(v) => setAgreeToTerms(Boolean(v))}
                        style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px" }}
                        className="rounded-full ml-2 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700 [&_svg]:stroke-[3.5]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="select-none">
                        I agree to the Terms &amp; Conditions and Return Policy
                      </div>

                      <Link
                        href="/terms-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View Terms and Conditions"
                        className="inline-flex items-center justify-center rounded p-0.5 text-blue-500 transition-colors bg-blue-100 hover:bg-blue-200 hover:text-blue-600"
                      >
                        <MdArrowOutward className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Trust mini-badge */}
                <div className="hidden sm:flex items-center justify-around bg-gray-50 rounded-xl p-2.5 text-[10px] font-semibold text-gray-500 border border-gray-100">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Genuine Products</span>
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-green-600" /> Fast Delivery</span>
                </div>

                <div ref={inlineButtonRef} className="pt-2 lg:hidden">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitStep !== "idle" && submitStep !== "error"}
                    className="w-full h-12 text-lg sm:text-xl font-extrabold tracking-wider rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/30 transition-all hover:scale-[1.005] cursor-pointer"
                  >
                    {submitStep !== "idle" && submitStep !== "error" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {stepText[submitStep]}
                      </span>
                    ) : (
                      `Place Order`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Sticky CTA */}
      <div
        className={cn(
          "lg:hidden fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out bottom-0",
          isInlineButtonVisible
            ? "translate-y-full opacity-0 pointer-events-none invisible"
            : "translate-y-0 opacity-100 pointer-events-auto visible"
        )}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-6 max-w-md mx-auto">
          <div className="ml-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider leading-tight">
              Total
            </span>
            <span className="text-base font-black text-green-700 leading-none">
              {formatBDT(total)}
            </span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitStep !== "idle" && submitStep !== "error"}
            className="ml-6 flex-1 h-11 text-lg font-extrabold tracking-wider rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/30 cursor-pointer"
          >
            {submitStep !== "idle" && submitStep !== "error" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {stepText[submitStep]}
              </span>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </div>
    </StoreContainer>
  );
}