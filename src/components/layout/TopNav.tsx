"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Sun, Moon } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTheme } from "@/components/providers/ThemeProvider";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { CustomProfileIcon } from "@/components/icons/CustomProfileIcon";

import { useUserStore } from "@/lib/userStore";

export function TopNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isMounted, setIsMounted] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { hasSeenOnboarding } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isMounted && (!hasSeenOnboarding || pathname === "/welcome" || pathname.startsWith("/vendor") || pathname.startsWith("/admin"))) {
    return null;
  }

  return (
    <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white dark:bg-[#121215] border-b border-slate-200 dark:border-zinc-800/80 sticky top-0 z-50 shadow-sm font-body transition-colors duration-200">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-[#312E81] dark:bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E1B4B] dark:group-hover:bg-indigo-500 transition-colors">
            <Store size={20} />
          </div>
          <span className="text-2xl font-extrabold text-[#18181B] dark:text-zinc-100 font-heading tracking-tight">
            Campus<span className="text-[#312E81] dark:text-indigo-400">Hub</span>
          </span>
        </Link>
        
        <Link href="/search" className="relative w-96 block font-body">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A] dark:text-zinc-400">
            <CustomSearchIcon size={18} />
          </div>
          <div className="w-full h-11 pl-11 pr-4 rounded-full bg-[#FAFAF7] dark:bg-zinc-800/80 flex items-center text-sm font-medium text-[#71717A] dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-slate-200 dark:border-zinc-700/60">
            Search food, vendors, or products
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-4 font-body">
        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-slate-200/60 dark:border-zinc-700/60"
          aria-label="Toggle Theme"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} className="text-[#312E81]" />
          )}
        </button>

        <Link 
          href="/cart" 
          className="relative p-3 rounded-full text-[#18181B] dark:text-zinc-100 hover:text-[#312E81] dark:hover:text-indigo-300 hover:bg-[#F4F3FF] dark:hover:bg-zinc-800 transition-all"
          aria-label="View Cart"
        >
          <CustomCartIcon size={22} />
          {isMounted && itemCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[20px] h-[20px] px-1 bg-[#FBBF24] text-[#312E81] text-[11px] font-body font-extrabold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 shadow-sm">
              {itemCount}
            </span>
          )}
        </Link>

        <Link 
          href="/profile" 
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#F4F3FF] dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#312E81] dark:text-indigo-200 transition-all font-body font-semibold text-sm border border-indigo-100 dark:border-indigo-800/50"
        >
          <CustomProfileIcon size={18} />
          <span>Account</span>
        </Link>
      </nav>
    </header>
  );
}
