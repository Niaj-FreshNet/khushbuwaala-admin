"use client";

/**
 * Low stock & out of stock.
 * Stock is kept per product in liquid units (ml / gm), and every size is filled from it, so
 * the alert is per product (A-15): "stock ≤ threshold". Each row also shows how many bottles of
 * the smallest size are left, which is what the shop actually runs out of first.
 * The threshold is remembered on this device.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageX, Plus, Search, ShieldAlert, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useGetAllProductsAdminQuery } from "@/redux/store/api/product/productApi";
import type { IProductResponse } from "@/types/product.types";
import RestockDialog from "@/components/admin/RestockDialog";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { cn } from "@/lib/utils";

const THRESHOLD_KEY = "kw_lowstock_threshold";

const smallestSize = (p: IProductResponse) => {
  const sizes = (p.variants || []).map((v) => Number(v.size) || 0).filter((s) => s > 0);
  return sizes.length ? Math.min(...sizes) : 0;
};

function Row({ p, tone, onRestock, canRestock }: { p: IProductResponse; tone: "out" | "low"; onRestock: () => void; canRestock: boolean }) {
  const unit = p.category?.unit || "ML";
  const stock = Number(p.totalStock ?? 0);
  const min = smallestSize(p);
  const bottles = min > 0 ? Math.floor(Math.max(0, stock) / min) : null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-2.5 rounded-lg border", tone === "out" ? "border-rose-100 bg-rose-50/30" : "border-orange-100 bg-orange-50/20")}>
      <div className="min-w-0 flex-1 basis-40">
        <p className="font-bold text-sm sm:text-xs text-gray-900 break-words">{p.name}</p>
        <p className="text-[11px] sm:text-[10px] text-gray-500">
          {p.category?.categoryName || "General"}
          {bottles !== null && <> · ≈ {bottles} × {min} {unit.toLowerCase()} left</>}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Badge className={cn("text-[11px] sm:text-[10px] h-6 sm:h-5 text-white", tone === "out" ? "bg-rose-600" : "bg-amber-500")}>
          {stock} {unit}
        </Badge>
        {canRestock && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-[11px] h-9 sm:h-6 px-3 sm:px-2.5" onClick={onRestock}>
            <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1" /> Restock
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LowStockAlertPageClient() {
  const { user } = useAuth();
  const canRestock = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const [searchTerm, setSearchTerm] = useState("");
  const [threshold, setThreshold] = useState(10);
  const [restockOpen, setRestockOpen] = useState(false);
  const [selected, setSelected] = useState<IProductResponse | null>(null);
  // Hidden products (e.g. the premium bottle, D-016) usually have no tracked stock; leave them out unless asked.
  const [showHidden, setShowHidden] = useState(false);

  // Remember the threshold on this device
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(THRESHOLD_KEY));
      if (saved > 0) setThreshold(saved);
    } catch {}
  }, []);
  const changeThreshold = (n: number) => {
    const v = Math.max(1, n || 1);
    setThreshold(v);
    try { localStorage.setItem(THRESHOLD_KEY, String(v)); } catch {}
  };

  const { data, isLoading, isFetching, refetch } = useGetAllProductsAdminQuery({ searchTerm, page: 1, limit: 5000, sortBy: "name" });
  const all: IProductResponse[] = useMemo(() => data?.data || [], [data]);

  const lowList = useMemo(
    () => all.filter((p) => (showHidden || (p as any).published !== false) && (p.totalStock ?? 0) <= threshold),
    [all, threshold, showHidden]
  );
  const critical = useMemo(() => lowList.filter((p) => (p.totalStock ?? 0) <= 0), [lowList]);
  const low = useMemo(
    () => lowList.filter((p) => (p.totalStock ?? 0) > 0).sort((a, b) => (a.totalStock ?? 0) - (b.totalStock ?? 0)),
    [lowList]
  );

  const openRestock = (p: IProductResponse) => { setSelected(p); setRestockOpen(true); };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto w-full space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Low stock & out of stock</h1>
              <p className="text-[11px] sm:text-[10px] text-gray-500">
                Products with {threshold} ml/gm or less {isFetching ? "(updating…)" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input placeholder="Search…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-10 sm:h-7 text-xs bg-white border-gray-300" />
            </div>
            <label className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-gray-600">Alert at ≤</span>
              <Input type="number" inputMode="numeric" min={1} value={threshold} onChange={(e) => changeThreshold(Number(e.target.value))} className="w-16 h-10 sm:h-7 text-xs bg-white border-gray-300" />
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 px-1 text-[11px] text-gray-600">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          Include products hidden from the website
        </label>

        {critical.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs font-semibold text-rose-900">
              <b>{critical.length}</b> product{critical.length > 1 ? "s are" : " is"} out of stock.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-2xs flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="font-semibold text-xs text-gray-600">Loading…</p>
          </div>
        ) : lowList.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-2xs">
            <p className="font-bold text-xs text-gray-800">All stock levels are healthy</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Nothing at or below {threshold}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {critical.length > 0 && (
              <Card className="border-rose-200 shadow-2xs bg-white rounded-xl overflow-hidden gap-0 py-0">
                <CardHeader className="bg-rose-50/50 py-2 px-3.5 border-b border-rose-100 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                    <PackageX className="w-3.5 h-3.5" /> Out of stock
                  </CardTitle>
                  <Badge className="bg-rose-600 text-white text-[10px]">{critical.length}</Badge>
                </CardHeader>
                <CardContent className="p-2.5 space-y-1.5 lg:max-h-[70vh] lg:overflow-y-auto">
                  {critical.map((p) => <Row key={p.id} p={p} tone="out" canRestock={canRestock} onRestock={() => openRestock(p)} />)}
                </CardContent>
              </Card>
            )}
            {low.length > 0 && (
              <Card className={cn("border-orange-200 shadow-2xs bg-white rounded-xl overflow-hidden gap-0 py-0", critical.length === 0 && "lg:col-span-2")}>
                <CardHeader className="bg-orange-50/50 py-2 px-3.5 border-b border-orange-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">Running low (≤ {threshold})</CardTitle>
                  <Badge className="bg-orange-500 text-white text-[10px]">{low.length}</Badge>
                </CardHeader>
                <CardContent className="p-2.5 space-y-1.5 lg:max-h-[70vh] lg:overflow-y-auto">
                  {low.map((p) => <Row key={p.id} p={p} tone="low" canRestock={canRestock} onRestock={() => openRestock(p)} />)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <RestockDialog product={selected} open={restockOpen} onOpenChange={setRestockOpen} onDone={refetch} />
    </div>
  );
}
