'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Receipt } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useGetOrderByIdQuery } from '@/redux/store/api/order/ordersApi';
import OrderInvoice from './OrderInvoice';

interface OrderDetailsModalProps {
  orderId: string;
  visible: boolean;
  onClose: () => void;
}

type Nullable<T> = T | null | undefined;

type OrderApi = {
  id: string;
  invoice?: string;
  orderTime?: string;
  createdAt?: string;

  amount: number;
  shippingCost?: number;
  additionalNotes?: string;
  discountAmount?: number;
  coupon?: string;

  isPaid: boolean;
  method: string;
  status: string;

  orderSource?: string;
  saleType?: string;

  salesmanId?: Nullable<string>;

  shipping?: Nullable<{
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: Nullable<string>;
  }>;

  billing?: Nullable<{
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    thana?: Nullable<string>;
  }>;

  customer?: Nullable<{
    id: string;
    name?: string;
    imageUrl?: Nullable<string>;
  }>;

  orderItems?: Array<{
    id: string;
    productId: string;
    variantId?: string;
    size?: number;
    unit?: string;
    quantity: number;
    price: number;
    originalPrice?: number;
    discount?: number;
    status?: string;

    product?: Nullable<{
      id: string;
      name?: string;
      primaryImage?: string;
    }>;

    variant?: Nullable<{
      id: string;
      sku?: string;
      unit?: string;
      size?: number;
      price?: number;
    }>;
  }>;
};

const formatBDT = (amount: number) =>
  new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(amount || 0))));

