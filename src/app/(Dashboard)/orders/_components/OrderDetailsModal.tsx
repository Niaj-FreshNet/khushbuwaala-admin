'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  Receipt,
  Loader2,
  Package,
  Truck,
  UserRound,
  CreditCard,
  MapPin,
  CalendarDays,
  Tag,
  ShieldCheck,
  Phone,
  Mail,
  Store,
  StickyNote,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

type AddressInfo = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  thana?: Nullable<string>;
};

type OrderApi = {
  id: string;
  consignmentId?: number | null;
  courierStatus?: string | null;
  deliveryCharge?: number | null;
  returnChargeCollected?: number | null;
  courierPayoutId?: string | null;
  courierPaidAt?: string | null;
  courierCodCollected?: number | null;
  courierReview?: string | null;
  trackingCode?: string | null;
  invoice?: string;
  orderTime?: string;
  createdAt?: string;

  amount: number;
  shippingCost?: number;
  additionalNotes?: string | null;
  discountAmount?: number;
  coupon?: string;

  isPaid: boolean;
  method: string;
  status: string;

  orderSource?: string;
  saleType?: string;
  salesmanId?: Nullable<string>;

  shipping?: Nullable<AddressInfo>;
  billing?: Nullable<AddressInfo>;

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

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELED: 'bg-gray-100 text-gray-700 border-gray-200',
    RETURNED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const methodLabel = (method?: string) => {
  if (!method) return 'N/A';

  const methods: Record<string, string> = {
    cashOnDelivery: 'Cash on Delivery',
    cash: 'Cash',
    onlinePayment: 'Online Payment',
    bkashPayment: 'bKash Payment',
    bkash: 'bKash',
    bkashPersonal: 'bKash Personal',
    nagadPayment: 'Nagad Payment',
    nagad: 'Nagad',
    nagadPersonal: 'Nagad Personal',
    rocketPayment: 'Rocket Payment',
    rocket: 'Rocket',
    rocketPersonal: 'Rocket Personal',
    bankTransfer: 'Bank Transfer',
    cardPayment: 'Card Payment',
  };

  return methods[method] || method;
};

const SectionTitle = ({
  icon: Icon,
  children,
  right,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h3>
    {right}
  </div>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-semibold text-gray-800 sm:text-right">
      {value || 'N/A'}
    </span>
  </div>
);

const AddressCard = ({
  title,
  icon: Icon,
  address,
}: {
  title: string;
  icon: React.ElementType;
  address?: AddressInfo | null;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">{title}</h3>
    </div>

    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-900">
        {address?.name || 'N/A'}
      </p>

      {address?.phone && (
        <p className="flex items-center gap-2 text-xs text-gray-600">
          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          {address.phone}
        </p>
      )}

      {address?.email && !address.email.includes('guest') && (
        <p className="flex items-center gap-2 break-all text-xs text-gray-600">
          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          {address.email}
        </p>
      )}

      <div className="flex items-start gap-2 border-t border-gray-100 pt-2.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
        <div className="text-xs leading-relaxed text-gray-600">
          <p className="font-medium text-gray-800">
            {address?.address || 'Address not provided'}
          </p>
          <p>
            {[address?.thana, address?.district].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const OrderDetailsModal = ({
  orderId,
  visible,
  onClose,
}: OrderDetailsModalProps) => {
  const { data, isLoading } = useGetOrderByIdQuery(orderId, {
    skip: !orderId || !visible,
  });

  const order = data?.data as unknown as OrderApi | undefined;
  const [showInvoice, setShowInvoice] = useState(false);

  const orderDate = useMemo(() => {
    if (!order) return 'N/A';

    const date = order.orderTime || order.createdAt;

    return date
      ? new Date(date).toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';
  }, [order]);

  const normalizedItems = useMemo(() => {
    return (order?.orderItems ?? []).map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));

      const unitOriginal = Number(
        item.originalPrice ?? item.variant?.price ?? item.price ?? 0,
      );

      const unitSold = Number(item.price ?? unitOriginal);

      const lineOriginal = Math.max(
        0,
        Math.round(unitOriginal * quantity),
      );

      const lineFinal = Math.max(
        0,
        Math.round(unitSold * quantity),
      );

      const lineSave = Math.max(0, lineOriginal - lineFinal);

      return {
        ...item,
        quantity,
        unitOriginal,
        unitSold,
        lineOriginal,
        lineFinal,
        lineSave,
        hasDiscount: lineSave > 0,
      };
    });
  }, [order]);

  const totals = useMemo(() => {
    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.lineOriginal,
      0,
    );

    const itemDiscounts = normalizedItems.reduce(
      (sum, item) => sum + item.lineSave,
      0,
    );

    const orderDiscount = Math.max(
      0,
      Number(order?.discountAmount || 0),
    );

    const discount = Math.max(itemDiscounts, orderDiscount);
    const shippingCost = Number(order?.shippingCost ?? 0);

    const totalAmount = Number(
      order?.amount ?? subtotal - discount + shippingCost,
    );

    return {
      subtotal,
      discount,
      shippingCost,
      totalAmount,
    };
  }, [normalizedItems, order]);

  const shipping = order?.shipping || null;
  const billing = order?.billing || null;
  const coupon = order?.coupon
    ? String(order.coupon).toUpperCase()
    : null;

  const customerName =
    order?.customer?.name ||
    shipping?.name ||
    billing?.name ||
    'Guest Customer';

  const invoiceNumber = order?.invoice
    ? order.invoice
    : order
      ? `ORD-${String(order.id).slice(-6).toUpperCase()}`
      : 'Loading...';

  return (
    <>
      <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl">

          {/* Header */}
          <DialogHeader className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 pr-12 sm:px-6 sm:py-4 sm:pr-12 text-left">
            <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Order Details
                    </span>
                    {order?.orderSource && (
                      <Badge
                        variant="outline"
                        className="border-gray-200 bg-gray-50 text-[9px] font-semibold text-gray-600 px-1.5 py-0"
                      >
                        {order.orderSource}
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-lg font-black tracking-tight text-gray-900 mt-0.5">
                    #{invoiceNumber}
                  </DialogTitle>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {order && (
                  <>
                    <Badge
                      variant="outline"
                      className={`${getStatusStyle(order.status)} px-2.5 py-1 text-xs font-bold uppercase tracking-wide`}
                    >
                      {order.status}
                    </Badge>

                    <Button
                      onClick={() => setShowInvoice(true)}
                      size="sm"
                      className="h-8 gap-1.5 bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Invoice
                    </Button>
                    {/* Full page: editable, and its address can be shared (A-23) */}
                    <Link
                      href={`/orders/${order.id}`}
                      title="Open the full order page"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Full page
                    </Link>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Loading order details...
              </p>
            </div>
          ) : !order ? (
            <div className="flex flex-1 flex-col items-center justify-center py-24 bg-white">
              <Package className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">
                No order details found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                This order may have been removed or is unavailable.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 bg-gray-50/50">

              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Order Date
                    </span>
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {orderDate}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Payment
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Badge
                      className={`text-[9px] font-bold px-1.5 py-0 ${
                        order.isPaid
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {order.isPaid ? 'PAID' : 'UNPAID'}
                    </Badge>
                    <span className="truncate text-[11px] font-medium text-gray-700">
                      {methodLabel(order.method)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Customer
                    </span>
                    <UserRound className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <p className="truncate text-xs font-bold text-gray-900">
                    {customerName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {shipping?.phone || billing?.phone || 'No phone number'}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800">
                      Order Total
                    </span>
                    <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <p className="text-base font-black tracking-tight text-emerald-900 truncate">
                    ৳{formatBDT(totals.totalAmount)}
                  </p>
                  <p className="text-[10px] text-emerald-700/80 font-medium truncate">
                    {normalizedItems.length} item{normalizedItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Steadfast settlement (D-026) */}
              {order && (order.consignmentId || order.courierPayoutId || order.courierReview) && (
                <div className={`rounded-xl border p-3 text-xs ${order.courierReview ? 'border-rose-200 bg-rose-50/60' : 'border-gray-200 bg-white'}`}>
                  <p className="font-bold text-gray-900">
                    Steadfast{order.courierStatus ? `: ${order.courierStatus.replace(/_/g, ' ')}` : ''}
                    {order.consignmentId ? <span className="ml-1 font-mono font-normal text-gray-500">#{order.consignmentId}</span> : null}
                  </p>
                  <p className="mt-1 text-gray-700">
                    {order.courierPayoutId
                      ? <>Cleared in <b>{order.courierPayoutId}</b>{order.courierPaidAt ? ` on ${new Date(order.courierPaidAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' })}` : ''}{order.courierCodCollected != null ? <> · collected ৳{formatBDT(order.courierCodCollected)}</> : null}</>
                      : 'Not paid out by Steadfast yet.'}
                  </p>
                  {order.courierReview && <p className="mt-1 font-semibold text-rose-800">Check: {order.courierReview}</p>}
                </div>
              )}

              {/* Courier return result (D-025): parcel came back */}
              {order && (order.status === 'RETURNED' || (order.status === 'CANCELED' && order.returnChargeCollected != null)) && order.orderSource !== 'SHOWROOM' && (() => {
                const fee = Number(order.deliveryCharge) > 0 ? Number(order.deliveryCharge) : Number(order.shippingCost) || 0;
                const paid = Number(order.returnChargeCollected) || 0;
                const net = paid - fee;
                return (
                  <div className={`rounded-xl border p-3 text-xs ${net < 0 ? 'border-rose-200 bg-rose-50/60' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="font-bold text-gray-900">
                      Parcel came back {order.status === 'CANCELED' ? '(delivery charge paid)' : '(unpaid)'}
                      {order.courierStatus ? <span className="ml-1 font-normal text-gray-500">· Steadfast: {order.courierStatus}</span> : null}
                    </p>
                    <p className="mt-1 text-gray-700">
                      Customer paid ৳{formatBDT(paid)} · courier fee ৳{formatBDT(fee)}{Number(order.deliveryCharge) > 0 ? '' : ' (estimate)'} ·{' '}
                      <b className={net < 0 ? 'text-rose-700' : 'text-emerald-700'}>{net < 0 ? `loss ৳${formatBDT(-net)}` : net > 0 ? `gain ৳${formatBDT(net)}` : 'no loss'}</b>
                    </p>
                  </div>
                );
              })()}

              {/* Customer Addresses */}
              <section className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <AddressCard
                    title="Shipping Address"
                    icon={Truck}
                    address={shipping}
                  />

                  <AddressCard
                    title="Billing Address"
                    icon={CreditCard}
                    address={{
                      name: billing?.name || shipping?.name,
                      phone: billing?.phone || shipping?.phone,
                      email: billing?.email || shipping?.email,
                      address: billing?.address || shipping?.address,
                      district: billing?.district || shipping?.district,
                      thana: billing?.thana || shipping?.thana,
                    }}
                  />
                </div>
              </section>

              {/* Products Table (Converted to clean HTML Table for fluid full-name wrapping) */}
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="p-4">
                  <SectionTitle
                    icon={Package}
                    right={
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                        {normalizedItems.length} Items
                      </span>
                    }
                  >
                    Ordered Products
                  </SectionTitle>
                </div>

                {normalizedItems.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-y border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="py-2.5 px-4 text-left">Product</th>
                          <th className="py-2.5 px-4 text-center w-20">Qty</th>
                          <th className="py-2.5 px-4 text-right w-28">Unit Price</th>
                          <th className="py-2.5 px-4 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {normalizedItems.map((item, idx) => {
                          const imageSrc =
                            item.product?.primaryImage || '/placeholder.svg';

                          const productName =
                            item.product?.name || 'Product';

                          const size =
                            item.variant?.size ?? item.size;

                          const unit =
                            item.variant?.unit ?? item.unit;

                          return (
                            <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                    <Image
                                      src={imageSrc}
                                      alt={productName}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-semibold text-gray-900 leading-snug">
                                      {productName}
                                    </h4>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                                        {size
                                          ? `${size} ${unit || ''}`.trim()
                                          : 'Standard'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center font-semibold text-gray-800">
                                {item.quantity}
                              </td>

                              <td className="py-3 px-4 text-right text-gray-800 font-medium">
                                <div>
                                  <span>৳{formatBDT(item.unitSold)}</span>
                                  {item.hasDiscount && (
                                    <span className="block text-[10px] text-gray-400 line-through">
                                      ৳{formatBDT(item.unitOriginal)}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                <div>
                                  <span>৳{formatBDT(item.lineFinal)}</span>
                                  {item.hasDiscount && (
                                    <span className="block text-[10px] font-semibold text-emerald-600">
                                      Saved ৳{formatBDT(item.lineSave)}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-white">
                    <Package className="mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-xs font-medium text-gray-600">
                      No products found
                    </p>
                  </div>
                )}
              </section>

              {/* Bottom Details */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SectionTitle icon={Store}>
                      Order Information
                    </SectionTitle>

                    <div className="mt-3 space-y-2.5">
                      <InfoRow
                        label="Order Source"
                        value={order.orderSource || 'Website'}
                      />

                      {order.saleType && (
                        <InfoRow
                          label="Sale Type"
                          value={order.saleType}
                        />
                      )}

                      <InfoRow
                        label="Payment Method"
                        value={methodLabel(order.method)}
                      />

                      <InfoRow
                        label="Payment Status"
                        value={order.isPaid ? 'Paid' : 'Unpaid'}
                      />
                    </div>
                  </div>

                  {order.additionalNotes && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-emerald-700" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Additional Notes
                        </h3>
                      </div>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600">
                        {order.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <SectionTitle icon={Receipt}>
                    Payment Summary
                  </SectionTitle>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold text-gray-800">
                        ৳{formatBDT(totals.subtotal)}
                      </span>
                    </div>

                    {totals.discount > 0 && (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <Tag className="h-3.5 w-3.5" />
                          Discount
                          {coupon && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold">
                              {coupon}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-emerald-600">
                          -৳{formatBDT(totals.discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Truck className="h-3.5 w-3.5" />
                        Shipping
                      </span>
                      <span className="font-semibold text-gray-800">
                        {totals.shippingCost === 0
                          ? 'FREE'
                          : `৳${formatBDT(totals.shippingCost)}`}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Total Amount
                        </span>
                        <span className="text-base font-black tracking-tight text-emerald-700">
                          ৳{formatBDT(totals.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        order.isPaid ? 'bg-emerald-50' : 'bg-rose-50'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          order.isPaid ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {order.isPaid ? 'Payment received' : 'Payment due'}
                      </span>

                      <span
                        className={`text-[11px] font-bold ${
                          order.isPaid ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {order.isPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-2 border-t border-gray-200 bg-white pt-3 pb-1 sm:flex-row sm:items-center sm:justify-between px-1">
                <p className="text-[11px] text-gray-400">
                  Order #{invoiceNumber}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8 border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Close Details
                </Button>
              </div>
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