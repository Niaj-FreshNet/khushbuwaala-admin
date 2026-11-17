"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, PackageX, Plus, Search, ShieldAlert, PackagePlus, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useGetAllProductsAdminQuery, useUpdateProductStockMutation } from "@/redux/store/api/product/productApi";
import type { IProductResponse } from "@/types/product.types";
import { cn } from "@/lib/utils";

export default function LowStockAlertPageClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [threshold, setThreshold] = useState(10);

  // Inline Restock Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductResponse | null>(null);
  const [addedStock, setAddedStock] = useState<number>(15);
  const [restockReason, setRestockReason] = useState<string>("RESTOCK");

  const { data, isLoading, isFetching, refetch } = useGetAllProductsAdminQuery({
    searchTerm,
    page: 1,
    limit: 5000,
    sortBy: "name",
  });

  const [updateProductStock, { isLoading: isUpdating }] = useUpdateProductStockMutation();

  const allProducts: IProductResponse[] = useMemo(() => data?.data || [], [data]);

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

  const handleOpenRestock = (product: IProductResponse) => {
    setSelectedProduct(product);
    setAddedStock(15);
    setRestockReason("RESTOCK");
    setRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await updateProductStock({
        productId: selectedProduct.id,
        addedStock: Number(addedStock),
        reason: restockReason,
      }).unwrap();

      toast.success(`Successfully restocked ${selectedProduct.name}!`);
      setRestockModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to update stock:', error);
      toast.error('Failed to update stock.');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col overflow-y-auto text-xs">
      <div className="max-w-7xl mx-auto w-full space-y-2.5">
        {/* Top Header & Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Low Stock & Out of Stock Alerts</h1>
              <p className="text-[10px] text-gray-500">Products requiring inventory attention (Threshold ≤ {threshold}) {isFetching ? "(updating...)" : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-7 text-xs bg-white border-gray-300 shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-gray-600">Threshold:</span>
              <Input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 h-7 text-xs bg-white border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Critical Banner */}
        {critical.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="text-xs font-semibold text-rose-900">
                <span className="font-bold">{critical.length}</span> product{critical.length > 1 ? "s are" : " is"} completely out of stock.
              </p>
            </div>
            <Badge className="bg-rose-600 text-white text-[10px] font-bold">Critical Action Needed</Badge>
          </div>
        )}

        {/* ⚡ FIXED: Properly check loading state first before declaring empty lists */}
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-2xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="font-semibold text-xs text-gray-600">Loading stock alerts...</p>
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-2xs">
            <p className="font-bold text-xs text-gray-800">All inventory levels are healthy!</p>
            <p className="text-[10px] text-gray-400 mt-0.5">No products found below the stock threshold of {threshold}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {/* Critical Out of Stock Card */}
            {critical.length > 0 && (
              <Card className="border-rose-200 shadow-2xs bg-white rounded-xl overflow-hidden">
                <CardHeader className="bg-rose-50/50 py-2 px-3.5 border-b border-rose-100 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                    <PackageX className="w-3.5 h-3.5" /> Out of Stock (0 Left)
                  </CardTitle>
                  <Badge className="bg-rose-600 text-white text-[10px]">{critical.length}</Badge>
                </CardHeader>
                <CardContent className="p-2.5 space-y-1.5 max-h-[300px] overflow-y-auto">
                  {critical.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-rose-100 bg-rose-50/30">
                      <div>
                        <p className="font-bold text-xs text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">Category: {p.category?.categoryName || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="bg-rose-600 text-[10px] h-5">0 Stock</Badge>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-6 px-2.5 shadow-2xs transition-colors"
                          onClick={() => handleOpenRestock(p)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Low Stock Card */}
            {low.length > 0 && (
              <Card className={cn("border-orange-200 shadow-2xs bg-white rounded-xl overflow-hidden", critical.length === 0 && "lg:col-span-2")}>
                <CardHeader className="bg-orange-50/50 py-2 px-3.5 border-b border-orange-100 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                    Low Stock Alert (≤ {threshold})
                  </CardTitle>
                  <Badge className="bg-orange-500 text-white text-[10px]">{low.length}</Badge>
                </CardHeader>
                <CardContent className="p-2.5 space-y-1.5 max-h-[300px] overflow-y-auto">
                  {low.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-orange-100 bg-orange-50/20">
                      <div>
                        <p className="font-bold text-xs text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">Category: {p.category?.categoryName || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500 text-white text-[10px] h-5">{p.totalStock} {p.category?.unit || 'Units'} Left</Badge>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-6 px-2.5 shadow-2xs transition-colors"
                          onClick={() => handleOpenRestock(p)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Restock
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

      {/* INLINE RESTOCK MODAL DIALOG */}
      <Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-xl p-4 text-xs">
          <DialogHeader className="border-b pb-2 mb-2">
            <DialogTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <PackagePlus className="w-4 h-4 text-emerald-600" /> Restock: {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRestockSubmit} className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">Current Inventory</label>
              <div className="text-xs font-bold text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">
                {selectedProduct?.totalStock ?? 0} {selectedProduct?.category?.unit || 'Units'} currently available
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">Quantity to Add *</label>
              <Input
                type="number"
                min={1}
                value={addedStock}
                onChange={(e) => setAddedStock(Number(e.target.value))}
                className="h-7 text-xs border-gray-300 bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">Reason *</label>
              <Select value={restockReason} onValueChange={(val) => setRestockReason(val)}>
                <SelectTrigger className="h-7 text-xs border-gray-300 bg-white">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTOCK">Restock / New Shipment</SelectItem>
                  <SelectItem value="ADJUSTMENT">Inventory Adjustment</SelectItem>
                  <SelectItem value="RETURN">Customer Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRestockModalOpen(false)}
                className="h-6 text-[11px] border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating}
                className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isUpdating ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}