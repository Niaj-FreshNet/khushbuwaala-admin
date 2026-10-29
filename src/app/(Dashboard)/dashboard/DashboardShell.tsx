/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import BreadCrumb from "@/components/Shared/Dashboard/BreadCrumb";
import SideBar from "@/components/Shared/Dashboard/Sidebar";
import TopBar from "@/components/Shared/Dashboard/TopBar";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false); // mobile sidebar
    const [isShort, setIsShort] = useState(true); // desktop sidebar
    const navRef = useRef<HTMLDivElement>(null);

    const { user, isLoading } = useAuth();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Lock body scroll ONLY when mobile sidebar open
    useEffect(() => {
        const original = document.body.style.overflow;
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = original;

        return () => {
            document.body.style.overflow = original;
        };
    }, [isOpen]);

    // ESC closes sidebar
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="flex w-full h-dvh overflow-hidden bg-gray-50">
            {/* Backdrop for mobile drawer */}
            <div
                onClick={() => setIsOpen(false)}
                className={[
                    "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                ].join(" ")}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <SideBar
                dark
                setIsShort={setIsShort}
                additionalRoutes={null}
                isOpen={isOpen}
                isShort={isShort}
                navRef={navRef}
            />

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 h-full">
                {/* Top bar */}
                <TopBar dark setIsOpen={setIsOpen} isOpen={isOpen} />

                {/* Scroll area */}
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-2">
                        <BreadCrumb />

                        {/* content card */}
                        <div className="shadow-sm">
                            {/* ✅ keep skeleton time OK (isLoading true), but after that show clear not logged in */}
                            {isLoading ? (
                                <div className="py-10 text-center">
                                    <p className="text-gray-500">Checking session...</p>
                                </div>
                            ) : !user ? (
                                <div className="py-10 text-center">
                                    <h2 className="text-lg font-semibold text-gray-900">You’re not logged in</h2>
                                    <p className="text-gray-600 mt-1">
                                        Please login to access the dashboard.
                                    </p>

                                    <div className="mt-5 flex items-center justify-center gap-2">
                                        <Link
                                            href="/login"
                                            className={cn(
                                                "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                                                "bg-gray-900 text-white hover:bg-gray-800"
                                            )}
                                        >
                                            Go to Login
                                        </Link>
                                        <Link
                                            href="/"
                                            className={cn(
                                                "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                                                "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            Back to Home
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                children
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}