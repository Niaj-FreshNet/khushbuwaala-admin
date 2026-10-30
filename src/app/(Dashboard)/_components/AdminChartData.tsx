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

    const weeklyData = (weeklyRes?.data || []).map((item: any) => ({
        ...item,
        totalSales: item.sales ?? 0,
        totalOrders: item.orders ?? 0,
    }));

    const monthlyData = (monthlyRes?.data || []).map((item: any) => ({
        ...item,
        totalSales: item.sales ?? 0,
        totalOrders: item.orders ?? 0,
    }));

    // Handlers for going back or forward one month
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