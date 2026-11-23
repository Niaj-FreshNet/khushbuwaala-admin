// File: app/dashboard/_components/AdminDashboardClient.tsx
"use client";

import { useState } from "react";
import AdminChartData from "./AdminChartData";
import RecentOrderList from "./RecentOrderList";
import { useGetDashboardMetricsQuery } from "@/redux/store/api/order/ordersApi";
import BestSelling from "./BestSelling";
import MetricCard from "./MetricCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DashboardType = "all" | "website" | "manual";

export default function AdminDashboardClient() {
    const [type, setType] = useState<DashboardType>("all");

    const { data, isLoading, isError, refetch, isFetching } = useGetDashboardMetricsQuery(
        { type },
        { refetchOnMountOrArgChange: true }
    );

    const handleManualRefresh = () => {
        refetch();
        toast.success("Dashboard refreshed successfully!", { duration: 1000 });
    };

    const metricsData = data?.data;
    const formatBDT = (v: number) => `৳${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

    const todayData = metricsData?.today;
    const weekData = metricsData?.thisWeek;
    const monthlyData = metricsData?.thisMonth;
    const last3MonthsData = metricsData?.last3Months;

    // 4 Consolidated Metric Cards showing Orders & Sales Amount beside each other
    const metrics = [
        {
            label: "Today's",
            value: `Orders: ${todayData?.orders ?? 0} | Sales: ${formatBDT(todayData?.sales ?? 0)}`,
            circleColor: "#FF8C38",
        },
        {
            label: "This Week",
            value: `Orders: ${weekData?.orders ?? 0} | Sales: ${formatBDT(weekData?.sales ?? 0)}`,
            circleColor: "#6366f1",
        },
        {
            label: "This Month",
            value: `Orders: ${monthlyData?.orders ?? 0} | Sales: ${formatBDT(monthlyData?.sales ?? 0)}`,
            circleColor: "#FFD700",
        },
        {
            label: "Last 3 Months",
            value: `Orders: ${last3MonthsData?.orders ?? 0} | Sales: ${formatBDT(last3MonthsData?.sales ?? 0)}`,
            circleColor: "#00C4B4",
        },
    ];

    return (
        <div className="space-y-2">
            {/* Filter Tabs & Refresh Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-2xs">
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { key: "all", label: "All (Orders + Sales)" },
                        { key: "website", label: "Orders (Website)" },
                        { key: "manual", label: "Sales (Manual)" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setType(t.key as DashboardType)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${type === t.key
                                ? "bg-[#1b382b] text-white border-[#1b382b] shadow-sm"
                                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isFetching}
                    className="bg-white border-stone-300 text-stone-700 hover:bg-stone-50 h-7 text-xs px-2.5 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
                    title="Refresh Dashboard"
                >
                    <RefreshCw className={cn("w-3 h-3 text-stone-600", isFetching && "animate-spin text-[#FB923C]")} />
                    <span>Refresh</span>
                </Button>
            </div>

            {/* Metrics Section: Displayed neatly in 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm animate-pulse space-y-3">
                            <div className="h-3 w-24 bg-stone-100 rounded" />
                            <div className="h-7 w-36 bg-stone-200 rounded" />
                        </div>
                    ))
                ) : isError ? (
                    <div className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                        <p className="text-red-500 text-xs font-medium">Failed to load statistics.</p>
                    </div>
                ) : (
                    metrics.map((metric, index) => (
                        <MetricCard
                            key={index}
                            {...metric}
                            blurTimeoutSeconds={10}
                        />
                    ))
                )}
            </div>

            {/* Chart + Best Selling Section */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-4 bg-white shadow-sm rounded-2xl border border-stone-200/80">
                    <AdminChartData type={type} />
                </div>
                <div className="lg:col-span-2 bg-white shadow-sm rounded-2xl border border-stone-200/80">
                    <BestSelling />
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-2xl border border-stone-200/80">
                <RecentOrderList type={type} />
            </div>
        </div>
    );
}