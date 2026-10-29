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
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                <div className="flex space-x-4">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="inline-block w-4 h-4 bg-orange-400 rounded-full mr-1"></span>
                        Sales
                    </span>
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="inline-block w-4 h-4 border-2 bg-black border-dashed border-black rounded-full mr-1"></span>
                        Orders
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 12 }}
                        domain={[0, "dataMax + 500"]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            color: "#000",
                        }}
                        itemStyle={{ color: "#000" }}
                        formatter={(value: number, name: string) => [
                            <span key="value" className="font-bold">
                                {name === "sales" ? `${value} BDT` : value}
                            </span>,
                            <span key="label">{name === "sales" ? "Sales" : "Orders"}</span>,
                        ]}
                        labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="sales"
                        name="sales"
                        stroke="#FFA500"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#FFA500" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="orders"
                        name="orders"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#000000" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdminRevenueChart;