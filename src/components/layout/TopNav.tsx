"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Store } from "lucide-react";
import { useCartStore } from "@/lib/store";

export function TopNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());

  if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-600 transition-colors">
            <Store size={20} />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
            Campus<span className="text-indigo-600">Hub</span>
          </span>
        </Link>
        
        <Link href="/search" className="relative w-96 block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <div className="w-full h-11 pl-11 pr-4 rounded-full bg-slate-100 flex items-center text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200">
            Search food, vendors, or products
          </div>
        </Link>
      </div>

      <nav className="flex items-center gap-4">
        <Link 
          href="/cart" 
          className="relative p-3 rounded-full text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all"
          aria-label="View Cart"
        >
          <ShoppingBag size={22} />
          {itemCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[20px] h-[20px] px-1 bg-amber-400 text-slate-900 text-[11px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {itemCount}
            </span>
          )}
        </Link>

        <Link 
          href="/profile" 
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all font-bold text-sm"
        >
          <User size={18} />
          <span>Account</span>
        </Link>
      </nav>
    </header>
  );
}
