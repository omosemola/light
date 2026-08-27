"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/lib/userStore";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hasSeenOnboarding } = useUserStore();

  const isVisitorOnboarding = (pathname === "/" || pathname === "/welcome") && !hasSeenOnboarding && status !== "authenticated";

  const isNoNav =
    isVisitorOnboarding ||
    pathname === "/welcome" ||
    pathname.startsWith("/welcome/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
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
