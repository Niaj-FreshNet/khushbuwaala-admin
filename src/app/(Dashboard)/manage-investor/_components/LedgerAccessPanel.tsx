'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Clock, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useDecideLedgerAccessMutation,
  useGetLedgerAccessRequestsQuery,
  useRevokeLedgerAccessMutation,
} from '@/redux/store/api/investor/investorApi';

const DURATIONS = [
  { value: '2', label: '2 hours' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
];

const when = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

export default function LedgerAccessPanel() {
  const { data, isLoading } = useGetLedgerAccessRequestsQuery();
  const [decide, { isLoading: deciding }] = useDecideLedgerAccessMutation();
  const [revoke, { isLoading: revoking }] = useRevokeLedgerAccessMutation();
  const [hours, setHours] = useState<Record<string, string>>({});
  const all: any[] = data?.data ?? [];
  const pending = all.filter((r) => r.status === 'PENDING');
  const active = all.filter((r) => r.isActive);

  const act = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await decide({ id, status, hours: Number(hours[id] || 24) }).unwrap();
      toast.success(status === 'APPROVED' ? 'Access granted' : 'Request rejected');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not update the request');
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-indigo-600" />
        <div>
          <h2 className="text-sm font-bold text-gray-900">Full-ledger access requests</h2>
          <p className="text-xs text-gray-500">Investors always see summaries. Each full-ledger view needs your approval and expires.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      ) : pending.length === 0 && active.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500">No requests waiting.</p>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{r.user?.name || 'Investor'}</div>
                  <div className="text-xs text-gray-500">Asked {when(r.requestedAt)} · approved {r.approvedThisMonth}× this month</div>
                  {r.reason && <div className="mt-1 text-xs text-gray-700">“{r.reason}”</div>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select value={hours[r.id] || '24'} onValueChange={(v) => setHours((h) => ({ ...h, [r.id]: v }))}>
                  <SelectTrigger className="h-10 w-[7.5rem] bg-white text-xs" aria-label="Access duration"><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" className="h-10 flex-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={deciding} onClick={() => act(r.id, 'APPROVED')}>Approve</Button>
                <Button size="sm" variant="outline" className="h-10 flex-1 text-rose-700" disabled={deciding} onClick={() => act(r.id, 'REJECTED')}>Reject</Button>
              </div>
            </div>
          ))}
          {active.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{r.user?.name || 'Investor'}</div>
                <div className="inline-flex items-center gap-1 text-xs text-emerald-800"><Clock className="h-3 w-3" /> Viewing until {when(r.expiresAt)}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-10 text-xs"
                disabled={revoking}
                onClick={async () => {
                  try { await revoke(r.id).unwrap(); toast.success('Access ended'); } catch (e: any) { toast.error(e?.data?.message || 'Could not end access'); }
                }}
              >
                End now
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
