import Link from "next/link";
import { Compass, Home, Search as SearchIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 flex items-center justify-center px-5 py-12 font-body">
      <div className="max-w-md w-full bg-white dark:bg-[#121215] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-zinc-800 shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#312E81] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center mx-auto shadow-sm">
          <Compass size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#312E81] dark:text-indigo-400">
            404 — Page Not Found
          </span>
          <h1 className="font-heading font-extrabold text-2xl text-[#18181B] dark:text-zinc-100 tracking-tight">
            Lost on Campus?
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed">
            The page or item you are looking for doesn’t exist or has been moved to another location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 h-12 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <Home size={16} />
            Go Home
          </Link>

          <Link
            href="/search"
            className="flex-1 h-12 bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all border border-indigo-100 dark:border-zinc-700"
          >
            <SearchIcon size={16} />
            Search Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
