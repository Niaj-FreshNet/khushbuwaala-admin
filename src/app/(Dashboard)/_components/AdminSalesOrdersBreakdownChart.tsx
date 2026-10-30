// File: components/AdminSalesOrdersBreakdownChart.tsx
"use client";

import { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Row = {
    day?: string;
    date?: string;
    totalSales: number;
    totalOrders: number;
};

interface AdminSalesChartProps {
    weeklyData?: Row[];
    monthlyData?: Row[];
    isLoading?: boolean;
    selectedMonth?: number;
    selectedYear?: number;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

export default function AdminSalesOrdersBreakdownChart({
    weeklyData = [],
    monthlyData = [],
    isLoading = false,
    selectedMonth = new Date().getMonth() + 1,
    selectedYear = new Date().getFullYear(),
    onPrevMonth = () => { },
    onNextMonth = () => { },
}: AdminSalesChartProps) {
    const [viewMode, setViewMode] = useState<"weekly" | "monthly">("monthly");

    // Zero-fill and generate every single day of the selected target month
    const fullyFilledMonthlyData = useMemo(() => {
        const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
        const yearShort = String(selectedYear).slice(-2);
        const monthStr = String(selectedMonth).padStart(2, "0");

        const map = new Map<string, Row>();
        monthlyData.forEach((item) => {
            const rawDate = item.date || item.day;
            if (rawDate) {
                map.set(String(rawDate).trim(), {
                    ...item,
                    totalSales: Number(item.totalSales ?? (item as any).sales ?? 0),
                    totalOrders: Number(item.totalOrders ?? (item as any).orders ?? 0),
                });
            }
        });

        const filled: Row[] = [];
        for (let day = 1; day <= totalDays; day++) {
            const formattedDay = String(day).padStart(2, "0");
            const backendKey = `${formattedDay}-${monthStr}-${yearShort}`; // e.g. "01-10-26"
            const labelStr = `${formattedDay}-${monthStr}`; // e.g. "01-10"

            if (map.has(backendKey)) {
                const existing = map.get(backendKey)!;
                filled.push({
                    ...existing,
                    date: labelStr,
                });
            } else {
                filled.push({
                    date: labelStr,
                    totalSales: 0,
                    totalOrders: 0,
                });
            }
        }
        return filled;
    }, [monthlyData, selectedMonth, selectedYear]);

    const activeData = viewMode === "weekly" ? weeklyData : fullyFilledMonthlyData;

    const aggregateSummary = activeData.reduce(
        (acc, curr) => {
            acc.totalSales += Number(curr.totalSales || 0);
            acc.totalOrders += Number(curr.totalOrders || 0);
            return acc;
        },
        { totalSales: 0, totalOrders: 0 }
    );

    const formatBDT = (v: number) => `${Number(v || 0).toLocaleString()} BDT`;

    const salesTick = (v: number) => {
        const n = Number(v || 0);
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${Math.round(n / 1000)}K`;
        return `${n}`;
    };

    const monthsNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // ✅ Fixed typo bug
    const currentMonthLabel = `${monthsNames[selectedMonth - 1]} ${selectedYear}`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-7 transition-all duration-200">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-stone-900 font-serif tracking-tight">
                        Sales & Orders Overview
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Performance overview for{" "}
                        <span className="font-semibold text-stone-700">
                            {viewMode === "weekly" ? "the last 7 days" : currentMonthLabel}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Previous/Next Month Navigation Controls (Only active in monthly view) */}
                    {viewMode === "monthly" && (
                        <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200/60 rounded-xl px-2 py-1">
                            <button
                                type="button"
                                onClick={onPrevMonth}
                                className="p-1 hover:bg-white rounded-lg text-stone-600 transition-all shadow-sm cursor-pointer"
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-semibold text-stone-800 px-2 min-w-[95px] text-center">
                                {monthsNames[selectedMonth - 1].slice(0, 3)} {selectedYear}
                            </span>
                            <button
                                type="button"
                                onClick={onNextMonth}
                                className="p-1 hover:bg-white rounded-lg text-stone-600 transition-all shadow-sm cursor-pointer"
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* Range Tab Switcher */}
                    <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/60">
                        <button
                            type="button"
                            onClick={() => setViewMode("weekly")}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "weekly"
                                    ? "bg-white text-stone-900 shadow-sm"
                                    : "text-stone-500 hover:text-stone-900"
                                }`}
                        >
                            Last 7 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("monthly")}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "monthly"
                                    ? "bg-white text-stone-900 shadow-sm"
                                    : "text-stone-500 hover:text-stone-900"
                                }`}
                        >
                            This Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Metric Overview Mini Badges */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#F6F8F6] border border-[#E2E8E4] rounded-xl p-3.5">
                    <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Period Revenue</p>
                    <p className="text-base sm:text-lg font-bold text-[#1b382b] mt-0.5">
                        {isLoading ? "..." : formatBDT(aggregateSummary.totalSales)}
                    </p>
                </div>
                <div className="bg-[#F6F8F6] border border-[#E2E8E4] rounded-xl p-3.5">
                    <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Period Orders</p>
                    <p className="text-base sm:text-lg font-bold text-[#1b382b] mt-0.5">
                        {isLoading ? "..." : aggregateSummary.totalOrders}
                    </p>
                </div>
            </div>

            {/* Chart Container */}
            {isLoading ? (
                <div className="h-[320px] w-full flex flex-col items-center justify-center bg-stone-50/50 rounded-xl animate-pulse">
                    <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#1b382b] animate-spin mb-2" />
                    <p className="text-xs text-stone-400 font-medium">Loading sales data...</p>
                </div>
            ) : activeData.length === 0 ? (
                <div className="h-[320px] w-full flex flex-col items-center justify-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                    <p className="text-sm font-medium text-stone-500">No data found for this range</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={activeData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey={viewMode === "weekly" ? "day" : "date"}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            dy={4}
                            tick={({ x, y, payload }: any) => {
                                // Find matching data row to check if sales are zero
                                const row = activeData.find((d) => (viewMode === "weekly" ? d.day : d.date) === payload.value);
                                const isZeroSales = !row || Number(row.totalSales) === 0;

                                return (
                                    <text
                                        x={x}
                                        y={y}
                                        fill="#6B7280"
                                        fontSize={12}
                                        textAnchor="end"
                                        // Bold dates with zero sales, regular for good sales
                                        fontWeight={isZeroSales ? "bold" : "normal"}
                                        transform={`rotate(-55, ${x}, ${y})`}
                                        dy={6}
                                    >
                                        {payload.value}
                                    </text>
                                );
                            }}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#6B7280" }}
                            tickFormatter={salesTick}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const row = payload[0]?.payload as Row;
                                return (
                                    <div style={{ background: "#ffffff", border: "1px solid #E2E8E4", borderRadius: 12, padding: "12px 14px", boxShadow: "0 10px 25px rgba(0,0,0,.08)", minWidth: 210 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827", fontSize: 13 }}>Date: {label}</div>
                                        <div style={{ fontSize: 12, display: "grid", gap: 6 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#6b7280" }}>Total Sales</span>
                                                <span style={{ fontWeight: 700, color: "#1b382b" }}>{formatBDT(row.totalSales)}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#6b7280" }}>Total Orders</span>
                                                <span style={{ fontWeight: 700 }}>{row.totalOrders}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="totalSales" name="Sales" fill="#1b382b" radius={[4, 4, 0, 0]} maxBarSize={viewMode === "weekly" ? 40 : 10} />
                        <Line type="monotone" dataKey="totalOrders" name="Orders" stroke="#4a7c59" strokeWidth={2} dot={{ r: 1.5, fill: "#4a7c59" }} activeDot={{ r: 4, fill: "#1b382b" }} />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}