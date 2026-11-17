'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, Package, Calendar, Loader2,
    RefreshCw, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, BarChart3,
    FileSpreadsheet, Printer, Download, Search, X, ChevronLeft, ChevronRight, Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useGetFinancialSummaryQuery,
    useGetLedgerQuery,
    useBackfillHistoricalCostsMutation,
} from '@/redux/store/api/finance/financeApi';
import { toast } from 'sonner';

/* =========================================================================
   Types
   ========================================================================= */

type Num = number | undefined;

interface Metrics {
    grossSales?: Num; totalOrderDiscounts?: Num; totalRevenue?: Num;
    totalShippingCollected?: Num; totalCOGS?: Num; grossProfit?: Num;
    grossMarginPercentage?: Num; returnedCourierLoss?: Num;
    freeShippingCourierCost?: Num; codFees?: Num; totalFulfillmentCosts?: Num;
    totalOperatingExpenses?: Num; netProfit?: Num; netMarginPercentage?: Num;
    totalInventoryInvestment?: Num;
}
interface Breakdown {
    totalLiquidCost?: Num; totalPackagingCost?: Num; expenseCount?: Num;
    orderCount?: Num; returnedCount?: Num; missingCostItemCount?: Num;
    missingCostOrderCount?: Num; unsyncedOrderCount?: Num;
}
interface LedgerRow {
    id: string; ts: number; date: string; reference: string; description: string;
    source: string; method: string; type: 'CREDIT' | 'DEBIT'; amount: number; balance: number;
}

type TabId = 'overview' | 'ledger';
type Preset =
    | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH'
    | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

/* =========================================================================
   Helpers (all date maths is done in Asia/Dhaka, never the browser zone)
   ========================================================================= */

const TZ = 'Asia/Dhaka';

