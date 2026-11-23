'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, Package, Calendar, Loader2,
    RefreshCw, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, BarChart3,
    FileSpreadsheet, Printer, Download, Search, X, ChevronLeft, ChevronRight, Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetFinancialSummaryQuery, useGetLedgerQuery, useBackfillHistoricalCostsMutation } from '@/redux/store/api/finance/financeApi';
import type { FinanceBreakdown, FinanceMetrics } from '@/redux/store/api/finance/financeApi';
import { toast } from 'sonner';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { LedgerAccessCard } from '../../investor/_components/InvestorExtras';
import { formatTaka } from '@/lib/money';
import { apiErrorMessage, apiErrorStatus } from "@/lib/apiError";

/* =========================================================================
   Types & Utilities
   ========================================================================= */

// Partial: the summary is empty while it loads
type Metrics = Partial<FinanceMetrics>;
type Breakdown = Partial<FinanceBreakdown>;
type CashTotals = { credits: number; debits: number; net: number };
interface LedgerRow {
    id: string; ts: number; date: string; reference: string; description: string;
    source: string; method: string; type: 'CREDIT' | 'DEBIT'; amount: number; balance: number;
}

type TabId = 'overview' | 'ledger';
type Preset = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

const TZ = 'Asia/Dhaka';

const n = (v: unknown): number => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const money = (v: unknown) => formatTaka(n(v));
const pct = (v: unknown) => `${n(v).toFixed(1)}%`;

const todayYmd = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const parseYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmtYmd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, k: number) => { const d = parseYmd(s); d.setUTCDate(d.getUTCDate() + k); return fmtYmd(d); };
const monthStart = (s: string, offset = 0) => { const d = parseYmd(s); return fmtYmd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1))); };
const monthEnd = (s: string, offset = 0) => { const d = parseYmd(s); return fmtYmd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset + 1, 0))); };
const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000);
const labelYmd = (s: string) => s ? parseYmd(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
const fmtDate = (d: unknown) => new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
const fmtTime = (d: unknown) => new Date(d as string).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });

const PRESETS: { id: Exclude<Preset, 'CUSTOM'>; label: string }[] = [
    { id: 'TODAY', label: 'Today' }, { id: 'LAST_7_DAYS', label: '7 Days' },
    { id: 'THIS_MONTH', label: 'This Month' }, { id: 'LAST_MONTH', label: 'Last Month' },
    { id: 'LAST_3_MONTHS', label: '3 Months' }, { id: 'THIS_YEAR', label: 'This Year' },
];
const PRESET_IDS = PRESETS.map((p) => p.id) as string[];

const rangeForPreset = (preset: Exclude<Preset, 'CUSTOM'>) => {
    const t = todayYmd();
    switch (preset) {
        case 'TODAY': return { start: t, end: t };
        case 'LAST_7_DAYS': return { start: addDays(t, -6), end: t };
        case 'LAST_30_DAYS': return { start: addDays(t, -29), end: t };
        case 'LAST_MONTH': return { start: monthStart(t, -1), end: monthEnd(t, -1) };
        case 'LAST_3_MONTHS': return { start: monthStart(t, -2), end: t };
        case 'THIS_YEAR': return { start: `${t.slice(0, 4)}-01-01`, end: t };
        case 'THIS_MONTH': default: return { start: monthStart(t, 0), end: t };
    }
};

/** Credits, debits and their difference for a list of ledger rows */
const sumCash = (rows: LedgerRow[]): CashTotals => {
    let credits = 0, debits = 0;
    for (const r of rows) {
        if (r.type === 'CREDIT') credits += r.amount;
        else debits += r.amount;
    }
    return { credits, debits, net: credits - debits };
};

