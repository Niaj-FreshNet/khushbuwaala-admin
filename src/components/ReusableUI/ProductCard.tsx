/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ShoppingBag, Eye, Zap, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { IProductResponse } from "@/types/product.types";
import flyToCart from "../Modules/Product/FlyToCart";
import { kwPushAddToCart, kwPushBeginCheckout } from "@/lib/Analytics/kwEcom";

function getNumericSize(v: any) {
  const raw = v?.size ?? v?.title ?? v?.name ?? "";
  const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : Infinity;
}

function pickSecondLowestPriceVariant(product: any) {
  const rawVariants = Array.isArray(product?.variants) ? product.variants : [];
  if (!rawVariants.length) return null;

  const sortedVariants = [...rawVariants].sort((a: any, b: any) => {
    const sA = getNumericSize(a);
    const sB = getNumericSize(b);
    if (sA !== sB) return sA - sB;
    return Number(a?.price ?? 0) - Number(b?.price ?? 0);
  });

  return sortedVariants[1] ?? sortedVariants[0] ?? null;
}

function safeUnit(unit: any) {
  return String(unit || "").trim().toLowerCase();
}

function variantLabel(v: any) {
  const size = Number(v?.size);
  const unit = safeUnit(v?.unit);
  if (!size || !unit) return null;
  return `${size} ${unit}`;
}

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 0,
});
const formatPriceBDT = (price: number) => priceFormatter.format(price).replace("BDT", "৳");

function getActiveDiscount(product: any, variant?: any) {
  if (product?.discount && typeof product.discount === "object") {
    return product.discount;
  }

  const now = new Date();
  const isActiveAuto = (d: any) => {
    if (!d || (d.code && String(d.code).trim() !== "")) return false;
    const start = d.startDate ?? d.start ?? d.from;
    const end = d.endDate ?? d.end ?? d.to;
    return (!start || new Date(start) <= now) && (!end || new Date(end) >= now);
  };

  const variantAuto = (variant?.discounts ?? []).find(isActiveAuto) || null;
  const productAuto = (product?.discounts ?? []).find(isActiveAuto) || null;
  return variantAuto || productAuto || null;
}

function computeDiscountedPrice(basePrice: number, discount: any) {
  if (!discount) return basePrice;
  if (discount.type === "percentage" && typeof discount.value === "number") {
    return Math.max(0, Math.round(basePrice * (1 - discount.value / 100)));
  }
  if (discount.type === "fixed" && typeof discount.value === "number") {
    return Math.max(0, Math.round(basePrice - discount.value));
  }
  if (typeof discount.price === "number") return Math.round(discount.price);
  return basePrice;
}

interface ProductCardProps {
  product: IProductResponse;
  className?: string;
  onQuickView?: () => void;
}

