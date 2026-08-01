"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import clsx from "clsx";
import { useCartStore } from "@/lib/store";

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
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: isMounted ? itemCount : 0 },
    { name: "Orders", href: "/orders", icon: ClipboardList },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-md pb-safe z-50 md:hidden">
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
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
              aria-label={item.name}
            >
              <div
                className={clsx(
                  "flex items-center justify-center p-1.5 rounded-2xl relative transition-colors",
                  isActive && "bg-indigo-50 text-indigo-600"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={clsx("text-[10px] mt-0.5 font-bold tracking-tight", isActive && "text-indigo-600")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
