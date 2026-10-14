"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error captured:", error);

    // Auto-recover from stale chunks after deployments / service-worker mismatches
    const msg = (error?.message || "").toLowerCase();
    const isChunkError =
      msg.includes("chunk") ||
      msg.includes("loading dynamically imported module") ||
      msg.includes("failed to fetch");

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "lightson_chunk_reload";
      const hasReloaded = sessionStorage.getItem(reloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 flex items-center justify-center px-5 py-12 font-body">
      <div className="max-w-md w-full bg-white dark:bg-[#121215] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-zinc-800 shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#18181B] dark:text-zinc-100 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed">
            We ran into a temporary hiccup loading this page. Please try refreshing or return to the marketplace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 h-12 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw size={16} />
            Try Again
          </button>

          <Link
            href="/"
            className="flex-1 h-12 bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all border border-indigo-100 dark:border-zinc-700"
          >
            <Home size={16} />
            Campus Home
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && error?.digest && (
          <p className="text-[10px] text-zinc-400 font-mono pt-2">
            Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
