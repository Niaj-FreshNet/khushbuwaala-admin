"use client";

import { useState } from "react";
import AdminChartData from "./AdminChartData";
import RecentOrderList from "./RecentOrderList";
import { useGetDashboardMetricsQuery } from "@/redux/store/api/order/ordersApi";
import BestSelling from "./BestSelling";
import MetricCard from "./MetricCard";

type DashboardType = "all" | "website" | "manual";

const AdminDashboardClient = () => {
    const [type, setType] = useState<DashboardType>("all");

    const { data, isLoading, isError } = useGetDashboardMetricsQuery(
        { type },
        { refetchOnMountOrArgChange: true }
    );

    const metrics = [
        { label: "Today Orders", value: data?.data?.todayOrders ?? 0, circleColor: "#FF8C38" },
        { label: "This Month Orders", value: data?.data?.monthOrders ?? 0, circleColor: "#FFD700" },
        { label: "This Month Sales", value: data?.data?.monthSales ?? 0, circleColor: "#111827" },
        { label: "Total Sales", value: data?.data?.totalSales ?? 0, circleColor: "#00C4B4" },
    ];

    return (
        <div className="w-full min-h-screen bg-gray-50/40 px-2 pt-0.5 pb-2 sm:px-3 sm:pt-0.5 sm:pb-2 space-y-2 mt-0">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                {[
                    { key: "all", label: "All" },
                    { key: "website", label: "Website Orders" },
                    { key: "manual", label: "Manual Sales" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setType(t.key as DashboardType)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${type === t.key
                                ? "bg-orange-50 text-[#FB923C] border border-orange-200 shadow-2xs"
                                : "bg-white text-gray-600 hover:bg-gray-100 border border-transparent"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {isLoading && <p className="text-xs text-gray-500 col-span-full px-1">Loading metrics...</p>}
                {isError && <p className="text-xs text-rose-500 col-span-full px-1">Failed to load statistics.</p>}
                {!isLoading && !isError && metrics.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>

            {/* Chart + Best Selling */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
                <div className="lg:col-span-4 bg-white shadow-2xs border border-gray-200 rounded-xl overflow-hidden">
                    <AdminChartData type={type} />
                </div>
                <div className="lg:col-span-2 bg-white shadow-2xs border border-gray-200 rounded-xl overflow-hidden">
                    <BestSelling />
                </div>
            </div>

            <div className="bg-white shadow-2xs border border-gray-200 rounded-xl overflow-hidden">
                <RecentOrderList />
            </div>
        </div>
    );
};

export default AdminDashboardClient;