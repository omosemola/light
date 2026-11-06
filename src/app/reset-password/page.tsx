"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Mail,
} from "lucide-react";
import { verifyResetToken, resetPasswordWithToken, resetPasswordWithCode } from "@/actions/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("STUDENT");

  // Reset form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Manual code fallback if no token in URL
  const [manualEmail, setManualEmail] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsVerifying(false);
        setIsTokenValid(false);
        setTokenError("No reset token provided. If you have a verification code, you can use it below.");
        return;
      }

      setIsVerifying(true);
      try {
        const res = await verifyResetToken(token);
        if (res.valid) {
          setIsTokenValid(true);
          setUserEmail(res.email || "");
          setUserName(res.userName || "Student");
          setUserRole(res.role || "STUDENT");
        } else {
          setIsTokenValid(false);
          setTokenError(res.error || "This reset link is invalid or has expired.");
        }
      } catch {
        setIsTokenValid(false);
        setTokenError("Failed to verify password reset token.");
      } finally {
        setIsVerifying(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (token) {
        res = await resetPasswordWithToken(token, newPassword);
      } else {
        res = await resetPasswordWithCode(manualEmail.trim(), manualCode.trim(), newPassword);
      }

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          const targetLogin = userRole === "VENDOR" ? "/vendor/login" : "/login";
          router.push(targetLogin);
        }, 2200);
      } else {
        setFormError(res.error || "Failed to update password. Please try again.");
      }
    } catch {
      setFormError("Connection error while updating password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginRedirectPath = userRole === "VENDOR" ? "/vendor/login" : "/login";

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] text-[#18181B] font-body flex flex-col justify-between p-6 md:p-10 selection:bg-[#312E81] selection:text-white">
      {/* Top Header Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          href={loginRedirectPath}
          className="font-heading font-extrabold text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <span>← Back to Sign In</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <img src="/logo.png?v=2" alt="Lightson Marketplace" className="h-11 w-auto object-contain" />
          <span className="font-heading font-black text-xl tracking-tight text-[#312E81]">
            Lights<span className="text-[#F5A623]">on</span>
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md mx-auto w-full my-auto py-8"
      >
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 md:p-9 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle Accent Glows */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* 1. Loading State */}
          {isVerifying && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-heading font-bold text-sm text-slate-600">
                Verifying secure reset link...
              </p>
            </div>
          )}

          {/* 2. Success Celebration State */}
          {!isVerifying && isSuccess && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Password Updated! 🎉
                </h2>
                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  Your password has been changed securely in our database. Redirecting you to sign in...
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={loginRedirectPath}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#312E81] text-white font-heading font-bold text-xs rounded-full shadow-md hover:bg-[#1E1B4B] transition-all"
                >
                  <span>Go to Sign In Now</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* 3. Valid Token Form */}
          {!isVerifying && !isSuccess && isTokenValid && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-[#312E81] border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShieldCheck size={26} />
                </div>
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Choose New Password 🔐
                </h1>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                  Setting new password for <span className="font-bold text-slate-800">{userEmail}</span>
                </p>
              </div>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium"
                  >
                    <AlertCircle size={15} className="shrink-0 text-rose-500" />
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#71717A] mb-1.5 font-heading">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-12 pl-11 pr-11 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#71717A] mb-1.5 font-heading">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] transition-all"
                    />
                  </div>
                </div>

                {/* Password validation indicators */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className={newPassword.length >= 6 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {newPassword.length >= 6 ? "✓" : "○"} Minimum 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        confirmPassword && newPassword === confirmPassword
                          ? "text-emerald-600 font-bold"
                          : "text-slate-400"
                      }
                    >
                      {confirmPassword && newPassword === confirmPassword ? "✓" : "○"} Passwords match
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-full shadow-xl hover:shadow-indigo-950/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>{isSubmitting ? "Updating Password..." : "Update Password & Sign In"}</span>
                </button>
              </form>
            </>
          )}

          {/* 4. Invalid Token or Fallback Code Mode */}
          {!isVerifying && !isSuccess && !isTokenValid && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <AlertCircle size={28} />
                </div>
                <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                  Reset Link Expired or Invalid
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  {tokenError}
                </p>
              </div>

              {/* Option to request new link */}
              <div className="pt-2 space-y-3">
                <Link
                  href="/forgot-password"
                  className="w-full h-12 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <RefreshCw size={15} />
                  <span>Request a Fresh Reset Link</span>
                </Link>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                    Or Enter Code
                  </span>
                </div>

                {/* Form to enter 6-digit code manually */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#71717A] mb-1 font-heading">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="your.email@university.edu"
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#71717A] mb-1 font-heading">
                      6-Digit Code
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 583912"
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#71717A] mb-1 font-heading">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#71717A] mb-1 font-heading">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2"
                      >
                        <AlertCircle size={14} className="shrink-0 text-rose-500" />
                        <span>{formError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-heading font-black text-xs rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSubmitting ? "Updating Password..." : "Submit New Password"}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-[#71717A] font-body max-w-md mx-auto w-full pt-4">
        Lightson Marketplace • Safe & Swift Campus Ordering
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#FAFAF7] flex items-center justify-center p-6">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

