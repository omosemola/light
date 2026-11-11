"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { 
  ShieldCheck, 
  Store, 
  Users, 
  DollarSign, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  X,
  LogOut,
  Utensils,
  Package,
  Clock,
  Tag,
  Phone,
  ArrowLeft,
  Eye,
  MapPin,
  Receipt,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { 
  getAdminOverviewMetrics,
  getAdminProductsPaginated,
  getAdminOrdersPaginated,
  getAdminStoresPaginated,
  getAdminUsersPaginated,
  getAdminTicketsPaginated,
  updateSupportTicketStatus, 
  updateUserRole, 
  deleteUserAccount, 
  checkAdminSession, 
  logoutAdmin,
  updateOrderStatusAdmin,
  toggleProductAvailabilityAdmin,
  updateProductCategoryAdmin,
  updateStoreCategoryAdmin,
  verifyStoreAdmin,
  toggleStoreStatusAdmin,
  deleteStoreAdmin,
  deleteOrderAdmin,
  deleteAllOrdersAdmin
} from "@/actions/admin";
import { TicketStatus, Role } from "@prisma/client";
import { getSafeImageUrl } from "@/lib/productOptions";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import {
  MAJOR_CATEGORIES,
  STORE_CATEGORY_OPTIONS,
  ADMIN_PRODUCT_CATEGORY_OPTIONS,
} from "@/lib/categories";

