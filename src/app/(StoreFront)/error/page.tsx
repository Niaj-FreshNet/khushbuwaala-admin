"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StoreContainer from "@/components/Layout/StoreContainer";
import {
    AlertTriangle,
    RotateCcw,
    ShoppingBag,
    HelpCircle,
    PhoneCall,
    ArrowRight,
} from "lucide-react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const rawMessage = searchParams.get("message") || "payment_failed";

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo(0, 0);
        }
    }, []);

    const { title, description } = useMemo(() => {
        switch (rawMessage.toLowerCase()) {
            case "canceled":
            case "cancelled":
                return {
                    title: "Payment Cancelled",
                    description:
                        "You cancelled the payment process before it could be completed. No amount was deducted from your account.",
                };
            case "missing_txn_id":
            case "missing_paymentid":
                return {
                    title: "Invalid Session",
                    description:
                        "We were unable to locate your transaction reference. Please retry placing your order from checkout.",
                };
            case "payment_not_found":
                return {
                    title: "Transaction Not Found",
                    description:
                        "No corresponding transaction was found on our servers. Please initiate checkout again.",
                };
            case "verification_error":
                return {
                    title: "Verification Timed Out",
                    description:
                        "We could not verify your payment with the gateway. If your account was debited, please contact our support team with your details.",
                };
            default:
                return {
                    title: "Payment Unsuccessful",
                    description:
                        "Your transaction could not be processed at this time. Please verify your payment details or try a different method.",
                };
        }
    }, [rawMessage]);

    return (
        <div className="bg-[#FBFBFA] min-h-[75vh] py-12 sm:py-16">
            <div className="container mx-auto px-4 max-w-xl">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm text-center">
                    {/* Status Icon */}
                    <div className="mx-auto h-16 w-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-rose-500" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        {title}
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed max-w-md mx-auto">
                        {description}
                    </p>

                    {/* Error Details Chip */}
                    {rawMessage && (
                        <div className="mt-4 inline-block bg-gray-50 border border-gray-200/80 rounded-lg px-3 py-1 text-[11px] font-mono text-gray-500">
                            Code: {rawMessage}
                        </div>
                    )}

                    {/* Help Notice */}
                    <div className="mt-6 p-3.5 bg-amber-50/60 border border-amber-100/80 rounded-xl text-left flex items-start gap-3">
                        <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            If your bank or wallet balance was deducted, please don&apos;t worry. It will either auto-revert within 24–48 hours or you can share your transaction reference with our support.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            asChild
                            className="flex-1 h-11 text-xs sm:text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm"
                        >
                            <Link href="/checkout">
                                <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 h-11 text-xs sm:text-sm font-semibold border-gray-200 rounded-xl"
                        >
                            <Link href="/shop">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" /> Back to Shop
                            </Link>
                        </Button>
                    </div>

                    {/* Support Line */}
                    <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <PhoneCall className="h-3.5 w-3.5 text-gray-400" />
                        <span>Need assistance? Call us at</span>
                        <a
                            href="tel:+8801777152588"
                            className="font-bold text-gray-800 hover:underline flex items-center gap-0.5"
                        >
                            01777152588 <ArrowRight className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <StoreContainer>
            <Suspense
                fallback={
                    <div className="min-h-[75vh] flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                    </div>
                }
            >
                <ErrorContent />
            </Suspense>
        </StoreContainer>
    );
}