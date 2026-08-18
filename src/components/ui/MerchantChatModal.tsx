"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Image as ImageIcon, Phone, ShieldCheck, CheckCheck, Store } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { sendChatMessageNotification } from "@/actions/chat";

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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio autoplay fail silent
  }
};

export function MerchantChatModal({
  isOpen,
  onClose,
  vendor,
  initialProductContext,
}: MerchantChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome & product context messages
  useEffect(() => {
    if (isOpen) {
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

        // Trigger automated merchant response to product question
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: `m-resp-${Date.now()}`,
                sender: "merchant",
                text: `Great choice! "${initialProductContext}" is fresh and currently available for instant hostel delivery! 🚀`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          }, 1200);
        }, 600);
      }

      setMessages(initialMsgs);
    }
  }, [isOpen, vendor.name, initialProductContext]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const { profile } = useUserStore();

  const handleSendMessage = (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text && !selectedImage) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text,
      image: selectedImage || undefined,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSelectedImage(null);

    // Send email notification to Vendor
    sendChatMessageNotification({
      senderType: "student",
      senderName: profile.name || "Campus Student",
      senderEmail: profile.email,
      storeId: vendor.id,
      storeName: vendor.name,
      messageText: text,
    }).catch((err) => console.error("Chat email notification error:", err));

    // Simulate Merchant Typing & Auto Reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);

        let merchantReply = `Thank you for your message! Our kitchen/store team at ${vendor.name} is working on your request.`;
        const lower = text.toLowerCase();

        if (lower.includes("stock") || lower.includes("available")) {
          merchantReply = `Yes! All listed items are currently in stock and ready for immediate delivery. 👍`;
        } else if (lower.includes("delivery") || lower.includes("time") || lower.includes("hostel")) {
          merchantReply = `Our store delivery team delivers directly to your hostel block/room in approximately 15-20 minutes after order placement! 🛵`;
        } else if (lower.includes("custom") || lower.includes("sauce") || lower.includes("cutlery") || lower.includes("extra")) {
          merchantReply = `Noted! Please specify your preferences in the order notes during checkout, and we will package it accordingly. 🎁`;
        }

        // Trigger sound chime & notification
        playNotificationChime();

        // Send email notification to Student
        sendChatMessageNotification({
          senderType: "vendor",
          senderName: vendor.name,
          storeId: vendor.id,
          storeName: vendor.name,
          recipientEmail: profile.email,
          messageText: merchantReply,
        }).catch((err) => console.error("Chat reply email notification error:", err));

        setMessages((prev) => [
          ...prev,
          {
            id: `m-reply-${Date.now()}`,
            sender: "merchant",
            text: merchantReply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 1400);
    }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Hidden Image Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Chat Bottom Sheet Drawer Container */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-lg h-[80vh] md:h-[650px] bg-[#FAFAF7] dark:bg-zinc-900 rounded-t-[32px] md:rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden z-10 font-body text-[#18181B] dark:text-zinc-100"
      >
        
        {/* CHAT HEADER */}
        <div className="bg-white dark:bg-zinc-950 p-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl border border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 shadow-xs bg-white">
              <Image src={vendor.avatar} alt={vendor.name} fill className="object-cover" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                  {vendor.name}
                </h3>
                <span className="text-emerald-500 font-extrabold text-[10px] bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#71717A] dark:text-zinc-400">
                Verified Campus Merchant • Usually replies &lt; 5m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="w-9 h-9 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center hover:bg-[#312E81] hover:text-white transition-colors"
                title="Call Shop"
              >
                <Phone size={16} />
              </a>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MESSAGES SCROLLABLE FEED */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar">
          
          {/* SECURITY & TRUST BADGE */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-center space-y-1 text-xs">
            <div className="flex items-center justify-center gap-1.5 font-heading font-extrabold text-[#312E81] dark:text-indigo-300">
              <ShieldCheck size={15} /> Verified Merchant Direct Chat
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              Messages are monitored for campus student safety & order quality assurance.
            </p>
          </div>

          {/* CHAT MESSAGES */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 relative mt-1 border border-slate-200 dark:border-zinc-700">
                    <Image src={vendor.avatar} alt={vendor.name} fill className="object-cover" />
                  </div>
                )}

                <div className={`max-w-[80%] space-y-1.5 ${isUser ? "items-end text-right" : "items-start"}`}>
                  
                  {/* IMAGE ATTACHMENT PREVIEW */}
                  {msg.image && (
                    <div className="relative w-48 h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm">
                      <Image src={msg.image} alt="Uploaded attachment" fill className="object-cover" />
                    </div>
                  )}

                  {/* TEXT BUBBLE */}
                  {msg.text && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed font-body shadow-xs ${
                        isUser
                          ? "bg-[#312E81] text-white rounded-br-xs"
                          : "bg-white dark:bg-zinc-800 text-[#18181B] dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-700/80 rounded-bl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  <div className={`flex items-center gap-1 text-[10px] text-[#71717A] dark:text-zinc-500 font-semibold px-1 ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck size={12} className="text-indigo-400" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-zinc-400 italic font-body pt-1">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 relative border border-slate-200 dark:border-zinc-700">
                <Image src={vendor.avatar} alt={vendor.name} fill className="object-cover" />
              </div>
              <div className="bg-white dark:bg-zinc-800 px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-zinc-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK PRESET CHIPS */}
        <div className="px-4 py-2 bg-white/60 dark:bg-zinc-950/60 border-t border-slate-100 dark:border-zinc-800/80 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-[#F4F3FF] dark:hover:bg-zinc-700 text-[#312E81] dark:text-indigo-300 font-body font-semibold text-[11px] whitespace-nowrap rounded-full border border-indigo-100 dark:border-zinc-700 shadow-2xs active:scale-95 transition-all shrink-0"
            >
              💬 {preset}
            </button>
          ))}
        </div>

        {/* ATTACHMENT PREVIEW THUMBNAIL BEFORE SENDING */}
        {selectedImage && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 flex items-center justify-between shrink-0 border-t border-slate-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-zinc-600">
                <Image src={selectedImage} alt="Attachment" fill className="object-cover" />
              </div>
              <span className="text-xs font-semibold text-[#18181B] dark:text-zinc-200">Image attached</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* CHAT INPUT FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3.5 bg-white dark:bg-zinc-950 border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 hover:bg-[#312E81] hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Attach image from phone"
          >
            <ImageIcon size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${vendor.name}...`}
            className="flex-1 h-11 px-4 rounded-2xl bg-[#FAFAF7] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#312E81] dark:focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !selectedImage}
            className="w-11 h-11 rounded-2xl bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 shrink-0"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </form>

      </motion.div>
    </div>
  );
}
