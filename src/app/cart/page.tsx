"use client";

import { useCartStore } from "@/lib/store";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, vendorName, updateQuantity, removeItem, getTotal } = useCartStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 size={40} className="text-gray-300" />
        </div>
        <h2 className="font-heading font-bold text-xl text-[var(--color-primary)] mb-2">
          Your cart is empty
        </h2>
        <p className="text-[var(--color-text-muted)] text-center mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link 
          href="/"
          className="h-12 px-8 bg-[var(--color-primary)] text-white font-bold rounded-full flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();
  const fee = 200; // Mock delivery/service fee
  const total = subtotal + fee;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background-main)] pb-[140px] md:pb-32">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 md:top-20 z-40">
        <h1 className="text-2xl font-heading font-bold text-[var(--color-primary)]">
          My Cart
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 font-medium">
          Ordering from <span className="text-[var(--color-primary)] font-bold">{vendorName}</span>
        </p>
      </div>

      <div className="px-5 py-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white rounded-3xl shadow-[var(--shadow-bento)]">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            
            <div className="flex flex-col flex-1 py-1">
              <div className="flex justify-between items-start gap-2 mb-auto">
                <h3 className="font-heading font-semibold text-[var(--color-text-primary)] text-sm line-clamp-2">
                  {item.name}
                </h3>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="font-body font-bold text-[var(--color-text-primary)]">
                  ₦{item.price.toLocaleString()}
                </span>
                
                <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-[var(--color-primary)] active:scale-95 transition-transform"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full shadow-sm active:scale-95 transition-transform"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 space-y-3 mt-4">
        <div className="flex justify-between text-sm text-[var(--color-text-muted)] font-medium">
          <span>Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--color-text-muted)] font-medium">
          <span>Service Fee</span>
          <span>₦{fee.toLocaleString()}</span>
        </div>
      </div>

      {/* Sticky Checkout Bottom Bar */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 w-full bg-white border-t border-gray-100 p-5 pb-safe z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] rounded-t-3xl md:rounded-none">
        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 font-medium">Total</span>
          <span className="font-heading font-extrabold text-2xl text-[var(--color-primary)] leading-none">
            ₦{total.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={() => router.push("/checkout")}
          className="w-full h-14 bg-[var(--color-primary)] text-white font-bold rounded-full active:scale-[0.98] transition-transform text-lg flex items-center justify-center"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
