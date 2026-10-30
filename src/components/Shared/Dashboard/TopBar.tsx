// File: components/Layout/TopBar/TopBar.tsx (or your respective path)
'use client';

import { useSelector } from "react-redux";
import type { Dispatch, SetStateAction } from "react";
import { RootState } from "@/redux/store/store";
import { LuMenu, LuShieldCheck, LuX } from "react-icons/lu";

interface TopBarProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    dark?: boolean;
}

export default function TopBar({
    isOpen,
    setIsOpen,
    dark = false,
}: TopBarProps) {
    const user = useSelector((state: RootState) => state.auth.user) as { 
        name?: string; 
        role?: string; 
        imageUrl?: string;
    } | null;

    // Helper to extract initials for the avatar fallback
    const getInitials = (name?: string) => {
        if (!name) return 'KW';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Format role display cleanly (e.g., SUPER_ADMIN -> Super Admin)
    const formatRole = (role?: string) => {
        if (!role) return 'Administrator';
        return role
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <header className={`sticky top-0 z-30 w-full backdrop-blur-md bg-white/90 border-b border-stone-200/80 shadow-xs transition-all`}>
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
                
                {/* Left: Mobile Toggle & Title Branding */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {isOpen ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-700 border border-green-200/60 shadow-xs">
                            <LuShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-stone-900 font-serif tracking-tight truncate">
                                Khushbuwaala <span className="font-sans font-normal text-xs text-stone-500 uppercase tracking-wider ml-1 hidden md:inline-block">Admin Portal</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Right: User Profile Widget */}
                <div className="flex items-center gap-3 pl-3 border-l border-stone-200/60">
                    <div className="flex items-center gap-3">
                        {/* Avatar / Initials Circle */}
                        {user?.imageUrl ? (
                            <img 
                                src={user.imageUrl} 
                                alt={user?.name || 'Admin'} 
                                className="h-9 w-9 rounded-full object-cover border border-stone-200 shadow-xs" 
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-[#1b382b] text-white flex items-center justify-center text-xs font-bold tracking-wider shadow-xs">
                                {getInitials(user?.name)}
                            </div>
                        )}

                        {/* Name & Role */}
                        <div className="hidden sm:block leading-tight text-right">
                            <div className="text-xs font-bold text-stone-900 truncate max-w-[150px]">
                                {user?.name || 'Administrator'}
                            </div>
                            <div className="text-[11px] font-medium text-green-700 mt-0.5">
                                {formatRole(user?.role)}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}