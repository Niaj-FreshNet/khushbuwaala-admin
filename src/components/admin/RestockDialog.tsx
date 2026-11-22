"use client";

/**
 * One restock form for the Stock and Low Stock pages (A-11).
 *
 * - SUPER_ADMIN: "Purchase with cost" (default). Records the bill, adds the stock and
 *   updates the weighted average cost. Can switch to "Adjust only" for count corrections.
 * - ADMIN: "Adjust only" (adds stock without a cost; cost data is super-admin only).
 *   The form says so, so nobody thinks the purchase bill was recorded.
 */
import { useEffect, useMemo, useState } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useGetLiveWACQuery, useReceiveStockPurchaseMutation } from "@/redux/store/api/finance/financeApi";
import { useUpdateProductStockMutation } from "@/redux/store/api/product/productApi";
import { formatTaka } from '@/lib/money';

export type RestockProduct = {
  id: string;
  name: string;
  supplier?: string | null;
  totalStock?: number | null;
  category?: { unit?: string | null } | null;
};

type Mode = "purchase" | "adjust";

const freshLines = () => [
  { category: "STOCK_BILL", amount: 0, label: "Main liquid bill" },
  { category: "CARRYING", amount: 0, label: "Shipping / courier to shop" },
];

const money = (n: number) => formatTaka(n, 2);

export default function RestockDialog({
  product,
  open,
  onOpenChange,
  onDone,
}: {
  product: RestockProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const unit = product?.category?.unit || "ML";

  const [mode, setMode] = useState<Mode>("purchase");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [billNo, setBillNo] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState(freshLines);
  const [reason, setReason] = useState("RESTOCK");

  // Reset the form each time it opens for a product
  useEffect(() => {
    if (!open) return;
    setMode(isSuperAdmin ? "purchase" : "adjust");
    setQuantity("");
    setSupplier(product?.supplier || "");
    setBillNo("");
    setNote("");
    setLines(freshLines());
    setReason("RESTOCK");
  }, [open, product?.id, product?.supplier, isSuperAdmin]);

  const { data: wacData } = useGetLiveWACQuery(product?.id || "", { skip: !open || !product?.id || !isSuperAdmin });
  const [receiveStock, { isLoading: savingPurchase }] = useReceiveStockPurchaseMutation();
  const [updateStock, { isLoading: savingAdjust }] = useUpdateProductStockMutation();
  const saving = savingPurchase || savingAdjust;

  const qty = Number(quantity);
  const totalCost = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines]);
  const currentWAC = wacData?.data?.avgCostPerUnit || 0;
  const current = Number(product?.totalStock ?? 0);
  // Weighted average after this purchase (negative stock counts as 0, like the server)
  const newWAC = qty > 0 ? (Math.max(0, current) * currentWAC + totalCost) / (Math.max(0, current) + qty) : currentWAC;

  const canRemove = mode === "adjust" && reason === "ADJUSTMENT";
  const qtyValid = Number.isFinite(qty) && qty !== 0 && (qty > 0 || canRemove);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!qtyValid) {
      toast.error(canRemove ? "Enter a quantity other than 0" : "Quantity must be greater than 0");
      return;
    }
    try {
      if (mode === "purchase") {
        await receiveStock({
          productId: product.id,
          payload: { quantity: qty, unit, supplier, billNo, note, costLines: lines as any },
        }).unwrap();
        toast.success(`Added ${qty} ${unit} to ${product.name}; average cost updated`);
      } else {
        await updateStock({ productId: product.id, addedStock: qty, reason }).unwrap();
        toast.success(`${qty > 0 ? "Added" : "Removed"} ${Math.abs(qty)} ${unit} ${qty > 0 ? "to" : "from"} ${product.name}`);
      }
      onOpenChange(false);
      onDone?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not update the stock");
    }
  };

  const field = "h-10 sm:h-8 text-sm sm:text-xs border-gray-300 bg-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[440px] rounded-xl p-4 sm:p-5 text-xs bg-white overflow-y-auto max-h-[92vh]">
        <DialogHeader className="border-b pb-3 text-left">
          <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5 pr-6">
            <PackagePlus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Restock: {product?.name}</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-gray-500">
            In stock now: <b className="text-gray-800">{current} {unit}</b>
            {isSuperAdmin && mode === "purchase" && <> · average cost <b className="text-gray-800">{money(currentWAC)}</b> / {unit}</>}
          </DialogDescription>
        </DialogHeader>

        {isSuperAdmin && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" role="tablist">
            {([["purchase", "Purchase with cost"], ["adjust", "Adjust only"]] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn("h-9 sm:h-7 rounded-md text-xs font-semibold", mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "adjust" && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
              {isSuperAdmin
                ? "Changes the count only. No cost is recorded and the average cost stays the same."
                : "Adds stock without a cost. If this is a new purchase, ask the super admin to record the bill so profit stays accurate."}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[11px] font-semibold text-gray-700">
                Quantity ({unit}) *{canRemove && <span className="font-normal text-gray-500"> (minus to remove)</span>}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                required
                autoFocus
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={field}
                placeholder="e.g. 500"
              />
            </label>

            {mode === "adjust" ? (
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-gray-700">Reason *</span>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className={field}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTOCK">Restock / new shipment</SelectItem>
                    <SelectItem value="ADJUSTMENT">Count correction</SelectItem>
                    <SelectItem value="RETURN">Customer return</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            ) : (
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-gray-700">Supplier</span>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={field} placeholder="e.g. Lattafa UAE" />
              </label>
            )}
          </div>

          {mode === "purchase" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="text-[11px] font-semibold text-gray-700">Bill / invoice no</span>
                  <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} className={field} placeholder="e.g. INV-9982" />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[11px] font-semibold text-gray-700">Note</span>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Optional" />
                </label>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <p className="text-[11px] font-bold text-gray-800 border-b pb-1">Purchase cost</p>
                {lines.map((line, idx) => (
                  <label key={line.category} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-600 flex-1">{line.label}</span>
                    <span className="relative w-36 sm:w-32">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">৳</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={line.amount || ""}
                        onChange={(e) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, amount: Number(e.target.value) } : l)))}
                        className={cn(field, "pl-6 text-right font-semibold")}
                      />
                    </span>
                  </label>
                ))}
                <div className="flex justify-between pt-2 border-t font-bold text-gray-900 text-xs">
                  <span>Total</span>
                  <span className="text-emerald-700">{money(totalCost)}</span>
                </div>
                {qty > 0 && (
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>Cost of this purchase / {unit}</span>
                    <span>{money(totalCost / qty)}</span>
                  </div>
                )}
                {qty > 0 && (
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>New average cost / {unit}</span>
                    <span className="font-semibold text-gray-900">{money(newWAC)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 sm:h-8 text-xs w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !qtyValid} className="h-10 sm:h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {mode === "purchase" ? "Save purchase" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
