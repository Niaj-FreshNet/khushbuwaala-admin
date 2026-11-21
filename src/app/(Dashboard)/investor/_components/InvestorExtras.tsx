'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, Clock, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetMyLedgerAccessQuery, useRequestLedgerAccessMutation } from '@/redux/store/api/investor/investorApi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const money = (v: unknown) => `৳${Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
const when = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

/** Profit credited to this investor, month by month (after Super Admin approval). */
export function MonthlyProfitHistory({ items }: { items: any[] }) {
  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-stone-900">Profit credited by month</h3>
      <p className="mb-3 text-xs text-stone-500">Your % of the company&apos;s net profit after all expenses, added after the month is approved.</p>
      {items.length === 0 ? (
        <p className="rounded-lg bg-stone-50 p-3 text-center text-sm text-stone-500">No months credited yet.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
              <div>
                <div className="text-sm font-semibold text-stone-900">{MONTHS[p.month - 1]} {p.year}</div>
                <div className="text-[11px] text-stone-500">
                  Company profit {money(p.companyNetProfit)}{p.sharePercentage != null ? ` × ${p.sharePercentage}%` : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-emerald-700">{money(p.shareAmount)}</div>
                {p.isDistributed ? (
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Credited</div>
                ) : (
                  <div className="text-[11px] text-amber-700">Awaiting approval</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Request / open the full company ledger (needs Super Admin approval each time). */
export function LedgerAccessCard() {
  const { data, isLoading } = useGetMyLedgerAccessQuery(undefined, { pollingInterval: 60_000 });
  const [requestAccess, { isLoading: sending }] = useRequestLedgerAccessMutation();
  const s = data?.data;

  const ask = async () => {
    try {
      await requestAccess({}).unwrap();
      toast.success('Request sent. You will be able to open the ledger once it is approved.');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not send the request');
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-stone-900">Full company ledger</h3>
      </div>
      <p className="mb-3 text-xs text-stone-500">Summaries are always available. Viewing every transaction needs approval from the Super Admin and is open for a limited time.</p>
      {isLoading ? (
        <div className="flex items-center text-sm text-stone-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</div>
      ) : s?.hasAccess ? (
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Clock className="h-4 w-4" /> Open until {when(s.expiresAt)}</p>
          <Link href="/finance?tab=ledger" className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
            Open the ledger
          </Link>
        </div>
      ) : s?.pendingRequest ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Request sent {when(s.pendingRequest.requestedAt)}. Waiting for approval.</p>
      ) : (
        <Button onClick={ask} disabled={sending} className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700">
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Request access
        </Button>
      )}
      {s && <p className="mt-2 text-[11px] text-stone-400">Approved {s.approvedThisMonth}× this month.</p>}
    </section>
  );
}
