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
            .slice(0, 5); // Clean top 5 items for balanced container height
    }, [data]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-7 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-stone-900 font-serif tracking-tight">
                        Best Selling
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">Top performing products</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3.5 py-8 animate-pulse">
                    <div className="h-4 w-3/5 bg-stone-100 rounded-lg" />
                    <div className="h-4 w-4/5 bg-stone-100 rounded-lg" />
                    <div className="h-4 w-2/3 bg-stone-100 rounded-lg" />
                    <div className="h-4 w-5/6 bg-stone-100 rounded-lg" />
                </div>
            ) : isError ? (
                <div className="py-12 text-center">
                    <p className="text-red-500 text-xs font-medium">Failed to load best sellers.</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-stone-400 text-xs font-medium">No sales data found.</p>
                </div>
            ) : (
                <>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={rows}
                                layout="vertical"
                                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={110}
                                    tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: any) => [`${v} units`, "Total Sold"]}
                                    labelFormatter={(label) => `${label}`}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #E2E8E4",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                                        fontSize: 12,
                                    }}
                                />
                                <Bar dataKey="sold" fill="#1b382b" radius={[0, 6, 6, 0]} maxBarSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Clean compact list under chart */}
                    <div className="mt-5 pt-4 border-t border-stone-100 space-y-2.5">
                        {rows.map((r, i) => (
                            <div key={r.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate pr-2">
                                    <span className="w-4 text-stone-400 font-mono text-[10px]">0{i + 1}</span>
                                    <span className="text-stone-700 font-medium truncate">{r.name}</span>
                                </div>
                                <span className="font-bold text-[#1b382b] bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/60">
                                    {r.sold} sold
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}