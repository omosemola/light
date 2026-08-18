"use client";

import { useEffect, useState, useRef } from "react";
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
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUserStore } from "@/lib/userStore";
import { getAdminDashboardData, updateSupportTicketStatus, updateUserRole, deleteUserAccount, checkAdminSession, logoutAdmin } from "@/actions/admin";
import { toggleStoreOpenStatus } from "@/actions/vendor";
import { TicketStatus, Role } from "@prisma/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, updateProfile, logoutUser } = useUserStore();
  const { isDark, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"stores" | "users" | "orders" | "tickets">("stores");
  const [ticketUpdating, setTicketUpdating] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const hasStartedRef = useRef(false);

  const fetchAdminData = async () => {
    try {
      const res = await getAdminDashboardData();
      if (res && res.success) {
        setAdminData(res);
        try {
          sessionStorage.setItem("cached_admin_data", JSON.stringify(res));
        } catch {}
      } else {
        setToastMessage(res?.error || "Failed to load dashboard metrics");
      }
    } catch (e: any) {
      console.error("Failed to load admin data:", e);
      setToastMessage("Network error connecting to database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Fast initial cache hydration
    try {
      const cached = sessionStorage.getItem("cached_admin_data");
      if (cached) {
        setAdminData(JSON.parse(cached));
        setLoading(false);
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

  const handleToggleStoreStatus = async (storeId: string, currentIsOpen: boolean) => {
    const nextStatus = !currentIsOpen;
    setAdminData((prev: any) => ({
      ...prev,
      stores: prev.stores.map((s: any) =>
        s.id === storeId ? { ...s, isOpen: nextStatus } : s
      ),
    }));
    await toggleStoreOpenStatus(storeId, nextStatus);
    setToastMessage(`Store status updated to ${nextStatus ? "Active" : "Suspended"}`);
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
      setToastMessage(`Ticket updated to ${status}`);
    }
    setTicketUpdating(null);
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
      setToastMessage(`User role updated to ${role}`);
    }
    setRoleUpdating(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserAccount(userToDelete.id);
      if (res.success) {
        setAdminData((prev: any) => ({
          ...prev,
          users: prev.users.filter((u: any) => u.id !== userToDelete.id),
          metrics: {
            ...prev.metrics,
            totalUsers: Math.max(0, (prev.metrics?.totalUsers || 1) - 1),
          },
        }));
        setToastMessage(`User "${userToDelete.name || userToDelete.email}" deleted successfully`);
        setUserToDelete(null);
      } else {
        setToastMessage(`Error deleting user: ${res.error}`);
      }
    } catch {
      setToastMessage("Failed to delete user account.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-heading">Loading Platform Admin Dashboard...</h2>
        <p className={`text-sm mt-1 font-body ${isDark ? "text-slate-400" : "text-slate-500"}`}>Connecting to Supabase Database</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDark ? "bg-[#0B0F19] text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-extrabold font-heading">Admin Dashboard Connection Error</h2>
        <p className={`text-xs mt-1.5 font-body max-w-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {toastMessage || "Unable to retrieve real-time operations metrics from the database."}
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={fetchAdminData}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Retry Connection</span>
          </button>
          <button
            onClick={handleSignOutAdmin}
            className={`px-5 py-2.5 rounded-xl font-heading font-bold text-xs border transition-all active:scale-95 cursor-pointer ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
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
      isDark ? "bg-[#0B0F19] text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-heading font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-400 max-w-md w-11/12 text-center justify-center"
          >
            <CheckCircle2 size={18} className="text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className={`border-b sticky top-0 z-30 shadow-md backdrop-blur-md ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Lights<span className="text-[#F5A623]">on</span> Super Admin Portal
              </h1>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Campus Marketplace Operations, Users & Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* THEME TOGGLE BUTTON */}
            <button
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

            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition ${
                isDark 
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700" 
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              }`}
            >
              Marketplace
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleSignOutAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 cursor-pointer active:scale-95"
              title="Sign Out of Admin Command Center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* CLICKABLE METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <motion.div 
            onClick={() => setActiveTab("orders")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-slate-900 border-slate-800 hover:border-emerald-500" 
                : "bg-white border-slate-200 hover:border-emerald-500 shadow-sm"
            }`}
          >
            <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Gross Sales (GMV)</span>
            <h3 className={`text-xl font-extrabold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>₦{metrics?.totalGMV?.toLocaleString() || 0}</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("stores")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-slate-900 border-slate-800 hover:border-blue-500" 
                : "bg-white border-slate-200 hover:border-blue-500 shadow-sm"
            }`}
          >
            <Store className="w-5 h-5 text-blue-500 mb-2" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active Vendors</span>
            <h3 className={`text-xl font-extrabold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{metrics?.totalStores || 0}</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("orders")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-slate-900 border-slate-800 hover:border-purple-500" 
                : "bg-white border-slate-200 hover:border-purple-500 shadow-sm"
            }`}
          >
            <ShoppingBag className="w-5 h-5 text-purple-500 mb-2" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Orders</span>
            <h3 className={`text-xl font-extrabold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{metrics?.totalOrders || 0}</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("users")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-slate-900 border-slate-800 hover:border-indigo-500" 
                : "bg-white border-slate-200 hover:border-indigo-500 shadow-sm"
            }`}
          >
            <Users className="w-5 h-5 text-indigo-500 mb-2" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>All Users</span>
            <h3 className={`text-xl font-extrabold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{metrics?.totalUsers || 0}</h3>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab("tickets")} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
              isDark 
                ? "bg-slate-900 border-slate-800 hover:border-amber-500" 
                : "bg-white border-slate-200 hover:border-amber-500 shadow-sm"
            }`}
          >
            <HelpCircle className="w-5 h-5 text-amber-500 mb-2" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Open Tickets</span>
            <h3 className="text-xl font-extrabold text-amber-500 mt-0.5">{metrics?.openTicketsCount || 0}</h3>
          </motion.div>
        </div>

        {/* TABS */}
        <div className={`flex items-center gap-3 border-b pb-4 mb-6 overflow-x-auto no-scrollbar ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}>
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "stores" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            🏪 Vendor Stores ({adminData?.stores?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "users" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            👥 Users Directory ({adminData?.users?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "orders" 
                ? "bg-purple-600 text-white shadow-sm" 
                : isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            📦 Recent Orders ({adminData?.recentOrders?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "tickets" 
                ? "bg-amber-600 text-white shadow-sm" 
                : isDark ? "bg-slate-900 text-slate-400 hover:bg-slate-800" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            🎫 Support Tickets ({adminData?.tickets?.length || 0})
          </button>
        </div>

        {/* STORES TAB */}
        {activeTab === "stores" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold ${
                  isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Store Name</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Total Orders</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                  {adminData?.stores?.map((st: any) => (
                    <tr key={st.id} className={isDark ? "hover:bg-slate-800/50 transition" : "hover:bg-slate-50 transition"}>
                      <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                          {st.name ? st.name[0]?.toUpperCase() : "S"}
                        </div>
                        {st.name || "Unnamed Store"}
                      </td>
                      <td className={`p-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{st.user?.email || "No email"}</td>
                      <td className={`p-4 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{st._count?.products || 0}</td>
                      <td className={`p-4 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{st._count?.orders || 0}</td>
                      <td className="p-4 font-bold text-amber-500">★ {st.rating}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStoreStatus(st.id, st.isOpen)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all active:scale-95 border ${
                            st.isOpen
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                              : "bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900"
                          }`}
                          title="Click to toggle store live status"
                        >
                          {st.isOpen ? "✓ ACTIVE & LIVE" : "✕ SUSPENDED / OFF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB WITH DELETE USER ACTION */}
        {activeTab === "users" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold ${
                  isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">System Role</th>
                    <th className="p-4">Associated Store</th>
                    <th className="p-4">Orders Placed</th>
                    <th className="p-4">Manage & Delete</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                  {adminData?.users?.map((u: any) => (
                    <tr key={u.id} className={isDark ? "hover:bg-slate-800/50 transition" : "hover:bg-slate-50 transition"}>
                      <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center border border-indigo-500/30">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        {u.name || "Campus Student"}
                      </td>
                      <td className={`p-4 font-mono ${isDark ? "text-slate-300" : "text-slate-600"}`}>{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === "ADMIN" 
                            ? "bg-purple-950 text-purple-300 border border-purple-800" 
                            : u.role === "VENDOR" 
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                            : "bg-slate-800 text-slate-300"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className={`p-4 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {u.store ? (
                          <Link href={`/vendor/${u.store.id}`} className="text-emerald-500 hover:underline inline-flex items-center gap-1">
                            {u.store.name} <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className={isDark ? "text-slate-500" : "text-slate-400"}>None (Student)</span>
                        )}
                      </td>
                      <td className={`p-4 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{u._count?.orders || 0}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={roleUpdating === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className={`text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border ${
                              isDark ? "bg-slate-950 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                            }`}
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="VENDOR">VENDOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          {/* DELETE USER BUTTON */}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold ${
                  isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Vendor Store</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                  {adminData?.recentOrders?.map((ord: any) => (
                    <tr key={ord.id} className={isDark ? "hover:bg-slate-800/50 transition" : "hover:bg-slate-50 transition"}>
                      <td className={`p-4 font-mono font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                        {ord.id ? `#${ord.id.slice(-6).toUpperCase()}` : "#ORDER"}
                      </td>
                      <td className={`p-4 ${isDark ? "text-white" : "text-slate-900"}`}>{ord.user?.name || ord.user?.email || "Student"}</td>
                      <td className={`p-4 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{ord.store?.name || "Campus Store"}</td>
                      <td className={`p-4 font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>₦{ord.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === "DELIVERED" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === "tickets" && (
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider font-extrabold ${
                  isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  <tr>
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Subject & Description</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Resolution Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                  {adminData?.tickets?.map((t: any) => (
                    <tr key={t.id} className={isDark ? "hover:bg-slate-800/50 transition" : "hover:bg-slate-50 transition"}>
                      <td className={`p-4 font-mono font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                        {t.id ? `#${t.id.slice(-6).toUpperCase()}` : "#TICKET"}
                      </td>
                      <td className="p-4">
                        <div className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t.subject}</div>
                        <div className={`text-[11px] truncate max-w-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.description}</div>
                      </td>
                      <td className={`p-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{t.user?.email || "Student"}</td>
                      <td className={`p-4 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.orderId ? `#${t.orderId.slice(-6).toUpperCase()}` : "General"}</td>
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
                          className={`text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border ${
                            isDark ? "bg-slate-950 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
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
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
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

              <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Are you sure you want to delete user <strong className={isDark ? "text-white" : "text-slate-900"}>"{userToDelete.name || userToDelete.email}"</strong>? 
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
                    isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
