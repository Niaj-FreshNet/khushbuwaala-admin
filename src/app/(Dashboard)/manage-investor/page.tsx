"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Edit, Percent, Wallet, BadgeDollarSign, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
    useGetAllInvestorsQuery,
    useUpdateInvestorMutation,
    useGetAllWithdrawalsQuery,
    useUpdateWithdrawalStatusMutation
} from "@/redux/store/api/investor/investorApi";
import { cn } from "@/lib/utils";

const money = (v: any) => `৳${Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

export default function ManageInvestorsPage() {
    const { data: res, isLoading, refetch } = useGetAllInvestorsQuery(undefined);
    const { data: withdrawRes, isLoading: loadingWithdrawals } = useGetAllWithdrawalsQuery(undefined);

    const [updateInvestor, { isLoading: isUpdating }] = useUpdateInvestorMutation();
    const [updateWithdrawalStatus, { isLoading: isStatusUpdating }] = useUpdateWithdrawalStatusMutation();

    const investors = res?.data || [];
    const withdrawals = withdrawRes?.data || [];

    // Edit Investor Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
    const [profitShare, setProfitShare] = useState("");
    const [totalInvested, setTotalInvested] = useState("");
    const [currentBalance, setCurrentBalance] = useState("");

    const openEditModal = (investor: any) => {
        setSelectedInvestor(investor);
        setProfitShare(String(investor.profitSharePercentage || 0));
        setTotalInvested(String(investor.totalInvested || 0));
        setCurrentBalance(String(investor.currentBalance || 0));
        setEditModalOpen(true);
    };

    const handleUpdateInvestor = async () => {
        if (!selectedInvestor) return;
        try {
            await updateInvestor({
                id: selectedInvestor.id,
                data: {
                    profitSharePercentage: Number(profitShare),
                    totalInvested: Number(totalInvested),
                    currentBalance: Number(currentBalance),
                }
            }).unwrap();
            toast.success(`${selectedInvestor.user.name}'s data updated successfully!`);
            setEditModalOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update investor data.");
        }
    };

    const handleWithdrawalAction = async (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', e: React.MouseEvent) => {
        e.preventDefault();
        const actionText = status === 'APPROVED' ? 'approve and deduct' : status === 'REJECTED' ? 'reject' : 'complete';

        if (window.confirm(`Are you sure you want to ${actionText} this withdrawal?`)) {
            try {
                await updateWithdrawalStatus({ id, data: { status } }).unwrap();
                toast.success(`Withdrawal marked as ${status}`);
            } catch (error: any) {
                toast.error(error?.data?.message || "Failed to process withdrawal");
            }
        }
    };

    if (isLoading || loadingWithdrawals) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="ml-2 font-medium text-stone-600">Loading records...</span>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Manage Investors</h1>
                    <p className="text-xs text-gray-500 mt-0.5">View and update investor profit shares, balances, and process payouts.</p>
                </div>
            </div>

            {/* Investors Roster Table */}
            <Card className="shadow-2xs border-gray-200/80 rounded-xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 pb-3">
                    <CardTitle className="text-sm font-bold text-gray-800">Active Investor Roster</CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto w-full">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-xs text-gray-600">Investor</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-center">Profit Share</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-right">Capital Invested</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-right">Available Balance</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-right pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {investors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-400 text-xs">No investors found.</TableCell>
                                    </TableRow>
                                ) : (
                                    investors.map((inv: any) => (
                                        <TableRow key={inv.id} className="hover:bg-gray-50/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-gray-900">{inv.user.name}</span>
                                                    <span className="text-[11px] text-gray-500">{inv.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200">
                                                    {inv.profitSharePercentage}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-700">{money(inv.totalInvested)}</TableCell>
                                            <TableCell className="text-right font-black text-emerald-600">{money(inv.currentBalance)}</TableCell>
                                            <TableCell className="text-right pr-4">
                                                <Button size="sm" variant="outline" onClick={() => openEditModal(inv)} className="h-8 text-xs font-semibold">
                                                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Withdrawals Management Table */}
            <Card className="shadow-2xs border-gray-200/80 rounded-xl overflow-hidden mt-6">
                <CardHeader className="bg-white border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> Withdrawal Requests
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto w-full">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-xs text-gray-600">Date</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600">Investor</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-right">Requested Amount</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-xs text-gray-600 text-right pr-6">Process Request</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {withdrawals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-400 text-xs">No withdrawal requests found.</TableCell>
                                    </TableRow>
                                ) : (
                                    withdrawals.map((w: any) => (
                                        <TableRow key={w.id} className="hover:bg-gray-50/50">
                                            <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(w.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs text-gray-900">{w.investor.user.name}</span>
                                                    <span className="text-[10px] text-gray-400">{w.method}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-rose-600 tabular-nums">
                                                {money(w.amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold",
                                                    w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                        w.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                                            w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-rose-100 text-rose-700'
                                                )}>
                                                    {w.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                {w.status === 'PENDING' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="outline" disabled={isStatusUpdating} onClick={(e) => handleWithdrawalAction(w.id, 'APPROVED', e)} className="h-7 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                                            <Check className="w-3 h-3 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" disabled={isStatusUpdating} onClick={(e) => handleWithdrawalAction(w.id, 'REJECTED', e)} className="h-7 text-[10px] bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100">
                                                            <X className="w-3 h-3 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : w.status === 'APPROVED' ? (
                                                    <Button size="sm" variant="outline" disabled={isStatusUpdating} onClick={(e) => handleWithdrawalAction(w.id, 'COMPLETED', e)} className="h-7 text-[10px] border-gray-300">
                                                        Mark Completed
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">Processed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Investor Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Edit Investor Profile</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">Updating records for <strong className="text-gray-800">{selectedInvestor?.user?.name}</strong>.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5"><Percent className="h-3.5 w-3.5" /> Profit Share (%)</label>
                            <input type="number" min="0" max="100" step="0.01" value={profitShare} onChange={(e) => setProfitShare(e.target.value)} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Total Capital Invested (৳)</label>
                            <input type="number" min="0" value={totalInvested} onChange={(e) => setTotalInvested(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400" />
                        </div>
                        <div className="space-y-1.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5"><BadgeDollarSign className="h-3.5 w-3.5" /> Available Balance (৳)</label>
                            <input type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="h-10 text-xs">Cancel</Button>
                        <Button type="button" onClick={handleUpdateInvestor} disabled={isUpdating} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}