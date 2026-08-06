"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShoppingBag, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building, 
  ShieldCheck, 
  ChevronRight,
  Sun,
  Moon
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";

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

const ONBOARDING_SLIDES = [
  {
    badge: "Instant Hostel Delivery",
    title: "Fresh Campus Food & Drinks Delivered Fast 🍲",
    desc: "Order hot Jollof, spicy suya pizza, cold-pressed fruit juices, and snacks from top campus vendors right to your hostel door.",
    accentColor: "from-amber-500/20 to-indigo-600/30",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    stats: "15-20 Mins Avg. Delivery",
  },
  {
    badge: "Lecture Supplies & Care",
    title: "Exam Books, Stationery & Daily Essentials 📚",
    desc: "Never run out of lecture notebooks, pens, skincare, or groceries. Everything you need for campus life in one tap.",
    accentColor: "from-indigo-600/20 to-purple-600/30",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    stats: "100% Verified Campus Vendors",
  },
  {
    badge: "Student Rewards",
    title: "Exclusive Promos & Real-Time Order Tracking ⚡",
    desc: "Earn points on every order, enjoy daily student discounts, and track your fast campus rider live from kitchen to room.",
    accentColor: "from-emerald-500/20 to-amber-500/30",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    stats: "Live Rider GPS Tracking",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { setHasSeenOnboarding, updateProfile } = useUserStore();
  const { isDark, toggleTheme } = useTheme();

  const [activeSlide, setActiveSlide] = useState(0);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  // Form Fields
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex.johnson@gmail.com");
  const [password, setPassword] = useState("password123");
  const [hostel, setHostel] = useState("Mellanby Hall");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Auto-advance slides every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleFinishOnboarding = (userEmail = email, userName = name) => {
    setIsSubmitting(true);
    setHasSeenOnboarding(true);
    updateProfile({
      name: userName || "Alex Johnson",
      email: userEmail || "alex.johnson@gmail.com",
      hostel: hostel || "Mellanby Hall",
    });

    setToastMessage(`Welcome to Campus Hub, ${userName.split(" ")[0]}! 🎉`);
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      // Attempt NextAuth Google Provider Sign In
      await signIn("google", { callbackUrl: "/", redirect: false });
    } catch {
      // Fallback for demonstration preview
    }
    handleFinishOnboarding("alex.google@gmail.com", "Alex Johnson");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFinishOnboarding(email, name);
  };

  const currentSlide = ONBOARDING_SLIDES[activeSlide];

  return (
    <div className="min-h-screen bg-[#0F0E17] text-white font-body relative overflow-hidden flex flex-col justify-between selection:bg-[#FBBF24] selection:text-[#18181B]">
      
      {/* FLOATING AMBIENT GLOW BLOBS */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.5, 0.35],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-96 h-96 bg-[#312E81] rounded-full blur-[120px] pointer-events-none opacity-40"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.45, 0.3],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#FBBF24] rounded-full blur-[130px] pointer-events-none opacity-20"
      />

      {/* TOP BRAND BAR */}
      <header className="relative z-20 px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#312E81] to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50 border border-white/20">
            <Store size={22} />
          </div>
          <div>
            <span className="text-xl font-extrabold font-heading text-white tracking-tight block leading-none">
              Campus<span className="text-[#FBBF24]">Hub</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">University Marketplace</span>
          </div>
        </div>
      </header>

      {/* TOAST MESSAGE NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl border border-emerald-400 flex items-center gap-2 text-sm font-heading font-bold"
          >
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-5 md:px-8 py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        
        {/* LEFT COLUMN: EYE-CATCHING CAROUSEL WITH MOTION */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* TITLE */}
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold leading-tight text-white tracking-tight">
              {currentSlide.title}
            </h1>

            {/* DESCRIPTION */}
            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-body font-normal max-w-xl">
              {currentSlide.desc}
            </p>

            {/* SLIDE IMAGE PREVIEW CARD */}
            <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border border-white/20 shadow-2xl group">
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* CAROUSEL INDICATORS */}
          <div className="flex items-center gap-2 pt-2">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? "w-8 bg-[#FBBF24]" : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN & SIGNUP CARD WITH GMAIL AUTH */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#181824]/90 backdrop-blur-xl border border-white/15 rounded-[32px] p-6 md:p-8 shadow-2xl space-y-6"
          >
            {/* MODE SWITCH TABS */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 relative">
              <button
                onClick={() => setAuthMode("signup")}
                className={`py-2.5 text-xs md:text-sm font-heading font-extrabold rounded-xl transition-all relative z-10 ${
                  authMode === "signup" ? "text-[#18181B] bg-[#FBBF24] shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => setAuthMode("login")}
                className={`py-2.5 text-xs md:text-sm font-heading font-extrabold rounded-xl transition-all relative z-10 ${
                  authMode === "login" ? "text-[#18181B] bg-[#FBBF24] shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                Student Sign In
              </button>
            </div>

            {/* GOOGLE / GMAIL SIGN IN BUTTON */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-heading font-bold text-xs md:text-sm shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-200 group"
              >
                <GoogleIcon />
                <span>Continue with Google / Gmail</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>

            {/* EMAIL / PASSWORD AUTH FORM */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-slate-300 block">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FBBF24] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-slate-300 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.johnson@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FBBF24] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-slate-300 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FBBF24] transition-colors"
                  />
                </div>
              </div>

              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-slate-300 block">Hostel / Campus Hall</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      placeholder="Mellanby Hall"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FBBF24] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#312E81] via-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-[#312E81] text-white font-heading font-extrabold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-indigo-400/30 mt-2"
              >
                <span>{authMode === "signup" ? "Get Started & Join Campus" : "Sign In to Account"}</span>
                <ChevronRight size={18} />
              </button>

            </form>

            {/* QUICK DEMO PREVIEW AUTOFILL */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-body">
              <span className="text-slate-400">Quick Test Drive?</span>
              <button
                type="button"
                onClick={() => handleFinishOnboarding("alex.johnson@gmail.com", "Alex Johnson")}
                className="text-[#FBBF24] hover:underline font-bold"
              >
                1-Click Demo Login 🚀
              </button>
            </div>

          </motion.div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 py-6 text-center text-xs text-slate-500 font-body">
        Campus Marketplace &copy; {new Date().getFullYear()} — Fast, Verified & Student-Focused.
      </footer>

    </div>
  );
}
