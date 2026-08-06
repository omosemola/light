"use client";

import { usePathname } from "next/navigation";
import { useUserStore } from "@/lib/userStore";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasSeenOnboarding } = useUserStore();
  const isNoNav = !hasSeenOnboarding || pathname === "/welcome" || pathname.startsWith("/vendor") || pathname.startsWith("/admin");

  return (
    <main className={`flex-1 ${isNoNav ? "pb-0" : "pb-20 md:pb-0"}`}>
      {children}
    </main>
  );
}
