"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  ClipboardList, 
  MapPin, 
  Bell, 
  HelpCircle, 
  Star, 
  Settings, 
  LogOut, 
  Camera, 
  Award, 
  ShoppingBag, 
  Heart, 
  Sun, 
  Moon, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Building 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Modal } from "@/components/ui/Modal";

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
];

export default function ProfilePage() {
  const { profile, updateProfile } = useUserStore();
  const { isDark, toggleTheme } = useTheme();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editHostel, setEditHostel] = useState(profile.hostel);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditHostel(profile.hostel);
    setEditPhone(profile.phone);
    setEditAvatar(profile.avatar);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      email: editEmail,
      hostel: editHostel,
      phone: editPhone,
      avatar: editAvatar,
    });
    setIsEditModalOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
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

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* SAVED SUCCESS TOAST */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 text-xs font-bold font-heading"
          >
            <CheckCircle2 size={16} />
            <span>Profile details updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            
            <div className="flex items-center gap-2">
              {/* THEME SWITCH BUTTON */}
              <button
                onClick={toggleTheme}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-300" />}
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>

              {/* EDIT INFO BUTTON */}
              <button
                onClick={handleOpenEdit}
                className="text-xs font-body font-bold bg-[#FBBF24] hover:bg-amber-400 text-[#312E81] px-4 py-2 rounded-full shadow-sm transition-all active:scale-95"
              >
                Edit Info
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4.5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#FBBF24] p-1 shadow-lg shrink-0 bg-white/10">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image 
                  src={profile.avatar} 
                  alt={profile.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <button 
                onClick={handleOpenEdit}
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#312E81] dark:bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md active:scale-90 transition-transform"
                aria-label="Change profile photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-white">
                {profile.name}
              </h2>
              <p className="text-slate-300 font-body font-normal text-xs md:text-sm">
                {profile.email}
              </p>
              <span className="inline-block bg-white/10 text-amber-300 border border-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
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

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Info"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 font-body text-[#18181B] dark:text-zinc-100">
          
          {/* Avatar selector */}
          <div className="space-y-2">
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block">
              Choose Profile Picture
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {AVATAR_OPTIONS.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setEditAvatar(img)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-all ${
                    editAvatar === img ? "border-[#312E81] dark:border-indigo-400 scale-110 shadow-md" : "border-slate-200 dark:border-zinc-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="Avatar" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 flex items-center gap-1.5">
              <User size={14} /> Full Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
              placeholder="Your Name"
            />
          </div>

          {/* Student Email */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 flex items-center gap-1.5">
              <Mail size={14} /> Student Email
            </label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
              placeholder="student@uni.edu"
            />
          </div>

          {/* Hostel / Residence */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 flex items-center gap-1.5">
              <Building size={14} /> Hostel / Hall of Residence
            </label>
            <input
              type="text"
              required
              value={editHostel}
              onChange={(e) => setEditHostel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
              placeholder="e.g. Mellanby Hall"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 flex items-center gap-1.5">
              <Phone size={14} /> Phone Number
            </label>
            <input
              type="tel"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500"
              placeholder="+234 800 000 0000"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>

        </form>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out Account?"
      >
        <div className="space-y-4 font-body text-[#18181B] dark:text-zinc-100">
          <p className="text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed">
            Are you sure you want to log out of your Campus Marketplace account? You will need to log back in to manage your saved items and track orders.
          </p>
          <div className="flex flex-col gap-3 pt-2 font-semibold text-sm">
            <button
              onClick={() => {
                setIsLogoutModalOpen(false);
                signOut({ callbackUrl: "/" });
              }}
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
