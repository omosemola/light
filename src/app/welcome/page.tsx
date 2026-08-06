"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Star } from "lucide-react";

// CORPORATE MEMPHIS FLAT VECTOR ART 1: FOOD & DRINKS
function FoodMemphisIllustration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#FFF7ED] via-[#F4F3FF] to-[#EFF6FF] flex items-center justify-center relative overflow-hidden p-6">
      {/* Decorative Geometric Confetti */}
      <motion.div
        animate={{ rotate: 360, y: [-4, 4, -4] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute top-6 left-8 text-[#F43F5E] opacity-70 font-bold text-xl select-none"
      >
        ✦
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 text-[#10B981] opacity-70 font-bold text-2xl select-none"
      >
        ▲
      </motion.div>
      <motion.div
        animate={{ x: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-12 w-6 h-6 rounded-full border-4 border-[#312E81] opacity-40"
      />

      {/* Main Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[280px] max-h-[220px]" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Table / Base shadow */}
        <ellipse cx="160" cy="210" rx="120" ry="14" fill="#E2E8F0" opacity="0.6" />
        
        {/* Character Base Body (Corporate Memphis Alegria Style) */}
        <path d="M120 120 C120 70 200 70 200 120 V180 H120 Z" fill="#312E81" />
        <circle cx="160" cy="65" r="28" fill="#F87171" />
        <path d="M142 55 C142 40 178 40 178 55 C178 45 160 38 142 55 Z" fill="#1E293B" />
        
        {/* Character Arms holding giant bag */}
        <path d="M120 110 C80 130 90 170 125 155" stroke="#F87171" strokeWidth="16" strokeLinecap="round" />
        <path d="M200 110 C240 130 230 170 195 155" stroke="#F87171" strokeWidth="16" strokeLinecap="round" />

        {/* Giant Yellow Delivery Bag with Lightbulb */}
        <rect x="125" y="115" width="70" height="85" rx="16" fill="#FBBF24" />
        <path d="M145 115 C145 95 175 95 175 115" stroke="#D97706" strokeWidth="6" fill="none" />
        <circle cx="160" cy="155" r="16" fill="#312E81" />
        <path d="M160 145 V165 M150 155 H170" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />

        {/* Floating Suya Pizza Slice */}
        <g className="animate-bounce" style={{ animationDuration: '3s' }}>
          <path d="M60 70 L95 110 L45 115 Z" fill="#F59E0B" />
          <path d="M60 70 L95 110" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" />
          <circle cx="65" cy="95" r="5" fill="#E11D48" />
          <circle cx="78" cy="100" r="4" fill="#E11D48" />
        </g>

        {/* Floating Noodle/Jollof Bowl */}
        <g>
          <path d="M220 75 C220 105 270 105 270 75 Z" fill="#10B981" />
          <path d="M225 75 H265" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
          <path d="M235 50 L250 70 M250 50 L260 70" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

// CORPORATE MEMPHIS FLAT VECTOR ART 2: BOOKS & ESSENTIALS
function SuppliesMemphisIllustration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#E6F4EA] via-[#F4F3FF] to-[#FFF8E1] flex items-center justify-center relative overflow-hidden p-6">
      {/* Decorative Geometric Confetti */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 left-10 text-[#312E81] opacity-70 font-bold text-2xl select-none"
      >
        ●
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-8 right-8 text-[#F59E0B] opacity-70 font-bold text-2xl select-none"
      >
        ✦
      </motion.div>

      {/* Main Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[280px] max-h-[220px]" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ground Shadow */}
        <ellipse cx="160" cy="215" rx="110" ry="12" fill="#CBD5E1" opacity="0.6" />

        {/* Stacked Giant Textbooks */}
        <rect x="70" y="175" width="180" height="28" rx="6" fill="#312E81" />
        <rect x="70" y="175" width="25" height="28" fill="#4338CA" />

        <rect x="85" y="150" width="150" height="26" rx="6" fill="#10B981" />
        <rect x="85" y="150" width="22" height="26" fill="#059669" />

        <rect x="100" y="126" width="120" height="25" rx="6" fill="#F59E0B" />
        <rect x="100" y="126" width="18" height="25" fill="#D97706" />

        {/* Character sitting on books holding smartphone */}
        <circle cx="160" cy="50" r="22" fill="#FB923C" />
        <path d="M145 72 C145 60 175 60 175 72 V126 H145 Z" fill="#6366F1" />
        
        {/* Legs bent casually */}
        <path d="M148 126 C130 145 110 145 115 170" stroke="#FB923C" strokeWidth="12" strokeLinecap="round" />
        <path d="M172 126 C190 145 210 145 205 170" stroke="#FB923C" strokeWidth="12" strokeLinecap="round" />

        {/* Floating Pen & Notebook */}
        <g className="animate-pulse">
          <rect x="235" y="60" width="35" height="50" rx="6" fill="#F43F5E" transform="rotate(15 235 60)" />
          <line x1="242" y1="75" x2="262" y2="70" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <line x1="244" y1="88" x2="264" y2="83" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

// CORPORATE MEMPHIS FLAT VECTOR ART 3: FAST COURIER & REWARDS
function DeliveryMemphisIllustration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#EFF6FF] via-[#FFF1F2] to-[#FEF3C7] flex items-center justify-center relative overflow-hidden p-6">
      {/* Motion Speed Lines */}
      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-12 left-6 space-y-2 opacity-50"
      >
        <div className="w-12 h-1 bg-[#312E81] rounded-full" />
        <div className="w-8 h-1 bg-[#312E81] rounded-full" />
      </motion.div>

      {/* Main Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[280px] max-h-[220px]" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Road Base Shadow */}
        <ellipse cx="160" cy="210" rx="130" ry="10" fill="#94A3B8" opacity="0.4" />

        {/* Scooter Wheels */}
        <circle cx="100" cy="180" r="28" fill="#1E293B" />
        <circle cx="100" cy="180" r="14" fill="#E2E8F0" />

        <circle cx="220" cy="180" r="28" fill="#1E293B" />
        <circle cx="220" cy="180" r="14" fill="#E2E8F0" />

        {/* Scooter Body Frame */}
        <path d="M100 180 H220 C220 180 200 145 160 145 H120 Z" fill="#FBBF24" />
        <rect x="80" y="125" width="45" height="40" rx="8" fill="#312E81" />
        <circle cx="102" cy="145" r="8" fill="#FBBF24" />

        {/* Rider Character Body (Alegria Corporate Memphis) */}
        <path d="M140 100 L170 145 H130 Z" fill="#EF4444" />
        <circle cx="145" cy="75" r="18" fill="#38BDF8" /> {/* Helmet */}
        <path d="M145 75 L160 75" stroke="white" strokeWidth="4" strokeLinecap="round" />

        {/* Handlebars */}
        <path d="M185 110 L205 145" stroke="#475569" strokeWidth="6" strokeLinecap="round" />

        {/* Floating Reward Star Badge */}
        <g className="animate-bounce" style={{ animationDuration: '2.5s' }}>
          <circle cx="250" cy="65" r="22" fill="#F59E0B" />
          <path d="M250 53 L254 62 L264 63 L257 70 L259 79 L250 74 L241 79 L243 70 L236 63 L246 62 Z" fill="white" />
        </g>
      </svg>
    </div>
  );
}

const CHOWDECK_SLIDES = [
  {
    badge: "⚡ FAST HOSTEL DELIVERY",
    title: "Hot Jollof, Suya Pizza & Fresh Juices Delivered 🍲",
    desc: "Order hot meals, cold drinks, and snacks from top campus kitchens delivered directly to your hostel door.",
    Component: FoodMemphisIllustration,
  },
  {
    badge: "📚 CAMPUS ESSENTIALS",
    title: "Lecture Notebooks, Stationery & Snacks ✏️",
    desc: "Never run out of exam notebooks, pens, skincare, or dorm groceries during intense study sessions.",
    Component: SuppliesMemphisIllustration,
  },
  {
    badge: "🎉 EXCLUSIVE DISCOUNTS",
    title: "Student Deals & Real-Time Live Tracking 🛵",
    desc: "Earn reward points on every order and watch your fast campus rider bring your package live.",
    Component: DeliveryMemphisIllustration,
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
  const ActiveIllustration = slide.Component;

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

      {/* MAIN CORPORATE MEMPHIS VECTOR ART HERO CAROUSEL */}
      <main className="relative z-10 max-w-md md:max-w-xl mx-auto w-full my-auto py-6 space-y-6">
        
        <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden shadow-xl shadow-indigo-950/10 border border-slate-200/80 bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Corporate Memphis Vector Graphic Scene */}
              <div className="flex-1 w-full relative">
                <ActiveIllustration />
              </div>

              {/* Floating Pill Badge inside Card */}
              <div className="absolute top-5 left-5 z-20">
                <span className="bg-white/95 backdrop-blur-md text-[#312E81] font-heading font-extrabold text-[11px] px-3.5 py-1.5 rounded-full shadow-md border border-slate-200/60 tracking-wider">
                  {slide.badge}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator inside card */}
          <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            {CHOWDECK_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeSlide ? "w-5 bg-[#312E81]" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Minimal Hero Subhead */}
        <div className="text-center px-2 space-y-2">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#18181B] tracking-tight leading-tight">
            {slide.title}
          </h1>
          <p className="text-xs md:text-sm text-[#71717A] font-body max-w-sm mx-auto leading-relaxed">
            {slide.desc}
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
