"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  MessageSquare, 
  Plus, 
  Ticket, 
  Phone, 
  Mail, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ShoppingBag,
  ExternalLink,
  X,
  Sparkles,
  Search,
  MessageCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { createLiveSupportTicket, getLiveUserSupportTickets, getLiveUserOrdersForSupport } from "@/actions/support";
import { useUserStore } from "@/lib/userStore";

interface LiveTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  orderId?: string | null;
  order?: {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  } | null;
}

interface UserOrderOption {
  id: string;
  totalAmount: number;
  status: string;
  storeName: string;
  createdAt: string;
}

const FAQS = [
  {
    q: "How fast is delivery to student hostels?",
    a: "Orders from verified campus kitchens like Mama Cass are prepared hot and delivered to your hostel porter's lodge or gate within 15–25 minutes.",
  },
  {
    q: "What should I do if an item or drink is missing from my order?",
    a: "Open a support ticket under 'Order Issue' selecting your specific Order ID, or message our direct WhatsApp support desk immediately. Our campus reps will resolve or replace it promptly.",
  },
  {
    q: "How do refunds and failed payments work?",
    a: "If your bank is debited but an order is marked unpaid, Paystack will automatically reverse it within 24 hours. For manual reversal assistance, open a ticket with your transaction reference.",
  },
  {
    q: "Can I change my delivery hostel or phone number after placing an order?",
    a: "If your order has not been dispatched yet, call Mama Cass directly via the storefront phone number or message campus support immediately.",
  },
  {
    q: "Are Mama Cass meals freshly prepared daily?",
    a: "Yes! All dishes (Smoky Jollof, Fried Rice, Peppered Chicken, Egusi & Pounded Yam, Asun) are prepared in small batches each morning on campus to guarantee fresh flavor.",
  },
];

