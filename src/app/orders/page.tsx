"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  ClipboardList, 
  Clock, 
  MapPin, 
  Package, 
  ShoppingBag, 
  ChevronRight, 
  Bike, 
  RotateCcw,
  Sparkles,
  Store,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface OrderSummaryItem {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAvatar: string;
  total: number;
  status: "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  itemsSummary: string;
  date: string;
  etaMins?: number;
}

const ORDERS_LIST: OrderSummaryItem[] = [
  {
    id: "ORD-9821-XT",
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    total: 4000,
    status: "PREPARING",
    itemsSummary: "1x Jollof Rice with Chicken & Plantain",
    date: "Today, 12:45 PM",
    etaMins: 14,
  },
  {
    id: "ORD-7714-AB",
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorAvatar: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
    total: 7000,
    status: "DELIVERED",
    itemsSummary: "1x Spicy Beef Suya Pizza - Medium",
    date: "Yesterday, 7:15 PM",
  },
  {
    id: "ORD-4521-MK",
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorAvatar: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=300&q=80",
    total: 2200,
    status: "DELIVERED",
    itemsSummary: "1x Cold Pressed Orange Juice + 1x Plantain Chips",
    date: "Aug 5, 2026",
  },
];

function OrdersContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const filteredOrders = ORDERS_LIST.filter((ord) => {
    if (activeFilter === "ACTIVE") return ord.status !== "DELIVERED";
    if (activeFilter === "COMPLETED") return ord.status === "DELIVERED";
    return true;
  });

  return (
    <div className="px-5 md:px-8 max-w-3xl mx-auto w-full space-y-6">
      
      {/* SUCCESS TOAST IF REDIRECTED FROM CHECKOUT */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs"
        >
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={20} />
          <div>
            <h3 className="font-heading font-extrabold text-sm">Payment Successful! 🎉</h3>
            <p className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-300">
              Your order has been sent to the vendor kitchen. Click below to track live delivery progress!
            </p>
          </div>
        </motion.div>
      )}

      {/* FILTER TABS */}
      <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm text-xs font-heading font-extrabold">
        {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeFilter === tab
                ? "bg-[#312E81] text-white shadow-sm"
                : "text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
            }`}
          >
            {tab === "ALL" ? "All Orders" : tab === "ACTIVE" ? "Live Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-3.5 group"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0 bg-white">
                    <Image src={order.vendorAvatar} alt={order.vendorName} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100">
                      {order.vendorName}
                    </h3>
                    <p className="text-[11px] font-body text-[#71717A] dark:text-zinc-400">
                      Order #{order.id} • {order.date}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-heading font-extrabold px-2.5 py-1 rounded-full border ${
                  order.status === "DELIVERED"
                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                    : "bg-[#FBBF24] text-[#312E81] border-amber-300 font-extrabold animate-pulse"
                }`}>
                  {order.status === "DELIVERED" ? "Delivered" : "Live Kitchen Preparing"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-body">
                <p className="text-[#71717A] dark:text-zinc-300 font-medium line-clamp-1 flex-1 pr-4">
                  {order.itemsSummary}
                </p>
                <span className="font-heading font-extrabold text-sm text-[#312E81] dark:text-indigo-400 shrink-0">
                  ₦{order.total.toLocaleString()}
                </span>
              </div>

              {/* ACTION LINK */}
              <div className="pt-2 flex items-center justify-between text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-400">
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <span>Track Live Delivery & Details</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {order.status === "DELIVERED" && (
                  <Link
                    href={`/vendor/${order.vendorId}`}
                    className="inline-flex items-center gap-1 text-[#71717A] dark:text-zinc-400 hover:text-[#312E81] transition-colors"
                  >
                    <RotateCcw size={12} /> Re-order
                  </Link>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3">
            <ClipboardList size={40} className="text-[#71717A] dark:text-zinc-600 mx-auto mb-1" />
            <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              No Orders Found
            </h3>
            <p className="text-xs font-body text-[#71717A] dark:text-zinc-400 max-w-xs mx-auto">
              You haven&apos;t placed any orders in this category yet.
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-[#312E81] dark:bg-indigo-600 text-white rounded-full font-heading font-bold text-xs shadow-md active:scale-95 transition-all mt-2"
            >
              Explore Campus Marketplace
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] pb-32 font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-200">
      
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-heading font-extrabold text-[#18181B] dark:text-zinc-100 tracking-tight">
            My Orders
          </h1>

          <span className="text-xs font-body font-semibold text-[#71717A] dark:text-zinc-400">
            Real-time Campus Tracker
          </span>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="text-[#71717A] dark:text-zinc-500 font-medium text-xs">Loading campus orders...</div>
        </div>
      }>
        <OrdersContent />
      </Suspense>

    </div>
  );
}
