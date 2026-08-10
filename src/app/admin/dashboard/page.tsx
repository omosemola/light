"use client";

import { useEffect, useState } from "react";
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
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getAdminDashboardData, updateSupportTicketStatus } from "@/actions/admin";
import { TicketStatus } from "@prisma/client";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"stores" | "orders" | "tickets">("stores");
  const [ticketUpdating, setTicketUpdating] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    const res = await getAdminDashboardData();
    if (res.success) {
      setAdminData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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
    }
    setTicketUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Loading Platform Admin Dashboard...</h2>
        <p className="text-sm text-slate-400 mt-1">Connecting to Supabase Database</p>
      </div>
    );
  }

  const metrics = adminData?.metrics || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* TOP BAR */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Lightson Super Admin Portal</h1>
              <p className="text-xs text-slate-400">Campus Marketplace Management & Analytics</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            Go to App Home
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* CLICKABLE METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <motion.div onClick={() => setActiveTab("orders")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.98]">
            <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-400 uppercase">Gross Sales (GMV)</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">₦{metrics?.totalGMV?.toLocaleString() || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setActiveTab("stores")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-blue-500 transition-all active:scale-[0.98]">
            <Store className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-400 uppercase">Active Vendors</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{metrics?.totalStores || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setActiveTab("orders")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500 transition-all active:scale-[0.98]">
            <ShoppingBag className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-400 uppercase">Total Orders</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{metrics?.totalOrders || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setActiveTab("stores")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-indigo-500 transition-all active:scale-[0.98]">
            <Users className="w-5 h-5 text-indigo-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-400 uppercase">Total Users</span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{metrics?.totalUsers || 0}</h3>
          </motion.div>

          <motion.div onClick={() => setActiveTab("tickets")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-amber-500 transition-all active:scale-[0.98]">
            <HelpCircle className="w-5 h-5 text-amber-400 mb-2" />
            <span className="text-[11px] font-medium text-slate-400 uppercase">Open Tickets</span>
            <h3 className="text-xl font-extrabold text-amber-400 mt-0.5">{metrics?.openTicketsCount || 0}</h3>
          </motion.div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "stores" ? "bg-emerald-500 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Vendor Stores ({adminData?.stores?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "orders" ? "bg-emerald-500 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Recent Orders ({adminData?.recentOrders?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "tickets" ? "bg-emerald-500 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Support Tickets ({adminData?.tickets?.length || 0})
          </button>
        </div>

        {/* STORES TAB */}
        {activeTab === "stores" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="p-4">Store Name</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Total Orders</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminData?.stores?.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                          {st.name[0]}
                        </div>
                        {st.name}
                      </td>
                      <td className="p-4 text-slate-300">{st.user?.email || "No email"}</td>
                      <td className="p-4 font-semibold text-slate-300">{st._count?.products || 0}</td>
                      <td className="p-4 font-semibold text-slate-300">{st._count?.orders || 0}</td>
                      <td className="p-4 font-bold text-amber-400">★ {st.rating}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.isOpen ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"}`}>
                          {st.isOpen ? "ACTIVE / OPEN" : "CLOSED"}
                        </span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Vendor Store</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminData?.recentOrders?.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono text-slate-400">#ORD-{ord.id.slice(-6).toUpperCase()}</td>
                      <td className="p-4 font-bold text-white">{ord.user?.name || "Student"}</td>
                      <td className="p-4 text-emerald-400 font-semibold">{ord.store?.name}</td>
                      <td className="p-4 font-bold text-white">₦{ord.totalAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-amber-950 text-amber-300 uppercase">
                          {ord.status.replace(/_/g, " ")}
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
          <div className="space-y-4">
            {adminData?.tickets?.map((t: any) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${t.status === "OPEN" ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300"}`}>
                      {t.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">• {t.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.subject}</h4>
                  <p className="text-xs text-slate-300 mt-1">"{t.message}"</p>
                  <p className="text-[11px] text-slate-500 mt-2">By {t.user?.name || "Student"} ({t.user?.email})</p>
                </div>

                {t.status === "OPEN" && (
                  <button
                    onClick={() => handleResolveTicket(t.id, "RESOLVED")}
                    disabled={ticketUpdating === t.id}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition whitespace-nowrap"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
