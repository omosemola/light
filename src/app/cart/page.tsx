"use client";

import { useCartStore } from "@/lib/store";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CartPage() {
  const { items, vendorName, updateQuantity, removeItem, getTotal } = useCartStore();
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
          href="/"
          className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center gap-2 group"
        >
          <span>Start Shopping</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();
  const fee = 200; // Campus delivery service fee
  const total = subtotal + fee;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-36 md:pb-32 transition-colors duration-200">
      
      {/* STICKY TOP HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-[#18181B] dark:text-zinc-100 tracking-tight">
              My Shopping Cart
            </h1>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5 font-medium flex items-center gap-1.5">
              <Store size={13} className="text-[#312E81] dark:text-indigo-400 shrink-0" />
              <span>Ordering from <strong className="text-[#312E81] dark:text-indigo-300 font-extrabold">{vendorName}</strong></span>
            </p>
          </div>

          <span className="text-xs font-heading font-extrabold bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            {items.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>
      </div>

      {/* MAIN CART ITEMS LIST */}
      <div className="px-5 py-6 max-w-4xl mx-auto w-full space-y-3.5">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex gap-3.5 p-3.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 items-center"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800 shrink-0 border border-slate-100 dark:border-zinc-700/60">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            
            <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-heading font-bold text-[#18181B] dark:text-zinc-100 text-xs md:text-sm line-clamp-2 leading-snug">
                  {item.name}
                </h3>

                {/* REMOVE BUTTON */}
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors shrink-0 active:scale-90"
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
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-900 text-[#312E81] dark:text-zinc-200 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 active:scale-90 transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>

                  <span className="font-heading font-extrabold text-xs w-5 text-center text-[#18181B] dark:text-zinc-100">
                    {item.quantity}
                  </span>

                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-[#312E81] dark:bg-indigo-600 text-white rounded-lg shadow-2xs hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 active:scale-90 transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* ORDER COST SUMMARY DIV */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 space-y-2.5 mt-4 text-xs font-body">
          <div className="flex justify-between text-[#71717A] dark:text-zinc-400 font-normal">
            <span>Items Subtotal</span>
            <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#71717A] dark:text-zinc-400 font-normal">
            <span>Hostel Delivery Fee</span>
            <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{fee.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* STICKY CHECKOUT BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 p-4 md:p-5 z-40 shadow-2xl rounded-t-3xl md:rounded-none">
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
