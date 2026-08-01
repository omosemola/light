"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock, MapPin, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

function OrdersContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  // Mock Active Order
  const activeOrder = isSuccess ? {
    id: "ORD-9821-XT",
    vendorName: "Mama Cass",
    total: 3700,
    status: "PREPARING",
    items: "1x Jollof Rice with Chicken...",
    date: "Today, 12:45 PM"
  } : null;

  const STATUS_STEPS = [
    { id: "PENDING", label: "Order Received", icon: Clock },
    { id: "ACCEPTED", label: "Accepted by Vendor", icon: CheckCircle2 },
    { id: "PREPARING", label: "Preparing", icon: Package },
    { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
    { id: "DELIVERED", label: "Delivered", icon: ShoppingBag },
  ];

  const currentStepIndex = 2; // PREPARING

  return (
    <div className="px-5 md:px-8 mt-6 max-w-2xl mx-auto w-full space-y-6">
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
          <div>
            <h3 className="font-bold">Payment Successful</h3>
            <p className="text-sm mt-1 text-emerald-700">Your order has been placed and sent to the vendor.</p>
          </div>
        </div>
      )}

      {activeOrder ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-slate-500 font-medium">Order #{activeOrder.id}</p>
                <h2 className="font-heading font-bold text-lg text-slate-900">{activeOrder.vendorName}</h2>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">₦{activeOrder.total.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{activeOrder.date}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 line-clamp-1">{activeOrder.items}</p>
          </div>

          <div className="p-6">
            <h3 className="font-heading font-bold text-slate-900 mb-6">Track Order</h3>
            
            <div className="relative pl-6 space-y-8">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
              
              {STATUS_STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="relative flex items-center gap-4">
                    {/* Timeline Dot */}
                    <div className={clsx(
                      "absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2",
                      isActive ? "border-amber-500" : isCompleted ? "border-slate-900" : "border-slate-300"
                    )}>
                      <div className={clsx(
                        "w-2.5 h-2.5 rounded-full",
                        isActive ? "bg-amber-500" : isCompleted ? "bg-slate-900" : "bg-transparent"
                      )} />
                    </div>
                    
                    <div className={clsx(
                      "flex items-center gap-3",
                      isActive || isCompleted ? "text-slate-900" : "text-slate-400"
                    )}>
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isActive ? "bg-amber-100 text-amber-700" : isCompleted ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-400"
                      )}>
                        <StepIcon size={20} />
                      </div>
                      <span className={clsx("font-bold", isActive && "text-lg")}>{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <button className="flex-1 h-12 rounded-full border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList size={48} className="text-slate-300 mb-4" />
          <h2 className="font-heading font-bold text-lg text-slate-700 mb-2">No Active Orders</h2>
          <Link href="/" className="text-indigo-600 font-bold hover:underline">Start shopping</Link>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32 md:pt-8">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-200 sticky top-0 md:static md:bg-transparent md:border-none md:px-8 z-40 shadow-sm md:shadow-none">
        <h1 className="text-2xl font-heading font-bold text-slate-900">
          My Orders
        </h1>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="text-slate-400 font-medium">Loading orders...</div>
        </div>
      }>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
