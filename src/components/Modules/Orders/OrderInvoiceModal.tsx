"use client";

import React, { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface OrderInvoiceModalProps {
  order: any;
  isInvoiceOpen?: boolean | null;
  setIsInvoiceOpen?: (open: boolean) => void;
  discountBreakdown?: any;
}

export default function OrderInvoiceModal({
  order,
  isInvoiceOpen,
  setIsInvoiceOpen,
  discountBreakdown,
}: OrderInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const invoiceNo = order?.invoice
    ? String(order.invoice)
    : `ORD-${String(order?.id || "").slice(-6).toUpperCase()}`;

  const formatBDT = (n: number) =>
    `Tk ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(
      Math.max(0, Math.round(Number(n || 0)))
    )}`;

  const formatText = (text?: string | null) => {
    if (!text) return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const paymentLabel = useMemo(() => {
    const m = String(order?.method || "").toLowerCase();
    if (m === "cashondelivery" || m.includes("cash")) return "Cash On Delivery";
    if (m.includes("bkash")) return "bKash";
    if (m.includes("nagad")) return "Nagad";
    if (!m) return "N/A";
    return formatText(m);
  }, [order?.method]);

  const bill = order?.billing || order?.shipping || order?.shippingAddress || order?.customerInfo;
  const billName = bill?.name || order?.customer?.name || "Valued Customer";
  const billEmail = bill?.email || "";
  const billPhone = bill?.phone || "";
  const billAddress = bill?.address || "";
  const locationDetails = [bill?.thana, bill?.district].filter(Boolean).join(", ");

  const breakdownItemMap = useMemo(() => {
    const map = new Map<string, { discountedPrice: number; originalPrice: number; discount: number }>();
    const items = discountBreakdown?.items ?? [];
    for (const it of items) {
      const key = `${it.productId || it.product?._id || it.product?.id}__${it.variantId || it.variant?._id || it.variant?.id || ""
        }`;
      const orig = Number(it.originalPrice || it.price || 0);
      const disc = Number(it.discountedPrice ?? orig);
      if (orig > disc) {
        map.set(key, { originalPrice: orig, discountedPrice: disc, discount: orig - disc });
      }
    }
    return map;
  }, [discountBreakdown]);

  const totalOrderDiscount = Math.max(0, Number(order?.discountAmount || 0));

  const lines = useMemo(() => {
    const items = order?.orderItems ?? [];
    return items.map((it: any, idx: number) => {
      const qty = Math.max(1, Number(it.quantity || 1));
      const productId = it.productId || it.product?.id || "";
      const variantId = it.variantId || it.variant?.id || "";
      const key = `${productId}__${variantId}`;

      const itemDiscountInfo = breakdownItemMap.get(key);

      let unitOriginal = Number(
        it.originalPrice ?? itemDiscountInfo?.originalPrice ?? it.variant?.price ?? it.price ?? 0
      );

      let unitSold = Number(
        itemDiscountInfo?.discountedPrice ?? it.price ?? unitOriginal
      );

      // Backward compatibility for historical orders
      const hasExplicitSavedPrices = it.originalPrice !== undefined && it.originalPrice !== null;
      if (!hasExplicitSavedPrices && !itemDiscountInfo && totalOrderDiscount > 0) {
        const nameLower = String(it.product?.name || it.name || "").toLowerCase();
        const unitUpper = String(it.unit || it.variant?.unit || "").toUpperCase();

        if ((unitUpper === "PACKAGE" || nameLower.includes("combo")) && unitOriginal === 880) {
          unitSold = 550;
        }

        if (nameLower.includes("vampire blood") && unitOriginal === 420) {
          unitSold = 344;
        }
      }

      const lineOriginal = Math.max(0, Math.round(unitOriginal * qty));
      const lineFinal = Math.max(0, Math.round(unitSold * qty));
      const save = Math.max(0, lineOriginal - lineFinal);

      const size = it.size ?? it.variant?.size;
      const unit = it.unit ?? it.variant?.unit;
      const sizeLabel = size && unit ? `${size} ${String(unit).toUpperCase()}` : "Standard";

      return {
        id: it.id || `${productId}-${variantId}-${idx}`,
        name: it.product?.name || "Product Item",
        image: it.product?.primaryImage || "/placeholder.png",
        sizeLabel,
        qty,
        unitOriginal,
        unitSold,
        lineOriginal,
        lineFinal,
        save,
        hasDiscount: save > 0,
      };
    });
  }, [order, breakdownItemMap, totalOrderDiscount]);

  const totals = useMemo(() => {
    const subtotalOriginal = lines.reduce((s, x) => s + x.lineOriginal, 0);
    const itemDiscountsSum = lines.reduce((s, x) => s + x.save, 0);
    const displayDiscountAmount = Math.max(itemDiscountsSum, totalOrderDiscount);

    const coupon = order?.coupon ? String(order.coupon).toUpperCase() : null;
    const shipping = Math.max(0, Number(order?.shippingCost ?? 0));
    const tax = Math.max(0, Number(order?.estimatedTaxes ?? 0));

    const totalPayable = Math.max(0, Number(order?.amount ?? (subtotalOriginal - displayDiscountAmount + shipping + tax)));
    const received = order?.isPaid ? totalPayable : 0;
    const due = Math.max(0, totalPayable - received);

    return {
      subtotalOriginal,
      displayDiscountAmount,
      coupon,
      shipping,
      tax,
      totalPayable,
      received,
      due,
    };
  }, [lines, totalOrderDiscount, order]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const sourceNode = invoiceRef.current;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.style.width = "820px";
      container.style.background = "#ffffff";
      container.style.padding = "24px 28px 36px 28px";
      container.style.boxSizing = "border-box";
      container.style.fontFamily = "Arial, Helvetica, sans-serif";

      const clone = sourceNode.cloneNode(true) as HTMLElement;
      clone.style.height = "auto";
      clone.style.overflow = "visible";

      container.appendChild(clone);
      document.body.appendChild(container);

      const images = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        windowWidth: 820,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const all = clonedDoc.querySelectorAll<HTMLElement>("*");
          all.forEach((el) => {
            el.style.overflow = "visible";
            const comp = window.getComputedStyle(el);
            if (comp.backgroundColor.includes("lab") || comp.backgroundColor.includes("lch")) {
              el.style.backgroundColor = "#ffffff";
            }
            if (comp.color.includes("lab") || comp.color.includes("lch")) {
              el.style.color = "#111827";
            }
            if (comp.borderColor.includes("lab") || comp.borderColor.includes("lch")) {
              el.style.borderColor = "#e5e7eb";
            }
          });
        },
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = imgHeight > pageHeight - margin * 2 ? pageHeight - margin * 2 : imgHeight;

      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, finalHeight);
      pdf.save(`Invoice-${invoiceNo}.pdf`);

      toast.success("Invoice PDF downloaded");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={!!isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[96vh] p-0 flex flex-col border border-gray-200 shadow-2xl rounded-2xl bg-white overflow-hidden">
        {/* Top bar with Close button padding */}
        <DialogHeader className="px-5 py-2.5 border-b bg-gray-50 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="text-base font-semibold text-gray-800">Order Invoice</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                <Link href={`/orders/invoice/${order.id}`} target="_blank">
                  Full Page View
                </Link>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-700 hover:bg-green-600 text-white h-8 text-xs shadow-none"
                size="sm"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Viewport */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto bg-white text-gray-900">
          <div ref={invoiceRef} className="w-full bg-white text-gray-900 space-y-2.5">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-green-700 pb-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-green-700 leading-none mb-1">
                  KHUSHBUWAALA
                </h1>
                <p className="text-[11px] text-gray-600 leading-snug">
                  G/138, Eastern Banabithi Shopping Complex, South Banasree, Dhaka-1219
                </p>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Phone: +880 1566-395807 | Email: khushbuwaala@gmail.com
                </p>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-gray-900 leading-none">INVOICE</span>
                <p className="text-xs font-bold text-gray-800 mt-0.5">#{invoiceNo}</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <div className="space-y-0.5">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">BILLED TO</p>
                <p className="font-bold text-gray-900 text-xs leading-normal">{billName}</p>
                {billPhone && <p className="text-gray-700 leading-snug">{billPhone}</p>}
                {billEmail && <p className="text-gray-700 leading-snug break-all">{billEmail}</p>}
                {billAddress && <p className="text-gray-700 leading-snug break-words">{billAddress}</p>}
                {locationDetails && <p className="text-gray-700 leading-snug">{locationDetails}</p>}
              </div>

              <div className="text-right space-y-1">
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-800">{paymentLabel}</span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-gray-500">Order Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    {formatText(order.status as any)}
                  </span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-gray-500">Payment:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                  >
                    {order.isPaid ? "PAID" : "DUE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-green-700 text-white font-medium text-[11px]">
                  <tr>
                    <th className="py-1.5 px-3 text-left">Item Details</th>
                    <th className="py-1.5 px-3 text-center w-28">Size</th>
                    <th className="py-1.5 px-3 text-right w-24">Price</th>
                    <th className="py-1.5 px-3 text-center w-16">Qty</th>
                    <th className="py-1.5 px-3 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 object-cover rounded border border-gray-200 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 leading-normal block truncate">
                              {item.name}
                            </span>
                            {item.hasDiscount && (
                              <span className="inline-flex text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                                Save {formatBDT(item.save)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-center text-gray-600 leading-normal">{item.sizeLabel}</td>
                      <td className="py-1.5 px-3 text-right text-gray-700 leading-normal">
                        {item.hasDiscount ? (
                          <div className="leading-tight">
                            <span className="font-semibold">{formatBDT(item.unitSold)}</span>
                            <span className="block text-[10px] text-gray-400 line-through">
                              {formatBDT(item.unitOriginal)}
                            </span>
                          </div>
                        ) : (
                          formatBDT(item.unitOriginal)
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-center font-medium leading-normal">{item.qty}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-gray-900 leading-normal">
                        {item.hasDiscount ? (
                          <div className="leading-tight">
                            <span>{formatBDT(item.lineFinal)}</span>
                            <span className="block text-[10px] text-gray-400 line-through font-normal">
                              {formatBDT(item.lineOriginal)}
                            </span>
                          </div>
                        ) : (
                          formatBDT(item.lineOriginal)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="flex justify-end pt-0.5">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600 leading-snug">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">{formatBDT(totals.subtotalOriginal)}</span>
                </div>

                {totals.displayDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium leading-snug">
                    <span>Discount:</span>
                    <span>-{formatBDT(totals.displayDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600 leading-snug">
                  <span>Shipping:</span>
                  <span className="font-semibold text-gray-800">
                    {totals.shipping === 0 ? "FREE" : formatBDT(totals.shipping)}
                  </span>
                </div>

                {totals.tax > 0 && (
                  <div className="flex justify-between text-gray-600 leading-snug">
                    <span>Taxes:</span>
                    <span className="font-semibold text-gray-800">{formatBDT(totals.tax)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-sm text-gray-900 leading-snug">
                  <span>Total Amount:</span>
                  <span className="text-green-700">{formatBDT(totals.totalPayable)}</span>
                </div>

                <div className="flex justify-between text-gray-500 leading-snug text-[11px]">
                  <span>Received:</span>
                  <span>{formatBDT(totals.received)}</span>
                </div>

                <div className="flex justify-between font-semibold text-rose-600 leading-snug text-[11px]">
                  <span>Due Balance:</span>
                  <span>{formatBDT(totals.due)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-gray-200 pt-2 text-[10px] text-gray-500 leading-normal">
              <p>Thank you for choosing Khushbuwaala.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}