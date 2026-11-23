'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, Package,
    Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Printer, BadgeDollarSign, Loader2, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetInvestorDashboardQuery, useRequestWithdrawalMutation } from '@/redux/store/api/investor/investorApi';
import { toast } from 'sonner';
import { LedgerAccessCard, MonthlyProfitHistory } from './_components/InvestorExtras';
import { formatTaka } from '@/lib/money';
import { apiErrorMessage } from "@/lib/apiError";

type Num = number | undefined;

interface Metrics {
    grossSales?: Num; totalOrderDiscounts?: Num; totalRevenue?: Num;
    totalCOGS?: Num; grossProfit?: Num; returnedCourierLoss?: Num;
    totalFulfillmentCosts?: Num; totalOperatingExpenses?: Num; netProfit?: Num;
}

type Preset = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

const TZ = 'Asia/Dhaka';

const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};
const money = (v: unknown) => formatTaka(n(v));

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

const PRESETS: { id: Exclude<Preset, 'CUSTOM'>; label: string }[] = [
    { id: 'TODAY', label: 'Today' }, { id: 'LAST_7_DAYS', label: '7 Days' },
    { id: 'THIS_MONTH', label: 'This Month' }, { id: 'LAST_MONTH', label: 'Last Month' },
    { id: 'LAST_3_MONTHS', label: 'Last 3 Months' }, { id: 'THIS_YEAR', label: 'This Year' },
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

function KpiCard(props: { title: string; value: string; icon: React.ReactNode; accent: string; iconBg: string; valueClass?: string; delta?: React.ReactNode; loading: boolean; }) {
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
            {/* Removed the explicit footer to keep cards compact and punchy */}
        </Card>
    );
}

function StatementRow({ label, value, loading, indent, tone = 'muted', strong }: { label: string; value: number; loading: boolean; indent?: boolean; tone?: 'minus' | 'total' | 'muted'; strong?: boolean; }) {
    const color = tone === 'minus' ? 'text-rose-600' : tone === 'total' ? (value >= 0 ? 'text-emerald-700' : 'text-rose-600') : 'text-stone-900';
    return (
        <div className={cn('flex items-center justify-between py-2.5 text-[13px]', indent && 'pl-4 text-xs text-stone-500', strong && 'border-t border-stone-200/60 font-bold text-sm mt-1 pt-3')}>
            <span className={cn('min-w-0', strong ? 'text-stone-900' : 'text-stone-600')}>{label}</span>
            {loading ? <Skeleton className="h-4 w-16" /> : (
                <span className={cn('shrink-0 font-semibold tabular-nums', color)}>
                    {tone === 'minus' && value > 0 ? '−' : ''}{money(value)}
                </span>
            )}
        </div>
    );
}

