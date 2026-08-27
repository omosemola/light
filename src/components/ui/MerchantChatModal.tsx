"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Image as ImageIcon, Phone, ShieldCheck, CheckCheck, Store } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { getConversationMessages, saveChatMessage } from "@/actions/chat";

export interface MerchantChatVendor {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  category?: string;
}

interface MerchantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: MerchantChatVendor;
  initialProductContext?: string;
  orderId?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "merchant";
  text: string;
  image?: string;
  timestamp: string;
}

const QUICK_PRESETS = [
  "Is this item in stock right now?",
  "How long will delivery to my hostel take?",
  "Can I request extra cutlery/sauce?",
];

const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Silent fallback
  }
};

export function MerchantChatModal({
  isOpen,
  onClose,
  vendor,
  initialProductContext,
  orderId,
}: MerchantChatModalProps) {
  const { profile } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevVendorMsgCountRef = useRef<number>(0);

  const fetchLiveMessages = useCallback(async () => {
    if (!vendor?.id) return;
    try {
      const res = await getConversationMessages(vendor.id, profile?.email);
      if (res.success && res.messages) {
        const formatted: ChatMessage[] = res.messages.map((m) => ({
          id: m.id,
          sender: m.senderType === "VENDOR" ? "merchant" : "user",
          text: m.text,
          image: m.image || undefined,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));

        const vendorMsgs = formatted.filter((m) => m.sender === "merchant").length;
        if (prevVendorMsgCountRef.current > 0 && vendorMsgs > prevVendorMsgCountRef.current) {
          playNotificationChime();
        }
        prevVendorMsgCountRef.current = vendorMsgs;

        if (formatted.length > 0) {
          setMessages(formatted);
        } else {
          // Default initial welcome message
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const initialMsgs: ChatMessage[] = [
            {
              id: "m-welcome",
              sender: "merchant",
              text: `Hello there! 👋 Welcome to ${vendor.name}. How can we assist you with your campus order today?`,
              timestamp: nowStr,
            },
          ];
          if (initialProductContext) {
            initialMsgs.push({
              id: "m-context",
              sender: "user",
              text: `Hi! I have a question about "${initialProductContext}".`,
              timestamp: nowStr,
            });
          }
          setMessages(initialMsgs);
        }
      }
    } catch (err) {
      console.error("Error loading chat conversation:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [vendor?.id, vendor?.name, profile?.email, initialProductContext]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingHistory(true);
      fetchLiveMessages();

      const pollInterval = setInterval(() => {
        fetchLiveMessages();
      }, 3500);

      return () => clearInterval(pollInterval);
    }
  }, [isOpen, fetchLiveMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text && !selectedImage) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: text,
      image: selectedImage || undefined,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    const imgToSend = selectedImage;
    setSelectedImage(null);
    setIsSending(true);

    try {
      const res = await saveChatMessage({
        storeId: vendor.id,
        senderType: "STUDENT",
        senderName: profile.name || "Campus Student",
        senderEmail: profile.email || undefined,
        text: text,
        image: imgToSend || undefined,
        orderId: orderId,
      });

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? {
                  id: res.message!.id,
                  sender: "user",
                  text: res.message!.text,
                  image: res.message!.image || undefined,
                  timestamp: new Date(res.message!.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Error saving message to database:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* MODAL CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#121214] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col h-[620px] max-h-[90vh] z-10"
        >
          {/* MODAL HEADER */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#121214] flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <Image
                  src={vendor.avatar || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80"}
                  alt={vendor.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100">
                    {vendor.name}
                  </h3>
                  <ShieldCheck size={14} className="text-emerald-500" />
                </div>
                <p className="text-[11px] text-[#71717A] dark:text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Live Merchant Chat</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="p-2 rounded-xl text-[#71717A] hover:text-[#312E81] dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Call Store Owner"
                >
                  <Phone size={18} />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#71717A] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFAF7] dark:bg-[#0A0A0C]">
            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#312E81] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Connecting to store chat...</p>
              </div>
            ) : (
              <>
                <div className="text-center my-2">
                  <span className="text-[10px] bg-slate-200/60 dark:bg-zinc-800 text-[#71717A] dark:text-zinc-400 px-3 py-1 rounded-full font-medium">
                    Verified Campus Merchant Conversation
                  </span>
                </div>

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        msg.sender === "user"
                          ? "bg-[#312E81] text-white rounded-br-xs font-medium"
                          : "bg-white dark:bg-zinc-800/90 text-[#18181B] dark:text-zinc-100 rounded-bl-xs border border-slate-200/80 dark:border-zinc-700/80"
                      }`}
                    >
                      {msg.image && (
                        <div className="relative w-48 h-32 rounded-xl overflow-hidden mb-2 border border-black/10">
                          <Image src={msg.image} alt="Attachment" fill unoptimized className="object-cover" />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap font-body">{msg.text}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#A1A1AA] dark:text-zinc-500 px-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === "user" && <CheckCheck size={12} className="text-indigo-400" />}
                    </div>
                  </motion.div>
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT PRESETS */}
          <div className="px-3 py-2 bg-white dark:bg-[#121214] border-t border-slate-100 dark:border-zinc-800/80 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset)}
                className="whitespace-nowrap text-[11px] font-heading font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-[#312E81] dark:hover:text-indigo-300 text-[#71717A] dark:text-zinc-300 px-3 py-1.5 rounded-full transition-all border border-slate-200/60 dark:border-zinc-700 cursor-pointer shrink-0"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* IMAGE PREVIEW DRAWER */}
          {selectedImage && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 flex items-center justify-between border-t border-slate-200 dark:border-zinc-700 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                  <Image src={selectedImage} alt="Attachment preview" fill unoptimized className="object-cover" />
                </div>
                <span className="text-xs font-medium text-[#18181B] dark:text-zinc-200">Image attached</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-red-500 hover:underline cursor-pointer font-bold"
              >
                Remove
              </button>
            </div>
          )}

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#121214] border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-[#71717A] hover:text-[#312E81] dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Attach photo/menu item"
            >
              <ImageIcon size={19} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${vendor.name}...`}
              className="flex-1 px-4 py-2.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-medium text-[#18181B] dark:text-zinc-100 focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || isSending}
              className="p-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
