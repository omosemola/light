"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { authenticateAdmin, checkAdminSession } from "@/actions/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function checkExistingAdmin() {
      const session = await checkAdminSession();
      if (session.isAuthenticated && session.user) {
        updateProfile({
          email: session.user.email,
          name: session.user.name,
          role: "ADMIN",
          isVisitor: false,
        });
        router.replace("/admin/dashboard");
      }
    }
    checkExistingAdmin();
  }, [router, updateProfile]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both your administrator email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await authenticateAdmin(email.trim(), password.trim());
      if (res.success && res.user) {
        updateProfile({
          email: res.user.email || email.trim(),
          name: res.user.name || "Platform Super Admin",
          role: "ADMIN",
          isVisitor: false,
        });

        setToastMessage("Access verified! Opening Admin Command Center...");
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 400);
      } else {
        setErrorMsg(res.error || "Invalid administrator credentials. Access denied.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg("Connection error. Could not authenticate administrator.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 font-body flex flex-col justify-between p-6 md:p-10 selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-heading font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400"
        >
          <CheckCircle2 size={18} className="text-emerald-200" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Top Header Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shadow-sm"
          aria-label="Back to Marketplace"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck size={18} />
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-white">
            Admin<span className="text-indigo-400">Portal</span>
          </span>
        </div>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto w-full my-auto py-8"
      >
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-indigo-950/80 border border-indigo-700/50 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-inner">
              <KeyRound size={26} />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight">
              Platform Admin Sign In 🛡️
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Authorized personnel only. Enter your administrator credentials.
            </p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4 font-body">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1.5 font-heading">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@campuslightson.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1.5 font-heading">
                Security Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-medium">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck size={18} />
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Admin Dashboard"}</span>
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-white font-semibold transition-colors">
            ← Return to Marketplace
          </Link>
        </div>
      </motion.div>

      <div className="text-center text-[11px] text-slate-600 font-medium">
        Lightson Marketplace • Admin Control System
      </div>
    </div>
  );
}
