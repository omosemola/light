"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, Lock, Building, Scale, CheckCircle2, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function TermsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* HEADER BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#1E1B4B] dark:bg-zinc-900 text-white px-5 pt-8 pb-10 rounded-b-[36px] shadow-md border-b border-indigo-950 dark:border-zinc-800"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3.5"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-300" />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FBBF24] text-[#312E81] font-heading font-extrabold text-[11px] px-3 py-0.5 rounded-full mb-2">
              <ShieldCheck size={13} /> Official Campus Governance
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
              Terms & Privacy Policy
            </h1>
            <p className="text-xs text-slate-300 dark:text-zinc-400 font-normal mt-0.5">
              Last Updated: August 2026 • Light Marketplace Governance Protocol
            </p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-4xl mx-auto w-full px-5 py-6 space-y-6 -mt-6 relative z-20">
        
        {/* TAB SWITCHER */}
        <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-3 rounded-xl font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "terms"
                ? "bg-[#312E81] text-white shadow-md"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            <FileText size={16} /> Terms of Service
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 rounded-xl font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === "privacy"
                ? "bg-[#312E81] text-white shadow-md"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            <Lock size={16} /> Privacy Policy
          </button>
        </div>

        {/* TERMS OF SERVICE CONTENT */}
        {activeTab === "terms" && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed font-body"
          >
            <section className="space-y-2">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Scale className="text-[#312E81] dark:text-indigo-400" size={18} />
                1. Campus Marketplace Operations
              </h2>
              <p>
                Light Marketplace operates as a multi-vendor platform dedicated to connecting verified campus food vendors, student bakeries, stationery outlets, and campus service providers directly with university students. By creating an account, you agree to provide accurate hostel address details for room-to-room order delivery.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Building className="text-[#312E81] dark:text-indigo-400" size={18} />
                2. Order Fulfillment & Hostel Delivery
              </h2>
              <p>
                Orders placed before vendor closing hours are fulfilled by assigned student couriers. Delivery fees are fixed per order. Students are required to remain reachable via their registered phone number upon dispatch notification.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="text-[#312E81] dark:text-indigo-400" size={18} />
                3. Refunds & Cancellation Policy
              </h2>
              <p>
                Cancellations can be made within 3 minutes of placing an order before the vendor begins preparation. If a delivered food item is incorrect or damaged, full refunds or replacements are issued within 24 hours via Paystack or direct campus wallet credit.
              </p>
            </section>
          </motion.div>
        )}

        {/* PRIVACY POLICY CONTENT */}
        {activeTab === "privacy" && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed font-body"
          >
            <section className="space-y-2">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Lock className="text-[#312E81] dark:text-indigo-400" size={18} />
                1. Data We Collect
              </h2>
              <p>
                To facilitate campus delivery, we collect your name, university email address, hostel block/room number, and phone number. We strictly use 256-bit encryption for payment transaction metadata via Paystack.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="text-[#312E81] dark:text-indigo-400" size={18} />
                2. How We Protect Your Information
              </h2>
              <p>
                Your personal delivery data is only visible to the assigned student rider for the duration of the active delivery. We never sell, share, or rent student personal data to third-party advertisers.
              </p>
            </section>
          </motion.div>
        )}

        <div className="text-center text-xs text-[#71717A] dark:text-zinc-400 font-body">
          Have questions? Visit our{" "}
          <Link href="/support" className="font-heading font-bold text-[#312E81] dark:text-indigo-400 underline">
            Campus Help & Support Page
          </Link>
        </div>
      </div>
    </div>
  );
}
