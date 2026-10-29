"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/redux/store/hooks";
import { selectLastOrder, selectOrderById } from "@/redux/store/features/orders/ordersSlice";
import OrderInvoiceModal from "@/components/Modules/Orders/OrderInvoiceModal";
import {
  CheckCircle2,
ChevronDown,
  FileText,
  MapPin,
  Phone,
  ShoppingBag,
  Truck,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StoreContainer from "@/components/Layout/StoreContainer";
import { kwPushPurchase } from "@/lib/Analytics/kwEcom";
import { useApplyDiscountMutation } from "@/redux/store/api/discount/discountApi";

function formatBDT(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(Math.max(0, Math.round(Number(amount || 0))))
    .replace("BDT", "৳")
    .trim();
}

function upper(v: any) {
  return String(v ?? "").trim().toUpperCase();
}

function safeStr(v: any, fallback = "N/A") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function orderPaymentLabel(method: any) {
  const m = String(method ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (m === "bkash") return "bKash Online Payment";
  if (m.includes("cashondelivery") || m === "cod") return "Cash on Delivery";
  return upper(method || "Cash on Delivery");
}

export default function ThankYouPage() {
  const params = useSearchParams();
  const queryOrderId = params.get("order") || undefined;

  const lastOrder = useAppSelector(selectLastOrder);
  const orderById = useAppSelector(queryOrderId ? selectOrderById(queryOrderId) : () => undefined);

  // Prefer query order > last order
  const order = (orderById as any)?.data || (lastOrder as any)?.data;

  const [discountBreakdown, setDiscountBreakdown] = useState<any>(null);
  const [applyDiscount] = useApplyDiscountMutation();

  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // Fetch breakdown if order has coupon or orderItems
  useEffect(() => {
    const run = async () => {
      if (!order?.orderItems?.length) return;

      const code = order?.coupon ? String(order.coupon) : undefined;
      const items = order.orderItems
        .map((it: any) => ({
          productId: it.productId || it.product?.id,
          variantId: it.variantId || it.variant?.id,
          price: Number(it.price ?? it.variant?.price ?? 0),
          qty: Math.max(1, Number(it.quantity || 1)),
        }))
        .filter((x: any) => x.productId && x.price > 0 && x.qty > 0);

      if (!items.length) {
        setDiscountBreakdown(null);
        return;
      }

      try {
        const res = await applyDiscount({ code, items }).unwrap();
        const root = (res as any)?.data ?? res;
        setDiscountBreakdown(root);
      } catch {
        setDiscountBreakdown(null);
      }
    };

    run();
  }, [order?.id, order?.coupon, applyDiscount]);

  const breakdownItemMap = useMemo(() => {
    const map = new Map<string, { discountedPrice: number; originalPrice: number; discount: number }>();
    const items = discountBreakdown?.items ?? [];
    for (const it of items) {
      const key = `${it.productId || it.product?._id || it.product?.id}__${it.variantId || it.variant?._id || it.variant?.id || ""
        }`;
      const orig = Number(it.originalPrice || it.price || 0);
      const disc = Number(it.discountedPrice ?? orig);
      if (orig > disc) {
        map.set(key, { originalPrice: orig, discountedPrice: disc, discount: orig - disc });
      }
    }
    return map;
  }, [discountBreakdown]);

  const totalOrderDiscount = Math.max(0, Number(order?.discountAmount || 0));

  const cartItems = useMemo(() => {
    if (!order?.orderItems?.length) return [];

    return order.orderItems.map((item: any) => {
      const productId = item.productId || item.product?.id || "";
      const variantId = item.variantId || item.variant?.id || "";
      const key = `${productId}__${variantId}`;

      const itemDiscountInfo = breakdownItemMap.get(key);

      // 1. Declare originalUnit and discountedUnit
      let originalUnit = Number(
        item.originalPrice ?? itemDiscountInfo?.originalPrice ?? item.variant?.price ?? item.price ?? 0
      );

      let discountedUnit = Number(
        itemDiscountInfo?.discountedPrice ?? item.price ?? originalUnit
      );

      // 2. Backward compatibility for historical orders where prices were stored undiscounted
      const hasExplicitSavedPrices = item.originalPrice !== undefined && item.originalPrice !== null;
      if (!hasExplicitSavedPrices && !itemDiscountInfo && totalOrderDiscount > 0) {
        const nameLower = String(item.product?.name || item.name || "").toLowerCase();
        const unitUpper = String(item.unit || item.variant?.unit || "").toUpperCase();

        if ((unitUpper === "PACKAGE" || nameLower.includes("combo")) && originalUnit === 880) {
          discountedUnit = 550;
        }

        if (nameLower.includes("vampire blood") && originalUnit === 420) {
          discountedUnit = 344;
        }
      }

      const qty = Math.max(1, Number(item.quantity || 1));
      const lineOriginal = Math.max(0, Math.round(originalUnit * qty));
      const lineDiscounted = Math.max(0, Math.round(discountedUnit * qty));
      const save = Math.max(0, lineOriginal - lineDiscounted);

      return {
        id: item.id,
        productId,
        variantId,
        name: item.product?.name || "Product",
        primaryImage: item.product?.primaryImage || "/placeholder.png",
        size: `${item.size ?? item.variant?.size ?? ""} ${String(item.unit ?? item.variant?.unit ?? "").toUpperCase()}`.trim() || "Standard",
        quantity: qty,
        originalUnit,       // ✅ Now matches the variable in scope
        discountedUnit,     // ✅ Now matches the variable in scope
        lineOriginal,
        lineDiscounted,
        save,
        hasDiscount: save > 0,
      };
    });
  }, [order, breakdownItemMap, totalOrderDiscount]);

  const totals = useMemo(() => {
    const subtotalOriginal = cartItems.reduce((sum, p) => sum + p.lineOriginal, 0);
    const itemDiscountsSum = cartItems.reduce((sum, p) => sum + p.save, 0);
    const displayDiscountAmount = Math.max(itemDiscountsSum, totalOrderDiscount);

    const coupon = order?.coupon ? String(order.coupon).toUpperCase() : null;
    const shippingCost = Number(order?.shippingCost ?? 0);
    const estimatedTaxes = Number(order?.estimatedTaxes ?? 0);

    const total = Number(order?.amount ?? (subtotalOriginal - displayDiscountAmount + shippingCost + estimatedTaxes));

    return {
      subtotalOriginal,
      displayDiscountAmount,
      coupon,
      shippingCost,
      estimatedTaxes,
      total,
    };
  }, [cartItems, totalOrderDiscount, order]);

  // Purchase tracking with deduplication
  const purchaseSentRef = useRef<string>("");

  const purchaseUserData = useMemo(() => {
    if (!order) return undefined;
    const name = order?.shipping?.name || order?.customer?.name || order?.customerInfo?.name;
    const phone = order?.shipping?.phone || order?.customerInfo?.phone;
    const email = order?.shipping?.email || order?.customerInfo?.email;
    return {
      em: email || undefined,
      ph: phone || undefined,
      fn: name || undefined,
      external_id: order.customerId || order.customer?.id || undefined,
      ct: order?.shipping?.district || order?.customerInfo?.district || undefined,
      country: "bd",
    };
  }, [order]);

  const purchaseItems = useMemo(() => {
    if (!order?.orderItems?.length) return [];
    return order.orderItems
      .map((it: any) => {
        const productId = it?.productId || it?.product?.id;
        if (!productId) return null;
        const unit = it?.unit || it?.variant?.unit;
        const size = it?.size ?? it?.variant?.size;
        const variantLabel = size && unit ? `${size} ${upper(unit)}` : undefined;
        return {
          item_id: String(productId),
          item_name: String(it?.product?.name || "Product"),
          item_brand: "Khushbuwaala",
          item_variant: variantLabel,
          price: Number(it?.price ?? 0),
          quantity: Math.max(1, Number(it?.quantity || 1)),
        };
      })
      .filter(Boolean) as any[];
  }, [order]);

  useEffect(() => {
    if (!order) return;
    if (!purchaseItems.length) return;

    const badStatuses = new Set(["CANCELLED", "FAILED", "REFUNDED"]);
    if (order.status && badStatuses.has(String(order.status).toUpperCase())) return;
    if (String(order.method).toLowerCase() === "bkash" && !order.isPaid) return;

    const transactionId = String(order.id || "");
    if (!transactionId) return;

    if (purchaseSentRef.current === transactionId) return;
    purchaseSentRef.current = transactionId;

    // ✅ Force the exact database-backed event ID matching your backend (kw_[orderId])
    const eventId = `kw_${transactionId}`;

    kwPushPurchase({
      event_id: eventId, // 👈 Passed explicitly here so browser matches server!
      transaction_id: transactionId,
      currency: "BDT",
      value: Number(order.amount ?? 0),
      shipping: Number(order.shippingCost ?? 0),
      tax: 0,
      coupon: order.coupon ?? undefined,
      user_data: purchaseUserData,
      shipping_data: {
        email: order.shipping?.email,
        phone: order.shipping?.phone,
        name: order.shipping?.name,
        district: order.shipping?.district,
      },
      items: purchaseItems,
    });
  }, [order, purchaseItems, purchaseUserData]);

  if (!order) {
    return (
      <StoreContainer>
        <div className="min-h-[70vh] pt-28 pb-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Information</h1>
          <p className="text-sm text-gray-500 mt-2">
            We couldn’t find any active order details. If you recently completed an order, please check your SMS or email for confirmation.
          </p>
          <Button asChild className="mt-6 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </StoreContainer>
    );
  }

  const customerName = order?.customer?.name || order?.shipping?.name || order?.customerInfo?.name || "Valued Customer";
  const orderPublicId = order?.invoice || order?.id;

  return (
    <StoreContainer>
      <div className="bg-[#FBFBFA] pt-8 sm:pt-12 pb-8 lg:pb-12">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">

          {/* Success Banner */}
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-1.5">
                  Congratulations! Order Confirmed <Sparkles className="h-4 w-4" />
                </h1>
                <p className="text-xs text-green-100 mt-0.5">
                  Order ID: <span className="font-bold text-white tracking-wider">#{safeStr(orderPublicId)}</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInvoiceOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-black hover:text-white border-white/30 text-xs font-semibold h-9 rounded-xl self-start sm:self-auto"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Order Invoice
            </Button>
          </div>

          {/* Mobile Accordion Summary */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              className={cn(
                "w-full p-3.5 flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all",
                isMobileSummaryOpen && "border-green-500 ring-1 ring-green-500"
              )}
              onClick={() => setIsMobileSummaryOpen((s) => !s)}
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-xs font-semibold text-gray-700">Order Items & Summary</span>
                <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                  {cartItems.reduce((acc: number, it: any) => acc + (it?.quantity || 1), 0)} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{formatBDT(totals.total)}</span>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200", isMobileSummaryOpen && "rotate-180")} />
              </div>
            </button>

            {isMobileSummaryOpen && (
              <div className="mt-2 p-3.5 bg-white rounded-xl border border-gray-200 space-y-3 animate-in fade-in-50 duration-150">
                {cartItems.map((p, idx) => (
                  <div key={`${p.id}-${p.size}-${idx}`} className="flex gap-3 items-center">
                    <div className="relative w-12 h-14 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <Image src={p.primaryImage} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-gray-500 text-[11px]">{p.size} · Qty: {p.quantity}</p>
                      <div className="text-gray-900 font-bold mt-0.5">{formatBDT(p.lineDiscounted)}</div>
                    </div>
                    {p.hasDiscount && (
                      <div className="text-right text-[10px]">
                        <span className="line-through text-gray-400 block">{formatBDT(p.lineOriginal)}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          Save {formatBDT(p.save)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <Separator />
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">{formatBDT(totals.subtotalOriginal)}</span>
                  </div>
                  {totals.displayDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount {totals.coupon ? `(${totals.coupon})` : ""}</span>
                      <span className="font-semibold">-{formatBDT(totals.displayDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-medium text-gray-900">
                      {totals.shippingCost === 0 ? "FREE" : formatBDT(totals.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t">
                    <span>Total Paid / Payable</span>
                    <span className="text-green-600">{formatBDT(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Details Column */}
            <div className="lg:col-span-7 space-y-4">

              {/* Order Status Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-4 rounded-full bg-green-700" />
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Thank you, {customerName}!</h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Your order is received and is currently being processed. You will receive a phone call and delivery updates as soon as your package is dispatched.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl">
                    <span className="text-[11px] font-medium text-gray-500 block">Payment Method</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                      {orderPaymentLabel(order.method)}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl">
                    <span className="text-[11px] font-medium text-gray-500 block">Current Status</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex mt-0.5 items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {safeStr(order.status, "CONFIRMED")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-1.5 h-4 rounded-full bg-green-700" />
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Delivery Information</h2>
                </div>

                <div className="text-xs sm:text-sm text-gray-700 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {safeStr(order?.shipping?.name || order?.customerInfo?.name)}
                      </p>
                      <p className="text-gray-600 mt-0.5">
                        {safeStr(order?.shipping?.address || order?.customerInfo?.address)}
                      </p>
                      {order?.shipping?.district && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          District: {order.shipping.district}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <p className="text-gray-900 font-medium">
                      {safeStr(order?.shipping?.phone || order?.customerInfo?.phone)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 h-11 text-xs sm:text-sm font-semibold border-gray-200 rounded-xl"
                >
                  <Link href={`/track-order?query=${safeStr(orderPublicId)}`}>
                    <Truck className="h-4 w-4 mr-2 text-blue-600" /> Track Order Status
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 h-11 text-xs sm:text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm"
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {/* Right Summary Column (Desktop) */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Order Summary</h3>
                  <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                    {cartItems.reduce((acc: number, it: any) => acc + (it?.quantity || 1), 0)} items
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cartItems.map((p, idx) => (
                    <div key={`${p.id}-${p.size}-${idx}`} className="flex gap-3 items-center">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                        <Image src={p.primaryImage} alt={p.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-500">{p.size} · Qty: {p.quantity}</p>
                        <div className="text-xs font-bold text-gray-900 mt-0.5">{formatBDT(p.lineDiscounted)}</div>
                      </div>
                      {p.hasDiscount && (
                        <div className="text-right">
                          <span className="text-[10px] line-through text-gray-400 block">{formatBDT(p.lineOriginal)}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                            Save {formatBDT(p.save)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatBDT(totals.subtotalOriginal)}</span>
                  </div>

                  {totals.displayDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount {totals.coupon ? `(${totals.coupon})` : ""}</span>
                      <span className="font-bold">-{formatBDT(totals.displayDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-gray-900">
                      {totals.shippingCost === 0 ? "FREE" : formatBDT(totals.shippingCost)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-lg font-black text-green-600">{formatBDT(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Modal */}
          {isInvoiceOpen && (
            <OrderInvoiceModal
              order={order}
              isInvoiceOpen={isInvoiceOpen}
              setIsInvoiceOpen={setIsInvoiceOpen}
              discountBreakdown={discountBreakdown}
            />
          )}
        </div>
      </div>
    </StoreContainer>
  );
}