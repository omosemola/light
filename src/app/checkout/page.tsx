"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { ChevronLeft } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, vendorName, clearCart } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    location: "Hall 3, Block B",
    phone: "08012345678",
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
  const fee = 200;
  const total = subtotal + fee;

  if (!isMounted || items.length === 0) {
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
    <div className="flex flex-col min-h-screen bg-slate-50 pb-[140px] md:pb-32">
      <div className="flex items-center px-5 pt-6 pb-4 bg-white border-b border-slate-200 sticky top-0 md:top-20 z-40">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center -ml-2 mr-2 text-slate-900 active:scale-95 transition-transform"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-heading font-bold text-slate-900">
          Checkout
        </h1>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Delivery Details */}
        <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Delivery Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campus Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Instructions (Optional)</label>
              <textarea 
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="E.g. Call me when you reach the gate"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow min-h-[100px] resize-none text-sm font-medium"
              />
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Order Summary</h2>
          <p className="text-sm font-medium text-slate-500 mb-3">{vendorName}</p>
          
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <span className="text-slate-800 font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold whitespace-nowrap ml-4">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Service Fee</span>
              <span>₦{fee.toLocaleString()}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Sticky Checkout Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-5 pb-safe z-40 shadow-lg rounded-t-3xl md:rounded-none">
        <div className="flex justify-between items-end mb-4">
          <span className="text-slate-500 font-medium">Total to Pay</span>
          <span className="font-heading font-extrabold text-2xl text-slate-900 leading-none">
            ₦{total.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full active:scale-[0.98] transition-transform text-lg flex items-center justify-center disabled:opacity-70 shadow-md"
        >
          {isProcessing ? "Processing..." : "Pay with Paystack"}
        </button>
      </div>
    </div>
  );
}
