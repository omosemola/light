"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Plus, 
  Store, 
  Power, 
  Package, 
  ChefHat, 
  Bike, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Upload,
  Camera,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  BellRing,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";
import { 
  getVendorDashboardData, 
  updateOrderStatus, 
  toggleStoreOpenStatus, 
  toggleProductAvailability,
  createVendorProduct
} from "@/actions/vendor";
import { OrderStatus } from "@prisma/client";

export default function VendorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"orders" | "products" | "chats">("orders");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [vendorChatStudent, setVendorChatStudent] = useState<any>(null);
  const [isVendorChatOpen, setIsVendorChatOpen] = useState(false);

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const handleProductFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isAlarmMuted, setIsAlarmMuted] = useState(false);
  const prevPendingCountRef = useRef<number>(0);

  const playVendorOrderAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const playTone = (freq: number, startSec: number, durationSec: number, gainVal = 0.35) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime + startSec);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startSec);
        osc.stop(ctx.currentTime + startSec + durationSec);
      };

      // Rich 4-Stage Kitchen POS Alarm Chime (Chowdeck / Toast POS Style)
      playTone(784, 0, 0.2, 0.4);      // G5
      playTone(1046.5, 0.18, 0.25, 0.4); // C6
      playTone(1318.5, 0.38, 0.35, 0.45); // E6
      playTone(1567.98, 0.6, 0.5, 0.5);  // G6
    } catch {
      // Audio restriction fallback
    }
  };

  const fetchDashboard = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    const res = await getVendorDashboardData();
    if (res.success && res.store) {
      setStoreData(res.store);
      setMetrics(res.metrics);

      // Check if new pending orders arrived
      const currentPending = res.metrics?.pendingOrdersCount || 0;
      if (isPoll && currentPending > 0 && currentPending > prevPendingCountRef.current && !isAlarmMuted) {
        playVendorOrderAlarm();
      }
      prevPendingCountRef.current = currentPending;
    }
    if (!isPoll) setLoading(false);
  };

  // Poll every 8 seconds for live incoming student orders
  useEffect(() => {
    fetchDashboard(false);
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAlarmMuted]);

  const handleToggleStore = async () => {
    if (!storeData) return;
    const newStatus = !storeData.isOpen;
    setStoreData((prev: any) => ({ ...prev, isOpen: newStatus }));
    await toggleStoreOpenStatus(storeData.id, newStatus);
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    const res = await updateOrderStatus(orderId, status);
    if (res.success) {
      setStoreData((prev: any) => ({
        ...prev,
        orders: prev.orders.map((o: any) =>
          o.id === orderId ? { ...o, status } : o
        ),
      }));
    }
    setUpdatingId(null);
  };

  const handleToggleProduct = async (productId: string, current: boolean) => {
    setStoreData((prev: any) => ({
      ...prev,
      products: prev.products.map((p: any) =>
        p.id === productId ? { ...p, isAvailable: !current } : p
      ),
    }));
    await toggleProductAvailability(productId, !current);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !storeData) return;
    setSubmittingProduct(true);

    const res = await createVendorProduct({
      storeId: storeData.id,
      name: newProductName,
      price: parseFloat(newProductPrice),
      description: newProductDesc,
      image: newProductImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
      categoryId: newProductCategory || undefined,
    });

    if (res.success && res.product) {
      setStoreData((prev: any) => ({
        ...prev,
        products: [res.product, ...prev.products],
      }));
      setShowAddModal(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDesc("");
      setNewProductImage("");
    }
    setSubmittingProduct(false);
  };

  const filteredOrders = storeData?.orders?.filter((o: any) => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Loading Vendor Portal...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connecting to Supabase Live Database</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl overflow-hidden">
              {storeData?.logo ? (
                <img src={storeData.logo} alt={storeData.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{storeData?.name || "Vendor Merchant Portal"}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ★ {storeData?.rating || "5.0"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Campus Merchant Dashboard • {storeData?.estimatedDelivery || "30 mins"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextMute = !isAlarmMuted;
                setIsAlarmMuted(nextMute);
                if (!nextMute) playVendorOrderAlarm();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                isAlarmMuted
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                  : "bg-amber-500 text-white hover:bg-amber-600 animate-pulse"
              }`}
              title="Toggle Order Alarm Sound"
            >
              {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
              <span>{isAlarmMuted ? "Alarm Muted" : "Order Alarm Active"}</span>
            </button>

            <Link
              href={`/vendor/${storeData?.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Storefront
            </Link>

            <button
              onClick={handleToggleStore}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${
                storeData?.isOpen
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-rose-500 hover:bg-rose-600 text-white"
              }`}
            >
              <Power className="w-4 h-4" />
              {storeData?.isOpen ? "Store OPEN" : "Store CLOSED"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* LIVE INCOMING ORDERS SOUND ALARM BANNER */}
        {metrics?.pendingOrdersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 md:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-amber-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 animate-bounce">
                <BellRing className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-heading font-black tracking-tight flex items-center gap-2">
                  🚨 {metrics.pendingOrdersCount} NEW INCOMING {metrics.pendingOrdersCount === 1 ? "ORDER" : "ORDERS"} WAITING!
                </h2>
                <p className="text-xs text-amber-100 font-medium">
                  Fresh student orders awaiting kitchen or store confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playVendorOrderAlarm}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-heading font-extrabold rounded-xl backdrop-blur-md border border-white/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Test Alarm Chime</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("orders");
                  setOrderFilter("PENDING");
                }}
                className="px-4 py-2 bg-white text-amber-700 hover:bg-amber-50 font-heading font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                View Orders ➔
              </button>
            </div>
          </motion.div>
        )}

        {/* CLICKABLE METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div onClick={() => setSelectedTab("orders")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">₦{metrics?.totalRevenue?.toLocaleString() || "0"}</h3>
          </motion.div>

          <motion.div onClick={() => setSelectedTab("orders")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-500 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Orders</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{metrics?.pendingOrdersCount || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setSelectedTab("products")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-500 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Products</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{metrics?.totalProducts || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setSelectedTab("chats")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Customer Chats</span>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{storeData?.orders?.length || 0}</h3>
          </motion.div>
        </div>

        {/* SECTION TABS */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTab("orders")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition shrink-0 cursor-pointer ${
                selectedTab === "orders"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              📦 Order Processing ({storeData?.orders?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab("products")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition shrink-0 cursor-pointer ${
                selectedTab === "products"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              🍔 Product Inventory ({storeData?.products?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab("chats")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "chats"
                  ? "bg-[#312E81] text-white dark:bg-indigo-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Live Chats</span>
            </button>
          </div>

          {selectedTab === "products" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>

        {/* ORDERS TAB CONTENT */}
        {selectedTab === "orders" && (
          <div>
            {/* ORDER STATUS FILTERS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
              {["ALL", "PENDING", "ACCEPTED", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    orderFilter === st
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No orders found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Orders placed for your store will show up live here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order: any) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-400">#ORD-{order.id.slice(-6).toUpperCase()}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{order.user?.name || "Student Customer"}</h4>
                          <p className="text-xs text-slate-500">{order.deliveryLocation}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₦{order.totalAmount.toLocaleString()}</span>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              {order.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ITEMS */}
                      <div className="space-y-1.5 mb-4">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span>{item.quantity}x {item.product?.name}</span>
                            <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryInstructions && (
                        <p className="text-xs italic text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg mb-4">
                          Note: "{order.deliveryInstructions}"
                        </p>
                      )}
                    </div>

                    {/* ACTION CONTROLS */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition flex-1"
                        >
                          Accept Order
                        </button>
                      )}

                      {(order.status === "PENDING" || order.status === "ACCEPTED") && (
                        <button
                          onClick={() => handleStatusChange(order.id, "PREPARING")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex-1"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "READY_FOR_DELIVERY")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition flex-1"
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === "READY_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition flex-1"
                        >
                          Dispatch Rider
                        </button>
                      )}

                      {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "DELIVERED")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex-1"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "CANCELLED")}
                          disabled={updatingId === order.id}
                          className="px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB CONTENT */}
        {selectedTab === "products" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {storeData?.products?.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{prod.description || "No description"}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                        {prod.category?.name || "General"}
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{prod.price.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleProduct(prod.id, prod.isAvailable)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                            prod.isAvailable
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {prod.isAvailable ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER LIVE CHATS TAB */}
        {selectedTab === "chats" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Active Student Live Chats ({storeData?.orders?.length || 0})
              </h3>
              <span className="text-xs text-slate-500">Tap a chat to reply live to the customer</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {storeData?.orders?.length > 0 ? (
                storeData.orders.map((ord: any) => (
                  <div key={ord.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-[#312E81] dark:text-indigo-400 font-extrabold flex items-center justify-center text-base border border-indigo-100 dark:border-slate-700 shrink-0">
                        {ord.user?.name ? ord.user.name[0].toUpperCase() : "S"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ord.user?.name || "Campus Student"}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">📍 {ord.deliveryLocation}</p>
                        <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">Order #ORD-{ord.id.slice(-6).toUpperCase()} • ₦{ord.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setVendorChatStudent({
                          id: ord.user?.id || `user-${ord.id}`,
                          name: ord.user?.name || "Campus Student",
                          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                          phone: ord.user?.email || "+234 812 345 6789",
                        });
                        setIsVendorChatOpen(true);
                      }}
                      className="px-4 py-2 bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <MessageSquare size={14} /> Reply Live
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 font-medium">
                  No active student chats yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VENDOR LIVE CHAT MODAL */}
      {isVendorChatOpen && vendorChatStudent && (
        <MerchantChatModal
          isOpen={isVendorChatOpen}
          onClose={() => setIsVendorChatOpen(false)}
          vendor={vendorChatStudent}
          initialProductContext={`Order #${vendorChatStudent.id.slice(-6).toUpperCase()}`}
        />
      )}

      {/* ADD PRODUCT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Product to Inventory</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Asun Fried Rice"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Product Photo</label>

                  {/* Phone Photo Upload Button */}
                  <input
                    type="file"
                    ref={productFileInputRef}
                    onChange={handleProductFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => productFileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#312E81] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Select Photo from Phone</span>
                    </button>
                  </div>

                  {newProductImage && (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <Image src={newProductImage} alt="Preview" fill className="object-cover" />
                    </div>
                  )}

                  <input
                    type="text"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Short description of the item..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow-xs"
                  >
                    {submittingProduct ? "Creating..." : "Save Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
