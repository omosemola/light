"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Building, MapPin, CheckCircle2, UserPlus, Store, ArrowRight } from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { sendStudentWelcomeNotification } from "@/actions/support";
import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { setHasSeenOnboarding, updateProfile } = useUserStore();
  
  // Student Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hostel, setHostel] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const DEFAULT_HUMAN_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

  const handleFinishSignup = (userEmail = email, userName = name) => {
    setIsSubmitting(true);
    setHasSeenOnboarding(true);
    updateProfile({
      name: userName || "Alex Johnson",
      email: userEmail || "alex.johnson@gmail.com",
      hostel: hostel || "Mellanby Hall",
      addressDetail: addressDetail || "Block C, Room 14",
      avatar: DEFAULT_HUMAN_AVATAR,
      isVisitor: false,
    });

    if (userEmail) {
      sendStudentWelcomeNotification({
        email: userEmail,
        name: userName || "Student",
      }).catch((e) => console.error("Welcome email failed:", e));
    }

    setToastMessage(`Account created! Welcome to Lightson, ${(userName || "Student").split(" ")[0]}! 🎉`);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const handleVisitorLogin = () => {
    setIsSubmitting(true);
    setHasSeenOnboarding(true);
    updateProfile({
      name: "Visitor",
      email: "",
      hostel: "Campus Guest",
      phone: "",
      avatar: "/visitor-avatar.png",
      isVisitor: true,
    });

    setToastMessage("Welcome, Visitor! 🚀");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      handleFinishSignup("alex.google@gmail.com", "Alex Johnson");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      setToastMessage("Password can only contain letters (A-Z, a-z) & numbers (0-9)!");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }
    handleFinishSignup();
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 font-body flex flex-col justify-between p-6 md:p-10 selection:bg-[#312E81] selection:text-white transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#312E81] text-white font-heading font-extrabold text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-700"
        >
          <CheckCircle2 size={18} className="text-[#FBBF24]" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Top Header Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 rounded-full bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center justify-center text-[#18181B] dark:text-white active:scale-95 transition-all shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3.5">
          <img src="/logo.png?v=2" alt="Lightson Marketplace" className="h-13 w-auto object-contain" />
          <span className="font-heading font-[900] text-xl md:text-2xl tracking-tight text-[#312E81] dark:text-indigo-300">
            Lights<span className="text-[#F5A623] dark:text-[#FBBF24]">on</span> Marketplace
          </span>
        </div>
      </div>

      {/* Main Signup Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto w-full my-auto py-8"
      >
        <div className="text-center mb-6">
          <h1 className="font-heading font-extrabold text-3xl text-[#18181B] dark:text-white tracking-tight">
            Create an Account ✨
          </h1>
          <p className="text-sm text-[#71717A] dark:text-zinc-400 mt-2">
            Join thousands of students ordering food & essentials on campus.
          </p>
        </div>

        {/* Social / Demo Options */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full h-13 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white font-heading font-bold text-sm rounded-full shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleVisitorLogin}
            disabled={isSubmitting}
            className="w-full h-12 bg-[#F4F3FF] dark:bg-indigo-950/60 hover:bg-[#E0E7FF] dark:hover:bg-indigo-900/60 text-[#312E81] dark:text-indigo-200 font-heading font-bold text-xs rounded-full border border-indigo-100 dark:border-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>⚡ 1-Click Visitor Demo</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
          <span className="bg-[#FAFAF7] dark:bg-[#09090B] px-4 text-xs font-semibold text-[#71717A] dark:text-zinc-500 uppercase tracking-wider absolute">
            Or sign up with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase text-[#71717A] dark:text-zinc-400 mb-1.5 font-heading">
              Full Name <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-medium text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-[#71717A] dark:text-zinc-400 mb-1.5 font-heading">
              Email Address <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.johnson@gmail.com"
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-medium text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-[#71717A] dark:text-zinc-400 mb-1.5 font-heading">
              Password <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="e.g. Pass1234"
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-medium text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
              />
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-zinc-500 mt-1 block">Only letters & numbers allowed (A-Z, a-z, 0-9)</span>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-[#71717A] dark:text-zinc-400 mb-1.5 font-heading">
              Hostel / Hall of Residence <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                placeholder="e.g. Mellanby Hall, Tedder Hall, Queen Idia"
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-medium text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-[#71717A] dark:text-zinc-400 mb-1.5 font-heading">
              Room Number / Delivery Details <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="e.g. Block C Room 14"
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm font-medium text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#312E81] shadow-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-full shadow-xl hover:shadow-indigo-950/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            <UserPlus size={20} />
            <span>{isSubmitting ? "Creating Account..." : "Create Student Account"}</span>
          </button>
        </form>

        {/* DEDICATED MERCHANT PARTNERSHIP CALLOUT CARD */}
        <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5A623] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Store size={20} />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xs text-[#18181B] dark:text-zinc-100 flex items-center gap-1.5">
                Are you a campus store or vendor?
              </span>
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400 font-medium block">
                Sell food, groceries, books, tech, fashion & campus essentials.
              </span>
            </div>
          </div>

          <Link
            href="/vendor/register"
            className="px-3.5 py-2 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Partner</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Link to Login */}
        <div className="text-center mt-6 pt-4 border-t border-slate-200/60 dark:border-zinc-800 font-body text-sm text-[#71717A] dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-heading font-extrabold text-[#312E81] dark:text-indigo-400 hover:underline">
            Log In
          </Link>
        </div>
      </motion.div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#71717A] dark:text-zinc-400 font-body max-w-md mx-auto w-full pt-4">
        By continuing, you agree to Lights<span className="text-[#F5A623]">on</span> Marketplace&apos;s{" "}
        <Link href="/terms" className="font-heading font-bold text-[#312E81] dark:text-indigo-400 underline hover:text-[#1E1B4B] transition-colors">
          Terms of Service
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="font-heading font-bold text-[#312E81] dark:text-indigo-400 underline hover:text-[#1E1B4B] transition-colors">
          Privacy Policy
        </Link>.
      </div>
    </div>
  );
}
