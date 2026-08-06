"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

// CORPORATE MEMPHIS FLAT VECTOR ART 1: FOOD & DRINKS (FLOATING WITHOUT BOX CONTAINER)
function FoodMemphisIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center relative p-2">
      {/* Decorative Floating Geometric Confetti */}
      <motion.div
        animate={{ rotate: 360, y: [-6, 6, -6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-2 left-6 text-[#F43F5E] opacity-75 font-bold text-2xl select-none pointer-events-none"
      >
        ✦
      </motion.div>
      <motion.div
        animate={{ y: [0, -10, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 right-8 text-[#10B981] opacity-75 font-bold text-2xl select-none pointer-events-none"
      >
        ▲
      </motion.div>
      <motion.div
        animate={{ x: [-6, 6, -6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-4 left-10 w-7 h-7 rounded-full border-4 border-[#312E81] opacity-40 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 right-12 text-[#FBBF24] opacity-80 font-bold text-2xl select-none pointer-events-none"
      >
        ★
      </motion.div>

      {/* Main Floating Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[320px] max-h-[250px] drop-shadow-xl" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <path d="M50 65 L90 105 L40 110 Z" fill="#F59E0B" />
          <path d="M50 65 L90 105" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" />
          <circle cx="58" cy="90" r="5" fill="#E11D48" />
          <circle cx="72" cy="96" r="4" fill="#E11D48" />
        </g>

        {/* Floating Noodle/Jollof Bowl */}
        <g>
          <path d="M225 70 C225 100 275 100 275 70 Z" fill="#10B981" />
          <path d="M230 70 H270" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
          <path d="M240 45 L255 65 M255 45 L265 65" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

// CORPORATE MEMPHIS FLAT VECTOR ART 2: BOOKS & ESSENTIALS (FLOATING WITHOUT BOX CONTAINER)
function SuppliesMemphisIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center relative p-2">
      {/* Decorative Floating Geometric Confetti */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 left-8 text-[#312E81] opacity-75 font-bold text-3xl select-none pointer-events-none"
      >
        ●
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-6 right-8 text-[#F59E0B] opacity-75 font-bold text-2xl select-none pointer-events-none"
      >
        ✦
      </motion.div>
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 right-10 text-[#F43F5E] opacity-75 font-bold text-xl select-none pointer-events-none"
      >
        ▲
      </motion.div>

      {/* Main Floating Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[320px] max-h-[250px] drop-shadow-xl" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// CORPORATE MEMPHIS FLAT VECTOR ART 3: FAST COURIER & REWARDS (FLOATING WITHOUT BOX CONTAINER)
function DeliveryMemphisIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center relative p-2">
      {/* Motion Speed Lines */}
      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 left-6 space-y-2 opacity-60 pointer-events-none"
      >
        <div className="w-14 h-1.5 bg-[#312E81] rounded-full" />
        <div className="w-9 h-1.5 bg-[#312E81] rounded-full" />
      </motion.div>
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-8 text-[#10B981] font-bold text-2xl select-none opacity-80 pointer-events-none"
      >
        ✦
      </motion.div>

      {/* Main Floating Corporate Memphis SVG Illustration */}
      <svg className="w-full h-full max-w-[320px] max-h-[250px] drop-shadow-xl" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    title: "Hot Jollof, Suya Pizza & Fresh Juices Delivered 🍲",
    desc: "Order hot meals, cold drinks, and snacks from top campus kitchens delivered directly to your hostel door.",
    Component: FoodMemphisIllustration,
  },
  {
    title: "Lecture Notebooks, Stationery & Snacks ✏️",
    desc: "Never run out of exam notebooks, pens, skincare, or dorm groceries during intense study sessions.",
    Component: SuppliesMemphisIllustration,
  },
  {
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
      <header className="relative z-10 max-w-md md:max-w-xl mx-auto w-full flex items-center justify-[flex-start]">
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
      </header>

      {/* MAIN BORDERLESS FLOATING CORPORATE MEMPHIS VECTOR ART HERO */}
      <main className="relative z-10 max-w-md md:max-w-xl mx-auto w-full my-auto py-4 space-y-4">
        
        {/* Floating Vector Graphic Illustration (No card box container!) */}
        <div className="relative w-full aspect-[4/3] max-h-[290px] flex items-center justify-center my-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full flex items-center justify-center"
            >
              <ActiveIllustration />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Dots Pill */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            {CHOWDECK_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeSlide ? "w-6 bg-[#312E81]" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="text-center px-2 space-y-2 pt-2">
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
        
        {/* GET STARTED BUTTON WITH CONIC OUTLINE CSS (ROUNDED-2XL) -> LINKS TO /signup */}
        <div className="animated-cart-btn-wrapper w-full">
          <div className="animated-cart-btn-effect">
            <div />
          </div>

          <Link
            href="/signup"
            className="animated-cart-btn font-body font-bold shadow-xl shadow-indigo-950/25 hover:shadow-indigo-900/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 group flex items-center justify-center gap-2 rounded-2xl"
          >
            <span className="font-heading font-extrabold tracking-wider text-base text-white">
              Get Started
            </span>
            <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

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
