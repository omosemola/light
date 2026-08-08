"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  ShoppingBag, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Store, 
  ChevronRight, 
  AlertCircle, 
  Sparkles,
  Bike
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";

interface OrderDetail {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAvatar: string;
  vendorPhone: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  paymentMethod: string;
  paymentStatus: "PAID" | "PENDING";
  hostelAddress: string;
  date: string;
  etaMins: number;
  courier: {
    name: string;
    phone: string;
    avatar: string;
    rating: number;
    deliveriesCount: number;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
}

const MOCK_ORDERS: Record<string, OrderDetail> = {
  "ORD-9821-XT": {
    id: "ORD-9821-XT",
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    vendorPhone: "+234 812 345 9900",
    total: 4000,
    subtotal: 3500,
    deliveryFee: 400,
    serviceFee: 100,
    paymentMethod: "Paystack (Card)",
    paymentStatus: "PAID",
    hostelAddress: "Main Campus • Mellanby Hall, Block B Room 14",
    date: "Today, 12:45 PM",
    etaMins: 14,
    courier: {
      name: "Tunde Bakare",
      phone: "+234 813 999 8877",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      rating: 4.9,
      deliveriesCount: 340,
    },
    items: [
      {
        id: "p1",
        name: "Jollof Rice with Chicken & Plantain",
        price: 3500,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  "ORD-7714-AB": {
    id: "ORD-7714-AB",
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorAvatar: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
    vendorPhone: "+234 809 777 8899",
    total: 7000,
    subtotal: 6500,
    deliveryFee: 400,
    serviceFee: 100,
    paymentMethod: "Pay on Delivery",
    paymentStatus: "PENDING",
    hostelAddress: "Main Campus • Tedder Hall, Room 22",
    date: "Yesterday, 7:15 PM",
    etaMins: 0,
    courier: {
      name: "Emeka Okafor",
      phone: "+234 802 111 4455",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      rating: 4.8,
      deliveriesCount: 510,
    },
    items: [
      {
        id: "p4",
        name: "Spicy Beef Suya Pizza - Medium",
        price: 6500,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
};

const STAGES = [
  { id: 1, title: "Order Confirmed", desc: "Vendor accepted your order", icon: Clock },
  { id: 2, title: "Kitchen Preparing", desc: "Chef is packaging your food fresh", icon: Package },
  { id: 3, title: "Out for Delivery", desc: "Student rider en route to hostel", icon: Bike },
  { id: 4, title: "Arrived at Hostel", desc: "Rider at your hostel entrance", icon: ShoppingBag },
];

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const order = MOCK_ORDERS[id] || MOCK_ORDERS["ORD-9821-XT"];
  const [currentStage, setCurrentStage] = useState(2); // Default to Kitchen Preparing
  const [etaSeconds, setEtaSeconds] = useState(order.etaMins * 60);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatVendor, setChatVendor] = useState({
    id: order.vendorId,
    name: order.vendorName,
    avatar: order.vendorAvatar,
    phone: order.vendorPhone,
  });

  // Countdown timer simulation
  useEffect(() => {
    if (etaSeconds <= 0 || currentStage === 4) return;
    const timer = setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [etaSeconds, currentStage]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOpenCourierChat = () => {
    setChatVendor({
      id: "courier-1",
      name: `${order.courier.name} (Rider)`,
      avatar: order.courier.avatar,
      phone: order.courier.phone,
    });
    setIsChatOpen(true);
  };

  const handleOpenMerchantChat = () => {
    setChatVendor({
      id: order.vendorId,
      name: order.vendorName,
      avatar: order.vendorAvatar,
      phone: order.vendorPhone,
    });
    setIsChatOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* TOP STICKY NAV HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#71717A] dark:text-zinc-400 block">
              Live Order Tracker
            </span>
            <h1 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              #{order.id}
            </h1>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            order.paymentStatus === "PAID"
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
          }`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="px-5 md:px-8 max-w-3xl mx-auto w-full mt-6 space-y-6">

        {/* HERO LIVE ETA & ANIMATED MAP CARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E1B4B] dark:bg-zinc-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-950 dark:border-zinc-800 relative overflow-hidden space-y-5"
        >
          {/* Subtle Ambient Background Accents */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#312E81] dark:bg-indigo-900/40 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#FBBF24] rounded-full blur-3xl opacity-15 pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-[#FBBF24] text-[#312E81] font-heading font-extrabold text-[10px] uppercase px-3 py-0.5 rounded-full mb-1.5">
                <Sparkles size={12} /> Estimated Arrival
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
                {currentStage === 4 ? "Arrived 🎉" : `${formatTimer(etaSeconds)} mins`}
              </h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-white backdrop-blur-sm shadow-md">
              <Bike size={24} className="text-[#FBBF24] animate-bounce" />
            </div>
          </div>

          {/* SIMULATED MAP ROUTE GRAPHIC */}
          <div className="relative bg-indigo-950/60 dark:bg-zinc-950/80 rounded-2xl p-4 border border-indigo-800/40 dark:border-zinc-800 overflow-hidden space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-white">
                <Store size={14} className="text-[#FBBF24]" /> {order.vendorName}
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <MapPin size={14} className="text-emerald-400" /> {order.hostelAddress.split("•")[1] || order.hostelAddress}
              </span>
            </div>

            {/* ROUTE LINE WITH ANIMATED COURIER DOT */}
            <div className="relative w-full h-2.5 bg-indigo-900/60 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "15%" }}
                animate={{ width: `${(currentStage / 4) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-400 rounded-full relative"
              />
            </div>
          </div>

          {/* DEMO STAGE SIMULATION SELECTOR FOR TESTING */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-semibold">Simulate Progress:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((stageNum) => (
                <button
                  key={stageNum}
                  onClick={() => {
                    setCurrentStage(stageNum);
                    if (stageNum === 4) setEtaSeconds(0);
                    else setEtaSeconds((5 - stageNum) * 300);
                  }}
                  className={`w-7 h-7 rounded-full text-xs font-heading font-extrabold transition-all ${
                    currentStage === stageNum
                      ? "bg-[#FBBF24] text-[#312E81] shadow-md scale-110"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {stageNum}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* LIVE TIMELINE STAGES */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
          <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
            Order Fulfillment Status
          </h3>

          <div className="relative pl-6 space-y-7">
            {/* Vertical Connecting Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-zinc-800" />

            {STAGES.map((stg) => {
              const isDone = stg.id <= currentStage;
              const isCurrent = stg.id === currentStage;
              const Icon = stg.icon;

              return (
                <div key={stg.id} className="relative flex items-start gap-4">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border-2 transition-all ${
                    isCurrent 
                      ? "border-[#312E81] dark:border-indigo-400 scale-110 shadow-sm" 
                      : isDone 
                      ? "border-emerald-500 bg-emerald-500" 
                      : "border-slate-300 dark:border-zinc-700"
                  }`}>
                    {isDone ? (
                      <CheckCircle2 size={14} className="text-white fill-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
                    )}
                  </div>

                  <div className="flex items-center justify-between flex-1 gap-2">
                    <div>
                      <h4 className={`font-heading font-extrabold text-sm ${
                        isCurrent ? "text-[#312E81] dark:text-indigo-400 text-base" : isDone ? "text-[#18181B] dark:text-zinc-100" : "text-[#71717A] dark:text-zinc-500"
                      }`}>
                        {stg.title}
                      </h4>
                      <p className="text-xs font-normal text-[#71717A] dark:text-zinc-400">
                        {stg.desc}
                      </p>
                    </div>

                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                      isCurrent 
                        ? "bg-[#312E81] text-white shadow-md" 
                        : isDone 
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" 
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600"
                    }`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COURIER RIDER CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl border border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 bg-white shadow-xs">
              <Image src={order.courier.avatar} alt={order.courier.name} fill className="object-cover" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100">
                  {order.courier.name}
                </h4>
                <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Student Rider
                </span>
              </div>
              <p className="text-xs font-medium text-[#71717A] dark:text-zinc-400">
                ⭐ {order.courier.rating} • {order.courier.deliveriesCount} Hostel Deliveries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${order.courier.phone}`}
              className="w-10 h-10 rounded-2xl bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 hover:bg-[#312E81] hover:text-white flex items-center justify-center transition-colors shadow-2xs"
              title="Call Courier Rider"
            >
              <Phone size={18} />
            </a>

            <button
              onClick={handleOpenCourierChat}
              className="w-10 h-10 rounded-2xl bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md active:scale-95"
              title="Chat Courier Rider"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* ORDERED ITEMS & RECEIPT SUMMARY */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                {order.vendorName} Order Items
              </h3>
            </div>

            <button
              onClick={handleOpenMerchantChat}
              className="px-3 py-1.5 bg-[#F4F3FF] dark:bg-indigo-950/80 hover:bg-[#312E81] hover:text-white text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-full border border-indigo-100 dark:border-indigo-800 transition-all flex items-center gap-1.5"
            >
              <MessageSquare size={13} /> Chat Vendor
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs md:text-sm text-[#18181B] dark:text-zinc-100">
                      {item.name}
                    </h4>
                    <span className="text-xs font-semibold text-[#71717A] dark:text-zinc-400">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
                <span className="font-heading font-extrabold text-xs md:text-sm text-[#312E81] dark:text-indigo-400">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs font-body text-[#71717A] dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Hostel Delivery Fee</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-sm font-heading font-extrabold text-[#18181B] dark:text-zinc-100">
              <span>Total Amount</span>
              <span className="text-[#312E81] dark:text-indigo-400">₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* SUPPORT / HELP BANNER */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-[#312E81] dark:text-indigo-400 shrink-0" />
            <span className="font-medium text-[#18181B] dark:text-zinc-200">
              Having issues with this order? Contact our campus support team.
            </span>
          </div>
          <Link
            href="/support"
            className="px-3 py-1.5 bg-[#312E81] text-white font-heading font-bold text-xs rounded-full shadow-xs whitespace-nowrap shrink-0"
          >
            Get Help
          </Link>
        </div>

      </div>

      {/* CHAT MODAL DRAWER */}
      <MerchantChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        vendor={chatVendor}
        initialProductContext={order.items[0]?.name}
      />

    </div>
  );
}
