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
  ArrowRight,
  Clock,
  Phone,
  Mail,
  MapPin,
  Landmark,
  Eye,
  EyeOff,
  Lock,
  X,
  FileText,
  Scale
} from "lucide-react";
import { registerVendorStore } from "@/actions/vendor";
import { useUserStore } from "@/lib/userStore";

const CAMPUS_CATEGORIES = [
  "Campus Hot Kitchen & Meals",
  "Cafeteria & Snacks Combos",
  "Provisions & Hostel Groceries",
  "Tech, Gadgets & Accessories",
  "Fashion, Wears & Campus Merch",
  "Stationery, Books & Print Services",
  "Beauty, Skincare & Personal Care",
  "Medical, Health & Pharmacy",
  "Laundry, Dry Cleaning & Hostel Errands",
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
  const { updateProfile } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showMerchantTermsModal, setShowMerchantTermsModal] = useState(false);

  // Step 1: Owner & Business Info
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState("Hot Meals, Food & Dining");

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
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("⚠️ Image file is too large (maximum 10MB). Please select a smaller photo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxWidth = 500;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setLogoUrl(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        img.onerror = () => setLogoUrl(reader.result as string);
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (currentStep === 1) {
      if (!storeName || !ownerName || !email || !phone || !password) {
        setErrorMessage("Please fill in all required contact, business, and password fields.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!location) {
        setErrorMessage("Please specify your store, kitchen, or campus outlet location.");
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
        password,
        category,
        location,
        description: description || `Official ${storeName} store on campus. Quick student orders and fast hostel delivery.`,
        logoUrl: logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
        coverImage: coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      });

      if (res.success) {
        updateProfile({
          email: email.trim(),
          name: storeName.trim(),
          phone: phone.trim(),
          isVisitor: false,
        });
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
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#18181B] dark:text-zinc-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs border border-slate-200/60 dark:border-zinc-700"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png?v=2" alt="Lightson Marketplace" className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" />
              <span className="text-xl md:text-2xl font-[900] text-[#312E81] dark:text-indigo-300 font-heading tracking-tight">
                Lights<span className="text-[#F5A623] dark:text-[#FBBF24]">on</span> Marketplace
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-[#312E81] dark:hover:text-white transition-colors"
            >
              <span>Marketplace Home</span>
            </Link>
            <Link
              href="/vendor/login"
              className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 text-xs font-heading font-extrabold transition-all border border-amber-200/80 dark:border-amber-800/80 shadow-2xs"
            >
              Merchant Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-heading font-extrabold transition-all shadow-xs"
            >
              Student Sign-Up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH PROJECT BANNER */}
      <section className="relative bg-[#1E1B4B] dark:bg-zinc-950 text-white py-12 md:py-16 px-4 md:px-8 overflow-hidden shadow-lg border-b border-indigo-950 dark:border-zinc-800">
        <Image
          src="/support-banner.jpg"
          alt="Vendor Registration Banner"
          fill
          priority
          className="object-cover object-center pointer-events-none opacity-45"
        />
        <div className="absolute inset-0 bg-[#1E1B4B]/90 dark:bg-[#09090B]/95" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-300 font-heading font-extrabold text-xs">
            <ShieldCheck size={14} className="text-[#F5A623]" />
            <span>Campus Merchant Partner Program</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-[900] tracking-tight leading-tight">
            Grow Your Campus Store & Brand on <br className="hidden sm:inline" />
            <span className="text-[#F5A623]">Lights</span>on Marketplace
          </h1>

          <p className="text-sm md:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Sell food, groceries, stationery, tech gadgets, fashion, and campus services. Receive instant student orders, manage live stock, and enjoy automated daily bank payouts.
          </p>

          {/* METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-amber-300">10,000+</span>
              <span className="text-[11px] text-slate-300 font-semibold">Campus Students</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-emerald-300">All Categories</span>
              <span className="text-[11px] text-slate-300 font-semibold">Food, Tech, Books & More</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-heading font-black text-indigo-300">Live POS</span>
              <span className="text-[11px] text-slate-300 font-semibold">Instant Order Terminal</span>
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
              <div className="w-18 h-18 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border-2 border-amber-200 dark:border-amber-800 shadow-md">
                <Clock size={40} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full mb-2">
                  Application Submitted • Pending Admin Review ⏳
                </span>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-[#18181B] dark:text-white">
                  Application Received, {storeName}!
                </h2>
                <p className="text-xs md:text-sm text-[#71717A] dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Your campus vendor registration has been safely received. Platform administrators will review your store details and activate your account. You will receive an email confirmation once verified.
                </p>
              </div>

              {/* VERIFICATION STEPS */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>Step 1: Store & Banking Profile Submitted</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <Clock size={15} className="shrink-0 animate-spin" />
                  <span>Step 2: Campus Administrator Review & Approval</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>Step 3: Storefront Goes Live on Marketplace</span>
                </div>
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
                  <span>View Application Status</span>
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3.5 bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-white font-heading font-extrabold text-sm rounded-xl hover:bg-slate-200 transition-all text-center"
                >
                  Back to Marketplace
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
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Merchant Account Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-4 pr-12 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#71717A] dark:text-zinc-500 mt-1 block">
                      You will use this password and your email ({email || "store email"}) to log into the Merchant Terminal.
                    </span>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>Continue to Store Setup</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: STORE OPERATIONS & LOCATION */}
              {currentStep === 2 && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleNextStep}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Campus Store / Kitchen / Outlet Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
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
                      <option value="10-20 mins">10-20 mins (Groceries, Books, Tech & Snacks)</option>
                      <option value="20-35 mins">20-35 mins (Hot Meals & Custom Orders)</option>
                      <option value="35-60 mins">35-60 mins (Specialty Items & Campus Services)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                      Store Description & Highlights
                    </label>
                    <textarea
                      rows={2}
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
                      <CheckCircle2 size={18} />
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
      <footer className="text-center text-xs text-[#71717A] dark:text-zinc-500 mt-12 max-w-lg mx-auto px-4 space-y-2">
        <p>
          By creating a vendor account, you agree to the{" "}
          <button
            type="button"
            onClick={() => setShowMerchantTermsModal(true)}
            className="font-heading font-extrabold text-[#312E81] dark:text-indigo-400 underline hover:text-[#1E1B4B] dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Merchant Terms & Fast Campus Delivery standard protocol
          </button>.
        </p>
      </footer>

      {/* INTERACTIVE MERCHANT TERMS & FAST DELIVERY PROTOCOL MODAL */}
      <AnimatePresence>
        {showMerchantTermsModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl my-8 max-h-[85vh] flex flex-col font-body"
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-heading font-black text-slate-900 dark:text-white leading-tight">
                      Merchant Terms & Delivery Protocol
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Official Campus Merchant Standard Agreement</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMerchantTermsModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL SCROLLABLE CONTENT */}
              <div className="overflow-y-auto py-4 space-y-6 text-xs md:text-sm text-[#71717A] dark:text-zinc-300 pr-2">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    All merchants operating on Lightson Marketplace commit to fast campus hostel deliveries, hygienic food preparation, and transparent daily bank settlements.
                  </p>
                </div>

                {/* 1. KITCHEN HYGIENE & QUALITY */}
                <div className="space-y-1.5">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    1. Kitchen Hygiene & Inventory Quality
                  </h4>
                  <p className="text-xs leading-relaxed">
                    All food items must be freshly cooked and packed in sanitized, food-grade disposable containers. Out-of-stock items must be paused immediately on your POS terminal to avoid student order cancellations.
                  </p>
                </div>

                {/* 2. FAST CAMPUS DELIVERY SLA */}
                <div className="space-y-1.5">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Bike size={16} className="text-amber-600 dark:text-amber-400" />
                    2. Fast Campus Delivery Protocol (SLA)
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-5 marker:text-amber-500">
                    <li><strong>2-Minute Response:</strong> Acknowledge and accept incoming student orders within 2 minutes of the POS alarm.</li>
                    <li><strong>15-20 Min Prep Time:</strong> Package and mark meals &quot;Ready for Delivery&quot; swiftly.</li>
                    <li><strong>Tamper-Proof Seals:</strong> Food containers must have tamper-evident stickers to guarantee student safety.</li>
                    <li><strong>Hostel Room Drop:</strong> Delivery runners check in at hostel porter lodges and alert students upon arrival via Call/SMS.</li>
                  </ul>
                </div>

                {/* 3. SETTLEMENTS */}
                <div className="space-y-1.5">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                    3. Automated Daily Bank Settlements
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Earnings are credited automatically to your registered Nigerian NUBAN bank account via Paystack Subaccount splits. No hidden fees or monthly software subscription charges.
                  </p>
                </div>

                {/* 4. RATINGS */}
                <div className="space-y-1.5">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    4. Rating Standards (4.0+ Stars)
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Merchants must maintain at least a 4.0-star customer satisfaction score with prompt order processing and polite customer service.
                  </p>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                <Link
                  href="/terms?tab=merchant"
                  target="_blank"
                  className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 underline hover:text-[#1E1B4B]"
                >
                  View Full Legal Governance Page ➔
                </Link>

                <button
                  type="button"
                  onClick={() => setShowMerchantTermsModal(false)}
                  className="px-5 py-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  I Understand & Agree
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
