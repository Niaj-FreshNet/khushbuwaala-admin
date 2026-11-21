"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, Edit, Percent, Wallet, BadgeDollarSign, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
    useGetAllInvestorsQuery,
    useUpdateInvestorMutation,
    useGetAllWithdrawalsQuery,
    useUpdateWithdrawalStatusMutation
} from "@/redux/store/api/investor/investorApi";
import { cn } from "@/lib/utils";
import ProfitDistributionPanel from "./_components/ProfitDistributionPanel";
import LedgerAccessPanel from "./_components/LedgerAccessPanel";

const money = (v: any) => `৳${Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

type WithdrawalAction = { id: string; status: 'APPROVED' | 'REJECTED' | 'COMPLETED'; name: string; amount: number };
const ACTION_TEXT: Record<WithdrawalAction['status'], string> = {
    APPROVED: 'Approve and deduct from balance',
    REJECTED: 'Reject (balance stays the same)',
    COMPLETED: 'Mark as paid out',
};

export default function ManageInvestorsPage() {
    const { data: res, isLoading, refetch } = useGetAllInvestorsQuery(undefined);
    const { data: withdrawRes, isLoading: loadingWithdrawals } = useGetAllWithdrawalsQuery(undefined);
    const [updateInvestor, { isLoading: isUpdating }] = useUpdateInvestorMutation();
    const [updateWithdrawalStatus, { isLoading: isStatusUpdating }] = useUpdateWithdrawalStatusMutation();

    const investors = res?.data || [];
    const withdrawals = withdrawRes?.data || [];

    // Edit investor
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
    const [profitShare, setProfitShare] = useState("");
    const [totalInvested, setTotalInvested] = useState("");
    const [currentBalance, setCurrentBalance] = useState("");

    // Withdrawal confirmation
    const [pendingAction, setPendingAction] = useState<WithdrawalAction | null>(null);

    const openEditModal = (investor: any) => {
        setSelectedInvestor(investor);
        setProfitShare(String(investor.profitSharePercentage || 0));
        setTotalInvested(String(investor.totalInvested || 0));
        setCurrentBalance(String(investor.currentBalance || 0));
        setEditModalOpen(true);
    };

    const handleUpdateInvestor = async () => {
        if (!selectedInvestor) return;
        const pct = Number(profitShare);
        if (!(pct >= 0 && pct <= 100)) {
            toast.error("Profit share must be between 0 and 100%.");
            return;
        }
        try {
            await updateInvestor({
                id: selectedInvestor.id,
                data: { profitSharePercentage: pct, totalInvested: Number(totalInvested), currentBalance: Number(currentBalance) },
            }).unwrap();
            toast.success(`${selectedInvestor.user.name}'s data updated`);
            setEditModalOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update investor data.");
        }
    };

    const confirmWithdrawalAction = async () => {
        if (!pendingAction) return;
        try {
            await updateWithdrawalStatus({ id: pendingAction.id, data: { status: pendingAction.status } }).unwrap();
            toast.success(`Withdrawal marked as ${pendingAction.status.toLowerCase()}`);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to process withdrawal");
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-4 p-2 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">Manage Investors</h1>
                    <p className="text-xs text-gray-500">Profit shares, ledger access, balances and payouts.</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ProfitDistributionPanel />
                <LedgerAccessPanel />
            </div>

            {/* Investors */}
            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:p-4">
                <h2 className="mb-3 text-sm font-bold text-gray-900">Investors</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
                ) : investors.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">No investors yet. Assign the Investor role in Manage Roles.</p>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {investors.map((inv: any) => (
                            <div key={inv.id} className="rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-bold text-gray-900">{inv.user.name}</div>
                                        <div className="truncate text-xs text-gray-500">{inv.user.email}</div>
                                    </div>
                                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{inv.profitSharePercentage}%</span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div><div className="text-[10px] font-semibold uppercase text-gray-400">Invested</div><div className="font-bold text-gray-800">{money(inv.totalInvested)}</div></div>
                                    <div><div className="text-[10px] font-semibold uppercase text-gray-400">Available</div><div className="font-black text-emerald-700">{money(inv.currentBalance)}</div></div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => openEditModal(inv)} className="mt-2 h-10 w-full text-xs font-semibold">
                                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit share / capital
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Withdrawals */}
            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900"><CreditCard className="h-4 w-4 text-emerald-600" /> Withdrawal requests</h2>
                {loadingWithdrawals ? (
                    <div className="flex items-center justify-center py-8 text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
                ) : withdrawals.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">No withdrawal requests.</p>
                ) : (
                    <ul className="space-y-2">
                        {withdrawals.map((w: any) => (
                            <li key={w.id} className="rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-gray-900">{w.investor.user.name}</div>
                                        <div className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {w.method || '—'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black tabular-nums text-rose-600">{money(w.amount)}</div>
                                        <span className={cn("inline-block rounded px-2 py-0.5 text-[10px] font-bold",
                                            w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                w.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                                    w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        )}>{w.status}</span>
                                    </div>
                                </div>
                                {w.status === 'PENDING' && (
                                    <div className="mt-2 flex gap-2">
                                        <Button size="sm" disabled={isStatusUpdating} onClick={() => setPendingAction({ id: w.id, status: 'APPROVED', name: w.investor.user.name, amount: w.amount })} className="h-10 flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                                            <Check className="mr-1 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={isStatusUpdating} onClick={() => setPendingAction({ id: w.id, status: 'REJECTED', name: w.investor.user.name, amount: w.amount })} className="h-10 flex-1 text-rose-700">
                                            <X className="mr-1 h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                )}
                                {w.status === 'APPROVED' && (
                                    <Button size="sm" variant="outline" disabled={isStatusUpdating} onClick={() => setPendingAction({ id: w.id, status: 'COMPLETED', name: w.investor.user.name, amount: w.amount })} className="mt-2 h-10 w-full">
                                        Mark as paid out
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Withdrawal confirmation */}
            <AlertDialog open={!!pendingAction} onOpenChange={(o) => { if (!o) setPendingAction(null); }}>
                <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{pendingAction ? ACTION_TEXT[pendingAction.status] : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction?.name} · {money(pendingAction?.amount)}
                            {pendingAction?.status === 'APPROVED' && ' will be deducted from their available balance now.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-11 sm:h-9">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="h-11 sm:h-9" onClick={confirmWithdrawalAction}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit investor */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Edit investor</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">Updating <strong className="text-gray-800">{selectedInvestor?.user?.name}</strong>. Monthly profit is credited automatically when you approve a month; only change the balance here to correct a mistake.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-blue-900"><Percent className="h-3.5 w-3.5" /> Profit share (%)</label>
                            <input type="number" inputMode="decimal" min="0" max="100" step="0.01" value={profitShare} onChange={(e) => setProfitShare(e.target.value)} className="h-11 w-full rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><Wallet className="h-3.5 w-3.5" /> Capital invested (৳)</label>
                            <input type="number" inputMode="decimal" min="0" value={totalInvested} onChange={(e) => setTotalInvested(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400" />
                        </div>
                        <div className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-900"><BadgeDollarSign className="h-3.5 w-3.5" /> Available balance (৳), correction only</label>
                            <input type="number" inputMode="decimal" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} className="h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="h-11 text-xs sm:h-10">Cancel</Button>
                        <Button type="button" onClick={handleUpdateInvestor} disabled={isUpdating} className="h-11 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 sm:h-10">
                            {isUpdating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