const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const money = (v: unknown) => {
    const x = n(v);
    return `${x < 0 ? '-' : ''}৳${Math.abs(x).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
};
const pct = (v: unknown) => `${n(v).toFixed(1)}%`;

const todayYmd = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const parseYmd = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};
const fmtYmd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, k: number) => {
    const d = parseYmd(s);
    d.setUTCDate(d.getUTCDate() + k);
    return fmtYmd(d);
};
const monthStart = (s: string, offset = 0) => {
    const d = parseYmd(s);
    return fmtYmd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1)));
};
const monthEnd = (s: string, offset = 0) => {
    const d = parseYmd(s);
    return fmtYmd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset + 1, 0)));
};
const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000);
const labelYmd = (s: string) =>
    s ? parseYmd(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

const fmtDate = (d: unknown) =>
    new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
const fmtTime = (d: unknown) =>
    new Date(d as string).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });

const PRESETS: { id: Exclude<Preset, 'CUSTOM'>; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: 'LAST_7_DAYS', label: '7 Days' },
    { id: 'LAST_30_DAYS', label: '30 Days' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'LAST_MONTH', label: 'Last Month' },
    { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
    { id: 'THIS_YEAR', label: 'This Year' },
];
const PRESET_IDS = PRESETS.map((p) => p.id) as string[];

const rangeForPreset = (preset: Exclude<Preset, 'CUSTOM'>) => {
    const t = todayYmd();
    switch (preset) {
        case 'TODAY': return { start: t, end: t };
        case 'LAST_7_DAYS': return { start: addDays(t, -6), end: t };
        case 'LAST_30_DAYS': return { start: addDays(t, -29), end: t };
        case 'LAST_MONTH': return { start: monthStart(t, -1), end: monthEnd(t, -1) };
        case 'LAST_3_MONTHS': return { start: monthStart(t, -2), end: t }; // this month so far + 2 months before
        case 'THIS_YEAR': return { start: `${t.slice(0, 4)}-01-01`, end: t };
        case 'THIS_MONTH':
        default: return { start: monthStart(t, 0), end: t };
    }
};

const prettyMethod = (m: string) => (m ? m.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim() : '—');

/* =========================================================================
   Small UI pieces
   ========================================================================= */

const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn('animate-pulse rounded-md bg-gray-200/80', className)} />
);

function Delta({ cur, prev, invert = false, loading }: { cur: number; prev: number; invert?: boolean; loading: boolean }) {
    if (loading) return <Skeleton className="h-3 w-20" />;
    if (!prev) return <span className="text-[10px] text-gray-400">No previous data</span>;
    const ch = ((cur - prev) / Math.abs(prev)) * 100;
    const good = invert ? ch <= 0 : ch >= 0;
    const shown = Math.abs(ch) > 999 ? '>999%' : `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`;
    return (
        <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold', good ? 'text-emerald-600' : 'text-rose-600')}>
            {ch >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {shown} <span className="font-normal text-gray-400">vs previous</span>
        </span>
    );
}

function KpiCard(props: {
    title: string; value: string; icon: React.ReactNode; accent: string; iconBg: string;
    valueClass?: string; footerLabel: string; footerValue: React.ReactNode;
    delta?: React.ReactNode; loading: boolean;
}) {
    return (
        <Card className="relative overflow-hidden rounded-xl border-gray-200/80 bg-white shadow-2xs">
            <div className={cn('absolute left-0 top-0 h-full w-1', props.accent)} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{props.title}</CardTitle>
                <div className={cn('rounded-lg p-2', props.iconBg)}>{props.icon}</div>
            </CardHeader>
            <CardContent>
                {props.loading ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className={cn('truncate text-xl font-black tracking-tight text-gray-900 sm:text-2xl', props.valueClass)}>{props.value}</div>
                )}
                {props.delta && <div className="mt-1 min-h-4">{props.delta}</div>}
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                    <span>{props.footerLabel}</span>
                    <span className="font-bold text-gray-800">{props.loading ? <Skeleton className="h-3 w-12" /> : props.footerValue}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function StatementRow(props: {
    label: string; value: number; loading: boolean; indent?: boolean;
    tone?: 'minus' | 'total' | 'muted'; strong?: boolean; hint?: string;
}) {
    const { tone = 'muted' } = props;
    const color =
        tone === 'minus' ? 'text-rose-600' :
            tone === 'total' ? (props.value >= 0 ? 'text-emerald-700' : 'text-rose-600') : 'text-gray-900';
    return (
        <div className={cn('flex items-center justify-between gap-3 py-2 text-xs', props.indent && 'pl-4 text-[11px]', props.strong && 'border-t border-gray-200 font-bold')}>
            <span className={cn('min-w-0 text-gray-600', props.strong && 'text-gray-900')} title={props.hint}>{props.label}</span>
            {props.loading ? <Skeleton className="h-4 w-16" /> : (
                <span className={cn('shrink-0 font-semibold tabular-nums', color, props.strong && 'text-sm')}>
                    {tone === 'minus' && props.value > 0 ? '−' : ''}{money(props.value)}
                </span>
            )}
        </div>
    );
}

function Notice({ tone, children }: { tone: 'amber' | 'blue' | 'rose'; children: React.ReactNode }) {
    const styles = {
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        blue: 'border-blue-200 bg-blue-50 text-blue-900',
        rose: 'border-rose-200 bg-rose-50 text-rose-800',
    }[tone];
    return (
        <div className={cn('flex items-start gap-2 rounded-xl border p-3 text-xs', styles)}>
            {tone === 'blue' ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div className="min-w-0">{children}</div>
        </div>
    );
}

/* =========================================================================
   OVERVIEW TAB
   ========================================================================= */

function OverviewTab(props: {
    m: Metrics; b: Breakdown; pm?: Metrics; loading: boolean; prevLoading: boolean; isError: boolean;
    onRetry: () => void; rangeValid: boolean;
    cash: { credits: number; debits: number; net: number }; cashLoading: boolean;
}) {
    const { m, b, pm, loading, prevLoading, cashLoading } = props;

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
            gross: n(m.grossProfit),
            grossMargin: n(m.grossMarginPercentage),
            netMargin: n(m.netMarginPercentage),
            avgOrderValue: orders > 0 ? revenue / orders : 0,
            avgProfitPerOrder: orders > 0 ? net / orders : 0,
            missingItems: n(b.missingCostItemCount),
            missingOrders: n(b.missingCostOrderCount),
            unsynced: n(b.unsyncedOrderCount),
            costAdjustment: cogs - liquid - packaging, // manual profit overrides
            // integrity checks: do the printed lines add up to the server totals?
            netGap: revenue - cogs - fulfillment - opex - net,
            revenueGap: n(m.grossSales) - n(m.totalOrderDiscounts) - revenue,
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

    if (props.isError && props.rangeValid) {
        return (
            <Notice tone="rose">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>Could not load the financial summary.</span>
                    <Button size="sm" variant="outline" className="h-7 w-fit border-rose-300 bg-white text-xs" onClick={props.onRetry}>Try again</Button>
                </div>
            </Notice>
        );
    }

    return (
        <div className="space-y-2">
            {/* Data-quality notices */}
            {!loading && (v.missingItems > 0 || v.unsynced > 0 || mismatch) && (
                <div className="space-y-2">
                    {v.missingItems > 0 && (
                        <Notice tone="amber">
                            <b>{v.missingOrders}</b> order{v.missingOrders === 1 ? '' : 's'} ({v.missingItems} item{v.missingItems === 1 ? '' : 's'}) were sold
                            without a known cost, so their cost counts as ৳0 and profit is overstated. Enter product and packaging costs, then use <b>Sync Past Orders</b>.
                        </Notice>
                    )}
                    {v.unsynced > 0 && (
                        <Notice tone="blue">
                            <b>{v.unsynced}</b> order{v.unsynced === 1 ? ' is' : 's are'} not in the ledger yet, so their revenue and profit are not included. Use <b>Sync Past Orders</b>.
                        </Notice>
                    )}
                    {mismatch && (
                        <Notice tone="amber">
                            The statement lines do not add up to the server totals (net gap {money(v.netGap)}, revenue gap {money(v.revenueGap)}). Please check the finance service.
                        </Notice>
                    )}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                <KpiCard
                    title="Net Revenue" value={money(v.revenue)} loading={loading}
                    accent="bg-emerald-500" iconBg="bg-emerald-50 text-emerald-600" icon={<DollarSign className="h-4 w-4" />}
                    delta={<Delta cur={v.revenue} prev={n(pm?.totalRevenue)} loading={prevLoading} />}
                    footerLabel="Valid orders" footerValue={v.orders}
                />
                <KpiCard
                    title="Total COGS" value={money(v.cogs)} loading={loading}
                    accent="bg-orange-500" iconBg="bg-orange-50 text-orange-600" icon={<Package className="h-4 w-4" />}
                    delta={<Delta cur={v.cogs} prev={n(pm?.totalCOGS)} invert loading={prevLoading} />}
                    footerLabel="Share of revenue" footerValue={v.revenue > 0 ? pct((v.cogs / v.revenue) * 100) : '—'}
                />
                <KpiCard
                    title="Gross Profit" value={money(v.gross)} loading={loading}
                    accent="bg-blue-500" iconBg="bg-blue-50 text-blue-600" icon={<TrendingUp className="h-4 w-4" />}
                    valueClass={v.gross < 0 ? 'text-rose-600' : 'text-blue-700'}
                    delta={<Delta cur={v.gross} prev={n(pm?.grossProfit)} loading={prevLoading} />}
                    footerLabel="Gross margin"
                    footerValue={<span className={v.grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{pct(v.grossMargin)}</span>}
                />
                <KpiCard
                    title="Net Profit" value={money(v.net)} loading={loading}
                    accent={netPositive ? 'bg-emerald-600' : 'bg-rose-600'}
                    iconBg={netPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                    valueClass={netPositive ? 'text-emerald-700' : 'text-rose-600'}
                    icon={netPositive ? <Wallet className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    delta={<Delta cur={v.net} prev={n(pm?.netProfit)} loading={prevLoading} />}
                    footerLabel="Net margin"
                    footerValue={<span className={netPositive ? 'text-emerald-700' : 'text-rose-600'}>{pct(v.netMargin)}</span>}
                />
            </div>

            {!loading && props.rangeValid && !hasData && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-xs text-gray-500">
                    No orders, expenses or stock purchases found for this period.
                </div>
            )}

            {/* Statement + side cards */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs lg:col-span-3">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-xs font-bold text-gray-800">Profit & Loss Statement</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-50 pt-2">
                        <StatementRow label="Gross sales (before coupons)" value={n(m.grossSales)} loading={loading} />
                        <StatementRow label="Order discounts / coupons" value={n(m.totalOrderDiscounts)} loading={loading} tone="minus" indent />
                        <StatementRow label="Net revenue" value={v.revenue} loading={loading} strong />

                        <StatementRow label="Product cost (liquid, average cost)" value={v.liquid} loading={loading} tone="minus" indent />
                        <StatementRow label="Packaging & bottle cost" value={v.packaging} loading={loading} tone="minus" indent />
                        {Math.abs(v.costAdjustment) >= 1 && (
                            <StatementRow label="Manual cost adjustments" value={v.costAdjustment} loading={loading} tone="minus" indent
                                hint="Orders where profit was overridden by hand" />
                        )}
                        <StatementRow label="Gross profit" value={v.gross} loading={loading} tone="total" strong />

                        <StatementRow label="Returned orders: courier loss" value={n(m.returnedCourierLoss)} loading={loading} tone="minus" indent
                            hint="Courier charge paid on returned orders (showroom excluded)" />
                        <StatementRow label="Free-shipping orders: courier cost" value={n(m.freeShippingCourierCost)} loading={loading} tone="minus" indent
                            hint="Shipped orders where the customer paid no delivery fee" />
                        <StatementRow label="COD fees (1%)" value={n(m.codFees)} loading={loading} tone="minus" indent />
                        <StatementRow label={`Operating expenses (${n(b.expenseCount)})`} value={v.opex} loading={loading} tone="minus" indent />
                        <StatementRow label="Net profit" value={v.net} loading={loading} tone="total" strong />
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4 lg:col-span-2">
                    <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-xs font-bold text-gray-800">Where the money goes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-4">
                            {loading ? <Skeleton className="h-4 w-full" /> : bar.length === 0 ? (
                                <p className="text-[11px] text-gray-400">Not enough data to chart.</p>
                            ) : (
                                <>
                                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                                        {bar.map((s) => <div key={s.key} className={s.color} style={{ width: `${s.width}%` }} title={`${s.key}: ${money(s.value)}`} />)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                                        {bar.map((s) => (
                                            <div key={s.key} className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5 text-gray-600"><span className={cn('h-2 w-2 rounded-full', s.color)} /> {s.key}</span>
                                                <span className="font-semibold tabular-nums text-gray-800">{pct(s.width)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {!netPositive && <p className="text-[11px] text-rose-600">Costs are higher than revenue in this period.</p>}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-xs font-bold text-gray-800">Per-order averages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-3 text-xs">
                            <div className="flex justify-between"><span className="text-gray-600">Average order value</span>
                                {loading ? <Skeleton className="h-4 w-14" /> : <span className="font-bold tabular-nums">{money(v.avgOrderValue)}</span>}</div>
                            <div className="flex justify-between"><span className="text-gray-600">Average profit per order</span>
                                {loading ? <Skeleton className="h-4 w-14" /> : <span className={cn('font-bold tabular-nums', v.avgProfitPerOrder >= 0 ? 'text-emerald-700' : 'text-rose-600')}>{money(v.avgProfitPerOrder)}</span>}</div>
                            <div className="flex justify-between"><span className="text-gray-600">Returned orders</span>
                                {loading ? <Skeleton className="h-4 w-8" /> : <span className="font-bold tabular-nums">{n(b.returnedCount)}</span>}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cash view */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-gray-800"><Banknote className="h-3.5 w-3.5 text-emerald-600" /> Cash flow (from ledger)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-3 text-xs">
                        <div className="flex justify-between"><span className="text-gray-600">Money in</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className="font-bold tabular-nums text-emerald-600">{money(props.cash.credits)}</span>}</div>
                        <div className="flex justify-between"><span className="text-gray-600">Money out</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className="font-bold tabular-nums text-rose-600">{money(props.cash.debits)}</span>}</div>
                        <div className="flex justify-between border-t border-gray-100 pt-2"><span className="font-semibold text-gray-800">Net cash</span>{cashLoading ? <Skeleton className="h-4 w-16" /> : <span className={cn('font-black tabular-nums', props.cash.net >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{money(props.cash.net)}</span>}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-gray-800"><span className="h-2 w-2 rounded-full bg-blue-500" /> Stock purchased</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-3">
                        {loading ? <Skeleton className="h-6 w-24" /> : <div className="text-lg font-black tabular-nums text-blue-700">{money(m.totalInventoryInvestment)}</div>}
                        <p className="text-[11px] leading-relaxed text-gray-400">Cash spent on new stock. It is not a cost yet. It only becomes cost of goods when the stock is sold.</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-gray-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Shipping collected</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-3">
                        {loading ? <Skeleton className="h-6 w-24" /> : <div className="text-lg font-black tabular-nums text-emerald-700">{money(m.totalShippingCollected)}</div>}
                        <p className="text-[11px] leading-relaxed text-gray-400">Delivery fees paid by customers. For reference only. It passes through to the courier, so it is not revenue.</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-gray-200/80 bg-white shadow-2xs">
                    <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-xs font-bold text-gray-800"><Info className="h-3.5 w-3.5 text-gray-500" /> Profit vs cash</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <p className="text-[11px] leading-relaxed text-gray-500">
                            Profit is what you <b>earned</b>. Cash is what is in your <b>pocket</b>. Buying stock empties your pocket today but only lowers profit
                            when the bottles are sold. Orders not yet paid raise profit but not cash. So the two numbers will not match, and that is normal.
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

const sanitizeCsv = (v: unknown) => {
    const s = String(v ?? '');
    return /^[=+\-@]/.test(s) ? `'${s}` : s; // stop spreadsheet formula injection
};

