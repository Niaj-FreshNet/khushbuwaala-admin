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
            .slice(0, 6);
    }, [data]);

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Best Selling</h2>
                <span className="text-xs text-gray-500">This Week</span>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-4 w-3/5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                </div>
            ) : isError ? (
                <p className="text-red-500 text-sm">Failed to load best sellers.</p>
            ) : rows.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales data found.</p>
            ) : (
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 5, right: 16, left: 40, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={140}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(v: any) => [`${v}`, "Sold"]}
                                labelFormatter={(label) => `Product: ${label}`}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 10,
                                }}
                            />
                            <Bar dataKey="sold" radius={[6, 6, 6, 6]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Small list under chart (clean) */}
            {!isLoading && !isError && rows.length > 0 && (
                <div className="mt-4 space-y-2">
                    {rows.map((r) => (
                        <div key={r.name} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate pr-3">{r.name}</span>
                            <span className="font-semibold text-gray-900">{r.sold}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}