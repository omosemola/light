"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCartStore } from "@/lib/store";
import { CustomHomeIcon } from "@/components/icons/CustomHomeIcon";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { CustomOrdersIcon } from "@/components/icons/CustomOrdersIcon";
import { CustomProfileIcon } from "@/components/icons/CustomProfileIcon";

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: CustomHomeIcon },
    { name: "Search", href: "/search", icon: CustomSearchIcon },
    { name: "Cart", href: "/cart", icon: CustomCartIcon, badge: isMounted ? itemCount : 0 },
    { name: "Orders", href: "/orders", icon: CustomOrdersIcon },
    { name: "Profile", href: "/profile", icon: CustomProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-md pb-safe z-50 md:hidden font-body">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] transition-colors relative",
                isActive ? "text-[#312E81]" : "text-[#71717A] hover:text-[#18181B]"
              )}
              aria-label={item.name}
            >
              <div
                className={clsx(
                  "flex items-center justify-center p-1.5 rounded-2xl relative transition-colors",
                  isActive && "bg-[#F4F3FF] text-[#312E81]"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#FBBF24] text-[#312E81] text-[10px] font-body font-extrabold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={clsx("text-[10px] mt-0.5 font-body font-bold tracking-tight", isActive ? "text-[#312E81]" : "text-[#71717A]")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
