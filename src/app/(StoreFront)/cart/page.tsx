"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Package2,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles,
  BadgeCheck,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import StoreContainer from "@/components/Layout/StoreContainer";
import { useCart } from "@/redux/store/hooks/useCart";
import { CartItem } from "@/types/cart.types";
import { CartItemCard } from "@/components/Modules/Home/CartItemCard";
import { DesktopCartTable } from "@/components/Modules/Cart/DesktopCartTable";
import { kwPushBeginCheckout } from "@/lib/Analytics/kwEcom";
import { useApplyDiscountMutation } from "@/redux/store/api/discount/discountApi";
import { toast } from "sonner";

type DiscountLabel =
  | { type: "percentage"; value: number }
  | { type: "fixed"; value: number }
  | null;

const FREE_SHIPPING_MIN = 1000;

const EmptyCartIllustration = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="relative w-32 h-32 mb-4 flex items-center justify-center rounded-full bg-emerald-50">
      <ShoppingBag className="w-14 h-14 text-emerald-600" strokeWidth={1.5} />
    </div>

    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 text-center">
      Your Cart is Empty
    </h2>
    <p className="text-gray-500 text-center max-w-sm mb-5 text-xs sm:text-sm">
      Discover our signature collection of luxury concentrated attars and perfume oils.
    </p>

    <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
      <Button
        asChild
        size="default"
        className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold px-6"
      >
        <Link href="/shop">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Browse Collection
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        size="default"
        className="rounded-xl border-gray-200"
      >
        <Link href="/new-arrivals">
          <Package2 className="w-4 h-4 mr-2" />
          New Arrivals
        </Link>
      </Button>
    </div>
  </div>
);

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    appliedCouponCode,
    setAppliedCouponCode,
    clearAppliedCouponCode,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [isRouting, startTransition] = useTransition();
  const [checkoutClicked, setCheckoutClicked] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState<DiscountLabel>(null);

  const [applyDiscount, { isLoading: isApplyingDiscount }] =
    useApplyDiscountMutation();

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
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;

    return cartItems.reduce((sum: number, item: any) => {
      const direct = Number(item?.selectedPrice);
      const priceFromSelected = Number.isFinite(direct) ? direct : null;

      if (priceFromSelected !== null) {
        return sum + priceFromSelected * (Number(item?.quantity) || 1);
      }

      const [sizeValue, sizeUnit] = String(item?.selectedSize || "").split(" ");
      const matchedVariant = item?.product?.variants?.find(
        (v: any) =>
          Number(v?.size) === Number(sizeValue) &&
          String(v?.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
      );

      const selectedPrice = Number(matchedVariant?.price) || 0;
      return sum + selectedPrice * (Number(item?.quantity) || 1);
    }, 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce(
      (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
      0
    );
  }, [cartItems]);

  const buildDiscountItems = () => {
    return (cartItems || []).map((item: any) => {
      const [sizeValue, sizeUnit] = String(item?.selectedSize || "").split(" ");

      const matchedVariant = item?.product?.variants?.find(
        (v: any) =>
          Number(v?.size) === Number(sizeValue) &&
          String(v?.unit || "").toLowerCase() === String(sizeUnit || "").toLowerCase()
      );

      const price = Number(item?.selectedPrice ?? matchedVariant?.price ?? 0);
      const qty = Number(item?.quantity || 1);
      const productId = item?.product?.id || item?.product?._id || item?.productId;
      const variantId =
        item?.variantId ||
        item?.selectedVariantId ||
        matchedVariant?.id ||
        matchedVariant?._id;

      return { productId, variantId, price, qty };
    });
  };

  const pickDiscountAmount = (res: any) =>
    Number(res?.data?.discountAmount ?? res?.discountAmount ?? 0);

  const pickDiscountInfo = (res: any): DiscountLabel => {
    const items = res?.data?.items ?? res?.items ?? [];
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

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const total = discountedSubtotal;
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_MIN;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_MIN - discountedSubtotal);

  const applyCoupon = async () => {
    if (appliedCouponCode) {
      clearAppliedCouponCode();
      setDiscount(0);
      setDiscountInfo(null);
      toast.success("Coupon removed");
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (!code) return toast.error("Enter a coupon code");

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

      setAppliedCouponCode(code);
      setDiscount(discountAmount);
      setDiscountInfo(info);
      setCouponCode("");
      toast.success(`Coupon applied: -${formatBDT(discountAmount)}`);
    } catch (e: any) {
      const msg = e?.data?.message || e?.error || "Failed to apply coupon.";
      toast.error(msg);
    }
  };

  const removeCoupon = () => {
    clearAppliedCouponCode();
    setDiscount(0);
    setDiscountInfo(null);
    setCouponCode("");
    toast.success("Coupon removed");
  };

  useEffect(() => {
    const revalidate = async () => {
      if (!appliedCouponCode) return;
      if (!cartItems?.length) {
        clearAppliedCouponCode();
        setDiscount(0);
        setDiscountInfo(null);
        return;
      }

      try {
        const items = buildDiscountItems();
        const res = await applyDiscount({
          code: appliedCouponCode,
          items,
        }).unwrap();
        setDiscount(pickDiscountAmount(res));
        setDiscountInfo(pickDiscountInfo(res));
      } catch {
        clearAppliedCouponCode();
        setDiscount(0);
        setDiscountInfo(null);
      }
    };

    revalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, appliedCouponCode]);

  const handleCheckout = () => {
    if (checkoutClicked) return;
    setCheckoutClicked(true);

    const items = (cartItems || [])
      .map((item: any) => ({
        item_id: String(item?.product?.id || item?.product?.slug || ""),
        item_name: String(item?.product?.name || ""),
        item_brand: String(item?.product?.brand || "Khushbuwaala"),
        item_category: String(item?.product?.categoryId || ""),
        item_variant: String(item?.selectedSize || ""),
        price: Number(item?.selectedPrice || 0),
        quantity: Number(item?.quantity || 1),
      }))
      .filter((i: any) => i.item_id);

    kwPushBeginCheckout({
      currency: "BDT",
      value: Number(total || 0),
      items,
    });

    startTransition(() => {
      router.push("/checkout");
    });

    window.setTimeout(() => setCheckoutClicked(false), 5000);
  };

  return (
    <StoreContainer>
      <div className="min-h-screen bg-[#FBFBFA] pt-3 sm:pt-6 pb-8">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0 h-8 w-8 hover:bg-gray-100 rounded-full cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900">
                  Shopping Cart
                </h1>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                </p>
              </div>
            </div>

            {/* <div className="flex items-center gap-3.5 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-green-600" /> Nationwide Delivery
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Cash on Delivery
              </span>
            </div> */}
          </div>

          {totalItems === 0 ? (
            <EmptyCartIllustration />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Left Column: Cart Items List */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                {/* Mobile Cart View */}
                <div className="lg:hidden space-y-2.5">
                  {cartItems.map((item: CartItem) => (
                    <CartItemCard
                      key={`${item.product?.id}-${item.selectedSize}`}
                      item={item}
                    />
                  ))}
                </div>

                {/* Desktop Cart View */}
                <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm">
                  <DesktopCartTable items={cartItems} />
                </div>

                {/* Upsell / Value Proposition Card (Hidden on Mobile) */}
                <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mt-1.5">
                        Make it a signature set
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-lg">
                        Pair your current picks with a complementary note for a richer, longer-lasting scent experience.
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl shrink-0 text-xs border-gray-300 hover:bg-gray-50 h-8"
                    >
                      <Link href="/shop">
                        <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                        Explore More
                      </Link>
                    </Button>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        Authentic Perfumes
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-tight">
                        Pure organic & synthetic blends.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        Best Sellers
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-tight">
                        Popular choices loved nationwide.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                        <Truck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        Fast Delivery
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-tight">
                        Quick dispatch across Bangladesh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Summary & Checkout */}
              <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20 h-fit">
                {/* Free Shipping Alert Box */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-green-600" />
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold">
                          Free Shipping Unlocked!
                        </span>
                      ) : (
                        <span>
                          Add <strong>{formatBDT(remainingForFreeShipping)}</strong> more for FREE shipping
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-[11px] text-gray-500">
                      {Math.min(
                        100,
                        Math.round((discountedSubtotal / FREE_SHIPPING_MIN) * 100)
                      )}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((discountedSubtotal / FREE_SHIPPING_MIN) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Order Summary Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900">Order Summary</h3>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 font-bold text-[11px] px-2 py-0.5"
                    >
                      {totalItems} items
                    </Badge>
                  </div>

                  {/* Promo Input / Applied Box */}
                  <div>
                    {appliedCouponCode ? (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-800 truncate">
                            {appliedCouponCode}
                          </span>
                          {discountLabel && (
                            <span className="text-emerald-700 text-[11px] font-semibold whitespace-nowrap">
                              ({discountLabel})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeCoupon}
                          className="h-6 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Tag className="absolute left-2.5 top-2/5 sm:top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <Input
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="h-8 pl-8 text-xs bg-gray-50/60 uppercase border-gray-200"
                          />
                        </div>
                        <Button
                          onClick={applyCoupon}
                          disabled={!couponCode.trim() || isApplyingDiscount}
                          variant="outline"
                          className="h-8 text-xs font-bold border-gray-300 px-3"
                        >
                          {isApplyingDiscount ? "..." : "Apply"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-600 pt-1.5 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        {formatBDT(subtotal)}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>
                          {discountLabel ? `${discountLabel} ` : ""}
                          Discount{appliedCouponCode ? ` (${appliedCouponCode})` : ""}
                        </span>
                        <span>-{formatBDT(discount)}</span>
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal after discount</span>
                        <span className="font-medium text-gray-900">
                          {formatBDT(discountedSubtotal)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Estimated Shipping</span>
                      <span>
                        {isFreeShipping ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                            FREE
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Calculated at checkout</span>
                        )}
                      </span>
                    </div>

                    <Separator className="my-0.5" />

                    <div className="flex justify-between items-baseline pt-0.5">
                      <span className="text-sm font-bold text-gray-900">Payable Total</span>
                      <span className="text-lg font-black text-gray-900">
                        {formatBDT(total)}
                      </span>
                    </div>
                  </div>

                  {/* Proceed to Checkout CTA */}
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutClicked || isRouting}
                    className="w-full h-11 text-sm sm:text-base font-extrabold tracking-wider rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {checkoutClicked || isRouting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Secure checkout powered by SSL encryption
                  </p>
                </div>

                {/* Payment Image Trust Card */}
                <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="py-0 px-3.5 border-b border-gray-100">
                    <CardTitle className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Safe Checkout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex items-center justify-center">
                    <div className="relative w-full h-20">
                      <Image
                        src="/images/pay-with.jpeg"
                        alt="Payment Methods: bKash, Nagad, Rocket, Visa, Mastercard"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreContainer>
  );
}