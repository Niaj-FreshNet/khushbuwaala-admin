"use client"

import * as React from "react"
import type { IProductResponse, IDiscount, IProductVariant } from "@/types/product.types"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
  Award,
  Maximize2,
  X,
  ExternalLink,
  CreditCard,
  Tag,
} from "lucide-react"

import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import { kwPushAddToCart, kwPushBeginCheckout } from "@/lib/Analytics/kwEcom"

interface ProductQuickViewProps {
  product: IProductResponse
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProductQuickView({ product, trigger, open, onOpenChange }: ProductQuickViewProps) {
  const router = useRouter()
  const cart = useCart()
  const wishlist = useWishlist()

  const [selectedSize, setSelectedSize] = React.useState<string>("")
  const [quantity, setQuantity] = React.useState(1)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [isBuyingNow, setIsBuyingNow] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const [isImageZoomed, setIsImageZoomed] = React.useState(false)

  const images = React.useMemo(() => {
    const all = [product.primaryImage, ...(product.otherImages || [])].filter(Boolean) as string[]
    return all.length ? all : ["/placeholder.svg?height=800&width=800&text=No+Image"]
  }, [product.primaryImage, product.otherImages])

  const formatPrice = React.useCallback((price: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    })
      .format(Number(price || 0))
      .replace("BDT", "৳")
  }, [])

  // ✅ Sort variants (stable selection + consistent UI)
  const sortedVariants = React.useMemo(() => {
    const v = [...(product.variants ?? [])]
    v.sort((a, b) => Number(a.size) - Number(b.size))
    return v
  }, [product.variants])

  // ✅ Like ProductDetailsClient: show only first 4 variants in UI
  const availableVariants = React.useMemo(() => sortedVariants.slice(0, 4), [sortedVariants])

  // ✅ Build labels ONLY from availableVariants (so it won't show all)
  const sizeOptions = React.useMemo(() => {
    if (!availableVariants.length) return ["3 ml"]
    const set = new Set<string>()
    const list: string[] = []
    for (const v of availableVariants) {
      const label = `${v.size} ${String(v.unit || "").toLowerCase()}`
      if (!set.has(label)) {
        set.add(label)
        list.push(label)
      }
    }
    return list
  }, [availableVariants])

  // Reset on product change
  React.useEffect(() => {
    setCurrentImageIndex(0)
    setImageError(false)
    setQuantity(1)

    if (sortedVariants.length) {
      const first = sortedVariants[0]
      setSelectedSize(`${first.size} ${String(first.unit || "").toLowerCase()}`)
    } else {
      setSelectedSize("3 ml")
    }
  }, [product.id, sortedVariants])

  const isWishlisted = wishlist?.isInWishlist?.(product.id) ?? false

  const getCurrentVariant = React.useCallback((): IProductVariant | undefined => {
    return sortedVariants.find((v) => `${v.size} ${String(v.unit || "").toLowerCase()}` === selectedSize)
  }, [sortedVariants, selectedSize])

  const currentVariant = getCurrentVariant()

  // ✅ base price (variant first, then product)
  const originalPrice = React.useMemo(() => {
    return Number(currentVariant?.price ?? product.minPrice ?? 0)
  }, [currentVariant?.price, product.minPrice])

  // ✅ Pricing logic aligned with Product Details page (variant discounts first + product discounts)
  // ✅ Pricing logic: ONLY auto discounts (code must be empty)
  const { discount, discountedPrice } = React.useMemo(() => {
    const now = new Date();

    const allDiscounts: IDiscount[] = [
      ...(currentVariant?.discounts ?? []),
      ...(product.discounts ?? []),
    ];

    const active =
      allDiscounts.find((d) => {
        // ❌ hide promo-code discounts
        if (d.code && String(d.code).trim() !== "") return false;

        const startOk = !d.startDate || new Date(d.startDate) <= now;
        const endOk = !d.endDate || new Date(d.endDate) >= now;
        return startOk && endOk;
      }) || null;

    let final = originalPrice;

    if (active) {
      if (active.type === "percentage") {
        final = originalPrice - (originalPrice * active.value) / 100;
      } else if (active.type === "fixed") {
        final = originalPrice - active.value;
      }
    }

    final = Math.max(0, Math.round(final)); // ✅ no decimals + no negative
    return { discount: (active as IDiscount | null), discountedPrice: Number(final) };
  }, [product.discounts, currentVariant, originalPrice]);

  const currentPrice = discountedPrice // ✅ final price for UI + cart
  const savings = Math.max(0, originalPrice - discountedPrice)
  const selectedPrice = currentPrice

  // const isOutOfStock = (product.totalStock ?? 0) <= 0

  const handleToggleWishlist = (e?: React.MouseEvent) => {
    e?.stopPropagation?.()
    e?.preventDefault?.()
    if (!wishlist) return

    if (isWishlisted) wishlist.removeFromWishlist?.(product.id)
    else wishlist.addToWishlist?.(product as any)
  }

  const handleViewFullDetails = () => {
    router.push(`/product/${product.slug}`)
    toast.info("Navigating to Product Details", {
      description: "Opening full product page...",
      duration: 1200,
    })
    onOpenChange?.(false)
  }

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

  // ✅ Discount badge helper (badge only) - ONLY auto discounts (no code)
  const getActiveDiscountForVariant = React.useCallback(
    (variant?: IProductVariant): IDiscount | null => {
      const now = new Date();

      const allDiscounts: IDiscount[] = [
        ...(variant?.discounts ?? []),
        ...(product.discounts ?? []),
      ];

      const active =
        allDiscounts.find((d) => {
          // ❌ hide promo-code discounts from badge too
          if (d.code && String(d.code).trim() !== "") return false;

          const startOk = !d.startDate || new Date(d.startDate) <= now;
          const endOk = !d.endDate || new Date(d.endDate) >= now;
          return startOk && endOk;
        }) || null;

      return active as IDiscount | null;
    },
    [product.discounts]
  );

  const handleAddToCart = async () => {
    if (/* isOutOfStock || */ isAddingToCart || isBuyingNow) return

    setIsAddingToCart(true)
    try {
      await new Promise((r) => setTimeout(r, 450))

      cart?.addToCart?.(
        product,
        quantity,
        selectedSize || "3 ml",
        discountedPrice // ✅ discounted final price
      )

      kwPushAddToCart({
        currency: "BDT",
        value: discountedPrice * 1,
        items: [
          {
            item_id: String((product as any).id || (product as any).slug || product.name),
            item_name: product.name,
            item_brand: (product as any).brand || "Khushbuwaala",
            item_category: (product as any).categoryId || (product as any).category?.categoryName || "product",
            item_variant: selectedSize || "3 ml",
            price: discountedPrice,
            quantity: 1,
          },
        ],
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("kw:cart-added"))
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (/* isOutOfStock || */ isBuyingNow || isAddingToCart) return

    setIsBuyingNow(true)
    try {
      await new Promise((r) => setTimeout(r, 450))

      cart?.addToCart?.(product, quantity, selectedSize || "3 ml", discountedPrice)

      // ✅ TRACK begin_checkout
      kwPushBeginCheckout({
        currency: "BDT",
        value: discountedPrice * quantity,
        items: [
          {
            item_id: String((product as any).id || (product as any).slug || product.name),
            item_name: product.name,
            item_brand: (product as any).brand || "Khushbuwaala",
            item_category: (product as any).categoryId || (product as any).category?.categoryName || "product",
            item_variant: selectedSize || "3 ml",
            price: discountedPrice,
            quantity,
          },
        ],
      })

      router.push("/checkout")
      onOpenChange?.(false)
    } finally {
      setIsBuyingNow(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

        {/* ✅ Responsive modal: inner scroll + stable bottom action bar */}
        <DialogContent className="w-[95vw] sm:w-auto sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] p-0 bg-white overflow-hidden">
          <div className="flex flex-col max-h-[92vh]">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image Gallery */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
                  <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-square">
                    <Image
                      src={!imageError ? images[currentImageIndex] : "/placeholder.svg?height=800&width=800&text=No+Image"}
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      fill
                      sizes="(max-width: 768px) 95vw, 50vw"
                      className="object-contain p-4"
                      loading="lazy"       // ✅
                      priority={false}     // ✅
                      onError={() => setImageError(true)}
                    />

                    {/* Zoom */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg h-10 w-10 z-10"
                      onClick={() => setIsImageZoomed(true)}
                      aria-label="Zoom image"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>

                    {/* Discount badge (selected variant only) */}
                    {discount && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">
                          <Tag className="h-3 w-3 mr-1" />
                          {discount.type === "percentage" ? `${discount.value}% OFF` : `৳${discount.value} OFF`}
                        </Badge>
                      </div>
                    )}

                    {/* Image navigation */}
                    {images.length > 1 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg h-10 w-10"
                          onClick={prevImage}
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg h-10 w-10"
                          onClick={nextImage}
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Dots */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            className={cn(
                              "h-2.5 w-2.5 rounded-full transition-all duration-200",
                              index === currentImageIndex ? "bg-white shadow-md" : "bg-white/60 hover:bg-white/85"
                            )}
                            onClick={() => setCurrentImageIndex(index)}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="p-3 sm:p-4 bg-white border-t">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            type="button"
                            className={cn(
                              "relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                              index === currentImageIndex
                                ? "border-red-500 shadow-md"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => {
                              setCurrentImageIndex(index)
                              setImageError(false)
                            }}
                            aria-label={`Select image ${index + 1}`}
                          >
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`${product.name} thumbnail ${index + 1}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight break-words">
                            {product.name}
                          </h1>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                            onClick={handleViewFullDetails}
                            title="View Full Details"
                            aria-label="View full product details"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-10 w-10 transition-colors",
                              isWishlisted
                                ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                : "hover:bg-red-50 hover:border-red-200"
                            )}
                            onClick={handleToggleWishlist}
                            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                          </Button>
                        </div>
                      </div>

                      {/* ✅ Price (only selected variant final price) */}
                      <div className="space-y-2">
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {formatPrice(currentPrice)}
                          </div>

                          {discount && savings > 0 && (
                            <>
                              <div className="text-sm sm:text-base text-gray-500 line-through">
                                {formatPrice(originalPrice)}
                              </div>
                              <Badge className="bg-green-100 text-green-700 px-2 py-1 text-xs font-bold border-green-200">
                                Save {formatPrice(savings)}
                              </Badge>
                            </>
                          )}
                        </div>

                        {discount && (
                          <div className="text-xs sm:text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            🎉 Offer applied:{" "}
                            {discount.type === "percentage"
                              ? `${discount.value}% off`
                              : `${formatPrice(discount.value)} off`}
                          </div>
                        )}

                        {/* Stock */}
                        {/* <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              isOutOfStock ? "bg-red-500" : "bg-green-500 animate-pulse"
                            )}
                          />
                          <span>{isOutOfStock ? "Out of stock" : "In stock"}</span>
                        </div> */}
                      </div>
                    </div>

                    {/* ✅ Size selection (ONLY first 4 variants, NO prices) */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <Zap className="h-4 w-4 text-red-500 shrink-0" />
                        Size Options
                      </h3>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                        {sizeOptions.map((size) => {
                          const variant = availableVariants.find(
                            (v) => `${v.size} ${String(v.unit || "").toLowerCase()}` === size
                          )
                          const vDiscount = getActiveDiscountForVariant(variant)
                          const hasDiscount = !!vDiscount

                          return (
                            <button
                              key={size}
                              type="button"
                              className={cn(
                                "relative rounded-xl border px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all",
                                "active:scale-[0.98]",
                                selectedSize === size
                                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                              )}
                              onClick={() => {
                                setSelectedSize(size)
                                setImageError(false)
                              }}
                              aria-pressed={selectedSize === size}
                            >
                              {hasDiscount && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {vDiscount!.type === "percentage"
                                    ? `-${vDiscount!.value}%`
                                    : `-৳${vDiscount!.value}`}
                                </div>
                              )}
                              <div className="text-center">{size}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Scent profile */}
                    {product.accords && product.accords.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                          <Award className="h-4 w-4 text-purple-500 shrink-0" />
                          Scent Profile
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {product.accords.map((note, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 text-xs rounded-full"
                            >
                              {note}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {product.description && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                          <Eye className="h-4 w-4 text-blue-500 shrink-0" />
                          Description
                        </h3>

                        {(() => {
                          const normalized = String(product.description)
                            .replace(/\r\n/g, "\n")
                            .trim();

                          const PREVIEW_LINES = 3;
                          const PREVIEW_CHARS = 200; // ✅ keep compact in modal

                          const lines = normalized.split("\n");
                          const lineLimited = lines.slice(0, PREVIEW_LINES).join("\n");

                          const preview =
                            lineLimited.length > PREVIEW_CHARS
                              ? lineLimited.slice(0, PREVIEW_CHARS).trimEnd() + "..."
                              : lineLimited;

                          const isLong = normalized.length > preview.replace(/\.\.\.$/, "").length || lines.length > PREVIEW_LINES;

                          return (
                            <div className="space-y-2">
                              <div className="text-gray-700 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap break-words">
                                {preview}
                              </div>

                              {isLong && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    router.push(`/product/${product.slug}`);
                                    onOpenChange?.(false);
                                  }}
                                  className="inline-flex items-center rounded-md px-2 py-1 text-blue-700 hover:text-blue-900 font-semibold hover:underline active:scale-[0.98]"
                                >
                                  Read more
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Quantity</h3>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-transparent"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="text-base sm:text-lg font-semibold min-w-[2.5rem] text-center">
                          {quantity}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-transparent"
                          onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                          disabled={quantity >= 10}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="border-t bg-white p-4 sm:p-6 space-y-2 sm:space-y-3">
              <div className="flex gap-2 sm:gap-3">
                <Button
                  type="button"
                  className={cn(
                    "flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]",
                    isAddingToCart
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                  )}
                  onClick={handleAddToCart}
                  disabled={/* isOutOfStock || */ isAddingToCart || isBuyingNow}
                >
                  {isAddingToCart ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {/* isOutOfStock ? "Out of Stock" : */ "Add to Cart"}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  className={cn(
                    "flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]",
                    isBuyingNow
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  )}
                  onClick={handleBuyNow}
                  disabled={/* isOutOfStock || */ isAddingToCart || isBuyingNow}
                >
                  {isBuyingNow ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                ✨ Total: {formatPrice(currentPrice * quantity)}
                {savings > 0 && (
                  <span className="text-green-600 font-semibold ml-1">
                    (Save {formatPrice(savings * quantity)})
                  </span>
                )}
                {" • 7-day return policy"}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full screen image zoom */}
      <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white z-50 h-10 w-10"
              onClick={() => setIsImageZoomed(false)}
              aria-label="Close zoom"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative w-full h-full max-w-4xl">
              <Image
                src={!imageError ? images[currentImageIndex] : "/placeholder.svg?height=1200&width=1200&text=No+Image"}
                alt={`${product.name} - Full View`}
                fill
                sizes="95vw"
                className="object-contain"
                loading="lazy"
                priority={false}
              />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white h-11 w-11"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20 text-white h-11 w-11"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}