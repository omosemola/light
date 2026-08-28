"use client";

import { useCartStore } from "@/lib/store";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Store, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getSafeImageUrl } from "@/lib/productOptions";

export default function CartPage() {
  const { items, vendorName, vendorDeliveryFee, vendorEstimatedDelivery, updateQuantity, removeItem, getTotal } = useCartStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-5 bg-[#FAFAF7] dark:bg-[#09090B] text-[#18181B] dark:text-zinc-100 font-body transition-colors">
        <div className="w-24 h-24 bg-[#F4F3FF] dark:bg-indigo-950/60 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
          <ShoppingBag size={42} className="text-[#312E81] dark:text-indigo-400" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-[#18181B] dark:text-zinc-100 mb-2 tracking-tight">
          Your Cart is Empty
        </h2>
        <p className="text-sm text-[#71717A] dark:text-zinc-400 text-center max-w-xs mb-8 leading-relaxed">
          Looks like you haven&apos;t added any delicious meals or campus essentials to your cart yet.
        </p>
        <Link 
          href="/search"
          className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center gap-2 group"
        >
          <span>Start Shopping</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();
  const deliveryFee = useCartStore((s) => s.getDeliveryFee());
  const effectiveDeliveryTime = useCartStore((s) => s.getEstimatedDelivery());
  const platformFee = 50;
  const total = subtotal + deliveryFee + platformFee;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-36 md:pb-32 transition-colors duration-200">
      
      {/* STICKY TOP HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-[#18181B] dark:text-zinc-100 tracking-tight">
                My Shopping Cart
              </h1>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5 font-medium flex items-center gap-1.5">
                <Store size={13} className="text-[#312E81] dark:text-indigo-400 shrink-0" />
                <span>Ordering from <strong className="text-[#312E81] dark:text-indigo-300 font-extrabold">{vendorName}</strong></span>
              </p>
            </div>
          </div>

          <span className="text-xs font-heading font-extrabold bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            {items.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>
      </div>

      {/* MAIN CART ITEMS LIST */}
      <div className="px-5 py-6 max-w-4xl mx-auto w-full space-y-3.5">
        {items.map((item) => {
          const itemKey = item.cartItemId || item.id;
          return (
            <motion.div
              key={itemKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-3.5 p-3.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 items-center"
            >
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800 shrink-0 border border-slate-100 dark:border-zinc-700/60">
                {(() => {
                  const safeImg = getSafeImageUrl(item.image);
                  return (
                    <Image
                      src={safeImg}
                      alt={item.name}
                      fill
                      unoptimized={safeImg.startsWith("data:")}
                      className="object-cover"
                    />
                  );
                })()}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-[#18181B] dark:text-zinc-100 text-xs md:text-sm line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    
                    {/* CUSTOMIZATION PILLS */}
                    {(item.selectedSize || (item.selectedAddOns && item.selectedAddOns.length > 0) || item.customNotes) && (
                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 space-y-0.5 mt-1">
                        {item.selectedSize && (
                          <span className="inline-block mr-2 font-semibold text-indigo-600 dark:text-indigo-400">
                            Portion: {item.selectedSize.name}
                          </span>
                        )}
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                          <span className="inline-block mr-2 font-semibold text-amber-600 dark:text-amber-400">
                            Extras: {item.selectedAddOns.map(a => a.name).join(", ")}
                          </span>
                        )}
                        {item.customNotes && (
                          <p className="italic text-slate-400 dark:text-zinc-500 line-clamp-1">
                            Note: &ldquo;{item.customNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* REMOVE BUTTON */}
                  <button 
                    onClick={() => removeItem(itemKey)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors shrink-0 active:scale-90 cursor-pointer"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="font-body font-extrabold text-sm text-[#312E81] dark:text-indigo-400">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                  
                  {/* VISIBLE & STYLED QUANTITY CONTROLS */}
                  <div className="flex items-center gap-2 bg-[#F4F3FF] dark:bg-zinc-800 rounded-xl p-1 border border-indigo-100/80 dark:border-zinc-700/80">
                    <button 
                      onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-lg shadow-2xs text-[#312E81] dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-zinc-600 transition-colors active:scale-90 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    
                    <span className="w-5 text-center text-xs font-heading font-extrabold text-[#18181B] dark:text-zinc-100">
                      {item.quantity}
                    </span>
                    
                    <button 
                      onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-lg shadow-2xs text-[#312E81] dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-zinc-600 transition-colors active:scale-90 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ORDER COST SUMMARY DIV */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 space-y-2.5 mt-4 text-xs font-body">
          <div className="flex justify-between text-[#71717A] dark:text-zinc-400 font-normal">
            <span>Items Subtotal</span>
            <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#71717A] dark:text-zinc-400 font-normal">
            <span className="flex items-center gap-1.5">
              <span>Store Delivery Fee</span>
              {effectiveDeliveryTime && (
                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-zinc-300 font-bold">
                  ⏱️ {effectiveDeliveryTime}
                </span>
              )}
            </span>
            <span className="font-semibold text-[#18181B] dark:text-zinc-200">
              {deliveryFee === 0 ? <strong className="text-emerald-600 dark:text-emerald-400 font-black">FREE</strong> : `₦${deliveryFee.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between text-[#71717A] dark:text-zinc-400 font-normal">
            <span className="flex items-center gap-1.5">
              <span>Platform Service Charge</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-bold">Fixed</span>
            </span>
            <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{platformFee.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* STICKY CHECKOUT BOTTOM BAR (SITS ABOVE MOBILE BOTTOM NAV MENU) */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 p-4 md:p-5 z-40 shadow-2xl rounded-t-3xl md:rounded-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-body font-bold text-[#71717A] dark:text-zinc-400 uppercase tracking-widest block">Total Payable</span>
            <span className="font-heading font-extrabold text-2xl md:text-3xl text-[#312E81] dark:text-indigo-400 leading-none">
              ₦{total.toLocaleString()}
            </span>
          </div>

          <button 
            onClick={() => router.push("/checkout")}
            className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shrink-0"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
