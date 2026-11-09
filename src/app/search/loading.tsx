import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SearchLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32">
      {/* Sticky Glassmorphic Header Skeleton */}
      <div className="px-4 sm:px-6 pt-4 pb-3.5 bg-white/80 dark:bg-[#0E0E12]/80 backdrop-blur-2xl border-b border-slate-200/70 dark:border-zinc-800/80 sticky top-0 md:top-20 z-40 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 sm:gap-3 max-w-5xl mx-auto">
          <Link
            href="/"
            className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-[#1E1B4B] dark:text-indigo-300 flex items-center justify-center shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="relative flex-1">
            <div className="w-full h-11 sm:h-12 rounded-2xl bg-slate-100/85 dark:bg-zinc-800/80 animate-pulse border border-slate-200/60 dark:border-zinc-700/60" />
          </div>

          <div className="w-24 h-11 sm:h-12 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 animate-pulse shrink-0" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-5xl mx-auto pt-0.5 pb-1 px-0.5">
          {[76, 92, 74, 88, 82, 84, 96, 86, 102].map((w, idx) => (
            <div
              key={idx}
              style={{ width: `${w}px` }}
              className="h-9 rounded-xl bg-slate-200/60 dark:bg-zinc-800 animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full mt-5 space-y-6">
        {/* Trending Card Skeleton */}
        <div className="bg-white dark:bg-[#121215] rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-zinc-800/80 space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded-md" />
          <div className="flex flex-wrap gap-2">
            {[95, 110, 88, 84, 90, 80, 100].map((w, i) => (
              <div
                key={i}
                style={{ width: `${w}px` }}
                className="h-8 rounded-xl bg-slate-100 dark:bg-zinc-800/80"
              />
            ))}
          </div>
        </div>

        {/* Stores Section Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3.5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-64 sm:w-68 h-28 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/70 dark:border-zinc-800 animate-pulse p-3.5"
              />
            ))}
          </div>
        </div>

        {/* Catalog Grid Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#121215] rounded-2xl p-2 border border-slate-200/80 dark:border-zinc-800/80 space-y-2 animate-pulse"
              >
                <div className="w-full aspect-[4/3] rounded-xl bg-slate-100 dark:bg-zinc-800" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                  <div className="h-6 w-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
