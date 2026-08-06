"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  Store, 
  CheckCircle2, 
  Loader2,
  Banknote
} from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, vendorName, clearCart } = useCartStore();
  const { profile } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "cash">("paystack");

  const [formData, setFormData] = useState({
    location: profile.hostel || "Main Campus (Mellanby Hall)",
    phone: profile.phone || "+234 812 345 6789",
    instructions: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && items.length === 0 && !isProcessing) {
      router.push("/");
    }
  }, [isMounted, items.length, isProcessing, router]);

  const subtotal = getTotal();
  const fee = 200; // Campus delivery service fee
  const total = subtotal + fee;

  if (!isMounted || items.length === 0) {
    return null;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Paystack initialization and payment processing
    setTimeout(() => {
      clearCart();
      router.push("/orders?success=true");
    }, 2200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-36 md:pb-32 transition-colors duration-200">
      
      {/* PREMIUM HEADER BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#1E1B4B] dark:bg-zinc-900 text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md border-b border-indigo-950 dark:border-zinc-800"
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

            <span className="text-xs font-heading font-extrabold bg-[#FBBF24] text-[#312E81] px-3.5 py-1 rounded-full shadow-xs">
              Step 2 of 2 • Order & Pay
            </span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
              Checkout & Delivery
            </h1>
            <p className="text-xs text-slate-300 dark:text-zinc-400 font-normal mt-0.5">
              Confirm your hostel room and complete payment securely
            </p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CHECKOUT FORM & CARDS */}
      <form onSubmit={handlePayment} className="px-5 py-6 max-w-4xl mx-auto w-full space-y-5 -mt-6 relative z-20">
        
        {/* 1. DELIVERY LOCATION & CONTACT CARD */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <MapPin size={18} className="text-[#312E81] dark:text-indigo-400" />
            <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              Campus Delivery Location
            </h2>
          </div>
          
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1 flex items-center gap-1.5">
                <MapPin size={13} /> Hostel / Block / Room Number
              </label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Mellanby Hall, Block C, Room 204"
                className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs md:text-sm text-[#18181B] dark:text-zinc-100"
              />
            </div>
            
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1 flex items-center gap-1.5">
                <Phone size={13} /> Phone Number (For Rider Call)
              </label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+234 800 000 0000"
                className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs md:text-sm text-[#18181B] dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1 flex items-center gap-1.5">
                <MessageSquare size={13} /> Delivery Note to Rider (Optional)
              </label>
              <textarea 
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="E.g. Please call when you arrive at the main hostel porter's lodge."
                rows={2}
                className="w-full p-3 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs text-[#18181B] dark:text-zinc-100 resize-none"
              />
            </div>
          </div>
        </motion.section>

        {/* 2. PAYMENT METHOD SELECTION CARD */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Payment Method
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={13} /> 256-Bit Encrypted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Paystack Card/Transfer Option */}
            <div 
              onClick={() => setPaymentMethod("paystack")}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                paymentMethod === "paystack" 
                  ? "border-[#312E81] dark:border-indigo-500 bg-[#F4F3FF] dark:bg-indigo-950/60 shadow-xs" 
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#312E81] text-white flex items-center justify-center shrink-0">
                <CreditCard size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-heading font-extrabold text-xs text-[#18181B] dark:text-zinc-100 block">
                  Paystack (Card / Transfer / USSD)
                </span>
                <span className="text-[10px] font-body text-[#71717A] dark:text-zinc-400 block">
                  Instant confirmation & live rider tracking
                </span>
              </div>
              {paymentMethod === "paystack" && <CheckCircle2 size={16} className="text-[#312E81] dark:text-indigo-400 shrink-0" />}
            </div>

            {/* Pay on Delivery Option */}
            <div 
              onClick={() => setPaymentMethod("cash")}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                paymentMethod === "cash" 
                  ? "border-[#312E81] dark:border-indigo-500 bg-[#F4F3FF] dark:bg-indigo-950/60 shadow-xs" 
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Banknote size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-heading font-extrabold text-xs text-[#18181B] dark:text-zinc-100 block">
                  Pay on Arrival (Cash / Transfer to Rider)
                </span>
                <span className="text-[10px] font-body text-[#71717A] dark:text-zinc-400 block">
                  Hand cash or transfer directly to courier
                </span>
              </div>
              {paymentMethod === "cash" && <CheckCircle2 size={16} className="text-[#312E81] dark:text-indigo-400 shrink-0" />}
            </div>
          </div>
        </motion.section>

        {/* 3. ORDER ITEMS SUMMARY CARD */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Order Summary ({items.length} Items)
              </h2>
            </div>
            <span className="text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-300">
              {vendorName}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs font-body">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800 shrink-0 border border-slate-100 dark:border-zinc-700">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#18181B] dark:text-zinc-100 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[#71717A] dark:text-zinc-400 text-[11px]">
                      Quantity: {item.quantity} × ₦{item.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <span className="font-extrabold text-[#312E81] dark:text-indigo-400 shrink-0">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2 text-xs font-body">
            <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
              <span>Hostel Delivery Fee</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{fee.toLocaleString()}</span>
            </div>
          </div>
        </motion.section>

        {/* STICKY CHECKOUT BOTTOM BAR (SITS ABOVE MOBILE BOTTOM NAV MENU) */}
        <div className="fixed bottom-[64px] md:bottom-0 left-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 p-4 md:p-5 z-40 shadow-2xl rounded-t-3xl md:rounded-none">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-body font-bold text-[#71717A] dark:text-zinc-400 uppercase tracking-widest block">Total Amount</span>
              <span className="font-heading font-extrabold text-2xl md:text-3xl text-[#312E81] dark:text-indigo-400 leading-none">
                ₦{total.toLocaleString()}
              </span>
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shrink-0 min-w-[200px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={19} className="animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{paymentMethod === "paystack" ? "Pay with Paystack" : "Confirm Order"}</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
