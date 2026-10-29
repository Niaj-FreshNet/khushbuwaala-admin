// File: components/BestSelling.tsx
"use client";

import { useMemo } from "react";
import { useGetBestSellersQuery } from "@/redux/store/api/product/productApi";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

type ApiItem = {
    id: string;
    name: string;
    totalSold?: number;
    salesCount?: number;
};

type Row = {
    name: string;
    sold: number;
};

export default function BestSelling() {
    const { data, isLoading, isError } = useGetBestSellersQuery();

    const rows: Row[] = useMemo(() => {
        const items: ApiItem[] = data?.data ?? [];
        return items
            .map((p) => ({
                name: p.name,
                sold: Number(p.totalSold ?? p.salesCount ?? 0),
            }))
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);
    }, [data]);

    return (
        <div className="bg-white p-4 sm:p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Best Selling</h2>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">This Week</span>
            </div>

            {isLoading ? (
                <div className="space-y-2.5 py-4">
                    <div className="h-3.5 w-3/5 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3.5 w-4/5 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3.5 w-2/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3.5 w-5/6 bg-gray-100 rounded animate-pulse" />
                </div>
            ) : isError ? (
                <p className="text-rose-500 text-xs py-4">Failed to load best sellers.</p>
            ) : rows.length === 0 ? (
                <p className="text-gray-400 text-xs py-4">No sales data found.</p>
            ) : (
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={110}
                                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                                stroke="#9ca3af"
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(v: any) => [`${v} units`, "Sold"]}
                                labelFormatter={(label) => `${label}`}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    padding: "6px 10px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                                }}
                            />
                            <Bar dataKey="sold" fill="#FB923C" radius={[0, 4, 4, 0]} maxBarSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}