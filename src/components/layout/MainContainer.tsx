"use client";

import { usePathname } from "next/navigation";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoNav =
    pathname === "/welcome" ||
    pathname === "/admin/dashboard" ||
    pathname.startsWith("/admin/dashboard/") ||
    pathname === "/vendor/dashboard" ||
    pathname.startsWith("/vendor/dashboard/");

  return (
    <main className={`flex-1 ${isNoNav ? "pb-0" : "pb-20 md:pb-0"}`}>
      {children}
    </main>
  );
}
