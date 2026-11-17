// File: components/AdminChartData.tsx
"use client";

import { useState } from "react";
import { 
    useGetWeeklySalesOverviewQuery, 
    useGetMonthlySalesOverviewQuery 
} from "@/redux/store/api/order/ordersApi";
import AdminSalesOrdersBreakdownChart from "./AdminSalesOrdersBreakdownChart";

type DashboardType = "all" | "website" | "manual";

export default function AdminChartData({ type }: { type: DashboardType }) {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

    const { data: weeklyRes, isLoading: weeklyLoading } = useGetWeeklySalesOverviewQuery({ type });
    const { data: monthlyRes, isLoading: monthlyLoading } = useGetMonthlySalesOverviewQuery({ 
        type, 
        year: selectedYear, 
        month: selectedMonth 
    });

    // Directly map weekly data from backend response array
    const rawWeeklyArray = Array.isArray(weeklyRes) ? weeklyRes : (weeklyRes as any)?.data || (weeklyRes as any)?.result || [];
    const weeklyData = rawWeeklyArray.map((item: any) => ({
        ...item,
        day: item.day || item.date,
        totalSales: Number(item.totalSales ?? item.sales ?? 0),
        totalNetReceivable: Number(item.totalNetReceivable ?? item.netReceivable ?? 0),
        totalOrders: Number(item.totalOrders ?? item.ordersCount ?? 0),
        orders: item.orders || [],
    }));

    const rawMonthlyArray = Array.isArray(monthlyRes) ? monthlyRes : (monthlyRes as any)?.data || (monthlyRes as any)?.result || [];
    const monthlyData = rawMonthlyArray.map((item: any) => ({
        ...item,
        totalSales: Number(item.totalSales ?? item.sales ?? 0),
        totalNetReceivable: Number(item.totalNetReceivable ?? item.netReceivable ?? 0),
        totalOrders: Number(item.totalOrders ?? item.ordersCount ?? 0),
        orders: item.orders || [],
    }));

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    return (
        <div className="w-full">
            <AdminSalesOrdersBreakdownChart
                weeklyData={weeklyData}
                monthlyData={monthlyData}
                isLoading={weeklyLoading || monthlyLoading}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
            />
        </div>
    );
}