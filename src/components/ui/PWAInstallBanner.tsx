"use client";

import { useState, useEffect } from "react";
import { Download, X, Store, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone PWA mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-50 bg-[#1E1B4B] dark:bg-zinc-900 text-white rounded-3xl p-4 shadow-2xl border border-white/20 dark:border-zinc-700/80 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl relative overflow-hidden shadow-md shrink-0 border border-white/20">
              <img src="/icon-192x192.png" alt="Light Marketplace" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-white flex items-center gap-1.5">
                Install Light App 💡
              </h4>
              <p className="text-xs text-slate-300 dark:text-zinc-400 font-body mt-0.5">
                Fast offline access, push notifications & instant ordering.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBanner(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 bg-[#FBBF24] hover:bg-amber-400 text-[#312E81] font-heading font-extrabold text-xs rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            <span>Install Now</span>
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-body font-semibold text-xs rounded-full transition-colors"
          >
            Not Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
