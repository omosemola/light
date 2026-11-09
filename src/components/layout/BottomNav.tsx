"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { useAuthMachine } from "@/lib/machines/authMachine";
import { CustomHomeIcon } from "@/components/icons/CustomHomeIcon";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { CustomOrdersIcon } from "@/components/icons/CustomOrdersIcon";
import { CustomProfileIcon } from "@/components/icons/CustomProfileIcon";

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuthMachine();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasAccount = isAuthenticated;
  const isVisitorOnboarding =
    (pathname === "/" || pathname === "/welcome") && (!isReady || !isAuthenticated);

  // Hide on onboarding, auth, vendor, and admin pages
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

  if (isNoNav) {
    return null;
  }

  const navItems = [
    {
      name: "Home",
      href: hasAccount ? "/" : "/welcome",
      icon: CustomHomeIcon,
      active: pathname === "/" || pathname === "/welcome",
    },
    {
      name: "Search",
      href: "/search",
      icon: CustomSearchIcon,
      active: pathname === "/search" || pathname.startsWith("/category"),
    },
    {
      name: "Cart",
      href: "/cart",
      icon: CustomCartIcon,
      badge: isMounted ? itemCount : 0,
      active: pathname === "/cart" || pathname.startsWith("/checkout"),
    },
    {
      name: "Orders",
      href: "/orders",
      icon: CustomOrdersIcon,
      active: pathname.startsWith("/orders"),
    },
    {
      name: "Me",
      href: "/profile",
      icon: CustomProfileIcon,
      active: pathname.startsWith("/profile"),
    },
  ];

  return (
    <div className="fixed bottom-3 inset-x-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] max-w-[440px] mx-auto z-50 md:hidden pointer-events-none">
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto relative w-full bg-white/75 dark:bg-[#121215]/75 backdrop-blur-xl backdrop-saturate-150 rounded-full border border-white/70 dark:border-zinc-800/80 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.65)] px-2 py-1.5 transition-all duration-300"
      >
        {/* Subtle accent indicator dot matching screenshot */}
        <span className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-[#EE2A54] rounded-full opacity-90 pointer-events-none" />

        <div className="flex items-center justify-between h-[52px] w-full">
          {navItems.map((item) => {
            const isActive = item.active;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className="relative flex items-center justify-center flex-1 h-full select-none group"
                aria-label={item.name}
              >
                <div
                  className={clsx(
                    "relative flex flex-col items-center justify-center rounded-[22px] px-3.5 py-1 min-w-[60px] h-[48px] transition-all duration-200",
                    isActive
                      ? "text-[#003822] dark:text-zinc-100"
                      : "text-[#003822] dark:text-zinc-300 hover:opacity-85 active:scale-95"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active-capsule"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-[#ECEEED]/85 dark:bg-zinc-800/85 backdrop-blur-md rounded-[22px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none"
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-center">
                    <Icon size={21} active={isActive} />
                    {item.badge ? (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 bg-[#EE2A54] text-white text-[9.5px] font-bold flex items-center justify-center rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={clsx(
                      "relative z-10 text-[10.5px] tracking-tight leading-none mt-1 select-none font-sans transition-all duration-200",
                      isActive
                        ? "font-semibold text-[#003822] dark:text-zinc-100"
                        : "font-medium text-[#003822] dark:text-zinc-300"
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