/** Download rows as a CSV file (opens in Excel / Google Sheets) */
const downloadLedgerCsv = (rows: LedgerRow[], fileName: string) => {
    const cell = (v: string | number) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Date', 'Time', 'Reference', 'Description', 'Source', 'Method', 'Debit (out)', 'Credit (in)', 'Running balance'];
    const lines = rows.map((r) => [
        fmtDate(r.date), fmtTime(r.date), r.reference, r.description, r.source, r.method,
        r.type === 'DEBIT' ? r.amount : '', r.type === 'CREDIT' ? r.amount : '', r.balance,
    ].map(cell).join(','));
    // The BOM makes Excel read ৳ and Bangla text correctly
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

/* =========================================================================
   UI Components
   ========================================================================= */

const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-md bg-stone-200/80', className)} />;

function Delta({ cur, prev, invert = false, loading }: { cur: number; prev: number; invert?: boolean; loading: boolean }) {
    if (loading) return <Skeleton className="h-3 w-16 mt-1" />;
    if (!prev) return <span className="text-[10px] text-stone-400 mt-1 block">No prior data</span>;
    const ch = ((cur - prev) / Math.abs(prev)) * 100;
    const good = invert ? ch <= 0 : ch >= 0;
    const shown = Math.abs(ch) > 999 ? '>999%' : `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`;
    return (
        <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold mt-1', good ? 'text-emerald-600' : 'text-rose-600')}>
            {ch >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {shown} <span className="font-normal text-stone-400 ml-0.5">vs prev</span>
        </span>
    );
}

function KpiCard(props: { title: string; value: string; icon: React.ReactNode; accent: string; iconBg: string; valueClass?: string; footerLabel: string; footerValue: React.ReactNode; delta?: React.ReactNode; loading: boolean; }) {
    return (
        <Card className="relative overflow-hidden rounded-2xl border-stone-200/60 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className={cn('absolute left-0 top-0 h-full w-1', props.accent)} />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 pt-4 px-4">
                <div>
                    <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{props.title}</CardTitle>
                    {props.loading ? <Skeleton className="h-7 w-24 mt-2" /> : <div className={cn('mt-1.5 truncate text-2xl font-black tracking-tight text-stone-900', props.valueClass)}>{props.value}</div>}
                    {props.delta && <div>{props.delta}</div>}
                </div>
                <div className={cn('rounded-xl p-2.5', props.iconBg)}>{props.icon}</div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-2">
                <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                    <span>{props.footerLabel}</span>
                    <span className="font-bold text-stone-800">{props.loading ? <Skeleton className="h-3 w-8" /> : props.footerValue}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function StatementRow({ label, value, loading, indent, tone = 'muted', strong, hint }: { label: string; value: number; loading: boolean; indent?: boolean; tone?: 'minus' | 'total' | 'muted'; strong?: boolean; hint?: string; }) {
    const color = tone === 'minus' ? 'text-rose-600' : tone === 'total' ? (value >= 0 ? 'text-emerald-700' : 'text-rose-600') : 'text-stone-900';
    return (
        <div className={cn('flex items-center justify-between py-2 text-[13px]', indent && 'pl-4 text-xs text-stone-500', strong && 'border-t border-stone-200/60 font-bold text-sm mt-1 pt-3')}>
            <span className={cn('min-w-0', strong ? 'text-stone-900' : 'text-stone-600')} title={hint}>{label}</span>
            {loading ? <Skeleton className="h-4 w-16" /> : (
                <span className={cn('shrink-0 font-semibold tabular-nums', color)}>
                    {tone === 'minus' && value > 0 ? '−' : ''}{money(value)}
                </span>
            )}
        </div>
    );
}

function Notice({ tone, children }: { tone: 'amber' | 'blue' | 'rose'; children: React.ReactNode }) {
    const styles = { amber: 'border-amber-200 bg-amber-50 text-amber-900', blue: 'border-blue-200 bg-blue-50 text-blue-900', rose: 'border-rose-200 bg-rose-50 text-rose-800' }[tone];
    return (
        <div className={cn('flex items-start gap-2 rounded-xl border p-3 text-xs shadow-sm', styles)}>
            {tone === 'blue' ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div className="min-w-0">{children}</div>
        </div>
    );
}

/* =========================================================================
   OVERVIEW TAB
   ========================================================================= */

interface OverviewTabProps {
    m: Metrics; b: Breakdown; pm?: Metrics;
    loading: boolean; prevLoading: boolean; isError: boolean; onRetry: () => void; rangeValid: boolean;
    cash: CashTotals; cashLoading: boolean; cashLocked: boolean;
}

function OverviewTab({ m, b, pm, loading, prevLoading, isError, onRetry, rangeValid, cash, cashLoading, cashLocked }: OverviewTabProps) {
    const v = useMemo(() => {
        const revenue = n(m.totalRevenue);
        const cogs = n(m.totalCOGS);
        const fulfillment = n(m.totalFulfillmentCosts);
        const opex = n(m.totalOperatingExpenses);
        const net = n(m.netProfit);
        const orders = n(b.orderCount);
        const liquid = n(b.totalLiquidCost);
        const packaging = n(b.totalPackagingCost);
        return {
            revenue, cogs, fulfillment, opex, net, orders, liquid, packaging,
            gross: n(m.grossProfit), grossMargin: n(m.grossMarginPercentage), netMargin: n(m.netMarginPercentage),
            avgOrderValue: orders > 0 ? revenue / orders : 0, avgProfitPerOrder: orders > 0 ? net / orders : 0,
            missingItems: n(b.missingCostItemCount), missingOrders: n(b.missingCostOrderCount), unsynced: n(b.unsyncedOrderCount),
            costAdjustment: cogs - liquid - packaging,
            netGap: revenue - cogs - fulfillment - opex - net, revenueGap: n(m.grossSales) - n(m.totalOrderDiscounts) - revenue,
        };
    }, [m, b]);

    const hasData = v.orders > 0 || v.opex > 0 || n(m.totalInventoryInvestment) > 0;
    const netPositive = v.net >= 0;
    const mismatch = !loading && (Math.abs(v.netGap) > 1 || Math.abs(v.revenueGap) > 1);

    const bar = useMemo(() => {
        const profit = Math.max(0, v.net);
        const total = v.cogs + v.fulfillment + v.opex + profit;
        if (total <= 0) return [];
        return [
            { key: 'COGS', value: v.cogs, color: 'bg-orange-500' },
            { key: 'Fulfillment', value: v.fulfillment, color: 'bg-amber-400' },
            { key: 'Expenses', value: v.opex, color: 'bg-rose-500' },
            { key: 'Net Profit', value: profit, color: 'bg-emerald-500' },
        ].map((s) => ({ ...s, width: (s.value / total) * 100 }));
    }, [v]);

    if (isError && rangeValid) {
        return (
            <Notice tone="rose">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>Could not load the financial summary.</span>
                    <Button size="sm" variant="outline" className="h-7 w-fit border-rose-300 bg-white text-xs text-rose-700" onClick={onRetry}>Try again</Button>
                </div>
            </Notice>
        );
    }

    return (
        <div className="space-y-4">
            {/* Integrity Warnings */}
            {!loading && (v.missingItems > 0 || v.unsynced > 0 || mismatch) && (
                <div className="space-y-2">
                    {v.missingItems > 0 && (
                        <Notice tone="amber">
                            <b>{v.missingOrders}</b> order{v.missingOrders === 1 ? '' : 's'} sold without cost records. Use <b>Sync Orders</b> to repair financial integrity.
                        </Notice>
                    )}
                    {v.unsynced > 0 && (
                        <Notice tone="blue">
                            <b>{v.unsynced}</b> order{v.unsynced === 1 ? ' is' : 's are'} missing from the ledger. Use <b>Sync Orders</b>.
                        </Notice>
                    )}
                    {mismatch && (
                        <Notice tone="amber">Net gap {money(v.netGap)} detected in reconciliation calculations.</Notice>
                    )}
                </div>
            )}

            {/* Core KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Net Revenue" value={money(v.revenue)} loading={loading}
                    accent="bg-emerald-500" iconBg="bg-emerald-50 text-emerald-600" icon={<DollarSign className="h-5 w-5" />}
                    delta={<Delta cur={v.revenue} prev={n(pm?.totalRevenue)} loading={prevLoading} />}
                    footerLabel="Valid Orders" footerValue={v.orders}
                />
                <KpiCard
                    title="Cost of Goods (COGS)" value={money(v.cogs)} loading={loading}
                    accent="bg-orange-500" iconBg="bg-orange-50 text-orange-600" icon={<Package className="h-5 w-5" />}
                    delta={<Delta cur={v.cogs} prev={n(pm?.totalCOGS)} invert loading={prevLoading} />}
                    footerLabel="COGS Ratio" footerValue={v.revenue > 0 ? pct((v.cogs / v.revenue) * 100) : '—'}
                />
                <KpiCard
                    title="Gross Profit" value={money(v.gross)} loading={loading}
                    accent="bg-blue-500" iconBg="bg-blue-50 text-blue-600" icon={<TrendingUp className="h-5 w-5" />}
                    valueClass={v.gross < 0 ? 'text-rose-600' : 'text-blue-700'}
                    delta={<Delta cur={v.gross} prev={n(pm?.grossProfit)} loading={prevLoading} />}
                    footerLabel="Gross Margin" footerValue={<span className={v.grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{pct(v.grossMargin)}</span>}
                />
                <KpiCard
                    title="Net Profit" value={money(v.net)} loading={loading}
                    accent={netPositive ? 'bg-emerald-600' : 'bg-rose-600'}
                    iconBg={netPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                    valueClass={netPositive ? 'text-emerald-700' : 'text-rose-600'}
                    icon={netPositive ? <Wallet className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    delta={<Delta cur={v.net} prev={n(pm?.netProfit)} loading={prevLoading} />}
                    footerLabel="Net Margin" footerValue={<span className={netPositive ? 'text-emerald-700' : 'text-rose-600'}>{pct(v.netMargin)}</span>}
                />
            </div>

            {!loading && rangeValid && !hasData && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 p-12 text-center text-sm font-medium text-stone-500">
                    No financial activity recorded in this period.
                </div>
            )}

            {/* Income Statement & Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm lg:col-span-2">
                    <CardHeader className="border-b border-stone-100 pb-4 pt-5 px-6">
                        <CardTitle className="text-sm font-bold text-stone-900">Profit & Loss Statement</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-stone-50 px-6 py-2">
                        <StatementRow label="Gross sales (pre-discount)" value={n(m.grossSales)} loading={loading} />
                        <StatementRow label="Order discounts applied" value={n(m.totalOrderDiscounts)} loading={loading} tone="minus" indent />
                        <StatementRow label="Net Revenue" value={v.revenue} loading={loading} strong />

                        <StatementRow label="Liquid cost" value={v.liquid} loading={loading} tone="minus" indent />
                        <StatementRow label="Packaging cost" value={v.packaging} loading={loading} tone="minus" indent />
                        {Math.abs(v.costAdjustment) >= 1 && (
                            <StatementRow label="Manual cost overrides" value={v.costAdjustment} loading={loading} tone="minus" indent />
                        )}
                        <StatementRow label="Gross Profit" value={v.gross} loading={loading} tone="total" strong />

                        <StatementRow label="Courier fees on returned parcels" value={n(m.returnedCourierLoss)} loading={loading} tone="minus" indent hint="Parcels that came back: cancelled (delivery charge paid) and returned (unpaid)" />
                        {n(m.returnChargesCollected) > 0 && (
                            <StatementRow label="+ Delivery charges paid on returns" value={n(m.returnChargesCollected)} loading={loading} indent hint="What customers paid the rider when they refused the parcel; it offsets the courier fees" />
                        )}
                        <StatementRow label="Free-shipping courier subsidy" value={n(m.freeShippingCourierCost)} loading={loading} tone="minus" indent />
                        <StatementRow label="COD collection fees (1%)" value={n(m.codFees)} loading={loading} tone="minus" indent />
                        <StatementRow label={`Operating expenses (${n(b.expenseCount)})`} value={v.opex} loading={loading} tone="minus" indent />
                        <StatementRow label="Company Net Profit" value={v.net} loading={loading} tone="total" strong />
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm">
                        <CardHeader className="border-b border-stone-100 pb-4 pt-5 px-6">
                            <CardTitle className="text-sm font-bold text-stone-900">Revenue Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-5">
                            {loading ? <Skeleton className="h-4 w-full" /> : bar.length === 0 ? (
                                <p className="text-xs text-stone-400 text-center py-2">Insufficient data to generate chart.</p>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-stone-100">
                                        {bar.map((s) => <div key={s.key} className={s.color} style={{ width: `${s.width}%` }} title={s.key} />)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
                                        {bar.map((s) => (
                                            <div key={s.key} className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1.5 text-stone-500 font-medium"><span className={cn('h-2 w-2 rounded-full', s.color)} /> {s.key}</span>
                                                <span className="font-bold tabular-nums text-stone-900">{pct(s.width)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {!netPositive && <p className="text-[11px] font-medium text-rose-600 pt-2 border-t border-stone-100">Warning: Business operating at a loss in this period.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm">
                        <CardHeader className="border-b border-stone-100 pb-4 pt-5 px-6">
                            <CardTitle className="text-sm font-bold text-stone-900">Per-Order Averages</CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 py-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center"><span className="text-stone-500">Avg. Order Value</span>
                                {loading ? <Skeleton className="h-4 w-16" /> : <span className="font-bold tabular-nums text-stone-900">{money(v.avgOrderValue)}</span>}</div>
                            <div className="flex justify-between items-center"><span className="text-stone-500">Avg. Profit / Order</span>
                                {loading ? <Skeleton className="h-4 w-16" /> : <span className={cn('font-bold tabular-nums', v.avgProfitPerOrder >= 0 ? 'text-emerald-700' : 'text-rose-600')}>{money(v.avgProfitPerOrder)}</span>}</div>
                            <div className="flex justify-between items-center"><span className="text-stone-500" title="Parcels that came back from the courier (returned unpaid + cancelled with the delivery charge paid)">Parcels returned</span>
                                {loading ? <Skeleton className="h-4 w-8" /> : <span className="font-bold tabular-nums text-stone-900">{n(b.courierReturnCount ?? b.returnedCount)}</span>}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cash Flow & Capital View */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm">
                    <CardHeader className="border-b border-stone-100 pb-3 pt-4 px-5">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider"><Banknote className="h-4 w-4 text-emerald-600" /> Cash Flow (Ledger)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-3 space-y-2 text-xs">
                        {cashLocked ? (
                            <p className="text-stone-500">Cash flow comes from the full ledger. Request ledger access to see it.</p>
                        ) : (<>
                        <div className="flex justify-between"><span className="text-stone-500 font-medium">Money In</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className="font-bold tabular-nums text-emerald-600">+{money(cash.credits)}</span>}</div>
                        <div className="flex justify-between"><span className="text-stone-500 font-medium">Money Out</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className="font-bold tabular-nums text-rose-600">−{money(cash.debits)}</span>}</div>
                        <div className="flex justify-between border-t border-stone-100 pt-2"><span className="font-bold text-stone-900">Net Cash</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className={cn('font-black tabular-nums', cash.net >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{money(cash.net)}</span>}</div>
                        </>)}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm">
                    <CardHeader className="border-b border-stone-100 pb-3 pt-4 px-5">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Stock Purchased</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4 space-y-1">
                        {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-black tabular-nums text-blue-700 tracking-tight">{money(m.totalInventoryInvestment)}</div>}
                        <p className="text-[10px] leading-snug text-stone-400">Cash spent on raw materials. Not factored into P&L until sold.</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm">
                    <CardHeader className="border-b border-stone-100 pb-3 pt-4 px-5">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Shipping Collected</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4 space-y-1">
                        {loading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-black tabular-nums text-amber-700 tracking-tight">{money(m.totalShippingCollected)}</div>}
                        <p className="text-[10px] leading-snug text-stone-400">Delivery fees paid by customers. Passed strictly to courier.</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-stone-200/60 bg-stone-50 shadow-sm border-dashed">
                    <CardContent className="p-5 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2 text-stone-800 font-bold text-sm mb-2"><Info className="h-4 w-4 text-stone-400" /> Profit vs Cash</div>
                        <p className="text-xs leading-relaxed text-stone-500">
                            <b>Profit</b> is business earned. <b>Cash</b> is liquidity. Buying stock lowers cash today, but only lowers profit when sold. Unpaid orders raise profit, but not cash.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* =========================================================================
   LEDGER TAB
   ========================================================================= */

interface LedgerTabProps {
    rows: LedgerRow[]; loading: boolean; isError: boolean; onRetry: () => void; range: { start: string; end: string };
}

const PAGE_SIZE = 50;

function LedgerTab({ rows, loading, isError, onRetry, range }: LedgerTabProps) {
    const [type, setType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
    const [source, setSource] = useState('ALL');
    const [q, setQ] = useState('');
    const pageSize = PAGE_SIZE;
    const [page, setPage] = useState(1);

    const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source))).sort(), [rows]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return rows.filter((r) =>
            (type === 'ALL' || r.type === type) &&
            (source === 'ALL' || r.source === source) &&
            (!needle || `${r.reference} ${r.description} ${r.source}`.toLowerCase().includes(needle)),
        ); // Keeping it naturally sorted DATE_DESC from backend
    }, [rows, type, source, q]);

    const totals = useMemo(() => sumCash(filtered), [filtered]);

    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pages);
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
    const upd = <T,>(setter: (v: T) => void) => (val: T) => { setter(val); setPage(1); };

    if (isError) return (
        <Notice tone="rose">
            <div className="flex items-center justify-between">
                <span>Failed to retrieve ledger data.</span>
                <Button size="sm" variant="outline" className="h-7 border-rose-300 bg-white text-xs" onClick={onRetry}>Try again</Button>
            </div>
        </Notice>
    );

    return (
        <div className="space-y-4">
            {/* Totals */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700"><ArrowDownRight className="h-4 w-4" /> Credits (In)</p>
                    {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1.5 truncate text-2xl font-black tabular-nums text-emerald-700">{money(totals.credits)}</p>}
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700"><ArrowUpRight className="h-4 w-4" /> Debits (Out)</p>
                    {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1.5 truncate text-2xl font-black tabular-nums text-rose-700">{money(totals.debits)}</p>}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Net Cash Flow</p>
                    {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className={cn('mt-1.5 truncate text-2xl font-black tabular-nums', totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{totals.net >= 0 ? '+' : ''}{money(totals.net)}</p>}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Transactions</p>
                    {loading ? <Skeleton className="mt-2 h-7 w-16" /> : <p className="mt-1.5 text-2xl font-black tabular-nums text-stone-900">{filtered.length}<span className="text-sm font-semibold text-stone-400"> / {rows.length}</span></p>}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center print:hidden">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        placeholder="Search ref, desc..."
                        className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-8 text-sm focus:border-stone-400 focus:outline-none"
                    />
                    {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"><X className="h-4 w-4" /></button>}
                </div>
                <Select value={type} onValueChange={upd((v: string) => setType(v === 'CREDIT' || v === 'DEBIT' ? v : 'ALL'))}>
                    <SelectTrigger className="h-10 w-full md:w-40 rounded-xl bg-stone-50 text-sm font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Flows</SelectItem>
                        <SelectItem value="CREDIT">Credits Only</SelectItem>
                        <SelectItem value="DEBIT">Debits Only</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={source} onValueChange={upd(setSource)}>
                    <SelectTrigger className="h-10 w-full md:w-40 rounded-xl bg-stone-50 text-sm font-semibold"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Sources</SelectItem>
                        {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={!filtered.length} onClick={() => downloadLedgerCsv(filtered, `ledger_${range.start}_to_${range.end}.csv`)} className="h-10 rounded-xl px-4 text-sm font-semibold">
                    <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block">
                <Table className="w-full">
                    <TableHeader className="bg-stone-50/80">
                        <TableRow>
                            <TableHead className="px-5 py-3 text-xs font-bold text-stone-600">Date</TableHead>
                            <TableHead className="px-5 py-3 text-xs font-bold text-stone-600">Reference / Detail</TableHead>
                            <TableHead className="px-5 py-3 text-xs font-bold text-stone-600 text-center">Type</TableHead>
                            <TableHead className="px-5 py-3 text-right text-xs font-bold text-stone-600">Debit (Out)</TableHead>
                            <TableHead className="px-5 py-3 text-right text-xs font-bold text-stone-600">Credit (In)</TableHead>
                            <TableHead className="px-5 py-3 pr-6 text-right text-xs font-bold text-stone-600">Running Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-stone-100">
                        {loading ? (
                            [...Array(6)].map((_, i) => <TableRow key={i}><TableCell colSpan={6} className="py-4 px-5"><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                        ) : pageRows.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="py-16 text-center text-stone-500 font-medium">No transactions found.</TableCell></TableRow>
                        ) : pageRows.map((r, idx) => (
                            <TableRow key={`${r.id}-${idx}`} className={cn('transition-colors hover:bg-stone-50/70', r.type === 'CREDIT' && 'bg-emerald-50/10')}>
                                <TableCell className="px-5 py-3 text-xs font-medium text-stone-600 whitespace-nowrap">{fmtDate(r.date)} <span className="text-stone-400 block">{fmtTime(r.date)}</span></TableCell>
                                <TableCell className="px-5 py-3 max-w-[280px]">
                                    <p className="font-bold text-sm text-stone-900 truncate">{r.description || '—'}</p>
                                    <p className="font-mono text-[11px] text-stone-500 mt-0.5">{r.reference || '—'}</p>
                                </TableCell>
                                <TableCell className="px-5 py-3 text-center">
                                    <Badge variant="outline" className="bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">{r.source}</Badge>
                                </TableCell>
                                <TableCell className="px-5 py-3 text-right text-sm font-bold tabular-nums text-rose-600">{r.type === 'DEBIT' ? money(r.amount) : '-'}</TableCell>
                                <TableCell className="px-5 py-3 text-right text-sm font-bold tabular-nums text-emerald-600">{r.type === 'CREDIT' ? money(r.amount) : '-'}</TableCell>
                                <TableCell className={cn('px-5 py-3 pr-6 text-right text-sm font-black tabular-nums', r.balance >= 0 ? 'text-stone-800' : 'text-rose-700')}>{money(r.balance)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile List */}
            <div className="space-y-3 md:hidden">
                {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) :
                    pageRows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500 font-medium">No transactions match your filters.</div>
                    ) : pageRows.map((r, idx) => (
                        <div key={`${r.id}-${idx}`} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-stone-900">{r.description || '—'}</p>
                                    <p className="mt-0.5 font-mono text-[11px] text-stone-500">{r.reference || '—'}</p>
                                </div>
                                <p className={cn('shrink-0 text-base font-black tabular-nums', r.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600')}>
                                    {r.type === 'CREDIT' ? '+' : '−'}{money(r.amount)}
                                </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px] text-stone-500 font-medium">
                                <span>{fmtDate(r.date)}</span>
                                <Badge variant="outline" className="px-2 py-0 text-[10px] font-bold uppercase bg-stone-50">{r.source}</Badge>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
                <div className="flex items-center justify-between print:hidden">
                    <span className="text-xs font-medium text-stone-500">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 rounded-lg px-2" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-xs font-bold text-stone-700">{safePage} / {pages}</span>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg px-2" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   HUB ENTRY
   ========================================================================= */

export default function FinanceHub() {
    // Re-calculating cost snapshots is a Super Admin tool (the API rejects anyone else)
    const isSuperAdmin = useAuth().user?.role === 'SUPER_ADMIN';
    const sp = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tab: TabId = sp.get('tab') === 'ledger' ? 'ledger' : 'overview';
    const rangeParam = sp.get('range') ?? '';
    const preset: Preset = rangeParam === 'CUSTOM' ? 'CUSTOM' : PRESET_IDS.includes(rangeParam) ? (rangeParam as Preset) : 'THIS_MONTH';

    const range = useMemo(() => preset === 'CUSTOM' ? { start: sp.get('from') || '', end: sp.get('to') || '' } : rangeForPreset(preset), [preset, sp]);
    const rangeValid = Boolean(range.start && range.end && range.start <= range.end);

    const setParams = useCallback((patch: Record<string, string | null>) => {
        const p = new URLSearchParams(sp.toString());
        Object.entries(patch).forEach(([k, val]) => (val === null ? p.delete(k) : p.set(k, val)));
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    }, [sp, router, pathname]);

    const applyPreset = (id: Exclude<Preset, 'CUSTOM'>) => setParams({ range: id, from: null, to: null });
    const changeDates = (start: string, end: string) => setParams({ range: 'CUSTOM', from: start, to: end });

    const prevRange = useMemo(() => {
        if (!rangeValid) return null;
        const len = daysBetween(range.start, range.end) + 1;
        const end = addDays(range.start, -1);
        return { start: addDays(end, -(len - 1)), end };
    }, [range, rangeValid]);

    const cur = useGetFinancialSummaryQuery(rangeValid ? { startDate: range.start, endDate: range.end } : skipToken, { refetchOnMountOrArgChange: true });
    const prv = useGetFinancialSummaryQuery(prevRange ? { startDate: prevRange.start, endDate: prevRange.end } : skipToken, { refetchOnMountOrArgChange: true });
    const led = useGetLedgerQuery(rangeValid ? { startDate: range.start, endDate: range.end, type: 'ALL' } : skipToken, { refetchOnMountOrArgChange: true });
    const ledgerLocked = apiErrorStatus(led.error) === 403;

    const [backfillCosts, { isLoading: isBackfilling }] = useBackfillHistoricalCostsMutation();

    const ledgerRows: LedgerRow[] = useMemo(() => {
        const raw = led.data?.data?.data ?? [];
        const list = raw.map((t, i) => ({
            id: String(t.id ?? i),
            ts: new Date(t.date).getTime() || 0,
            date: t.date,
            reference: String(t.reference ?? ''),
            description: String(t.description ?? ''),
            source: String(t.source ?? 'OTHER'),
            method: String(t.method ?? ''),
            type: (t.type === 'CREDIT' ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT',
            amount: Math.abs(n(t.amount)),
            balance: 0,
        })).sort((a, b) => a.ts - b.ts);
        let bal = 0;
        return list.map((r) => { bal += r.type === 'CREDIT' ? r.amount : -r.amount; return { ...r, balance: bal }; });
    }, [led.data]);

    const cash = useMemo(() => sumCash(ledgerRows), [ledgerRows]);

    const handleBackfill = async () => {
        try { await backfillCosts().unwrap(); toast.success('Cost snapshots synchronized.'); cur.refetch(); prv.refetch(); led.refetch(); }
        catch (e) { toast.error(apiErrorMessage(e, 'Failed to sync historical costs')); }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 lg:p-8 font-sans">

            {/* Executive Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">Financials</h1>
                    </div>
                    <p className="mt-1 text-sm text-stone-500 font-medium">
                        {rangeValid ? `${labelYmd(range.start)} – ${labelYmd(range.end)}` : 'Select a valid date range'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    {isSuperAdmin && (<AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={isBackfilling} className="h-9 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold">
                                {isBackfilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sync Ledgers
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold text-stone-900">Synchronize Cost Snapshots?</AlertDialogTitle>
                                <AlertDialogDescription className="text-stone-500">
                                    This builds cost records for orders that have none, using today&rsquo;s average costs.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-stone-200 font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBackfill} className="rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800">Confirm Sync</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>)}

                    <Button size="sm" variant="outline" onClick={() => window.print()} className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-100/80 font-bold">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/60 bg-white p-2 shadow-sm md:flex-row md:items-center md:justify-between print:hidden">
                <div className="flex items-center gap-1 overflow-x-auto px-1 pb-1 md:pb-0 hide-scrollbar">
                    {PRESETS.map((t) => (
                        <button key={t.id} type="button" onClick={() => applyPreset(t.id)}
                            className={cn('shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                                preset === t.id ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900')}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className={cn('flex w-fit items-center gap-2 rounded-xl border p-1.5 px-3', rangeValid ? 'border-stone-200 bg-stone-50' : 'border-rose-300 bg-rose-50')}>
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <input type="date" value={range.start} max={range.end || undefined} onChange={(e) => changeDates(e.target.value, range.end)} className="cursor-pointer bg-transparent text-xs font-semibold text-stone-700 focus:outline-none" />
                    <span className="text-xs text-stone-300">—</span>
                    <input type="date" value={range.end} min={range.start || undefined} onChange={(e) => changeDates(range.start, e.target.value)} className="cursor-pointer bg-transparent text-xs font-semibold text-stone-700 focus:outline-none" />
                </div>
            </div>

            {/* Tab Toggles */}
            <div role="tablist" className="flex gap-2 rounded-2xl border border-stone-200/60 bg-white p-1.5 shadow-sm print:hidden">
                {([{ id: 'overview', label: 'Overview', icon: BarChart3 }, { id: 'ledger', label: 'Ledger', icon: FileSpreadsheet }] as const).map((t) => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} type="button"
                        onClick={() => setParams({ tab: t.id === 'overview' ? null : t.id })}
                        className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:flex-none sm:px-6',
                            tab === t.id ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100')}>
                        <t.icon className="h-4 w-4" /> {t.label}
                        {t.id === 'ledger' && !led.isLoading && ledgerRows.length > 0 && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px]', tab === t.id ? 'bg-white/20' : 'bg-stone-200 text-stone-600')}>{ledgerRows.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Investors need an approved, time-limited grant for the full ledger (D-007) */}
            {tab === 'overview' ? (
                <OverviewTab m={cur.data?.data?.metrics ?? {}} b={cur.data?.data?.breakdown ?? {}} pm={prv.data?.data?.metrics} loading={cur.isLoading} prevLoading={prv.isLoading} isError={cur.isError} onRetry={() => cur.refetch()} rangeValid={rangeValid} cash={cash} cashLoading={led.isLoading} cashLocked={ledgerLocked} />
            ) : (
                ledgerLocked ? (
                    <div className="mx-auto max-w-md"><LedgerAccessCard /></div>
                ) : (
                    <LedgerTab rows={ledgerRows} loading={led.isLoading} isError={led.isError} onRetry={() => led.refetch()} range={range} />
                )
            )}
        </div>
    );
}