export function ProductCard({
  product,
  className,
  onQuickView,
}: ProductCardProps) {
  const cart = useCart();
  const wishlist = useWishlist();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const [touchHover, setTouchHover] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStartCard = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    setTouchHover(false);
  };

  const onTouchMoveCard = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > 8 || dy > 8) setTouchHover(true);
  };

  const onTouchEndCard = () => {
    window.setTimeout(() => setTouchHover(false), 450);
    touchStart.current = null;
  };

  const productId = (product as any).id ?? (product as any)._id ?? product.slug ?? product.name;
  const selectedVariant = useMemo(() => pickSecondLowestPriceVariant(product as any), [product]);
  const activeDiscount = useMemo(() => getActiveDiscount(product as any, selectedVariant), [product, selectedVariant]);

  const basePrice = selectedVariant?.price ?? (product as any).minPrice ?? (product as any).price ?? 0;
  const discountedPrice = activeDiscount ? computeDiscountedPrice(basePrice, activeDiscount) : basePrice;

  const discountPercentLabel = useMemo(() => {
    if (!activeDiscount) return null;
    if (activeDiscount.type === "percentage" && typeof activeDiscount.value === "number") {
      return `-${Math.round(activeDiscount.value)}%`;
    }
    if (activeDiscount.type === "fixed" && typeof activeDiscount.value === "number") {
      return `৳${Math.round(activeDiscount.value)}`;
    }
    return null;
  }, [activeDiscount]);

  const selectedSizeLabel = useMemo(() => {
    const label = selectedVariant ? variantLabel(selectedVariant) : null;
    if (label) return label;
    const vp = (product as any).variantPrices;
    if (vp && typeof vp === "object") {
      const keys = Object.keys(vp);
      if (keys.length) return keys[0];
    }
    return "6 ml";
  }, [selectedVariant, product]);

  const accords = useMemo(() => {
    const arr = (product as any)?.accords ?? (product as any)?.fragrances ?? [];
    if (Array.isArray(arr) && arr.length) {
      return arr
        .map((item: any) => (typeof item === "string" ? item : item?.name))
        .filter(Boolean);
    }
    return [];
  }, [product]);

  const isWishlisted = wishlist?.isInWishlist?.(productId) ?? false;

  const handleAddToCart = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (isAddingToCart || isBuyingNow) return;

    const fromEl = e.currentTarget;
    setIsAddingToCart(true);

    try {
      cart?.addToCart?.(product as any, 1, selectedSizeLabel, discountedPrice);

      kwPushAddToCart({
        currency: "BDT",
        value: discountedPrice,
        items: [
          {
            item_id: String(productId),
            item_name: product.name,
            item_brand: (product as any).brand || "Khushbuwaala",
            item_category: (product as any).categoryId || (product as any).category?.categoryName || "product",
            item_variant: selectedSizeLabel,
            price: discountedPrice,
            quantity: 1,
          },
        ],
      });

      if (fromEl) {
        flyToCart(fromEl, (product as any).primaryImage);
      } else {
        window.dispatchEvent(new CustomEvent("kw:open-cart"));
      }
    } catch (err) {
      console.error("Cart error:", err);
      toast.error("Unable to add to cart");
    } finally {
      setTimeout(() => setIsAddingToCart(false), 600);
    }
  };

  const handleBuyNow = useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (isBuyingNow || isAddingToCart) return;

      setIsBuyingNow(true);
      try {
        cart?.addToCart?.(product as any, 1, selectedSizeLabel, discountedPrice);

        kwPushBeginCheckout({
          currency: "BDT",
          value: discountedPrice,
          items: [
            {
              item_id: String(productId),
              item_name: product.name,
              item_brand: (product as any).brand || "Khushbuwaala",
              item_category: (product as any).categoryId || (product as any).category?.categoryName || "product",
              item_variant: selectedSizeLabel,
              price: discountedPrice,
              quantity: 1,
            },
          ],
        });

        await new Promise((r) => setTimeout(r, 200));
        startTransition(() => {
          router.push("/checkout");
        });
      } catch (err) {
        console.error("Buy now failed:", err);
        toast.error("Failed to redirect to checkout");
      } finally {
        setIsBuyingNow(false);
      }
    },
    [cart, product, selectedSizeLabel, discountedPrice, productId, router, isBuyingNow, isAddingToCart]
  );

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wishlist) return;
    if (isWishlisted) {
      wishlist.removeFromWishlist?.(productId);
    } else {
      wishlist.addToWishlist?.(product as any);
    }
  };

  const productSlug = (product as any).slug ?? (product as any).name?.toLowerCase().replace(/ /g, "-") ?? productId;
  const productLink = `/product/${productSlug}`;

  return (
    <Link href={productLink} aria-label={`View ${product.name}`} className="block w-full select-none group">
      <Card
        onTouchStart={onTouchStartCard}
        onTouchMove={onTouchMoveCard}
        onTouchEnd={onTouchEndCard}
        className={cn(
          "w-full flex flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-300 hover:border-emerald-200 p-0",
          className
        )}
      >
        {/* Visual Box: aspect-[1/1.05] crops out the redundant bottom white strip from the bottle photo */}
        <div className="relative aspect-[1/1.05] w-full overflow-hidden bg-gray-50/80 shrink-0">
          <Image
            src={!imageError ? product.primaryImage : "/placeholder.svg?height=256&width=200&text=No+Image"}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1200px) 33vw, 20vw"
            className={cn(
              "object-cover object-[center_20%] transition-all duration-700 ease-out",
              touchHover || (product.otherImages && product.otherImages.length > 0)
                ? "group-hover:opacity-0 group-hover:scale-105"
                : "group-hover:scale-105"
            )}
            priority={false}
            onError={() => setImageError(true)}
          />

          {product.otherImages && product.otherImages.length > 0 && !imageError && (
            <Image
              src={product.otherImages[0]}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1200px) 33vw, 20vw"
              className={cn(
                "object-cover object-[center_20%] absolute inset-0 transition-all duration-700 ease-out",
                touchHover
                  ? "opacity-100 scale-105"
                  : "opacity-0 group-hover:opacity-100 group-hover:scale-105"
              )}
            />
          )}

          {/* Floating Actions: Hidden by default, visible on hover / touch */}
          <div
            className={cn(
              "absolute top-2 right-2 z-10 flex flex-col gap-1.5 items-center transition-all duration-300",
              touchHover
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
            )}
          >
            {/* Wishlist Button - Frosted Glass Aesthetic */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={cn(
                "w-7 h-7 sm:w-7.5 sm:h-7.5 aspect-square rounded-full backdrop-blur-md border shadow-xs transition-all duration-200 active:scale-90 p-0 flex items-center justify-center shrink-0 cursor-pointer",
                isWishlisted
                  ? "bg-red-500/20 border-red-300/60 text-red-600 shadow-red-500/10"
                  : "bg-white/40 hover:bg-white/70 border-white/60 text-gray-800 hover:text-red-600 shadow-black/5"
              )}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-all shrink-0 drop-shadow-xs",
                  isWishlisted && "fill-current animate-pulse text-red-600"
                )}
              />
            </button>

            {/* Quick View Button - Frosted Glass Aesthetic */}
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView();
                }}
                aria-label={`Quick view ${product.name}`}
                className="hidden sm:flex w-7 h-7 sm:w-7.5 sm:h-7.5 aspect-square rounded-full backdrop-blur-md bg-white/40 hover:bg-white/70 border border-white/60 text-gray-800 hover:text-emerald-700 shadow-xs shadow-black/5 transition-all duration-200 active:scale-90 p-0 items-center justify-center shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 shrink-0 drop-shadow-xs" />
              </button>
            )}
          </div>

          {/* Discount Badge */}
          {discountPercentLabel && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="px-1.5 py-0.5 rounded-md bg-white text-green-700 text-[10px] font-bold tracking-tight shadow-xs">
                {discountPercentLabel}
              </span>
            </div>
          )}
        </div>

        {/* Content Details: Snug spacing, zero dead margins */}
        <div className="px-2 pt-1.5 pb-0 flex flex-col items-center text-center">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-black transition-colors leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {formatPriceBDT(discountedPrice)}
            </span>
            {activeDiscount && (
              <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                {formatPriceBDT(basePrice)}
              </span>
            )}
          </div>

          {accords.length > 0 && (
            <div className="flex flex-nowrap justify-center items-center gap-1 mt-1 w-full max-w-full overflow-hidden">
              {accords.slice(0, 3).map((accord: string, idx: number) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] sm:text-[11px] rounded-md border border-gray-100 leading-none whitespace-nowrap truncate shrink-0 max-w-[45%]"
                >
                  {accord}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Flush beneath accords with only 6px padding */}
        <div className="px-2 pb-2 pt-1.5 flex items-center gap-1.5">
          <Button
            type="button"
            className={cn(
              "flex-1 h-7.5 sm:h-9 rounded-lg font-bold text-sm shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer",
              isBuyingNow
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-linear-to-r from-orange-600 via-red-600 to-rose-600 hover:from-orange-700 hover:via-red-700 hover:to-rose-700 text-white"
            )}
            onClick={handleBuyNow}
            disabled={isBuyingNow || isAddingToCart}
          >
            {isBuyingNow ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
            ) : (
              <span className="flex items-center justify-center gap-1">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Buy Now
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "w-7.5 h-7.5 sm:w-9 sm:h-8 min-w-7.5 min-h-7.5 sm:min-w-8 sm:min-h-8 rounded-lg border-blue-700/30 text-blue-800 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200 active:scale-95 shrink-0 p-0 flex items-center justify-center cursor-pointer",
              isAddingToCart && "bg-emerald-50 cursor-not-allowed"
            )}
            onClick={handleAddToCart}
            disabled={isAddingToCart || isBuyingNow}
            title="Add to Cart"
            aria-label={`Add ${product.name} to cart`}
          >
            {isAddingToCart ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-700" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-blue-200" />
            )}
          </Button>
        </div>
      </Card>
    </Link>
  );
}

export default ProductCard;