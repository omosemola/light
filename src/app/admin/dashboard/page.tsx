"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  ShieldCheck, 
  Store, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  X,
  UserCheck,
  LogOut,
  Utensils,
  Package,
  Clock,
  Sparkles,
  TrendingUp,
  Tag,
  Phone,
  Layers,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUserStore } from "@/lib/userStore";
import { 
  getAdminDashboardData, 
  updateSupportTicketStatus, 
  updateUserRole, 
  deleteUserAccount, 
  checkAdminSession, 
  logoutAdmin,
  updateOrderStatusAdmin,
  toggleProductAvailabilityAdmin,
  verifyStoreAdmin,
  toggleStoreStatusAdmin,
  deleteStoreAdmin
} from "@/actions/admin";
import { toggleStoreOpenStatus } from "@/actions/vendor";
import { TicketStatus, Role } from "@prisma/client";
import { getSafeImageUrl } from "@/lib/productOptions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, updateProfile, logoutUser } = useUserStore();
  const { isDark, setTheme } = useTheme();
  const INITIAL_ADMIN_DATA = {
    success: true,
    metrics: {
      totalUsers: 0,
      totalVendors: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalGMV: 0,
      openTicketsCount: 0,
    },
    stores: [],
    users: [],
    recentOrders: [],
    tickets: [],
    products: [],
    categories: [],
  };

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState<any>(INITIAL_ADMIN_DATA);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "stores" | "users" | "tickets">("products");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [ticketUpdating, setTicketUpdating] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [orderUpdating, setOrderUpdating] = useState<string | null>(null);
  const [productUpdating, setProductUpdating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, durationMs = 1000) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, durationMs);
  };

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Delete Store State
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [isDeletingStore, setIsDeletingStore] = useState(false);

  const hasStartedRef = useRef(false);

  const fetchAdminData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAdminDashboardData();
      if (res && res.success) {
        setAdminData(res);
        try {
          if (res.stores?.length > 0 || res.products?.length > 0) {
            sessionStorage.setItem("cached_admin_data", JSON.stringify(res));
          }
        } catch {}
        if (isManual) showToast("Live operations data refreshed!");
      } else {
        showToast(res?.error || "Failed to load dashboard metrics");
      }
    } catch (e: any) {
      console.error("Failed to load admin data:", e);
      showToast("Network error connecting to database.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Fast initial cache hydration
    try {
      const cached = sessionStorage.getItem("cached_admin_data");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.stores?.length > 0 || parsed?.products?.length > 0) {
          setAdminData(parsed);
        }
      }
    } catch {}

    async function verifyAndLoadAdmin() {
      try {
        const hasAdminFlag = typeof window !== "undefined" && sessionStorage.getItem("lightson_admin_auth") === "true";
        const isClientAdmin = profile.role === "ADMIN" || profile.email?.toLowerCase() === "admin@campuslightson.com";

        if (hasAdminFlag || isClientAdmin) {
          await fetchAdminData();
          return;
        }

        // Check server session cookie
        const session = await checkAdminSession();
        if (session && session.isAuthenticated && session.user) {
          updateProfile({
            email: session.user.email,
            name: session.user.name,
            role: "ADMIN",
            isVisitor: false,
          });
          if (typeof window !== "undefined") {
            sessionStorage.setItem("lightson_admin_auth", "true");
          }
          await fetchAdminData();
          return;
        }

        // Not authenticated -> Redirect to login
        window.location.href = "/admin/login";
      } catch (err) {
        console.error("Admin verification error:", err);
        await fetchAdminData();
      }
    }

    verifyAndLoadAdmin();
  }, []);

  const handleSignOutAdmin = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lightson_admin_auth");
    }
    await logoutAdmin();
    logoutUser();
    window.location.href = "/admin/login";
  };


  const handleToggleProductAvailability = async (productId: string, currentIsAvailable: boolean) => {
    const nextAvailable = !currentIsAvailable;
    setProductUpdating(productId);
    setAdminData((prev: any) => ({
      ...prev,
      products: prev.products?.map((p: any) =>
        p.id === productId ? { ...p, isAvailable: nextAvailable } : p
      ),
    }));
    const res = await toggleProductAvailabilityAdmin(productId, nextAvailable);
    if (res.success) {
      showToast(`Product is now ${nextAvailable ? "In Stock (Active)" : "Out of Stock"}`);
    } else {
      showToast(res.error || "Failed to update product availability");
    }
    setProductUpdating(null);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setOrderUpdating(orderId);
    const res = await updateOrderStatusAdmin(orderId, status);
    if (res.success) {
      setAdminData((prev: any) => ({
        ...prev,
        recentOrders: prev.recentOrders?.map((o: any) =>
          o.id === orderId ? { ...o, status } : o
        ),
      }));
      showToast(`Order status updated to ${status}`);
    } else {
      showToast(res.error || "Failed to update order");
    }
    setOrderUpdating(null);
  };

  const handleResolveTicket = async (ticketId: string, status: TicketStatus) => {
    setTicketUpdating(ticketId);
    const res = await updateSupportTicketStatus(ticketId, status);
    if (res.success) {
      setAdminData((prev: any) => ({
        ...prev,
        tickets: prev.tickets.map((t: any) =>
          t.id === ticketId ? { ...t, status } : t
        ),
      }));
      showToast(`Ticket updated to ${status}`);
    }
    setTicketUpdating(null);
  };

  const handleVerifyStore = async (storeId: string, isVerified: boolean) => {
    const res = await verifyStoreAdmin(storeId, isVerified);
    if (res.success) {
      setAdminData((prev: any) => {
        const updatedStores = prev.stores?.map((s: any) =>
          s.id === storeId ? { ...s, isVerified, isOpen: isVerified } : s
        );
        const updated = {
          ...prev,
          stores: updatedStores,
        };
        try {
          sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      showToast(isVerified ? "Store verified & approved live! 🎉" : "Store verification revoked.");
    } else {
      showToast(res.error || "Failed to update store verification");
    }
  };

  const handleToggleStoreStatus = async (storeId: string, currentIsOpen: boolean) => {
    const newStatus = !currentIsOpen;
    const res = await toggleStoreStatusAdmin(storeId, newStatus);
    if (res.success) {
      setAdminData((prev: any) => {
        const updatedStores = prev.stores?.map((s: any) =>
          s.id === storeId ? { ...s, isOpen: newStatus } : s
        );
        const updated = {
          ...prev,
          stores: updatedStores,
        };
        try {
          sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      showToast(`Store is now ${newStatus ? "ACTIVE & LIVE" : "PAUSED / SUSPENDED"}`);
    } else {
      showToast(res.error || "Failed to toggle store status");
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    setRoleUpdating(userId);
    const res = await updateUserRole(userId, role);
    if (res.success) {
      setAdminData((prev: any) => ({
        ...prev,
        users: prev.users.map((u: any) =>
          u.id === userId ? { ...u, role } : u
        ),
      }));
      showToast(`User role updated to ${role}`);
    }
    setRoleUpdating(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserAccount(userToDelete.id);
      if (res.success) {
        setAdminData((prev: any) => {
          const updatedUsers = (prev.users || []).filter(
            (u: any) => u.id !== userToDelete.id && u.email !== userToDelete.email
          );
          const updated = {
            ...prev,
            users: updatedUsers,
            metrics: {
              ...prev.metrics,
              totalUsers: Math.max(0, updatedUsers.length),
            },
          };
          try {
            sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        showToast(`User "${userToDelete.name || userToDelete.email}" deleted successfully`);
        setUserToDelete(null);
      } else {
        showToast(`Error deleting user: ${res.error}`);
      }
    } catch {
      showToast("Failed to delete user account.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleConfirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeletingStore(true);
    try {
      const res = await deleteStoreAdmin(storeToDelete.id);
      if (res.success) {
        setAdminData((prev: any) => {
          const updatedStores = (prev.stores || []).filter(
            (s: any) => s.id !== storeToDelete.id
          );
          const updatedProducts = (prev.products || []).filter(
            (p: any) => p.store?.id !== storeToDelete.id && p.storeId !== storeToDelete.id
          );
          const updated = {
            ...prev,
            stores: updatedStores,
            products: updatedProducts,
            metrics: {
              ...prev.metrics,
              totalStores: Math.max(0, updatedStores.length),
              totalProducts: Math.max(0, updatedProducts.length),
            },
          };
          try {
            sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        showToast(`Store "${storeToDelete.name}" and catalog deleted successfully.`);
        setStoreToDelete(null);
      } else {
        showToast(`Error deleting store: ${res.error}`);
      }
    } catch {
      showToast("Failed to delete store from database.");
    } finally {
      setIsDeletingStore(false);
    }
  };

  const getStorePreviewUrl = (storeId: string) => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("admin.")) {
        const mainHost = host.replace("admin.", "");
        return `${window.location.protocol}//${mainHost}/vendor/${storeId}`;
      }
    }
    return `/vendor/${storeId}`;
  };

  // Filtered queries
  const filteredProducts = useMemo(() => {
    const list = adminData?.products || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((p: any) => 
      p.name?.toLowerCase().includes(q) || 
      p.store?.name?.toLowerCase().includes(q)
    );
  }, [adminData?.products, searchQuery]);

  const filteredOrders = useMemo(() => {
    const list = adminData?.recentOrders || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((o: any) => 
      o.id?.toLowerCase().includes(q) || 
      o.user?.name?.toLowerCase().includes(q) || 
      o.user?.email?.toLowerCase().includes(q) ||
      o.store?.name?.toLowerCase().includes(q)
    );
  }, [adminData?.recentOrders, searchQuery]);

  const studentUsersList = useMemo(() => {
    const list = adminData?.users || [];
    return list.filter((u: any) => u.role !== "VENDOR" && !u.store);
  }, [adminData?.users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return studentUsersList;
    const q = searchQuery.toLowerCase();
    return studentUsersList.filter((u: any) => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) ||
      u.hostel?.toLowerCase().includes(q)
    );
  }, [studentUsersList, searchQuery]);

  const filteredStores = useMemo(() => {
    const list = adminData?.stores || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s: any) => 
      s.name?.toLowerCase().includes(q) || 
      s.user?.name?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.user?.phone?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  }, [adminData?.stores, searchQuery]);

  const filteredTickets = useMemo(() => {
    const list = adminData?.tickets || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t: any) => 
      t.subject?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q)
    );
  }, [adminData?.tickets, searchQuery]);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-[#09090B] text-zinc-100" : "bg-[#FAFAF7] text-zinc-900"}`}>
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-heading">Loading Platform Admin Command Center...</h2>
        <p className={`text-sm mt-1 font-body ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Synchronizing with Supabase Database & Live Marketplace</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-[#09090B] text-white" : "bg-[#FAFAF7] text-slate-900"}`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-extrabold font-heading">Admin Dashboard Connection Error</h2>
        <p className={`text-xs mt-1.5 font-body max-w-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
          {toastMessage || "Unable to retrieve real-time operations metrics from the database."}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => fetchAdminData(true)}
            className="px-5 py-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
          <button
            onClick={handleSignOutAdmin}
            className={`px-5 py-2.5 rounded-xl font-heading font-bold text-xs border transition-all active:scale-95 cursor-pointer ${
              isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const metrics = adminData?.metrics || {};

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-24 font-body ${
      isDark ? "bg-[#09090B] text-zinc-100" : "bg-[#FAFAF7] text-zinc-900"
    }`}>
      {/* TOAST NOTIFICATION (AUTO-DISMISSING & CLOSABLE) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white font-heading font-extrabold text-xs md:text-sm px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-indigo-400 max-w-lg w-11/12 justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 text-left truncate">
              <CheckCircle2 size={18} className="text-amber-300 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
              aria-label="Dismiss Alert"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYNCHRONIZED BRAND HERO HEADER */}
      <div className="relative bg-[#1E1B4B] text-white overflow-hidden shadow-lg border-b border-indigo-950">
        <Image
          src="/support-banner.jpg"
          alt="Admin Banner Pattern"
          fill
          priority
          className="object-cover object-center pointer-events-none opacity-40"
        />
        <div className="absolute inset-0 bg-[#1E1B4B]/90 dark:bg-[#09090B]/95" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black border-2 border-amber-300">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-heading font-black tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                    ⚡ Super Administrator
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live DB Synced
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-black text-white tracking-tight mt-1">
                  Lights<span className="text-[#FBBF24]">on</span> Command Center
                </h1>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Platform Operations, Catalog Moderation, Live Orders & Student Support
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS & LINKS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
              <Link
                href="/welcome"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Back to Marketplace Onboarding"
              >
                <ArrowLeft size={14} className="text-amber-300" />
                <span>Marketplace</span>
              </Link>

              <button
                onClick={() => fetchAdminData(true)}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Refresh Live Operations Data"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button
                onClick={handleSignOutAdmin}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 font-heading font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* CLICKABLE METRICS OVERVIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <motion.div 
            onClick={() => setActiveTab("orders")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-emerald-500" 
                : "bg-white border-slate-200 hover:border-emerald-500 shadow-sm"
            }`}
          >
            <DollarSign className="w-5 h-5 text-emerald-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Gross Volume (GMV)</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>₦{Number(metrics?.totalGMV || 0).toLocaleString()}</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("products")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-indigo-500" 
                : "bg-white border-slate-200 hover:border-indigo-500 shadow-sm"
            }`}
          >
            <Utensils className="w-5 h-5 text-indigo-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Product Count</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{adminData?.products?.length || metrics?.totalProducts || 2} Products</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("stores")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-blue-500" 
                : "bg-white border-slate-200 hover:border-blue-500 shadow-sm"
            }`}
          >
            <Store className="w-5 h-5 text-blue-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Active Stores</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{adminData?.stores?.length || metrics?.totalStores || 1} Vendor</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("users")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-purple-500" 
                : "bg-white border-slate-200 hover:border-purple-500 shadow-sm"
            }`}
          >
            <Users className="w-5 h-5 text-purple-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Campus Students</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{studentUsersList.length} Students</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("tickets")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-amber-500" 
                : "bg-white border-slate-200 hover:border-amber-500 shadow-sm"
            }`}
          >
            <HelpCircle className="w-5 h-5 text-amber-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Support Desk</span>
            <h3 className="text-lg font-extrabold text-amber-500 mt-0.5 font-heading">{metrics?.openTicketsCount || 0} Open</h3>
          </motion.div>
        </div>

        {/* TABS & SEARCH BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "products" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🍲 Products ({adminData?.products?.length || metrics?.totalProducts || 2})
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "orders" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              📦 Live Orders ({adminData?.recentOrders?.length || 0})
            </button>
            <button
              onClick={() => { setActiveTab("stores"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "stores" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🏪 Vendor Stores ({adminData?.stores?.length || 1})
            </button>
            <button
              onClick={() => { setActiveTab("tickets"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "tickets" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🎫 Support Tickets ({adminData?.tickets?.length || 0})
            </button>
            <button
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "users" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              👥 Students ({studentUsersList.length})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records in tab..."
              className={`w-full h-10 pl-9 pr-4 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" : "bg-white border-slate-200 text-zinc-900 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                  isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Vendor Store</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Live Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                  {filteredProducts?.map((prod: any) => (
                    <tr key={prod.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-zinc-800 overflow-hidden relative border border-slate-200 dark:border-zinc-700 shrink-0">
                            {prod.image ? (() => {
                              const safeProdImg = getSafeImageUrl(prod.image);
                              return (
                                <Image
                                  src={safeProdImg}
                                  alt={prod.name}
                                  fill
                                  unoptimized={safeProdImg.startsWith("data:")}
                                  className="object-cover"
                                />
                              );
                            })() : (
                              <Utensils size={18} className="m-auto text-indigo-500" />
                            )}
                          </div>
                          <div>
                            <div className={`font-bold font-heading text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>{prod.name}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">ID: {prod.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`p-4 font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {prod.store?.name || "Campus Store"}
                      </td>
                      <td className={`p-4 font-extrabold font-heading text-sm ${isDark ? "text-amber-400" : "text-[#312E81]"}`}>
                        ₦{prod.price?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          disabled={productUpdating === prod.id}
                          onClick={() => handleToggleProductAvailability(prod.id, prod.isAvailable !== false)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold font-heading cursor-pointer transition-all active:scale-95 border ${
                            prod.isAvailable !== false
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                              : "bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900"
                          }`}
                        >
                          {prod.isAvailable !== false ? "✓ IN STOCK" : "✕ OUT OF STOCK"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/product/${prod.slug || prod.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-zinc-800 hover:bg-indigo-100 text-[#312E81] dark:text-indigo-300 font-bold text-xs rounded-lg transition-colors"
                        >
                          <span>View on Site</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                  isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Order Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord: any) => (
                      <tr key={ord.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                        <td className={`p-4 font-mono font-bold ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
                          {ord.id ? `#${ord.id.slice(-6).toUpperCase()}` : "#ORDER"}
                        </td>
                        <td className="p-4">
                          <div className={`font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>{ord.user?.name || "Campus Student"}</div>
                          <div className="text-[11px] text-zinc-400">{ord.user?.email || "No email"}</div>
                          {ord.user?.phone && <div className="text-[11px] text-zinc-500">{ord.user.phone}</div>}
                        </td>
                        <td className={`p-4 font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{ord.store?.name || "Campus Store"}</td>
                        <td className={`p-4 font-extrabold font-heading text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>₦{ord.totalAmount?.toLocaleString()}</td>
                        <td className="p-4">
                          {(() => {
                            const getBadge = (status: string) => {
                              switch (status) {
                                case "PENDING":
                                  return { label: "Order Placed", color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
                                case "ACCEPTED":
                                case "PREPARING":
                                  return { label: "Store Preparing", color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
                                case "READY_FOR_DELIVERY":
                                case "OUT_FOR_DELIVERY":
                                  return { label: "Out for Delivery", color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" };
                                case "DELIVERED":
                                  return { label: "Delivered", color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
                                case "CANCELLED":
                                  return { label: "Cancelled", color: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" };
                                default:
                                  return { label: status || "Received", color: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" };
                              }
                            };
                            const badge = getBadge(ord.status);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-extrabold border ${badge.color}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                                <span>{badge.label}</span>
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400">
                        No orders recorded in database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STORES TAB */}
        {activeTab === "stores" && (
          <div className="space-y-4">
            {/* STORES METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-slate-400">Total Stores</span>
                <div className="text-xl font-heading font-black mt-1">{adminData?.stores?.length || 0}</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-emerald-400">Verified & Active</span>
                <div className="text-xl font-heading font-black text-emerald-500 mt-1">
                  {adminData?.stores?.filter((s: any) => s.isVerified).length || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-amber-400">Pending Review</span>
                <div className="text-xl font-heading font-black text-amber-500 mt-1">
                  {adminData?.stores?.filter((s: any) => !s.isVerified).length || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-indigo-400">Open Stores</span>
                <div className="text-xl font-heading font-black text-indigo-500 mt-1">
                  {adminData?.stores?.filter((s: any) => s.isOpen !== false).length || 0}
                </div>
              </div>
            </div>

            {/* STORES TABLE */}
            <div className={`border rounded-2xl overflow-hidden shadow-sm ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                    isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                  }`}>
                    <tr>
                      <th className="p-4">Store & Owner</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Products & Orders</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Store Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                    {filteredStores.length > 0 ? (
                      filteredStores.map((st: any) => (
                        <tr key={st.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                          {/* Store Name & ID */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-base shrink-0 border border-indigo-500/30">
                                {st.name ? st.name[0]?.toUpperCase() : "S"}
                              </div>
                              <div>
                                <div className={`font-heading font-bold text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>
                                  {st.name || "Campus Store"}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  Owner: <strong className={isDark ? "text-zinc-200" : "text-zinc-700"}>{st.user?.name || "Merchant"}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="p-4">
                            <div className={`font-mono text-[11px] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                              {st.user?.email ? (
                                <a href={`mailto:${st.user.email}`} className="hover:underline text-indigo-400 flex items-center gap-1">
                                  {st.user.email}
                                </a>
                              ) : (
                                "No email"
                              )}
                            </div>
                            {st.user?.phone && (
                              <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                                <Phone size={10} />
                                <a href={`tel:${st.user.phone}`} className="hover:underline">
                                  {st.user.phone}
                                </a>
                              </div>
                            )}
                          </td>

                          {/* Products & Orders */}
                          <td className="p-4">
                            <div className={`font-bold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                              {st._count?.products || 0} products
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {st._count?.orders || 0} orders completed
                            </div>
                          </td>

                          {/* Verification Badge */}
                          <td className="p-4">
                            {st.isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                                <CheckCircle2 size={11} className="text-emerald-400" />
                                VERIFIED & APPROVED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80 animate-pulse">
                                <Clock size={11} className="text-amber-400" />
                                PENDING VERIFICATION
                              </span>
                            )}
                          </td>

                          {/* Live Store Toggle */}
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStoreStatus(st.id, st.isOpen !== false)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-heading cursor-pointer transition-all active:scale-95 border ${
                                st.isOpen !== false
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                                  : "bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900"
                              }`}
                              title="Click to toggle live store status"
                            >
                              {st.isOpen !== false ? "✓ ACTIVE & OPEN" : "✕ CLOSED / PAUSED"}
                            </button>
                          </td>

                          {/* Actions: Approve / Revoke, Preview, Delete */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!st.isVerified ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyStore(st.id, true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                                  title="Approve and verify vendor store"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Approve & Verify</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyStore(st.id, false)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-950 hover:border-amber-800 border border-zinc-700 text-zinc-400 hover:text-amber-300 font-heading font-bold text-[10px] transition-all cursor-pointer"
                                  title="Revoke verification status"
                                >
                                  Revoke
                                </button>
                              )}

                              <a
                                href={getStorePreviewUrl(st.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-zinc-800 hover:bg-indigo-100 text-[#312E81] dark:text-indigo-300 font-bold text-xs rounded-lg transition-colors"
                                title="Preview public storefront"
                              >
                                <span>Preview</span>
                                <ExternalLink size={12} />
                              </a>

                              <button
                                type="button"
                                onClick={() => setStoreToDelete(st)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 transition-all active:scale-95 cursor-pointer"
                                title={`Delete store ${st.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-400">
                          No stores matching your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === "tickets" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                  isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Subject & Details</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Resolution</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                  {filteredTickets?.length > 0 ? (
                    filteredTickets.map((t: any) => (
                      <tr key={t.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                        <td className={`p-4 font-mono font-bold ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
                          {t.id ? `#${t.id.slice(-6).toUpperCase()}` : "#TICKET"}
                        </td>
                        <td className="p-4">
                          <div className={`font-bold font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{t.subject}</div>
                          <div className={`text-[11px] truncate max-w-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{t.description}</div>
                        </td>
                        <td className={`p-4 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{t.user?.email || "Student"}</td>
                        <td className={`p-4 font-mono ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{t.orderId ? `#${t.orderId.slice(-6).toUpperCase()}` : "General"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            t.status === "RESOLVED" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={t.status}
                            disabled={ticketUpdating === t.id}
                            onChange={(e) => handleResolveTicket(t.id, e.target.value as TicketStatus)}
                            className={`text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border font-bold ${
                              isDark ? "bg-zinc-950 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-zinc-800"
                            }`}
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        No support tickets opened by students yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB - CAMPUS STUDENTS ONLY */}
        {activeTab === "users" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                  isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Hostel / Location</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Orders Placed</th>
                    <th className="p-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                  {filteredUsers?.length > 0 ? (
                    filteredUsers.map((u: any) => (
                      <tr key={u.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                        <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-zinc-900"}`}>
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center border border-indigo-500/30 overflow-hidden relative shrink-0">
                            {u.image ? (
                              <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.name ? u.name[0]?.toUpperCase() : "S"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-heading font-extrabold">{u.name || "Campus Student"}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">ID: {u.id?.slice(-6).toUpperCase()}</div>
                          </div>
                        </td>
                        <td className={`p-4 font-mono ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>{u.email}</td>
                        <td className={`p-4 font-medium ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                          {u.hostel && u.hostel.trim() ? (
                            <span className="inline-block bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                              📍 {u.hostel}
                            </span>
                          ) : (
                            <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>Campus Resident</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {u.role || "STUDENT"}
                          </span>
                        </td>
                        <td className={`p-4 font-extrabold font-heading text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>
                          {u._count?.orders || 0}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={u.role}
                              disabled={roleUpdating === u.id}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                              className={`text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border font-medium ${
                                isDark ? "bg-zinc-950 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-zinc-800"
                              }`}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="VENDOR">VENDOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 transition-all active:scale-95 cursor-pointer"
                              title={`Delete user account ${u.email}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        No student users registered in database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* DELETE USER CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg">Delete User Account?</h3>
                  <p className="text-xs text-rose-400">Irreversible database action</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                Are you sure you want to delete user <strong className={isDark ? "text-white" : "text-zinc-900"}>"{userToDelete.name || userToDelete.email}"</strong>? 
                This will permanently purge their profile, linked orders, and support records from the Supabase database.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleConfirmDeleteUser}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>{isDeletingUser ? "Deleting from DB..." : "Yes, Delete User"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className={`px-5 h-11 rounded-xl text-xs font-heading font-bold active:scale-95 transition-all ${
                    isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE STORE CONFIRMATION MODAL */}
      <AnimatePresence>
        {storeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg">Delete Store & Catalog?</h3>
                  <p className="text-xs text-rose-400">Irreversible marketplace action</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                Are you sure you want to permanently delete store <strong className={isDark ? "text-white" : "text-zinc-900"}>"{storeToDelete.name}"</strong>? 
                This will delete all its products, catalog items, reviews, and linked chat history from the live database.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingStore}
                  onClick={handleConfirmDeleteStore}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>{isDeletingStore ? "Deleting Store..." : "Yes, Delete Store"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreToDelete(null)}
                  className={`px-5 h-11 rounded-xl text-xs font-heading font-bold active:scale-95 transition-all cursor-pointer ${
                    isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
