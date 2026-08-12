import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Super Admin Portal Route Protection (/admin/dashboard)
    if (path.startsWith("/admin/dashboard") && token) {
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?unauthorized=admin", req.url));
      }
    }

    // 2. Vendor Portal Route Protection (/vendor/dashboard)
    if (path.startsWith("/vendor/dashboard") && token) {
      if (token.role !== "VENDOR" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?unauthorized=vendor", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // Allow client access to dashboards and public pages
        return true;
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
