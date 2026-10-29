"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { format } from "date-fns";
import StoreContainer from "@/components/Layout/StoreContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardCopy,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Package,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  ListOrdered,
  HelpCircle,
  Hash,
} from "lucide-react";
import { useLazyTrackOrdersQuery } from "@/redux/store/api/order/ordersApi";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: ClipboardCopy },
  { key: "PROCESSING", label: "Processing", icon: Clock },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query");

  const [searchQuery, setSearchQuery] = useState(urlQuery || "");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  const [triggerTrackOrders, { data, isFetching, isUninitialized }] =
    useLazyTrackOrdersQuery();

  // Single Source of Truth: Listen directly to URL query param
  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      setSearchQuery(urlQuery.trim());
      setSelectedIndex(0);
      triggerTrackOrders(urlQuery.trim());
    }
  }, [urlQuery, triggerTrackOrders]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/shop");
    }
  };

  const orders: any[] = data?.data || [];
  const selectedOrder = orders[selectedIndex] || orders[0] || null;

  // Update URL param; the useEffect triggers data fetching
  const onSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.replace(`/track-order?query=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const selectOrder = (idx: number) => {
    setSelectedIndex(idx);
    setIsPickerOpen(false);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const activeStepIndex = useMemo(() => {
    if (!selectedOrder) return 0;
    const s = String(selectedOrder.status || "").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return 3;
    if (s === "SHIPPED") return 2;
    if (s === "PROCESSING" || s === "CONFIRMED") return 1;
    return 0;
  }, [selectedOrder]);

  const formatBDT = (amount: number) => `৳${Math.round(amount || 0).toLocaleString("en-BD")}`;

  const renderStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") {
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5">Delivered</Badge>;
    }
    if (s === "PROCESSING" || s === "CONFIRMED") {
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">Processing</Badge>;
    }
    if (s === "SHIPPED") {
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5">Shipped</Badge>;
    }
    if (s === "CANCELED") {
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-2 py-0.5">Canceled</Badge>;
    }
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5">Pending</Badge>;
  };

  return (
    <StoreContainer>
      <div className="min-h-screen bg-gray-50/70 pt-10 sm:pt-14 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8">
        <div className="container mx-auto px-3 sm:px-6 max-w-6xl space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Go back"
              className="h-8 w-8 rounded-full bg-white shadow-2xs hover:bg-gray-100 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                Track Your Order
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Real-time tracking for parcels and delivery updates
              </p>
            </div>
          </div>

          {/* Search Box */}
          <Card className="border-gray-200/80 shadow-2xs bg-white">
            <CardContent className="p-2.5 sm:p-3.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter Order ID, Phone no., or Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="h-9 sm:h-10 pl-9 text-xs sm:text-sm bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <Button
                  onClick={onSearch}
                  className="h-9 sm:h-10 px-5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs shrink-0"
                  disabled={!searchQuery.trim() || isFetching}
                >
                  {isFetching ? "Searching..." : "Track Order"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Guide Instructions */}
          {isUninitialized && orders.length === 0 && (
            <div className="rounded-xl border border-gray-200/70 bg-white p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>How to track your parcel</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex items-start gap-2">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">By Order ID</p>
                    <p className="text-[10.5px] text-gray-500 mt-0.5">Enter the order ID (Invoice no.) from your order Invoice or confirmation email (e.g. 586488).</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex items-start gap-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">By Phone Number</p>
                    <p className="text-[10.5px] text-gray-500 mt-0.5">Enter the contact number used during checkout to view all matching orders.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex items-start gap-2">
                  <div className="p-1 rounded bg-purple-100 text-purple-600 shrink-0 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">By Email Address</p>
                    <p className="text-[10.5px] text-gray-500 mt-0.5">Use your account or checkout email to review your complete shipment history.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Not Found State */}
          {!isFetching && orders.length === 0 && !isUninitialized && (
            <Card className="border-amber-200 bg-amber-50/70 shadow-2xs">
              <CardContent className="p-3.5 sm:p-4 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 text-xs sm:text-sm">No orders found</h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    No orders match <span className="font-semibold text-amber-900">"{searchQuery}"</span>. Please
                    check for typos or search using your mobile number.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading Indicator */}
          {isFetching && (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 bg-gray-200 rounded-xl" />
              <div className="h-44 bg-gray-200 rounded-xl" />
            </div>
          )}

          {/* Results: Stepper & Details */}
          {orders.length > 0 && selectedOrder && (
            <div className="space-y-3">
              {/* Mobile Multi-Order Selector */}
              {orders.length > 1 && (
                <div className="lg:hidden space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Orders Found ({orders.length})
                    </span>

                    <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-emerald-700 flex items-center gap-1 px-1">
                          <ListOrdered className="h-3 w-3" /> View All ({orders.length})
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] p-3.5">
                        <SheetHeader className="pb-2 text-left">
                          <SheetTitle className="text-sm font-bold">Select Order to Track</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[55vh] pr-1">
                          <div className="space-y-1.5 pb-4">
                            {orders.map((ord, idx) => (
                              <div
                                key={ord.id}
                                onClick={() => selectOrder(idx)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${idx === selectedIndex ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white"
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-gray-900">
                                      #{ord.invoice || ord.id.slice(-6)}
                                    </span>
                                    {renderStatusBadge(ord.status)}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {ord.createdAt ? format(new Date(ord.createdAt), "dd MMM yyyy") : ""} • {formatBDT(ord.amount)}
                                  </p>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Horizontal Scrollable Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                    {orders.map((ord, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={ord.id}
                          onClick={() => selectOrder(idx)}
                          className={`snap-start shrink-0 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${isSelected
                            ? "bg-white border-emerald-500 ring-1 ring-emerald-100 shadow-2xs"
                            : "bg-white/80 border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-[11px] text-gray-900">
                              #{ord.invoice || ord.id.slice(-6)}
                            </span>
                            {renderStatusBadge(ord.status)}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{formatBDT(ord.amount)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Master-Detail Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Desktop Left Sidebar: Order List */}
                {orders.length > 1 && (
                  <div className="hidden lg:block lg:col-span-4 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Orders Found ({orders.length})
                    </span>

                    <ScrollArea className="h-[520px] rounded-xl border border-gray-200/80 bg-white p-1.5">
                      <div className="space-y-1.5 pr-1.5">
                        {orders.map((ord, idx) => {
                          const isSelected = idx === selectedIndex;
                          return (
                            <div
                              key={ord.id}
                              onClick={() => selectOrder(idx)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                ? "bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/20 shadow-2xs"
                                : "bg-white border-gray-200/70 hover:border-gray-300"
                                }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 text-xs">
                                    #{ord.invoice || ord.id.slice(-6)}
                                  </span>
                                  {renderStatusBadge(ord.status)}
                                </div>
                                <p className="text-[10.5px] text-gray-500 mt-0.5">
                                  {ord.createdAt ? format(new Date(ord.createdAt), "dd MMM yyyy") : ""} •{" "}
                                  <span className="font-semibold text-gray-800">{formatBDT(ord.amount)}</span>
                                </p>
                              </div>
                              <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-emerald-700" : "text-gray-300"}`} />
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Right Side: Selected Order Details */}
                <div
                  ref={detailSectionRef}
                  className={`space-y-3.5 ${orders.length > 1 ? "lg:col-span-8" : "lg:col-span-12"}`}
                >
                  {/* Status Progress Stepper */}
                  <Card className="border-gray-200/80 shadow-2xs overflow-hidden bg-white">
                    <CardHeader className="p-3 border-b bg-gray-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div>
                          <CardTitle className="text-xs sm:text-sm font-bold text-gray-900">
                            Invoice: <span className="text-emerald-700 font-extrabold">#{selectedOrder.invoice || selectedOrder.id}</span>
                          </CardTitle>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                            Placed on {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "dd MMM yyyy, p") : "—"}
                          </p>
                        </div>
                        {renderStatusBadge(selectedOrder.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between relative">
                        {STATUS_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const isDone = idx <= activeStepIndex;
                          return (
                            <div key={step.key} className="flex-1 flex flex-col items-center z-10">
                              <div
                                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border transition-all ${isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                  : "bg-white border-gray-200 text-gray-300"
                                  }`}
                              >
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                              <span
                                className={`text-[10px] sm:text-[11px] mt-1.5 text-center font-medium ${isDone ? "text-gray-900 font-semibold" : "text-gray-400"
                                  }`}
                              >
                                {step.label}
                              </span>

                              {idx < STATUS_STEPS.length - 1 && (
                                <div
                                  className={`absolute top-4 sm:top-4.5 h-0.5 -z-10 transition-colors ${idx < activeStepIndex ? "bg-emerald-500" : "bg-gray-200"
                                    }`}
                                  style={{
                                    left: `${(100 / (STATUS_STEPS.length * 2)) * (idx * 2 + 1)}%`,
                                    width: `${100 / STATUS_STEPS.length}%`,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Items List */}
                  <Card className="border-gray-200/80 shadow-2xs bg-white">
                    <CardHeader className="border-b bg-gray-50/50 p-2.5 sm:p-3">
                      <CardTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-emerald-600" />
                        Items (
                        {selectedOrder.orderItems?.reduce((a: number, b: any) => a + (b.quantity || 1), 0) || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 divide-y divide-gray-100">
                      {(selectedOrder.orderItems || []).map((item: any) => {
                        const sizePart = item.size || item.variant?.size;
                        const unitPart = item.unit || item.variant?.unit;
                        return (
                          <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-lg overflow-hidden bg-gray-100 border shrink-0">
                                <Image
                                  src={item.product?.primaryImage || "/placeholder.png"}
                                  alt={item.product?.name || "Product"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 truncate">
                                  {item.product?.name || "Perfume Item"}
                                </h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Size: {sizePart} {String(unitPart || "").toUpperCase()}
                                </p>
                                <span className="text-[10.5px] text-gray-600 font-medium sm:hidden">
                                  Qty: {item.quantity} × {formatBDT(item.price)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-gray-400 hidden sm:block">Qty: {item.quantity}</p>
                              <p className="text-xs font-bold text-gray-900">
                                {formatBDT(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Summary & Address Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Financial Summary */}
                    <Card className="border-gray-200/80 shadow-2xs bg-white">
                      <CardHeader className="p-2.5 border-b bg-gray-50/50">
                        <CardTitle className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                          Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-gray-600">
                          <span>Method</span>
                          <span className="font-semibold text-gray-900 capitalize">
                            {selectedOrder.method === "cashOnDelivery" ? "Cash on Delivery" : selectedOrder.method}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Status</span>
                          <span className={`font-semibold ${selectedOrder.isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                            {selectedOrder.isPaid ? "Paid" : "Due on Delivery"}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Delivery Fee</span>
                          <span className="text-gray-900">{formatBDT(selectedOrder.shippingCost || 0)}</span>
                        </div>
                        {selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Discount</span>
                            <span>-{formatBDT(selectedOrder.discountAmount)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-xs font-bold text-gray-900 pt-0.5">
                          <span>Total</span>
                          <span className="text-emerald-700">{formatBDT(selectedOrder.amount)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delivery Destination */}
                    <Card className="border-gray-200/80 shadow-2xs bg-white">
                      <CardHeader className="p-2.5 border-b bg-gray-50/50">
                        <CardTitle className="text-[10px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          Delivery Destination
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 space-y-1 text-[11px] text-gray-700">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-400" />
                          {selectedOrder.shipping?.name || selectedOrder.name || "Customer"}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {selectedOrder.shipping?.phone || selectedOrder.phone || "—"}
                        </div>
                        <div className="pt-1 text-gray-600 leading-relaxed border-t mt-1">
                          {selectedOrder.shipping?.address || selectedOrder.address || "Address provided at checkout"}
                          {selectedOrder.shipping?.district ? `, ${selectedOrder.shipping.district}` : ""}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreContainer>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <StoreContainer>
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </StoreContainer>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}