"use client";

import { use, useState, useEffect, useRef } from "react";
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
  Bike,
  Star,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";
import { submitStudentReview } from "@/actions/reviews";
import { getLiveOrderById } from "@/actions/orders";
import { useUserStore } from "@/lib/userStore";

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
  paymentStatus: "PAID" | "PENDING" | "CANCELLED";
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
  status?: string;
}

const mapStatusToStage = (status: string) => {
  switch (status) {
    case "PENDING":
    case "ACCEPTED":
      return 1;
    case "PREPARING":
      return 2;
    case "READY_FOR_DELIVERY":
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    case "CANCELLED":
      return 0;
    default:
      return 2;
  }
};

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
  { id: 3, title: "Out for Delivery", desc: "Store team en route to your hostel", icon: Bike },
  { id: 4, title: "Arrived at Hostel", desc: "Store delivery at your hostel entrance", icon: ShoppingBag },
];

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const fallbackOrder = MOCK_ORDERS[id] || MOCK_ORDERS["ORD-9821-XT"];
  const [dbOrder, setDbOrder] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState(2); // Default to Kitchen Preparing
  const prevStageRef = useRef<number>(0);
  const [statusAlert, setStatusAlert] = useState<{ title: string; desc: string } | null>(null);

  const playStageChime = (stage: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.28, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      if (stage === 4) {
        // Celebratory Delivery Arrived Chime (C5 -> E5 -> G5 -> C6)
        playTone(523.25, 0, 0.18);
        playTone(659.25, 0.14, 0.18);
        playTone(783.99, 0.28, 0.22);
        playTone(1046.5, 0.44, 0.5);
      } else {
        // Upbeat Order Stage Advancement Chime (E5 -> A5)
        playTone(659.25, 0, 0.16);
        playTone(880.0, 0.14, 0.3);
      }
    } catch {
      // Audio playback fallback
    }
  };

  const fetchLiveOrder = async () => {
    const res = await getLiveOrderById(id);
    if (res.success && res.order) {
      setDbOrder(res.order);
      const stage = mapStatusToStage(res.order.status);
      if (stage !== 0) {
        setCurrentStage(stage);
        if (prevStageRef.current > 0 && stage > prevStageRef.current) {
          playStageChime(stage);
          const stgInfo = STAGES.find((s) => s.id === stage);
          if (stgInfo) {
            setStatusAlert({ title: stgInfo.title, desc: stgInfo.desc });
            setTimeout(() => setStatusAlert(null), 5000);
          }
        }
        prevStageRef.current = stage;
      }
    }
  };

  useEffect(() => {
    fetchLiveOrder();
    const interval = setInterval(() => {
      fetchLiveOrder();
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const order: OrderDetail = dbOrder
    ? {
        id: dbOrder.id.length > 10 ? dbOrder.id.slice(-6).toUpperCase() : dbOrder.id,
        vendorId: dbOrder.storeId,
        vendorName: dbOrder.store?.name || "Campus Vendor",
        vendorAvatar: dbOrder.store?.logo || fallbackOrder.vendorAvatar,
        vendorPhone: dbOrder.store?.user?.phone || "+234 812 345 9900",
        total: dbOrder.totalAmount,
        subtotal: Math.max(0, dbOrder.totalAmount - 500),
        deliveryFee: 400,
        serviceFee: 100,
        paymentMethod: dbOrder.paymentReference ? "Paystack (Card/Transfer)" : "Pay on Delivery",
        paymentStatus: dbOrder.status === "CANCELLED" ? "CANCELLED" : "PAID",
        hostelAddress: dbOrder.deliveryLocation,
        date: new Date(dbOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        etaMins: dbOrder.status === "DELIVERED" ? 0 : 15,
        courier: fallbackOrder.courier,
        items: dbOrder.items?.map((it: any) => ({
          id: it.id,
          name: it.product?.name || "Food Item",
          price: it.price,
          quantity: it.quantity,
          image: it.product?.image || "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
        })) || fallbackOrder.items,
        status: dbOrder.status,
      }
    : fallbackOrder;

  const [etaSeconds, setEtaSeconds] = useState(order.etaMins * 60);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatVendor, setChatVendor] = useState({
    id: order.vendorId,
    name: order.vendorName,
    avatar: order.vendorAvatar,
    phone: order.vendorPhone,
  });
  const { profile } = useUserStore();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    const res = await submitStudentReview({
      userEmail: profile.email,
      userName: profile.name,
      storeId: order.vendorId,
      orderId: id,
      rating,
      comment: reviewComment,
    });

    if (res.success) {
      setIsReviewSubmitted(true);
    }
    setIsSubmittingReview(false);
  };

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
      name: `${order.courier.name} (${order.vendorName} Delivery)`,
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
      
      {/* REAL-TIME ORDER STATUS TRANSITION TOAST BANNER */}
      <AnimatePresence>
        {statusAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white px-5 py-3 rounded-full shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 max-w-sm w-[90%]"
          >
            <div className="w-7 h-7 rounded-full bg-[#FBBF24] text-[#312E81] flex items-center justify-center font-bold shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-heading font-extrabold text-xs text-white block">
                {statusAlert.title} 🔔
              </span>
              <span className="text-[11px] text-slate-300 truncate block">
                {statusAlert.desc}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                <Clock size={12} /> Estimated Arrival
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

        {/* VENDOR DIRECT SELF-DELIVERY & 1-TAP CONTACT CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-2xl border border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 bg-white shadow-xs p-0.5">
                <Image src={order.vendorAvatar} alt={order.vendorName} fill className="object-cover" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 truncate">
                    {order.vendorName}
                  </h4>
                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Store Delivery
                  </span>
                </div>
                <p className="text-xs font-medium text-[#71717A] dark:text-zinc-400 truncate">
                  Direct vendor fulfillment • Fixed ₦500 delivery fee
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${order.vendorPhone}`}
                className="w-10 h-10 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 hover:bg-[#312E81] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title={`Call ${order.vendorName}`}
              >
                <Phone size={17} />
              </a>

              <button
                type="button"
                onClick={handleOpenMerchantChat}
                className="w-10 h-10 rounded-2xl bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md active:scale-95 cursor-pointer"
                title="In-App Merchant Chat"
              >
                <MessageSquare size={17} />
              </button>
            </div>
          </div>

          {/* 1-TAP WHATSAPP & DIRECT CALL ACTION BAR */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2.5">
            <a
              href={`https://wa.me/${((order.vendorPhone || "2348012345678").replace(/[^0-9]/g, "").startsWith("0") ? `234${(order.vendorPhone || "2348012345678").replace(/[^0-9]/g, "").slice(1)}` : (order.vendorPhone || "2348012345678").replace(/[^0-9]/g, ""))}?text=${encodeURIComponent(`Hello ${order.vendorName}! 👋 I just placed Order #${order.id} on Lightson for delivery to ${order.hostelAddress || "my campus hostel room"}.\n\nItems: ${order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}\nTotal: ₦${order.total.toLocaleString()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading font-bold text-xs rounded-2xl shadow-sm hover:shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>1-Tap WhatsApp Store</span>
            </a>

            <a
              href={`tel:${order.vendorPhone}`}
              className="px-4 h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#18181B] dark:text-zinc-200 font-heading font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Phone size={14} className="text-[#312E81] dark:text-indigo-400" />
              <span>Call Store</span>
            </a>
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

        {/* STUDENT MEAL REVIEW & RATING CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              Rate Your Meal & Delivery
            </h3>
          </div>

          {isReviewSubmitted ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1">
              <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="font-heading font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                Thank you for your feedback! ⭐
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Your <strong>{rating}-Star rating</strong> for <strong>{order.vendorName}</strong> has been saved and published.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-3 bg-[#FAFAF7] dark:bg-zinc-800/80 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80">
                <span className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 mb-2">
                  How was your order from {order.vendorName}?
                </span>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform active:scale-125 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          (hoverRating || rating) >= star
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share a short review about the food taste, packaging, or delivery speed (optional)..."
                  className="w-full p-3 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs text-[#18181B] dark:text-zinc-100 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full h-12 bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmittingReview ? "Submitting Review..." : "Submit Store Rating ⭐"}</span>
              </button>
            </form>
          )}
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
