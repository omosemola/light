"use client";

import { usePathname } from "next/navigation";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isNoNav =
    pathname === "/welcome" ||
    pathname?.startsWith("/welcome/") ||
    pathname === "/login" ||
    pathname?.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname?.startsWith("/signup/") ||
    pathname === "/forgot-password" ||
    pathname?.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname?.startsWith("/reset-password/") ||
    pathname === "/vendor/login" ||
    pathname?.startsWith("/vendor/login/") ||
    pathname === "/vendor/register" ||
    pathname?.startsWith("/vendor/register/") ||
    pathname === "/vendor/dashboard" ||
    pathname?.startsWith("/vendor/dashboard/") ||
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin");

  return (
    <main suppressHydrationWarning className={`flex-1 ${isNoNav ? "pb-0" : "pb-24 md:pb-0"}`}>
      {children}
    </main>
  );
}
