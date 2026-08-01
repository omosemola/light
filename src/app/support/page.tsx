"use client";

import { useState } from "react";
import { ChevronLeft, MessageSquare, Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function SupportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const tickets = [
    { id: "TK-9021", subject: "Missing Item in Order", status: "In Progress", date: "2 hrs ago", type: "active" },
    { id: "TK-8832", subject: "Payment Failed", status: "Resolved", date: "2 days ago", type: "closed" },
  ];

  const filteredTickets = tickets.filter(t => t.type === activeTab);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background-main)] pb-[100px] md:pb-20">
      <div className="flex items-center px-5 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-40">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center -ml-2 mr-2 text-[var(--color-primary)] active:scale-95 transition-transform"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-heading font-bold text-[var(--color-primary)]">
          Help & Support
        </h1>
      </div>

      <div className="px-5 mt-6">
        <button className="w-full bg-[var(--color-primary)] text-white p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform shadow-[var(--shadow-bento)]">
          <div className="text-left">
            <h3 className="font-heading font-bold text-lg">Create New Ticket</h3>
            <p className="text-white/80 text-sm mt-1">Get help with an order or issue</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={24} />
          </div>
        </button>

        <div className="mt-8">
          <div className="flex bg-gray-100 p-1 rounded-full mb-6">
            <button 
              onClick={() => setActiveTab("active")}
              className={clsx(
                "flex-1 py-2.5 rounded-full font-bold text-sm transition-colors",
                activeTab === "active" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500"
              )}
            >
              Active Tickets
            </button>
            <button 
              onClick={() => setActiveTab("closed")}
              className={clsx(
                "flex-1 py-2.5 rounded-full font-bold text-sm transition-colors",
                activeTab === "closed" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500"
              )}
            >
              Closed
            </button>
          </div>

          <div className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="bg-white p-5 rounded-3xl shadow-[var(--shadow-bento)] flex items-start gap-4 active:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                    <Ticket size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[var(--color-text-primary)]">{ticket.subject}</h4>
                      <span className="text-xs font-medium text-gray-400">{ticket.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{ticket.id}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        ticket.status === "In Progress" ? "bg-[var(--color-secondary)]/20 text-yellow-700" : "bg-green-100 text-green-700"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No tickets found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
