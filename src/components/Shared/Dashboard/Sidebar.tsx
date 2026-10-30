/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import MainNavLink from "./MainNavLink";
import { NavLink } from "@/types/navlink.types";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, ShieldAlert } from "lucide-react";
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
  const { user, isLoading } = useAuth(); // ✅ from your hook
  const [logoutApi] = useLogoutMutation();

  // Skeleton Loader for Nav + SubItems
  const SkeletonNav = () => (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-4">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div
              className={cn(
                "flex items-center gap-3 rounded-md animate-pulse px-2 py-2",
                dark ? "bg-gray-800" : "bg-gray-200",
                isShort ? "justify-center" : ""
              )}
            >
              <div className={cn("rounded-md", dark ? "bg-gray-700" : "bg-gray-300", "h-5 w-5")} />
              {!isShort && (
                <div className={cn("h-4 rounded-md", dark ? "bg-gray-700" : "bg-gray-300", "w-24")} />
              )}
            </div>

            {!isShort &&
              [...Array(2)].map((_, subIdx) => (
                <div key={subIdx} className="flex items-center gap-3 ml-8 animate-pulse">
                  <div className={cn("rounded-md", dark ? "bg-gray-700" : "bg-gray-300", "h-3 w-3")} />
                  <div className={cn("h-3 rounded-md", dark ? "bg-gray-700" : "bg-gray-300", "w-20")} />
                </div>
              ))}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex items-center gap-3 rounded-md mt-6 animate-pulse px-3 py-2",
          dark ? "bg-red-700" : "bg-red-300",
          isShort ? "justify-center" : "justify-start"
        )}
      >
        <div className={cn("rounded-md", dark ? "bg-red-600" : "bg-red-400", "h-5 w-5")} />
        {!isShort && <div className={cn("h-4 rounded-md", dark ? "bg-red-600" : "bg-red-400", "w-16")} />}
      </div>
    </div>
  );

  const LoggedOutNav = () => (
    <div className="h-full p-4 flex flex-col">
      <div className="space-y-4">
        {navLinks.map((link, idx) => (
          <MainNavLink
            key={idx}
            link={link}
            isShort={isShort}
            additionalRoutes={additionalRoutes}
            setIsShort={setIsShort}
            dark={dark}
          />
        ))}
      </div>
    </div>
  );

  // ✅ 1) Loading time → Skeleton (good)
  if (isLoading) {
    return (
      <div ref={navRef}>
        {/* Mobile Skeleton */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform transition-transform duration-300 ease-in-out lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
            dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          )}
        >
          <SkeletonNav />
        </div>

        {/* Desktop Skeleton */}
        <div
          className={cn(
            "hidden lg:flex flex-col h-screen shadow-md transition-all duration-300 ease-in-out",
            isShort ? "w-14" : "w-46",
            dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          )}
        >
          <SkeletonNav />
        </div>
      </div>
    );
  }

  // ✅ 2) After loading → if no user, show "not logged in"
  if (!user) {
    return (
      <div ref={navRef}>
        {/* Mobile */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform transition-transform duration-300 ease-in-out lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
            dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          )}
        >
          <LoggedOutNav />
        </div>

        {/* Desktop */}
        <div
          className={cn(
            "hidden lg:flex flex-col h-screen shadow-md transition-all duration-300 ease-in-out",
            isShort ? "w-14" : "w-46",
            dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          )}
        >
          <LoggedOutNav />
        </div>
      </div>
    );
  }

  // ✅ 3) Logged in → normal sidebar
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

      // Force hard reload to clear Next.js router cache and middleware state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout API failed:", error);
      toast.error("Failed to log out. Please try again.");
    }
};

  return (
    <div ref={navRef}>
      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        )}
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <MainNavLink
              dark={dark}
              isShort={false}
              setIsShort={setIsShort}
              additionalRoutes={additionalRoutes}
              navLink={combinedNavLinks}
              role={user?.role}
            />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 border-t border-white/10 hover:bg-red-600 text-white"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col h-screen shadow-md transition-all duration-300 ease-in-out",
          isShort ? "w-14" : "w-46",
          dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <MainNavLink
            dark={dark}
            isShort={isShort}
            setIsShort={setIsShort}
            additionalRoutes={additionalRoutes}
            navLink={combinedNavLinks}
            role={user?.role}
          />
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 px-4 py-2 mt-auto w-full hover:bg-red-600 rounded-md text-white",
            isShort ? "justify-center" : "justify-start"
          )}
        >
          <LogOut size={20} />
          {!isShort && "Logout"}
        </button>
      </div>
    </div>
  );
}