"use client";

import { use, useState } from "react";
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
  Lock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";

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

  // NOTIFICATIONS STATE
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Order Delivered! 🚀", desc: "Your Jollof Rice from Mama Cass has arrived at Mellanby Lodge.", time: "10 mins ago", read: false },
    { id: 2, title: "New Campus Promo 🍕", desc: "Get 20% off all pizza orders today with code CAMPUS20.", time: "2 hours ago", read: false },
    { id: 3, title: "Welcome to Campus Hub!", desc: "Thanks for creating an account. Enjoy 100 free Campus Points.", time: "1 day ago", read: true },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

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
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Recent Alerts
              </h2>
              <button
                onClick={markAllRead}
                className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline"
              >
                Mark all as read
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    n.read 
                      ? "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800" 
                      : "bg-[#F4F3FF]/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#312E81] dark:bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={18} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100">{n.title}</h3>
                      <span className="text-[11px] text-[#71717A] dark:text-zinc-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-zinc-300 leading-relaxed">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
