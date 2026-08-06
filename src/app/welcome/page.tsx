"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Utensils, BookOpen, Clock, ShieldCheck, Zap } from "lucide-react";

const CHOWDECK_SLIDES = [
  {
    badge: "⚡ FAST HOSTEL DELIVERY",
    title: "Hot Jollof, Suya Pizza & Fresh Juices Delivered 🍲",
    desc: " Craving delicious food between lectures? Get hot meals and cold drinks delivered straight to your hostel door.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
    color: "from-amber-500/10 to-indigo-500/5",
  },
  {
    badge: "📚 CAMPUS ESSENTIALS",
    title: "Lecture Notebooks, Stationery & Snacks ✏️",
    desc: "Never run out of exam supplies, chips, nuts, or toiletries during intense study sessions.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
    color: "from-emerald-500/10 to-indigo-500/5",
  },
  {
    badge: "🎉 EXCLUSIVE DISCOUNTS",
    title: "Student Deals & Real-Time Tracking 🛵",
    desc: "Earn reward points on every order and watch your fast campus rider bring your package live.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80",
    color: "from-indigo-500/10 to-purple-500/5",
  },
];

export default function WelcomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CHOWDECK_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = CHOWDECK_SLIDES[activeSlide];

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] text-[#18181B] font-body flex flex-col justify-between p-6 md:p-10 selection:bg-[#312E81] selection:text-white relative overflow-hidden">
      
      {/* Subtle Background Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* TOP BRAND BAR */}
      <header className="relative z-10 max-w-md md:max-w-xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl relative overflow-hidden border border-slate-200/80 shadow-md">
            <Image src="/icon-192x192.png" alt="Light Marketplace" fill className="object-cover" priority />
          </div>
          <div>
            <span className="text-xl font-extrabold font-heading text-[#18181B] tracking-tight block leading-none">
              Light<span className="text-[#312E81]"> Marketplace</span>
            </span>
            <span className="text-[10px] text-[#71717A] font-semibold tracking-wider uppercase">Campus Delivery</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs text-xs font-bold text-[#312E81]">
          <Zap size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
          <span>Active Campus</span>
        </div>
      </header>

      {/* MAIN CHOWDECK-STYLE ANIMATED HERO CAROUSEL */}
      <main className="relative z-10 max-w-md md:max-w-xl mx-auto w-full my-auto py-6 space-y-6">
        
        <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-950/10 border border-slate-200/80 bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-[#18181B]/85 via-[#18181B]/20 to-transparent`} />

              {/* Floating Pill Badge inside Card */}
              <div className="absolute top-5 left-5">
                <span className="bg-white/90 backdrop-blur-md text-[#312E81] font-heading font-extrabold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg border border-white/40 tracking-wider">
                  {slide.badge}
                </span>
              </div>

              {/* Card Bottom Text Overlay */}
              <div className="absolute bottom-6 inset-x-6 text-white space-y-2">
                <h2 className="font-heading font-extrabold text-xl md:text-2xl tracking-tight leading-snug drop-shadow-sm">
                  {slide.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-200 font-body leading-relaxed font-medium">
                  {slide.desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator inside card */}
          <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
            {CHOWDECK_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeSlide ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Minimal Hero Subhead */}
        <div className="text-center px-2 space-y-2">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#18181B] tracking-tight">
            Anything on campus, <br className="hidden sm:block" /> delivered fast 💡
          </h1>
          <p className="text-xs md:text-sm text-[#71717A] font-body max-w-sm mx-auto">
            Order delicious meals, drinks, groceries, and lecture supplies straight to your hostel.
          </p>
        </div>

      </main>

      {/* BOTTOM ACTION BUTTONS */}
      <footer className="relative z-10 max-w-md md:max-w-xl mx-auto w-full space-y-4 pt-2">
        
        {/* GET STARTED BUTTON -> LINKS TO /signup */}
        <Link
          href="/signup"
          className="w-full h-14 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-full shadow-xl shadow-indigo-950/20 hover:shadow-indigo-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>Get Started</span>
          <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* ALREADY HAVE AN ACCOUNT? LOG IN LINK */}
        <div className="text-center font-body text-sm text-[#71717A] pt-1">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-heading font-extrabold text-[#312E81] hover:underline underline-offset-4"
          >
            Log In
          </Link>
        </div>

      </footer>
    </div>
  );
}
