"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, PackageX, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useGetAllProductsAdminQuery } from "@/redux/store/api/product/productApi";
import type { IProductResponse } from "@/types/product.types";

export default function LowStockAlertPageClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [threshold, setThreshold] = useState(10);
  const router = useRouter();

  // ✅ fetch all products (no pagination so you can see all alerts)
  const { data, isLoading, isFetching } = useGetAllProductsAdminQuery({
    searchTerm,
    page: 1,
    limit: 5000, // big limit so you get all
    sortBy: "name",
    // stock: undefined (we want both in/out then filter by threshold)
  });

  const allProducts: IProductResponse[] = useMemo(() => data?.data || [], [data]);

  // ✅ only low stock products
  const lowStockProducts = useMemo(() => {
    return allProducts.filter((p) => (p.totalStock ?? 0) <= threshold);
  }, [allProducts, threshold]);

  const critical = useMemo(
    () => lowStockProducts.filter((p) => (p.totalStock ?? 0) <= 0),
    [lowStockProducts]
  );

  const low = useMemo(
    () => lowStockProducts.filter((p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= threshold),
    [lowStockProducts, threshold]
  );

  const handleAddStock = (productId: string) => {
    router.push(`/dashboard/stock/add?productId=${productId}`);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#FB923C]">Low Stock Alerts</h1>
            <p className="text-sm text-gray-600">
              Showing products with stock ≤ <span className="font-semibold">{threshold}</span>
              {isFetching ? " (updating...)" : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Search by Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 border-[#FB923C] focus:ring-[#FB923C]"
              prefix={<Search className="w-4 h-4 text-gray-500" />}
            />
            <Input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(1, Number(e.target.value) || 1))}
              className="w-36 border-[#FB923C] focus:ring-[#FB923C]"
              placeholder="Threshold"
            />
          </div>
        </div>

        {/* banner */}
        {critical.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-700">Critical alert</p>
                <p className="text-sm text-red-700/90">
                  {critical.length} product{critical.length > 1 ? "s are" : " is"} out of stock.
                </p>
              </div>
              <Badge className="bg-red-600 text-white">{critical.length} Critical</Badge>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-500">Loading low stock products...</p>
        ) : lowStockProducts.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            No low stock products found for the current threshold.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Critical */}
            {critical.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <PackageX className="w-5 h-5" /> Critical (Out of Stock)
                  </CardTitle>
                  <Badge className="bg-red-600 text-white">Stock = 0</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {critical.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border bg-red-50 p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-600">{p.category?.name ?? "Category"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-600 text-white">0 Stock</Badge>
                        <Button
                          className="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
                          onClick={() => handleAddStock(p.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Low */}
            {low.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-orange-700">Low Stock</CardTitle>
                  <Badge className="bg-[#FB923C] text-white">≤ {threshold}</Badge>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3 pt-6">
                  {low.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border bg-white p-4 hover:bg-orange-50"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-600">{p.category?.name ?? "Category"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#4CD964] text-white">{p.totalStock} Left</Badge>
                        <Button
                          className="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
                          onClick={() => handleAddStock(p.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
