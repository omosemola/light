"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthMachine } from "@/lib/machines/authMachine";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuthMachine();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isVisitorOnboarding = (pathname === "/" || pathname === "/welcome") && (!isReady || !isAuthenticated);

  const isNoNav =
    isVisitorOnboarding ||
    pathname === "/welcome" ||
    pathname.startsWith("/welcome/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname === "/vendor/login" ||
    pathname.startsWith("/vendor/login/") ||
    pathname === "/vendor/register" ||
    pathname.startsWith("/vendor/register/") ||
    pathname === "/vendor/dashboard" ||
    pathname.startsWith("/vendor/dashboard/") ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin");

  return (
    <main className={`flex-1 ${isNoNav ? "pb-0" : "pb-20 md:pb-0"}`}>
      {children}
    </main>
  );
}
