"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global crash captured:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-[#121215] rounded-3xl p-8 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Application Error
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              An unexpected issue occurred while rendering the page. Click below to reload.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full h-12 bg-[#312E81] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-[#1E1B4B] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw size={16} />
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
