'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Receipt,
  Loader2,
  Package,
  UserRound,
  CreditCard,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Phone,
  Mail,
  Store,
  UserCheck,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useGetSaleByIdQuery } from '@/redux/store/api/sales/salesApi';
import { useLazyGetProductQuery } from '@/redux/store/api/product/productApi';
import SalesInvoice from './SalesInvoice';
import { paymentMethodLabel } from '@/lib/paymentMethods';
import type { Order } from '@/types/order.types';

interface SaleDetailsModalProps {
  saleId: string;
  visible: boolean;
  onClose: () => void;
}

// A line from orderItems (real lines) or cartItems (the JSON copy older sales kept)
type CartOrOrderItem = {
  productId?: string;
  product?: { name?: string; primaryImage?: string } | null;
  size?: number | string | null;
  unit?: string | null;
  price?: number;
  sellingUnitPrice?: number;
  quantity?: number;
  originalPrice?: number | null;
  variant?: { sku?: string; size?: number; unit?: string } | null;
};

type Sale = Order;

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
    CANCEL: 'bg-gray-100 text-gray-700 border-gray-200',
    RETURNED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const methodLabel = (method?: string | null) => paymentMethodLabel(method);

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
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
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

const SaleDetailsModal = ({ saleId, visible, onClose }: SaleDetailsModalProps) => {
  const { data, isLoading } = useGetSaleByIdQuery(saleId, {
    skip: !saleId || !visible,
  });
  const sale: Sale | undefined = data?.data ?? undefined;

  const [fetchProduct] = useLazyGetProductQuery();
  const [productMap, setProductMap] = useState<Record<string, { name: string; primaryImage?: string }>>({});
  const [showInvoice, setShowInvoice] = useState(false);

  // Extract items from either orderItems or cartItems
  const rawItems = useMemo<CartOrOrderItem[]>(() => {
    if (!sale) return [];
    return sale.orderItems || sale.cartItems || [];
  }, [sale]);

  useEffect(() => {
    if (rawItems.length > 0) {
      rawItems.forEach(async (item) => {
        const id = item.productId;
        if (id && !productMap[id]) {
          try {
            const res = await fetchProduct(id).unwrap();
            const product = res?.data;
            if (product) {
              setProductMap((prev) => ({
                ...prev,
                [id]: { name: product.name, primaryImage: product.primaryImage },
              }));
            }
          } catch (err) {
            console.error('Error fetching product', err);
          }
        }
      });
    }
  }, [rawItems, fetchProduct, productMap]);

  const updatedSale = useMemo(() => {
    if (!sale) return undefined;
    return {
      ...sale,
      cartItems: rawItems.map((item) => ({
        ...item,
        product: (item.productId ? productMap[item.productId] : undefined) || item.product,
      })),
      orderItems: rawItems.map((item) => ({
        ...item,
        product: (item.productId ? productMap[item.productId] : undefined) || item.product,
      })),
    };
  }, [sale, rawItems, productMap]);

  const saleDate = useMemo(() => {
    if (!sale) return 'N/A';
    const date = sale.orderTime || sale.createdAt;
    return date
      ? new Date(date).toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';
  }, [sale]);

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(rawItems)) return [];

    return rawItems.map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitOriginal = Number(item.originalPrice ?? item.price ?? item.sellingUnitPrice ?? 0);
      const unitSold = Number(item.price ?? item.sellingUnitPrice ?? unitOriginal);
      const lineOriginal = Math.max(0, Math.round(unitOriginal * quantity));
      const lineFinal = Math.max(0, Math.round(unitSold * quantity));
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
  }, [rawItems]);

  const subtotal = useMemo(() => {
    return normalizedItems.reduce((sum, item) => sum + item.lineFinal, 0);
  }, [normalizedItems]);

  const totalAmount = sale?.amount ?? subtotal;
  const invoiceNumber = sale?.invoice ? sale.invoice : sale ? `SALE-${String(sale.id).slice(-6).toUpperCase()}` : 'Loading...';

  return (
    <>
      <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl">
          
          {/* Header */}
          <DialogHeader className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      Sale Details
                    </span>
                    {sale?.orderSource && (
                      <Badge
                        variant="outline"
                        className="border-gray-200 bg-gray-50 text-[9px] font-semibold text-gray-600 px-1.5 py-0"
                      >
                        {sale.orderSource}
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-lg font-black tracking-tight text-gray-900 mt-0.5">
                    #{invoiceNumber}
                  </DialogTitle>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {sale && (
                  <>
                    <Badge
                      variant="outline"
                      className={`${getStatusStyle(sale.status)} px-2.5 py-1 text-xs font-bold uppercase tracking-wide`}
                    >
                      {sale.status}
                    </Badge>

                    <Button
                      onClick={() => setShowInvoice(true)}
                      size="sm"
                      className="h-8 gap-1.5 bg-orange-500 px-3 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Invoice
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Loading sale details...
              </p>
            </div>
          ) : !sale ? (
            <div className="flex flex-1 flex-col items-center justify-center py-24 bg-white">
              <Package className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">
                No sale details found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                This record may have been removed or is unavailable.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 bg-gray-50/50">

              {/* Overview Cards */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Sale Date
                    </span>
                    <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {saleDate}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Payment
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Badge
                      className={`text-[9px] font-bold px-1.5 py-0 ${
                        sale.isPaid
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sale.isPaid ? 'PAID' : 'DUE'}
                    </Badge>
                    <span className="truncate text-[11px] font-medium text-gray-700">
                      {methodLabel(sale.method)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Customer
                    </span>
                    <UserRound className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <p className="truncate text-xs font-bold text-gray-900">
                    {sale.name || 'Walk-in Customer'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {sale.phone || 'No phone number'}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-800">
                      Total Amount
                    </span>
                    <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <p className="text-base font-black tracking-tight text-orange-900 truncate">
                    ৳{formatBDT(totalAmount)}
                  </p>
                  <p className="text-[10px] text-orange-700/80 font-medium truncate">
                    {normalizedItems.length} item{normalizedItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Customer & Salesman Info Cards */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Customer Information</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-900">
                      {sale.name || 'Walk-in Customer'}
                    </p>
                    {sale.phone && (
                      <p className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {sale.phone}
                      </p>
                    )}
                    {sale.email && (
                      <p className="flex items-center gap-2 break-all text-xs text-gray-600">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {sale.email}
                      </p>
                    )}
                    <div className="flex items-start gap-2 border-t border-gray-100 pt-2.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <div className="text-xs leading-relaxed text-gray-600">
                        <p className="font-medium text-gray-800">
                          {sale.address || 'Address not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Store className="h-4 w-4" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Sale & Staff Info</h3>
                  </div>
                  <div className="space-y-2.5">
                    <InfoRow label="Sale Type" value={sale.saleType} />
                    <InfoRow label="Order Source" value={sale.orderSource} />
                    <InfoRow label="Payment Method" value={methodLabel(sale.method)} />
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Sold By</span>
                      <span className="text-xs font-semibold text-gray-800 sm:text-right flex items-center gap-1 justify-end">
                        <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                        {sale.salesman?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
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
                    Sale Items
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
                          const productInfo = (item.productId ? productMap[item.productId] : undefined) || item.product;
                          const imageSrc = productInfo?.primaryImage || '/placeholder.svg';
                          const productName = productInfo?.name || 'Product Name...';
                          const size = item.variant?.size ?? item.size;
                          const unit = item.variant?.unit ?? item.unit;

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
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
                                        {size ? `${size} ${unit || ''}`.trim() : 'Standard'}
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
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                <div>
                                  <span>৳{formatBDT(item.lineFinal)}</span>
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
                      No items found
                    </p>
                  </div>
                )}
              </section>

              {/* Financial Summary Box */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold text-gray-800">
                        ৳{formatBDT(subtotal)}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Total Amount
                        </span>
                        <span className="text-base font-black tracking-tight text-orange-600">
                          ৳{formatBDT(totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        sale.isPaid ? 'bg-emerald-50' : 'bg-rose-50'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          sale.isPaid ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {sale.isPaid ? 'Payment received' : 'Payment due'}
                      </span>

                      <span
                        className={`text-[11px] font-bold ${
                          sale.isPaid ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {sale.isPaid ? 'PAID' : 'DUE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-2 border-t border-gray-200 bg-white pt-3 pb-1 sm:flex-row sm:items-center sm:justify-between px-1">
                <p className="text-[11px] text-gray-400">
                  Sale #{invoiceNumber}
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

      {/* Invoice Modal */}
      {updatedSale && (
        <SalesInvoice
          sale={updatedSale}
          visible={showInvoice}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
};

export default SaleDetailsModal;