"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CartItem } from "@/types/cart.types"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/redux/store/hooks/useCart"

interface CartItemCardProps {
  item: CartItem
}

export const CartItemCard = ({ item }: CartItemCardProps) => {
  const { updateQuantity, removeFromCart, calculateTotal } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)

  const subtotalPrice = item.selectedPrice * item.quantity

  const handleQuantityChange = async (increment: number) => {
    setIsUpdating(true)
    const newQuantity = Math.max(item.quantity + increment, 1)
    updateQuantity(item.product?.id, item.selectedSize, newQuantity, item.product?.name, item.cartItemId)
    // Optional: brief loading state for better UX
    setTimeout(() => setIsUpdating(false), 200)
  }

  const handleRemove = () => {
    removeFromCart(item.product?.id, item.selectedSize, item.product?.name, item.cartItemId)
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardContent className="px-4 py-0">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative">
            <div className="w-20 h-24 md:w-24 md:h-28 rounded-lg overflow-hidden bg-gray-100 group-hover:shadow-lg transition-shadow duration-300">
              <Image
                src={item.product?.primaryImage || "/placeholder.svg?height=96&width=80"}
                alt={item.product?.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 80px, 96px"
              />
            </div>
            {/* <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
            >
              {item.selectedSize}
            </Badge> */}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                  {item.product?.name}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm">
                  Size: <span className="font-medium">{item.selectedSize}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Price and Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={item.quantity === 1 || isUpdating}
                    className="h-8.5! min-h-0! py-0 rounded-r-none border-r"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <div className="w-10 flex items-center justify-center text-sm font-medium">
                    {isUpdating ? "..." : item.quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={isUpdating}
                    className="h-8.5! min-h-0! py-0 rounded-l-none border-l"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">
                  ৳{item?.selectedPrice.toFixed(2)} each
                </p>
                <p className="font-semibold text-gray-900">
                  ৳{subtotalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
