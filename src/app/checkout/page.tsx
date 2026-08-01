"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, vendorName, clearCart } = useCartStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    location: "Hall 3, Block B",
    phone: "08012345678",
    instructions: "",
  });

  const subtotal = getTotal();
  const fee = 200;
  const total = subtotal + fee;

  // If we arrived here with an empty cart, return home
  if (items.length === 0 && !isProcessing) {
    router.push("/");
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate Paystack initialization and payment
    setTimeout(() => {
      clearCart();
      router.push("/orders?success=true");
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background-main)] pb-[140px] md:pb-32">
      <div className="flex items-center px-5 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 md:top-20 z-40">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center -ml-2 mr-2 text-[var(--color-primary)] active:scale-95 transition-transform"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-heading font-bold text-[var(--color-primary)]">
          Checkout
        </h1>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Delivery Details */}
        <section className="bg-white p-5 rounded-3xl shadow-[var(--shadow-bento)]">
          <h2 className="font-heading font-bold text-lg text-[var(--color-primary)] mb-4">Delivery Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campus Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
              <textarea 
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="E.g. Call me when you reach the gate"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow min-h-[100px] resize-none"
              />
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="bg-white p-5 rounded-3xl shadow-[var(--shadow-bento)]">
          <h2 className="font-heading font-bold text-lg text-[var(--color-primary)] mb-4">Order Summary</h2>
          <p className="text-sm font-medium text-gray-500 mb-3">{vendorName}</p>
          
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <span className="text-[var(--color-text-primary)] font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold whitespace-nowrap ml-4">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-sm text-[var(--color-text-muted)] font-medium">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-text-muted)] font-medium">
              <span>Service Fee</span>
              <span>₦{fee.toLocaleString()}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Sticky Checkout Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-5 pb-safe z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] rounded-t-3xl md:rounded-none">
        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 font-medium">Total to Pay</span>
          <span className="font-heading font-extrabold text-2xl text-[var(--color-primary)] leading-none">
            ₦{total.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-14 bg-[#09A59A] text-white font-bold rounded-full active:scale-[0.98] transition-transform text-lg flex items-center justify-center disabled:opacity-70"
        >
          {isProcessing ? "Processing..." : "Pay with Paystack"}
        </button>
      </div>
    </div>
  );
}
