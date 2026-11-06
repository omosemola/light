"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { requestPasswordReset, resetPasswordWithCode } from "@/actions/auth";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role") || "student";
  const initialEmail = searchParams.get("email") || "";

  const isVendor = roleParam.toLowerCase() === "vendor";
  const isAdmin = roleParam.toLowerCase() === "admin";

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // 6-digit Code verification state
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResettingWithCode, setIsResettingWithCode] = useState(false);
  const [codeResetSuccess, setCodeResetSuccess] = useState(false);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await requestPasswordReset(email.trim());
      if (res.success) {
        setSubmittedEmail(email.trim());
        setSuccessMsg(res.message || "Reset instructions sent.");
        setResendCooldown(60);
        if (res.devResetUrl) {
          setDevResetUrl(res.devResetUrl);
        }
      } else {
        setErrorMsg(res.error || "Failed to process request. Please try again.");
      }
    } catch {
      setErrorMsg("Connection error. Could not request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsResettingWithCode(true);
    setErrorMsg("");

    try {
      const res = await resetPasswordWithCode(submittedEmail || email.trim(), code.trim(), newPassword);
      if (res.success) {
        setCodeResetSuccess(true);
        setTimeout(() => {
          const targetLogin = isVendor ? "/vendor/login" : isAdmin ? "/admin/login" : "/login";
          router.push(targetLogin);
        }, 1800);
      } else {
        setErrorMsg(res.error || "Failed to reset password. Please check your code.");
      }
    } catch {
      setErrorMsg("Network error. Could not verify code.");
    } finally {
      setIsResettingWithCode(false);
    }
  };

  const backLink = isVendor ? "/vendor/login" : isAdmin ? "/admin/login" : "/login";

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] text-[#18181B] font-body flex flex-col justify-between p-6 md:p-10 selection:bg-[#312E81] selection:text-white">
      {/* Top Header Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          href={backLink}
          className="w-11 h-11 rounded-full bg-white border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-[#18181B] active:scale-95 transition-all shadow-sm"
          aria-label="Back to sign in"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="flex items-center gap-3.5">
          <img src="/logo.png?v=2" alt="Lightson Marketplace" className="h-12 w-auto object-contain" />
          <span className="font-heading font-[900] text-xl md:text-2xl tracking-tight text-[#312E81]">
            Lights<span className="text-[#F5A623]">on</span>
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md mx-auto w-full my-auto py-8"
      >
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 md:p-9 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle Decorative Backdrop */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header Icon & Title */}
          <div className="text-center mb-6 relative z-10">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-sm ${
                isVendor
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : isAdmin
                  ? "bg-slate-900 text-indigo-400 border border-slate-800"
                  : "bg-indigo-50 text-[#312E81] border border-indigo-100"
              }`}
            >
              {isVendor ? <KeyRound size={26} /> : isAdmin ? <ShieldCheck size={26} /> : <Lock size={26} />}
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-wider mb-2 bg-slate-100 text-slate-700">
              {isVendor ? "Merchant Account Recovery" : isAdmin ? "Admin Security Recovery" : "Account Recovery"}
            </div>

            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#18181B] tracking-tight">
              Forgot Password?
            </h1>
            <p className="text-xs md:text-sm text-[#71717A] mt-1.5 font-medium leading-relaxed">
              {submittedEmail && !codeResetSuccess
                ? "We've dispatched recovery instructions to your email."
                : "Enter your registered email address and we'll send you a password reset link and verification code."}
            </p>
          </div>

          {/* Error Message Box */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-medium"
              >
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success / Instructions State */}
          {submittedEmail ? (
            <div className="space-y-5">
              {codeResetSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-emerald-950">Password Reset Complete!</h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    Your password was updated successfully. Redirecting you to sign in...
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 font-heading font-bold text-xs text-[#312E81]">
                      <Mail size={16} />
                      <span>Email sent to:</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 break-all">{submittedEmail}</p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-indigo-100/80">
                      Click the link in your email to reset your password, or enter the 6-digit verification code below.
                    </p>
                  </div>

                  {devResetUrl && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                      <span className="font-bold block mb-1">Development Quick Link:</span>
                      <a href={devResetUrl} className="underline text-indigo-700 break-all font-mono text-[11px]">
                        {devResetUrl}
                      </a>
                    </div>
                  )}

                  {/* Toggle: Reset via 6-digit code */}
                  {!showCodeInput ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(true)}
                        className="w-full h-12 bg-[#F4F3FF] hover:bg-[#E0E7FF] text-[#312E81] font-heading font-bold text-xs rounded-2xl border border-indigo-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <KeyRound size={16} />
                        <span>Enter 6-digit Code on this Screen</span>
                      </button>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                        <span>Didn&apos;t get the email?</span>
                        <button
                          type="button"
                          onClick={() => handleRequestReset()}
                          disabled={resendCooldown > 0 || isSubmitting}
                          className="font-heading font-bold text-[#312E81] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw size={12} className={isSubmitting ? "animate-spin" : ""} />
                          <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleResetWithCode} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-extrabold uppercase text-[#71717A] mb-1.5 font-heading">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 492810"
                          className="w-full h-12 text-center text-xl tracking-[6px] font-mono font-bold rounded-2xl bg-slate-50 border border-slate-200 text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase text-[#71717A] mb-1.5 font-heading">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full h-12 pl-11 pr-11 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                            type={showNewPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isResettingWithCode}
                        className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-full shadow-lg hover:shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={18} />
                        <span>{isResettingWithCode ? "Updating Password..." : "Submit New Password"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCodeInput(false)}
                        className="w-full text-center text-xs font-heading font-bold text-slate-500 hover:text-slate-800 pt-1 cursor-pointer"
                      >
                        Cancel & wait for link
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Email Input Form */
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-[#71717A] mb-1.5 font-heading">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu or store@gmail.com"
                    className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-[#18181B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-full shadow-xl hover:shadow-indigo-950/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                <Mail size={18} />
                <span>{isSubmitting ? "Sending Reset Email..." : "Send Reset Instructions"}</span>
              </button>
            </form>
          )}

          {/* Return to Signin Link */}
          <div className="text-center mt-6 pt-5 border-t border-slate-200/60 font-body text-xs text-[#71717A]">
            Remember your credentials?{" "}
            <Link href={backLink} className="font-heading font-extrabold text-[#312E81] hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-[#71717A] font-body max-w-md mx-auto w-full pt-4">
        Lightson Marketplace • Safe & Swift Campus Ordering
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#FAFAF7] flex items-center justify-center p-6">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
