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
  MessageSquare,
  Sun,
  Moon,
  Edit3,
  Trash2,
  Settings,
  Layers,
  PlusCircle,
  MinusCircle,
  Calendar,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUserStore } from "@/lib/userStore";
import { 
  getVendorDashboardData, 
  updateOrderStatus, 
  toggleStoreOpenStatus, 
  toggleProductAvailability,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  updateStoreSchedule
} from "@/actions/vendor";
import { 
  getStoreChatThreads, 
  getConversationMessages, 
  saveChatMessage, 
  markThreadAsRead, 
  ChatThreadItem, 
  ChatMessageRecord 
} from "@/actions/chat";
import { OrderStatus } from "@prisma/client";

interface VariationOption {
  name: string;
  price: number;
}

interface AddOnOption {
  name: string;
  price: number;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { isDark, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"orders" | "products" | "chats" | "settings">("orders");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Live Chat State (Database Backed)
  const [chatThreads, setChatThreads] = useState<ChatThreadItem[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(null);
  const [activeThreadMessages, setActiveThreadMessages] = useState<ChatMessageRecord[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isLoadingThreadMessages, setIsLoadingThreadMessages] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadChatsCountRef = useRef<number>(0);

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [addOns, setAddOns] = useState<AddOnOption[]>([]);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Store Schedule State
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [storePhone, setStorePhone] = useState("+2348012345678");
  const [deliveryEstimate, setDeliveryEstimate] = useState("20-35 mins");
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const handleProductFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isAlarmMuted, setIsAlarmMuted] = useState(false);
  const prevPendingCountRef = useRef<number>(0);

  const playVendorOrderAlarm = () => {
    if (isAlarmMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const playTone = (freq: number, startSec: number, durationSec: number, gainVal = 0.4) => {
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

      // Rich 4-tone urgent campus order alarm
      playTone(784, 0, 0.2, 0.45);        // G5
      playTone(1046.5, 0.18, 0.22, 0.45); // C6
      playTone(1318.5, 0.36, 0.25, 0.5);  // E6
      playTone(1567.98, 0.55, 0.45, 0.55);// G6
    } catch {
      // Audio restriction fallback
    }
  };

  const playMessageChime = () => {
    if (isAlarmMuted) return;
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

      // 2-tone gentle message chime
      playTone(587.33, 0, 0.18, 0.4); // D5
      playTone(880, 0.16, 0.32, 0.45); // A5
    } catch {
      // Audio fallback
    }
  };

  const handleTestSoundAlerts = () => {
    setIsAlarmMuted(false);
    playVendorOrderAlarm();
    setTimeout(() => {
      playMessageChime();
    }, 900);
  };

  const fetchDashboard = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    const res = await getVendorDashboardData();
    if (res.success && res.store) {
      setStoreData(res.store);
      setMetrics(res.metrics);

      if (res.store.estimatedDelivery) {
        setDeliveryEstimate(res.store.estimatedDelivery);
      }
      if (res.store.openingTime) {
        setOpeningTime(res.store.openingTime);
      }
      if (res.store.closingTime) {
        setClosingTime(res.store.closingTime);
      }
      if (res.store.phone) {
        setStorePhone(res.store.phone);
      }

      // Fetch live database chat threads
      if (res.store.id) {
        const threadsRes = await getStoreChatThreads(res.store.id);
        if (threadsRes.success && threadsRes.threads) {
          setChatThreads(threadsRes.threads);
          const totalUnread = threadsRes.threads.reduce((acc, t) => acc + t.unreadCount, 0);
          if (isPoll && totalUnread > prevUnreadChatsCountRef.current) {
            playMessageChime();
          }
          prevUnreadChatsCountRef.current = totalUnread;
        }
      }

      const currentPending = res.metrics?.pendingOrdersCount || 0;
      if (isPoll && currentPending > 0 && currentPending > prevPendingCountRef.current && !isAlarmMuted) {
        playVendorOrderAlarm();
      }
      prevPendingCountRef.current = currentPending;
    } else if (!isPoll) {
      router.replace("/vendor/login");
    }
    if (!isPoll) setLoading(false);
  };

  useEffect(() => {
    fetchDashboard(false);
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAlarmMuted]);

