"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, Lock, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff, ChefHat, ArrowRight, AlertCircle } from "lucide-react";
import { authenticateVendor } from "@/actions/vendor";
import { useUserStore } from "@/lib/userStore";

export default function VendorLoginPage() {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleVendorAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter your store email address and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await authenticateVendor(email.trim(), password.trim());
      if (res.success) {
        updateProfile({
          email: res.userEmail || email.trim(),
          name: res.storeName || "Campus Merchant",
          isVisitor: false,
        });

        setToastMessage(`Welcome back! Opening ${res.storeName || "Store"} Terminal...`);
        setTimeout(() => {
          window.location.href = "/vendor/dashboard";
        }, 600);
      } else {
        setErrorMsg(res.error || "Invalid vendor credentials. Please check your email and password.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg("Failed to connect to merchant database. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] text-[#18181B] font-body flex flex-col justify-between p-6 md:p-10 selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white font-heading font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-700"
        >
          <CheckCircle2 size={18} className="text-[#FBBF24]" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Top Header Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="w-11 h-11 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
          aria-label="Back to Marketplace"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <Store size={18} />
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-slate-900">
            Vendor<span className="text-amber-500">Portal</span>
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md mx-auto w-full my-auto py-8"
      >
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 md:p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-6 relative z-10">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-3 shadow-inner">
              <ChefHat size={28} />
            </div>
            <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
              Merchant Store Sign In 🏪
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage your campus store catalog, live order alarms & daily sales.
            </p>
          </div>

          <form onSubmit={handleVendorAuth} className="space-y-4 font-body">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1.5 font-heading">
                Store / Vendor Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="vendor@mamacass.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1.5 font-heading">
                Store Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-heading font-black text-sm rounded-xl shadow-md hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
            >
              <Store size={18} />
              <span>{isSubmitting ? "Verifying Credentials..." : "Sign In to Store Dashboard"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Want to sell on campus?{" "}
              <Link href="/vendor/register" className="text-amber-600 hover:text-amber-700 font-extrabold inline-flex items-center gap-1 ml-1 hover:underline">
                Register Your Store <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors">
            ← Return to Marketplace
          </Link>
        </div>
      </motion.div>

      <div className="text-center text-[11px] text-slate-400 font-medium">
        Lightson Marketplace • Merchant Partner Network
      </div>
    </div>
  );
}
