"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  ShoppingBag, 
  Phone, 
  MessageSquare, 
  Store, 
  AlertCircle, 
  Star,
  Receipt
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
      };
    case "ACCEPTED":
    case "PREPARING":
      return {
        label: "Store Preparing Your Order",
        color: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      };
    case "READY_FOR_DELIVERY":
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery to Your Hostel",
        color: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      };
    case "DELIVERED":
      return {
        label: "Delivered Successfully",
        color: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      };
    case "CANCELLED":
      return {
        label: "Order Cancelled",
        color: "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    default:
      return {
        label: "Order Received",
        color: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
      };
  }
};

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const fallbackOrder = MOCK_ORDERS[id] || MOCK_ORDERS["ORD-9821-XT"];
  const [dbOrder, setDbOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchLiveOrder();
    const interval = setInterval(() => {
      fetchLiveOrder();
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const order: OrderDetail = dbOrder
    ? {
        id: dbOrder.id.length > 10 ? dbOrder.id.slice(-6).toUpperCase() : dbOrder.id,
        vendorId: dbOrder.storeId,
        vendorName: dbOrder.store?.name || "Campus Vendor",
        vendorAvatar: getSafeImageUrl(dbOrder.store?.logo || fallbackOrder.vendorAvatar),
        vendorPhone: dbOrder.store?.user?.phone || "+234 812 345 9900",
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
        hostelAddress: dbOrder.deliveryLocation,
        date: new Date(dbOrder.createdAt).toLocaleDateString("en-US", {
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
        })) || fallbackOrder.items,
        status: dbOrder.status || "PREPARING",
      }
    : fallbackOrder;

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

  const handleOpenMerchantChat = () => {
    setChatVendor({
      id: order.vendorId,
      name: order.vendorName,
      avatar: order.vendorAvatar,
      phone: order.vendorPhone,
    });
    setIsChatOpen(true);
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* TOP STICKY NAV HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#71717A] dark:text-zinc-400 block">
              Order Receipt & Details
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

        {/* ORDER SUMMARY HERO BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400 block">
                Placed on {order.date}
              </span>
              <h2 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100 mt-0.5">
                Total: ₦{order.total.toLocaleString()}
              </h2>
            </div>

            <div className={`px-3.5 py-1.5 rounded-full border text-xs font-heading font-bold flex items-center gap-1.5 ${statusInfo.color}`}>
              <span className="w-2 h-2 rounded-full bg-current inline-block" />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </motion.div>

        {/* VENDOR STORE & CONTACT CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-2xl border border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 bg-white shadow-xs p-0.5">
                {(() => {
                  const safeAvatar = getSafeImageUrl(order.vendorAvatar);
                  return (
                    <Image
                      src={safeAvatar}
                      alt={order.vendorName}
                      fill
                      unoptimized={safeAvatar.startsWith("data:")}
                      className="object-cover"
                    />
                  );
                })()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 truncate">
                    {order.vendorName}
                  </h4>
                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Campus Store
                  </span>
                </div>
                <p className="text-xs font-medium text-[#71717A] dark:text-zinc-400 truncate">
                  Direct Store Fulfillment • {order.paymentMethod}
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
                className="px-3.5 h-10 rounded-2xl bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer text-xs font-heading font-bold"
                title="In-App Merchant Chat"
              >
                <MessageSquare size={15} />
                <span>Chat Store</span>
              </button>
            </div>
          </div>

          {/* 1-TAP WHATSAPP & DIRECT CALL ACTION BAR */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2.5">
            <a
              href={`https://wa.me/${((order.vendorPhone || "2348012345678").replace(/[^0-9]/g, "").startsWith("0") ? `234${(order.vendorPhone || "2348012345678").replace(/[^0-9]/g, "").slice(1)}` : (order.vendorPhone || "2348012345678").replace(/[^0-9]/g, ""))}?text=${encodeURIComponent(`Hello ${order.vendorName}! 👋 I placed Order #${order.id} on Lightson for delivery to ${order.hostelAddress || "my campus hostel room"}.\n\nItems: ${order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}\nTotal: ₦${order.total.toLocaleString()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading font-bold text-xs rounded-2xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>1-Tap WhatsApp Store</span>
            </a>

            <a
              href={`tel:${order.vendorPhone}`}
              className="px-4 h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#18181B] dark:text-zinc-200 font-heading font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Phone size={14} className="text-[#312E81] dark:text-indigo-400" />
              <span>Call Store</span>
            </a>
          </div>
        </div>

        {/* DELIVERY LOCATION CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100">
              Delivery Destination
            </h4>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              {order.hostelAddress}
            </p>
          </div>
        </div>

        {/* ORDERED ITEMS & RECEIPT SUMMARY */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Order Items & Receipt
              </h3>
            </div>

            <button
              onClick={handleOpenMerchantChat}
              className="px-3 py-1.5 bg-[#F4F3FF] dark:bg-indigo-950/80 hover:bg-[#312E81] hover:text-white text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-full border border-indigo-100 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={13} /> Chat Vendor
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {order.items.map((item) => {
              const itemImg = getSafeImageUrl(item.image);
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shrink-0 bg-slate-50 dark:bg-zinc-800">
                      <Image
                        src={itemImg}
                        alt={item.name}
                        fill
                        unoptimized={itemImg.startsWith("data:")}
                        className="object-cover"
                      />
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
              );
            })}
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
            {order.serviceFee > 0 && (
              <div className="flex justify-between">
                <span>Platform Service Charge</span>
                <span className="font-semibold text-[#18181B] dark:text-zinc-200">₦{order.serviceFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-sm font-heading font-extrabold text-[#18181B] dark:text-zinc-100">
              <span>Total Amount</span>
              <span className="text-[#312E81] dark:text-indigo-400">₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* STUDENT MEAL REVIEW & RATING CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              Rate Your Meal & Store Experience
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
                      className="p-1 transition-transform active:scale-125 focus:outline-none cursor-pointer"
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
                  placeholder="Share a short review about the food taste, packaging, or store service (optional)..."
                  className="w-full p-3 bg-[#FAFAF7] dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 font-medium text-xs text-[#18181B] dark:text-zinc-100 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full h-12 bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-extrabold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

    </div>
  );
}
