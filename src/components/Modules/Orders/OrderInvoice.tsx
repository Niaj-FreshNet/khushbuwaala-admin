"use client";

import React, { forwardRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";

interface OrderInvoiceProps {
    order: any;
    discountBreakdown?: any;
}

function formatBDT(n: number) {
    return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 })
        .format(Math.max(0, Math.round(Number(n || 0))))
        .replace(/^/, "৳");
}

function upper(v: any) {
    return String(v ?? "").trim().toUpperCase();
}

function paymentLabel(method: any) {
    const m = String(method ?? "").toLowerCase();
    if (m === "bkash") return "bKash (Online Payment)";
    if (m === "cashondelivery" || m === "cash_on_delivery" || m === "cashondelivery" || m === "cashondelivery") return "Cash On Delivery";
    // your checkout stores "cashOnDelivery"
    if (m === "cashondelivery" || m === "cashondelivery" || m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery" || m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery" || m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";
    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    if (m === "cashondelivery") return "Cash On Delivery";

    return upper(method || "Not Selected");
}

export const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
    ({ order, discountBreakdown }, ref) => {
        const shipping = order?.shipping || order?.shippingAddress || order?.customerInfo || {};
        const billing = order?.billing || order?.billingAddress || shipping || {};

        // ✅ discounted unit map from discountBreakdown (safe)
        const discountedMap = useMemo(() => {
            const m = new Map<string, number>();
            const items = discountBreakdown?.items ?? [];

            for (const it of items) {
                const key = `${it.productId}__${it.variantId || ""}`;
                m.set(key, Number(it.discountedPrice ?? it.price ?? 0));
            }

            return m;
        }, [discountBreakdown]);

        // ✅ totals: trust server final amount first
        const totals = useMemo(() => {
            const items = order?.orderItems ?? [];

            const subtotalOriginal = items.reduce((acc: number, it: any) => {
                const qty = Math.max(1, Number(it.quantity || 1));
                const unitOriginal = Number(it.price ?? it.variant?.price ?? 0) || 0;
                return acc + unitOriginal * qty;
            }, 0);

            const discountAmount = Math.max(0, Number(order?.discountAmount ?? 0));
            const shippingCost = Math.max(0, Number(order?.shippingCost ?? 0));
            const tax = Math.max(0, Number(order?.estimatedTaxes ?? 0));

            const totalServer = Number(order?.amount ?? 0);
            const subtotalAfterDiscount = Math.max(0, Math.round(subtotalOriginal - discountAmount));

            const total =
                totalServer > 0 ? Math.round(totalServer) : Math.round(subtotalAfterDiscount + shippingCost + tax);

            return {
                subtotalOriginal: Math.round(subtotalOriginal),
                discountAmount: Math.round(discountAmount),
                subtotalAfterDiscount,
                shippingCost: Math.round(shippingCost),
                tax: Math.round(tax),
                total,
            };
        }, [order]);

        const status = upper(order?.status || "PENDING");
        const invoiceNo = order?.invoice || order?.id;
        const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();

        return (
            <div ref={ref} className="bg-white w-full">
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Invoice</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Thank you for choosing <span className="font-semibold">Khushbuwaala Perfumes</span>
                            </p>
                        </div>

                        <div className="text-sm text-gray-700 sm:text-right space-y-1">
                            <p>
                                <span className="text-gray-500">Invoice No:</span>{" "}
                                <span className="font-semibold">#{invoiceNo}</span>
                            </p>
                            <p>
                                <span className="text-gray-500">Date:</span>{" "}
                                <span className="font-medium">
                                    {createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                            </p>
                            <p>
                                <span className="text-gray-500">Status:</span>{" "}
                                <span className="font-semibold">{status}</span>
                            </p>
                            <p>
                                <span className="text-gray-500">Payment:</span>{" "}
                                <span className="font-semibold">{paymentLabel(order?.method)}</span>
                            </p>
                            <p className="pt-1">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${order?.isPaid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                    {order?.isPaid ? "Paid" : "Due"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Addresses */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="border-gray-200">
                            <CardContent className="px-4 py-0 space-y-1">
                                <p className="text-sm font-semibold">Shipping Address</p>
                                <p className="text-sm text-gray-700">{shipping?.name || "N/A"}</p>
                                <p className="text-sm text-gray-700">{shipping?.address || "N/A"}</p>
                                <p className="text-sm text-gray-700">
                                    {(shipping?.thana ? `${shipping.thana}, ` : "")}{shipping?.district || ""}
                                </p>
                                <p className="text-sm text-gray-700">{shipping?.phone || "N/A"}</p>
                                {shipping?.email && <p className="text-sm text-gray-700">{shipping.email}</p>}
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200">
                            <CardContent className="px-4 py-0 space-y-1">
                                <p className="text-sm font-semibold">Billing Address</p>
                                <p className="text-sm text-gray-700">{billing?.name || "N/A"}</p>
                                <p className="text-sm text-gray-700">{billing?.address || "N/A"}</p>
                                <p className="text-sm text-gray-700">
                                    {(billing?.thana ? `${billing.thana}, ` : "")}{billing?.district || ""}
                                </p>
                                <p className="text-sm text-gray-700">{billing?.phone || "N/A"}</p>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200">
                            <CardContent className="px-4 py-0 space-y-1">
                                <p className="text-sm font-semibold">Billed From</p>
                                <p className="text-sm text-gray-700 font-medium">Khushbuwaala Perfumes Ltd.</p>
                                <p className="text-sm text-gray-700">
                                    G/138, Eastern Banabithi Shopping Complex <br /> South Banasree, Khilgaon, Dhaka-1219
                                </p>
                                <p className="text-sm text-gray-700">+880 1566-395807</p>
                                <p className="text-sm text-gray-700">khushbuwaala@gmail.com</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <div className="mt-6">
                        <Card className="border-gray-200">
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="text-center w-12">#</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center w-20">Qty</TableHead>
                                            <TableHead className="text-right w-28">Unit</TableHead>
                                            {/* <TableHead className="text-right w-28">Unit (Disc)</TableHead> */}
                                            <TableHead className="text-right w-28">Total</TableHead>
                                            {/* <TableHead className="text-right w-28">Total (Disc)</TableHead> */}
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {(order?.orderItems ?? []).map((item: any, index: number) => {
                                            const qty = Math.max(1, Number(item.quantity || 1));
                                            const unitOriginal = Number(item.price ?? item.variant?.price ?? 0);

                                            const key = `${item.productId}__${item.variantId || item.variant?.id || ""}`;
                                            const unitDiscounted = discountedMap.get(key) ?? unitOriginal;

                                            const lineOriginal = Math.round(unitOriginal * qty);
                                            const lineDiscounted = Math.round(unitDiscounted * qty);

                                            const save = Math.max(0, lineOriginal - lineDiscounted);
                                            const hasDiscount = save > 0;

                                            return (
                                                <TableRow key={item.id ?? `${pid}_${vid}_${index}`} className="text-sm">
                                                    <TableCell className="text-center">{index + 1}</TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-3 min-w-[280px]">
                                                            <Image
                                                                src={item.product?.primaryImage || "/placeholder.png"}
                                                                alt={item.product?.name || "Product"}
                                                                width={44}
                                                                height={44}
                                                                className="rounded-md object-cover border"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-800 truncate">{item.product?.name || "Product"}</p>
                                                                <p className="text-gray-500 text-xs">
                                                                    Size: {item.size ?? item.variant?.size ?? "-"} {upper(item.unit ?? item.variant?.unit ?? "")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-center">{qty}</TableCell>

                                                    <TableCell className="text-right">{formatBDT(unitOriginal)}</TableCell>

                                                    {/* <TableCell className="text-right">
                                                        {hasDiscount ? (
                                                            <div className="leading-tight">
                                                                <div className="font-semibold text-green-700">{formatBDT(unitDiscounted)}</div>
                                                                <div className="text-xs text-gray-400 line-through">{formatBDT(unitOriginal)}</div>

                                                                <span className="inline-flex mt-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                                    Save {formatBDT(save)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            formatBDT(unitDiscounted)
                                                        )}
                                                    </TableCell> */}

                                                    <TableCell className="text-right">{formatBDT(lineOriginal)}</TableCell>
                                                    {/* <TableCell className="text-right font-semibold">
                                                        {hasDiscount ? (
                                                            <div className="leading-tight">
                                                                <div className="font-semibold text-gray-900">{formatBDT(lineDiscounted)}</div>
                                                                <div className="text-xs text-gray-400 line-through">{formatBDT(lineOriginal)}</div>
                                                            </div>
                                                        ) : (
                                                            formatBDT(lineDiscounted)
                                                        )}
                                                    </TableCell> */}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-full sm:w-[380px] space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatBDT(totals.subtotalOriginal)}</span>
                            </div>

                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between text-green-700">
                                    <span>Discount{order?.coupon ? ` (${upper(order.coupon)})` : ""}</span>
                                    <span>-{formatBDT(totals.discountAmount)}</span>
                                </div>
                            )}

                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>Subtotal after discount:</span>
                                    <span>{formatBDT(totals.subtotalAfterDiscount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span>Shipping:</span>
                                <span>{formatBDT(totals.shippingCost)}</span>
                            </div>

                            {totals.tax > 0 && (
                                <div className="flex justify-between">
                                    <span>Taxes:</span>
                                    <span>{formatBDT(totals.tax)}</span>
                                </div>
                            )}

                            <Separator className="my-2" />

                            <div className="flex justify-between font-bold text-lg text-gray-900">
                                <span>Total:</span>
                                <span>{formatBDT(totals.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-8 mt-8 border-t border-gray-200 text-center">
                        <p className="text-gray-700 font-semibold text-sm">THANK YOU FOR YOUR PURCHASE!</p>
                        <p className="text-gray-600 text-sm">
                            For questions about this invoice, contact us at <b>khushbuwaala@gmail.com</b>
                        </p>
                        <p className="text-lg font-semibold mt-4 text-gray-800">Best Wishes from Khushbuwaala 💐</p>
                    </div>
                </div>
            </div>
        );
    }
);

OrderInvoice.displayName = "OrderInvoice";