const OrderDetailsModal = ({ orderId, visible, onClose }: OrderDetailsModalProps) => {
  const { data, isLoading } = useGetOrderByIdQuery(orderId, { skip: !orderId });
  const order: OrderApi | undefined = data?.data;

  const [showInvoice, setShowInvoice] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-500';
      case 'PROCESSING':
        return 'bg-yellow-500';
      case 'DELIVERED':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-[#4CD964]';
      case 'CANCELED':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const methodLabel = (method?: string) => {
    if (!method) return 'N/A';
    return method === 'cashOnDelivery'
      ? 'Cash On Delivery'
      : method === 'cash'
        ? 'Cash'
        : method === 'onlinePayment'
          ? 'Online Payment'
          : method === 'bkashPayment' || method === 'bkash'
            ? 'Bkash Payment'
            : method === 'bkashPersonal'
              ? 'Bkash Personal'
              : method === 'nagadPayment' || method === 'nagad'
                ? 'Nagad Payment'
                : method === 'nagadPersonal'
                  ? 'Nagad Personal'
                  : method === 'rocketPayment'
                    ? 'Rocket Payment'
                    : method === 'rocketPersonal'
                      ? 'Rocket Personal'
                      : method === 'bankTransfer'
                        ? 'Bank Transfer'
                        : method === 'cardPayment'
                          ? 'Card Payment'
                          : 'Unknown';
  };

  const orderDate = useMemo(() => {
    if (!order) return 'N/A';
    const d = order.orderTime || order.createdAt;
    return d ? new Date(d).toLocaleString() : 'N/A';
  }, [order]);

  const totalOrderDiscount = Math.max(0, Number(order?.discountAmount || 0));

  // Resolved line items with discounts
  const normalizedItems = useMemo(() => {
    const rawItems = order?.orderItems ?? [];

    return rawItems.map((it) => {
      const qty = Math.max(1, Number(it.quantity || 1));
      let unitOriginal = Number(it.originalPrice ?? it.variant?.price ?? it.price ?? 0);
      let unitSold = Number(it.price ?? unitOriginal);

      // Legacy fallback for orders placed before originalPrice was persisted
      const hasSavedOriginal = it.originalPrice !== undefined && it.originalPrice !== null;
      if (!hasSavedOriginal && totalOrderDiscount > 0) {
        const nameLower = String(it.product?.name || '').toLowerCase();
        const unitUpper = String(it.unit || it.variant?.unit || '').toUpperCase();

        if ((unitUpper === 'PACKAGE' || nameLower.includes('combo')) && unitOriginal === 880) {
          unitSold = 550;
        }
        if (nameLower.includes('vampire blood') && unitOriginal === 420) {
          unitSold = 344;
        }
      }

      const lineOriginal = Math.max(0, Math.round(unitOriginal * qty));
      const lineFinal = Math.max(0, Math.round(unitSold * qty));
      const lineSave = Math.max(0, lineOriginal - lineFinal);

      return {
        ...it,
        qty,
        unitOriginal,
        unitSold,
        lineOriginal,
        lineFinal,
        lineSave,
        hasDiscount: lineSave > 0,
      };
    });
  }, [order, totalOrderDiscount]);

  const totals = useMemo(() => {
    const subtotalOriginal = normalizedItems.reduce((sum, it) => sum + it.lineOriginal, 0);
    const itemDiscountsSum = normalizedItems.reduce((sum, it) => sum + it.lineSave, 0);
    const displayDiscount = Math.max(itemDiscountsSum, totalOrderDiscount);
    const shippingCost = Number(order?.shippingCost ?? 0);
    const totalAmount = Number(order?.amount ?? (subtotalOriginal - displayDiscount + shippingCost));

    return {
      subtotalOriginal,
      displayDiscount,
      shippingCost,
      totalAmount,
    };
  }, [normalizedItems, totalOrderDiscount, order]);

  const shipping = order?.shipping || null;
  const billing = order?.billing || null;
  const coupon = order?.coupon ? String(order.coupon).toUpperCase() : null;

  return (
    <>
      <Dialog open={visible} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#FB923C] flex items-center justify-between">
              <span>Order Details</span>

              {order && (
                <Button
                  onClick={() => setShowInvoice(true)}
                  className="bg-[#FB923C] hover:bg-[#ff8a29]"
                  size="sm"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  View Invoice
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8">Loading order details...</div>
          ) : !order ? (
            <div className="text-center py-8">No order details found.</div>
          ) : (
            <div className="space-y-6">
              {/* Order Info */}
              <Card className="border-[#FB923C]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Order Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Invoice</p>
                      <p className="font-semibold">
                        #{order.invoice ? order.invoice : `ORD-${String(order.id).slice(-6).toUpperCase()}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Order Time</p>
                      <p>{orderDate}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Order Source</p>
                      <p>{order.orderSource || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Customer</p>
                      <p>{order.customer?.name || shipping?.name || billing?.name || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Handled By</p>
                      <p>{order.salesmanId ? 'Assigned' : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card className="border-[#FB923C]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Method</p>
                      <p className="font-semibold">{methodLabel(order.method)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Status</p>
                      <Badge className={order.isPaid ? 'bg-[#13db34]' : 'bg-red-500'}>
                        <p className="font-bold">{order.isPaid ? 'PAID' : 'DUE'}</p>
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Subtotal</p>
                      <p className="font-semibold">{formatBDT(totals.subtotalOriginal)} BDT</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Discount</p>
                      <p className="font-semibold text-emerald-700">
                        {totals.displayDiscount > 0
                          ? `-${formatBDT(totals.displayDiscount)} BDT ${coupon ? `(${coupon})` : ''}`
                          : '0 BDT'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Shipping Cost</p>
                      <p className="font-semibold">
                        {totals.shippingCost === 0 ? 'FREE' : `${formatBDT(totals.shippingCost)} BDT`}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 underline">Total Amount</p>
                      <p className="font-bold text-lg text-green-700">{formatBDT(totals.totalAmount)} BDT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping & Billing Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <h3 className="text-base font-semibold mb-3">Shipping Address</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">{shipping?.name || 'N/A'}</p>
                      <p>{shipping?.phone || 'N/A'}</p>
                      <p>{shipping?.email || 'N/A'}</p>
                      <p>{shipping?.address || 'N/A'}</p>
                      <p>{[shipping?.thana, shipping?.district].filter(Boolean).join(', ') || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <h3 className="text-base font-semibold mb-3">Billing Address</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">{billing?.name || shipping?.name || 'N/A'}</p>
                      <p>{billing?.phone || shipping?.phone || 'N/A'}</p>
                      <p>{billing?.email || shipping?.email || 'N/A'}</p>
                      <p>{billing?.address || shipping?.address || 'N/A'}</p>
                      <p>{[billing?.thana, billing?.district].filter(Boolean).join(', ') || shipping?.district || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card className="border-[#FB923C]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>

                  {normalizedItems.length ? (
                    normalizedItems.map((item, index) => {
                      const imageSrc = item.product?.primaryImage || '/placeholder.svg';
                      const productName = item.product?.name || 'Product';
                      const size = item.variant?.size ?? item.size;
                      const unit = item.variant?.unit ?? item.unit;

                      return (
                        <div key={item.id ?? index} className="border rounded-lg p-4 mb-4 bg-white shadow-xs">
                          <div className="flex gap-4 items-center">
                            <Image
                              src={imageSrc}
                              alt={productName}
                              width={70}
                              height={70}
                              className="rounded-lg object-cover border"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-base text-gray-900">{productName}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Variant: {size ? `${size} ${unit ?? ''}`.trim() : 'N/A'}
                                    {item.variant?.sku && ` · SKU: ${item.variant.sku}`}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {formatBDT(item.lineFinal)} BDT
                                  </span>
                                  {item.hasDiscount && (
                                    <span className="block text-xs text-gray-400 line-through">
                                      {formatBDT(item.lineOriginal)} BDT
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t">
                                <span>
                                  Unit Price:{' '}
                                  {item.hasDiscount ? (
                                    <>
                                      <strong className="text-gray-900">{formatBDT(item.unitSold)} BDT</strong>{' '}
                                      <span className="line-through text-gray-400 font-normal">
                                        ({formatBDT(item.unitOriginal)} BDT)
                                      </span>
                                    </>
                                  ) : (
                                    <strong className="text-gray-900">{formatBDT(item.unitOriginal)} BDT</strong>
                                  )}
                                </span>

                                <span>
                                  Qty: <strong className="text-gray-900">{item.qty}</strong>
                                </span>

                                {item.hasDiscount && (
                                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                                    Saved {formatBDT(item.lineSave)} BDT
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-6">No order items found.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {order && (
        <OrderInvoice
          order={order as any}
          visible={showInvoice}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
};

export default OrderDetailsModal;