  // Polling active thread messages when an active thread is selected
  useEffect(() => {
    if (!activeThread || !storeData?.id) return;
    let active = true;

    async function loadActiveMessages() {
      if (!activeThread || !storeData?.id) return;
      try {
        const res = await getConversationMessages(storeData.id, activeThread.studentEmail);
        if (active && res.success && res.messages) {
          setActiveThreadMessages(res.messages);
        }
      } catch (e) {
        console.error("Error loading active thread messages:", e);
      }
    }

    loadActiveMessages();
    const interval = setInterval(loadActiveMessages, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeThread?.studentEmail, storeData?.id]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadMessages]);

  const handleSelectThread = async (thread: ChatThreadItem) => {
    setActiveThread(thread);
    setIsLoadingThreadMessages(true);
    if (storeData?.id) {
      await markThreadAsRead(storeData.id, thread.studentEmail);
      const res = await getConversationMessages(storeData.id, thread.studentEmail);
      if (res.success && res.messages) {
        setActiveThreadMessages(res.messages);
      }
      setChatThreads((prev) =>
        prev.map((t) => (t.studentEmail === thread.studentEmail ? { ...t, unreadCount: 0 } : t))
      );
    }
    setIsLoadingThreadMessages(false);
  };

  const handleSendVendorReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread || !storeData?.id) return;

    const textToSend = replyText.trim();
    setReplyText("");
    setIsSendingReply(true);

    try {
      const res = await saveChatMessage({
        storeId: storeData.id,
        senderType: "VENDOR",
        senderName: storeData.name,
        senderEmail: activeThread.studentEmail,
        text: textToSend,
        orderId: activeThread.orderId || undefined,
      });

      if (res.success && res.message) {
        setActiveThreadMessages((prev) => [...prev, res.message as any]);
        setChatThreads((prev) =>
          prev.map((t) =>
            t.studentEmail === activeThread.studentEmail
              ? { ...t, lastMessage: textToSend, lastMessageAt: new Date().toISOString() }
              : t
          )
        );
      }
    } catch (e) {
      console.error("Error sending vendor reply:", e);
    } finally {
      setIsSendingReply(false);
    }
  };

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

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductName("");
    setProductPrice("");
    setProductDesc("");
    setProductImage("");
    setProductCategory("");
    setVariations([]);
    setAddOns([]);
    setShowProductModal(true);
  };

  const openEditProductModal = (prod: any) => {
    setEditingProductId(prod.id);
    setProductName(prod.name);
    setProductPrice(prod.price.toString());
    setProductImage(prod.image || "");
    setProductCategory(prod.categoryId || "");

    // Parse options from description if present
    let rawDesc = prod.description || "";
    let parsedVars: VariationOption[] = [];
    let parsedAdds: AddOnOption[] = [];

    const optionsMatch = rawDesc.match(/\[OPTIONS:\s*(\{.*?\})\]/);
    if (optionsMatch && optionsMatch[1]) {
      try {
        const parsed = JSON.parse(optionsMatch[1]);
        if (Array.isArray(parsed.sizes)) parsedVars = parsed.sizes;
        if (Array.isArray(parsed.addons)) parsedAdds = parsed.addons;
        rawDesc = rawDesc.replace(/\[OPTIONS:\s*\{.*?\}\]/, "").trim();
      } catch (e) {
        // Fallback raw
      }
    }

    setProductDesc(rawDesc);
    setVariations(parsedVars);
    setAddOns(parsedAdds);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product from your store?")) return;
    
    setStoreData((prev: any) => ({
      ...prev,
      products: prev.products.filter((p: any) => p.id !== productId),
    }));

    await deleteVendorProduct(productId);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice || !storeData) return;
    setSubmittingProduct(true);

    // Build structured description with options if configured
    let finalDesc = productDesc.trim();
    if (variations.length > 0 || addOns.length > 0) {
      const optionsPayload = JSON.stringify({
        sizes: variations,
        addons: addOns,
      });
      finalDesc = `${finalDesc} [OPTIONS: ${optionsPayload}]`.trim();
    }

    const defaultImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

    if (editingProductId) {
      const res = await updateVendorProduct({
        productId: editingProductId,
        name: productName,
        price: parseFloat(productPrice),
        description: finalDesc,
        image: productImage || defaultImg,
        categoryId: productCategory || undefined,
      });

      if (res.success && res.product) {
        setStoreData((prev: any) => ({
          ...prev,
          products: prev.products.map((p: any) => p.id === editingProductId ? res.product : p),
        }));
        setShowProductModal(false);
      }
    } else {
      const res = await createVendorProduct({
        storeId: storeData.id,
        name: productName,
        price: parseFloat(productPrice),
        description: finalDesc,
        image: productImage || defaultImg,
        categoryId: productCategory || undefined,
      });

      if (res.success && res.product) {
        setStoreData((prev: any) => ({
          ...prev,
          products: [res.product, ...prev.products],
        }));
        setShowProductModal(false);
      }
    }

    setSubmittingProduct(false);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;
    setIsSavingSchedule(true);
    setScheduleSuccess(false);

    const res = await updateStoreSchedule({
      storeId: storeData.id,
      openingTime,
      closingTime,
      phone: storePhone,
      estimatedDelivery: deliveryEstimate,
    });

    if (res.success && res.store) {
      setStoreData((prev: any) => ({
        ...prev,
        openingTime: res.store.openingTime,
        closingTime: res.store.closingTime,
        phone: res.store.phone,
        estimatedDelivery: res.store.estimatedDelivery,
      }));
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
    }
    setIsSavingSchedule(false);
  };

  // Variation helper
  const addVariationRow = () => {
    setVariations([...variations, { name: "", price: 0 }]);
  };

  const removeVariationRow = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  // Add-on helper
  const addAddOnRow = () => {
    setAddOns([...addOns, { name: "", price: 0 }]);
  };

  const removeAddOnRow = (idx: number) => {
    setAddOns(addOns.filter((_, i) => i !== idx));
  };

  const filteredOrders = storeData?.orders?.filter((o: any) => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-body">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Loading Vendor POS Terminal...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connecting to Supabase Live Database</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-24 font-body ${
      isDark ? "bg-[#0B0F19] text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* HEADER SECTION */}
      <div className={`border-b sticky top-0 z-30 shadow-xs backdrop-blur-md ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xl overflow-hidden shadow-xs shrink-0">
              {storeData?.logo ? (
                <img src={storeData.logo} alt={storeData.name} className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {storeData?.name || "Campus Kitchen POS"}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  storeData?.isOpen 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                }`}>
                  {storeData?.isOpen ? "Live Orders Active" : "Orders Paused"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ⏱️ Delivery: {deliveryEstimate} • 🕒 Hours: {openingTime} - {closingTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-heading font-bold transition-all active:scale-95 cursor-pointer ${
                isDark 
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" 
                  : "bg-slate-100 border-slate-300 text-indigo-700 hover:bg-slate-200"
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {/* AUDIO ALERT CONTROLS */}
            <button
              type="button"
              onClick={handleTestSoundAlerts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Test Order & Message Sound Alert"
            >
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Test Tone</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextMute = !isAlarmMuted;
                setIsAlarmMuted(nextMute);
                if (!nextMute) handleTestSoundAlerts();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
                isAlarmMuted
                  ? isDark ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold"
              }`}
              title="Toggle Order & Message Audio Alert"
            >
              {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
              <span>{isAlarmMuted ? "Audio Muted" : "Audio Alerts ON"}</span>
            </button>

            <Link
              href={`/vendor/${storeData?.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
                isDark 
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Storefront
            </Link>

            <button
              type="button"
              onClick={handleToggleStore}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer ${
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
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-heading font-extrabold rounded-xl backdrop-blur-md border border-white/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
                className="px-4 py-2 bg-white text-amber-700 hover:bg-amber-50 font-heading font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Menu & Variations</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{storeData?.products?.length || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setSelectedTab("settings")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-purple-500 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Operating Schedule</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 truncate">{openingTime} – {closingTime}</h3>
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
              🍔 Menu & Add-ons ({storeData?.products?.length || 0})
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
              <span>Customer Chats</span>
              {chatThreads.reduce((acc, t) => acc + t.unreadCount, 0) > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                  {chatThreads.reduce((acc, t) => acc + t.unreadCount, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("settings")}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "settings"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/60"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Hours & Settings</span>
            </button>
          </div>

          {selectedTab === "products" && (
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Product & Extras
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                          className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition flex-1 cursor-pointer"
                        >
                          Accept Order
                        </button>
                      )}

                      {(order.status === "PENDING" || order.status === "ACCEPTED") && (
                        <button
                          onClick={() => handleStatusChange(order.id, "PREPARING")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex-1 cursor-pointer"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "READY_FOR_DELIVERY")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition flex-1 cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === "READY_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition flex-1 cursor-pointer"
                        >
                          Send for Delivery
                        </button>
                      )}

                      {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "DELIVERED")}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex-1 cursor-pointer"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "CANCELLED")}
                          disabled={updatingId === order.id}
                          className="px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
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
                    <th className="p-4">Item & Customizations</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {storeData?.products?.map((prod: any) => {
                    const optionsMatch = (prod.description || "").match(/\[OPTIONS:\s*(\{.*?\})\]/);
                    let varsCount = 0;
                    let addsCount = 0;
                    if (optionsMatch && optionsMatch[1]) {
                      try {
                        const parsed = JSON.parse(optionsMatch[1]);
                        varsCount = parsed.sizes?.length || 0;
                        addsCount = parsed.addons?.length || 0;
                      } catch {}
                    }

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{prod.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {(prod.description || "").replace(/\[OPTIONS:\s*\{.*?\}\]/, "").trim() || "No description"}
                            </p>
                            {(varsCount > 0 || addsCount > 0) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {varsCount > 0 && (
                                  <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[9px] rounded-md border border-indigo-200/50">
                                    {varsCount} Sizes/Portions
                                  </span>
                                )}
                                {addsCount > 0 && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-mono font-bold text-[9px] rounded-md border border-amber-200/50">
                                    {addsCount} Extras & Add-ons
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                          {prod.category?.name || "General"}
                        </td>
                        <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ₦{prod.price.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleProduct(prod.id, prod.isAvailable)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              prod.isAvailable
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {prod.isAvailable ? "In Stock" : "Out of Stock"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProductModal(prod)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                              title="Edit product and options"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER LIVE CHATS TAB (DATABASE SYNCHRONIZED) */}
        {selectedTab === "chats" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            {activeThread ? (
              /* ACTIVE CONVERSATION VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveThread(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-heading font-extrabold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      ← Back to All Chats
                    </button>
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{activeThread.studentName}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeThread.studentEmail}
                        {activeThread.orderSummary && ` • Context: ${activeThread.orderSummary}`}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-heading font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                    Live Supabase Thread
                  </span>
                </div>

                {/* MESSAGES BUBBLES LIST */}
                <div className="h-[380px] overflow-y-auto p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0A0A0C] border border-slate-100 dark:border-slate-800/80 space-y-3">
                  {isLoadingThreadMessages ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p>Loading conversation history from database...</p>
                    </div>
                  ) : activeThreadMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                      <MessageSquare size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                      <p>No messages exchanged yet in this conversation.</p>
                    </div>
                  ) : (
                    activeThreadMessages.map((msg) => {
                      const isVendor = msg.senderType === "VENDOR";
                      const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isVendor ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isVendor
                                ? "bg-[#312E81] text-white rounded-br-xs font-medium"
                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700 font-medium"
                            }`}
                          >
                            {!isVendor && (
                              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block mb-1">
                                {msg.senderName}
                              </span>
                            )}
                            {msg.image && (
                              <div className="relative w-44 h-28 rounded-xl overflow-hidden mb-2 border border-black/10">
                                <Image src={msg.image} alt="Attachment" fill className="object-cover" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                            {timeFormatted}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* VENDOR REPLY FORM */}
                <form onSubmit={handleSendVendorReply} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeThread.studentName}...`}
                    className="flex-1 px-4 py-3 bg-[#FAFAF7] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSendingReply}
                    className="px-5 py-3 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
                  >
                    <span>{isSendingReply ? "Sending..." : "Send Reply"}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* THREADS LIST VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <span>Customer Live Chats ({chatThreads.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">Live student inquiries & order chats from PostgreSQL</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {chatThreads.length > 0 ? (
                    chatThreads.map((thread) => {
                      const timeStr = new Date(thread.lastMessageAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={thread.studentEmail}
                          className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition cursor-pointer"
                          onClick={() => handleSelectThread(thread)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-[#312E81] dark:text-indigo-400 font-extrabold flex items-center justify-center text-base border border-indigo-100 dark:border-slate-700 shrink-0">
                              {thread.studentName ? thread.studentName[0].toUpperCase() : "S"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {thread.studentName}
                                </h4>
                                {thread.unreadCount > 0 && (
                                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
                                    {thread.unreadCount} New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                                &ldquo;{thread.lastMessage}&rdquo;
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span>{timeStr}</span>
                                {thread.orderSummary && (
                                  <>
                                    <span>•</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono truncate">
                                      {thread.orderSummary}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectThread(thread);
                            }}
                            className="px-4 py-2 bg-[#312E81] hover:bg-[#1E1B4B] text-white rounded-xl text-xs font-heading font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                          >
                            <MessageSquare size={14} />
                            <span>Reply Live</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-14 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mx-auto">
                        <MessageSquare size={26} />
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
                        No customer chat messages yet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        When students ask questions about your menu items or active orders, their messages will appear here in real time with audible notification chimes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS & OPERATING HOURS TAB */}
        {selectedTab === "settings" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs max-w-2xl">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Store Operating Hours & Schedule
                </h3>
                <p className="text-xs text-slate-500">Configure your daily campus kitchen timings and estimated delivery speeds.</p>
              </div>
            </div>

            {scheduleSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Operating hours and delivery settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Daily Opening Time</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Daily Closing Time</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Estimated Delivery Speed</label>
                  <input
                    type="text"
                    value={deliveryEstimate}
                    onChange={(e) => setDeliveryEstimate(e.target.value)}
                    placeholder="e.g. 20-35 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Store Contact Phone / WhatsApp Line</label>
                  <input
                    type="tel"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+234 812 345 6789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingSchedule ? "Saving Schedule..." : "Save Operating Schedule ➔"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL WITH VARIATIONS & ADD-ONS */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingProductId ? "Edit Product & Customizations" : "Add Product with Add-ons & Portions"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure base price, portion sizes, and protein extras for students.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Asun Jollof Rice Combo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Base Price (₦) *</label>
                    <input
                      type="number"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="3500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* IMAGE UPLOAD */}
                <div>
                  <label className="block font-bold mb-1">Product Photo</label>
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
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#312E81] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Upload Photo from Device</span>
                    </button>
                  </div>

                  {productImage && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <Image src={productImage} alt="Preview" fill className="object-cover" />
                    </div>
                  )}

                  <input
                    type="text"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Describe delicious ingredients, portion details, or combo highlights..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* PORTION SIZES / VARIATIONS BUILDER */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-500" /> Portion Sizes & Variations
                    </span>
                    <button
                      type="button"
                      onClick={addVariationRow}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <PlusCircle size={13} /> Add Portion Size
                    </button>
                  </div>

                  {variations.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No extra portions added. Standard single portion applies.</p>
                  ) : (
                    <div className="space-y-2">
                      {variations.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Large / Combo Pack"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...variations];
                              updated[i].name = e.target.value;
                              setVariations(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                          <div className="flex items-center gap-1 w-28">
                            <span className="text-slate-400 font-bold">+₦</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={v.price}
                              onChange={(e) => {
                                const updated = [...variations];
                                updated[i].price = parseFloat(e.target.value) || 0;
                                setVariations(updated);
                              }}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariationRow(i)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                          >
                            <MinusCircle size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ADD-ON EXTRAS BUILDER */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Extras & Add-ons (Protein, Sides, Drinks)
                    </span>
                    <button
                      type="button"
                      onClick={addAddOnRow}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <PlusCircle size={13} /> Add Extra
                    </button>
                  </div>

                  {addOns.length === 0 ? (
                    <p className="text-[11px] text-amber-700/60 dark:text-amber-400/60 italic">No add-ons configured yet (e.g., Extra Fried Chicken, Fried Plantain, Drinks).</p>
                  ) : (
                    <div className="space-y-2">
                      {addOns.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Fried Plantain (Dodo) / Grilled Chicken"
                            value={a.name}
                            onChange={(e) => {
                              const updated = [...addOns];
                              updated[i].name = e.target.value;
                              setAddOns(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                          <div className="flex items-center gap-1 w-28">
                            <span className="text-slate-400 font-bold">+₦</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={a.price}
                              onChange={(e) => {
                                const updated = [...addOns];
                                updated[i].price = parseFloat(e.target.value) || 0;
                                setAddOns(updated);
                              }}
                              className="w-full px-2 py-1.5 rounded-lg border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddOnRow(i)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                          >
                            <MinusCircle size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-black text-xs transition shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {submittingProduct ? "Saving..." : editingProductId ? "Update Product & Options" : "Save to Store Menu"}
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
