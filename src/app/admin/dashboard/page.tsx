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
  TrendingUp,
  Tag,
  Phone,
  Layers,
  ArrowLeft,
  Eye,
  MapPin,
  Receipt
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
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
  deleteStoreAdmin,
  deleteOrderAdmin,
  deleteAllOrdersAdmin
} from "@/actions/admin";
import { toggleStoreOpenStatus } from "@/actions/vendor";
import { TicketStatus, Role } from "@prisma/client";
import { getSafeImageUrl } from "@/lib/productOptions";

export default function AdminDashboardPage() {
  const router = useRouter();
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

  // Orders Management State
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [showDeleteAllOrdersModal, setShowDeleteAllOrdersModal] = useState(false);
  const [isDeletingAllOrders, setIsDeletingAllOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");

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

        if (hasAdminFlag) {
          await fetchAdminData();
          return;
        }

        // Check server session cookie
        const session = await checkAdminSession();
        if (session && session.isAuthenticated && session.user) {
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

    // Periodic synchronization to keep GMV, live orders, stores, and tickets synced with vendor portal in real-time
    const syncInterval = setInterval(() => {
      fetchAdminData(false);
    }, 15000);

    const handleFocus = () => {
      fetchAdminData(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSignOutAdmin = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lightson_admin_auth");
      sessionStorage.removeItem("cached_admin_data");
    }
    await logoutAdmin();
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
      setAdminData((prev: any) => {
        const updatedOrders = prev.recentOrders?.map((o: any) =>
          o.id === orderId ? { ...o, status } : o
        );
        const newTotalGMV = updatedOrders
          ?.filter((o: any) => o.status !== "CANCELLED")
          .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
        const updated = {
          ...prev,
          recentOrders: updatedOrders,
          metrics: {
            ...prev.metrics,
            totalGMV: newTotalGMV ?? prev.metrics?.totalGMV,
          },
        };
        try {
          sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setSelectedOrderDetails((prev: any) =>
        prev && prev.id === orderId ? { ...prev, status } : prev
      );
      showToast(`Order status updated to ${status}`);
    } else {
      showToast(res.error || "Failed to update order");
    }
    setOrderUpdating(null);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      const res = await deleteOrderAdmin(orderToDelete.id);
      if (res.success) {
        setAdminData((prev: any) => {
          const updatedOrders = (prev.recentOrders || []).filter(
            (o: any) => o.id !== orderToDelete.id
          );
          const newTotalGMV = updatedOrders
            .filter((o: any) => o.status !== "CANCELLED")
            .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
          const updated = {
            ...prev,
            recentOrders: updatedOrders,
            metrics: {
              ...prev.metrics,
              totalOrders: Math.max(0, (prev.metrics?.totalOrders || 1) - 1),
              totalGMV: newTotalGMV,
            },
          };
          try {
            sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        showToast(`Order #${orderToDelete.id.slice(-6).toUpperCase()} deleted from database.`);
        setSelectedOrderDetails((prev: any) => (prev?.id === orderToDelete.id ? null : prev));
        setOrderToDelete(null);
      } else {
        showToast(res.error || "Failed to delete order");
      }
    } catch {
      showToast("Failed to delete order from database.");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const handleConfirmDeleteAllOrders = async () => {
    setIsDeletingAllOrders(true);
    try {
      const res = await deleteAllOrdersAdmin();
      if (res.success) {
        setAdminData((prev: any) => {
          const updated = {
            ...prev,
            recentOrders: [],
            metrics: {
              ...prev.metrics,
              totalOrders: 0,
              totalGMV: 0,
            },
          };
          try {
            sessionStorage.setItem("cached_admin_data", JSON.stringify(updated));
          } catch {}
          return updated;
        });
        showToast("All orders have been permanently cleared from database!");
        setSelectedOrderDetails(null);
        setShowDeleteAllOrdersModal(false);
      } else {
        showToast(res.error || "Failed to delete all orders");
      }
    } catch {
      showToast("Failed to delete all orders from database.");
    } finally {
      setIsDeletingAllOrders(false);
    }
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
    let list = adminData?.recentOrders || [];
    if (orderStatusFilter !== "ALL") {
      list = list.filter((o: any) => {
        if (orderStatusFilter === "IN_PROGRESS") {
          return (
            o.status === "ACCEPTED" ||
            o.status === "PREPARING" ||
            o.status === "READY_FOR_DELIVERY" ||
            o.status === "OUT_FOR_DELIVERY"
          );
        }
        return o.status === orderStatusFilter;
      });
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((o: any) => 
      o.id?.toLowerCase().includes(q) || 
      o.user?.name?.toLowerCase().includes(q) || 
      o.user?.email?.toLowerCase().includes(q) ||
      o.user?.phone?.toLowerCase().includes(q) ||
      o.store?.name?.toLowerCase().includes(q) ||
      o.deliveryLocation?.toLowerCase().includes(q) ||
      o.paymentReference?.toLowerCase().includes(q) ||
      o.items?.some((it: any) => it.product?.name?.toLowerCase().includes(q))
    );
  }, [adminData?.recentOrders, searchQuery, orderStatusFilter]);

  const studentUsersList = useMemo(() => {
    const list = adminData?.users || [];
    return list.filter((u: any) => 
      u.role !== "ADMIN" && 
      u.role !== "VENDOR" && 
      !u.store &&
      u.email?.toLowerCase() !== "lightmarketplace01@gmail.com" &&
      u.email?.toLowerCase() !== "admin@campuslightson.com" &&
      u.name !== "Platform Super Admin"
    );
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
          <div className="space-y-4">
            {/* ORDERS CONTROL BAR & SUMMARY CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-slate-400">Total Live Orders</span>
                <div className="text-xl font-heading font-black mt-1">
                  {adminData?.recentOrders?.length || adminData?.metrics?.totalOrders || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-amber-400">Active / In Progress</span>
                <div className="text-xl font-heading font-black text-amber-500 mt-1">
                  {adminData?.recentOrders?.filter((o: any) => 
                    o.status === "PENDING" || o.status === "ACCEPTED" || o.status === "PREPARING" || o.status === "OUT_FOR_DELIVERY" || o.status === "READY_FOR_DELIVERY"
                  ).length || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-emerald-400">Delivered</span>
                <div className="text-xl font-heading font-black text-emerald-500 mt-1">
                  {adminData?.recentOrders?.filter((o: any) => o.status === "DELIVERED").length || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-indigo-400">Platform GMV</span>
                <div className="text-xl font-heading font-black text-indigo-500 mt-1">
                  ₦{Number(adminData?.metrics?.totalGMV || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* ACTION TOOLBAR: FILTERS + DELETE ALL BUTTON */}
            <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              {/* STATUS FILTER PILLS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { key: "ALL", label: `All (${adminData?.recentOrders?.length || 0})` },
                  { key: "PENDING", label: `Pending (${adminData?.recentOrders?.filter((o: any) => o.status === "PENDING").length || 0})` },
                  { key: "IN_PROGRESS", label: `In Progress (${adminData?.recentOrders?.filter((o: any) => ["ACCEPTED", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"].includes(o.status)).length || 0})` },
                  { key: "DELIVERED", label: `Delivered (${adminData?.recentOrders?.filter((o: any) => o.status === "DELIVERED").length || 0})` },
                  { key: "CANCELLED", label: `Cancelled (${adminData?.recentOrders?.filter((o: any) => o.status === "CANCELLED").length || 0})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setOrderStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition cursor-pointer ${
                      orderStatusFilter === f.key
                        ? "bg-[#312E81] text-white shadow-xs"
                        : isDark
                          ? "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* ACTION BUTTONS: REFRESH + PURGE ALL */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchAdminData(true)}
                  disabled={refreshing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                  title="Synchronize live orders with Supabase DB"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin text-indigo-400" : ""} />
                  <span>Sync Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteAllOrdersModal(true)}
                  disabled={!adminData?.recentOrders || adminData.recentOrders.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-heading font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Permanently delete all orders from the database"
                >
                  <Trash2 size={13} />
                  <span>Delete All Orders</span>
                </button>
              </div>
            </div>

            {/* ORDERS TABLE */}
            <div className={`border rounded-2xl overflow-hidden shadow-xs ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase tracking-wider font-extrabold font-heading ${
                    isDark ? "bg-zinc-950 text-zinc-400" : "bg-slate-100 text-slate-600"
                  }`}>
                    <tr>
                      <th className="p-4">Order Ref & Date</th>
                      <th className="p-4">Customer & Location</th>
                      <th className="p-4">Vendor Store</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4">Amount & Payment</th>
                      <th className="p-4">Order Lifecycle Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((ord: any) => {
                        const itemsSummary = ord.items && ord.items.length > 0
                          ? ord.items.map((it: any) => `${it.quantity}x ${it.product?.name || "Campus Item"}`).join(", ")
                          : "Campus Order Items";

                        const formattedDate = ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })
                          : "Recent";

                        const getBadge = (status: string) => {
                          switch (status) {
                            case "PENDING":
                              return { label: "Order Placed", color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
                            case "ACCEPTED":
                              return { label: "Accepted", color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" };
                            case "PREPARING":
                              return { label: "Preparing", color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
                            case "READY_FOR_DELIVERY":
                              return { label: "Ready / Packed", color: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
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
                          <tr key={ord.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                            {/* Order Ref & Date */}
                            <td className="p-4">
                              <div className={`font-mono font-black text-xs ${isDark ? "text-indigo-300" : "text-indigo-900"}`}>
                                #{ord.id ? ord.id.slice(-6).toUpperCase() : "ORDER"}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
                                <Clock size={10} />
                                <span>{formattedDate}</span>
                              </div>
                              {ord.paymentReference && (
                                <div className="text-[9px] font-mono text-zinc-500 mt-1 truncate max-w-[120px]" title={ord.paymentReference}>
                                  Ref: {ord.paymentReference}
                                </div>
                              )}
                            </td>

                            {/* Customer & Location */}
                            <td className="p-4">
                              <div className={`font-bold font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>
                                {ord.user?.name || "Campus Student"}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                                {ord.user?.email || "No email"}
                              </div>
                              {ord.user?.phone && (
                                <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                                  <Phone size={10} />
                                  <a href={`tel:${ord.user.phone}`} className="hover:underline text-indigo-400">
                                    {ord.user.phone}
                                  </a>
                                </div>
                              )}
                              {ord.deliveryLocation && (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                  <span>📍 {ord.deliveryLocation}</span>
                                </div>
                              )}
                            </td>

                            {/* Vendor Store */}
                            <td className="p-4">
                              <div className={`font-bold font-heading ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                                {ord.store?.name || "Campus Store"}
                              </div>
                              {ord.store?.phone && (
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  📞 {ord.store.phone}
                                </div>
                              )}
                            </td>

                            {/* Items Summary */}
                            <td className="p-4 max-w-[200px]">
                              <div className={`text-xs font-medium truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`} title={itemsSummary}>
                                {itemsSummary}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 font-bold">
                                {ord.items?.length || 1} item{ord.items && ord.items.length === 1 ? "" : "s"} total
                              </div>
                            </td>

                            {/* Amount & Payment Method */}
                            <td className="p-4">
                              <span className={`font-extrabold font-heading text-sm block ${isDark ? "text-amber-400" : "text-[#312E81]"}`}>
                                ₦{ord.totalAmount?.toLocaleString()}
                              </span>
                              <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 border ${
                                ord.paymentReference?.startsWith("TRANSFER-")
                                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                  : ord.paymentReference?.startsWith("POD-") || ord.paymentReference?.startsWith("CASH-")
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                              }`}>
                                {ord.paymentReference?.startsWith("TRANSFER-")
                                  ? "Bank Transfer"
                                  : ord.paymentReference?.startsWith("POD-") || ord.paymentReference?.startsWith("CASH-")
                                    ? "Pay on Delivery"
                                    : "Paystack Online"}
                              </span>
                            </td>

                            {/* Lifecycle Status & In-place Updater */}
                            <td className="p-4">
                              <div className="space-y-1.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-extrabold border ${badge.color}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                                  <span>{badge.label}</span>
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={ord.status}
                                    disabled={orderUpdating === ord.id}
                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                    className={`text-[11px] font-heading font-bold px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition ${
                                      isDark 
                                        ? "bg-zinc-950 border-zinc-700 text-zinc-200 hover:border-zinc-500" 
                                        : "bg-white border-slate-300 text-zinc-800 hover:border-slate-400"
                                    }`}
                                    title="Update order status & notify customer"
                                  >
                                    <option value="PENDING">PENDING (Order Placed)</option>
                                    <option value="ACCEPTED">ACCEPTED (Store Confirmed)</option>
                                    <option value="PREPARING">PREPARING (Kitchen / Prep)</option>
                                    <option value="READY_FOR_DELIVERY">READY FOR DELIVERY</option>
                                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                    <option value="DELIVERED">DELIVERED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                  {orderUpdating === ord.id && (
                                    <RefreshCw size={12} className="animate-spin text-indigo-400 shrink-0" />
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Actions: View Details + Delete */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetails(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="View full order inspection details"
                                >
                                  <Eye size={12} />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(ord)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 transition-all active:scale-95 cursor-pointer"
                                  title={`Delete order #${ord.id.slice(-6).toUpperCase()}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
                              <Package size={24} />
                            </div>
                            <p className={`font-heading font-bold text-sm ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
                              No orders matching current filter
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                              {orderStatusFilter !== "ALL"
                                ? `No orders found with status "${orderStatusFilter}". Try selecting "All" or resetting search.`
                                : "No orders are currently in the database. New student checkouts will appear here instantly."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                            {st.paystackSubaccountCode && (
                              <div className="text-[10px] text-emerald-500 mt-1.5 font-mono font-bold flex items-center gap-1" title="Paystack Subaccount Configured">
                                <DollarSign size={12} />
                                {st.paystackSubaccountCode}
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
                    <th className="p-4">Orders Placed</th>
                    <th className="p-4 text-right">Actions</th>
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
                        <td className={`p-4 font-extrabold font-heading text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>
                          {u._count?.orders || 0}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-heading font-bold text-xs transition-all active:scale-95 cursor-pointer"
                            title={`Delete student account ${u.email}`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400">
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
      {/* DELETE ORDER CONFIRMATION MODAL */}
      <AnimatePresence>
        {orderToDelete && (
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
                  <h3 className="font-heading font-extrabold text-lg">Delete Order #{orderToDelete.id.slice(-6).toUpperCase()}?</h3>
                  <p className="text-xs text-rose-400">Irreversible database action</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                Are you sure you want to permanently delete order <strong className={isDark ? "text-white" : "text-zinc-900"}>#{orderToDelete.id.slice(-6).toUpperCase()}</strong> placed by <strong className={isDark ? "text-white" : "text-zinc-900"}>"{orderToDelete.user?.name || orderToDelete.user?.email || "Student"}"</strong>? 
                This will purge all ordered line items, delivery logs, and GMV contribution from the Supabase database.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingOrder}
                  onClick={handleConfirmDeleteOrder}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>{isDeletingOrder ? "Deleting Order..." : "Yes, Delete Order"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
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

      {/* DELETE ALL ORDERS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteAllOrdersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-lg w-full rounded-3xl p-6 shadow-2xl border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg">Clear All Platform Orders?</h3>
                  <p className="text-xs text-rose-400">Irreversible database purge</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl mb-5 text-xs leading-relaxed border ${
                isDark ? "bg-rose-950/20 border-rose-900/40 text-rose-200" : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <p className="font-bold mb-1">⚠️ Warning: Complete Database Order Reset</p>
                <p>
                  This will permanently delete <strong>all {adminData?.recentOrders?.length || adminData?.metrics?.totalOrders || 0} orders</strong> and their linked items from the PostgreSQL database.
                  Gross Merchandise Volume (GMV) will reset to ₦0, and user order histories across student accounts will be cleared.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingAllOrders}
                  onClick={handleConfirmDeleteAllOrders}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>{isDeletingAllOrders ? "Purging Orders from Database..." : "Yes, Delete All Orders"}</span>
                </button>
                <button
                  type="button"
                  disabled={isDeletingAllOrders}
                  onClick={() => setShowDeleteAllOrdersModal(false)}
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

      {/* SELECTED ORDER INSPECTION MODAL */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-2xl w-full rounded-3xl p-6 shadow-2xl border my-8 max-h-[90vh] overflow-y-auto ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-extrabold text-base">
                        Order #{selectedOrderDetails.id?.slice(-6).toUpperCase()}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {selectedOrderDetails.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Placed: {selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* DETAILS CONTENT */}
              <div className="space-y-4 py-4">
                {/* 2-COLUMN SUMMARY: CUSTOMER & STORE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Block */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="font-heading font-bold text-[11px] uppercase tracking-wider text-indigo-400">
                      Customer Details
                    </div>
                    <div className="font-bold text-sm">{selectedOrderDetails.user?.name || "Campus Student"}</div>
                    <div className="text-zinc-400">{selectedOrderDetails.user?.email || "No email"}</div>
                    {selectedOrderDetails.user?.phone && (
                      <div className="text-zinc-400 flex items-center gap-1 font-mono">
                        <Phone size={11} />
                        <a href={`tel:${selectedOrderDetails.user.phone}`} className="hover:underline text-indigo-400">
                          {selectedOrderDetails.user.phone}
                        </a>
                      </div>
                    )}
                    <div className="pt-1 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" />
                      <span>{selectedOrderDetails.deliveryLocation || "Campus Delivery"}</span>
                    </div>
                    {selectedOrderDetails.deliveryInstructions && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl mt-1 border border-amber-200 dark:border-amber-900/40">
                        <strong>Note:</strong> "{selectedOrderDetails.deliveryInstructions}"
                      </div>
                    )}
                  </div>

                  {/* Vendor & Payment Block */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="font-heading font-bold text-[11px] uppercase tracking-wider text-indigo-400">
                      Store & Payment
                    </div>
                    <div className="font-bold text-sm">{selectedOrderDetails.store?.name || "Campus Store"}</div>
                    {selectedOrderDetails.store?.phone && (
                      <div className="text-zinc-400 font-mono">📞 {selectedOrderDetails.store.phone}</div>
                    )}
                    <div className="pt-2">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Payment Reference</span>
                      <span className="font-mono text-[11px] font-bold text-zinc-300">
                        {selectedOrderDetails.paymentReference || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold">Method</span>
                      <span className="font-bold text-indigo-500">
                        {selectedOrderDetails.paymentReference?.startsWith("TRANSFER-")
                          ? "Direct Bank Transfer"
                          : selectedOrderDetails.paymentReference?.startsWith("POD-") || selectedOrderDetails.paymentReference?.startsWith("CASH-")
                            ? "Pay on Delivery"
                            : "Online Card / Paystack"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ORDER ITEMS LIST */}
                <div className={`rounded-2xl border overflow-hidden ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 font-heading font-bold text-xs uppercase tracking-wider text-zinc-400">
                    Order Items Breakdown ({selectedOrderDetails.items?.length || 0})
                  </div>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                    {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((it: any, idx: number) => (
                        <div key={it.id || idx} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-300 shrink-0">
                              {it.quantity}x
                            </div>
                            <div>
                              <div className="font-bold font-heading">{it.product?.name || "Campus Item"}</div>
                              <div className="text-[10px] text-zinc-400">₦{Number(it.price || 0).toLocaleString()} each</div>
                            </div>
                          </div>
                          <div className="font-bold font-mono">
                            ₦{(Number(it.price || 0) * (it.quantity || 1)).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-zinc-400 text-xs">
                        No individual items catalogued for this order.
                      </div>
                    )}
                  </div>
                </div>

                {/* FINANCIAL TOTALS */}
                <div className={`p-4 rounded-2xl border space-y-1.5 text-xs ${
                  isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex justify-between text-zinc-400">
                    <span>Items Subtotal</span>
                    <span className="font-mono">
                      ₦{Math.max(0, (selectedOrderDetails.totalAmount || 0) - (selectedOrderDetails.deliveryFee || 500) - (selectedOrderDetails.serviceFee || 50)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Fee</span>
                    <span className="font-mono">₦{Number(selectedOrderDetails.deliveryFee ?? 500).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Campus Service Fee</span>
                    <span className="font-mono">₦{Number(selectedOrderDetails.serviceFee ?? 50).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-extrabold text-sm text-amber-500 font-heading">
                    <span>Total Amount Paid</span>
                    <span className="text-base font-mono">₦{Number(selectedOrderDetails.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* STATUS CHANGER IN MODAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Change Lifecycle Status:</span>
                    <select
                      value={selectedOrderDetails.status}
                      disabled={orderUpdating === selectedOrderDetails.id}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrderDetails.id, e.target.value)}
                      className={`text-xs font-heading font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                        isDark ? "bg-zinc-950 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-zinc-800"
                      }`}
                    >
                      <option value="PENDING">PENDING (Order Placed)</option>
                      <option value="ACCEPTED">ACCEPTED (Store Confirmed)</option>
                      <option value="PREPARING">PREPARING (Kitchen / Prep)</option>
                      <option value="READY_FOR_DELIVERY">READY FOR DELIVERY</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                    {orderUpdating === selectedOrderDetails.id && (
                      <RefreshCw size={14} className="animate-spin text-indigo-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedOrderDetails;
                        setSelectedOrderDetails(null);
                        setOrderToDelete(target);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 font-heading font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(null)}
                      className={`px-4 py-2 rounded-xl text-xs font-heading font-bold active:scale-95 transition cursor-pointer ${
                        isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
