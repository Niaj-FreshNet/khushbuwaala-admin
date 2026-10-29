"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Printer,
    Download,
    ArrowLeft,
    ShoppingBag,
    CheckCircle2,
    Clock,
    Truck,
    Loader2,
} from "lucide-react";
import { useGetOrderByIdQuery } from "@/redux/store/api/order/ordersApi";
import { useApplyDiscountMutation } from "@/redux/store/api/discount/discountApi";
import InvoiceDocument from "@/components/Modules/Orders/InvoiceDocument";
import StoreContainer from "@/components/Layout/StoreContainer";
import { useRouter } from "next/navigation";

export default function InvoicePageClient({ orderId }: { orderId: string }) {
  const router = useRouter();
    const { data, isLoading } = useGetOrderByIdQuery(orderId, { skip: !orderId });
    const order = data?.data;

    const [applyDiscount] = useApplyDiscountMutation();
    const [discountBreakdown, setDiscountBreakdown] = useState<any>(null);

    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const invoiceNo = useMemo(() => {
        if (!order) return "";
        return order?.invoice
            ? String(order.invoice)
            : `ORD-${String(order?.id || "").slice(-6).toUpperCase()}`;
    }, [order]);

    // Fetch discount breakdown once order loaded
    useEffect(() => {
        const run = async () => {
            if (!order?.orderItems?.length) return;

            const code = order?.coupon ? String(order.coupon) : undefined;
            const items = order.orderItems.map((it: any) => ({
                productId: it.productId || it.product?.id,
                variantId: it.variantId || it.variant?.id,
                price: Number(it.price ?? it.variant?.price ?? 0),
                qty: Math.max(1, Number(it.quantity || 1)),
            }));

            if (items.some((x: any) => !x.productId || !x.price || x.price <= 0))
                return;

            try {
                const res = await applyDiscount({ code, items }).unwrap();
                const root = (res as any)?.data ?? res;
                setDiscountBreakdown(root);
            } catch {
                setDiscountBreakdown(null);
            }
        };

        run();
    }, [order, applyDiscount]);

    const handlePrint = () => {
        window.print();
    };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/shop");
    }
  };

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current || isDownloading) return;

        try {
            setIsDownloading(true);
            const html2pdf = (await import("html2pdf.js")).default;

            const node = invoiceRef.current.cloneNode(true) as HTMLElement;

            const wrap = document.createElement("div");
            wrap.style.position = "fixed";
            wrap.style.left = "-99999px";
            wrap.style.top = "0";
            wrap.style.width = "794px";
            wrap.style.background = "#fff";
            wrap.appendChild(node);
            document.body.appendChild(wrap);

            await new Promise((r) => setTimeout(r, 200));

            await html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `Invoice-${invoiceNo}.pdf`,
                    image: { type: "jpeg", quality: 0.95 },
                    html2canvas: {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: "#ffffff",
                        logging: false,
                        windowWidth: 794,
                    },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak: { mode: ["css", "legacy"] },
                })
                .from(node)
                .save();

            document.body.removeChild(wrap);
        } catch (e) {
            console.error("PDF generation failed:", e);
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <StoreContainer>
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm font-medium text-gray-500">Preparing invoice details...</p>
                </div>
            </StoreContainer>
        );
    }

    if (!order) {
        return (
            <StoreContainer>
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                        <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Invoice Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        We couldn't retrieve the details for this order invoice.
                    </p>
                    <Button asChild className="bg-green-500 hover:bg-green-600 rounded-xl">
                        <Link href="/shop">Continue Shopping</Link>
                    </Button>
                </div>
            </StoreContainer>
        );
    }

    const isDelivered = String(order?.status).toLowerCase() === "delivered";

    return (
        <StoreContainer>
            <div className="min-h-screen bg-[#FBFBFA] pt-3 sm:pt-6 pb-12">
                {/* Top Control Bar (Hidden on print) */}
                <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden">
                    <div className="flex flex-row items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-gray-100 shrink-0"
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBack}
                                    aria-label="Go back"
                                    className="h-8 w-8 rounded-full bg-white shadow-2xs hover:bg-gray-100 cursor-pointer shrink-0"
                                >
                                    <ArrowLeft className="w-4 h-4 text-gray-700" />
                                </Button>
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-gray-900">
                                        Invoice #{invoiceNo}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                size="sm"
                                className="rounded-md border-gray-300 text-xs font-semibold hover:bg-gray-50 h-9 px-3.5 cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                            </Button>
                            <Button
                                onClick={handleDownloadPDF}
                                disabled={isDownloading}
                                size="sm"
                                className="rounded-md bg-green-700 hover:bg-green-600 text-white text-xs font-bold shadow-sm h-9 px-4 cursor-pointer"
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
                    </div>
                </div>

                {/* Invoice Document Canvas */}
                <div className="max-w-4xl mx-auto px-4 print:p-0 print:max-w-none">
                    <InvoiceDocument
                        ref={invoiceRef}
                        order={order}
                        discountBreakdown={discountBreakdown}
                    />
                </div>
            </div>
        </StoreContainer>
    );
}