// File: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role?: string;
  exp: number;
}

export function proxy(request: NextRequest) {
  // ✅ Check for both common cookie names just to be safe
  const token = request.cookies.get("accessToken")?.value || request.cookies.get("access_token")?.value;
  const currentPath = request.nextUrl.pathname;

  // 1. If visiting the login page but already authenticated
  if (currentPath === "/login") {
    if (token) {
      try {
        const userInfo = jwtDecode<DecodedToken>(token);
        if (userInfo.exp && userInfo.exp * 1000 >= Date.now()) {
          const role = userInfo.role?.toUpperCase();
          if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
          }
          if (role === 'INVESTOR') {
            return NextResponse.redirect(new URL('/investor', request.url));
          }
          if (role === 'SALESMAN') {
            return NextResponse.redirect(new URL('/sales/add-sales', request.url));
          }
        }
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. Protect ALL dashboard routes AND the root ("/") from logged-out users
  const isProtectedRoute =
    currentPath === "/" ||
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/orders") ||
    currentPath.startsWith("/sales") ||
    currentPath.startsWith("/products") ||
    currentPath.startsWith("/stock") ||
    currentPath.startsWith("/categories") ||
    currentPath.startsWith("/finance") ||
    currentPath.startsWith("/expense") ||
    currentPath.startsWith("/discounts") ||
    currentPath.startsWith("/blogs") ||
    currentPath.startsWith("/reviews") ||
    currentPath.startsWith("/customer-list") ||
    currentPath.startsWith("/role-manager") ||
    currentPath.startsWith("/investor") ||
    currentPath.startsWith("/manage-investor") ||
    currentPath.startsWith("/price-list");

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const userInfo = jwtDecode<DecodedToken>(token);

      // Token expired -> redirect to login
      if (userInfo.exp && userInfo.exp * 1000 < Date.now()) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        // Force delete cookies on the redirect response
        response.cookies.delete("accessToken");
        response.cookies.delete("access_token");
        return response;
      }

      const role = userInfo.role?.toUpperCase();
      if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== 'SALESMAN' && role !== 'INVESTOR') {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Price sheet: Super Admin and Admin only
      if (currentPath.startsWith("/price-list") && role !== "SUPER_ADMIN" && role !== "ADMIN") {
        const home = role === "SALESMAN" ? "/sales/add-sales" : role === "INVESTOR" ? "/investor" : "/login";
        return NextResponse.redirect(new URL(home, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
    "/orders/:path*",
    "/sales/:path*",
    "/products/:path*",
    "/stock/:path*",
    "/categories/:path*",
    "/finance/:path*",
    "/expense/:path*",
    "/discounts/:path*",
    "/blogs/:path*",
    "/reviews/:path*",
    "/customer-list/:path*",
    "/role-manager/:path*",
    "/investor/:path*",
    "/manage-investor/:path*",
    "/price-list/:path*",
  ],
};