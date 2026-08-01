"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Store } from "lucide-react";
import { useCartStore } from "@/lib/store";

export function TopNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm font-body">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-[#312E81] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E1B4B] transition-colors">
            <Store size={20} />
          </div>
          {/* Logo/Brand name: Plus Jakarta Sans */}
          <span className="text-2xl font-extrabold text-[#18181B] font-heading tracking-tight">
            Campus<span className="text-[#312E81]">Hub</span>
          </span>
        </Link>
        
        <Link href="/search" className="relative w-96 block font-body">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A]">
            <Search size={18} />
          </div>
          <div className="w-full h-11 pl-11 pr-4 rounded-full bg-[#FAFAF7] flex items-center text-sm font-medium text-[#71717A] hover:bg-slate-100 transition-colors border border-slate-200">
            Search food, vendors, or products
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-4 font-body">
        <Link 
          href="/cart" 
          className="relative p-3 rounded-full text-[#18181B] hover:text-[#312E81] hover:bg-[#F4F3FF] transition-all"
          aria-label="View Cart"
        >
          <ShoppingBag size={22} />
          {isMounted && itemCount > 0 && (
            /* Cart Badge: Electric Yellow (#FBBF24) + Deep Indigo (#312E81) text */
            <span className="absolute top-1.5 right-1.5 min-w-[20px] h-[20px] px-1 bg-[#FBBF24] text-[#312E81] text-[11px] font-body font-extrabold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {itemCount}
            </span>
          )}
        </Link>

        <Link 
          href="/profile" 
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#F4F3FF] hover:bg-indigo-100 text-[#312E81] transition-all font-body font-semibold text-sm"
        >
          <User size={18} />
          <span>Account</span>
        </Link>
      </nav>
    </header>
  );
}
