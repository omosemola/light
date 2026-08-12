import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Super Admin Portal Route Protection (/admin/dashboard)
    if (path.startsWith("/admin/dashboard")) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?unauthorized=admin", req.url));
      }
    }

    // 2. Vendor Portal Route Protection (/vendor/dashboard)
    if (path.startsWith("/vendor/dashboard")) {
      if (!token || (token.role !== "VENDOR" && token.role !== "ADMIN")) {
        return NextResponse.redirect(new URL("/login?unauthorized=vendor", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes that never require NextAuth server token
        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/signup") ||
          path.startsWith("/welcome") ||
          path.startsWith("/category") ||
          path.startsWith("/product") ||
          path.startsWith("/search") ||
          path.startsWith("/orders") ||
          path.startsWith("/profile") ||
          path.startsWith("/cart") ||
          path.startsWith("/checkout") ||
          path.startsWith("/support") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/paystack/webhook") ||
          path.startsWith("/_next") ||
          path.includes("favicon") ||
          path.includes("logo") ||
          path.includes("manifest.json")
        ) {
          return true;
        }

        // Protected routes require valid auth token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/vendor/dashboard/:path*",
  ],
};
