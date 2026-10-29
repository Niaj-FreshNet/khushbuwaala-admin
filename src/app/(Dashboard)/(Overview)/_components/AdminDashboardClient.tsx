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
        { label: "This Month Sales", value: data?.data?.monthSales ?? 0, circleColor: "#000000" },
        { label: "Total Sales", value: data?.data?.totalSales ?? 0, circleColor: "#00C4B4" },
    ];

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: "all", label: "All" },
                    { key: "website", label: "Website Orders" },
                    { key: "manual", label: "Manual Sales" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setType(t.key as DashboardType)}
                        className={`px-4 py-2 rounded-md border text-sm ${type === t.key ? "bg-black text-white" : "bg-white text-gray-700"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading && <p className="text-gray-500">Loading metrics...</p>}
                {isError && <p className="text-red-500">Failed to load statistics.</p>}
                {!isLoading && !isError && metrics.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>

            {/* Chart + Best Selling */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-4 bg-white shadow-md rounded-xl">
                    <AdminChartData type={type} />
                </div>
                <div className="lg:col-span-2 bg-white shadow-md rounded-xl">
                    <BestSelling />
                </div>
            </div>

            <div className="bg-white shadow-md rounded-xl">
                <RecentOrderList />
            </div>
        </div>
    );
};

export default AdminDashboardClient;