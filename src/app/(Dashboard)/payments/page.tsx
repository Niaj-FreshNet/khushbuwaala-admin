"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useGetAllPaymentHistoryQuery } from "@/redux/store/api/payment/paymentApi";
import Link from "next/link";

export default function PaymentManagementPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const { data, isLoading } = useGetAllPaymentHistoryQuery({
        searchTerm: searchTerm.trim() || undefined,
        page,
        limit,
    });

    const payments = data?.data?.data || [];
    const meta = data?.data?.meta;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <Badge className="bg-emerald-600 text-white flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
            case "INITIATED":
                return <Badge className="bg-amber-500 text-white flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Initiated</Badge>;
            default:
                return <Badge className="bg-rose-600 text-white flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Failed</Badge>;
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
            <div className="max-w-7xl mx-auto space-y-4">

                {/* Header Title */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-[#FB923C]" /> Gateway Transactions History
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Monitor online payment gateway logs, transaction IDs, and verification statuses
                        </p>
                    </div>

                    <div className="relative w-full sm:w-[320px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search gateway ID or invoice..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 bg-white border-gray-300 focus:border-[#FB923C]"
                        />
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
                                <TableRow>
                                    <TableHead className="font-bold">Sr.</TableHead>
                                    <TableHead className="font-bold">Gateway Txn ID</TableHead>
                                    <TableHead className="font-bold">Order Invoice</TableHead>
                                    <TableHead className="font-bold">Provider</TableHead>
                                    <TableHead className="font-bold">Amount</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Date & Time</TableHead>
                                    <TableHead className="text-right font-bold pr-4">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 text-sm">
                                {isLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={8} className="py-4">
                                                <Skeleton className="w-full h-8 my-1 rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                            <p className="font-medium text-base">No payment history found.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment: any, index: number) => (
                                        <TableRow key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                                            <TableCell className="font-medium text-gray-500">
                                                {(page - 1) * limit + index + 1}.
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-gray-800">
                                                {payment.gatewayPaymentId || payment.id}
                                            </TableCell>
                                            <TableCell className="font-semibold text-gray-900">
                                                {payment.order?.id ? (
                                                    <Link
                                                        target="_blank"
                                                        href={`/dashboard/orders/${payment.order.id}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        #{payment.order.invoice}
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-xs uppercase bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {payment.provider}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900">
                                                {payment.amount} BDT
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(payment.status)}
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                                                {new Date(payment.createdAt).toLocaleString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                {payment.order?.id && (
                                                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                                                        <Link href={`/dashboard/orders/${payment.order.id}`} target="_blank">
                                                            View Order
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta && (
                        <div className="flex justify-between items-center p-4 bg-gray-50/50 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-800">{meta.page}</span> of <span className="font-bold text-gray-800">{meta.totalPage || 1}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((prev) => prev - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= (meta.totalPage || 1)}
                                    onClick={() => setPage((prev) => prev + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}