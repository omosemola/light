"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  User,
  CheckCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  getStoreChatThreads,
  getConversationMessages,
  saveChatMessage,
  markThreadAsRead,
  ChatThreadItem,
  ChatMessageRecord,
} from "@/actions/chat";
import { uploadImageToCloud } from "@/lib/uploadClient";

interface VendorChatInboxProps {
  storeId: string;
  storeName: string;
  isDark: boolean;
  isService?: boolean;
  onUnreadCountChange?: (count: number) => void;
  onNewMessageSound?: () => void;
}

const VENDOR_QUICK_REPLIES = [
  "Hello! Yes, I am currently available to handle your request.",
  "Sure! Please share your hostel/hall and room number.",
  "Your request is confirmed and currently being processed.",
  "Please share any extra details or a photo of what you need.",
];

export function VendorChatInbox({
  storeId,
  storeName,
  isDark,
  isService = false,
  onUnreadCountChange,
  onNewMessageSound,
}: VendorChatInboxProps) {
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadTotalRef = useRef<number>(0);

  const loadThreads = useCallback(
    async (silent = false) => {
      if (!storeId) return;
      if (!silent) setLoadingThreads(true);
      try {
        const res = await getStoreChatThreads(storeId);
        if (res.success && Array.isArray(res.threads)) {
          setThreads(res.threads);
          const totalUnread = res.threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
          onUnreadCountChange?.(totalUnread);

          if (silent && totalUnread > prevUnreadTotalRef.current) {
            onNewMessageSound?.();
          }
          prevUnreadTotalRef.current = totalUnread;

          if (!selectedEmail && res.threads.length > 0) {
            setSelectedEmail(res.threads[0].studentEmail);
          }
        }
      } catch (err) {
        console.error("Failed to load vendor chat threads:", err);
      } finally {
        if (!silent) setLoadingThreads(false);
      }
    },
    [storeId, selectedEmail, onUnreadCountChange, onNewMessageSound]
  );

  const loadConversation = useCallback(
    async (studentEmail: string, silent = false) => {
      if (!storeId || !studentEmail) return;
      if (!silent) setLoadingMessages(true);
      try {
        const res = await getConversationMessages(storeId, studentEmail);
        if (res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        }
        await markThreadAsRead(storeId, studentEmail);
        setThreads((prev) =>
          prev.map((t) => (t.studentEmail === studentEmail ? { ...t, unreadCount: 0 } : t))
        );
      } catch (err) {
        console.error("Failed to load conversation messages:", err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    loadThreads(false);
  }, [loadThreads]);

  useEffect(() => {
    if (selectedEmail) {
      loadConversation(selectedEmail, false);
    }
  }, [selectedEmail, loadConversation]);

  // Background polling every 8 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      loadThreads(true);
      if (selectedEmail) {
        loadConversation(selectedEmail, true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [loadThreads, loadConversation, selectedEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendReply = async (customText?: string) => {
    if (!selectedEmail) return;
    const text = (customText !== undefined ? customText : replyText).trim();
    if (!text && !selectedImage) return;

    const imgToSend = selectedImage;
    if (customText === undefined) setReplyText("");
    setSelectedImage(null);
    setIsSending(true);

    // Optimistic message
    const tempId = `temp-vendor-${Date.now()}`;
    const optimisticMsg: ChatMessageRecord = {
      id: tempId,
      text,
      image: imgToSend || null,
      senderType: "VENDOR",
      senderName: storeName,
      senderEmail: selectedEmail,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      let finalImgUrl = imgToSend || undefined;
      if (imgToSend && imgToSend.startsWith("data:image/")) {
        finalImgUrl = await uploadImageToCloud(imgToSend, "lightson_marketplace/chat");
      }

      const res = await saveChatMessage({
        storeId,
        senderType: "VENDOR",
        senderName: storeName,
        senderEmail: selectedEmail,
        text,
        image: finalImgUrl,
      });

      if (res.success && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message! : m)));
        loadThreads(true);
      }
    } catch (err) {
      console.error("Failed to send vendor reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const activeThread = threads.find((t) => t.studentEmail === selectedEmail) || null;

  const formatStudentLabel = (email: string) => {
    if (!email) return "Campus Student";
    if (email.startsWith("guest_") || email.endsWith("@campus.lightson") || email.startsWith("anon-")) {
      return "Campus Student (Direct Chat)";
    }
    return email;
  };

  return (
    <div
      className={`rounded-3xl border overflow-hidden shadow-xs ${
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
      }`}
    >
      {/* INBOX HEADER */}
      <div
        className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? "border-zinc-800 bg-zinc-900" : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#312E81] text-amber-300 flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isService ? "Service Booking & Student Chat Inbox" : "Student Messages & Inquiries Inbox"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Live In-App Chat
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Reply directly to students inquiring about your {isService ? "services, rates, and availability" : "products and orders"}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            loadThreads(false);
            if (selectedEmail) loadConversation(selectedEmail, false);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 border transition cursor-pointer ${
            isDark
              ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <RefreshCw size={13} className={loadingThreads ? "animate-spin" : ""} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* INBOX BODY (2-COLUMN LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
        {/* LEFT COLUMN: THREAD LIST */}
        <div
          className={`md:col-span-4 border-b md:border-b-0 md:border-r flex flex-col ${
            isDark ? "border-zinc-800 bg-zinc-950/40" : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className={`p-3 border-b text-[11px] font-heading font-extrabold uppercase tracking-wider ${
            isDark ? "border-zinc-800 text-zinc-400" : "border-slate-200 text-slate-500"
          }`}>
            Conversations ({threads.length})
          </div>

          {loadingThreads ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw size={20} className="animate-spin mx-auto text-indigo-500" />
              <p>Loading student conversations...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center space-y-2 my-auto">
              <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-zinc-700" />
              <p className="text-xs font-heading font-bold text-slate-700 dark:text-zinc-300">
                No student messages yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                When a student clicks &ldquo;Chat Now&rdquo; on your profile, their message will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-zinc-800/70 overflow-y-auto max-h-[500px]">
              {threads.map((thread) => {
                const isSelected = thread.studentEmail === selectedEmail;
                return (
                  <button
                    key={thread.studentEmail}
                    type="button"
                    onClick={() => setSelectedEmail(thread.studentEmail)}
                    className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? isDark
                          ? "bg-indigo-950/50 border-l-4 border-l-amber-400"
                          : "bg-indigo-50/90 border-l-4 border-l-[#312E81]"
                        : isDark
                        ? "hover:bg-zinc-900"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#312E81] text-white flex items-center justify-center font-heading font-extrabold text-xs shrink-0">
                      {(thread.studentName || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-heading font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {thread.studentName || "Campus Student"}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                        {formatStudentLabel(thread.studentEmail)}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-slate-600 dark:text-zinc-300 truncate">
                          {thread.lastMessage}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-heading font-black text-[10px] shrink-0">
                            {thread.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION */}
        <div className="md:col-span-8 flex flex-col h-[540px]">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare size={40} className="text-slate-300 dark:text-zinc-700 mb-2" />
              <h4 className="font-heading font-extrabold text-sm text-slate-700 dark:text-zinc-300">
                Select a conversation to view & reply
              </h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm">
                All student chats are end-to-end inside Lightson Marketplace with instant email and dashboard alerts.
              </p>
            </div>
          ) : (
            <>
              {/* THREAD HEADER */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isDark ? "border-zinc-800 bg-zinc-900" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#312E81] text-amber-300 flex items-center justify-center font-heading font-extrabold text-xs">
                    {(activeThread.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {activeThread.studentName || "Campus Student"}
                      </h4>
                      <ShieldCheck size={13} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {formatStudentLabel(activeThread.studentEmail)}
                    </p>
                  </div>
                </div>
              </div>

              {/* MESSAGES LIST */}
              <div
                className={`flex-1 p-4 overflow-y-auto space-y-3 ${
                  isDark ? "bg-zinc-950" : "bg-[#FAFAF7]"
                }`}
              >
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No messages in this thread yet.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isVendor = msg.senderType === "VENDOR";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isVendor ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isVendor
                              ? "bg-[#312E81] text-white rounded-br-xs font-medium"
                              : isDark
                              ? "bg-zinc-800 text-zinc-100 rounded-bl-xs border border-zinc-700"
                              : "bg-white text-slate-900 rounded-bl-xs border border-slate-200 shadow-2xs"
                          }`}
                        >
                          {msg.image && (
                            <div className="relative w-48 h-32 rounded-xl overflow-hidden mb-2 border border-black/10">
                              <Image
                                src={msg.image}
                                alt="Chat attachment"
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isVendor && <CheckCheck size={12} className="text-indigo-400" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK REPLIES BAR */}
              <div
                className={`px-3 py-2 border-t overflow-x-auto flex gap-2 no-scrollbar shrink-0 ${
                  isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-100"
                }`}
              >
                {VENDOR_QUICK_REPLIES.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendReply(preset)}
                    className={`whitespace-nowrap text-[11px] font-heading font-semibold px-3 py-1 rounded-full border transition cursor-pointer shrink-0 ${
                      isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-[#312E81]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* IMAGE ATTACHMENT PREVIEW */}
              {selectedImage && (
                <div
                  className={`px-4 py-2 border-t flex items-center justify-between ${
                    isDark ? "bg-zinc-800 border-zinc-700" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                      <Image src={selectedImage} alt="Preview" fill unoptimized className="object-cover" />
                    </div>
                    <span className="text-xs font-medium">Photo ready to send</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* REPLY INPUT FORM */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className={`p-3 border-t flex items-center gap-2 ${
                  isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200"
                }`}
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
                  className={`p-2.5 rounded-xl transition cursor-pointer ${
                    isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-slate-500 hover:bg-slate-100"
                  }`}
                  title="Attach photo"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeThread.studentName || "Student"}...`}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-xs font-medium border focus:outline-none ${
                    isDark
                      ? "bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500"
                      : "bg-[#FAFAF7] border-slate-200 text-slate-900 focus:border-[#312E81]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={(!replyText.trim() && !selectedImage) || isSending}
                  className="px-4 py-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white rounded-xl font-heading font-extrabold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
                >
                  <Send size={15} />
                  <span>Reply</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
