'use client';

/**
 * Steadfast payouts ("Payments" / "Cleared" in the Steadfast panel), D-026.
 * The backend syncs every 30 minutes: parcels in a PAID payout become Completed + Paid here,
 * returns get the delivery charge the rider collected, and anything that disagrees is listed
 * under "Needs checking" instead of being changed.
 */
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Loader2, RefreshCw, Truck, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatTaka } from '@/lib/money';
import {
  type CourierPayout,
  useGetCourierPayoutsQuery,
  useGetCourierReviewQuery,
  useResolveCourierReviewMutation,
  useSyncCourierMutation,
} from '@/redux/store/api/steadfast/steadfastApi';

const when = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const ago = (d?: string | null) => {
  if (!d) return 'never';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

const PARCEL_LABEL: Record<string, { text: string; cls: string }> = {
  delivered: { text: 'Delivered', cls: 'bg-emerald-100 text-emerald-800' },
  partial_delivered: { text: 'Returned · charge paid', cls: 'bg-amber-100 text-amber-800' },
  cancelled: { text: 'Returned · unpaid', cls: 'bg-rose-100 text-rose-800' },
};
const ORDER_CLS: Record<string, string> = {
  COMPLETED: 'text-emerald-700', DELIVERED: 'text-sky-700', CANCELED: 'text-amber-700', RETURNED: 'text-rose-700', SHIPPED: 'text-violet-700',
};

function PayoutCard({ p }: { p: CourierPayout }) {
  const [open, setOpen] = useState(false);
  const flagged = p.parcels.filter((x) => x.order?.courierReview).length;
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-2xs">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-3 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{p.payoutId}</span>
            <Badge className={cn('text-[10px]', p.statusLabel === 'paid' ? 'bg-emerald-600' : 'bg-amber-500')}>{p.statusLabel === 'paid' ? 'Paid' : p.statusLabel}</Badge>
            {p.method && <Badge variant="outline" className="text-[10px]">{p.method}</Badge>}
            {flagged > 0 && <Badge className="bg-rose-600 text-[10px]">{flagged} to check</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Paid {when(p.paidAt)} · {p.parcelCount} parcels · {p.matchedCount} matched to our orders</p>
          <p className="mt-1 text-[11px] text-gray-600">
            Collected {formatTaka(p.amount)} − charges {formatTaka(p.charges)}{p.dueBills ? ` − due bills ${formatTaka(p.dueBills)}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Received</p>
          <p className="text-base font-black text-emerald-700">{formatTaka(p.total)}</p>
          <ChevronDown className={cn('ml-auto mt-1 h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {p.parcels.map((x) => {
            const lab = PARCEL_LABEL[x.status] || { text: x.status, cls: 'bg-gray-100 text-gray-700' };
            return (
              <div key={x.consignmentId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
                <div className="min-w-0 flex-1 basis-40">
                  {x.order ? (
                    <Link href={`/orders/${x.order.id}`} className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline">
                      #{x.order.invoice} <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-700">{x.invoice ? `#${x.invoice}` : 'No invoice'} <span className="font-normal text-gray-400">(not in our orders)</span></span>
                  )}
                  <span className="ml-2 font-mono text-[10px] text-gray-400">{x.consignmentId}</span>
                </div>
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', lab.cls)}>{lab.text}</span>
                <span className="w-20 text-right font-semibold tabular-nums">{formatTaka(x.codAmount)}</span>
                {x.order && (
                  <span className={cn('w-32 text-right text-[11px] font-semibold', ORDER_CLS[x.order.status] || 'text-gray-600')}>
                    {x.order.status} · {x.order.isPaid ? 'PAID' : 'DUE'}
                  </span>
                )}
                {x.order?.courierReview && (
                  <p className="basis-full rounded bg-rose-50 px-2 py-1 text-[11px] text-rose-800"><AlertTriangle className="mr-1 inline h-3 w-3" />{x.order.courierReview}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CourierPayoutsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetCourierPayoutsQuery({ page, limit: 20 });
  const { data: reviewRes } = useGetCourierReviewQuery();
  const [sync, { isLoading: syncing }] = useSyncCourierMutation();
  const [resolve, { isLoading: resolving }] = useResolveCourierReviewMutation();
  const [lastChanges, setLastChanges] = useState<string[] | null>(null);

  const payouts = data?.data || [];
  const totals = data?.totals || {};
  const review = reviewRes?.data || [];
  const last = data?.lastSync;

  const runSync = async () => {
    try {
      const r = await sync().unwrap();
      const ch = r.data?.changes || [];
      setLastChanges(ch);
      toast.success(ch.length ? `Synced with Steadfast: ${ch.length} update(s)` : 'Synced with Steadfast: everything was up to date');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not reach Steadfast');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 px-3 py-3 text-sm sm:px-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-700"><Truck className="h-5 w-5" /></div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Steadfast payouts</h1>
            <p className="text-xs text-gray-500">
              Money Steadfast has paid us. A parcel in a paid payout becomes <b>Completed + Paid</b> here automatically (every 30 min).
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Last sync: {ago(last?.at)}{last && !last.ok ? ` · failed: ${last.error}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={runSync} disabled={syncing} className="h-10 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 sm:h-9">
          {syncing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          {syncing ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      {lastChanges && lastChanges.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <p className="mb-1 font-bold">Updated in this sync</p>
          <ul className="list-disc space-y-0.5 pl-4">{lastChanges.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}

      {review.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50/60 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <p className="text-sm font-bold text-rose-900">Needs checking ({review.length})</p>
          </div>
          <p className="px-3 pt-2 text-[11px] text-gray-500">Steadfast and our order disagree. Nothing was changed for these: open the order, fix it if needed, then press Checked.</p>
          <div className="divide-y divide-gray-100">
            {review.map((o) => (
              <div key={o.id} className="flex flex-wrap items-start gap-2 p-3 text-xs">
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={`/orders/${o.id}`} className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline">
                    #{o.invoice} <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span className="ml-2 text-gray-500">{o.name || ''} · {o.status} · {o.isPaid ? 'PAID' : 'DUE'} · {formatTaka(o.amount)}</span>
                  <p className="mt-1 text-rose-800">{o.courierReview}</p>
                </div>
                <Button variant="outline" size="sm" className="h-9 text-xs" disabled={resolving} onClick={() => resolve(o.id).unwrap().then(() => toast.success(`#${o.invoice} marked as checked`)).catch(() => toast.error('Could not save'))}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Checked
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ['Collected from customers', totals.amount, 'text-gray-900'],
          ['Steadfast charges', totals.charges, 'text-rose-700'],
          ['Due bills deducted', totals.dueBills, 'text-rose-700'],
          ['Received by us', totals.total, 'text-emerald-700'],
        ].map(([label, v, cls]) => (
          <div key={label as string} className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label as string}</p>
            {isLoading ? <Skeleton className="mt-1 h-5 w-20" /> : <p className={cn('text-base font-black tabular-nums', cls as string)}>{formatTaka(v)}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <Wallet className="h-4 w-4" /> {data?.meta.total ?? 0} payouts · {totals.parcelCount ?? 0} parcels {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No payouts yet. Press <b>Sync now</b> to load them from Steadfast.
        </div>
      ) : (
        <div className="space-y-2">{payouts.map((p) => <PayoutCard key={p.id} p={p} />)}</div>
      )}

      {data && data.meta.totalPage > 1 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <Button variant="outline" size="sm" className="h-10 sm:h-8" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>Newer</Button>
          <span className="text-xs text-gray-500">Page {page} of {data.meta.totalPage}</span>
          <Button variant="outline" size="sm" className="h-10 sm:h-8" disabled={page >= data.meta.totalPage} onClick={() => setPage((x) => x + 1)}>Older</Button>
        </div>
      )}
    </div>
  );
}
