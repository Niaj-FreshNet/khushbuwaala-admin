"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Package,
    User,
    Lock,
    MapPin,
    Phone,
    Mail,
    Calendar,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    UploadCloud,
    X,
    Navigation,
    Eye,
    EyeOff,
    CheckCircle2,
    History,
    Sparkles,
    Info,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";
import Cookies from "js-cookie";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useAppDispatch } from "@/redux/store/hooks";
import { logout } from "@/redux/store/features/auth/authSlice";
import baseApi from "@/redux/store/api/baseApi";
import {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useChangePasswordMutation,
} from "@/redux/store/api/user/userApi";
import { useGetMyOrdersQuery } from "@/redux/store/api/order/ordersApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import StoreContainer from "@/components/Layout/StoreContainer";
import { districtAliases, districts } from "../checkout/_components/districts";
import { useLogoutMutation } from "@/redux/store/api/auth/authApi";

type TabType = "current-orders" | "purchase-history" | "edit";

const ORDERS_PER_PAGE = 5;

function detectDistrictEnFromText(text: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const [enKey, aliases] of Object.entries(districtAliases)) {
        for (const alias of aliases) {
            if (lower.includes(alias.toLowerCase())) {
                return enKey;
            }
        }
    }
    return null;
}

export default function ProfileClient() {
    // -----------------------------------------------------------
    // 1. ALL HOOKS DECLARED FIRST — NO CONDITIONS OR EARLY RETURNS
    // -----------------------------------------------------------
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user: authUser, isLoading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>("current-orders");
    const [showPointsInfo, setShowPointsInfo] = useState(false);
    const [pageCurrent, setPageCurrent] = useState(1);
    const [pageHistory, setPageHistory] = useState(1);

    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        district: "",
        imageUrl: "",
    });

    const [districtSource, setDistrictSource] = useState<"auto" | "manual" | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordErrors, setPasswordErrors] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Mutations & Queries
    const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
    const [updateUserProfile, { isLoading: updatingProfile }] = useUpdateUserProfileMutation();
    const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

    const {
        data: profileData,
        isLoading: loadingProfile,
        isFetching: fetchingProfile,
        refetch: refetchProfile,
    } = useGetUserProfileQuery(undefined, {
        skip: !authUser,
    });

    const isOrdersTab = activeTab === "current-orders" || activeTab === "purchase-history";
    const {
        data: myOrdersResponse,
        isLoading: loadingOrders,
        isFetching: fetchingOrders,
        refetch: refetchOrders,
    } = useGetMyOrdersQuery(undefined, {
        skip: !authUser || !isOrdersTab,
    });

    // Hash sync
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace("#", "");
            if (hash === "current-orders" || hash === "purchase-history" || hash === "edit") {
                setActiveTab(hash as TabType);
            } else if (!hash) {
                setActiveTab("current-orders");
            }
        };

        handleHashChange();
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    // Redirect unauthenticated user to login
    useEffect(() => {
        if (!authLoading && !authUser) {
            router.replace("/login");
        }
    }, [authUser, authLoading, router]);

    const currentUser = (profileData as any)?.data || profileData || authUser;

    const orderPayload = (myOrdersResponse as any)?.data;
    const orders: any[] = Array.isArray(orderPayload?.data)
        ? orderPayload.data
        : Array.isArray((myOrdersResponse as any)?.data)
            ? (myOrdersResponse as any).data
            : Array.isArray(myOrdersResponse)
                ? (myOrdersResponse as any)
                : [];

    const totalOrders = orderPayload?.totalOrders ?? (myOrdersResponse as any)?.totalOrders ?? orders.length;

    // Filter orders & points calculation
    const { currentOrders, purchaseHistory, totalRewardPoints } = useMemo(() => {
        const current: any[] = [];
        const history: any[] = [];
        let completedSpend = 0;

        orders.forEach((order) => {
            const status = String(order?.status || "").toUpperCase();
            if (status === "PENDING" || status === "PROCESSING" || status === "CONFIRMED" || status === "SHIPPED") {
                current.push(order);
            } else {
                history.push(order);
                if (status === "DELIVERED" || status === "COMPLETED") {
                    completedSpend += Number(order?.amount || 0);
                }
            }
        });

        const points = Math.floor(completedSpend / 100);
        return { currentOrders: current, purchaseHistory: history, totalRewardPoints: points };
    }, [orders]);

    const paginatedCurrentOrders = useMemo(() => {
        const start = (pageCurrent - 1) * ORDERS_PER_PAGE;
        return currentOrders.slice(start, start + ORDERS_PER_PAGE);
    }, [currentOrders, pageCurrent]);

    const paginatedPurchaseHistory = useMemo(() => {
        const start = (pageHistory - 1) * ORDERS_PER_PAGE;
        return purchaseHistory.slice(start, start + ORDERS_PER_PAGE);
    }, [purchaseHistory, pageHistory]);

    const totalPagesCurrent = Math.ceil(currentOrders.length / ORDERS_PER_PAGE) || 1;
    const totalPagesHistory = Math.ceil(purchaseHistory.length / ORDERS_PER_PAGE) || 1;

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                name: currentUser.name || "",
                email: currentUser.email || "",
                phone: currentUser.phone || currentUser.contact || "",
                address: currentUser.address || "",
                district: currentUser.district || "",
                imageUrl: currentUser.imageUrl || "",
            });
            if (currentUser.district) {
                setDistrictSource("manual");
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (districtSource === "manual") return;

        const guess = detectDistrictEnFromText(profileForm.address);
        if (guess && guess !== profileForm.district) {
            setProfileForm((prev) => ({ ...prev, district: guess }));
            setDistrictSource("auto");
        } else if (!guess && districtSource === "auto") {
            setProfileForm((prev) => ({ ...prev, district: "" }));
            setDistrictSource(null);
        }
    }, [profileForm.address, districtSource, profileForm.district]);

    // -----------------------------------------------------------
    // 2. HANDLER FUNCTIONS
    // -----------------------------------------------------------
    const switchTab = (tab: TabType) => {
        setActiveTab(tab);
        window.location.hash = tab;
    };

    const handleLogout = async () => {
        try {
            await logoutApi({}).unwrap();
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            Cookies.remove("accessToken", { path: "/" });
            Cookies.remove("refreshToken", { path: "/" });

            dispatch(logout());
            dispatch(baseApi.util.resetApiState());

            toast.success("Logged out successfully!", { duration: 1500 });

            router.replace("/login");
            router.refresh();
        }
    };

    const handleImageFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file (PNG, JPG, WebP)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement("img");
            img.src = e.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const maxDim = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDim) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
                setProfileForm((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
                toast.success("Image selected!");
            };
        };

        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetUserId = currentUser?.id || authUser?.id;

        if (!targetUserId) {
            toast.error("User session missing. Please log in again.");
            return;
        }

        try {
            await updateUserProfile({
                id: targetUserId,
                updates: {
                    name: profileForm.name.trim(),
                    email: profileForm.email.trim(),
                    phone: profileForm.phone.trim(),
                    contact: profileForm.phone.trim(),
                    address: profileForm.address.trim(),
                    district: profileForm.district,
                    imageUrl: profileForm.imageUrl || null,
                } as any,
            }).unwrap();

            toast.success("Profile updated successfully!");
            refetchProfile();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to update profile.");
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        };

        let hasError = false;

        if (!passwordForm.oldPassword) {
            errors.oldPassword = "Current password is required.";
            hasError = true;
        }

        if (!passwordForm.newPassword) {
            errors.newPassword = "New password is required.";
            hasError = true;
        } else if (passwordForm.newPassword.length < 6) {
            errors.newPassword = "Password must be at least 6 characters.";
            hasError = true;
        } else if (passwordForm.newPassword === passwordForm.oldPassword) {
            errors.newPassword = "New password cannot be the same as current password.";
            hasError = true;
        }

        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = "Confirm password is required.";
            hasError = true;
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
            hasError = true;
        }

        setPasswordErrors(errors);
        if (hasError) return;

        try {
            await changePassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            }).unwrap();

            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });
            toast.success("Password changed successfully!");
            setIsPasswordOpen(false);
        } catch (err: any) {
            const msg = err?.data?.message || "Failed to update password.";
            if (msg.toLowerCase().includes("current") || msg.toLowerCase().includes("incorrect")) {
                setPasswordErrors((prev) => ({ ...prev, oldPassword: msg }));
            } else if (msg.toLowerCase().includes("new")) {
                setPasswordErrors((prev) => ({ ...prev, newPassword: msg }));
            } else {
                toast.error(msg);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const s = (status || "").toUpperCase();
        switch (s) {
            case "DELIVERED":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5">Delivered</Badge>;
            case "PROCESSING":
            case "CONFIRMED":
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">Processing</Badge>;
            case "SHIPPED":
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5">Shipped</Badge>;
            case "CANCELED":
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-2 py-0.5">Canceled</Badge>;
            default:
                return <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-2 py-0.5">{status || "Pending"}</Badge>;
        }
    };

    const renderOrderList = (
        orderList: any[],
        emptyTitle: string,
        emptyDesc: string,
        currentPage: number,
        totalPages: number,
        onPageChange: (newPage: number) => void
    ) => {
        if (loadingOrders && !fetchingOrders) {
            return (
                <div className="p-6 text-center text-xs text-gray-400 animate-pulse bg-white rounded-xl border border-gray-100">
                    Loading orders...
                </div>
            );
        }

        if (orderList.length === 0) {
            return (
                <div className="p-6 text-center rounded-xl bg-white border border-dashed border-gray-200 space-y-2">
                    <ShoppingBag className="w-7 h-7 text-gray-300 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">{emptyTitle}</p>
                    <p className="text-[11px] text-gray-400">{emptyDesc}</p>
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-3">
                        <Link href="/shop">Browse Fragrances</Link>
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-2.5">
                {orderList.map((order: any) => {
                    const queryParam = order.invoice || order.id;

                    return (
                        <div
                            key={order.id}
                            className="p-3 sm:p-4 rounded-xl border border-gray-200/80 bg-white hover:border-gray-300 transition-all space-y-2.5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-gray-900">
                                        #{order.invoice || order.id.slice(-8).toUpperCase()}
                                    </span>
                                    {getStatusBadge(order.status)}
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] font-semibold px-1.5 py-0",
                                            order.isPaid
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}
                                    >
                                        {order.isPaid ? "Paid" : "COD"}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(order.orderTime || order.createdAt).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>

                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[11px] px-2 border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100 gap-1 rounded-md"
                                    >
                                        <Link href={`/track-order?query=${encodeURIComponent(queryParam)}`}>
                                            <Navigation className="w-2.5 h-2.5" /> Track
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {(order.orderItems || []).map((item: any) => (
                                    <div key={item.id} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {item.product?.primaryImage ? (
                                                <img
                                                    src={item.product.primaryImage}
                                                    alt={item.product?.name}
                                                    className="w-8 h-8 rounded-md object-cover border border-gray-100 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-md bg-gray-100 shrink-0 flex items-center justify-center">
                                                    <Package className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="truncate">
                                                <p className="font-semibold text-gray-900 text-xs truncate">
                                                    {item.product?.name || "Attar / Perfume"}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    Qty: {item.quantity} {item.variant?.size ? `• ${item.variant.size} ${item.variant?.unit || "ML"}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-900 shrink-0 text-xs">
                                            ৳{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px]">
                                <span className="text-gray-500">
                                    Delivery: <strong className="text-gray-700">৳{order.shippingCost || 0}</strong>
                                </span>
                                <div>
                                    <span className="text-gray-400 mr-1">Total:</span>
                                    <span className="font-bold text-emerald-700 text-xs">
                                        ৳{Number(order.amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 px-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="h-7 text-xs px-2.5 gap-1 rounded-lg"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </Button>

                        <span className="text-[11px] font-medium text-gray-500">
                            Page {currentPage} of {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="h-7 text-xs px-2.5 gap-1 rounded-lg"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    // -----------------------------------------------------------
    // 3. SAFE RETURN GUARD (After all hooks have evaluated)
    // -----------------------------------------------------------
    if (!authLoading && !authUser) {
        return null;
    }

    // -----------------------------------------------------------
    // 4. MAIN JSX
    // -----------------------------------------------------------
    return (
        <StoreContainer>
            <div className="pt-6 sm:pt-12 pb-4 sm:pb-6 px-3 sm:px-6 lg:px-8 space-y-4 max-w-6xl mx-auto">
                {/* 1. Header Identity & Points Card */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {currentUser?.imageUrl ? (
                                <img
                                    src={currentUser.imageUrl}
                                    alt={currentUser?.name || "Customer"}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-emerald-200 shadow-2xs shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center border border-emerald-200 shrink-0">
                                    {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                        {currentUser?.name || "Customer"}
                                    </h1>
                                    <span title="Verified Customer" className="text-emerald-600 shrink-0">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-400 shrink-0" /> {currentUser?.email || "No email"}
                                </p>
                                {(currentUser?.phone || currentUser?.contact) && (
                                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-gray-400 shrink-0" /> {currentUser.phone || currentUser.contact}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Metrics: Orders & Reward Points & Logout */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-4 bg-gray-50/90 px-4 py-2 rounded-lg border border-gray-100 flex-1 sm:flex-initial justify-around shrink-0">
                                <div className="text-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
                                    <span className="text-sm font-bold text-gray-900">{totalOrders}</span>
                                </div>

                                <div className="w-px h-6 bg-gray-200" />

                                <div className="text-center relative">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Points</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowPointsInfo(!showPointsInfo)}
                                            className="text-gray-400 hover:text-emerald-600 transition-colors p-0.5"
                                            title="Reward Points Info"
                                        >
                                            <Info className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-emerald-700">
                                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                                        <span>{totalRewardPoints}</span>
                                    </div>

                                    {showPointsInfo && (
                                        <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-50 text-left text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="flex items-center justify-between pb-1 border-b border-gray-100 font-bold text-gray-900">
                                                <span className="flex items-center gap-1 text-emerald-700">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Reward Points
                                                </span>
                                                <button onClick={() => setShowPointsInfo(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                                You earn <strong>10 Points</strong> for every <strong>৳1,000</strong> spent on delivered & completed orders.
                                            </p>
                                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                                Use your points during checkout to unlock special <strong>discounts, free delivery</strong>, and VIP fragrance offers.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="h-10 px-3 rounded-lg border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors gap-1.5 text-xs font-semibold shrink-0"
                                title="Log out from account"
                            >
                                <LogOut className={cn("w-3.5 h-3.5", isLoggingOut && "animate-spin")} />
                                <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Navigation Pills */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/60">
                    {[
                        { id: "current-orders", label: `Current Orders (${currentOrders.length})`, icon: Package },
                        { id: "purchase-history", label: `Order History (${purchaseHistory.length})`, icon: History },
                        { id: "edit", label: "Edit Profile", icon: User },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id as TabType)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-emerald-700 shadow-2xs"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. TAB 1: Current Orders */}
                {activeTab === "current-orders" && (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Current Orders</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={fetchingOrders}
                                onClick={() => refetchOrders()}
                                className="text-[11px] h-7 px-2.5 gap-1 text-gray-600 hover:text-emerald-700"
                            >
                                <RefreshCw className={cn("w-3 h-3", fetchingOrders && "animate-spin text-emerald-600")} />
                                <span>{fetchingOrders ? "Refreshing..." : "Refresh"}</span>
                            </Button>
                        </div>
                        {renderOrderList(
                            paginatedCurrentOrders,
                            "No current orders right now",
                            "All pending and processing orders will appear here for instant tracking.",
                            pageCurrent,
                            totalPagesCurrent,
                            setPageCurrent
                        )}
                    </div>
                )}

                {/* 4. TAB 2: Purchase History */}
                {activeTab === "purchase-history" && (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Purchase History</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={fetchingOrders}
                                onClick={() => refetchOrders()}
                                className="text-[11px] h-7 px-2.5 gap-1 text-gray-600 hover:text-emerald-700"
                            >
                                <RefreshCw className={cn("w-3 h-3", fetchingOrders && "animate-spin text-emerald-600")} />
                                <span>{fetchingOrders ? "Refreshing..." : "Refresh"}</span>
                            </Button>
                        </div>
                        {renderOrderList(
                            paginatedPurchaseHistory,
                            "No past purchase history found",
                            "Your completed and delivered orders will be safely archived here.",
                            pageHistory,
                            totalPagesHistory,
                            setPageHistory
                        )}
                    </div>
                )}

                {/* 5. TAB 3: Edit Profile & Password */}
                {activeTab === "edit" && (
                    <div className="space-y-4">
                        {loadingProfile && !profileForm.name ? (
                            <div className="p-6 text-center text-xs text-gray-400 animate-pulse bg-white rounded-xl border border-gray-100">
                                Loading profile details...
                            </div>
                        ) : (
                            <>
                                {/* Profile Info Card */}
                                <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 sm:p-5 space-y-3">
                                    <h2 className="text-xs sm:text-sm font-bold text-gray-900">Personal Details</h2>
                                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                                        {/* Avatar Selector */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleDrop}
                                                className={cn(
                                                    "relative w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all bg-gray-50 shrink-0",
                                                    isDragging ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            handleImageFile(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                                {profileForm.imageUrl ? (
                                                    <img
                                                        src={profileForm.imageUrl}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <UploadCloud className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>

                                            <div className="text-left text-xs">
                                                <p className="font-semibold text-gray-800">Profile Picture</p>
                                                <p className="text-[10px] text-gray-400">Click to upload (JPG, PNG, WebP)</p>
                                                {profileForm.imageUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfileForm((prev) => ({ ...prev, imageUrl: "" }))}
                                                        className="text-[10px] text-rose-600 hover:underline mt-0.5"
                                                    >
                                                        Remove photo
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div className="space-y-1">
                                                <Label htmlFor="name" className="text-[11px] font-semibold text-gray-700">
                                                    Full Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={profileForm.name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    placeholder="Your full name"
                                                    className="text-xs h-8 bg-white"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="email" className="text-[11px] font-semibold text-gray-700">
                                                    Email Address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                    placeholder="your.email@example.com"
                                                    className="text-xs h-8 bg-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div className="space-y-1">
                                                <Label htmlFor="phone" className="text-[11px] font-semibold text-gray-700">
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    value={profileForm.phone}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                    placeholder="01XXXXXXXXX"
                                                    className="text-xs h-8 bg-white"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="district" className="text-[11px] font-semibold text-gray-700">
                                                        District
                                                    </Label>
                                                    {districtSource === "auto" && profileForm.district && (
                                                        <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Auto-detected
                                                        </span>
                                                    )}
                                                </div>
                                                <select
                                                    id="district"
                                                    value={profileForm.district}
                                                    onChange={(e) => {
                                                        setProfileForm({ ...profileForm, district: e.target.value });
                                                        setDistrictSource("manual");
                                                    }}
                                                    className="w-full text-xs h-8 px-2.5 bg-white border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value="">Select district</option>
                                                    {districts.map((d) => (
                                                        <option key={d.en} value={d.en}>
                                                            {d.en} ({d.bn})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="address" className="text-[11px] font-semibold text-gray-700">
                                                Full Address
                                            </Label>
                                            <Textarea
                                                id="address"
                                                value={profileForm.address}
                                                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                                placeholder="House, Road, Area details"
                                                className="text-xs min-h-[56px] py-1.5 bg-white resize-none"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={updatingProfile}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 rounded-lg font-medium"
                                        >
                                            {updatingProfile ? "Saving..." : "Save Details"}
                                        </Button>
                                    </form>
                                </div>

                                {/* Collapsible Password Card */}
                                <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordOpen((prev) => !prev)}
                                        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <div>
                                                <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Change Password</h2>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 text-gray-400 transition-transform duration-200",
                                                isPasswordOpen && "rotate-180 text-emerald-600"
                                            )}
                                        />
                                    </button>

                                    {isPasswordOpen && (
                                        <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 pt-1 border-t border-gray-100">
                                            <form onSubmit={handlePasswordSubmit} className="space-y-3" noValidate>
                                                {/* Current Password */}
                                                <div className="space-y-1">
                                                    <Label htmlFor="oldPass" className="text-[11px] font-semibold text-gray-700">
                                                        Current Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="oldPass"
                                                            type={showOldPass ? "text" : "password"}
                                                            value={passwordForm.oldPassword}
                                                            onChange={(e) => {
                                                                setPasswordForm({ ...passwordForm, oldPassword: e.target.value });
                                                                if (passwordErrors.oldPassword) setPasswordErrors({ ...passwordErrors, oldPassword: "" });
                                                            }}
                                                            className={cn(
                                                                "text-xs h-8 bg-white pr-8 transition-colors",
                                                                passwordErrors.oldPassword && "border-rose-500 focus-visible:ring-rose-500"
                                                            )}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowOldPass((prev) => !prev)}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            tabIndex={-1}
                                                        >
                                                            {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                    {passwordErrors.oldPassword && (
                                                        <p className="text-[10px] text-rose-500 font-medium">{passwordErrors.oldPassword}</p>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {/* New Password */}
                                                    <div className="space-y-1">
                                                        <Label htmlFor="newPass" className="text-[11px] font-semibold text-gray-700">
                                                            New Password
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="newPass"
                                                                type={showNewPass ? "text" : "password"}
                                                                value={passwordForm.newPassword}
                                                                onChange={(e) => {
                                                                    setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                                                                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: "" });
                                                                }}
                                                                className={cn(
                                                                    "text-xs h-8 bg-white pr-8 transition-colors",
                                                                    passwordErrors.newPassword && "border-rose-500 focus-visible:ring-rose-500"
                                                                )}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowNewPass((prev) => !prev)}
                                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                                tabIndex={-1}
                                                            >
                                                                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                        {passwordErrors.newPassword && (
                                                            <p className="text-[10px] text-rose-500 font-medium">{passwordErrors.newPassword}</p>
                                                        )}
                                                    </div>

                                                    {/* Confirm Password */}
                                                    <div className="space-y-1">
                                                        <Label htmlFor="confirmPass" className="text-[11px] font-semibold text-gray-700">
                                                            Confirm Password
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="confirmPass"
                                                                type={showConfirmPass ? "text" : "password"}
                                                                value={passwordForm.confirmPassword}
                                                                onChange={(e) => {
                                                                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                                                                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                                                                }}
                                                                className={cn(
                                                                    "text-xs h-8 bg-white pr-8 transition-colors",
                                                                    passwordErrors.confirmPassword && "border-rose-500 focus-visible:ring-rose-500"
                                                                )}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPass((prev) => !prev)}
                                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                                tabIndex={-1}
                                                            >
                                                                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                        {passwordErrors.confirmPassword && (
                                                            <p className="text-[10px] text-rose-500 font-medium">{passwordErrors.confirmPassword}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={changingPassword}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 rounded-lg font-medium"
                                                >
                                                    {changingPassword ? "Updating..." : "Update Password"}
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </StoreContainer>
    );
}