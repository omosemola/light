"use client";

import { useState, useRef } from "react";
import { ChevronLeft, MessageSquare, Plus, Ticket, Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { createLiveSupportTicket } from "@/actions/support";
import { useUserStore } from "@/lib/userStore";

export default function SupportPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order Issue");
  const [message, setMessage] = useState("");
  const [ticketAttachment, setTicketAttachment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  const handleTicketFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [ticketsList, setTicketsList] = useState([
    { id: "TK-9021", subject: "Missing Item in Order", status: "In Progress", date: "2 hrs ago", type: "active" },
    { id: "TK-8832", subject: "Payment Failed", status: "Resolved", date: "2 days ago", type: "closed" },
  ]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitting(true);

    const res = await createLiveSupportTicket({
      userEmail: profile.email,
      userName: profile.name,
      subject,
      category,
      message,
    });

    if (res.success && res.ticket) {
      setTicketsList((prev) => [
        {
          id: `TK-${res.ticket.id.slice(-4).toUpperCase()}`,
          subject: res.ticket.subject,
          status: "OPEN",
          date: "Just now",
          type: "active",
        },
        ...prev,
      ]);
      setToastMessage("Support ticket submitted live!");
      setShowModal(false);
      setSubject("");
      setMessage("");
      setTimeout(() => setToastMessage(""), 3000);
    }
    setSubmitting(false);
  };

  const filteredTickets = ticketsList.filter((t) => (activeTab === "active" ? t.type === "active" || t.status === "OPEN" : t.type === "closed" || t.status === "RESOLVED"));

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] pb-[100px] md:pb-20 text-[#18181B] dark:text-zinc-100 font-body">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center px-5 pt-6 pb-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-40">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center -ml-2 mr-2 text-[#312E81] dark:text-indigo-400 active:scale-95 transition-transform"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-heading font-bold text-[#18181B] dark:text-zinc-100">
          Help & Support
        </h1>
      </div>

      <div className="px-5 mt-6 max-w-2xl mx-auto w-full">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-[#312E81] dark:bg-indigo-600 text-white p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform shadow-xl"
        >
          <div className="text-left">
            <h3 className="font-heading font-bold text-lg">Create New Ticket</h3>
            <p className="text-white/80 text-sm mt-1">Get instant help with an order or issue</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={24} />
          </div>
        </button>

        <div className="mt-8">
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-full mb-6">
            <button 
              onClick={() => setActiveTab("active")}
              className={clsx(
                "flex-1 py-2.5 rounded-full font-bold text-sm transition-colors",
                activeTab === "active" ? "bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 shadow-sm" : "text-slate-500"
              )}
            >
              Active Tickets
            </button>
            <button 
              onClick={() => setActiveTab("closed")}
              className={clsx(
                "flex-1 py-2.5 rounded-full font-bold text-sm transition-colors",
                activeTab === "closed" ? "bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 shadow-sm" : "text-slate-500"
              )}
            >
              Closed
            </button>
          </div>

          <div className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center text-[#312E81] dark:text-indigo-400 shrink-0">
                    <Ticket size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[#18181B] dark:text-zinc-100 text-sm">{ticket.subject}</h4>
                      <span className="text-xs font-medium text-slate-400">{ticket.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">#{ticket.id}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        ticket.status === "OPEN" || ticket.status === "In Progress" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={40} className="text-slate-300 dark:text-zinc-700 mb-3" />
                <p className="text-slate-500 font-medium">No tickets found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#18181B] dark:text-zinc-100">Submit Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Delay in food delivery to Mellanby"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="Order Issue">Order Issue</option>
                  <option value="Delivery Delay">Delivery Delay</option>
                  <option value="Payment / Refund">Payment / Refund</option>
                  <option value="Account / Profile">Account / Profile</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Message Details</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Attach Photo / Screenshot (Optional)</label>
                <input
                  type="file"
                  ref={ticketFileInputRef}
                  onChange={handleTicketFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => ticketFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#312E81] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Select Screenshot/Photo from Phone</span>
                </button>

                {ticketAttachment && (
                  <div className="relative mt-2 w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Image src={ticketAttachment} alt="Attachment Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setTicketAttachment(null)}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#312E81] hover:bg-[#1E1B4B] text-white font-bold transition shadow-md"
                >
                  {submitting ? "Submitting..." : "Submit Ticket to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
