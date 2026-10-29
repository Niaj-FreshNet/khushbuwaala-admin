"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  ShoppingCart,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  DollarSign,
  CheckCircle2,
  Clock,
  UserX,
  Package,
  Loader2,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useGetAllCartsQuery,
  useRemoveCartItemMutation,
} from "@/redux/store/api/cart/cartApi";
import { toast } from "sonner";

export default function AdminAllCartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const limit = 100;

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, limit };
    if (statusFilter !== "ALL") p.status = statusFilter;
    if (searchTerm.trim()) p.searchTerm = searchTerm.trim();
    return p;
  }, [page, limit, statusFilter, searchTerm]);

  const { data: response, isLoading, isFetching, refetch } = useGetAllCartsQuery(queryParams);
  const [removeCartItem, { isLoading: isDeleting }] = useRemoveCartItemMutation();

  const cartList: any[] = response?.data || [];
  const meta = response?.meta || { page: 1, total: 0, totalPage: 1 };

  // Calculate top KPI totals from the current view / set
  const metrics = useMemo(() => {
    let pipelineValue = 0;
    let inCartCount = 0;
    let orderedCount = 0;
    let guestCount = 0;

    cartList.forEach((it) => {
      const lineTotal = Number(it.price || 0) * Number(it.quantity || 1);
      if (it.status === "IN_CART") {
        pipelineValue += lineTotal;
        inCartCount++;
      } else if (it.status === "ORDERED") {
        orderedCount++;
      }
      if (!it.userId && !it.user) guestCount++;
    });

    return { pipelineValue, inCartCount, orderedCount, guestCount };
  }, [cartList]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cart record?")) return;
    try {
      await removeCartItem(id).unwrap();
      toast.success("Cart item removed");
      if (inspectItem?.id === id) setInspectItem(null);
    } catch {
      toast.error("Failed to delete cart item");
    }
  };

  const formatBDT = (val: number) => `৳${Math.round(val || 0).toLocaleString("en-BD")}`;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "IN_CART":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-amber-500 text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            IN CART
          </span>
        );
      case "ORDERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            ORDERED
          </span>
        );
      case "SOLD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-sky-600 text-white shadow-sm">
            SOLD
          </span>
        );
      default:
        return <Badge variant="outline" className="text-xs font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/40 px-2 pt-0.5 pb-2 sm:px-3 sm:pt-0.5 sm:pb-2 space-y-1.5 mt-0">

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-100/70 text-red-600 rounded-lg">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900 leading-tight">Cart Pipeline & Bags</h1>
            <p className="text-[11px] text-gray-500">Monitor live shopper bags, abandoned items, and converted checkouts.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              <Loader2 className="w-3 h-3 animate-spin text-red-600" /> Syncing...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 bg-white shadow-2xs border-gray-300 h-7 text-xs px-2.5 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Active Pipeline</p>
            <h3 className="text-sm font-bold text-gray-900">{formatBDT(metrics.pipelineValue)}</h3>
            <p className="text-[9px] text-amber-600 font-medium">Potential checkout value</p>
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Pending Carts</p>
            <h3 className="text-sm font-bold text-gray-900">{metrics.inCartCount}</h3>
            <p className="text-[9px] text-gray-500 font-medium">Items currently in cart</p>
          </div>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Converted Items</p>
            <h3 className="text-sm font-bold text-emerald-600">{metrics.orderedCount}</h3>
            <p className="text-[9px] text-emerald-600 font-medium">Successfully placed orders</p>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Guest Visitors</p>
            <h3 className="text-sm font-bold text-purple-600">{metrics.guestCount}</h3>
            <p className="text-[9px] text-gray-500 font-medium">Unregistered shopper bags</p>
          </div>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
            <UserX className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Control / Filter Bar with Dynamic Active Coloring */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-2xs flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Filter by product, SKU, customer name, email or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className={cn(
              "pl-8 h-7 text-xs bg-white shadow-2xs transition-colors",
              searchTerm.trim() ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className={cn(
              "w-[160px] h-7 text-xs bg-white transition-colors",
              statusFilter !== "ALL" ? "border-[#FB923C] text-[#FB923C] font-semibold bg-orange-50/30" : "border-gray-300 text-gray-700"
            )}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="IN_CART">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white mr-1.5">IN CART</span> Active
              </SelectItem>
              <SelectItem value="ORDERED">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white mr-1.5">ORDERED</span> Converted
              </SelectItem>
              <SelectItem value="SOLD">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white mr-1.5">SOLD</span> Direct Sold
              </SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-6 px-2 font-semibold"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Container (Enhanced Data Density & Increased Fonts for Necessary Fields) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-3 py-2 bg-gray-50/75 border-b border-gray-200 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900">
              Cart Records ({meta.total})
            </h3>
            <p className="text-[10px] text-gray-500">
              Page {meta.page} of {meta.totalPage || 1}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/75 border-b border-gray-200 text-gray-700">
              <TableRow>
                <TableHead className="w-[50px] pl-3 py-2.5 font-bold text-xs">Item</TableHead>
                <TableHead className="min-w-[200px] py-2.5 font-bold text-xs">Product & Variant</TableHead>
                <TableHead className="min-w-[170px] py-2.5 font-bold text-xs">Shopper & Contact</TableHead>
                <TableHead className="min-w-[130px] py-2.5 font-bold text-xs">Pricing Details</TableHead>
                <TableHead className="text-center py-2.5 font-bold text-xs">Qty</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Line Total</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Status</TableHead>
                <TableHead className="py-2.5 font-bold text-xs">Last Modified</TableHead>
                <TableHead className="text-right pr-3 py-2.5 font-bold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                      <RefreshCw className="h-5 w-5 animate-spin text-red-600" />
                      <span className="text-xs font-medium">Loading cart database…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : cartList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-400">
                      <ShoppingCart className="h-7 w-7 stroke-[1.5] text-gray-300" />
                      <span className="text-sm font-semibold text-gray-700">No carts match your filter</span>
                      <span className="text-xs text-gray-400">Adjust your search keyword or selected status.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cartList.map((item: any) => {
                  const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
                  const sizeLabel = `${item.size ?? item.variant?.size ?? ""} ${String(item.unit ?? item.variant?.unit ?? "").toUpperCase()}`.trim();

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50/85 transition-colors">
                      {/* Image */}
                      <TableCell className="pl-3 py-2.5 align-top">
                        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <Image
                            src={item.product?.primaryImage || "/placeholder.png"}
                            alt={item.product?.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>

                      {/* Product & Variant */}
                      <TableCell className="py-2.5 align-top">
                        <div className="min-w-0 max-w-[220px]">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {item.product?.name || "Unlisted Product"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-600">
                            {sizeLabel && (
                              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                                {sizeLabel}
                              </span>
                            )}
                            {item.variant?.sku && (
                              <span className="truncate text-gray-500 font-mono text-[10px]">
                                {item.variant.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Shopper & Contact (Increased Font) */}
                      <TableCell className="py-2.5 align-top">
                        {item.user ? (
                          <div className="flex items-start gap-2">
                            <div className="h-7 w-7 rounded-full bg-red-50 text-red-700 font-bold flex items-center justify-center text-xs shrink-0 border border-red-100 mt-0.5">
                              {item.user.name?.slice(0, 1).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate" title={item.user.name}>{item.user.name}</p>
                              <p className="text-xs font-semibold text-gray-700 truncate" title={item.user.phone}>{item.user.phone || "No phone"}</p>
                              <p className="text-[10px] text-gray-500 truncate" title={item.user.email}>{item.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            Guest Visitor
                          </span>
                        )}
                      </TableCell>

                      {/* Pricing Details */}
                      <TableCell className="py-2.5 align-top">
                        <div className="text-xs font-bold text-gray-900">
                          {formatBDT(item.price)}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-[11px] text-gray-400 line-through">
                            {formatBDT(item.originalPrice)}
                          </div>
                        )}
                        {item.discount ? (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                            <Tag className="w-3 h-3" /> Discount: {item.discount}৳
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Quantity (Increased Font) */}
                      <TableCell className="text-center py-2.5 align-top">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded bg-gray-100 text-gray-900 font-black text-sm">
                          {item.quantity}
                        </span>
                      </TableCell>

                      {/* Line Total (Increased Font) */}
                      <TableCell className="text-sm font-black text-gray-900 py-2.5 align-top whitespace-nowrap">
                        {formatBDT(lineTotal)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          {renderStatusBadge(item.status)}
                          {item.order?.invoice && (
                            <Link
                              href={`/dashboard/orders/${item.order.id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
                            >
                              Invoice #{item.order.invoice}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs font-medium text-gray-600 py-2.5 align-top whitespace-nowrap">
                        {item.updatedAt ? format(new Date(item.updatedAt), "dd MMM yyyy, p") : "—"}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-right pr-3 py-2.5 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => setInspectItem(item)}
                            title="Inspect Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            disabled={isDeleting}
                            onClick={() => handleDelete(item.id)}
                            title="Remove Cart Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPage > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/50 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-semibold">
              Showing <span className="font-bold text-gray-900">{cartList.length}</span> of{" "}
              <span className="font-bold text-gray-900">{meta.total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
              >
                Previous
              </Button>
              <span className="text-xs text-gray-600 font-semibold px-1">
                Page {page} of {meta.totalPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPage}
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                className="bg-white border-gray-300 text-gray-700 h-7 text-xs px-3 font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Inspect Modal */}
      {inspectItem && (
        <Dialog open={Boolean(inspectItem)} onOpenChange={() => setInspectItem(null)}>
          <DialogContent className="max-w-md rounded-xl p-5">
            <DialogHeader className="space-y-1 pb-3 border-b border-gray-100">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-red-600" />
                Cart Record Inspector
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-mono">
                ID: {inspectItem.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="relative h-14 w-14 rounded-md overflow-hidden bg-white border shrink-0">
                  <Image
                    src={inspectItem.product?.primaryImage || "/placeholder.png"}
                    alt={inspectItem.product?.name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{inspectItem.product?.name}</h4>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Size: {inspectItem.size || inspectItem.variant?.size} {inspectItem.unit || inspectItem.variant?.unit}
                  </p>
                  <p className="font-black text-red-600 text-sm mt-1">
                    {formatBDT(inspectItem.price)} × {inspectItem.quantity} = {formatBDT(inspectItem.price * inspectItem.quantity)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div className="p-2.5 bg-gray-50 rounded-md">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">User Type</span>
                  <span className="font-bold text-gray-900 text-xs">
                    {inspectItem.user ? inspectItem.user.name : "Guest / Visitor"}
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-md">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Cart Status</span>
                  <span className="font-bold text-gray-900 text-xs">{inspectItem.status}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-md col-span-2">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Variant SKU</span>
                  <span className="font-mono text-xs text-gray-900 font-bold">{inspectItem.variant?.sku || "N/A"}</span>
                </div>
              </div>

              {inspectItem.order && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Linked Order</span>
                    <span className="font-bold text-emerald-900 text-sm">Invoice #{inspectItem.order.invoice}</span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="bg-white border-emerald-300 text-emerald-700 h-7 text-xs px-2.5 font-bold">
                    <Link href={`/dashboard/orders/${inspectItem.order.id}`} className="flex items-center gap-1">
                      View Order <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}