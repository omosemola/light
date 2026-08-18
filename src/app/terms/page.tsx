"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Building, 
  Scale, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Store, 
  Bike, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  DollarSign, 
  BadgePercent,
  CheckCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "merchant">("terms");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "merchant" || tabParam === "vendor" || tabParam === "delivery") {
      setActiveTab("merchant");
    } else if (tabParam === "privacy") {
      setActiveTab("privacy");
    } else if (tabParam === "terms") {
      setActiveTab("terms");
    }
  }, [searchParams]);

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
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3.5 cursor-pointer"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-300" />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FBBF24] text-[#312E81] font-heading font-extrabold text-[11px] px-3 py-0.5 rounded-full mb-2">
              <ShieldCheck size={13} /> Official Campus Governance Protocol
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
              Legal, Merchant Terms & Delivery Protocols
            </h1>
            <p className="text-xs text-slate-300 dark:text-zinc-400 font-normal mt-0.5">
              Effective August 2026 • Lightson Marketplace Standards & Merchant Code of Practice
            </p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-4xl mx-auto w-full px-5 py-6 space-y-6 -mt-6 relative z-20">
        
        {/* 3-TAB SWITCHER */}
        <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-3 px-3 rounded-xl font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "terms"
                ? "bg-[#312E81] text-white shadow-md"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            <FileText size={16} /> Terms of Service
          </button>

          <button
            onClick={() => setActiveTab("merchant")}
            className={`flex-1 py-3 px-3 rounded-xl font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "merchant"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            <Store size={16} /> Merchant & Delivery Protocol 🌟
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 px-3 rounded-xl font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "bg-[#312E81] text-white shadow-md"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            <Lock size={16} /> Privacy Policy
          </button>
        </div>

        {/* MERCHANT TERMS & FAST DELIVERY PROTOCOL CONTENT */}
        {activeTab === "merchant" && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-8 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed font-body"
          >
            {/* HERO HIGHLIGHT */}
            <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border border-amber-500/20 text-[#18181B] dark:text-white">
              <div className="flex items-center gap-2 font-heading font-extrabold text-sm md:text-base text-amber-700 dark:text-amber-400">
                <Store size={18} /> Official Campus Merchant Charter & Fast Delivery Commitment
              </div>
              <p className="text-xs text-[#71717A] dark:text-zinc-300 mt-1">
                This standard protocol governs all campus kitchens, student bakeries, retail stores, and delivery couriers operating on the Lightson Marketplace platform.
              </p>
            </div>

            {/* SECTION 1: MERCHANT ELIGIBILITY & ONBOARDING */}
            <section className="space-y-3">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Building className="text-[#312E81] dark:text-indigo-400" size={20} />
                1. Merchant Eligibility, Verification & Quality Standards
              </h2>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#312E81] dark:marker:text-indigo-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">Verified Campus Operations:</strong> Any food kitchen, cafeteria, student entrepreneur, tech vendor, or hostel service provider must register with verified contact info, active phone/WhatsApp numbers, and valid outlet location details.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Food Safety & Kitchen Hygiene:</strong> All meals, combos, pastries, and drinks must be prepared under strict hygienic conditions. Perishable food items must be freshly cooked and packed in sanitized, food-grade disposable containers.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Stock Accuracy in POS:</strong> Vendors are required to keep their POS terminal synchronized. Any out-of-stock meal or item must be marked &quot;Out of Stock&quot; immediately to prevent rejected orders and student dissatisfaction.
                </li>
              </ul>
            </section>

            {/* SECTION 2: FAST CAMPUS DELIVERY PROTOCOL (SLA) */}
            <section className="space-y-3 border-t border-slate-100 dark:border-zinc-800 pt-6">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Bike className="text-amber-600 dark:text-amber-400" size={20} />
                2. Fast Campus Delivery Protocol (SLA & Delivery Timelines)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-2">
                    <Clock size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">2-Minute Order Acknowledgment</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Kitchens must accept incoming student orders within 2 minutes of the POS alarm chime.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-2">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">15-20 Min Prep Time</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Hot meals and orders must be boxed, sealed, and marked &quot;Ready for Delivery&quot; swiftly.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-2">
                    <Bike size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">10-15 Min Direct Transit</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Vendors deliver directly to the student&apos;s hostel block/room for quick drop-off.</p>
                </div>
              </div>

              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500">
                <li>
                  <strong className="text-slate-900 dark:text-white">Tamper-Evident Safety Packaging:</strong> Vendors must seal all food boxes and drink packages with adhesive tamper-evident stickers. Deliveries must never arrive opened, unsealed, or compromised.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Hostel Room-to-Room & Porter Gate Handover:</strong> Vendors and their store delivery staff must respect university residential rules, check in at the hall porter lodge when required, and send instant SMS/call alerts when arriving at the student&apos;s hostel block.
                </li>
              </ul>
            </section>

            {/* SECTION 3: AUTOMATED PAYSTACK PAYOUTS & BANK SETTLEMENTS */}
            <section className="space-y-3 border-t border-slate-100 dark:border-zinc-800 pt-6">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <DollarSign className="text-emerald-600 dark:text-emerald-400" size={20} />
                3. Automated Settlements, Payouts & Commission
              </h2>
              <ul className="space-y-2 pl-4 list-disc marker:text-emerald-500">
                <li>
                  <strong className="text-slate-900 dark:text-white">Automated Subaccount Payouts:</strong> Earnings from student orders are processed via Paystack Subaccount split settlements and transferred directly to the merchant&apos;s registered 10-digit Nigerian NUBAN bank account (GTBank, Zenith, Access, Kuda, OPay, Palmpay, etc.).
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Zero Hidden Charges:</strong> Transparent platform processing commissions are automatically calculated per checkout. No hidden listing fees or monthly subscription charges.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Cancellation & Refund Escrow:</strong> If an order is cancelled by the student before food preparation begins, or if the merchant fails to prepare the order within the SLA window, a 100% refund is credited back to the student.
                </li>
              </ul>
            </section>

            {/* SECTION 4: RATINGS & CODE OF CONDUCT */}
            <section className="space-y-3 border-t border-slate-100 dark:border-zinc-800 pt-6">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="text-[#312E81] dark:text-indigo-400" size={20} />
                4. Quality Ratings, Customer Service & Merchant Conduct
              </h2>
              <ul className="space-y-2 pl-4 list-disc marker:text-[#312E81] dark:marker:text-indigo-400">
                <li>
                  <strong className="text-slate-900 dark:text-white">4.0+ Star Quality Rating:</strong> Merchants must maintain an average customer rating of at least 4.0 out of 5.0 stars. Stores consistently receiving quality or hygiene complaints are subject to review or temporary deactivation.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Respectful Customer Communications:</strong> All merchant-student interactions via the integrated Live Chat system must remain professional, helpful, and courteous.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Prohibited Items:</strong> The sale of illicit drugs, counterfeit electronics, alcohol where prohibited by university rules, or expired items is strictly forbidden and results in immediate account termination.
                </li>
              </ul>
            </section>
          </motion.div>
        )}

        {/* TERMS OF SERVICE CONTENT */}
        {activeTab === "terms" && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed font-body"
          >
            <section className="space-y-2">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Scale className="text-[#312E81] dark:text-indigo-400" size={18} />
                1. Campus Marketplace Operations
              </h2>
              <p>
                Lightson Marketplace operates as a multi-vendor platform dedicated to connecting verified campus food vendors, student bakeries, stationery outlets, and campus service providers directly with university students. By creating an account, you agree to provide accurate hostel address details for room-to-room order delivery.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Building className="text-[#312E81] dark:text-indigo-400" size={18} />
                2. Order Fulfillment & Hostel Delivery
              </h2>
              <p>
                Orders placed before vendor closing hours are fulfilled by assigned student couriers and verified store delivery teams. Delivery fees are clearly displayed per order. Students are required to remain reachable via their registered phone number upon arrival.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="text-[#312E81] dark:text-indigo-400" size={18} />
                3. Refunds & Cancellation Policy
              </h2>
              <p>
                Cancellations can be made within 3 minutes of placing an order before the vendor begins kitchen preparation. If a delivered food item is incorrect, spilled, or damaged, full refunds or replacements are issued within 24 hours via Paystack or direct campus wallet credit.
              </p>
            </section>
          </motion.div>
        )}

        {/* PRIVACY POLICY CONTENT */}
        {activeTab === "privacy" && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed font-body"
          >
            <section className="space-y-2">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Lock className="text-[#312E81] dark:text-indigo-400" size={18} />
                1. Data We Collect
              </h2>
              <p>
                To facilitate campus delivery, we collect your name, university email address, hostel block/room number, and phone number. We strictly use 256-bit SSL encryption for payment transaction metadata via Paystack.
              </p>
            </section>

            <section className="space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
              <h2 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="text-[#312E81] dark:text-indigo-400" size={18} />
                2. How We Protect Your Information
              </h2>
              <p>
                Your personal delivery data is only visible to the fulfilling vendor for the duration of the active delivery. We never sell, share, or rent student personal data to third-party advertisers.
              </p>
            </section>
          </motion.div>
        )}

        <div className="text-center text-xs text-[#71717A] dark:text-zinc-400 font-body pt-2">
          Have questions or want to register your campus brand? Visit our{" "}
          <Link href="/support" className="font-heading font-bold text-[#312E81] dark:text-indigo-400 underline">
            Campus Help & Support Page
          </Link>{" "}
          or{" "}
          <Link href="/vendor/register" className="font-heading font-bold text-[#312E81] dark:text-indigo-400 underline">
            Open a Vendor Store
          </Link>.
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] flex items-center justify-center p-6 text-xs text-slate-500">Loading Governance & Terms...</div>}>
      <TermsContent />
    </Suspense>
  );
}
