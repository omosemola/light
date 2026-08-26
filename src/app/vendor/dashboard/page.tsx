"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
  Sparkles,
  Search,
  Check,
  X,
  Phone,
  ShieldCheck,
  Star,
  Send,
  User,
  ArrowRight,
  ArrowLeft,
  Filter,
  Eye,
  LogOut,
  Utensils
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  updateStoreSchedule,
  updateVendorProfile,
  logoutVendor
} from "@/actions/vendor";
import { OrderStatus } from "@prisma/client";
import { 
  parseProductDescription, 
  encodeProductDescription, 
  parseProductImages, 
  encodeProductImages, 
  VariationOption, 
  AddOnOption 
} from "@/lib/productOptions";

export default function VendorDashboardPage() {
  const router = useRouter();
  const { profile, logoutUser } = useUserStore();
  const { isDark, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"orders" | "products" | "reviews" | "settings">("orders");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [productSearch, setProductSearch] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productDesc, setProductDesc] = useState("");
  const [productIngredients, setProductIngredients] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [addOns, setAddOns] = useState<AddOnOption[]>([]);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Store Profile & Operations State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storePhone, setStorePhone] = useState("+2348012345678");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeCoverImage, setStoreCoverImage] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [deliveryEstimate, setDeliveryEstimate] = useState("20-35 mins");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Sound Alarm State
  const [isAlarmMuted, setIsAlarmMuted] = useState(false);
  const prevPendingCountRef = useRef<number>(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, durationMs = 1500) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, durationMs);
  };

  const openEditProfileModal = () => {
    if (storeData) {
      setStoreName(storeData.name || "");
      setOwnerName(storeData.user?.name || "");
      setStoreDesc(storeData.description || "");
      setStorePhone(storeData.phone || storeData.user?.phone || "");
      setStoreEmail(storeData.user?.email || "");
      setStoreLogo(storeData.logo || "");
      setStoreCoverImage(storeData.coverImage || "");
      setDeliveryEstimate(storeData.estimatedDelivery || "20-35 mins");
      setOpeningTime(storeData.openingTime || "08:00");
      setClosingTime(storeData.closingTime || "22:00");
    }
    setShowProfileModal(true);
  };

  const handleProductFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setProductImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (e.target) e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    showToast("🔔 Sound alarms tested successfully!");
  };

  const fetchDashboard = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    const res = await getVendorDashboardData();
    if (res.success && res.store) {
      setStoreData((prev: any) => {
        if (!prev || !isPoll) return res.store;
        return {
          ...res.store,
          products: prev.products || res.store.products,
        };
      });
      setMetrics(res.metrics);

      // ONLY populate edit form inputs on initial load (!isPoll), NEVER on background poll
      if (!isPoll) {
        if (res.store.name) setStoreName(res.store.name);
        if (res.store.user?.name) setOwnerName(res.store.user.name);
        if (res.store.description) setStoreDesc(res.store.description);
        if (res.store.phone || res.store.user?.phone) setStorePhone(res.store.phone || res.store.user?.phone || "");
        if (res.store.user?.email) setStoreEmail(res.store.user.email);
        if (res.store.logo) setStoreLogo(res.store.logo);
        if (res.store.coverImage) setStoreCoverImage(res.store.coverImage);
        if (res.store.estimatedDelivery) setDeliveryEstimate(res.store.estimatedDelivery);
        if (res.store.openingTime) setOpeningTime(res.store.openingTime);
        if (res.store.closingTime) setClosingTime(res.store.closingTime);
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
    }, 12000);
    return () => clearInterval(interval);
  }, [isAlarmMuted]);

  const handleToggleStore = async () => {
    if (!storeData) return;
    const newStatus = !storeData.isOpen;
    setStoreData((prev: any) => ({ ...prev, isOpen: newStatus }));
    await toggleStoreOpenStatus(storeData.id, newStatus);
    showToast(`Store is now ${newStatus ? "ACTIVE & ACCEPTING ORDERS" : "CLOSED / PAUSED"}`);
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
      showToast(`Order #${orderId.slice(-6)} updated to ${status.replace(/_/g, " ")}`);
    } else {
      showToast(res.error || "Failed to update order");
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
    showToast(`Dish is now ${!current ? "IN STOCK" : "OUT OF STOCK"}`);
  };

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProductName("");
    setProductPrice("");
    setProductDesc("");
    setProductIngredients("");
    setProductImages([]);
    setProductCategory("");
    setVariations([]);
    setAddOns([]);
    setShowProductModal(true);
  };

  const openEditProductModal = (prod: any) => {
    setEditingProductId(prod.id);
    setProductName(prod.name || "");
    setProductPrice(prod.price ? prod.price.toString() : "");
    setProductCategory(prod.categoryId || "");

    const images = parseProductImages(prod.image);
    setProductImages(images);

    const structured = parseProductDescription(prod.description);
    setProductDesc(structured.description);
    setProductIngredients(structured.ingredients.join(", "));
    setVariations(structured.sizes);
    setAddOns(structured.addons);

    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this dish from your store catalogue?")) return;
    
    setStoreData((prev: any) => ({
      ...prev,
      products: prev.products.filter((p: any) => p.id !== productId),
    }));

    await deleteVendorProduct(productId);
    showToast("Dish removed from store catalogue.");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice || !storeData) {
      showToast("Please provide the dish name and price.");
      return;
    }
    setSubmittingProduct(true);

    try {
      // 1. Process ingredients (comma or newline separated)
      const ingredientsList = productIngredients
        .split(/[,\n]/)
        .map((i) => i.trim())
        .filter(Boolean);

      // 2. Encode structured description
      const finalDesc = encodeProductDescription({
        description: productDesc.trim(),
        ingredients: ingredientsList,
        sizes: variations.filter((v) => v.name.trim()),
        addons: addOns.filter((a) => a.name.trim()),
      });

      // 3. Encode images
      const finalImage = encodeProductImages(productImages);

      if (editingProductId) {
        const res = await updateVendorProduct({
          productId: editingProductId,
          name: productName.trim(),
          price: parseFloat(productPrice) || 0,
          description: finalDesc,
          image: finalImage,
          categoryId: productCategory || undefined,
        });

        if (res.success && res.product) {
          setStoreData((prev: any) => {
            const currentProds = prev?.products || [];
            const exists = currentProds.some((p: any) => p.id === editingProductId);
            return {
              ...prev,
              products: exists
                ? currentProds.map((p: any) => (p.id === editingProductId ? res.product : p))
                : [res.product, ...currentProds],
            };
          });
          setShowProductModal(false);
          showToast("✓ Dish updated successfully!");
        } else {
          showToast(res.error || "Failed to update dish. Please check your inputs.");
        }
      } else {
        const res = await createVendorProduct({
          storeId: storeData.id,
          name: productName.trim(),
          price: parseFloat(productPrice) || 0,
          description: finalDesc,
          image: finalImage,
          categoryId: productCategory || undefined,
        });

        if (res.success && res.product) {
          setStoreData((prev: any) => ({
            ...prev,
            products: [res.product, ...(prev?.products || [])],
          }));
          setShowProductModal(false);
          showToast("✓ New dish added to store catalogue!");
        } else {
          showToast(res.error || "Failed to create dish. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Error saving dish:", err);
      showToast(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeData) return;
    if (!storeName.trim()) {
      showToast("Store Name cannot be empty.");
      return;
    }
    setIsSavingProfile(true);

    try {
      const res = await updateVendorProfile({
        storeId: storeData.id,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        phone: storePhone.trim(),
        description: storeDesc.trim(),
        openingTime,
        closingTime,
        estimatedDelivery: deliveryEstimate.trim(),
        logo: storeLogo,
        coverImage: storeCoverImage,
      });

      if (res.success && res.store) {
        setStoreData((prev: any) => ({
          ...prev,
          name: res.store.name,
          description: res.store.description,
          phone: res.store.phone,
          openingTime: res.store.openingTime,
          closingTime: res.store.closingTime,
          estimatedDelivery: res.store.estimatedDelivery,
          logo: res.store.logo,
          coverImage: res.store.coverImage,
          user: {
            ...prev?.user,
            name: ownerName.trim(),
            phone: storePhone.trim(),
            image: res.store.logo,
          },
        }));
        setShowProfileModal(false);
        showToast("✓ Store profile updated & saved to database!");
      } else {
        showToast(res.error || "Failed to update store profile.");
      }
    } catch (err: any) {
      console.error("Error updating vendor profile:", err);
      showToast(err.message || "An unexpected error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addVariationRow = () => {
    setVariations([...variations, { name: "", price: 0 }]);
  };

  const removeVariationRow = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
  };

  const addAddOnRow = () => {
    setAddOns([...addOns, { name: "", price: 0 }]);
  };

  const removeAddOnRow = (idx: number) => {
    setAddOns(addOns.filter((_, i) => i !== idx));
  };

  const filteredOrders = useMemo(() => {
    const list = storeData?.orders || [];
    if (orderFilter === "ALL") return list;
    return list.filter((o: any) => o.status === orderFilter);
  }, [storeData?.orders, orderFilter]);

  const filteredProducts = useMemo(() => {
    const list = storeData?.products || [];
    if (!productSearch.trim()) return list;
    const q = productSearch.toLowerCase();
    return list.filter((p: any) => 
      p.name?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q)
    );
  }, [storeData?.products, productSearch]);

  const pendingCount = metrics?.pendingOrdersCount || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] flex flex-col items-center justify-center p-6 text-center font-body">
        <div className="w-16 h-16 rounded-3xl bg-[#312E81]/10 text-[#312E81] dark:text-indigo-400 flex items-center justify-center animate-spin mb-4 border border-indigo-200 dark:border-indigo-900">
          <RefreshCw size={28} />
        </div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">Connecting Merchant POS Terminal...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Synchronizing live store data & incoming orders</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-28 font-body ${
      isDark ? "bg-[#09090B] text-zinc-100" : "bg-[#FAFAF7] text-slate-900"
    }`}>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-[#1E1B4B] text-white rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 font-heading font-extrabold text-xs backdrop-blur-md max-w-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
              aria-label="Dismiss Alert"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIGNATURE HERO BANNER & HEADER */}
      <div className="relative bg-[#1E1B4B] dark:bg-zinc-950 text-white overflow-hidden shadow-lg border-b border-indigo-950 dark:border-zinc-800">
        <Image
          src="/support-banner.jpg"
          alt="Vendor Header Background"
          fill
          priority
          className="object-cover object-center pointer-events-none opacity-40"
        />
        <div className="absolute inset-0 bg-[#1E1B4B]/90 dark:bg-[#09090B]/95" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* STORE IDENTITY & LIVE STATUS */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-amber-300 font-black text-2xl overflow-hidden shadow-xl shrink-0 backdrop-blur-md">
                {storeData?.logo ? (
                  <img src={storeData.logo} alt={storeData.name} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat className="w-9 h-9 text-amber-400" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-white leading-tight">
                    {storeData?.name || "Campus Kitchen POS"}
                  </h1>

                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
                    title="Edit Store Profile"
                  >
                    <Edit3 size={13} />
                  </button>

                  {storeData?.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-heading font-extrabold tracking-wider uppercase">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      Verified Merchant
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-heading font-extrabold tracking-wider uppercase animate-pulse">
                      <Clock size={12} className="text-amber-400" />
                      Pending Verification
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Bike size={13} className="text-amber-300" />
                    Delivery: <strong className="text-white">{deliveryEstimate}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-sky-300" />
                    Hours: <strong className="text-white">{openingTime} - {closingTime}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <strong className="text-white">{storeData?.rating || "4.9"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS & LIVE STORE TOGGLE */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* EDIT STORE PROFILE BUTTON ON HERO */}
              <button
                type="button"
                onClick={openEditProfileModal}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 border border-amber-300 text-slate-950 font-heading font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg"
                title="Edit Store Profile, Branding, Hotlines & Hours"
              >
                <Edit3 size={15} />
                <span>Edit Store Profile</span>
              </button>

              {/* LIVE STORE ON/OFF SWITCH */}
              <button
                type="button"
                onClick={handleToggleStore}
                className={`px-4 py-2.5 rounded-2xl font-heading font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg border ${
                  storeData?.isOpen
                    ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white"
                    : "bg-rose-600 hover:bg-rose-500 border-rose-400 text-white"
                }`}
              >
                <Power className={`w-4 h-4 ${storeData?.isOpen ? "animate-pulse" : ""}`} />
                <span>{storeData?.isOpen ? "STORE OPEN & LIVE" : "STORE PAUSED / CLOSED"}</span>
              </button>

              {/* AUDIO ALARM TEST & TOGGLE */}
              <button
                type="button"
                onClick={() => {
                  const nextMute = !isAlarmMuted;
                  setIsAlarmMuted(nextMute);
                  if (!nextMute) handleTestSoundAlerts();
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-heading font-extrabold flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer border ${
                  isAlarmMuted
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-slate-300"
                    : "bg-amber-400 hover:bg-amber-300 border-amber-300 text-slate-950 shadow-md"
                }`}
                title="Toggle Live Audio Alarms"
              >
                {isAlarmMuted ? <VolumeX size={15} /> : <BellRing size={15} className="animate-bounce" />}
                <span>{isAlarmMuted ? "Audio Muted" : "Live Alarms ON"}</span>
              </button>

              {/* BACK TO MARKETPLACE STOREFRONT */}
              <Link
                href="/"
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
                title="Back to Marketplace Storefront"
              >
                <ArrowLeft size={14} className="text-amber-300" />
                <span>Marketplace</span>
              </Link>

              {/* STOREFRONT PREVIEW LINK */}
              <Link
                href={`/vendor/${storeData?.id}`}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
              >
                <Eye size={14} className="text-indigo-300" />
                <span>Storefront</span>
                <ExternalLink size={12} />
              </Link>

              {/* THEME TOGGLE */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* REFRESH */}
              <button
                type="button"
                onClick={() => { fetchDashboard(false); showToast("POS data refreshed!"); }}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw size={15} />
              </button>

              {/* SIGN OUT */}
              <button
                type="button"
                onClick={async () => {
                  await logoutVendor();
                  logoutUser();
                  window.location.href = "/vendor/login";
                }}
                className="px-3 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 font-heading font-bold text-xs flex items-center gap-1 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Sign Out of Merchant POS"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">

        {/* PENDING ADMIN APPROVAL BANNER */}
        {storeData && storeData.isVerified === false && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-3xl shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 mb-1">
                    <span>Pending Campus Admin Verification</span>
                  </div>
                  <h2 className="text-base font-heading font-black text-slate-900 dark:text-white">
                    Store Application Under Review ⏳
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Your merchant account and store profile are currently being verified by Lightson campus administrators. You can configure your menu dishes, opening hours, and pricing while waiting for activation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-heading font-bold">
                  Status: Under Review
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LIVE INCOMING ORDERS SOUND ALARM BANNER */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 md:p-5 bg-amber-500 text-slate-950 rounded-3xl shadow-lg flex flex-wrap items-center justify-between gap-4 border border-amber-400"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center text-slate-950 shrink-0 animate-bounce">
                <BellRing className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-heading font-black tracking-tight flex items-center gap-2 text-slate-950">
                  🚨 {pendingCount} NEW INCOMING {pendingCount === 1 ? "ORDER" : "ORDERS"} WAITING!
                </h2>
                <p className="text-xs text-slate-900 font-bold">
                  Fresh student orders awaiting kitchen confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playVendorOrderAlarm}
                className="px-3.5 py-2 bg-black/10 hover:bg-black/20 text-slate-950 text-xs font-heading font-extrabold rounded-xl border border-black/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Test Chime</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("orders");
                  setOrderFilter("PENDING");
                }}
                className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-900 font-heading font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                View Pending Orders ({pendingCount})
              </button>
            </div>
          </motion.div>
        )}

        {/* CLICKABLE 4 KPI METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          
          <motion.div
            onClick={() => setSelectedTab("orders")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-emerald-500" 
                : "bg-white border-slate-200 hover:border-emerald-500 shadow-xs"
            }`}
          >
            <DollarSign className="w-5 h-5 text-emerald-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Gross Volume</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>
              ₦{Number(metrics?.totalGMV || 0).toLocaleString()}
            </h3>
          </motion.div>

          <motion.div
            onClick={() => { setSelectedTab("orders"); setOrderFilter("PENDING"); }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              pendingCount > 0 
                ? "border-amber-500 bg-amber-500/10" 
                : isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-amber-500" 
                : "bg-white border-slate-200 hover:border-amber-500 shadow-xs"
            }`}
          >
            <BellRing className={`w-5 h-5 ${pendingCount > 0 ? "text-amber-500 animate-bounce" : "text-amber-500"} mb-1.5`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Live Orders</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>
              {pendingCount} Pending
            </h3>
          </motion.div>

          <motion.div
            onClick={() => setSelectedTab("products")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-indigo-500" 
                : "bg-white border-slate-200 hover:border-indigo-500 shadow-xs"
            }`}
          >
            <Utensils className="w-5 h-5 text-indigo-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Menu Dishes</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>
              {storeData?.products?.length || 0} Dishes
            </h3>
          </motion.div>

          <motion.div
            onClick={() => setSelectedTab("reviews")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-amber-400" 
                : "bg-white border-slate-200 hover:border-amber-400 shadow-xs"
            }`}
          >
            <Star className="w-5 h-5 text-amber-400 mb-1.5 fill-amber-400" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Rating Score</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>
              ★ {storeData?.rating || "4.9"} ({storeData?.reviews?.length || 0})
            </h3>
          </motion.div>
        </div>

        {/* 4 MAIN OPERATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b pb-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedTab("orders")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-heading font-black transition shrink-0 cursor-pointer flex items-center gap-2 ${
              selectedTab === "orders"
                ? "bg-[#312E81] text-white shadow-md"
                : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Package size={15} />
            <span>Live Orders POS ({storeData?.orders?.length || 0})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("products")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-heading font-black transition shrink-0 cursor-pointer flex items-center gap-2 ${
              selectedTab === "products"
                ? "bg-[#312E81] text-white shadow-md"
                : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Utensils size={15} />
            <span>Menu & Dishes ({storeData?.products?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("reviews")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-heading font-black transition shrink-0 cursor-pointer flex items-center gap-2 ${
              selectedTab === "reviews"
                ? "bg-[#312E81] text-white shadow-md"
                : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Star size={15} />
            <span>Student Reviews ({storeData?.reviews?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("settings")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-heading font-black transition shrink-0 cursor-pointer flex items-center gap-2 ${
              selectedTab === "settings"
                ? "bg-[#312E81] text-white shadow-md"
                : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Settings size={15} />
            <span>Store Profile & Operations</span>
          </button>
        </div>



        {/* 1. LIVE ORDERS POS TAB */}
        {selectedTab === "orders" && (
          <div className="space-y-4">
            {/* ORDER STATUS FILTERS */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              {["ALL", "PENDING", "ACCEPTED", "PREPARING", "READY_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                    orderFilter === st
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                      : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st === "ALL" ? "All Orders" : st.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
              }`}>
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-zinc-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  No Orders in this queue
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Incoming student orders will immediately trigger sound chimes and appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order: any) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border shadow-sm transition-all space-y-4 ${
                      order.status === "PENDING"
                        ? "border-amber-500/80 bg-amber-500/5 dark:bg-amber-950/20"
                        : isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
                    }`}
                  >
                    {/* ORDER HEADER */}
                    <div className="flex items-start justify-between gap-3 border-b pb-3 border-slate-100 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-sm text-slate-900 dark:text-white">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            order.status === "PENDING"
                              ? "bg-amber-500 text-slate-950 animate-pulse"
                              : order.status === "DELIVERED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-indigo-500/20 text-indigo-400"
                          }`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <span>•</span>
                          <span>{order.user?.name || "Student Customer"}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-heading font-black text-emerald-600 dark:text-emerald-400">
                          ₦{Number(order.totalAmount || 0).toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          {order.paymentMethod || "Paystack"}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-heading">
                        Dishes to Prepare:
                      </h4>
                      <div className="space-y-1.5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 font-medium">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.quantity}x {item.product?.name || "Campus Meal"}
                              </span>
                              {item.selectedSize && (
                                <span className="block text-[10px] text-indigo-600 dark:text-indigo-400">
                                  Portion: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                                  Extras: {Array.isArray(item.selectedAddOns) ? item.selectedAddOns.join(", ") : item.selectedAddOns}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">
                              ₦{Number(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DELIVERY DETAILS & PHONE */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Bike size={13} className="text-amber-500" />
                        <span>Deliver To: {order.deliveryLocation || "Campus Hostel"}</span>
                      </div>
                      {order.user?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-emerald-500" />
                          <a href={`tel:${order.user.phone}`} className="hover:underline font-mono text-emerald-600 dark:text-emerald-400">
                            {order.user.phone}
                          </a>
                        </div>
                      )}
                      {order.deliveryInstructions && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-xl mt-1 border border-amber-200 dark:border-amber-900">
                          <strong>Note:</strong> "{order.deliveryInstructions}"
                        </div>
                      )}
                    </div>

                    {/* STATUS ACTION BUTTONS */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {order.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, OrderStatus.ACCEPTED)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === order.id ? "Updating..." : "✓ Accept Order"}
                        </button>
                      )}

                      {order.status === "ACCEPTED" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === order.id ? "Updating..." : "🍳 Start Cooking / Prepare"}
                        </button>
                      )}

                      {order.status === "PREPARING" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, OrderStatus.READY_FOR_DELIVERY)}
                          className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === order.id ? "Updating..." : "🛵 Ready for Dispatch"}
                        </button>
                      )}

                      {order.status === "READY_FOR_DELIVERY" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, OrderStatus.DELIVERED)}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === order.id ? "Updating..." : "✓ Mark as Delivered"}
                        </button>
                      )}

                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => {
                            if (confirm("Cancel this order?")) {
                              handleStatusChange(order.id, OrderStatus.CANCELLED);
                            }
                          }}
                          className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl font-heading font-bold text-xs transition active:scale-95 cursor-pointer"
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

        {/* 2. MENU & DISHES CATALOGUE TAB */}
        {selectedTab === "products" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search dishes by name or ingredients..."
                  className={`w-full h-11 pl-10 pr-4 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 border ${
                    isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={openAddProductModal}
                className="px-5 py-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add New Dish</span>
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
              }`}>
                <Utensils size={32} className="text-slate-400 mx-auto mb-3" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  No dishes found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Add your first meal item with customizable portion sizes and extra toppings.
                </p>
                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  + Add First Dish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((prod: any) => (
                  <motion.div
                    key={prod.id}
                    layout
                    className={`rounded-3xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-zinc-800">
                      <img
                        src={parseProductImages(prod.image)[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod.id, prod.isAvailable)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-extrabold shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                            prod.isAvailable
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {prod.isAvailable ? "✓ IN STOCK" : "✕ OUT OF STOCK"}
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md text-white rounded-xl font-heading font-black text-xs">
                        ₦{Number(prod.price).toLocaleString()}
                      </div>
                      {parseProductImages(prod.image).length > 1 && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-md text-amber-300 rounded-lg font-heading font-extrabold text-[10px] flex items-center gap-1">
                          <ImageIcon size={11} />
                          <span>{parseProductImages(prod.image).length} photos</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {parseProductDescription(prod.description).description || "Delicious freshly prepared meal."}
                        </p>
                        {parseProductDescription(prod.description).ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseProductDescription(prod.description).ingredients.slice(0, 3).map((ing, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium border border-indigo-100 dark:border-indigo-900/40">
                                {ing}
                              </span>
                            ))}
                            {parseProductDescription(prod.description).ingredients.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{parseProductDescription(prod.description).ingredients.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(prod)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-heading font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Edit Dish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. STUDENT REVIEWS TAB */}
        {selectedTab === "reviews" && (
          <div className="space-y-4">
            <div className={`p-6 rounded-3xl border ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                    Customer Ratings & Reviews
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verified feedback submitted by students who ordered from your kitchen.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-heading font-black text-amber-500">
                    ★ {storeData?.rating || "4.9"}
                  </span>
                  <span className="block text-[10px] text-slate-400">Overall Score</span>
                </div>
              </div>

              {(!storeData?.reviews || storeData.reviews.length === 0) ? (
                <div className="text-center py-10">
                  <Star size={36} className="text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No customer reviews published yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {storeData.reviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                          {rev.user?.name || "Campus Student"}
                        </span>
                        <span className="text-amber-500 font-bold text-xs">
                          {"★".repeat(rev.rating || 5)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {rev.comment || "Great delicious food and quick hostel delivery!"}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. STORE PROFILE & OPERATIONS SETTINGS TAB */}
        {selectedTab === "settings" && (
          <div className="max-w-3xl">
            <form onSubmit={handleSaveProfile} className={`p-6 md:p-8 rounded-3xl border space-y-6 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              {/* Header */}
              <div className="border-b pb-4 border-slate-100 dark:border-zinc-800">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Store Profile & Operational Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Update your brand visual assets, store contact information, and delivery hours.
                </p>
              </div>

              {/* 1. BRANDING VISUALS (LOGO & BANNER) */}
              <div className="space-y-4">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  1. Store Branding & Media
                </h4>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleCoverFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Store Logo */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
                    <label className="block text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                      Store Logo / Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-900 shadow-sm relative shrink-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                        {storeLogo ? (
                          <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-heading hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                        >
                          <Camera size={13} />
                          <span>{storeLogo ? "Change Logo" : "Upload Logo"}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block">PNG, JPG, WebP up to 5MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Store Cover Banner */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
                    <label className="block text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                      Store Cover Banner
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-900 shadow-sm relative shrink-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                        {storeCoverImage ? (
                          <img src={storeCoverImage} alt="Cover Banner" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-heading hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                        >
                          <Upload size={13} />
                          <span>{storeCoverImage ? "Change Banner" : "Upload Banner"}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block">Wide banner for storefront hero</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. STORE BUSINESS DETAILS */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  2. Store Business Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Store Name
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Mama Cass Campus Kitchen"
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Owner / Contact Person
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Chief Chef Adebayo"
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                    Store Bio / Description
                  </label>
                  <textarea
                    rows={3}
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    placeholder="Welcome to our kitchen! Freshly made Nigerian party jollof, proteins, drinks, and express hostel delivery."
                    className={`w-full p-3 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>
              </div>

              {/* 3. CONTACT & HOTLINES */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  3. Contact & WhatsApp Notification Number
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      WhatsApp & Order Phone
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="e.g. +2348012345678"
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Receives instant order alerts on WhatsApp</span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Registered Login Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={storeEmail || "vendor@lightson.com"}
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border opacity-70 cursor-not-allowed ${
                        isDark ? "bg-zinc-950/80 border-zinc-800 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Contact administration to change login email</span>
                  </div>
                </div>
              </div>

              {/* 4. OPERATIONS & DELIVERY SCHEDULE */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  4. Operations & Daily Kitchen Hours
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Est. Delivery Time
                    </label>
                    <input
                      type="text"
                      value={deliveryEstimate}
                      onChange={(e) => setDeliveryEstimate(e.target.value)}
                      placeholder="e.g. 15-25 mins"
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-4 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-950/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{isSavingProfile ? "Saving Profile & Settings to Database..." : "Save Store Profile & Settings"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DEDICATED EDIT STORE PROFILE MODAL (ACCESSIBLE DIRECTLY FROM HERO) */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 md:p-8 shadow-2xl space-y-6 ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="text-amber-500" size={20} />
                    Edit Store Profile & Operational Settings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your store branding, contact hotline, and delivery schedule.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* 1. BRANDING VISUALS */}
                <div className="space-y-3">
                  <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Store Branding
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-2">
                      <label className="block text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                        Store Logo
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-900 shadow-sm relative shrink-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                          {storeLogo ? (
                            <img src={storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Store size={22} className="text-slate-400" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-heading hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Camera size={13} />
                          <span>{storeLogo ? "Change" : "Upload"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Cover Banner */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-2">
                      <label className="block text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                        Cover Banner
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-14 rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-900 shadow-sm relative shrink-0 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                          {storeCoverImage ? (
                            <img src={storeCoverImage} alt="Cover Banner" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={22} className="text-slate-400" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-heading hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Upload size={13} />
                          <span>{storeCoverImage ? "Change" : "Upload"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. STORE BUSINESS DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Store Name
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Mama Cass Campus Kitchen"
                      className={`w-full h-11 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Owner / Contact Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Chef Adebayo"
                      className={`w-full h-11 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                    Store Bio / Description
                  </label>
                  <textarea
                    rows={2}
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    placeholder="Welcome to our kitchen! Freshly made campus meals and fast delivery."
                    className={`w-full p-3 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* 3. CONTACT & HOTLINES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      WhatsApp & Order Phone
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="e.g. +2348012345678"
                      className={`w-full h-11 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Receives instant order alerts on WhatsApp</span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={storeEmail || "vendor@lightson.com"}
                      className={`w-full h-11 px-4 rounded-2xl text-xs font-medium border opacity-70 cursor-not-allowed ${
                        isDark ? "bg-zinc-950/80 border-zinc-800 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    />
                  </div>
                </div>

                {/* 4. OPERATIONS & DELIVERY SCHEDULE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className={`w-full h-11 px-3 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className={`w-full h-11 px-3 rounded-2xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Est. Delivery
                    </label>
                    <input
                      type="text"
                      value={deliveryEstimate}
                      onChange={(e) => setDeliveryEstimate(e.target.value)}
                      placeholder="e.g. 15-25 mins"
                      className={`w-full h-11 px-3 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 font-heading font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-3 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>{isSavingProfile ? "Saving Profile..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 md:p-8 shadow-2xl space-y-5 ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800">
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  {editingProductId ? "Edit Dish Details" : "Add New Dish to Menu"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Base Price (₦)
                    </label>
                    <input
                      type="number"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                      Category
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option value="">Select Category (Default: Food)</option>
                      <option value="food">Food & Meals</option>
                      <option value="snacks">Snacks & Treats</option>
                      <option value="drinks">Drinks & Smoothies</option>
                      <option value="groceries">Groceries & Provisions</option>
                      <option value="pastries">Pastries & Bakery</option>
                      <option value="medical">Medical & Pharmacy</option>
                      <option value="laundry">Laundry & Dry Cleaning</option>
                      <option value="stationery">Stationery & Books</option>
                      <option value="care">Personal Care</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="wears">Fashion & Wears</option>
                      <option value="jewelries">Jewelries & Accessories</option>
                      <option value="gadgets">Tech & Gadgets</option>
                      <option value="electronics">Electronics & Appliances</option>
                    </select>
                  </div>
                </div>

                {/* MULTIPLE DISH PHOTOS MANAGER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase text-slate-500 font-heading">
                      Dish Photos ({productImages.length})
                    </label>
                    <span className="text-[11px] text-slate-400">Upload multiple photos from device</span>
                  </div>

                  <input
                    type="file"
                    multiple
                    ref={productFileInputRef}
                    onChange={handleProductFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* UPLOAD TRIGGER BUTTON */}
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-heading flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                  >
                    <Camera size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{productImages.length === 0 ? "Click to Upload Dish Photos (Multiple Allowed)" : "+ Add More Photos"}</span>
                  </button>

                  {/* PHOTOS PREVIEW & DELETION GRID */}
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                      {productImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 group shadow-xs bg-slate-100 dark:bg-zinc-800"
                        >
                          <img
                            src={img}
                            alt={`Dish photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* COVER BADGE ON 1ST PHOTO */}
                          {idx === 0 && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#312E81] text-white font-heading font-extrabold text-[9px] shadow-sm">
                              Cover
                            </div>
                          )}

                          {/* DELETE PHOTO BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                            title="Delete this photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DISH DESCRIPTION */}
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5 font-heading">
                    Dish Description
                  </label>
                  <textarea
                    rows={2}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Describe taste, serving size, and special preparation details..."
                    className={`w-full p-3 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* KEY INGREDIENTS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-extrabold uppercase text-slate-500 font-heading">
                      Key Ingredients
                    </label>
                    <span className="text-[11px] text-slate-400">Comma separated</span>
                  </div>
                  <input
                    type="text"
                    value={productIngredients}
                    onChange={(e) => setProductIngredients(e.target.value)}
                    placeholder="e.g. Long grain rice, Fresh tomatoes, Bell peppers, Fried plantains, Grilled chicken"
                    className={`w-full h-11 px-3.5 rounded-2xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* PORTION SIZES BUILDER */}
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                      Portion Sizes (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={addVariationRow}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={13} /> + Add Portion
                    </button>
                  </div>
                  {variations.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const copy = [...variations];
                          copy[i].name = e.target.value;
                          setVariations(copy);
                        }}
                        placeholder="e.g. Large / Jumbo Pack"
                        className="flex-1 h-9 px-3 text-xs rounded-xl border bg-white dark:bg-zinc-950"
                      />
                      <input
                        type="number"
                        value={v.price || ""}
                        onChange={(e) => {
                          const copy = [...variations];
                          copy[i].price = parseFloat(e.target.value) || 0;
                          setVariations(copy);
                        }}
                        placeholder="+₦ Extra"
                        className="w-24 h-9 px-3 text-xs rounded-xl border bg-white dark:bg-zinc-950"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariationRow(i)}
                        className="text-rose-500 p-1 cursor-pointer"
                      >
                        <MinusCircle size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ADD-ONS BUILDER */}
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-heading text-slate-700 dark:text-zinc-300">
                      Custom Add-Ons & Extras (Optional)
                    </span>
                    <button
                      type="button"
                      onClick={addAddOnRow}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={13} /> + Add Extra
                    </button>
                  </div>
                  {addOns.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={a.name}
                        onChange={(e) => {
                          const copy = [...addOns];
                          copy[i].name = e.target.value;
                          setAddOns(copy);
                        }}
                        placeholder="e.g. Extra Fried Plantain / Egg"
                        className="flex-1 h-9 px-3 text-xs rounded-xl border bg-white dark:bg-zinc-950"
                      />
                      <input
                        type="number"
                        value={a.price || ""}
                        onChange={(e) => {
                          const copy = [...addOns];
                          copy[i].price = parseFloat(e.target.value) || 0;
                          setAddOns(copy);
                        }}
                        placeholder="₦ Price"
                        className="w-24 h-9 px-3 text-xs rounded-xl border bg-white dark:bg-zinc-950"
                      />
                      <button
                        type="button"
                        onClick={() => removeAddOnRow(i)}
                        className="text-rose-500 p-1 cursor-pointer"
                      >
                        <MinusCircle size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 font-heading font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="flex-1 py-3 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submittingProduct ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>{editingProductId ? "Update Dish" : "Publish Dish"}</span>
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