function LedgerTab(props: {
    rows: LedgerRow[]; loading: boolean; isError: boolean; onRetry: () => void; range: { start: string; end: string };
}) {
    const { rows, loading } = props;
    const [type, setType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
    const [source, setSource] = useState('ALL');
    const [method, setMethod] = useState('ALL');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<'DATE_DESC' | 'DATE_ASC' | 'AMT_DESC' | 'AMT_ASC'>('DATE_DESC');
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(1);

    const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source))).sort(), [rows]);
    const methods = useMemo(() => Array.from(new Set(rows.map((r) => r.method).filter(Boolean))).sort(), [rows]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const list = rows.filter((r) =>
            (type === 'ALL' || r.type === type) &&
            (source === 'ALL' || r.source === source) &&
            (method === 'ALL' || r.method === method) &&
            (!needle || `${r.reference} ${r.description} ${r.source} ${r.method}`.toLowerCase().includes(needle)),
        );
        const cmp = {
            DATE_DESC: (a: LedgerRow, b: LedgerRow) => b.ts - a.ts,
            DATE_ASC: (a: LedgerRow, b: LedgerRow) => a.ts - b.ts,
            AMT_DESC: (a: LedgerRow, b: LedgerRow) => b.amount - a.amount,
            AMT_ASC: (a: LedgerRow, b: LedgerRow) => a.amount - b.amount,
        }[sort];
        return [...list].sort(cmp);
    }, [rows, type, source, method, q, sort]);

    const totals = useMemo(() => {
        let credits = 0, debits = 0;
        for (const r of filtered) r.type === 'CREDIT' ? (credits += r.amount) : (debits += r.amount);
        return { credits, debits, net: credits - debits };
    }, [filtered]);

    const bySource = useMemo(() => {
        const map = new Map<string, { source: string; inn: number; out: number; count: number }>();
        for (const r of filtered) {
            const e = map.get(r.source) ?? { source: r.source, inn: 0, out: 0, count: 0 };
            r.type === 'CREDIT' ? (e.inn += r.amount) : (e.out += r.amount);
            e.count++;
            map.set(r.source, e);
        }
        return Array.from(map.values()).sort((a, b) => b.inn + b.out - (a.inn + a.out));
    }, [filtered]);

    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, pages);
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const filtersActive = type !== 'ALL' || source !== 'ALL' || method !== 'ALL' || q.trim() !== '';
    const reset = () => { setType('ALL'); setSource('ALL'); setMethod('ALL'); setQ(''); setPage(1); };
    const upd = <T,>(setter: (v: T) => void) => (val: T) => { setter(val); setPage(1); };

    const exportCsv = () => {
        const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = ['Date', 'Time', 'Reference', 'Description', 'Source', 'Method', 'Debit (Out)', 'Credit (In)', 'Running Balance'];
        const lines = [
            head.join(','),
            ...filtered.map((r) => [
                fmtDate(r.date), fmtTime(r.date), sanitizeCsv(r.reference), sanitizeCsv(r.description),
                sanitizeCsv(r.source), sanitizeCsv(prettyMethod(r.method)),
                r.type === 'DEBIT' ? r.amount : '', r.type === 'CREDIT' ? r.amount : '', r.balance,
            ].map(esc).join(',')),
        ];
        const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger_${props.range.start}_to_${props.range.end}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    if (props.isError) {
        return (
            <Notice tone="rose">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>Could not load the ledger.</span>
                    <Button size="sm" variant="outline" className="h-7 w-fit border-rose-300 bg-white text-xs" onClick={props.onRetry}>Try again</Button>
                </div>
            </Notice>
        );
    }

    return (
        <div className="space-y-2">
            {/* Totals (follow the filters) */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700"><ArrowDownRight className="h-3 w-3" /> Money in (credit)</p>
                    {loading ? <Skeleton className="mt-1 h-6 w-24" /> : <p className="mt-1 truncate text-base font-black tabular-nums text-emerald-700 sm:text-lg">{money(totals.credits)}</p>}
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-2xs">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700"><ArrowUpRight className="h-3 w-3" /> Money out (debit)</p>
                    {loading ? <Skeleton className="mt-1 h-6 w-24" /> : <p className="mt-1 truncate text-base font-black tabular-nums text-rose-700 sm:text-lg">{money(totals.debits)}</p>}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Net cash flow</p>
                    {loading ? <Skeleton className="mt-1 h-6 w-24" /> : <p className={cn('mt-1 truncate text-base font-black tabular-nums sm:text-lg', totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{totals.net >= 0 ? '+' : ''}{money(totals.net)}</p>}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Transactions</p>
                    {loading ? <Skeleton className="mt-1 h-6 w-16" /> : <p className="mt-1 text-base font-black tabular-nums text-gray-900 sm:text-lg">{filtered.length}<span className="text-xs font-medium text-gray-400"> / {rows.length}</span></p>}
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-2 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs print:hidden">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                            placeholder="Search reference, description…"
                            className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-7 text-xs focus:border-gray-400 focus:outline-none"
                        />
                        {q && <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
                    </div>

                    <Select value={type} onValueChange={upd((v: string) => setType(v as any))}>
                        <SelectTrigger className="h-8 bg-gray-50 text-xs font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All transactions</SelectItem>
                            <SelectItem value="CREDIT">Credits (money in)</SelectItem>
                            <SelectItem value="DEBIT">Debits (money out)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={source} onValueChange={upd(setSource)}>
                        <SelectTrigger className="h-8 bg-gray-50 text-xs font-semibold"><SelectValue placeholder="Source" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All sources</SelectItem>
                            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={method} onValueChange={upd(setMethod)}>
                        <SelectTrigger className="h-8 bg-gray-50 text-xs font-semibold"><SelectValue placeholder="Method" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All methods</SelectItem>
                            {methods.map((s) => <SelectItem key={s} value={s}>{prettyMethod(s)}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={upd((v: string) => setSort(v as any))}>
                        <SelectTrigger className="h-8 bg-gray-50 text-xs font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DATE_DESC">Newest first</SelectItem>
                            <SelectItem value="DATE_ASC">Oldest first</SelectItem>
                            <SelectItem value="AMT_DESC">Largest amount</SelectItem>
                            <SelectItem value="AMT_ASC">Smallest amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        {filtersActive && <button type="button" onClick={reset} className="font-semibold text-blue-600 hover:underline">Clear filters</button>}
                    </div>
                    <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length} className="h-8 text-xs font-semibold">
                        <Download className="mr-1 h-3.5 w-3.5" /> Export CSV ({filtered.length})
                    </Button>
                </div>
            </div>

            {/* By source */}
            {!loading && bySource.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {bySource.map((s) => (
                        <button
                            key={s.source} type="button"
                            onClick={() => { setSource(source === s.source ? 'ALL' : s.source); setPage(1); }}
                            className={cn('shrink-0 rounded-lg border bg-white px-3 py-2 text-left text-[11px] shadow-2xs transition hover:border-gray-400', source === s.source ? 'border-gray-900' : 'border-gray-200')}
                        >
                            <div className="font-bold uppercase tracking-wide text-gray-700">{s.source} <span className="font-normal text-gray-400">· {s.count}</span></div>
                            <div className="mt-0.5 tabular-nums">
                                {s.inn > 0 && <span className="mr-2 font-semibold text-emerald-600">+{money(s.inn)}</span>}
                                {s.out > 0 && <span className="font-semibold text-rose-600">−{money(s.out)}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs md:block">
                <div className="w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="border-b border-gray-200 bg-gray-100/80 text-gray-700">
                            <TableRow>
                                <TableHead className="whitespace-nowrap px-4 py-2 text-xs font-bold">Date & time</TableHead>
                                <TableHead className="px-4 py-2 text-xs font-bold">Reference</TableHead>
                                <TableHead className="px-4 py-2 text-xs font-bold">Description</TableHead>
                                <TableHead className="px-4 py-2 text-xs font-bold">Source</TableHead>
                                <TableHead className="px-4 py-2 text-xs font-bold">Method</TableHead>
                                <TableHead className="px-4 py-2 text-right text-xs font-bold">Debit (out)</TableHead>
                                <TableHead className="px-4 py-2 text-right text-xs font-bold">Credit (in)</TableHead>
                                <TableHead className="px-4 py-2 pr-6 text-right text-xs font-bold" title="Running total of credits minus debits since the start of this period">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100">
                            {loading ? (
                                [...Array(8)].map((_, i) => <TableRow key={i}><TableCell colSpan={8} className="py-2.5"><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                            ) : pageRows.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="py-16 text-center text-gray-500">
                                    <Wallet className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                    <p className="text-sm font-semibold">{rows.length ? 'No transactions match your filters.' : 'No transactions found for this period.'}</p>
                                </TableCell></TableRow>
                            ) : pageRows.map((r, idx) => (
                                <TableRow key={`${r.id}-${idx}`} className={cn('transition-colors hover:bg-gray-50/70', r.type === 'CREDIT' && 'bg-emerald-50/10')}>
                                    <TableCell className="whitespace-nowrap px-4 py-2 text-[11px] font-medium text-gray-600">{fmtDate(r.date)}<br /><span className="text-gray-400">{fmtTime(r.date)}</span></TableCell>
                                    <TableCell className="whitespace-nowrap px-4 py-2 font-mono text-[11px] font-semibold text-gray-800">{r.reference || '—'}</TableCell>
                                    <TableCell className="max-w-[260px] truncate px-4 py-2 text-xs font-semibold text-gray-900" title={r.description}>{r.description || '—'}</TableCell>
                                    <TableCell className="px-4 py-2"><Badge variant="outline" className="border-gray-200 bg-white px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-gray-600">{r.source}</Badge></TableCell>
                                    <TableCell className="px-4 py-2 text-[11px] font-medium capitalize text-gray-600">{prettyMethod(r.method)}</TableCell>
                                    <TableCell className="px-4 py-2 text-right text-xs font-bold tabular-nums text-rose-600">{r.type === 'DEBIT' ? money(r.amount) : '-'}</TableCell>
                                    <TableCell className="px-4 py-2 text-right text-xs font-bold tabular-nums text-emerald-600">{r.type === 'CREDIT' ? money(r.amount) : '-'}</TableCell>
                                    <TableCell className={cn('px-4 py-2 pr-6 text-right text-xs font-semibold tabular-nums', r.balance >= 0 ? 'text-gray-700' : 'text-rose-700')}>{money(r.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
                {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />) :
                    pageRows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-xs text-gray-500">
                            {rows.length ? 'No transactions match your filters.' : 'No transactions found for this period.'}
                        </div>
                    ) : pageRows.map((r, idx) => (
                        <div key={`${r.id}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-gray-900">{r.description || '—'}</p>
                                    <p className="mt-0.5 font-mono text-[10px] text-gray-500">{r.reference || '—'}</p>
                                </div>
                                <p className={cn('shrink-0 text-sm font-black tabular-nums', r.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600')}>
                                    {r.type === 'CREDIT' ? '+' : '−'}{money(r.amount)}
                                </p>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[10px] text-gray-500">
                                <span>{fmtDate(r.date)} · {fmtTime(r.date)}</span>
                                <span className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase">{r.source}</Badge>
                                    <span className="capitalize">{prettyMethod(r.method)}</span>
                                </span>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row print:hidden">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span>Rows per page</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-7 w-[70px] bg-white text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{[25, 50, 100, 500, 1000].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <span>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="px-2 text-[11px] font-semibold tabular-nums text-gray-700">{safePage} / {pages}</span>
                        <Button size="sm" variant="outline" className="h-7 px-2" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   HUB (one route, shared date range, two tabs)
   ========================================================================= */

function FinanceHub() {
    const sp = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tab: TabId = sp.get('tab') === 'ledger' ? 'ledger' : 'overview';
    const rangeParam = sp.get('range') ?? '';
    const preset: Preset = rangeParam === 'CUSTOM' ? 'CUSTOM' : PRESET_IDS.includes(rangeParam) ? (rangeParam as Preset) : 'THIS_MONTH';

    const range = useMemo(
        () => preset === 'CUSTOM'
            ? { start: sp.get('from') || '', end: sp.get('to') || '' }
            : rangeForPreset(preset),
        [preset, sp],
    );
    const rangeValid = Boolean(range.start && range.end && range.start <= range.end);

    const setParams = useCallback((patch: Record<string, string | null>) => {
        const p = new URLSearchParams(sp.toString());
        Object.entries(patch).forEach(([k, val]) => (val === null ? p.delete(k) : p.set(k, val)));
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    }, [sp, router, pathname]);

    const applyPreset = (id: Exclude<Preset, 'CUSTOM'>) => setParams({ range: id, from: null, to: null });
    const changeDates = (start: string, end: string) => setParams({ range: 'CUSTOM', from: start, to: end });

    // previous period of the same length, directly before the current one
    const prevRange = useMemo(() => {
        if (!rangeValid) return null;
        const len = daysBetween(range.start, range.end) + 1;
        const end = addDays(range.start, -1);
        return { start: addDays(end, -(len - 1)), end };
    }, [range, rangeValid]);

    const cur = useGetFinancialSummaryQuery(rangeValid ? { startDate: range.start, endDate: range.end } : skipToken, { refetchOnMountOrArgChange: true });
    const prv = useGetFinancialSummaryQuery(prevRange ? { startDate: prevRange.start, endDate: prevRange.end } : skipToken, { refetchOnMountOrArgChange: true });
    const led = useGetLedgerQuery(rangeValid ? { startDate: range.start, endDate: range.end, type: 'ALL' } : skipToken, { refetchOnMountOrArgChange: true });

    const [backfillCosts, { isLoading: isBackfilling }] = useBackfillHistoricalCostsMutation();

    const ledgerRows: LedgerRow[] = useMemo(() => {
        const raw = (led.data?.data?.data ?? []) as any[];
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
        return list.map((r) => {
            bal += r.type === 'CREDIT' ? r.amount : -r.amount;
            return { ...r, balance: bal };
        });
    }, [led.data]);

    const cash = useMemo(() => {
        let credits = 0, debits = 0;
        for (const r of ledgerRows) r.type === 'CREDIT' ? (credits += r.amount) : (debits += r.amount);
        return { credits, debits, net: credits - debits };
    }, [ledgerRows]);

    const anyFetching = cur.isFetching || prv.isFetching || led.isFetching;

    const refreshAll = () => {
        if (!rangeValid) return;
        cur.refetch(); prv.refetch(); led.refetch();
    };

    const handleBackfill = async () => {
        try {
            const res = await backfillCosts().unwrap();
            toast.success(res?.message || 'Cost snapshots synchronized.');
            refreshAll();
        } catch (e: any) {
            toast.error(e?.data?.message || 'Failed to sync historical costs');
        }
    };

    const summary = cur.data?.data;

    return (
        <div className="min-h-screen w-full space-y-2 bg-gray-50/50 p-2 text-xs sm:text-sm">

            {/* Header */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">Finance & Ledger</h1>
                    <p className="mt-0.5 text-xs text-gray-500">
                        {rangeValid ? `${labelYmd(range.start)} – ${labelYmd(range.end)}` : 'Select a valid date range'} · Dhaka time
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center print:hidden">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isBackfilling}
                                className="h-8 border-emerald-200 bg-emerald-50/50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                                {isBackfilling ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5 text-emerald-600" />}
                                <span className="truncate">Sync Orders</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sync cost snapshots?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This builds cost records for orders that have none, and re-calculates orders that were saved with missing costs.
                                    It uses <b>today's</b> average product cost and packaging cost, so older orders will not reflect the cost at the time they were sold.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBackfill}>Sync now</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button size="sm" variant="outline" onClick={refreshAll} disabled={anyFetching || !rangeValid} className="h-8 border-gray-300 bg-white text-xs font-semibold">
                        <RefreshCw className={cn('mr-1 h-3.5 w-3.5 text-gray-500', anyFetching && 'animate-spin text-orange-500')} /> Refresh
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 border-gray-300 bg-white text-xs font-semibold">
                        <Printer className="mr-1 h-3.5 w-3.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Date filters (shared by both tabs) */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs md:flex-row md:items-center md:justify-between print:hidden">
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 md:pb-0">
                    {PRESETS.map((t) => (
                        <button key={t.id} type="button" onClick={() => applyPreset(t.id)}
                            className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                                preset === t.id ? 'bg-gray-900 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className={cn('flex w-fit max-w-full flex-wrap items-center gap-2 rounded-lg border p-1.5', rangeValid ? 'border-gray-200 bg-gray-50' : 'border-rose-300 bg-rose-50')}>
                    <Calendar className="ml-1 h-3.5 w-3.5 text-gray-400" />
                    <input type="date" value={range.start} max={range.end || undefined} aria-label="Start date"
                        onChange={(e) => changeDates(e.target.value, range.end)}
                        className="min-w-0 cursor-pointer bg-transparent text-xs font-medium text-gray-700 focus:outline-none" />
                    <span className="text-xs font-medium text-gray-400">to</span>
                    <input type="date" value={range.end} min={range.start || undefined} aria-label="End date"
                        onChange={(e) => changeDates(range.start, e.target.value)}
                        className="min-w-0 cursor-pointer bg-transparent text-xs font-medium text-gray-700 focus:outline-none" />
                </div>
            </div>

            {!rangeValid && (
                <Notice tone="rose">Choose a valid date range. The start date must be on or before the end date.</Notice>
            )}

            {/* Tabs */}
            <div role="tablist" className="flex gap-1 rounded-xl border border-gray-200/80 bg-white p-1 shadow-2xs print:hidden">
                {([
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'ledger', label: 'Ledger', icon: FileSpreadsheet },
                ] as const).map((t) => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} type="button"
                        onClick={() => setParams({ tab: t.id === 'overview' ? null : t.id })}
                        className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:flex-none sm:px-6',
                            tab === t.id ? 'bg-gray-900 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100')}>
                        <t.icon className="h-3.5 w-3.5" /> {t.label}
                        {t.id === 'ledger' && !led.isLoading && ledgerRows.length > 0 && (
                            <span className={cn('rounded-full px-1.5 text-[10px]', tab === t.id ? 'bg-white/20' : 'bg-gray-200 text-gray-600')}>{ledgerRows.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'overview' ? (
                <OverviewTab
                    m={summary?.metrics ?? {}} b={summary?.breakdown ?? {}} pm={prv.data?.data?.metrics}
                    loading={cur.isLoading} prevLoading={prv.isLoading} isError={cur.isError} onRetry={() => cur.refetch()}
                    rangeValid={rangeValid} cash={cash} cashLoading={led.isLoading}
                />
            ) : (
                <LedgerTab rows={ledgerRows} loading={led.isLoading} isError={led.isError} onRetry={() => led.refetch()} range={range} />
            )}
        </div>
    );
}

/* useSearchParams needs a Suspense boundary in the Next.js App Router */
export default function FinancePage() {
    return (
        <Suspense fallback={<div className="text-xs text-gray-500">Loading finance…</div>}>
            <FinanceHub />
        </Suspense>
    );
}