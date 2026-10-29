"use client";

import { useCart } from "@/context/CartContext";
import { Loader2, ShoppingCart, Zap } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useProductSelectionOptional } from "@/context/ProductSelectionContext";
import { IDiscount, IProduct, IProductVariant } from "@/types/product.types";
import { useRouter } from "next/navigation";
import flyToCart from "./FlyToCart";
import { kwPushAddToCart, kwPushBeginCheckout } from "@/lib/Analytics/kwEcom";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ProductPageBottomBar({ product }: { product: IProduct }) {
    const cart = useCart();
    const router = useRouter();

    const sizeKeys = product.variants?.length
        ? product.variants.map((v) => `${v.size} ${v.unit.toLowerCase()}`)
        : ["3 ml", "6 ml", "12 ml", "25 ml"];

    const selection = useProductSelectionOptional();
    const [fallbackSelectedSize] = useState<string>(sizeKeys[0] || "3 ml");
    const [fallbackQuantity, setFallbackQuantity] = useState<number>(1);

    const [isAdding, setIsAdding] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Scroll visibility state
    const [isVisible, setIsVisible] = useState(false);

    const busy = isAdding || isBuying || isPending;

    const quantity = selection?.quantity ?? fallbackQuantity;
    const setQuantity = selection?.setQuantity ?? setFallbackQuantity;

    const selectedSize = selection?.selectedVariant
        ? `${selection.selectedVariant.size} ${selection.selectedVariant.unit.toLowerCase()}`
        : fallbackSelectedSize;

    // Track the primary CTA block on the page to trigger smooth enter/exit
    useEffect(() => {
        const mainActionButtons = document.getElementById("action-buttons");

        if (!mainActionButtons) {
            // Fallback: show after 400px of scrolling if ID is absent
            const onScroll = () => {
                setIsVisible(window.scrollY > 400);
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Bar is visible only when main buttons have scrolled above the viewport
                const isPastMainButtons =
                    !entry.isIntersecting && entry.boundingClientRect.top < 0;
                setIsVisible(isPastMainButtons);
            },
            { threshold: 0.1 }
        );

        observer.observe(mainActionButtons);
        return () => observer.disconnect();
    }, []);

    // Update root padding dynamically when visible
    useEffect(() => {
        const el = document.getElementById("sticky-cart");
        if (!el || !isVisible) {
            document.documentElement.style.removeProperty("--kw-bottom-bar-h");
            return;
        }

        const applyPadding = () => {
            const h = el.getBoundingClientRect().height;
            document.documentElement.style.setProperty("--kw-bottom-bar-h", `${h}px`);
        };

        applyPadding();
        const ro = new ResizeObserver(applyPadding);
        ro.observe(el);

        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty("--kw-bottom-bar-h");
        };
    }, [isVisible]);

    // Current variant lookup
    const getCurrentVariant = () => {
        return product.variants?.find(
            (v) => `${v.size} ${v.unit.toLowerCase()}` === selectedSize
        );
    };

    const currentVariant = getCurrentVariant();
    const currentPriceRaw = currentVariant?.price ?? product.minPrice ?? 0;
    const currentPrice = Math.round(Number(currentPriceRaw) || 0);

    const getActiveDiscount = (
        product: Partial<IProduct>,
        variant?: IProductVariant
    ): IDiscount | null => {
        const now = new Date();
        const discounts = variant?.discounts?.length
            ? variant.discounts
            : product.discounts;

        if (!discounts || discounts.length === 0) return null;

        return (
            discounts.find((d) => {
                const startOk = !d.startDate || new Date(d.startDate) <= now;
                const endOk = !d.endDate || new Date(d.endDate) >= now;
                return startOk && endOk;
            }) || null
        );
    };

    const discount = getActiveDiscount(product, currentVariant);
    let discountedPrice = currentPrice;

    if (discount) {
        if (discount.type === "percentage") {
            discountedPrice =
                currentPrice - (currentPrice * Number(discount.value || 0)) / 100;
        } else if (discount.type === "fixed") {
            discountedPrice = currentPrice - Number(discount.value || 0);
        }
    }

    discountedPrice = Math.max(0, Math.round(discountedPrice));

    const totalCurrent = Math.round(currentPrice * quantity);
    const totalDiscounted = Math.round(discountedPrice * quantity);

    const price = Math.round(
        Number(selection?.selectedVariant?.price ?? product.minPrice ?? 0)
    );
    const selectedPrice = discount ? discountedPrice : price;

    const activeDiscount = getActiveDiscount(product, currentVariant);
    const discountValue =
        activeDiscount?.type === "percentage" ? activeDiscount.value : 0;

    const handleQuantityChange = (type: "increment" | "decrement") => {
        const next =
            type === "increment"
                ? Math.min(quantity + 1, 100)
                : Math.max(quantity - 1, 1);
        setQuantity(next);
    };

    const handleAddToCart = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            if (busy) return;
            setIsAdding(true);
            try {
                flyToCart(e.currentTarget, (product as any)?.primaryImage);
                cart?.addToCart?.(
                    product as any,
                    quantity,
                    selectedSize,
                    selectedPrice
                );

                kwPushAddToCart({
                    currency: "BDT",
                    value: Math.round(selectedPrice),
                    items: [
                        {
                            item_id: String(
                                (product as any).id || (product as any).slug || product.name
                            ),
                            item_name: product.name,
                            item_brand: (product as any).brand || "Khushbuwaala",
                            item_category:
                                (product as any).categoryId ||
                                (product as any).category?.categoryName ||
                                "product",
                            item_variant: selectedSize || undefined,
                            price: Math.round(selectedPrice),
                            quantity: 1,
                        },
                    ],
                });

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("kw:cart-added"));
                }

                await new Promise((r) => setTimeout(r, 600));
            } finally {
                setIsAdding(false);
            }
        },
        [cart, product, quantity, selectedSize, selectedPrice, busy]
    );

    const handleBuyNow = useCallback(async () => {
        if (busy) return;
        setIsBuying(true);
        try {
            cart?.addToCart?.(
                product as any,
                quantity,
                selectedSize,
                selectedPrice
            );

            kwPushBeginCheckout({
                currency: "BDT",
                value: discountedPrice * quantity,
                items: [
                    {
                        item_id: String(
                            (product as any).id || (product as any).slug || product.name
                        ),
                        item_name: product.name,
                        item_brand: (product as any).brand || "Khushbuwaala",
                        item_category:
                            (product as any).categoryId ||
                            (product as any).category?.categoryName ||
                            "product",
                        item_variant: selectedSize || undefined,
                        price: Math.round(selectedPrice),
                        quantity,
                    },
                ],
            });

            await new Promise((r) => setTimeout(r, 300));
            startTransition(() => {
                router.push("/checkout");
            });
        } finally {
            setIsBuying(false);
        }
    }, [
        cart,
        product,
        quantity,
        selectedSize,
        selectedPrice,
        discountedPrice,
        router,
        busy,
        startTransition,
    ]);

    return (
        <aside
            id="sticky-cart"
            aria-label="Quick order sticky bar"
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isVisible
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-full opacity-0 pointer-events-none"
            )}
        >
            {/* Frosted Glass Backdrop */}
            <div className="absolute inset-0 bg-white/92 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.12)]" />

            {/* Content Container */}
            <div className="relative mx-auto max-w-7xl px-3 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2.5">
                {/* =========================
            DESKTOP / TABLET (md+)
        ========================== */}
                <div className="hidden md:flex items-center justify-between gap-6">
                    {/* Left: Product Media & Meta */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                            <Image
                                src={product.primaryImage}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                    {product.name}
                                </h3>
                                {discountValue > 0 && (
                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {discountValue}% OFF
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200/60 font-medium">
                                    Size: <strong className="text-gray-900">{selectedSize}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200/60 font-medium">
                                    Qty: <strong className="text-gray-900">{quantity}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Pricing & CTAs */}
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-1">
                            <div className="text-[11px] text-gray-500 font-medium leading-none">
                                Total Price
                            </div>
                            <div className="text-xl font-extrabold text-gray-900 leading-tight">
                                ৳{totalDiscounted.toLocaleString()}
                            </div>
                            {totalDiscounted !== totalCurrent && (
                                <div className="text-xs text-gray-400 line-through leading-none">
                                    ৳{totalCurrent.toLocaleString()}
                                </div>
                            )}
                        </div>

                        {/* Add to Cart */}
                        <button
                            disabled={busy}
                            aria-busy={busy}
                            onClick={handleAddToCart}
                            className="h-11 px-5 rounded-xl font-bold shadow-xs transition-all duration-200
                bg-linear-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white
                hover:shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <span className="flex items-center gap-2 text-sm">
                                {isAdding ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ShoppingCart className="w-4 h-4" />
                                )}
                                {isAdding ? "Adding..." : "Add to Cart"}
                            </span>
                        </button>

                        {/* Buy Now */}
                        <button
                            disabled={busy}
                            aria-busy={busy}
                            onClick={handleBuyNow}
                            className="h-11 px-6 rounded-xl font-bold shadow-xs transition-all duration-200
                bg-linear-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white
                hover:shadow-md active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <span className="flex items-center gap-2 text-sm">
                                {isBuying || isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4 fill-current" />
                                )}
                                {isBuying || isPending ? "Processing..." : "Buy Now"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* =========================
            MOBILE (below md)
        ========================== */}
                <div className="md:hidden space-y-2">
                    {/* Top Row: Thumbnail + Title + Stepper + Price */}
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                                <Image
                                    src={product.primaryImage}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-xs truncate">
                                    {product.name}
                                </h4>
                                <div className="text-[11px] text-gray-500 font-medium">
                                    {selectedSize}
                                </div>
                            </div>
                        </div>

                        {/* Right: Quantity Stepper & Compact Total */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden h-7">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange("decrement")}
                                    disabled={busy || quantity <= 1}
                                    className="w-7 h-full grid place-items-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                >
                                    −
                                </button>
                                <div className="px-2 text-xs font-bold text-gray-900 border-x border-gray-100">
                                    {quantity}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange("increment")}
                                    disabled={busy || quantity >= 100}
                                    className="w-7 h-full grid place-items-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                >
                                    +
                                </button>
                            </div>

                            <div className="text-right leading-none">
                                <div className="text-sm font-extrabold text-gray-900">
                                    ৳{totalDiscounted.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Full Matching Dual Action CTAs */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            disabled={busy}
                            onClick={handleAddToCart}
                            className="h-10 rounded-xl font-bold shadow-xs text-xs transition-all duration-200
                bg-linear-to-r from-blue-600 via-purple-600 to-blue-700 text-white
                active:scale-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {isAdding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                            <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                        </button>

                        <button
                            disabled={busy}
                            onClick={handleBuyNow}
                            className="h-10 rounded-xl font-bold shadow-xs text-xs transition-all duration-200
                bg-linear-to-r from-orange-500 via-red-500 to-pink-500 text-white
                active:scale-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {isBuying || isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Zap className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>{isBuying || isPending ? "Wait..." : "Buy Now"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}