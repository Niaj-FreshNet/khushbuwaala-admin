// File: app/dashboard/_components/AdminDashboardClient.tsx
"use client";

import { useState } from "react";
import AdminChartData from "./AdminChartData";
import RecentOrderList from "./RecentOrderList";
import { useGetDashboardMetricsQuery } from "@/redux/store/api/order/ordersApi";
import BestSelling from "./BestSelling";
import MetricCard from "./MetricCard";

type DashboardType = "all" | "website" | "manual";

export default function AdminDashboardClient() {
    const [type, setType] = useState<DashboardType>("all");

    const { data, isLoading, isError } = useGetDashboardMetricsQuery(
        { type },
        { refetchOnMountOrArgChange: true }
    );

    const metrics = [
        { label: "Today Orders", value: data?.data?.todayOrders ?? 0, circleColor: "#FF8C38" },
        { label: "This Month Orders", value: data?.data?.monthOrders ?? 0, circleColor: "#FFD700" },
        { label: "This Month Sales", value: data?.data?.monthSales ?? 0, circleColor: "#000000" },
        { label: "Total Sales", value: data?.data?.totalSales ?? 0, circleColor: "#00C4B4" },
    ];

    return (
        <div className="space-y-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: "all", label: "All" },
                    { key: "website", label: "Website Orders" },
                    { key: "manual", label: "Manual Sales" },
                ].map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setType(t.key as DashboardType)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            type === t.key 
                                ? "bg-[#1b382b] text-white border-[#1b382b] shadow-sm" 
                                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Metrics Section with individual skeleton loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    // Render 4 loading skeleton cards while metrics are fetching
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm animate-pulse space-y-3">
                            <div className="h-3 w-24 bg-stone-100 rounded" />
                            <div className="h-7 w-16 bg-stone-200 rounded" />
                        </div>
                    ))
                ) : isError ? (
                    <div className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                        <p className="text-red-500 text-xs font-medium">Failed to load statistics.</p>
                    </div>
                ) : (
                    metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
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

            {/* Recent Orders List Section */}
            <div className="bg-white shadow-sm rounded-2xl border border-stone-200/80">
                <RecentOrderList />
            </div>
        </div>
    );
}