export default function SupportPage() {
  const router = useRouter();
  const { profile } = useUserStore();

  const [activeTab, setActiveTab] = useState<"active" | "closed" | "faqs">("active");
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<LiveTicket | null>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order Issue");
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  
  const [ticketsList, setTicketsList] = useState<LiveTicket[]>([]);
  const [userOrders, setUserOrders] = useState<UserOrderOption[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Load live support tickets & orders from database
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoadingTickets(true);
      try {
        const [ticketsRes, ordersRes] = await Promise.all([
          getLiveUserSupportTickets(profile.email),
          getLiveUserOrdersForSupport(profile.email),
        ]);

        if (active) {
          if (ticketsRes.success && ticketsRes.tickets) {
            setTicketsList(ticketsRes.tickets as LiveTicket[]);
          }
          if (ordersRes.success && ordersRes.orders) {
            setUserOrders(ordersRes.orders as UserOrderOption[]);
          }
        }
      } catch (err) {
        console.error("Error loading support tickets:", err);
      } finally {
        if (active) setLoadingTickets(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [profile.email]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);

    try {
      const res = await createLiveSupportTicket({
        userEmail: profile.email || "student@campuslightson.com",
        userName: profile.name || "Campus Student",
        subject: subject.trim(),
        category,
        message: message.trim(),
        orderId: selectedOrderId || undefined,
      });

      if (res.success && res.ticket) {
        const newTicket: LiveTicket = {
          id: res.ticket.id,
          subject: res.ticket.subject,
          category: res.ticket.category,
          message: res.ticket.message,
          status: res.ticket.status as any,
          createdAt: res.ticket.createdAt ? new Date(res.ticket.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: res.ticket.updatedAt ? new Date(res.ticket.updatedAt).toISOString() : new Date().toISOString(),
          orderId: res.ticket.orderId,
          order: selectedOrderId
            ? {
                id: selectedOrderId,
                totalAmount: userOrders.find((o) => o.id === selectedOrderId)?.totalAmount || 0,
                status: userOrders.find((o) => o.id === selectedOrderId)?.status || "CONFIRMED",
                createdAt: new Date().toISOString(),
              }
            : null,
        };

        setTicketsList((prev) => [newTicket, ...prev]);
        setToastMessage("Support ticket successfully submitted to live database!");
        setShowModal(false);
        setSubject("");
        setMessage("");
        setSelectedOrderId("");
        setActiveTab("active");
        setTimeout(() => setToastMessage(""), 4000);
      } else {
        setToastMessage(res.error || "Failed to submit ticket. Please try again.");
        setTimeout(() => setToastMessage(""), 4000);
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      setToastMessage("An error occurred while submitting. Please check your connection.");
      setTimeout(() => setToastMessage(""), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const activeTickets = ticketsList.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  );
  const closedTickets = ticketsList.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  );

  const displayedTickets = activeTab === "active" ? activeTickets : closedTickets;

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const formatTicketDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hr" : "hrs"} ago`;
      if (diffDays === 1) return "Yesterday";
      return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] pb-[100px] md:pb-20 text-[#18181B] dark:text-zinc-100 font-body">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl border border-indigo-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STICKY HEADER */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 flex items-center justify-center -ml-2 text-[#312E81] dark:text-indigo-400 active:scale-95 transition-transform rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label="Go Back"
          >
            <ChevronLeft size={26} />
          </button>
          <div>
            <h1 className="text-xl font-heading font-black text-[#18181B] dark:text-zinc-100">
              Help & Support
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Live Database Support Desk • Campus Care
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>New Ticket</span>
        </button>
      </div>

      <div className="px-5 mt-5 max-w-2xl mx-auto w-full space-y-6">
        {/* EMERGENCY CAMPUS HOTLINE CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://wa.me/2348123459900?text=Hello%20Campus%20Support,%20I%20need%20assistance%20with%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center gap-3.5 hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Instant Chat
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                WhatsApp Desk
              </p>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">Fast 5-min reply</span>
            </div>
          </a>

          <a
            href="tel:+2348123459900"
            className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-2xl flex items-center gap-3.5 hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#312E81] dark:bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Phone size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                Direct Call
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                Campus Helpline
              </p>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">+234 812 345 9900</span>
            </div>
          </a>
        </div>

        {/* HERO CREATE TICKET CTA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-indigo-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[11px] mb-2 border border-amber-400/30">
                <Sparkles size={12} />
                24/7 Student Assistance
              </span>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
                Have an Issue with an Order?
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-sm">
                Submit a ticket directly to the administration database. Our team investigates delays, missing items, or refunds.
              </p>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-all shadow-lg shrink-0"
            >
              <Plus size={18} />
              <span>Create New Ticket</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div>
          <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl mb-4 border border-slate-200/80 dark:border-zinc-800">
            <button 
              onClick={() => setActiveTab("active")}
              className={clsx(
                "flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5",
                activeTab === "active" 
                  ? "bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
              )}
            >
              <Clock size={14} />
              <span>Active Tickets ({activeTickets.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab("closed")}
              className={clsx(
                "flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5",
                activeTab === "closed" 
                  ? "bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
              )}
            >
              <CheckCircle2 size={14} />
              <span>Resolved ({closedTickets.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab("faqs")}
              className={clsx(
                "flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5",
                activeTab === "faqs" 
                  ? "bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
              )}
            >
              <HelpCircle size={14} />
              <span>FAQs</span>
            </button>
          </div>

          {/* TICKET LIST CONTENT */}
          {activeTab !== "faqs" ? (
            <div className="space-y-3">
              {loadingTickets ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 animate-pulse flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 dark:bg-zinc-800/60 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedTickets.length > 0 ? (
                displayedTickets.map((ticket) => {
                  const isClosed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
                  return (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xs flex items-start gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer active:scale-[0.99] group"
                    >
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                        isClosed 
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-[#312E81] dark:text-indigo-400"
                      )}>
                        <Ticket size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-[#18181B] dark:text-zinc-100 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {ticket.subject}
                          </h4>
                          <span className="text-[11px] font-medium text-slate-400 shrink-0">
                            {formatTicketDate(ticket.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mb-2.5">
                          {ticket.message}
                        </p>

                        <div className="flex items-center flex-wrap gap-2 text-[11px]">
                          <span className="font-mono font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            #{ticket.id.slice(-6).toUpperCase()}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[#312E81] dark:text-indigo-300 font-bold">
                            {ticket.category}
                          </span>

                          {ticket.orderId && (
                            <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-zinc-700/60">
                              <ShoppingBag size={11} />
                              <span>Order #{ticket.orderId.slice(-4).toUpperCase()}</span>
                            </span>
                          )}

                          <span className={clsx(
                            "ml-auto font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider",
                            ticket.status === "OPEN" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                            ticket.status === "IN_PROGRESS" && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                            (ticket.status === "RESOLVED" || ticket.status === "CLOSED") && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          )}>
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                    No {activeTab === "active" ? "active" : "resolved"} tickets found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1 mb-4">
                    {activeTab === "active" 
                      ? "You do not have any pending inquiries. Everything looks clear!" 
                      : "No closed tickets recorded on your account yet."}
                  </p>
                  {activeTab === "active" && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-[#312E81] text-white rounded-xl text-xs font-bold hover:bg-[#1E1B4B] transition"
                    >
                      Submit a New Ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* FAQS ACCORDION */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search campus FAQs (e.g. delivery, refunds, Mama Cass)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div 
                        key={idx}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/90 dark:border-zinc-800 overflow-hidden transition"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-3 text-slate-900 dark:text-zinc-100"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown size={16} className={clsx("transition-transform shrink-0 text-slate-400", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/60 leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-6 text-xs text-slate-500">No matching questions found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-heading font-bold text-[#18181B] dark:text-zinc-100">
                  Submit Support Ticket
                </h3>
                <p className="text-[11px] text-slate-500">Logged to administrator database</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                >
                  <option value="Order Issue">Order Issue (Missing item, cold food)</option>
                  <option value="Delivery Delay">Delivery Delay (Over 30 mins)</option>
                  <option value="Payment / Refund">Payment / Paystack Refund</option>
                  <option value="Mama Cass Kitchen">Mama Cass Menu & Portion Inquiry</option>
                  <option value="Account / Profile">Account & Hostel Settings</option>
                  <option value="General Inquiry">General Campus Inquiry</option>
                </select>
              </div>

              {/* OPTIONAL LINKED ORDER DROPDOWN */}
              {userOrders.length > 0 && (
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">
                    Link to Recent Order (Optional)
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  >
                    <option value="">No specific order linked</option>
                    {userOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(-6).toUpperCase()} • ₦{o.totalAmount.toLocaleString()} ({o.storeName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Order delivered without plantain dodo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-zinc-300">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide complete details (e.g. hostel room number, payment reference, exact issue)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {submitting ? "Submitting to Live DB..." : "Submit Support Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET DETAILS MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    #{selectedTicket.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={clsx(
                    "font-black px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider",
                    selectedTicket.status === "OPEN" && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                    selectedTicket.status === "IN_PROGRESS" && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                    (selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  )}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-base font-heading font-bold text-slate-900 dark:text-zinc-100">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl space-y-1.5 border border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Category:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{selectedTicket.category}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Created:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">{formatTicketDate(selectedTicket.createdAt)}</span>
                </div>
                {selectedTicket.orderId && (
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                    <span>Linked Order:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      #{selectedTicket.orderId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Inquiry Details</span>
                <div className="bg-slate-50 dark:bg-zinc-800/80 p-3.5 rounded-2xl text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-zinc-800">
                  {selectedTicket.message}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl text-[11px] text-indigo-950 dark:text-indigo-300 flex items-start gap-2 border border-indigo-200/60 dark:border-indigo-800/40">
                <AlertCircle size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <span>
                  Admin updates to this ticket are updated in real-time. For emergency assistance, contact the campus WhatsApp desk.
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`https://wa.me/2348123459900?text=Hello,%20I%20am%20following%20up%20on%20support%20ticket%20%23${selectedTicket.id.slice(-6).toUpperCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle size={15} />
                <span>Follow-up on WhatsApp</span>
              </a>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
