"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// ✅ Define types based on your updated order response
export interface OrderItem {
  id: string
  userId: string | null
  productId: string
  variantId: string
  quantity: number
  price: number
  status: string
  orderId: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    name: string
    primaryImage: string
  }
  variant: {
    id: string
    productId: string
    sku: string
    unit: string
    size: number
    price: number
    createdAt: string
    updatedAt: string
  }
}

export interface Customer {
  id: string | null
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  imageUrl: string | null
}

export interface Order {
  id: string
  orderTime: string
  amount: number
  isPaid: boolean
  cartItems: any[]
  status: string
  orderSource: string
  customerId: string | null
  productIds: string[]
  salesmanId: string | null
  saleType: string | null
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  customer: Customer
  orderItems: OrderItem[]
  shippingMethod?: "insideDhaka" | "outsideDhaka"
  notes?: string
  subtotal?: number
  shippingCost?: number
  estimatedTaxes?: number
  total?: number
}

interface OrderReceiptProps {
  order: Order
  isOpen: boolean
  onClose: () => void
}

export default function OrderReceipt({ order, isOpen, onClose }: OrderReceiptProps) {
  const totals = useMemo(() => {
    return {
      subtotal: order.subtotal ?? order.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      shippingCost: order.shippingCost ?? 0,
      estimatedTaxes: order.estimatedTaxes ?? 0,
      total: order.total ?? order.amount,
    }
  }, [order])

  if (!isOpen) return null

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print()
  }

  // ✅ Use normalized customer object
  const customer = order.customer ?? {
    id: null,
    name: order.name ?? "Guest",
    email: order.email ?? null,
    phone: order.phone ?? null,
    address: order.address ?? null,
    imageUrl: null,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/50 print:bg-transparent">
      <div className="w-full max-w-4xl px-4 print:px-0">
        <div className="relative bg-white rounded-xl shadow-xl print:shadow-none print:rounded-none">
          {/* Header actions */}
          <div className="flex items-center justify-between p-4 border-b print:hidden">
            <h2 className="text-lg font-semibold">Invoice</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 h-10 rounded-md bg-black text-white text-sm font-medium"
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="px-4 h-10 rounded-md border text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-6 print:p-0">
            {/* Brand + Invoice meta */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Khushbuwaala</h1>
                <p className="text-xs text-gray-500">Premium Perfume Oils</p>
              </div>
              <div className="text-sm text-gray-700">
                <p>
                  <span className="text-gray-500">Invoice #:</span>
                  <span className="ml-2 font-medium">{order.id}</span>
                </p>
                <p>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2 font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-500">Payment:</span>
                  <span className="ml-2 font-medium">{order.isPaid ? "Paid" : "Pending"}</span>
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold">Customer Info</p>
                  <p className="text-sm">Name: {customer.name}</p>
                  {customer.email && <p className="text-sm">Email: {customer.email}</p>}
                  {customer.phone && <p className="text-sm">Phone: {customer.phone}</p>}
                  {customer.address && <p className="text-sm">Address: {customer.address}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold">Shipping</p>
                  <p className="text-sm">{order.shippingMethod === 'insideDhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
                  {order.notes && <p className="text-sm">Notes: {order.notes}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold">Order Details</p>
                  <p className="text-sm">Order Source: {order.orderSource}</p>
                  <p className="text-sm">Status: {order.status}</p>
                </CardContent>
              </Card>
            </div>

            {/* Items table */}
            <div className="mt-6 overflow-hidden rounded-lg border">
              <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
                <div className="col-span-1 text-center">Sl.</div>
                <div className="col-span-6">Product Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-1 text-right">Unit</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {order.orderItems.map((item, index) => {
                const unit = item.variant?.price ?? item.price ?? 0
                const line = unit * item.quantity
                return (
                  <div key={`${item.id}-${index}`} className="grid grid-cols-12 px-4 py-3 border-t text-sm">
                    <div className="col-span-1 text-center">{index + 1}</div>
                    <div className="col-span-6">
                      <div className="font-medium">{item.product.name} <span className="text-gray-500 text-xs">× {item.variant?.size ?? "-"}</span></div>
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-1 text-right">৳{unit.toFixed(2)}</div>
                    <div className="col-span-2 text-right">৳{line.toFixed(2)}</div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="mt-6 flex flex-col sm:items-end">
              <div className="w-full sm:w-80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>৳{totals.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Taxes</span>
                  <span>৳{totals.estimatedTaxes.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>৳{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-8 text-xs text-gray-500">
              <p>Thank you for your purchase! If you have any questions, contact us at support@khushbuwaala.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
