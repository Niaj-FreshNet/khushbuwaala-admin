"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CartItem } from "@/types/cart.types"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/redux/store/hooks/useCart"
import { Separator } from "@/components/ui/separator"

interface DesktopCartTableProps {
  items: CartItem[]
}

export const DesktopCartTable = ({ items }: DesktopCartTableProps) => {
  const { updateQuantity, removeFromCart } = useCart()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleQuantityChange = (item: CartItem, increment: number) => {
    // const [sizeValue, sizeUnit] = item.selectedSize.split(" ") || []
    // const matchedVariant = item?.product?.variants?.find(
    //   (v: any) =>
    //     Number(v.size) === Number(sizeValue) &&
    //     v.unit?.toLowerCase() === sizeUnit?.toLowerCase()
    // )
    // const variantId = matchedVariant?.id

    setUpdatingId(item.product?.id + item.selectedSize)
    const newQuantity = Math.max(item.quantity + increment, 1)
    updateQuantity(item.product?.id, item.selectedSize, newQuantity, item.product?.name, item.cartItemId)
    setTimeout(() => setUpdatingId(null), 200)
  }

  const handleRemove = (item: CartItem) => {
    // const [sizeValue, sizeUnit] = item.selectedSize.split(" ") || []
    // const matchedVariant = item?.product?.variants?.find(
    //   (v: any) =>
    //     Number(v.size) === Number(sizeValue) &&
    //     v.unit?.toLowerCase() === sizeUnit?.toLowerCase()
    // )
    // const variantId = matchedVariant?.id

    removeFromCart(item.product?.id, item.selectedSize, item.product?.name, item.cartItemId)
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="bg-gray-50/80 rounded-t-xl py-2 px-4 border-b border-gray-100">
        <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 items-center">
          <div className="col-span-5">Product</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-3 text-center">Quantity</div>
          <div className="col-span-2 text-right pr-2">Total</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.map((item: CartItem, index: number) => {

          const isUpdating = updatingId === item.product?.id + item.selectedSize

          const subtotalPrice = item.selectedPrice * item.quantity

          return (
            <div key={`${item.product?.id}-${item.selectedSize}`}>
              <div className="grid grid-cols-12 gap-3 py-3 px-4 items-center hover:bg-gray-50/50 transition-colors duration-150">
                {/* Product */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-16 sm:w-16 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                    <Image
                      src={item.product?.primaryImage || "/placeholder.svg?height=96&width=80"}
                      alt={item.product?.name || "Product Image"}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.product?.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Size: <span className="font-medium text-gray-700">{item.selectedSize}</span>
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right">
                  <span className="font-medium text-sm text-gray-800 whitespace-nowrap">
                    ৳{item.selectedPrice.toFixed(2)}
                  </span>
                </div>

                {/* Quantity + Remove Icon */}
                <div className="col-span-3 flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-none">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleQuantityChange(item, -1)}
                      disabled={item.quantity === 1 || isUpdating}
                      className="h-7 w-7 rounded-r-none border-r border-gray-200 p-0 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="w-8 sm:w-10 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-900">
                      {isUpdating ? "..." : item.quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleQuantityChange(item, 1)}
                      disabled={isUpdating}
                      className="h-7 w-7 rounded-l-none border-l border-gray-200 p-0 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(item)}
                    className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 p-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Total */}
                <div className="col-span-2 text-right pr-2">
                  <span className="font-bold text-sm text-gray-900 whitespace-nowrap">
                    ৳{subtotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              {index < items.length - 1 && <Separator />}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
