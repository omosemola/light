"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Store, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Camera, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  MapPin,
  Landmark
} from "lucide-react";
import { registerVendorStore } from "@/actions/vendor";

const CAMPUS_CATEGORIES = [
  "Hot Meals & Fast Food",
  "Campus Bakery & Pastries",
  "Smoothies, Boba & Drinks",
  "Shawarma & Grills (Suya)",
  "Stationery & Exam Essentials",
  "Groceries & Dorm Provisions",
  "Tech & Gadgets"
];

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank (Guaranty Trust)",
  "First Bank of Nigeria",
  "UBA (United Bank for Africa)",
  "Zenith Bank",
  "Kuda Bank",
  "OPay",
  "Palmpay",
  "Fidelity Bank",
  "Stanbic IBTC",
  "Sterling Bank",
  "Wema Bank / ALAT"
];

export default function VendorRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Owner & Business Info
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Hot Meals & Fast Food");

  // Step 2: Store Operations & Location
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedPrepTime, setEstimatedPrepTime] = useState("20-35 mins");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Payout Banking Details
  const [bankName, setBankName] = useState("GTBank (Guaranty Trust)");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (currentStep === 1) {
      if (!storeName || !ownerName || !email || !phone) {
        setErrorMessage("Please fill in all required contact and business fields.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!location) {
        setErrorMessage("Please specify your kitchen or campus store location.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!accountNumber || accountNumber.length < 10) {
      setErrorMessage("Please enter a valid 10-digit NUBAN bank account number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerVendorStore({
        storeName,
        ownerName,
        email,
        phone,
        category,
        location,
        description: description || `Official ${storeName} store on campus. Fresh meals and quick hostel delivery.`,
        logoUrl: logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
        coverImage: coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || "Failed to register vendor store. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 font-body selection:bg-[#312E81] selection:text-white transition-colors duration-200 pb-20">
      
      {/* TOP BRAND NAV */}
      <header className="bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png?v=2" alt="Lightson Marketplace" className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" />
            <span className="text-xl md:text-2xl font-[900] text-[#312E81] dark:text-indigo-300 font-heading tracking-tight">
              Lights<span className="text-[#F5A623] dark:text-[#FBBF24]">on</span> Marketplace
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-[#71717A] dark:text-zinc-400 font-medium">
              Looking for student food ordering?
            </span>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 hover:bg-indigo-100 text-xs font-heading font-extrabold transition-all border border-indigo-100 dark:border-zinc-700"
            >
              Student Sign-Up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-[#1E1B4B] text-white py-12 md:py-16 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#312E81] rounded-full blur-3xl opacity-60 pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F5A623] rounded-full blur-3xl opacity-15 pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-300 font-heading font-extrabold text-xs">
            <Sparkles size={14} className="text-[#F5A623]" />
            <span>Official Campus Merchant Partner Program</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-[900] tracking-tight leading-tight">
            Grow Your Campus Food Brand with <br className="hidden sm:inline" />
            <span className="text-[#F5A623]">Lights</span>on Merchant Portal
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Receive incoming student orders with instant sound alarms, manage your live menu inventory, and enjoy automated daily payouts directly into your bank account.
          </p>

          {/* METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-amber-300">10,000+</span>
              <span className="text-[11px] text-slate-300 font-semibold">Campus Students</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-emerald-300">₦0 Setup</span>
              <span className="text-[11px] text-slate-300 font-semibold">Free Registration</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-indigo-300">Live POS</span>
              <span className="text-[11px] text-slate-300 font-semibold">Kitchen Order Terminal</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-amber-300">Daily Bank</span>
              <span className="text-[11px] text-slate-300 font-semibold">Direct Settlements</span>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM CONTAINER */}
      <main className="max-w-2xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200/80 dark:border-zinc-800">
          
          {isSuccess ? (
            /* SUCCESS STATE */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-5"
            >
              <div className="w-18 h-18 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
                <CheckCircle2 size={40} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full mb-2">
                  Store Registered Successfully 🎉
                </span>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-[#18181B] dark:text-white">
                  Welcome, {storeName}!
                </h2>
                <p className="text-xs md:text-sm text-[#71717A] dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Your campus vendor merchant account is ready. You can now access your live Order Processing Terminal, add menu items, and start receiving student orders.
                </p>
              </div>

              <div className="p-4 bg-[#FAFAF7] dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700/80 max-w-md mx-auto text-left text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-zinc-400">Store Name:</span>
                  <span className="font-bold text-[#18181B] dark:text-white">{storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-zinc-400">Owner Contact:</span>
                  <span className="font-bold text-[#18181B] dark:text-white">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-zinc-400">Payout Account:</span>
                  <span className="font-bold text-[#18181B] dark:text-white">{bankName} • {accountNumber}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/vendor/dashboard"
                  className="px-8 py-3.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Store size={18} />
                  <span>Open Vendor Dashboard</span>
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3.5 bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-white font-heading font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-all text-center"
                >
                  Go to Marketplace
                </Link>
              </div>
            </motion.div>
          ) : (
            /* WIZARD FORM */
            <div>
              {/* STEP PROGRESS BAR */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-400 uppercase tracking-wider">
                    Step {currentStep} of 3
                  </span>
                  <span className="text-xs font-semibold text-[#71717A] dark:text-zinc-400">
                    {currentStep === 1 && "Business & Contact"}
                    {currentStep === 2 && "Kitchen & Location"}
                    {currentStep === 3 && "Bank Settlements"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 1 ? "bg-[#312E81]" : "bg-slate-200 dark:bg-zinc-800"}`} />
                  <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 2 ? "bg-[#312E81]" : "bg-slate-200 dark:bg-zinc-800"}`} />
                  <div className={`h-2 rounded-full transition-all duration-300 ${currentStep >= 3 ? "bg-[#312E81]" : "bg-slate-200 dark:bg-zinc-800"}`} />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 mb-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <span>⚠️ {errorMessage}</span>
                </div>
              )}

              {/* STEP 1: BUSINESS & CONTACT */}
              {currentStep === 1 && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleNextStep}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Store / Kitchen Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mama Cass Kitchen, Pizza Hub, Fresh Bites"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                        Owner / Manager Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Samuel Adeleke"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                        Store Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-semibold text-[#18181B] dark:text-zinc-100"
                      >
                        {CAMPUS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                        Official Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. orders@mamacass.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                        Phone / WhatsApp for Order Alerts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +234 812 345 6789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>Continue to Kitchen Setup</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: KITCHEN & LOCATION */}
              {currentStep === 2 && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleNextStep}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Campus Kitchen / Outlet Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sub Commercial Hub, Mellanby Cafeteria, Tedder Block A"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Average Preparation & Packaging Time
                    </label>
                    <select
                      value={estimatedPrepTime}
                      onChange={(e) => setEstimatedPrepTime(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-semibold text-[#18181B] dark:text-zinc-100"
                    >
                      <option value="15-25 mins">15-25 mins (Fast Snacks / Drinks)</option>
                      <option value="25-40 mins">25-40 mins (Cooked Hot Meals / Rice)</option>
                      <option value="35-50 mins">35-50 mins (Specialty Grills / Pizza)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Store Description & Highlights
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Specializing in hot smokey Jollof rice, chicken, and chilled mocktails..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Store Brand Logo
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#312E81] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <Camera size={16} />
                        <span>Upload Logo from Phone</span>
                      </button>
                      {logoUrl && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 relative">
                          <Image src={logoUrl} alt="Preview" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 h-13 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-white font-heading font-bold text-xs hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>Continue to Bank Details</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: BANK SETTLEMENTS */}
              {currentStep === 3 && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSubmitRegistration}
                  className="space-y-4"
                >
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                    <Landmark size={18} className="text-[#312E81] dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Automated Daily Paystack Settlements</strong>
                      Student payments for your orders are routed and settled directly into this Nigerian bank account.
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-semibold text-[#18181B] dark:text-zinc-100"
                    >
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      10-Digit NUBAN Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="0123456789"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-mono font-bold tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Account Beneficiary Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mama Cass Catering Services"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={isSubmitting}
                      className="px-5 h-13 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-white font-heading font-bold text-xs hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles size={18} />
                      <span>{isSubmitting ? "Launching Your Store..." : "Complete Store Registration 🎉"}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          )}

        </div>
      </main>

      {/* FOOTER NOTICE */}
      <footer className="text-center text-xs text-[#71717A] dark:text-zinc-500 mt-12 max-w-md mx-auto px-4 space-y-2">
        <p>
          By creating a vendor account, you agree to Lights<span className="text-[#F5A623]">on</span> Marketplace Merchant Terms & Fast Campus Delivery standard protocol.
        </p>
      </footer>

    </div>
  );
}
