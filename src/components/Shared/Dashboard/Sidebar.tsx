/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import MainNavLink from "./MainNavLink";
import { NavLink } from "@/types/navlink.types";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { useLogoutMutation } from "@/redux/store/api/auth/authApi";
import { navLinks } from "@/config/navLink";
import { logout } from "@/redux/store/features/auth/authSlice";
import { UserRole } from "@/types/auth.types";

interface SideBarProps {
  navRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  isShort: boolean;
  additionalRoutes: NavLink[] | null;
  setIsShort: React.Dispatch<React.SetStateAction<boolean>>;
  dark?: boolean;
}

export default function SideBar({
  navRef,
  isOpen,
  isShort,
  additionalRoutes,
  setIsShort,
  dark = true,
}: SideBarProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [logoutApi] = useLogoutMutation();

  // Premium Skeleton Loader
  const SkeletonNav = () => (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-4 mt-10">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl animate-pulse px-3 py-3",
                dark ? "bg-slate-800/50" : "bg-slate-200",
                isShort ? "justify-center" : ""
              )}
            >
              <div className={cn("rounded-lg", dark ? "bg-slate-700" : "bg-slate-300", "h-5 w-5")} />
              {!isShort && (
                <div className={cn("h-4 rounded-lg", dark ? "bg-slate-700" : "bg-slate-300", "w-28")} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LoggedOutNav = () => (
    <div className="h-full p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <MainNavLink
          navLink={navLinks}
          isShort={isShort}
          additionalRoutes={additionalRoutes}
          setIsShort={setIsShort}
          dark={dark}
        />
      </div>
    </div>
  );

  const containerClasses = cn(
    "flex flex-col h-screen transition-all duration-300 ease-in-out fixed top-0 left-0 z-50 border-r",
    dark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
  );

  if (isLoading) {
    return (
      <aside ref={navRef}>
        <div className={cn(containerClasses, "w-72 sm:w-80 lg:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}>
          <SkeletonNav />
        </div>
        <div className={cn(containerClasses, "hidden lg:flex shadow-xl", isShort ? "w-20" : "w-64")}>
          <SkeletonNav />
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside ref={navRef}>
        <div className={cn(containerClasses, "w-72 sm:w-80 lg:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}>
          <LoggedOutNav />
        </div>
        <div className={cn(containerClasses, "hidden lg:flex shadow-xl", isShort ? "w-20" : "w-64")}>
          <LoggedOutNav />
        </div>
      </aside>
    );
  }

  const role: UserRole | undefined = user?.role;
  const filteredNavLinks = navLinks
    .filter((link) => !!role && link.roles.includes(role))
    .map((link) => ({
      ...link,
      subItems: link.subItems?.filter((sub) => !!role && sub.roles.includes(role)),
    }));

  const combinedNavLinks = [
    ...filteredNavLinks,
    ...(additionalRoutes?.filter((link) => !!role && link.roles.includes(role)) || []),
  ];

  const handleLogout = async () => {
    try {
      await logoutApi({}).unwrap();
      dispatch(logout());
      toast.success("Logged out successfully!");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <aside ref={navRef}>
      {/* Mobile Sidebar */}
      <div
        className={cn(containerClasses, "w-64 sm:w-72 lg:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <MainNavLink dark={dark} isShort={false} setIsShort={setIsShort} additionalRoutes={additionalRoutes} navLink={combinedNavLinks} role={user?.role} />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl transition-colors bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-medium">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(containerClasses, "hidden lg:flex shadow-2xl", isShort ? "w-20" : "w-64")}>
        <div className="flex flex-col h-full p-4">
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <MainNavLink dark={dark} isShort={isShort} setIsShort={setIsShort} additionalRoutes={additionalRoutes} navLink={combinedNavLinks} role={user?.role} />
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 mt-4 rounded-xl transition-all font-medium",
              "bg-slate-900 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20",
              isShort ? "justify-center" : "justify-start"
            )}
            title={isShort ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {!isShort && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}