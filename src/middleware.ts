// File: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role?: string;
  exp: number;
}

export function middleware(request: NextRequest) {
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
          if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
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
    currentPath.startsWith("/expense");

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
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // ✅ Added all your primary dashboard routes to the matcher
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
    "/expense/:path*"
  ],
};