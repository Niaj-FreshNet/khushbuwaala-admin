// File: components/AdminSalesOrdersBreakdownChart.tsx
"use client";

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

type Row = {
    day: string;
    websiteSales: number;
    manualSales: number;
    totalSales: number;
    websiteOrders: number;
    manualOrders: number;
    totalOrders: number;
};

export default function AdminSalesOrdersBreakdownChart({
    title = "Last 7 Days",
    data,
}: {
    title?: string;
    data: Row[];
}) {
    const formatBDT = (v: number) => `${Number(v || 0).toLocaleString()} BDT`;

    const salesTick = (v: number) => {
        const n = Number(v || 0);
        if (n >= 1000000) return `${Math.round(n / 1000000)}M`;
        if (n >= 1000) return `${Math.round(n / 1000)}K`;
        return `${n}`;
    };

    return (
        <div className="bg-white p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <div>
                    <h2 className="text-sm font-bold text-gray-900">
                        {title}
                    </h2>
                    <p className="text-[11px] text-gray-500">
                        Sales (bar) • Orders (line)
                    </p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        stroke="#9ca3af"
                    />

                    <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={salesTick}
                        axisLine={false}
                        tickLine={false}
                        stroke="#9ca3af"
                    />

                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0]?.payload as Row;

                            return (
                                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md min-w-[200px] text-xs space-y-2">
                                    <div className="font-bold text-gray-900 pb-1 border-b border-gray-100">
                                        Day: {label}
                                    </div>
                                    <div className="space-y-1 text-gray-600">
                                        <div className="flex justify-between font-semibold text-gray-900">
                                            <span>Total Sales</span>
                                            <span>{formatBDT(row.totalSales)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span>Website Sales</span>
                                            <span>{formatBDT(row.websiteSales)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span>Manual Sales</span>
                                            <span>{formatBDT(row.manualSales)}</span>
                                        </div>
                                        <hr className="border-gray-100 my-1" />
                                        <div className="flex justify-between font-semibold text-gray-900">
                                            <span>Total Orders</span>
                                            <span>{row.totalOrders}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    />

                    <Bar
                        dataKey="totalSales"
                        name="Sales"
                        fill="#FB923C"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                    />

                    <Line
                        type="monotone"
                        dataKey="totalOrders"
                        name="Orders"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}