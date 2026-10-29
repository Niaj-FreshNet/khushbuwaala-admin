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
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                        {title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Sales (bar) • Orders (line)
                    </p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    {/* ✅ Single axis (Sales) */}
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={salesTick}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "10px 12px",
                            color: "#111827",
                            boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                        }}
                        labelStyle={{ fontWeight: 600, marginBottom: 6 }}
                        formatter={(value: any, name: any, props: any) => {
                            const v = Number(value || 0);

                            if (name === "Sales") return [formatBDT(v), "Sales"];
                            if (name === "Orders") return [v, "Orders"];

                            return [v, name];
                        }}
                        labelFormatter={(label) => `Day: ${label}`}
                        // ✅ clean tooltip: add breakdown lines without showing them on chart
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;

                            const row = payload[0]?.payload as Row;

                            return (
                                <div
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                                        minWidth: 220,
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                                        Day: {label}
                                    </div>

                                    <div style={{ fontSize: 12, display: "grid", gap: 6 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Total Sales</span>
                                            <span style={{ fontWeight: 600 }}>{formatBDT(row.totalSales)}</span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Website Sales</span>
                                            <span>{formatBDT(row.websiteSales)}</span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Manual Sales</span>
                                            <span>{formatBDT(row.manualSales)}</span>
                                        </div>

                                        <hr style={{ border: 0, borderTop: "1px solid #f3f4f6", margin: "6px 0" }} />

                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Total Orders</span>
                                            <span style={{ fontWeight: 700 }}>{row.totalOrders}</span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Website Orders</span>
                                            <span>{row.websiteOrders}</span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#6b7280" }}>Manual Orders</span>
                                            <span>{row.manualOrders}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    />

                    {/* ✅ Clean visuals: just total sales bar */}
                    <Bar
                        dataKey="totalSales"
                        name="Sales"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={42}
                    />

                    {/* ✅ Orders line (same axis, but still readable) */}
                    <Line
                        type="monotone"
                        dataKey="totalOrders"
                        name="Orders"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}