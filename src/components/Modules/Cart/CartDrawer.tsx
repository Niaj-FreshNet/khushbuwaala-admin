"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/redux/store/hooks/useCart";
import { kwPushBeginCheckout } from "@/lib/Analytics/kwEcom";

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 1000;

export default function CartDrawer({ visible, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, calculateSubtotal } =
    useCart() || {
      cartItems: [],
      updateQuantity: () => { },
      removeFromCart: () => { },
      calculateSubtotal: () => 0,
    };

  const totalItems = useMemo(() => {
    return Array.isArray(cartItems)
      ? cartItems.reduce(
        (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
        0
      )
      : 0;
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return Number(calculateSubtotal() || 0);
  }, [calculateSubtotal]);

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );

  const formatBDT = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    })
      .format(Math.max(0, Math.round(Number(amount || 0))))
      .replace("BDT", "৳")
      .trim();

  const subtotalRef = useRef<HTMLDivElement | null>(null);
  const checkoutBtnRef = useRef<HTMLButtonElement | null>(null);
  const [checkoutNudge, setCheckoutNudge] = useState(false);

  // Red curved arrow & traveling spark animation for clear direction
  const drawCheckoutGuide = () => {
    if (typeof window === "undefined") return;

    const fromEl = subtotalRef.current;
    const toEl = checkoutBtnRef.current;
    if (!fromEl || !toEl) return;

    const to = toEl.getBoundingClientRect();

    const x0 = Math.min(window.innerWidth - 20, to.left - 20);
    const y0 = Math.max(30, to.top - 120);

    const x1 = to.left + to.width * 0.5;
    const y1 = to.top + to.height * 0.5;

    const dx = x1 - x0;
    const dy = y1 - y0;

    const curveUp = Math.min(200, Math.max(90, Math.abs(dy) * 0.45));
    const cx = x0 + dx * 0.35;
    const cy = y0 + dy * 0.35 - curveUp;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "fixed";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.zIndex = "99999";
    svg.style.pointerEvents = "none";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "kw-checkout-arrow");
    marker.setAttribute("markerWidth", "14");
    marker.setAttribute("markerHeight", "14");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "4");
    marker.setAttribute("orient", "auto");

    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M0,0 L12,4 L0,8 Z");
    // Red arrowhead (Tailwind red-600)
    arrowPath.setAttribute("fill", "rgba(220, 38, 38, 0.95)");
    marker.appendChild(arrowPath);
    defs.appendChild(marker);

    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", "kw-checkout-grad");
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "0%");

    // Gradient transition: Red-500 -> Red-600
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "rgba(239, 68, 68, 0.95)");

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "rgba(220, 38, 38, 0.95)");
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const d = `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;

    const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    glowPath.setAttribute("d", d);
    glowPath.setAttribute("fill", "none");
    glowPath.setAttribute("stroke", "url(#kw-checkout-grad)");
    glowPath.setAttribute("stroke-width", "10");
    glowPath.setAttribute("stroke-linecap", "round");
    glowPath.setAttribute("stroke-dasharray", "10 12");
    glowPath.setAttribute("opacity", "0.22");
    svg.appendChild(glowPath);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "url(#kw-checkout-grad)");
    path.setAttribute("stroke-width", "5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-dasharray", "10 12");
    path.setAttribute("marker-end", "url(#kw-checkout-arrow)");
    svg.appendChild(path);

    // Traveling spark dot & outer halo in red
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("r", "6");
    dot.setAttribute("fill", "rgba(220, 38, 38, 0.98)");
    dot.setAttribute("opacity", "0.95");

    const dotGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dotGlow.setAttribute("r", "12");
    dotGlow.setAttribute("fill", "rgba(239, 68, 68, 0.3)");

    svg.appendChild(dotGlow);
    svg.appendChild(dot);

    dot.setAttribute("cx", String(x0));
    dot.setAttribute("cy", String(y0));
    dotGlow.setAttribute("cx", String(x0));
    dotGlow.setAttribute("cy", String(y0));

    document.body.appendChild(svg);

    const totalLen = path.getTotalLength();
    path.style.strokeDasharray = `${totalLen}`;
    path.style.strokeDashoffset = `${totalLen}`;
    glowPath.style.strokeDasharray = `${totalLen}`;
    glowPath.style.strokeDashoffset = `${totalLen}`;

    glowPath.animate(
      [{ strokeDashoffset: totalLen }, { strokeDashoffset: 0 }],
      { duration: 520, easing: "ease-out", fill: "forwards" }
    );

    path.animate(
      [{ strokeDashoffset: totalLen }, { strokeDashoffset: 0 }],
      { duration: 520, easing: "ease-out", fill: "forwards" }
    );

    const start = performance.now();
    const travelMs = 900;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / travelMs);
      const p = path.getPointAtLength(totalLen * t);

      dot.setAttribute("cx", String(p.x));
      dot.setAttribute("cy", String(p.y));
      dotGlow.setAttribute("cx", String(p.x));
      dotGlow.setAttribute("cy", String(p.y));

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Button pulse ring animation using red hue to catch user's eye
    toEl.animate(
      [
        { boxShadow: "0 0 0 0 rgba(220,38,38,0)", transform: "scale(1)" },
        { boxShadow: "0 0 0 8px rgba(220,38,38,0.22)", transform: "scale(1.02)" },
        { boxShadow: "0 0 0 0 rgba(220,38,38,0)", transform: "scale(1)" },
      ],
      { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" }
    );

    const cleanup = () => {
      cancelAnimationFrame(raf);
      try {
        svg.remove();
      } catch { }
    };

    const kill = window.setTimeout(cleanup, 1600);

    toEl.addEventListener(
      "click",
      () => {
        window.clearTimeout(kill);
        cleanup();
      },
      { once: true }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runGuide = () => {
      if (!visible) return;
      setCheckoutNudge(true);

      window.setTimeout(() => {
        drawCheckoutGuide();
      }, 120);

      window.setTimeout(() => setCheckoutNudge(false), 1200);
    };

    window.addEventListener("kw:cart-opened", runGuide);

    if (visible) {
      window.setTimeout(runGuide, 50);
    }

    return () => {
      window.removeEventListener("kw:cart-opened", runGuide);
    };
  }, [visible]);

  const handleCheckout = () => {
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
      value: subtotal,
      items,
    });

    onClose();
    router.push("/checkout");
  };

  const redirectToCart = () => {
    onClose();
    router.push("/cart");
  };

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-[88vw] max-w-[420px] sm:w-[420px] sm:max-w-[430px] flex flex-col p-0 bg-[#FBFBFA] border-l border-gray-200"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-gray-200 bg-white">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-green-700 rounded-lg">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                  Shopping Cart
                </h3>
                <p className="text-[11px] font-normal text-gray-500">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            {totalItems > 0 && (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 py-0.5 text-xs"
              >
                {formatBDT(subtotal)}
              </Badge>
            )}
          </SheetTitle>

          {/* Dynamic Free Shipping Bar */}
          {totalItems > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1 text-[11px]">
                  <Truck className="h-3 w-3 text-green-600" />
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-emerald-700 font-bold">
                      🎉 Free Delivery Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add <strong>{formatBDT(remainingForFreeShipping)}</strong> for{" "}
                      <span className="text-emerald-700 font-bold">FREE Delivery</span>
                    </span>
                  )}
                </span>
                <span className="font-bold text-[10px] text-gray-500">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Scrollable Items with Compact Height */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-3 sm:px-4 py-2.5 overflow-y-auto">
            {totalItems > 0 ? (
              <div className="space-y-2 pb-1">
                {cartItems.map((item: any, idx: number) => {
                  const product = item?.product || {};
                  const size = item?.selectedSize || "";
                  const itemPrice = Number(item?.selectedPrice || 0);
                  const linePrice = itemPrice * Number(item?.quantity || 1);

                  return (
                    <div
                      key={`${product?.id}-${size}-${idx}`}
                      className="group bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex gap-3 items-center"
                    >
                      {/* Compact Image */}
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <Image
                          src={
                            product?.primaryImage ||
                            "/placeholder.svg?height=64&width=56"
                          }
                          alt={product?.name || "Product"}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      {/* Content Area - tight gap, zero excessive padding */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-center gap-1.5">
                          <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">
                            {product?.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                product?.id,
                                size,
                                product?.name,
                                item?.cartItemId
                              )
                            }
                            className="text-gray-400 hover:text-rose-500 transition-colors p-0.5 shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                          Size:{" "}
                          <span className="font-medium text-gray-700">
                            {size}
                          </span>
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-md bg-gray-50">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6.5! min-h-0! py-0  w-6 p-0 hover:bg-gray-100 text-gray-600 rounded-none rounded-l-md"
                              onClick={() =>
                                updateQuantity(
                                  product?.id,
                                  size,
                                  Math.max(1, (item.quantity || 1) - 1),
                                  product?.name,
                                  item.cartItemId
                                )
                              }
                              disabled={(item?.quantity || 1) <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="text-[11px] font-semibold text-gray-900 w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6.5! min-h-0! py-0  w-6 p-0 hover:bg-gray-100 text-gray-600 rounded-none rounded-r-md"
                              onClick={() =>
                                updateQuantity(
                                  product?.id,
                                  size,
                                  (item.quantity || 1) + 1,
                                  product?.name,
                                  item.cartItemId
                                )
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>

                          <span className="text-xs font-bold text-gray-900">
                            {formatBDT(linePrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-gray-500 mb-5 max-w-xs">
                  Discover our pure perfume oils and find your personal signature blend.
                </p>
                <Button
                  onClick={onClose}
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold px-5 h-9 text-xs"
                >
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* Drawer Footer */}
          {totalItems > 0 && (
            <div className="border-t border-gray-200 bg-white p-3.5 space-y-2.5">
              <div
                ref={subtotalRef}
                className="space-y-1 text-xs"
              >
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        FREE
                      </span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="text-xs font-bold text-gray-900">
                    Estimated Total
                  </span>
                  <span className="text-base font-black text-gray-900">
                    {formatBDT(subtotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-0.5">
                <Button
                  ref={checkoutBtnRef}
                  onClick={handleCheckout}
                  className="w-full h-11 text-xs sm:text-sm font-extrabold tracking-wider rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={redirectToCart}
                  className="w-full h-9 text-xs font-semibold rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  View Full Cart
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-around pt-0.5 text-[10px] font-semibold text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Genuine Products
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-green-600" /> Fast Delivery
                </span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}