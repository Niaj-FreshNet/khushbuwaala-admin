'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApproveProfitMonthMutation, useGetProfitPreviewQuery } from '@/redux/store/api/investor/investorApi';
import { cn } from '@/lib/utils';

const money = (v: unknown) => `৳${Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Default to last month: the latest month that can be approved.
const lastMonth = () => {
  const d = new Date(Date.now() + 6 * 3600 * 1000); // Dhaka
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth(); // previous month, 1-based
  if (m === 0) { m = 12; y -= 1; }
  return { y, m };
};

export default function ProfitDistributionPanel() {
  const init = useMemo(lastMonth, []);
  const [year, setYear] = useState(init.y);
  const [month, setMonth] = useState(init.m);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, isFetching, isError } = useGetProfitPreviewQuery({ year, month });
  const [approve, { isLoading: approving }] = useApproveProfitMonthMutation();
  const p = data?.data;

  const shift = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  };

  const pendingTotal = (p?.investors || []).filter((r: any) => !r.credited).reduce((s: number, r: any) => s + r.proposedShare, 0);

  const doApprove = async () => {
    try {
      const res = await approve({ year, month }).unwrap();
      toast.success(res?.message || 'Profit credited');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not approve this month');
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Monthly profit share</h2>
          <p className="text-xs text-gray-500">Net profit after all expenses × each investor&apos;s %. Credited only when you approve.</p>
        </div>
        <div className="flex items-center rounded-lg border border-gray-200">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-[8.5rem] text-center text-sm font-semibold">{MONTHS[month - 1]} {year}</span>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {isFetching && !p ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating…</div>
      ) : isError || !p ? (
        <p className="py-6 text-center text-sm text-rose-600">Could not load this month.</p>
      ) : (
        <>
          <div className={cn('mb-3 flex items-center justify-between rounded-lg p-3', p.isLoss ? 'bg-rose-50' : 'bg-emerald-50')}>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Company net profit</div>
              <div className={cn('text-xl font-black tabular-nums', p.isLoss ? 'text-rose-700' : 'text-emerald-700')}>{money(p.companyNetProfit)}</div>
              {p.isLoss && <div className="text-[11px] text-rose-700">Loss month: investors receive ৳0 (no carry-forward).</div>}
            </div>
            {p.isLoss ? <TrendingDown className="h-6 w-6 text-rose-500" /> : <TrendingUp className="h-6 w-6 text-emerald-600" />}
          </div>

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            {p.investors.map((r: any) => (
              <li key={r.investorId} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.sharePercentage}% share</div>
                </div>
                <div className="text-right">
                  {r.credited ? (
                    <>
                      <div className="text-sm font-bold tabular-nums text-emerald-700">{money(r.credited.amount)}</div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Credited</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold tabular-nums text-gray-900">{money(r.proposedShare)}</div>
                      <div className="text-[11px] text-amber-700">Waiting for approval</div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            {p.allCredited ? (
              <p className="rounded-lg bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">All investors have been credited for this month.</p>
            ) : !p.isClosed ? (
              <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-800">This month isn&apos;t finished yet. You can approve it from the 1st of next month.</p>
            ) : (
              <Button className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={approving} onClick={() => setConfirmOpen(true)}>
                {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Approve &amp; credit {money(pendingTotal)}
              </Button>
            )}
          </div>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Credit {MONTHS[month - 1]} {year} profit?</AlertDialogTitle>
            <AlertDialogDescription>
              {money(pendingTotal)} will be added to investors&apos; available balances, based on a company net profit of {money(p?.companyNetProfit)}.
              Each investor can only be credited once per month.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-11 bg-emerald-600 hover:bg-emerald-700 sm:h-9" onClick={doApprove}>Approve &amp; credit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
