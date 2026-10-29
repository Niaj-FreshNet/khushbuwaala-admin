// File: components/AdminChartData.tsx (or keep same file name)
"use client";

import { useMemo } from "react";
import { useGetWeeklySalesOverviewQuery } from "@/redux/store/api/order/ordersApi";
import AdminSalesOrdersBreakdownChart from "./AdminSalesOrdersBreakdownChart";

type DashboardType = "all" | "website" | "manual";

type Point = { day: string; sales: number; orders: number };

function normalize(list: Point[] = []) {
    const map = new Map<string, Point>();
    list.forEach((p) => map.set(p.day, { day: p.day, sales: Number(p.sales || 0), orders: Number(p.orders || 0) }));
    return map;
}

export default function AdminChartData({ type }: { type: DashboardType }) {
    // If user wants "website" only or "manual" only, keep single series.
    // If user wants "all", show comparison website vs manual (best insight).
    const showBreakdown = type === "all";

    const websiteQ = useGetWeeklySalesOverviewQuery(
        { type: "website" },
        { skip: !showBreakdown, refetchOnMountOrArgChange: true }
    );
    const manualQ = useGetWeeklySalesOverviewQuery(
        { type: "manual" },
        { skip: !showBreakdown, refetchOnMountOrArgChange: true }
    );

    const singleQ = useGetWeeklySalesOverviewQuery(
        { type },
        { skip: showBreakdown, refetchOnMountOrArgChange: true }
    );

    const isLoading = showBreakdown ? websiteQ.isLoading || manualQ.isLoading : singleQ.isLoading;
    const isError = showBreakdown ? websiteQ.isError || manualQ.isError : singleQ.isError;

    const merged = useMemo(() => {
        if (!showBreakdown) return [];

        const website = normalize((websiteQ.data?.data ?? []) as Point[]);
        const manual = normalize((manualQ.data?.data ?? []) as Point[]);

        // union days (keeps whatever backend gives; fills missing with 0)
        const days = Array.from(new Set([...website.keys(), ...manual.keys()]));

        // Optional: sort by day string if it's like "Mon/Tue" you can keep server order.
        // If it's "YYYY-MM-DD", you can sort.
        // days.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return days.map((day) => {
            const w = website.get(day) || { day, sales: 0, orders: 0 };
            const m = manual.get(day) || { day, sales: 0, orders: 0 };

            return {
                day,
                websiteSales: w.sales,
                manualSales: m.sales,
                totalSales: w.sales + m.sales,

                websiteOrders: w.orders,
                manualOrders: m.orders,
                totalOrders: w.orders + m.orders,
            };
        });
    }, [showBreakdown, websiteQ.data, manualQ.data]);

    if (isLoading) return <p className="p-6 text-gray-500">Loading chart...</p>;
    if (isError) return <p className="p-6 text-red-500">Failed to load chart data</p>;

    // If single mode: render your old chart (simple)
    if (!showBreakdown) {
        const weeklyData = (singleQ.data?.data ?? []) as Point[];
        // you can keep your AdminRevenueChart here if you want:
        // return <AdminRevenueChart title="Last 7 Days" weeklyData={weeklyData} />;
        // But for consistency, you can still use breakdown chart with only one source:
        return (
            <AdminSalesOrdersBreakdownChart
                title={`Last 7 Days (${type.toUpperCase()})`}
                data={weeklyData.map((p) => ({
                    day: p.day,
                    websiteSales: type === "website" ? p.sales : 0,
                    manualSales: type === "manual" ? p.sales : 0,
                    totalSales: p.sales,
                    websiteOrders: type === "website" ? p.orders : 0,
                    manualOrders: type === "manual" ? p.orders : 0,
                    totalOrders: p.orders,
                }))}
                compactSingle
            />
        );
    }

    // Breakdown mode: website vs manual together
    return <AdminSalesOrdersBreakdownChart title="Last 7 Days" data={merged} />;
}