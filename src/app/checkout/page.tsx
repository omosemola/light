"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  Banknote,
} from "lucide-react";
import { motion } from "framer-motion";
import { createLiveOrder } from "@/actions/orders";
import { getUserLocationsDb, SavedLocationItem } from "@/actions/account";
import { useNotificationStore } from "@/lib/notificationStore";
import { getSafeImageUrl } from "@/lib/productOptions";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotal, vendorName, vendorId, vendorDeliveryFee, vendorEstimatedDelivery, clearCart } = useCartStore();
  const { addNotification } = useNotificationStore();
  const { profile, updateProfile } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "cash">("paystack");

  const effectiveEmail = session?.user?.email || profile.email || "";

  // 2-field Location Schema & DB Saved Locations
  const [houseName, setHouseName] = useState(() => profile.hostel || "");
  const [streetLocation, setStreetLocation] = useState(() => profile.addressDetail || "");
  const [phone, setPhone] = useState(() => profile.phone || "");
  const [instructions, setInstructions] = useState("");
  const [savedLocationsList, setSavedLocationsList] = useState<SavedLocationItem[]>(() => profile.savedLocations || []);

  useEffect(() => {
    setIsMounted(true);
    if (effectiveEmail) {
      getUserLocationsDb(effectiveEmail).then((res) => {
        if (res.success && res.locations && res.locations.length > 0) {
          setSavedLocationsList(res.locations);
          updateProfile({ savedLocations: res.locations });

          // If houseName is empty, auto-fill from default saved location
          const defaultLoc = res.locations.find((l) => l.isDefault) || res.locations[0];
          if (defaultLoc) {
            setHouseName((prev) => prev || defaultLoc.title);
            setStreetLocation((prev) => prev || defaultLoc.address);
          }
        }
      });
    }
  }, [effectiveEmail]);

  useEffect(() => {
    if (profile.hostel && !houseName) {
      setHouseName(profile.hostel);
    }
    if (profile.addressDetail && !streetLocation) {
      setStreetLocation(profile.addressDetail);
    }
    if (profile.phone && !phone) {
      setPhone(profile.phone);
    }
  }, [profile.hostel, profile.addressDetail, profile.phone]);

  useEffect(() => {
    if (isMounted && items.length === 0 && !isProcessing) {
      router.push("/");
    }
  }, [isMounted, items.length, isProcessing, router]);

  const subtotal = getTotal();
  const fee = vendorDeliveryFee !== undefined ? vendorDeliveryFee : 300;
  const total = subtotal + fee;

  if (!isMounted || items.length === 0) {
    return null;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName.trim() || !streetLocation.trim()) {
      alert("Please provide both your House/Hostel Name and Location or Street.");
      return;
    }
    setIsProcessing(true);

    const fullDeliveryLocation = `${houseName.trim()}, ${streetLocation.trim()}`;

    // Update profile cache
    updateProfile({
      hostel: houseName.trim(),
      addressDetail: streetLocation.trim(),
      phone: phone.trim() || profile.phone,
    });

    // Format item customization notes for store POS
    const customizationSummary = items
      .map((i) => {
        const parts = [];
        if (i.selectedSize) parts.push(`Size: ${i.selectedSize.name}`);
        if (i.selectedAddOns && i.selectedAddOns.length > 0) {
          parts.push(`Add-ons: ${i.selectedAddOns.map((a) => a.name).join(", ")}`);
        }
        if (i.customNotes) parts.push(`Note: "${i.customNotes}"`);
        return parts.length > 0 ? `${i.name} (${parts.join(" | ")})` : "";
      })
      .filter(Boolean)
      .join("; ");

    const combinedInstructions = [
      instructions,
      customizationSummary ? `[Item Options: ${customizationSummary}]` : "",
    ]
      .filter(Boolean)
      .join(" - ");

    const targetStoreId = vendorId || items[0]?.vendorId;

    const res = await createLiveOrder({
      userEmail: profile.email || effectiveEmail,
      userName: profile.name,
      storeId: targetStoreId,
      totalAmount: total,
      deliveryFee: fee,
      deliveryLocation: fullDeliveryLocation,
      deliveryInstructions: combinedInstructions,
      paymentMethod: paymentMethod === "paystack" ? "Paystack (Card/Transfer)" : "Pay on Arrival",
      paymentReference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    clearCart();

    const orderId = res.success && res.order ? res.order.id : `ORD-${Date.now().toString().slice(-4)}`;
    addNotification({
      userEmail: profile.email || effectiveEmail || "visitor@light.app",
      title: "Order Placed Successfully! 🛍️",
      desc: `Your order for ₦${total.toLocaleString()} (${items.length} item${items.length === 1 ? "" : "s"}) has been sent to the store.`,
      type: "order",
      time: "Just now",
      link: res.success && res.order ? `/orders/${res.order.id}` : "/orders",
    });

    if (res.success && res.order) {
      router.push(`/orders/${res.order.id}?success=true`);
    } else {
      router.push("/orders?success=true");
    }
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
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
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
              Confirm your campus delivery address and complete payment securely
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Campus Delivery Location
              </h2>
            </div>
            <Link href="/profile/locations" className="text-xs font-bold text-[#312E81] dark:text-indigo-400 hover:underline">
              Manage Saved Addresses ↗
            </Link>
          </div>

          {/* QUICK-PICK SAVED LOCATIONS PILLS */}
          {savedLocationsList && savedLocationsList.length > 0 && (
            <div>
              <span className="text-[11px] font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1.5">
                Quick Select Saved Location:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
                {savedLocationsList.map((loc) => {
                  const isSelected = houseName === loc.title && streetLocation === loc.address;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setHouseName(loc.title);
                        setStreetLocation(loc.address);
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#312E81] text-white border-[#312E81] shadow-2xs"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-400"
                      }`}
                    >
                      📍 {loc.title} {loc.isDefault ? "• Default" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* 1. House / Hostel Name */}
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1.5">
                House/Hostel Name
              </label>
              <input 
                type="text" 
                required
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs md:text-sm text-[#18181B] dark:text-zinc-100"
              />
            </div>

            {/* 2. Location or Street */}
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1.5">
                Location or Street
              </label>
              <input 
                type="text" 
                required
                value={streetLocation}
                onChange={(e) => setStreetLocation(e.target.value)}
                className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs md:text-sm text-[#18181B] dark:text-zinc-100"
              />
            </div>
            
            {/* Phone Number */}
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1.5">
                Phone Number (For Delivery Contact)
              </label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 px-4 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs md:text-sm text-[#18181B] dark:text-zinc-100"
              />
            </div>

            {/* Optional Instructions */}
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1.5 flex items-center gap-1.5">
                <MessageSquare size={13} /> Delivery Note to Store / Merchant (Optional)
              </label>
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
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
                  Instant confirmation & direct store delivery
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
                  Pay on Arrival (Cash / Transfer to Store)
                </span>
                <span className="text-[10px] font-body text-[#71717A] dark:text-zinc-400 block">
                  Hand cash or transfer directly to store delivery person
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
            {items.map((item) => {
              const itemImg = getSafeImageUrl(item.image);
              return (
                <div key={item.cartItemId || item.id} className="flex items-center justify-between gap-3 text-xs font-body">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800 shrink-0 border border-slate-100 dark:border-zinc-700">
                      <Image
                        src={itemImg}
                        alt={item.name}
                        fill
                        unoptimized={itemImg.startsWith("data:")}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-[#18181B] dark:text-zinc-100 truncate block">
                        {item.name}
                      </span>
                      <div className="text-[#71717A] dark:text-zinc-400 text-[11px] space-y-0.5">
                        <span>Qty: {item.quantity} × ₦{item.price.toLocaleString()}</span>
                        {item.selectedSize && (
                          <span className="block text-indigo-600 dark:text-indigo-400 font-medium">
                            Size: {item.selectedSize.name}
                          </span>
                        )}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <span className="block text-amber-600 dark:text-amber-400 font-medium">
                            Extras: {item.selectedAddOns.map(a => a.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-[#312E81] dark:text-indigo-400 shrink-0">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2 text-xs font-body">
            <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span>Store Delivery Fee</span>
                {vendorEstimatedDelivery && (
                  <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-zinc-300 font-bold">
                    ⏱️ {vendorEstimatedDelivery}
                  </span>
                )}
              </span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">
                {fee === 0 ? <strong className="text-emerald-600 dark:text-emerald-400 font-black">FREE</strong> : `₦${fee.toLocaleString()}`}
              </span>
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