function PaginationControls({
  page,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  isDark,
  loading,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  isDark: boolean;
  loading?: boolean;
}) {
  if (totalCount === 0) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  return (
    <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
      isDark ? "border-zinc-800 bg-zinc-950/40" : "border-slate-200 bg-slate-50/50"
    }`}>
      <div className={isDark ? "text-zinc-400" : "text-zinc-500"}>
        Showing <strong className={isDark ? "text-white" : "text-zinc-900"}>{start}</strong> to <strong className={isDark ? "text-white" : "text-zinc-900"}>{end}</strong> of <strong className={isDark ? "text-white" : "text-zinc-900"}>{totalCount}</strong> records
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className={`px-3 py-1.5 rounded-lg border font-heading font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isDark 
              ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" 
              : "bg-white border-slate-200 text-zinc-700 hover:bg-slate-100"
          }`}
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>
        <span className={`px-2 font-mono font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className={`px-3 py-1.5 rounded-lg border font-heading font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            isDark 
              ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" 
              : "bg-white border-slate-200 text-zinc-700 hover:bg-slate-100"
          }`}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isDark, setTheme } = useTheme();
  const adminTabsSwipe = useSwipeScroll<HTMLDivElement>();
  const orderStatusFilterSwipe = useSwipeScroll<HTMLDivElement>();

  // State: High-speed Overview Metrics (parallel DB counts & aggregates)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalGMV: 0,
    openTicketsCount: 0,
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Section Data & Pagination States (25 per page, server-side filtering)
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "stores" | "users" | "tickets">("products");
  const [searchQuery, setSearchQuery] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [productsPagination, setProductsPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("ALL");

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");

  const [stores, setStores] = useState<any[]>([]);
  const [storesPagination, setStoresPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });

  const [users, setUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });

  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsPagination, setTicketsPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });

  // Loading & Telemetry
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState<{ dbMs: number; netMs: number; totalMs: number } | null>(null);

  // In-flight Action States
  const [ticketUpdating, setTicketUpdating] = useState<string | null>(null);
  const [orderUpdating, setOrderUpdating] = useState<string | null>(null);
  const [productUpdating, setProductUpdating] = useState<string | null>(null);
  const [productCategoryUpdating, setProductCategoryUpdating] = useState<string | null>(null);
  const [customCategoryModalProduct, setCustomCategoryModalProduct] = useState<any>(null);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [isSavingCustomCategory, setIsSavingCustomCategory] = useState(false);

  const [storeCategoryUpdating, setStoreCategoryUpdating] = useState<string | null>(null);
  const [customCategoryModalStore, setCustomCategoryModalStore] = useState<any>(null);
  const [customStoreCategoryName, setCustomStoreCategoryName] = useState("");
  const [isSavingCustomStoreCategory, setIsSavingCustomStoreCategory] = useState(false);

  // Modals & Deletion States
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [isDeletingStore, setIsDeletingStore] = useState(false);

  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [showDeleteAllOrdersModal, setShowDeleteAllOrdersModal] = useState(false);
  const [isDeletingAllOrders, setIsDeletingAllOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, durationMs = 1500) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), durationMs);
  };

  const hasStartedRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Standard marketplace categories
  const STANDARD_CATEGORIES = useMemo(() => [
    ...MAJOR_CATEGORIES.map((c) => c.name),
    ...STORE_CATEGORY_OPTIONS,
  ], []);

  const getStoreDisplayCategory = (st: any): string => {
    if (!st) return "Campus Food & Meals";
    if (st.isService && st.serviceSubcategory && st.serviceSubcategory.trim()) {
      const sub = st.serviceSubcategory.trim();
      return sub.toLowerCase().startsWith("services:") ? sub : `Services: ${sub}`;
    }
    if (st.category && st.category.trim()) {
      if (st.category.trim().toLowerCase() === "services" && st.serviceSubcategory) {
        return `Services: ${st.serviceSubcategory.trim()}`;
      }
      return st.category.trim();
    }
    if (st.isService) {
      return "Services: Other Campus Services";
    }
    return "Campus Food & Meals";
  };

  const allAvailableCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of STANDARD_CATEGORIES) {
      map.set(cat.toLowerCase().trim(), cat.trim());
    }
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat.name && cat.name.trim()) {
          map.set(cat.name.toLowerCase().trim(), cat.name.trim());
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [categories, STANDARD_CATEGORIES]);

  // Fetch Overview Counts & Aggregates in parallel (Lean & Fast ~30ms)
  const fetchOverviewMetrics = useCallback(async () => {
    const startTime = performance.now();
    try {
      let res: any = null;
      try {
        const apiRes = await fetch("/api/admin/dashboard?section=overview", { cache: "no-store" });
        if (apiRes.ok) res = await apiRes.json();
      } catch {}

      if (!res || !res.success) {
        res = await getAdminOverviewMetrics();
      }

      if (res && res.success) {
        setMetrics(res.metrics);
        if (res.categories) setCategories(res.categories);
        const totalMs = Math.round(performance.now() - startTime);
        setTelemetry((prev) => ({
          dbMs: res.queryDurationMs || 0,
          netMs: totalMs,
          totalMs,
        }));
      }
    } catch (err) {
      console.error("Failed to load overview metrics:", err);
    }
  }, []);

  // Fetch a specific section paginated directly from the database
  const fetchSection = useCallback(async (
    section: "products" | "orders" | "stores" | "tickets" | "users",
    page = 1,
    search = "",
    filter = "ALL"
  ) => {
    setTabLoading(true);
    const startTime = performance.now();
    try {
      const params = new URLSearchParams({
        section,
        page: String(page),
        limit: "25",
      });
      if (search.trim()) params.set("search", search.trim());
      if (filter && filter !== "ALL") {
        if (section === "products") params.set("categoryId", filter);
        else if (section === "orders") params.set("filter", filter);
        else if (section === "stores") params.set("category", filter);
        else if (section === "tickets") params.set("filter", filter);
      }

      let data: any = null;
      let netMs = 0;
      try {
        const res = await fetch(`/api/admin/dashboard?${params.toString()}`, {
          cache: "no-store",
        });
        netMs = Math.round(performance.now() - startTime);
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fall back to direct server action if API route is unreachable
      }

      if (!data || !data.success) {
        if (section === "products") {
          data = await getAdminProductsPaginated({ page, limit: 25, search, categoryId: filter });
        } else if (section === "orders") {
          data = await getAdminOrdersPaginated({ page, limit: 25, search, status: filter !== "ALL" ? filter : undefined });
        } else if (section === "stores") {
          data = await getAdminStoresPaginated({ page, limit: 25, search, category: filter !== "ALL" ? filter : undefined });
        } else if (section === "tickets") {
          data = await getAdminTicketsPaginated({ page, limit: 25, status: filter !== "ALL" ? (filter as any) : "ALL" });
        } else if (section === "users") {
          data = await getAdminUsersPaginated({ page, limit: 25, search, role: "STUDENT" as any });
        }
      }

      const totalMs = Math.round(performance.now() - startTime);
      const dbMs = data?.queryDurationMs || Math.round(totalMs * 0.4);
      setTelemetry({ dbMs, netMs, totalMs });

      if (data && data.success) {
        if (section === "products") {
          setProducts(data.products || []);
          if (data.pagination) setProductsPagination(data.pagination);
        } else if (section === "orders") {
          setOrders(data.orders || []);
          if (data.pagination) setOrdersPagination(data.pagination);
        } else if (section === "stores") {
          setStores(data.stores || []);
          if (data.pagination) setStoresPagination(data.pagination);
        } else if (section === "tickets") {
          setTickets(data.tickets || []);
          if (data.pagination) setTicketsPagination(data.pagination);
        } else if (section === "users") {
          setUsers(data.users || []);
          if (data.pagination) setUsersPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error(`Failed to load ${section}:`, err);
      showToast(`Failed to load ${section} data`);
    } finally {
      setTabLoading(false);
    }
  }, []);

  const getActiveFilterForTab = useCallback((tab: string) => {
    if (tab === "products") return productCategoryFilter;
    if (tab === "orders") return orderStatusFilter;
    return "ALL";
  }, [productCategoryFilter, orderStatusFilter]);

  // Initial Auth & Mount Load
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    async function verifyAndLoadAdmin() {
      try {
        const session = await checkAdminSession();
        if (session && session.isAuthenticated && session.user) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("lightson_admin_auth", "true");
          }
        } else {
          const hasAdminFlag = typeof window !== "undefined" && sessionStorage.getItem("lightson_admin_auth") === "true";
          if (!hasAdminFlag) {
            window.location.href = "/admin/login";
            return;
          }
        }
      } catch (err) {
        console.error("Admin verification error:", err);
      }

      // Fast initial parallel fetch: overview aggregates + initial tab page 1
      await Promise.all([
        fetchOverviewMetrics(),
        fetchSection("products", 1, "", "ALL"),
      ]);
      setLoading(false);
    }

    verifyAndLoadAdmin();
  }, [fetchOverviewMetrics, fetchSection]);

  const handleTabChange = (newTab: "products" | "orders" | "stores" | "users" | "tickets") => {
    setActiveTab(newTab);
    setSearchQuery("");
    fetchSection(newTab, 1, "", getActiveFilterForTab(newTab));
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSection(activeTab, 1, val, getActiveFilterForTab(activeTab));
    }, 350);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverviewMetrics(),
      fetchSection(activeTab, 1, searchQuery, getActiveFilterForTab(activeTab)),
    ]);
    setRefreshing(false);
    showToast("Live database synchronized!");
  };

  const handleSignOutAdmin = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lightson_admin_auth");
    }
    await logoutAdmin();
    window.location.href = "/admin/login";
  };

  // MUTATIONS: PRODUCTS
  const handleToggleProductAvailability = async (productId: string, currentIsAvailable: boolean) => {
    const nextAvailable = !currentIsAvailable;
    setProductUpdating(productId);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: nextAvailable } : p))
    );
    const res = await toggleProductAvailabilityAdmin(productId, nextAvailable);
    if (res.success) {
      showToast(`Product is now ${nextAvailable ? "In Stock (Active)" : "Out of Stock"}`);
    } else {
      showToast(res.error || "Failed to update product availability");
    }
    setProductUpdating(null);
  };

  const handleUpdateProductCategory = async (productId: string, newCategoryName: string) => {
    if (newCategoryName === "__CUSTOM__") {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        setCustomCategoryModalProduct(prod);
        setCustomCategoryName(prod.category?.name && prod.category.name !== "Uncategorized" ? prod.category.name : "");
      }
      return;
    }

    if (!newCategoryName || !newCategoryName.trim()) return;
    const trimmedCat = newCategoryName.trim();
    setProductCategoryUpdating(productId);

    // Optimistic UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, category: { ...(p.category || {}), name: trimmedCat } } : p
      )
    );

    try {
      const res = await updateProductCategoryAdmin(productId, trimmedCat);
      if (res.success) {
        showToast(`✓ Category updated to "${trimmedCat}"!`);
        fetchOverviewMetrics();
      } else {
        showToast(res?.error || "Failed to update category");
        fetchSection("products", productsPagination.page, searchQuery, productCategoryFilter);
      }
    } catch {
      showToast("Network error updating product category");
      fetchSection("products", productsPagination.page, searchQuery, productCategoryFilter);
    } finally {
      setProductCategoryUpdating(null);
    }
  };

  const handleSaveCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategoryModalProduct || !customCategoryName.trim()) return;
    setIsSavingCustomCategory(true);
    await handleUpdateProductCategory(customCategoryModalProduct.id, customCategoryName.trim());
    setIsSavingCustomCategory(false);
    setCustomCategoryModalProduct(null);
    setCustomCategoryName("");
  };

  // MUTATIONS: ORDERS
  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setOrderUpdating(orderId);
    const res = await updateOrderStatusAdmin(orderId, status);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setSelectedOrderDetails((prev: any) =>
        prev && prev.id === orderId ? { ...prev, status } : prev
      );
      showToast(`Order status updated to ${status}`);
      fetchOverviewMetrics();
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
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
        setMetrics((prev) => ({ ...prev, totalOrders: Math.max(0, prev.totalOrders - 1) }));
        showToast(`Order #${orderToDelete.id.slice(-6).toUpperCase()} deleted from database.`);
        setSelectedOrderDetails((prev: any) => (prev?.id === orderToDelete.id ? null : prev));
        setOrderToDelete(null);
        fetchOverviewMetrics();
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
        setOrders([]);
        setMetrics((prev) => ({ ...prev, totalOrders: 0, totalGMV: 0 }));
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

  // MUTATIONS: STORES
  const handleVerifyStore = async (storeId: string, isVerified: boolean) => {
    const res = await verifyStoreAdmin(storeId, isVerified);
    if (res.success) {
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, isVerified, isOpen: isVerified } : s))
      );
      showToast(isVerified ? "Store verified & approved live! 🎉" : "Store verification revoked.");
    } else {
      showToast(res.error || "Failed to update store verification");
    }
  };

  const handleToggleStoreStatus = async (storeId: string, currentIsOpen: boolean) => {
    const newStatus = !currentIsOpen;
    const res = await toggleStoreStatusAdmin(storeId, newStatus);
    if (res.success) {
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, isOpen: newStatus } : s))
      );
      showToast(`Store is now ${newStatus ? "ACTIVE & LIVE" : "PAUSED / SUSPENDED"}`);
    } else {
      showToast(res.error || "Failed to toggle store status");
    }
  };

  const handleUpdateStoreCategory = async (storeId: string, newCategoryName: string) => {
    if (newCategoryName === "__CUSTOM__") {
      const st = stores.find((s) => s.id === storeId);
      if (st) {
        setCustomCategoryModalStore(st);
        setCustomStoreCategoryName(getStoreDisplayCategory(st));
      }
      return;
    }

    if (!newCategoryName || !newCategoryName.trim()) return;
    const trimmedCat = newCategoryName.trim();
    setStoreCategoryUpdating(storeId);

    try {
      const res = await updateStoreCategoryAdmin(storeId, trimmedCat);
      if (res.success) {
        showToast(`✓ Vendor category updated to "${trimmedCat}"!`);
        fetchSection("stores", storesPagination.page, searchQuery);
      } else {
        showToast(res?.error || "Failed to update store category");
      }
    } catch {
      showToast("Network error updating store category");
    } finally {
      setStoreCategoryUpdating(null);
    }
  };

  const handleSaveCustomStoreCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategoryModalStore || !customStoreCategoryName.trim()) return;
    setIsSavingCustomStoreCategory(true);
    await handleUpdateStoreCategory(customCategoryModalStore.id, customStoreCategoryName.trim());
    setIsSavingCustomStoreCategory(false);
    setCustomCategoryModalStore(null);
    setCustomStoreCategoryName("");
  };

  const handleConfirmDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeletingStore(true);
    try {
      const res = await deleteStoreAdmin(storeToDelete.id);
      if (res.success) {
        setStores((prev) => prev.filter((s) => s.id !== storeToDelete.id));
        setMetrics((prev) => ({ ...prev, totalStores: Math.max(0, prev.totalStores - 1) }));
        showToast(`Store "${storeToDelete.name}" and catalog deleted successfully.`);
        setStoreToDelete(null);
        fetchOverviewMetrics();
      } else {
        showToast(`Error deleting store: ${res.error}`);
      }
    } catch {
      showToast("Failed to delete store from database.");
    } finally {
      setIsDeletingStore(false);
    }
  };

  // MUTATIONS: USERS & TICKETS
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserAccount(userToDelete.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setMetrics((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
        showToast(`User "${userToDelete.name || userToDelete.email}" deleted successfully`);
        setUserToDelete(null);
        fetchOverviewMetrics();
      } else {
        showToast(`Error deleting user: ${res.error}`);
      }
    } catch {
      showToast("Failed to delete user account.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleResolveTicket = async (ticketId: string, status: TicketStatus) => {
    setTicketUpdating(ticketId);
    const res = await updateSupportTicketStatus(ticketId, status);
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
      showToast(`Ticket updated to ${status}`);
      fetchOverviewMetrics();
    }
    setTicketUpdating(null);
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

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-[#09090B] text-zinc-100" : "bg-[#FAFAF7] text-zinc-900"}`}>
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-heading">Loading Platform Admin Command Center...</h2>
        <p className={`text-sm mt-1 font-body ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Parallelizing Supabase Database Queries & Live Telemetry</p>
      </div>
    );
  }

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

      {/* SYNCHRONIZED BRAND HERO HEADER WITH LIVE TELEMETRY */}
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-heading font-black tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                    ⚡ Super Administrator
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live DB Synced
                  </span>
                  {telemetry && (
                    <span 
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        telemetry.totalMs < 250
                          ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/60"
                          : telemetry.totalMs < 600
                          ? "bg-amber-950/70 text-amber-300 border-amber-800/60"
                          : "bg-rose-950/70 text-rose-300 border-rose-800/60"
                      }`}
                      title={`DB Query Duration: ${telemetry.dbMs}ms | Network Roundtrip: ${telemetry.netMs}ms | Total Latency: ${telemetry.totalMs}ms`}
                    >
                      <Zap size={10} className={telemetry.totalMs < 250 ? "text-emerald-400" : "text-amber-400"} />
                      <span>{telemetry.totalMs}ms (DB: {telemetry.dbMs}ms)</span>
                    </span>
                  )}
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
                onClick={handleManualRefresh}
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
        
        {/* CLICKABLE METRICS OVERVIEW CARDS (LOADED IN PARALLEL) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <motion.div 
            onClick={() => handleTabChange("orders")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              activeTab === "orders" ? "ring-2 ring-emerald-500" : ""
            } ${
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
            onClick={() => handleTabChange("products")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              activeTab === "products" ? "ring-2 ring-indigo-500" : ""
            } ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-indigo-500" 
                : "bg-white border-slate-200 hover:border-indigo-500 shadow-sm"
            }`}
          >
            <Utensils className="w-5 h-5 text-indigo-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Product Count</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{metrics?.totalProducts || 0} Products</h3>
          </motion.div>

          <motion.div 
            onClick={() => handleTabChange("stores")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              activeTab === "stores" ? "ring-2 ring-blue-500" : ""
            } ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-blue-500" 
                : "bg-white border-slate-200 hover:border-blue-500 shadow-sm"
            }`}
          >
            <Store className="w-5 h-5 text-blue-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Active Stores</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{metrics?.totalStores || 0} Vendors</h3>
          </motion.div>

          <motion.div 
            onClick={() => handleTabChange("users")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              activeTab === "users" ? "ring-2 ring-purple-500" : ""
            } ${
              isDark 
                ? "bg-zinc-900 border-zinc-800 hover:border-purple-500" 
                : "bg-white border-slate-200 hover:border-purple-500 shadow-sm"
            }`}
          >
            <Users className="w-5 h-5 text-purple-500 mb-1.5" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Campus Students</span>
            <h3 className={`text-lg font-extrabold mt-0.5 font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{metrics?.totalUsers || 0} Students</h3>
          </motion.div>

          <motion.div 
            onClick={() => handleTabChange("tickets")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              activeTab === "tickets" ? "ring-2 ring-amber-500" : ""
            } ${
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
          <div 
            ref={adminTabsSwipe.containerRef}
            {...adminTabsSwipe.handlers}
            className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 select-none ${
              adminTabsSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
            }`}
          >
            <button
              onClick={() => handleTabChange("products")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "products" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🍲 Products ({metrics?.totalProducts || 0})
            </button>
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "orders" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              📦 Live Orders ({metrics?.totalOrders || 0})
            </button>
            <button
              onClick={() => handleTabChange("stores")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "stores" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🏪 Vendor Stores ({metrics?.totalStores || 0})
            </button>
            <button
              onClick={() => handleTabChange("tickets")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "tickets" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              🎫 Support Tickets ({metrics?.openTicketsCount || 0})
            </button>
            <button
              onClick={() => handleTabChange("users")}
              className={`px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === "users" 
                  ? "bg-[#312E81] text-white shadow-sm" 
                  : isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              👥 Students ({metrics?.totalUsers || 0})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search records in tab..."
              className={`w-full h-10 pl-9 pr-4 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" : "bg-white border-slate-200 text-zinc-900 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* CATEGORY FILTER BAR */}
            <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
                <span className="text-[10px] font-heading font-extrabold uppercase text-slate-400 dark:text-zinc-500 shrink-0 flex items-center gap-1 mr-1">
                  <Tag size={12} /> Categories:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProductCategoryFilter("ALL");
                    fetchSection("products", 1, searchQuery, "ALL");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer border ${
                    productCategoryFilter === "ALL"
                      ? "bg-[#312E81] text-white border-indigo-600 shadow-xs"
                      : isDark
                      ? "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All Products ({metrics?.totalProducts || 0})
                </button>
                {MAJOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const nextFilter =
                        productCategoryFilter.toLowerCase() === cat.id.toLowerCase() ||
                        productCategoryFilter.toLowerCase() === cat.name.toLowerCase()
                          ? "ALL"
                          : cat.id;
                      setProductCategoryFilter(nextFilter);
                      fetchSection("products", 1, searchQuery, nextFilter);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-extrabold transition shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                      productCategoryFilter.toLowerCase() === cat.id.toLowerCase() ||
                      productCategoryFilter.toLowerCase() === cat.name.toLowerCase()
                        ? "bg-[#312E81] text-white border-indigo-600 shadow-xs"
                        : isDark
                        ? "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.shortName || cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 shrink-0">
                {tabLoading ? (
                  <span className="flex items-center gap-1 text-indigo-400">
                    <RefreshCw size={12} className="animate-spin" /> Querying DB...
                  </span>
                ) : (
                  <>Showing <strong className="text-zinc-900 dark:text-white font-extrabold">{products.length}</strong> of {productsPagination.totalCount} products</>
                )}
              </div>
            </div>

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
                      <th className="p-4">Marketplace Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                    {products?.map((prod: any) => {
                      const currentCatName = prod.category?.name || "Uncategorized";
                      const isUpdatingThisCat = productCategoryUpdating === prod.id;

                      return (
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
                                      sizes="44px"
                                      loading="lazy"
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
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5 min-w-[190px] max-w-[240px]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-[#312E81] dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 truncate max-w-[170px]">
                                  <Tag size={10} className="shrink-0 text-indigo-500" />
                                  <span className="truncate">{currentCatName}</span>
                                </span>
                                <button
                                  type="button"
                                  title="Enter Custom Category Name"
                                  onClick={() => {
                                    setCustomCategoryModalProduct(prod);
                                    setCustomCategoryName(currentCatName === "Uncategorized" ? "" : currentCatName);
                                  }}
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold shrink-0 cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>

                              <div className="relative">
                                <select
                                  disabled={isUpdatingThisCat}
                                  value={currentCatName}
                                  onChange={(e) => handleUpdateProductCategory(prod.id, e.target.value)}
                                  className={`w-full text-[11px] font-medium py-1 px-2 pr-6 rounded-lg border cursor-pointer outline-none transition disabled:opacity-50 ${
                                    isDark 
                                      ? "bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:border-zinc-600 focus:border-indigo-500" 
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 focus:border-indigo-500"
                                  }`}
                                >
                                  <option value={currentCatName} disabled>Current: {currentCatName}</option>
                                  <option value="__CUSTOM__">✏️ + Enter Custom Category...</option>
                                  <optgroup label="All Available Categories">
                                    {allAvailableCategories.map((cName) => (
                                      <option key={cName} value={cName}>
                                        {cName}
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                {isUpdatingThisCat && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                            </div>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <PaginationControls
                page={productsPagination.page}
                totalPages={productsPagination.totalPages}
                totalCount={productsPagination.totalCount}
                limit={productsPagination.limit}
                onPageChange={(p) => fetchSection("products", p, searchQuery, productCategoryFilter)}
                isDark={isDark}
                loading={tabLoading}
              />
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
                  {metrics?.totalOrders || 0}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-amber-400">Active / In Progress</span>
                <div className="text-xl font-heading font-black text-amber-500 mt-1">
                  {orders.filter((o) => ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(o.status)).length}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-emerald-400">Delivered</span>
                <div className="text-xl font-heading font-black text-emerald-500 mt-1">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-indigo-400">Platform GMV</span>
                <div className="text-xl font-heading font-black text-indigo-500 mt-1">
                  ₦{Number(metrics?.totalGMV || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* ACTION TOOLBAR: FILTERS + DELETE ALL BUTTON */}
            <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
            }`}>
              {/* STATUS FILTER PILLS */}
              <div 
                ref={orderStatusFilterSwipe.containerRef}
                {...orderStatusFilterSwipe.handlers}
                className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none ${
                  orderStatusFilterSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
                }`}
              >
                {[
                  { key: "ALL", label: `All Orders (${metrics?.totalOrders || 0})` },
                  { key: "PENDING", label: "Pending" },
                  { key: "IN_PROGRESS", label: "In Progress" },
                  { key: "DELIVERED", label: "Delivered" },
                  { key: "CANCELLED", label: "Cancelled" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setOrderStatusFilter(f.key);
                      fetchSection("orders", 1, searchQuery, f.key);
                    }}
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

              {/* ACTION BUTTONS: SYNC + PURGE ALL */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    fetchSection("orders", ordersPagination.page, searchQuery, orderStatusFilter);
                    fetchOverviewMetrics();
                  }}
                  disabled={tabLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                  title="Synchronize live orders with Supabase DB"
                >
                  <RefreshCw size={13} className={tabLoading ? "animate-spin text-indigo-400" : ""} />
                  <span>Sync Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteAllOrdersModal(true)}
                  disabled={orders.length === 0}
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
                    {orders.length > 0 ? (
                      orders.map((ord: any) => {
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

                            <td className="p-4 max-w-[200px]">
                              <div className={`text-xs font-medium truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`} title={itemsSummary}>
                                {itemsSummary}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 font-bold">
                                {ord.items?.length || 1} item{ord.items && ord.items.length === 1 ? "" : "s"} total
                              </div>
                            </td>

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

              {/* PAGINATION CONTROLS */}
              <PaginationControls
                page={ordersPagination.page}
                totalPages={ordersPagination.totalPages}
                totalCount={ordersPagination.totalCount}
                limit={ordersPagination.limit}
                onPageChange={(p) => fetchSection("orders", p, searchQuery, orderStatusFilter)}
                isDark={isDark}
                loading={tabLoading}
              />
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
                <div className="text-xl font-heading font-black mt-1">{metrics?.totalStores || 0}</div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-emerald-400">Verified & Active</span>
                <div className="text-xl font-heading font-black text-emerald-500 mt-1">
                  {stores.filter((s) => s.isVerified).length}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-amber-400">Pending Review</span>
                <div className="text-xl font-heading font-black text-amber-500 mt-1">
                  {stores.filter((s) => !s.isVerified).length}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-heading font-extrabold uppercase text-indigo-400">Open Stores</span>
                <div className="text-xl font-heading font-black text-indigo-500 mt-1">
                  {stores.filter((s) => s.isOpen !== false).length}
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
                      <th className="p-4">Vendor Category</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Products & Orders</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Store Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-zinc-800" : "divide-slate-200"}`}>
                    {stores.length > 0 ? (
                      stores.map((st: any) => {
                        const currentStoreCat = getStoreDisplayCategory(st);
                        const isUpdatingThisStoreCat = storeCategoryUpdating === st.id;

                        return (
                          <tr key={st.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
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

                            <td className="p-4">
                              <div className="flex flex-col gap-1.5 min-w-[195px] max-w-[245px]">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-[#312E81] dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 truncate max-w-[175px]">
                                    <Tag size={10} className="shrink-0 text-indigo-500" />
                                    <span className="truncate">{currentStoreCat}</span>
                                  </span>
                                  <button
                                    type="button"
                                    title="Edit Vendor Store Category"
                                    onClick={() => {
                                      setCustomCategoryModalStore(st);
                                      setCustomStoreCategoryName(currentStoreCat);
                                    }}
                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold shrink-0 cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>

                                <div className="relative">
                                  <select
                                    disabled={isUpdatingThisStoreCat}
                                    value={currentStoreCat}
                                    onChange={(e) => handleUpdateStoreCategory(st.id, e.target.value)}
                                    className={`w-full text-[11px] font-medium py-1 px-2 pr-6 rounded-lg border cursor-pointer outline-none transition disabled:opacity-50 ${
                                      isDark
                                        ? "bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:border-zinc-600 focus:border-indigo-500"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 focus:border-indigo-500"
                                    }`}
                                  >
                                    <option value={currentStoreCat} disabled>
                                      Current: {currentStoreCat}
                                    </option>
                                    <option value="__CUSTOM__">✏️ + Enter Custom Category...</option>
                                    <optgroup label="All Available Categories">
                                      {allAvailableCategories.map((cName) => (
                                        <option key={cName} value={cName}>
                                          {cName}
                                        </option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  {isUpdatingThisStoreCat && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                      <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

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
                              {st.bankName && st.accountNumber && (
                                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                                  🏦 {st.bankName} · {st.accountNumber}
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              <div className={`font-bold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                                {st._count?.products || 0} products
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                {st._count?.orders || 0} orders completed
                              </div>
                            </td>

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
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400">
                          No stores matching your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <PaginationControls
                page={storesPagination.page}
                totalPages={storesPagination.totalPages}
                totalCount={storesPagination.totalCount}
                limit={storesPagination.limit}
                onPageChange={(p) => fetchSection("stores", p, searchQuery)}
                isDark={isDark}
                loading={tabLoading}
              />
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
                  {tickets?.length > 0 ? (
                    tickets.map((t: any) => (
                      <tr key={t.id} className={isDark ? "hover:bg-zinc-800/50 transition" : "hover:bg-slate-50 transition"}>
                        <td className={`p-4 font-mono font-bold ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>
                          {t.id ? `#${t.id.slice(-6).toUpperCase()}` : "#TICKET"}
                        </td>
                        <td className="p-4">
                          <div className={`font-bold font-heading ${isDark ? "text-white" : "text-zinc-900"}`}>{t.subject}</div>
                          <div className={`text-[11px] truncate max-w-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{t.description || t.message}</div>
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

            {/* PAGINATION CONTROLS */}
            <PaginationControls
              page={ticketsPagination.page}
              totalPages={ticketsPagination.totalPages}
              totalCount={ticketsPagination.totalCount}
              limit={ticketsPagination.limit}
              onPageChange={(p) => fetchSection("tickets", p, searchQuery)}
              isDark={isDark}
              loading={tabLoading}
            />
          </div>
        )}

        {/* USERS TAB - CAMPUS STUDENTS */}
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
                  {users?.length > 0 ? (
                    users.map((u: any) => (
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

            {/* PAGINATION CONTROLS */}
            <PaginationControls
              page={usersPagination.page}
              totalPages={usersPagination.totalPages}
              totalCount={usersPagination.totalCount}
              limit={usersPagination.limit}
              onPageChange={(p) => fetchSection("users", p, searchQuery, "STUDENT")}
              isDark={isDark}
              loading={tabLoading}
            />
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
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>{isDeletingUser ? "Deleting from DB..." : "Yes, Delete User"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
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
                  This will permanently delete <strong>all {metrics?.totalOrders || 0} orders</strong> and their linked items from the PostgreSQL database.
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

      {/* EDIT / CUSTOM PRODUCT CATEGORY MODAL */}
      <AnimatePresence>
        {customCategoryModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base">Edit Product Category</h3>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                      {customCategoryModalProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomCategoryModalProduct(null);
                    setCustomCategoryName("");
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomCategory} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. Jewelries, Automobiles, Fragrances..."
                    required
                    autoFocus
                    className={`w-full h-11 px-3.5 rounded-xl text-xs font-semibold border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
                        : "bg-slate-50 border-slate-200 text-zinc-900 placeholder-slate-400"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
                    Assign any category to this product. The marketplace catalog, filters, search, and database will synchronize immediately.
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-heading font-bold text-slate-400 mb-1.5">
                    Select Quick Category:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {MAJOR_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCustomCategoryName(cat.name)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                          customCategoryName.toLowerCase() === cat.name.toLowerCase() ||
                          customCategoryName.toLowerCase() === cat.id.toLowerCase()
                            ? "bg-[#312E81] text-white border-indigo-600"
                            : isDark
                            ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCustomCategory || !customCategoryName.trim()}
                    className="flex-1 h-11 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSavingCustomCategory ? "Synchronizing DB..." : "Save Category"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategoryModalProduct(null);
                      setCustomCategoryName("");
                    }}
                    className={`px-5 h-11 rounded-xl text-xs font-heading font-bold active:scale-95 transition-all cursor-pointer ${
                      isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT / CUSTOM VENDOR STORE CATEGORY MODAL */}
      <AnimatePresence>
        {customCategoryModalStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border ${
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-slate-200 text-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base">Edit Vendor Category</h3>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                      {customCategoryModalStore.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomCategoryModalStore(null);
                    setCustomStoreCategoryName("");
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomStoreCategory} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Vendor Store Category
                  </label>
                  <input
                    type="text"
                    value={customStoreCategoryName}
                    onChange={(e) => setCustomStoreCategoryName(e.target.value)}
                    placeholder="e.g. Campus Food & Meals, Automobiles, Services: Laundry..."
                    required
                    autoFocus
                    className={`w-full h-11 px-3.5 rounded-xl text-xs font-semibold border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isDark
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
                        : "bg-slate-50 border-slate-200 text-zinc-900 placeholder-slate-400"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
                    Update the category this vendor signed up with. Changes synchronize immediately with the database, vendor dashboard, and student marketplace.
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-heading font-bold text-slate-400 mb-1.5">
                    Select Quick Category:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {STORE_CATEGORY_OPTIONS.map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCustomStoreCategoryName(catName)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                          customStoreCategoryName.toLowerCase() === catName.toLowerCase()
                            ? "bg-[#312E81] text-white border-indigo-600"
                            : isDark
                            ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCustomStoreCategory || !customStoreCategoryName.trim()}
                    className="flex-1 h-11 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSavingCustomStoreCategory ? "Synchronizing DB..." : "Save Vendor Category"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategoryModalStore(null);
                      setCustomStoreCategoryName("");
                    }}
                    className={`px-5 h-11 rounded-xl text-xs font-heading font-bold active:scale-95 transition-all cursor-pointer ${
                      isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Cancel
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