function InvestorHub() {
    const sp = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

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

    const cur = useGetInvestorDashboardQuery(rangeValid ? { startDate: range.start, endDate: range.end } : skipToken, { refetchOnMountOrArgChange: true });
    const prv = useGetInvestorDashboardQuery(prevRange ? { startDate: prevRange.start, endDate: prevRange.end } : skipToken, { refetchOnMountOrArgChange: true });
    const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();

    const responseData = cur.data?.data;
    // We only need balance and profit share for the top-level view now
    const profile = responseData?.investorProfile ?? { name: 'Investor', profitSharePercentage: 0, currentBalance: 0 };
    // A super admin opening this page has no investor profile, so the name can be missing
    const displayName = profile.name?.trim() || 'Investor';
    const m: Metrics = responseData?.metrics ?? {};
    const pm: Metrics = prv.data?.data?.metrics ?? {};
    const withdrawals = responseData?.recentWithdrawals ?? [];

    const revenue = n(m.totalRevenue);
    const cogs = n(m.totalCOGS);
    const fulfillment = n(m.totalFulfillmentCosts);
    const opex = n(m.totalOperatingExpenses);
    const net = n(m.netProfit);
    const netPositive = net >= 0;

    const [withdrawAmount, setWithdrawAmount] = useState("");

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestWithdrawal({ amount: Number(withdrawAmount), method: 'Bank Transfer' }).unwrap();
            toast.success("Withdrawal request submitted successfully!");
            setWithdrawAmount("");
        } catch (error) {
            toast.error(apiErrorMessage(error, "Failed to submit withdrawal request."));
        }
    };

    return (
        <div className="min-h-screen w-full bg-stone-50/30 p-3 sm:p-6 lg:p-8 font-sans">
            <div className="mx-auto max-w-6xl space-y-6">

                {/* 1. Header & Quick Actions - Compact and Executive */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {displayName.charAt(0)}
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                                Welcome, {displayName.split(' ')[0]}
                            </h1>
                            <span className="ml-2 inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600 border border-stone-200">
                                {profile.profitSharePercentage}% Share
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                            Your investor dashboard and performance overview.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <Button size="sm" variant="outline" onClick={() => { cur.refetch(); prv.refetch(); }} disabled={cur.isFetching || !rangeValid} className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-100/80">
                            <RefreshCw className={cn('mr-1.5 h-4 w-4', cur.isFetching && 'animate-spin')} /> Sync
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.print()} className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-100/80">
                            <Printer className="mr-1.5 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* 2. Primary Action Area: Balance & Withdrawal */}
                <Card className="overflow-hidden rounded-2xl border-none bg-gradient-to-br from-emerald-900 to-emerald-800 text-white shadow-xl shadow-emerald-900/10">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-emerald-300">
                                    <BadgeDollarSign className="h-4 w-4" /> Available Balance
                                </p>
                                {cur.isLoading ? (
                                    <Skeleton className="mt-2 h-12 w-48 bg-emerald-700/50" />
                                ) : (
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black tracking-tight">{money(profile.currentBalance)}</span>
                                        <span className="text-emerald-300 text-sm font-medium">BDT</span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:max-w-xs shrink-0 rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/10 print:hidden">
                                <form onSubmit={handleWithdraw} className="flex h-11 w-full relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200 font-semibold text-sm">৳</div>
                                    <input
                                        type="number"
                                        min="1"
                                        max={profile.currentBalance}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="w-full bg-transparent pl-7 pr-3 text-white placeholder:text-emerald-200/60 focus:outline-none font-semibold"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > profile.currentBalance}
                                        className="h-full rounded-lg bg-white px-5 text-emerald-900 hover:bg-emerald-50 font-bold transition-all disabled:opacity-50"
                                    >
                                        {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Performance Section with Integrated Date Filter */}
                <div className="space-y-4">
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

                    {/* KPIs - 4 Column Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            title="Revenue Share" value={money(revenue)} loading={cur.isLoading}
                            accent="bg-emerald-500" iconBg="bg-emerald-50 text-emerald-600" icon={<DollarSign className="h-5 w-5" />}
                            delta={<Delta cur={revenue} prev={n(pm?.totalRevenue)} loading={prv.isLoading} />}
                        />
                        <KpiCard
                            title="COGS Share" value={money(cogs)} loading={cur.isLoading}
                            accent="bg-orange-500" iconBg="bg-orange-50 text-orange-600" icon={<Package className="h-5 w-5" />}
                            delta={<Delta cur={cogs} prev={n(pm?.totalCOGS)} invert loading={prv.isLoading} />}
                        />
                        <KpiCard
                            title="Gross Profit Share" value={money(m.grossProfit)} loading={cur.isLoading}
                            accent="bg-blue-500" iconBg="bg-blue-50 text-blue-600" icon={<TrendingUp className="h-5 w-5" />}
                            valueClass={n(m.grossProfit) < 0 ? 'text-rose-600' : 'text-blue-700'}
                            delta={<Delta cur={n(m.grossProfit)} prev={n(pm?.grossProfit)} loading={prv.isLoading} />}
                        />
                        <KpiCard
                            title="Net Profit Share" value={money(net)} loading={cur.isLoading}
                            accent={netPositive ? 'bg-emerald-600' : 'bg-rose-600'}
                            iconBg={netPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                            valueClass={netPositive ? 'text-emerald-700' : 'text-rose-600'}
                            icon={netPositive ? <Wallet className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                            delta={<Delta cur={net} prev={n(pm?.netProfit)} loading={prv.isLoading} />}
                        />
                    </div>
                </div>

                {/* 4. Detailed Reports - Side by Side on Desktop */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Pro-Rata Statement */}
                    <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm lg:col-span-2">
                        <CardHeader className="border-b border-stone-100 pb-4 pt-5 px-6">
                            <CardTitle className="text-sm font-bold text-stone-900">Pro-Rata Income Statement ({profile.profitSharePercentage}%)</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-stone-50 px-6 py-2">
                            <StatementRow label="Gross sales" value={n(m.grossSales)} loading={cur.isLoading} />
                            <StatementRow label="Discounts & promos" value={n(m.totalOrderDiscounts)} loading={cur.isLoading} tone="minus" indent />
                            <StatementRow label="Net revenue" value={revenue} loading={cur.isLoading} strong />

                            <StatementRow label="Cost of goods sold (COGS)" value={cogs} loading={cur.isLoading} tone="minus" indent />
                            <StatementRow label="Gross profit" value={n(m.grossProfit)} loading={cur.isLoading} tone="total" strong />

                            <StatementRow label="Fulfillment & returns" value={fulfillment} loading={cur.isLoading} tone="minus" indent />
                            <StatementRow label="Operating expenses (Opex)" value={opex} loading={cur.isLoading} tone="minus" indent />
                            <StatementRow label="Net Profit" value={net} loading={cur.isLoading} tone="total" strong />
                        </CardContent>
                    </Card>

                    <MonthlyProfitHistory items={responseData?.monthlyProfits ?? []} />
                    <LedgerAccessCard />

                    {/* Recent Withdrawals Ledger */}
                    <Card className="rounded-2xl border-stone-200/60 bg-white shadow-sm flex flex-col">
                        <CardHeader className="border-b border-stone-100 pb-4 pt-5 px-6">
                            <CardTitle className="text-sm font-bold text-stone-900 flex items-center justify-between">
                                Recent Transactions
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2">View All</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            {cur.isLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ) : withdrawals.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                                    <Wallet className="mb-3 h-8 w-8 text-stone-200" />
                                    <p className="text-sm font-medium text-stone-500">No recent transactions</p>
                                    <p className="text-xs text-stone-400 mt-1">Withdrawals will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-50 max-h-[360px] overflow-y-auto px-6 py-2 custom-scrollbar">
                                    {withdrawals.map((w) => (
                                        <div key={w.id} className="group py-3.5 flex items-center justify-between hover:bg-stone-50/50 -mx-2 px-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", w.status === 'APPROVED' || w.status === 'COMPLETED' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : w.status === 'PENDING' ? "border-amber-200 bg-amber-50 text-amber-600" : "border-rose-200 bg-rose-50 text-rose-600")}>
                                                    {w.status === 'APPROVED' || w.status === 'COMPLETED' ? <ArrowDownRight className="h-4 w-4" /> : w.status === 'PENDING' ? <Loader2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-stone-900">{money(w.amount)}</p>
                                                    <p className="text-[11px] text-stone-500 font-medium">{new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {w.method}</p>
                                                </div>
                                            </div>
                                            <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide", w.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                                                {w.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function InvestorPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
            <InvestorHub />
        </Suspense>
    );
}