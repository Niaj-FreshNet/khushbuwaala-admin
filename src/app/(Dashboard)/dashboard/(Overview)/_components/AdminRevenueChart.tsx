// File: components/AdminRevenueChart.tsx
'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

interface ChartPoint {
    day: string;
    sales: number;
    orders: number;
}

interface RevenueChartProps {
    title?: string;
    weeklyData: ChartPoint[];
}

const formatCurrency = (value: number) => {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return `${value}`;
};

const AdminRevenueChart: React.FC<RevenueChartProps> = ({
    title = "Weekly Sales",
    weeklyData,
}) => {
    const data = weeklyData?.length > 0 ? weeklyData : [];

    return (
        <div className="bg-white p-4 sm:p-5">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                <div className="flex space-x-3 text-xs">
                    <span className="font-semibold text-gray-700 flex items-center">
                        <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-1" />
                        Sales
                    </span>
                    <span className="font-semibold text-gray-700 flex items-center">
                        <span className="inline-block w-3 h-3 bg-black rounded-full mr-1" />
                        Orders
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 11 }}
                        stroke="#9ca3af"
                        domain={[0, "dataMax + 500"]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            color: "#111827",
                            fontSize: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                        }}
                        itemStyle={{ color: "#111827" }}
                        formatter={(value: number, name: string) => [
                            <span key="value" className="font-bold">
                                {name === "sales" ? `${value} BDT` : value}
                            </span>,
                            <span key="label" className="text-gray-500 capitalize">{name === "sales" ? "Sales" : "Orders"}</span>,
                        ]}
                        labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="sales"
                        name="sales"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#F59E0B" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="orders"
                        name="orders"
                        stroke="#111827"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#111827" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdminRevenueChart;