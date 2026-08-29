"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  Star,
  Receipt,
  Store,
  Clock,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { submitStudentReview } from "@/actions/reviews";
import { getLiveOrderById } from "@/actions/orders";
import { useUserStore } from "@/lib/userStore";
import { getSafeImageUrl } from "@/lib/productOptions";

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
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  status: string;
}

const MOCK_ORDERS: Record<string, OrderDetail> = {
  "ORD-9821-XT": {
    id: "ORD-9821-XT",
    vendorId: "v1",
    vendorName: "PastryHomebyLayo",
    vendorAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    vendorPhone: "+234 903 470 7684",
    total: 8500,
    subtotal: 8000,
    deliveryFee: 400,
    serviceFee: 100,
    paymentMethod: "Paystack (Card)",
    paymentStatus: "PAID",
    hostelAddress: "Campus Residence Address",
    date: "Today, 12:45 PM",
    status: "PREPARING",
    items: [
      {
        id: "p1",
        name: "Small Chops",
        price: 8000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Order Placed & Awaiting Confirmation",
        color: "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        dotColor: "bg-blue-500",
      };
    case "ACCEPTED":
    case "PREPARING":
      return {
        label: "Store Preparing Your Order",
        color: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        dotColor: "bg-amber-500",
      };
    case "READY_FOR_DELIVERY":
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery to Your Hostel",
        color: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        dotColor: "bg-indigo-500",
      };
    case "DELIVERED":
      return {
        label: "Delivered Successfully",
        color: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        dotColor: "bg-emerald-500",
      };
    case "CANCELLED":
      return {
        label: "Order Cancelled",
        color: "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        dotColor: "bg-rose-500",
      };
    default:
      return {
        label: "Order Received",
        color: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
        dotColor: "bg-slate-500",
      };
  }
};

function formatDbOrder(dbOrder: any, fallback: OrderDetail): OrderDetail {
  if (!dbOrder) return fallback;
  return {
    id: dbOrder.id.length > 10 ? dbOrder.id.slice(-6).toUpperCase() : dbOrder.id,
    vendorId: dbOrder.storeId || dbOrder.store?.id || "vendor",
    vendorName: dbOrder.store?.name || "Campus Vendor",
    vendorAvatar: getSafeImageUrl(dbOrder.store?.logo || fallback.vendorAvatar),
    vendorPhone: dbOrder.store?.phone || dbOrder.store?.user?.phone || "+234 812 345 9900",
    total: dbOrder.totalAmount,
    subtotal: Math.max(
      0,
      dbOrder.totalAmount -
        (dbOrder.deliveryFee !== undefined && dbOrder.deliveryFee !== null ? dbOrder.deliveryFee : 500) -
        (dbOrder.serviceFee !== undefined && dbOrder.serviceFee !== null ? dbOrder.serviceFee : 50)
    ),
    deliveryFee: dbOrder.deliveryFee !== undefined && dbOrder.deliveryFee !== null ? dbOrder.deliveryFee : 500,
    serviceFee: dbOrder.serviceFee !== undefined && dbOrder.serviceFee !== null ? dbOrder.serviceFee : 50,
    paymentMethod: dbOrder.paymentReference ? "Paystack (Card/Transfer)" : "Pay on Delivery",
    paymentStatus: dbOrder.status === "CANCELLED" ? "CANCELLED" : "PAID",
    hostelAddress: dbOrder.deliveryLocation || "Campus Hostel Address",
    date: new Date(dbOrder.createdAt || Date.now()).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: dbOrder.items?.map((it: any) => ({
      id: it.id,
      name: it.product?.name || "Food Item",
      price: it.price,
      quantity: it.quantity,
      image: getSafeImageUrl(it.product?.image),
    })) || fallback.items,
    status: dbOrder.status || "PREPARING",
  };
}

interface OrderTrackingClientProps {
  initialOrder?: any;
  id: string;
}

export default function OrderTrackingClient({ initialOrder, id }: OrderTrackingClientProps) {
  const router = useRouter();
  const fallbackOrder = MOCK_ORDERS[id] || MOCK_ORDERS["ORD-9821-XT"];
  const [dbOrder, setDbOrder] = useState<any>(initialOrder || null);
  const [isLoading, setIsLoading] = useState(!initialOrder && !MOCK_ORDERS[id]);

  const fetchLiveOrder = async () => {
    try {
      const res = await getLiveOrderById(id);
      if (res.success && res.order) {
        setDbOrder(res.order);
      }
    } catch (e) {
      console.error("Error fetching order details:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialOrder) {
      fetchLiveOrder();
    }
    const interval = setInterval(() => {
      fetchLiveOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, initialOrder]);

  const order: OrderDetail = formatDbOrder(dbOrder, fallbackOrder);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { profile } = useUserStore();

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    const res = await submitStudentReview({
      userEmail: profile.email,
      userName: profile.name,
      storeId: order.vendorId,
      orderId: id,
      rating,
      comment: reviewComment.trim() ? reviewComment.trim() : undefined,
    });

    if (res.success) {
      setIsReviewSubmitted(true);
    }
    setIsSubmittingReview(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-5 bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-3 h-3 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" />
        </div>
        <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
          Loading Order Receipt...
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Fetching live vendor and delivery details
        </p>
      </div>
    );
  }

  if (!dbOrder && !MOCK_ORDERS[id]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-5 bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100">
            Order Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
            We could not find the details for Order #{id}. It may have been cleared or belongs to a different session.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push("/orders")}
            className="px-5 py-2.5 rounded-xl bg-[#312E81] text-white font-heading font-bold text-xs hover:bg-[#1E1B4B] transition-all cursor-pointer shadow-xs"
          >
            View All Orders
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-zinc-200 font-heading font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay(order.status);
  const whatsappNumber = (order.vendorPhone || "2348012345678").replace(/[^0-9]/g, "");
  const formattedWhatsapp = whatsappNumber.startsWith("0") ? `234${whatsappNumber.slice(1)}` : whatsappNumber;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* TOP COMPACT HEADER */}
      <div className="px-5 pt-6 pb-3 max-w-xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">
          <Receipt size={14} className="text-[#312E81] dark:text-indigo-400" />
          <span>Official Digital Receipt</span>
        </div>

        <Link
          href="/support"
          className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <HelpCircle size={14} />
          <span>Help</span>
        </Link>
      </div>

      {/* SINGLE UNIFIED DIGITAL RECEIPT CARD */}
      <div className="px-4 md:px-0 max-w-xl mx-auto w-full mt-2">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#121215] rounded-[32px] border border-slate-200/90 dark:border-zinc-800 shadow-lg shadow-indigo-950/5 dark:shadow-black/40 overflow-hidden"
        >
          {/* RECEIPT HEADER */}
          <div className="p-6 md:p-8 bg-linear-to-b from-indigo-50/60 via-transparent to-transparent dark:from-indigo-950/20 border-b border-slate-100 dark:border-zinc-800/80 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-extrabold border ${statusInfo.color}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
                <span>{statusInfo.label}</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-body text-[#71717A] dark:text-zinc-400 block font-medium">
                Total Paid • {order.date}
              </span>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-[#18181B] dark:text-zinc-100 tracking-tight mt-0.5">
                ₦{order.total.toLocaleString()}
              </h1>
              <span className="inline-block mt-1 font-mono font-bold text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-600 dark:text-zinc-300">
                Order #{order.id}
              </span>
            </div>
          </div>

          {/* STORE & DELIVERY DESTINATION SECTION */}
          <div className="p-5 md:p-6 bg-slate-50/70 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800/80 space-y-4">
            {/* Store details row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-2xl border border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 bg-white shadow-2xs">
                  <Image
                    src={getSafeImageUrl(order.vendorAvatar)}
                    alt={order.vendorName}
                    fill
                    unoptimized={getSafeImageUrl(order.vendorAvatar).startsWith("data:")}
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 truncate">
                      {order.vendorName}
                    </h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Store
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] dark:text-zinc-400 truncate">
                    Fulfilled directly by campus kitchen
                  </p>
                </div>
              </div>

              {/* 1-Tap Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${order.vendorPhone}`}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 hover:bg-[#312E81] hover:text-white border border-slate-200 dark:border-zinc-700 flex items-center justify-center transition-colors shadow-2xs"
                  title="Call Store"
                >
                  <Phone size={15} />
                </a>

                <a
                  href={`https://wa.me/${formattedWhatsapp}?text=${encodeURIComponent(`Hello ${order.vendorName}! 👋 I placed Order #${order.id} on Lightson for delivery to ${order.hostelAddress || "my campus hostel"}.\n\nItems: ${order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}\nTotal: ₦${order.total.toLocaleString()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 h-9 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 text-xs font-heading font-bold"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Delivery address snippet */}
            <div className="flex items-start gap-2.5 pt-3 border-t border-slate-200/60 dark:border-zinc-800 text-xs">
              <MapPin size={15} className="text-[#312E81] dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#71717A] dark:text-zinc-400 block">
                  Delivering To:
                </span>
                <span className="font-semibold text-[#18181B] dark:text-zinc-200">
                  {order.hostelAddress}
                </span>
              </div>
            </div>
          </div>

          {/* ITEMIZED MEAL BREAKDOWN */}
          <div className="p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#71717A] dark:text-zinc-400">
                Itemized Summary
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {order.items.map((item) => {
                const itemImg = getSafeImageUrl(item.image);
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shrink-0 bg-slate-50 dark:bg-zinc-800">
                        <Image
                          src={itemImg}
                          alt={item.name}
                          fill
                          unoptimized={itemImg.startsWith("data:")}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-xs md:text-sm text-[#18181B] dark:text-zinc-100 truncate">
                          {item.name}
                        </h4>
                        <span className="text-xs font-semibold text-[#71717A] dark:text-zinc-400">
                          Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-heading font-black text-xs md:text-sm text-[#18181B] dark:text-zinc-100 shrink-0">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PERFORATED RECEIPT DIVIDER */}
          <div className="relative flex items-center my-1">
            <div className="w-4 h-8 bg-[#FAFAF7] dark:bg-[#09090B] rounded-r-full -ml-2 border-r border-t border-b border-slate-200/90 dark:border-zinc-800" />
            <div className="flex-1 border-b-2 border-dashed border-slate-200 dark:border-zinc-800 mx-2" />
            <div className="w-4 h-8 bg-[#FAFAF7] dark:bg-[#09090B] rounded-l-full -mr-2 border-l border-t border-b border-slate-200/90 dark:border-zinc-800" />
          </div>

          {/* PRICE TOTAL & PAYMENT SUMMARY */}
          <div className="p-5 md:p-6 space-y-2.5 text-xs font-body text-[#71717A] dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Hostel Delivery Fee</span>
              <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.deliveryFee.toLocaleString()}</span>
            </div>
            {order.serviceFee > 0 && (
              <div className="flex justify-between">
                <span>Platform Service Charge</span>
                <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.serviceFee.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-heading font-extrabold uppercase text-[#71717A] dark:text-zinc-400 block">
                  Grand Total
                </span>
                <span className="text-lg font-heading font-black text-[#312E81] dark:text-indigo-400">
                  ₦{order.total.toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">Payment Mode</span>
                <span className="inline-block font-heading font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* INTEGRATED MEAL & STORE RATING */}
          <div className="p-5 md:p-6 bg-slate-50/50 dark:bg-zinc-900/40 border-t border-slate-100 dark:border-zinc-800/80">
            {isReviewSubmitted ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1">
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-heading font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  Rating Submitted! ⭐
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your <strong>{rating}-Star review</strong> for <strong>{order.vendorName}</strong> was published.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-heading font-bold text-[#18181B] dark:text-zinc-100">
                    Rate Meal from {order.vendorName}:
                  </span>

                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 transition-transform active:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={22}
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

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Short feedback (optional)..."
                    className="flex-1 h-10 px-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs text-[#18181B] dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 h-10 bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit ⭐"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* BOTTOM RETURN / BROWSE BUTTONS */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs font-heading font-bold">
          <Link
            href="/orders"
            className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[#18181B] dark:text-zinc-200 hover:bg-slate-50 transition-all shadow-xs"
          >
            All Orders
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-[#312E81] text-white hover:bg-[#1E1B4B] transition-all shadow-xs"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>

    </div>
  );
}
