// File: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role?: string;
  exp: number;
}

// ✅ Must be named `middleware` (Next.js searches for this specific export)
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const currentPath = request.nextUrl.pathname;

  // 1. If visiting login or root and already authenticated with a valid token
  if (currentPath === "/login" || currentPath === "/") {
    if (token) {
      try {
        const userInfo = jwtDecode<DecodedToken>(token);

        // Check token validity
        if (userInfo.exp && userInfo.exp * 1000 >= Date.now()) {
          const role = userInfo.role?.toUpperCase();
          if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // 2. Protect dashboard or admin routes from logged-out users
  if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const userInfo = jwtDecode<DecodedToken>(token);

      // Token expired -> redirect to login
      if (userInfo.exp && userInfo.exp * 1000 < Date.now()) {
        return NextResponse.redirect(new URL("/login", request.url));
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
  matcher: ["/", "/login", "/dashboard/:path*", "/admin/:path*"],
};