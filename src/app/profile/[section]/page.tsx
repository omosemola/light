"use client";

import { use, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  MapPin, 
  Heart, 
  Bell, 
  Star, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Store,
  ChevronRight,
  Monitor,
  Lock,
  Package,
  Sparkles,
  Tag,
  X,
  CheckCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useNotificationStore } from "@/lib/notificationStore";

export default function ProfileSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  const { isDark, setTheme, theme } = useTheme();

  // LOCATIONS STATE
  const [locations, setLocations] = useState([
    { id: 1, title: "Main Hostel (Mellanby)", address: "Room B12, Mellanby Hall, Main Campus", isDefault: true },
    { id: 2, title: "Faculty of Technology", address: "Tech Lecture Theater, Block C", isDefault: false },
    { id: 3, title: "University Library Lodge", address: "KDL Quiet Zone Entrance", isDefault: false },
  ]);
  const [newLocTitle, setNewLocTitle] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocTitle || !newLocAddress) return;
    setLocations([
      ...locations,
      { id: Date.now(), title: newLocTitle, address: newLocAddress, isDefault: false },
    ]);
    setNewLocTitle("");
    setNewLocAddress("");
  };

  const handleDeleteLocation = (id: number) => {
    setLocations(locations.filter((l) => l.id !== id));
  };

  // FAVORITE VENDORS STATE
  const [favorites, setFavorites] = useState([
    { id: "v1", name: "Mama Cass Jollof", rating: 4.9, category: "Food & Meals", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80" },
    { id: "v2", name: "Fresh Squeeze Juice", rating: 4.8, category: "Drinks & Smoothies", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80" },
    { id: "v4", name: "Pizza Hub Express", rating: 4.9, category: "Fast Food", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
  ]);

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id));
    updateProfile({ savedStoresCount: Math.max(0, favorites.length - 1) });
  };

  // NOTIFICATIONS STATE (SYNCED WITH USER ACCOUNT & DATABASE)
  const {
    notifications: allNotifications,
    syncWithDb,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllForUser,
    ensureWelcomeNotification
  } = useNotificationStore();

  useEffect(() => {
    if (section === "notifications" && profile.email) {
      syncWithDb(profile.email);
    }
  }, [section, profile.email, syncWithDb]);

  const [notifFilter, setNotifFilter] = useState<"all" | "order" | "promo" | "account">("all");

  const activeEmailNormalized = profile.email?.trim().toLowerCase() || "visitor@light.app";

  const userNotifications = allNotifications.filter((n) => {
    const notifEmail = n.userEmail?.trim().toLowerCase() || "";
    const isForUser = !profile.email ? notifEmail === "visitor@light.app" : notifEmail === activeEmailNormalized;
    if (!isForUser) return false;
    if (notifFilter === "all") return true;
    return n.type === notifFilter;
  });

  const unreadCount = allNotifications.filter((n) => {
    const notifEmail = n.userEmail?.trim().toLowerCase() || "";
    const isForUser = !profile.email ? notifEmail === "visitor@light.app" : notifEmail === activeEmailNormalized;
    return isForUser && !n.read;
  }).length;

  // REVIEWS STATE
  const [myReviews, setMyReviews] = useState([
    { id: "r1", vendor: "Mama Cass", item: "Jollof Rice & Chicken", rating: 5, date: "Aug 2, 2026", comment: "Portion size was huge and chicken was piping hot! Delivered fast to Mellanby." },
    { id: "r2", vendor: "Fresh Squeeze", item: "Cold Pressed Orange Juice", rating: 5, date: "Jul 28, 2026", comment: "100% natural, super refreshing after afternoon GST lectures." },
  ]);

  const handleDeleteReview = (id: string) => {
    setMyReviews(myReviews.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* HEADER BAR */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-[#18181B] dark:text-zinc-100 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100 capitalize">
          {section === "locations" && "Saved Locations"}
          {section === "favorites" && "Favorite Vendors"}
          {section === "notifications" && "Notifications & Alerts"}
          {section === "reviews" && "My Reviews & Ratings"}
          {section === "settings" && "Account & Appearance Settings"}
        </h1>

        <div className="w-10" />
      </div>

      <div className="max-w-3xl mx-auto w-full px-5 py-6 space-y-6">

        {/* SECTION: LOCATIONS */}
        {section === "locations" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="text-[#312E81] dark:text-indigo-400" size={20} />
                Add New Delivery Location
              </h2>

              <form onSubmit={handleAddLocation} className="space-y-3">
                <input
                  type="text"
                  placeholder="Location Name (e.g. Mellanby Room B12)"
                  value={newLocTitle}
                  onChange={(e) => setNewLocTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#FAFAF7] dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Full Address / Landmark"
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-[#FAFAF7] dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Save Location
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#71717A] dark:text-zinc-400">Your Saved Locations</h3>
              {locations.map((loc) => (
                <div key={loc.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100">{loc.title}</span>
                      {loc.isDefault && (
                        <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-[#312E81] dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400">{loc.address}</p>
                  </div>

                  {!loc.isDefault && (
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: FAVORITES */}
        {section === "favorites" && (
          <div className="space-y-4">
            <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              Saved Campus Vendors ({favorites.length})
            </h2>

            {favorites.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6">
                <Store size={40} className="mx-auto text-slate-400 mb-2" />
                <p className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-200">No favorite vendors saved yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-zinc-800">
                        <Image src={fav.image} alt={fav.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100">{fav.name}</h3>
                        <span className="text-xs text-[#71717A] dark:text-zinc-400">{fav.category}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold">{fav.rating}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: NOTIFICATIONS */}
        {section === "notifications" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <div>
                <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                  <Bell size={18} className="text-[#312E81] dark:text-indigo-400" />
                  Notifications & Alerts
                </h2>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"} for your account` : "All alerts caught up"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead(profile.email)}
                    className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                {userNotifications.length > 0 && (
                  <button
                    onClick={() => clearAllForUser(profile.email)}
                    className="text-xs font-heading font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "all", label: "All Alerts" },
                { id: "order", label: "Orders 📦" },
                { id: "promo", label: "Promos 🎁" },
                { id: "account", label: "Account 👤" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setNotifFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    notifFilter === tab.id
                      ? "bg-[#312E81] text-white shadow-xs"
                      : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* NOTIFICATIONS LIST */}
            {userNotifications.length > 0 ? (
              <div className="space-y-3">
                {userNotifications.map((n) => {
                  return (
                    <motion.div 
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 relative group ${
                        n.read 
                          ? "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800/80 opacity-90 hover:opacity-100" 
                          : "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs"
                      }`}
                    >
                      {/* TYPE ICON CONTAINER */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        n.type === "order"
                          ? "bg-emerald-500 text-white"
                          : n.type === "promo"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-[#312E81] text-white"
                      }`}>
                        {n.type === "order" ? (
                          <Package size={18} />
                        ) : n.type === "promo" ? (
                          <Sparkles size={18} />
                        ) : (
                          <ShieldCheck size={18} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <h3 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 truncate">
                              {n.title}
                            </h3>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-[#71717A] dark:text-zinc-400 shrink-0">
                            {n.time}
                          </span>
                        </div>

                        <p className="text-xs text-[#71717A] dark:text-zinc-300 leading-relaxed font-body">
                          {n.desc}
                        </p>

                        {n.link && (
                          <div className="pt-1.5">
                            <Link
                              href={n.link}
                              onClick={() => markAsRead(n.id)}
                              className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View details</span>
                              <ChevronRight size={13} />
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS: MARK READ / DELETE */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all"
                            title="Mark as read"
                          >
                            <CheckCheck size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(n.id)}
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-all"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F4F3FF] dark:bg-indigo-950/60 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Bell size={24} />
                </div>
                <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                  No {notifFilter !== "all" ? notifFilter : ""} notifications
                </h3>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-xs mx-auto font-body">
                  When you place orders or receive campus alerts, they will show up here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION: REVIEWS */}
        {section === "reviews" && (
          <div className="space-y-4">
            <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
              Reviews You Posted ({myReviews.length})
            </h2>

            <div className="space-y-3">
              {myReviews.map((rev) => (
                <div key={rev.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 block">{rev.vendor}</span>
                      <span className="text-xs text-[#71717A] dark:text-zinc-400">{rev.item} • {rev.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold">{rev.rating}.0</span>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-[#18181B] dark:text-zinc-300 italic bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: SETTINGS */}
        {section === "settings" && (
          <div className="space-y-6">
            
            {/* THEME PREFERENCE CARD */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Sun className="text-amber-500" size={20} />
                Appearance & Theme Mode
              </h2>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === "light"
                      ? "bg-[#F4F3FF] border-[#312E81] text-[#312E81] font-bold shadow-sm"
                      : "bg-[#FAFAF7] dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#71717A] dark:text-zinc-300"
                  }`}
                >
                  <Sun size={24} className="text-amber-500" />
                  <span className="text-xs font-heading">Light</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === "dark"
                      ? "bg-indigo-950 border-indigo-500 text-indigo-200 font-bold shadow-sm"
                      : "bg-[#FAFAF7] dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#71717A] dark:text-zinc-300"
                  }`}
                >
                  <Moon size={24} className="text-indigo-400" />
                  <span className="text-xs font-heading">Dark</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === "system"
                      ? "bg-[#F4F3FF] dark:bg-indigo-950 border-[#312E81] dark:border-indigo-500 text-[#312E81] dark:text-indigo-200 font-bold shadow-sm"
                      : "bg-[#FAFAF7] dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-[#71717A] dark:text-zinc-300"
                  }`}
                >
                  <Monitor size={24} className="text-purple-500" />
                  <span className="text-xs font-heading">Auto System</span>
                </button>
              </div>
            </div>

            {/* SECURITY CARD */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <Lock className="text-emerald-600" size={20} />
                Security & Verification
              </h2>

              <div className="space-y-3 text-xs text-[#71717A] dark:text-zinc-400">
                <div className="flex items-center justify-between p-3 bg-[#FAFAF7] dark:bg-zinc-800/60 rounded-xl">
                  <span>Student ID Verification</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">Verified</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#FAFAF7] dark:bg-zinc-800/60 rounded-xl">
                  <span>Two-Factor Authentication</span>
                  <span className="text-[#312E81] dark:text-indigo-400 font-bold">Enabled</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
