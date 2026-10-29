"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Tag,
  Shield,
  Truck,
  Minus,
  Plus,
  Zap,
  CheckIcon,
  Phone,
  Share2,
  Copy,
  Check,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IProduct, IProductVariant, IDiscount } from "@/types/product.types";
import { MdWhatsapp } from "react-icons/md";
import { toast } from "sonner";
import { RiShareForwardFill } from "react-icons/ri";

type Props = {
  product: Partial<IProduct>;
  selectedVariantId?: string | number;
  discount: IDiscount | null;
  discountedPrice: number;
  currentPrice: number;
  quantity: number;
  isOutOfStock?: boolean;
  selectedSizeLabel: string;
  availableVariants: IProductVariant[];
  getVariantDiscount: (variant?: IProductVariant) => IDiscount | null;

  // handlers (from client)
  onReadMore?: () => void;
  onSelectVariant: (variant: IProductVariant) => void;
  onQtyDec: () => void;
  onQtyInc: () => void;
  onAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onBuyNow: () => void;

  isAddingToCart: boolean;
  isBuyingNow: boolean;
  isPending: boolean;
};

export default function ProductDetailsUI({
  product,
  selectedVariantId,
  discount,
  discountedPrice,
  currentPrice,
  quantity,
  isOutOfStock,
  selectedSizeLabel,
  availableVariants,
  getVariantDiscount,
  onReadMore,
  onSelectVariant,
  onQtyDec,
  onQtyInc,
  onAddToCart,
  onBuyNow,
  isAddingToCart,
  isBuyingNow,
  isPending,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // Populate URL safely on client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // WhatsApp message generation
  const handleWhatsAppOrder = () => {
    const phoneNumber = "8801777152588";
    const shareUrl = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    const effectivePrice = discount ? discountedPrice : currentPrice;
    const totalPrice = effectivePrice * quantity;

    const message = [
      `Assalamu Alaikum Khushbuwaala. I'm interested in:`,
      `*Product:* ${product.name || ""}`,
      `*Size:* ${selectedSizeLabel}`,
      `*Quantity:* ${quantity}`,
      `*Price:* ৳${effectivePrice.toLocaleString()} (Total: ৳${totalPrice.toLocaleString()})`,
      shareUrl ? `🔗 *Link:* ${shareUrl}` : "",
      `Please let me know how to proceed with the delivery.`,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCallOrder = () => {
    window.location.href = "tel:+8801777152588";
  };

  const handleShareClick = async (platform: "native" | "facebook" | "instagram" | "whatsapp") => {
    const url = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    const title = product?.name || "Khushbuwaala Perfumes";
    const shareText = `Check out ${title}: ${url}`;

    // 1. Direct device/mobile sharing
    if (platform === "native") {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title,
            text: `Check out ${title}`,
            url,
          });
          return;
        } catch {
          return;
        }
      }
      handleCopyLink();
      return;
    }

    // 2. Instagram: directly opens app/site without copying or triggering toast
    if (platform === "instagram") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = "instagram://app";
        setTimeout(() => {
          window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
        }, 500);
      } else {
        window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
      }
      return;
    }

    // 3. Web share URLs for Facebook & WhatsApp
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    };

    if (links[platform]) {
      window.open(links[platform], "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = currentUrl || window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!", { duration: 1000 }); // Toast dismisses after 1s
      setTimeout(() => setCopied(false), 1200); // Button reverts back after 1.2s
    } catch {
      toast.error("Failed to copy link", { duration: 1500 });
    }
  };

  return (
    <div className="space-y-1 sm:space-y-2">
      {/* Header Section */}
      <div className="space-y-2 sm:space-y-2">
        {/* Discount Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          {discount && (
            <Badge className="bg-linear-to-r from-green-600 to-emerald-500 text-white px-3 py-1 sm:px-4 shadow-xs sm:shadow-sm">
              <Tag className="w-3 h-3 mr-2" />
              {discount.type === "percentage"
                ? `${discount.value}% OFF`
                : `৳${discount.value} OFF`}
            </Badge>
          )}
        </div>

        {/* Product Name */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
            {product.name}
          </h1>
          <div className="w-20 h-0.5 sm:h-1 bg-linear-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        {/* Price Section */}
        <div className="relative p-1.5 sm:p-2.5 bg-linear-to-r from-blue-50/70 via-indigo-50/60 to-purple-50/70 rounded-xl border border-blue-100/80 overflow-hidden">
          <div className="relative flex items-center justify-between gap-3">
            {/* Left: Prices */}
            <div className="flex items-baseline gap-2 sm:gap-2.5 min-w-0">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight shrink-0">
                ৳{(discount ? discountedPrice : currentPrice).toLocaleString()}
              </span>
              {discount && (
                <span className="text-sm sm:text-base text-gray-400 line-through truncate font-medium">
                  ৳{currentPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Right: Responsive Text */}
            {discount && (
              <div className="text-right shrink-0">
                {/* Mobile: Compact Pill Badge */}
                <div className="sm:hidden text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-lg">
                  Save ৳{(currentPrice - discountedPrice).toLocaleString()}
                  <span className="text-emerald-600/80 font-medium ml-1">
                    ({discount.type === "percentage" ? `${discount.value}% OFF` : `৳${discount.value.toLocaleString()}`})
                  </span>
                </div>

                {/* Desktop: Full Original Two-Line Text */}
                <div className="hidden sm:block">
                  <div className="text-md font-bold text-green-600 leading-tight">
                    You save ৳{(currentPrice - discountedPrice).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-700 leading-tight mt-0.5">
                    That's {discount.type === "percentage" ? `${discount.value}%` : `৳${discount.value.toLocaleString()}`} off!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-3 pb-1 sm:pb-2.5 bg-white rounded-2xl border border-gray-200">
        {(() => {
          const description =
            product.description?.toString() ||
            "Experience luxury with this premium fragrance.";

          const normalized = description.replace(/\r\n/g, "\n").trim();
          const PREVIEW_LINES = 3;
          const lines = normalized.split("\n");
          const isLong = lines.length > PREVIEW_LINES || normalized.length > 160;

          const lineLimited = lines.slice(0, PREVIEW_LINES).join("\n");
          const PREVIEW_CHARS = 120;
          let baseText = lineLimited;
          if (baseText.length > PREVIEW_CHARS) {
            baseText = baseText.slice(0, PREVIEW_CHARS).trimEnd();
          }

          const cleanText = baseText.replace(/\.+$/, "").trimEnd();
          const paragraphs = cleanText.split("\n");

          return (
            <div className="text-gray-700 leading-relaxed break-words text-sm sm:text-base">
              {paragraphs.map((line, idx) => {
                const isLast = idx === paragraphs.length - 1;

                if (!line.trim()) {
                  return <div key={idx} className="h-1.5" />;
                }

                return (
                  <p key={idx} className={!isLast ? "mb-1.5" : "inline"}>
                    <span>{line}</span>
                    {isLast && isLong && (
                      <>
                        <span>...</span>
                        <button
                          onClick={onReadMore}
                          type="button"
                          className="inline-flex items-center ml-1 text-sm sm:text-base text-blue-700 hover:text-blue-900 font-semibold hover:underline active:scale-[0.98] align-baseline"
                        >
                          Read more
                        </button>
                      </>
                    )}
                  </p>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Size Selection */}
      <div className="space-y-1 sm:space-y-2 p-1.5 sm:p-2 bg-white rounded-2xl border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="text-sm sm:text-md font-bold text-gray-900">Choose Size</h3>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {availableVariants.map((variant) => {
            const label = `${variant.size} ${variant.unit.toLowerCase()}`;
            const isSelected = selectedVariantId ? variant.id === selectedVariantId : selectedSizeLabel === label;

            const vDiscount = getVariantDiscount(variant);
            const hasDiscount = !!vDiscount;

            const variantFinalPrice = hasDiscount
              ? vDiscount.type === "percentage"
                ? Math.round(variant.price * (1 - vDiscount.value / 100))
                : Math.max(0, Math.round(variant.price - vDiscount.value))
              : variant.price;

            return (
              <button
                key={variant.id}
                onClick={() => onSelectVariant(variant)}
                type="button"
                className={cn(
                  "group relative p-1.5 sm:p-2.5 rounded-xl border transition-all duration-200 active:scale-[0.98] sm:hover:scale-105 cursor-pointer",
                  isSelected
                    ? "border-blue-500 bg-linear-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-xs sm:shadow-sm ring-2 ring-blue-200"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                {/* Per-variant discount pill badge */}
                {/* {hasDiscount && (
                  <div className="absolute -top-2 -right-1.5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full shadow-2xs">
                    {vDiscount.type === "percentage"
                      ? `-${Math.round(vDiscount.value)}%`
                      : `-৳${Math.round(vDiscount.value)}`}
                  </div>
                )} */}

                {isSelected && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-2xs">
                    <CheckIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className="text-center">
                  <div className="font-bold text-sm sm:text-sm tracking-tight">{label}</div>

                  {/* <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
                    {hasDiscount ? (
                      <>
                        <span className="text-xs sm:text-sm text-gray-600">
                          ৳{variantFinalPrice.toLocaleString()}
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                          ৳{variant.price.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-600 font-semibold">
                        ৳{variant.price.toLocaleString()}
                      </span>
                    )}
                  </div> */}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="px-2 sm:px-3 py-1 bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Quantity
            </h3>
          </div>

          {/* Stepper */}
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden select-none touch-manipulation">
            <button
              onClick={onQtyDec}
              disabled={quantity <= 1}
              type="button"
              aria-label="Decrease quantity"
              className="w-7 h-7 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="min-w-12 sm:min-w-22.5 h-9 sm:h-12 bg-white border-x border-gray-200 flex items-center justify-center">
              <span className="font-bold text-gray-900 text-base sm:text-xl">
                {quantity}
              </span>
            </div>

            <button
              onClick={onQtyInc}
              disabled={quantity >= 100}
              type="button"
              aria-label="Increase quantity"
              className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Total Price */}
          <div className="text-right shrink-0 leading-tight">
            <div className="text-[11px] sm:text-sm text-gray-500 font-medium">
              Total
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              ৳{(discountedPrice * quantity).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (Add to Cart + Buy Now) */}
      <div id="action-buttons" className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-2 sm:mt-3 w-full">
        <Button
          className={cn(
            "flex-1 h-12 sm:h-14 text-sm sm:text-lg font-bold rounded-xl transition-all duration-300 active:scale-[0.99] sm:hover:scale-[1.01] cursor-pointer",
            isAddingToCart
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-linear-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-xs sm:shadow-sm"
          )}
          onClick={(e) => onAddToCart(e)}
          disabled={isAddingToCart || isBuyingNow}
        >
          {isAddingToCart ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
              <span>Adding...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </div>
          )}
        </Button>

        <Button
          className={cn(
            "flex-1 h-12 sm:h-14 text-md sm:text-xl font-bold rounded-xl transition-all duration-300 active:scale-[0.99] sm:hover:scale-[1.01] cursor-pointer",
            isBuyingNow
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-linear-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-xs sm:shadow-sm"
          )}
          onClick={onBuyNow}
          disabled={isAddingToCart || isBuyingNow || isPending}
        >
          {isBuyingNow ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Buy Now</span>
            </div>
          )}
        </Button>
      </div>

      {/* Quick Order Buttons */}
      <div className="flex flex-row gap-2 mt-1.5 mb-2.5 w-full">
        <Button
          type="button"
          onClick={handleWhatsAppOrder}
          className="flex-1 h-10 sm:h-11 px-2 sm:px-4 bg-[#20b858] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-bold rounded-xl shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <MdWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-xs sm:text-sm tracking-tight truncate">Order on WhatsApp</span>
          </div>
        </Button>

        <Button
          type="button"
          onClick={handleCallOrder}
          className="flex-1 h-10 sm:h-11 px-2 sm:px-4 bg-gray-900 hover:bg-black active:bg-gray-800 text-white font-bold rounded-xl shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-xs sm:text-sm tracking-tight truncate">Call for Order</span>
          </div>
        </Button>
      </div>

      {/* Trust Indicators */}
      {/* <div className="grid grid-cols-2 gap-2 p-1.5 sm:p-2.5 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-100">
        <div className="flex items-center gap-2.5 sm:gap-3 p-1 sm:p-2 bg-white/70 rounded-xl">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div>
            <div className="font-semibold text-emerald-800 text-xs sm:text-sm leading-tight">Pure and Authentic</div>
            <div className="text-[10px] sm:text-xs text-emerald-600">Best Qualtity Certified</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 p-1 sm:p-2 bg-white/70 rounded-xl">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-blue-800 text-xs sm:text-sm leading-tight">Fast Delivery</div>
            <div className="text-[10px] sm:text-xs text-blue-600">Nationwide Shipping</div>
          </div>
        </div>
      </div> */}

      {/* Social Media Sharing Section */}
      <div className="pt-2 sm:pt-2.5 pb-1 flex items-center justify-between gap-2 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <Share2 className="w-3.5 h-3.5 text-gray-500" />
          <span>Share Product:</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Direct Native Sharing (Mobile Web Share API) */}
          <button
            type="button"
            onClick={async () => {
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({
                    title: product?.name || document.title,
                    url: window.location.href,
                  });
                } catch {
                  // user cancelled or share failed
                }
              } else {
                handleCopyLink();
              }
            }}
            aria-label="Share via device"
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95"
          >
            <RiShareForwardFill className="w-5 h-5" />
          </button>

          {/* 2. Facebook */}
          <button
            type="button"
            onClick={() => handleShareClick("facebook")}
            aria-label="Share on Facebook"
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* 3. Instagram */}
          <button
            type="button"
            onClick={() => handleShareClick("instagram")}
            aria-label="Share on Instagram"
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-pink-500/10 hover:bg-linear-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-pink-600 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </button>

          {/* 4. WhatsApp */}
          <button
            type="button"
            onClick={() => handleShareClick("whatsapp")}
            aria-label="Share via WhatsApp"
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95"
          >
            <MdWhatsapp className="w-4 h-4" />
          </button>

          {/* 5. Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy product link"
            className={cn(
              "h-7.5 sm:h-8 px-2.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer",
              copied
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}