import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function handleSubdomains(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")?.toLowerCase() || "";
  const pathname = url.pathname;

  // 1. Vendor Subdomain Handling (e.g. vendor.lightsonmarketplace.netlify.app, vendor.lightsonmarketplace.com, vendor.localhost:3000)
  if (hostname.startsWith("vendor.") || hostname.startsWith("merchant.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/vendor/dashboard", req.url));
    }
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/vendor/login", req.url));
    }
    if (pathname === "/register" || pathname === "/signup") {
      return NextResponse.rewrite(new URL("/vendor/register", req.url));
    }
    if (pathname === "/dashboard") {
      return NextResponse.rewrite(new URL("/vendor/dashboard", req.url));
    }
    if (!pathname.startsWith("/vendor") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      return NextResponse.rewrite(new URL(`/vendor${pathname}`, req.url));
    }
    return NextResponse.next();
  }

  // 2. Admin Subdomain Handling (e.g. admin.lightsonmarketplace.netlify.app, admin.lightsonmarketplace.com, admin.localhost:3000)
  if (hostname.startsWith("admin.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin/dashboard", req.url));
    }
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/admin/login", req.url));
    }
    if (pathname === "/dashboard") {
      return NextResponse.rewrite(new URL("/admin/dashboard", req.url));
    }
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
    }
    return NextResponse.next();
  }

  // 3. Default Student Storefront Domain (lightsonmarketplace.netlify.app, lightsonmarketplace.com, localhost:3000)
  return NextResponse.next();
}

export function proxy(req: NextRequest) {
  return handleSubdomains(req);
}

export default function middleware(req: NextRequest) {
  return handleSubdomains(req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
