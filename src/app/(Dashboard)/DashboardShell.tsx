"use client";

import TopBar from "@/components/Shared/Dashboard/TopBar";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import SideBar from "@/components/Shared/Dashboard/Sidebar";
import { ConfirmProvider } from "@/components/admin/ConfirmProvider";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isShort, setIsShort] = useState(false); // Default to full width on desktop for better first impression
    const navRef = useRef<HTMLDivElement>(null);

    const { user, isLoading } = useAuth();
    const hasToken = typeof window !== "undefined" && (Boolean(localStorage.getItem("accessToken")) || Boolean(Cookies.get("accessToken")));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const original = document.body.style.overflow;
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = original;
        return () => { document.body.style.overflow = original; };
    }, [isOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <ConfirmProvider>
        <div className="min-h-screen w-full bg-slate-50 relative font-sans text-slate-900">
            {/* Backdrop for mobile drawer */}
            <div
                onClick={() => setIsOpen(false)}
                className={cn(
                    "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                aria-hidden="true"
            />

            <SideBar dark setIsShort={setIsShort} additionalRoutes={null} isOpen={isOpen} setIsOpen={setIsOpen} isShort={isShort} navRef={navRef} />

            {/* Dynamic left margin: w-20 (5rem) -> ml-20 | w-64 (16rem) -> ml-64 */}
            <div
                className={cn(
                    "flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                    isShort ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                <TopBar setIsOpen={setIsOpen} isOpen={isOpen} />

                <main className="flex-1 min-w-0 bg-slate-50 sm:p-2 p-1">
                    {/* <BreadCrumb /> */}

                    {isLoading || (hasToken && !user) ? (
                        <div className="flex items-center justify-center h-[60vh]">
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-500 rounded-full animate-bounce" />
                                <p className="text-slate-500 font-medium tracking-wide">Loading workspace...</p>
                            </div>
                        </div>
                    ) : !user ? (
                        <div className="py-20 text-center max-w-md mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
                                <p className="text-slate-500 mt-2">Please securely log in to access the Khushbuwaala dashboard.</p>
                                <div className="mt-8 flex flex-col gap-3">
                                    <Link href="/login" className="w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
                                        Go to Login
                                    </Link>
                                    <Link href="/" className="w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors">
                                        Return Home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
        </ConfirmProvider>
    );
}