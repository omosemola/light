"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, 
  ClipboardList, 
  MapPin, 
  Bell, 
  HelpCircle, 
  Star, 
  Settings, 
  LogOut, 
  Award, 
  ShoppingBag, 
  Heart, 
  Sun, 
  Moon 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Modal } from "@/components/ui/Modal";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logoutUser, hasSeenOnboarding } = useUserStore();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!hasSeenOnboarding) {
      router.push("/welcome");
    }
  }, [hasSeenOnboarding, router]);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    logoutUser();
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore NextAuth errors
    }
    window.location.href = "/welcome";
  };

  const menuItems = [
    { icon: MapPin, label: "Saved Locations & Hostels", href: "/profile/locations", supportText: profile.hostel },
    { icon: ClipboardList, label: "Order History", href: "/orders", supportText: "14 Recent Orders" },
    { icon: Heart, label: "Favorite Vendors", href: "/profile/favorites", supportText: `${profile.savedStoresCount} Stores` },
    { icon: Bell, label: "Notifications & Alerts", href: "/profile/notifications", badge: "2 New" },
    { icon: Star, label: "My Reviews & Ratings", href: "/profile/reviews" },
    { icon: HelpCircle, label: "Help & Campus Support", href: "/support" },
    { icon: Settings, label: "Security & Account Settings", href: "/profile/settings" },
  ];

  const userAvatar = profile.name === "Visitor" ? "/visitor-avatar.png" : (profile.avatar || "/visitor-avatar.png");

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* PREMIUM PROFILE HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] dark:bg-zinc-900 text-white px-5 pt-10 pb-12 rounded-b-[36px] shadow-md overflow-hidden border-b border-indigo-950 dark:border-zinc-800"
      >
        {/* Subtle Ambient Background Accent */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#312E81] dark:bg-indigo-900/40 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FBBF24] rounded-full blur-3xl opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white">
              My Profile
            </h1>
            
            {/* THEME SWITCH BUTTON */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3.5"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-300" />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4.5">
            {/* UNCHANGEABLE PROFILE AVATAR CONTAINER */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#FBBF24] p-1 shadow-lg shrink-0 bg-white/10 overflow-hidden">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image 
                  src={userAvatar} 
                  alt={profile.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-white">
                {profile.name}
              </h2>
              {profile.email ? (
                <p className="text-white font-body font-normal text-xs md:text-sm opacity-90">
                  {profile.email}
                </p>
              ) : null}
              <span className="inline-block bg-white/10 text-white border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                📍 {profile.hostel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QUICK STATS WIDGETS */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full -mt-6 z-20 space-y-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          <Link href="/orders" className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mb-1">
              <ShoppingBag size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">14</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Orders</span>
          </Link>

          <Link href="/profile/favorites" className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center hover:border-amber-200 dark:hover:border-amber-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400 flex items-center justify-center mb-1">
              <Heart size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">{profile.savedStoresCount}</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Saved Stores</span>
          </Link>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Award size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">{profile.points}</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Campus Pts</span>
          </div>
        </motion.div>

        {/* MENU OPTIONS CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60"
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link 
                key={i} 
                href={item.href}
                className="flex items-center p-4.5 hover:bg-[#F4F3FF]/50 dark:hover:bg-zinc-800/50 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mr-4 group-hover:bg-[#312E81] dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100 block">
                    {item.label}
                  </span>
                  {item.supportText && (
                    <span className="text-xs font-body font-normal text-[#71717A] dark:text-zinc-400">
                      {item.supportText}
                    </span>
                  )}
                </div>

                {item.badge && (
                  <span className="text-xs font-body font-extrabold text-[#312E81] bg-[#FBBF24] px-2.5 py-0.5 rounded-full mr-3 shadow-sm">
                    {item.badge}
                  </span>
                )}
                
                <ChevronRight size={18} className="text-[#71717A] dark:text-zinc-500 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </motion.div>

        {/* LOGOUT BUTTON */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center p-4.5 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-red-100 dark:border-red-950/60 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all text-red-600 dark:text-red-400 font-body font-semibold text-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mr-4">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-heading font-bold">Log Out Account</span>
          <ChevronRight size={18} className="text-red-400" />
        </motion.button>

      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out Account?"
      >
        <div className="space-y-4 font-body text-[#18181B] dark:text-zinc-100">
          <p className="text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed">
            Are you sure you want to log out of your Light Marketplace account? You will need to log back in to manage your saved items and track orders.
          </p>
          <div className="flex flex-col gap-3 pt-2 font-semibold text-sm">
            <button
              onClick={handleLogout}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Yes, Log Out
            </button>
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="w-full h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 rounded-full active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
