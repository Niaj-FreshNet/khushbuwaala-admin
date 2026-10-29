"use client";

import React, { forwardRef, useMemo } from "react";

type Props = {
  order: any;
  discountBreakdown?: any;
};

const formatBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 })
    .format(Math.max(0, Math.round(Number(n || 0))))
    .replace(/^/, "৳");

const InvoiceDocument = forwardRef<HTMLDivElement, Props>(
  ({ order, discountBreakdown }, ref) => {
    // Check if breakdown returned item-level discounts
    const breakdownItemMap = useMemo(() => {
      const map = new Map<string, { discountedPrice: number; discount: number }>();
      const items = discountBreakdown?.items ?? [];
      for (const it of items) {
        const key = `${it.productId || it.product?._id || it.product?.id}__${
          it.variantId || it.variant?._id || it.variant?.id || ""
        }`;
        const orig = Number(it.price || it.originalPrice || 0);
        const disc = Number(it.discountedPrice ?? orig);
        if (orig > disc) {
          map.set(key, { discountedPrice: disc, discount: orig - disc });
        }
      }
      return map;
    }, [discountBreakdown]);

    // Order total discount recorded in database
    const totalOrderDiscount = Math.max(0, Number(order?.discountAmount || 0));

    const lines = useMemo(() => {
      const items = order?.orderItems ?? order?.cartItems ?? [];

      return items.map((it: any, idx: number) => {
        const qty = Math.max(1, Number(it.quantity || 1));
        const productId = String(
          it.productId || it.product?.id || it.product?._id || ""
        );
        const variantId = String(
          it.variantId || it.variant?.id || it.variant?._id || ""
        );

        const key = `${productId}__${variantId}`;
        const itemDiscountInfo = breakdownItemMap.get(key);

        const unitOriginal = Number(
          it.variant?.price ?? it.price ?? 0
        );

        const lineOriginal = Math.max(0, Math.round(unitOriginal * qty));

        let finalLine = lineOriginal;
        let save = 0;

        if (itemDiscountInfo && itemDiscountInfo.discount > 0) {
          finalLine = Math.max(0, Math.round(itemDiscountInfo.discountedPrice * qty));
          save = Math.max(0, lineOriginal - finalLine);
        }

        const size = it.size ?? it.variant?.size;
        const unit = it.unit ?? it.variant?.unit;
        const sizeLabel =
          size && unit
            ? `${size} ${String(unit).toUpperCase()}`
            : it.selectedSize || "N/A";

        return {
          id: it.id || `${productId}-${variantId}-${idx}`,
          name: it.product?.name || it.name || "Product",
          image:
            it.product?.primaryImage ||
            it.product?.imageUrl ||
            "/placeholder.png",
          sizeLabel,
          qty,
          unitOriginal,
          lineOriginal,
          finalLine,
          save,
          hasDiscount: save > 0,
        };
      });
    }, [order, breakdownItemMap]);

    const subtotal = useMemo(
      () => lines.reduce((acc, l) => acc + l.lineOriginal, 0),
      [lines]
    );

    const shipping = Math.max(0, Number(order?.shippingCost ?? 0));
    const tax = Math.max(0, Number(order?.estimatedTaxes ?? 0));

    // Trust the database stored amount
    const totalPayable = Math.max(
      0,
      Number(order?.amount ?? subtotal - totalOrderDiscount + shipping + tax)
    );

    const invoiceNo = order?.invoice
      ? String(order.invoice)
      : `ORD-${String(order?.id || "").slice(-6).toUpperCase()}`;

    const bill = order?.shipping || order?.billing;
    const billName = bill?.name || order?.customer?.name || "Customer";

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: "#ffffff",
          color: "#111827",
          borderColor: "#e5e7eb",
        }}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-gray-900"
      >
        {/* Header - Solid background replacing alpha gradient */}
        <div className="px-6 py-6 border-b-4 border-green-700 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold text-green-700 tracking-tight">
                KHUSHBUWAALA
              </div>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5 leading-relaxed">
                <div>
                  Shop G/138, Eastern Banabithi Shopping Complex, South Banasree
                </div>
                <div>Khilgaon, Dhaka-1219, Bangladesh</div>
                <div>Phone: +880 1566-395807 | Email: khushbuwaala@gmail.com</div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block text-xs font-bold tracking-widest text-gray-800 uppercase py-1 rounded-md mb-1.5">
                Invoice
              </span>
              <div className="text-xl font-black text-gray-900">#{invoiceNo}</div>
              <div className="text-xs text-gray-500 mt-1">
                Date:{" "}
                {new Date(order?.createdAt || order?.orderTime || Date.now()).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Meta - Solid backgrounds and borders */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 border-b border-gray-100 text-xs">
          <div>
            <span className="font-bold text-green-700 uppercase tracking-wider block mb-2">
              Bill To
            </span>
            <div className="space-y-1 text-gray-700">
              <div className="font-bold text-gray-900 text-sm">{billName}</div>
              <div className="break-words leading-relaxed">
                {bill?.address || "Address not provided"}
              </div>
              <div>
                {[bill?.thana, bill?.district].filter(Boolean).join(", ") ||
                  "Dhaka, Bangladesh"}
              </div>
              <div className="font-medium text-gray-900">
                Phone: {bill?.phone || "N/A"}
              </div>
              {bill?.email && (
                <div className="text-gray-500 break-words">{bill.email}</div>
              )}
            </div>
          </div>

          <div className="sm:border-l sm:border-gray-200 sm:pl-6 space-y-2 text-gray-700">
            <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Order Information
            </span>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-semibold text-gray-900">
                {String(order?.method || "").toLowerCase() === "cashondelivery"
                  ? "Cash On Delivery"
                  : "Online / bKash"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Status:</span>
              <span className="font-semibold uppercase text-gray-900">
                {order?.status || "PENDING"}
              </span>
            </div>
            {order?.coupon && (
              <div className="flex justify-between">
                <span className="text-gray-500">Coupon Used:</span>
                <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {String(order.coupon).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table - Clean alternating rows */}
        <div className="px-6 py-5">
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-green-700 text-white font-semibold">
                  <th className="py-2.5 px-3 text-left min-w-[240px]">Item</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">Size</th>
                  <th className="py-2.5 px-3 text-center min-w-[60px]">Qty</th>
                  <th className="py-2.5 px-3 text-right min-w-[100px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((x, i) => (
                  <tr
                    key={x.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={x.image}
                          alt={x.name}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).src =
                              "/placeholder.png")
                          }
                          style={{ width: 44, height: 44, objectFit: "cover" }}
                          className="rounded-lg border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {x.name}
                          </div>
                          {x.hasDiscount && (
                            <span className="inline-flex mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                              Save {formatBDT(x.save)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-medium text-gray-600">
                      {x.sizeLabel}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-gray-800">
                      {x.qty}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {x.hasDiscount ? (
                        <div className="leading-tight">
                          <div className="font-bold text-gray-900">
                            {formatBDT(x.finalLine)}
                          </div>
                          <div className="text-[11px] text-gray-400 line-through">
                            {formatBDT(x.lineOriginal)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {formatBDT(x.lineOriginal)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-[380px] space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatBDT(subtotal)}
                </span>
              </div>

              {totalOrderDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Discount Saved
                    {order?.coupon
                      ? ` (${String(order.coupon).toUpperCase()})`
                      : ""}
                  </span>
                  <span className="font-bold">
                    -{formatBDT(totalOrderDiscount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 items-center">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {shipping === 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      FREE SHIPPING
                    </span>
                  ) : (
                    formatBDT(shipping)
                  )}
                </span>
              </div>

              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Taxes</span>
                  <span className="font-semibold text-gray-900">
                    {formatBDT(tax)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-2.5 mt-2 flex justify-between items-baseline text-base font-black">
                <span className="text-gray-900">Total Payable</span>
                <span className="text-green-700 text-lg">
                  {formatBDT(totalPayable)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center text-gray-500 text-xs border-t border-gray-100 pt-5 space-y-1">
            <p className="font-semibold text-gray-800">
              Thank you for choosing Khushbuwaala!
            </p>
            <p className="text-[11px]">
              For inquiries or support, contact us at{" "}
              <span className="font-medium text-gray-700">khushbuwaala@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceDocument.displayName = "InvoiceDocument";
export default InvoiceDocument;