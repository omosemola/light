import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SearchLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32">
      {/* Sticky Header Skeleton */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-sm space-y-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="relative flex-1">
            <div className="w-full h-12 rounded-full bg-[#F4F3FF]/70 dark:bg-zinc-800/80 animate-pulse border border-indigo-100/50 dark:border-zinc-700/50" />
          </div>

          <div className="w-24 h-12 rounded-full bg-[#312E81]/20 dark:bg-indigo-600/20 animate-pulse shrink-0" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-4xl mx-auto pt-1 pb-0.5 px-0.5">
          {[80, 70, 90, 65, 85, 100].map((w, idx) => (
            <div
              key={idx}
              style={{ width: `${w}px` }}
              className="h-8 rounded-full bg-slate-200/60 dark:bg-zinc-800 animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121215] rounded-[16px] p-2 border border-slate-200/80 dark:border-zinc-800/80 space-y-2 animate-pulse"
            >
              <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-1/2" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                <div className="h-6 w-6 bg-slate-200 dark:bg-zinc-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
